import type { SerializedError } from "../../../redux/types.js"
import type * as qt from "../types.js"

export type QueryCacheKey = string & { _type: "queryCacheKey" }
export type QuerySubstateIdentifier = { queryCacheKey: QueryCacheKey }
export type MutationSubstateIdentifier =
  | {
      requestId: string
      fixedCacheKey?: string
    }
  | {
      requestId?: string
      fixedCacheKey: string
    }

export type RefetchConfigOptions = {
  refetchOnMountOrArgChange: boolean | number
  refetchOnReconnect: boolean
  refetchOnFocus: boolean
}

export enum QueryStatus {
  uninitialized = "uninitialized",
  pending = "pending",
  fulfilled = "fulfilled",
  rejected = "rejected",
}

export type RequestStatusFlags =
  | {
      status: QueryStatus.uninitialized
      isUninitialized: true
      isLoading: false
      isSuccess: false
      isError: false
    }
  | {
      status: QueryStatus.pending
      isUninitialized: false
      isLoading: true
      isSuccess: false
      isError: false
    }
  | {
      status: QueryStatus.fulfilled
      isUninitialized: false
      isLoading: false
      isSuccess: true
      isError: false
    }
  | {
      status: QueryStatus.rejected
      isUninitialized: false
      isLoading: false
      isSuccess: false
      isError: true
    }

export function getRequestStatusFlags(status: QueryStatus): RequestStatusFlags {
  return {
    status,
    isUninitialized: status === QueryStatus.uninitialized,
    isLoading: status === QueryStatus.pending,
    isSuccess: status === QueryStatus.fulfilled,
    isError: status === QueryStatus.rejected,
  } as any
}

export type SubscriptionOptions = {
  pollingInterval?: number
  refetchOnReconnect?: boolean
  refetchOnFocus?: boolean
}

export type Subscribers = { [requestId: string]: SubscriptionOptions }
export type QueryKeys<Definitions extends qt.EndpointDefinitions> = {
  [K in keyof Definitions]: Definitions[K] extends qt.QueryDefinition<
    any,
    any,
    any,
    any
  >
    ? K
    : never
}[keyof Definitions]

export type MutationKeys<Definitions extends qt.EndpointDefinitions> = {
  [K in keyof Definitions]: Definitions[K] extends qt.MutationDefinition<
    any,
    any,
    any,
    any
  >
    ? K
    : never
}[keyof Definitions]

type BaseQuerySubState<D extends qt.BaseEndpointDefinition<any, any, any>> = {
  originalArgs: qt.QueryArgFrom<D>
  requestId: string
  data?: qt.ResultTypeFrom<D>
  error?:
    | SerializedError
    | (D extends qt.QueryDefinition<any, infer BaseQuery, any, any>
        ? qt.BaseQueryError<BaseQuery>
        : never)
  endpointName: string
  startedTimeStamp: number
  fulfilledTimeStamp?: number
}

export type QuerySubState<D extends qt.BaseEndpointDefinition<any, any, any>> =
  qt.Id<
    | ({
        status: QueryStatus.fulfilled
      } & qt.WithRequiredProp<
        BaseQuerySubState<D>,
        "data" | "fulfilledTimeStamp"
      > & { error: undefined })
    | ({
        status: QueryStatus.pending
      } & BaseQuerySubState<D>)
    | ({
        status: QueryStatus.rejected
      } & qt.WithRequiredProp<BaseQuerySubState<D>, "error">)
    | {
        status: QueryStatus.uninitialized
        originalArgs?: undefined
        data?: undefined
        error?: undefined
        requestId?: undefined
        endpointName?: string
        startedTimeStamp?: undefined
        fulfilledTimeStamp?: undefined
      }
  >

type BaseMutationSubState<D extends qt.BaseEndpointDefinition<any, any, any>> =
  {
    requestId: string
    data?: qt.ResultTypeFrom<D>
    error?:
      | SerializedError
      | (D extends qt.MutationDefinition<any, infer BaseQuery, any, any>
          ? qt.BaseQueryError<BaseQuery>
          : never)
    endpointName: string
    startedTimeStamp: number
    fulfilledTimeStamp?: number
  }

export type MutationSubState<
  D extends qt.BaseEndpointDefinition<any, any, any>
> =
  | (({
      status: QueryStatus.fulfilled
    } & qt.WithRequiredProp<
      BaseMutationSubState<D>,
      "data" | "fulfilledTimeStamp"
    >) & { error: undefined })
  | (({
      status: QueryStatus.pending
    } & BaseMutationSubState<D>) & { data?: undefined })
  | ({
      status: QueryStatus.rejected
    } & qt.WithRequiredProp<BaseMutationSubState<D>, "error">)
  | {
      requestId?: undefined
      status: QueryStatus.uninitialized
      data?: undefined
      error?: undefined
      endpointName?: string
      startedTimeStamp?: undefined
      fulfilledTimeStamp?: undefined
    }

export type CombinedState<
  D extends qt.EndpointDefinitions,
  E extends string,
  ReducerPath extends string
> = {
  queries: QueryState<D>
  mutations: MutationState<D>
  provided: InvalidationState<E>
  subscriptions: SubscriptionState
  config: ConfigState<ReducerPath>
}

export type InvalidationState<TagTypes extends string> = {
  [_ in TagTypes]: {
    [id: string]: Array<QueryCacheKey>
    [id: number]: Array<QueryCacheKey>
  }
}

export type QueryState<D extends qt.EndpointDefinitions> = {
  [queryCacheKey: string]: QuerySubState<D[string]> | undefined
}

export type SubscriptionState = {
  [queryCacheKey: string]: Subscribers | undefined
}

export type ConfigState<ReducerPath> = RefetchConfigOptions & {
  reducerPath: ReducerPath
  online: boolean
  focused: boolean
  middlewareRegistered: boolean | "conflict"
} & ModifiableConfigState

export type ModifiableConfigState = {
  keepUnusedDataFor: number
} & RefetchConfigOptions

export type MutationState<D extends qt.EndpointDefinitions> = {
  [requestId: string]: MutationSubState<D[string]> | undefined
}

export type RootState<
  Definitions extends qt.EndpointDefinitions,
  TagTypes extends string,
  ReducerPath extends string
> = {
  [P in ReducerPath]: CombinedState<Definitions, TagTypes, P>
}
