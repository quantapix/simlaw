/* eslint-disable @typescript-eslint/ban-types */
import * as qi from "../immer/index.js"
import * as qt from "./types.js"
import {
  ActionReducerMapBuilder,
  executeReducerBuilderCallback,
} from "./builder.js"
import * as qu from "./utils.js"
import { createSelector } from "./reselect.js"

export type SliceActionCreator<P> = qt.PayloadActionCreator<P>
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
export type CaseReducerWithPrepare<State, Action extends qt.PayloadAction> = {
  reducer: CaseReducer<State, Action>
  prepare: qt.PrepareAction<Action["payload"]>
}
export type SliceCaseReducers<State> = {
  [K: string]:
    | CaseReducer<State, qt.PayloadAction<any>>
    | CaseReducerWithPrepare<State, qt.PayloadAction<any, string, any, any>>
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
    ? qt.PayloadActionCreator<P>
    : qt.ActionCreatorWithoutPayload
  : qt.ActionCreatorWithoutPayload
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
    let prepareCallback: qt.PrepareAction<any> | undefined
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

export function createAction<P = void, T extends string = string>(
  type: T
): qt.PayloadActionCreator<P, T>
export function createAction<
  PA extends qt.PrepareAction<any>,
  T extends string = string
>(
  type: T,
  prepareAction: PA
): qt.PayloadActionCreator<ReturnType<PA>["payload"], T, PA>
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
  actionCreator.match = (
    action: qt.Action<unknown>
  ): action is qt.PayloadAction => action.type === type
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
          return qi.produce(previousState, draft => caseReducer(draft, action))
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

const commonProperties: Array<keyof qt.SerializedError> = [
  "name",
  "message",
  "stack",
  "code",
]

export const miniSerializeError = (value: any): qt.SerializedError => {
  if (typeof value === "object" && value !== null) {
    const simpleError: qt.SerializedError = {}
    for (const property of commonProperties) {
      if (typeof value[property] === "string") {
        simpleError[property] = value[property]
      }
    }

    return simpleError
  }

  return { message: String(value) }
}

export function createAsyncThunk<Returned, ThunkArg = void>(
  typePrefix: string,
  payloadCreator: qt.AsyncThunkPayloadCreator<Returned, ThunkArg, {}>,
  options?: qt.AsyncThunkOptions<ThunkArg, {}>
): qt.AsyncThunk<Returned, ThunkArg, {}>

export function createAsyncThunk<
  Returned,
  ThunkArg,
  ThunkApiConfig extends qt.AsyncThunkConfig
>(
  typePrefix: string,
  payloadCreator: qt.AsyncThunkPayloadCreator<
    Returned,
    ThunkArg,
    ThunkApiConfig
  >,
  options?: qt.AsyncThunkOptions<ThunkArg, ThunkApiConfig>
): qt.AsyncThunk<Returned, ThunkArg, ThunkApiConfig>

export function createAsyncThunk<
  Returned,
  ThunkArg,
  ThunkApiConfig extends qt.AsyncThunkConfig
>(
  typePrefix: string,
  payloadCreator: qt.AsyncThunkPayloadCreator<
    Returned,
    ThunkArg,
    ThunkApiConfig
  >,
  options?: qt.AsyncThunkOptions<ThunkArg, ThunkApiConfig>
): qt.AsyncThunk<Returned, ThunkArg, ThunkApiConfig> {
  type RejectedValue = qt.GetRejectValue<ThunkApiConfig>
  type PendingMeta = qt.GetPendingMeta<ThunkApiConfig>
  type FulfilledMeta = qt.GetFulfilledMeta<ThunkApiConfig>
  type RejectedMeta = qt.GetRejectedMeta<ThunkApiConfig>

  const fulfilled: qt.AsyncThunkFulfilledActionCreator<
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

  const pending: qt.AsyncThunkPendingActionCreator<ThunkArg, ThunkApiConfig> =
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

  const rejected: qt.AsyncThunkRejectedActionCreator<ThunkArg, ThunkApiConfig> =
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
        ) as qt.GetSerializedErrorType<ThunkApiConfig>,
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
  ): qt.AsyncThunkAction<Returned, ThunkArg, ThunkApiConfig> {
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
                  return new qt.RejectWithValue(value, meta)
                }) as any,
                fulfillWithValue: ((value: unknown, meta?: FulfilledMeta) => {
                  return new qt.FulfillWithMeta(value, meta)
                }) as any,
              })
            ).then(result => {
              if (result instanceof qt.RejectWithValue) {
                throw result
              }
              if (result instanceof qt.FulfillWithMeta) {
                return fulfilled(result.payload, requestId, arg, result.meta)
              }
              return fulfilled(result as any, requestId, arg)
            }),
          ])
        } catch (err) {
          finalAction =
            err instanceof qt.RejectWithValue
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
    actionCreator as qt.AsyncThunkActionCreator<
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

function isThenable(value: any): value is PromiseLike<any> {
  return (
    value !== null &&
    typeof value === "object" &&
    typeof value.then === "function"
  )
}
