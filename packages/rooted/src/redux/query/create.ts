import type { Api, ApiContext, Module, ModuleName } from "./types.js"
import type { CombinedState } from "./core/types.js"
import type { BaseQueryArg, BaseQueryFn } from "./types.js"
import type { SerializeQueryArgs } from "./types.js"
import { defaultSerializeQueryArgs } from "./utils.js"
import type { EndpointBuilder, EndpointDefinitions } from "./types.js"
import { DefinitionType } from "./types.js"
import { nanoid } from "../../redux/index.js"
import type { AnyAction } from "../../redux/types.js"
import type { NoInfer } from "./types.js"
import { defaultMemoize } from "reselect"

export interface CreateApiOptions<
  BaseQuery extends BaseQueryFn,
  Definitions extends EndpointDefinitions,
  ReducerPath extends string = "api",
  TagTypes extends string = never
> {
  baseQuery: BaseQuery
  tagTypes?: readonly TagTypes[]
  reducerPath?: ReducerPath
  serializeQueryArgs?: SerializeQueryArgs<BaseQueryArg<BaseQuery>>
  endpoints(
    build: EndpointBuilder<BaseQuery, TagTypes, ReducerPath>
  ): Definitions
  keepUnusedDataFor?: number
  refetchOnMountOrArgChange?: boolean | number
  refetchOnFocus?: boolean
  refetchOnReconnect?: boolean
  extractRehydrationInfo?: (
    action: AnyAction,
    {
      reducerPath,
    }: {
      reducerPath: ReducerPath
    }
  ) =>
    | undefined
    | CombinedState<
        NoInfer<Definitions>,
        NoInfer<TagTypes>,
        NoInfer<ReducerPath>
      >
}

export type CreateApi<Modules extends ModuleName> = {
  <
    BaseQuery extends BaseQueryFn,
    Definitions extends EndpointDefinitions,
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
    const extractRehydrationInfo = defaultMemoize((action: AnyAction) =>
      options.extractRehydrationInfo?.(action, {
        reducerPath: (options.reducerPath ?? "api") as any,
      })
    )

    const optionsWithDefaults = {
      reducerPath: "api",
      serializeQueryArgs: defaultSerializeQueryArgs,
      keepUnusedDataFor: 60,
      refetchOnMountOrArgChange: false,
      refetchOnFocus: false,
      refetchOnReconnect: false,
      ...options,
      extractRehydrationInfo,
      tagTypes: [...(options.tagTypes || [])],
    }

    const context: ApiContext<EndpointDefinitions> = {
      endpointDefinitions: {},
      batch(fn) {
        fn()
      },
      apiUid: nanoid(),
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
    } as Api<BaseQueryFn, {}, string, string, Modules[number]["name"]>

    const initializedModules = modules.map(m =>
      m.init(api as any, optionsWithDefaults, context)
    )

    function injectEndpoints(
      inject: Parameters<typeof api.injectEndpoints>[0]
    ) {
      const evaluatedEndpoints = inject.endpoints({
        query: x => ({ ...x, type: DefinitionType.query } as any),
        mutation: x => ({ ...x, type: DefinitionType.mutation } as any),
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
