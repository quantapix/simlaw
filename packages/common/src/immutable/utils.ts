import { Seq } from "./main.js"
import type * as qt from "./types.js"

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

export function isAssociative(x: unknown): x is qt.Collection.Keyed<unknown, unknown> | qt.Collection.Indexed<unknown> {
  return isKeyed(x) || isIndexed(x)
}
export function isCollection(x: any): x is qt.Collection<unknown, unknown> {
  return Boolean(x && x[IS_COLLECTION_SYMBOL])
}
export function isImmutable(x: unknown): x is qt.Collection<unknown, unknown> {
  return isCollection(x) || isRecord(x)
}
export function isIndexed(x: any): x is qt.Collection.Indexed<unknown> {
  return Boolean(x && x[IS_INDEXED_SYMBOL])
}
export function isKeyed(x: any): x is qt.Collection.Keyed<unknown, unknown> {
  return Boolean(x && x[IS_KEYED_SYMBOL])
}
export function isList(x: any): x is qt.List<unknown> {
  return Boolean(x && x[IS_LIST_SYMBOL])
}
export function isMap(x: any): x is qt.Map<unknown, unknown> {
  return Boolean(x && x[IS_MAP_SYMBOL])
}
export function isOrdered(x: any): boolean {
  return Boolean(x && x[IS_ORDERED_SYMBOL])
}
export function isOrderedMap(x: unknown): x is qt.OrderedMap<unknown, unknown> {
  return isMap(x) && isOrdered(x)
}
export function isOrderedSet(x: unknown): x is qt.OrderedSet<unknown> {
  return isSet(x) && isOrdered(x)
}
export function isRecord(x: any): x is qt.Record<{}> {
  return Boolean(x && x[IS_RECORD_SYMBOL])
}
export function isSeq(x: any): x is qt.Seq.Indexed<unknown> | qt.Seq.Keyed<unknown, unknown> | qt.Seq.Set<unknown> {
  return Boolean(x && x[IS_SEQ_SYMBOL])
}
export function isSet(x: any): x is qt.Set<unknown> {
  return Boolean(x && x[IS_SET_SYMBOL])
}
export function isStack(x: any): x is qt.Stack<unknown> {
  return Boolean(x && x[IS_STACK_SYMBOL])
}
export function isValueObject(x: any): x is qt.ValueObject {
  return Boolean(x && typeof x.equals === "function" && typeof x.hashCode === "function")
}

export const ITERATE_KEYS = 0
export const ITERATE_VALUES = 1
export const ITERATE_ENTRIES = 2

export class Iterator {
  KEYS = ITERATE_KEYS
  VALUES = ITERATE_VALUES
  ENTRIES = ITERATE_ENTRIES;
  [Symbol.iterator] = () => this
  constructor(public next: unknown) {}
  toSource = () => this.toString()
  inspect = this.toSource
  toString() {
    return "[Iterator]"
  }
}

export function iteratorValue(type, k, v, y) {
  const value = type === 0 ? k : type === 1 ? v : [k, v]
  y ? (y.value = value) : (y = { value, done: false })
  return y
}

export function iteratorDone() {
  return { value: undefined, done: true }
}

export function hasIterator(x: unknown) {
  if (Array.isArray(x)) return true
  return !!getIteratorFn(x)
}

export function isIterator(x: any) {
  return x && typeof x.next === "function"
}

export function getIterator(x: unknown) {
  const f = getIteratorFn(x)
  return f && f.call(x)
}

function getIteratorFn(x: any) {
  const f = x && x[Symbol.iterator]
  if (typeof f === "function") return f
}

export function isEntriesIterable(x: any) {
  const f = getIteratorFn(x)
  return f && f === x.entries
}
export function isKeysIterable(x: any) {
  const f = getIteratorFn(x)
  return f && f === x.keys
}

export function arrCopy(x: any, offset?: number) {
  offset = offset || 0
  const len = Math.max(0, x.length - offset)
  const y = new Array(len)
  for (let i = 0; i < len; i++) {
    y[i] = x[i + offset]
  }
  return y
}

export function assertNotInfinite(size?: number) {
  invariant(size !== Infinity, "Cannot perform this action with an infinite size.")
}

export function coerceKeyPath(x: any) {
  if (isArrayLike(x) && typeof x !== "string") return x
  if (isOrdered(x)) return x.toArray()
  throw new TypeError("Invalid keyPath: expected Ordered Collection or Array: " + x)
}

export function createClass(x, superClass) {
  if (superClass) x.prototype = Object.create(superClass.prototype)
  x.prototype.constructor = x
}

export function deepEqual(a: any, b: any): boolean {
  if (a === b) return true
  if (
    !isCollection(b) ||
    (a.size !== undefined && b.size !== undefined && a.size !== b.size) ||
    (a.__hash !== undefined && b.__hash !== undefined && a.__hash !== b.__hash) ||
    isKeyed(a) !== isKeyed(b) ||
    isIndexed(a) !== isIndexed(b) ||
    isOrdered(a) !== isOrdered(b)
  ) {
    return false
  }
  if (a.size === 0 && b.size === 0) return true
  const notAssociative = !isAssociative(a)
  if (isOrdered(a)) {
    const xs = a.entries()
    return (
      b.every((v, k) => {
        const x = xs.next().value
        return x && is(x[1], v) && (notAssociative || is(x[0], k))
      }) && xs.next().done
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
    if (notAssociative ? !a.has(v) : flipped ? !is(v, a.get(k, NOT_SET)) : !is(a.get(k, NOT_SET), v)) {
      allEqual = false
      return false
    }
    return
  })
  return allEqual && a.size === bSize
}

export function invariant(cond: unknown, x: any) {
  if (!cond) throw new Error(x)
}

export function isArrayLike(x: any) {
  if (Array.isArray(x) || typeof x === "string") return true
  return (
    x &&
    typeof x === "object" &&
    Number.isInteger(x.length) &&
    x.length >= 0 &&
    (x.length === 0 ? Object.keys(x).length === 1 : x.hasOwnProperty(x.length - 1))
  )
}

export function isDataStructure(x: unknown) {
  return typeof x === "object" && (isImmutable(x) || Array.isArray(x) || isPlainObject(x))
}

const toString = Object.prototype.toString
export function isPlainObject(x: unknown) {
  if (!x || typeof x !== "object" || toString.call(x) !== "[object Object]") return false
  const proto = Object.getPrototypeOf(x)
  if (proto === null) return true
  let p = proto
  let next = Object.getPrototypeOf(proto)
  while (next !== null) {
    p = next
    next = Object.getPrototypeOf(p)
  }
  return p === proto
}

export function mixin(ctor, methods) {
  const keyCopier = k => {
    ctor.prototype[k] = methods[k]
  }
  Object.keys(methods).forEach(keyCopier)
  Object.getOwnPropertySymbols && Object.getOwnPropertySymbols(methods).forEach(keyCopier)
  return ctor
}

export function quoteString(x: unknown) {
  try {
    return typeof x === "string" ? JSON.stringify(x) : String(x)
  } catch (_e) {
    return JSON.stringify(x)
  }
}

export function shallowCopy(x: any) {
  if (Array.isArray(x)) return arrCopy(x)
  const y: any = {}
  for (const k in x) {
    if (hasOwnProperty.call(x, k)) y[k] = x[k]
  }
  return y
}

export const hasOwnProperty = Object.hasOwnProperty

export const imul =
  typeof Math.imul === "function" && Math.imul(0xffffffff, 2) === -2
    ? Math.imul
    : function imul(a: number, b: number) {
        a |= 0
        b |= 0
        const c = a & 0xffff
        const d = b & 0xffff
        return (c * d + ((((a >>> 16) * d + c * (b >>> 16)) << 16) >>> 0)) | 0
      }

export function smi(i32: number) {
  return ((i32 >>> 1) & 0x40000000) | (i32 & 0xbfffffff)
}

export function is(a: any, b: any) {
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
    x = new Seq(x)
  }
  if (isKeyed(x)) {
    const y = {}
    x.__iterate((v, k) => {
      y[k] = toJS(v)
    })
    return y
  }
  const y = []
  x.__iterate(v => {
    y.push(toJS(v))
  })
  return y
}

export const DELETE = "delete"
export const SHIFT = 5
export const SIZE = 1 << SHIFT
export const MASK = SIZE - 1
export const NOT_SET = {}

export function MakeRef() {
  return { value: false }
}
export function SetRef(x: any) {
  if (x) x.value = true
}
export function OwnerID() {}

export function ensureSize(x: any): number {
  if (x.size === undefined) x.size = x.__iterate(returnTrue)
  return x.size
}
export function wrapIndex(x: unknown, i: any): number {
  if (typeof i !== "number") {
    const uint32Index = i >>> 0 // N >>> 0 is shorthand for ToUint32
    if ("" + uint32Index !== i || uint32Index === 4294967295) return NaN
    i = uint32Index
  }
  return i < 0 ? ensureSize(x) + i : i
}
export function returnTrue() {
  return true
}
export function wholeSlice(beg: number, end?: number, size?: number) {
  return (
    ((beg === 0 && !isNeg(beg)) || (size !== undefined && beg <= -size)) &&
    (end === undefined || (size !== undefined && end >= size))
  )
}
export function resolveBegin(x: number, size: number) {
  return resolveIndex(x, size, 0)
}
export function resolveEnd(x: number, size: number) {
  return resolveIndex(x, size, size)
}
function resolveIndex(x: number | undefined, size: number, x0: number) {
  return x === undefined
    ? x0
    : isNeg(x)
    ? size === Infinity
      ? size
      : Math.max(0, size + x) | 0
    : size === undefined || size === x
    ? x
    : Math.min(size, x) | 0
}
function isNeg(x: number) {
  return x < 0 || (x === 0 && 1 / x === -Infinity)
}

export function fromJS(
  x: unknown,
  f?: (
    k: string | number,
    x: qt.Collection.Keyed<string, unknown> | qt.Collection.Indexed<unknown>,
    path?: Array<string | number>
  ) => unknown
): qt.Collection<unknown, unknown> {
  return fromJSWith([], f || defaultConverter, x, "", f && f.length > 2 ? [] : undefined, { "": x })
}

function fromJSWith(stack, converter, value, key, keyPath, parentValue) {
  if (
    typeof value !== "string" &&
    !isImmutable(value) &&
    (isArrayLike(value) || hasIterator(value) || isPlainObj(value))
  ) {
    if (~stack.indexOf(value)) {
      throw new TypeError("Cannot convert circular structure to Immutable")
    }
    stack.push(value)
    keyPath && key !== "" && keyPath.push(key)
    const converted = converter.call(
      parentValue,
      key,
      Seq(value).map((v, k) => fromJSWith(stack, converter, v, k, keyPath, value)),
      keyPath && keyPath.slice()
    )
    stack.pop()
    keyPath && keyPath.pop()
    return converted
  }
  return value
}

function defaultConverter(k, v) {
  return isIndexed(v) ? v.toList() : isKeyed(v) ? v.toMap() : v.toSet()
}

const defaultValueOf = Object.prototype.valueOf

let weakMap: any
const usingWeakMap = typeof WeakMap === "function"
if (usingWeakMap) weakMap = new WeakMap()
const symbolMap = Object.create(null)
let _objHashUID = 0
const UID_HASH_KEY = "__immutablehash__"
const STRING_HASH_CACHE_MIN_STRLEN = 16
const STRING_HASH_CACHE_MAX_SIZE = 255
let STRING_HASH_CACHE_SIZE = 0
let stringHashCache: any = {}

export function hash(x: any): number {
  if (x == null) return hashNullish(x)
  if (typeof x.hashCode === "function") return smi(x.hashCode(x))
  const y = valueOf(x)
  if (y == null) return hashNullish(y)
  switch (typeof y) {
    case "boolean":
      return y ? 0x42108421 : 0x42108420
    case "number":
      return hashNumber(y)
    case "string":
      return y.length > STRING_HASH_CACHE_MIN_STRLEN ? cachedHashString(y) : hashString(y)
    case "object":
    case "function":
      return hashJSObj(y)
    case "symbol":
      return hashSymbol(y)
    default:
      if (typeof y.toString === "function") return hashString(y.toString())
      throw new Error("Value type " + typeof y + " cannot be hashed.")
  }
}

function hashNullish(x?: null) {
  return x === null ? 0x42108422 : 0x42108423
}

function hashNumber(x: number) {
  if (x !== x || x === Infinity) return 0
  let hash = x | 0
  if (hash !== x) hash ^= x * 0xffffffff
  while (x > 0xffffffff) {
    x /= 0xffffffff
    hash ^= x
  }
  return smi(hash)
}
function cachedHashString(x) {
  let y = stringHashCache[x]
  if (y === undefined) {
    y = hashString(x)
    if (STRING_HASH_CACHE_SIZE === STRING_HASH_CACHE_MAX_SIZE) {
      STRING_HASH_CACHE_SIZE = 0
      stringHashCache = {}
    }
    STRING_HASH_CACHE_SIZE++
    stringHashCache[x] = y
  }
  return y
}
function hashString(x: string) {
  let y = 0
  for (let ii = 0; ii < x.length; ii++) {
    y = (31 * y + x.charCodeAt(ii)) | 0
  }
  return smi(y)
}

function hashSymbol(x: symbol) {
  let y = symbolMap[x]
  if (y !== undefined) return y
  y = nextHash()
  symbolMap[x] = y
  return y
}

function hashJSObj(x) {
  let y
  if (usingWeakMap) {
    y = weakMap.get(x)
    if (y !== undefined) return y
  }
  y = x[UID_HASH_KEY]
  if (y !== undefined) return y
  if (!canDefineProperty) {
    y = x.propertyIsEnumerable && x.propertyIsEnumerable[UID_HASH_KEY]
    if (y !== undefined) return y
    y = getIENodeHash(x)
    if (y !== undefined) return y
  }
  y = nextHash()
  if (usingWeakMap) weakMap.set(x, y)
  else if (isExtensible !== undefined && isExtensible(x) === false) {
    throw new Error("Non-extensible objects are not allowed as keys.")
  } else if (canDefineProperty) {
    Object.defineProperty(x, UID_HASH_KEY, {
      enumerable: false,
      configurable: false,
      writable: false,
      value: y,
    })
  } else if (
    x.propertyIsEnumerable !== undefined &&
    x.propertyIsEnumerable === x.constructor.prototype.propertyIsEnumerable
  ) {
    x.propertyIsEnumerable = function () {
      return this.constructor.prototype.propertyIsEnumerable.apply(this, arguments)
    }
    x.propertyIsEnumerable[UID_HASH_KEY] = y
  } else if (x.nodeType !== undefined) x[UID_HASH_KEY] = y
  else throw new Error("Unable to set a non-enumerable property on object.")
  return y
}

const isExtensible = Object.isExtensible

const canDefineProperty = (function () {
  try {
    Object.defineProperty({}, "@", {})
    return true
  } catch (e) {
    return false
  }
})()

function getIENodeHash(node) {
  if (node && node.nodeType > 0) {
    switch (node.nodeType) {
      case 1:
        return node.uniqueID
      case 9:
        return node.documentElement && node.documentElement.uniqueID
    }
  }
}

function valueOf(x: any) {
  return x.valueOf !== defaultValueOf && typeof x.valueOf === "function" ? x.valueOf(x) : x
}

function nextHash() {
  const y = ++_objHashUID
  if (_objHashUID & 0x40000000) _objHashUID = 0
  return y
}
