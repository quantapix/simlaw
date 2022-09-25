import * as qx from "../../src/redux/index.js"
import { expect } from "expect"
import vm from "vm"
import * as qh from "./helpers.js"
import { from, ObservableInput } from "rxjs"
import { map } from "rxjs/operators"

describe("applyMiddleware", () => {
  it("warns when dispatching during middleware setup", () => {
    function dispatchingMiddleware(store: qx.Store) {
      store.dispatch(qh.addTodo("Don't dispatch in middleware setup"))
      return (next: qx.Dispatch) => (action: qx.Action) => next(action)
    }
    expect(() =>
      qx.applyMiddleware(dispatchingMiddleware as qx.Middleware)(qx.createStore)(qh.reducers.todos)
    ).toThrow()
  })
  it("wraps dispatch method with middleware once", () => {
    function test(spyOnMethods: any) {
      return (methods: any) => {
        spyOnMethods(methods)
        return (next: qx.Dispatch) => (action: qx.Action) => next(action)
      }
    }
    const spy = jest.fn()
    const store = qx.applyMiddleware(test(spy), qh.thunk)(qx.createStore)(qh.reducers.todos)
    store.dispatch(qh.addTodo("Use Redux"))
    store.dispatch(qh.addTodo("Flux FTW!"))
    expect(spy.mock.calls.length).toEqual(1)
    expect(spy.mock.calls[0][0]).toHaveProperty("getState")
    expect(spy.mock.calls[0][0]).toHaveProperty("dispatch")
    expect(store.getState()).toEqual([
      { id: 1, text: "Use Redux" },
      { id: 2, text: "Flux FTW!" },
    ])
  })
  it("passes recursive dispatches through the middleware chain", () => {
    function test(spyOnMethods: any) {
      return () => (next: qx.Dispatch) => (action: qx.Action) => {
        spyOnMethods(action)
        return next(action)
      }
    }
    const spy = jest.fn()
    const store = qx.applyMiddleware(test(spy), qh.thunk)(qx.createStore)(qh.reducers.todos)
    const dispatchedValue = store.dispatch(qh.addTodoAsync("Use Redux") as any) as unknown as Promise<void>
    return dispatchedValue.then(() => {
      expect(spy.mock.calls.length).toEqual(2)
    })
  })
  it("works with thunk middleware", done => {
    const store = qx.applyMiddleware(qh.thunk)(qx.createStore)(qh.reducers.todos)
    store.dispatch(qh.addTodoIfEmpty("Hello") as any)
    expect(store.getState()).toEqual([{ id: 1, text: "Hello" }])
    store.dispatch(qh.addTodoIfEmpty("Hello") as any)
    expect(store.getState()).toEqual([{ id: 1, text: "Hello" }])
    store.dispatch(qh.addTodo("World"))
    expect(store.getState()).toEqual([
      { id: 1, text: "Hello" },
      { id: 2, text: "World" },
    ])
    const dispatchedValue = store.dispatch(qh.addTodoAsync("Maybe") as any) as unknown as Promise<void>
    dispatchedValue.then(() => {
      expect(store.getState()).toEqual([
        { id: 1, text: "Hello" },
        { id: 2, text: "World" },
        { id: 3, text: "Maybe" },
      ])
      done()
    })
  })
  it("passes through all arguments of dispatch calls from within middleware", () => {
    const spy = jest.fn()
    const testCallArgs = ["test"]
    interface MultiDispatch<A extends qx.Action = qx.AnyAction> {
      <T extends A>(action: T, extraArg?: string[]): T
    }
    const multiArgMiddleware: qx.Middleware<MultiDispatch, any, MultiDispatch> = _store => {
      return next => (action: any, callArgs?: any) => {
        if (Array.isArray(callArgs)) {
          return action(...callArgs)
        }
        return next(action)
      }
    }
    function dummyMiddleware({ dispatch }: qx.MiddlewareAPI) {
      return (_next: qx.Dispatch) => (action: qx.Action) => dispatch(action, testCallArgs)
    }
    const store = qx.createStore(qh.reducers.todos, qx.applyMiddleware(multiArgMiddleware, dummyMiddleware))
    store.dispatch(spy as any)
    expect(spy.mock.calls[0]).toEqual(testCallArgs)
  })
})
describe("bindActionCreators", () => {
  let store: qx.Store
  let actionCreatorFunctions: any
  beforeEach(() => {
    store = qx.createStore(qh.todos)
    actionCreatorFunctions = { ...qh.actionCreators }
    Object.keys(actionCreatorFunctions).forEach(key => {
      if (typeof actionCreatorFunctions[key] !== "function") {
        delete actionCreatorFunctions[key]
      }
    })
  })
  it("wraps the action creators with the dispatch function", () => {
    const boundActionCreators = qx.bindActionCreators(qh.actionCreators, store.dispatch)
    expect(Object.keys(boundActionCreators)).toEqual(Object.keys(actionCreatorFunctions))
    const action = boundActionCreators.addTodo("Hello")
    expect(action).toEqual(qh.actionCreators.addTodo("Hello"))
    expect(store.getState()).toEqual([{ id: 1, text: "Hello" }])
  })
  it("wraps action creators transparently", () => {
    const uniqueThis = {}
    const argArray = [1, 2, 3]
    function actionCreator(this: any) {
      return { type: "UNKNOWN_ACTION", this: this, args: [...arguments] }
    }
    const boundActionCreator = qx.bindActionCreators(actionCreator, store.dispatch)
    const boundAction = boundActionCreator.apply(uniqueThis, argArray as [])
    const action = actionCreator.apply(uniqueThis, argArray as [])
    expect(boundAction).toEqual(action)
    expect(boundAction.this).toBe(uniqueThis)
    expect(action.this).toBe(uniqueThis)
  })
  it("skips non-function values in the passed object", () => {
    const boundActionCreators = qx.bindActionCreators(
      {
        ...qh.actionCreators,
        foo: 42,
        bar: "baz",
        wow: undefined,
        much: {},
        test: null,
      } as unknown as qx.ActionCreator<any>,
      store.dispatch
    )
    expect(Object.keys(boundActionCreators)).toEqual(Object.keys(actionCreatorFunctions))
  })
  it("supports wrapping a single function only", () => {
    const actionCreator = qh.actionCreators.addTodo
    const boundActionCreator = qx.bindActionCreators(actionCreator, store.dispatch)
    const action = boundActionCreator("Hello")
    expect(action).toEqual(actionCreator("Hello"))
    expect(store.getState()).toEqual([{ id: 1, text: "Hello" }])
  })
  it("throws for an undefined actionCreator", () => {
    expect(() => {
      qx.bindActionCreators(undefined, store.dispatch)
    }).toThrow(
      `bindActionCreators expected an object or a function, but instead received: 'undefined'. ` +
        `Did you write "import ActionCreators from" instead of "import * as ActionCreators from"?`
    )
  })
  it("throws for a null actionCreator", () => {
    expect(() => {
      qx.bindActionCreators(null, store.dispatch)
    }).toThrow(
      `bindActionCreators expected an object or a function, but instead received: 'null'. ` +
        `Did you write "import ActionCreators from" instead of "import * as ActionCreators from"?`
    )
  })
  it("throws for a primitive actionCreator", () => {
    expect(() => {
      qx.bindActionCreators("string" as unknown as qx.ActionCreator<any>, store.dispatch)
    }).toThrow(
      `bindActionCreators expected an object or a function, but instead received: 'string'. ` +
        `Did you write "import ActionCreators from" instead of "import * as ActionCreators from"?`
    )
  })
})
describe("createStore", () => {
  it("exposes the public API", () => {
    const store = qx.createStore(qx.combineReducers(qh.reducers))
    const methods = Object.keys(store).filter(key => key !== qx.$$observable)
    expect(methods.length).toBe(4)
    expect(methods).toContain("subscribe")
    expect(methods).toContain("dispatch")
    expect(methods).toContain("getState")
    expect(methods).toContain("replaceReducer")
  })
  it("throws if reducer is not a function", () => {
    expect(() => qx.createStore(undefined)).toThrow()
    expect(() => qx.createStore("test")).toThrow()
    expect(() => qx.createStore({})).toThrow()
    expect(() => qx.createStore(() => {})).not.toThrow()
  })
  it("passes the initial state", () => {
    const store = qx.createStore(qh.reducers.todos, [
      {
        id: 1,
        text: "Hello",
      },
    ])
    expect(store.getState()).toEqual([
      {
        id: 1,
        text: "Hello",
      },
    ])
  })
  it("applies the reducer to the previous state", () => {
    const store = qx.createStore(qh.reducers.todos)
    expect(store.getState()).toEqual([])
    store.dispatch(qh.unknownAction())
    expect(store.getState()).toEqual([])
    store.dispatch(qh.addTodo("Hello"))
    expect(store.getState()).toEqual([
      {
        id: 1,
        text: "Hello",
      },
    ])
    store.dispatch(qh.addTodo("World"))
    expect(store.getState()).toEqual([
      {
        id: 1,
        text: "Hello",
      },
      {
        id: 2,
        text: "World",
      },
    ])
  })
  it("applies the reducer to the initial state", () => {
    const store = qx.createStore(qh.reducers.todos, [
      {
        id: 1,
        text: "Hello",
      },
    ])
    expect(store.getState()).toEqual([
      {
        id: 1,
        text: "Hello",
      },
    ])
    store.dispatch(qh.unknownAction())
    expect(store.getState()).toEqual([
      {
        id: 1,
        text: "Hello",
      },
    ])
    store.dispatch(qh.addTodo("World"))
    expect(store.getState()).toEqual([
      {
        id: 1,
        text: "Hello",
      },
      {
        id: 2,
        text: "World",
      },
    ])
  })
  it("preserves the state when replacing a reducer", () => {
    const store = qx.createStore(qh.reducers.todos)
    store.dispatch(qh.addTodo("Hello"))
    store.dispatch(qh.addTodo("World"))
    expect(store.getState()).toEqual([
      {
        id: 1,
        text: "Hello",
      },
      {
        id: 2,
        text: "World",
      },
    ])
    store.replaceReducer(qh.reducers.todosReverse)
    expect(store.getState()).toEqual([
      {
        id: 1,
        text: "Hello",
      },
      {
        id: 2,
        text: "World",
      },
    ])
    store.dispatch(qh.addTodo("Perhaps"))
    expect(store.getState()).toEqual([
      {
        id: 3,
        text: "Perhaps",
      },
      {
        id: 1,
        text: "Hello",
      },
      {
        id: 2,
        text: "World",
      },
    ])
    store.replaceReducer(qh.reducers.todos)
    expect(store.getState()).toEqual([
      {
        id: 3,
        text: "Perhaps",
      },
      {
        id: 1,
        text: "Hello",
      },
      {
        id: 2,
        text: "World",
      },
    ])
    store.dispatch(qh.addTodo("Surely"))
    expect(store.getState()).toEqual([
      {
        id: 3,
        text: "Perhaps",
      },
      {
        id: 1,
        text: "Hello",
      },
      {
        id: 2,
        text: "World",
      },
      {
        id: 4,
        text: "Surely",
      },
    ])
  })
  it("supports multiple subscriptions", () => {
    const store = qx.createStore(qh.reducers.todos)
    const listenerA = jest.fn()
    const listenerB = jest.fn()
    let unsubscribeA = store.subscribe(listenerA)
    store.dispatch(qh.unknownAction())
    expect(listenerA.mock.calls.length).toBe(1)
    expect(listenerB.mock.calls.length).toBe(0)
    store.dispatch(qh.unknownAction())
    expect(listenerA.mock.calls.length).toBe(2)
    expect(listenerB.mock.calls.length).toBe(0)
    const unsubscribeB = store.subscribe(listenerB)
    expect(listenerA.mock.calls.length).toBe(2)
    expect(listenerB.mock.calls.length).toBe(0)
    store.dispatch(qh.unknownAction())
    expect(listenerA.mock.calls.length).toBe(3)
    expect(listenerB.mock.calls.length).toBe(1)
    unsubscribeA()
    expect(listenerA.mock.calls.length).toBe(3)
    expect(listenerB.mock.calls.length).toBe(1)
    store.dispatch(qh.unknownAction())
    expect(listenerA.mock.calls.length).toBe(3)
    expect(listenerB.mock.calls.length).toBe(2)
    unsubscribeB()
    expect(listenerA.mock.calls.length).toBe(3)
    expect(listenerB.mock.calls.length).toBe(2)
    store.dispatch(qh.unknownAction())
    expect(listenerA.mock.calls.length).toBe(3)
    expect(listenerB.mock.calls.length).toBe(2)
    unsubscribeA = store.subscribe(listenerA)
    expect(listenerA.mock.calls.length).toBe(3)
    expect(listenerB.mock.calls.length).toBe(2)
    store.dispatch(qh.unknownAction())
    expect(listenerA.mock.calls.length).toBe(4)
    expect(listenerB.mock.calls.length).toBe(2)
  })
  it("only removes listener once when unsubscribe is called", () => {
    const store = qx.createStore(qh.reducers.todos)
    const listenerA = jest.fn()
    const listenerB = jest.fn()
    const unsubscribeA = store.subscribe(listenerA)
    store.subscribe(listenerB)
    unsubscribeA()
    unsubscribeA()
    store.dispatch(qh.unknownAction())
    expect(listenerA.mock.calls.length).toBe(0)
    expect(listenerB.mock.calls.length).toBe(1)
  })
  it("only removes relevant listener when unsubscribe is called", () => {
    const store = qx.createStore(qh.reducers.todos)
    const listener = jest.fn()
    store.subscribe(listener)
    const unsubscribeSecond = store.subscribe(listener)
    unsubscribeSecond()
    unsubscribeSecond()
    store.dispatch(qh.unknownAction())
    expect(listener.mock.calls.length).toBe(1)
  })
  it("supports removing a subscription within a subscription", () => {
    const store = qx.createStore(qh.reducers.todos)
    const listenerA = jest.fn()
    const listenerB = jest.fn()
    const listenerC = jest.fn()
    store.subscribe(listenerA)
    const unSubB = store.subscribe(() => {
      listenerB()
      unSubB()
    })
    store.subscribe(listenerC)
    store.dispatch(qh.unknownAction())
    store.dispatch(qh.unknownAction())
    expect(listenerA.mock.calls.length).toBe(2)
    expect(listenerB.mock.calls.length).toBe(1)
    expect(listenerC.mock.calls.length).toBe(2)
  })
  it("notifies all subscribers about current dispatch regardless if any of them gets unsubscribed in the process", () => {
    const store = qx.createStore(qh.reducers.todos)
    const unsubscribeHandles: any[] = []
    const doUnsubscribeAll = () => unsubscribeHandles.forEach(unsubscribe => unsubscribe())
    const listener1 = jest.fn()
    const listener2 = jest.fn()
    const listener3 = jest.fn()
    unsubscribeHandles.push(store.subscribe(() => listener1()))
    unsubscribeHandles.push(
      store.subscribe(() => {
        listener2()
        doUnsubscribeAll()
      })
    )
    unsubscribeHandles.push(store.subscribe(() => listener3()))
    store.dispatch(qh.unknownAction())
    expect(listener1.mock.calls.length).toBe(1)
    expect(listener2.mock.calls.length).toBe(1)
    expect(listener3.mock.calls.length).toBe(1)
    store.dispatch(qh.unknownAction())
    expect(listener1.mock.calls.length).toBe(1)
    expect(listener2.mock.calls.length).toBe(1)
    expect(listener3.mock.calls.length).toBe(1)
  })
  it("notifies only subscribers active at the moment of current dispatch", () => {
    const store = qx.createStore(qh.reducers.todos)
    const listener1 = jest.fn()
    const listener2 = jest.fn()
    const listener3 = jest.fn()
    let listener3Added = false
    const maybeAddThirdListener = () => {
      if (!listener3Added) {
        listener3Added = true
        store.subscribe(() => listener3())
      }
    }
    store.subscribe(() => listener1())
    store.subscribe(() => {
      listener2()
      maybeAddThirdListener()
    })
    store.dispatch(qh.unknownAction())
    expect(listener1.mock.calls.length).toBe(1)
    expect(listener2.mock.calls.length).toBe(1)
    expect(listener3.mock.calls.length).toBe(0)
    store.dispatch(qh.unknownAction())
    expect(listener1.mock.calls.length).toBe(2)
    expect(listener2.mock.calls.length).toBe(2)
    expect(listener3.mock.calls.length).toBe(1)
  })
  it("uses the last snapshot of subscribers during nested dispatch", () => {
    const store = qx.createStore(qh.reducers.todos)
    const listener1 = jest.fn()
    const listener2 = jest.fn()
    const listener3 = jest.fn()
    const listener4 = jest.fn()
    let unsubscribe4: any
    const unsubscribe1 = store.subscribe(() => {
      listener1()
      expect(listener1.mock.calls.length).toBe(1)
      expect(listener2.mock.calls.length).toBe(0)
      expect(listener3.mock.calls.length).toBe(0)
      expect(listener4.mock.calls.length).toBe(0)
      unsubscribe1()
      unsubscribe4 = store.subscribe(listener4)
      store.dispatch(qh.unknownAction())
      expect(listener1.mock.calls.length).toBe(1)
      expect(listener2.mock.calls.length).toBe(1)
      expect(listener3.mock.calls.length).toBe(1)
      expect(listener4.mock.calls.length).toBe(1)
    })
    store.subscribe(listener2)
    store.subscribe(listener3)
    store.dispatch(qh.unknownAction())
    expect(listener1.mock.calls.length).toBe(1)
    expect(listener2.mock.calls.length).toBe(2)
    expect(listener3.mock.calls.length).toBe(2)
    expect(listener4.mock.calls.length).toBe(1)
    unsubscribe4()
    store.dispatch(qh.unknownAction())
    expect(listener1.mock.calls.length).toBe(1)
    expect(listener2.mock.calls.length).toBe(3)
    expect(listener3.mock.calls.length).toBe(3)
    expect(listener4.mock.calls.length).toBe(1)
  })
  it("provides an up-to-date state when a subscriber is notified", done => {
    const store = qx.createStore(qh.reducers.todos)
    store.subscribe(() => {
      expect(store.getState()).toEqual([
        {
          id: 1,
          text: "Hello",
        },
      ])
      done()
    })
    store.dispatch(qh.addTodo("Hello"))
  })
  it("does not leak private listeners array", done => {
    const store = qx.createStore(qh.reducers.todos)
    store.subscribe(function (this: any) {
      expect(this).toBe(undefined)
      done()
    })
    store.dispatch(qh.addTodo("Hello"))
  })
  it("only accepts plain object actions", () => {
    const store = qx.createStore(qh.reducers.todos)
    expect(() => store.dispatch(qh.unknownAction())).not.toThrow()
    function AwesomeMap() {}
    ;[null, undefined, 42, "hey", new AwesomeMap()].forEach(nonObject =>
      expect(() => store.dispatch(nonObject)).toThrow(/plain/)
    )
  })
  it("handles nested dispatches gracefully", () => {
    function foo(state = 0, action: qx.Action) {
      return action.type === "foo" ? 1 : state
    }
    function bar(state = 0, action: qx.Action) {
      return action.type === "bar" ? 2 : state
    }
    const store = qx.createStore(qx.combineReducers({ foo, bar }))
    store.subscribe(function kindaComponentDidUpdate() {
      const state = store.getState()
      if (state.bar === 0) {
        store.dispatch({ type: "bar" })
      }
    })
    store.dispatch({ type: "foo" })
    expect(store.getState()).toEqual({
      foo: 1,
      bar: 2,
    })
  })
  it("does not allow dispatch() from within a reducer", () => {
    const store = qx.createStore(qh.reducers.dispatchInTheMiddleOfReducer)
    expect(() => store.dispatch(qh.dispatchInMiddle(store.dispatch.bind(store, qh.unknownAction())))).toThrow(
      /may not dispatch/
    )
    expect(() => store.dispatch(qh.dispatchInMiddle(() => {}))).not.toThrow()
  })
  it("does not allow getState() from within a reducer", () => {
    const store = qx.createStore(qh.reducers.getStateInTheMiddleOfReducer)
    expect(() => store.dispatch(qh.getStateInMiddle(store.getState.bind(store)))).toThrow(
      /You may not call store.getState()/
    )
    expect(() => store.dispatch(qh.getStateInMiddle(() => {}))).not.toThrow()
  })
  it("does not allow subscribe() from within a reducer", () => {
    const store = qx.createStore(qh.reducers.subscribeInTheMiddleOfReducer)
    expect(() => store.dispatch(qh.subscribeInMiddle(store.subscribe.bind(store, () => {})))).toThrow(
      /You may not call store.subscribe()/
    )
    expect(() => store.dispatch(qh.subscribeInMiddle(() => {}))).not.toThrow()
  })
  it("does not allow unsubscribe from subscribe() from within a reducer", () => {
    const store = qx.createStore(qh.reducers.unsubscribeInTheMiddleOfReducer)
    const unsubscribe = store.subscribe(() => {})
    expect(() => store.dispatch(qh.unsubscribeInMiddle(unsubscribe.bind(store)))).toThrow(
      /You may not unsubscribe from a store/
    )
    expect(() => store.dispatch(qh.unsubscribeInMiddle(() => {}))).not.toThrow()
  })
  it("recovers from an error within a reducer", () => {
    const store = qx.createStore(qh.reducers.errorThrowingReducer)
    expect(() => store.dispatch(qh.throwError())).toThrow()
    expect(() => store.dispatch(qh.unknownAction())).not.toThrow()
  })
  it("throws if action type is missing", () => {
    const store = qx.createStore(qh.reducers.todos)
    expect(() => store.dispatch({})).toThrow(/Actions may not have an undefined "type" property/)
  })
  it("throws an error that correctly describes the type of item dispatched", () => {
    const store = qx.createStore(qh.reducers.todos)
    expect(() => store.dispatch(Promise.resolve(42))).toThrow(/the actual type was: 'Promise'/)
    expect(() => store.dispatch(() => {})).toThrow(/the actual type was: 'function'/)
    expect(() => store.dispatch(new Date())).toThrow(/the actual type was: 'date'/)
    expect(() => store.dispatch(null)).toThrow(/the actual type was: 'null'/)
    expect(() => store.dispatch(undefined)).toThrow(/the actual type was: 'undefined'/)
  })
  it("throws if action type is undefined", () => {
    const store = qx.createStore(qh.reducers.todos)
    expect(() => store.dispatch({ type: undefined })).toThrow(/Actions may not have an undefined "type" property/)
  })
  it("does not throw if action type is falsy", () => {
    const store = qx.createStore(qh.reducers.todos)
    expect(() => store.dispatch({ type: false })).not.toThrow()
    expect(() => store.dispatch({ type: 0 })).not.toThrow()
    expect(() => store.dispatch({ type: null })).not.toThrow()
    expect(() => store.dispatch({ type: "" })).not.toThrow()
  })
  it("accepts enhancer as the third argument", () => {
    const emptyArray: any[] = []
    const spyEnhancer =
      (vanillaCreateStore: any) =>
      (...args: any[]) => {
        expect(args[0]).toBe(qh.reducers.todos)
        expect(args[1]).toBe(emptyArray)
        expect(args.length).toBe(2)
        const vanillaStore = vanillaCreateStore(...args)
        return {
          ...vanillaStore,
          dispatch: jest.fn(vanillaStore.dispatch),
        }
      }
    const store = qx.createStore(qh.reducers.todos, emptyArray, spyEnhancer)
    const action = qh.addTodo("Hello")
    store.dispatch(action)
    expect(store.dispatch).toBeCalledWith(action)
    expect(store.getState()).toEqual([
      {
        id: 1,
        text: "Hello",
      },
    ])
  })
  it("accepts enhancer as the second argument if initial state is missing", () => {
    const spyEnhancer =
      (vanillaCreateStore: any) =>
      (...args: any[]) => {
        expect(args[0]).toBe(qh.reducers.todos)
        expect(args[1]).toBe(undefined)
        expect(args.length).toBe(2)
        const vanillaStore = vanillaCreateStore(...args)
        return {
          ...vanillaStore,
          dispatch: jest.fn(vanillaStore.dispatch),
        }
      }
    const store = qx.createStore(qh.reducers.todos, spyEnhancer)
    const action = qh.addTodo("Hello")
    store.dispatch(action)
    expect(store.dispatch).toBeCalledWith(action)
    expect(store.getState()).toEqual([
      {
        id: 1,
        text: "Hello",
      },
    ])
  })
  it("throws if enhancer is neither undefined nor a function", () => {
    expect(() => qx.createStore(qh.reducers.todos, undefined, {} as unknown as qx.StoreEnhancer)).toThrow()
    expect(() => qx.createStore(qh.reducers.todos, undefined, [] as unknown as qx.StoreEnhancer)).toThrow()
    expect(() => qx.createStore(qh.reducers.todos, undefined, null)).toThrow()
    expect(() => qx.createStore(qh.reducers.todos, undefined, false as unknown as qx.StoreEnhancer)).toThrow()
    expect(() => qx.createStore(qh.reducers.todos, undefined, undefined)).not.toThrow()
    expect(() => qx.createStore(qh.reducers.todos, undefined, x => x)).not.toThrow()
    expect(() => qx.createStore(qh.reducers.todos, x => x)).not.toThrow()
    expect(() => qx.createStore(qh.reducers.todos, [])).not.toThrow()
    expect(() => qx.createStore<any, qx.Action, {}, {}>(qh.reducers.todos, {})).not.toThrow()
  })
  it("throws if nextReducer is not a function", () => {
    const store = qx.createStore(qh.reducers.todos)
    expect(() => store.replaceReducer(undefined)).toThrow("Expected the nextReducer to be a function.")
    expect(() => store.replaceReducer(() => [])).not.toThrow()
  })
  it("throws if listener is not a function", () => {
    const store = qx.createStore(qh.reducers.todos)
    expect(() => store.subscribe(undefined)).toThrow()
    expect(() => store.subscribe("")).toThrow()
    expect(() => store.subscribe(null)).toThrow()
    expect(() => store.subscribe(undefined)).toThrow()
  })
  describe("Symbol.observable interop point", () => {
    it("should exist", () => {
      const store = qx.createStore(() => {})
      expect(typeof store[qx.$$observable]).toBe("function")
    })
    describe("returned value", () => {
      it("should be subscribable", () => {
        const store = qx.createStore(() => {})
        const obs = store[qx.$$observable]()
        expect(typeof obs.subscribe).toBe("function")
      })
      it("may be used to retrieve itself", () => {
        const store = qx.createStore(() => {})
        const obs = store[qx.$$observable]()
        expect(obs[qx.$$observable]()).toBe(obs)
      })
      it("should throw a TypeError if an observer object is not supplied to subscribe", () => {
        const store = qx.createStore(() => {})
        const obs = store[qx.$$observable]()
        expect(function () {
          obs.subscribe()
        }).toThrowError(new TypeError(`Expected the observer to be an object. Instead, received: 'undefined'`))
        expect(function () {
          obs.subscribe(null)
        }).toThrowError(new TypeError(`Expected the observer to be an object. Instead, received: 'null'`))
        expect(function () {
          obs.subscribe(() => {})
        }).toThrowError(new TypeError(`Expected the observer to be an object. Instead, received: 'function'`))
        expect(function () {
          obs.subscribe({})
        }).not.toThrow()
      })
      it("should return a subscription object when subscribed", () => {
        const store = qx.createStore(() => {})
        const obs = store[qx.$$observable]()
        const sub = obs.subscribe({})
        expect(typeof sub.unsubscribe).toBe("function")
      })
    })
    it("should pass an integration test with no unsubscribe", () => {
      function foo(state = 0, action: qx.Action) {
        return action.type === "foo" ? 1 : state
      }
      function bar(state = 0, action: qx.Action) {
        return action.type === "bar" ? 2 : state
      }
      const store = qx.createStore(qx.combineReducers({ foo, bar }))
      const observable = store[qx.$$observable]()
      const results: any[] = []
      observable.subscribe({
        next(state: any) {
          results.push(state)
        },
      })
      store.dispatch({ type: "foo" })
      store.dispatch({ type: "bar" })
      expect(results).toEqual([
        { foo: 0, bar: 0 },
        { foo: 1, bar: 0 },
        { foo: 1, bar: 2 },
      ])
    })
    it("should pass an integration test with an unsubscribe", () => {
      function foo(state = 0, action: qx.Action) {
        return action.type === "foo" ? 1 : state
      }
      function bar(state = 0, action: qx.Action) {
        return action.type === "bar" ? 2 : state
      }
      const store = qx.createStore(qx.combineReducers({ foo, bar }))
      const observable = store[qx.$$observable]()
      const results: any[] = []
      const sub = observable.subscribe({
        next(state: any) {
          results.push(state)
        },
      })
      store.dispatch({ type: "foo" })
      sub.unsubscribe()
      store.dispatch({ type: "bar" })
      expect(results).toEqual([
        { foo: 0, bar: 0 },
        { foo: 1, bar: 0 },
      ])
    })
    it("should pass an integration test with a common library (RxJS)", () => {
      function foo(state = 0, action: qx.Action) {
        return action.type === "foo" ? 1 : state
      }
      function bar(state = 0, action: qx.Action) {
        return action.type === "bar" ? 2 : state
      }
      const store: ObservableInput<{ foo: number; bar: number }> = qx.createStore(qx.combineReducers({ foo, bar }))
      const observable = from(store)
      const results: any[] = []
      const sub = observable.pipe(map(state => ({ fromRx: true, ...state }))).subscribe(state => results.push(state))
      ;(store as unknown as qx.Store).dispatch({ type: "foo" })
      sub.unsubscribe()
      ;(store as unknown as qx.Store).dispatch({ type: "bar" })
      expect(results).toEqual([
        { foo: 0, bar: 0, fromRx: true },
        { foo: 1, bar: 0, fromRx: true },
      ])
    })
  })
  it("does not log an error if parts of the current state will be ignored by a nextReducer using combineReducers", () => {
    const originalConsoleError = console.error
    console.error = jest.fn()
    const store = qx.createStore(
      qx.combineReducers({
        x: (s = 0, _) => s,
        y: qx.combineReducers({
          z: (s = 0, _) => s,
          w: (s = 0, _) => s,
        }),
      })
    )
    store.replaceReducer(
      qx.combineReducers({
        y: qx.combineReducers({
          z: (s = 0, _) => s,
        }),
      })
    )
    expect((console.error as any).mock.calls.length).toBe(0)
    console.error = originalConsoleError
  })
  it("throws if passing several enhancer functions without preloaded state", () => {
    const rootReducer = qx.combineReducers(qh.reducers)
    const dummyEnhancer = (f: any) => f
    expect(() => qx.createStore(rootReducer, dummyEnhancer as unknown as {}, dummyEnhancer)).toThrow()
  })
  it("throws if passing several enhancer functions with preloaded state", () => {
    const rootReducer = qx.combineReducers(qh.reducers)
    const dummyEnhancer = (f: any) => f
    expect(() => (qx.createStore as any)(rootReducer, { todos: [] }, dummyEnhancer, dummyEnhancer)).toThrow()
  })
})
describe("replaceReducers test", () => {
  it("returns the original store", () => {
    const nextReducer = qx.combineReducers({
      foo: (state = 1, _action) => state,
      bar: (state = 2, _action) => state,
    })
    const store = qx.createStore((state, action) => {
      if (state === undefined) return { type: 5 }
      return action
    })
    const nextStore = store.replaceReducer(nextReducer)
    expect(nextStore).toBe(store)
  })
})
describe("formatProdErrorMessage", () => {
  it("returns message with expected code references", () => {
    const code = 16
    const errorMessage = qx.formatProdErrorMessage(code)
    expect(errorMessage).toContain(`#${code}`)
    expect(errorMessage).toContain(`code=${code}`)
  })
})
describe("isPlainObject", () => {
  it("returns true only if plain object", () => {
    const sandbox = { fromAnotherRealm: false }
    vm.runInNewContext("fromAnotherRealm = {}", sandbox)
    expect(qx.isPlainObject(sandbox.fromAnotherRealm)).toBe(true)
    expect(qx.isPlainObject(new Date())).toBe(false)
    expect(qx.isPlainObject([1, 2, 3])).toBe(false)
    expect(qx.isPlainObject(null)).toBe(false)
    expect(qx.isPlainObject(undefined)).toBe(false)
    expect(qx.isPlainObject({ x: 1, y: 2 })).toBe(true)
  })
})
describe("Utils", () => {
  describe("compose", () => {
    it("composes from right to left", () => {
      const double = (x: number) => x * 2
      const square = (x: number) => x * x
      expect(qx.compose(square)(5)).toBe(25)
      expect(qx.compose(square, double)(5)).toBe(100)
      expect(qx.compose(double, square, double)(5)).toBe(200)
    })
    it("composes functions from right to left", () => {
      const a = (next: (x: string) => string) => (x: string) => next(x + "a")
      const b = (next: (x: string) => string) => (x: string) => next(x + "b")
      const c = (next: (x: string) => string) => (x: string) => next(x + "c")
      const final = (x: string) => x
      expect(qx.compose(a, b, c)(final)("")).toBe("abc")
      expect(qx.compose(b, c, a)(final)("")).toBe("bca")
      expect(qx.compose(c, a, b)(final)("")).toBe("cab")
    })
    it("throws at runtime if argument is not a function", () => {
      type sFunc = (x: number, y: number) => number
      const square = (x: number, _: number) => x * x
      const add = (x: number, y: number) => x + y
      expect(() => qx.compose(square, add, false as unknown as sFunc)(1, 2)).toThrow()
      expect(() => qx.compose(square, add, undefined)(1, 2)).toThrow()
      expect(() => qx.compose(square, add, true as unknown as sFunc)(1, 2)).toThrow()
      expect(() => qx.compose(square, add, NaN as unknown as sFunc)(1, 2)).toThrow()
      expect(() => qx.compose(square, add, "42" as unknown as sFunc)(1, 2)).toThrow()
    })
    it("can be seeded with multiple arguments", () => {
      const square = (x: number, _: number) => x * x
      const add = (x: number, y: number) => x + y
      expect(qx.compose(square, add)(1, 2)).toBe(9)
    })
    it("returns the first given argument if given no functions", () => {
      expect(qx.compose<number>()(1, 2)).toBe(1)
      expect(qx.compose()(3)).toBe(3)
      expect(qx.compose()(undefined)).toBe(undefined)
    })
    it("returns the first function if given only one", () => {
      const fn = () => {}
      expect(qx.compose(fn)).toBe(fn)
    })
  })
  describe("combineReducers", () => {
    it("returns a composite reducer that maps the state keys to given reducers", () => {
      const reducer = qx.combineReducers({
        counter: (state: number = 0, action) => (action.type === "increment" ? state + 1 : state),
        stack: (state: any[] = [], action) => (action.type === "push" ? [...state, action.value] : state),
      })
      const s1 = reducer(undefined, { type: "increment" })
      expect(s1).toEqual({ counter: 1, stack: [] })
      const s2 = reducer(s1, { type: "push", value: "a" })
      expect(s2).toEqual({ counter: 1, stack: ["a"] })
    })
    it("ignores all props which are not a function", () => {
      const reducer = qx.combineReducers({
        fake: true as unknown as qx.Reducer,
        broken: "string" as unknown as qx.Reducer,
        another: { nested: "object" } as unknown as qx.Reducer,
        stack: (state = []) => state,
      })
      expect(Object.keys(reducer(undefined, { type: "push" }))).toEqual(["stack"])
    })
    it("warns if a reducer prop is undefined", () => {
      const preSpy = console.error
      const spy = jest.fn()
      console.error = spy
      let isNotDefined: any
      qx.combineReducers({ isNotDefined })
      expect(spy.mock.calls[0][0]).toMatch(/No reducer provided for key "isNotDefined"/)
      spy.mockClear()
      qx.combineReducers({ thing: undefined })
      expect(spy.mock.calls[0][0]).toMatch(/No reducer provided for key "thing"/)
      spy.mockClear()
      console.error = preSpy
    })
    it("throws an error if a reducer returns undefined handling an action", () => {
      const reducer = qx.combineReducers({
        counter(state: number = 0, action) {
          switch (action && action.type) {
            case "increment":
              return state + 1
            case "decrement":
              return state - 1
            case "whatever":
            case null:
            case undefined:
              return undefined
            default:
              return state
          }
        },
      })
      expect(() => reducer({ counter: 0 }, { type: "whatever" })).toThrow(/"whatever".*"counter"/)
      expect(() => reducer({ counter: 0 }, null)).toThrow(/"counter".*an action/)
      expect(() => reducer({ counter: 0 }, {} as unknown as qx.AnyAction)).toThrow(/"counter".*an action/)
    })
    it("throws an error on first call if a reducer returns undefined initializing", () => {
      const reducer = qx.combineReducers({
        counter(state: number, action) {
          switch (action.type) {
            case "increment":
              return state + 1
            case "decrement":
              return state - 1
            default:
              return state
          }
        },
      })
      expect(() => reducer(undefined, { type: "" })).toThrow(/"counter".*initialization/)
    })
    it("catches error thrown in reducer when initializing and re-throw", () => {
      const reducer = qx.combineReducers({
        throwingReducer() {
          throw new Error("Error thrown in reducer")
        },
      })
      expect(() => reducer(undefined, undefined as unknown as qx.AnyAction)).toThrow(/Error thrown in reducer/)
    })
    it("allows a symbol to be used as an action type", () => {
      const increment = Symbol("INCREMENT")
      const reducer = qx.combineReducers({
        counter(state: number = 0, action) {
          switch (action.type) {
            case increment:
              return state + 1
            default:
              return state
          }
        },
      })
      expect(reducer({ counter: 0 }, { type: increment }).counter).toEqual(1)
    })
    it("maintains referential equality if the reducers it is combining do", () => {
      const reducer = qx.combineReducers({
        child1(state = {}) {
          return state
        },
        child2(state = {}) {
          return state
        },
        child3(state = {}) {
          return state
        },
      })
      const initialState = reducer(undefined, { type: "@@INIT" })
      expect(reducer(initialState, { type: "FOO" })).toBe(initialState)
    })
    it("does not have referential equality if one of the reducers changes something", () => {
      const reducer = qx.combineReducers({
        child1(state = {}) {
          return state
        },
        child2(state: { count: number } = { count: 0 }, action) {
          switch (action.type) {
            case "increment":
              return { count: state.count + 1 }
            default:
              return state
          }
        },
        child3(state = {}) {
          return state
        },
      })
      const initialState = reducer(undefined, { type: "@@INIT" })
      expect(reducer(initialState, { type: "increment" })).not.toBe(initialState)
    })
    it("throws an error on first call if a reducer attempts to handle a private action", () => {
      const reducer = qx.combineReducers({
        counter(state: number, action) {
          switch (action.type) {
            case "increment":
              return state + 1
            case "decrement":
              return state - 1
            case ActionTypes.INIT:
              return 0
            default:
              return undefined
          }
        },
      })
      expect(() => reducer(undefined, undefined as unknown as qx.AnyAction)).toThrow(/"counter".*private/)
    })
    it("warns if no reducers are passed to combineReducers", () => {
      const preSpy = console.error
      const spy = jest.fn()
      console.error = spy
      const reducer = qx.combineReducers({})
      reducer(undefined, { type: "" })
      expect(spy.mock.calls[0][0]).toMatch(/Store does not have a valid reducer/)
      spy.mockClear()
      console.error = preSpy
    })
    it("warns if input state does not match reducer shape", () => {
      const preSpy = console.error
      const spy = jest.fn()
      const nullAction = undefined as unknown as qx.AnyAction
      console.error = spy
      interface ShapeState {
        foo: { bar: number }
        baz: { qux: number }
      }
      type _ShapeMismatchState = qx.CombinedState<ShapeState>
      const reducer = qx.combineReducers<ShapeState>({
        foo(state = { bar: 1 }) {
          return state
        },
        baz(state = { qux: 3 }) {
          return state
        },
      })
      reducer(undefined, nullAction)
      expect(spy.mock.calls.length).toBe(0)
      reducer({ foo: { bar: 2 } } as unknown as ShapeState, nullAction)
      expect(spy.mock.calls.length).toBe(0)
      reducer(
        {
          foo: { bar: 2 },
          baz: { qux: 4 },
        },
        nullAction
      )
      expect(spy.mock.calls.length).toBe(0)
      qx.createStore(reducer, { bar: 2 } as unknown as ShapeState)
      expect(spy.mock.calls[0][0]).toMatch(/Unexpected key "bar".*createStore.*instead: "foo", "baz"/)
      qx.createStore(reducer, {
        bar: 2,
        qux: 4,
        thud: 5,
      } as unknown as ShapeState)
      expect(spy.mock.calls[1][0]).toMatch(/Unexpected keys "qux", "thud".*createStore.*instead: "foo", "baz"/)
      qx.createStore(reducer, 1 as unknown as ShapeState)
      expect(spy.mock.calls[2][0]).toMatch(/createStore has unexpected type of "number".*keys: "foo", "baz"/)
      reducer({ corge: 2 } as unknown as ShapeState, nullAction)
      expect(spy.mock.calls[3][0]).toMatch(/Unexpected key "corge".*reducer.*instead: "foo", "baz"/)
      reducer({ fred: 2, grault: 4 } as unknown as ShapeState, nullAction)
      expect(spy.mock.calls[4][0]).toMatch(/Unexpected keys "fred", "grault".*reducer.*instead: "foo", "baz"/)
      reducer(1 as unknown as ShapeState, nullAction)
      expect(spy.mock.calls[5][0]).toMatch(/reducer has unexpected type of "number".*keys: "foo", "baz"/)
      spy.mockClear()
      console.error = preSpy
    })
    it("only warns for unexpected keys once", () => {
      const preSpy = console.error
      const spy = jest.fn()
      console.error = spy
      const nullAction = { type: "" }
      const foo = (state = { foo: 1 }) => state
      const bar = (state = { bar: 2 }) => state
      expect(spy.mock.calls.length).toBe(0)
      interface WarnState {
        foo: { foo: number }
        bar: { bar: number }
      }
      const reducer = qx.combineReducers({ foo, bar })
      const state = { foo: 1, bar: 2, qux: 3 } as unknown as WarnState
      const bazState = { ...state, baz: 5 } as unknown as WarnState
      reducer(state, nullAction)
      reducer(state, nullAction)
      reducer(state, nullAction)
      reducer(state, nullAction)
      expect(spy.mock.calls.length).toBe(1)
      reducer(bazState, nullAction)
      reducer({ ...bazState }, nullAction)
      reducer({ ...bazState }, nullAction)
      reducer({ ...bazState }, nullAction)
      expect(spy.mock.calls.length).toBe(2)
      spy.mockClear()
      console.error = preSpy
    })
    describe("With Replace Reducers", function () {
      const foo = (state = {}) => state
      const bar = (state = {}) => state
      const ACTION = { type: "ACTION" }
      it("should return an updated state when additional reducers are passed to combineReducers", function () {
        const originalCompositeReducer = qx.combineReducers({ foo })
        const store = qx.createStore(originalCompositeReducer)
        store.dispatch(ACTION)
        const initialState = store.getState()
        store.replaceReducer(qx.combineReducers({ foo, bar }))
        store.dispatch(ACTION)
        const nextState = store.getState()
        expect(nextState).not.toBe(initialState)
      })
      it("should return an updated state when reducers passed to combineReducers are changed", function () {
        const baz = (state = {}) => state
        const originalCompositeReducer = qx.combineReducers({ foo, bar })
        const store = qx.createStore(originalCompositeReducer)
        store.dispatch(ACTION)
        const initialState = store.getState()
        store.replaceReducer(qx.combineReducers({ baz, bar }))
        store.dispatch(ACTION)
        const nextState = store.getState()
        expect(nextState).not.toBe(initialState)
      })
      it("should return the same state when reducers passed to combineReducers not changed", function () {
        const originalCompositeReducer = qx.combineReducers({ foo, bar })
        const store = qx.createStore(originalCompositeReducer)
        store.dispatch(ACTION)
        const initialState = store.getState()
        store.replaceReducer(qx.combineReducers({ foo, bar }))
        store.dispatch(ACTION)
        const nextState = store.getState()
        expect(nextState).toBe(initialState)
      })
      it("should return an updated state when one of more reducers passed to the combineReducers are removed", function () {
        const originalCompositeReducer = qx.combineReducers({ foo, bar })
        const store = qx.createStore(originalCompositeReducer)
        store.dispatch(ACTION)
        const initialState = store.getState()
        store.replaceReducer(qx.combineReducers({ bar }))
        const nextState = store.getState()
        expect(nextState).not.toBe(initialState)
      })
    })
  })
  describe("warning", () => {
    it("calls console.error when available", () => {
      const preSpy = console.error
      const spy = jest.fn()
      console.error = spy
      try {
        warning("Test")
        expect(spy.mock.calls[0][0]).toBe("Test")
      } finally {
        spy.mockClear()
        console.error = preSpy
      }
    })
    it("does not throw when console.error is not available", () => {
      const realConsole = global.console
      Object.defineProperty(global, "console", { value: {} })
      try {
        expect(() => warning("Test")).not.toThrow()
      } finally {
        Object.defineProperty(global, "console", { value: realConsole })
      }
    })
    it("does not throw when console is not available", () => {
      const realConsole = global.console
      Object.defineProperty(global, "console", { value: undefined })
      try {
        expect(() => warning("Test")).not.toThrow()
      } finally {
        Object.defineProperty(global, "console", { value: realConsole })
      }
    })
  })
})
