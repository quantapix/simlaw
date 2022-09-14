import { config } from "../config"
import { createErrorClass } from "./createErrorClass"
import { identity } from "./identity"
import { InteropObservable } from "../types"
import { isFunction } from "./isFunction"
import { isScheduler } from "./isScheduler"
import { iterator as Symbol_iterator } from "../symbol/iterator"
import { map } from "../operators/map"
import { Observable } from "../Observable"
import { observable as Symbol_observable } from "../symbol/observable"
import { OperatorFunction } from "../types"
import { ReadableStreamLike } from "../types"
import { SchedulerAction, SchedulerLike } from "../types"
import { SchedulerLike } from "../types"
import { Subscriber } from "../Subscriber"
import { Subscription } from "../Subscription"
import { timeoutProvider } from "../scheduler/timeoutProvider"
import { UnaryFunction } from "../types"

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
  new (): ArgumentOutOfRangeError
}
export const ArgumentOutOfRangeError: ArgumentOutOfRangeErrorCtor =
  createErrorClass(
    _super =>
      function ArgumentOutOfRangeErrorImpl(this: any) {
        _super(this)
        this.name = "ArgumentOutOfRangeError"
        this.message = "argument out of range"
      }
  )
export interface EmptyError extends Error {}
export interface EmptyErrorCtor {
  new (): EmptyError
}
export const EmptyError: EmptyErrorCtor = createErrorClass(
  _super =>
    function EmptyErrorImpl(this: any) {
      _super(this)
      this.name = "EmptyError"
      this.message = "no elements in sequence"
    }
)
let nextHandle = 1

let resolved: Promise<any>
const activeHandles: { [key: number]: any } = {}
function findAndClearHandle(handle: number): boolean {
  if (handle in activeHandles) {
    delete activeHandles[handle]
    return true
  }
  return false
}
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
export const TestTools = {
  pending() {
    return Object.keys(activeHandles).length
  },
}
export interface NotFoundError extends Error {}
export interface NotFoundErrorCtor {
  new (message: string): NotFoundError
}
export const NotFoundError: NotFoundErrorCtor = createErrorClass(
  _super =>
    function NotFoundErrorImpl(this: any, message: string) {
      _super(this)
      this.name = "NotFoundError"
      this.message = message
    }
)
export interface ObjectUnsubscribedError extends Error {}
export interface ObjectUnsubscribedErrorCtor {
  new (): ObjectUnsubscribedError
}
export const ObjectUnsubscribedError: ObjectUnsubscribedErrorCtor =
  createErrorClass(
    _super =>
      function ObjectUnsubscribedErrorImpl(this: any) {
        _super(this)
        this.name = "ObjectUnsubscribedError"
        this.message = "object unsubscribed"
      }
  )
export interface SequenceError extends Error {}
export interface SequenceErrorCtor {
  new (message: string): SequenceError
}
export const SequenceError: SequenceErrorCtor = createErrorClass(
  _super =>
    function SequenceErrorImpl(this: any, message: string) {
      _super(this)
      this.name = "SequenceError"
      this.message = message
    }
)
export interface UnsubscriptionError extends Error {
  readonly errors: any[]
}
export interface UnsubscriptionErrorCtor {
  new (errors: any[]): UnsubscriptionError
}
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
export function argsOrArgArray<T>(args: (T | T[])[]): T[] {
  return args.length === 1 && isArray(args[0]) ? args[0] : (args as T[])
}
export function arrRemove<T>(arr: T[] | undefined | null, item: T) {
  if (arr) {
    const index = arr.indexOf(item)
    0 <= index && arr.splice(index, 1)
  }
}
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
let context: { errorThrown: boolean; error: any } | null = null
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
    cb()
  }
}
export function captureError(err: any) {
  if (config.useDeprecatedSynchronousErrorHandling && context) {
    context.errorThrown = true
    context.error = err
  }
}
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
    return scheduleSubscription
  }
}
export function identity<T>(x: T): T {
  return x
}
export const isArrayLike = <T>(x: any): x is ArrayLike<T> =>
  x && typeof x.length === "number" && typeof x !== "function"
export function isAsyncIterable<T>(obj: any): obj is AsyncIterable<T> {
  return Symbol.asyncIterator && isFunction(obj?.[Symbol.asyncIterator])
}
export function isValidDate(value: any): value is Date {
  return value instanceof Date && !isNaN(value as any)
}
export function isFunction(value: any): value is (...args: any[]) => any {
  return typeof value === "function"
}
export function isInteropObservable(
  input: any
): input is InteropObservable<any> {
  return isFunction(input[Symbol_observable])
}
export function isIterable(input: any): input is Iterable<any> {
  return isFunction(input?.[Symbol_iterator])
}
export function isObservable(obj: any): obj is Observable<unknown> {
  return (
    !!obj &&
    (obj instanceof Observable ||
      (isFunction(obj.lift) && isFunction(obj.subscribe)))
  )
}
export function isPromise(value: any): value is PromiseLike<any> {
  return isFunction(value?.then)
}
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
  return isFunction(obj?.getReader)
}
export function isScheduler(value: any): value is SchedulerLike {
  return value && isFunction(value.schedule)
}
export function hasLift(
  source: any
): source is { lift: InstanceType<typeof Observable>["lift"] } {
  return isFunction(source?.lift)
}
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
const { isArray } = Array
function callOrApply<T, R>(fn: (...values: T[]) => R, args: T | T[]): R {
  return isArray(args) ? fn(...args) : fn(args)
}
export function mapOneOrManyArgs<T, R>(
  fn: (...values: T[]) => R
): OperatorFunction<T | T[], R> {
  return map(args => callOrApply(fn, args))
}
export function noop() {}
export function not<T>(
  pred: (value: T, index: number) => boolean,
  thisArg: any
): (value: T, index: number) => boolean {
  return (value: T, index: number) => !pred.call(thisArg, value, index)
}
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
export function pipe(
  ...fns: Array<UnaryFunction<any, any>>
): UnaryFunction<any, any> {
  return pipeFromArray(fns)
}
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
export function reportUnhandledError(err: any) {
  timeoutProvider.setTimeout(() => {
    const { onUnhandledError } = config
    if (onUnhandledError) {
      onUnhandledError(err)
    } else {
      throw err
    }
  })
}
export const subscribeToArray =
  <T>(array: ArrayLike<T>) =>
  (subscriber: Subscriber<T>) => {
    for (let i = 0, len = array.length; i < len && !subscriber.closed; i++) {
      subscriber.next(array[i])
    }
    subscriber.complete()
  }
export function createInvalidObservableTypeError(input: any) {
  return new TypeError(
    `You provided ${
      input !== null && typeof input === "object"
        ? "an invalid object"
        : `'${input}'`
    } where a stream was expected. You can provide an Observable, Promise, ReadableStream, Array, AsyncIterable, or Iterable.`
  )
}

export {}
