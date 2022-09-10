import {
  ADD_TODO,
  DISPATCH_IN_MIDDLE,
  GET_STATE_IN_MIDDLE,
  SUBSCRIBE_IN_MIDDLE,
  UNSUBSCRIBE_IN_MIDDLE,
  THROW_ERROR,
  UNKNOWN_ACTION,
} from "./actionTypes"
import { Action, AnyAction, Dispatch } from "../.."

export function addTodo(text: string): AnyAction {
  return { type: ADD_TODO, text }
}
export function addTodoAsync(text: string) {
  return (dispatch: Dispatch): Promise<void> =>
    new Promise(resolve =>
      setImmediate(() => {
        dispatch(addTodo(text))
        resolve()
      })
    )
}
export function addTodoIfEmpty(text: string) {
  return (dispatch: Dispatch, getState: () => any) => {
    if (!getState().length) {
      dispatch(addTodo(text))
    }
  }
}
export function dispatchInMiddle(boundDispatchFn: () => void): AnyAction {
  return {
    type: DISPATCH_IN_MIDDLE,
    boundDispatchFn,
  }
}
export function getStateInMiddle(boundGetStateFn: () => void): AnyAction {
  return {
    type: GET_STATE_IN_MIDDLE,
    boundGetStateFn,
  }
}
export function subscribeInMiddle(boundSubscribeFn: () => void): AnyAction {
  return {
    type: SUBSCRIBE_IN_MIDDLE,
    boundSubscribeFn,
  }
}
export function unsubscribeInMiddle(boundUnsubscribeFn: () => void): AnyAction {
  return {
    type: UNSUBSCRIBE_IN_MIDDLE,
    boundUnsubscribeFn,
  }
}
export function throwError(): Action {
  return {
    type: THROW_ERROR,
  }
}
export function unknownAction(): Action {
  return {
    type: UNKNOWN_ACTION,
  }
}
export const ADD_TODO = "ADD_TODO"
export const DISPATCH_IN_MIDDLE = "DISPATCH_IN_MIDDLE"
export const GET_STATE_IN_MIDDLE = "GET_STATE_IN_MIDDLE"
export const SUBSCRIBE_IN_MIDDLE = "SUBSCRIBE_IN_MIDDLE"
export const UNSUBSCRIBE_IN_MIDDLE = "UNSUBSCRIBE_IN_MIDDLE"
export const THROW_ERROR = "THROW_ERROR"
export const UNKNOWN_ACTION = "UNKNOWN_ACTION"
import { MiddlewareAPI, Dispatch, AnyAction } from "../.."
type ThunkAction<T extends any = any> = T extends AnyAction
  ? AnyAction
  : T extends Function
  ? T
  : never
export function thunk({ dispatch, getState }: MiddlewareAPI) {
  return (next: Dispatch) =>
    <_>(action: ThunkAction) =>
      typeof action === "function" ? action(dispatch, getState) : next(action)
}
import {
  ADD_TODO,
  DISPATCH_IN_MIDDLE,
  GET_STATE_IN_MIDDLE,
  SUBSCRIBE_IN_MIDDLE,
  UNSUBSCRIBE_IN_MIDDLE,
  THROW_ERROR,
} from "./actionTypes"
import { AnyAction } from "../.."
function id(state: { id: number }[]) {
  return (
    state.reduce((result, item) => (item.id > result ? item.id : result), 0) + 1
  )
}
export interface Todo {
  id: number
  text: string
}
export type TodoAction = { type: "ADD_TODO"; text: string } | AnyAction
export function todos(state: Todo[] = [], action: TodoAction) {
  switch (action.type) {
    case ADD_TODO:
      return [
        ...state,
        {
          id: id(state),
          text: action.text,
        },
      ]
    default:
      return state
  }
}
export function todosReverse(state: Todo[] = [], action: TodoAction) {
  switch (action.type) {
    case ADD_TODO:
      return [
        {
          id: id(state),
          text: action.text,
        },
        ...state,
      ]
    default:
      return state
  }
}
export function dispatchInTheMiddleOfReducer(
  state = [],
  action:
    | { type: "DISPATCH_IN_MIDDLE"; boundDispatchFn: () => void }
    | AnyAction
) {
  switch (action.type) {
    case DISPATCH_IN_MIDDLE:
      action.boundDispatchFn()
      return state
    default:
      return state
  }
}
export function getStateInTheMiddleOfReducer(
  state = [],
  action:
    | { type: "DISPATCH_IN_MIDDLE"; boundGetStateFn: () => void }
    | AnyAction
) {
  switch (action.type) {
    case GET_STATE_IN_MIDDLE:
      action.boundGetStateFn()
      return state
    default:
      return state
  }
}
export function subscribeInTheMiddleOfReducer(
  state = [],
  action:
    | { type: "DISPATCH_IN_MIDDLE"; boundSubscribeFn: () => void }
    | AnyAction
) {
  switch (action.type) {
    case SUBSCRIBE_IN_MIDDLE:
      action.boundSubscribeFn()
      return state
    default:
      return state
  }
}
export function unsubscribeInTheMiddleOfReducer(
  state = [],
  action:
    | { type: "DISPATCH_IN_MIDDLE"; boundUnsubscribeFn: () => void }
    | AnyAction
) {
  switch (action.type) {
    case UNSUBSCRIBE_IN_MIDDLE:
      action.boundUnsubscribeFn()
      return state
    default:
      return state
  }
}
export function errorThrowingReducer(state = [], action: AnyAction) {
  switch (action.type) {
    case THROW_ERROR:
      throw new Error()
    default:
      return state
  }
}
