import * as qi from "../../../src/data/immer/index.js"

qi.enableAllPlugins()

runBaseTest("proxy (no freeze)", false)
runBaseTest("proxy (autofreeze)", true)

function runBaseTest(name: string, autoFreeze: boolean, useListener?: boolean) {
  const listener = useListener ? function () {} : undefined
  const { produce } = createImmer({
    autoFreeze,
  })
  function createImmer(x: any) {
    const i = new qi.Immer(x)
    const { produce } = i
    i.produce = function (...xs: any[]) {
      return typeof xs[1] === "function" && xs.length < 3
        ? produce(...xs, listener)
        : produce(...xs)
    }
    return i
  }
  describe(`regressions ${name}`, () => {
    test("#604 freeze inside class", () => {
      class Thing {
        [qi.DRAFTABLE] = true
        data: { x: any }
        constructor({ x }) {
          this.data = { x }
        }
        get x() {
          return this.data.x
        }
        set x(x) {
          this.data.x = x
        }
      }
      let i = 1
      let item = new Thing({ x: i })
      const item0 = item
      const bump = () => {
        item = produce(item, x => {
          x.x = ++i
        })
      }
      bump()
      bump()
      expect(i).toBe(3)
      expect(item.data).toEqual({ x: 3 })
      expect(item0.data).toEqual({ x: 1 })
    })
    test("#646 setting undefined field to undefined should not create new result", () => {
      const base = { bar: undefined }
      const y = produce(base, x => {
        x.bar = undefined
      })
      expect(y).toBe(base)
    })
    test("#646 - 2 setting undefined field to undefined should not create new result", () => {
      const base = {}
      const y = produce(base, (x: any) => {
        x.bar = undefined
      })
      expect(y).not.toBe(base)
      expect(base).toEqual({})
      expect(y).toEqual({ bar: undefined })
    })
    test("#638 - out of range assignments", () => {
      const base: any = []
      const y = produce(base, (x: any) => {
        x[2] = "v2"
      })
      expect(y.length).toBe(3)
      expect(y).toEqual([undefined, undefined, "v2"])
      const y2 = produce(y, (x: any) => {
        x[1] = "v1"
      })
      expect(y2.length).toBe(3)
      expect(y2).toEqual([undefined, "v1", "v2"])
    })
    test("#628 set removal hangs", () => {
      const arr: any = []
      const base = new Set([arr])
      const y = produce(base, x => {
        produce(x, x2 => {
          x2.delete(arr)
        })
      })
      expect(y).toEqual(new Set([[]]))
    })
    test("#628 - 2 set removal hangs", () => {
      const arr: any = []
      const base = new Set([arr])
      const y = produce(base, x => {
        x.delete(arr)
      })
      expect(y).toEqual(new Set())
    })
    test("#650 - changes with overridden arr.slice() fail", () => {
      const data = { foo: [{ isActive: false }] }
      //data.foo.slice = (...xs) =>
      //  Object.freeze(Array.prototype.slice.call(data.foo, ...xs))
      const y = produce(data, (x: any) => {
        x.foo[0].isActive = true
      })
      expect(y.foo[0]?.isActive).toBe(true)
    })
    test("#659 no reconciliation after read", () => {
      const bar = {}
      const base = { bar }
      const y = produce(base, x => {
        x.bar
        x.bar = bar
      })
      expect(y).toBe(base)
    })
    test("#659 no reconciliation after read - 2", () => {
      const bar = {}
      const base = { bar }
      const y = produce(base, x => {
        const y2: any = x.bar
        x.bar = bar
        y2.x = 3
      })
      expect(y).toEqual(base)
    })
    test("#659 no reconciliation after read - 3", () => {
      const bar = {}
      const base = { bar }
      const y = produce(base, x => {
        const y2: any = x.bar
        y2.x = 3
        x.bar = bar
      })
      expect(y).toEqual(base)
    })
    test.skip("#659 no reconciliation after read - 4", () => {
      const bar = {}
      const base = { bar }
      const y = produce(base, x => {
        const y2: any = x.bar
        x.bar = bar
        y2.x = 3
      })
      expect(y).toBe(base)
    })
    test.skip("#659 no reconciliation after read - 5", () => {
      const bar = {}
      const base = { bar }
      const y = produce(base, x => {
        const y2: any = x.bar
        y2.x = 3
        x.bar = bar
      })
      expect(y).toBe(base)
    })
    test("#659 no reconciliation after read - 6", () => {
      const bar = {}
      const base = { bar }
      const y = produce(base, x => {
        const y2: any = x.bar
        y2.x = 3
        x.bar = bar
        x.bar = y2
      })
      expect(y).not.toBe(base)
      expect(y).toEqual({
        bar: { x: 3 },
      })
    })
    test("#807 new undefined member not stored", () => {
      const base = {}
      const y = produce(base, (x: any) => {
        x.baz = undefined
      })
      expect(base).not.toBe(y)
      expect(Object.hasOwnProperty.call(y, "baz")).toBe(true)
      expect(y).toEqual({ baz: undefined })
    })
  })
}
