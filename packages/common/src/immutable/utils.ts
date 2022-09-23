/* eslint-disable no-prototype-builtins */
import { Seq } from "./seq.js"

export const IS_COLLECTION_SYMBOL = "@@__IMMUTABLE_ITERABLE__@@"
export const IS_INDEXED_SYMBOL = "@@__IMMUTABLE_INDEXED__@@"
export const IS_KEYED_SYMBOL = "@@__IMMUTABLE_KEYED__@@"
export const IS_LIST_SYMBOL = "@@__IMMUTABLE_LIST__@@"
export const IS_MAP_SYMBOL = "@@__IMMUTABLE_MAP__@@"
export const IS_ORDERED_SYMBOL = "@@__IMMUTABLE_ORDERED__@@"
export const IS_RECORD_SYMBOL = "@@__IMMUTABLE_RECORD__@@"
export const IS_SEQ_SYMBOL = "@@__IMMUTABLE_SEQ__@@"
export const IS_SET_SYMBOL = "@@__IMMUTABLE_SET__@@"
export const IS_STACK_SYMBOL = "@@__IMMUTABLE_STACK__@@"

export function isAssociative(x: any) {
  return isKeyed(x) || isIndexed(x)
}

export function isCollection(x: any) {
  return Boolean(x && x[IS_COLLECTION_SYMBOL])
}

export function isImmutable(x: any) {
  return isCollection(x) || isRecord(x)
}

export function isIndexed(x: any) {
  return Boolean(x && x[IS_INDEXED_SYMBOL])
}

export function isKeyed(x: any) {
  return Boolean(x && x[IS_KEYED_SYMBOL])
}

export function isList(x: any) {
  return Boolean(x && x[IS_LIST_SYMBOL])
}

export function isMap(x: any) {
  return Boolean(x && x[IS_MAP_SYMBOL])
}

export function isOrdered(x: any) {
  return Boolean(x && x[IS_ORDERED_SYMBOL])
}

export function isOrderedMap(x: any) {
  return isMap(x) && isOrdered(x)
}

export function isOrderedSet(x: any) {
  return isSet(x) && isOrdered(x)
}

export function isRecord(x: any) {
  return Boolean(x && x[IS_RECORD_SYMBOL])
}

export function isSeq(x: any) {
  return Boolean(x && x[IS_SEQ_SYMBOL])
}

export function isSet(x: any) {
  return Boolean(x && x[IS_SET_SYMBOL])
}

export function isStack(x: any) {
  return Boolean(x && x[IS_STACK_SYMBOL])
}

export function isValueObject(x: any) {
  return Boolean(
    x && typeof x.equals === "function" && typeof x.hashCode === "function"
  )
}

export const ITERATE_KEYS = 0
export const ITERATE_VALUES = 1
export const ITERATE_ENTRIES = 2
const REAL_ITERATOR_SYMBOL = typeof Symbol === "function" && Symbol.iterator
const FAUX_ITERATOR_SYMBOL = "@@iterator"
export const ITERATOR_SYMBOL = REAL_ITERATOR_SYMBOL || FAUX_ITERATOR_SYMBOL

export class Iterator {
  constructor(next) {
    this.next = next
  }
  toString() {
    return "[Iterator]"
  }
}

Iterator.KEYS = ITERATE_KEYS
Iterator.VALUES = ITERATE_VALUES
Iterator.ENTRIES = ITERATE_ENTRIES
Iterator.prototype.inspect = Iterator.prototype.toSource = function () {
  return this.toString()
}
Iterator.prototype[ITERATOR_SYMBOL] = function () {
  return this
}

export function iteratorValue(type, k, v, iteratorResult) {
  const value = type === 0 ? k : type === 1 ? v : [k, v]
  iteratorResult
    ? (iteratorResult.value = value)
    : (iteratorResult = {
        value: value,
        done: false,
      })
  return iteratorResult
}
export function iteratorDone() {
  return { value: undefined, done: true }
}
export function hasIterator(x) {
  if (Array.isArray(x)) return true
  return !!getIteratorFn(x)
}
export function isIterator(x) {
  return x && typeof x.next === "function"
}
export function getIterator(x) {
  const f = getIteratorFn(x)
  return f && f.call(x)
}
function getIteratorFn(x) {
  const f =
    x &&
    ((REAL_ITERATOR_SYMBOL && x[REAL_ITERATOR_SYMBOL]) ||
      x[FAUX_ITERATOR_SYMBOL])
  if (typeof f === "function") return f
}
export function isEntriesIterable(x) {
  const iteratorFn = getIteratorFn(x)
  return iteratorFn && iteratorFn === x.entries
}
export function isKeysIterable(x) {
  const iteratorFn = getIteratorFn(x)
  return iteratorFn && iteratorFn === x.keys
}
export function arrCopy(arr, offset) {
  offset = offset || 0
  const len = Math.max(0, arr.length - offset)
  const newArr = new Array(len)
  for (let ii = 0; ii < len; ii++) {
    newArr[ii] = arr[ii + offset]
  }
  return newArr
}
export function assertNotInfinite(size) {
  invariant(
    size !== Infinity,
    "Cannot perform this action with an infinite size."
  )
}
export function coerceKeyPath(keyPath) {
  if (isArrayLike(keyPath) && typeof keyPath !== "string") return keyPath
  if (isOrdered(keyPath)) return keyPath.toArray()
  throw new TypeError(
    "Invalid keyPath: expected Ordered Collection or Array: " + keyPath
  )
}
export function createClass(ctor, superClass) {
  if (superClass) ctor.prototype = Object.create(superClass.prototype)
  ctor.prototype.constructor = ctor
}
export function deepEqual(a, b) {
  if (a === b) return true
  if (
    !isCollection(b) ||
    (a.size !== undefined && b.size !== undefined && a.size !== b.size) ||
    (a.__hash !== undefined &&
      b.__hash !== undefined &&
      a.__hash !== b.__hash) ||
    isKeyed(a) !== isKeyed(b) ||
    isIndexed(a) !== isIndexed(b) ||
    isOrdered(a) !== isOrdered(b)
  ) {
    return false
  }
  if (a.size === 0 && b.size === 0) return true
  const notAssociative = !isAssociative(a)
  if (isOrdered(a)) {
    const entries = a.entries()
    return (
      b.every((v, k) => {
        const entry = entries.next().value
        return entry && is(entry[1], v) && (notAssociative || is(entry[0], k))
      }) && entries.next().done
    )
  }
  let flipped = false
  if (a.size === undefined) {
    if (b.size === undefined) {
      if (typeof a.cacheResult === "function") a.cacheResult()
    } else {
      flipped = true
      const _ = a
      a = b
      b = _
    }
  }
  let allEqual = true
  const bSize = b.__iterate((v, k) => {
    if (
      notAssociative
        ? !a.has(v)
        : flipped
        ? !is(v, a.get(k, NOT_SET))
        : !is(a.get(k, NOT_SET), v)
    ) {
      allEqual = false
      return false
    }
  })
  return allEqual && a.size === bSize
}
export function invariant(condition, error) {
  if (!condition) throw new Error(error)
}
export function isArrayLike(x) {
  if (Array.isArray(x) || typeof x === "string") return true
  return (
    x &&
    typeof x === "object" &&
    Number.isInteger(x.length) &&
    x.length >= 0 &&
    (x.length === 0
      ? Object.keys(x).length === 1
      : x.hasOwnProperty(x.length - 1))
  )
}
export function isDataStructure(x) {
  return (
    typeof x === "object" &&
    (isImmutable(x) || Array.isArray(x) || isPlainObject(x))
  )
}
const toString = Object.prototype.toString
export function isPlainObject(x) {
  if (!x || typeof x !== "object" || toString.call(x) !== "[object Object]") {
    return false
  }
  const proto = Object.getPrototypeOf(x)
  if (proto === null) return true
  let parentProto = proto
  let nextProto = Object.getPrototypeOf(proto)
  while (nextProto !== null) {
    parentProto = nextProto
    nextProto = Object.getPrototypeOf(parentProto)
  }
  return parentProto === proto
}
export function mixin(ctor, methods) {
  const keyCopier = k => {
    ctor.prototype[k] = methods[k]
  }
  Object.keys(methods).forEach(keyCopier)
  Object.getOwnPropertySymbols &&
    Object.getOwnPropertySymbols(methods).forEach(keyCopier)
  return ctor
}

export function quoteString(x) {
  try {
    return typeof x === "string" ? JSON.stringify(x) : String(x)
  } catch (_ignoreError) {
    return JSON.stringify(x)
  }
}
export function shallowCopy(x) {
  if (Array.isArray(x)) return arrCopy(x)
  const to = {}
  for (const key in x) {
    if (hasOwnProperty.call(x, key)) to[key] = x[key]
  }
  return to
}
export const imul =
  typeof Math.imul === "function" && Math.imul(0xffffffff, 2) === -2
    ? Math.imul
    : function imul(a, b) {
        a |= 0
        b |= 0
        const c = a & 0xffff
        const d = b & 0xffff
        return (c * d + ((((a >>> 16) * d + c * (b >>> 16)) << 16) >>> 0)) | 0
      }

export function smi(i32) {
  return ((i32 >>> 1) & 0x40000000) | (i32 & 0xbfffffff)
}

export function is(a, b) {
  if (a === b || (a !== a && b !== b)) return true
  if (!a || !b) return false
  if (typeof a.valueOf === "function" && typeof b.valueOf === "function") {
    a = a.valueOf()
    b = b.valueOf()
    if (a === b || (a !== a && b !== b)) return true
    if (!a || !b) return false
  }
  return !!(isValueObject(a) && isValueObject(b) && a.equals(b))
}
export function toJS(x) {
  if (!x || typeof x !== "object") return x
  if (!isCollection(x)) {
    if (!isDataStructure(x)) return x
    x = Seq(x)
  }
  if (isKeyed(x)) {
    const result = {}
    x.__iterate((v, k) => {
      result[k] = toJS(v)
    })
    return result
  }
  const result = []
  x.__iterate(v => {
    result.push(toJS(v))
  })
  return result
}
export const DELETE = "delete"
export const SHIFT = 5
export const SIZE = 1 << SHIFT
export const MASK = SIZE - 1
export const NOT_SET = {}
export function MakeRef() {
  return { value: false }
}
export function SetRef(x) {
  if (x) x.value = true
}
export function OwnerID() {}
export function ensureSize(x) {
  if (x.size === undefined) x.size = x.__iterate(returnTrue)
  return x.size
}
export function wrapIndex(iter, index) {
  if (typeof index !== "number") {
    const uint32Index = index >>> 0 // N >>> 0 is shorthand for ToUint32
    if ("" + uint32Index !== index || uint32Index === 4294967295) return NaN
    index = uint32Index
  }
  return index < 0 ? ensureSize(iter) + index : index
}
export function returnTrue() {
  return true
}
export function wholeSlice(begin, end, size) {
  return (
    ((begin === 0 && !isNeg(begin)) ||
      (size !== undefined && begin <= -size)) &&
    (end === undefined || (size !== undefined && end >= size))
  )
}
export function resolveBegin(begin, size) {
  return resolveIndex(begin, size, 0)
}
export function resolveEnd(end, size) {
  return resolveIndex(end, size, size)
}
function resolveIndex(index, size, defaultIndex) {
  return index === undefined
    ? defaultIndex
    : isNeg(index)
    ? size === Infinity
      ? size
      : Math.max(0, size + index) | 0
    : size === undefined || size === index
    ? index
    : Math.min(size, index) | 0
}
function isNeg(value) {
  return value < 0 || (value === 0 && 1 / value === -Infinity)
}
