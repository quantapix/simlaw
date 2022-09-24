/* eslint-disable @typescript-eslint/no-namespace */
import { Collection } from "./main.js"
import { emptyMap } from "./map.js"
import { OrderedSet } from "./ordered.js"
import { sortFactory } from "./operations.js"
import * as qf from "./functions.js"
import * as qu from "./utils.js"
import type * as qt from "./types.js"

export class Set<K> extends Collection.Set<K> implements qt.Set<K> {
  static isSet = qu.isSet
  static of<T>(...xs: Array<T>): Set<T> {
    return new Set<T>(...xs)
  }
  static fromKeys(x: qt.Dict): Set<string>
  static fromKeys<T>(x: Collection<T, unknown>): Set<T>
  static fromKeys(x: any): any {
    return new Set(new Collection.Keyed(x).keySeq())
  }
  static intersect<T>(x: Iterable<Iterable<T>>): Set<T> {
    x = new Collection(x).toArray()
    return x.length ? SetPrototype.intersect.apply(new Set(x.pop()), x) : emptySet()
  }
  static union<T>(x: Iterable<Iterable<T>>): Set<T> {
    x = new Collection(x).toArray()
    return x.length ? SetPrototype.union.apply(new Set(x.pop()), x) : emptySet()
  }

  static override create<K>(x?: Iterable<K> | ArrayLike<K>): Set<K> {
    return x === undefined || x === null
      ? emptySet()
      : qu.isSet(x) && !qu.isOrdered(x)
      ? x
      : emptySet().withMutations(x2 => {
          const iter = new Collection.Set(x)
          qu.assertNotInfinite(iter.size)
          iter.forEach(x3 => x2.add(x3))
        })
  }
  [qu.IS_SET_SYMBOL] = true;
  [qu.DELETE] = this.remove
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
    if (this.size === 0 && !this.__ownerID && iters.length === 1) return this.constructor(iters[0])
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
  override sort(comparator) {
    return OrderedSet(sortFactory(this, comparator))
  }
  override sortBy(mapper, comparator) {
    return OrderedSet(sortFactory(this, comparator, mapper))
  }
  wasAltered() {
    return this._map.wasAltered()
  }
  __iterate(fn, reverse) {
    return this._map.__iterate(k => fn(k, k, this), reverse)
  }
  __iterator(type, reverse) {
    return this._map.__iterator(type, reverse)
  }
  __ensureOwner(ownerID) {
    if (ownerID === this.__ownerID) {
      return this
    }
    const newMap = this._map.__ensureOwner(ownerID)
    if (!ownerID) {
      if (this.size === 0) {
        return this.__empty()
      }
      this.__ownerID = ownerID
      this._map = newMap
      return this
    }
    return this.__make(newMap, ownerID)
  }
  override concat = this.union
  merge = this.union
  withMutations = qf.withMutations
  asImmutable = qf.asImmutable
  asMutable = qf.asMutable;
  ["@@transducer/init"] = qf.asMutable;
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
  if (set.__ownerID) {
    set.size = newMap.size
    set._map = newMap
    return set
  }
  return newMap === set._map ? set : newMap.size === 0 ? set.__empty() : set.__make(newMap)
}

function makeSet(map, ownerID) {
  const y = Object.create(SetPrototype)
  y.size = map ? map.size : 0
  y._map = map
  y.__ownerID = ownerID
  return y
}
let EMPTY_SET

function emptySet() {
  return EMPTY_SET || (EMPTY_SET = makeSet(emptyMap()))
}
