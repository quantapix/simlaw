import {
  configureStore,
  createAction,
  createSlice,
  isAnyOf,
} from "@reduxjs/toolkit"
import type { AnyAction, PayloadAction, Action } from "@reduxjs/toolkit"
import { createListenerMiddleware, TaskAbortError } from "../index"
import type { TypedAddListener } from "../index"
describe("Saga-style Effects Scenarios", () => {
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
      incrementByAmount: (state, action: PayloadAction<number>) => {
        state.value += action.payload
      },
    },
  })
  const { increment, decrement, incrementByAmount } = counterSlice.actions
  let { reducer } = counterSlice
  let listenerMiddleware = createListenerMiddleware<CounterState>()
  let { middleware, startListening, stopListening } = listenerMiddleware
  let store = configureStore({
    reducer,
    middleware: gDM => gDM().prepend(middleware),
  })
  const testAction1 = createAction<string>("testAction1")
  type TestAction1 = ReturnType<typeof testAction1>
  const testAction2 = createAction<string>("testAction2")
  type TestAction2 = ReturnType<typeof testAction2>
  const testAction3 = createAction<string>("testAction3")
  type TestAction3 = ReturnType<typeof testAction3>
  type RootState = ReturnType<typeof store.getState>
  function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
  beforeAll(() => {
    const noop = () => {}
    jest.spyOn(console, "error").mockImplementation(noop)
  })
  beforeEach(() => {
    listenerMiddleware = createListenerMiddleware<CounterState>()
    middleware = listenerMiddleware.middleware
    startListening = listenerMiddleware.startListening
    store = configureStore({
      reducer,
      middleware: gDM => gDM().prepend(middleware),
    })
  })
  test("throttle", async () => {
    let listenerCalls = 0
    let workPerformed = 0
    startListening({
      actionCreator: increment,
      effect: (action, listenerApi) => {
        listenerCalls++
        listenerApi.unsubscribe()
        setTimeout(listenerApi.subscribe, 15)
        workPerformed++
      },
    })
    store.dispatch(increment())
    store.dispatch(increment())
    store.dispatch(increment())
    await delay(25)
    store.dispatch(increment())
    store.dispatch(increment())
    await delay(5)
    expect(listenerCalls).toBe(2)
    expect(workPerformed).toBe(2)
  })
  test("debounce / takeLatest", async () => {
    let listenerCalls = 0
    let workPerformed = 0
    startListening({
      actionCreator: increment,
      effect: async (action, listenerApi) => {
        listenerCalls++
        listenerApi.cancelActiveListeners()
        await listenerApi.delay(15)
        workPerformed++
      },
    })
    store.dispatch(increment())
    store.dispatch(increment())
    store.dispatch(increment())
    expect(listenerCalls).toBe(3)
    expect(workPerformed).toBe(0)
    await delay(25)
    expect(listenerCalls).toBe(3)
    expect(workPerformed).toBe(1)
  })
  test("takeEvery", async () => {
    let listenerCalls = 0
    startListening({
      actionCreator: increment,
      effect: (action, listenerApi) => {
        listenerCalls++
      },
    })
    store.dispatch(increment())
    expect(listenerCalls).toBe(1)
    store.dispatch(increment())
    expect(listenerCalls).toBe(2)
  })
  test("takeLeading", async () => {
    let listenerCalls = 0
    let workPerformed = 0
    startListening({
      actionCreator: increment,
      effect: async (action, listenerApi) => {
        listenerCalls++
        listenerApi.unsubscribe()
        await listenerApi.delay(15)
        workPerformed++
        listenerApi.subscribe()
      },
    })
    store.dispatch(increment())
    store.dispatch(increment())
    expect(listenerCalls).toBe(1)
    expect(workPerformed).toBe(0)
    await delay(5)
    store.dispatch(increment())
    expect(listenerCalls).toBe(1)
    expect(workPerformed).toBe(0)
    await delay(20)
    expect(workPerformed).toBe(1)
    store.dispatch(increment())
    expect(listenerCalls).toBe(2)
    expect(workPerformed).toBe(1)
    await delay(20)
    expect(workPerformed).toBe(2)
  })
  test("fork + join", async () => {
    let childResult = 0
    startListening({
      actionCreator: increment,
      effect: async (_, listenerApi) => {
        const childOutput = 42
        const result = await listenerApi.fork(async () => {
          await listenerApi.delay(5)
          return childOutput
        }).result
        if (result.status === "ok") {
          childResult = result.value
        }
      },
    })
    store.dispatch(increment())
    await delay(10)
    expect(childResult).toBe(42)
  })
  test("fork + cancel", async () => {
    let childResult = 0
    let listenerCompleted = false
    startListening({
      actionCreator: increment,
      effect: async (action, listenerApi) => {
        const forkedTask = listenerApi.fork(async () => {
          await listenerApi.delay(15)
          childResult = 42
          return 0
        })
        await listenerApi.delay(5)
        forkedTask.cancel()
        listenerCompleted = true
      },
    })
    store.dispatch(increment())
    await delay(20)
    expect(listenerCompleted).toBe(true)
    expect(childResult).toBe(0)
  })
  test("canceled", async () => {
    let canceledAndCaught = false
    let canceledCheck = false
    startListening({
      matcher: isAnyOf(increment, decrement, incrementByAmount),
      effect: async (action, listenerApi) => {
        if (increment.match(action)) {
          try {
            await listenerApi.delay(10)
          } catch (err) {
            if (err instanceof TaskAbortError) {
              canceledAndCaught = true
            }
          }
        } else if (incrementByAmount.match(action)) {
          await delay(15)
          if (listenerApi.signal.aborted) {
            canceledCheck = true
          }
        } else if (decrement.match(action)) {
          listenerApi.cancelActiveListeners()
        }
      },
    })
    store.dispatch(increment())
    store.dispatch(decrement())
    await delay(15)
    expect(canceledAndCaught).toBe(true)
    store.dispatch(incrementByAmount(42))
    store.dispatch(decrement())
    expect(canceledCheck).toBe(false)
    await delay(20)
    expect(canceledCheck).toBe(true)
  })
})
