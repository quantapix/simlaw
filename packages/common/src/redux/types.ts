declare global {
  interface SymbolConstructor {
    readonly observable: symbol
  }
}

export const $$observable = (() => (typeof Symbol === "function" && Symbol.observable) || "@@observable")()

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

export interface Middleware<_DispatchExt = {}, S = any, D extends Dispatch = Dispatch> {
  (api: MiddlewareAPI<D, S>): (next: D) => (action: D extends Dispatch<infer A> ? A : never) => any
}

export type Reducer<S = any, A extends Action = AnyAction> = (state: S | undefined, action: A) => S

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

export type ExtendState<State, Extension> = [Extension] extends [never] ? State : State & Extension

declare const $CombinedState: unique symbol

interface EmptyObject {
  readonly [$CombinedState]?: undefined
}

/*
type EmptyObject = {
  [K in any]: never
}
*/

export type CombinedState<S> = EmptyObject & S

export type PreloadedState<S> = Required<S> extends EmptyObject
  ? S extends CombinedState<infer S1>
    ? {
        [K in keyof S1]?: S1[K] extends object ? PreloadedState<S1[K]> : S1[K]
      }
    : S
  : {
      [K in keyof S]: S[K] extends string | number | boolean | symbol ? S[K] : PreloadedState<S[K]>
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

export interface Store<S = any, A extends Action = AnyAction, StateExt = never, Ext = {}> {
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
export type StoreEnhancerStoreCreator<Ext = {}, StateExt = never> = <S = any, A extends Action = AnyAction>(
  reducer: Reducer<S, A>,
  preloadedState?: PreloadedState<S>
) => Store<ExtendState<S, StateExt>, A, StateExt, Ext> & Ext

export class MiddlewareArray<Middlewares extends Middleware<any, any>[]> extends Array<Middlewares[number]> {
  constructor(...items: Middlewares)
  constructor(...args: any[]) {
    super(...args)
    Object.setPrototypeOf(this, MiddlewareArray.prototype)
  }

  static get [Symbol.species]() {
    return MiddlewareArray as any
  }

  override concat<AdditionalMiddlewares extends ReadonlyArray<Middleware<any, any>>>(
    items: AdditionalMiddlewares
  ): MiddlewareArray<[...Middlewares, ...AdditionalMiddlewares]>

  override concat<AdditionalMiddlewares extends ReadonlyArray<Middleware<any, any>>>(
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

export type IsAny<T, True, False = never> = true | false extends (T extends never ? true : false) ? True : False

export type IsUnknown<T, True, False = never> = unknown extends T ? IsAny<T, False, True> : False

export type FallbackIfUnknown<T, Fallback> = IsUnknown<T, Fallback, T>

export type IfMaybeUndefined<P, True, False> = [undefined] extends [P] ? True : False

export type IfVoid<P, True, False> = [void] extends [P] ? True : False

export type IsEmptyObj<T, True, False = never> = T extends any
  ? keyof T extends never
    ? IsUnknown<T, False, IfMaybeUndefined<T, False, IfVoid<T, False, True>>>
    : False
  : never

export type AtLeastTS35<True, False> = [True, False][IsUnknown<ReturnType<<T>() => T>, 0, 1>]

export type IsUnknownOrNonInferrable<T, True, False> = AtLeastTS35<
  IsUnknown<T, True, False>,
  IsEmptyObj<T, True, IsUnknown<T, True, False>>
>

export type ExcludeFromTuple<T, E, Acc extends unknown[] = []> = T extends [infer Head, ...infer Tail]
  ? ExcludeFromTuple<Tail, E, [...Acc, ...([Head] extends [E] ? [] : [Head])]>
  : Acc

type ExtractDispatchFromMiddlewareTuple<MiddlewareTuple extends any[], Acc extends {}> = MiddlewareTuple extends [
  infer Head,
  ...infer Tail
]
  ? ExtractDispatchFromMiddlewareTuple<Tail, Acc & (Head extends Middleware<infer D, any> ? IsAny<D, {}, D> : {})>
  : Acc

export type ExtractDispatchExtensions<M> = M extends MiddlewareArray<infer MiddlewareTuple>
  ? ExtractDispatchFromMiddlewareTuple<MiddlewareTuple, {}>
  : M extends Middleware[]
  ? ExtractDispatchFromMiddlewareTuple<[...M], {}>
  : never

export type UnionToIntersection<U> = (U extends unknown ? (k: U) => void : never) extends (k: infer I) => void
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

export const hasMatchFunction = <T>(v: Matcher<T>): v is HasMatchFunction<T> => {
  return v && typeof (v as HasMatchFunction<T>).match === "function"
}

export type Matcher<T> = HasMatchFunction<T> | TypeGuard<T>

export type ActionFromMatcher<M extends Matcher<any>> = M extends Matcher<infer T> ? T : never

export interface ThunkDispatch<State, ExtraThunkArg, BasicAction extends Action> {
  <ReturnType>(thunkAction: ThunkAction<ReturnType, State, ExtraThunkArg, BasicAction>): ReturnType

  <Action extends BasicAction>(action: Action): Action

  <ReturnType, Action extends BasicAction>(
    action: Action | ThunkAction<ReturnType, State, ExtraThunkArg, BasicAction>
  ): Action | ReturnType
}

export type ThunkAction<ReturnType, State, ExtraThunkArg, BasicAction extends Action> = (
  dispatch: ThunkDispatch<State, ExtraThunkArg, BasicAction>,
  getState: () => State,
  extraArgument: ExtraThunkArg
) => ReturnType

export type ThunkActionDispatch<ActionCreator extends (...args: any[]) => ThunkAction<any, any, any, any>> = (
  ...args: Parameters<ActionCreator>
) => ReturnType<ReturnType<ActionCreator>>

export type ThunkMiddleware<
  State = any,
  BasicAction extends Action = AnyAction,
  ExtraThunkArg = undefined
> = Middleware<
  ThunkDispatch<State, ExtraThunkArg, BasicAction>,
  State,
  ThunkDispatch<State, ExtraThunkArg, BasicAction>
>

export interface SerializedError {
  name?: string
  message?: string
  stack?: string
  code?: string
}

export type PayloadAction<P = void, T extends string = string, M = never, E = never> = {
  payload: P
  type: T
} & ([M] extends [never]
  ? {}
  : {
      meta: M
    }) &
  ([E] extends [never]
    ? {}
    : {
        error: E
      })

export type PrepareAction<P> =
  | ((...args: any[]) => { payload: P })
  | ((...args: any[]) => { payload: P; meta: any })
  | ((...args: any[]) => { payload: P; error: any })
  | ((...args: any[]) => { payload: P; meta: any; error: any })
export type _ActionCreatorWithPreparedPayload<
  PA extends PrepareAction<any> | void,
  T extends string = string
> = PA extends PrepareAction<infer P>
  ? ActionCreatorWithPreparedPayload<
      Parameters<PA>,
      P,
      T,
      ReturnType<PA> extends {
        error: infer E
      }
        ? E
        : never,
      ReturnType<PA> extends {
        meta: infer M
      }
        ? M
        : never
    >
  : void

export interface BaseActionCreator<P, T extends string, M = never, E = never> {
  type: T
  match: (action: Action<unknown>) => action is PayloadAction<P, T, M, E>
}

export interface ActionCreatorWithPreparedPayload<
  Args extends unknown[],
  P,
  T extends string = string,
  E = never,
  M = never
> extends BaseActionCreator<P, T, M, E> {
  (...args: Args): PayloadAction<P, T, M, E>
}

export interface ActionCreatorWithOptionalPayload<P, T extends string = string> extends BaseActionCreator<P, T> {
  (payload?: P): PayloadAction<P, T>
}

export interface ActionCreatorWithoutPayload<T extends string = string> extends BaseActionCreator<undefined, T> {
  (): PayloadAction<undefined, T>
}

export interface ActionCreatorWithPayload<P, T extends string = string> extends BaseActionCreator<P, T> {
  (payload: P): PayloadAction<P, T>
}

export interface ActionCreatorWithNonInferrablePayload<T extends string = string>
  extends BaseActionCreator<unknown, T> {
  <PT>(payload: PT): PayloadAction<PT, T>
}

type IfPrepareActionMethodProvided<PA extends PrepareAction<any> | void, True, False> = PA extends (
  ...args: any[]
) => any
  ? True
  : False

export type PayloadActionCreator<
  P = void,
  T extends string = string,
  PA extends PrepareAction<P> | void = void
> = IfPrepareActionMethodProvided<
  PA,
  _ActionCreatorWithPreparedPayload<PA, T>,
  IsAny<
    P,
    ActionCreatorWithPayload<any, T>,
    IsUnknownOrNonInferrable<
      P,
      ActionCreatorWithNonInferrablePayload<T>,
      IfVoid<
        P,
        ActionCreatorWithoutPayload<T>,
        IfMaybeUndefined<P, ActionCreatorWithOptionalPayload<P, T>, ActionCreatorWithPayload<P, T>>
      >
    >
  >
>

export function getType<T extends string>(actionCreator: PayloadActionCreator<any, T>): T {
  return `${actionCreator}` as T
}

type GetState<ThunkApiConfig> = ThunkApiConfig extends {
  state: infer State
}
  ? State
  : unknown
type GetExtra<ThunkApiConfig> = ThunkApiConfig extends { extra: infer Extra } ? Extra : unknown
type GetDispatch<ThunkApiConfig> = ThunkApiConfig extends {
  dispatch: infer Dispatch
}
  ? FallbackIfUnknown<Dispatch, ThunkDispatch<GetState<ThunkApiConfig>, GetExtra<ThunkApiConfig>, AnyAction>>
  : ThunkDispatch<GetState<ThunkApiConfig>, GetExtra<ThunkApiConfig>, AnyAction>

export class RejectWithValue<Payload, RejectedMeta> {
  private readonly _type!: "RejectWithValue"
  constructor(public readonly payload: Payload, public readonly meta: RejectedMeta) {}
}

export class FulfillWithMeta<Payload, FulfilledMeta> {
  private readonly _type!: "FulfillWithMeta"
  constructor(public readonly payload: Payload, public readonly meta: FulfilledMeta) {}
}

export type BaseThunkAPI<
  S,
  E,
  D extends Dispatch = Dispatch,
  RejectedValue = undefined,
  RejectedMeta = unknown,
  FulfilledMeta = unknown
> = {
  dispatch: D
  getState: () => S
  extra: E
  requestId: string
  signal: AbortSignal
  rejectWithValue: IsUnknown<
    RejectedMeta,
    (value: RejectedValue) => RejectWithValue<RejectedValue, RejectedMeta>,
    (value: RejectedValue, meta: RejectedMeta) => RejectWithValue<RejectedValue, RejectedMeta>
  >
  fulfillWithValue: IsUnknown<
    FulfilledMeta,
    <FulfilledValue>(value: FulfilledValue) => FulfillWithMeta<FulfilledValue, FulfilledMeta>,
    <FulfilledValue>(value: FulfilledValue, meta: FulfilledMeta) => FulfillWithMeta<FulfilledValue, FulfilledMeta>
  >
}

export type GetRejectValue<ThunkApiConfig> = ThunkApiConfig extends {
  rejectValue: infer RejectValue
}
  ? RejectValue
  : unknown

export type GetPendingMeta<ThunkApiConfig> = ThunkApiConfig extends {
  pendingMeta: infer PendingMeta
}
  ? PendingMeta
  : unknown

export type GetFulfilledMeta<ThunkApiConfig> = ThunkApiConfig extends {
  fulfilledMeta: infer FulfilledMeta
}
  ? FulfilledMeta
  : unknown

export type GetRejectedMeta<ThunkApiConfig> = ThunkApiConfig extends {
  rejectedMeta: infer RejectedMeta
}
  ? RejectedMeta
  : unknown

export type GetSerializedErrorType<ThunkApiConfig> = ThunkApiConfig extends {
  serializedErrorType: infer GetSerializedErrorType
}
  ? GetSerializedErrorType
  : SerializedError

export type MaybePromise<T> = T | Promise<T> | (T extends any ? Promise<T> : never)

type GetThunkAPI<ThunkApiConfig> = BaseThunkAPI<
  GetState<ThunkApiConfig>,
  GetExtra<ThunkApiConfig>,
  GetDispatch<ThunkApiConfig>,
  GetRejectValue<ThunkApiConfig>,
  GetRejectedMeta<ThunkApiConfig>,
  GetFulfilledMeta<ThunkApiConfig>
>

export type AsyncThunkConfig = {
  state?: unknown
  dispatch?: Dispatch
  extra?: unknown
  rejectValue?: unknown
  serializedErrorType?: unknown
  pendingMeta?: unknown
  fulfilledMeta?: unknown
  rejectedMeta?: unknown
}

export type AsyncThunkAction<Returned, ThunkArg, ThunkApiConfig extends AsyncThunkConfig> = (
  dispatch: GetDispatch<ThunkApiConfig>,
  getState: () => GetState<ThunkApiConfig>,
  extra: GetExtra<ThunkApiConfig>
) => Promise<
  | ReturnType<AsyncThunkFulfilledActionCreator<Returned, ThunkArg>>
  | ReturnType<AsyncThunkRejectedActionCreator<ThunkArg, ThunkApiConfig>>
> & {
  abort: (reason?: string) => void
  requestId: string
  arg: ThunkArg
  unwrap: () => Promise<Returned>
}

export type AsyncThunkPayloadCreatorReturnValue<Returned, ThunkApiConfig extends AsyncThunkConfig> = MaybePromise<
  | IsUnknown<GetFulfilledMeta<ThunkApiConfig>, Returned, FulfillWithMeta<Returned, GetFulfilledMeta<ThunkApiConfig>>>
  | RejectWithValue<GetRejectValue<ThunkApiConfig>, GetRejectedMeta<ThunkApiConfig>>
>

export type AsyncThunkPayloadCreator<Returned, ThunkArg = void, ThunkApiConfig extends AsyncThunkConfig = {}> = (
  arg: ThunkArg,
  thunkAPI: GetThunkAPI<ThunkApiConfig>
) => AsyncThunkPayloadCreatorReturnValue<Returned, ThunkApiConfig>

export type AsyncThunkOptions<ThunkArg = void, ThunkApiConfig extends AsyncThunkConfig = {}> = {
  condition?(
    arg: ThunkArg,
    api: Pick<GetThunkAPI<ThunkApiConfig>, "getState" | "extra">
  ): MaybePromise<boolean | undefined>
  dispatchConditionRejection?: boolean

  serializeError?: (x: unknown) => GetSerializedErrorType<ThunkApiConfig>

  idGenerator?: (arg: ThunkArg) => string
} & IsUnknown<
  GetPendingMeta<ThunkApiConfig>,
  {
    getPendingMeta?(
      base: {
        arg: ThunkArg
        requestId: string
      },
      api: Pick<GetThunkAPI<ThunkApiConfig>, "getState" | "extra">
    ): GetPendingMeta<ThunkApiConfig>
  },
  {
    getPendingMeta(
      base: {
        arg: ThunkArg
        requestId: string
      },
      api: Pick<GetThunkAPI<ThunkApiConfig>, "getState" | "extra">
    ): GetPendingMeta<ThunkApiConfig>
  }
>

type WithStrictNullChecks<True, False> = undefined extends boolean ? False : True

export type AsyncThunkActionCreator<Returned, ThunkArg, ThunkApiConfig extends AsyncThunkConfig> = IsAny<
  ThunkArg,
  (arg: ThunkArg) => AsyncThunkAction<Returned, ThunkArg, ThunkApiConfig>,
  unknown extends ThunkArg
    ? (arg: ThunkArg) => AsyncThunkAction<Returned, ThunkArg, ThunkApiConfig>
    : [ThunkArg] extends [void] | [undefined]
    ? () => AsyncThunkAction<Returned, ThunkArg, ThunkApiConfig>
    : [void] extends [ThunkArg]
    ? (arg?: ThunkArg) => AsyncThunkAction<Returned, ThunkArg, ThunkApiConfig>
    : [undefined] extends [ThunkArg]
    ? WithStrictNullChecks<
        (arg?: ThunkArg) => AsyncThunkAction<Returned, ThunkArg, ThunkApiConfig>,
        (arg: ThunkArg) => AsyncThunkAction<Returned, ThunkArg, ThunkApiConfig>
      >
    : (arg: ThunkArg) => AsyncThunkAction<Returned, ThunkArg, ThunkApiConfig>
>

export type AsyncThunkPendingActionCreator<ThunkArg, ThunkApiConfig = {}> = ActionCreatorWithPreparedPayload<
  [string, ThunkArg, GetPendingMeta<ThunkApiConfig>?],
  undefined,
  string,
  never,
  {
    arg: ThunkArg
    requestId: string
    requestStatus: "pending"
  } & GetPendingMeta<ThunkApiConfig>
>

export type AsyncThunkRejectedActionCreator<ThunkArg, ThunkApiConfig = {}> = ActionCreatorWithPreparedPayload<
  [Error | null, string, ThunkArg, GetRejectValue<ThunkApiConfig>?, GetRejectedMeta<ThunkApiConfig>?],
  GetRejectValue<ThunkApiConfig> | undefined,
  string,
  GetSerializedErrorType<ThunkApiConfig>,
  {
    arg: ThunkArg
    requestId: string
    requestStatus: "rejected"
    aborted: boolean
    condition: boolean
  } & (
    | ({ rejectedWithValue: false } & {
        [K in keyof GetRejectedMeta<ThunkApiConfig>]?: undefined
      })
    | ({ rejectedWithValue: true } & GetRejectedMeta<ThunkApiConfig>)
  )
>

export type AsyncThunkFulfilledActionCreator<
  Returned,
  ThunkArg,
  ThunkApiConfig = {}
> = ActionCreatorWithPreparedPayload<
  [Returned, string, ThunkArg, GetFulfilledMeta<ThunkApiConfig>?],
  Returned,
  string,
  never,
  {
    arg: ThunkArg
    requestId: string
    requestStatus: "fulfilled"
  } & GetFulfilledMeta<ThunkApiConfig>
>

export type AsyncThunk<Returned, ThunkArg, ThunkApiConfig extends AsyncThunkConfig> = AsyncThunkActionCreator<
  Returned,
  ThunkArg,
  ThunkApiConfig
> & {
  pending: AsyncThunkPendingActionCreator<ThunkArg, ThunkApiConfig>
  rejected: AsyncThunkRejectedActionCreator<ThunkArg, ThunkApiConfig>
  fulfilled: AsyncThunkFulfilledActionCreator<Returned, ThunkArg, ThunkApiConfig>
  typePrefix: string
}

export type Selector<State = any, Result = unknown, Params extends never | readonly any[] = any[]> = [Params] extends [
  never
]
  ? (state: State) => Result
  : (state: State, ...params: Params) => Result

export interface OutputSelectorFields<Combiner extends UnknownFunction> {
  resultFunc: Combiner
  memoizedResultFunc: Combiner
  lastResult: () => ReturnType<Combiner>
  dependencies: SelectorArray
  recomputations: () => number
  resetRecomputations: () => number
}

export type OutputSelector<
  S extends SelectorArray,
  Result,
  Combiner extends UnknownFunction,
  Params extends readonly any[] = never // MergeParameters<S>
> = Selector<GetStateFromSelectors<S>, Result, Params> & OutputSelectorFields<Combiner>

export type ParametricSelector<State, Props, Result> = Selector<State, Result, [Props, ...any]>

export type OutputParametricSelector<State, Props, Result, Combiner extends UnknownFunction> = ParametricSelector<
  State,
  Props,
  Result
> &
  OutputSelectorFields<Combiner>

export type SelectorArray = ReadonlyArray<Selector>

export type EqualityFn = (a: any, b: any) => boolean

export type SelectorResultArray<Selectors extends SelectorArray> = ExtractReturnType<Selectors>

export type GetStateFromSelectors<S extends SelectorArray> = MergeParameters<S>[0]

export type GetParamsFromSelectors<
  S extends SelectorArray,
  RemainingItems extends readonly unknown[] = Tail<MergeParameters<S>>
> = RemainingItems

export type MergeParameters<
  T extends readonly UnknownFunction[],
  ParamsArrays extends readonly any[][] = ExtractParams<T>,
  TransposedArrays = Transpose<ParamsArrays>,
  TuplifiedArrays extends any[] = TuplifyUnion<TransposedArrays>,
  LongestParamsArray extends readonly any[] = LongestArray<TuplifiedArrays>
> = ExpandItems<
  RemoveNames<{
    [index in keyof LongestParamsArray]: LongestParamsArray[index] extends LongestParamsArray[number]
      ? IgnoreInvalidIntersections<IntersectAll<LongestParamsArray[index]>>
      : never
  }>
>

export type UnknownFunction = (...args: any[]) => any

type IgnoreInvalidIntersections<T> = T extends EmptyObject ? never : T

export type ExtractParams<T extends readonly UnknownFunction[]> = {
  [index in keyof T]: T[index] extends T[number] ? Parameters<T[index]> : never
}

export type ExtractReturnType<T extends readonly UnknownFunction[]> = {
  [index in keyof T]: T[index] extends T[number] ? ReturnType<T[index]> : never
}

export type ExpandItems<T extends readonly unknown[]> = {
  [index in keyof T]: T[index] extends T[number] ? Expand<T[index]> : never
}

export type Head<T> = T extends [any, ...any[]] ? T[0] : never
export type Tail<A> = A extends [any, ...infer Rest] ? Rest : never

export type AllArrayKeys<A extends readonly any[]> = A extends any
  ? {
      [K in keyof A]: K
    }[number]
  : never

export type List<A = any> = ReadonlyArray<A>

export type Has<U, U1> = [U1] extends [U] ? 1 : 0

export type Longest<L extends List, L1 extends List> = L extends unknown
  ? L1 extends unknown
    ? { 0: L1; 1: L }[Has<keyof L, keyof L1>]
    : never
  : never

export type LongestArray<S extends readonly any[][]> = IsTuple<S> extends "0"
  ? S[0]
  : S extends [any[], any[]]
  ? Longest<S[0], S[1]>
  : S extends [any[], any[], ...infer Rest]
  ? Longest<Longest<S[0], S[1]>, Rest extends any[][] ? LongestArray<Rest> : []>
  : S extends [any[]]
  ? S[0]
  : never

export type IntersectAll<T extends any[]> = IsTuple<T> extends "0" ? T[0] : _IntersectAll<T>

type IfJustNullish<T, True, False> = [T] extends [undefined | null] ? True : False

type _IntersectAll<T, R = unknown> = T extends [infer First, ...infer Rest]
  ? _IntersectAll<Rest, IfJustNullish<First, R, R & First>>
  : R

type RemoveNames<T extends readonly any[]> = [any, ...T] extends [any, ...infer U] ? U : never

export type Bool = "0" | "1"
export type Obj<T> = { [k: string]: T }
export type And<A extends Bool, B extends Bool> = ({
  1: { 1: "1" } & Obj<"0">
} & Obj<Obj<"0">>)[A][B]

export type Matches<V, T> = V extends T ? "1" : "0"
export type IsArrayType<T> = Matches<T, any[]>

export type Not<T extends Bool> = { "1": "0"; "0": "1" }[T]
export type InstanceOf<V, T> = And<Matches<V, T>, Not<Matches<T, V>>>
export type IsTuple<T extends { length: number }> = And<IsArrayType<T>, InstanceOf<T["length"], number>>

type Push<T extends any[], V> = [...T, V]

type LastOf<T> = UnionToIntersection<T extends any ? () => T : never> extends () => infer R ? R : never

type TuplifyUnion<T, L = LastOf<T>, N = [T] extends [never] ? true : false> = true extends N
  ? []
  : Push<TuplifyUnion<Exclude<T, L>>, L>

export type ObjValueTuple<T, KS extends any[] = TuplifyUnion<keyof T>, R extends any[] = []> = KS extends [
  infer K,
  ...infer KT
]
  ? ObjValueTuple<T, KT, [...R, T[K & keyof T]]>
  : R

type Transpose<T> = T[Extract<keyof T, T extends readonly any[] ? number : unknown>] extends infer V
  ? {
      [K in keyof V]: {
        [L in keyof T]: K extends keyof T[L] ? T[L][K] : undefined
      }
    }
  : never

export type DropFirst<T extends unknown[]> = T extends [unknown, ...infer U] ? U : never

export type Expand<T> = T extends (...args: infer A) => infer R
  ? (...args: Expand<A>) => Expand<R>
  : T extends infer O
  ? { [K in keyof O]: O[K] }
  : never

export type ExpandRecursively<T> = T extends (...args: infer A) => infer R
  ? (...args: ExpandRecursively<A>) => ExpandRecursively<R>
  : T extends object
  ? T extends infer O
    ? { [K in keyof O]: ExpandRecursively<O[K]> }
    : never
  : T

type Identity<T> = T

export type Mapped<T> = Identity<{ [k in keyof T]: T[k] }>

export type ComputeDeep<A, Seen = never> = A extends BuiltIn
  ? A
  : If2<
      Has<Seen, A>,
      A,
      A extends Array<any>
        ? A extends Array<Record<Key, any>>
          ? Array<
              {
                [K in keyof A[number]]: ComputeDeep<A[number][K], A | Seen>
              } & unknown
            >
          : A
        : A extends ReadonlyArray<any>
        ? A extends ReadonlyArray<Record<Key, any>>
          ? ReadonlyArray<
              {
                [K in keyof A[number]]: ComputeDeep<A[number][K], A | Seen>
              } & unknown
            >
          : A
        : { [K in keyof A]: ComputeDeep<A[K], A | Seen> } & unknown
    >

export type If2<B extends Boolean2, Then, Else = never> = B extends 1 ? Then : Else

export type Boolean2 = 0 | 1

export type Key = string | number | symbol

export type BuiltIn = Function | Error | Date | { readonly [Symbol.toStringTag]: string } | RegExp | Generator

export type MatchFunction<T> = (v: any) => v is T

export interface TypedActionCreator<Type extends string> {
  (...args: any[]): Action<Type>
  type: Type
  match: MatchFunction<any>
}
