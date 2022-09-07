import "./json.spec"
import "./mime.spec"
import "./promise.spec"
import "./token.spec"
import {
  JSONArray,
  JSONExt,
  JSONObject,
  JSONPrimitive,
  PartialJSONObject,
  MimeData,
  PromiseDelegate,
  Token,
} from "../../src/lumino/utils.js"

interface IFoo extends PartialJSONObject {
  bar?: string
}
describe("../../src/lumino/coreutils", () => {
  describe("JSONExt", () => {
    describe("isPrimitive()", () => {
      it("should return `true` if the value is a primitive", () => {
        expect(JSONExt.isPrimitive(null)).toEqual(true)
        expect(JSONExt.isPrimitive(false)).toEqual(true)
        expect(JSONExt.isPrimitive(true)).toEqual(true)
        expect(JSONExt.isPrimitive(1)).toEqual(true)
        expect(JSONExt.isPrimitive("1")).toEqual(true)
      })
      it("should return `false` if the value is not a primitive", () => {
        expect(JSONExt.isPrimitive([])).toEqual(false)
        expect(JSONExt.isPrimitive({})).toEqual(false)
      })
    })
    describe("isArray()", () => {
      it("should test whether a JSON value is an array", () => {
        expect(JSONExt.isArray([])).toEqual(true)
        expect(JSONExt.isArray(null)).toEqual(false)
        expect(JSONExt.isArray(1)).toEqual(false)
      })
    })
    describe("isObject()", () => {
      it("should test whether a JSON value is an object", () => {
        expect(JSONExt.isObject({ a: 1 })).toEqual(true)
        expect(JSONExt.isObject({})).toEqual(true)
        expect(JSONExt.isObject([])).toEqual(false)
        expect(JSONExt.isObject(1)).toEqual(false)
      })
    })
    describe("deepEqual()", () => {
      it("should compare two JSON values for deep equality", () => {
        expect(JSONExt.deepEqual([], [])).toEqual(true)
        expect(JSONExt.deepEqual([1], [1])).toEqual(true)
        expect(JSONExt.deepEqual({}, {})).toEqual(true)
        expect(JSONExt.deepEqual({ a: [] }, { a: [] })).toEqual(true)
        expect(
          JSONExt.deepEqual({ a: { b: null } }, { a: { b: null } })
        ).toEqual(true)
        expect(JSONExt.deepEqual({ a: "1" }, { a: "1" })).toEqual(true)
        expect(
          JSONExt.deepEqual({ a: { b: null } }, { a: { b: "1" } })
        ).toEqual(false)
        expect(JSONExt.deepEqual({ a: [] }, { a: [1] })).toEqual(false)
        expect(JSONExt.deepEqual([1], [1, 2])).toEqual(false)
        expect(JSONExt.deepEqual(null, [1, 2])).toEqual(false)
        expect(JSONExt.deepEqual([1], {})).toEqual(false)
        expect(JSONExt.deepEqual([1], [2])).toEqual(false)
        expect(JSONExt.deepEqual({}, { a: 1 })).toEqual(false)
        expect(JSONExt.deepEqual({ b: 1 }, { a: 1 })).toEqual(false)
      })
      it("should handle optional keys on partials", () => {
        const a: IFoo = {}
        const b: IFoo = { bar: "a" }
        const c: IFoo = { bar: undefined }
        expect(JSONExt.deepEqual(a, b)).toEqual(false)
        expect(JSONExt.deepEqual(a, c)).toEqual(true)
        expect(JSONExt.deepEqual(c, a)).toEqual(true)
      })
      it("should equate an object to its deepCopy", () => {
        const a: IFoo = {}
        const b: IFoo = { bar: "a" }
        const c: IFoo = { bar: undefined }
        expect(JSONExt.deepEqual(a, JSONExt.deepCopy(a))).toEqual(true)
        expect(JSONExt.deepEqual(b, JSONExt.deepCopy(b))).toEqual(true)
        expect(JSONExt.deepEqual(c, JSONExt.deepCopy(c))).toEqual(true)
      })
    })
    describe("deepCopy()", () => {
      it("should deep copy an object", () => {
        const v1: JSONPrimitive = null
        const v2: JSONPrimitive = true
        const v3: JSONPrimitive = false
        const v4: JSONPrimitive = "foo"
        const v5: JSONPrimitive = 42
        const v6: JSONArray = [1, 2, 3, [4, 5, 6], { a: 12, b: [4, 5] }, false]
        const v7: JSONObject = { a: false, b: [null, [1, 2]], c: { a: 1 } }
        const r1 = JSONExt.deepCopy(v1)
        const r2 = JSONExt.deepCopy(v2)
        const r3 = JSONExt.deepCopy(v3)
        const r4 = JSONExt.deepCopy(v4)
        const r5 = JSONExt.deepCopy(v5)
        const r6 = JSONExt.deepCopy(v6)
        const r7 = JSONExt.deepCopy(v7)
        expect(v1).toEqual(r1)
        expect(v2).toEqual(r2)
        expect(v3).toEqual(r3)
        expect(v4).toEqual(r4)
        expect(v5).toEqual(r5)
        expect(v6).to.deep.equal(r6)
        expect(v7).to.deep.equal(r7)
        expect(v6).to.not.equal(r6)
        expect(v6[3]).to.not.equal(r6[3])
        expect(v6[4]).to.not.equal(r6[4])
        expect((v6[4] as JSONObject)["b"]).to.not.equal(
          (r6[4] as JSONObject)["b"]
        )
        expect(v7).to.not.equal(r7)
        expect(v7["b"]).to.not.equal(r7["b"])
        expect((v7["b"] as JSONArray)[1]).to.not.equal(
          (r7["b"] as JSONArray)[1]
        )
        expect(v7["c"]).to.not.equal(r7["c"])
      })
      it("should handle optional keys on partials", () => {
        const v1: IFoo = {}
        const v2: IFoo = { bar: "a" }
        const v3 = { a: false, b: { bar: undefined } }
        const r1 = JSONExt.deepCopy(v1)
        const r2 = JSONExt.deepCopy(v2)
        const r3 = JSONExt.deepCopy(v3)
        expect(Object.keys(r1).length).toEqual(0)
        expect(v2.bar).toEqual(r2.bar)
        expect(Object.keys(r3.b).length).toEqual(0)
      })
    })
  })
})
describe("../../src/lumino/coreutils", () => {
  describe("MimeData", () => {
    describe("#types()", () => {
      it("should get an array of the MIME types contained within the dataset", () => {
        const data = new MimeData()
        data.setData("foo", 1)
        data.setData("bar", "1")
        data.setData("baz", { foo: 1, bar: 2 })
        expect(data.types()).to.deep.equal(["foo", "bar", "baz"])
      })
      it("should be in order of insertion", () => {
        const data = new MimeData()
        data.setData("a", 1)
        data.setData("b", "1")
        data.setData("c", { foo: 1, bar: 2 })
        data.setData("a", 4)
        expect(data.types()).to.deep.equal(["b", "c", "a"])
        data.setData("d", null)
        expect(data.types()).to.deep.equal(["b", "c", "a", "d"])
      })
    })
    describe("#hasData()", () => {
      it("should return `true` if the dataset contains the value", () => {
        const data = new MimeData()
        data.setData("foo", 1)
        expect(data.hasData("foo")).toEqual(true)
      })
      it("should return `false` if the dataset does not contain the value", () => {
        const data = new MimeData()
        data.setData("foo", 1)
        expect(data.hasData("bar")).toEqual(false)
      })
    })
    describe("#getData()", () => {
      it("should get the value for the given MIME type", () => {
        const data = new MimeData()
        const value = { foo: 1, bar: "10" }
        data.setData("baz", value)
        expect(data.getData("baz")).toEqual(value)
      })
      it("should return `undefined` if the dataset does not contain a value for the type", () => {
        const data = new MimeData()
        expect(data.getData("foo")).toEqual(undefined)
      })
    })
    describe("#setData()", () => {
      it("should set the data value for the given MIME type", () => {
        const data = new MimeData()
        const value = { foo: 1, bar: "10" }
        data.setData("baz", value)
        expect(data.getData("baz")).toEqual(value)
      })
      it("should overwrite any previous entry for the MIME type", () => {
        const data = new MimeData()
        data.setData("foo", 1)
        data.setData("foo", 2)
        expect(data.getData("foo")).toEqual(2)
      })
    })
    describe("#clearData()", () => {
      it("should remove the data entry for the given MIME type", () => {
        const data = new MimeData()
        data.setData("foo", 1)
        data.clearData("foo")
        expect(data.getData("foo")).toEqual(undefined)
      })
      it("should be a no-op if there is no entry for the given MIME type", () => {
        const data = new MimeData()
        data.clearData("foo")
        expect(data.getData("foo")).toEqual(undefined)
      })
    })
    describe("#clear()", () => {
      it("should remove all entries from the dataset", () => {
        const data = new MimeData()
        data.setData("foo", 1)
        data.setData("bar", "1")
        data.setData("baz", { foo: 1, bar: 2 })
        data.clear()
        expect(data.types()).to.deep.equal([])
      })
    })
  })
})
describe("../../src/lumino/coreutils", () => {
  describe("PromiseDelegate", () => {
    describe("#constructor()", () => {
      it("should create a new promise delegate", () => {
        const delegate = new PromiseDelegate<number>()
        expect(delegate).to.be.an.instanceof(PromiseDelegate)
      })
    })
    describe("#promise", () => {
      it("should get the underlying promise", () => {
        const delegate = new PromiseDelegate<number>()
        expect(delegate.promise).to.be.an.instanceof(Promise)
      })
    })
    describe("#resolve()", () => {
      it("should resolve the underlying promise", done => {
        const delegate = new PromiseDelegate<number>()
        delegate.promise.then(value => {
          expect(value).toEqual(1)
          done()
        })
        delegate.resolve(1)
      })
      it("should accept a promise to the value", done => {
        const delegate = new PromiseDelegate<number>()
        delegate.promise.then(value => {
          expect(value).toEqual(4)
          done()
        })
        delegate.resolve(Promise.resolve(4))
      })
    })
    describe("#reject()", () => {
      it("should reject the underlying promise", done => {
        const delegate = new PromiseDelegate<number>()
        delegate.promise.catch(reason => {
          expect(reason).toEqual("foo")
          done()
        })
        delegate.reject("foo")
      })
    })
  })
})
interface ITestInterface {
  foo: number
  bar: string
}
describe("../../src/lumino/coreutils", () => {
  describe("Token", () => {
    describe("#constructor", () => {
      it("should accept a name for the token", () => {
        const token = new Token<ITestInterface>("ITestInterface")
        expect(token).to.be.an.instanceof(Token)
      })
    })
    describe("#name", () => {
      it("should be the name for the token", () => {
        const token = new Token<ITestInterface>("ITestInterface")
        expect(token.name).toEqual("ITestInterface")
      })
    })
  })
})
