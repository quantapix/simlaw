/* eslint-disable @typescript-eslint/no-empty-interface */

export interface Observer<T> {
  next: (x: T) => void
  error: (e: any) => void
  done: () => void
}

export interface NextObserver<T> {
  closed?: boolean
  next: (x: T) => void
  error?: ((x: any) => void) | undefined
  done?: (() => void) | undefined
}
export interface ErrObserver<T> {
  closed?: boolean
  next?: ((x: T) => void) | undefined
  error: (x: any) => void
  done?: (() => void) | undefined
}
export interface DoneObserver<T> {
  closed?: boolean
  next?: ((x: T) => void) | undefined
  error?: ((x: any) => void) | undefined
  done: () => void
}
export type PartialObserver<T> =
  | NextObserver<T>
  | ErrObserver<T>
  | DoneObserver<T>

export interface Unsubscribable {
  unsubscribe(): void
}
export interface Subscribable<T> {
  subscribe(x: PartialObserver<T>): Unsubscribable
}

export interface Subscription extends Unsubscribable {
  unsubscribe(): void
  readonly closed: boolean
}
export type Teardown = Subscription | Unsubscribable | (() => void) | void

export interface Observable<T> {
  [Symbol.observable]: () => Subscribable<T>
  subscribe(x?: PartialObserver<T>): Subscription
  subscribe(next: (x: T) => void): Subscription
  subscribe(
    next?: PartialObserver<T> | ((x: T) => void),
    error?: (x: any) => void,
    done?: () => void
  ): Subscription
}

export type SubOrPromise<T> =
  | Subscribable<T>
  | Subscribable<never>
  | PromiseLike<T>
  | Observable<T>

export type ObsInput<T> =
  | Observable<T>
  | AsyncIterable<T>
  | PromiseLike<T>
  | ArrayLike<T>
  | Iterable<T>
  | ReadableStreamLike<T>

export interface UnaryFun<T, R> {
  (x: T): R
}
export interface OpFun<T, R> extends UnaryFun<Observable<T>, Observable<R>> {}

export interface MonoTypeOp<T> extends OpFun<T, T> {}

export interface NextNote<T> {
  kind: "N"
  val: T
}
export interface ErrNote {
  kind: "E"
  err: any
}
export interface DoneNote {
  kind: "D"
}
export type ObsNote<T> = NextNote<T> | ErrNote | DoneNote

export interface SubjectLike<T> extends Observer<T>, Subscribable<T> {}

export interface Timestamp<T> {
  value: T
  timestamp: number
}
export interface TimeInterval<T> {
  value: T
  interval: number
}

export interface SchedulerAction<T> extends Subscription {
  schedule(x?: T, delay?: number): Subscription
}
export interface Scheduler extends TimestampProvider {
  schedule<T>(
    work: (this: SchedulerAction<T>, x?: T) => void,
    delay?: number,
    x?: T
  ): Subscription
  dispatch<T>(x: ObsInput<T>): Observable<T>
  run(s: Subscription, work: () => void, delay: number, more: true): void
  run(
    s: Subscription,
    work: () => void,
    delay?: number,
    more?: false
  ): Subscription
  runIterable<T>(x: Iterable<T>): Observable<T>
}

export interface TimestampProvider {
  now(): number
}

export type ObsValueOf<X> = X extends ObsInput<infer T> ? T : never
export type ObservedValueUnionFromArray<X> = X extends Array<ObsInput<infer T>>
  ? T
  : never
export type ObservedValuesFromArray<X> = ObservedValueUnionFromArray<X>
export type ObservedValueTupleFromArray<X> = {
  [K in keyof X]: ObsValueOf<X[K]>
}
export type InputTuple<X> = {
  [K in keyof X]: ObsInput<X[K]>
}

export type Cons<X, XS extends readonly any[]> = ((
  x: X,
  ...xs: XS
) => any) extends (...xs: infer T) => any
  ? T
  : never
export type Head<XS extends readonly any[]> = ((...xs: XS) => any) extends (
  x: infer T,
  ...xs: any[]
) => any
  ? T
  : never
export type Tail<XS extends readonly any[]> = ((...xs: XS) => any) extends (
  x: any,
  ...xs: infer T
) => any
  ? T
  : never

export type ValueFromArray<X extends readonly unknown[]> = X extends Array<
  infer T
>
  ? T
  : never
export type ValueFromNote<X> = X extends { kind: "N" | "E" | "C" }
  ? X extends NextNote<any>
    ? X extends { value: infer T }
      ? T
      : undefined
    : never
  : never

export type Falsy = null | undefined | false | 0 | -0 | 0n | ""
export type TruthyTypesOf<T> = T extends Falsy ? never : T

interface ReadableStreamDefaultReaderLike<T> {
  read(): PromiseLike<
    { done: false; value: T } | { done: true; value?: undefined }
  >
  releaseLock(): void
}
export interface ReadableStreamLike<T> {
  getReader(): ReadableStreamDefaultReaderLike<T>
}
export interface Connectable<T> extends Observable<T> {
  connect(): Subscription
}

declare const anyCatcherSymbol: unique symbol

export type AnyCatcher = typeof anyCatcherSymbol

export interface Config {
  onUnhandledError: ((x: any) => void) | null
  onStoppedNote: ((n: ObsNote<any>, s: Subscription) => void) | null
  Promise?: PromiseConstructorLike | undefined
  useDeprecatedSynchronousErrorHandling: boolean
  useDeprecatedNextContext: boolean
}

export interface FirstValueFromConfig<T> {
  defaultValue: T
}

export interface LastValueFromConfig<T> {
  defaultValue: T
}
