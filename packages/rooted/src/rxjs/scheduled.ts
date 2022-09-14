import { Observable } from "../Observable"
import { SchedulerLike } from "../types"

export function scheduleArray<T>(
  input: ArrayLike<T>,
  scheduler: SchedulerLike
) {
  return new Observable<T>(subscriber => {
    let i = 0

    return scheduler.schedule(function () {
      if (i === input.length) {
        subscriber.complete()
      } else {
        subscriber.next(input[i++])

        if (!subscriber.closed) {
          this.schedule()
        }
      }
    })
  })
}
import { SchedulerLike } from "../types"
import { Observable } from "../Observable"
import { executeSchedule } from "../util/executeSchedule"

export function scheduleAsyncIterable<T>(
  input: AsyncIterable<T>,
  scheduler: SchedulerLike
) {
  if (!input) {
    throw new Error("Iterable cannot be null")
  }
  return new Observable<T>(subscriber => {
    executeSchedule(subscriber, scheduler, () => {
      const iterator = input[Symbol.asyncIterator]()
      executeSchedule(
        subscriber,
        scheduler,
        () => {
          iterator.next().then(result => {
            if (result.done) {
              subscriber.complete()
            } else {
              subscriber.next(result.value)
            }
          })
        },
        0,
        true
      )
    })
  })
}
import { Observable } from "../Observable"
import { SchedulerLike } from "../types"
import { iterator as Symbol_iterator } from "../symbol/iterator"
import { isFunction } from "../util/isFunction"
import { executeSchedule } from "../util/executeSchedule"

export function scheduleIterable<T>(
  input: Iterable<T>,
  scheduler: SchedulerLike
) {
  return new Observable<T>(subscriber => {
    let iterator: Iterator<T, T>

    executeSchedule(subscriber, scheduler, () => {
      iterator = (input as any)[Symbol_iterator]()

      executeSchedule(
        subscriber,
        scheduler,
        () => {
          let value: T
          let done: boolean | undefined
          try {
            ;({ value, done } = iterator.next())
          } catch (err) {
            subscriber.error(err)
            return
          }

          if (done) {
            subscriber.complete()
          } else {
            subscriber.next(value)
          }
        },
        0,
        true
      )
    })

    return () => isFunction(iterator?.return) && iterator.return()
  })
}
import { innerFrom } from "../observable/innerFrom"
import { observeOn } from "../operators/observeOn"
import { subscribeOn } from "../operators/subscribeOn"
import { InteropObservable, SchedulerLike } from "../types"

export function scheduleObservable<T>(
  input: InteropObservable<T>,
  scheduler: SchedulerLike
) {
  return innerFrom(input).pipe(subscribeOn(scheduler), observeOn(scheduler))
}
import { innerFrom } from "../observable/innerFrom"
import { observeOn } from "../operators/observeOn"
import { subscribeOn } from "../operators/subscribeOn"
import { SchedulerLike } from "../types"

export function schedulePromise<T>(
  input: PromiseLike<T>,
  scheduler: SchedulerLike
) {
  return innerFrom(input).pipe(subscribeOn(scheduler), observeOn(scheduler))
}
import { SchedulerLike, ReadableStreamLike } from "../types"
import { Observable } from "../Observable"
import { scheduleAsyncIterable } from "./scheduleAsyncIterable"
import { readableStreamLikeToAsyncGenerator } from "../util/isReadableStreamLike"

export function scheduleReadableStreamLike<T>(
  input: ReadableStreamLike<T>,
  scheduler: SchedulerLike
): Observable<T> {
  return scheduleAsyncIterable(
    readableStreamLikeToAsyncGenerator(input),
    scheduler
  )
}
import { scheduleObservable } from "./scheduleObservable"
import { schedulePromise } from "./schedulePromise"
import { scheduleArray } from "./scheduleArray"
import { scheduleIterable } from "./scheduleIterable"
import { scheduleAsyncIterable } from "./scheduleAsyncIterable"
import { isInteropObservable } from "../util/isInteropObservable"
import { isPromise } from "../util/isPromise"
import { isArrayLike } from "../util/isArrayLike"
import { isIterable } from "../util/isIterable"
import { ObservableInput, SchedulerLike } from "../types"
import { Observable } from "../Observable"
import { isAsyncIterable } from "../util/isAsyncIterable"
import { createInvalidObservableTypeError } from "../util/throwUnobservableError"
import { isReadableStreamLike } from "../util/isReadableStreamLike"
import { scheduleReadableStreamLike } from "./scheduleReadableStreamLike"

export function scheduled<T>(
  input: ObservableInput<T>,
  scheduler: SchedulerLike
): Observable<T> {
  if (input != null) {
    if (isInteropObservable(input)) {
      return scheduleObservable(input, scheduler)
    }
    if (isArrayLike(input)) {
      return scheduleArray(input, scheduler)
    }
    if (isPromise(input)) {
      return schedulePromise(input, scheduler)
    }
    if (isAsyncIterable(input)) {
      return scheduleAsyncIterable(input, scheduler)
    }
    if (isIterable(input)) {
      return scheduleIterable(input, scheduler)
    }
    if (isReadableStreamLike(input)) {
      return scheduleReadableStreamLike(input, scheduler)
    }
  }
  throw createInvalidObservableTypeError(input)
}
