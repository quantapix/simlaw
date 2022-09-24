/* eslint-disable @typescript-eslint/no-namespace */
import * as qu from "./utils.js"
import { emptyList } from "./list.js"
import { Map, emptyMap } from "./map.js"
import { Set } from "./set.js"
import { Collection } from "./main.js"
import type * as qt from "./types.js"

export class OrderedMap<K, V> extends Map<K, V> implements qt.OrderedMap<K, V> {
  static isOrderedMap = qu.isOrderedMap
  static create<K, V>(x?: Iterable<[K, V]>): qt.OrderedMap<K, V>
  static create<V>(x: qt.Dict<V>): qt.OrderedMap<string, V>
  static create(x: any): any {
    return x === undefined || x === null
      ? emptyOrderedMap()
      : qu.isOrderedMap(x)
      ? x
      : emptyOrderedMap().withMutations(x2 => {
          const iter = new Collection.Keyed(x)
          qu.assertNotInfinite(iter.size)
          iter.forEach((v, k) => x2.set(k, v))
        })
  }
  static of<K, V>(...xs) {
    return new OrderedMap<K, V>(...xs)
  }

  [qu.IS_ORDERED_SYMBOL] = true;
  [qu.DELETE] = this.remove

  override toString() {
    return this.__toString("OrderedMap {", "}")
  }
  override get(k, notSetValue) {
    const index = this._map.get(k)
    return index !== undefined ? this._list.get(index)[1] : notSetValue
  }
  override clear() {
    if (this.size === 0) {
      return this
    }
    if (this.__ownerID) {
      this.size = 0
      this._map.clear()
      this._list.clear()
      this.__altered = true
      return this
    }
    return emptyOrderedMap()
  }
  override set(k, v) {
    return updateOrderedMap(this, k, v)
  }
  override remove(k) {
    return updateOrderedMap(this, k, qu.NOT_SET)
  }
  override __iterate(fn, reverse) {
    return this._list.__iterate(entry => entry && fn(entry[1], entry[0], this), reverse)
  }
  override __iterator(type, reverse) {
    return this._list.fromEntrySeq().__iterator(type, reverse)
  }
  override __ensureOwner(ownerID) {
    if (ownerID === this.__ownerID) {
      return this
    }
    const newMap = this._map.__ensureOwner(ownerID)
    const newList = this._list.__ensureOwner(ownerID)
    if (!ownerID) {
      if (this.size === 0) {
        return emptyOrderedMap()
      }
      this.__ownerID = ownerID
      this.__altered = false
      this._map = newMap
      this._list = newList
      return this
    }
    return makeOrderedMap(newMap, newList, ownerID, this.__hash)
  }
}

function makeOrderedMap(map, list, ownerID, hash) {
  const omap = Object.create(OrderedMap.prototype)
  omap.size = map ? map.size : 0
  omap._map = map
  omap._list = list
  omap.__ownerID = ownerID
  omap.__hash = hash
  omap.__altered = false
  return omap
}

let EMPTY_ORDERED_MAP
export function emptyOrderedMap() {
  return EMPTY_ORDERED_MAP || (EMPTY_ORDERED_MAP = makeOrderedMap(emptyMap(), emptyList()))
}

function updateOrderedMap(omap, k, v) {
  const map = omap._map
  const list = omap._list
  const i = map.get(k)
  const has = i !== undefined
  let newMap
  let newList
  if (v === qu.NOT_SET) {
    if (!has) return omap
    if (list.size >= qu.SIZE && list.size >= map.size * 2) {
      newList = list.filter((entry, idx) => entry !== undefined && i !== idx)
      newMap = newList
        .toSeqKeyed()
        .map(entry => entry[0])
        .flip()
        .toMap()
      if (omap.__ownerID) newMap.__ownerID = newList.__ownerID = omap.__ownerID
    } else {
      newMap = map.remove(k)
      newList = i === list.size - 1 ? list.pop() : list.set(i, undefined)
    }
  } else if (has) {
    if (v === list.get(i)[1]) return omap
    newMap = map
    newList = list.set(i, [k, v])
  } else {
    newMap = map.set(k, list.size)
    newList = list.set(list.size, [k, v])
  }
  if (omap.__ownerID) {
    omap.size = newMap.size
    omap._map = newMap
    omap._list = newList
    omap.__hash = undefined
    omap.__altered = true
    return omap
  }
  return makeOrderedMap(newMap, newList)
}

export class OrderedSet extends Set {
  constructor(value) {
    return value === undefined || value === null
      ? emptyOrderedSet()
      : qu.isOrderedSet(value)
      ? value
      : emptyOrderedSet().withMutations(set => {
          const iter = new Collection.Set(value)
          qu.assertNotInfinite(iter.size)
          iter.forEach(v => set.add(v))
        })
  }
  static of(...xs) {
    return this(...xs)
  }
  static fromKeys(value) {
    return this(KeyedCollection(value).keySeq())
  }
  toString() {
    return this.__toString("OrderedSet {", "}")
  }
}

export namespace OrderedSet {
  function isOrderedSet(maybeOrderedSet: unknown): boolean
  function of<T>(...xs: Array<T>): OrderedSet<T>
  function fromKeys<T>(iter: Collection<T, unknown>): OrderedSet<T>
  function fromKeys(obj: Dict): OrderedSet<string>
}
/*
export function OrderedSet<T>(collection?: Iterable<T> | ArrayLike<T>): OrderedSet<T>
*/

OrderedSet.isOrderedSet = qu.isOrderedSet
const OrderedSetPrototype = OrderedSet.prototype
OrderedSetPrototype[qu.IS_ORDERED_SYMBOL] = true
OrderedSetPrototype.zip = Collection.Indexed.prototype.zip
OrderedSetPrototype.zipWith = Collection.Indexed.prototype.zipWith
OrderedSetPrototype.zipAll = Collection.Indexed.prototype.zipAll
OrderedSetPrototype.__empty = emptyOrderedSet
OrderedSetPrototype.__make = makeOrderedSet

function makeOrderedSet(map, ownerID) {
  const y = Object.create(OrderedSetPrototype)
  y.size = map ? map.size : 0
  y._map = map
  y.__ownerID = ownerID
  return y
}

let EMPTY_ORDERED_SET
function emptyOrderedSet() {
  return EMPTY_ORDERED_SET || (EMPTY_ORDERED_SET = makeOrderedSet(emptyOrderedMap()))
}
