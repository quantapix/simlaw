import { Collection } from "./main.js"
import { EMPTY_MAP } from "./map.js"
import { OrderedSet } from "./ordered.js"
import * as qc from "./core.js"
import * as qu from "./utils.js"
import type * as qt from "./types.js"

export class Set<V> extends Collection.ByVal<V> implements qt.Set<V> {
  static isSet = qu.isSet
  static override from<T>(x?: Iterable<T> | ArrayLike<T>): Set<T> {
    if (x === undefined || x === null) return EMPTY_SET
    if (qu.isSet(x) && !qu.isOrdered(x)) return x
    const it = Collection.ByVal.from(x)
    qu.assertNotInfinite(it.size)
    return EMPTY_SET.withMutations(x2 => {
      y.forEach(x3 => x2.add(x3))
    })
  }
  static fromKeys(x: qt.ByStr): Set<string>
  static fromKeys<T>(x: Collection<T, unknown>): Set<T>
  static fromKeys(x: any): any {
    return Set.from(Collection.ByKey.from(x).keySeq())
  }
  static of<T>(...xs: Array<T>): Set<T> {
    return Set.from<T>(xs)
  }
  static intersect<T>(x: Iterable<Iterable<T>>): Set<T> {
    const y = Collection.from(x).toArray()
    return y.length ? Set.from(y.pop()).intersect(y) : EMPTY_SET
  }
  static union<T>(x: Iterable<Iterable<T>>): Set<T> {
    const y = Collection.from(x).toArray()
    return y.length ? Set.from(y.pop()).union(y) : EMPTY_SET
  }

  [Symbol.q_set] = true;
  [Symbol.q_delete] = this.remove

  constructor(private _base: any, private _owner?: any) {
    super()
    this.size = _base ? _base.size : 0
  }

  override toString() {
    return this.__toString("Set {", "}")
  }
  override has(v: V) {
    return this._base.has(v)
  }
  add(v: V) {
    return updateSet(this, this._base.set(v, v))
  }
  remove(v: V) {
    return updateSet(this, this._base.remove(v))
  }
  clear() {
    return updateSet(this, this._base.clear())
  }
  override map(f: Function, ctx?: unknown) {
    let dirty = false
    const y = updateSet(
      this,
      this._base.mapEntries(([, v]) => {
        const mapped = f.call(ctx, v, v, this)
        if (mapped !== v) dirty = true
        return [mapped, mapped]
      }, ctx)
    )
    return dirty ? y : this
  }
  union(...xs) {
    xs = xs.filter(x => x.size !== 0)
    if (xs.length === 0) return this
    if (this.size === 0 && !this._owner && xs.length === 1) return this.constructor(xs[0])
    return this.withMutations(x => {
      for (let i = 0; i < xs.length; i++) {
        Collection.ByVal.from(xs[i]).forEach(x2 => x.add(x2))
      }
    })
  }
  intersect(...xs) {
    if (xs.length === 0) return this
    xs = xs.map(x => Collection.ByVal.from(x))
    const toRemove = []
    this.forEach(v => {
      if (!xs.every(x => x.includes(v))) toRemove.push(v)
    })
    return this.withMutations(x => {
      toRemove.forEach(v => {
        x.remove(v)
      })
    })
  }
  subtract(...xs) {
    if (xs.length === 0) return this
    xs = xs.map(x => Collection.ByVal.from(x))
    const toRemove = []
    this.forEach(v => {
      if (xs.some(x => x.includes(v))) toRemove.push(v)
    })
    return this.withMutations(x => {
      toRemove.forEach(v => {
        x.remove(v)
      })
    })
  }
  override sort(c?: Function) {
    return OrderedSet.from(qc.sort(this, c))
  }
  override sortBy(f: Function, c?: Function) {
    return OrderedSet.from(qc.sort(this, c, f))
  }
  wasAltered() {
    return this._base.wasAltered()
  }
  [Symbol.q_loop](f: qt.Step<V, V, this>, reverse?: boolean) {
    return this._base[Symbol.q_loop](k => f(k, k, this), reverse)
  }
  [Symbol.q_iter](m: qu.Iter.Mode, reverse?: boolean) {
    return this._base[Symbol.q_iter](m, reverse)
  }
  __ensureOwner(owner) {
    if (owner === this._owner) return this
    const y = this._base.__ensureOwner(owner)
    if (!owner) {
      if (this.size === 0) return this.__empty
      this._owner = owner
      this._base = y
      return this
    }
    return this.__make(y, owner)
  }
  override concat = this.union
  merge = this.union
  withMutations = qc.withMutations
  asImmutable = qc.asImmutable
  asMutable = qc.asMutable;
  ["@@transducer/init"] = qc.asMutable;
  ["@@transducer/step"] = function (result, arr) {
    return result.add(arr)
  };
  ["@@transducer/result"] = function (x) {
    return x.asImmutable()
  }
  __empty = EMPTY_SET
  __make = Set
}

function updateSet(x, newMap) {
  if (x._owner) {
    x.size = newMap.size
    x._map = newMap
    return x
  }
  return newMap === x._map ? x : newMap.size === 0 ? x.__empty() : x.__make(newMap)
}

export const EMPTY_SET = new Set(EMPTY_MAP)
