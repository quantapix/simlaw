import * as qu from "./utils.js"
import { emptyList } from "./list.js"
import { Map, emptyMap } from "./map.js"
import { Set } from "./set.js"
import { Collection } from "./main.js"
import type * as qt from "./types.js"

export class OrderedMap<K, V> extends Map<K, V> implements qt.OrderedMap<K, V> {
  static isOrderedMap = qu.isOrderedMap
  static override create<K, V>(x?: Iterable<[K, V]>): qt.OrderedMap<K, V>
  static override create<V>(x: qt.Dict<V>): qt.OrderedMap<string, V>
  static override create(x: any): any {
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
  static override of<K, V>(...xs) {
    return new OrderedMap<K, V>(...xs)
  }

  [qu.IS_ORDERED_SYMBOL] = true;
  override [qu.DELETE] = this.remove

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
    if (this.__owner) {
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
  override __ensureOwner(owner) {
    if (owner === this.__owner) {
      return this
    }
    const newMap = this._map.__ensureOwner(owner)
    const newList = this._list.__ensureOwner(owner)
    if (!owner) {
      if (this.size === 0) {
        return emptyOrderedMap()
      }
      this.__owner = owner
      this.__altered = false
      this._map = newMap
      this._list = newList
      return this
    }
    return makeOrderedMap(newMap, newList, owner, this.__hash)
  }
}

function makeOrderedMap(map, list, owner, hash) {
  const omap = Object.create(OrderedMap.prototype)
  omap.size = map ? map.size : 0
  omap._map = map
  omap._list = list
  omap.__owner = owner
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
      if (omap.__owner) newMap.__owner = newList.__owner = omap.__owner
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
  if (omap.__owner) {
    omap.size = newMap.size
    omap._map = newMap
    omap._list = newList
    omap.__hash = undefined
    omap.__altered = true
    return omap
  }
  return makeOrderedMap(newMap, newList)
}

export class OrderedSet<K> extends Set<K> implements qt.OrderedSet<K> {
  static isOrderedSet = qu.isOrderedSet

  static override create<T>(x?: Iterable<T> | ArrayLike<T>): OrderedSet<T> {
    return x === undefined || x === null
      ? emptyOrderedSet()
      : qu.isOrderedSet(x)
      ? x
      : emptyOrderedSet().withMutations(x2 => {
          const y = new Collection.Set(x)
          qu.assertNotInfinite(y.size)
          y.forEach(v => x2.add(v))
        })
  }

  static override of<T>(...xs: Array<T>): OrderedSet<T> {
    return this(...xs)
  }
  static override fromKeys<T>(x: Collection<T, unknown>): OrderedSet<T>
  static override fromKeys(x: qt.Dict): OrderedSet<string>
  static override fromKeys(x: any): any {
    return this(new Collection.Keyed(x).keySeq())
  }

  [qu.IS_ORDERED_SYMBOL] = true

  override toString() {
    return this.__toString("OrderedSet {", "}")
  }
  zip = Collection.Indexed.prototype.zip
  zipWith = Collection.Indexed.prototype.zipWith
  zipAll = Collection.Indexed.prototype.zipAll
  override __empty = emptyOrderedSet
  override __make = makeOrderedSet
}

function makeOrderedSet(map, owner) {
  const y = Object.create(OrderedSet.prototype)
  y.size = map ? map.size : 0
  y._map = map
  y.__owner = owner
  return y
}

let EMPTY_ORDERED_SET

function emptyOrderedSet() {
  return EMPTY_ORDERED_SET || (EMPTY_ORDERED_SET = makeOrderedSet(emptyOrderedMap()))
}
