/* eslint-disable no-new-func */
import { createChained } from "../src/utils.jsx"

describe("createChained", () => {
  test("returns null with no arguments", () => {
    expect(createChained()).to.equal(null)
  })

  test("returns original function when single function is provided", () => {
    const func1 = sinon.stub()
    createChained(func1).should.equal(func1)
  })

  test("wraps two functions with another that invokes both when called", () => {
    const func1 = sinon.stub()
    const func2 = sinon.stub()
    const chained = createChained(func1, func2)

    chained.should.not.equal(func1).and.should.not.equal(func2)

    func1.should.not.have.been.called
    func2.should.not.have.been.called

    chained()

    func1.should.have.been.calledOnce
    func2.should.have.been.calledOnce
  })

  test("wraps multiple functions and invokes them in the order provided", () => {
    const results: number[] = []
    const func1 = () => results.push(1)
    const func2 = () => results.push(2)
    const func3 = () => results.push(3)
    const chained = createChained(func1, func2, func3)
    chained()
    results.should.eql([1, 2, 3])
  })

  test("forwards arguments to all chained functions", () => {
    const in1 = "herpa derpa"
    const in2 = {
      herpa: "derpa",
    }

    const func = (arg1: any, arg2: any) => {
      arg1.should.equal(in1)
      arg2.should.equal(in2)
    }

    const chained = createChained(func, func, func)
    chained(in1, in2)
  })

  test("throws when func is not provided", () => {
    expect(() => {
      createChained({ herpa: "derpa" })
    }).to.throw(/Invalid Argument Type/)
  })

  test("works with new Function call", () => {
    const results = []
    const func1 = new Function("results", "results.push(1);")
    const func2 = new Function("results", "results.push(2);")
    const chained = createChained(func1, func2)
    chained(results)
    results.should.eql([1, 2])
  })
})
