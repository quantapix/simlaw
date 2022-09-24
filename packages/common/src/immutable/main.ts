/* eslint-disable @typescript-eslint/no-namespace */
import { List } from "./list.js"
import { Map } from "./map.js"
import { OrderedMap, OrderedSet } from "./ordered.js"
import { Range } from "./range.js"
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
    return this.toSeqKeyed().reverse().find(predicate, ctx, v0)
  }
  findLastEntry(predicate, ctx, v0) {
    return this.toSeqKeyed().reverse().findEntry(predicate, ctx, v0)
  }
  findLastKey(predicate, ctx) {
    return this.toSeqKeyed().reverse().findKey(predicate, ctx)
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
    return this.toSeq().map(keyMapper).toSeqIndexed()
  }
  last(v0) {
    return this.toSeq().reverse().first(v0)
  }
  lastKeyOf(searchValue) {
    return this.toSeqKeyed().reverse().keyOf(searchValue)
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
  toSeqIndexed() {
    return new qo.ToSeqIndexed(this)
  }
  toJS() {
    return qu.toJS(this)
  }
  toSeqKeyed() {
    return new qo.ToSeqKeyed(this, true)
  }
  toList() {
    return List(qu.isKeyed(this) ? this.valueSeq() : this)
  }
  toMap() {
    return Map(this.toSeqKeyed())
  }
  toObject: qf.toObject
  toOrderedMap() {
    return OrderedMap(this.toSeqKeyed())
  }
  toOrderedSet() {
    return OrderedSet(qu.isKeyed(this) ? this.valueSeq() : this)
  }
  toSeq() {
    return qu.isIndexed(this) ? this.toSeqIndexed() : qu.isKeyed(this) ? this.toSeqKeyed() : this.toSeqSet()
  }
  toSet() {
    return Set(qu.isKeyed(this) ? this.valueSeq() : this)
  }
  toSeqSet() {
    return new qo.ToSeqSet(this)
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
    return this.toSeqIndexed()
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
    const entriesSequence = collection.toSeq().map(entryMapper).toSeqIndexed()
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
      return qu.isKeyed(x) ? x : new Seq.Keyed(x)
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
      return qu.isIndexed(x) ? x : new Seq.Indexed(x)
    }
    [qu.IS_INDEXED_SYMBOL] = true;
    [qu.IS_ORDERED_SYMBOL] = true
    override toSeqKeyed() {
      return new qo.ToSeqKeyed(this, false)
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
      const zipped = qo.zipWithFactory(this.toSeq(), Seq.Indexed.of, collections)
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

  export class Set<K> extends Collection<K, K> implements qt.Collection.Set<K> {
    static override create<K>(x?: Iterable<K> | ArrayLike<K>): qt.Collection.Set<K> {
      return qu.isCollection(x) && !qu.isAssociative(x) ? x : new Seq.Set(x)
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

export class Seq<K, V> extends Collection<K, V> implements qt.Seq<K, V> {
  static isSeq = qu.isSeq

  static override create<T extends Seq<unknown, unknown>>(seq: T): T
  static override create<K, V>(x: qt.Collection.Keyed<K, V>): Seq.Keyed<K, V>
  static override create<T>(x: qt.Collection.Indexed<T> | Iterable<T> | ArrayLike<T>): Seq.Indexed<T>
  static override create<T>(x: qt.Collection.Set<T>): Seq.Set<T>
  static override create<V>(x: qt.Dict<V>): Seq.Keyed<string, V>
  static override create<K = unknown, V = unknown>(): Seq<K, V>
  static override create(x?: unknown): unknown {
    return x === undefined || x === null ? emptySeq() : qu.isImmutable(x) ? x.toSeq() : seqFromValue(x)
  }

  [qu.IS_SEQ_SYMBOL] = true

  override toSeq() {
    return this
  }
  override toString() {
    return this.__toString("Seq {", "}")
  }
  cacheResult() {
    if (!this._cache && this.__iterateUncached) {
      this._cache = this.entrySeq().toArray()
      this.size = this._cache.length
    }
    return this
  }
  __iterate(fn, reverse) {
    const cache = this._cache
    if (cache) {
      const size = cache.length
      let i = 0
      while (i !== size) {
        const entry = cache[reverse ? size - ++i : i++]
        if (fn(entry[1], entry[0], this) === false) break
      }
      return i
    }
    return this.__iterateUncached(fn, reverse)
  }
  __iterator(type, reverse) {
    const cache = this._cache
    if (cache) {
      const size = cache.length
      let i = 0
      return new qu.Iterator(() => {
        if (i === size) return qu.iteratorDone()
        const entry = cache[reverse ? size - ++i : i++]
        return qu.iteratorValue(type, entry[0], entry[1])
      })
    }
    return this.__iteratorUncached(type, reverse)
  }
}

export namespace Seq {
  export class Keyed<K, V> extends Seq<K, V> implements Collection.Keyed<K, V> {
    static override create<K, V>(x?: Iterable<[K, V]>): Seq.Keyed<K, V>
    static override create<V>(x: qt.Dict<V>): Seq.Keyed<string, V>
    static override create(x?: any): any {
      return x === undefined || x === null ? emptySeq().toSeqKeyed() : qu.isCollection(x) ? (qu.isKeyed(x) ? x.toSeq() : x.fromEntrySeq()) : qu.isRecord(x) ? x.toSeq() : seqKeyedFrom(x)
    }
    override toSeqKeyed() {
      return this
    }
  }
  export class Indexed<V> extends Seq<number, V> implements Collection.Indexed<V> {
    static override create<T>(x?: Iterable<T> | ArrayLike<T>): Seq.Indexed<T> {
      return x === undefined || x === null ? emptySeq() : qu.isCollection(x) ? (qu.isKeyed(x) ? x.entrySeq() : x.toSeqIndexed()) : qu.isRecord(x) ? x.toSeq().entrySeq() : seqIndexedFrom(x)
    }
    static of<T>(...xs: Array<T>): Seq.Indexed<T> {
      return new Seq.Indexed(...xs)
    }
    override toSeqIndexed() {
      return this
    }
    override toString() {
      return this.__toString("Seq [", "]")
    }
  }
  export class Set<K> extends Seq<K, K> implements Collection.Set<K> {
    static override create<T>(x?: Iterable<T> | ArrayLike<T>): Seq.Set<T> {
      return (qu.isCollection(x) && !qu.isAssociative(x) ? x : new Seq.Indexed(x)).toSeqSet()
    }
    static of<T>(...xs: Array<T>): Seq.Set<T> {
      return new Seq.Set(...xs)
    }
    override toSeqSet() {
      return this
    }
  }

  namespace Set {}
}

export class ArraySeq<V> extends Seq.Indexed<V> {
  constructor(array) {
    super()
    this._array = array
    this.size = array.length
  }
  get(index, notSetValue) {
    return this.has(index) ? this._array[qu.wrapIndex(this, index)] : notSetValue
  }
  __iterate(fn, reverse) {
    const array = this._array
    const size = array.length
    let i = 0
    while (i !== size) {
      const ii = reverse ? size - ++i : i++
      if (fn(array[ii], ii, this) === false) {
        break
      }
    }
    return i
  }
  __iterator(type, reverse) {
    const array = this._array
    const size = array.length
    let i = 0
    return new qu.Iterator(() => {
      if (i === size) {
        return qu.iteratorDone()
      }
      const ii = reverse ? size - ++i : i++
      return qu.iteratorValue(type, ii, array[ii])
    })
  }
}

class ObjectSeq<K, V> extends Seq.Keyed<K, V> {
  [qu.IS_ORDERED_SYMBOL] = true
  constructor(x) {
    super()
    const keys = Object.keys(x).concat(Object.getOwnPropertySymbols ? Object.getOwnPropertySymbols(x) : [])
    this._object = x
    this._keys = keys
    this.size = keys.length
  }
  get(key, notSetValue) {
    if (notSetValue !== undefined && !this.has(key)) return notSetValue
    return this._object[key]
  }
  has(key) {
    return qu.hasOwnProperty.call(this._object, key)
  }
  __iterate(f, reverse) {
    const object = this._object
    const ks = this._keys
    const size = ks.length
    let i = 0
    while (i !== size) {
      const k = ks[reverse ? size - ++i : i++]
      if (f(object[k], k, this) === false) break
    }
    return i
  }
  __iterator(type, reverse) {
    const object = this._object
    const ks = this._keys
    const size = ks.length
    let i = 0
    return new qu.Iterator(() => {
      if (i === size) return qu.iteratorDone()
      const k = ks[reverse ? size - ++i : i++]
      return qu.iteratorValue(type, k, object[k])
    })
  }
}

class CollectionSeq<V> extends Seq.Indexed<V> {
  constructor(x) {
    super()
    this._collection = x
    this.size = x.length || x.size
  }
  __iterateUncached(fn, reverse) {
    if (reverse) return this.cacheResult().__iterate(fn, reverse)
    const collection = this._collection
    const iterator = qu.getIterator(collection)
    let iterations = 0
    if (qu.isIterator(iterator)) {
      let step
      while (!(step = iterator.next()).done) {
        if (fn(step.value, iterations++, this) === false) break
      }
    }
    return iterations
  }
  __iteratorUncached(type, reverse) {
    if (reverse) return this.cacheResult().__iterator(type, reverse)
    const collection = this._collection
    const iterator = qu.getIterator(collection)
    if (!qu.isIterator(iterator)) return new qu.Iterator(qu.iteratorDone)
    let iterations = 0
    return new qu.Iterator(() => {
      const step = iterator.next()
      return step.done ? step : qu.iteratorValue(type, iterations++, step.value)
    })
  }
}

qu.mixin(Seq.Keyed, Collection.Keyed.prototype)
qu.mixin(Seq.Indexed, Collection.Indexed.prototype)
qu.mixin(Seq.Set, Collection.Set.prototype)

export class Range<V> extends Seq.Indexed<V> {
  static override create(beg?: number, end?: number, step?: number): Seq.Indexed<number> {
    if (!(this instanceof Range)) return new Range(beg, end, step)
    qu.invariant(step !== 0, "Cannot step a Range by 0")
    beg = beg || 0
    if (end === undefined) end = Infinity
    step = step === undefined ? 1 : Math.abs(step)
    if (end < beg) step = -step
    this._start = beg
    this._end = end
    this._step = step
    this.size = Math.max(0, Math.ceil((end - beg) / step - 1) + 1)
    if (this.size === 0) {
      if (EMPTY_RANGE) return EMPTY_RANGE
      EMPTY_RANGE = this
    }
  }
  override toString() {
    if (this.size === 0) return "Range []"
    return "Range [ " + this._start + "..." + this._end + (this._step !== 1 ? " by " + this._step : "") + " ]"
  }
  override get(index, notSetValue) {
    return this.has(index) ? this._start + qu.wrapIndex(this, index) * this._step : notSetValue
  }
  override includes(searchValue) {
    const possibleIndex = (searchValue - this._start) / this._step
    return possibleIndex >= 0 && possibleIndex < this.size && possibleIndex === Math.floor(possibleIndex)
  }
  override slice(begin, end) {
    if (qu.wholeSlice(begin, end, this.size)) return this
    begin = qu.resolveBegin(begin, this.size)
    end = qu.resolveEnd(end, this.size)
    if (end <= begin) return new Range(0, 0)
    return new Range(this.get(begin, this._end), this.get(end, this._end), this._step)
  }
  indexOf(searchValue) {
    const offsetValue = searchValue - this._start
    if (offsetValue % this._step === 0) {
      const index = offsetValue / this._step
      if (index >= 0 && index < this.size) return index
    }
    return -1
  }
  lastIndexOf(searchValue) {
    return this.indexOf(searchValue)
  }
  override __iterate(fn, reverse) {
    const size = this.size
    const step = this._step
    let value = reverse ? this._start + (size - 1) * step : this._start
    let i = 0
    while (i !== size) {
      if (fn(value, reverse ? size - ++i : i++, this) === false) break
      value += reverse ? -step : step
    }
    return i
  }
  override __iterator(type, reverse) {
    const size = this.size
    const step = this._step
    let value = reverse ? this._start + (size - 1) * step : this._start
    let i = 0
    return new qu.Iterator(() => {
      if (i === size) return qu.iteratorDone()
      const v = value
      value += reverse ? -step : step
      return qu.iteratorValue(type, reverse ? size - ++i : i++, v)
    })
  }
  override equals(other) {
    return other instanceof Range ? this._start === other._start && this._end === other._end && this._step === other._step : qu.deepEqual(this, other)
  }
}

let EMPTY_RANGE

export class Repeat<V> extends Seq.Indexed<V> {
  static override create<T>(x: T, times?: number): Seq.Indexed<T> {
    if (!(this instanceof Repeat)) return new Repeat(x, times)
    this._value = x
    this.size = times === undefined ? Infinity : Math.max(0, times)
    if (this.size === 0) {
      if (EMPTY_REPEAT) return EMPTY_REPEAT
      EMPTY_REPEAT = this
    }
  }
  override toString() {
    if (this.size === 0) return "Repeat []"
    return "Repeat [ " + this._value + " " + this.size + " times ]"
  }
  override get(index, notSetValue) {
    return this.has(index) ? this._value : notSetValue
  }
  override includes(searchValue) {
    return qu.is(this._value, searchValue)
  }
  override slice(begin, end) {
    const size = this.size
    return qu.wholeSlice(begin, end, size) ? this : new Repeat(this._value, qu.resolveEnd(end, size) - qu.resolveBegin(begin, size))
  }
  override reverse() {
    return this
  }
  indexOf(searchValue) {
    if (qu.is(this._value, searchValue)) return 0
    return -1
  }
  lastIndexOf(searchValue) {
    if (qu.is(this._value, searchValue)) return this.size
    return -1
  }
  override __iterate(fn, reverse) {
    const size = this.size
    let i = 0
    while (i !== size) {
      if (fn(this._value, reverse ? size - ++i : i++, this) === false) break
    }
    return i
  }
  override __iterator(type, reverse) {
    const size = this.size
    let i = 0
    return new qu.Iterator(() => (i === size ? qu.iteratorDone() : qu.iteratorValue(type, reverse ? size - ++i : i++, this._value)))
  }
  override equals(other) {
    return other instanceof Repeat ? qu.is(this._value, other._value) : qu.deepEqual(other)
  }
}

let EMPTY_REPEAT

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

let EMPTY_SEQ

function emptySeq() {
  return EMPTY_SEQ || (EMPTY_SEQ = new ArraySeq([]))
}

export function seqKeyedFrom(x) {
  const y = maybeSeqIndexedFrom(x)
  if (!y) {
    if (typeof x === "object") return new ObjectSeq(x)
    throw new TypeError("Expected Array or collection object of [k, v] entries, or keyed object: " + x)
  }
  return y.fromEntrySeq()
}

export function seqIndexedFrom(x) {
  const y = maybeSeqIndexedFrom(x)
  if (!y) throw new TypeError("Expected Array or collection object of values: " + x)
  return y
}

function seqFromValue(x) {
  const y = maybeSeqIndexedFrom(x)
  if (!y) {
    if (typeof x === "object") return new ObjectSeq(x)
    throw new TypeError("Expected Array or collection object of values, or keyed object: " + x)
  }
  return qu.isEntriesIterable(x) ? y.fromEntrySeq() : qu.isKeysIterable(x) ? y.toSeqSet() : y
}

function maybeSeqIndexedFrom(x) {
  return qu.isArrayLike(x) ? new ArraySeq(x) : qu.hasIterator(x) ? new CollectionSeq(x) : undefined
}
