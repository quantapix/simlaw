import { Collection } from "./main.js"
import { OrderedMap } from "./ordered.js"
import { sortFactory } from "./operations.js"
import * as qf from "./functions.js"
import * as qu from "./utils.js"
import type * as qt from "./types.js"

export class Map<K, V> extends Collection.Keyed<K, V> implements qt.Map<K, V> {
  static isMap = qu.isMap
  static of(...xs: Array<unknown>): Map<unknown, unknown> {
    return emptyMap().withMutations(x => {
      for (let i = 0; i < xs.length; i += 2) {
        if (i + 1 >= xs.length) throw new Error("Missing value for key: " + xs[i])
        x.set(xs[i], xs[i + 1])
      }
    })
  }

  static override create<K, V>(x?: Iterable<[K, V]>): Map<K, V>
  static override create<V>(x: Dict<V>): Map<string, V>
  static override create<K extends string | symbol, V>(x: { [P in K]?: V }): Map<K, V>
  static override create(x: any): any {
    return x === undefined || x === null
      ? emptyMap()
      : qu.isMap(x) && !qu.isOrdered(x)
      ? x
      : emptyMap().withMutations(x2 => {
          const iter = new Collection.Keyed(x)
          qu.assertNotInfinite(iter.size)
          iter.forEach((v, k) => x2.set(k, v))
        })
  }
  [qu.IS_MAP_SYMBOL] = true;
  [qu.DELETE] = this.remove

  override toString() {
    return this.__toString("Map {", "}")
  }
  override get(k, notSetValue) {
    return this._root ? this._root.get(0, undefined, k, notSetValue) : notSetValue
  }
  set(k, v) {
    return updateMap(this, k, v)
  }
  remove(k) {
    return updateMap(this, k, qu.NOT_SET)
  }
  deleteAll(keys) {
    const collection = Collection(keys)
    if (collection.size === 0) return this
    return this.withMutations(map => {
      collection.forEach(key => map.remove(key))
    })
  }
  clear() {
    if (this.size === 0) return this
    if (this.__ownerID) {
      this.size = 0
      this._root = null
      this.__hash = undefined
      this.__altered = true
      return this
    }
    return emptyMap()
  }
  override sort(comparator) {
    return OrderedMap(sortFactory(this, comparator))
  }
  override sortBy(mapper, comparator) {
    return OrderedMap(sortFactory(this, comparator, mapper))
  }
  override map(mapper, context) {
    return this.withMutations(map => {
      map.forEach((value, key) => {
        map.set(key, mapper.call(context, value, key, this))
      })
    })
  }
  __iterator(type, reverse) {
    return new MapIterator(this, type, reverse)
  }
  __iterate(fn, reverse) {
    let iterations = 0
    this._root &&
      this._root.iterate(entry => {
        iterations++
        return fn(entry[1], entry[0], this)
      }, reverse)
    return iterations
  }
  __ensureOwner(ownerID) {
    if (ownerID === this.__ownerID) return this
    if (!ownerID) {
      if (this.size === 0) return emptyMap()
      this.__ownerID = ownerID
      this.__altered = false
      return this
    }
    return makeMap(this.size, this._root, ownerID, this.__hash)
  }
  removeAll = this.deleteAll
  setIn = qf.setIn
  deleteIn = qf.deleteIn
  removeIn = qf.deleteIn
  override update = qf.update
  updateIn = qf.updateIn
  merge = (this.concat = qf.merge)
  mergeWith = qf.mergeWith
  mergeDeep = qf.mergeDeep
  mergeDeepWith = qf.mergeDeepWith
  mergeIn = qf.mergeIn
  mergeDeepIn = qf.mergeDeepIn
  withMutations = qf.withMutations
  wasAltered = qf.wasAltered
  asImmutable = qf.asImmutable
  asMutable = qf.asMutable;
  ["@@transducer/init"] = qf.asMutable;
  ["@@transducer/step"] = function (result, arr) {
    return result.set(arr[0], arr[1])
  };
  ["@@transducer/result"] = function (x) {
    return x.asImmutable()
  }
}

class ArrayMapNode {
  constructor(ownerID, entries) {
    this.ownerID = ownerID
    this.entries = entries
  }
  get(shift, keyHash, key, notSetValue) {
    const entries = this.entries
    for (let ii = 0, len = entries.length; ii < len; ii++) {
      if (qu.is(key, entries[ii][0])) return entries[ii][1]
    }
    return notSetValue
  }
  update(ownerID, shift, keyHash, key, value, didChangeSize, didAlter) {
    const removed = value === qu.NOT_SET
    const entries = this.entries
    let idx = 0
    const len = entries.length
    for (; idx < len; idx++) {
      if (qu.is(key, entries[idx][0])) break
    }
    const exists = idx < len
    if (exists ? entries[idx][1] === value : removed) return this
    qu.SetRef(didAlter)
    ;(removed || !exists) && qu.SetRef(didChangeSize)
    if (removed && entries.length === 1) return
    if (!exists && !removed && entries.length >= MAX_ARRAY_MAP_SIZE) {
      return createNodes(ownerID, entries, key, value)
    }
    const isEditable = ownerID && ownerID === this.ownerID
    const newEntries = isEditable ? entries : qu.arrCopy(entries)
    if (exists) {
      if (removed) idx === len - 1 ? newEntries.pop() : (newEntries[idx] = newEntries.pop())
      else newEntries[idx] = [key, value]
    } else newEntries.push([key, value])
    if (isEditable) {
      this.entries = newEntries
      return this
    }
    return new ArrayMapNode(ownerID, newEntries)
  }
}

class BitmapIndexedNode {
  constructor(ownerID, bitmap, nodes) {
    this.ownerID = ownerID
    this.bitmap = bitmap
    this.nodes = nodes
  }
  get(shift, keyHash, key, notSetValue) {
    if (keyHash === undefined) keyHash = qu.hash(key)
    const bit = 1 << ((shift === 0 ? keyHash : keyHash >>> shift) & qu.MASK)
    const bitmap = this.bitmap
    return (bitmap & bit) === 0 ? notSetValue : this.nodes[popCount(bitmap & (bit - 1))].get(shift + qu.SHIFT, keyHash, key, notSetValue)
  }
  update(ownerID, shift, keyHash, key, value, didChangeSize, didAlter) {
    if (keyHash === undefined) keyHash = qu.hash(key)
    const keyHashFrag = (shift === 0 ? keyHash : keyHash >>> shift) & qu.MASK
    const bit = 1 << keyHashFrag
    const bitmap = this.bitmap
    const exists = (bitmap & bit) !== 0
    if (!exists && value === qu.NOT_SET) return this
    const idx = popCount(bitmap & (bit - 1))
    const nodes = this.nodes
    const node = exists ? nodes[idx] : undefined
    const newNode = updateNode(node, ownerID, shift + qu.SHIFT, keyHash, key, value, didChangeSize, didAlter)
    if (newNode === node) return this
    if (!exists && newNode && nodes.length >= MAX_BITMAP_INDEXED_SIZE) {
      return expandNodes(ownerID, nodes, bitmap, keyHashFrag, newNode)
    }
    if (exists && !newNode && nodes.length === 2 && isLeafNode(nodes[idx ^ 1])) return nodes[idx ^ 1]
    if (exists && newNode && nodes.length === 1 && isLeafNode(newNode)) return newNode
    const isEditable = ownerID && ownerID === this.ownerID
    const newBitmap = exists ? (newNode ? bitmap : bitmap ^ bit) : bitmap | bit
    const newNodes = exists ? (newNode ? setAt(nodes, idx, newNode, isEditable) : spliceOut(nodes, idx, isEditable)) : spliceIn(nodes, idx, newNode, isEditable)
    if (isEditable) {
      this.bitmap = newBitmap
      this.nodes = newNodes
      return this
    }
    return new BitmapIndexedNode(ownerID, newBitmap, newNodes)
  }
}

class HashArrayMapNode {
  constructor(ownerID, count, nodes) {
    this.ownerID = ownerID
    this.count = count
    this.nodes = nodes
  }
  get(shift, keyHash, key, notSetValue) {
    if (keyHash === undefined) keyHash = qu.hash(key)
    const idx = (shift === 0 ? keyHash : keyHash >>> shift) & qu.MASK
    const node = this.nodes[idx]
    return node ? node.get(shift + qu.SHIFT, keyHash, key, notSetValue) : notSetValue
  }
  update(ownerID, shift, keyHash, key, value, didChangeSize, didAlter) {
    if (keyHash === undefined) keyHash = qu.hash(key)
    const idx = (shift === 0 ? keyHash : keyHash >>> shift) & qu.MASK
    const removed = value === qu.NOT_SET
    const nodes = this.nodes
    const node = nodes[idx]
    if (removed && !node) return this
    const newNode = updateNode(node, ownerID, shift + qu.SHIFT, keyHash, key, value, didChangeSize, didAlter)
    if (newNode === node) return this
    let newCount = this.count
    if (!node) newCount++
    else if (!newNode) {
      newCount--
      if (newCount < MIN_HASH_ARRAY_MAP_SIZE) return packNodes(ownerID, nodes, newCount, idx)
    }
    const isEditable = ownerID && ownerID === this.ownerID
    const newNodes = setAt(nodes, idx, newNode, isEditable)
    if (isEditable) {
      this.count = newCount
      this.nodes = newNodes
      return this
    }
    return new HashArrayMapNode(ownerID, newCount, newNodes)
  }
}

class HashCollisionNode {
  constructor(ownerID, keyHash, entries) {
    this.ownerID = ownerID
    this.keyHash = keyHash
    this.entries = entries
  }
  get(shift, keyHash, key, notSetValue) {
    const entries = this.entries
    for (let ii = 0, len = entries.length; ii < len; ii++) {
      if (qu.is(key, entries[ii][0])) return entries[ii][1]
    }
    return notSetValue
  }
  update(ownerID, shift, keyHash, key, value, didChangeSize, didAlter) {
    if (keyHash === undefined) keyHash = qu.hash(key)
    const removed = value === qu.NOT_SET
    if (keyHash !== this.keyHash) {
      if (removed) return this
      qu.SetRef(didAlter)
      qu.SetRef(didChangeSize)
      return mergeIntoNode(this, ownerID, shift, keyHash, [key, value])
    }
    const entries = this.entries
    let idx = 0
    const len = entries.length
    for (; idx < len; idx++) {
      if (qu.is(key, entries[idx][0])) break
    }
    const exists = idx < len
    if (exists ? entries[idx][1] === value : removed) return this
    qu.SetRef(didAlter)
    ;(removed || !exists) && qu.SetRef(didChangeSize)
    if (removed && len === 2) return new ValueNode(ownerID, this.keyHash, entries[idx ^ 1])
    const isEditable = ownerID && ownerID === this.ownerID
    const newEntries = isEditable ? entries : qu.arrCopy(entries)
    if (exists) {
      if (removed) idx === len - 1 ? newEntries.pop() : (newEntries[idx] = newEntries.pop())
      else newEntries[idx] = [key, value]
    } else newEntries.push([key, value])
    if (isEditable) {
      this.entries = newEntries
      return this
    }
    return new HashCollisionNode(ownerID, this.keyHash, newEntries)
  }
}

class ValueNode {
  constructor(ownerID, keyHash, entry) {
    this.ownerID = ownerID
    this.keyHash = keyHash
    this.entry = entry
  }
  get(shift, keyHash, key, notSetValue) {
    return qu.is(key, this.entry[0]) ? this.entry[1] : notSetValue
  }
  update(ownerID, shift, keyHash, key, value, didChangeSize, didAlter) {
    const removed = value === qu.NOT_SET
    const keyMatch = qu.is(key, this.entry[0])
    if (keyMatch ? value === this.entry[1] : removed) return this

    qu.SetRef(didAlter)
    if (removed) {
      qu.SetRef(didChangeSize)
      return
    }
    if (keyMatch) {
      if (ownerID && ownerID === this.ownerID) {
        this.entry[1] = value
        return this
      }
      return new ValueNode(ownerID, this.keyHash, [key, value])
    }
    qu.SetRef(didChangeSize)
    return mergeIntoNode(this, ownerID, shift, qu.hash(key), [key, value])
  }
}

ArrayMapNode.prototype.iterate = HashCollisionNode.prototype.iterate = function (fn, reverse) {
  const entries = this.entries
  for (let ii = 0, maxIndex = entries.length - 1; ii <= maxIndex; ii++) {
    if (fn(entries[reverse ? maxIndex - ii : ii]) === false) return false
  }
}

BitmapIndexedNode.prototype.iterate = HashArrayMapNode.prototype.iterate = function (fn, reverse) {
  const nodes = this.nodes
  for (let ii = 0, maxIndex = nodes.length - 1; ii <= maxIndex; ii++) {
    const node = nodes[reverse ? maxIndex - ii : ii]
    if (node && node.iterate(fn, reverse) === false) return false
  }
}

ValueNode.prototype.iterate = function (fn, reverse) {
  return fn(this.entry)
}

class MapIterator extends qu.Iterator {
  constructor(map, type, reverse) {
    this._type = type
    this._reverse = reverse
    this._stack = map._root && mapIteratorFrame(map._root)
  }
  next() {
    const type = this._type
    let stack = this._stack
    while (stack) {
      const node = stack.node
      const index = stack.index++
      let maxIndex
      if (node.entry) {
        if (index === 0) return mapIteratorValue(type, node.entry)
      } else if (node.entries) {
        maxIndex = node.entries.length - 1
        if (index <= maxIndex) return mapIteratorValue(type, node.entries[this._reverse ? maxIndex - index : index])
      } else {
        maxIndex = node.nodes.length - 1
        if (index <= maxIndex) {
          const subNode = node.nodes[this._reverse ? maxIndex - index : index]
          if (subNode) {
            if (subNode.entry) return mapIteratorValue(type, subNode.entry)
            stack = this._stack = mapIteratorFrame(subNode, stack)
          }
          continue
        }
      }
      stack = this._stack = this._stack.__prev
    }
    return qu.iteratorDone()
  }
}

function mapIteratorValue(type, entry) {
  return qu.iteratorValue(type, entry[0], entry[1])
}

function mapIteratorFrame(node, prev) {
  return { node: node, index: 0, __prev: prev }
}

function makeMap(size, root, ownerID, hash) {
  const map = Object.create(MapPrototype)
  map.size = size
  map._root = root
  map.__ownerID = ownerID
  map.__hash = hash
  map.__altered = false
  return map
}

let EMPTY_MAP
export function emptyMap() {
  return EMPTY_MAP || (EMPTY_MAP = makeMap(0))
}

function updateMap(map, k, v) {
  let newRoot
  let newSize
  if (!map._root) {
    if (v === qu.NOT_SET) return map
    newSize = 1
    newRoot = new ArrayMapNode(map.__ownerID, [[k, v]])
  } else {
    const didChangeSize = qu.MakeRef()
    const didAlter = qu.MakeRef()
    newRoot = updateNode(map._root, map.__ownerID, 0, undefined, k, v, didChangeSize, didAlter)
    if (!didAlter.value) return map
    newSize = map.size + (didChangeSize.value ? (v === qu.NOT_SET ? -1 : 1) : 0)
  }
  if (map.__ownerID) {
    map.size = newSize
    map._root = newRoot
    map.__hash = undefined
    map.__altered = true
    return map
  }
  return newRoot ? makeMap(newSize, newRoot) : emptyMap()
}

function updateNode(node, ownerID, shift, keyHash, key, value, didChangeSize, didAlter) {
  if (!node) {
    if (value === qu.NOT_SET) return node
    qu.SetRef(didAlter)
    qu.SetRef(didChangeSize)
    return new ValueNode(ownerID, keyHash, [key, value])
  }
  return node.update(ownerID, shift, keyHash, key, value, didChangeSize, didAlter)
}

function isLeafNode(node) {
  return node.constructor === ValueNode || node.constructor === HashCollisionNode
}

function mergeIntoNode(node, ownerID, shift, keyHash, entry) {
  if (node.keyHash === keyHash) return new HashCollisionNode(ownerID, keyHash, [node.entry, entry])
  const idx1 = (shift === 0 ? node.keyHash : node.keyHash >>> shift) & qu.MASK
  const idx2 = (shift === 0 ? keyHash : keyHash >>> shift) & qu.MASK
  let newNode
  const nodes = idx1 === idx2 ? [mergeIntoNode(node, ownerID, shift + qu.SHIFT, keyHash, entry)] : ((newNode = new ValueNode(ownerID, keyHash, entry)), idx1 < idx2 ? [node, newNode] : [newNode, node])
  return new BitmapIndexedNode(ownerID, (1 << idx1) | (1 << idx2), nodes)
}

function createNodes(ownerID, entries, key, value) {
  if (!ownerID) ownerID = new qu.OwnerID()
  let node = new ValueNode(ownerID, qu.hash(key), [key, value])
  for (let ii = 0; ii < entries.length; ii++) {
    const entry = entries[ii]
    node = node.update(ownerID, 0, undefined, entry[0], entry[1])
  }
  return node
}

function packNodes(ownerID, nodes, count, excluding) {
  let bitmap = 0
  let packedII = 0
  const packedNodes = new Array(count)
  for (let ii = 0, bit = 1, len = nodes.length; ii < len; ii++, bit <<= 1) {
    const node = nodes[ii]
    if (node !== undefined && ii !== excluding) {
      bitmap |= bit
      packedNodes[packedII++] = node
    }
  }
  return new BitmapIndexedNode(ownerID, bitmap, packedNodes)
}

function expandNodes(ownerID, nodes, bitmap, including, node) {
  let count = 0
  const expandedNodes = new Array(qu.SIZE)
  for (let ii = 0; bitmap !== 0; ii++, bitmap >>>= 1) {
    expandedNodes[ii] = bitmap & 1 ? nodes[count++] : undefined
  }
  expandedNodes[including] = node
  return new HashArrayMapNode(ownerID, count + 1, expandedNodes)
}

function popCount(x) {
  x -= (x >> 1) & 0x55555555
  x = (x & 0x33333333) + ((x >> 2) & 0x33333333)
  x = (x + (x >> 4)) & 0x0f0f0f0f
  x += x >> 8
  x += x >> 16
  return x & 0x7f
}

function setAt(array, idx, val, canEdit) {
  const newArray = canEdit ? array : qu.arrCopy(array)
  newArray[idx] = val
  return newArray
}

function spliceIn(array, idx, val, canEdit) {
  const newLen = array.length + 1
  if (canEdit && idx + 1 === newLen) {
    array[idx] = val
    return array
  }
  const newArray = new Array(newLen)
  let after = 0
  for (let ii = 0; ii < newLen; ii++) {
    if (ii === idx) {
      newArray[ii] = val
      after = -1
    } else newArray[ii] = array[ii + after]
  }
  return newArray
}

function spliceOut(array, idx, canEdit) {
  const newLen = array.length - 1
  if (canEdit && idx === newLen) {
    array.pop()
    return array
  }
  const newArray = new Array(newLen)
  let after = 0
  for (let ii = 0; ii < newLen; ii++) {
    if (ii === idx) after = 1
    newArray[ii] = array[ii + after]
  }
  return newArray
}

const MAX_ARRAY_MAP_SIZE = qu.SIZE / 4
const MAX_BITMAP_INDEXED_SIZE = qu.SIZE / 2
const MIN_HASH_ARRAY_MAP_SIZE = qu.SIZE / 4
