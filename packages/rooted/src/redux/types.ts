/* eslint-disable @typescript-eslint/ban-types */

declare global {
  interface SymbolConstructor {
    readonly observable: symbol
  }
}

export const $$observable = (() =>
  (typeof Symbol === "function" && Symbol.observable) || "@@observable")()

export interface Action<T = any> {
  type: T
}

export interface AnyAction extends Action {
  [extraProps: string]: any
}

export interface ActionCreator<A, P extends any[] = any[]> {
  (...args: P): A
}

export interface ActionCreatorsMapObject<A = any, P extends any[] = any[]> {
  [key: string]: ActionCreator<A, P>
}

export interface MiddlewareAPI<D extends Dispatch = Dispatch, S = any> {
  dispatch: D
  getState(): S
}

export interface Middleware<
  _DispatchExt = {},
  S = any,
  D extends Dispatch = Dispatch
> {
  (api: MiddlewareAPI<D, S>): (
    next: D
  ) => (action: D extends Dispatch<infer A> ? A : never) => any
}

export type Reducer<S = any, A extends Action = AnyAction> = (
  state: S | undefined,
  action: A
) => S

export type ReducersMapObject<S = any, A extends Action = AnyAction> = {
  [K in keyof S]: Reducer<S[K], A>
}

export type StateFromReducersMapObject<M> = M extends ReducersMapObject
  ? { [P in keyof M]: M[P] extends Reducer<infer S, any> ? S : never }
  : never

export type ReducerFromReducersMapObject<M> = M extends {
  [P in keyof M]: infer R
}
  ? R extends Reducer<any, any>
    ? R
    : never
  : never

export type ActionFromReducer<R> = R extends Reducer<any, infer A> ? A : never

export type ActionFromReducersMapObject<M> = M extends ReducersMapObject
  ? ActionFromReducer<ReducerFromReducersMapObject<M>>
  : never

export type ExtendState<State, Extension> = [Extension] extends [never]
  ? State
  : State & Extension

declare const $CombinedState: unique symbol

interface EmptyObject {
  readonly [$CombinedState]?: undefined
}
export type CombinedState<S> = EmptyObject & S

export type PreloadedState<S> = Required<S> extends EmptyObject
  ? S extends CombinedState<infer S1>
    ? {
        [K in keyof S1]?: S1[K] extends object ? PreloadedState<S1[K]> : S1[K]
      }
    : S
  : {
      [K in keyof S]: S[K] extends string | number | boolean | symbol
        ? S[K]
        : PreloadedState<S[K]>
    }

export interface Dispatch<A extends Action = AnyAction> {
  <T extends A>(action: T, ...extraArgs: any[]): T
}

export interface Unsubscribe {
  (): void
}

declare global {
  interface SymbolConstructor {
    readonly observable: symbol
  }
}

export type Observable<T> = {
  subscribe: (observer: Observer<T>) => { unsubscribe: Unsubscribe }
  [Symbol.observable](): Observable<T>
}

export type Observer<T> = {
  next?(value: T): void
}

export interface Store<
  S = any,
  A extends Action = AnyAction,
  StateExt = never,
  Ext = {}
> {
  dispatch: Dispatch<A>
  getState(): S
  subscribe(listener: () => void): Unsubscribe
  replaceReducer<NewState, NewActions extends Action>(
    nextReducer: Reducer<NewState, NewActions>
  ): Store<ExtendState<NewState, StateExt>, NewActions, StateExt, Ext> & Ext

  [Symbol.observable](): Observable<S>
}

export interface StoreCreator {
  <S, A extends Action, Ext = {}, StateExt = never>(
    reducer: Reducer<S, A>,
    enhancer?: StoreEnhancer<Ext, StateExt>
  ): Store<ExtendState<S, StateExt>, A, StateExt, Ext> & Ext
  <S, A extends Action, Ext = {}, StateExt = never>(
    reducer: Reducer<S, A>,
    preloadedState?: PreloadedState<S>,
    enhancer?: StoreEnhancer<Ext>
  ): Store<ExtendState<S, StateExt>, A, StateExt, Ext> & Ext
}

export type StoreEnhancer<Ext = {}, StateExt = never> = (
  next: StoreEnhancerStoreCreator<Ext, StateExt>
) => StoreEnhancerStoreCreator<Ext, StateExt>
export type StoreEnhancerStoreCreator<Ext = {}, StateExt = never> = <
  S = any,
  A extends Action = AnyAction
>(
  reducer: Reducer<S, A>,
  preloadedState?: PreloadedState<S>
) => Store<ExtendState<S, StateExt>, A, StateExt, Ext> & Ext

export class MiddlewareArray<
  Middlewares extends Middleware<any, any>[]
> extends Array<Middlewares[number]> {
  constructor(...items: Middlewares)
  constructor(...args: any[]) {
    super(...args)
    Object.setPrototypeOf(this, MiddlewareArray.prototype)
  }

  static get [Symbol.species]() {
    return MiddlewareArray as any
  }

  override concat<
    AdditionalMiddlewares extends ReadonlyArray<Middleware<any, any>>
  >(
    items: AdditionalMiddlewares
  ): MiddlewareArray<[...Middlewares, ...AdditionalMiddlewares]>

  override concat<
    AdditionalMiddlewares extends ReadonlyArray<Middleware<any, any>>
  >(
    ...items: AdditionalMiddlewares
  ): MiddlewareArray<[...Middlewares, ...AdditionalMiddlewares]>
  override concat(...arr: any[]) {
    return super.concat.apply(this, arr)
  }

  prepend<AdditionalMiddlewares extends ReadonlyArray<Middleware<any, any>>>(
    items: AdditionalMiddlewares
  ): MiddlewareArray<[...AdditionalMiddlewares, ...Middlewares]>

  prepend<AdditionalMiddlewares extends ReadonlyArray<Middleware<any, any>>>(
    ...items: AdditionalMiddlewares
  ): MiddlewareArray<[...AdditionalMiddlewares, ...Middlewares]>

  prepend(...arr: any[]) {
    if (arr.length === 1 && Array.isArray(arr[0])) {
      return new MiddlewareArray(...arr[0].concat(this))
    }
    return new MiddlewareArray(...arr.concat(this))
  }
}

export type IsAny<T, True, False = never> = true | false extends (
  T extends never ? true : false
)
  ? True
  : False

export type IsUnknown<T, True, False = never> = unknown extends T
  ? IsAny<T, False, True>
  : False

export type FallbackIfUnknown<T, Fallback> = IsUnknown<T, Fallback, T>

export type IfMaybeUndefined<P, True, False> = [undefined] extends [P]
  ? True
  : False

export type IfVoid<P, True, False> = [void] extends [P] ? True : False

export type IsEmptyObj<T, True, False = never> = T extends any
  ? keyof T extends never
    ? IsUnknown<T, False, IfMaybeUndefined<T, False, IfVoid<T, False, True>>>
    : False
  : never

export type AtLeastTS35<True, False> = [True, False][IsUnknown<
  ReturnType<<T>() => T>,
  0,
  1
>]

export type IsUnknownOrNonInferrable<T, True, False> = AtLeastTS35<
  IsUnknown<T, True, False>,
  IsEmptyObj<T, True, IsUnknown<T, True, False>>
>

export type ExcludeFromTuple<T, E, Acc extends unknown[] = []> = T extends [
  infer Head,
  ...infer Tail
]
  ? ExcludeFromTuple<Tail, E, [...Acc, ...([Head] extends [E] ? [] : [Head])]>
  : Acc

type ExtractDispatchFromMiddlewareTuple<
  MiddlewareTuple extends any[],
  Acc extends {}
> = MiddlewareTuple extends [infer Head, ...infer Tail]
  ? ExtractDispatchFromMiddlewareTuple<
      Tail,
      Acc & (Head extends Middleware<infer D, any> ? IsAny<D, {}, D> : {})
    >
  : Acc

export type ExtractDispatchExtensions<M> = M extends MiddlewareArray<
  infer MiddlewareTuple
>
  ? ExtractDispatchFromMiddlewareTuple<MiddlewareTuple, {}>
  : M extends Middleware[]
  ? ExtractDispatchFromMiddlewareTuple<[...M], {}>
  : never

export type UnionToIntersection<U> = (
  U extends any ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never

export type NoInfer<T> = [T][T extends any ? 0 : never]

export type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>

export interface TypeGuard<T> {
  (value: any): value is T
}

export interface HasMatchFunction<T> {
  match: TypeGuard<T>
}

export const hasMatchFunction = <T>(
  v: Matcher<T>
): v is HasMatchFunction<T> => {
  return v && typeof (v as HasMatchFunction<T>).match === "function"
}

export type Matcher<T> = HasMatchFunction<T> | TypeGuard<T>

export type ActionFromMatcher<M extends Matcher<any>> = M extends Matcher<
  infer T
>
  ? T
  : never
