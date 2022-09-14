import { Subscriber } from '../Subscriber';

/**
 * Creates an instance of an `OperatorSubscriber`.
 * @param destination The downstream subscriber.
 * @param onNext Handles next values, only called if this subscriber is not stopped or closed. Any
 * error that occurs in this function is caught and sent to the `error` method of this subscriber.
 * @param onError Handles errors from the subscription, any errors that occur in this handler are caught
 * and send to the `destination` error handler.
 * @param onComplete Handles completion notification from the subscription. Any errors that occur in
 * this handler are sent to the `destination` error handler.
 * @param onFinalize Additional teardown logic here. This will only be called on teardown if the
 * subscriber itself is not already closed. This is called after all other teardown logic is executed.
 */
export function createOperatorSubscriber<T>(
  destination: Subscriber<any>,
  onNext?: (value: T) => void,
  onComplete?: () => void,
  onError?: (err: any) => void,
  onFinalize?: () => void
): Subscriber<T> {
  return new OperatorSubscriber(destination, onNext, onComplete, onError, onFinalize);
}

/**
 * A generic helper for allowing operators to be created with a Subscriber and
 * use closures to capture necessary state from the operator function itself.
 */
export class OperatorSubscriber<T> extends Subscriber<T> {
  /**
   * Creates an instance of an `OperatorSubscriber`.
   * @param destination The downstream subscriber.
   * @param onNext Handles next values, only called if this subscriber is not stopped or closed. Any
   * error that occurs in this function is caught and sent to the `error` method of this subscriber.
   * @param onError Handles errors from the subscription, any errors that occur in this handler are caught
   * and send to the `destination` error handler.
   * @param onComplete Handles completion notification from the subscription. Any errors that occur in
   * this handler are sent to the `destination` error handler.
   * @param onFinalize Additional finalization logic here. This will only be called on finalization if the
   * subscriber itself is not already closed. This is called after all other finalization logic is executed.
   * @param shouldUnsubscribe An optional check to see if an unsubscribe call should truly unsubscribe.
   * NOTE: This currently **ONLY** exists to support the strange behavior of {@link groupBy}, where unsubscription
   * to the resulting observable does not actually disconnect from the source if there are active subscriptions
   * to any grouped observable. (DO NOT EXPOSE OR USE EXTERNALLY!!!)
   */
  constructor(
    destination: Subscriber<any>,
    onNext?: (value: T) => void,
    onComplete?: () => void,
    onError?: (err: any) => void,
    private onFinalize?: () => void,
    private shouldUnsubscribe?: () => boolean
  ) {
    // It's important - for performance reasons - that all of this class's
    // members are initialized and that they are always initialized in the same
    // order. This will ensure that all OperatorSubscriber instances have the
    // same hidden class in V8. This, in turn, will help keep the number of
    // hidden classes involved in property accesses within the base class as
    // low as possible. If the number of hidden classes involved exceeds four,
    // the property accesses will become megamorphic and performance penalties
    // will be incurred - i.e. inline caches won't be used.
    //
    // The reasons for ensuring all instances have the same hidden class are
    // further discussed in this blog post from Benedikt Meurer:
    // https://benediktmeurer.de/2018/03/23/impact-of-polymorphism-on-component-based-frameworks-like-react/
    super(destination);
    this._next = onNext
      ? function (this: OperatorSubscriber<T>, value: T) {
          try {
            onNext(value);
          } catch (err) {
            destination.error(err);
          }
        }
      : super._next;
    this._error = onError
      ? function (this: OperatorSubscriber<T>, err: any) {
          try {
            onError(err);
          } catch (err) {
            // Send any errors that occur down stream.
            destination.error(err);
          } finally {
            // Ensure finalization.
            this.unsubscribe();
          }
        }
      : super._error;
    this._complete = onComplete
      ? function (this: OperatorSubscriber<T>) {
          try {
            onComplete();
          } catch (err) {
            // Send any errors that occur down stream.
            destination.error(err);
          } finally {
            // Ensure finalization.
            this.unsubscribe();
          }
        }
      : super._complete;
  }

  unsubscribe() {
    if (!this.shouldUnsubscribe || this.shouldUnsubscribe()) {
      const { closed } = this;
      super.unsubscribe();
      // Execute additional teardown if we have any and we didn't already do so.
      !closed && this.onFinalize?.();
    }
  }
}
import { Subscriber } from '../Subscriber';
import { MonoTypeOperatorFunction, ObservableInput } from '../types';

import { operate } from '../util/lift';
import { innerFrom } from '../observable/innerFrom';
import { createOperatorSubscriber } from './OperatorSubscriber';

/**
 * Ignores source values for a duration determined by another Observable, then
 * emits the most recent value from the source Observable, then repeats this
 * process.
 *
 * <span class="informal">It's like {@link auditTime}, but the silencing
 * duration is determined by a second Observable.</span>
 *
 * ![](audit.svg)
 *
 * `audit` is similar to `throttle`, but emits the last value from the silenced
 * time window, instead of the first value. `audit` emits the most recent value
 * from the source Observable on the output Observable as soon as its internal
 * timer becomes disabled, and ignores source values while the timer is enabled.
 * Initially, the timer is disabled. As soon as the first source value arrives,
 * the timer is enabled by calling the `durationSelector` function with the
 * source value, which returns the "duration" Observable. When the duration
 * Observable emits a value, the timer is disabled, then the most
 * recent source value is emitted on the output Observable, and this process
 * repeats for the next source value.
 *
 * ## Example
 *
 * Emit clicks at a rate of at most one click per second
 *
 * ```ts
 * import { fromEvent, audit, interval } from 'rxjs';
 *
 * const clicks = fromEvent(document, 'click');
 * const result = clicks.pipe(audit(ev => interval(1000)));
 * result.subscribe(x => console.log(x));
 * ```
 *
 * @see {@link auditTime}
 * @see {@link debounce}
 * @see {@link delayWhen}
 * @see {@link sample}
 * @see {@link throttle}
 *
 * @param durationSelector A function
 * that receives a value from the source Observable, for computing the silencing
 * duration, returned as an Observable or a Promise.
 * @return A function that returns an Observable that performs rate-limiting of
 * emissions from the source Observable.
 */
export function audit<T>(durationSelector: (value: T) => ObservableInput<any>): MonoTypeOperatorFunction<T> {
  return operate((source, subscriber) => {
    let hasValue = false;
    let lastValue: T | null = null;
    let durationSubscriber: Subscriber<any> | null = null;
    let isComplete = false;

    const endDuration = () => {
      durationSubscriber?.unsubscribe();
      durationSubscriber = null;
      if (hasValue) {
        hasValue = false;
        const value = lastValue!;
        lastValue = null;
        subscriber.next(value);
      }
      isComplete && subscriber.complete();
    };

    const cleanupDuration = () => {
      durationSubscriber = null;
      isComplete && subscriber.complete();
    };

    source.subscribe(
      createOperatorSubscriber(
        subscriber,
        (value) => {
          hasValue = true;
          lastValue = value;
          if (!durationSubscriber) {
            innerFrom(durationSelector(value)).subscribe(
              (durationSubscriber = createOperatorSubscriber(subscriber, endDuration, cleanupDuration))
            );
          }
        },
        () => {
          isComplete = true;
          (!hasValue || !durationSubscriber || durationSubscriber.closed) && subscriber.complete();
        }
      )
    );
  });
}
import { asyncScheduler } from '../scheduler/async';
import { audit } from './audit';
import { timer } from '../observable/timer';
import { MonoTypeOperatorFunction, SchedulerLike } from '../types';

/**
 * Ignores source values for `duration` milliseconds, then emits the most recent
 * value from the source Observable, then repeats this process.
 *
 * <span class="informal">When it sees a source value, it ignores that plus
 * the next ones for `duration` milliseconds, and then it emits the most recent
 * value from the source.</span>
 *
 * ![](auditTime.png)
 *
 * `auditTime` is similar to `throttleTime`, but emits the last value from the
 * silenced time window, instead of the first value. `auditTime` emits the most
 * recent value from the source Observable on the output Observable as soon as
 * its internal timer becomes disabled, and ignores source values while the
 * timer is enabled. Initially, the timer is disabled. As soon as the first
 * source value arrives, the timer is enabled. After `duration` milliseconds (or
 * the time unit determined internally by the optional `scheduler`) has passed,
 * the timer is disabled, then the most recent source value is emitted on the
 * output Observable, and this process repeats for the next source value.
 * Optionally takes a {@link SchedulerLike} for managing timers.
 *
 * ## Example
 *
 * Emit clicks at a rate of at most one click per second
 *
 * ```ts
 * import { fromEvent, auditTime } from 'rxjs';
 *
 * const clicks = fromEvent(document, 'click');
 * const result = clicks.pipe(auditTime(1000));
 * result.subscribe(x => console.log(x));
 * ```
 *
 * @see {@link audit}
 * @see {@link debounceTime}
 * @see {@link delay}
 * @see {@link sampleTime}
 * @see {@link throttleTime}
 *
 * @param {number} duration Time to wait before emitting the most recent source
 * value, measured in milliseconds or the time unit determined internally
 * by the optional `scheduler`.
 * @param {SchedulerLike} [scheduler=async] The {@link SchedulerLike} to use for
 * managing the timers that handle the rate-limiting behavior.
 * @return A function that returns an Observable that performs rate-limiting of
 * emissions from the source Observable.
 */
export function auditTime<T>(duration: number, scheduler: SchedulerLike = asyncScheduler): MonoTypeOperatorFunction<T> {
  return audit(() => timer(duration, scheduler));
}
import { Observable } from '../Observable';
import { OperatorFunction } from '../types';
import { operate } from '../util/lift';
import { noop } from '../util/noop';
import { createOperatorSubscriber } from './OperatorSubscriber';

/**
 * Buffers the source Observable values until `closingNotifier` emits.
 *
 * <span class="informal">Collects values from the past as an array, and emits
 * that array only when another Observable emits.</span>
 *
 * ![](buffer.png)
 *
 * Buffers the incoming Observable values until the given `closingNotifier`
 * Observable emits a value, at which point it emits the buffer on the output
 * Observable and starts a new buffer internally, awaiting the next time
 * `closingNotifier` emits.
 *
 * ## Example
 *
 * On every click, emit array of most recent interval events
 *
 * ```ts
 * import { fromEvent, interval, buffer } from 'rxjs';
 *
 * const clicks = fromEvent(document, 'click');
 * const intervalEvents = interval(1000);
 * const buffered = intervalEvents.pipe(buffer(clicks));
 * buffered.subscribe(x => console.log(x));
 * ```
 *
 * @see {@link bufferCount}
 * @see {@link bufferTime}
 * @see {@link bufferToggle}
 * @see {@link bufferWhen}
 * @see {@link window}
 *
 * @param {Observable<any>} closingNotifier An Observable that signals the
 * buffer to be emitted on the output Observable.
 * @return A function that returns an Observable of buffers, which are arrays
 * of values.
 */
export function buffer<T>(closingNotifier: Observable<any>): OperatorFunction<T, T[]> {
  return operate((source, subscriber) => {
    // The current buffered values.
    let currentBuffer: T[] = [];

    // Subscribe to our source.
    source.subscribe(
      createOperatorSubscriber(
        subscriber,
        (value) => currentBuffer.push(value),
        () => {
          subscriber.next(currentBuffer);
          subscriber.complete();
        }
      )
    );

    // Subscribe to the closing notifier.
    closingNotifier.subscribe(
      createOperatorSubscriber(
        subscriber,
        () => {
          // Start a new buffer and emit the previous one.
          const b = currentBuffer;
          currentBuffer = [];
          subscriber.next(b);
        },
        noop
      )
    );

    return () => {
      // Ensure buffered values are released on finalization.
      currentBuffer = null!;
    };
  });
}
import { OperatorFunction } from '../types';
import { operate } from '../util/lift';
import { createOperatorSubscriber } from './OperatorSubscriber';
import { arrRemove } from '../util/arrRemove';

/**
 * Buffers the source Observable values until the size hits the maximum
 * `bufferSize` given.
 *
 * <span class="informal">Collects values from the past as an array, and emits
 * that array only when its size reaches `bufferSize`.</span>
 *
 * ![](bufferCount.png)
 *
 * Buffers a number of values from the source Observable by `bufferSize` then
 * emits the buffer and clears it, and starts a new buffer each
 * `startBufferEvery` values. If `startBufferEvery` is not provided or is
 * `null`, then new buffers are started immediately at the start of the source
 * and when each buffer closes and is emitted.
 *
 * ## Examples
 *
 * Emit the last two click events as an array
 *
 * ```ts
 * import { fromEvent, bufferCount } from 'rxjs';
 *
 * const clicks = fromEvent(document, 'click');
 * const buffered = clicks.pipe(bufferCount(2));
 * buffered.subscribe(x => console.log(x));
 * ```
 *
 * On every click, emit the last two click events as an array
 *
 * ```ts
 * import { fromEvent, bufferCount } from 'rxjs';
 *
 * const clicks = fromEvent(document, 'click');
 * const buffered = clicks.pipe(bufferCount(2, 1));
 * buffered.subscribe(x => console.log(x));
 * ```
 *
 * @see {@link buffer}
 * @see {@link bufferTime}
 * @see {@link bufferToggle}
 * @see {@link bufferWhen}
 * @see {@link pairwise}
 * @see {@link windowCount}
 *
 * @param {number} bufferSize The maximum size of the buffer emitted.
 * @param {number} [startBufferEvery] Interval at which to start a new buffer.
 * For example if `startBufferEvery` is `2`, then a new buffer will be started
 * on every other value from the source. A new buffer is started at the
 * beginning of the source by default.
 * @return A function that returns an Observable of arrays of buffered values.
 */
export function bufferCount<T>(bufferSize: number, startBufferEvery: number | null = null): OperatorFunction<T, T[]> {
  // If no `startBufferEvery` value was supplied, then we're
  // opening and closing on the bufferSize itself.
  startBufferEvery = startBufferEvery ?? bufferSize;

  return operate((source, subscriber) => {
    let buffers: T[][] = [];
    let count = 0;

    source.subscribe(
      createOperatorSubscriber(
        subscriber,
        (value) => {
          let toEmit: T[][] | null = null;

          // Check to see if we need to start a buffer.
          // This will start one at the first value, and then
          // a new one every N after that.
          if (count++ % startBufferEvery! === 0) {
            buffers.push([]);
          }

          // Push our value into our active buffers.
          for (const buffer of buffers) {
            buffer.push(value);
            // Check to see if we're over the bufferSize
            // if we are, record it so we can emit it later.
            // If we emitted it now and removed it, it would
            // mutate the `buffers` array while we're looping
            // over it.
            if (bufferSize <= buffer.length) {
              toEmit = toEmit ?? [];
              toEmit.push(buffer);
            }
          }

          if (toEmit) {
            // We have found some buffers that are over the
            // `bufferSize`. Emit them, and remove them from our
            // buffers list.
            for (const buffer of toEmit) {
              arrRemove(buffers, buffer);
              subscriber.next(buffer);
            }
          }
        },
        () => {
          // When the source completes, emit all of our
          // active buffers.
          for (const buffer of buffers) {
            subscriber.next(buffer);
          }
          subscriber.complete();
        },
        // Pass all errors through to consumer.
        undefined,
        () => {
          // Clean up our memory when we finalize
          buffers = null!;
        }
      )
    );
  });
}
import { Subscription } from '../Subscription';
import { OperatorFunction, SchedulerLike } from '../types';
import { operate } from '../util/lift';
import { createOperatorSubscriber } from './OperatorSubscriber';
import { arrRemove } from '../util/arrRemove';
import { asyncScheduler } from '../scheduler/async';
import { popScheduler } from '../util/args';
import { executeSchedule } from '../util/executeSchedule';

/* tslint:disable:max-line-length */
export function bufferTime<T>(bufferTimeSpan: number, scheduler?: SchedulerLike): OperatorFunction<T, T[]>;
export function bufferTime<T>(
  bufferTimeSpan: number,
  bufferCreationInterval: number | null | undefined,
  scheduler?: SchedulerLike
): OperatorFunction<T, T[]>;
export function bufferTime<T>(
  bufferTimeSpan: number,
  bufferCreationInterval: number | null | undefined,
  maxBufferSize: number,
  scheduler?: SchedulerLike
): OperatorFunction<T, T[]>;
/* tslint:enable:max-line-length */

/**
 * Buffers the source Observable values for a specific time period.
 *
 * <span class="informal">Collects values from the past as an array, and emits
 * those arrays periodically in time.</span>
 *
 * ![](bufferTime.png)
 *
 * Buffers values from the source for a specific time duration `bufferTimeSpan`.
 * Unless the optional argument `bufferCreationInterval` is given, it emits and
 * resets the buffer every `bufferTimeSpan` milliseconds. If
 * `bufferCreationInterval` is given, this operator opens the buffer every
 * `bufferCreationInterval` milliseconds and closes (emits and resets) the
 * buffer every `bufferTimeSpan` milliseconds. When the optional argument
 * `maxBufferSize` is specified, the buffer will be closed either after
 * `bufferTimeSpan` milliseconds or when it contains `maxBufferSize` elements.
 *
 * ## Examples
 *
 * Every second, emit an array of the recent click events
 *
 * ```ts
 * import { fromEvent, bufferTime } from 'rxjs';
 *
 * const clicks = fromEvent(document, 'click');
 * const buffered = clicks.pipe(bufferTime(1000));
 * buffered.subscribe(x => console.log(x));
 * ```
 *
 * Every 5 seconds, emit the click events from the next 2 seconds
 *
 * ```ts
 * import { fromEvent, bufferTime } from 'rxjs';
 *
 * const clicks = fromEvent(document, 'click');
 * const buffered = clicks.pipe(bufferTime(2000, 5000));
 * buffered.subscribe(x => console.log(x));
 * ```
 *
 * @see {@link buffer}
 * @see {@link bufferCount}
 * @see {@link bufferToggle}
 * @see {@link bufferWhen}
 * @see {@link windowTime}
 *
 * @param {number} bufferTimeSpan The amount of time to fill each buffer array.
 * @param {number} [bufferCreationInterval] The interval at which to start new
 * buffers.
 * @param {number} [maxBufferSize] The maximum buffer size.
 * @param {SchedulerLike} [scheduler=async] The scheduler on which to schedule the
 * intervals that determine buffer boundaries.
 * @return A function that returns an Observable of arrays of buffered values.
 */
export function bufferTime<T>(bufferTimeSpan: number, ...otherArgs: any[]): OperatorFunction<T, T[]> {
  const scheduler = popScheduler(otherArgs) ?? asyncScheduler;
  const bufferCreationInterval = (otherArgs[0] as number) ?? null;
  const maxBufferSize = (otherArgs[1] as number) || Infinity;

  return operate((source, subscriber) => {
    // The active buffers, their related subscriptions, and removal functions.
    let bufferRecords: { buffer: T[]; subs: Subscription }[] | null = [];
    // If true, it means that every time we emit a buffer, we want to start a new buffer
    // this is only really used for when *just* the buffer time span is passed.
    let restartOnEmit = false;

    /**
     * Does the work of emitting the buffer from the record, ensuring that the
     * record is removed before the emission so reentrant code (from some custom scheduling, perhaps)
     * does not alter the buffer. Also checks to see if a new buffer needs to be started
     * after the emit.
     */
    const emit = (record: { buffer: T[]; subs: Subscription }) => {
      const { buffer, subs } = record;
      subs.unsubscribe();
      arrRemove(bufferRecords, record);
      subscriber.next(buffer);
      restartOnEmit && startBuffer();
    };

    /**
     * Called every time we start a new buffer. This does
     * the work of scheduling a job at the requested bufferTimeSpan
     * that will emit the buffer (if it's not unsubscribed before then).
     */
    const startBuffer = () => {
      if (bufferRecords) {
        const subs = new Subscription();
        subscriber.add(subs);
        const buffer: T[] = [];
        const record = {
          buffer,
          subs,
        };
        bufferRecords.push(record);
        executeSchedule(subs, scheduler, () => emit(record), bufferTimeSpan);
      }
    };

    if (bufferCreationInterval !== null && bufferCreationInterval >= 0) {
      // The user passed both a bufferTimeSpan (required), and a creation interval
      // That means we need to start new buffers on the interval, and those buffers need
      // to wait the required time span before emitting.
      executeSchedule(subscriber, scheduler, startBuffer, bufferCreationInterval, true);
    } else {
      restartOnEmit = true;
    }

    startBuffer();

    const bufferTimeSubscriber = createOperatorSubscriber(
      subscriber,
      (value: T) => {
        // Copy the records, so if we need to remove one we
        // don't mutate the array. It's hard, but not impossible to
        // set up a buffer time that could mutate the array and
        // cause issues here.
        const recordsCopy = bufferRecords!.slice();
        for (const record of recordsCopy) {
          // Loop over all buffers and
          const { buffer } = record;
          buffer.push(value);
          // If the buffer is over the max size, we need to emit it.
          maxBufferSize <= buffer.length && emit(record);
        }
      },
      () => {
        // The source completed, emit all of the active
        // buffers we have before we complete.
        while (bufferRecords?.length) {
          subscriber.next(bufferRecords.shift()!.buffer);
        }
        bufferTimeSubscriber?.unsubscribe();
        subscriber.complete();
        subscriber.unsubscribe();
      },
      // Pass all errors through to consumer.
      undefined,
      // Clean up
      () => (bufferRecords = null)
    );

    source.subscribe(bufferTimeSubscriber);
  });
}
import { Subscription } from '../Subscription';
import { OperatorFunction, ObservableInput } from '../types';
import { operate } from '../util/lift';
import { innerFrom } from '../observable/innerFrom';
import { createOperatorSubscriber } from './OperatorSubscriber';
import { noop } from '../util/noop';
import { arrRemove } from '../util/arrRemove';

/**
 * Buffers the source Observable values starting from an emission from
 * `openings` and ending when the output of `closingSelector` emits.
 *
 * <span class="informal">Collects values from the past as an array. Starts
 * collecting only when `opening` emits, and calls the `closingSelector`
 * function to get an Observable that tells when to close the buffer.</span>
 *
 * ![](bufferToggle.png)
 *
 * Buffers values from the source by opening the buffer via signals from an
 * Observable provided to `openings`, and closing and sending the buffers when
 * a Subscribable or Promise returned by the `closingSelector` function emits.
 *
 * ## Example
 *
 * Every other second, emit the click events from the next 500ms
 *
 * ```ts
 * import { fromEvent, interval, bufferToggle, EMPTY } from 'rxjs';
 *
 * const clicks = fromEvent(document, 'click');
 * const openings = interval(1000);
 * const buffered = clicks.pipe(bufferToggle(openings, i =>
 *   i % 2 ? interval(500) : EMPTY
 * ));
 * buffered.subscribe(x => console.log(x));
 * ```
 *
 * @see {@link buffer}
 * @see {@link bufferCount}
 * @see {@link bufferTime}
 * @see {@link bufferWhen}
 * @see {@link windowToggle}
 *
 * @param openings A Subscribable or Promise of notifications to start new
 * buffers.
 * @param closingSelector A function that takes
 * the value emitted by the `openings` observable and returns a Subscribable or Promise,
 * which, when it emits, signals that the associated buffer should be emitted
 * and cleared.
 * @return A function that returns an Observable of arrays of buffered values.
 */
export function bufferToggle<T, O>(
  openings: ObservableInput<O>,
  closingSelector: (value: O) => ObservableInput<any>
): OperatorFunction<T, T[]> {
  return operate((source, subscriber) => {
    const buffers: T[][] = [];

    // Subscribe to the openings notifier first
    innerFrom(openings).subscribe(
      createOperatorSubscriber(
        subscriber,
        (openValue) => {
          const buffer: T[] = [];
          buffers.push(buffer);
          // We use this composite subscription, so that
          // when the closing notifier emits, we can tear it down.
          const closingSubscription = new Subscription();

          const emitBuffer = () => {
            arrRemove(buffers, buffer);
            subscriber.next(buffer);
            closingSubscription.unsubscribe();
          };

          // The line below will add the subscription to the parent subscriber *and* the closing subscription.
          closingSubscription.add(innerFrom(closingSelector(openValue)).subscribe(createOperatorSubscriber(subscriber, emitBuffer, noop)));
        },
        noop
      )
    );

    source.subscribe(
      createOperatorSubscriber(
        subscriber,
        (value) => {
          // Value from our source. Add it to all pending buffers.
          for (const buffer of buffers) {
            buffer.push(value);
          }
        },
        () => {
          // Source complete. Emit all pending buffers.
          while (buffers.length > 0) {
            subscriber.next(buffers.shift()!);
          }
          subscriber.complete();
        }
      )
    );
  });
}
import { Subscriber } from '../Subscriber';
import { ObservableInput, OperatorFunction } from '../types';
import { operate } from '../util/lift';
import { noop } from '../util/noop';
import { createOperatorSubscriber } from './OperatorSubscriber';
import { innerFrom } from '../observable/innerFrom';

/**
 * Buffers the source Observable values, using a factory function of closing
 * Observables to determine when to close, emit, and reset the buffer.
 *
 * <span class="informal">Collects values from the past as an array. When it
 * starts collecting values, it calls a function that returns an Observable that
 * tells when to close the buffer and restart collecting.</span>
 *
 * ![](bufferWhen.svg)
 *
 * Opens a buffer immediately, then closes the buffer when the observable
 * returned by calling `closingSelector` function emits a value. When it closes
 * the buffer, it immediately opens a new buffer and repeats the process.
 *
 * ## Example
 *
 * Emit an array of the last clicks every [1-5] random seconds
 *
 * ```ts
 * import { fromEvent, bufferWhen, interval } from 'rxjs';
 *
 * const clicks = fromEvent(document, 'click');
 * const buffered = clicks.pipe(
 *   bufferWhen(() => interval(1000 + Math.random() * 4000))
 * );
 * buffered.subscribe(x => console.log(x));
 * ```
 *
 * @see {@link buffer}
 * @see {@link bufferCount}
 * @see {@link bufferTime}
 * @see {@link bufferToggle}
 * @see {@link windowWhen}
 *
 * @param {function(): Observable} closingSelector A function that takes no
 * arguments and returns an Observable that signals buffer closure.
 * @return A function that returns an Observable of arrays of buffered values.
 */
export function bufferWhen<T>(closingSelector: () => ObservableInput<any>): OperatorFunction<T, T[]> {
  return operate((source, subscriber) => {
    // The buffer we keep and emit.
    let buffer: T[] | null = null;
    // A reference to the subscriber used to subscribe to
    // the closing notifier. We need to hold this so we can
    // end the subscription after the first notification.
    let closingSubscriber: Subscriber<T> | null = null;

    // Ends the previous closing notifier subscription, so it
    // terminates after the first emission, then emits
    // the current buffer  if there is one, starts a new buffer, and starts a
    // new closing notifier.
    const openBuffer = () => {
      // Make sure to finalize the closing subscription, we only cared
      // about one notification.
      closingSubscriber?.unsubscribe();
      // emit the buffer if we have one, and start a new buffer.
      const b = buffer;
      buffer = [];
      b && subscriber.next(b);

      // Get a new closing notifier and subscribe to it.
      innerFrom(closingSelector()).subscribe((closingSubscriber = createOperatorSubscriber(subscriber, openBuffer, noop)));
    };

    // Start the first buffer.
    openBuffer();

    // Subscribe to our source.
    source.subscribe(
      createOperatorSubscriber(
        subscriber,
        // Add every new value to the current buffer.
        (value) => buffer?.push(value),
        // When we complete, emit the buffer if we have one,
        // then complete the result.
        () => {
          buffer && subscriber.next(buffer);
          subscriber.complete();
        },
        // Pass all errors through to consumer.
        undefined,
        // Release memory on finalization
        () => (buffer = closingSubscriber = null!)
      )
    );
  });
}
import { Observable } from '../Observable';

import { ObservableInput, OperatorFunction, ObservedValueOf } from '../types';
import { Subscription } from '../Subscription';
import { innerFrom } from '../observable/innerFrom';
import { createOperatorSubscriber } from './OperatorSubscriber';
import { operate } from '../util/lift';

/* tslint:disable:max-line-length */
export function catchError<T, O extends ObservableInput<any>>(
  selector: (err: any, caught: Observable<T>) => O
): OperatorFunction<T, T | ObservedValueOf<O>>;
/* tslint:enable:max-line-length */

/**
 * Catches errors on the observable to be handled by returning a new observable or throwing an error.
 *
 * <span class="informal">
 * It only listens to the error channel and ignores notifications.
 * Handles errors from the source observable, and maps them to a new observable.
 * The error may also be rethrown, or a new error can be thrown to emit an error from the result.
 * </span>
 *
 * ![](catch.png)
 *
 * This operator handles errors, but forwards along all other events to the resulting observable.
 * If the source observable terminates with an error, it will map that error to a new observable,
 * subscribe to it, and forward all of its events to the resulting observable.
 *
 * ## Examples
 *
 * Continue with a different Observable when there's an error
 *
 * ```ts
 * import { of, map, catchError } from 'rxjs';
 *
 * of(1, 2, 3, 4, 5)
 *   .pipe(
 *     map(n => {
 *       if (n === 4) {
 *         throw 'four!';
 *       }
 *       return n;
 *     }),
 *     catchError(err => of('I', 'II', 'III', 'IV', 'V'))
 *   )
 *   .subscribe(x => console.log(x));
 *   // 1, 2, 3, I, II, III, IV, V
 * ```
 *
 * Retry the caught source Observable again in case of error, similar to `retry()` operator
 *
 * ```ts
 * import { of, map, catchError, take } from 'rxjs';
 *
 * of(1, 2, 3, 4, 5)
 *   .pipe(
 *     map(n => {
 *       if (n === 4) {
 *         throw 'four!';
 *       }
 *       return n;
 *     }),
 *     catchError((err, caught) => caught),
 *     take(30)
 *   )
 *   .subscribe(x => console.log(x));
 *   // 1, 2, 3, 1, 2, 3, ...
 * ```
 *
 * Throw a new error when the source Observable throws an error
 *
 * ```ts
 * import { of, map, catchError } from 'rxjs';
 *
 * of(1, 2, 3, 4, 5)
 *   .pipe(
 *     map(n => {
 *       if (n === 4) {
 *         throw 'four!';
 *       }
 *       return n;
 *     }),
 *     catchError(err => {
 *       throw 'error in source. Details: ' + err;
 *     })
 *   )
 *   .subscribe({
 *     next: x => console.log(x),
 *     error: err => console.log(err)
 *   });
 *   // 1, 2, 3, error in source. Details: four!
 * ```
 *
 * @see {@link onErrorResumeNext}
 * @see {@link repeat}
 * @see {@link repeatWhen}
 * @see {@link retry }
 * @see {@link retryWhen}
 *
 * @param {function} selector a function that takes as arguments `err`, which is the error, and `caught`, which
 * is the source observable, in case you'd like to "retry" that observable by returning it again. Whatever observable
 * is returned by the `selector` will be used to continue the observable chain.
 * @return A function that returns an Observable that originates from either
 * the source or the Observable returned by the `selector` function.
 */
export function catchError<T, O extends ObservableInput<any>>(
  selector: (err: any, caught: Observable<T>) => O
): OperatorFunction<T, T | ObservedValueOf<O>> {
  return operate((source, subscriber) => {
    let innerSub: Subscription | null = null;
    let syncUnsub = false;
    let handledResult: Observable<ObservedValueOf<O>>;

    innerSub = source.subscribe(
      createOperatorSubscriber(subscriber, undefined, undefined, (err) => {
        handledResult = innerFrom(selector(err, catchError(selector)(source)));
        if (innerSub) {
          innerSub.unsubscribe();
          innerSub = null;
          handledResult.subscribe(subscriber);
        } else {
          // We don't have an innerSub yet, that means the error was synchronous
          // because the subscribe call hasn't returned yet.
          syncUnsub = true;
        }
      })
    );

    if (syncUnsub) {
      // We have a synchronous error, we need to make sure to
      // finalize right away. This ensures that callbacks in the `finalize` operator are called
      // at the right time, and that finalization occurs at the expected
      // time between the source error and the subscription to the
      // next observable.
      innerSub.unsubscribe();
      innerSub = null;
      handledResult!.subscribe(subscriber);
    }
  });
}
import { combineLatestAll } from './combineLatestAll';

/**
 * @deprecated Renamed to {@link combineLatestAll}. Will be removed in v8.
 */
export const combineAll = combineLatestAll;
import { combineLatestInit } from '../observable/combineLatest';
import { ObservableInput, ObservableInputTuple, OperatorFunction } from '../types';
import { operate } from '../util/lift';
import { argsOrArgArray } from '../util/argsOrArgArray';
import { mapOneOrManyArgs } from '../util/mapOneOrManyArgs';
import { pipe } from '../util/pipe';
import { popResultSelector } from '../util/args';

/** @deprecated Replaced with {@link combineLatestWith}. Will be removed in v8. */
export function combineLatest<T, A extends readonly unknown[], R>(
  sources: [...ObservableInputTuple<A>],
  project: (...values: [T, ...A]) => R
): OperatorFunction<T, R>;
/** @deprecated Replaced with {@link combineLatestWith}. Will be removed in v8. */
export function combineLatest<T, A extends readonly unknown[], R>(sources: [...ObservableInputTuple<A>]): OperatorFunction<T, [T, ...A]>;

/** @deprecated Replaced with {@link combineLatestWith}. Will be removed in v8. */
export function combineLatest<T, A extends readonly unknown[], R>(
  ...sourcesAndProject: [...ObservableInputTuple<A>, (...values: [T, ...A]) => R]
): OperatorFunction<T, R>;
/** @deprecated Replaced with {@link combineLatestWith}. Will be removed in v8. */
export function combineLatest<T, A extends readonly unknown[], R>(...sources: [...ObservableInputTuple<A>]): OperatorFunction<T, [T, ...A]>;

/**
 * @deprecated Replaced with {@link combineLatestWith}. Will be removed in v8.
 */
export function combineLatest<T, R>(...args: (ObservableInput<any> | ((...values: any[]) => R))[]): OperatorFunction<T, unknown> {
  const resultSelector = popResultSelector(args);
  return resultSelector
    ? pipe(combineLatest(...(args as Array<ObservableInput<any>>)), mapOneOrManyArgs(resultSelector))
    : operate((source, subscriber) => {
        combineLatestInit([source, ...argsOrArgArray(args)])(subscriber);
      });
}
import { combineLatest } from '../observable/combineLatest';
import { OperatorFunction, ObservableInput } from '../types';
import { joinAllInternals } from './joinAllInternals';

export function combineLatestAll<T>(): OperatorFunction<ObservableInput<T>, T[]>;
export function combineLatestAll<T>(): OperatorFunction<any, T[]>;
export function combineLatestAll<T, R>(project: (...values: T[]) => R): OperatorFunction<ObservableInput<T>, R>;
export function combineLatestAll<R>(project: (...values: Array<any>) => R): OperatorFunction<any, R>;

/**
 * Flattens an Observable-of-Observables by applying {@link combineLatest} when the Observable-of-Observables completes.
 *
 * `combineLatestAll` takes an Observable of Observables, and collects all Observables from it. Once the outer Observable completes,
 * it subscribes to all collected Observables and combines their values using the {@link combineLatest} strategy, such that:
 *
 * * Every time an inner Observable emits, the output Observable emits
 * * When the returned observable emits, it emits all of the latest values by:
 *    * If a `project` function is provided, it is called with each recent value from each inner Observable in whatever order they
 *      arrived, and the result of the `project` function is what is emitted by the output Observable.
 *    * If there is no `project` function, an array of all the most recent values is emitted by the output Observable.
 *
 * ## Example
 *
 * Map two click events to a finite interval Observable, then apply `combineLatestAll`
 *
 * ```ts
 * import { fromEvent, map, interval, take, combineLatestAll } from 'rxjs';
 *
 * const clicks = fromEvent(document, 'click');
 * const higherOrder = clicks.pipe(
 *   map(() => interval(Math.random() * 2000).pipe(take(3))),
 *   take(2)
 * );
 * const result = higherOrder.pipe(combineLatestAll());
 *
 * result.subscribe(x => console.log(x));
 * ```
 *
 * @see {@link combineLatest}
 * @see {@link combineLatestWith}
 * @see {@link mergeAll}
 *
 * @param project optional function to map the most recent values from each inner Observable into a new result.
 * Takes each of the most recent values from each collected inner Observable as arguments, in order.
 * @return A function that returns an Observable that flattens Observables
 * emitted by the source Observable.
 */
export function combineLatestAll<R>(project?: (...values: Array<any>) => R) {
  return joinAllInternals(combineLatest, project);
}
import { ObservableInputTuple, OperatorFunction, Cons } from '../types';
import { combineLatest } from './combineLatest';

/**
 * Create an observable that combines the latest values from all passed observables and the source
 * into arrays and emits them.
 *
 * Returns an observable, that when subscribed to, will subscribe to the source observable and all
 * sources provided as arguments. Once all sources emit at least one value, all of the latest values
 * will be emitted as an array. After that, every time any source emits a value, all of the latest values
 * will be emitted as an array.
 *
 * This is a useful operator for eagerly calculating values based off of changed inputs.
 *
 * ## Example
 *
 * Simple concatenation of values from two inputs
 *
 * ```ts
 * import { fromEvent, combineLatestWith, map } from 'rxjs';
 *
 * // Setup: Add two inputs to the page
 * const input1 = document.createElement('input');
 * document.body.appendChild(input1);
 * const input2 = document.createElement('input');
 * document.body.appendChild(input2);
 *
 * // Get streams of changes
 * const input1Changes$ = fromEvent(input1, 'change');
 * const input2Changes$ = fromEvent(input2, 'change');
 *
 * // Combine the changes by adding them together
 * input1Changes$.pipe(
 *   combineLatestWith(input2Changes$),
 *   map(([e1, e2]) => (<HTMLInputElement>e1.target).value + ' - ' + (<HTMLInputElement>e2.target).value)
 * )
 * .subscribe(x => console.log(x));
 * ```
 *
 * @param otherSources the other sources to subscribe to.
 * @return A function that returns an Observable that emits the latest
 * emissions from both source and provided Observables.
 */
export function combineLatestWith<T, A extends readonly unknown[]>(
  ...otherSources: [...ObservableInputTuple<A>]
): OperatorFunction<T, Cons<T, A>> {
  return combineLatest(...otherSources);
}
import { ObservableInputTuple, OperatorFunction, SchedulerLike } from '../types';
import { operate } from '../util/lift';
import { concatAll } from './concatAll';
import { popScheduler } from '../util/args';
import { from } from '../observable/from';

/** @deprecated Replaced with {@link concatWith}. Will be removed in v8. */
export function concat<T, A extends readonly unknown[]>(...sources: [...ObservableInputTuple<A>]): OperatorFunction<T, T | A[number]>;
/** @deprecated Replaced with {@link concatWith}. Will be removed in v8. */
export function concat<T, A extends readonly unknown[]>(
  ...sourcesAndScheduler: [...ObservableInputTuple<A>, SchedulerLike]
): OperatorFunction<T, T | A[number]>;

/**
 * @deprecated Replaced with {@link concatWith}. Will be removed in v8.
 */
export function concat<T, R>(...args: any[]): OperatorFunction<T, R> {
  const scheduler = popScheduler(args);
  return operate((source, subscriber) => {
    concatAll()(from([source, ...args], scheduler)).subscribe(subscriber);
  });
}
import { mergeAll } from './mergeAll';
import { OperatorFunction, ObservableInput, ObservedValueOf } from '../types';

/**
 * Converts a higher-order Observable into a first-order Observable by
 * concatenating the inner Observables in order.
 *
 * <span class="informal">Flattens an Observable-of-Observables by putting one
 * inner Observable after the other.</span>
 *
 * ![](concatAll.svg)
 *
 * Joins every Observable emitted by the source (a higher-order Observable), in
 * a serial fashion. It subscribes to each inner Observable only after the
 * previous inner Observable has completed, and merges all of their values into
 * the returned observable.
 *
 * __Warning:__ If the source Observable emits Observables quickly and
 * endlessly, and the inner Observables it emits generally complete slower than
 * the source emits, you can run into memory issues as the incoming Observables
 * collect in an unbounded buffer.
 *
 * Note: `concatAll` is equivalent to `mergeAll` with concurrency parameter set
 * to `1`.
 *
 * ## Example
 *
 * For each click event, tick every second from 0 to 3, with no concurrency
 *
 * ```ts
 * import { fromEvent, map, interval, take, concatAll } from 'rxjs';
 *
 * const clicks = fromEvent(document, 'click');
 * const higherOrder = clicks.pipe(
 *   map(() => interval(1000).pipe(take(4)))
 * );
 * const firstOrder = higherOrder.pipe(concatAll());
 * firstOrder.subscribe(x => console.log(x));
 *
 * // Results in the following:
 * // (results are not concurrent)
 * // For every click on the "document" it will emit values 0 to 3 spaced
 * // on a 1000ms interval
 * // one click = 1000ms-> 0 -1000ms-> 1 -1000ms-> 2 -1000ms-> 3
 * ```
 *
 * @see {@link combineLatestAll}
 * @see {@link concat}
 * @see {@link concatMap}
 * @see {@link concatMapTo}
 * @see {@link exhaustAll}
 * @see {@link mergeAll}
 * @see {@link switchAll}
 * @see {@link switchMap}
 * @see {@link zipAll}
 *
 * @return A function that returns an Observable emitting values from all the
 * inner Observables concatenated.
 */
export function concatAll<O extends ObservableInput<any>>(): OperatorFunction<O, ObservedValueOf<O>> {
  return mergeAll(1);
}
import { mergeMap } from './mergeMap';
import { ObservableInput, OperatorFunction, ObservedValueOf } from '../types';
import { isFunction } from '../util/isFunction';

/* tslint:disable:max-line-length */
export function concatMap<T, O extends ObservableInput<any>>(
  project: (value: T, index: number) => O
): OperatorFunction<T, ObservedValueOf<O>>;
/** @deprecated The `resultSelector` parameter will be removed in v8. Use an inner `map` instead. Details: https://rxjs.dev/deprecations/resultSelector */
export function concatMap<T, O extends ObservableInput<any>>(
  project: (value: T, index: number) => O,
  resultSelector: undefined
): OperatorFunction<T, ObservedValueOf<O>>;
/** @deprecated The `resultSelector` parameter will be removed in v8. Use an inner `map` instead. Details: https://rxjs.dev/deprecations/resultSelector */
export function concatMap<T, R, O extends ObservableInput<any>>(
  project: (value: T, index: number) => O,
  resultSelector: (outerValue: T, innerValue: ObservedValueOf<O>, outerIndex: number, innerIndex: number) => R
): OperatorFunction<T, R>;
/* tslint:enable:max-line-length */

/**
 * Projects each source value to an Observable which is merged in the output
 * Observable, in a serialized fashion waiting for each one to complete before
 * merging the next.
 *
 * <span class="informal">Maps each value to an Observable, then flattens all of
 * these inner Observables using {@link concatAll}.</span>
 *
 * ![](concatMap.png)
 *
 * Returns an Observable that emits items based on applying a function that you
 * supply to each item emitted by the source Observable, where that function
 * returns an (so-called "inner") Observable. Each new inner Observable is
 * concatenated with the previous inner Observable.
 *
 * __Warning:__ if source values arrive endlessly and faster than their
 * corresponding inner Observables can complete, it will result in memory issues
 * as inner Observables amass in an unbounded buffer waiting for their turn to
 * be subscribed to.
 *
 * Note: `concatMap` is equivalent to `mergeMap` with concurrency parameter set
 * to `1`.
 *
 * ## Example
 *
 * For each click event, tick every second from 0 to 3, with no concurrency
 *
 * ```ts
 * import { fromEvent, concatMap, interval, take } from 'rxjs';
 *
 * const clicks = fromEvent(document, 'click');
 * const result = clicks.pipe(
 *   concatMap(ev => interval(1000).pipe(take(4)))
 * );
 * result.subscribe(x => console.log(x));
 *
 * // Results in the following:
 * // (results are not concurrent)
 * // For every click on the "document" it will emit values 0 to 3 spaced
 * // on a 1000ms interval
 * // one click = 1000ms-> 0 -1000ms-> 1 -1000ms-> 2 -1000ms-> 3
 * ```
 *
 * @see {@link concat}
 * @see {@link concatAll}
 * @see {@link concatMapTo}
 * @see {@link exhaustMap}
 * @see {@link mergeMap}
 * @see {@link switchMap}
 *
 * @param {function(value: T, ?index: number): ObservableInput} project A function
 * that, when applied to an item emitted by the source Observable, returns an
 * Observable.
 * @return A function that returns an Observable that emits the result of
 * applying the projection function (and the optional deprecated
 * `resultSelector`) to each item emitted by the source Observable and taking
 * values from each projected inner Observable sequentially.
 */
export function concatMap<T, R, O extends ObservableInput<any>>(
  project: (value: T, index: number) => O,
  resultSelector?: (outerValue: T, innerValue: ObservedValueOf<O>, outerIndex: number, innerIndex: number) => R
): OperatorFunction<T, ObservedValueOf<O> | R> {
  return isFunction(resultSelector) ? mergeMap(project, resultSelector, 1) : mergeMap(project, 1);
}
import { concatMap } from './concatMap';
import { ObservableInput, OperatorFunction, ObservedValueOf } from '../types';
import { isFunction } from '../util/isFunction';

/** @deprecated Will be removed in v9. Use {@link concatMap} instead: `concatMap(() => result)` */
export function concatMapTo<O extends ObservableInput<unknown>>(observable: O): OperatorFunction<unknown, ObservedValueOf<O>>;
/** @deprecated The `resultSelector` parameter will be removed in v8. Use an inner `map` instead. Details: https://rxjs.dev/deprecations/resultSelector */
export function concatMapTo<O extends ObservableInput<unknown>>(
  observable: O,
  resultSelector: undefined
): OperatorFunction<unknown, ObservedValueOf<O>>;
/** @deprecated The `resultSelector` parameter will be removed in v8. Use an inner `map` instead. Details: https://rxjs.dev/deprecations/resultSelector */
export function concatMapTo<T, R, O extends ObservableInput<unknown>>(
  observable: O,
  resultSelector: (outerValue: T, innerValue: ObservedValueOf<O>, outerIndex: number, innerIndex: number) => R
): OperatorFunction<T, R>;

/**
 * Projects each source value to the same Observable which is merged multiple
 * times in a serialized fashion on the output Observable.
 *
 * <span class="informal">It's like {@link concatMap}, but maps each value
 * always to the same inner Observable.</span>
 *
 * ![](concatMapTo.png)
 *
 * Maps each source value to the given Observable `innerObservable` regardless
 * of the source value, and then flattens those resulting Observables into one
 * single Observable, which is the output Observable. Each new `innerObservable`
 * instance emitted on the output Observable is concatenated with the previous
 * `innerObservable` instance.
 *
 * __Warning:__ if source values arrive endlessly and faster than their
 * corresponding inner Observables can complete, it will result in memory issues
 * as inner Observables amass in an unbounded buffer waiting for their turn to
 * be subscribed to.
 *
 * Note: `concatMapTo` is equivalent to `mergeMapTo` with concurrency parameter
 * set to `1`.
 *
 * ## Example
 *
 * For each click event, tick every second from 0 to 3, with no concurrency
 *
 * ```ts
 * import { fromEvent, concatMapTo, interval, take } from 'rxjs';
 *
 * const clicks = fromEvent(document, 'click');
 * const result = clicks.pipe(
 *   concatMapTo(interval(1000).pipe(take(4)))
 * );
 * result.subscribe(x => console.log(x));
 *
 * // Results in the following:
 * // (results are not concurrent)
 * // For every click on the "document" it will emit values 0 to 3 spaced
 * // on a 1000ms interval
 * // one click = 1000ms-> 0 -1000ms-> 1 -1000ms-> 2 -1000ms-> 3
 * ```
 *
 * @see {@link concat}
 * @see {@link concatAll}
 * @see {@link concatMap}
 * @see {@link mergeMapTo}
 * @see {@link switchMapTo}
 *
 * @param {ObservableInput} innerObservable An Observable to replace each value from
 * the source Observable.
 * @return A function that returns an Observable of values merged together by
 * joining the passed Observable with itself, one after the other, for each
 * value emitted from the source.
 * @deprecated Will be removed in v9. Use {@link concatMap} instead: `concatMap(() => result)`
 */
export function concatMapTo<T, R, O extends ObservableInput<unknown>>(
  innerObservable: O,
  resultSelector?: (outerValue: T, innerValue: ObservedValueOf<O>, outerIndex: number, innerIndex: number) => R
): OperatorFunction<T, ObservedValueOf<O> | R> {
  return isFunction(resultSelector) ? concatMap(() => innerObservable, resultSelector) : concatMap(() => innerObservable);
}
import { ObservableInputTuple, OperatorFunction } from '../types';
import { concat } from './concat';

/**
 * Emits all of the values from the source observable, then, once it completes, subscribes
 * to each observable source provided, one at a time, emitting all of their values, and not subscribing
 * to the next one until it completes.
 *
 * `concat(a$, b$, c$)` is the same as `a$.pipe(concatWith(b$, c$))`.
 *
 * ## Example
 *
 * Listen for one mouse click, then listen for all mouse moves.
 *
 * ```ts
 * import { fromEvent, map, take, concatWith } from 'rxjs';
 *
 * const clicks$ = fromEvent(document, 'click');
 * const moves$ = fromEvent(document, 'mousemove');
 *
 * clicks$.pipe(
 *   map(() => 'click'),
 *   take(1),
 *   concatWith(
 *     moves$.pipe(
 *       map(() => 'move')
 *     )
 *   )
 * )
 * .subscribe(x => console.log(x));
 *
 * // 'click'
 * // 'move'
 * // 'move'
 * // 'move'
 * // ...
 * ```
 *
 * @param otherSources Other observable sources to subscribe to, in sequence, after the original source is complete.
 * @return A function that returns an Observable that concatenates
 * subscriptions to the source and provided Observables subscribing to the next
 * only once the current subscription completes.
 */
export function concatWith<T, A extends readonly unknown[]>(
  ...otherSources: [...ObservableInputTuple<A>]
): OperatorFunction<T, T | A[number]> {
  return concat(...otherSources);
}
import { OperatorFunction, ObservableInput, ObservedValueOf, SubjectLike } from '../types';
import { Observable } from '../Observable';
import { Subject } from '../Subject';
import { innerFrom } from '../observable/innerFrom';
import { operate } from '../util/lift';
import { fromSubscribable } from '../observable/fromSubscribable';

/**
 * An object used to configure {@link connect} operator.
 */
export interface ConnectConfig<T> {
  /**
   * A factory function used to create the Subject through which the source
   * is multicast. By default, this creates a {@link Subject}.
   */
  connector: () => SubjectLike<T>;
}

/**
 * The default configuration for `connect`.
 */
const DEFAULT_CONFIG: ConnectConfig<unknown> = {
  connector: () => new Subject<unknown>(),
};

/**
 * Creates an observable by multicasting the source within a function that
 * allows the developer to define the usage of the multicast prior to connection.
 *
 * This is particularly useful if the observable source you wish to multicast could
 * be synchronous or asynchronous. This sets it apart from {@link share}, which, in the
 * case of totally synchronous sources will fail to share a single subscription with
 * multiple consumers, as by the time the subscription to the result of {@link share}
 * has returned, if the source is synchronous its internal reference count will jump from
 * 0 to 1 back to 0 and reset.
 *
 * To use `connect`, you provide a `selector` function that will give you
 * a multicast observable that is not yet connected. You then use that multicast observable
 * to create a resulting observable that, when subscribed, will set up your multicast. This is
 * generally, but not always, accomplished with {@link merge}.
 *
 * Note that using a {@link takeUntil} inside of `connect`'s `selector` _might_ mean you were looking
 * to use the {@link takeWhile} operator instead.
 *
 * When you subscribe to the result of `connect`, the `selector` function will be called. After
 * the `selector` function returns, the observable it returns will be subscribed to, _then_ the
 * multicast will be connected to the source.
 *
 * ## Example
 *
 * Sharing a totally synchronous observable
 *
 * ```ts
 * import { of, tap, connect, merge, map, filter } from 'rxjs';
 *
 * const source$ = of(1, 2, 3, 4, 5).pipe(
 *   tap({
 *     subscribe: () => console.log('subscription started'),
 *     next: n => console.log(`source emitted ${ n }`)
 *   })
 * );
 *
 * source$.pipe(
 *   // Notice in here we're merging 3 subscriptions to `shared$`.
 *   connect(shared$ => merge(
 *     shared$.pipe(map(n => `all ${ n }`)),
 *     shared$.pipe(filter(n => n % 2 === 0), map(n => `even ${ n }`)),
 *     shared$.pipe(filter(n => n % 2 === 1), map(n => `odd ${ n }`))
 *   ))
 * )
 * .subscribe(console.log);
 *
 * // Expected output: (notice only one subscription)
 * 'subscription started'
 * 'source emitted 1'
 * 'all 1'
 * 'odd 1'
 * 'source emitted 2'
 * 'all 2'
 * 'even 2'
 * 'source emitted 3'
 * 'all 3'
 * 'odd 3'
 * 'source emitted 4'
 * 'all 4'
 * 'even 4'
 * 'source emitted 5'
 * 'all 5'
 * 'odd 5'
 * ```
 *
 * @param selector A function used to set up the multicast. Gives you a multicast observable
 * that is not yet connected. With that, you're expected to create and return
 * and Observable, that when subscribed to, will utilize the multicast observable.
 * After this function is executed -- and its return value subscribed to -- the
 * operator will subscribe to the source, and the connection will be made.
 * @param config The configuration object for `connect`.
 */
export function connect<T, O extends ObservableInput<unknown>>(
  selector: (shared: Observable<T>) => O,
  config: ConnectConfig<T> = DEFAULT_CONFIG
): OperatorFunction<T, ObservedValueOf<O>> {
  const { connector } = config;
  return operate((source, subscriber) => {
    const subject = connector();
    innerFrom(selector(fromSubscribable(subject))).subscribe(subscriber);
    subscriber.add(source.subscribe(subject));
  });
}
import { OperatorFunction } from '../types';
import { reduce } from './reduce';

/**
 * Counts the number of emissions on the source and emits that number when the
 * source completes.
 *
 * <span class="informal">Tells how many values were emitted, when the source
 * completes.</span>
 *
 * ![](count.png)
 *
 * `count` transforms an Observable that emits values into an Observable that
 * emits a single value that represents the number of values emitted by the
 * source Observable. If the source Observable terminates with an error, `count`
 * will pass this error notification along without emitting a value first. If
 * the source Observable does not terminate at all, `count` will neither emit
 * a value nor terminate. This operator takes an optional `predicate` function
 * as argument, in which case the output emission will represent the number of
 * source values that matched `true` with the `predicate`.
 *
 * ## Examples
 *
 * Counts how many seconds have passed before the first click happened
 *
 * ```ts
 * import { interval, fromEvent, takeUntil, count } from 'rxjs';
 *
 * const seconds = interval(1000);
 * const clicks = fromEvent(document, 'click');
 * const secondsBeforeClick = seconds.pipe(takeUntil(clicks));
 * const result = secondsBeforeClick.pipe(count());
 * result.subscribe(x => console.log(x));
 * ```
 *
 * Counts how many odd numbers are there between 1 and 7
 *
 * ```ts
 * import { range, count } from 'rxjs';
 *
 * const numbers = range(1, 7);
 * const result = numbers.pipe(count(i => i % 2 === 1));
 * result.subscribe(x => console.log(x));
 * // Results in:
 * // 4
 * ```
 *
 * @see {@link max}
 * @see {@link min}
 * @see {@link reduce}
 *
 * @param predicate A function that is used to analyze the value and the index and
 * determine whether or not to increment the count. Return `true` to increment the count,
 * and return `false` to keep the count the same.
 * If the predicate is not provided, every value will be counted.
 * @return A function that returns an Observable that emits one number that
 * represents the count of emissions.
 */
export function count<T>(predicate?: (value: T, index: number) => boolean): OperatorFunction<T, number> {
  return reduce((total, value, i) => (!predicate || predicate(value, i) ? total + 1 : total), 0);
}
import { Subscriber } from '../Subscriber';
import { MonoTypeOperatorFunction, ObservableInput } from '../types';
import { operate } from '../util/lift';
import { noop } from '../util/noop';
import { createOperatorSubscriber } from './OperatorSubscriber';
import { innerFrom } from '../observable/innerFrom';

/**
 * Emits a notification from the source Observable only after a particular time span
 * determined by another Observable has passed without another source emission.
 *
 * <span class="informal">It's like {@link debounceTime}, but the time span of
 * emission silence is determined by a second Observable.</span>
 *
 * ![](debounce.svg)
 *
 * `debounce` delays notifications emitted by the source Observable, but drops previous
 * pending delayed emissions if a new notification arrives on the source Observable.
 * This operator keeps track of the most recent notification from the source
 * Observable, and spawns a duration Observable by calling the
 * `durationSelector` function. The notification is emitted only when the duration
 * Observable emits a next notification, and if no other notification was emitted on
 * the source Observable since the duration Observable was spawned. If a new
 * notification appears before the duration Observable emits, the previous notification will
 * not be emitted and a new duration is scheduled from `durationSelector` is scheduled.
 * If the completing event happens during the scheduled duration the last cached notification
 * is emitted before the completion event is forwarded to the output observable.
 * If the error event happens during the scheduled duration or after it only the error event is
 * forwarded to the output observable. The cache notification is not emitted in this case.
 *
 * Like {@link debounceTime}, this is a rate-limiting operator, and also a
 * delay-like operator since output emissions do not necessarily occur at the
 * same time as they did on the source Observable.
 *
 * ## Example
 *
 * Emit the most recent click after a burst of clicks
 *
 * ```ts
 * import { fromEvent, scan, debounce, interval } from 'rxjs';
 *
 * const clicks = fromEvent(document, 'click');
 * const result = clicks.pipe(
 *   scan(i => ++i, 1),
 *   debounce(i => interval(200 * i))
 * );
 * result.subscribe(x => console.log(x));
 * ```
 *
 * @see {@link audit}
 * @see {@link auditTime}
 * @see {@link debounceTime}
 * @see {@link delay}
 * @see {@link sample}
 * @see {@link sampleTime}
 * @see {@link throttle}
 * @see {@link throttleTime}
 *
 * @param durationSelector A function
 * that receives a value from the source Observable, for computing the timeout
 * duration for each source value, returned as an Observable or a Promise.
 * @return A function that returns an Observable that delays the emissions of
 * the source Observable by the specified duration Observable returned by
 * `durationSelector`, and may drop some values if they occur too frequently.
 */
export function debounce<T>(durationSelector: (value: T) => ObservableInput<any>): MonoTypeOperatorFunction<T> {
  return operate((source, subscriber) => {
    let hasValue = false;
    let lastValue: T | null = null;
    // The subscriber/subscription for the current debounce, if there is one.
    let durationSubscriber: Subscriber<any> | null = null;

    const emit = () => {
      // Unsubscribe any current debounce subscription we have,
      // we only cared about the first notification from it, and we
      // want to clean that subscription up as soon as possible.
      durationSubscriber?.unsubscribe();
      durationSubscriber = null;
      if (hasValue) {
        // We have a value! Free up memory first, then emit the value.
        hasValue = false;
        const value = lastValue!;
        lastValue = null;
        subscriber.next(value);
      }
    };

    source.subscribe(
      createOperatorSubscriber(
        subscriber,
        (value: T) => {
          // Cancel any pending debounce duration. We don't
          // need to null it out here yet tho, because we're just going
          // to create another one in a few lines.
          durationSubscriber?.unsubscribe();
          hasValue = true;
          lastValue = value;
          // Capture our duration subscriber, so we can unsubscribe it when we're notified
          // and we're going to emit the value.
          durationSubscriber = createOperatorSubscriber(subscriber, emit, noop);
          // Subscribe to the duration.
          innerFrom(durationSelector(value)).subscribe(durationSubscriber);
        },
        () => {
          // Source completed.
          // Emit any pending debounced values then complete
          emit();
          subscriber.complete();
        },
        // Pass all errors through to consumer
        undefined,
        () => {
          // Finalization.
          lastValue = durationSubscriber = null;
        }
      )
    );
  });
}
import { asyncScheduler } from '../scheduler/async';
import { Subscription } from '../Subscription';
import { MonoTypeOperatorFunction, SchedulerAction, SchedulerLike } from '../types';
import { operate } from '../util/lift';
import { createOperatorSubscriber } from './OperatorSubscriber';

/**
 * Emits a notification from the source Observable only after a particular time span
 * has passed without another source emission.
 *
 * <span class="informal">It's like {@link delay}, but passes only the most
 * recent notification from each burst of emissions.</span>
 *
 * ![](debounceTime.png)
 *
 * `debounceTime` delays notifications emitted by the source Observable, but drops
 * previous pending delayed emissions if a new notification arrives on the source
 * Observable. This operator keeps track of the most recent notification from the
 * source Observable, and emits that only when `dueTime` has passed
 * without any other notification appearing on the source Observable. If a new value
 * appears before `dueTime` silence occurs, the previous notification will be dropped
 * and will not be emitted and a new `dueTime` is scheduled.
 * If the completing event happens during `dueTime` the last cached notification
 * is emitted before the completion event is forwarded to the output observable.
 * If the error event happens during `dueTime` or after it only the error event is
 * forwarded to the output observable. The cache notification is not emitted in this case.
 *
 * This is a rate-limiting operator, because it is impossible for more than one
 * notification to be emitted in any time window of duration `dueTime`, but it is also
 * a delay-like operator since output emissions do not occur at the same time as
 * they did on the source Observable. Optionally takes a {@link SchedulerLike} for
 * managing timers.
 *
 * ## Example
 *
 * Emit the most recent click after a burst of clicks
 *
 * ```ts
 * import { fromEvent, debounceTime } from 'rxjs';
 *
 * const clicks = fromEvent(document, 'click');
 * const result = clicks.pipe(debounceTime(1000));
 * result.subscribe(x => console.log(x));
 * ```
 *
 * @see {@link audit}
 * @see {@link auditTime}
 * @see {@link debounce}
 * @see {@link sample}
 * @see {@link sampleTime}
 * @see {@link throttle}
 * @see {@link throttleTime}
 *
 * @param {number} dueTime The timeout duration in milliseconds (or the time
 * unit determined internally by the optional `scheduler`) for the window of
 * time required to wait for emission silence before emitting the most recent
 * source value.
 * @param {SchedulerLike} [scheduler=async] The {@link SchedulerLike} to use for
 * managing the timers that handle the timeout for each value.
 * @return A function that returns an Observable that delays the emissions of
 * the source Observable by the specified `dueTime`, and may drop some values
 * if they occur too frequently.
 */
export function debounceTime<T>(dueTime: number, scheduler: SchedulerLike = asyncScheduler): MonoTypeOperatorFunction<T> {
  return operate((source, subscriber) => {
    let activeTask: Subscription | null = null;
    let lastValue: T | null = null;
    let lastTime: number | null = null;

    const emit = () => {
      if (activeTask) {
        // We have a value! Free up memory first, then emit the value.
        activeTask.unsubscribe();
        activeTask = null;
        const value = lastValue!;
        lastValue = null;
        subscriber.next(value);
      }
    };
    function emitWhenIdle(this: SchedulerAction<unknown>) {
      // This is called `dueTime` after the first value
      // but we might have received new values during this window!

      const targetTime = lastTime! + dueTime;
      const now = scheduler.now();
      if (now < targetTime) {
        // On that case, re-schedule to the new target
        activeTask = this.schedule(undefined, targetTime - now);
        subscriber.add(activeTask);
        return;
      }

      emit();
    }

    source.subscribe(
      createOperatorSubscriber(
        subscriber,
        (value: T) => {
          lastValue = value;
          lastTime = scheduler.now();

          // Only set up a task if it's not already up
          if (!activeTask) {
            activeTask = scheduler.schedule(emitWhenIdle, dueTime);
            subscriber.add(activeTask);
          }
        },
        () => {
          // Source completed.
          // Emit any pending debounced values then complete
          emit();
          subscriber.complete();
        },
        // Pass all errors through to consumer.
        undefined,
        () => {
          // Finalization.
          lastValue = activeTask = null;
        }
      )
    );
  });
}
import { OperatorFunction } from '../types';
import { operate } from '../util/lift';
import { createOperatorSubscriber } from './OperatorSubscriber';

/**
 * Emits a given value if the source Observable completes without emitting any
 * `next` value, otherwise mirrors the source Observable.
 *
 * <span class="informal">If the source Observable turns out to be empty, then
 * this operator will emit a default value.</span>
 *
 * ![](defaultIfEmpty.png)
 *
 * `defaultIfEmpty` emits the values emitted by the source Observable or a
 * specified default value if the source Observable is empty (completes without
 * having emitted any `next` value).
 *
 * ## Example
 *
 * If no clicks happen in 5 seconds, then emit 'no clicks'
 *
 * ```ts
 * import { fromEvent, takeUntil, interval, defaultIfEmpty } from 'rxjs';
 *
 * const clicks = fromEvent(document, 'click');
 * const clicksBeforeFive = clicks.pipe(takeUntil(interval(5000)));
 * const result = clicksBeforeFive.pipe(defaultIfEmpty('no clicks'));
 * result.subscribe(x => console.log(x));
 * ```
 *
 * @see {@link empty}
 * @see {@link last}
 *
 * @param defaultValue The default value used if the source
 * Observable is empty.
 * @return A function that returns an Observable that emits either the
 * specified `defaultValue` if the source Observable emits no items, or the
 * values emitted by the source Observable.
 */
export function defaultIfEmpty<T, R>(defaultValue: R): OperatorFunction<T, T | R> {
  return operate((source, subscriber) => {
    let hasValue = false;
    source.subscribe(
      createOperatorSubscriber(
        subscriber,
        (value) => {
          hasValue = true;
          subscriber.next(value);
        },
        () => {
          if (!hasValue) {
            subscriber.next(defaultValue!);
          }
          subscriber.complete();
        }
      )
    );
  });
}
import { asyncScheduler } from '../scheduler/async';
import { MonoTypeOperatorFunction, SchedulerLike } from '../types';
import { delayWhen } from './delayWhen';
import { timer } from '../observable/timer';

/**
 * Delays the emission of items from the source Observable by a given timeout or
 * until a given Date.
 *
 * <span class="informal">Time shifts each item by some specified amount of
 * milliseconds.</span>
 *
 * ![](delay.svg)
 *
 * If the delay argument is a Number, this operator time shifts the source
 * Observable by that amount of time expressed in milliseconds. The relative
 * time intervals between the values are preserved.
 *
 * If the delay argument is a Date, this operator time shifts the start of the
 * Observable execution until the given date occurs.
 *
 * ## Examples
 *
 * Delay each click by one second
 *
 * ```ts
 * import { fromEvent, delay } from 'rxjs';
 *
 * const clicks = fromEvent(document, 'click');
 * const delayedClicks = clicks.pipe(delay(1000)); // each click emitted after 1 second
 * delayedClicks.subscribe(x => console.log(x));
 * ```
 *
 * Delay all clicks until a future date happens
 *
 * ```ts
 * import { fromEvent, delay } from 'rxjs';
 *
 * const clicks = fromEvent(document, 'click');
 * const date = new Date('March 15, 2050 12:00:00'); // in the future
 * const delayedClicks = clicks.pipe(delay(date)); // click emitted only after that date
 * delayedClicks.subscribe(x => console.log(x));
 * ```
 *
 * @see {@link delayWhen}
 * @see {@link throttle}
 * @see {@link throttleTime}
 * @see {@link debounce}
 * @see {@link debounceTime}
 * @see {@link sample}
 * @see {@link sampleTime}
 * @see {@link audit}
 * @see {@link auditTime}
 *
 * @param {number|Date} due The delay duration in milliseconds (a `number`) or
 * a `Date` until which the emission of the source items is delayed.
 * @param {SchedulerLike} [scheduler=async] The {@link SchedulerLike} to use for
 * managing the timers that handle the time-shift for each item.
 * @return A function that returns an Observable that delays the emissions of
 * the source Observable by the specified timeout or Date.
 */
export function delay<T>(due: number | Date, scheduler: SchedulerLike = asyncScheduler): MonoTypeOperatorFunction<T> {
  const duration = timer(due, scheduler);
  return delayWhen(() => duration);
}
import { Observable } from '../Observable';
import { MonoTypeOperatorFunction } from '../types';
import { concat } from '../observable/concat';
import { take } from './take';
import { ignoreElements } from './ignoreElements';
import { mapTo } from './mapTo';
import { mergeMap } from './mergeMap';

/** @deprecated The `subscriptionDelay` parameter will be removed in v8. */
export function delayWhen<T>(
  delayDurationSelector: (value: T, index: number) => Observable<any>,
  subscriptionDelay: Observable<any>
): MonoTypeOperatorFunction<T>;
export function delayWhen<T>(delayDurationSelector: (value: T, index: number) => Observable<any>): MonoTypeOperatorFunction<T>;

/**
 * Delays the emission of items from the source Observable by a given time span
 * determined by the emissions of another Observable.
 *
 * <span class="informal">It's like {@link delay}, but the time span of the
 * delay duration is determined by a second Observable.</span>
 *
 * ![](delayWhen.png)
 *
 * `delayWhen` operator shifts each emitted value from the source Observable by
 * a time span determined by another Observable. When the source emits a value,
 * the `delayDurationSelector` function is called with the value emitted from
 * the source Observable as the first argument to the `delayDurationSelector`.
 * The `delayDurationSelector` function should return an Observable, called
 * the "duration" Observable.
 *
 * The source value is emitted on the output Observable only when the "duration"
 * Observable emits ({@link guide/glossary-and-semantics#next next}s) any value.
 * Upon that, the "duration" Observable gets unsubscribed.
 *
 * Before RxJS V7, the {@link guide/glossary-and-semantics#complete completion}
 * of the "duration" Observable would have been triggering the emission of the
 * source value to the output Observable, but with RxJS V7, this is not the case
 * anymore.
 *
 * Only next notifications (from the "duration" Observable) trigger values from
 * the source Observable to be passed to the output Observable. If the "duration"
 * Observable only emits the complete notification (without next), the value
 * emitted by the source Observable will never get to the output Observable - it
 * will be swallowed. If the "duration" Observable errors, the error will be
 * propagated to the output Observable.
 *
 * Optionally, `delayWhen` takes a second argument, `subscriptionDelay`, which
 * is an Observable. When `subscriptionDelay` emits its first value or
 * completes, the source Observable is subscribed to and starts behaving like
 * described in the previous paragraph. If `subscriptionDelay` is not provided,
 * `delayWhen` will subscribe to the source Observable as soon as the output
 * Observable is subscribed.
 *
 * ## Example
 *
 * Delay each click by a random amount of time, between 0 and 5 seconds
 *
 * ```ts
 * import { fromEvent, delayWhen, interval } from 'rxjs';
 *
 * const clicks = fromEvent(document, 'click');
 * const delayedClicks = clicks.pipe(
 *   delayWhen(() => interval(Math.random() * 5000))
 * );
 * delayedClicks.subscribe(x => console.log(x));
 * ```
 *
 * @see {@link delay}
 * @see {@link throttle}
 * @see {@link throttleTime}
 * @see {@link debounce}
 * @see {@link debounceTime}
 * @see {@link sample}
 * @see {@link sampleTime}
 * @see {@link audit}
 * @see {@link auditTime}
 *
 * @param {function(value: T, index: number): Observable} delayDurationSelector A function that
 * returns an Observable for each value emitted by the source Observable, which
 * is then used to delay the emission of that item on the output Observable
 * until the Observable returned from this function emits a value.
 * @param {Observable} subscriptionDelay An Observable that triggers the
 * subscription to the source Observable once it emits any value.
 * @return A function that returns an Observable that delays the emissions of
 * the source Observable by an amount of time specified by the Observable
 * returned by `delayDurationSelector`.
 */
export function delayWhen<T>(
  delayDurationSelector: (value: T, index: number) => Observable<any>,
  subscriptionDelay?: Observable<any>
): MonoTypeOperatorFunction<T> {
  if (subscriptionDelay) {
    // DEPRECATED PATH
    return (source: Observable<T>) =>
      concat(subscriptionDelay.pipe(take(1), ignoreElements()), source.pipe(delayWhen(delayDurationSelector)));
  }

  return mergeMap((value, index) => delayDurationSelector(value, index).pipe(take(1), mapTo(value)));
}
import { observeNotification } from '../Notification';
import { OperatorFunction, ObservableNotification, ValueFromNotification } from '../types';
import { operate } from '../util/lift';
import { createOperatorSubscriber } from './OperatorSubscriber';

/**
 * Converts an Observable of {@link ObservableNotification} objects into the emissions
 * that they represent.
 *
 * <span class="informal">Unwraps {@link ObservableNotification} objects as actual `next`,
 * `error` and `complete` emissions. The opposite of {@link materialize}.</span>
 *
 * ![](dematerialize.png)
 *
 * `dematerialize` is assumed to operate an Observable that only emits
 * {@link ObservableNotification} objects as `next` emissions, and does not emit any
 * `error`. Such Observable is the output of a `materialize` operation. Those
 * notifications are then unwrapped using the metadata they contain, and emitted
 * as `next`, `error`, and `complete` on the output Observable.
 *
 * Use this operator in conjunction with {@link materialize}.
 *
 * ## Example
 *
 * Convert an Observable of Notifications to an actual Observable
 *
 * ```ts
 * import { NextNotification, ErrorNotification, of, dematerialize } from 'rxjs';
 *
 * const notifA: NextNotification<string> = { kind: 'N', value: 'A' };
 * const notifB: NextNotification<string> = { kind: 'N', value: 'B' };
 * const notifE: ErrorNotification = { kind: 'E', error: new TypeError('x.toUpperCase is not a function') };
 *
 * const materialized = of(notifA, notifB, notifE);
 *
 * const upperCase = materialized.pipe(dematerialize());
 * upperCase.subscribe({
 *   next: x => console.log(x),
 *   error: e => console.error(e)
 * });
 *
 * // Results in:
 * // A
 * // B
 * // TypeError: x.toUpperCase is not a function
 * ```
 *
 * @see {@link materialize}
 *
 * @return A function that returns an Observable that emits items and
 * notifications embedded in Notification objects emitted by the source
 * Observable.
 */
export function dematerialize<N extends ObservableNotification<any>>(): OperatorFunction<N, ValueFromNotification<N>> {
  return operate((source, subscriber) => {
    source.subscribe(createOperatorSubscriber(subscriber, (notification) => observeNotification(notification, subscriber)));
  });
}
import { Observable } from '../Observable';
import { MonoTypeOperatorFunction } from '../types';
import { operate } from '../util/lift';
import { createOperatorSubscriber } from './OperatorSubscriber';
import { noop } from '../util/noop';

/**
 * Returns an Observable that emits all items emitted by the source Observable that are distinct by comparison from previous items.
 *
 * If a `keySelector` function is provided, then it will project each value from the source observable into a new value that it will
 * check for equality with previously projected values. If the `keySelector` function is not provided, it will use each value from the
 * source observable directly with an equality check against previous values.
 *
 * In JavaScript runtimes that support `Set`, this operator will use a `Set` to improve performance of the distinct value checking.
 *
 * In other runtimes, this operator will use a minimal implementation of `Set` that relies on an `Array` and `indexOf` under the
 * hood, so performance will degrade as more values are checked for distinction. Even in newer browsers, a long-running `distinct`
 * use might result in memory leaks. To help alleviate this in some scenarios, an optional `flushes` parameter is also provided so
 * that the internal `Set` can be "flushed", basically clearing it of values.
 *
 * ## Examples
 *
 * A simple example with numbers
 *
 * ```ts
 * import { of, distinct } from 'rxjs';
 *
 * of(1, 1, 2, 2, 2, 1, 2, 3, 4, 3, 2, 1)
 *   .pipe(distinct())
 *   .subscribe(x => console.log(x));
 *
 * // Outputs
 * // 1
 * // 2
 * // 3
 * // 4
 * ```
 *
 * An example using the `keySelector` function
 *
 * ```ts
 * import { of, distinct } from 'rxjs';
 *
 * of(
 *   { age: 4, name: 'Foo'},
 *   { age: 7, name: 'Bar'},
 *   { age: 5, name: 'Foo'}
 * )
 * .pipe(distinct(({ name }) => name))
 * .subscribe(x => console.log(x));
 *
 * // Outputs
 * // { age: 4, name: 'Foo' }
 * // { age: 7, name: 'Bar' }
 * ```
 * @see {@link distinctUntilChanged}
 * @see {@link distinctUntilKeyChanged}
 *
 * @param {function} [keySelector] Optional function to select which value you want to check as distinct.
 * @param {Observable} [flushes] Optional Observable for flushing the internal HashSet of the operator.
 * @return A function that returns an Observable that emits items from the
 * source Observable with distinct values.
 */
export function distinct<T, K>(keySelector?: (value: T) => K, flushes?: Observable<any>): MonoTypeOperatorFunction<T> {
  return operate((source, subscriber) => {
    const distinctKeys = new Set();
    source.subscribe(
      createOperatorSubscriber(subscriber, (value) => {
        const key = keySelector ? keySelector(value) : value;
        if (!distinctKeys.has(key)) {
          distinctKeys.add(key);
          subscriber.next(value);
        }
      })
    );

    flushes?.subscribe(createOperatorSubscriber(subscriber, () => distinctKeys.clear(), noop));
  });
}
import { MonoTypeOperatorFunction } from '../types';
import { identity } from '../util/identity';
import { operate } from '../util/lift';
import { createOperatorSubscriber } from './OperatorSubscriber';

export function distinctUntilChanged<T>(comparator?: (previous: T, current: T) => boolean): MonoTypeOperatorFunction<T>;
export function distinctUntilChanged<T, K>(
  comparator: (previous: K, current: K) => boolean,
  keySelector: (value: T) => K
): MonoTypeOperatorFunction<T>;

/**
 * Returns a result {@link Observable} that emits all values pushed by the source observable if they
 * are distinct in comparison to the last value the result observable emitted.
 *
 * When provided without parameters or with the first parameter (`{@link distinctUntilChanged#comparator comparator}`),
 * it behaves like this:
 *
 * 1. It will always emit the first value from the source.
 * 2. For all subsequent values pushed by the source, they will be compared to the previously emitted values
 *    using the provided `comparator` or an `===` equality check.
 * 3. If the value pushed by the source is determined to be unequal by this check, that value is emitted and
 *    becomes the new "previously emitted value" internally.
 *
 * When the second parameter (`{@link distinctUntilChanged#keySelector keySelector}`) is provided, the behavior
 * changes:
 *
 * 1. It will always emit the first value from the source.
 * 2. The `keySelector` will be run against all values, including the first value.
 * 3. For all values after the first, the selected key will be compared against the key selected from
 *    the previously emitted value using the `comparator`.
 * 4. If the keys are determined to be unequal by this check, the value (not the key), is emitted
 *    and the selected key from that value is saved for future comparisons against other keys.
 *
 * ## Examples
 *
 * A very basic example with no `{@link distinctUntilChanged#comparator comparator}`. Note that `1` is emitted more than once,
 * because it's distinct in comparison to the _previously emitted_ value,
 * not in comparison to _all other emitted values_.
 *
 * ```ts
 * import { of, distinctUntilChanged } from 'rxjs';
 *
 * of(1, 1, 1, 2, 2, 2, 1, 1, 3, 3)
 *   .pipe(distinctUntilChanged())
 *   .subscribe(console.log);
 * // Logs: 1, 2, 1, 3
 * ```
 *
 * With a `{@link distinctUntilChanged#comparator comparator}`, you can do custom comparisons. Let's say
 * you only want to emit a value when all of its components have
 * changed:
 *
 * ```ts
 * import { of, distinctUntilChanged } from 'rxjs';
 *
 * const totallyDifferentBuilds$ = of(
 *   { engineVersion: '1.1.0', transmissionVersion: '1.2.0' },
 *   { engineVersion: '1.1.0', transmissionVersion: '1.4.0' },
 *   { engineVersion: '1.3.0', transmissionVersion: '1.4.0' },
 *   { engineVersion: '1.3.0', transmissionVersion: '1.5.0' },
 *   { engineVersion: '2.0.0', transmissionVersion: '1.5.0' }
 * ).pipe(
 *   distinctUntilChanged((prev, curr) => {
 *     return (
 *       prev.engineVersion === curr.engineVersion ||
 *       prev.transmissionVersion === curr.transmissionVersion
 *     );
 *   })
 * );
 *
 * totallyDifferentBuilds$.subscribe(console.log);
 *
 * // Logs:
 * // { engineVersion: '1.1.0', transmissionVersion: '1.2.0' }
 * // { engineVersion: '1.3.0', transmissionVersion: '1.4.0' }
 * // { engineVersion: '2.0.0', transmissionVersion: '1.5.0' }
 * ```
 *
 * You can also provide a custom `{@link distinctUntilChanged#comparator comparator}` to check that emitted
 * changes are only in one direction. Let's say you only want to get
 * the next record temperature:
 *
 * ```ts
 * import { of, distinctUntilChanged } from 'rxjs';
 *
 * const temps$ = of(30, 31, 20, 34, 33, 29, 35, 20);
 *
 * const recordHighs$ = temps$.pipe(
 *   distinctUntilChanged((prevHigh, temp) => {
 *     // If the current temp is less than
 *     // or the same as the previous record,
 *     // the record hasn't changed.
 *     return temp <= prevHigh;
 *   })
 * );
 *
 * recordHighs$.subscribe(console.log);
 * // Logs: 30, 31, 34, 35
 * ```
 *
 * Selecting update events only when the `updatedBy` field shows
 * the account changed hands.
 *
 * ```ts
 * import { of, distinctUntilChanged } from 'rxjs';
 *
 * // A stream of updates to a given account
 * const accountUpdates$ = of(
 *   { updatedBy: 'blesh', data: [] },
 *   { updatedBy: 'blesh', data: [] },
 *   { updatedBy: 'ncjamieson', data: [] },
 *   { updatedBy: 'ncjamieson', data: [] },
 *   { updatedBy: 'blesh', data: [] }
 * );
 *
 * // We only want the events where it changed hands
 * const changedHands$ = accountUpdates$.pipe(
 *   distinctUntilChanged(undefined, update => update.updatedBy)
 * );
 *
 * changedHands$.subscribe(console.log);
 * // Logs:
 * // { updatedBy: 'blesh', data: Array[0] }
 * // { updatedBy: 'ncjamieson', data: Array[0] }
 * // { updatedBy: 'blesh', data: Array[0] }
 * ```
 *
 * @see {@link distinct}
 * @see {@link distinctUntilKeyChanged}
 *
 * @param comparator A function used to compare the previous and current keys for
 * equality. Defaults to a `===` check.
 * @param keySelector Used to select a key value to be passed to the `comparator`.
 *
 * @return A function that returns an Observable that emits items from the
 * source Observable with distinct values.
 */
export function distinctUntilChanged<T, K>(
  comparator?: (previous: K, current: K) => boolean,
  keySelector: (value: T) => K = identity as (value: T) => K
): MonoTypeOperatorFunction<T> {
  // We've been allowing `null` do be passed as the `compare`, so we can't do
  // a default value for the parameter, because that will only work
  // for `undefined`.
  comparator = comparator ?? defaultCompare;

  return operate((source, subscriber) => {
    // The previous key, used to compare against keys selected
    // from new arrivals to determine "distinctiveness".
    let previousKey: K;
    // Whether or not this is the first value we've gotten.
    let first = true;

    source.subscribe(
      createOperatorSubscriber(subscriber, (value) => {
        // We always call the key selector.
        const currentKey = keySelector(value);

        // If it's the first value, we always emit it.
        // Otherwise, we compare this key to the previous key, and
        // if the comparer returns false, we emit.
        if (first || !comparator!(previousKey, currentKey)) {
          // Update our state *before* we emit the value
          // as emission can be the source of re-entrant code
          // in functional libraries like this. We only really
          // need to do this if it's the first value, or if the
          // key we're tracking in previous needs to change.
          first = false;
          previousKey = currentKey;

          // Emit the value!
          subscriber.next(value);
        }
      })
    );
  });
}

function defaultCompare(a: any, b: any) {
  return a === b;
}
import { distinctUntilChanged } from './distinctUntilChanged';
import { MonoTypeOperatorFunction } from '../types';

/* tslint:disable:max-line-length */
export function distinctUntilKeyChanged<T>(key: keyof T): MonoTypeOperatorFunction<T>;
export function distinctUntilKeyChanged<T, K extends keyof T>(key: K, compare: (x: T[K], y: T[K]) => boolean): MonoTypeOperatorFunction<T>;
/* tslint:enable:max-line-length */

/**
 * Returns an Observable that emits all items emitted by the source Observable that are distinct by comparison from the previous item,
 * using a property accessed by using the key provided to check if the two items are distinct.
 *
 * If a comparator function is provided, then it will be called for each item to test for whether or not that value should be emitted.
 *
 * If a comparator function is not provided, an equality check is used by default.
 *
 * ## Examples
 *
 * An example comparing the name of persons
 *
 * ```ts
 * import { of, distinctUntilKeyChanged } from 'rxjs';
 *
 * of(
 *   { age: 4, name: 'Foo' },
 *   { age: 7, name: 'Bar' },
 *   { age: 5, name: 'Foo' },
 *   { age: 6, name: 'Foo' }
 * ).pipe(
 *   distinctUntilKeyChanged('name')
 * )
 * .subscribe(x => console.log(x));
 *
 * // displays:
 * // { age: 4, name: 'Foo' }
 * // { age: 7, name: 'Bar' }
 * // { age: 5, name: 'Foo' }
 * ```
 *
 * An example comparing the first letters of the name
 *
 * ```ts
 * import { of, distinctUntilKeyChanged } from 'rxjs';
 *
 * of(
 *   { age: 4, name: 'Foo1' },
 *   { age: 7, name: 'Bar' },
 *   { age: 5, name: 'Foo2' },
 *   { age: 6, name: 'Foo3' }
 * ).pipe(
 *   distinctUntilKeyChanged('name', (x, y) => x.substring(0, 3) === y.substring(0, 3))
 * )
 * .subscribe(x => console.log(x));
 *
 * // displays:
 * // { age: 4, name: 'Foo1' }
 * // { age: 7, name: 'Bar' }
 * // { age: 5, name: 'Foo2' }
 * ```
 *
 * @see {@link distinct}
 * @see {@link distinctUntilChanged}
 *
 * @param {string} key String key for object property lookup on each item.
 * @param {function} [compare] Optional comparison function called to test if an item is distinct from the previous item in the source.
 * @return A function that returns an Observable that emits items from the
 * source Observable with distinct values based on the key specified.
 */
export function distinctUntilKeyChanged<T, K extends keyof T>(key: K, compare?: (x: T[K], y: T[K]) => boolean): MonoTypeOperatorFunction<T> {
  return distinctUntilChanged((x: T, y: T) => compare ? compare(x[key], y[key]) : x[key] === y[key]);
}
import { ArgumentOutOfRangeError } from '../util/ArgumentOutOfRangeError';
import { Observable } from '../Observable';
import { OperatorFunction } from '../types';
import { filter } from './filter';
import { throwIfEmpty } from './throwIfEmpty';
import { defaultIfEmpty } from './defaultIfEmpty';
import { take } from './take';

/**
 * Emits the single value at the specified `index` in a sequence of emissions
 * from the source Observable.
 *
 * <span class="informal">Emits only the i-th value, then completes.</span>
 *
 * ![](elementAt.png)
 *
 * `elementAt` returns an Observable that emits the item at the specified
 * `index` in the source Observable, or a default value if that `index` is out
 * of range and the `default` argument is provided. If the `default` argument is
 * not given and the `index` is out of range, the output Observable will emit an
 * `ArgumentOutOfRangeError` error.
 *
 * ## Example
 *
 * Emit only the third click event
 *
 * ```ts
 * import { fromEvent, elementAt } from 'rxjs';
 *
 * const clicks = fromEvent(document, 'click');
 * const result = clicks.pipe(elementAt(2));
 * result.subscribe(x => console.log(x));
 *
 * // Results in:
 * // click 1 = nothing
 * // click 2 = nothing
 * // click 3 = MouseEvent object logged to console
 * ```
 *
 * @see {@link first}
 * @see {@link last}
 * @see {@link skip}
 * @see {@link single}
 * @see {@link take}
 *
 * @throws {ArgumentOutOfRangeError} When using `elementAt(i)`, it delivers an
 * ArgumentOutOfRangeError to the Observer's `error` callback if `i < 0` or the
 * Observable has completed before emitting the i-th `next` notification.
 *
 * @param {number} index Is the number `i` for the i-th source emission that has
 * happened since the subscription, starting from the number `0`.
 * @param {T} [defaultValue] The default value returned for missing indices.
 * @return A function that returns an Observable that emits a single item, if
 * it is found. Otherwise, it will emit the default value if given. If not, it
 * emits an error.
 */
export function elementAt<T, D = T>(index: number, defaultValue?: D): OperatorFunction<T, T | D> {
  if (index < 0) {
    throw new ArgumentOutOfRangeError();
  }
  const hasDefaultValue = arguments.length >= 2;
  return (source: Observable<T>) =>
    source.pipe(
      filter((v, i) => i === index),
      take(1),
      hasDefaultValue ? defaultIfEmpty(defaultValue!) : throwIfEmpty(() => new ArgumentOutOfRangeError())
    );
}
/** prettier */
import { Observable } from '../Observable';
import { concat } from '../observable/concat';
import { of } from '../observable/of';
import { MonoTypeOperatorFunction, SchedulerLike, OperatorFunction, ValueFromArray } from '../types';

/** @deprecated The `scheduler` parameter will be removed in v8. Use `scheduled` and `concatAll`. Details: https://rxjs.dev/deprecations/scheduler-argument */
export function endWith<T>(scheduler: SchedulerLike): MonoTypeOperatorFunction<T>;
/** @deprecated The `scheduler` parameter will be removed in v8. Use `scheduled` and `concatAll`. Details: https://rxjs.dev/deprecations/scheduler-argument */
export function endWith<T, A extends unknown[] = T[]>(
  ...valuesAndScheduler: [...A, SchedulerLike]
): OperatorFunction<T, T | ValueFromArray<A>>;

export function endWith<T, A extends unknown[] = T[]>(...values: A): OperatorFunction<T, T | ValueFromArray<A>>;

/**
 * Returns an observable that will emit all values from the source, then synchronously emit
 * the provided value(s) immediately after the source completes.
 *
 * NOTE: Passing a last argument of a Scheduler is _deprecated_, and may result in incorrect
 * types in TypeScript.
 *
 * This is useful for knowing when an observable ends. Particularly when paired with an
 * operator like {@link takeUntil}
 *
 * ![](endWith.png)
 *
 * ## Example
 *
 * Emit values to know when an interval starts and stops. The interval will
 * stop when a user clicks anywhere on the document.
 *
 * ```ts
 * import { interval, map, fromEvent, startWith, takeUntil, endWith } from 'rxjs';
 *
 * const ticker$ = interval(5000).pipe(
 *   map(() => 'tick')
 * );
 *
 * const documentClicks$ = fromEvent(document, 'click');
 *
 * ticker$.pipe(
 *   startWith('interval started'),
 *   takeUntil(documentClicks$),
 *   endWith('interval ended by click')
 * )
 * .subscribe(x => console.log(x));
 *
 * // Result (assuming a user clicks after 15 seconds)
 * // 'interval started'
 * // 'tick'
 * // 'tick'
 * // 'tick'
 * // 'interval ended by click'
 * ```
 *
 * @see {@link startWith}
 * @see {@link concat}
 * @see {@link takeUntil}
 *
 * @param values Items you want the modified Observable to emit last.
 * @return A function that returns an Observable that emits all values from the
 * source, then synchronously emits the provided value(s) immediately after the
 * source completes.
 */
export function endWith<T>(...values: Array<T | SchedulerLike>): MonoTypeOperatorFunction<T> {
  return (source: Observable<T>) => concat(source, of(...values)) as Observable<T>;
}
import { Observable } from '../Observable';
import { Falsy, OperatorFunction } from '../types';
import { operate } from '../util/lift';
import { createOperatorSubscriber } from './OperatorSubscriber';

export function every<T>(predicate: BooleanConstructor): OperatorFunction<T, Exclude<T, Falsy> extends never ? false : boolean>;
/** @deprecated Use a closure instead of a `thisArg`. Signatures accepting a `thisArg` will be removed in v8. */
export function every<T>(
  predicate: BooleanConstructor,
  thisArg: any
): OperatorFunction<T, Exclude<T, Falsy> extends never ? false : boolean>;
/** @deprecated Use a closure instead of a `thisArg`. Signatures accepting a `thisArg` will be removed in v8. */
export function every<T, A>(
  predicate: (this: A, value: T, index: number, source: Observable<T>) => boolean,
  thisArg: A
): OperatorFunction<T, boolean>;
export function every<T>(predicate: (value: T, index: number, source: Observable<T>) => boolean): OperatorFunction<T, boolean>;

/**
 * Returns an Observable that emits whether or not every item of the source satisfies the condition specified.
 *
 * <span class="informal">If all values pass predicate before the source completes, emits true before completion,
 * otherwise emit false, then complete.</span>
 *
 * ![](every.png)
 *
 * ## Example
 *
 * A simple example emitting true if all elements are less than 5, false otherwise
 *
 * ```ts
 * import { of, every } from 'rxjs';
 *
 * of(1, 2, 3, 4, 5, 6)
 *   .pipe(every(x => x < 5))
 *   .subscribe(x => console.log(x)); // -> false
 * ```
 *
 * @param {function} predicate A function for determining if an item meets a specified condition.
 * @param {any} [thisArg] Optional object to use for `this` in the callback.
 * @return A function that returns an Observable of booleans that determines if
 * all items of the source Observable meet the condition specified.
 */
export function every<T>(
  predicate: (value: T, index: number, source: Observable<T>) => boolean,
  thisArg?: any
): OperatorFunction<T, boolean> {
  return operate((source, subscriber) => {
    let index = 0;
    source.subscribe(
      createOperatorSubscriber(
        subscriber,
        (value) => {
          if (!predicate.call(thisArg, value, index++, source)) {
            subscriber.next(false);
            subscriber.complete();
          }
        },
        () => {
          subscriber.next(true);
          subscriber.complete();
        }
      )
    );
  });
}
import { exhaustAll } from './exhaustAll';

/**
 * @deprecated Renamed to {@link exhaustAll}. Will be removed in v8.
 */
export const exhaust = exhaustAll;
import { OperatorFunction, ObservableInput, ObservedValueOf } from '../types';
import { exhaustMap } from './exhaustMap';
import { identity } from '../util/identity';

/**
 * Converts a higher-order Observable into a first-order Observable by dropping
 * inner Observables while the previous inner Observable has not yet completed.
 *
 * <span class="informal">Flattens an Observable-of-Observables by dropping the
 * next inner Observables while the current inner is still executing.</span>
 *
 * ![](exhaust.png)
 *
 * `exhaustAll` subscribes to an Observable that emits Observables, also known as a
 * higher-order Observable. Each time it observes one of these emitted inner
 * Observables, the output Observable begins emitting the items emitted by that
 * inner Observable. So far, it behaves like {@link mergeAll}. However,
 * `exhaustAll` ignores every new inner Observable if the previous Observable has
 * not yet completed. Once that one completes, it will accept and flatten the
 * next inner Observable and repeat this process.
 *
 * ## Example
 *
 * Run a finite timer for each click, only if there is no currently active timer
 *
 * ```ts
 * import { fromEvent, map, interval, take, exhaustAll } from 'rxjs';
 *
 * const clicks = fromEvent(document, 'click');
 * const higherOrder = clicks.pipe(
 *   map(() => interval(1000).pipe(take(5)))
 * );
 * const result = higherOrder.pipe(exhaustAll());
 * result.subscribe(x => console.log(x));
 * ```
 *
 * @see {@link combineLatestAll}
 * @see {@link concatAll}
 * @see {@link switchAll}
 * @see {@link switchMap}
 * @see {@link mergeAll}
 * @see {@link exhaustMap}
 * @see {@link zipAll}
 *
 * @return A function that returns an Observable that takes a source of
 * Observables and propagates the first Observable exclusively until it
 * completes before subscribing to the next.
 */
export function exhaustAll<O extends ObservableInput<any>>(): OperatorFunction<O, ObservedValueOf<O>> {
  return exhaustMap(identity);
}
import { Observable } from '../Observable';
import { Subscriber } from '../Subscriber';
import { ObservableInput, OperatorFunction, ObservedValueOf } from '../types';
import { map } from './map';
import { innerFrom } from '../observable/innerFrom';
import { operate } from '../util/lift';
import { createOperatorSubscriber } from './OperatorSubscriber';

/* tslint:disable:max-line-length */
export function exhaustMap<T, O extends ObservableInput<any>>(
  project: (value: T, index: number) => O
): OperatorFunction<T, ObservedValueOf<O>>;
/** @deprecated The `resultSelector` parameter will be removed in v8. Use an inner `map` instead. Details: https://rxjs.dev/deprecations/resultSelector */
export function exhaustMap<T, O extends ObservableInput<any>>(
  project: (value: T, index: number) => O,
  resultSelector: undefined
): OperatorFunction<T, ObservedValueOf<O>>;
/** @deprecated The `resultSelector` parameter will be removed in v8. Use an inner `map` instead. Details: https://rxjs.dev/deprecations/resultSelector */
export function exhaustMap<T, I, R>(
  project: (value: T, index: number) => ObservableInput<I>,
  resultSelector: (outerValue: T, innerValue: I, outerIndex: number, innerIndex: number) => R
): OperatorFunction<T, R>;
/* tslint:enable:max-line-length */

/**
 * Projects each source value to an Observable which is merged in the output
 * Observable only if the previous projected Observable has completed.
 *
 * <span class="informal">Maps each value to an Observable, then flattens all of
 * these inner Observables using {@link exhaust}.</span>
 *
 * ![](exhaustMap.png)
 *
 * Returns an Observable that emits items based on applying a function that you
 * supply to each item emitted by the source Observable, where that function
 * returns an (so-called "inner") Observable. When it projects a source value to
 * an Observable, the output Observable begins emitting the items emitted by
 * that projected Observable. However, `exhaustMap` ignores every new projected
 * Observable if the previous projected Observable has not yet completed. Once
 * that one completes, it will accept and flatten the next projected Observable
 * and repeat this process.
 *
 * ## Example
 *
 * Run a finite timer for each click, only if there is no currently active timer
 *
 * ```ts
 * import { fromEvent, exhaustMap, interval, take } from 'rxjs';
 *
 * const clicks = fromEvent(document, 'click');
 * const result = clicks.pipe(
 *   exhaustMap(() => interval(1000).pipe(take(5)))
 * );
 * result.subscribe(x => console.log(x));
 * ```
 *
 * @see {@link concatMap}
 * @see {@link exhaust}
 * @see {@link mergeMap}
 * @see {@link switchMap}
 *
 * @param {function(value: T, ?index: number): ObservableInput} project A function
 * that, when applied to an item emitted by the source Observable, returns an
 * Observable.
 * @return A function that returns an Observable containing projected
 * Observables of each item of the source, ignoring projected Observables that
 * start before their preceding Observable has completed.
 */
export function exhaustMap<T, R, O extends ObservableInput<any>>(
  project: (value: T, index: number) => O,
  resultSelector?: (outerValue: T, innerValue: ObservedValueOf<O>, outerIndex: number, innerIndex: number) => R
): OperatorFunction<T, ObservedValueOf<O> | R> {
  if (resultSelector) {
    // DEPRECATED PATH
    return (source: Observable<T>) =>
      source.pipe(exhaustMap((a, i) => innerFrom(project(a, i)).pipe(map((b: any, ii: any) => resultSelector(a, b, i, ii)))));
  }
  return operate((source, subscriber) => {
    let index = 0;
    let innerSub: Subscriber<T> | null = null;
    let isComplete = false;
    source.subscribe(
      createOperatorSubscriber(
        subscriber,
        (outerValue) => {
          if (!innerSub) {
            innerSub = createOperatorSubscriber(subscriber, undefined, () => {
              innerSub = null;
              isComplete && subscriber.complete();
            });
            innerFrom(project(outerValue, index++)).subscribe(innerSub);
          }
        },
        () => {
          isComplete = true;
          !innerSub && subscriber.complete();
        }
      )
    );
  });
}
import { OperatorFunction, ObservableInput, ObservedValueOf, SchedulerLike } from '../types';
import { operate } from '../util/lift';
import { mergeInternals } from './mergeInternals';

/* tslint:disable:max-line-length */
export function expand<T, O extends ObservableInput<unknown>>(
  project: (value: T, index: number) => O,
  concurrent?: number,
  scheduler?: SchedulerLike
): OperatorFunction<T, ObservedValueOf<O>>;
/**
 * @deprecated The `scheduler` parameter will be removed in v8. If you need to schedule the inner subscription,
 * use `subscribeOn` within the projection function: `expand((value) => fn(value).pipe(subscribeOn(scheduler)))`.
 * Details: Details: https://rxjs.dev/deprecations/scheduler-argument
 */
export function expand<T, O extends ObservableInput<unknown>>(
  project: (value: T, index: number) => O,
  concurrent: number | undefined,
  scheduler: SchedulerLike
): OperatorFunction<T, ObservedValueOf<O>>;
/* tslint:enable:max-line-length */

/**
 * Recursively projects each source value to an Observable which is merged in
 * the output Observable.
 *
 * <span class="informal">It's similar to {@link mergeMap}, but applies the
 * projection function to every source value as well as every output value.
 * It's recursive.</span>
 *
 * ![](expand.png)
 *
 * Returns an Observable that emits items based on applying a function that you
 * supply to each item emitted by the source Observable, where that function
 * returns an Observable, and then merging those resulting Observables and
 * emitting the results of this merger. *Expand* will re-emit on the output
 * Observable every source value. Then, each output value is given to the
 * `project` function which returns an inner Observable to be merged on the
 * output Observable. Those output values resulting from the projection are also
 * given to the `project` function to produce new output values. This is how
 * *expand* behaves recursively.
 *
 * ## Example
 *
 * Start emitting the powers of two on every click, at most 10 of them
 *
 * ```ts
 * import { fromEvent, map, expand, of, delay, take } from 'rxjs';
 *
 * const clicks = fromEvent(document, 'click');
 * const powersOfTwo = clicks.pipe(
 *   map(() => 1),
 *   expand(x => of(2 * x).pipe(delay(1000))),
 *   take(10)
 * );
 * powersOfTwo.subscribe(x => console.log(x));
 * ```
 *
 * @see {@link mergeMap}
 * @see {@link mergeScan}
 *
 * @param {function(value: T, index: number) => Observable} project A function
 * that, when applied to an item emitted by the source or the output Observable,
 * returns an Observable.
 * @param {number} [concurrent=Infinity] Maximum number of input
 * Observables being subscribed to concurrently.
 * @param {SchedulerLike} [scheduler=null] The {@link SchedulerLike} to use for subscribing to
 * each projected inner Observable.
 * @return A function that returns an Observable that emits the source values
 * and also result of applying the projection function to each value emitted on
 * the output Observable and merging the results of the Observables obtained
 * from this transformation.
 */
export function expand<T, O extends ObservableInput<unknown>>(
  project: (value: T, index: number) => O,
  concurrent = Infinity,
  scheduler?: SchedulerLike
): OperatorFunction<T, ObservedValueOf<O>> {
  concurrent = (concurrent || 0) < 1 ? Infinity : concurrent;
  return operate((source, subscriber) =>
    mergeInternals(
      // General merge params
      source,
      subscriber,
      project,
      concurrent,

      // onBeforeNext
      undefined,

      // Expand-specific
      true, // Use expand path
      scheduler // Inner subscription scheduler
    )
  );
}
import { OperatorFunction, MonoTypeOperatorFunction, TruthyTypesOf } from '../types';
import { operate } from '../util/lift';
import { createOperatorSubscriber } from './OperatorSubscriber';

/** @deprecated Use a closure instead of a `thisArg`. Signatures accepting a `thisArg` will be removed in v8. */
export function filter<T, S extends T, A>(predicate: (this: A, value: T, index: number) => value is S, thisArg: A): OperatorFunction<T, S>;
export function filter<T, S extends T>(predicate: (value: T, index: number) => value is S): OperatorFunction<T, S>;
export function filter<T>(predicate: BooleanConstructor): OperatorFunction<T, TruthyTypesOf<T>>;
/** @deprecated Use a closure instead of a `thisArg`. Signatures accepting a `thisArg` will be removed in v8. */
export function filter<T, A>(predicate: (this: A, value: T, index: number) => boolean, thisArg: A): MonoTypeOperatorFunction<T>;
export function filter<T>(predicate: (value: T, index: number) => boolean): MonoTypeOperatorFunction<T>;

/**
 * Filter items emitted by the source Observable by only emitting those that
 * satisfy a specified predicate.
 *
 * <span class="informal">Like
 * [Array.prototype.filter()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter),
 * it only emits a value from the source if it passes a criterion function.</span>
 *
 * ![](filter.png)
 *
 * Similar to the well-known `Array.prototype.filter` method, this operator
 * takes values from the source Observable, passes them through a `predicate`
 * function and only emits those values that yielded `true`.
 *
 * ## Example
 *
 * Emit only click events whose target was a DIV element
 *
 * ```ts
 * import { fromEvent, filter } from 'rxjs';
 *
 * const div = document.createElement('div');
 * div.style.cssText = 'width: 200px; height: 200px; background: #09c;';
 * document.body.appendChild(div);
 *
 * const clicks = fromEvent(document, 'click');
 * const clicksOnDivs = clicks.pipe(filter(ev => (<HTMLElement>ev.target).tagName === 'DIV'));
 * clicksOnDivs.subscribe(x => console.log(x));
 * ```
 *
 * @see {@link distinct}
 * @see {@link distinctUntilChanged}
 * @see {@link distinctUntilKeyChanged}
 * @see {@link ignoreElements}
 * @see {@link partition}
 * @see {@link skip}
 *
 * @param predicate A function that
 * evaluates each value emitted by the source Observable. If it returns `true`,
 * the value is emitted, if `false` the value is not passed to the output
 * Observable. The `index` parameter is the number `i` for the i-th source
 * emission that has happened since the subscription, starting from the number
 * `0`.
 * @param thisArg An optional argument to determine the value of `this`
 * in the `predicate` function.
 * @return A function that returns an Observable that emits items from the
 * source Observable that satisfy the specified `predicate`.
 */
export function filter<T>(predicate: (value: T, index: number) => boolean, thisArg?: any): MonoTypeOperatorFunction<T> {
  return operate((source, subscriber) => {
    // An index passed to our predicate function on each call.
    let index = 0;

    // Subscribe to the source, all errors and completions are
    // forwarded to the consumer.
    source.subscribe(
      // Call the predicate with the appropriate `this` context,
      // if the predicate returns `true`, then send the value
      // to the consumer.
      createOperatorSubscriber(subscriber, (value) => predicate.call(thisArg, value, index++) && subscriber.next(value))
    );
  });
}
import { MonoTypeOperatorFunction } from '../types';
import { operate } from '../util/lift';

/**
 * Returns an Observable that mirrors the source Observable, but will call a specified function when
 * the source terminates on complete or error.
 * The specified function will also be called when the subscriber explicitly unsubscribes.
 *
 * ## Examples
 *
 * Execute callback function when the observable completes
 *
 * ```ts
 * import { interval, take, finalize } from 'rxjs';
 *
 * // emit value in sequence every 1 second
 * const source = interval(1000);
 * const example = source.pipe(
 *   take(5), //take only the first 5 values
 *   finalize(() => console.log('Sequence complete')) // Execute when the observable completes
 * );
 * const subscribe = example.subscribe(val => console.log(val));
 *
 * // results:
 * // 0
 * // 1
 * // 2
 * // 3
 * // 4
 * // 'Sequence complete'
 * ```
 *
 * Execute callback function when the subscriber explicitly unsubscribes
 *
 * ```ts
 * import { interval, finalize, tap, noop, timer } from 'rxjs';
 *
 * const source = interval(100).pipe(
 *   finalize(() => console.log('[finalize] Called')),
 *   tap({
 *     next: () => console.log('[next] Called'),
 *     error: () => console.log('[error] Not called'),
 *     complete: () => console.log('[tap complete] Not called')
 *   })
 * );
 *
 * const sub = source.subscribe({
 *   next: x => console.log(x),
 *   error: noop,
 *   complete: () => console.log('[complete] Not called')
 * });
 *
 * timer(150).subscribe(() => sub.unsubscribe());
 *
 * // results:
 * // '[next] Called'
 * // 0
 * // '[finalize] Called'
 * ```
 *
 * @param {function} callback Function to be called when source terminates.
 * @return A function that returns an Observable that mirrors the source, but
 * will call the specified function on termination.
 */
export function finalize<T>(callback: () => void): MonoTypeOperatorFunction<T> {
  return operate((source, subscriber) => {
    // TODO: This try/finally was only added for `useDeprecatedSynchronousErrorHandling`.
    // REMOVE THIS WHEN THAT HOT GARBAGE IS REMOVED IN V8.
    try {
      source.subscribe(subscriber);
    } finally {
      subscriber.add(callback);
    }
  });
}
import { Observable } from '../Observable';
import { Subscriber } from '../Subscriber';
import { OperatorFunction, TruthyTypesOf } from '../types';
import { operate } from '../util/lift';
import { createOperatorSubscriber } from './OperatorSubscriber';

export function find<T>(predicate: BooleanConstructor): OperatorFunction<T, TruthyTypesOf<T>>;
/** @deprecated Use a closure instead of a `thisArg`. Signatures accepting a `thisArg` will be removed in v8. */
export function find<T, S extends T, A>(
  predicate: (this: A, value: T, index: number, source: Observable<T>) => value is S,
  thisArg: A
): OperatorFunction<T, S | undefined>;
export function find<T, S extends T>(
  predicate: (value: T, index: number, source: Observable<T>) => value is S
): OperatorFunction<T, S | undefined>;
/** @deprecated Use a closure instead of a `thisArg`. Signatures accepting a `thisArg` will be removed in v8. */
export function find<T, A>(
  predicate: (this: A, value: T, index: number, source: Observable<T>) => boolean,
  thisArg: A
): OperatorFunction<T, T | undefined>;
export function find<T>(predicate: (value: T, index: number, source: Observable<T>) => boolean): OperatorFunction<T, T | undefined>;
/**
 * Emits only the first value emitted by the source Observable that meets some
 * condition.
 *
 * <span class="informal">Finds the first value that passes some test and emits
 * that.</span>
 *
 * ![](find.png)
 *
 * `find` searches for the first item in the source Observable that matches the
 * specified condition embodied by the `predicate`, and returns the first
 * occurrence in the source. Unlike {@link first}, the `predicate` is required
 * in `find`, and does not emit an error if a valid value is not found
 * (emits `undefined` instead).
 *
 * ## Example
 *
 * Find and emit the first click that happens on a DIV element
 *
 * ```ts
 * import { fromEvent, find } from 'rxjs';
 *
 * const div = document.createElement('div');
 * div.style.cssText = 'width: 200px; height: 200px; background: #09c;';
 * document.body.appendChild(div);
 *
 * const clicks = fromEvent(document, 'click');
 * const result = clicks.pipe(find(ev => (<HTMLElement>ev.target).tagName === 'DIV'));
 * result.subscribe(x => console.log(x));
 * ```
 *
 * @see {@link filter}
 * @see {@link first}
 * @see {@link findIndex}
 * @see {@link take}
 *
 * @param {function(value: T, index: number, source: Observable<T>): boolean} predicate
 * A function called with each item to test for condition matching.
 * @param {any} [thisArg] An optional argument to determine the value of `this`
 * in the `predicate` function.
 * @return A function that returns an Observable that emits the first item that
 * matches the condition.
 */
export function find<T>(
  predicate: (value: T, index: number, source: Observable<T>) => boolean,
  thisArg?: any
): OperatorFunction<T, T | undefined> {
  return operate(createFind(predicate, thisArg, 'value'));
}

export function createFind<T>(
  predicate: (value: T, index: number, source: Observable<T>) => boolean,
  thisArg: any,
  emit: 'value' | 'index'
) {
  const findIndex = emit === 'index';
  return (source: Observable<T>, subscriber: Subscriber<any>) => {
    let index = 0;
    source.subscribe(
      createOperatorSubscriber(
        subscriber,
        (value) => {
          const i = index++;
          if (predicate.call(thisArg, value, i, source)) {
            subscriber.next(findIndex ? i : value);
            subscriber.complete();
          }
        },
        () => {
          subscriber.next(findIndex ? -1 : undefined);
          subscriber.complete();
        }
      )
    );
  };
}
import { Observable } from '../Observable';
import { Falsy, OperatorFunction } from '../types';
import { operate } from '../util/lift';
import { createFind } from './find';

export function findIndex<T>(predicate: BooleanConstructor): OperatorFunction<T, T extends Falsy ? -1 : number>;
/** @deprecated Use a closure instead of a `thisArg`. Signatures accepting a `thisArg` will be removed in v8. */
export function findIndex<T>(predicate: BooleanConstructor, thisArg: any): OperatorFunction<T, T extends Falsy ? -1 : number>;
/** @deprecated Use a closure instead of a `thisArg`. Signatures accepting a `thisArg` will be removed in v8. */
export function findIndex<T, A>(
  predicate: (this: A, value: T, index: number, source: Observable<T>) => boolean,
  thisArg: A
): OperatorFunction<T, number>;
export function findIndex<T>(predicate: (value: T, index: number, source: Observable<T>) => boolean): OperatorFunction<T, number>;

/**
 * Emits only the index of the first value emitted by the source Observable that
 * meets some condition.
 *
 * <span class="informal">It's like {@link find}, but emits the index of the
 * found value, not the value itself.</span>
 *
 * ![](findIndex.png)
 *
 * `findIndex` searches for the first item in the source Observable that matches
 * the specified condition embodied by the `predicate`, and returns the
 * (zero-based) index of the first occurrence in the source. Unlike
 * {@link first}, the `predicate` is required in `findIndex`, and does not emit
 * an error if a valid value is not found.
 *
 * ## Example
 *
 * Emit the index of first click that happens on a DIV element
 *
 * ```ts
 * import { fromEvent, findIndex } from 'rxjs';
 *
 * const div = document.createElement('div');
 * div.style.cssText = 'width: 200px; height: 200px; background: #09c;';
 * document.body.appendChild(div);
 *
 * const clicks = fromEvent(document, 'click');
 * const result = clicks.pipe(findIndex(ev => (<HTMLElement>ev.target).tagName === 'DIV'));
 * result.subscribe(x => console.log(x));
 * ```
 *
 * @see {@link filter}
 * @see {@link find}
 * @see {@link first}
 * @see {@link take}
 *
 * @param {function(value: T, index: number, source: Observable<T>): boolean} predicate
 * A function called with each item to test for condition matching.
 * @param {any} [thisArg] An optional argument to determine the value of `this`
 * in the `predicate` function.
 * @return A function that returns an Observable that emits the index of the
 * first item that matches the condition.
 */
export function findIndex<T>(
  predicate: (value: T, index: number, source: Observable<T>) => boolean,
  thisArg?: any
): OperatorFunction<T, number> {
  return operate(createFind(predicate, thisArg, 'index'));
}
import { Observable } from '../Observable';
import { EmptyError } from '../util/EmptyError';
import { OperatorFunction, TruthyTypesOf } from '../types';
import { filter } from './filter';
import { take } from './take';
import { defaultIfEmpty } from './defaultIfEmpty';
import { throwIfEmpty } from './throwIfEmpty';
import { identity } from '../util/identity';

export function first<T, D = T>(predicate?: null, defaultValue?: D): OperatorFunction<T, T | D>;
export function first<T>(predicate: BooleanConstructor): OperatorFunction<T, TruthyTypesOf<T>>;
export function first<T, D>(predicate: BooleanConstructor, defaultValue: D): OperatorFunction<T, TruthyTypesOf<T> | D>;
export function first<T, S extends T>(
  predicate: (value: T, index: number, source: Observable<T>) => value is S,
  defaultValue?: S
): OperatorFunction<T, S>;
export function first<T, S extends T, D>(
  predicate: (value: T, index: number, source: Observable<T>) => value is S,
  defaultValue: D
): OperatorFunction<T, S | D>;
export function first<T, D = T>(
  predicate: (value: T, index: number, source: Observable<T>) => boolean,
  defaultValue?: D
): OperatorFunction<T, T | D>;

/**
 * Emits only the first value (or the first value that meets some condition)
 * emitted by the source Observable.
 *
 * <span class="informal">Emits only the first value. Or emits only the first
 * value that passes some test.</span>
 *
 * ![](first.png)
 *
 * If called with no arguments, `first` emits the first value of the source
 * Observable, then completes. If called with a `predicate` function, `first`
 * emits the first value of the source that matches the specified condition. Throws an error if
 * `defaultValue` was not provided and a matching element is not found.
 *
 * ## Examples
 *
 * Emit only the first click that happens on the DOM
 *
 * ```ts
 * import { fromEvent, first } from 'rxjs';
 *
 * const clicks = fromEvent(document, 'click');
 * const result = clicks.pipe(first());
 * result.subscribe(x => console.log(x));
 * ```
 *
 * Emits the first click that happens on a DIV
 *
 * ```ts
 * import { fromEvent, first } from 'rxjs';
 *
 * const div = document.createElement('div');
 * div.style.cssText = 'width: 200px; height: 200px; background: #09c;';
 * document.body.appendChild(div);
 *
 * const clicks = fromEvent(document, 'click');
 * const result = clicks.pipe(first(ev => (<HTMLElement>ev.target).tagName === 'DIV'));
 * result.subscribe(x => console.log(x));
 * ```
 *
 * @see {@link filter}
 * @see {@link find}
 * @see {@link take}
 *
 * @throws {EmptyError} Delivers an EmptyError to the Observer's `error`
 * callback if the Observable completes before any `next` notification was sent.
 * This is how `first()` is different from {@link take}(1) which completes instead.
 *
 * @param {function(value: T, index: number, source: Observable<T>): boolean} [predicate]
 * An optional function called with each item to test for condition matching.
 * @param {D} [defaultValue] The default value emitted in case no valid value
 * was found on the source.
 * @return A function that returns an Observable that emits the first item that
 * matches the condition.
 */
export function first<T, D>(
  predicate?: ((value: T, index: number, source: Observable<T>) => boolean) | null,
  defaultValue?: D
): OperatorFunction<T, T | D> {
  const hasDefaultValue = arguments.length >= 2;
  return (source: Observable<T>) =>
    source.pipe(
      predicate ? filter((v, i) => predicate(v, i, source)) : identity,
      take(1),
      hasDefaultValue ? defaultIfEmpty(defaultValue!) : throwIfEmpty(() => new EmptyError())
    );
}
import { mergeMap } from './mergeMap';

/**
 * @deprecated Renamed to {@link mergeMap}. Will be removed in v8.
 */
export const flatMap = mergeMap;
import { Observable } from '../Observable';
import { innerFrom } from '../observable/innerFrom';
import { Subject } from '../Subject';
import { ObservableInput, Observer, OperatorFunction, SubjectLike } from '../types';
import { operate } from '../util/lift';
import { createOperatorSubscriber, OperatorSubscriber } from './OperatorSubscriber';

export interface BasicGroupByOptions<K, T> {
  element?: undefined;
  duration?: (grouped: GroupedObservable<K, T>) => ObservableInput<any>;
  connector?: () => SubjectLike<T>;
}

export interface GroupByOptionsWithElement<K, E, T> {
  element: (value: T) => E;
  duration?: (grouped: GroupedObservable<K, E>) => ObservableInput<any>;
  connector?: () => SubjectLike<E>;
}

export function groupBy<T, K>(key: (value: T) => K, options: BasicGroupByOptions<K, T>): OperatorFunction<T, GroupedObservable<K, T>>;

export function groupBy<T, K, E>(
  key: (value: T) => K,
  options: GroupByOptionsWithElement<K, E, T>
): OperatorFunction<T, GroupedObservable<K, E>>;

export function groupBy<T, K extends T>(
  key: (value: T) => value is K
): OperatorFunction<T, GroupedObservable<true, K> | GroupedObservable<false, Exclude<T, K>>>;

export function groupBy<T, K>(key: (value: T) => K): OperatorFunction<T, GroupedObservable<K, T>>;

/**
 * @deprecated use the options parameter instead.
 */
export function groupBy<T, K>(
  key: (value: T) => K,
  element: void,
  duration: (grouped: GroupedObservable<K, T>) => Observable<any>
): OperatorFunction<T, GroupedObservable<K, T>>;

/**
 * @deprecated use the options parameter instead.
 */
export function groupBy<T, K, R>(
  key: (value: T) => K,
  element?: (value: T) => R,
  duration?: (grouped: GroupedObservable<K, R>) => Observable<any>
): OperatorFunction<T, GroupedObservable<K, R>>;

/**
 * Groups the items emitted by an Observable according to a specified criterion,
 * and emits these grouped items as `GroupedObservables`, one
 * {@link GroupedObservable} per group.
 *
 * ![](groupBy.png)
 *
 * When the Observable emits an item, a key is computed for this item with the key function.
 *
 * If a {@link GroupedObservable} for this key exists, this {@link GroupedObservable} emits. Otherwise, a new
 * {@link GroupedObservable} for this key is created and emits.
 *
 * A {@link GroupedObservable} represents values belonging to the same group represented by a common key. The common
 * key is available as the `key` field of a {@link GroupedObservable} instance.
 *
 * The elements emitted by {@link GroupedObservable}s are by default the items emitted by the Observable, or elements
 * returned by the element function.
 *
 * ## Examples
 *
 * Group objects by `id` and return as array
 *
 * ```ts
 * import { of, groupBy, mergeMap, reduce } from 'rxjs';
 *
 * of(
 *   { id: 1, name: 'JavaScript' },
 *   { id: 2, name: 'Parcel' },
 *   { id: 2, name: 'webpack' },
 *   { id: 1, name: 'TypeScript' },
 *   { id: 3, name: 'TSLint' }
 * ).pipe(
 *   groupBy(p => p.id),
 *   mergeMap(group$ => group$.pipe(reduce((acc, cur) => [...acc, cur], [])))
 * )
 * .subscribe(p => console.log(p));
 *
 * // displays:
 * // [{ id: 1, name: 'JavaScript' }, { id: 1, name: 'TypeScript'}]
 * // [{ id: 2, name: 'Parcel' }, { id: 2, name: 'webpack'}]
 * // [{ id: 3, name: 'TSLint' }]
 * ```
 *
 * Pivot data on the `id` field
 *
 * ```ts
 * import { of, groupBy, mergeMap, reduce, map } from 'rxjs';
 *
 * of(
 *   { id: 1, name: 'JavaScript' },
 *   { id: 2, name: 'Parcel' },
 *   { id: 2, name: 'webpack' },
 *   { id: 1, name: 'TypeScript' },
 *   { id: 3, name: 'TSLint' }
 * ).pipe(
 *   groupBy(p => p.id, { element: p => p.name }),
 *   mergeMap(group$ => group$.pipe(reduce((acc, cur) => [...acc, cur], [`${ group$.key }`]))),
 *   map(arr => ({ id: parseInt(arr[0], 10), values: arr.slice(1) }))
 * )
 * .subscribe(p => console.log(p));
 *
 * // displays:
 * // { id: 1, values: [ 'JavaScript', 'TypeScript' ] }
 * // { id: 2, values: [ 'Parcel', 'webpack' ] }
 * // { id: 3, values: [ 'TSLint' ] }
 * ```
 *
 * @param key A function that extracts the key
 * for each item.
 * @param element A function that extracts the
 * return element for each item.
 * @param duration
 * A function that returns an Observable to determine how long each group should
 * exist.
 * @param connector Factory function to create an
 * intermediate Subject through which grouped elements are emitted.
 * @return A function that returns an Observable that emits GroupedObservables,
 * each of which corresponds to a unique key value and each of which emits
 * those items from the source Observable that share that key value.
 *
 * @deprecated Use the options parameter instead.
 */
export function groupBy<T, K, R>(
  key: (value: T) => K,
  element?: (value: T) => R,
  duration?: (grouped: GroupedObservable<K, R>) => Observable<any>,
  connector?: () => Subject<R>
): OperatorFunction<T, GroupedObservable<K, R>>;

// Impl
export function groupBy<T, K, R>(
  keySelector: (value: T) => K,
  elementOrOptions?: ((value: any) => any) | void | BasicGroupByOptions<K, T> | GroupByOptionsWithElement<K, R, T>,
  duration?: (grouped: GroupedObservable<any, any>) => ObservableInput<any>,
  connector?: () => SubjectLike<any>
): OperatorFunction<T, GroupedObservable<K, R>> {
  return operate((source, subscriber) => {
    let element: ((value: any) => any) | void;
    if (!elementOrOptions || typeof elementOrOptions === 'function') {
      element = elementOrOptions as ((value: any) => any);
    } else {
      ({ duration, element, connector } = elementOrOptions);
    }

    // A lookup for the groups that we have so far.
    const groups = new Map<K, SubjectLike<any>>();

    // Used for notifying all groups and the subscriber in the same way.
    const notify = (cb: (group: Observer<any>) => void) => {
      groups.forEach(cb);
      cb(subscriber);
    };

    // Used to handle errors from the source, AND errors that occur during the
    // next call from the source.
    const handleError = (err: any) => notify((consumer) => consumer.error(err));

    // The number of actively subscribed groups
    let activeGroups = 0;

    // Whether or not teardown was attempted on this subscription.
    let teardownAttempted = false;

    // Capturing a reference to this, because we need a handle to it
    // in `createGroupedObservable` below. This is what we use to
    // subscribe to our source observable. This sometimes needs to be unsubscribed
    // out-of-band with our `subscriber` which is the downstream subscriber, or destination,
    // in cases where a user unsubscribes from the main resulting subscription, but
    // still has groups from this subscription subscribed and would expect values from it
    // Consider:  `source.pipe(groupBy(fn), take(2))`.
    const groupBySourceSubscriber = new OperatorSubscriber(
      subscriber,
      (value: T) => {
        // Because we have to notify all groups of any errors that occur in here,
        // we have to add our own try/catch to ensure that those errors are propagated.
        // OperatorSubscriber will only send the error to the main subscriber.
        try {
          const key = keySelector(value);

          let group = groups.get(key);
          if (!group) {
            // Create our group subject
            groups.set(key, (group = connector ? connector() : new Subject<any>()));

            // Emit the grouped observable. Note that we can't do a simple `asObservable()` here,
            // because the grouped observable has special semantics around reference counting
            // to ensure we don't sever our connection to the source prematurely.
            const grouped = createGroupedObservable(key, group);
            subscriber.next(grouped);

            if (duration) {
              const durationSubscriber = createOperatorSubscriber(
                // Providing the group here ensures that it is disposed of -- via `unsubscribe` --
                // wnen the duration subscription is torn down. That is important, because then
                // if someone holds a handle to the grouped observable and tries to subscribe to it
                // after the connection to the source has been severed, they will get an
                // `ObjectUnsubscribedError` and know they can't possibly get any notifications.
                group as any,
                () => {
                  // Our duration notified! We can complete the group.
                  // The group will be removed from the map in the finalization phase.
                  group!.complete();
                  durationSubscriber?.unsubscribe();
                },
                // Completions are also sent to the group, but just the group.
                undefined,
                // Errors on the duration subscriber are sent to the group
                // but only the group. They are not sent to the main subscription.
                undefined,
                // Finalization: Remove this group from our map.
                () => groups.delete(key)
              );

              // Start our duration notifier.
              groupBySourceSubscriber.add(innerFrom(duration(grouped)).subscribe(durationSubscriber));
            }
          }

          // Send the value to our group.
          group.next(element ? element(value) : value);
        } catch (err) {
          handleError(err);
        }
      },
      // Source completes.
      () => notify((consumer) => consumer.complete()),
      // Error from the source.
      handleError,
      // Free up memory.
      // When the source subscription is _finally_ torn down, release the subjects and keys
      // in our groups Map, they may be quite large and we don't want to keep them around if we
      // don't have to.
      () => groups.clear(),
      () => {
        teardownAttempted = true;
        // We only kill our subscription to the source if we have
        // no active groups. As stated above, consider this scenario:
        // source$.pipe(groupBy(fn), take(2)).
        return activeGroups === 0;
      }
    );

    // Subscribe to the source
    source.subscribe(groupBySourceSubscriber);

    /**
     * Creates the actual grouped observable returned.
     * @param key The key of the group
     * @param groupSubject The subject that fuels the group
     */
    function createGroupedObservable(key: K, groupSubject: SubjectLike<any>) {
      const result: any = new Observable<T>((groupSubscriber) => {
        activeGroups++;
        const innerSub = groupSubject.subscribe(groupSubscriber);
        return () => {
          innerSub.unsubscribe();
          // We can kill the subscription to our source if we now have no more
          // active groups subscribed, and a finalization was already attempted on
          // the source.
          --activeGroups === 0 && teardownAttempted && groupBySourceSubscriber.unsubscribe();
        };
      });
      result.key = key;
      return result;
    }
  });
}

/**
 * An observable of values that is the emitted by the result of a {@link groupBy} operator,
 * contains a `key` property for the grouping.
 */
export interface GroupedObservable<K, T> extends Observable<T> {
  /**
   * The key value for the grouped notifications.
   */
  readonly key: K;
}
import { OperatorFunction } from '../types';
import { operate } from '../util/lift';
import { createOperatorSubscriber } from './OperatorSubscriber';
import { noop } from '../util/noop';

/**
 * Ignores all items emitted by the source Observable and only passes calls of `complete` or `error`.
 *
 * ![](ignoreElements.png)
 *
 * The `ignoreElements` operator suppresses all items emitted by the source Observable,
 * but allows its termination notification (either `error` or `complete`) to pass through unchanged.
 *
 * If you do not care about the items being emitted by an Observable, but you do want to be notified
 * when it completes or when it terminates with an error, you can apply the `ignoreElements` operator
 * to the Observable, which will ensure that it will never call its observers’ `next` handlers.
 *
 * ## Example
 *
 * Ignore all `next` emissions from the source
 *
 * ```ts
 * import { of, ignoreElements } from 'rxjs';
 *
 * of('you', 'talking', 'to', 'me')
 *   .pipe(ignoreElements())
 *   .subscribe({
 *     next: word => console.log(word),
 *     error: err => console.log('error:', err),
 *     complete: () => console.log('the end'),
 *   });
 *
 * // result:
 * // 'the end'
 * ```
 *
 * @return A function that returns an empty Observable that only calls
 * `complete` or `error`, based on which one is called by the source
 * Observable.
 */
export function ignoreElements(): OperatorFunction<unknown, never> {
  return operate((source, subscriber) => {
    source.subscribe(createOperatorSubscriber(subscriber, noop));
  });
}
import { OperatorFunction } from '../types';
import { operate } from '../util/lift';
import { createOperatorSubscriber } from './OperatorSubscriber';

/**
 * Emits `false` if the input Observable emits any values, or emits `true` if the
 * input Observable completes without emitting any values.
 *
 * <span class="informal">Tells whether any values are emitted by an Observable.</span>
 *
 * ![](isEmpty.png)
 *
 * `isEmpty` transforms an Observable that emits values into an Observable that
 * emits a single boolean value representing whether or not any values were
 * emitted by the source Observable. As soon as the source Observable emits a
 * value, `isEmpty` will emit a `false` and complete.  If the source Observable
 * completes having not emitted anything, `isEmpty` will emit a `true` and
 * complete.
 *
 * A similar effect could be achieved with {@link count}, but `isEmpty` can emit
 * a `false` value sooner.
 *
 * ## Examples
 *
 * Emit `false` for a non-empty Observable
 *
 * ```ts
 * import { Subject, isEmpty } from 'rxjs';
 *
 * const source = new Subject<string>();
 * const result = source.pipe(isEmpty());
 *
 * source.subscribe(x => console.log(x));
 * result.subscribe(x => console.log(x));
 *
 * source.next('a');
 * source.next('b');
 * source.next('c');
 * source.complete();
 *
 * // Outputs
 * // 'a'
 * // false
 * // 'b'
 * // 'c'
 * ```
 *
 * Emit `true` for an empty Observable
 *
 * ```ts
 * import { EMPTY, isEmpty } from 'rxjs';
 *
 * const result = EMPTY.pipe(isEmpty());
 * result.subscribe(x => console.log(x));
 *
 * // Outputs
 * // true
 * ```
 *
 * @see {@link count}
 * @see {@link EMPTY}
 *
 * @return A function that returns an Observable that emits boolean value
 * indicating whether the source Observable was empty or not.
 */
export function isEmpty<T>(): OperatorFunction<T, boolean> {
  return operate((source, subscriber) => {
    source.subscribe(
      createOperatorSubscriber(
        subscriber,
        () => {
          subscriber.next(false);
          subscriber.complete();
        },
        () => {
          subscriber.next(true);
          subscriber.complete();
        }
      )
    );
  });
}
import { Observable } from '../Observable';
import { ObservableInput, OperatorFunction } from '../types';
import { identity } from '../util/identity';
import { mapOneOrManyArgs } from '../util/mapOneOrManyArgs';
import { pipe } from '../util/pipe';
import { mergeMap } from './mergeMap';
import { toArray } from './toArray';

/**
 * Collects all of the inner sources from source observable. Then, once the
 * source completes, joins the values using the given static.
 *
 * This is used for {@link combineLatestAll} and {@link zipAll} which both have the
 * same behavior of collecting all inner observables, then operating on them.
 *
 * @param joinFn The type of static join to apply to the sources collected
 * @param project The projection function to apply to the values, if any
 */
export function joinAllInternals<T, R>(joinFn: (sources: ObservableInput<T>[]) => Observable<T>, project?: (...args: any[]) => R) {
  return pipe(
    // Collect all inner sources into an array, and emit them when the
    // source completes.
    toArray() as OperatorFunction<ObservableInput<T>, ObservableInput<T>[]>,
    // Run the join function on the collected array of inner sources.
    mergeMap((sources) => joinFn(sources)),
    // If a projection function was supplied, apply it to each result.
    project ? mapOneOrManyArgs(project) : (identity as any)
  );
}
import { Observable } from '../Observable';
import { EmptyError } from '../util/EmptyError';
import { OperatorFunction, TruthyTypesOf } from '../types';
import { filter } from './filter';
import { takeLast } from './takeLast';
import { throwIfEmpty } from './throwIfEmpty';
import { defaultIfEmpty } from './defaultIfEmpty';
import { identity } from '../util/identity';

export function last<T>(predicate: BooleanConstructor): OperatorFunction<T, TruthyTypesOf<T>>;
export function last<T, D>(predicate: BooleanConstructor, defaultValue: D): OperatorFunction<T, TruthyTypesOf<T> | D>;
export function last<T, D = T>(predicate?: null, defaultValue?: D): OperatorFunction<T, T | D>;
export function last<T, S extends T>(
  predicate: (value: T, index: number, source: Observable<T>) => value is S,
  defaultValue?: S
): OperatorFunction<T, S>;
export function last<T, D = T>(
  predicate: (value: T, index: number, source: Observable<T>) => boolean,
  defaultValue?: D
): OperatorFunction<T, T | D>;

/**
 * Returns an Observable that emits only the last item emitted by the source Observable.
 * It optionally takes a predicate function as a parameter, in which case, rather than emitting
 * the last item from the source Observable, the resulting Observable will emit the last item
 * from the source Observable that satisfies the predicate.
 *
 * ![](last.png)
 *
 * It will throw an error if the source completes without notification or one that matches the predicate. It
 * returns the last value or if a predicate is provided last value that matches the predicate. It returns the
 * given default value if no notification is emitted or matches the predicate.
 *
 * ## Examples
 *
 * Last alphabet from the sequence
 *
 * ```ts
 * import { from, last } from 'rxjs';
 *
 * const source = from(['x', 'y', 'z']);
 * const result = source.pipe(last());
 *
 * result.subscribe(value => console.log(`Last alphabet: ${ value }`));
 *
 * // Outputs
 * // Last alphabet: z
 * ```
 *
 * Default value when the value in the predicate is not matched
 *
 * ```ts
 * import { from, last } from 'rxjs';
 *
 * const source = from(['x', 'y', 'z']);
 * const result = source.pipe(last(char => char === 'a', 'not found'));
 *
 * result.subscribe(value => console.log(`'a' is ${ value }.`));
 *
 * // Outputs
 * // 'a' is not found.
 * ```
 *
 * @see {@link skip}
 * @see {@link skipUntil}
 * @see {@link skipLast}
 * @see {@link skipWhile}
 *
 * @throws {EmptyError} Delivers an EmptyError to the Observer's `error`
 * callback if the Observable completes before any `next` notification was sent.
 * @param {function} [predicate] - The condition any source emitted item has to satisfy.
 * @param {any} [defaultValue] - An optional default value to provide if last
 * predicate isn't met or no values were emitted.
 * @return A function that returns an Observable that emits only the last item
 * satisfying the given condition from the source, or a NoSuchElementException
 * if no such items are emitted.
 * @throws - Throws if no items that match the predicate are emitted by the source Observable.
 */
export function last<T, D>(
  predicate?: ((value: T, index: number, source: Observable<T>) => boolean) | null,
  defaultValue?: D
): OperatorFunction<T, T | D> {
  const hasDefaultValue = arguments.length >= 2;
  return (source: Observable<T>) =>
    source.pipe(
      predicate ? filter((v, i) => predicate(v, i, source)) : identity,
      takeLast(1),
      hasDefaultValue ? defaultIfEmpty(defaultValue!) : throwIfEmpty(() => new EmptyError())
    );
}
import { OperatorFunction } from '../types';
import { operate } from '../util/lift';
import { createOperatorSubscriber } from './OperatorSubscriber';

export function map<T, R>(project: (value: T, index: number) => R): OperatorFunction<T, R>;
/** @deprecated Use a closure instead of a `thisArg`. Signatures accepting a `thisArg` will be removed in v8. */
export function map<T, R, A>(project: (this: A, value: T, index: number) => R, thisArg: A): OperatorFunction<T, R>;

/**
 * Applies a given `project` function to each value emitted by the source
 * Observable, and emits the resulting values as an Observable.
 *
 * <span class="informal">Like [Array.prototype.map()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map),
 * it passes each source value through a transformation function to get
 * corresponding output values.</span>
 *
 * ![](map.png)
 *
 * Similar to the well known `Array.prototype.map` function, this operator
 * applies a projection to each value and emits that projection in the output
 * Observable.
 *
 * ## Example
 *
 * Map every click to the `clientX` position of that click
 *
 * ```ts
 * import { fromEvent, map } from 'rxjs';
 *
 * const clicks = fromEvent<PointerEvent>(document, 'click');
 * const positions = clicks.pipe(map(ev => ev.clientX));
 *
 * positions.subscribe(x => console.log(x));
 * ```
 *
 * @see {@link mapTo}
 * @see {@link pluck}
 *
 * @param {function(value: T, index: number): R} project The function to apply
 * to each `value` emitted by the source Observable. The `index` parameter is
 * the number `i` for the i-th emission that has happened since the
 * subscription, starting from the number `0`.
 * @param {any} [thisArg] An optional argument to define what `this` is in the
 * `project` function.
 * @return A function that returns an Observable that emits the values from the
 * source Observable transformed by the given `project` function.
 */
export function map<T, R>(project: (value: T, index: number) => R, thisArg?: any): OperatorFunction<T, R> {
  return operate((source, subscriber) => {
    // The index of the value from the source. Used with projection.
    let index = 0;
    // Subscribe to the source, all errors and completions are sent along
    // to the consumer.
    source.subscribe(
      createOperatorSubscriber(subscriber, (value: T) => {
        // Call the projection function with the appropriate this context,
        // and send the resulting value to the consumer.
        subscriber.next(project.call(thisArg, value, index++));
      })
    );
  });
}
import { OperatorFunction } from '../types';
import { map } from './map';

/** @deprecated To be removed in v9. Use {@link map} instead: `map(() => value)`. */
export function mapTo<R>(value: R): OperatorFunction<unknown, R>;
/**
 * @deprecated Do not specify explicit type parameters. Signatures with type parameters
 * that cannot be inferred will be removed in v8. `mapTo` itself will be removed in v9,
 * use {@link map} instead: `map(() => value)`.
 * */
export function mapTo<T, R>(value: R): OperatorFunction<T, R>;

/**
 * Emits the given constant value on the output Observable every time the source
 * Observable emits a value.
 *
 * <span class="informal">Like {@link map}, but it maps every source value to
 * the same output value every time.</span>
 *
 * ![](mapTo.png)
 *
 * Takes a constant `value` as argument, and emits that whenever the source
 * Observable emits a value. In other words, ignores the actual source value,
 * and simply uses the emission moment to know when to emit the given `value`.
 *
 * ## Example
 *
 * Map every click to the string `'Hi'`
 *
 * ```ts
 * import { fromEvent, mapTo } from 'rxjs';
 *
 * const clicks = fromEvent(document, 'click');
 * const greetings = clicks.pipe(mapTo('Hi'));
 *
 * greetings.subscribe(x => console.log(x));
 * ```
 *
 * @see {@link map}
 *
 * @param value The value to map each source value to.
 * @return A function that returns an Observable that emits the given `value`
 * every time the source Observable emits.
 * @deprecated To be removed in v9. Use {@link map} instead: `map(() => value)`.
 */
export function mapTo<R>(value: R): OperatorFunction<unknown, R> {
  return map(() => value);
}
import { Notification } from '../Notification';
import { OperatorFunction, ObservableNotification } from '../types';
import { operate } from '../util/lift';
import { createOperatorSubscriber } from './OperatorSubscriber';

/**
 * Represents all of the notifications from the source Observable as `next`
 * emissions marked with their original types within {@link Notification}
 * objects.
 *
 * <span class="informal">Wraps `next`, `error` and `complete` emissions in
 * {@link Notification} objects, emitted as `next` on the output Observable.
 * </span>
 *
 * ![](materialize.png)
 *
 * `materialize` returns an Observable that emits a `next` notification for each
 * `next`, `error`, or `complete` emission of the source Observable. When the
 * source Observable emits `complete`, the output Observable will emit `next` as
 * a Notification of type "complete", and then it will emit `complete` as well.
 * When the source Observable emits `error`, the output will emit `next` as a
 * Notification of type "error", and then `complete`.
 *
 * This operator is useful for producing metadata of the source Observable, to
 * be consumed as `next` emissions. Use it in conjunction with
 * {@link dematerialize}.
 *
 * ## Example
 *
 * Convert a faulty Observable to an Observable of Notifications
 *
 * ```ts
 * import { of, materialize, map } from 'rxjs';
 *
 * const letters = of('a', 'b', 13, 'd');
 * const upperCase = letters.pipe(map((x: any) => x.toUpperCase()));
 * const materialized = upperCase.pipe(materialize());
 *
 * materialized.subscribe(x => console.log(x));
 *
 * // Results in the following:
 * // - Notification { kind: 'N', value: 'A', error: undefined, hasValue: true }
 * // - Notification { kind: 'N', value: 'B', error: undefined, hasValue: true }
 * // - Notification { kind: 'E', value: undefined, error: TypeError { message: x.toUpperCase is not a function }, hasValue: false }
 * ```
 *
 * @see {@link Notification}
 * @see {@link dematerialize}
 *
 * @return A function that returns an Observable that emits
 * {@link Notification} objects that wrap the original emissions from the
 * source Observable with metadata.
 */
export function materialize<T>(): OperatorFunction<T, Notification<T> & ObservableNotification<T>> {
  return operate((source, subscriber) => {
    source.subscribe(
      createOperatorSubscriber(
        subscriber,
        (value) => {
          subscriber.next(Notification.createNext(value));
        },
        () => {
          subscriber.next(Notification.createComplete());
          subscriber.complete();
        },
        (err) => {
          subscriber.next(Notification.createError(err));
          subscriber.complete();
        }
      )
    );
  });
}
import { reduce } from './reduce';
import { MonoTypeOperatorFunction } from '../types';
import { isFunction } from '../util/isFunction';

/**
 * The Max operator operates on an Observable that emits numbers (or items that can be compared with a provided function),
 * and when source Observable completes it emits a single item: the item with the largest value.
 *
 * ![](max.png)
 *
 * ## Examples
 *
 * Get the maximal value of a series of numbers
 *
 * ```ts
 * import { of, max } from 'rxjs';
 *
 * of(5, 4, 7, 2, 8)
 *   .pipe(max())
 *   .subscribe(x => console.log(x));
 *
 * // Outputs
 * // 8
 * ```
 *
 * Use a comparer function to get the maximal item
 *
 * ```ts
 * import { of, max } from 'rxjs';
 *
 * of(
 *   { age: 7, name: 'Foo' },
 *   { age: 5, name: 'Bar' },
 *   { age: 9, name: 'Beer' }
 * ).pipe(
 *   max((a, b) => a.age < b.age ? -1 : 1)
 * )
 * .subscribe(x => console.log(x.name));
 *
 * // Outputs
 * // 'Beer'
 * ```
 *
 * @see {@link min}
 *
 * @param {Function} [comparer] - Optional comparer function that it will use instead of its default to compare the
 * value of two items.
 * @return A function that returns an Observable that emits item with the
 * largest value.
 */
export function max<T>(comparer?: (x: T, y: T) => number): MonoTypeOperatorFunction<T> {
  return reduce(isFunction(comparer) ? (x, y) => (comparer(x, y) > 0 ? x : y) : (x, y) => (x > y ? x : y));
}
import { ObservableInput, ObservableInputTuple, OperatorFunction, SchedulerLike } from '../types';
import { operate } from '../util/lift';
import { argsOrArgArray } from '../util/argsOrArgArray';
import { mergeAll } from './mergeAll';
import { popNumber, popScheduler } from '../util/args';
import { from } from '../observable/from';

/** @deprecated Replaced with {@link mergeWith}. Will be removed in v8. */
export function merge<T, A extends readonly unknown[]>(...sources: [...ObservableInputTuple<A>]): OperatorFunction<T, T | A[number]>;
/** @deprecated Replaced with {@link mergeWith}. Will be removed in v8. */
export function merge<T, A extends readonly unknown[]>(
  ...sourcesAndConcurrency: [...ObservableInputTuple<A>, number]
): OperatorFunction<T, T | A[number]>;
/** @deprecated Replaced with {@link mergeWith}. Will be removed in v8. */
export function merge<T, A extends readonly unknown[]>(
  ...sourcesAndScheduler: [...ObservableInputTuple<A>, SchedulerLike]
): OperatorFunction<T, T | A[number]>;
/** @deprecated Replaced with {@link mergeWith}. Will be removed in v8. */
export function merge<T, A extends readonly unknown[]>(
  ...sourcesAndConcurrencyAndScheduler: [...ObservableInputTuple<A>, number, SchedulerLike]
): OperatorFunction<T, T | A[number]>;

export function merge<T>(...args: unknown[]): OperatorFunction<T, unknown> {
  const scheduler = popScheduler(args);
  const concurrent = popNumber(args, Infinity);
  args = argsOrArgArray(args);

  return operate((source, subscriber) => {
    mergeAll(concurrent)(from([source, ...(args as ObservableInput<T>[])], scheduler)).subscribe(subscriber);
  });
}
import { mergeMap } from './mergeMap';
import { identity } from '../util/identity';
import { OperatorFunction, ObservableInput, ObservedValueOf } from '../types';

/**
 * Converts a higher-order Observable into a first-order Observable which
 * concurrently delivers all values that are emitted on the inner Observables.
 *
 * <span class="informal">Flattens an Observable-of-Observables.</span>
 *
 * ![](mergeAll.png)
 *
 * `mergeAll` subscribes to an Observable that emits Observables, also known as
 * a higher-order Observable. Each time it observes one of these emitted inner
 * Observables, it subscribes to that and delivers all the values from the
 * inner Observable on the output Observable. The output Observable only
 * completes once all inner Observables have completed. Any error delivered by
 * a inner Observable will be immediately emitted on the output Observable.
 *
 * ## Examples
 *
 * Spawn a new interval Observable for each click event, and blend their outputs as one Observable
 *
 * ```ts
 * import { fromEvent, map, interval, mergeAll } from 'rxjs';
 *
 * const clicks = fromEvent(document, 'click');
 * const higherOrder = clicks.pipe(map(() => interval(1000)));
 * const firstOrder = higherOrder.pipe(mergeAll());
 *
 * firstOrder.subscribe(x => console.log(x));
 * ```
 *
 * Count from 0 to 9 every second for each click, but only allow 2 concurrent timers
 *
 * ```ts
 * import { fromEvent, map, interval, take, mergeAll } from 'rxjs';
 *
 * const clicks = fromEvent(document, 'click');
 * const higherOrder = clicks.pipe(
 *   map(() => interval(1000).pipe(take(10)))
 * );
 * const firstOrder = higherOrder.pipe(mergeAll(2));
 *
 * firstOrder.subscribe(x => console.log(x));
 * ```
 *
 * @see {@link combineLatestAll}
 * @see {@link concatAll}
 * @see {@link exhaustAll}
 * @see {@link merge}
 * @see {@link mergeMap}
 * @see {@link mergeMapTo}
 * @see {@link mergeScan}
 * @see {@link switchAll}
 * @see {@link switchMap}
 * @see {@link zipAll}
 *
 * @param {number} [concurrent=Infinity] Maximum number of inner
 * Observables being subscribed to concurrently.
 * @return A function that returns an Observable that emits values coming from
 * all the inner Observables emitted by the source Observable.
 */
export function mergeAll<O extends ObservableInput<any>>(concurrent: number = Infinity): OperatorFunction<O, ObservedValueOf<O>> {
  return mergeMap(identity, concurrent);
}
import { Observable } from '../Observable';
import { innerFrom } from '../observable/innerFrom';
import { Subscriber } from '../Subscriber';
import { ObservableInput, SchedulerLike } from '../types';
import { executeSchedule } from '../util/executeSchedule';
import { createOperatorSubscriber } from './OperatorSubscriber';

/**
 * A process embodying the general "merge" strategy. This is used in
 * `mergeMap` and `mergeScan` because the logic is otherwise nearly identical.
 * @param source The original source observable
 * @param subscriber The consumer subscriber
 * @param project The projection function to get our inner sources
 * @param concurrent The number of concurrent inner subscriptions
 * @param onBeforeNext Additional logic to apply before nexting to our consumer
 * @param expand If `true` this will perform an "expand" strategy, which differs only
 * in that it recurses, and the inner subscription must be schedule-able.
 * @param innerSubScheduler A scheduler to use to schedule inner subscriptions,
 * this is to support the expand strategy, mostly, and should be deprecated
 */
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
  // Buffered values, in the event of going over our concurrency limit
  const buffer: T[] = [];
  // The number of active inner subscriptions.
  let active = 0;
  // An index to pass to our accumulator function
  let index = 0;
  // Whether or not the outer source has completed.
  let isComplete = false;

  /**
   * Checks to see if we can complete our result or not.
   */
  const checkComplete = () => {
    // If the outer has completed, and nothing is left in the buffer,
    // and we don't have any active inner subscriptions, then we can
    // Emit the state and complete.
    if (isComplete && !buffer.length && !active) {
      subscriber.complete();
    }
  };

  // If we're under our concurrency limit, just start the inner subscription, otherwise buffer and wait.
  const outerNext = (value: T) => (active < concurrent ? doInnerSub(value) : buffer.push(value));

  const doInnerSub = (value: T) => {
    // If we're expanding, we need to emit the outer values and the inner values
    // as the inners will "become outers" in a way as they are recursively fed
    // back to the projection mechanism.
    expand && subscriber.next(value as any);

    // Increment the number of active subscriptions so we can track it
    // against our concurrency limit later.
    active++;

    // A flag used to show that the inner observable completed.
    // This is checked during finalization to see if we should
    // move to the next item in the buffer, if there is on.
    let innerComplete = false;

    // Start our inner subscription.
    innerFrom(project(value, index++)).subscribe(
      createOperatorSubscriber(
        subscriber,
        (innerValue) => {
          // `mergeScan` has additional handling here. For example
          // taking the inner value and updating state.
          onBeforeNext?.(innerValue);

          if (expand) {
            // If we're expanding, then just recurse back to our outer
            // handler. It will emit the value first thing.
            outerNext(innerValue as any);
          } else {
            // Otherwise, emit the inner value.
            subscriber.next(innerValue);
          }
        },
        () => {
          // Flag that we have completed, so we know to check the buffer
          // during finalization.
          innerComplete = true;
        },
        // Errors are passed to the destination.
        undefined,
        () => {
          // During finalization, if the inner completed (it wasn't errored or
          // cancelled), then we want to try the next item in the buffer if
          // there is one.
          if (innerComplete) {
            // We have to wrap this in a try/catch because it happens during
            // finalization, possibly asynchronously, and we want to pass
            // any errors that happen (like in a projection function) to
            // the outer Subscriber.
            try {
              // INNER SOURCE COMPLETE
              // Decrement the active count to ensure that the next time
              // we try to call `doInnerSub`, the number is accurate.
              active--;
              // If we have more values in the buffer, try to process those
              // Note that this call will increment `active` ahead of the
              // next conditional, if there were any more inner subscriptions
              // to start.
              while (buffer.length && active < concurrent) {
                const bufferedValue = buffer.shift()!;
                // Particularly for `expand`, we need to check to see if a scheduler was provided
                // for when we want to start our inner subscription. Otherwise, we just start
                // are next inner subscription.
                if (innerSubScheduler) {
                  executeSchedule(subscriber, innerSubScheduler, () => doInnerSub(bufferedValue));
                } else {
                  doInnerSub(bufferedValue);
                }
              }
              // Check to see if we can complete, and complete if so.
              checkComplete();
            } catch (err) {
              subscriber.error(err);
            }
          }
        }
      )
    );
  };

  // Subscribe to our source observable.
  source.subscribe(
    createOperatorSubscriber(subscriber, outerNext, () => {
      // Outer completed, make a note of it, and check to see if we can complete everything.
      isComplete = true;
      checkComplete();
    })
  );

  // Additional finalization (for when the destination is torn down).
  // Other finalization is added implicitly via subscription above.
  return () => {
    additionalFinalizer?.();
  };
}
import { ObservableInput, OperatorFunction, ObservedValueOf } from '../types';
import { map } from './map';
import { innerFrom } from '../observable/innerFrom';
import { operate } from '../util/lift';
import { mergeInternals } from './mergeInternals';
import { isFunction } from '../util/isFunction';

/* tslint:disable:max-line-length */
export function mergeMap<T, O extends ObservableInput<any>>(
  project: (value: T, index: number) => O,
  concurrent?: number
): OperatorFunction<T, ObservedValueOf<O>>;
/** @deprecated The `resultSelector` parameter will be removed in v8. Use an inner `map` instead. Details: https://rxjs.dev/deprecations/resultSelector */
export function mergeMap<T, O extends ObservableInput<any>>(
  project: (value: T, index: number) => O,
  resultSelector: undefined,
  concurrent?: number
): OperatorFunction<T, ObservedValueOf<O>>;
/** @deprecated The `resultSelector` parameter will be removed in v8. Use an inner `map` instead. Details: https://rxjs.dev/deprecations/resultSelector */
export function mergeMap<T, R, O extends ObservableInput<any>>(
  project: (value: T, index: number) => O,
  resultSelector: (outerValue: T, innerValue: ObservedValueOf<O>, outerIndex: number, innerIndex: number) => R,
  concurrent?: number
): OperatorFunction<T, R>;
/* tslint:enable:max-line-length */

/**
 * Projects each source value to an Observable which is merged in the output
 * Observable.
 *
 * <span class="informal">Maps each value to an Observable, then flattens all of
 * these inner Observables using {@link mergeAll}.</span>
 *
 * ![](mergeMap.png)
 *
 * Returns an Observable that emits items based on applying a function that you
 * supply to each item emitted by the source Observable, where that function
 * returns an Observable, and then merging those resulting Observables and
 * emitting the results of this merger.
 *
 * ## Example
 *
 * Map and flatten each letter to an Observable ticking every 1 second
 *
 * ```ts
 * import { of, mergeMap, interval, map } from 'rxjs';
 *
 * const letters = of('a', 'b', 'c');
 * const result = letters.pipe(
 *   mergeMap(x => interval(1000).pipe(map(i => x + i)))
 * );
 *
 * result.subscribe(x => console.log(x));
 *
 * // Results in the following:
 * // a0
 * // b0
 * // c0
 * // a1
 * // b1
 * // c1
 * // continues to list a, b, c every second with respective ascending integers
 * ```
 *
 * @see {@link concatMap}
 * @see {@link exhaustMap}
 * @see {@link merge}
 * @see {@link mergeAll}
 * @see {@link mergeMapTo}
 * @see {@link mergeScan}
 * @see {@link switchMap}
 *
 * @param {function(value: T, ?index: number): ObservableInput} project A function
 * that, when applied to an item emitted by the source Observable, returns an
 * Observable.
 * @param {number} [concurrent=Infinity] Maximum number of input
 * Observables being subscribed to concurrently.
 * @return A function that returns an Observable that emits the result of
 * applying the projection function (and the optional deprecated
 * `resultSelector`) to each item emitted by the source Observable and merging
 * the results of the Observables obtained from this transformation.
 */
export function mergeMap<T, R, O extends ObservableInput<any>>(
  project: (value: T, index: number) => O,
  resultSelector?: ((outerValue: T, innerValue: ObservedValueOf<O>, outerIndex: number, innerIndex: number) => R) | number,
  concurrent: number = Infinity
): OperatorFunction<T, ObservedValueOf<O> | R> {
  if (isFunction(resultSelector)) {
    // DEPRECATED PATH
    return mergeMap((a, i) => map((b: any, ii: number) => resultSelector(a, b, i, ii))(innerFrom(project(a, i))), concurrent);
  } else if (typeof resultSelector === 'number') {
    concurrent = resultSelector;
  }

  return operate((source, subscriber) => mergeInternals(source, subscriber, project, concurrent));
}
import { OperatorFunction, ObservedValueOf, ObservableInput } from '../types';
import { mergeMap } from './mergeMap';
import { isFunction } from '../util/isFunction';

/** @deprecated Will be removed in v9. Use {@link mergeMap} instead: `mergeMap(() => result)` */
export function mergeMapTo<O extends ObservableInput<unknown>>(
  innerObservable: O,
  concurrent?: number
): OperatorFunction<unknown, ObservedValueOf<O>>;
/**
 * @deprecated The `resultSelector` parameter will be removed in v8. Use an inner `map` instead.
 * Details: https://rxjs.dev/deprecations/resultSelector
 */
export function mergeMapTo<T, R, O extends ObservableInput<unknown>>(
  innerObservable: O,
  resultSelector: (outerValue: T, innerValue: ObservedValueOf<O>, outerIndex: number, innerIndex: number) => R,
  concurrent?: number
): OperatorFunction<T, R>;
/* tslint:enable:max-line-length */

/**
 * Projects each source value to the same Observable which is merged multiple
 * times in the output Observable.
 *
 * <span class="informal">It's like {@link mergeMap}, but maps each value always
 * to the same inner Observable.</span>
 *
 * ![](mergeMapTo.png)
 *
 * Maps each source value to the given Observable `innerObservable` regardless
 * of the source value, and then merges those resulting Observables into one
 * single Observable, which is the output Observable.
 *
 * ## Example
 *
 * For each click event, start an interval Observable ticking every 1 second
 *
 * ```ts
 * import { fromEvent, mergeMapTo, interval } from 'rxjs';
 *
 * const clicks = fromEvent(document, 'click');
 * const result = clicks.pipe(mergeMapTo(interval(1000)));
 *
 * result.subscribe(x => console.log(x));
 * ```
 *
 * @see {@link concatMapTo}
 * @see {@link merge}
 * @see {@link mergeAll}
 * @see {@link mergeMap}
 * @see {@link mergeScan}
 * @see {@link switchMapTo}
 *
 * @param {ObservableInput} innerObservable An Observable to replace each value from
 * the source Observable.
 * @param {number} [concurrent=Infinity] Maximum number of input
 * Observables being subscribed to concurrently.
 * @return A function that returns an Observable that emits items from the
 * given `innerObservable`.
 * @deprecated Will be removed in v9. Use {@link mergeMap} instead: `mergeMap(() => result)`
 */
export function mergeMapTo<T, R, O extends ObservableInput<unknown>>(
  innerObservable: O,
  resultSelector?: ((outerValue: T, innerValue: ObservedValueOf<O>, outerIndex: number, innerIndex: number) => R) | number,
  concurrent: number = Infinity
): OperatorFunction<T, ObservedValueOf<O> | R> {
  if (isFunction(resultSelector)) {
    return mergeMap(() => innerObservable, resultSelector, concurrent);
  }
  if (typeof resultSelector === 'number') {
    concurrent = resultSelector;
  }
  return mergeMap(() => innerObservable, concurrent);
}
import { ObservableInput, OperatorFunction } from '../types';
import { operate } from '../util/lift';
import { mergeInternals } from './mergeInternals';

/**
 * Applies an accumulator function over the source Observable where the
 * accumulator function itself returns an Observable, then each intermediate
 * Observable returned is merged into the output Observable.
 *
 * <span class="informal">It's like {@link scan}, but the Observables returned
 * by the accumulator are merged into the outer Observable.</span>
 *
 * The first parameter of the `mergeScan` is an `accumulator` function which is
 * being called every time the source Observable emits a value. `mergeScan` will
 * subscribe to the value returned by the `accumulator` function and will emit
 * values to the subscriber emitted by inner Observable.
 *
 * The `accumulator` function is being called with three parameters passed to it:
 * `acc`, `value` and `index`. The `acc` parameter is used as the state parameter
 * whose value is initially set to the `seed` parameter (the second parameter
 * passed to the `mergeScan` operator).
 *
 * `mergeScan` internally keeps the value of the `acc` parameter: as long as the
 * source Observable emits without inner Observable emitting, the `acc` will be
 * set to `seed`. The next time the inner Observable emits a value, `mergeScan`
 * will internally remember it and it will be passed to the `accumulator`
 * function as `acc` parameter the next time source emits.
 *
 * The `value` parameter of the `accumulator` function is the value emitted by the
 * source Observable, while the `index` is a number which represent the order of the
 * current emission by the source Observable. It starts with 0.
 *
 * The last parameter to the `mergeScan` is the `concurrent` value which defaults
 * to Infinity. It represents the maximum number of inner Observable subscriptions
 * at a time.
 *
 * ## Example
 *
 * Count the number of click events
 *
 * ```ts
 * import { fromEvent, map, mergeScan, of } from 'rxjs';
 *
 * const click$ = fromEvent(document, 'click');
 * const one$ = click$.pipe(map(() => 1));
 * const seed = 0;
 * const count$ = one$.pipe(
 *   mergeScan((acc, one) => of(acc + one), seed)
 * );
 *
 * count$.subscribe(x => console.log(x));
 *
 * // Results:
 * // 1
 * // 2
 * // 3
 * // 4
 * // ...and so on for each click
 * ```
 *
 * @see {@link scan}
 * @see {@link switchScan}
 *
 * @param {function(acc: R, value: T): Observable<R>} accumulator
 * The accumulator function called on each source value.
 * @param seed The initial accumulation value.
 * @param {number} [concurrent=Infinity] Maximum number of
 * input Observables being subscribed to concurrently.
 * @return A function that returns an Observable of the accumulated values.
 */
export function mergeScan<T, R>(
  accumulator: (acc: R, value: T, index: number) => ObservableInput<R>,
  seed: R,
  concurrent = Infinity
): OperatorFunction<T, R> {
  return operate((source, subscriber) => {
    // The accumulated state.
    let state = seed;

    return mergeInternals(
      source,
      subscriber,
      (value, index) => accumulator(state, value, index),
      concurrent,
      (value) => {
        state = value;
      },
      false,
      undefined,
      () => (state = null!)
    );
  });
}
import { ObservableInputTuple, OperatorFunction } from '../types';
import { merge } from './merge';

/**
 * Merge the values from all observables to a single observable result.
 *
 * Creates an observable, that when subscribed to, subscribes to the source
 * observable, and all other sources provided as arguments. All values from
 * every source are emitted from the resulting subscription.
 *
 * When all sources complete, the resulting observable will complete.
 *
 * When any source errors, the resulting observable will error.
 *
 * ## Example
 *
 * Joining all outputs from multiple user input event streams
 *
 * ```ts
 * import { fromEvent, map, mergeWith } from 'rxjs';
 *
 * const clicks$ = fromEvent(document, 'click').pipe(map(() => 'click'));
 * const mousemoves$ = fromEvent(document, 'mousemove').pipe(map(() => 'mousemove'));
 * const dblclicks$ = fromEvent(document, 'dblclick').pipe(map(() => 'dblclick'));
 *
 * mousemoves$
 *   .pipe(mergeWith(clicks$, dblclicks$))
 *   .subscribe(x => console.log(x));
 *
 * // result (assuming user interactions)
 * // 'mousemove'
 * // 'mousemove'
 * // 'mousemove'
 * // 'click'
 * // 'click'
 * // 'dblclick'
 * ```
 *
 * @see {@link merge}
 *
 * @param otherSources the sources to combine the current source with.
 * @return A function that returns an Observable that merges the values from
 * all given Observables.
 */
export function mergeWith<T, A extends readonly unknown[]>(
  ...otherSources: [...ObservableInputTuple<A>]
): OperatorFunction<T, T | A[number]> {
  return merge(...otherSources);
}
import { reduce } from './reduce';
import { MonoTypeOperatorFunction } from '../types';
import { isFunction } from '../util/isFunction';

/**
 * The Min operator operates on an Observable that emits numbers (or items that can be compared with a provided function),
 * and when source Observable completes it emits a single item: the item with the smallest value.
 *
 * ![](min.png)
 *
 * ## Examples
 *
 * Get the minimal value of a series of numbers
 *
 * ```ts
 * import { of, min } from 'rxjs';
 *
 * of(5, 4, 7, 2, 8)
 *   .pipe(min())
 *   .subscribe(x => console.log(x));
 *
 * // Outputs
 * // 2
 * ```
 *
 * Use a comparer function to get the minimal item
 *
 * ```ts
 * import { of, min } from 'rxjs';
 *
 * of(
 *   { age: 7, name: 'Foo' },
 *   { age: 5, name: 'Bar' },
 *   { age: 9, name: 'Beer' }
 * ).pipe(
 *   min((a, b) => a.age < b.age ? -1 : 1)
 * )
 * .subscribe(x => console.log(x.name));
 *
 * // Outputs
 * // 'Bar'
 * ```
 *
 * @see {@link max}
 *
 * @param {Function} [comparer] - Optional comparer function that it will use instead of its default to compare the
 * value of two items.
 * @return A function that returns an Observable that emits item with the
 * smallest value.
 */
export function min<T>(comparer?: (x: T, y: T) => number): MonoTypeOperatorFunction<T> {
  return reduce(isFunction(comparer) ? (x, y) => (comparer(x, y) < 0 ? x : y) : (x, y) => (x < y ? x : y));
}
import { Subject } from '../Subject';
import { Observable } from '../Observable';
import { ConnectableObservable } from '../observable/ConnectableObservable';
import { OperatorFunction, UnaryFunction, ObservedValueOf, ObservableInput } from '../types';
import { isFunction } from '../util/isFunction';
import { connect } from './connect';

/**
 * An operator that creates a {@link ConnectableObservable}, that when connected,
 * with the `connect` method, will use the provided subject to multicast the values
 * from the source to all consumers.
 *
 * @param subject The subject to multicast through.
 * @return A function that returns a {@link ConnectableObservable}
 * @deprecated Will be removed in v8. To create a connectable observable, use {@link connectable}.
 * If you're using {@link refCount} after `multicast`, use the {@link share} operator instead.
 * `multicast(subject), refCount()` is equivalent to
 * `share({ connector: () => subject, resetOnError: false, resetOnComplete: false, resetOnRefCountZero: false })`.
 * Details: https://rxjs.dev/deprecations/multicasting
 */
export function multicast<T>(subject: Subject<T>): UnaryFunction<Observable<T>, ConnectableObservable<T>>;

/**
 * Because this is deprecated in favor of the {@link connect} operator, and was otherwise poorly documented,
 * rather than duplicate the effort of documenting the same behavior, please see documentation for the
 * {@link connect} operator.
 *
 * @param subject The subject used to multicast.
 * @param selector A setup function to setup the multicast
 * @return A function that returns an observable that mirrors the observable returned by the selector.
 * @deprecated Will be removed in v8. Use the {@link connect} operator instead.
 * `multicast(subject, selector)` is equivalent to
 * `connect(selector, { connector: () => subject })`.
 * Details: https://rxjs.dev/deprecations/multicasting
 */
export function multicast<T, O extends ObservableInput<any>>(
  subject: Subject<T>,
  selector: (shared: Observable<T>) => O
): OperatorFunction<T, ObservedValueOf<O>>;

/**
 * An operator that creates a {@link ConnectableObservable}, that when connected,
 * with the `connect` method, will use the provided subject to multicast the values
 * from the source to all consumers.
 *
 * @param subjectFactory A factory that will be called to create the subject. Passing a function here
 * will cause the underlying subject to be "reset" on error, completion, or refCounted unsubscription of
 * the source.
 * @return A function that returns a {@link ConnectableObservable}
 * @deprecated Will be removed in v8. To create a connectable observable, use {@link connectable}.
 * If you're using {@link refCount} after `multicast`, use the {@link share} operator instead.
 * `multicast(() => new BehaviorSubject('test')), refCount()` is equivalent to
 * `share({ connector: () => new BehaviorSubject('test') })`.
 * Details: https://rxjs.dev/deprecations/multicasting
 */
export function multicast<T>(subjectFactory: () => Subject<T>): UnaryFunction<Observable<T>, ConnectableObservable<T>>;

/**
 * Because this is deprecated in favor of the {@link connect} operator, and was otherwise poorly documented,
 * rather than duplicate the effort of documenting the same behavior, please see documentation for the
 * {@link connect} operator.
 *
 * @param subjectFactory A factory that creates the subject used to multicast.
 * @param selector A function to setup the multicast and select the output.
 * @return A function that returns an observable that mirrors the observable returned by the selector.
 * @deprecated Will be removed in v8. Use the {@link connect} operator instead.
 * `multicast(subjectFactory, selector)` is equivalent to
 * `connect(selector, { connector: subjectFactory })`.
 * Details: https://rxjs.dev/deprecations/multicasting
 */
export function multicast<T, O extends ObservableInput<any>>(
  subjectFactory: () => Subject<T>,
  selector: (shared: Observable<T>) => O
): OperatorFunction<T, ObservedValueOf<O>>;

/**
 * @deprecated Will be removed in v8. Use the {@link connectable} observable, the {@link connect} operator or the
 * {@link share} operator instead. See the overloads below for equivalent replacement examples of this operator's
 * behaviors.
 * Details: https://rxjs.dev/deprecations/multicasting
 */
export function multicast<T, R>(
  subjectOrSubjectFactory: Subject<T> | (() => Subject<T>),
  selector?: (source: Observable<T>) => Observable<R>
): OperatorFunction<T, R> {
  const subjectFactory = isFunction(subjectOrSubjectFactory) ? subjectOrSubjectFactory : () => subjectOrSubjectFactory;

  if (isFunction(selector)) {
    // If a selector function is provided, then we're a "normal" operator that isn't
    // going to return a ConnectableObservable. We can use `connect` to do what we
    // need to do.
    return connect(selector, {
      connector: subjectFactory,
    });
  }

  return (source: Observable<T>) => new ConnectableObservable<any>(source, subjectFactory);
}
/** @prettier */
import { MonoTypeOperatorFunction, SchedulerLike } from '../types';
import { executeSchedule } from '../util/executeSchedule';
import { operate } from '../util/lift';
import { createOperatorSubscriber } from './OperatorSubscriber';

/**
 * Re-emits all notifications from source Observable with specified scheduler.
 *
 * <span class="informal">Ensure a specific scheduler is used, from outside of an Observable.</span>
 *
 * `observeOn` is an operator that accepts a scheduler as a first parameter, which will be used to reschedule
 * notifications emitted by the source Observable. It might be useful, if you do not have control over
 * internal scheduler of a given Observable, but want to control when its values are emitted nevertheless.
 *
 * Returned Observable emits the same notifications (nexted values, complete and error events) as the source Observable,
 * but rescheduled with provided scheduler. Note that this doesn't mean that source Observables internal
 * scheduler will be replaced in any way. Original scheduler still will be used, but when the source Observable emits
 * notification, it will be immediately scheduled again - this time with scheduler passed to `observeOn`.
 * An anti-pattern would be calling `observeOn` on Observable that emits lots of values synchronously, to split
 * that emissions into asynchronous chunks. For this to happen, scheduler would have to be passed into the source
 * Observable directly (usually into the operator that creates it). `observeOn` simply delays notifications a
 * little bit more, to ensure that they are emitted at expected moments.
 *
 * As a matter of fact, `observeOn` accepts second parameter, which specifies in milliseconds with what delay notifications
 * will be emitted. The main difference between {@link delay} operator and `observeOn` is that `observeOn`
 * will delay all notifications - including error notifications - while `delay` will pass through error
 * from source Observable immediately when it is emitted. In general it is highly recommended to use `delay` operator
 * for any kind of delaying of values in the stream, while using `observeOn` to specify which scheduler should be used
 * for notification emissions in general.
 *
 * ## Example
 *
 * Ensure values in subscribe are called just before browser repaint
 *
 * ```ts
 * import { interval, observeOn, animationFrameScheduler } from 'rxjs';
 *
 * const someDiv = document.createElement('div');
 * someDiv.style.cssText = 'width: 200px;background: #09c';
 * document.body.appendChild(someDiv);
 * const intervals = interval(10);      // Intervals are scheduled
 *                                      // with async scheduler by default...
 * intervals.pipe(
 *   observeOn(animationFrameScheduler) // ...but we will observe on animationFrame
 * )                                    // scheduler to ensure smooth animation.
 * .subscribe(val => {
 *   someDiv.style.height = val + 'px';
 * });
 * ```
 *
 * @see {@link delay}
 *
 * @param scheduler Scheduler that will be used to reschedule notifications from source Observable.
 * @param delay Number of milliseconds that states with what delay every notification should be rescheduled.
 * @return A function that returns an Observable that emits the same
 * notifications as the source Observable, but with provided scheduler.
 */
export function observeOn<T>(scheduler: SchedulerLike, delay = 0): MonoTypeOperatorFunction<T> {
  return operate((source, subscriber) => {
    source.subscribe(
      createOperatorSubscriber(
        subscriber,
        (value) => executeSchedule(subscriber, scheduler, () => subscriber.next(value), delay),
        () => executeSchedule(subscriber, scheduler, () => subscriber.complete(), delay),
        (err) => executeSchedule(subscriber, scheduler, () => subscriber.error(err), delay)
      )
    );
  });
}
import { Observable } from '../Observable';
import { ObservableInputTuple, OperatorFunction } from '../types';
import { operate } from '../util/lift';
import { innerFrom } from '../observable/innerFrom';
import { argsOrArgArray } from '../util/argsOrArgArray';
import { createOperatorSubscriber } from './OperatorSubscriber';
import { noop } from '../util/noop';

export function onErrorResumeNext<T, A extends readonly unknown[]>(
  sources: [...ObservableInputTuple<A>]
): OperatorFunction<T, T | A[number]>;
export function onErrorResumeNext<T, A extends readonly unknown[]>(
  ...sources: [...ObservableInputTuple<A>]
): OperatorFunction<T, T | A[number]>;

/**
 * When any of the provided Observable emits an complete or error notification, it immediately subscribes to the next one
 * that was passed.
 *
 * <span class="informal">Execute series of Observables, subscribes to next one on error or complete.</span>
 *
 * ![](onErrorResumeNext.png)
 *
 * `onErrorResumeNext` is an operator that accepts a series of Observables, provided either directly as
 * arguments or as an array. If no single Observable is provided, returned Observable will simply behave the same
 * as the source.
 *
 * `onErrorResumeNext` returns an Observable that starts by subscribing and re-emitting values from the source Observable.
 * When its stream of values ends - no matter if Observable completed or emitted an error - `onErrorResumeNext`
 * will subscribe to the first Observable that was passed as an argument to the method. It will start re-emitting
 * its values as well and - again - when that stream ends, `onErrorResumeNext` will proceed to subscribing yet another
 * Observable in provided series, no matter if previous Observable completed or ended with an error. This will
 * be happening until there is no more Observables left in the series, at which point returned Observable will
 * complete - even if the last subscribed stream ended with an error.
 *
 * `onErrorResumeNext` can be therefore thought of as version of {@link concat} operator, which is more permissive
 * when it comes to the errors emitted by its input Observables. While `concat` subscribes to the next Observable
 * in series only if previous one successfully completed, `onErrorResumeNext` subscribes even if it ended with
 * an error.
 *
 * Note that you do not get any access to errors emitted by the Observables. In particular do not
 * expect these errors to appear in error callback passed to {@link Observable#subscribe}. If you want to take
 * specific actions based on what error was emitted by an Observable, you should try out {@link catchError} instead.
 *
 *
 * ## Example
 *
 * Subscribe to the next Observable after map fails
 *
 * ```ts
 * import { of, onErrorResumeNext, map } from 'rxjs';
 *
 * of(1, 2, 3, 0)
 *   .pipe(
 *     map(x => {
 *       if (x === 0) {
 *         throw Error();
 *       }
 *
 *       return 10 / x;
 *     }),
 *     onErrorResumeNext(of(1, 2, 3))
 *   )
 *   .subscribe({
 *     next: val => console.log(val),
 *     error: err => console.log(err),          // Will never be called.
 *     complete: () => console.log('that\'s it!')
 *   });
 *
 * // Logs:
 * // 10
 * // 5
 * // 3.3333333333333335
 * // 1
 * // 2
 * // 3
 * // 'that's it!'
 * ```
 *
 * @see {@link concat}
 * @see {@link catchError}
 *
 * @param {...ObservableInput} sources Observables passed either directly or as an array.
 * @return A function that returns an Observable that emits values from source
 * Observable, but - if it errors - subscribes to the next passed Observable
 * and so on, until it completes or runs out of Observables.
 */
export function onErrorResumeNext<T, A extends readonly unknown[]>(
  ...sources: [[...ObservableInputTuple<A>]] | [...ObservableInputTuple<A>]
): OperatorFunction<T, T | A[number]> {
  // For some reason, TS 4.1 RC gets the inference wrong here and infers the
  // result to be `A[number][]` - completely dropping the ObservableInput part
  // of the type. This makes no sense whatsoever. As a workaround, the type is
  // asserted explicitly.
  const nextSources = argsOrArgArray(sources) as unknown as ObservableInputTuple<A>;

  return operate((source, subscriber) => {
    const remaining = [source, ...nextSources];
    const subscribeNext = () => {
      if (!subscriber.closed) {
        if (remaining.length > 0) {
          let nextSource: Observable<A[number]>;
          try {
            nextSource = innerFrom(remaining.shift()!);
          } catch (err) {
            subscribeNext();
            return;
          }

          // Here we have to use one of our Subscribers, or it does not wire up
          // The `closed` property of upstream Subscribers synchronously, that
          // would result in situation were we could not stop a synchronous firehose
          // with something like `take(3)`.
          const innerSub = createOperatorSubscriber(subscriber, undefined, noop, noop);
          nextSource.subscribe(innerSub);
          innerSub.add(subscribeNext);
        } else {
          subscriber.complete();
        }
      }
    };

    subscribeNext();
  });
}
import { OperatorFunction } from '../types';
import { operate } from '../util/lift';
import { createOperatorSubscriber } from './OperatorSubscriber';

/**
 * Groups pairs of consecutive emissions together and emits them as an array of
 * two values.
 *
 * <span class="informal">Puts the current value and previous value together as
 * an array, and emits that.</span>
 *
 * ![](pairwise.png)
 *
 * The Nth emission from the source Observable will cause the output Observable
 * to emit an array [(N-1)th, Nth] of the previous and the current value, as a
 * pair. For this reason, `pairwise` emits on the second and subsequent
 * emissions from the source Observable, but not on the first emission, because
 * there is no previous value in that case.
 *
 * ## Example
 *
 * On every click (starting from the second), emit the relative distance to the previous click
 *
 * ```ts
 * import { fromEvent, pairwise, map } from 'rxjs';
 *
 * const clicks = fromEvent<PointerEvent>(document, 'click');
 * const pairs = clicks.pipe(pairwise());
 * const distance = pairs.pipe(
 *   map(([first, second]) => {
 *     const x0 = first.clientX;
 *     const y0 = first.clientY;
 *     const x1 = second.clientX;
 *     const y1 = second.clientY;
 *     return Math.sqrt(Math.pow(x0 - x1, 2) + Math.pow(y0 - y1, 2));
 *   })
 * );
 *
 * distance.subscribe(x => console.log(x));
 * ```
 *
 * @see {@link buffer}
 * @see {@link bufferCount}
 *
 * @return A function that returns an Observable of pairs (as arrays) of
 * consecutive values from the source Observable.
 */
export function pairwise<T>(): OperatorFunction<T, [T, T]> {
  return operate((source, subscriber) => {
    let prev: T;
    let hasPrev = false;
    source.subscribe(
      createOperatorSubscriber(subscriber, (value) => {
        const p = prev;
        prev = value;
        hasPrev && subscriber.next([p, value]);
        hasPrev = true;
      })
    );
  });
}
import { not } from '../util/not';
import { filter } from './filter';
import { Observable } from '../Observable';
import { UnaryFunction } from '../types';

/**
 * Splits the source Observable into two, one with values that satisfy a
 * predicate, and another with values that don't satisfy the predicate.
 *
 * <span class="informal">It's like {@link filter}, but returns two Observables:
 * one like the output of {@link filter}, and the other with values that did not
 * pass the condition.</span>
 *
 * ![](partition.png)
 *
 * `partition` outputs an array with two Observables that partition the values
 * from the source Observable through the given `predicate` function. The first
 * Observable in that array emits source values for which the predicate argument
 * returns true. The second Observable emits source values for which the
 * predicate returns false. The first behaves like {@link filter} and the second
 * behaves like {@link filter} with the predicate negated.
 *
 * ## Example
 *
 * Partition click events into those on DIV elements and those elsewhere
 *
 * ```ts
 * import { fromEvent } from 'rxjs';
 * import { partition } from 'rxjs/operators';
 *
 * const div = document.createElement('div');
 * div.style.cssText = 'width: 200px; height: 200px; background: #09c;';
 * document.body.appendChild(div);
 *
 * const clicks = fromEvent(document, 'click');
 * const [clicksOnDivs, clicksElsewhere] = clicks.pipe(partition(ev => (<HTMLElement>ev.target).tagName === 'DIV'));
 *
 * clicksOnDivs.subscribe(x => console.log('DIV clicked: ', x));
 * clicksElsewhere.subscribe(x => console.log('Other clicked: ', x));
 * ```
 *
 * @see {@link filter}
 *
 * @param {function(value: T, index: number): boolean} predicate A function that
 * evaluates each value emitted by the source Observable. If it returns `true`,
 * the value is emitted on the first Observable in the returned array, if
 * `false` the value is emitted on the second Observable in the array. The
 * `index` parameter is the number `i` for the i-th source emission that has
 * happened since the subscription, starting from the number `0`.
 * @param {any} [thisArg] An optional argument to determine the value of `this`
 * in the `predicate` function.
 * @return A function that returns an array with two Observables: one with
 * values that passed the predicate, and another with values that did not pass
 * the predicate.
 * @deprecated Replaced with the `partition` static creation function. Will be removed in v8.
 */
export function partition<T>(
  predicate: (value: T, index: number) => boolean,
  thisArg?: any
): UnaryFunction<Observable<T>, [Observable<T>, Observable<T>]> {
  return (source: Observable<T>) =>
    [filter(predicate, thisArg)(source), filter(not(predicate, thisArg))(source)] as [Observable<T>, Observable<T>];
}
import { map } from './map';
import { OperatorFunction } from '../types';

/* tslint:disable:max-line-length */
/** @deprecated Use {@link map} and optional chaining: `pluck('foo', 'bar')` is `map(x => x?.foo?.bar)`. Will be removed in v8. */
export function pluck<T, K1 extends keyof T>(k1: K1): OperatorFunction<T, T[K1]>;
/** @deprecated Use {@link map} and optional chaining: `pluck('foo', 'bar')` is `map(x => x?.foo?.bar)`. Will be removed in v8. */
export function pluck<T, K1 extends keyof T, K2 extends keyof T[K1]>(k1: K1, k2: K2): OperatorFunction<T, T[K1][K2]>;
/** @deprecated Use {@link map} and optional chaining: `pluck('foo', 'bar')` is `map(x => x?.foo?.bar)`. Will be removed in v8. */
export function pluck<T, K1 extends keyof T, K2 extends keyof T[K1], K3 extends keyof T[K1][K2]>(
  k1: K1,
  k2: K2,
  k3: K3
): OperatorFunction<T, T[K1][K2][K3]>;
/** @deprecated Use {@link map} and optional chaining: `pluck('foo', 'bar')` is `map(x => x?.foo?.bar)`. Will be removed in v8. */
export function pluck<T, K1 extends keyof T, K2 extends keyof T[K1], K3 extends keyof T[K1][K2], K4 extends keyof T[K1][K2][K3]>(
  k1: K1,
  k2: K2,
  k3: K3,
  k4: K4
): OperatorFunction<T, T[K1][K2][K3][K4]>;
/** @deprecated Use {@link map} and optional chaining: `pluck('foo', 'bar')` is `map(x => x?.foo?.bar)`. Will be removed in v8. */
export function pluck<
  T,
  K1 extends keyof T,
  K2 extends keyof T[K1],
  K3 extends keyof T[K1][K2],
  K4 extends keyof T[K1][K2][K3],
  K5 extends keyof T[K1][K2][K3][K4]
>(k1: K1, k2: K2, k3: K3, k4: K4, k5: K5): OperatorFunction<T, T[K1][K2][K3][K4][K5]>;
/** @deprecated Use {@link map} and optional chaining: `pluck('foo', 'bar')` is `map(x => x?.foo?.bar)`. Will be removed in v8. */
export function pluck<
  T,
  K1 extends keyof T,
  K2 extends keyof T[K1],
  K3 extends keyof T[K1][K2],
  K4 extends keyof T[K1][K2][K3],
  K5 extends keyof T[K1][K2][K3][K4],
  K6 extends keyof T[K1][K2][K3][K4][K5]
>(k1: K1, k2: K2, k3: K3, k4: K4, k5: K5, k6: K6): OperatorFunction<T, T[K1][K2][K3][K4][K5][K6]>;
/** @deprecated Use {@link map} and optional chaining: `pluck('foo', 'bar')` is `map(x => x?.foo?.bar)`. Will be removed in v8. */
export function pluck<
  T,
  K1 extends keyof T,
  K2 extends keyof T[K1],
  K3 extends keyof T[K1][K2],
  K4 extends keyof T[K1][K2][K3],
  K5 extends keyof T[K1][K2][K3][K4],
  K6 extends keyof T[K1][K2][K3][K4][K5]
>(k1: K1, k2: K2, k3: K3, k4: K4, k5: K5, k6: K6, ...rest: string[]): OperatorFunction<T, unknown>;
/** @deprecated Use {@link map} and optional chaining: `pluck('foo', 'bar')` is `map(x => x?.foo?.bar)`. Will be removed in v8. */
export function pluck<T>(...properties: string[]): OperatorFunction<T, unknown>;
/* tslint:enable:max-line-length */

/**
 * Maps each source value to its specified nested property.
 *
 * <span class="informal">Like {@link map}, but meant only for picking one of
 * the nested properties of every emitted value.</span>
 *
 * ![](pluck.png)
 *
 * Given a list of strings or numbers describing a path to a property, retrieves
 * the value of a specified nested property from all values in the source
 * Observable. If a property can't be resolved, it will return `undefined` for
 * that value.
 *
 * ## Example
 *
 * Map every click to the tagName of the clicked target element
 *
 * ```ts
 * import { fromEvent, pluck } from 'rxjs';
 *
 * const clicks = fromEvent(document, 'click');
 * const tagNames = clicks.pipe(pluck('target', 'tagName'));
 *
 * tagNames.subscribe(x => console.log(x));
 * ```
 *
 * @see {@link map}
 *
 * @param properties The nested properties to pluck from each source
 * value.
 * @return A function that returns an Observable of property values from the
 * source values.
 * @deprecated Use {@link map} and optional chaining: `pluck('foo', 'bar')` is `map(x => x?.foo?.bar)`. Will be removed in v8.
 */
export function pluck<T, R>(...properties: Array<string | number | symbol>): OperatorFunction<T, R> {
  const length = properties.length;
  if (length === 0) {
    throw new Error('list of properties cannot be empty.');
  }
  return map((x) => {
    let currentProp: any = x;
    for (let i = 0; i < length; i++) {
      const p = currentProp?.[properties[i]];
      if (typeof p !== 'undefined') {
        currentProp = p;
      } else {
        return undefined;
      }
    }
    return currentProp;
  });
}
import { Observable } from '../Observable';
import { Subject } from '../Subject';
import { multicast } from './multicast';
import { ConnectableObservable } from '../observable/ConnectableObservable';
import { MonoTypeOperatorFunction, OperatorFunction, UnaryFunction, ObservableInput, ObservedValueOf } from '../types';
import { connect } from './connect';

/**
 * Returns a connectable observable that, when connected, will multicast
 * all values through a single underlying {@link Subject} instance.
 *
 * @deprecated Will be removed in v8. To create a connectable observable, use {@link connectable}.
 * `source.pipe(publish())` is equivalent to
 * `connectable(source, { connector: () => new Subject(), resetOnDisconnect: false })`.
 * If you're using {@link refCount} after `publish`, use {@link share} operator instead.
 * `source.pipe(publish(), refCount())` is equivalent to
 * `source.pipe(share({ resetOnError: false, resetOnComplete: false, resetOnRefCountZero: false }))`.
 * Details: https://rxjs.dev/deprecations/multicasting
 */
export function publish<T>(): UnaryFunction<Observable<T>, ConnectableObservable<T>>;

/**
 * Returns an observable, that when subscribed to, creates an underlying {@link Subject},
 * provides an observable view of it to a `selector` function, takes the observable result of
 * that selector function and subscribes to it, sending its values to the consumer, _then_ connects
 * the subject to the original source.
 *
 * @param selector A function used to setup multicasting prior to automatic connection.
 *
 * @deprecated Will be removed in v8. Use the {@link connect} operator instead.
 * `publish(selector)` is equivalent to `connect(selector)`.
 * Details: https://rxjs.dev/deprecations/multicasting
 */
export function publish<T, O extends ObservableInput<any>>(selector: (shared: Observable<T>) => O): OperatorFunction<T, ObservedValueOf<O>>;

/**
 * Returns a ConnectableObservable, which is a variety of Observable that waits until its connect method is called
 * before it begins emitting items to those Observers that have subscribed to it.
 *
 * <span class="informal">Makes a cold Observable hot</span>
 *
 * ![](publish.png)
 *
 * ## Examples
 *
 * Make `source$` hot by applying `publish` operator, then merge each inner observable into a single one
 * and subscribe
 *
 * ```ts
 * import { zip, interval, of, map, publish, merge, tap } from 'rxjs';
 *
 * const source$ = zip(interval(2000), of(1, 2, 3, 4, 5, 6, 7, 8, 9))
 *   .pipe(map(([, number]) => number));
 *
 * source$
 *   .pipe(
 *     publish(multicasted$ =>
 *       merge(
 *         multicasted$.pipe(tap(x => console.log('Stream 1:', x))),
 *         multicasted$.pipe(tap(x => console.log('Stream 2:', x))),
 *         multicasted$.pipe(tap(x => console.log('Stream 3:', x)))
 *       )
 *     )
 *   )
 *   .subscribe();
 *
 * // Results every two seconds
 * // Stream 1: 1
 * // Stream 2: 1
 * // Stream 3: 1
 * // ...
 * // Stream 1: 9
 * // Stream 2: 9
 * // Stream 3: 9
 * ```
 *
 * @see {@link publishLast}
 * @see {@link publishReplay}
 * @see {@link publishBehavior}
 *
 * @param {Function} [selector] - Optional selector function which can use the multicasted source sequence as many times
 * as needed, without causing multiple subscriptions to the source sequence.
 * Subscribers to the given source will receive all notifications of the source from the time of the subscription on.
 * @return A function that returns a ConnectableObservable that upon connection
 * causes the source Observable to emit items to its Observers.
 * @deprecated Will be removed in v8. Use the {@link connectable} observable, the {@link connect} operator or the
 * {@link share} operator instead. See the overloads below for equivalent replacement examples of this operator's
 * behaviors.
 * Details: https://rxjs.dev/deprecations/multicasting
 */
export function publish<T, R>(selector?: OperatorFunction<T, R>): MonoTypeOperatorFunction<T> | OperatorFunction<T, R> {
  return selector ? (source) => connect(selector)(source) : (source) => multicast(new Subject<T>())(source);
}
import { Observable } from '../Observable';
import { BehaviorSubject } from '../BehaviorSubject';
import { ConnectableObservable } from '../observable/ConnectableObservable';
import { UnaryFunction } from '../types';

/**
 * Creates a {@link ConnectableObservable} that utilizes a {@link BehaviorSubject}.
 *
 * @param initialValue The initial value passed to the {@link BehaviorSubject}.
 * @return A function that returns a {@link ConnectableObservable}
 * @deprecated Will be removed in v8. To create a connectable observable that uses a
 * {@link BehaviorSubject} under the hood, use {@link connectable}.
 * `source.pipe(publishBehavior(initValue))` is equivalent to
 * `connectable(source, { connector: () => new BehaviorSubject(initValue), resetOnDisconnect: false })`.
 * If you're using {@link refCount} after `publishBehavior`, use the {@link share} operator instead.
 * `source.pipe(publishBehavior(initValue), refCount())` is equivalent to
 * `source.pipe(share({ connector: () => new BehaviorSubject(initValue), resetOnError: false, resetOnComplete: false, resetOnRefCountZero: false  }))`.
 * Details: https://rxjs.dev/deprecations/multicasting
 */
export function publishBehavior<T>(initialValue: T): UnaryFunction<Observable<T>, ConnectableObservable<T>> {
  // Note that this has *never* supported the selector function.
  return (source) => {
    const subject = new BehaviorSubject<T>(initialValue);
    return new ConnectableObservable(source, () => subject);
  };
}
import { Observable } from '../Observable';
import { AsyncSubject } from '../AsyncSubject';
import { ConnectableObservable } from '../observable/ConnectableObservable';
import { UnaryFunction } from '../types';

/**
 * Returns a connectable observable sequence that shares a single subscription to the
 * underlying sequence containing only the last notification.
 *
 * ![](publishLast.png)
 *
 * Similar to {@link publish}, but it waits until the source observable completes and stores
 * the last emitted value.
 * Similarly to {@link publishReplay} and {@link publishBehavior}, this keeps storing the last
 * value even if it has no more subscribers. If subsequent subscriptions happen, they will
 * immediately get that last stored value and complete.
 *
 * ## Example
 *
 * ```ts
 * import { ConnectableObservable, interval, publishLast, tap, take } from 'rxjs';
 *
 * const connectable = <ConnectableObservable<number>>interval(1000)
 *   .pipe(
 *     tap(x => console.log('side effect', x)),
 *     take(3),
 *     publishLast()
 *   );
 *
 * connectable.subscribe({
 *   next: x => console.log('Sub. A', x),
 *   error: err => console.log('Sub. A Error', err),
 *   complete: () => console.log('Sub. A Complete')
 * });
 *
 * connectable.subscribe({
 *   next: x => console.log('Sub. B', x),
 *   error: err => console.log('Sub. B Error', err),
 *   complete: () => console.log('Sub. B Complete')
 * });
 *
 * connectable.connect();
 *
 * // Results:
 * // 'side effect 0'   - after one second
 * // 'side effect 1'   - after two seconds
 * // 'side effect 2'   - after three seconds
 * // 'Sub. A 2'        - immediately after 'side effect 2'
 * // 'Sub. B 2'
 * // 'Sub. A Complete'
 * // 'Sub. B Complete'
 * ```
 *
 * @see {@link ConnectableObservable}
 * @see {@link publish}
 * @see {@link publishReplay}
 * @see {@link publishBehavior}
 *
 * @return A function that returns an Observable that emits elements of a
 * sequence produced by multicasting the source sequence.
 * @deprecated Will be removed in v8. To create a connectable observable with an
 * {@link AsyncSubject} under the hood, use {@link connectable}.
 * `source.pipe(publishLast())` is equivalent to
 * `connectable(source, { connector: () => new AsyncSubject(), resetOnDisconnect: false })`.
 * If you're using {@link refCount} after `publishLast`, use the {@link share} operator instead.
 * `source.pipe(publishLast(), refCount())` is equivalent to
 * `source.pipe(share({ connector: () => new AsyncSubject(), resetOnError: false, resetOnComplete: false, resetOnRefCountZero: false }))`.
 * Details: https://rxjs.dev/deprecations/multicasting
 */
export function publishLast<T>(): UnaryFunction<Observable<T>, ConnectableObservable<T>> {
  // Note that this has *never* supported a selector function like `publish` and `publishReplay`.
  return (source) => {
    const subject = new AsyncSubject<T>();
    return new ConnectableObservable(source, () => subject);
  };
}
import { Observable } from '../Observable';
import { ReplaySubject } from '../ReplaySubject';
import { multicast } from './multicast';
import { MonoTypeOperatorFunction, OperatorFunction, TimestampProvider, ObservableInput, ObservedValueOf } from '../types';
import { isFunction } from '../util/isFunction';

/**
 * Creates a {@link ConnectableObservable} that uses a {@link ReplaySubject}
 * internally.
 *
 * @param bufferSize The buffer size for the underlying {@link ReplaySubject}.
 * @param windowTime The window time for the underlying {@link ReplaySubject}.
 * @param timestampProvider The timestamp provider for the underlying {@link ReplaySubject}.
 * @deprecated Will be removed in v8. To create a connectable observable that uses a
 * {@link ReplaySubject} under the hood, use {@link connectable}.
 * `source.pipe(publishReplay(size, time, scheduler))` is equivalent to
 * `connectable(source, { connector: () => new ReplaySubject(size, time, scheduler), resetOnDisconnect: false })`.
 * If you're using {@link refCount} after `publishReplay`, use the {@link share} operator instead.
 * `publishReplay(size, time, scheduler), refCount()` is equivalent to
 * `share({ connector: () => new ReplaySubject(size, time, scheduler), resetOnError: false, resetOnComplete: false, resetOnRefCountZero: false })`.
 * Details: https://rxjs.dev/deprecations/multicasting
 */
export function publishReplay<T>(
  bufferSize?: number,
  windowTime?: number,
  timestampProvider?: TimestampProvider
): MonoTypeOperatorFunction<T>;

/**
 * Creates an observable, that when subscribed to, will create a {@link ReplaySubject},
 * and pass an observable from it (using [asObservable](api/index/class/Subject#asObservable)) to
 * the `selector` function, which then returns an observable that is subscribed to before
 * "connecting" the source to the internal `ReplaySubject`.
 *
 * Since this is deprecated, for additional details see the documentation for {@link connect}.
 *
 * @param bufferSize The buffer size for the underlying {@link ReplaySubject}.
 * @param windowTime The window time for the underlying {@link ReplaySubject}.
 * @param selector A function used to setup the multicast.
 * @param timestampProvider The timestamp provider for the underlying {@link ReplaySubject}.
 * @deprecated Will be removed in v8. Use the {@link connect} operator instead.
 * `source.pipe(publishReplay(size, window, selector, scheduler))` is equivalent to
 * `source.pipe(connect(selector, { connector: () => new ReplaySubject(size, window, scheduler) }))`.
 * Details: https://rxjs.dev/deprecations/multicasting
 */
export function publishReplay<T, O extends ObservableInput<any>>(
  bufferSize: number | undefined,
  windowTime: number | undefined,
  selector: (shared: Observable<T>) => O,
  timestampProvider?: TimestampProvider
): OperatorFunction<T, ObservedValueOf<O>>;

/**
 * Creates a {@link ConnectableObservable} that uses a {@link ReplaySubject}
 * internally.
 *
 * @param bufferSize The buffer size for the underlying {@link ReplaySubject}.
 * @param windowTime The window time for the underlying {@link ReplaySubject}.
 * @param selector Passing `undefined` here determines that this operator will return a {@link ConnectableObservable}.
 * @param timestampProvider The timestamp provider for the underlying {@link ReplaySubject}.
 * @deprecated Will be removed in v8. To create a connectable observable that uses a
 * {@link ReplaySubject} under the hood, use {@link connectable}.
 * `source.pipe(publishReplay(size, time, scheduler))` is equivalent to
 * `connectable(source, { connector: () => new ReplaySubject(size, time, scheduler), resetOnDisconnect: false })`.
 * If you're using {@link refCount} after `publishReplay`, use the {@link share} operator instead.
 * `publishReplay(size, time, scheduler), refCount()` is equivalent to
 * `share({ connector: () => new ReplaySubject(size, time, scheduler), resetOnError: false, resetOnComplete: false, resetOnRefCountZero: false })`.
 * Details: https://rxjs.dev/deprecations/multicasting
 */
export function publishReplay<T, O extends ObservableInput<any>>(
  bufferSize: number | undefined,
  windowTime: number | undefined,
  selector: undefined,
  timestampProvider: TimestampProvider
): OperatorFunction<T, ObservedValueOf<O>>;

/**
 * @deprecated Will be removed in v8. Use the {@link connectable} observable, the {@link connect} operator or the
 * {@link share} operator instead. See the overloads below for equivalent replacement examples of this operator's
 * behaviors.
 * Details: https://rxjs.dev/deprecations/multicasting
 */
export function publishReplay<T, R>(
  bufferSize?: number,
  windowTime?: number,
  selectorOrScheduler?: TimestampProvider | OperatorFunction<T, R>,
  timestampProvider?: TimestampProvider
) {
  if (selectorOrScheduler && !isFunction(selectorOrScheduler)) {
    timestampProvider = selectorOrScheduler;
  }
  const selector = isFunction(selectorOrScheduler) ? selectorOrScheduler : undefined;
  // Note, we're passing `selector!` here, because at runtime, `undefined` is an acceptable argument
  // but it makes our TypeScript signature for `multicast` unhappy (as it should, because it's gross).
  return (source: Observable<T>) => multicast(new ReplaySubject<T>(bufferSize, windowTime, timestampProvider), selector!)(source);
}
import { ObservableInputTuple, OperatorFunction } from '../types';
import { argsOrArgArray } from '../util/argsOrArgArray';
import { raceWith } from './raceWith';

/** @deprecated Replaced with {@link raceWith}. Will be removed in v8. */
export function race<T, A extends readonly unknown[]>(otherSources: [...ObservableInputTuple<A>]): OperatorFunction<T, T | A[number]>;
/** @deprecated Replaced with {@link raceWith}. Will be removed in v8. */
export function race<T, A extends readonly unknown[]>(...otherSources: [...ObservableInputTuple<A>]): OperatorFunction<T, T | A[number]>;

/**
 * Returns an Observable that mirrors the first source Observable to emit a next,
 * error or complete notification from the combination of this Observable and supplied Observables.
 * @param args Sources used to race for which Observable emits first.
 * @return A function that returns an Observable that mirrors the output of the
 * first Observable to emit an item.
 * @deprecated Replaced with {@link raceWith}. Will be removed in v8.
 */
export function race<T>(...args: any[]): OperatorFunction<T, unknown> {
  return raceWith(...argsOrArgArray(args));
}
import { OperatorFunction, ObservableInputTuple } from '../types';
import { raceInit } from '../observable/race';
import { operate } from '../util/lift';
import { identity } from '../util/identity';

/**
 * Creates an Observable that mirrors the first source Observable to emit a next,
 * error or complete notification from the combination of the Observable to which
 * the operator is applied and supplied Observables.
 *
 * ## Example
 *
 * ```ts
 * import { interval, map, raceWith } from 'rxjs';
 *
 * const obs1 = interval(7000).pipe(map(() => 'slow one'));
 * const obs2 = interval(3000).pipe(map(() => 'fast one'));
 * const obs3 = interval(5000).pipe(map(() => 'medium one'));
 *
 * obs1
 *   .pipe(raceWith(obs2, obs3))
 *   .subscribe(winner => console.log(winner));
 *
 * // Outputs
 * // a series of 'fast one'
 * ```
 *
 * @param otherSources Sources used to race for which Observable emits first.
 * @return A function that returns an Observable that mirrors the output of the
 * first Observable to emit an item.
 */
export function raceWith<T, A extends readonly unknown[]>(
  ...otherSources: [...ObservableInputTuple<A>]
): OperatorFunction<T, T | A[number]> {
  return !otherSources.length
    ? identity
    : operate((source, subscriber) => {
        raceInit<T | A[number]>([source, ...otherSources])(subscriber);
      });
}
import { scanInternals } from './scanInternals';
import { OperatorFunction } from '../types';
import { operate } from '../util/lift';

export function reduce<V, A = V>(accumulator: (acc: A | V, value: V, index: number) => A): OperatorFunction<V, V | A>;
export function reduce<V, A>(accumulator: (acc: A, value: V, index: number) => A, seed: A): OperatorFunction<V, A>;
export function reduce<V, A, S = A>(accumulator: (acc: A | S, value: V, index: number) => A, seed: S): OperatorFunction<V, A>;

/**
 * Applies an accumulator function over the source Observable, and returns the
 * accumulated result when the source completes, given an optional seed value.
 *
 * <span class="informal">Combines together all values emitted on the source,
 * using an accumulator function that knows how to join a new source value into
 * the accumulation from the past.</span>
 *
 * ![](reduce.png)
 *
 * Like
 * [Array.prototype.reduce()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce),
 * `reduce` applies an `accumulator` function against an accumulation and each
 * value of the source Observable (from the past) to reduce it to a single
 * value, emitted on the output Observable. Note that `reduce` will only emit
 * one value, only when the source Observable completes. It is equivalent to
 * applying operator {@link scan} followed by operator {@link last}.
 *
 * Returns an Observable that applies a specified `accumulator` function to each
 * item emitted by the source Observable. If a `seed` value is specified, then
 * that value will be used as the initial value for the accumulator. If no seed
 * value is specified, the first item of the source is used as the seed.
 *
 * ## Example
 *
 * Count the number of click events that happened in 5 seconds
 *
 * ```ts
 * import { fromEvent, takeUntil, interval, map, reduce } from 'rxjs';
 *
 * const clicksInFiveSeconds = fromEvent(document, 'click')
 *   .pipe(takeUntil(interval(5000)));
 *
 * const ones = clicksInFiveSeconds.pipe(map(() => 1));
 * const seed = 0;
 * const count = ones.pipe(reduce((acc, one) => acc + one, seed));
 *
 * count.subscribe(x => console.log(x));
 * ```
 *
 * @see {@link count}
 * @see {@link expand}
 * @see {@link mergeScan}
 * @see {@link scan}
 *
 * @param {function(acc: A, value: V, index: number): A} accumulator The accumulator function
 * called on each source value.
 * @param {A} [seed] The initial accumulation value.
 * @return A function that returns an Observable that emits a single value that
 * is the result of accumulating the values emitted by the source Observable.
 */
export function reduce<V, A>(accumulator: (acc: V | A, value: V, index: number) => A, seed?: any): OperatorFunction<V, V | A> {
  return operate(scanInternals(accumulator, seed, arguments.length >= 2, false, true));
}
import { ConnectableObservable } from '../observable/ConnectableObservable';
import { Subscription } from '../Subscription';
import { MonoTypeOperatorFunction } from '../types';
import { operate } from '../util/lift';
import { createOperatorSubscriber } from './OperatorSubscriber';

/**
 * Make a {@link ConnectableObservable} behave like a ordinary observable and automates the way
 * you can connect to it.
 *
 * Internally it counts the subscriptions to the observable and subscribes (only once) to the source if
 * the number of subscriptions is larger than 0. If the number of subscriptions is smaller than 1, it
 * unsubscribes from the source. This way you can make sure that everything before the *published*
 * refCount has only a single subscription independently of the number of subscribers to the target
 * observable.
 *
 * Note that using the {@link share} operator is exactly the same as using the `multicast(() => new Subject())` operator
 * (making the observable hot) and the *refCount* operator in a sequence.
 *
 * ![](refCount.png)
 *
 * ## Example
 *
 * In the following example there are two intervals turned into connectable observables
 * by using the *publish* operator. The first one uses the *refCount* operator, the
 * second one does not use it. You will notice that a connectable observable does nothing
 * until you call its connect function.
 *
 * ```ts
 * import { interval, tap, publish, refCount } from 'rxjs';
 *
 * // Turn the interval observable into a ConnectableObservable (hot)
 * const refCountInterval = interval(400).pipe(
 *   tap(num => console.log(`refCount ${ num }`)),
 *   publish(),
 *   refCount()
 * );
 *
 * const publishedInterval = interval(400).pipe(
 *   tap(num => console.log(`publish ${ num }`)),
 *   publish()
 * );
 *
 * refCountInterval.subscribe();
 * refCountInterval.subscribe();
 * // 'refCount 0' -----> 'refCount 1' -----> etc
 * // All subscriptions will receive the same value and the tap (and
 * // every other operator) before the `publish` operator will be executed
 * // only once per event independently of the number of subscriptions.
 *
 * publishedInterval.subscribe();
 * // Nothing happens until you call .connect() on the observable.
 * ```
 *
 * @return A function that returns an Observable that automates the connection
 * to ConnectableObservable.
 * @see {@link ConnectableObservable}
 * @see {@link share}
 * @see {@link publish}
 * @deprecated Replaced with the {@link share} operator. How `share` is used
 * will depend on the connectable observable you created just prior to the
 * `refCount` operator.
 * Details: https://rxjs.dev/deprecations/multicasting
 */
export function refCount<T>(): MonoTypeOperatorFunction<T> {
  return operate((source, subscriber) => {
    let connection: Subscription | null = null;

    (source as any)._refCount++;

    const refCounter = createOperatorSubscriber(subscriber, undefined, undefined, undefined, () => {
      if (!source || (source as any)._refCount <= 0 || 0 < --(source as any)._refCount) {
        connection = null;
        return;
      }

      ///
      // Compare the local RefCountSubscriber's connection Subscription to the
      // connection Subscription on the shared ConnectableObservable. In cases
      // where the ConnectableObservable source synchronously emits values, and
      // the RefCountSubscriber's downstream Observers synchronously unsubscribe,
      // execution continues to here before the RefCountOperator has a chance to
      // supply the RefCountSubscriber with the shared connection Subscription.
      // For example:
      // ```
      // range(0, 10).pipe(
      //   publish(),
      //   refCount(),
      //   take(5),
      // )
      // .subscribe();
      // ```
      // In order to account for this case, RefCountSubscriber should only dispose
      // the ConnectableObservable's shared connection Subscription if the
      // connection Subscription exists, *and* either:
      //   a. RefCountSubscriber doesn't have a reference to the shared connection
      //      Subscription yet, or,
      //   b. RefCountSubscriber's connection Subscription reference is identical
      //      to the shared connection Subscription
      ///

      const sharedConnection = (source as any)._connection;
      const conn = connection;
      connection = null;

      if (sharedConnection && (!conn || sharedConnection === conn)) {
        sharedConnection.unsubscribe();
      }

      subscriber.unsubscribe();
    });

    source.subscribe(refCounter);

    if (!refCounter.closed) {
      connection = (source as ConnectableObservable<T>).connect();
    }
  });
}
import { Subscription } from '../Subscription';
import { EMPTY } from '../observable/empty';
import { operate } from '../util/lift';
import { MonoTypeOperatorFunction, ObservableInput } from '../types';
import { createOperatorSubscriber } from './OperatorSubscriber';
import { innerFrom } from '../observable/innerFrom';
import { timer } from '../observable/timer';

export interface RepeatConfig {
  /**
   * The number of times to repeat the source. Defaults to `Infinity`.
   */
  count?: number;

  /**
   * If a `number`, will delay the repeat of the source by that number of milliseconds.
   * If a function, it will provide the number of times the source has been subscribed to,
   * and the return value should be a valid observable input that will notify when the source
   * should be repeated. If the notifier observable is empty, the result will complete.
   */
  delay?: number | ((count: number) => ObservableInput<any>);
}

/**
 * Returns an Observable that will resubscribe to the source stream when the source stream completes.
 *
 * <span class="informal">Repeats all values emitted on the source. It's like {@link retry}, but for non error cases.</span>
 *
 * ![](repeat.png)
 *
 * Repeat will output values from a source until the source completes, then it will resubscribe to the
 * source a specified number of times, with a specified delay. Repeat can be particularly useful in
 * combination with closing operators like {@link take}, {@link takeUntil}, {@link first}, or {@link takeWhile},
 * as it can be used to restart a source again from scratch.
 *
 * Repeat is very similar to {@link retry}, where {@link retry} will resubscribe to the source in the error case, but
 * `repeat` will resubscribe if the source completes.
 *
 * Note that `repeat` will _not_ catch errors. Use {@link retry} for that.
 *
 * - `repeat(0)` returns an empty observable
 * - `repeat()` will repeat forever
 * - `repeat({ delay: 200 })` will repeat forever, with a delay of 200ms between repetitions.
 * - `repeat({ count: 2, delay: 400 })` will repeat twice, with a delay of 400ms between repetitions.
 * - `repeat({ delay: (count) => timer(count * 1000) })` will repeat forever, but will have a delay that grows by one second for each repetition.
 *
 * ## Example
 *
 * Repeat a message stream
 *
 * ```ts
 * import { of, repeat } from 'rxjs';
 *
 * const source = of('Repeat message');
 * const result = source.pipe(repeat(3));
 *
 * result.subscribe(x => console.log(x));
 *
 * // Results
 * // 'Repeat message'
 * // 'Repeat message'
 * // 'Repeat message'
 * ```
 *
 * Repeat 3 values, 2 times
 *
 * ```ts
 * import { interval, take, repeat } from 'rxjs';
 *
 * const source = interval(1000);
 * const result = source.pipe(take(3), repeat(2));
 *
 * result.subscribe(x => console.log(x));
 *
 * // Results every second
 * // 0
 * // 1
 * // 2
 * // 0
 * // 1
 * // 2
 * ```
 *
 * Defining two complex repeats with delays on the same source.
 * Note that the second repeat cannot be called until the first
 * repeat as exhausted it's count.
 *
 * ```ts
 * import { defer, of, repeat } from 'rxjs';
 *
 * const source = defer(() => {
 *    return of(`Hello, it is ${new Date()}`)
 * });
 *
 * source.pipe(
 *    // Repeat 3 times with a delay of 1 second between repetitions
 *    repeat({
 *      count: 3,
 *      delay: 1000,
 *    }),
 *
 *    // *Then* repeat forever, but with an exponential step-back
 *    // maxing out at 1 minute.
 *    repeat({
 *      delay: (count) => timer(Math.min(60000, 2 ^ count * 1000))
 *    })
 * )
 * ```
 *
 * @see {@link repeatWhen}
 * @see {@link retry}
 *
 * @param count The number of times the source Observable items are repeated, a count of 0 will yield
 * an empty Observable.
 */
export function repeat<T>(countOrConfig?: number | RepeatConfig): MonoTypeOperatorFunction<T> {
  let count = Infinity;
  let delay: RepeatConfig['delay'];

  if (countOrConfig != null) {
    if (typeof countOrConfig === 'object') {
      ({ count = Infinity, delay } = countOrConfig);
    } else {
      count = countOrConfig;
    }
  }

  return count <= 0
    ? () => EMPTY
    : operate((source, subscriber) => {
        let soFar = 0;
        let sourceSub: Subscription | null;

        const resubscribe = () => {
          sourceSub?.unsubscribe();
          sourceSub = null;
          if (delay != null) {
            const notifier = typeof delay === 'number' ? timer(delay) : innerFrom(delay(soFar));
            const notifierSubscriber = createOperatorSubscriber(subscriber, () => {
              notifierSubscriber.unsubscribe();
              subscribeToSource();
            });
            notifier.subscribe(notifierSubscriber);
          } else {
            subscribeToSource();
          }
        };

        const subscribeToSource = () => {
          let syncUnsub = false;
          sourceSub = source.subscribe(
            createOperatorSubscriber(subscriber, undefined, () => {
              if (++soFar < count) {
                if (sourceSub) {
                  resubscribe();
                } else {
                  syncUnsub = true;
                }
              } else {
                subscriber.complete();
              }
            })
          );

          if (syncUnsub) {
            resubscribe();
          }
        };

        subscribeToSource();
      });
}
import { Observable } from '../Observable';
import { Subject } from '../Subject';
import { Subscription } from '../Subscription';

import { MonoTypeOperatorFunction } from '../types';
import { operate } from '../util/lift';
import { createOperatorSubscriber } from './OperatorSubscriber';

/**
 * Returns an Observable that mirrors the source Observable with the exception of a `complete`. If the source
 * Observable calls `complete`, this method will emit to the Observable returned from `notifier`. If that Observable
 * calls `complete` or `error`, then this method will call `complete` or `error` on the child subscription. Otherwise
 * this method will resubscribe to the source Observable.
 *
 * ![](repeatWhen.png)
 *
 * ## Example
 *
 * Repeat a message stream on click
 *
 * ```ts
 * import { of, fromEvent, repeatWhen } from 'rxjs';
 *
 * const source = of('Repeat message');
 * const documentClick$ = fromEvent(document, 'click');
 *
 * const result = source.pipe(repeatWhen(() => documentClick$));
 *
 * result.subscribe(data => console.log(data))
 * ```
 *
 * @see {@link repeat}
 * @see {@link retry}
 * @see {@link retryWhen}
 *
 * @param {function(notifications: Observable): Observable} notifier - Receives an Observable of notifications with
 * which a user can `complete` or `error`, aborting the repetition.
 * @return A function that returns an Observable that that mirrors the source
 * Observable with the exception of a `complete`.
 * @deprecated Will be removed in v9 or v10. Use {@link repeat}'s `delay` option instead.
 */
export function repeatWhen<T>(notifier: (notifications: Observable<void>) => Observable<any>): MonoTypeOperatorFunction<T> {
  return operate((source, subscriber) => {
    let innerSub: Subscription | null;
    let syncResub = false;
    let completions$: Subject<void>;
    let isNotifierComplete = false;
    let isMainComplete = false;

    /**
     * Checks to see if we can complete the result, completes it, and returns `true` if it was completed.
     */
    const checkComplete = () => isMainComplete && isNotifierComplete && (subscriber.complete(), true);
    /**
     * Gets the subject to send errors through. If it doesn't exist,
     * we know we need to setup the notifier.
     */
    const getCompletionSubject = () => {
      if (!completions$) {
        completions$ = new Subject();

        // If the call to `notifier` throws, it will be caught by the OperatorSubscriber
        // In the main subscription -- in `subscribeForRepeatWhen`.
        notifier(completions$).subscribe(
          createOperatorSubscriber(
            subscriber,
            () => {
              if (innerSub) {
                subscribeForRepeatWhen();
              } else {
                // If we don't have an innerSub yet, that's because the inner subscription
                // call hasn't even returned yet. We've arrived here synchronously.
                // So we flag that we want to resub, such that we can ensure finalization
                // happens before we resubscribe.
                syncResub = true;
              }
            },
            () => {
              isNotifierComplete = true;
              checkComplete();
            }
          )
        );
      }
      return completions$;
    };

    const subscribeForRepeatWhen = () => {
      isMainComplete = false;

      innerSub = source.subscribe(
        createOperatorSubscriber(subscriber, undefined, () => {
          isMainComplete = true;
          // Check to see if we are complete, and complete if so.
          // If we are not complete. Get the subject. This calls the `notifier` function.
          // If that function fails, it will throw and `.next()` will not be reached on this
          // line. The thrown error is caught by the _complete handler in this
          // `OperatorSubscriber` and handled appropriately.
          !checkComplete() && getCompletionSubject().next();
        })
      );

      if (syncResub) {
        // Ensure that the inner subscription is torn down before
        // moving on to the next subscription in the synchronous case.
        // If we don't do this here, all inner subscriptions will not be
        // torn down until the entire observable is done.
        innerSub.unsubscribe();
        // It is important to null this out. Not only to free up memory, but
        // to make sure code above knows we are in a subscribing state to
        // handle synchronous resubscription.
        innerSub = null;
        // We may need to do this multiple times, so reset the flags.
        syncResub = false;
        // Resubscribe
        subscribeForRepeatWhen();
      }
    };

    // Start the subscription
    subscribeForRepeatWhen();
  });
}
import { MonoTypeOperatorFunction, ObservableInput } from '../types';
import { operate } from '../util/lift';
import { Subscription } from '../Subscription';
import { createOperatorSubscriber } from './OperatorSubscriber';
import { identity } from '../util/identity';
import { timer } from '../observable/timer';
import { innerFrom } from '../observable/innerFrom';

/**
 * The {@link retry} operator configuration object. `retry` either accepts a `number`
 * or an object described by this interface.
 */
export interface RetryConfig {
  /**
   * The maximum number of times to retry. If `count` is omitted, `retry` will try to
   * resubscribe on errors infinite number of times.
   */
  count?: number;
  /**
   * The number of milliseconds to delay before retrying, OR a function to
   * return a notifier for delaying. If a function is given, that function should
   * return a notifier that, when it emits will retry the source. If the notifier
   * completes _without_ emitting, the resulting observable will complete without error,
   * if the notifier errors, the error will be pushed to the result.
   */
  delay?: number | ((error: any, retryCount: number) => ObservableInput<any>);
  /**
   * Whether or not to reset the retry counter when the retried subscription
   * emits its first value.
   */
  resetOnSuccess?: boolean;
}

export function retry<T>(count?: number): MonoTypeOperatorFunction<T>;
export function retry<T>(config: RetryConfig): MonoTypeOperatorFunction<T>;

/**
 * Returns an Observable that mirrors the source Observable with the exception of an `error`.
 *
 * If the source Observable calls `error`, this method will resubscribe to the source Observable for a maximum of
 * `count` resubscriptions rather than propagating the `error` call.
 *
 * ![](retry.png)
 *
 * The number of retries is determined by the `count` parameter. It can be set either by passing a number to
 * `retry` function or by setting `count` property when `retry` is configured using {@link RetryConfig}. If
 * `count` is omitted, `retry` will try to resubscribe on errors infinite number of times.
 *
 * Any and all items emitted by the source Observable will be emitted by the resulting Observable, even those
 * emitted during failed subscriptions. For example, if an Observable fails at first but emits `[1, 2]` then
 * succeeds the second time and emits: `[1, 2, 3, 4, 5, complete]` then the complete stream of emissions and
 * notifications would be: `[1, 2, 1, 2, 3, 4, 5, complete]`.
 *
 * ## Example
 *
 * ```ts
 * import { interval, mergeMap, throwError, of, retry } from 'rxjs';
 *
 * const source = interval(1000);
 * const result = source.pipe(
 *   mergeMap(val => val > 5 ? throwError(() => 'Error!') : of(val)),
 *   retry(2) // retry 2 times on error
 * );
 *
 * result.subscribe({
 *   next: value => console.log(value),
 *   error: err => console.log(`${ err }: Retried 2 times then quit!`)
 * });
 *
 * // Output:
 * // 0..1..2..3..4..5..
 * // 0..1..2..3..4..5..
 * // 0..1..2..3..4..5..
 * // 'Error!: Retried 2 times then quit!'
 * ```
 *
 * @see {@link retryWhen}
 *
 * @param configOrCount - Either number of retry attempts before failing or a {@link RetryConfig} object.
 * @return A function that returns an Observable that will resubscribe to the
 * source stream when the source stream errors, at most `count` times.
 */
export function retry<T>(configOrCount: number | RetryConfig = Infinity): MonoTypeOperatorFunction<T> {
  let config: RetryConfig;
  if (configOrCount && typeof configOrCount === 'object') {
    config = configOrCount;
  } else {
    config = {
      count: configOrCount as number,
    };
  }
  const { count = Infinity, delay, resetOnSuccess: resetOnSuccess = false } = config;

  return count <= 0
    ? identity
    : operate((source, subscriber) => {
        let soFar = 0;
        let innerSub: Subscription | null;
        const subscribeForRetry = () => {
          let syncUnsub = false;
          innerSub = source.subscribe(
            createOperatorSubscriber(
              subscriber,
              (value) => {
                // If we're resetting on success
                if (resetOnSuccess) {
                  soFar = 0;
                }
                subscriber.next(value);
              },
              // Completions are passed through to consumer.
              undefined,
              (err) => {
                if (soFar++ < count) {
                  // We are still under our retry count
                  const resub = () => {
                    if (innerSub) {
                      innerSub.unsubscribe();
                      innerSub = null;
                      subscribeForRetry();
                    } else {
                      syncUnsub = true;
                    }
                  };

                  if (delay != null) {
                    // The user specified a retry delay.
                    // They gave us a number, use a timer, otherwise, it's a function,
                    // and we're going to call it to get a notifier.
                    const notifier = typeof delay === 'number' ? timer(delay) : innerFrom(delay(err, soFar));
                    const notifierSubscriber = createOperatorSubscriber(
                      subscriber,
                      () => {
                        // After we get the first notification, we
                        // unsubscribe from the notifer, because we don't want anymore
                        // and we resubscribe to the source.
                        notifierSubscriber.unsubscribe();
                        resub();
                      },
                      () => {
                        // The notifier completed without emitting.
                        // The author is telling us they want to complete.
                        subscriber.complete();
                      }
                    );
                    notifier.subscribe(notifierSubscriber);
                  } else {
                    // There was no notifier given. Just resub immediately.
                    resub();
                  }
                } else {
                  // We're past our maximum number of retries.
                  // Just send along the error.
                  subscriber.error(err);
                }
              }
            )
          );
          if (syncUnsub) {
            innerSub.unsubscribe();
            innerSub = null;
            subscribeForRetry();
          }
        };
        subscribeForRetry();
      });
}
import { Observable } from '../Observable';
import { Subject } from '../Subject';
import { Subscription } from '../Subscription';

import { MonoTypeOperatorFunction } from '../types';
import { operate } from '../util/lift';
import { createOperatorSubscriber } from './OperatorSubscriber';

/**
 * Returns an Observable that mirrors the source Observable with the exception of an `error`. If the source Observable
 * calls `error`, this method will emit the Throwable that caused the error to the Observable returned from `notifier`.
 * If that Observable calls `complete` or `error` then this method will call `complete` or `error` on the child
 * subscription. Otherwise this method will resubscribe to the source Observable.
 *
 * ![](retryWhen.png)
 *
 * Retry an observable sequence on error based on custom criteria.
 *
 * ## Example
 *
 * ```ts
 * import { interval, map, retryWhen, tap, delayWhen, timer } from 'rxjs';
 *
 * const source = interval(1000);
 * const result = source.pipe(
 *   map(value => {
 *     if (value > 5) {
 *       // error will be picked up by retryWhen
 *       throw value;
 *     }
 *     return value;
 *   }),
 *   retryWhen(errors =>
 *     errors.pipe(
 *       // log error message
 *       tap(value => console.log(`Value ${ value } was too high!`)),
 *       // restart in 5 seconds
 *       delayWhen(value => timer(value * 1000))
 *     )
 *   )
 * );
 *
 * result.subscribe(value => console.log(value));
 *
 * // results:
 * // 0
 * // 1
 * // 2
 * // 3
 * // 4
 * // 5
 * // 'Value 6 was too high!'
 * // - Wait 5 seconds then repeat
 * ```
 *
 * @see {@link retry}
 *
 * @param {function(errors: Observable): Observable} notifier - Receives an Observable of notifications with which a
 * user can `complete` or `error`, aborting the retry.
 * @return A function that returns an Observable that mirrors the source
 * Observable with the exception of an `error`.
 * @deprecated Will be removed in v9 or v10, use {@link retry}'s `delay` option instead.
 */
export function retryWhen<T>(notifier: (errors: Observable<any>) => Observable<any>): MonoTypeOperatorFunction<T> {
  return operate((source, subscriber) => {
    let innerSub: Subscription | null;
    let syncResub = false;
    let errors$: Subject<any>;

    const subscribeForRetryWhen = () => {
      innerSub = source.subscribe(
        createOperatorSubscriber(subscriber, undefined, undefined, (err) => {
          if (!errors$) {
            errors$ = new Subject();
            notifier(errors$).subscribe(
              createOperatorSubscriber(subscriber, () =>
                // If we have an innerSub, this was an asynchronous call, kick off the retry.
                // Otherwise, if we don't have an innerSub yet, that's because the inner subscription
                // call hasn't even returned yet. We've arrived here synchronously.
                // So we flag that we want to resub, such that we can ensure finalization
                // happens before we resubscribe.
                innerSub ? subscribeForRetryWhen() : (syncResub = true)
              )
            );
          }
          if (errors$) {
            // We have set up the notifier without error.
            errors$.next(err);
          }
        })
      );

      if (syncResub) {
        // Ensure that the inner subscription is torn down before
        // moving on to the next subscription in the synchronous case.
        // If we don't do this here, all inner subscriptions will not be
        // torn down until the entire observable is done.
        innerSub.unsubscribe();
        innerSub = null;
        // We may need to do this multiple times, so reset the flag.
        syncResub = false;
        // Resubscribe
        subscribeForRetryWhen();
      }
    };

    // Start the subscription
    subscribeForRetryWhen();
  });
}
import { Observable } from '../Observable';
import { MonoTypeOperatorFunction } from '../types';
import { operate } from '../util/lift';
import { noop } from '../util/noop';
import { createOperatorSubscriber } from './OperatorSubscriber';

/**
 * Emits the most recently emitted value from the source Observable whenever
 * another Observable, the `notifier`, emits.
 *
 * <span class="informal">It's like {@link sampleTime}, but samples whenever
 * the `notifier` Observable emits something.</span>
 *
 * ![](sample.png)
 *
 * Whenever the `notifier` Observable emits a value, `sample`
 * looks at the source Observable and emits whichever value it has most recently
 * emitted since the previous sampling, unless the source has not emitted
 * anything since the previous sampling. The `notifier` is subscribed to as soon
 * as the output Observable is subscribed.
 *
 * ## Example
 *
 * On every click, sample the most recent `seconds` timer
 *
 * ```ts
 * import { fromEvent, interval, sample } from 'rxjs';
 *
 * const seconds = interval(1000);
 * const clicks = fromEvent(document, 'click');
 * const result = seconds.pipe(sample(clicks));
 *
 * result.subscribe(x => console.log(x));
 * ```
 *
 * @see {@link audit}
 * @see {@link debounce}
 * @see {@link sampleTime}
 * @see {@link throttle}
 *
 * @param notifier The Observable to use for sampling the
 * source Observable.
 * @return A function that returns an Observable that emits the results of
 * sampling the values emitted by the source Observable whenever the notifier
 * Observable emits value or completes.
 */
export function sample<T>(notifier: Observable<any>): MonoTypeOperatorFunction<T> {
  return operate((source, subscriber) => {
    let hasValue = false;
    let lastValue: T | null = null;
    source.subscribe(
      createOperatorSubscriber(subscriber, (value) => {
        hasValue = true;
        lastValue = value;
      })
    );
    notifier.subscribe(
      createOperatorSubscriber(
        subscriber,
        () => {
          if (hasValue) {
            hasValue = false;
            const value = lastValue!;
            lastValue = null;
            subscriber.next(value);
          }
        },
        noop
      )
    );
  });
}
import { asyncScheduler } from '../scheduler/async';
import { MonoTypeOperatorFunction, SchedulerLike } from '../types';
import { sample } from './sample';
import { interval } from '../observable/interval';

/**
 * Emits the most recently emitted value from the source Observable within
 * periodic time intervals.
 *
 * <span class="informal">Samples the source Observable at periodic time
 * intervals, emitting what it samples.</span>
 *
 * ![](sampleTime.png)
 *
 * `sampleTime` periodically looks at the source Observable and emits whichever
 * value it has most recently emitted since the previous sampling, unless the
 * source has not emitted anything since the previous sampling. The sampling
 * happens periodically in time every `period` milliseconds (or the time unit
 * defined by the optional `scheduler` argument). The sampling starts as soon as
 * the output Observable is subscribed.
 *
 * ## Example
 *
 * Every second, emit the most recent click at most once
 *
 * ```ts
 * import { fromEvent, sampleTime } from 'rxjs';
 *
 * const clicks = fromEvent(document, 'click');
 * const result = clicks.pipe(sampleTime(1000));
 *
 * result.subscribe(x => console.log(x));
 * ```
 *
 * @see {@link auditTime}
 * @see {@link debounceTime}
 * @see {@link delay}
 * @see {@link sample}
 * @see {@link throttleTime}
 *
 * @param {number} period The sampling period expressed in milliseconds or the
 * time unit determined internally by the optional `scheduler`.
 * @param {SchedulerLike} [scheduler=async] The {@link SchedulerLike} to use for
 * managing the timers that handle the sampling.
 * @return A function that returns an Observable that emits the results of
 * sampling the values emitted by the source Observable at the specified time
 * interval.
 */
export function sampleTime<T>(period: number, scheduler: SchedulerLike = asyncScheduler): MonoTypeOperatorFunction<T> {
  return sample(interval(period, scheduler));
}
import { OperatorFunction } from '../types';
import { operate } from '../util/lift';
import { scanInternals } from './scanInternals';

export function scan<V, A = V>(accumulator: (acc: A | V, value: V, index: number) => A): OperatorFunction<V, V | A>;
export function scan<V, A>(accumulator: (acc: A, value: V, index: number) => A, seed: A): OperatorFunction<V, A>;
export function scan<V, A, S>(accumulator: (acc: A | S, value: V, index: number) => A, seed: S): OperatorFunction<V, A>;

// TODO: link to a "redux pattern" section in the guide (location TBD)

/**
 * Useful for encapsulating and managing state. Applies an accumulator (or "reducer function")
 * to each value from the source after an initial state is established -- either via
 * a `seed` value (second argument), or from the first value from the source.
 *
 * <span class="informal">It's like {@link reduce}, but emits the current
 * accumulation state after each update</span>
 *
 * ![](scan.png)
 *
 * This operator maintains an internal state and emits it after processing each value as follows:
 *
 * 1. First value arrives
 *   - If a `seed` value was supplied (as the second argument to `scan`), let `state = seed` and `value = firstValue`.
 *   - If NO `seed` value was supplied (no second argument), let `state = firstValue` and go to 3.
 * 2. Let `state = accumulator(state, value)`.
 *   - If an error is thrown by `accumulator`, notify the consumer of an error. The process ends.
 * 3. Emit `state`.
 * 4. Next value arrives, let `value = nextValue`, go to 2.
 *
 * ## Examples
 *
 * An average of previous numbers. This example shows how
 * not providing a `seed` can prime the stream with the
 * first value from the source.
 *
 * ```ts
 * import { of, scan, map } from 'rxjs';
 *
 * const numbers$ = of(1, 2, 3);
 *
 * numbers$
 *   .pipe(
 *     // Get the sum of the numbers coming in.
 *     scan((total, n) => total + n),
 *     // Get the average by dividing the sum by the total number
 *     // received so var (which is 1 more than the zero-based index).
 *     map((sum, index) => sum / (index + 1))
 *   )
 *   .subscribe(console.log);
 * ```
 *
 * The Fibonacci sequence. This example shows how you can use
 * a seed to prime accumulation process. Also... you know... Fibonacci.
 * So important to like, computers and stuff that its whiteboarded
 * in job interviews. Now you can show them the Rx version! (Please don't, haha)
 *
 * ```ts
 * import { interval, scan, map, startWith } from 'rxjs';
 *
 * const firstTwoFibs = [0, 1];
 * // An endless stream of Fibonacci numbers.
 * const fibonacci$ = interval(1000).pipe(
 *   // Scan to get the fibonacci numbers (after 0, 1)
 *   scan(([a, b]) => [b, a + b], firstTwoFibs),
 *   // Get the second number in the tuple, it's the one you calculated
 *   map(([, n]) => n),
 *   // Start with our first two digits :)
 *   startWith(...firstTwoFibs)
 * );
 *
 * fibonacci$.subscribe(console.log);
 * ```
 *
 * @see {@link expand}
 * @see {@link mergeScan}
 * @see {@link reduce}
 * @see {@link switchScan}
 *
 * @param accumulator A "reducer function". This will be called for each value after an initial state is
 * acquired.
 * @param seed The initial state. If this is not provided, the first value from the source will
 * be used as the initial state, and emitted without going through the accumulator. All subsequent values
 * will be processed by the accumulator function. If this is provided, all values will go through
 * the accumulator function.
 * @return A function that returns an Observable of the accumulated values.
 */
export function scan<V, A, S>(accumulator: (acc: V | A | S, value: V, index: number) => A, seed?: S): OperatorFunction<V, V | A> {
  // providing a seed of `undefined` *should* be valid and trigger
  // hasSeed! so don't use `seed !== undefined` checks!
  // For this reason, we have to check it here at the original call site
  // otherwise inside Operator/Subscriber we won't know if `undefined`
  // means they didn't provide anything or if they literally provided `undefined`
  return operate(scanInternals(accumulator, seed as S, arguments.length >= 2, true));
}
import { Observable } from '../Observable';
import { Subscriber } from '../Subscriber';
import { createOperatorSubscriber } from './OperatorSubscriber';

/**
 * A basic scan operation. This is used for `scan` and `reduce`.
 * @param accumulator The accumulator to use
 * @param seed The seed value for the state to accumulate
 * @param hasSeed Whether or not a seed was provided
 * @param emitOnNext Whether or not to emit the state on next
 * @param emitBeforeComplete Whether or not to emit the before completion
 */

export function scanInternals<V, A, S>(
  accumulator: (acc: V | A | S, value: V, index: number) => A,
  seed: S,
  hasSeed: boolean,
  emitOnNext: boolean,
  emitBeforeComplete?: undefined | true
) {
  return (source: Observable<V>, subscriber: Subscriber<any>) => {
    // Whether or not we have state yet. This will only be
    // false before the first value arrives if we didn't get
    // a seed value.
    let hasState = hasSeed;
    // The state that we're tracking, starting with the seed,
    // if there is one, and then updated by the return value
    // from the accumulator on each emission.
    let state: any = seed;
    // An index to pass to the accumulator function.
    let index = 0;

    // Subscribe to our source. All errors and completions are passed through.
    source.subscribe(
      createOperatorSubscriber(
        subscriber,
        (value) => {
          // Always increment the index.
          const i = index++;
          // Set the state
          state = hasState
            ? // We already have state, so we can get the new state from the accumulator
              accumulator(state, value, i)
            : // We didn't have state yet, a seed value was not provided, so

              // we set the state to the first value, and mark that we have state now
              ((hasState = true), value);

          // Maybe send it to the consumer.
          emitOnNext && subscriber.next(state);
        },
        // If an onComplete was given, call it, otherwise
        // just pass through the complete notification to the consumer.
        emitBeforeComplete &&
          (() => {
            hasState && subscriber.next(state);
            subscriber.complete();
          })
      )
    );
  };
}
import { Observable } from '../Observable';

import { OperatorFunction } from '../types';
import { operate } from '../util/lift';
import { createOperatorSubscriber } from './OperatorSubscriber';

/**
 * Compares all values of two observables in sequence using an optional comparator function
 * and returns an observable of a single boolean value representing whether or not the two sequences
 * are equal.
 *
 * <span class="informal">Checks to see of all values emitted by both observables are equal, in order.</span>
 *
 * ![](sequenceEqual.png)
 *
 * `sequenceEqual` subscribes to two observables and buffers incoming values from each observable. Whenever either
 * observable emits a value, the value is buffered and the buffers are shifted and compared from the bottom
 * up; If any value pair doesn't match, the returned observable will emit `false` and complete. If one of the
 * observables completes, the operator will wait for the other observable to complete; If the other
 * observable emits before completing, the returned observable will emit `false` and complete. If one observable never
 * completes or emits after the other completes, the returned observable will never complete.
 *
 * ## Example
 *
 * Figure out if the Konami code matches
 *
 * ```ts
 * import { from, fromEvent, map, bufferCount, mergeMap, sequenceEqual } from 'rxjs';
 *
 * const codes = from([
 *   'ArrowUp',
 *   'ArrowUp',
 *   'ArrowDown',
 *   'ArrowDown',
 *   'ArrowLeft',
 *   'ArrowRight',
 *   'ArrowLeft',
 *   'ArrowRight',
 *   'KeyB',
 *   'KeyA',
 *   'Enter', // no start key, clearly.
 * ]);
 *
 * const keys = fromEvent<KeyboardEvent>(document, 'keyup').pipe(map(e => e.code));
 * const matches = keys.pipe(
 *   bufferCount(11, 1),
 *   mergeMap(last11 => from(last11).pipe(sequenceEqual(codes)))
 * );
 * matches.subscribe(matched => console.log('Successful cheat at Contra? ', matched));
 * ```
 *
 * @see {@link combineLatest}
 * @see {@link zip}
 * @see {@link withLatestFrom}
 *
 * @param {Observable} compareTo The observable sequence to compare the source sequence to.
 * @param {function} [comparator] An optional function to compare each value pair
 * @return A function that returns an Observable that emits a single boolean
 * value representing whether or not the values emitted by the source
 * Observable and provided Observable were equal in sequence.
 */
export function sequenceEqual<T>(
  compareTo: Observable<T>,
  comparator: (a: T, b: T) => boolean = (a, b) => a === b
): OperatorFunction<T, boolean> {
  return operate((source, subscriber) => {
    // The state for the source observable
    const aState = createState<T>();
    // The state for the compareTo observable;
    const bState = createState<T>();

    /** A utility to emit and complete */
    const emit = (isEqual: boolean) => {
      subscriber.next(isEqual);
      subscriber.complete();
    };

    /**
     * Creates a subscriber that subscribes to one of the sources, and compares its collected
     * state -- `selfState` -- to the other source's collected state -- `otherState`. This
     * is used for both streams.
     */
    const createSubscriber = (selfState: SequenceState<T>, otherState: SequenceState<T>) => {
      const sequenceEqualSubscriber = createOperatorSubscriber(
        subscriber,
        (a: T) => {
          const { buffer, complete } = otherState;
          if (buffer.length === 0) {
            // If there's no values in the other buffer
            // and the other stream is complete, we know
            // this isn't a match, because we got one more value.
            // Otherwise, we push onto our buffer, so when the other
            // stream emits, it can pull this value off our buffer and check it
            // at the appropriate time.
            complete ? emit(false) : selfState.buffer.push(a);
          } else {
            // If the other stream *does* have values in it's buffer,
            // pull the oldest one off so we can compare it to what we
            // just got. If it wasn't a match, emit `false` and complete.
            !comparator(a, buffer.shift()!) && emit(false);
          }
        },
        () => {
          // Or observable completed
          selfState.complete = true;
          const { complete, buffer } = otherState;
          // If the other observable is also complete, and there's
          // still stuff left in their buffer, it doesn't match, if their
          // buffer is empty, then it does match. This is because we can't
          // possibly get more values here anymore.
          complete && emit(buffer.length === 0);
          // Be sure to clean up our stream as soon as possible if we can.
          sequenceEqualSubscriber?.unsubscribe();
        }
      );

      return sequenceEqualSubscriber;
    };

    // Subscribe to each source.
    source.subscribe(createSubscriber(aState, bState));
    compareTo.subscribe(createSubscriber(bState, aState));
  });
}

/**
 * A simple structure for the data used to test each sequence
 */
interface SequenceState<T> {
  /** A temporary store for arrived values before they are checked */
  buffer: T[];
  /** Whether or not the sequence source has completed. */
  complete: boolean;
}

/**
 * Creates a simple structure that is used to represent
 * data used to test each sequence.
 */
function createState<T>(): SequenceState<T> {
  return {
    buffer: [],
    complete: false,
  };
}
import { Observable } from '../Observable';
import { innerFrom } from '../observable/innerFrom';
import { Subject } from '../Subject';
import { SafeSubscriber } from '../Subscriber';
import { Subscription } from '../Subscription';
import { MonoTypeOperatorFunction, SubjectLike } from '../types';
import { operate } from '../util/lift';

export interface ShareConfig<T> {
  /**
   * The factory used to create the subject that will connect the source observable to
   * multicast consumers.
   */
  connector?: () => SubjectLike<T>;
  /**
   * If true, the resulting observable will reset internal state on error from source and return to a "cold" state. This
   * allows the resulting observable to be "retried" in the event of an error.
   * If false, when an error comes from the source it will push the error into the connecting subject, and the subject
   * will remain the connecting subject, meaning the resulting observable will not go "cold" again, and subsequent retries
   * or resubscriptions will resubscribe to that same subject. In all cases, RxJS subjects will emit the same error again, however
   * {@link ReplaySubject} will also push its buffered values before pushing the error.
   * It is also possible to pass a notifier factory returning an observable instead which grants more fine-grained
   * control over how and when the reset should happen. This allows behaviors like conditional or delayed resets.
   */
  resetOnError?: boolean | ((error: any) => Observable<any>);
  /**
   * If true, the resulting observable will reset internal state on completion from source and return to a "cold" state. This
   * allows the resulting observable to be "repeated" after it is done.
   * If false, when the source completes, it will push the completion through the connecting subject, and the subject
   * will remain the connecting subject, meaning the resulting observable will not go "cold" again, and subsequent repeats
   * or resubscriptions will resubscribe to that same subject.
   * It is also possible to pass a notifier factory returning an observable instead which grants more fine-grained
   * control over how and when the reset should happen. This allows behaviors like conditional or delayed resets.
   */
  resetOnComplete?: boolean | (() => Observable<any>);
  /**
   * If true, when the number of subscribers to the resulting observable reaches zero due to those subscribers unsubscribing, the
   * internal state will be reset and the resulting observable will return to a "cold" state. This means that the next
   * time the resulting observable is subscribed to, a new subject will be created and the source will be subscribed to
   * again.
   * If false, when the number of subscribers to the resulting observable reaches zero due to unsubscription, the subject
   * will remain connected to the source, and new subscriptions to the result will be connected through that same subject.
   * It is also possible to pass a notifier factory returning an observable instead which grants more fine-grained
   * control over how and when the reset should happen. This allows behaviors like conditional or delayed resets.
   */
  resetOnRefCountZero?: boolean | (() => Observable<any>);
}

export function share<T>(): MonoTypeOperatorFunction<T>;

export function share<T>(options: ShareConfig<T>): MonoTypeOperatorFunction<T>;

/**
 * Returns a new Observable that multicasts (shares) the original Observable. As long as there is at least one
 * Subscriber this Observable will be subscribed and emitting data. When all subscribers have unsubscribed it will
 * unsubscribe from the source Observable. Because the Observable is multicasting it makes the stream `hot`.
 * This is an alias for `multicast(() => new Subject()), refCount()`.
 *
 * The subscription to the underlying source Observable can be reset (unsubscribe and resubscribe for new subscribers),
 * if the subscriber count to the shared observable drops to 0, or if the source Observable errors or completes. It is
 * possible to use notifier factories for the resets to allow for behaviors like conditional or delayed resets. Please
 * note that resetting on error or complete of the source Observable does not behave like a transparent retry or restart
 * of the source because the error or complete will be forwarded to all subscribers and their subscription will be
 * closed. Only new subscribers after a reset on error or complete happened will cause a fresh subscription to the
 * source. To achieve transparent retries or restarts pipe the source through appropriate operators before sharing.
 *
 * ![](share.png)
 *
 * ## Example
 *
 * Generate new multicast Observable from the `source` Observable value
 *
 * ```ts
 * import { interval, tap, map, take, share } from 'rxjs';
 *
 * const source = interval(1000).pipe(
 *   tap(x => console.log('Processing: ', x)),
 *   map(x => x * x),
 *   take(6),
 *   share()
 * );
 *
 * source.subscribe(x => console.log('subscription 1: ', x));
 * source.subscribe(x => console.log('subscription 2: ', x));
 *
 * // Logs:
 * // Processing: 0
 * // subscription 1: 0
 * // subscription 2: 0
 * // Processing: 1
 * // subscription 1: 1
 * // subscription 2: 1
 * // Processing: 2
 * // subscription 1: 4
 * // subscription 2: 4
 * // Processing: 3
 * // subscription 1: 9
 * // subscription 2: 9
 * // Processing: 4
 * // subscription 1: 16
 * // subscription 2: 16
 * // Processing: 5
 * // subscription 1: 25
 * // subscription 2: 25
 * ```
 *
 * ## Example with notifier factory: Delayed reset
 *
 * ```ts
 * import { interval, take, share, timer } from 'rxjs';
 *
 * const source = interval(1000).pipe(
 *   take(3),
 *   share({
 *     resetOnRefCountZero: () => timer(1000)
 *   })
 * );
 *
 * const subscriptionOne = source.subscribe(x => console.log('subscription 1: ', x));
 * setTimeout(() => subscriptionOne.unsubscribe(), 1300);
 *
 * setTimeout(() => source.subscribe(x => console.log('subscription 2: ', x)), 1700);
 *
 * setTimeout(() => source.subscribe(x => console.log('subscription 3: ', x)), 5000);
 *
 * // Logs:
 * // subscription 1:  0
 * // (subscription 1 unsubscribes here)
 * // (subscription 2 subscribes here ~400ms later, source was not reset)
 * // subscription 2:  1
 * // subscription 2:  2
 * // (subscription 2 unsubscribes here)
 * // (subscription 3 subscribes here ~2000ms later, source did reset before)
 * // subscription 3:  0
 * // subscription 3:  1
 * // subscription 3:  2
 * ```
 *
 * @see {@link shareReplay}
 *
 * @return A function that returns an Observable that mirrors the source.
 */
export function share<T>(options: ShareConfig<T> = {}): MonoTypeOperatorFunction<T> {
  const { connector = () => new Subject<T>(), resetOnError = true, resetOnComplete = true, resetOnRefCountZero = true } = options;
  // It's necessary to use a wrapper here, as the _operator_ must be
  // referentially transparent. Otherwise, it cannot be used in calls to the
  // static `pipe` function - to create a partial pipeline.
  //
  // The _operator function_ - the function returned by the _operator_ - will
  // not be referentially transparent - as it shares its source - but the
  // _operator function_ is called when the complete pipeline is composed via a
  // call to a source observable's `pipe` method - not when the static `pipe`
  // function is called.
  return (wrapperSource) => {
    let connection: SafeSubscriber<T> | undefined;
    let resetConnection: Subscription | undefined;
    let subject: SubjectLike<T> | undefined;
    let refCount = 0;
    let hasCompleted = false;
    let hasErrored = false;

    const cancelReset = () => {
      resetConnection?.unsubscribe();
      resetConnection = undefined;
    };
    // Used to reset the internal state to a "cold"
    // state, as though it had never been subscribed to.
    const reset = () => {
      cancelReset();
      connection = subject = undefined;
      hasCompleted = hasErrored = false;
    };
    const resetAndUnsubscribe = () => {
      // We need to capture the connection before
      // we reset (if we need to reset).
      const conn = connection;
      reset();
      conn?.unsubscribe();
    };

    return operate<T, T>((source, subscriber) => {
      refCount++;
      if (!hasErrored && !hasCompleted) {
        cancelReset();
      }

      // Create the subject if we don't have one yet. Grab a local reference to
      // it as well, which avoids non-null assertations when using it and, if we
      // connect to it now, then error/complete need a reference after it was
      // reset.
      const dest = (subject = subject ?? connector());

      // Add the finalization directly to the subscriber - instead of returning it -
      // so that the handling of the subscriber's unsubscription will be wired
      // up _before_ the subscription to the source occurs. This is done so that
      // the assignment to the source connection's `closed` property will be seen
      // by synchronous firehose sources.
      subscriber.add(() => {
        refCount--;

        // If we're resetting on refCount === 0, and it's 0, we only want to do
        // that on "unsubscribe", really. Resetting on error or completion is a different
        // configuration.
        if (refCount === 0 && !hasErrored && !hasCompleted) {
          resetConnection = handleReset(resetAndUnsubscribe, resetOnRefCountZero);
        }
      });

      // The following line adds the subscription to the subscriber passed.
      // Basically, `subscriber === dest.subscribe(subscriber)` is `true`.
      dest.subscribe(subscriber);

      if (
        !connection &&
        // Check this shareReplay is still activate - it can be reset to 0
        // and be "unsubscribed" _before_ it actually subscribes.
        // If we were to subscribe then, it'd leak and get stuck.
        refCount > 0
      ) {
        // We need to create a subscriber here - rather than pass an observer and
        // assign the returned subscription to connection - because it's possible
        // for reentrant subscriptions to the shared observable to occur and in
        // those situations we want connection to be already-assigned so that we
        // don't create another connection to the source.
        connection = new SafeSubscriber({
          next: (value) => dest.next(value),
          error: (err) => {
            hasErrored = true;
            cancelReset();
            resetConnection = handleReset(reset, resetOnError, err);
            dest.error(err);
          },
          complete: () => {
            hasCompleted = true;
            cancelReset();
            resetConnection = handleReset(reset, resetOnComplete);
            dest.complete();
          },
        });
        innerFrom(source).subscribe(connection);
      }
    })(wrapperSource);
  };
}

function handleReset<T extends unknown[] = never[]>(
  reset: () => void,
  on: boolean | ((...args: T) => Observable<any>),
  ...args: T
): Subscription | undefined {
  if (on === true) {
    reset();
    return;
  }

  if (on === false) {
    return;
  }

  const onSubscriber = new SafeSubscriber({
    next: () => {
      onSubscriber.unsubscribe();
      reset();
    },
  });

  return on(...args).subscribe(onSubscriber);
}
import { ReplaySubject } from '../ReplaySubject';
import { MonoTypeOperatorFunction, SchedulerLike } from '../types';
import { share } from './share';

export interface ShareReplayConfig {
  bufferSize?: number;
  windowTime?: number;
  refCount: boolean;
  scheduler?: SchedulerLike;
}

export function shareReplay<T>(config: ShareReplayConfig): MonoTypeOperatorFunction<T>;
export function shareReplay<T>(bufferSize?: number, windowTime?: number, scheduler?: SchedulerLike): MonoTypeOperatorFunction<T>;

/**
 * Share source and replay specified number of emissions on subscription.
 *
 * This operator is a specialization of `replay` that connects to a source observable
 * and multicasts through a `ReplaySubject` constructed with the specified arguments.
 * A successfully completed source will stay cached in the `shareReplayed observable` forever,
 * but an errored source can be retried.
 *
 * ## Why use shareReplay?
 * You generally want to use `shareReplay` when you have side-effects or taxing computations
 * that you do not wish to be executed amongst multiple subscribers.
 * It may also be valuable in situations where you know you will have late subscribers to
 * a stream that need access to previously emitted values.
 * This ability to replay values on subscription is what differentiates {@link share} and `shareReplay`.
 *
 * ![](shareReplay.png)
 *
 * ## Reference counting
 * By default `shareReplay` will use `refCount` of false, meaning that it will _not_ unsubscribe the
 * source when the reference counter drops to zero, i.e. the inner `ReplaySubject` will _not_ be unsubscribed
 * (and potentially run for ever).
 * This is the default as it is expected that `shareReplay` is often used to keep around expensive to setup
 * observables which we want to keep running instead of having to do the expensive setup again.
 *
 * As of RXJS version 6.4.0 a new overload signature was added to allow for manual control over what
 * happens when the operators internal reference counter drops to zero.
 * If `refCount` is true, the source will be unsubscribed from once the reference count drops to zero, i.e.
 * the inner `ReplaySubject` will be unsubscribed. All new subscribers will receive value emissions from a
 * new `ReplaySubject` which in turn will cause a new subscription to the source observable.
 *
 * ## Examples
 *
 * Example with a third subscriber coming late to the party
 *
 * ```ts
 * import { interval, take, shareReplay } from 'rxjs';
 *
 * const shared$ = interval(2000).pipe(
 *   take(6),
 *   shareReplay(3)
 * );
 *
 * shared$.subscribe(x => console.log('sub A: ', x));
 * shared$.subscribe(y => console.log('sub B: ', y));
 *
 * setTimeout(() => {
 *   shared$.subscribe(y => console.log('sub C: ', y));
 * }, 11000);
 *
 * // Logs:
 * // (after ~2000 ms)
 * // sub A: 0
 * // sub B: 0
 * // (after ~4000 ms)
 * // sub A: 1
 * // sub B: 1
 * // (after ~6000 ms)
 * // sub A: 2
 * // sub B: 2
 * // (after ~8000 ms)
 * // sub A: 3
 * // sub B: 3
 * // (after ~10000 ms)
 * // sub A: 4
 * // sub B: 4
 * // (after ~11000 ms, sub C gets the last 3 values)
 * // sub C: 2
 * // sub C: 3
 * // sub C: 4
 * // (after ~12000 ms)
 * // sub A: 5
 * // sub B: 5
 * // sub C: 5
 * ```
 *
 * Example for `refCount` usage
 *
 * ```ts
 * import { Observable, tap, interval, shareReplay, take } from 'rxjs';
 *
 * const log = <T>(name: string, source: Observable<T>) => source.pipe(
 *   tap({
 *     subscribe: () => console.log(`${ name }: subscribed`),
 *     next: value => console.log(`${ name }: ${ value }`),
 *     complete: () => console.log(`${ name }: completed`),
 *     finalize: () => console.log(`${ name }: unsubscribed`)
 *   })
 * );
 *
 * const obs$ = log('source', interval(1000));
 *
 * const shared$ = log('shared', obs$.pipe(
 *   shareReplay({ bufferSize: 1, refCount: true }),
 *   take(2)
 * ));
 *
 * shared$.subscribe(x => console.log('sub A: ', x));
 * shared$.subscribe(y => console.log('sub B: ', y));
 *
 * // PRINTS:
 * // shared: subscribed <-- reference count = 1
 * // source: subscribed
 * // shared: subscribed <-- reference count = 2
 * // source: 0
 * // shared: 0
 * // sub A: 0
 * // shared: 0
 * // sub B: 0
 * // source: 1
 * // shared: 1
 * // sub A: 1
 * // shared: completed <-- take(2) completes the subscription for sub A
 * // shared: unsubscribed <-- reference count = 1
 * // shared: 1
 * // sub B: 1
 * // shared: completed <-- take(2) completes the subscription for sub B
 * // shared: unsubscribed <-- reference count = 0
 * // source: unsubscribed <-- replaySubject unsubscribes from source observable because the reference count dropped to 0 and refCount is true
 *
 * // In case of refCount being false, the unsubscribe is never called on the source and the source would keep on emitting, even if no subscribers
 * // are listening.
 * // source: 2
 * // source: 3
 * // source: 4
 * // ...
 * ```
 *
 * @see {@link publish}
 * @see {@link share}
 * @see {@link publishReplay}
 *
 * @param {Number} [bufferSize=Infinity] Maximum element count of the replay buffer.
 * @param {Number} [windowTime=Infinity] Maximum time length of the replay buffer in milliseconds.
 * @param {Scheduler} [scheduler] Scheduler where connected observers within the selector function
 * will be invoked on.
 * @return A function that returns an Observable sequence that contains the
 * elements of a sequence produced by multicasting the source sequence within a
 * selector function.
 */
export function shareReplay<T>(
  configOrBufferSize?: ShareReplayConfig | number,
  windowTime?: number,
  scheduler?: SchedulerLike
): MonoTypeOperatorFunction<T> {
  let bufferSize: number;
  let refCount = false;
  if (configOrBufferSize && typeof configOrBufferSize === 'object') {
    ({ bufferSize = Infinity, windowTime = Infinity, refCount = false, scheduler } = configOrBufferSize);
  } else {
    bufferSize = (configOrBufferSize ?? Infinity) as number;
  }
  return share<T>({
    connector: () => new ReplaySubject(bufferSize, windowTime, scheduler),
    resetOnError: true,
    resetOnComplete: false,
    resetOnRefCountZero: refCount,
  });
}
import { Observable } from '../Observable';
import { EmptyError } from '../util/EmptyError';

import { MonoTypeOperatorFunction, OperatorFunction, TruthyTypesOf } from '../types';
import { SequenceError } from '../util/SequenceError';
import { NotFoundError } from '../util/NotFoundError';
import { operate } from '../util/lift';
import { createOperatorSubscriber } from './OperatorSubscriber';

export function single<T>(predicate: BooleanConstructor): OperatorFunction<T, TruthyTypesOf<T>>;
export function single<T>(predicate?: (value: T, index: number, source: Observable<T>) => boolean): MonoTypeOperatorFunction<T>;

/**
 * Returns an observable that asserts that only one value is
 * emitted from the observable that matches the predicate. If no
 * predicate is provided, then it will assert that the observable
 * only emits one value.
 *
 * In the event that the observable is empty, it will throw an
 * {@link EmptyError}.
 *
 * In the event that two values are found that match the predicate,
 * or when there are two values emitted and no predicate, it will
 * throw a {@link SequenceError}
 *
 * In the event that no values match the predicate, if one is provided,
 * it will throw a {@link NotFoundError}
 *
 * ## Example
 *
 * Expect only `name` beginning with `'B'`
 *
 * ```ts
 * import { of, single } from 'rxjs';
 *
 * const source1 = of(
 *  { name: 'Ben' },
 *  { name: 'Tracy' },
 *  { name: 'Laney' },
 *  { name: 'Lily' }
 * );
 *
 * source1
 *   .pipe(single(x => x.name.startsWith('B')))
 *   .subscribe(x => console.log(x));
 * // Emits 'Ben'
 *
 *
 * const source2 = of(
 *  { name: 'Ben' },
 *  { name: 'Tracy' },
 *  { name: 'Bradley' },
 *  { name: 'Lincoln' }
 * );
 *
 * source2
 *   .pipe(single(x => x.name.startsWith('B')))
 *   .subscribe({ error: err => console.error(err) });
 * // Error emitted: SequenceError('Too many values match')
 *
 *
 * const source3 = of(
 *  { name: 'Laney' },
 *  { name: 'Tracy' },
 *  { name: 'Lily' },
 *  { name: 'Lincoln' }
 * );
 *
 * source3
 *   .pipe(single(x => x.name.startsWith('B')))
 *   .subscribe({ error: err => console.error(err) });
 * // Error emitted: NotFoundError('No values match')
 * ```
 *
 * @see {@link first}
 * @see {@link find}
 * @see {@link findIndex}
 * @see {@link elementAt}
 *
 * @throws {NotFoundError} Delivers an NotFoundError to the Observer's `error`
 * callback if the Observable completes before any `next` notification was sent.
 * @throws {SequenceError} Delivers a SequenceError if more than one value is emitted that matches the
 * provided predicate. If no predicate is provided, will deliver a SequenceError if more
 * than one value comes from the source
 * @param {Function} predicate - A predicate function to evaluate items emitted by the source Observable.
 * @return A function that returns an Observable that emits the single item
 * emitted by the source Observable that matches the predicate.
 */
export function single<T>(predicate?: (value: T, index: number, source: Observable<T>) => boolean): MonoTypeOperatorFunction<T> {
  return operate((source, subscriber) => {
    let hasValue = false;
    let singleValue: T;
    let seenValue = false;
    let index = 0;
    source.subscribe(
      createOperatorSubscriber(
        subscriber,
        (value) => {
          seenValue = true;
          if (!predicate || predicate(value, index++, source)) {
            hasValue && subscriber.error(new SequenceError('Too many matching values'));
            hasValue = true;
            singleValue = value;
          }
        },
        () => {
          if (hasValue) {
            subscriber.next(singleValue);
            subscriber.complete();
          } else {
            subscriber.error(seenValue ? new NotFoundError('No matching values') : new EmptyError());
          }
        }
      )
    );
  });
}
import { MonoTypeOperatorFunction } from '../types';
import { filter } from './filter';

/**
 * Returns an Observable that skips the first `count` items emitted by the source Observable.
 *
 * ![](skip.png)
 *
 * Skips the values until the sent notifications are equal or less than provided skip count. It raises
 * an error if skip count is equal or more than the actual number of emits and source raises an error.
 *
 * ## Example
 *
 * Skip the values before the emission
 *
 * ```ts
 * import { interval, skip } from 'rxjs';
 *
 * // emit every half second
 * const source = interval(500);
 * // skip the first 10 emitted values
 * const result = source.pipe(skip(10));
 *
 * result.subscribe(value => console.log(value));
 * // output: 10...11...12...13...
 * ```
 *
 * @see {@link last}
 * @see {@link skipWhile}
 * @see {@link skipUntil}
 * @see {@link skipLast}
 *
 * @param {Number} count - The number of times, items emitted by source Observable should be skipped.
 * @return A function that returns an Observable that skips the first `count`
 * values emitted by the source Observable.
 */
export function skip<T>(count: number): MonoTypeOperatorFunction<T> {
  return filter((_, index) => count <= index);
}
import { MonoTypeOperatorFunction } from '../types';
import { identity } from '../util/identity';
import { operate } from '../util/lift';
import { createOperatorSubscriber } from './OperatorSubscriber';

/**
 * Skip a specified number of values before the completion of an observable.
 *
 * ![](skipLast.png)
 *
 * Returns an observable that will emit values as soon as it can, given a number of
 * skipped values. For example, if you `skipLast(3)` on a source, when the source
 * emits its fourth value, the first value the source emitted will finally be emitted
 * from the returned observable, as it is no longer part of what needs to be skipped.
 *
 * All values emitted by the result of `skipLast(N)` will be delayed by `N` emissions,
 * as each value is held in a buffer until enough values have been emitted that that
 * the buffered value may finally be sent to the consumer.
 *
 * After subscribing, unsubscribing will not result in the emission of the buffered
 * skipped values.
 *
 * ## Example
 *
 * Skip the last 2 values of an observable with many values
 *
 * ```ts
 * import { of, skipLast } from 'rxjs';
 *
 * const numbers = of(1, 2, 3, 4, 5);
 * const skipLastTwo = numbers.pipe(skipLast(2));
 * skipLastTwo.subscribe(x => console.log(x));
 *
 * // Results in:
 * // 1 2 3
 * // (4 and 5 are skipped)
 * ```
 *
 * @see {@link skip}
 * @see {@link skipUntil}
 * @see {@link skipWhile}
 * @see {@link take}
 *
 * @param skipCount Number of elements to skip from the end of the source Observable.
 * @return A function that returns an Observable that skips the last `count`
 * values emitted by the source Observable.
 */
export function skipLast<T>(skipCount: number): MonoTypeOperatorFunction<T> {
  return skipCount <= 0
    ? // For skipCounts less than or equal to zero, we are just mirroring the source.
      identity
    : operate((source, subscriber) => {
        // A ring buffer to hold the values while we wait to see
        // if we can emit it or it's part of the "skipped" last values.
        // Note that it is the _same size_ as the skip count.
        let ring: T[] = new Array(skipCount);
        // The number of values seen so far. This is used to get
        // the index of the current value when it arrives.
        let seen = 0;
        source.subscribe(
          createOperatorSubscriber(subscriber, (value) => {
            // Get the index of the value we have right now
            // relative to all other values we've seen, then
            // increment `seen`. This ensures we've moved to
            // the next slot in our ring buffer.
            const valueIndex = seen++;
            if (valueIndex < skipCount) {
              // If we haven't seen enough values to fill our buffer yet,
              // Then we aren't to a number of seen values where we can
              // emit anything, so let's just start by filling the ring buffer.
              ring[valueIndex] = value;
            } else {
              // We are traversing over the ring array in such
              // a way that when we get to the end, we loop back
              // and go to the start.
              const index = valueIndex % skipCount;
              // Pull the oldest value out so we can emit it,
              // and stuff the new value in it's place.
              const oldValue = ring[index];
              ring[index] = value;
              // Emit the old value. It is important that this happens
              // after we swap the value in the buffer, if it happens
              // before we swap the value in the buffer, then a synchronous
              // source can get the buffer out of whack.
              subscriber.next(oldValue);
            }
          })
        );

        return () => {
          // Release our values in memory
          ring = null!;
        };
      });
}
import { Observable } from '../Observable';
import { MonoTypeOperatorFunction } from '../types';
import { operate } from '../util/lift';
import { createOperatorSubscriber } from './OperatorSubscriber';
import { innerFrom } from '../observable/innerFrom';
import { noop } from '../util/noop';

/**
 * Returns an Observable that skips items emitted by the source Observable until a second Observable emits an item.
 *
 * The `skipUntil` operator causes the observable stream to skip the emission of values until the passed in observable emits the first value.
 * This can be particularly useful in combination with user interactions, responses of http requests or waiting for specific times to pass by.
 *
 * ![](skipUntil.png)
 *
 * Internally the `skipUntil` operator subscribes to the passed in observable (in the following called *notifier*) in order to recognize the emission
 * of its first value. When this happens, the operator unsubscribes from the *notifier* and starts emitting the values of the *source*
 * observable. It will never let the *source* observable emit any values if the *notifier* completes or throws an error without emitting
 * a value before.
 *
 * ## Example
 *
 * In the following example, all emitted values of the interval observable are skipped until the user clicks anywhere within the page
 *
 * ```ts
 * import { interval, fromEvent, skipUntil } from 'rxjs';
 *
 * const intervalObservable = interval(1000);
 * const click = fromEvent(document, 'click');
 *
 * const emitAfterClick = intervalObservable.pipe(
 *   skipUntil(click)
 * );
 * // clicked at 4.6s. output: 5...6...7...8........ or
 * // clicked at 7.3s. output: 8...9...10..11.......
 * emitAfterClick.subscribe(value => console.log(value));
 * ```
 *
 * @see {@link last}
 * @see {@link skip}
 * @see {@link skipWhile}
 * @see {@link skipLast}
 *
 * @param {Observable} notifier - The second Observable that has to emit an item before the source Observable's elements begin to
 * be mirrored by the resulting Observable.
 * @return A function that returns an Observable that skips items from the
 * source Observable until the second Observable emits an item, then emits the
 * remaining items.
 */
export function skipUntil<T>(notifier: Observable<any>): MonoTypeOperatorFunction<T> {
  return operate((source, subscriber) => {
    let taking = false;

    const skipSubscriber = createOperatorSubscriber(
      subscriber,
      () => {
        skipSubscriber?.unsubscribe();
        taking = true;
      },
      noop
    );

    innerFrom(notifier).subscribe(skipSubscriber);

    source.subscribe(createOperatorSubscriber(subscriber, (value) => taking && subscriber.next(value)));
  });
}
import { Falsy, MonoTypeOperatorFunction, OperatorFunction } from '../types';
import { operate } from '../util/lift';
import { createOperatorSubscriber } from './OperatorSubscriber';

export function skipWhile<T>(predicate: BooleanConstructor): OperatorFunction<T, Extract<T, Falsy> extends never ? never : T>;
export function skipWhile<T>(predicate: (value: T, index: number) => true): OperatorFunction<T, never>;
export function skipWhile<T>(predicate: (value: T, index: number) => boolean): MonoTypeOperatorFunction<T>;

/**
 * Returns an Observable that skips all items emitted by the source Observable as long as a specified condition holds
 * true, but emits all further source items as soon as the condition becomes false.
 *
 * ![](skipWhile.png)
 *
 * Skips all the notifications with a truthy predicate. It will not skip the notifications when the predicate is falsy.
 * It can also be skipped using index. Once the predicate is true, it will not be called again.
 *
 * ## Example
 *
 * Skip some super heroes
 *
 * ```ts
 * import { from, skipWhile } from 'rxjs';
 *
 * const source = from(['Green Arrow', 'SuperMan', 'Flash', 'SuperGirl', 'Black Canary'])
 * // Skip the heroes until SuperGirl
 * const example = source.pipe(skipWhile(hero => hero !== 'SuperGirl'));
 * // output: SuperGirl, Black Canary
 * example.subscribe(femaleHero => console.log(femaleHero));
 * ```
 *
 * Skip values from the array until index 5
 *
 * ```ts
 * import { from, skipWhile } from 'rxjs';
 *
 * const source = from([1, 2, 3, 4, 5, 6, 7, 9, 10]);
 * const example = source.pipe(skipWhile((_, i) => i !== 5));
 * // output: 6, 7, 9, 10
 * example.subscribe(value => console.log(value));
 * ```
 *
 * @see {@link last}
 * @see {@link skip}
 * @see {@link skipUntil}
 * @see {@link skipLast}
 *
 * @param {Function} predicate - A function to test each item emitted from the source Observable.
 * @return A function that returns an Observable that begins emitting items
 * emitted by the source Observable when the specified predicate becomes false.
 */
export function skipWhile<T>(predicate: (value: T, index: number) => boolean): MonoTypeOperatorFunction<T> {
  return operate((source, subscriber) => {
    let taking = false;
    let index = 0;
    source.subscribe(
      createOperatorSubscriber(subscriber, (value) => (taking || (taking = !predicate(value, index++))) && subscriber.next(value))
    );
  });
}
import { concat } from '../observable/concat';
import { OperatorFunction, SchedulerLike, ValueFromArray } from '../types';
import { popScheduler } from '../util/args';
import { operate } from '../util/lift';

// Devs are more likely to pass null or undefined than they are a scheduler
// without accompanying values. To make things easier for (naughty) devs who
// use the `strictNullChecks: false` TypeScript compiler option, these
// overloads with explicit null and undefined values are included.

export function startWith<T>(value: null): OperatorFunction<T, T | null>;
export function startWith<T>(value: undefined): OperatorFunction<T, T | undefined>;

/** @deprecated The `scheduler` parameter will be removed in v8. Use `scheduled` and `concatAll`. Details: https://rxjs.dev/deprecations/scheduler-argument */
export function startWith<T, A extends readonly unknown[] = T[]>(
  ...valuesAndScheduler: [...A, SchedulerLike]
): OperatorFunction<T, T | ValueFromArray<A>>;
export function startWith<T, A extends readonly unknown[] = T[]>(...values: A): OperatorFunction<T, T | ValueFromArray<A>>;

/**
 * Returns an observable that, at the moment of subscription, will synchronously emit all
 * values provided to this operator, then subscribe to the source and mirror all of its emissions
 * to subscribers.
 *
 * This is a useful way to know when subscription has occurred on an existing observable.
 *
 * <span class="informal">First emits its arguments in order, and then any
 * emissions from the source.</span>
 *
 * ![](startWith.png)
 *
 * ## Examples
 *
 * Emit a value when a timer starts.
 *
 * ```ts
 * import { timer, map, startWith } from 'rxjs';
 *
 * timer(1000)
 *   .pipe(
 *     map(() => 'timer emit'),
 *     startWith('timer start')
 *   )
 *   .subscribe(x => console.log(x));
 *
 * // results:
 * // 'timer start'
 * // 'timer emit'
 * ```
 *
 * @param values Items you want the modified Observable to emit first.
 * @return A function that returns an Observable that synchronously emits
 * provided values before subscribing to the source Observable.
 *
 * @see {@link endWith}
 * @see {@link finalize}
 * @see {@link concat}
 */
export function startWith<T, D>(...values: D[]): OperatorFunction<T, T | D> {
  const scheduler = popScheduler(values);
  return operate((source, subscriber) => {
    // Here we can't pass `undefined` as a scheduler, because if we did, the
    // code inside of `concat` would be confused by the `undefined`, and treat it
    // like an invalid observable. So we have to split it two different ways.
    (scheduler ? concat(values, source, scheduler) : concat(values, source)).subscribe(subscriber);
  });
}
import { MonoTypeOperatorFunction, SchedulerLike } from '../types';
import { operate } from '../util/lift';

/**
 * Asynchronously subscribes Observers to this Observable on the specified {@link SchedulerLike}.
 *
 * With `subscribeOn` you can decide what type of scheduler a specific Observable will be using when it is subscribed to.
 *
 * Schedulers control the speed and order of emissions to observers from an Observable stream.
 *
 * ![](subscribeOn.png)
 *
 * ## Example
 *
 * Given the following code:
 *
 * ```ts
 * import { of, merge } from 'rxjs';
 *
 * const a = of(1, 2, 3);
 * const b = of(4, 5, 6);
 *
 * merge(a, b).subscribe(console.log);
 *
 * // Outputs
 * // 1
 * // 2
 * // 3
 * // 4
 * // 5
 * // 6
 * ```
 *
 * Both Observable `a` and `b` will emit their values directly and synchronously once they are subscribed to.
 *
 * If we instead use the `subscribeOn` operator declaring that we want to use the {@link asyncScheduler} for values emitted by Observable `a`:
 *
 * ```ts
 * import { of, subscribeOn, asyncScheduler, merge } from 'rxjs';
 *
 * const a = of(1, 2, 3).pipe(subscribeOn(asyncScheduler));
 * const b = of(4, 5, 6);
 *
 * merge(a, b).subscribe(console.log);
 *
 * // Outputs
 * // 4
 * // 5
 * // 6
 * // 1
 * // 2
 * // 3
 * ```
 *
 * The reason for this is that Observable `b` emits its values directly and synchronously like before
 * but the emissions from `a` are scheduled on the event loop because we are now using the {@link asyncScheduler} for that specific Observable.
 *
 * @param scheduler The {@link SchedulerLike} to perform subscription actions on.
 * @param delay A delay to pass to the scheduler to delay subscriptions
 * @return A function that returns an Observable modified so that its
 * subscriptions happen on the specified {@link SchedulerLike}.
 */
export function subscribeOn<T>(scheduler: SchedulerLike, delay: number = 0): MonoTypeOperatorFunction<T> {
  return operate((source, subscriber) => {
    subscriber.add(scheduler.schedule(() => source.subscribe(subscriber), delay));
  });
}
import { OperatorFunction, ObservableInput, ObservedValueOf } from '../types';
import { switchMap } from './switchMap';
import { identity } from '../util/identity';

/**
 * Converts a higher-order Observable into a first-order Observable
 * producing values only from the most recent observable sequence
 *
 * <span class="informal">Flattens an Observable-of-Observables.</span>
 *
 * ![](switchAll.png)
 *
 * `switchAll` subscribes to a source that is an observable of observables, also known as a
 * "higher-order observable" (or `Observable<Observable<T>>`). It subscribes to the most recently
 * provided "inner observable" emitted by the source, unsubscribing from any previously subscribed
 * to inner observable, such that only the most recent inner observable may be subscribed to at
 * any point in time. The resulting observable returned by `switchAll` will only complete if the
 * source observable completes, *and* any currently subscribed to inner observable also has completed,
 * if there are any.
 *
 * ## Examples
 *
 * Spawn a new interval observable for each click event, but for every new
 * click, cancel the previous interval and subscribe to the new one
 *
 * ```ts
 * import { fromEvent, tap, map, interval, switchAll } from 'rxjs';
 *
 * const clicks = fromEvent(document, 'click').pipe(tap(() => console.log('click')));
 * const source = clicks.pipe(map(() => interval(1000)));
 *
 * source
 *   .pipe(switchAll())
 *   .subscribe(x => console.log(x));
 *
 * // Output
 * // click
 * // 0
 * // 1
 * // 2
 * // 3
 * // ...
 * // click
 * // 0
 * // 1
 * // 2
 * // ...
 * // click
 * // ...
 * ```
 *
 * @see {@link combineLatestAll}
 * @see {@link concatAll}
 * @see {@link exhaustAll}
 * @see {@link switchMap}
 * @see {@link switchMapTo}
 * @see {@link mergeAll}
 *
 * @return A function that returns an Observable that converts a higher-order
 * Observable into a first-order Observable producing values only from the most
 * recent Observable sequence.
 */
export function switchAll<O extends ObservableInput<any>>(): OperatorFunction<O, ObservedValueOf<O>> {
  return switchMap(identity);
}
import { Subscriber } from '../Subscriber';
import { ObservableInput, OperatorFunction, ObservedValueOf } from '../types';
import { innerFrom } from '../observable/innerFrom';
import { operate } from '../util/lift';
import { createOperatorSubscriber } from './OperatorSubscriber';

/* tslint:disable:max-line-length */
export function switchMap<T, O extends ObservableInput<any>>(
  project: (value: T, index: number) => O
): OperatorFunction<T, ObservedValueOf<O>>;
/** @deprecated The `resultSelector` parameter will be removed in v8. Use an inner `map` instead. Details: https://rxjs.dev/deprecations/resultSelector */
export function switchMap<T, O extends ObservableInput<any>>(
  project: (value: T, index: number) => O,
  resultSelector: undefined
): OperatorFunction<T, ObservedValueOf<O>>;
/** @deprecated The `resultSelector` parameter will be removed in v8. Use an inner `map` instead. Details: https://rxjs.dev/deprecations/resultSelector */
export function switchMap<T, R, O extends ObservableInput<any>>(
  project: (value: T, index: number) => O,
  resultSelector: (outerValue: T, innerValue: ObservedValueOf<O>, outerIndex: number, innerIndex: number) => R
): OperatorFunction<T, R>;
/* tslint:enable:max-line-length */

/**
 * Projects each source value to an Observable which is merged in the output
 * Observable, emitting values only from the most recently projected Observable.
 *
 * <span class="informal">Maps each value to an Observable, then flattens all of
 * these inner Observables.</span>
 *
 * ![](switchMap.png)
 *
 * Returns an Observable that emits items based on applying a function that you
 * supply to each item emitted by the source Observable, where that function
 * returns an (so-called "inner") Observable. Each time it observes one of these
 * inner Observables, the output Observable begins emitting the items emitted by
 * that inner Observable. When a new inner Observable is emitted, `switchMap`
 * stops emitting items from the earlier-emitted inner Observable and begins
 * emitting items from the new one. It continues to behave like this for
 * subsequent inner Observables.
 *
 * ## Example
 *
 * Generate new Observable according to source Observable values
 *
 * ```ts
 * import { of, switchMap } from 'rxjs';
 *
 * const switched = of(1, 2, 3).pipe(switchMap(x => of(x, x ** 2, x ** 3)));
 * switched.subscribe(x => console.log(x));
 * // outputs
 * // 1
 * // 1
 * // 1
 * // 2
 * // 4
 * // 8
 * // 3
 * // 9
 * // 27
 * ```
 *
 * Restart an interval Observable on every click event
 *
 * ```ts
 * import { fromEvent, switchMap, interval } from 'rxjs';
 *
 * const clicks = fromEvent(document, 'click');
 * const result = clicks.pipe(switchMap(() => interval(1000)));
 * result.subscribe(x => console.log(x));
 * ```
 *
 * @see {@link concatMap}
 * @see {@link exhaustMap}
 * @see {@link mergeMap}
 * @see {@link switchAll}
 * @see {@link switchMapTo}
 *
 * @param {function(value: T, index: number): ObservableInput} project A function
 * that, when applied to an item emitted by the source Observable, returns an
 * Observable.
 * @return A function that returns an Observable that emits the result of
 * applying the projection function (and the optional deprecated
 * `resultSelector`) to each item emitted by the source Observable and taking
 * only the values from the most recently projected inner Observable.
 */
export function switchMap<T, R, O extends ObservableInput<any>>(
  project: (value: T, index: number) => O,
  resultSelector?: (outerValue: T, innerValue: ObservedValueOf<O>, outerIndex: number, innerIndex: number) => R
): OperatorFunction<T, ObservedValueOf<O> | R> {
  return operate((source, subscriber) => {
    let innerSubscriber: Subscriber<ObservedValueOf<O>> | null = null;
    let index = 0;
    // Whether or not the source subscription has completed
    let isComplete = false;

    // We only complete the result if the source is complete AND we don't have an active inner subscription.
    // This is called both when the source completes and when the inners complete.
    const checkComplete = () => isComplete && !innerSubscriber && subscriber.complete();

    source.subscribe(
      createOperatorSubscriber(
        subscriber,
        (value) => {
          // Cancel the previous inner subscription if there was one
          innerSubscriber?.unsubscribe();
          let innerIndex = 0;
          const outerIndex = index++;
          // Start the next inner subscription
          innerFrom(project(value, outerIndex)).subscribe(
            (innerSubscriber = createOperatorSubscriber(
              subscriber,
              // When we get a new inner value, next it through. Note that this is
              // handling the deprecate result selector here. This is because with this architecture
              // it ends up being smaller than using the map operator.
              (innerValue) => subscriber.next(resultSelector ? resultSelector(value, innerValue, outerIndex, innerIndex++) : innerValue),
              () => {
                // The inner has completed. Null out the inner subcriber to
                // free up memory and to signal that we have no inner subscription
                // currently.
                innerSubscriber = null!;
                checkComplete();
              }
            ))
          );
        },
        () => {
          isComplete = true;
          checkComplete();
        }
      )
    );
  });
}
import { switchMap } from './switchMap';
import { ObservableInput, OperatorFunction, ObservedValueOf } from '../types';
import { isFunction } from '../util/isFunction';

/** @deprecated Will be removed in v9. Use {@link switchMap} instead: `switchMap(() => result)` */
export function switchMapTo<O extends ObservableInput<unknown>>(observable: O): OperatorFunction<unknown, ObservedValueOf<O>>;
/** @deprecated The `resultSelector` parameter will be removed in v8. Use an inner `map` instead. Details: https://rxjs.dev/deprecations/resultSelector */
export function switchMapTo<O extends ObservableInput<unknown>>(
  observable: O,
  resultSelector: undefined
): OperatorFunction<unknown, ObservedValueOf<O>>;
/** @deprecated The `resultSelector` parameter will be removed in v8. Use an inner `map` instead. Details: https://rxjs.dev/deprecations/resultSelector */
export function switchMapTo<T, R, O extends ObservableInput<unknown>>(
  observable: O,
  resultSelector: (outerValue: T, innerValue: ObservedValueOf<O>, outerIndex: number, innerIndex: number) => R
): OperatorFunction<T, R>;

/**
 * Projects each source value to the same Observable which is flattened multiple
 * times with {@link switchMap} in the output Observable.
 *
 * <span class="informal">It's like {@link switchMap}, but maps each value
 * always to the same inner Observable.</span>
 *
 * ![](switchMapTo.png)
 *
 * Maps each source value to the given Observable `innerObservable` regardless
 * of the source value, and then flattens those resulting Observables into one
 * single Observable, which is the output Observable. The output Observables
 * emits values only from the most recently emitted instance of
 * `innerObservable`.
 *
 * ## Example
 *
 * Restart an interval Observable on every click event
 *
 * ```ts
 * import { fromEvent, switchMapTo, interval } from 'rxjs';
 *
 * const clicks = fromEvent(document, 'click');
 * const result = clicks.pipe(switchMapTo(interval(1000)));
 * result.subscribe(x => console.log(x));
 * ```
 *
 * @see {@link concatMapTo}
 * @see {@link switchAll}
 * @see {@link switchMap}
 * @see {@link mergeMapTo}
 *
 * @param {ObservableInput} innerObservable An Observable to replace each value from
 * the source Observable.
 * @return A function that returns an Observable that emits items from the
 * given `innerObservable` (and optionally transformed through the deprecated
 * `resultSelector`) every time a value is emitted on the source Observable,
 * and taking only the values from the most recently projected inner
 * Observable.
 * @deprecated Will be removed in v9. Use {@link switchMap} instead: `switchMap(() => result)`
 */
export function switchMapTo<T, R, O extends ObservableInput<unknown>>(
  innerObservable: O,
  resultSelector?: (outerValue: T, innerValue: ObservedValueOf<O>, outerIndex: number, innerIndex: number) => R
): OperatorFunction<T, ObservedValueOf<O> | R> {
  return isFunction(resultSelector) ? switchMap(() => innerObservable, resultSelector) : switchMap(() => innerObservable);
}
import { ObservableInput, ObservedValueOf, OperatorFunction } from '../types';
import { switchMap } from './switchMap';
import { operate } from '../util/lift';

// TODO: Generate a marble diagram for these docs.

/**
 * Applies an accumulator function over the source Observable where the
 * accumulator function itself returns an Observable, emitting values
 * only from the most recently returned Observable.
 *
 * <span class="informal">It's like {@link mergeScan}, but only the most recent
 * Observable returned by the accumulator is merged into the outer Observable.</span>
 *
 * @see {@link scan}
 * @see {@link mergeScan}
 * @see {@link switchMap}
 *
 * @param accumulator
 * The accumulator function called on each source value.
 * @param seed The initial accumulation value.
 * @return A function that returns an observable of the accumulated values.
 */
export function switchScan<T, R, O extends ObservableInput<any>>(
  accumulator: (acc: R, value: T, index: number) => O,
  seed: R
): OperatorFunction<T, ObservedValueOf<O>> {
  return operate((source, subscriber) => {
    // The state we will keep up to date to pass into our
    // accumulator function at each new value from the source.
    let state = seed;

    // Use `switchMap` on our `source` to do the work of creating
    // this operator. Note the backwards order here of `switchMap()(source)`
    // to avoid needing to use `pipe` unnecessarily
    switchMap(
      // On each value from the source, call the accumulator with
      // our previous state, the value and the index.
      (value: T, index) => accumulator(state, value, index),
      // Using the deprecated result selector here as a dirty trick
      // to update our state with the flattened value.
      (_, innerValue) => ((state = innerValue), innerValue)
    )(source).subscribe(subscriber);

    return () => {
      // Release state on finalization
      state = null!;
    };
  });
}
import { MonoTypeOperatorFunction } from '../types';
import { EMPTY } from '../observable/empty';
import { operate } from '../util/lift';
import { createOperatorSubscriber } from './OperatorSubscriber';

/**
 * Emits only the first `count` values emitted by the source Observable.
 *
 * <span class="informal">Takes the first `count` values from the source, then
 * completes.</span>
 *
 * ![](take.png)
 *
 * `take` returns an Observable that emits only the first `count` values emitted
 * by the source Observable. If the source emits fewer than `count` values then
 * all of its values are emitted. After that, it completes, regardless if the
 * source completes.
 *
 * ## Example
 *
 * Take the first 5 seconds of an infinite 1-second interval Observable
 *
 * ```ts
 * import { interval, take } from 'rxjs';
 *
 * const intervalCount = interval(1000);
 * const takeFive = intervalCount.pipe(take(5));
 * takeFive.subscribe(x => console.log(x));
 *
 * // Logs:
 * // 0
 * // 1
 * // 2
 * // 3
 * // 4
 * ```
 *
 * @see {@link takeLast}
 * @see {@link takeUntil}
 * @see {@link takeWhile}
 * @see {@link skip}
 *
 * @param count The maximum number of `next` values to emit.
 * @return A function that returns an Observable that emits only the first
 * `count` values emitted by the source Observable, or all of the values from
 * the source if the source emits fewer than `count` values.
 */
export function take<T>(count: number): MonoTypeOperatorFunction<T> {
  return count <= 0
    ? // If we are taking no values, that's empty.
      () => EMPTY
    : operate((source, subscriber) => {
        let seen = 0;
        source.subscribe(
          createOperatorSubscriber(subscriber, (value) => {
            // Increment the number of values we have seen,
            // then check it against the allowed count to see
            // if we are still letting values through.
            if (++seen <= count) {
              subscriber.next(value);
              // If we have met or passed our allowed count,
              // we need to complete. We have to do <= here,
              // because re-entrant code will increment `seen` twice.
              if (count <= seen) {
                subscriber.complete();
              }
            }
          })
        );
      });
}
import { EMPTY } from '../observable/empty';
import { MonoTypeOperatorFunction } from '../types';
import { operate } from '../util/lift';
import { createOperatorSubscriber } from './OperatorSubscriber';

/**
 * Waits for the source to complete, then emits the last N values from the source,
 * as specified by the `count` argument.
 *
 * ![](takeLast.png)
 *
 * `takeLast` results in an observable that will hold values up to `count` values in memory,
 * until the source completes. It then pushes all values in memory to the consumer, in the
 * order they were received from the source, then notifies the consumer that it is
 * complete.
 *
 * If for some reason the source completes before the `count` supplied to `takeLast` is reached,
 * all values received until that point are emitted, and then completion is notified.
 *
 * **Warning**: Using `takeLast` with an observable that never completes will result
 * in an observable that never emits a value.
 *
 * ## Example
 *
 * Take the last 3 values of an Observable with many values
 *
 * ```ts
 * import { range, takeLast } from 'rxjs';
 *
 * const many = range(1, 100);
 * const lastThree = many.pipe(takeLast(3));
 * lastThree.subscribe(x => console.log(x));
 * ```
 *
 * @see {@link take}
 * @see {@link takeUntil}
 * @see {@link takeWhile}
 * @see {@link skip}
 *
 * @param count The maximum number of values to emit from the end of
 * the sequence of values emitted by the source Observable.
 * @return A function that returns an Observable that emits at most the last
 * `count` values emitted by the source Observable.
 */
export function takeLast<T>(count: number): MonoTypeOperatorFunction<T> {
  return count <= 0
    ? () => EMPTY
    : operate((source, subscriber) => {
        // This buffer will hold the values we are going to emit
        // when the source completes. Since we only want to take the
        // last N values, we can't emit until we're sure we're not getting
        // any more values.
        let buffer: T[] = [];
        source.subscribe(
          createOperatorSubscriber(
            subscriber,
            (value) => {
              // Add the most recent value onto the end of our buffer.
              buffer.push(value);
              // If our buffer is now larger than the number of values we
              // want to take, we remove the oldest value from the buffer.
              count < buffer.length && buffer.shift();
            },
            () => {
              // The source completed, we now know what are last values
              // are, emit them in the order they were received.
              for (const value of buffer) {
                subscriber.next(value);
              }
              subscriber.complete();
            },
            // Errors are passed through to the consumer
            undefined,
            () => {
              // During finalization release the values in our buffer.
              buffer = null!;
            }
          )
        );
      });
}
import { MonoTypeOperatorFunction, ObservableInput } from '../types';
import { operate } from '../util/lift';
import { createOperatorSubscriber } from './OperatorSubscriber';
import { innerFrom } from '../observable/innerFrom';
import { noop } from '../util/noop';

/**
 * Emits the values emitted by the source Observable until a `notifier`
 * Observable emits a value.
 *
 * <span class="informal">Lets values pass until a second Observable,
 * `notifier`, emits a value. Then, it completes.</span>
 *
 * ![](takeUntil.png)
 *
 * `takeUntil` subscribes and begins mirroring the source Observable. It also
 * monitors a second Observable, `notifier` that you provide. If the `notifier`
 * emits a value, the output Observable stops mirroring the source Observable
 * and completes. If the `notifier` doesn't emit any value and completes
 * then `takeUntil` will pass all values.
 *
 * ## Example
 *
 * Tick every second until the first click happens
 *
 * ```ts
 * import { interval, fromEvent, takeUntil } from 'rxjs';
 *
 * const source = interval(1000);
 * const clicks = fromEvent(document, 'click');
 * const result = source.pipe(takeUntil(clicks));
 * result.subscribe(x => console.log(x));
 * ```
 *
 * @see {@link take}
 * @see {@link takeLast}
 * @see {@link takeWhile}
 * @see {@link skip}
 *
 * @param {Observable} notifier The Observable whose first emitted value will
 * cause the output Observable of `takeUntil` to stop emitting values from the
 * source Observable.
 * @return A function that returns an Observable that emits the values from the
 * source Observable until `notifier` emits its first value.
 */
export function takeUntil<T>(notifier: ObservableInput<any>): MonoTypeOperatorFunction<T> {
  return operate((source, subscriber) => {
    innerFrom(notifier).subscribe(createOperatorSubscriber(subscriber, () => subscriber.complete(), noop));
    !subscriber.closed && source.subscribe(subscriber);
  });
}
import { OperatorFunction, MonoTypeOperatorFunction, TruthyTypesOf } from '../types';
import { operate } from '../util/lift';
import { createOperatorSubscriber } from './OperatorSubscriber';

export function takeWhile<T>(predicate: BooleanConstructor, inclusive: true): MonoTypeOperatorFunction<T>;
export function takeWhile<T>(predicate: BooleanConstructor, inclusive: false): OperatorFunction<T, TruthyTypesOf<T>>;
export function takeWhile<T>(predicate: BooleanConstructor): OperatorFunction<T, TruthyTypesOf<T>>;
export function takeWhile<T, S extends T>(predicate: (value: T, index: number) => value is S): OperatorFunction<T, S>;
export function takeWhile<T, S extends T>(predicate: (value: T, index: number) => value is S, inclusive: false): OperatorFunction<T, S>;
export function takeWhile<T>(predicate: (value: T, index: number) => boolean, inclusive?: boolean): MonoTypeOperatorFunction<T>;

/**
 * Emits values emitted by the source Observable so long as each value satisfies
 * the given `predicate`, and then completes as soon as this `predicate` is not
 * satisfied.
 *
 * <span class="informal">Takes values from the source only while they pass the
 * condition given. When the first value does not satisfy, it completes.</span>
 *
 * ![](takeWhile.png)
 *
 * `takeWhile` subscribes and begins mirroring the source Observable. Each value
 * emitted on the source is given to the `predicate` function which returns a
 * boolean, representing a condition to be satisfied by the source values. The
 * output Observable emits the source values until such time as the `predicate`
 * returns false, at which point `takeWhile` stops mirroring the source
 * Observable and completes the output Observable.
 *
 * ## Example
 *
 * Emit click events only while the clientX property is greater than 200
 *
 * ```ts
 * import { fromEvent, takeWhile } from 'rxjs';
 *
 * const clicks = fromEvent<PointerEvent>(document, 'click');
 * const result = clicks.pipe(takeWhile(ev => ev.clientX > 200));
 * result.subscribe(x => console.log(x));
 * ```
 *
 * @see {@link take}
 * @see {@link takeLast}
 * @see {@link takeUntil}
 * @see {@link skip}
 *
 * @param {function(value: T, index: number): boolean} predicate A function that
 * evaluates a value emitted by the source Observable and returns a boolean.
 * Also takes the (zero-based) index as the second argument.
 * @param {boolean} inclusive When set to `true` the value that caused
 * `predicate` to return `false` will also be emitted.
 * @return A function that returns an Observable that emits values from the
 * source Observable so long as each value satisfies the condition defined by
 * the `predicate`, then completes.
 */
export function takeWhile<T>(predicate: (value: T, index: number) => boolean, inclusive = false): MonoTypeOperatorFunction<T> {
  return operate((source, subscriber) => {
    let index = 0;
    source.subscribe(
      createOperatorSubscriber(subscriber, (value) => {
        const result = predicate(value, index++);
        (result || inclusive) && subscriber.next(value);
        !result && subscriber.complete();
      })
    );
  });
}
import { MonoTypeOperatorFunction, Observer } from '../types';
import { isFunction } from '../util/isFunction';
import { operate } from '../util/lift';
import { createOperatorSubscriber } from './OperatorSubscriber';
import { identity } from '../util/identity';

export interface TapObserver<T> extends Observer<T> {
  subscribe: () => void;
  unsubscribe: () => void;
  finalize: () => void;
}

export function tap<T>(observer?: Partial<TapObserver<T>>): MonoTypeOperatorFunction<T>;
export function tap<T>(next: (value: T) => void): MonoTypeOperatorFunction<T>;
/** @deprecated Instead of passing separate callback arguments, use an observer argument. Signatures taking separate callback arguments will be removed in v8. Details: https://rxjs.dev/deprecations/subscribe-arguments */
export function tap<T>(
  next?: ((value: T) => void) | null,
  error?: ((error: any) => void) | null,
  complete?: (() => void) | null
): MonoTypeOperatorFunction<T>;

/**
 * Used to perform side-effects for notifications from the source observable
 *
 * <span class="informal">Used when you want to affect outside state with a notification without altering the notification</span>
 *
 * ![](tap.png)
 *
 * Tap is designed to allow the developer a designated place to perform side effects. While you _could_ perform side-effects
 * inside of a `map` or a `mergeMap`, that would make their mapping functions impure, which isn't always a big deal, but will
 * make it so you can't do things like memoize those functions. The `tap` operator is designed solely for such side-effects to
 * help you remove side-effects from other operations.
 *
 * For any notification, next, error, or complete, `tap` will call the appropriate callback you have provided to it, via a function
 * reference, or a partial observer, then pass that notification down the stream.
 *
 * The observable returned by `tap` is an exact mirror of the source, with one exception: Any error that occurs -- synchronously -- in a handler
 * provided to `tap` will be emitted as an error from the returned observable.
 *
 * > Be careful! You can mutate objects as they pass through the `tap` operator's handlers.
 *
 * The most common use of `tap` is actually for debugging. You can place a `tap(console.log)` anywhere
 * in your observable `pipe`, log out the notifications as they are emitted by the source returned by the previous
 * operation.
 *
 * ## Examples
 *
 * Check a random number before it is handled. Below is an observable that will use a random number between 0 and 1,
 * and emit `'big'` or `'small'` depending on the size of that number. But we wanted to log what the original number
 * was, so we have added a `tap(console.log)`.
 *
 * ```ts
 * import { of, tap, map } from 'rxjs';
 *
 * of(Math.random()).pipe(
 *   tap(console.log),
 *   map(n => n > 0.5 ? 'big' : 'small')
 * ).subscribe(console.log);
 * ```
 *
 * Using `tap` to analyze a value and force an error. Below is an observable where in our system we only
 * want to emit numbers 3 or less we get from another source. We can force our observable to error
 * using `tap`.
 *
 * ```ts
 * import { of, tap } from 'rxjs';
 *
 * const source = of(1, 2, 3, 4, 5);
 *
 * source.pipe(
 *   tap(n => {
 *     if (n > 3) {
 *       throw new TypeError(`Value ${ n } is greater than 3`);
 *     }
 *   })
 * )
 * .subscribe({ next: console.log, error: err => console.log(err.message) });
 * ```
 *
 * We want to know when an observable completes before moving on to the next observable. The system
 * below will emit a random series of `'X'` characters from 3 different observables in sequence. The
 * only way we know when one observable completes and moves to the next one, in this case, is because
 * we have added a `tap` with the side effect of logging to console.
 *
 * ```ts
 * import { of, concatMap, interval, take, map, tap } from 'rxjs';
 *
 * of(1, 2, 3).pipe(
 *   concatMap(n => interval(1000).pipe(
 *     take(Math.round(Math.random() * 10)),
 *     map(() => 'X'),
 *     tap({ complete: () => console.log(`Done with ${ n }`) })
 *   ))
 * )
 * .subscribe(console.log);
 * ```
 *
 * @see {@link finalize}
 * @see {@link Observable#subscribe}
 *
 * @param observerOrNext A next handler or partial observer
 * @param error An error handler
 * @param complete A completion handler
 * @return A function that returns an Observable identical to the source, but
 * runs the specified Observer or callback(s) for each item.
 */
export function tap<T>(
  observerOrNext?: Partial<TapObserver<T>> | ((value: T) => void) | null,
  error?: ((e: any) => void) | null,
  complete?: (() => void) | null
): MonoTypeOperatorFunction<T> {
  // We have to check to see not only if next is a function,
  // but if error or complete were passed. This is because someone
  // could technically call tap like `tap(null, fn)` or `tap(null, null, fn)`.
  const tapObserver =
    isFunction(observerOrNext) || error || complete
      ? // tslint:disable-next-line: no-object-literal-type-assertion
        ({ next: observerOrNext as Exclude<typeof observerOrNext, Partial<TapObserver<T>>>, error, complete } as Partial<TapObserver<T>>)
      : observerOrNext;

  return tapObserver
    ? operate((source, subscriber) => {
        tapObserver.subscribe?.();
        let isUnsub = true;
        source.subscribe(
          createOperatorSubscriber(
            subscriber,
            (value) => {
              tapObserver.next?.(value);
              subscriber.next(value);
            },
            () => {
              isUnsub = false;
              tapObserver.complete?.();
              subscriber.complete();
            },
            (err) => {
              isUnsub = false;
              tapObserver.error?.(err);
              subscriber.error(err);
            },
            () => {
              if (isUnsub) {
                tapObserver.unsubscribe?.();
              }
              tapObserver.finalize?.();
            }
          )
        );
      })
    : // Tap was called with no valid tap observer or handler
      // (e.g. `tap(null, null, null)` or `tap(null)` or `tap()`)
      // so we're going to just mirror the source.
      identity;
}
import { Subscription } from '../Subscription';

import { MonoTypeOperatorFunction, ObservableInput } from '../types';
import { operate } from '../util/lift';
import { createOperatorSubscriber } from './OperatorSubscriber';
import { innerFrom } from '../observable/innerFrom';

export interface ThrottleConfig {
  leading?: boolean;
  trailing?: boolean;
}

export const defaultThrottleConfig: ThrottleConfig = {
  leading: true,
  trailing: false,
};

/**
 * Emits a value from the source Observable, then ignores subsequent source
 * values for a duration determined by another Observable, then repeats this
 * process.
 *
 * <span class="informal">It's like {@link throttleTime}, but the silencing
 * duration is determined by a second Observable.</span>
 *
 * ![](throttle.svg)
 *
 * `throttle` emits the source Observable values on the output Observable
 * when its internal timer is disabled, and ignores source values when the timer
 * is enabled. Initially, the timer is disabled. As soon as the first source
 * value arrives, it is forwarded to the output Observable, and then the timer
 * is enabled by calling the `durationSelector` function with the source value,
 * which returns the "duration" Observable. When the duration Observable emits a
 * value, the timer is disabled, and this process repeats for the
 * next source value.
 *
 * ## Example
 *
 * Emit clicks at a rate of at most one click per second
 *
 * ```ts
 * import { fromEvent, throttle, interval } from 'rxjs';
 *
 * const clicks = fromEvent(document, 'click');
 * const result = clicks.pipe(throttle(() => interval(1000)));
 *
 * result.subscribe(x => console.log(x));
 * ```
 *
 * @see {@link audit}
 * @see {@link debounce}
 * @see {@link delayWhen}
 * @see {@link sample}
 * @see {@link throttleTime}
 *
 * @param durationSelector A function
 * that receives a value from the source Observable, for computing the silencing
 * duration for each source value, returned as an Observable or a Promise.
 * @param config a configuration object to define `leading` and `trailing` behavior. Defaults
 * to `{ leading: true, trailing: false }`.
 * @return A function that returns an Observable that performs the throttle
 * operation to limit the rate of emissions from the source.
 */
export function throttle<T>(
  durationSelector: (value: T) => ObservableInput<any>,
  config: ThrottleConfig = defaultThrottleConfig
): MonoTypeOperatorFunction<T> {
  return operate((source, subscriber) => {
    const { leading, trailing } = config;
    let hasValue = false;
    let sendValue: T | null = null;
    let throttled: Subscription | null = null;
    let isComplete = false;

    const endThrottling = () => {
      throttled?.unsubscribe();
      throttled = null;
      if (trailing) {
        send();
        isComplete && subscriber.complete();
      }
    };

    const cleanupThrottling = () => {
      throttled = null;
      isComplete && subscriber.complete();
    };

    const startThrottle = (value: T) =>
      (throttled = innerFrom(durationSelector(value)).subscribe(createOperatorSubscriber(subscriber, endThrottling, cleanupThrottling)));

    const send = () => {
      if (hasValue) {
        // Ensure we clear out our value and hasValue flag
        // before we emit, otherwise reentrant code can cause
        // issues here.
        hasValue = false;
        const value = sendValue!;
        sendValue = null;
        // Emit the value.
        subscriber.next(value);
        !isComplete && startThrottle(value);
      }
    };

    source.subscribe(
      createOperatorSubscriber(
        subscriber,
        // Regarding the presence of throttled.closed in the following
        // conditions, if a synchronous duration selector is specified - weird,
        // but legal - an already-closed subscription will be assigned to
        // throttled, so the subscription's closed property needs to be checked,
        // too.
        (value) => {
          hasValue = true;
          sendValue = value;
          !(throttled && !throttled.closed) && (leading ? send() : startThrottle(value));
        },
        () => {
          isComplete = true;
          !(trailing && hasValue && throttled && !throttled.closed) && subscriber.complete();
        }
      )
    );
  });
}
import { asyncScheduler } from '../scheduler/async';
import { defaultThrottleConfig, throttle } from './throttle';
import { MonoTypeOperatorFunction, SchedulerLike } from '../types';
import { timer } from '../observable/timer';

/**
 * Emits a value from the source Observable, then ignores subsequent source
 * values for `duration` milliseconds, then repeats this process.
 *
 * <span class="informal">Lets a value pass, then ignores source values for the
 * next `duration` milliseconds.</span>
 *
 * ![](throttleTime.png)
 *
 * `throttleTime` emits the source Observable values on the output Observable
 * when its internal timer is disabled, and ignores source values when the timer
 * is enabled. Initially, the timer is disabled. As soon as the first source
 * value arrives, it is forwarded to the output Observable, and then the timer
 * is enabled. After `duration` milliseconds (or the time unit determined
 * internally by the optional `scheduler`) has passed, the timer is disabled,
 * and this process repeats for the next source value. Optionally takes a
 * {@link SchedulerLike} for managing timers.
 *
 * ## Examples
 *
 * ### Limit click rate
 *
 * Emit clicks at a rate of at most one click per second
 *
 * ```ts
 * import { fromEvent, throttleTime } from 'rxjs';
 *
 * const clicks = fromEvent(document, 'click');
 * const result = clicks.pipe(throttleTime(1000));
 *
 * result.subscribe(x => console.log(x));
 * ```
 *
 * @see {@link auditTime}
 * @see {@link debounceTime}
 * @see {@link delay}
 * @see {@link sampleTime}
 * @see {@link throttle}
 *
 * @param duration Time to wait before emitting another value after
 * emitting the last value, measured in milliseconds or the time unit determined
 * internally by the optional `scheduler`.
 * @param scheduler The {@link SchedulerLike} to use for
 * managing the timers that handle the throttling. Defaults to {@link asyncScheduler}.
 * @param config a configuration object to define `leading` and
 * `trailing` behavior. Defaults to `{ leading: true, trailing: false }`.
 * @return A function that returns an Observable that performs the throttle
 * operation to limit the rate of emissions from the source.
 */
export function throttleTime<T>(
  duration: number,
  scheduler: SchedulerLike = asyncScheduler,
  config = defaultThrottleConfig
): MonoTypeOperatorFunction<T> {
  const duration$ = timer(duration, scheduler);
  return throttle(() => duration$, config);
}
import { EmptyError } from '../util/EmptyError';
import { MonoTypeOperatorFunction } from '../types';
import { operate } from '../util/lift';
import { createOperatorSubscriber } from './OperatorSubscriber';

/**
 * If the source observable completes without emitting a value, it will emit
 * an error. The error will be created at that time by the optional
 * `errorFactory` argument, otherwise, the error will be {@link EmptyError}.
 *
 * ![](throwIfEmpty.png)
 *
 * ## Example
 *
 * Throw an error if the document wasn't clicked within 1 second
 *
 * ```ts
 * import { fromEvent, takeUntil, timer, throwIfEmpty } from 'rxjs';
 *
 * const click$ = fromEvent(document, 'click');
 *
 * click$.pipe(
 *   takeUntil(timer(1000)),
 *   throwIfEmpty(() => new Error('The document was not clicked within 1 second'))
 * )
 * .subscribe({
 *   next() {
 *    console.log('The document was clicked');
 *   },
 *   error(err) {
 *     console.error(err.message);
 *   }
 * });
 * ```
 *
 * @param errorFactory A factory function called to produce the
 * error to be thrown when the source observable completes without emitting a
 * value.
 * @return A function that returns an Observable that throws an error if the
 * source Observable completed without emitting.
 */
export function throwIfEmpty<T>(errorFactory: () => any = defaultErrorFactory): MonoTypeOperatorFunction<T> {
  return operate((source, subscriber) => {
    let hasValue = false;
    source.subscribe(
      createOperatorSubscriber(
        subscriber,
        (value) => {
          hasValue = true;
          subscriber.next(value);
        },
        () => (hasValue ? subscriber.complete() : subscriber.error(errorFactory()))
      )
    );
  });
}

function defaultErrorFactory() {
  return new EmptyError();
}
import { asyncScheduler } from '../scheduler/async';
import { SchedulerLike, OperatorFunction } from '../types';
import { operate } from '../util/lift';
import { createOperatorSubscriber } from './OperatorSubscriber';

/**
 * Emits an object containing the current value, and the time that has
 * passed between emitting the current value and the previous value, which is
 * calculated by using the provided `scheduler`'s `now()` method to retrieve
 * the current time at each emission, then calculating the difference. The `scheduler`
 * defaults to {@link asyncScheduler}, so by default, the `interval` will be in
 * milliseconds.
 *
 * <span class="informal">Convert an Observable that emits items into one that
 * emits indications of the amount of time elapsed between those emissions.</span>
 *
 * ![](timeInterval.png)
 *
 * ## Example
 *
 * Emit interval between current value with the last value
 *
 * ```ts
 * import { interval, timeInterval } from 'rxjs';
 *
 * const seconds = interval(1000);
 *
 * seconds
 *   .pipe(timeInterval())
 *   .subscribe(value => console.log(value));
 *
 * // NOTE: The values will never be this precise,
 * // intervals created with `interval` or `setInterval`
 * // are non-deterministic.
 *
 * // { value: 0, interval: 1000 }
 * // { value: 1, interval: 1000 }
 * // { value: 2, interval: 1000 }
 * ```
 *
 * @param {SchedulerLike} [scheduler] Scheduler used to get the current time.
 * @return A function that returns an Observable that emits information about
 * value and interval.
 */
export function timeInterval<T>(scheduler: SchedulerLike = asyncScheduler): OperatorFunction<T, TimeInterval<T>> {
  return operate((source, subscriber) => {
    let last = scheduler.now();
    source.subscribe(
      createOperatorSubscriber(subscriber, (value) => {
        const now = scheduler.now();
        const interval = now - last;
        last = now;
        subscriber.next(new TimeInterval(value, interval));
      })
    );
  });
}

// TODO(benlesh): make this an interface, export the interface, but not the implemented class,
// there's no reason users should be manually creating this type.

export class TimeInterval<T> {
  /**
   * @deprecated Internal implementation detail, do not construct directly. Will be made an interface in v8.
   */
  constructor(public value: T, public interval: number) {}
}
import { asyncScheduler } from '../scheduler/async';
import { MonoTypeOperatorFunction, SchedulerLike, OperatorFunction, ObservableInput, ObservedValueOf } from '../types';
import { isValidDate } from '../util/isDate';
import { Subscription } from '../Subscription';
import { operate } from '../util/lift';
import { Observable } from '../Observable';
import { innerFrom } from '../observable/innerFrom';
import { createErrorClass } from '../util/createErrorClass';
import { createOperatorSubscriber } from './OperatorSubscriber';
import { executeSchedule } from '../util/executeSchedule';

export interface TimeoutConfig<T, O extends ObservableInput<unknown> = ObservableInput<T>, M = unknown> {
  /**
   * The time allowed between values from the source before timeout is triggered.
   */
  each?: number;

  /**
   * The relative time as a `number` in milliseconds, or a specific time as a `Date` object,
   * by which the first value must arrive from the source before timeout is triggered.
   */
  first?: number | Date;

  /**
   * The scheduler to use with time-related operations within this operator. Defaults to {@link asyncScheduler}
   */
  scheduler?: SchedulerLike;

  /**
   * A factory used to create observable to switch to when timeout occurs. Provides
   * a {@link TimeoutInfo} about the source observable's emissions and what delay or
   * exact time triggered the timeout.
   */
  with?: (info: TimeoutInfo<T, M>) => O;

  /**
   * Optional additional metadata you can provide to code that handles
   * the timeout, will be provided through the {@link TimeoutError}.
   * This can be used to help identify the source of a timeout or pass along
   * other information related to the timeout.
   */
  meta?: M;
}

export interface TimeoutInfo<T, M = unknown> {
  /** Optional metadata that was provided to the timeout configuration. */
  readonly meta: M;
  /** The number of messages seen before the timeout */
  readonly seen: number;
  /** The last message seen */
  readonly lastValue: T | null;
}

/**
 * An error emitted when a timeout occurs.
 */
export interface TimeoutError<T = unknown, M = unknown> extends Error {
  /**
   * The information provided to the error by the timeout
   * operation that created the error. Will be `null` if
   * used directly in non-RxJS code with an empty constructor.
   * (Note that using this constructor directly is not recommended,
   * you should create your own errors)
   */
  info: TimeoutInfo<T, M> | null;
}

export interface TimeoutErrorCtor {
  /**
   * @deprecated Internal implementation detail. Do not construct error instances.
   * Cannot be tagged as internal: https://github.com/ReactiveX/rxjs/issues/6269
   */
  new <T = unknown, M = unknown>(info?: TimeoutInfo<T, M>): TimeoutError<T, M>;
}

/**
 * An error thrown by the {@link timeout} operator.
 *
 * Provided so users can use as a type and do quality comparisons.
 * We recommend you do not subclass this or create instances of this class directly.
 * If you have need of a error representing a timeout, you should
 * create your own error class and use that.
 *
 * @see {@link timeout}
 *
 * @class TimeoutError
 */
export const TimeoutError: TimeoutErrorCtor = createErrorClass(
  (_super) =>
    function TimeoutErrorImpl(this: any, info: TimeoutInfo<any> | null = null) {
      _super(this);
      this.message = 'Timeout has occurred';
      this.name = 'TimeoutError';
      this.info = info;
    }
);

/**
 * If `with` is provided, this will return an observable that will switch to a different observable if the source
 * does not push values within the specified time parameters.
 *
 * <span class="informal">The most flexible option for creating a timeout behavior.</span>
 *
 * The first thing to know about the configuration is if you do not provide a `with` property to the configuration,
 * when timeout conditions are met, this operator will emit a {@link TimeoutError}. Otherwise, it will use the factory
 * function provided by `with`, and switch your subscription to the result of that. Timeout conditions are provided by
 * the settings in `first` and `each`.
 *
 * The `first` property can be either a `Date` for a specific time, a `number` for a time period relative to the
 * point of subscription, or it can be skipped. This property is to check timeout conditions for the arrival of
 * the first value from the source _only_. The timings of all subsequent values  from the source will be checked
 * against the time period provided by `each`, if it was provided.
 *
 * The `each` property can be either a `number` or skipped. If a value for `each` is provided, it represents the amount of
 * time the resulting observable will wait between the arrival of values from the source before timing out. Note that if
 * `first` is _not_ provided, the value from `each` will be used to check timeout conditions for the arrival of the first
 * value and all subsequent values. If `first` _is_ provided, `each` will only be use to check all values after the first.
 *
 * ## Examples
 *
 * Emit a custom error if there is too much time between values
 *
 * ```ts
 * import { interval, timeout, throwError } from 'rxjs';
 *
 * class CustomTimeoutError extends Error {
 *   constructor() {
 *     super('It was too slow');
 *     this.name = 'CustomTimeoutError';
 *   }
 * }
 *
 * const slow$ = interval(900);
 *
 * slow$.pipe(
 *   timeout({
 *     each: 1000,
 *     with: () => throwError(() => new CustomTimeoutError())
 *   })
 * )
 * .subscribe({
 *   error: console.error
 * });
 * ```
 *
 * Switch to a faster observable if your source is slow.
 *
 * ```ts
 * import { interval, timeout } from 'rxjs';
 *
 * const slow$ = interval(900);
 * const fast$ = interval(500);
 *
 * slow$.pipe(
 *   timeout({
 *     each: 1000,
 *     with: () => fast$,
 *   })
 * )
 * .subscribe(console.log);
 * ```
 * @param config The configuration for the timeout.
 */
export function timeout<T, O extends ObservableInput<unknown>, M = unknown>(
  config: TimeoutConfig<T, O, M> & { with: (info: TimeoutInfo<T, M>) => O }
): OperatorFunction<T, T | ObservedValueOf<O>>;

/**
 * Returns an observable that will error or switch to a different observable if the source does not push values
 * within the specified time parameters.
 *
 * <span class="informal">The most flexible option for creating a timeout behavior.</span>
 *
 * The first thing to know about the configuration is if you do not provide a `with` property to the configuration,
 * when timeout conditions are met, this operator will emit a {@link TimeoutError}. Otherwise, it will use the factory
 * function provided by `with`, and switch your subscription to the result of that. Timeout conditions are provided by
 * the settings in `first` and `each`.
 *
 * The `first` property can be either a `Date` for a specific time, a `number` for a time period relative to the
 * point of subscription, or it can be skipped. This property is to check timeout conditions for the arrival of
 * the first value from the source _only_. The timings of all subsequent values  from the source will be checked
 * against the time period provided by `each`, if it was provided.
 *
 * The `each` property can be either a `number` or skipped. If a value for `each` is provided, it represents the amount of
 * time the resulting observable will wait between the arrival of values from the source before timing out. Note that if
 * `first` is _not_ provided, the value from `each` will be used to check timeout conditions for the arrival of the first
 * value and all subsequent values. If `first` _is_ provided, `each` will only be use to check all values after the first.
 *
 * ### Handling TimeoutErrors
 *
 * If no `with` property was provided, subscriptions to the resulting observable may emit an error of {@link TimeoutError}.
 * The timeout error provides useful information you can examine when you're handling the error. The most common way to handle
 * the error would be with {@link catchError}, although you could use {@link tap} or just the error handler in your `subscribe` call
 * directly, if your error handling is only a side effect (such as notifying the user, or logging).
 *
 * In this case, you would check the error for `instanceof TimeoutError` to validate that the error was indeed from `timeout`, and
 * not from some other source. If it's not from `timeout`, you should probably rethrow it if you're in a `catchError`.
 *
 * ## Examples
 *
 * Emit a {@link TimeoutError} if the first value, and _only_ the first value, does not arrive within 5 seconds
 *
 * ```ts
 * import { interval, timeout } from 'rxjs';
 *
 * // A random interval that lasts between 0 and 10 seconds per tick
 * const source$ = interval(Math.round(Math.random() * 10_000));
 *
 * source$.pipe(
 *   timeout({ first: 5_000 })
 * )
 * .subscribe({
 *   next: console.log,
 *   error: console.error
 * });
 * ```
 *
 * Emit a {@link TimeoutError} if the source waits longer than 5 seconds between any two values or the first value
 * and subscription.
 *
 * ```ts
 * import { timer, timeout, expand } from 'rxjs';
 *
 * const getRandomTime = () => Math.round(Math.random() * 10_000);
 *
 * // An observable that waits a random amount of time between each delivered value
 * const source$ = timer(getRandomTime())
 *   .pipe(expand(() => timer(getRandomTime())));
 *
 * source$
 *   .pipe(timeout({ each: 5_000 }))
 *   .subscribe({
 *     next: console.log,
 *     error: console.error
 *   });
 * ```
 *
 * Emit a {@link TimeoutError} if the source does not emit before 7 seconds, _or_ if the source waits longer than
 * 5 seconds between any two values after the first.
 *
 * ```ts
 * import { timer, timeout, expand } from 'rxjs';
 *
 * const getRandomTime = () => Math.round(Math.random() * 10_000);
 *
 * // An observable that waits a random amount of time between each delivered value
 * const source$ = timer(getRandomTime())
 *   .pipe(expand(() => timer(getRandomTime())));
 *
 * source$
 *   .pipe(timeout({ first: 7_000, each: 5_000 }))
 *   .subscribe({
 *     next: console.log,
 *     error: console.error
 *   });
 * ```
 */
export function timeout<T, M = unknown>(config: Omit<TimeoutConfig<T, any, M>, 'with'>): OperatorFunction<T, T>;

/**
 * Returns an observable that will error if the source does not push its first value before the specified time passed as a `Date`.
 * This is functionally the same as `timeout({ first: someDate })`.
 *
 * <span class="informal">Errors if the first value doesn't show up before the given date and time</span>
 *
 * ![](timeout.png)
 *
 * @param first The date to at which the resulting observable will timeout if the source observable
 * does not emit at least one value.
 * @param scheduler The scheduler to use. Defaults to {@link asyncScheduler}.
 */
export function timeout<T>(first: Date, scheduler?: SchedulerLike): MonoTypeOperatorFunction<T>;

/**
 * Returns an observable that will error if the source does not push a value within the specified time in milliseconds.
 * This is functionally the same as `timeout({ each: milliseconds })`.
 *
 * <span class="informal">Errors if it waits too long between any value</span>
 *
 * ![](timeout.png)
 *
 * @param each The time allowed between each pushed value from the source before the resulting observable
 * will timeout.
 * @param scheduler The scheduler to use. Defaults to {@link asyncScheduler}.
 */
export function timeout<T>(each: number, scheduler?: SchedulerLike): MonoTypeOperatorFunction<T>;

/**
 *
 * Errors if Observable does not emit a value in given time span.
 *
 * <span class="informal">Timeouts on Observable that doesn't emit values fast enough.</span>
 *
 * ![](timeout.png)
 *
 * @see {@link timeoutWith}
 *
 * @return A function that returns an Observable that mirrors behaviour of the
 * source Observable, unless timeout happens when it throws an error.
 */
export function timeout<T, O extends ObservableInput<any>, M>(
  config: number | Date | TimeoutConfig<T, O, M>,
  schedulerArg?: SchedulerLike
): OperatorFunction<T, T | ObservedValueOf<O>> {
  // Intentionally terse code.
  // If the first argument is a valid `Date`, then we use it as the `first` config.
  // Otherwise, if the first argument is a `number`, then we use it as the `each` config.
  // Otherwise, it can be assumed the first argument is the configuration object itself, and
  // we destructure that into what we're going to use, setting important defaults as we do.
  // NOTE: The default for `scheduler` will be the `scheduler` argument if it exists, or
  // it will default to the `asyncScheduler`.
  const {
    first,
    each,
    with: _with = timeoutErrorFactory,
    scheduler = schedulerArg ?? asyncScheduler,
    meta = null!,
  } = (isValidDate(config) ? { first: config } : typeof config === 'number' ? { each: config } : config) as TimeoutConfig<T, O, M>;

  if (first == null && each == null) {
    // Ensure timeout was provided at runtime.
    throw new TypeError('No timeout provided.');
  }

  return operate((source, subscriber) => {
    // This subscription encapsulates our subscription to the
    // source for this operator. We're capturing it separately,
    // because if there is a `with` observable to fail over to,
    // we want to unsubscribe from our original subscription, and
    // hand of the subscription to that one.
    let originalSourceSubscription: Subscription;
    // The subscription for our timeout timer. This changes
    // every time get get a new value.
    let timerSubscription: Subscription;
    // A bit of state we pass to our with and error factories to
    // tell what the last value we saw was.
    let lastValue: T | null = null;
    // A bit of state we pass to the with and error factories to
    // tell how many values we have seen so far.
    let seen = 0;
    const startTimer = (delay: number) => {
      timerSubscription = executeSchedule(
        subscriber,
        scheduler,
        () => {
          try {
            originalSourceSubscription.unsubscribe();
            innerFrom(
              _with!({
                meta,
                lastValue,
                seen,
              })
            ).subscribe(subscriber);
          } catch (err) {
            subscriber.error(err);
          }
        },
        delay
      );
    };

    originalSourceSubscription = source.subscribe(
      createOperatorSubscriber(
        subscriber,
        (value: T) => {
          // clear the timer so we can emit and start another one.
          timerSubscription?.unsubscribe();
          seen++;
          // Emit
          subscriber.next((lastValue = value));
          // null | undefined are both < 0. Thanks, JavaScript.
          each! > 0 && startTimer(each!);
        },
        undefined,
        undefined,
        () => {
          if (!timerSubscription?.closed) {
            timerSubscription?.unsubscribe();
          }
          // Be sure not to hold the last value in memory after unsubscription
          // it could be quite large.
          lastValue = null;
        }
      )
    );

    // Intentionally terse code.
    // If we've `seen` a value, that means the "first" clause was met already, if it existed.
    //   it also means that a timer was already started for "each" (in the next handler above).
    // If `first` was provided, and it's a number, then use it.
    // If `first` was provided and it's not a number, it's a Date, and we get the difference between it and "now".
    // If `first` was not provided at all, then our first timer will be the value from `each`.
    !seen && startTimer(first != null ? (typeof first === 'number' ? first : +first - scheduler!.now()) : each!);
  });
}

/**
 * The default function to use to emit an error when timeout occurs and a `with` function
 * is not specified.
 * @param info The information about the timeout to pass along to the error
 */
function timeoutErrorFactory(info: TimeoutInfo<any>): Observable<never> {
  throw new TimeoutError(info);
}
import { async } from '../scheduler/async';
import { isValidDate } from '../util/isDate';
import { ObservableInput, OperatorFunction, SchedulerLike } from '../types';
import { timeout } from './timeout';

/** @deprecated Replaced with {@link timeout}. Instead of `timeoutWith(someDate, a$, scheduler)`, use the configuration object
 * `timeout({ first: someDate, with: () => a$, scheduler })`. Will be removed in v8. */
export function timeoutWith<T, R>(dueBy: Date, switchTo: ObservableInput<R>, scheduler?: SchedulerLike): OperatorFunction<T, T | R>;
/** @deprecated Replaced with {@link timeout}. Instead of `timeoutWith(100, a$, scheduler)`, use the configuration object
 *  `timeout({ each: 100, with: () => a$, scheduler })`. Will be removed in v8. */
export function timeoutWith<T, R>(waitFor: number, switchTo: ObservableInput<R>, scheduler?: SchedulerLike): OperatorFunction<T, T | R>;

/**
 * When the passed timespan elapses before the source emits any given value, it will unsubscribe from the source,
 * and switch the subscription to another observable.
 *
 * <span class="informal">Used to switch to a different observable if your source is being slow.</span>
 *
 * Useful in cases where:
 *
 * - You want to switch to a different source that may be faster.
 * - You want to notify a user that the data stream is slow.
 * - You want to emit a custom error rather than the {@link TimeoutError} emitted
 *   by the default usage of {@link timeout}.
 *
 * If the first parameter is passed as Date and the time of the Date arrives before the first value arrives from the source,
 * it will unsubscribe from the source and switch the subscription to another observable.
 *
 * <span class="informal">Use Date object to switch to a different observable if the first value doesn't arrive by a specific time.</span>
 *
 * Can be used to set a timeout only for the first value, however it's recommended to use the {@link timeout} operator with
 * the `first` configuration to get the same effect.
 *
 * ## Examples
 *
 * Fallback to a faster observable
 *
 * ```ts
 * import { interval, timeoutWith } from 'rxjs';
 *
 * const slow$ = interval(1000);
 * const faster$ = interval(500);
 *
 * slow$
 *   .pipe(timeoutWith(900, faster$))
 *   .subscribe(console.log);
 * ```
 *
 * Emit your own custom timeout error
 *
 * ```ts
 * import { interval, timeoutWith, throwError } from 'rxjs';
 *
 * class CustomTimeoutError extends Error {
 *   constructor() {
 *     super('It was too slow');
 *     this.name = 'CustomTimeoutError';
 *   }
 * }
 *
 * const slow$ = interval(1000);
 *
 * slow$
 *   .pipe(timeoutWith(900, throwError(() => new CustomTimeoutError())))
 *   .subscribe({
 *     error: err => console.error(err.message)
 *   });
 * ```
 *
 * @see {@link timeout}
 *
 * @param due When passed a number, used as the time (in milliseconds) allowed between each value from the source before timeout
 * is triggered. When passed a Date, used as the exact time at which the timeout will be triggered if the first value does not arrive.
 * @param withObservable The observable to switch to when timeout occurs.
 * @param scheduler The scheduler to use with time-related operations within this operator. Defaults to {@link asyncScheduler}
 * @return A function that returns an Observable that mirrors behaviour of the
 * source Observable, unless timeout happens when it starts emitting values
 * from the `ObservableInput` passed as a second parameter.
 * @deprecated Replaced with {@link timeout}. Instead of `timeoutWith(100, a$, scheduler)`, use {@link timeout} with the configuration
 * object: `timeout({ each: 100, with: () => a$, scheduler })`. Instead of `timeoutWith(someDate, a$, scheduler)`, use {@link timeout}
 * with the configuration object: `timeout({ first: someDate, with: () => a$, scheduler })`. Will be removed in v8.
 */
export function timeoutWith<T, R>(
  due: number | Date,
  withObservable: ObservableInput<R>,
  scheduler?: SchedulerLike
): OperatorFunction<T, T | R> {
  let first: number | Date | undefined;
  let each: number | undefined;
  let _with: () => ObservableInput<R>;
  scheduler = scheduler ?? async;

  if (isValidDate(due)) {
    first = due;
  } else if (typeof due === 'number') {
    each = due;
  }

  if (withObservable) {
    _with = () => withObservable;
  } else {
    throw new TypeError('No observable provided to switch to');
  }

  if (first == null && each == null) {
    // Ensure timeout was provided at runtime.
    throw new TypeError('No timeout provided.');
  }

  return timeout<T, ObservableInput<R>>({
    first,
    each,
    scheduler,
    with: _with,
  });
}
import { OperatorFunction, TimestampProvider, Timestamp } from '../types';
import { dateTimestampProvider } from '../scheduler/dateTimestampProvider';
import { map } from './map';

/**
 * Attaches a timestamp to each item emitted by an observable indicating when it was emitted
 *
 * The `timestamp` operator maps the *source* observable stream to an object of type
 * `{value: T, timestamp: R}`. The properties are generically typed. The `value` property contains the value
 * and type of the *source* observable. The `timestamp` is generated by the schedulers `now` function. By
 * default, it uses the `asyncScheduler` which simply returns `Date.now()` (milliseconds since 1970/01/01
 * 00:00:00:000) and therefore is of type `number`.
 *
 * ![](timestamp.png)
 *
 * ## Example
 *
 * In this example there is a timestamp attached to the document's click events
 *
 * ```ts
 * import { fromEvent, timestamp } from 'rxjs';
 *
 * const clickWithTimestamp = fromEvent(document, 'click').pipe(
 *   timestamp()
 * );
 *
 * // Emits data of type { value: PointerEvent, timestamp: number }
 * clickWithTimestamp.subscribe(data => {
 *   console.log(data);
 * });
 * ```
 *
 * @param timestampProvider An object with a `now()` method used to get the current timestamp.
 * @return A function that returns an Observable that attaches a timestamp to
 * each item emitted by the source Observable indicating when it was emitted.
 */
export function timestamp<T>(timestampProvider: TimestampProvider = dateTimestampProvider): OperatorFunction<T, Timestamp<T>> {
  return map((value: T) => ({ value, timestamp: timestampProvider.now() }));
}
import { reduce } from './reduce';
import { OperatorFunction } from '../types';
import { operate } from '../util/lift';

const arrReducer = (arr: any[], value: any) => (arr.push(value), arr);

/**
 * Collects all source emissions and emits them as an array when the source completes.
 *
 * <span class="informal">Get all values inside an array when the source completes</span>
 *
 * ![](toArray.png)
 *
 * `toArray` will wait until the source Observable completes before emitting
 * the array containing all emissions. When the source Observable errors no
 * array will be emitted.
 *
 * ## Example
 *
 * ```ts
 * import { interval, take, toArray } from 'rxjs';
 *
 * const source = interval(1000);
 * const example = source.pipe(
 *   take(10),
 *   toArray()
 * );
 *
 * example.subscribe(value => console.log(value));
 *
 * // output: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
 * ```
 *
 * @return A function that returns an Observable that emits an array of items
 * emitted by the source Observable when source completes.
 */
export function toArray<T>(): OperatorFunction<T, T[]> {
  // Because arrays are mutable, and we're mutating the array in this
  // reducer process, we have to escapulate the creation of the initial
  // array within this `operate` function.
  return operate((source, subscriber) => {
    reduce(arrReducer, [] as T[])(source).subscribe(subscriber);
  });
}
import { Observable } from '../Observable';
import { OperatorFunction } from '../types';
import { Subject } from '../Subject';
import { operate } from '../util/lift';
import { createOperatorSubscriber } from './OperatorSubscriber';
import { noop } from '../util/noop';

/**
 * Branch out the source Observable values as a nested Observable whenever
 * `windowBoundaries` emits.
 *
 * <span class="informal">It's like {@link buffer}, but emits a nested Observable
 * instead of an array.</span>
 *
 * ![](window.png)
 *
 * Returns an Observable that emits windows of items it collects from the source
 * Observable. The output Observable emits connected, non-overlapping
 * windows. It emits the current window and opens a new one whenever the
 * Observable `windowBoundaries` emits an item. Because each window is an
 * Observable, the output is a higher-order Observable.
 *
 * ## Example
 *
 * In every window of 1 second each, emit at most 2 click events
 *
 * ```ts
 * import { fromEvent, interval, window, map, take, mergeAll } from 'rxjs';
 *
 * const clicks = fromEvent(document, 'click');
 * const sec = interval(1000);
 * const result = clicks.pipe(
 *   window(sec),
 *   map(win => win.pipe(take(2))), // take at most 2 emissions from each window
 *   mergeAll()                     // flatten the Observable-of-Observables
 * );
 * result.subscribe(x => console.log(x));
 * ```
 *
 * @see {@link windowCount}
 * @see {@link windowTime}
 * @see {@link windowToggle}
 * @see {@link windowWhen}
 * @see {@link buffer}
 *
 * @param {Observable<any>} windowBoundaries An Observable that completes the
 * previous window and starts a new window.
 * @return A function that returns an Observable of windows, which are
 * Observables emitting values of the source Observable.
 */
export function window<T>(windowBoundaries: Observable<any>): OperatorFunction<T, Observable<T>> {
  return operate((source, subscriber) => {
    let windowSubject: Subject<T> = new Subject<T>();

    subscriber.next(windowSubject.asObservable());

    const errorHandler = (err: any) => {
      windowSubject.error(err);
      subscriber.error(err);
    };

    // Subscribe to our source
    source.subscribe(
      createOperatorSubscriber(
        subscriber,
        (value) => windowSubject?.next(value),
        () => {
          windowSubject.complete();
          subscriber.complete();
        },
        errorHandler
      )
    );

    // Subscribe to the window boundaries.
    windowBoundaries.subscribe(
      createOperatorSubscriber(
        subscriber,
        () => {
          windowSubject.complete();
          subscriber.next((windowSubject = new Subject()));
        },
        noop,
        errorHandler
      )
    );

    return () => {
      // Unsubscribing the subject ensures that anyone who has captured
      // a reference to this window that tries to use it after it can
      // no longer get values from the source will get an ObjectUnsubscribedError.
      windowSubject?.unsubscribe();
      windowSubject = null!;
    };
  });
}
import { Observable } from '../Observable';
import { Subject } from '../Subject';
import { OperatorFunction } from '../types';
import { operate } from '../util/lift';
import { createOperatorSubscriber } from './OperatorSubscriber';

/**
 * Branch out the source Observable values as a nested Observable with each
 * nested Observable emitting at most `windowSize` values.
 *
 * <span class="informal">It's like {@link bufferCount}, but emits a nested
 * Observable instead of an array.</span>
 *
 * ![](windowCount.png)
 *
 * Returns an Observable that emits windows of items it collects from the source
 * Observable. The output Observable emits windows every `startWindowEvery`
 * items, each containing no more than `windowSize` items. When the source
 * Observable completes or encounters an error, the output Observable emits
 * the current window and propagates the notification from the source
 * Observable. If `startWindowEvery` is not provided, then new windows are
 * started immediately at the start of the source and when each window completes
 * with size `windowSize`.
 *
 * ## Examples
 *
 * Ignore every 3rd click event, starting from the first one
 *
 * ```ts
 * import { fromEvent, windowCount, map, skip, mergeAll } from 'rxjs';
 *
 * const clicks = fromEvent(document, 'click');
 * const result = clicks.pipe(
 *   windowCount(3),
 *   map(win => win.pipe(skip(1))), // skip first of every 3 clicks
 *   mergeAll()                     // flatten the Observable-of-Observables
 * );
 * result.subscribe(x => console.log(x));
 * ```
 *
 * Ignore every 3rd click event, starting from the third one
 *
 * ```ts
 * import { fromEvent, windowCount, mergeAll } from 'rxjs';
 *
 * const clicks = fromEvent(document, 'click');
 * const result = clicks.pipe(
 *   windowCount(2, 3),
 *   mergeAll() // flatten the Observable-of-Observables
 * );
 * result.subscribe(x => console.log(x));
 * ```
 *
 * @see {@link window}
 * @see {@link windowTime}
 * @see {@link windowToggle}
 * @see {@link windowWhen}
 * @see {@link bufferCount}
 *
 * @param {number} windowSize The maximum number of values emitted by each
 * window.
 * @param {number} [startWindowEvery] Interval at which to start a new window.
 * For example if `startWindowEvery` is `2`, then a new window will be started
 * on every other value from the source. A new window is started at the
 * beginning of the source by default.
 * @return A function that returns an Observable of windows, which in turn are
 * Observable of values.
 */
export function windowCount<T>(windowSize: number, startWindowEvery: number = 0): OperatorFunction<T, Observable<T>> {
  const startEvery = startWindowEvery > 0 ? startWindowEvery : windowSize;

  return operate((source, subscriber) => {
    let windows = [new Subject<T>()];
    let starts: number[] = [];
    let count = 0;

    // Open the first window.
    subscriber.next(windows[0].asObservable());

    source.subscribe(
      createOperatorSubscriber(
        subscriber,
        (value: T) => {
          // Emit the value through all current windows.
          // We don't need to create a new window yet, we
          // do that as soon as we close one.
          for (const window of windows) {
            window.next(value);
          }
          // Here we're using the size of the window array to figure
          // out if the oldest window has emitted enough values. We can do this
          // because the size of the window array is a function of the values
          // seen by the subscription. If it's time to close it, we complete
          // it and remove it.
          const c = count - windowSize + 1;
          if (c >= 0 && c % startEvery === 0) {
            windows.shift()!.complete();
          }

          // Look to see if the next count tells us it's time to open a new window.
          // TODO: We need to figure out if this really makes sense. We're technically
          // emitting windows *before* we have a value to emit them for. It's probably
          // more expected that we should be emitting the window when the start
          // count is reached -- not before.
          if (++count % startEvery === 0) {
            const window = new Subject<T>();
            windows.push(window);
            subscriber.next(window.asObservable());
          }
        },
        () => {
          while (windows.length > 0) {
            windows.shift()!.complete();
          }
          subscriber.complete();
        },
        (err) => {
          while (windows.length > 0) {
            windows.shift()!.error(err);
          }
          subscriber.error(err);
        },
        () => {
          starts = null!;
          windows = null!;
        }
      )
    );
  });
}
import { Subject } from '../Subject';
import { asyncScheduler } from '../scheduler/async';
import { Observable } from '../Observable';
import { Subscription } from '../Subscription';
import { Observer, OperatorFunction, SchedulerLike } from '../types';
import { operate } from '../util/lift';
import { createOperatorSubscriber } from './OperatorSubscriber';
import { arrRemove } from '../util/arrRemove';
import { popScheduler } from '../util/args';
import { executeSchedule } from '../util/executeSchedule';

export function windowTime<T>(windowTimeSpan: number, scheduler?: SchedulerLike): OperatorFunction<T, Observable<T>>;
export function windowTime<T>(
  windowTimeSpan: number,
  windowCreationInterval: number,
  scheduler?: SchedulerLike
): OperatorFunction<T, Observable<T>>;
export function windowTime<T>(
  windowTimeSpan: number,
  windowCreationInterval: number | null | void,
  maxWindowSize: number,
  scheduler?: SchedulerLike
): OperatorFunction<T, Observable<T>>;

/**
 * Branch out the source Observable values as a nested Observable periodically
 * in time.
 *
 * <span class="informal">It's like {@link bufferTime}, but emits a nested
 * Observable instead of an array.</span>
 *
 * ![](windowTime.png)
 *
 * Returns an Observable that emits windows of items it collects from the source
 * Observable. The output Observable starts a new window periodically, as
 * determined by the `windowCreationInterval` argument. It emits each window
 * after a fixed timespan, specified by the `windowTimeSpan` argument. When the
 * source Observable completes or encounters an error, the output Observable
 * emits the current window and propagates the notification from the source
 * Observable. If `windowCreationInterval` is not provided, the output
 * Observable starts a new window when the previous window of duration
 * `windowTimeSpan` completes. If `maxWindowCount` is provided, each window
 * will emit at most fixed number of values. Window will complete immediately
 * after emitting last value and next one still will open as specified by
 * `windowTimeSpan` and `windowCreationInterval` arguments.
 *
 * ## Examples
 *
 * In every window of 1 second each, emit at most 2 click events
 *
 * ```ts
 * import { fromEvent, windowTime, map, take, mergeAll } from 'rxjs';
 *
 * const clicks = fromEvent(document, 'click');
 * const result = clicks.pipe(
 *   windowTime(1000),
 *   map(win => win.pipe(take(2))), // take at most 2 emissions from each window
 *   mergeAll()                     // flatten the Observable-of-Observables
 * );
 * result.subscribe(x => console.log(x));
 * ```
 *
 * Every 5 seconds start a window 1 second long, and emit at most 2 click events per window
 *
 * ```ts
 * import { fromEvent, windowTime, map, take, mergeAll } from 'rxjs';
 *
 * const clicks = fromEvent(document, 'click');
 * const result = clicks.pipe(
 *   windowTime(1000, 5000),
 *   map(win => win.pipe(take(2))), // take at most 2 emissions from each window
 *   mergeAll()                     // flatten the Observable-of-Observables
 * );
 * result.subscribe(x => console.log(x));
 * ```
 *
 * Same as example above but with `maxWindowCount` instead of `take`
 *
 * ```ts
 * import { fromEvent, windowTime, mergeAll } from 'rxjs';
 *
 * const clicks = fromEvent(document, 'click');
 * const result = clicks.pipe(
 *   windowTime(1000, 5000, 2), // take at most 2 emissions from each window
 *   mergeAll()                 // flatten the Observable-of-Observables
 * );
 * result.subscribe(x => console.log(x));
 * ```
 *
 * @see {@link window}
 * @see {@link windowCount}
 * @see {@link windowToggle}
 * @see {@link windowWhen}
 * @see {@link bufferTime}
 *
 * @param windowTimeSpan The amount of time, in milliseconds, to fill each window.
 * @param windowCreationInterval The interval at which to start new
 * windows.
 * @param maxWindowSize Max number of
 * values each window can emit before completion.
 * @param scheduler The scheduler on which to schedule the
 * intervals that determine window boundaries.
 * @return A function that returns an Observable of windows, which in turn are
 * Observables.
 */
export function windowTime<T>(windowTimeSpan: number, ...otherArgs: any[]): OperatorFunction<T, Observable<T>> {
  const scheduler = popScheduler(otherArgs) ?? asyncScheduler;
  const windowCreationInterval = (otherArgs[0] as number) ?? null;
  const maxWindowSize = (otherArgs[1] as number) || Infinity;

  return operate((source, subscriber) => {
    // The active windows, their related subscriptions, and removal functions.
    let windowRecords: WindowRecord<T>[] | null = [];
    // If true, it means that every time we close a window, we want to start a new window.
    // This is only really used for when *just* the time span is passed.
    let restartOnClose = false;

    const closeWindow = (record: { window: Subject<T>; subs: Subscription }) => {
      const { window, subs } = record;
      window.complete();
      subs.unsubscribe();
      arrRemove(windowRecords, record);
      restartOnClose && startWindow();
    };

    /**
     * Called every time we start a new window. This also does
     * the work of scheduling the job to close the window.
     */
    const startWindow = () => {
      if (windowRecords) {
        const subs = new Subscription();
        subscriber.add(subs);
        const window = new Subject<T>();
        const record = {
          window,
          subs,
          seen: 0,
        };
        windowRecords.push(record);
        subscriber.next(window.asObservable());
        executeSchedule(subs, scheduler, () => closeWindow(record), windowTimeSpan);
      }
    };

    if (windowCreationInterval !== null && windowCreationInterval >= 0) {
      // The user passed both a windowTimeSpan (required), and a creation interval
      // That means we need to start new window on the interval, and those windows need
      // to wait the required time span before completing.
      executeSchedule(subscriber, scheduler, startWindow, windowCreationInterval, true);
    } else {
      restartOnClose = true;
    }

    startWindow();

    /**
     * We need to loop over a copy of the window records several times in this operator.
     * This is to save bytes over the wire more than anything.
     * The reason we copy the array is that reentrant code could mutate the array while
     * we are iterating over it.
     */
    const loop = (cb: (record: WindowRecord<T>) => void) => windowRecords!.slice().forEach(cb);

    /**
     * Used to notify all of the windows and the subscriber in the same way
     * in the error and complete handlers.
     */
    const terminate = (cb: (consumer: Observer<any>) => void) => {
      loop(({ window }) => cb(window));
      cb(subscriber);
      subscriber.unsubscribe();
    };

    source.subscribe(
      createOperatorSubscriber(
        subscriber,
        (value: T) => {
          // Notify all windows of the value.
          loop((record) => {
            record.window.next(value);
            // If the window is over the max size, we need to close it.
            maxWindowSize <= ++record.seen && closeWindow(record);
          });
        },
        // Complete the windows and the downstream subscriber and clean up.
        () => terminate((consumer) => consumer.complete()),
        // Notify the windows and the downstream subscriber of the error and clean up.
        (err) => terminate((consumer) => consumer.error(err))
      )
    );

    // Additional finalization. This will be called when the
    // destination tears down. Other finalizations are registered implicitly
    // above via subscription.
    return () => {
      // Ensure that the buffer is released.
      windowRecords = null!;
    };
  });
}

interface WindowRecord<T> {
  seen: number;
  window: Subject<T>;
  subs: Subscription;
}
import { Observable } from '../Observable';
import { Subject } from '../Subject';
import { Subscription } from '../Subscription';
import { ObservableInput, OperatorFunction } from '../types';
import { operate } from '../util/lift';
import { innerFrom } from '../observable/innerFrom';
import { createOperatorSubscriber } from './OperatorSubscriber';
import { noop } from '../util/noop';
import { arrRemove } from '../util/arrRemove';

/**
 * Branch out the source Observable values as a nested Observable starting from
 * an emission from `openings` and ending when the output of `closingSelector`
 * emits.
 *
 * <span class="informal">It's like {@link bufferToggle}, but emits a nested
 * Observable instead of an array.</span>
 *
 * ![](windowToggle.png)
 *
 * Returns an Observable that emits windows of items it collects from the source
 * Observable. The output Observable emits windows that contain those items
 * emitted by the source Observable between the time when the `openings`
 * Observable emits an item and when the Observable returned by
 * `closingSelector` emits an item.
 *
 * ## Example
 *
 * Every other second, emit the click events from the next 500ms
 *
 * ```ts
 * import { fromEvent, interval, windowToggle, EMPTY, mergeAll } from 'rxjs';
 *
 * const clicks = fromEvent(document, 'click');
 * const openings = interval(1000);
 * const result = clicks.pipe(
 *   windowToggle(openings, i => i % 2 ? interval(500) : EMPTY),
 *   mergeAll()
 * );
 * result.subscribe(x => console.log(x));
 * ```
 *
 * @see {@link window}
 * @see {@link windowCount}
 * @see {@link windowTime}
 * @see {@link windowWhen}
 * @see {@link bufferToggle}
 *
 * @param {Observable<O>} openings An observable of notifications to start new
 * windows.
 * @param {function(value: O): Observable} closingSelector A function that takes
 * the value emitted by the `openings` observable and returns an Observable,
 * which, when it emits a next notification, signals that the
 * associated window should complete.
 * @return A function that returns an Observable of windows, which in turn are
 * Observables.
 */
export function windowToggle<T, O>(
  openings: ObservableInput<O>,
  closingSelector: (openValue: O) => ObservableInput<any>
): OperatorFunction<T, Observable<T>> {
  return operate((source, subscriber) => {
    const windows: Subject<T>[] = [];

    const handleError = (err: any) => {
      while (0 < windows.length) {
        windows.shift()!.error(err);
      }
      subscriber.error(err);
    };

    innerFrom(openings).subscribe(
      createOperatorSubscriber(
        subscriber,
        (openValue) => {
          const window = new Subject<T>();
          windows.push(window);
          const closingSubscription = new Subscription();
          const closeWindow = () => {
            arrRemove(windows, window);
            window.complete();
            closingSubscription.unsubscribe();
          };

          let closingNotifier: Observable<any>;
          try {
            closingNotifier = innerFrom(closingSelector(openValue));
          } catch (err) {
            handleError(err);
            return;
          }

          subscriber.next(window.asObservable());

          closingSubscription.add(closingNotifier.subscribe(createOperatorSubscriber(subscriber, closeWindow, noop, handleError)));
        },
        noop
      )
    );

    // Subcribe to the source to get things started.
    source.subscribe(
      createOperatorSubscriber(
        subscriber,
        (value: T) => {
          // Copy the windows array before we emit to
          // make sure we don't have issues with reentrant code.
          const windowsCopy = windows.slice();
          for (const window of windowsCopy) {
            window.next(value);
          }
        },
        () => {
          // Complete all of our windows before we complete.
          while (0 < windows.length) {
            windows.shift()!.complete();
          }
          subscriber.complete();
        },
        handleError,
        () => {
          // Add this finalization so that all window subjects are
          // disposed of. This way, if a user tries to subscribe
          // to a window *after* the outer subscription has been unsubscribed,
          // they will get an error, instead of waiting forever to
          // see if a value arrives.
          while (0 < windows.length) {
            windows.shift()!.unsubscribe();
          }
        }
      )
    );
  });
}
import { Subscriber } from '../Subscriber';
import { Observable } from '../Observable';
import { Subject } from '../Subject';
import { ObservableInput, OperatorFunction } from '../types';
import { operate } from '../util/lift';
import { createOperatorSubscriber } from './OperatorSubscriber';
import { innerFrom } from '../observable/innerFrom';

/**
 * Branch out the source Observable values as a nested Observable using a
 * factory function of closing Observables to determine when to start a new
 * window.
 *
 * <span class="informal">It's like {@link bufferWhen}, but emits a nested
 * Observable instead of an array.</span>
 *
 * ![](windowWhen.png)
 *
 * Returns an Observable that emits windows of items it collects from the source
 * Observable. The output Observable emits connected, non-overlapping windows.
 * It emits the current window and opens a new one whenever the Observable
 * produced by the specified `closingSelector` function emits an item. The first
 * window is opened immediately when subscribing to the output Observable.
 *
 * ## Example
 *
 * Emit only the first two clicks events in every window of [1-5] random seconds
 *
 * ```ts
 * import { fromEvent, windowWhen, interval, map, take, mergeAll } from 'rxjs';
 *
 * const clicks = fromEvent(document, 'click');
 * const result = clicks.pipe(
 *   windowWhen(() => interval(1000 + Math.random() * 4000)),
 *   map(win => win.pipe(take(2))), // take at most 2 emissions from each window
 *   mergeAll()                     // flatten the Observable-of-Observables
 * );
 * result.subscribe(x => console.log(x));
 * ```
 *
 * @see {@link window}
 * @see {@link windowCount}
 * @see {@link windowTime}
 * @see {@link windowToggle}
 * @see {@link bufferWhen}
 *
 * @param {function(): Observable} closingSelector A function that takes no
 * arguments and returns an Observable that signals (on either `next` or
 * `complete`) when to close the previous window and start a new one.
 * @return A function that returns an Observable of windows, which in turn are
 * Observables.
 */
export function windowWhen<T>(closingSelector: () => ObservableInput<any>): OperatorFunction<T, Observable<T>> {
  return operate((source, subscriber) => {
    let window: Subject<T> | null;
    let closingSubscriber: Subscriber<any> | undefined;

    /**
     * When we get an error, we have to notify both the
     * destiation subscriber and the window.
     */
    const handleError = (err: any) => {
      window!.error(err);
      subscriber.error(err);
    };

    /**
     * Called every time we need to open a window.
     * Recursive, as it will start the closing notifier, which
     * inevitably *should* call openWindow -- but may not if
     * it is a "never" observable.
     */
    const openWindow = () => {
      // We need to clean up our closing subscription,
      // we only cared about the first next or complete notification.
      closingSubscriber?.unsubscribe();

      // Close our window before starting a new one.
      window?.complete();

      // Start the new window.
      window = new Subject<T>();
      subscriber.next(window.asObservable());

      // Get our closing notifier.
      let closingNotifier: Observable<any>;
      try {
        closingNotifier = innerFrom(closingSelector());
      } catch (err) {
        handleError(err);
        return;
      }

      // Subscribe to the closing notifier, be sure
      // to capture the subscriber (aka Subscription)
      // so we can clean it up when we close the window
      // and open a new one.
      closingNotifier.subscribe((closingSubscriber = createOperatorSubscriber(subscriber, openWindow, openWindow, handleError)));
    };

    // Start the first window.
    openWindow();

    // Subscribe to the source
    source.subscribe(
      createOperatorSubscriber(
        subscriber,
        (value) => window!.next(value),
        () => {
          // The source completed, close the window and complete.
          window!.complete();
          subscriber.complete();
        },
        handleError,
        () => {
          // Be sure to clean up our closing subscription
          // when this tears down.
          closingSubscriber?.unsubscribe();
          window = null!;
        }
      )
    );
  });
}
import { OperatorFunction, ObservableInputTuple } from '../types';
import { operate } from '../util/lift';
import { createOperatorSubscriber } from './OperatorSubscriber';
import { innerFrom } from '../observable/innerFrom';
import { identity } from '../util/identity';
import { noop } from '../util/noop';
import { popResultSelector } from '../util/args';

export function withLatestFrom<T, O extends unknown[]>(...inputs: [...ObservableInputTuple<O>]): OperatorFunction<T, [T, ...O]>;

export function withLatestFrom<T, O extends unknown[], R>(
  ...inputs: [...ObservableInputTuple<O>, (...value: [T, ...O]) => R]
): OperatorFunction<T, R>;

/**
 * Combines the source Observable with other Observables to create an Observable
 * whose values are calculated from the latest values of each, only when the
 * source emits.
 *
 * <span class="informal">Whenever the source Observable emits a value, it
 * computes a formula using that value plus the latest values from other input
 * Observables, then emits the output of that formula.</span>
 *
 * ![](withLatestFrom.png)
 *
 * `withLatestFrom` combines each value from the source Observable (the
 * instance) with the latest values from the other input Observables only when
 * the source emits a value, optionally using a `project` function to determine
 * the value to be emitted on the output Observable. All input Observables must
 * emit at least one value before the output Observable will emit a value.
 *
 * ## Example
 *
 * On every click event, emit an array with the latest timer event plus the click event
 *
 * ```ts
 * import { fromEvent, interval, withLatestFrom } from 'rxjs';
 *
 * const clicks = fromEvent(document, 'click');
 * const timer = interval(1000);
 * const result = clicks.pipe(withLatestFrom(timer));
 * result.subscribe(x => console.log(x));
 * ```
 *
 * @see {@link combineLatest}
 *
 * @param {ObservableInput} other An input Observable to combine with the source
 * Observable. More than one input Observables may be given as argument.
 * @param {Function} [project] Projection function for combining values
 * together. Receives all values in order of the Observables passed, where the
 * first parameter is a value from the source Observable. (e.g.
 * `a.pipe(withLatestFrom(b, c), map(([a1, b1, c1]) => a1 + b1 + c1))`). If this is not
 * passed, arrays will be emitted on the output Observable.
 * @return A function that returns an Observable of projected values from the
 * most recent values from each input Observable, or an array of the most
 * recent values from each input Observable.
 */
export function withLatestFrom<T, R>(...inputs: any[]): OperatorFunction<T, R | any[]> {
  const project = popResultSelector(inputs) as ((...args: any[]) => R) | undefined;

  return operate((source, subscriber) => {
    const len = inputs.length;
    const otherValues = new Array(len);
    // An array of whether or not the other sources have emitted. Matched with them by index.
    // TODO: At somepoint, we should investigate the performance implications here, and look
    // into using a `Set()` and checking the `size` to see if we're ready.
    let hasValue = inputs.map(() => false);
    // Flipped true when we have at least one value from all other sources and
    // we are ready to start emitting values.
    let ready = false;

    // Other sources. Note that here we are not checking `subscriber.closed`,
    // this causes all inputs to be subscribed to, even if nothing can be emitted
    // from them. This is an important distinction because subscription constitutes
    // a side-effect.
    for (let i = 0; i < len; i++) {
      innerFrom(inputs[i]).subscribe(
        createOperatorSubscriber(
          subscriber,
          (value) => {
            otherValues[i] = value;
            if (!ready && !hasValue[i]) {
              // If we're not ready yet, flag to show this observable has emitted.
              hasValue[i] = true;
              // Intentionally terse code.
              // If all of our other observables have emitted, set `ready` to `true`,
              // so we know we can start emitting values, then clean up the `hasValue` array,
              // because we don't need it anymore.
              (ready = hasValue.every(identity)) && (hasValue = null!);
            }
          },
          // Completing one of the other sources has
          // no bearing on the completion of our result.
          noop
        )
      );
    }

    // Source subscription
    source.subscribe(
      createOperatorSubscriber(subscriber, (value) => {
        if (ready) {
          // We have at least one value from the other sources. Go ahead and emit.
          const values = [value, ...otherValues];
          subscriber.next(project ? project(...values) : values);
        }
      })
    );
  });
}
import { zip as zipStatic } from '../observable/zip';
import { ObservableInput, ObservableInputTuple, OperatorFunction, Cons } from '../types';
import { operate } from '../util/lift';

/** @deprecated Replaced with {@link zipWith}. Will be removed in v8. */
export function zip<T, A extends readonly unknown[]>(otherInputs: [...ObservableInputTuple<A>]): OperatorFunction<T, Cons<T, A>>;
/** @deprecated Replaced with {@link zipWith}. Will be removed in v8. */
export function zip<T, A extends readonly unknown[], R>(
  otherInputsAndProject: [...ObservableInputTuple<A>],
  project: (...values: Cons<T, A>) => R
): OperatorFunction<T, R>;
/** @deprecated Replaced with {@link zipWith}. Will be removed in v8. */
export function zip<T, A extends readonly unknown[]>(...otherInputs: [...ObservableInputTuple<A>]): OperatorFunction<T, Cons<T, A>>;
/** @deprecated Replaced with {@link zipWith}. Will be removed in v8. */
export function zip<T, A extends readonly unknown[], R>(
  ...otherInputsAndProject: [...ObservableInputTuple<A>, (...values: Cons<T, A>) => R]
): OperatorFunction<T, R>;

/**
 * @deprecated Replaced with {@link zipWith}. Will be removed in v8.
 */
export function zip<T, R>(...sources: Array<ObservableInput<any> | ((...values: Array<any>) => R)>): OperatorFunction<T, any> {
  return operate((source, subscriber) => {
    zipStatic(source as ObservableInput<any>, ...(sources as Array<ObservableInput<any>>)).subscribe(subscriber);
  });
}
import { OperatorFunction, ObservableInput } from '../types';
import { zip } from '../observable/zip';
import { joinAllInternals } from './joinAllInternals';

/**
 * Collects all observable inner sources from the source, once the source completes,
 * it will subscribe to all inner sources, combining their values by index and emitting
 * them.
 *
 * @see {@link zipWith}
 * @see {@link zip}
 */
export function zipAll<T>(): OperatorFunction<ObservableInput<T>, T[]>;
export function zipAll<T>(): OperatorFunction<any, T[]>;
export function zipAll<T, R>(project: (...values: T[]) => R): OperatorFunction<ObservableInput<T>, R>;
export function zipAll<R>(project: (...values: Array<any>) => R): OperatorFunction<any, R>;

export function zipAll<T, R>(project?: (...values: T[]) => R) {
  return joinAllInternals(zip, project);
}
import { ObservableInputTuple, OperatorFunction, Cons } from '../types';
import { zip } from './zip';

/**
 * Subscribes to the source, and the observable inputs provided as arguments, and combines their values, by index, into arrays.
 *
 * What is meant by "combine by index": The first value from each will be made into a single array, then emitted,
 * then the second value from each will be combined into a single array and emitted, then the third value
 * from each will be combined into a single array and emitted, and so on.
 *
 * This will continue until it is no longer able to combine values of the same index into an array.
 *
 * After the last value from any one completed source is emitted in an array, the resulting observable will complete,
 * as there is no way to continue "zipping" values together by index.
 *
 * Use-cases for this operator are limited. There are memory concerns if one of the streams is emitting
 * values at a much faster rate than the others. Usage should likely be limited to streams that emit
 * at a similar pace, or finite streams of known length.
 *
 * In many cases, authors want `combineLatestWith` and not `zipWith`.
 *
 * @param otherInputs other observable inputs to collate values from.
 * @return A function that returns an Observable that emits items by index
 * combined from the source Observable and provided Observables, in form of an
 * array.
 */
export function zipWith<T, A extends readonly unknown[]>(...otherInputs: [...ObservableInputTuple<A>]): OperatorFunction<T, Cons<T, A>> {
  return zip(...otherInputs);
}
