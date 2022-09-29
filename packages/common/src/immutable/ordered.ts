import * as qu from "./utils.js"
import { EMPTY_LIST } from "./list.js"
import { Map, EMPTY_MAP } from "./map.js"
import { Set } from "./set.js"
import { Collection } from "./main.js"
import type * as qt from "./types.js"

export class OrderedMap<K, V> extends Map<K, V> implements qt.OrderedMap<K, V> {
  static isOrderedMap = qu.isOrderedMap
  static override from<K, V>(x?: Iterable<[K, V]>): qt.OrderedMap<K, V>
  static override from<V>(x: qt.ByStr<V>): qt.OrderedMap<string, V>
  static override from(x: any): any {
    return x === undefined || x === null
      ? EMPTY_ORDERED_MAP
      : qu.isOrderedMap(x)
      ? x
      : EMPTY_ORDERED_MAP.withMutations(x2 => {
          const y = Collection.ByKey.from(x)
          qu.assertNotInfinite(y.size)
          y.forEach((v, k) => x2.set(k, v))
        })
  }
  static override of<K, V>(...xs) {
    return new OrderedMap<K, V>(xs)
  }

  [Symbol.q_ordered] = true;
  override [Symbol.q_delete] = this.remove

  constructor(private _map?: any, private _list?: any, override _owner?: any, hash?: number, private _dirty = false) {
    super()
    this.size = _map ? _map.size : 0
    this._hash = hash
  }

  override toString() {
    return this.__toString("OrderedMap {", "}")
  }
  override get(k: K, v0?: unknown) {
    const index = this._map.get(k)
    return index !== undefined ? this._list.get(index)[1] : v0
  }
  override clear() {
    if (this.size === 0) return this
    if (this._owner) {
      this.size = 0
      this._map.clear()
      this._list.clear()
      this._dirty = true
      return this
    }
    return EMPTY_ORDERED_MAP
  }
  override set(k: K, v: V) {
    return updateOrderedMap(this, k, v)
  }
  override remove(k: K) {
    return updateOrderedMap(this, k, qu.NOT_SET)
  }
  [Symbol.q_loop](f: qt.Step<K, V, this>, reverse?: boolean) {
    return this._list[Symbol.q_loop](x => x && f(x[1], x[0], this), reverse)
  }
  [Symbol.q_iter](m: qu.Iter.Mode, reverse?: boolean) {
    return this._list.fromEntrySeq()[Symbol.q_iter](m, reverse)
  }
  override __ensureOwner(x) {
    if (x === this._owner) return this
    const newMap = this._map.__ensureOwner(x)
    const newList = this._list.__ensureOwner(x)
    if (!x) {
      if (this.size === 0) return EMPTY_ORDERED_MAP
      this._owner = x
      this._dirty = false
      this._map = newMap
      this._list = newList
      return this
    }
    return new OrderedMap(newMap, newList, x, this._hash)
  }
}

const EMPTY_ORDERED_MAP = new OrderedMap(EMPTY_MAP, EMPTY_LIST)

function updateOrderedMap(x, k, v) {
  const map = x._map
  const list = x._list
  const i = map.get(k)
  const has = i !== undefined
  let newMap
  let newList
  if (v === qu.NOT_SET) {
    if (!has) return x
    if (list.size >= qu.SIZE && list.size >= map.size * 2) {
      newList = list.filter((entry, idx) => entry !== undefined && i !== idx)
      newMap = newList
        .toSeqKeyed()
        .map(entry => entry[0])
        .flip()
        .toMap()
      if (x.__owner) newMap.__owner = newList.__owner = x.__owner
    } else {
      newMap = map.remove(k)
      newList = i === list.size - 1 ? list.pop() : list.set(i, undefined)
    }
  } else if (has) {
    if (v === list.get(i)[1]) return x
    newMap = map
    newList = list.set(i, [k, v])
  } else {
    newMap = map.set(k, list.size)
    newList = list.set(list.size, [k, v])
  }
  if (x.__owner) {
    x.size = newMap.size
    x._map = newMap
    x._list = newList
    x._hash = undefined
    x._dirty = true
    return x
  }
  return new OrderedMap(newMap, newList)
}

export class OrderedSet<K> extends Set<K> implements qt.OrderedSet<K> {
  static isOrderedSet = qu.isOrderedSet

  static override from<T>(x?: Iterable<T> | ArrayLike<T>): OrderedSet<T> {
    return x === undefined || x === null
      ? EMPTY_ORDERED_SET
      : qu.isOrderedSet(x)
      ? x
      : EMPTY_ORDERED_SET.withMutations(x2 => {
          const y = Collection.ByVal.from(x)
          qu.assertNotInfinite(y.size)
          y.forEach(v => x2.add(v))
        })
  }

  static override of<T>(...xs: Array<T>): OrderedSet<T> {
    return this(...xs)
  }
  static override fromKeys<T>(x: Collection<T, unknown>): OrderedSet<T>
  static override fromKeys(x: qt.ByStr): OrderedSet<string>
  static override fromKeys(x: any): any {
    return this(Collection.ByKey.from(x).keySeq())
  }

  [Symbol.q_ordered] = true

  constructor(map?: any, private _owner?: any) {
    super(map)
    this.size = map ? map.size : 0
  }

  override toString() {
    return this.__toString("OrderedSet {", "}")
  }
  zip = Collection.ByIdx.prototype.zip
  zipWith = Collection.ByIdx.prototype.zipWith
  zipAll = Collection.ByIdx.prototype.zipAll
  override __empty = EMPTY_ORDERED_SET
  override __make = OrderedSet
}

export const EMPTY_ORDERED_SET = new OrderedSet(EMPTY_ORDERED_MAP)
