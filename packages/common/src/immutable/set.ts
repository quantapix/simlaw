import { Collection } from "./main.js"
import { emptyMap } from "./map.js"
import { OrderedSet } from "./ordered.js"
import * as qc from "./core.js"
import * as qu from "./utils.js"
import type * as qt from "./types.js"

export class Set<V> extends Collection.ByVal<V> implements qt.Set<V> {
  static isSet = qu.isSet
  static of<T>(...xs: Array<T>): Set<T> {
    return Set.from<T>(...xs)
  }
  static fromKeys(x: qt.ByStr): Set<string>
  static fromKeys<T>(x: Collection<T, unknown>): Set<T>
  static fromKeys(x: any): any {
    return Set.from(Collection.ByKey.from(x).keySeq())
  }
  static intersect<T>(x: Iterable<Iterable<T>>): Set<T> {
    x = Collection.from(x).toArray()
    return x.length ? SetPrototype.intersect.apply(Set.from(x.pop()), x) : emptySet()
  }
  static union<T>(x: Iterable<Iterable<T>>): Set<T> {
    x = Collection.from(x).toArray()
    return x.length ? SetPrototype.union.apply(Set.from(x.pop()), x) : emptySet()
  }

  static override from<K>(x?: Iterable<K> | ArrayLike<K>): Set<K> {
    return x === undefined || x === null
      ? emptySet()
      : qu.isSet(x) && !qu.isOrdered(x)
      ? x
      : emptySet().withMutations(x2 => {
          const y = Collection.ByVal.from(x)
          qu.assertNotInfinite(y.size)
          y.forEach(x3 => x2.add(x3))
        })
  }
  [Symbol.q_set] = true;
  [Symbol.q_delete] = this.remove
  override toString() {
    return this.__toString("Set {", "}")
  }
  override has(value) {
    return this._map.has(value)
  }
  add(value) {
    return updateSet(this, this._map.set(value, value))
  }
  remove(value) {
    return updateSet(this, this._map.remove(value))
  }
  clear() {
    return updateSet(this, this._map.clear())
  }
  override map(mapper, context) {
    let didChanges = false
    const newMap = updateSet(
      this,
      this._map.mapEntries(([, v]) => {
        const mapped = mapper.call(context, v, v, this)
        if (mapped !== v) didChanges = true
        return [mapped, mapped]
      }, context)
    )
    return didChanges ? newMap : this
  }
  union(...iters) {
    iters = iters.filter(x => x.size !== 0)
    if (iters.length === 0) return this
    if (this.size === 0 && !this.__owner && iters.length === 1) return this.constructor(iters[0])
    return this.withMutations(set => {
      for (let ii = 0; ii < iters.length; ii++) {
        SetCollection(iters[ii]).forEach(value => set.add(value))
      }
    })
  }
  intersect(...iters) {
    if (iters.length === 0) return this
    iters = iters.map(iter => SetCollection(iter))
    const toRemove = []
    this.forEach(value => {
      if (!iters.every(iter => iter.includes(value))) toRemove.push(value)
    })
    return this.withMutations(set => {
      toRemove.forEach(value => {
        set.remove(value)
      })
    })
  }
  subtract(...iters) {
    if (iters.length === 0) return this
    iters = iters.map(iter => SetCollection(iter))
    const toRemove = []
    this.forEach(value => {
      if (iters.some(iter => iter.includes(value))) toRemove.push(value)
    })
    return this.withMutations(set => {
      toRemove.forEach(value => {
        set.remove(value)
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
    return this._map.wasAltered()
  }
  [Symbol.q_loop](f: qt.Floop<V, V, this>, reverse?: boolean) {
    return this._map[Symbol.q_loop](k => f(k, k, this), reverse)
  }
  __iter(m: qu.Iter.Mode, reverse?: boolean) {
    return this._map.__iter(m, reverse)
  }
  __ensureOwner(owner) {
    if (owner === this.__owner) return this

    const newMap = this._map.__ensureOwner(owner)
    if (!owner) {
      if (this.size === 0) return this.__empty()

      this.__owner = owner
      this._map = newMap
      return this
    }
    return this.__make(newMap, owner)
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
  __empty = emptySet
  __make = makeSet
}

function updateSet(set, newMap) {
  if (set.__owner) {
    set.size = newMap.size
    set._map = newMap
    return set
  }
  return newMap === set._map ? set : newMap.size === 0 ? set.__empty() : set.__make(newMap)
}

function makeSet(map, owner) {
  const y = Object.create(Set.prototype)
  y.size = map ? map.size : 0
  y._map = map
  y.__owner = owner
  return y
}

let EMPTY_SET

function emptySet() {
  return EMPTY_SET || (EMPTY_SET = makeSet(emptyMap()))
}
