import { createChained } from "../src/utils.jsx"

describe("createChained", () => {
  it("returns null with no arguments", () => {
    expect(createChained()).toEqual(null)
  })

  it("returns original function when single function is provided", () => {
    const func1 = sinon.stub()
    expect(createChained(func1)).toEqual(func1)
  })

  it("wraps two functions with another that invokes both when called", () => {
    const func1 = sinon.stub()
    const func2 = sinon.stub()
    const chained = createChained(func1, func2)

    expect(chained.should.not.equal(func1).and).to.not.equal(func2)

    expect(func1).not.toHaveBeenCalled()
    expect(func2).not.toHaveBeenCalled()

    chained()

    expect(func1).toHaveBeenCalledTimes(1)
    expect(func2).toHaveBeenCalledTimes(1)
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
    const results = []
    const func1 = new Function("results", "results.push(1);")
    const func2 = new Function("results", "results.push(2);")
    const chained = createChained(func1, func2)
    chained(results)
    expect(results).toEqual([1, 2])
  })
})
