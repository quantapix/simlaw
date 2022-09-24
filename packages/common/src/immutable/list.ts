/* eslint-disable @typescript-eslint/no-namespace */
import { IndexedCollection } from "./main.js"
import { setIn, deleteIn, update, updateIn, mergeIn, mergeDeepIn, withMutations, asMutable, asImmutable, wasAltered } from "./methods.js"
import * as qu from "./utils.js"
import type * as qt from "./types.js"

export class List<V> extends IndexedCollection implements qt.List<V> {
  readonly size = 0
  constructor(value) {
    super()
    const empty = emptyList()
    if (value === undefined || value === null) return empty
    if (qu.isList(value)) return value
    const iter = IndexedCollection(value)
    const size = iter.size
    if (size === 0) return empty
    qu.assertNotInfinite(size)
    if (size > 0 && size < qu.SIZE) return makeList(0, size, qu.SHIFT, null, new VNode(iter.toArray()))
    return empty.withMutations(list => {
      list.setSize(size)
      iter.forEach((v, i) => list.set(i, v))
    })
  }
  static of(/*...values*/) {
    return this(arguments)
  }
  override toString() {
    return this.__toString("List [", "]")
  }
  get(index, notSetValue) {
    index = qu.wrapIndex(this, index)
    if (index >= 0 && index < this.size) {
      index += this._origin
      const node = listNodeFor(this, index)
      return node && node.array[index & qu.MASK]
    }
    return notSetValue
  }
  set(index, value) {
    return updateList(this, index, value)
  }
  remove(index) {
    return !this.has(index) ? this : index === 0 ? this.shift() : index === this.size - 1 ? this.pop() : this.splice(index, 1)
  }
  insert(index, value) {
    return this.splice(index, 0, value)
  }
  clear() {
    if (this.size === 0) {
      return this
    }
    if (this.__ownerID) {
      this.size = this._origin = this._capacity = 0
      this._level = qu.SHIFT
      this._root = this._tail = this.__hash = undefined
      this.__altered = true
      return this
    }
    return emptyList()
  }
  push(/*...values*/) {
    const values = arguments
    const oldSize = this.size
    return this.withMutations(list => {
      setListBounds(list, 0, oldSize + values.length)
      for (let ii = 0; ii < values.length; ii++) {
        list.set(oldSize + ii, values[ii])
      }
    })
  }
  pop() {
    return setListBounds(this, 0, -1)
  }
  unshift(/*...values*/) {
    const values = arguments
    return this.withMutations(list => {
      setListBounds(list, -values.length)
      for (let ii = 0; ii < values.length; ii++) {
        list.set(ii, values[ii])
      }
    })
  }
  shift() {
    return setListBounds(this, 1)
  }
  concat(/*...collections*/) {
    const seqs = []
    for (let i = 0; i < arguments.length; i++) {
      const argument = arguments[i]
      const seq = IndexedCollection(typeof argument !== "string" && qu.hasIterator(argument) ? argument : [argument])
      if (seq.size !== 0) {
        seqs.push(seq)
      }
    }
    if (seqs.length === 0) {
      return this
    }
    if (this.size === 0 && !this.__ownerID && seqs.length === 1) {
      return this.constructor(seqs[0])
    }
    return this.withMutations(list => {
      seqs.forEach(seq => seq.forEach(value => list.push(value)))
    })
  }
  setSize(size) {
    return setListBounds(this, 0, size)
  }
  map(mapper, context) {
    return this.withMutations(list => {
      for (let i = 0; i < this.size; i++) {
        list.set(i, mapper.call(context, list.get(i), i, this))
      }
    })
  }
  // @pragma Iteration
  slice(begin, end) {
    const size = this.size
    if (qu.wholeSlice(begin, end, size)) {
      return this
    }
    return setListBounds(this, qu.resolveBegin(begin, size), qu.resolveEnd(end, size))
  }
  __iterator(type, reverse) {
    let index = reverse ? this.size : 0
    const values = iterateList(this, reverse)
    return new qu.Iterator(() => {
      const value = values()
      return value === DONE ? qu.iteratorDone() : qu.iteratorValue(type, reverse ? --index : index++, value)
    })
  }
  __iterate(fn, reverse) {
    let index = reverse ? this.size : 0
    const values = iterateList(this, reverse)
    let value
    while ((value = values()) !== DONE) {
      if (fn(value, reverse ? --index : index++, this) === false) {
        break
      }
    }
    return index
  }
  __ensureOwner(ownerID) {
    if (ownerID === this.__ownerID) {
      return this
    }
    if (!ownerID) {
      if (this.size === 0) {
        return emptyList()
      }
      this.__ownerID = ownerID
      this.__altered = false
      return this
    }
    return makeList(this._origin, this._capacity, this._level, this._root, this._tail, ownerID, this.__hash)
  }
}
export namespace List {
  export function isList(x: unknown): x is List<unknown>
  export function of<T>(...xs: Array<T>): List<T>
}
//function List<T>(x?: Iterable<T> | ArrayLike<T>): List<T>
List.isList = qu.isList
export const ListPrototype = List.prototype
ListPrototype[qu.IS_LIST_SYMBOL] = true
ListPrototype[qu.DELETE] = ListPrototype.remove
ListPrototype.merge = ListPrototype.concat
ListPrototype.setIn = setIn
ListPrototype.deleteIn = ListPrototype.removeIn = deleteIn
ListPrototype.update = update
ListPrototype.updateIn = updateIn
ListPrototype.mergeIn = mergeIn
ListPrototype.mergeDeepIn = mergeDeepIn
ListPrototype.withMutations = withMutations
ListPrototype.wasAltered = wasAltered
ListPrototype.asImmutable = asImmutable
ListPrototype["@@transducer/init"] = ListPrototype.asMutable = asMutable
ListPrototype["@@transducer/step"] = function (result, arr) {
  return result.push(arr)
}
ListPrototype["@@transducer/result"] = function (obj) {
  return obj.asImmutable()
}
class VNode {
  constructor(array, ownerID) {
    this.array = array
    this.ownerID = ownerID
  }
  removeBefore(ownerID, level, index) {
    if (index === level ? 1 << level : 0 || this.array.length === 0) return this
    const originIndex = (index >>> level) & qu.MASK
    if (originIndex >= this.array.length) return new VNode([], ownerID)
    const removingFirst = originIndex === 0
    let newChild
    if (level > 0) {
      const oldChild = this.array[originIndex]
      newChild = oldChild && oldChild.removeBefore(ownerID, level - qu.SHIFT, index)
      if (newChild === oldChild && removingFirst) return this
    }
    if (removingFirst && !newChild) return this
    const editable = editableVNode(this, ownerID)
    if (!removingFirst) {
      for (let ii = 0; ii < originIndex; ii++) {
        editable.array[ii] = undefined
      }
    }
    if (newChild) editable.array[originIndex] = newChild
    return editable
  }
  removeAfter(ownerID, level, index) {
    if (index === (level ? 1 << level : 0) || this.array.length === 0) return this
    const sizeIndex = ((index - 1) >>> level) & qu.MASK
    if (sizeIndex >= this.array.length) return this
    let newChild
    if (level > 0) {
      const oldChild = this.array[sizeIndex]
      newChild = oldChild && oldChild.removeAfter(ownerID, level - qu.SHIFT, index)
      if (newChild === oldChild && sizeIndex === this.array.length - 1) return this
    }
    const editable = editableVNode(this, ownerID)
    editable.array.splice(sizeIndex + 1)
    if (newChild) editable.array[sizeIndex] = newChild
    return editable
  }
}
const DONE = {}
function iterateList(list, reverse) {
  const left = list._origin
  const right = list._capacity
  const tailPos = getTailOffset(right)
  const tail = list._tail
  return iterateNodeOrLeaf(list._root, list._level, 0)
  function iterateNodeOrLeaf(node, level, offset) {
    return level === 0 ? iterateLeaf(node, offset) : iterateNode(node, level, offset)
  }
  function iterateLeaf(node, offset) {
    const array = offset === tailPos ? tail && tail.array : node && node.array
    let from = offset > left ? 0 : left - offset
    let to = right - offset
    if (to > qu.SIZE) to = qu.SIZE
    return () => {
      if (from === to) return DONE
      const idx = reverse ? --to : from++
      return array && array[idx]
    }
  }
  function iterateNode(node, level, offset) {
    let values
    const array = node && node.array
    let from = offset > left ? 0 : (left - offset) >> level
    let to = ((right - offset) >> level) + 1
    if (to > qu.SIZE) to = qu.SIZE
    return () => {
      while (true) {
        if (values) {
          const value = values()
          if (value !== DONE) return value
          values = null
        }
        if (from === to) return DONE
        const idx = reverse ? --to : from++
        values = iterateNodeOrLeaf(array && array[idx], level - qu.SHIFT, offset + (idx << level))
      }
    }
  }
}
function makeList(origin, capacity, level, root, tail, ownerID, hash) {
  const list = Object.create(ListPrototype)
  list.size = capacity - origin
  list._origin = origin
  list._capacity = capacity
  list._level = level
  list._root = root
  list._tail = tail
  list.__ownerID = ownerID
  list.__hash = hash
  list.__altered = false
  return list
}
let EMPTY_LIST
export function emptyList() {
  return EMPTY_LIST || (EMPTY_LIST = makeList(0, 0, qu.SHIFT))
}
function updateList(list, index, value) {
  index = qu.wrapIndex(list, index)
  if (index !== index) {
    return list
  }
  if (index >= list.size || index < 0) {
    return list.withMutations(list => {
      index < 0 ? setListBounds(list, index).set(0, value) : setListBounds(list, 0, index + 1).set(index, value)
    })
  }
  index += list._origin
  let newTail = list._tail
  let newRoot = list._root
  const didAlter = qu.MakeRef()
  if (index >= getTailOffset(list._capacity)) {
    newTail = updateVNode(newTail, list.__ownerID, 0, index, value, didAlter)
  } else {
    newRoot = updateVNode(newRoot, list.__ownerID, list._level, index, value, didAlter)
  }
  if (!didAlter.value) {
    return list
  }
  if (list.__ownerID) {
    list._root = newRoot
    list._tail = newTail
    list.__hash = undefined
    list.__altered = true
    return list
  }
  return makeList(list._origin, list._capacity, list._level, newRoot, newTail)
}
function updateVNode(node, ownerID, level, index, value, didAlter) {
  const idx = (index >>> level) & qu.MASK
  const nodeHas = node && idx < node.array.length
  if (!nodeHas && value === undefined) {
    return node
  }
  let newNode
  if (level > 0) {
    const lowerNode = node && node.array[idx]
    const newLowerNode = updateVNode(lowerNode, ownerID, level - qu.SHIFT, index, value, didAlter)
    if (newLowerNode === lowerNode) {
      return node
    }
    newNode = editableVNode(node, ownerID)
    newNode.array[idx] = newLowerNode
    return newNode
  }
  if (nodeHas && node.array[idx] === value) {
    return node
  }
  if (didAlter) {
    qu.SetRef(didAlter)
  }
  newNode = editableVNode(node, ownerID)
  if (value === undefined && idx === newNode.array.length - 1) {
    newNode.array.pop()
  } else {
    newNode.array[idx] = value
  }
  return newNode
}
function editableVNode(node, ownerID) {
  if (ownerID && node && ownerID === node.ownerID) {
    return node
  }
  return new VNode(node ? node.array.slice() : [], ownerID)
}
function listNodeFor(list, rawIndex) {
  if (rawIndex >= getTailOffset(list._capacity)) {
    return list._tail
  }
  if (rawIndex < 1 << (list._level + qu.SHIFT)) {
    let node = list._root
    let level = list._level
    while (node && level > 0) {
      node = node.array[(rawIndex >>> level) & qu.MASK]
      level -= qu.SHIFT
    }
    return node
  }
}
function setListBounds(list, begin, end) {
  if (begin !== undefined) begin |= 0
  if (end !== undefined) end |= 0
  const owner = list.__ownerID || new qu.OwnerID()
  let oldOrigin = list._origin
  let oldCapacity = list._capacity
  let newOrigin = oldOrigin + begin
  let newCapacity = end === undefined ? oldCapacity : end < 0 ? oldCapacity + end : oldOrigin + end
  if (newOrigin === oldOrigin && newCapacity === oldCapacity) return list
  if (newOrigin >= newCapacity) return list.clear()
  let newLevel = list._level
  let newRoot = list._root
  let offsetShift = 0
  while (newOrigin + offsetShift < 0) {
    newRoot = new VNode(newRoot && newRoot.array.length ? [undefined, newRoot] : [], owner)
    newLevel += qu.SHIFT
    offsetShift += 1 << newLevel
  }
  if (offsetShift) {
    newOrigin += offsetShift
    oldOrigin += offsetShift
    newCapacity += offsetShift
    oldCapacity += offsetShift
  }
  const oldTailOffset = getTailOffset(oldCapacity)
  const newTailOffset = getTailOffset(newCapacity)
  while (newTailOffset >= 1 << (newLevel + qu.SHIFT)) {
    newRoot = new VNode(newRoot && newRoot.array.length ? [newRoot] : [], owner)
    newLevel += qu.SHIFT
  }
  const oldTail = list._tail
  let newTail = newTailOffset < oldTailOffset ? listNodeFor(list, newCapacity - 1) : newTailOffset > oldTailOffset ? new VNode([], owner) : oldTail
  if (oldTail && newTailOffset > oldTailOffset && newOrigin < oldCapacity && oldTail.array.length) {
    newRoot = editableVNode(newRoot, owner)
    let node = newRoot
    for (let level = newLevel; level > qu.SHIFT; level -= qu.SHIFT) {
      const idx = (oldTailOffset >>> level) & qu.MASK
      node = node.array[idx] = editableVNode(node.array[idx], owner)
    }
    node.array[(oldTailOffset >>> qu.SHIFT) & qu.MASK] = oldTail
  }
  if (newCapacity < oldCapacity) {
    newTail = newTail && newTail.removeAfter(owner, 0, newCapacity)
  }
  if (newOrigin >= newTailOffset) {
    newOrigin -= newTailOffset
    newCapacity -= newTailOffset
    newLevel = qu.SHIFT
    newRoot = null
    newTail = newTail && newTail.removeBefore(owner, 0, newOrigin)
  } else if (newOrigin > oldOrigin || newTailOffset < oldTailOffset) {
    offsetShift = 0
    while (newRoot) {
      const beginIndex = (newOrigin >>> newLevel) & qu.MASK
      if ((beginIndex !== newTailOffset >>> newLevel) & qu.MASK) break
      if (beginIndex) offsetShift += (1 << newLevel) * beginIndex
      newLevel -= qu.SHIFT
      newRoot = newRoot.array[beginIndex]
    }
    if (newRoot && newOrigin > oldOrigin) {
      newRoot = newRoot.removeBefore(owner, newLevel, newOrigin - offsetShift)
    }
    if (newRoot && newTailOffset < oldTailOffset) {
      newRoot = newRoot.removeAfter(owner, newLevel, newTailOffset - offsetShift)
    }
    if (offsetShift) {
      newOrigin -= offsetShift
      newCapacity -= offsetShift
    }
  }
  if (list.__ownerID) {
    list.size = newCapacity - newOrigin
    list._origin = newOrigin
    list._capacity = newCapacity
    list._level = newLevel
    list._root = newRoot
    list._tail = newTail
    list.__hash = undefined
    list.__altered = true
    return list
  }
  return makeList(newOrigin, newCapacity, newLevel, newRoot, newTail)
}
function getTailOffset(size) {
  return size < qu.SIZE ? 0 : ((size - 1) >>> qu.SHIFT) << qu.SHIFT
}
