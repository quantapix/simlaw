import { Subscriber } from "../Subscriber"
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
import { Subscriber } from "../Subscriber"
import { MonoTypeOperatorFunction, ObservableInput } from "../types"
import { operate } from "../util/lift"
import { innerFrom } from "../observable/innerFrom"
import { createOperatorSubscriber } from "./OperatorSubscriber"
export function audit<T>(
  durationSelector: (value: T) => ObservableInput<any>
): MonoTypeOperatorFunction<T> {
  return operate((source, subscriber) => {
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
import { asyncScheduler } from "../scheduler/async"
import { audit } from "./audit"
import { timer } from "../observable/timer"
import { MonoTypeOperatorFunction, SchedulerLike } from "../types"
export function auditTime<T>(
  duration: number,
  scheduler: SchedulerLike = asyncScheduler
): MonoTypeOperatorFunction<T> {
  return audit(() => timer(duration, scheduler))
}
import { Observable } from "../Observable"
import { OperatorFunction } from "../types"
import { operate } from "../util/lift"
import { noop } from "../util/noop"
import { createOperatorSubscriber } from "./OperatorSubscriber"
export function buffer<T>(
  closingNotifier: Observable<any>
): OperatorFunction<T, T[]> {
  return operate((source, subscriber) => {
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
        noop
      )
    )
    return () => {
      currentBuffer = null!
    }
  })
}
import { OperatorFunction } from "../types"
import { operate } from "../util/lift"
import { createOperatorSubscriber } from "./OperatorSubscriber"
import { arrRemove } from "../util/arrRemove"
export function bufferCount<T>(
  bufferSize: number,
  startBufferEvery: number | null = null
): OperatorFunction<T, T[]> {
  startBufferEvery = startBufferEvery ?? bufferSize
  return operate((source, subscriber) => {
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
              arrRemove(buffers, buffer)
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
import { Subscription } from "../Subscription"
import { OperatorFunction, SchedulerLike } from "../types"
import { operate } from "../util/lift"
import { createOperatorSubscriber } from "./OperatorSubscriber"
import { arrRemove } from "../util/arrRemove"
import { asyncScheduler } from "../scheduler/async"
import { popScheduler } from "../util/args"
import { executeSchedule } from "../util/executeSchedule"
export function bufferTime<T>(
  bufferTimeSpan: number,
  scheduler?: SchedulerLike
): OperatorFunction<T, T[]>
export function bufferTime<T>(
  bufferTimeSpan: number,
  bufferCreationInterval: number | null | undefined,
  scheduler?: SchedulerLike
): OperatorFunction<T, T[]>
export function bufferTime<T>(
  bufferTimeSpan: number,
  bufferCreationInterval: number | null | undefined,
  maxBufferSize: number,
  scheduler?: SchedulerLike
): OperatorFunction<T, T[]>
export function bufferTime<T>(
  bufferTimeSpan: number,
  ...otherArgs: any[]
): OperatorFunction<T, T[]> {
  const scheduler = popScheduler(otherArgs) ?? asyncScheduler
  const bufferCreationInterval = (otherArgs[0] as number) ?? null
  const maxBufferSize = (otherArgs[1] as number) || Infinity
  return operate((source, subscriber) => {
    let bufferRecords: { buffer: T[]; subs: Subscription }[] | null = []
    let restartOnEmit = false
    const emit = (record: { buffer: T[]; subs: Subscription }) => {
      const { buffer, subs } = record
      subs.unsubscribe()
      arrRemove(bufferRecords, record)
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
import { Subscription } from "../Subscription"
import { OperatorFunction, ObservableInput } from "../types"
import { operate } from "../util/lift"
import { innerFrom } from "../observable/innerFrom"
import { createOperatorSubscriber } from "./OperatorSubscriber"
import { noop } from "../util/noop"
import { arrRemove } from "../util/arrRemove"
export function bufferToggle<T, O>(
  openings: ObservableInput<O>,
  closingSelector: (value: O) => ObservableInput<any>
): OperatorFunction<T, T[]> {
  return operate((source, subscriber) => {
    const buffers: T[][] = []
    innerFrom(openings).subscribe(
      createOperatorSubscriber(
        subscriber,
        openValue => {
          const buffer: T[] = []
          buffers.push(buffer)
          const closingSubscription = new Subscription()
          const emitBuffer = () => {
            arrRemove(buffers, buffer)
            subscriber.next(buffer)
            closingSubscription.unsubscribe()
          }
          closingSubscription.add(
            innerFrom(closingSelector(openValue)).subscribe(
              createOperatorSubscriber(subscriber, emitBuffer, noop)
            )
          )
        },
        noop
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
import { Subscriber } from "../Subscriber"
import { ObservableInput, OperatorFunction } from "../types"
import { operate } from "../util/lift"
import { noop } from "../util/noop"
import { createOperatorSubscriber } from "./OperatorSubscriber"
import { innerFrom } from "../observable/innerFrom"
export function bufferWhen<T>(
  closingSelector: () => ObservableInput<any>
): OperatorFunction<T, T[]> {
  return operate((source, subscriber) => {
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
          noop
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
import { Observable } from "../Observable"
import { ObservableInput, OperatorFunction, ObservedValueOf } from "../types"
import { Subscription } from "../Subscription"
import { innerFrom } from "../observable/innerFrom"
import { createOperatorSubscriber } from "./OperatorSubscriber"
import { operate } from "../util/lift"
export function catchError<T, O extends ObservableInput<any>>(
  selector: (err: any, caught: Observable<T>) => O
): OperatorFunction<T, T | ObservedValueOf<O>>
export function catchError<T, O extends ObservableInput<any>>(
  selector: (err: any, caught: Observable<T>) => O
): OperatorFunction<T, T | ObservedValueOf<O>> {
  return operate((source, subscriber) => {
    let innerSub: Subscription | null = null
    let syncUnsub = false
    let handledResult: Observable<ObservedValueOf<O>>
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
import { combineLatestAll } from "./combineLatestAll"
export const combineAll = combineLatestAll
import { combineLatestInit } from "../observable/combineLatest"
import {
  ObservableInput,
  ObservableInputTuple,
  OperatorFunction,
} from "../types"
import { operate } from "../util/lift"
import { argsOrArgArray } from "../util/argsOrArgArray"
import { mapOneOrManyArgs } from "../util/mapOneOrManyArgs"
import { pipe } from "../util/pipe"
import { popResultSelector } from "../util/args"
export function combineLatest<T, A extends readonly unknown[], R>(
  sources: [...ObservableInputTuple<A>],
  project: (...values: [T, ...A]) => R
): OperatorFunction<T, R>
export function combineLatest<T, A extends readonly unknown[], R>(
  sources: [...ObservableInputTuple<A>]
): OperatorFunction<T, [T, ...A]>
export function combineLatest<T, A extends readonly unknown[], R>(
  ...sourcesAndProject: [
    ...ObservableInputTuple<A>,
    (...values: [T, ...A]) => R
  ]
): OperatorFunction<T, R>
export function combineLatest<T, A extends readonly unknown[], R>(
  ...sources: [...ObservableInputTuple<A>]
): OperatorFunction<T, [T, ...A]>
export function combineLatest<T, R>(
  ...args: (ObservableInput<any> | ((...values: any[]) => R))[]
): OperatorFunction<T, unknown> {
  const resultSelector = popResultSelector(args)
  return resultSelector
    ? pipe(
        combineLatest(...(args as Array<ObservableInput<any>>)),
        mapOneOrManyArgs(resultSelector)
      )
    : operate((source, subscriber) => {
        combineLatestInit([source, ...argsOrArgArray(args)])(subscriber)
      })
}
import { combineLatest } from "../observable/combineLatest"
import { OperatorFunction, ObservableInput } from "../types"
import { joinAllInternals } from "./joinAllInternals"
export function combineLatestAll<T>(): OperatorFunction<ObservableInput<T>, T[]>
export function combineLatestAll<T>(): OperatorFunction<any, T[]>
export function combineLatestAll<T, R>(
  project: (...values: T[]) => R
): OperatorFunction<ObservableInput<T>, R>
export function combineLatestAll<R>(
  project: (...values: Array<any>) => R
): OperatorFunction<any, R>
export function combineLatestAll<R>(project?: (...values: Array<any>) => R) {
  return joinAllInternals(combineLatest, project)
}
import { ObservableInputTuple, OperatorFunction, Cons } from "../types"
import { combineLatest } from "./combineLatest"
export function combineLatestWith<T, A extends readonly unknown[]>(
  ...otherSources: [...ObservableInputTuple<A>]
): OperatorFunction<T, Cons<T, A>> {
  return combineLatest(...otherSources)
}
import { ObservableInputTuple, OperatorFunction, SchedulerLike } from "../types"
import { operate } from "../util/lift"
import { concatAll } from "./concatAll"
import { popScheduler } from "../util/args"
import { from } from "../observable/from"
export function concat<T, A extends readonly unknown[]>(
  ...sources: [...ObservableInputTuple<A>]
): OperatorFunction<T, T | A[number]>
export function concat<T, A extends readonly unknown[]>(
  ...sourcesAndScheduler: [...ObservableInputTuple<A>, SchedulerLike]
): OperatorFunction<T, T | A[number]>
export function concat<T, R>(...args: any[]): OperatorFunction<T, R> {
  const scheduler = popScheduler(args)
  return operate((source, subscriber) => {
    concatAll()(from([source, ...args], scheduler)).subscribe(subscriber)
  })
}
import { mergeAll } from "./mergeAll"
import { OperatorFunction, ObservableInput, ObservedValueOf } from "../types"
export function concatAll<O extends ObservableInput<any>>(): OperatorFunction<
  O,
  ObservedValueOf<O>
> {
  return mergeAll(1)
}
import { mergeMap } from "./mergeMap"
import { ObservableInput, OperatorFunction, ObservedValueOf } from "../types"
import { isFunction } from "../util/isFunction"
export function concatMap<T, O extends ObservableInput<any>>(
  project: (value: T, index: number) => O
): OperatorFunction<T, ObservedValueOf<O>>
export function concatMap<T, O extends ObservableInput<any>>(
  project: (value: T, index: number) => O,
  resultSelector: undefined
): OperatorFunction<T, ObservedValueOf<O>>
export function concatMap<T, R, O extends ObservableInput<any>>(
  project: (value: T, index: number) => O,
  resultSelector: (
    outerValue: T,
    innerValue: ObservedValueOf<O>,
    outerIndex: number,
    innerIndex: number
  ) => R
): OperatorFunction<T, R>
export function concatMap<T, R, O extends ObservableInput<any>>(
  project: (value: T, index: number) => O,
  resultSelector?: (
    outerValue: T,
    innerValue: ObservedValueOf<O>,
    outerIndex: number,
    innerIndex: number
  ) => R
): OperatorFunction<T, ObservedValueOf<O> | R> {
  return isFunction(resultSelector)
    ? mergeMap(project, resultSelector, 1)
    : mergeMap(project, 1)
}
import { concatMap } from "./concatMap"
import { ObservableInput, OperatorFunction, ObservedValueOf } from "../types"
import { isFunction } from "../util/isFunction"
export function concatMapTo<O extends ObservableInput<unknown>>(
  observable: O
): OperatorFunction<unknown, ObservedValueOf<O>>
export function concatMapTo<O extends ObservableInput<unknown>>(
  observable: O,
  resultSelector: undefined
): OperatorFunction<unknown, ObservedValueOf<O>>
export function concatMapTo<T, R, O extends ObservableInput<unknown>>(
  observable: O,
  resultSelector: (
    outerValue: T,
    innerValue: ObservedValueOf<O>,
    outerIndex: number,
    innerIndex: number
  ) => R
): OperatorFunction<T, R>
export function concatMapTo<T, R, O extends ObservableInput<unknown>>(
  innerObservable: O,
  resultSelector?: (
    outerValue: T,
    innerValue: ObservedValueOf<O>,
    outerIndex: number,
    innerIndex: number
  ) => R
): OperatorFunction<T, ObservedValueOf<O> | R> {
  return isFunction(resultSelector)
    ? concatMap(() => innerObservable, resultSelector)
    : concatMap(() => innerObservable)
}
import { ObservableInputTuple, OperatorFunction } from "../types"
import { concat } from "./concat"
export function concatWith<T, A extends readonly unknown[]>(
  ...otherSources: [...ObservableInputTuple<A>]
): OperatorFunction<T, T | A[number]> {
  return concat(...otherSources)
}
import {
  OperatorFunction,
  ObservableInput,
  ObservedValueOf,
  SubjectLike,
} from "../types"
import { Observable } from "../Observable"
import { Subject } from "../Subject"
import { innerFrom } from "../observable/innerFrom"
import { operate } from "../util/lift"
import { fromSubscribable } from "../observable/fromSubscribable"
export interface ConnectConfig<T> {
  connector: () => SubjectLike<T>
}
const DEFAULT_CONFIG: ConnectConfig<unknown> = {
  connector: () => new Subject<unknown>(),
}
export function connect<T, O extends ObservableInput<unknown>>(
  selector: (shared: Observable<T>) => O,
  config: ConnectConfig<T> = DEFAULT_CONFIG
): OperatorFunction<T, ObservedValueOf<O>> {
  const { connector } = config
  return operate((source, subscriber) => {
    const subject = connector()
    innerFrom(selector(fromSubscribable(subject))).subscribe(subscriber)
    subscriber.add(source.subscribe(subject))
  })
}
import { OperatorFunction } from "../types"
import { reduce } from "./reduce"
export function count<T>(
  predicate?: (value: T, index: number) => boolean
): OperatorFunction<T, number> {
  return reduce(
    (total, value, i) =>
      !predicate || predicate(value, i) ? total + 1 : total,
    0
  )
}
import { Subscriber } from "../Subscriber"
import { MonoTypeOperatorFunction, ObservableInput } from "../types"
import { operate } from "../util/lift"
import { noop } from "../util/noop"
import { createOperatorSubscriber } from "./OperatorSubscriber"
import { innerFrom } from "../observable/innerFrom"
export function debounce<T>(
  durationSelector: (value: T) => ObservableInput<any>
): MonoTypeOperatorFunction<T> {
  return operate((source, subscriber) => {
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
          durationSubscriber = createOperatorSubscriber(subscriber, emit, noop)
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
import { asyncScheduler } from "../scheduler/async"
import { Subscription } from "../Subscription"
import {
  MonoTypeOperatorFunction,
  SchedulerAction,
  SchedulerLike,
} from "../types"
import { operate } from "../util/lift"
import { createOperatorSubscriber } from "./OperatorSubscriber"
export function debounceTime<T>(
  dueTime: number,
  scheduler: SchedulerLike = asyncScheduler
): MonoTypeOperatorFunction<T> {
  return operate((source, subscriber) => {
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
    function emitWhenIdle(this: SchedulerAction<unknown>) {
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
import { OperatorFunction } from "../types"
import { operate } from "../util/lift"
import { createOperatorSubscriber } from "./OperatorSubscriber"
export function defaultIfEmpty<T, R>(
  defaultValue: R
): OperatorFunction<T, T | R> {
  return operate((source, subscriber) => {
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
import { asyncScheduler } from "../scheduler/async"
import { MonoTypeOperatorFunction, SchedulerLike } from "../types"
import { delayWhen } from "./delayWhen"
import { timer } from "../observable/timer"
export function delay<T>(
  due: number | Date,
  scheduler: SchedulerLike = asyncScheduler
): MonoTypeOperatorFunction<T> {
  const duration = timer(due, scheduler)
  return delayWhen(() => duration)
}
import { Observable } from "../Observable"
import { MonoTypeOperatorFunction } from "../types"
import { concat } from "../observable/concat"
import { take } from "./take"
import { ignoreElements } from "./ignoreElements"
import { mapTo } from "./mapTo"
import { mergeMap } from "./mergeMap"
export function delayWhen<T>(
  delayDurationSelector: (value: T, index: number) => Observable<any>,
  subscriptionDelay: Observable<any>
): MonoTypeOperatorFunction<T>
export function delayWhen<T>(
  delayDurationSelector: (value: T, index: number) => Observable<any>
): MonoTypeOperatorFunction<T>
export function delayWhen<T>(
  delayDurationSelector: (value: T, index: number) => Observable<any>,
  subscriptionDelay?: Observable<any>
): MonoTypeOperatorFunction<T> {
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
import { observeNotification } from "../Notification"
import {
  OperatorFunction,
  ObservableNotification,
  ValueFromNotification,
} from "../types"
import { operate } from "../util/lift"
import { createOperatorSubscriber } from "./OperatorSubscriber"
export function dematerialize<
  N extends ObservableNotification<any>
>(): OperatorFunction<N, ValueFromNotification<N>> {
  return operate((source, subscriber) => {
    source.subscribe(
      createOperatorSubscriber(subscriber, notification =>
        observeNotification(notification, subscriber)
      )
    )
  })
}
import { Observable } from "../Observable"
import { MonoTypeOperatorFunction } from "../types"
import { operate } from "../util/lift"
import { createOperatorSubscriber } from "./OperatorSubscriber"
import { noop } from "../util/noop"
export function distinct<T, K>(
  keySelector?: (value: T) => K,
  flushes?: Observable<any>
): MonoTypeOperatorFunction<T> {
  return operate((source, subscriber) => {
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
      createOperatorSubscriber(subscriber, () => distinctKeys.clear(), noop)
    )
  })
}
import { MonoTypeOperatorFunction } from "../types"
import { identity } from "../util/identity"
import { operate } from "../util/lift"
import { createOperatorSubscriber } from "./OperatorSubscriber"
export function distinctUntilChanged<T>(
  comparator?: (previous: T, current: T) => boolean
): MonoTypeOperatorFunction<T>
export function distinctUntilChanged<T, K>(
  comparator: (previous: K, current: K) => boolean,
  keySelector: (value: T) => K
): MonoTypeOperatorFunction<T>
export function distinctUntilChanged<T, K>(
  comparator?: (previous: K, current: K) => boolean,
  keySelector: (value: T) => K = identity as (value: T) => K
): MonoTypeOperatorFunction<T> {
  comparator = comparator ?? defaultCompare
  return operate((source, subscriber) => {
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
import { distinctUntilChanged } from "./distinctUntilChanged"
import { MonoTypeOperatorFunction } from "../types"
export function distinctUntilKeyChanged<T>(
  key: keyof T
): MonoTypeOperatorFunction<T>
export function distinctUntilKeyChanged<T, K extends keyof T>(
  key: K,
  compare: (x: T[K], y: T[K]) => boolean
): MonoTypeOperatorFunction<T>
export function distinctUntilKeyChanged<T, K extends keyof T>(
  key: K,
  compare?: (x: T[K], y: T[K]) => boolean
): MonoTypeOperatorFunction<T> {
  return distinctUntilChanged((x: T, y: T) =>
    compare ? compare(x[key], y[key]) : x[key] === y[key]
  )
}
import { ArgumentOutOfRangeError } from "../util/ArgumentOutOfRangeError"
import { Observable } from "../Observable"
import { OperatorFunction } from "../types"
import { filter } from "./filter"
import { throwIfEmpty } from "./throwIfEmpty"
import { defaultIfEmpty } from "./defaultIfEmpty"
import { take } from "./take"
export function elementAt<T, D = T>(
  index: number,
  defaultValue?: D
): OperatorFunction<T, T | D> {
  if (index < 0) {
    throw new ArgumentOutOfRangeError()
  }
  const hasDefaultValue = arguments.length >= 2
  return (source: Observable<T>) =>
    source.pipe(
      filter((v, i) => i === index),
      take(1),
      hasDefaultValue
        ? defaultIfEmpty(defaultValue!)
        : throwIfEmpty(() => new ArgumentOutOfRangeError())
    )
}
import { Observable } from "../Observable"
import { concat } from "../observable/concat"
import { of } from "../observable/of"
import {
  MonoTypeOperatorFunction,
  SchedulerLike,
  OperatorFunction,
  ValueFromArray,
} from "../types"
export function endWith<T>(
  scheduler: SchedulerLike
): MonoTypeOperatorFunction<T>
export function endWith<T, A extends unknown[] = T[]>(
  ...valuesAndScheduler: [...A, SchedulerLike]
): OperatorFunction<T, T | ValueFromArray<A>>
export function endWith<T, A extends unknown[] = T[]>(
  ...values: A
): OperatorFunction<T, T | ValueFromArray<A>>
export function endWith<T>(
  ...values: Array<T | SchedulerLike>
): MonoTypeOperatorFunction<T> {
  return (source: Observable<T>) =>
    concat(source, of(...values)) as Observable<T>
}
import { Observable } from "../Observable"
import { Falsy, OperatorFunction } from "../types"
import { operate } from "../util/lift"
import { createOperatorSubscriber } from "./OperatorSubscriber"
export function every<T>(
  predicate: BooleanConstructor
): OperatorFunction<T, Exclude<T, Falsy> extends never ? false : boolean>
export function every<T>(
  predicate: BooleanConstructor,
  thisArg: any
): OperatorFunction<T, Exclude<T, Falsy> extends never ? false : boolean>
export function every<T, A>(
  predicate: (
    this: A,
    value: T,
    index: number,
    source: Observable<T>
  ) => boolean,
  thisArg: A
): OperatorFunction<T, boolean>
export function every<T>(
  predicate: (value: T, index: number, source: Observable<T>) => boolean
): OperatorFunction<T, boolean>
export function every<T>(
  predicate: (value: T, index: number, source: Observable<T>) => boolean,
  thisArg?: any
): OperatorFunction<T, boolean> {
  return operate((source, subscriber) => {
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
import { exhaustAll } from "./exhaustAll"
export const exhaust = exhaustAll
import { OperatorFunction, ObservableInput, ObservedValueOf } from "../types"
import { exhaustMap } from "./exhaustMap"
import { identity } from "../util/identity"
export function exhaustAll<O extends ObservableInput<any>>(): OperatorFunction<
  O,
  ObservedValueOf<O>
> {
  return exhaustMap(identity)
}
import { Observable } from "../Observable"
import { Subscriber } from "../Subscriber"
import { ObservableInput, OperatorFunction, ObservedValueOf } from "../types"
import { map } from "./map"
import { innerFrom } from "../observable/innerFrom"
import { operate } from "../util/lift"
import { createOperatorSubscriber } from "./OperatorSubscriber"
export function exhaustMap<T, O extends ObservableInput<any>>(
  project: (value: T, index: number) => O
): OperatorFunction<T, ObservedValueOf<O>>
export function exhaustMap<T, O extends ObservableInput<any>>(
  project: (value: T, index: number) => O,
  resultSelector: undefined
): OperatorFunction<T, ObservedValueOf<O>>
export function exhaustMap<T, I, R>(
  project: (value: T, index: number) => ObservableInput<I>,
  resultSelector: (
    outerValue: T,
    innerValue: I,
    outerIndex: number,
    innerIndex: number
  ) => R
): OperatorFunction<T, R>
export function exhaustMap<T, R, O extends ObservableInput<any>>(
  project: (value: T, index: number) => O,
  resultSelector?: (
    outerValue: T,
    innerValue: ObservedValueOf<O>,
    outerIndex: number,
    innerIndex: number
  ) => R
): OperatorFunction<T, ObservedValueOf<O> | R> {
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
  return operate((source, subscriber) => {
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
import {
  OperatorFunction,
  ObservableInput,
  ObservedValueOf,
  SchedulerLike,
} from "../types"
import { operate } from "../util/lift"
import { mergeInternals } from "./mergeInternals"
export function expand<T, O extends ObservableInput<unknown>>(
  project: (value: T, index: number) => O,
  concurrent?: number,
  scheduler?: SchedulerLike
): OperatorFunction<T, ObservedValueOf<O>>
export function expand<T, O extends ObservableInput<unknown>>(
  project: (value: T, index: number) => O,
  concurrent: number | undefined,
  scheduler: SchedulerLike
): OperatorFunction<T, ObservedValueOf<O>>
export function expand<T, O extends ObservableInput<unknown>>(
  project: (value: T, index: number) => O,
  concurrent = Infinity,
  scheduler?: SchedulerLike
): OperatorFunction<T, ObservedValueOf<O>> {
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
import {
  OperatorFunction,
  MonoTypeOperatorFunction,
  TruthyTypesOf,
} from "../types"
import { operate } from "../util/lift"
import { createOperatorSubscriber } from "./OperatorSubscriber"
export function filter<T, S extends T, A>(
  predicate: (this: A, value: T, index: number) => value is S,
  thisArg: A
): OperatorFunction<T, S>
export function filter<T, S extends T>(
  predicate: (value: T, index: number) => value is S
): OperatorFunction<T, S>
export function filter<T>(
  predicate: BooleanConstructor
): OperatorFunction<T, TruthyTypesOf<T>>
export function filter<T, A>(
  predicate: (this: A, value: T, index: number) => boolean,
  thisArg: A
): MonoTypeOperatorFunction<T>
export function filter<T>(
  predicate: (value: T, index: number) => boolean
): MonoTypeOperatorFunction<T>
export function filter<T>(
  predicate: (value: T, index: number) => boolean,
  thisArg?: any
): MonoTypeOperatorFunction<T> {
  return operate((source, subscriber) => {
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
import { MonoTypeOperatorFunction } from "../types"
import { operate } from "../util/lift"
export function finalize<T>(callback: () => void): MonoTypeOperatorFunction<T> {
  return operate((source, subscriber) => {
    try {
      source.subscribe(subscriber)
    } finally {
      subscriber.add(callback)
    }
  })
}
import { Observable } from "../Observable"
import { Subscriber } from "../Subscriber"
import { OperatorFunction, TruthyTypesOf } from "../types"
import { operate } from "../util/lift"
import { createOperatorSubscriber } from "./OperatorSubscriber"
export function find<T>(
  predicate: BooleanConstructor
): OperatorFunction<T, TruthyTypesOf<T>>
export function find<T, S extends T, A>(
  predicate: (
    this: A,
    value: T,
    index: number,
    source: Observable<T>
  ) => value is S,
  thisArg: A
): OperatorFunction<T, S | undefined>
export function find<T, S extends T>(
  predicate: (value: T, index: number, source: Observable<T>) => value is S
): OperatorFunction<T, S | undefined>
export function find<T, A>(
  predicate: (
    this: A,
    value: T,
    index: number,
    source: Observable<T>
  ) => boolean,
  thisArg: A
): OperatorFunction<T, T | undefined>
export function find<T>(
  predicate: (value: T, index: number, source: Observable<T>) => boolean
): OperatorFunction<T, T | undefined>
export function find<T>(
  predicate: (value: T, index: number, source: Observable<T>) => boolean,
  thisArg?: any
): OperatorFunction<T, T | undefined> {
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
import { Observable } from "../Observable"
import { Falsy, OperatorFunction } from "../types"
import { operate } from "../util/lift"
import { createFind } from "./find"
export function findIndex<T>(
  predicate: BooleanConstructor
): OperatorFunction<T, T extends Falsy ? -1 : number>
export function findIndex<T>(
  predicate: BooleanConstructor,
  thisArg: any
): OperatorFunction<T, T extends Falsy ? -1 : number>
export function findIndex<T, A>(
  predicate: (
    this: A,
    value: T,
    index: number,
    source: Observable<T>
  ) => boolean,
  thisArg: A
): OperatorFunction<T, number>
export function findIndex<T>(
  predicate: (value: T, index: number, source: Observable<T>) => boolean
): OperatorFunction<T, number>
export function findIndex<T>(
  predicate: (value: T, index: number, source: Observable<T>) => boolean,
  thisArg?: any
): OperatorFunction<T, number> {
  return operate(createFind(predicate, thisArg, "index"))
}
import { Observable } from "../Observable"
import { EmptyError } from "../util/EmptyError"
import { OperatorFunction, TruthyTypesOf } from "../types"
import { filter } from "./filter"
import { take } from "./take"
import { defaultIfEmpty } from "./defaultIfEmpty"
import { throwIfEmpty } from "./throwIfEmpty"
import { identity } from "../util/identity"
export function first<T, D = T>(
  predicate?: null,
  defaultValue?: D
): OperatorFunction<T, T | D>
export function first<T>(
  predicate: BooleanConstructor
): OperatorFunction<T, TruthyTypesOf<T>>
export function first<T, D>(
  predicate: BooleanConstructor,
  defaultValue: D
): OperatorFunction<T, TruthyTypesOf<T> | D>
export function first<T, S extends T>(
  predicate: (value: T, index: number, source: Observable<T>) => value is S,
  defaultValue?: S
): OperatorFunction<T, S>
export function first<T, S extends T, D>(
  predicate: (value: T, index: number, source: Observable<T>) => value is S,
  defaultValue: D
): OperatorFunction<T, S | D>
export function first<T, D = T>(
  predicate: (value: T, index: number, source: Observable<T>) => boolean,
  defaultValue?: D
): OperatorFunction<T, T | D>
export function first<T, D>(
  predicate?:
    | ((value: T, index: number, source: Observable<T>) => boolean)
    | null,
  defaultValue?: D
): OperatorFunction<T, T | D> {
  const hasDefaultValue = arguments.length >= 2
  return (source: Observable<T>) =>
    source.pipe(
      predicate ? filter((v, i) => predicate(v, i, source)) : identity,
      take(1),
      hasDefaultValue
        ? defaultIfEmpty(defaultValue!)
        : throwIfEmpty(() => new EmptyError())
    )
}
import { mergeMap } from "./mergeMap"
export const flatMap = mergeMap
import { Observable } from "../Observable"
import { innerFrom } from "../observable/innerFrom"
import { Subject } from "../Subject"
import {
  ObservableInput,
  Observer,
  OperatorFunction,
  SubjectLike,
} from "../types"
import { operate } from "../util/lift"
import {
  createOperatorSubscriber,
  OperatorSubscriber,
} from "./OperatorSubscriber"
export interface BasicGroupByOptions<K, T> {
  element?: undefined
  duration?: (grouped: GroupedObservable<K, T>) => ObservableInput<any>
  connector?: () => SubjectLike<T>
}
export interface GroupByOptionsWithElement<K, E, T> {
  element: (value: T) => E
  duration?: (grouped: GroupedObservable<K, E>) => ObservableInput<any>
  connector?: () => SubjectLike<E>
}
export function groupBy<T, K>(
  key: (value: T) => K,
  options: BasicGroupByOptions<K, T>
): OperatorFunction<T, GroupedObservable<K, T>>
export function groupBy<T, K, E>(
  key: (value: T) => K,
  options: GroupByOptionsWithElement<K, E, T>
): OperatorFunction<T, GroupedObservable<K, E>>
export function groupBy<T, K extends T>(
  key: (value: T) => value is K
): OperatorFunction<
  T,
  GroupedObservable<true, K> | GroupedObservable<false, Exclude<T, K>>
>
export function groupBy<T, K>(
  key: (value: T) => K
): OperatorFunction<T, GroupedObservable<K, T>>
export function groupBy<T, K>(
  key: (value: T) => K,
  element: void,
  duration: (grouped: GroupedObservable<K, T>) => Observable<any>
): OperatorFunction<T, GroupedObservable<K, T>>
export function groupBy<T, K, R>(
  key: (value: T) => K,
  element?: (value: T) => R,
  duration?: (grouped: GroupedObservable<K, R>) => Observable<any>
): OperatorFunction<T, GroupedObservable<K, R>>
export function groupBy<T, K, R>(
  key: (value: T) => K,
  element?: (value: T) => R,
  duration?: (grouped: GroupedObservable<K, R>) => Observable<any>,
  connector?: () => Subject<R>
): OperatorFunction<T, GroupedObservable<K, R>>
export function groupBy<T, K, R>(
  keySelector: (value: T) => K,
  elementOrOptions?:
    | ((value: any) => any)
    | void
    | BasicGroupByOptions<K, T>
    | GroupByOptionsWithElement<K, R, T>,
  duration?: (grouped: GroupedObservable<any, any>) => ObservableInput<any>,
  connector?: () => SubjectLike<any>
): OperatorFunction<T, GroupedObservable<K, R>> {
  return operate((source, subscriber) => {
    let element: ((value: any) => any) | void
    if (!elementOrOptions || typeof elementOrOptions === "function") {
      element = elementOrOptions as (value: any) => any
    } else {
      ;({ duration, element, connector } = elementOrOptions)
    }
    const groups = new Map<K, SubjectLike<any>>()
    const notify = (cb: (group: Observer<any>) => void) => {
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
    function createGroupedObservable(key: K, groupSubject: SubjectLike<any>) {
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
import { OperatorFunction } from "../types"
import { operate } from "../util/lift"
import { createOperatorSubscriber } from "./OperatorSubscriber"
import { noop } from "../util/noop"
export function ignoreElements(): OperatorFunction<unknown, never> {
  return operate((source, subscriber) => {
    source.subscribe(createOperatorSubscriber(subscriber, noop))
  })
}
import { OperatorFunction } from "../types"
import { operate } from "../util/lift"
import { createOperatorSubscriber } from "./OperatorSubscriber"
export function isEmpty<T>(): OperatorFunction<T, boolean> {
  return operate((source, subscriber) => {
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
import { Observable } from "../Observable"
import { ObservableInput, OperatorFunction } from "../types"
import { identity } from "../util/identity"
import { mapOneOrManyArgs } from "../util/mapOneOrManyArgs"
import { pipe } from "../util/pipe"
import { mergeMap } from "./mergeMap"
import { toArray } from "./toArray"
export function joinAllInternals<T, R>(
  joinFn: (sources: ObservableInput<T>[]) => Observable<T>,
  project?: (...args: any[]) => R
) {
  return pipe(
    toArray() as OperatorFunction<ObservableInput<T>, ObservableInput<T>[]>,
    mergeMap(sources => joinFn(sources)),
    project ? mapOneOrManyArgs(project) : (identity as any)
  )
}
import { Observable } from "../Observable"
import { EmptyError } from "../util/EmptyError"
import { OperatorFunction, TruthyTypesOf } from "../types"
import { filter } from "./filter"
import { takeLast } from "./takeLast"
import { throwIfEmpty } from "./throwIfEmpty"
import { defaultIfEmpty } from "./defaultIfEmpty"
import { identity } from "../util/identity"
export function last<T>(
  predicate: BooleanConstructor
): OperatorFunction<T, TruthyTypesOf<T>>
export function last<T, D>(
  predicate: BooleanConstructor,
  defaultValue: D
): OperatorFunction<T, TruthyTypesOf<T> | D>
export function last<T, D = T>(
  predicate?: null,
  defaultValue?: D
): OperatorFunction<T, T | D>
export function last<T, S extends T>(
  predicate: (value: T, index: number, source: Observable<T>) => value is S,
  defaultValue?: S
): OperatorFunction<T, S>
export function last<T, D = T>(
  predicate: (value: T, index: number, source: Observable<T>) => boolean,
  defaultValue?: D
): OperatorFunction<T, T | D>
export function last<T, D>(
  predicate?:
    | ((value: T, index: number, source: Observable<T>) => boolean)
    | null,
  defaultValue?: D
): OperatorFunction<T, T | D> {
  const hasDefaultValue = arguments.length >= 2
  return (source: Observable<T>) =>
    source.pipe(
      predicate ? filter((v, i) => predicate(v, i, source)) : identity,
      takeLast(1),
      hasDefaultValue
        ? defaultIfEmpty(defaultValue!)
        : throwIfEmpty(() => new EmptyError())
    )
}
import { OperatorFunction } from "../types"
import { operate } from "../util/lift"
import { createOperatorSubscriber } from "./OperatorSubscriber"
export function map<T, R>(
  project: (value: T, index: number) => R
): OperatorFunction<T, R>
export function map<T, R, A>(
  project: (this: A, value: T, index: number) => R,
  thisArg: A
): OperatorFunction<T, R>
export function map<T, R>(
  project: (value: T, index: number) => R,
  thisArg?: any
): OperatorFunction<T, R> {
  return operate((source, subscriber) => {
    let index = 0
    source.subscribe(
      createOperatorSubscriber(subscriber, (value: T) => {
        subscriber.next(project.call(thisArg, value, index++))
      })
    )
  })
}
import { OperatorFunction } from "../types"
import { map } from "./map"
export function mapTo<R>(value: R): OperatorFunction<unknown, R>
export function mapTo<T, R>(value: R): OperatorFunction<T, R>
export function mapTo<R>(value: R): OperatorFunction<unknown, R> {
  return map(() => value)
}
import { Notification } from "../Notification"
import { OperatorFunction, ObservableNotification } from "../types"
import { operate } from "../util/lift"
import { createOperatorSubscriber } from "./OperatorSubscriber"
export function materialize<T>(): OperatorFunction<
  T,
  Notification<T> & ObservableNotification<T>
> {
  return operate((source, subscriber) => {
    source.subscribe(
      createOperatorSubscriber(
        subscriber,
        value => {
          subscriber.next(Notification.createNext(value))
        },
        () => {
          subscriber.next(Notification.createComplete())
          subscriber.complete()
        },
        err => {
          subscriber.next(Notification.createError(err))
          subscriber.complete()
        }
      )
    )
  })
}
import { reduce } from "./reduce"
import { MonoTypeOperatorFunction } from "../types"
import { isFunction } from "../util/isFunction"
export function max<T>(
  comparer?: (x: T, y: T) => number
): MonoTypeOperatorFunction<T> {
  return reduce(
    isFunction(comparer)
      ? (x, y) => (comparer(x, y) > 0 ? x : y)
      : (x, y) => (x > y ? x : y)
  )
}
import {
  ObservableInput,
  ObservableInputTuple,
  OperatorFunction,
  SchedulerLike,
} from "../types"
import { operate } from "../util/lift"
import { argsOrArgArray } from "../util/argsOrArgArray"
import { mergeAll } from "./mergeAll"
import { popNumber, popScheduler } from "../util/args"
import { from } from "../observable/from"
export function merge<T, A extends readonly unknown[]>(
  ...sources: [...ObservableInputTuple<A>]
): OperatorFunction<T, T | A[number]>
export function merge<T, A extends readonly unknown[]>(
  ...sourcesAndConcurrency: [...ObservableInputTuple<A>, number]
): OperatorFunction<T, T | A[number]>
export function merge<T, A extends readonly unknown[]>(
  ...sourcesAndScheduler: [...ObservableInputTuple<A>, SchedulerLike]
): OperatorFunction<T, T | A[number]>
export function merge<T, A extends readonly unknown[]>(
  ...sourcesAndConcurrencyAndScheduler: [
    ...ObservableInputTuple<A>,
    number,
    SchedulerLike
  ]
): OperatorFunction<T, T | A[number]>
export function merge<T>(...args: unknown[]): OperatorFunction<T, unknown> {
  const scheduler = popScheduler(args)
  const concurrent = popNumber(args, Infinity)
  args = argsOrArgArray(args)
  return operate((source, subscriber) => {
    mergeAll(concurrent)(
      from([source, ...(args as ObservableInput<T>[])], scheduler)
    ).subscribe(subscriber)
  })
}
import { mergeMap } from "./mergeMap"
import { identity } from "../util/identity"
import { OperatorFunction, ObservableInput, ObservedValueOf } from "../types"
export function mergeAll<O extends ObservableInput<any>>(
  concurrent: number = Infinity
): OperatorFunction<O, ObservedValueOf<O>> {
  return mergeMap(identity, concurrent)
}
import { Observable } from "../Observable"
import { innerFrom } from "../observable/innerFrom"
import { Subscriber } from "../Subscriber"
import { ObservableInput, SchedulerLike } from "../types"
import { executeSchedule } from "../util/executeSchedule"
import { createOperatorSubscriber } from "./OperatorSubscriber"
export function mergeInternals<T, R>(
  source: Observable<T>,
  subscriber: Subscriber<R>,
  project: (value: T, index: number) => ObservableInput<R>,
  concurrent: number,
  onBeforeNext?: (innerValue: R) => void,
  expand?: boolean,
  innerSubScheduler?: SchedulerLike,
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
import { ObservableInput, OperatorFunction, ObservedValueOf } from "../types"
import { map } from "./map"
import { innerFrom } from "../observable/innerFrom"
import { operate } from "../util/lift"
import { mergeInternals } from "./mergeInternals"
import { isFunction } from "../util/isFunction"
export function mergeMap<T, O extends ObservableInput<any>>(
  project: (value: T, index: number) => O,
  concurrent?: number
): OperatorFunction<T, ObservedValueOf<O>>
export function mergeMap<T, O extends ObservableInput<any>>(
  project: (value: T, index: number) => O,
  resultSelector: undefined,
  concurrent?: number
): OperatorFunction<T, ObservedValueOf<O>>
export function mergeMap<T, R, O extends ObservableInput<any>>(
  project: (value: T, index: number) => O,
  resultSelector: (
    outerValue: T,
    innerValue: ObservedValueOf<O>,
    outerIndex: number,
    innerIndex: number
  ) => R,
  concurrent?: number
): OperatorFunction<T, R>
export function mergeMap<T, R, O extends ObservableInput<any>>(
  project: (value: T, index: number) => O,
  resultSelector?:
    | ((
        outerValue: T,
        innerValue: ObservedValueOf<O>,
        outerIndex: number,
        innerIndex: number
      ) => R)
    | number,
  concurrent: number = Infinity
): OperatorFunction<T, ObservedValueOf<O> | R> {
  if (isFunction(resultSelector)) {
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
import { OperatorFunction, ObservedValueOf, ObservableInput } from "../types"
import { mergeMap } from "./mergeMap"
import { isFunction } from "../util/isFunction"
export function mergeMapTo<O extends ObservableInput<unknown>>(
  innerObservable: O,
  concurrent?: number
): OperatorFunction<unknown, ObservedValueOf<O>>
export function mergeMapTo<T, R, O extends ObservableInput<unknown>>(
  innerObservable: O,
  resultSelector: (
    outerValue: T,
    innerValue: ObservedValueOf<O>,
    outerIndex: number,
    innerIndex: number
  ) => R,
  concurrent?: number
): OperatorFunction<T, R>
export function mergeMapTo<T, R, O extends ObservableInput<unknown>>(
  innerObservable: O,
  resultSelector?:
    | ((
        outerValue: T,
        innerValue: ObservedValueOf<O>,
        outerIndex: number,
        innerIndex: number
      ) => R)
    | number,
  concurrent: number = Infinity
): OperatorFunction<T, ObservedValueOf<O> | R> {
  if (isFunction(resultSelector)) {
    return mergeMap(() => innerObservable, resultSelector, concurrent)
  }
  if (typeof resultSelector === "number") {
    concurrent = resultSelector
  }
  return mergeMap(() => innerObservable, concurrent)
}
import { ObservableInput, OperatorFunction } from "../types"
import { operate } from "../util/lift"
import { mergeInternals } from "./mergeInternals"
export function mergeScan<T, R>(
  accumulator: (acc: R, value: T, index: number) => ObservableInput<R>,
  seed: R,
  concurrent = Infinity
): OperatorFunction<T, R> {
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
import { ObservableInputTuple, OperatorFunction } from "../types"
import { merge } from "./merge"
export function mergeWith<T, A extends readonly unknown[]>(
  ...otherSources: [...ObservableInputTuple<A>]
): OperatorFunction<T, T | A[number]> {
  return merge(...otherSources)
}
import { reduce } from "./reduce"
import { MonoTypeOperatorFunction } from "../types"
import { isFunction } from "../util/isFunction"
export function min<T>(
  comparer?: (x: T, y: T) => number
): MonoTypeOperatorFunction<T> {
  return reduce(
    isFunction(comparer)
      ? (x, y) => (comparer(x, y) < 0 ? x : y)
      : (x, y) => (x < y ? x : y)
  )
}
import { Subject } from "../Subject"
import { Observable } from "../Observable"
import { ConnectableObservable } from "../observable/ConnectableObservable"
import {
  OperatorFunction,
  UnaryFunction,
  ObservedValueOf,
  ObservableInput,
} from "../types"
import { isFunction } from "../util/isFunction"
import { connect } from "./connect"
export function multicast<T>(
  subject: Subject<T>
): UnaryFunction<Observable<T>, ConnectableObservable<T>>
export function multicast<T, O extends ObservableInput<any>>(
  subject: Subject<T>,
  selector: (shared: Observable<T>) => O
): OperatorFunction<T, ObservedValueOf<O>>
export function multicast<T>(
  subjectFactory: () => Subject<T>
): UnaryFunction<Observable<T>, ConnectableObservable<T>>
export function multicast<T, O extends ObservableInput<any>>(
  subjectFactory: () => Subject<T>,
  selector: (shared: Observable<T>) => O
): OperatorFunction<T, ObservedValueOf<O>>
export function multicast<T, R>(
  subjectOrSubjectFactory: Subject<T> | (() => Subject<T>),
  selector?: (source: Observable<T>) => Observable<R>
): OperatorFunction<T, R> {
  const subjectFactory = isFunction(subjectOrSubjectFactory)
    ? subjectOrSubjectFactory
    : () => subjectOrSubjectFactory
  if (isFunction(selector)) {
    return connect(selector, {
      connector: subjectFactory,
    })
  }
  return (source: Observable<T>) =>
    new ConnectableObservable<any>(source, subjectFactory)
}
import { MonoTypeOperatorFunction, SchedulerLike } from "../types"
import { executeSchedule } from "../util/executeSchedule"
import { operate } from "../util/lift"
import { createOperatorSubscriber } from "./OperatorSubscriber"
export function observeOn<T>(
  scheduler: SchedulerLike,
  delay = 0
): MonoTypeOperatorFunction<T> {
  return operate((source, subscriber) => {
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
import { Observable } from "../Observable"
import { ObservableInputTuple, OperatorFunction } from "../types"
import { operate } from "../util/lift"
import { innerFrom } from "../observable/innerFrom"
import { argsOrArgArray } from "../util/argsOrArgArray"
import { createOperatorSubscriber } from "./OperatorSubscriber"
import { noop } from "../util/noop"
export function onErrorResumeNext<T, A extends readonly unknown[]>(
  sources: [...ObservableInputTuple<A>]
): OperatorFunction<T, T | A[number]>
export function onErrorResumeNext<T, A extends readonly unknown[]>(
  ...sources: [...ObservableInputTuple<A>]
): OperatorFunction<T, T | A[number]>
export function onErrorResumeNext<T, A extends readonly unknown[]>(
  ...sources: [[...ObservableInputTuple<A>]] | [...ObservableInputTuple<A>]
): OperatorFunction<T, T | A[number]> {
  const nextSources = argsOrArgArray(
    sources
  ) as unknown as ObservableInputTuple<A>
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
          const innerSub = createOperatorSubscriber(
            subscriber,
            undefined,
            noop,
            noop
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
import { OperatorFunction } from "../types"
import { operate } from "../util/lift"
import { createOperatorSubscriber } from "./OperatorSubscriber"
export function pairwise<T>(): OperatorFunction<T, [T, T]> {
  return operate((source, subscriber) => {
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
import { not } from "../util/not"
import { filter } from "./filter"
import { Observable } from "../Observable"
import { UnaryFunction } from "../types"
export function partition<T>(
  predicate: (value: T, index: number) => boolean,
  thisArg?: any
): UnaryFunction<Observable<T>, [Observable<T>, Observable<T>]> {
  return (source: Observable<T>) =>
    [
      filter(predicate, thisArg)(source),
      filter(not(predicate, thisArg))(source),
    ] as [Observable<T>, Observable<T>]
}
import { map } from "./map"
import { OperatorFunction } from "../types"
export function pluck<T, K1 extends keyof T>(k1: K1): OperatorFunction<T, T[K1]>
export function pluck<T, K1 extends keyof T, K2 extends keyof T[K1]>(
  k1: K1,
  k2: K2
): OperatorFunction<T, T[K1][K2]>
export function pluck<
  T,
  K1 extends keyof T,
  K2 extends keyof T[K1],
  K3 extends keyof T[K1][K2]
>(k1: K1, k2: K2, k3: K3): OperatorFunction<T, T[K1][K2][K3]>
export function pluck<
  T,
  K1 extends keyof T,
  K2 extends keyof T[K1],
  K3 extends keyof T[K1][K2],
  K4 extends keyof T[K1][K2][K3]
>(k1: K1, k2: K2, k3: K3, k4: K4): OperatorFunction<T, T[K1][K2][K3][K4]>
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
): OperatorFunction<T, T[K1][K2][K3][K4][K5]>
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
): OperatorFunction<T, T[K1][K2][K3][K4][K5][K6]>
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
): OperatorFunction<T, unknown>
export function pluck<T>(...properties: string[]): OperatorFunction<T, unknown>
export function pluck<T, R>(
  ...properties: Array<string | number | symbol>
): OperatorFunction<T, R> {
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
import { Observable } from "../Observable"
import { Subject } from "../Subject"
import { multicast } from "./multicast"
import { ConnectableObservable } from "../observable/ConnectableObservable"
import {
  MonoTypeOperatorFunction,
  OperatorFunction,
  UnaryFunction,
  ObservableInput,
  ObservedValueOf,
} from "../types"
import { connect } from "./connect"
export function publish<T>(): UnaryFunction<
  Observable<T>,
  ConnectableObservable<T>
>
export function publish<T, O extends ObservableInput<any>>(
  selector: (shared: Observable<T>) => O
): OperatorFunction<T, ObservedValueOf<O>>
export function publish<T, R>(
  selector?: OperatorFunction<T, R>
): MonoTypeOperatorFunction<T> | OperatorFunction<T, R> {
  return selector
    ? source => connect(selector)(source)
    : source => multicast(new Subject<T>())(source)
}
import { Observable } from "../Observable"
import { BehaviorSubject } from "../BehaviorSubject"
import { ConnectableObservable } from "../observable/ConnectableObservable"
import { UnaryFunction } from "../types"
export function publishBehavior<T>(
  initialValue: T
): UnaryFunction<Observable<T>, ConnectableObservable<T>> {
  return source => {
    const subject = new BehaviorSubject<T>(initialValue)
    return new ConnectableObservable(source, () => subject)
  }
}
import { Observable } from "../Observable"
import { AsyncSubject } from "../AsyncSubject"
import { ConnectableObservable } from "../observable/ConnectableObservable"
import { UnaryFunction } from "../types"
export function publishLast<T>(): UnaryFunction<
  Observable<T>,
  ConnectableObservable<T>
> {
  return source => {
    const subject = new AsyncSubject<T>()
    return new ConnectableObservable(source, () => subject)
  }
}
import { Observable } from "../Observable"
import { ReplaySubject } from "../ReplaySubject"
import { multicast } from "./multicast"
import {
  MonoTypeOperatorFunction,
  OperatorFunction,
  TimestampProvider,
  ObservableInput,
  ObservedValueOf,
} from "../types"
import { isFunction } from "../util/isFunction"
export function publishReplay<T>(
  bufferSize?: number,
  windowTime?: number,
  timestampProvider?: TimestampProvider
): MonoTypeOperatorFunction<T>
export function publishReplay<T, O extends ObservableInput<any>>(
  bufferSize: number | undefined,
  windowTime: number | undefined,
  selector: (shared: Observable<T>) => O,
  timestampProvider?: TimestampProvider
): OperatorFunction<T, ObservedValueOf<O>>
export function publishReplay<T, O extends ObservableInput<any>>(
  bufferSize: number | undefined,
  windowTime: number | undefined,
  selector: undefined,
  timestampProvider: TimestampProvider
): OperatorFunction<T, ObservedValueOf<O>>
export function publishReplay<T, R>(
  bufferSize?: number,
  windowTime?: number,
  selectorOrScheduler?: TimestampProvider | OperatorFunction<T, R>,
  timestampProvider?: TimestampProvider
) {
  if (selectorOrScheduler && !isFunction(selectorOrScheduler)) {
    timestampProvider = selectorOrScheduler
  }
  const selector = isFunction(selectorOrScheduler)
    ? selectorOrScheduler
    : undefined
  return (source: Observable<T>) =>
    multicast(
      new ReplaySubject<T>(bufferSize, windowTime, timestampProvider),
      selector!
    )(source)
}
import { ObservableInputTuple, OperatorFunction } from "../types"
import { argsOrArgArray } from "../util/argsOrArgArray"
import { raceWith } from "./raceWith"
export function race<T, A extends readonly unknown[]>(
  otherSources: [...ObservableInputTuple<A>]
): OperatorFunction<T, T | A[number]>
export function race<T, A extends readonly unknown[]>(
  ...otherSources: [...ObservableInputTuple<A>]
): OperatorFunction<T, T | A[number]>
export function race<T>(...args: any[]): OperatorFunction<T, unknown> {
  return raceWith(...argsOrArgArray(args))
}
import { OperatorFunction, ObservableInputTuple } from "../types"
import { raceInit } from "../observable/race"
import { operate } from "../util/lift"
import { identity } from "../util/identity"
export function raceWith<T, A extends readonly unknown[]>(
  ...otherSources: [...ObservableInputTuple<A>]
): OperatorFunction<T, T | A[number]> {
  return !otherSources.length
    ? identity
    : operate((source, subscriber) => {
        raceInit<T | A[number]>([source, ...otherSources])(subscriber)
      })
}
import { scanInternals } from "./scanInternals"
import { OperatorFunction } from "../types"
import { operate } from "../util/lift"
export function reduce<V, A = V>(
  accumulator: (acc: A | V, value: V, index: number) => A
): OperatorFunction<V, V | A>
export function reduce<V, A>(
  accumulator: (acc: A, value: V, index: number) => A,
  seed: A
): OperatorFunction<V, A>
export function reduce<V, A, S = A>(
  accumulator: (acc: A | S, value: V, index: number) => A,
  seed: S
): OperatorFunction<V, A>
export function reduce<V, A>(
  accumulator: (acc: V | A, value: V, index: number) => A,
  seed?: any
): OperatorFunction<V, V | A> {
  return operate(
    scanInternals(accumulator, seed, arguments.length >= 2, false, true)
  )
}
import { ConnectableObservable } from "../observable/ConnectableObservable"
import { Subscription } from "../Subscription"
import { MonoTypeOperatorFunction } from "../types"
import { operate } from "../util/lift"
import { createOperatorSubscriber } from "./OperatorSubscriber"
export function refCount<T>(): MonoTypeOperatorFunction<T> {
  return operate((source, subscriber) => {
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
import { Subscription } from "../Subscription"
import { EMPTY } from "../observable/empty"
import { operate } from "../util/lift"
import { MonoTypeOperatorFunction, ObservableInput } from "../types"
import { createOperatorSubscriber } from "./OperatorSubscriber"
import { innerFrom } from "../observable/innerFrom"
import { timer } from "../observable/timer"
export interface RepeatConfig {
  count?: number
  delay?: number | ((count: number) => ObservableInput<any>)
}
export function repeat<T>(
  countOrConfig?: number | RepeatConfig
): MonoTypeOperatorFunction<T> {
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
import { Observable } from "../Observable"
import { Subject } from "../Subject"
import { Subscription } from "../Subscription"
import { MonoTypeOperatorFunction } from "../types"
import { operate } from "../util/lift"
import { createOperatorSubscriber } from "./OperatorSubscriber"
export function repeatWhen<T>(
  notifier: (notifications: Observable<void>) => Observable<any>
): MonoTypeOperatorFunction<T> {
  return operate((source, subscriber) => {
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
import { MonoTypeOperatorFunction, ObservableInput } from "../types"
import { operate } from "../util/lift"
import { Subscription } from "../Subscription"
import { createOperatorSubscriber } from "./OperatorSubscriber"
import { identity } from "../util/identity"
import { timer } from "../observable/timer"
import { innerFrom } from "../observable/innerFrom"
export interface RetryConfig {
  count?: number
  delay?: number | ((error: any, retryCount: number) => ObservableInput<any>)
  resetOnSuccess?: boolean
}
export function retry<T>(count?: number): MonoTypeOperatorFunction<T>
export function retry<T>(config: RetryConfig): MonoTypeOperatorFunction<T>
export function retry<T>(
  configOrCount: number | RetryConfig = Infinity
): MonoTypeOperatorFunction<T> {
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
    ? identity
    : operate((source, subscriber) => {
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
import { Observable } from "../Observable"
import { Subject } from "../Subject"
import { Subscription } from "../Subscription"
import { MonoTypeOperatorFunction } from "../types"
import { operate } from "../util/lift"
import { createOperatorSubscriber } from "./OperatorSubscriber"
export function retryWhen<T>(
  notifier: (errors: Observable<any>) => Observable<any>
): MonoTypeOperatorFunction<T> {
  return operate((source, subscriber) => {
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
import { Observable } from "../Observable"
import { MonoTypeOperatorFunction } from "../types"
import { operate } from "../util/lift"
import { noop } from "../util/noop"
import { createOperatorSubscriber } from "./OperatorSubscriber"
export function sample<T>(
  notifier: Observable<any>
): MonoTypeOperatorFunction<T> {
  return operate((source, subscriber) => {
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
        noop
      )
    )
  })
}
import { asyncScheduler } from "../scheduler/async"
import { MonoTypeOperatorFunction, SchedulerLike } from "../types"
import { sample } from "./sample"
import { interval } from "../observable/interval"
export function sampleTime<T>(
  period: number,
  scheduler: SchedulerLike = asyncScheduler
): MonoTypeOperatorFunction<T> {
  return sample(interval(period, scheduler))
}
import { OperatorFunction } from "../types"
import { operate } from "../util/lift"
import { scanInternals } from "./scanInternals"
export function scan<V, A = V>(
  accumulator: (acc: A | V, value: V, index: number) => A
): OperatorFunction<V, V | A>
export function scan<V, A>(
  accumulator: (acc: A, value: V, index: number) => A,
  seed: A
): OperatorFunction<V, A>
export function scan<V, A, S>(
  accumulator: (acc: A | S, value: V, index: number) => A,
  seed: S
): OperatorFunction<V, A>
export function scan<V, A, S>(
  accumulator: (acc: V | A | S, value: V, index: number) => A,
  seed?: S
): OperatorFunction<V, V | A> {
  return operate(
    scanInternals(accumulator, seed as S, arguments.length >= 2, true)
  )
}
import { Observable } from "../Observable"
import { Subscriber } from "../Subscriber"
import { createOperatorSubscriber } from "./OperatorSubscriber"
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
import { Observable } from "../Observable"
import { OperatorFunction } from "../types"
import { operate } from "../util/lift"
import { createOperatorSubscriber } from "./OperatorSubscriber"
export function sequenceEqual<T>(
  compareTo: Observable<T>,
  comparator: (a: T, b: T) => boolean = (a, b) => a === b
): OperatorFunction<T, boolean> {
  return operate((source, subscriber) => {
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
import { Observable } from "../Observable"
import { innerFrom } from "../observable/innerFrom"
import { Subject } from "../Subject"
import { SafeSubscriber } from "../Subscriber"
import { Subscription } from "../Subscription"
import { MonoTypeOperatorFunction, SubjectLike } from "../types"
import { operate } from "../util/lift"
export interface ShareConfig<T> {
  connector?: () => SubjectLike<T>
  resetOnError?: boolean | ((error: any) => Observable<any>)
  resetOnComplete?: boolean | (() => Observable<any>)
  resetOnRefCountZero?: boolean | (() => Observable<any>)
}
export function share<T>(): MonoTypeOperatorFunction<T>
export function share<T>(options: ShareConfig<T>): MonoTypeOperatorFunction<T>
export function share<T>(
  options: ShareConfig<T> = {}
): MonoTypeOperatorFunction<T> {
  const {
    connector = () => new Subject<T>(),
    resetOnError = true,
    resetOnComplete = true,
    resetOnRefCountZero = true,
  } = options
  return wrapperSource => {
    let connection: SafeSubscriber<T> | undefined
    let resetConnection: Subscription | undefined
    let subject: SubjectLike<T> | undefined
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
    return operate<T, T>((source, subscriber) => {
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
import { ReplaySubject } from "../ReplaySubject"
import { MonoTypeOperatorFunction, SchedulerLike } from "../types"
import { share } from "./share"
export interface ShareReplayConfig {
  bufferSize?: number
  windowTime?: number
  refCount: boolean
  scheduler?: SchedulerLike
}
export function shareReplay<T>(
  config: ShareReplayConfig
): MonoTypeOperatorFunction<T>
export function shareReplay<T>(
  bufferSize?: number,
  windowTime?: number,
  scheduler?: SchedulerLike
): MonoTypeOperatorFunction<T>
export function shareReplay<T>(
  configOrBufferSize?: ShareReplayConfig | number,
  windowTime?: number,
  scheduler?: SchedulerLike
): MonoTypeOperatorFunction<T> {
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
import { Observable } from "../Observable"
import { EmptyError } from "../util/EmptyError"
import {
  MonoTypeOperatorFunction,
  OperatorFunction,
  TruthyTypesOf,
} from "../types"
import { SequenceError } from "../util/SequenceError"
import { NotFoundError } from "../util/NotFoundError"
import { operate } from "../util/lift"
import { createOperatorSubscriber } from "./OperatorSubscriber"
export function single<T>(
  predicate: BooleanConstructor
): OperatorFunction<T, TruthyTypesOf<T>>
export function single<T>(
  predicate?: (value: T, index: number, source: Observable<T>) => boolean
): MonoTypeOperatorFunction<T>
export function single<T>(
  predicate?: (value: T, index: number, source: Observable<T>) => boolean
): MonoTypeOperatorFunction<T> {
  return operate((source, subscriber) => {
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
              subscriber.error(new SequenceError("Too many matching values"))
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
                ? new NotFoundError("No matching values")
                : new EmptyError()
            )
          }
        }
      )
    )
  })
}
import { MonoTypeOperatorFunction } from "../types"
import { filter } from "./filter"
export function skip<T>(count: number): MonoTypeOperatorFunction<T> {
  return filter((_, index) => count <= index)
}
import { MonoTypeOperatorFunction } from "../types"
import { identity } from "../util/identity"
import { operate } from "../util/lift"
import { createOperatorSubscriber } from "./OperatorSubscriber"
export function skipLast<T>(skipCount: number): MonoTypeOperatorFunction<T> {
  return skipCount <= 0
    ? identity
    : operate((source, subscriber) => {
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
import { Observable } from "../Observable"
import { MonoTypeOperatorFunction } from "../types"
import { operate } from "../util/lift"
import { createOperatorSubscriber } from "./OperatorSubscriber"
import { innerFrom } from "../observable/innerFrom"
import { noop } from "../util/noop"
export function skipUntil<T>(
  notifier: Observable<any>
): MonoTypeOperatorFunction<T> {
  return operate((source, subscriber) => {
    let taking = false
    const skipSubscriber = createOperatorSubscriber(
      subscriber,
      () => {
        skipSubscriber?.unsubscribe()
        taking = true
      },
      noop
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
import { Falsy, MonoTypeOperatorFunction, OperatorFunction } from "../types"
import { operate } from "../util/lift"
import { createOperatorSubscriber } from "./OperatorSubscriber"
export function skipWhile<T>(
  predicate: BooleanConstructor
): OperatorFunction<T, Extract<T, Falsy> extends never ? never : T>
export function skipWhile<T>(
  predicate: (value: T, index: number) => true
): OperatorFunction<T, never>
export function skipWhile<T>(
  predicate: (value: T, index: number) => boolean
): MonoTypeOperatorFunction<T>
export function skipWhile<T>(
  predicate: (value: T, index: number) => boolean
): MonoTypeOperatorFunction<T> {
  return operate((source, subscriber) => {
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
import { concat } from "../observable/concat"
import { OperatorFunction, SchedulerLike, ValueFromArray } from "../types"
import { popScheduler } from "../util/args"
import { operate } from "../util/lift"
export function startWith<T>(value: null): OperatorFunction<T, T | null>
export function startWith<T>(
  value: undefined
): OperatorFunction<T, T | undefined>
export function startWith<T, A extends readonly unknown[] = T[]>(
  ...valuesAndScheduler: [...A, SchedulerLike]
): OperatorFunction<T, T | ValueFromArray<A>>
export function startWith<T, A extends readonly unknown[] = T[]>(
  ...values: A
): OperatorFunction<T, T | ValueFromArray<A>>
export function startWith<T, D>(...values: D[]): OperatorFunction<T, T | D> {
  const scheduler = popScheduler(values)
  return operate((source, subscriber) => {
    ;(scheduler
      ? concat(values, source, scheduler)
      : concat(values, source)
    ).subscribe(subscriber)
  })
}
import { MonoTypeOperatorFunction, SchedulerLike } from "../types"
import { operate } from "../util/lift"
export function subscribeOn<T>(
  scheduler: SchedulerLike,
  delay: number = 0
): MonoTypeOperatorFunction<T> {
  return operate((source, subscriber) => {
    subscriber.add(
      scheduler.schedule(() => source.subscribe(subscriber), delay)
    )
  })
}
import { OperatorFunction, ObservableInput, ObservedValueOf } from "../types"
import { switchMap } from "./switchMap"
import { identity } from "../util/identity"
export function switchAll<O extends ObservableInput<any>>(): OperatorFunction<
  O,
  ObservedValueOf<O>
> {
  return switchMap(identity)
}
import { Subscriber } from "../Subscriber"
import { ObservableInput, OperatorFunction, ObservedValueOf } from "../types"
import { innerFrom } from "../observable/innerFrom"
import { operate } from "../util/lift"
import { createOperatorSubscriber } from "./OperatorSubscriber"
export function switchMap<T, O extends ObservableInput<any>>(
  project: (value: T, index: number) => O
): OperatorFunction<T, ObservedValueOf<O>>
export function switchMap<T, O extends ObservableInput<any>>(
  project: (value: T, index: number) => O,
  resultSelector: undefined
): OperatorFunction<T, ObservedValueOf<O>>
export function switchMap<T, R, O extends ObservableInput<any>>(
  project: (value: T, index: number) => O,
  resultSelector: (
    outerValue: T,
    innerValue: ObservedValueOf<O>,
    outerIndex: number,
    innerIndex: number
  ) => R
): OperatorFunction<T, R>
export function switchMap<T, R, O extends ObservableInput<any>>(
  project: (value: T, index: number) => O,
  resultSelector?: (
    outerValue: T,
    innerValue: ObservedValueOf<O>,
    outerIndex: number,
    innerIndex: number
  ) => R
): OperatorFunction<T, ObservedValueOf<O> | R> {
  return operate((source, subscriber) => {
    let innerSubscriber: Subscriber<ObservedValueOf<O>> | null = null
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
import { switchMap } from "./switchMap"
import { ObservableInput, OperatorFunction, ObservedValueOf } from "../types"
import { isFunction } from "../util/isFunction"
export function switchMapTo<O extends ObservableInput<unknown>>(
  observable: O
): OperatorFunction<unknown, ObservedValueOf<O>>
export function switchMapTo<O extends ObservableInput<unknown>>(
  observable: O,
  resultSelector: undefined
): OperatorFunction<unknown, ObservedValueOf<O>>
export function switchMapTo<T, R, O extends ObservableInput<unknown>>(
  observable: O,
  resultSelector: (
    outerValue: T,
    innerValue: ObservedValueOf<O>,
    outerIndex: number,
    innerIndex: number
  ) => R
): OperatorFunction<T, R>
export function switchMapTo<T, R, O extends ObservableInput<unknown>>(
  innerObservable: O,
  resultSelector?: (
    outerValue: T,
    innerValue: ObservedValueOf<O>,
    outerIndex: number,
    innerIndex: number
  ) => R
): OperatorFunction<T, ObservedValueOf<O> | R> {
  return isFunction(resultSelector)
    ? switchMap(() => innerObservable, resultSelector)
    : switchMap(() => innerObservable)
}
import { ObservableInput, ObservedValueOf, OperatorFunction } from "../types"
import { switchMap } from "./switchMap"
import { operate } from "../util/lift"
export function switchScan<T, R, O extends ObservableInput<any>>(
  accumulator: (acc: R, value: T, index: number) => O,
  seed: R
): OperatorFunction<T, ObservedValueOf<O>> {
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
import { MonoTypeOperatorFunction } from "../types"
import { EMPTY } from "../observable/empty"
import { operate } from "../util/lift"
import { createOperatorSubscriber } from "./OperatorSubscriber"
export function take<T>(count: number): MonoTypeOperatorFunction<T> {
  return count <= 0
    ? () => EMPTY
    : operate((source, subscriber) => {
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
import { EMPTY } from "../observable/empty"
import { MonoTypeOperatorFunction } from "../types"
import { operate } from "../util/lift"
import { createOperatorSubscriber } from "./OperatorSubscriber"
export function takeLast<T>(count: number): MonoTypeOperatorFunction<T> {
  return count <= 0
    ? () => EMPTY
    : operate((source, subscriber) => {
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
import { MonoTypeOperatorFunction, ObservableInput } from "../types"
import { operate } from "../util/lift"
import { createOperatorSubscriber } from "./OperatorSubscriber"
import { innerFrom } from "../observable/innerFrom"
import { noop } from "../util/noop"
export function takeUntil<T>(
  notifier: ObservableInput<any>
): MonoTypeOperatorFunction<T> {
  return operate((source, subscriber) => {
    innerFrom(notifier).subscribe(
      createOperatorSubscriber(subscriber, () => subscriber.complete(), noop)
    )
    !subscriber.closed && source.subscribe(subscriber)
  })
}
import {
  OperatorFunction,
  MonoTypeOperatorFunction,
  TruthyTypesOf,
} from "../types"
import { operate } from "../util/lift"
import { createOperatorSubscriber } from "./OperatorSubscriber"
export function takeWhile<T>(
  predicate: BooleanConstructor,
  inclusive: true
): MonoTypeOperatorFunction<T>
export function takeWhile<T>(
  predicate: BooleanConstructor,
  inclusive: false
): OperatorFunction<T, TruthyTypesOf<T>>
export function takeWhile<T>(
  predicate: BooleanConstructor
): OperatorFunction<T, TruthyTypesOf<T>>
export function takeWhile<T, S extends T>(
  predicate: (value: T, index: number) => value is S
): OperatorFunction<T, S>
export function takeWhile<T, S extends T>(
  predicate: (value: T, index: number) => value is S,
  inclusive: false
): OperatorFunction<T, S>
export function takeWhile<T>(
  predicate: (value: T, index: number) => boolean,
  inclusive?: boolean
): MonoTypeOperatorFunction<T>
export function takeWhile<T>(
  predicate: (value: T, index: number) => boolean,
  inclusive = false
): MonoTypeOperatorFunction<T> {
  return operate((source, subscriber) => {
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
import { MonoTypeOperatorFunction, Observer } from "../types"
import { isFunction } from "../util/isFunction"
import { operate } from "../util/lift"
import { createOperatorSubscriber } from "./OperatorSubscriber"
import { identity } from "../util/identity"
export interface TapObserver<T> extends Observer<T> {
  subscribe: () => void
  unsubscribe: () => void
  finalize: () => void
}
export function tap<T>(
  observer?: Partial<TapObserver<T>>
): MonoTypeOperatorFunction<T>
export function tap<T>(next: (value: T) => void): MonoTypeOperatorFunction<T>
export function tap<T>(
  next?: ((value: T) => void) | null,
  error?: ((error: any) => void) | null,
  complete?: (() => void) | null
): MonoTypeOperatorFunction<T>
export function tap<T>(
  observerOrNext?: Partial<TapObserver<T>> | ((value: T) => void) | null,
  error?: ((e: any) => void) | null,
  complete?: (() => void) | null
): MonoTypeOperatorFunction<T> {
  const tapObserver =
    isFunction(observerOrNext) || error || complete
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
    ? operate((source, subscriber) => {
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
    : identity
}
import { Subscription } from "../Subscription"
import { MonoTypeOperatorFunction, ObservableInput } from "../types"
import { operate } from "../util/lift"
import { createOperatorSubscriber } from "./OperatorSubscriber"
import { innerFrom } from "../observable/innerFrom"
export interface ThrottleConfig {
  leading?: boolean
  trailing?: boolean
}
export const defaultThrottleConfig: ThrottleConfig = {
  leading: true,
  trailing: false,
}
export function throttle<T>(
  durationSelector: (value: T) => ObservableInput<any>,
  config: ThrottleConfig = defaultThrottleConfig
): MonoTypeOperatorFunction<T> {
  return operate((source, subscriber) => {
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
import { asyncScheduler } from "../scheduler/async"
import { defaultThrottleConfig, throttle } from "./throttle"
import { MonoTypeOperatorFunction, SchedulerLike } from "../types"
import { timer } from "../observable/timer"
export function throttleTime<T>(
  duration: number,
  scheduler: SchedulerLike = asyncScheduler,
  config = defaultThrottleConfig
): MonoTypeOperatorFunction<T> {
  const duration$ = timer(duration, scheduler)
  return throttle(() => duration$, config)
}
import { EmptyError } from "../util/EmptyError"
import { MonoTypeOperatorFunction } from "../types"
import { operate } from "../util/lift"
import { createOperatorSubscriber } from "./OperatorSubscriber"
export function throwIfEmpty<T>(
  errorFactory: () => any = defaultErrorFactory
): MonoTypeOperatorFunction<T> {
  return operate((source, subscriber) => {
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
  return new EmptyError()
}
import { asyncScheduler } from "../scheduler/async"
import { SchedulerLike, OperatorFunction } from "../types"
import { operate } from "../util/lift"
import { createOperatorSubscriber } from "./OperatorSubscriber"
export function timeInterval<T>(
  scheduler: SchedulerLike = asyncScheduler
): OperatorFunction<T, TimeInterval<T>> {
  return operate((source, subscriber) => {
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
import { asyncScheduler } from "../scheduler/async"
import {
  MonoTypeOperatorFunction,
  SchedulerLike,
  OperatorFunction,
  ObservableInput,
  ObservedValueOf,
} from "../types"
import { isValidDate } from "../util/isDate"
import { Subscription } from "../Subscription"
import { operate } from "../util/lift"
import { Observable } from "../Observable"
import { innerFrom } from "../observable/innerFrom"
import { createErrorClass } from "../util/createErrorClass"
import { createOperatorSubscriber } from "./OperatorSubscriber"
import { executeSchedule } from "../util/executeSchedule"
export interface TimeoutConfig<
  T,
  O extends ObservableInput<unknown> = ObservableInput<T>,
  M = unknown
> {
  each?: number
  first?: number | Date
  scheduler?: SchedulerLike
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
export const TimeoutError: TimeoutErrorCtor = createErrorClass(
  _super =>
    function TimeoutErrorImpl(this: any, info: TimeoutInfo<any> | null = null) {
      _super(this)
      this.message = "Timeout has occurred"
      this.name = "TimeoutError"
      this.info = info
    }
)
export function timeout<T, O extends ObservableInput<unknown>, M = unknown>(
  config: TimeoutConfig<T, O, M> & { with: (info: TimeoutInfo<T, M>) => O }
): OperatorFunction<T, T | ObservedValueOf<O>>
export function timeout<T, M = unknown>(
  config: Omit<TimeoutConfig<T, any, M>, "with">
): OperatorFunction<T, T>
export function timeout<T>(
  first: Date,
  scheduler?: SchedulerLike
): MonoTypeOperatorFunction<T>
export function timeout<T>(
  each: number,
  scheduler?: SchedulerLike
): MonoTypeOperatorFunction<T>
export function timeout<T, O extends ObservableInput<any>, M>(
  config: number | Date | TimeoutConfig<T, O, M>,
  schedulerArg?: SchedulerLike
): OperatorFunction<T, T | ObservedValueOf<O>> {
  const {
    first,
    each,
    with: _with = timeoutErrorFactory,
    scheduler = schedulerArg ?? asyncScheduler,
    meta = null!,
  } = (
    isValidDate(config)
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
import { async } from "../scheduler/async"
import { isValidDate } from "../util/isDate"
import { ObservableInput, OperatorFunction, SchedulerLike } from "../types"
import { timeout } from "./timeout"
export function timeoutWith<T, R>(
  dueBy: Date,
  switchTo: ObservableInput<R>,
  scheduler?: SchedulerLike
): OperatorFunction<T, T | R>
export function timeoutWith<T, R>(
  waitFor: number,
  switchTo: ObservableInput<R>,
  scheduler?: SchedulerLike
): OperatorFunction<T, T | R>
export function timeoutWith<T, R>(
  due: number | Date,
  withObservable: ObservableInput<R>,
  scheduler?: SchedulerLike
): OperatorFunction<T, T | R> {
  let first: number | Date | undefined
  let each: number | undefined
  let _with: () => ObservableInput<R>
  scheduler = scheduler ?? async
  if (isValidDate(due)) {
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
  return timeout<T, ObservableInput<R>>({
    first,
    each,
    scheduler,
    with: _with,
  })
}
import { OperatorFunction, TimestampProvider, Timestamp } from "../types"
import { dateTimestampProvider } from "../scheduler/dateTimestampProvider"
import { map } from "./map"
export function timestamp<T>(
  timestampProvider: TimestampProvider = dateTimestampProvider
): OperatorFunction<T, Timestamp<T>> {
  return map((value: T) => ({ value, timestamp: timestampProvider.now() }))
}
import { reduce } from "./reduce"
import { OperatorFunction } from "../types"
import { operate } from "../util/lift"
const arrReducer = (arr: any[], value: any) => (arr.push(value), arr)
export function toArray<T>(): OperatorFunction<T, T[]> {
  return operate((source, subscriber) => {
    reduce(arrReducer, [] as T[])(source).subscribe(subscriber)
  })
}
import { Observable } from "../Observable"
import { OperatorFunction } from "../types"
import { Subject } from "../Subject"
import { operate } from "../util/lift"
import { createOperatorSubscriber } from "./OperatorSubscriber"
import { noop } from "../util/noop"
export function window<T>(
  windowBoundaries: Observable<any>
): OperatorFunction<T, Observable<T>> {
  return operate((source, subscriber) => {
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
        noop,
        errorHandler
      )
    )
    return () => {
      windowSubject?.unsubscribe()
      windowSubject = null!
    }
  })
}
import { Observable } from "../Observable"
import { Subject } from "../Subject"
import { OperatorFunction } from "../types"
import { operate } from "../util/lift"
import { createOperatorSubscriber } from "./OperatorSubscriber"
export function windowCount<T>(
  windowSize: number,
  startWindowEvery: number = 0
): OperatorFunction<T, Observable<T>> {
  const startEvery = startWindowEvery > 0 ? startWindowEvery : windowSize
  return operate((source, subscriber) => {
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
import { Subject } from "../Subject"
import { asyncScheduler } from "../scheduler/async"
import { Observable } from "../Observable"
import { Subscription } from "../Subscription"
import { Observer, OperatorFunction, SchedulerLike } from "../types"
import { operate } from "../util/lift"
import { createOperatorSubscriber } from "./OperatorSubscriber"
import { arrRemove } from "../util/arrRemove"
import { popScheduler } from "../util/args"
import { executeSchedule } from "../util/executeSchedule"
export function windowTime<T>(
  windowTimeSpan: number,
  scheduler?: SchedulerLike
): OperatorFunction<T, Observable<T>>
export function windowTime<T>(
  windowTimeSpan: number,
  windowCreationInterval: number,
  scheduler?: SchedulerLike
): OperatorFunction<T, Observable<T>>
export function windowTime<T>(
  windowTimeSpan: number,
  windowCreationInterval: number | null | void,
  maxWindowSize: number,
  scheduler?: SchedulerLike
): OperatorFunction<T, Observable<T>>
export function windowTime<T>(
  windowTimeSpan: number,
  ...otherArgs: any[]
): OperatorFunction<T, Observable<T>> {
  const scheduler = popScheduler(otherArgs) ?? asyncScheduler
  const windowCreationInterval = (otherArgs[0] as number) ?? null
  const maxWindowSize = (otherArgs[1] as number) || Infinity
  return operate((source, subscriber) => {
    let windowRecords: WindowRecord<T>[] | null = []
    let restartOnClose = false
    const closeWindow = (record: {
      window: Subject<T>
      subs: Subscription
    }) => {
      const { window, subs } = record
      window.complete()
      subs.unsubscribe()
      arrRemove(windowRecords, record)
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
    const terminate = (cb: (consumer: Observer<any>) => void) => {
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
import { Observable } from "../Observable"
import { Subject } from "../Subject"
import { Subscription } from "../Subscription"
import { ObservableInput, OperatorFunction } from "../types"
import { operate } from "../util/lift"
import { innerFrom } from "../observable/innerFrom"
import { createOperatorSubscriber } from "./OperatorSubscriber"
import { noop } from "../util/noop"
import { arrRemove } from "../util/arrRemove"
export function windowToggle<T, O>(
  openings: ObservableInput<O>,
  closingSelector: (openValue: O) => ObservableInput<any>
): OperatorFunction<T, Observable<T>> {
  return operate((source, subscriber) => {
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
            arrRemove(windows, window)
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
                noop,
                handleError
              )
            )
          )
        },
        noop
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
import { Subscriber } from "../Subscriber"
import { Observable } from "../Observable"
import { Subject } from "../Subject"
import { ObservableInput, OperatorFunction } from "../types"
import { operate } from "../util/lift"
import { createOperatorSubscriber } from "./OperatorSubscriber"
import { innerFrom } from "../observable/innerFrom"
export function windowWhen<T>(
  closingSelector: () => ObservableInput<any>
): OperatorFunction<T, Observable<T>> {
  return operate((source, subscriber) => {
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
import { OperatorFunction, ObservableInputTuple } from "../types"
import { operate } from "../util/lift"
import { createOperatorSubscriber } from "./OperatorSubscriber"
import { innerFrom } from "../observable/innerFrom"
import { identity } from "../util/identity"
import { noop } from "../util/noop"
import { popResultSelector } from "../util/args"
export function withLatestFrom<T, O extends unknown[]>(
  ...inputs: [...ObservableInputTuple<O>]
): OperatorFunction<T, [T, ...O]>
export function withLatestFrom<T, O extends unknown[], R>(
  ...inputs: [...ObservableInputTuple<O>, (...value: [T, ...O]) => R]
): OperatorFunction<T, R>
export function withLatestFrom<T, R>(
  ...inputs: any[]
): OperatorFunction<T, R | any[]> {
  const project = popResultSelector(inputs) as
    | ((...args: any[]) => R)
    | undefined
  return operate((source, subscriber) => {
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
              ;(ready = hasValue.every(identity)) && (hasValue = null!)
            }
          },
          noop
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
import { zip as zipStatic } from "../observable/zip"
import {
  ObservableInput,
  ObservableInputTuple,
  OperatorFunction,
  Cons,
} from "../types"
import { operate } from "../util/lift"
export function zip<T, A extends readonly unknown[]>(
  otherInputs: [...ObservableInputTuple<A>]
): OperatorFunction<T, Cons<T, A>>
export function zip<T, A extends readonly unknown[], R>(
  otherInputsAndProject: [...ObservableInputTuple<A>],
  project: (...values: Cons<T, A>) => R
): OperatorFunction<T, R>
export function zip<T, A extends readonly unknown[]>(
  ...otherInputs: [...ObservableInputTuple<A>]
): OperatorFunction<T, Cons<T, A>>
export function zip<T, A extends readonly unknown[], R>(
  ...otherInputsAndProject: [
    ...ObservableInputTuple<A>,
    (...values: Cons<T, A>) => R
  ]
): OperatorFunction<T, R>
export function zip<T, R>(
  ...sources: Array<ObservableInput<any> | ((...values: Array<any>) => R)>
): OperatorFunction<T, any> {
  return operate((source, subscriber) => {
    zipStatic(
      source as ObservableInput<any>,
      ...(sources as Array<ObservableInput<any>>)
    ).subscribe(subscriber)
  })
}
import { OperatorFunction, ObservableInput } from "../types"
import { zip } from "../observable/zip"
import { joinAllInternals } from "./joinAllInternals"
export function zipAll<T>(): OperatorFunction<ObservableInput<T>, T[]>
export function zipAll<T>(): OperatorFunction<any, T[]>
export function zipAll<T, R>(
  project: (...values: T[]) => R
): OperatorFunction<ObservableInput<T>, R>
export function zipAll<R>(
  project: (...values: Array<any>) => R
): OperatorFunction<any, R>
export function zipAll<T, R>(project?: (...values: T[]) => R) {
  return joinAllInternals(zip, project)
}
import { ObservableInputTuple, OperatorFunction, Cons } from "../types"
import { zip } from "./zip"
export function zipWith<T, A extends readonly unknown[]>(
  ...otherInputs: [...ObservableInputTuple<A>]
): OperatorFunction<T, Cons<T, A>> {
  return zip(...otherInputs)
}
