import type * as qt from "../q0/q0_b.js"
import * as q1 from "../q1/index.js"
import * as q3 from "./q3_a.js"
beforeAll(() => {})
describe("mode", () => {
  const a = new q1.A().update(1)
  const b = new q1.B().update(a)
  const c = new q1.C().update([b])
  const ab = new q3.AB().update(111)
  const bc = new q3.BC().update(222)
  const ns1 = [a, b, ab, c, bc]
  beforeEach(() => {})
  test("walk", () => {
    expect(ns1.filter(n => n.walk(n => !!n?.n2)).length).toBe(2)
  })
  test("walks", () => {
    const ns2 = new q1.Nodes(...ns1)
    function walks(ns?: qt.Nodes) {
      const vs = ns?.map(n => n.n2)
      return vs?.filter(n => !!n).length
    }
    expect(ns2.walk(undefined, walks)).toBe(2)
  })
})
