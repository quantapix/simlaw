import * as qu from "./utils.js"
import {
  async,
  asyncScheduler,
  stampProvider,
  executeSchedule,
} from "./scheduler.js"
import { AsyncSubject, BehaviorSubject, ReplaySubject } from "./subject.js"
import { Note, observeNote } from "./note.js"
import { Observable, innerFrom, EMPTY, from, timer } from "./observable.js"
import { SafeSubscriber } from "./subscriber.js"
import { Subject } from "./subject.js"
import { Subscriber } from "./subscriber.js"
import { Subscription } from "./subscription.js"
import type * as qt from "./types.js"

export interface Operator<T, R> {
  call(x: Subscriber<R>, src: any): qt.Teardown
}

export const combineAll = combineLatestAll

export function createOperatorSubscriber<T>(
  destination: Subscriber<any>,
  onNext?: (value: T) => void,
  onComplete?: () => void,
  onError?: (err: any) => void,
  onFinalize?: () => void
): Subscriber<T> {
  return new OperatorSubscriber(
    destination,
    onNext,
    onComplete,
    onError,
    onFinalize
  )
}
export class OperatorSubscriber<T> extends Subscriber<T> {
  constructor(
    destination: Subscriber<any>,
    onNext?: (value: T) => void,
    onComplete?: () => void,
    onError?: (err: any) => void,
    private onFinalize?: () => void,
    private shouldUnsubscribe?: () => boolean
  ) {
    super(destination)
    this._next = onNext
      ? function (this: OperatorSubscriber<T>, value: T) {
          try {
            onNext(value)
          } catch (err) {
            destination.error(err)
          }
        }
      : super._next
    this._error = onError
      ? function (this: OperatorSubscriber<T>, err: any) {
          try {
            onError(err)
          } catch (err) {
            destination.error(err)
          } finally {
            this.unsubscribe()
          }
        }
      : super._error
    this._complete = onComplete
      ? function (this: OperatorSubscriber<T>) {
          try {
            onComplete()
          } catch (err) {
            destination.error(err)
          } finally {
            this.unsubscribe()
          }
        }
      : super._complete
  }
  unsubscribe() {
    if (!this.shouldUnsubscribe || this.shouldUnsubscribe()) {
      const { closed } = this
      super.unsubscribe()
      !closed && this.onFinalize?.()
    }
  }
}
export function audit<T>(
  durationSelector: (value: T) => qt.ObservableInput<any>
): qt.MonoTypeOperatorFunction<T> {
  return qu.operate((source, subscriber) => {
    let hasValue = false
    let lastValue: T | null = null
    let durationSubscriber: Subscriber<any> | null = null
    let isComplete = false
    const endDuration = () => {
      durationSubscriber?.unsubscribe()
      durationSubscriber = null
      if (hasValue) {
        hasValue = false
        const value = lastValue!
        lastValue = null
        subscriber.next(value)
      }
      isComplete && subscriber.complete()
    }
    const cleanupDuration = () => {
      durationSubscriber = null
      isComplete && subscriber.complete()
    }
    source.subscribe(
      createOperatorSubscriber(
        subscriber,
        value => {
          hasValue = true
          lastValue = value
          if (!durationSubscriber) {
            innerFrom(durationSelector(value)).subscribe(
              (durationSubscriber = createOperatorSubscriber(
                subscriber,
                endDuration,
                cleanupDuration
              ))
            )
          }
        },
        () => {
          isComplete = true
          ;(!hasValue || !durationSubscriber || durationSubscriber.closed) &&
            subscriber.complete()
        }
      )
    )
  })
}
export function auditTime<T>(
  duration: number,
  scheduler: qt.Scheduler = asyncScheduler
): qt.MonoTypeOperatorFunction<T> {
  return audit(() => timer(duration, scheduler))
}
export function buffer<T>(
  closingNotifier: Observable<any>
): qt.OperatorFunction<T, T[]> {
  return qu.operate((source, subscriber) => {
    let currentBuffer: T[] = []
    source.subscribe(
      createOperatorSubscriber(
        subscriber,
        value => currentBuffer.push(value),
        () => {
          subscriber.next(currentBuffer)
          subscriber.complete()
        }
      )
    )
    closingNotifier.subscribe(
      createOperatorSubscriber(
        subscriber,
        () => {
          const b = currentBuffer
          currentBuffer = []
          subscriber.next(b)
        },
        qu.noop
      )
    )
    return () => {
      currentBuffer = null!
    }
  })
}
export function bufferCount<T>(
  bufferSize: number,
  startBufferEvery: number | null = null
): qt.OperatorFunction<T, T[]> {
  startBufferEvery = startBufferEvery ?? bufferSize
  return qu.operate((source, subscriber) => {
    let buffers: T[][] = []
    let count = 0
    source.subscribe(
      createOperatorSubscriber(
        subscriber,
        value => {
          let toEmit: T[][] | null = null
          if (count++ % startBufferEvery! === 0) {
            buffers.push([])
          }
          for (const buffer of buffers) {
            buffer.push(value)
            if (bufferSize <= buffer.length) {
              toEmit = toEmit ?? []
              toEmit.push(buffer)
            }
          }
          if (toEmit) {
            for (const buffer of toEmit) {
              qu.arrRemove(buffers, buffer)
              subscriber.next(buffer)
            }
          }
        },
        () => {
          for (const buffer of buffers) {
            subscriber.next(buffer)
          }
          subscriber.complete()
        },
        undefined,
        () => {
          buffers = null!
        }
      )
    )
  })
}
export function bufferTime<T>(
  bufferTimeSpan: number,
  scheduler?: qt.Scheduler
): qt.OperatorFunction<T, T[]>
export function bufferTime<T>(
  bufferTimeSpan: number,
  bufferCreationInterval: number | null | undefined,
  scheduler?: qt.Scheduler
): qt.OperatorFunction<T, T[]>
export function bufferTime<T>(
  bufferTimeSpan: number,
  bufferCreationInterval: number | null | undefined,
  maxBufferSize: number,
  scheduler?: qt.Scheduler
): qt.OperatorFunction<T, T[]>
export function bufferTime<T>(
  bufferTimeSpan: number,
  ...otherArgs: any[]
): qt.OperatorFunction<T, T[]> {
  const scheduler = qu.popScheduler(otherArgs) ?? asyncScheduler
  const bufferCreationInterval = (otherArgs[0] as number) ?? null
  const maxBufferSize = (otherArgs[1] as number) || Infinity
  return qu.operate((source, subscriber) => {
    let bufferRecords: { buffer: T[]; subs: Subscription }[] | null = []
    let restartOnEmit = false
    const emit = (record: { buffer: T[]; subs: Subscription }) => {
      const { buffer, subs } = record
      subs.unsubscribe()
      qu.arrRemove(bufferRecords, record)
      subscriber.next(buffer)
      restartOnEmit && startBuffer()
    }
    const startBuffer = () => {
      if (bufferRecords) {
        const subs = new Subscription()
        subscriber.add(subs)
        const buffer: T[] = []
        const record = {
          buffer,
          subs,
        }
        bufferRecords.push(record)
        executeSchedule(subs, scheduler, () => emit(record), bufferTimeSpan)
      }
    }
    if (bufferCreationInterval !== null && bufferCreationInterval >= 0) {
      executeSchedule(
        subscriber,
        scheduler,
        startBuffer,
        bufferCreationInterval,
        true
      )
    } else {
      restartOnEmit = true
    }
    startBuffer()
    const bufferTimeSubscriber = createOperatorSubscriber(
      subscriber,
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
          subscriber.next(bufferRecords.shift()!.buffer)
        }
        bufferTimeSubscriber?.unsubscribe()
        subscriber.complete()
        subscriber.unsubscribe()
      },
      undefined,
      () => (bufferRecords = null)
    )
    source.subscribe(bufferTimeSubscriber)
  })
}
export function bufferToggle<T, O>(
  openings: qt.ObservableInput<O>,
  closingSelector: (value: O) => qt.ObservableInput<any>
): qt.OperatorFunction<T, T[]> {
  return qu.operate((source, subscriber) => {
    const buffers: T[][] = []
    innerFrom(openings).subscribe(
      createOperatorSubscriber(
        subscriber,
        openValue => {
          const buffer: T[] = []
          buffers.push(buffer)
          const closingSubscription = new Subscription()
          const emitBuffer = () => {
            qu.arrRemove(buffers, buffer)
            subscriber.next(buffer)
            closingSubscription.unsubscribe()
          }
          closingSubscription.add(
            innerFrom(closingSelector(openValue)).subscribe(
              createOperatorSubscriber(subscriber, emitBuffer, qu.noop)
            )
          )
        },
        qu.noop
      )
    )
    source.subscribe(
      createOperatorSubscriber(
        subscriber,
        value => {
          for (const buffer of buffers) {
            buffer.push(value)
          }
        },
        () => {
          while (buffers.length > 0) {
            subscriber.next(buffers.shift()!)
          }
          subscriber.complete()
        }
      )
    )
  })
}
export function bufferWhen<T>(
  closingSelector: () => qt.ObservableInput<any>
): qt.OperatorFunction<T, T[]> {
  return qu.operate((source, subscriber) => {
    let buffer: T[] | null = null
    let closingSubscriber: Subscriber<T> | null = null
    const openBuffer = () => {
      closingSubscriber?.unsubscribe()
      const b = buffer
      buffer = []
      b && subscriber.next(b)
      innerFrom(closingSelector()).subscribe(
        (closingSubscriber = createOperatorSubscriber(
          subscriber,
          openBuffer,
          qu.noop
        ))
      )
    }
    openBuffer()
    source.subscribe(
      createOperatorSubscriber(
        subscriber,
        value => buffer?.push(value),
        () => {
          buffer && subscriber.next(buffer)
          subscriber.complete()
        },
        undefined,
        () => (buffer = closingSubscriber = null!)
      )
    )
  })
}
export function catchError<T, O extends qt.ObservableInput<any>>(
  selector: (err: any, caught: Observable<T>) => O
): qt.OperatorFunction<T, T | qt.ObservedValueOf<O>>
export function catchError<T, O extends qt.ObservableInput<any>>(
  selector: (err: any, caught: Observable<T>) => O
): qt.OperatorFunction<T, T | qt.ObservedValueOf<O>> {
  return qu.operate((source, subscriber) => {
    let innerSub: Subscription | null = null
    let syncUnsub = false
    let handledResult: Observable<qt.ObservedValueOf<O>>
    innerSub = source.subscribe(
      createOperatorSubscriber(subscriber, undefined, undefined, err => {
        handledResult = innerFrom(selector(err, catchError(selector)(source)))
        if (innerSub) {
          innerSub.unsubscribe()
          innerSub = null
          handledResult.subscribe(subscriber)
        } else {
          syncUnsub = true
        }
      })
    )
    if (syncUnsub) {
      innerSub.unsubscribe()
      innerSub = null
      handledResult!.subscribe(subscriber)
    }
  })
}
export function combineLatest<T, A extends readonly unknown[], R>(
  sources: [...qt.ObservableInputTuple<A>],
  project: (...values: [T, ...A]) => R
): qt.OperatorFunction<T, R>
export function combineLatest<T, A extends readonly unknown[], R>(
  sources: [...qt.ObservableInputTuple<A>]
): qt.OperatorFunction<T, [T, ...A]>
export function combineLatest<T, A extends readonly unknown[], R>(
  ...sourcesAndProject: [
    ...qt.ObservableInputTuple<A>,
    (...values: [T, ...A]) => R
  ]
): qt.OperatorFunction<T, R>
export function combineLatest<T, A extends readonly unknown[], R>(
  ...sources: [...qt.ObservableInputTuple<A>]
): qt.OperatorFunction<T, [T, ...A]>
export function combineLatest<T, R>(
  ...args: (qt.ObservableInput<any> | ((...values: any[]) => R))[]
): qt.OperatorFunction<T, unknown> {
  const resultSelector = qu.popResultSelector(args)
  return resultSelector
    ? qu.pipe(
        combineLatest(...(args as Array<qt.ObservableInput<any>>)),
        qu.mapOneOrManyArgs(resultSelector)
      )
    : qu.operate((source, subscriber) => {
        combineLatestInit([source, ...qu.argsOrArgArray(args)])(subscriber)
      })
}
export function combineLatestAll<T>(): qt.OperatorFunction<
  qt.ObservableInput<T>,
  T[]
>
export function combineLatestAll<T>(): qt.OperatorFunction<any, T[]>
export function combineLatestAll<T, R>(
  project: (...values: T[]) => R
): qt.OperatorFunction<qt.ObservableInput<T>, R>
export function combineLatestAll<R>(
  project: (...values: Array<any>) => R
): qt.OperatorFunction<any, R>
export function combineLatestAll<R>(project?: (...values: Array<any>) => R) {
  return joinAllInternals(combineLatest, project)
}
export function combineLatestWith<T, A extends readonly unknown[]>(
  ...otherSources: [...qt.ObservableInputTuple<A>]
): qt.OperatorFunction<T, qt.Cons<T, A>> {
  return combineLatest(...otherSources)
}
export function concat<T, A extends readonly unknown[]>(
  ...sources: [...qt.ObservableInputTuple<A>]
): qt.OperatorFunction<T, T | A[number]>
export function concat<T, A extends readonly unknown[]>(
  ...sourcesAndScheduler: [...qt.ObservableInputTuple<A>, qt.Scheduler]
): qt.OperatorFunction<T, T | A[number]>
export function concat<T, R>(...args: any[]): qt.OperatorFunction<T, R> {
  const scheduler = qu.popScheduler(args)
  return qu.operate((source, subscriber) => {
    concatAll()(from([source, ...args], scheduler)).subscribe(subscriber)
  })
}
export function concatAll<
  O extends qt.ObservableInput<any>
>(): qt.OperatorFunction<O, qt.ObservedValueOf<O>> {
  return mergeAll(1)
}
export function concatMap<T, O extends qt.ObservableInput<any>>(
  project: (value: T, index: number) => O
): qt.OperatorFunction<T, qt.ObservedValueOf<O>>
export function concatMap<T, O extends qt.ObservableInput<any>>(
  project: (value: T, index: number) => O,
  resultSelector: undefined
): qt.OperatorFunction<T, qt.ObservedValueOf<O>>
export function concatMap<T, R, O extends qt.ObservableInput<any>>(
  project: (value: T, index: number) => O,
  resultSelector: (
    outerValue: T,
    innerValue: qt.ObservedValueOf<O>,
    outerIndex: number,
    innerIndex: number
  ) => R
): qt.OperatorFunction<T, R>
export function concatMap<T, R, O extends qt.ObservableInput<any>>(
  project: (value: T, index: number) => O,
  resultSelector?: (
    outerValue: T,
    innerValue: qt.ObservedValueOf<O>,
    outerIndex: number,
    innerIndex: number
  ) => R
): qt.OperatorFunction<T, qt.ObservedValueOf<O> | R> {
  return qu.isFunction(resultSelector)
    ? mergeMap(project, resultSelector, 1)
    : mergeMap(project, 1)
}
export function concatMapTo<O extends qt.ObservableInput<unknown>>(
  observable: O
): qt.OperatorFunction<unknown, qt.ObservedValueOf<O>>
export function concatMapTo<O extends qt.ObservableInput<unknown>>(
  observable: O,
  resultSelector: undefined
): qt.OperatorFunction<unknown, qt.ObservedValueOf<O>>
export function concatMapTo<T, R, O extends qt.ObservableInput<unknown>>(
  observable: O,
  resultSelector: (
    outerValue: T,
    innerValue: qt.ObservedValueOf<O>,
    outerIndex: number,
    innerIndex: number
  ) => R
): qt.OperatorFunction<T, R>
export function concatMapTo<T, R, O extends qt.ObservableInput<unknown>>(
  innerObservable: O,
  resultSelector?: (
    outerValue: T,
    innerValue: qt.ObservedValueOf<O>,
    outerIndex: number,
    innerIndex: number
  ) => R
): qt.OperatorFunction<T, qt.ObservedValueOf<O> | R> {
  return qu.isFunction(resultSelector)
    ? concatMap(() => innerObservable, resultSelector)
    : concatMap(() => innerObservable)
}
export function concatWith<T, A extends readonly unknown[]>(
  ...otherSources: [...qt.ObservableInputTuple<A>]
): qt.OperatorFunction<T, T | A[number]> {
  return concat(...otherSources)
}
export interface ConnectConfig<T> {
  connector: () => qt.SubjectLike<T>
}
const DEFAULT_CONFIG: ConnectConfig<unknown> = {
  connector: () => new Subject<unknown>(),
}
export function connect<T, O extends qt.ObservableInput<unknown>>(
  selector: (shared: Observable<T>) => O,
  config: ConnectConfig<T> = DEFAULT_CONFIG
): qt.OperatorFunction<T, qt.ObservedValueOf<O>> {
  const { connector } = config
  return qu.operate((source, subscriber) => {
    const subject = connector()
    innerFrom(selector(fromSubscribable(subject))).subscribe(subscriber)
    subscriber.add(source.subscribe(subject))
  })
}
export function count<T>(
  predicate?: (value: T, index: number) => boolean
): qt.OperatorFunction<T, number> {
  return reduce(
    (total, value, i) =>
      !predicate || predicate(value, i) ? total + 1 : total,
    0
  )
}
export function debounce<T>(
  durationSelector: (value: T) => qt.ObservableInput<any>
): qt.MonoTypeOperatorFunction<T> {
  return qu.operate((source, subscriber) => {
    let hasValue = false
    let lastValue: T | null = null
    let durationSubscriber: Subscriber<any> | null = null
    const emit = () => {
      durationSubscriber?.unsubscribe()
      durationSubscriber = null
      if (hasValue) {
        hasValue = false
        const value = lastValue!
        lastValue = null
        subscriber.next(value)
      }
    }
    source.subscribe(
      createOperatorSubscriber(
        subscriber,
        (value: T) => {
          durationSubscriber?.unsubscribe()
          hasValue = true
          lastValue = value
          durationSubscriber = createOperatorSubscriber(
            subscriber,
            emit,
            qu.noop
          )
          innerFrom(durationSelector(value)).subscribe(durationSubscriber)
        },
        () => {
          emit()
          subscriber.complete()
        },
        undefined,
        () => {
          lastValue = durationSubscriber = null
        }
      )
    )
  })
}
export function debounceTime<T>(
  dueTime: number,
  scheduler: qt.Scheduler = asyncScheduler
): qt.MonoTypeOperatorFunction<T> {
  return qu.operate((source, subscriber) => {
    let activeTask: Subscription | null = null
    let lastValue: T | null = null
    let lastTime: number | null = null
    const emit = () => {
      if (activeTask) {
        activeTask.unsubscribe()
        activeTask = null
        const value = lastValue!
        lastValue = null
        subscriber.next(value)
      }
    }
    function emitWhenIdle(this: qt.SchedulerAction<unknown>) {
      const targetTime = lastTime! + dueTime
      const now = scheduler.now()
      if (now < targetTime) {
        activeTask = this.schedule(undefined, targetTime - now)
        subscriber.add(activeTask)
        return
      }
      emit()
    }
    source.subscribe(
      createOperatorSubscriber(
        subscriber,
        (value: T) => {
          lastValue = value
          lastTime = scheduler.now()
          if (!activeTask) {
            activeTask = scheduler.schedule(emitWhenIdle, dueTime)
            subscriber.add(activeTask)
          }
        },
        () => {
          emit()
          subscriber.complete()
        },
        undefined,
        () => {
          lastValue = activeTask = null
        }
      )
    )
  })
}
export function defaultIfEmpty<T, R>(
  defaultValue: R
): qt.OperatorFunction<T, T | R> {
  return qu.operate((source, subscriber) => {
    let hasValue = false
    source.subscribe(
      createOperatorSubscriber(
        subscriber,
        value => {
          hasValue = true
          subscriber.next(value)
        },
        () => {
          if (!hasValue) {
            subscriber.next(defaultValue!)
          }
          subscriber.complete()
        }
      )
    )
  })
}
export function delay<T>(
  due: number | Date,
  scheduler: qt.Scheduler = asyncScheduler
): qt.MonoTypeOperatorFunction<T> {
  const duration = timer(due, scheduler)
  return delayWhen(() => duration)
}
export function delayWhen<T>(
  delayDurationSelector: (value: T, index: number) => Observable<any>,
  subscriptionDelay: Observable<any>
): qt.MonoTypeOperatorFunction<T>
export function delayWhen<T>(
  delayDurationSelector: (value: T, index: number) => Observable<any>
): qt.MonoTypeOperatorFunction<T>
export function delayWhen<T>(
  delayDurationSelector: (value: T, index: number) => Observable<any>,
  subscriptionDelay?: Observable<any>
): qt.MonoTypeOperatorFunction<T> {
  if (subscriptionDelay) {
    return (source: Observable<T>) =>
      concat(
        subscriptionDelay.pipe(take(1), ignoreElements()),
        source.pipe(delayWhen(delayDurationSelector))
      )
  }
  return mergeMap((value, index) =>
    delayDurationSelector(value, index).pipe(take(1), mapTo(value))
  )
}
export function dematerialize<
  N extends qt.ObservableNote<any>
>(): qt.OperatorFunction<N, qt.ValueFromNote<N>> {
  return qu.operate((source, subscriber) => {
    source.subscribe(
      createOperatorSubscriber(subscriber, note =>
        observeNote(note, subscriber)
      )
    )
  })
}
export function distinct<T, K>(
  keySelector?: (value: T) => K,
  flushes?: Observable<any>
): qt.MonoTypeOperatorFunction<T> {
  return qu.operate((source, subscriber) => {
    const distinctKeys = new Set()
    source.subscribe(
      createOperatorSubscriber(subscriber, value => {
        const key = keySelector ? keySelector(value) : value
        if (!distinctKeys.has(key)) {
          distinctKeys.add(key)
          subscriber.next(value)
        }
      })
    )
    flushes?.subscribe(
      createOperatorSubscriber(subscriber, () => distinctKeys.clear(), qu.noop)
    )
  })
}
export function distinctUntilChanged<T>(
  comparator?: (previous: T, current: T) => boolean
): qt.MonoTypeOperatorFunction<T>
export function distinctUntilChanged<T, K>(
  comparator: (previous: K, current: K) => boolean,
  keySelector: (value: T) => K
): qt.MonoTypeOperatorFunction<T>
export function distinctUntilChanged<T, K>(
  comparator?: (previous: K, current: K) => boolean,
  keySelector: (value: T) => K = qu.identity as (value: T) => K
): qt.MonoTypeOperatorFunction<T> {
  comparator = comparator ?? defaultCompare
  return qu.operate((source, subscriber) => {
    let previousKey: K
    let first = true
    source.subscribe(
      createOperatorSubscriber(subscriber, value => {
        const currentKey = keySelector(value)
        if (first || !comparator!(previousKey, currentKey)) {
          first = false
          previousKey = currentKey
          subscriber.next(value)
        }
      })
    )
  })
}
function defaultCompare(a: any, b: any) {
  return a === b
}
export function distinctUntilKeyChanged<T>(
  key: keyof T
): qt.MonoTypeOperatorFunction<T>
export function distinctUntilKeyChanged<T, K extends keyof T>(
  key: K,
  compare: (x: T[K], y: T[K]) => boolean
): qt.MonoTypeOperatorFunction<T>
export function distinctUntilKeyChanged<T, K extends keyof T>(
  key: K,
  compare?: (x: T[K], y: T[K]) => boolean
): qt.MonoTypeOperatorFunction<T> {
  return distinctUntilChanged((x: T, y: T) =>
    compare ? compare(x[key], y[key]) : x[key] === y[key]
  )
}
export function elementAt<T, D = T>(
  index: number,
  defaultValue?: D
): qt.OperatorFunction<T, T | D> {
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
export function endWith<T>(
  scheduler: qt.Scheduler
): qt.MonoTypeOperatorFunction<T>
export function endWith<T, A extends unknown[] = T[]>(
  ...valuesAndScheduler: [...A, qt.Scheduler]
): qt.OperatorFunction<T, T | qt.ValueFromArray<A>>
export function endWith<T, A extends unknown[] = T[]>(
  ...values: A
): qt.OperatorFunction<T, T | qt.ValueFromArray<A>>
export function endWith<T>(
  ...values: Array<T | qt.Scheduler>
): qt.MonoTypeOperatorFunction<T> {
  return (source: Observable<T>) =>
    concat(source, of(...values)) as Observable<T>
}
export function every<T>(
  predicate: BooleanConstructor
): qt.OperatorFunction<T, Exclude<T, qt.Falsy> extends never ? false : boolean>
export function every<T>(
  predicate: BooleanConstructor,
  thisArg: any
): qt.OperatorFunction<T, Exclude<T, qt.Falsy> extends never ? false : boolean>
export function every<T, A>(
  predicate: (
    this: A,
    value: T,
    index: number,
    source: Observable<T>
  ) => boolean,
  thisArg: A
): qt.OperatorFunction<T, boolean>
export function every<T>(
  predicate: (value: T, index: number, source: Observable<T>) => boolean
): qt.OperatorFunction<T, boolean>
export function every<T>(
  predicate: (value: T, index: number, source: Observable<T>) => boolean,
  thisArg?: any
): qt.OperatorFunction<T, boolean> {
  return qu.operate((source, subscriber) => {
    let index = 0
    source.subscribe(
      createOperatorSubscriber(
        subscriber,
        value => {
          if (!predicate.call(thisArg, value, index++, source)) {
            subscriber.next(false)
            subscriber.complete()
          }
        },
        () => {
          subscriber.next(true)
          subscriber.complete()
        }
      )
    )
  })
}
export const exhaust = exhaustAll
export function exhaustAll<
  O extends qt.ObservableInput<any>
>(): qt.OperatorFunction<O, qt.ObservedValueOf<O>> {
  return exhaustMap(qu.identity)
}
export function exhaustMap<T, O extends qt.ObservableInput<any>>(
  project: (value: T, index: number) => O
): qt.OperatorFunction<T, qt.ObservedValueOf<O>>
export function exhaustMap<T, O extends qt.ObservableInput<any>>(
  project: (value: T, index: number) => O,
  resultSelector: undefined
): qt.OperatorFunction<T, qt.ObservedValueOf<O>>
export function exhaustMap<T, I, R>(
  project: (value: T, index: number) => qt.ObservableInput<I>,
  resultSelector: (
    outerValue: T,
    innerValue: I,
    outerIndex: number,
    innerIndex: number
  ) => R
): qt.OperatorFunction<T, R>
export function exhaustMap<T, R, O extends qt.ObservableInput<any>>(
  project: (value: T, index: number) => O,
  resultSelector?: (
    outerValue: T,
    innerValue: qt.ObservedValueOf<O>,
    outerIndex: number,
    innerIndex: number
  ) => R
): qt.OperatorFunction<T, qt.ObservedValueOf<O> | R> {
  if (resultSelector) {
    return (source: Observable<T>) =>
      source.pipe(
        exhaustMap((a, i) =>
          innerFrom(project(a, i)).pipe(
            map((b: any, ii: any) => resultSelector(a, b, i, ii))
          )
        )
      )
  }
  return qu.operate((source, subscriber) => {
    let index = 0
    let innerSub: Subscriber<T> | null = null
    let isComplete = false
    source.subscribe(
      createOperatorSubscriber(
        subscriber,
        outerValue => {
          if (!innerSub) {
            innerSub = createOperatorSubscriber(subscriber, undefined, () => {
              innerSub = null
              isComplete && subscriber.complete()
            })
            innerFrom(project(outerValue, index++)).subscribe(innerSub)
          }
        },
        () => {
          isComplete = true
          !innerSub && subscriber.complete()
        }
      )
    )
  })
}
export function expand<T, O extends qt.ObservableInput<unknown>>(
  project: (value: T, index: number) => O,
  concurrent?: number,
  scheduler?: qt.Scheduler
): qt.OperatorFunction<T, qt.ObservedValueOf<O>>
export function expand<T, O extends qt.ObservableInput<unknown>>(
  project: (value: T, index: number) => O,
  concurrent: number | undefined,
  scheduler: qt.Scheduler
): qt.OperatorFunction<T, qt.ObservedValueOf<O>>
export function expand<T, O extends qt.ObservableInput<unknown>>(
  project: (value: T, index: number) => O,
  concurrent = Infinity,
  scheduler?: qt.Scheduler
): qt.OperatorFunction<T, qt.ObservedValueOf<O>> {
  concurrent = (concurrent || 0) < 1 ? Infinity : concurrent
  return qu.operate((source, subscriber) =>
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
): qt.OperatorFunction<T, S>
export function filter<T, S extends T>(
  predicate: (value: T, index: number) => value is S
): qt.OperatorFunction<T, S>
export function filter<T>(
  predicate: BooleanConstructor
): qt.OperatorFunction<T, qt.TruthyTypesOf<T>>
export function filter<T, A>(
  predicate: (this: A, value: T, index: number) => boolean,
  thisArg: A
): qt.MonoTypeOperatorFunction<T>
export function filter<T>(
  predicate: (value: T, index: number) => boolean
): qt.MonoTypeOperatorFunction<T>
export function filter<T>(
  predicate: (value: T, index: number) => boolean,
  thisArg?: any
): qt.MonoTypeOperatorFunction<T> {
  return qu.operate((source, subscriber) => {
    let index = 0
    source.subscribe(
      createOperatorSubscriber(
        subscriber,
        value =>
          predicate.call(thisArg, value, index++) && subscriber.next(value)
      )
    )
  })
}
export function finalize<T>(
  callback: () => void
): qt.MonoTypeOperatorFunction<T> {
  return qu.operate((source, subscriber) => {
    try {
      source.subscribe(subscriber)
    } finally {
      subscriber.add(callback)
    }
  })
}
export function find<T>(
  predicate: BooleanConstructor
): qt.OperatorFunction<T, qt.TruthyTypesOf<T>>
export function find<T, S extends T, A>(
  predicate: (
    this: A,
    value: T,
    index: number,
    source: Observable<T>
  ) => value is S,
  thisArg: A
): qt.OperatorFunction<T, S | undefined>
export function find<T, S extends T>(
  predicate: (value: T, index: number, source: Observable<T>) => value is S
): qt.OperatorFunction<T, S | undefined>
export function find<T, A>(
  predicate: (
    this: A,
    value: T,
    index: number,
    source: Observable<T>
  ) => boolean,
  thisArg: A
): qt.OperatorFunction<T, T | undefined>
export function find<T>(
  predicate: (value: T, index: number, source: Observable<T>) => boolean
): qt.OperatorFunction<T, T | undefined>
export function find<T>(
  predicate: (value: T, index: number, source: Observable<T>) => boolean,
  thisArg?: any
): qt.OperatorFunction<T, T | undefined> {
  return qu.operate(createFind(predicate, thisArg, "value"))
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
      createOperatorSubscriber(
        subscriber,
        value => {
          const i = index++
          if (predicate.call(thisArg, value, i, source)) {
            subscriber.next(findIndex ? i : value)
            subscriber.complete()
          }
        },
        () => {
          subscriber.next(findIndex ? -1 : undefined)
          subscriber.complete()
        }
      )
    )
  }
}
export function findIndex<T>(
  predicate: BooleanConstructor
): qt.OperatorFunction<T, T extends qt.Falsy ? -1 : number>
export function findIndex<T>(
  predicate: BooleanConstructor,
  thisArg: any
): qt.OperatorFunction<T, T extends qt.Falsy ? -1 : number>
export function findIndex<T, A>(
  predicate: (
    this: A,
    value: T,
    index: number,
    source: Observable<T>
  ) => boolean,
  thisArg: A
): qt.OperatorFunction<T, number>
export function findIndex<T>(
  predicate: (value: T, index: number, source: Observable<T>) => boolean
): qt.OperatorFunction<T, number>
export function findIndex<T>(
  predicate: (value: T, index: number, source: Observable<T>) => boolean,
  thisArg?: any
): qt.OperatorFunction<T, number> {
  return qu.operate(createFind(predicate, thisArg, "index"))
}
export function first<T, D = T>(
  predicate?: null,
  defaultValue?: D
): qt.OperatorFunction<T, T | D>
export function first<T>(
  predicate: BooleanConstructor
): qt.OperatorFunction<T, qt.TruthyTypesOf<T>>
export function first<T, D>(
  predicate: BooleanConstructor,
  defaultValue: D
): qt.OperatorFunction<T, qt.TruthyTypesOf<T> | D>
export function first<T, S extends T>(
  predicate: (value: T, index: number, source: Observable<T>) => value is S,
  defaultValue?: S
): qt.OperatorFunction<T, S>
export function first<T, S extends T, D>(
  predicate: (value: T, index: number, source: Observable<T>) => value is S,
  defaultValue: D
): qt.OperatorFunction<T, S | D>
export function first<T, D = T>(
  predicate: (value: T, index: number, source: Observable<T>) => boolean,
  defaultValue?: D
): qt.OperatorFunction<T, T | D>
export function first<T, D>(
  predicate?:
    | ((value: T, index: number, source: Observable<T>) => boolean)
    | null,
  defaultValue?: D
): qt.OperatorFunction<T, T | D> {
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
  duration?: (grouped: GroupedObservable<K, T>) => qt.ObservableInput<any>
  connector?: () => qt.SubjectLike<T>
}
export interface GroupByOptionsWithElement<K, E, T> {
  element: (value: T) => E
  duration?: (grouped: GroupedObservable<K, E>) => qt.ObservableInput<any>
  connector?: () => qt.SubjectLike<E>
}
export function groupBy<T, K>(
  key: (value: T) => K,
  options: BasicGroupByOptions<K, T>
): qt.OperatorFunction<T, GroupedObservable<K, T>>
export function groupBy<T, K, E>(
  key: (value: T) => K,
  options: GroupByOptionsWithElement<K, E, T>
): qt.OperatorFunction<T, GroupedObservable<K, E>>
export function groupBy<T, K extends T>(
  key: (value: T) => value is K
): qt.OperatorFunction<
  T,
  GroupedObservable<true, K> | GroupedObservable<false, Exclude<T, K>>
>
export function groupBy<T, K>(
  key: (value: T) => K
): qt.OperatorFunction<T, GroupedObservable<K, T>>
export function groupBy<T, K>(
  key: (value: T) => K,
  element: void,
  duration: (grouped: GroupedObservable<K, T>) => Observable<any>
): qt.OperatorFunction<T, GroupedObservable<K, T>>
export function groupBy<T, K, R>(
  key: (value: T) => K,
  element?: (value: T) => R,
  duration?: (grouped: GroupedObservable<K, R>) => Observable<any>
): qt.OperatorFunction<T, GroupedObservable<K, R>>
export function groupBy<T, K, R>(
  key: (value: T) => K,
  element?: (value: T) => R,
  duration?: (grouped: GroupedObservable<K, R>) => Observable<any>,
  connector?: () => Subject<R>
): qt.OperatorFunction<T, GroupedObservable<K, R>>
export function groupBy<T, K, R>(
  keySelector: (value: T) => K,
  elementOrOptions?:
    | ((value: any) => any)
    | void
    | BasicGroupByOptions<K, T>
    | GroupByOptionsWithElement<K, R, T>,
  duration?: (grouped: GroupedObservable<any, any>) => qt.ObservableInput<any>,
  connector?: () => qt.SubjectLike<any>
): qt.OperatorFunction<T, GroupedObservable<K, R>> {
  return qu.operate((source, subscriber) => {
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
              const durationSubscriber = createOperatorSubscriber(
                group as any,
                () => {
                  group!.complete()
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
      () => notify(consumer => consumer.complete()),
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
export function ignoreElements(): qt.OperatorFunction<unknown, never> {
  return qu.operate((source, subscriber) => {
    source.subscribe(createOperatorSubscriber(subscriber, qu.noop))
  })
}
export function isEmpty<T>(): qt.OperatorFunction<T, boolean> {
  return qu.operate((source, subscriber) => {
    source.subscribe(
      createOperatorSubscriber(
        subscriber,
        () => {
          subscriber.next(false)
          subscriber.complete()
        },
        () => {
          subscriber.next(true)
          subscriber.complete()
        }
      )
    )
  })
}
export function joinAllInternals<T, R>(
  joinFn: (sources: qt.ObservableInput<T>[]) => Observable<T>,
  project?: (...args: any[]) => R
) {
  return qu.pipe(
    toArray() as qt.OperatorFunction<
      qt.ObservableInput<T>,
      qt.ObservableInput<T>[]
    >,
    mergeMap(sources => joinFn(sources)),
    project ? qu.mapOneOrManyArgs(project) : (qu.identity as any)
  )
}
export function last<T>(
  predicate: BooleanConstructor
): qt.OperatorFunction<T, qt.TruthyTypesOf<T>>
export function last<T, D>(
  predicate: BooleanConstructor,
  defaultValue: D
): qt.OperatorFunction<T, qt.TruthyTypesOf<T> | D>
export function last<T, D = T>(
  predicate?: null,
  defaultValue?: D
): qt.OperatorFunction<T, T | D>
export function last<T, S extends T>(
  predicate: (value: T, index: number, source: Observable<T>) => value is S,
  defaultValue?: S
): qt.OperatorFunction<T, S>
export function last<T, D = T>(
  predicate: (value: T, index: number, source: Observable<T>) => boolean,
  defaultValue?: D
): qt.OperatorFunction<T, T | D>
export function last<T, D>(
  predicate?:
    | ((value: T, index: number, source: Observable<T>) => boolean)
    | null,
  defaultValue?: D
): qt.OperatorFunction<T, T | D> {
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
): qt.OperatorFunction<T, R>
export function map<T, R, A>(
  project: (this: A, value: T, index: number) => R,
  thisArg: A
): qt.OperatorFunction<T, R>
export function map<T, R>(
  project: (value: T, index: number) => R,
  thisArg?: any
): qt.OperatorFunction<T, R> {
  return qu.operate((source, subscriber) => {
    let index = 0
    source.subscribe(
      createOperatorSubscriber(subscriber, (value: T) => {
        subscriber.next(project.call(thisArg, value, index++))
      })
    )
  })
}
export function mapTo<R>(value: R): qt.OperatorFunction<unknown, R>
export function mapTo<T, R>(value: R): qt.OperatorFunction<T, R>
export function mapTo<R>(value: R): qt.OperatorFunction<unknown, R> {
  return map(() => value)
}
export function materialize<T>(): qt.OperatorFunction<
  T,
  Note<T> & qt.ObservableNote<T>
> {
  return qu.operate((source, subscriber) => {
    source.subscribe(
      createOperatorSubscriber(
        subscriber,
        value => {
          subscriber.next(Note.createNext(value))
        },
        () => {
          subscriber.next(Note.createComplete())
          subscriber.complete()
        },
        err => {
          subscriber.next(Note.createError(err))
          subscriber.complete()
        }
      )
    )
  })
}
export function max<T>(
  comparer?: (x: T, y: T) => number
): qt.MonoTypeOperatorFunction<T> {
  return reduce(
    qu.isFunction(comparer)
      ? (x, y) => (comparer(x, y) > 0 ? x : y)
      : (x, y) => (x > y ? x : y)
  )
}
export function merge<T, A extends readonly unknown[]>(
  ...sources: [...qt.ObservableInputTuple<A>]
): qt.OperatorFunction<T, T | A[number]>
export function merge<T, A extends readonly unknown[]>(
  ...sourcesAndConcurrency: [...qt.ObservableInputTuple<A>, number]
): qt.OperatorFunction<T, T | A[number]>
export function merge<T, A extends readonly unknown[]>(
  ...sourcesAndScheduler: [...qt.ObservableInputTuple<A>, qt.Scheduler]
): qt.OperatorFunction<T, T | A[number]>
export function merge<T, A extends readonly unknown[]>(
  ...sourcesAndConcurrencyAndScheduler: [
    ...qt.ObservableInputTuple<A>,
    number,
    qt.Scheduler
  ]
): qt.OperatorFunction<T, T | A[number]>
export function merge<T>(...args: unknown[]): qt.OperatorFunction<T, unknown> {
  const scheduler = qu.popScheduler(args)
  const concurrent = qu.popNumber(args, Infinity)
  args = qu.argsOrArgArray(args)
  return qu.operate((source, subscriber) => {
    mergeAll(concurrent)(
      from([source, ...(args as qt.ObservableInput<T>[])], scheduler)
    ).subscribe(subscriber)
  })
}
export function mergeAll<O extends qt.ObservableInput<any>>(
  concurrent: number = Infinity
): qt.OperatorFunction<O, qt.ObservedValueOf<O>> {
  return mergeMap(qu.identity, concurrent)
}
export function mergeInternals<T, R>(
  source: Observable<T>,
  subscriber: Subscriber<R>,
  project: (value: T, index: number) => qt.ObservableInput<R>,
  concurrent: number,
  onBeforeNext?: (innerValue: R) => void,
  expand?: boolean,
  innerSubScheduler?: qt.Scheduler,
  additionalFinalizer?: () => void
) {
  const buffer: T[] = []
  let active = 0
  let index = 0
  let isComplete = false
  const checkComplete = () => {
    if (isComplete && !buffer.length && !active) {
      subscriber.complete()
    }
  }
  const outerNext = (value: T) =>
    active < concurrent ? doInnerSub(value) : buffer.push(value)
  const doInnerSub = (value: T) => {
    expand && subscriber.next(value as any)
    active++
    let innerComplete = false
    innerFrom(project(value, index++)).subscribe(
      createOperatorSubscriber(
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
          innerComplete = true
        },
        undefined,
        () => {
          if (innerComplete) {
            try {
              active--
              while (buffer.length && active < concurrent) {
                const bufferedValue = buffer.shift()!
                if (innerSubScheduler) {
                  executeSchedule(subscriber, innerSubScheduler, () =>
                    doInnerSub(bufferedValue)
                  )
                } else {
                  doInnerSub(bufferedValue)
                }
              }
              checkComplete()
            } catch (err) {
              subscriber.error(err)
            }
          }
        }
      )
    )
  }
  source.subscribe(
    createOperatorSubscriber(subscriber, outerNext, () => {
      isComplete = true
      checkComplete()
    })
  )
  return () => {
    additionalFinalizer?.()
  }
}
export function mergeMap<T, O extends qt.ObservableInput<any>>(
  project: (value: T, index: number) => O,
  concurrent?: number
): qt.OperatorFunction<T, qt.ObservedValueOf<O>>
export function mergeMap<T, O extends qt.ObservableInput<any>>(
  project: (value: T, index: number) => O,
  resultSelector: undefined,
  concurrent?: number
): qt.OperatorFunction<T, qt.ObservedValueOf<O>>
export function mergeMap<T, R, O extends qt.ObservableInput<any>>(
  project: (value: T, index: number) => O,
  resultSelector: (
    outerValue: T,
    innerValue: qt.ObservedValueOf<O>,
    outerIndex: number,
    innerIndex: number
  ) => R,
  concurrent?: number
): qt.OperatorFunction<T, R>
export function mergeMap<T, R, O extends qt.ObservableInput<any>>(
  project: (value: T, index: number) => O,
  resultSelector?:
    | ((
        outerValue: T,
        innerValue: qt.ObservedValueOf<O>,
        outerIndex: number,
        innerIndex: number
      ) => R)
    | number,
  concurrent: number = Infinity
): qt.OperatorFunction<T, qt.ObservedValueOf<O> | R> {
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
  return qu.operate((source, subscriber) =>
    mergeInternals(source, subscriber, project, concurrent)
  )
}
export function mergeMapTo<O extends qt.ObservableInput<unknown>>(
  innerObservable: O,
  concurrent?: number
): qt.OperatorFunction<unknown, qt.ObservedValueOf<O>>
export function mergeMapTo<T, R, O extends qt.ObservableInput<unknown>>(
  innerObservable: O,
  resultSelector: (
    outerValue: T,
    innerValue: qt.ObservedValueOf<O>,
    outerIndex: number,
    innerIndex: number
  ) => R,
  concurrent?: number
): qt.OperatorFunction<T, R>
export function mergeMapTo<T, R, O extends qt.ObservableInput<unknown>>(
  innerObservable: O,
  resultSelector?:
    | ((
        outerValue: T,
        innerValue: qt.ObservedValueOf<O>,
        outerIndex: number,
        innerIndex: number
      ) => R)
    | number,
  concurrent: number = Infinity
): qt.OperatorFunction<T, qt.ObservedValueOf<O> | R> {
  if (qu.isFunction(resultSelector)) {
    return mergeMap(() => innerObservable, resultSelector, concurrent)
  }
  if (typeof resultSelector === "number") {
    concurrent = resultSelector
  }
  return mergeMap(() => innerObservable, concurrent)
}
export function mergeScan<T, R>(
  accumulator: (acc: R, value: T, index: number) => qt.ObservableInput<R>,
  seed: R,
  concurrent = Infinity
): qt.OperatorFunction<T, R> {
  return qu.operate((source, subscriber) => {
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
  ...otherSources: [...qt.ObservableInputTuple<A>]
): qt.OperatorFunction<T, T | A[number]> {
  return merge(...otherSources)
}
export function min<T>(
  comparer?: (x: T, y: T) => number
): qt.MonoTypeOperatorFunction<T> {
  return reduce(
    qu.isFunction(comparer)
      ? (x, y) => (comparer(x, y) < 0 ? x : y)
      : (x, y) => (x < y ? x : y)
  )
}

export function observeOn<T>(
  scheduler: qt.Scheduler,
  delay = 0
): qt.MonoTypeOperatorFunction<T> {
  return qu.operate((source, subscriber) => {
    source.subscribe(
      createOperatorSubscriber(
        subscriber,
        value =>
          executeSchedule(
            subscriber,
            scheduler,
            () => subscriber.next(value),
            delay
          ),
        () =>
          executeSchedule(
            subscriber,
            scheduler,
            () => subscriber.complete(),
            delay
          ),
        err =>
          executeSchedule(
            subscriber,
            scheduler,
            () => subscriber.error(err),
            delay
          )
      )
    )
  })
}
export function onErrorResumeNext<T, A extends readonly unknown[]>(
  sources: [...qt.ObservableInputTuple<A>]
): qt.OperatorFunction<T, T | A[number]>
export function onErrorResumeNext<T, A extends readonly unknown[]>(
  ...sources: [...qt.ObservableInputTuple<A>]
): qt.OperatorFunction<T, T | A[number]>
export function onErrorResumeNext<T, A extends readonly unknown[]>(
  ...sources:
    | [[...qt.ObservableInputTuple<A>]]
    | [...qt.ObservableInputTuple<A>]
): qt.OperatorFunction<T, T | A[number]> {
  const nextSources = qu.argsOrArgArray(
    sources
  ) as unknown as qt.ObservableInputTuple<A>
  return qu.operate((source, subscriber) => {
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
          const innerSub = createOperatorSubscriber(
            subscriber,
            undefined,
            qu.noop,
            qu.noop
          )
          nextSource.subscribe(innerSub)
          innerSub.add(subscribeNext)
        } else {
          subscriber.complete()
        }
      }
    }
    subscribeNext()
  })
}
export function pairwise<T>(): qt.OperatorFunction<T, [T, T]> {
  return qu.operate((source, subscriber) => {
    let prev: T
    let hasPrev = false
    source.subscribe(
      createOperatorSubscriber(subscriber, value => {
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
): qt.UnaryFunction<Observable<T>, [Observable<T>, Observable<T>]> {
  return (source: Observable<T>) =>
    [
      filter(predicate, thisArg)(source),
      filter(qu.not(predicate, thisArg))(source),
    ] as [Observable<T>, Observable<T>]
}
export function pluck<T, K1 extends keyof T>(
  k1: K1
): qt.OperatorFunction<T, T[K1]>
export function pluck<T, K1 extends keyof T, K2 extends keyof T[K1]>(
  k1: K1,
  k2: K2
): qt.OperatorFunction<T, T[K1][K2]>
export function pluck<
  T,
  K1 extends keyof T,
  K2 extends keyof T[K1],
  K3 extends keyof T[K1][K2]
>(k1: K1, k2: K2, k3: K3): qt.OperatorFunction<T, T[K1][K2][K3]>
export function pluck<
  T,
  K1 extends keyof T,
  K2 extends keyof T[K1],
  K3 extends keyof T[K1][K2],
  K4 extends keyof T[K1][K2][K3]
>(k1: K1, k2: K2, k3: K3, k4: K4): qt.OperatorFunction<T, T[K1][K2][K3][K4]>
export function pluck<
  T,
  K1 extends keyof T,
  K2 extends keyof T[K1],
  K3 extends keyof T[K1][K2],
  K4 extends keyof T[K1][K2][K3],
  K5 extends keyof T[K1][K2][K3][K4]
>(
  k1: K1,
  k2: K2,
  k3: K3,
  k4: K4,
  k5: K5
): qt.OperatorFunction<T, T[K1][K2][K3][K4][K5]>
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
): qt.OperatorFunction<T, T[K1][K2][K3][K4][K5][K6]>
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
): qt.OperatorFunction<T, unknown>
export function pluck<T>(
  ...properties: string[]
): qt.OperatorFunction<T, unknown>
export function pluck<T, R>(
  ...properties: Array<string | number | symbol>
): qt.OperatorFunction<T, R> {
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
export function publish<T>(): qt.UnaryFunction<
  Observable<T>,
  ConnectableObservable<T>
>
export function publish<T, O extends qt.ObservableInput<any>>(
  selector: (shared: Observable<T>) => O
): qt.OperatorFunction<T, qt.ObservedValueOf<O>>
export function publish<T, R>(
  selector?: qt.OperatorFunction<T, R>
): qt.MonoTypeOperatorFunction<T> | qt.OperatorFunction<T, R> {
  return selector
    ? source => connect(selector)(source)
    : source => multicast(new Subject<T>())(source)
}
export function publishBehavior<T>(
  initialValue: T
): qt.UnaryFunction<Observable<T>, ConnectableObservable<T>> {
  return source => {
    const subject = new BehaviorSubject<T>(initialValue)
    return new ConnectableObservable(source, () => subject)
  }
}
export function publishLast<T>(): qt.UnaryFunction<
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
): qt.MonoTypeOperatorFunction<T>
export function publishReplay<T, O extends qt.ObservableInput<any>>(
  bufferSize: number | undefined,
  windowTime: number | undefined,
  selector: (shared: Observable<T>) => O,
  timestampProvider?: qt.TimestampProvider
): qt.OperatorFunction<T, qt.ObservedValueOf<O>>
export function publishReplay<T, O extends qt.ObservableInput<any>>(
  bufferSize: number | undefined,
  windowTime: number | undefined,
  selector: undefined,
  timestampProvider: qt.TimestampProvider
): qt.OperatorFunction<T, qt.ObservedValueOf<O>>
export function publishReplay<T, R>(
  bufferSize?: number,
  windowTime?: number,
  selectorOrScheduler?: qt.TimestampProvider | qt.OperatorFunction<T, R>,
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
  otherSources: [...qt.ObservableInputTuple<A>]
): qt.OperatorFunction<T, T | A[number]>
export function race<T, A extends readonly unknown[]>(
  ...otherSources: [...qt.ObservableInputTuple<A>]
): qt.OperatorFunction<T, T | A[number]>
export function race<T>(...args: any[]): qt.OperatorFunction<T, unknown> {
  return raceWith(...qu.argsOrArgArray(args))
}
export function raceWith<T, A extends readonly unknown[]>(
  ...otherSources: [...qt.ObservableInputTuple<A>]
): qt.OperatorFunction<T, T | A[number]> {
  return !otherSources.length
    ? qu.identity
    : qu.operate((source, subscriber) => {
        raceInit<T | A[number]>([source, ...otherSources])(subscriber)
      })
}
export function reduce<V, A = V>(
  accumulator: (acc: A | V, value: V, index: number) => A
): qt.OperatorFunction<V, V | A>
export function reduce<V, A>(
  accumulator: (acc: A, value: V, index: number) => A,
  seed: A
): qt.OperatorFunction<V, A>
export function reduce<V, A, S = A>(
  accumulator: (acc: A | S, value: V, index: number) => A,
  seed: S
): qt.OperatorFunction<V, A>
export function reduce<V, A>(
  accumulator: (acc: V | A, value: V, index: number) => A,
  seed?: any
): qt.OperatorFunction<V, V | A> {
  return qu.operate(
    scanInternals(accumulator, seed, arguments.length >= 2, false, true)
  )
}
export function refCount<T>(): qt.MonoTypeOperatorFunction<T> {
  return qu.operate((source, subscriber) => {
    let connection: Subscription | null = null
    ;(source as any)._refCount++
    const refCounter = createOperatorSubscriber(
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
  delay?: number | ((count: number) => qt.ObservableInput<any>)
}
export function repeat<T>(
  countOrConfig?: number | RepeatConfig
): qt.MonoTypeOperatorFunction<T> {
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
    : qu.operate((source, subscriber) => {
        let soFar = 0
        let sourceSub: Subscription | null
        const resubscribe = () => {
          sourceSub?.unsubscribe()
          sourceSub = null
          if (delay != null) {
            const notifier =
              typeof delay === "number" ? timer(delay) : innerFrom(delay(soFar))
            const notifierSubscriber = createOperatorSubscriber(
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
            createOperatorSubscriber(subscriber, undefined, () => {
              if (++soFar < count) {
                if (sourceSub) {
                  resubscribe()
                } else {
                  syncUnsub = true
                }
              } else {
                subscriber.complete()
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
): qt.MonoTypeOperatorFunction<T> {
  return qu.operate((source, subscriber) => {
    let innerSub: Subscription | null
    let syncResub = false
    let completions$: Subject<void>
    let isNotifierComplete = false
    let isMainComplete = false
    const checkComplete = () =>
      isMainComplete && isNotifierComplete && (subscriber.complete(), true)
    const getCompletionSubject = () => {
      if (!completions$) {
        completions$ = new Subject()
        notifier(completions$).subscribe(
          createOperatorSubscriber(
            subscriber,
            () => {
              if (innerSub) {
                subscribeForRepeatWhen()
              } else {
                syncResub = true
              }
            },
            () => {
              isNotifierComplete = true
              checkComplete()
            }
          )
        )
      }
      return completions$
    }
    const subscribeForRepeatWhen = () => {
      isMainComplete = false
      innerSub = source.subscribe(
        createOperatorSubscriber(subscriber, undefined, () => {
          isMainComplete = true
          !checkComplete() && getCompletionSubject().next()
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
  delay?: number | ((error: any, retryCount: number) => qt.ObservableInput<any>)
  resetOnSuccess?: boolean
}
export function retry<T>(count?: number): qt.MonoTypeOperatorFunction<T>
export function retry<T>(config: RetryConfig): qt.MonoTypeOperatorFunction<T>
export function retry<T>(
  configOrCount: number | RetryConfig = Infinity
): qt.MonoTypeOperatorFunction<T> {
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
    : qu.operate((source, subscriber) => {
        let soFar = 0
        let innerSub: Subscription | null
        const subscribeForRetry = () => {
          let syncUnsub = false
          innerSub = source.subscribe(
            createOperatorSubscriber(
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
                    const notifierSubscriber = createOperatorSubscriber(
                      subscriber,
                      () => {
                        notifierSubscriber.unsubscribe()
                        resub()
                      },
                      () => {
                        subscriber.complete()
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
): qt.MonoTypeOperatorFunction<T> {
  return qu.operate((source, subscriber) => {
    let innerSub: Subscription | null
    let syncResub = false
    let errors$: Subject<any>
    const subscribeForRetryWhen = () => {
      innerSub = source.subscribe(
        createOperatorSubscriber(subscriber, undefined, undefined, err => {
          if (!errors$) {
            errors$ = new Subject()
            notifier(errors$).subscribe(
              createOperatorSubscriber(subscriber, () =>
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
export function sample<T>(
  notifier: Observable<any>
): qt.MonoTypeOperatorFunction<T> {
  return qu.operate((source, subscriber) => {
    let hasValue = false
    let lastValue: T | null = null
    source.subscribe(
      createOperatorSubscriber(subscriber, value => {
        hasValue = true
        lastValue = value
      })
    )
    notifier.subscribe(
      createOperatorSubscriber(
        subscriber,
        () => {
          if (hasValue) {
            hasValue = false
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
  scheduler: qt.Scheduler = asyncScheduler
): qt.MonoTypeOperatorFunction<T> {
  return sample(interval(period, scheduler))
}
export function scan<V, A = V>(
  accumulator: (acc: A | V, value: V, index: number) => A
): qt.OperatorFunction<V, V | A>
export function scan<V, A>(
  accumulator: (acc: A, value: V, index: number) => A,
  seed: A
): qt.OperatorFunction<V, A>
export function scan<V, A, S>(
  accumulator: (acc: A | S, value: V, index: number) => A,
  seed: S
): qt.OperatorFunction<V, A>
export function scan<V, A, S>(
  accumulator: (acc: V | A | S, value: V, index: number) => A,
  seed?: S
): qt.OperatorFunction<V, V | A> {
  return qu.operate(
    scanInternals(accumulator, seed as S, arguments.length >= 2, true)
  )
}
export function scanInternals<V, A, S>(
  accumulator: (acc: V | A | S, value: V, index: number) => A,
  seed: S,
  hasSeed: boolean,
  emitOnNext: boolean,
  emitBeforeComplete?: undefined | true
) {
  return (source: Observable<V>, subscriber: Subscriber<any>) => {
    let hasState = hasSeed
    let state: any = seed
    let index = 0
    source.subscribe(
      createOperatorSubscriber(
        subscriber,
        value => {
          const i = index++
          state = hasState
            ? accumulator(state, value, i)
            : ((hasState = true), value)
          emitOnNext && subscriber.next(state)
        },
        emitBeforeComplete &&
          (() => {
            hasState && subscriber.next(state)
            subscriber.complete()
          })
      )
    )
  }
}
export function sequenceEqual<T>(
  compareTo: Observable<T>,
  comparator: (a: T, b: T) => boolean = (a, b) => a === b
): qt.OperatorFunction<T, boolean> {
  return qu.operate((source, subscriber) => {
    const aState = createState<T>()
    const bState = createState<T>()
    const emit = (isEqual: boolean) => {
      subscriber.next(isEqual)
      subscriber.complete()
    }
    const createSubscriber = (
      selfState: SequenceState<T>,
      otherState: SequenceState<T>
    ) => {
      const sequenceEqualSubscriber = createOperatorSubscriber(
        subscriber,
        (a: T) => {
          const { buffer, complete } = otherState
          if (buffer.length === 0) {
            complete ? emit(false) : selfState.buffer.push(a)
          } else {
            !comparator(a, buffer.shift()!) && emit(false)
          }
        },
        () => {
          selfState.complete = true
          const { complete, buffer } = otherState
          complete && emit(buffer.length === 0)
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
  complete: boolean
}
function createState<T>(): SequenceState<T> {
  return {
    buffer: [],
    complete: false,
  }
}
export interface ShareConfig<T> {
  connector?: () => qt.SubjectLike<T>
  resetOnError?: boolean | ((error: any) => Observable<any>)
  resetOnComplete?: boolean | (() => Observable<any>)
  resetOnRefCountZero?: boolean | (() => Observable<any>)
}
export function share<T>(): qt.MonoTypeOperatorFunction<T>
export function share<T>(
  options: ShareConfig<T>
): qt.MonoTypeOperatorFunction<T>
export function share<T>(
  options: ShareConfig<T> = {}
): qt.MonoTypeOperatorFunction<T> {
  const {
    connector = () => new Subject<T>(),
    resetOnError = true,
    resetOnComplete = true,
    resetOnRefCountZero = true,
  } = options
  return wrapperSource => {
    let connection: SafeSubscriber<T> | undefined
    let resetConnection: Subscription | undefined
    let subject: qt.SubjectLike<T> | undefined
    let refCount = 0
    let hasCompleted = false
    let hasErrored = false
    const cancelReset = () => {
      resetConnection?.unsubscribe()
      resetConnection = undefined
    }
    const reset = () => {
      cancelReset()
      connection = subject = undefined
      hasCompleted = hasErrored = false
    }
    const resetAndUnsubscribe = () => {
      const conn = connection
      reset()
      conn?.unsubscribe()
    }
    return qu.operate<T, T>((source, subscriber) => {
      refCount++
      if (!hasErrored && !hasCompleted) {
        cancelReset()
      }
      const dest = (subject = subject ?? connector())
      subscriber.add(() => {
        refCount--
        if (refCount === 0 && !hasErrored && !hasCompleted) {
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
          complete: () => {
            hasCompleted = true
            cancelReset()
            resetConnection = handleReset(reset, resetOnComplete)
            dest.complete()
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
export function shareReplay<T>(
  config: ShareReplayConfig
): qt.MonoTypeOperatorFunction<T>
export function shareReplay<T>(
  bufferSize?: number,
  windowTime?: number,
  scheduler?: qt.Scheduler
): qt.MonoTypeOperatorFunction<T>
export function shareReplay<T>(
  configOrBufferSize?: ShareReplayConfig | number,
  windowTime?: number,
  scheduler?: qt.Scheduler
): qt.MonoTypeOperatorFunction<T> {
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
    resetOnComplete: false,
    resetOnRefCountZero: refCount,
  })
}
export function single<T>(
  predicate: BooleanConstructor
): qt.OperatorFunction<T, qt.TruthyTypesOf<T>>
export function single<T>(
  predicate?: (value: T, index: number, source: Observable<T>) => boolean
): qt.MonoTypeOperatorFunction<T>
export function single<T>(
  predicate?: (value: T, index: number, source: Observable<T>) => boolean
): qt.MonoTypeOperatorFunction<T> {
  return qu.operate((source, subscriber) => {
    let hasValue = false
    let singleValue: T
    let seenValue = false
    let index = 0
    source.subscribe(
      createOperatorSubscriber(
        subscriber,
        value => {
          seenValue = true
          if (!predicate || predicate(value, index++, source)) {
            hasValue &&
              subscriber.error(new qu.SequenceError("Too many matching values"))
            hasValue = true
            singleValue = value
          }
        },
        () => {
          if (hasValue) {
            subscriber.next(singleValue)
            subscriber.complete()
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
export function skip<T>(count: number): qt.MonoTypeOperatorFunction<T> {
  return filter((_, index) => count <= index)
}
export function skipLast<T>(skipCount: number): qt.MonoTypeOperatorFunction<T> {
  return skipCount <= 0
    ? qu.identity
    : qu.operate((source, subscriber) => {
        let ring: T[] = new Array(skipCount)
        let seen = 0
        source.subscribe(
          createOperatorSubscriber(subscriber, value => {
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
export function skipUntil<T>(
  notifier: Observable<any>
): qt.MonoTypeOperatorFunction<T> {
  return qu.operate((source, subscriber) => {
    let taking = false
    const skipSubscriber = createOperatorSubscriber(
      subscriber,
      () => {
        skipSubscriber?.unsubscribe()
        taking = true
      },
      qu.noop
    )
    innerFrom(notifier).subscribe(skipSubscriber)
    source.subscribe(
      createOperatorSubscriber(
        subscriber,
        value => taking && subscriber.next(value)
      )
    )
  })
}
export function skipWhile<T>(
  predicate: BooleanConstructor
): qt.OperatorFunction<T, Extract<T, qt.Falsy> extends never ? never : T>
export function skipWhile<T>(
  predicate: (value: T, index: number) => true
): qt.OperatorFunction<T, never>
export function skipWhile<T>(
  predicate: (value: T, index: number) => boolean
): qt.MonoTypeOperatorFunction<T>
export function skipWhile<T>(
  predicate: (value: T, index: number) => boolean
): qt.MonoTypeOperatorFunction<T> {
  return qu.operate((source, subscriber) => {
    let taking = false
    let index = 0
    source.subscribe(
      createOperatorSubscriber(
        subscriber,
        value =>
          (taking || (taking = !predicate(value, index++))) &&
          subscriber.next(value)
      )
    )
  })
}
export function startWith<T>(value: null): qt.OperatorFunction<T, T | null>
export function startWith<T>(
  value: undefined
): qt.OperatorFunction<T, T | undefined>
export function startWith<T, A extends readonly unknown[] = T[]>(
  ...valuesAndScheduler: [...A, qt.Scheduler]
): qt.OperatorFunction<T, T | qt.ValueFromArray<A>>
export function startWith<T, A extends readonly unknown[] = T[]>(
  ...values: A
): qt.OperatorFunction<T, T | qt.ValueFromArray<A>>
export function startWith<T, D>(...values: D[]): qt.OperatorFunction<T, T | D> {
  const scheduler = qu.popScheduler(values)
  return qu.operate((source, subscriber) => {
    ;(scheduler
      ? concat(values, source, scheduler)
      : concat(values, source)
    ).subscribe(subscriber)
  })
}
export function subscribeOn<T>(
  scheduler: qt.Scheduler,
  delay = 0
): qt.MonoTypeOperatorFunction<T> {
  return qu.operate((source, subscriber) => {
    subscriber.add(
      scheduler.schedule(() => source.subscribe(subscriber), delay)
    )
  })
}
export function switchAll<
  O extends qt.ObservableInput<any>
>(): qt.OperatorFunction<O, qt.ObservedValueOf<O>> {
  return switchMap(qu.identity)
}
export function switchMap<T, O extends qt.ObservableInput<any>>(
  project: (value: T, index: number) => O
): qt.OperatorFunction<T, qt.ObservedValueOf<O>>
export function switchMap<T, O extends qt.ObservableInput<any>>(
  project: (value: T, index: number) => O,
  resultSelector: undefined
): qt.OperatorFunction<T, qt.ObservedValueOf<O>>
export function switchMap<T, R, O extends qt.ObservableInput<any>>(
  project: (value: T, index: number) => O,
  resultSelector: (
    outerValue: T,
    innerValue: qt.ObservedValueOf<O>,
    outerIndex: number,
    innerIndex: number
  ) => R
): qt.OperatorFunction<T, R>
export function switchMap<T, R, O extends qt.ObservableInput<any>>(
  project: (value: T, index: number) => O,
  resultSelector?: (
    outerValue: T,
    innerValue: qt.ObservedValueOf<O>,
    outerIndex: number,
    innerIndex: number
  ) => R
): qt.OperatorFunction<T, qt.ObservedValueOf<O> | R> {
  return qu.operate((source, subscriber) => {
    let innerSubscriber: Subscriber<qt.ObservedValueOf<O>> | null = null
    let index = 0
    let isComplete = false
    const checkComplete = () =>
      isComplete && !innerSubscriber && subscriber.complete()
    source.subscribe(
      createOperatorSubscriber(
        subscriber,
        value => {
          innerSubscriber?.unsubscribe()
          let innerIndex = 0
          const outerIndex = index++
          innerFrom(project(value, outerIndex)).subscribe(
            (innerSubscriber = createOperatorSubscriber(
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
                checkComplete()
              }
            ))
          )
        },
        () => {
          isComplete = true
          checkComplete()
        }
      )
    )
  })
}
export function switchMapTo<O extends qt.ObservableInput<unknown>>(
  observable: O
): qt.OperatorFunction<unknown, qt.ObservedValueOf<O>>
export function switchMapTo<O extends qt.ObservableInput<unknown>>(
  observable: O,
  resultSelector: undefined
): qt.OperatorFunction<unknown, qt.ObservedValueOf<O>>
export function switchMapTo<T, R, O extends qt.ObservableInput<unknown>>(
  observable: O,
  resultSelector: (
    outerValue: T,
    innerValue: qt.ObservedValueOf<O>,
    outerIndex: number,
    innerIndex: number
  ) => R
): qt.OperatorFunction<T, R>
export function switchMapTo<T, R, O extends qt.ObservableInput<unknown>>(
  innerObservable: O,
  resultSelector?: (
    outerValue: T,
    innerValue: qt.ObservedValueOf<O>,
    outerIndex: number,
    innerIndex: number
  ) => R
): qt.OperatorFunction<T, qt.ObservedValueOf<O> | R> {
  return qu.isFunction(resultSelector)
    ? switchMap(() => innerObservable, resultSelector)
    : switchMap(() => innerObservable)
}
export function switchScan<T, R, O extends qt.ObservableInput<any>>(
  accumulator: (acc: R, value: T, index: number) => O,
  seed: R
): qt.OperatorFunction<T, qt.ObservedValueOf<O>> {
  return qu.operate((source, subscriber) => {
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
export function take<T>(count: number): qt.MonoTypeOperatorFunction<T> {
  return count <= 0
    ? () => EMPTY
    : qu.operate((source, subscriber) => {
        let seen = 0
        source.subscribe(
          createOperatorSubscriber(subscriber, value => {
            if (++seen <= count) {
              subscriber.next(value)
              if (count <= seen) {
                subscriber.complete()
              }
            }
          })
        )
      })
}
export function takeLast<T>(count: number): qt.MonoTypeOperatorFunction<T> {
  return count <= 0
    ? () => EMPTY
    : qu.operate((source, subscriber) => {
        let buffer: T[] = []
        source.subscribe(
          createOperatorSubscriber(
            subscriber,
            value => {
              buffer.push(value)
              count < buffer.length && buffer.shift()
            },
            () => {
              for (const value of buffer) {
                subscriber.next(value)
              }
              subscriber.complete()
            },
            undefined,
            () => {
              buffer = null!
            }
          )
        )
      })
}
export function takeUntil<T>(
  notifier: qt.ObservableInput<any>
): qt.MonoTypeOperatorFunction<T> {
  return qu.operate((source, subscriber) => {
    innerFrom(notifier).subscribe(
      createOperatorSubscriber(subscriber, () => subscriber.complete(), qu.noop)
    )
    !subscriber.closed && source.subscribe(subscriber)
  })
}
export function takeWhile<T>(
  predicate: BooleanConstructor,
  inclusive: true
): qt.MonoTypeOperatorFunction<T>
export function takeWhile<T>(
  predicate: BooleanConstructor,
  inclusive: false
): qt.OperatorFunction<T, qt.TruthyTypesOf<T>>
export function takeWhile<T>(
  predicate: BooleanConstructor
): qt.OperatorFunction<T, qt.TruthyTypesOf<T>>
export function takeWhile<T, S extends T>(
  predicate: (value: T, index: number) => value is S
): qt.OperatorFunction<T, S>
export function takeWhile<T, S extends T>(
  predicate: (value: T, index: number) => value is S,
  inclusive: false
): qt.OperatorFunction<T, S>
export function takeWhile<T>(
  predicate: (value: T, index: number) => boolean,
  inclusive?: boolean
): qt.MonoTypeOperatorFunction<T>
export function takeWhile<T>(
  predicate: (value: T, index: number) => boolean,
  inclusive = false
): qt.MonoTypeOperatorFunction<T> {
  return qu.operate((source, subscriber) => {
    let index = 0
    source.subscribe(
      createOperatorSubscriber(subscriber, value => {
        const result = predicate(value, index++)
        ;(result || inclusive) && subscriber.next(value)
        !result && subscriber.complete()
      })
    )
  })
}
export interface TapObserver<T> extends qt.Observer<T> {
  subscribe: () => void
  unsubscribe: () => void
  finalize: () => void
}
export function tap<T>(
  observer?: Partial<TapObserver<T>>
): qt.MonoTypeOperatorFunction<T>
export function tap<T>(next: (value: T) => void): qt.MonoTypeOperatorFunction<T>
export function tap<T>(
  next?: ((value: T) => void) | null,
  error?: ((error: any) => void) | null,
  complete?: (() => void) | null
): qt.MonoTypeOperatorFunction<T>
export function tap<T>(
  observerOrNext?: Partial<TapObserver<T>> | ((value: T) => void) | null,
  error?: ((e: any) => void) | null,
  complete?: (() => void) | null
): qt.MonoTypeOperatorFunction<T> {
  const tapObserver =
    qu.isFunction(observerOrNext) || error || complete
      ? ({
          next: observerOrNext as Exclude<
            typeof observerOrNext,
            Partial<TapObserver<T>>
          >,
          error,
          complete,
        } as Partial<TapObserver<T>>)
      : observerOrNext
  return tapObserver
    ? qu.operate((source, subscriber) => {
        tapObserver.subscribe?.()
        let isUnsub = true
        source.subscribe(
          createOperatorSubscriber(
            subscriber,
            value => {
              tapObserver.next?.(value)
              subscriber.next(value)
            },
            () => {
              isUnsub = false
              tapObserver.complete?.()
              subscriber.complete()
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
  durationSelector: (value: T) => qt.ObservableInput<any>,
  config: ThrottleConfig = defaultThrottleConfig
): qt.MonoTypeOperatorFunction<T> {
  return qu.operate((source, subscriber) => {
    const { leading, trailing } = config
    let hasValue = false
    let sendValue: T | null = null
    let throttled: Subscription | null = null
    let isComplete = false
    const endThrottling = () => {
      throttled?.unsubscribe()
      throttled = null
      if (trailing) {
        send()
        isComplete && subscriber.complete()
      }
    }
    const cleanupThrottling = () => {
      throttled = null
      isComplete && subscriber.complete()
    }
    const startThrottle = (value: T) =>
      (throttled = innerFrom(durationSelector(value)).subscribe(
        createOperatorSubscriber(subscriber, endThrottling, cleanupThrottling)
      ))
    const send = () => {
      if (hasValue) {
        hasValue = false
        const value = sendValue!
        sendValue = null
        subscriber.next(value)
        !isComplete && startThrottle(value)
      }
    }
    source.subscribe(
      createOperatorSubscriber(
        subscriber,
        value => {
          hasValue = true
          sendValue = value
          !(throttled && !throttled.closed) &&
            (leading ? send() : startThrottle(value))
        },
        () => {
          isComplete = true
          !(trailing && hasValue && throttled && !throttled.closed) &&
            subscriber.complete()
        }
      )
    )
  })
}
export function throttleTime<T>(
  duration: number,
  scheduler: qt.Scheduler = asyncScheduler,
  config = defaultThrottleConfig
): qt.MonoTypeOperatorFunction<T> {
  const duration$ = timer(duration, scheduler)
  return throttle(() => duration$, config)
}
export function throwIfEmpty<T>(
  errorFactory: () => any = defaultErrorFactory
): qt.MonoTypeOperatorFunction<T> {
  return qu.operate((source, subscriber) => {
    let hasValue = false
    source.subscribe(
      createOperatorSubscriber(
        subscriber,
        value => {
          hasValue = true
          subscriber.next(value)
        },
        () =>
          hasValue ? subscriber.complete() : subscriber.error(errorFactory())
      )
    )
  })
}
function defaultErrorFactory() {
  return new qu.EmptyError()
}
export function timeInterval<T>(
  scheduler: qt.Scheduler = asyncScheduler
): qt.OperatorFunction<T, TimeInterval<T>> {
  return qu.operate((source, subscriber) => {
    let last = scheduler.now()
    source.subscribe(
      createOperatorSubscriber(subscriber, value => {
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
  O extends qt.ObservableInput<unknown> = qt.ObservableInput<T>,
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
export function timeout<T, O extends qt.ObservableInput<unknown>, M = unknown>(
  config: TimeoutConfig<T, O, M> & { with: (info: TimeoutInfo<T, M>) => O }
): qt.OperatorFunction<T, T | qt.ObservedValueOf<O>>
export function timeout<T, M = unknown>(
  config: Omit<TimeoutConfig<T, any, M>, "with">
): qt.OperatorFunction<T, T>
export function timeout<T>(
  first: Date,
  scheduler?: qt.Scheduler
): qt.MonoTypeOperatorFunction<T>
export function timeout<T>(
  each: number,
  scheduler?: qt.Scheduler
): qt.MonoTypeOperatorFunction<T>
export function timeout<T, O extends qt.ObservableInput<any>, M>(
  config: number | Date | TimeoutConfig<T, O, M>,
  schedulerArg?: qt.Scheduler
): qt.OperatorFunction<T, T | qt.ObservedValueOf<O>> {
  const {
    first,
    each,
    with: _with = timeoutErrorFactory,
    scheduler = schedulerArg ?? asyncScheduler,
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
  return qu.operate((source, subscriber) => {
    let originalSourceSubscription: Subscription
    let timerSubscription: Subscription
    let lastValue: T | null = null
    let seen = 0
    const startTimer = (delay: number) => {
      timerSubscription = executeSchedule(
        subscriber,
        scheduler,
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
      createOperatorSubscriber(
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
  switchTo: qt.ObservableInput<R>,
  scheduler?: qt.Scheduler
): qt.OperatorFunction<T, T | R>
export function timeoutWith<T, R>(
  waitFor: number,
  switchTo: qt.ObservableInput<R>,
  scheduler?: qt.Scheduler
): qt.OperatorFunction<T, T | R>
export function timeoutWith<T, R>(
  due: number | Date,
  withObservable: qt.ObservableInput<R>,
  scheduler?: qt.Scheduler
): qt.OperatorFunction<T, T | R> {
  let first: number | Date | undefined
  let each: number | undefined
  let _with: () => qt.ObservableInput<R>
  scheduler = scheduler ?? async
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
  return timeout<T, qt.ObservableInput<R>>({
    first,
    each,
    scheduler,
    with: _with,
  })
}
export function timestamp<T>(
  timestampProvider: qt.TimestampProvider = stampProvider
): qt.OperatorFunction<T, Timestamp<T>> {
  return map((value: T) => ({ value, timestamp: timestampProvider.now() }))
}
const arrReducer = (arr: any[], value: any) => (arr.push(value), arr)
export function toArray<T>(): qt.OperatorFunction<T, T[]> {
  return qu.operate((source, subscriber) => {
    reduce(arrReducer, [] as T[])(source).subscribe(subscriber)
  })
}
export function window<T>(
  windowBoundaries: Observable<any>
): qt.OperatorFunction<T, Observable<T>> {
  return qu.operate((source, subscriber) => {
    let windowSubject: Subject<T> = new Subject<T>()
    subscriber.next(windowSubject.asObservable())
    const errorHandler = (err: any) => {
      windowSubject.error(err)
      subscriber.error(err)
    }
    source.subscribe(
      createOperatorSubscriber(
        subscriber,
        value => windowSubject?.next(value),
        () => {
          windowSubject.complete()
          subscriber.complete()
        },
        errorHandler
      )
    )
    windowBoundaries.subscribe(
      createOperatorSubscriber(
        subscriber,
        () => {
          windowSubject.complete()
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
): qt.OperatorFunction<T, Observable<T>> {
  const startEvery = startWindowEvery > 0 ? startWindowEvery : windowSize
  return qu.operate((source, subscriber) => {
    let windows = [new Subject<T>()]
    let starts: number[] = []
    let count = 0
    subscriber.next(windows[0].asObservable())
    source.subscribe(
      createOperatorSubscriber(
        subscriber,
        (value: T) => {
          for (const window of windows) {
            window.next(value)
          }
          const c = count - windowSize + 1
          if (c >= 0 && c % startEvery === 0) {
            windows.shift()!.complete()
          }
          if (++count % startEvery === 0) {
            const window = new Subject<T>()
            windows.push(window)
            subscriber.next(window.asObservable())
          }
        },
        () => {
          while (windows.length > 0) {
            windows.shift()!.complete()
          }
          subscriber.complete()
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
): qt.OperatorFunction<T, Observable<T>>
export function windowTime<T>(
  windowTimeSpan: number,
  windowCreationInterval: number,
  scheduler?: qt.Scheduler
): qt.OperatorFunction<T, Observable<T>>
export function windowTime<T>(
  windowTimeSpan: number,
  windowCreationInterval: number | null | void,
  maxWindowSize: number,
  scheduler?: qt.Scheduler
): qt.OperatorFunction<T, Observable<T>>
export function windowTime<T>(
  windowTimeSpan: number,
  ...otherArgs: any[]
): qt.OperatorFunction<T, Observable<T>> {
  const scheduler = qu.popScheduler(otherArgs) ?? asyncScheduler
  const windowCreationInterval = (otherArgs[0] as number) ?? null
  const maxWindowSize = (otherArgs[1] as number) || Infinity
  return qu.operate((source, subscriber) => {
    let windowRecords: WindowRecord<T>[] | null = []
    let restartOnClose = false
    const closeWindow = (record: {
      window: Subject<T>
      subs: Subscription
    }) => {
      const { window, subs } = record
      window.complete()
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
        executeSchedule(
          subs,
          scheduler,
          () => closeWindow(record),
          windowTimeSpan
        )
      }
    }
    if (windowCreationInterval !== null && windowCreationInterval >= 0) {
      executeSchedule(
        subscriber,
        scheduler,
        startWindow,
        windowCreationInterval,
        true
      )
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
      createOperatorSubscriber(
        subscriber,
        (value: T) => {
          loop(record => {
            record.window.next(value)
            maxWindowSize <= ++record.seen && closeWindow(record)
          })
        },
        () => terminate(consumer => consumer.complete()),
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
  openings: qt.ObservableInput<O>,
  closingSelector: (openValue: O) => qt.ObservableInput<any>
): qt.OperatorFunction<T, Observable<T>> {
  return qu.operate((source, subscriber) => {
    const windows: Subject<T>[] = []
    const handleError = (err: any) => {
      while (0 < windows.length) {
        windows.shift()!.error(err)
      }
      subscriber.error(err)
    }
    innerFrom(openings).subscribe(
      createOperatorSubscriber(
        subscriber,
        openValue => {
          const window = new Subject<T>()
          windows.push(window)
          const closingSubscription = new Subscription()
          const closeWindow = () => {
            qu.arrRemove(windows, window)
            window.complete()
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
              createOperatorSubscriber(
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
      createOperatorSubscriber(
        subscriber,
        (value: T) => {
          const windowsCopy = windows.slice()
          for (const window of windowsCopy) {
            window.next(value)
          }
        },
        () => {
          while (0 < windows.length) {
            windows.shift()!.complete()
          }
          subscriber.complete()
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
  closingSelector: () => qt.ObservableInput<any>
): qt.OperatorFunction<T, Observable<T>> {
  return qu.operate((source, subscriber) => {
    let window: Subject<T> | null
    let closingSubscriber: Subscriber<any> | undefined
    const handleError = (err: any) => {
      window!.error(err)
      subscriber.error(err)
    }
    const openWindow = () => {
      closingSubscriber?.unsubscribe()
      window?.complete()
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
        (closingSubscriber = createOperatorSubscriber(
          subscriber,
          openWindow,
          openWindow,
          handleError
        ))
      )
    }
    openWindow()
    source.subscribe(
      createOperatorSubscriber(
        subscriber,
        value => window!.next(value),
        () => {
          window!.complete()
          subscriber.complete()
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
  ...inputs: [...qt.ObservableInputTuple<O>]
): qt.OperatorFunction<T, [T, ...O]>
export function withLatestFrom<T, O extends unknown[], R>(
  ...inputs: [...qt.ObservableInputTuple<O>, (...value: [T, ...O]) => R]
): qt.OperatorFunction<T, R>
export function withLatestFrom<T, R>(
  ...inputs: any[]
): qt.OperatorFunction<T, R | any[]> {
  const project = qu.popResultSelector(inputs) as
    | ((...args: any[]) => R)
    | undefined
  return qu.operate((source, subscriber) => {
    const len = inputs.length
    const otherValues = new Array(len)
    let hasValue = inputs.map(() => false)
    let ready = false
    for (let i = 0; i < len; i++) {
      innerFrom(inputs[i]).subscribe(
        createOperatorSubscriber(
          subscriber,
          value => {
            otherValues[i] = value
            if (!ready && !hasValue[i]) {
              hasValue[i] = true
              ;(ready = hasValue.every(qu.identity)) && (hasValue = null!)
            }
          },
          qu.noop
        )
      )
    }
    source.subscribe(
      createOperatorSubscriber(subscriber, value => {
        if (ready) {
          const values = [value, ...otherValues]
          subscriber.next(project ? project(...values) : values)
        }
      })
    )
  })
}
export function zip<T, A extends readonly unknown[]>(
  otherInputs: [...qt.ObservableInputTuple<A>]
): qt.OperatorFunction<T, qt.Cons<T, A>>
export function zip<T, A extends readonly unknown[], R>(
  otherInputsAndProject: [...qt.ObservableInputTuple<A>],
  project: (...values: qt.Cons<T, A>) => R
): qt.OperatorFunction<T, R>
export function zip<T, A extends readonly unknown[]>(
  ...otherInputs: [...qt.ObservableInputTuple<A>]
): qt.OperatorFunction<T, qt.Cons<T, A>>
export function zip<T, A extends readonly unknown[], R>(
  ...otherInputsAndProject: [
    ...qt.ObservableInputTuple<A>,
    (...values: qt.Cons<T, A>) => R
  ]
): qt.OperatorFunction<T, R>
export function zip<T, R>(
  ...sources: Array<qt.ObservableInput<any> | ((...values: Array<any>) => R)>
): qt.OperatorFunction<T, any> {
  return qu.operate((source, subscriber) => {
    zipStatic(
      source as qt.ObservableInput<any>,
      ...(sources as Array<qt.ObservableInput<any>>)
    ).subscribe(subscriber)
  })
}
export function zipAll<T>(): qt.OperatorFunction<qt.ObservableInput<T>, T[]>
export function zipAll<T>(): qt.OperatorFunction<any, T[]>
export function zipAll<T, R>(
  project: (...values: T[]) => R
): qt.OperatorFunction<qt.ObservableInput<T>, R>
export function zipAll<R>(
  project: (...values: Array<any>) => R
): qt.OperatorFunction<any, R>
export function zipAll<T, R>(project?: (...values: T[]) => R) {
  return joinAllInternals(zip, project)
}
export function zipWith<T, A extends readonly unknown[]>(
  ...otherInputs: [...qt.ObservableInputTuple<A>]
): qt.OperatorFunction<T, qt.Cons<T, A>> {
  return zip(...otherInputs)
}
