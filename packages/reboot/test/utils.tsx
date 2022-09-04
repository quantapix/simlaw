import { createChained, getDirection } from "../src/utils.jsx"

describe("getDirection", () => {
  it("Should return start for left", () => {
    expect(getDirection("left", false)).toEqual("start")
  })
  it("Should return end for left in RTL", () => {
    expect(getDirection("left", true)).toEqual("end")
  })
  it("Should return end for right", () => {
    expect(getDirection("right", false)).toEqual("end")
  })
  it("Should return start for right in RTL", () => {
    expect(getDirection("right", true)).toEqual("start")
  })
})
describe("createChained", () => {
  it("returns null with no arguments", () => {
    expect(createChained()).toEqual(null)
  })
  it("returns original function when single function is provided", () => {
    const f = jest.fn()
    expect(createChained(f)).toEqual(f)
  })
  it("wraps two functions with another that invokes both when called", () => {
    const f1 = jest.fn()
    const f2 = jest.fn()
    const y = createChained(f1, f2)
    expect(y.should.not.equal(f1).and).not.toEqual(f2)
    expect(f1).not.toHaveBeenCalled()
    expect(f2).not.toHaveBeenCalled()
    y()
    expect(f1).toHaveBeenCalledTimes(1)
    expect(f2).toHaveBeenCalledTimes(1)
  })
  it("wraps multiple functions and invokes them in the order provided", () => {
    const results: number[] = []
    const func1 = () => results.push(1)
    const func2 = () => results.push(2)
    const func3 = () => results.push(3)
    const chained = createChained(func1, func2, func3)
    chained()
    expect(results).toEqual([1, 2, 3])
  })
  it("forwards arguments to all chained functions", () => {
    const in1 = "herpa derpa"
    const in2 = {
      herpa: "derpa",
    }
    const func = (arg1: any, arg2: any) => {
      expect(arg1).toEqual(in1)
      expect(arg2).toEqual(in2)
    }
    const chained = createChained(func, func, func)
    chained(in1, in2)
  })
  it("throws when func is not provided", () => {
    expect(() => {
      createChained({ herpa: "derpa" })
    }).toThrow(/Invalid Argument Type/)
  })
  it("works with new Function call", () => {
    const results: any = []
    const func1 = new Function("results", "results.push(1);")
    const func2 = new Function("results", "results.push(2);")
    const chained = createChained(func1, func2)
    chained(results)
    expect(results).toEqual([1, 2])
  })
})
