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

export function isAssociative<K, V>(x: unknown): x is qt.Collection.Keyed<K, V> | qt.Collection.Indexed<V> {
  return isKeyed(x) || isIndexed(x)
}
export function isCollection<K, V>(x: any): x is qt.Collection<K, V> {
  return Boolean(x && x[IS_COLLECTION_SYMBOL])
}
export function isImmutable<K, V>(x: unknown): x is qt.Collection<K, V> {
  return isCollection(x) || isRecord(x)
}
export function isIndexed<V>(x: any): x is qt.Collection.Indexed<V> {
  return Boolean(x && x[IS_INDEXED_SYMBOL])
}
export function isKeyed<K, V>(x: any): x is qt.Collection.Keyed<K, V> {
  return Boolean(x && x[IS_KEYED_SYMBOL])
}
export function isList<V>(x: any): x is qt.List<V> {
  return Boolean(x && x[IS_LIST_SYMBOL])
}
export function isMap<K, V>(x: any): x is qt.Map<K, V> {
  return Boolean(x && x[IS_MAP_SYMBOL])
}
export function isOrdered(x: any): boolean {
  return Boolean(x && x[IS_ORDERED_SYMBOL])
}
export function isOrderedMap<K, V>(x: unknown): x is qt.OrderedMap<K, V> {
  return isMap(x) && isOrdered(x)
}
export function isOrderedSet<V>(x: unknown): x is qt.OrderedSet<V> {
  return isSet(x) && isOrdered(x)
}
export function isRecord(x: any): x is qt.Record<{}> {
  return Boolean(x && x[IS_RECORD_SYMBOL])
}
export function isSeq<K, V>(x: any): x is qt.Seq.Indexed<V> | qt.Seq.Keyed<K, V> | qt.Seq.Set<V> {
  return Boolean(x && x[IS_SEQ_SYMBOL])
}
export function isSet<V>(x: any): x is qt.Set<V> {
  return Boolean(x && x[IS_SET_SYMBOL])
}
export function isStack<V>(x: any): x is qt.Stack<V> {
  return Boolean(x && x[IS_STACK_SYMBOL])
}
export function isValueObject(x: any): x is qt.ValueObject {
  return Boolean(x && typeof x.equals === "function" && typeof x.hashCode === "function")
}
export function isIterator(x: any) {
  return Boolean(x && typeof x.next === "function")
}
export function isArrayLike(x: any) {
  if (Array.isArray(x) || typeof x === "string") return true
  return Boolean(
    x &&
      typeof x === "object" &&
      Number.isInteger(x.length) &&
      x.length >= 0 &&
      (x.length === 0 ? Object.keys(x).length === 1 : x.hasOwnProperty(x.length - 1))
  )
}
export function isDataStructure(x: unknown) {
  return typeof x === "object" && (isImmutable(x) || Array.isArray(x) || isPlain(x))
}

export const ITERATE_KEYS = 0
export const ITERATE_VALUES = 1
export const ITERATE_ENTRIES = 2

export class Iter {
  [Symbol.iterator] = () => this
  constructor(public next: unknown) {}
  toString() {
    return "[Iterator]"
  }
  toSource() {
    return this.toString()
  }
  inspect = this.toSource
}

export namespace Iter {
  export const enum Mode {
    KEYS,
    VALUES,
    ENTRIES,
  }

  export interface Result {
    value: unknown
    done: boolean
  }
  export function value(m: Mode, k: unknown, v: unknown, y?: Result) {
    const value = m === Mode.KEYS ? k : m === Mode.VALUES ? v : [k, v]
    y ? (y.value = value) : (y = { value, done: false })
    return y
  }
  export function done() {
    return { value: undefined, done: true } as Result
  }
}

export function hasIterator(x: unknown) {
  if (Array.isArray(x)) return true
  return !!getIteratorFn(x)
}

export function getIterator(x: unknown) {
  const f = getIteratorFn(x)
  return f && f.call(x)
}

function getIteratorFn(x: any) {
  const f = x && x[Symbol.iterator]
  if (typeof f === "function") return f as Function
  return
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

const toString = Object.prototype.toString

function isPlain(x: unknown) {
  if (!x || typeof x !== "object" || toString.call(x) !== "[object Object]") return false
  const proto = Object.getPrototypeOf(x)
  if (proto === null) return true
  let p0 = proto
  let p = Object.getPrototypeOf(proto)
  while (p !== null) {
    p0 = p
    p = Object.getPrototypeOf(p0)
  }
  return p0 === proto
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

function valueOf(x: any) {
  return x.valueOf !== defaultValueOf && typeof x.valueOf === "function" ? x.valueOf(x) : x
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
    (isArrayLike(value) || hasIterator(value) || isPlain(value))
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

const symMap = Object.create(null)
let theHash = 0
const objMap = new WeakMap()
const HASH_KEY = "__immutablehash__"
const MIN_LEN = 16
const MAX_SIZE = 255
let strMap: any = {}
let MAP_SIZE = 0

function smi(x: number) {
  return ((x >>> 1) & 0x40000000) | (x & 0xbfffffff)
}

export function hash(x: any): number {
  if (x == null || x == undefined) return nullHash(x)
  if (typeof x.hashCode === "function") return smi(x.hashCode(x))
  const y = valueOf(x)
  if (y == null) return nullHash(y)
  switch (typeof y) {
    case "boolean":
      return y ? 0x42108421 : 0x42108420
    case "number":
      return numHash(y)
    case "string":
      return y.length > MIN_LEN ? cached(y) : strHash(y)
    case "object":
    case "function":
      return objHash(y)
    case "symbol":
      return symHash(y)
    default:
      if (typeof y.toString === "function") return strHash(y.toString())
      throw new Error("Value type " + typeof y + " cannot be hashed.")
  }
  function nullHash(x?: null) {
    return x === null ? 0x42108422 : 0x42108423
  }
  function numHash(x: number) {
    if (x !== x || x === Infinity) return 0
    let y = x | 0
    if (y !== x) y ^= x * 0xffffffff
    while (x > 0xffffffff) {
      x /= 0xffffffff
      y ^= x
    }
    return smi(y)
  }
  function cached(x: string) {
    let y = strMap[x]
    if (y === undefined) {
      y = strHash(x)
      if (MAP_SIZE === MAX_SIZE) {
        MAP_SIZE = 0
        strMap = {}
      }
      MAP_SIZE++
      strMap[x] = y
    }
    return y
  }
  function strHash(x: string) {
    let y = 0
    for (let i = 0; i < x.length; i++) {
      y = (31 * y + x.charCodeAt(i)) | 0
    }
    return smi(y)
  }
  function nextHash() {
    const y = ++theHash
    if (theHash & 0x40000000) theHash = 0
    return y
  }
  function symHash(x: symbol) {
    let y = symMap[x]
    if (y !== undefined) return y
    y = nextHash()
    symMap[x] = y
    return y
  }
  function objHash(x: any) {
    let y = objMap.get(x)
    if (y !== undefined) return y
    y = x[HASH_KEY]
    if (y !== undefined) return y
    y = nextHash()
    objMap.set(x, y)
    return y
  }
}

export function mergeHash(a: number, b: number) {
  return (a ^ (b + 0x9e3779b9 + (a << 6) + (a >> 2))) | 0
}

export function murmurHash(x: number, y: number) {
  const imul =
    typeof Math.imul === "function" && Math.imul(0xffffffff, 2) === -2
      ? Math.imul
      : (a: number, b: number) => {
          a |= 0
          b |= 0
          const c = a & 0xffff
          const d = b & 0xffff
          return (c * d + ((((a >>> 16) * d + c * (b >>> 16)) << 16) >>> 0)) | 0
        }
  y = imul(y, 0xcc9e2d51)
  y = imul((y << 15) | (y >>> -15), 0x1b873593)
  y = imul((y << 13) | (y >>> -13), 5)
  y = ((y + 0xe6546b64) | 0) ^ x
  y = imul(y ^ (y >>> 16), 0x85ebca6b)
  y = imul(y ^ (y >>> 13), 0xc2b2ae35)
  y = smi(y ^ (y >>> 16))
  return y
}
