import { assert, _ } from "spec.ts"
import * as qi from "../../../src/data/immer/index.js"

qi.enableAllPlugins()

interface State {
  readonly num: number
  readonly foo?: string
  bar: string
  readonly baz: {
    readonly x: number
    readonly y: number
  }
  readonly arr: ReadonlyArray<{ readonly value: string }>
  readonly arr2: { readonly value: string }[]
}
const state: State = {
  num: 0,
  bar: "foo",
  baz: {
    x: 1,
    y: 2,
  },
  arr: [{ value: "asdf" }],
  arr2: [{ value: "asdf" }],
}
const expectedState: State = {
  num: 1,
  foo: "bar",
  bar: "foo",
  baz: {
    x: 2,
    y: 3,
  },
  arr: [{ value: "foo" }, { value: "asf" }],
  arr2: [{ value: "foo" }, { value: "asf" }],
}
it("can update readonly state via standard api", () => {
  const newState = qi.produce(state, draft => {
    draft.num++
    draft.foo = "bar"
    draft.bar = "foo"
    draft.baz.x++
    draft.baz.y++
    draft.arr[0]!.value = "foo"
    draft.arr.push({ value: "asf" })
    draft.arr2[0]!.value = "foo"
    draft.arr2.push({ value: "asf" })
  })
  assert(newState, _ as State)
})
it("can infer state type from default state", () => {
  type State = { readonly a: number }
  type Recipe = (state?: State | undefined) => State
  const foo = qi.produce((_: any) => {}, _ as State)
  assert(foo, _ as Recipe)
})
it("can infer state type from recipe function", () => {
  type A = { readonly a: string }
  type B = { readonly b: string }
  type State = A | B
  type Recipe = (state: State) => State
  const foo = qi.produce((draft: State) => {
    assert(draft, _ as State)
    if (Math.random() > 0.5) return { a: "test" }
    else return { b: "boe" }
  })
  const x = foo({ a: "" })
  const y = foo({ b: "" })
  assert(foo, _ as Recipe)
})
it("can infer state type from recipe function with arguments", () => {
  type State = { readonly a: string } | { readonly b: string }
  type Recipe = (state: State, x: number) => State
  const foo = qi.produce<State, [number]>((draft, x) => {
    assert(draft, _ as qi.Draft<State>)
    assert(x, _ as number)
  })
  assert(foo, _ as Recipe)
})
it("can infer state type from recipe function with arguments and initial state", () => {
  type State = { readonly a: string } | { readonly b: string }
  type Recipe = (state: State | undefined, x: number) => State
  const foo = qi.produce((_x: qi.Draft<State>, _n: number) => {}, _ as State)
  assert(foo, _ as Recipe)
})
it("cannot infer state type when the function type and default state are missing", () => {
  type Recipe = <S>(state: S) => S
  const foo = qi.produce((_: any) => {})
  assert(foo, _ as Recipe)
})
it("can update readonly state via curried api", () => {
  const newState = qi.produce((draft: qi.Draft<State>) => {
    draft.num++
    draft.foo = "bar"
    draft.bar = "foo"
    draft.baz.x++
    draft.baz.y++
    draft.arr[0]!.value = "foo"
    draft.arr.push({ value: "asf" })
    draft.arr2[0]!.value = "foo"
    draft.arr2.push({ value: "asf" })
  })(state)
  expect(newState).not.toBe(state)
  expect(newState).toEqual(expectedState)
})
it("can update use the non-default export", () => {
  const newState = qi.produce((draft: qi.Draft<State>) => {
    draft.num++
    draft.foo = "bar"
    draft.bar = "foo"
    draft.baz.x++
    draft.baz.y++
    draft.arr[0]!.value = "foo"
    draft.arr.push({ value: "asf" })
    draft.arr2[0]!.value = "foo"
    draft.arr2.push({ value: "asf" })
  })(state)
  expect(newState).not.toBe(state)
  expect(newState).toEqual(expectedState)
})
it("can apply patches", () => {
  let patches: qi.Patch[] = []
  qi.produce(
    { x: 3 },
    d => {
      d.x++
    },
    p => {
      patches = p
    }
  )
  expect(qi.applyPatches({}, patches)).toEqual({ x: 4 })
})
describe("curried producer", () => {
  it("supports rest parameters", () => {
    type State = { readonly a: 1 }
    {
      type Recipe = (state: State, a: number, b: number) => State
      const foo = qi.produce((_x: State, _a: number, _b: number) => {})
      assert(foo, _ as Recipe)
      foo(_ as State, 1, 2)
    }
    {
      type Recipe = (
        state: qi.Immutable<State>,
        ...rest: number[]
      ) => qi.Draft<State>
      const woo = qi.produce((_x: qi.Draft<State>, ..._xs: number[]) => {})
      assert(woo, _ as Recipe)
      woo(_ as State, 1, 2)
    }
    {
      type Recipe = (x?: State | undefined, ...xs: number[]) => State
      const bar = qi.produce((_x: qi.Draft<State>, ..._xs: number[]) => {},
      _ as State)
      assert(bar, _ as Recipe)
      bar(_ as State, 1, 2)
      bar(_ as State)
      bar()
    }
    {
      type Recipe = (
        state: State | undefined,
        first: string,
        ...rest: number[]
      ) => State
      const tup = qi.produce(
        (_x: qi.Draft<State>, ..._xs: [string, ...number[]]) => {},
        _ as State
      )
      assert(tup, _ as Recipe)
      tup({ a: 1 }, "", 2)
      tup(undefined, "", 2)
    }
  })
  it("can be passed a readonly array", () => {
    {
      const foo = qi.produce((_: string[]) => {})
      assert(foo, _ as (state: readonly string[]) => string[])
      foo([] as ReadonlyArray<string>)
    }
    {
      const bar = qi.produce(() => {}, [] as ReadonlyArray<string>)
      assert(
        bar,
        _ as (state?: readonly string[] | undefined) => readonly string[]
      )
      bar([] as ReadonlyArray<string>)
      bar(undefined)
      bar()
    }
  })
})
it("works with return type of: number", () => {
  const base = { a: 0 } as { a: number }
  {
    if (Math.random() === 100) {
      qi.produce(base, (x: any) => x.a++)
    }
  }
  {
    const result = qi.produce(base, x => void x.a++)
    assert(result, _ as { a: number })
  }
})
it("can return an object type that is identical to the base type", () => {
  const base = { a: 0 } as { a: number }
  const result = qi.produce(base, x => {
    return x.a < 0 ? { a: 0 } : undefined
  })
  assert(result, _ as { a: number })
})
it("can NOT return an object type that is _not_ assignable to the base type", () => {
  const base = { a: 0 } as { a: number }
  qi.produce(base, (x: any) => {
    return x.a < 0 ? { a: true } : undefined
  })
})
it("does not enforce immutability at the type level", () => {
  const y = qi.produce([] as any[], x => {
    x.push(1)
  })
  assert(y, _ as any[])
})
it("can produce an undefined value", () => {
  type State = { readonly a: number } | undefined
  const base = { a: 0 } as State
  const result = qi.produce(base, _ => qi.nothing)
  assert(result, _ as State)
  const result2 = qi.produce(base, draft => {
    if (draft?.a ?? 0 > 0) return qi.nothing
  })
  assert(result2, _ as State)
})
it("can return the draft itself", () => {
  const base = _ as { readonly a: number }
  const result = qi.produce(base, draft => draft)
  assert(result, _ as { readonly a: number })
})
it("can return a promise", () => {
  type Base = { readonly a: number }
  const base = { a: 0 } as Base
  const res1 = qi.produce(base, draft => {
    return Promise.resolve(draft)
  })
  assert(res1, _ as Promise<Base>)
  const res2 = qi.produce(base, draft => {
    return Promise.resolve()
  })
  assert(res2, _ as Promise<Base>)
})
it("works with `void` hack", () => {
  const base = { a: 0 } as { readonly a: number }
  const copy = qi.produce(base, s => void s.a++)
  assert(copy, base)
})
it("works with generic parameters", () => {
  const insert = <T>(array: readonly T[], index: number, elem: T) => {
    return qi.produce(array, (draft: T[]) => {
      draft.push(elem)
      draft.splice(index, 0, elem)
      draft.concat([elem])
    })
  }
  const val: { readonly a: ReadonlyArray<number> } = { a: [] } as any
  const arr: ReadonlyArray<typeof val> = [] as any
  insert(arr, 0, val)
})
it("can work with non-readonly base types", () => {
  const state = {
    price: 10,
    todos: [
      {
        title: "test",
        done: false,
      },
    ],
  }
  type State = typeof state
  const newState = qi.produce(state, draft => {
    draft.price += 5
    draft.todos.push({
      title: "hi",
      done: true,
    })
  })
  assert(newState, _ as State)
  const reducer = (draft: State) => {
    draft.price += 5
    draft.todos.push({
      title: "hi",
      done: true,
    })
  }
  const newState4 = qi.produce(reducer, state)(state)
  assert(newState4, _ as State)
  const newState5 = qi.produce(reducer, state)()
  assert(newState5, _ as State)
  const newState3 = qi.produce(reducer, state as State)()
  assert(newState3, _ as State)
})
it("can work with readonly base types", () => {
  type State = {
    readonly price: number
    readonly todos: readonly {
      readonly title: string
      readonly done: boolean
    }[]
  }
  const state: State = {
    price: 10,
    todos: [
      {
        title: "test",
        done: false,
      },
    ],
  }
  const newState = qi.produce(state, draft => {
    draft.price + 5
    draft.todos.push({
      title: "hi",
      done: true,
    })
  })
  assert(newState, _ as State)
  assert(newState, _ as qi.Immutable<State>)
  const reducer = (draft: qi.Draft<State>) => {
    draft.price += 5
    draft.todos.push({
      title: "hi",
      done: true,
    })
  }
  const newState2: State = qi.produce(reducer)(state)
  assert(newState2, _ as State)
  const newState4 = qi.produce(reducer, state)(state)
  assert(newState4, _ as State)
  const newState5 = qi.produce(reducer, state)()
  assert(newState5, _ as State)
  const newState3 = qi.produce(reducer, state as State)()
  assert(newState3, _ as State)
})
it("works with generic array", () => {
  const append = <T>(queue: T[], item: T) =>
    qi.produce(queue, (queueDraft: T[]) => {
      queueDraft.push(item)
    })
  const queueBefore = [1, 2, 3]
  const queueAfter = append(queueBefore, 4)
  expect(queueAfter).toEqual([1, 2, 3, 4])
  expect(queueBefore).toEqual([1, 2, 3])
})
it("works with Map and Set", () => {
  const m = new Map([["a", { x: 1 }]])
  const s = new Set([{ x: 2 }])
  const res1 = qi.produce(m, draft => {
    assert(draft, _ as Map<string, { x: number }>)
  })
  assert(res1, _ as Map<string, { x: number }>)
  const res2 = qi.produce(s, draft => {
    assert(draft, _ as Set<{ x: number }>)
  })
  assert(res2, _ as Set<{ x: number }>)
})
it("works with readonly Map and Set", () => {
  type S = { readonly x: number }
  const m: ReadonlyMap<string, S> = new Map([["a", { x: 1 }]])
  const s: ReadonlySet<S> = new Set([{ x: 2 }])
  const res1 = qi.produce(m, (draft: qi.Draft<Map<string, S>>) => {
    assert(draft, _ as Map<string, { x: number }>)
  })
  assert(res1, _ as ReadonlyMap<string, { readonly x: number }>)
  const res2 = qi.produce(s, (draft: qi.Draft<Set<S>>) => {
    assert(draft, _ as Set<{ x: number }>)
  })
  assert(res2, _ as ReadonlySet<{ readonly x: number }>)
})
it("works with ReadonlyMap and ReadonlySet", () => {
  type S = { readonly x: number }
  const m: ReadonlyMap<string, S> = new Map([["a", { x: 1 }]])
  const s: ReadonlySet<S> = new Set([{ x: 2 }])
  const res1 = qi.produce(m, (draft: qi.Draft<Map<string, S>>) => {
    assert(draft, _ as Map<string, { x: number }>)
  })
  assert(res1, _ as ReadonlyMap<string, { readonly x: number }>)
  const res2 = qi.produce(s, (draft: qi.Draft<Set<S>>) => {
    assert(draft, _ as Set<{ x: number }>)
  })
  assert(res2, _ as ReadonlySet<{ readonly x: number }>)
})
it("shows error in production if called incorrectly", () => {
  expect(() => {
    qi.produce(null as any)
  }).toThrow(
    (global as any).USES_BUILD
      ? "[Immer] minified error nr: 6"
      : "[Immer] The first or second argument to `produce` must be a function"
  )
})
it("#749 types Immer", () => {
  const t = {
    x: 3,
  }
  const immer = new qi.Immer()
  const z = immer.produce(t, d => {
    d.x++
    d.y = 0
  })
  expect(z.x).toBe(4)
  expect(z.z).toBeUndefined()
})
it("infers draft, #720", () => {
  function nextNumberCalculator(fn: (base: number) => number) {}
  const res2 = nextNumberCalculator(
    qi.produce(draft => {
      const x: string = draft
      return draft + 1
    })
  )
  const res = nextNumberCalculator(
    qi.produce(draft => {
      const x: string = draft
      return undefined
    })
  )
})
it("infers draft, #720 - 2", () => {
  function useState<S>(
    initialState: S | (() => S)
  ): [S, Dispatch<SetStateAction<S>>] {
    return [initialState, function () {}] as any
  }
  type Dispatch<A> = (value: A) => void
  type SetStateAction<S> = S | ((prevState: S) => S)
  const [n, setN] = useState({ x: 3 })
  setN(
    qi.produce(draft => {
      draft.y = 4
      draft.x = 5
      return draft
    })
  )
  setN(
    qi.produce(draft => {
      draft.y = 4
      draft.x = 5
      return undefined
    })
  )
  setN(
    qi.produce(draft => {
      return { y: 3 } as const
    })
  )
})
it("infers draft, #720 - 3", () => {
  function useState<S>(
    initialState: S | (() => S)
  ): [S, Dispatch<SetStateAction<S>>] {
    return [initialState, function () {}] as any
  }
  type Dispatch<A> = (value: A) => void
  type SetStateAction<S> = S | ((prevState: S) => S)
  const [n, setN] = useState({ x: 3 } as { readonly x: number })
  setN(
    qi.produce(draft => {
      draft.y = 4
      draft.x = 5
      return draft
    })
  )
  setN(
    qi.produce(draft => {
      draft.y = 4
      draft.x = 5
      return undefined
    })
  )
  setN(
    qi.produce(draft => {
      return { y: 3 } as const
    })
  )
})
it("infers curried", () => {
  type Todo = { title: string }
  {
    const fn = qi.produce((draft: Todo) => {
      const x: string = draft.title
    })
    fn({ title: "test" })
    fn(3)
  }
  {
    const fn = qi.produce((draft: Todo) => {
      const x: string = draft.title
      return draft
    })
    fn({ title: "test" })
    fn(3)
  }
})
it("infers async curried", async () => {
  type Todo = { title: string }
  {
    const fn = qi.produce(async (draft: Todo) => {
      const x: string = draft.title
    })
    const res = await fn({ title: "test" })
    fn(3)
    assert(res, _ as Todo)
  }
  {
    const fn = qi.produce(async (draft: Todo) => {
      const x: string = draft.title
      return draft
    })
    const res = await fn({ title: "test" })
    fn(3)
    assert(res, _ as Todo)
  }
})
{
  type State = { count: number }
  type ROState = qi.Immutable<State>
  const base: any = { count: 0 }
  {
    const res = qi.produce(base as State, draft => {
      draft.count++
    })
    assert(res, _ as State)
  }
  {
    const res = qi.produce<State>(base, draft => {
      draft.count++
    })
    assert(res, _ as State)
  }
  {
    const res = qi.produce(base as ROState, draft => {
      draft.count++
    })
    assert(res, _ as ROState)
  }
  {
    const f = qi.produce((state: State) => {
      state.count++
    })
    assert(f, _ as (state: qi.Immutable<State>) => State)
  }
  {
    const f = qi.produce((state: qi.Draft<ROState>) => {
      state.count++
    })
    assert(f, _ as (state: ROState) => State)
  }
  {
    const f: (value: State) => State = qi.produce(state => {
      state.count++
    })
  }
  {
    const f: (value: ROState) => ROState = qi.produce(state => {
      state.count++
    })
  }
  {
    const f = qi.produce(state => {
      state.count++
    }, _ as State)
    assert(f, _ as (state?: State) => State)
  }
  {
    const f = qi.produce(state => {
      state.count++
    }, _ as ROState)
    assert(f, _ as (state?: ROState) => ROState)
  }
  {
    const f: (value: State) => State = qi.produce(state => {
      state.count++
    }, base as ROState)
  }
  {
    const f: (value: ROState) => ROState = qi.produce(state => {
      state.count++
    }, base as ROState)
  }
  {
    const res = qi.produce(base as State | undefined, draft => {
      return qi.nothing
    })
    assert(res, _ as State | undefined)
  }
  {
    const res = qi.produce(base as State, draft => {
      return qi.nothing as any
    })
    assert(res, _ as State)
  }
  {
    qi.produce(base as State, draft => {
      return qi.nothing
    })
  }
  {
    const f = qi.produce((draft: State) => {})
    const n = f(base as State)
    assert(n, _ as State)
  }
  {
    const f = qi.produce((draft: qi.Draft<ROState>) => {
      draft.count++
    })
    const n = f(base as ROState)
    assert(n, _ as State)
  }
  {
    const f = qi.produce<ROState>(draft => {
      draft.count++
    })
    const n = f(base as ROState)
    assert(n, _ as ROState)
  }
}
