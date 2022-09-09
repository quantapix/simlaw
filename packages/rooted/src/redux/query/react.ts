import type { AnyAction, ThunkAction, ThunkDispatch } from "@reduxjs/toolkit"
import { createSelector } from "@reduxjs/toolkit"
import type { Selector } from "@reduxjs/toolkit"
import type { DependencyList } from "react"
import {
  useCallback,
  useDebugValue,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { QueryStatus, skipToken } from "@reduxjs/toolkit/query"
import type { BaseQueryFn } from "../types"
import { coreModule, buildCreateApi, CreateApi } from "@reduxjs/toolkit/query"
import { reactHooksModule, reactHooksModuleName } from "./module"
import type { MutationHooks, QueryHooks } from "./buildHooks"
import type {
  EndpointDefinitions,
  QueryDefinition,
  MutationDefinition,
  QueryArgFrom,
} from "./endpointDefinitions"
import type { BaseQueryFn } from "./types"
import type { QueryKeys } from "./core/apiState"
import type { PrefetchOptions } from "./core/module"
import type { MutationHooks, QueryHooks } from "./buildHooks"
import { buildHooks } from "./buildHooks"
import { isQueryDefinition, isMutationDefinition } from "../endpointDefinitions"
import type {
  EndpointDefinitions,
  QueryDefinition,
  MutationDefinition,
  QueryArgFrom,
} from "./endpointDefinitions"
import type { Api, Module } from "../types"
import { capitalize } from "../utils"
import { safeAssign } from "../tsHelpers"
import type { BaseQueryFn } from "./types"
import {
  useDispatch as rrUseDispatch,
  useSelector as rrUseSelector,
  useStore as rrUseStore,
  batch as rrBatch,
} from "react-redux"
import type { QueryKeys } from "../core/apiState"
import type { PrefetchOptions } from "../core/module"
import type { UseMutation, UseLazyQuery, UseQuery } from "../buildHooks"
import type {
  DefinitionType,
  EndpointDefinitions,
  MutationDefinition,
  QueryDefinition,
} from "./endpointDefinitions"
import { useEffect, useRef, useMemo } from "react"
import type { SerializeQueryArgs } from "./defaultSerializeQueryArgs"
import type { EndpointDefinition } from "./endpointDefinitions"
import { useEffect, useRef } from "react"
import { shallowEqual } from "react-redux"

export const useIsomorphicLayoutEffect =
  typeof window !== "undefined" &&
  window.document &&
  window.document.createElement
    ? useLayoutEffect
    : useEffect
export type TypedUseQueryHookResult<
  ResultType,
  QueryArg,
  BaseQuery extends BaseQueryFn,
  R = UseQueryStateDefaultResult<
    QueryDefinition<QueryArg, BaseQuery, string, ResultType, string>
  >
> = TypedUseQueryStateResult<ResultType, QueryArg, BaseQuery, R> &
  TypedUseQuerySubscriptionResult<ResultType, QueryArg, BaseQuery>
export type TypedUseQuerySubscriptionResult<
  ResultType,
  QueryArg,
  BaseQuery extends BaseQueryFn
> = UseQuerySubscriptionResult<
  QueryDefinition<QueryArg, BaseQuery, string, ResultType, string>
>
export type TypedUseQueryStateResult<
  ResultType,
  QueryArg,
  BaseQuery extends BaseQueryFn,
  R = UseQueryStateDefaultResult<
    QueryDefinition<QueryArg, BaseQuery, string, ResultType, string>
  >
> = NoInfer<R>
export type TypedUseMutationResult<
  ResultType,
  QueryArg,
  BaseQuery extends BaseQueryFn,
  R = MutationResultSelectorResult<
    MutationDefinition<QueryArg, BaseQuery, string, ResultType, string>
  >
> = UseMutationStateResult<
  MutationDefinition<QueryArg, BaseQuery, string, ResultType, string>,
  R
>
const defaultQueryStateSelector: QueryStateSelector<any, any> = x => x
const defaultMutationStateSelector: MutationStateSelector<any, any> = x => x
const noPendingQueryStateSelector: QueryStateSelector<any, any> = selected => {
  if (selected.isUninitialized) {
    return {
      ...selected,
      isUninitialized: false,
      isFetching: true,
      isLoading: selected.data !== undefined ? false : true,
      status: QueryStatus.pending,
    } as any
  }
  return selected
}
type GenericPrefetchThunk = (
  endpointName: any,
  arg: any,
  options: PrefetchOptions
) => ThunkAction<void, any, any, AnyAction>
export function buildHooks<Definitions extends EndpointDefinitions>({
  api,
  moduleOptions: {
    batch,
    useDispatch,
    useSelector,
    useStore,
    unstable__sideEffectsInRender,
  },
  serializeQueryArgs,
  context,
}: {
  api: Api<any, Definitions, any, any, CoreModule>
  moduleOptions: Required<ReactHooksModuleOptions>
  serializeQueryArgs: SerializeQueryArgs<any>
  context: ApiContext<Definitions>
}) {
  const usePossiblyImmediateEffect: (
    effect: () => void | undefined,
    deps?: DependencyList
  ) => void = unstable__sideEffectsInRender ? cb => cb() : useEffect
  return { buildQueryHooks, buildMutationHook, usePrefetch }
  function queryStatePreSelector(
    currentState: QueryResultSelectorResult<any>,
    lastResult: UseQueryStateDefaultResult<any> | undefined,
    queryArgs: any
  ): UseQueryStateDefaultResult<any> {
    if (lastResult?.endpointName && currentState.isUninitialized) {
      const { endpointName } = lastResult
      const endpointDefinition = context.endpointDefinitions[endpointName]
      if (
        serializeQueryArgs({
          queryArgs: lastResult.originalArgs,
          endpointDefinition,
          endpointName,
        }) ===
        serializeQueryArgs({
          queryArgs,
          endpointDefinition,
          endpointName,
        })
      )
        lastResult = undefined
    }
    let data = currentState.isSuccess ? currentState.data : lastResult?.data
    if (data === undefined) data = currentState.data
    const hasData = data !== undefined
    const isFetching = currentState.isLoading
    const isLoading = !hasData && isFetching
    const isSuccess = currentState.isSuccess || (isFetching && hasData)
    return {
      ...currentState,
      data,
      currentData: currentState.data,
      isFetching,
      isLoading,
      isSuccess,
    } as UseQueryStateDefaultResult<any>
  }
  function usePrefetch<EndpointName extends QueryKeys<Definitions>>(
    endpointName: EndpointName,
    defaultOptions?: PrefetchOptions
  ) {
    const dispatch = useDispatch<ThunkDispatch<any, any, AnyAction>>()
    const stableDefaultOptions = useShallowStableValue(defaultOptions)
    return useCallback(
      (arg: any, options?: PrefetchOptions) =>
        dispatch(
          (api.util.prefetch as GenericPrefetchThunk)(endpointName, arg, {
            ...stableDefaultOptions,
            ...options,
          })
        ),
      [endpointName, dispatch, stableDefaultOptions]
    )
  }
  function buildQueryHooks(name: string): QueryHooks<any> {
    const useQuerySubscription: UseQuerySubscription<any> = (
      arg: any,
      {
        refetchOnReconnect,
        refetchOnFocus,
        refetchOnMountOrArgChange,
        skip = false,
        pollingInterval = 0,
      } = {}
    ) => {
      const { initiate } = api.endpoints[name] as ApiEndpointQuery<
        QueryDefinition<any, any, any, any, any>,
        Definitions
      >
      const dispatch = useDispatch<ThunkDispatch<any, any, AnyAction>>()
      const stableArg = useStableQueryArgs(
        skip ? skipToken : arg,
        serializeQueryArgs,
        context.endpointDefinitions[name],
        name
      )
      const stableSubscriptionOptions = useShallowStableValue({
        refetchOnReconnect,
        refetchOnFocus,
        pollingInterval,
      })
      const promiseRef = useRef<QueryActionCreatorResult<any>>()
      let { queryCacheKey, requestId } = promiseRef.current || {}
      const subscriptionRemoved = useSelector(
        (state: RootState<Definitions, string, string>) =>
          !!queryCacheKey &&
          !!requestId &&
          !state[api.reducerPath].subscriptions[queryCacheKey]?.[requestId]
      )
      usePossiblyImmediateEffect((): void | undefined => {
        promiseRef.current = undefined
      }, [subscriptionRemoved])
      usePossiblyImmediateEffect((): void | undefined => {
        const lastPromise = promiseRef.current
        if (
          typeof process !== "undefined" &&
          process.env["NODE_ENV"] === "removeMeOnCompilation"
        ) {
          console.log(subscriptionRemoved)
        }
        if (stableArg === skipToken) {
          lastPromise?.unsubscribe()
          promiseRef.current = undefined
          return
        }
        const lastSubscriptionOptions = promiseRef.current?.subscriptionOptions
        if (!lastPromise || lastPromise.arg !== stableArg) {
          lastPromise?.unsubscribe()
          const promise = dispatch(
            initiate(stableArg, {
              subscriptionOptions: stableSubscriptionOptions,
              forceRefetch: refetchOnMountOrArgChange,
            })
          )
          promiseRef.current = promise
        } else if (stableSubscriptionOptions !== lastSubscriptionOptions) {
          lastPromise.updateSubscriptionOptions(stableSubscriptionOptions)
        }
      }, [
        dispatch,
        initiate,
        refetchOnMountOrArgChange,
        stableArg,
        stableSubscriptionOptions,
        subscriptionRemoved,
      ])
      useEffect(() => {
        return () => {
          promiseRef.current?.unsubscribe()
          promiseRef.current = undefined
        }
      }, [])
      return useMemo(
        () => ({
          refetch: () => void promiseRef.current?.refetch(),
        }),
        []
      )
    }
    const useLazyQuerySubscription: UseLazyQuerySubscription<any> = ({
      refetchOnReconnect,
      refetchOnFocus,
      pollingInterval = 0,
    } = {}) => {
      const { initiate } = api.endpoints[name] as ApiEndpointQuery<
        QueryDefinition<any, any, any, any, any>,
        Definitions
      >
      const dispatch = useDispatch<ThunkDispatch<any, any, AnyAction>>()
      const [arg, setArg] = useState<any>(UNINITIALIZED_VALUE)
      const promiseRef = useRef<QueryActionCreatorResult<any> | undefined>()
      const stableSubscriptionOptions = useShallowStableValue({
        refetchOnReconnect,
        refetchOnFocus,
        pollingInterval,
      })
      usePossiblyImmediateEffect(() => {
        const lastSubscriptionOptions = promiseRef.current?.subscriptionOptions
        if (stableSubscriptionOptions !== lastSubscriptionOptions) {
          promiseRef.current?.updateSubscriptionOptions(
            stableSubscriptionOptions
          )
        }
      }, [stableSubscriptionOptions])
      const subscriptionOptionsRef = useRef(stableSubscriptionOptions)
      usePossiblyImmediateEffect(() => {
        subscriptionOptionsRef.current = stableSubscriptionOptions
      }, [stableSubscriptionOptions])
      const trigger = useCallback(
        function (arg: any, preferCacheValue = false) {
          let promise: QueryActionCreatorResult<any>
          batch(() => {
            promiseRef.current?.unsubscribe()
            promiseRef.current = promise = dispatch(
              initiate(arg, {
                subscriptionOptions: subscriptionOptionsRef.current,
                forceRefetch: !preferCacheValue,
              })
            )
            setArg(arg)
          })
          return promise!
        },
        [dispatch, initiate]
      )
      useEffect(() => {
        return () => {
          promiseRef?.current?.unsubscribe()
        }
      }, [])
      useEffect(() => {
        if (arg !== UNINITIALIZED_VALUE && !promiseRef.current) {
          trigger(arg, true)
        }
      }, [arg, trigger])
      return useMemo(() => [trigger, arg] as const, [trigger, arg])
    }
    const useQueryState: UseQueryState<any> = (
      arg: any,
      { skip = false, selectFromResult = defaultQueryStateSelector } = {}
    ) => {
      const { select } = api.endpoints[name] as ApiEndpointQuery<
        QueryDefinition<any, any, any, any, any>,
        Definitions
      >
      const stableArg = useStableQueryArgs(
        skip ? skipToken : arg,
        serializeQueryArgs,
        context.endpointDefinitions[name],
        name
      )
      type ApiRootState = Parameters<ReturnType<typeof select>>[0]
      const lastValue = useRef<any>()
      const selectDefaultResult: Selector<ApiRootState, any, [any]> = useMemo(
        () =>
          createSelector(
            [
              select(stableArg),
              (_: ApiRootState, lastResult: any) => lastResult,
              (_: ApiRootState) => stableArg,
            ],
            queryStatePreSelector
          ),
        [select, stableArg]
      )
      const querySelector: Selector<ApiRootState, any, [any]> = useMemo(
        () => createSelector([selectDefaultResult], selectFromResult),
        [selectDefaultResult, selectFromResult]
      )
      const currentState = useSelector(
        (state: RootState<Definitions, any, any>) =>
          querySelector(state, lastValue.current),
        shallowEqual
      )
      const store = useStore<RootState<Definitions, any, any>>()
      const newLastValue = selectDefaultResult(
        store.getState(),
        lastValue.current
      )
      useIsomorphicLayoutEffect(() => {
        lastValue.current = newLastValue
      }, [newLastValue])
      return currentState
    }
    return {
      useQueryState,
      useQuerySubscription,
      useLazyQuerySubscription,
      useLazyQuery(options) {
        const [trigger, arg] = useLazyQuerySubscription(options)
        const queryStateResults = useQueryState(arg, {
          ...options,
          skip: arg === UNINITIALIZED_VALUE,
        })
        const info = useMemo(() => ({ lastArg: arg }), [arg])
        return useMemo(
          () => [trigger, queryStateResults, info],
          [trigger, queryStateResults, info]
        )
      },
      useQuery(arg, options) {
        const querySubscriptionResults = useQuerySubscription(arg, options)
        const queryStateResults = useQueryState(arg, {
          selectFromResult:
            arg === skipToken || options?.skip
              ? undefined
              : noPendingQueryStateSelector,
          ...options,
        })
        const { data, status, isLoading, isSuccess, isError, error } =
          queryStateResults
        useDebugValue({ data, status, isLoading, isSuccess, isError, error })
        return useMemo(
          () => ({ ...queryStateResults, ...querySubscriptionResults }),
          [queryStateResults, querySubscriptionResults]
        )
      },
    }
  }
  function buildMutationHook(name: string): UseMutation<any> {
    return ({
      selectFromResult = defaultMutationStateSelector,
      fixedCacheKey,
    } = {}) => {
      const { select, initiate } = api.endpoints[name] as ApiEndpointMutation<
        MutationDefinition<any, any, any, any, any>,
        Definitions
      >
      const dispatch = useDispatch<ThunkDispatch<any, any, AnyAction>>()
      const [promise, setPromise] = useState<MutationActionCreatorResult<any>>()
      useEffect(
        () => () => {
          if (!promise?.arg.fixedCacheKey) {
            promise?.reset()
          }
        },
        [promise]
      )
      const triggerMutation = useCallback(
        function (arg: Parameters<typeof initiate>["0"]) {
          const promise = dispatch(initiate(arg, { fixedCacheKey }))
          setPromise(promise)
          return promise
        },
        [dispatch, initiate, fixedCacheKey]
      )
      const { requestId } = promise || {}
      const mutationSelector = useMemo(
        () =>
          createSelector(
            [select({ fixedCacheKey, requestId: promise?.requestId })],
            selectFromResult
          ),
        [select, promise, selectFromResult, fixedCacheKey]
      )
      const currentState = useSelector(mutationSelector, shallowEqual)
      const originalArgs =
        fixedCacheKey == null ? promise?.arg.originalArgs : undefined
      const reset = useCallback(() => {
        batch(() => {
          if (promise) {
            setPromise(undefined)
          }
          if (fixedCacheKey) {
            dispatch(
              api.internalActions.removeMutationResult({
                requestId,
                fixedCacheKey,
              })
            )
          }
        })
      }, [dispatch, fixedCacheKey, promise, requestId])
      const {
        endpointName,
        data,
        status,
        isLoading,
        isSuccess,
        isError,
        error,
      } = currentState
      useDebugValue({
        endpointName,
        data,
        status,
        isLoading,
        isSuccess,
        isError,
        error,
      })
      const finalState = useMemo(
        () => ({ ...currentState, originalArgs, reset }),
        [currentState, originalArgs, reset]
      )
      return useMemo(
        () => [triggerMutation, finalState] as const,
        [triggerMutation, finalState]
      )
    }
  }
}
const createApi = buildCreateApi(coreModule(), reactHooksModule())
export { createApi, reactHooksModule }

type RR = typeof import("react-redux")

export interface ReactHooksModuleOptions {
  batch?: RR["batch"]
  useDispatch?: RR["useDispatch"]
  useSelector?: RR["useSelector"]
  useStore?: RR["useStore"]
  unstable__sideEffectsInRender?: boolean
}

export const reactHooksModule = ({
  batch = rrBatch,
  useDispatch = rrUseDispatch,
  useSelector = rrUseSelector,
  useStore = rrUseStore,
  unstable__sideEffectsInRender = false,
}: ReactHooksModuleOptions = {}): Module<ReactHooksModule> => ({
  name: reactHooksModuleName,
  init(api, { serializeQueryArgs }, context) {
    const anyApi = api as any as Api<
      any,
      Record<string, any>,
      string,
      string,
      ReactHooksModule
    >
    const { buildQueryHooks, buildMutationHook, usePrefetch } = buildHooks({
      api,
      moduleOptions: {
        batch,
        useDispatch,
        useSelector,
        useStore,
        unstable__sideEffectsInRender,
      },
      serializeQueryArgs,
      context,
    })
    safeAssign(anyApi, { usePrefetch })
    safeAssign(context, { batch })
    return {
      injectEndpoint(endpointName, definition) {
        if (isQueryDefinition(definition)) {
          const {
            useQuery,
            useLazyQuery,
            useLazyQuerySubscription,
            useQueryState,
            useQuerySubscription,
          } = buildQueryHooks(endpointName)
          safeAssign(anyApi.endpoints[endpointName], {
            useQuery,
            useLazyQuery,
            useLazyQuerySubscription,
            useQueryState,
            useQuerySubscription,
          })
          ;(api as any)[`use${capitalize(endpointName)}Query`] = useQuery
          ;(api as any)[`useLazy${capitalize(endpointName)}Query`] =
            useLazyQuery
        } else if (isMutationDefinition(definition)) {
          const useMutation = buildMutationHook(endpointName)
          safeAssign(anyApi.endpoints[endpointName], {
            useMutation,
          })
          ;(api as any)[`use${capitalize(endpointName)}Mutation`] = useMutation
        }
      },
    }
  },
})

export function useStableQueryArgs<T>(
  queryArgs: T,
  serialize: SerializeQueryArgs<any>,
  endpointDefinition: EndpointDefinition<any, any, any, any>,
  endpointName: string
) {
  const incoming = useMemo(
    () => ({
      queryArgs,
      serialized:
        typeof queryArgs == "object"
          ? serialize({ queryArgs, endpointDefinition, endpointName })
          : queryArgs,
    }),
    [queryArgs, serialize, endpointDefinition, endpointName]
  )
  const cache = useRef(incoming)
  useEffect(() => {
    if (cache.current.serialized !== incoming.serialized) {
      cache.current = incoming
    }
  }, [incoming])
  return cache.current.serialized === incoming.serialized
    ? cache.current.queryArgs
    : queryArgs
}

export function useShallowStableValue<T>(value: T) {
  const cache = useRef(value)
  useEffect(() => {
    if (!shallowEqual(cache.current, value)) {
      cache.current = value
    }
  }, [value])
  return shallowEqual(cache.current, value) ? cache.current : value
}
