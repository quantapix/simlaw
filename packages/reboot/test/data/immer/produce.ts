import { assert, _ } from "../../../src/data/spec.js"
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
const base: State = {
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
  const y = qi.produce(base, x => {
    x.num++
    x.foo = "bar"
    x.bar = "foo"
    x.baz.x++
    x.baz.y++
    x.arr[0]!.value = "foo"
    x.arr.push({ value: "asf" })
    x.arr2[0]!.value = "foo"
    x.arr2.push({ value: "asf" })
  })
  assert(y, _ as State)
})
it("can infer state type from default state", () => {
  type State = { readonly a: number }
  type Recipe = (state?: State | undefined) => State
  const y = qi.produce((_: any) => {}, _ as State)
  assert(y, _ as Recipe)
})
it("can infer state type from recipe function", () => {
  type A = { readonly a: string }
  type B = { readonly b: string }
  type State = A | B
  type Recipe = (x: State) => State
  const y = qi.produce((x: State) => {
    assert(x, _ as State)
    if (Math.random() > 0.5) return { a: "test" }
    else return { b: "boe" }
  })
  y({ a: "" })
  y({ b: "" })
  assert(y, _ as Recipe)
})
it("can infer state type from recipe function with arguments", () => {
  type State = { readonly a: string } | { readonly b: string }
  type Recipe = (x: State, n: number) => State
  const y = qi.produce<State, [number]>((x, n) => {
    assert(x, _ as qi.Draft<State>)
    assert(n, _ as number)
  })
  assert(y, _ as Recipe)
})
it("can infer state type from recipe function with arguments and initial state", () => {
  type State = { readonly a: string } | { readonly b: string }
  type Recipe = (x: State | undefined, n: number) => State
  const y = qi.produce((_x: qi.Draft<State>, _n: number) => {}, _ as State)
  assert(y, _ as Recipe)
})
it("cannot infer state type when the function type and default state are missing", () => {
  //type Recipe = <S>(x: S) => S
  //const y = qi.produce((_: any) => {})
  //assert(y, _ as Recipe)
})
it("can update readonly state via curried api", () => {
  const y = qi.produce((x: qi.Draft<State>) => {
    x.num++
    x.foo = "bar"
    x.bar = "foo"
    x.baz.x++
    x.baz.y++
    x.arr[0]!.value = "foo"
    x.arr.push({ value: "asf" })
    x.arr2[0]!.value = "foo"
    x.arr2.push({ value: "asf" })
  })(base)
  expect(y).not.toBe(base)
  expect(y).toEqual(expectedState)
})
it("can update use the non-default export", () => {
  const y = qi.produce((x: qi.Draft<State>) => {
    x.num++
    x.foo = "bar"
    x.bar = "foo"
    x.baz.x++
    x.baz.y++
    x.arr[0]!.value = "foo"
    x.arr.push({ value: "asf" })
    x.arr2[0]!.value = "foo"
    x.arr2.push({ value: "asf" })
  })(base)
  expect(y).not.toBe(base)
  expect(y).toEqual(expectedState)
})
it("can apply patches", () => {
  let ps: qi.Patch[] = []
  qi.produce(
    { x: 3 },
    d => {
      d.x++
    },
    p => {
      ps = p
    }
  )
  expect(qi.applyPatches({}, ps)).toEqual({ x: 4 })
})
describe("curried producer", () => {
  it("supports rest parameters", () => {
    type State = { readonly a: 1 }
    {
      type Recipe = (x: State, a: number, b: number) => State
      const y = qi.produce((_x: State, _a: number, _b: number) => {})
      assert(y, _ as Recipe)
      y(_ as State, 1, 2)
    }
    {
      type Recipe = (x: qi.Immutable<State>, ...xs: number[]) => qi.Draft<State>
      const y = qi.produce((_x: qi.Draft<State>, ..._xs: number[]) => {})
      assert(y, _ as Recipe)
      y(_ as State, 1, 2)
    }
    {
      type Recipe = (x?: State | undefined, ...xs: number[]) => State
      const y = qi.produce((_x: qi.Draft<State>, ..._xs: number[]) => {},
      _ as State)
      assert(y, _ as Recipe)
      y(_ as State, 1, 2)
      y(_ as State)
      y()
    }
    {
      type Recipe = (
        x: State | undefined,
        first: string,
        ...xs: number[]
      ) => State
      const y = qi.produce(
        (_x: qi.Draft<State>, ..._xs: [string, ...number[]]) => {},
        _ as State
      )
      assert(y, _ as Recipe)
      y({ a: 1 }, "", 2)
      y(undefined, "", 2)
    }
  })
  it("can be passed a readonly array", () => {
    {
      const y = qi.produce((_: string[]) => {})
      assert(y, _ as (x: readonly string[]) => string[])
      y([] as ReadonlyArray<string>)
    }
    {
      const y = qi.produce(() => {}, [] as ReadonlyArray<string>)
      assert(y, _ as (x?: readonly string[] | undefined) => readonly string[])
      y([] as ReadonlyArray<string>)
      y(undefined)
      y()
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
    const y = qi.produce(base, x => void x.a++)
    assert(y, _ as { a: number })
  }
})
it("can return an object type that is identical to the base type", () => {
  const base = { a: 0 } as { a: number }
  const y = qi.produce(base, x => {
    return x.a < 0 ? { a: 0 } : undefined
  })
  assert(y, _ as { a: number })
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
  const y = qi.produce(base, _ => qi.nothing)
  assert(y, _ as State)
  const y2 = qi.produce(base, x => {
    if (x?.a ?? 0 > 0) return qi.nothing
    return
  })
  assert(y2, _ as State)
})
it("can return the draft itself", () => {
  const base = _ as { readonly a: number }
  const y = qi.produce(base, x => x)
  assert(y, _ as { readonly a: number })
})
it("can return a promise", () => {
  type Base = { readonly a: number }
  const base = { a: 0 } as Base
  const y = qi.produce(base, x => {
    return Promise.resolve(x)
  })
  assert(y, _ as Promise<Base>)
  const y2 = qi.produce(base, _ => {
    return Promise.resolve()
  })
  assert(y2, _ as Promise<Base>)
})
it("works with `void` hack", () => {
  const base = { a: 0 } as { readonly a: number }
  const y = qi.produce(base, s => void s.a++)
  assert(y, base)
})
it("works with generic parameters", () => {
  const insert = <T>(arr: readonly T[], i: number, e: T) => {
    return qi.produce(arr, (x: T[]) => {
      x.push(e)
      x.splice(i, 0, e)
      x.concat([e])
    })
  }
  const e: { readonly a: ReadonlyArray<number> } = { a: [] } as any
  const arr: ReadonlyArray<typeof e> = [] as any
  insert(arr, 0, e)
})
it("can work with non-readonly base types", () => {
  const base = {
    price: 10,
    todos: [{ title: "test", done: false }],
  }
  type State = typeof base
  const y = qi.produce(base, x => {
    x.price += 5
    x.todos.push({ title: "hi", done: true })
  })
  assert(y, _ as State)
  const reducer = (x: State) => {
    x.price += 5
    x.todos.push({ title: "hi", done: true })
  }
  const y3 = qi.produce(reducer, base as State)()
  assert(y3, _ as State)
  const y4 = qi.produce(reducer, base)(base)
  assert(y4, _ as State)
  const y5 = qi.produce(reducer, base)()
  assert(y5, _ as State)
})
it("can work with readonly base types", () => {
  type State = {
    readonly price: number
    readonly todos: readonly {
      readonly title: string
      readonly done: boolean
    }[]
  }
  const base: State = {
    price: 10,
    todos: [{ title: "test", done: false }],
  }
  const y = qi.produce(base, x => {
    x.price + 5
    x.todos.push({ title: "hi", done: true })
  })
  assert(y, _ as State)
  assert(y, _ as qi.Immutable<State>)
  const reducer = (x: qi.Draft<State>) => {
    x.price += 5
    x.todos.push({ title: "hi", done: true })
  }
  const y2: State = qi.produce(reducer)(base)
  assert(y2, _ as State)
  const y3 = qi.produce(reducer, base as State)()
  assert(y3, _ as State)
  const y4 = qi.produce(reducer, base)(base)
  assert(y4, _ as State)
  const y5 = qi.produce(reducer, base)()
  assert(y5, _ as State)
})
it("works with generic array", () => {
  const append = <T>(xs: T[], x: T) =>
    qi.produce(xs, (xs2: T[]) => {
      xs2.push(x)
    })
  const before = [1, 2, 3]
  const after = append(before, 4)
  expect(after).toEqual([1, 2, 3, 4])
  expect(before).toEqual([1, 2, 3])
})
it("works with Map and Set", () => {
  const m = new Map([["a", { x: 1 }]])
  const s = new Set([{ x: 2 }])
  const y = qi.produce(m, x => {
    assert(x, _ as Map<string, { x: number }>)
  })
  assert(y, _ as Map<string, { x: number }>)
  const y2 = qi.produce(s, x => {
    assert(x, _ as Set<{ x: number }>)
  })
  assert(y2, _ as Set<{ x: number }>)
})
it("works with readonly Map and Set", () => {
  type S = { readonly x: number }
  const m: ReadonlyMap<string, S> = new Map([["a", { x: 1 }]])
  const s: ReadonlySet<S> = new Set([{ x: 2 }])
  const y = qi.produce(m, (x: qi.Draft<Map<string, S>>) => {
    assert(x, _ as Map<string, { x: number }>)
  })
  assert(y, _ as ReadonlyMap<string, { readonly x: number }>)
  const y2 = qi.produce(s, (x: qi.Draft<Set<S>>) => {
    assert(x, _ as Set<{ x: number }>)
  })
  assert(y2, _ as ReadonlySet<{ readonly x: number }>)
})
it("works with ReadonlyMap and ReadonlySet", () => {
  type S = { readonly x: number }
  const m: ReadonlyMap<string, S> = new Map([["a", { x: 1 }]])
  const s: ReadonlySet<S> = new Set([{ x: 2 }])
  const y = qi.produce(m, (x: qi.Draft<Map<string, S>>) => {
    assert(x, _ as Map<string, { x: number }>)
  })
  assert(y, _ as ReadonlyMap<string, { readonly x: number }>)
  const y2 = qi.produce(s, (x: qi.Draft<Set<S>>) => {
    assert(x, _ as Set<{ x: number }>)
  })
  assert(y2, _ as ReadonlySet<{ readonly x: number }>)
})
it("shows error in production if called incorrectly", () => {
  expect(() => {
    qi.produce(null as any)
  }).toThrow(
    "[Immer] The first or second argument to `produce` must be a function"
  )
})
it("#749 types Immer", () => {
  const t = { x: 3 }
  const immer = new qi.Immer()
  const z: any = immer.produce(t, (x: any) => {
    x.x++
    x.y = 0
  })
  expect(z.x).toBe(4)
  expect(z.z).toBeUndefined()
})
it("infers draft, #720", () => {
  function next(_: (x: number) => number) {}
  next(
    qi.produce(x => {
      const a: string = x
      a
      return x + 1
    })
  )
  next(
    qi.produce(x => {
      const a: string = x
      a
      return undefined
    })
  )
})
it("infers draft, #720 - 2", () => {
  function useState<S>(s0: S | (() => S)): [S, Dispatch<SetStateAction<S>>] {
    return [s0, function () {}] as any
  }
  type Dispatch<A> = (x: A) => void
  type SetStateAction<S> = S | ((x: S) => S)
  const [_, setN] = useState({ x: 3 })
  setN(
    qi.produce(x => {
      x.y = 4
      x.x = 5
      return x
    })
  )
  setN(
    qi.produce(x => {
      x.y = 4
      x.x = 5
      return undefined
    })
  )
  setN(
    qi.produce(_ => {
      return { y: 3 } as const
    })
  )
})
it("infers draft, #720 - 3", () => {
  function useState<S>(s0: S | (() => S)): [S, Dispatch<SetStateAction<S>>] {
    return [s0, function () {}] as any
  }
  type Dispatch<A> = (x: A) => void
  type SetStateAction<S> = S | ((x: S) => S)
  const [_, setN] = useState({ x: 3 } as { readonly x: number })
  setN(
    qi.produce(x => {
      x.y = 4
      x.x = 5
      return x
    })
  )
  setN(
    qi.produce(x => {
      x.y = 4
      x.x = 5
      return undefined
    })
  )
  setN(
    qi.produce(_ => {
      return { y: 3 } as const
    })
  )
})
it("infers curried", () => {
  type Todo = { title: string }
  {
    const y = qi.produce((x: Todo) => {
      const a: string = x.title
      a
    })
    y({ title: "test" })
    y(3 as any)
  }
  {
    const y = qi.produce((x: Todo) => {
      const a: string = x.title
      a
      return x
    })
    y({ title: "test" })
    y(3 as any)
  }
})
it("infers async curried", async () => {
  type Todo = { title: string }
  {
    const y = qi.produce(async (x: Todo) => {
      const a: string = x.title
      a
    })
    const res = await y({ title: "test" })
    y(3 as any)
    assert(res, _ as Todo)
  }
  {
    const y = qi.produce(async (x: Todo) => {
      const a: string = x.title
      a
      return x
    })
    const res = await y({ title: "test" })
    y(3 as any)
    assert(res, _ as Todo)
  }
})
{
  type State = { count: number }
  type ROState = qi.Immutable<State>
  const base: any = { count: 0 }
  {
    const y = qi.produce(base as State, x => {
      x.count++
    })
    assert(y, _ as State)
  }
  {
    const y = qi.produce<State>(base, x => {
      x.count++
    })
    assert(y, _ as State)
  }
  {
    const y = qi.produce(base as ROState, x => {
      x.count++
    })
    assert(y, _ as ROState)
  }
  {
    const y = qi.produce((x: State) => {
      x.count++
    })
    assert(y, _ as (x: qi.Immutable<State>) => State)
  }
  {
    const y = qi.produce((x: qi.Draft<ROState>) => {
      x.count++
    })
    assert(y, _ as (x: ROState) => State)
  }
  {
    const y: (x: State) => State = qi.produce(x => {
      x.count++
    })
    y
  }
  {
    const y: (x: ROState) => ROState = qi.produce(x => {
      x.count++
    })
    y
  }
  {
    const y = qi.produce(x => {
      x.count++
    }, _ as State)
    assert(y, _ as (x?: State) => State)
  }
  {
    const y = qi.produce(x => {
      x.count++
    }, _ as ROState)
    assert(y, _ as (x?: ROState) => ROState)
  }
  {
    const y: (x: State) => State = qi.produce(x => {
      x.count++
    }, base as ROState)
    y
  }
  {
    const y: (x: ROState) => ROState = qi.produce(x => {
      x.count++
    }, base as ROState)
    y
  }
  {
    const y = qi.produce(base as State | undefined, _ => {
      return qi.nothing
    })
    assert(y, _ as State | undefined)
  }
  {
    const y = qi.produce(base as State, _ => {
      return qi.nothing as any
    })
    assert(y, _ as State)
  }
  {
    qi.produce(base as State, (_: any) => {
      return qi.nothing
    })
  }
  {
    const y = qi.produce((_: State) => {})
    const n = y(base as State)
    assert(n, _ as State)
  }
  {
    const y = qi.produce((x: qi.Draft<ROState>) => {
      x.count++
    })
    const n = y(base as ROState)
    assert(n, _ as State)
  }
  {
    const y = qi.produce<ROState>(x => {
      x.count++
    })
    const n = y(base as ROState)
    assert(n, _ as ROState)
  }
}
