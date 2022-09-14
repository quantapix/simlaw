import { Subject } from '../Subject';
import { Observable } from '../Observable';
import { Subscriber } from '../Subscriber';
import { Subscription } from '../Subscription';
import { refCount as higherOrderRefCount } from '../operators/refCount';
import { createOperatorSubscriber } from '../operators/OperatorSubscriber';
import { hasLift } from '../util/lift';

/**
 * @class ConnectableObservable<T>
 * @deprecated Will be removed in v8. Use {@link connectable} to create a connectable observable.
 * If you are using the `refCount` method of `ConnectableObservable`, use the {@link share} operator
 * instead.
 * Details: https://rxjs.dev/deprecations/multicasting
 */
export class ConnectableObservable<T> extends Observable<T> {
  protected _subject: Subject<T> | null = null;
  protected _refCount: number = 0;
  protected _connection: Subscription | null = null;

  /**
   * @param source The source observable
   * @param subjectFactory The factory that creates the subject used internally.
   * @deprecated Will be removed in v8. Use {@link connectable} to create a connectable observable.
   * `new ConnectableObservable(source, factory)` is equivalent to
   * `connectable(source, { connector: factory })`.
   * When the `refCount()` method is needed, the {@link share} operator should be used instead:
   * `new ConnectableObservable(source, factory).refCount()` is equivalent to
   * `source.pipe(share({ connector: factory }))`.
   * Details: https://rxjs.dev/deprecations/multicasting
   */
  constructor(public source: Observable<T>, protected subjectFactory: () => Subject<T>) {
    super();
    // If we have lift, monkey patch that here. This is done so custom observable
    // types will compose through multicast. Otherwise the resulting observable would
    // simply be an instance of `ConnectableObservable`.
    if (hasLift(source)) {
      this.lift = source.lift;
    }
  }

  /** @internal */
  protected _subscribe(subscriber: Subscriber<T>) {
    return this.getSubject().subscribe(subscriber);
  }

  protected getSubject(): Subject<T> {
    const subject = this._subject;
    if (!subject || subject.isStopped) {
      this._subject = this.subjectFactory();
    }
    return this._subject!;
  }

  protected _teardown() {
    this._refCount = 0;
    const { _connection } = this;
    this._subject = this._connection = null;
    _connection?.unsubscribe();
  }

  /**
   * @deprecated {@link ConnectableObservable} will be removed in v8. Use {@link connectable} instead.
   * Details: https://rxjs.dev/deprecations/multicasting
   */
  connect(): Subscription {
    let connection = this._connection;
    if (!connection) {
      connection = this._connection = new Subscription();
      const subject = this.getSubject();
      connection.add(
        this.source.subscribe(
          createOperatorSubscriber(
            subject as any,
            undefined,
            () => {
              this._teardown();
              subject.complete();
            },
            (err) => {
              this._teardown();
              subject.error(err);
            },
            () => this._teardown()
          )
        )
      );

      if (connection.closed) {
        this._connection = null;
        connection = Subscription.EMPTY;
      }
    }
    return connection;
  }

  /**
   * @deprecated {@link ConnectableObservable} will be removed in v8. Use the {@link share} operator instead.
   * Details: https://rxjs.dev/deprecations/multicasting
   */
  refCount(): Observable<T> {
    return higherOrderRefCount()(this) as Observable<T>;
  }
}
/* @prettier */
import { SchedulerLike } from '../types';
import { Observable } from '../Observable';
import { bindCallbackInternals } from './bindCallbackInternals';

export function bindCallback(
  callbackFunc: (...args: any[]) => void,
  resultSelector: (...args: any[]) => any,
  scheduler?: SchedulerLike
): (...args: any[]) => Observable<any>;

// args is the arguments array and we push the callback on the rest tuple since the rest parameter must be last (only item) in a parameter list
export function bindCallback<A extends readonly unknown[], R extends readonly unknown[]>(
  callbackFunc: (...args: [...A, (...res: R) => void]) => void,
  schedulerLike?: SchedulerLike
): (...arg: A) => Observable<R extends [] ? void : R extends [any] ? R[0] : R>;

/**
 * Converts a callback API to a function that returns an Observable.
 *
 * <span class="informal">Give it a function `f` of type `f(x, callback)` and
 * it will return a function `g` that when called as `g(x)` will output an
 * Observable.</span>
 *
 * `bindCallback` is not an operator because its input and output are not
 * Observables. The input is a function `func` with some parameters. The
 * last parameter must be a callback function that `func` calls when it is
 * done.
 *
 * The output of `bindCallback` is a function that takes the same parameters
 * as `func`, except the last one (the callback). When the output function
 * is called with arguments it will return an Observable. If function `func`
 * calls its callback with one argument, the Observable will emit that value.
 * If on the other hand the callback is called with multiple values the resulting
 * Observable will emit an array with said values as arguments.
 *
 * It is **very important** to remember that input function `func` is not called
 * when the output function is, but rather when the Observable returned by the output
 * function is subscribed. This means if `func` makes an AJAX request, that request
 * will be made every time someone subscribes to the resulting Observable, but not before.
 *
 * The last optional parameter - `scheduler` - can be used to control when the call
 * to `func` happens after someone subscribes to Observable, as well as when results
 * passed to callback will be emitted. By default, the subscription to an Observable calls `func`
 * synchronously, but using {@link asyncScheduler} as the last parameter will defer the call to `func`,
 * just like wrapping the call in `setTimeout` with a timeout of `0` would. If you were to use the async Scheduler
 * and call `subscribe` on the output Observable, all function calls that are currently executing
 * will end before `func` is invoked.
 *
 * By default, results passed to the callback are emitted immediately after `func` invokes the callback.
 * In particular, if the callback is called synchronously, then the subscription of the resulting Observable
 * will call the `next` function synchronously as well.  If you want to defer that call,
 * you may use {@link asyncScheduler} just as before.  This means that by using `Scheduler.async` you can
 * ensure that `func` always calls its callback asynchronously, thus avoiding terrifying Zalgo.
 *
 * Note that the Observable created by the output function will always emit a single value
 * and then complete immediately. If `func` calls the callback multiple times, values from subsequent
 * calls will not appear in the stream. If you need to listen for multiple calls,
 *  you probably want to use {@link fromEvent} or {@link fromEventPattern} instead.
 *
 * If `func` depends on some context (`this` property) and is not already bound, the context of `func`
 * will be the context that the output function has at call time. In particular, if `func`
 * is called as a method of some objec and if `func` is not already bound, in order to preserve the context
 * it is recommended that the context of the output function is set to that object as well.
 *
 * If the input function calls its callback in the "node style" (i.e. first argument to callback is
 * optional error parameter signaling whether the call failed or not), {@link bindNodeCallback}
 * provides convenient error handling and probably is a better choice.
 * `bindCallback` will treat such functions the same as any other and error parameters
 * (whether passed or not) will always be interpreted as regular callback argument.
 *
 * ## Examples
 *
 * ### Convert jQuery's getJSON to an Observable API
 * ```ts
 * import { bindCallback } from 'rxjs';
 * import * as jQuery from 'jquery';
 *
 * // Suppose we have jQuery.getJSON('/my/url', callback)
 * const getJSONAsObservable = bindCallback(jQuery.getJSON);
 * const result = getJSONAsObservable('/my/url');
 * result.subscribe(x => console.log(x), e => console.error(e));
 * ```
 *
 * ### Receive an array of arguments passed to a callback
 * ```ts
 * import { bindCallback } from 'rxjs';
 *
 * const someFunction = (cb) => {
 *   cb(5, 'some string', {someProperty: 'someValue'})
 * };
 *
 * const boundSomeFunction = bindCallback(someFunction);
 * boundSomeFunction(12, 10).subscribe(values => {
 *   console.log(values); // [22, 2]
 * });
 * ```
 *
 * ### Compare behaviour with and without async Scheduler
 * ```ts
 * import { bindCallback, asyncScheduler } from 'rxjs';
 *
 * function iCallMyCallbackSynchronously(cb) {
 *   cb();
 * }
 *
 * const boundSyncFn = bindCallback(iCallMyCallbackSynchronously);
 * const boundAsyncFn = bindCallback(iCallMyCallbackSynchronously, null, asyncScheduler);
 *
 * boundSyncFn().subscribe(() => console.log('I was sync!'));
 * boundAsyncFn().subscribe(() => console.log('I was async!'));
 * console.log('This happened...');
 *
 * // Logs:
 * // I was sync!
 * // This happened...
 * // I was async!
 * ```
 *
 * ### Use bindCallback on an object method
 * ```ts
 * import { bindCallback } from 'rxjs';
 *
 * const boundMethod = bindCallback(someObject.methodWithCallback);
 * boundMethod
 *   .call(someObject) // make sure methodWithCallback has access to someObject
 *   .subscribe(subscriber);
 * ```
 *
 * @see {@link bindNodeCallback}
 * @see {@link from}
 *
 * @param {function} func A function with a callback as the last parameter.
 * @param {SchedulerLike} [scheduler] The scheduler on which to schedule the
 * callbacks.
 * @return {function(...params: *): Observable} A function which returns the
 * Observable that delivers the same values the callback would deliver.
 */
export function bindCallback(
  callbackFunc: (...args: [...any[], (...res: any) => void]) => void,
  resultSelector?: ((...args: any[]) => any) | SchedulerLike,
  scheduler?: SchedulerLike
): (...args: any[]) => Observable<unknown> {
  return bindCallbackInternals(false, callbackFunc, resultSelector, scheduler);
}
import { SchedulerLike } from '../types';
import { isScheduler } from '../util/isScheduler';
import { Observable } from '../Observable';
import { subscribeOn } from '../operators/subscribeOn';
import { mapOneOrManyArgs } from '../util/mapOneOrManyArgs';
import { observeOn } from '../operators/observeOn';
import { AsyncSubject } from '../AsyncSubject';

export function bindCallbackInternals(
  isNodeStyle: boolean,
  callbackFunc: any,
  resultSelector?: any,
  scheduler?: SchedulerLike
): (...args: any[]) => Observable<unknown> {
  if (resultSelector) {
    if (isScheduler(resultSelector)) {
      scheduler = resultSelector;
    } else {
      // The user provided a result selector.
      return function (this: any, ...args: any[]) {
        return (bindCallbackInternals(isNodeStyle, callbackFunc, scheduler) as any)
          .apply(this, args)
          .pipe(mapOneOrManyArgs(resultSelector as any));
      };
    }
  }

  // If a scheduler was passed, use our `subscribeOn` and `observeOn` operators
  // to compose that behavior for the user.
  if (scheduler) {
    return function (this: any, ...args: any[]) {
      return (bindCallbackInternals(isNodeStyle, callbackFunc) as any)
        .apply(this, args)
        .pipe(subscribeOn(scheduler!), observeOn(scheduler!));
    };
  }

  return function (this: any, ...args: any[]): Observable<any> {
    // We're using AsyncSubject, because it emits when it completes,
    // and it will play the value to all late-arriving subscribers.
    const subject = new AsyncSubject<any>();

    // If this is true, then we haven't called our function yet.
    let uninitialized = true;
    return new Observable((subscriber) => {
      // Add our subscriber to the subject.
      const subs = subject.subscribe(subscriber);

      if (uninitialized) {
        uninitialized = false;
        // We're going to execute the bound function
        // This bit is to signal that we are hitting the callback asychronously.
        // Because we don't have any anti-"Zalgo" gaurantees with whatever
        // function we are handed, we use this bit to figure out whether or not
        // we are getting hit in a callback synchronously during our call.
        let isAsync = false;

        // This is used to signal that the callback completed synchronously.
        let isComplete = false;

        // Call our function that has a callback. If at any time during this
        // call, an error is thrown, it will be caught by the Observable
        // subscription process and sent to the consumer.
        callbackFunc.apply(
          // Pass the appropriate `this` context.
          this,
          [
            // Pass the arguments.
            ...args,
            // And our callback handler.
            (...results: any[]) => {
              if (isNodeStyle) {
                // If this is a node callback, shift the first value off of the
                // results and check it, as it is the error argument. By shifting,
                // we leave only the argument(s) we want to pass to the consumer.
                const err = results.shift();
                if (err != null) {
                  subject.error(err);
                  // If we've errored, we can stop processing this function
                  // as there's nothing else to do. Just return to escape.
                  return;
                }
              }
              // If we have one argument, notify the consumer
              // of it as a single value, otherwise, if there's more than one, pass
              // them as an array. Note that if there are no arguments, `undefined`
              // will be emitted.
              subject.next(1 < results.length ? results : results[0]);
              // Flip this flag, so we know we can complete it in the synchronous
              // case below.
              isComplete = true;
              // If we're not asynchronous, we need to defer the `complete` call
              // until after the call to the function is over. This is because an
              // error could be thrown in the function after it calls our callback,
              // and if that is the case, if we complete here, we are unable to notify
              // the consumer than an error occured.
              if (isAsync) {
                subject.complete();
              }
            },
          ]
        );
        // If we flipped `isComplete` during the call, we resolved synchronously,
        // notify complete, because we skipped it in the callback to wait
        // to make sure there were no errors during the call.
        if (isComplete) {
          subject.complete();
        }

        // We're no longer synchronous. If the callback is called at this point
        // we can notify complete on the spot.
        isAsync = true;
      }

      // Return the subscription fron adding our subscriber to the subject.
      return subs;
    });
  };
}
/* @prettier */
import { Observable } from '../Observable';
import { SchedulerLike } from '../types';
import { bindCallbackInternals } from './bindCallbackInternals';

export function bindNodeCallback(
  callbackFunc: (...args: any[]) => void,
  resultSelector: (...args: any[]) => any,
  scheduler?: SchedulerLike
): (...args: any[]) => Observable<any>;

// args is the arguments array and we push the callback on the rest tuple since the rest parameter must be last (only item) in a parameter list
export function bindNodeCallback<A extends readonly unknown[], R extends readonly unknown[]>(
  callbackFunc: (...args: [...A, (err: any, ...res: R) => void]) => void,
  schedulerLike?: SchedulerLike
): (...arg: A) => Observable<R extends [] ? void : R extends [any] ? R[0] : R>;

/**
 * Converts a Node.js-style callback API to a function that returns an
 * Observable.
 *
 * <span class="informal">It's just like {@link bindCallback}, but the
 * callback is expected to be of type `callback(error, result)`.</span>
 *
 * `bindNodeCallback` is not an operator because its input and output are not
 * Observables. The input is a function `func` with some parameters, but the
 * last parameter must be a callback function that `func` calls when it is
 * done. The callback function is expected to follow Node.js conventions,
 * where the first argument to the callback is an error object, signaling
 * whether call was successful. If that object is passed to callback, it means
 * something went wrong.
 *
 * The output of `bindNodeCallback` is a function that takes the same
 * parameters as `func`, except the last one (the callback). When the output
 * function is called with arguments, it will return an Observable.
 * If `func` calls its callback with error parameter present, Observable will
 * error with that value as well. If error parameter is not passed, Observable will emit
 * second parameter. If there are more parameters (third and so on),
 * Observable will emit an array with all arguments, except first error argument.
 *
 * Note that `func` will not be called at the same time output function is,
 * but rather whenever resulting Observable is subscribed. By default call to
 * `func` will happen synchronously after subscription, but that can be changed
 * with proper `scheduler` provided as optional third parameter. {@link SchedulerLike}
 * can also control when values from callback will be emitted by Observable.
 * To find out more, check out documentation for {@link bindCallback}, where
 * {@link SchedulerLike} works exactly the same.
 *
 * As in {@link bindCallback}, context (`this` property) of input function will be set to context
 * of returned function, when it is called.
 *
 * After Observable emits value, it will complete immediately. This means
 * even if `func` calls callback again, values from second and consecutive
 * calls will never appear on the stream. If you need to handle functions
 * that call callbacks multiple times, check out {@link fromEvent} or
 * {@link fromEventPattern} instead.
 *
 * Note that `bindNodeCallback` can be used in non-Node.js environments as well.
 * "Node.js-style" callbacks are just a convention, so if you write for
 * browsers or any other environment and API you use implements that callback style,
 * `bindNodeCallback` can be safely used on that API functions as well.
 *
 * Remember that Error object passed to callback does not have to be an instance
 * of JavaScript built-in `Error` object. In fact, it does not even have to an object.
 * Error parameter of callback function is interpreted as "present", when value
 * of that parameter is truthy. It could be, for example, non-zero number, non-empty
 * string or boolean `true`. In all of these cases resulting Observable would error
 * with that value. This means usually regular style callbacks will fail very often when
 * `bindNodeCallback` is used. If your Observable errors much more often then you
 * would expect, check if callback really is called in Node.js-style and, if not,
 * switch to {@link bindCallback} instead.
 *
 * Note that even if error parameter is technically present in callback, but its value
 * is falsy, it still won't appear in array emitted by Observable.
 *
 * ## Examples
 * ###  Read a file from the filesystem and get the data as an Observable
 * ```ts
 * import * as fs from 'fs';
 * const readFileAsObservable = bindNodeCallback(fs.readFile);
 * const result = readFileAsObservable('./roadNames.txt', 'utf8');
 * result.subscribe(x => console.log(x), e => console.error(e));
 * ```
 *
 * ### Use on function calling callback with multiple arguments
 * ```ts
 * someFunction((err, a, b) => {
 *   console.log(err); // null
 *   console.log(a); // 5
 *   console.log(b); // "some string"
 * });
 * const boundSomeFunction = bindNodeCallback(someFunction);
 * boundSomeFunction()
 * .subscribe(value => {
 *   console.log(value); // [5, "some string"]
 * });
 * ```
 *
 * ### Use on function calling callback in regular style
 * ```ts
 * someFunction(a => {
 *   console.log(a); // 5
 * });
 * const boundSomeFunction = bindNodeCallback(someFunction);
 * boundSomeFunction()
 * .subscribe(
 *   value => {}             // never gets called
 *   err => console.log(err) // 5
 * );
 * ```
 *
 * @see {@link bindCallback}
 * @see {@link from}
 *
 * @param {function} func Function with a Node.js-style callback as the last parameter.
 * @param {SchedulerLike} [scheduler] The scheduler on which to schedule the
 * callbacks.
 * @return {function(...params: *): Observable} A function which returns the
 * Observable that delivers the same values the Node.js callback would
 * deliver.
 */
export function bindNodeCallback(
  callbackFunc: (...args: [...any[], (err: any, ...res: any) => void]) => void,
  resultSelector?: ((...args: any[]) => any) | SchedulerLike,
  scheduler?: SchedulerLike
): (...args: any[]) => Observable<any> {
  return bindCallbackInternals(true, callbackFunc, resultSelector, scheduler);
}
import { Observable } from '../Observable';
import { ObservableInput, SchedulerLike, ObservedValueOf, ObservableInputTuple } from '../types';
import { argsArgArrayOrObject } from '../util/argsArgArrayOrObject';
import { Subscriber } from '../Subscriber';
import { from } from './from';
import { identity } from '../util/identity';
import { Subscription } from '../Subscription';
import { mapOneOrManyArgs } from '../util/mapOneOrManyArgs';
import { popResultSelector, popScheduler } from '../util/args';
import { createObject } from '../util/createObject';
import { createOperatorSubscriber } from '../operators/OperatorSubscriber';
import { AnyCatcher } from '../AnyCatcher';
import { executeSchedule } from '../util/executeSchedule';

// combineLatest(any)
// We put this first because we need to catch cases where the user has supplied
// _exactly `any`_ as the argument. Since `any` literally matches _anything_,
// we don't want it to randomly hit one of the other type signatures below,
// as we have no idea at build-time what type we should be returning when given an any.

/**
 * You have passed `any` here, we can't figure out if it is
 * an array or an object, so you're getting `unknown`. Use better types.
 * @param arg Something typed as `any`
 */
export function combineLatest<T extends AnyCatcher>(arg: T): Observable<unknown>;

// combineLatest([a, b, c])
export function combineLatest(sources: []): Observable<never>;
export function combineLatest<A extends readonly unknown[]>(sources: readonly [...ObservableInputTuple<A>]): Observable<A>;
/** @deprecated The `scheduler` parameter will be removed in v8. Use `scheduled` and `combineLatestAll`. Details: https://rxjs.dev/deprecations/scheduler-argument */
export function combineLatest<A extends readonly unknown[], R>(
  sources: readonly [...ObservableInputTuple<A>],
  resultSelector: (...values: A) => R,
  scheduler: SchedulerLike
): Observable<R>;
export function combineLatest<A extends readonly unknown[], R>(
  sources: readonly [...ObservableInputTuple<A>],
  resultSelector: (...values: A) => R
): Observable<R>;
/** @deprecated The `scheduler` parameter will be removed in v8. Use `scheduled` and `combineLatestAll`. Details: https://rxjs.dev/deprecations/scheduler-argument */
export function combineLatest<A extends readonly unknown[]>(
  sources: readonly [...ObservableInputTuple<A>],
  scheduler: SchedulerLike
): Observable<A>;

// combineLatest(a, b, c)
/** @deprecated Pass an array of sources instead. The rest-parameters signature will be removed in v8. Details: https://rxjs.dev/deprecations/array-argument */
export function combineLatest<A extends readonly unknown[]>(...sources: [...ObservableInputTuple<A>]): Observable<A>;
/** @deprecated The `scheduler` parameter will be removed in v8. Use `scheduled` and `combineLatestAll`. Details: https://rxjs.dev/deprecations/scheduler-argument */
export function combineLatest<A extends readonly unknown[], R>(
  ...sourcesAndResultSelectorAndScheduler: [...ObservableInputTuple<A>, (...values: A) => R, SchedulerLike]
): Observable<R>;
/** @deprecated Pass an array of sources instead. The rest-parameters signature will be removed in v8. Details: https://rxjs.dev/deprecations/array-argument */
export function combineLatest<A extends readonly unknown[], R>(
  ...sourcesAndResultSelector: [...ObservableInputTuple<A>, (...values: A) => R]
): Observable<R>;
/** @deprecated The `scheduler` parameter will be removed in v8. Use `scheduled` and `combineLatestAll`. Details: https://rxjs.dev/deprecations/scheduler-argument */
export function combineLatest<A extends readonly unknown[]>(
  ...sourcesAndScheduler: [...ObservableInputTuple<A>, SchedulerLike]
): Observable<A>;

// combineLatest({a, b, c})
export function combineLatest(sourcesObject: { [K in any]: never }): Observable<never>;
export function combineLatest<T extends Record<string, ObservableInput<any>>>(
  sourcesObject: T
): Observable<{ [K in keyof T]: ObservedValueOf<T[K]> }>;

/**
 * Combines multiple Observables to create an Observable whose values are
 * calculated from the latest values of each of its input Observables.
 *
 * <span class="informal">Whenever any input Observable emits a value, it
 * computes a formula using the latest values from all the inputs, then emits
 * the output of that formula.</span>
 *
 * ![](combineLatest.png)
 *
 * `combineLatest` combines the values from all the Observables passed in the
 * observables array. This is done by subscribing to each Observable in order and,
 * whenever any Observable emits, collecting an array of the most recent
 * values from each Observable. So if you pass `n` Observables to this operator,
 * the returned Observable will always emit an array of `n` values, in an order
 * corresponding to the order of the passed Observables (the value from the first Observable
 * will be at index 0 of the array and so on).
 *
 * Static version of `combineLatest` accepts an array of Observables. Note that an array of
 * Observables is a good choice, if you don't know beforehand how many Observables
 * you will combine. Passing an empty array will result in an Observable that
 * completes immediately.
 *
 * To ensure the output array always has the same length, `combineLatest` will
 * actually wait for all input Observables to emit at least once,
 * before it starts emitting results. This means if some Observable emits
 * values before other Observables started emitting, all these values but the last
 * will be lost. On the other hand, if some Observable does not emit a value but
 * completes, resulting Observable will complete at the same moment without
 * emitting anything, since it will now be impossible to include a value from the
 * completed Observable in the resulting array. Also, if some input Observable does
 * not emit any value and never completes, `combineLatest` will also never emit
 * and never complete, since, again, it will wait for all streams to emit some
 * value.
 *
 * If at least one Observable was passed to `combineLatest` and all passed Observables
 * emitted something, the resulting Observable will complete when all combined
 * streams complete. So even if some Observable completes, the result of
 * `combineLatest` will still emit values when other Observables do. In case
 * of a completed Observable, its value from now on will always be the last
 * emitted value. On the other hand, if any Observable errors, `combineLatest`
 * will error immediately as well, and all other Observables will be unsubscribed.
 *
 * ## Examples
 *
 * Combine two timer Observables
 *
 * ```ts
 * import { timer, combineLatest } from 'rxjs';
 *
 * const firstTimer = timer(0, 1000); // emit 0, 1, 2... after every second, starting from now
 * const secondTimer = timer(500, 1000); // emit 0, 1, 2... after every second, starting 0,5s from now
 * const combinedTimers = combineLatest([firstTimer, secondTimer]);
 * combinedTimers.subscribe(value => console.log(value));
 * // Logs
 * // [0, 0] after 0.5s
 * // [1, 0] after 1s
 * // [1, 1] after 1.5s
 * // [2, 1] after 2s
 * ```
 *
 * Combine a dictionary of Observables
 *
 * ```ts
 * import { of, delay, startWith, combineLatest } from 'rxjs';
 *
 * const observables = {
 *   a: of(1).pipe(delay(1000), startWith(0)),
 *   b: of(5).pipe(delay(5000), startWith(0)),
 *   c: of(10).pipe(delay(10000), startWith(0))
 * };
 * const combined = combineLatest(observables);
 * combined.subscribe(value => console.log(value));
 * // Logs
 * // { a: 0, b: 0, c: 0 } immediately
 * // { a: 1, b: 0, c: 0 } after 1s
 * // { a: 1, b: 5, c: 0 } after 5s
 * // { a: 1, b: 5, c: 10 } after 10s
 * ```
 *
 * Combine an array of Observables
 *
 * ```ts
 * import { of, delay, startWith, combineLatest } from 'rxjs';
 *
 * const observables = [1, 5, 10].map(
 *   n => of(n).pipe(
 *     delay(n * 1000), // emit 0 and then emit n after n seconds
 *     startWith(0)
 *   )
 * );
 * const combined = combineLatest(observables);
 * combined.subscribe(value => console.log(value));
 * // Logs
 * // [0, 0, 0] immediately
 * // [1, 0, 0] after 1s
 * // [1, 5, 0] after 5s
 * // [1, 5, 10] after 10s
 * ```
 *
 * Use map operator to dynamically calculate the Body-Mass Index
 *
 * ```ts
 * import { of, combineLatest, map } from 'rxjs';
 *
 * const weight = of(70, 72, 76, 79, 75);
 * const height = of(1.76, 1.77, 1.78);
 * const bmi = combineLatest([weight, height]).pipe(
 *   map(([w, h]) => w / (h * h)),
 * );
 * bmi.subscribe(x => console.log('BMI is ' + x));
 *
 * // With output to console:
 * // BMI is 24.212293388429753
 * // BMI is 23.93948099205209
 * // BMI is 23.671253629592222
 * ```
 *
 * @see {@link combineLatestAll}
 * @see {@link merge}
 * @see {@link withLatestFrom}
 *
 * @param {ObservableInput} [observables] An array of input Observables to combine with each other.
 * An array of Observables must be given as the first argument.
 * @param {function} [project] An optional function to project the values from
 * the combined latest values into a new value on the output Observable.
 * @param {SchedulerLike} [scheduler=null] The {@link SchedulerLike} to use for subscribing to
 * each input Observable.
 * @return {Observable} An Observable of projected values from the most recent
 * values from each input Observable, or an array of the most recent values from
 * each input Observable.
 */
export function combineLatest<O extends ObservableInput<any>, R>(...args: any[]): Observable<R> | Observable<ObservedValueOf<O>[]> {
  const scheduler = popScheduler(args);
  const resultSelector = popResultSelector(args);

  const { args: observables, keys } = argsArgArrayOrObject(args);

  if (observables.length === 0) {
    // If no observables are passed, or someone has passed an ampty array
    // of observables, or even an empty object POJO, we need to just
    // complete (EMPTY), but we have to honor the scheduler provided if any.
    return from([], scheduler as any);
  }

  const result = new Observable<ObservedValueOf<O>[]>(
    combineLatestInit(
      observables as ObservableInput<ObservedValueOf<O>>[],
      scheduler,
      keys
        ? // A handler for scrubbing the array of args into a dictionary.
          (values) => createObject(keys, values)
        : // A passthrough to just return the array
          identity
    )
  );

  return resultSelector ? (result.pipe(mapOneOrManyArgs(resultSelector)) as Observable<R>) : result;
}

export function combineLatestInit(
  observables: ObservableInput<any>[],
  scheduler?: SchedulerLike,
  valueTransform: (values: any[]) => any = identity
) {
  return (subscriber: Subscriber<any>) => {
    // The outer subscription. We're capturing this in a function
    // because we may have to schedule it.
    maybeSchedule(
      scheduler,
      () => {
        const { length } = observables;
        // A store for the values each observable has emitted so far. We match observable to value on index.
        const values = new Array(length);
        // The number of currently active subscriptions, as they complete, we decrement this number to see if
        // we are all done combining values, so we can complete the result.
        let active = length;
        // The number of inner sources that still haven't emitted the first value
        // We need to track this because all sources need to emit one value in order
        // to start emitting values.
        let remainingFirstValues = length;
        // The loop to kick off subscription. We're keying everything on index `i` to relate the observables passed
        // in to the slot in the output array or the key in the array of keys in the output dictionary.
        for (let i = 0; i < length; i++) {
          maybeSchedule(
            scheduler,
            () => {
              const source = from(observables[i], scheduler as any);
              let hasFirstValue = false;
              source.subscribe(
                createOperatorSubscriber(
                  subscriber,
                  (value) => {
                    // When we get a value, record it in our set of values.
                    values[i] = value;
                    if (!hasFirstValue) {
                      // If this is our first value, record that.
                      hasFirstValue = true;
                      remainingFirstValues--;
                    }
                    if (!remainingFirstValues) {
                      // We're not waiting for any more
                      // first values, so we can emit!
                      subscriber.next(valueTransform(values.slice()));
                    }
                  },
                  () => {
                    if (!--active) {
                      // We only complete the result if we have no more active
                      // inner observables.
                      subscriber.complete();
                    }
                  }
                )
              );
            },
            subscriber
          );
        }
      },
      subscriber
    );
  };
}

/**
 * A small utility to handle the couple of locations where we want to schedule if a scheduler was provided,
 * but we don't if there was no scheduler.
 */
function maybeSchedule(scheduler: SchedulerLike | undefined, execute: () => void, subscription: Subscription) {
  if (scheduler) {
    executeSchedule(subscription, scheduler, execute);
  } else {
    execute();
  }
}
import { Observable } from '../Observable';
import { ObservableInputTuple, SchedulerLike } from '../types';
import { concatAll } from '../operators/concatAll';
import { popScheduler } from '../util/args';
import { from } from './from';

export function concat<T extends readonly unknown[]>(...inputs: [...ObservableInputTuple<T>]): Observable<T[number]>;
export function concat<T extends readonly unknown[]>(
  ...inputsAndScheduler: [...ObservableInputTuple<T>, SchedulerLike]
): Observable<T[number]>;

/**
 * Creates an output Observable which sequentially emits all values from the first given
 * Observable and then moves on to the next.
 *
 * <span class="informal">Concatenates multiple Observables together by
 * sequentially emitting their values, one Observable after the other.</span>
 *
 * ![](concat.png)
 *
 * `concat` joins multiple Observables together, by subscribing to them one at a time and
 * merging their results into the output Observable. You can pass either an array of
 * Observables, or put them directly as arguments. Passing an empty array will result
 * in Observable that completes immediately.
 *
 * `concat` will subscribe to first input Observable and emit all its values, without
 * changing or affecting them in any way. When that Observable completes, it will
 * subscribe to then next Observable passed and, again, emit its values. This will be
 * repeated, until the operator runs out of Observables. When last input Observable completes,
 * `concat` will complete as well. At any given moment only one Observable passed to operator
 * emits values. If you would like to emit values from passed Observables concurrently, check out
 * {@link merge} instead, especially with optional `concurrent` parameter. As a matter of fact,
 * `concat` is an equivalent of `merge` operator with `concurrent` parameter set to `1`.
 *
 * Note that if some input Observable never completes, `concat` will also never complete
 * and Observables following the one that did not complete will never be subscribed. On the other
 * hand, if some Observable simply completes immediately after it is subscribed, it will be
 * invisible for `concat`, which will just move on to the next Observable.
 *
 * If any Observable in chain errors, instead of passing control to the next Observable,
 * `concat` will error immediately as well. Observables that would be subscribed after
 * the one that emitted error, never will.
 *
 * If you pass to `concat` the same Observable many times, its stream of values
 * will be "replayed" on every subscription, which means you can repeat given Observable
 * as many times as you like. If passing the same Observable to `concat` 1000 times becomes tedious,
 * you can always use {@link repeat}.
 *
 * ## Examples
 *
 * Concatenate a timer counting from 0 to 3 with a synchronous sequence from 1 to 10
 *
 * ```ts
 * import { interval, take, range, concat } from 'rxjs';
 *
 * const timer = interval(1000).pipe(take(4));
 * const sequence = range(1, 10);
 * const result = concat(timer, sequence);
 * result.subscribe(x => console.log(x));
 *
 * // results in:
 * // 0 -1000ms-> 1 -1000ms-> 2 -1000ms-> 3 -immediate-> 1 ... 10
 * ```
 *
 * Concatenate 3 Observables
 *
 * ```ts
 * import { interval, take, concat } from 'rxjs';
 *
 * const timer1 = interval(1000).pipe(take(10));
 * const timer2 = interval(2000).pipe(take(6));
 * const timer3 = interval(500).pipe(take(10));
 *
 * const result = concat(timer1, timer2, timer3);
 * result.subscribe(x => console.log(x));
 *
 * // results in the following:
 * // (Prints to console sequentially)
 * // -1000ms-> 0 -1000ms-> 1 -1000ms-> ... 9
 * // -2000ms-> 0 -2000ms-> 1 -2000ms-> ... 5
 * // -500ms-> 0 -500ms-> 1 -500ms-> ... 9
 * ```
 *
 * Concatenate the same Observable to repeat it
 *
 * ```ts
 * import { interval, take, concat } from 'rxjs';
 *
 * const timer = interval(1000).pipe(take(2));
 *
 * concat(timer, timer) // concatenating the same Observable!
 *   .subscribe({
 *     next: value => console.log(value),
 *     complete: () => console.log('...and it is done!')
 *   });
 *
 * // Logs:
 * // 0 after 1s
 * // 1 after 2s
 * // 0 after 3s
 * // 1 after 4s
 * // '...and it is done!' also after 4s
 * ```
 *
 * @see {@link concatAll}
 * @see {@link concatMap}
 * @see {@link concatMapTo}
 * @see {@link startWith}
 * @see {@link endWith}
 *
 * @param args Input Observables to concatenate.
 */
export function concat(...args: any[]): Observable<unknown> {
  return concatAll()(from(args, popScheduler(args)));
}
import { Connectable, ObservableInput, SubjectLike } from '../types';
import { Subject } from '../Subject';
import { Subscription } from '../Subscription';
import { Observable } from '../Observable';
import { defer } from './defer';

export interface ConnectableConfig<T> {
  /**
   * A factory function used to create the Subject through which the source
   * is multicast. By default this creates a {@link Subject}.
   */
  connector: () => SubjectLike<T>;
  /**
   * If true, the resulting observable will reset internal state upon disconnetion
   * and return to a "cold" state. This allows the resulting observable to be
   * reconnected.
   * If false, upon disconnection, the connecting subject will remain the
   * connecting subject, meaning the resulting observable will not go "cold" again,
   * and subsequent repeats or resubscriptions will resubscribe to that same subject.
   */
  resetOnDisconnect?: boolean;
}

/**
 * The default configuration for `connectable`.
 */
const DEFAULT_CONFIG: ConnectableConfig<unknown> = {
  connector: () => new Subject<unknown>(),
  resetOnDisconnect: true,
};

/**
 * Creates an observable that multicasts once `connect()` is called on it.
 *
 * @param source The observable source to make connectable.
 * @param config The configuration object for `connectable`.
 * @returns A "connectable" observable, that has a `connect()` method, that you must call to
 * connect the source to all consumers through the subject provided as the connector.
 */
export function connectable<T>(source: ObservableInput<T>, config: ConnectableConfig<T> = DEFAULT_CONFIG): Connectable<T> {
  // The subscription representing the connection.
  let connection: Subscription | null = null;
  const { connector, resetOnDisconnect = true } = config;
  let subject = connector();

  const result: any = new Observable<T>((subscriber) => {
    return subject.subscribe(subscriber);
  });

  // Define the `connect` function. This is what users must call
  // in order to "connect" the source to the subject that is
  // multicasting it.
  result.connect = () => {
    if (!connection || connection.closed) {
      connection = defer(() => source).subscribe(subject);
      if (resetOnDisconnect) {
        connection.add(() => (subject = connector()));
      }
    }
    return connection;
  };

  return result;
}
import { Observable } from '../Observable';
import { ObservedValueOf, ObservableInput } from '../types';
import { innerFrom } from './innerFrom';

/**
 * Creates an Observable that, on subscribe, calls an Observable factory to
 * make an Observable for each new Observer.
 *
 * <span class="informal">Creates the Observable lazily, that is, only when it
 * is subscribed.
 * </span>
 *
 * ![](defer.png)
 *
 * `defer` allows you to create an Observable only when the Observer
 * subscribes. It waits until an Observer subscribes to it, calls the given
 * factory function to get an Observable -- where a factory function typically
 * generates a new Observable -- and subscribes the Observer to this Observable.
 * In case the factory function returns a falsy value, then EMPTY is used as
 * Observable instead. Last but not least, an exception during the factory
 * function call is transferred to the Observer by calling `error`.
 *
 * ## Example
 *
 * Subscribe to either an Observable of clicks or an Observable of interval, at random
 *
 * ```ts
 * import { defer, fromEvent, interval } from 'rxjs';
 *
 * const clicksOrInterval = defer(() => {
 *   return Math.random() > 0.5
 *     ? fromEvent(document, 'click')
 *     : interval(1000);
 * });
 * clicksOrInterval.subscribe(x => console.log(x));
 *
 * // Results in the following behavior:
 * // If the result of Math.random() is greater than 0.5 it will listen
 * // for clicks anywhere on the "document"; when document is clicked it
 * // will log a MouseEvent object to the console. If the result is less
 * // than 0.5 it will emit ascending numbers, one every second(1000ms).
 * ```
 *
 * @see {@link Observable}
 *
 * @param {function(): ObservableInput} observableFactory The Observable
 * factory function to invoke for each Observer that subscribes to the output
 * Observable. May also return a Promise, which will be converted on the fly
 * to an Observable.
 * @return {Observable} An Observable whose Observers' subscriptions trigger
 * an invocation of the given Observable factory function.
 */
export function defer<R extends ObservableInput<any>>(observableFactory: () => R): Observable<ObservedValueOf<R>> {
  return new Observable<ObservedValueOf<R>>((subscriber) => {
    innerFrom(observableFactory()).subscribe(subscriber);
  });
}
import { Subject, AnonymousSubject } from '../../Subject';
import { Subscriber } from '../../Subscriber';
import { Observable } from '../../Observable';
import { Subscription } from '../../Subscription';
import { Operator } from '../../Operator';
import { ReplaySubject } from '../../ReplaySubject';
import { Observer, NextObserver } from '../../types';

/**
 * WebSocketSubjectConfig is a plain Object that allows us to make our
 * webSocket configurable.
 *
 * <span class="informal">Provides flexibility to {@link webSocket}</span>
 *
 * It defines a set of properties to provide custom behavior in specific
 * moments of the socket's lifecycle. When the connection opens we can
 * use `openObserver`, when the connection is closed `closeObserver`, if we
 * are interested in listening for data coming from server: `deserializer`,
 * which allows us to customize the deserialization strategy of data before passing it
 * to the socket client. By default, `deserializer` is going to apply `JSON.parse` to each message coming
 * from the Server.
 *
 * ## Examples
 *
 * **deserializer**, the default for this property is `JSON.parse` but since there are just two options
 * for incoming data, either be text or binarydata. We can apply a custom deserialization strategy
 * or just simply skip the default behaviour.
 *
 * ```ts
 * import { webSocket } from 'rxjs/webSocket';
 *
 * const wsSubject = webSocket({
 *   url: 'ws://localhost:8081',
 *   //Apply any transformation of your choice.
 *   deserializer: ({ data }) => data
 * });
 *
 * wsSubject.subscribe(console.log);
 *
 * // Let's suppose we have this on the Server: ws.send('This is a msg from the server')
 * //output
 * //
 * // This is a msg from the server
 * ```
 *
 * **serializer** allows us to apply custom serialization strategy but for the outgoing messages.
 *
 * ```ts
 * import { webSocket } from 'rxjs/webSocket';
 *
 * const wsSubject = webSocket({
 *   url: 'ws://localhost:8081',
 *   // Apply any transformation of your choice.
 *   serializer: msg => JSON.stringify({ channel: 'webDevelopment', msg: msg })
 * });
 *
 * wsSubject.subscribe(() => subject.next('msg to the server'));
 *
 * // Let's suppose we have this on the Server:
 * //   ws.on('message', msg => console.log);
 * //   ws.send('This is a msg from the server');
 * // output at server side:
 * //
 * // {"channel":"webDevelopment","msg":"msg to the server"}
 * ```
 *
 * **closeObserver** allows us to set a custom error when an error raises up.
 *
 * ```ts
 * import { webSocket } from 'rxjs/webSocket';
 *
 * const wsSubject = webSocket({
 *   url: 'ws://localhost:8081',
 *   closeObserver: {
 *     next() {
 *       const customError = { code: 6666, reason: 'Custom evil reason' }
 *       console.log(`code: ${ customError.code }, reason: ${ customError.reason }`);
 *     }
 *   }
 * });
 *
 * // output
 * // code: 6666, reason: Custom evil reason
 * ```
 *
 * **openObserver**, Let's say we need to make some kind of init task before sending/receiving msgs to the
 * webSocket or sending notification that the connection was successful, this is when
 * openObserver is useful for.
 *
 * ```ts
 * import { webSocket } from 'rxjs/webSocket';
 *
 * const wsSubject = webSocket({
 *   url: 'ws://localhost:8081',
 *   openObserver: {
 *     next: () => {
 *       console.log('Connection ok');
 *     }
 *   }
 * });
 *
 * // output
 * // Connection ok
 * ```
 */
export interface WebSocketSubjectConfig<T> {
  /** The url of the socket server to connect to */
  url: string;
  /** The protocol to use to connect */
  protocol?: string | Array<string>;
  /** @deprecated Will be removed in v8. Use {@link deserializer} instead. */
  resultSelector?: (e: MessageEvent) => T;
  /**
   * A serializer used to create messages from passed values before the
   * messages are sent to the server. Defaults to JSON.stringify.
   */
  serializer?: (value: T) => WebSocketMessage;
  /**
   * A deserializer used for messages arriving on the socket from the
   * server. Defaults to JSON.parse.
   */
  deserializer?: (e: MessageEvent) => T;
  /**
   * An Observer that watches when open events occur on the underlying web socket.
   */
  openObserver?: NextObserver<Event>;
  /**
   * An Observer that watches when close events occur on the underlying web socket
   */
  closeObserver?: NextObserver<CloseEvent>;
  /**
   * An Observer that watches when a close is about to occur due to
   * unsubscription.
   */
  closingObserver?: NextObserver<void>;
  /**
   * A WebSocket constructor to use. This is useful for situations like using a
   * WebSocket impl in Node (WebSocket is a DOM API), or for mocking a WebSocket
   * for testing purposes
   */
  WebSocketCtor?: { new (url: string, protocols?: string | string[]): WebSocket };
  /** Sets the `binaryType` property of the underlying WebSocket. */
  binaryType?: 'blob' | 'arraybuffer';
}

const DEFAULT_WEBSOCKET_CONFIG: WebSocketSubjectConfig<any> = {
  url: '',
  deserializer: (e: MessageEvent) => JSON.parse(e.data),
  serializer: (value: any) => JSON.stringify(value),
};

const WEBSOCKETSUBJECT_INVALID_ERROR_OBJECT =
  'WebSocketSubject.error must be called with an object with an error code, and an optional reason: { code: number, reason: string }';

export type WebSocketMessage = string | ArrayBuffer | Blob | ArrayBufferView;

export class WebSocketSubject<T> extends AnonymousSubject<T> {
  // @ts-ignore: Property has no initializer and is not definitely assigned
  private _config: WebSocketSubjectConfig<T>;

  /** @internal */
  // @ts-ignore: Property has no initializer and is not definitely assigned
  _output: Subject<T>;

  private _socket: WebSocket | null = null;

  constructor(urlConfigOrSource: string | WebSocketSubjectConfig<T> | Observable<T>, destination?: Observer<T>) {
    super();
    if (urlConfigOrSource instanceof Observable) {
      this.destination = destination;
      this.source = urlConfigOrSource as Observable<T>;
    } else {
      const config = (this._config = { ...DEFAULT_WEBSOCKET_CONFIG });
      this._output = new Subject<T>();
      if (typeof urlConfigOrSource === 'string') {
        config.url = urlConfigOrSource;
      } else {
        for (const key in urlConfigOrSource) {
          if (urlConfigOrSource.hasOwnProperty(key)) {
            (config as any)[key] = (urlConfigOrSource as any)[key];
          }
        }
      }

      if (!config.WebSocketCtor && WebSocket) {
        config.WebSocketCtor = WebSocket;
      } else if (!config.WebSocketCtor) {
        throw new Error('no WebSocket constructor can be found');
      }
      this.destination = new ReplaySubject();
    }
  }

  /** @deprecated Internal implementation detail, do not use directly. Will be made internal in v8. */
  lift<R>(operator: Operator<T, R>): WebSocketSubject<R> {
    const sock = new WebSocketSubject<R>(this._config as WebSocketSubjectConfig<any>, this.destination as any);
    sock.operator = operator;
    sock.source = this;
    return sock;
  }

  private _resetState() {
    this._socket = null;
    if (!this.source) {
      this.destination = new ReplaySubject();
    }
    this._output = new Subject<T>();
  }

  /**
   * Creates an {@link Observable}, that when subscribed to, sends a message,
   * defined by the `subMsg` function, to the server over the socket to begin a
   * subscription to data over that socket. Once data arrives, the
   * `messageFilter` argument will be used to select the appropriate data for
   * the resulting Observable. When finalization occurs, either due to
   * unsubscription, completion, or error, a message defined by the `unsubMsg`
   * argument will be sent to the server over the WebSocketSubject.
   *
   * @param subMsg A function to generate the subscription message to be sent to
   * the server. This will still be processed by the serializer in the
   * WebSocketSubject's config. (Which defaults to JSON serialization)
   * @param unsubMsg A function to generate the unsubscription message to be
   * sent to the server at finalization. This will still be processed by the
   * serializer in the WebSocketSubject's config.
   * @param messageFilter A predicate for selecting the appropriate messages
   * from the server for the output stream.
   */
  multiplex(subMsg: () => any, unsubMsg: () => any, messageFilter: (value: T) => boolean) {
    const self = this;
    return new Observable((observer: Observer<T>) => {
      try {
        self.next(subMsg());
      } catch (err) {
        observer.error(err);
      }

      const subscription = self.subscribe({
        next: (x) => {
          try {
            if (messageFilter(x)) {
              observer.next(x);
            }
          } catch (err) {
            observer.error(err);
          }
        },
        error: (err) => observer.error(err),
        complete: () => observer.complete(),
      });

      return () => {
        try {
          self.next(unsubMsg());
        } catch (err) {
          observer.error(err);
        }
        subscription.unsubscribe();
      };
    });
  }

  private _connectSocket() {
    const { WebSocketCtor, protocol, url, binaryType } = this._config;
    const observer = this._output;

    let socket: WebSocket | null = null;
    try {
      socket = protocol ? new WebSocketCtor!(url, protocol) : new WebSocketCtor!(url);
      this._socket = socket;
      if (binaryType) {
        this._socket.binaryType = binaryType;
      }
    } catch (e) {
      observer.error(e);
      return;
    }

    const subscription = new Subscription(() => {
      this._socket = null;
      if (socket && socket.readyState === 1) {
        socket.close();
      }
    });

    socket.onopen = (evt: Event) => {
      const { _socket } = this;
      if (!_socket) {
        socket!.close();
        this._resetState();
        return;
      }
      const { openObserver } = this._config;
      if (openObserver) {
        openObserver.next(evt);
      }

      const queue = this.destination;

      this.destination = Subscriber.create<T>(
        (x) => {
          if (socket!.readyState === 1) {
            try {
              const { serializer } = this._config;
              socket!.send(serializer!(x!));
            } catch (e) {
              this.destination!.error(e);
            }
          }
        },
        (err) => {
          const { closingObserver } = this._config;
          if (closingObserver) {
            closingObserver.next(undefined);
          }
          if (err && err.code) {
            socket!.close(err.code, err.reason);
          } else {
            observer.error(new TypeError(WEBSOCKETSUBJECT_INVALID_ERROR_OBJECT));
          }
          this._resetState();
        },
        () => {
          const { closingObserver } = this._config;
          if (closingObserver) {
            closingObserver.next(undefined);
          }
          socket!.close();
          this._resetState();
        }
      ) as Subscriber<any>;

      if (queue && queue instanceof ReplaySubject) {
        subscription.add((queue as ReplaySubject<T>).subscribe(this.destination));
      }
    };

    socket.onerror = (e: Event) => {
      this._resetState();
      observer.error(e);
    };

    socket.onclose = (e: CloseEvent) => {
      if (socket === this._socket) {
        this._resetState();
      }
      const { closeObserver } = this._config;
      if (closeObserver) {
        closeObserver.next(e);
      }
      if (e.wasClean) {
        observer.complete();
      } else {
        observer.error(e);
      }
    };

    socket.onmessage = (e: MessageEvent) => {
      try {
        const { deserializer } = this._config;
        observer.next(deserializer!(e));
      } catch (err) {
        observer.error(err);
      }
    };
  }

  /** @internal */
  protected _subscribe(subscriber: Subscriber<T>): Subscription {
    const { source } = this;
    if (source) {
      return source.subscribe(subscriber);
    }
    if (!this._socket) {
      this._connectSocket();
    }
    this._output.subscribe(subscriber);
    subscriber.add(() => {
      const { _socket } = this;
      if (this._output.observers.length === 0) {
        if (_socket && (_socket.readyState === 1 || _socket.readyState === 0)) {
          _socket.close();
        }
        this._resetState();
      }
    });
    return subscriber;
  }

  unsubscribe() {
    const { _socket } = this;
    if (_socket && (_socket.readyState === 1 || _socket.readyState === 0)) {
      _socket.close();
    }
    this._resetState();
    super.unsubscribe();
  }
}
import { Observable } from '../../Observable';
import { Subscription } from '../../Subscription';
import { TimestampProvider } from '../../types';
import { performanceTimestampProvider } from '../../scheduler/performanceTimestampProvider';
import { animationFrameProvider } from '../../scheduler/animationFrameProvider';

/**
 * An observable of animation frames
 *
 * Emits the amount of time elapsed since subscription and the timestamp on each animation frame.
 * Defaults to milliseconds provided to the requestAnimationFrame's callback. Does not end on its own.
 *
 * Every subscription will start a separate animation loop. Since animation frames are always scheduled
 * by the browser to occur directly before a repaint, scheduling more than one animation frame synchronously
 * should not be much different or have more overhead than looping over an array of events during
 * a single animation frame. However, if for some reason the developer would like to ensure the
 * execution of animation-related handlers are all executed during the same task by the engine,
 * the `share` operator can be used.
 *
 * This is useful for setting up animations with RxJS.
 *
 * ## Examples
 *
 * Tweening a div to move it on the screen
 *
 * ```ts
 * import { animationFrames, map, takeWhile, endWith } from 'rxjs';
 *
 * function tween(start: number, end: number, duration: number) {
 *   const diff = end - start;
 *   return animationFrames().pipe(
 *     // Figure out what percentage of time has passed
 *     map(({ elapsed }) => elapsed / duration),
 *     // Take the vector while less than 100%
 *     takeWhile(v => v < 1),
 *     // Finish with 100%
 *     endWith(1),
 *     // Calculate the distance traveled between start and end
 *     map(v => v * diff + start)
 *   );
 * }
 *
 * // Setup a div for us to move around
 * const div = document.createElement('div');
 * document.body.appendChild(div);
 * div.style.position = 'absolute';
 * div.style.width = '40px';
 * div.style.height = '40px';
 * div.style.backgroundColor = 'lime';
 * div.style.transform = 'translate3d(10px, 0, 0)';
 *
 * tween(10, 200, 4000).subscribe(x => {
 *   div.style.transform = `translate3d(${ x }px, 0, 0)`;
 * });
 * ```
 *
 * Providing a custom timestamp provider
 *
 * ```ts
 * import { animationFrames, TimestampProvider } from 'rxjs';
 *
 * // A custom timestamp provider
 * let now = 0;
 * const customTSProvider: TimestampProvider = {
 *   now() { return now++; }
 * };
 *
 * const source$ = animationFrames(customTSProvider);
 *
 * // Log increasing numbers 0...1...2... on every animation frame.
 * source$.subscribe(({ elapsed }) => console.log(elapsed));
 * ```
 *
 * @param timestampProvider An object with a `now` method that provides a numeric timestamp
 */
export function animationFrames(timestampProvider?: TimestampProvider) {
  return timestampProvider ? animationFramesFactory(timestampProvider) : DEFAULT_ANIMATION_FRAMES;
}

/**
 * Does the work of creating the observable for `animationFrames`.
 * @param timestampProvider The timestamp provider to use to create the observable
 */
function animationFramesFactory(timestampProvider?: TimestampProvider) {
  const { schedule } = animationFrameProvider;
  return new Observable<{ timestamp: number; elapsed: number }>((subscriber) => {
    const subscription = new Subscription();
    // If no timestamp provider is specified, use performance.now() - as it
    // will return timestamps 'compatible' with those passed to the run
    // callback and won't be affected by NTP adjustments, etc.
    const provider = timestampProvider || performanceTimestampProvider;
    // Capture the start time upon subscription, as the run callback can remain
    // queued for a considerable period of time and the elapsed time should
    // represent the time elapsed since subscription - not the time since the
    // first rendered animation frame.
    const start = provider.now();
    const run = (timestamp: DOMHighResTimeStamp | number) => {
      // Use the provider's timestamp to calculate the elapsed time. Note that
      // this means - if the caller hasn't passed a provider - that
      // performance.now() will be used instead of the timestamp that was
      // passed to the run callback. The reason for this is that the timestamp
      // passed to the callback can be earlier than the start time, as it
      // represents the time at which the browser decided it would render any
      // queued frames - and that time can be earlier the captured start time.
      const now = provider.now();
      subscriber.next({
        timestamp: timestampProvider ? now : timestamp,
        elapsed: now - start,
      });
      if (!subscriber.closed) {
        subscription.add(schedule(run));
      }
    };
    subscription.add(schedule(run));
    return subscription;
  });
}

/**
 * In the common case, where the timestamp provided by the rAF API is used,
 * we use this shared observable to reduce overhead.
 */
const DEFAULT_ANIMATION_FRAMES = animationFramesFactory();
import { createOperatorSubscriber } from '../../operators/OperatorSubscriber';
import { Observable } from '../../Observable';
import { innerFrom } from '../../observable/innerFrom';
import { ObservableInput } from '../../types';

export function fromFetch<T>(
  input: string | Request,
  init: RequestInit & {
    selector: (response: Response) => ObservableInput<T>;
  }
): Observable<T>;

export function fromFetch(input: string | Request, init?: RequestInit): Observable<Response>;

/**
 * Uses [the Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) to
 * make an HTTP request.
 *
 * **WARNING** Parts of the fetch API are still experimental. `AbortController` is
 * required for this implementation to work and use cancellation appropriately.
 *
 * Will automatically set up an internal [AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
 * in order to finalize the internal `fetch` when the subscription tears down.
 *
 * If a `signal` is provided via the `init` argument, it will behave like it usually does with
 * `fetch`. If the provided `signal` aborts, the error that `fetch` normally rejects with
 * in that scenario will be emitted as an error from the observable.
 *
 * ## Examples
 *
 * Basic use
 *
 * ```ts
 * import { fromFetch } from 'rxjs/fetch';
 * import { switchMap, of, catchError } from 'rxjs';
 *
 * const data$ = fromFetch('https://api.github.com/users?per_page=5').pipe(
 *   switchMap(response => {
 *     if (response.ok) {
 *       // OK return data
 *       return response.json();
 *     } else {
 *       // Server is returning a status requiring the client to try something else.
 *       return of({ error: true, message: `Error ${ response.status }` });
 *     }
 *   }),
 *   catchError(err => {
 *     // Network or other error, handle appropriately
 *     console.error(err);
 *     return of({ error: true, message: err.message })
 *   })
 * );
 *
 * data$.subscribe({
 *   next: result => console.log(result),
 *   complete: () => console.log('done')
 * });
 * ```
 *
 * ### Use with Chunked Transfer Encoding
 *
 * With HTTP responses that use [chunked transfer encoding](https://tools.ietf.org/html/rfc7230#section-3.3.1),
 * the promise returned by `fetch` will resolve as soon as the response's headers are
 * received.
 *
 * That means the `fromFetch` observable will emit a `Response` - and will
 * then complete - before the body is received. When one of the methods on the
 * `Response` - like `text()` or `json()` - is called, the returned promise will not
 * resolve until the entire body has been received. Unsubscribing from any observable
 * that uses the promise as an observable input will not abort the request.
 *
 * To facilitate aborting the retrieval of responses that use chunked transfer encoding,
 * a `selector` can be specified via the `init` parameter:
 *
 * ```ts
 * import { of } from 'rxjs';
 * import { fromFetch } from 'rxjs/fetch';
 *
 * const data$ = fromFetch('https://api.github.com/users?per_page=5', {
 *   selector: response => response.json()
 * });
 *
 * data$.subscribe({
 *   next: result => console.log(result),
 *   complete: () => console.log('done')
 * });
 * ```
 *
 * @param input The resource you would like to fetch. Can be a url or a request object.
 * @param initWithSelector A configuration object for the fetch.
 * [See MDN for more details](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch#Parameters)
 * @returns An Observable, that when subscribed to, performs an HTTP request using the native `fetch`
 * function. The {@link Subscription} is tied to an `AbortController` for the fetch.
 */
export function fromFetch<T>(
  input: string | Request,
  initWithSelector: RequestInit & {
    selector?: (response: Response) => ObservableInput<T>;
  } = {}
): Observable<Response | T> {
  const { selector, ...init } = initWithSelector;
  return new Observable<Response | T>((subscriber) => {
    // Our controller for aborting this fetch.
    // Any externally provided AbortSignal will have to call
    // abort on this controller when signaled, because the
    // signal from this controller is what is being passed to `fetch`.
    const controller = new AbortController();
    const { signal } = controller;
    // This flag exists to make sure we don't `abort()` the fetch upon tearing down
    // this observable after emitting a Response. Aborting in such circumstances
    // would also abort subsequent methods - like `json()` - that could be called
    // on the Response. Consider: `fromFetch().pipe(take(1), mergeMap(res => res.json()))`
    let abortable = true;

    // If the user provided an init configuration object,
    // let's process it and chain our abort signals, if necessary.
    // If a signal is provided, just have it finalized. It's a cancellation token, basically.
    const { signal: outerSignal } = init;
    if (outerSignal) {
      if (outerSignal.aborted) {
        controller.abort();
      } else {
        // We got an AbortSignal from the arguments passed into `fromFetch`.
        // We need to wire up our AbortController to abort when this signal aborts.
        const outerSignalHandler = () => {
          if (!signal.aborted) {
            controller.abort();
          }
        };
        outerSignal.addEventListener('abort', outerSignalHandler);
        subscriber.add(() => outerSignal.removeEventListener('abort', outerSignalHandler));
      }
    }

    // The initialization object passed to `fetch` as the second
    // argument. This ferries in important information, including our
    // AbortSignal. Create a new init, so we don't accidentally mutate the
    // passed init, or reassign it. This is because the init passed in
    // is shared between each subscription to the result.
    const perSubscriberInit: RequestInit = { ...init, signal };

    const handleError = (err: any) => {
      abortable = false;
      subscriber.error(err);
    };

    fetch(input, perSubscriberInit)
      .then((response) => {
        if (selector) {
          // If we have a selector function, use it to project our response.
          // Note that any error that comes from our selector will be
          // sent to the promise `catch` below and handled.
          innerFrom(selector(response)).subscribe(
            createOperatorSubscriber(
              subscriber,
              // Values are passed through to the subscriber
              undefined,
              // The projected response is complete.
              () => {
                abortable = false;
                subscriber.complete();
              },
              handleError
            )
          );
        } else {
          abortable = false;
          subscriber.next(response);
          subscriber.complete();
        }
      })
      .catch(handleError);

    return () => {
      if (abortable) {
        controller.abort();
      }
    };
  });
}
import { WebSocketSubject, WebSocketSubjectConfig } from './WebSocketSubject';

/**
 * Wrapper around the w3c-compatible WebSocket object provided by the browser.
 *
 * <span class="informal">{@link Subject} that communicates with a server via WebSocket</span>
 *
 * `webSocket` is a factory function that produces a `WebSocketSubject`,
 * which can be used to make WebSocket connection with an arbitrary endpoint.
 * `webSocket` accepts as an argument either a string with url of WebSocket endpoint, or an
 * {@link WebSocketSubjectConfig} object for providing additional configuration, as
 * well as Observers for tracking lifecycle of WebSocket connection.
 *
 * When `WebSocketSubject` is subscribed, it attempts to make a socket connection,
 * unless there is one made already. This means that many subscribers will always listen
 * on the same socket, thus saving resources. If however, two instances are made of `WebSocketSubject`,
 * even if these two were provided with the same url, they will attempt to make separate
 * connections. When consumer of a `WebSocketSubject` unsubscribes, socket connection is closed,
 * only if there are no more subscribers still listening. If after some time a consumer starts
 * subscribing again, connection is reestablished.
 *
 * Once connection is made, whenever a new message comes from the server, `WebSocketSubject` will emit that
 * message as a value in the stream. By default, a message from the socket is parsed via `JSON.parse`. If you
 * want to customize how deserialization is handled (if at all), you can provide custom `resultSelector`
 * function in {@link WebSocketSubject}. When connection closes, stream will complete, provided it happened without
 * any errors. If at any point (starting, maintaining or closing a connection) there is an error,
 * stream will also error with whatever WebSocket API has thrown.
 *
 * By virtue of being a {@link Subject}, `WebSocketSubject` allows for receiving and sending messages from the server. In order
 * to communicate with a connected endpoint, use `next`, `error` and `complete` methods. `next` sends a value to the server, so bear in mind
 * that this value will not be serialized beforehand. Because of This, `JSON.stringify` will have to be called on a value by hand,
 * before calling `next` with a result. Note also that if at the moment of nexting value
 * there is no socket connection (for example no one is subscribing), those values will be buffered, and sent when connection
 * is finally established. `complete` method closes socket connection. `error` does the same,
 * as well as notifying the server that something went wrong via status code and string with details of what happened.
 * Since status code is required in WebSocket API, `WebSocketSubject` does not allow, like regular `Subject`,
 * arbitrary values being passed to the `error` method. It needs to be called with an object that has `code`
 * property with status code number and optional `reason` property with string describing details
 * of an error.
 *
 * Calling `next` does not affect subscribers of `WebSocketSubject` - they have no
 * information that something was sent to the server (unless of course the server
 * responds somehow to a message). On the other hand, since calling `complete` triggers
 * an attempt to close socket connection. If that connection is closed without any errors, stream will
 * complete, thus notifying all subscribers. And since calling `error` closes
 * socket connection as well, just with a different status code for the server, if closing itself proceeds
 * without errors, subscribed Observable will not error, as one might expect, but complete as usual. In both cases
 * (calling `complete` or `error`), if process of closing socket connection results in some errors, *then* stream
 * will error.
 *
 * **Multiplexing**
 *
 * `WebSocketSubject` has an additional operator, not found in other Subjects. It is called `multiplex` and it is
 * used to simulate opening several socket connections, while in reality maintaining only one.
 * For example, an application has both chat panel and real-time notifications about sport news. Since these are two distinct functions,
 * it would make sense to have two separate connections for each. Perhaps there could even be two separate services with WebSocket
 * endpoints, running on separate machines with only GUI combining them together. Having a socket connection
 * for each functionality could become too resource expensive. It is a common pattern to have single
 * WebSocket endpoint that acts as a gateway for the other services (in this case chat and sport news services).
 * Even though there is a single connection in a client app, having the ability to manipulate streams as if it
 * were two separate sockets is desirable. This eliminates manually registering and unregistering in a gateway for
 * given service and filter out messages of interest. This is exactly what `multiplex` method is for.
 *
 * Method accepts three parameters. First two are functions returning subscription and unsubscription messages
 * respectively. These are messages that will be sent to the server, whenever consumer of resulting Observable
 * subscribes and unsubscribes. Server can use them to verify that some kind of messages should start or stop
 * being forwarded to the client. In case of the above example application, after getting subscription message with proper identifier,
 * gateway server can decide that it should connect to real sport news service and start forwarding messages from it.
 * Note that both messages will be sent as returned by the functions, they are by default serialized using JSON.stringify, just
 * as messages pushed via `next`. Also bear in mind that these messages will be sent on *every* subscription and
 * unsubscription. This is potentially dangerous, because one consumer of an Observable may unsubscribe and the server
 * might stop sending messages, since it got unsubscription message. This needs to be handled
 * on the server or using {@link publish} on a Observable returned from 'multiplex'.
 *
 * Last argument to `multiplex` is a `messageFilter` function which should return a boolean. It is used to filter out messages
 * sent by the server to only those that belong to simulated WebSocket stream. For example, server might mark these
 * messages with some kind of string identifier on a message object and `messageFilter` would return `true`
 * if there is such identifier on an object emitted by the socket. Messages which returns `false` in `messageFilter` are simply skipped,
 * and are not passed down the stream.
 *
 * Return value of `multiplex` is an Observable with messages incoming from emulated socket connection. Note that this
 * is not a `WebSocketSubject`, so calling `next` or `multiplex` again will fail. For pushing values to the
 * server, use root `WebSocketSubject`.
 *
 * ## Examples
 *
 * Listening for messages from the server
 *
 * ```ts
 * import { webSocket } from 'rxjs/webSocket';
 *
 * const subject = webSocket('ws://localhost:8081');
 *
 * subject.subscribe({
 *   next: msg => console.log('message received: ' + msg), // Called whenever there is a message from the server.
 *   error: err => console.log(err), // Called if at any point WebSocket API signals some kind of error.
 *   complete: () => console.log('complete') // Called when connection is closed (for whatever reason).
 *  });
 * ```
 *
 * Pushing messages to the server
 *
 * ```ts
 * import { webSocket } from 'rxjs/webSocket';
 *
 * const subject = webSocket('ws://localhost:8081');
 *
 * subject.subscribe();
 * // Note that at least one consumer has to subscribe to the created subject - otherwise "nexted" values will be just buffered and not sent,
 * // since no connection was established!
 *
 * subject.next({ message: 'some message' });
 * // This will send a message to the server once a connection is made. Remember value is serialized with JSON.stringify by default!
 *
 * subject.complete(); // Closes the connection.
 *
 * subject.error({ code: 4000, reason: 'I think our app just broke!' });
 * // Also closes the connection, but let's the server know that this closing is caused by some error.
 * ```
 *
 * Multiplexing WebSocket
 *
 * ```ts
 * import { webSocket } from 'rxjs/webSocket';
 *
 * const subject = webSocket('ws://localhost:8081');
 *
 * const observableA = subject.multiplex(
 *   () => ({ subscribe: 'A' }), // When server gets this message, it will start sending messages for 'A'...
 *   () => ({ unsubscribe: 'A' }), // ...and when gets this one, it will stop.
 *   message => message.type === 'A' // If the function returns `true` message is passed down the stream. Skipped if the function returns false.
 * );
 *
 * const observableB = subject.multiplex( // And the same goes for 'B'.
 *   () => ({ subscribe: 'B' }),
 *   () => ({ unsubscribe: 'B' }),
 *   message => message.type === 'B'
 * );
 *
 * const subA = observableA.subscribe(messageForA => console.log(messageForA));
 * // At this moment WebSocket connection is established. Server gets '{"subscribe": "A"}' message and starts sending messages for 'A',
 * // which we log here.
 *
 * const subB = observableB.subscribe(messageForB => console.log(messageForB));
 * // Since we already have a connection, we just send '{"subscribe": "B"}' message to the server. It starts sending messages for 'B',
 * // which we log here.
 *
 * subB.unsubscribe();
 * // Message '{"unsubscribe": "B"}' is sent to the server, which stops sending 'B' messages.
 *
 * subA.unsubscribe();
 * // Message '{"unsubscribe": "A"}' makes the server stop sending messages for 'A'. Since there is no more subscribers to root Subject,
 * // socket connection closes.
 * ```
 *
 * @param {string|WebSocketSubjectConfig} urlConfigOrSource The WebSocket endpoint as an url or an object with
 * configuration and additional Observers.
 * @return {WebSocketSubject} Subject which allows to both send and receive messages via WebSocket connection.
 */
export function webSocket<T>(urlConfigOrSource: string | WebSocketSubjectConfig<T>): WebSocketSubject<T> {
  return new WebSocketSubject<T>(urlConfigOrSource);
}
import { Observable } from '../Observable';
import { SchedulerLike } from '../types';

/**
 * A simple Observable that emits no items to the Observer and immediately
 * emits a complete notification.
 *
 * <span class="informal">Just emits 'complete', and nothing else.</span>
 *
 * ![](empty.png)
 *
 * A simple Observable that only emits the complete notification. It can be used
 * for composing with other Observables, such as in a {@link mergeMap}.
 *
 * ## Examples
 *
 * Log complete notification
 *
 * ```ts
 * import { EMPTY } from 'rxjs';
 *
 * EMPTY.subscribe({
 *   next: () => console.log('Next'),
 *   complete: () => console.log('Complete!')
 * });
 *
 * // Outputs
 * // Complete!
 * ```
 *
 * Emit the number 7, then complete
 *
 * ```ts
 * import { EMPTY, startWith } from 'rxjs';
 *
 * const result = EMPTY.pipe(startWith(7));
 * result.subscribe(x => console.log(x));
 *
 * // Outputs
 * // 7
 * ```
 *
 * Map and flatten only odd numbers to the sequence `'a'`, `'b'`, `'c'`
 *
 * ```ts
 * import { interval, mergeMap, of, EMPTY } from 'rxjs';
 *
 * const interval$ = interval(1000);
 * const result = interval$.pipe(
 *   mergeMap(x => x % 2 === 1 ? of('a', 'b', 'c') : EMPTY),
 * );
 * result.subscribe(x => console.log(x));
 *
 * // Results in the following to the console:
 * // x is equal to the count on the interval, e.g. (0, 1, 2, 3, ...)
 * // x will occur every 1000ms
 * // if x % 2 is equal to 1, print a, b, c (each on its own)
 * // if x % 2 is not equal to 1, nothing will be output
 * ```
 *
 * @see {@link Observable}
 * @see {@link NEVER}
 * @see {@link of}
 * @see {@link throwError}
 */
export const EMPTY = new Observable<never>((subscriber) => subscriber.complete());

/**
 * @param scheduler A {@link SchedulerLike} to use for scheduling
 * the emission of the complete notification.
 * @deprecated Replaced with the {@link EMPTY} constant or {@link scheduled} (e.g. `scheduled([], scheduler)`). Will be removed in v8.
 */
export function empty(scheduler?: SchedulerLike) {
  return scheduler ? emptyScheduled(scheduler) : EMPTY;
}

function emptyScheduled(scheduler: SchedulerLike) {
  return new Observable<never>((subscriber) => scheduler.schedule(() => subscriber.complete()));
}
import { Observable } from '../Observable';
import { ObservedValueOf, ObservableInputTuple, ObservableInput } from '../types';
import { argsArgArrayOrObject } from '../util/argsArgArrayOrObject';
import { innerFrom } from './innerFrom';
import { popResultSelector } from '../util/args';
import { createOperatorSubscriber } from '../operators/OperatorSubscriber';
import { mapOneOrManyArgs } from '../util/mapOneOrManyArgs';
import { createObject } from '../util/createObject';
import { AnyCatcher } from '../AnyCatcher';

// forkJoin(any)
// We put this first because we need to catch cases where the user has supplied
// _exactly `any`_ as the argument. Since `any` literally matches _anything_,
// we don't want it to randomly hit one of the other type signatures below,
// as we have no idea at build-time what type we should be returning when given an any.

/**
 * You have passed `any` here, we can't figure out if it is
 * an array or an object, so you're getting `unknown`. Use better types.
 * @param arg Something typed as `any`
 */
export function forkJoin<T extends AnyCatcher>(arg: T): Observable<unknown>;

// forkJoin(null | undefined)
export function forkJoin(scheduler: null | undefined): Observable<never>;

// forkJoin([a, b, c])
export function forkJoin(sources: readonly []): Observable<never>;
export function forkJoin<A extends readonly unknown[]>(sources: readonly [...ObservableInputTuple<A>]): Observable<A>;
export function forkJoin<A extends readonly unknown[], R>(
  sources: readonly [...ObservableInputTuple<A>],
  resultSelector: (...values: A) => R
): Observable<R>;

// forkJoin(a, b, c)
/** @deprecated Pass an array of sources instead. The rest-parameters signature will be removed in v8. Details: https://rxjs.dev/deprecations/array-argument */
export function forkJoin<A extends readonly unknown[]>(...sources: [...ObservableInputTuple<A>]): Observable<A>;
/** @deprecated Pass an array of sources instead. The rest-parameters signature will be removed in v8. Details: https://rxjs.dev/deprecations/array-argument */
export function forkJoin<A extends readonly unknown[], R>(
  ...sourcesAndResultSelector: [...ObservableInputTuple<A>, (...values: A) => R]
): Observable<R>;

// forkJoin({a, b, c})
export function forkJoin(sourcesObject: { [K in any]: never }): Observable<never>;
export function forkJoin<T extends Record<string, ObservableInput<any>>>(
  sourcesObject: T
): Observable<{ [K in keyof T]: ObservedValueOf<T[K]> }>;

/**
 * Accepts an `Array` of {@link ObservableInput} or a dictionary `Object` of {@link ObservableInput} and returns
 * an {@link Observable} that emits either an array of values in the exact same order as the passed array,
 * or a dictionary of values in the same shape as the passed dictionary.
 *
 * <span class="informal">Wait for Observables to complete and then combine last values they emitted;
 * complete immediately if an empty array is passed.</span>
 *
 * ![](forkJoin.png)
 *
 * `forkJoin` is an operator that takes any number of input observables which can be passed either as an array
 * or a dictionary of input observables. If no input observables are provided (e.g. an empty array is passed),
 * then the resulting stream will complete immediately.
 *
 * `forkJoin` will wait for all passed observables to emit and complete and then it will emit an array or an object with last
 * values from corresponding observables.
 *
 * If you pass an array of `n` observables to the operator, then the resulting
 * array will have `n` values, where the first value is the last one emitted by the first observable,
 * second value is the last one emitted by the second observable and so on.
 *
 * If you pass a dictionary of observables to the operator, then the resulting
 * objects will have the same keys as the dictionary passed, with their last values they have emitted
 * located at the corresponding key.
 *
 * That means `forkJoin` will not emit more than once and it will complete after that. If you need to emit combined
 * values not only at the end of the lifecycle of passed observables, but also throughout it, try out {@link combineLatest}
 * or {@link zip} instead.
 *
 * In order for the resulting array to have the same length as the number of input observables, whenever any of
 * the given observables completes without emitting any value, `forkJoin` will complete at that moment as well
 * and it will not emit anything either, even if it already has some last values from other observables.
 * Conversely, if there is an observable that never completes, `forkJoin` will never complete either,
 * unless at any point some other observable completes without emitting a value, which brings us back to
 * the previous case. Overall, in order for `forkJoin` to emit a value, all given observables
 * have to emit something at least once and complete.
 *
 * If any given observable errors at some point, `forkJoin` will error as well and immediately unsubscribe
 * from the other observables.
 *
 * Optionally `forkJoin` accepts a `resultSelector` function, that will be called with values which normally
 * would land in the emitted array. Whatever is returned by the `resultSelector`, will appear in the output
 * observable instead. This means that the default `resultSelector` can be thought of as a function that takes
 * all its arguments and puts them into an array. Note that the `resultSelector` will be called only
 * when `forkJoin` is supposed to emit a result.
 *
 * ## Examples
 *
 * Use `forkJoin` with a dictionary of observable inputs
 *
 * ```ts
 * import { forkJoin, of, timer } from 'rxjs';
 *
 * const observable = forkJoin({
 *   foo: of(1, 2, 3, 4),
 *   bar: Promise.resolve(8),
 *   baz: timer(4000)
 * });
 * observable.subscribe({
 *  next: value => console.log(value),
 *  complete: () => console.log('This is how it ends!'),
 * });
 *
 * // Logs:
 * // { foo: 4, bar: 8, baz: 0 } after 4 seconds
 * // 'This is how it ends!' immediately after
 * ```
 *
 * Use `forkJoin` with an array of observable inputs
 *
 * ```ts
 * import { forkJoin, of, timer } from 'rxjs';
 *
 * const observable = forkJoin([
 *   of(1, 2, 3, 4),
 *   Promise.resolve(8),
 *   timer(4000)
 * ]);
 * observable.subscribe({
 *  next: value => console.log(value),
 *  complete: () => console.log('This is how it ends!'),
 * });
 *
 * // Logs:
 * // [4, 8, 0] after 4 seconds
 * // 'This is how it ends!' immediately after
 * ```
 *
 * @see {@link combineLatest}
 * @see {@link zip}
 *
 * @param {...ObservableInput} args Any number of Observables provided either as an array or as an arguments
 * passed directly to the operator.
 * @param {function} [project] Function that takes values emitted by input Observables and returns value
 * that will appear in resulting Observable instead of default array.
 * @return {Observable} Observable emitting either an array of last values emitted by passed Observables
 * or value from project function.
 */
export function forkJoin(...args: any[]): Observable<any> {
  const resultSelector = popResultSelector(args);
  const { args: sources, keys } = argsArgArrayOrObject(args);
  const result = new Observable((subscriber) => {
    const { length } = sources;
    if (!length) {
      subscriber.complete();
      return;
    }
    const values = new Array(length);
    let remainingCompletions = length;
    let remainingEmissions = length;
    for (let sourceIndex = 0; sourceIndex < length; sourceIndex++) {
      let hasValue = false;
      innerFrom(sources[sourceIndex]).subscribe(
        createOperatorSubscriber(
          subscriber,
          (value) => {
            if (!hasValue) {
              hasValue = true;
              remainingEmissions--;
            }
            values[sourceIndex] = value;
          },
          () => remainingCompletions--,
          undefined,
          () => {
            if (!remainingCompletions || !hasValue) {
              if (!remainingEmissions) {
                subscriber.next(keys ? createObject(keys, values) : values);
              }
              subscriber.complete();
            }
          }
        )
      );
    }
  });
  return resultSelector ? result.pipe(mapOneOrManyArgs(resultSelector)) : result;
}
import { Observable } from '../Observable';
import { ObservableInput, SchedulerLike, ObservedValueOf } from '../types';
import { scheduled } from '../scheduled/scheduled';
import { innerFrom } from './innerFrom';

export function from<O extends ObservableInput<any>>(input: O): Observable<ObservedValueOf<O>>;
/** @deprecated The `scheduler` parameter will be removed in v8. Use `scheduled`. Details: https://rxjs.dev/deprecations/scheduler-argument */
export function from<O extends ObservableInput<any>>(input: O, scheduler: SchedulerLike | undefined): Observable<ObservedValueOf<O>>;

/**
 * Creates an Observable from an Array, an array-like object, a Promise, an iterable object, or an Observable-like object.
 *
 * <span class="informal">Converts almost anything to an Observable.</span>
 *
 * ![](from.png)
 *
 * `from` converts various other objects and data types into Observables. It also converts a Promise, an array-like, or an
 * <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#iterable" target="_blank">iterable</a>
 * object into an Observable that emits the items in that promise, array, or iterable. A String, in this context, is treated
 * as an array of characters. Observable-like objects (contains a function named with the ES2015 Symbol for Observable) can also be
 * converted through this operator.
 *
 * ## Examples
 *
 * Converts an array to an Observable
 *
 * ```ts
 * import { from } from 'rxjs';
 *
 * const array = [10, 20, 30];
 * const result = from(array);
 *
 * result.subscribe(x => console.log(x));
 *
 * // Logs:
 * // 10
 * // 20
 * // 30
 * ```
 *
 * Convert an infinite iterable (from a generator) to an Observable
 *
 * ```ts
 * import { from, take } from 'rxjs';
 *
 * function* generateDoubles(seed) {
 *    let i = seed;
 *    while (true) {
 *      yield i;
 *      i = 2 * i; // double it
 *    }
 * }
 *
 * const iterator = generateDoubles(3);
 * const result = from(iterator).pipe(take(10));
 *
 * result.subscribe(x => console.log(x));
 *
 * // Logs:
 * // 3
 * // 6
 * // 12
 * // 24
 * // 48
 * // 96
 * // 192
 * // 384
 * // 768
 * // 1536
 * ```
 *
 * With `asyncScheduler`
 *
 * ```ts
 * import { from, asyncScheduler } from 'rxjs';
 *
 * console.log('start');
 *
 * const array = [10, 20, 30];
 * const result = from(array, asyncScheduler);
 *
 * result.subscribe(x => console.log(x));
 *
 * console.log('end');
 *
 * // Logs:
 * // 'start'
 * // 'end'
 * // 10
 * // 20
 * // 30
 * ```
 *
 * @see {@link fromEvent}
 * @see {@link fromEventPattern}
 *
 * @param {ObservableInput<T>} A subscription object, a Promise, an Observable-like,
 * an Array, an iterable, or an array-like object to be converted.
 * @param {SchedulerLike} An optional {@link SchedulerLike} on which to schedule the emission of values.
 * @return {Observable<T>}
 */
export function from<T>(input: ObservableInput<T>, scheduler?: SchedulerLike): Observable<T> {
  return scheduler ? scheduled(input, scheduler) : innerFrom(input);
}
import { innerFrom } from '../observable/innerFrom';
import { Observable } from '../Observable';
import { mergeMap } from '../operators/mergeMap';
import { isArrayLike } from '../util/isArrayLike';
import { isFunction } from '../util/isFunction';
import { mapOneOrManyArgs } from '../util/mapOneOrManyArgs';

// These constants are used to create handler registry functions using array mapping below.
const nodeEventEmitterMethods = ['addListener', 'removeListener'] as const;
const eventTargetMethods = ['addEventListener', 'removeEventListener'] as const;
const jqueryMethods = ['on', 'off'] as const;

export interface NodeStyleEventEmitter {
  addListener(eventName: string | symbol, handler: NodeEventHandler): this;
  removeListener(eventName: string | symbol, handler: NodeEventHandler): this;
}

export type NodeEventHandler = (...args: any[]) => void;

// For APIs that implement `addListener` and `removeListener` methods that may
// not use the same arguments or return EventEmitter values
// such as React Native
export interface NodeCompatibleEventEmitter {
  addListener(eventName: string, handler: NodeEventHandler): void | {};
  removeListener(eventName: string, handler: NodeEventHandler): void | {};
}

// Use handler types like those in @types/jquery. See:
// https://github.com/DefinitelyTyped/DefinitelyTyped/blob/847731ba1d7fa6db6b911c0e43aa0afe596e7723/types/jquery/misc.d.ts#L6395
export interface JQueryStyleEventEmitter<TContext, T> {
  on(eventName: string, handler: (this: TContext, t: T, ...args: any[]) => any): void;
  off(eventName: string, handler: (this: TContext, t: T, ...args: any[]) => any): void;
}

export interface EventListenerObject<E> {
  handleEvent(evt: E): void;
}

export interface HasEventTargetAddRemove<E> {
  addEventListener(
    type: string,
    listener: ((evt: E) => void) | EventListenerObject<E> | null,
    options?: boolean | AddEventListenerOptions
  ): void;
  removeEventListener(
    type: string,
    listener: ((evt: E) => void) | EventListenerObject<E> | null,
    options?: EventListenerOptions | boolean
  ): void;
}

export interface EventListenerOptions {
  capture?: boolean;
  passive?: boolean;
  once?: boolean;
}

export interface AddEventListenerOptions extends EventListenerOptions {
  once?: boolean;
  passive?: boolean;
}

export function fromEvent<T>(target: HasEventTargetAddRemove<T> | ArrayLike<HasEventTargetAddRemove<T>>, eventName: string): Observable<T>;
export function fromEvent<T, R>(
  target: HasEventTargetAddRemove<T> | ArrayLike<HasEventTargetAddRemove<T>>,
  eventName: string,
  resultSelector: (event: T) => R
): Observable<R>;
export function fromEvent<T>(
  target: HasEventTargetAddRemove<T> | ArrayLike<HasEventTargetAddRemove<T>>,
  eventName: string,
  options: EventListenerOptions
): Observable<T>;
export function fromEvent<T, R>(
  target: HasEventTargetAddRemove<T> | ArrayLike<HasEventTargetAddRemove<T>>,
  eventName: string,
  options: EventListenerOptions,
  resultSelector: (event: T) => R
): Observable<R>;

export function fromEvent(target: NodeStyleEventEmitter | ArrayLike<NodeStyleEventEmitter>, eventName: string): Observable<unknown>;
/** @deprecated Do not specify explicit type parameters. Signatures with type parameters that cannot be inferred will be removed in v8. */
export function fromEvent<T>(target: NodeStyleEventEmitter | ArrayLike<NodeStyleEventEmitter>, eventName: string): Observable<T>;
export function fromEvent<R>(
  target: NodeStyleEventEmitter | ArrayLike<NodeStyleEventEmitter>,
  eventName: string,
  resultSelector: (...args: any[]) => R
): Observable<R>;

export function fromEvent(
  target: NodeCompatibleEventEmitter | ArrayLike<NodeCompatibleEventEmitter>,
  eventName: string
): Observable<unknown>;
/** @deprecated Do not specify explicit type parameters. Signatures with type parameters that cannot be inferred will be removed in v8. */
export function fromEvent<T>(target: NodeCompatibleEventEmitter | ArrayLike<NodeCompatibleEventEmitter>, eventName: string): Observable<T>;
export function fromEvent<R>(
  target: NodeCompatibleEventEmitter | ArrayLike<NodeCompatibleEventEmitter>,
  eventName: string,
  resultSelector: (...args: any[]) => R
): Observable<R>;

export function fromEvent<T>(
  target: JQueryStyleEventEmitter<any, T> | ArrayLike<JQueryStyleEventEmitter<any, T>>,
  eventName: string
): Observable<T>;
export function fromEvent<T, R>(
  target: JQueryStyleEventEmitter<any, T> | ArrayLike<JQueryStyleEventEmitter<any, T>>,
  eventName: string,
  resultSelector: (value: T, ...args: any[]) => R
): Observable<R>;

/**
 * Creates an Observable that emits events of a specific type coming from the
 * given event target.
 *
 * <span class="informal">Creates an Observable from DOM events, or Node.js
 * EventEmitter events or others.</span>
 *
 * ![](fromEvent.png)
 *
 * `fromEvent` accepts as a first argument event target, which is an object with methods
 * for registering event handler functions. As a second argument it takes string that indicates
 * type of event we want to listen for. `fromEvent` supports selected types of event targets,
 * which are described in detail below. If your event target does not match any of the ones listed,
 * you should use {@link fromEventPattern}, which can be used on arbitrary APIs.
 * When it comes to APIs supported by `fromEvent`, their methods for adding and removing event
 * handler functions have different names, but they all accept a string describing event type
 * and function itself, which will be called whenever said event happens.
 *
 * Every time resulting Observable is subscribed, event handler function will be registered
 * to event target on given event type. When that event fires, value
 * passed as a first argument to registered function will be emitted by output Observable.
 * When Observable is unsubscribed, function will be unregistered from event target.
 *
 * Note that if event target calls registered function with more than one argument, second
 * and following arguments will not appear in resulting stream. In order to get access to them,
 * you can pass to `fromEvent` optional project function, which will be called with all arguments
 * passed to event handler. Output Observable will then emit value returned by project function,
 * instead of the usual value.
 *
 * Remember that event targets listed below are checked via duck typing. It means that
 * no matter what kind of object you have and no matter what environment you work in,
 * you can safely use `fromEvent` on that object if it exposes described methods (provided
 * of course they behave as was described above). So for example if Node.js library exposes
 * event target which has the same method names as DOM EventTarget, `fromEvent` is still
 * a good choice.
 *
 * If the API you use is more callback then event handler oriented (subscribed
 * callback function fires only once and thus there is no need to manually
 * unregister it), you should use {@link bindCallback} or {@link bindNodeCallback}
 * instead.
 *
 * `fromEvent` supports following types of event targets:
 *
 * **DOM EventTarget**
 *
 * This is an object with `addEventListener` and `removeEventListener` methods.
 *
 * In the browser, `addEventListener` accepts - apart from event type string and event
 * handler function arguments - optional third parameter, which is either an object or boolean,
 * both used for additional configuration how and when passed function will be called. When
 * `fromEvent` is used with event target of that type, you can provide this values
 * as third parameter as well.
 *
 * **Node.js EventEmitter**
 *
 * An object with `addListener` and `removeListener` methods.
 *
 * **JQuery-style event target**
 *
 * An object with `on` and `off` methods
 *
 * **DOM NodeList**
 *
 * List of DOM Nodes, returned for example by `document.querySelectorAll` or `Node.childNodes`.
 *
 * Although this collection is not event target in itself, `fromEvent` will iterate over all Nodes
 * it contains and install event handler function in every of them. When returned Observable
 * is unsubscribed, function will be removed from all Nodes.
 *
 * **DOM HtmlCollection**
 *
 * Just as in case of NodeList it is a collection of DOM nodes. Here as well event handler function is
 * installed and removed in each of elements.
 *
 *
 * ## Examples
 *
 * Emit clicks happening on the DOM document
 *
 * ```ts
 * import { fromEvent } from 'rxjs';
 *
 * const clicks = fromEvent(document, 'click');
 * clicks.subscribe(x => console.log(x));
 *
 * // Results in:
 * // MouseEvent object logged to console every time a click
 * // occurs on the document.
 * ```
 *
 * Use `addEventListener` with capture option
 *
 * ```ts
 * import { fromEvent } from 'rxjs';
 *
 * const clicksInDocument = fromEvent(document, 'click', true); // note optional configuration parameter
 *                                                              // which will be passed to addEventListener
 * const clicksInDiv = fromEvent(someDivInDocument, 'click');
 *
 * clicksInDocument.subscribe(() => console.log('document'));
 * clicksInDiv.subscribe(() => console.log('div'));
 *
 * // By default events bubble UP in DOM tree, so normally
 * // when we would click on div in document
 * // "div" would be logged first and then "document".
 * // Since we specified optional `capture` option, document
 * // will catch event when it goes DOWN DOM tree, so console
 * // will log "document" and then "div".
 * ```
 *
 * @see {@link bindCallback}
 * @see {@link bindNodeCallback}
 * @see {@link fromEventPattern}
 *
 * @param {FromEventTarget<T>} target The DOM EventTarget, Node.js
 * EventEmitter, JQuery-like event target, NodeList or HTMLCollection to attach the event handler to.
 * @param {string} eventName The event name of interest, being emitted by the
 * `target`.
 * @param {EventListenerOptions} [options] Options to pass through to addEventListener
 * @return {Observable<T>}
 */
export function fromEvent<T>(
  target: any,
  eventName: string,
  options?: EventListenerOptions | ((...args: any[]) => T),
  resultSelector?: (...args: any[]) => T
): Observable<T> {
  if (isFunction(options)) {
    resultSelector = options;
    options = undefined;
  }
  if (resultSelector) {
    return fromEvent<T>(target, eventName, options as EventListenerOptions).pipe(mapOneOrManyArgs(resultSelector));
  }

  // Figure out our add and remove methods. In order to do this,
  // we are going to analyze the target in a preferred order, if
  // the target matches a given signature, we take the two "add" and "remove"
  // method names and apply them to a map to create opposite versions of the
  // same function. This is because they all operate in duplicate pairs,
  // `addListener(name, handler)`, `removeListener(name, handler)`, for example.
  // The call only differs by method name, as to whether or not you're adding or removing.
  const [add, remove] =
    // If it is an EventTarget, we need to use a slightly different method than the other two patterns.
    isEventTarget(target)
      ? eventTargetMethods.map((methodName) => (handler: any) => target[methodName](eventName, handler, options as EventListenerOptions))
      : // In all other cases, the call pattern is identical with the exception of the method names.
      isNodeStyleEventEmitter(target)
      ? nodeEventEmitterMethods.map(toCommonHandlerRegistry(target, eventName))
      : isJQueryStyleEventEmitter(target)
      ? jqueryMethods.map(toCommonHandlerRegistry(target, eventName))
      : [];

  // If add is falsy, it's because we didn't match a pattern above.
  // Check to see if it is an ArrayLike, because if it is, we want to
  // try to apply fromEvent to all of it's items. We do this check last,
  // because there are may be some types that are both ArrayLike *and* implement
  // event registry points, and we'd rather delegate to that when possible.
  if (!add) {
    if (isArrayLike(target)) {
      return mergeMap((subTarget: any) => fromEvent(subTarget, eventName, options as EventListenerOptions))(
        innerFrom(target)
      ) as Observable<T>;
    }
  }

  // If add is falsy and we made it here, it's because we didn't
  // match any valid target objects above.
  if (!add) {
    throw new TypeError('Invalid event target');
  }

  return new Observable<T>((subscriber) => {
    // The handler we are going to register. Forwards the event object, by itself, or
    // an array of arguments to the event handler, if there is more than one argument,
    // to the consumer.
    const handler = (...args: any[]) => subscriber.next(1 < args.length ? args : args[0]);
    // Do the work of adding the handler to the target.
    add(handler);
    // When we finalize, we want to remove the handler and free up memory.
    return () => remove!(handler);
  });
}

/**
 * Used to create `add` and `remove` functions to register and unregister event handlers
 * from a target in the most common handler pattern, where there are only two arguments.
 * (e.g.  `on(name, fn)`, `off(name, fn)`, `addListener(name, fn)`, or `removeListener(name, fn)`)
 * @param target The target we're calling methods on
 * @param eventName The event name for the event we're creating register or unregister functions for
 */
function toCommonHandlerRegistry(target: any, eventName: string) {
  return (methodName: string) => (handler: any) => target[methodName](eventName, handler);
}

/**
 * Checks to see if the target implements the required node-style EventEmitter methods
 * for adding and removing event handlers.
 * @param target the object to check
 */
function isNodeStyleEventEmitter(target: any): target is NodeStyleEventEmitter {
  return isFunction(target.addListener) && isFunction(target.removeListener);
}

/**
 * Checks to see if the target implements the required jQuery-style EventEmitter methods
 * for adding and removing event handlers.
 * @param target the object to check
 */
function isJQueryStyleEventEmitter(target: any): target is JQueryStyleEventEmitter<any, any> {
  return isFunction(target.on) && isFunction(target.off);
}

/**
 * Checks to see if the target implements the required EventTarget methods
 * for adding and removing event handlers.
 * @param target the object to check
 */
function isEventTarget(target: any): target is HasEventTargetAddRemove<any> {
  return isFunction(target.addEventListener) && isFunction(target.removeEventListener);
}
import { Observable } from '../Observable';
import { isFunction } from '../util/isFunction';
import { NodeEventHandler } from './fromEvent';
import { mapOneOrManyArgs } from '../util/mapOneOrManyArgs';

/* tslint:disable:max-line-length */
export function fromEventPattern<T>(
  addHandler: (handler: NodeEventHandler) => any,
  removeHandler?: (handler: NodeEventHandler, signal?: any) => void
): Observable<T>;
export function fromEventPattern<T>(
  addHandler: (handler: NodeEventHandler) => any,
  removeHandler?: (handler: NodeEventHandler, signal?: any) => void,
  resultSelector?: (...args: any[]) => T
): Observable<T>;
/* tslint:enable:max-line-length */

/**
 * Creates an Observable from an arbitrary API for registering event handlers.
 *
 * <span class="informal">When that method for adding event handler was something {@link fromEvent}
 * was not prepared for.</span>
 *
 * ![](fromEventPattern.png)
 *
 * `fromEventPattern` allows you to convert into an Observable any API that supports registering handler functions
 * for events. It is similar to {@link fromEvent}, but far
 * more flexible. In fact, all use cases of {@link fromEvent} could be easily handled by
 * `fromEventPattern` (although in slightly more verbose way).
 *
 * This operator accepts as a first argument an `addHandler` function, which will be injected with
 * handler parameter. That handler is actually an event handler function that you now can pass
 * to API expecting it. `addHandler` will be called whenever Observable
 * returned by the operator is subscribed, so registering handler in API will not
 * necessarily happen when `fromEventPattern` is called.
 *
 * After registration, every time an event that we listen to happens,
 * Observable returned by `fromEventPattern` will emit value that event handler
 * function was called with. Note that if event handler was called with more
 * than one argument, second and following arguments will not appear in the Observable.
 *
 * If API you are using allows to unregister event handlers as well, you can pass to `fromEventPattern`
 * another function - `removeHandler` - as a second parameter. It will be injected
 * with the same handler function as before, which now you can use to unregister
 * it from the API. `removeHandler` will be called when consumer of resulting Observable
 * unsubscribes from it.
 *
 * In some APIs unregistering is actually handled differently. Method registering an event handler
 * returns some kind of token, which is later used to identify which function should
 * be unregistered or it itself has method that unregisters event handler.
 * If that is the case with your API, make sure token returned
 * by registering method is returned by `addHandler`. Then it will be passed
 * as a second argument to `removeHandler`, where you will be able to use it.
 *
 * If you need access to all event handler parameters (not only the first one),
 * or you need to transform them in any way, you can call `fromEventPattern` with optional
 * third parameter - project function which will accept all arguments passed to
 * event handler when it is called. Whatever is returned from project function will appear on
 * resulting stream instead of usual event handlers first argument. This means
 * that default project can be thought of as function that takes its first parameter
 * and ignores the rest.
 *
 * ## Examples
 *
 * Emits clicks happening on the DOM document
 *
 * ```ts
 * import { fromEventPattern } from 'rxjs';
 *
 * function addClickHandler(handler) {
 *   document.addEventListener('click', handler);
 * }
 *
 * function removeClickHandler(handler) {
 *   document.removeEventListener('click', handler);
 * }
 *
 * const clicks = fromEventPattern(
 *   addClickHandler,
 *   removeClickHandler
 * );
 * clicks.subscribe(x => console.log(x));
 *
 * // Whenever you click anywhere in the browser, DOM MouseEvent
 * // object will be logged.
 * ```
 *
 * Use with API that returns cancellation token
 *
 * ```ts
 * import { fromEventPattern } from 'rxjs';
 *
 * const token = someAPI.registerEventHandler(function() {});
 * someAPI.unregisterEventHandler(token); // this APIs cancellation method accepts
 *                                        // not handler itself, but special token.
 *
 * const someAPIObservable = fromEventPattern(
 *   function(handler) { return someAPI.registerEventHandler(handler); }, // Note that we return the token here...
 *   function(handler, token) { someAPI.unregisterEventHandler(token); }  // ...to then use it here.
 * );
 * ```
 *
 * Use with project function
 *
 * ```ts
 * import { fromEventPattern } from 'rxjs';
 *
 * someAPI.registerEventHandler((eventType, eventMessage) => {
 *   console.log(eventType, eventMessage); // Logs 'EVENT_TYPE' 'EVENT_MESSAGE' to console.
 * });
 *
 * const someAPIObservable = fromEventPattern(
 *   handler => someAPI.registerEventHandler(handler),
 *   handler => someAPI.unregisterEventHandler(handler)
 *   (eventType, eventMessage) => eventType + ' --- ' + eventMessage // without that function only 'EVENT_TYPE'
 * );                                                                // would be emitted by the Observable
 *
 * someAPIObservable.subscribe(value => console.log(value));
 *
 * // Logs:
 * // 'EVENT_TYPE --- EVENT_MESSAGE'
 * ```
 *
 * @see {@link fromEvent}
 * @see {@link bindCallback}
 * @see {@link bindNodeCallback}
 *
 * @param {function(handler: Function): any} addHandler A function that takes
 * a `handler` function as argument and attaches it somehow to the actual
 * source of events.
 * @param {function(handler: Function, token?: any): void} [removeHandler] A function that
 * takes a `handler` function as an argument and removes it from the event source. If `addHandler`
 * returns some kind of token, `removeHandler` function will have it as a second parameter.
 * @param {function(...args: any): T} [project] A function to
 * transform results. It takes the arguments from the event handler and
 * should return a single value.
 * @return {Observable<T>} Observable which, when an event happens, emits first parameter
 * passed to registered event handler. Alternatively it emits whatever project function returns
 * at that moment.
 */
export function fromEventPattern<T>(
  addHandler: (handler: NodeEventHandler) => any,
  removeHandler?: (handler: NodeEventHandler, signal?: any) => void,
  resultSelector?: (...args: any[]) => T
): Observable<T | T[]> {
  if (resultSelector) {
    return fromEventPattern<T>(addHandler, removeHandler).pipe(mapOneOrManyArgs(resultSelector));
  }

  return new Observable<T | T[]>((subscriber) => {
    const handler = (...e: T[]) => subscriber.next(e.length === 1 ? e[0] : e);
    const retValue = addHandler(handler);
    return isFunction(removeHandler) ? () => removeHandler(handler, retValue) : undefined;
  });
}
import { Observable } from '../Observable';
import { Subscriber } from '../Subscriber';
import { Subscribable } from '../types';

/**
 * Used to convert a subscribable to an observable.
 *
 * Currently, this is only used within internals.
 *
 * TODO: Discuss ObservableInput supporting "Subscribable".
 * https://github.com/ReactiveX/rxjs/issues/5909
 *
 * @param subscribable A subscribable
 */
export function fromSubscribable<T>(subscribable: Subscribable<T>) {
  return new Observable((subscriber: Subscriber<T>) => subscribable.subscribe(subscriber));
}
import { Observable } from '../Observable';
import { identity } from '../util/identity';
import { ObservableInput, SchedulerLike } from '../types';
import { isScheduler } from '../util/isScheduler';
import { defer } from './defer';
import { scheduleIterable } from '../scheduled/scheduleIterable';

type ConditionFunc<S> = (state: S) => boolean;
type IterateFunc<S> = (state: S) => S;
type ResultFunc<S, T> = (state: S) => T;

export interface GenerateBaseOptions<S> {
  /**
   * Initial state.
   */
  initialState: S;
  /**
   * Condition function that accepts state and returns boolean.
   * When it returns false, the generator stops.
   * If not specified, a generator never stops.
   */
  condition?: ConditionFunc<S>;
  /**
   * Iterate function that accepts state and returns new state.
   */
  iterate: IterateFunc<S>;
  /**
   * SchedulerLike to use for generation process.
   * By default, a generator starts immediately.
   */
  scheduler?: SchedulerLike;
}

export interface GenerateOptions<T, S> extends GenerateBaseOptions<S> {
  /**
   * Result selection function that accepts state and returns a value to emit.
   */
  resultSelector: ResultFunc<S, T>;
}

/**
 * Generates an observable sequence by running a state-driven loop
 * producing the sequence's elements, using the specified scheduler
 * to send out observer messages.
 *
 * ![](generate.png)
 *
 * ## Examples
 *
 * Produces sequence of numbers
 *
 * ```ts
 * import { generate } from 'rxjs';
 *
 * const result = generate(0, x => x < 3, x => x + 1, x => x);
 *
 * result.subscribe(x => console.log(x));
 *
 * // Logs:
 * // 0
 * // 1
 * // 2
 * ```
 *
 * Use `asapScheduler`
 *
 * ```ts
 * import { generate, asapScheduler } from 'rxjs';
 *
 * const result = generate(1, x => x < 5, x => x * 2, x => x + 1, asapScheduler);
 *
 * result.subscribe(x => console.log(x));
 *
 * // Logs:
 * // 2
 * // 3
 * // 5
 * ```
 *
 * @see {@link from}
 * @see {@link Observable}
 *
 * @param {S} initialState Initial state.
 * @param {function (state: S): boolean} condition Condition to terminate generation (upon returning false).
 * @param {function (state: S): S} iterate Iteration step function.
 * @param {function (state: S): T} resultSelector Selector function for results produced in the sequence. (deprecated)
 * @param {SchedulerLike} [scheduler] A {@link SchedulerLike} on which to run the generator loop. If not provided, defaults to emit immediately.
 * @returns {Observable<T>} The generated sequence.
 * @deprecated Instead of passing separate arguments, use the options argument. Signatures taking separate arguments will be removed in v8.
 */
export function generate<T, S>(
  initialState: S,
  condition: ConditionFunc<S>,
  iterate: IterateFunc<S>,
  resultSelector: ResultFunc<S, T>,
  scheduler?: SchedulerLike
): Observable<T>;

/**
 * Generates an Observable by running a state-driven loop
 * that emits an element on each iteration.
 *
 * <span class="informal">Use it instead of nexting values in a for loop.</span>
 *
 * ![](generate.png)
 *
 * `generate` allows you to create a stream of values generated with a loop very similar to
 * a traditional for loop. The first argument of `generate` is a beginning value. The second argument
 * is a function that accepts this value and tests if some condition still holds. If it does,
 * then the loop continues, if not, it stops. The third value is a function which takes the
 * previously defined value and modifies it in some way on each iteration. Note how these three parameters
 * are direct equivalents of three expressions in a traditional for loop: the first expression
 * initializes some state (for example, a numeric index), the second tests if the loop can perform the next
 * iteration (for example, if the index is lower than 10) and the third states how the defined value
 * will be modified on every step (for example, the index will be incremented by one).
 *
 * Return value of a `generate` operator is an Observable that on each loop iteration
 * emits a value. First of all, the condition function is ran. If it returns true, then the Observable
 * emits the currently stored value (initial value at the first iteration) and finally updates
 * that value with iterate function. If at some point the condition returns false, then the Observable
 * completes at that moment.
 *
 * Optionally you can pass a fourth parameter to `generate` - a result selector function which allows you
 * to immediately map the value that would normally be emitted by an Observable.
 *
 * If you find three anonymous functions in `generate` call hard to read, you can provide
 * a single object to the operator instead where the object has the properties: `initialState`,
 * `condition`, `iterate` and `resultSelector`, which should have respective values that you
 * would normally pass to `generate`. `resultSelector` is still optional, but that form
 * of calling `generate` allows you to omit `condition` as well. If you omit it, that means
 * condition always holds, or in other words the resulting Observable will never complete.
 *
 * Both forms of `generate` can optionally accept a scheduler. In case of a multi-parameter call,
 * scheduler simply comes as a last argument (no matter if there is a `resultSelector`
 * function or not). In case of a single-parameter call, you can provide it as a
 * `scheduler` property on the object passed to the operator. In both cases, a scheduler decides when
 * the next iteration of the loop will happen and therefore when the next value will be emitted
 * by the Observable. For example, to ensure that each value is pushed to the Observer
 * on a separate task in the event loop, you could use the `async` scheduler. Note that
 * by default (when no scheduler is passed) values are simply emitted synchronously.
 *
 *
 * ## Examples
 *
 * Use with condition and iterate functions
 *
 * ```ts
 * import { generate } from 'rxjs';
 *
 * const result = generate(0, x => x < 3, x => x + 1);
 *
 * result.subscribe({
 *   next: value => console.log(value),
 *   complete: () => console.log('Complete!')
 * });
 *
 * // Logs:
 * // 0
 * // 1
 * // 2
 * // 'Complete!'
 * ```
 *
 * Use with condition, iterate and resultSelector functions
 *
 * ```ts
 * import { generate } from 'rxjs';
 *
 * const result = generate(0, x => x < 3, x => x + 1, x => x * 1000);
 *
 * result.subscribe({
 *   next: value => console.log(value),
 *   complete: () => console.log('Complete!')
 * });
 *
 * // Logs:
 * // 0
 * // 1000
 * // 2000
 * // 'Complete!'
 * ```
 *
 * Use with options object
 *
 * ```ts
 * import { generate } from 'rxjs';
 *
 * const result = generate({
 *   initialState: 0,
 *   condition(value) { return value < 3; },
 *   iterate(value) { return value + 1; },
 *   resultSelector(value) { return value * 1000; }
 * });
 *
 * result.subscribe({
 *   next: value => console.log(value),
 *   complete: () => console.log('Complete!')
 * });
 *
 * // Logs:
 * // 0
 * // 1000
 * // 2000
 * // 'Complete!'
 * ```
 *
 * Use options object without condition function
 *
 * ```ts
 * import { generate } from 'rxjs';
 *
 * const result = generate({
 *   initialState: 0,
 *   iterate(value) { return value + 1; },
 *   resultSelector(value) { return value * 1000; }
 * });
 *
 * result.subscribe({
 *   next: value => console.log(value),
 *   complete: () => console.log('Complete!') // This will never run
 * });
 *
 * // Logs:
 * // 0
 * // 1000
 * // 2000
 * // 3000
 * // ...and never stops.
 * ```
 *
 * @see {@link from}
 *
 * @param {S} initialState Initial state.
 * @param {function (state: S): boolean} condition Condition to terminate generation (upon returning false).
 * @param {function (state: S): S} iterate Iteration step function.
 * @param {function (state: S): T} [resultSelector] Selector function for results produced in the sequence.
 * @param {Scheduler} [scheduler] A {@link Scheduler} on which to run the generator loop. If not provided, defaults to emitting immediately.
 * @return {Observable<T>} The generated sequence.
 * @deprecated Instead of passing separate arguments, use the options argument. Signatures taking separate arguments will be removed in v8.
 */
export function generate<S>(
  initialState: S,
  condition: ConditionFunc<S>,
  iterate: IterateFunc<S>,
  scheduler?: SchedulerLike
): Observable<S>;

/**
 * Generates an observable sequence by running a state-driven loop
 * producing the sequence's elements, using the specified scheduler
 * to send out observer messages.
 * The overload accepts options object that might contain initial state, iterate,
 * condition and scheduler.
 *
 * ![](generate.png)
 *
 * ## Examples
 *
 * Use options object with condition function
 *
 * ```ts
 * import { generate } from 'rxjs';
 *
 * const result = generate({
 *   initialState: 0,
 *   condition: x => x < 3,
 *   iterate: x => x + 1
 * });
 *
 * result.subscribe({
 *   next: value => console.log(value),
 *   complete: () => console.log('Complete!')
 * });
 *
 * // Logs:
 * // 0
 * // 1
 * // 2
 * // 'Complete!'
 * ```
 *
 * @see {@link from}
 * @see {@link Observable}
 *
 * @param {GenerateBaseOptions<S>} options Object that must contain initialState, iterate and might contain condition and scheduler.
 * @returns {Observable<S>} The generated sequence.
 */
export function generate<S>(options: GenerateBaseOptions<S>): Observable<S>;

/**
 * Generates an observable sequence by running a state-driven loop
 * producing the sequence's elements, using the specified scheduler
 * to send out observer messages.
 * The overload accepts options object that might contain initial state, iterate,
 * condition, result selector and scheduler.
 *
 * ![](generate.png)
 *
 * ## Examples
 *
 * Use options object with condition and iterate function
 *
 * ```ts
 * import { generate } from 'rxjs';
 *
 * const result = generate({
 *   initialState: 0,
 *   condition: x => x < 3,
 *   iterate: x => x + 1,
 *   resultSelector: x => x
 * });
 *
 * result.subscribe({
 *   next: value => console.log(value),
 *   complete: () => console.log('Complete!')
 * });
 *
 * // Logs:
 * // 0
 * // 1
 * // 2
 * // 'Complete!'
 * ```
 *
 * @see {@link from}
 * @see {@link Observable}
 *
 * @param {GenerateOptions<T, S>} options Object that must contain initialState, iterate, resultSelector and might contain condition and scheduler.
 * @returns {Observable<T>} The generated sequence.
 */
export function generate<T, S>(options: GenerateOptions<T, S>): Observable<T>;

export function generate<T, S>(
  initialStateOrOptions: S | GenerateOptions<T, S>,
  condition?: ConditionFunc<S>,
  iterate?: IterateFunc<S>,
  resultSelectorOrScheduler?: ResultFunc<S, T> | SchedulerLike,
  scheduler?: SchedulerLike
): Observable<T> {
  let resultSelector: ResultFunc<S, T>;
  let initialState: S;

  // TODO: Remove this as we move away from deprecated signatures
  // and move towards a configuration object argument.
  if (arguments.length === 1) {
    // If we only have one argument, we can assume it is a configuration object.
    // Note that folks not using TypeScript may trip over this.
    ({
      initialState,
      condition,
      iterate,
      resultSelector = identity as ResultFunc<S, T>,
      scheduler,
    } = initialStateOrOptions as GenerateOptions<T, S>);
  } else {
    // Deprecated arguments path. Figure out what the user
    // passed and set it here.
    initialState = initialStateOrOptions as S;
    if (!resultSelectorOrScheduler || isScheduler(resultSelectorOrScheduler)) {
      resultSelector = identity as ResultFunc<S, T>;
      scheduler = resultSelectorOrScheduler as SchedulerLike;
    } else {
      resultSelector = resultSelectorOrScheduler as ResultFunc<S, T>;
    }
  }

  // The actual generator used to "generate" values.
  function* gen() {
    for (let state = initialState; !condition || condition(state); state = iterate!(state)) {
      yield resultSelector(state);
    }
  }

  // We use `defer` because we want to defer the creation of the iterator from the iterable.
  return defer(
    (scheduler
      ? // If a scheduler was provided, use `scheduleIterable` to ensure that iteration/generation
        // happens on the scheduler.
        () => scheduleIterable(gen(), scheduler!)
      : // Otherwise, if there's no scheduler, we can just use the generator function directly in
        // `defer` and executing it will return the generator (which is iterable).
        gen) as () => ObservableInput<T>
  );
}
import { Observable } from '../Observable';
import { defer } from './defer';
import { ObservableInput } from '../types';

/**
 * Checks a boolean at subscription time, and chooses between one of two observable sources
 *
 * `iif` expects a function that returns a boolean (the `condition` function), and two sources,
 * the `trueResult` and the `falseResult`, and returns an Observable.
 *
 * At the moment of subscription, the `condition` function is called. If the result is `true`, the
 * subscription will be to the source passed as the `trueResult`, otherwise, the subscription will be
 * to the source passed as the `falseResult`.
 *
 * If you need to check more than two options to choose between more than one observable, have a look at the {@link defer} creation method.
 *
 * ## Examples
 *
 * Change at runtime which Observable will be subscribed
 *
 * ```ts
 * import { iif, of } from 'rxjs';
 *
 * let subscribeToFirst;
 * const firstOrSecond = iif(
 *   () => subscribeToFirst,
 *   of('first'),
 *   of('second')
 * );
 *
 * subscribeToFirst = true;
 * firstOrSecond.subscribe(value => console.log(value));
 *
 * // Logs:
 * // 'first'
 *
 * subscribeToFirst = false;
 * firstOrSecond.subscribe(value => console.log(value));
 *
 * // Logs:
 * // 'second'
 * ```
 *
 * Control access to an Observable
 *
 * ```ts
 * import { iif, of, EMPTY } from 'rxjs';
 *
 * let accessGranted;
 * const observableIfYouHaveAccess = iif(
 *   () => accessGranted,
 *   of('It seems you have an access...'),
 *   EMPTY
 * );
 *
 * accessGranted = true;
 * observableIfYouHaveAccess.subscribe({
 *   next: value => console.log(value),
 *   complete: () => console.log('The end')
 * });
 *
 * // Logs:
 * // 'It seems you have an access...'
 * // 'The end'
 *
 * accessGranted = false;
 * observableIfYouHaveAccess.subscribe({
 *   next: value => console.log(value),
 *   complete: () => console.log('The end')
 * });
 *
 * // Logs:
 * // 'The end'
 * ```
 *
 * @see {@link defer}
 *
 * @param condition Condition which Observable should be chosen.
 * @param trueResult An Observable that will be subscribed if condition is true.
 * @param falseResult An Observable that will be subscribed if condition is false.
 * @return An observable that proxies to `trueResult` or `falseResult`, depending on the result of the `condition` function.
 */
export function iif<T, F>(condition: () => boolean, trueResult: ObservableInput<T>, falseResult: ObservableInput<F>): Observable<T | F> {
  return defer(() => (condition() ? trueResult : falseResult));
}
import { isArrayLike } from '../util/isArrayLike';
import { isPromise } from '../util/isPromise';
import { Observable } from '../Observable';
import { ObservableInput, ObservedValueOf, ReadableStreamLike } from '../types';
import { isInteropObservable } from '../util/isInteropObservable';
import { isAsyncIterable } from '../util/isAsyncIterable';
import { createInvalidObservableTypeError } from '../util/throwUnobservableError';
import { isIterable } from '../util/isIterable';
import { isReadableStreamLike, readableStreamLikeToAsyncGenerator } from '../util/isReadableStreamLike';
import { Subscriber } from '../Subscriber';
import { isFunction } from '../util/isFunction';
import { reportUnhandledError } from '../util/reportUnhandledError';
import { observable as Symbol_observable } from '../symbol/observable';

export function innerFrom<O extends ObservableInput<any>>(input: O): Observable<ObservedValueOf<O>>;
export function innerFrom<T>(input: ObservableInput<T>): Observable<T> {
  if (input instanceof Observable) {
    return input;
  }
  if (input != null) {
    if (isInteropObservable(input)) {
      return fromInteropObservable(input);
    }
    if (isArrayLike(input)) {
      return fromArrayLike(input);
    }
    if (isPromise(input)) {
      return fromPromise(input);
    }
    if (isAsyncIterable(input)) {
      return fromAsyncIterable(input);
    }
    if (isIterable(input)) {
      return fromIterable(input);
    }
    if (isReadableStreamLike(input)) {
      return fromReadableStreamLike(input);
    }
  }

  throw createInvalidObservableTypeError(input);
}

/**
 * Creates an RxJS Observable from an object that implements `Symbol.observable`.
 * @param obj An object that properly implements `Symbol.observable`.
 */
export function fromInteropObservable<T>(obj: any) {
  return new Observable((subscriber: Subscriber<T>) => {
    const obs = obj[Symbol_observable]();
    if (isFunction(obs.subscribe)) {
      return obs.subscribe(subscriber);
    }
    // Should be caught by observable subscribe function error handling.
    throw new TypeError('Provided object does not correctly implement Symbol.observable');
  });
}

/**
 * Synchronously emits the values of an array like and completes.
 * This is exported because there are creation functions and operators that need to
 * make direct use of the same logic, and there's no reason to make them run through
 * `from` conditionals because we *know* they're dealing with an array.
 * @param array The array to emit values from
 */
export function fromArrayLike<T>(array: ArrayLike<T>) {
  return new Observable((subscriber: Subscriber<T>) => {
    // Loop over the array and emit each value. Note two things here:
    // 1. We're making sure that the subscriber is not closed on each loop.
    //    This is so we don't continue looping over a very large array after
    //    something like a `take`, `takeWhile`, or other synchronous unsubscription
    //    has already unsubscribed.
    // 2. In this form, reentrant code can alter that array we're looping over.
    //    This is a known issue, but considered an edge case. The alternative would
    //    be to copy the array before executing the loop, but this has
    //    performance implications.
    for (let i = 0; i < array.length && !subscriber.closed; i++) {
      subscriber.next(array[i]);
    }
    subscriber.complete();
  });
}

export function fromPromise<T>(promise: PromiseLike<T>) {
  return new Observable((subscriber: Subscriber<T>) => {
    promise
      .then(
        (value) => {
          if (!subscriber.closed) {
            subscriber.next(value);
            subscriber.complete();
          }
        },
        (err: any) => subscriber.error(err)
      )
      .then(null, reportUnhandledError);
  });
}

export function fromIterable<T>(iterable: Iterable<T>) {
  return new Observable((subscriber: Subscriber<T>) => {
    for (const value of iterable) {
      subscriber.next(value);
      if (subscriber.closed) {
        return;
      }
    }
    subscriber.complete();
  });
}

export function fromAsyncIterable<T>(asyncIterable: AsyncIterable<T>) {
  return new Observable((subscriber: Subscriber<T>) => {
    process(asyncIterable, subscriber).catch((err) => subscriber.error(err));
  });
}

export function fromReadableStreamLike<T>(readableStream: ReadableStreamLike<T>) {
  return fromAsyncIterable(readableStreamLikeToAsyncGenerator(readableStream));
}

async function process<T>(asyncIterable: AsyncIterable<T>, subscriber: Subscriber<T>) {
  for await (const value of asyncIterable) {
    subscriber.next(value);
    // A side-effect may have closed our subscriber,
    // check before the next iteration.
    if (subscriber.closed) {
      return;
    }
  }
  subscriber.complete();
}
import { Observable } from '../Observable';
import { asyncScheduler } from '../scheduler/async';
import { SchedulerLike } from '../types';
import { timer } from './timer';

/**
 * Creates an Observable that emits sequential numbers every specified
 * interval of time, on a specified {@link SchedulerLike}.
 *
 * <span class="informal">Emits incremental numbers periodically in time.</span>
 *
 * ![](interval.png)
 *
 * `interval` returns an Observable that emits an infinite sequence of
 * ascending integers, with a constant interval of time of your choosing
 * between those emissions. The first emission is not sent immediately, but
 * only after the first period has passed. By default, this operator uses the
 * `async` {@link SchedulerLike} to provide a notion of time, but you may pass any
 * {@link SchedulerLike} to it.
 *
 * ## Example
 *
 * Emits ascending numbers, one every second (1000ms) up to the number 3
 *
 * ```ts
 * import { interval, take } from 'rxjs';
 *
 * const numbers = interval(1000);
 *
 * const takeFourNumbers = numbers.pipe(take(4));
 *
 * takeFourNumbers.subscribe(x => console.log('Next: ', x));
 *
 * // Logs:
 * // Next: 0
 * // Next: 1
 * // Next: 2
 * // Next: 3
 * ```
 *
 * @see {@link timer}
 * @see {@link delay}
 *
 * @param {number} [period=0] The interval size in milliseconds (by default)
 * or the time unit determined by the scheduler's clock.
 * @param {SchedulerLike} [scheduler=async] The {@link SchedulerLike} to use for scheduling
 * the emission of values, and providing a notion of "time".
 * @return {Observable} An Observable that emits a sequential number each time
 * interval.
 */
export function interval(period = 0, scheduler: SchedulerLike = asyncScheduler): Observable<number> {
  if (period < 0) {
    // We cannot schedule an interval in the past.
    period = 0;
  }

  return timer(period, period, scheduler);
}
import { Observable } from '../Observable';
import { ObservableInput, ObservableInputTuple, SchedulerLike } from '../types';
import { mergeAll } from '../operators/mergeAll';
import { innerFrom } from './innerFrom';
import { EMPTY } from './empty';
import { popNumber, popScheduler } from '../util/args';
import { from } from './from';

export function merge<A extends readonly unknown[]>(...sources: [...ObservableInputTuple<A>]): Observable<A[number]>;
export function merge<A extends readonly unknown[]>(...sourcesAndConcurrency: [...ObservableInputTuple<A>, number?]): Observable<A[number]>;
/** @deprecated The `scheduler` parameter will be removed in v8. Use `scheduled` and `mergeAll`. Details: https://rxjs.dev/deprecations/scheduler-argument */
export function merge<A extends readonly unknown[]>(
  ...sourcesAndScheduler: [...ObservableInputTuple<A>, SchedulerLike?]
): Observable<A[number]>;
/** @deprecated The `scheduler` parameter will be removed in v8. Use `scheduled` and `mergeAll`. Details: https://rxjs.dev/deprecations/scheduler-argument */
export function merge<A extends readonly unknown[]>(
  ...sourcesAndConcurrencyAndScheduler: [...ObservableInputTuple<A>, number?, SchedulerLike?]
): Observable<A[number]>;

/**
 * Creates an output Observable which concurrently emits all values from every
 * given input Observable.
 *
 * <span class="informal">Flattens multiple Observables together by blending
 * their values into one Observable.</span>
 *
 * ![](merge.png)
 *
 * `merge` subscribes to each given input Observable (as arguments), and simply
 * forwards (without doing any transformation) all the values from all the input
 * Observables to the output Observable. The output Observable only completes
 * once all input Observables have completed. Any error delivered by an input
 * Observable will be immediately emitted on the output Observable.
 *
 * ## Examples
 *
 * Merge together two Observables: 1s interval and clicks
 *
 * ```ts
 * import { merge, fromEvent, interval } from 'rxjs';
 *
 * const clicks = fromEvent(document, 'click');
 * const timer = interval(1000);
 * const clicksOrTimer = merge(clicks, timer);
 * clicksOrTimer.subscribe(x => console.log(x));
 *
 * // Results in the following:
 * // timer will emit ascending values, one every second(1000ms) to console
 * // clicks logs MouseEvents to console everytime the "document" is clicked
 * // Since the two streams are merged you see these happening
 * // as they occur.
 * ```
 *
 * Merge together 3 Observables, but run only 2 concurrently
 *
 * ```ts
 * import { interval, take, merge } from 'rxjs';
 *
 * const timer1 = interval(1000).pipe(take(10));
 * const timer2 = interval(2000).pipe(take(6));
 * const timer3 = interval(500).pipe(take(10));
 *
 * const concurrent = 2; // the argument
 * const merged = merge(timer1, timer2, timer3, concurrent);
 * merged.subscribe(x => console.log(x));
 *
 * // Results in the following:
 * // - First timer1 and timer2 will run concurrently
 * // - timer1 will emit a value every 1000ms for 10 iterations
 * // - timer2 will emit a value every 2000ms for 6 iterations
 * // - after timer1 hits its max iteration, timer2 will
 * //   continue, and timer3 will start to run concurrently with timer2
 * // - when timer2 hits its max iteration it terminates, and
 * //   timer3 will continue to emit a value every 500ms until it is complete
 * ```
 *
 * @see {@link mergeAll}
 * @see {@link mergeMap}
 * @see {@link mergeMapTo}
 * @see {@link mergeScan}
 *
 * @param {...ObservableInput} observables Input Observables to merge together.
 * @param {number} [concurrent=Infinity] Maximum number of input
 * Observables being subscribed to concurrently.
 * @param {SchedulerLike} [scheduler=null] The {@link SchedulerLike} to use for managing
 * concurrency of input Observables.
 * @return {Observable} an Observable that emits items that are the result of
 * every input Observable.
 */
export function merge(...args: (ObservableInput<unknown> | number | SchedulerLike)[]): Observable<unknown> {
  const scheduler = popScheduler(args);
  const concurrent = popNumber(args, Infinity);
  const sources = args as ObservableInput<unknown>[];
  return !sources.length
    ? // No source provided
      EMPTY
    : sources.length === 1
    ? // One source? Just return it.
      innerFrom(sources[0])
    : // Merge all sources
      mergeAll(concurrent)(from(sources, scheduler));
}
import { Observable } from '../Observable';
import { noop } from '../util/noop';

/**
 * An Observable that emits no items to the Observer and never completes.
 *
 * ![](never.png)
 *
 * A simple Observable that emits neither values nor errors nor the completion
 * notification. It can be used for testing purposes or for composing with other
 * Observables. Please note that by never emitting a complete notification, this
 * Observable keeps the subscription from being disposed automatically.
 * Subscriptions need to be manually disposed.
 *
 * ##  Example
 *
 * Emit the number 7, then never emit anything else (not even complete)
 *
 * ```ts
 * import { NEVER, startWith } from 'rxjs';
 *
 * const info = () => console.log('Will not be called');
 *
 * const result = NEVER.pipe(startWith(7));
 * result.subscribe({
 *   next: x => console.log(x),
 *   error: info,
 *   complete: info
 * });
 * ```
 *
 * @see {@link Observable}
 * @see {@link EMPTY}
 * @see {@link of}
 * @see {@link throwError}
 */
export const NEVER = new Observable<never>(noop);

/**
 * @deprecated Replaced with the {@link NEVER} constant. Will be removed in v8.
 */
export function never() {
  return NEVER;
}
import { SchedulerLike, ValueFromArray } from '../types';
import { Observable } from '../Observable';
import { popScheduler } from '../util/args';
import { from } from './from';

// Devs are more likely to pass null or undefined than they are a scheduler
// without accompanying values. To make things easier for (naughty) devs who
// use the `strictNullChecks: false` TypeScript compiler option, these
// overloads with explicit null and undefined values are included.

export function of(value: null): Observable<null>;
export function of(value: undefined): Observable<undefined>;

/** @deprecated The `scheduler` parameter will be removed in v8. Use `scheduled`. Details: https://rxjs.dev/deprecations/scheduler-argument */
export function of(scheduler: SchedulerLike): Observable<never>;
/** @deprecated The `scheduler` parameter will be removed in v8. Use `scheduled`. Details: https://rxjs.dev/deprecations/scheduler-argument */
export function of<A extends readonly unknown[]>(...valuesAndScheduler: [...A, SchedulerLike]): Observable<ValueFromArray<A>>;

export function of(): Observable<never>;
/** @deprecated Do not specify explicit type parameters. Signatures with type parameters that cannot be inferred will be removed in v8. */
export function of<T>(): Observable<T>;
export function of<T>(value: T): Observable<T>;
export function of<A extends readonly unknown[]>(...values: A): Observable<ValueFromArray<A>>;

/**
 * Converts the arguments to an observable sequence.
 *
 * <span class="informal">Each argument becomes a `next` notification.</span>
 *
 * ![](of.png)
 *
 * Unlike {@link from}, it does not do any flattening and emits each argument in whole
 * as a separate `next` notification.
 *
 * ## Examples
 *
 * Emit the values `10, 20, 30`
 *
 * ```ts
 * import { of } from 'rxjs';
 *
 * of(10, 20, 30)
 *   .subscribe({
 *     next: value => console.log('next:', value),
 *     error: err => console.log('error:', err),
 *     complete: () => console.log('the end'),
 *   });
 *
 * // Outputs
 * // next: 10
 * // next: 20
 * // next: 30
 * // the end
 * ```
 *
 * Emit the array `[1, 2, 3]`
 *
 * ```ts
 * import { of } from 'rxjs';
 *
 * of([1, 2, 3])
 *   .subscribe({
 *     next: value => console.log('next:', value),
 *     error: err => console.log('error:', err),
 *     complete: () => console.log('the end'),
 *   });
 *
 * // Outputs
 * // next: [1, 2, 3]
 * // the end
 * ```
 *
 * @see {@link from}
 * @see {@link range}
 *
 * @param {...T} values A comma separated list of arguments you want to be emitted
 * @return {Observable} An Observable that emits the arguments
 * described above and then completes.
 */
export function of<T>(...args: Array<T | SchedulerLike>): Observable<T> {
  const scheduler = popScheduler(args);
  return from(args as T[], scheduler);
}
import { Observable } from '../Observable';
import { ObservableInputTuple } from '../types';
import { EMPTY } from './empty';
import { onErrorResumeNext as onErrorResumeNextWith } from '../operators/onErrorResumeNext';
import { argsOrArgArray } from '../util/argsOrArgArray';

/* tslint:disable:max-line-length */
export function onErrorResumeNext<A extends readonly unknown[]>(sources: [...ObservableInputTuple<A>]): Observable<A[number]>;
export function onErrorResumeNext<A extends readonly unknown[]>(...sources: [...ObservableInputTuple<A>]): Observable<A[number]>;

/* tslint:enable:max-line-length */

/**
 * When any of the provided Observable emits a complete or an error notification, it immediately subscribes to the next one
 * that was passed.
 *
 * <span class="informal">Execute series of Observables no matter what, even if it means swallowing errors.</span>
 *
 * ![](onErrorResumeNext.png)
 *
 * `onErrorResumeNext` will subscribe to each observable source it is provided, in order.
 * If the source it's subscribed to emits an error or completes, it will move to the next source
 * without error.
 *
 * If `onErrorResumeNext` is provided no arguments, or a single, empty array, it will return {@link EMPTY}.
 *
 * `onErrorResumeNext` is basically {@link concat}, only it will continue, even if one of its
 * sources emits an error.
 *
 * Note that there is no way to handle any errors thrown by sources via the result of
 * `onErrorResumeNext`. If you want to handle errors thrown in any given source, you can
 * always use the {@link catchError} operator on them before passing them into `onErrorResumeNext`.
 *
 * ## Example
 *
 * Subscribe to the next Observable after map fails
 *
 * ```ts
 * import { onErrorResumeNext, of, map } from 'rxjs';
 *
 * onErrorResumeNext(
 *   of(1, 2, 3, 0).pipe(
 *     map(x => {
 *       if (x === 0) {
 *         throw Error();
 *       }
 *       return 10 / x;
 *     })
 *   ),
 *   of(1, 2, 3)
 * )
 * .subscribe({
 *   next: value => console.log(value),
 *   error: err => console.log(err),     // Will never be called.
 *   complete: () => console.log('done')
 * });
 *
 * // Logs:
 * // 10
 * // 5
 * // 3.3333333333333335
 * // 1
 * // 2
 * // 3
 * // 'done'
 * ```
 *
 * @see {@link concat}
 * @see {@link catchError}
 *
 * @param {...ObservableInput} sources Observables (or anything that *is* observable) passed either directly or as an array.
 * @return {Observable} An Observable that concatenates all sources, one after the other,
 * ignoring all errors, such that any error causes it to move on to the next source.
 */
export function onErrorResumeNext<A extends readonly unknown[]>(
  ...sources: [[...ObservableInputTuple<A>]] | [...ObservableInputTuple<A>]
): Observable<A[number]> {
  return onErrorResumeNextWith(argsOrArgArray(sources))(EMPTY);
}
import { Observable } from '../Observable';
import { SchedulerLike } from '../types';
import { from } from './from';

/**
 * @deprecated Use `from(Object.entries(obj))` instead. Will be removed in v8.
 */
export function pairs<T>(arr: readonly T[], scheduler?: SchedulerLike): Observable<[string, T]>;
/**
 * @deprecated Use `from(Object.entries(obj))` instead. Will be removed in v8.
 */
export function pairs<O extends Record<string, unknown>>(obj: O, scheduler?: SchedulerLike): Observable<[keyof O, O[keyof O]]>;
/**
 * @deprecated Use `from(Object.entries(obj))` instead. Will be removed in v8.
 */
export function pairs<T>(iterable: Iterable<T>, scheduler?: SchedulerLike): Observable<[string, T]>;
/**
 * @deprecated Use `from(Object.entries(obj))` instead. Will be removed in v8.
 */
export function pairs(
  n: number | bigint | boolean | ((...args: any[]) => any) | symbol,
  scheduler?: SchedulerLike
): Observable<[never, never]>;

/**
 * Convert an object into an Observable of `[key, value]` pairs.
 *
 * <span class="informal">Turn entries of an object into a stream.</span>
 *
 * ![](pairs.png)
 *
 * `pairs` takes an arbitrary object and returns an Observable that emits arrays. Each
 * emitted array has exactly two elements - the first is a key from the object
 * and the second is a value corresponding to that key. Keys are extracted from
 * an object via `Object.keys` function, which means that they will be only
 * enumerable keys that are present on an object directly - not ones inherited
 * via prototype chain.
 *
 * By default, these arrays are emitted synchronously. To change that you can
 * pass a {@link SchedulerLike} as a second argument to `pairs`.
 *
 * ## Example
 *
 * Converts an object to an Observable
 *
 * ```ts
 * import { pairs } from 'rxjs';
 *
 * const obj = {
 *   foo: 42,
 *   bar: 56,
 *   baz: 78
 * };
 *
 * pairs(obj).subscribe({
 *   next: value => console.log(value),
 *   complete: () => console.log('Complete!')
 * });
 *
 * // Logs:
 * // ['foo', 42]
 * // ['bar', 56]
 * // ['baz', 78]
 * // 'Complete!'
 * ```
 *
 * ### Object.entries required
 *
 * In IE, you will need to polyfill `Object.entries` in order to use this.
 * [MDN has a polyfill here](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/entries)
 *
 * @param {Object} obj The object to inspect and turn into an
 * Observable sequence.
 * @param {Scheduler} [scheduler] An optional IScheduler to schedule
 * when resulting Observable will emit values.
 * @returns {(Observable<Array<string|T>>)} An observable sequence of
 * [key, value] pairs from the object.
 * @deprecated Use `from(Object.entries(obj))` instead. Will be removed in v8.
 */
export function pairs(obj: any, scheduler?: SchedulerLike) {
  return from(Object.entries(obj), scheduler as any);
}
import { not } from '../util/not';
import { filter } from '../operators/filter';
import { ObservableInput } from '../types';
import { Observable } from '../Observable';
import { innerFrom } from './innerFrom';

/** @deprecated Use a closure instead of a `thisArg`. Signatures accepting a `thisArg` will be removed in v8. */
export function partition<T, U extends T, A>(
  source: ObservableInput<T>,
  predicate: (this: A, value: T, index: number) => value is U,
  thisArg: A
): [Observable<U>, Observable<Exclude<T, U>>];
export function partition<T, U extends T>(
  source: ObservableInput<T>,
  predicate: (value: T, index: number) => value is U
): [Observable<U>, Observable<Exclude<T, U>>];

/** @deprecated Use a closure instead of a `thisArg`. Signatures accepting a `thisArg` will be removed in v8. */
export function partition<T, A>(
  source: ObservableInput<T>,
  predicate: (this: A, value: T, index: number) => boolean,
  thisArg: A
): [Observable<T>, Observable<T>];
export function partition<T>(source: ObservableInput<T>, predicate: (value: T, index: number) => boolean): [Observable<T>, Observable<T>];

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
 * Partition a set of numbers into odds and evens observables
 *
 * ```ts
 * import { of, partition } from 'rxjs';
 *
 * const observableValues = of(1, 2, 3, 4, 5, 6);
 * const [evens$, odds$] = partition(observableValues, value => value % 2 === 0);
 *
 * odds$.subscribe(x => console.log('odds', x));
 * evens$.subscribe(x => console.log('evens', x));
 *
 * // Logs:
 * // odds 1
 * // odds 3
 * // odds 5
 * // evens 2
 * // evens 4
 * // evens 6
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
 * @return {[Observable<T>, Observable<T>]} An array with two Observables: one
 * with values that passed the predicate, and another with values that did not
 * pass the predicate.
 */
export function partition<T>(
  source: ObservableInput<T>,
  predicate: (this: any, value: T, index: number) => boolean,
  thisArg?: any
): [Observable<T>, Observable<T>] {
  return [filter(predicate, thisArg)(innerFrom(source)), filter(not(predicate, thisArg))(innerFrom(source))] as [
    Observable<T>,
    Observable<T>
  ];
}
import { Observable } from '../Observable';
import { innerFrom } from './innerFrom';
import { Subscription } from '../Subscription';
import { ObservableInput, ObservableInputTuple } from '../types';
import { argsOrArgArray } from '../util/argsOrArgArray';
import { createOperatorSubscriber } from '../operators/OperatorSubscriber';
import { Subscriber } from '../Subscriber';

export function race<T extends readonly unknown[]>(inputs: [...ObservableInputTuple<T>]): Observable<T[number]>;
export function race<T extends readonly unknown[]>(...inputs: [...ObservableInputTuple<T>]): Observable<T[number]>;

/**
 * Returns an observable that mirrors the first source observable to emit an item.
 *
 * ![](race.png)
 *
 * `race` returns an observable, that when subscribed to, subscribes to all source observables immediately.
 * As soon as one of the source observables emits a value, the result unsubscribes from the other sources.
 * The resulting observable will forward all notifications, including error and completion, from the "winning"
 * source observable.
 *
 * If one of the used source observable throws an errors before a first notification
 * the race operator will also throw an error, no matter if another source observable
 * could potentially win the race.
 *
 * `race` can be useful for selecting the response from the fastest network connection for
 * HTTP or WebSockets. `race` can also be useful for switching observable context based on user
 * input.
 *
 * ## Example
 *
 * Subscribes to the observable that was the first to start emitting.
 *
 * ```ts
 * import { interval, map, race } from 'rxjs';
 *
 * const obs1 = interval(7000).pipe(map(() => 'slow one'));
 * const obs2 = interval(3000).pipe(map(() => 'fast one'));
 * const obs3 = interval(5000).pipe(map(() => 'medium one'));
 *
 * race(obs1, obs2, obs3)
 *   .subscribe(winner => console.log(winner));
 *
 * // Outputs
 * // a series of 'fast one'
 * ```
 *
 * @param {...Observables} ...observables sources used to race for which Observable emits first.
 * @return {Observable} an Observable that mirrors the output of the first Observable to emit an item.
 */
export function race<T>(...sources: (ObservableInput<T> | ObservableInput<T>[])[]): Observable<any> {
  sources = argsOrArgArray(sources);
  // If only one source was passed, just return it. Otherwise return the race.
  return sources.length === 1 ? innerFrom(sources[0] as ObservableInput<T>) : new Observable<T>(raceInit(sources as ObservableInput<T>[]));
}

/**
 * An observable initializer function for both the static version and the
 * operator version of race.
 * @param sources The sources to race
 */
export function raceInit<T>(sources: ObservableInput<T>[]) {
  return (subscriber: Subscriber<T>) => {
    let subscriptions: Subscription[] = [];

    // Subscribe to all of the sources. Note that we are checking `subscriptions` here
    // Is is an array of all actively "racing" subscriptions, and it is `null` after the
    // race has been won. So, if we have racer that synchronously "wins", this loop will
    // stop before it subscribes to any more.
    for (let i = 0; subscriptions && !subscriber.closed && i < sources.length; i++) {
      subscriptions.push(
        innerFrom(sources[i] as ObservableInput<T>).subscribe(
          createOperatorSubscriber(subscriber, (value) => {
            if (subscriptions) {
              // We're still racing, but we won! So unsubscribe
              // all other subscriptions that we have, except this one.
              for (let s = 0; s < subscriptions.length; s++) {
                s !== i && subscriptions[s].unsubscribe();
              }
              subscriptions = null!;
            }
            subscriber.next(value);
          })
        )
      );
    }
  };
}
import { SchedulerLike } from '../types';
import { Observable } from '../Observable';
import { EMPTY } from './empty';

export function range(start: number, count?: number): Observable<number>;

/**
 * @deprecated The `scheduler` parameter will be removed in v8. Use `range(start, count).pipe(observeOn(scheduler))` instead. Details: Details: https://rxjs.dev/deprecations/scheduler-argument
 */
export function range(start: number, count: number | undefined, scheduler: SchedulerLike): Observable<number>;

/**
 * Creates an Observable that emits a sequence of numbers within a specified
 * range.
 *
 * <span class="informal">Emits a sequence of numbers in a range.</span>
 *
 * ![](range.png)
 *
 * `range` operator emits a range of sequential integers, in order, where you
 * select the `start` of the range and its `length`. By default, uses no
 * {@link SchedulerLike} and just delivers the notifications synchronously, but may use
 * an optional {@link SchedulerLike} to regulate those deliveries.
 *
 * ## Example
 *
 * Produce a range of numbers
 *
 * ```ts
 * import { range } from 'rxjs';
 *
 * const numbers = range(1, 3);
 *
 * numbers.subscribe({
 *   next: value => console.log(value),
 *   complete: () => console.log('Complete!')
 * });
 *
 * // Logs:
 * // 1
 * // 2
 * // 3
 * // 'Complete!'
 * ```
 *
 * @see {@link timer}
 * @see {@link interval}
 *
 * @param {number} [start=0] The value of the first integer in the sequence.
 * @param {number} count The number of sequential integers to generate.
 * @param {SchedulerLike} [scheduler] A {@link SchedulerLike} to use for scheduling
 * the emissions of the notifications.
 * @return {Observable} An Observable of numbers that emits a finite range of
 * sequential integers.
 */
export function range(start: number, count?: number, scheduler?: SchedulerLike): Observable<number> {
  if (count == null) {
    // If one argument was passed, it's the count, not the start.
    count = start;
    start = 0;
  }

  if (count <= 0) {
    // No count? We're going nowhere. Return EMPTY.
    return EMPTY;
  }

  // Where the range should stop.
  const end = count + start;

  return new Observable(
    scheduler
      ? // The deprecated scheduled path.
        (subscriber) => {
          let n = start;
          return scheduler.schedule(function () {
            if (n < end) {
              subscriber.next(n++);
              this.schedule();
            } else {
              subscriber.complete();
            }
          });
        }
      : // Standard synchronous range.
        (subscriber) => {
          let n = start;
          while (n < end && !subscriber.closed) {
            subscriber.next(n++);
          }
          subscriber.complete();
        }
  );
}
import { Observable } from '../Observable';
import { Subscriber } from '../Subscriber';
import { SchedulerLike } from '../types';
import { isFunction } from '../util/isFunction';

/**
 * Creates an observable that will create an error instance and push it to the consumer as an error
 * immediately upon subscription.
 *
 * <span class="informal">Just errors and does nothing else</span>
 *
 * ![](throw.png)
 *
 * This creation function is useful for creating an observable that will create an error and error every
 * time it is subscribed to. Generally, inside of most operators when you might want to return an errored
 * observable, this is unnecessary. In most cases, such as in the inner return of {@link concatMap},
 * {@link mergeMap}, {@link defer}, and many others, you can simply throw the error, and RxJS will pick
 * that up and notify the consumer of the error.
 *
 * ## Example
 *
 * Create a simple observable that will create a new error with a timestamp and log it
 * and the message every time you subscribe to it
 *
 * ```ts
 * import { throwError } from 'rxjs';
 *
 * let errorCount = 0;
 *
 * const errorWithTimestamp$ = throwError(() => {
 *   const error: any = new Error(`This is error number ${ ++errorCount }`);
 *   error.timestamp = Date.now();
 *   return error;
 * });
 *
 * errorWithTimestamp$.subscribe({
 *   error: err => console.log(err.timestamp, err.message)
 * });
 *
 * errorWithTimestamp$.subscribe({
 *   error: err => console.log(err.timestamp, err.message)
 * });
 *
 * // Logs the timestamp and a new error message for each subscription
 * ```
 *
 * ### Unnecessary usage
 *
 * Using `throwError` inside of an operator or creation function
 * with a callback, is usually not necessary
 *
 * ```ts
 * import { of, concatMap, timer, throwError } from 'rxjs';
 *
 * const delays$ = of(1000, 2000, Infinity, 3000);
 *
 * delays$.pipe(
 *   concatMap(ms => {
 *     if (ms < 10000) {
 *       return timer(ms);
 *     } else {
 *       // This is probably overkill.
 *       return throwError(() => new Error(`Invalid time ${ ms }`));
 *     }
 *   })
 * )
 * .subscribe({
 *   next: console.log,
 *   error: console.error
 * });
 * ```
 *
 * You can just throw the error instead
 *
 * ```ts
 * import { of, concatMap, timer } from 'rxjs';
 *
 * const delays$ = of(1000, 2000, Infinity, 3000);
 *
 * delays$.pipe(
 *   concatMap(ms => {
 *     if (ms < 10000) {
 *       return timer(ms);
 *     } else {
 *       // Cleaner and easier to read for most folks.
 *       throw new Error(`Invalid time ${ ms }`);
 *     }
 *   })
 * )
 * .subscribe({
 *   next: console.log,
 *   error: console.error
 * });
 * ```
 *
 * @param errorFactory A factory function that will create the error instance that is pushed.
 */
export function throwError(errorFactory: () => any): Observable<never>;

/**
 * Returns an observable that will error with the specified error immediately upon subscription.
 *
 * @param error The error instance to emit
 * @deprecated Support for passing an error value will be removed in v8. Instead, pass a factory function to `throwError(() => new Error('test'))`. This is
 * because it will create the error at the moment it should be created and capture a more appropriate stack trace. If
 * for some reason you need to create the error ahead of time, you can still do that: `const err = new Error('test'); throwError(() => err);`.
 */
export function throwError(error: any): Observable<never>;

/**
 * Notifies the consumer of an error using a given scheduler by scheduling it at delay `0` upon subscription.
 *
 * @param errorOrErrorFactory An error instance or error factory
 * @param scheduler A scheduler to use to schedule the error notification
 * @deprecated The `scheduler` parameter will be removed in v8.
 * Use `throwError` in combination with {@link observeOn}: `throwError(() => new Error('test')).pipe(observeOn(scheduler));`.
 * Details: https://rxjs.dev/deprecations/scheduler-argument
 */
export function throwError(errorOrErrorFactory: any, scheduler: SchedulerLike): Observable<never>;

export function throwError(errorOrErrorFactory: any, scheduler?: SchedulerLike): Observable<never> {
  const errorFactory = isFunction(errorOrErrorFactory) ? errorOrErrorFactory : () => errorOrErrorFactory;
  const init = (subscriber: Subscriber<never>) => subscriber.error(errorFactory());
  return new Observable(scheduler ? (subscriber) => scheduler.schedule(init as any, 0, subscriber) : init);
}
import { Observable } from '../Observable';
import { SchedulerLike } from '../types';
import { async as asyncScheduler } from '../scheduler/async';
import { isScheduler } from '../util/isScheduler';
import { isValidDate } from '../util/isDate';

/**
 * Creates an observable that will wait for a specified time period, or exact date, before
 * emitting the number 0.
 *
 * <span class="informal">Used to emit a notification after a delay.</span>
 *
 * This observable is useful for creating delays in code, or racing against other values
 * for ad-hoc timeouts.
 *
 * The `delay` is specified by default in milliseconds, however providing a custom scheduler could
 * create a different behavior.
 *
 * ## Examples
 *
 * Wait 3 seconds and start another observable
 *
 * You might want to use `timer` to delay subscription to an
 * observable by a set amount of time. Here we use a timer with
 * {@link concatMapTo} or {@link concatMap} in order to wait
 * a few seconds and start a subscription to a source.
 *
 * ```ts
 * import { of, timer, concatMap } from 'rxjs';
 *
 * // This could be any observable
 * const source = of(1, 2, 3);
 *
 * timer(3000)
 *   .pipe(concatMap(() => source))
 *   .subscribe(console.log);
 * ```
 *
 * Take all values until the start of the next minute
 *
 * Using a `Date` as the trigger for the first emission, you can
 * do things like wait until midnight to fire an event, or in this case,
 * wait until a new minute starts (chosen so the example wouldn't take
 * too long to run) in order to stop watching a stream. Leveraging
 * {@link takeUntil}.
 *
 * ```ts
 * import { interval, takeUntil, timer } from 'rxjs';
 *
 * // Build a Date object that marks the
 * // next minute.
 * const currentDate = new Date();
 * const startOfNextMinute = new Date(
 *   currentDate.getFullYear(),
 *   currentDate.getMonth(),
 *   currentDate.getDate(),
 *   currentDate.getHours(),
 *   currentDate.getMinutes() + 1
 * );
 *
 * // This could be any observable stream
 * const source = interval(1000);
 *
 * const result = source.pipe(
 *   takeUntil(timer(startOfNextMinute))
 * );
 *
 * result.subscribe(console.log);
 * ```
 *
 * ### Known Limitations
 *
 * - The {@link asyncScheduler} uses `setTimeout` which has limitations for how far in the future it can be scheduled.
 *
 * - If a `scheduler` is provided that returns a timestamp other than an epoch from `now()`, and
 * a `Date` object is passed to the `dueTime` argument, the calculation for when the first emission
 * should occur will be incorrect. In this case, it would be best to do your own calculations
 * ahead of time, and pass a `number` in as the `dueTime`.
 *
 * @param due If a `number`, the amount of time in milliseconds to wait before emitting.
 * If a `Date`, the exact time at which to emit.
 * @param scheduler The scheduler to use to schedule the delay. Defaults to {@link asyncScheduler}.
 */
export function timer(due: number | Date, scheduler?: SchedulerLike): Observable<0>;

/**
 * Creates an observable that starts an interval after a specified delay, emitting incrementing numbers -- starting at `0` --
 * on each interval after words.
 *
 * The `delay` and `intervalDuration` are specified by default in milliseconds, however providing a custom scheduler could
 * create a different behavior.
 *
 * ## Example
 *
 * ### Start an interval that starts right away
 *
 * Since {@link interval} waits for the passed delay before starting,
 * sometimes that's not ideal. You may want to start an interval immediately.
 * `timer` works well for this. Here we have both side-by-side so you can
 * see them in comparison.
 *
 * Note that this observable will never complete.
 *
 * ```ts
 * import { timer, interval } from 'rxjs';
 *
 * timer(0, 1000).subscribe(n => console.log('timer', n));
 * interval(1000).subscribe(n => console.log('interval', n));
 * ```
 *
 * ### Known Limitations
 *
 * - The {@link asyncScheduler} uses `setTimeout` which has limitations for how far in the future it can be scheduled.
 *
 * - If a `scheduler` is provided that returns a timestamp other than an epoch from `now()`, and
 * a `Date` object is passed to the `dueTime` argument, the calculation for when the first emission
 * should occur will be incorrect. In this case, it would be best to do your own calculations
 * ahead of time, and pass a `number` in as the `startDue`.
 * @param startDue If a `number`, is the time to wait before starting the interval.
 * If a `Date`, is the exact time at which to start the interval.
 * @param intervalDuration The delay between each value emitted in the interval. Passing a
 * negative number here will result in immediate completion after the first value is emitted, as though
 * no `intervalDuration` was passed at all.
 * @param scheduler The scheduler to use to schedule the delay. Defaults to {@link asyncScheduler}.
 */
export function timer(startDue: number | Date, intervalDuration: number, scheduler?: SchedulerLike): Observable<number>;

/**
 * @deprecated The signature allowing `undefined` to be passed for `intervalDuration` will be removed in v8. Use the `timer(dueTime, scheduler?)` signature instead.
 */
export function timer(dueTime: number | Date, unused: undefined, scheduler?: SchedulerLike): Observable<0>;

export function timer(
  dueTime: number | Date = 0,
  intervalOrScheduler?: number | SchedulerLike,
  scheduler: SchedulerLike = asyncScheduler
): Observable<number> {
  // Since negative intervalDuration is treated as though no
  // interval was specified at all, we start with a negative number.
  let intervalDuration = -1;

  if (intervalOrScheduler != null) {
    // If we have a second argument, and it's a scheduler,
    // override the scheduler we had defaulted. Otherwise,
    // it must be an interval.
    if (isScheduler(intervalOrScheduler)) {
      scheduler = intervalOrScheduler;
    } else {
      // Note that this *could* be negative, in which case
      // it's like not passing an intervalDuration at all.
      intervalDuration = intervalOrScheduler;
    }
  }

  return new Observable((subscriber) => {
    // If a valid date is passed, calculate how long to wait before
    // executing the first value... otherwise, if it's a number just schedule
    // that many milliseconds (or scheduler-specified unit size) in the future.
    let due = isValidDate(dueTime) ? +dueTime - scheduler!.now() : dueTime;

    if (due < 0) {
      // Ensure we don't schedule in the future.
      due = 0;
    }

    // The incrementing value we emit.
    let n = 0;

    // Start the timer.
    return scheduler.schedule(function () {
      if (!subscriber.closed) {
        // Emit the next value and increment.
        subscriber.next(n++);

        if (0 <= intervalDuration) {
          // If we have a interval after the initial timer,
          // reschedule with the period.
          this.schedule(undefined, intervalDuration);
        } else {
          // We didn't have an interval. So just complete.
          subscriber.complete();
        }
      }
    }, due);
  });
}
import { Observable } from '../Observable';
import { Unsubscribable, ObservableInput, ObservedValueOf } from '../types';
import { innerFrom } from './innerFrom';
import { EMPTY } from './empty';

/**
 * Creates an Observable that uses a resource which will be disposed at the same time as the Observable.
 *
 * <span class="informal">Use it when you catch yourself cleaning up after an Observable.</span>
 *
 * `using` is a factory operator, which accepts two functions. First function returns a disposable resource.
 * It can be an arbitrary object that implements `unsubscribe` method. Second function will be injected with
 * that object and should return an Observable. That Observable can use resource object during its execution.
 * Both functions passed to `using` will be called every time someone subscribes - neither an Observable nor
 * resource object will be shared in any way between subscriptions.
 *
 * When Observable returned by `using` is subscribed, Observable returned from the second function will be subscribed
 * as well. All its notifications (nexted values, completion and error events) will be emitted unchanged by the output
 * Observable. If however someone unsubscribes from the Observable or source Observable completes or errors by itself,
 * the `unsubscribe` method on resource object will be called. This can be used to do any necessary clean up, which
 * otherwise would have to be handled by hand. Note that complete or error notifications are not emitted when someone
 * cancels subscription to an Observable via `unsubscribe`, so `using` can be used as a hook, allowing you to make
 * sure that all resources which need to exist during an Observable execution will be disposed at appropriate time.
 *
 * @see {@link defer}
 *
 * @param {function(): ISubscription} resourceFactory A function which creates any resource object
 * that implements `unsubscribe` method.
 * @param {function(resource: ISubscription): Observable<T>} observableFactory A function which
 * creates an Observable, that can use injected resource object.
 * @return {Observable<T>} An Observable that behaves the same as Observable returned by `observableFactory`, but
 * which - when completed, errored or unsubscribed - will also call `unsubscribe` on created resource object.
 */
export function using<T extends ObservableInput<any>>(
  resourceFactory: () => Unsubscribable | void,
  observableFactory: (resource: Unsubscribable | void) => T | void
): Observable<ObservedValueOf<T>> {
  return new Observable<ObservedValueOf<T>>((subscriber) => {
    const resource = resourceFactory();
    const result = observableFactory(resource);
    const source = result ? innerFrom(result) : EMPTY;
    source.subscribe(subscriber);
    return () => {
      // NOTE: Optional chaining did not work here.
      // Related TS Issue: https://github.com/microsoft/TypeScript/issues/40818
      if (resource) {
        resource.unsubscribe();
      }
    };
  });
}
import { Observable } from '../Observable';
import { ObservableInputTuple } from '../types';
import { innerFrom } from './innerFrom';
import { argsOrArgArray } from '../util/argsOrArgArray';
import { EMPTY } from './empty';
import { createOperatorSubscriber } from '../operators/OperatorSubscriber';
import { popResultSelector } from '../util/args';

export function zip<A extends readonly unknown[]>(sources: [...ObservableInputTuple<A>]): Observable<A>;
export function zip<A extends readonly unknown[], R>(
  sources: [...ObservableInputTuple<A>],
  resultSelector: (...values: A) => R
): Observable<R>;
export function zip<A extends readonly unknown[]>(...sources: [...ObservableInputTuple<A>]): Observable<A>;
export function zip<A extends readonly unknown[], R>(
  ...sourcesAndResultSelector: [...ObservableInputTuple<A>, (...values: A) => R]
): Observable<R>;

/**
 * Combines multiple Observables to create an Observable whose values are calculated from the values, in order, of each
 * of its input Observables.
 *
 * If the last parameter is a function, this function is used to compute the created value from the input values.
 * Otherwise, an array of the input values is returned.
 *
 * ## Example
 *
 * Combine age and name from different sources
 *
 * ```ts
 * import { of, zip, map } from 'rxjs';
 *
 * const age$ = of(27, 25, 29);
 * const name$ = of('Foo', 'Bar', 'Beer');
 * const isDev$ = of(true, true, false);
 *
 * zip(age$, name$, isDev$).pipe(
 *   map(([age, name, isDev]) => ({ age, name, isDev }))
 * )
 * .subscribe(x => console.log(x));
 *
 * // Outputs
 * // { age: 27, name: 'Foo', isDev: true }
 * // { age: 25, name: 'Bar', isDev: true }
 * // { age: 29, name: 'Beer', isDev: false }
 * ```
 *
 * @param sources
 * @return {Observable<R>}
 */
export function zip(...args: unknown[]): Observable<unknown> {
  const resultSelector = popResultSelector(args);

  const sources = argsOrArgArray(args) as Observable<unknown>[];

  return sources.length
    ? new Observable<unknown[]>((subscriber) => {
        // A collection of buffers of values from each source.
        // Keyed by the same index with which the sources were passed in.
        let buffers: unknown[][] = sources.map(() => []);

        // An array of flags of whether or not the sources have completed.
        // This is used to check to see if we should complete the result.
        // Keyed by the same index with which the sources were passed in.
        let completed = sources.map(() => false);

        // When everything is done, release the arrays above.
        subscriber.add(() => {
          buffers = completed = null!;
        });

        // Loop over our sources and subscribe to each one. The index `i` is
        // especially important here, because we use it in closures below to
        // access the related buffers and completion properties
        for (let sourceIndex = 0; !subscriber.closed && sourceIndex < sources.length; sourceIndex++) {
          innerFrom(sources[sourceIndex]).subscribe(
            createOperatorSubscriber(
              subscriber,
              (value) => {
                buffers[sourceIndex].push(value);
                // if every buffer has at least one value in it, then we
                // can shift out the oldest value from each buffer and emit
                // them as an array.
                if (buffers.every((buffer) => buffer.length)) {
                  const result: any = buffers.map((buffer) => buffer.shift()!);
                  // Emit the array. If theres' a result selector, use that.
                  subscriber.next(resultSelector ? resultSelector(...result) : result);
                  // If any one of the sources is both complete and has an empty buffer
                  // then we complete the result. This is because we cannot possibly have
                  // any more values to zip together.
                  if (buffers.some((buffer, i) => !buffer.length && completed[i])) {
                    subscriber.complete();
                  }
                }
              },
              () => {
                // This source completed. Mark it as complete so we can check it later
                // if we have to.
                completed[sourceIndex] = true;
                // But, if this complete source has nothing in its buffer, then we
                // can complete the result, because we can't possibly have any more
                // values from this to zip together with the other values.
                !buffers[sourceIndex].length && subscriber.complete();
              }
            )
          );
        }

        // When everything is done, release the arrays above.
        return () => {
          buffers = completed = null!;
        };
      })
    : EMPTY;
}
