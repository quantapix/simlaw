import { DevToolsOptions, composeWithDevTools } from "./tools.js"
import * as qb from "./base.js"
import * as qu from "./utils.js"
import type * as qt from "./types.js"
import {
  ThunkMiddlewareFor,
  CurriedGetDefaultMiddleware,
  curryGetDefaultMiddleware,
} from "./middleware.js"

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
