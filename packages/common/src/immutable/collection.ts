/* eslint-disable @typescript-eslint/no-namespace */
import { List } from "./list.js"
import { Map } from "./map.js"
import { OrderedMap, OrderedSet } from "./ordered.js"
import { Range } from "./range.js"
import { Seq, KeyedSeq, IndexedSeq, SetSeq, ArraySeq } from "./seq.js"
import { Set } from "./set.js"
import { Stack } from "./stack.js"
import * as qf from "./functions.js"
import * as qo from "./operations.js"
import * as qu from "./utils.js"
import type * as qt from "./types.js"

export class Collection<K, V> implements qt.Collection<K, V> {
  static isAssociative = qu.isAssociative
  static isIndexed = qu.isIndexed
  static isKeyed = qu.isKeyed
  static isOrdered = qu.isOrdered

  static create<T extends Collection<unknown, unknown>>(x: T): T
  static create<T>(x: Iterable<T> | ArrayLike<T>): qt.Collection.Indexed<T>
  static create<V>(x: qt.Dict<V>): qt.Collection.Keyed<string, V>
  static create<K = unknown, V = unknown>(): Collection<K, V>
  static create(x?: unknown): unknown {
    return qu.isCollection(x) ? x : new Seq(x)
  }

  [Symbol.iterator] = this.values;
  [qu.IS_COLLECTION_SYMBOL] = true

  __toString(head, tail) {
    if (this.size === 0) return head + tail
    return head + " " + this.toSeq().map(this.__toStringMapper).join(", ") + " " + tail
  }
  butLast() {
    return this.slice(0, -1)
  }
  concat(...xs) {
    return qo.reify(this, qo.concatFactory(this, xs))
  }
  count(predicate, ctx) {
    return qu.ensureSize(predicate ? this.toSeq().filter(predicate, ctx) : this)
  }
  countBy(grouper, ctx) {
    return qo.countByFactory(this, grouper, ctx)
  }
  entries() {
    return this.__iterator(qu.ITERATE_ENTRIES)
  }
  equals(x) {
    return qu.deepEqual(this, x)
  }
  filter(predicate, ctx) {
    return qo.reify(this, qo.filterFactory(this, predicate, ctx, true))
  }
  filterNot(predicate, ctx) {
    return this.filter(not(predicate), ctx)
  }
  find(predicate, ctx, v0) {
    const entry = this.findEntry(predicate, ctx)
    return entry ? entry[1] : v0
  }
  findKey(predicate, ctx) {
    const entry = this.findEntry(predicate, ctx)
    return entry && entry[0]
  }
  findLast(predicate, ctx, v0) {
    return this.toKeyedSeq().reverse().find(predicate, ctx, v0)
  }
  findLastEntry(predicate, ctx, v0) {
    return this.toKeyedSeq().reverse().findEntry(predicate, ctx, v0)
  }
  findLastKey(predicate, ctx) {
    return this.toKeyedSeq().reverse().findKey(predicate, ctx)
  }
  first(v0) {
    return this.find(qu.returnTrue, null, v0)
  }
  flatMap(mapper, ctx) {
    return qo.reify(this, qo.flatMapFactory(this, mapper, ctx))
  }
  flatten(depth) {
    return qo.reify(this, qo.flattenFactory(this, depth, true))
  }
  forEach(sideEffect, ctx) {
    qu.assertNotInfinite(this.size)
    return this.__iterate(ctx ? sideEffect.bind(ctx) : sideEffect)
  }
  fromEntrySeq() {
    return new qo.FromEntriesSequence(this)
  }
  get(searchKey, v0) {
    return this.find((_, key) => qu.is(key, searchKey), undefined, v0)
  }
  getIn: qf.getIn
  groupBy(grouper, ctx) {
    return qo.groupByFactory(this, grouper, ctx)
  }
  has(searchKey) {
    return this.get(searchKey, qu.NOT_SET) !== qu.NOT_SET
  }
  hashCode() {
    return this.__hash || (this.__hash = hashCollection(this))
  }
  hasIn: qf.hasIn
  includes(searchValue) {
    return this.some(value => qu.is(value, searchValue))
  }
  isEmpty() {
    return this.size !== undefined ? this.size === 0 : !this.some(() => true)
  }
  isSubset(iter) {
    iter = typeof iter.includes === "function" ? iter : Collection(iter)
    return this.every(value => iter.includes(value))
  }
  isSuperset(iter) {
    iter = typeof iter.isSubset === "function" ? iter : Collection(iter)
    return iter.isSubset(this)
  }
  keyOf(searchValue) {
    return this.findKey(value => qu.is(value, searchValue))
  }
  keys() {
    return this.__iterator(qu.ITERATE_KEYS)
  }
  keySeq() {
    return this.toSeq().map(keyMapper).toIndexedSeq()
  }
  last(v0) {
    return this.toSeq().reverse().first(v0)
  }
  lastKeyOf(searchValue) {
    return this.toKeyedSeq().reverse().keyOf(searchValue)
  }
  map(mapper, ctx) {
    return qo.reify(this, qo.mapFactory(this, mapper, ctx))
  }
  max(comparator) {
    return qo.maxFactory(this, comparator)
  }
  maxBy(mapper, comparator) {
    return qo.maxFactory(this, comparator, mapper)
  }
  min(comparator) {
    return qo.maxFactory(this, comparator ? neg(comparator) : defaultNegComparator)
  }
  minBy(mapper, comparator) {
    return qo.maxFactory(this, comparator ? neg(comparator) : defaultNegComparator, mapper)
  }
  reduce(reducer, r0, ctx) {
    return reduce(this, reducer, r0, ctx, arguments.length < 2, false)
  }
  reduceRight(reducer, r0, ctx) {
    return reduce(this, reducer, r0, ctx, arguments.length < 2, true)
  }
  rest() {
    return this.slice(1)
  }
  reverse() {
    return qo.reify(this, qo.reverseFactory(this, true))
  }
  skip(amount) {
    return amount === 0 ? this : this.slice(Math.max(0, amount))
  }
  skipLast(amount) {
    return amount === 0 ? this : this.slice(0, -Math.max(0, amount))
  }
  skipUntil(predicate, ctx) {
    return this.skipWhile(not(predicate), ctx)
  }
  skipWhile(predicate, ctx) {
    return qo.reify(this, qo.skipWhileFactory(this, predicate, ctx, true))
  }
  slice(begin, end) {
    return qo.reify(this, qo.sliceFactory(this, begin, end, true))
  }
  some(predicate, ctx) {
    return !this.every(not(predicate), ctx)
  }
  sort(comparator) {
    return qo.reify(this, qo.sortFactory(this, comparator))
  }
  sortBy(mapper, comparator) {
    return qo.reify(this, qo.sortFactory(this, comparator, mapper))
  }
  take(amount) {
    return this.slice(0, Math.max(0, amount))
  }
  takeLast(amount) {
    return this.slice(-Math.max(0, amount))
  }
  takeUntil(predicate, ctx) {
    return this.takeWhile(not(predicate), ctx)
  }
  takeWhile(predicate, ctx) {
    return qo.reify(this, qo.takeWhileFactory(this, predicate, ctx))
  }
  toIndexedSeq() {
    return new qo.ToIndexedSequence(this)
  }
  toJS() {
    return qu.toJS(this)
  }
  toKeyedSeq() {
    return new qo.ToKeyedSequence(this, true)
  }
  toList() {
    return List(qu.isKeyed(this) ? this.valueSeq() : this)
  }
  toMap() {
    return Map(this.toKeyedSeq())
  }
  toObject: qf.toObject
  toOrderedMap() {
    return OrderedMap(this.toKeyedSeq())
  }
  toOrderedSet() {
    return OrderedSet(qu.isKeyed(this) ? this.valueSeq() : this)
  }
  toSeq() {
    return qu.isIndexed(this) ? this.toIndexedSeq() : qu.isKeyed(this) ? this.toKeyedSeq() : this.toSetSeq()
  }
  toSet() {
    return Set(qu.isKeyed(this) ? this.valueSeq() : this)
  }
  toSetSeq() {
    return new qo.ToSetSequence(this)
  }
  toStack() {
    return Stack(qu.isKeyed(this) ? this.valueSeq() : this)
  }
  toString() {
    return "[Collection]"
  }
  update(fn) {
    return fn(this)
  }
  values(): IterableIterator<V> {
    return this.__iterator(qu.ITERATE_VALUES)
  }
  valueSeq() {
    return this.toIndexedSeq()
  }
  every(predicate, ctx) {
    qu.assertNotInfinite(this.size)
    let returnValue = true
    this.__iterate((v, k, c) => {
      if (!predicate.call(ctx, v, k, c)) {
        returnValue = false
        return false
      }
    })
    return returnValue
  }
  join(separator) {
    qu.assertNotInfinite(this.size)
    separator = separator !== undefined ? "" + separator : ","
    let joined = ""
    let isFirst = true
    this.__iterate(v => {
      isFirst ? (isFirst = false) : (joined += separator)
      joined += v !== null && v !== undefined ? v.toString() : ""
    })
    return joined
  }

  entrySeq() {
    const collection = this
    if (collection._cache) {
      return new ArraySeq(collection._cache)
    }
    const entriesSequence = collection.toSeq().map(entryMapper).toIndexedSeq()
    entriesSequence.fromEntrySeq = () => collection.toSeq()
    return entriesSequence
  }
  findEntry(predicate, ctx, v0) {
    let found = v0
    this.__iterate((v, k, c) => {
      if (predicate.call(ctx, v, k, c)) {
        found = [k, v]
        return false
      }
    })
    return found
  }
  toArray() {
    qu.assertNotInfinite(this.size)
    const array = new Array(this.size || 0)
    const useTuples = qu.isKeyed(this)
    let i = 0
    this.__iterate((v, k) => {
      array[i++] = useTuples ? [k, v] : v
    })
    return array
  }
  toJSON = this.toArray
  __toStringMapper = qu.quoteString
  toSource = () => {
    return this.toString()
  }
  inspect = this.toSource
  chain = this.flatMap
  contains = this.includes
}

export namespace Collection {
  export class Keyed<K, V> extends Collection<K, V> implements qt.Collection.Keyed<K, V> {
    static override create<K, V>(x?: Iterable<[K, V]>): qt.Collection.Keyed<K, V>
    static override create<V>(x: qt.Dict<V>): qt.Collection.Keyed<string, V>
    static override create(x?: any): any {
      return qu.isKeyed(x) ? x : new KeyedSeq(x)
    }
    [Symbol.iterator] = this.entries;
    [qu.IS_KEYED_SYMBOL] = true
    flip() {
      return qo.reify(this, qo.flipFactory(this))
    }
    mapEntries(mapper, ctx) {
      let iterations = 0
      return qo.reify(
        this,
        this.toSeq()
          .map((v, k) => mapper.call(ctx, [k, v], iterations++, this))
          .fromEntrySeq()
      )
    }
    mapKeys(mapper, ctx) {
      return qo.reify(
        this,
        this.toSeq()
          .flip()
          .map((k, v) => mapper.call(ctx, k, v, this))
          .flip()
      )
    }
    override toJSON = qf.toObject
    override __toStringMapper = (v, k) => qu.quoteString(k) + ": " + qu.quoteString(v)
  }

  export class Indexed<V> extends Collection<number, V> implements qt.Collection.Indexed<V> {
    static override create<V>(x?: Iterable<V> | ArrayLike<V>): qt.Collection.Indexed<V> {
      return qu.isIndexed(x) ? x : new IndexedSeq(x)
    }
    [qu.IS_INDEXED_SYMBOL] = true;
    [qu.IS_ORDERED_SYMBOL] = true
    override toKeyedSeq() {
      return new qo.ToKeyedSequence(this, false)
    }
    override filter(predicate, ctx) {
      return qo.reify(this, qo.filterFactory(this, predicate, ctx, false))
    }
    findIndex(predicate, ctx) {
      const entry = this.findEntry(predicate, ctx)
      return entry ? entry[0] : -1
    }
    indexOf(searchValue) {
      const key = this.keyOf(searchValue)
      return key === undefined ? -1 : key
    }
    lastIndexOf(searchValue) {
      const key = this.lastKeyOf(searchValue)
      return key === undefined ? -1 : key
    }
    override reverse() {
      return qo.reify(this, qo.reverseFactory(this, false))
    }
    override slice(begin, end) {
      return qo.reify(this, qo.sliceFactory(this, begin, end, false))
    }
    splice(index, removeNum /*, ...values*/) {
      const numArgs = arguments.length
      removeNum = Math.max(removeNum || 0, 0)
      if (numArgs === 0 || (numArgs === 2 && !removeNum)) {
        return this
      }
      index = qu.resolveBegin(index, index < 0 ? this.count() : this.size)
      const spliced = this.slice(0, index)
      return qo.reify(this, numArgs === 1 ? spliced : spliced.concat(qu.arrCopy(arguments, 2), this.slice(index + removeNum)))
    }
    findLastIndex(predicate, ctx) {
      const entry = this.findLastEntry(predicate, ctx)
      return entry ? entry[0] : -1
    }
    override first(v0) {
      return this.get(0, v0)
    }
    override flatten(depth) {
      return qo.reify(this, qo.flattenFactory(this, depth, false))
    }
    override get(index, v0) {
      index = qu.wrapIndex(this, index)
      return index < 0 || this.size === Infinity || (this.size !== undefined && index > this.size) ? v0 : this.find((_, key) => key === index, undefined, v0)
    }
    override has(index) {
      index = qu.wrapIndex(this, index)
      return index >= 0 && (this.size !== undefined ? this.size === Infinity || index < this.size : this.indexOf(index) !== -1)
    }
    interpose(separator) {
      return qo.reify(this, qo.interposeFactory(this, separator))
    }
    interleave(/*...collections*/) {
      const collections = [this].concat(qu.arrCopy(arguments))
      const zipped = qo.zipWithFactory(this.toSeq(), IndexedSeq.of, collections)
      const interleaved = zipped.flatten(true)
      if (zipped.size) {
        interleaved.size = zipped.size * collections.length
      }
      return qo.reify(this, interleaved)
    }
    override keySeq() {
      return Range(0, this.size)
    }
    override last(v0) {
      return this.get(-1, v0)
    }
    override skipWhile(predicate, ctx) {
      return qo.reify(this, qo.skipWhileFactory(this, predicate, ctx, false))
    }
    zip(/*, ...collections */) {
      const collections = [this].concat(qu.arrCopy(arguments))
      return qo.reify(this, qo.zipWithFactory(this, defaultZipper, collections))
    }
    zipAll(/*, ...collections */) {
      const collections = [this].concat(qu.arrCopy(arguments))
      return qo.reify(this, qo.zipWithFactory(this, defaultZipper, collections, true))
    }
    zipWith(f /*, ...collections */) {
      const collections = qu.arrCopy(arguments)
      collections[0] = this
      return qo.reify(this, qo.zipWithFactory(this, f, collections))
    }
  }

  export class Set<K, V> extends Collection<K, V> implements qt.Collection.Set<K> {
    static override create<K>(x?: Iterable<K> | ArrayLike<K>): qt.Collection.Set<K> {
      return qu.isCollection(x) && !qu.isAssociative(x) ? x : new SetSeq(x)
    }
    override get(value, v0) {
      return this.has(value) ? value : v0
    }
    override includes(value) {
      return this.has(value)
    }
    override keySeq() {
      return this.valueSeq()
    }
    override has = this.includes
    override contains = this.includes
    override keys = this.values
  }
}

qu.mixin(KeyedSeq, Collection.Keyed.prototype)
qu.mixin(IndexedSeq, Collection.Indexed.prototype)
qu.mixin(SetSeq, Collection.Set.prototype)

function reduce(collection, reducer, reduction, ctx, useFirst, reverse) {
  qu.assertNotInfinite(collection.size)
  collection.__iterate((v, k, c) => {
    if (useFirst) {
      useFirst = false
      reduction = v
    } else {
      reduction = reducer.call(ctx, reduction, v, k, c)
    }
  }, reverse)
  return reduction
}

function keyMapper(v, k) {
  return k
}

function entryMapper(v, k) {
  return [k, v]
}

function not(predicate) {
  return function () {
    return !predicate.apply(this, arguments)
  }
}

function neg(predicate) {
  return function () {
    return -predicate.apply(this, arguments)
  }
}

function defaultZipper() {
  return qu.arrCopy(arguments)
}

function defaultNegComparator(a, b) {
  return a < b ? 1 : a > b ? -1 : 0
}

function hashCollection(collection) {
  if (collection.size === Infinity) {
    return 0
  }
  const ordered = qu.isOrdered(collection)
  const keyed = qu.isKeyed(collection)
  let h = ordered ? 1 : 0
  const size = collection.__iterate(
    keyed
      ? ordered
        ? (v, k) => {
            h = (31 * h + hashMerge(qu.hash(v), qu.hash(k))) | 0
          }
        : (v, k) => {
            h = (h + hashMerge(qu.hash(v), qu.hash(k))) | 0
          }
      : ordered
      ? v => {
          h = (31 * h + qu.hash(v)) | 0
        }
      : v => {
          h = (h + qu.hash(v)) | 0
        }
  )
  return murmurHashOfSize(size, h)
}

function murmurHashOfSize(size, h) {
  h = qu.imul(h, 0xcc9e2d51)
  h = qu.imul((h << 15) | (h >>> -15), 0x1b873593)
  h = qu.imul((h << 13) | (h >>> -13), 5)
  h = ((h + 0xe6546b64) | 0) ^ size
  h = qu.imul(h ^ (h >>> 16), 0x85ebca6b)
  h = qu.imul(h ^ (h >>> 13), 0xc2b2ae35)
  h = qu.smi(h ^ (h >>> 16))
  return h
}

function hashMerge(a, b) {
  return (a ^ (b + 0x9e3779b9 + (a << 6) + (a >> 2))) | 0 // int
}
