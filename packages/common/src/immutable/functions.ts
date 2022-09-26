import { emptyMap } from "./map.js"
import { Collection, Seq } from "./main.js"
import { set } from "./set.js"
import * as qu from "./utils.js"
import type * as qt from "./types.js"

export function get<K, V, T>(x: qt.Collection<K, V>, k: K, v0: T): V | T
export function get<K, V>(x: qt.Collection<K, V>, k: K): V | undefined
export function get<T extends object, K extends keyof T>(x: qt.Record<T>, k: K, v0: unknown): T[K]
export function get<T extends object, K extends keyof T>(x: T, k: K, v0: unknown): T[K]
export function get<V, T>(x: Array<V>, i: number, v0: T): V | T
export function get<V, T>(x: qt.Dict<V>, k: string, v0: T): V | T
export function get<V>(x: Array<V>, i: number): V | undefined
export function get<V>(x: qt.Dict<V>, k: string): V | undefined
export function get(x: any, k: any, v0?: unknown) {
  return qu.isImmutable(x) ? x.get(k, v0) : !has(x, k) ? v0 : typeof x.get === "function" ? x.get(k) : x[k]
}

export function getIn(x: any, xs: Iterable<unknown>, v0?: unknown): unknown {
  const p = qu.coerceKeyPath(xs)
  let i = 0
  while (i !== p.length) {
    x = get(x, p[i++], qu.NOT_SET)
    if (x === qu.NOT_SET) return v0
  }
  return x
}

export function has(x: object, k: any): boolean {
  return qu.isImmutable(x) ? x.has(k) : qu.isDataStructure(x) && qu.hasOwnProperty.call(x, k)
}

export function hasIn(x: unknown, xs: Iterable<unknown>): boolean {
  return getIn(x, xs, qu.NOT_SET) !== qu.NOT_SET
}

export function merge<T>(x: T, ...xs: Array<Iterable<unknown> | Iterable<[unknown, unknown]> | qt.Dict>): T {
  return mergeWithSources(x, xs)
}

export function mergeWith<T>(
  f: (old: unknown, v: unknown, k: unknown) => unknown,
  x: T,
  ...xs: Array<Iterable<unknown> | Iterable<[unknown, unknown]> | qt.Dict>
): T {
  return mergeWithSources(x, xs, f)
}

export function mergeDeep<T>(x: T, ...xs: Array<Iterable<unknown> | Iterable<[unknown, unknown]> | qt.Dict>): T {
  return mergeDeepWithSources(x, xs)
}

export function mergeDeepWith<T>(
  f: (old: unknown, newVal: unknown, key: unknown) => unknown,
  x: T,
  ...xs: Array<Iterable<unknown> | Iterable<[unknown, unknown]> | qt.Dict>
): T {
  return mergeDeepWithSources(x, xs, f)
}

export function mergeDeepWithSources(x: unknown, xs: unknown, f?: Function) {
  return mergeWithSources(x, xs, deepMergerWith(f))
}

export function mergeWithSources(x: any, xs: any, f?: Function) {
  if (!qu.isDataStructure(x)) throw new TypeError("Cannot merge into non-data-structure value: " + x)
  if (qu.isImmutable(x))
    return typeof f === "function" && x.mergeWith ? x.mergeWith(f, ...xs) : x.merge ? x.merge(...xs) : x.concat(...xs)
  const isArray = Array.isArray(x)
  let y = x
  const C = isArray ? Collection.Indexed : Collection.Keyed
  const mergeItem = isArray
    ? v => {
        if (y === x) y = qu.shallowCopy(y)
        y.push(v)
      }
    : (v, k) => {
        const hasVal = qu.hasOwnProperty.call(y, k)
        const nextVal = hasVal && f ? f(y[k], v, k) : v
        if (!hasVal || nextVal !== y[k]) {
          if (y === x) y = qu.shallowCopy(y)
          y[k] = nextVal
        }
      }
  for (let i = 0; i < xs.length; i++) {
    new C(xs[i]).forEach(mergeItem)
  }
  return y
}

function deepMergerWith(f: Function) {
  function y(old: unknown, x: unknown, k: unknown) {
    return qu.isDataStructure(old) && qu.isDataStructure(x) && areMergeable(old, x)
      ? mergeWithSources(old, [x], y)
      : f
      ? f(old, x, k)
      : x
  }
  return y
}

function areMergeable(a: any, b: any) {
  const a2 = Seq.create(a)
  const b2 = Seq.create(b)
  return qu.isIndexed(a2) === qu.isIndexed(b2) && qu.isKeyed(a2) === qu.isKeyed(b2)
}

export function remove<K, T extends qt.Collection<K, unknown>>(x: T, k: K): T
export function remove<T extends Array<unknown>>(x: T, k: number): T
export function remove<T extends object, U extends qt.Record<T>, K extends keyof T>(x: U, k: K): U
export function remove<T extends qt.Dict, K extends keyof T>(x: T, k: K): T
export function remove<T, K extends keyof T>(x: T, k: K): T
export function remove(x: unknown, k: any) {
  if (!qu.isDataStructure(x)) throw new TypeError("Cannot update non-data-structure value: " + x)
  if (qu.isImmutable(x)) {
    if (!x.remove) throw new TypeError("Cannot update immutable value without .remove() method: " + x)
    return x.remove(k)
  }
  if (!qu.hasOwnProperty.call(x, k)) return x
  const y = qu.shallowCopy(x)
  if (Array.isArray(y)) y.splice(k, 1)
  else delete y[k]
  return y
}

export function removeIn<T>(x: T, xs: Iterable<unknown>): T {
  return updateIn(x, xs, () => qu.NOT_SET)
}

export function set<K, V, T extends qt.Collection<K, V>>(x: T, k: K, v: V): T
export function set<T extends object, U extends qt.Record<T>, K extends keyof T>(x: U, k: K, v: T[K]): U
export function set<V, T extends Array<V>>(x: T, k: number, v: V): T
export function set<T, K extends keyof T>(x: T, k: K, v: T[K]): T
export function set<V, T extends qt.Dict<V>>(x: T, k: string, v: V): T
export function set(x: any, k: any, v: unknown) {
  if (!qu.isDataStructure(x)) throw new TypeError("Cannot update non-data-structure value: " + x)
  if (qu.isImmutable(x)) {
    if (!x.set) throw new TypeError("Cannot update immutable value without .set() method: " + x)
    return x.set(k, v)
  }
  if (qu.hasOwnProperty.call(x, k) && v === x[k]) return x
  const y = qu.shallowCopy(x)
  y[k] = v
  return y
}

export function setIn<T>(x: T, xs: Iterable<unknown>, v: unknown): T {
  return updateIn(x, xs, qu.NOT_SET, () => v)
}

export function update<K, V, T extends qt.Collection<K, V>>(x: T, k: K, f: (v: V | undefined) => V): T
export function update<K, V, T extends qt.Collection<K, V>, V0>(x: T, k: K, v0: V0, f: (v: V | V0) => V): T
export function update<T extends object, U extends qt.Record<T>, K extends keyof T>(x: U, k: K, f: (x: T[K]) => T[K]): U
export function update<V>(x: Array<V>, k: number, f: (v: V) => V): Array<V>
export function update<V, V0>(x: Array<V>, k: number, v0: V0, f: (v: V | V0) => V): Array<V>
export function update<T, K extends keyof T>(x: T, k: K, f: (x: T[K]) => T[K]): T
export function update<T, K extends keyof T, V0>(x: T, k: K, v0: V0, f: (x: T[K] | V0) => T[K]): T
export function update<V, T extends qt.Dict<V>, K extends keyof T>(x: T, k: K, f: (v: V) => V): qt.Dict<V>
export function update<V, T extends qt.Dict<V>, K extends keyof T, V0>(
  x: T,
  k: K,
  v0: V0,
  f: (v: V | V0) => V
): qt.Dict<V>
export function update<T extends object, U extends qt.Record<T>, K extends keyof T, V0>(
  x: U,
  k: K,
  v0: V0,
  f: (x: T[K] | V0) => T[K]
): U
export function update(x: unknown, k: unknown, v0: unknown, f?: (x: unknown) => unknown) {
  return updateIn(x, [k], v0, f)
}

export function updateIn<T>(x: T, xs: Iterable<unknown>, f: (x: unknown) => unknown): T
export function updateIn<T>(x: T, xs: Iterable<unknown>, v0: unknown, f?: (x: unknown) => unknown): T
export function updateIn(x: unknown, xs: unknown, v0: unknown, f?: Function) {
  if (!f) {
    f = v0 as Function
    v0 = undefined
  }
  const y = updateInDeeply(qu.isImmutable(x), x, qu.coerceKeyPath(xs), 0, v0, f)
  return y === qu.NOT_SET ? v0 : y
}

function updateInDeeply(isImmutable: boolean, x: any, xs: any, i: number, v0: unknown, f: Function): any {
  const notSet = x === qu.NOT_SET
  if (i === xs.length) {
    const x2 = notSet ? v0 : x
    const y = f(x2)
    return y === x2 ? x : y
  }
  if (!notSet && !qu.isDataStructure(x))
    throw new TypeError(
      "Cannot update within non-data-structure value in path [" + xs.slice(0, i).map(qu.quoteString) + "]: " + x
    )
  const k = xs[i]
  const x2 = notSet ? qu.NOT_SET : get(x, k, qu.NOT_SET)
  const y = updateInDeeply(x2 === qu.NOT_SET ? isImmutable : qu.isImmutable(x2), x2, xs, i + 1, v0, f)
  return y === x2 ? x : y === qu.NOT_SET ? remove(x, k) : set(notSet ? (isImmutable ? emptyMap() : {}) : x, k, y)
}

export function asImmutable(this: any) {
  return this.__ensureOwner()
}

export function asMutable(this: any) {
  return this.__owner ? this : this.__ensureOwner(new qu.OwnerID())
}

export function deleteIn(this: any, x) {
  return removeIn(this, x)
}

export function mergeIntoKeyedWith(x: any, xs: any, f?: Function) {
  const ys: any[] = []
  for (let i = 0; i < xs.length; i++) {
    const y = Collection.Keyed.create(xs[i])
    if (y.size !== 0) ys.push(y)
  }
  if (ys.length === 0) return x
  if (x.toSeq().size === 0 && !x.__owner && ys.length === 1) return x.constructor(ys[0])
  return x.withMutations(x2 => {
    const mergeIntoCollection = f
      ? (v, k) => {
          update(x2, k, qu.NOT_SET, v0 => (v0 === qu.NOT_SET ? v : f(v0, v, k)))
        }
      : (v, k) => {
          x2.set(k, v)
        }
    for (let i = 0; i < ys.length; i++) {
      ys[i].forEach(mergeIntoCollection)
    }
  })
}

export function mergeIn(this: any, x: any, ...xs: unknown[]) {
  return updateIn(this, x, emptyMap(), m => mergeWithSources(m, xs))
}

export function mergeDeepIn(this: any, x: any, ...xs: unknown[]) {
  return updateIn(this, x, emptyMap(), m => mergeDeepWithSources(m, xs))
}

export function toObject(this: any) {
  qu.assertNotInfinite(this.size)
  const y: any = {}
  this.__iterate((v, k) => {
    y[k] = v
  })
  return y
}

export function wasAltered(this: any) {
  return this.__altered
}

export function withMutations(this: any, f: Function) {
  const y = this.asMutable()
  f(y)
  return y.wasAltered() ? y.__ensureOwner(this.__owner) : this
}
