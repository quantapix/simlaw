import * as qi from "../../../src/data/immer/index.js"

const isProd = process.env["NODE_ENV"] === "production"

jest.setTimeout(1000)
qi.enableAllPlugins()

describe("null", () => {
  const base = null
  it("should return the original without modifications", () => {
    const y = qi.produce(base, () => {})
    expect(y).toBe(base)
  })
})

describe("plugins", () => {
  it("error when using Maps", () => {
    expect(() => {
      qi.produce(new Map(), function () {})
    }).toThrowErrorMatchingSnapshot()
  })
  it("error when using patches - 1", () => {
    expect(() => {
      qi.produce(
        {},
        function () {},
        function () {}
      )
    }).toThrowErrorMatchingSnapshot()
  })
  it("error when using patches - 2", () => {
    expect(() => {
      qi.produceWithPatches({}, function () {})
    }).toThrowErrorMatchingSnapshot()
  })
  it("error when using patches - 3", () => {
    expect(() => {
      qi.applyPatches({}, [])
    }).toThrowErrorMatchingSnapshot()
  })
})

describe("curry", () => {
  beforeAll(() => {})
  it("should check arguments", () => {
    expect(() => qi.produce()).toThrowErrorMatchingSnapshot()
    expect(() => qi.produce({})).toThrowErrorMatchingSnapshot()
    expect(() => qi.produce({}, {})).toThrowErrorMatchingSnapshot()
    expect(() => qi.produce({}, () => {}, [])).toThrowErrorMatchingSnapshot()
  })
  it("should support currying", () => {
    const base = [{}, {}, {}]
    const y = qi.produce((x, i) => {
      x.index = i
    })
    expect(base.map(y)).not.toBe(base)
    expect(base.map(y)).toEqual([{ index: 0 }, { index: 1 }, { index: 2 }])
    expect(base).toEqual([{}, {}, {}])
  })
  it("should support returning new states from curring", () => {
    const y = qi.produce((x, i) => {
      if (!x) return { hello: "world" }
      x.index = i
      return
    })
    expect(y(undefined, 3)).toEqual({ hello: "world" })
    expect(y({}, 3)).toEqual({ index: 3 })
  })
  it("should support passing an initial state as second argument", () => {
    const y = qi.produce(
      (x: any, i) => {
        x.index = i
      },
      { hello: "world" }
    )
    expect(y(undefined, 3)).toEqual({ hello: "world", index: 3 })
    expect(y({}, 3)).toEqual({ index: 3 })
    expect(y()).toEqual({ hello: "world", index: undefined })
  })
  it("can has fun with change detection", () => {
    const y = qi.produce(Object.assign)
    const base = { x: 1, y: 1 }
    expect({ ...base }).not.toBe(base)
    expect(y(base, {})).toBe(base)
    expect(y(base, { y: 1 })).toBe(base)
    expect(y(base, { ...base })).toBe(base)
    expect(y(base, { ...base, y: 2 })).not.toBe(base)
    expect(y(base, { ...base, y: 2 })).toEqual({ x: 1, y: 2 })
    expect(y(base, { z: 3 })).toEqual({ x: 1, y: 1, z: 3 })
    expect(y(base, { y: 1 })).toBe(base)
  })
  it("support currying for produceWithPatches", () => {
    const y = qi.produceWithPatches((x, delta) => {
      x.x += delta
    })
    expect(y({ x: 5 }, 2)).toEqual([
      { x: 7 },
      [{ op: "replace", path: ["x"], value: 7 }],
      [{ op: "replace", path: ["x"], value: 5 }],
    ])
  })
})

describe("current", () => {
  beforeAll(() => {
    qi.setAutoFreeze(true)
  })
  it("must be called on draft", () => {
    expect(() => {
      qi.current({})
    }).toThrowError(
      isProd
        ? "[Immer] minified error nr: 22 '[object Object]'. Find the full error at: https://bit.ly/3cXEKWf"
        : "[Immer] 'current' expects a draft, got: [object Object]"
    )
  })
  it("can handle simple arrays", () => {
    const base = [{ x: 1 }]
    let c
    const y = qi.produce(base, (x: any) => {
      expect(qi.current(x)).toEqual(base)
      x[0].x++
      c = qi.current(x)
      expect(c).toEqual([{ x: 2 }])
      expect(Array.isArray(c))
      x[0].x++
    })
    expect(y).toEqual([{ x: 3 }])
    expect(c).toEqual([{ x: 2 }])
    expect(qi.isDraft(c)).toBe(false)
  })
  it("won't freeze", () => {
    const base = { x: 1 }
    qi.produce(base, x => {
      x.x++
      expect(Object.isFrozen(qi.current(x))).toBe(false)
    })
  })
  it("returns original without changes", () => {
    const base = {}
    qi.produce(base, x => {
      expect(qi.original(x)).toBe(base)
      expect(qi.current(x)).toBe(base)
    })
  })
  it("can handle property additions", () => {
    const base = {}
    qi.produce(base, (x: any) => {
      x.x = true
      const c = qi.current(x)
      expect(c).not.toBe(base)
      expect(c).not.toBe(x)
      expect(c).toEqual({ x: true })
    })
  })
  it("can handle property deletions", () => {
    const base = { x: 1 }
    qi.produce(base, (x: any) => {
      delete x.x
      const c = qi.current(x)
      expect(c).not.toBe(base)
      expect(c).not.toBe(x)
      expect(c).toEqual({})
    })
  })
  it("won't reflect changes over time", () => {
    const base = { x: 1 }
    qi.produce(base, x => {
      x.x++
      const c = qi.current(x)
      expect(c).toEqual({ x: 2 })
      x.x++
      expect(c).toEqual({ x: 2 })
    })
  })
  it("will find drafts inside objects", () => {
    const base = { x: 1, y: { z: 2 }, z: {} }
    qi.produce(base, x => {
      x.y.z++
      x.y = { nested: x.y } as any
      const c = qi.current(x)
      expect(c).toEqual({
        x: 1,
        y: { nested: { z: 3 } },
        z: {},
      })
      expect(qi.isDraft((c.y as any).nested)).toBe(false)
      expect(c.z).toBe(base.z)
      expect((c.y as any).nested).not.toBe((x.y as any).nested)
    })
  })
  it("handles map - 1", () => {
    const base = new Map([["a", { x: 1 }]])
    qi.produce(base, x => {
      expect(qi.current(x)).toBe(base)
      x.delete("a")
      const c = qi.current(x)
      expect(qi.current(x)).not.toBe(base)
      expect(qi.current(x)).not.toBe(x)
      expect(c).toEqual(new Map())
      const obj: any = {}
      x.set("b", obj)
      expect(c).toEqual(new Map())
      expect(qi.current(x)).toEqual(new Map([["b", obj]]))
      expect(c).toBeInstanceOf(Map)
    })
  })
  it("handles map - 2", () => {
    const base = new Map([["a", { x: 1 }]])
    qi.produce(base, x => {
      x.get("a")!.x++
      const c = qi.current(x)
      expect(c).not.toBe(base)
      expect(c).toEqual(new Map([["a", { x: 2 }]]))
      x.get("a")!.x++
      expect(c).toEqual(new Map([["a", { x: 2 }]]))
    })
  })
  it("handles set", () => {
    const base = new Set([1])
    qi.produce(base, x => {
      expect(qi.current(x)).toBe(base)
      x.add(2)
      const c = qi.current(x)
      expect(c).toEqual(new Set([1, 2]))
      expect(c).not.toBe(x)
      expect(c).not.toBe(base)
      x.add(3)
      expect(c).toEqual(new Set([1, 2]))
      expect(c).toBeInstanceOf(Set)
    })
  })
  it("handles simple class", () => {
    class Counter {
      [qi.DRAFTABLE] = true
      current = 0
      inc() {
        this.current++
      }
    }
    const n = new Counter()
    qi.produce(n, x => {
      expect(qi.current(x)).toBe(n)
      x.inc()
      const c = qi.current(x)
      expect(c).not.toBe(x)
      expect(c.current).toBe(1)
      c.inc()
      expect(c.current).toBe(2)
      expect(x.current).toBe(1)
      x.inc()
      x.inc()
      expect(c.current).toBe(2)
      expect(x.current).toBe(3)
      expect(c).toBeInstanceOf(Counter)
    })
  })
})

const { isFrozen } = Object

describe("auto freeze", () => {
  beforeAll(() => {
    qi.setAutoFreeze(true)
  })
  it("never freezes the base state", () => {
    const base = { arr: [1], obj: { a: 1 } }
    const y = qi.produce(base, x => {
      x.arr.push(1)
    })
    expect(isFrozen(base)).toBeFalsy()
    expect(isFrozen(base.arr)).toBeFalsy()
    expect(isFrozen(y)).toBeTruthy()
    expect(isFrozen(y.arr)).toBeTruthy()
  })
  it("freezes reused base state", () => {
    const base = { arr: [1], obj: { a: 1 } }
    const y = qi.produce(base, x => {
      x.arr.push(1)
    })
    expect(y.obj).toBe(base.obj)
    expect(isFrozen(y.obj)).toBeTruthy()
  })
  describe("the result is always auto-frozen when", () => {
    it("the root draft is mutated (and no error is thrown)", () => {
      const base: any = {}
      const y = qi.produce(base, (x: any) => {
        x.a = 1
      })
      expect(y).not.toBe(base)
      expect(isFrozen(y)).toBeTruthy()
    })
    it("a nested draft is mutated (and no error is thrown)", () => {
      const base: { a: any } = { a: {} }
      const y = qi.produce(base, x => {
        x.a.b = 1
      })
      expect(y).not.toBe(base)
      expect(isFrozen(y)).toBeTruthy()
      expect(isFrozen(y.a)).toBeTruthy()
    })
    it("a new object replaces the entire draft", () => {
      const obj = { a: { b: {} } }
      const y: any = qi.produce({}, () => obj)
      expect(y).toBe(obj)
      expect(isFrozen(y)).toBeTruthy()
      expect(isFrozen(y.a)).toBeTruthy()
      expect(isFrozen(y.a.b)).toBeTruthy()
    })
    it("a new object is added to the root draft", () => {
      const base: any = {}
      const y: any = qi.produce(base, (x: any) => {
        x.a = { b: [] }
      })
      expect(y).not.toBe(base)
      expect(isFrozen(y)).toBeTruthy()
      expect(isFrozen(y.a)).toBeTruthy()
      expect(isFrozen(y.b)).toBeTruthy()
    })
    it("a new object is added to a nested draft", () => {
      const base: { a: any } = { a: {} }
      const y = qi.produce(base, x => {
        x.a.b = { c: {} }
      })
      expect(y).not.toBe(base)
      expect(isFrozen(y)).toBeTruthy()
      expect(isFrozen(y.a)).toBeTruthy()
      expect(isFrozen(y.a.b)).toBeTruthy()
      expect(isFrozen(y.a.b.c)).toBeTruthy()
    })
    it("a nested draft is returned", () => {
      const base: { a: any } = { a: {} }
      const y = qi.produce(base, x => x.a)
      expect(y).toBe(base.a)
      expect(isFrozen(y)).toBeTruthy()
    })
    it("the base state is returned", () => {
      const base = {}
      const y = qi.produce(base, () => base)
      expect(y).toBe(base)
      expect(isFrozen(y)).toBeTruthy()
    })
    it("the producer is a no-op", () => {
      const base = { a: {} }
      const y = qi.produce(base, () => {})
      expect(y).toBe(base)
      expect(isFrozen(y)).toBeTruthy()
      expect(isFrozen(y.a)).toBeTruthy()
    })
    it("the root draft is returned", () => {
      const base = { a: {} }
      const y = qi.produce(base, x => x)
      expect(y).toBe(base)
      expect(isFrozen(y)).toBeTruthy()
      expect(isFrozen(y.a)).toBeTruthy()
    })
    it("a new object replaces a primitive base", () => {
      const obj = { a: {} }
      const y: any = qi.produce(null, () => obj)
      expect(y).toBe(obj)
      expect(isFrozen(y)).toBeTruthy()
      expect(isFrozen(y.a)).toBeTruthy()
    })
  })
  it("can handle already frozen trees", () => {
    const a: any = []
    const b: any = { a: a }
    Object.freeze(a)
    Object.freeze(b)
    const y = qi.produce(b, (x: any) => {
      x.c = true
      x.a.push(3)
    })
    expect(y).toEqual({ c: true, a: [3] })
  })
  it("will freeze maps", () => {
    const base = new Map()
    const y = qi.produce(base, x => {
      x.set("a", 1)
    })
    expect(() => y.set("b", 2)).toThrowErrorMatchingSnapshot()
    expect(() => y.clear()).toThrowErrorMatchingSnapshot()
    expect(() => y.delete("b")).toThrowErrorMatchingSnapshot()
    expect(qi.produce(y, x => void x.set("a", 2))).not.toBe(y)
  })
  it("will freeze sets", () => {
    const base = new Set()
    const y = qi.produce(base, _ => {
      base.add(1)
    })
    expect(() => base.add(2)).toThrowErrorMatchingSnapshot()
    expect(() => base.delete(1)).toThrowErrorMatchingSnapshot()
    expect(() => base.clear()).toThrowErrorMatchingSnapshot()
    expect(qi.produce(y, x => void x.add(2))).not.toBe(y)
  })
  it("Map#get() of frozen object will became draftable", () => {
    const base = {
      map: new Map([
        [
          "a",
          new Map([
            ["a", true],
            ["b", true],
            ["c", true],
          ]),
        ],
        ["b", new Map([["a", true]])],
        ["c", new Map([["a", true]])],
      ]),
    }
    const y = qi.produce(base, _ => {})
    qi.produce(y, x => {
      ;["b", "c"].forEach(x2 => {
        const m = x.map.get(x2)
        m?.delete("a")
      })
    })
  })
  it("never freezes non-enumerable fields #590", () => {
    const comp = {}
    Object.defineProperty(comp, "state", {
      value: { x: 1 },
      enumerable: false,
      writable: true,
      configurable: true,
    })
    const base = { x: 1 }
    const y: any = qi.produce(base, (x: any) => {
      x.ref = comp
    })
    expect(() => {
      y.ref.state.x++
    }).not.toThrow()
    expect(y.ref.state.x).toBe(2)
  })
  it("never freezes symbolic fields #590", () => {
    const comp = {}
    const k = Symbol("test")
    Object.defineProperty(comp, k, {
      value: { x: 1 },
      enumerable: true,
      writable: true,
      configurable: true,
    })
    const base = { x: 1 }
    const y: any = qi.produce(base, (x: any) => {
      x.ref = comp
    })
    expect(() => {
      y.ref[k].x++
    }).not.toThrow()
    expect(y.ref[k].x).toBe(2)
  })
})

describe("freeze", () => {
  it("freeze - shallow", () => {
    const base = { hello: { world: true } }
    const y = qi.freeze(base)
    expect(y).toBe(base)
    expect(Object.isFrozen(y)).toBe(true)
    expect(Object.isFrozen(y.hello)).toBe(false)
  })
  it("freeze - deep", () => {
    const base = { hello: { world: true } }
    const y = qi.freeze(base, true)
    expect(y).toBe(base)
    expect(Object.isFrozen(y)).toBe(true)
    expect(Object.isFrozen(y.hello)).toBe(true)
  })
})

describe("manual", () => {
  beforeAll(() => {})
  it("should check arguments", () => {
    expect(() => qi.createDraft(3)).toThrowErrorMatchingSnapshot()
    const buf = Buffer.from([])
    expect(() => qi.createDraft(buf)).toThrowErrorMatchingSnapshot()
    expect(() => qi.finishDraft({})).toThrowErrorMatchingSnapshot()
  })
  it("should support manual drafts", () => {
    const base = [{}, {}, {}]
    const d = qi.createDraft(base)
    d.forEach((x: any, i) => {
      x.index = i
    })
    const y = qi.finishDraft(d)
    expect(y).not.toBe(base)
    expect(y).toEqual([{ index: 0 }, { index: 1 }, { index: 2 }])
    expect(base).toEqual([{}, {}, {}])
  })
  if (!isProd)
    it("cannot modify after finish", () => {
      const base = { a: 1 }
      const d = qi.createDraft(base)
      d.a = 2
      expect(qi.finishDraft(d)).toEqual({ a: 2 })
      expect(() => {
        d.a = 3
      }).toThrowErrorMatchingSnapshot()
    })
  it("should support patches drafts", () => {
    const base = { a: 1 }
    const d: any = qi.createDraft(base)
    d.a = 2
    d.b = 3
    const mock = jest.fn()
    const y = qi.finishDraft(d, mock)
    expect(y).not.toBe(base)
    expect(y).toEqual({ a: 2, b: 3 })
    expect(mock.mock.calls).toMatchSnapshot()
  })
  it("should handle multiple create draft calls", () => {
    const base = { a: 1 }
    const d = qi.createDraft(base)
    d.a = 2
    const d2: any = qi.createDraft(base)
    d2.b = 3
    const y = qi.finishDraft(d)
    expect(y).not.toBe(base)
    expect(y).toEqual({ a: 2 })
    d2.a = 4
    const y2 = qi.finishDraft(d2)
    expect(y2).not.toBe(y)
    expect(y2).toEqual({ a: 4, b: 3 })
  })
  it("combines with produce - 1", () => {
    const base = { a: 1 }
    const d: any = qi.createDraft(base)
    d.a = 2
    const y = qi.produce(d, (x: any) => {
      x.b = 3
    })
    d.b = 4
    const y2 = qi.finishDraft(d)
    expect(y).toEqual({ a: 2, b: 3 })
    expect(y2).toEqual({ a: 2, b: 4 })
  })
  it("combines with produce - 2", () => {
    const base = { a: 1 }
    const y = qi.produce(base, (x: any) => {
      x.b = 3
      const d = qi.createDraft(x)
      x.c = 4
      d.d = 5
      const y2 = qi.finishDraft(d)
      expect(y2).toEqual({ a: 1, b: 3, d: 5 })
      x.d = 2
    })
    expect(y).toEqual({ a: 1, b: 3, c: 4, d: 2 })
  })
  !global.USES_BUILD &&
    it("should not finish drafts from produce", () => {
      qi.produce({ x: 1 }, x => {
        expect(() => qi.finishDraft(x)).toThrowErrorMatchingSnapshot()
      })
    })
  it("should not finish twice", () => {
    const d = qi.createDraft({ a: 1 })
    d.a++
    qi.finishDraft(d)
    expect(() => qi.finishDraft(d)).toThrowErrorMatchingSnapshot()
  })
})

describe("original", () => {
  const base = { a: [], b: {} }
  it("should return the original from the draft", () => {
    qi.produce(base, x => {
      expect(qi.original(x)).toBe(base)
      expect(qi.original(x.a)).toBe(base.a)
      expect(qi.original(x.b)).toBe(base.b)
    })
    qi.produce(base, x => {
      expect(qi.original(x)).toBe(base)
      expect(qi.original(x.a)).toBe(base.a)
      expect(qi.original(x.b)).toBe(base.b)
    })
  })
  it("should return the original from the proxy", () => {
    qi.produce(base, x => {
      expect(qi.original(x)).toBe(base)
      expect(qi.original(x.a)).toBe(base.a)
      expect(qi.original(x.b)).toBe(base.b)
    })
  })
  it("should throw undefined for new values on the draft", () => {
    qi.produce(base, (x: any) => {
      x.c = {}
      x.d = 3
      expect(() => qi.original(x.c)).toThrowErrorMatchingInlineSnapshot(
        isProd
          ? `"[Immer] minified error nr: 23 '[object Object]'. Find the full error at: https://bit.ly/3cXEKWf"`
          : `"[Immer] 'original' expects a draft, got: [object Object]"`
      )
      expect(() => qi.original(x.d)).toThrowErrorMatchingInlineSnapshot(
        isProd
          ? `"[Immer] minified error nr: 23 '3'. Find the full error at: https://bit.ly/3cXEKWf"`
          : `"[Immer] 'original' expects a draft, got: 3"`
      )
    })
  })
  it("should return undefined for an object that is not proxied", () => {
    expect(() => qi.original({})).toThrowErrorMatchingInlineSnapshot(
      isProd
        ? `"[Immer] minified error nr: 23 '[object Object]'. Find the full error at: https://bit.ly/3cXEKWf"`
        : `"[Immer] 'original' expects a draft, got: [object Object]"`
    )
    expect(() => qi.original(3)).toThrowErrorMatchingInlineSnapshot(
      isProd
        ? `"[Immer] minified error nr: 23 '3'. Find the full error at: https://bit.ly/3cXEKWf"`
        : `"[Immer] 'original' expects a draft, got: 3"`
    )
  })
})

function createBaseState() {
  const data = {
    anInstance: new (class {})(),
    anArray: [3, 2, { c: 3 }, 1],
    aMap: new Map([
      ["jedi", { name: "Luke", skill: 10 }],
      ["jediTotal", 42],
      ["force", "these aren't the droids you're looking for"],
    ] as any),
    aSet: new Set(["Luke", 42, { jedi: "Yoda" }]),
    aProp: "hi",
    anObject: { nested: { yummie: true }, coffee: false },
  }
  return data
}

describe("map set", () => {
  it("empty stub test", () => {
    expect(true).toBe(true)
  })
  it("can assign set value", () => {
    const base = new Map([["x", 1]])
    const y = qi.produce(base, s => {
      s.set("x", 2)
    })
    expect(base.get("x")).toEqual(1)
    expect(y).not.toBe(base)
    expect(y.get("x")).toEqual(2)
  })
  it("can assign by key", () => {
    const base = new Map([["x", { a: 1 }]])
    const y = qi.produce(base, s => {
      s.get("x")!.a++
    })
    expect(y.get("x")!.a).toEqual(2)
    expect(base.get("x")!.a).toEqual(1)
    expect(y).not.toBe(base)
  })
  it("deep change bubbles up", () => {
    const base = createBaseState()
    const y = qi.produce(base, s => {
      s.anObject.nested.yummie = false
    })
    expect(y).not.toBe(base)
    expect(y.anObject).not.toBe(base.anObject)
    expect(base.anObject.nested.yummie).toBe(true)
    expect(y.anObject.nested.yummie).toBe(false)
    expect(y.anArray).toBe(base.anArray)
  })
  it("can assign by key", () => {
    const base = createBaseState()
    const y = qi.produce(base, s => {
      const res = s.aMap.set("force", true)
      if (!global.USES_BUILD)
        expect(res).toBe((s.aMap as any)[qi.DRAFT_STATE].draft_)
    })
    expect(y).not.toBe(base)
    expect(y.aMap).not.toBe(base.aMap)
    expect(y.aMap.get("force")).toEqual(true)
  })
  it("can use 'delete' to remove items", () => {
    const base = createBaseState()
    const y = qi.produce(base, s => {
      expect(s.aMap.has("jedi")).toBe(true)
      expect(s.aMap.delete("jedi")).toBe(true)
      expect(s.aMap.has("jedi")).toBe(false)
    })
    expect(y.aMap).not.toBe(base.aMap)
    expect(y.aMap.size).toBe(base.aMap.size - 1)
    expect(base.aMap.has("jedi")).toBe(true)
    expect(y.aMap.has("jedi")).toBe(false)
  })
  it("support 'has'", () => {
    const base = createBaseState()
    const y = qi.produce(base, s => {
      expect(s.aMap.has("newKey")).toBe(false)
      s.aMap.set("newKey", true)
      expect(s.aMap.has("newKey")).toBe(true)
    })
    expect(y).not.toBe(base)
    expect(y.aMap).not.toBe(base.aMap)
    expect(base.aMap.has("newKey")).toBe(false)
    expect(y.aMap.has("newKey")).toBe(true)
  })
})

describe("map issues", () => {
  it("#472 ", () => {
    const base = qi.produce(new Map(), x => {
      x.set("bar1", { blocked: false })
      x.set("bar2", { blocked: false })
    })
    qi.produce(base, x => {
      const y1 = x.get("bar1")
      const y2 = x.get("bar2")
      y1.blocked = true
      y2.blocked = true
    })
    qi.produce(base, x => {
      const y1 = x.get("bar1")
      y1.blocked = true
      const y2 = x.get("bar2")
      y2.blocked = true
    })
  })
  it("setNoPatches", () => {
    const base = { set: new Set() }
    const y = qi.produceWithPatches(base, x => {
      x.set.add("abc")
    })
    expect(y).toEqual([
      { set: new Set(["abc"]) },
      [{ op: "add", path: ["set", 0], value: "abc" }],
      [{ op: "remove", path: ["set", 0], value: "abc" }],
    ])
  })
  it("mapChangeBug ", () => {
    const base = {
      map: new Map([
        [
          "a",
          new Map([
            ["b", true],
            ["c", true],
            ["d", true],
          ]),
        ],
        ["b", new Map([["a", true]])],
        ["c", new Map([["a", true]])],
        ["d", new Map([["a", true]])],
      ]),
    }
    const y = qi.produceWithPatches(base, x => {
      const a = x.map.get("a")
      a?.forEach((_, x2) => {
        const m = x.map.get(x2)
        m?.delete("a")
      })
    })
    expect(y).toEqual([
      {
        map: new Map([
          [
            "a",
            new Map([
              ["b", true],
              ["c", true],
              ["d", true],
            ]),
          ],
          ["b", new Map()],
          ["c", new Map()],
          ["d", new Map()],
        ]),
      },
      [
        {
          op: "remove",
          path: ["map", "b", "a"],
        },
        {
          op: "remove",
          path: ["map", "c", "a"],
        },
        {
          op: "remove",
          path: ["map", "d", "a"],
        },
      ],
      [
        {
          op: "add",
          path: ["map", "b", "a"],
          value: true,
        },
        {
          op: "add",
          path: ["map", "c", "a"],
          value: true,
        },
        {
          op: "add",
          path: ["map", "d", "a"],
          value: true,
        },
      ],
    ])
  })
  it("mapChangeBug2 ", () => {
    const base = {
      map: new Map([
        [
          "a",
          new Map([
            ["b", true],
            ["c", true],
            ["d", true],
          ]),
        ],
        ["b", new Map([["a", true]])],
        ["c", new Map([["a", true]])],
        ["d", new Map([["a", true]])],
      ]),
    }
    const base1 = qi.produce(base, _ => {})
    const [y, p, ip] = qi.produceWithPatches(base1, x => {
      const a = x.map.get("a")
      a?.forEach((_, x2) => {
        const m = x.map.get(x2)
        m?.delete("a")
      })
    })
    expect(y).toEqual({
      map: new Map([
        [
          "a",
          new Map([
            ["b", true],
            ["c", true],
            ["d", true],
          ]),
        ],
        ["b", new Map([])],
        ["c", new Map([])],
        ["d", new Map([])],
      ]),
    })
    expect(p).toEqual([
      {
        op: "remove",
        path: ["map", "b", "a"],
      },
      {
        op: "remove",
        path: ["map", "c", "a"],
      },
      {
        op: "remove",
        path: ["map", "d", "a"],
      },
    ])
    expect(ip).toEqual([
      {
        op: "add",
        path: ["map", "b", "a"],
        value: true,
      },
      {
        op: "add",
        path: ["map", "c", "a"],
        value: true,
      },
      {
        op: "add",
        path: ["map", "d", "a"],
        value: true,
      },
    ])
  })
  it("#586", () => {
    const base = new Set([1, 2])
    const y = qi.produce(base, x => {
      expect(Array.from(x)).toEqual([1, 2])
      x.add(3)
    })
    expect(Array.from(y).sort()).toEqual([1, 2, 3])
  })
  it("new map key with value=undefined", () => {
    const base = new Map()
    const y = qi.produce(base, x => {
      x.set("key", undefined)
    })
    expect(y.has("key")).toBe(true)
    expect(y.get("key")).toBe(undefined)
  })
  it("clear map", () => {
    const base = new Map([
      ["a", "b"],
      ["b", "c"],
    ])
    const y = qi.produceWithPatches(base, x => {
      x.clear()
    })
    expect(y).toEqual([
      new Map(),
      [
        { op: "remove", path: ["a"] },
        { op: "remove", path: ["b"] },
      ],
      [
        { op: "add", path: ["a"], value: "b" },
        { op: "add", path: ["b"], value: "c" },
      ],
    ])
  })
  it("Clearing empty Set&Map should be noop", () => {
    const base = new Map()
    const y = qi.produce(base, x => {
      x.clear()
    })
    expect(y).toBe(base)
    const set = new Set()
    const y2 = qi.produce(set, x => {
      x.clear()
    })
    expect(y2).toBe(set)
  })
  it("idempotent plugin loading", () => {
    let m1
    qi.produce(new Map(), x => {
      m1 = x.constructor
    })
    qi.enableMapSet()
    let m2
    qi.produce(new Map(), x => {
      m2 = x.constructor
    })
    expect(m1).toBe(m2)
  })
})

describe("xxx", () => {
  class Stock {
    [qi.DRAFTABLE] = true
    constructor(public price: number) {}
    pushPrice(x: number) {
      this.price = x
    }
  }
  type State = { stock: Stock }
  it("yyy", () => {
    const errorProducingPatch = [
      {
        op: "replace",
        path: ["stock"],
        value: new Stock(200),
      },
    ] as qi.Patch[]
    const base = { stock: new Stock(100) }
    expect(base.stock.price).toEqual(100)
    expect(base.stock[qi.DRAFTABLE]).toBeTruthy()
    const y: State = qi.applyPatches(base, errorProducingPatch)
    expect(base.stock.price).toEqual(100)
    expect(y.stock.price).toEqual(200)
    expect(y.stock[qi.DRAFTABLE]).toBeTruthy()
    const y2 = qi.produce(y, x => {
      x.stock.pushPrice(300)
    })
    expect(base.stock.price).toEqual(100)
    expect(y2.stock.price).toEqual(300)
    expect(y2.stock[qi.DRAFTABLE]).toBeTruthy()
    expect(y.stock.price).toEqual(200)
  })
})
