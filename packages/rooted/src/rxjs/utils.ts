import { map } from "./operators.js"
import { Observable } from "./observable.js"
import type * as qt from "./types.js"
import { Subscriber, SafeSubscriber } from "./subscriber.js"
import { timeoutProvider } from "./scheduler.js"

export function getPromiseCtor(x?: PromiseConstructorLike) {
  return x ?? config.Promise ?? Promise
}

export function isObserver<T>(x: any): x is qt.Observer<T> {
  return (
    x && isFunction(x.next) && isFunction(x.error) && isFunction(x.complete)
  )
}

export function firstValueFrom<T, D>(
  source: Observable<T>,
  config: qt.FirstValueFromConfig<D>
): Promise<T | D>
export function firstValueFrom<T>(source: Observable<T>): Promise<T>
export function firstValueFrom<T, D>(
  source: Observable<T>,
  config?: qt.FirstValueFromConfig<D>
): Promise<T | D> {
  const hasConfig = typeof config === "object"
  return new Promise<T | D>((resolve, reject) => {
    const subscriber = new SafeSubscriber<T>({
      next: value => {
        resolve(value)
        subscriber.unsubscribe()
      },
      error: reject,
      complete: () => {
        if (hasConfig) {
          resolve(config!.defaultValue)
        } else {
          reject(new EmptyError())
        }
      },
    })
    source.subscribe(subscriber)
  })
}

export function lastValueFrom<T, D>(
  source: Observable<T>,
  config: qt.LastValueFromConfig<D>
): Promise<T | D>
export function lastValueFrom<T>(source: Observable<T>): Promise<T>
export function lastValueFrom<T, D>(
  source: Observable<T>,
  config?: qt.LastValueFromConfig<D>
): Promise<T | D> {
  const hasConfig = typeof config === "object"
  return new Promise<T | D>((resolve, reject) => {
    let _hasValue = false
    let _value: T
    source.subscribe({
      next: value => {
        _value = value
        _hasValue = true
      },
      error: reject,
      complete: () => {
        if (_hasValue) {
          resolve(_value)
        } else if (hasConfig) {
          resolve(config!.defaultValue)
        } else {
          reject(new EmptyError())
        }
      },
    })
  })
}

export const ArgumentOutOfRangeError: qt.ArgumentOutOfRangeErrorCtor =
  createErrorClass(
    _super =>
      function ArgumentOutOfRangeErrorImpl(this: any) {
        _super(this)
        this.name = "ArgumentOutOfRangeError"
        this.message = "argument out of range"
      }
  )
export const EmptyError: qt.EmptyErrorCtor = createErrorClass(
  _super =>
    function impl(this: any) {
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

export const NotFoundError: qt.NotFoundErrorCtor = createErrorClass(
  _super =>
    function NotFoundErrorImpl(this: any, x: string) {
      _super(this)
      this.name = "NotFoundError"
      this.message = x
    }
)

export const ObjectUnsubscribedError: qt.ObjectUnsubscribedErrorCtor =
  createErrorClass(
    _super =>
      function ObjectUnsubscribedErrorImpl(this: any) {
        _super(this)
        this.name = "ObjectUnsubscribedError"
        this.message = "object unsubscribed"
      }
  )

export const SequenceError: qt.SequenceErrorCtor = createErrorClass(
  _super =>
    function SequenceErrorImpl(this: any, message: string) {
      _super(this)
      this.name = "SequenceError"
      this.message = message
    }
)

export const UnsubscriptionError: qt.UnsubscriptionErrorCtor = createErrorClass(
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

export function applyMixins(x: any, base: any[]) {
  for (let i = 0, len = base.length; i < len; i++) {
    const b = base[i]
    const ks = Object.getOwnPropertyNames(b.prototype)
    for (let j = 0, len2 = ks.length; j < len2; j++) {
      const n = ks[j]!
      x.prototype[n] = b.prototype[n]
    }
  }
}

export function last<T>(xs: T[]): T | undefined {
  return xs[xs.length - 1]
}
export function popResultSelector(
  xs: any[]
): ((...xs: unknown[]) => unknown) | undefined {
  return isFunction(last(xs)) ? xs.pop() : undefined
}
export function popNumber(xs: any[], v: number): number {
  return typeof last(xs) === "number" ? xs.pop()! : v
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
function isPOJO(x: any): x is object {
  return x && typeof x === "object" && getPrototypeOf(x) === objectProto
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
  const y = createImpl(_super)
  y.prototype = Object.create(Error.prototype)
  y.prototype.constructor = y
  return y
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
export function captureError(x: any) {
  if (config.useDeprecatedSynchronousErrorHandling && context) {
    context.errorThrown = true
    context.error = x
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
export function isValidDate(x: any): x is Date {
  return x instanceof Date && !isNaN(x as any)
}
export function isFunction(x: any): x is (...args: any[]) => any {
  return typeof x === "function"
}
export function isInteropObservable(x: any): x is qt.Observable<any> {
  return isFunction(x[Symbol.observable])
}
export function isIterable(x: any): x is Iterable<any> {
  return isFunction(x?.[Symbol.iterator])
}
export function isObservable(x: any): x is Observable<unknown> {
  return (
    !!x &&
    (x instanceof Observable || (isFunction(x.lift) && isFunction(x.subscribe)))
  )
}
export function isPromise(x: any): x is PromiseLike<any> {
  return isFunction(x?.then)
}
export async function* readableStreamLikeToAsyncGenerator<T>(
  readableStream: qt.ReadableStreamLike<T>
): AsyncGenerator<T> {
  const r = readableStream.getReader()
  try {
    while (true) {
      const { value, done } = await r.read()
      if (done) return
      yield value!
    }
  } finally {
    r.releaseLock()
  }
}
export function isReadableStreamLike<T>(x: any): x is qt.ReadableStreamLike<T> {
  return isFunction(x?.getReader)
}
export function isScheduler(x: any): x is qt.Scheduler {
  return x && isFunction(x.schedule)
}
export function hasLift(
  x: any
): x is { lift: InstanceType<typeof Observable>["lift"] } {
  return isFunction(x?.lift)
}
export function operate<T, R>(
  init: (
    liftedSource: Observable<T>,
    subscriber: Subscriber<R>
  ) => (() => void) | void
): qt.OperatorFunction<T, R> {
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
): qt.OperatorFunction<T | T[], R> {
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
export function pipe<T, A>(fn1: qt.UnaryFunction<T, A>): qt.UnaryFunction<T, A>
export function pipe<T, A, B>(
  fn1: qt.UnaryFunction<T, A>,
  fn2: qt.UnaryFunction<A, B>
): qt.UnaryFunction<T, B>
export function pipe<T, A, B, C>(
  fn1: qt.UnaryFunction<T, A>,
  fn2: qt.UnaryFunction<A, B>,
  fn3: qt.UnaryFunction<B, C>
): qt.UnaryFunction<T, C>
export function pipe<T, A, B, C, D>(
  fn1: qt.UnaryFunction<T, A>,
  fn2: qt.UnaryFunction<A, B>,
  fn3: qt.UnaryFunction<B, C>,
  fn4: qt.UnaryFunction<C, D>
): qt.UnaryFunction<T, D>
export function pipe<T, A, B, C, D, E>(
  fn1: qt.UnaryFunction<T, A>,
  fn2: qt.UnaryFunction<A, B>,
  fn3: qt.UnaryFunction<B, C>,
  fn4: qt.UnaryFunction<C, D>,
  fn5: qt.UnaryFunction<D, E>
): qt.UnaryFunction<T, E>
export function pipe<T, A, B, C, D, E, F>(
  fn1: qt.UnaryFunction<T, A>,
  fn2: qt.UnaryFunction<A, B>,
  fn3: qt.UnaryFunction<B, C>,
  fn4: qt.UnaryFunction<C, D>,
  fn5: qt.UnaryFunction<D, E>,
  fn6: qt.UnaryFunction<E, F>
): qt.UnaryFunction<T, F>
export function pipe<T, A, B, C, D, E, F, G>(
  fn1: qt.UnaryFunction<T, A>,
  fn2: qt.UnaryFunction<A, B>,
  fn3: qt.UnaryFunction<B, C>,
  fn4: qt.UnaryFunction<C, D>,
  fn5: qt.UnaryFunction<D, E>,
  fn6: qt.UnaryFunction<E, F>,
  fn7: qt.UnaryFunction<F, G>
): qt.UnaryFunction<T, G>
export function pipe<T, A, B, C, D, E, F, G, H>(
  fn1: qt.UnaryFunction<T, A>,
  fn2: qt.UnaryFunction<A, B>,
  fn3: qt.UnaryFunction<B, C>,
  fn4: qt.UnaryFunction<C, D>,
  fn5: qt.UnaryFunction<D, E>,
  fn6: qt.UnaryFunction<E, F>,
  fn7: qt.UnaryFunction<F, G>,
  fn8: qt.UnaryFunction<G, H>
): qt.UnaryFunction<T, H>
export function pipe<T, A, B, C, D, E, F, G, H, I>(
  fn1: qt.UnaryFunction<T, A>,
  fn2: qt.UnaryFunction<A, B>,
  fn3: qt.UnaryFunction<B, C>,
  fn4: qt.UnaryFunction<C, D>,
  fn5: qt.UnaryFunction<D, E>,
  fn6: qt.UnaryFunction<E, F>,
  fn7: qt.UnaryFunction<F, G>,
  fn8: qt.UnaryFunction<G, H>,
  fn9: qt.UnaryFunction<H, I>
): qt.UnaryFunction<T, I>
export function pipe<T, A, B, C, D, E, F, G, H, I>(
  fn1: qt.UnaryFunction<T, A>,
  fn2: qt.UnaryFunction<A, B>,
  fn3: qt.UnaryFunction<B, C>,
  fn4: qt.UnaryFunction<C, D>,
  fn5: qt.UnaryFunction<D, E>,
  fn6: qt.UnaryFunction<E, F>,
  fn7: qt.UnaryFunction<F, G>,
  fn8: qt.UnaryFunction<G, H>,
  fn9: qt.UnaryFunction<H, I>,
  ...fns: qt.UnaryFunction<any, any>[]
): qt.UnaryFunction<T, unknown>
export function pipe(
  ...fns: Array<qt.UnaryFunction<any, any>>
): qt.UnaryFunction<any, any> {
  return pipeFromArray(fns)
}
export function pipeFromArray<T, R>(
  fns: Array<qt.UnaryFunction<T, R>>
): qt.UnaryFunction<T, R> {
  if (fns.length === 0) {
    return identity as qt.UnaryFunction<any, any>
  }
  if (fns.length === 1) {
    return fns[0]
  }
  return function piped(input: T): R {
    return fns.reduce(
      (prev: any, fn: qt.UnaryFunction<T, R>) => fn(prev),
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

export const config: qt.GlobalConfig = {
  onUnhandledError: null,
  onStoppedNote: null,
  Promise: undefined,
  useDeprecatedSynchronousErrorHandling: false,
  useDeprecatedNextContext: false,
}
