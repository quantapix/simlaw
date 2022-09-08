/* eslint-disable no-lone-blocks */
import type * as qt from "../../src/redux/types.js"
import {
  applyMiddleware,
  configureStore,
  getDefaultMiddleware,
  createSlice,
} from "../../src/redux/index.js"
import { thunkMiddleware as thunk } from "../../src/redux/middleware.js"
import { expectNotAny, expectType } from "./helpers.js"

const _anyMiddleware: any = () => () => () => {}

{
  configureStore({
    reducer: (state, action) => 0,
  })
  configureStore({
    reducer: {
      counter1: () => 0,
      counter2: () => 1,
    },
  })
  configureStore({ reducer: "not a reducer" })
  configureStore({ reducer: { a: "not a reducer" } })
  configureStore({})
}
{
  const reducer: qt.Reducer<number> = () => 0
  const store = configureStore({ reducer })
  const numberStore: qt.Store<number, qt.AnyAction> = store
  const stringStore: qt.Store<string, qt.AnyAction> = store
}
{
  const reducer: qt.Reducer<number, qt.PayloadAction<number>> = () => 0
  const store = configureStore({ reducer })
  const numberStore: qt.Store<number, qt.PayloadAction<number>> = store
  const stringStore: qt.Store<number, qt.PayloadAction<string>> = store
}
{
  const middleware: qt.Middleware = store => next => next
  configureStore({
    reducer: () => 0,
    middleware: [middleware],
  })
  configureStore({
    reducer: () => 0,
    middleware: ["not middleware"],
  })
}
{
  configureStore({
    reducer: () => 0,
    devTools: true,
  })
  configureStore({
    reducer: () => 0,
    devTools: "true",
  })
}
{
  configureStore({
    reducer: () => 0,
    devTools: { name: "myApp" },
  })
  configureStore({
    reducer: () => 0,
    devTools: { appname: "myApp" },
  })
}
{
  configureStore({
    reducer: () => 0,
    preloadedState: 0,
  })
  configureStore({
    reducer: () => 0,
    preloadedState: "non-matching state type",
  })
}
{
  configureStore({
    reducer: () => 0,
    enhancers: [applyMiddleware(store => next => next)],
  })
  configureStore({
    reducer: () => 0,
    enhancers: ["not a store enhancer"],
  })
}
{
  const counterReducer1: qt.Reducer<number> = () => 0
  const counterReducer2: qt.Reducer<number> = () => 0
  const store = configureStore({
    reducer: {
      counter1: counterReducer1,
      counter2: counterReducer2,
    },
    preloadedState: {
      counter1: 0,
    },
  })
  const counter1: number = store.getState().counter1
  const counter2: number = store.getState().counter2
}
{
  type StateA = number
  const reducerA = () => 0
  function thunkA() {
    return (() => {}) as any as qt.ThunkAction<Promise<"A">, StateA, any, any>
  }

  type StateB = string
  function thunkB() {
    return (dispatch: qt.Dispatch, getState: () => StateB) => {}
  }
  {
    const store = configureStore({
      reducer: reducerA,
    })
    store.dispatch(thunkA())
    store.dispatch(thunkB())
    const res = store.dispatch((dispatch, getState) => {
      return 42
    })
    const action = store.dispatch({ type: "foo" })
  }
  {
    const slice = createSlice({
      name: "counter",
      initialState: {
        value: 0,
      },
      reducers: {
        incrementByAmount: (state, action: qt.PayloadAction<number>) => {
          state.value += action.payload
        },
      },
    })
    const store = configureStore({
      reducer: {
        counter: slice.reducer,
      },
    })
    const action = slice.actions.incrementByAmount(2)
    const dispatchResult = store.dispatch(action)
    expectType<{ type: string; payload: number }>(dispatchResult)
    const promiseResult = store.dispatch(async dispatch => {
      return 42
    })
    expectType<Promise<number>>(promiseResult)
    const store2 = configureStore({
      reducer: {
        counter: slice.reducer,
      },
      middleware: gDM =>
        gDM({
          thunk: {
            extraArgument: 42,
          },
        }),
    })
    const dispatchResult2 = store2.dispatch(action)
    expectType<{ type: string; payload: number }>(dispatchResult2)
  }
  {
    const store = configureStore({
      reducer: reducerA,
      middleware: [],
    })
    store.dispatch(thunkA())
    store.dispatch(thunkB())
  }
  {
    const store = configureStore({
      reducer: reducerA,
      middleware: [thunk] as [qt.ThunkMiddleware<StateA>],
    })
    store.dispatch(thunkA())
    store.dispatch(thunkB())
  }
  {
    const store = configureStore({
      reducer: reducerA,
      middleware: getDefaultMiddleware<StateA>(),
    })
    store.dispatch(thunkA())
    store.dispatch(thunkB())
  }
  {
    const store = configureStore({
      reducer: reducerA,
      middleware: [] as any as [qt.Middleware<(a: StateA) => boolean, StateA>],
    })
    const result: boolean = store.dispatch(5)
    const result2: string = store.dispatch(5)
  }
  {
    const middleware = [] as any as [
      qt.Middleware<(a: "a") => "A", StateA>,
      qt.Middleware<(b: "b") => "B", StateA>,
      qt.ThunkMiddleware<StateA>
    ]
    const store = configureStore({
      reducer: reducerA,
      middleware,
    })
    const result: "A" = store.dispatch("a")
    const result2: "B" = store.dispatch("b")
    const result3: Promise<"A"> = store.dispatch(thunkA())
  }
  {
    const store = configureStore({ reducer: {} })
    store.dispatch(function () {} as qt.ThunkAction<
      void,
      {},
      undefined,
      qt.AnyAction
    >)
    store.dispatch(function () {} as qt.ThunkAction<
      void,
      {},
      null,
      qt.AnyAction
    >)
    store.dispatch(function () {} as qt.ThunkAction<
      void,
      {},
      unknown,
      qt.AnyAction
    >)
    store.dispatch(function () {} as qt.ThunkAction<
      void,
      {},
      boolean,
      qt.AnyAction
    >)
  }
  {
    const middleware = getDefaultMiddleware<StateA>().prepend(
      (() => {}) as any as qt.Middleware<(a: "a") => "A", StateA>
    )
    const store = configureStore({
      reducer: reducerA,
      middleware,
    })
    const result1: "A" = store.dispatch("a")
    const result2: Promise<"A"> = store.dispatch(thunkA())
    store.dispatch(thunkB())
  }
  {
    const otherMiddleware: qt.Middleware<(a: "a") => "A", StateA> =
      _anyMiddleware
    const concatenated = getDefaultMiddleware<StateA>().prepend(otherMiddleware)
    expectType<
      ReadonlyArray<
        typeof otherMiddleware | qt.ThunkMiddleware | qt.Middleware<{}>
      >
    >(concatenated)
    const store = configureStore({
      reducer: reducerA,
      middleware: concatenated,
    })
    const result1: "A" = store.dispatch("a")
    const result2: Promise<"A"> = store.dispatch(thunkA())
    store.dispatch(thunkB())
  }
  {
    const otherMiddleware: qt.Middleware<(a: "a") => "A", StateA> =
      _anyMiddleware
    const concatenated = getDefaultMiddleware<StateA>().concat(otherMiddleware)
    expectType<
      ReadonlyArray<
        typeof otherMiddleware | qt.ThunkMiddleware | qt.Middleware<{}>
      >
    >(concatenated)
    const store = configureStore({
      reducer: reducerA,
      middleware: concatenated,
    })
    const result1: "A" = store.dispatch("a")
    const result2: Promise<"A"> = store.dispatch(thunkA())
    store.dispatch(thunkB())
  }
  {
    const store = configureStore({
      reducer: reducerA,
      middleware: getDefaultMiddleware =>
        getDefaultMiddleware().prepend((() => {}) as any as qt.Middleware<
          (a: "a") => "A",
          StateA
        >),
    })
    const result1: "A" = store.dispatch("a")
    const result2: Promise<"A"> = store.dispatch(thunkA())
    store.dispatch(thunkB())
  }
  {
    const otherMiddleware: qt.Middleware<(a: "a") => "A", StateA> =
      _anyMiddleware
    const otherMiddleware2: qt.Middleware<(a: "b") => "B", StateA> =
      _anyMiddleware
    const store = configureStore({
      reducer: reducerA,
      middleware: getDefaultMiddleware =>
        getDefaultMiddleware()
          .concat(otherMiddleware)
          .prepend(otherMiddleware2),
    })
    const result1: "A" = store.dispatch("a")
    const result2: Promise<"A"> = store.dispatch(thunkA())
    const result3: "B" = store.dispatch("b")
    store.dispatch(thunkB())
  }
  {
    const store = configureStore({
      reducer: reducerA,
      middleware: getDefaultMiddleware =>
        getDefaultMiddleware({ thunk: false }).prepend(
          (() => {}) as any as qt.Middleware<(a: "a") => "A", StateA>
        ),
    })
    const result1: "A" = store.dispatch("a")
    store.dispatch(thunkA())
  }
  {
    const store = configureStore({
      reducer: reducerA,
      middleware: getDefaultMiddleware =>
        getDefaultMiddleware().concat(_anyMiddleware as qt.Middleware<any>),
    })
    expectNotAny(store.dispatch)
  }
  {
    interface CounterState {
      value: number
    }
    const counterSlice = createSlice({
      name: "counter",
      initialState: { value: 0 } as CounterState,
      reducers: {
        increment(state) {
          state.value += 1
        },
        decrement(state) {
          state.value -= 1
        },
        incrementByAmount: (state, action: qt.PayloadAction<number>) => {
          state.value += action.payload
        },
      },
    })
    type Unsubscribe = () => void
    const dummyMiddleware: qt.Middleware<
      {
        (action: qt.Action<"actionListenerMiddleware/add">): Unsubscribe
      },
      CounterState
    > = storeApi => next => action => {}
    const store = configureStore({
      reducer: counterSlice.reducer,
      middleware: gDM => gDM().prepend(dummyMiddleware),
    })
    expectType<
      ((action: qt.Action<"actionListenerMiddleware/add">) => Unsubscribe) &
        qt.ThunkDispatch<CounterState, undefined, qt.AnyAction> &
        qt.Dispatch<qt.AnyAction>
    >(store.dispatch)
    const unsubscribe = store.dispatch({
      type: "actionListenerMiddleware/add",
    } as const)
    expectType<Unsubscribe>(unsubscribe)
  }
}
