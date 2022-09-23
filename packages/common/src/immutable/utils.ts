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
  return Boolean(x && typeof x.equals === "function" && typeof x.hashCode === "function")
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
  const f = x && ((REAL_ITERATOR_SYMBOL && x[REAL_ITERATOR_SYMBOL]) || x[FAUX_ITERATOR_SYMBOL])
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
  invariant(size !== Infinity, "Cannot perform this action with an infinite size.")
}
export function coerceKeyPath(keyPath) {
  if (isArrayLike(keyPath) && typeof keyPath !== "string") return keyPath
  if (isOrdered(keyPath)) return keyPath.toArray()
  throw new TypeError("Invalid keyPath: expected Ordered Collection or Array: " + keyPath)
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
    if (notAssociative ? !a.has(v) : flipped ? !is(v, a.get(k, NOT_SET)) : !is(a.get(k, NOT_SET), v)) {
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
  return x && typeof x === "object" && Number.isInteger(x.length) && x.length >= 0 && (x.length === 0 ? Object.keys(x).length === 1 : x.hasOwnProperty(x.length - 1))
}
export function isDataStructure(x) {
  return typeof x === "object" && (isImmutable(x) || Array.isArray(x) || isPlainObject(x))
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
  Object.getOwnPropertySymbols && Object.getOwnPropertySymbols(methods).forEach(keyCopier)
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
  return ((begin === 0 && !isNeg(begin)) || (size !== undefined && begin <= -size)) && (end === undefined || (size !== undefined && end >= size))
}
export function resolveBegin(begin, size) {
  return resolveIndex(begin, size, 0)
}
export function resolveEnd(end, size) {
  return resolveIndex(end, size, size)
}
function resolveIndex(index, size, defaultIndex) {
  return index === undefined ? defaultIndex : isNeg(index) ? (size === Infinity ? size : Math.max(0, size + index) | 0) : size === undefined || size === index ? index : Math.min(size, index) | 0
}
function isNeg(value) {
  return value < 0 || (value === 0 && 1 / value === -Infinity)
}

export function fromJS(value, converter) {
  return fromJSWith([], converter || defaultConverter, value, "", converter && converter.length > 2 ? [] : undefined, { "": value })
}

function fromJSWith(stack, converter, value, key, keyPath, parentValue) {
  if (typeof value !== "string" && !isImmutable(value) && (isArrayLike(value) || hasIterator(value) || isPlainObj(value))) {
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
  // Effectively the opposite of "Collection.toSeq()"
  return isIndexed(v) ? v.toList() : isKeyed(v) ? v.toMap() : v.toSet()
}

const defaultValueOf = Object.prototype.valueOf
export function hash(o) {
  if (o == null) return hashNullish(o)
  if (typeof o.hashCode === "function") return smi(o.hashCode(o))
  const v = valueOf(o)
  if (v == null) return hashNullish(v)
  switch (typeof v) {
    case "boolean":
      return v ? 0x42108421 : 0x42108420
    case "number":
      return hashNumber(v)
    case "string":
      return v.length > STRING_HASH_CACHE_MIN_STRLEN ? cachedHashString(v) : hashString(v)
    case "object":
    case "function":
      return hashJSObj(v)
    case "symbol":
      return hashSymbol(v)
    default:
      if (typeof v.toString === "function") {
        return hashString(v.toString())
      }
      throw new Error("Value type " + typeof v + " cannot be hashed.")
  }
}
function hashNullish(nullish) {
  return nullish === null ? 0x42108422 : /* undefined */ 0x42108423
}
function hashNumber(n) {
  if (n !== n || n === Infinity) return 0
  let hash = n | 0
  if (hash !== n) hash ^= n * 0xffffffff
  while (n > 0xffffffff) {
    n /= 0xffffffff
    hash ^= n
  }
  return smi(hash)
}
function cachedHashString(string) {
  let hashed = stringHashCache[string]
  if (hashed === undefined) {
    hashed = hashString(string)
    if (STRING_HASH_CACHE_SIZE === STRING_HASH_CACHE_MAX_SIZE) {
      STRING_HASH_CACHE_SIZE = 0
      stringHashCache = {}
    }
    STRING_HASH_CACHE_SIZE++
    stringHashCache[string] = hashed
  }
  return hashed
}
function hashString(string) {
  let hashed = 0
  for (let ii = 0; ii < string.length; ii++) {
    hashed = (31 * hashed + string.charCodeAt(ii)) | 0
  }
  return smi(hashed)
}
function hashSymbol(sym) {
  let hashed = symbolMap[sym]
  if (hashed !== undefined) return hashed
  hashed = nextHash()
  symbolMap[sym] = hashed
  return hashed
}
function hashJSObj(obj) {
  let hashed
  if (usingWeakMap) {
    hashed = weakMap.get(obj)
    if (hashed !== undefined) return hashed
  }
  hashed = obj[UID_HASH_KEY]
  if (hashed !== undefined) return hashed
  if (!canDefineProperty) {
    hashed = obj.propertyIsEnumerable && obj.propertyIsEnumerable[UID_HASH_KEY]
    if (hashed !== undefined) return hashed
    hashed = getIENodeHash(obj)
    if (hashed !== undefined) return hashed
  }
  hashed = nextHash()
  if (usingWeakMap) {
    weakMap.set(obj, hashed)
  } else if (isExtensible !== undefined && isExtensible(obj) === false) {
    throw new Error("Non-extensible objects are not allowed as keys.")
  } else if (canDefineProperty) {
    Object.defineProperty(obj, UID_HASH_KEY, {
      enumerable: false,
      configurable: false,
      writable: false,
      value: hashed,
    })
  } else if (obj.propertyIsEnumerable !== undefined && obj.propertyIsEnumerable === obj.constructor.prototype.propertyIsEnumerable) {
    obj.propertyIsEnumerable = function () {
      return this.constructor.prototype.propertyIsEnumerable.apply(this, arguments)
    }
    obj.propertyIsEnumerable[UID_HASH_KEY] = hashed
  } else if (obj.nodeType !== undefined) obj[UID_HASH_KEY] = hashed
  else throw new Error("Unable to set a non-enumerable property on object.")
  return hashed
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
function valueOf(obj) {
  return obj.valueOf !== defaultValueOf && typeof obj.valueOf === "function" ? obj.valueOf(obj) : obj
}
function nextHash() {
  const nextHash = ++_objHashUID
  if (_objHashUID & 0x40000000) _objHashUID = 0
  return nextHash
}
const usingWeakMap = typeof WeakMap === "function"
let weakMap
if (usingWeakMap) weakMap = new WeakMap()
const symbolMap = Object.create(null)
let _objHashUID = 0
let UID_HASH_KEY = "__immutablehash__"
if (typeof Symbol === "function") UID_HASH_KEY = Symbol(UID_HASH_KEY)
const STRING_HASH_CACHE_MIN_STRLEN = 16
const STRING_HASH_CACHE_MAX_SIZE = 255
let STRING_HASH_CACHE_SIZE = 0
let stringHashCache = {}

function fromJS(
  jsValue: unknown,
  reviver?: (k: string | number, sequence: Collection.Keyed<string, unknown> | Collection.Indexed<unknown>, path?: Array<string | number>) => unknown
): Collection<unknown, unknown>
function is(first: unknown, second: unknown): boolean
function hash(value: unknown): number
function isImmutable(maybeImmutable: unknown): maybeImmutable is Collection<unknown, unknown>
function isCollection(maybeCollection: unknown): maybeCollection is Collection<unknown, unknown>
function isKeyed(maybeKeyed: unknown): maybeKeyed is Collection.Keyed<unknown, unknown>
function isIndexed(maybeIndexed: unknown): maybeIndexed is Collection.Indexed<unknown>
function isAssociative(maybeAssociative: unknown): maybeAssociative is Collection.Keyed<unknown, unknown> | Collection.Indexed<unknown>
function isOrdered(maybeOrdered: unknown): boolean
function isValueObject(maybeValue: unknown): maybeValue is ValueObject
function isSeq(maybeSeq: unknown): maybeSeq is Seq.Indexed<unknown> | Seq.Keyed<unknown, unknown> | Seq.Set<unknown>
function isList(maybeList: unknown): maybeList is List<unknown>
function isMap(maybeMap: unknown): maybeMap is Map<unknown, unknown>
function isOrderedMap(maybeOrderedMap: unknown): maybeOrderedMap is OrderedMap<unknown, unknown>
function isStack(maybeStack: unknown): maybeStack is Stack<unknown>
function isSet(maybeSet: unknown): maybeSet is Set<unknown>
function isOrderedSet(maybeOrderedSet: unknown): maybeOrderedSet is OrderedSet<unknown>
function isRecord(maybeRecord: unknown): maybeRecord is Record<{}>
function get<K, V>(collection: Collection<K, V>, k: K): V | undefined
function get<K, V, NSV>(collection: Collection<K, V>, k: K, v0: NSV): V | NSV
function get<TProps extends object, K extends keyof TProps>(record: Record<TProps>, k: K, v0: unknown): TProps[K]
function get<V>(collection: Array<V>, key: number): V | undefined
function get<V, NSV>(collection: Array<V>, key: number, v0: NSV): V | NSV
function get<C extends object, K extends keyof C>(object: C, k: K, v0: unknown): C[K]
function get<V>(collection: Dict<V>, k: string): V | undefined
function get<V, NSV>(collection: Dict<V>, k: string, v0: NSV): V | NSV
function has(collection: object, key: unknown): boolean
function remove<K, C extends Collection<K, unknown>>(collection: C, k: K): C
function remove<TProps extends object, C extends Record<TProps>, K extends keyof TProps>(collection: C, k: K): C
function remove<C extends Array<unknown>>(collection: C, key: number): C
function remove<C, K extends keyof C>(collection: C, k: K): C
function remove<C extends Dict, K extends keyof C>(collection: C, k: K): C
function set<K, V, C extends Collection<K, V>>(collection: C, k: K, v: V): C
function set<TProps extends object, C extends Record<TProps>, K extends keyof TProps>(record: C, k: K, value: TProps[K]): C
function set<V, C extends Array<V>>(collection: C, key: number, v: V): C
function set<C, K extends keyof C>(object: C, k: K, value: C[K]): C
function set<V, C extends Dict<V>>(collection: C, k: string, v: V): C
function update<K, V, C extends Collection<K, V>>(collection: C, k: K, f: (v: V | undefined) => V): C
function update<K, V, C extends Collection<K, V>, NSV>(collection: C, k: K, v0: NSV, f: (v: V | NSV) => V): C
function update<TProps extends object, C extends Record<TProps>, K extends keyof TProps>(record: C, k: K, f: (value: TProps[K]) => TProps[K]): C
function update<TProps extends object, C extends Record<TProps>, K extends keyof TProps, NSV>(record: C, k: K, v0: NSV, f: (value: TProps[K] | NSV) => TProps[K]): C
function update<V>(collection: Array<V>, key: number, f: (v: V) => V): Array<V>
function update<V, NSV>(collection: Array<V>, key: number, v0: NSV, f: (v: V | NSV) => V): Array<V>
function update<C, K extends keyof C>(object: C, k: K, f: (value: C[K]) => C[K]): C
function update<C, K extends keyof C, NSV>(object: C, k: K, v0: NSV, f: (value: C[K] | NSV) => C[K]): C
function update<V, C extends Dict<V>, K extends keyof C>(collection: C, k: K, f: (v: V) => V): Dict<V>
function update<V, C extends Dict<V>, K extends keyof C, NSV>(collection: C, k: K, v0: NSV, f: (v: V | NSV) => V): Dict<V>
function getIn(collection: unknown, x: Iterable<unknown>, v0?: unknown): unknown
function hasIn(collection: unknown, x: Iterable<unknown>): boolean
function removeIn<C>(collection: C, x: Iterable<unknown>): C
function setIn<C>(collection: C, x: Iterable<unknown>, value: unknown): C
function updateIn<C>(collection: C, x: Iterable<unknown>, f: (value: unknown) => unknown): C
function updateIn<C>(collection: C, x: Iterable<unknown>, v0: unknown, f: (value: unknown) => unknown): C
function merge<C>(collection: C, ...xs: Array<Iterable<unknown> | Iterable<[unknown, unknown]> | Dict>): C
function mergeWith<C>(merger: (old: unknown, newVal: unknown, key: unknown) => unknown, collection: C, ...xs: Array<Iterable<unknown> | Iterable<[unknown, unknown]> | Dict>): C
function mergeDeep<C>(collection: C, ...xs: Array<Iterable<unknown> | Iterable<[unknown, unknown]> | Dict>): C
function mergeDeepWith<C>(merger: (old: unknown, newVal: unknown, key: unknown) => unknown, collection: C, ...xs: Array<Iterable<unknown> | Iterable<[unknown, unknown]> | Dict>): C
