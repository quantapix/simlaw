import { map } from "./operator.js"
import { Observable } from "./observable.js"
import type * as qt from "./types.js"
import { Subscriber, SafeSubscriber } from "./subscriber.js"
import { timeoutProvider } from "./scheduler.js"

export function getPromiseCtor(x?: PromiseConstructorLike) {
  return x ?? config.Promise ?? Promise
}

export function isObserver<T>(x: any): x is qt.Observer<T> {
  return x && isFunction(x.next) && isFunction(x.error) && isFunction(x.done)
}

export function firstValueFrom<T, D>(
  o: Observable<T>,
  cfg: qt.FirstValueFromConfig<D>
): Promise<T | D>
export function firstValueFrom<T>(o: Observable<T>): Promise<T>
export function firstValueFrom<T, D>(
  o: Observable<T>,
  cfg?: qt.FirstValueFromConfig<D>
): Promise<T | D> {
  const hasConfig = typeof cfg === "object"
  return new Promise<T | D>((res, rej) => {
    const s = new SafeSubscriber<T>({
      next: x => {
        res(x)
        s.unsubscribe()
      },
      error: rej,
      done: () => {
        if (hasConfig) res(cfg!.defaultValue)
        else rej(new EmptyError())
      },
    })
    o.subscribe(s)
  })
}

export function lastValueFrom<T, D>(
  o: Observable<T>,
  cfg: qt.LastValueFromConfig<D>
): Promise<T | D>
export function lastValueFrom<T>(o: Observable<T>): Promise<T>
export function lastValueFrom<T, D>(
  o: Observable<T>,
  cfg?: qt.LastValueFromConfig<D>
): Promise<T | D> {
  const hasConfig = typeof cfg === "object"
  return new Promise<T | D>((res, rej) => {
    let has = false
    let v: T
    o.subscribe({
      next: x => {
        v = x
        has = true
      },
      error: rej,
      done: () => {
        if (has) res(v)
        else if (hasConfig) res(cfg!.defaultValue)
        else rej(new EmptyError())
      },
    })
  })
}

let nextHandle = 1
let resolved: Promise<any>
const activeHandles: { [k: number]: any } = {}

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
    if (!resolved) resolved = Promise.resolve()
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

export function popSelector(
  xs: any[]
): ((...xs: unknown[]) => unknown) | undefined {
  return isFunction(last(xs)) ? xs.pop() : undefined
}

export function popNumber(xs: any[], v: number): number {
  return typeof last(xs) === "number" ? xs.pop()! : v
}

const { isArray } = Array
const { getPrototypeOf, prototype, keys: getKeys } = Object

export function argsArgArrayOrObject<T, R extends Record<string, T>>(
  xs: T[] | [R] | [T[]]
): { xs: T[]; ks: string[] | null } {
  if (xs.length === 1) {
    const first = xs[0]
    if (isArray(first)) return { xs: first, ks: null }
    if (isPOJO(first)) {
      const ks = getKeys(first)
      return { xs: ks.map(k => first[k]!), ks }
    }
  }
  return { xs: xs as T[], ks: null }
}
function isPOJO(x: any): x is object {
  return x && typeof x === "object" && getPrototypeOf(x) === prototype
}
export function argsOrArgArray<T>(xs: (T | T[])[]): T[] {
  return xs.length === 1 && isArray(xs[0]) ? xs[0] : (xs as T[])
}
export function arrRemove<T>(xs: T[] | undefined | null, x: T) {
  if (xs) {
    const i = xs.indexOf(x)
    0 <= i && xs.splice(i, 1)
  }
}

export function createObject(ks: string[], vs: any[]) {
  return ks.reduce((y, k, i) => ((y[k] = vs[i]), y), {} as any)
}
let context: { errorThrown: boolean; error: any } | null = null
export function errorContext(cb: () => void) {
  if (config.useDeprecatedSynchronousErrorHandling) {
    const isRoot = !context
    if (isRoot) context = { errorThrown: false, error: null }
    cb()
    if (isRoot) {
      const { errorThrown, error } = context!
      context = null
      if (errorThrown) throw error
    }
  } else cb()
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
export function isArrayLike<T>(x: any): x is ArrayLike<T> {
  return x && typeof x.length === "number" && typeof x !== "function"
}
export function isAsyncIterable<T>(x: any): x is AsyncIterable<T> {
  return Symbol.asyncIterator && isFunction(x?.[Symbol.asyncIterator])
}
export function isValidDate(x: any): x is Date {
  return x instanceof Date && !isNaN(x as any)
}
export function isFunction(x: any): x is (...xs: any[]) => any {
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
  x: qt.ReadableStreamLike<T>
): AsyncGenerator<T> {
  const r = x.getReader()
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

function callOrApply<T, R>(f: (...xs: T[]) => R, xs: T | T[]): R {
  return isArray(xs) ? f(...xs) : f(xs)
}

export function mapOneOrManyArgs<T, R>(
  fn: (...xs: T[]) => R
): qt.OpFun<T | T[], R> {
  return map(xs => callOrApply(fn, xs))
}

export function noop() {}

export function not<T>(
  f: (x: T, i: number) => boolean,
  thisArg: any
): (x: T, i: number) => boolean {
  return (x: T, i: number) => !f.call(thisArg, x, i)
}

export function pipe(): typeof identity
export function pipe<T, A>(fn1: qt.UnaryFun<T, A>): qt.UnaryFun<T, A>
export function pipe<T, A, B>(
  fn1: qt.UnaryFun<T, A>,
  fn2: qt.UnaryFun<A, B>
): qt.UnaryFun<T, B>
export function pipe<T, A, B, C>(
  fn1: qt.UnaryFun<T, A>,
  fn2: qt.UnaryFun<A, B>,
  fn3: qt.UnaryFun<B, C>
): qt.UnaryFun<T, C>
export function pipe<T, A, B, C, D>(
  fn1: qt.UnaryFun<T, A>,
  fn2: qt.UnaryFun<A, B>,
  fn3: qt.UnaryFun<B, C>,
  fn4: qt.UnaryFun<C, D>
): qt.UnaryFun<T, D>
export function pipe<T, A, B, C, D, E>(
  fn1: qt.UnaryFun<T, A>,
  fn2: qt.UnaryFun<A, B>,
  fn3: qt.UnaryFun<B, C>,
  fn4: qt.UnaryFun<C, D>,
  fn5: qt.UnaryFun<D, E>
): qt.UnaryFun<T, E>
export function pipe<T, A, B, C, D, E, F>(
  fn1: qt.UnaryFun<T, A>,
  fn2: qt.UnaryFun<A, B>,
  fn3: qt.UnaryFun<B, C>,
  fn4: qt.UnaryFun<C, D>,
  fn5: qt.UnaryFun<D, E>,
  fn6: qt.UnaryFun<E, F>
): qt.UnaryFun<T, F>
export function pipe<T, A, B, C, D, E, F, G>(
  fn1: qt.UnaryFun<T, A>,
  fn2: qt.UnaryFun<A, B>,
  fn3: qt.UnaryFun<B, C>,
  fn4: qt.UnaryFun<C, D>,
  fn5: qt.UnaryFun<D, E>,
  fn6: qt.UnaryFun<E, F>,
  fn7: qt.UnaryFun<F, G>
): qt.UnaryFun<T, G>
export function pipe<T, A, B, C, D, E, F, G, H>(
  fn1: qt.UnaryFun<T, A>,
  fn2: qt.UnaryFun<A, B>,
  fn3: qt.UnaryFun<B, C>,
  fn4: qt.UnaryFun<C, D>,
  fn5: qt.UnaryFun<D, E>,
  fn6: qt.UnaryFun<E, F>,
  fn7: qt.UnaryFun<F, G>,
  fn8: qt.UnaryFun<G, H>
): qt.UnaryFun<T, H>
export function pipe<T, A, B, C, D, E, F, G, H, I>(
  fn1: qt.UnaryFun<T, A>,
  fn2: qt.UnaryFun<A, B>,
  fn3: qt.UnaryFun<B, C>,
  fn4: qt.UnaryFun<C, D>,
  fn5: qt.UnaryFun<D, E>,
  fn6: qt.UnaryFun<E, F>,
  fn7: qt.UnaryFun<F, G>,
  fn8: qt.UnaryFun<G, H>,
  fn9: qt.UnaryFun<H, I>
): qt.UnaryFun<T, I>
export function pipe<T, A, B, C, D, E, F, G, H, I>(
  fn1: qt.UnaryFun<T, A>,
  fn2: qt.UnaryFun<A, B>,
  fn3: qt.UnaryFun<B, C>,
  fn4: qt.UnaryFun<C, D>,
  fn5: qt.UnaryFun<D, E>,
  fn6: qt.UnaryFun<E, F>,
  fn7: qt.UnaryFun<F, G>,
  fn8: qt.UnaryFun<G, H>,
  fn9: qt.UnaryFun<H, I>,
  ...xs: qt.UnaryFun<any, any>[]
): qt.UnaryFun<T, unknown>
export function pipe(
  ...xs: Array<qt.UnaryFun<any, any>>
): qt.UnaryFun<any, any> {
  return pipeFromArray(xs)
}

export function pipeFromArray<T, R>(
  fns: Array<qt.UnaryFun<T, R>>
): qt.UnaryFun<T, R> {
  if (fns.length === 0) return identity as qt.UnaryFun<any, any>
  if (fns.length === 1) return fns[0]!
  return function piped(input: T): R {
    return fns.reduce(
      (prev: any, fn: qt.UnaryFun<T, R>) => fn(prev),
      input as any
    )
  }
}

export function reportUnhandledError(x: any) {
  timeoutProvider.setTimeout(() => {
    const { onUnhandledError } = config
    if (onUnhandledError) onUnhandledError(x)
    else throw x
  })
}

export const subscribeToArray =
  <T>(x: ArrayLike<T>) =>
  (s: Subscriber<T>) => {
    for (let i = 0, len = x.length; i < len && !s.closed; i++) {
      s.next(x[i]!)
    }
    s.done()
  }

export function createInvalidObservableTypeError(x: any) {
  return new TypeError(
    `You provided ${
      x !== null && typeof x === "object" ? "an invalid object" : `'${x}'`
    } where a stream was expected. You can provide an Observable, Promise, ReadableStream, Array, AsyncIterable, or Iterable.`
  )
}

export const config: qt.Config = {
  onUnhandledError: null,
  onStoppedNote: null,
  Promise: undefined,
  useDeprecatedSynchronousErrorHandling: false,
  useDeprecatedNextContext: false,
}

export function createErrorClass<T>(f: (_super: any) => any): T {
  const _super = (x: any) => {
    Error.call(x)
    x.stack = new Error().stack
  }
  const y = f(_super)
  y.prototype = Object.create(Error.prototype)
  y.prototype.constructor = y
  return y
}

export const OutOfRangeError: any = createErrorClass(
  _super =>
    function impl(this: any) {
      _super(this)
      this.name = "OutOfRangeError"
      this.message = "argument out of range"
    }
)

export const EmptyError: any = createErrorClass(
  _super =>
    function impl(this: any) {
      _super(this)
      this.name = "EmptyError"
      this.message = "no elements in sequence"
    }
)

export const NotFoundError: any = createErrorClass(
  _super =>
    function impl(this: any, x: string) {
      _super(this)
      this.name = "NotFoundError"
      this.message = x
    }
)

export const UnsubscribedError: any = createErrorClass(
  _super =>
    function impl(this: any) {
      _super(this)
      this.name = "UnsubscribedError"
      this.message = "object unsubscribed"
    }
)

export const SequenceError: any = createErrorClass(
  _super =>
    function impl(this: any, x: string) {
      _super(this)
      this.name = "SequenceError"
      this.message = x
    }
)

export const UnsubscriptionError: any = createErrorClass(
  _super =>
    function impl(this: any, xs: (Error | string)[]) {
      _super(this)
      this.message = xs
        ? `${xs.length} errors during unsubscription: ${xs
            .map((x, i) => `${i + 1}) ${x.toString()}`)
            .join("\n  ")}`
        : ""
      this.name = "UnsubscriptionError"
      this.errors = xs
    }
)
