import { innerFrom, Observable } from "./observable.js"
import type * as qt from "./types.js"
import * as qu from "./utils.js"
import { iterator as Symbol_iterator } from "./symbol/iterator"
import { observeOn } from "./operator.js"
import { subscribeOn } from "./operator.js"

export function scheduleArray<T>(input: ArrayLike<T>, scheduler: qt.Scheduler) {
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
  scheduler: qt.Scheduler
) {
  if (!input) {
    throw new Error("Iterable cannot be null")
  }
  return new Observable<T>(subscriber => {
    qu.executeSchedule(subscriber, scheduler, () => {
      const iterator = input[Symbol.asyncIterator]()
      qu.executeSchedule(
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
  scheduler: qt.Scheduler
) {
  return new Observable<T>(subscriber => {
    let iterator: Iterator<T, T>

    qu.executeSchedule(subscriber, scheduler, () => {
      iterator = (input as any)[Symbol_iterator]()

      qu.executeSchedule(
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

    return () => qu.isFunction(iterator?.return) && iterator.return()
  })
}

export function scheduleObservable<T>(
  input: qt.Observable<T>,
  scheduler: qt.Scheduler
) {
  return innerFrom(input).pipe(subscribeOn(scheduler), observeOn(scheduler))
}

export function schedulePromise<T>(
  input: PromiseLike<T>,
  scheduler: qt.Scheduler
) {
  return innerFrom(input).pipe(subscribeOn(scheduler), observeOn(scheduler))
}

export function scheduleReadableStreamLike<T>(
  input: qt.ReadableStreamLike<T>,
  scheduler: qt.Scheduler
): Observable<T> {
  return scheduleAsyncIterable(
    qu.readableStreamLikeToAsyncGenerator(input),
    scheduler
  )
}

export function scheduled<T>(
  input: qt.ObservableInput<T>,
  scheduler: qt.Scheduler
): Observable<T> {
  if (input != null) {
    if (qu.isInteropObservable(input)) {
      return scheduleObservable(input, scheduler)
    }
    if (qu.isArrayLike(input)) {
      return scheduleArray(input, scheduler)
    }
    if (qu.isPromise(input)) {
      return schedulePromise(input, scheduler)
    }
    if (qu.isAsyncIterable(input)) {
      return scheduleAsyncIterable(input, scheduler)
    }
    if (qu.isIterable(input)) {
      return scheduleIterable(input, scheduler)
    }
    if (qu.isReadableStreamLike(input)) {
      return scheduleReadableStreamLike(input, scheduler)
    }
  }
  throw qu.createInvalidObservableTypeError(input)
}
