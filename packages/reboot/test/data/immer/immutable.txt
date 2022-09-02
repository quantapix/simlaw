import {
  castDraft,
  castImmutable,
  Draft,
  enableAllPlugins,
  Immutable,
  original,
  produce,
} from "../../src/data/immer/index.js"

enableAllPlugins()

const toDraft: <T>(value: T) => Draft<T> = x => x as any
const fromDraft: <T>(draft: Draft<T>) => T = x => x as any

test("draft", () => {
  {
    const val: [1, 2] = _
    assert(toDraft(val), val)
    assert(fromDraft(toDraft(val)), val)
  }
  {
    const val: [[1, 2]] = _
    assert(toDraft(val), val)
    assert(fromDraft(toDraft(val)), val)
  }
  {
    let val: [1, 2][][] = _
    const draft: typeof val = _
    val = assert(toDraft(val), draft)
    assert(fromDraft(draft), val)
  }
  {
    let val: ReadonlyArray<ReadonlyArray<[1, 2]>> = _
    const draft: [1, 2][][] = _
    val = assert(toDraft(val), draft)
  }
  {
    const val: string[] = _
    assert(toDraft(val), val)
    assert(fromDraft(toDraft(val)), val)
  }
  {
    const val: [string[]] = _
    assert(toDraft(val), val)
    assert(fromDraft(toDraft(val)), val)
  }
  {
    let val: ReadonlyArray<string> = _
    const draft: string[] = _
    val = assert(toDraft(val), draft)
    fromDraft(draft)
  }
  {
    let val: { readonly a: ReadonlyArray<string> } = _
    const draft: { a: string[] } = _
    val = assert(toDraft(val), draft)
    fromDraft(draft)
  }
  {
    const val: { a: 1 } = _
    assert(toDraft(val), val)
    assert(fromDraft(toDraft(val)), val)
  }
  {
    const val: { a: { b: 1 } } = _
    assert(toDraft(val), val)
    assert(fromDraft(toDraft(val)), val)
  }
  {
    interface Foo {
      a: { b: number }
    }
    const val: Foo = _
    assert(toDraft(val), val)
    assert(fromDraft(toDraft(val)), val)
  }
  {
    interface Foo {
      a: { b: number }
    }
    interface Bar {
      foo: Foo
    }
    const val: Bar = _
    assert(toDraft(val), val)
    assert(fromDraft(toDraft(val)), val)
  }
  {
    let val: { readonly a: 1 } = _
    const draft: { a: 1 } = _
    val = assert(toDraft(val), draft)
  }
  {
    let val: [{ readonly a: 1 }] = _
    const draft: [{ a: 1 }] = _
    val = assert(toDraft(val), draft)
  }
  {
    const val: Function = _
    assert(toDraft(val), val)
    assert(fromDraft(toDraft(val)), val)
  }
  {
    const val: () => void = _
    assert(toDraft(val), val)
    assert(fromDraft(toDraft(val)), val)
  }
  {
    class Foo {
      private test: any
      constructor(public bar: string) {}
    }
    const val: Foo = _
  }
  {
    class Foo {
      private test: any
      constructor(readonly bar: string) {}
    }
    const val: Foo = _
  }
  {
    const val: Map<any, any> = _
    assert(toDraft(val), val)
    assert(fromDraft(toDraft(val)), val)
    const weak: WeakMap<any, any> = _
    assert(toDraft(weak), weak)
    assert(fromDraft(toDraft(weak)), weak)
  }
  {
    const val: ReadonlyMap<any, any> = _
    const draft: Map<any, any> = _
    assert(toDraft(val), draft)
  }
  {
    const val: Set<any> = _
    assert(toDraft(val), val)
    assert(fromDraft(toDraft(val)), val)
    const weak: WeakSet<any> = _
    assert(toDraft(weak), weak)
    assert(fromDraft(toDraft(weak)), weak)
  }
  {
    const val: ReadonlySet<any> = _
    const draft: Set<any> = _
    assert(toDraft(val), draft)
  }
  {
    const val: Promise<any> = _
    assert(toDraft(val), val)
    assert(fromDraft(toDraft(val)), val)
  }
  {
    const val: Date = _
    assert(toDraft(val), val)
    assert(fromDraft(toDraft(val)), val)
  }
  {
    const val: RegExp = _
    assert(toDraft(val), val)
    assert(fromDraft(toDraft(val)), val)
  }
  {
    const val: boolean = _
    assert(toDraft(val), val)
    assert(fromDraft(toDraft(val)), val)
  }
  {
    const val: string = _
    assert(toDraft(val), val)
    assert(fromDraft(toDraft(val)), val)
  }
  {
    const val: any = _
    assert(toDraft(val), val)
    assert(fromDraft(toDraft(val)), val)
  }
  {
    const val: never = _ as never
    assert(toDraft(val), val)
    assert(fromDraft(toDraft(val)), val)
  }
  {
    const val: unknown = _
    assert(toDraft(val), val)
    assert(fromDraft(toDraft(val)), val)
  }
  {
    const val: 1 = _
    assert(toDraft(val), val)
    assert(fromDraft(toDraft(val)), val)
  }
  {
    const val: 1 | 2 | 3 = _
    assert(toDraft(val), val)
    assert(fromDraft(toDraft(val)), val)
  }
  {
    let val: [0] | ReadonlyArray<string> | Readonly<{ a: 1 }> = _
    const draft: [0] | string[] | { a: 1 } = _
    val = assert(toDraft(val), draft)
  }
  {
    const $ = <T>(val: ReadonlyArray<T>) => {
      const draft: Draft<typeof val> = _
      assert(toDraft(val), draft)
    }
  }
  expect(true).toBe(true)
})

test("castDraft", () => {
  type Todo = { readonly done: boolean }
  type State = {
    readonly finishedTodos: ReadonlyArray<Todo>
    readonly unfinishedTodos: ReadonlyArray<Todo>
  }
  function markAllFinished(state: State) {
    produce(state, x => {
      x.finishedTodos = castDraft(state.unfinishedTodos)
    })
  }
})

test("original", () => {
  const base = { users: [{ name: "Richie" }] as const }
  const y = produce(base, x => {
    original(x.users) === base.users
  })
})
test("castDraft preserves a value", () => {
  const x = {}
  expect(castDraft(x)).toBe(x)
})
test("createDraft creates a draft", () => {
  const x = { y: 1 }
  assert(x, _ as Draft<{ y: number }>)
})

test("types are ok", () => {
  {
    const val = _ as Immutable<[string[], 1]>
    assert(val, _ as readonly [ReadonlyArray<string>, 1])
  }
  {
    const val = _ as Immutable<[string, 1][]>
    assert(val, _ as ReadonlyArray<readonly [string, 1]>)
  }
  {
    const val = _ as Immutable<[[string, 1], 1]>
    assert(val, _ as readonly [readonly [string, 1], 1])
  }
  {
    const val = _ as Immutable<string[][]>
    assert(val, _ as ReadonlyArray<ReadonlyArray<string>>)
  }
  {
    const val = _ as Immutable<{ a: [string, 1] }>
    assert(val, _ as { readonly a: readonly [string, 1] })
  }
  {
    const val = _ as Immutable<[{ a: string }, 1]>
    assert(val, _ as readonly [{ readonly a: string }, 1])
  }
  {
    const val = _ as Immutable<{ a: string[] }>
    assert(val, _ as { readonly a: ReadonlyArray<string> })
  }
  {
    const val = _ as Immutable<Array<{ a: string }>>
    assert(val, _ as ReadonlyArray<{ readonly a: string }>)
  }
  {
    const val = _ as Immutable<{ a: { b: string } }>
    assert(val, _ as { readonly a: { readonly b: string } })
  }
  {
    const val = _ as Immutable<Map<string, string>>
    assert(val, _ as ReadonlyMap<string, string>)
  }
  {
    const val = _ as Immutable<ReadonlyMap<string, string>>
    assert(val, _ as ReadonlyMap<string, string>)
  }
  {
    const val = _ as Immutable<Map<{ a: string }, { b: string }>>
    assert(
      val,
      _ as ReadonlyMap<{ readonly a: string }, { readonly b: string }>
    )
  }
  {
    const val = _ as Immutable<Set<string>>
    assert(val, _ as ReadonlySet<string>)
  }
  {
    const val = _ as Immutable<ReadonlySet<string>>
    assert(val, _ as ReadonlySet<string>)
  }
  {
    const val = _ as Immutable<Set<{ a: string }>>
    assert(val, _ as ReadonlySet<{ readonly a: string }>)
  }
  expect(true).toBe(true)
})

test("produce immutable state", () => {
  const someState = {
    todos: [
      {
        done: false,
      },
    ],
  }
  const immutable = castImmutable(produce(someState, _ => {}))
  assert(
    immutable,
    _ as { readonly todos: ReadonlyArray<{ readonly done: boolean }> }
  )
})

test("castImmutable preserves a value", () => {
  const x = {}
  expect(castImmutable(x)).toBe(x)
})
