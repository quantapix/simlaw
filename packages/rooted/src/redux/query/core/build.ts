import type { InternalSerializeQueryArgs } from "../utils.js"
import type {
  Api,
  ApiContext,
  AssertTagTypes,
  BaseQueryError,
  BaseQueryFn,
  calculateProvidedBy,
  DefinitionType,
  EndpointDefinition,
  EndpointDefinitions,
  expandTagDescription,
  HandledError,
  MutationDefinition,
  QueryArgFrom,
  QueryDefinition,
  QueryReturnValue,
  ResultTypeFrom,
  TagDescription,
  UnwrapPromise,
} from "../types.js"
import type {
  CombinedState as CombinedQueryState,
  ConfigState,
  getRequestStatusFlags,
  InvalidationState,
  MutationState,
  MutationSubState,
  MutationSubstateIdentifier,
  QueryCacheKey,
  QueryKeys,
  QueryState,
  QueryStatus,
  QuerySubState,
  QuerySubstateIdentifier,
  RequestStatusFlags,
  RootState as _RootState,
  RootState,
  Subscribers,
  SubscriptionOptions,
  SubscriptionState,
} from "./types.js"
import { flatten } from "../utils.js"
import {
  AnyAction,
  AsyncThunk,
  AsyncThunkPayloadCreator,
  combineReducers,
  createAction,
  createAsyncThunk,
  createNextState,
  createSelector,
  createSlice,
  Draft,
  isAllOf,
  isAnyOf,
  isFulfilled,
  isPending,
  isRejected,
  isRejectedWithValue,
  PayloadAction,
  SerializedError,
  ThunkAction,
  ThunkDispatch,
} from "@reduxjs/toolkit"
import type { Patch } from "immer"
import { isDraftable, produceWithPatches, applyPatches } from "immer"
import type { ApiEndpointQuery, PrefetchOptions } from "./module.js"
import { onFocus, onFocusLost, onOffline, onOnline } from "./listeners.js"
import {
  isDocumentVisible,
  isOnline,
  copyWithStructuralSharing,
} from "../utils.js"

export interface StartQueryActionCreatorOptions {
  subscribe?: boolean
  forceRefetch?: boolean | number
  subscriptionOptions?: SubscriptionOptions
}

type StartQueryActionCreator<
  D extends QueryDefinition<any, any, any, any, any>
> = (
  arg: QueryArgFrom<D>,
  options?: StartQueryActionCreatorOptions
) => ThunkAction<QueryActionCreatorResult<D>, any, any, AnyAction>

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

type StartMutationActionCreator<
  D extends MutationDefinition<any, any, any, any>
> = (
  arg: QueryArgFrom<D>,
  options?: {
    track?: boolean
    fixedCacheKey?: string
  }
) => ThunkAction<MutationActionCreatorResult<D>, any, any, AnyAction>

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
        | SerializedError
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

export function buildInitiate({
  serializeQueryArgs,
  queryThunk,
  mutationThunk,
  api,
  context,
}: {
  serializeQueryArgs: InternalSerializeQueryArgs
  queryThunk: QueryThunk
  mutationThunk: MutationThunk
  api: Api<any, EndpointDefinitions, any, any>
  context: ApiContext<EndpointDefinitions>
}) {
  const runningQueries: Record<
    string,
    QueryActionCreatorResult<any> | undefined
  > = {}
  const runningMutations: Record<
    string,
    MutationActionCreatorResult<any> | undefined
  > = {}
  const {
    unsubscribeQueryResult,
    removeMutationResult,
    updateSubscriptionOptions,
  } = api.internalActions
  return {
    buildInitiateQuery,
    buildInitiateMutation,
    getRunningOperationPromises,
    getRunningOperationPromise,
  }
  function getRunningOperationPromise(
    endpointName: string,
    argOrRequestId: any
  ): any {
    const endpointDefinition = context.endpointDefinitions[endpointName]
    if (endpointDefinition.type === DefinitionType.query) {
      const queryCacheKey = serializeQueryArgs({
        queryArgs: argOrRequestId,
        endpointDefinition,
        endpointName,
      })
      return runningQueries[queryCacheKey]
    } else {
      return runningMutations[argOrRequestId]
    }
  }
  function getRunningOperationPromises() {
    return [
      ...Object.values(runningQueries),
      ...Object.values(runningMutations),
    ].filter(<T>(t: T | undefined): t is T => !!t)
  }
  function middlewareWarning(getState: () => RootState<{}, string, string>) {
    if (process.env.NODE_ENV !== "production") {
      if ((middlewareWarning as any).triggered) return
      const registered =
        getState()[api.reducerPath]?.config?.middlewareRegistered
      if (registered !== undefined) {
        ;(middlewareWarning as any).triggered = true
      }
      if (registered === false) {
        console.warn(
          `Warning: Middleware for RTK-Query API at reducerPath "${api.reducerPath}" has not been added to the store.
Features like automatic cache collection, automatic refetching etc. will not be available.`
        )
      }
    }
  }
  function buildInitiateQuery(
    endpointName: string,
    endpointDefinition: QueryDefinition<any, any, any, any>
  ) {
    const queryAction: StartQueryActionCreator<any> =
      (arg, { subscribe = true, forceRefetch, subscriptionOptions } = {}) =>
      (dispatch, getState) => {
        const queryCacheKey = serializeQueryArgs({
          queryArgs: arg,
          endpointDefinition,
          endpointName,
        })
        const thunk = queryThunk({
          type: "query",
          subscribe,
          forceRefetch,
          subscriptionOptions,
          endpointName,
          originalArgs: arg,
          queryCacheKey,
        })
        const thunkResult = dispatch(thunk)
        middlewareWarning(getState)
        const { requestId, abort } = thunkResult
        const statePromise: QueryActionCreatorResult<any> = Object.assign(
          Promise.all([runningQueries[queryCacheKey], thunkResult]).then(() =>
            (api.endpoints[endpointName] as ApiEndpointQuery<any, any>).select(
              arg
            )(getState())
          ),
          {
            arg,
            requestId,
            subscriptionOptions,
            queryCacheKey,
            abort,
            async unwrap() {
              const result = await statePromise
              if (result.isError) {
                throw result.error
              }
              return result.data
            },
            refetch() {
              dispatch(
                queryAction(arg, { subscribe: false, forceRefetch: true })
              )
            },
            unsubscribe() {
              if (subscribe)
                dispatch(
                  unsubscribeQueryResult({
                    queryCacheKey,
                    requestId,
                  })
                )
            },
            updateSubscriptionOptions(options: SubscriptionOptions) {
              statePromise.subscriptionOptions = options
              dispatch(
                updateSubscriptionOptions({
                  endpointName,
                  requestId,
                  queryCacheKey,
                  options,
                })
              )
            },
          }
        )
        if (!runningQueries[queryCacheKey]) {
          runningQueries[queryCacheKey] = statePromise
          statePromise.then(() => {
            delete runningQueries[queryCacheKey]
          })
        }
        return statePromise
      }
    return queryAction
  }
  function buildInitiateMutation(
    endpointName: string
  ): StartMutationActionCreator<any> {
    return (arg, { track = true, fixedCacheKey } = {}) =>
      (dispatch, getState) => {
        const thunk = mutationThunk({
          type: "mutation",
          endpointName,
          originalArgs: arg,
          track,
          fixedCacheKey,
        })
        const thunkResult = dispatch(thunk)
        middlewareWarning(getState)
        const { requestId, abort, unwrap } = thunkResult
        const returnValuePromise = thunkResult
          .unwrap()
          .then(data => ({ data }))
          .catch(error => ({ error }))
        const reset = () => {
          dispatch(removeMutationResult({ requestId, fixedCacheKey }))
        }
        const ret = Object.assign(returnValuePromise, {
          arg: thunkResult.arg,
          requestId,
          abort,
          unwrap,
          unsubscribe: reset,
          reset,
        })
        runningMutations[requestId] = ret
        ret.then(() => {
          delete runningMutations[requestId]
        })
        if (fixedCacheKey) {
          runningMutations[fixedCacheKey] = ret
          ret.then(() => {
            if (runningMutations[fixedCacheKey] === ret)
              delete runningMutations[fixedCacheKey]
          })
        }
        return ret
      }
  }
}

export type SkipToken = typeof skipToken
export const skipToken = Symbol.for("RTKQ/skipToken")
/** @deprecated renamed to `skipToken` */
export const skipSelector = skipToken
type QueryResultSelectorFactory<
  Definition extends QueryDefinition<any, any, any, any>,
  RootState
> = (
  queryArg: QueryArgFrom<Definition> | SkipToken
) => (state: RootState) => QueryResultSelectorResult<Definition>
export type QueryResultSelectorResult<
  Definition extends QueryDefinition<any, any, any, any>
> = QuerySubState<Definition> & RequestStatusFlags
type MutationResultSelectorFactory<
  Definition extends MutationDefinition<any, any, any, any>,
  RootState
> = (
  requestId:
    | string
    | { requestId: string | undefined; fixedCacheKey: string | undefined }
    | SkipToken
) => (state: RootState) => MutationResultSelectorResult<Definition>
export type MutationResultSelectorResult<
  Definition extends MutationDefinition<any, any, any, any>
> = MutationSubState<Definition> & RequestStatusFlags
const initialSubState: QuerySubState<any> = {
  status: QueryStatus.uninitialized as const,
}
const defaultQuerySubState = createNextState(initialSubState, () => {})
const defaultMutationSubState = createNextState(
  initialSubState as MutationSubState<any>,
  () => {}
)

export function buildSelectors<
  Definitions extends EndpointDefinitions,
  ReducerPath extends string
>({
  serializeQueryArgs,
  reducerPath,
}: {
  serializeQueryArgs: InternalSerializeQueryArgs
  reducerPath: ReducerPath
}) {
  type RootState = _RootState<Definitions, string, string>
  return { buildQuerySelector, buildMutationSelector, selectInvalidatedBy }
  function withRequestFlags<T extends { status: QueryStatus }>(
    substate: T
  ): T & RequestStatusFlags {
    return {
      ...substate,
      ...getRequestStatusFlags(substate.status),
    }
  }
  function selectInternalState(rootState: RootState) {
    const state = rootState[reducerPath]
    if (process.env.NODE_ENV !== "production") {
      if (!state) {
        if ((selectInternalState as any).triggered) return state
        ;(selectInternalState as any).triggered = true
        console.error(
          `Error: No data found at \`state.${reducerPath}\`. Did you forget to add the reducer to the store?`
        )
      }
    }
    return state
  }
  function buildQuerySelector(
    endpointName: string,
    endpointDefinition: QueryDefinition<any, any, any, any>
  ) {
    return ((queryArgs: any) => {
      const selectQuerySubState = createSelector(
        selectInternalState,
        internalState =>
          (queryArgs === skipToken
            ? undefined
            : internalState?.queries?.[
                serializeQueryArgs({
                  queryArgs,
                  endpointDefinition,
                  endpointName,
                })
              ]) ?? defaultQuerySubState
      )
      return createSelector(selectQuerySubState, withRequestFlags)
    }) as QueryResultSelectorFactory<any, RootState>
  }
  function buildMutationSelector() {
    return (id => {
      let mutationId: string | typeof skipToken
      if (typeof id === "object") {
        mutationId = getMutationCacheKey(id) ?? skipToken
      } else {
        mutationId = id
      }
      const selectMutationSubstate = createSelector(
        selectInternalState,
        internalState =>
          (mutationId === skipToken
            ? undefined
            : internalState?.mutations?.[mutationId]) ?? defaultMutationSubState
      )
      return createSelector(selectMutationSubstate, withRequestFlags)
    }) as MutationResultSelectorFactory<any, RootState>
  }
  function selectInvalidatedBy(
    state: RootState,
    tags: ReadonlyArray<TagDescription<string>>
  ): Array<{
    endpointName: string
    originalArgs: any
    queryCacheKey: QueryCacheKey
  }> {
    const apiState = state[reducerPath]
    const toInvalidate = new Set<QueryCacheKey>()
    for (const tag of tags.map(expandTagDescription)) {
      const provided = apiState.provided[tag.type]
      if (!provided) {
        continue
      }
      const invalidateSubscriptions =
        (tag.id !== undefined
          ? provided[tag.id]
          : flatten(Object.values(provided))) ?? []
      for (const invalidate of invalidateSubscriptions) {
        toInvalidate.add(invalidate)
      }
    }
    return flatten(
      Array.from(toInvalidate.values()).map(queryCacheKey => {
        const querySubState = apiState.queries[queryCacheKey]
        return querySubState
          ? [
              {
                queryCacheKey,
                endpointName: querySubState.endpointName!,
                originalArgs: querySubState.originalArgs,
              },
            ]
          : []
      })
    )
  }
}
type EndpointThunk<
  Thunk extends QueryThunk | MutationThunk,
  Definition extends EndpointDefinition<any, any, any, any>
> = Definition extends EndpointDefinition<
  infer QueryArg,
  infer BaseQueryFn,
  any,
  infer ResultType
>
  ? Thunk extends AsyncThunk<unknown, infer ATArg, infer ATConfig>
    ? AsyncThunk<
        ResultType,
        ATArg & { originalArgs: QueryArg },
        ATConfig & { rejectValue: BaseQueryError<BaseQueryFn> }
      >
    : never
  : never
export type PendingAction<
  Thunk extends QueryThunk | MutationThunk,
  Definition extends EndpointDefinition<any, any, any, any>
> = ReturnType<EndpointThunk<Thunk, Definition>["pending"]>
export type FulfilledAction<
  Thunk extends QueryThunk | MutationThunk,
  Definition extends EndpointDefinition<any, any, any, any>
> = ReturnType<EndpointThunk<Thunk, Definition>["fulfilled"]>
export type RejectedAction<
  Thunk extends QueryThunk | MutationThunk,
  Definition extends EndpointDefinition<any, any, any, any>
> = ReturnType<EndpointThunk<Thunk, Definition>["rejected"]>
export type Matcher<M> = (value: any) => value is M
export interface Matchers<
  Thunk extends QueryThunk | MutationThunk,
  Definition extends EndpointDefinition<any, any, any, any>
> {
  matchPending: Matcher<PendingAction<Thunk, Definition>>
  matchFulfilled: Matcher<FulfilledAction<Thunk, Definition>>
  matchRejected: Matcher<RejectedAction<Thunk, Definition>>
}
export interface QueryThunkArg
  extends QuerySubstateIdentifier,
    StartQueryActionCreatorOptions {
  type: "query"
  originalArgs: unknown
  endpointName: string
}
export interface MutationThunkArg {
  type: "mutation"
  originalArgs: unknown
  endpointName: string
  track?: boolean
  fixedCacheKey?: string
}
export type ThunkResult = unknown
export type ThunkApiMetaConfig = {
  pendingMeta: { startedTimeStamp: number }
  fulfilledMeta: {
    fulfilledTimeStamp: number
    baseQueryMeta: unknown
  }
  rejectedMeta: {
    baseQueryMeta: unknown
  }
}
export type QueryThunk = AsyncThunk<
  ThunkResult,
  QueryThunkArg,
  ThunkApiMetaConfig
>
export type MutationThunk = AsyncThunk<
  ThunkResult,
  MutationThunkArg,
  ThunkApiMetaConfig
>
function defaultTransformResponse(baseQueryReturnValue: unknown) {
  return baseQueryReturnValue
}
export type MaybeDrafted<T> = T | Draft<T>
export type Recipe<T> = (data: MaybeDrafted<T>) => void | MaybeDrafted<T>
export type PatchQueryDataThunk<
  Definitions extends EndpointDefinitions,
  PartialState
> = <EndpointName extends QueryKeys<Definitions>>(
  endpointName: EndpointName,
  args: QueryArgFrom<Definitions[EndpointName]>,
  patches: readonly Patch[]
) => ThunkAction<void, PartialState, any, AnyAction>
export type UpdateQueryDataThunk<
  Definitions extends EndpointDefinitions,
  PartialState
> = <EndpointName extends QueryKeys<Definitions>>(
  endpointName: EndpointName,
  args: QueryArgFrom<Definitions[EndpointName]>,
  updateRecipe: Recipe<ResultTypeFrom<Definitions[EndpointName]>>
) => ThunkAction<PatchCollection, PartialState, any, AnyAction>
export type PatchCollection = {
  patches: Patch[]
  inversePatches: Patch[]
  undo: () => void
}
export function buildThunks<
  BaseQuery extends BaseQueryFn,
  ReducerPath extends string,
  Definitions extends EndpointDefinitions
>({
  reducerPath,
  baseQuery,
  context: { endpointDefinitions },
  serializeQueryArgs,
  api,
}: {
  baseQuery: BaseQuery
  reducerPath: ReducerPath
  context: ApiContext<Definitions>
  serializeQueryArgs: InternalSerializeQueryArgs
  api: Api<BaseQuery, Definitions, ReducerPath, any>
}) {
  type State = RootState<any, string, ReducerPath>
  const patchQueryData: PatchQueryDataThunk<EndpointDefinitions, State> =
    (endpointName, args, patches) => dispatch => {
      const endpointDefinition = endpointDefinitions[endpointName]
      dispatch(
        api.internalActions.queryResultPatched({
          queryCacheKey: serializeQueryArgs({
            queryArgs: args,
            endpointDefinition,
            endpointName,
          }),
          patches,
        })
      )
    }
  const updateQueryData: UpdateQueryDataThunk<EndpointDefinitions, State> =
    (endpointName, args, updateRecipe) => (dispatch, getState) => {
      const currentState = (
        api.endpoints[endpointName] as ApiEndpointQuery<any, any>
      ).select(args)(getState())
      let ret: PatchCollection = {
        patches: [],
        inversePatches: [],
        undo: () =>
          dispatch(
            api.util.patchQueryData(endpointName, args, ret.inversePatches)
          ),
      }
      if (currentState.status === QueryStatus.uninitialized) {
        return ret
      }
      if ("data" in currentState) {
        if (isDraftable(currentState.data)) {
          const [, patches, inversePatches] = produceWithPatches(
            currentState.data,
            updateRecipe
          )
          ret.patches.push(...patches)
          ret.inversePatches.push(...inversePatches)
        } else {
          const value = updateRecipe(currentState.data)
          ret.patches.push({ op: "replace", path: [], value })
          ret.inversePatches.push({
            op: "replace",
            path: [],
            value: currentState.data,
          })
        }
      }
      dispatch(api.util.patchQueryData(endpointName, args, ret.patches))
      return ret
    }
  const executeEndpoint: AsyncThunkPayloadCreator<
    ThunkResult,
    QueryThunkArg | MutationThunkArg,
    ThunkApiMetaConfig & { state: RootState<any, string, ReducerPath> }
  > = async (
    arg,
    { signal, rejectWithValue, fulfillWithValue, dispatch, getState, extra }
  ) => {
    const endpointDefinition = endpointDefinitions[arg.endpointName]
    try {
      let transformResponse: (
        baseQueryReturnValue: any,
        meta: any,
        arg: any
      ) => any = defaultTransformResponse
      let result: QueryReturnValue
      const baseQueryApi = {
        signal,
        dispatch,
        getState,
        extra,
        endpoint: arg.endpointName,
        type: arg.type,
        forced:
          arg.type === "query" ? isForcedQuery(arg, getState()) : undefined,
      }
      if (endpointDefinition.query) {
        result = await baseQuery(
          endpointDefinition.query(arg.originalArgs),
          baseQueryApi,
          endpointDefinition.extraOptions as any
        )
        if (endpointDefinition.transformResponse) {
          transformResponse = endpointDefinition.transformResponse
        }
      } else {
        result = await endpointDefinition.queryFn(
          arg.originalArgs,
          baseQueryApi,
          endpointDefinition.extraOptions as any,
          arg =>
            baseQuery(arg, baseQueryApi, endpointDefinition.extraOptions as any)
        )
      }
      if (
        typeof process !== "undefined" &&
        process.env.NODE_ENV === "development"
      ) {
        const what = endpointDefinition.query ? "`baseQuery`" : "`queryFn`"
        let err: undefined | string
        if (!result) {
          err = `${what} did not return anything.`
        } else if (typeof result !== "object") {
          err = `${what} did not return an object.`
        } else if (result.error && result.data) {
          err = `${what} returned an object containing both \`error\` and \`result\`.`
        } else if (result.error === undefined && result.data === undefined) {
          err = `${what} returned an object containing neither a valid \`error\` and \`result\`. At least one of them should not be \`undefined\``
        } else {
          for (const key of Object.keys(result)) {
            if (key !== "error" && key !== "data" && key !== "meta") {
              err = `The object returned by ${what} has the unknown property ${key}.`
              break
            }
          }
        }
        if (err) {
          console.error(
            `Error encountered handling the endpoint ${arg.endpointName}.
              ${err}
              It needs to return an object with either the shape \`{ data: <value> }\` or \`{ error: <value> }\` that may contain an optional \`meta\` property.
              Object returned was:`,
            result
          )
        }
      }
      if (result.error) throw new HandledError(result.error, result.meta)
      return fulfillWithValue(
        await transformResponse(result.data, result.meta, arg.originalArgs),
        {
          fulfilledTimeStamp: Date.now(),
          baseQueryMeta: result.meta,
        }
      )
    } catch (error) {
      if (error instanceof HandledError) {
        return rejectWithValue(error.value, { baseQueryMeta: error.meta })
      }
      if (
        typeof process !== "undefined" &&
        process.env.NODE_ENV === "development"
      ) {
        console.error(
          `An unhandled error occurred processing a request for the endpoint "${arg.endpointName}".
In the case of an unhandled error, no tags will be "provided" or "invalidated".`,
          error
        )
      } else {
        console.error(error)
      }
      throw error
    }
  }
  function isForcedQuery(
    arg: QueryThunkArg,
    state: RootState<any, string, ReducerPath>
  ) {
    const requestState = state[reducerPath]?.queries?.[arg.queryCacheKey]
    const baseFetchOnMountOrArgChange =
      state[reducerPath]?.config.refetchOnMountOrArgChange
    const fulfilledVal = requestState?.fulfilledTimeStamp
    const refetchVal =
      arg.forceRefetch ?? (arg.subscribe && baseFetchOnMountOrArgChange)
    if (refetchVal) {
      return (
        refetchVal === true ||
        (Number(new Date()) - Number(fulfilledVal)) / 1000 >= refetchVal
      )
    }
    return false
  }
  const queryThunk = createAsyncThunk<
    ThunkResult,
    QueryThunkArg,
    ThunkApiMetaConfig & { state: RootState<any, string, ReducerPath> }
  >(`${reducerPath}/executeQuery`, executeEndpoint, {
    getPendingMeta() {
      return { startedTimeStamp: Date.now() }
    },
    condition(arg, { getState }) {
      const state = getState()
      const requestState = state[reducerPath]?.queries?.[arg.queryCacheKey]
      const fulfilledVal = requestState?.fulfilledTimeStamp
      if (requestState?.status === "pending") return false
      if (isForcedQuery(arg, state)) return true
      if (fulfilledVal) return false
      return true
    },
    dispatchConditionRejection: true,
  })
  const mutationThunk = createAsyncThunk<
    ThunkResult,
    MutationThunkArg,
    ThunkApiMetaConfig & { state: RootState<any, string, ReducerPath> }
  >(`${reducerPath}/executeMutation`, executeEndpoint, {
    getPendingMeta() {
      return { startedTimeStamp: Date.now() }
    },
  })
  const hasTheForce = (options: any): options is { force: boolean } =>
    "force" in options
  const hasMaxAge = (
    options: any
  ): options is { ifOlderThan: false | number } => "ifOlderThan" in options
  const prefetch =
    <EndpointName extends QueryKeys<Definitions>>(
      endpointName: EndpointName,
      arg: any,
      options: PrefetchOptions
    ): ThunkAction<void, any, any, AnyAction> =>
    (dispatch: ThunkDispatch<any, any, any>, getState: () => any) => {
      const force = hasTheForce(options) && options.force
      const maxAge = hasMaxAge(options) && options.ifOlderThan
      const queryAction = (force: boolean = true) =>
        (api.endpoints[endpointName] as ApiEndpointQuery<any, any>).initiate(
          arg,
          { forceRefetch: force }
        )
      const latestStateValue = (
        api.endpoints[endpointName] as ApiEndpointQuery<any, any>
      ).select(arg)(getState())
      if (force) {
        dispatch(queryAction())
      } else if (maxAge) {
        const lastFulfilledTs = latestStateValue?.fulfilledTimeStamp
        if (!lastFulfilledTs) {
          dispatch(queryAction())
          return
        }
        const shouldRetrigger =
          (Number(new Date()) - Number(new Date(lastFulfilledTs))) / 1000 >=
          maxAge
        if (shouldRetrigger) {
          dispatch(queryAction())
        }
      } else {
        dispatch(queryAction(false))
      }
    }
  function matchesEndpoint(endpointName: string) {
    return (action: any): action is AnyAction =>
      action?.meta?.arg?.endpointName === endpointName
  }
  function buildMatchThunkActions<
    Thunk extends
      | AsyncThunk<any, QueryThunkArg, ThunkApiMetaConfig>
      | AsyncThunk<any, MutationThunkArg, ThunkApiMetaConfig>
  >(thunk: Thunk, endpointName: string) {
    return {
      matchPending: isAllOf(isPending(thunk), matchesEndpoint(endpointName)),
      matchFulfilled: isAllOf(
        isFulfilled(thunk),
        matchesEndpoint(endpointName)
      ),
      matchRejected: isAllOf(isRejected(thunk), matchesEndpoint(endpointName)),
    } as Matchers<Thunk, any>
  }
  return {
    queryThunk,
    mutationThunk,
    prefetch,
    updateQueryData,
    patchQueryData,
    buildMatchThunkActions,
  }
}
export function calculateProvidedByThunk(
  action: UnwrapPromise<
    ReturnType<ReturnType<QueryThunk>> | ReturnType<ReturnType<MutationThunk>>
  >,
  type: "providesTags" | "invalidatesTags",
  endpointDefinitions: EndpointDefinitions,
  assertTagType: AssertTagTypes
) {
  return calculateProvidedBy(
    endpointDefinitions[action.meta.arg.endpointName][type],
    isFulfilled(action) ? action.payload : undefined,
    isRejectedWithValue(action) ? action.payload : undefined,
    action.meta.arg.originalArgs,
    "baseQueryMeta" in action.meta ? action.meta.baseQueryMeta : undefined,
    assertTagType
  )
}

function updateQuerySubstateIfExists(
  state: QueryState<any>,
  queryCacheKey: QueryCacheKey,
  update: (substate: QuerySubState<any>) => void
) {
  const substate = state[queryCacheKey]
  if (substate) {
    update(substate)
  }
}
export function getMutationCacheKey(
  id:
    | MutationSubstateIdentifier
    | { requestId: string; arg: { fixedCacheKey?: string | undefined } }
): string
export function getMutationCacheKey(id: {
  fixedCacheKey?: string
  requestId?: string
}): string | undefined
export function getMutationCacheKey(
  id:
    | { fixedCacheKey?: string; requestId?: string }
    | MutationSubstateIdentifier
    | { requestId: string; arg: { fixedCacheKey?: string | undefined } }
): string | undefined {
  return ("arg" in id ? id.arg.fixedCacheKey : id.fixedCacheKey) ?? id.requestId
}
function updateMutationSubstateIfExists(
  state: MutationState<any>,
  id:
    | MutationSubstateIdentifier
    | { requestId: string; arg: { fixedCacheKey?: string | undefined } },
  update: (substate: MutationSubState<any>) => void
) {
  const substate = state[getMutationCacheKey(id)]
  if (substate) {
    update(substate)
  }
}
const initialState = {} as any
export function buildSlice({
  reducerPath,
  queryThunk,
  mutationThunk,
  context: {
    endpointDefinitions: definitions,
    apiUid,
    extractRehydrationInfo,
    hasRehydrationInfo,
  },
  assertTagType,
  config,
}: {
  reducerPath: string
  queryThunk: QueryThunk
  mutationThunk: MutationThunk
  context: ApiContext<EndpointDefinitions>
  assertTagType: AssertTagTypes
  config: Omit<
    ConfigState<string>,
    "online" | "focused" | "middlewareRegistered"
  >
}) {
  const resetApiState = createAction(`${reducerPath}/resetApiState`)
  const querySlice = createSlice({
    name: `${reducerPath}/queries`,
    initialState: initialState as QueryState<any>,
    reducers: {
      removeQueryResult(
        draft,
        { payload: { queryCacheKey } }: PayloadAction<QuerySubstateIdentifier>
      ) {
        delete draft[queryCacheKey]
      },
      queryResultPatched(
        draft,
        {
          payload: { queryCacheKey, patches },
        }: PayloadAction<
          QuerySubstateIdentifier & { patches: readonly Patch[] }
        >
      ) {
        updateQuerySubstateIfExists(draft, queryCacheKey, substate => {
          substate.data = applyPatches(substate.data as any, patches.concat())
        })
      },
    },
    extraReducers(builder) {
      builder
        .addCase(queryThunk.pending, (draft, { meta, meta: { arg } }) => {
          if (arg.subscribe) {
            draft[arg.queryCacheKey] ??= {
              status: QueryStatus.uninitialized,
              endpointName: arg.endpointName,
            }
          }
          updateQuerySubstateIfExists(draft, arg.queryCacheKey, substate => {
            substate.status = QueryStatus.pending
            substate.requestId = meta.requestId
            if (arg.originalArgs !== undefined) {
              substate.originalArgs = arg.originalArgs
            }
            substate.startedTimeStamp = meta.startedTimeStamp
          })
        })
        .addCase(queryThunk.fulfilled, (draft, { meta, payload }) => {
          updateQuerySubstateIfExists(
            draft,
            meta.arg.queryCacheKey,
            substate => {
              if (substate.requestId !== meta.requestId) return
              substate.status = QueryStatus.fulfilled
              substate.data =
                definitions[meta.arg.endpointName].structuralSharing ?? true
                  ? copyWithStructuralSharing(substate.data, payload)
                  : payload
              delete substate.error
              substate.fulfilledTimeStamp = meta.fulfilledTimeStamp
            }
          )
        })
        .addCase(
          queryThunk.rejected,
          (draft, { meta: { condition, arg, requestId }, error, payload }) => {
            updateQuerySubstateIfExists(draft, arg.queryCacheKey, substate => {
              if (condition) {
              } else {
                if (substate.requestId !== requestId) return
                substate.status = QueryStatus.rejected
                substate.error = (payload ?? error) as any
              }
            })
          }
        )
        .addMatcher(hasRehydrationInfo, (draft, action) => {
          const { queries } = extractRehydrationInfo(action)!
          for (const [key, entry] of Object.entries(queries)) {
            if (
              // do not rehydrate entries that were currently in flight.
              entry?.status === QueryStatus.fulfilled ||
              entry?.status === QueryStatus.rejected
            ) {
              draft[key] = entry
            }
          }
        })
    },
  })
  const mutationSlice = createSlice({
    name: `${reducerPath}/mutations`,
    initialState: initialState as MutationState<any>,
    reducers: {
      removeMutationResult(
        draft,
        { payload }: PayloadAction<MutationSubstateIdentifier>
      ) {
        const cacheKey = getMutationCacheKey(payload)
        if (cacheKey in draft) {
          delete draft[cacheKey]
        }
      },
    },
    extraReducers(builder) {
      builder
        .addCase(
          mutationThunk.pending,
          (draft, { meta, meta: { requestId, arg, startedTimeStamp } }) => {
            if (!arg.track) return
            draft[getMutationCacheKey(meta)] = {
              requestId,
              status: QueryStatus.pending,
              endpointName: arg.endpointName,
              startedTimeStamp,
            }
          }
        )
        .addCase(mutationThunk.fulfilled, (draft, { payload, meta }) => {
          if (!meta.arg.track) return
          updateMutationSubstateIfExists(draft, meta, substate => {
            if (substate.requestId !== meta.requestId) return
            substate.status = QueryStatus.fulfilled
            substate.data = payload
            substate.fulfilledTimeStamp = meta.fulfilledTimeStamp
          })
        })
        .addCase(mutationThunk.rejected, (draft, { payload, error, meta }) => {
          if (!meta.arg.track) return
          updateMutationSubstateIfExists(draft, meta, substate => {
            if (substate.requestId !== meta.requestId) return
            substate.status = QueryStatus.rejected
            substate.error = (payload ?? error) as any
          })
        })
        .addMatcher(hasRehydrationInfo, (draft, action) => {
          const { mutations } = extractRehydrationInfo(action)!
          for (const [key, entry] of Object.entries(mutations)) {
            if (
              (entry?.status === QueryStatus.fulfilled ||
                entry?.status === QueryStatus.rejected) &&
              key !== entry?.requestId
            ) {
              draft[key] = entry
            }
          }
        })
    },
  })
  const invalidationSlice = createSlice({
    name: `${reducerPath}/invalidation`,
    initialState: initialState as InvalidationState<string>,
    reducers: {},
    extraReducers(builder) {
      builder
        .addCase(
          querySlice.actions.removeQueryResult,
          (draft, { payload: { queryCacheKey } }) => {
            for (const tagTypeSubscriptions of Object.values(draft)) {
              for (const idSubscriptions of Object.values(
                tagTypeSubscriptions
              )) {
                const foundAt = idSubscriptions.indexOf(queryCacheKey)
                if (foundAt !== -1) {
                  idSubscriptions.splice(foundAt, 1)
                }
              }
            }
          }
        )
        .addMatcher(hasRehydrationInfo, (draft, action) => {
          const { provided } = extractRehydrationInfo(action)!
          for (const [type, incomingTags] of Object.entries(provided)) {
            for (const [id, cacheKeys] of Object.entries(incomingTags)) {
              const subscribedQueries = ((draft[type] ??= {})[
                id || "__internal_without_id"
              ] ??= [])
              for (const queryCacheKey of cacheKeys) {
                const alreadySubscribed =
                  subscribedQueries.includes(queryCacheKey)
                if (!alreadySubscribed) {
                  subscribedQueries.push(queryCacheKey)
                }
              }
            }
          }
        })
        .addMatcher(
          isAnyOf(isFulfilled(queryThunk), isRejectedWithValue(queryThunk)),
          (draft, action) => {
            const providedTags = calculateProvidedByThunk(
              action,
              "providesTags",
              definitions,
              assertTagType
            )
            const { queryCacheKey } = action.meta.arg
            for (const { type, id } of providedTags) {
              const subscribedQueries = ((draft[type] ??= {})[
                id || "__internal_without_id"
              ] ??= [])
              const alreadySubscribed =
                subscribedQueries.includes(queryCacheKey)
              if (!alreadySubscribed) {
                subscribedQueries.push(queryCacheKey)
              }
            }
          }
        )
    },
  })
  const subscriptionSlice = createSlice({
    name: `${reducerPath}/subscriptions`,
    initialState: initialState as SubscriptionState,
    reducers: {
      updateSubscriptionOptions(
        draft,
        {
          payload: { queryCacheKey, requestId, options },
        }: PayloadAction<
          {
            endpointName: string
            requestId: string
            options: Subscribers[number]
          } & QuerySubstateIdentifier
        >
      ) {
        if (draft?.[queryCacheKey]?.[requestId]) {
          draft[queryCacheKey]![requestId] = options
        }
      },
      unsubscribeQueryResult(
        draft,
        {
          payload: { queryCacheKey, requestId },
        }: PayloadAction<{ requestId: string } & QuerySubstateIdentifier>
      ) {
        if (draft[queryCacheKey]) {
          delete draft[queryCacheKey]![requestId]
        }
      },
    },
    extraReducers: builder => {
      builder
        .addCase(
          querySlice.actions.removeQueryResult,
          (draft, { payload: { queryCacheKey } }) => {
            delete draft[queryCacheKey]
          }
        )
        .addCase(queryThunk.pending, (draft, { meta: { arg, requestId } }) => {
          if (arg.subscribe) {
            const substate = (draft[arg.queryCacheKey] ??= {})
            substate[requestId] =
              arg.subscriptionOptions ?? substate[requestId] ?? {}
          }
        })
        .addCase(
          queryThunk.rejected,
          (draft, { meta: { condition, arg, requestId }, error, payload }) => {
            if (condition && arg.subscribe) {
              const substate = (draft[arg.queryCacheKey] ??= {})
              substate[requestId] =
                arg.subscriptionOptions ?? substate[requestId] ?? {}
            }
          }
        )
        .addMatcher(hasRehydrationInfo, draft => ({ ...draft }))
    },
  })
  const configSlice = createSlice({
    name: `${reducerPath}/config`,
    initialState: {
      online: isOnline(),
      focused: isDocumentVisible(),
      middlewareRegistered: false,
      ...config,
    } as ConfigState<string>,
    reducers: {
      middlewareRegistered(state, { payload }: PayloadAction<string>) {
        state.middlewareRegistered =
          state.middlewareRegistered === "conflict" || apiUid !== payload
            ? "conflict"
            : true
      },
    },
    extraReducers: builder => {
      builder
        .addCase(onOnline, state => {
          state.online = true
        })
        .addCase(onOffline, state => {
          state.online = false
        })
        .addCase(onFocus, state => {
          state.focused = true
        })
        .addCase(onFocusLost, state => {
          state.focused = false
        })
        .addMatcher(hasRehydrationInfo, draft => ({ ...draft }))
    },
  })
  const combinedReducer = combineReducers<
    CombinedQueryState<any, string, string>
  >({
    queries: querySlice.reducer,
    mutations: mutationSlice.reducer,
    provided: invalidationSlice.reducer,
    subscriptions: subscriptionSlice.reducer,
    config: configSlice.reducer,
  })
  const reducer: typeof combinedReducer = (state, action) =>
    combinedReducer(resetApiState.match(action) ? undefined : state, action)
  const actions = {
    ...configSlice.actions,
    ...querySlice.actions,
    ...subscriptionSlice.actions,
    ...mutationSlice.actions,
    /** @deprecated has been renamed to `removeMutationResult` */
    unsubscribeMutationResult: mutationSlice.actions.removeMutationResult,
    resetApiState,
  }
  return { reducer, actions }
}
export type SliceActions = ReturnType<typeof buildSlice>["actions"]
