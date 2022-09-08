import type {
  Reducer,
  ReducersMapObject,
  Middleware,
  Action,
  AnyAction,
  StoreEnhancer,
  Store,
  Dispatch,
  PreloadedState,
  CombinedState,
} from "redux"
import { createStore, compose, applyMiddleware, combineReducers } from "redux"
import type { DevToolsEnhancerOptions as DevToolsOptions } from "./devtools.js"
import { composeWithDevTools } from "./devtools.js"
import { isPlainObject } from "./utils.js"
import type {
  ThunkMiddlewareFor,
  CurriedGetDefaultMiddleware,
} from "./getDefaultMiddleware.js"
import { curryGetDefaultMiddleware } from "./getDefaultMiddleware.js"
import type { NoInfer, ExtractDispatchExtensions } from "./types.js"

const IS_PRODUCTION = process.env.NODE_ENV === "production"

export type ConfigureEnhancersCallback = (
  defaultEnhancers: readonly StoreEnhancer[]
) => StoreEnhancer[]

export interface ConfigureStoreOptions<
  S = any,
  A extends Action = AnyAction,
  M extends Middlewares<S> = Middlewares<S>
> {
  reducer: Reducer<S, A> | ReducersMapObject<S, A>
  middleware?: ((getDefaultMiddleware: CurriedGetDefaultMiddleware<S>) => M) | M
  devTools?: boolean | DevToolsOptions
  preloadedState?: PreloadedState<CombinedState<NoInfer<S>>>
  enhancers?: StoreEnhancer[] | ConfigureEnhancersCallback
}

type Middlewares<S> = ReadonlyArray<Middleware<{}, S>>

export interface EnhancedStore<
  S = any,
  A extends Action = AnyAction,
  M extends Middlewares<S> = Middlewares<S>
> extends Store<S, A> {
  dispatch: ExtractDispatchExtensions<M> & Dispatch<A>
}
export function configureStore<
  S = any,
  A extends Action = AnyAction,
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
  let rootReducer: Reducer<S, A>
  if (typeof reducer === "function") {
    rootReducer = reducer
  } else if (isPlainObject(reducer)) {
    rootReducer = combineReducers(reducer) as unknown as Reducer<S, A>
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
  const middlewareEnhancer = applyMiddleware(...finalMiddleware)
  let finalCompose = compose
  if (devTools) {
    finalCompose = composeWithDevTools({
      trace: !IS_PRODUCTION,
      ...(typeof devTools === "object" && devTools),
    })
  }
  let storeEnhancers: StoreEnhancer[] = [middlewareEnhancer]
  if (Array.isArray(enhancers)) {
    storeEnhancers = [middlewareEnhancer, ...enhancers]
  } else if (typeof enhancers === "function") {
    storeEnhancers = enhancers(storeEnhancers)
  }
  const composedEnhancer = finalCompose(...storeEnhancers) as any
  return createStore(rootReducer, preloadedState, composedEnhancer)
}
