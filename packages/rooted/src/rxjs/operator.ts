import { AsyncScheduler, stampProvider, Scheduler } from "./scheduler.js"
import { Note, observeNote } from "./note.js"
import { Observable, innerFrom, EMPTY, from, timer } from "./observable.js"
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

export class OperatorSubscriber<T> extends Subscriber<T> {
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
      ? function (this: OperatorSubscriber<T>, x: T) {
          try {
            onNext(x)
          } catch (e) {
            s.error(e)
          }
        }
      : super._next
    this._error = onError
      ? function (this: OperatorSubscriber<T>, x: any) {
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
      ? function (this: OperatorSubscriber<T>) {
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

export function audit<T>(f: (x: T) => qt.ObsInput<any>): qt.MonoTypeFun<T> {
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
      new OperatorSubscriber(
        sub,
        x => {
          has = true
          last = x
          if (!s) {
            innerFrom(f(x)).subscribe(
              (s = new OperatorSubscriber(sub, end, cleanup))
            )
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
  s: qt.Scheduler = new AsyncScheduler()
): qt.MonoTypeFun<T> {
  return audit(() => timer(x, s))
}

export function buffer<T>(o: Observable<any>): qt.OpFun<T, T[]> {
  return operate((src, sub) => {
    let xs: T[] = []
    src.subscribe(
      new OperatorSubscriber(
        sub,
        x => xs.push(x),
        () => {
          sub.next(xs)
          sub.done()
        }
      )
    )
    o.subscribe(
      new OperatorSubscriber(
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
      new OperatorSubscriber(
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
  const sched = Scheduler.pop(xs) ?? new AsyncScheduler()
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
    const bufferTimeSubscriber = new OperatorSubscriber(
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
      new OperatorSubscriber(
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
          s.add(
            innerFrom(f(x)).subscribe(
              new OperatorSubscriber(sub, emit, qu.noop)
            )
          )
        },
        qu.noop
      )
    )
    src.subscribe(
      new OperatorSubscriber(
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
      innerFrom(f()).subscribe((s = new OperatorSubscriber(sub, open, qu.noop)))
    }
    open()
    src.subscribe(
      new OperatorSubscriber(
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

export function catchError<T, O extends qt.ObsInput<any>>(
  f: (x: any, caught: Observable<T>) => O
): qt.OpFun<T, T | qt.ObsValueOf<O>>
export function catchError<T, O extends qt.ObsInput<any>>(
  f: (x: any, caught: Observable<T>) => O
): qt.OpFun<T, T | qt.ObsValueOf<O>> {
  return operate((src, sub) => {
    let s: Subscription | null = null
    let done = false
    let y: Observable<qt.ObsValueOf<O>>
    s = src.subscribe(
      new OperatorSubscriber(sub, undefined, undefined, x => {
        y = innerFrom(f(x, catchError(f)(src)))
        if (s) {
          s.unsubscribe()
          s = null
          y.subscribe(sub)
        } else done = true
      })
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
  const y = qu.popResultSelector(xs)
  return y
    ? qu.pipe(
        combineLatest(...(xs as Array<qt.ObsInput<any>>)),
        qu.mapOneOrManyArgs(y)
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

export function debounce<T>(f: (x: T) => qt.ObsInput<any>): qt.MonoTypeFun<T> {
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
      new OperatorSubscriber(
        sub,
        (x: T) => {
          s?.unsubscribe()
          has = true
          last = x
          s = new OperatorSubscriber(sub, emit, qu.noop)
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
  sched: qt.Scheduler = new AsyncScheduler()
): qt.MonoTypeFun<T> {
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
      new OperatorSubscriber(
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
      new OperatorSubscriber(
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
  sched: qt.Scheduler = new AsyncScheduler()
): qt.MonoTypeFun<T> {
  const y = timer(due, sched)
  return delayWhen(() => y)
}

export function delayWhen<T>(
  delayDurationSelector: (value: T, index: number) => Observable<any>,
  subscriptionDelay: Observable<any>
): qt.MonoTypeFun<T>
export function delayWhen<T>(
  delayDurationSelector: (value: T, index: number) => Observable<any>
): qt.MonoTypeFun<T>
export function delayWhen<T>(
  delayDurationSelector: (value: T, index: number) => Observable<any>,
  subscriptionDelay?: Observable<any>
): qt.MonoTypeFun<T> {
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
    src.subscribe(new OperatorSubscriber(sub, x => observeNote(x, sub)))
  })
}

export function distinct<T, K>(
  f?: (x: T) => K,
  o?: Observable<any>
): qt.MonoTypeFun<T> {
  return operate((src, sub) => {
    const ks = new Set()
    src.subscribe(
      new OperatorSubscriber(sub, x => {
        const k = f ? f(x) : x
        if (!ks.has(k)) {
          ks.add(k)
          sub.next(x)
        }
      })
    )
    o?.subscribe(new OperatorSubscriber(sub, () => ks.clear(), qu.noop))
  })
}

export function distinctUntilChanged<T>(
  comparator?: (previous: T, current: T) => boolean
): qt.MonoTypeFun<T>
export function distinctUntilChanged<T, K>(
  comparator: (previous: K, current: K) => boolean,
  keySelector: (value: T) => K
): qt.MonoTypeFun<T>
export function distinctUntilChanged<T, K>(
  comparator?: (previous: K, current: K) => boolean,
  keySelector: (value: T) => K = qu.identity as (value: T) => K
): qt.MonoTypeFun<T> {
  comparator = comparator ?? defaultCompare
  return operate((src, sub) => {
    let prev: K
    let first = true
    src.subscribe(
      new OperatorSubscriber(sub, x => {
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

export function distinctUntilKeyChanged<T>(key: keyof T): qt.MonoTypeFun<T>
export function distinctUntilKeyChanged<T, K extends keyof T>(
  key: K,
  compare: (x: T[K], y: T[K]) => boolean
): qt.MonoTypeFun<T>
export function distinctUntilKeyChanged<T, K extends keyof T>(
  key: K,
  compare?: (x: T[K], y: T[K]) => boolean
): qt.MonoTypeFun<T> {
  return distinctUntilChanged((x: T, y: T) =>
    compare ? compare(x[key], y[key]) : x[key] === y[key]
  )
}

export function elementAt<T, D = T>(
  index: number,
  defaultValue?: D
): qt.OpFun<T, T | D> {
  if (index < 0) {
    throw new qu.ArgumentOutOfRangeError()
  }
  const hasDefaultValue = arguments.length >= 2
  return (source: Observable<T>) =>
    source.pipe(
      filter((v, i) => i === index),
      take(1),
      hasDefaultValue
        ? defaultIfEmpty(defaultValue!)
        : throwIfEmpty(() => new qu.ArgumentOutOfRangeError())
    )
}

export function endWith<T>(scheduler: qt.Scheduler): qt.MonoTypeFun<T>
export function endWith<T, A extends unknown[] = T[]>(
  ...valuesAndScheduler: [...A, qt.Scheduler]
): qt.OpFun<T, T | qt.ValueFromArray<A>>
export function endWith<T, A extends unknown[] = T[]>(
  ...values: A
): qt.OpFun<T, T | qt.ValueFromArray<A>>
export function endWith<T>(
  ...values: Array<T | qt.Scheduler>
): qt.MonoTypeFun<T> {
  return (source: Observable<T>) =>
    concat(source, of(...values)) as Observable<T>
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
      new OperatorSubscriber(
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
      new OperatorSubscriber(
        sub,
        x => {
          if (!s) {
            s = new OperatorSubscriber(sub, undefined, () => {
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
  project: (value: T, index: number) => O,
  concurrent?: number,
  scheduler?: qt.Scheduler
): qt.OpFun<T, qt.ObsValueOf<O>>
export function expand<T, O extends qt.ObsInput<unknown>>(
  project: (value: T, index: number) => O,
  concurrent: number | undefined,
  scheduler: qt.Scheduler
): qt.OpFun<T, qt.ObsValueOf<O>>
export function expand<T, O extends qt.ObsInput<unknown>>(
  project: (value: T, index: number) => O,
  concurrent = Infinity,
  scheduler?: qt.Scheduler
): qt.OpFun<T, qt.ObsValueOf<O>> {
  concurrent = (concurrent || 0) < 1 ? Infinity : concurrent
  return operate((source, subscriber) =>
    mergeInternals(
      source,
      subscriber,
      project,
      concurrent,
      undefined,
      true,
      scheduler
    )
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
): qt.MonoTypeFun<T>
export function filter<T>(
  predicate: (value: T, index: number) => boolean
): qt.MonoTypeFun<T>
export function filter<T>(
  predicate: (value: T, index: number) => boolean,
  thisArg?: any
): qt.MonoTypeFun<T> {
  return operate((source, subscriber) => {
    let index = 0
    source.subscribe(
      new OperatorSubscriber(
        subscriber,
        value =>
          predicate.call(thisArg, value, index++) && subscriber.next(value)
      )
    )
  })
}
export function finalize<T>(callback: () => void): qt.MonoTypeFun<T> {
  return operate((source, subscriber) => {
    try {
      source.subscribe(subscriber)
    } finally {
      subscriber.add(callback)
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
      new OperatorSubscriber(
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
  return operate((source, subscriber) => {
    let element: ((value: any) => any) | void
    if (!elementOrOptions || typeof elementOrOptions === "function") {
      element = elementOrOptions as (value: any) => any
    } else {
      ;({ duration, element, connector } = elementOrOptions)
    }
    const groups = new Map<K, qt.SubjectLike<any>>()
    const notify = (cb: (group: qt.Observer<any>) => void) => {
      groups.forEach(cb)
      cb(subscriber)
    }
    const handleError = (err: any) => notify(consumer => consumer.error(err))
    let activeGroups = 0
    let teardownAttempted = false
    const groupBySourceSubscriber = new OperatorSubscriber(
      subscriber,
      (value: T) => {
        try {
          const key = keySelector(value)
          let group = groups.get(key)
          if (!group) {
            groups.set(
              key,
              (group = connector ? connector() : new Subject<any>())
            )
            const grouped = createGroupedObservable(key, group)
            subscriber.next(grouped)
            if (duration) {
              const durationSubscriber = new OperatorSubscriber(
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
          group.next(element ? element(value) : value)
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
    source.subscribe(groupBySourceSubscriber)
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
  return operate((source, subscriber) => {
    source.subscribe(new OperatorSubscriber(subscriber, qu.noop))
  })
}
export function isEmpty<T>(): qt.OpFun<T, boolean> {
  return operate((source, subscriber) => {
    source.subscribe(
      new OperatorSubscriber(
        subscriber,
        () => {
          subscriber.next(false)
          subscriber.done()
        },
        () => {
          subscriber.next(true)
          subscriber.done()
        }
      )
    )
  })
}
export function joinAllInternals<T, R>(
  joinFn: (sources: qt.ObsInput<T>[]) => Observable<T>,
  project?: (...args: any[]) => R
) {
  return qu.pipe(
    toArray() as qt.OpFun<qt.ObsInput<T>, qt.ObsInput<T>[]>,
    mergeMap(sources => joinFn(sources)),
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
  return operate((source, subscriber) => {
    let index = 0
    source.subscribe(
      new OperatorSubscriber(subscriber, (value: T) => {
        subscriber.next(project.call(thisArg, value, index++))
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
  return operate((source, subscriber) => {
    source.subscribe(
      new OperatorSubscriber(
        subscriber,
        value => {
          subscriber.next(Note.createNext(value))
        },
        () => {
          subscriber.next(Note.createDone())
          subscriber.done()
        },
        err => {
          subscriber.next(Note.createError(err))
          subscriber.done()
        }
      )
    )
  })
}
export function max<T>(comparer?: (x: T, y: T) => number): qt.MonoTypeFun<T> {
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
  return operate((source, subscriber) => {
    mergeAll(concurrent)(
      from([source, ...(xs as qt.ObsInput<T>[])], sched)
    ).subscribe(subscriber)
  })
}
export function mergeAll<O extends qt.ObsInput<any>>(
  concurrent: number = Infinity
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
      new OperatorSubscriber(
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
    new OperatorSubscriber(subscriber, outerNext, () => {
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
  concurrent: number = Infinity
): qt.OpFun<T, qt.ObsValueOf<O> | R> {
  if (qu.isFunction(resultSelector)) {
    return mergeMap(
      (a, i) =>
        map((b: any, ii: number) => resultSelector(a, b, i, ii))(
          innerFrom(project(a, i))
        ),
      concurrent
    )
  } else if (typeof resultSelector === "number") {
    concurrent = resultSelector
  }
  return operate((source, subscriber) =>
    mergeInternals(source, subscriber, project, concurrent)
  )
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
  concurrent: number = Infinity
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
  return operate((source, subscriber) => {
    let state = seed
    return mergeInternals(
      source,
      subscriber,
      (value, index) => accumulator(state, value, index),
      concurrent,
      value => {
        state = value
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
export function min<T>(comparer?: (x: T, y: T) => number): qt.MonoTypeFun<T> {
  return reduce(
    qu.isFunction(comparer)
      ? (x, y) => (comparer(x, y) < 0 ? x : y)
      : (x, y) => (x < y ? x : y)
  )
}

export function observeOn<T>(
  scheduler: qt.Scheduler,
  delay = 0
): qt.MonoTypeFun<T> {
  return operate((source, subscriber) => {
    source.subscribe(
      new OperatorSubscriber(
        subscriber,
        value => scheduler.run(subscriber, () => subscriber.next(value), delay),
        () => scheduler.run(subscriber, () => subscriber.done(), delay),
        err => scheduler.run(subscriber, () => subscriber.error(err), delay)
      )
    )
  })
}
export function onErrorResumeNext<T, A extends readonly unknown[]>(
  sources: [...qt.InputTuple<A>]
): qt.OpFun<T, T | A[number]>
export function onErrorResumeNext<T, A extends readonly unknown[]>(
  ...sources: [...qt.InputTuple<A>]
): qt.OpFun<T, T | A[number]>
export function onErrorResumeNext<T, A extends readonly unknown[]>(
  ...sources: [[...qt.InputTuple<A>]] | [...qt.InputTuple<A>]
): qt.OpFun<T, T | A[number]> {
  const nextSources = qu.argsOrArgArray(sources) as unknown as qt.InputTuple<A>
  return operate((source, subscriber) => {
    const remaining = [source, ...nextSources]
    const subscribeNext = () => {
      if (!subscriber.closed) {
        if (remaining.length > 0) {
          let nextSource: Observable<A[number]>
          try {
            nextSource = innerFrom(remaining.shift()!)
          } catch (err) {
            subscribeNext()
            return
          }
          const innerSub = new OperatorSubscriber(
            subscriber,
            undefined,
            qu.noop,
            qu.noop
          )
          nextSource.subscribe(innerSub)
          innerSub.add(subscribeNext)
        } else {
          subscriber.done()
        }
      }
    }
    subscribeNext()
  })
}
export function pairwise<T>(): qt.OpFun<T, [T, T]> {
  return operate((source, subscriber) => {
    let prev: T
    let hasPrev = false
    source.subscribe(
      new OperatorSubscriber(subscriber, value => {
        const p = prev
        prev = value
        hasPrev && subscriber.next([p, value])
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
export function publish<T, O extends qt.ObsInput<any>>(
  selector: (shared: Observable<T>) => O
): qt.OpFun<T, qt.ObsValueOf<O>>
export function publish<T, R>(
  selector?: qt.OpFun<T, R>
): qt.MonoTypeFun<T> | qt.OpFun<T, R> {
  return selector
    ? source => connect(selector)(source)
    : source => multicast(new Subject<T>())(source)
}
export function publishBehavior<T>(
  initialValue: T
): qt.UnaryFun<Observable<T>, ConnectableObservable<T>> {
  return source => {
    const subject = new BehaviorSubject<T>(initialValue)
    return new ConnectableObservable(source, () => subject)
  }
}
export function publishLast<T>(): qt.UnaryFun<
  Observable<T>,
  ConnectableObservable<T>
> {
  return source => {
    const subject = new AsyncSubject<T>()
    return new ConnectableObservable(source, () => subject)
  }
}
export function publishReplay<T>(
  bufferSize?: number,
  windowTime?: number,
  timestampProvider?: qt.TimestampProvider
): qt.MonoTypeFun<T>
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
  return (source: Observable<T>) =>
    multicast(
      new ReplaySubject<T>(bufferSize, windowTime, timestampProvider),
      selector!
    )(source)
}
export function race<T, A extends readonly unknown[]>(
  otherSources: [...qt.InputTuple<A>]
): qt.OpFun<T, T | A[number]>
export function race<T, A extends readonly unknown[]>(
  ...otherSources: [...qt.InputTuple<A>]
): qt.OpFun<T, T | A[number]>
export function race<T>(...args: any[]): qt.OpFun<T, unknown> {
  return raceWith(...qu.argsOrArgArray(args))
}
export function raceWith<T, A extends readonly unknown[]>(
  ...otherSources: [...qt.InputTuple<A>]
): qt.OpFun<T, T | A[number]> {
  return !otherSources.length
    ? qu.identity
    : operate((source, subscriber) => {
        raceInit<T | A[number]>([source, ...otherSources])(subscriber)
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
export function refCount<T>(): qt.MonoTypeFun<T> {
  return operate((source, subscriber) => {
    let connection: Subscription | null = null
    ;(source as any)._refCount++
    const refCounter = new OperatorSubscriber(
      subscriber,
      undefined,
      undefined,
      undefined,
      () => {
        if (
          !source ||
          (source as any)._refCount <= 0 ||
          0 < --(source as any)._refCount
        ) {
          connection = null
          return
        }
        const sharedConnection = (source as any)._connection
        const conn = connection
        connection = null
        if (sharedConnection && (!conn || sharedConnection === conn)) {
          sharedConnection.unsubscribe()
        }
        subscriber.unsubscribe()
      }
    )
    source.subscribe(refCounter)
    if (!refCounter.closed) {
      connection = (source as ConnectableObservable<T>).connect()
    }
  })
}
export interface RepeatConfig {
  count?: number
  delay?: number | ((count: number) => qt.ObsInput<any>)
}
export function repeat<T>(
  countOrConfig?: number | RepeatConfig
): qt.MonoTypeFun<T> {
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
    : operate((source, subscriber) => {
        let soFar = 0
        let sourceSub: Subscription | null
        const resubscribe = () => {
          sourceSub?.unsubscribe()
          sourceSub = null
          if (delay != null) {
            const notifier =
              typeof delay === "number" ? timer(delay) : innerFrom(delay(soFar))
            const notifierSubscriber = new OperatorSubscriber(
              subscriber,
              () => {
                notifierSubscriber.unsubscribe()
                subscribeToSource()
              }
            )
            notifier.subscribe(notifierSubscriber)
          } else {
            subscribeToSource()
          }
        }
        const subscribeToSource = () => {
          let syncUnsub = false
          sourceSub = source.subscribe(
            new OperatorSubscriber(subscriber, undefined, () => {
              if (++soFar < count) {
                if (sourceSub) {
                  resubscribe()
                } else {
                  syncUnsub = true
                }
              } else {
                subscriber.done()
              }
            })
          )
          if (syncUnsub) {
            resubscribe()
          }
        }
        subscribeToSource()
      })
}
export function repeatWhen<T>(
  notifier: (notes: Observable<void>) => Observable<any>
): qt.MonoTypeFun<T> {
  return operate((source, subscriber) => {
    let innerSub: Subscription | null
    let syncResub = false
    let completions$: Subject<void>
    let isNotifierDone = false
    let isMainDone = false
    const checkDone = () =>
      isMainDone && isNotifierDone && (subscriber.done(), true)
    const getCompletionSubject = () => {
      if (!completions$) {
        completions$ = new Subject()
        notifier(completions$).subscribe(
          new OperatorSubscriber(
            subscriber,
            () => {
              if (innerSub) {
                subscribeForRepeatWhen()
              } else {
                syncResub = true
              }
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
      innerSub = source.subscribe(
        new OperatorSubscriber(subscriber, undefined, () => {
          isMainDone = true
          !checkDone() && getCompletionSubject().next()
        })
      )
      if (syncResub) {
        innerSub.unsubscribe()
        innerSub = null
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
export function retry<T>(count?: number): qt.MonoTypeFun<T>
export function retry<T>(config: RetryConfig): qt.MonoTypeFun<T>
export function retry<T>(
  configOrCount: number | RetryConfig = Infinity
): qt.MonoTypeFun<T> {
  let config: RetryConfig
  if (configOrCount && typeof configOrCount === "object") {
    config = configOrCount
  } else {
    config = {
      count: configOrCount as number,
    }
  }
  const {
    count = Infinity,
    delay,
    resetOnSuccess: resetOnSuccess = false,
  } = config
  return count <= 0
    ? qu.identity
    : operate((source, subscriber) => {
        let soFar = 0
        let innerSub: Subscription | null
        const subscribeForRetry = () => {
          let syncUnsub = false
          innerSub = source.subscribe(
            new OperatorSubscriber(
              subscriber,
              value => {
                if (resetOnSuccess) {
                  soFar = 0
                }
                subscriber.next(value)
              },
              undefined,
              err => {
                if (soFar++ < count) {
                  const resub = () => {
                    if (innerSub) {
                      innerSub.unsubscribe()
                      innerSub = null
                      subscribeForRetry()
                    } else {
                      syncUnsub = true
                    }
                  }
                  if (delay != null) {
                    const notifier =
                      typeof delay === "number"
                        ? timer(delay)
                        : innerFrom(delay(err, soFar))
                    const notifierSubscriber = new OperatorSubscriber(
                      subscriber,
                      () => {
                        notifierSubscriber.unsubscribe()
                        resub()
                      },
                      () => {
                        subscriber.done()
                      }
                    )
                    notifier.subscribe(notifierSubscriber)
                  } else {
                    resub()
                  }
                } else {
                  subscriber.error(err)
                }
              }
            )
          )
          if (syncUnsub) {
            innerSub.unsubscribe()
            innerSub = null
            subscribeForRetry()
          }
        }
        subscribeForRetry()
      })
}
export function retryWhen<T>(
  notifier: (errors: Observable<any>) => Observable<any>
): qt.MonoTypeFun<T> {
  return operate((source, subscriber) => {
    let innerSub: Subscription | null
    let syncResub = false
    let errors$: Subject<any>
    const subscribeForRetryWhen = () => {
      innerSub = source.subscribe(
        new OperatorSubscriber(subscriber, undefined, undefined, err => {
          if (!errors$) {
            errors$ = new Subject()
            notifier(errors$).subscribe(
              new OperatorSubscriber(subscriber, () =>
                innerSub ? subscribeForRetryWhen() : (syncResub = true)
              )
            )
          }
          if (errors$) {
            errors$.next(err)
          }
        })
      )
      if (syncResub) {
        innerSub.unsubscribe()
        innerSub = null
        syncResub = false
        subscribeForRetryWhen()
      }
    }
    subscribeForRetryWhen()
  })
}
export function sample<T>(notifier: Observable<any>): qt.MonoTypeFun<T> {
  return operate((source, subscriber) => {
    let has = false
    let lastValue: T | null = null
    source.subscribe(
      new OperatorSubscriber(subscriber, value => {
        has = true
        lastValue = value
      })
    )
    notifier.subscribe(
      new OperatorSubscriber(
        subscriber,
        () => {
          if (has) {
            has = false
            const value = lastValue!
            lastValue = null
            subscriber.next(value)
          }
        },
        qu.noop
      )
    )
  })
}
export function sampleTime<T>(
  period: number,
  scheduler: qt.Scheduler = AsyncScheduler
): qt.MonoTypeFun<T> {
  return sample(interval(period, scheduler))
}
export function scan<V, A = V>(
  accumulator: (acc: A | V, value: V, index: number) => A
): qt.OpFun<V, V | A>
export function scan<V, A>(
  accumulator: (acc: A, value: V, index: number) => A,
  seed: A
): qt.OpFun<V, A>
export function scan<V, A, S>(
  accumulator: (acc: A | S, value: V, index: number) => A,
  seed: S
): qt.OpFun<V, A>
export function scan<V, A, S>(
  accumulator: (acc: V | A | S, value: V, index: number) => A,
  seed?: S
): qt.OpFun<V, V | A> {
  return operate(
    scanInternals(accumulator, seed as S, arguments.length >= 2, true)
  )
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
      new OperatorSubscriber(
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
  return operate((source, subscriber) => {
    const aState = createState<T>()
    const bState = createState<T>()
    const emit = (isEqual: boolean) => {
      subscriber.next(isEqual)
      subscriber.done()
    }
    const createSubscriber = (
      selfState: SequenceState<T>,
      otherState: SequenceState<T>
    ) => {
      const sequenceEqualSubscriber = new OperatorSubscriber(
        subscriber,
        (a: T) => {
          const { buffer, done } = otherState
          if (buffer.length === 0) {
            done ? emit(false) : selfState.buffer.push(a)
          } else {
            !comparator(a, buffer.shift()!) && emit(false)
          }
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
    source.subscribe(createSubscriber(aState, bState))
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
  resetOnError?: boolean | ((error: any) => Observable<any>)
  resetOnDone?: boolean | (() => Observable<any>)
  resetOnRefCountZero?: boolean | (() => Observable<any>)
}
export function share<T>(): qt.MonoTypeFun<T>
export function share<T>(options: ShareConfig<T>): qt.MonoTypeFun<T>
export function share<T>(options: ShareConfig<T> = {}): qt.MonoTypeFun<T> {
  const {
    connector = () => new Subject<T>(),
    resetOnError = true,
    resetOnDone = true,
    resetOnRefCountZero = true,
  } = options
  return wrapperSource => {
    let connection: SafeSubscriber<T> | undefined
    let resetConnection: Subscription | undefined
    let subject: qt.SubjectLike<T> | undefined
    let refCount = 0
    let hasDoned = false
    let hasErrored = false
    const cancelReset = () => {
      resetConnection?.unsubscribe()
      resetConnection = undefined
    }
    const reset = () => {
      cancelReset()
      connection = subject = undefined
      hasDoned = hasErrored = false
    }
    const resetAndUnsubscribe = () => {
      const conn = connection
      reset()
      conn?.unsubscribe()
    }
    return qu.operate<T, T>((source, subscriber) => {
      refCount++
      if (!hasErrored && !hasDoned) {
        cancelReset()
      }
      const dest = (subject = subject ?? connector())
      subscriber.add(() => {
        refCount--
        if (refCount === 0 && !hasErrored && !hasDoned) {
          resetConnection = handleReset(
            resetAndUnsubscribe,
            resetOnRefCountZero
          )
        }
      })
      dest.subscribe(subscriber)
      if (!connection && refCount > 0) {
        connection = new SafeSubscriber({
          next: value => dest.next(value),
          error: err => {
            hasErrored = true
            cancelReset()
            resetConnection = handleReset(reset, resetOnError, err)
            dest.error(err)
          },
          done: () => {
            hasDoned = true
            cancelReset()
            resetConnection = handleReset(reset, resetOnDone)
            dest.done()
          },
        })
        innerFrom(source).subscribe(connection)
      }
    })(wrapperSource)
  }
}
function handleReset<T extends unknown[] = never[]>(
  reset: () => void,
  on: boolean | ((...args: T) => Observable<any>),
  ...args: T
): Subscription | undefined {
  if (on === true) {
    reset()
    return
  }
  if (on === false) {
    return
  }
  const onSubscriber = new SafeSubscriber({
    next: () => {
      onSubscriber.unsubscribe()
      reset()
    },
  })
  return on(...args).subscribe(onSubscriber)
}
export interface ShareReplayConfig {
  bufferSize?: number
  windowTime?: number
  refCount: boolean
  scheduler?: qt.Scheduler
}
export function shareReplay<T>(config: ShareReplayConfig): qt.MonoTypeFun<T>
export function shareReplay<T>(
  bufferSize?: number,
  windowTime?: number,
  scheduler?: qt.Scheduler
): qt.MonoTypeFun<T>
export function shareReplay<T>(
  configOrBufferSize?: ShareReplayConfig | number,
  windowTime?: number,
  scheduler?: qt.Scheduler
): qt.MonoTypeFun<T> {
  let bufferSize: number
  let refCount = false
  if (configOrBufferSize && typeof configOrBufferSize === "object") {
    ;({
      bufferSize = Infinity,
      windowTime = Infinity,
      refCount = false,
      scheduler,
    } = configOrBufferSize)
  } else {
    bufferSize = (configOrBufferSize ?? Infinity) as number
  }
  return share<T>({
    connector: () => new ReplaySubject(bufferSize, windowTime, scheduler),
    resetOnError: true,
    resetOnDone: false,
    resetOnRefCountZero: refCount,
  })
}
export function single<T>(
  predicate: BooleanConstructor
): qt.OpFun<T, qt.TruthyTypesOf<T>>
export function single<T>(
  predicate?: (value: T, index: number, source: Observable<T>) => boolean
): qt.MonoTypeFun<T>
export function single<T>(
  predicate?: (value: T, index: number, source: Observable<T>) => boolean
): qt.MonoTypeFun<T> {
  return operate((source, subscriber) => {
    let has = false
    let singleValue: T
    let seenValue = false
    let index = 0
    source.subscribe(
      new OperatorSubscriber(
        subscriber,
        value => {
          seenValue = true
          if (!predicate || predicate(value, index++, source)) {
            has &&
              subscriber.error(new qu.SequenceError("Too many matching values"))
            has = true
            singleValue = value
          }
        },
        () => {
          if (has) {
            subscriber.next(singleValue)
            subscriber.done()
          } else {
            subscriber.error(
              seenValue
                ? new qu.NotFoundError("No matching values")
                : new qu.EmptyError()
            )
          }
        }
      )
    )
  })
}
export function skip<T>(count: number): qt.MonoTypeFun<T> {
  return filter((_, index) => count <= index)
}
export function skipLast<T>(skipCount: number): qt.MonoTypeFun<T> {
  return skipCount <= 0
    ? qu.identity
    : operate((source, subscriber) => {
        let ring: T[] = new Array(skipCount)
        let seen = 0
        source.subscribe(
          new OperatorSubscriber(subscriber, value => {
            const valueIndex = seen++
            if (valueIndex < skipCount) {
              ring[valueIndex] = value
            } else {
              const index = valueIndex % skipCount
              const oldValue = ring[index]
              ring[index] = value
              subscriber.next(oldValue)
            }
          })
        )
        return () => {
          ring = null!
        }
      })
}
export function skipUntil<T>(notifier: Observable<any>): qt.MonoTypeFun<T> {
  return operate((source, subscriber) => {
    let taking = false
    const skipSubscriber = new OperatorSubscriber(
      subscriber,
      () => {
        skipSubscriber?.unsubscribe()
        taking = true
      },
      qu.noop
    )
    innerFrom(notifier).subscribe(skipSubscriber)
    source.subscribe(
      new OperatorSubscriber(
        subscriber,
        value => taking && subscriber.next(value)
      )
    )
  })
}
export function skipWhile<T>(
  predicate: BooleanConstructor
): qt.OpFun<T, Extract<T, qt.Falsy> extends never ? never : T>
export function skipWhile<T>(
  predicate: (value: T, index: number) => true
): qt.OpFun<T, never>
export function skipWhile<T>(
  predicate: (value: T, index: number) => boolean
): qt.MonoTypeFun<T>
export function skipWhile<T>(
  predicate: (value: T, index: number) => boolean
): qt.MonoTypeFun<T> {
  return operate((source, subscriber) => {
    let taking = false
    let index = 0
    source.subscribe(
      new OperatorSubscriber(
        subscriber,
        value =>
          (taking || (taking = !predicate(value, index++))) &&
          subscriber.next(value)
      )
    )
  })
}
export function startWith<T>(value: null): qt.OpFun<T, T | null>
export function startWith<T>(value: undefined): qt.OpFun<T, T | undefined>
export function startWith<T, A extends readonly unknown[] = T[]>(
  ...valuesAndScheduler: [...A, qt.Scheduler]
): qt.OpFun<T, T | qt.ValueFromArray<A>>
export function startWith<T, A extends readonly unknown[] = T[]>(
  ...values: A
): qt.OpFun<T, T | qt.ValueFromArray<A>>
export function startWith<T, D>(...xs: D[]): qt.OpFun<T, T | D> {
  const sched = Scheduler.pop(xs)
  return operate((source, subscriber) => {
    ;(sched ? concat(xs, source, sched) : concat(xs, source)).subscribe(
      subscriber
    )
  })
}
export function subscribeOn<T>(
  scheduler: qt.Scheduler,
  delay = 0
): qt.MonoTypeFun<T> {
  return operate((source, subscriber) => {
    subscriber.add(
      scheduler.schedule(() => source.subscribe(subscriber), delay)
    )
  })
}
export function switchAll<O extends qt.ObsInput<any>>(): qt.OpFun<
  O,
  qt.ObsValueOf<O>
> {
  return switchMap(qu.identity)
}
export function switchMap<T, O extends qt.ObsInput<any>>(
  project: (value: T, index: number) => O
): qt.OpFun<T, qt.ObsValueOf<O>>
export function switchMap<T, O extends qt.ObsInput<any>>(
  project: (value: T, index: number) => O,
  resultSelector: undefined
): qt.OpFun<T, qt.ObsValueOf<O>>
export function switchMap<T, R, O extends qt.ObsInput<any>>(
  project: (value: T, index: number) => O,
  resultSelector: (
    outerValue: T,
    innerValue: qt.ObsValueOf<O>,
    outerIndex: number,
    innerIndex: number
  ) => R
): qt.OpFun<T, R>
export function switchMap<T, R, O extends qt.ObsInput<any>>(
  project: (value: T, index: number) => O,
  resultSelector?: (
    outerValue: T,
    innerValue: qt.ObsValueOf<O>,
    outerIndex: number,
    innerIndex: number
  ) => R
): qt.OpFun<T, qt.ObsValueOf<O> | R> {
  return operate((source, subscriber) => {
    let innerSubscriber: Subscriber<qt.ObsValueOf<O>> | null = null
    let index = 0
    let done = false
    const checkDone = () => done && !innerSubscriber && subscriber.done()
    source.subscribe(
      new OperatorSubscriber(
        subscriber,
        value => {
          innerSubscriber?.unsubscribe()
          let innerIndex = 0
          const outerIndex = index++
          innerFrom(project(value, outerIndex)).subscribe(
            (innerSubscriber = new OperatorSubscriber(
              subscriber,
              innerValue =>
                subscriber.next(
                  resultSelector
                    ? resultSelector(
                        value,
                        innerValue,
                        outerIndex,
                        innerIndex++
                      )
                    : innerValue
                ),
              () => {
                innerSubscriber = null!
                checkDone()
              }
            ))
          )
        },
        () => {
          done = true
          checkDone()
        }
      )
    )
  })
}
export function switchMapTo<O extends qt.ObsInput<unknown>>(
  observable: O
): qt.OpFun<unknown, qt.ObsValueOf<O>>
export function switchMapTo<O extends qt.ObsInput<unknown>>(
  observable: O,
  resultSelector: undefined
): qt.OpFun<unknown, qt.ObsValueOf<O>>
export function switchMapTo<T, R, O extends qt.ObsInput<unknown>>(
  observable: O,
  resultSelector: (
    outerValue: T,
    innerValue: qt.ObsValueOf<O>,
    outerIndex: number,
    innerIndex: number
  ) => R
): qt.OpFun<T, R>
export function switchMapTo<T, R, O extends qt.ObsInput<unknown>>(
  innerObservable: O,
  resultSelector?: (
    outerValue: T,
    innerValue: qt.ObsValueOf<O>,
    outerIndex: number,
    innerIndex: number
  ) => R
): qt.OpFun<T, qt.ObsValueOf<O> | R> {
  return qu.isFunction(resultSelector)
    ? switchMap(() => innerObservable, resultSelector)
    : switchMap(() => innerObservable)
}
export function switchScan<T, R, O extends qt.ObsInput<any>>(
  accumulator: (acc: R, value: T, index: number) => O,
  seed: R
): qt.OpFun<T, qt.ObsValueOf<O>> {
  return operate((source, subscriber) => {
    let state = seed
    switchMap(
      (value: T, index) => accumulator(state, value, index),
      (_, innerValue) => ((state = innerValue), innerValue)
    )(source).subscribe(subscriber)
    return () => {
      state = null!
    }
  })
}
export function take<T>(count: number): qt.MonoTypeFun<T> {
  return count <= 0
    ? () => EMPTY
    : operate((source, subscriber) => {
        let seen = 0
        source.subscribe(
          new OperatorSubscriber(subscriber, value => {
            if (++seen <= count) {
              subscriber.next(value)
              if (count <= seen) {
                subscriber.done()
              }
            }
          })
        )
      })
}
export function takeLast<T>(count: number): qt.MonoTypeFun<T> {
  return count <= 0
    ? () => EMPTY
    : operate((source, subscriber) => {
        let buffer: T[] = []
        source.subscribe(
          new OperatorSubscriber(
            subscriber,
            value => {
              buffer.push(value)
              count < buffer.length && buffer.shift()
            },
            () => {
              for (const value of buffer) {
                subscriber.next(value)
              }
              subscriber.done()
            },
            undefined,
            () => {
              buffer = null!
            }
          )
        )
      })
}
export function takeUntil<T>(notifier: qt.ObsInput<any>): qt.MonoTypeFun<T> {
  return operate((source, subscriber) => {
    innerFrom(notifier).subscribe(
      new OperatorSubscriber(subscriber, () => subscriber.done(), qu.noop)
    )
    !subscriber.closed && source.subscribe(subscriber)
  })
}
export function takeWhile<T>(
  predicate: BooleanConstructor,
  inclusive: true
): qt.MonoTypeFun<T>
export function takeWhile<T>(
  predicate: BooleanConstructor,
  inclusive: false
): qt.OpFun<T, qt.TruthyTypesOf<T>>
export function takeWhile<T>(
  predicate: BooleanConstructor
): qt.OpFun<T, qt.TruthyTypesOf<T>>
export function takeWhile<T, S extends T>(
  predicate: (value: T, index: number) => value is S
): qt.OpFun<T, S>
export function takeWhile<T, S extends T>(
  predicate: (value: T, index: number) => value is S,
  inclusive: false
): qt.OpFun<T, S>
export function takeWhile<T>(
  predicate: (value: T, index: number) => boolean,
  inclusive?: boolean
): qt.MonoTypeFun<T>
export function takeWhile<T>(
  predicate: (value: T, index: number) => boolean,
  inclusive = false
): qt.MonoTypeFun<T> {
  return operate((source, subscriber) => {
    let index = 0
    source.subscribe(
      new OperatorSubscriber(subscriber, value => {
        const result = predicate(value, index++)
        ;(result || inclusive) && subscriber.next(value)
        !result && subscriber.done()
      })
    )
  })
}
export interface TapObserver<T> extends qt.Observer<T> {
  subscribe: () => void
  unsubscribe: () => void
  finalize: () => void
}
export function tap<T>(observer?: Partial<TapObserver<T>>): qt.MonoTypeFun<T>
export function tap<T>(next: (value: T) => void): qt.MonoTypeFun<T>
export function tap<T>(
  next?: ((value: T) => void) | null,
  error?: ((error: any) => void) | null,
  done?: (() => void) | null
): qt.MonoTypeFun<T>
export function tap<T>(
  observerOrNext?: Partial<TapObserver<T>> | ((value: T) => void) | null,
  error?: ((e: any) => void) | null,
  done?: (() => void) | null
): qt.MonoTypeFun<T> {
  const tapObserver =
    qu.isFunction(observerOrNext) || error || done
      ? ({
          next: observerOrNext as Exclude<
            typeof observerOrNext,
            Partial<TapObserver<T>>
          >,
          error,
          done,
        } as Partial<TapObserver<T>>)
      : observerOrNext
  return tapObserver
    ? operate((source, subscriber) => {
        tapObserver.subscribe?.()
        let isUnsub = true
        source.subscribe(
          new OperatorSubscriber(
            subscriber,
            value => {
              tapObserver.next?.(value)
              subscriber.next(value)
            },
            () => {
              isUnsub = false
              tapObserver.done?.()
              subscriber.done()
            },
            err => {
              isUnsub = false
              tapObserver.error?.(err)
              subscriber.error(err)
            },
            () => {
              if (isUnsub) {
                tapObserver.unsubscribe?.()
              }
              tapObserver.finalize?.()
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
  durationSelector: (value: T) => qt.ObsInput<any>,
  config: ThrottleConfig = defaultThrottleConfig
): qt.MonoTypeFun<T> {
  return operate((source, subscriber) => {
    const { leading, trailing } = config
    let has = false
    let sendValue: T | null = null
    let throttled: Subscription | null = null
    let done = false
    const endThrottling = () => {
      throttled?.unsubscribe()
      throttled = null
      if (trailing) {
        send()
        done && subscriber.done()
      }
    }
    const cleanupThrottling = () => {
      throttled = null
      done && subscriber.done()
    }
    const startThrottle = (value: T) =>
      (throttled = innerFrom(durationSelector(value)).subscribe(
        new OperatorSubscriber(subscriber, endThrottling, cleanupThrottling)
      ))
    const send = () => {
      if (has) {
        has = false
        const value = sendValue!
        sendValue = null
        subscriber.next(value)
        !done && startThrottle(value)
      }
    }
    source.subscribe(
      new OperatorSubscriber(
        subscriber,
        value => {
          has = true
          sendValue = value
          !(throttled && !throttled.closed) &&
            (leading ? send() : startThrottle(value))
        },
        () => {
          done = true
          !(trailing && has && throttled && !throttled.closed) &&
            subscriber.done()
        }
      )
    )
  })
}
export function throttleTime<T>(
  duration: number,
  scheduler: qt.Scheduler = AsyncScheduler,
  config = defaultThrottleConfig
): qt.MonoTypeFun<T> {
  const duration$ = timer(duration, scheduler)
  return throttle(() => duration$, config)
}
export function throwIfEmpty<T>(
  errorFactory: () => any = defaultErrorFactory
): qt.MonoTypeFun<T> {
  return operate((source, subscriber) => {
    let has = false
    source.subscribe(
      new OperatorSubscriber(
        subscriber,
        value => {
          has = true
          subscriber.next(value)
        },
        () => (has ? subscriber.done() : subscriber.error(errorFactory()))
      )
    )
  })
}
function defaultErrorFactory() {
  return new qu.EmptyError()
}
export function timeInterval<T>(
  scheduler: qt.Scheduler = AsyncScheduler
): qt.OpFun<T, TimeInterval<T>> {
  return operate((source, subscriber) => {
    let last = scheduler.now()
    source.subscribe(
      new OperatorSubscriber(subscriber, value => {
        const now = scheduler.now()
        const interval = now - last
        last = now
        subscriber.next(new TimeInterval(value, interval))
      })
    )
  })
}
export class TimeInterval<T> {
  constructor(public value: T, public interval: number) {}
}
export interface TimeoutConfig<
  T,
  O extends qt.ObsInput<unknown> = qt.ObsInput<T>,
  M = unknown
> {
  each?: number
  first?: number | Date
  scheduler?: qt.Scheduler
  with?: (info: TimeoutInfo<T, M>) => O
  meta?: M
}
export interface TimeoutInfo<T, M = unknown> {
  readonly meta: M
  readonly seen: number
  readonly lastValue: T | null
}
export interface TimeoutError<T = unknown, M = unknown> extends Error {
  info: TimeoutInfo<T, M> | null
}
export interface TimeoutErrorCtor {
  new <T = unknown, M = unknown>(info?: TimeoutInfo<T, M>): TimeoutError<T, M>
}
export const TimeoutError: TimeoutErrorCtor = qu.createErrorClass(
  _super =>
    function TimeoutErrorImpl(this: any, info: TimeoutInfo<any> | null = null) {
      _super(this)
      this.message = "Timeout has occurred"
      this.name = "TimeoutError"
      this.info = info
    }
)
export function timeout<T, O extends qt.ObsInput<unknown>, M = unknown>(
  config: TimeoutConfig<T, O, M> & { with: (info: TimeoutInfo<T, M>) => O }
): qt.OpFun<T, T | qt.ObsValueOf<O>>
export function timeout<T, M = unknown>(
  config: Omit<TimeoutConfig<T, any, M>, "with">
): qt.OpFun<T, T>
export function timeout<T>(
  first: Date,
  scheduler?: qt.Scheduler
): qt.MonoTypeFun<T>
export function timeout<T>(
  each: number,
  scheduler?: qt.Scheduler
): qt.MonoTypeFun<T>
export function timeout<T, O extends qt.ObsInput<any>, M>(
  config: number | Date | TimeoutConfig<T, O, M>,
  schedulerArg?: qt.Scheduler
): qt.OpFun<T, T | qt.ObsValueOf<O>> {
  const {
    first,
    each,
    with: _with = timeoutErrorFactory,
    scheduler = schedulerArg ?? AsyncScheduler,
    meta = null!,
  } = (
    qu.isValidDate(config)
      ? { first: config }
      : typeof config === "number"
      ? { each: config }
      : config
  ) as TimeoutConfig<T, O, M>
  if (first == null && each == null) {
    throw new TypeError("No timeout provided.")
  }
  return operate((source, subscriber) => {
    let originalSourceSubscription: Subscription
    let timerSubscription: Subscription
    let lastValue: T | null = null
    let seen = 0
    const startTimer = (delay: number) => {
      timerSubscription = scheduler.run(
        subscriber,
        () => {
          try {
            originalSourceSubscription.unsubscribe()
            innerFrom(
              _with!({
                meta,
                lastValue,
                seen,
              })
            ).subscribe(subscriber)
          } catch (err) {
            subscriber.error(err)
          }
        },
        delay
      )
    }
    originalSourceSubscription = source.subscribe(
      new OperatorSubscriber(
        subscriber,
        (value: T) => {
          timerSubscription?.unsubscribe()
          seen++
          subscriber.next((lastValue = value))
          each! > 0 && startTimer(each!)
        },
        undefined,
        undefined,
        () => {
          if (!timerSubscription?.closed) {
            timerSubscription?.unsubscribe()
          }
          lastValue = null
        }
      )
    )
    !seen &&
      startTimer(
        first != null
          ? typeof first === "number"
            ? first
            : +first - scheduler!.now()
          : each!
      )
  })
}
function timeoutErrorFactory(info: TimeoutInfo<any>): Observable<never> {
  throw new TimeoutError(info)
}
export function timeoutWith<T, R>(
  dueBy: Date,
  switchTo: qt.ObsInput<R>,
  scheduler?: qt.Scheduler
): qt.OpFun<T, T | R>
export function timeoutWith<T, R>(
  waitFor: number,
  switchTo: qt.ObsInput<R>,
  scheduler?: qt.Scheduler
): qt.OpFun<T, T | R>
export function timeoutWith<T, R>(
  due: number | Date,
  withObservable: qt.ObsInput<R>,
  scheduler?: qt.Scheduler
): qt.OpFun<T, T | R> {
  let first: number | Date | undefined
  let each: number | undefined
  let _with: () => qt.ObsInput<R>
  scheduler = scheduler ?? new AsyncScheduler()
  if (qu.isValidDate(due)) {
    first = due
  } else if (typeof due === "number") {
    each = due
  }
  if (withObservable) {
    _with = () => withObservable
  } else {
    throw new TypeError("No observable provided to switch to")
  }
  if (first == null && each == null) {
    throw new TypeError("No timeout provided.")
  }
  return timeout<T, qt.ObsInput<R>>({
    first,
    each,
    scheduler,
    with: _with,
  })
}
export function timestamp<T>(
  timestampProvider: qt.TimestampProvider = stampProvider
): qt.OpFun<T, Timestamp<T>> {
  return map((value: T) => ({ value, timestamp: timestampProvider.now() }))
}
const arrReducer = (arr: any[], value: any) => (arr.push(value), arr)
export function toArray<T>(): qt.OpFun<T, T[]> {
  return operate((source, subscriber) => {
    reduce(arrReducer, [] as T[])(source).subscribe(subscriber)
  })
}
export function window<T>(
  windowBoundaries: Observable<any>
): qt.OpFun<T, Observable<T>> {
  return operate((source, subscriber) => {
    let windowSubject: Subject<T> = new Subject<T>()
    subscriber.next(windowSubject.asObservable())
    const errorHandler = (err: any) => {
      windowSubject.error(err)
      subscriber.error(err)
    }
    source.subscribe(
      new OperatorSubscriber(
        subscriber,
        value => windowSubject?.next(value),
        () => {
          windowSubject.done()
          subscriber.done()
        },
        errorHandler
      )
    )
    windowBoundaries.subscribe(
      new OperatorSubscriber(
        subscriber,
        () => {
          windowSubject.done()
          subscriber.next((windowSubject = new Subject()))
        },
        qu.noop,
        errorHandler
      )
    )
    return () => {
      windowSubject?.unsubscribe()
      windowSubject = null!
    }
  })
}
export function windowCount<T>(
  windowSize: number,
  startWindowEvery = 0
): qt.OpFun<T, Observable<T>> {
  const startEvery = startWindowEvery > 0 ? startWindowEvery : windowSize
  return operate((source, subscriber) => {
    let windows = [new Subject<T>()]
    let starts: number[] = []
    let count = 0
    subscriber.next(windows[0].asObservable())
    source.subscribe(
      new OperatorSubscriber(
        subscriber,
        (value: T) => {
          for (const window of windows) {
            window.next(value)
          }
          const c = count - windowSize + 1
          if (c >= 0 && c % startEvery === 0) {
            windows.shift()!.done()
          }
          if (++count % startEvery === 0) {
            const window = new Subject<T>()
            windows.push(window)
            subscriber.next(window.asObservable())
          }
        },
        () => {
          while (windows.length > 0) {
            windows.shift()!.done()
          }
          subscriber.done()
        },
        err => {
          while (windows.length > 0) {
            windows.shift()!.error(err)
          }
          subscriber.error(err)
        },
        () => {
          starts = null!
          windows = null!
        }
      )
    )
  })
}
export function windowTime<T>(
  windowTimeSpan: number,
  scheduler?: qt.Scheduler
): qt.OpFun<T, Observable<T>>
export function windowTime<T>(
  windowTimeSpan: number,
  windowCreationInterval: number,
  scheduler?: qt.Scheduler
): qt.OpFun<T, Observable<T>>
export function windowTime<T>(
  windowTimeSpan: number,
  windowCreationInterval: number | null | void,
  maxWindowSize: number,
  scheduler?: qt.Scheduler
): qt.OpFun<T, Observable<T>>
export function windowTime<T>(
  windowTimeSpan: number,
  ...xs: any[]
): qt.OpFun<T, Observable<T>> {
  const sched = Scheduler.pop(xs) ?? AsyncScheduler
  const windowCreationInterval = (xs[0] as number) ?? null
  const maxWindowSize = (xs[1] as number) || Infinity
  return operate((source, subscriber) => {
    let windowRecords: WindowRecord<T>[] | null = []
    let restartOnClose = false
    const closeWindow = (record: {
      window: Subject<T>
      subs: Subscription
    }) => {
      const { window, subs } = record
      window.done()
      subs.unsubscribe()
      qu.arrRemove(windowRecords, record)
      restartOnClose && startWindow()
    }
    const startWindow = () => {
      if (windowRecords) {
        const subs = new Subscription()
        subscriber.add(subs)
        const window = new Subject<T>()
        const record = {
          window,
          subs,
          seen: 0,
        }
        windowRecords.push(record)
        subscriber.next(window.asObservable())
        sched.run(subs, () => closeWindow(record), windowTimeSpan)
      }
    }
    if (windowCreationInterval !== null && windowCreationInterval >= 0) {
      sched.run(subscriber, startWindow, windowCreationInterval, true)
    } else {
      restartOnClose = true
    }
    startWindow()
    const loop = (cb: (record: WindowRecord<T>) => void) =>
      windowRecords!.slice().forEach(cb)
    const terminate = (cb: (consumer: qt.Observer<any>) => void) => {
      loop(({ window }) => cb(window))
      cb(subscriber)
      subscriber.unsubscribe()
    }
    source.subscribe(
      new OperatorSubscriber(
        subscriber,
        (value: T) => {
          loop(record => {
            record.window.next(value)
            maxWindowSize <= ++record.seen && closeWindow(record)
          })
        },
        () => terminate(consumer => consumer.done()),
        err => terminate(consumer => consumer.error(err))
      )
    )
    return () => {
      windowRecords = null!
    }
  })
}
interface WindowRecord<T> {
  seen: number
  window: Subject<T>
  subs: Subscription
}
export function windowToggle<T, O>(
  openings: qt.ObsInput<O>,
  closingSelector: (openValue: O) => qt.ObsInput<any>
): qt.OpFun<T, Observable<T>> {
  return operate((source, subscriber) => {
    const windows: Subject<T>[] = []
    const handleError = (err: any) => {
      while (0 < windows.length) {
        windows.shift()!.error(err)
      }
      subscriber.error(err)
    }
    innerFrom(openings).subscribe(
      new OperatorSubscriber(
        subscriber,
        openValue => {
          const window = new Subject<T>()
          windows.push(window)
          const closingSubscription = new Subscription()
          const closeWindow = () => {
            qu.arrRemove(windows, window)
            window.done()
            closingSubscription.unsubscribe()
          }
          let closingNotifier: Observable<any>
          try {
            closingNotifier = innerFrom(closingSelector(openValue))
          } catch (err) {
            handleError(err)
            return
          }
          subscriber.next(window.asObservable())
          closingSubscription.add(
            closingNotifier.subscribe(
              new OperatorSubscriber(
                subscriber,
                closeWindow,
                qu.noop,
                handleError
              )
            )
          )
        },
        qu.noop
      )
    )
    source.subscribe(
      new OperatorSubscriber(
        subscriber,
        (value: T) => {
          const windowsCopy = windows.slice()
          for (const window of windowsCopy) {
            window.next(value)
          }
        },
        () => {
          while (0 < windows.length) {
            windows.shift()!.done()
          }
          subscriber.done()
        },
        handleError,
        () => {
          while (0 < windows.length) {
            windows.shift()!.unsubscribe()
          }
        }
      )
    )
  })
}
export function windowWhen<T>(
  closingSelector: () => qt.ObsInput<any>
): qt.OpFun<T, Observable<T>> {
  return operate((source, subscriber) => {
    let window: Subject<T> | null
    let closingSubscriber: Subscriber<any> | undefined
    const handleError = (err: any) => {
      window!.error(err)
      subscriber.error(err)
    }
    const openWindow = () => {
      closingSubscriber?.unsubscribe()
      window?.done()
      window = new Subject<T>()
      subscriber.next(window.asObservable())
      let closingNotifier: Observable<any>
      try {
        closingNotifier = innerFrom(closingSelector())
      } catch (err) {
        handleError(err)
        return
      }
      closingNotifier.subscribe(
        (closingSubscriber = new OperatorSubscriber(
          subscriber,
          openWindow,
          openWindow,
          handleError
        ))
      )
    }
    openWindow()
    source.subscribe(
      new OperatorSubscriber(
        subscriber,
        value => window!.next(value),
        () => {
          window!.done()
          subscriber.done()
        },
        handleError,
        () => {
          closingSubscriber?.unsubscribe()
          window = null!
        }
      )
    )
  })
}
export function withLatestFrom<T, O extends unknown[]>(
  ...inputs: [...qt.InputTuple<O>]
): qt.OpFun<T, [T, ...O]>
export function withLatestFrom<T, O extends unknown[], R>(
  ...inputs: [...qt.InputTuple<O>, (...value: [T, ...O]) => R]
): qt.OpFun<T, R>
export function withLatestFrom<T, R>(...inputs: any[]): qt.OpFun<T, R | any[]> {
  const project = qu.popResultSelector(inputs) as
    | ((...args: any[]) => R)
    | undefined
  return operate((source, subscriber) => {
    const len = inputs.length
    const otherValues = new Array(len)
    let has = inputs.map(() => false)
    let ready = false
    for (let i = 0; i < len; i++) {
      innerFrom(inputs[i]).subscribe(
        new OperatorSubscriber(
          subscriber,
          value => {
            otherValues[i] = value
            if (!ready && !has[i]) {
              has[i] = true
              ;(ready = has.every(qu.identity)) && (has = null!)
            }
          },
          qu.noop
        )
      )
    }
    source.subscribe(
      new OperatorSubscriber(subscriber, value => {
        if (ready) {
          const values = [value, ...otherValues]
          subscriber.next(project ? project(...values) : values)
        }
      })
    )
  })
}
export function zip<T, A extends readonly unknown[]>(
  otherInputs: [...qt.InputTuple<A>]
): qt.OpFun<T, qt.Cons<T, A>>
export function zip<T, A extends readonly unknown[], R>(
  otherInputsAndProject: [...qt.InputTuple<A>],
  project: (...values: qt.Cons<T, A>) => R
): qt.OpFun<T, R>
export function zip<T, A extends readonly unknown[]>(
  ...otherInputs: [...qt.InputTuple<A>]
): qt.OpFun<T, qt.Cons<T, A>>
export function zip<T, A extends readonly unknown[], R>(
  ...otherInputsAndProject: [
    ...qt.InputTuple<A>,
    (...values: qt.Cons<T, A>) => R
  ]
): qt.OpFun<T, R>
export function zip<T, R>(
  ...sources: Array<qt.ObsInput<any> | ((...values: Array<any>) => R)>
): qt.OpFun<T, any> {
  return operate((source, subscriber) => {
    zipStatic(
      source as qt.ObsInput<any>,
      ...(sources as Array<qt.ObsInput<any>>)
    ).subscribe(subscriber)
  })
}
export function zipAll<T>(): qt.OpFun<qt.ObsInput<T>, T[]>
export function zipAll<T>(): qt.OpFun<any, T[]>
export function zipAll<T, R>(
  project: (...values: T[]) => R
): qt.OpFun<qt.ObsInput<T>, R>
export function zipAll<R>(
  project: (...values: Array<any>) => R
): qt.OpFun<any, R>
export function zipAll<T, R>(project?: (...values: T[]) => R) {
  return joinAllInternals(zip, project)
}
export function zipWith<T, A extends readonly unknown[]>(
  ...otherInputs: [...qt.InputTuple<A>]
): qt.OpFun<T, qt.Cons<T, A>> {
  return zip(...otherInputs)
}
