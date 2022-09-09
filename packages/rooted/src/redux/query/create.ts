import { defaultMemoize } from "reselect"
import * as qu from "./utils.js"
import type { Api, ApiContext, Module, ModuleName } from "./module.js"
import * as qt from "./types.js"

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
    const extractRehydrationInfo = defaultMemoize((action: qt.AnyAction) =>
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
      hasRehydrationInfo: defaultMemoize(
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
