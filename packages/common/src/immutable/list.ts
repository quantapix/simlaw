import { Collection } from "./main.js"
import * as qc from "./core.js"
import * as qu from "./utils.js"
import type * as qt from "./types.js"

export class List<V> extends Collection.ByIdx<V> implements qt.List<V> {
  static isList = qu.isList
  static override from<T>(x?: Iterable<T> | ArrayLike<T>): qt.List<T> {
    if (x === undefined || x === null) return EMPTY_LIST
    if (qu.isList(x)) return x
    const it = Collection.ByIdx.from(x)
    const size = it.size!
    if (size === 0) return EMPTY_LIST
    qu.assertNotInfinite(size)
    if (size > 0 && size < qu.SIZE) return makeList(0, size, qu.SHIFT, null, new VNode(it.toArray()))
    return EMPTY_LIST.withMutations(x2 => {
      x2.setSize(size)
      it.forEach((v, i) => x2.set(i, v))
    })
  }
  static of<T>(...xs: Array<T>): List<T> {
    return List.from<T>(xs)
  }
  [Symbol.q_list] = true;
  [Symbol.q_delete] = this.remove

  override size = 0

  constructor(
    private _origin = 0,
    private _capacity = 0,
    private _level = qu.SHIFT,
    private _base?: any,
    private _tail?: any,
    private _owner?: any,
    hash?: number,
    private _dirty = false
  ) {
    super()
    this.size = _capacity - _origin
    this._hash = hash
  }

  override toString() {
    return this.__toString("List [", "]")
  }
  override get(i: number, v0?: unknown) {
    i = qu.wrapIndex(this, i)
    if (i >= 0 && i < this.size) {
      i += this._origin
      const node = listNodeFor(this, i)
      return node && node.array[i & qu.MASK]
    }
    return v0
  }
  set(i: number, v: V) {
    return updateList(this, i, v)
  }
  remove(i: number) {
    return !this.has(i) ? this : i === 0 ? this.shift() : i === this.size - 1 ? this.pop() : this.splice(i, 1)
  }
  insert(i: number, v: V) {
    return this.splice(i, 0, v)
  }
  clear() {
    if (this.size === 0) return this
    if (this._owner) {
      this.size = this._origin = this._capacity = 0
      this._level = qu.SHIFT
      this._base = this._tail = this._hash = undefined
      this._dirty = true
      return this
    }
    return EMPTY_LIST
  }
  push(...xs) {
    const size = this.size
    return this.withMutations(x => {
      setListBounds(x, 0, size + xs.length)
      for (let i = 0; i < xs.length; i++) {
        x.set(size + i, xs[i])
      }
    })
  }
  pop() {
    return setListBounds(this, 0, -1)
  }
  unshift(...xs) {
    return this.withMutations(x => {
      setListBounds(x, -xs.length)
      for (let i = 0; i < xs.length; i++) {
        x.set(i, xs[i])
      }
    })
  }
  shift() {
    return setListBounds(this, 1)
  }
  override concat(...xs) {
    const ys = []
    for (let i = 0; i < xs.length; i++) {
      const x = xs[i]
      const y = Collection.ByIdx.from(typeof x !== "string" && qu.hasIter(x) ? x : [x])
      if (y.size !== 0) ys.push(y)
    }
    if (ys.length === 0) return this
    if (this.size === 0 && !this._owner && ys.length === 1) return this.constructor(ys[0])
    return this.withMutations(x => {
      ys.forEach(seq => seq.forEach(value => x.push(value)))
    })
  }
  setSize(x: number) {
    return setListBounds(this, 0, x)
  }
  override map(f: Function, ctx?: unknown) {
    return this.withMutations(x => {
      for (let i = 0; i < this.size; i++) {
        x.set(i, f.call(ctx, x.get(i), i, this))
      }
    })
  }
  override slice(beg?: number, end?: number) {
    const size = this.size
    if (qu.wholeSlice(beg, end, size)) return this
    return setListBounds(this, qu.resolveBegin(beg, size), qu.resolveEnd(end, size))
  }
  [Symbol.q_loop](f: Function, reverse?: boolean) {
    let i = reverse ? this.size : 0
    const ys = iterateList(this, reverse)
    let y
    while ((y = ys()) !== DONE) {
      if (f(y, reverse ? --i : i++, this) === false) break
    }
    return i
  }
  [Symbol.q_iter](m: qu.Iter.Mode, reverse?: boolean) {
    let i = reverse ? this.size : 0
    const ys = iterateList(this, reverse)
    return new qu.Iter(() => {
      const y = ys()
      return y === DONE ? qu.Iter.done() : qu.Iter.value(m, reverse ? --i : i++, y)
    })
  }
  __ensureOwner(x) {
    if (x === this._owner) return this
    if (!x) {
      if (this.size === 0) return EMPTY_LIST
      this._owner = x
      this._dirty = false
      return this
    }
    return new List(this._origin, this._capacity, this._level, this._base, this._tail, x, this._hash)
  }
  merge = this.concat
  setIn = (x: any, v: unknown) => qc.setIn(this, x, v)
  removeIn = qc.deleteIn
  deleteIn = qc.deleteIn
  override update = (x: any, v0?: unknown, f?: any) =>
    v0 === undefined && f === undefined ? x(this) : qc.update(this, x, v0, f)
  updateIn = (x: any, v0: unknown, f?: any) => qc.updateIn(this, x, v0, f)
  mergeIn = qc.mergeIn
  mergeDeepIn = qc.mergeDeepIn
  withMutations = qc.withMutations
  wasAltered = qc.wasAltered
  asImmutable = qc.asImmutable
  asMutable = qc.asMutable;
  ["@@transducer/init"] = qc.asMutable;
  ["@@transducer/step"] = function (result, arr) {
    return result.push(arr)
  };
  ["@@transducer/result"] = function (obj) {
    return obj.asImmutable()
  }
}

class VNode {
  constructor(array, owner) {
    this.array = array
    this.owner = owner
  }
  removeBefore(owner, level, index) {
    if (index === level ? 1 << level : 0 || this.array.length === 0) return this
    const originIndex = (index >>> level) & qu.MASK
    if (originIndex >= this.array.length) return new VNode([], owner)
    const removingFirst = originIndex === 0
    let newChild
    if (level > 0) {
      const oldChild = this.array[originIndex]
      newChild = oldChild && oldChild.removeBefore(owner, level - qu.SHIFT, index)
      if (newChild === oldChild && removingFirst) return this
    }
    if (removingFirst && !newChild) return this
    const editable = editableVNode(this, owner)
    if (!removingFirst) {
      for (let ii = 0; ii < originIndex; ii++) {
        editable.array[ii] = undefined
      }
    }
    if (newChild) editable.array[originIndex] = newChild
    return editable
  }
  removeAfter(owner, level, index) {
    if (index === (level ? 1 << level : 0) || this.array.length === 0) return this
    const sizeIndex = ((index - 1) >>> level) & qu.MASK
    if (sizeIndex >= this.array.length) return this
    let newChild
    if (level > 0) {
      const oldChild = this.array[sizeIndex]
      newChild = oldChild && oldChild.removeAfter(owner, level - qu.SHIFT, index)
      if (newChild === oldChild && sizeIndex === this.array.length - 1) return this
    }
    const editable = editableVNode(this, owner)
    editable.array.splice(sizeIndex + 1)
    if (newChild) editable.array[sizeIndex] = newChild
    return editable
  }
}

const DONE = {}

function iterateList(x, reverse?: boolean) {
  const left = x._origin
  const right = x._capacity
  const tailPos = getTailOffset(right)
  const tail = x._tail
  return doOne(x._base, x._level, 0)
  function doOne(x, level, offset) {
    return level === 0 ? doLeaf(x, offset) : doNode(x, level, offset)
  }
  function doLeaf(x, offset) {
    const array = offset === tailPos ? tail && tail.array : x && x.array
    let from = offset > left ? 0 : left - offset
    let to = right - offset
    if (to > qu.SIZE) to = qu.SIZE
    return () => {
      if (from === to) return DONE
      const idx = reverse ? --to : from++
      return array && array[idx]
    }
  }
  function doNode(x, level, offset) {
    let values
    const array = x && x.array
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
        values = doOne(array && array[idx], level - qu.SHIFT, offset + (idx << level))
      }
    }
  }
}

export const EMPTY_LIST = new List()

function updateList(x, i, value) {
  i = qu.wrapIndex(x, i)
  if (i !== i) return x
  if (i >= x.size || i < 0) {
    return x.withMutations(x2 => {
      i < 0 ? setListBounds(x2, i).set(0, value) : setListBounds(x2, 0, i + 1).set(i, value)
    })
  }
  i += x._origin
  let newTail = x._tail
  let newRoot = x._base
  const didAlter = qu.MakeRef()
  if (i >= getTailOffset(x._capacity)) newTail = updateVNode(newTail, x._owner, 0, i, value, didAlter)
  else newRoot = updateVNode(newRoot, x._owner, x._level, i, value, didAlter)
  if (!didAlter.value) return x
  if (x._owner) {
    x._base = newRoot
    x._tail = newTail
    x._hash = undefined
    x._dirty = true
    return x
  }
  return new List(x._origin, x._capacity, x._level, newRoot, newTail)
}

function updateVNode(x, owner, level, index, value, didAlter) {
  const idx = (index >>> level) & qu.MASK
  const nodeHas = x && idx < x.array.length
  if (!nodeHas && value === undefined) return x
  let y
  if (level > 0) {
    const lowerNode = x && x.array[idx]
    const newLowerNode = updateVNode(lowerNode, owner, level - qu.SHIFT, index, value, didAlter)
    if (newLowerNode === lowerNode) return x
    y = editableVNode(x, owner)
    y.array[idx] = newLowerNode
    return y
  }
  if (nodeHas && x.array[idx] === value) return x
  if (didAlter) qu.SetRef(didAlter)
  y = editableVNode(x, owner)
  if (value === undefined && idx === y.array.length - 1) y.array.pop()
  else y.array[idx] = value
  return y
}

function editableVNode(x, owner) {
  if (owner && x && owner === x.owner) return x
  return new VNode(x ? x.array.slice() : [], owner)
}

function listNodeFor(x, i) {
  if (i >= getTailOffset(x._capacity)) return x._tail
  if (i < 1 << (x._level + qu.SHIFT)) {
    let node = x._base
    let level = x._level
    while (node && level > 0) {
      node = node.array[(i >>> level) & qu.MASK]
      level -= qu.SHIFT
    }
    return node
  }
}

function setListBounds(list, begin, end) {
  if (begin !== undefined) begin |= 0
  if (end !== undefined) end |= 0
  const owner = list._owner || new qu.OwnerID()
  let oldOrigin = list._origin
  let oldCapacity = list._capacity
  let newOrigin = oldOrigin + begin
  let newCapacity = end === undefined ? oldCapacity : end < 0 ? oldCapacity + end : oldOrigin + end
  if (newOrigin === oldOrigin && newCapacity === oldCapacity) return list
  if (newOrigin >= newCapacity) return list.clear()
  let newLevel = list._level
  let root = list._base
  let offsetShift = 0
  while (newOrigin + offsetShift < 0) {
    root = new VNode(root && root.array.length ? [undefined, root] : [], owner)
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
    root = new VNode(root && root.array.length ? [root] : [], owner)
    newLevel += qu.SHIFT
  }
  const oldTail = list._tail
  let newTail =
    newTailOffset < oldTailOffset
      ? listNodeFor(list, newCapacity - 1)
      : newTailOffset > oldTailOffset
      ? new VNode([], owner)
      : oldTail
  if (oldTail && newTailOffset > oldTailOffset && newOrigin < oldCapacity && oldTail.array.length) {
    root = editableVNode(root, owner)
    let node = root
    for (let level = newLevel; level > qu.SHIFT; level -= qu.SHIFT) {
      const idx = (oldTailOffset >>> level) & qu.MASK
      node = node.array[idx] = editableVNode(node.array[idx], owner)
    }
    node.array[(oldTailOffset >>> qu.SHIFT) & qu.MASK] = oldTail
  }
  if (newCapacity < oldCapacity) newTail = newTail && newTail.removeAfter(owner, 0, newCapacity)
  if (newOrigin >= newTailOffset) {
    newOrigin -= newTailOffset
    newCapacity -= newTailOffset
    newLevel = qu.SHIFT
    root = null
    newTail = newTail && newTail.removeBefore(owner, 0, newOrigin)
  } else if (newOrigin > oldOrigin || newTailOffset < oldTailOffset) {
    offsetShift = 0
    while (root) {
      const beginIndex = (newOrigin >>> newLevel) & qu.MASK
      if ((beginIndex !== newTailOffset >>> newLevel) & qu.MASK) break
      if (beginIndex) offsetShift += (1 << newLevel) * beginIndex
      newLevel -= qu.SHIFT
      root = root.array[beginIndex]
    }
    if (root && newOrigin > oldOrigin) root = root.removeBefore(owner, newLevel, newOrigin - offsetShift)
    if (root && newTailOffset < oldTailOffset) root = root.removeAfter(owner, newLevel, newTailOffset - offsetShift)
    if (offsetShift) {
      newOrigin -= offsetShift
      newCapacity -= offsetShift
    }
  }
  if (list._owner) {
    list.size = newCapacity - newOrigin
    list._origin = newOrigin
    list._capacity = newCapacity
    list._level = newLevel
    list._base = root
    list._tail = newTail
    list._hash = undefined
    list._dirty = true
    return list
  }
  return new List(newOrigin, newCapacity, newLevel, root, newTail)
}

function getTailOffset(x) {
  return x < qu.SIZE ? 0 : ((x - 1) >>> qu.SHIFT) << qu.SHIFT
}
