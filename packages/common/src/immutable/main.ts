import { List } from "./list.js"
import { Map } from "./map.js"
import { OrderedMap, OrderedSet } from "./ordered.js"
import { Set } from "./set.js"
import * as qf from "./functions.js"
import * as qo from "./operations.js"
import * as qu from "./utils.js"
import type * as qt from "./types.js"

abstract class Base {
  __toStringMapper = qu.quoteString
  __iterate(f: Function, reverse?: boolean): number {
    return
  }
  __iterator(m: qu.Iter.Mode, reverse?: boolean): qu.Iter {
    return
  }
}

export class Collection<K, V> extends Base implements qt.Collection<K, V> {
  static isAssociative = qu.isAssociative
  static isIndexed = qu.isIndexed
  static isKeyed = qu.isKeyed
  static isOrdered = qu.isOrdered

  static create<T = unknown, U = unknown>(): Collection<T, U>
  static create<T extends Collection<unknown, unknown>>(x: T): T
  static create<T>(x: Iterable<T> | ArrayLike<T>): qt.Collection.Indexed<T>
  static create<T>(x: qt.Dict<T>): qt.Collection.Keyed<string, T>
  static create(x?: any): any {
    return qu.isCollection(x) ? x : Seq.create(x)
  }

  [qu.IS_COLLECTION_SYMBOL] = true;
  [Symbol.iterator] = this.values
  readonly size?: number | undefined
  _cache?: any[]

  butLast() {
    return this.slice(0, -1)
  }
  concat(...xs: unknown[]) {
    return qo.reify(this, qo.concat(this, xs))
  }
  contains = this.includes
  count(f?: Function, ctx?: unknown): number {
    return qu.ensureSize(f ? this.toSeq().filter(f, ctx) : this)
  }
  countBy(f: Function, ctx?: unknown) {
    const y = Map.create().asMutable()
    this.__iterate((v, k) => {
      y.update(f.call(ctx, v, k, this), 0, x => x + 1)
    })
    return y.asImmutable()
  }
  entries() {
    return this.__iterator(qu.ITERATE_ENTRIES)
  }
  entrySeq() {
    if (this._cache) return new ArraySeq(this._cache)
    const y = this.toSeq().map(entryMapper).toSeqIndexed()
    y.fromEntrySeq = () => this.toSeq()
    return y
  }
  equals(x: unknown) {
    return qu.deepEqual(this, x)
  }
  every(f: Function, ctx?: unknown) {
    qu.assertNotInfinite(this.size)
    let y = true
    this.__iterate((v, k, c) => {
      if (!f.call(ctx, v, k, c)) {
        y = false
        return false
      }
    })
    return y
  }
  filter(f: Function, ctx?: unknown) {
    return qo.reify(this, qo.filter(this, f, ctx, true))
  }
  filterNot(f: Function, ctx?: unknown) {
    return this.filter(not(f), ctx)
  }
  find(f: Function, ctx?: unknown, v0?: unknown) {
    const y = this.findEntry(f, ctx)
    return y ? y[1] : v0
  }
  findEntry(f: Function, ctx?: unknown, v0?: V) {
    let y = v0
    this.__iterate((v, k, c) => {
      if (f.call(ctx, v, k, c)) {
        y = [k, v]
        return false
      }
    })
    return y
  }
  findKey(f: Function, ctx?: unknown) {
    const y = this.findEntry(f, ctx)
    return y && y[0]
  }
  findLast(f: Function, ctx?: unknown, v0?: unknown) {
    return this.toSeqKeyed().reverse().find(f, ctx, v0)
  }
  findLastEntry(f: Function, ctx?: unknown, v0?: unknown) {
    return this.toSeqKeyed().reverse().findEntry(f, ctx, v0)
  }
  findLastKey(f: Function, ctx?: unknown) {
    return this.toSeqKeyed().reverse().findKey(f, ctx)
  }
  first(v0?: unknown) {
    return this.find(qu.returnTrue, null, v0)
  }
  flatMap(f: Function, ctx?: unknown) {
    return qo.reify(this, qo.flatMapFactory(this, f, ctx))
  }
  flatten(depth?: number) {
    return qo.reify(this, qo.flattenFactory(this, depth, true))
  }
  forEach(f: (v: V, k: K, iter: this) => unknown, ctx?: unknown): number {
    qu.assertNotInfinite(this.size)
    return this.__iterate(ctx ? f.bind(ctx) : f)
  }
  fromEntrySeq() {
    return new qo.FromEntrySeq(this)
  }
  get(k: unknown, v0?: unknown) {
    return this.find((_, x) => qu.is(x, k), undefined, v0)
  }
  getIn = (x: any, v0?: unknown) => qf.getIn(this, x, v0)
  groupBy(f: Function, ctx?: unknown) {
    const isKeyed = qu.isKeyed(this)
    const y = (qu.isOrdered(this) ? OrderedMap.create() : Map.create()).asMutable()
    this.__iterate((v, k) => {
      y.update(f.call(ctx, v, k, this), x => ((x = x || []), x.push(isKeyed ? [k, v] : v), x))
    })
    const coerce = collectionClass(this)
    return y.map(x => qo.reify(this, coerce(x))).asImmutable()
  }
  has(k: unknown) {
    return this.get(k, qu.NOT_SET) !== qu.NOT_SET
  }
  hashCode() {
    return this.__hash || (this.__hash = hashCollection(this))
  }
  hasIn = (x: any) => qf.hasIn(this, x)
  includes(v: unknown) {
    return this.some(x => qu.is(x, v))
  }
  isEmpty() {
    return this.size !== undefined ? this.size === 0 : !this.some(() => true)
  }
  isSubset(x: any) {
    x = typeof x.includes === "function" ? x : Collection.create(x)
    return this.every(x2 => x.includes(x2))
  }
  isSuperset(x: any) {
    x = typeof x.isSubset === "function" ? x : Collection.create(x)
    return x.isSubset(this)
  }
  join(sep: string) {
    qu.assertNotInfinite(this.size)
    sep = sep !== undefined ? "" + sep : ","
    let y = ""
    let isFirst = true
    this.__iterate(v => {
      isFirst ? (isFirst = false) : (y += sep)
      y += v !== null && v !== undefined ? v.toString() : ""
    })
    return y
  }
  keyOf(v: unknown) {
    return this.findKey(x => qu.is(x, v))
  }
  _keys() {
    return this.__iterator(qu.ITERATE_KEYS)
  }
  keySeq() {
    return this.toSeq().map(keyMapper).toSeqIndexed()
  }
  last(v0?: unknown) {
    return this.toSeq().reverse().first(v0)
  }
  lastKeyOf(v: unknown) {
    return this.toSeqKeyed().reverse().keyOf(v)
  }
  map(f: Function, ctx?: unknown) {
    return qo.reify(this, qo.mapFactory(this, f, ctx))
  }
  max(c?: unknown) {
    return qo.maxFactory(this, c)
  }
  maxBy(f: Function, c?: unknown) {
    return qo.maxFactory(this, c, f)
  }
  min(c?: unknown) {
    return qo.maxFactory(this, c ? neg(c) : defaultNegComparator)
  }
  minBy(f: Function, c?: unknown) {
    return qo.maxFactory(this, c ? neg(c) : defaultNegComparator, f)
  }
  reduce(f: Function, y0?: unknown, ctx?: unknown) {
    return reduce(this, f, y0, ctx, arguments.length < 2, false)
  }
  reduceRight(f: Function, y0?: unknown, ctx?: unknown) {
    return reduce(this, f, y0, ctx, arguments.length < 2, true)
  }
  rest() {
    return this.slice(1)
  }
  reverse() {
    return qo.reify(this, qo.reverseFactory(this, true))
  }
  skip(x: number) {
    return x === 0 ? this : this.slice(Math.max(0, x))
  }
  skipLast(x: number) {
    return x === 0 ? this : this.slice(0, -Math.max(0, x))
  }
  skipUntil(f: Function, ctx?: unknown) {
    return this.skipWhile(not(f), ctx)
  }
  skipWhile(f: Function, ctx?: unknown) {
    return qo.reify(this, qo.skipWhileFactory(this, f, ctx, true))
  }
  slice(beg?: number, end?: number): this {
    return qo.reify(this, qo.sliceFactory(this, beg, end, true))
  }
  some(f: Function, ctx?: unknown) {
    return !this.every(not(f), ctx)
  }
  sort(c?: unknown) {
    return qo.reify(this, qo.sortFactory(this, c))
  }
  sortBy(f: Function, c?: unknown) {
    return qo.reify(this, qo.sortFactory(this, c, f))
  }
  take(x: number) {
    return this.slice(0, Math.max(0, x))
  }
  takeLast(x: number) {
    return this.slice(-Math.max(0, x))
  }
  takeUntil(f: Function, ctx?: unknown) {
    return this.takeWhile(not(f), ctx)
  }
  takeWhile(f: Function, ctx?: unknown) {
    return qo.reify(this, qo.takeWhileFactory(this, f, ctx))
  }
  toArray() {
    qu.assertNotInfinite(this.size)
    const y = new Array(this.size || 0)
    const useTuples = qu.isKeyed(this)
    let i = 0
    this.__iterate((v, k) => {
      y[i++] = useTuples ? [k, v] : v
    })
    return y
  }
  toSeqIndexed() {
    return new qo.ToSeqIndexed(this)
  }
  toJS() {
    return qu.toJS(this)
  }
  toJSON = this.toArray
  toSeqKeyed() {
    return new qo.ToSeqKeyed(this, true)
  }
  toList() {
    return List.create(qu.isKeyed(this) ? this.valueSeq() : this)
  }
  toMap() {
    return Map.create(this.toSeqKeyed())
  }
  toObject = qf.toObject
  toOrderedMap() {
    return OrderedMap.create(this.toSeqKeyed())
  }
  toOrderedSet() {
    return OrderedSet.create(qu.isKeyed(this) ? this.valueSeq() : this)
  }
  toSeq() {
    return qu.isIndexed(this) ? this.toSeqIndexed() : qu.isKeyed(this) ? this.toSeqKeyed() : this.toSeqSet()
  }
  toSet() {
    return Set.create(qu.isKeyed(this) ? this.valueSeq() : this)
  }
  toSeqSet() {
    return new qo.ToSeqSet(this)
  }
  toStack() {
    return Stack.create(qu.isKeyed(this) ? this.valueSeq() : this)
  }
  toString() {
    return "[Collection]"
  }
  update(f: Function) {
    return f(this)
  }
  values(): IterableIterator<V> {
    return this.__iterator(qu.ITERATE_VALUES)
  }
  valueSeq() {
    return this.toSeqIndexed()
  }
  toSource = () => {
    return this.toString()
  }
  inspect = this.toSource
  chain = this.flatMap
  __toString(head, tail) {
    if (this.size === 0) return head + tail
    return head + " " + this.toSeq().map(this.__toStringMapper).join(", ") + " " + tail
  }
}

export namespace Collection {
  export class Keyed<K, V> extends Collection<K, V> implements qt.Collection.Keyed<K, V> {
    static override create<K, V>(x?: Iterable<[K, V]>): qt.Collection.Keyed<K, V>
    static override create<V>(x: qt.Dict<V>): qt.Collection.Keyed<string, V>
    static override create(x?: any): any {
      return qu.isKeyed(x) ? x : Seq.Keyed.create(x)
    }
    [Symbol.iterator] = this.entries;
    [qu.IS_KEYED_SYMBOL] = true
    flip() {
      return qo.reify(this, qo.flip(this))
    }
    mapEntries(f: Function, ctx?: unknown) {
      let i = 0
      return qo.reify(
        this,
        this.toSeq()
          .map((v, k) => f.call(ctx, [k, v], i++, this))
          .fromEntrySeq()
      )
    }
    mapKeys(f: Function, ctx?: unknown) {
      return qo.reify(
        this,
        this.toSeq()
          .flip()
          .map((k, v) => f.call(ctx, k, v, this))
          .flip()
      )
    }
    override toJSON = qf.toObject
    override __toStringMapper = (v, k) => qu.quoteString(k) + ": " + qu.quoteString(v)
  }

  export class Indexed<V> extends Collection<number, V> implements qt.Collection.Indexed<V> {
    static override create<V>(x?: Iterable<V> | ArrayLike<V>): qt.Collection.Indexed<V>
    static override create(x?: any): any {
      return qu.isIndexed(x) ? x : Seq.Indexed.create(x)
    }
    [qu.IS_INDEXED_SYMBOL] = true;
    [qu.IS_ORDERED_SYMBOL] = true
    override toSeqKeyed() {
      return new qo.ToSeqKeyed(this, false)
    }
    override filter(f: Function, ctx?: unknown) {
      return qo.reify<number, V>(this, qo.filter(this, f, ctx, false))
    }
    findIndex(f: Function, ctx?: unknown) {
      const y = this.findEntry(f, ctx)
      return y ? y[0] : -1
    }
    indexOf(v: unknown) {
      const y = this.keyOf(v)
      return y === undefined ? -1 : y
    }
    lastIndexOf(v: unknown) {
      const y = this.lastKeyOf(v)
      return y === undefined ? -1 : y
    }
    override reverse() {
      return qo.reify(this, qo.reverseFactory(this, false))
    }
    override slice(beg?: number, end?: number): this {
      return qo.reify(this, qo.sliceFactory(this, beg, end, false))
    }
    splice(index, removeNum, x: unknown) {
      const numArgs = arguments.length
      removeNum = Math.max(removeNum || 0, 0)
      if (numArgs === 0 || (numArgs === 2 && !removeNum)) return this
      index = qu.resolveBegin(index, index < 0 ? this.count() : this.size)
      const spliced = this.slice(0, index)
      return qo.reify(this, numArgs === 1 ? spliced : spliced.concat(qu.arrCopy(x, 2), this.slice(index + removeNum)))
    }
    findLastIndex(f: Function, ctx?: unknown) {
      const y = this.findLastEntry(f, ctx)
      return y ? y[0] : -1
    }
    override first(v0?: unknown) {
      return this.get(0, v0)
    }
    override flatten(depth?: number) {
      return qo.reify(this, qo.flattenFactory(this, depth, false))
    }
    override get(i: number, v0?: unknown) {
      i = qu.wrapIndex(this, i)
      return i < 0 || this.size === Infinity || (this.size !== undefined && i > this.size)
        ? v0
        : this.find((_, k) => k === i, undefined, v0)
    }
    override has(i: number) {
      i = qu.wrapIndex(this, i)
      return i >= 0 && (this.size !== undefined ? this.size === Infinity || i < this.size : this.indexOf(i) !== -1)
    }
    interpose(sep: string) {
      return qo.reify(this, qo.interposeFactory(this, sep))
    }
    interleave(x: unknown) {
      const collections = [this].concat(qu.arrCopy(x))
      const zipped = qo.zipWithFactory(this.toSeq(), Seq.Indexed.of, collections)
      const interleaved = zipped.flatten(true)
      if (zipped.size) interleaved.size = zipped.size * collections.length
      return qo.reify(this, interleaved)
    }
    override keySeq() {
      return Range.create(0, this.size)
    }
    override last(v0?: unknown) {
      return this.get(-1, v0)
    }
    override skipWhile(f: Function, ctx?: unknown) {
      return qo.reify(this, qo.skipWhileFactory(this, f, ctx, false))
    }
    zip(...xs: unknown[]) {
      const ys = [this].concat(qu.arrCopy(xs))
      return qo.reify(this, qo.zipWithFactory(this, defaultZipper, ys))
    }
    zipAll(...xs: unknown[]) {
      const ys = [this].concat(qu.arrCopy(xs))
      return qo.reify(this, qo.zipWithFactory(this, defaultZipper, ys, true))
    }
    zipWith(f: Function, ...xs: unknown[]) {
      const ys = qu.arrCopy(xs)
      ys[0] = this
      return qo.reify(this, qo.zipWithFactory(this, f, ys))
    }
  }

  export class Set<K> extends Collection<K, K> implements qt.Collection.Set<K> {
    static override create<K>(x?: Iterable<K> | ArrayLike<K>): qt.Collection.Set<K>
    static override create(x?: any): any {
      return qu.isCollection(x) && !qu.isAssociative(x) ? x : Seq.Set.create(x)
    }
    override get(v: K, v0?: K) {
      return this.has(v) ? v : v0
    }
    override includes(v: K) {
      return this.has(v)
    }
    override keySeq() {
      return this.valueSeq()
    }
    override has = this.includes
    override contains = this.includes
    override _keys = this.values
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
  static override create(x?: any): any {
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
      this.size = this._cache!.length
    }
    return this
  }
  override __iterate(f: Function, reverse: boolean) {
    const xs = this._cache
    if (xs) {
      const n = xs.length
      let i = 0
      while (i !== n) {
        const x = xs[reverse ? n - ++i : i++]
        if (f(x[1], x[0], this) === false) break
      }
      return i
    }
    return this.__iterateUncached(f, reverse)
  }
  override __iterator(m: qu.Iter.Mode, reverse: boolean) {
    const xs = this._cache
    if (xs) {
      const n = xs.length
      let i = 0
      return new qu.Iter(() => {
        if (i === n) return qu.Iter.done()
        const x = xs[reverse ? n - ++i : i++]
        return qu.Iter.value(m, x[0], x[1])
      })
    }
    return this.__iteratorUncached(m, reverse)
  }
}

export namespace Seq {
  export class Keyed<K, V> extends Seq<K, V> implements Collection.Keyed<K, V> {
    static override create<K, V>(x?: Iterable<[K, V]>): Seq.Keyed<K, V>
    static override create<V>(x: qt.Dict<V>): Seq.Keyed<string, V>
    static override create(x?: any): any {
      return x === undefined || x === null
        ? emptySeq().toSeqKeyed()
        : qu.isCollection(x)
        ? qu.isKeyed(x)
          ? x.toSeq()
          : x.fromEntrySeq()
        : qu.isRecord(x)
        ? x.toSeq()
        : seqKeyedFrom(x)
    }
    override toSeqKeyed() {
      return this
    }
  }
  export class Indexed<V> extends Seq<number, V> implements Collection.Indexed<V> {
    static override create<T>(x?: Iterable<T> | ArrayLike<T>): Seq.Indexed<T>
    static override create(x?: any): any {
      return x === undefined || x === null
        ? emptySeq()
        : qu.isCollection(x)
        ? qu.isKeyed(x)
          ? x.entrySeq()
          : x.toSeqIndexed()
        : qu.isRecord(x)
        ? x.toSeq().entrySeq()
        : seqIndexedFrom(x)
    }
    static of<T>(...xs: Array<T>): Seq.Indexed<T> {
      return Seq.Indexed.create(...xs)
    }
    override toSeqIndexed() {
      return this
    }
    override toString() {
      return this.__toString("Seq [", "]")
    }
  }
  export class Set<K> extends Seq<K, K> implements Collection.Set<K> {
    static override create<T>(x?: Iterable<T> | ArrayLike<T>): Seq.Set<T>
    static override create(x?: any): any {
      return (qu.isCollection(x) && !qu.isAssociative(x) ? x : Seq.Indexed.create(x)).toSeqSet()
    }
    static of<T>(...xs: Array<T>): Seq.Set<T> {
      return new Seq.Set(...xs)
    }
    override toSeqSet() {
      return this
    }
  }
}

qu.mixin(Seq.Keyed, Collection.Keyed.prototype)
qu.mixin(Seq.Indexed, Collection.Indexed.prototype)
qu.mixin(Seq.Set, Collection.Set.prototype)

export class ArraySeq<V> extends Seq.Indexed<V> {
  constructor(private _base: any[]) {
    super()
    this.size = _base.length
  }
  override get(i: number, v0: unknown) {
    return this.has(i) ? this._base[qu.wrapIndex(this, i)] : v0
  }
  override __iterate(f: Function, reverse: boolean) {
    const x = this._base
    const n = x.length
    let i = 0
    while (i !== n) {
      const j = reverse ? n - ++i : i++
      if (f(x[j], j, this) === false) break
    }
    return i
  }
  override __iterator(m: qu.Iter.Mode, reverse: boolean) {
    const x = this._base
    const n = x.length
    let i = 0
    return new qu.Iter(() => {
      if (i === n) return qu.Iter.done()
      const j = reverse ? n - ++i : i++
      return qu.Iter.value(m, j, x[j])
    })
  }
}

class ObjectSeq<K, V> extends Seq.Keyed<K, V> {
  [qu.IS_ORDERED_SYMBOL] = true
  constructor(private _base: any) {
    super()
    const keys = Object.keys(_base).concat(Object.getOwnPropertySymbols(_base))
    this._keys = keys
    this.size = keys.length
  }
  override get(k: any, v0?: unknown) {
    if (v0 !== undefined && !this.has(k)) return v0
    return this._base[k]
  }
  override has(k: any) {
    return qu.hasOwnProperty.call(this._base, k)
  }
  override __iterate(f: Function, reverse: boolean) {
    const x = this._base
    const ks = this._keys
    const n = ks.length
    let i = 0
    while (i !== n) {
      const k = ks[reverse ? n - ++i : i++]!
      if (f(x[k], k, this) === false) break
    }
    return i
  }
  override __iterator(m: qu.Iter.Mode, reverse: boolean) {
    const x = this._base
    const ks = this._keys
    const n = ks.length
    let i = 0
    return new qu.Iter(() => {
      if (i === n) return qu.Iter.done()
      const k = ks[reverse ? n - ++i : i++]!
      return qu.Iter.value(m, k, x[k])
    })
  }
}

class CollectionSeq<V> extends Seq.Indexed<V> {
  constructor(private _base: any) {
    super()
    this.size = _base.length || _base.size
  }
  __iterateUncached(f: Function, reverse: boolean) {
    if (reverse) return this.cacheResult().__iterate(f, reverse)
    const x = this._base
    const iter = qu.getIterator(x)
    let y = 0
    if (qu.isIterator(iter)) {
      let i
      while (!(i = iter.next()).done) {
        if (f(i.value, y++, this) === false) break
      }
    }
    return y
  }
  __iteratorUncached(m: qu.Iter.Mode, reverse: boolean) {
    if (reverse) return this.cacheResult().__iterator(m, reverse)
    const x = this._base
    const iter = qu.getIterator(x)
    if (!qu.isIterator(iter)) return new qu.Iter(qu.Iter.done)
    let y = 0
    return new qu.Iter(() => {
      const i = iter.next()
      return i.done ? i : qu.Iter.value(m, y++, i.value)
    })
  }
}

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
  override __iterate(f: Function, reverse: boolean) {
    const size = this.size
    const step = this._step
    let value = reverse ? this._start + (size - 1) * step : this._start
    let y = 0
    while (y !== size) {
      if (f(value, reverse ? size - ++y : y++, this) === false) break
      value += reverse ? -step : step
    }
    return y
  }
  override __iterator(m: qu.Iter.Mode, reverse: boolean) {
    const n = this.size
    const step = this._step
    let value = reverse ? this._start + (n - 1) * step : this._start
    let y = 0
    return new qu.Iter(() => {
      if (y === n) return qu.Iter.done()
      const v = value
      value += reverse ? -step : step
      return qu.Iter.value(m, reverse ? n - ++y : y++, v)
    })
  }
  override equals(other) {
    return other instanceof Range
      ? this._start === other._start && this._end === other._end && this._step === other._step
      : qu.deepEqual(this, other)
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
    return qu.wholeSlice(begin, end, size)
      ? this
      : new Repeat(this._value, qu.resolveEnd(end, size) - qu.resolveBegin(begin, size))
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
  override __iterate(fn, reverse: boolean) {
    const size = this.size
    let i = 0
    while (i !== size) {
      if (fn(this._value, reverse ? size - ++i : i++, this) === false) break
    }
    return i
  }
  override __iterator(type, reverse: boolean) {
    const size = this.size
    let i = 0
    return new qu.Iter(() =>
      i === size ? qu.Iter.done() : qu.Iter.value(type, reverse ? size - ++i : i++, this._value)
    )
  }
  override equals(other) {
    return other instanceof Repeat ? qu.is(this._value, other._value) : qu.deepEqual(other)
  }
}

let EMPTY_REPEAT

function reduce(x, reducer, reduction, ctx, useFirst, reverse: boolean) {
  qu.assertNotInfinite(x.size)
  x.__iterate((v, k, c) => {
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

function not(f: Function, ...xs: unknown[]) {
  return function () {
    return !f.apply(this, ...xs)
  }
}

function neg(f: Function, ...xs: unknown[]) {
  return function () {
    return -f.apply(this, ...xs)
  }
}

function defaultZipper(...xs: unknown[]) {
  return qu.arrCopy(xs)
}

function defaultNegComparator(a, b) {
  return a < b ? 1 : a > b ? -1 : 0
}

function hashCollection<K, V>(x: Collection<K, V>) {
  if (x.size === Infinity) return 0
  const ordered = qu.isOrdered(x)
  const keyed = qu.isKeyed(x)
  let y = ordered ? 1 : 0
  const n = x.__iterate(
    keyed
      ? ordered
        ? (v: V, k: K) => {
            y = (31 * y + qu.mergeHash(qu.hash(v), qu.hash(k))) | 0
          }
        : (v: V, k: K) => {
            y = (y + qu.mergeHash(qu.hash(v), qu.hash(k))) | 0
          }
      : ordered
      ? (v: V) => {
          y = (31 * y + qu.hash(v)) | 0
        }
      : (v: V) => {
          y = (y + qu.hash(v)) | 0
        }
  )
  return qu.murmurHash(n, y)
}

let EMPTY_SEQ: Seq

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

export class Stack<V> extends Collection.Indexed<V> implements qt.Stack<V> {
  static isStack = qu.isStack
  static override create<V>(x?: Iterable<V> | ArrayLike<V>): Stack<V> {
    return x === undefined || x === null ? emptyStack() : qu.isStack(x) ? x : emptyStack().pushAll(x)
  }
  static of<V>(...xs: Array<V>): Stack<V> {
    return this(...xs)
  }
  [qu.IS_STACK_SYMBOL] = true
  override toString() {
    return this.__toString("Stack [", "]")
  }
  override get(index, notSetValue) {
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
    if (this.__owner) {
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
    if (this.__owner) {
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
    if (this.size === 0) return this
    if (this.__owner) {
      this.size = 0
      this._head = undefined
      this.__hash = undefined
      this.__altered = true
      return this
    }
    return emptyStack()
  }
  override slice(begin, end) {
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
    if (this.__owner) {
      this.size = newSize
      this._head = head
      this.__hash = undefined
      this.__altered = true
      return this
    }
    return makeStack(newSize, head)
  }
  __ensureOwner(owner) {
    if (owner === this.__owner) return this
    if (!owner) {
      if (this.size === 0) return emptyStack()
      this.__owner = owner
      this.__altered = false
      return this
    }
    return makeStack(this.size, this._head, owner, this.__hash)
  }
  __iterate(f: Function, reverse: boolean) {
    if (reverse) return new ArraySeq(this.toArray()).__iterate((v, k) => f(v, k, this), reverse)
    let y = 0
    let x = this._head
    while (x) {
      if (f(x.value, y++, this) === false) break
      x = x.next
    }
    return y
  }
  __iterator(m: qu.Iter.Mode, reverse: boolean) {
    if (reverse) return new ArraySeq(this.toArray()).__iterator(m, reverse)
    let y = 0
    let x = this._head
    return new qu.Iter(() => {
      if (x) {
        const v = x.value
        x = x.next
        return qu.Iter.value(m, y++, v)
      }
      return qu.Iter.done()
    })
  }
  shift = this.pop
  unshift = this.push
  unshiftAll = this.pushAll
  withMutations = qf.withMutations
  wasAltered = qf.wasAltered
  asImmutable = qf.asImmutable
  asMutable = qf.asMutable;
  ["@@transducer/init"] = qf.asMutable;
  ["@@transducer/step"] = function (result, arr) {
    return result.unshift(arr)
  };
  ["@@transducer/result"] = function (x) {
    return x.asImmutable()
  }
}

function makeStack(size, head, owner, hash) {
  const y = Object.create(Stack.prototype)
  y.size = size
  y._head = head
  y.__owner = owner
  y.__hash = hash
  y.__altered = false
  return y
}

let EMPTY_STACK

function emptyStack() {
  return EMPTY_STACK || (EMPTY_STACK = makeStack(0))
}
