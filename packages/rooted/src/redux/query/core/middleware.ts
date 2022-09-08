/* eslint-disable @typescript-eslint/ban-types */
import type { BaseQueryFn } from "../../types"
import type {} from "../../endpointDefinitions"
import type { ConfigState, QueryCacheKey } from "../apiState"
import { QuerySubstateIdentifier } from "../apiState"
import type {
  DefinitionType,
  PromiseConstructorWithKnownReason,
  PromiseWithKnownReason,
  PromiseWithKnownReason,
  QueryDefinition,
  QueryStateMeta,
  QueryStateMeta,
  SubMiddlewareApi,
  SubMiddlewareApi,
  SubMiddlewareApi,
  SubMiddlewareBuilder,
  TimeoutId,
} from "./types.js"
import { isAsyncThunkAction, isFulfilled } from "@reduxjs/toolkit"
import type { AnyAction } from "redux"
import type { ThunkDispatch } from "redux-thunk"
import type { BaseQueryFn, BaseQueryMeta } from "../../types"
import type { RootState } from "../apiState"
import { getMutationCacheKey } from "../buildSlice"
import type { PatchCollection, Recipe } from "../buildThunks"
import { compose } from "redux"
import type { AnyAction, Middleware, ThunkDispatch } from "@reduxjs/toolkit"
import { createAction } from "@reduxjs/toolkit"
import type {
  EndpointDefinitions,
  FullTagDescription,
} from "../../endpointDefinitions"
import type { QueryStatus, QuerySubState, RootState } from "../apiState"
import type { QueryThunkArg } from "../buildThunks"
import { build as buildCacheCollection } from "./cacheCollection"
import { build as buildInvalidationByTags } from "./invalidationByTags"
import { build as buildPolling } from "./polling"
import type { BuildMiddlewareInput } from "./types"
import { build as buildWindowEventHandling } from "./windowEventHandling"
import { build as buildCacheLifecycle } from "./cacheLifecycle"
import { build as buildQueryLifecycle } from "./queryLifecycle"
import { build as buildDevMiddleware } from "./devMiddleware"
import { isAnyOf, isFulfilled, isRejectedWithValue } from "@reduxjs/toolkit"
import type { FullTagDescription } from "../../endpointDefinitions"
import { calculateProvidedBy } from "../../endpointDefinitions"
import type { QueryCacheKey } from "../apiState"
import { QueryStatus } from "../apiState"
import { calculateProvidedByThunk } from "../buildThunks"
import type { SubMiddlewareApi, SubMiddlewareBuilder } from "./types"
import type { QuerySubstateIdentifier, Subscribers } from "../apiState"
import { QueryStatus } from "../apiState"
import { isPending, isRejected, isFulfilled } from "@reduxjs/toolkit"
import type { BaseQueryError, BaseQueryFn, BaseQueryMeta } from "../../types"
import { DefinitionType } from "../../endpointDefinitions"
import type { QueryFulfilledRejectionReason } from "../../endpointDefinitions"
import type { Recipe } from "../buildThunks"
import type {
  AnyAction,
  AsyncThunk,
  AsyncThunkAction,
  Middleware,
  MiddlewareAPI,
  ThunkDispatch,
} from "@reduxjs/toolkit"
import type { Api, ApiContext } from "../../types"
import type {
  AssertTagTypes,
  EndpointDefinitions,
} from "../../endpointDefinitions"
import type { QueryStatus, QuerySubState, RootState } from "../apiState"
import type {
  MutationThunk,
  QueryThunk,
  QueryThunkArg,
  ThunkResult,
} from "../buildThunks"
import { QueryStatus } from "../apiState"
import type { QueryCacheKey } from "../apiState"
import { onFocus, onOnline } from "../setupListeners"
import type { SubMiddlewareApi, SubMiddlewareBuilder } from "./types"

export type ReferenceCacheCollection = never

export const THIRTY_TWO_BIT_MAX_INT = 2_147_483_647
export const THIRTY_TWO_BIT_MAX_TIMER_SECONDS = 2_147_483_647 / 1_000 - 1
export const build: SubMiddlewareBuilder = ({ reducerPath, api, context }) => {
  const { removeQueryResult, unsubscribeQueryResult } = api.internalActions
  return mwApi => {
    const currentRemovalTimeouts: QueryStateMeta<TimeoutId> = {}
    return next =>
      (action): any => {
        const result = next(action)
        if (unsubscribeQueryResult.match(action)) {
          const state = mwApi.getState()[reducerPath]
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
          const state = mwApi.getState()[reducerPath]
          const { queries } = context.extractRehydrationInfo(action)!
          for (const [queryCacheKey, queryState] of Object.entries(queries)) {
            handleUnsubscribe(
              queryCacheKey as QueryCacheKey,
              queryState?.endpointName,
              mwApi,
              state.config
            )
          }
        }
        return result
      }
    function handleUnsubscribe(
      queryCacheKey: QueryCacheKey,
      endpointName: string | undefined,
      api: SubMiddlewareApi,
      config: ConfigState<string>
    ) {
      const endpointDefinition = context.endpointDefinitions[
        endpointName!
      ] as QueryDefinition<any, any, any, any>
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
          api.getState()[reducerPath].subscriptions[queryCacheKey]
        if (!subscriptions || Object.keys(subscriptions).length === 0) {
          api.dispatch(removeQueryResult({ queryCacheKey }))
        }
        delete currentRemovalTimeouts![queryCacheKey]
      }, finalKeepUnusedDataFor * 1000)
    }
  }
}
export type ReferenceCacheLifecycle = never

const neverResolvedError = new Error(
  "Promise never resolved before cacheEntryRemoved."
) as Error & {
  message: "Promise never resolved before cacheEntryRemoved."
}

export const build: SubMiddlewareBuilder = ({
  api,
  reducerPath,
  context,
  queryThunk,
  mutationThunk,
}) => {
  const isQueryThunk = isAsyncThunkAction(queryThunk)
  const isMutationThunk = isAsyncThunkAction(mutationThunk)
  const isFullfilledThunk = isFulfilled(queryThunk, mutationThunk)
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
          const oldState = stateBefore[reducerPath].queries[cacheKey]
          const state = mwApi.getState()[reducerPath].queries[cacheKey]
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
          const state = mwApi.getState()[reducerPath].mutations[cacheKey]
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
      let lifecycle = {} as CacheLifecycle
      const cacheEntryRemoved = new Promise<void>(resolve => {
        lifecycle.cacheEntryRemoved = resolve
      })
      const cacheDataLoaded: PromiseWithKnownReason<
        { data: unknown; meta: unknown },
        typeof neverResolvedError
      > = Promise.race([
        new Promise<{ data: unknown; meta: unknown }>(resolve => {
          lifecycle.valueResolved = resolve
        }),
        cacheEntryRemoved.then(() => {
          throw neverResolvedError
        }),
      ])
      // prevent uncaught promise rejections from happening.
      // if the original promise is used in any way, that will create a new promise that will throw again
      cacheDataLoaded.catch(() => {})
      lifecycleMap[queryCacheKey] = lifecycle
      const selector = (api.endpoints[endpointName] as any).select(
        endpointDefinition.type === DefinitionType.query
          ? originalArgs
          : queryCacheKey
      )
      const extra = mwApi.dispatch((_, __, extra) => extra)
      const lifecycleApi = {
        ...mwApi,
        getCacheEntry: () => selector(mwApi.getState()),
        requestId,
        extra,
        updateCachedData: (endpointDefinition.type === DefinitionType.query
          ? (updateRecipe: Recipe<any>) =>
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
      // if a `neverResolvedError` was thrown, but not handled in the running handler, do not let it leak out further
      Promise.resolve(runningHandler).catch(e => {
        if (e === neverResolvedError) return
        throw e
      })
    }
  }
}
export const build: SubMiddlewareBuilder = ({
  api,
  context: { apiUid },
  reducerPath,
}) => {
  return mwApi => {
    let initialized = false
    return next => action => {
      if (!initialized) {
        initialized = true
        // dispatch before any other action
        mwApi.dispatch(api.internalActions.middlewareRegistered(apiUid))
      }
      const result = next(action)
      if (api.util.resetApiState.match(action)) {
        // dispatch after api reset
        mwApi.dispatch(api.internalActions.middlewareRegistered(apiUid))
      }
      if (
        typeof process !== "undefined" &&
        process.env.NODE_ENV === "development"
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
export function buildMiddleware<
  Definitions extends EndpointDefinitions,
  ReducerPath extends string,
  TagTypes extends string
>(input: BuildMiddlewareInput<Definitions, ReducerPath, TagTypes>) {
  const { reducerPath, queryThunk } = input
  const actions = {
    invalidateTags: createAction<
      Array<TagTypes | FullTagDescription<TagTypes>>
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
        EndpointDefinitions,
        string,
        string
      >),
      refetchQuery,
    })
  )
  const middleware: Middleware<
    {},
    RootState<Definitions, string, ReducerPath>,
    ThunkDispatch<any, any, AnyAction>
  > = mwApi => next => {
    const applied = compose<typeof next>(
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
      QuerySubState<any>,
      { status: QueryStatus.uninitialized }
    >,
    queryCacheKey: string,
    override: Partial<QueryThunkArg> = {}
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
export const build: SubMiddlewareBuilder = ({
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
        isAnyOf(
          isFulfilled(mutationThunk),
          isRejectedWithValue(mutationThunk)
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
          calculateProvidedBy(
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
    tags: readonly FullTagDescription<string>[],
    mwApi: SubMiddlewareApi
  ) {
    const rootState = mwApi.getState()
    const state = rootState[reducerPath]
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
                queryCacheKey: queryCacheKey as QueryCacheKey,
              })
            )
          } else if (querySubState.status !== QueryStatus.uninitialized) {
            mwApi.dispatch(refetchQuery(querySubState, queryCacheKey))
          } else {
          }
        }
      }
    })
  }
}
export const build: SubMiddlewareBuilder = ({
  reducerPath,
  queryThunk,
  api,
  refetchQuery,
}) => {
  return mwApi => {
    const currentPolls: QueryStateMeta<{
      nextPollTimestamp: number
      timeout?: TimeoutId
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
      { queryCacheKey }: QuerySubstateIdentifier,
      api: SubMiddlewareApi
    ) {
      const state = api.getState()[reducerPath]
      const querySubState = state.queries[queryCacheKey]
      const subscriptions = state.subscriptions[queryCacheKey]
      if (!querySubState || querySubState.status === QueryStatus.uninitialized)
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
      { queryCacheKey }: QuerySubstateIdentifier,
      api: SubMiddlewareApi
    ) {
      const state = api.getState()[reducerPath]
      const querySubState = state.queries[queryCacheKey]
      const subscriptions = state.subscriptions[queryCacheKey]
      if (
        !querySubState ||
        querySubState.status === QueryStatus.uninitialized
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
  function findLowestPollingInterval(subscribers: Subscribers = {}) {
    let lowestPollingInterval = Number.POSITIVE_INFINITY
    for (const subscription of Object.values(subscribers)) {
      if (!!subscription.pollingInterval)
        lowestPollingInterval = Math.min(
          subscription.pollingInterval,
          lowestPollingInterval
        )
    }
    return lowestPollingInterval
  }
}
export type ReferenceQueryLifecycle = never
export const build: SubMiddlewareBuilder = ({
  api,
  context,
  queryThunk,
  mutationThunk,
}) => {
  const isPendingThunk = isPending(queryThunk, mutationThunk)
  const isRejectedThunk = isRejected(queryThunk, mutationThunk)
  const isFullfilledThunk = isFulfilled(queryThunk, mutationThunk)
  return mwApi => {
    type CacheLifecycle = {
      resolve(value: { data: unknown; meta: unknown }): unknown
      reject(value: QueryFulfilledRejectionReason<any>): unknown
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
              new (Promise as PromiseConstructorWithKnownReason)<
                { data: unknown; meta: unknown },
                QueryFulfilledRejectionReason<any>
              >((resolve, reject) => {
                lifecycle.resolve = resolve
                lifecycle.reject = reject
              })
            queryFulfilled.catch(() => {})
            lifecycleMap[requestId] = lifecycle
            const selector = (api.endpoints[endpointName] as any).select(
              endpointDefinition.type === DefinitionType.query
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
              DefinitionType.query
                ? (updateRecipe: Recipe<any>) =>
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
export type QueryStateMeta<T> = Record<string, undefined | T>
export type TimeoutId = ReturnType<typeof setTimeout>
export interface BuildMiddlewareInput<
  Definitions extends EndpointDefinitions,
  ReducerPath extends string,
  TagTypes extends string
> {
  reducerPath: ReducerPath
  context: ApiContext<Definitions>
  queryThunk: QueryThunk
  mutationThunk: MutationThunk
  api: Api<any, Definitions, ReducerPath, TagTypes>
  assertTagType: AssertTagTypes
}
export type SubMiddlewareApi = MiddlewareAPI<
  ThunkDispatch<any, any, AnyAction>,
  RootState<EndpointDefinitions, string, string>
>
export interface BuildSubMiddlewareInput
  extends BuildMiddlewareInput<EndpointDefinitions, string, string> {
  refetchQuery(
    querySubState: Exclude<
      QuerySubState<any>,
      { status: QueryStatus.uninitialized }
    >,
    queryCacheKey: string,
    override?: Partial<QueryThunkArg>
  ): AsyncThunkAction<ThunkResult, QueryThunkArg, {}>
}
export type SubMiddlewareBuilder = (
  input: BuildSubMiddlewareInput
) => Middleware<
  {},
  RootState<EndpointDefinitions, string, string>,
  ThunkDispatch<any, any, AnyAction>
>
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
export const build: SubMiddlewareBuilder = ({
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
      if (onFocus.match(action)) {
        refetchValidQueries(mwApi, "refetchOnFocus")
      }
      if (onOnline.match(action)) {
        refetchValidQueries(mwApi, "refetchOnReconnect")
      }
      return result
    }
  function refetchValidQueries(
    api: SubMiddlewareApi,
    type: "refetchOnFocus" | "refetchOnReconnect"
  ) {
    const state = api.getState()[reducerPath]
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
                queryCacheKey: queryCacheKey as QueryCacheKey,
              })
            )
          } else if (querySubState.status !== QueryStatus.uninitialized) {
            api.dispatch(refetchQuery(querySubState, queryCacheKey))
          }
        }
      }
    })
  }
}
