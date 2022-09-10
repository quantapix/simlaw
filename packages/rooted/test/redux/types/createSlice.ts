import type { Action, AnyAction, Reducer } from "redux"
import type {
  ActionCreatorWithNonInferrablePayload,
  ActionCreatorWithOptionalPayload,
  ActionCreatorWithoutPayload,
  ActionCreatorWithPayload,
  ActionCreatorWithPreparedPayload,
  ActionReducerMapBuilder,
  PayloadAction,
  SliceCaseReducers,
  ValidateSliceCaseReducers,
} from "@reduxjs/toolkit"
import { createAction, createSlice } from "@reduxjs/toolkit"
import { expectType } from "./helpers"
const counterSlice = createSlice({
  name: "counter",
  initialState: 0,
  reducers: {
    increment: (state: number, action) => state + action.payload,
    decrement: (state: number, action) => state - action.payload,
  },
})
const uiSlice = createSlice({
  name: "ui",
  initialState: 0,
  reducers: {
    goToNext: (state: number, action) => state + action.payload,
    goToPrevious: (state: number, action) => state - action.payload,
  },
})
const actionCreators = {
  [counterSlice.name]: { ...counterSlice.actions },
  [uiSlice.name]: { ...uiSlice.actions },
}
expectType<typeof counterSlice.actions>(actionCreators.counter)
expectType<typeof uiSlice.actions>(actionCreators.ui)
const value = actionCreators.anyKey
{
  const firstAction = createAction<{ count: number }>("FIRST_ACTION")
  const slice = createSlice({
    name: "counter",
    initialState: 0,
    reducers: {
      increment: (state: number, action) => state + action.payload,
      decrement: (state: number, action) => state - action.payload,
    },
    extraReducers: {
      [firstAction.type]: (state: number, action) =>
        state + action.payload.count,
    },
  })
  const reducer: Reducer<number, PayloadAction> = slice.reducer
  const stringReducer: Reducer<string, PayloadAction> = slice.reducer
  const anyActionReducer: Reducer<string, AnyAction> = slice.reducer
  slice.actions.increment(1)
  slice.actions.decrement(1)
  slice.actions.other(1)
}
{
  const counter = createSlice({
    name: "counter",
    initialState: 0,
    reducers: {
      increment: state => state + 1,
      decrement: (state, { payload = 1 }: PayloadAction<number | undefined>) =>
        state - payload,
      multiply: (state, { payload }: PayloadAction<number | number[]>) =>
        Array.isArray(payload)
          ? payload.reduce((acc, val) => acc * val, state)
          : state * payload,
      addTwo: {
        reducer: (s, { payload }: PayloadAction<number>) => s + payload,
        prepare: (a: number, b: number) => ({
          payload: a + b,
        }),
      },
    },
  })
  expectType<ActionCreatorWithoutPayload>(counter.actions.increment)
  counter.actions.increment()
  expectType<ActionCreatorWithOptionalPayload<number | undefined>>(
    counter.actions.decrement
  )
  counter.actions.decrement()
  counter.actions.decrement(2)
  expectType<ActionCreatorWithPayload<number | number[]>>(
    counter.actions.multiply
  )
  counter.actions.multiply(2)
  counter.actions.multiply([2, 3, 4])
  expectType<ActionCreatorWithPreparedPayload<[number, number], number>>(
    counter.actions.addTwo
  )
  counter.actions.addTwo(1, 2)
  counter.actions.multiply()
  counter.actions.multiply("2")
  counter.actions.addTwo(1)
}
{
  const counter = createSlice({
    name: "counter",
    initialState: 0,
    reducers: {
      increment: state => state + 1,
      decrement: state => state - 1,
      multiply: (state, { payload }: PayloadAction<number | number[]>) =>
        Array.isArray(payload)
          ? payload.reduce((acc, val) => acc * val, state)
          : state * payload,
    },
  })
  const s: string = counter.actions.increment.type
  const t: string = counter.actions.decrement.type
  const u: string = counter.actions.multiply.type
  const x: "counter/increment" = counter.actions.increment.type
  const y: "increment" = counter.actions.increment.type
}
{
  const counter = createSlice({
    name: "test",
    initialState: { counter: 0, concat: "" },
    reducers: {
      incrementByStrLen: {
        reducer: (state, action: PayloadAction<number>) => {
          state.counter += action.payload
        },
        prepare: (payload: string) => ({
          payload: payload.length,
        }),
      },
      concatMetaStrLen: {
        reducer: (state, action: PayloadAction<string>) => {
          state.concat += action.payload
        },
        prepare: (payload: string) => ({
          payload,
          meta: payload.length,
        }),
      },
    },
  })
  expectType<string>(counter.actions.incrementByStrLen("test").type)
  expectType<number>(counter.actions.incrementByStrLen("test").payload)
  expectType<string>(counter.actions.concatMetaStrLen("test").payload)
  expectType<number>(counter.actions.concatMetaStrLen("test").meta)
  expectType<string>(counter.actions.incrementByStrLen("test").payload)
  expectType<string>(counter.actions.concatMetaStrLen("test").meta)
}
{
  const counter = createSlice({
    name: "test",
    initialState: { counter: 0, concat: "" },
    reducers: {
      testDefaultMetaAndError: {
        reducer(_, action: PayloadAction<number, string>) {},
        prepare: (payload: number) => ({
          payload,
          meta: "meta" as "meta",
          error: "error" as "error",
        }),
      },
      testUnknownMetaAndError: {
        reducer(_, action: PayloadAction<number, string, unknown, unknown>) {},
        prepare: (payload: number) => ({
          payload,
          meta: "meta" as "meta",
          error: "error" as "error",
        }),
      },
      testMetaAndError: {
        reducer(_, action: PayloadAction<number, string, "meta", "error">) {},
        prepare: (payload: number) => ({
          payload,
          meta: "meta" as "meta",
          error: "error" as "error",
        }),
      },
      testErroneousMeta: {
        reducer(_, action: PayloadAction<number, string, "meta", "error">) {},
        prepare: (payload: number) => ({
          payload,
          meta: 1,
          error: "error" as "error",
        }),
      },
      testErroneousError: {
        reducer(_, action: PayloadAction<number, string, "meta", "error">) {},
        prepare: (payload: number) => ({
          payload,
          meta: "meta" as "meta",
          error: 1,
        }),
      },
    },
  })
}
{
  const counter = createSlice({
    name: "counter",
    initialState: 0,
    reducers: {
      increment(state, action: PayloadAction<number>) {
        return state + action.payload
      },
      decrement: {
        reducer(state, action: PayloadAction<number>) {
          return state - action.payload
        },
        prepare(amount: number) {
          return { payload: amount }
        },
      },
    },
  })
  expectType<(state: number, action: PayloadAction<number>) => number | void>(
    counter.caseReducers.increment
  )
  expectType<(state: number, action: PayloadAction<number>) => number | void>(
    counter.caseReducers.decrement
  )
  expectType<(state: number, action: PayloadAction<string>) => number | void>(
    counter.caseReducers.increment
  )
  expectType<(state: number, action: PayloadAction<string>) => number | void>(
    counter.caseReducers.decrement
  )
  expectType<(state: number, action: PayloadAction<string>) => number | void>(
    counter.caseReducers.someThingNonExistant
  )
}
{
  const counter = createSlice({
    name: "counter",
    initialState: { counter: 0 },
    reducers: {
      increment: {
        reducer(state, action: PayloadAction<string>) {
          state.counter += action.payload.length
        },
        prepare(x: string) {
          return {
            payload: 6,
          }
        },
      },
    },
  })
}
{
  const initialState = {
    name: null,
  }
  const mySlice = createSlice({
    name: "name",
    initialState,
    reducers: {
      setName: (state, action) => {
        state.name = action.payload
      },
    },
  })
  expectType<ActionCreatorWithNonInferrablePayload>(mySlice.actions.setName)
  const x = mySlice.actions.setName
  mySlice.actions.setName(null)
  mySlice.actions.setName("asd")
  mySlice.actions.setName(5)
}
{
  const mySlice = createSlice({
    name: "name",
    initialState: { name: "test" },
    reducers: {
      setName: (state, action: PayloadAction<string>) => {
        state.name = action.payload
      },
    },
  })
  const x: Action<unknown> = {} as any
  if (mySlice.actions.setName.match(x)) {
    expectType<string>(x.type)
    expectType<string>(x.payload)
  } else {
    expectType<string>(x.type)
    expectType<string>(x.payload)
  }
}
{
  createSlice({
    name: "test",
    initialState: 0,
    reducers: {},
    extraReducers: builder => {
      expectType<ActionReducerMapBuilder<number>>(builder)
    },
  })
}
{
  interface GenericState<T> {
    data?: T
    status: "loading" | "finished" | "error"
  }
  const createGenericSlice = <
    T,
    Reducers extends SliceCaseReducers<GenericState<T>>
  >({
    name = "",
    initialState,
    reducers,
  }: {
    name: string
    initialState: GenericState<T>
    reducers: ValidateSliceCaseReducers<GenericState<T>, Reducers>
  }) => {
    return createSlice({
      name,
      initialState,
      reducers: {
        start(state) {
          state.status = "loading"
        },
        success(state: GenericState<T>, action: PayloadAction<T>) {
          state.data = action.payload
          state.status = "finished"
        },
        ...reducers,
      },
    })
  }
  const wrappedSlice = createGenericSlice({
    name: "test",
    initialState: { status: "loading" } as GenericState<string>,
    reducers: {
      magic(state) {
        expectType<GenericState<string>>(state)
        expectType<GenericState<number>>(state)
        state.status = "finished"
        state.data = "hocus pocus"
      },
    },
  })
  expectType<ActionCreatorWithPayload<string>>(wrappedSlice.actions.success)
  expectType<ActionCreatorWithoutPayload<string>>(wrappedSlice.actions.magic)
}
{
  interface GenericState<T> {
    data: T | null
  }
  function createDataSlice<
    T,
    Reducers extends SliceCaseReducers<GenericState<T>>
  >(
    name: string,
    reducers: ValidateSliceCaseReducers<GenericState<T>, Reducers>,
    initialState: GenericState<T>
  ) {
    const doNothing = createAction<undefined>("doNothing")
    const setData = createAction<T>("setData")
    const slice = createSlice({
      name,
      initialState,
      reducers,
      extraReducers: builder => {
        builder.addCase(doNothing, state => {
          return { ...state }
        })
        builder.addCase(setData, (state, { payload }) => {
          return {
            ...state,
            data: payload,
          }
        })
      },
    })
    return { doNothing, setData, slice }
  }
}
