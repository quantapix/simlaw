import { asyncSched, stamper, Scheduler } from "./scheduler.js"
import { Note, observeNote } from "./note.js"
import {
  Observable,
  innerFrom,
  EMPTY,
  from,
  timer,
  combineLatestInit,
  zip,
} from "./observable.js"
import {
  Subject,
  AsyncSubject,
  BehaviorSubject,
  ReplaySubject,
} from "./subject.js"
import { Subscriber, SafeSubscriber } from "./subscriber.js"
import { Subscription } from "./subscription.js"
import * as qu from "./utils.js"
import type * as qt from "./types.js"

export interface Operator<_, T> {
  call(x: Subscriber<T>, src: any): qt.Teardown
}

export class OpSubscriber<T> extends Subscriber<T> {
  constructor(
    s: Subscriber<any>,
    onNext?: (x: T) => void,
    onError?: (x: any) => void,
    onDone?: () => void,
    private onFinalize?: () => void,
    private shouldUnsubscribe?: () => boolean
  ) {
    super(s)
    this._next = onNext
      ? function (this: OpSubscriber<T>, x: T) {
          try {
            onNext(x)
          } catch (e) {
            s.error(e)
          }
        }
      : super._next
    this._error = onError
      ? function (this: OpSubscriber<T>, x: any) {
          try {
            onError(x)
          } catch (e) {
            s.error(e)
          } finally {
            this.unsubscribe()
          }
        }
      : super._error
    this._done = onDone
      ? function (this: OpSubscriber<T>) {
          try {
            onDone()
          } catch (e) {
            s.error(e)
          } finally {
            this.unsubscribe()
          }
        }
      : super._done
  }
  override unsubscribe() {
    if (!this.shouldUnsubscribe || this.shouldUnsubscribe()) {
      const { closed } = this
      super.unsubscribe()
      !closed && this.onFinalize?.()
    }
  }
}

export function operate<T, R>(
  init: (x: Observable<T>, s: Subscriber<R>) => (() => void) | void
): qt.OpFun<T, R> {
  return (o: Observable<T>) => {
    if (qu.hasLift(o)) {
      return o.lift(function (this: Subscriber<R>, x: Observable<T>) {
        try {
          return init(x, this)
        } catch (e) {
          this.error(e)
        }
      })
    }
    throw new TypeError("Unable to lift unknown Observable type")
  }
}

export function audit<T>(f: (x: T) => qt.ObsInput<any>): qt.MonoTypeOp<T> {
  return operate((src, sub) => {
    let has = false
    let last: T | null = null
    let s: Subscriber<any> | null = null
    let done = false
    const end = () => {
      s?.unsubscribe()
      s = null
      if (has) {
        has = false
        const y = last!
        last = null
        sub.next(y)
      }
      done && sub.done()
    }
    const cleanup = () => {
      s = null
      done && sub.done()
    }
    src.subscribe(
      new OpSubscriber(
        sub,
        x => {
          has = true
          last = x
          if (!s) {
            innerFrom(f(x)).subscribe((s = new OpSubscriber(sub, end, cleanup)))
          }
        },
        () => {
          done = true
          ;(!has || !s || s.closed) && sub.done()
        }
      )
    )
  })
}

export function auditTime<T>(
  x: number,
  s: qt.Scheduler = asyncSched
): qt.MonoTypeOp<T> {
  return audit(() => timer(x, s))
}

export function buffer<T>(o: Observable<any>): qt.OpFun<T, T[]> {
  return operate((src, sub) => {
    let xs: T[] = []
    src.subscribe(
      new OpSubscriber(
        sub,
        x => xs.push(x),
        () => {
          sub.next(xs)
          sub.done()
        }
      )
    )
    o.subscribe(
      new OpSubscriber(
        sub,
        () => {
          const xs2 = xs
          xs = []
          sub.next(xs2)
        },
        qu.noop
      )
    )
    return () => {
      xs = null!
    }
  })
}

export function bufferCount<T>(
  size: number,
  every: number | null = null
): qt.OpFun<T, T[]> {
  every = every ?? size
  return operate((src, sub) => {
    let xss: T[][] = []
    let i = 0
    src.subscribe(
      new OpSubscriber(
        sub,
        x => {
          let toEmit: T[][] | null = null
          if (i++ % every! === 0) xss.push([])
          for (const xs of xss) {
            xs.push(x)
            if (size <= xs.length) {
              toEmit = toEmit ?? []
              toEmit.push(xs)
            }
          }
          if (toEmit) {
            for (const xs of toEmit) {
              qu.arrRemove(xss, xs)
              sub.next(xs)
            }
          }
        },
        () => {
          for (const xs of xss) {
            sub.next(xs)
          }
          sub.done()
        },
        undefined,
        () => {
          xss = null!
        }
      )
    )
  })
}

export function bufferTime<T>(
  bufferTimeSpan: number,
  sched?: qt.Scheduler
): qt.OpFun<T, T[]>
export function bufferTime<T>(
  bufferTimeSpan: number,
  bufferCreationInterval: number | null | undefined,
  sched?: qt.Scheduler
): qt.OpFun<T, T[]>
export function bufferTime<T>(
  bufferTimeSpan: number,
  bufferCreationInterval: number | null | undefined,
  maxBufferSize: number,
  sched?: qt.Scheduler
): qt.OpFun<T, T[]>
export function bufferTime<T>(
  bufferTimeSpan: number,
  ...xs: any[]
): qt.OpFun<T, T[]> {
  const sched = Scheduler.pop(xs) ?? asyncSched
  const bufferCreationInterval = (xs[0] as number) ?? null
  const maxBufferSize = (xs[1] as number) || Infinity
  return operate((src, sub) => {
    let bufferRecords: { buffer: T[]; subs: Subscription }[] | null = []
    let restartOnEmit = false
    const emit = (record: { buffer: T[]; subs: Subscription }) => {
      const { buffer, subs } = record
      subs.unsubscribe()
      qu.arrRemove(bufferRecords, record)
      sub.next(buffer)
      restartOnEmit && startBuffer()
    }
    const startBuffer = () => {
      if (bufferRecords) {
        const subs = new Subscription()
        sub.add(subs)
        const buffer: T[] = []
        const record = {
          buffer,
          subs,
        }
        bufferRecords.push(record)
        sched.run(subs, () => emit(record), bufferTimeSpan)
      }
    }
    if (bufferCreationInterval !== null && bufferCreationInterval >= 0) {
      sched.run(sub, startBuffer, bufferCreationInterval, true)
    } else {
      restartOnEmit = true
    }
    startBuffer()
    const bufferTimeSubscriber = new OpSubscriber(
      sub,
      (value: T) => {
        const recordsCopy = bufferRecords!.slice()
        for (const record of recordsCopy) {
          const { buffer } = record
          buffer.push(value)
          maxBufferSize <= buffer.length && emit(record)
        }
      },
      () => {
        while (bufferRecords?.length) {
          sub.next(bufferRecords.shift()!.buffer)
        }
        bufferTimeSubscriber?.unsubscribe()
        sub.done()
        sub.unsubscribe()
      },
      undefined,
      () => (bufferRecords = null)
    )
    src.subscribe(bufferTimeSubscriber)
  })
}

export function bufferToggle<T, R>(
  openings: qt.ObsInput<R>,
  f: (x: R) => qt.ObsInput<any>
): qt.OpFun<T, T[]> {
  return operate((src, sub) => {
    const xss: T[][] = []
    innerFrom(openings).subscribe(
      new OpSubscriber(
        sub,
        x => {
          const xs: T[] = []
          xss.push(xs)
          const s = new Subscription()
          const emit = () => {
            qu.arrRemove(xss, xs)
            sub.next(xs)
            s.unsubscribe()
          }
          s.add(innerFrom(f(x)).subscribe(new OpSubscriber(sub, emit, qu.noop)))
        },
        qu.noop
      )
    )
    src.subscribe(
      new OpSubscriber(
        sub,
        x => {
          for (const xs of xss) {
            xs.push(x)
          }
        },
        () => {
          while (xss.length > 0) {
            sub.next(xss.shift()!)
          }
          sub.done()
        }
      )
    )
  })
}

export function bufferWhen<T>(f: () => qt.ObsInput<any>): qt.OpFun<T, T[]> {
  return operate((src, sub) => {
    let xs: T[] | null = null
    let s: Subscriber<T> | null = null
    const open = () => {
      s?.unsubscribe()
      const xs2 = xs
      xs = []
      xs2 && sub.next(xs2)
      innerFrom(f()).subscribe((s = new OpSubscriber(sub, open, qu.noop)))
    }
    open()
    src.subscribe(
      new OpSubscriber(
        sub,
        x => xs?.push(x),
        () => {
          xs && sub.next(xs)
          sub.done()
        },
        undefined,
        () => (xs = s = null!)
      )
    )
  })
}

export function catchError<T, R extends qt.ObsInput<any>>(
  f: (x: any, caught: Observable<T>) => R
): qt.OpFun<T, T | qt.ObsValueOf<R>>
export function catchError<T, R extends qt.ObsInput<any>>(
  f: (x: any, caught: Observable<T>) => R
): qt.OpFun<T, T | qt.ObsValueOf<R>> {
  return operate((src, sub) => {
    let s: Subscription | null = null
    let done = false
    let y: Observable<qt.ObsValueOf<R>>
    s = src.subscribe(
      new OpSubscriber(
        sub,
        undefined,
        x => {
          y = innerFrom(f(x, catchError(f)(src)))
          if (s) {
            s.unsubscribe()
            s = null
            y.subscribe(sub)
          } else done = true
        },
        undefined
      )
    )
    if (done) {
      s.unsubscribe()
      s = null
      y!.subscribe(sub)
    }
  })
}

export function combineLatest<T, A extends readonly unknown[], R>(
  xs: [...qt.InputTuple<A>],
  f: (...xs: [T, ...A]) => R
): qt.OpFun<T, R>
export function combineLatest<T, A extends readonly unknown[], R>(
  xs: [...qt.InputTuple<A>]
): qt.OpFun<T, [T, ...A]>
export function combineLatest<T, A extends readonly unknown[], R>(
  ...xs: [...qt.InputTuple<A>, (...xs: [T, ...A]) => R]
): qt.OpFun<T, R>
export function combineLatest<T, A extends readonly unknown[], R>(
  ...xs: [...qt.InputTuple<A>]
): qt.OpFun<T, [T, ...A]>
export function combineLatest<T, R>(
  ...xs: (qt.ObsInput<any> | ((...xs: any[]) => R))[]
): qt.OpFun<T, unknown> {
  const sel = qu.popSelector(xs)
  return sel
    ? qu.pipe(
        combineLatest(...(xs as Array<qt.ObsInput<any>>)),
        qu.mapOneOrManyArgs(sel)
      )
    : operate((src, sub) => {
        combineLatestInit([src, ...qu.argsOrArgArray(xs)])(sub)
      })
}

export const combineAll = combineLatestAll

export function combineLatestAll<T>(): qt.OpFun<qt.ObsInput<T>, T[]>
export function combineLatestAll<T>(): qt.OpFun<any, T[]>
export function combineLatestAll<T, R>(
  f: (...xs: T[]) => R
): qt.OpFun<qt.ObsInput<T>, R>
export function combineLatestAll<R>(
  f: (...xs: Array<any>) => R
): qt.OpFun<any, R>
export function combineLatestAll<R>(f?: (...xs: Array<any>) => R) {
  return joinAllInternals(combineLatest, f)
}

export function combineLatestWith<T, R extends readonly unknown[]>(
  ...xs: [...qt.InputTuple<R>]
): qt.OpFun<T, qt.Cons<T, R>> {
  return combineLatest(...xs)
}

export function concat<T, R extends readonly unknown[]>(
  ...xs: [...qt.InputTuple<R>]
): qt.OpFun<T, T | R[number]>
export function concat<T, R extends readonly unknown[]>(
  ...xs: [...qt.InputTuple<R>, qt.Scheduler]
): qt.OpFun<T, T | R[number]>
export function concat<T, R>(...xs: any[]): qt.OpFun<T, R> {
  const sched = Scheduler.pop(xs)
  return operate((src, sub) => {
    concatAll()(from([src, ...xs], sched)).subscribe(sub)
  })
}
export function concatAll<T extends qt.ObsInput<any>>(): qt.OpFun<
  T,
  qt.ObsValueOf<T>
> {
  return mergeAll(1)
}

export function concatMap<T, R extends qt.ObsInput<any>>(
  f: (x: T, i: number) => R
): qt.OpFun<T, qt.ObsValueOf<R>>
export function concatMap<T, R extends qt.ObsInput<any>>(
  f: (x: T, i: number) => R,
  resultSelector: undefined
): qt.OpFun<T, qt.ObsValueOf<R>>
export function concatMap<T, R, O extends qt.ObsInput<any>>(
  project: (value: T, index: number) => O,
  resultSelector: (
    outerValue: T,
    innerValue: qt.ObsValueOf<O>,
    outerIndex: number,
    innerIndex: number
  ) => R
): qt.OpFun<T, R>
export function concatMap<T, R, O extends qt.ObsInput<any>>(
  project: (value: T, index: number) => O,
  resultSelector?: (
    outerValue: T,
    innerValue: qt.ObsValueOf<O>,
    outerIndex: number,
    innerIndex: number
  ) => R
): qt.OpFun<T, qt.ObsValueOf<O> | R> {
  return qu.isFunction(resultSelector)
    ? mergeMap(project, resultSelector, 1)
    : mergeMap(project, 1)
}

export function concatMapTo<O extends qt.ObsInput<unknown>>(
  observable: O
): qt.OpFun<unknown, qt.ObsValueOf<O>>
export function concatMapTo<O extends qt.ObsInput<unknown>>(
  observable: O,
  resultSelector: undefined
): qt.OpFun<unknown, qt.ObsValueOf<O>>
export function concatMapTo<T, R, O extends qt.ObsInput<unknown>>(
  observable: O,
  resultSelector: (
    outerValue: T,
    innerValue: qt.ObsValueOf<O>,
    outerIndex: number,
    innerIndex: number
  ) => R
): qt.OpFun<T, R>
export function concatMapTo<T, R, O extends qt.ObsInput<unknown>>(
  innerObservable: O,
  resultSelector?: (
    outerValue: T,
    innerValue: qt.ObsValueOf<O>,
    outerIndex: number,
    innerIndex: number
  ) => R
): qt.OpFun<T, qt.ObsValueOf<O> | R> {
  return qu.isFunction(resultSelector)
    ? concatMap(() => innerObservable, resultSelector)
    : concatMap(() => innerObservable)
}

export function concatWith<T, A extends readonly unknown[]>(
  ...xs: [...qt.InputTuple<A>]
): qt.OpFun<T, T | A[number]> {
  return concat(...xs)
}

export interface ConnectConfig<T> {
  connector: () => qt.SubjectLike<T>
}
const DEFAULT_CONFIG: ConnectConfig<unknown> = {
  connector: () => new Subject<unknown>(),
}

export function connect<T, O extends qt.ObsInput<unknown>>(
  f: (x: Observable<T>) => O,
  cfg: ConnectConfig<T> = DEFAULT_CONFIG
): qt.OpFun<T, qt.ObsValueOf<O>> {
  const { connector } = cfg
  return operate((src, sub) => {
    const s = connector()
    innerFrom(f(fromSubscribable(s))).subscribe(sub)
    sub.add(src.subscribe(s))
  })
}

export function count<T>(
  f?: (x: T, i: number) => boolean
): qt.OpFun<T, number> {
  return reduce((y, x, i) => (!f || f(x, i) ? y + 1 : y), 0)
}

export function debounce<T>(f: (x: T) => qt.ObsInput<any>): qt.MonoTypeOp<T> {
  return operate((src, sub) => {
    let has = false
    let last: T | null = null
    let s: Subscriber<any> | null = null
    const emit = () => {
      s?.unsubscribe()
      s = null
      if (has) {
        has = false
        const y = last!
        last = null
        sub.next(y)
      }
    }
    src.subscribe(
      new OpSubscriber(
        sub,
        (x: T) => {
          s?.unsubscribe()
          has = true
          last = x
          s = new OpSubscriber(sub, emit, qu.noop)
          innerFrom(f(x)).subscribe(s)
        },
        () => {
          emit()
          sub.done()
        },
        undefined,
        () => {
          last = s = null
        }
      )
    )
  })
}

export function debounceTime<T>(
  due: number,
  sched: qt.Scheduler = asyncSched
): qt.MonoTypeOp<T> {
  return operate((src, sub) => {
    let s: qt.Subscription | null = null
    let last: T | null = null
    let time: number | null = null
    const emit = () => {
      if (s) {
        s.unsubscribe()
        s = null
        const y = last!
        last = null
        sub.next(y)
      }
    }
    function emitWhenIdle(this: qt.SchedulerAction<unknown>) {
      const targetTime = time! + due
      const now = sched.now()
      if (now < targetTime) {
        s = this.schedule(undefined, targetTime - now)
        sub.add(s)
        return
      }
      emit()
    }
    src.subscribe(
      new OpSubscriber(
        sub,
        (x: T) => {
          last = x
          time = sched.now()
          if (!s) {
            s = sched.schedule(emitWhenIdle, due)
            sub.add(s)
          }
        },
        () => {
          emit()
          sub.done()
        },
        undefined,
        () => {
          last = s = null
        }
      )
    )
  })
}

export function defaultIfEmpty<T, R>(v: R): qt.OpFun<T, T | R> {
  return operate((src, sub) => {
    let has = false
    src.subscribe(
      new OpSubscriber(
        sub,
        x => {
          has = true
          sub.next(x)
        },
        () => {
          if (!has) sub.next(v!)
          sub.done()
        }
      )
    )
  })
}

export function delay<T>(
  due: number | Date,
  sched: qt.Scheduler = asyncSched
): qt.MonoTypeOp<T> {
  const y = timer(due, sched)
  return delayWhen(() => y)
}

export function delayWhen<T>(
  delayDurationSelector: (value: T, index: number) => Observable<any>,
  subscriptionDelay: Observable<any>
): qt.MonoTypeOp<T>
export function delayWhen<T>(
  delayDurationSelector: (value: T, index: number) => Observable<any>
): qt.MonoTypeOp<T>
export function delayWhen<T>(
  delayDurationSelector: (value: T, index: number) => Observable<any>,
  subscriptionDelay?: Observable<any>
): qt.MonoTypeOp<T> {
  if (subscriptionDelay) {
    return (src: Observable<T>) =>
      concat(
        subscriptionDelay.pipe(take(1), ignoreElements()),
        src.pipe(delayWhen(delayDurationSelector))
      )
  }
  return mergeMap((value, index) =>
    delayDurationSelector(value, index).pipe(take(1), mapTo(value))
  )
}

export function dematerialize<T extends qt.ObsNote<any>>(): qt.OpFun<
  T,
  qt.ValueFromNote<T>
> {
  return operate((src, sub) => {
    src.subscribe(new OpSubscriber(sub, x => observeNote(x, sub)))
  })
}

export function distinct<T, K>(
  f?: (x: T) => K,
  o?: Observable<any>
): qt.MonoTypeOp<T> {
  return operate((src, sub) => {
    const ks = new Set()
    src.subscribe(
      new OpSubscriber(sub, x => {
        const k = f ? f(x) : x
        if (!ks.has(k)) {
          ks.add(k)
          sub.next(x)
        }
      })
    )
    o?.subscribe(new OpSubscriber(sub, () => ks.clear(), qu.noop))
  })
}

export function distinctUntilChanged<T>(
  comparator?: (previous: T, current: T) => boolean
): qt.MonoTypeOp<T>
export function distinctUntilChanged<T, K>(
  comparator: (previous: K, current: K) => boolean,
  keySelector: (value: T) => K
): qt.MonoTypeOp<T>
export function distinctUntilChanged<T, K>(
  comparator?: (previous: K, current: K) => boolean,
  keySelector: (value: T) => K = qu.identity as (value: T) => K
): qt.MonoTypeOp<T> {
  comparator = comparator ?? defaultCompare
  return operate((src, sub) => {
    let prev: K
    let first = true
    src.subscribe(
      new OpSubscriber(sub, x => {
        const k = keySelector(x)
        if (first || !comparator!(prev, k)) {
          first = false
          prev = k
          sub.next(x)
        }
      })
    )
  })
}

function defaultCompare(a: any, b: any) {
  return a === b
}

export function distinctUntilKeyChanged<T>(key: keyof T): qt.MonoTypeOp<T>
export function distinctUntilKeyChanged<T, K extends keyof T>(
  key: K,
  compare: (x: T[K], y: T[K]) => boolean
): qt.MonoTypeOp<T>
export function distinctUntilKeyChanged<T, K extends keyof T>(
  key: K,
  compare?: (x: T[K], y: T[K]) => boolean
): qt.MonoTypeOp<T> {
  return distinctUntilChanged((x: T, y: T) =>
    compare ? compare(x[key], y[key]) : x[key] === y[key]
  )
}

export function elementAt<T, D = T>(i: number, v?: D): qt.OpFun<T, T | D> {
  if (i < 0) throw new qu.OutOfRangeError()
  const hasDefaultValue = arguments.length >= 2
  return (x: Observable<T>) =>
    x.pipe(
      filter((v, i) => i === i),
      take(1),
      hasDefaultValue
        ? defaultIfEmpty(v!)
        : throwIfEmpty(() => new qu.OutOfRangeError())
    )
}

export function endWith<T>(s: qt.Scheduler): qt.MonoTypeOp<T>
export function endWith<T, A extends unknown[] = T[]>(
  ...xs: [...A, qt.Scheduler]
): qt.OpFun<T, T | qt.ValueFromArray<A>>
export function endWith<T, A extends unknown[] = T[]>(
  ...xs: A
): qt.OpFun<T, T | qt.ValueFromArray<A>>
export function endWith<T>(...xs: Array<T | qt.Scheduler>): qt.MonoTypeOp<T> {
  return (x: Observable<T>) => concat(x, of(...xs)) as Observable<T>
}

export function every<T>(
  predicate: BooleanConstructor
): qt.OpFun<T, Exclude<T, qt.Falsy> extends never ? false : boolean>
export function every<T>(
  predicate: BooleanConstructor,
  thisArg: any
): qt.OpFun<T, Exclude<T, qt.Falsy> extends never ? false : boolean>
export function every<T, A>(
  predicate: (
    this: A,
    value: T,
    index: number,
    source: Observable<T>
  ) => boolean,
  thisArg: A
): qt.OpFun<T, boolean>
export function every<T>(
  predicate: (value: T, index: number, source: Observable<T>) => boolean
): qt.OpFun<T, boolean>
export function every<T>(
  predicate: (value: T, index: number, source: Observable<T>) => boolean,
  thisArg?: any
): qt.OpFun<T, boolean> {
  return operate((src, sub) => {
    let i = 0
    src.subscribe(
      new OpSubscriber(
        sub,
        x => {
          if (!predicate.call(thisArg, x, i++, src)) {
            sub.next(false)
            sub.done()
          }
        },
        () => {
          sub.next(true)
          sub.done()
        }
      )
    )
  })
}

export const exhaust = exhaustAll

export function exhaustAll<O extends qt.ObsInput<any>>(): qt.OpFun<
  O,
  qt.ObsValueOf<O>
> {
  return exhaustMap(qu.identity)
}

export function exhaustMap<T, O extends qt.ObsInput<any>>(
  project: (value: T, index: number) => O
): qt.OpFun<T, qt.ObsValueOf<O>>
export function exhaustMap<T, O extends qt.ObsInput<any>>(
  project: (value: T, index: number) => O,
  resultSelector: undefined
): qt.OpFun<T, qt.ObsValueOf<O>>
export function exhaustMap<T, I, R>(
  project: (value: T, index: number) => qt.ObsInput<I>,
  resultSelector: (
    outerValue: T,
    innerValue: I,
    outerIndex: number,
    innerIndex: number
  ) => R
): qt.OpFun<T, R>
export function exhaustMap<T, R, O extends qt.ObsInput<any>>(
  project: (value: T, index: number) => O,
  resultSelector?: (
    outerValue: T,
    innerValue: qt.ObsValueOf<O>,
    outerIndex: number,
    innerIndex: number
  ) => R
): qt.OpFun<T, qt.ObsValueOf<O> | R> {
  if (resultSelector) {
    return (src: Observable<T>) =>
      src.pipe(
        exhaustMap((a, i) =>
          innerFrom(project(a, i)).pipe(
            map((b: any, ii: any) => resultSelector(a, b, i, ii))
          )
        )
      )
  }
  return operate((src, sub) => {
    let i = 0
    let s: Subscriber<T> | null = null
    let done = false
    src.subscribe(
      new OpSubscriber(
        sub,
        x => {
          if (!s) {
            s = new OpSubscriber(sub, undefined, () => {
              s = null
              done && sub.done()
            })
            innerFrom(project(x, i++)).subscribe(s)
          }
        },
        () => {
          done = true
          !s && sub.done()
        }
      )
    )
  })
}
export function expand<T, O extends qt.ObsInput<unknown>>(
  f: (x: T, i: number) => O,
  concurrent?: number,
  s?: qt.Scheduler
): qt.OpFun<T, qt.ObsValueOf<O>>
export function expand<T, O extends qt.ObsInput<unknown>>(
  f: (x: T, i: number) => O,
  concurrent: number | undefined,
  s: qt.Scheduler
): qt.OpFun<T, qt.ObsValueOf<O>>
export function expand<T, O extends qt.ObsInput<unknown>>(
  f: (x: T, i: number) => O,
  concurrent = Infinity,
  s?: qt.Scheduler
): qt.OpFun<T, qt.ObsValueOf<O>> {
  concurrent = (concurrent || 0) < 1 ? Infinity : concurrent
  return operate((src, sub) =>
    mergeInternals(src, sub, f, concurrent, undefined, true, s)
  )
}
export function filter<T, S extends T, A>(
  predicate: (this: A, value: T, index: number) => value is S,
  thisArg: A
): qt.OpFun<T, S>
export function filter<T, S extends T>(
  predicate: (value: T, index: number) => value is S
): qt.OpFun<T, S>
export function filter<T>(
  predicate: BooleanConstructor
): qt.OpFun<T, qt.TruthyTypesOf<T>>
export function filter<T, A>(
  predicate: (this: A, value: T, index: number) => boolean,
  thisArg: A
): qt.MonoTypeOp<T>
export function filter<T>(
  predicate: (value: T, index: number) => boolean
): qt.MonoTypeOp<T>
export function filter<T>(
  predicate: (value: T, index: number) => boolean,
  thisArg?: any
): qt.MonoTypeOp<T> {
  return operate((src, sub) => {
    let i = 0
    src.subscribe(
      new OpSubscriber(sub, x => predicate.call(thisArg, x, i++) && sub.next(x))
    )
  })
}
export function finalize<T>(callback: () => void): qt.MonoTypeOp<T> {
  return operate((src, sub) => {
    try {
      src.subscribe(sub)
    } finally {
      sub.add(callback)
    }
  })
}
export function find<T>(
  predicate: BooleanConstructor
): qt.OpFun<T, qt.TruthyTypesOf<T>>
export function find<T, S extends T, A>(
  predicate: (
    this: A,
    value: T,
    index: number,
    source: Observable<T>
  ) => value is S,
  thisArg: A
): qt.OpFun<T, S | undefined>
export function find<T, S extends T>(
  predicate: (value: T, index: number, source: Observable<T>) => value is S
): qt.OpFun<T, S | undefined>
export function find<T, A>(
  predicate: (
    this: A,
    value: T,
    index: number,
    source: Observable<T>
  ) => boolean,
  thisArg: A
): qt.OpFun<T, T | undefined>
export function find<T>(
  predicate: (value: T, index: number, source: Observable<T>) => boolean
): qt.OpFun<T, T | undefined>
export function find<T>(
  predicate: (value: T, index: number, source: Observable<T>) => boolean,
  thisArg?: any
): qt.OpFun<T, T | undefined> {
  return operate(createFind(predicate, thisArg, "value"))
}
export function createFind<T>(
  predicate: (value: T, index: number, source: Observable<T>) => boolean,
  thisArg: any,
  emit: "value" | "index"
) {
  const findIndex = emit === "index"
  return (source: Observable<T>, subscriber: Subscriber<any>) => {
    let index = 0
    source.subscribe(
      new OpSubscriber(
        subscriber,
        value => {
          const i = index++
          if (predicate.call(thisArg, value, i, source)) {
            subscriber.next(findIndex ? i : value)
            subscriber.done()
          }
        },
        () => {
          subscriber.next(findIndex ? -1 : undefined)
          subscriber.done()
        }
      )
    )
  }
}
export function findIndex<T>(
  predicate: BooleanConstructor
): qt.OpFun<T, T extends qt.Falsy ? -1 : number>
export function findIndex<T>(
  predicate: BooleanConstructor,
  thisArg: any
): qt.OpFun<T, T extends qt.Falsy ? -1 : number>
export function findIndex<T, A>(
  predicate: (
    this: A,
    value: T,
    index: number,
    source: Observable<T>
  ) => boolean,
  thisArg: A
): qt.OpFun<T, number>
export function findIndex<T>(
  predicate: (value: T, index: number, source: Observable<T>) => boolean
): qt.OpFun<T, number>
export function findIndex<T>(
  predicate: (value: T, index: number, source: Observable<T>) => boolean,
  thisArg?: any
): qt.OpFun<T, number> {
  return operate(createFind(predicate, thisArg, "index"))
}
export function first<T, D = T>(
  predicate?: null,
  defaultValue?: D
): qt.OpFun<T, T | D>
export function first<T>(
  predicate: BooleanConstructor
): qt.OpFun<T, qt.TruthyTypesOf<T>>
export function first<T, D>(
  predicate: BooleanConstructor,
  defaultValue: D
): qt.OpFun<T, qt.TruthyTypesOf<T> | D>
export function first<T, S extends T>(
  predicate: (value: T, index: number, source: Observable<T>) => value is S,
  defaultValue?: S
): qt.OpFun<T, S>
export function first<T, S extends T, D>(
  predicate: (value: T, index: number, source: Observable<T>) => value is S,
  defaultValue: D
): qt.OpFun<T, S | D>
export function first<T, D = T>(
  predicate: (value: T, index: number, source: Observable<T>) => boolean,
  defaultValue?: D
): qt.OpFun<T, T | D>
export function first<T, D>(
  predicate?:
    | ((value: T, index: number, source: Observable<T>) => boolean)
    | null,
  defaultValue?: D
): qt.OpFun<T, T | D> {
  const hasDefaultValue = arguments.length >= 2
  return (source: Observable<T>) =>
    source.pipe(
      predicate ? filter((v, i) => predicate(v, i, source)) : qu.identity,
      take(1),
      hasDefaultValue
        ? defaultIfEmpty(defaultValue!)
        : throwIfEmpty(() => new qu.EmptyError())
    )
}
export const flatMap = mergeMap
export interface BasicGroupByOptions<K, T> {
  element?: undefined
  duration?: (grouped: GroupedObservable<K, T>) => qt.ObsInput<any>
  connector?: () => qt.SubjectLike<T>
}
export interface GroupByOptionsWithElement<K, E, T> {
  element: (value: T) => E
  duration?: (grouped: GroupedObservable<K, E>) => qt.ObsInput<any>
  connector?: () => qt.SubjectLike<E>
}
export function groupBy<T, K>(
  key: (value: T) => K,
  options: BasicGroupByOptions<K, T>
): qt.OpFun<T, GroupedObservable<K, T>>
export function groupBy<T, K, E>(
  key: (value: T) => K,
  options: GroupByOptionsWithElement<K, E, T>
): qt.OpFun<T, GroupedObservable<K, E>>
export function groupBy<T, K extends T>(
  key: (value: T) => value is K
): qt.OpFun<
  T,
  GroupedObservable<true, K> | GroupedObservable<false, Exclude<T, K>>
>
export function groupBy<T, K>(
  key: (value: T) => K
): qt.OpFun<T, GroupedObservable<K, T>>
export function groupBy<T, K>(
  key: (value: T) => K,
  element: void,
  duration: (grouped: GroupedObservable<K, T>) => Observable<any>
): qt.OpFun<T, GroupedObservable<K, T>>
export function groupBy<T, K, R>(
  key: (value: T) => K,
  element?: (value: T) => R,
  duration?: (grouped: GroupedObservable<K, R>) => Observable<any>
): qt.OpFun<T, GroupedObservable<K, R>>
export function groupBy<T, K, R>(
  key: (value: T) => K,
  element?: (value: T) => R,
  duration?: (grouped: GroupedObservable<K, R>) => Observable<any>,
  connector?: () => Subject<R>
): qt.OpFun<T, GroupedObservable<K, R>>
export function groupBy<T, K, R>(
  keySelector: (value: T) => K,
  elementOrOptions?:
    | ((value: any) => any)
    | void
    | BasicGroupByOptions<K, T>
    | GroupByOptionsWithElement<K, R, T>,
  duration?: (grouped: GroupedObservable<any, any>) => qt.ObsInput<any>,
  connector?: () => qt.SubjectLike<any>
): qt.OpFun<T, GroupedObservable<K, R>> {
  return operate((src, sub) => {
    let element: ((value: any) => any) | void
    if (!elementOrOptions || typeof elementOrOptions === "function") {
      element = elementOrOptions as (value: any) => any
    } else {
      ;({ duration, element, connector } = elementOrOptions)
    }
    const groups = new Map<K, qt.SubjectLike<any>>()
    const notify = (cb: (group: qt.Observer<any>) => void) => {
      groups.forEach(cb)
      cb(sub)
    }
    const handleError = (err: any) => notify(consumer => consumer.error(err))
    let activeGroups = 0
    let teardownAttempted = false
    const groupBySourceSubscriber = new OpSubscriber(
      sub,
      (x: T) => {
        try {
          const key = keySelector(x)
          let group = groups.get(key)
          if (!group) {
            groups.set(
              key,
              (group = connector ? connector() : new Subject<any>())
            )
            const grouped = createGroupedObservable(key, group)
            sub.next(grouped)
            if (duration) {
              const durationSubscriber = new OpSubscriber(
                group as any,
                () => {
                  group!.done()
                  durationSubscriber?.unsubscribe()
                },
                undefined,
                undefined,
                () => groups.delete(key)
              )
              groupBySourceSubscriber.add(
                innerFrom(duration(grouped)).subscribe(durationSubscriber)
              )
            }
          }
          group.next(element ? element(x) : x)
        } catch (err) {
          handleError(err)
        }
      },
      () => notify(consumer => consumer.done()),
      handleError,
      () => groups.clear(),
      () => {
        teardownAttempted = true
        return activeGroups === 0
      }
    )
    src.subscribe(groupBySourceSubscriber)
    function createGroupedObservable(
      key: K,
      groupSubject: qt.SubjectLike<any>
    ) {
      const result: any = new Observable<T>(groupSubscriber => {
        activeGroups++
        const innerSub = groupSubject.subscribe(groupSubscriber)
        return () => {
          innerSub.unsubscribe()
          --activeGroups === 0 &&
            teardownAttempted &&
            groupBySourceSubscriber.unsubscribe()
        }
      })
      result.key = key
      return result
    }
  })
}
export interface GroupedObservable<K, T> extends Observable<T> {
  readonly key: K
}
export function ignoreElements(): qt.OpFun<unknown, never> {
  return operate((src, sub) => {
    src.subscribe(new OpSubscriber(sub, qu.noop))
  })
}
export function isEmpty<T>(): qt.OpFun<T, boolean> {
  return operate((src, sub) => {
    src.subscribe(
      new OpSubscriber(
        sub,
        () => {
          sub.next(false)
          sub.done()
        },
        () => {
          sub.next(true)
          sub.done()
        }
      )
    )
  })
}
export function joinAllInternals<T, R>(
  joinFn: (xs: qt.ObsInput<T>[]) => Observable<T>,
  project?: (...xs: any[]) => R
) {
  return qu.pipe(
    toArray() as qt.OpFun<qt.ObsInput<T>, qt.ObsInput<T>[]>,
    mergeMap(xs => joinFn(xs)),
    project ? qu.mapOneOrManyArgs(project) : (qu.identity as any)
  )
}
export function last<T>(
  predicate: BooleanConstructor
): qt.OpFun<T, qt.TruthyTypesOf<T>>
export function last<T, D>(
  predicate: BooleanConstructor,
  defaultValue: D
): qt.OpFun<T, qt.TruthyTypesOf<T> | D>
export function last<T, D = T>(
  predicate?: null,
  defaultValue?: D
): qt.OpFun<T, T | D>
export function last<T, S extends T>(
  predicate: (value: T, index: number, source: Observable<T>) => value is S,
  defaultValue?: S
): qt.OpFun<T, S>
export function last<T, D = T>(
  predicate: (value: T, index: number, source: Observable<T>) => boolean,
  defaultValue?: D
): qt.OpFun<T, T | D>
export function last<T, D>(
  predicate?:
    | ((value: T, index: number, source: Observable<T>) => boolean)
    | null,
  defaultValue?: D
): qt.OpFun<T, T | D> {
  const hasDefaultValue = arguments.length >= 2
  return (source: Observable<T>) =>
    source.pipe(
      predicate ? filter((v, i) => predicate(v, i, source)) : qu.identity,
      takeLast(1),
      hasDefaultValue
        ? defaultIfEmpty(defaultValue!)
        : throwIfEmpty(() => new qu.EmptyError())
    )
}
export function map<T, R>(
  project: (value: T, index: number) => R
): qt.OpFun<T, R>
export function map<T, R, A>(
  project: (this: A, value: T, index: number) => R,
  thisArg: A
): qt.OpFun<T, R>
export function map<T, R>(
  project: (value: T, index: number) => R,
  thisArg?: any
): qt.OpFun<T, R> {
  return operate((src, sub) => {
    let i = 0
    src.subscribe(
      new OpSubscriber(sub, (x: T) => {
        sub.next(project.call(thisArg, x, i++))
      })
    )
  })
}
export function mapTo<R>(value: R): qt.OpFun<unknown, R>
export function mapTo<T, R>(value: R): qt.OpFun<T, R>
export function mapTo<R>(value: R): qt.OpFun<unknown, R> {
  return map(() => value)
}
export function materialize<T>(): qt.OpFun<T, Note<T> & qt.ObsNote<T>> {
  return operate((src, sub) => {
    src.subscribe(
      new OpSubscriber(
        sub,
        x => {
          sub.next(Note.createNext(x))
        },
        (x: any) => {
          sub.next(Note.createError(x))
          sub.done()
        },
        () => {
          sub.next(Note.createDone())
          sub.done()
        }
      )
    )
  })
}
export function max<T>(comparer?: (x: T, y: T) => number): qt.MonoTypeOp<T> {
  return reduce(
    qu.isFunction(comparer)
      ? (x, y) => (comparer(x, y) > 0 ? x : y)
      : (x, y) => (x > y ? x : y)
  )
}
export function merge<T, A extends readonly unknown[]>(
  ...sources: [...qt.InputTuple<A>]
): qt.OpFun<T, T | A[number]>
export function merge<T, A extends readonly unknown[]>(
  ...sourcesAndConcurrency: [...qt.InputTuple<A>, number]
): qt.OpFun<T, T | A[number]>
export function merge<T, A extends readonly unknown[]>(
  ...sourcesAndScheduler: [...qt.InputTuple<A>, qt.Scheduler]
): qt.OpFun<T, T | A[number]>
export function merge<T, A extends readonly unknown[]>(
  ...sourcesAndConcurrencyAndScheduler: [
    ...qt.InputTuple<A>,
    number,
    qt.Scheduler
  ]
): qt.OpFun<T, T | A[number]>
export function merge<T>(...xs: unknown[]): qt.OpFun<T, unknown> {
  const sched = Scheduler.pop(xs)
  const concurrent = qu.popNumber(xs, Infinity)
  xs = qu.argsOrArgArray(xs)
  return operate((src, sub) => {
    mergeAll(concurrent)(
      from([src, ...(xs as qt.ObsInput<T>[])], sched)
    ).subscribe(sub)
  })
}
export function mergeAll<O extends qt.ObsInput<any>>(
  concurrent = Infinity
): qt.OpFun<O, qt.ObsValueOf<O>> {
  return mergeMap(qu.identity, concurrent)
}
export function mergeInternals<T, R>(
  source: Observable<T>,
  subscriber: Subscriber<R>,
  project: (value: T, index: number) => qt.ObsInput<R>,
  concurrent: number,
  onBeforeNext?: (innerValue: R) => void,
  expand?: boolean,
  innerSubScheduler?: qt.Scheduler,
  additionalFinalizer?: () => void
) {
  const buffer: T[] = []
  let active = 0
  let index = 0
  let done = false
  const checkDone = () => {
    if (done && !buffer.length && !active) {
      subscriber.done()
    }
  }
  const outerNext = (value: T) =>
    active < concurrent ? doInnerSub(value) : buffer.push(value)
  const doInnerSub = (value: T) => {
    expand && subscriber.next(value as any)
    active++
    let innerDone = false
    innerFrom(project(value, index++)).subscribe(
      new OpSubscriber(
        subscriber,
        innerValue => {
          onBeforeNext?.(innerValue)
          if (expand) {
            outerNext(innerValue as any)
          } else {
            subscriber.next(innerValue)
          }
        },
        () => {
          innerDone = true
        },
        undefined,
        () => {
          if (innerDone) {
            try {
              active--
              while (buffer.length && active < concurrent) {
                const bufferedValue = buffer.shift()!
                if (innerSubScheduler) {
                  innerSubScheduler.run(subscriber, () =>
                    doInnerSub(bufferedValue)
                  )
                } else {
                  doInnerSub(bufferedValue)
                }
              }
              checkDone()
            } catch (err) {
              subscriber.error(err)
            }
          }
        }
      )
    )
  }
  source.subscribe(
    new OpSubscriber(subscriber, outerNext, () => {
      done = true
      checkDone()
    })
  )
  return () => {
    additionalFinalizer?.()
  }
}
export function mergeMap<T, O extends qt.ObsInput<any>>(
  project: (value: T, index: number) => O,
  concurrent?: number
): qt.OpFun<T, qt.ObsValueOf<O>>
export function mergeMap<T, O extends qt.ObsInput<any>>(
  project: (value: T, index: number) => O,
  resultSelector: undefined,
  concurrent?: number
): qt.OpFun<T, qt.ObsValueOf<O>>
export function mergeMap<T, R, O extends qt.ObsInput<any>>(
  project: (value: T, index: number) => O,
  resultSelector: (
    outerValue: T,
    innerValue: qt.ObsValueOf<O>,
    outerIndex: number,
    innerIndex: number
  ) => R,
  concurrent?: number
): qt.OpFun<T, R>
export function mergeMap<T, R, O extends qt.ObsInput<any>>(
  project: (value: T, index: number) => O,
  resultSelector?:
    | ((
        outerValue: T,
        innerValue: qt.ObsValueOf<O>,
        outerIndex: number,
        innerIndex: number
      ) => R)
    | number,
  concurrent = Infinity
): qt.OpFun<T, qt.ObsValueOf<O> | R> {
  if (qu.isFunction(resultSelector)) {
    return mergeMap(
      (a, i) =>
        map((b: any, ii: number) => resultSelector(a, b, i, ii))(
          innerFrom(project(a, i))
        ),
      concurrent
    )
  } else if (typeof resultSelector === "number") concurrent = resultSelector
  return operate((src, sub) => mergeInternals(src, sub, project, concurrent))
}
export function mergeMapTo<O extends qt.ObsInput<unknown>>(
  innerObservable: O,
  concurrent?: number
): qt.OpFun<unknown, qt.ObsValueOf<O>>
export function mergeMapTo<T, R, O extends qt.ObsInput<unknown>>(
  innerObservable: O,
  resultSelector: (
    outerValue: T,
    innerValue: qt.ObsValueOf<O>,
    outerIndex: number,
    innerIndex: number
  ) => R,
  concurrent?: number
): qt.OpFun<T, R>
export function mergeMapTo<T, R, O extends qt.ObsInput<unknown>>(
  innerObservable: O,
  resultSelector?:
    | ((
        outerValue: T,
        innerValue: qt.ObsValueOf<O>,
        outerIndex: number,
        innerIndex: number
      ) => R)
    | number,
  concurrent = Infinity
): qt.OpFun<T, qt.ObsValueOf<O> | R> {
  if (qu.isFunction(resultSelector)) {
    return mergeMap(() => innerObservable, resultSelector, concurrent)
  }
  if (typeof resultSelector === "number") {
    concurrent = resultSelector
  }
  return mergeMap(() => innerObservable, concurrent)
}
export function mergeScan<T, R>(
  accumulator: (acc: R, value: T, index: number) => qt.ObsInput<R>,
  seed: R,
  concurrent = Infinity
): qt.OpFun<T, R> {
  return operate((src, sub) => {
    let state = seed
    return mergeInternals(
      src,
      sub,
      (x, i) => accumulator(state, x, i),
      concurrent,
      x => {
        state = x
      },
      false,
      undefined,
      () => (state = null!)
    )
  })
}
export function mergeWith<T, A extends readonly unknown[]>(
  ...otherSources: [...qt.InputTuple<A>]
): qt.OpFun<T, T | A[number]> {
  return merge(...otherSources)
}
export function min<T>(comparer?: (x: T, y: T) => number): qt.MonoTypeOp<T> {
  return reduce(
    qu.isFunction(comparer)
      ? (x, y) => (comparer(x, y) < 0 ? x : y)
      : (x, y) => (x < y ? x : y)
  )
}

export function observeOn<T>(sched: qt.Scheduler, delay = 0): qt.MonoTypeOp<T> {
  return operate((src, sub) => {
    src.subscribe(
      new OpSubscriber(
        sub,
        x => sched.run(sub, () => sub.next(x), delay),
        x => sched.run(sub, () => sub.error(x), delay),
        () => sched.run(sub, () => sub.done(), delay)
      )
    )
  })
}
export function onErrorResumeNext<T, A extends readonly unknown[]>(
  xs: [...qt.InputTuple<A>]
): qt.OpFun<T, T | A[number]>
export function onErrorResumeNext<T, A extends readonly unknown[]>(
  ...xs: [...qt.InputTuple<A>]
): qt.OpFun<T, T | A[number]>
export function onErrorResumeNext<T, A extends readonly unknown[]>(
  ...xs: [[...qt.InputTuple<A>]] | [...qt.InputTuple<A>]
): qt.OpFun<T, T | A[number]> {
  const xs2 = qu.argsOrArgArray(xs) as unknown as qt.InputTuple<A>
  return operate((src, sub) => {
    const rest = [src, ...xs2]
    const subscribeNext = () => {
      if (!sub.closed) {
        if (rest.length > 0) {
          let nextSource: Observable<A[number]>
          try {
            nextSource = innerFrom(rest.shift()!)
          } catch (err) {
            subscribeNext()
            return
          }
          const s = new OpSubscriber(sub, undefined, qu.noop, qu.noop)
          nextSource.subscribe(s)
          s.add(subscribeNext)
        } else {
          sub.done()
        }
      }
    }
    subscribeNext()
  })
}
export function pairwise<T>(): qt.OpFun<T, [T, T]> {
  return operate((src, sub) => {
    let prev: T
    let hasPrev = false
    src.subscribe(
      new OpSubscriber(sub, x => {
        const y = prev
        prev = x
        hasPrev && sub.next([y, x])
        hasPrev = true
      })
    )
  })
}
export function partition<T>(
  predicate: (value: T, index: number) => boolean,
  thisArg?: any
): qt.UnaryFun<Observable<T>, [Observable<T>, Observable<T>]> {
  return (source: Observable<T>) =>
    [
      filter(predicate, thisArg)(source),
      filter(qu.not(predicate, thisArg))(source),
    ] as [Observable<T>, Observable<T>]
}
export function pluck<T, K1 extends keyof T>(k1: K1): qt.OpFun<T, T[K1]>
export function pluck<T, K1 extends keyof T, K2 extends keyof T[K1]>(
  k1: K1,
  k2: K2
): qt.OpFun<T, T[K1][K2]>
export function pluck<
  T,
  K1 extends keyof T,
  K2 extends keyof T[K1],
  K3 extends keyof T[K1][K2]
>(k1: K1, k2: K2, k3: K3): qt.OpFun<T, T[K1][K2][K3]>
export function pluck<
  T,
  K1 extends keyof T,
  K2 extends keyof T[K1],
  K3 extends keyof T[K1][K2],
  K4 extends keyof T[K1][K2][K3]
>(k1: K1, k2: K2, k3: K3, k4: K4): qt.OpFun<T, T[K1][K2][K3][K4]>
export function pluck<
  T,
  K1 extends keyof T,
  K2 extends keyof T[K1],
  K3 extends keyof T[K1][K2],
  K4 extends keyof T[K1][K2][K3],
  K5 extends keyof T[K1][K2][K3][K4]
>(k1: K1, k2: K2, k3: K3, k4: K4, k5: K5): qt.OpFun<T, T[K1][K2][K3][K4][K5]>
export function pluck<
  T,
  K1 extends keyof T,
  K2 extends keyof T[K1],
  K3 extends keyof T[K1][K2],
  K4 extends keyof T[K1][K2][K3],
  K5 extends keyof T[K1][K2][K3][K4],
  K6 extends keyof T[K1][K2][K3][K4][K5]
>(
  k1: K1,
  k2: K2,
  k3: K3,
  k4: K4,
  k5: K5,
  k6: K6
): qt.OpFun<T, T[K1][K2][K3][K4][K5][K6]>
export function pluck<
  T,
  K1 extends keyof T,
  K2 extends keyof T[K1],
  K3 extends keyof T[K1][K2],
  K4 extends keyof T[K1][K2][K3],
  K5 extends keyof T[K1][K2][K3][K4],
  K6 extends keyof T[K1][K2][K3][K4][K5]
>(
  k1: K1,
  k2: K2,
  k3: K3,
  k4: K4,
  k5: K5,
  k6: K6,
  ...rest: string[]
): qt.OpFun<T, unknown>
export function pluck<T>(...properties: string[]): qt.OpFun<T, unknown>
export function pluck<T, R>(
  ...properties: Array<string | number | symbol>
): qt.OpFun<T, R> {
  const length = properties.length
  if (length === 0) {
    throw new Error("list of properties cannot be empty.")
  }
  return map(x => {
    let currentProp: any = x
    for (let i = 0; i < length; i++) {
      const p = currentProp?.[properties[i]]
      if (typeof p !== "undefined") {
        currentProp = p
      } else {
        return undefined
      }
    }
    return currentProp
  })
}
export function publish<T>(): qt.UnaryFun<
  Observable<T>,
  ConnectableObservable<T>
>
export function publish<T, R extends qt.ObsInput<any>>(
  selector: (shared: Observable<T>) => R
): qt.OpFun<T, qt.ObsValueOf<R>>
export function publish<T, R>(
  selector?: qt.OpFun<T, R>
): qt.MonoTypeOp<T> | qt.OpFun<T, R> {
  return selector
    ? x => connect(selector)(x)
    : x => multicast(new Subject<T>())(x)
}
export function publishBehavior<T>(
  x0: T
): qt.UnaryFun<Observable<T>, ConnectableObservable<T>> {
  return x => {
    const s = new BehaviorSubject<T>(x0)
    return new ConnectableObservable(x, () => s)
  }
}
export function publishLast<T>(): qt.UnaryFun<
  Observable<T>,
  ConnectableObservable<T>
> {
  return x => {
    const s = new AsyncSubject<T>()
    return new ConnectableObservable(x, () => s)
  }
}
export function publishReplay<T>(
  bufferSize?: number,
  windowTime?: number,
  timestampProvider?: qt.TimestampProvider
): qt.MonoTypeOp<T>
export function publishReplay<T, O extends qt.ObsInput<any>>(
  bufferSize: number | undefined,
  windowTime: number | undefined,
  selector: (shared: Observable<T>) => O,
  timestampProvider?: qt.TimestampProvider
): qt.OpFun<T, qt.ObsValueOf<O>>
export function publishReplay<T, O extends qt.ObsInput<any>>(
  bufferSize: number | undefined,
  windowTime: number | undefined,
  selector: undefined,
  timestampProvider: qt.TimestampProvider
): qt.OpFun<T, qt.ObsValueOf<O>>
export function publishReplay<T, R>(
  bufferSize?: number,
  windowTime?: number,
  selectorOrScheduler?: qt.TimestampProvider | qt.OpFun<T, R>,
  timestampProvider?: qt.TimestampProvider
) {
  if (selectorOrScheduler && !qu.isFunction(selectorOrScheduler)) {
    timestampProvider = selectorOrScheduler
  }
  const selector = qu.isFunction(selectorOrScheduler)
    ? selectorOrScheduler
    : undefined
  return (x: Observable<T>) =>
    multicast(
      new ReplaySubject<T>(bufferSize, windowTime, timestampProvider),
      selector!
    )(x)
}
export function race<T, A extends readonly unknown[]>(
  xs: [...qt.InputTuple<A>]
): qt.OpFun<T, T | A[number]>
export function race<T, A extends readonly unknown[]>(
  ...xs: [...qt.InputTuple<A>]
): qt.OpFun<T, T | A[number]>
export function race<T>(...xs: any[]): qt.OpFun<T, unknown> {
  return raceWith(...qu.argsOrArgArray(xs))
}

export function raceWith<T, A extends readonly unknown[]>(
  ...xs: [...qt.InputTuple<A>]
): qt.OpFun<T, T | A[number]> {
  return !xs.length
    ? qu.identity
    : operate((src, sub) => {
        raceInit<T | A[number]>([src, ...xs])(sub)
      })
}

export function reduce<V, A = V>(
  accumulator: (acc: A | V, value: V, index: number) => A
): qt.OpFun<V, V | A>
export function reduce<V, A>(
  accumulator: (acc: A, value: V, index: number) => A,
  seed: A
): qt.OpFun<V, A>
export function reduce<V, A, S = A>(
  accumulator: (acc: A | S, value: V, index: number) => A,
  seed: S
): qt.OpFun<V, A>
export function reduce<V, A>(
  accumulator: (acc: V | A, value: V, index: number) => A,
  seed?: any
): qt.OpFun<V, V | A> {
  return operate(
    scanInternals(accumulator, seed, arguments.length >= 2, false, true)
  )
}

export function refCount<T>(): qt.MonoTypeOp<T> {
  return operate((src, sub) => {
    let s: Subscription | null = null
    ;(src as any)._refCount++
    const counter = new OpSubscriber(
      sub,
      undefined,
      undefined,
      undefined,
      () => {
        if (
          !src ||
          (src as any)._refCount <= 0 ||
          0 < --(src as any)._refCount
        ) {
          s = null
          return
        }
        const sharedConnection = (src as any)._connection
        const conn = s
        s = null
        if (sharedConnection && (!conn || sharedConnection === conn)) {
          sharedConnection.unsubscribe()
        }
        sub.unsubscribe()
      }
    )
    src.subscribe(counter)
    if (!counter.closed) s = (src as ConnectableObservable<T>).connect()
  })
}
export interface RepeatConfig {
  count?: number
  delay?: number | ((count: number) => qt.ObsInput<any>)
}
export function repeat<T>(
  countOrConfig?: number | RepeatConfig
): qt.MonoTypeOp<T> {
  let count = Infinity
  let delay: RepeatConfig["delay"]
  if (countOrConfig != null) {
    if (typeof countOrConfig === "object") {
      ;({ count = Infinity, delay } = countOrConfig)
    } else {
      count = countOrConfig
    }
  }
  return count <= 0
    ? () => EMPTY
    : operate((src, sub) => {
        let soFar = 0
        let s: Subscription | null
        const resubscribe = () => {
          s?.unsubscribe()
          s = null
          if (delay != null) {
            const notifier =
              typeof delay === "number" ? timer(delay) : innerFrom(delay(soFar))
            const notifierSubscriber = new OpSubscriber(sub, () => {
              notifierSubscriber.unsubscribe()
              subscribeToSource()
            })
            notifier.subscribe(notifierSubscriber)
          } else subscribeToSource()
        }
        const subscribeToSource = () => {
          let done = false
          s = src.subscribe(
            new OpSubscriber(sub, undefined, () => {
              if (++soFar < count) {
                if (s) resubscribe()
                else done = true
              } else sub.done()
            })
          )
          if (done) resubscribe()
        }
        subscribeToSource()
      })
}
export function repeatWhen<T>(
  notifier: (notes: Observable<void>) => Observable<any>
): qt.MonoTypeOp<T> {
  return operate((src, sub) => {
    let s: Subscription | null
    let syncResub = false
    let completions$: Subject<void>
    let isNotifierDone = false
    let isMainDone = false
    const checkDone = () => isMainDone && isNotifierDone && (sub.done(), true)
    const getCompletionSubject = () => {
      if (!completions$) {
        completions$ = new Subject()
        notifier(completions$).subscribe(
          new OpSubscriber(
            sub,
            () => {
              if (s) subscribeForRepeatWhen()
              else syncResub = true
            },
            () => {
              isNotifierDone = true
              checkDone()
            }
          )
        )
      }
      return completions$
    }
    const subscribeForRepeatWhen = () => {
      isMainDone = false
      s = src.subscribe(
        new OpSubscriber(sub, undefined, () => {
          isMainDone = true
          !checkDone() && getCompletionSubject().next()
        })
      )
      if (syncResub) {
        s.unsubscribe()
        s = null
        syncResub = false
        subscribeForRepeatWhen()
      }
    }
    subscribeForRepeatWhen()
  })
}
export interface RetryConfig {
  count?: number
  delay?: number | ((error: any, retryCount: number) => qt.ObsInput<any>)
  resetOnSuccess?: boolean
}
export function retry<T>(count?: number): qt.MonoTypeOp<T>
export function retry<T>(cfg: RetryConfig): qt.MonoTypeOp<T>
export function retry<T>(x: number | RetryConfig = Infinity): qt.MonoTypeOp<T> {
  let cfg: RetryConfig
  if (x && typeof x === "object") cfg = x
  else cfg = { count: x as number }
  const { count = Infinity, delay, resetOnSuccess = false } = cfg
  return count <= 0
    ? qu.identity
    : operate((src, sub) => {
        let soFar = 0
        let s: Subscription | null
        const subscribeForRetry = () => {
          let done = false
          s = src.subscribe(
            new OpSubscriber(
              sub,
              x => {
                if (resetOnSuccess) soFar = 0
                sub.next(x)
              },
              x => {
                if (soFar++ < count) {
                  const resub = () => {
                    if (s) {
                      s.unsubscribe()
                      s = null
                      subscribeForRetry()
                    } else done = true
                  }
                  if (delay != null) {
                    const notifier =
                      typeof delay === "number"
                        ? timer(delay)
                        : innerFrom(delay(x, soFar))
                    const notifierSubscriber = new OpSubscriber(
                      sub,
                      () => {
                        notifierSubscriber.unsubscribe()
                        resub()
                      },
                      () => {
                        sub.done()
                      }
                    )
                    notifier.subscribe(notifierSubscriber)
                  } else resub()
                } else sub.error(x)
              },
              undefined
            )
          )
          if (done) {
            s.unsubscribe()
            s = null
            subscribeForRetry()
          }
        }
        subscribeForRetry()
      })
}
export function retryWhen<T>(
  notifier: (x: Observable<any>) => Observable<any>
): qt.MonoTypeOp<T> {
  return operate((src, sub) => {
    let s: Subscription | null
    let done = false
    let errors$: Subject<any>
    const subscribeForRetryWhen = () => {
      s = src.subscribe(
        new OpSubscriber(
          sub,
          undefined,
          x => {
            if (!errors$) {
              errors$ = new Subject()
              notifier(errors$).subscribe(
                new OpSubscriber(sub, () =>
                  s ? subscribeForRetryWhen() : (done = true)
                )
              )
            }
            if (errors$) errors$.next(x)
          },
          undefined
        )
      )
      if (done) {
        s.unsubscribe()
        s = null
        done = false
        subscribeForRetryWhen()
      }
    }
    subscribeForRetryWhen()
  })
}
export function sample<T>(o: Observable<any>): qt.MonoTypeOp<T> {
  return operate((src, sub) => {
    let has = false
    let last: T | null = null
    src.subscribe(
      new OpSubscriber(sub, x => {
        has = true
        last = x
      })
    )
    o.subscribe(
      new OpSubscriber(
        sub,
        () => {
          if (has) {
            has = false
            const value = last!
            last = null
            sub.next(value)
          }
        },
        qu.noop
      )
    )
  })
}

export function sampleTime<T>(
  period: number,
  s: qt.Scheduler = asyncSched
): qt.MonoTypeOp<T> {
  return sample(interval(period, s))
}

export function scan<T, R = T>(
  f: (y: R | T, x: T, i: number) => R
): qt.OpFun<T, T | R>
export function scan<T, R>(
  f: (y: R, x: T, i: number) => R,
  seed: R
): qt.OpFun<T, R>
export function scan<V, A, S>(
  f: (y: A | S, x: V, i: number) => A,
  seed: S
): qt.OpFun<V, A>
export function scan<V, A, S>(
  f: (y: V | A | S, x: V, i: number) => A,
  seed?: S
): qt.OpFun<V, V | A> {
  return operate(scanInternals(f, seed as S, arguments.length >= 2, true))
}

export function scanInternals<V, A, S>(
  accumulator: (acc: V | A | S, value: V, index: number) => A,
  seed: S,
  hasSeed: boolean,
  emitOnNext: boolean,
  emitBeforeDone?: undefined | true
) {
  return (source: Observable<V>, subscriber: Subscriber<any>) => {
    let hasState = hasSeed
    let state: any = seed
    let index = 0
    source.subscribe(
      new OpSubscriber(
        subscriber,
        value => {
          const i = index++
          state = hasState
            ? accumulator(state, value, i)
            : ((hasState = true), value)
          emitOnNext && subscriber.next(state)
        },
        emitBeforeDone &&
          (() => {
            hasState && subscriber.next(state)
            subscriber.done()
          })
      )
    )
  }
}
export function sequenceEqual<T>(
  compareTo: Observable<T>,
  comparator: (a: T, b: T) => boolean = (a, b) => a === b
): qt.OpFun<T, boolean> {
  return operate((src, sub) => {
    const aState = createState<T>()
    const bState = createState<T>()
    const emit = (isEqual: boolean) => {
      sub.next(isEqual)
      sub.done()
    }
    const createSubscriber = (
      selfState: SequenceState<T>,
      otherState: SequenceState<T>
    ) => {
      const sequenceEqualSubscriber = new OpSubscriber(
        sub,
        (x: T) => {
          const { buffer, done } = otherState
          if (buffer.length === 0) done ? emit(false) : selfState.buffer.push(x)
          else !comparator(x, buffer.shift()!) && emit(false)
        },
        () => {
          selfState.done = true
          const { done, buffer } = otherState
          done && emit(buffer.length === 0)
          sequenceEqualSubscriber?.unsubscribe()
        }
      )
      return sequenceEqualSubscriber
    }
    src.subscribe(createSubscriber(aState, bState))
    compareTo.subscribe(createSubscriber(bState, aState))
  })
}

interface SequenceState<T> {
  buffer: T[]
  done: boolean
}

function createState<T>(): SequenceState<T> {
  return {
    buffer: [],
    done: false,
  }
}

export interface ShareConfig<T> {
  connector?: () => qt.SubjectLike<T>
  resetOnError?: boolean | ((x: any) => Observable<any>)
  resetOnDone?: boolean | (() => Observable<any>)
  resetOnRefCountZero?: boolean | (() => Observable<any>)
}

export function share<T>(): qt.MonoTypeOp<T>
export function share<T>(cfg: ShareConfig<T>): qt.MonoTypeOp<T>
export function share<T>(cfg: ShareConfig<T> = {}): qt.MonoTypeOp<T> {
  const {
    connector = () => new Subject<T>(),
    resetOnError = true,
    resetOnDone = true,
    resetOnRefCountZero = true,
  } = cfg
  return wrapperSource => {
    let connection: SafeSubscriber<T> | undefined
    let resetConnection: Subscription | undefined
    let s: qt.SubjectLike<T> | undefined
    let refCount = 0
    let done = false
    let erred = false
    const cancelReset = () => {
      resetConnection?.unsubscribe()
      resetConnection = undefined
    }
    const reset = () => {
      cancelReset()
      connection = s = undefined
      done = erred = false
    }
    const resetAndUnsubscribe = () => {
      const conn = connection
      reset()
      conn?.unsubscribe()
    }
    return operate<T, T>((src, sub) => {
      refCount++
      if (!erred && !done) cancelReset()
      const dest = (s = s ?? connector())
      sub.add(() => {
        refCount--
        if (refCount === 0 && !erred && !done) {
          resetConnection = handleReset(
            resetAndUnsubscribe,
            resetOnRefCountZero
          )
        }
      })
      dest.subscribe(sub)
      if (!connection && refCount > 0) {
        connection = new SafeSubscriber({
          next: x => dest.next(x),
          error: x => {
            erred = true
            cancelReset()
            resetConnection = handleReset(reset, resetOnError, x)
            dest.error(x)
          },
          done: () => {
            done = true
            cancelReset()
            resetConnection = handleReset(reset, resetOnDone)
            dest.done()
          },
        })
        innerFrom(src).subscribe(connection)
      }
    })(wrapperSource)
  }
}

function handleReset<T extends unknown[] = never[]>(
  reset: () => void,
  on: boolean | ((...args: T) => Observable<any>),
  ...xs: T
): Subscription | undefined {
  if (on === true) {
    reset()
    return
  }
  if (on === false) return
  const s = new SafeSubscriber({
    next: () => {
      s.unsubscribe()
      reset()
    },
  })
  return on(...xs).subscribe(s)
}

export interface ShareReplayConfig {
  bufferSize?: number
  windowTime?: number
  refCount: boolean
  sched?: qt.Scheduler
}

export function shareReplay<T>(cfg: ShareReplayConfig): qt.MonoTypeOp<T>
export function shareReplay<T>(
  bufferSize?: number,
  windowTime?: number,
  s?: qt.Scheduler
): qt.MonoTypeOp<T>
export function shareReplay<T>(
  x?: ShareReplayConfig | number,
  windowTime?: number,
  sched?: qt.Scheduler
): qt.MonoTypeOp<T> {
  let bufferSize: number
  let refCount = false
  if (x && typeof x === "object") {
    ;({
      bufferSize = Infinity,
      windowTime = Infinity,
      refCount = false,
      sched,
    } = x)
  } else bufferSize = (x ?? Infinity) as number
  return share<T>({
    connector: () => new ReplaySubject(bufferSize, windowTime, sched),
    resetOnError: true,
    resetOnDone: false,
    resetOnRefCountZero: refCount,
  })
}

export function single<T>(
  f: BooleanConstructor
): qt.OpFun<T, qt.TruthyTypesOf<T>>
export function single<T>(
  f?: (x: T, i: number, src: Observable<T>) => boolean
): qt.MonoTypeOp<T>
export function single<T>(
  f?: (x: T, i: number, src: Observable<T>) => boolean
): qt.MonoTypeOp<T> {
  return operate((src, sub) => {
    let has = false
    let single: T
    let seen = false
    let i = 0
    src.subscribe(
      new OpSubscriber(
        sub,
        x => {
          seen = true
          if (!f || f(x, i++, src)) {
            has && sub.error(new qu.SequenceError("Too many matching values"))
            has = true
            single = x
          }
        },
        () => {
          if (has) {
            sub.next(single)
            sub.done()
          } else {
            sub.error(
              seen
                ? new qu.NotFoundError("No matching values")
                : new qu.EmptyError()
            )
          }
        }
      )
    )
  })
}

export function skip<T>(count: number): qt.MonoTypeOp<T> {
  return filter((_, i) => count <= i)
}

export function skipLast<T>(skip: number): qt.MonoTypeOp<T> {
  return skip <= 0
    ? qu.identity
    : operate((src, sub) => {
        let ring: T[] = new Array(skip)
        let seen = 0
        src.subscribe(
          new OpSubscriber(sub, x => {
            const valueIndex = seen++
            if (valueIndex < skip) ring[valueIndex] = x
            else {
              const i = valueIndex % skip
              const y = ring[i]
              ring[i] = x
              sub.next(y)
            }
          })
        )
        return () => {
          ring = null!
        }
      })
}

export function skipUntil<T>(o: Observable<any>): qt.MonoTypeOp<T> {
  return operate((src, sub) => {
    let taking = false
    const s = new OpSubscriber(
      sub,
      () => {
        s?.unsubscribe()
        taking = true
      },
      qu.noop
    )
    innerFrom(o).subscribe(s)
    src.subscribe(new OpSubscriber(sub, x => taking && sub.next(x)))
  })
}

export function skipWhile<T>(
  f: BooleanConstructor
): qt.OpFun<T, Extract<T, qt.Falsy> extends never ? never : T>
export function skipWhile<T>(f: (x: T, i: number) => true): qt.OpFun<T, never>
export function skipWhile<T>(f: (x: T, i: number) => boolean): qt.MonoTypeOp<T>
export function skipWhile<T>(
  f: (x: T, i: number) => boolean
): qt.MonoTypeOp<T> {
  return operate((src, sub) => {
    let taking = false
    let i = 0
    src.subscribe(
      new OpSubscriber(
        sub,
        x => (taking || (taking = !f(x, i++))) && sub.next(x)
      )
    )
  })
}

export function startWith<T>(x: null): qt.OpFun<T, T | null>
export function startWith<T>(x: undefined): qt.OpFun<T, T | undefined>
export function startWith<T, A extends readonly unknown[] = T[]>(
  ...xs: [...A, qt.Scheduler]
): qt.OpFun<T, T | qt.ValueFromArray<A>>
export function startWith<T, A extends readonly unknown[] = T[]>(
  ...xs: A
): qt.OpFun<T, T | qt.ValueFromArray<A>>
export function startWith<T, D>(...xs: D[]): qt.OpFun<T, T | D> {
  const s = Scheduler.pop(xs)
  return operate((src, sub) => {
    ;(s ? concat(xs, src, s) : concat(xs, src)).subscribe(sub)
  })
}

export function subscribeOn<T>(s: qt.Scheduler, delay = 0): qt.MonoTypeOp<T> {
  return operate((src, sub) => {
    sub.add(s.schedule(() => src.subscribe(sub), delay))
  })
}

export function switchAll<O extends qt.ObsInput<any>>(): qt.OpFun<
  O,
  qt.ObsValueOf<O>
> {
  return switchMap(qu.identity)
}

export function switchMap<T, O extends qt.ObsInput<any>>(
  f: (x: T, i: number) => O
): qt.OpFun<T, qt.ObsValueOf<O>>
export function switchMap<T, O extends qt.ObsInput<any>>(
  f: (x: T, i: number) => O,
  y: undefined
): qt.OpFun<T, qt.ObsValueOf<O>>
export function switchMap<T, R, O extends qt.ObsInput<any>>(
  f: (x: T, i: number) => O,
  y: (x: T, x2: qt.ObsValueOf<O>, i: number, i2: number) => R
): qt.OpFun<T, R>
export function switchMap<T, R, O extends qt.ObsInput<any>>(
  f: (x: T, i: number) => O,
  y?: (x: T, x2: qt.ObsValueOf<O>, i: number, i2: number) => R
): qt.OpFun<T, qt.ObsValueOf<O> | R> {
  return operate((src, sub) => {
    let s: Subscriber<qt.ObsValueOf<O>> | null = null
    let j = 0
    let done = false
    const check = () => done && !s && sub.done()
    src.subscribe(
      new OpSubscriber(
        sub,
        x => {
          s?.unsubscribe()
          let i2 = 0
          const i = j++
          innerFrom(f(x, i)).subscribe(
            (s = new OpSubscriber(
              sub,
              x2 => sub.next(y ? y(x, x2, i, i2++) : x2),
              () => {
                s = null!
                check()
              }
            ))
          )
        },
        () => {
          done = true
          check()
        }
      )
    )
  })
}

export function switchMapTo<T extends qt.ObsInput<unknown>>(
  x: T
): qt.OpFun<unknown, qt.ObsValueOf<T>>
export function switchMapTo<T extends qt.ObsInput<unknown>>(
  x: T,
  y: undefined
): qt.OpFun<unknown, qt.ObsValueOf<T>>
export function switchMapTo<T, R, O extends qt.ObsInput<unknown>>(
  x: O,
  y: (x: T, x2: qt.ObsValueOf<O>, i: number, i2: number) => R
): qt.OpFun<T, R>
export function switchMapTo<T, R, O extends qt.ObsInput<unknown>>(
  x: O,
  y?: (x: T, x2: qt.ObsValueOf<O>, i: number, i2: number) => R
): qt.OpFun<T, qt.ObsValueOf<O> | R> {
  return qu.isFunction(y) ? switchMap(() => x, y) : switchMap(() => x)
}

export function switchScan<T, R, O extends qt.ObsInput<any>>(
  f: (y: R, x: T, i: number) => O,
  seed: R
): qt.OpFun<T, qt.ObsValueOf<O>> {
  return operate((src, sub) => {
    let state = seed
    switchMap(
      (x: T, i) => f(state, x, i),
      (_, x) => ((state = x), x)
    )(src).subscribe(sub)
    return () => {
      state = null!
    }
  })
}

export function take<T>(n: number): qt.MonoTypeOp<T> {
  return n <= 0
    ? () => EMPTY
    : operate((src, sub) => {
        let seen = 0
        src.subscribe(
          new OpSubscriber(sub, x => {
            if (++seen <= n) {
              sub.next(x)
              if (n <= seen) sub.done()
            }
          })
        )
      })
}

export function takeLast<T>(n: number): qt.MonoTypeOp<T> {
  return n <= 0
    ? () => EMPTY
    : operate((src, sub) => {
        let xs: T[] = []
        src.subscribe(
          new OpSubscriber(
            sub,
            x => {
              xs.push(x)
              n < xs.length && xs.shift()
            },
            () => {
              for (const x of xs) {
                sub.next(x)
              }
              sub.done()
            },
            undefined,
            () => {
              xs = null!
            }
          )
        )
      })
}

export function takeUntil<T>(x: qt.ObsInput<any>): qt.MonoTypeOp<T> {
  return operate((src, sub) => {
    innerFrom(x).subscribe(new OpSubscriber(sub, () => sub.done(), qu.noop))
    !sub.closed && src.subscribe(sub)
  })
}

export function takeWhile<T>(
  f: BooleanConstructor,
  inclusive: true
): qt.MonoTypeOp<T>
export function takeWhile<T>(
  f: BooleanConstructor,
  inclusive: false
): qt.OpFun<T, qt.TruthyTypesOf<T>>
export function takeWhile<T>(
  f: BooleanConstructor
): qt.OpFun<T, qt.TruthyTypesOf<T>>
export function takeWhile<T, R extends T>(
  f: (x: T, i: number) => x is R
): qt.OpFun<T, R>
export function takeWhile<T, R extends T>(
  f: (x: T, i: number) => x is R,
  inclusive: false
): qt.OpFun<T, R>
export function takeWhile<T>(
  f: (x: T, i: number) => boolean,
  inclusive?: boolean
): qt.MonoTypeOp<T>
export function takeWhile<T>(
  f: (x: T, i: number) => boolean,
  inclusive = false
): qt.MonoTypeOp<T> {
  return operate((src, sub) => {
    let i = 0
    src.subscribe(
      new OpSubscriber(sub, x => {
        const y = f(x, i++)
        ;(y || inclusive) && sub.next(x)
        !y && sub.done()
      })
    )
  })
}

export interface TapObserver<T> extends qt.Observer<T> {
  subscribe: () => void
  unsubscribe: () => void
  finalize: () => void
}

export function tap<T>(x?: Partial<TapObserver<T>>): qt.MonoTypeOp<T>
export function tap<T>(next: (x: T) => void): qt.MonoTypeOp<T>
export function tap<T>(
  next?: ((x: T) => void) | null,
  error?: ((x: any) => void) | null,
  done?: (() => void) | null
): qt.MonoTypeOp<T>
export function tap<T>(
  x?: Partial<TapObserver<T>> | ((x: T) => void) | null,
  error?: ((x: any) => void) | null,
  done?: (() => void) | null
): qt.MonoTypeOp<T> {
  const o =
    qu.isFunction(x) || error || done
      ? ({
          next: x as Exclude<typeof x, Partial<TapObserver<T>>>,
          error,
          done,
        } as Partial<TapObserver<T>>)
      : x
  return o
    ? operate((src, sub) => {
        o.subscribe?.()
        let done = false
        src.subscribe(
          new OpSubscriber(
            sub,
            x => {
              o.next?.(x)
              sub.next(x)
            },
            x => {
              done = true
              o.error?.(x)
              sub.error(x)
            },
            () => {
              done = true
              o.done?.()
              sub.done()
            },
            () => {
              if (!done) o.unsubscribe?.()
              o.finalize?.()
            }
          )
        )
      })
    : qu.identity
}

export interface ThrottleConfig {
  leading?: boolean
  trailing?: boolean
}
export const defaultThrottleConfig: ThrottleConfig = {
  leading: true,
  trailing: false,
}

export function throttle<T>(
  f: (x: T) => qt.ObsInput<any>,
  cfg: ThrottleConfig = defaultThrottleConfig
): qt.MonoTypeOp<T> {
  return operate((src, sub) => {
    const { leading, trailing } = cfg
    let has = false
    let toSend: T | null = null
    let s: Subscription | null = null
    let done = false
    const start = (x: T) =>
      (s = innerFrom(f(x)).subscribe(new OpSubscriber(sub, end, cleanup)))
    const end = () => {
      s?.unsubscribe()
      s = null
      if (trailing) {
        send()
        done && sub.done()
      }
    }
    const cleanup = () => {
      s = null
      done && sub.done()
    }
    const send = () => {
      if (has) {
        has = false
        const y = toSend!
        toSend = null
        sub.next(y)
        !done && start(y)
      }
    }
    src.subscribe(
      new OpSubscriber(
        sub,
        x => {
          has = true
          toSend = x
          !(s && !s.closed) && (leading ? send() : start(x))
        },
        () => {
          done = true
          !(trailing && has && s && !s.closed) && sub.done()
        }
      )
    )
  })
}

export function throttleTime<T>(
  x: number,
  s: qt.Scheduler = asyncSched,
  cfg = defaultThrottleConfig
): qt.MonoTypeOp<T> {
  const y = timer(x, s)
  return throttle(() => y, cfg)
}

export function throwIfEmpty<T>(
  f: () => any = defaultErrorFactory
): qt.MonoTypeOp<T> {
  return operate((src, sub) => {
    let has = false
    src.subscribe(
      new OpSubscriber(
        sub,
        x => {
          has = true
          sub.next(x)
        },
        () => (has ? sub.done() : sub.error(f()))
      )
    )
  })
}

function defaultErrorFactory() {
  return new qu.EmptyError()
}

export function timeInterval<T>(
  s: qt.Scheduler = asyncSched
): qt.OpFun<T, TimeInterval<T>> {
  return operate((src, sub) => {
    let last = s.now()
    src.subscribe(
      new OpSubscriber(sub, x => {
        const now = s.now()
        const d = now - last
        last = now
        sub.next(new TimeInterval(x, d))
      })
    )
  })
}

export class TimeInterval<T> {
  constructor(public val: T, public interval: number) {}
}

export interface TimeoutConfig<
  T,
  O extends qt.ObsInput<unknown> = qt.ObsInput<T>,
  M = unknown
> {
  each?: number
  first?: number | Date
  sched?: qt.Scheduler
  with?: (x: TimeoutInfo<T, M>) => O
  meta?: M
}

export interface TimeoutInfo<T, M = unknown> {
  readonly meta: M
  readonly seen: number
  readonly last: T | null
}
export interface TimeoutError<T = unknown, M = unknown> extends Error {
  info: TimeoutInfo<T, M> | null
}
export interface TimeoutErrorCtor {
  new <T = unknown, M = unknown>(x?: TimeoutInfo<T, M>): TimeoutError<T, M>
}

export const TimeoutError: TimeoutErrorCtor = qu.createErrorClass(
  _super =>
    function TimeoutErrorImpl(this: any, x: TimeoutInfo<any> | null = null) {
      _super(this)
      this.message = "Timeout has occurred"
      this.name = "TimeoutError"
      this.info = x
    }
)

export function timeout<T, O extends qt.ObsInput<unknown>, M = unknown>(
  cfg: TimeoutConfig<T, O, M> & { with: (x: TimeoutInfo<T, M>) => O }
): qt.OpFun<T, T | qt.ObsValueOf<O>>
export function timeout<T, M = unknown>(
  cfg: Omit<TimeoutConfig<T, any, M>, "with">
): qt.OpFun<T, T>
export function timeout<T>(first: Date, s?: qt.Scheduler): qt.MonoTypeOp<T>
export function timeout<T>(each: number, s?: qt.Scheduler): qt.MonoTypeOp<T>
export function timeout<T, O extends qt.ObsInput<any>, M>(
  cfg: number | Date | TimeoutConfig<T, O, M>,
  s?: qt.Scheduler
): qt.OpFun<T, T | qt.ObsValueOf<O>> {
  const {
    first,
    each,
    with: _with = timeoutErrorFactory,
    sched = s ?? asyncSched,
    meta = null!,
  } = (
    qu.isValidDate(cfg)
      ? { first: cfg }
      : typeof cfg === "number"
      ? { each: cfg }
      : cfg
  ) as TimeoutConfig<T, O, M>
  if (first == null && each == null) throw new TypeError("No timeout provided.")
  return operate((src, sub) => {
    let timer: qt.Subscription
    let last: T | null = null
    let seen = 0
    const s: Subscription = src.subscribe(
      new OpSubscriber(
        sub,
        (x: T) => {
          timer?.unsubscribe()
          seen++
          sub.next((last = x))
          each! > 0 && start(each!)
        },
        undefined,
        undefined,
        () => {
          if (!timer?.closed) timer?.unsubscribe()
          last = null
        }
      )
    )
    const start = (delay: number) => {
      timer = sched.run(
        sub,
        () => {
          try {
            s.unsubscribe()
            innerFrom(_with!({ meta, last, seen })).subscribe(sub)
          } catch (e) {
            sub.error(e)
          }
        },
        delay
      )
    }
    !seen &&
      start(
        first != null
          ? typeof first === "number"
            ? first
            : +first - sched!.now()
          : each!
      )
  })
}

function timeoutErrorFactory(x: TimeoutInfo<any>): Observable<never> {
  throw new TimeoutError(x)
}

export function timeoutWith<T, R>(
  dueBy: Date,
  switchTo: qt.ObsInput<R>,
  s?: qt.Scheduler
): qt.OpFun<T, T | R>
export function timeoutWith<T, R>(
  waitFor: number,
  switchTo: qt.ObsInput<R>,
  s?: qt.Scheduler
): qt.OpFun<T, T | R>
export function timeoutWith<T, R>(
  due: number | Date,
  withObservable: qt.ObsInput<R>,
  sched?: qt.Scheduler
): qt.OpFun<T, T | R> {
  let first: number | Date | undefined
  let each: number | undefined
  let _with: () => qt.ObsInput<R>
  sched = sched ?? asyncSched
  if (qu.isValidDate(due)) first = due
  else if (typeof due === "number") each = due
  if (withObservable) _with = () => withObservable
  else throw new TypeError("No observable provided to switch to")
  if (first == null && each == null) throw new TypeError("No timeout provided.")
  return timeout<T, qt.ObsInput<R>>({
    first,
    each,
    sched,
    with: _with,
  })
}

export function timestamp<T>(
  x: qt.TimestampProvider = stamper
): qt.OpFun<T, qt.Timestamp<T>> {
  return map((x2: T) => ({ value: x2, timestamp: x.now() }))
}

const arrReducer = (xs: any[], x: any) => (xs.push(x), xs)

export function toArray<T>(): qt.OpFun<T, T[]> {
  return operate((src, sub) => {
    reduce(arrReducer, [] as T[])(src).subscribe(sub)
  })
}
export function window<T>(o: Observable<any>): qt.OpFun<T, Observable<T>> {
  return operate((src, sub) => {
    let s: Subject<T> = new Subject<T>()
    sub.next(s.asObservable())
    const doError = (err: any) => {
      s.error(err)
      sub.error(err)
    }
    src.subscribe(
      new OpSubscriber(
        sub,
        x => s?.next(x),
        doError,
        () => {
          s.done()
          sub.done()
        }
      )
    )
    o.subscribe(
      new OpSubscriber(
        sub,
        () => {
          s.done()
          sub.next((s = new Subject()))
        },
        doError,
        qu.noop
      )
    )
    return () => {
      s?.unsubscribe()
      s = null!
    }
  })
}

export function windowCount<T>(
  size: number,
  every = 0
): qt.OpFun<T, Observable<T>> {
  const startEvery = every > 0 ? every : size
  return operate((src, sub) => {
    let xs = [new Subject<T>()]
    let count = 0
    sub.next(xs[0]!.asObservable())
    src.subscribe(
      new OpSubscriber(
        sub,
        (x: T) => {
          for (const y of xs) {
            y.next(x)
          }
          const c = count - size + 1
          if (c >= 0 && c % startEvery === 0) xs.shift()!.done()
          if (++count % startEvery === 0) {
            const s = new Subject<T>()
            xs.push(s)
            sub.next(s.asObservable())
          }
        },
        x => {
          while (xs.length > 0) {
            xs.shift()!.error(x)
          }
          sub.error(x)
        },
        () => {
          while (xs.length > 0) {
            xs.shift()!.done()
          }
          sub.done()
        },
        () => {
          xs = null!
        }
      )
    )
  })
}
export function windowTime<T>(
  windowTimeSpan: number,
  s?: qt.Scheduler
): qt.OpFun<T, Observable<T>>
export function windowTime<T>(
  windowTimeSpan: number,
  windowCreationInterval: number,
  s?: qt.Scheduler
): qt.OpFun<T, Observable<T>>
export function windowTime<T>(
  windowTimeSpan: number,
  windowCreationInterval: number | null | void,
  maxWindowSize: number,
  s?: qt.Scheduler
): qt.OpFun<T, Observable<T>>
export function windowTime<T>(
  windowTimeSpan: number,
  ...xs: any[]
): qt.OpFun<T, Observable<T>> {
  const sched = Scheduler.pop(xs) ?? asyncSched
  const span = (xs[0] as number) ?? null
  const max = (xs[1] as number) || Infinity
  return operate((src, sub) => {
    let ws: WindowRecord<T>[] | null = []
    let restart = false
    const close = (x: { window: Subject<T>; subs: Subscription }) => {
      const { window, subs } = x
      window.done()
      subs.unsubscribe()
      qu.arrRemove(ws, x)
      restart && start()
    }
    const start = () => {
      if (ws) {
        const s = new Subscription()
        sub.add(s)
        const w = new Subject<T>()
        const y = { window: w, subs: s, seen: 0 }
        ws.push(y)
        sub.next(w.asObservable())
        sched.run(s, () => close(y), windowTimeSpan)
      }
    }
    if (span !== null && span >= 0) sched.run(sub, start, span, true)
    else restart = true
    start()
    const loop = (cb: (x: WindowRecord<T>) => void) => ws!.slice().forEach(cb)
    const done = (cb: (x: qt.Observer<any>) => void) => {
      loop(({ window }) => cb(window))
      cb(sub)
      sub.unsubscribe()
    }
    src.subscribe(
      new OpSubscriber(
        sub,
        (x: T) => {
          loop(x2 => {
            x2.window.next(x)
            max <= ++x2.seen && close(x2)
          })
        },
        x => done(x2 => x2.error(x)),
        () => done(x => x.done())
      )
    )
    return () => {
      ws = null!
    }
  })
}
interface WindowRecord<T> {
  seen: number
  window: Subject<T>
  subs: Subscription
}
export function windowToggle<T, O>(
  o: qt.ObsInput<O>,
  f: (x: O) => qt.ObsInput<any>
): qt.OpFun<T, Observable<T>> {
  return operate((src, sub) => {
    const ws: Subject<T>[] = []
    const doError = (x: any) => {
      while (0 < ws.length) {
        ws.shift()!.error(x)
      }
      sub.error(x)
    }
    innerFrom(o).subscribe(
      new OpSubscriber(
        sub,
        x => {
          const w = new Subject<T>()
          ws.push(w)
          const s = new Subscription()
          const close = () => {
            qu.arrRemove(ws, w)
            w.done()
            s.unsubscribe()
          }
          let notifier: Observable<any>
          try {
            notifier = innerFrom(f(x))
          } catch (err) {
            doError(err)
            return
          }
          sub.next(w.asObservable())
          s.add(
            notifier.subscribe(new OpSubscriber(sub, close, doError, qu.noop))
          )
        },
        qu.noop
      )
    )
    src.subscribe(
      new OpSubscriber(
        sub,
        (x: T) => {
          const ws2 = ws.slice()
          for (const w of ws2) {
            w.next(x)
          }
        },
        doError,
        () => {
          while (0 < ws.length) {
            ws.shift()!.done()
          }
          sub.done()
        },
        () => {
          while (0 < ws.length) {
            ws.shift()!.unsubscribe()
          }
        }
      )
    )
  })
}

export function windowWhen<T>(
  closingSelector: () => qt.ObsInput<any>
): qt.OpFun<T, Observable<T>> {
  return operate((src, sub) => {
    let w: Subject<T> | null
    let s: Subscriber<any> | undefined
    const doError = (x: any) => {
      w!.error(x)
      sub.error(x)
    }
    const open = () => {
      s?.unsubscribe()
      w?.done()
      w = new Subject<T>()
      sub.next(w.asObservable())
      let notifier: Observable<any>
      try {
        notifier = innerFrom(closingSelector())
      } catch (e) {
        doError(e)
        return
      }
      notifier.subscribe((s = new OpSubscriber(sub, open, doError, open)))
    }
    open()
    src.subscribe(
      new OpSubscriber(
        sub,
        x => w!.next(x),
        doError,
        () => {
          w!.done()
          sub.done()
        },
        () => {
          s?.unsubscribe()
          w = null!
        }
      )
    )
  })
}

export function withLatestFrom<T, R extends unknown[]>(
  ...xs: [...qt.InputTuple<R>]
): qt.OpFun<T, [T, ...R]>
export function withLatestFrom<T, O extends unknown[], R>(
  ...xs: [...qt.InputTuple<O>, (...xs: [T, ...O]) => R]
): qt.OpFun<T, R>
export function withLatestFrom<T, R>(...xs: any[]): qt.OpFun<T, R | any[]> {
  const sel = qu.popSelector(xs) as ((...xs: any[]) => R) | undefined
  return operate((src, sub) => {
    const len = xs.length
    const xs2 = new Array(len)
    let has = xs.map(() => false)
    let ready = false
    for (let i = 0; i < len; i++) {
      innerFrom(xs[i]).subscribe(
        new OpSubscriber(
          sub,
          x => {
            xs2[i] = x
            if (!ready && !has[i]) {
              has[i] = true
              ;(ready = has.every(qu.identity)) && (has = null!)
            }
          },
          qu.noop
        )
      )
    }
    src.subscribe(
      new OpSubscriber(sub, x => {
        if (ready) {
          const ys = [x, ...xs2]
          sub.next(sel ? sel(...ys) : ys)
        }
      })
    )
  })
}

export function zipAll<T>(): qt.OpFun<qt.ObsInput<T>, T[]>
export function zipAll<T>(): qt.OpFun<any, T[]>
export function zipAll<T, R>(f: (...xs: T[]) => R): qt.OpFun<qt.ObsInput<T>, R>
export function zipAll<R>(f: (...xs: Array<any>) => R): qt.OpFun<any, R>
export function zipAll<T, R>(f?: (...xs: T[]) => R) {
  return joinAllInternals(zip, f)
}

export function zipWith<T, A extends readonly unknown[]>(
  ...xs: [...qt.InputTuple<A>]
): qt.OpFun<T, qt.Cons<T, A>> {
  return _zip(...xs)
}

function _zip<T, R>(
  ...xs: Array<qt.ObsInput<any> | ((...xs: Array<any>) => R)>
): qt.OpFun<T, any> {
  return operate((src, sub) => {
    zip(src as qt.ObsInput<any>, ...(xs as Array<qt.ObsInput<any>>)).subscribe(
      sub
    )
  })
}
