import { KeyedCollection } from "./Collection.js"
import { IS_ORDERED_SYMBOL } from "./predicates/isOrdered"
import { isOrderedMap } from "./predicates/isOrderedMap"
import { Map, emptyMap } from "./Map.js"
import { emptyList } from "./List.js"
import { DELETE, NOT_SET, SIZE } from "./TrieUtils.js"
import assertNotInfinite from "./utils/assertNotInfinite"

export class OrderedMap extends Map {
  // @pragma Construction

  constructor(value) {
    return value === undefined || value === null
      ? emptyOrderedMap()
      : isOrderedMap(value)
      ? value
      : emptyOrderedMap().withMutations(map => {
          const iter = KeyedCollection(value)
          assertNotInfinite(iter.size)
          iter.forEach((v, k) => map.set(k, v))
        })
  }

  static of(/*...values*/) {
    return this(arguments)
  }

  toString() {
    return this.__toString("OrderedMap {", "}")
  }

  // @pragma Access

  get(k, notSetValue) {
    const index = this._map.get(k)
    return index !== undefined ? this._list.get(index)[1] : notSetValue
  }

  // @pragma Modification

  clear() {
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

  set(k, v) {
    return updateOrderedMap(this, k, v)
  }

  remove(k) {
    return updateOrderedMap(this, k, NOT_SET)
  }

  __iterate(fn, reverse) {
    return this._list.__iterate(
      entry => entry && fn(entry[1], entry[0], this),
      reverse
    )
  }

  __iterator(type, reverse) {
    return this._list.fromEntrySeq().__iterator(type, reverse)
  }

  __ensureOwner(ownerID) {
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

OrderedMap.isOrderedMap = isOrderedMap

OrderedMap.prototype[IS_ORDERED_SYMBOL] = true
OrderedMap.prototype[DELETE] = OrderedMap.prototype.remove

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
  return (
    EMPTY_ORDERED_MAP ||
    (EMPTY_ORDERED_MAP = makeOrderedMap(emptyMap(), emptyList()))
  )
}

function updateOrderedMap(omap, k, v) {
  const map = omap._map
  const list = omap._list
  const i = map.get(k)
  const has = i !== undefined
  let newMap
  let newList
  if (v === NOT_SET) {
    // removed
    if (!has) {
      return omap
    }
    if (list.size >= SIZE && list.size >= map.size * 2) {
      newList = list.filter((entry, idx) => entry !== undefined && i !== idx)
      newMap = newList
        .toKeyedSeq()
        .map(entry => entry[0])
        .flip()
        .toMap()
      if (omap.__ownerID) {
        newMap.__ownerID = newList.__ownerID = omap.__ownerID
      }
    } else {
      newMap = map.remove(k)
      newList = i === list.size - 1 ? list.pop() : list.set(i, undefined)
    }
  } else if (has) {
    if (v === list.get(i)[1]) {
      return omap
    }
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

import { SetCollection, KeyedCollection } from "./Collection.js"
import { IS_ORDERED_SYMBOL } from "./predicates/isOrdered"
import { isOrderedSet } from "./predicates/isOrderedSet"
import { IndexedCollectionPrototype } from "./CollectionImpl"
import { Set } from "./Set.js"
import { emptyOrderedMap } from "./ordered.js"
import assertNotInfinite from "./utils/assertNotInfinite"

export class OrderedSet extends Set {
  // @pragma Construction

  constructor(value) {
    return value === undefined || value === null
      ? emptyOrderedSet()
      : isOrderedSet(value)
      ? value
      : emptyOrderedSet().withMutations(set => {
          const iter = SetCollection(value)
          assertNotInfinite(iter.size)
          iter.forEach(v => set.add(v))
        })
  }

  static of(/*...values*/) {
    return this(arguments)
  }

  static fromKeys(value) {
    return this(KeyedCollection(value).keySeq())
  }

  toString() {
    return this.__toString("OrderedSet {", "}")
  }
}

OrderedSet.isOrderedSet = isOrderedSet

const OrderedSetPrototype = OrderedSet.prototype
OrderedSetPrototype[IS_ORDERED_SYMBOL] = true
OrderedSetPrototype.zip = IndexedCollectionPrototype.zip
OrderedSetPrototype.zipWith = IndexedCollectionPrototype.zipWith
OrderedSetPrototype.zipAll = IndexedCollectionPrototype.zipAll

OrderedSetPrototype.__empty = emptyOrderedSet
OrderedSetPrototype.__make = makeOrderedSet

function makeOrderedSet(map, ownerID) {
  const set = Object.create(OrderedSetPrototype)
  set.size = map ? map.size : 0
  set._map = map
  set.__ownerID = ownerID
  return set
}

let EMPTY_ORDERED_SET
function emptyOrderedSet() {
  return (
    EMPTY_ORDERED_SET || (EMPTY_ORDERED_SET = makeOrderedSet(emptyOrderedMap()))
  )
}
