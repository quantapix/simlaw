import * as qi from "../../../src/data/immer/index.js"
import lodash from "lodash"

jest.setTimeout(1000)
qi.enableAllPlugins()
const isProd = process.env["NODE_ENV"] === "production"

runBaseTest("proxy (no freeze)", false)
runBaseTest("proxy (autofreeze)", true)
runBaseTest("proxy (patch listener)", false, true)
runBaseTest("proxy (autofreeze)(patch listener)", true, true)

function runBaseTest(name: string, autoFreeze: boolean, useListener?: boolean) {
  const listener = useListener ? function () {} : undefined
  const { produce, produceWithPatches } = createImmer({
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
  describe(`base functionality - ${name}`, () => {
    let base: any
    let orig: any
    beforeEach(() => {
      orig = base = createBaseState()
    })
    it("returns the original state when no changes are made", () => {
      const y = produce(base, (x: any) => {
        expect(x.aProp).toBe("hi")
        expect(x.anObject.nested).toMatchObject({ yummie: true })
      })
      expect(y).toBe(base)
    })
    it("does structural sharing", () => {
      const r = Math.random()
      const y: any = produce(base, (x: any) => {
        x.aProp = r
      })
      expect(y).not.toBe(base)
      expect(y.aProp).toBe(r)
      expect(y.nested).toBe(base.nested)
    })
    it("deep change bubbles up", () => {
      const y: any = produce(base, (x: any) => {
        x.anObject.nested.yummie = false
      })
      expect(y).not.toBe(base)
      expect(y.anObject).not.toBe(base.anObject)
      expect(base.anObject.nested.yummie).toBe(true)
      expect(y.anObject.nested.yummie).toBe(false)
      expect(y.anArray).toBe(base.anArray)
    })
    it("can add props", () => {
      const y: any = produce(base, (x: any) => {
        x.anObject.cookie = { tasty: true }
      })
      expect(y).not.toBe(base)
      expect(y.anObject).not.toBe(base.anObject)
      expect(y.anObject.nested).toBe(base.anObject.nested)
      expect(y.anObject.cookie).toEqual({ tasty: true })
    })
    it("can delete props", () => {
      const y: any = produce(base, (x: any) => {
        delete x.anObject.nested
      })
      expect(y).not.toBe(base)
      expect(y.anObject).not.toBe(base.anObject)
      expect(y.anObject.nested).toBe(undefined)
    })
    it("can delete props added in the producer", () => {
      const y = produce(base, (x: any) => {
        x.anObject.test = true
        delete x.anObject.test
      })
      expect(y).not.toBe(base)
      expect(y).toEqual(base)
    })
    it("can set a property that was just deleted", () => {
      const base = { a: 1 }
      const y = produce(base, (x: any) => {
        delete x.a
        x.a = 2
      })
      expect(y.a).toBe(2)
    })
    it("can set a property to its original value after deleting it", () => {
      const base = { a: { b: 1 } }
      const y = produce(base, (x: any) => {
        const a = x.a
        delete x.a
        x.a = a
      })
      expect(y).not.toBe(base)
      expect(y).toEqual(base)
    })
    it("can get property descriptors", () => {
      const getDescriptor = Object.getOwnPropertyDescriptor
      const base = qi.deepFreeze([{ a: 1 }])
      produce(base, (x: any) => {
        const y = x[0]
        const desc = {
          configurable: true,
          enumerable: true,
          ...{ writable: true },
        }
        expect(getDescriptor(y, "a")).toMatchObject(desc)
        expect(getDescriptor(x, 0)).toMatchObject(desc)
        delete y.a
        x.pop()
        expect(getDescriptor(y, "a")).toBeUndefined()
        expect(getDescriptor(x, 0)).toBeUndefined()
        expect(getDescriptor(y, "b")).toBeUndefined()
        expect(getDescriptor(x, 100)).toBeUndefined()
        y.b = 2
        x[100] = 1
        expect(getDescriptor(y, "b")).toBeDefined()
        expect(getDescriptor(x, 100)).toBeDefined()
      })
    })
    describe("array drafts", () => {
      it("supports Array.isArray()", () => {
        const y: any = produce(base, (x: any) => {
          expect(Array.isArray(x.anArray)).toBeTruthy()
          x.anArray.push(1)
        })
        expect(Array.isArray(y.anArray)).toBeTruthy()
      })
      it("supports index access", () => {
        const v = base.anArray[0]
        const y = produce(base, (x: any) => {
          expect(x.anArray[0]).toBe(v)
        })
        expect(y).toBe(base)
      })
      it("supports iteration", () => {
        const base = [
          { id: 1, a: 1 },
          { id: 2, a: 1 },
        ]
        const findById = (xs: any, id: any) => {
          for (const x of xs) {
            if (x.id === id) return x
          }
          return null
        }
        const y = produce(base, (x: any) => {
          const obj1 = findById(x, 1)
          const obj2 = findById(x, 2)
          obj1.a = 2
          obj2.a = 2
        })
        expect(y[0]?.a).toEqual(2)
        expect(y[1]?.a).toEqual(2)
      })
      it("can assign an index via bracket notation", () => {
        const y: any = produce(base, (x: any) => {
          x.anArray[3] = true
        })
        expect(y).not.toBe(base)
        expect(y.anArray).not.toBe(base.anArray)
        expect(y.anArray[3]).toEqual(true)
      })
      it("can use splice() to both add and remove items", () => {
        const y: any = produce(base, (x: any) => {
          x.anArray.splice(1, 1, "a", "b")
        })
        expect(y.anArray).not.toBe(base.anArray)
        expect(y.anArray[1]).toBe("a")
        expect(y.anArray[2]).toBe("b")
      })
      it("can truncate via the length property", () => {
        const v = base.anArray.length
        const y: any = produce(base, (x: any) => {
          x.anArray.length = v - 1
        })
        expect(y.anArray).not.toBe(base.anArray)
        expect(y.anArray.length).toBe(v - 1)
      })
      it("can extend via the length property", () => {
        const v = base.anArray.length
        const y: any = produce(base, (x: any) => {
          x.anArray.length = v + 1
        })
        expect(y.anArray).not.toBe(base.anArray)
        expect(y.anArray.length).toBe(v + 1)
      })
      it("can pop then push", () => {
        const y = produce([1, 2, 3], (s: any) => {
          s.pop()
          s.push(100)
        })
        expect(y).toEqual([1, 2, 100])
      })
      it("can be sorted", () => {
        const base = [3, 1, 2]
        const y = produce(base, (x: any) => {
          x.sort()
        })
        expect(y).not.toBe(base)
        expect(y).toEqual([1, 2, 3])
      })
      it("supports modifying nested objects", () => {
        const base = [{ a: 1 }, {}]
        const y = produce(base, (x: any) => {
          x[0].a++
          x[1].a = 0
        })
        expect(y).not.toBe(base)
        expect(y[0]?.a).toBe(2)
        expect(y[1]?.a).toBe(0)
      })
      it("never preserves non-numeric properties", () => {
        const base: any = []
        base.x = 7
        const y = produce(base, (x: any) => {
          x.push(3)
        })
        expect("x" in y).toBeFalsy()
      })
      it("throws when a non-numeric property is added", () => {
        expect(() => {
          produce([], (x: any) => {
            x.x = 3
          })
        }).toThrowErrorMatchingSnapshot()
      })
      it("throws when a non-numeric property is deleted", () => {
        expect(() => {
          const base: any = []
          base.x = 7
          produce(base, (x: any) => {
            delete x.x
          })
        }).toThrowErrorMatchingSnapshot()
      })
    })
    describe("map drafts", () => {
      it("supports key access", () => {
        const v = base.aMap.get("jedi")
        const y = produce(base, (x: any) => {
          expect(x.aMap.get("jedi")).toEqual(v)
        })
        expect(y).toBe(base)
      })
      it("supports key access for non-primitive keys", () => {
        const k = { prop: "val" }
        const base = new Map([[k, { id: 1, a: 1 }]])
        const v = base.get(k)
        const y = produce(base, (x: any) => {
          expect(x.get(k)).toEqual(v)
        })
        expect(y).toBe(base)
      })
      it("supports iteration", () => {
        const base = new Map([
          ["first", { id: 1, a: 1 }],
          ["second", { id: 2, a: 1 }],
        ])
        const findById = (xs: any, id: any) => {
          for (const [, x] of xs) {
            if (x.id === id) return x
          }
          return null
        }
        const y = produce(base, (x: any) => {
          const obj1 = findById(x, 1)
          const obj2 = findById(x, 2)
          obj1.a = 2
          obj2.a = 2
        })
        expect(y).not.toBe(base)
        expect(y.get("first")?.a).toEqual(2)
        expect(y.get("second")?.a).toEqual(2)
      })
      it("supports 'entries'", () => {
        const base = new Map([
          ["first", { id: 1, a: 1 }],
          ["second", { id: 2, a: 1 }],
        ])
        const findById = (xs: any, id: any) => {
          for (const [, x] of xs.entries()) {
            if (x.id === id) return x
          }
          return null
        }
        const y = produce(base, (x: any) => {
          const obj1 = findById(x, 1)
          const obj2 = findById(x, 2)
          obj1.a = 2
          obj2.a = 2
        })
        expect(y).not.toBe(base)
        expect(y.get("first")?.a).toEqual(2)
        expect(y.get("second")?.a).toEqual(2)
      })
      it("supports 'values'", () => {
        const base = new Map([
          ["first", { id: 1, a: 1 }],
          ["second", { id: 2, a: 1 }],
        ])
        const findById = (xs: any, id: any) => {
          for (const x of xs.values()) {
            if (x.id === id) return x
          }
          return null
        }
        const y = produce(base, (x: any) => {
          const obj1 = findById(x, 1)
          const obj2 = findById(x, 2)
          obj1.a = 2
          obj2.a = 2
        })
        expect(y).not.toBe(base)
        expect(y.get("first")?.a).toEqual(2)
        expect(y.get("second")?.a).toEqual(2)
      })
      it("supports 'keys", () => {
        const base = new Map([
          ["first", Symbol()],
          ["second", Symbol()],
        ])
        produce(base, (x: any) => {
          expect([...x.keys()]).toEqual(["first", "second"])
          x.set("third", Symbol())
          expect([...x.keys()]).toEqual(["first", "second", "third"])
        })
      })
      it("supports forEach", () => {
        const key1 = { prop: "val1" }
        const key2 = { prop: "val2" }
        const base = new Map<any, any>([
          ["first", { id: 1, a: 1 }],
          ["second", { id: 2, a: 1 }],
          [key1, { id: 3, a: 1 }],
          [key2, { id: 4, a: 1 }],
        ])
        const y = produce(base, (x: any) => {
          let sum1 = 0
          x.forEach(({ a }: { a: any }) => {
            sum1 += a
          })
          expect(sum1).toBe(4)
          let sum2 = 0
          x.get("first").a = 10
          x.get("second").a = 20
          x.get(key1).a = 30
          x.get(key2).a = 40
          x.forEach(({ a }: { a: any }) => {
            sum2 += a
          })
          expect(sum2).toBe(100)
        })
        expect(y).not.toBe(base)
        expect(base.get("first")?.a).toEqual(1)
        expect(base.get("second")?.a).toEqual(1)
        expect(base.get(key1)?.a).toEqual(1)
        expect(base.get(key2)?.a).toEqual(1)
        expect(y.get("first")?.a).toEqual(10)
        expect(y.get("second")?.a).toEqual(20)
        expect(y.get(key1)?.a).toEqual(30)
        expect(y.get(key2)?.a).toEqual(40)
      })
      it("supports forEach mutation", () => {
        const base = new Map([
          ["first", { id: 1, a: 1 }],
          ["second", { id: 2, a: 1 }],
        ])
        const y = produce(base, (x: any) => {
          x.forEach((i: any) => {
            i.a = 100
          })
        })
        expect(y).not.toBe(base)
        expect(y.get("first")?.a).toEqual(100)
        expect(y.get("second")?.a).toEqual(100)
      })
      it("can assign by key", () => {
        const y: any = produce(base, (x: any) => {
          const y2 = x.aMap.set("force", true)
          expect(y2).toBe(x.aMap[qi.DRAFT_STATE].draft_)
        })
        expect(y).not.toBe(base)
        expect(y.aMap).not.toBe(base.aMap)
        expect(y.aMap.get("force")).toEqual(true)
      })
      it("can assign by a non-primitive key", () => {
        const k = { prop: "val" }
        const v = { id: 1, a: 1 }
        const base = new Map([[k, v]])
        const y = produce(base, (x: any) => {
          x.set(k, true)
        })
        expect(y).not.toBe(base)
        expect(base.get(k)).toEqual(v)
        expect(y.get(k)).toEqual(true)
      })
      it("state stays the same if the the same item is assigned by key", () => {
        const y: any = produce(base, (x: any) => {
          x.aMap.set("jediTotal", 42)
        })
        expect(y).toBe(base)
        expect(y.aMap).toBe(base.aMap)
      })
      it("returns 'size'", () => {
        const y: any = produce(base, (x: any) => {
          x.aMap.set("newKey", true)
          expect(x.aMap.size).toBe(base.aMap.size + 1)
        })
        expect(y).not.toBe(base)
        expect(y.aMap).not.toBe(base.aMap)
        expect(y.aMap.get("newKey")).toEqual(true)
        expect(y.aMap.size).toEqual(base.aMap.size + 1)
      })
      it("can use 'delete' to remove items", () => {
        const y: any = produce(base, (x: any) => {
          expect(x.aMap.has("jedi")).toBe(true)
          expect(x.aMap.delete("jedi")).toBe(true)
          expect(x.aMap.has("jedi")).toBe(false)
        })
        expect(y.aMap).not.toBe(base.aMap)
        expect(y.aMap.size).toBe(base.aMap.size - 1)
        expect(base.aMap.has("jedi")).toBe(true)
        expect(y.aMap.has("jedi")).toBe(false)
      })
      it("can use 'clear' to remove items", () => {
        const y: any = produce(base, (x: any) => {
          expect(x.aMap.size).not.toBe(0)
          x.aMap.clear()
          expect(x.aMap.size).toBe(0)
        })
        expect(y.aMap).not.toBe(base.aMap)
        expect(base.aMap.size).not.toBe(0)
        expect(y.aMap.size).toBe(0)
      })
      it("support 'has'", () => {
        const y: any = produce(base, (x: any) => {
          expect(x.aMap.has("newKey")).toBe(false)
          x.aMap.set("newKey", true)
          expect(x.aMap.has("newKey")).toBe(true)
        })
        expect(y).not.toBe(base)
        expect(y.aMap).not.toBe(base.aMap)
        expect(base.aMap.has("newKey")).toBe(false)
        expect(y.aMap.has("newKey")).toBe(true)
      })
      it("supports nested maps", () => {
        const base = new Map([
          ["first", new Map([["second", { prop: "test" }]])],
        ])
        const y: any = produce(base, (x: any) => {
          x.get("first").get("second").prop = "test1"
        })
        expect(y).not.toBe(base)
        expect(y.get("first")).not.toBe(base.get("first"))
        expect(y.get("first").get("second")).not.toBe(
          base.get("first")?.get("second")
        )
        expect(base.get("first")?.get("second")?.prop).toBe("test")
        expect(y.get("first").get("second").prop).toBe("test1")
      })
      it("treats void deletes as no-op", () => {
        const base = new Map([["x", 1]])
        const y = produce(base, (x: any) => {
          expect(x.delete("y")).toBe(false)
        })
        expect(y).toBe(base)
      })
      it("revokes map proxies", () => {
        let m: any
        produce(base, (x: any) => {
          m = x.aMap
        })
        expect(() => m.get("x")).toThrowErrorMatchingSnapshot()
        expect(() => m.set("x", 3)).toThrowErrorMatchingSnapshot()
      })
      it("does not draft map keys", () => {
        const k = { a: 1 }
        const base = new Map([[k, 2]])
        const y = produce(base, (x: any) => {
          const dKey: any = Array.from(x.keys())[0]
          expect(qi.isDraft(dKey)).toBe(false)
          expect(dKey).toBe(k)
          dKey.a += 1
          x.set(dKey, x.get(dKey) + 1)
          x.set(k, x.get(k) + 1)
          expect(x.get(k)).toBe(4)
          expect(k.a).toBe(2)
        })
        const entries = Array.from(y.entries())
        expect(entries).toEqual([[k, 4]])
        expect(entries[0]?.[0]).toBe(k)
        expect(entries[0]?.[0].a).toBe(2)
      })
      it("does support instanceof Map", () => {
        const base = new Map()
        produce(base, (x: any) => {
          expect(x instanceof Map).toBeTruthy()
        })
      })
      it("handles clear correctly", () => {
        const base = new Map([
          ["a", 1],
          ["c", 3],
        ])
        const y = produce(base, (x: any) => {
          x.delete("a")
          x.set("b", 2)
          x.set("c", 4)
          x.clear()
        })
        expect(y).toEqual(new Map())
      })
    })
    describe("set drafts", () => {
      it("supports iteration", () => {
        const base = new Set([
          { id: 1, a: 1 },
          { id: 2, a: 1 },
        ])
        const findById = (set: any, id: any) => {
          for (const item of set) {
            if (item.id === id) return item
          }
          return null
        }
        const y = produce(base, (x: any) => {
          const obj1 = findById(x, 1)
          const obj2 = findById(x, 2)
          obj1.a = 2
          obj2.a = 2
        })
        expect(y).not.toBe(base)
        expect(base).toEqual(
          new Set([
            { id: 1, a: 1 },
            { id: 2, a: 1 },
          ])
        )
        expect(y).toEqual(
          new Set([
            { id: 1, a: 2 },
            { id: 2, a: 2 },
          ])
        )
      })
      it("supports 'entries'", () => {
        const base = new Set([
          { id: 1, a: 1 },
          { id: 2, a: 1 },
        ])
        const findById = (set: any, id: any) => {
          for (const [item1, item2] of set.entries()) {
            expect(item1).toBe(item2)
            if (item1.id === id) return item1
          }
          return null
        }
        const y = produce(base, (x: any) => {
          const obj1 = findById(x, 1)
          const obj2 = findById(x, 2)
          obj1.a = 2
          obj2.a = 2
        })
        expect(y).not.toBe(base)
        expect(base).toEqual(
          new Set([
            { id: 1, a: 1 },
            { id: 2, a: 1 },
          ])
        )
        expect(y).toEqual(
          new Set([
            { id: 1, a: 2 },
            { id: 2, a: 2 },
          ])
        )
      })
      it("supports 'values'", () => {
        const base = new Set([
          { id: 1, a: 1 },
          { id: 2, a: 1 },
        ])
        const findById = (set: any, id: any) => {
          for (const item of set.values()) {
            if (item.id === id) return item
          }
          return null
        }
        const y = produce(base, (x: any) => {
          const obj1 = findById(x, 1)
          const obj2 = findById(x, 2)
          obj1.a = 2
          obj2.a = 2
        })
        expect(y).not.toBe(base)
        expect(base).toEqual(
          new Set([
            { id: 1, a: 1 },
            { id: 2, a: 1 },
          ])
        )
        expect(y).toEqual(
          new Set([
            { id: 1, a: 2 },
            { id: 2, a: 2 },
          ])
        )
      })
      it("supports 'keys'", () => {
        const base = new Set([
          { id: 1, a: 1 },
          { id: 2, a: 1 },
        ])
        const findById = (set: any, id: any) => {
          for (const item of set.keys()) {
            if (item.id === id) return item
          }
          return null
        }
        const y = produce(base, (x: any) => {
          const obj1 = findById(x, 1)
          const obj2 = findById(x, 2)
          obj1.a = 2
          obj2.a = 2
        })
        expect(y).not.toBe(base)
        expect(base).toEqual(
          new Set([
            { id: 1, a: 1 },
            { id: 2, a: 1 },
          ])
        )
        expect(y).toEqual(
          new Set([
            { id: 1, a: 2 },
            { id: 2, a: 2 },
          ])
        )
      })
      it("supports forEach with mutation after reads", () => {
        const base = new Set([
          { id: 1, a: 1 },
          { id: 2, a: 2 },
        ])
        const y = produce(base, (x: any) => {
          let sum1 = 0
          x.forEach(({ a }: { a: any }) => {
            sum1 += a
          })
          expect(sum1).toBe(3)
          let sum2 = 0
          x.forEach((item: any) => {
            item.a += 10
            sum2 += item.a
          })
          expect(sum2).toBe(23)
        })
        expect(y).not.toBe(base)
        expect(base).toEqual(
          new Set([
            { id: 1, a: 1 },
            { id: 2, a: 2 },
          ])
        )
        expect(y).toEqual(
          new Set([
            { id: 1, a: 11 },
            { id: 2, a: 12 },
          ])
        )
      })
      it("state stays the same if the same item is added", () => {
        const y: any = produce(base, (x: any) => {
          x.aSet.add("Luke")
        })
        expect(y).toBe(base)
        expect(y.aSet).toBe(base.aSet)
      })
      it("can add new items", () => {
        const y: any = produce(base, (x: any) => {
          const y2 = x.aSet.add("force")
          expect(y2).toBe(x.aSet[qi.DRAFT_STATE].draft_)
        })
        expect(y).not.toBe(base)
        expect(y.aSet).not.toBe(base.aSet)
        expect(base.aSet.has("force")).toBe(false)
        expect(y.aSet.has("force")).toBe(true)
      })
      it("returns 'size'", () => {
        const y: any = produce(base, (x: any) => {
          x.aSet.add("newKey")
          expect(x.aSet.size).toBe(base.aSet.size + 1)
        })
        expect(y).not.toBe(base)
        expect(y.aSet).not.toBe(base.aSet)
        expect(y.aSet.has("newKey")).toBe(true)
        expect(y.aSet.size).toEqual(base.aSet.size + 1)
      })
      it("can use 'delete' to remove items", () => {
        const y: any = produce(base, (x: any) => {
          expect(x.aSet.has("Luke")).toBe(true)
          expect(x.aSet.delete("Luke")).toBe(true)
          expect(x.aSet.delete("Luke")).toBe(false)
          expect(x.aSet.has("Luke")).toBe(false)
        })
        expect(y.aSet).not.toBe(base.aSet)
        expect(base.aSet.has("Luke")).toBe(true)
        expect(y.aSet.has("Luke")).toBe(false)
        expect(y.aSet.size).toBe(base.aSet.size - 1)
      })
      it("can use 'clear' to remove items", () => {
        const y: any = produce(base, (x: any) => {
          expect(x.aSet.size).not.toBe(0)
          x.aSet.clear()
          expect(x.aSet.size).toBe(0)
        })
        expect(y.aSet).not.toBe(base.aSet)
        expect(base.aSet.size).not.toBe(0)
        expect(y.aSet.size).toBe(0)
      })
      it("supports 'has'", () => {
        const y: any = produce(base, (x: any) => {
          expect(x.aSet.has("newKey")).toBe(false)
          x.aSet.add("newKey")
          expect(x.aSet.has("newKey")).toBe(true)
        })
        expect(y).not.toBe(base)
        expect(y.aSet).not.toBe(base.aSet)
        expect(base.aSet.has("newKey")).toBe(false)
        expect(y.aSet.has("newKey")).toBe(true)
      })
      it("supports nested sets", () => {
        const base = new Set([new Set(["Serenity"])])
        const y = produce(base, (x: any) => {
          x.forEach((i: any) => i.add("Firefly"))
        })
        expect(y).not.toBe(base)
        expect(base).toEqual(new Set([new Set(["Serenity"])]))
        expect(y).toEqual(new Set([new Set(["Serenity", "Firefly"])]))
      })
      it("supports has / delete on elements from the original", () => {
        const v = {}
        const base = new Set([v])
        const y = produce(base, (x: any) => {
          expect(x.has(v)).toBe(true)
          x.add(3)
          expect(x.has(v)).toBe(true)
          x.delete(v)
          expect(x.has(v)).toBe(false)
        })
        expect(y).toEqual(new Set([3]))
      })
      it("revokes sets", () => {
        let m: any
        produce(base, (x: any) => {
          m = x.aSet
        })
        expect(() => m.has("x")).toThrowErrorMatchingSnapshot()
        expect(() => m.add("x")).toThrowErrorMatchingSnapshot()
      })
      it("does support instanceof Set", () => {
        const base = new Set()
        produce(base, (x: any) => {
          expect(x instanceof Set).toBeTruthy()
        })
      })
    })
    it("supports `immerable` symbol on constructor", () => {
      class One {}
      ;(One as any)[qi.immerable] = true
      const base = new One()
      const y: any = produce(base, (x: any) => {
        expect(x).not.toBe(base)
        x.foo = true
      })
      expect(y).not.toBe(base)
      expect(y.foo).toBeTruthy()
    })
    it("preserves symbol properties", () => {
      const test = Symbol("test")
      const base = { [test]: true }
      const y = produce(base, (x: any) => {
        expect(x[test]).toBeTruthy()
        x.foo = true
      })
      expect(y).toEqual({
        [test]: true,
        foo: true,
      })
    })
    it("preserves non-enumerable properties", () => {
      const base = {}
      Object.defineProperty(base, "foo", {
        value: { a: 1 },
        enumerable: false,
      })
      Object.defineProperty(base, "bar", {
        value: 1,
        enumerable: false,
      })
      const y: any = produce(base, (x: any) => {
        expect(x.foo).toBeTruthy()
        expect(isEnumerable(x, "foo")).toBeFalsy()
        x.bar++
        expect(isEnumerable(x, "foo")).toBeFalsy()
        x.foo.a++
        expect(isEnumerable(x, "foo")).toBeFalsy()
      })
      expect(y.foo).toBeTruthy()
      expect(isEnumerable(y, "foo")).toBeFalsy()
    })
    it("can work with own computed props", () => {
      const base = {
        x: 1,
        get y() {
          return this.x
        },
        set y(v) {
          this.x = v
        },
      }
      const y = produce(base, (x: any) => {
        expect(x.y).toBe(1)
        x.x = 2
        expect(x.x).toBe(2)
        expect(x.y).toBe(1)
        x.y = 3
        expect(x.x).toBe(2)
      })
      expect(base.x).toBe(1)
      expect(base.y).toBe(1)
      expect(y.x).toBe(2)
      expect(y.y).toBe(3)
      if (!autoFreeze) {
        y.y = 4
        expect(y.y).toBe(4)
        expect(y.x).toBe(2)
        expect(Object.getOwnPropertyDescriptor(y, "y")?.value).toBe(4)
      }
    })
    it("can work with class with computed props", () => {
      class State {
        [qi.immerable] = true
        x = 1
        set y(v) {
          this.x = v
        }
        get y() {
          return this.x
        }
      }
      const base = new State()
      const y = produce(base, (x: any) => {
        expect(x.y).toBe(1)
        x.y = 2
        expect(x.x).toBe(2)
        expect(x.y).toBe(2)
        expect(Object.getOwnPropertyDescriptor(x, "y")).toBeUndefined()
      })
      expect(base.x).toBe(1)
      expect(base.y).toBe(1)
      expect(y.x).toBe(2)
      expect(y.y).toBe(2)
      expect(Object.getOwnPropertyDescriptor(y, "y")).toBeUndefined()
    })
    it("allows inherited computed properties", () => {
      const proto: any = {}
      Object.defineProperty(proto, "foo", {
        get() {
          return this.bar
        },
        set(val) {
          this.bar = val
        },
      })
      proto[qi.immerable] = true
      const base = Object.create(proto)
      produce(base, (x: any) => {
        expect(x.bar).toBeUndefined()
        x.foo = {}
        expect(x.bar).toBeDefined()
        expect(x.foo).toBe(x.bar)
      })
    })
    it("optimization: does not visit properties of new data structures if autofreeze is disabled and no drafts are unfinalized", () => {
      const newData = {}
      Object.defineProperty(newData, "x", {
        enumerable: true,
        get() {
          throw new Error("visited!")
        },
      })
      const run = () =>
        produce({}, (d: any) => {
          d.data = newData
        })
      if (autoFreeze) expect(run).toThrow("visited!")
      else expect(run).not.toThrow("visited!")
    })
    it("same optimization doesn't cause draft from nested producers to be unfinished", () => {
      const base = {
        y: 1,
        child: {
          x: 1,
        },
      }
      const y0 = produce((x: any) => {
        return {
          wrapped: x,
        }
      })
      const y = produce(base, (x: any) => {
        x.y++
        x.child = y0(x.child)
        x.child.wrapped.x++
      })
      expect(y).toEqual({
        y: 2,
        child: { wrapped: { x: 2 } },
      })
    })
    it("supports a base state with multiple references to an object", () => {
      const obj = {}
      const y: any = produce({ a: obj, b: obj }, (d: any) => {
        expect(d.a).not.toBe(d.b)
        d.a.z = true
        expect(d.b.z).toBeUndefined()
      })
      expect(y.b).toBe(obj)
      expect(y.a).not.toBe(y.b)
      expect(y.a.z).toBeTruthy()
    })
    it("supports multiple references to any modified draft", () => {
      const y: any = produce({ a: { b: 1 } }, (d: any) => {
        d.a.b++
        d.b = d.a
      })
      expect(y.a).toBe(y.b)
    })
    it("can rename nested objects (no changes)", () => {
      const y = produce({ obj: {} }, (s: any) => {
        s.foo = s.obj
        delete s.obj
      })
      expect(y).toEqual({ foo: {} })
    })
    it("can rename nested objects (with changes)", () => {
      const y = produce({ obj: { a: 1, b: 1 } }, (s: any) => {
        s.obj.a = true
        delete s.obj.b
        s.obj.c = true
        s.foo = s.obj
        delete s.obj
      })
      expect(y).toEqual({ foo: { a: true, c: true } })
    })
    it("can nest a draft in a new object (no changes)", () => {
      const base = { obj: {} }
      const y: any = produce(base, (x: any) => {
        x.foo = { bar: x.obj }
        delete x.obj
      })
      expect(y.foo.bar).toBe(base.obj)
    })
    it("can nest a modified draft in a new object", () => {
      const y = produce({ obj: { a: 1, b: 1 } }, (s: any) => {
        s.obj.a = true
        delete s.obj.b
        s.obj.c = true
        s.foo = { bar: s.obj }
        delete s.obj
      })
      expect(y).toEqual({ foo: { bar: { a: true, c: true } } })
    })
    it("supports assigning undefined to an existing property", () => {
      const y: any = produce(base, (x: any) => {
        x.aProp = undefined
      })
      expect(y).not.toBe(base)
      expect(y.aProp).toBe(undefined)
    })
    it("supports assigning undefined to a new property", () => {
      const base = {}
      const y: any = produce(base, (x: any) => {
        x.aProp = undefined
      })
      expect(y).not.toBe(base)
      expect(y.aProp).toBe(undefined)
    })
    if (!isProd)
      it("revokes the draft once produce returns", () => {
        const expectRevoked = (f: any, shouldThrow = true) => {
          if (shouldThrow) expect(f).toThrowErrorMatchingSnapshot()
          else expect(f).not.toThrow()
        }
        let draft: any
        produce({ a: 1, b: 1 }, (s: any) => {
          draft = s
          delete s.b
        })
        expectRevoked(() => {
          draft.a
        })
        expectRevoked(() => {
          draft.a = true
        })
        expectRevoked(() => {
          draft.z
        }, true)
        expectRevoked(() => {
          draft.z = true
        }, true)
        produce([1, 2], (s: any) => {
          draft = s
          s.pop()
        })
        expectRevoked(() => {
          draft[0]
        })
        expectRevoked(() => {
          draft[0] = true
        })
        expectRevoked(() => {
          draft[1]
        }, true)
        expectRevoked(() => {
          draft[1] = true
        }, true)
      })
    it("can access a child draft that was created before the draft was modified", () => {
      produce({ a: {} }, (s: any) => {
        const before = s.a
        s.b = 1
        expect(s.a).toBe(before)
      })
    })
    it("should reflect all changes made in the draft immediately", () => {
      produce(base, (x: any) => {
        x.anArray[0] = 5
        x.anArray.unshift("test")
        expect(enumOnly(x.anArray)).toEqual(["test", 5, 2, { c: 3 }, 1])
        x.stuffz = "coffee"
        expect(x.stuffz).toBe("coffee")
      })
    })
    it("throws when Object.defineProperty() is used on drafts", () => {
      expect(() => {
        produce({}, (x: any) => {
          Object.defineProperty(x, "xx", {
            enumerable: true,
            writable: true,
            value: 2,
          })
        })
      }).toThrowErrorMatchingSnapshot()
    })
    it("should handle constructor correctly", () => {
      const base = {
        arr: [],
        obj: new Object(),
      }
      const y: any = produce(base, (x: any) => {
        x.arrConstructed = x.arr.constructor(1)
        x.objConstructed = x.obj.constructor(1)
      })
      expect(y.arrConstructed).toEqual([].constructor(1))
      expect(y.objConstructed).toEqual(new Object().constructor(1))
    })
    it("should handle equality correctly - 1", () => {
      const base = {
        y: 3 / 0,
        z: NaN,
      }
      const y = produce(base, (x: any) => {
        x.y = 4 / 0
        x.z = NaN
      })
      expect(y).toBe(base)
    })
    it("should handle equality correctly - 2", () => {
      const base = {
        x: -0,
      }
      const y = produce(base, (x: any) => {
        x.x = +0
      })
      expect(y).not.toBe(base)
      expect(y).not.toEqual(base)
    })
    describe("nested producers", () => {
      describe("when base state is not a draft", () => {
        it("never affects its parent producer implicitly", () => {
          const base = { obj: { a: 1 } }
          const y = produce(base, (x: any) => {
            const y2 = produce(base.obj, x2 => {
              x2.a = 0
            })
            expect(y2.a).toBe(0)
            expect(x.obj.a).toBe(1)
          })
          expect(y).toBe(base)
        })
      })
      describe("when base state is a draft", () => {
        it("always wraps the draft in a new draft", () => {
          produce({}, (base: any) => {
            produce(base, (x: any) => {
              expect(x).not.toBe(base)
              expect(qi.isDraft(x)).toBeTruthy()
              expect(qi.original(x)).toBe(base)
            })
          })
        })
        it("ensures each property is drafted", () => {
          produce({ a: {}, b: {} }, (base: any) => {
            base.a
            produce(base, (x: any) => {
              x.c = 1
              expect(qi.isDraft(x.a)).toBeTruthy()
              expect(qi.isDraft(x.b)).toBeTruthy()
            })
          })
        })
        it("preserves any pending changes", () => {
          produce({ a: 1, b: 1, d: 1 }, (base: any) => {
            base.b = 2
            base.c = 2
            delete base.d
            produce(base, (x: any) => {
              expect(x.a).toBe(1)
              expect(x.b).toBe(2)
              expect(x.c).toBe(2)
              expect(x.d).toBeUndefined()
            })
          })
        })
      })
      describe("when base state contains a draft", () => {
        it("wraps unowned draft with its own draft", () => {
          produce({ a: {} }, (base: any) => {
            produce({ a: base.a }, (x: any) => {
              expect(x.a).not.toBe(base.a)
              expect(qi.isDraft(x.a)).toBeTruthy()
              expect(qi.original(x.a)).toBe(base.a)
            })
          })
        })
        it("returns unowned draft if no changes were made", () => {
          produce({ a: {} }, (x: any) => {
            const y = produce({ a: x.a }, () => {})
            expect(y.a).toBe(x.a)
          })
        })
        it("clones the unowned draft when changes are made", () => {
          produce({ a: {} }, (x: any) => {
            const y = produce({ a: x.a }, (x1: any) => {
              x1.a.b = 1
            })
            expect(y.a).not.toBe(x.a)
            expect(y.a.b).toBe(1)
            expect("b" in x.a).toBeFalsy()
          })
        })
        it("never auto-freezes the result", () => {
          produce({ a: {} }, (x: any) => {
            const y = produce({ a: x.a }, (x1: any) => {
              x1.b = 1
            })
            expect(Object.isFrozen(y)).toBeFalsy()
          })
        })
      })
      it("does not finalize upvalue drafts", () => {
        produce({ a: {}, b: {} }, (x: any) => {
          expect(produce({}, () => x)).toBe(x)
          x.x
          expect((produce({}, () => [x]) as any)[0]).toBe(x)
          x.x
          expect(produce({}, () => x.a)).toBe(x.a)
          x.a.x
          x.c = 1
          expect((produce({}, () => [x.b]) as any)[0]).toBe(x.b)
          x.b.x
        })
      })
      it("works with interweaved Immer instances", () => {
        const options = { autoFreeze }
        const one = createImmer(options)
        const two = createImmer(options)
        const base = {}
        const y: any = one.produce(base, x1 =>
          two.produce({ s1: x1 }, (x2: any) => {
            expect(qi.original(x2.s1)).toBe(x1)
            x2.n = 1
            x2.s1 = one.produce({ s2: x2 }, (x3: any) => {
              expect(qi.original(x3.s2)).toBe(x2)
              expect(qi.original(x3.s2.s1)).toBe(x2.s1)
              return x3.s2.s1
            })
          })
        )
        expect(y.n).toBe(1)
        expect(y.s1).toBe(base)
      })
    })
    it("throws when Object.setPrototypeOf() is used on a draft", () => {
      produce({}, (x: any) => {
        expect(() =>
          Object.setPrototypeOf(x, Array)
        ).toThrowErrorMatchingSnapshot()
      })
    })
    it("supports the 'in' operator", () => {
      produce(base, (x: any) => {
        expect("anArray" in x).toBe(true)
        expect(Reflect.has(x, "anArray")).toBe(true)
        expect("bla" in x).toBe(false)
        expect(Reflect.has(x, "bla")).toBe(false)
        expect(0 in x.anArray).toBe(true)
        expect("0" in x.anArray).toBe(true)
        expect(Reflect.has(x.anArray, 0)).toBe(true)
        expect(Reflect.has(x.anArray, "0")).toBe(true)
        expect(17 in x.anArray).toBe(false)
        expect("17" in x.anArray).toBe(false)
        expect(Reflect.has(x.anArray, 17)).toBe(false)
        expect(Reflect.has(x.anArray, "17")).toBe(false)
      })
    })
    it("'this' should not be bound anymore - 1", () => {
      const base = { x: 3 }
      produce(base, function (this: any) {
        expect(this).toBe(undefined)
      })
    })
    it("'this' should not be bound anymore - 2", () => {
      const y = produce(function (this: any) {
        expect(this).toBe(undefined)
      })
      y(undefined)
    })
    it("should be possible to use dynamic bound this", () => {
      const world = {
        counter: { count: 1 },
        inc: produce(function (this: any, x) {
          expect(this).toBe(world)
          x.counter.count = this.counter.count + 1
        }),
      }
      expect(world.inc(world).counter.count).toBe(2)
    })
    it("doesnt recurse into frozen structures if external data is frozen", () => {
      const frozen = {}
      Object.defineProperty(frozen, "x", {
        get() {
          throw "oops"
        },
        enumerable: true,
        configurable: true,
      })
      Object.freeze(frozen)
      expect(() => {
        produce({}, (d: any) => {
          d.x = frozen
        })
      }).not.toThrow()
    })
    it("supports the spread operator", () => {
      const base = { foo: { x: 0, y: 0 }, bar: [0, 0] }
      const y = produce(base, (x: any) => {
        x.foo = { x: 1, ...x.foo, y: 1 }
        x.bar = [1, ...x.bar, 1]
      })
      expect(y).toEqual({
        foo: { x: 0, y: 1 },
        bar: [1, 0, 0, 1],
      })
    })
    it("processes with lodash.set", () => {
      const base = [{ id: 1, a: 1 }]
      const y = produce(base, (x: any) => {
        lodash.set(x, "[0].a", 2)
      })
      expect(base[0]?.a).toEqual(1)
      expect(y[0]?.a).toEqual(2)
    })
    it("processes with lodash.find", () => {
      const base = [{ id: 1, a: 1 }]
      const y = produce(base, (x: any) => {
        const obj1 = lodash.find(x, { id: 1 })
        lodash.set(obj1, "a", 2)
      })
      expect(base[0]?.a).toEqual(1)
      expect(y[0]?.a).toEqual(2)
    })
    it("does not draft external data", () => {
      const externalData = { x: 3 }
      const base = {}
      const y: any = produce(base, (x: any) => {
        x.y = externalData
        x.y.x += 1
        externalData.x += 1
      })
      expect(y).toEqual({ y: { x: 5 } })
      expect(externalData.x).toBe(5)
      expect(y.y).toBe(externalData)
    })
    it("does not create new state unnecessary, #491", () => {
      const base = { highlight: true }
      const y1 = produce(base, (x: any) => {
        x.highlight = false
        x.highlight = true
      })
      expect(y1).not.toBe(base)
      const y2 = produce(base, (x: any) => {
        x.highlight = true
      })
      expect(y2).toBe(base)
    })
    autoFreeze &&
      test("issue #462 - frozen", () => {
        const base = {
          a: {
            value: "no",
          },
          b: {
            value: "no",
          },
        }
        const y = produce(base, (x: any) => {
          x.a.value = "im"
        })
        expect(() => {
          base.b.value = "yes"
        }).toThrowError(
          "Cannot assign to read only property 'value' of object '#<Object>'"
        )
        expect(() => {
          y.b.value = "yes"
        }).toThrowError(
          "Cannot assign to read only property 'value' of object '#<Object>'"
        )
      })
    autoFreeze &&
      test("issue #469, state not frozen", () => {
        const y = produce(
          {
            id: 1,
            tracks: [{ id: 1 }],
          },
          () => {}
        )
        expect(() => {
          y.id = 2
        }).toThrowError("Cannot assign to read only property 'id'")
        expect(() => {
          Object.assign(y, { id: 2 })
        }).toThrowError("Cannot assign to read only property 'id'")
      })
    describe("recipe functions", () => {
      it("can return a new object", () => {
        const base = { x: 3 }
        const y = produce(base, (x: any) => {
          return { x: x.x + 1 }
        })
        expect(y).not.toBe(base)
        expect(y).toEqual({ x: 4 })
      })
      it("can return the draft", () => {
        const base = { x: 3 }
        const y = produce(base, (x: any) => {
          x.x = 4
          return x
        })
        expect(y).not.toBe(base)
        expect(y).toEqual({ x: 4 })
      })
      it("can return an unmodified child draft", () => {
        const base = { a: {} }
        const y = produce(base, (x: any) => {
          return x.a
        })
        expect(y).toBe(base.a)
      })
      it("cannot return a modified child draft", () => {
        const base = { a: {} }
        expect(() => {
          produce(base, (x: any) => {
            x.a.b = 1
            return x.a
          })
        }).toThrowErrorMatchingSnapshot()
      })
      it("can return a frozen object", () => {
        const res = qi.deepFreeze([{ x: 3 }])
        expect(produce({}, () => res)).toBe(res)
      })
      it("can return an object with two references to another object", () => {
        const y: any = produce({}, (d: any) => {
          const obj = {}
          return { obj, arr: [obj] }
        })
        expect(y.obj).toBe(y.arr[0])
      })
      it("can return an object with two references to an unmodified draft", () => {
        const base = { a: {} }
        const y: any = produce(base, (x: any) => {
          return [x.a, x.a]
        })
        expect(y[0]).toBe(base.a)
        expect(y[0]).toBe(y[1])
      })
      it("cannot return an object that references itself", () => {
        const base: any = {}
        base.self = base
        expect(() => {
          produce(base, () => base.self)
        }).toThrowErrorMatchingSnapshot()
      })
    })
    describe("async recipe function", () => {
      it("can modify the draft", () => {
        const base = { a: 0, b: 0 }
        return produce(base, async (x: any) => {
          x.a = 1
          await Promise.resolve()
          x.b = 1
        }).then((y: any) => {
          expect(y).not.toBe(base)
          expect(y).toEqual({ a: 1, b: 1 })
        })
      })
      it("works with rejected promises", () => {
        let draft: any
        const base = { a: 0, b: 0 }
        const err = new Error("passed")
        return produce(base, (x: any) => {
          draft = x
          draft.b = 1
          return Promise.reject(err)
        }).then(
          () => {
            throw "failed"
          },
          (e: any) => {
            expect(e).toBe(err)
            if (!isProd) expect(() => draft.a).toThrowErrorMatchingSnapshot()
          }
        )
      })
      it("supports recursive produce calls after await", () => {
        const base = { obj: { k: 1 } }
        return produce(base, async (x: any) => {
          const obj = x.obj
          delete x.obj
          await Promise.resolve()
          x.a = produce({}, (d: any) => {
            d.b = obj
          })
          expect(Object.isFrozen(x.a)).toBeFalsy()
          obj.c = 1
        }).then((y: any) => {
          expect(y).not.toBe(base)
          expect(y).toEqual({
            a: { b: { k: 1, c: 1 } },
          })
        })
      })
      it("works with patches", () =>
        produceWithPatches({ a: 0 }, async (x: any) => {
          await Promise.resolve()
          x.a = 1
        }).then(([y, ps, invs]) => {
          expect(y).toEqual({ a: 1 })
          expect(ps).toEqual([{ op: "replace", path: ["a"], value: 1 }])
          expect(invs).toEqual([{ op: "replace", path: ["a"], value: 0 }])
        }))
    })
    it("throws when the draft is modified and another object is returned", () => {
      const base = { x: 3 }
      expect(() => {
        produce(base, (x: any) => {
          x.x = 4
          return { x: 5 }
        })
      }).toThrowErrorMatchingSnapshot()
    })
    it("should fix #117 - 1", () => {
      const reducer = (base: any, action: any) =>
        produce(base, (x: any) => {
          switch (action.type) {
            case "SET_STARTING_DOTS":
              return x.availableStartingDots.map(a => a)
            default:
              break
          }
        })
      const base = {
        availableStartingDots: [
          { dots: 4, count: 1 },
          { dots: 3, count: 2 },
          { dots: 2, count: 3 },
          { dots: 1, count: 4 },
        ],
      }
      const next = reducer(base, { type: "SET_STARTING_DOTS" })
      expect(next).toEqual(base.availableStartingDots)
      expect(next).not.toBe(base.availableStartingDots)
    })
    it("should fix #117 - 2", () => {
      const reducer = (x: any, recipe: any) =>
        produce(x, (x2: any) => {
          switch (recipe.type) {
            case "SET_STARTING_DOTS":
              return {
                dots: x2.availableStartingDots.map((a: any) => a),
              }
            default:
              return
          }
        })
      const base = {
        availableStartingDots: [
          { dots: 4, count: 1 },
          { dots: 3, count: 2 },
          { dots: 2, count: 3 },
          { dots: 1, count: 4 },
        ],
      }
      const y = reducer(base, { type: "SET_STARTING_DOTS" })
      expect(y).toEqual({ dots: base.availableStartingDots })
    })
    it("cannot always detect noop assignments - 0", () => {
      const base = { x: { y: 3 } }
      const y = produce(base, (x: any) => {
        const a = x.x
        x.x = a
      })
      expect(y).toBe(base)
    })
    it("cannot always detect noop assignments - 1", () => {
      const base = { x: { y: 3 } }
      const y = produce(base, (x: any) => {
        const a = x.x
        x.x = 4
        x.x = a
      })
      expect(y).not.toBe(base)
    })
    it("cannot always detect noop assignments - 2", () => {
      const base = { x: { y: 3 } }
      const y = produce(base, (x: any) => {
        const a = x.x
        a.y + 3
        x.x = 4
        x.x = a
      })
      expect(y).not.toBe(base)
    })
    it("cannot always detect noop assignments - 3", () => {
      const base = { x: 3 }
      const y = produce(base, (x: any) => {
        x.x = 3
      })
      expect(y).toBe(base)
    })
    it("cannot always detect noop assignments - 4", () => {
      const base = { x: 3 }
      const y = produce(base, (x: any) => {
        x.x = 4
        x.x = 3
      })
      expect(y).not.toBe(base)
    })
    it("cannot always detect noop assignments - 4", () => {
      const base = {}
      const [y, patches] = produceWithPatches(base, (x: any) => {
        x.x = 4
        delete x.x
      })
      expect(y).toEqual({})
      expect(patches).toEqual([])
      expect(y).not.toBe(base)
    })
    it("cannot produce undefined by returning undefined", () => {
      const base = 3
      expect(produce(base, () => 4)).toBe(4)
      expect(produce(base, () => null)).toBe(null)
      expect(produce(base, () => undefined)).toBe(3)
      expect(produce(base, () => {})).toBe(3)
      expect(produce(base, () => qi.Nothing)).toBe(undefined)
      expect(produce({}, () => undefined)).toEqual({})
      expect(produce({}, () => qi.Nothing)).toBe(undefined)
      expect(produce(3, () => qi.Nothing)).toBe(undefined)
      expect(produce(() => undefined)({})).toEqual({})
      expect(produce(() => qi.Nothing)({})).toBe(undefined)
      expect(produce(() => qi.Nothing)(3)).toBe(undefined)
    })
    describe("base state type", () => {
      testObjectTypes(produce)
      testLiteralTypes(produce)
    })
    afterEach(() => {
      expect(base).toBe(orig)
      expect(base).toEqual(createBaseState())
    })
    class Foo {}
    function createBaseState() {
      const data = {
        anInstance: new Foo(),
        anArray: [3, 2, { c: 3 }, 1],
        aMap: new Map<string, any>([
          ["jedi", { name: "Luke", skill: 10 }],
          ["jediTotal", 42],
          ["force", "these aren't the droids you're looking for"],
        ]),
        aSet: new Set(["Luke", 42, { jedi: "Yoda" }]),
        aProp: "hi",
        anObject: { nested: { yummie: true }, coffee: false },
      }
      return autoFreeze ? qi.deepFreeze(data) : data
    }
  })
  it(`works with spread #524 - ${name}`, () => {
    const base = { level1: { level2: { level3: "data" } } }
    produce(base, (x: any) => {
      return { ...x }
    })
    const y1 = produce(base, (x: any) => {
      const y11 = produce(x.level1, (x1: any) => {
        return { ...x1 }
      })
      x.level1 = y11
    })
    const y2 = produce(base, (x: any) => {
      const y21 = produce(x.level1, (x1: any) => {
        return { ...x1 }
      })
      return {
        level1: y21,
      }
    })
    const y3 = produce(base, (x: any) => {
      const y31 = produce(x.level1, (x1: any) => {
        return Object.assign({}, x1)
      })
      return Object.assign(x, {
        level1: y31,
      })
    })
    const expected = { level1: { level2: { level3: "data" } } }
    expect(y1).toEqual(expected)
    expect(y2).toEqual(expected)
    expect(y3).toEqual(expected)
  })
  it(`Something with nested producers #522 ${name}`, () => {
    function fac() {
      return {
        sub: {
          array: [
            { id: "id1", value: 0 },
            { id: "id2", value: 0 },
          ],
        },
        array: [
          { id: "id1", value: 0 },
          { id: "id2", value: 0 },
        ],
      }
    }
    const y = produce(x => {
      x.sub = y1(x.sub)
      x.array = y2(x.array)
    }, fac())
    const y1 = produce(x => {
      x.array = y2(x.array)
    })
    const y2 = produce(x => {
      x[0].value += 5
    })
    {
      const s = y(undefined)
      expect(s.array[0]?.value).toBe(5)
      expect(s.array.length).toBe(2)
      expect(s.array[1]).toMatchObject({
        id: "id2",
        value: 0,
      })
    }
    {
      const s = y(undefined)
      expect(s.sub.array[0]?.value).toBe(5)
      expect(s.sub.array.length).toBe(2)
      expect(s.sub.array[1]).toMatchObject({ id: "id2", value: 0 })
      expect(s.sub.array).toMatchObject(s.array)
    }
  })
  describe(`isDraft - ${name}`, () => {
    it("returns true for object drafts", () => {
      produce({}, x => {
        expect(qi.isDraft(x)).toBeTruthy()
      })
    })
    it("returns true for array drafts", () => {
      produce([], x => {
        expect(qi.isDraft(x)).toBeTruthy()
      })
    })
    it("returns true for objects nested in object drafts", () => {
      produce({ a: { b: {} } }, x => {
        expect(qi.isDraft(x.a)).toBeTruthy()
        expect(qi.isDraft(x.a.b)).toBeTruthy()
      })
    })
    it("returns false for new objects added to a draft", () => {
      produce({}, (x: any) => {
        x.a = {}
        expect(qi.isDraft(x.a)).toBeFalsy()
      })
    })
    it("returns false for objects returned by the producer", () => {
      const y = produce([], () => Object.create(null))
      expect(qi.isDraft(y)).toBeFalsy()
    })
    it("returns false for arrays returned by the producer", () => {
      const y = produce({}, _ => [])
      expect(qi.isDraft(y)).toBeFalsy()
    })
    it("returns false for object drafts returned by the producer", () => {
      const y = produce({}, x => x)
      expect(qi.isDraft(y)).toBeFalsy()
    })
    it("returns false for array drafts returned by the producer", () => {
      const y = produce([], x => x)
      expect(qi.isDraft(y)).toBeFalsy()
    })
  })
  describe(`complex nesting map / set / object`, () => {
    const a = { a: 1 }
    const b = { b: 2 }
    const c = { c: 3 }
    const set1 = new Set([a, b])
    const set2 = new Set([c])
    const map = new Map<string, any>([
      ["set1", set1],
      ["set2", set2],
    ])
    const base = { map }
    function first(x: any) {
      return Array.from(x.values())[0]
    }
    function second(x: any) {
      return Array.from(x.values())[1]
    }
    test(`modify deep object`, () => {
      const [y, ps] = produceWithPatches(base, (x: any) => {
        const v: any = first(x.map.get("set1"))
        expect(qi.original(v)).toBe(a)
        expect(v).toEqual(a)
        expect(v).not.toBe(a)
        v.a++
      })
      expect(y).toMatchSnapshot()
      expect(ps).toMatchSnapshot()
      expect(a.a).toBe(1)
      expect(base.map.get("set1")).toBe(set1)
      expect(first(base.map.get("set1"))).toBe(a)
      expect(y).not.toBe(base)
      expect(y.map).not.toBe(base.map)
      expect(y.map.get("set1")).not.toBe(base.map.get("set1"))
      expect(second(base.map.get("set1"))).toBe(b)
      expect(base.map.get("set2")).toBe(set2)
      expect(first(y.map.get("set1"))).toEqual({ a: 2 })
    })
    test(`modify deep object - keep value`, () => {
      const [y, ps] = produceWithPatches(base, (x: any) => {
        const v: any = first(x.map.get("set1"))
        expect(qi.original(v)).toBe(a)
        expect(v).toEqual(a)
        expect(v).not.toBe(a)
        v.a = 1
      })
      expect(a.a).toBe(1)
      expect(base.map.get("set1")).toBe(set1)
      expect(first(base.map.get("set1"))).toBe(a)
      expect(y).toBe(base)
      expect(y.map).toBe(base.map)
      expect(y.map.get("set1")).toBe(base.map.get("set1"))
      expect(first(y.map.get("set1"))).toBe(a)
      expect(second(base.map.get("set1"))).toBe(b)
      expect(base.map.get("set2")).toBe(set2)
      expect(ps.length).toBe(0)
    })
  })
  if (!autoFreeze) {
    describe("#613", () => {
      const base = {}
      const y: any = produce(base, (x: any) => {
        x.foo = produce({ bar: "baz" }, (x1: any) => {
          x1.bar = "baa"
        })
        x.foo.bar = "a"
      })
      expect(y.foo.bar).toBe("a")
    })
  }
}
function testObjectTypes(produce: any) {
  class Foo {
    foo: any
    constructor(x: any) {
      this.foo = x(this as any)[qi.immerable] = true
    }
  }
  const vs: any = {
    "empty object": {},
    "plain object": { a: 1, b: 2 },
    "object (no prototype)": Object.create(null),
    "empty array": [],
    "plain array": [1, 2],
    "class instance (draftable)": new Foo(1),
  }
  for (const n in vs) {
    const v = vs[n]
    const copy = qi.shallowCopy(v)
    testObjectType(n, v)
    testObjectType(n + " (frozen)", Object.freeze(copy))
  }
  function testObjectType(n: any, base: any) {
    describe(n, () => {
      it("creates a draft", () => {
        produce(base, (x: any) => {
          expect(x).not.toBe(base)
          expect(qi.shallowCopy(x)).toEqual(base)
        })
      })
      it("preserves the prototype", () => {
        const proto = Object.getPrototypeOf(base)
        produce(base, (x: any) => {
          expect(Object.getPrototypeOf(x)).toBe(proto)
        })
      })
      it("returns the base state when no changes are made", () => {
        expect(produce(base, () => {})).toBe(base)
      })
      it("returns a copy when changes are made", () => {
        const random = Math.random()
        const y = produce(base, (x: any) => {
          x[0] = random
        })
        expect(y).not.toBe(base)
        expect(y.constructor).toBe(base.constructor)
        expect(y[0]).toBe(random)
      })
    })
  }
  describe("class with getters", () => {
    class State {
      [qi.immerable] = true
      _bar = { baz: 1 }
      foo: any
      get bar() {
        return this._bar
      }
      syncFoo() {
        const v = this.bar.baz
        this.foo = v
        this.bar.baz++
      }
    }
    const base = new State()
    it("should use a method to assing a field using a getter that return a non primitive object", () => {
      const y = produce(base, (x: any) => {
        x.syncFoo()
      })
      expect(y.foo).toEqual(1)
      expect(y.bar).toEqual({ baz: 2 })
      expect(base.bar).toEqual({ baz: 1 })
    })
  })
  describe("super class with getters", () => {
    class Base {
      [qi.immerable] = true
      _bar = { baz: 1 }
      foo: any
      get bar() {
        return this._bar
      }
      syncFoo() {
        const v = this.bar.baz
        this.foo = v
        this.bar.baz++
      }
    }
    class State extends Base {}
    const base = new State()
    it("should use a method to assing a field using a getter that return a non primitive object", () => {
      const y = produce(base, (x: any) => {
        x.syncFoo()
      })
      expect(y.foo).toEqual(1)
      expect(y.bar).toEqual({ baz: 2 })
      expect(base.bar).toEqual({ baz: 1 })
    })
  })
  describe("class with setters", () => {
    class State {
      [qi.immerable] = true
      _bar = 0
      get bar() {
        return this._bar
      }
      set bar(x) {
        this._bar = x
      }
    }
    const base = new State()
    it("should define a field with a setter", () => {
      const y = produce(base, (x: any) => {
        x.bar = 1
        expect(x._bar).toEqual(1)
      })
      expect(y._bar).toEqual(1)
      expect(y.bar).toEqual(1)
      expect(base._bar).toEqual(0)
      expect(base.bar).toEqual(0)
    })
  })
  describe("setter only", () => {
    let setterCalled = 0
    class State {
      [qi.immerable] = true
      x = 0
      set y(v: any) {
        setterCalled++
        this.x = v
      }
    }
    const base = new State()
    const y = produce(base, (x: any) => {
      expect(x.y).toBeUndefined()
      x.y = 2
      expect(x.x).toBe(2)
    })
    expect(setterCalled).toBe(1)
    expect(y.x).toBe(2)
    expect(base.x).toBe(0)
  })
  describe("getter only", () => {
    let getterCalled = 0
    class State {
      [qi.immerable] = true
      x = 0
      get y() {
        getterCalled++
        return this.x
      }
    }
    const base = new State()
    const y = produce(base, (x: any) => {
      expect(x.y).toBe(0)
      expect(() => {
        x.y = 2
      }).toThrow("Cannot set property y")
      x.x = 2
      expect(x.y).toBe(2)
    })
    expect(y.x).toBe(2)
    expect(y.y).toBe(2)
    expect(base.x).toBe(0)
  })
  describe("own setter only", () => {
    let setterCalled = 0
    const base = {
      x: 0,
      set y(v: any) {
        setterCalled++
        this.x = v
      },
    }
    const y = produce(base, (x: any) => {
      expect(x.y).toBeUndefined()
      x.y = 2
      expect(x.x).toBe(0)
      expect(x.y).toBe(2)
    })
    expect(setterCalled).toBe(0)
    expect(y.x).toBe(0)
    expect(y.y).toBe(2)
    expect(base.x).toBe(0)
  })
  describe("own getter only", () => {
    let getterCalled = 0
    const base = {
      x: 0,
      get y() {
        getterCalled++
        return this.x
      },
    }
    const y = produce(base, (x: any) => {
      expect(x.y).toBe(0)
      x.y = 2
      expect(x.y).toBe(2)
      expect(x.x).toBe(0)
    })
    expect(getterCalled).not.toBe(1)
    expect(y.x).toBe(0)
    expect(y.y).toBe(2)
    expect(base.x).toBe(0)
  })
  describe("#620", () => {
    const customSymbol = Symbol("customSymbol")
    class TestClass {
      [qi.immerable] = true;
      [customSymbol] = 1
    }
    const base = new TestClass()
    const y1 = produce(base, (x: any) => {
      expect(x[customSymbol]).toBe(1)
      x[customSymbol] = 2
    })
    expect(y1).toEqual({
      [qi.immerable]: true,
      [customSymbol]: 2,
    })
    const y2 = produce(y1, (x: any) => {
      expect(x[customSymbol]).toBe(2)
      x[customSymbol] = 3
    })
    expect(y2).toEqual({
      [qi.immerable]: true,
      [customSymbol]: 3,
    })
  })
}
function testLiteralTypes(produce: any) {
  class Foo {}
  const vs = {
    "falsy number": 0,
    "truthy number": 1,
    "negative number": -1,
    NaN: NaN,
    infinity: 1 / 0,
    true: true,
    false: false,
    "empty string": "",
    "truthy string": "1",
    null: null,
    undefined: undefined,
    function: () => {},
    "regexp object": /.+/g,
    "boxed number": new Number(0),
    "boxed string": new String(""),
    "boxed boolean": new Boolean(),
    "date object": new Date(),
    "class instance (not draftable)": new Foo(),
  }
  for (const n in vs) {
    describe(n, () => {
      const base = (vs as any)[n]
      if (base && typeof base == "object") {
        it("does not return a copy when changes are made", () => {
          expect(() =>
            produce(base, (x: any) => {
              x.foo = true
            })
          ).toThrowError(
            isProd
              ? "[Immer] minified error nr: 21"
              : "produce can only be called on things that are draftable"
          )
        })
      } else {
        it("does not create a draft", () => {
          produce(base, (x: any) => {
            expect(x).toBe(base)
          })
        })
        it("returns the base state when no changes are made", () => {
          expect(produce(base, () => {})).toBe(base)
        })
      }
    })
  }
}
function enumOnly(x: any) {
  const copy = Array.isArray(x) ? x.slice() : Object.assign({}, x)
  qi.each(copy, (k, v) => {
    if (v && typeof v === "object") {
      copy[k] = enumOnly(v)
    }
  })
  return copy
}
function isEnumerable(x: any, k: PropertyKey) {
  const y = Object.getOwnPropertyDescriptor(x, k)
  return y && y.enumerable ? true : false
}
