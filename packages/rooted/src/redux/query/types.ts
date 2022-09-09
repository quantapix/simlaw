/* eslint-disable @typescript-eslint/ban-types */
import type * as qt from "../types.js"
import type * as qi from "../../immer/index.js"

export * from "../types.js"

export type QueryCacheKey = string & { _type: "queryCacheKey" }
export type QuerySubstateIdentifier = { queryCacheKey: QueryCacheKey }
export type MutationSubstateIdentifier =
  | {
      requestId: string
      fixedCacheKey?: string
    }
  | {
      requestId?: string
      fixedCacheKey: string
    }

export type RefetchConfigOptions = {
  refetchOnMountOrArgChange: boolean | number
  refetchOnReconnect: boolean
  refetchOnFocus: boolean
}

export enum QueryStatus {
  uninitialized = "uninitialized",
  pending = "pending",
  fulfilled = "fulfilled",
  rejected = "rejected",
}

export type RequestStatusFlags =
  | {
      status: QueryStatus.uninitialized
      isUninitialized: true
      isLoading: false
      isSuccess: false
      isError: false
    }
  | {
      status: QueryStatus.pending
      isUninitialized: false
      isLoading: true
      isSuccess: false
      isError: false
    }
  | {
      status: QueryStatus.fulfilled
      isUninitialized: false
      isLoading: false
      isSuccess: true
      isError: false
    }
  | {
      status: QueryStatus.rejected
      isUninitialized: false
      isLoading: false
      isSuccess: false
      isError: true
    }

export function getRequestStatusFlags(status: QueryStatus): RequestStatusFlags {
  return {
    status,
    isUninitialized: status === QueryStatus.uninitialized,
    isLoading: status === QueryStatus.pending,
    isSuccess: status === QueryStatus.fulfilled,
    isError: status === QueryStatus.rejected,
  } as any
}

export type SubscriptionOptions = {
  pollingInterval?: number
  refetchOnReconnect?: boolean
  refetchOnFocus?: boolean
}

export type Subscribers = { [requestId: string]: SubscriptionOptions }
export type QueryKeys<Definitions extends EndpointDefinitions> = {
  [K in keyof Definitions]: Definitions[K] extends QueryDefinition<
    any,
    any,
    any,
    any
  >
    ? K
    : never
}[keyof Definitions]

export type MutationKeys<Definitions extends EndpointDefinitions> = {
  [K in keyof Definitions]: Definitions[K] extends MutationDefinition<
    any,
    any,
    any,
    any
  >
    ? K
    : never
}[keyof Definitions]

type BaseQuerySubState<D extends BaseEndpointDefinition<any, any, any>> = {
  originalArgs: QueryArgFrom<D>
  requestId: string
  data?: ResultTypeFrom<D>
  error?:
    | qt.SerializedError
    | (D extends QueryDefinition<any, infer BaseQuery, any, any>
        ? BaseQueryError<BaseQuery>
        : never)
  endpointName: string
  startedTimeStamp: number
  fulfilledTimeStamp?: number
}

export type QuerySubState<D extends BaseEndpointDefinition<any, any, any>> = Id<
  | ({
      status: QueryStatus.fulfilled
    } & WithRequiredProp<
      BaseQuerySubState<D>,
      "data" | "fulfilledTimeStamp"
    > & { error: undefined })
  | ({
      status: QueryStatus.pending
    } & BaseQuerySubState<D>)
  | ({
      status: QueryStatus.rejected
    } & WithRequiredProp<BaseQuerySubState<D>, "error">)
  | {
      status: QueryStatus.uninitialized
      originalArgs?: undefined
      data?: undefined
      error?: undefined
      requestId?: undefined
      endpointName?: string
      startedTimeStamp?: undefined
      fulfilledTimeStamp?: undefined
    }
>

export type QueryResultSelectorResult<
  Definition extends QueryDefinition<any, any, any, any>
> = QuerySubState<Definition> & RequestStatusFlags

type BaseMutationSubState<D extends BaseEndpointDefinition<any, any, any>> = {
  requestId: string
  data?: ResultTypeFrom<D>
  error?:
    | qt.SerializedError
    | (D extends MutationDefinition<any, infer BaseQuery, any, any>
        ? BaseQueryError<BaseQuery>
        : never)
  endpointName: string
  startedTimeStamp: number
  fulfilledTimeStamp?: number
}

export type MutationSubState<D extends BaseEndpointDefinition<any, any, any>> =
  | (({
      status: QueryStatus.fulfilled
    } & WithRequiredProp<
      BaseMutationSubState<D>,
      "data" | "fulfilledTimeStamp"
    >) & { error: undefined })
  | (({
      status: QueryStatus.pending
    } & BaseMutationSubState<D>) & { data?: undefined })
  | ({
      status: QueryStatus.rejected
    } & WithRequiredProp<BaseMutationSubState<D>, "error">)
  | {
      requestId?: undefined
      status: QueryStatus.uninitialized
      data?: undefined
      error?: undefined
      endpointName?: string
      startedTimeStamp?: undefined
      fulfilledTimeStamp?: undefined
    }

export type MutationResultSelectorResult<
  Definition extends MutationDefinition<any, any, any, any>
> = MutationSubState<Definition> & RequestStatusFlags

export type CombinedState<
  D extends EndpointDefinitions,
  E extends string,
  ReducerPath extends string
> = {
  queries: QueryState<D>
  mutations: MutationState<D>
  provided: InvalidationState<E>
  subscriptions: SubscriptionState
  config: ConfigState<ReducerPath>
}

export type InvalidationState<TagTypes extends string> = {
  [_ in TagTypes]: {
    [id: string]: Array<QueryCacheKey>
    [id: number]: Array<QueryCacheKey>
  }
}

export type QueryState<D extends EndpointDefinitions> = {
  [queryCacheKey: string]: QuerySubState<D[string]> | undefined
}

export type SubscriptionState = {
  [queryCacheKey: string]: Subscribers | undefined
}

export type ConfigState<ReducerPath> = RefetchConfigOptions & {
  reducerPath: ReducerPath
  online: boolean
  focused: boolean
  middlewareRegistered: boolean | "conflict"
} & ModifiableConfigState

export type ModifiableConfigState = {
  keepUnusedDataFor: number
} & RefetchConfigOptions

export type MutationState<D extends EndpointDefinitions> = {
  [requestId: string]: MutationSubState<D[string]> | undefined
}

export type RootState<
  Definitions extends EndpointDefinitions,
  TagTypes extends string,
  ReducerPath extends string
> = {
  [P in ReducerPath]: CombinedState<Definitions, TagTypes, P>
}

const _NEVER = Symbol()
export type NEVER = typeof _NEVER

export type Id<T> = { [K in keyof T]: T[K] } & {}
export type WithRequiredProp<T, K extends keyof T> = Omit<T, K> &
  Required<Pick<T, K>>
export type Override<T1, T2> = T2 extends any ? Omit<T1, keyof T2> & T2 : never
export function assertCast<T>(v: any): asserts v is T {
  v
}

export function safeAssign<T extends object>(
  target: T,
  ...args: Array<Partial<NoInfer<T>>>
) {
  Object.assign(target, ...args)
}

export type UnionToIntersection<U> = (
  U extends any ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never

export type NonOptionalKeys<T> = {
  [K in keyof T]-?: undefined extends T[K] ? never : K
}[keyof T]

export type HasRequiredProps<T, True, False> = NonOptionalKeys<T> extends never
  ? False
  : True

export type OptionalIfAllPropsOptional<T> = HasRequiredProps<T, T, T | never>

export type NoInfer<T> = [T][T extends any ? 0 : never]

export type UnwrapPromise<T> = T extends PromiseLike<infer V> ? V : T

export type MaybePromise<T> = T | PromiseLike<T>

export type OmitFromUnion<T, K extends keyof T> = T extends any
  ? Omit<T, K>
  : never

export type IsAny<T, True, False = never> = true | false extends (
  T extends never ? true : false
)
  ? True
  : False

export type CastAny<T, CastTo> = IsAny<T, CastTo, T>

export interface BaseQueryApi {
  signal: AbortSignal
  dispatch: qt.ThunkDispatch<any, any, any>
  getState: () => unknown
  extra: unknown
  endpoint: string
  type: "query" | "mutation"
  forced?: boolean
}

export type QueryReturnValue<T = unknown, E = unknown, M = unknown> =
  | {
      error: E
      data?: undefined
      meta?: M
    }
  | {
      error?: undefined
      data: T
      meta?: M
    }

export type BaseQueryFn<
  Args = any,
  Result = unknown,
  Error = unknown,
  DefinitionExtraOptions = {},
  Meta = {}
> = (
  args: Args,
  api: BaseQueryApi,
  extraOptions: DefinitionExtraOptions
) => MaybePromise<QueryReturnValue<Result, Error, Meta>>

export type BaseQueryEnhancer<
  AdditionalArgs = unknown,
  AdditionalDefinitionExtraOptions = unknown,
  Config = void
> = <BaseQuery extends BaseQueryFn>(
  baseQuery: BaseQuery,
  config: Config
) => BaseQueryFn<
  BaseQueryArg<BaseQuery> & AdditionalArgs,
  BaseQueryResult<BaseQuery>,
  BaseQueryError<BaseQuery>,
  BaseQueryExtraOptions<BaseQuery> & AdditionalDefinitionExtraOptions,
  NonNullable<BaseQueryMeta<BaseQuery>>
>

export type BaseQueryResult<BaseQuery extends BaseQueryFn> = UnwrapPromise<
  ReturnType<BaseQuery>
> extends infer Unwrapped
  ? Unwrapped extends { data: any }
    ? Unwrapped["data"]
    : never
  : never

export type BaseQueryMeta<BaseQuery extends BaseQueryFn> = UnwrapPromise<
  ReturnType<BaseQuery>
>["meta"]

export type BaseQueryError<BaseQuery extends BaseQueryFn> = Exclude<
  UnwrapPromise<ReturnType<BaseQuery>>,
  { error?: undefined }
>["error"]

export type BaseQueryArg<T extends (arg: any, ...args: any[]) => any> =
  T extends (arg: infer A, ...args: any[]) => any ? A : any

export type BaseQueryExtraOptions<BaseQuery extends BaseQueryFn> =
  Parameters<BaseQuery>[2]

const resultType = Symbol()
const baseQuery = Symbol()

interface EndpointDefinitionWithQuery<
  QueryArg,
  BaseQuery extends BaseQueryFn,
  ResultType
> {
  query(arg: QueryArg): BaseQueryArg<BaseQuery>
  queryFn?: never
  transformResponse?(
    baseQueryReturnValue: BaseQueryResult<BaseQuery>,
    meta: BaseQueryMeta<BaseQuery>,
    arg: QueryArg
  ): ResultType | Promise<ResultType>
  structuralSharing?: boolean
}

interface EndpointDefinitionWithQueryFn<
  QueryArg,
  BaseQuery extends BaseQueryFn,
  ResultType
> {
  queryFn(
    arg: QueryArg,
    api: BaseQueryApi,
    extraOptions: BaseQueryExtraOptions<BaseQuery>,
    baseQuery: (arg: Parameters<BaseQuery>[0]) => ReturnType<BaseQuery>
  ): MaybePromise<QueryReturnValue<ResultType, BaseQueryError<BaseQuery>>>
  query?: never
  transformResponse?: never
  structuralSharing?: boolean
}

export type BaseEndpointDefinition<
  QueryArg,
  BaseQuery extends BaseQueryFn,
  ResultType
> = (
  | ([CastAny<BaseQueryResult<BaseQuery>, {}>] extends [NEVER]
      ? never
      : EndpointDefinitionWithQuery<QueryArg, BaseQuery, ResultType>)
  | EndpointDefinitionWithQueryFn<QueryArg, BaseQuery, ResultType>
) & {
  [resultType]?: ResultType
  [baseQuery]?: BaseQuery
} & HasRequiredProps<
    BaseQueryExtraOptions<BaseQuery>,
    { extraOptions: BaseQueryExtraOptions<BaseQuery> },
    { extraOptions?: BaseQueryExtraOptions<BaseQuery> }
  >

export enum DefinitionType {
  query = "query",
  mutation = "mutation",
}

export type GetResultDescriptionFn<
  TagTypes extends string,
  ResultType,
  QueryArg,
  ErrorType,
  MetaType
> = (
  result: ResultType | undefined,
  error: ErrorType | undefined,
  arg: QueryArg,
  meta: MetaType
) => ReadonlyArray<TagDescription<TagTypes>>

export type FullTagDescription<TagType> = {
  type: TagType
  id?: number | string
}
export type TagDescription<TagType> = TagType | FullTagDescription<TagType>
export type ResultDescription<
  TagTypes extends string,
  ResultType,
  QueryArg,
  ErrorType,
  MetaType
> =
  | ReadonlyArray<TagDescription<TagTypes>>
  | GetResultDescriptionFn<TagTypes, ResultType, QueryArg, ErrorType, MetaType>

/** @deprecated please use `onQueryStarted` instead */
export interface QueryApi<ReducerPath extends string, Context extends {}> {
  dispatch: qt.ThunkDispatch<any, any, qt.AnyAction>
  getState(): RootState<any, any, ReducerPath>
  extra: unknown
  requestId: string
  context: Context
}

export interface QueryExtraOptions<
  TagTypes extends string,
  ResultType,
  QueryArg,
  BaseQuery extends BaseQueryFn,
  ReducerPath extends string = string
> {
  type: DefinitionType.query
  providesTags?: ResultDescription<
    TagTypes,
    ResultType,
    QueryArg,
    BaseQueryError<BaseQuery>,
    BaseQueryMeta<BaseQuery>
  >
  invalidatesTags?: never
  keepUnusedDataFor?: number
  onQueryStarted?(
    arg: QueryArg,
    api: QueryLifecycleApi<QueryArg, BaseQuery, ResultType, ReducerPath>
  ): Promise<void> | void
  onCacheEntryAdded?(
    arg: QueryArg,
    api: QueryCacheLifecycleApi<QueryArg, BaseQuery, ResultType, ReducerPath>
  ): Promise<void> | void
}

export type QueryDefinition<
  QueryArg,
  BaseQuery extends BaseQueryFn,
  TagTypes extends string,
  ResultType,
  ReducerPath extends string = string
> = BaseEndpointDefinition<QueryArg, BaseQuery, ResultType> &
  QueryExtraOptions<TagTypes, ResultType, QueryArg, BaseQuery, ReducerPath>

export interface MutationExtraOptions<
  TagTypes extends string,
  ResultType,
  QueryArg,
  BaseQuery extends BaseQueryFn,
  ReducerPath extends string = string
> {
  type: DefinitionType.mutation
  invalidatesTags?: ResultDescription<
    TagTypes,
    ResultType,
    QueryArg,
    BaseQueryError<BaseQuery>,
    BaseQueryMeta<BaseQuery>
  >
  providesTags?: never
  onQueryStarted?(
    arg: QueryArg,
    api: MutationLifecycleApi<QueryArg, BaseQuery, ResultType, ReducerPath>
  ): Promise<void> | void
  onCacheEntryAdded?(
    arg: QueryArg,
    api: MutationCacheLifecycleApi<QueryArg, BaseQuery, ResultType, ReducerPath>
  ): Promise<void> | void
}

export type PatchCollection = {
  patches: qi.Patch[]
  inversePatches: qi.Patch[]
  undo: () => void
}

export type MaybeDrafted<T> = T | qi.Draft<T>
export type Recipe<T> = (data: MaybeDrafted<T>) => void | MaybeDrafted<T>

export interface QueryBaseLifecycleApi<
  QueryArg,
  BaseQuery extends BaseQueryFn,
  ResultType,
  ReducerPath extends string = string
> extends LifecycleApi<ReducerPath> {
  getCacheEntry(): QueryResultSelectorResult<
    { type: DefinitionType.query } & BaseEndpointDefinition<
      QueryArg,
      BaseQuery,
      ResultType
    >
  >
  updateCachedData(updateRecipe: Recipe<ResultType>): PatchCollection
}

export interface MutationBaseLifecycleApi<
  QueryArg,
  BaseQuery extends BaseQueryFn,
  ResultType,
  ReducerPath extends string = string
> extends LifecycleApi<ReducerPath> {
  getCacheEntry(): MutationResultSelectorResult<
    { type: DefinitionType.mutation } & BaseEndpointDefinition<
      QueryArg,
      BaseQuery,
      ResultType
    >
  >
}

export interface LifecycleApi<ReducerPath extends string = string> {
  dispatch: qt.ThunkDispatch<any, any, qt.AnyAction>
  getState(): RootState<any, any, ReducerPath>
  extra: unknown
  requestId: string
}

export interface CacheLifecyclePromises<
  ResultType = unknown,
  MetaType = unknown
> {
  cacheDataLoaded: PromiseWithKnownReason<
    {
      data: ResultType
      meta: MetaType
    },
    typeof neverResolvedError
  >
  cacheEntryRemoved: Promise<void>
}

export interface QueryCacheLifecycleApi<
  QueryArg,
  BaseQuery extends BaseQueryFn,
  ResultType,
  ReducerPath extends string = string
> extends QueryBaseLifecycleApi<QueryArg, BaseQuery, ResultType, ReducerPath>,
    CacheLifecyclePromises<ResultType, BaseQueryMeta<BaseQuery>> {}

export interface MutationCacheLifecycleApi<
  QueryArg,
  BaseQuery extends BaseQueryFn,
  ResultType,
  ReducerPath extends string = string
> extends MutationBaseLifecycleApi<
      QueryArg,
      BaseQuery,
      ResultType,
      ReducerPath
    >,
    CacheLifecyclePromises<ResultType, BaseQueryMeta<BaseQuery>> {}

export interface QueryLifecyclePromises<
  ResultType,
  BaseQuery extends BaseQueryFn
> {
  queryFulfilled: PromiseWithKnownReason<
    {
      data: ResultType
      meta: BaseQueryMeta<BaseQuery>
    },
    QueryFulfilledRejectionReason<BaseQuery>
  >
}
type QueryFulfilledRejectionReason<BaseQuery extends BaseQueryFn> =
  | {
      error: BaseQueryError<BaseQuery>
      isUnhandledError: false
      meta: BaseQueryMeta<BaseQuery>
    }
  | {
      error: unknown
      meta?: undefined
      isUnhandledError: true
    }
export interface QueryLifecycleApi<
  QueryArg,
  BaseQuery extends BaseQueryFn,
  ResultType,
  ReducerPath extends string = string
> extends QueryBaseLifecycleApi<QueryArg, BaseQuery, ResultType, ReducerPath>,
    QueryLifecyclePromises<ResultType, BaseQuery> {}
export interface MutationLifecycleApi<
  QueryArg,
  BaseQuery extends BaseQueryFn,
  ResultType,
  ReducerPath extends string = string
> extends MutationBaseLifecycleApi<
      QueryArg,
      BaseQuery,
      ResultType,
      ReducerPath
    >,
    QueryLifecyclePromises<ResultType, BaseQuery> {}

export type MutationDefinition<
  QueryArg,
  BaseQuery extends BaseQueryFn,
  TagTypes extends string,
  ResultType,
  ReducerPath extends string = string
> = BaseEndpointDefinition<QueryArg, BaseQuery, ResultType> &
  MutationExtraOptions<TagTypes, ResultType, QueryArg, BaseQuery, ReducerPath>

export type EndpointDefinition<
  QueryArg,
  BaseQuery extends BaseQueryFn,
  TagTypes extends string,
  ResultType,
  ReducerPath extends string = string
> =
  | QueryDefinition<QueryArg, BaseQuery, TagTypes, ResultType, ReducerPath>
  | MutationDefinition<QueryArg, BaseQuery, TagTypes, ResultType, ReducerPath>

export type EndpointDefinitions = Record<
  string,
  EndpointDefinition<any, any, any, any>
>

export function isQueryDefinition(
  e: EndpointDefinition<any, any, any, any>
): e is QueryDefinition<any, any, any, any> {
  return e.type === DefinitionType.query
}

export function isMutationDefinition(
  e: EndpointDefinition<any, any, any, any>
): e is MutationDefinition<any, any, any, any> {
  return e.type === DefinitionType.mutation
}

export type EndpointBuilder<
  BaseQuery extends BaseQueryFn,
  TagTypes extends string,
  ReducerPath extends string
> = {
  query<ResultType, QueryArg>(
    definition: OmitFromUnion<
      QueryDefinition<QueryArg, BaseQuery, TagTypes, ResultType, ReducerPath>,
      "type"
    >
  ): QueryDefinition<QueryArg, BaseQuery, TagTypes, ResultType, ReducerPath>
  mutation<ResultType, QueryArg>(
    definition: OmitFromUnion<
      MutationDefinition<
        QueryArg,
        BaseQuery,
        TagTypes,
        ResultType,
        ReducerPath
      >,
      "type"
    >
  ): MutationDefinition<QueryArg, BaseQuery, TagTypes, ResultType, ReducerPath>
}

export type AssertTagTypes = <T extends FullTagDescription<string>>(t: T) => T

export function calculateProvidedBy<ResultType, QueryArg, ErrorType, MetaType>(
  description:
    | ResultDescription<string, ResultType, QueryArg, ErrorType, MetaType>
    | undefined,
  result: ResultType | undefined,
  error: ErrorType | undefined,
  queryArg: QueryArg,
  meta: MetaType | undefined,
  assertTagTypes: AssertTagTypes
): readonly FullTagDescription<string>[] {
  if (isFunction(description)) {
    return description(
      result as ResultType,
      error as undefined,
      queryArg,
      meta as MetaType
    )
      .map(expandTagDescription)
      .map(assertTagTypes)
  }
  if (Array.isArray(description)) {
    return description.map(expandTagDescription).map(assertTagTypes)
  }
  return []
}

function isFunction<T>(t: T): t is Extract<T, Function> {
  return typeof t === "function"
}

export function expandTagDescription(
  description: TagDescription<string>
): FullTagDescription<string> {
  return typeof description === "string" ? { type: description } : description
}

export type QueryArgFrom<D extends BaseEndpointDefinition<any, any, any>> =
  D extends BaseEndpointDefinition<infer QA, any, any> ? QA : unknown
export type ResultTypeFrom<D extends BaseEndpointDefinition<any, any, any>> =
  D extends BaseEndpointDefinition<any, any, infer RT> ? RT : unknown

export type ReducerPathFrom<
  D extends EndpointDefinition<any, any, any, any, any>
> = D extends EndpointDefinition<any, any, any, any, infer RP> ? RP : unknown

export type TagTypesFrom<D extends EndpointDefinition<any, any, any, any>> =
  D extends EndpointDefinition<any, any, infer RP, any> ? RP : unknown

export type ReplaceTagTypes<
  Definitions extends EndpointDefinitions,
  NewTagTypes extends string
> = {
  [K in keyof Definitions]: Definitions[K] extends QueryDefinition<
    infer QueryArg,
    infer BaseQuery,
    any,
    infer ResultType,
    infer ReducerPath
  >
    ? QueryDefinition<QueryArg, BaseQuery, NewTagTypes, ResultType, ReducerPath>
    : Definitions[K] extends MutationDefinition<
        infer QueryArg,
        infer BaseQuery,
        any,
        infer ResultType,
        infer ReducerPath
      >
    ? MutationDefinition<
        QueryArg,
        BaseQuery,
        NewTagTypes,
        ResultType,
        ReducerPath
      >
    : never
}

export class HandledError {
  constructor(
    public readonly value: any,
    public readonly meta: any = undefined
  ) {}
}

export type SerializeQueryArgs<QueryArgs> = (_: {
  queryArgs: QueryArgs
  endpointDefinition: EndpointDefinition<any, any, any, any>
  endpointName: string
}) => string

export type InternalSerializeQueryArgs = (_: {
  queryArgs: any
  endpointDefinition: EndpointDefinition<any, any, any, any>
  endpointName: string
}) => QueryCacheKey

export interface PromiseConstructorWithKnownReason {
  new <T, R>(
    executor: (
      resolve: (value: T | PromiseLike<T>) => void,
      reject: (reason?: R) => void
    ) => void
  ): PromiseWithKnownReason<T, R>
}
export interface PromiseWithKnownReason<T, R>
  extends Omit<Promise<T>, "then" | "catch"> {
  then<TResult1 = T, TResult2 = never>(
    onfulfilled?:
      | ((value: T) => TResult1 | PromiseLike<TResult1>)
      | undefined
      | null,
    onrejected?:
      | ((reason: R) => TResult2 | PromiseLike<TResult2>)
      | undefined
      | null
  ): Promise<TResult1 | TResult2>
  catch<TResult = never>(
    onrejected?:
      | ((reason: R) => TResult | PromiseLike<TResult>)
      | undefined
      | null
  ): Promise<T | TResult>
}

const neverResolvedError = new Error(
  "Promise never resolved before cacheEntryRemoved."
) as Error & {
  message: "Promise never resolved before cacheEntryRemoved."
}

export type MutationStateSelector<
  R extends Record<string, any>,
  D extends MutationDefinition<any, any, any, any>
> = (state: MutationResultSelectorResult<D>) => R
export type UseMutationStateOptions<
  D extends MutationDefinition<any, any, any, any>,
  R extends Record<string, any>
> = {
  selectFromResult?: MutationStateSelector<R, D>
  fixedCacheKey?: string
}
export type UseMutationStateResult<
  D extends MutationDefinition<any, any, any, any>,
  R
> = NoInfer<R> & {
  originalArgs?: QueryArgFrom<D>
  reset: () => void
}

export type MutationActionCreatorResult<
  D extends MutationDefinition<any, any, any, any>
> = Promise<
  | { data: ResultTypeFrom<D> }
  | {
      error:
        | Exclude<
            BaseQueryError<
              D extends MutationDefinition<any, infer BaseQuery, any, any>
                ? BaseQuery
                : never
            >,
            undefined
          >
        | qt.SerializedError
    }
> & {
  arg: {
    endpointName: string
    originalArgs: QueryArgFrom<D>
    track?: boolean
    fixedCacheKey?: string
  }
  requestId: string
  abort(): void
  unwrap(): Promise<ResultTypeFrom<D>>
  reset(): void
  /** @deprecated has been renamed to `reset` */
  unsubscribe(): void
}

export type MutationTrigger<D extends MutationDefinition<any, any, any, any>> =
  {
    (arg: QueryArgFrom<D>): MutationActionCreatorResult<D>
  }
export type UseMutation<D extends MutationDefinition<any, any, any, any>> = <
  R extends Record<string, any> = MutationResultSelectorResult<D>
>(
  options?: UseMutationStateOptions<D, R>
) => readonly [MutationTrigger<D>, UseMutationStateResult<D, R>]
interface UseQuerySubscriptionOptions extends SubscriptionOptions {
  skip?: boolean
  refetchOnMountOrArgChange?: boolean | number
}
export type SkipToken = typeof skipToken
export const skipToken = Symbol.for("RTKQ/skipToken")
/** @deprecated renamed to `skipToken` */
export const skipSelector = skipToken

export type UseQuerySubscription<
  D extends QueryDefinition<any, any, any, any>
> = (
  arg: QueryArgFrom<D> | SkipToken,
  options?: UseQuerySubscriptionOptions
) => UseQuerySubscriptionResult<D>
export type QueryActionCreatorResult<
  D extends QueryDefinition<any, any, any, any>
> = Promise<QueryResultSelectorResult<D>> & {
  arg: QueryArgFrom<D>
  requestId: string
  subscriptionOptions: SubscriptionOptions | undefined
  abort(): void
  unwrap(): Promise<ResultTypeFrom<D>>
  unsubscribe(): void
  refetch(): void
  updateSubscriptionOptions(options: SubscriptionOptions): void
  queryCacheKey: string
}

type UseQueryStateBaseResult<D extends QueryDefinition<any, any, any, any>> =
  QuerySubState<D> & {
    currentData?: ResultTypeFrom<D>
    isUninitialized: false
    isLoading: false
    isFetching: false
    isSuccess: false
    isError: false
  }

type UseQueryStateDefaultResult<D extends QueryDefinition<any, any, any, any>> =
  Id<
    | Override<
        Extract<
          UseQueryStateBaseResult<D>,
          { status: QueryStatus.uninitialized }
        >,
        { isUninitialized: true }
      >
    | Override<
        UseQueryStateBaseResult<D>,
        | { isLoading: true; isFetching: boolean; data: undefined }
        | ({
            isSuccess: true
            isFetching: true
            error: undefined
          } & Required<
            Pick<UseQueryStateBaseResult<D>, "data" | "fulfilledTimeStamp">
          >)
        | ({
            isSuccess: true
            isFetching: false
            error: undefined
          } & Required<
            Pick<
              UseQueryStateBaseResult<D>,
              "data" | "fulfilledTimeStamp" | "currentData"
            >
          >)
        | ({ isError: true } & Required<
            Pick<UseQueryStateBaseResult<D>, "error">
          >)
      >
  > & {
    status: QueryStatus
  }

export type UseQuerySubscriptionResult<
  D extends QueryDefinition<any, any, any, any>
> = Pick<QueryActionCreatorResult<D>, "refetch">
export type UseQueryState<D extends QueryDefinition<any, any, any, any>> = <
  R extends Record<string, any> = UseQueryStateDefaultResult<D>
>(
  arg: QueryArgFrom<D> | SkipToken,
  options?: UseQueryStateOptions<D, R>
) => UseQueryStateResult<D, R>
export type QueryStateSelector<
  R extends Record<string, any>,
  D extends QueryDefinition<any, any, any, any>
> = (state: UseQueryStateDefaultResult<D>) => R

export type UseQueryStateOptions<
  D extends QueryDefinition<any, any, any, any>,
  R extends Record<string, any>
> = {
  skip?: boolean
  selectFromResult?: QueryStateSelector<R, D>
}
export type UseQueryStateResult<
  _ extends QueryDefinition<any, any, any, any>,
  R
> = NoInfer<R>

export type UseQuery<D extends QueryDefinition<any, any, any, any>> = <
  R extends Record<string, any> = UseQueryStateDefaultResult<D>
>(
  arg: QueryArgFrom<D> | SkipToken,
  options?: UseQuerySubscriptionOptions & UseQueryStateOptions<D, R>
) => UseQueryHookResult<D, R>
export type UseQueryHookResult<
  D extends QueryDefinition<any, any, any, any>,
  R = UseQueryStateDefaultResult<D>
> = UseQueryStateResult<D, R> & UseQuerySubscriptionResult<D>
export type LazyQueryTrigger<D extends QueryDefinition<any, any, any, any>> = {
  (
    arg: QueryArgFrom<D>,
    preferCacheValue?: boolean
  ): QueryActionCreatorResult<D>
}
export const UNINITIALIZED_VALUE = Symbol()
export type UninitializedValue = typeof UNINITIALIZED_VALUE

export type UseLazyQueryLastPromiseInfo<
  D extends QueryDefinition<any, any, any, any>
> = {
  lastArg: QueryArgFrom<D>
}
export type UseLazyQuerySubscription<
  D extends QueryDefinition<any, any, any, any>
> = (
  options?: SubscriptionOptions
) => readonly [LazyQueryTrigger<D>, QueryArgFrom<D> | UninitializedValue]

export type UseLazyQuery<D extends QueryDefinition<any, any, any, any>> = <
  R extends Record<string, any> = UseQueryStateDefaultResult<D>
>(
  options?: SubscriptionOptions & Omit<UseQueryStateOptions<D, R>, "skip">
) => [
  LazyQueryTrigger<D>,
  UseQueryStateResult<D, R>,
  UseLazyQueryLastPromiseInfo<D>
]
export interface QueryHooks<
  Definition extends QueryDefinition<any, any, any, any, any>
> {
  useQuery: UseQuery<Definition>
  useLazyQuery: UseLazyQuery<Definition>
  useQuerySubscription: UseQuerySubscription<Definition>
  useLazyQuerySubscription: UseLazyQuerySubscription<Definition>
  useQueryState: UseQueryState<Definition>
}
export interface MutationHooks<
  Definition extends MutationDefinition<any, any, any, any, any>
> {
  useMutation: UseMutation<Definition>
}

export type HooksWithUniqueNames<Definitions extends EndpointDefinitions> =
  keyof Definitions extends infer Keys
    ? Keys extends string
      ? Definitions[Keys] extends { type: DefinitionType.query }
        ? {
            [K in Keys as `use${Capitalize<K>}Query`]: UseQuery<
              Extract<Definitions[K], QueryDefinition<any, any, any, any>>
            >
          } & {
            [K in Keys as `useLazy${Capitalize<K>}Query`]: UseLazyQuery<
              Extract<Definitions[K], QueryDefinition<any, any, any, any>>
            >
          }
        : Definitions[Keys] extends { type: DefinitionType.mutation }
        ? {
            [K in Keys as `use${Capitalize<K>}Mutation`]: UseMutation<
              Extract<Definitions[K], MutationDefinition<any, any, any, any>>
            >
          }
        : never
      : never
    : never
