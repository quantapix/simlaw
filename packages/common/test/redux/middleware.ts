import * as qx from "../../src/redux/index.js"
import { expectType } from "./helpers.js"
import {
  mockConsole,
  createConsole,
  getLog,
} from "console-testing-library/pure"

describe("getDefaultMiddleware", () => {
  const ORIGINAL_NODE_ENV = process.env["NODE_ENV"]
  afterEach(() => {
    process.env["NODE_ENV"] = ORIGINAL_NODE_ENV
  })
  it("returns an array with only redux-thunk in production", () => {
    process.env["NODE_ENV"] = "production"
    expect(qx.getDefaultMiddleware()).toEqual([qx.thunkMiddleware])
  })
  it("returns an array with additional middleware in development", () => {
    const middleware = qx.getDefaultMiddleware()
    expect(middleware).toContain(qx.thunkMiddleware)
    expect(middleware.length).toBeGreaterThan(1)
  })
  it("removes the thunk middleware if disabled", () => {
    const middleware = qx.getDefaultMiddleware({ thunk: false })
    expect(middleware.includes(qx.thunkMiddleware)).toBe(false)
    expect(middleware.length).toBe(2)
  })
  it("removes the immutable middleware if disabled", () => {
    const defaultMiddleware = qx.getDefaultMiddleware()
    const middleware = qx.getDefaultMiddleware({ immutableCheck: false })
    expect(middleware.length).toBe(defaultMiddleware.length - 1)
  })
  it("removes the serializable middleware if disabled", () => {
    const defaultMiddleware = qx.getDefaultMiddleware()
    const middleware = qx.getDefaultMiddleware({ serializableCheck: false })
    expect(middleware.length).toBe(defaultMiddleware.length - 1)
  })
  it("allows passing options to thunk", () => {
    const extraArgument = 42 as const
    const middleware = qx.getDefaultMiddleware({
      thunk: { extraArgument },
      immutableCheck: false,
      serializableCheck: false,
    })
    const m2 = qx.getDefaultMiddleware({
      thunk: false,
    })
    expectType<qx.MiddlewareArray<[]>>(m2)
    const dummyMiddleware: qx.Middleware<
      {
        (action: qx.Action<"actionListenerMiddleware/add">): () => void
      },
      { counter: number }
    > = storeApi => next => action => {}
    const dummyMiddleware2: qx.Middleware = storeApi => next => action => {}
    const m3 = middleware.concat(dummyMiddleware, dummyMiddleware2)
    expectType<
      qx.MiddlewareArray<
        [
          qx.ThunkMiddleware<any, qx.AnyAction, 42>,
          qx.Middleware<
            (action: qx.Action<"actionListenerMiddleware/add">) => () => void,
            {
              counter: number
            },
            qx.Dispatch<qx.AnyAction>
          >,
          qx.Middleware<{}, any, qx.Dispatch<qx.AnyAction>>
        ]
      >
    >(m3)
    const testThunk: qx.ThunkAction<void, {}, number, qx.AnyAction> = (
      dispatch,
      getState,
      extraArg
    ) => {
      expect(extraArg).toBe(extraArgument)
    }
    const reducer = () => ({})
    const store = qx.configureStore({
      reducer,
      middleware,
    })
    expectType<
      qx.ThunkDispatch<any, 42, qx.AnyAction> & qx.Dispatch<qx.AnyAction>
    >(store.dispatch)
    store.dispatch(testThunk)
  })
  it("allows passing options to immutableCheck", () => {
    let immutableCheckWasCalled = false
    const middleware = qx.getDefaultMiddleware({
      thunk: false,
      immutableCheck: {
        isImmutable: () => {
          immutableCheckWasCalled = true
          return true
        },
      },
      serializableCheck: false,
    })
    const reducer = () => ({})
    const store = qx.configureStore({
      reducer,
      middleware,
    })
    expect(immutableCheckWasCalled).toBe(true)
  })
  it("allows passing options to serializableCheck", () => {
    let serializableCheckWasCalled = false
    const middleware = qx.getDefaultMiddleware({
      thunk: false,
      immutableCheck: false,
      serializableCheck: {
        isSerializable: () => {
          serializableCheckWasCalled = true
          return true
        },
      },
    })
    const reducer = () => ({})
    const store = qx.configureStore({
      reducer,
      middleware,
    })
    store.dispatch({ type: "TEST_ACTION" })
    expect(serializableCheckWasCalled).toBe(true)
  })
})
describe("MiddlewareArray functionality", () => {
  const middleware1: qx.Middleware = () => next => action => next(action)
  const middleware2: qx.Middleware = () => next => action => next(action)
  const defaultMiddleware = qx.getDefaultMiddleware()
  const originalDefaultMiddleware = [...defaultMiddleware]
  it("allows to prepend a single value", () => {
    const prepended = defaultMiddleware.prepend(middleware1)
    expect(prepended).toEqual([middleware1, ...defaultMiddleware])
    expect(prepended).toBeInstanceOf(qx.MiddlewareArray)
    expect(prepended).not.toEqual(defaultMiddleware)
    expect(defaultMiddleware).toEqual(originalDefaultMiddleware)
  })
  it("allows to prepend multiple values (array as first argument)", () => {
    const prepended = defaultMiddleware.prepend([middleware1, middleware2])
    expect(prepended).toEqual([middleware1, middleware2, ...defaultMiddleware])
    expect(prepended).toBeInstanceOf(qx.MiddlewareArray)
    expect(prepended).not.toEqual(defaultMiddleware)
    expect(defaultMiddleware).toEqual(originalDefaultMiddleware)
  })
  it("allows to prepend multiple values (rest)", () => {
    const prepended = defaultMiddleware.prepend(middleware1, middleware2)
    expect(prepended).toEqual([middleware1, middleware2, ...defaultMiddleware])
    expect(prepended).toBeInstanceOf(qx.MiddlewareArray)
    expect(prepended).not.toEqual(defaultMiddleware)
    expect(defaultMiddleware).toEqual(originalDefaultMiddleware)
  })
  it("allows to concat a single value", () => {
    const concatenated = defaultMiddleware.concat(middleware1)
    expect(concatenated).toEqual([...defaultMiddleware, middleware1])
    expect(concatenated).toBeInstanceOf(qx.MiddlewareArray)
    expect(concatenated).not.toEqual(defaultMiddleware)
    expect(defaultMiddleware).toEqual(originalDefaultMiddleware)
  })
  it("allows to concat multiple values (array as first argument)", () => {
    const concatenated = defaultMiddleware.concat([middleware1, middleware2])
    expect(concatenated).toEqual([
      ...defaultMiddleware,
      middleware1,
      middleware2,
    ])
    expect(concatenated).toBeInstanceOf(qx.MiddlewareArray)
    expect(concatenated).not.toEqual(defaultMiddleware)
    expect(defaultMiddleware).toEqual(originalDefaultMiddleware)
  })
  it("allows to concat multiple values (rest)", () => {
    const concatenated = defaultMiddleware.concat(middleware1, middleware2)
    expect(concatenated).toEqual([
      ...defaultMiddleware,
      middleware1,
      middleware2,
    ])
    expect(concatenated).toBeInstanceOf(qx.MiddlewareArray)
    expect(concatenated).not.toEqual(defaultMiddleware)
    expect(defaultMiddleware).toEqual(originalDefaultMiddleware)
  })
  it("allows to concat and then prepend", () => {
    const concatenated = defaultMiddleware
      .concat(middleware1)
      .prepend(middleware2)
    expect(concatenated).toEqual([
      middleware2,
      ...defaultMiddleware,
      middleware1,
    ])
  })
  it("allows to prepend and then concat", () => {
    const concatenated = defaultMiddleware
      .prepend(middleware2)
      .concat(middleware1)
    expect(concatenated).toEqual([
      middleware2,
      ...defaultMiddleware,
      middleware1,
    ])
  })
})

let restore = () => {}
beforeEach(() => {
  restore = mockConsole(createConsole())
})
afterEach(() => restore())
describe("findNonSerializableValue", () => {
  it("Should return false if no matching values are found", () => {
    const obj = {
      a: 42,
      b: {
        b1: "test",
      },
      c: [99, { d: 123 }],
    }
    const result = qx.findNonSerializableValue(obj)
    expect(result).toBe(false)
  })
  it("Should return a keypath and the value if it finds a non-serializable value", () => {
    function testFunction() {}
    const obj = {
      a: 42,
      b: {
        b1: testFunction,
      },
      c: [99, { d: 123 }],
    }
    const result = qx.findNonSerializableValue(obj)
    expect(result).toEqual({ keyPath: "b.b1", value: testFunction })
  })
  it("Should return the first non-serializable value it finds", () => {
    const map = new Map()
    const symbol = Symbol.for("testSymbol")
    const obj = {
      a: 42,
      b: {
        b1: 1,
      },
      c: [99, { d: 123 }, map, symbol, "test"],
      d: symbol,
    }
    const result = qx.findNonSerializableValue(obj)
    expect(result).toEqual({ keyPath: "c.2", value: map })
  })
  it("Should return a specific value if the root object is non-serializable", () => {
    const value = new Map()
    const result = qx.findNonSerializableValue(value)
    expect(result).toEqual({ keyPath: "<root>", value })
  })
  it("Should accept null as a valid value", () => {
    const obj = {
      a: 42,
      b: {
        b1: 1,
      },
      c: null,
    }
    const result = qx.findNonSerializableValue(obj)
    expect(result).toEqual(false)
  })
})
describe("serializableStateInvariantMiddleware", () => {
  it("Should log an error when a non-serializable action is dispatched", () => {
    const reducer: qx.Reducer = (state = 0, _action) => state + 1
    const serializableStateInvariantMiddleware =
      qx.createSerializableStateInvariantMiddleware()
    const store = qx.configureStore({
      reducer,
      middleware: [serializableStateInvariantMiddleware],
    })
    const type = Symbol.for("SOME_CONSTANT")
    const dispatchedAction = { type }
    store.dispatch(dispatchedAction)
    expect(getLog().log).toMatchInlineSnapshot(`
      "A non-serializable value was detected in an action, in the path: \`type\`. Value: Symbol(SOME_CONSTANT) 
      Take a look at the logic that dispatched this action:  Object {
        \\"type\\": Symbol(SOME_CONSTANT),
      } 
      (See https://redux.js.org/faq/actions#why-should-type-be-a-string-or-at-least-serializable-why-should-my-action-types-be-constants) 
      (To allow non-serializable values see: https://redux-toolkit.js.org/usage/usage-guide#working-with-non-serializable-data)"
    `)
  })
  it("Should log an error when a non-serializable value is in state", () => {
    const ACTION_TYPE = "TEST_ACTION"
    const initialState = {
      a: 0,
    }
    const badValue = new Map()
    const reducer: qx.Reducer = (state = initialState, action) => {
      switch (action.type) {
        case ACTION_TYPE: {
          return {
            a: badValue,
          }
        }
        default:
          return state
      }
    }
    const serializableStateInvariantMiddleware =
      qx.createSerializableStateInvariantMiddleware()
    const store = qx.configureStore({
      reducer: {
        testSlice: reducer,
      },
      middleware: [serializableStateInvariantMiddleware],
    })
    store.dispatch({ type: ACTION_TYPE })
    expect(getLog().log).toMatchInlineSnapshot(`
      "A non-serializable value was detected in the state, in the path: \`testSlice.a\`. Value: Map {} 
      Take a look at the reducer(s) handling this action type: TEST_ACTION.
      (See https://redux.js.org/faq/organizing-state#can-i-put-functions-promises-or-other-non-serializable-items-in-my-store-state)"
    `)
  })
  describe("consumer tolerated structures", () => {
    const nonSerializableValue = new Map()
    const nestedSerializableObjectWithBadValue = {
      isSerializable: true,
      entries: (): [string, any][] => [
        ["good-string", "Good!"],
        ["good-number", 1337],
        ["bad-map-instance", nonSerializableValue],
      ],
    }
    const serializableObject = {
      isSerializable: true,
      entries: (): [string, any][] => [
        ["first", 1],
        ["second", "B!"],
        ["third", nestedSerializableObjectWithBadValue],
      ],
    }
    it("Should log an error when a non-serializable value is nested in state", () => {
      const ACTION_TYPE = "TEST_ACTION"
      const initialState = {
        a: 0,
      }
      const reducer: qx.Reducer = (state = initialState, action) => {
        switch (action.type) {
          case ACTION_TYPE: {
            return {
              a: serializableObject,
            }
          }
          default:
            return state
        }
      }
      const serializableStateInvariantMiddleware =
        qx.createSerializableStateInvariantMiddleware()
      const store = qx.configureStore({
        reducer: {
          testSlice: reducer,
        },
        middleware: [serializableStateInvariantMiddleware],
      })
      store.dispatch({ type: ACTION_TYPE })
      expect(getLog().log).toMatchInlineSnapshot(`
        "A non-serializable value was detected in the state, in the path: \`testSlice.a.entries\`. Value: [Function entries] 
        Take a look at the reducer(s) handling this action type: TEST_ACTION.
        (See https://redux.js.org/faq/organizing-state#can-i-put-functions-promises-or-other-non-serializable-items-in-my-store-state)"
      `)
    })
    it("Should use consumer supplied isSerializable and getEntries options to tolerate certain structures", () => {
      const ACTION_TYPE = "TEST_ACTION"
      const initialState = {
        a: 0,
      }
      const isSerializable = (val: any): boolean =>
        val.isSerializable || qx.isPlain(val)
      const getEntries = (val: any): [string, any][] =>
        val.isSerializable ? val.entries() : Object.entries(val)
      const reducer: qx.Reducer = (state = initialState, action) => {
        switch (action.type) {
          case ACTION_TYPE: {
            return {
              a: serializableObject,
            }
          }
          default:
            return state
        }
      }
      const serializableStateInvariantMiddleware =
        qx.createSerializableStateInvariantMiddleware({
          isSerializable,
          getEntries,
        })
      const store = qx.configureStore({
        reducer: {
          testSlice: reducer,
        },
        middleware: [serializableStateInvariantMiddleware],
      })
      store.dispatch({ type: ACTION_TYPE })
      expect(getLog().log).toMatchInlineSnapshot(`
        "A non-serializable value was detected in the state, in the path: \`testSlice.a.third.bad-map-instance\`. Value: Map {} 
        Take a look at the reducer(s) handling this action type: TEST_ACTION.
        (See https://redux.js.org/faq/organizing-state#can-i-put-functions-promises-or-other-non-serializable-items-in-my-store-state)"
      `)
    })
  })
  it("Should use the supplied isSerializable function to determine serializability", () => {
    const ACTION_TYPE = "TEST_ACTION"
    const initialState = {
      a: 0,
    }
    const badValue = new Map()
    const reducer: qx.Reducer = (state = initialState, action) => {
      switch (action.type) {
        case ACTION_TYPE: {
          return {
            a: badValue,
          }
        }
        default:
          return state
      }
    }
    const serializableStateInvariantMiddleware =
      qx.createSerializableStateInvariantMiddleware({
        isSerializable: () => true,
      })
    const store = qx.configureStore({
      reducer: {
        testSlice: reducer,
      },
      middleware: [serializableStateInvariantMiddleware],
    })
    store.dispatch({ type: ACTION_TYPE })
    expect(getLog().log).toBe("")
  })
  it("should not check serializability for ignored action types", () => {
    let numTimesCalled = 0
    const serializableStateMiddleware =
      qx.createSerializableStateInvariantMiddleware({
        isSerializable: () => {
          numTimesCalled++
          return true
        },
        ignoredActions: ["IGNORE_ME"],
      })
    const store = qx.configureStore({
      reducer: () => ({}),
      middleware: [serializableStateMiddleware],
    })
    expect(numTimesCalled).toBe(0)
    store.dispatch({ type: "IGNORE_ME" })
    expect(numTimesCalled).toBe(1)
    store.dispatch({ type: "ANY_OTHER_ACTION" })
    expect(numTimesCalled).toBeGreaterThanOrEqual(3)
  })
  describe("ignored action paths", () => {
    function reducer() {
      return 0
    }
    const nonSerializableValue = new Map()
    it("default value: meta.arg", () => {
      qx.configureStore({
        reducer,
        middleware: [qx.createSerializableStateInvariantMiddleware()],
      }).dispatch({ type: "test", meta: { arg: nonSerializableValue } })
      expect(getLog().log).toMatchInlineSnapshot(`""`)
    })
    it("default value can be overridden", () => {
      qx.configureStore({
        reducer,
        middleware: [
          qx.createSerializableStateInvariantMiddleware({
            ignoredActionPaths: [],
          }),
        ],
      }).dispatch({ type: "test", meta: { arg: nonSerializableValue } })
      expect(getLog().log).toMatchInlineSnapshot(`
        "A non-serializable value was detected in an action, in the path: \`meta.arg\`. Value: Map {} 
        Take a look at the logic that dispatched this action:  Object {
          \\"meta\\": Object {
            \\"arg\\": Map {},
          },
          \\"type\\": \\"test\\",
        } 
        (See https://redux.js.org/faq/actions#why-should-type-be-a-string-or-at-least-serializable-why-should-my-action-types-be-constants) 
        (To allow non-serializable values see: https://redux-toolkit.js.org/usage/usage-guide#working-with-non-serializable-data)"
      `)
    })
    it("can specify (multiple) different values", () => {
      qx.configureStore({
        reducer,
        middleware: [
          qx.createSerializableStateInvariantMiddleware({
            ignoredActionPaths: ["payload", "meta.arg"],
          }),
        ],
      }).dispatch({
        type: "test",
        payload: { arg: nonSerializableValue },
        meta: { arg: nonSerializableValue },
      })
      expect(getLog().log).toMatchInlineSnapshot(`""`)
    })
  })
  it("allows ignoring actions entirely", () => {
    let numTimesCalled = 0
    const serializableStateMiddleware =
      qx.createSerializableStateInvariantMiddleware({
        isSerializable: () => {
          numTimesCalled++
          return true
        },
        ignoreActions: true,
      })
    const store = qx.configureStore({
      reducer: () => ({}),
      middleware: [serializableStateMiddleware],
    })
    expect(numTimesCalled).toBe(0)
    store.dispatch({ type: "THIS_DOESNT_MATTER" })
    expect(numTimesCalled).toBe(1)
    store.dispatch({ type: "THIS_DOESNT_MATTER_AGAIN" })
    expect(numTimesCalled).toBe(2)
  })
  it("should not check serializability for ignored slice names", () => {
    const ACTION_TYPE = "TEST_ACTION"
    const initialState = {
      a: 0,
    }
    const badValue = new Map()
    const reducer: qx.Reducer = (state = initialState, action) => {
      switch (action.type) {
        case ACTION_TYPE: {
          return {
            a: badValue,
            b: {
              c: badValue,
              d: badValue,
            },
            e: { f: badValue },
          }
        }
        default:
          return state
      }
    }
    const serializableStateInvariantMiddleware =
      qx.createSerializableStateInvariantMiddleware({
        ignoredPaths: ["testSlice.a", "testSlice.b.c", "testSlice.e"],
      })
    const store = qx.configureStore({
      reducer: {
        testSlice: reducer,
      },
      middleware: [serializableStateInvariantMiddleware],
    })
    store.dispatch({ type: ACTION_TYPE })
    expect(getLog().log).toMatchInlineSnapshot(`
      "A non-serializable value was detected in the state, in the path: \`testSlice.b.d\`. Value: Map {} 
      Take a look at the reducer(s) handling this action type: TEST_ACTION.
      (See https://redux.js.org/faq/organizing-state#can-i-put-functions-promises-or-other-non-serializable-items-in-my-store-state)"
    `)
  })
  it("allows ignoring state entirely", () => {
    const badValue = new Map()
    let numTimesCalled = 0
    const reducer = () => badValue
    const store = qx.configureStore({
      reducer,
      middleware: [
        qx.createSerializableStateInvariantMiddleware({
          isSerializable: () => {
            numTimesCalled++
            return true
          },
          ignoreState: true,
        }),
      ],
    })
    expect(numTimesCalled).toBe(0)
    store.dispatch({ type: "test" })
    expect(getLog().log).toMatchInlineSnapshot(`""`)
    expect(numTimesCalled).toBe(2)
  })
  it("never calls isSerializable if both ignoreState and ignoreActions are true", () => {
    const badValue = new Map()
    let numTimesCalled = 0
    const reducer = () => badValue
    const store = qx.configureStore({
      reducer,
      middleware: [
        qx.createSerializableStateInvariantMiddleware({
          isSerializable: () => {
            numTimesCalled++
            return true
          },
          ignoreState: true,
          ignoreActions: true,
        }),
      ],
    })
    expect(numTimesCalled).toBe(0)
    store.dispatch({ type: "TEST", payload: new Date() })
    store.dispatch({ type: "OTHER_THING" })
    expect(numTimesCalled).toBe(0)
  })
  it("Should print a warning if execution takes too long", () => {
    const reducer: qx.Reducer = (state = 42, action) => {
      return state
    }
    const serializableStateInvariantMiddleware =
      qx.createSerializableStateInvariantMiddleware({ warnAfter: 4 })
    const store = qx.configureStore({
      reducer: {
        testSlice: reducer,
      },
      middleware: [serializableStateInvariantMiddleware],
    })
    store.dispatch({
      type: "SOME_ACTION",
      payload: new Array(10000).fill({ value: "more" }),
    })
    expect(getLog().log).toMatch(
      /^SerializableStateInvariantMiddleware took \d*ms, which is more than the warning threshold of 4ms./
    )
  })
  it('Should not print a warning if "reducer" takes too long', () => {
    const reducer: qx.Reducer = (state = 42, action) => {
      const started = Date.now()
      while (Date.now() - started < 8) {}
      return state
    }
    const serializableStateInvariantMiddleware =
      qx.createSerializableStateInvariantMiddleware({ warnAfter: 4 })
    const store = qx.configureStore({
      reducer: {
        testSlice: reducer,
      },
      middleware: [serializableStateInvariantMiddleware],
    })
    store.dispatch({ type: "SOME_ACTION" })
    expect(getLog().log).toMatch("")
  })
})

describe("createImmutableStateInvariantMiddleware", () => {
  let state: { foo: { bar: number[]; baz: string } }
  const getState: qx.Store["getState"] = () => state
  function middleware(
    options: qx.ImmutableStateInvariantMiddlewareOptions = {}
  ) {
    return qx.createImmutableStateInvariantMiddleware(options)({
      getState,
    } as qx.MiddlewareAPI)
  }
  beforeEach(() => {
    state = { foo: { bar: [2, 3, 4], baz: "baz" } }
  })
  it("sends the action through the middleware chain", () => {
    const next: qx.Dispatch = action => ({ ...action, returned: true })
    const dispatch = middleware()(next)
    expect(dispatch({ type: "SOME_ACTION" })).toEqual({
      type: "SOME_ACTION",
      returned: true,
    })
  })
  it("throws if mutating inside the dispatch", () => {
    const next: qx.Dispatch = action => {
      state.foo.bar.push(5)
      return action
    }
    const dispatch = middleware()(next)
    expect(() => {
      dispatch({ type: "SOME_ACTION" })
    }).toThrow(new RegExp("foo\\.bar\\.3"))
  })
  it("throws if mutating between dispatches", () => {
    const next: qx.Dispatch = action => action
    const dispatch = middleware()(next)
    dispatch({ type: "SOME_ACTION" })
    state.foo.bar.push(5)
    expect(() => {
      dispatch({ type: "SOME_OTHER_ACTION" })
    }).toThrow(new RegExp("foo\\.bar\\.3"))
  })
  it("does not throw if not mutating inside the dispatch", () => {
    const next: qx.Dispatch = action => {
      state = { ...state, foo: { ...state.foo, baz: "changed!" } }
      return action
    }
    const dispatch = middleware()(next)
    expect(() => {
      dispatch({ type: "SOME_ACTION" })
    }).not.toThrow()
  })
  it("does not throw if not mutating between dispatches", () => {
    const next: qx.Dispatch = action => action
    const dispatch = middleware()(next)
    dispatch({ type: "SOME_ACTION" })
    state = { ...state, foo: { ...state.foo, baz: "changed!" } }
    expect(() => {
      dispatch({ type: "SOME_OTHER_ACTION" })
    }).not.toThrow()
  })
  it("works correctly with circular references", () => {
    const next: qx.Dispatch = action => action
    const dispatch = middleware()(next)
    const x: any = {}
    const y: any = {}
    x.y = y
    y.x = x
    expect(() => {
      dispatch({ type: "SOME_ACTION", x })
    }).not.toThrow()
  })
  it('respects "isImmutable" option', function () {
    const isImmutable = (value: any) => true
    const next: qx.Dispatch = action => {
      state.foo.bar.push(5)
      return action
    }
    const dispatch = middleware({ isImmutable })(next)
    expect(() => {
      dispatch({ type: "SOME_ACTION" })
    }).not.toThrow()
  })
  it('respects "ignoredPaths" option', () => {
    const next: qx.Dispatch = action => {
      state.foo.bar.push(5)
      return action
    }
    const dispatch = middleware({ ignoredPaths: ["foo.bar"] })(next)
    expect(() => {
      dispatch({ type: "SOME_ACTION" })
    }).not.toThrow()
  })
  it('alias "ignore" to "ignoredPath" and respects option', () => {
    const next: qx.Dispatch = action => {
      state.foo.bar.push(5)
      return action
    }
    const dispatch = middleware({ ignore: ["foo.bar"] })(next)
    expect(() => {
      dispatch({ type: "SOME_ACTION" })
    }).not.toThrow()
  })
  it("Should print a warning if execution takes too long", () => {
    state.foo.bar = new Array(10000).fill({ value: "more" })
    const next: qx.Dispatch = action => action
    const dispatch = middleware({ warnAfter: 4 })(next)
    const restore = mockConsole(createConsole())
    try {
      dispatch({ type: "SOME_ACTION" })
      expect(getLog().log).toMatch(
        /^ImmutableStateInvariantMiddleware took \d*ms, which is more than the warning threshold of 4ms./
      )
    } finally {
      restore()
    }
  })
  it('Should not print a warning if "next" takes too long', () => {
    const next: qx.Dispatch = action => {
      const started = Date.now()
      while (Date.now() - started < 8) {}
      return action
    }
    const dispatch = middleware({ warnAfter: 4 })(next)
    const restore = mockConsole(createConsole())
    try {
      dispatch({ type: "SOME_ACTION" })
      expect(getLog().log).toEqual("")
    } finally {
      restore()
    }
  })
})
describe("trackForMutations", () => {
  function testCasesForMutation(spec: any) {
    it("returns true and the mutated path", () => {
      const state = spec.getState()
      const options = spec.middlewareOptions || {}
      const { isImmutable = qx.isImmutableDefault, ignoredPaths } = options
      const tracker = qx.trackForMutations(isImmutable, ignoredPaths, state)
      const newState = spec.fn(state)
      expect(tracker.detectMutations()).toEqual({
        wasMutated: true,
        path: spec.path.join("."),
      })
    })
  }
  function testCasesForNonMutation(spec: any) {
    it("returns false", () => {
      const state = spec.getState()
      const options = spec.middlewareOptions || {}
      const { isImmutable = qx.isImmutableDefault, ignoredPaths } = options
      const tracker = qx.trackForMutations(isImmutable, ignoredPaths, state)
      const newState = spec.fn(state)
      expect(tracker.detectMutations()).toEqual({ wasMutated: false })
    })
  }
  interface TestConfig {
    getState: qx.Store["getState"]
    fn: (s: any) => typeof s | object
    middlewareOptions?: qx.ImmutableStateInvariantMiddlewareOptions
    path?: string[]
  }
  const mutations: Record<string, TestConfig> = {
    "adding to nested array": {
      getState: () => ({
        foo: {
          bar: [2, 3, 4],
          baz: "baz",
        },
        stuff: [],
      }),
      fn: s => {
        s.foo.bar.push(5)
        return s
      },
      path: ["foo", "bar", "3"],
    },
    "adding to nested array and setting new root object": {
      getState: () => ({
        foo: {
          bar: [2, 3, 4],
          baz: "baz",
        },
        stuff: [],
      }),
      fn: s => {
        s.foo.bar.push(5)
        return { ...s }
      },
      path: ["foo", "bar", "3"],
    },
    "changing nested string": {
      getState: () => ({
        foo: {
          bar: [2, 3, 4],
          baz: "baz",
        },
        stuff: [],
      }),
      fn: s => {
        s.foo.baz = "changed!"
        return s
      },
      path: ["foo", "baz"],
    },
    "removing nested state": {
      getState: () => ({
        foo: {
          bar: [2, 3, 4],
          baz: "baz",
        },
        stuff: [],
      }),
      fn: s => {
        delete s.foo
        return s
      },
      path: ["foo"],
    },
    "adding to array": {
      getState: () => ({
        foo: {
          bar: [2, 3, 4],
          baz: "baz",
        },
        stuff: [],
      }),
      fn: s => {
        s.stuff.push(1)
        return s
      },
      path: ["stuff", "0"],
    },
    "adding object to array": {
      getState: () => ({
        stuff: [],
      }),
      fn: s => {
        s.stuff.push({ foo: 1, bar: 2 })
        return s
      },
      path: ["stuff", "0"],
    },
    "mutating previous state and returning new state": {
      getState: () => ({ counter: 0 }),
      fn: s => {
        s.mutation = true
        return { ...s, counter: s.counter + 1 }
      },
      path: ["mutation"],
    },
    "mutating previous state with non immutable type and returning new state": {
      getState: () => ({ counter: 0 }),
      fn: s => {
        s.mutation = [1, 2, 3]
        return { ...s, counter: s.counter + 1 }
      },
      path: ["mutation"],
    },
    "mutating previous state with non immutable type and returning new state without that property":
      {
        getState: () => ({ counter: 0 }),
        fn: s => {
          s.mutation = [1, 2, 3]
          return { counter: s.counter + 1 }
        },
        path: ["mutation"],
      },
    "mutating previous state with non immutable type and returning new simple state":
      {
        getState: () => ({ counter: 0 }),
        fn: s => {
          s.mutation = [1, 2, 3]
          return 1
        },
        path: ["mutation"],
      },
    "mutating previous state by deleting property and returning new state without that property":
      {
        getState: () => ({ counter: 0, toBeDeleted: true }),
        fn: s => {
          delete s.toBeDeleted
          return { counter: s.counter + 1 }
        },
        path: ["toBeDeleted"],
      },
    "mutating previous state by deleting nested property": {
      getState: () => ({ nested: { counter: 0, toBeDeleted: true }, foo: 1 }),
      fn: s => {
        delete s.nested.toBeDeleted
        return { nested: { counter: s.counter + 1 } }
      },
      path: ["nested", "toBeDeleted"],
    },
    "update reference": {
      getState: () => ({ foo: {} }),
      fn: s => {
        s.foo = {}
        return s
      },
      path: ["foo"],
    },
    "cannot ignore root state": {
      getState: () => ({ foo: {} }),
      fn: s => {
        s.foo = {}
        return s
      },
      middlewareOptions: {
        ignoredPaths: [""],
      },
      path: ["foo"],
    },
    "catching state mutation in non-ignored branch": {
      getState: () => ({
        foo: {
          bar: [1, 2],
        },
        boo: {
          yah: [1, 2],
        },
      }),
      fn: s => {
        s.foo.bar.push(3)
        s.boo.yah.push(3)
        return s
      },
      middlewareOptions: {
        ignoredPaths: ["foo"],
      },
      path: ["boo", "yah", "2"],
    },
  }
  Object.keys(mutations).forEach(mutationDesc => {
    describe(mutationDesc, () => {
      testCasesForMutation(mutations[mutationDesc])
    })
  })
  const nonMutations: Record<string, TestConfig> = {
    "not doing anything": {
      getState: () => ({ a: 1, b: 2 }),
      fn: s => s,
    },
    "from undefined to something": {
      getState: () => undefined,
      fn: s => ({ foo: "bar" }),
    },
    "returning same state": {
      getState: () => ({
        foo: {
          bar: [2, 3, 4],
          baz: "baz",
        },
        stuff: [],
      }),
      fn: s => s,
    },
    "returning a new state object with nested new string": {
      getState: () => ({
        foo: {
          bar: [2, 3, 4],
          baz: "baz",
        },
        stuff: [],
      }),
      fn: s => {
        return { ...s, foo: { ...s.foo, baz: "changed!" } }
      },
    },
    "returning a new state object with nested new array": {
      getState: () => ({
        foo: {
          bar: [2, 3, 4],
          baz: "baz",
        },
        stuff: [],
      }),
      fn: s => {
        return { ...s, foo: { ...s.foo, bar: [...s.foo.bar, 5] } }
      },
    },
    "removing nested state": {
      getState: () => ({
        foo: {
          bar: [2, 3, 4],
          baz: "baz",
        },
        stuff: [],
      }),
      fn: s => {
        return { ...s, foo: {} }
      },
    },
    "having a NaN in the state": {
      getState: () => ({ a: NaN, b: Number.NaN }),
      fn: s => s,
    },
    "ignoring branches from mutation detection": {
      getState: () => ({
        foo: {
          bar: "bar",
        },
      }),
      fn: s => {
        s.foo.bar = "baz"
        return s
      },
      middlewareOptions: {
        ignoredPaths: ["foo"],
      },
    },
    "ignoring nested branches from mutation detection": {
      getState: () => ({
        foo: {
          bar: [1, 2],
          boo: {
            yah: [1, 2],
          },
        },
      }),
      fn: s => {
        s.foo.bar.push(3)
        s.foo.boo.yah.push(3)
        return s
      },
      middlewareOptions: {
        ignoredPaths: ["foo.bar", "foo.boo.yah"],
      },
    },
    "ignoring nested array indices from mutation detection": {
      getState: () => ({
        stuff: [{ a: 1 }, { a: 2 }],
      }),
      fn: s => {
        s.stuff[1].a = 3
        return s
      },
      middlewareOptions: {
        ignoredPaths: ["stuff.1"],
      },
    },
  }
  Object.keys(nonMutations).forEach(nonMutationDesc => {
    describe(nonMutationDesc, () => {
      testCasesForNonMutation(nonMutations[nonMutationDesc])
    })
  })
})
