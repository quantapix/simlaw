import * as qi from "../../immer/index.js"
import * as qt from "./types.js"
import * as qu from "./utils.js"
import * as qx from "../index.js"
import type {
  Api,
  ApiContext,
  ApiEndpointQuery,
  PrefetchOptions,
  Module,
  ModuleName,
} from "./module.js"

export function buildInitiate({
  serializeQueryArgs,
  queryThunk,
  mutationThunk,
  api,
  context,
}: {
  serializeQueryArgs: qt.InternalSerializeQueryArgs
  queryThunk: qt.QueryThunk
  mutationThunk: qt.MutationThunk
  api: Api<any, qt.EndpointDefinitions, any, any>
  context: ApiContext<qt.EndpointDefinitions>
}) {
  const runningQueries: Record<
    string,
    qt.QueryActionCreatorResult<any> | undefined
  > = {}
  const runningMutations: Record<
    string,
    qt.MutationActionCreatorResult<any> | undefined
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
    if (endpointDefinition?.type === qt.DefinitionType.query) {
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
  function middlewareWarning(getState: () => qt.RootState<{}, string, string>) {
    if (process.env["NODE_ENV"] !== "production") {
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
    endpointDefinition: qt.QueryDefinition<any, any, any, any>
  ) {
    const queryAction: qt.StartQueryActionCreator<any> =
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
        const statePromise: qt.QueryActionCreatorResult<any> = Object.assign(
          Promise.all([runningQueries[queryCacheKey], thunkResult]).then(() =>
            api.endpoints[endpointName]?.select(arg)(getState())
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
            updateSubscriptionOptions(options: qt.SubscriptionOptions) {
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
  ): qt.StartMutationActionCreator<any> {
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

const initialSubState: qt.QuerySubState<any> = {
  status: qt.QueryStatus.uninitialized as const,
}
const defaultQuerySubState = qi.produce(initialSubState, () => {})
const defaultMutationSubState = qi.produce(
  initialSubState as qt.MutationSubState<any>,
  () => {}
)

export function buildSelectors<
  Definitions extends qt.EndpointDefinitions,
  ReducerPath extends string
>({
  serializeQueryArgs,
  reducerPath,
}: {
  serializeQueryArgs: qt.InternalSerializeQueryArgs
  reducerPath: ReducerPath
}) {
  type RootState = qt.RootState<Definitions, string, string>
  return { buildQuerySelector, buildMutationSelector, selectInvalidatedBy }
  function withRequestFlags<T extends { status: qt.QueryStatus }>(
    substate: T
  ): T & qt.RequestStatusFlags {
    return {
      ...substate,
      ...qt.getRequestStatusFlags(substate.status),
    }
  }
  function selectInternalState(rootState: RootState) {
    const state = rootState[reducerPath]
    if (process.env["NODE_ENV"] !== "production") {
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
    endpointDefinition: qt.QueryDefinition<any, any, any, any>
  ) {
    return ((queryArgs: any) => {
      const selectQuerySubState = qx.createSelector(
        selectInternalState,
        internalState =>
          (queryArgs === qt.skipToken
            ? undefined
            : internalState?.queries?.[
                serializeQueryArgs({
                  queryArgs,
                  endpointDefinition,
                  endpointName,
                })
              ]) ?? defaultQuerySubState
      )
      return qx.createSelector(selectQuerySubState, withRequestFlags)
    }) as qt.QueryResultSelectorFactory<any, RootState>
  }
  function buildMutationSelector() {
    return (id => {
      let mutationId: string | typeof qt.skipToken
      if (typeof id === "object") {
        mutationId = getMutationCacheKey(id) ?? qt.skipToken
      } else {
        mutationId = id
      }
      const selectMutationSubstate = qx.createSelector(
        selectInternalState,
        internalState =>
          (mutationId === qt.skipToken
            ? undefined
            : internalState?.mutations?.[mutationId]) ?? defaultMutationSubState
      )
      return qx.createSelector(selectMutationSubstate, withRequestFlags)
    }) as qt.MutationResultSelectorFactory<any, RootState>
  }
  function selectInvalidatedBy(
    state: RootState,
    tags: ReadonlyArray<qt.TagDescription<string>>
  ): Array<{
    endpointName: string
    originalArgs: any
    queryCacheKey: qt.QueryCacheKey
  }> {
    const apiState = state[reducerPath]
    const toInvalidate = new Set<qt.QueryCacheKey>()
    for (const tag of tags.map(qt.expandTagDescription)) {
      const provided = apiState?.provided[tag.type]
      if (!provided) {
        continue
      }
      const invalidateSubscriptions =
        (tag.id !== undefined
          ? provided[tag.id]
          : qu.flatten(Object.values(provided))) ?? []
      for (const invalidate of invalidateSubscriptions) {
        toInvalidate.add(invalidate)
      }
    }
    return qu.flatten(
      Array.from(toInvalidate.values()).map(queryCacheKey => {
        const querySubState = apiState?.queries[queryCacheKey]
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
  Thunk extends qt.QueryThunk | qt.MutationThunk,
  Definition extends qt.EndpointDefinition<any, any, any, any>
> = Definition extends qt.EndpointDefinition<
  infer QueryArg,
  infer BaseQueryFn,
  any,
  infer ResultType
>
  ? Thunk extends qt.AsyncThunk<unknown, infer ATArg, infer ATConfig>
    ? qt.AsyncThunk<
        ResultType,
        ATArg & { originalArgs: QueryArg },
        ATConfig & { rejectValue: qt.BaseQueryError<BaseQueryFn> }
      >
    : never
  : never

type PendingAction<
  Thunk extends qt.QueryThunk | qt.MutationThunk,
  Definition extends qt.EndpointDefinition<any, any, any, any>
> = ReturnType<EndpointThunk<Thunk, Definition>["pending"]>

type FulfilledAction<
  Thunk extends qt.QueryThunk | qt.MutationThunk,
  Definition extends qt.EndpointDefinition<any, any, any, any>
> = ReturnType<EndpointThunk<Thunk, Definition>["fulfilled"]>

type RejectedAction<
  Thunk extends qt.QueryThunk | qt.MutationThunk,
  Definition extends qt.EndpointDefinition<any, any, any, any>
> = ReturnType<EndpointThunk<Thunk, Definition>["rejected"]>

export type Matcher<M> = (value: any) => value is M
export interface Matchers<
  Thunk extends qt.QueryThunk | qt.MutationThunk,
  Definition extends qt.EndpointDefinition<any, any, any, any>
> {
  matchPending: Matcher<PendingAction<Thunk, Definition>>
  matchFulfilled: Matcher<FulfilledAction<Thunk, Definition>>
  matchRejected: Matcher<RejectedAction<Thunk, Definition>>
}

function defaultTransformResponse(baseQueryReturnValue: unknown) {
  return baseQueryReturnValue
}

export type PatchQueryDataThunk<
  Definitions extends qt.EndpointDefinitions,
  PartialState
> = <EndpointName extends qt.QueryKeys<Definitions>>(
  endpointName: EndpointName,
  args: qt.QueryArgFrom<Definitions[EndpointName]>,
  patches: readonly qi.Patch[]
) => qt.ThunkAction<void, PartialState, any, qt.AnyAction>
export type UpdateQueryDataThunk<
  Definitions extends qt.EndpointDefinitions,
  PartialState
> = <EndpointName extends qt.QueryKeys<Definitions>>(
  endpointName: EndpointName,
  args: qt.QueryArgFrom<Definitions[EndpointName]>,
  updateRecipe: qt.Recipe<qt.ResultTypeFrom<Definitions[EndpointName]>>
) => qt.ThunkAction<qt.PatchCollection, PartialState, any, qt.AnyAction>
export function buildThunks<
  BaseQuery extends qt.BaseQueryFn,
  ReducerPath extends string,
  Definitions extends qt.EndpointDefinitions
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
  serializeQueryArgs: qt.InternalSerializeQueryArgs
  api: Api<BaseQuery, Definitions, ReducerPath, any>
}) {
  type State = qt.RootState<any, string, ReducerPath>
  const patchQueryData: PatchQueryDataThunk<qt.EndpointDefinitions, State> =
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
  const updateQueryData: UpdateQueryDataThunk<qt.EndpointDefinitions, State> =
    (endpointName, args, updateRecipe) => (dispatch, getState) => {
      const currentState = (
        api.endpoints[endpointName] as ApiEndpointQuery<any, any>
      ).select(args)(getState())
      const ret: qt.PatchCollection = {
        patches: [],
        inversePatches: [],
        undo: () =>
          dispatch(
            api.util.patchQueryData(endpointName, args, ret.inversePatches)
          ),
      }
      if (currentState.status === qt.QueryStatus.uninitialized) {
        return ret
      }
      if ("data" in currentState) {
        if (qi.isDraftable(currentState.data)) {
          const [, patches, inversePatches] = qi.produceWithPatches(
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
  const executeEndpoint: qt.AsyncThunkPayloadCreator<
    qt.ThunkResult,
    qt.QueryThunkArg | qt.MutationThunkArg,
    qt.ThunkApiMetaConfig & { state: qt.RootState<any, string, ReducerPath> }
  > = async (
    arg,
    { signal, rejectWithValue, fulfillWithValue, dispatch, getState, extra }
  ) => {
    const endpointDefinition = endpointDefinitions[arg.endpointName]!
    try {
      let transformResponse: (
        baseQueryReturnValue: any,
        meta: any,
        arg: any
      ) => any = defaultTransformResponse
      let result: qt.QueryReturnValue
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
        process.env["NODE_ENV"] === "development"
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
      if (result.error) throw new qt.HandledError(result.error, result.meta)
      return fulfillWithValue(
        await transformResponse(result.data, result.meta, arg.originalArgs),
        {
          fulfilledTimeStamp: Date.now(),
          baseQueryMeta: result.meta,
        }
      )
    } catch (error) {
      if (error instanceof qt.HandledError) {
        return rejectWithValue(error.value, { baseQueryMeta: error.meta })
      }
      if (
        typeof process !== "undefined" &&
        process.env["NODE_ENV"] === "development"
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
    arg: qt.QueryThunkArg,
    state: qt.RootState<any, string, ReducerPath>
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
  const queryThunk = qx.createAsyncThunk<
    qt.ThunkResult,
    qt.QueryThunkArg,
    qt.ThunkApiMetaConfig & { state: qt.RootState<any, string, ReducerPath> }
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
  const mutationThunk = qx.createAsyncThunk<
    qt.ThunkResult,
    qt.MutationThunkArg,
    qt.ThunkApiMetaConfig & { state: qt.RootState<any, string, ReducerPath> }
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
    <EndpointName extends qt.QueryKeys<Definitions>>(
      endpointName: EndpointName,
      arg: any,
      options: PrefetchOptions
    ): qt.ThunkAction<void, any, any, qt.AnyAction> =>
    (dispatch: qt.ThunkDispatch<any, any, any>, getState: () => any) => {
      const force = hasTheForce(options) && options.force
      const maxAge = hasMaxAge(options) && options.ifOlderThan
      const queryAction = (force = true) =>
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
    return (action: any): action is qt.AnyAction =>
      action?.meta?.arg?.endpointName === endpointName
  }
  function buildMatchThunkActions<
    Thunk extends
      | qt.AsyncThunk<any, qt.QueryThunkArg, qt.ThunkApiMetaConfig>
      | qt.AsyncThunk<any, qt.MutationThunkArg, qt.ThunkApiMetaConfig>
  >(thunk: Thunk, endpointName: string) {
    return {
      matchPending: qx.isAllOf(
        qx.isPending(thunk),
        matchesEndpoint(endpointName)
      ),
      matchFulfilled: qx.isAllOf(
        qx.isFulfilled(thunk),
        matchesEndpoint(endpointName)
      ),
      matchRejected: qx.isAllOf(
        qx.isRejected(thunk),
        matchesEndpoint(endpointName)
      ),
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
  action: qt.UnwrapPromise<
    | ReturnType<ReturnType<qt.QueryThunk>>
    | ReturnType<ReturnType<qt.MutationThunk>>
  >,
  type: "providesTags" | "invalidatesTags",
  endpointDefinitions: qt.EndpointDefinitions,
  assertTagType: qt.AssertTagTypes
) {
  return qt.calculateProvidedBy(
    endpointDefinitions[action.meta.arg.endpointName]?.[type],
    qx.isFulfilled(action) ? action.payload : undefined,
    qx.isRejectedWithValue(action) ? action.payload : undefined,
    action.meta.arg.originalArgs,
    "baseQueryMeta" in action.meta ? action.meta.baseQueryMeta : undefined,
    assertTagType
  )
}

function updateQuerySubstateIfExists(
  state: qt.QueryState<any>,
  queryCacheKey: qt.QueryCacheKey,
  update: (substate: qt.QuerySubState<any>) => void
) {
  const substate = state[queryCacheKey]
  if (substate) {
    update(substate)
  }
}

export function getMutationCacheKey(
  id:
    | qt.MutationSubstateIdentifier
    | { requestId: string; arg: { fixedCacheKey?: string | undefined } }
): string

export function getMutationCacheKey(id: {
  fixedCacheKey?: string
  requestId?: string
}): string | undefined
export function getMutationCacheKey(
  id:
    | { fixedCacheKey?: string; requestId?: string }
    | qt.MutationSubstateIdentifier
    | { requestId: string; arg: { fixedCacheKey?: string | undefined } }
): string | undefined {
  return ("arg" in id ? id.arg.fixedCacheKey : id.fixedCacheKey) ?? id.requestId
}

function updateMutationSubstateIfExists(
  state: qt.MutationState<any>,
  id:
    | qt.MutationSubstateIdentifier
    | { requestId: string; arg: { fixedCacheKey?: string | undefined } },
  update: (substate: qt.MutationSubState<any>) => void
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
  queryThunk: qt.QueryThunk
  mutationThunk: qt.MutationThunk
  context: ApiContext<qt.EndpointDefinitions>
  assertTagType: qt.AssertTagTypes
  config: Omit<
    qt.ConfigState<string>,
    "online" | "focused" | "middlewareRegistered"
  >
}) {
  const resetApiState = qx.createAction(`${reducerPath}/resetApiState`)
  const querySlice = qx.createSlice({
    name: `${reducerPath}/queries`,
    initialState: initialState as qt.QueryState<any>,
    reducers: {
      removeQueryResult(
        draft,
        {
          payload: { queryCacheKey },
        }: qt.PayloadAction<qt.QuerySubstateIdentifier>
      ) {
        delete draft[queryCacheKey]
      },
      queryResultPatched(
        draft,
        {
          payload: { queryCacheKey, patches },
        }: qt.PayloadAction<
          qt.QuerySubstateIdentifier & { patches: readonly qi.Patch[] }
        >
      ) {
        updateQuerySubstateIfExists(draft, queryCacheKey, substate => {
          substate.data = qi.applyPatches(
            substate.data as any,
            patches.concat()
          )
        })
      },
    },
    extraReducers(builder) {
      builder
        .addCase(queryThunk.pending, (draft, { meta, meta: { arg } }) => {
          if (arg.subscribe) {
            draft[arg.queryCacheKey] ??= {
              status: qt.QueryStatus.uninitialized,
              endpointName: arg.endpointName,
            }
          }
          updateQuerySubstateIfExists(draft, arg.queryCacheKey, substate => {
            substate.status = qt.QueryStatus.pending
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
              substate.status = qt.QueryStatus.fulfilled
              substate.data =
                definitions[meta.arg.endpointName]?.structuralSharing ?? true
                  ? qu.copyWithStructuralSharing(substate.data, payload)
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
                substate.status = qt.QueryStatus.rejected
                substate.error = (payload ?? error) as any
              }
            })
          }
        )
        .addMatcher(hasRehydrationInfo, (draft, action) => {
          const { queries } = extractRehydrationInfo(action)!
          for (const [key, entry] of Object.entries(queries)) {
            if (
              entry?.status === qt.QueryStatus.fulfilled ||
              entry?.status === qt.QueryStatus.rejected
            ) {
              draft[key] = entry
            }
          }
        })
    },
  })
  const mutationSlice = qx.createSlice({
    name: `${reducerPath}/mutations`,
    initialState: initialState as qt.MutationState<any>,
    reducers: {
      removeMutationResult(
        draft,
        { payload }: qt.PayloadAction<qt.MutationSubstateIdentifier>
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
              status: qt.QueryStatus.pending,
              endpointName: arg.endpointName,
              startedTimeStamp,
            }
          }
        )
        .addCase(mutationThunk.fulfilled, (draft, { payload, meta }) => {
          if (!meta.arg.track) return
          updateMutationSubstateIfExists(draft, meta, substate => {
            if (substate.requestId !== meta.requestId) return
            substate.status = qt.QueryStatus.fulfilled
            substate.data = payload
            substate.fulfilledTimeStamp = meta.fulfilledTimeStamp
          })
        })
        .addCase(mutationThunk.rejected, (draft, { payload, error, meta }) => {
          if (!meta.arg.track) return
          updateMutationSubstateIfExists(draft, meta, substate => {
            if (substate.requestId !== meta.requestId) return
            substate.status = qt.QueryStatus.rejected
            substate.error = (payload ?? error) as any
          })
        })
        .addMatcher(hasRehydrationInfo, (draft, action) => {
          const { mutations } = extractRehydrationInfo(action)!
          for (const [key, entry] of Object.entries(mutations)) {
            if (
              (entry?.status === qt.QueryStatus.fulfilled ||
                entry?.status === qt.QueryStatus.rejected) &&
              key !== entry?.requestId
            ) {
              draft[key] = entry
            }
          }
        })
    },
  })
  const invalidationSlice = qx.createSlice({
    name: `${reducerPath}/invalidation`,
    initialState: initialState as qt.InvalidationState<string>,
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
          qx.isAnyOf(
            qx.isFulfilled(queryThunk),
            qx.isRejectedWithValue(queryThunk)
          ),
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
  const subscriptionSlice = qx.createSlice({
    name: `${reducerPath}/subscriptions`,
    initialState: initialState as qt.SubscriptionState,
    reducers: {
      updateSubscriptionOptions(
        draft,
        {
          payload: { queryCacheKey, requestId, options },
        }: qt.PayloadAction<
          {
            endpointName: string
            requestId: string
            options: qt.Subscribers[number]
          } & qt.QuerySubstateIdentifier
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
        }: qt.PayloadAction<{ requestId: string } & qt.QuerySubstateIdentifier>
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
  const configSlice = qx.createSlice({
    name: `${reducerPath}/config`,
    initialState: {
      online: qu.isOnline(),
      focused: qu.isDocumentVisible(),
      middlewareRegistered: false,
      ...config,
    } as qt.ConfigState<string>,
    reducers: {
      middlewareRegistered(state, { payload }: qt.PayloadAction<string>) {
        state.middlewareRegistered =
          state.middlewareRegistered === "conflict" || apiUid !== payload
            ? "conflict"
            : true
      },
    },
    extraReducers: builder => {
      builder
        .addCase(qu.onOnline, state => {
          state.online = true
        })
        .addCase(qu.onOffline, state => {
          state.online = false
        })
        .addCase(qu.onFocus, state => {
          state.focused = true
        })
        .addCase(qu.onFocusLost, state => {
          state.focused = false
        })
        .addMatcher(hasRehydrationInfo, draft => ({ ...draft }))
    },
  })
  const combinedReducer = qx.combineReducers<
    qt.CombinedState<any, string, string>
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

export interface CreateApiOptions<
  BaseQuery extends qt.BaseQueryFn,
  Definitions extends qt.EndpointDefinitions,
  ReducerPath extends string = "api",
  TagTypes extends string = never
> {
  baseQuery: BaseQuery
  tagTypes?: readonly TagTypes[]
  reducerPath?: ReducerPath
  serializeQueryArgs?: qt.SerializeQueryArgs<qt.BaseQueryArg<BaseQuery>>
  endpoints(
    build: qt.EndpointBuilder<BaseQuery, TagTypes, ReducerPath>
  ): Definitions
  keepUnusedDataFor?: number
  refetchOnMountOrArgChange?: boolean | number
  refetchOnFocus?: boolean
  refetchOnReconnect?: boolean
  extractRehydrationInfo?: (
    action: qt.AnyAction,
    {
      reducerPath,
    }: {
      reducerPath: ReducerPath
    }
  ) =>
    | undefined
    | qt.CombinedState<
        qt.NoInfer<Definitions>,
        qt.NoInfer<TagTypes>,
        qt.NoInfer<ReducerPath>
      >
}

export type CreateApi<Modules extends ModuleName> = {
  <
    BaseQuery extends qt.BaseQueryFn,
    Definitions extends qt.EndpointDefinitions,
    ReducerPath extends string = "api",
    TagTypes extends string = never
  >(
    options: CreateApiOptions<BaseQuery, Definitions, ReducerPath, TagTypes>
  ): Api<BaseQuery, Definitions, ReducerPath, TagTypes, Modules>
}

export function buildCreateApi<Modules extends [Module<any>, ...Module<any>[]]>(
  ...modules: Modules
): CreateApi<Modules[number]["name"]> {
  return function baseCreateApi(options) {
    const extractRehydrationInfo = qx.defaultMemoize((action: qt.AnyAction) =>
      options.extractRehydrationInfo?.(action, {
        reducerPath: (options.reducerPath ?? "api") as any,
      })
    )

    const optionsWithDefaults = {
      reducerPath: "api",
      serializeQueryArgs: qu.defaultSerializeQueryArgs,
      keepUnusedDataFor: 60,
      refetchOnMountOrArgChange: false,
      refetchOnFocus: false,
      refetchOnReconnect: false,
      ...options,
      extractRehydrationInfo,
      tagTypes: [...(options.tagTypes || [])],
    }

    const context: ApiContext<qt.EndpointDefinitions> = {
      endpointDefinitions: {},
      batch(fn) {
        fn()
      },
      apiUid: qu.nanoid(),
      extractRehydrationInfo,
      hasRehydrationInfo: qx.defaultMemoize(
        action => extractRehydrationInfo(action) != null
      ),
    }

    const api = {
      injectEndpoints,
      enhanceEndpoints({ addTagTypes, endpoints }) {
        if (addTagTypes) {
          for (const eT of addTagTypes) {
            if (!optionsWithDefaults.tagTypes.includes(eT as any)) {
              optionsWithDefaults.tagTypes.push(eT as any)
            }
          }
        }
        if (endpoints) {
          for (const [endpointName, partialDefinition] of Object.entries(
            endpoints
          )) {
            if (typeof partialDefinition === "function") {
              partialDefinition(context.endpointDefinitions[endpointName])
            } else {
              Object.assign(
                context.endpointDefinitions[endpointName] || {},
                partialDefinition
              )
            }
          }
        }
        return api
      },
    } as Api<qt.BaseQueryFn, {}, string, string, Modules[number]["name"]>

    const initializedModules = modules.map(m =>
      m.init(api as any, optionsWithDefaults, context)
    )

    function injectEndpoints(
      inject: Parameters<typeof api.injectEndpoints>[0]
    ) {
      const evaluatedEndpoints = inject.endpoints({
        query: x => ({ ...x, type: qt.DefinitionType.query } as any),
        mutation: x => ({ ...x, type: qt.DefinitionType.mutation } as any),
      })

      for (const [endpointName, definition] of Object.entries(
        evaluatedEndpoints
      )) {
        if (
          !inject.overrideExisting &&
          endpointName in context.endpointDefinitions
        ) {
          if (
            typeof process !== "undefined" &&
            process.env["NODE_ENV"] === "development"
          ) {
            console.error(
              `called \`injectEndpoints\` to override already-existing endpointName ${endpointName} without specifying \`overrideExisting: true\``
            )
          }

          continue
        }
        context.endpointDefinitions[endpointName] = definition
        for (const m of initializedModules) {
          m.injectEndpoint(endpointName, definition)
        }
      }

      return api as any
    }

    return api.injectEndpoints({ endpoints: options.endpoints as any })
  }
}
