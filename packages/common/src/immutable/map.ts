import { Collection } from "./main.js"
import { OrderedMap } from "./ordered.js"
import * as qc from "./core.js"
import * as qu from "./utils.js"
import type * as qt from "./types.js"

export class Map<K, V> extends Collection.ByKey<K, V> implements qt.Map<K, V> {
  static isMap = qu.isMap
  static of(...xs: Array<unknown>): Map<unknown, unknown> {
    return emptyMap().withMutations(x => {
      for (let i = 0; i < xs.length; i += 2) {
        if (i + 1 >= xs.length) throw new Error("Missing value for key: " + xs[i])
        x.set(xs[i], xs[i + 1])
      }
    })
  }

  static override from<K, V>(x?: Iterable<[K, V]>): Map<K, V>
  static override from<V>(x: qt.ByStr<V>): Map<string, V>
  static override from<K extends string | symbol, V>(x: { [P in K]?: V }): Map<K, V>
  static override from(x: any): any {
    return x === undefined || x === null
      ? emptyMap()
      : qu.isMap(x) && !qu.isOrdered(x)
      ? x
      : emptyMap().withMutations(x2 => {
          const y = Collection.ByKey.from(x)
          qu.assertNotInfinite(y.size)
          y.forEach((v, k) => x2.set(k, v))
        })
  }
  [Symbol.q_map] = true;
  [Symbol.q_delete] = this.remove

  override toString() {
    return this.__toString("Map {", "}")
  }
  override get(k: K, v0?: unknown) {
    return this._root ? this._root.get(0, undefined, k, v0) : v0
  }
  set(k: K, v: V) {
    return updateMap(this, k, v)
  }
  remove(k: K) {
    return updateMap(this, k, qu.NOT_SET)
  }
  deleteAll(xs) {
    const y = Collection.from(xs)
    if (y.size === 0) return this
    return this.withMutations(x => {
      y.forEach((k: K) => x.remove(k))
    })
  }
  clear() {
    if (this.size === 0) return this
    if (this.__owner) {
      this.size = 0
      this._root = null
      this._hash = undefined
      this.__altered = true
      return this
    }
    return emptyMap()
  }
  override sort(c?: Function) {
    return OrderedMap.from(qc.sort(this, c))
  }
  override sortBy(f: Function, c?: Function) {
    return OrderedMap.from(qc.sort(this, c, f))
  }
  override map(f: Function, ctx?: unknown) {
    return this.withMutations(x => {
      x.forEach((v: V, k: K) => {
        x.set(k, f.call(ctx, v, k, this))
      })
    })
  }
  __loop(f: Function, reverse: boolean) {
    let i = 0
    this._root &&
      this._root.iterate(([v, k]: [V, K]) => {
        i++
        return f(v, k, this)
      }, reverse)
    return i
  }
  __iter(m: qu.Iter.Mode, reverse: boolean) {
    return new MapIterator(this, m, reverse)
  }
  __ensureOwner(x) {
    if (x === this.__owner) return this
    if (!x) {
      if (this.size === 0) return emptyMap()
      this.__owner = x
      this.__altered = false
      return this
    }
    return makeMap(this.size, this._root, x, this._hash)
  }
  concat = this.merge
  removeAll = this.deleteAll
  setIn = (x: any, v: unknown) => qc.setIn(this, x, v)
  deleteIn = qc.deleteIn
  removeIn = qc.deleteIn
  override update = (x: any, v0?: unknown, f?: any) =>
    v0 === undefined && f === undefined ? x(this) : qc.update(this, x, v0, f)
  updateIn = (x: any, v0: unknown, f?: any) => qc.updateIn(this, x, v0, f)
  merge = (...xs: unknown[]) => qc.mergeIntoKeyedWith(this, xs)
  mergeWith = (f: any, ...xs: unknown[]) => qc.mergeIntoKeyedWith(this, xs, f)
  mergeDeep = (...xs: unknown[]) => qc.mergeDeep(this, xs)
  mergeDeepWith = (f: any, ...xs: unknown[]) => qc.mergeDeepWith(f, this, xs)
  mergeIn = qc.mergeIn
  mergeDeepIn = qc.mergeDeepIn
  withMutations = qc.withMutations
  wasAltered = qc.wasAltered
  asImmutable = qc.asImmutable
  asMutable = qc.asMutable;
  ["@@transducer/init"] = qc.asMutable;
  ["@@transducer/step"] = function (result, arr) {
    return result.set(arr[0], arr[1])
  };
  ["@@transducer/result"] = function (x) {
    return x.asImmutable()
  }
}

class ArrayMapNode {
  constructor(public owner, public entries) {}
  get(shift, keyHash, k, v0) {
    const ys = this.entries
    for (let i = 0, len = ys.length; i < len; i++) {
      if (qu.is(k, ys[i][0])) return ys[i][1]
    }
    return v0
  }
  update(owner, shift, keyHash, key, value, didChangeSize, didAlter) {
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
      return createNodes(owner, entries, key, value)
    }
    const isEditable = owner && owner === this.owner
    const ys = isEditable ? entries : qu.arrCopy(entries)
    if (exists) {
      if (removed) idx === len - 1 ? ys.pop() : (ys[idx] = ys.pop())
      else ys[idx] = [key, value]
    } else ys.push([key, value])
    if (isEditable) {
      this.entries = ys
      return this
    }
    return new ArrayMapNode(owner, ys)
  }
  iterate(f, reverse) {
    const ys = this.entries
    for (let i = 0, maxIndex = ys.length - 1; i <= maxIndex; i++) {
      if (f(ys[reverse ? maxIndex - i : i]) === false) return false
    }
    return
  }
}

class HashArrayMapNode {
  constructor(public owner, public count, public nodes) {}
  get(shift, keyHash, key, notSetValue) {
    if (keyHash === undefined) keyHash = qu.hash(key)
    const idx = (shift === 0 ? keyHash : keyHash >>> shift) & qu.MASK
    const node = this.nodes[idx]
    return node ? node.get(shift + qu.SHIFT, keyHash, key, notSetValue) : notSetValue
  }
  update(owner, shift, keyHash, key, value, didChangeSize, didAlter) {
    if (keyHash === undefined) keyHash = qu.hash(key)
    const idx = (shift === 0 ? keyHash : keyHash >>> shift) & qu.MASK
    const removed = value === qu.NOT_SET
    const nodes = this.nodes
    const node = nodes[idx]
    if (removed && !node) return this
    const newNode = updateNode(node, owner, shift + qu.SHIFT, keyHash, key, value, didChangeSize, didAlter)
    if (newNode === node) return this
    let newCount = this.count
    if (!node) newCount++
    else if (!newNode) {
      newCount--
      if (newCount < MIN_HASH_ARRAY_MAP_SIZE) return packNodes(owner, nodes, newCount, idx)
    }
    const isEditable = owner && owner === this.owner
    const newNodes = setAt(nodes, idx, newNode, isEditable)
    if (isEditable) {
      this.count = newCount
      this.nodes = newNodes
      return this
    }
    return new HashArrayMapNode(owner, newCount, newNodes)
  }
  iterate(f, reverse) {
    const ys = this.nodes
    for (let i = 0, maxIndex = ys.length - 1; i <= maxIndex; i++) {
      const y = ys[reverse ? maxIndex - i : i]
      if (y && y.iterate(f, reverse) === false) return false
    }
    return
  }
}

class BitmapIndexedNode {
  constructor(public owner, public bitmap, public nodes) {}
  get(shift, keyHash, key, notSetValue) {
    if (keyHash === undefined) keyHash = qu.hash(key)
    const bit = 1 << ((shift === 0 ? keyHash : keyHash >>> shift) & qu.MASK)
    const bitmap = this.bitmap
    return (bitmap & bit) === 0
      ? notSetValue
      : this.nodes[popCount(bitmap & (bit - 1))].get(shift + qu.SHIFT, keyHash, key, notSetValue)
  }
  update(owner, shift, keyHash, key, value, didChangeSize, didAlter) {
    if (keyHash === undefined) keyHash = qu.hash(key)
    const keyHashFrag = (shift === 0 ? keyHash : keyHash >>> shift) & qu.MASK
    const bit = 1 << keyHashFrag
    const bitmap = this.bitmap
    const exists = (bitmap & bit) !== 0
    if (!exists && value === qu.NOT_SET) return this
    const idx = popCount(bitmap & (bit - 1))
    const nodes = this.nodes
    const node = exists ? nodes[idx] : undefined
    const newNode = updateNode(node, owner, shift + qu.SHIFT, keyHash, key, value, didChangeSize, didAlter)
    if (newNode === node) return this
    if (!exists && newNode && nodes.length >= MAX_BITMAP_INDEXED_SIZE) {
      return expandNodes(owner, nodes, bitmap, keyHashFrag, newNode)
    }
    if (exists && !newNode && nodes.length === 2 && isLeafNode(nodes[idx ^ 1])) return nodes[idx ^ 1]
    if (exists && newNode && nodes.length === 1 && isLeafNode(newNode)) return newNode
    const isEditable = owner && owner === this.owner
    const newBitmap = exists ? (newNode ? bitmap : bitmap ^ bit) : bitmap | bit
    const ys = exists
      ? newNode
        ? setAt(nodes, idx, newNode, isEditable)
        : spliceOut(nodes, idx, isEditable)
      : spliceIn(nodes, idx, newNode, isEditable)
    if (isEditable) {
      this.bitmap = newBitmap
      this.nodes = ys
      return this
    }
    return new BitmapIndexedNode(owner, newBitmap, ys)
  }
  iterate = HashArrayMapNode.prototype.iterate
}

class HashCollisionNode {
  constructor(public owner, public keyHash, public entries) {}
  get(shift, keyHash, key, notSetValue) {
    const entries = this.entries
    for (let ii = 0, len = entries.length; ii < len; ii++) {
      if (qu.is(key, entries[ii][0])) return entries[ii][1]
    }
    return notSetValue
  }
  update(owner, shift, keyHash, key, value, didChangeSize, didAlter) {
    if (keyHash === undefined) keyHash = qu.hash(key)
    const removed = value === qu.NOT_SET
    if (keyHash !== this.keyHash) {
      if (removed) return this
      qu.SetRef(didAlter)
      qu.SetRef(didChangeSize)
      return mergeIntoNode(this, owner, shift, keyHash, [key, value])
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
    if (removed && len === 2) return new ValueNode(owner, this.keyHash, entries[idx ^ 1])
    const isEditable = owner && owner === this.owner
    const ys = isEditable ? entries : qu.arrCopy(entries)
    if (exists) {
      if (removed) idx === len - 1 ? ys.pop() : (ys[idx] = ys.pop())
      else ys[idx] = [key, value]
    } else ys.push([key, value])
    if (isEditable) {
      this.entries = ys
      return this
    }
    return new HashCollisionNode(owner, this.keyHash, ys)
  }
  iterate = ArrayMapNode.prototype.iterate
}

class ValueNode {
  constructor(public owner, public keyHash, public entry) {}
  get(shift, keyHash, key, notSetValue) {
    return qu.is(key, this.entry[0]) ? this.entry[1] : notSetValue
  }
  update(owner, shift, keyHash, key, value, didChangeSize, didAlter) {
    const removed = value === qu.NOT_SET
    const keyMatch = qu.is(key, this.entry[0])
    if (keyMatch ? value === this.entry[1] : removed) return this
    qu.SetRef(didAlter)
    if (removed) {
      qu.SetRef(didChangeSize)
      return
    }
    if (keyMatch) {
      if (owner && owner === this.owner) {
        this.entry[1] = value
        return this
      }
      return new ValueNode(owner, this.keyHash, [key, value])
    }
    qu.SetRef(didChangeSize)
    return mergeIntoNode(this, owner, shift, qu.hash(key), [key, value])
  }
  iterate(f, reverse) {
    return f(this.entry)
  }
}

class MapIterator extends qu.Iter {
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
    return qu.Iter.done()
  }
}

function mapIteratorValue(type, entry) {
  return qu.Iter.value(type, entry[0], entry[1])
}

function mapIteratorFrame(node, prev) {
  return { node, index: 0, __prev: prev }
}

function makeMap(size, root, owner, hash) {
  const y = Object.create(MapPrototype)
  y.size = size
  y._root = root
  y.__owner = owner
  y._hash = hash
  y.__altered = false
  return y
}

let EMPTY_MAP

export function emptyMap() {
  return EMPTY_MAP || (EMPTY_MAP = makeMap(0))
}

function updateMap(x, k, v) {
  let root
  let size
  if (!x._root) {
    if (v === qu.NOT_SET) return x
    size = 1
    root = new ArrayMapNode(x.__owner, [[k, v]])
  } else {
    const didChangeSize = qu.MakeRef()
    const didAlter = qu.MakeRef()
    root = updateNode(x._root, x.__owner, 0, undefined, k, v, didChangeSize, didAlter)
    if (!didAlter.value) return x
    size = x.size + (didChangeSize.value ? (v === qu.NOT_SET ? -1 : 1) : 0)
  }
  if (x.__owner) {
    x.size = size
    x._root = root
    x._hash = undefined
    x.__altered = true
    return x
  }
  return root ? makeMap(size, root) : emptyMap()
}

function updateNode(x, owner, shift, keyHash, key, value, didChangeSize, didAlter) {
  if (!x) {
    if (value === qu.NOT_SET) return x
    qu.SetRef(didAlter)
    qu.SetRef(didChangeSize)
    return new ValueNode(owner, keyHash, [key, value])
  }
  return x.update(owner, shift, keyHash, key, value, didChangeSize, didAlter)
}

function isLeafNode(x) {
  return x.constructor === ValueNode || x.constructor === HashCollisionNode
}

function mergeIntoNode(x, owner, shift, keyHash, entry) {
  if (x.keyHash === keyHash) return new HashCollisionNode(owner, keyHash, [x.entry, entry])
  const i1 = (shift === 0 ? x.keyHash : x.keyHash >>> shift) & qu.MASK
  const i2 = (shift === 0 ? keyHash : keyHash >>> shift) & qu.MASK
  let y
  const ys =
    i1 === i2
      ? [mergeIntoNode(x, owner, shift + qu.SHIFT, keyHash, entry)]
      : ((y = new ValueNode(owner, keyHash, entry)), i1 < i2 ? [x, y] : [y, x])
  return new BitmapIndexedNode(owner, (1 << i1) | (1 << i2), ys)
}

function createNodes(owner, xs, k, v) {
  if (!owner) owner = new qu.OwnerID()
  let y = new ValueNode(owner, qu.hash(k), [k, v])
  for (let i = 0; i < xs.length; i++) {
    const entry = xs[i]
    y = y.update(owner, 0, undefined, entry[0], entry[1])
  }
  return y
}

function packNodes(owner, xs, count, excluding) {
  let bitmap = 0
  let i = 0
  const y = new Array(count)
  for (let i2 = 0, bit = 1, len = xs.length; i2 < len; i2++, bit <<= 1) {
    const x = xs[i2]
    if (x !== undefined && i2 !== excluding) {
      bitmap |= bit
      y[i++] = x
    }
  }
  return new BitmapIndexedNode(owner, bitmap, y)
}

function expandNodes(owner, xs, bitmap, including, x) {
  let count = 0
  const y = new Array(qu.SIZE)
  for (let i = 0; bitmap !== 0; i++, bitmap >>>= 1) {
    y[i] = bitmap & 1 ? xs[count++] : undefined
  }
  y[including] = x
  return new HashArrayMapNode(owner, count + 1, y)
}

function popCount(x) {
  x -= (x >> 1) & 0x55555555
  x = (x & 0x33333333) + ((x >> 2) & 0x33333333)
  x = (x + (x >> 4)) & 0x0f0f0f0f
  x += x >> 8
  x += x >> 16
  return x & 0x7f
}

function setAt(x, i, v, edit) {
  const y = edit ? x : qu.arrCopy(x)
  y[i] = v
  return y
}

function spliceIn(x, i, v, edit) {
  const len = x.length + 1
  if (edit && i + 1 === len) {
    x[i] = v
    return x
  }
  const y = new Array(len)
  let after = 0
  for (let j = 0; j < len; j++) {
    if (j === i) {
      y[j] = v
      after = -1
    } else y[j] = x[j + after]
  }
  return y
}

function spliceOut(x, i, edit) {
  const len = x.length - 1
  if (edit && i === len) {
    x.pop()
    return x
  }
  const y = new Array(len)
  let after = 0
  for (let j = 0; j < len; j++) {
    if (j === i) after = 1
    y[j] = x[j + after]
  }
  return y
}

const MAX_ARRAY_MAP_SIZE = qu.SIZE / 4
const MAX_BITMAP_INDEXED_SIZE = qu.SIZE / 2
const MIN_HASH_ARRAY_MAP_SIZE = qu.SIZE / 4
