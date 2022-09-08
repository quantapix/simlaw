/* eslint-disable @typescript-eslint/ban-types */
import type { AnyAction, ThunkDispatch } from "@reduxjs/toolkit"
import type { CoreModule } from "./core/module.js"
import type { CreateApiOptions } from "./createApi"
import type { RootState, CombinedState } from "./core/types.js"

const _NEVER = Symbol()
export type NEVER = typeof _NEVER

export type Id<T> = { [K in keyof T]: T[K] } & {}
export type WithRequiredProp<T, K extends keyof T> = Omit<T, K> &
  Required<Pick<T, K>>
export type Override<T1, T2> = T2 extends any ? Omit<T1, keyof T2> & T2 : never
export function assertCast<T>(v: any): asserts v is T {}

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
  dispatch: ThunkDispatch<any, any, any>
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

export type ModuleName = keyof ApiModules<any, any, any, any>

export type Module<Name extends ModuleName> = {
  name: Name
  init<
    BaseQuery extends BaseQueryFn,
    Definitions extends EndpointDefinitions,
    ReducerPath extends string,
    TagTypes extends string
  >(
    api: Api<BaseQuery, EndpointDefinitions, ReducerPath, TagTypes, ModuleName>,
    options: WithRequiredProp<
      CreateApiOptions<BaseQuery, Definitions, ReducerPath, TagTypes>,
      | "reducerPath"
      | "serializeQueryArgs"
      | "keepUnusedDataFor"
      | "refetchOnMountOrArgChange"
      | "refetchOnFocus"
      | "refetchOnReconnect"
      | "tagTypes"
    >,
    context: ApiContext<Definitions>
  ): {
    injectEndpoint(
      endpointName: string,
      definition: EndpointDefinition<any, any, any, any>
    ): void
  }
}

export interface ApiContext<Definitions extends EndpointDefinitions> {
  apiUid: string
  endpointDefinitions: Definitions
  batch(cb: () => void): void
  extractRehydrationInfo: (
    action: AnyAction
  ) => CombinedState<any, any, any> | undefined
  hasRehydrationInfo: (action: AnyAction) => boolean
}

export type Api<
  BaseQuery extends BaseQueryFn,
  Definitions extends EndpointDefinitions,
  ReducerPath extends string,
  TagTypes extends string,
  Enhancers extends ModuleName = CoreModule
> = UnionToIntersection<
  ApiModules<BaseQuery, Definitions, ReducerPath, TagTypes>[Enhancers]
> & {
  injectEndpoints<NewDefinitions extends EndpointDefinitions>(_: {
    endpoints: (
      build: EndpointBuilder<BaseQuery, TagTypes, ReducerPath>
    ) => NewDefinitions
    overrideExisting?: boolean
  }): Api<
    BaseQuery,
    Definitions & NewDefinitions,
    ReducerPath,
    TagTypes,
    Enhancers
  >
  enhanceEndpoints<NewTagTypes extends string = never>(_: {
    addTagTypes?: readonly NewTagTypes[]
    endpoints?: ReplaceTagTypes<
      Definitions,
      TagTypes | NoInfer<NewTagTypes>
    > extends infer NewDefinitions
      ? {
          [K in keyof NewDefinitions]?:
            | Partial<NewDefinitions[K]>
            | ((definition: NewDefinitions[K]) => void)
        }
      : never
  }): Api<
    BaseQuery,
    ReplaceTagTypes<Definitions, TagTypes | NewTagTypes>,
    ReducerPath,
    TagTypes | NewTagTypes,
    Enhancers
  >
}

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
  dispatch: ThunkDispatch<any, any, AnyAction>
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
}

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
  dispatch: ThunkDispatch<any, any, AnyAction>
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

interface QueryExtraOptions<
  TagTypes extends string,
  ResultType,
  QueryArg,
  BaseQuery extends BaseQueryFn,
  ReducerPath extends string = string
> {
  onCacheEntryAdded?(
    arg: QueryArg,
    api: QueryCacheLifecycleApi<QueryArg, BaseQuery, ResultType, ReducerPath>
  ): Promise<void> | void
}

interface MutationExtraOptions<
  TagTypes extends string,
  ResultType,
  QueryArg,
  BaseQuery extends BaseQueryFn,
  ReducerPath extends string = string
> {
  onCacheEntryAdded?(
    arg: QueryArg,
    api: MutationCacheLifecycleApi<QueryArg, BaseQuery, ResultType, ReducerPath>
  ): Promise<void> | void
}

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
interface QueryExtraOptions<
  TagTypes extends string,
  ResultType,
  QueryArg,
  BaseQuery extends BaseQueryFn,
  ReducerPath extends string = string
> {
  onQueryStarted?(
    arg: QueryArg,
    api: QueryLifecycleApi<QueryArg, BaseQuery, ResultType, ReducerPath>
  ): Promise<void> | void
}
interface MutationExtraOptions<
  TagTypes extends string,
  ResultType,
  QueryArg,
  BaseQuery extends BaseQueryFn,
  ReducerPath extends string = string
> {
  onQueryStarted?(
    arg: QueryArg,
    api: MutationLifecycleApi<QueryArg, BaseQuery, ResultType, ReducerPath>
  ): Promise<void> | void
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

export interface ApiModules<
  BaseQuery extends BaseQueryFn,
  Definitions extends EndpointDefinitions,
  ReducerPath extends string,
  TagTypes extends string
> {}
