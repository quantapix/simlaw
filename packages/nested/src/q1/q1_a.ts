import { Kind } from "../q0/q0_b.js"
import * as qb from "../q0/q0_a.js"
import type * as qt from "../q0/q0_b.js"
export abstract class Nobj extends qb.Data implements qt.Nobj {
  k!: Kind
  n1 = 234
  get n2(): number | undefined {
    return
  }
  walk<T>(cb?: (n?: qt.Node) => T | undefined): T | undefined {
    return cb?.(this as qt.Node)
  }
}
export class Nodes<T extends qt.Nobj = qt.Nobj>
  extends Array<T>
  implements qt.Nodes
{
  readonly d1 = 123
  ns1 = 0
  walk<U>(
    cb?: (n?: qt.Node) => U | undefined,
    cbs?: (ns?: qt.Nodes) => U | undefined
  ): U | undefined {
    if (cbs) return cbs(this)
    if (cb) {
      for (const n of this) {
        const r = cb(n as qt.Node)
        if (r) return r
      }
    }
    return
  }
}
export class A extends Nobj implements qt.A {
  static readonly k = Kind.A
  declare k: Kind.A
  a1 = 0
  update(a1: number) {
    this.a1 = a1
    return this
  }
}
A.prototype.k = A.k
export class B extends Nobj implements qt.B {
  static readonly k = Kind.B
  declare k: Kind.B
  readonly b1 = 567
  b2!: qt.A
  update(b2: qt.A) {
    this.b2 = b2
    return this
  }
}
B.prototype.k = B.k
export class C extends Nobj implements qt.C {
  static readonly k = Kind.C
  declare k: Kind.C
  c1?: number
  c2?: qt.Nodes<qt.B>
  update(c2: B[]) {
    this.c2 = new Nodes<qt.B>(...c2)
    return this
  }
}
C.prototype.k = C.k
export type Node = A | B | C
export const Nmap = { [Kind.A]: A, [Kind.B]: B, [Kind.C]: C }
export interface Ctrs {
  [Kind.A]: A
  [Kind.B]: B
  [Kind.C]: C
}
export type Ctr<K extends Kind> = K extends keyof Ctrs ? Ctrs[K] : never
