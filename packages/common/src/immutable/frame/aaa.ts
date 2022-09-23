export interface Dict<T = unknown> {
  [k: string]: T
}
export function deepEqual(a: unknown, b: unknown) {
  if (a === b) return true
  return false
}
export class Data {
  readonly d1 = 123
  d2?: number
  equals(x: unknown): boolean {
    return deepEqual(this, x)
  }
}
export interface Frame0 {
  get: Fget
  is: Fis
  to: Fto
}
export class Fget {
  empty() {
    return {}
  }
}
export class Fis {
  string(x: unknown): x is string {
    return typeof x === "string"
  }
  data(x: any) {
    return Boolean(
      x && typeof x.equals === "function" && typeof x.hashCode === "function"
    )
  }
}
export class Fto<T = unknown> {
  toJSON(): Array<T> | Dict<T> {
    return new Array<T>(0)
  }
}

export function newFrame0() {
  return { get: new Fget(), is: new Fis(), to: new Fto() } as Frame0
}
export const qf: Frame0 = newFrame0()

export function addMixins(t: any, ss: any[]) {
  ss.forEach((s: any) => {
    const p = s.prototype || s.__proto__
    Object.getOwnPropertyNames(p).forEach(n => {
      if (n == "constructor") return
      const v = Object.getOwnPropertyDescriptor(p, n)
      if (v != undefined) {
        //console.log(`adding ${s.name}.${n}`);
        Object.defineProperty(t.prototype || t.__proto__, n, v)
      }
    })
  })
}

export interface Config {
  flip?: boolean
}
export interface Frame extends Config, Frame0 {
  make: unknown
}
export const enum Kind {
  A,
  B,
  C,
  AB,
  BC,
  ABC,
}

export interface Nobj extends Data {
  k: Kind
  readonly n1: number
  n2: number | undefined
  walk<T>(cb?: (n?: Node) => T | undefined): T | undefined
}
export interface Nodes<T extends Nobj = Nobj>
  extends ReadonlyArray<T>,
    qb.Data {
  ns1: number
  walk<U>(
    cb?: (n?: Node) => U | undefined,
    cbs?: (ns?: Nodes) => U | undefined
  ): U | undefined
}
export interface A extends Nobj {
  k: Kind.A
  a1: number
}
export interface B extends Nobj {
  k: Kind.B
  readonly b1: number
  b2: A
}
export interface C extends Nobj {
  k: Kind.C
  c1?: number
  c2?: Nodes<B>
}
export type Node = A | B | C
