import { createErrorClass } from "./createErrorClass"

/** Symbol.observable or a string "@@observable". Used for interop */
export const observable: string | symbol = (() =>
  (typeof Symbol === "function" && Symbol.observable) || "@@observable")()

export function getSymbolIterator(): symbol {
  if (typeof Symbol !== "function" || !Symbol.iterator) {
    return "@@iterator" as any
  }

  return Symbol.iterator
}

export const iterator = getSymbolIterator()

export interface ArgumentOutOfRangeError extends Error {}

export interface ArgumentOutOfRangeErrorCtor {
  /**
   * @deprecated Internal implementation detail. Do not construct error instances.
   * Cannot be tagged as internal: https://github.com/ReactiveX/rxjs/issues/6269
   */
  new (): ArgumentOutOfRangeError
}

/**
 * An error thrown when an element was queried at a certain index of an
 * Observable, but no such index or position exists in that sequence.
 *
 * @see {@link elementAt}
 * @see {@link take}
 * @see {@link takeLast}
 *
 * @class ArgumentOutOfRangeError
 */
export const ArgumentOutOfRangeError: ArgumentOutOfRangeErrorCtor =
  createErrorClass(
    _super =>
      function ArgumentOutOfRangeErrorImpl(this: any) {
        _super(this)
        this.name = "ArgumentOutOfRangeError"
        this.message = "argument out of range"
      }
  )
import { createErrorClass } from "./createErrorClass"

export interface EmptyError extends Error {}

export interface EmptyErrorCtor {
  /**
   * @deprecated Internal implementation detail. Do not construct error instances.
   * Cannot be tagged as internal: https://github.com/ReactiveX/rxjs/issues/6269
   */
  new (): EmptyError
}

/**
 * An error thrown when an Observable or a sequence was queried but has no
 * elements.
 *
 * @see {@link first}
 * @see {@link last}
 * @see {@link single}
 * @see {@link firstValueFrom}
 * @see {@link lastValueFrom}
 *
 * @class EmptyError
 */
export const EmptyError: EmptyErrorCtor = createErrorClass(
  _super =>
    function EmptyErrorImpl(this: any) {
      _super(this)
      this.name = "EmptyError"
      this.message = "no elements in sequence"
    }
)
let nextHandle = 1
// The promise needs to be created lazily otherwise it won't be patched by Zones
let resolved: Promise<any>
const activeHandles: { [key: number]: any } = {}

/**
 * Finds the handle in the list of active handles, and removes it.
 * Returns `true` if found, `false` otherwise. Used both to clear
 * Immediate scheduled tasks, and to identify if a task should be scheduled.
 */
function findAndClearHandle(handle: number): boolean {
  if (handle in activeHandles) {
    delete activeHandles[handle]
    return true
  }
  return false
}

/**
 * Helper functions to schedule and unschedule microtasks.
 */
export const Immediate = {
  setImmediate(cb: () => void): number {
    const handle = nextHandle++
    activeHandles[handle] = true
    if (!resolved) {
      resolved = Promise.resolve()
    }
    resolved.then(() => findAndClearHandle(handle) && cb())
    return handle
  },

  clearImmediate(handle: number): void {
    findAndClearHandle(handle)
  },
}

/**
 * Used for internal testing purposes only. Do not export from library.
 */
export const TestTools = {
  pending() {
    return Object.keys(activeHandles).length
  },
}
import { createErrorClass } from "./createErrorClass"

export interface NotFoundError extends Error {}

export interface NotFoundErrorCtor {
  /**
   * @deprecated Internal implementation detail. Do not construct error instances.
   * Cannot be tagged as internal: https://github.com/ReactiveX/rxjs/issues/6269
   */
  new (message: string): NotFoundError
}

/**
 * An error thrown when a value or values are missing from an
 * observable sequence.
 *
 * @see {@link operators/single}
 *
 * @class NotFoundError
 */
export const NotFoundError: NotFoundErrorCtor = createErrorClass(
  _super =>
    function NotFoundErrorImpl(this: any, message: string) {
      _super(this)
      this.name = "NotFoundError"
      this.message = message
    }
)
import { createErrorClass } from "./createErrorClass"

export interface ObjectUnsubscribedError extends Error {}

export interface ObjectUnsubscribedErrorCtor {
  /**
   * @deprecated Internal implementation detail. Do not construct error instances.
   * Cannot be tagged as internal: https://github.com/ReactiveX/rxjs/issues/6269
   */
  new (): ObjectUnsubscribedError
}

/**
 * An error thrown when an action is invalid because the object has been
 * unsubscribed.
 *
 * @see {@link Subject}
 * @see {@link BehaviorSubject}
 *
 * @class ObjectUnsubscribedError
 */
export const ObjectUnsubscribedError: ObjectUnsubscribedErrorCtor =
  createErrorClass(
    _super =>
      function ObjectUnsubscribedErrorImpl(this: any) {
        _super(this)
        this.name = "ObjectUnsubscribedError"
        this.message = "object unsubscribed"
      }
  )
import { createErrorClass } from "./createErrorClass"

export interface SequenceError extends Error {}

export interface SequenceErrorCtor {
  /**
   * @deprecated Internal implementation detail. Do not construct error instances.
   * Cannot be tagged as internal: https://github.com/ReactiveX/rxjs/issues/6269
   */
  new (message: string): SequenceError
}

/**
 * An error thrown when something is wrong with the sequence of
 * values arriving on the observable.
 *
 * @see {@link operators/single}
 *
 * @class SequenceError
 */
export const SequenceError: SequenceErrorCtor = createErrorClass(
  _super =>
    function SequenceErrorImpl(this: any, message: string) {
      _super(this)
      this.name = "SequenceError"
      this.message = message
    }
)
import { createErrorClass } from "./createErrorClass"

export interface UnsubscriptionError extends Error {
  readonly errors: any[]
}

export interface UnsubscriptionErrorCtor {
  /**
   * @deprecated Internal implementation detail. Do not construct error instances.
   * Cannot be tagged as internal: https://github.com/ReactiveX/rxjs/issues/6269
   */
  new (errors: any[]): UnsubscriptionError
}

/**
 * An error thrown when one or more errors have occurred during the
 * `unsubscribe` of a {@link Subscription}.
 */
export const UnsubscriptionError: UnsubscriptionErrorCtor = createErrorClass(
  _super =>
    function UnsubscriptionErrorImpl(this: any, errors: (Error | string)[]) {
      _super(this)
      this.message = errors
        ? `${errors.length} errors occurred during unsubscription:
${errors.map((err, i) => `${i + 1}) ${err.toString()}`).join("\n  ")}`
        : ""
      this.name = "UnsubscriptionError"
      this.errors = errors
    }
)
export function applyMixins(derivedCtor: any, baseCtors: any[]) {
  for (let i = 0, len = baseCtors.length; i < len; i++) {
    const baseCtor = baseCtors[i]
    const propertyKeys = Object.getOwnPropertyNames(baseCtor.prototype)
    for (let j = 0, len2 = propertyKeys.length; j < len2; j++) {
      const name = propertyKeys[j]
      derivedCtor.prototype[name] = baseCtor.prototype[name]
    }
  }
}
import { SchedulerLike } from "../types"
import { isFunction } from "./isFunction"
import { isScheduler } from "./isScheduler"

function last<T>(arr: T[]): T | undefined {
  return arr[arr.length - 1]
}

export function popResultSelector(
  args: any[]
): ((...args: unknown[]) => unknown) | undefined {
  return isFunction(last(args)) ? args.pop() : undefined
}

export function popScheduler(args: any[]): SchedulerLike | undefined {
  return isScheduler(last(args)) ? args.pop() : undefined
}

export function popNumber(args: any[], defaultValue: number): number {
  return typeof last(args) === "number" ? args.pop()! : defaultValue
}
const { isArray } = Array
const { getPrototypeOf, prototype: objectProto, keys: getKeys } = Object

/**
 * Used in functions where either a list of arguments, a single array of arguments, or a
 * dictionary of arguments can be returned. Returns an object with an `args` property with
 * the arguments in an array, if it is a dictionary, it will also return the `keys` in another
 * property.
 */
export function argsArgArrayOrObject<T, O extends Record<string, T>>(
  args: T[] | [O] | [T[]]
): { args: T[]; keys: string[] | null } {
  if (args.length === 1) {
    const first = args[0]
    if (isArray(first)) {
      return { args: first, keys: null }
    }
    if (isPOJO(first)) {
      const keys = getKeys(first)
      return {
        args: keys.map(key => first[key]),
        keys,
      }
    }
  }

  return { args: args as T[], keys: null }
}

function isPOJO(obj: any): obj is object {
  return obj && typeof obj === "object" && getPrototypeOf(obj) === objectProto
}
const { isArray } = Array

/**
 * Used in operators and functions that accept either a list of arguments, or an array of arguments
 * as a single argument.
 */
export function argsOrArgArray<T>(args: (T | T[])[]): T[] {
  return args.length === 1 && isArray(args[0]) ? args[0] : (args as T[])
}
/**
 * Removes an item from an array, mutating it.
 * @param arr The array to remove the item from
 * @param item The item to remove
 */
export function arrRemove<T>(arr: T[] | undefined | null, item: T) {
  if (arr) {
    const index = arr.indexOf(item)
    0 <= index && arr.splice(index, 1)
  }
}
/**
 * Used to create Error subclasses until the community moves away from ES5.
 *
 * This is because compiling from TypeScript down to ES5 has issues with subclassing Errors
 * as well as other built-in types: https://github.com/Microsoft/TypeScript/issues/12123
 *
 * @param createImpl A factory function to create the actual constructor implementation. The returned
 * function should be a named function that calls `_super` internally.
 */
export function createErrorClass<T>(createImpl: (_super: any) => any): T {
  const _super = (instance: any) => {
    Error.call(instance)
    instance.stack = new Error().stack
  }

  const ctorFunc = createImpl(_super)
  ctorFunc.prototype = Object.create(Error.prototype)
  ctorFunc.prototype.constructor = ctorFunc
  return ctorFunc
}
export function createObject(keys: string[], values: any[]) {
  return keys.reduce(
    (result, key, i) => ((result[key] = values[i]), result),
    {} as any
  )
}
import { config } from "../config"

let context: { errorThrown: boolean; error: any } | null = null

/**
 * Handles dealing with errors for super-gross mode. Creates a context, in which
 * any synchronously thrown errors will be passed to {@link captureError}. Which
 * will record the error such that it will be rethrown after the call back is complete.
 * TODO: Remove in v8
 * @param cb An immediately executed function.
 */
export function errorContext(cb: () => void) {
  if (config.useDeprecatedSynchronousErrorHandling) {
    const isRoot = !context
    if (isRoot) {
      context = { errorThrown: false, error: null }
    }
    cb()
    if (isRoot) {
      const { errorThrown, error } = context!
      context = null
      if (errorThrown) {
        throw error
      }
    }
  } else {
    // This is the general non-deprecated path for everyone that
    // isn't crazy enough to use super-gross mode (useDeprecatedSynchronousErrorHandling)
    cb()
  }
}

/**
 * Captures errors only in super-gross mode.
 * @param err the error to capture
 */
export function captureError(err: any) {
  if (config.useDeprecatedSynchronousErrorHandling && context) {
    context.errorThrown = true
    context.error = err
  }
}
import { Subscription } from "../Subscription"
import { SchedulerAction, SchedulerLike } from "../types"

export function executeSchedule(
  parentSubscription: Subscription,
  scheduler: SchedulerLike,
  work: () => void,
  delay: number,
  repeat: true
): void
export function executeSchedule(
  parentSubscription: Subscription,
  scheduler: SchedulerLike,
  work: () => void,
  delay?: number,
  repeat?: false
): Subscription

export function executeSchedule(
  parentSubscription: Subscription,
  scheduler: SchedulerLike,
  work: () => void,
  delay = 0,
  repeat = false
): Subscription | void {
  const scheduleSubscription = scheduler.schedule(function (
    this: SchedulerAction<any>
  ) {
    work()
    if (repeat) {
      parentSubscription.add(this.schedule(null, delay))
    } else {
      this.unsubscribe()
    }
  },
  delay)

  parentSubscription.add(scheduleSubscription)

  if (!repeat) {
    // Because user-land scheduler implementations are unlikely to properly reuse
    // Actions for repeat scheduling, we can't trust that the returned subscription
    // will control repeat subscription scenarios. So we're trying to avoid using them
    // incorrectly within this library.
    return scheduleSubscription
  }
}
/**
 * This function takes one parameter and just returns it. Simply put,
 * this is like `<T>(x: T): T => x`.
 *
 * ## Examples
 *
 * This is useful in some cases when using things like `mergeMap`
 *
 * ```ts
 * import { interval, take, map, range, mergeMap, identity } from 'rxjs';
 *
 * const source$ = interval(1000).pipe(take(5));
 *
 * const result$ = source$.pipe(
 *   map(i => range(i)),
 *   mergeMap(identity) // same as mergeMap(x => x)
 * );
 *
 * result$.subscribe({
 *   next: console.log
 * });
 * ```
 *
 * Or when you want to selectively apply an operator
 *
 * ```ts
 * import { interval, take, identity } from 'rxjs';
 *
 * const shouldLimit = () => Math.random() < 0.5;
 *
 * const source$ = interval(1000);
 *
 * const result$ = source$.pipe(shouldLimit() ? take(5) : identity);
 *
 * result$.subscribe({
 *   next: console.log
 * });
 * ```
 *
 * @param x Any value that is returned by this function
 * @returns The value passed as the first parameter to this function
 */
export function identity<T>(x: T): T {
  return x
}
export const isArrayLike = <T>(x: any): x is ArrayLike<T> =>
  x && typeof x.length === "number" && typeof x !== "function"
import { isFunction } from "./isFunction"

export function isAsyncIterable<T>(obj: any): obj is AsyncIterable<T> {
  return Symbol.asyncIterator && isFunction(obj?.[Symbol.asyncIterator])
}
/**
 * Checks to see if a value is not only a `Date` object,
 * but a *valid* `Date` object that can be converted to a
 * number. For example, `new Date('blah')` is indeed an
 * `instanceof Date`, however it cannot be converted to a
 * number.
 */
export function isValidDate(value: any): value is Date {
  return value instanceof Date && !isNaN(value as any)
}
/**
 * Returns true if the object is a function.
 * @param value The value to check
 */
export function isFunction(value: any): value is (...args: any[]) => any {
  return typeof value === "function"
}
import { InteropObservable } from "../types"
import { observable as Symbol_observable } from "../symbol/observable"
import { isFunction } from "./isFunction"

/** Identifies an input as being Observable (but not necessary an Rx Observable) */
export function isInteropObservable(
  input: any
): input is InteropObservable<any> {
  return isFunction(input[Symbol_observable])
}
import { iterator as Symbol_iterator } from "../symbol/iterator"
import { isFunction } from "./isFunction"

/** Identifies an input as being an Iterable */
export function isIterable(input: any): input is Iterable<any> {
  return isFunction(input?.[Symbol_iterator])
}
/** prettier */
import { Observable } from "../Observable"
import { isFunction } from "./isFunction"

/**
 * Tests to see if the object is an RxJS {@link Observable}
 * @param obj the object to test
 */
export function isObservable(obj: any): obj is Observable<unknown> {
  // The !! is to ensure that this publicly exposed function returns
  // `false` if something like `null` or `0` is passed.
  return (
    !!obj &&
    (obj instanceof Observable ||
      (isFunction(obj.lift) && isFunction(obj.subscribe)))
  )
}
import { isFunction } from "./isFunction"

/**
 * Tests to see if the object is "thennable".
 * @param value the object to test
 */
export function isPromise(value: any): value is PromiseLike<any> {
  return isFunction(value?.then)
}
import { ReadableStreamLike } from "../types"
import { isFunction } from "./isFunction"

export async function* readableStreamLikeToAsyncGenerator<T>(
  readableStream: ReadableStreamLike<T>
): AsyncGenerator<T> {
  const reader = readableStream.getReader()
  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) {
        return
      }
      yield value!
    }
  } finally {
    reader.releaseLock()
  }
}

export function isReadableStreamLike<T>(
  obj: any
): obj is ReadableStreamLike<T> {
  // We don't want to use instanceof checks because they would return
  // false for instances from another Realm, like an <iframe>.
  return isFunction(obj?.getReader)
}
import { SchedulerLike } from "../types"
import { isFunction } from "./isFunction"

export function isScheduler(value: any): value is SchedulerLike {
  return value && isFunction(value.schedule)
}
import { Observable } from "../Observable"
import { Subscriber } from "../Subscriber"
import { OperatorFunction } from "../types"
import { isFunction } from "./isFunction"

/**
 * Used to determine if an object is an Observable with a lift function.
 */
export function hasLift(
  source: any
): source is { lift: InstanceType<typeof Observable>["lift"] } {
  return isFunction(source?.lift)
}

/**
 * Creates an `OperatorFunction`. Used to define operators throughout the library in a concise way.
 * @param init The logic to connect the liftedSource to the subscriber at the moment of subscription.
 */
export function operate<T, R>(
  init: (
    liftedSource: Observable<T>,
    subscriber: Subscriber<R>
  ) => (() => void) | void
): OperatorFunction<T, R> {
  return (source: Observable<T>) => {
    if (hasLift(source)) {
      return source.lift(function (
        this: Subscriber<R>,
        liftedSource: Observable<T>
      ) {
        try {
          return init(liftedSource, this)
        } catch (err) {
          this.error(err)
        }
      })
    }
    throw new TypeError("Unable to lift unknown Observable type")
  }
}
import { OperatorFunction } from "../types"
import { map } from "../operators/map"

const { isArray } = Array

function callOrApply<T, R>(fn: (...values: T[]) => R, args: T | T[]): R {
  return isArray(args) ? fn(...args) : fn(args)
}

/**
 * Used in several -- mostly deprecated -- situations where we need to
 * apply a list of arguments or a single argument to a result selector.
 */
export function mapOneOrManyArgs<T, R>(
  fn: (...values: T[]) => R
): OperatorFunction<T | T[], R> {
  return map(args => callOrApply(fn, args))
} /* tslint:disable:no-empty */
export function noop() {}
export function not<T>(
  pred: (value: T, index: number) => boolean,
  thisArg: any
): (value: T, index: number) => boolean {
  return (value: T, index: number) => !pred.call(thisArg, value, index)
}
import { identity } from "./identity"
import { UnaryFunction } from "../types"

export function pipe(): typeof identity
export function pipe<T, A>(fn1: UnaryFunction<T, A>): UnaryFunction<T, A>
export function pipe<T, A, B>(
  fn1: UnaryFunction<T, A>,
  fn2: UnaryFunction<A, B>
): UnaryFunction<T, B>
export function pipe<T, A, B, C>(
  fn1: UnaryFunction<T, A>,
  fn2: UnaryFunction<A, B>,
  fn3: UnaryFunction<B, C>
): UnaryFunction<T, C>
export function pipe<T, A, B, C, D>(
  fn1: UnaryFunction<T, A>,
  fn2: UnaryFunction<A, B>,
  fn3: UnaryFunction<B, C>,
  fn4: UnaryFunction<C, D>
): UnaryFunction<T, D>
export function pipe<T, A, B, C, D, E>(
  fn1: UnaryFunction<T, A>,
  fn2: UnaryFunction<A, B>,
  fn3: UnaryFunction<B, C>,
  fn4: UnaryFunction<C, D>,
  fn5: UnaryFunction<D, E>
): UnaryFunction<T, E>
export function pipe<T, A, B, C, D, E, F>(
  fn1: UnaryFunction<T, A>,
  fn2: UnaryFunction<A, B>,
  fn3: UnaryFunction<B, C>,
  fn4: UnaryFunction<C, D>,
  fn5: UnaryFunction<D, E>,
  fn6: UnaryFunction<E, F>
): UnaryFunction<T, F>
export function pipe<T, A, B, C, D, E, F, G>(
  fn1: UnaryFunction<T, A>,
  fn2: UnaryFunction<A, B>,
  fn3: UnaryFunction<B, C>,
  fn4: UnaryFunction<C, D>,
  fn5: UnaryFunction<D, E>,
  fn6: UnaryFunction<E, F>,
  fn7: UnaryFunction<F, G>
): UnaryFunction<T, G>
export function pipe<T, A, B, C, D, E, F, G, H>(
  fn1: UnaryFunction<T, A>,
  fn2: UnaryFunction<A, B>,
  fn3: UnaryFunction<B, C>,
  fn4: UnaryFunction<C, D>,
  fn5: UnaryFunction<D, E>,
  fn6: UnaryFunction<E, F>,
  fn7: UnaryFunction<F, G>,
  fn8: UnaryFunction<G, H>
): UnaryFunction<T, H>
export function pipe<T, A, B, C, D, E, F, G, H, I>(
  fn1: UnaryFunction<T, A>,
  fn2: UnaryFunction<A, B>,
  fn3: UnaryFunction<B, C>,
  fn4: UnaryFunction<C, D>,
  fn5: UnaryFunction<D, E>,
  fn6: UnaryFunction<E, F>,
  fn7: UnaryFunction<F, G>,
  fn8: UnaryFunction<G, H>,
  fn9: UnaryFunction<H, I>
): UnaryFunction<T, I>
export function pipe<T, A, B, C, D, E, F, G, H, I>(
  fn1: UnaryFunction<T, A>,
  fn2: UnaryFunction<A, B>,
  fn3: UnaryFunction<B, C>,
  fn4: UnaryFunction<C, D>,
  fn5: UnaryFunction<D, E>,
  fn6: UnaryFunction<E, F>,
  fn7: UnaryFunction<F, G>,
  fn8: UnaryFunction<G, H>,
  fn9: UnaryFunction<H, I>,
  ...fns: UnaryFunction<any, any>[]
): UnaryFunction<T, unknown>

/**
 * pipe() can be called on one or more functions, each of which can take one argument ("UnaryFunction")
 * and uses it to return a value.
 * It returns a function that takes one argument, passes it to the first UnaryFunction, and then
 * passes the result to the next one, passes that result to the next one, and so on.
 */
export function pipe(
  ...fns: Array<UnaryFunction<any, any>>
): UnaryFunction<any, any> {
  return pipeFromArray(fns)
}

/** @internal */
export function pipeFromArray<T, R>(
  fns: Array<UnaryFunction<T, R>>
): UnaryFunction<T, R> {
  if (fns.length === 0) {
    return identity as UnaryFunction<any, any>
  }

  if (fns.length === 1) {
    return fns[0]
  }

  return function piped(input: T): R {
    return fns.reduce(
      (prev: any, fn: UnaryFunction<T, R>) => fn(prev),
      input as any
    )
  }
}
import { config } from "../config"
import { timeoutProvider } from "../scheduler/timeoutProvider"

/**
 * Handles an error on another job either with the user-configured {@link onUnhandledError},
 * or by throwing it on that new job so it can be picked up by `window.onerror`, `process.on('error')`, etc.
 *
 * This should be called whenever there is an error that is out-of-band with the subscription
 * or when an error hits a terminal boundary of the subscription and no error handler was provided.
 *
 * @param err the error to report
 */
export function reportUnhandledError(err: any) {
  timeoutProvider.setTimeout(() => {
    const { onUnhandledError } = config
    if (onUnhandledError) {
      // Execute the user-configured error handler.
      onUnhandledError(err)
    } else {
      // Throw so it is picked up by the runtime's uncaught error mechanism.
      throw err
    }
  })
}
import { Subscriber } from "../Subscriber"

/**
 * Subscribes to an ArrayLike with a subscriber
 * @param array The array or array-like to subscribe to
 */
export const subscribeToArray =
  <T>(array: ArrayLike<T>) =>
  (subscriber: Subscriber<T>) => {
    for (let i = 0, len = array.length; i < len && !subscriber.closed; i++) {
      subscriber.next(array[i])
    }
    subscriber.complete()
  }
/**
 * Creates the TypeError to throw if an invalid object is passed to `from` or `scheduled`.
 * @param input The object that was passed.
 */
export function createInvalidObservableTypeError(input: any) {
  // TODO: We should create error codes that can be looked up, so this can be less verbose.
  return new TypeError(
    `You provided ${
      input !== null && typeof input === "object"
        ? "an invalid object"
        : `'${input}'`
    } where a stream was expected. You can provide an Observable, Promise, ReadableStream, Array, AsyncIterable, or Iterable.`
  )
}
// Instead of using any - or another less-than-ideal type - to workaround a
// TypeScript problem or bug, create a type alias and use that instead.
// Wherever possible, use a TypeScript issue number in the type - something
// like TS_18757 - or use a descriptive name and leave a detailed comment
// alongside the type alias.

export {}
