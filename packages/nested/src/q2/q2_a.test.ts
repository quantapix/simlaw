/* eslint-disable @typescript-eslint/no-empty-function */
import { Kind } from "../q0/q0_b.js"
import * as q1 from "../q1/index.js"
import * as q2 from "./q2_a.js"
import type * as qt from "../q0/q0_b.js"
beforeAll(() => {})
describe("modc", () => {
  const qf = q2.newFrame(q1.newFrame({}))
  const a = new q1.A().update(1)
  const b = new q1.B().update(a)
  const c = new q1.C().update([b])
  c.c1 = 10
  beforeEach(() => {})
  test("qf", () => {
    expect(qf.flip).toBeUndefined
    qf.flip = true
    expect(qf.flip).toBeTruthy
  })
  test("is", () => {
    expect(qf.is.kind(q1.B)).toBeFalsy
    expect(qf.is.kind(q1.B, a)).toBeFalsy
    expect(qf.is.kind(q1.B, b)).toBeTruthy
    expect(qf.is.a(Kind.A)).toBeTruthy
    expect(qf.is.a(a)).toBeTruthy
    expect(qf.is.a(b)).toBeFalsy
    expect(qf.is.b(a)).toBeFalsy
    expect(qf.is.b(b)).toBeTruthy
    expect(qf.is.c(c)).toBeTruthy
  })
  test("node.is", () => {
    expect(qf.node.is.kind(q1.B)).toBeFalsy
    expect(qf.node.is.kind(q1.B, a)).toBeFalsy
    expect(qf.node.is.kind(q1.B, b)).toBeTruthy
    expect(qf.node.is.a(a)).toBeTruthy
    expect(qf.node.is.a(b)).toBeFalsy
    expect(qf.node.is.b(a)).toBeFalsy
    expect(qf.node.is.b(b)).toBeTruthy
    expect(qf.node.is.c(c)).toBeTruthy
  })
  test("node.get", () => {
    expect(qf.node.get.v()).toBeUndefined
    expect(qf.node.get.v(a)).toBe(1)
    expect(qf.node.get.v(b)).toBe(567)
    expect(qf.node.get.v(c)).toBe(10)
    expect(qf.node.get.b1(a)).toBeUndefined
    expect(qf.node.get.b1(b)).toBe(567)
    expect(qf.node.get.b2(a)).toBeUndefined
    expect(qf.node.get.b2(b)).toBe(a)
    expect(qf.node.get.c2(a)).toBeUndefined
    expect(qf.node.get.c2(c) == new q1.Nodes<qt.B>(...[b])).toBeTruthy
  })
})
