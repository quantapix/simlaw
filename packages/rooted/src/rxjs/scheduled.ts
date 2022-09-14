import { createInvalidObservableTypeError } from "../util/throwUnobservableError"
import { executeSchedule } from "../util/executeSchedule"
import { innerFrom } from "../observable/innerFrom"
import type {
  InteropObservable,
  SchedulerLike,
  ObservableInput,
  ReadableStreamLike,
} from "../types"
import { isArrayLike } from "../util/isArrayLike"
import { isAsyncIterable } from "../util/isAsyncIterable"
import { isFunction } from "../util/isFunction"
import { isInteropObservable } from "../util/isInteropObservable"
import { isIterable } from "../util/isIterable"
import { isPromise } from "../util/isPromise"
import { isReadableStreamLike } from "../util/isReadableStreamLike"
import { iterator as Symbol_iterator } from "../symbol/iterator"
import { Observable } from "../Observable"
import { observeOn } from "../operators/observeOn"
import { readableStreamLikeToAsyncGenerator } from "../util/isReadableStreamLike"
import { scheduleArray } from "./scheduleArray"
import { scheduleAsyncIterable } from "./scheduleAsyncIterable"
import { scheduleIterable } from "./scheduleIterable"
import { scheduleObservable } from "./scheduleObservable"
import { schedulePromise } from "./schedulePromise"
import { scheduleReadableStreamLike } from "./scheduleReadableStreamLike"
import { subscribeOn } from "../operators/subscribeOn"

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

export function scheduleObservable<T>(
  input: InteropObservable<T>,
  scheduler: SchedulerLike
) {
  return innerFrom(input).pipe(subscribeOn(scheduler), observeOn(scheduler))
}

export function schedulePromise<T>(
  input: PromiseLike<T>,
  scheduler: SchedulerLike
) {
  return innerFrom(input).pipe(subscribeOn(scheduler), observeOn(scheduler))
}

export function scheduleReadableStreamLike<T>(
  input: ReadableStreamLike<T>,
  scheduler: SchedulerLike
): Observable<T> {
  return scheduleAsyncIterable(
    readableStreamLikeToAsyncGenerator(input),
    scheduler
  )
}

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
