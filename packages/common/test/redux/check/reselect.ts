/* eslint-disable no-use-before-define */
import {
  createSelector,
  defaultMemoize,
  defaultEqualityCheck,
  createSelectorCreator,
  createStructuredSelector,
  ParametricSelector,
  OutputSelector,
  SelectorResultArray,
  Selector,
} from "../../../src/redux/reselect.js"
import microMemoize from "micro-memoize"
import memoizeOne from "memoize-one"
import { createSlice, configureStore } from "../../../src/redux/index.js"
import { createApi, fetchBaseQuery } from "../../../src/redux/query/index.js"
import {
  TypedUseSelectorHook,
  useDispatch,
  useSelector,
} from "../../../src/redux/index.js"
export function expectType<T>(t: T): T {
  return t
}
type Exact<A, B> = (<T>() => T extends A ? 1 : 0) extends <T>() => T extends B
  ? 1
  : 0
  ? A extends B
    ? B extends A
      ? unknown
      : never
    : never
  : never
export declare type IsAny<T, True, False = never> = true | false extends (
  T extends never ? true : false
)
  ? True
  : False
export declare type IsUnknown<T, True, False = never> = unknown extends T
  ? IsAny<T, False, True>
  : False
type Equals<T, U> = IsAny<
  T,
  never,
  IsAny<U, never, [T] extends [U] ? ([U] extends [T] ? any : never) : never>
>
export function expectExactType<T>(t: T) {
  return <U extends Equals<T, U>>(u: U) => {}
}
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
export const testExportBasic = createSelector(
  (state: StateA) => state.a,
  a => a
)
export const testExportStructured = createSelectorCreator(
  defaultMemoize,
  (a, b) => typeof a === typeof b
)
function testSelector() {
  type State = { foo: string }
  const selector = createSelector(
    (state: State) => state.foo,
    foo => foo
  )
  const res = selector.resultFunc("test")
  selector.recomputations()
  selector.resetRecomputations()
  const foo: string = selector({ foo: "bar" })
  selector({ foo: "bar" }, { prop: "value" })
  const num: number = selector({ foo: "bar" })
  createSelector(
    (state: { foo: string }) => state.foo,
    (state: { bar: number }) => state.bar,
    (foo, bar) => 1
  )
  const selectorWithUnions = createSelector(
    (state: State, val: string | number) => state.foo,
    (state: State, val: string | number) => val,
    (foo, val) => val
  )
}
function testNestedSelector() {
  type State = { foo: string; bar: number; baz: boolean }
  const selector = createSelector(
    createSelector(
      (state: State) => state.foo,
      (state: State) => state.bar,
      (foo, bar) => ({ foo, bar })
    ),
    (state: State) => state.baz,
    ({ foo, bar }, baz) => {
      const foo1: string = foo
      const foo2: number = foo
      const bar1: number = bar
      const bar2: string = bar
      const baz1: boolean = baz
      const baz2: string = baz
    }
  )
}
function testSelectorAsCombiner() {
  type SubState = { foo: string }
  type State = { bar: SubState }
  const subSelector = createSelector(
    (state: SubState) => state.foo,
    foo => foo
  )
  const selector = createSelector((state: State) => state.bar, subSelector)
  selector({ foo: "" })
  const n: number = selector({ bar: { foo: "" } })
  const s: string = selector({ bar: { foo: "" } })
}
type Component<P> = (props: P) => any
declare function connect<S, P, R>(
  selector: ParametricSelector<S, P, R>
): (component: Component<P & R>) => Component<P>
function testConnect() {
  connect(
    createSelector(
      (state: { foo: string }) => state.foo,
      foo => ({ foo })
    )
  )(props => {
    props.bar
    const foo: string = props.foo
  })
  const selector2 = createSelector(
    (state: { foo: string }) => state.foo,
    (state: { baz: number }, props: { bar: number }) => props.bar,
    (foo, bar) => ({ foo, baz: bar })
  )
  const connected = connect(selector2)(props => {
    const foo: string = props.foo
    const bar: number = props.bar
    const baz: number = props.baz
    props.fizz
  })
  connected({ bar: 42 })
  connected({ bar: 42, baz: 123 })
}
function testInvalidTypeInCombinator() {
  createSelector(
    (state: { foo: string }) => state.foo,
    (foo: number) => foo
  )
  createSelector(
    (state: { foo: string; bar: number; baz: boolean }) => state.foo,
    (state: any) => state.bar,
    (state: any) => state.baz,
    (foo: string, bar: number, baz: boolean, fizz: string) => {}
  )
  createSelector(
    (state: { testString: string }) => state.testString,
    (state: { testNumber: number }) => state.testNumber,
    (state: { testBoolean: boolean }) => state.testBoolean,
    (state: { testString: string }) => state.testString,
    (state: { testString: string }) => state.testString,
    (state: { testString: string }) => state.testString,
    (state: { testString: string }) => state.testString,
    (state: { testNumber: string }) => state.testNumber,
    (state: { testStringArray: string[] }) => state.testStringArray,
    (
      foo1: string,
      foo2: number,
      foo3: boolean,
      foo4: string,
      foo5: string,
      foo6: string,
      foo7: string,
      foo8: number,
      foo9: string[]
    ) => {
      return { foo1, foo2, foo3, foo4, foo5, foo6, foo7, foo8, foo9 }
    }
  )
  createSelector(
    [
      (state: { testString: string }) => state.testString,
      (state: { testNumber: number }) => state.testNumber,
      (state: { testBoolean: boolean }) => state.testBoolean,
      (state: { testString: string }) => state.testString,
      (state: { testString: string }) => state.testString,
      (state: { testString: string }) => state.testString,
      (state: { testString: string }) => state.testString,
      (state: { testNumber: string }) => state.testNumber,
      (state: { testStringArray: string[] }) => state.testStringArray,
    ],
    (
      foo1: string,
      foo2: number,
      foo3: boolean,
      foo4: string,
      foo5: string,
      foo6: string,
      foo7: string,
      foo8: number,
      foo9: string[]
    ) => {
      return { foo1, foo2, foo3, foo4, foo5, foo6, foo7, foo8, foo9 }
    }
  )
}
function testParametricSelector() {
  type State = { foo: string }
  type Props = { bar: number }
  const selector1 = createSelector(
    (state: { testString: string }) => state.testString,
    (state: { testNumber: number }) => state.testNumber,
    (state: { testBoolean: boolean }) => state.testBoolean,
    (state: { testString: string }) => state.testString,
    (state: { testString: string }) => state.testString,
    (state: { testString: string }) => state.testString,
    (state: { testString: string }) => state.testString,
    (state: { testString: string }) => state.testString,
    (state: { testStringArray: string[] }) => state.testStringArray,
    (
      foo1: string,
      foo2: number,
      foo3: boolean,
      foo4: string,
      foo5: string,
      foo6: string,
      foo7: string,
      foo8: string,
      foo9: string[]
    ) => {
      return { foo1, foo2, foo3, foo4, foo5, foo6, foo7, foo8, foo9 }
    }
  )
  const res1 = selector1({
    testString: "a",
    testNumber: 42,
    testBoolean: true,
    testStringArray: ["b", "c"],
  })
  const selector = createSelector(
    (state: State) => state.foo,
    (state: State, props: Props) => props.bar,
    (foo, bar) => ({ foo, bar })
  )
  selector({ foo: "fizz" })
  selector({ foo: "fizz" }, { bar: "baz" })
  const ret = selector({ foo: "fizz" }, { bar: 42 })
  const foo: string = ret.foo
  const bar: number = ret.bar
  const selector2 = createSelector(
    (state: State) => state.foo,
    (state: State) => state.foo,
    (state: State) => state.foo,
    (state: State) => state.foo,
    (state: State) => state.foo,
    (state: State, props: Props) => props.bar,
    (foo1, foo2, foo3, foo4, foo5, bar) => ({
      foo1,
      foo2,
      foo3,
      foo4,
      foo5,
      bar,
    })
  )
  selector2({ foo: "fizz" }, { bar: 42 })
  const selector3 = createSelector(
    (s: State) => s.foo,
    (s: State, x: string) => x,
    (s: State, y: number) => y,
    (v, x) => {
      return x + v
    }
  )
  selector3({ foo: "fizz" }, 42)
  const selector4 = createSelector(
    (s: State, val: number) => s.foo,
    (s: State, val: string | number) => val,
    (foo, val) => {
      return val
    }
  )
  selector4({ foo: "fizz" }, 42)
}
function testArrayArgument() {
  const selector = createSelector(
    [
      (state: { foo: string }) => state.foo,
      (state: { foo: string }) => state.foo,
      (state: { foo: string }, props: { bar: number }) => props.bar,
    ],
    (foo1, foo2, bar) => ({ foo1, foo2, bar })
  )
  const ret = selector({ foo: "fizz" }, { bar: 42 })
  const foo1: string = ret.foo1
  const foo2: string = ret.foo2
  const bar: number = ret.bar
  createSelector([(state: { foo: string }) => state.foo])
  createSelector(
    [
      (state: { foo: string }) => state.foo,
      (state: { foo: string }) => state.foo,
    ],
    (foo: string, bar: number) => {}
  )
  createSelector(
    [
      (state: { foo: string }) => state.foo,
      (state: { foo: string }) => state.foo,
      (state: { foo: string }) => state.foo,
      (state: { foo: string }) => state.foo,
      (state: { foo: string }) => state.foo,
      (state: { foo: string }) => state.foo,
      (state: { foo: string }) => state.foo,
      (state: { foo: string }) => state.foo,
      (state: { foo: string }) => state.foo,
      (state: { foo: string }) => state.foo,
    ],
    (
      foo1: string,
      foo2: string,
      foo3: string,
      foo4: string,
      foo5: string,
      foo6: string,
      foo7: string,
      foo8: string,
      foo9: string,
      foo10: string
    ) => {}
  )
  createSelector(
    [
      (state: { foo: string }) => state.foo,
      (state: { foo: string }) => state.foo,
      (state: { foo: string }) => state.foo,
      (state: { foo: string }) => state.foo,
      (state: { foo: string }) => state.foo,
      (state: { foo: string }) => state.foo,
      (state: { foo: string }) => state.foo,
      (state: { foo: string }) => state.foo,
      (state: { foo: string }) => state.foo,
      (state: { foo: string }) => state.foo,
    ],
    (foo1, foo2, foo3, foo4, foo5, foo6, foo7, foo8: number, foo9, foo10) => {}
  )
  createSelector(
    [
      (state: { foo: string }) => state.foo,
      state => state.foo,
      state => state.foo,
      state => state.foo,
      state => state.foo,
      state => state.foo,
      state => state.foo,
      state => state.foo,
      1,
    ],
    (foo1, foo2, foo3, foo4, foo5, foo6, foo7, foo8, foo9) => {}
  )
  const selector2 = createSelector(
    [
      (state: { foo: string }) => state.foo,
      (state: { foo: string }) => state.foo,
      (state: { foo: string }) => state.foo,
      (state: { foo: string }) => state.foo,
      (state: { foo: string }) => state.foo,
      (state: { foo: string }) => state.foo,
      (state: { foo: string }) => state.foo,
      (state: { foo: string }) => state.foo,
      (state: { foo: string }) => state.foo,
    ],
    (
      foo1: string,
      foo2: string,
      foo3: string,
      foo4: string,
      foo5: string,
      foo6: string,
      foo7: string,
      foo8: string,
      foo9: string
    ) => {
      return { foo1, foo2, foo3, foo4, foo5, foo6, foo7, foo8, foo9 }
    }
  )
  {
    const ret = selector2({ foo: "fizz" })
    const foo1: string = ret.foo1
    const foo2: string = ret.foo2
    const foo3: string = ret.foo3
    const foo4: string = ret.foo4
    const foo5: string = ret.foo5
    const foo6: string = ret.foo6
    const foo7: string = ret.foo7
    const foo8: string = ret.foo8
    const foo9: string = ret.foo9
    ret.foo10
  }
  selector2({ foo: "fizz" }, { bar: 42 })
  const parametric = createSelector(
    [
      (state: { foo: string }, props: { bar: number }) => props.bar,
      (state: { foo: string }) => state.foo,
      (state: { foo: string }) => state.foo,
      (state: { foo: string }) => state.foo,
      (state: { foo: string }) => state.foo,
      (state: { foo: string }) => state.foo,
      (state: { foo: string }) => state.foo,
      (state: { foo: string }) => state.foo,
      (state: { foo: string }) => state.foo,
    ],
    (
      bar: number,
      foo1: string,
      foo2: string,
      foo3: string,
      foo4: string,
      foo5: string,
      foo6: string,
      foo7: string,
      foo8: string
    ) => {
      return { foo1, foo2, foo3, foo4, foo5, foo6, foo7, foo8, bar }
    }
  )
  const correctlyTypedArraySelector = createSelector(
    [
      (state: { testString: string }) => state.testString,
      (state: { testNumber: number }) => state.testNumber,
      (state: { testBoolean: boolean }) => state.testBoolean,
      (state: { testString: string }) => state.testString,
      (state: { testString: string }) => state.testString,
      (state: { testString: string }) => state.testString,
      (state: { testString: string }) => state.testString,
      (state: { testString: string }) => state.testString,
      (state: { testStringArray: string[] }) => state.testStringArray,
    ],
    (
      foo1: string,
      foo2: number,
      foo3: boolean,
      foo4: string,
      foo5: string,
      foo6: string,
      foo7: string,
      foo8: string,
      foo9: string[]
    ) => {
      return { foo1, foo2, foo3, foo4, foo5, foo6, foo7, foo8, foo9 }
    }
  )
  parametric({ foo: "fizz" })
  {
    const ret = parametric({ foo: "fizz" }, { bar: 42 })
    const foo1: string = ret.foo1
    const foo2: string = ret.foo2
    const foo3: string = ret.foo3
    const foo4: string = ret.foo4
    const foo5: string = ret.foo5
    const foo6: string = ret.foo6
    const foo7: string = ret.foo7
    const foo8: string = ret.foo8
    const bar: number = ret.bar
    ret.foo9
  }
}
function testOptionalArgumentsConflicting() {
  type State = { foo: string; bar: number; baz: boolean }
  const selector = createSelector(
    (state: State) => state.baz,
    (state: State, arg: string) => arg,
    (state: State, arg: number) => arg,
    baz => {
      const baz1: boolean = baz
      const baz2: number = baz
    }
  )
  selector({} as State)
  selector({} as State, "string")
  selector({} as State, 1)
  const selector2 = createSelector(
    (state: State, prefix: any) => prefix + state.foo,
    str => str
  )
  selector2({} as State)
  selector2({} as State, "blach")
  selector2({} as State, 1)
  const selector3 = createSelector(
    (state: State, prefix?: any) => prefix + state.foo,
    str => str
  )
  selector3({} as State)
  selector3({} as State, 1)
  selector3({} as State, "blach")
  const selector4 = createSelector(
    (state: State, prefix: string, suffix: any) =>
      prefix + state.foo + String(suffix),
    str => str
  )
  selector4({} as State)
  selector4({} as State, "blach")
  selector4({} as State, "blach", 4)
  const selector5 = createSelector(
    (state: State, prefix: string, suffix: unknown) =>
      prefix + state.foo + String(suffix),
    str => str
  )
  selector5({} as State)
  selector5({} as State, "blach")
  selector5({} as State, "blach", 4)
  const selector6 = createSelector(
    (state: State, prefix = "") => prefix + state.foo,
    (str: string) => str
  )
  selector6({} as State)
  selector6({} as State, "blach")
  selector6({} as State, 1)
  const selector7 = createSelector(
    (state: State, prefix: string = "a") => prefix + state.foo,
    (str: string) => str
  )
  selector7({} as State)
  selector7({} as State, "blach")
  selector7({} as State, 1)
  const selector8 = createSelector(
    (state: State, prefix: unknown) => prefix,
    str => str
  )
  selector8({} as State)
  selector8({} as State, "blach")
  selector8({} as State, 2)
}
function testDefaultMemoize() {
  const func = (a: string) => +a
  const memoized = defaultMemoize(func)
  const ret0: number = memoized("42")
  const ret1: string = memoized("42")
  const memoized2 = defaultMemoize(
    (str: string, arr: string[]): { str: string; arr: string[] } => ({
      str,
      arr,
    }),
    <T>(a: T, b: T) => {
      return `${a}` === `${b}`
    }
  )
  const ret2 = memoized2("", ["1", "2"])
  const str: string = ret2.str
  const arr: string[] = ret2.arr
}
function testCreateSelectorCreator() {
  const defaultCreateSelector = createSelectorCreator(defaultMemoize)
  const selector = defaultCreateSelector(
    (state: { foo: string }) => state.foo,
    foo => foo
  )
  const value: string = selector({ foo: "fizz" })
  selector({ foo: "fizz" }, { bar: 42 })
  selector.clearCache()
  const parametric = defaultCreateSelector(
    (state: { foo: string }) => state.foo,
    (state: { foo: string }, props: { bar: number }) => props.bar,
    (foo, bar) => ({ foo, bar })
  )
  parametric({ foo: "fizz" })
  const ret = parametric({ foo: "fizz" }, { bar: 42 })
  const foo: string = ret.foo
  const bar: number = ret.bar
  createSelectorCreator(defaultMemoize, 1)
  createSelectorCreator(defaultMemoize, <T>(a: T, b: T) => {
    return `${a}` === `${b}`
  })
}
function testCreateStructuredSelector() {
  const oneParamSelector = createStructuredSelector({
    foo: (state: StateAB) => state.a,
    bar: (state: StateAB) => state.b,
  })
  const threeParamSelector = createStructuredSelector({
    foo: (state: StateAB, c: number, d: string) => state.a,
    bar: (state: StateAB, c: number, d: string) => state.b,
  })
  const selector = createStructuredSelector<
    { foo: string },
    {
      foo: string
      bar: number
    }
  >({
    foo: state => state.foo,
    bar: state => +state.foo,
  })
  const res1 = selector({ foo: "42" })
  const foo: string = res1.foo
  const bar: number = res1.bar
  selector({ bar: "42" })
  selector({ foo: "42" }, { bar: 42 })
  createStructuredSelector<{ foo: string }, { bar: number }>({
    bar: (state: { baz: boolean }) => 1,
  })
  createStructuredSelector<{ foo: string }, { bar: number }>({
    bar: state => state.foo,
  })
  createStructuredSelector<{ foo: string }, { bar: number }>({
    baz: state => state.foo,
  })
  type State = { foo: string }
  const FooSelector = (state: State, a: number, b: string) => state.foo
  const BarSelector = (state: State, a: number, b: string) => +state.foo
  const selector2 = createStructuredSelector({
    foo: FooSelector,
    bar: BarSelector,
  })
  const selectorGenerics = createStructuredSelector<{
    foo: typeof FooSelector
    bar: typeof BarSelector
  }>({
    foo: state => state.foo,
    bar: state => +state.foo,
  })
  type ExpectedResult = {
    foo: string
    bar: number
  }
  const resOneParam = oneParamSelector({ a: 1, b: 2 })
  const resThreeParams = threeParamSelector({ a: 1, b: 2 }, 99, "blah")
  const res2: ExpectedResult = selector({ foo: "42" })
  const res3: ExpectedResult = selector2({ foo: "42" }, 99, "test")
  const resGenerics: ExpectedResult = selectorGenerics(
    { foo: "42" },
    99,
    "test"
  )
  selector2({ bar: "42" })
  selectorGenerics({ bar: "42" })
}
function testDynamicArrayArgument() {
  interface Elem {
    val1: string
    val2: string
  }
  const data: ReadonlyArray<Elem> = [
    { val1: "a", val2: "aa" },
    { val1: "b", val2: "bb" },
  ]
  createSelector(
    data.map(obj => () => obj.val1),
    (...vals) => vals.join(",")
  )
  createSelector(
    data.map(obj => () => obj.val1),
    vals => vals.join(",")
  )
  createSelector(
    data.map(obj => () => obj.val1),
    (...vals: string[]) => 0
  )
  createSelector(
    data.map(obj => () => obj.val1),
    (...vals: number[]) => 0
  )
  const s = createSelector(
    data.map(obj => (state: StateA, fld: keyof Elem) => obj[fld]),
    (...vals) => vals.join(",")
  )
  s({ a: 42 }, "val1")
  s({ a: 42 }, "val2")
  s({ a: 42 }, "val3")
}
function testStructuredSelectorTypeParams() {
  type GlobalState = {
    foo: string
    bar: number
  }
  const selectFoo = (state: GlobalState) => state.foo
  const selectBar = (state: GlobalState) => state.bar
  createStructuredSelector<GlobalState>({
    foo: selectFoo,
  })
  createStructuredSelector<GlobalState>({
    foo: selectFoo,
    bar: selectBar,
  })
  createStructuredSelector<GlobalState, Omit<GlobalState, "bar">>({
    foo: selectFoo,
  })
}
function multiArgMemoize<F extends (...args: any[]) => any>(
  func: F,
  a: number,
  b: string,
  equalityCheck = defaultEqualityCheck
): F {
  return () => {}
}
import { isEqual, groupBy } from "lodash"
import { GetStateFromSelectors } from "../src/types"
{
  interface Transaction {
    transactionId: string
  }
  const toId = (transaction: Transaction) => transaction.transactionId
  const transactionsIds = (transactions: Transaction[]) =>
    transactions.map(toId)
  const collectionsEqual = (ts1: Transaction[], ts2: Transaction[]) =>
    isEqual(transactionsIds(ts1), transactionsIds(ts2))
  const createTransactionsSelector = createSelectorCreator(
    defaultMemoize,
    collectionsEqual
  )
  const createMultiMemoizeArgSelector = createSelectorCreator(
    multiArgMemoize,
    42,
    "abcd",
    defaultEqualityCheck
  )
  const select = createMultiMemoizeArgSelector(
    (state: { foo: string }) => state.foo,
    foo => foo + "!"
  )
  select.clearCache()
  const createMultiMemoizeArgSelector2 = createSelectorCreator(
    multiArgMemoize,
    42,
    defaultEqualityCheck
  )
  const groupTransactionsByLabel = defaultMemoize(
    (transactions: Transaction[]) =>
      groupBy(transactions, item => item.transactionId),
    collectionsEqual
  )
}
function issue445() {
  interface TestState {
    someNumber: number | null
    someString: string | null
  }
  interface Object1 {
    str: string
  }
  interface Object2 {
    num: number
  }
  const getNumber = (state: TestState) => state.someNumber
  const getString = (state: TestState) => state.someString
  function generateObject1(str: string): Object1 {
    return {
      str,
    }
  }
  function generateObject2(num: number): Object2 {
    return {
      num,
    }
  }
  function generateComplexObject(
    num: number,
    subObject: Object1,
    subObject2: Object2
  ): boolean {
    return true
  }
  const getObject1 = createSelector([getString], generateObject1)
  const getObject2 = createSelector([getNumber], generateObject2)
  const getComplexObjectTest1 = createSelector(
    [getObject1],
    generateComplexObject
  )
  const getComplexObjectTest2 = createSelector(
    [getNumber, getObject1],
    generateComplexObject
  )
  const getComplexObjectTest3 = createSelector(
    [getNumber, getObject1, getObject2],
    generateComplexObject
  )
  const getComplexObjectTest4 = createSelector(
    [getObject1, getNumber, getObject2],
    generateComplexObject
  )
  const getVerboseObject1 = createSelector([getString], str =>
    generateObject1(str)
  )
  const getVerboseObject2 = createSelector([getNumber], num =>
    generateObject2(num)
  )
  const getVerboseComplexObjectTest1 = createSelector([getObject1], obj1 =>
    generateComplexObject(obj1)
  )
  const getVerboseComplexObjectTest2 = createSelector(
    [getNumber, getObject1],
    (num, obj1) => generateComplexObject(num, obj1)
  )
  const getVerboseComplexObjectTest3 = createSelector(
    [getNumber, getObject1, getObject2],
    (num, obj1, obj2) => generateComplexObject(num, obj1, obj2)
  )
  const getVerboseComplexObjectTest4 = createSelector(
    [getObject1, getNumber, getObject2],
    (num, obj1, obj2) => generateComplexObject(num, obj1, obj2)
  )
}
function issue492() {
  const fooPropSelector = (_: {}, ownProps: { foo: string }) => ownProps.foo
  const fooBarPropsSelector = (
    _: {},
    ownProps: { foo: string; bar: string }
  ) => [ownProps.foo, ownProps.bar]
  const combinedSelector = createSelector(
    fooPropSelector,
    fooBarPropsSelector,
    (foo, fooBar) => fooBar
  )
}
function customMemoizationOptionTypes() {
  const customMemoize = (
    f: (...args: any[]) => any,
    a: string,
    b: number,
    c: boolean
  ) => {
    return f
  }
  const customSelectorCreatorCustomMemoizeWorking = createSelectorCreator(
    customMemoize,
    "a",
    42,
    true
  )
  const customSelectorCreatorCustomMemoizeMissingArg = createSelectorCreator(
    customMemoize,
    "a",
    true
  )
}
function createSelectorConfigOptions() {
  const defaultMemoizeAcceptsFirstArgDirectly = createSelector(
    (state: StateAB) => state.a,
    (state: StateAB) => state.b,
    (a, b) => a + b,
    {
      memoizeOptions: (a, b) => a === b,
    }
  )
  const defaultMemoizeAcceptsFirstArgAsObject = createSelector(
    (state: StateAB) => state.a,
    (state: StateAB) => state.b,
    (a, b) => a + b,
    {
      memoizeOptions: {
        equalityCheck: (a, b) => a === b,
      },
    }
  )
  const defaultMemoizeAcceptsArgsAsArray = createSelector(
    (state: StateAB) => state.a,
    (state: StateAB) => state.b,
    (a, b) => a + b,
    {
      memoizeOptions: [(a, b) => a === b],
    }
  )
  const customSelectorCreatorMicroMemoize = createSelectorCreator(
    microMemoize,
    {
      maxSize: 42,
    }
  )
  customSelectorCreatorMicroMemoize(
    (state: StateAB) => state.a,
    (state: StateAB) => state.b,
    (a, b) => a + b,
    {
      memoizeOptions: [
        {
          maxSize: 42,
        },
      ],
    }
  )
  const customSelectorCreatorMemoizeOne = createSelectorCreator(memoizeOne)
  customSelectorCreatorMemoizeOne(
    (state: StateAB) => state.a,
    (state: StateAB) => state.b,
    (a, b) => a + b,
    {
      memoizeOptions: (a, b) => a === b,
    }
  )
}
const withLotsOfInputSelectors = createSelector(
  (_state: StateA) => 1,
  (_state: StateA) => 2,
  (_state: StateA) => 3,
  (_state: StateA) => 4,
  (_state: StateA) => 5,
  (_state: StateA) => 6,
  (_state: StateA) => 7,
  (_state: StateA) => 8,
  (_state: StateA) => 9,
  (_state: StateA) => 10,
  (_state: StateA) => 11,
  (_state: StateA) => 12,
  (_state: StateA) => 13,
  (_state: StateA) => 14,
  (_state: StateA) => 15,
  (_state: StateA) => 16,
  (_state: StateA) => 17,
  (_state: StateA) => 18,
  (_state: StateA) => 19,
  (_state: StateA) => 20,
  (_state: StateA) => 21,
  (_state: StateA) => 22,
  (_state: StateA) => 23,
  (_state: StateA) => 24,
  (_state: StateA) => 25,
  (_state: StateA) => 26,
  (_state: StateA) => 27,
  (_state: StateA) => 28,
  (...args) => args.length
)
type SelectorArray29 = [
  (_state: StateA) => 1,
  (_state: StateA) => 2,
  (_state: StateA) => 3,
  (_state: StateA) => 4,
  (_state: StateA) => 5,
  (_state: StateA) => 6,
  (_state: StateA) => 7,
  (_state: StateA) => 8,
  (_state: StateA) => 9,
  (_state: StateA) => 10,
  (_state: StateA) => 11,
  (_state: StateA) => 12,
  (_state: StateA) => 13,
  (_state: StateA) => 14,
  (_state: StateA) => 15,
  (_state: StateA) => 16,
  (_state: StateA) => 17,
  (_state: StateA) => 18,
  (_state: StateA) => 19,
  (_state: StateA) => 20,
  (_state: StateA) => 21,
  (_state: StateA) => 22,
  (_state: StateA) => 23,
  (_state: StateA) => 24,
  (_state: StateA) => 25,
  (_state: StateA) => 26,
  (_state: StateA) => 27,
  (_state: StateA) => 28,
  (_state: StateA) => 29
]
type Results = SelectorResultArray<SelectorArray29>
type State = GetStateFromSelectors<SelectorArray29>
{
  const input1 = (state: string) => 1
  const input2 = (state: number) => 2
  const selector = createSelector(input1, input2, (...args) => 0)
  selector("foo")
  selector(5)
}
{
  const selector = createSelector(
    (state: { foo: string }) => 1,
    (state: { bar: string }) => 2,
    (...args) => 0
  )
  selector({ foo: "", bar: "" })
  selector({ foo: "" })
  selector({ bar: "" })
}
{
  const selector = createSelector(
    (state: { foo: string }) => 1,
    (state: { foo: string }) => 2,
    (...args) => 0
  )
  selector({ foo: "", bar: "" })
  selector({ foo: "" })
  selector({ bar: "" })
}
function testInputSelectorWithUndefinedReturn() {
  type Input = { field: number | undefined }
  type Output = string
  type SelectorType = (input: Input) => Output
  const input = ({ field }: Input) => field
  const result = (out: number | undefined): Output => "test"
  const selector: SelectorType = createSelector(
    ({ field }: Input) => field,
    args => "test"
  )
  const selector2: SelectorType = createSelector(
    ({ field }: Input) => field,
    args => "test",
    { memoizeOptions: { maxSize: 42 } }
  )
  const selector3: SelectorType = createSelector(input, result)
  const selector4: SelectorType = createSelector(input, result, {
    memoizeOptions: { maxSize: 42 },
  })
}
function deepNesting() {
  type State = { foo: string }
  const readOne = (state: State) => state.foo
  const selector0 = createSelector(readOne, one => one)
  const selector1 = createSelector(selector0, s => s)
  const selector2 = createSelector(selector1, s => s)
  const selector3 = createSelector(selector2, s => s)
  const selector4 = createSelector(selector3, s => s)
  const selector5 = createSelector(selector4, s => s)
  const selector6 = createSelector(selector5, s => s)
  const selector7 = createSelector(selector6, s => s)
  const selector8: Selector<State, string, never> = createSelector(
    selector7,
    s => s
  )
  const selector9 = createSelector(selector8, s => s)
  const selector10 = createSelector(selector9, s => s)
  const selector11 = createSelector(selector10, s => s)
  const selector12 = createSelector(selector11, s => s)
  const selector13 = createSelector(selector12, s => s)
  const selector14 = createSelector(selector13, s => s)
  const selector15 = createSelector(selector14, s => s)
  const selector16 = createSelector(selector15, s => s)
  const selector17: OutputSelector<
    [(state: State) => string],
    ReturnType<typeof selector16>,
    (s: string) => string,
    never
  > = createSelector(selector16, s => s)
  const selector18 = createSelector(selector17, s => s)
  const selector19 = createSelector(selector18, s => s)
  const selector20 = createSelector(selector19, s => s)
  const selector21 = createSelector(selector20, s => s)
  const selector22 = createSelector(selector21, s => s)
  const selector23 = createSelector(selector22, s => s)
  const selector24 = createSelector(selector23, s => s)
  const selector25 = createSelector(selector24, s => s)
  const selector26: Selector<
    typeof selector25 extends Selector<infer S> ? S : never,
    ReturnType<typeof selector25>,
    never
  > = createSelector(selector25, s => s)
  const selector27 = createSelector(selector26, s => s)
  const selector28 = createSelector(selector27, s => s)
  const selector29 = createSelector(selector28, s => s)
}
function issue540() {
  const input1 = (
    _: StateA,
    { testNumber }: { testNumber: number },
    c: number,
    d: string
  ) => testNumber
  const input2 = (
    _: StateA,
    { testString }: { testString: string },
    c: number | string
  ) => testString
  const input3 = (
    _: StateA,
    { testBoolean }: { testBoolean: boolean },
    c: number | string,
    d: string
  ) => testBoolean
  const input4 = (_: StateA, { testString2 }: { testString2: string }) =>
    testString2
  const testSelector = createSelector(
    input1,
    input2,
    input3,
    input4,
    (testNumber, testString, testBoolean) => testNumber + testString
  )
  const state: StateA = { a: 42 }
  const test = testSelector(
    state,
    { testNumber: 1, testString: "10", testBoolean: true, testString2: "blah" },
    42,
    "blah"
  )
  const selectProp1 = createSelector(
    [
      (state: StateA) => state,
      (state: StateA, props: { prop1: number }) => props,
    ],
    (state, { prop1 }) => [state, prop1]
  )
  const selectProp2 = createSelector(
    [selectProp1, (state, props: { prop2: number }) => props],
    (state, { prop2 }) => [state, prop2]
  )
  selectProp1({ a: 42 }, { prop1: 1 })
  selectProp2({ a: 42 }, { prop2: 2 })
}
function issue548() {
  interface State {
    value: Record<string, any> | null
    loading: boolean
  }
  interface Props {
    currency: string
  }
  const isLoading = createSelector(
    (state: State) => state,
    (_: State, props: Props) => props.currency,
    ({ loading }, currency) => loading
  )
  const mapData = createStructuredSelector({
    isLoading,
    test2: (state: State) => 42,
  })
  const result = mapData({ value: null, loading: false }, { currency: "EUR" })
}
function issue550() {
  const some = createSelector(
    (a: number) => a,
    (_a: number, b: number) => b,
    (a, b) => a + b
  )
  const test = some(1, 2)
}
function rtkIssue1750() {
  const slice = createSlice({
    name: "test",
    initialState: 0,
    reducers: {},
  })
  interface Pokemon {
    name: string
  }
  const pokemonApi = createApi({
    reducerPath: "pokemonApi",
    baseQuery: fetchBaseQuery({ baseUrl: "https://pokeapi.co/api/v2/" }),
    endpoints: builder => ({
      getPokemonByName: builder.query<Pokemon, string>({
        query: name => `pokemon/${name}`,
      }),
    }),
  })
  const store = configureStore({
    reducer: {
      test: slice.reducer,
      [pokemonApi.reducerPath]: pokemonApi.reducer,
    },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware().concat(pokemonApi.middleware),
  })
  type RootState = ReturnType<typeof store.getState>
  const selectTest = createSelector(
    (state: RootState) => state.test,
    test => test
  )
  const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
  const testItem = selectTest(store.getState())
  function App() {
    const test = useAppSelector(selectTest)
    return null
  }
}
function handleNestedIncompatTypes() {
  const input1a = (_: StateA, param: { b: number }) => param.b
  const input1b = (_: StateA, param: { b: string }) => param.b
  const testSelector1 = createSelector(input1a, input1b, () => ({}))
  testSelector1({ a: 42 }, { b: 99 }) // should not compile
  const input2a = (_: StateA, param: { b: { c: number } }) => param.b.c
  const input2b = (_: StateA, param: { b: { c: string } }) => param.b.c
  const testSelector2 = createSelector(input2a, input2b, (c1, c2) => {})
  testSelector2({ a: 42 }, { b: { c: 99 } })
}
function issue554a() {
  interface State {
    foo: string
    bar: number
  }
  const initialState: State = {
    foo: "This is Foo",
    bar: 1,
  }
  const getFoo = (state: State) => {
    return state.foo
  }
  getFoo(initialState)
  const getBar = (state: State) => {
    return state.bar
  }
  getBar(initialState)
  const simple = createSelector(getFoo, getBar, (foo, bar) => {
    return `${foo} => ${bar}`
  })
  simple(initialState)
  const firstInput = (_: State, first: string) => first
  const secondInput = (_: State, _first: string, second: number) => second
  const complexOne = createSelector(
    getFoo,
    getBar,
    firstInput,
    (foo, bar, first) => {
      return `${foo} => ${bar} || ${first}`
    }
  )
  complexOne(initialState, "first")
  const complexTwo = createSelector(
    getFoo,
    getBar,
    firstInput,
    secondInput,
    (foo, bar, first, second) => {
      return `${foo} => ${bar} || ${first} and ${second}`
    }
  )
  complexTwo(initialState, "first", "second")
}
function issue554b() {
  interface State {
    counter1: number
    counter2: number
  }
  const selectTest = createSelector(
    (state: State, numberA?: number) => numberA,
    (state: State) => state.counter2,
    (numberA, counter2) => (numberA ? numberA + counter2 : counter2)
  )
  type selectTestParams = Parameters<typeof selectTest>
  const p1: selectTestParams = [{ counter1: 1, counter2: 2 }, 42]
  expectExactType<[State, number?]>(p1)
  const result = selectTest({ counter1: 1, counter2: 2 }, 42)
}
function issue554c() {
  interface State {
    counter1: number
    counter2: number
  }
  const selectTest = createSelector(
    (state: State, numberA?: number) => numberA, // `numberA` is optional
    (state: State) => state.counter2,
    (numberA, counter2) => (numberA ? numberA + counter2 : counter2)
  )
  const value = selectTest({ counter1: 0, counter2: 0 }, "what?")
  const selectTest2 = createSelector(
    (state: State, numberA: number) => numberA, // `numberA` is not optional anymore
    (state: State) => state.counter2,
    (numberA, counter2) => (numberA ? numberA + counter2 : counter2)
  )
  const value2 = selectTest2({ counter1: 0, counter2: 0 }, "what?")
}
function issue555() {
  type IReduxState = {
    ui: {
      x: string
      y: string
    }
  }
  const someSelector1 = createSelector(
    (state: IReduxState, param: "x" | "y" | undefined) =>
      param !== undefined ? state.ui[param] : null,
    (a: string | null) => a
  )
  const someSelector2 = createSelector(
    (state: IReduxState, param?: "x" | "y") =>
      param !== undefined ? state.ui[param] : null,
    (a: string | null) => a
  )
  const someSelector3 = createSelector(
    (state: IReduxState, param: "x" | "y" | null) =>
      param !== null ? state.ui[param] : null,
    (a: string | null) => a
  )
  const state = { ui: { x: "1", y: "2" } }
  const selectorResult1 = someSelector1(state, undefined)
  const selectorResult2 = someSelector2(state, undefined)
  const selectorResult3 = someSelector3(state, null)
}