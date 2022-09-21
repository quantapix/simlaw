import * as qb from "./base.js"
import * as qt from "./types.js"
import * as qu from "./utils.js"

export interface DevToolsOptions {
  name?: string
  actionCreators?:
    | qt.ActionCreator<any>[]
    | { [key: string]: qt.ActionCreator<any> }
  latency?: number
  maxAge?: number
  serialize?:
    | boolean
    | {
        options?:
          | undefined
          | boolean
          | {
              date?: true
              regex?: true
              undefined?: true
              error?: true
              symbol?: true
              map?: true
              set?: true
              function?: true | ((fn: (...args: any[]) => any) => string)
            }
        replacer?: (key: string, value: unknown) => any
        reviver?: (key: string, value: unknown) => any
        immutable?: any
        refs?: any
      }
  actionSanitizer?: <A extends qt.Action>(action: A, id: number) => A
  stateSanitizer?: <S>(state: S, index: number) => S
  actionsBlacklist?: string | string[]
  actionsWhitelist?: string | string[]
  actionsDenylist?: string | string[]
  actionsAllowlist?: string | string[]
  predicate?: <S, A extends qt.Action>(state: S, action: A) => boolean
  shouldRecordChanges?: boolean
  pauseActionType?: string
  autoPause?: boolean
  shouldStartLocked?: boolean
  shouldHotReload?: boolean
  shouldCatchErrors?: boolean
  features?: {
    pause?: boolean
    lock?: boolean
    persist?: boolean
    export?: boolean | "custom"
    import?: boolean | "custom"
    jump?: boolean
    skip?: boolean
    reorder?: boolean
    dispatch?: boolean
    test?: boolean
  }
  trace?: boolean | (<A extends qt.Action>(action: A) => string)
  traceLimit?: number
}

type Compose = typeof qb.compose

interface ComposeWithDevTools {
  (options: DevToolsOptions): Compose
  <StoreExt>(...funcs: qt.StoreEnhancer<StoreExt>[]): qt.StoreEnhancer<StoreExt>
}

export const composeWithDevTools: ComposeWithDevTools =
  typeof window !== "undefined" &&
  (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
    ? (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
    : function () {
        if (arguments.length === 0) return undefined
        if (typeof arguments[0] === "object") return qb.compose
        return qb.compose.apply(null, arguments as any as Function[])
      }

export const devToolsEnhancer: {
  (options: DevToolsOptions): qt.StoreEnhancer<any>
} =
  typeof window !== "undefined" && (window as any).__REDUX_DEVTOOLS_EXTENSION__
    ? (window as any).__REDUX_DEVTOOLS_EXTENSION__
    : function () {
        return function (noop) {
          return noop
        }
      }

type EntryProcessor = (key: string, value: any) => any
const isProduction: boolean = process.env["NODE_ENV"] === "production"
const prefix = "Invariant failed"

function invariant(condition: any, message?: string) {
  if (condition) {
    return
  }
  if (isProduction) {
    throw new Error(prefix)
  }
  throw new Error(`${prefix}: ${message || ""}`)
}
function stringify(
  obj: any,
  serializer?: EntryProcessor,
  indent?: string | number,
  decycler?: EntryProcessor
): string {
  return JSON.stringify(obj, getSerialize(serializer, decycler), indent)
}
function getSerialize(
  serializer?: EntryProcessor,
  decycler?: EntryProcessor
): EntryProcessor {
  const stack: any[] = [],
    keys: any[] = []
  if (!decycler)
    decycler = function (_: string, value: any) {
      if (stack[0] === value) return "[Circular ~]"
      return (
        "[Circular ~." + keys.slice(0, stack.indexOf(value)).join(".") + "]"
      )
    }
  return function (this: any, key: string, value: any) {
    if (stack.length > 0) {
      const thisPos = stack.indexOf(this)
      ~thisPos ? stack.splice(thisPos + 1) : stack.push(this)
      ~thisPos ? keys.splice(thisPos, Infinity, key) : keys.push(key)
      if (~stack.indexOf(value)) value = decycler!.call(this, key, value)
    } else stack.push(value)
    return serializer == null ? value : serializer.call(this, key, value)
  }
}
export function isImmutableDefault(value: unknown): boolean {
  return typeof value !== "object" || value == null || Object.isFrozen(value)
}
export function trackForMutations(
  isImmutable: IsImmutableFunc,
  ignorePaths: string[] | undefined,
  obj: any
) {
  const trackedProperties = trackProperties(isImmutable, ignorePaths, obj)
  return {
    detectMutations() {
      return detectMutations(isImmutable, ignorePaths, trackedProperties, obj)
    },
  }
}
interface TrackedProperty {
  value: any
  children: Record<string, any>
}
function trackProperties(
  isImmutable: IsImmutableFunc,
  ignorePaths: IgnorePaths = [],
  obj: Record<string, any>,
  path = ""
) {
  const tracked: Partial<TrackedProperty> = { value: obj }
  if (!isImmutable(obj)) {
    tracked.children = {}
    for (const key in obj) {
      const childPath = path ? path + "." + key : key
      if (ignorePaths.length && ignorePaths.indexOf(childPath) !== -1) {
        continue
      }
      tracked.children[key] = trackProperties(
        isImmutable,
        ignorePaths,
        obj[key],
        childPath
      )
    }
  }
  return tracked as TrackedProperty
}
type IgnorePaths = readonly string[]
function detectMutations(
  isImmutable: IsImmutableFunc,
  ignorePaths: IgnorePaths = [],
  trackedProperty: TrackedProperty,
  obj: any,
  sameParentRef = false,
  path = ""
): { wasMutated: boolean; path?: string } {
  const prevObj = trackedProperty ? trackedProperty.value : undefined
  const sameRef = prevObj === obj
  if (sameParentRef && !sameRef && !Number.isNaN(obj)) {
    return { wasMutated: true, path }
  }
  if (isImmutable(prevObj) || isImmutable(obj)) {
    return { wasMutated: false }
  }
  const keysToDetect: Record<string, boolean> = {}
  for (const key in trackedProperty.children) {
    keysToDetect[key] = true
  }
  for (const key in obj) {
    keysToDetect[key] = true
  }
  for (const key in keysToDetect) {
    const childPath = path ? path + "." + key : key
    if (ignorePaths.length && ignorePaths.indexOf(childPath) !== -1) {
      continue
    }
    const result = detectMutations(
      isImmutable,
      ignorePaths,
      trackedProperty.children[key],
      obj[key],
      sameRef,
      childPath
    )
    if (result.wasMutated) {
      return result
    }
  }
  return { wasMutated: false }
}
type IsImmutableFunc = (value: any) => boolean
export interface ImmutableStateInvariantMiddlewareOptions {
  isImmutable?: IsImmutableFunc
  ignoredPaths?: string[]
  warnAfter?: number
  // @deprecated. Use ignoredPaths
  ignore?: string[]
}
export function createImmutableStateInvariantMiddleware(
  options: ImmutableStateInvariantMiddlewareOptions = {}
): qt.Middleware {
  if (process.env["NODE_ENV"] === "production") {
    return () => next => action => next(action)
  }
  const {
    isImmutable = isImmutableDefault,
    ignoredPaths,
    warnAfter = 32,
    ignore,
  } = options
  const track = trackForMutations.bind(
    null,
    isImmutable,
    ignoredPaths || ignore
  )
  return ({ getState }) => {
    let state = getState()
    let tracker = track(state)
    let result
    return next => action => {
      const measureUtils = qu.getTimeMeasureUtils(
        warnAfter,
        "ImmutableStateInvariantMiddleware"
      )
      measureUtils.measureTime(() => {
        state = getState()
        result = tracker.detectMutations()
        tracker = track(state)
        invariant(
          !result.wasMutated,
          `A state mutation was detected between dispatches, in the path '${
            result.path || ""
          }'.  This may cause incorrect behavior. (https://redux.js.org/style-guide/style-guide#do-not-mutate-state)`
        )
      })
      const dispatchedAction = next(action)
      measureUtils.measureTime(() => {
        state = getState()
        result = tracker.detectMutations()
        tracker = track(state)
        result.wasMutated &&
          invariant(
            !result.wasMutated,
            `A state mutation was detected inside a dispatch, in the path: ${
              result.path || ""
            }. Take a look at the reducer(s) handling the action ${stringify(
              action
            )}. (https://redux.js.org/style-guide/style-guide#do-not-mutate-state)`
          )
      })
      measureUtils.warnIfExceeded()
      return dispatchedAction
    }
  }
}

export function isPlain(val: any) {
  const type = typeof val
  return (
    val == null ||
    type === "string" ||
    type === "boolean" ||
    type === "number" ||
    Array.isArray(val) ||
    qu.isPlainObject(val)
  )
}
interface NonSerializableValue {
  keyPath: string
  value: unknown
}
export function findNonSerializableValue(
  value: unknown,
  path = "",
  isSerializable: (value: unknown) => boolean = isPlain,
  getEntries?: (value: unknown) => [string, any][],
  ignoredPaths: readonly string[] = []
): NonSerializableValue | false {
  let foundNestedSerializable: NonSerializableValue | false
  if (!isSerializable(value)) {
    return {
      keyPath: path || "<root>",
      value: value,
    }
  }
  if (typeof value !== "object" || value === null) {
    return false
  }
  const entries = getEntries != null ? getEntries(value) : Object.entries(value)
  const hasIgnoredPaths = ignoredPaths.length > 0
  for (const [key, nestedValue] of entries) {
    const nestedPath = path ? path + "." + key : key
    if (hasIgnoredPaths && ignoredPaths.indexOf(nestedPath) >= 0) {
      continue
    }
    if (!isSerializable(nestedValue)) {
      return {
        keyPath: nestedPath,
        value: nestedValue,
      }
    }
    if (typeof nestedValue === "object") {
      foundNestedSerializable = findNonSerializableValue(
        nestedValue,
        nestedPath,
        isSerializable,
        getEntries,
        ignoredPaths
      )
      if (foundNestedSerializable) {
        return foundNestedSerializable
      }
    }
  }
  return false
}
export interface SerializableStateInvariantMiddlewareOptions {
  isSerializable?: (value: any) => boolean
  getEntries?: (value: any) => [string, any][]
  ignoredActions?: string[]
  ignoredActionPaths?: string[]
  ignoredPaths?: string[]
  warnAfter?: number
  ignoreState?: boolean
  ignoreActions?: boolean
}
export function createSerializableStateInvariantMiddleware(
  options: SerializableStateInvariantMiddlewareOptions = {}
): qt.Middleware {
  if (process.env["NODE_ENV"] === "production") {
    return () => next => action => next(action)
  }
  const {
    isSerializable = isPlain,
    getEntries,
    ignoredActions = [],
    ignoredActionPaths = ["meta.arg", "meta.baseQueryMeta"],
    ignoredPaths = [],
    warnAfter = 32,
    ignoreState = false,
    ignoreActions = false,
  } = options
  return storeAPI => next => action => {
    const result = next(action)
    const measureUtils = qu.getTimeMeasureUtils(
      warnAfter,
      "SerializableStateInvariantMiddleware"
    )
    if (
      !ignoreActions &&
      !(ignoredActions.length && ignoredActions.indexOf(action.type) !== -1)
    ) {
      measureUtils.measureTime(() => {
        const foundActionNonSerializableValue = findNonSerializableValue(
          action,
          "",
          isSerializable,
          getEntries,
          ignoredActionPaths
        )
        if (foundActionNonSerializableValue) {
          const { keyPath, value } = foundActionNonSerializableValue
          console.error(
            `A non-serializable value was detected in an action, in the path: \`${keyPath}\`. Value:`,
            value,
            "\nTake a look at the logic that dispatched this action: ",
            action,
            "\n(See https://redux.js.org/faq/actions#why-should-type-be-a-string-or-at-least-serializable-why-should-my-action-types-be-constants)",
            "\n(To allow non-serializable values see: https://redux-toolkit.js.org/usage/usage-guide#working-with-non-serializable-data)"
          )
        }
      })
    }
    if (!ignoreState) {
      measureUtils.measureTime(() => {
        const state = storeAPI.getState()
        const foundStateNonSerializableValue = findNonSerializableValue(
          state,
          "",
          isSerializable,
          getEntries,
          ignoredPaths
        )
        if (foundStateNonSerializableValue) {
          const { keyPath, value } = foundStateNonSerializableValue
          console.error(
            `A non-serializable value was detected in the state, in the path: \`${keyPath}\`. Value:`,
            value,
            `
Take a look at the reducer(s) handling this action type: ${action.type}.
(See https://redux.js.org/faq/organizing-state#can-i-put-functions-promises-or-other-non-serializable-items-in-my-store-state)`
          )
        }
      })
      measureUtils.warnIfExceeded()
    }
    return result
  }
}

function createThunkMiddleware<
  State = any,
  BasicAction extends qt.Action = qt.AnyAction,
  ExtraThunkArg = undefined
>(extraArgument?: ExtraThunkArg) {
  const middleware: qt.ThunkMiddleware<State, BasicAction, ExtraThunkArg> =
    ({ dispatch, getState }) =>
    next =>
    action => {
      if (typeof action === "function") {
        return action(dispatch, getState, extraArgument)
      }
      return next(action)
    }
  return middleware
}

export const thunkMiddleware = createThunkMiddleware() as qt.ThunkMiddleware & {
  withExtraArgument<
    ExtraThunkArg,
    State = any,
    BasicAction extends qt.Action = qt.AnyAction
  >(
    extraArgument: ExtraThunkArg
  ): qt.ThunkMiddleware<State, BasicAction, ExtraThunkArg>
}

thunkMiddleware.withExtraArgument = createThunkMiddleware

function isBoolean(x: any): x is boolean {
  return typeof x === "boolean"
}

interface ThunkOptions<E = any> {
  extraArgument: E
}

interface GetDefaultMiddlewareOptions {
  thunk?: boolean | ThunkOptions
  immutableCheck?: boolean | ImmutableStateInvariantMiddlewareOptions
  serializableCheck?: boolean | SerializableStateInvariantMiddlewareOptions
}

export type ThunkMiddlewareFor<
  S,
  O extends GetDefaultMiddlewareOptions = {}
> = O extends {
  thunk: false
}
  ? never
  : O extends { thunk: { extraArgument: infer E } }
  ? qt.ThunkMiddleware<S, qt.AnyAction, E>
  : qt.ThunkMiddleware<S, qt.AnyAction>

export type CurriedGetDefaultMiddleware<S = any> = <
  O extends Partial<GetDefaultMiddlewareOptions> = {
    thunk: true
    immutableCheck: true
    serializableCheck: true
  }
>(
  options?: O
) => qt.MiddlewareArray<qt.ExcludeFromTuple<[ThunkMiddlewareFor<S, O>], never>>

export function curryGetDefaultMiddleware<
  S = any
>(): CurriedGetDefaultMiddleware<S> {
  return function curriedGetDefaultMiddleware(options) {
    return getDefaultMiddleware(options)
  }
}

export function getDefaultMiddleware<
  S = any,
  O extends Partial<GetDefaultMiddlewareOptions> = {
    thunk: true
    immutableCheck: true
    serializableCheck: true
  }
>(
  options: O = {} as O
): qt.MiddlewareArray<qt.ExcludeFromTuple<[ThunkMiddlewareFor<S, O>], never>> {
  const {
    thunk = true,
    immutableCheck = true,
    serializableCheck = true,
  } = options
  const middlewareArray = new qt.MiddlewareArray<qt.Middleware[]>()
  if (thunk) {
    if (isBoolean(thunk)) {
      middlewareArray.push(thunkMiddleware)
    } else {
      middlewareArray.push(
        thunkMiddleware.withExtraArgument(thunk.extraArgument)
      )
    }
  }
  if (process.env["NODE_ENV"] !== "production") {
    if (immutableCheck) {
      let immutableOptions: ImmutableStateInvariantMiddlewareOptions = {}
      if (!isBoolean(immutableCheck)) {
        immutableOptions = immutableCheck
      }
      middlewareArray.unshift(
        createImmutableStateInvariantMiddleware(immutableOptions)
      )
    }
    if (serializableCheck) {
      let serializableOptions: SerializableStateInvariantMiddlewareOptions = {}
      if (!isBoolean(serializableCheck)) {
        serializableOptions = serializableCheck
      }
      middlewareArray.push(
        createSerializableStateInvariantMiddleware(serializableOptions)
      )
    }
  }
  return middlewareArray as any
}

const IS_PRODUCTION = process.env["NODE_ENV"] === "production"

export type ConfigureEnhancersCallback = (
  defaultEnhancers: readonly qt.StoreEnhancer[]
) => qt.StoreEnhancer[]

export interface ConfigureStoreOptions<
  S = any,
  A extends qt.Action = qt.AnyAction,
  M extends Middlewares<S> = Middlewares<S>
> {
  reducer: qt.Reducer<S, A> | qt.ReducersMapObject<S, A>
  middleware?: ((getDefaultMiddleware: CurriedGetDefaultMiddleware<S>) => M) | M
  devTools?: boolean | DevToolsOptions
  preloadedState?: qt.PreloadedState<qt.CombinedState<qt.NoInfer<S>>>
  enhancers?: qt.StoreEnhancer[] | ConfigureEnhancersCallback
}

type Middlewares<S> = ReadonlyArray<qt.Middleware<{}, S>>

export interface EnhancedStore<
  S = any,
  A extends qt.Action = qt.AnyAction,
  M extends Middlewares<S> = Middlewares<S>
> extends qt.Store<S, A> {
  dispatch: qt.ExtractDispatchExtensions<M> & qt.Dispatch<A>
}
export function configureStore<
  S = any,
  A extends qt.Action = qt.AnyAction,
  M extends Middlewares<S> = [ThunkMiddlewareFor<S>]
>(options: ConfigureStoreOptions<S, A, M>): EnhancedStore<S, A, M> {
  const curriedGetDefaultMiddleware = curryGetDefaultMiddleware<S>()
  const {
    reducer = undefined,
    middleware = curriedGetDefaultMiddleware(),
    devTools = true,
    preloadedState = undefined,
    enhancers = undefined,
  } = options || {}
  let rootReducer: qt.Reducer<S, A>
  if (typeof reducer === "function") {
    rootReducer = reducer
  } else if (qu.isPlainObject(reducer)) {
    rootReducer = qb.combineReducers(reducer) as unknown as qt.Reducer<S, A>
  } else {
    throw new Error(
      '"reducer" is a required argument, and must be a function or an object of functions that can be passed to combineReducers'
    )
  }
  let finalMiddleware = middleware
  if (typeof finalMiddleware === "function") {
    finalMiddleware = finalMiddleware(curriedGetDefaultMiddleware)
    if (!IS_PRODUCTION && !Array.isArray(finalMiddleware)) {
      throw new Error(
        "when using a middleware builder function, an array of middleware must be returned"
      )
    }
  }
  if (
    !IS_PRODUCTION &&
    finalMiddleware.some((item: any) => typeof item !== "function")
  ) {
    throw new Error(
      "each middleware provided to configureStore must be a function"
    )
  }
  const middlewareEnhancer = qb.applyMiddleware(...finalMiddleware)
  let finalCompose = qb.compose
  if (devTools) {
    finalCompose = composeWithDevTools({
      trace: !IS_PRODUCTION,
      ...(typeof devTools === "object" && devTools),
    })
  }
  let storeEnhancers: qt.StoreEnhancer[] = [middlewareEnhancer]
  if (Array.isArray(enhancers)) {
    storeEnhancers = [middlewareEnhancer, ...enhancers]
  } else if (typeof enhancers === "function") {
    storeEnhancers = enhancers(storeEnhancers)
  }
  const composedEnhancer = finalCompose(...storeEnhancers) as any
  return qb.createStore(rootReducer, preloadedState, composedEnhancer)
}
