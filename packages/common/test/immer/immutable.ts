import { assert, _ } from "../../src/spec.js"
import * as qi from "../../src/immer/index.js"

qi.enableAllPlugins()

const toDraft: <T>(x: T) => qi.Draft<T> = x => x as any
const fromDraft: <T>(x: qi.Draft<T>) => T = x => x as any

it("draft", () => {
  {
    const x: [1, 2] = _
    assert(toDraft(x), x)
    assert(fromDraft(toDraft(x)), x)
  }
  {
    const x: [[1, 2]] = _
    assert(toDraft(x), x)
    assert(fromDraft(toDraft(x)), x)
  }
  {
    let x: [1, 2][][] = _
    const y: typeof x = _
    x = assert(toDraft(x), y)
    assert(fromDraft(y), x)
  }
  {
    let x: ReadonlyArray<ReadonlyArray<[1, 2]>> = _
    const y: [1, 2][][] = _
    x = assert(toDraft(x), y)
  }
  {
    const vxl: string[] = _
    assert(toDraft(vxl), vxl)
    assert(fromDraft(toDraft(vxl)), vxl)
  }
  {
    const x: [string[]] = _
    assert(toDraft(x), x)
    assert(fromDraft(toDraft(x)), x)
  }
  {
    let x: ReadonlyArray<string> = _
    const y: string[] = _
    x = assert(toDraft(x), y)
    fromDraft(y)
  }
  {
    let x: { readonly a: ReadonlyArray<string> } = _
    const y: { a: string[] } = _
    x = assert(toDraft(x), y)
    fromDraft(y)
  }
  {
    const x: { a: 1 } = _
    assert(toDraft(x), x)
    assert(fromDraft(toDraft(x)), x)
  }
  {
    const x: { a: { b: 1 } } = _
    assert(toDraft(x), x)
    assert(fromDraft(toDraft(x)), x)
  }
  {
    interface Foo {
      a: { b: number }
    }
    const x: Foo = _
    assert(toDraft(x), x)
    assert(fromDraft(toDraft(x)), x)
  }
  {
    interface Foo {
      a: { b: number }
    }
    interface Bar {
      foo: Foo
    }
    const x: Bar = _
    assert(toDraft(x), x)
    assert(fromDraft(toDraft(x)), x)
  }
  {
    let x: { readonly a: 1 } = _
    const y: { a: 1 } = _
    x = assert(toDraft(x), y)
  }
  {
    let x: [{ readonly a: 1 }] = _
    const y: [{ a: 1 }] = _
    x = assert(toDraft(x), y)
  }
  {
    const x: () => void = _
    assert(toDraft(x), x)
    assert(fromDraft(toDraft(x)), x)
  }
  {
    const val: () => void = _
    assert(toDraft(val), val)
    assert(fromDraft(toDraft(val)), val)
  }
  {
    class Foo {
      private test: any
      constructor(public bar: string) {
        this.test
      }
    }
    const x: Foo = _
    x
  }
  {
    class Foo {
      private test: any
      constructor(readonly bar: string) {
        this.test
      }
    }
    const x: Foo = _
    x
  }
  {
    const x: Map<any, any> = _
    assert(toDraft(x), x)
    assert(fromDraft(toDraft(x)), x)
    const x2: WeakMap<any, any> = _
    assert(toDraft(x2), x2)
    assert(fromDraft(toDraft(x2)), x2)
  }
  {
    const x: ReadonlyMap<any, any> = _
    const y: Map<any, any> = _
    assert(toDraft(x), y)
  }
  {
    const x: Set<any> = _
    assert(toDraft(x), x)
    assert(fromDraft(toDraft(x)), x)
    const x2: WeakSet<any> = _
    assert(toDraft(x2), x2)
    assert(fromDraft(toDraft(x2)), x2)
  }
  {
    const x: ReadonlySet<any> = _
    const y: Set<any> = _
    assert(toDraft(x), y)
  }
  {
    const x: Promise<any> = _
    assert(toDraft(x), x)
    assert(fromDraft(toDraft(x)), x)
  }
  {
    const x: Date = _
    assert(toDraft(x), x)
    assert(fromDraft(toDraft(x)), x)
  }
  {
    const x: RegExp = _
    assert(toDraft(x), x)
    assert(fromDraft(toDraft(x)), x)
  }
  {
    const x: boolean = _
    assert(toDraft(x), x)
    assert(fromDraft(toDraft(x)), x)
  }
  {
    const x: string = _
    assert(toDraft(x), x)
    assert(fromDraft(toDraft(x)), x)
  }
  {
    const x: any = _
    assert(toDraft(x), x)
    assert(fromDraft(toDraft(x)), x)
  }
  {
    const x: never = _ as never
    assert(toDraft(x), x)
    assert(fromDraft(toDraft(x)), x)
  }
  {
    const x: unknown = _
    assert(toDraft(x), x)
    assert(fromDraft(toDraft(x)), x)
  }
  {
    const x: 1 = _
    assert(toDraft(x), x)
    assert(fromDraft(toDraft(x)), x)
  }
  {
    const x: 1 | 2 | 3 = _
    assert(toDraft(x), x)
    assert(fromDraft(toDraft(x)), x)
  }
  {
    let x: [0] | ReadonlyArray<string> | Readonly<{ a: 1 }> = _
    const y: [0] | string[] | { a: 1 } = _
    x = assert(toDraft(x), y)
  }
  {
    ;<T>(x: ReadonlyArray<T>) => {
      const y: qi.Draft<typeof x> = _
      assert(toDraft(x), y)
    }
  }
  expect(true).toBe(true)
})

it("castDraft", () => {
  type Todo = { readonly done: boolean }
  type State = {
    readonly finished: ReadonlyArray<Todo>
    readonly unfinished: ReadonlyArray<Todo>
  }
  function markAll(x?: State) {
    if (x)
      qi.produce(x, x2 => {
        x2.finished = qi.castDraft(x.unfinished)
      })
  }
  markAll()
})

it("original", () => {
  const base = { users: [{ name: "Richie" }] as const }
  qi.produce(base, x => {
    qi.original(x.users) === base.users
  })
})
it("castDraft preserves a value", () => {
  const x = {}
  expect(qi.castDraft(x)).toBe(x)
})
it("createDraft creates a draft", () => {
  const x = { y: 1 }
  assert(x, _ as qi.Draft<{ y: number }>)
})

it("types are ok", () => {
  {
    const x = _ as qi.Immutable<[string[], 1]>
    assert(x, _ as readonly [ReadonlyArray<string>, 1])
  }
  {
    const x = _ as qi.Immutable<[string, 1][]>
    assert(x, _ as ReadonlyArray<readonly [string, 1]>)
  }
  {
    const x = _ as qi.Immutable<[[string, 1], 1]>
    assert(x, _ as readonly [readonly [string, 1], 1])
  }
  {
    const x = _ as qi.Immutable<string[][]>
    assert(x, _ as ReadonlyArray<ReadonlyArray<string>>)
  }
  {
    const x = _ as qi.Immutable<{ a: [string, 1] }>
    assert(x, _ as { readonly a: readonly [string, 1] })
  }
  {
    const x = _ as qi.Immutable<[{ a: string }, 1]>
    assert(x, _ as readonly [{ readonly a: string }, 1])
  }
  {
    const x = _ as qi.Immutable<{ a: string[] }>
    assert(x, _ as { readonly a: ReadonlyArray<string> })
  }
  {
    const x = _ as qi.Immutable<Array<{ a: string }>>
    assert(x, _ as ReadonlyArray<{ readonly a: string }>)
  }
  {
    const x = _ as qi.Immutable<{ a: { b: string } }>
    assert(x, _ as { readonly a: { readonly b: string } })
  }
  {
    const x = _ as qi.Immutable<Map<string, string>>
    assert(x, _ as ReadonlyMap<string, string>)
  }
  {
    const x = _ as qi.Immutable<ReadonlyMap<string, string>>
    assert(x, _ as ReadonlyMap<string, string>)
  }
  {
    const x = _ as qi.Immutable<Map<{ a: string }, { b: string }>>
    assert(x, _ as ReadonlyMap<{ readonly a: string }, { readonly b: string }>)
  }
  {
    const x = _ as qi.Immutable<Set<string>>
    assert(x, _ as ReadonlySet<string>)
  }
  {
    const x = _ as qi.Immutable<ReadonlySet<string>>
    assert(x, _ as ReadonlySet<string>)
  }
  {
    const x = _ as qi.Immutable<Set<{ a: string }>>
    assert(x, _ as ReadonlySet<{ readonly a: string }>)
  }
  expect(true).toBe(true)
})

it("produce immutable state", () => {
  const base = {
    todos: [{ done: false }],
  }
  const y = qi.castImmutable(qi.produce(base, _ => {}))
  assert(y, _ as { readonly todos: ReadonlyArray<{ readonly done: boolean }> })
})

it("castImmutable preserves a value", () => {
  const x = {}
  expect(qi.castImmutable(x)).toBe(x)
})
