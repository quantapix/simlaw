/* eslint-disable @typescript-eslint/no-empty-function */
import { AttachedProperty } from "../../src/lumino/properties.js"
class Model {
  dummyValue = 42
}
describe("../../src/lumino/properties", () => {
  describe("AttachedProperty", () => {
    describe("#constructor()", () => {
      it("should accept a single options argument", () => {
        const p = new AttachedProperty<Model, number>({
          name: "p",
          create: owner => 42,
          coerce: (owner, value) => Math.max(0, value),
          compare: (oldValue, newValue) => oldValue === newValue,
          changed: (owner, oldValue, newValue) => {},
        })
        expect(p).to.be.an.instanceof(AttachedProperty)
      })
    })
    describe("#name", () => {
      it("should be the name provided to the constructor", () => {
        const create = () => 0
        const p = new AttachedProperty<Model, number>({ name: "p", create })
        expect(p.name).toEqual("p")
      })
    })
    describe("#get()", () => {
      it("should return the current value of the property", () => {
        let tick = 42
        const create = () => tick++
        const p1 = new AttachedProperty<Model, number>({ name: "p1", create })
        const p2 = new AttachedProperty<Model, number>({ name: "p2", create })
        const p3 = new AttachedProperty<Model, number>({ name: "p3", create })
        const m1 = new Model()
        const m2 = new Model()
        const m3 = new Model()
        expect(p1.get(m1)).toEqual(42)
        expect(p2.get(m1)).toEqual(43)
        expect(p3.get(m1)).toEqual(44)
        expect(p1.get(m2)).toEqual(45)
        expect(p2.get(m2)).toEqual(46)
        expect(p3.get(m2)).toEqual(47)
        expect(p1.get(m3)).toEqual(48)
        expect(p2.get(m3)).toEqual(49)
        expect(p3.get(m3)).toEqual(50)
      })
      it("should not invoke the coerce function", () => {
        let called = false
        const create = () => 0
        const coerce = (m: Model, v: number) => ((called = true), v)
        const p1 = new AttachedProperty<Model, number>({
          name: "p1",
          create,
          coerce,
        })
        const p2 = new AttachedProperty<Model, number>({
          name: "p2",
          create,
          coerce,
        })
        const p3 = new AttachedProperty<Model, number>({
          name: "p3",
          create,
          coerce,
        })
        const m1 = new Model()
        const m2 = new Model()
        const m3 = new Model()
        p1.get(m1)
        p2.get(m1)
        p3.get(m1)
        p1.get(m2)
        p2.get(m2)
        p3.get(m2)
        p1.get(m3)
        p2.get(m3)
        p3.get(m3)
        expect(called).toEqual(false)
      })
      it("should not invoke the compare function", () => {
        let called = false
        const create = () => 0
        const compare = (v1: number, v2: number) => ((called = true), v1 === v2)
        const p1 = new AttachedProperty<Model, number>({
          name: "p1",
          create,
          compare,
        })
        const p2 = new AttachedProperty<Model, number>({
          name: "p2",
          create,
          compare,
        })
        const p3 = new AttachedProperty<Model, number>({
          name: "p3",
          create,
          compare,
        })
        const m1 = new Model()
        const m2 = new Model()
        const m3 = new Model()
        p1.get(m1)
        p2.get(m1)
        p3.get(m1)
        p1.get(m2)
        p2.get(m2)
        p3.get(m2)
        p1.get(m3)
        p2.get(m3)
        p3.get(m3)
        expect(called).toEqual(false)
      })
      it("should not invoke the changed function", () => {
        let called = false
        const create = () => 0
        const changed = () => {
          called = true
        }
        const p1 = new AttachedProperty<Model, number>({
          name: "p1",
          create,
          changed,
        })
        const p2 = new AttachedProperty<Model, number>({
          name: "p2",
          create,
          changed,
        })
        const p3 = new AttachedProperty<Model, number>({
          name: "p3",
          create,
          changed,
        })
        const m1 = new Model()
        const m2 = new Model()
        const m3 = new Model()
        p1.get(m1)
        p2.get(m1)
        p3.get(m1)
        p1.get(m2)
        p2.get(m2)
        p3.get(m2)
        p1.get(m3)
        p2.get(m3)
        p3.get(m3)
        expect(called).toEqual(false)
      })
    })
    describe("#set()", () => {
      it("should set the current value of the property", () => {
        const create = () => 0
        const p1 = new AttachedProperty<Model, number>({ name: "p1", create })
        const p2 = new AttachedProperty<Model, number>({ name: "p2", create })
        const p3 = new AttachedProperty<Model, number>({ name: "p3", create })
        const m1 = new Model()
        const m2 = new Model()
        const m3 = new Model()
        p1.set(m1, 1)
        p1.set(m2, 2)
        p1.set(m3, 3)
        p2.set(m1, 4)
        p2.set(m2, 5)
        p2.set(m3, 6)
        p3.set(m1, 7)
        p3.set(m2, 8)
        p3.set(m3, 9)
        expect(p1.get(m1)).toEqual(1)
        expect(p1.get(m2)).toEqual(2)
        expect(p1.get(m3)).toEqual(3)
        expect(p2.get(m1)).toEqual(4)
        expect(p2.get(m2)).toEqual(5)
        expect(p2.get(m3)).toEqual(6)
        expect(p3.get(m1)).toEqual(7)
        expect(p3.get(m2)).toEqual(8)
        expect(p3.get(m3)).toEqual(9)
      })
      it("should invoke the changed function if the value changes", () => {
        const oldvals: number[] = []
        const newvals: number[] = []
        const changed = (m: Model, o: number, n: number) => {
          oldvals.push(o)
          newvals.push(n)
        }
        const create = () => 0
        const p1 = new AttachedProperty<Model, number>({
          name: "p1",
          create,
          changed,
        })
        const p2 = new AttachedProperty<Model, number>({
          name: "p2",
          create,
          changed,
        })
        const p3 = new AttachedProperty<Model, number>({
          name: "p3",
          create,
          changed,
        })
        const m1 = new Model()
        const m2 = new Model()
        const m3 = new Model()
        p1.set(m1, 1)
        p1.set(m2, 2)
        p1.set(m3, 3)
        p2.set(m1, 4)
        p2.set(m2, 5)
        p2.set(m3, 6)
        p3.set(m1, 7)
        p3.set(m2, 8)
        p3.set(m3, 9)
        expect(oldvals).to.deep.equal([0, 0, 0, 0, 0, 0, 0, 0, 0])
        expect(newvals).to.deep.equal([1, 2, 3, 4, 5, 6, 7, 8, 9])
      })
      it("should invoke the coerce function on the new value", () => {
        const create = () => 0
        const coerce = (o: Model, v: number) => Math.max(0, v)
        const p = new AttachedProperty<Model, number>({
          name: "p",
          create,
          coerce,
        })
        const m = new Model()
        p.set(m, -10)
        expect(p.get(m)).toEqual(0)
        p.set(m, 10)
        expect(p.get(m)).toEqual(10)
        p.set(m, -42)
        expect(p.get(m)).toEqual(0)
        p.set(m, 42)
        expect(p.get(m)).toEqual(42)
        p.set(m, 0)
        expect(p.get(m)).toEqual(0)
      })
      it("should not invoke the compare function if there is no changed function", () => {
        let called = false
        const create = () => 0
        const compare = (v1: number, v2: number) => ((called = true), v1 === v2)
        const p = new AttachedProperty<Model, number>({
          name: "p",
          create,
          compare,
        })
        const m = new Model()
        p.set(m, 42)
        expect(called).toEqual(false)
      })
      it("should invoke the compare function if there is a changed function", () => {
        let called = false
        const create = () => 0
        const changed = () => {}
        const compare = (v1: number, v2: number) => ((called = true), v1 === v2)
        const p = new AttachedProperty<Model, number>({
          name: "p",
          create,
          compare,
          changed,
        })
        const m = new Model()
        p.set(m, 42)
        expect(called).toEqual(true)
      })
      it("should not invoke the changed function if the value does not change", () => {
        let called = false
        const create = () => 1
        const changed = () => {
          called = true
        }
        const compare = (v1: number, v2: number) => true
        const p1 = new AttachedProperty<Model, number>({
          name: "p1",
          create,
          changed,
        })
        const p2 = new AttachedProperty<Model, number>({
          name: "p2",
          create,
          compare,
          changed,
        })
        const m = new Model()
        p1.set(m, 1)
        p1.set(m, 1)
        p2.set(m, 1)
        p2.set(m, 2)
        p2.set(m, 3)
        p2.set(m, 4)
        expect(called).toEqual(false)
      })
    })
    describe("#coerce()", () => {
      it("should coerce the current value of the property", () => {
        let min = 20
        let max = 50
        const create = () => 0
        const coerce = (m: Model, v: number) => Math.max(min, Math.min(v, max))
        const p = new AttachedProperty<Model, number>({
          name: "p",
          create,
          coerce,
        })
        const m = new Model()
        p.set(m, 10)
        expect(p.get(m)).toEqual(20)
        min = 30
        p.coerce(m)
        expect(p.get(m)).toEqual(30)
        min = 10
        max = 20
        p.coerce(m)
        expect(p.get(m)).toEqual(20)
      })
      it("should invoke the changed function if the value changes", () => {
        let called = false
        const create = () => 0
        const coerce = (m: Model, v: number) => Math.max(20, v)
        const changed = () => {
          called = true
        }
        const p = new AttachedProperty<Model, number>({
          name: "p",
          create,
          coerce,
          changed,
        })
        const m = new Model()
        p.coerce(m)
        expect(called).toEqual(true)
      })
      it("should use the default value as old value if value is not yet set", () => {
        let oldval = -1
        let newval = -1
        const create = () => 0
        const coerce = (m: Model, v: number) => Math.max(20, v)
        const changed = (m: Model, o: number, n: number) => {
          oldval = o
          newval = n
        }
        const p = new AttachedProperty<Model, number>({
          name: "p",
          create,
          coerce,
          changed,
        })
        const m = new Model()
        p.coerce(m)
        expect(oldval).toEqual(0)
        expect(newval).toEqual(20)
      })
      it("should not invoke the compare function if there is no changed function", () => {
        let called = false
        const create = () => 0
        const compare = (v1: number, v2: number) => ((called = true), v1 === v2)
        const p = new AttachedProperty<Model, number>({
          name: "p",
          create,
          compare,
        })
        const m = new Model()
        p.coerce(m)
        expect(called).toEqual(false)
      })
      it("should invoke the compare function if there is a changed function", () => {
        let called = false
        const create = () => 0
        const changed = () => {}
        const compare = (v1: number, v2: number) => ((called = true), v1 === v2)
        const p = new AttachedProperty<Model, number>({
          name: "p",
          create,
          compare,
          changed,
        })
        const m = new Model()
        p.coerce(m)
        expect(called).toEqual(true)
      })
      it("should not invoke the changed function if the value does not change", () => {
        let called = false
        const create = () => 0
        const changed = () => {
          called = true
        }
        const p = new AttachedProperty<Model, number>({
          name: "p",
          create,
          changed,
        })
        const m = new Model()
        p.coerce(m)
        expect(called).toEqual(false)
      })
    })
    describe(".clearData()", () => {
      it("should clear all property data for a property owner", () => {
        const create = () => 42
        const p1 = new AttachedProperty<Model, number>({ name: "p1", create })
        const p2 = new AttachedProperty<Model, number>({ name: "p2", create })
        const p3 = new AttachedProperty<Model, number>({ name: "p3", create })
        const m1 = new Model()
        const m2 = new Model()
        const m3 = new Model()
        p1.set(m1, 1)
        p1.set(m2, 2)
        p1.set(m3, 3)
        p2.set(m1, 4)
        p2.set(m2, 5)
        p2.set(m3, 6)
        p3.set(m1, 7)
        p3.set(m2, 8)
        p3.set(m3, 9)
        expect(p1.get(m1)).toEqual(1)
        expect(p1.get(m2)).toEqual(2)
        expect(p1.get(m3)).toEqual(3)
        expect(p2.get(m1)).toEqual(4)
        expect(p2.get(m2)).toEqual(5)
        expect(p2.get(m3)).toEqual(6)
        expect(p3.get(m1)).toEqual(7)
        expect(p3.get(m2)).toEqual(8)
        expect(p3.get(m3)).toEqual(9)
        AttachedProperty.clearData(m1)
        expect(p1.get(m1)).toEqual(42)
        expect(p1.get(m2)).toEqual(2)
        expect(p1.get(m3)).toEqual(3)
        expect(p2.get(m1)).toEqual(42)
        expect(p2.get(m2)).toEqual(5)
        expect(p2.get(m3)).toEqual(6)
        expect(p3.get(m1)).toEqual(42)
        expect(p3.get(m2)).toEqual(8)
        expect(p3.get(m3)).toEqual(9)
        AttachedProperty.clearData(m2)
        expect(p1.get(m1)).toEqual(42)
        expect(p1.get(m2)).toEqual(42)
        expect(p1.get(m3)).toEqual(3)
        expect(p2.get(m1)).toEqual(42)
        expect(p2.get(m2)).toEqual(42)
        expect(p2.get(m3)).toEqual(6)
        expect(p3.get(m1)).toEqual(42)
        expect(p3.get(m2)).toEqual(42)
        expect(p3.get(m3)).toEqual(9)
        AttachedProperty.clearData(m3)
        expect(p1.get(m1)).toEqual(42)
        expect(p1.get(m2)).toEqual(42)
        expect(p1.get(m3)).toEqual(42)
        expect(p2.get(m1)).toEqual(42)
        expect(p2.get(m2)).toEqual(42)
        expect(p2.get(m3)).toEqual(42)
        expect(p3.get(m1)).toEqual(42)
        expect(p3.get(m2)).toEqual(42)
        expect(p3.get(m3)).toEqual(42)
      })
    })
  })
})
