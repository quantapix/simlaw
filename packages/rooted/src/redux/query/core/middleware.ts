import type { BaseQueryFn } from '../../baseQueryTypes'
import type { QueryDefinition } from '../../endpointDefinitions'
import type { ConfigState, QueryCacheKey } from '../apiState'
import { QuerySubstateIdentifier } from '../apiState'
import type {
  QueryStateMeta,
  SubMiddlewareApi,
  SubMiddlewareBuilder,
  TimeoutId,
} from './types'

export type ReferenceCacheCollection = never

declare module '../../endpointDefinitions' {
  interface QueryExtraOptions<
    TagTypes extends string,
    ResultType,
    QueryArg,
    BaseQuery extends BaseQueryFn,
    ReducerPath extends string = string
  > {
    /**
     * Overrides the api-wide definition of `keepUnusedDataFor` for this endpoint only. _(This value is in seconds.)_
     *
     * This is how long RTK Query will keep your data cached for **after** the last component unsubscribes. For example, if you query an endpoint, then unmount the component, then mount another component that makes the same request within the given time frame, the most recent value will be served from the cache.
     */
    keepUnusedDataFor?: number
  }
}

// Per https://developer.mozilla.org/en-US/docs/Web/API/setTimeout#maximum_delay_value , browsers store
// `setTimeout()` timer values in a 32-bit int. If we pass a value in that's larger than that,
// it wraps and ends up executing immediately.
// Our `keepUnusedDataFor` values are in seconds, so adjust the numbers here accordingly.
export const THIRTY_TWO_BIT_MAX_INT = 2_147_483_647
export const THIRTY_TWO_BIT_MAX_TIMER_SECONDS = 2_147_483_647 / 1_000 - 1

export const build: SubMiddlewareBuilder = ({ reducerPath, api, context }) => {
  const { removeQueryResult, unsubscribeQueryResult } = api.internalActions

  return (mwApi) => {
    const currentRemovalTimeouts: QueryStateMeta<TimeoutId> = {}

    return (next) =>
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
            // Gotcha:
            // If rehydrating before the endpoint has been injected,the global `keepUnusedDataFor`
            // will be used instead of the endpoint-specific one.
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
      // Prevent `setTimeout` timers from overflowing a 32-bit internal int, by
      // clamping the max value to be at most 1000ms less than the 32-bit max.
      // Look, a 24.8-day keepalive ought to be enough for anybody, right? :)
      // Also avoid negative values too.
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
import { isAsyncThunkAction, isFulfilled } from '@reduxjs/toolkit'
import type { AnyAction } from 'redux'
import type { ThunkDispatch } from 'redux-thunk'
import type { BaseQueryFn, BaseQueryMeta } from '../../baseQueryTypes'
import { DefinitionType } from '../../endpointDefinitions'
import type { RootState } from '../apiState'
import type {
  MutationResultSelectorResult,
  QueryResultSelectorResult,
} from '../buildSelectors'
import { getMutationCacheKey } from '../buildSlice'
import type { PatchCollection, Recipe } from '../buildThunks'
import type {
  PromiseWithKnownReason,
  SubMiddlewareApi,
  SubMiddlewareBuilder,
} from './types'

export type ReferenceCacheLifecycle = never

declare module '../../endpointDefinitions' {
  export interface QueryBaseLifecycleApi<
    QueryArg,
    BaseQuery extends BaseQueryFn,
    ResultType,
    ReducerPath extends string = string
  > extends LifecycleApi<ReducerPath> {
    /**
     * Gets the current value of this cache entry.
     */
    getCacheEntry(): QueryResultSelectorResult<
      { type: DefinitionType.query } & BaseEndpointDefinition<
        QueryArg,
        BaseQuery,
        ResultType
      >
    >
    /**
     * Updates the current cache entry value.
     * For documentation see `api.util.updateQueryData`.
     */
    updateCachedData(updateRecipe: Recipe<ResultType>): PatchCollection
  }

  export interface MutationBaseLifecycleApi<
    QueryArg,
    BaseQuery extends BaseQueryFn,
    ResultType,
    ReducerPath extends string = string
  > extends LifecycleApi<ReducerPath> {
    /**
     * Gets the current value of this cache entry.
     */
    getCacheEntry(): MutationResultSelectorResult<
      { type: DefinitionType.mutation } & BaseEndpointDefinition<
        QueryArg,
        BaseQuery,
        ResultType
      >
    >
  }

  export interface LifecycleApi<ReducerPath extends string = string> {
    /**
     * The dispatch method for the store
     */
    dispatch: ThunkDispatch<any, any, AnyAction>
    /**
     * A method to get the current state
     */
    getState(): RootState<any, any, ReducerPath>
    /**
     * `extra` as provided as `thunk.extraArgument` to the `configureStore` `getDefaultMiddleware` option.
     */
    extra: unknown
    /**
     * A unique ID generated for the mutation
     */
    requestId: string
  }

  export interface CacheLifecyclePromises<
    ResultType = unknown,
    MetaType = unknown
  > {
    /**
     * Promise that will resolve with the first value for this cache key.
     * This allows you to `await` until an actual value is in cache.
     *
     * If the cache entry is removed from the cache before any value has ever
     * been resolved, this Promise will reject with
     * `new Error('Promise never resolved before cacheEntryRemoved.')`
     * to prevent memory leaks.
     * You can just re-throw that error (or not handle it at all) -
     * it will be caught outside of `cacheEntryAdded`.
     *
     * If you don't interact with this promise, it will not throw.
     */
    cacheDataLoaded: PromiseWithKnownReason<
      {
        /**
         * The (transformed) query result.
         */
        data: ResultType
        /**
         * The `meta` returned by the `baseQuery`
         */
        meta: MetaType
      },
      typeof neverResolvedError
    >
    /**
     * Promise that allows you to wait for the point in time when the cache entry
     * has been removed from the cache, by not being used/subscribed to any more
     * in the application for too long or by dispatching `api.util.resetApiState`.
     */
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
      api: MutationCacheLifecycleApi<
        QueryArg,
        BaseQuery,
        ResultType,
        ReducerPath
      >
    ): Promise<void> | void
  }
}

const neverResolvedError = new Error(
  'Promise never resolved before cacheEntryRemoved.'
) as Error & {
  message: 'Promise never resolved before cacheEntryRemoved.'
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

  return (mwApi) => {
    type CacheLifecycle = {
      valueResolved?(value: { data: unknown; meta: unknown }): unknown
      cacheEntryRemoved(): void
    }
    const lifecycleMap: Record<string, CacheLifecycle> = {}

    return (next) =>
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
      return ''
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

      const cacheEntryRemoved = new Promise<void>((resolve) => {
        lifecycle.cacheEntryRemoved = resolve
      })
      const cacheDataLoaded: PromiseWithKnownReason<
        { data: unknown; meta: unknown },
        typeof neverResolvedError
      > = Promise.race([
        new Promise<{ data: unknown; meta: unknown }>((resolve) => {
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
      Promise.resolve(runningHandler).catch((e) => {
        if (e === neverResolvedError) return
        throw e
      })
    }
  }
}
import type { SubMiddlewareBuilder } from './types'

export const build: SubMiddlewareBuilder = ({
  api,
  context: { apiUid },
  reducerPath,
}) => {
  return (mwApi) => {
    let initialized = false
    return (next) => (action) => {
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
        typeof process !== 'undefined' &&
        process.env.NODE_ENV === 'development'
      ) {
        if (
          api.internalActions.middlewareRegistered.match(action) &&
          action.payload === apiUid &&
          mwApi.getState()[reducerPath]?.config?.middlewareRegistered ===
            'conflict'
        ) {
          console.warn(`There is a mismatch between slice and middleware for the reducerPath "${reducerPath}".
You can only have one api per reducer path, this will lead to crashes in various situations!${
            reducerPath === 'api'
              ? `
If you have multiple apis, you *have* to specify the reducerPath option when using createApi!`
              : ''
          }`)
        }
      }

      return result
    }
  }
}
import { compose } from 'redux'

import type { AnyAction, Middleware, ThunkDispatch } from '@reduxjs/toolkit'
import { createAction } from '@reduxjs/toolkit'

import type {
  EndpointDefinitions,
  FullTagDescription,
} from '../../endpointDefinitions'
import type { QueryStatus, QuerySubState, RootState } from '../apiState'
import type { QueryThunkArg } from '../buildThunks'
import { build as buildCacheCollection } from './cacheCollection'
import { build as buildInvalidationByTags } from './invalidationByTags'
import { build as buildPolling } from './polling'
import type { BuildMiddlewareInput } from './types'
import { build as buildWindowEventHandling } from './windowEventHandling'
import { build as buildCacheLifecycle } from './cacheLifecycle'
import { build as buildQueryLifecycle } from './queryLifecycle'
import { build as buildDevMiddleware } from './devMiddleware'

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
  ].map((build) =>
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
  > = (mwApi) => (next) => {
    const applied = compose<typeof next>(
      ...middlewares.map((middleware) => middleware(mwApi))
    )(next)
    return (action) => {
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
      type: 'query',
      endpointName: querySubState.endpointName,
      originalArgs: querySubState.originalArgs,
      subscribe: false,
      forceRefetch: true,
      queryCacheKey: queryCacheKey as any,
      ...override,
    })
  }
}
import { isAnyOf, isFulfilled, isRejectedWithValue } from '@reduxjs/toolkit'

import type { FullTagDescription } from '../../endpointDefinitions'
import { calculateProvidedBy } from '../../endpointDefinitions'
import type { QueryCacheKey } from '../apiState'
import { QueryStatus } from '../apiState'
import { calculateProvidedByThunk } from '../buildThunks'
import type { SubMiddlewareApi, SubMiddlewareBuilder } from './types'

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

  return (mwApi) =>
    (next) =>
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
            'invalidatesTags',
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
import type { QuerySubstateIdentifier, Subscribers } from '../apiState'
import { QueryStatus } from '../apiState'
import type {
  QueryStateMeta,
  SubMiddlewareApi,
  SubMiddlewareBuilder,
  TimeoutId,
} from './types'

export const build: SubMiddlewareBuilder = ({
  reducerPath,
  queryThunk,
  api,
  refetchQuery,
}) => {
  return (mwApi) => {
    const currentPolls: QueryStateMeta<{
      nextPollTimestamp: number
      timeout?: TimeoutId
      pollingInterval: number
    }> = {}

    return (next) =>
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
import { isPending, isRejected, isFulfilled } from '@reduxjs/toolkit'
import type {
  BaseQueryError,
  BaseQueryFn,
  BaseQueryMeta,
} from '../../baseQueryTypes'
import { DefinitionType } from '../../endpointDefinitions'
import type { QueryFulfilledRejectionReason } from '../../endpointDefinitions'
import type { Recipe } from '../buildThunks'
import type {
  SubMiddlewareBuilder,
  PromiseWithKnownReason,
  PromiseConstructorWithKnownReason,
} from './types'

export type ReferenceQueryLifecycle = never

declare module '../../endpointDefinitions' {
  export interface QueryLifecyclePromises<
    ResultType,
    BaseQuery extends BaseQueryFn
  > {
    /**
     * Promise that will resolve with the (transformed) query result.
     *
     * If the query fails, this promise will reject with the error.
     *
     * This allows you to `await` for the query to finish.
     *
     * If you don't interact with this promise, it will not throw.
     */
    queryFulfilled: PromiseWithKnownReason<
      {
        /**
         * The (transformed) query result.
         */
        data: ResultType
        /**
         * The `meta` returned by the `baseQuery`
         */
        meta: BaseQueryMeta<BaseQuery>
      },
      QueryFulfilledRejectionReason<BaseQuery>
    >
  }

  type QueryFulfilledRejectionReason<BaseQuery extends BaseQueryFn> =
    | {
        error: BaseQueryError<BaseQuery>
        /**
         * If this is `false`, that means this error was returned from the `baseQuery` or `queryFn` in a controlled manner.
         */
        isUnhandledError: false
        /**
         * The `meta` returned by the `baseQuery`
         */
        meta: BaseQueryMeta<BaseQuery>
      }
    | {
        error: unknown
        meta?: undefined
        /**
         * If this is `true`, that means that this error is the result of `baseQueryFn`, `queryFn` or `transformResponse` throwing an error instead of handling it properly.
         * There can not be made any assumption about the shape of `error`.
         */
        isUnhandledError: true
      }

  interface QueryExtraOptions<
    TagTypes extends string,
    ResultType,
    QueryArg,
    BaseQuery extends BaseQueryFn,
    ReducerPath extends string = string
  > {
    /**
     * A function that is called when the individual query is started. The function is called with a lifecycle api object containing properties such as `queryFulfilled`, allowing code to be run when a query is started, when it succeeds, and when it fails (i.e. throughout the lifecycle of an individual query/mutation call).
     *
     * Can be used to perform side-effects throughout the lifecycle of the query.
     *
     * @example
     * ```ts
     * import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query'
     * import { messageCreated } from './notificationsSlice
     * export interface Post {
     *   id: number
     *   name: string
     * }
     *
     * const api = createApi({
     *   baseQuery: fetchBaseQuery({
     *     baseUrl: '/',
     *   }),
     *   endpoints: (build) => ({
     *     getPost: build.query<Post, number>({
     *       query: (id) => `post/${id}`,
     *       async onQueryStarted(id, { dispatch, queryFulfilled }) {
     *         // `onStart` side-effect
     *         dispatch(messageCreated('Fetching posts...'))
     *         try {
     *           const { data } = await queryFulfilled
     *           // `onSuccess` side-effect
     *           dispatch(messageCreated('Posts received!'))
     *         } catch (err) {
     *           // `onError` side-effect
     *           dispatch(messageCreated('Error fetching posts!'))
     *         }
     *       }
     *     }),
     *   }),
     * })
     * ```
     */
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
    /**
     * A function that is called when the individual mutation is started. The function is called with a lifecycle api object containing properties such as `queryFulfilled`, allowing code to be run when a query is started, when it succeeds, and when it fails (i.e. throughout the lifecycle of an individual query/mutation call).
     *
     * Can be used for `optimistic updates`.
     *
     * @example
     *
     * ```ts
     * import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query'
     * export interface Post {
     *   id: number
     *   name: string
     * }
     *
     * const api = createApi({
     *   baseQuery: fetchBaseQuery({
     *     baseUrl: '/',
     *   }),
     *   tagTypes: ['Post'],
     *   endpoints: (build) => ({
     *     getPost: build.query<Post, number>({
     *       query: (id) => `post/${id}`,
     *       providesTags: ['Post'],
     *     }),
     *     updatePost: build.mutation<void, Pick<Post, 'id'> & Partial<Post>>({
     *       query: ({ id, ...patch }) => ({
     *         url: `post/${id}`,
     *         method: 'PATCH',
     *         body: patch,
     *       }),
     *       invalidatesTags: ['Post'],
     *       async onQueryStarted({ id, ...patch }, { dispatch, queryFulfilled }) {
     *         const patchResult = dispatch(
     *           api.util.updateQueryData('getPost', id, (draft) => {
     *             Object.assign(draft, patch)
     *           })
     *         )
     *         try {
     *           await queryFulfilled
     *         } catch {
     *           patchResult.undo()
     *         }
     *       },
     *     }),
     *   }),
     * })
     * ```
     */
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
}

export const build: SubMiddlewareBuilder = ({
  api,
  context,
  queryThunk,
  mutationThunk,
}) => {
  const isPendingThunk = isPending(queryThunk, mutationThunk)
  const isRejectedThunk = isRejected(queryThunk, mutationThunk)
  const isFullfilledThunk = isFulfilled(queryThunk, mutationThunk)

  return (mwApi) => {
    type CacheLifecycle = {
      resolve(value: { data: unknown; meta: unknown }): unknown
      reject(value: QueryFulfilledRejectionReason<any>): unknown
    }
    const lifecycleMap: Record<string, CacheLifecycle> = {}

    return (next) =>
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
            // prevent uncaught promise rejections from happening.
            // if the original promise is used in any way, that will create a new promise that will throw again
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
import type {
  AnyAction,
  AsyncThunk,
  AsyncThunkAction,
  Middleware,
  MiddlewareAPI,
  ThunkDispatch,
} from '@reduxjs/toolkit'

import type { Api, ApiContext } from '../../apiTypes'
import type {
  AssertTagTypes,
  EndpointDefinitions,
} from '../../endpointDefinitions'
import type { QueryStatus, QuerySubState, RootState } from '../apiState'
import type {
  MutationThunk,
  QueryThunk,
  QueryThunkArg,
  ThunkResult,
} from '../buildThunks'

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
  /**
   * Creates a new Promise with a known rejection reason.
   * @param executor A callback used to initialize the promise. This callback is passed two arguments:
   * a resolve callback used to resolve the promise with a value or the result of another promise,
   * and a reject callback used to reject the promise with a provided reason or error.
   */
  new <T, R>(
    executor: (
      resolve: (value: T | PromiseLike<T>) => void,
      reject: (reason?: R) => void
    ) => void
  ): PromiseWithKnownReason<T, R>
}

export interface PromiseWithKnownReason<T, R>
  extends Omit<Promise<T>, 'then' | 'catch'> {
  /**
   * Attaches callbacks for the resolution and/or rejection of the Promise.
   * @param onfulfilled The callback to execute when the Promise is resolved.
   * @param onrejected The callback to execute when the Promise is rejected.
   * @returns A Promise for the completion of which ever callback is executed.
   */
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

  /**
   * Attaches a callback for only the rejection of the Promise.
   * @param onrejected The callback to execute when the Promise is rejected.
   * @returns A Promise for the completion of the callback.
   */
  catch<TResult = never>(
    onrejected?:
      | ((reason: R) => TResult | PromiseLike<TResult>)
      | undefined
      | null
  ): Promise<T | TResult>
}
import { QueryStatus } from '../apiState'
import type { QueryCacheKey } from '../apiState'
import { onFocus, onOnline } from '../setupListeners'
import type { SubMiddlewareApi, SubMiddlewareBuilder } from './types'

export const build: SubMiddlewareBuilder = ({
  reducerPath,
  context,
  api,
  refetchQuery,
}) => {
  const { removeQueryResult } = api.internalActions

  return (mwApi) =>
    (next) =>
    (action): any => {
      const result = next(action)

      if (onFocus.match(action)) {
        refetchValidQueries(mwApi, 'refetchOnFocus')
      }
      if (onOnline.match(action)) {
        refetchValidQueries(mwApi, 'refetchOnReconnect')
      }

      return result
    }

  function refetchValidQueries(
    api: SubMiddlewareApi,
    type: 'refetchOnFocus' | 'refetchOnReconnect'
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
          Object.values(subscriptionSubState).some(
            (sub) => sub[type] === true
          ) ||
          (Object.values(subscriptionSubState).every(
            (sub) => sub[type] === undefined
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
