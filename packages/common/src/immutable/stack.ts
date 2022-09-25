import { Collection, ArraySeq } from "./main.js"
import * as qf from "./functions.js"
import * as qu from "./utils.js"

export class Stack extends Collection.Indexed {
  static isStack = qu.isStack
  
  static create<V>(x?: Iterable<V> | ArrayLike<V>): Stack<V> {
    return x === undefined || x === null ? emptyStack() : isStack(x) ? x : emptyStack().pushAll(x)
  }
  static of<V>(...xs: Array<V>): Stack<V> {
    return this(...xs)
  }
  ;[qu.IS_STACK_SYMBOL] = true
  toString() {
    return this.__toString("Stack [", "]")
  }
  get(index, notSetValue) {
    let head = this._head
    index = qu.wrapIndex(this, index)
    while (head && index--) {
      head = head.next
    }
    return head ? head.value : notSetValue
  }
  peek() {
    return this._head && this._head.value
  }
  push(...xs) {
    if (xs.length === 0) return this
    const newSize = this.size + arguments.length
    let head = this._head
    for (let ii = arguments.length - 1; ii >= 0; ii--) {
      head = {
        value: arguments[ii],
        next: head,
      }
    }
    if (this.__ownerID) {
      this.size = newSize
      this._head = head
      this.__hash = undefined
      this.__altered = true
      return this
    }
    return makeStack(newSize, head)
  }
  pushAll(iter) {
    iter = Collection.Indexed.create(iter)
    if (iter.size === 0) return this
    if (this.size === 0 && isStack(iter)) return iter
    qu.assertNotInfinite(iter.size)
    let newSize = this.size
    let head = this._head
    iter.__iterate(value => {
      newSize++
      head = {
        value: value,
        next: head,
      }
    }, true)
    if (this.__ownerID) {
      this.size = newSize
      this._head = head
      this.__hash = undefined
      this.__altered = true
      return this
    }
    return makeStack(newSize, head)
  }
  pop() {
    return this.slice(1)
  }
  clear() {
    if (this.size === 0) 
      return this
    
    if (this.__ownerID) {
      this.size = 0
      this._head = undefined
      this.__hash = undefined
      this.__altered = true
      return this
    }
    return emptyStack()
  }
  slice(begin, end) {
    if (qu.wholeSlice(begin, end, this.size)) return this
    let resolvedBegin = qu.resolveBegin(begin, this.size)
    const resolvedEnd = qu.resolveEnd(end, this.size)
    if (resolvedEnd !== this.size) {
      // super.slice(begin, end);
      return Collection.Indexed.prototype.slice.call(this, begin, end)
    }
    const newSize = this.size - resolvedBegin
    let head = this._head
    while (resolvedBegin--) {
      head = head.next
    }
    if (this.__ownerID) {
      this.size = newSize
      this._head = head
      this.__hash = undefined
      this.__altered = true
      return this
    }
    return makeStack(newSize, head)
  }
  __ensureOwner(ownerID) {
    if (ownerID === this.__ownerID) return this
    if (!ownerID) {
      if (this.size === 0) return emptyStack()
      this.__ownerID = ownerID
      this.__altered = false
      return this
    }
    return makeStack(this.size, this._head, ownerID, this.__hash)
  }
  __iterate(fn, reverse) {
    if (reverse) return new ArraySeq(this.toArray()).__iterate((v, k) => fn(v, k, this), reverse)
    let iterations = 0
    let node = this._head
    while (node) {
      if (fn(node.value, iterations++, this) === false) break
      node = node.next
    }
    return iterations
  }
  __iterator(type, reverse) {
    if (reverse) return new ArraySeq(this.toArray()).__iterator(type, reverse)
    let iterations = 0
    let node = this._head
    return new qu.Iterator(() => {
      if (node) {
        const value = node.value
        node = node.next
        return qu.iteratorValue(type, iterations++, value)
      }
      return qu.iteratorDone()
    })
  }
  StackPrototype.shift = StackPrototype.pop
  StackPrototype.unshift = StackPrototype.push
  StackPrototype.unshiftAll = StackPrototype.pushAll
  StackPrototype.withMutations = qf.withMutations
  StackPrototype.wasAltered = qf.wasAltered
  StackPrototype.asImmutable = qf.asImmutable
  StackPrototype["@@transducer/init"] = StackPrototype.asMutable = qf.asMutable
  StackPrototype["@@transducer/step"] = function (result, arr) {
    return result.unshift(arr)
  }
  StackPrototype["@@transducer/result"] = function (obj) {
    return obj.asImmutable()
  }
  
}


function makeStack(size, head, ownerID, hash) {
  const map = Object.create(StackPrototype)
  map.size = size
  map._head = head
  map.__ownerID = ownerID
  map.__hash = hash
  map.__altered = false
  return map
}
let EMPTY_STACK
function emptyStack() {
  return EMPTY_STACK || (EMPTY_STACK = makeStack(0))
}
