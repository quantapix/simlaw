/* eslint-disable @typescript-eslint/ban-types */
import * as qi from "../immer/index.js"
import type * as qt from "./types.js"
import type { ActionReducerMapBuilder } from "./builder.js"
import { executeReducerBuilderCallback } from "./builder.js"
import * as qu from "./utils.js"
import { createSelector } from "reselect"
import type { ThunkDispatch } from "redux-thunk"

export type SliceActionCreator<P> = PayloadActionCreator<P>
export interface Slice<
  State = any,
  CaseReducers extends SliceCaseReducers<State> = SliceCaseReducers<State>,
  Name extends string = string
> {
  name: Name
  reducer: qt.Reducer<State>
  actions: CaseReducerActions<CaseReducers>
  caseReducers: SliceDefinedCaseReducers<CaseReducers>
  getInitialState: () => State
}
export interface CreateSliceOptions<
  State = any,
  CR extends SliceCaseReducers<State> = SliceCaseReducers<State>,
  Name extends string = string
> {
  name: Name
  initialState: State | (() => State)
  reducers: ValidateSliceCaseReducers<State, CR>
  extraReducers?:
    | CaseReducers<qt.NoInfer<State>, any>
    | ((builder: ActionReducerMapBuilder<qt.NoInfer<State>>) => void)
}
export type CaseReducerWithPrepare<State, Action extends PayloadAction> = {
  reducer: CaseReducer<State, Action>
  prepare: PrepareAction<Action["payload"]>
}
export type SliceCaseReducers<State> = {
  [K: string]:
    | CaseReducer<State, PayloadAction<any>>
    | CaseReducerWithPrepare<State, PayloadAction<any, string, any, any>>
}
export type CaseReducerActions<CaseReducers extends SliceCaseReducers<any>> = {
  [Type in keyof CaseReducers]: CaseReducers[Type] extends { prepare: any }
    ? ActionCreatorForCaseReducerWithPrepare<CaseReducers[Type]>
    : ActionCreatorForCaseReducer<CaseReducers[Type]>
}
type ActionCreatorForCaseReducerWithPrepare<CR extends { prepare: any }> =
  _ActionCreatorWithPreparedPayload<CR["prepare"], string>
type ActionCreatorForCaseReducer<CR> = CR extends (
  state: any,
  action: infer Action
) => any
  ? Action extends { payload: infer P }
    ? PayloadActionCreator<P>
    : ActionCreatorWithoutPayload
  : ActionCreatorWithoutPayload
type SliceDefinedCaseReducers<CaseReducers extends SliceCaseReducers<any>> = {
  [Type in keyof CaseReducers]: CaseReducers[Type] extends {
    reducer: infer Reducer
  }
    ? Reducer
    : CaseReducers[Type]
}
export type ValidateSliceCaseReducers<
  S,
  ACR extends SliceCaseReducers<S>
> = ACR & {
  [T in keyof ACR]: ACR[T] extends {
    reducer(s: S, action?: infer A): any
  }
    ? {
        prepare(...a: never[]): Omit<A, "type">
      }
    : {}
}
function getType(slice: string, actionKey: string): string {
  return `${slice}/${actionKey}`
}
export function createSlice<
  State,
  CaseReducers extends SliceCaseReducers<State>,
  Name extends string = string
>(
  options: CreateSliceOptions<State, CaseReducers, Name>
): Slice<State, CaseReducers, Name> {
  const { name } = options
  if (!name) {
    throw new Error("`name` is a required option for createSlice")
  }
  if (
    typeof process !== "undefined" &&
    process.env["NODE_ENV"] === "development"
  ) {
    if (options.initialState === undefined) {
      console.error(
        "You must provide an `initialState` value that is not `undefined`. You may have misspelled `initialState`"
      )
    }
  }
  const initialState =
    typeof options.initialState == "function"
      ? options.initialState
      : qu.freezeDraftable(options.initialState)
  const reducers = options.reducers || {}
  const reducerNames = Object.keys(reducers)
  const sliceCaseReducersByName: Record<string, CaseReducer> = {}
  const sliceCaseReducersByType: Record<string, CaseReducer> = {}
  const actionCreators: Record<string, Function> = {}
  reducerNames.forEach(reducerName => {
    const maybeReducerWithPrepare = reducers[reducerName]!
    const type = getType(name, reducerName)
    let caseReducer: CaseReducer<State, any>
    let prepareCallback: PrepareAction<any> | undefined
    if ("reducer" in maybeReducerWithPrepare) {
      caseReducer = maybeReducerWithPrepare.reducer
      prepareCallback = maybeReducerWithPrepare.prepare
    } else {
      caseReducer = maybeReducerWithPrepare
    }
    sliceCaseReducersByName[reducerName] = caseReducer
    sliceCaseReducersByType[type] = caseReducer
    actionCreators[reducerName] = prepareCallback
      ? createAction(type, prepareCallback)
      : createAction(type)
  })
  function buildReducer() {
    const [
      extraReducers = {},
      actionMatchers = [],
      defaultCaseReducer = undefined,
    ] =
      typeof options.extraReducers === "function"
        ? executeReducerBuilderCallback(options.extraReducers)
        : [options.extraReducers]
    const finalCaseReducers = { ...extraReducers, ...sliceCaseReducersByType }
    return createReducer(
      initialState,
      finalCaseReducers as any,
      actionMatchers,
      defaultCaseReducer
    )
  }
  let _reducer: ReducerWithInitialState<State>
  return {
    name,
    reducer(state, action) {
      if (!_reducer) _reducer = buildReducer()
      return _reducer(state, action)
    },
    actions: actionCreators as any,
    caseReducers: sliceCaseReducersByName as any,
    getInitialState() {
      if (!_reducer) _reducer = buildReducer()
      return _reducer.getInitialState()
    },
  }
}

export type PayloadAction<
  P = void,
  T extends string = string,
  M = never,
  E = never
> = {
  payload: P
  type: T
} & ([M] extends [never]
  ? {}
  : {
      meta: M
    }) &
  ([E] extends [never]
    ? {}
    : {
        error: E
      })

export type PrepareAction<P> =
  | ((...args: any[]) => { payload: P })
  | ((...args: any[]) => { payload: P; meta: any })
  | ((...args: any[]) => { payload: P; error: any })
  | ((...args: any[]) => { payload: P; meta: any; error: any })
export type _ActionCreatorWithPreparedPayload<
  PA extends PrepareAction<any> | void,
  T extends string = string
> = PA extends PrepareAction<infer P>
  ? ActionCreatorWithPreparedPayload<
      Parameters<PA>,
      P,
      T,
      ReturnType<PA> extends {
        error: infer E
      }
        ? E
        : never,
      ReturnType<PA> extends {
        meta: infer M
      }
        ? M
        : never
    >
  : void

export interface BaseActionCreator<P, T extends string, M = never, E = never> {
  type: T
  match: (action: qt.Action<unknown>) => action is PayloadAction<P, T, M, E>
}

export interface ActionCreatorWithPreparedPayload<
  Args extends unknown[],
  P,
  T extends string = string,
  E = never,
  M = never
> extends BaseActionCreator<P, T, M, E> {
  (...args: Args): PayloadAction<P, T, M, E>
}

export interface ActionCreatorWithOptionalPayload<P, T extends string = string>
  extends BaseActionCreator<P, T> {
  (payload?: P): PayloadAction<P, T>
}

export interface ActionCreatorWithoutPayload<T extends string = string>
  extends BaseActionCreator<undefined, T> {
  (): PayloadAction<undefined, T>
}

export interface ActionCreatorWithPayload<P, T extends string = string>
  extends BaseActionCreator<P, T> {
  (payload: P): PayloadAction<P, T>
}

export interface ActionCreatorWithNonInferrablePayload<
  T extends string = string
> extends BaseActionCreator<unknown, T> {
  <PT>(payload: PT): PayloadAction<PT, T>
}

export type PayloadActionCreator<
  P = void,
  T extends string = string,
  PA extends PrepareAction<P> | void = void
> = IfPrepareActionMethodProvided<
  PA,
  _ActionCreatorWithPreparedPayload<PA, T>,
  // else
  qt.IsAny<
    P,
    ActionCreatorWithPayload<any, T>,
    qt.IsUnknownOrNonInferrable<
      P,
      ActionCreatorWithNonInferrablePayload<T>,
      // else
      qt.IfVoid<
        P,
        ActionCreatorWithoutPayload<T>,
        // else
        qt.IfMaybeUndefined<
          P,
          ActionCreatorWithOptionalPayload<P, T>,
          // else
          ActionCreatorWithPayload<P, T>
        >
      >
    >
  >
>

export function createAction<P = void, T extends string = string>(
  type: T
): PayloadActionCreator<P, T>
export function createAction<
  PA extends PrepareAction<any>,
  T extends string = string
>(
  type: T,
  prepareAction: PA
): PayloadActionCreator<ReturnType<PA>["payload"], T, PA>
export function createAction(type: string, prepareAction?: Function): any {
  function actionCreator(...args: any[]) {
    if (prepareAction) {
      const prepared = prepareAction(...args)
      if (!prepared) {
        throw new Error("prepareAction did not return an object")
      }
      return {
        type,
        payload: prepared.payload,
        ...("meta" in prepared && { meta: prepared.meta }),
        ...("error" in prepared && { error: prepared.error }),
      }
    }
    return { type, payload: args[0] }
  }
  actionCreator.toString = () => `${type}`
  actionCreator.type = type
  actionCreator.match = (action: qt.Action<unknown>): action is PayloadAction =>
    action.type === type
  return actionCreator
}

export function isFSA(action: unknown): action is {
  type: string
  payload?: unknown
  error?: unknown
  meta?: unknown
} {
  return (
    qu.isPlainObject(action) &&
    typeof (action as any).type === "string" &&
    Object.keys(action).every(isValidKey)
  )
}

function isValidKey(key: string) {
  return ["type", "payload", "error", "meta"].indexOf(key) > -1
}

export function getType<T extends string>(
  actionCreator: PayloadActionCreator<any, T>
): T {
  return `${actionCreator}` as T
}

type IfPrepareActionMethodProvided<
  PA extends PrepareAction<any> | void,
  True,
  False
> = PA extends (...args: any[]) => any ? True : False

export type Actions<T extends keyof any = string> = Record<T, qt.Action>

export interface ActionMatcher<A extends qt.AnyAction> {
  (action: qt.AnyAction): action is A
}

export type ActionMatcherDescription<S, A extends qt.AnyAction> = {
  matcher: ActionMatcher<A>
  reducer: CaseReducer<S, qt.NoInfer<A>>
}

export type ReadonlyActionMatcherDescriptionCollection<S> = ReadonlyArray<
  ActionMatcherDescription<S, any>
>

export type ActionMatcherDescriptionCollection<S> = Array<
  ActionMatcherDescription<S, any>
>

export type CaseReducer<S = any, A extends qt.Action = qt.AnyAction> = (
  state: qi.Draft<S>,
  action: A
) => S | void | qi.Draft<S>
export type CaseReducers<S, AS extends Actions> = {
  [T in keyof AS]: AS[T] extends qt.Action ? CaseReducer<S, AS[T]> : void
}

export type NotFunction<T> = T extends Function ? never : T

function isStateFunction<S>(x: unknown): x is () => S {
  return typeof x === "function"
}

export type ReducerWithInitialState<S extends NotFunction<any>> =
  qt.Reducer<S> & {
    getInitialState: () => S
  }

export function createReducer<S extends NotFunction<any>>(
  initialState: S | (() => S),
  builderCallback: (builder: ActionReducerMapBuilder<S>) => void
): ReducerWithInitialState<S>
export function createReducer<
  S extends NotFunction<any>,
  CR extends CaseReducers<S, any> = CaseReducers<S, any>
>(
  initialState: S | (() => S),
  actionsMap: CR,
  actionMatchers?: ActionMatcherDescriptionCollection<S>,
  defaultCaseReducer?: CaseReducer<S>
): ReducerWithInitialState<S>
export function createReducer<S extends NotFunction<any>>(
  initialState: S | (() => S),
  mapOrBuilderCallback:
    | CaseReducers<S, any>
    | ((builder: ActionReducerMapBuilder<S>) => void),
  actionMatchers: ReadonlyActionMatcherDescriptionCollection<S> = [],
  defaultCaseReducer?: CaseReducer<S>
): ReducerWithInitialState<S> {
  const [actionsMap, finalActionMatchers, finalDefaultCaseReducer] =
    typeof mapOrBuilderCallback === "function"
      ? executeReducerBuilderCallback(mapOrBuilderCallback)
      : [mapOrBuilderCallback, actionMatchers, defaultCaseReducer]
  let getInitialState: () => S
  if (isStateFunction(initialState)) {
    getInitialState = () => qu.freezeDraftable(initialState())
  } else {
    const frozenInitialState = qu.freezeDraftable(initialState)
    getInitialState = () => frozenInitialState
  }

  function reducer(state = getInitialState(), action: any): S {
    let caseReducers = [
      actionsMap[action.type],
      ...finalActionMatchers
        .filter(({ matcher }) => matcher(action))
        .map(({ reducer }) => reducer),
    ]
    if (caseReducers.filter(cr => !!cr).length === 0) {
      caseReducers = [finalDefaultCaseReducer]
    }
    return caseReducers.reduce((previousState, caseReducer): S => {
      if (caseReducer) {
        if (qi.isDraft(previousState)) {
          const draft = previousState as qi.Draft<S>
          const result = caseReducer(draft, action)
          if (result === undefined) {
            return previousState
          }
          return result as S
        } else if (!qi.isDraftable(previousState)) {
          const result = caseReducer(previousState as any, action)
          if (result === undefined) {
            if (previousState === null) {
              return previousState
            }
            throw Error(
              "A case reducer on a non-draftable value must not return undefined"
            )
          }
          return result as S
        } else {
          return qi.produce(previousState, (draft => {
            return caseReducer(draft, action)
          })
        }
      }
      return previousState
    }, state)
  }
  reducer.getInitialState = getInitialState
  return reducer as ReducerWithInitialState<S>
}

export const createDraftSafeSelector: typeof createSelector = (
  ...args: unknown[]
) => {
  const selector = (createSelector as any)(...args)
  const wrappedSelector = (value: unknown, ...rest: unknown[]) =>
    selector(qi.isDraft(value) ? qi.current(value) : value, ...rest)
  return wrappedSelector as any
}

type _Keep = PayloadAction | ActionCreatorWithPreparedPayload<any, unknown>

export type BaseThunkAPI<
  S,
  E,
  D extends qt.Dispatch = qt.Dispatch,
  RejectedValue = undefined,
  RejectedMeta = unknown,
  FulfilledMeta = unknown
> = {
  dispatch: D
  getState: () => S
  extra: E
  requestId: string
  signal: AbortSignal
  rejectWithValue: qt.IsUnknown<
    RejectedMeta,
    (value: RejectedValue) => RejectWithValue<RejectedValue, RejectedMeta>,
    (
      value: RejectedValue,
      meta: RejectedMeta
    ) => RejectWithValue<RejectedValue, RejectedMeta>
  >
  fulfillWithValue: qt.IsUnknown<
    FulfilledMeta,
    <FulfilledValue>(
      value: FulfilledValue
    ) => FulfillWithMeta<FulfilledValue, FulfilledMeta>,
    <FulfilledValue>(
      value: FulfilledValue,
      meta: FulfilledMeta
    ) => FulfillWithMeta<FulfilledValue, FulfilledMeta>
  >
}

export interface SerializedError {
  name?: string
  message?: string
  stack?: string
  code?: string
}

const commonProperties: Array<keyof SerializedError> = [
  "name",
  "message",
  "stack",
  "code",
]

class RejectWithValue<Payload, RejectedMeta> {
  private readonly _type!: "RejectWithValue"
  constructor(
    public readonly payload: Payload,
    public readonly meta: RejectedMeta
  ) {}
}

class FulfillWithMeta<Payload, FulfilledMeta> {
  private readonly _type!: "FulfillWithMeta"
  constructor(
    public readonly payload: Payload,
    public readonly meta: FulfilledMeta
  ) {}
}

export const miniSerializeError = (value: any): SerializedError => {
  if (typeof value === "object" && value !== null) {
    const simpleError: SerializedError = {}
    for (const property of commonProperties) {
      if (typeof value[property] === "string") {
        simpleError[property] = value[property]
      }
    }

    return simpleError
  }

  return { message: String(value) }
}

type AsyncThunkConfig = {
  state?: unknown
  dispatch?: qt.Dispatch
  extra?: unknown
  rejectValue?: unknown
  serializedErrorType?: unknown
  pendingMeta?: unknown
  fulfilledMeta?: unknown
  rejectedMeta?: unknown
}

type GetState<ThunkApiConfig> = ThunkApiConfig extends {
  state: infer State
}
  ? State
  : unknown
type GetExtra<ThunkApiConfig> = ThunkApiConfig extends { extra: infer Extra }
  ? Extra
  : unknown
type GetDispatch<ThunkApiConfig> = ThunkApiConfig extends {
  dispatch: infer Dispatch
}
  ? qt.FallbackIfUnknown<
      Dispatch,
      ThunkDispatch<
        GetState<ThunkApiConfig>,
        GetExtra<ThunkApiConfig>,
        qt.AnyAction
      >
    >
  : ThunkDispatch<
      GetState<ThunkApiConfig>,
      GetExtra<ThunkApiConfig>,
      qt.AnyAction
    >

type GetThunkAPI<ThunkApiConfig> = BaseThunkAPI<
  GetState<ThunkApiConfig>,
  GetExtra<ThunkApiConfig>,
  GetDispatch<ThunkApiConfig>,
  GetRejectValue<ThunkApiConfig>,
  GetRejectedMeta<ThunkApiConfig>,
  GetFulfilledMeta<ThunkApiConfig>
>

type GetRejectValue<ThunkApiConfig> = ThunkApiConfig extends {
  rejectValue: infer RejectValue
}
  ? RejectValue
  : unknown

type GetPendingMeta<ThunkApiConfig> = ThunkApiConfig extends {
  pendingMeta: infer PendingMeta
}
  ? PendingMeta
  : unknown

type GetFulfilledMeta<ThunkApiConfig> = ThunkApiConfig extends {
  fulfilledMeta: infer FulfilledMeta
}
  ? FulfilledMeta
  : unknown

type GetRejectedMeta<ThunkApiConfig> = ThunkApiConfig extends {
  rejectedMeta: infer RejectedMeta
}
  ? RejectedMeta
  : unknown

type GetSerializedErrorType<ThunkApiConfig> = ThunkApiConfig extends {
  serializedErrorType: infer GetSerializedErrorType
}
  ? GetSerializedErrorType
  : SerializedError

type MaybePromise<T> = T | Promise<T> | (T extends any ? Promise<T> : never)

export type AsyncThunkPayloadCreatorReturnValue<
  Returned,
  ThunkApiConfig extends AsyncThunkConfig
> = MaybePromise<
  | qt.IsUnknown<
      GetFulfilledMeta<ThunkApiConfig>,
      Returned,
      FulfillWithMeta<Returned, GetFulfilledMeta<ThunkApiConfig>>
    >
  | RejectWithValue<
      GetRejectValue<ThunkApiConfig>,
      GetRejectedMeta<ThunkApiConfig>
    >
>

export type AsyncThunkPayloadCreator<
  Returned,
  ThunkArg = void,
  ThunkApiConfig extends AsyncThunkConfig = {}
> = (
  arg: ThunkArg,
  thunkAPI: GetThunkAPI<ThunkApiConfig>
) => AsyncThunkPayloadCreatorReturnValue<Returned, ThunkApiConfig>

export type AsyncThunkAction<
  Returned,
  ThunkArg,
  ThunkApiConfig extends AsyncThunkConfig
> = (
  dispatch: GetDispatch<ThunkApiConfig>,
  getState: () => GetState<ThunkApiConfig>,
  extra: GetExtra<ThunkApiConfig>
) => Promise<
  | ReturnType<AsyncThunkFulfilledActionCreator<Returned, ThunkArg>>
  | ReturnType<AsyncThunkRejectedActionCreator<ThunkArg, ThunkApiConfig>>
> & {
  abort: (reason?: string) => void
  requestId: string
  arg: ThunkArg
  unwrap: () => Promise<Returned>
}

type AsyncThunkActionCreator<
  Returned,
  ThunkArg,
  ThunkApiConfig extends AsyncThunkConfig
> = qt.IsAny<
  ThunkArg,
  (arg: ThunkArg) => AsyncThunkAction<Returned, ThunkArg, ThunkApiConfig>,
  unknown extends ThunkArg
    ? (arg: ThunkArg) => AsyncThunkAction<Returned, ThunkArg, ThunkApiConfig>
    : [ThunkArg] extends [void] | [undefined]
    ? () => AsyncThunkAction<Returned, ThunkArg, ThunkApiConfig>
    : [void] extends [ThunkArg]
    ? (arg?: ThunkArg) => AsyncThunkAction<Returned, ThunkArg, ThunkApiConfig>
    : [undefined] extends [ThunkArg]
    ? WithStrictNullChecks<
        (
          arg?: ThunkArg
        ) => AsyncThunkAction<Returned, ThunkArg, ThunkApiConfig>,
        (arg: ThunkArg) => AsyncThunkAction<Returned, ThunkArg, ThunkApiConfig>
      >
    : (arg: ThunkArg) => AsyncThunkAction<Returned, ThunkArg, ThunkApiConfig>
>

export type AsyncThunkOptions<
  ThunkArg = void,
  ThunkApiConfig extends AsyncThunkConfig = {}
> = {
  condition?(
    arg: ThunkArg,
    api: Pick<GetThunkAPI<ThunkApiConfig>, "getState" | "extra">
  ): MaybePromise<boolean | undefined>
  dispatchConditionRejection?: boolean

  serializeError?: (x: unknown) => GetSerializedErrorType<ThunkApiConfig>

  idGenerator?: (arg: ThunkArg) => string
} & qt.IsUnknown<
  GetPendingMeta<ThunkApiConfig>,
  {
    getPendingMeta?(
      base: {
        arg: ThunkArg
        requestId: string
      },
      api: Pick<GetThunkAPI<ThunkApiConfig>, "getState" | "extra">
    ): GetPendingMeta<ThunkApiConfig>
  },
  {
    getPendingMeta(
      base: {
        arg: ThunkArg
        requestId: string
      },
      api: Pick<GetThunkAPI<ThunkApiConfig>, "getState" | "extra">
    ): GetPendingMeta<ThunkApiConfig>
  }
>

export type AsyncThunkPendingActionCreator<
  ThunkArg,
  ThunkApiConfig = {}
> = ActionCreatorWithPreparedPayload<
  [string, ThunkArg, GetPendingMeta<ThunkApiConfig>?],
  undefined,
  string,
  never,
  {
    arg: ThunkArg
    requestId: string
    requestStatus: "pending"
  } & GetPendingMeta<ThunkApiConfig>
>

export type AsyncThunkRejectedActionCreator<
  ThunkArg,
  ThunkApiConfig = {}
> = ActionCreatorWithPreparedPayload<
  [
    Error | null,
    string,
    ThunkArg,
    GetRejectValue<ThunkApiConfig>?,
    GetRejectedMeta<ThunkApiConfig>?
  ],
  GetRejectValue<ThunkApiConfig> | undefined,
  string,
  GetSerializedErrorType<ThunkApiConfig>,
  {
    arg: ThunkArg
    requestId: string
    requestStatus: "rejected"
    aborted: boolean
    condition: boolean
  } & (
    | ({ rejectedWithValue: false } & {
        [K in keyof GetRejectedMeta<ThunkApiConfig>]?: undefined
      })
    | ({ rejectedWithValue: true } & GetRejectedMeta<ThunkApiConfig>)
  )
>

export type AsyncThunkFulfilledActionCreator<
  Returned,
  ThunkArg,
  ThunkApiConfig = {}
> = ActionCreatorWithPreparedPayload<
  [Returned, string, ThunkArg, GetFulfilledMeta<ThunkApiConfig>?],
  Returned,
  string,
  never,
  {
    arg: ThunkArg
    requestId: string
    requestStatus: "fulfilled"
  } & GetFulfilledMeta<ThunkApiConfig>
>

export type AsyncThunk<
  Returned,
  ThunkArg,
  ThunkApiConfig extends AsyncThunkConfig
> = AsyncThunkActionCreator<Returned, ThunkArg, ThunkApiConfig> & {
  pending: AsyncThunkPendingActionCreator<ThunkArg, ThunkApiConfig>
  rejected: AsyncThunkRejectedActionCreator<ThunkArg, ThunkApiConfig>
  fulfilled: AsyncThunkFulfilledActionCreator<
    Returned,
    ThunkArg,
    ThunkApiConfig
  >
  typePrefix: string
}

export function createAsyncThunk<Returned, ThunkArg = void>(
  typePrefix: string,
  payloadCreator: AsyncThunkPayloadCreator<Returned, ThunkArg, {}>,
  options?: AsyncThunkOptions<ThunkArg, {}>
): AsyncThunk<Returned, ThunkArg, {}>

export function createAsyncThunk<
  Returned,
  ThunkArg,
  ThunkApiConfig extends AsyncThunkConfig
>(
  typePrefix: string,
  payloadCreator: AsyncThunkPayloadCreator<Returned, ThunkArg, ThunkApiConfig>,
  options?: AsyncThunkOptions<ThunkArg, ThunkApiConfig>
): AsyncThunk<Returned, ThunkArg, ThunkApiConfig>

export function createAsyncThunk<
  Returned,
  ThunkArg,
  ThunkApiConfig extends AsyncThunkConfig
>(
  typePrefix: string,
  payloadCreator: AsyncThunkPayloadCreator<Returned, ThunkArg, ThunkApiConfig>,
  options?: AsyncThunkOptions<ThunkArg, ThunkApiConfig>
): AsyncThunk<Returned, ThunkArg, ThunkApiConfig> {
  type RejectedValue = GetRejectValue<ThunkApiConfig>
  type PendingMeta = GetPendingMeta<ThunkApiConfig>
  type FulfilledMeta = GetFulfilledMeta<ThunkApiConfig>
  type RejectedMeta = GetRejectedMeta<ThunkApiConfig>

  const fulfilled: AsyncThunkFulfilledActionCreator<
    Returned,
    ThunkArg,
    ThunkApiConfig
  > = createAction(
    typePrefix + "/fulfilled",
    (
      payload: Returned,
      requestId: string,
      arg: ThunkArg,
      meta?: FulfilledMeta
    ) => ({
      payload,
      meta: {
        ...((meta as any) || {}),
        arg,
        requestId,
        requestStatus: "fulfilled" as const,
      },
    })
  )

  const pending: AsyncThunkPendingActionCreator<ThunkArg, ThunkApiConfig> =
    createAction(
      typePrefix + "/pending",
      (requestId: string, arg: ThunkArg, meta?: PendingMeta) => ({
        payload: undefined,
        meta: {
          ...((meta as any) || {}),
          arg,
          requestId,
          requestStatus: "pending" as const,
        },
      })
    )

  const rejected: AsyncThunkRejectedActionCreator<ThunkArg, ThunkApiConfig> =
    createAction(
      typePrefix + "/rejected",
      (
        error: Error | null,
        requestId: string,
        arg: ThunkArg,
        payload?: RejectedValue,
        meta?: RejectedMeta
      ) => ({
        payload,
        error: ((options && options.serializeError) || miniSerializeError)(
          error || "Rejected"
        ) as GetSerializedErrorType<ThunkApiConfig>,
        meta: {
          ...((meta as any) || {}),
          arg,
          requestId,
          rejectedWithValue: !!payload,
          requestStatus: "rejected" as const,
          aborted: error?.name === "AbortError",
          condition: error?.name === "ConditionError",
        },
      })
    )

  let displayedWarning = false

  const AC =
    typeof AbortController !== "undefined"
      ? AbortController
      : class implements AbortController {
          signal = {
            aborted: false,
            addEventListener() {},
            dispatchEvent() {
              return false
            },
            onabort() {},
            removeEventListener() {},
            reason: undefined,
            throwIfAborted() {},
          }
          abort() {
            if (process.env["NODE_ENV"] !== "production") {
              if (!displayedWarning) {
                displayedWarning = true
                console.info(
                  `This platform does not implement AbortController. 
If you want to use the AbortController to react to \`abort\` events, please consider importing a polyfill like 'abortcontroller-polyfill/dist/abortcontroller-polyfill-only'.`
                )
              }
            }
          }
        }

  function actionCreator(
    arg: ThunkArg
  ): AsyncThunkAction<Returned, ThunkArg, ThunkApiConfig> {
    return (dispatch, getState, extra) => {
      const requestId = options?.idGenerator
        ? options.idGenerator(arg)
        : qu.nanoid()

      const abortController = new AC()
      let abortReason: string | undefined

      const abortedPromise = new Promise<never>((_, reject) =>
        abortController.signal.addEventListener("abort", () =>
          reject({ name: "AbortError", message: abortReason || "Aborted" })
        )
      )

      let started = false
      function abort(reason?: string) {
        if (started) {
          abortReason = reason
          abortController.abort()
        }
      }

      const promise = (async function () {
        let finalAction: ReturnType<typeof fulfilled | typeof rejected>
        try {
          let conditionResult = options?.condition?.(arg, { getState, extra })
          if (isThenable(conditionResult)) {
            conditionResult = await conditionResult
          }
          if (conditionResult === false) {
            throw {
              name: "ConditionError",
              message: "Aborted due to condition callback returning false.",
            }
          }
          started = true
          dispatch(
            pending(
              requestId,
              arg,
              options?.getPendingMeta?.({ requestId, arg }, { getState, extra })
            )
          )
          finalAction = await Promise.race([
            abortedPromise,
            Promise.resolve(
              payloadCreator(arg, {
                dispatch,
                getState,
                extra,
                requestId,
                signal: abortController.signal,
                rejectWithValue: ((
                  value: RejectedValue,
                  meta?: RejectedMeta
                ) => {
                  return new RejectWithValue(value, meta)
                }) as any,
                fulfillWithValue: ((value: unknown, meta?: FulfilledMeta) => {
                  return new FulfillWithMeta(value, meta)
                }) as any,
              })
            ).then(result => {
              if (result instanceof RejectWithValue) {
                throw result
              }
              if (result instanceof FulfillWithMeta) {
                return fulfilled(result.payload, requestId, arg, result.meta)
              }
              return fulfilled(result as any, requestId, arg)
            }),
          ])
        } catch (err) {
          finalAction =
            err instanceof RejectWithValue
              ? rejected(null, requestId, arg, err.payload, err.meta)
              : rejected(err as any, requestId, arg)
        }
        const skipDispatch =
          options &&
          !options.dispatchConditionRejection &&
          rejected.match(finalAction) &&
          (finalAction as any).meta.condition

        if (!skipDispatch) {
          dispatch(finalAction)
        }
        return finalAction
      })()
      return Object.assign(promise as Promise<any>, {
        abort,
        requestId,
        arg,
        unwrap() {
          return promise.then<any>(unwrapResult)
        },
      })
    }
  }

  return Object.assign(
    actionCreator as AsyncThunkActionCreator<
      Returned,
      ThunkArg,
      ThunkApiConfig
    >,
    {
      pending,
      rejected,
      fulfilled,
      typePrefix,
    }
  )
}

interface UnwrappableAction {
  payload: any
  meta?: any
  error?: any
}

type UnwrappedActionPayload<T extends UnwrappableAction> = Exclude<
  T,
  { error: any }
>["payload"]

export function unwrapResult<R extends UnwrappableAction>(
  action: R
): UnwrappedActionPayload<R> {
  if (action.meta && action.meta.rejectedWithValue) {
    throw action.payload
  }
  if (action.error) {
    throw action.error
  }
  return action.payload
}

type WithStrictNullChecks<True, False> = undefined extends boolean
  ? False
  : True

function isThenable(value: any): value is PromiseLike<any> {
  return (
    value !== null &&
    typeof value === "object" &&
    typeof value.then === "function"
  )
}
