import * as qr from "react"
import * as qt from "./types.js"
import * as qu from "./utils.js"
import * as qx from "../index.js"
import { buildCreateApi } from "./build.js"
import {
  Api,
  ApiContext,
  ApiEndpointQuery,
  ApiEndpointMutation,
  CoreModule,
  Module,
  coreModule,
  PrefetchOptions,
  ReactHooksModule,
  reactHooksModuleName,
} from "./module.js"
import {
  useDispatch as rrUseDispatch,
  useSelector as rrUseSelector,
  useStore as rrUseStore,
  batch as rrBatch,
  shallowEqual,
} from "react-redux"
type RR = typeof import("react-redux")

export const useIsomorphicLayoutEffect =
  typeof window !== "undefined" &&
  window.document &&
  window.document.createElement
    ? qr.useLayoutEffect
    : qr.useEffect
export type TypedUseQueryHookResult<
  ResultType,
  QueryArg,
  BaseQuery extends qt.BaseQueryFn,
  R = qt.UseQueryStateDefaultResult<
    qt.QueryDefinition<QueryArg, BaseQuery, string, ResultType, string>
  >
> = TypedUseQueryStateResult<ResultType, QueryArg, BaseQuery, R> &
  TypedUseQuerySubscriptionResult<ResultType, QueryArg, BaseQuery>
export type TypedUseQuerySubscriptionResult<
  ResultType,
  QueryArg,
  BaseQuery extends qt.BaseQueryFn
> = qt.UseQuerySubscriptionResult<
  qt.QueryDefinition<QueryArg, BaseQuery, string, ResultType, string>
>
export type TypedUseQueryStateResult<
  ResultType,
  QueryArg,
  BaseQuery extends qt.BaseQueryFn,
  R = qt.UseQueryStateDefaultResult<
    qt.QueryDefinition<QueryArg, BaseQuery, string, ResultType, string>
  >
> = qt.NoInfer<R>
export type TypedUseMutationResult<
  ResultType,
  QueryArg,
  BaseQuery extends qt.BaseQueryFn,
  R = qt.MutationResultSelectorResult<
    qt.MutationDefinition<QueryArg, BaseQuery, string, ResultType, string>
  >
> = qt.UseMutationStateResult<
  qt.MutationDefinition<QueryArg, BaseQuery, string, ResultType, string>,
  R
>
const defaultQueryStateSelector: qt.QueryStateSelector<any, any> = x => x
const defaultMutationStateSelector: qt.MutationStateSelector<any, any> = x => x
const noPendingQueryStateSelector: qt.QueryStateSelector<
  any,
  any
> = selected => {
  if (selected.isUninitialized) {
    return {
      ...selected,
      isUninitialized: false,
      isFetching: true,
      isLoading: selected.data !== undefined ? false : true,
      status: qt.QueryStatus.pending,
    } as any
  }
  return selected
}
type GenericPrefetchThunk = (
  endpointName: any,
  arg: any,
  options: PrefetchOptions
) => qx.ThunkAction<void, any, any, qx.AnyAction>
export function buildHooks<Definitions extends qt.EndpointDefinitions>({
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
  serializeQueryArgs: qt.SerializeQueryArgs<any>
  context: ApiContext<Definitions>
}) {
  const usePossiblyImmediateEffect: (
    effect: () => void | undefined,
    deps?: qr.DependencyList
  ) => void = unstable__sideEffectsInRender ? cb => cb() : qr.useEffect
  return { buildQueryHooks, buildMutationHook, usePrefetch }
  function queryStatePreSelector(
    currentState: qt.QueryResultSelectorResult<any>,
    lastResult: qt.UseQueryStateDefaultResult<any> | undefined,
    queryArgs: any
  ): qt.UseQueryStateDefaultResult<any> {
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
    } as qt.UseQueryStateDefaultResult<any>
  }
  function usePrefetch<EndpointName extends qt.QueryKeys<Definitions>>(
    endpointName: EndpointName,
    defaultOptions?: PrefetchOptions
  ) {
    const dispatch = useDispatch<qt.ThunkDispatch<any, any, qx.AnyAction>>()
    const stableDefaultOptions = useShallowStableValue(defaultOptions)
    return qr.useCallback(
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
  function buildQueryHooks(name: string): qt.QueryHooks<any> {
    const useQuerySubscription: qt.UseQuerySubscription<any> = (
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
        qt.QueryDefinition<any, any, any, any, any>,
        Definitions
      >
      const dispatch = useDispatch<qt.ThunkDispatch<any, any, qx.AnyAction>>()
      const stableArg = useStableQueryArgs(
        skip ? qt.skipToken : arg,
        serializeQueryArgs,
        context.endpointDefinitions[name]!,
        name
      )
      const stableSubscriptionOptions = useShallowStableValue({
        refetchOnReconnect,
        refetchOnFocus,
        pollingInterval,
      })
      const promiseRef = qr.useRef<qt.QueryActionCreatorResult<any>>()
      const { queryCacheKey, requestId } = promiseRef.current || {}
      const subscriptionRemoved = useSelector(
        (state: qt.RootState<Definitions, string, string>) =>
          !!queryCacheKey &&
          !!requestId &&
          !state[api.reducerPath]?.subscriptions[queryCacheKey]?.[requestId]
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
        if (stableArg === qt.skipToken) {
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
      qr.useEffect(() => {
        return () => {
          promiseRef.current?.unsubscribe()
          promiseRef.current = undefined
        }
      }, [])
      return qr.useMemo(
        () => ({
          refetch: () => void promiseRef.current?.refetch(),
        }),
        []
      )
    }
    const useLazyQuerySubscription: qt.UseLazyQuerySubscription<any> = ({
      refetchOnReconnect,
      refetchOnFocus,
      pollingInterval = 0,
    } = {}) => {
      const { initiate } = api.endpoints[name] as ApiEndpointQuery<
        qt.QueryDefinition<any, any, any, any, any>,
        Definitions
      >
      const dispatch = useDispatch<qt.ThunkDispatch<any, any, qx.AnyAction>>()
      const [arg, setArg] = qr.useState<any>(qt.UNINITIALIZED_VALUE)
      const promiseRef = qr.useRef<
        qt.QueryActionCreatorResult<any> | undefined
      >()
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
      const subscriptionOptionsRef = qr.useRef(stableSubscriptionOptions)
      usePossiblyImmediateEffect(() => {
        subscriptionOptionsRef.current = stableSubscriptionOptions
      }, [stableSubscriptionOptions])
      const trigger = qr.useCallback(
        function (arg: any, preferCacheValue = false) {
          let promise: qt.QueryActionCreatorResult<any>
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
      qr.useEffect(() => {
        return () => {
          promiseRef?.current?.unsubscribe()
        }
      }, [])
      qr.useEffect(() => {
        if (arg !== qt.UNINITIALIZED_VALUE && !promiseRef.current) {
          trigger(arg, true)
        }
      }, [arg, trigger])
      return qr.useMemo(() => [trigger, arg] as const, [trigger, arg])
    }
    const useQueryState: qt.UseQueryState<any> = (
      arg: any,
      { skip = false, selectFromResult = defaultQueryStateSelector } = {}
    ) => {
      const { select } = api.endpoints[name] as ApiEndpointQuery<
        qt.QueryDefinition<any, any, any, any, any>,
        Definitions
      >
      const stableArg = useStableQueryArgs(
        skip ? qt.skipToken : arg,
        serializeQueryArgs,
        context.endpointDefinitions[name],
        name
      )
      type ApiRootState = Parameters<ReturnType<typeof select>>[0]
      const lastValue = qr.useRef<any>()
      const selectDefaultResult: qx.Selector<ApiRootState, any, [any]> =
        qr.useMemo(
          () =>
            qx.createSelector(
              [
                select(stableArg),
                (_: ApiRootState, lastResult: any) => lastResult,
                (_: ApiRootState) => stableArg,
              ],
              queryStatePreSelector
            ),
          [select, stableArg]
        )
      const querySelector: qx.Selector<ApiRootState, any, [any]> = qr.useMemo(
        () => qx.createSelector([selectDefaultResult], selectFromResult),
        [selectDefaultResult, selectFromResult]
      )
      const currentState = useSelector(
        (state: qt.RootState<Definitions, any, any>) =>
          querySelector(state, lastValue.current),
        shallowEqual
      )
      const store = useStore<qt.RootState<Definitions, any, any>>()
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
          skip: arg === qt.UNINITIALIZED_VALUE,
        })
        const info = qr.useMemo(() => ({ lastArg: arg }), [arg])
        return qr.useMemo(
          () => [trigger, queryStateResults, info],
          [trigger, queryStateResults, info]
        )
      },
      useQuery(arg, options) {
        const querySubscriptionResults = useQuerySubscription(arg, options)
        const queryStateResults = useQueryState(arg, {
          selectFromResult:
            arg === qt.skipToken || options?.skip
              ? undefined
              : noPendingQueryStateSelector,
          ...options,
        })
        const { data, status, isLoading, isSuccess, isError, error } =
          queryStateResults
        qr.useDebugValue({ data, status, isLoading, isSuccess, isError, error })
        return qr.useMemo(
          () => ({ ...queryStateResults, ...querySubscriptionResults }),
          [queryStateResults, querySubscriptionResults]
        )
      },
    }
  }
  function buildMutationHook(name: string): qt.UseMutation<any> {
    return ({
      selectFromResult = defaultMutationStateSelector,
      fixedCacheKey,
    } = {}) => {
      const { select, initiate } = api.endpoints[name] as ApiEndpointMutation<
        qt.MutationDefinition<any, any, any, any, any>,
        Definitions
      >
      const dispatch = useDispatch<qt.ThunkDispatch<any, any, qx.AnyAction>>()
      const [promise, setPromise] =
        qr.useState<qt.MutationActionCreatorResult<any>>()
      qr.useEffect(
        () => () => {
          if (!promise?.arg.fixedCacheKey) {
            promise?.reset()
          }
        },
        [promise]
      )
      const triggerMutation = qr.useCallback(
        function (arg: Parameters<typeof initiate>["0"]) {
          const promise = dispatch(initiate(arg, { fixedCacheKey }))
          setPromise(promise)
          return promise
        },
        [dispatch, initiate, fixedCacheKey]
      )
      const { requestId } = promise || {}
      const mutationSelector = qr.useMemo(
        () =>
          qx.createSelector(
            [select({ fixedCacheKey, requestId: promise?.requestId })],
            selectFromResult
          ),
        [select, promise, selectFromResult, fixedCacheKey]
      )
      const currentState = useSelector(mutationSelector, shallowEqual)
      const originalArgs =
        fixedCacheKey == null ? promise?.arg.originalArgs : undefined
      const reset = qr.useCallback(() => {
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
      qr.useDebugValue({
        endpointName,
        data,
        status,
        isLoading,
        isSuccess,
        isError,
        error,
      })
      const finalState = qr.useMemo(
        () => ({ ...currentState, originalArgs, reset }),
        [currentState, originalArgs, reset]
      )
      return qr.useMemo(
        () => [triggerMutation, finalState] as const,
        [triggerMutation, finalState]
      )
    }
  }
}

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
    qt.safeAssign(anyApi, { usePrefetch })
    qt.safeAssign(context, { batch })
    return {
      injectEndpoint(endpointName, definition) {
        if (qt.isQueryDefinition(definition)) {
          const {
            useQuery,
            useLazyQuery,
            useLazyQuerySubscription,
            useQueryState,
            useQuerySubscription,
          } = buildQueryHooks(endpointName)
          qt.safeAssign(anyApi.endpoints[endpointName]!, {
            useQuery,
            useLazyQuery,
            useLazyQuerySubscription,
            useQueryState,
            useQuerySubscription,
          })
          ;(api as any)[`use${qu.capitalize(endpointName)}Query`] = useQuery
          ;(api as any)[`useLazy${qu.capitalize(endpointName)}Query`] =
            useLazyQuery
        } else if (qt.isMutationDefinition(definition)) {
          const useMutation = buildMutationHook(endpointName)
          qt.safeAssign(anyApi.endpoints[endpointName]!, {
            useMutation,
          })
          ;(api as any)[`use${qu.capitalize(endpointName)}Mutation`] =
            useMutation
        }
      },
    }
  },
})

export const createApi = buildCreateApi(coreModule(), reactHooksModule())

export function useStableQueryArgs<T>(
  queryArgs: T,
  serialize: qt.SerializeQueryArgs<any>,
  endpointDefinition: qt.EndpointDefinition<any, any, any, any>,
  endpointName: string
) {
  const incoming = qr.useMemo(
    () => ({
      queryArgs,
      serialized:
        typeof queryArgs == "object"
          ? serialize({ queryArgs, endpointDefinition, endpointName })
          : queryArgs,
    }),
    [queryArgs, serialize, endpointDefinition, endpointName]
  )
  const cache = qr.useRef(incoming)
  qr.useEffect(() => {
    if (cache.current.serialized !== incoming.serialized) {
      cache.current = incoming
    }
  }, [incoming])
  return cache.current.serialized === incoming.serialized
    ? cache.current.queryArgs
    : queryArgs
}

export function useShallowStableValue<T>(value: T) {
  const cache = qr.useRef(value)
  qr.useEffect(() => {
    if (!shallowEqual(cache.current, value)) {
      cache.current = value
    }
  }, [value])
  return shallowEqual(cache.current, value) ? cache.current : value
}
