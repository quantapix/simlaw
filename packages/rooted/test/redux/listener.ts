import * as qx from "../../src/redux/index.js"

const middlewareApi = {
  getState: expect.any(Function),
  getOriginalState: expect.any(Function),
  condition: expect.any(Function),
  extra: undefined,
  take: expect.any(Function),
  signal: expect.any(Object),
  fork: expect.any(Function),
  delay: expect.any(Function),
  pause: expect.any(Function),
  dispatch: expect.any(Function),
  unsubscribe: expect.any(Function),
  subscribe: expect.any(Function),
  cancelActiveListeners: expect.any(Function),
}

const noop = () => {}
export interface Deferred<T> extends Promise<T> {
  resolve(value?: T | PromiseLike<T>): void
  reject(reason?: any): void
}
export function deferred<T>(): Deferred<T> {
  let methods
  const promise = new Promise<T>((resolve, reject): void => {
    methods = { resolve, reject }
  })
  return Object.assign(promise, methods) as Deferred<T>
}
export declare type IsAny<T, True, False = never> = true | false extends (
  T extends never ? true : false
)
  ? True
  : False
export declare type IsUnknown<T, True, False = never> = unknown extends T
  ? IsAny<T, False, True>
  : False
export function expectType<T>(t: T): T {
  return t
}
type Equals<T, U> = IsAny<
  T,
  never,
  IsAny<U, never, [T] extends [U] ? ([U] extends [T] ? any : never) : never>
>
export function expectExactType<T>(t: T) {
  return <U extends Equals<T, U>>(u: U) => {}
}
type EnsureUnknown<T> = IsUnknown<T, any, never>
export function expectUnknown<T extends EnsureUnknown<T>>(t: T) {
  return t
}
type EnsureAny<T> = IsAny<T, any, never>
export function expectExactAny<T extends EnsureAny<T>>(t: T) {
  return t
}
type IsNotAny<T> = IsAny<T, never, any>
export function expectNotAny<T extends IsNotAny<T>>(t: T): T {
  return t
}
describe("createListenerMiddleware", () => {
  let store = qx.configureStore({
    reducer: () => 42,
    middleware: gDM => gDM().prepend(qx.createListenerMiddleware().middleware),
  })
  interface CounterState {
    value: number
  }
  const counterSlice = qx.createSlice({
    name: "counter",
    initialState: { value: 0 } as CounterState,
    reducers: {
      increment(state) {
        state.value += 1
      },
      decrement(state) {
        state.value -= 1
      },
      incrementByAmount: (state, action: qx.PayloadAction<number>) => {
        state.value += action.payload
      },
    },
  })
  const { increment, decrement, incrementByAmount } = counterSlice.actions
  function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
  let reducer: jest.Mock
  let listenerMiddleware = qx.createListenerMiddleware()
  let { middleware, startListening, stopListening, clearListeners } =
    listenerMiddleware
  const addTypedListenerAction =
    qx.addListener as qx.TypedAddListener<CounterState>
  const removeTypedListenerAction =
    qx.removeListener as qx.TypedRemoveListener<CounterState>
  const testAction1 = qx.createAction<string>("testAction1")
  type TestAction1 = ReturnType<typeof testAction1>
  const testAction2 = qx.createAction<string>("testAction2")
  type TestAction2 = ReturnType<typeof testAction2>
  const testAction3 = qx.createAction<string>("testAction3")
  type TestAction3 = ReturnType<typeof testAction3>
  beforeAll(() => {
    jest.spyOn(console, "error").mockImplementation(noop)
  })
  beforeEach(() => {
    listenerMiddleware = qx.createListenerMiddleware()
    middleware = listenerMiddleware.middleware
    startListening = listenerMiddleware.startListening
    stopListening = listenerMiddleware.stopListening
    clearListeners = listenerMiddleware.clearListeners
    reducer = jest.fn(() => ({}))
    store = qx.configureStore({
      reducer,
      middleware: gDM => gDM().prepend(middleware),
    })
  })
  describe("Middleware setup", () => {
    it("Allows passing an extra argument on middleware creation", () => {
      const originalExtra = 42
      const listenerMiddleware = qx.createListenerMiddleware({
        extra: originalExtra,
      })
      const store = qx.configureStore({
        reducer: counterSlice.reducer,
        middleware: gDM => gDM().prepend(listenerMiddleware.middleware),
      })
      let foundExtra: number | null = null
      const typedAddListener =
        listenerMiddleware.startListening as qx.TypedStartListening<
          CounterState,
          typeof store.dispatch,
          typeof originalExtra
        >
      typedAddListener({
        matcher: (action: qx.AnyAction): action is qx.AnyAction => true,
        effect: (action, listenerApi) => {
          foundExtra = listenerApi.extra
          expectType<typeof originalExtra>(listenerApi.extra)
        },
      })
      store.dispatch(testAction1("a"))
      expect(foundExtra).toBe(originalExtra)
    })
    it("Passes through if there are no listeners", () => {
      const originalAction = testAction1("a")
      const resultAction = store.dispatch(originalAction)
      expect(resultAction).toBe(originalAction)
    })
  })
  describe("Subscription and unsubscription", () => {
    it("directly subscribing", () => {
      const effect = jest.fn((_: TestAction1) => {})
      startListening({
        actionCreator: testAction1,
        effect: effect,
      })
      store.dispatch(testAction1("a"))
      store.dispatch(testAction2("b"))
      store.dispatch(testAction1("c"))
      expect(effect.mock.calls).toEqual([
        [testAction1("a"), middlewareApi],
        [testAction1("c"), middlewareApi],
      ])
    })
    it("stopListening returns true if an entry has been unsubscribed, false otherwise", () => {
      const effect = jest.fn((_: TestAction1) => {})
      startListening({
        actionCreator: testAction1,
        effect,
      })
      expect(stopListening({ actionCreator: testAction2, effect })).toBe(false)
      expect(stopListening({ actionCreator: testAction1, effect })).toBe(true)
    })
    it("dispatch(removeListener({...})) returns true if an entry has been unsubscribed, false otherwise", () => {
      const effect = jest.fn((_: TestAction1) => {})
      startListening({
        actionCreator: testAction1,
        effect,
      })
      expect(
        store.dispatch(
          removeTypedListenerAction({
            actionCreator: testAction2,
            effect,
          })
        )
      ).toBe(false)
      expect(
        store.dispatch(
          removeTypedListenerAction({
            actionCreator: testAction1,
            effect,
          })
        )
      ).toBe(true)
    })
    it("can subscribe with a string action type", () => {
      const effect = jest.fn((_: qx.AnyAction) => {})
      store.dispatch(
        qx.addListener({
          type: testAction2.type,
          effect,
        })
      )
      store.dispatch(testAction2("b"))
      expect(effect.mock.calls).toEqual([[testAction2("b"), middlewareApi]])
      store.dispatch(qx.removeListener({ type: testAction2.type, effect }))
      store.dispatch(testAction2("b"))
      expect(effect.mock.calls).toEqual([[testAction2("b"), middlewareApi]])
    })
    it("can subscribe with a matcher function", () => {
      const effect = jest.fn((_: qx.AnyAction) => {})
      const isAction1Or2 = qx.isAnyOf(testAction1, testAction2)
      const unsubscribe = startListening({
        matcher: isAction1Or2,
        effect: effect,
      })
      store.dispatch(testAction1("a"))
      store.dispatch(testAction2("b"))
      store.dispatch(testAction3("c"))
      expect(effect.mock.calls).toEqual([
        [testAction1("a"), middlewareApi],
        [testAction2("b"), middlewareApi],
      ])
      unsubscribe()
      store.dispatch(testAction2("b"))
      expect(effect.mock.calls).toEqual([
        [testAction1("a"), middlewareApi],
        [testAction2("b"), middlewareApi],
      ])
    })
    it("Can subscribe with an action predicate function", () => {
      const store = qx.configureStore({
        reducer: counterSlice.reducer,
        middleware: gDM => gDM().prepend(middleware),
      })
      let listener1Calls = 0
      startListening({
        predicate: (action, state) => {
          return (state as CounterState).value > 1
        },
        effect: () => {
          listener1Calls++
        },
      })
      let listener2Calls = 0
      startListening({
        predicate: (action, state, prevState) => {
          return (
            (state as CounterState).value > 1 &&
            (prevState as CounterState).value % 2 === 0
          )
        },
        effect: () => {
          listener2Calls++
        },
      })
      store.dispatch(increment())
      store.dispatch(increment())
      store.dispatch(increment())
      store.dispatch(increment())
      expect(listener1Calls).toBe(3)
      expect(listener2Calls).toBe(1)
    })
    it("subscribing with the same listener will not make it trigger twice (like EventTarget.addEventListener())", () => {
      const effect = jest.fn((_: TestAction1) => {})
      startListening({
        actionCreator: testAction1,
        effect,
      })
      startListening({
        actionCreator: testAction1,
        effect,
      })
      store.dispatch(testAction1("a"))
      store.dispatch(testAction2("b"))
      store.dispatch(testAction1("c"))
      expect(effect.mock.calls).toEqual([
        [testAction1("a"), middlewareApi],
        [testAction1("c"), middlewareApi],
      ])
    })
    it("unsubscribing via callback", () => {
      const effect = jest.fn((_: TestAction1) => {})
      const unsubscribe = startListening({
        actionCreator: testAction1,
        effect,
      })
      store.dispatch(testAction1("a"))
      unsubscribe()
      store.dispatch(testAction2("b"))
      store.dispatch(testAction1("c"))
      expect(effect.mock.calls).toEqual([[testAction1("a"), middlewareApi]])
    })
    it("directly unsubscribing", () => {
      const effect = jest.fn((_: TestAction1) => {})
      startListening({
        actionCreator: testAction1,
        effect,
      })
      store.dispatch(testAction1("a"))
      stopListening({ actionCreator: testAction1, effect })
      store.dispatch(testAction2("b"))
      store.dispatch(testAction1("c"))
      expect(effect.mock.calls).toEqual([[testAction1("a"), middlewareApi]])
    })
    it("unsubscribing without any subscriptions does not trigger an error", () => {
      stopListening({ matcher: testAction1.match, effect: noop })
    })
    it("subscribing via action", () => {
      const effect = jest.fn((_: TestAction1) => {})
      store.dispatch(
        qx.addListener({
          actionCreator: testAction1,
          effect,
        })
      )
      store.dispatch(testAction1("a"))
      store.dispatch(testAction2("b"))
      store.dispatch(testAction1("c"))
      expect(effect.mock.calls).toEqual([
        [testAction1("a"), middlewareApi],
        [testAction1("c"), middlewareApi],
      ])
    })
    it("unsubscribing via callback from dispatch", () => {
      const effect = jest.fn((_: TestAction1) => {})
      const unsubscribe = store.dispatch(
        qx.addListener({
          actionCreator: testAction1,
          effect,
        })
      )
      expectType<qx.UnsubscribeListener>(unsubscribe)
      store.dispatch(testAction1("a"))
      unsubscribe()
      store.dispatch(testAction2("b"))
      store.dispatch(testAction1("c"))
      expect(effect.mock.calls).toEqual([[testAction1("a"), middlewareApi]])
    })
    it("unsubscribing via action", () => {
      const effect = jest.fn((_: TestAction1) => {})
      startListening({
        actionCreator: testAction1,
        effect,
      })
      startListening({
        actionCreator: testAction1,
        effect,
      })
      store.dispatch(testAction1("a"))
      store.dispatch(qx.removeListener({ actionCreator: testAction1, effect }))
      store.dispatch(testAction2("b"))
      store.dispatch(testAction1("c"))
      expect(effect.mock.calls).toEqual([[testAction1("a"), middlewareApi]])
    })
    it("can cancel an active listener when unsubscribing directly", async () => {
      let wasCancelled = false
      const unsubscribe = startListening({
        actionCreator: testAction1,
        effect: async (action, listenerApi) => {
          try {
            await listenerApi.condition(testAction2.match)
          } catch (err) {
            if (err instanceof qx.TaskAbortError) {
              wasCancelled = true
            }
          }
        },
      })
      store.dispatch(testAction1("a"))
      unsubscribe({ cancelActive: true })
      expect(wasCancelled).toBe(false)
      await delay(10)
      expect(wasCancelled).toBe(true)
    })
    it("can cancel an active listener when unsubscribing via stopListening", async () => {
      let wasCancelled = false
      const effect = async (action: any, listenerApi: any) => {
        try {
          await listenerApi.condition(testAction2.match)
        } catch (err) {
          if (err instanceof qx.TaskAbortError) {
            wasCancelled = true
          }
        }
      }
      startListening({
        actionCreator: testAction1,
        effect,
      })
      store.dispatch(testAction1("a"))
      stopListening({ actionCreator: testAction1, effect, cancelActive: true })
      expect(wasCancelled).toBe(false)
      await delay(10)
      expect(wasCancelled).toBe(true)
    })
    it("can cancel an active listener when unsubscribing via removeListener", async () => {
      let wasCancelled = false
      const effect = async (action: any, listenerApi: any) => {
        try {
          await listenerApi.condition(testAction2.match)
        } catch (err) {
          if (err instanceof qx.TaskAbortError) {
            wasCancelled = true
          }
        }
      }
      startListening({
        actionCreator: testAction1,
        effect,
      })
      store.dispatch(testAction1("a"))
      store.dispatch(
        qx.removeListener({
          actionCreator: testAction1,
          effect,
          cancelActive: true,
        })
      )
      expect(wasCancelled).toBe(false)
      await delay(10)
      expect(wasCancelled).toBe(true)
    })
    const addListenerOptions: [
      string,
      Omit<
        qx.AddListenerOverloads<
          () => void,
          typeof store.getState,
          typeof store.dispatch
        >,
        "effect"
      >
    ][] = [
      ["predicate", { predicate: () => true }],
      ["actionCreator", { actionCreator: testAction1 }],
      ["matcher", { matcher: qx.isAnyOf(testAction1, testAction2) }],
      ["type", { type: testAction1.type }],
    ]
    test.each(addListenerOptions)(
      'add and remove listener with "%s" param correctly',
      (_, params) => {
        const effect: qx.ListenerEffect<
          qx.AnyAction,
          typeof store.getState,
          typeof store.dispatch
        > = jest.fn()
        startListening({ ...params, effect } as any)
        store.dispatch(testAction1("a"))
        expect(effect).toBeCalledTimes(1)
        stopListening({ ...params, effect } as any)
        store.dispatch(testAction1("b"))
        expect(effect).toBeCalledTimes(1)
      }
    )
    const unforwardedActions: [string, qx.AnyAction][] = [
      [
        "addListener",
        qx.addListener({ actionCreator: testAction1, effect: noop }),
      ],
      [
        "removeListener",
        qx.removeListener({ actionCreator: testAction1, effect: noop }),
      ],
    ]
    test.each(unforwardedActions)(
      '"%s" is not forwarded to the reducer',
      (_, action) => {
        reducer.mockClear()
        store.dispatch(testAction1("a"))
        store.dispatch(action)
        store.dispatch(testAction2("b"))
        expect(reducer.mock.calls).toEqual([
          [{}, testAction1("a")],
          [{}, testAction2("b")],
        ])
      }
    )
    it("listenerApi.signal has correct reason when listener is cancelled or completes", async () => {
      const notifyDeferred =
        qx.createAction<Deferred<string>>("notify-deferred")
      startListening({
        actionCreator: notifyDeferred,
        async effect({ payload }, { signal, cancelActiveListeners, delay }) {
          signal.addEventListener(
            "abort",
            () => {
              payload.resolve(
                (signal as qx.AbortSignalWithReason<string>).reason
              )
            },
            { once: true }
          )
          cancelActiveListeners()
          delay(10)
        },
      })
      const deferredCancelledSignalReason = store.dispatch(
        notifyDeferred(deferred<string>())
      ).payload
      const deferredCompletedSignalReason = store.dispatch(
        notifyDeferred(deferred<string>())
      ).payload
      expect(await deferredCancelledSignalReason).toBe(qx.listenerCancelled)
      expect(await deferredCompletedSignalReason).toBe(qx.listenerCompleted)
    })
    test('"can unsubscribe via middleware api', () => {
      const effect = jest.fn(
        (action: TestAction1, api: qx.ListenerEffectAPI<any, any>) => {
          if (action.payload === "b") {
            api.unsubscribe()
          }
        }
      )
      startListening({
        actionCreator: testAction1,
        effect,
      })
      store.dispatch(testAction1("a"))
      store.dispatch(testAction1("b"))
      store.dispatch(testAction1("c"))
      expect(effect.mock.calls).toEqual([
        [testAction1("a"), middlewareApi],
        [testAction1("b"), middlewareApi],
      ])
    })
    it("Can re-subscribe via middleware api", async () => {
      let numListenerRuns = 0
      startListening({
        actionCreator: testAction1,
        effect: async (action, listenerApi) => {
          numListenerRuns++
          listenerApi.unsubscribe()
          await listenerApi.condition(testAction2.match)
          listenerApi.subscribe()
        },
      })
      store.dispatch(testAction1("a"))
      expect(numListenerRuns).toBe(1)
      store.dispatch(testAction1("a"))
      expect(numListenerRuns).toBe(1)
      store.dispatch(testAction2("b"))
      expect(numListenerRuns).toBe(1)
      await delay(5)
      store.dispatch(testAction1("b"))
      expect(numListenerRuns).toBe(2)
    })
  })
  describe("clear listeners", () => {
    it("dispatch(clearListenerAction()) cancels running listeners and removes all subscriptions", async () => {
      const listener1Test = deferred()
      let listener1Calls = 0
      let listener2Calls = 0
      let listener3Calls = 0
      startListening({
        actionCreator: testAction1,
        async effect(_, listenerApi) {
          listener1Calls++
          listenerApi.signal.addEventListener(
            "abort",
            () => listener1Test.resolve(listener1Calls),
            { once: true }
          )
          await listenerApi.condition(() => true)
          listener1Test.reject(new Error("unreachable: listener1Test"))
        },
      })
      startListening({
        actionCreator: qx.clearAllListeners,
        effect() {
          listener2Calls++
        },
      })
      startListening({
        predicate: () => true,
        effect() {
          listener3Calls++
        },
      })
      store.dispatch(testAction1("a"))
      store.dispatch(qx.clearAllListeners())
      store.dispatch(testAction1("b"))
      expect(await listener1Test).toBe(1)
      expect(listener1Calls).toBe(1)
      expect(listener3Calls).toBe(1)
      expect(listener2Calls).toBe(0)
    })
    it("clear() cancels running listeners and removes all subscriptions", async () => {
      const listener1Test = deferred()
      let listener1Calls = 0
      let listener2Calls = 0
      startListening({
        actionCreator: testAction1,
        async effect(_, listenerApi) {
          listener1Calls++
          listenerApi.signal.addEventListener(
            "abort",
            () => listener1Test.resolve(listener1Calls),
            { once: true }
          )
          await listenerApi.condition(() => true)
          listener1Test.reject(new Error("unreachable: listener1Test"))
        },
      })
      startListening({
        actionCreator: testAction2,
        effect() {
          listener2Calls++
        },
      })
      store.dispatch(testAction1("a"))
      clearListeners()
      store.dispatch(testAction1("b"))
      store.dispatch(testAction2("c"))
      expect(listener2Calls).toBe(0)
      expect(await listener1Test).toBe(1)
    })
    it("clear() cancels all running forked tasks", async () => {
      const store = qx.configureStore({
        reducer: counterSlice.reducer,
        middleware: gDM => gDM().prepend(middleware),
      })
      startListening({
        actionCreator: testAction1,
        async effect(_, { fork, dispatch }) {
          await fork(() => dispatch(incrementByAmount(3))).result
          dispatch(incrementByAmount(4))
        },
      })
      expect(store.getState().value).toBe(0)
      store.dispatch(testAction1("a"))
      clearListeners()
      await Promise.resolve() // Forked tasks run on the next microtask.
      expect(store.getState().value).toBe(0)
    })
  })
  describe("Listener API", () => {
    it("Passes both getState and getOriginalState in the API", () => {
      const store = qx.configureStore({
        reducer: counterSlice.reducer,
        middleware: gDM => gDM().prepend(middleware),
      })
      let listener1Calls = 0
      startListening({
        actionCreator: increment,
        effect: (action, listenerApi) => {
          const stateBefore = listenerApi.getOriginalState() as CounterState
          const currentState = listenerApi.getOriginalState() as CounterState
          listener1Calls++
          expect(currentState).toBe(stateBefore)
        },
      })
      let listener2Calls = 0
      startListening({
        actionCreator: increment,
        effect: (action, listenerApi) => {
          const stateBefore = listenerApi.getOriginalState() as CounterState
          const currentState = listenerApi.getOriginalState() as CounterState
          listener2Calls++
          expect(currentState.value).toBe(stateBefore.value + 1)
        },
      })
      store.dispatch(increment())
      expect(listener1Calls).toBe(1)
      expect(listener2Calls).toBe(1)
    })
    it("getOriginalState can only be invoked synchronously", async () => {
      const onError = jest.fn()
      const listenerMiddleware = qx.createListenerMiddleware<CounterState>({
        onError,
      })
      const { middleware, startListening } = listenerMiddleware
      const store = qx.configureStore({
        reducer: counterSlice.reducer,
        middleware: gDM => gDM().prepend(middleware),
      })
      startListening({
        actionCreator: increment,
        async effect(_, listenerApi) {
          const runIncrementBy = () => {
            listenerApi.dispatch(
              counterSlice.actions.incrementByAmount(
                listenerApi.getOriginalState().value + 2
              )
            )
          }
          runIncrementBy()
          await Promise.resolve()
          runIncrementBy()
        },
      })
      expect(store.getState()).toEqual({ value: 0 })
      store.dispatch(increment()) // state.value+=1 && trigger listener
      expect(onError).not.toHaveBeenCalled()
      expect(store.getState()).toEqual({ value: 3 })
      await delay(0)
      expect(onError).toBeCalledWith(
        new Error(
          "listenerMiddleware: getOriginalState can only be called synchronously"
        ),
        { raisedBy: "effect" }
      )
      expect(store.getState()).toEqual({ value: 3 })
    })
    it("by default, actions are forwarded to the store", () => {
      reducer.mockClear()
      const effect = jest.fn((_: TestAction1) => {})
      startListening({
        actionCreator: testAction1,
        effect,
      })
      store.dispatch(testAction1("a"))
      expect(reducer.mock.calls).toEqual([[{}, testAction1("a")]])
    })
    it("listenerApi.delay does not trigger unhandledRejections for completed or cancelled listners", async () => {
      const deferredCompletedEvt = deferred()
      const deferredCancelledEvt = deferred()
      const godotPauseTrigger = deferred()
      startListening({
        actionCreator: increment,
        effect: async (_, listenerApi) => {
          listenerApi.unsubscribe()
          listenerApi.signal.addEventListener(
            "abort",
            deferredCompletedEvt.resolve,
            { once: true }
          )
          listenerApi.delay(100) // missing await
        },
      })
      startListening({
        actionCreator: increment,
        effect: async (_, listenerApi) => {
          listenerApi.cancelActiveListeners()
          listenerApi.signal.addEventListener(
            "abort",
            deferredCancelledEvt.resolve,
            { once: true }
          )
          listenerApi.delay(100) // missing await
          listenerApi.pause(godotPauseTrigger)
        },
      })
      store.dispatch(increment())
      store.dispatch(increment())
      expect(await deferredCompletedEvt).toBeDefined()
      expect(await deferredCancelledEvt).toBeDefined()
    })
  })
  describe("Error handling", () => {
    it("Continues running other listeners if one of them raises an error", () => {
      const matcher = (action: any): action is any => true
      startListening({
        matcher,
        effect: () => {
          throw new Error("Panic!")
        },
      })
      const effect = jest.fn(() => {})
      startListening({ matcher, effect })
      store.dispatch(testAction1("a"))
      expect(effect.mock.calls).toEqual([[testAction1("a"), middlewareApi]])
    })
    it("Continues running other listeners if a predicate raises an error", () => {
      const matcher = (action: any): action is any => true
      const firstListener = jest.fn(() => {})
      const secondListener = jest.fn(() => {})
      startListening({
        matcher: (arg: unknown): arg is unknown => {
          throw new Error("Predicate Panic!")
        },
        effect: firstListener,
      })
      startListening({ matcher, effect: secondListener })
      store.dispatch(testAction1("a"))
      expect(firstListener).not.toHaveBeenCalled()
      expect(secondListener.mock.calls).toEqual([
        [testAction1("a"), middlewareApi],
      ])
    })
    it("Notifies sync listener errors to `onError`, if provided", async () => {
      const onError = jest.fn()
      const listenerMiddleware = qx.createListenerMiddleware({
        onError,
      })
      const { middleware, startListening } = listenerMiddleware
      reducer = jest.fn(() => ({}))
      store = qx.configureStore({
        reducer,
        middleware: gDM => gDM().prepend(middleware),
      })
      const listenerError = new Error("Boom!")
      const matcher = (action: any): action is any => true
      startListening({
        matcher,
        effect: () => {
          throw listenerError
        },
      })
      store.dispatch(testAction1("a"))
      await delay(100)
      expect(onError).toBeCalledWith(listenerError, {
        raisedBy: "effect",
      })
    })
    it("Notifies async listeners errors to `onError`, if provided", async () => {
      const onError = jest.fn()
      const listenerMiddleware = qx.createListenerMiddleware({
        onError,
      })
      const { middleware, startListening } = listenerMiddleware
      reducer = jest.fn(() => ({}))
      store = qx.configureStore({
        reducer,
        middleware: gDM => gDM().prepend(middleware),
      })
      const listenerError = new Error("Boom!")
      const matcher = (action: any): action is any => true
      startListening({
        matcher,
        effect: async () => {
          throw listenerError
        },
      })
      store.dispatch(testAction1("a"))
      await delay(100)
      expect(onError).toBeCalledWith(listenerError, {
        raisedBy: "effect",
      })
    })
  })
  describe("take and condition methods", () => {
    it("take resolves to the tuple [A, CurrentState, PreviousState] when the predicate matches the action", async () => {
      const store = qx.configureStore({
        reducer: counterSlice.reducer,
        middleware: gDM => gDM().prepend(middleware),
      })
      const typedAddListener = startListening as qx.TypedStartListening<
        CounterState,
        typeof store.dispatch
      >
      let result:
        | [ReturnType<typeof increment>, CounterState, CounterState]
        | null = null
      typedAddListener({
        predicate: incrementByAmount.match,
        async effect(_: qx.AnyAction, listenerApi) {
          result = await listenerApi.take(increment.match)
        },
      })
      store.dispatch(incrementByAmount(1))
      store.dispatch(increment())
      await delay(10)
      expect(result).toEqual([increment(), { value: 2 }, { value: 1 }])
    })
    it("take resolves to null if the timeout expires", async () => {
      const store = qx.configureStore({
        reducer: counterSlice.reducer,
        middleware: gDM => gDM().prepend(middleware),
      })
      let takeResult: any = undefined
      startListening({
        predicate: incrementByAmount.match,
        effect: async (_, listenerApi) => {
          takeResult = await listenerApi.take(increment.match, 15)
        },
      })
      store.dispatch(incrementByAmount(1))
      await delay(25)
      expect(takeResult).toBe(null)
    })
    it("take resolves to [A, CurrentState, PreviousState] if the timeout is provided but doesn't expire", async () => {
      const store = qx.configureStore({
        reducer: counterSlice.reducer,
        middleware: gDM => gDM().prepend(middleware),
      })
      let takeResult: any = undefined
      let stateBefore: any = undefined
      let stateCurrent: any = undefined
      startListening({
        predicate: incrementByAmount.match,
        effect: async (_, listenerApi) => {
          stateBefore = listenerApi.getState()
          takeResult = await listenerApi.take(increment.match, 50)
          stateCurrent = listenerApi.getState()
        },
      })
      store.dispatch(incrementByAmount(1))
      store.dispatch(increment())
      await delay(25)
      expect(takeResult).toEqual([increment(), stateCurrent, stateBefore])
    })
    it("take resolves to `[A, CurrentState, PreviousState] | null` if a possibly undefined timeout parameter is provided", async () => {
      const store = qx.configureStore({
        reducer: counterSlice.reducer,
        middleware: gDM => gDM().prepend(middleware),
      })
      type ExpectedTakeResultType =
        | readonly [ReturnType<typeof increment>, CounterState, CounterState]
        | null
      let timeout: number | undefined = undefined
      let done = false
      const startAppListening =
        startListening as qx.TypedStartListening<CounterState>
      startAppListening({
        predicate: incrementByAmount.match,
        effect: async (_, listenerApi) => {
          const stateBefore = listenerApi.getState()
          let takeResult = await listenerApi.take(increment.match, timeout)
          const stateCurrent = listenerApi.getState()
          expect(takeResult).toEqual([increment(), stateCurrent, stateBefore])
          timeout = 1
          takeResult = await listenerApi.take(increment.match, timeout)
          expect(takeResult).toBeNull()
          expectType<ExpectedTakeResultType>(takeResult)
          done = true
        },
      })
      store.dispatch(incrementByAmount(1))
      store.dispatch(increment())
      await delay(25)
      expect(done).toBe(true)
    })
    it("condition method resolves promise when the predicate succeeds", async () => {
      const store = qx.configureStore({
        reducer: counterSlice.reducer,
        middleware: gDM => gDM().prepend(middleware),
      })
      let finalCount = 0
      let listenerStarted = false
      startListening({
        predicate: (action, _, previousState) => {
          return (
            increment.match(action) &&
            (previousState as CounterState).value === 0
          )
        },
        effect: async (action, listenerApi) => {
          listenerStarted = true
          const result = await listenerApi.condition((action, currentState) => {
            return (currentState as CounterState).value === 3
          })
          expect(result).toBe(true)
          const latestState = listenerApi.getState() as CounterState
          finalCount = latestState.value
        },
      })
      store.dispatch(increment())
      expect(listenerStarted).toBe(true)
      await delay(25)
      store.dispatch(increment())
      store.dispatch(increment())
      await delay(25)
      expect(finalCount).toBe(3)
    })
    it("condition method resolves promise when there is a timeout", async () => {
      const store = qx.configureStore({
        reducer: counterSlice.reducer,
        middleware: gDM => gDM().prepend(middleware),
      })
      let finalCount = 0
      let listenerStarted = false
      startListening({
        predicate: (action, currentState) => {
          return (
            increment.match(action) &&
            (currentState as CounterState).value === 1
          )
        },
        effect: async (action, listenerApi) => {
          listenerStarted = true
          const result = await listenerApi.condition((action, currentState) => {
            return (currentState as CounterState).value === 3
          }, 25)
          expect(result).toBe(false)
          const latestState = listenerApi.getState() as CounterState
          finalCount = latestState.value
        },
      })
      store.dispatch(increment())
      expect(listenerStarted).toBe(true)
      store.dispatch(increment())
      await delay(50)
      store.dispatch(increment())
      expect(finalCount).toBe(2)
    })
    it("take does not trigger unhandledRejections for completed or cancelled tasks", async () => {
      const deferredCompletedEvt = deferred()
      const deferredCancelledEvt = deferred()
      const store = qx.configureStore({
        reducer: counterSlice.reducer,
        middleware: gDM => gDM().prepend(middleware),
      })
      const godotPauseTrigger = deferred()
      startListening({
        predicate: () => true,
        effect: async (_, listenerApi) => {
          listenerApi.unsubscribe() // run once
          listenerApi.signal.addEventListener(
            "abort",
            deferredCompletedEvt.resolve
          )
          listenerApi.take(() => true) // missing await
        },
      })
      startListening({
        predicate: () => true,
        effect: async (_, listenerApi) => {
          listenerApi.cancelActiveListeners()
          listenerApi.signal.addEventListener(
            "abort",
            deferredCancelledEvt.resolve
          )
          listenerApi.take(() => true) // missing await
          await listenerApi.pause(godotPauseTrigger)
        },
      })
      store.dispatch({ type: "type" })
      store.dispatch({ type: "type" })
      expect(await deferredCompletedEvt).toBeDefined()
    })
  })
  describe("Job API", () => {
    it("Allows canceling previous jobs", async () => {
      let jobsStarted = 0
      let jobsContinued = 0
      let jobsCanceled = 0
      startListening({
        actionCreator: increment,
        effect: async (action, listenerApi) => {
          jobsStarted++
          if (jobsStarted < 3) {
            try {
              await listenerApi.condition(decrement.match)
              jobsContinued++
            } catch (err) {
              if (err instanceof qx.TaskAbortError) {
                jobsCanceled++
              }
            }
          } else {
            listenerApi.cancelActiveListeners()
          }
        },
      })
      store.dispatch(increment())
      store.dispatch(increment())
      store.dispatch(increment())
      await delay(10)
      expect(jobsStarted).toBe(3)
      expect(jobsContinued).toBe(0)
      expect(jobsCanceled).toBe(2)
    })
  })
  describe("Type tests", () => {
    const listenerMiddleware = qx.createListenerMiddleware()
    const { middleware, startListening } = listenerMiddleware
    const store = qx.configureStore({
      reducer: counterSlice.reducer,
      middleware: gDM => gDM().prepend(middleware),
    })
    it("State args default to unknown", () => {
      qx.createListenerEntry({
        predicate: (
          action,
          currentState,
          previousState
        ): action is qx.AnyAction => {
          expectUnknown(currentState)
          expectUnknown(previousState)
          return true
        },
        effect: (action, listenerApi) => {
          const listenerState = listenerApi.getState()
          expectUnknown(listenerState)
          listenerApi.dispatch((dispatch, getState) => {
            const thunkState = getState()
            expectUnknown(thunkState)
          })
        },
      })
      startListening({
        predicate: (
          action,
          currentState,
          previousState
        ): action is qx.AnyAction => {
          expectUnknown(currentState)
          expectUnknown(previousState)
          return true
        },
        effect: (action, listenerApi) => {},
      })
      startListening({
        matcher: increment.match,
        effect: (action, listenerApi) => {
          const listenerState = listenerApi.getState()
          expectUnknown(listenerState)
          listenerApi.dispatch((dispatch, getState) => {
            const thunkState = getState()
            expectUnknown(thunkState)
          })
        },
      })
      store.dispatch(
        qx.addListener({
          predicate: (
            action,
            currentState,
            previousState
          ): action is qx.AnyAction => {
            expectUnknown(currentState)
            expectUnknown(previousState)
            return true
          },
          effect: (action, listenerApi) => {
            const listenerState = listenerApi.getState()
            expectUnknown(listenerState)
            listenerApi.dispatch((dispatch, getState) => {
              const thunkState = getState()
              expectUnknown(thunkState)
            })
          },
        })
      )
      store.dispatch(
        qx.addListener({
          matcher: increment.match,
          effect: (action, listenerApi) => {
            const listenerState = listenerApi.getState()
            expectUnknown(listenerState)
            listenerApi.dispatch((dispatch, getState) => {
              const thunkState = getState()
              expectUnknown(thunkState)
            })
          },
        })
      )
    })
    it("Action type is inferred from args", () => {
      startListening({
        type: "abcd",
        effect: (action, listenerApi) => {
          expectType<{ type: "abcd" }>(action)
        },
      })
      startListening({
        actionCreator: incrementByAmount,
        effect: (action, listenerApi) => {
          expectType<qx.PayloadAction<number>>(action)
        },
      })
      startListening({
        matcher: incrementByAmount.match,
        effect: (action, listenerApi) => {
          expectType<qx.PayloadAction<number>>(action)
        },
      })
      startListening({
        predicate: (
          action,
          currentState,
          previousState
        ): action is qx.PayloadAction<number> => {
          return typeof action.payload === "boolean"
        },
        effect: (action, listenerApi) => {
          expectExactType<qx.PayloadAction<number>>(action)
        },
      })
      startListening({
        predicate: (action, currentState) => {
          return typeof action.payload === "number"
        },
        effect: (action, listenerApi) => {
          expectExactType<qx.AnyAction>(action)
        },
      })
      store.dispatch(
        qx.addListener({
          type: "abcd",
          effect: (action, listenerApi) => {
            expectType<{ type: "abcd" }>(action)
          },
        })
      )
      store.dispatch(
        qx.addListener({
          actionCreator: incrementByAmount,
          effect: (action, listenerApi) => {
            expectType<qx.PayloadAction<number>>(action)
          },
        })
      )
      store.dispatch(
        qx.addListener({
          matcher: incrementByAmount.match,
          effect: (action, listenerApi) => {
            expectType<qx.PayloadAction<number>>(action)
          },
        })
      )
    })
    it("Can create a pre-typed middleware", () => {
      const typedMiddleware = qx.createListenerMiddleware<CounterState>()
      typedMiddleware.startListening({
        predicate: (
          action,
          currentState,
          previousState
        ): action is qx.AnyAction => {
          expectNotAny(currentState)
          expectNotAny(previousState)
          expectExactType<CounterState>(currentState)
          expectExactType<CounterState>(previousState)
          return true
        },
        effect: (action, listenerApi) => {
          const listenerState = listenerApi.getState()
          expectExactType<CounterState>(listenerState)
          listenerApi.dispatch((dispatch, getState) => {
            const thunkState = listenerApi.getState()
            expectExactType<CounterState>(thunkState)
          })
        },
      })
      typedMiddleware.startListening({
        predicate: (
          action: qx.AnyAction,
          currentState: CounterState
        ): action is qx.PayloadAction<number> => {
          expectNotAny(currentState)
          expectExactType<CounterState>(currentState)
          return true
        },
        effect: (action, listenerApi) => {
          expectType<qx.PayloadAction<number>>(action)
          const listenerState = listenerApi.getState()
          expectExactType<CounterState>(listenerState)
          listenerApi.dispatch((dispatch, getState) => {
            const thunkState = listenerApi.getState()
            expectExactType<CounterState>(thunkState)
          })
        },
      })
      typedMiddleware.startListening({
        actionCreator: incrementByAmount,
        effect: (action, listenerApi) => {
          const listenerState = listenerApi.getState()
          expectExactType<CounterState>(listenerState)
          listenerApi.dispatch((dispatch, getState) => {
            const thunkState = listenerApi.getState()
            expectExactType<CounterState>(thunkState)
          })
        },
      })
      store.dispatch(
        addTypedListenerAction({
          predicate: (
            action,
            currentState,
            previousState
          ): action is ReturnType<typeof incrementByAmount> => {
            expectNotAny(currentState)
            expectNotAny(previousState)
            expectExactType<CounterState>(currentState)
            expectExactType<CounterState>(previousState)
            return true
          },
          effect: (action, listenerApi) => {
            const listenerState = listenerApi.getState()
            expectExactType<CounterState>(listenerState)
            listenerApi.dispatch((dispatch, getState) => {
              const thunkState = listenerApi.getState()
              expectExactType<CounterState>(thunkState)
            })
          },
        })
      )
      store.dispatch(
        addTypedListenerAction({
          predicate: (
            action,
            currentState,
            previousState
          ): action is qx.AnyAction => {
            expectNotAny(currentState)
            expectNotAny(previousState)
            expectExactType<CounterState>(currentState)
            expectExactType<CounterState>(previousState)
            return true
          },
          effect: (action, listenerApi) => {
            const listenerState = listenerApi.getState()
            expectExactType<CounterState>(listenerState)
            listenerApi.dispatch((dispatch, getState) => {
              const thunkState = listenerApi.getState()
              expectExactType<CounterState>(thunkState)
            })
          },
        })
      )
    })
    it("Can create pre-typed versions of startListening and addListener", () => {
      const typedAddListener =
        startListening as qx.TypedStartListening<CounterState>
      const typedAddListenerAction =
        qx.addListener as qx.TypedAddListener<CounterState>
      typedAddListener({
        predicate: (
          action,
          currentState,
          previousState
        ): action is qx.AnyAction => {
          expectNotAny(currentState)
          expectNotAny(previousState)
          expectExactType<CounterState>(currentState)
          expectExactType<CounterState>(previousState)
          return true
        },
        effect: (action, listenerApi) => {
          const listenerState = listenerApi.getState()
          expectExactType<CounterState>(listenerState)
          listenerApi.dispatch((dispatch, getState) => {
            const thunkState = listenerApi.getState()
            expectExactType<CounterState>(thunkState)
          })
        },
      })
      typedAddListener({
        matcher: incrementByAmount.match,
        effect: (action, listenerApi) => {
          const listenerState = listenerApi.getState()
          expectExactType<CounterState>(listenerState)
          listenerApi.dispatch((dispatch, getState) => {
            const thunkState = listenerApi.getState()
            expectExactType<CounterState>(thunkState)
          })
        },
      })
      store.dispatch(
        typedAddListenerAction({
          predicate: (
            action,
            currentState,
            previousState
          ): action is qx.AnyAction => {
            expectNotAny(currentState)
            expectNotAny(previousState)
            expectExactType<CounterState>(currentState)
            expectExactType<CounterState>(previousState)
            return true
          },
          effect: (action, listenerApi) => {
            const listenerState = listenerApi.getState()
            expectExactType<CounterState>(listenerState)
            listenerApi.dispatch((dispatch, getState) => {
              const thunkState = listenerApi.getState()
              expectExactType<CounterState>(thunkState)
            })
          },
        })
      )
      store.dispatch(
        typedAddListenerAction({
          matcher: incrementByAmount.match,
          effect: (action, listenerApi) => {
            const listenerState = listenerApi.getState()
            expectExactType<CounterState>(listenerState)
            listenerApi.dispatch((dispatch, getState) => {
              const thunkState = listenerApi.getState()
              expectExactType<CounterState>(thunkState)
            })
          },
        })
      )
    })
  })
})

describe("Saga-style Effects Scenarios", () => {
  interface CounterState {
    value: number
  }
  const counterSlice = qx.createSlice({
    name: "counter",
    initialState: { value: 0 } as CounterState,
    reducers: {
      increment(state) {
        state.value += 1
      },
      decrement(state) {
        state.value -= 1
      },
      incrementByAmount: (state, action: qx.PayloadAction<number>) => {
        state.value += action.payload
      },
    },
  })
  const { increment, decrement, incrementByAmount } = counterSlice.actions
  const { reducer } = counterSlice
  let listenerMiddleware = qx.createListenerMiddleware<CounterState>()
  let { middleware, startListening, stopListening } = listenerMiddleware
  let store = qx.configureStore({
    reducer,
    middleware: gDM => gDM().prepend(middleware),
  })
  const testAction1 = qx.createAction<string>("testAction1")
  type TestAction1 = ReturnType<typeof testAction1>
  const testAction2 = qx.createAction<string>("testAction2")
  type TestAction2 = ReturnType<typeof testAction2>
  const testAction3 = qx.createAction<string>("testAction3")
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
    listenerMiddleware = qx.createListenerMiddleware<CounterState>()
    middleware = listenerMiddleware.middleware
    startListening = listenerMiddleware.startListening
    store = qx.configureStore({
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
      matcher: qx.isAnyOf(increment, decrement, incrementByAmount),
      effect: async (action, listenerApi) => {
        if (increment.match(action)) {
          try {
            await listenerApi.delay(10)
          } catch (err) {
            if (err instanceof qx.TaskAbortError) {
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

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
export interface Deferred<T> extends Promise<T> {
  resolve(value?: T | PromiseLike<T>): void
  reject(reason?: any): void
}
export function deferred<T>(): Deferred<T> {
  let methods
  const promise = new Promise<T>((resolve, reject): void => {
    methods = { resolve, reject }
  })
  return Object.assign(promise, methods) as Deferred<T>
}
interface CounterSlice {
  value: number
}
describe("fork", () => {
  const counterSlice = qx.createSlice({
    name: "counter",
    initialState: { value: 0 } as CounterSlice,
    reducers: {
      increment(state) {
        state.value += 1
      },
      decrement(state) {
        state.value -= 1
      },
      incrementByAmount: (state, action: qx.PayloadAction<number>) => {
        state.value += action.payload
      },
    },
  })
  const { increment, decrement, incrementByAmount } = counterSlice.actions
  let listenerMiddleware = qx.createListenerMiddleware()
  let { middleware, startListening, stopListening } = listenerMiddleware
  let store = qx.configureStore({
    reducer: counterSlice.reducer,
    middleware: gDM => gDM().prepend(middleware),
  })
  beforeEach(() => {
    listenerMiddleware = qx.createListenerMiddleware()
    middleware = listenerMiddleware.middleware
    startListening = listenerMiddleware.startListening
    stopListening = listenerMiddleware.stopListening
    store = qx.configureStore({
      reducer: counterSlice.reducer,
      middleware: gDM => gDM().prepend(middleware),
    })
  })
  it("runs executors in the next microtask", async () => {
    let hasRunSyncExector = false
    let hasRunAsyncExecutor = false
    startListening({
      actionCreator: increment,
      effect: async (_, listenerApi) => {
        listenerApi.fork(() => {
          hasRunSyncExector = true
        })
        listenerApi.fork(async () => {
          hasRunAsyncExecutor = true
        })
      },
    })
    store.dispatch(increment())
    expect(hasRunSyncExector).toBe(false)
    expect(hasRunAsyncExecutor).toBe(false)
    await Promise.resolve()
    expect(hasRunSyncExector).toBe(true)
    expect(hasRunAsyncExecutor).toBe(true)
  })
  test("forkedTask.result rejects TaskAbortError if listener is cancelled", async () => {
    const deferredForkedTaskError = deferred()
    startListening({
      actionCreator: increment,
      async effect(_, listenerApi) {
        listenerApi.cancelActiveListeners()
        listenerApi
          .fork(async () => {
            await delay(10)
            throw new Error("unreachable code")
          })
          .result.then(
            deferredForkedTaskError.resolve,
            deferredForkedTaskError.resolve
          )
      },
    })
    store.dispatch(increment())
    store.dispatch(increment())
    expect(await deferredForkedTaskError).toEqual(
      new qx.TaskAbortError(qx.listenerCancelled)
    )
  })
  it("synchronously throws TypeError error if the provided executor is not a function", () => {
    const invalidExecutors = [null, {}, undefined, 1]
    startListening({
      predicate: () => true,
      effect: async (_, listenerApi) => {
        invalidExecutors.forEach(invalidExecutor => {
          let caughtError
          try {
            listenerApi.fork(invalidExecutor as any)
          } catch (err) {
            caughtError = err
          }
          expect(caughtError).toBeInstanceOf(TypeError)
        })
      },
    })
    store.dispatch(increment())
    expect.assertions(invalidExecutors.length)
  })
  it("does not run an executor if the task is synchronously cancelled", async () => {
    const storeStateAfter = deferred()
    startListening({
      actionCreator: increment,
      effect: async (action, listenerApi) => {
        const forkedTask = listenerApi.fork(() => {
          listenerApi.dispatch(decrement())
          listenerApi.dispatch(decrement())
          listenerApi.dispatch(decrement())
        })
        forkedTask.cancel()
        const result = await forkedTask.result
        storeStateAfter.resolve(listenerApi.getState())
      },
    })
    store.dispatch(increment())
    expect(storeStateAfter).resolves.toEqual({ value: 1 })
  })
  it.each<{
    desc: string
    executor: qx.ForkedTaskExecutor<any>
    cancelAfterMs?: number
    expected: qx.TaskResult<any>
  }>([
    {
      desc: "sync exec - success",
      executor: () => 42,
      expected: { status: "ok", value: 42 },
    },
    {
      desc: "sync exec - error",
      executor: () => {
        throw new Error("2020")
      },
      expected: { status: "rejected", error: new Error("2020") },
    },
    {
      desc: "sync exec - sync cancel",
      executor: () => 42,
      cancelAfterMs: -1,
      expected: {
        status: "cancelled",
        error: new qx.TaskAbortError(qx.taskCancelled),
      },
    },
    {
      desc: "sync exec - async cancel",
      executor: () => 42,
      cancelAfterMs: 0,
      expected: { status: "ok", value: 42 },
    },
    {
      desc: "async exec - async cancel",
      executor: async forkApi => {
        await forkApi.delay(100)
        throw new Error("2020")
      },
      cancelAfterMs: 10,
      expected: {
        status: "cancelled",
        error: new qx.TaskAbortError(qx.taskCancelled),
      },
    },
    {
      desc: "async exec - success",
      executor: async () => {
        await delay(20)
        return Promise.resolve(21)
      },
      expected: { status: "ok", value: 21 },
    },
    {
      desc: "async exec - error",
      executor: async () => {
        await Promise.resolve()
        throw new Error("2020")
      },
      expected: { status: "rejected", error: new Error("2020") },
    },
    {
      desc: "async exec - success with forkApi.pause",
      executor: async forkApi => {
        return forkApi.pause(Promise.resolve(2))
      },
      expected: { status: "ok", value: 2 },
    },
    {
      desc: "async exec - error with forkApi.pause",
      executor: async forkApi => {
        return forkApi.pause(Promise.reject(22))
      },
      expected: { status: "rejected", error: 22 },
    },
    {
      desc: "async exec - success with forkApi.delay",
      executor: async forkApi => {
        await forkApi.delay(10)
        return 5
      },
      expected: { status: "ok", value: 5 },
    },
  ])("%# - %j", async ({ executor, expected, cancelAfterMs }) => {
    const deferredResult = deferred()
    let forkedTask: any = {}
    startListening({
      predicate: () => true,
      effect: async (_, listenerApi) => {
        forkedTask = listenerApi.fork(executor)
        deferredResult.resolve(await forkedTask.result)
      },
    })
    store.dispatch({ type: "" })
    if (typeof cancelAfterMs === "number") {
      if (cancelAfterMs < 0) {
        forkedTask.cancel()
      } else {
        await delay(cancelAfterMs)
        forkedTask.cancel()
      }
    }
    const result = await deferredResult
    expect(result).toEqual(expected)
  })
  describe("forkAPI", () => {
    it("forkApi.delay rejects as soon as the task is cancelled", async () => {
      const deferredResult = deferred()
      startListening({
        actionCreator: increment,
        effect: async (_, listenerApi) => {
          const forkedTask = listenerApi.fork(async forkApi => {
            await forkApi.delay(100)
            return 4
          })
          await listenerApi.delay(10)
          forkedTask.cancel()
          deferredResult.resolve(await forkedTask.result)
        },
      })
      store.dispatch(increment())
      expect(await deferredResult).toEqual({
        status: "cancelled",
        error: new qx.TaskAbortError(qx.taskCancelled),
      })
    })
    it("forkApi.delay rejects as soon as the parent listener is cancelled", async () => {
      const deferredResult = deferred()
      startListening({
        actionCreator: increment,
        effect: async (_, listenerApi) => {
          listenerApi.cancelActiveListeners()
          await listenerApi.fork(async forkApi => {
            await forkApi
              .delay(100)
              .then(deferredResult.resolve, deferredResult.resolve)
            return 4
          }).result
          deferredResult.resolve(new Error("unreachable"))
        },
      })
      store.dispatch(increment())
      await Promise.resolve()
      store.dispatch(increment())
      expect(await deferredResult).toEqual(
        new qx.TaskAbortError(qx.listenerCancelled)
      )
    })
    it("forkApi.signal listener is invoked as soon as the parent listener is cancelled or completed", async () => {
      const deferredResult = deferred()
      startListening({
        actionCreator: increment,
        async effect(_, listenerApi) {
          const wronglyDoNotAwaitResultOfTask = listenerApi.fork(
            async forkApi => {
              forkApi.signal.addEventListener("abort", () => {
                deferredResult.resolve(
                  (forkApi.signal as qx.AbortSignalWithReason<unknown>).reason
                )
              })
            }
          )
        },
      })
      store.dispatch(increment)
      expect(await deferredResult).toBe(qx.listenerCompleted)
    })
    it("fork.delay does not trigger unhandledRejections for completed or cancelled tasks", async () => {
      const deferredCompletedEvt = deferred()
      const deferredCancelledEvt = deferred()
      startListening({
        actionCreator: increment,
        effect: async (_, listenerApi) => {
          const completedTask = listenerApi.fork(async forkApi => {
            forkApi.signal.addEventListener(
              "abort",
              deferredCompletedEvt.resolve,
              { once: true }
            )
            forkApi.delay(100) // missing await
            return 4
          })
          deferredCompletedEvt.resolve(await completedTask.result)
          const godotPauseTrigger = deferred()
          const cancelledTask = listenerApi.fork(async forkApi => {
            forkApi.signal.addEventListener(
              "abort",
              deferredCompletedEvt.resolve,
              { once: true }
            )
            forkApi.delay(1_000) // missing await
            await forkApi.pause(godotPauseTrigger)
            return 4
          })
          await Promise.resolve()
          cancelledTask.cancel()
          deferredCancelledEvt.resolve(await cancelledTask.result)
        },
      })
      store.dispatch(increment())
      expect(await deferredCompletedEvt).toBeDefined()
      expect(await deferredCancelledEvt).toBeDefined()
    })
  })
  test("forkApi.pause rejects if task is cancelled", async () => {
    const deferredResult = deferred()
    startListening({
      actionCreator: increment,
      effect: async (_, listenerApi) => {
        const forkedTask = listenerApi.fork(async forkApi => {
          await forkApi.pause(delay(1_000))
          return 4
        })
        await Promise.resolve()
        forkedTask.cancel()
        deferredResult.resolve(await forkedTask.result)
      },
    })
    store.dispatch(increment())
    expect(await deferredResult).toEqual({
      status: "cancelled",
      error: new qx.TaskAbortError(qx.taskCancelled),
    })
  })
  test("forkApi.pause rejects as soon as the parent listener is cancelled", async () => {
    const deferredResult = deferred()
    startListening({
      actionCreator: increment,
      effect: async (_, listenerApi) => {
        listenerApi.cancelActiveListeners()
        const forkedTask = listenerApi.fork(async forkApi => {
          await forkApi
            .pause(delay(100))
            .then(deferredResult.resolve, deferredResult.resolve)
          return 4
        })
        await forkedTask.result
        deferredResult.resolve(new Error("unreachable"))
      },
    })
    store.dispatch(increment())
    await Promise.resolve()
    store.dispatch(increment())
    expect(await deferredResult).toEqual(
      new qx.TaskAbortError(qx.listenerCancelled)
    )
  })
  test("forkApi.pause rejects if listener is cancelled", async () => {
    const incrementByInListener = qx.createAction<number>(
      "incrementByInListener"
    )
    startListening({
      actionCreator: incrementByInListener,
      async effect({ payload: amountToIncrement }, listenerApi) {
        listenerApi.cancelActiveListeners()
        await listenerApi.fork(async forkApi => {
          await forkApi.pause(delay(10))
          listenerApi.dispatch(incrementByAmount(amountToIncrement))
        }).result
        listenerApi.dispatch(incrementByAmount(2 * amountToIncrement))
      },
    })
    store.dispatch(incrementByInListener(10))
    store.dispatch(incrementByInListener(100))
    await delay(50)
    expect(store.getState().value).toEqual(300)
  })
})

interface CounterState {
  value: number
}
const counterSlice = qx.createSlice({
  name: "counter",
  initialState: { value: 0 } as CounterState,
  reducers: {
    increment(state) {
      state.value += 1
    },
    decrement(state) {
      state.value -= 1
    },
    incrementByAmount: (state, action: qx.PayloadAction<number>) => {
      state.value += action.payload
    },
  },
})
const { increment, decrement, incrementByAmount } = counterSlice.actions
describe("Saga-style Effects Scenarios", () => {
  let listenerMiddleware = qx.createListenerMiddleware<CounterState>()
  let { middleware, startListening, stopListening } = listenerMiddleware
  let store = qx.configureStore({
    reducer: counterSlice.reducer,
    middleware: gDM => gDM().prepend(middleware),
  })
  const testAction1 = qx.createAction<string>("testAction1")
  type TestAction1 = ReturnType<typeof testAction1>
  const testAction2 = qx.createAction<string>("testAction2")
  type TestAction2 = ReturnType<typeof testAction2>
  const testAction3 = qx.createAction<string>("testAction3")
  type TestAction3 = ReturnType<typeof testAction3>
  type RootState = ReturnType<typeof store.getState>
  function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
  beforeEach(() => {
    listenerMiddleware = qx.createListenerMiddleware<CounterState>()
    middleware = listenerMiddleware.middleware
    startListening = listenerMiddleware.startListening
    store = qx.configureStore({
      reducer: counterSlice.reducer,
      middleware: gDM => gDM().prepend(middleware),
    })
  })
  test("Long polling loop", async () => {
    const eventPollingStarted = qx.createAction("serverPolling/started")
    const eventPollingStopped = qx.createAction("serverPolling/stopped")
    const createNanoEvents = () => ({
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
            if (err instanceof qx.TaskAbortError) {
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
