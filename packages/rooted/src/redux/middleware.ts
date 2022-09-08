import { createImmutableStateInvariantMiddleware } from "./immutable.js"
import { createSerializableStateInvariantMiddleware } from "./serializable.js"
import * as qt from "./types.js"
import type { ImmutableStateInvariantMiddlewareOptions } from "./immutable.js"
import type { SerializableStateInvariantMiddlewareOptions } from "./serializable.js"

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
