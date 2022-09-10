import type { Reducer } from "redux"
import type { ActionReducerMapBuilder } from "@reduxjs/toolkit"
import { createReducer, createAction } from "@reduxjs/toolkit"
import { expectType } from "./helpers"
{
  type CounterAction =
    | { type: "increment"; payload: number }
    | { type: "decrement"; payload: number }
  const incrementHandler = (state: number, action: CounterAction) => state + 1
  const decrementHandler = (state: number, action: CounterAction) => state - 1
  const reducer = createReducer(0 as number, {
    increment: incrementHandler,
    decrement: decrementHandler,
  })
  const numberReducer: Reducer<number> = reducer
  const stringReducer: Reducer<string> = reducer
}
{
  type CounterAction =
    | { type: "increment"; payload: number }
    | { type: "decrement"; payload: number }
  const incrementHandler = (state: number, action: CounterAction) =>
    state + action.payload
  const decrementHandler = (state: number, action: CounterAction) =>
    state - action.payload
  createReducer<number>(0, {
    increment: incrementHandler,
    decrement: decrementHandler,
  })
  createReducer<string>(0, {
    increment: incrementHandler,
    decrement: decrementHandler,
  })
}
{
  const initialState: { readonly counter: number } = { counter: 0 }
  createReducer(initialState, {
    increment: state => {
      state.counter += 1
    },
  })
}
{
  const increment = createAction<number, "increment">("increment")
  const reducer = createReducer(0, builder =>
    expectType<ActionReducerMapBuilder<number>>(builder)
  )
  expectType<number>(reducer(0, increment(5)))
  expectType<string>(reducer(0, increment(5)))
}
