import { Observable } from '../Observable';
import { SchedulerLike } from '../types';

export function scheduleArray<T>(input: ArrayLike<T>, scheduler: SchedulerLike) {
  return new Observable<T>((subscriber) => {
    // The current array index.
    let i = 0;
    // Start iterating over the array like on a schedule.
    return scheduler.schedule(function () {
      if (i === input.length) {
        // If we have hit the end of the array like in the
        // previous job, we can complete.
        subscriber.complete();
      } else {
        // Otherwise let's next the value at the current index,
        // then increment our index.
        subscriber.next(input[i++]);
        // If the last emission didn't cause us to close the subscriber
        // (via take or some side effect), reschedule the job and we'll
        // make another pass.
        if (!subscriber.closed) {
          this.schedule();
        }
      }
    });
  });
}
import { SchedulerLike } from '../types';
import { Observable } from '../Observable';
import { executeSchedule } from '../util/executeSchedule';

export function scheduleAsyncIterable<T>(input: AsyncIterable<T>, scheduler: SchedulerLike) {
  if (!input) {
    throw new Error('Iterable cannot be null');
  }
  return new Observable<T>((subscriber) => {
    executeSchedule(subscriber, scheduler, () => {
      const iterator = input[Symbol.asyncIterator]();
      executeSchedule(
        subscriber,
        scheduler,
        () => {
          iterator.next().then((result) => {
            if (result.done) {
              // This will remove the subscriptions from
              // the parent subscription.
              subscriber.complete();
            } else {
              subscriber.next(result.value);
            }
          });
        },
        0,
        true
      );
    });
  });
}
import { Observable } from '../Observable';
import { SchedulerLike } from '../types';
import { iterator as Symbol_iterator } from '../symbol/iterator';
import { isFunction } from '../util/isFunction';
import { executeSchedule } from '../util/executeSchedule';

/**
 * Used in {@link scheduled} to create an observable from an Iterable.
 * @param input The iterable to create an observable from
 * @param scheduler The scheduler to use
 */
export function scheduleIterable<T>(input: Iterable<T>, scheduler: SchedulerLike) {
  return new Observable<T>((subscriber) => {
    let iterator: Iterator<T, T>;

    // Schedule the initial creation of the iterator from
    // the iterable. This is so the code in the iterable is
    // not called until the scheduled job fires.
    executeSchedule(subscriber, scheduler, () => {
      // Create the iterator.
      iterator = (input as any)[Symbol_iterator]();

      executeSchedule(
        subscriber,
        scheduler,
        () => {
          let value: T;
          let done: boolean | undefined;
          try {
            // Pull the value out of the iterator
            ({ value, done } = iterator.next());
          } catch (err) {
            // We got an error while pulling from the iterator
            subscriber.error(err);
            return;
          }

          if (done) {
            // If it is "done" we just complete. This mimics the
            // behavior of JavaScript's `for..of` consumption of
            // iterables, which will not emit the value from an iterator
            // result of `{ done: true: value: 'here' }`.
            subscriber.complete();
          } else {
            // The iterable is not done, emit the value.
            subscriber.next(value);
          }
        },
        0,
        true
      );
    });

    // During finalization, if we see this iterator has a `return` method,
    // then we know it is a Generator, and not just an Iterator. So we call
    // the `return()` function. This will ensure that any `finally { }` blocks
    // inside of the generator we can hit will be hit properly.
    return () => isFunction(iterator?.return) && iterator.return();
  });
}
import { innerFrom } from '../observable/innerFrom';
import { observeOn } from '../operators/observeOn';
import { subscribeOn } from '../operators/subscribeOn';
import { InteropObservable, SchedulerLike } from '../types';

export function scheduleObservable<T>(input: InteropObservable<T>, scheduler: SchedulerLike) {
  return innerFrom(input).pipe(subscribeOn(scheduler), observeOn(scheduler));
}
import { innerFrom } from '../observable/innerFrom';
import { observeOn } from '../operators/observeOn';
import { subscribeOn } from '../operators/subscribeOn';
import { SchedulerLike } from '../types';

export function schedulePromise<T>(input: PromiseLike<T>, scheduler: SchedulerLike) {
  return innerFrom(input).pipe(subscribeOn(scheduler), observeOn(scheduler));
}
import { SchedulerLike, ReadableStreamLike } from '../types';
import { Observable } from '../Observable';
import { scheduleAsyncIterable } from './scheduleAsyncIterable';
import { readableStreamLikeToAsyncGenerator } from '../util/isReadableStreamLike';

export function scheduleReadableStreamLike<T>(input: ReadableStreamLike<T>, scheduler: SchedulerLike): Observable<T> {
  return scheduleAsyncIterable(readableStreamLikeToAsyncGenerator(input), scheduler);
}
import { scheduleObservable } from './scheduleObservable';
import { schedulePromise } from './schedulePromise';
import { scheduleArray } from './scheduleArray';
import { scheduleIterable } from './scheduleIterable';
import { scheduleAsyncIterable } from './scheduleAsyncIterable';
import { isInteropObservable } from '../util/isInteropObservable';
import { isPromise } from '../util/isPromise';
import { isArrayLike } from '../util/isArrayLike';
import { isIterable } from '../util/isIterable';
import { ObservableInput, SchedulerLike } from '../types';
import { Observable } from '../Observable';
import { isAsyncIterable } from '../util/isAsyncIterable';
import { createInvalidObservableTypeError } from '../util/throwUnobservableError';
import { isReadableStreamLike } from '../util/isReadableStreamLike';
import { scheduleReadableStreamLike } from './scheduleReadableStreamLike';

/**
 * Converts from a common {@link ObservableInput} type to an observable where subscription and emissions
 * are scheduled on the provided scheduler.
 *
 * @see {@link from}
 * @see {@link of}
 *
 * @param input The observable, array, promise, iterable, etc you would like to schedule
 * @param scheduler The scheduler to use to schedule the subscription and emissions from
 * the returned observable.
 */
export function scheduled<T>(input: ObservableInput<T>, scheduler: SchedulerLike): Observable<T> {
  if (input != null) {
    if (isInteropObservable(input)) {
      return scheduleObservable(input, scheduler);
    }
    if (isArrayLike(input)) {
      return scheduleArray(input, scheduler);
    }
    if (isPromise(input)) {
      return schedulePromise(input, scheduler);
    }
    if (isAsyncIterable(input)) {
      return scheduleAsyncIterable(input, scheduler);
    }
    if (isIterable(input)) {
      return scheduleIterable(input, scheduler);
    }
    if (isReadableStreamLike(input)) {
      return scheduleReadableStreamLike(input, scheduler);
    }
  }
  throw createInvalidObservableTypeError(input);
}
