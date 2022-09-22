/* eslint-disable no-prototype-builtins */
import {
  isAssociative,
  isCollection,
  isImmutable,
  isIndexed,
  isKeyed,
  isOrdered,
  isValueObject,
} from "./predicates.js"
import { Seq } from "./seq.js"

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
export function hasIterator(maybeIterable) {
  if (Array.isArray(maybeIterable)) return true

  return !!getIteratorFn(maybeIterable)
}
export function isIterator(maybeIterator) {
  return maybeIterator && typeof maybeIterator.next === "function"
}
export function getIterator(iterable) {
  const iteratorFn = getIteratorFn(iterable)
  return iteratorFn && iteratorFn.call(iterable)
}
function getIteratorFn(iterable) {
  const iteratorFn =
    iterable &&
    ((REAL_ITERATOR_SYMBOL && iterable[REAL_ITERATOR_SYMBOL]) ||
      iterable[FAUX_ITERATOR_SYMBOL])
  if (typeof iteratorFn === "function") return iteratorFn
}
export function isEntriesIterable(maybeIterable) {
  const iteratorFn = getIteratorFn(maybeIterable)
  return iteratorFn && iteratorFn === maybeIterable.entries
}
export function isKeysIterable(maybeIterable) {
  const iteratorFn = getIteratorFn(maybeIterable)
  return iteratorFn && iteratorFn === maybeIterable.keys
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
export function isArrayLike(value) {
  if (Array.isArray(value) || typeof value === "string") return true
  return (
    value &&
    typeof value === "object" &&
    Number.isInteger(value.length) &&
    value.length >= 0 &&
    (value.length === 0
      ? Object.keys(value).length === 1
      : value.hasOwnProperty(value.length - 1))
  )
}
export function isDataStructure(value) {
  return (
    typeof value === "object" &&
    (isImmutable(value) || Array.isArray(value) || isPlainObj(value))
  )
}
const toString = Object.prototype.toString
export function isPlainObject(value) {
  if (
    !value ||
    typeof value !== "object" ||
    toString.call(value) !== "[object Object]"
  ) {
    return false
  }
  const proto = Object.getPrototypeOf(value)
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
  const keyCopier = key => {
    ctor.prototype[key] = methods[key]
  }
  Object.keys(methods).forEach(keyCopier)
  Object.getOwnPropertySymbols &&
    Object.getOwnPropertySymbols(methods).forEach(keyCopier)
  return ctor
}
export function quoteString(value) {
  try {
    return typeof value === "string" ? JSON.stringify(value) : String(value)
  } catch (_ignoreError) {
    return JSON.stringify(value)
  }
}
export function shallowCopy(from) {
  if (Array.isArray(from)) return arrCopy(from)
  const to = {}
  for (const key in from) {
    if (hasOwnProperty.call(from, key)) to[key] = from[key]
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
export function is(valueA, valueB) {
  if (valueA === valueB || (valueA !== valueA && valueB !== valueB)) return true
  if (!valueA || !valueB) return false
  if (
    typeof valueA.valueOf === "function" &&
    typeof valueB.valueOf === "function"
  ) {
    valueA = valueA.valueOf()
    valueB = valueB.valueOf()
    if (valueA === valueB || (valueA !== valueA && valueB !== valueB))
      return true
    if (!valueA || !valueB) return false
  }
  return !!(
    isValueObject(valueA) &&
    isValueObject(valueB) &&
    valueA.equals(valueB)
  )
}
export function toJS(value) {
  if (!value || typeof value !== "object") return value
  if (!isCollection(value)) {
    if (!isDataStructure(value)) return value
    value = Seq(value)
  }
  if (isKeyed(value)) {
    const result = {}
    value.__iterate((v, k) => {
      result[k] = toJS(v)
    })
    return result
  }
  const result = []
  value.__iterate(v => {
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
export function SetRef(ref) {
  if (ref) ref.value = true
}
export function OwnerID() {}
export function ensureSize(iter) {
  if (iter.size === undefined) iter.size = iter.__iterate(returnTrue)
  return iter.size
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
