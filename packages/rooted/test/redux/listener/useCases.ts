import {
  configureStore,
  createAction,
  createSlice,
  isAnyOf,
} from "@reduxjs/toolkit"
import type { PayloadAction } from "@reduxjs/toolkit"
import { createListenerMiddleware } from "../index"
import type { TypedAddListener } from "../index"
import { TaskAbortError } from "../exceptions"
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
describe("Saga-style Effects Scenarios", () => {
  let listenerMiddleware = createListenerMiddleware<CounterState>()
  let { middleware, startListening, stopListening } = listenerMiddleware
  let store = configureStore({
    reducer: counterSlice.reducer,
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
  beforeEach(() => {
    listenerMiddleware = createListenerMiddleware<CounterState>()
    middleware = listenerMiddleware.middleware
    startListening = listenerMiddleware.startListening
    store = configureStore({
      reducer: counterSlice.reducer,
      middleware: gDM => gDM().prepend(middleware),
    })
  })
  test("Long polling loop", async () => {
    const eventPollingStarted = createAction("serverPolling/started")
    const eventPollingStopped = createAction("serverPolling/stopped")
    let createNanoEvents = () => ({
      events: {} as Record<string, any>,
      emit(event: string, ...args: any[]) {
        ;(this.events[event] || []).forEach((i: any) => i(...args))
      },
      on(event: string, cb: (...args: any[]) => void) {
        ;(this.events[event] = this.events[event] || []).push(cb)
        return () =>
          (this.events[event] = (this.events[event] || []).filter(
            (l: any) => l !== cb
          ))
      },
    })
    const emitter = createNanoEvents()
    function pollForEvent() {
      return new Promise<{ type: string }>((resolve, reject) => {
        const unsubscribe = emitter.on("serverEvent", (arg1: string) => {
          unsubscribe()
          resolve({ type: arg1 })
        })
      })
    }
    const receivedMessages = {
      a: 0,
      b: 0,
      c: 0,
    }
    let pollingTaskStarted = false
    let pollingTaskCanceled = false
    startListening({
      actionCreator: eventPollingStarted,
      effect: async (action, listenerApi) => {
        listenerApi.unsubscribe()
        const pollingTask = listenerApi.fork(async forkApi => {
          pollingTaskStarted = true
          try {
            while (true) {
              const serverEvent = await forkApi.pause(pollForEvent())
              if (serverEvent.type in receivedMessages) {
                receivedMessages[
                  serverEvent.type as keyof typeof receivedMessages
                ]++
              }
            }
          } catch (err) {
            if (err instanceof TaskAbortError) {
              pollingTaskCanceled = true
            }
          }
          return 0
        })
        await listenerApi.condition(eventPollingStopped.match)
        pollingTask.cancel()
      },
    })
    store.dispatch(eventPollingStarted())
    await delay(5)
    expect(pollingTaskStarted).toBe(true)
    await delay(5)
    emitter.emit("serverEvent", "a")
    await delay(1)
    emitter.emit("serverEvent", "b")
    await delay(1)
    store.dispatch(eventPollingStopped())
    await delay(1)
    emitter.emit("serverEvent", "c")
    expect(receivedMessages).toEqual({ a: 1, b: 1, c: 0 })
    expect(pollingTaskCanceled).toBe(true)
  })
})
