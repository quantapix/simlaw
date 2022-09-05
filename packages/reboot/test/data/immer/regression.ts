import * as qi from "../../../src/data/immer/index.js"

qi.enableAllPlugins()

runBaseTest("proxy (no freeze)", false)
runBaseTest("proxy (autofreeze)", true)

function runBaseTest(name: string, autoFreeze: boolean, useListener?: boolean) {
  function createImmer(x: any) {
    const y = new qi.Immer(x)
    const { produce } = y
    y.produce = (base: any, recipe?: any, listener?: any) => {
      const mock = useListener ? function () {} : undefined
      return typeof recipe === "function" && listener === undefined
        ? produce(base, recipe, mock)
        : produce(base, recipe, listener)
    }
    return y
  }
  const { produce } = createImmer({ autoFreeze })
  describe(`regressions ${name}`, () => {
    it("#604 freeze inside class", () => {
      class Thing {
        [qi.immerable] = true
        data: { x: any }
        constructor({ x }: { x: any }) {
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
    it("#646 setting undefined field to undefined should not create new result", () => {
      const base = { bar: undefined }
      const y = produce(base, x => {
        x.bar = undefined
      })
      expect(y).toBe(base)
    })
    it("#646 - 2 setting undefined field to undefined should not create new result", () => {
      const base = {}
      const y = produce(base, (x: any) => {
        x.bar = undefined
      })
      expect(y).not.toBe(base)
      expect(base).toEqual({})
      expect(y).toEqual({ bar: undefined })
    })
    it("#638 - out of range assignments", () => {
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
    it("#628 set removal hangs", () => {
      const arr: any = []
      const base = new Set([arr])
      const y = produce(base, x => {
        produce(x, x2 => {
          x2.delete(arr)
        })
      })
      expect(y).toEqual(new Set([[]]))
    })
    it("#628 - 2 set removal hangs", () => {
      const arr: any = []
      const base = new Set([arr])
      const y = produce(base, x => {
        x.delete(arr)
      })
      expect(y).toEqual(new Set())
    })
    it("#650 - changes with overridden arr.slice() fail", () => {
      const data = { foo: [{ isActive: false }] }
      //data.foo.slice = (...xs) =>
      //  Object.freeze(Array.prototype.slice.call(data.foo, ...xs))
      const y = produce(data, (x: any) => {
        x.foo[0].isActive = true
      })
      expect(y.foo[0]?.isActive).toBe(true)
    })
    it("#659 no reconciliation after read", () => {
      const bar = {}
      const base = { bar }
      const y = produce(base, x => {
        x.bar
        x.bar = bar
      })
      expect(y).toBe(base)
    })
    it("#659 no reconciliation after read - 2", () => {
      const bar = {}
      const base = { bar }
      const y = produce(base, x => {
        const y2: any = x.bar
        x.bar = bar
        y2.x = 3
      })
      expect(y).toEqual(base)
    })
    it("#659 no reconciliation after read - 3", () => {
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
    it("#659 no reconciliation after read - 6", () => {
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
    it("#807 new undefined member not stored", () => {
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
