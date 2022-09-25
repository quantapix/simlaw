import * as qx from "../../src/redux/index.js"
import lodashMemoize from "lodash/memoize"

const numOfStates = 1000000
interface StateA {
  a: number
}
interface StateAB {
  a: number
  b: number
}
interface StateSub {
  sub: {
    a: number
  }
}
const states: StateAB[] = []
for (let i = 0; i < numOfStates; i++) {
  states.push({ a: 1, b: 2 })
}
describe("Basic selector behavior", () => {
  it("basic selector", () => {
    const selector = qx.createSelector(
      (state: StateA) => state.a,
      a => a
    )
    const firstState = { a: 1 }
    const firstStateNewPointer = { a: 1 }
    const secondState = { a: 2 }
    expect(selector(firstState)).toBe(1)
    expect(selector(firstState)).toBe(1)
    expect(selector.recomputations()).toBe(1)
    expect(selector(firstStateNewPointer)).toBe(1)
    expect(selector.recomputations()).toBe(1)
    expect(selector(secondState)).toBe(2)
    expect(selector.recomputations()).toBe(2)
  })
  it("don't pass extra parameters to inputSelector when only called with the state", () => {
    const selector = qx.createSelector(
      (...params: any[]) => params.length,
      a => a
    )
    expect(selector({})).toBe(1)
  })
  it("basic selector multiple keys", () => {
    const selector = qx.createSelector(
      (state: StateAB) => state.a,
      (state: StateAB) => state.b,
      (a, b) => a + b
    )
    const state1 = { a: 1, b: 2 }
    expect(selector(state1)).toBe(3)
    expect(selector(state1)).toBe(3)
    expect(selector.recomputations()).toBe(1)
    const state2 = { a: 3, b: 2 }
    expect(selector(state2)).toBe(5)
    expect(selector(state2)).toBe(5)
    expect(selector.recomputations()).toBe(2)
  })
  it("basic selector invalid input selector", () => {
    expect(() =>
      qx.createSelector(
        (state: StateAB) => state.a,
        function input2(state: StateAB) {
          return state.b
        },
        "not a function",
        (a: any, b: any) => a + b
      )
    ).toThrow(
      "createSelector expects all input-selectors to be functions, but received the following types: [function unnamed(), function input2(), string]"
    )
    expect(() => qx.createSelector((state: StateAB) => state.a, "not a function")).toThrow(
      "createSelector expects an output function after the inputs, but received: [string]"
    )
  })
  it("basic selector cache hit performance", () => {
    if (process.env.COVERAGE) {
      return
    }
    const selector = qx.createSelector(
      (state: StateAB) => state.a,
      (state: StateAB) => state.b,
      (a, b) => a + b
    )
    const state1 = { a: 1, b: 2 }
    const start = new Date()
    for (let i = 0; i < 1000000; i++) {
      selector(state1)
    }
    const totalTime = new Date().getTime() - start.getTime()
    expect(selector(state1)).toBe(3)
    expect(selector.recomputations()).toBe(1)
    expect(totalTime).toBeLessThan(1000)
  })
  it("basic selector cache hit performance for state changes but shallowly equal selector args", () => {
    if (process.env.COVERAGE) {
      return
    }
    const selector = qx.createSelector(
      (state: StateAB) => state.a,
      (state: StateAB) => state.b,
      (a, b) => a + b
    )
    const start = new Date()
    for (let i = 0; i < numOfStates; i++) {
      selector(states[i])
    }
    const totalTime = new Date().getTime() - start.getTime()
    expect(selector(states[0])).toBe(3)
    expect(selector.recomputations()).toBe(1)
    expect(totalTime).toBeLessThan(1000)
  })
  it("memoized composite arguments", () => {
    const selector = qx.createSelector(
      (state: StateSub) => state.sub,
      sub => sub
    )
    const state1 = { sub: { a: 1 } }
    expect(selector(state1)).toEqual({ a: 1 })
    expect(selector(state1)).toEqual({ a: 1 })
    expect(selector.recomputations()).toBe(1)
    const state2 = { sub: { a: 2 } }
    expect(selector(state2)).toEqual({ a: 2 })
    expect(selector.recomputations()).toBe(2)
  })
  it("first argument can be an array", () => {
    const selector = qx.createSelector([state => state.a, state => state.b], (a, b) => {
      return a + b
    })
    expect(selector({ a: 1, b: 2 })).toBe(3)
    expect(selector({ a: 1, b: 2 })).toBe(3)
    expect(selector.recomputations()).toBe(1)
    expect(selector({ a: 3, b: 2 })).toBe(5)
    expect(selector.recomputations()).toBe(2)
  })
  it("can accept props", () => {
    let called = 0
    const selector = qx.createSelector(
      (state: StateAB) => state.a,
      (state: StateAB) => state.b,
      (state: StateAB, props: { c: number }) => props.c,
      (a, b, c) => {
        called++
        return a + b + c
      }
    )
    expect(selector({ a: 1, b: 2 }, { c: 100 })).toBe(103)
  })
  it("recomputes result after exception", () => {
    let called = 0
    const selector = qx.createSelector(
      (state: StateA) => state.a,
      () => {
        called++
        throw Error("test error")
      }
    )
    expect(() => selector({ a: 1 })).toThrow("test error")
    expect(() => selector({ a: 1 })).toThrow("test error")
    expect(called).toBe(2)
  })
  it("memoizes previous result before exception", () => {
    let called = 0
    const selector = qx.createSelector(
      (state: StateA) => state.a,
      a => {
        called++
        if (a > 1) throw Error("test error")
        return a
      }
    )
    const state1 = { a: 1 }
    const state2 = { a: 2 }
    expect(selector(state1)).toBe(1)
    expect(() => selector(state2)).toThrow("test error")
    expect(selector(state1)).toBe(1)
    expect(called).toBe(2)
  })
})
describe("Combining selectors", () => {
  it("chained selector", () => {
    const selector1 = qx.createSelector(
      (state: StateSub) => state.sub,
      sub => sub
    )
    const selector2 = qx.createSelector(selector1, sub => sub.a)
    const state1 = { sub: { a: 1 } }
    expect(selector2(state1)).toBe(1)
    expect(selector2(state1)).toBe(1)
    expect(selector2.recomputations()).toBe(1)
    const state2 = { sub: { a: 2 } }
    expect(selector2(state2)).toBe(2)
    expect(selector2.recomputations()).toBe(2)
  })
  it("chained selector with props", () => {
    const selector1 = qx.createSelector(
      (state: StateSub) => state.sub,
      (state: StateSub, props: { x: number; y: number }) => props.x,
      (sub, x) => ({ sub, x })
    )
    const selector2 = qx.createSelector(
      selector1,
      (state: StateSub, props: { x: number; y: number }) => props.y,
      (param, y) => param.sub.a + param.x + y
    )
    const state1 = { sub: { a: 1 } }
    expect(selector2(state1, { x: 100, y: 200 })).toBe(301)
    expect(selector2(state1, { x: 100, y: 200 })).toBe(301)
    expect(selector2.recomputations()).toBe(1)
    const state2 = { sub: { a: 2 } }
    expect(selector2(state2, { x: 100, y: 201 })).toBe(303)
    expect(selector2.recomputations()).toBe(2)
  })
  it("chained selector with variadic args", () => {
    const selector1 = qx.createSelector(
      (state: StateSub) => state.sub,
      (state: StateSub, props: { x: number; y: number }, another: number) => props.x + another,
      (sub, x) => ({ sub, x })
    )
    const selector2 = qx.createSelector(
      selector1,
      (state: StateSub, props: { x: number; y: number }) => props.y,
      (param, y) => param.sub.a + param.x + y
    )
    const state1 = { sub: { a: 1 } }
    expect(selector2(state1, { x: 100, y: 200 }, 100)).toBe(401)
    expect(selector2(state1, { x: 100, y: 200 }, 100)).toBe(401)
    expect(selector2.recomputations()).toBe(1)
    const state2 = { sub: { a: 2 } }
    expect(selector2(state2, { x: 100, y: 201 }, 200)).toBe(503)
    expect(selector2.recomputations()).toBe(2)
  })
  it("override valueEquals", () => {
    const createOverridenSelector = qx.createSelectorCreator(qx.defaultMemoize, (a, b) => typeof a === typeof b)
    const selector = createOverridenSelector(
      (state: StateA) => state.a,
      a => a
    )
    expect(selector({ a: 1 })).toBe(1)
    expect(selector({ a: 2 })).toBe(1)
    expect(selector.recomputations()).toBe(1)
    expect(selector({ a: "A" })).toBe("A")
    expect(selector.recomputations()).toBe(2)
  })
})
describe("Customizing selectors", () => {
  it("custom memoize", () => {
    const hashFn = (...args: any[]) => args.reduce((acc, val) => acc + "-" + JSON.stringify(val))
    const customSelectorCreator = qx.createSelectorCreator(lodashMemoize, hashFn)
    const selector = customSelectorCreator(
      (state: StateAB) => state.a,
      (state: StateAB) => state.b,
      (a, b) => a + b
    )
    expect(selector({ a: 1, b: 2 })).toBe(3)
    expect(selector({ a: 1, b: 2 })).toBe(3)
    expect(selector.recomputations()).toBe(1)
    expect(selector({ a: 1, b: 3 })).toBe(4)
    expect(selector.recomputations()).toBe(2)
    expect(selector({ a: 1, b: 3 })).toBe(4)
    expect(selector.recomputations()).toBe(2)
    expect(selector({ a: 2, b: 3 })).toBe(5)
    expect(selector.recomputations()).toBe(3)
  })
  it("createSelector accepts direct memoizer arguments", () => {
    let memoizer1Calls = 0
    let memoizer2Calls = 0
    let memoizer3Calls = 0
    const defaultMemoizeAcceptsFirstArgDirectly = qx.createSelector(
      (state: StateAB) => state.a,
      (state: StateAB) => state.b,
      (a, b) => a + b,
      {
        memoizeOptions: (a, b) => {
          memoizer1Calls++
          return a === b
        },
      }
    )
    defaultMemoizeAcceptsFirstArgDirectly({ a: 1, b: 2 })
    defaultMemoizeAcceptsFirstArgDirectly({ a: 1, b: 3 })
    expect(memoizer1Calls).toBeGreaterThan(0)
    const defaultMemoizeAcceptsArgsAsArray = qx.createSelector(
      (state: StateAB) => state.a,
      (state: StateAB) => state.b,
      (a, b) => a + b,
      {
        memoizeOptions: [
          (a, b) => {
            memoizer2Calls++
            return a === b
          },
        ],
      }
    )
    defaultMemoizeAcceptsArgsAsArray({ a: 1, b: 2 })
    defaultMemoizeAcceptsArgsAsArray({ a: 1, b: 3 })
    expect(memoizer2Calls).toBeGreaterThan(0)
    const createSelectorWithSeparateArg = qx.createSelectorCreator(qx.defaultMemoize, (a, b) => {
      memoizer3Calls++
      return a === b
    })
    const defaultMemoizeAcceptsArgFromCSC = createSelectorWithSeparateArg(
      (state: StateAB) => state.a,
      (state: StateAB) => state.b,
      (a, b) => a + b
    )
    defaultMemoizeAcceptsArgFromCSC({ a: 1, b: 2 })
    defaultMemoizeAcceptsArgFromCSC({ a: 1, b: 3 })
    expect(memoizer3Calls).toBeGreaterThan(0)
  })
})
describe("defaultMemoize", () => {
  it("Basic memoization", () => {
    let called = 0
    const memoized = qx.defaultMemoize(state => {
      called++
      return state.a
    })
    const o1 = { a: 1 }
    const o2 = { a: 2 }
    expect(memoized(o1)).toBe(1)
    expect(memoized(o1)).toBe(1)
    expect(called).toBe(1)
    expect(memoized(o2)).toBe(2)
    expect(called).toBe(2)
  })
  it("Memoizes with multiple arguments", () => {
    const memoized = qx.defaultMemoize((...args) => args.reduce((sum, value) => sum + value, 0))
    expect(memoized(1, 2)).toBe(3)
    expect(memoized(1)).toBe(1)
  })
  it("Memoizes with equalityCheck override", () => {
    let called = 0
    const valueEquals = (a: any, b: any) => typeof a === typeof b
    const memoized = qx.defaultMemoize(a => {
      called++
      return a
    }, valueEquals)
    expect(memoized(1)).toBe(1)
    expect(memoized(2)).toBe(1) // yes, really true
    expect(called).toBe(1)
    expect(memoized("A")).toBe("A")
    expect(called).toBe(2)
  })
  it("Passes correct objects to equalityCheck", () => {
    let fallthroughs = 0
    function shallowEqual(newVal: any, oldVal: any) {
      if (newVal === oldVal) return true
      fallthroughs += 1
      let countA = 0
      let countB = 0
      for (const key in newVal) {
        if (Object.hasOwnProperty.call(newVal, key) && newVal[key] !== oldVal[key]) return false
        countA++
      }
      for (const key in oldVal) {
        if (Object.hasOwnProperty.call(oldVal, key)) countB++
      }
      return countA === countB
    }
    const someObject = { foo: "bar" }
    const anotherObject = { foo: "bar" }
    const memoized = qx.defaultMemoize(a => a, shallowEqual)
    memoized(someObject)
    expect(fallthroughs).toBe(0)
    memoized(anotherObject)
    expect(fallthroughs).toBe(1)
  })
  it("Accepts a max size greater than 1 with LRU cache behavior", () => {
    let funcCalls = 0
    const memoizer = qx.defaultMemoize(
      (state: any) => {
        funcCalls++
        return state
      },
      {
        maxSize: 3,
      }
    )
    memoizer("a") // ['a']
    expect(funcCalls).toBe(1)
    memoizer("a") // ['a']
    expect(funcCalls).toBe(1)
    memoizer("b") // ['b', 'a']
    expect(funcCalls).toBe(2)
    memoizer("c") // ['c', 'b', 'a']
    expect(funcCalls).toBe(3)
    memoizer("d") // ['d', 'c', 'b']
    expect(funcCalls).toBe(4)
    memoizer("a") // ['a', 'd', 'c']
    expect(funcCalls).toBe(5)
    memoizer("c") // ['c', 'a', 'd']
    expect(funcCalls).toBe(5)
    memoizer("e") // ['e', 'c', 'a']
    expect(funcCalls).toBe(6)
    memoizer("d") // ['d', 'e', 'c']
    expect(funcCalls).toBe(7)
  })
  it("Allows reusing an existing result if they are equivalent", () => {
    interface Todo {
      id: number
      name: string
    }
    const todos1: Todo[] = [
      { id: 1, name: "a" },
      { id: 2, name: "b" },
      { id: 3, name: "c" },
    ]
    const todos2 = todos1.slice()
    todos2[2] = { id: 3, name: "d" }
    function is(x: unknown, y: unknown) {
      if (x === y) {
        return x !== 0 || y !== 0 || 1 / x === 1 / y
      } else {
        return x !== x && y !== y
      }
    }
    function shallowEqual(objA: any, objB: any) {
      if (is(objA, objB)) return true
      if (typeof objA !== "object" || objA === null || typeof objB !== "object" || objB === null) {
        return false
      }
      const keysA = Object.keys(objA)
      const keysB = Object.keys(objB)
      if (keysA.length !== keysB.length) return false
      for (let i = 0; i < keysA.length; i++) {
        if (!Object.prototype.hasOwnProperty.call(objB, keysA[i]!) || !is(objA[keysA[i]!], objB[keysA[i]!])) {
          return false
        }
      }
      return true
    }
    for (const maxSize of [1, 3]) {
      let funcCalls = 0
      const memoizer = qx.defaultMemoize(
        (state: Todo[]) => {
          funcCalls++
          return state.map(todo => todo.id)
        },
        {
          maxSize,
          resultEqualityCheck: shallowEqual,
        }
      )
      const ids1 = memoizer(todos1)
      expect(funcCalls).toBe(1)
      const ids2 = memoizer(todos1)
      expect(funcCalls).toBe(1)
      expect(ids2).toBe(ids1)
      const ids3 = memoizer(todos2)
      expect(funcCalls).toBe(2)
      expect(ids3).toBe(ids1)
    }
  })
  it("updates the cache key even if resultEqualityCheck is a hit", () => {
    const selector = jest.fn(x => x)
    const equalityCheck = jest.fn((a, b) => a === b)
    const resultEqualityCheck = jest.fn((a, b) => typeof a === typeof b)
    const memoizedFn = qx.defaultMemoize(selector, {
      maxSize: 1,
      resultEqualityCheck,
      equalityCheck,
    })
    memoizedFn("cache this result")
    expect(selector).toBeCalledTimes(1)
    const result = memoizedFn("arg1")
    expect(equalityCheck).toHaveLastReturnedWith(false)
    expect(resultEqualityCheck).toHaveLastReturnedWith(true)
    expect(result).toBe("cache this result")
    expect(selector).toBeCalledTimes(2)
    const result2 = memoizedFn("arg1")
    expect(result2).toBe("cache this result")
    expect(equalityCheck).toHaveLastReturnedWith(true)
    expect(selector).toBeCalledTimes(2)
  })
  it("Allows caching a value of `undefined`", () => {
    const state = {
      foo: { baz: "baz" },
      bar: "qux",
    }
    const fooChangeSpy = jest.fn()
    const fooChangeHandler = qx.createSelector((state: any) => state.foo, fooChangeSpy)
    fooChangeHandler(state)
    expect(fooChangeSpy.mock.calls.length).toEqual(1)
    fooChangeHandler(state)
    expect(fooChangeSpy.mock.calls.length).toEqual(1)
    const state2 = { a: 1 }
    let count = 0
    const selector = qx.createSelector([(state: any) => state.a], () => {
      count++
      return undefined
    })
    selector(state)
    expect(count).toBe(1)
    selector(state)
    expect(count).toBe(1)
  })
  it("Accepts an options object as an arg", () => {
    let memoizer1Calls = 0
    const acceptsEqualityCheckAsOption = qx.defaultMemoize((a: any) => a, {
      equalityCheck: (a, b) => {
        memoizer1Calls++
        return a === b
      },
    })
    acceptsEqualityCheckAsOption(42)
    acceptsEqualityCheckAsOption(43)
    expect(memoizer1Calls).toBeGreaterThan(0)
    let called = 0
    const fallsBackToDefaultEqualityIfNoArgGiven = qx.defaultMemoize(state => {
      called++
      return state.a
    }, {})
    const o1 = { a: 1 }
    const o2 = { a: 2 }
    expect(fallsBackToDefaultEqualityIfNoArgGiven(o1)).toBe(1)
    expect(fallsBackToDefaultEqualityIfNoArgGiven(o1)).toBe(1)
    expect(called).toBe(1)
    expect(fallsBackToDefaultEqualityIfNoArgGiven(o2)).toBe(2)
    expect(called).toBe(2)
  })
  it("Exposes a clearCache method on the memoized function", () => {
    let funcCalls = 0
    const memoizer = qx.defaultMemoize(
      (state: any) => {
        funcCalls++
        return state
      },
      {
        maxSize: 1,
      }
    )
    memoizer("a") // ['a']
    expect(funcCalls).toBe(1)
    memoizer("a") // ['a']
    expect(funcCalls).toBe(1)
    memoizer.clearCache()
    memoizer("a")
    expect(funcCalls).toBe(2)
    funcCalls = 0
    const selector = qx.createSelector(
      (state: string) => state,
      state => {
        funcCalls++
        return state
      },
      {
        memoizeOptions: { maxSize: 3 },
      }
    )
    selector("a") // ['a']
    expect(funcCalls).toBe(1)
    selector("a") // ['a']
    expect(funcCalls).toBe(1)
    selector("b") // ['b', 'a']
    expect(funcCalls).toBe(2)
    selector("c") // ['c', 'b', 'a']
    expect(funcCalls).toBe(3)
    selector("c") // ['c', 'b', 'a']
    expect(funcCalls).toBe(3)
    selector.memoizedResultFunc.clearCache()
    selector("a") // ['a']
    expect(funcCalls).toBe(4)
    selector("a") // ['a']
    expect(funcCalls).toBe(4)
    selector.clearCache()
    selector("b") // ['b']
    expect(funcCalls).toBe(5)
  })
})
describe("createStructureSelector", () => {
  it("structured selector", () => {
    const selector = qx.createStructuredSelector({
      x: (state: StateAB) => state.a,
      y: (state: StateAB) => state.b,
    })
    const firstResult = selector({ a: 1, b: 2 })
    expect(firstResult).toEqual({ x: 1, y: 2 })
    expect(selector({ a: 1, b: 2 })).toBe(firstResult)
    const secondResult = selector({ a: 2, b: 2 })
    expect(secondResult).toEqual({ x: 2, y: 2 })
    expect(selector({ a: 2, b: 2 })).toBe(secondResult)
  })
  it("structured selector with invalid arguments", () => {
    expect(() =>
      qx.createStructuredSelector(
        (state: StateAB) => state.a,
        (state: StateAB) => state.b
      )
    ).toThrow(/expects first argument to be an object.*function/)
    expect(() =>
      qx.createStructuredSelector({
        a: state => state.b,
        c: "d",
      })
    ).toThrow(
      "createSelector expects all input-selectors to be functions, but received the following types: [function a(), string]"
    )
  })
  it("structured selector with custom selector creator", () => {
    const customSelectorCreator = qx.createSelectorCreator(qx.defaultMemoize, (a, b) => a === b)
    const selector = qx.createStructuredSelector(
      {
        x: (state: StateAB) => state.a,
        y: (state: StateAB) => state.b,
      },
      customSelectorCreator
    )
    const firstResult = selector({ a: 1, b: 2 })
    expect(firstResult).toEqual({ x: 1, y: 2 })
    expect(selector({ a: 1, b: 2 })).toBe(firstResult)
    expect(selector({ a: 2, b: 2 })).toEqual({ x: 2, y: 2 })
  })
})
describe("createSelector exposed utils", () => {
  it("resetRecomputations", () => {
    const selector = qx.createSelector(
      (state: StateA) => state.a,
      a => a
    )
    expect(selector({ a: 1 })).toBe(1)
    expect(selector({ a: 1 })).toBe(1)
    expect(selector.recomputations()).toBe(1)
    expect(selector({ a: 2 })).toBe(2)
    expect(selector.recomputations()).toBe(2)
    selector.resetRecomputations()
    expect(selector.recomputations()).toBe(0)
    expect(selector({ a: 1 })).toBe(1)
    expect(selector({ a: 1 })).toBe(1)
    expect(selector.recomputations()).toBe(1)
    expect(selector({ a: 2 })).toBe(2)
    expect(selector.recomputations()).toBe(2)
  })
  it("export last function as resultFunc", () => {
    const lastFunction = () => {}
    const selector = qx.createSelector((state: StateA) => state.a, lastFunction)
    expect(selector.resultFunc).toBe(lastFunction)
  })
  it("export dependencies as dependencies", () => {
    const dependency1 = (state: StateA) => {
      state.a
    }
    const dependency2 = (state: StateA) => {
      state.a
    }
    const selector = qx.createSelector(dependency1, dependency2, () => {})
    expect(selector.dependencies).toEqual([dependency1, dependency2])
  })
  it("export lastResult function", () => {
    const selector = qx.createSelector(
      (state: StateAB) => state.a,
      (state: StateAB) => state.b,
      (a, b) => a + b
    )
    const result = selector({ a: 1, b: 2 })
    expect(result).toBe(3)
    expect(selector.lastResult()).toBe(3)
  })
})
