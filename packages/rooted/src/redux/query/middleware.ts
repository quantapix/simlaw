/* eslint-disable @typescript-eslint/ban-types */
import { getMutationCacheKey, calculateProvidedByThunk } from "./build.js"
import * as qr from "../index.js"
import * as qt from "./types.js"
import * as qu from "./utils.js"
import type { Api, ApiContext } from "./module.js"

export const THIRTY_TWO_BIT_MAX_INT = 2_147_483_647
export const THIRTY_TWO_BIT_MAX_TIMER_SECONDS = 2_147_483_647 / 1_000 - 1

export interface BuildMiddlewareInput<
  Definitions extends qt.EndpointDefinitions,
  ReducerPath extends string,
  TagTypes extends string
> {
  reducerPath: ReducerPath
  context: ApiContext<Definitions>
  queryThunk: qt.QueryThunk
  mutationThunk: qt.MutationThunk
  api: Api<any, Definitions, ReducerPath, TagTypes>
  assertTagType: qt.AssertTagTypes
}

export function buildMiddleware<
  Definitions extends qt.EndpointDefinitions,
  ReducerPath extends string,
  TagTypes extends string
>(input: BuildMiddlewareInput<Definitions, ReducerPath, TagTypes>) {
  const { reducerPath, queryThunk } = input
  const actions = {
    invalidateTags: qr.createAction<
      Array<TagTypes | qt.FullTagDescription<TagTypes>>
    >(`${reducerPath}/invalidateTags`),
  }
  const middlewares = [
    buildDevMiddleware,
    buildCacheCollection,
    buildInvalidationByTags,
    buildPolling,
    buildWindowEventHandling,
    buildCacheLifecycle,
    buildQueryLifecycle,
  ].map(build =>
    build({
      ...(input as any as BuildMiddlewareInput<
        qt.EndpointDefinitions,
        string,
        string
      >),
      refetchQuery,
    })
  )
  const middleware: qt.Middleware<
    {},
    qt.RootState<Definitions, string, ReducerPath>,
    qt.ThunkDispatch<any, any, qt.AnyAction>
  > = mwApi => next => {
    const applied = qr.compose<typeof next>(
      ...middlewares.map(middleware => middleware(mwApi))
    )(next)
    return action => {
      if (mwApi.getState()[reducerPath]) {
        return applied(action)
      }
      return next(action)
    }
  }
  return { middleware, actions }
  function refetchQuery(
    querySubState: Exclude<
      qt.QuerySubState<any>,
      { status: qt.QueryStatus.uninitialized }
    >,
    queryCacheKey: string,
    override: Partial<qt.QueryThunkArg> = {}
  ) {
    return queryThunk({
      type: "query",
      endpointName: querySubState.endpointName,
      originalArgs: querySubState.originalArgs,
      subscribe: false,
      forceRefetch: true,
      queryCacheKey: queryCacheKey as any,
      ...override,
    })
  }
}

type SubMiddlewareApi = qt.MiddlewareAPI<
  qt.ThunkDispatch<any, any, qt.AnyAction>,
  qt.RootState<qt.EndpointDefinitions, string, string>
>
interface BuildSubMiddlewareInput
  extends BuildMiddlewareInput<qt.EndpointDefinitions, string, string> {
  refetchQuery(
    querySubState: Exclude<
      qt.QuerySubState<any>,
      { status: qt.QueryStatus.uninitialized }
    >,
    queryCacheKey: string,
    override?: Partial<qt.QueryThunkArg>
  ): qt.AsyncThunkAction<qt.ThunkResult, qt.QueryThunkArg, {}>
}
type SubMiddlewareBuilder = (
  input: BuildSubMiddlewareInput
) => qt.Middleware<
  {},
  qt.RootState<qt.EndpointDefinitions, string, string>,
  qt.ThunkDispatch<any, any, qt.AnyAction>
>

type TimeoutId = ReturnType<typeof setTimeout>
type QueryStateMeta<T> = Record<string, undefined | T>
const buildCacheCollection: SubMiddlewareBuilder = ({
  reducerPath,
  api,
  context,
}) => {
  const { removeQueryResult, unsubscribeQueryResult } = api.internalActions
  return mwApi => {
    const currentRemovalTimeouts: QueryStateMeta<TimeoutId> = {}
    return next =>
      (action): any => {
        const result = next(action)
        if (unsubscribeQueryResult.match(action)) {
          const state = mwApi.getState()[reducerPath]!
          const { queryCacheKey } = action.payload
          handleUnsubscribe(
            queryCacheKey,
            state.queries[queryCacheKey]?.endpointName,
            mwApi,
            state.config
          )
        }
        if (api.util.resetApiState.match(action)) {
          for (const [key, timeout] of Object.entries(currentRemovalTimeouts)) {
            if (timeout) clearTimeout(timeout)
            delete currentRemovalTimeouts[key]
          }
        }
        if (context.hasRehydrationInfo(action)) {
          const state = mwApi.getState()[reducerPath]!
          const { queries } = context.extractRehydrationInfo(action)!
          for (const [queryCacheKey, queryState] of Object.entries(queries)) {
            handleUnsubscribe(
              queryCacheKey as qt.QueryCacheKey,
              queryState?.endpointName,
              mwApi,
              state.config
            )
          }
        }
        return result
      }
    function handleUnsubscribe(
      queryCacheKey: qt.QueryCacheKey,
      endpointName: string | undefined,
      api: SubMiddlewareApi,
      config: qt.ConfigState<string>
    ) {
      const endpointDefinition = context.endpointDefinitions[
        endpointName!
      ] as qt.QueryDefinition<any, any, any, any>
      const keepUnusedDataFor =
        endpointDefinition?.keepUnusedDataFor ?? config.keepUnusedDataFor
      const finalKeepUnusedDataFor = Math.max(
        0,
        Math.min(keepUnusedDataFor, THIRTY_TWO_BIT_MAX_TIMER_SECONDS)
      )
      const currentTimeout = currentRemovalTimeouts[queryCacheKey]
      if (currentTimeout) {
        clearTimeout(currentTimeout)
      }
      currentRemovalTimeouts[queryCacheKey] = setTimeout(() => {
        const subscriptions =
          api.getState()[reducerPath]?.subscriptions[queryCacheKey]
        if (!subscriptions || Object.keys(subscriptions).length === 0) {
          api.dispatch(removeQueryResult({ queryCacheKey }))
        }
        delete currentRemovalTimeouts![queryCacheKey]
      }, finalKeepUnusedDataFor * 1000)
    }
  }
}
const buildCacheLifecycle: SubMiddlewareBuilder = ({
  api,
  reducerPath,
  context,
  queryThunk,
  mutationThunk,
}) => {
  const isQueryThunk = qr.isAsyncThunkAction(queryThunk)
  const isMutationThunk = qr.isAsyncThunkAction(mutationThunk)
  const isFullfilledThunk = qr.isFulfilled(queryThunk, mutationThunk)
  return mwApi => {
    type CacheLifecycle = {
      valueResolved?(value: { data: unknown; meta: unknown }): unknown
      cacheEntryRemoved(): void
    }
    const lifecycleMap: Record<string, CacheLifecycle> = {}
    return next =>
      (action): any => {
        const stateBefore = mwApi.getState()
        const result = next(action)
        const cacheKey = getCacheKey(action)
        if (queryThunk.pending.match(action)) {
          const oldState = stateBefore[reducerPath]?.queries[cacheKey]
          const state = mwApi.getState()[reducerPath]?.queries[cacheKey]
          if (!oldState && state) {
            handleNewKey(
              action.meta.arg.endpointName,
              action.meta.arg.originalArgs,
              cacheKey,
              mwApi,
              action.meta.requestId
            )
          }
        } else if (mutationThunk.pending.match(action)) {
          const state = mwApi.getState()[reducerPath]?.mutations[cacheKey]
          if (state) {
            handleNewKey(
              action.meta.arg.endpointName,
              action.meta.arg.originalArgs,
              cacheKey,
              mwApi,
              action.meta.requestId
            )
          }
        } else if (isFullfilledThunk(action)) {
          const lifecycle = lifecycleMap[cacheKey]
          if (lifecycle?.valueResolved) {
            lifecycle.valueResolved({
              data: action.payload,
              meta: action.meta.baseQueryMeta,
            })
            delete lifecycle.valueResolved
          }
        } else if (
          api.internalActions.removeQueryResult.match(action) ||
          api.internalActions.removeMutationResult.match(action)
        ) {
          const lifecycle = lifecycleMap[cacheKey]
          if (lifecycle) {
            delete lifecycleMap[cacheKey]
            lifecycle.cacheEntryRemoved()
          }
        } else if (api.util.resetApiState.match(action)) {
          for (const [cacheKey, lifecycle] of Object.entries(lifecycleMap)) {
            delete lifecycleMap[cacheKey]
            lifecycle.cacheEntryRemoved()
          }
        }
        return result
      }
    function getCacheKey(action: any) {
      if (isQueryThunk(action)) return action.meta.arg.queryCacheKey
      if (isMutationThunk(action)) return action.meta.requestId
      if (api.internalActions.removeQueryResult.match(action))
        return action.payload.queryCacheKey
      if (api.internalActions.removeMutationResult.match(action))
        return getMutationCacheKey(action.payload)
      return ""
    }
    function handleNewKey(
      endpointName: string,
      originalArgs: any,
      queryCacheKey: string,
      mwApi: SubMiddlewareApi,
      requestId: string
    ) {
      const endpointDefinition = context.endpointDefinitions[endpointName]
      const onCacheEntryAdded = endpointDefinition?.onCacheEntryAdded
      if (!onCacheEntryAdded) return
      const lifecycle = {} as CacheLifecycle
      const cacheEntryRemoved = new Promise<void>(resolve => {
        lifecycle.cacheEntryRemoved = resolve
      })
      const cacheDataLoaded: qt.PromiseWithKnownReason<
        { data: unknown; meta: unknown },
        typeof qt.neverResolvedError
      > = Promise.race([
        new Promise<{ data: unknown; meta: unknown }>(resolve => {
          lifecycle.valueResolved = resolve
        }),
        cacheEntryRemoved.then(() => {
          throw qt.neverResolvedError
        }),
      ])
      cacheDataLoaded.catch(() => {})
      lifecycleMap[queryCacheKey] = lifecycle
      const selector = (api.endpoints[endpointName] as any).select(
        endpointDefinition.type === qt.DefinitionType.query
          ? originalArgs
          : queryCacheKey
      )
      const extra = mwApi.dispatch((_, __, extra) => extra)
      const lifecycleApi = {
        ...mwApi,
        getCacheEntry: () => selector(mwApi.getState()),
        requestId,
        extra,
        updateCachedData: (endpointDefinition.type === qt.DefinitionType.query
          ? (updateRecipe: qt.Recipe<any>) =>
              mwApi.dispatch(
                api.util.updateQueryData(
                  endpointName as never,
                  originalArgs,
                  updateRecipe
                )
              )
          : undefined) as any,
        cacheDataLoaded,
        cacheEntryRemoved,
      }
      const runningHandler = onCacheEntryAdded(originalArgs, lifecycleApi)
      Promise.resolve(runningHandler).catch(e => {
        if (e === qt.neverResolvedError) return
        throw e
      })
    }
  }
}

const buildDevMiddleware: SubMiddlewareBuilder = ({
  api,
  context: { apiUid },
  reducerPath,
}) => {
  return mwApi => {
    let initialized = false
    return next => action => {
      if (!initialized) {
        initialized = true
        mwApi.dispatch(api.internalActions.middlewareRegistered(apiUid))
      }
      const result = next(action)
      if (api.util.resetApiState.match(action)) {
        mwApi.dispatch(api.internalActions.middlewareRegistered(apiUid))
      }
      if (
        typeof process !== "undefined" &&
        process.env["NODE_ENV"] === "development"
      ) {
        if (
          api.internalActions.middlewareRegistered.match(action) &&
          action.payload === apiUid &&
          mwApi.getState()[reducerPath]?.config?.middlewareRegistered ===
            "conflict"
        ) {
          console.warn(`There is a mismatch between slice and middleware for the reducerPath "${reducerPath}".
You can only have one api per reducer path, this will lead to crashes in various situations!${
            reducerPath === "api"
              ? `
If you have multiple apis, you *have* to specify the reducerPath option when using createApi!`
              : ""
          }`)
        }
      }
      return result
    }
  }
}

const buildInvalidationByTags: SubMiddlewareBuilder = ({
  reducerPath,
  context,
  context: { endpointDefinitions },
  mutationThunk,
  api,
  assertTagType,
  refetchQuery,
}) => {
  const { removeQueryResult } = api.internalActions
  return mwApi =>
    next =>
    (action): any => {
      const result = next(action)
      if (
        qr.isAnyOf(
          qr.isFulfilled(mutationThunk),
          qr.isRejectedWithValue(mutationThunk)
        )(action)
      ) {
        invalidateTags(
          calculateProvidedByThunk(
            action,
            "invalidatesTags",
            endpointDefinitions,
            assertTagType
          ),
          mwApi
        )
      }
      if (api.util.invalidateTags.match(action)) {
        invalidateTags(
          qt.calculateProvidedBy(
            action.payload,
            undefined,
            undefined,
            undefined,
            undefined,
            assertTagType
          ),
          mwApi
        )
      }
      return result
    }
  function invalidateTags(
    tags: readonly qt.FullTagDescription<string>[],
    mwApi: SubMiddlewareApi
  ) {
    const rootState = mwApi.getState()
    const state = rootState[reducerPath]!
    const toInvalidate = api.util.selectInvalidatedBy(rootState, tags)
    context.batch(() => {
      const valuesArray = Array.from(toInvalidate.values())
      for (const { queryCacheKey } of valuesArray) {
        const querySubState = state.queries[queryCacheKey]
        const subscriptionSubState = state.subscriptions[queryCacheKey]
        if (querySubState && subscriptionSubState) {
          if (Object.keys(subscriptionSubState).length === 0) {
            mwApi.dispatch(
              removeQueryResult({
                queryCacheKey: queryCacheKey as qt.QueryCacheKey,
              })
            )
          } else if (querySubState.status !== qt.QueryStatus.uninitialized) {
            mwApi.dispatch(refetchQuery(querySubState, queryCacheKey))
          } else {
          }
        }
      }
    })
  }
}

const buildPolling: SubMiddlewareBuilder = ({
  reducerPath,
  queryThunk,
  api,
  refetchQuery,
}) => {
  return mwApi => {
    const currentPolls: QueryStateMeta<{
      nextPollTimestamp: number
      timeout?: TimeoutId | undefined
      pollingInterval: number
    }> = {}
    return next =>
      (action): any => {
        const result = next(action)
        if (
          api.internalActions.updateSubscriptionOptions.match(action) ||
          api.internalActions.unsubscribeQueryResult.match(action)
        ) {
          updatePollingInterval(action.payload, mwApi)
        }
        if (
          queryThunk.pending.match(action) ||
          (queryThunk.rejected.match(action) && action.meta.condition)
        ) {
          updatePollingInterval(action.meta.arg, mwApi)
        }
        if (
          queryThunk.fulfilled.match(action) ||
          (queryThunk.rejected.match(action) && !action.meta.condition)
        ) {
          startNextPoll(action.meta.arg, mwApi)
        }
        if (api.util.resetApiState.match(action)) {
          clearPolls()
        }
        return result
      }
    function startNextPoll(
      { queryCacheKey }: qt.QuerySubstateIdentifier,
      api: SubMiddlewareApi
    ) {
      const state = api.getState()[reducerPath]!
      const querySubState = state.queries[queryCacheKey]
      const subscriptions = state.subscriptions[queryCacheKey]
      if (
        !querySubState ||
        querySubState.status === qt.QueryStatus.uninitialized
      )
        return
      const lowestPollingInterval = findLowestPollingInterval(subscriptions)
      if (!Number.isFinite(lowestPollingInterval)) return
      const currentPoll = currentPolls[queryCacheKey]
      if (currentPoll?.timeout) {
        clearTimeout(currentPoll.timeout)
        currentPoll.timeout = undefined
      }
      const nextPollTimestamp = Date.now() + lowestPollingInterval
      const currentInterval: typeof currentPolls[number] = (currentPolls[
        queryCacheKey
      ] = {
        nextPollTimestamp,
        pollingInterval: lowestPollingInterval,
        timeout: setTimeout(() => {
          currentInterval!.timeout = undefined
          api.dispatch(refetchQuery(querySubState, queryCacheKey))
        }, lowestPollingInterval),
      })
    }
    function updatePollingInterval(
      { queryCacheKey }: qt.QuerySubstateIdentifier,
      api: SubMiddlewareApi
    ) {
      const state = api.getState()[reducerPath]!
      const querySubState = state.queries[queryCacheKey]
      const subscriptions = state.subscriptions[queryCacheKey]
      if (
        !querySubState ||
        querySubState.status === qt.QueryStatus.uninitialized
      ) {
        return
      }
      const lowestPollingInterval = findLowestPollingInterval(subscriptions)
      if (!Number.isFinite(lowestPollingInterval)) {
        cleanupPollForKey(queryCacheKey)
        return
      }
      const currentPoll = currentPolls[queryCacheKey]
      const nextPollTimestamp = Date.now() + lowestPollingInterval
      if (!currentPoll || nextPollTimestamp < currentPoll.nextPollTimestamp) {
        startNextPoll({ queryCacheKey }, api)
      }
    }
    function cleanupPollForKey(key: string) {
      const existingPoll = currentPolls[key]
      if (existingPoll?.timeout) {
        clearTimeout(existingPoll.timeout)
      }
      delete currentPolls[key]
    }
    function clearPolls() {
      for (const key of Object.keys(currentPolls)) {
        cleanupPollForKey(key)
      }
    }
  }
  function findLowestPollingInterval(subscribers: qt.Subscribers = {}) {
    let lowestPollingInterval = Number.POSITIVE_INFINITY
    for (const subscription of Object.values(subscribers)) {
      if (subscription.pollingInterval)
        lowestPollingInterval = Math.min(
          subscription.pollingInterval,
          lowestPollingInterval
        )
    }
    return lowestPollingInterval
  }
}

const buildQueryLifecycle: SubMiddlewareBuilder = ({
  api,
  context,
  queryThunk,
  mutationThunk,
}) => {
  const isPendingThunk = qr.isPending(queryThunk, mutationThunk)
  const isRejectedThunk = qr.isRejected(queryThunk, mutationThunk)
  const isFullfilledThunk = qr.isFulfilled(queryThunk, mutationThunk)
  return mwApi => {
    type CacheLifecycle = {
      resolve(value: { data: unknown; meta: unknown }): unknown
      reject(value: qt.QueryFulfilledRejectionReason<any>): unknown
    }
    const lifecycleMap: Record<string, CacheLifecycle> = {}
    return next =>
      (action): any => {
        const result = next(action)
        if (isPendingThunk(action)) {
          const {
            requestId,
            arg: { endpointName, originalArgs },
          } = action.meta
          const endpointDefinition = context.endpointDefinitions[endpointName]
          const onQueryStarted = endpointDefinition?.onQueryStarted
          if (onQueryStarted) {
            const lifecycle = {} as CacheLifecycle
            const queryFulfilled =
              new (Promise as qt.PromiseConstructorWithKnownReason)<
                { data: unknown; meta: unknown },
                qt.QueryFulfilledRejectionReason<any>
              >((resolve, reject) => {
                lifecycle.resolve = resolve
                lifecycle.reject = reject
              })
            queryFulfilled.catch(() => {})
            lifecycleMap[requestId] = lifecycle
            const selector = (api.endpoints[endpointName] as any).select(
              endpointDefinition.type === qt.DefinitionType.query
                ? originalArgs
                : requestId
            )
            const extra = mwApi.dispatch((_, __, extra) => extra)
            const lifecycleApi = {
              ...mwApi,
              getCacheEntry: () => selector(mwApi.getState()),
              requestId,
              extra,
              updateCachedData: (endpointDefinition.type ===
              qt.DefinitionType.query
                ? (updateRecipe: qt.Recipe<any>) =>
                    mwApi.dispatch(
                      api.util.updateQueryData(
                        endpointName as never,
                        originalArgs,
                        updateRecipe
                      )
                    )
                : undefined) as any,
              queryFulfilled,
            }
            onQueryStarted(originalArgs, lifecycleApi)
          }
        } else if (isFullfilledThunk(action)) {
          const { requestId, baseQueryMeta } = action.meta
          lifecycleMap[requestId]?.resolve({
            data: action.payload,
            meta: baseQueryMeta,
          })
          delete lifecycleMap[requestId]
        } else if (isRejectedThunk(action)) {
          const { requestId, rejectedWithValue, baseQueryMeta } = action.meta
          lifecycleMap[requestId]?.reject({
            error: action.payload ?? action.error,
            isUnhandledError: !rejectedWithValue,
            meta: baseQueryMeta as any,
          })
          delete lifecycleMap[requestId]
        }
        return result
      }
  }
}

const buildWindowEventHandling: SubMiddlewareBuilder = ({
  reducerPath,
  context,
  api,
  refetchQuery,
}) => {
  const { removeQueryResult } = api.internalActions
  return mwApi =>
    next =>
    (action): any => {
      const result = next(action)
      if (qu.onFocus.match(action)) {
        refetchValidQueries(mwApi, "refetchOnFocus")
      }
      if (qu.onOnline.match(action)) {
        refetchValidQueries(mwApi, "refetchOnReconnect")
      }
      return result
    }
  function refetchValidQueries(
    api: SubMiddlewareApi,
    type: "refetchOnFocus" | "refetchOnReconnect"
  ) {
    const state = api.getState()[reducerPath]!
    const queries = state.queries
    const subscriptions = state.subscriptions
    context.batch(() => {
      for (const queryCacheKey of Object.keys(subscriptions)) {
        const querySubState = queries[queryCacheKey]
        const subscriptionSubState = subscriptions[queryCacheKey]
        if (!subscriptionSubState || !querySubState) continue
        const shouldRefetch =
          Object.values(subscriptionSubState).some(sub => sub[type] === true) ||
          (Object.values(subscriptionSubState).every(
            sub => sub[type] === undefined
          ) &&
            state.config[type])
        if (shouldRefetch) {
          if (Object.keys(subscriptionSubState).length === 0) {
            api.dispatch(
              removeQueryResult({
                queryCacheKey: queryCacheKey as qt.QueryCacheKey,
              })
            )
          } else if (querySubState.status !== qt.QueryStatus.uninitialized) {
            api.dispatch(refetchQuery(querySubState, queryCacheKey))
          }
        }
      }
    })
  }
}
