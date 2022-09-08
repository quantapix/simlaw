/* eslint-disable @typescript-eslint/ban-types */
import type { PatchQueryDataThunk, UpdateQueryDataThunk } from "./buildThunks"
import { buildThunks } from "./buildThunks"
import type {
  ActionCreatorWithPayload,
  AnyAction,
  Middleware,
  Reducer,
  ThunkAction,
  ThunkDispatch,
} from "@reduxjs/toolkit"
import type {
  EndpointDefinitions,
  QueryArgFrom,
  QueryDefinition,
  MutationDefinition,
  AssertTagTypes,
  TagDescription,
  isQueryDefinition,
  isMutationDefinition,
  Api,
  Module,
  BaseQueryFn,
} from "../types.js"
import type {
  CombinedState,
  QueryKeys,
  MutationKeys,
  RootState,
} from "./types.js"
import { onFocus, onFocusLost, onOnline, onOffline } from "./setupListeners"
import { buildSlice } from "./buildSlice"
import { buildMiddleware } from "./buildMiddleware"
import { buildSelectors } from "./buildSelectors"
import type {
  MutationActionCreatorResult,
  QueryActionCreatorResult,
} from "./buildInitiate"
import { buildInitiate } from "./buildInitiate"
import { assertCast, safeAssign } from "../tsHelpers"
import type { InternalSerializeQueryArgs } from "../defaultSerializeQueryArgs"
import type { SliceActions } from "./buildSlice"
import type { ReferenceCacheLifecycle } from "./buildMiddleware/cacheLifecycle"
import type { ReferenceQueryLifecycle } from "./buildMiddleware/queryLifecycle"
import type { ReferenceCacheCollection } from "./buildMiddleware/cacheCollection"
import { enablePatches } from "immer"

export interface ApiEndpointQuery<
  Definition extends QueryDefinition<any, any, any, any, any>,
  Definitions extends EndpointDefinitions
> extends Matchers<QueryThunk, Definition> {}

export interface ApiEndpointMutation<
  Definition extends MutationDefinition<any, any, any, any, any>,
  Definitions extends EndpointDefinitions
> extends Matchers<MutationThunk, Definition> {}

export interface ApiEndpointQuery<
  Definition extends QueryDefinition<any, any, any, any, any>,
  Definitions extends EndpointDefinitions
> {
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
  Definition extends MutationDefinition<any, any, any, any, any>,
  Definitions extends EndpointDefinitions
> {
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

declare module "../types" {
  export interface ApiModules<
    BaseQuery extends BaseQueryFn,
    Definitions extends EndpointDefinitions,
    ReducerPath extends string,
    TagTypes extends string
  > {
    [coreModuleName]: {
      reducerPath: ReducerPath
      internalActions: InternalActions
      reducer: Reducer<
        CombinedState<Definitions, TagTypes, ReducerPath>,
        AnyAction
      >
      middleware: Middleware<
        {},
        RootState<Definitions, string, ReducerPath>,
        ThunkDispatch<any, any, AnyAction>
      >
      util: {
        getRunningOperationPromises: () => Array<Promise<unknown>>
        getRunningOperationPromise<EndpointName extends QueryKeys<Definitions>>(
          endpointName: EndpointName,
          args: QueryArgFrom<Definitions[EndpointName]>
        ):
          | QueryActionCreatorResult<
              Definitions[EndpointName] & { type: "query" }
            >
          | undefined
        getRunningOperationPromise<
          EndpointName extends MutationKeys<Definitions>
        >(
          endpointName: EndpointName,
          fixedCacheKeyOrRequestId: string
        ):
          | MutationActionCreatorResult<
              Definitions[EndpointName] & { type: "mutation" }
            >
          | undefined
        prefetch<EndpointName extends QueryKeys<Definitions>>(
          endpointName: EndpointName,
          arg: QueryArgFrom<Definitions[EndpointName]>,
          options: PrefetchOptions
        ): ThunkAction<void, any, any, AnyAction>
        updateQueryData: UpdateQueryDataThunk<
          Definitions,
          RootState<Definitions, string, ReducerPath>
        >
        /** @deprecated renamed to `updateQueryData` */
        updateQueryResult: UpdateQueryDataThunk<
          Definitions,
          RootState<Definitions, string, ReducerPath>
        >
        patchQueryData: PatchQueryDataThunk<
          Definitions,
          RootState<Definitions, string, ReducerPath>
        >
        /** @deprecated renamed to `patchQueryData` */
        patchQueryResult: PatchQueryDataThunk<
          Definitions,
          RootState<Definitions, string, ReducerPath>
        >
        resetApiState: SliceActions["resetApiState"]
        invalidateTags: ActionCreatorWithPayload<
          Array<TagDescription<TagTypes>>,
          string
        >
        selectInvalidatedBy: (
          state: RootState<Definitions, string, ReducerPath>,
          tags: ReadonlyArray<TagDescription<TagTypes>>
        ) => Array<{
          endpointName: string
          originalArgs: any
          queryCacheKey: string
        }>
      }
      endpoints: {
        [K in keyof Definitions]: Definitions[K] extends QueryDefinition<
          any,
          any,
          any,
          any,
          any
        >
          ? ApiEndpointQuery<Definitions[K], Definitions>
          : Definitions[K] extends MutationDefinition<any, any, any, any, any>
          ? ApiEndpointMutation<Definitions[K], Definitions>
          : never
      }
    }
  }
}
export interface ApiEndpointQuery<
  Definition extends QueryDefinition<any, any, any, any, any>,
  Definitions extends EndpointDefinitions
> {}
export interface ApiEndpointMutation<
  Definition extends MutationDefinition<any, any, any, any, any>,
  Definitions extends EndpointDefinitions
> {}
export type ListenerActions = {
  onOnline: typeof onOnline
  onOffline: typeof onOffline
  onFocus: typeof onFocus
  onFocusLost: typeof onFocusLost
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
    enablePatches()
    assertCast<InternalSerializeQueryArgs>(serializeQueryArgs)
    const assertTagType: AssertTagTypes = tag => {
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
        onOnline,
        onOffline,
        onFocus,
        onFocusLost,
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
    safeAssign(api.util, {
      patchQueryData,
      updateQueryData,
      prefetch,
      resetApiState: sliceActions.resetApiState,
    })
    safeAssign(api.internalActions, sliceActions)
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
    safeAssign(api.util, middlewareActions)
    safeAssign(api, { reducer: reducer as any, middleware })
    const { buildQuerySelector, buildMutationSelector, selectInvalidatedBy } =
      buildSelectors({
        serializeQueryArgs: serializeQueryArgs as any,
        reducerPath,
      })
    safeAssign(api.util, { selectInvalidatedBy })
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
    safeAssign(api.util, {
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
        if (isQueryDefinition(definition)) {
          safeAssign(
            anyApi.endpoints[endpointName],
            {
              select: buildQuerySelector(endpointName, definition),
              initiate: buildInitiateQuery(endpointName, definition),
            },
            buildMatchThunkActions(queryThunk, endpointName)
          )
        } else if (isMutationDefinition(definition)) {
          safeAssign(
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
