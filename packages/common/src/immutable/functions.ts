import { emptyMap } from "./map.js"
import { Collection } from "./main.js"
import { Seq } from "./seq.js"
import { set } from "./set.js"
import * as qu from "./utils.js"
import type * as qt from "./types.js"

export function get<K, V>(x: qt.Collection<K, V>, k: K): V | undefined
export function get<K, V, T>(x: qt.Collection<K, V>, k: K, v0: T): V | T
export function get<T extends object, K extends keyof T>(x: qt.Record<T>, k: K, v0: unknown): T[K]
export function get<V>(x: Array<V>, i: number): V | undefined
export function get<V, T>(x: Array<V>, i: number, v0: T): V | T
export function get<T extends object, K extends keyof T>(x: T, k: K, v0: unknown): T[K]
export function get<V>(x: qt.Dict<V>, k: string): V | undefined
export function get<V, T>(x: qt.Dict<V>, k: string, v0: T): V | T
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

export function has(x: object, k: unknown): boolean {
  return qu.isImmutable(x) ? x.has(k) : qu.isDataStructure(x) && qu.hasOwnProperty.call(x, k)
}

export function hasIn(x: unknown, xs: Iterable<unknown>): boolean {
  return getIn(x, xs, qu.NOT_SET) !== qu.NOT_SET
}

export function merge<T>(x: T, ...xs: Array<Iterable<unknown> | Iterable<[unknown, unknown]> | qt.Dict>): T {
  return mergeWithSources(x, xs)
}

export function mergeWith<T>(f: (old: unknown, v: unknown, k: unknown) => unknown, x: T, ...xs: Array<Iterable<unknown> | Iterable<[unknown, unknown]> | qt.Dict>): T {
  return mergeWithSources(x, xs, f)
}

export function mergeDeep<T>(x: T, ...xs: Array<Iterable<unknown> | Iterable<[unknown, unknown]> | qt.Dict>): T {
  return mergeDeepWithSources(x, xs)
}

export function mergeDeepWith<T>(f: (old: unknown, newVal: unknown, key: unknown) => unknown, x: T, ...xs: Array<Iterable<unknown> | Iterable<[unknown, unknown]> | qt.Dict>): T {
  return mergeDeepWithSources(x, xs, f)
}

export function mergeDeepWithSources(x: unknown, xs: unknown, f?: any) {
  return mergeWithSources(x, xs, deepMergerWith(f))
}

export function mergeWithSources(x: any, xs: any, f?: any) {
  if (!qu.isDataStructure(x)) throw new TypeError("Cannot merge into non-data-structure value: " + x)
  if (qu.isImmutable(x)) return typeof f === "function" && x.mergeWith ? x.mergeWith(f, ...xs) : x.merge ? x.merge(...xs) : x.concat(...xs)
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

function deepMergerWith(f: any) {
  function y(old: unknown, x: unknown, k: unknown) {
    return qu.isDataStructure(old) && qu.isDataStructure(x) && areMergeable(old, x) ? mergeWithSources(old, [x], y) : f ? f(old, x, k) : x
  }
  return y
}

function areMergeable(old, x) {
  const oldSeq = Seq(old)
  const newSeq = Seq(x)
  return qu.isIndexed(oldSeq) === qu.isIndexed(newSeq) && qu.isKeyed(oldSeq) === qu.isKeyed(newSeq)
}

export function remove<K, C extends qt.Collection<K, unknown>>(collection: C, k: K): C
export function remove<TProps extends object, C extends qt.Record<TProps>, K extends keyof TProps>(collection: C, k: K): C
export function remove<C extends Array<unknown>>(collection: C, key: number): C
export function remove<C, K extends keyof C>(collection: C, k: K): C
export function remove<C extends qt.Dict, K extends keyof C>(collection: C, k: K): C
export function remove(x: unknown, k: unknown) {
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

export function set<K, V, C extends qt.Collection<K, V>>(collection: C, k: K, v: V): C
export function set<TProps extends object, C extends qt.Record<TProps>, K extends keyof TProps>(record: C, k: K, value: TProps[K]): C
export function set<V, C extends Array<V>>(collection: C, key: number, v: V): C
export function set<C, K extends keyof C>(object: C, k: K, value: C[K]): C
export function set<V, C extends qt.Dict<V>>(collection: C, k: string, v: V): C
export function set(x, k, v) {
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
export function update<K, V, T extends qt.Collection<K, V>, V2>(x: T, k: K, v0: V2, f: (v: V | V2) => V): T
export function update<TProps extends object, C extends qt.Record<TProps>, K extends keyof TProps>(record: C, k: K, f: (value: TProps[K]) => TProps[K]): C
export function update<TProps extends object, C extends qt.Record<TProps>, K extends keyof TProps, NSV>(record: C, k: K, v0: NSV, f: (value: TProps[K] | NSV) => TProps[K]): C
export function update<V>(collection: Array<V>, key: number, f: (v: V) => V): Array<V>
export function update<V, NSV>(collection: Array<V>, key: number, v0: NSV, f: (v: V | NSV) => V): Array<V>
export function update<C, K extends keyof C>(object: C, k: K, f: (value: C[K]) => C[K]): C
export function update<C, K extends keyof C, NSV>(object: C, k: K, v0: NSV, f: (value: C[K] | NSV) => C[K]): C
export function update<V, C extends qt.Dict<V>, K extends keyof C>(collection: C, k: K, f: (v: V) => V): qt.Dict<V>
export function update<V, C extends qt.Dict<V>, K extends keyof C, NSV>(collection: C, k: K, v0: NSV, f: (v: V | NSV) => V): qt.Dict<V>
export function update(x: unknown, k: unknown, v0: unknown, f: (x: unknown) => unknown) {
  return updateIn(x, [k], v0, f)
}

export function updateIn<T>(x: T, xs: Iterable<unknown>, f: (x: unknown) => unknown): T
export function updateIn<T>(x: T, xs: Iterable<unknown>, v0: unknown, f: (x: unknown) => unknown): T
export function updateIn(x: unknown, xs: unknown, v0: unknown, f?: unknown) {
  if (!f) {
    f = v0
    v0 = undefined
  }
  const y = updateInDeeply(qu.isImmutable(x), x, qu.coerceKeyPath(xs), 0, v0, f)
  return y === qu.NOT_SET ? v0 : y
}

function updateInDeeply(isImmutable: boolean, x: unknown, xs: any, i: number, v0: unknown, f: any): any {
  const notSet = x === qu.NOT_SET
  if (i === xs.length) {
    const x2 = notSet ? v0 : x
    const y = f(x2)
    return y === x2 ? x : y
  }
  if (!notSet && !qu.isDataStructure(x)) throw new TypeError("Cannot update within non-data-structure value in path [" + xs.slice(0, i).map(qu.quoteString) + "]: " + x)
  const k = xs[i]
  const x2 = notSet ? qu.NOT_SET : get(x, k, qu.NOT_SET)
  const y = updateInDeeply(x2 === qu.NOT_SET ? isImmutable : qu.isImmutable(x2), x2, xs, i + 1, v0, f)
  return y === x2 ? x : y === qu.NOT_SET ? remove(x, k) : set(notSet ? (isImmutable ? emptyMap() : {}) : x, k, y)
}

export function asImmutable() {
  return this.__ensureOwner()
}

export function asMutable() {
  return this.__ownerID ? this : this.__ensureOwner(new qu.OwnerID())
}

export function deleteIn(keyPath) {
  return removeIn(this, keyPath)
}

export function getIn2(searchKeyPath, notSetValue) {
  return getIn(this, searchKeyPath, notSetValue)
}

export function hasIn2(searchKeyPath) {
  return hasIn(this, searchKeyPath)
}

export function merge2(...iters) {
  return mergeIntoKeyedWith(this, iters)
}

export function mergeWith2(merger, ...iters) {
  if (typeof merger !== "function") throw new TypeError("Invalid merger function: " + merger)
  return mergeIntoKeyedWith(this, iters, merger)
}

function mergeIntoKeyedWith(x, xs, f?) {
  const y = []
  for (let ii = 0; ii < xs.length; ii++) {
    const collection = Collection.Keyed.create(xs[ii])
    if (collection.size !== 0) y.push(collection)
  }
  if (y.length === 0) return x
  if (x.toSeq().size === 0 && !x.__ownerID && y.length === 1) return x.constructor(y[0])
  return x.withMutations(x2 => {
    const mergeIntoCollection = f
      ? (v, k) => {
          update(x2, k, qu.NOT_SET, oldVal => (oldVal === qu.NOT_SET ? v : f(oldVal, v, k)))
        }
      : (v, k) => {
          x2.set(k, v)
        }
    for (let ii = 0; ii < y.length; ii++) {
      y[ii].forEach(mergeIntoCollection)
    }
  })
}

export function mergeDeep2(...iters) {
  return mergeDeepWithSources(this, iters)
}

export function mergeDeepWith2(merger, ...iters) {
  return mergeDeepWithSources(this, iters, merger)
}

export function mergeDeepIn(keyPath, ...iters) {
  return updateIn(this, keyPath, emptyMap(), m => mergeDeepWithSources(m, iters))
}

export function mergeIn(keyPath, ...iters) {
  return updateIn(this, keyPath, emptyMap(), m => mergeWithSources(m, iters))
}

export function setIn2(keyPath, v) {
  return setIn(this, keyPath, v)
}

export function toObject() {
  qu.assertNotInfinite(this.size)
  const y = {}
  this.__iterate((v, k) => {
    y[k] = v
  })
  return y
}

export function update2(key, notSetValue, updater) {
  return arguments.length === 1 ? key(this) : update(this, key, notSetValue, updater)
}

export function updateIn2(keyPath, notSetValue, updater) {
  return updateIn(this, keyPath, notSetValue, updater)
}

export function wasAltered() {
  return this.__altered
}

export function withMutations(fn) {
  const y = this.asMutable()
  fn(y)
  return y.wasAltered() ? y.__ensureOwner(this.__ownerID) : this
}
