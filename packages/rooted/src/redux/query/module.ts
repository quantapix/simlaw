/* eslint-disable @typescript-eslint/ban-types */
import {
  buildThunks,
  buildSlice,
  buildInitiate,
  SliceActions,
  buildSelectors,
  PatchQueryDataThunk,
  UpdateQueryDataThunk,
  QueryThunk,
} from "./build.js"
import * as qt from "./types.js"
import * as qi from "../../immer/index.js"
import * as qu from "./utils.js"
import {
  ReferenceCacheLifecycle,
  ReferenceQueryLifecycle,
  ReferenceCacheCollection,
  buildMiddleware,
} from "./middleware.js"

export type ModuleName = keyof ApiModules<any, any, any, any>

export interface ApiContext<Definitions extends qt.EndpointDefinitions> {
  apiUid: string
  endpointDefinitions: Definitions
  batch(cb: () => void): void
  extractRehydrationInfo: (
    action: qt.AnyAction
  ) => qt.CombinedState<any, any, any> | undefined
  hasRehydrationInfo: (action: qt.AnyAction) => boolean
}

export type Module<Name extends ModuleName> = {
  name: Name
  init<
    BaseQuery extends qt.BaseQueryFn,
    Definitions extends qt.EndpointDefinitions,
    ReducerPath extends string,
    TagTypes extends string
  >(
    api: Api<
      BaseQuery,
      qt.EndpointDefinitions,
      ReducerPath,
      TagTypes,
      ModuleName
    >,
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
      definition: qt.EndpointDefinition<any, any, any, any>
    ): void
  }
}

export type Api<
  BaseQuery extends qt.BaseQueryFn,
  Definitions extends qt.EndpointDefinitions,
  ReducerPath extends string,
  TagTypes extends string,
  Enhancers extends ModuleName = CoreModule
> = qt.UnionToIntersection<
  ApiModules<BaseQuery, Definitions, ReducerPath, TagTypes>[Enhancers]
> & {
  injectEndpoints<NewDefinitions extends qt.EndpointDefinitions>(_: {
    endpoints: (
      build: qt.EndpointBuilder<BaseQuery, TagTypes, ReducerPath>
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
    endpoints?: qt.ReplaceTagTypes<
      Definitions,
      TagTypes | qt.NoInfer<NewTagTypes>
    > extends infer NewDefinitions
      ? {
          [K in keyof NewDefinitions]?:
            | Partial<NewDefinitions[K]>
            | ((definition: NewDefinitions[K]) => void)
        }
      : never
  }): Api<
    BaseQuery,
    qt.ReplaceTagTypes<Definitions, TagTypes | NewTagTypes>,
    ReducerPath,
    TagTypes | NewTagTypes,
    Enhancers
  >
}

export interface ApiEndpointQuery<
  Definition extends qt.QueryDefinition<any, any, any, any, any>,
  Definitions extends qt.EndpointDefinitions
> extends Matchers<QueryThunk, Definition> {
  initiate: StartQueryActionCreator<Definition>
  select: QueryResultSelectorFactory<
    Definition,
    _RootState<
      Definitions,
      TagTypesFrom<Definition>,
      ReducerPathFrom<Definition>
    >
  >
}

export interface ApiEndpointMutation<
  Definition extends qt.MutationDefinition<any, any, any, any, any>,
  Definitions extends qt.EndpointDefinitions
> extends Matchers<MutationThunk, Definition> {
  initiate: StartMutationActionCreator<Definition>
  select: MutationResultSelectorFactory<
    Definition,
    _RootState<
      Definitions,
      TagTypesFrom<Definition>,
      ReducerPathFrom<Definition>
    >
  >
}

export type PrefetchOptions =
  | {
      ifOlderThan?: false | number
    }
  | { force?: boolean }
export const coreModuleName = Symbol()
export type CoreModule =
  | typeof coreModuleName
  | ReferenceCacheLifecycle
  | ReferenceQueryLifecycle
  | ReferenceCacheCollection

export const reactHooksModuleName = Symbol()
export type ReactHooksModule = typeof reactHooksModuleName

export interface ApiModules<
  BaseQuery extends qt.BaseQueryFn,
  Definitions extends qt.EndpointDefinitions,
  ReducerPath extends string,
  TagTypes extends string
> {
  [reactHooksModuleName]: {
    endpoints: {
      [K in keyof Definitions]: Definitions[K] extends qt.QueryDefinition<
        any,
        any,
        any,
        any,
        any
      >
        ? qt.QueryHooks<Definitions[K]>
        : Definitions[K] extends qt.MutationDefinition<any, any, any, any, any>
        ? qt.MutationHooks<Definitions[K]>
        : never
    }
    usePrefetch<EndpointName extends qt.QueryKeys<Definitions>>(
      endpointName: EndpointName,
      options?: PrefetchOptions
    ): (
      arg: qt.QueryArgFrom<Definitions[EndpointName]>,
      options?: PrefetchOptions
    ) => void
  } & qt.HooksWithUniqueNames<Definitions>
  [coreModuleName]: {
    reducerPath: ReducerPath
    internalActions: InternalActions
    reducer: qt.Reducer<
      qt.CombinedState<Definitions, TagTypes, ReducerPath>,
      qt.AnyAction
    >
    middleware: qt.Middleware<
      {},
      qt.RootState<Definitions, string, ReducerPath>,
      qt.ThunkDispatch<any, any, qt.AnyAction>
    >
    util: {
      getRunningOperationPromises: () => Array<Promise<unknown>>
      getRunningOperationPromise<
        EndpointName extends qt.QueryKeys<Definitions>
      >(
        endpointName: EndpointName,
        args: qt.QueryArgFrom<Definitions[EndpointName]>
      ):
        | qt.QueryActionCreatorResult<
            Definitions[EndpointName] & { type: "query" }
          >
        | undefined
      getRunningOperationPromise<
        EndpointName extends qt.MutationKeys<Definitions>
      >(
        endpointName: EndpointName,
        fixedCacheKeyOrRequestId: string
      ):
        | qt.MutationActionCreatorResult<
            Definitions[EndpointName] & { type: "mutation" }
          >
        | undefined
      prefetch<EndpointName extends qt.QueryKeys<Definitions>>(
        endpointName: EndpointName,
        arg: qt.QueryArgFrom<Definitions[EndpointName]>,
        options: PrefetchOptions
      ): qt.ThunkAction<void, any, any, qt.AnyAction>
      updateQueryData: UpdateQueryDataThunk<
        Definitions,
        qt.RootState<Definitions, string, ReducerPath>
      >
      /** @deprecated renamed to `updateQueryData` */
      updateQueryResult: UpdateQueryDataThunk<
        Definitions,
        qt.RootState<Definitions, string, ReducerPath>
      >
      patchQueryData: PatchQueryDataThunk<
        Definitions,
        qt.RootState<Definitions, string, ReducerPath>
      >
      /** @deprecated renamed to `patchQueryData` */
      patchQueryResult: PatchQueryDataThunk<
        Definitions,
        qt.RootState<Definitions, string, ReducerPath>
      >
      resetApiState: SliceActions["resetApiState"]
      invalidateTags: qt.ActionCreatorWithPayload<
        Array<qt.TagDescription<TagTypes>>,
        string
      >
      selectInvalidatedBy: (
        state: qt.RootState<Definitions, string, ReducerPath>,
        tags: ReadonlyArray<qt.TagDescription<TagTypes>>
      ) => Array<{
        endpointName: string
        originalArgs: any
        queryCacheKey: string
      }>
    }
    endpoints: {
      [K in keyof Definitions]: Definitions[K] extends qt.QueryDefinition<
        any,
        any,
        any,
        any,
        any
      >
        ? ApiEndpointQuery<Definitions[K], Definitions>
        : Definitions[K] extends qt.MutationDefinition<any, any, any, any, any>
        ? ApiEndpointMutation<Definitions[K], Definitions>
        : never
    }
  }
}

export type ListenerActions = {
  onOnline: typeof qu.onOnline
  onOffline: typeof qu.onOffline
  onFocus: typeof qu.onFocus
  onFocusLost: typeof qu.onFocusLost
}
export type InternalActions = SliceActions & ListenerActions
export const coreModule = (): Module<CoreModule> => ({
  name: coreModuleName,
  init(
    api,
    {
      baseQuery,
      tagTypes,
      reducerPath,
      serializeQueryArgs,
      keepUnusedDataFor,
      refetchOnMountOrArgChange,
      refetchOnFocus,
      refetchOnReconnect,
    },
    context
  ) {
    qi.enablePatches()
    qt.assertCast<qt.InternalSerializeQueryArgs>(serializeQueryArgs)
    const assertTagType: qt.AssertTagTypes = tag => {
      if (
        typeof process !== "undefined" &&
        process.env["NODE_ENV"] === "development"
      ) {
        if (!tagTypes.includes(tag.type as any)) {
          console.error(
            `Tag type '${tag.type}' was used, but not specified in \`tagTypes\`!`
          )
        }
      }
      return tag
    }
    Object.assign(api, {
      reducerPath,
      endpoints: {},
      internalActions: {
        onOnline: qu.onOnline,
        onOffline: qu.onOffline,
        onFocus: qu.onFocus,
        onFocusLost: qu.onFocusLost,
      },
      util: {},
    })
    const {
      queryThunk,
      mutationThunk,
      patchQueryData,
      updateQueryData,
      prefetch,
      buildMatchThunkActions,
    } = buildThunks({
      baseQuery,
      reducerPath,
      context,
      api,
      serializeQueryArgs,
    })
    const { reducer, actions: sliceActions } = buildSlice({
      context,
      queryThunk,
      mutationThunk,
      reducerPath,
      assertTagType,
      config: {
        refetchOnFocus,
        refetchOnReconnect,
        refetchOnMountOrArgChange,
        keepUnusedDataFor,
        reducerPath,
      },
    })
    qt.safeAssign(api.util, {
      patchQueryData,
      updateQueryData,
      prefetch,
      resetApiState: sliceActions.resetApiState,
    })
    qt.safeAssign(api.internalActions, sliceActions)
    Object.defineProperty(api.util, "updateQueryResult", {
      get() {
        if (
          typeof process !== "undefined" &&
          process.env["NODE_ENV"] === "development"
        ) {
          console.warn(
            "`api.util.updateQueryResult` has been renamed to `api.util.updateQueryData`, please change your code accordingly"
          )
        }
        return api.util.updateQueryData
      },
    })
    Object.defineProperty(api.util, "patchQueryResult", {
      get() {
        if (
          typeof process !== "undefined" &&
          process.env["NODE_ENV"] === "development"
        ) {
          console.warn(
            "`api.util.patchQueryResult` has been renamed to `api.util.patchQueryData`, please change your code accordingly"
          )
        }
        return api.util.patchQueryData
      },
    })
    const { middleware, actions: middlewareActions } = buildMiddleware({
      reducerPath,
      context,
      queryThunk,
      mutationThunk,
      api,
      assertTagType,
    })
    qt.safeAssign(api.util, middlewareActions)
    qt.safeAssign(api, { reducer: reducer as any, middleware })
    const { buildQuerySelector, buildMutationSelector, selectInvalidatedBy } =
      buildSelectors({
        serializeQueryArgs: serializeQueryArgs as any,
        reducerPath,
      })
    qt.safeAssign(api.util, { selectInvalidatedBy })
    const {
      buildInitiateQuery,
      buildInitiateMutation,
      getRunningOperationPromises,
      getRunningOperationPromise,
    } = buildInitiate({
      queryThunk,
      mutationThunk,
      api,
      serializeQueryArgs: serializeQueryArgs as any,
      context,
    })
    qt.safeAssign(api.util, {
      getRunningOperationPromises,
      getRunningOperationPromise,
    })
    return {
      name: coreModuleName,
      injectEndpoint(endpointName, definition) {
        const anyApi = api as any as Api<
          any,
          Record<string, any>,
          string,
          string,
          CoreModule
        >
        anyApi.endpoints[endpointName] ??= {} as any
        if (qt.isQueryDefinition(definition)) {
          qt.safeAssign(
            anyApi.endpoints[endpointName],
            {
              select: buildQuerySelector(endpointName, definition),
              initiate: buildInitiateQuery(endpointName, definition),
            },
            buildMatchThunkActions(queryThunk, endpointName)
          )
        } else if (qt.isMutationDefinition(definition)) {
          qt.safeAssign(
            anyApi.endpoints[endpointName],
            {
              select: buildMutationSelector(),
              initiate: buildInitiateMutation(endpointName),
            },
            buildMatchThunkActions(mutationThunk, endpointName)
          )
        }
      },
    }
  },
})
