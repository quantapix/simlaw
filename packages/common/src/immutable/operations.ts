import { Collection, Seq, seqKeyedFrom, seqIndexedFrom, ArraySeq } from "./main.js"
import { Map } from "./map.js"
import { OrderedMap } from "./ordered.js"
import * as qu from "./utils.js"
import type * as qt from "./types.js"

export function reify<K, V>(x: Collection<K, V>, x2: unknown) {
  return x === x2 ? x : qu.isSeq(x) ? x2 : x.constructor(x2)
}

export function concat<K, V>(x: qt.Collection<K, V>, xs: any[]) {
  const isKeyed = qu.isKeyed(x)
  const ys = [x]
    .concat(xs)
    .map(v => {
      if (!qu.isCollection(v)) v = isKeyed ? seqKeyedFrom(v) : seqIndexedFrom(Array.isArray(v) ? v : [v])
      else if (isKeyed) v = Collection.Keyed.create(v)
      return v
    })
    .filter(v => v.size !== 0)
  if (ys.length === 0) return x
  if (ys.length === 1) {
    const y = ys[0]
    if (y === x || (isKeyed && qu.isKeyed(y)) || (qu.isIndexed(x) && qu.isIndexed(y))) return y
  }
  let y = new ArraySeq(ys)
  if (isKeyed) y = y.toSeqKeyed()
  else if (!qu.isIndexed(x)) y = y.toSeqSet()
  y = y.flatten(true)
  y.size = ys.reduce((sum, x2) => {
    if (sum !== undefined) {
      const n = x2.size
      if (n !== undefined) return sum + n
    }
  }, 0)
  return y
}

export function filter<K, V>(x: qt.Collection<K, V>, f: Function, ctx?: unknown, useKeys?: boolean) {
  const y = makeSequence(x)
  if (useKeys) {
    y.has = (k: K) => {
      const v = x.get(k, qu.NOT_SET)
      return v !== qu.NOT_SET && !!f.call(ctx, v, k, x)
    }
    y.get = (k: K, v0: V) => {
      const v = x.get(k, qu.NOT_SET)
      return v !== qu.NOT_SET && f.call(ctx, v, k, x) ? v : v0
    }
  }
  y.__iterateUncached = function (f2: Function, reverse?: boolean) {
    let y = 0
    this.__iterate((v: V, k: K, c) => {
      if (f.call(ctx, v, k, c)) {
        y++
        return f2(v, useKeys ? k : y - 1, this)
      }
    }, reverse)
    return y
  }
  y.__iteratorUncached = function (m: qu.Iter.Mode, reverse?: boolean) {
    const iter = this.__iterator(qu.ITERATE_ENTRIES, reverse)
    let n = 0
    return new qu.Iter(() => {
      while (true) {
        const i = iter.next()
        if (i.done) return i
        const [k, v] = i.value
        if (f.call(ctx, v, k, this)) return qu.Iter.value(m, useKeys ? k : n++, v, i)
      }
    })
  }
  return y
}

export function flip<K, V>(x: Collection<K, V>) {
  const y = makeSequence(x)
  y._iter = x
  y.size = x.size
  y.flip = () => x
  y.reverse = function () {
    const y2 = x.reverse.apply(this)
    y2.flip = () => x.reverse()
    return y2
  }
  y.has = (v: V) => x.includes(v)
  y.includes = (k: K) => x.has(k)
  y.cacheResult = cacheResult
  y.__iterateUncached = function (f, reverse: boolean) {
    return x.__iterate((v: V, k: K) => f(k, v, this) !== false, reverse)
  }
  y.__iteratorUncached = function (m: qu.Iter.Mode, reverse: boolean) {
    if (m === qu.ITERATE_ENTRIES) {
      const iter = x.__iterator(m, reverse)
      return new qu.Iter(() => {
        const i = iter.next()
        if (!i.done) {
          const k = i.value[0]
          i.value[0] = i.value[1]
          i.value[1] = k
        }
        return i
      })
    }
    return x.__iterator(m === qu.ITERATE_VALUES ? qu.ITERATE_KEYS : qu.ITERATE_VALUES, reverse)
  }
  return y
}

export class ToSeqKeyed<K, V> extends Seq.Keyed<K, V> {
  [qu.IS_ORDERED_SYMBOL] = true
  constructor(private _base: Collection, private _useKeys: boolean) {
    super()
    this.size = _base.size
  }
  override get(k: unknown, v0?: unknown) {
    return this._base.get(k, v0)
  }
  override has(k: unknown) {
    return this._base.has(k)
  }
  override valueSeq() {
    return this._base.valueSeq()
  }
  override reverse() {
    const y = reverseFactory(this, true)
    if (!this._useKeys) y.valueSeq = () => this._base.toSeq().reverse()
    return y
  }
  override map(f: Function, ctx?: unknown) {
    const y = mapFactory(this, f, ctx)
    if (!this._useKeys) y.valueSeq = () => this._base.toSeq().map(f, ctx)
    return y
  }
  override __iterate(f: Function, reverse: boolean) {
    return this._base.__iterate((v, k) => f(v, k, this), reverse)
  }
  override __iterator(m: qu.Iter.Mode, reverse: boolean) {
    return this._base.__iterator(m, reverse)
  }
  override cacheResult = cacheResult
}

export class ToSeqIndexed<V> extends Seq.Indexed<V> {
  constructor(private _base: Collection<V>) {
    super()
    this.size = _base.size
  }
  override includes(x: unknown) {
    return this._base.includes(x)
  }
  override __iterate(f: Function, reverse: boolean) {
    let y = 0
    reverse && qu.ensureSize(this)
    return this._base.__iterate(x => f(x, reverse ? this.size - ++y : y++, this), reverse)
  }
  override __iterator(m: qu.Iter.Mode, reverse: boolean) {
    const iter = this._base.__iterator(qu.ITERATE_VALUES, reverse)
    let y = 0
    reverse && qu.ensureSize(this)
    return new qu.Iter(() => {
      const i = iter.next()
      return i.done ? i : qu.Iter.value(m, reverse ? this.size - ++y : y++, i.value, i)
    })
  }
  override cacheResult = cacheResult
}

export class ToSeqSet<K> extends Seq.Set<K> {
  constructor(private _base: Collection<K>) {
    super()
    this.size = _base.size
  }
  override has(x: unknown) {
    return this._base.includes(x)
  }
  override __iterate(f: Function, reverse: boolean) {
    return this._base.__iterate(x => f(x, x, this), reverse)
  }
  override __iterator(m: qu.Iter.Mode, reverse: boolean) {
    const iter = this._base.__iterator(qu.ITERATE_VALUES, reverse)
    return new qu.Iter(() => {
      const i = iter.next()
      return i.done ? i : qu.Iter.value(m, i.value, i.value, i)
    })
  }
  override cacheResult = cacheResult
}

export class FromEntrySeq<K, V> extends Seq.Keyed<K, V> {
  constructor(private _base: Collection<K, V>) {
    super()
    this.size = _base.size
  }
  override entrySeq() {
    return this._base.toSeq()
  }
  override __iterate(f: Function, reverse: boolean) {
    return this._base.__iterate(x => {
      if (x) {
        validateEntry(x)
        const indexed = qu.isCollection(x)
        return f(indexed ? x.get(1) : x[1], indexed ? x.get(0) : x[0], this)
      }
    }, reverse)
  }
  override __iterator(m: qu.Iter.Mode, reverse: boolean) {
    const iter = this._base.__iterator(qu.ITERATE_VALUES, reverse)
    return new qu.Iter(() => {
      while (true) {
        const i = iter.next()
        if (i.done) return i
        const x = i.value
        if (x) {
          validateEntry(x)
          const indexed = qu.isCollection(x)
          return qu.Iter.value(m, indexed ? x.get(0) : x[0], indexed ? x.get(1) : x[1], i)
        }
      }
    })
  }
  override cacheResult = cacheResult
}

export function mapFactory(x, f, ctx) {
  const y = makeSequence(x)
  y.size = x.size
  y.has = key => x.has(key)
  y.get = (key, notSetValue) => {
    const v = x.get(key, qu.NOT_SET)
    return v === qu.NOT_SET ? notSetValue : f.call(ctx, v, key, x)
  }
  y.__iterateUncached = function (fn, reverse: boolean) {
    return x.__iterate((v, k, c) => fn(f.call(ctx, v, k, c), k, this) !== false, reverse)
  }
  y.__iteratorUncached = function (type, reverse: boolean) {
    const iterator = x.__iterator(qu.ITERATE_ENTRIES, reverse)
    return new qu.Iter(() => {
      const step = iterator.next()
      if (step.done) {
        return step
      }
      const entry = step.value
      const key = entry[0]
      return qu.Iter.value(type, key, f.call(ctx, entry[1], key, x), step)
    })
  }
  return y
}

export function reverseFactory(x, useKeys) {
  const y = makeSequence(x)
  y._iter = x
  y.size = x.size
  y.reverse = () => x
  if (x.flip) {
    y.flip = function () {
      const y = flip(x)
      y.reverse = () => x.flip()
      return y
    }
  }
  y.get = (key, notSetValue) => x.get(useKeys ? key : -1 - key, notSetValue)
  y.has = key => x.has(useKeys ? key : -1 - key)
  y.includes = value => x.includes(value)
  y.cacheResult = cacheResult
  y.__iterate = function (fn, reverse: boolean) {
    let i = 0
    reverse && qu.ensureSize(x)
    return x.__iterate((v, k) => fn(v, useKeys ? k : reverse ? this.size - ++i : i++, this), !reverse)
  }
  y.__iterator = (type, reverse) => {
    let i = 0
    reverse && qu.ensureSize(x)
    const iterator = x.__iterator(qu.ITERATE_ENTRIES, !reverse)
    return new qu.Iter(() => {
      const step = iterator.next()
      if (step.done) {
        return step
      }
      const entry = step.value
      return qu.Iter.value(type, useKeys ? entry[0] : reverse ? this.size - ++i : i++, entry[1], step)
    })
  }
  return y
}

export function sliceFactory(x, begin, end, useKeys) {
  const originalSize = x.size
  if (qu.wholeSlice(begin, end, originalSize)) return x
  const resolvedBegin = qu.resolveBegin(begin, originalSize)
  const resolvedEnd = qu.resolveEnd(end, originalSize)
  if (resolvedBegin !== resolvedBegin || resolvedEnd !== resolvedEnd) {
    return sliceFactory(x.toSeq().cacheResult(), begin, end, useKeys)
  }
  const resolvedSize = resolvedEnd - resolvedBegin
  let sliceSize
  if (resolvedSize === resolvedSize) sliceSize = resolvedSize < 0 ? 0 : resolvedSize
  const y = makeSequence(x)
  y.size = sliceSize === 0 ? sliceSize : (x.size && sliceSize) || undefined
  if (!useKeys && qu.isSeq(x) && sliceSize >= 0) {
    y.get = function (index, notSetValue) {
      index = qu.wrapIndex(this, index)
      return index >= 0 && index < sliceSize ? x.get(index + resolvedBegin, notSetValue) : notSetValue
    }
  }
  y.__iterateUncached = function (fn, reverse: boolean) {
    if (sliceSize === 0) return 0
    if (reverse) return this.cacheResult().__iterate(fn, reverse)
    let skipped = 0
    let isSkipping = true
    let iterations = 0
    x.__iterate((v, k) => {
      if (!(isSkipping && (isSkipping = skipped++ < resolvedBegin))) {
        iterations++
        return fn(v, useKeys ? k : iterations - 1, this) !== false && iterations !== sliceSize
      }
    })
    return iterations
  }
  y.__iteratorUncached = function (type, reverse: boolean) {
    if (sliceSize !== 0 && reverse) return this.cacheResult().__iterator(type, reverse)
    if (sliceSize === 0) return new qu.Iter(qu.Iter.done)
    const iterator = x.__iterator(type, reverse)
    let skipped = 0
    let iterations = 0
    return new qu.Iter(() => {
      while (skipped++ < resolvedBegin) {
        iterator.next()
      }
      if (++iterations > sliceSize) return qu.Iter.done()
      const step = iterator.next()
      if (useKeys || type === qu.ITERATE_VALUES || step.done) return step
      if (type === qu.ITERATE_KEYS) {
        return qu.Iter.value(type, iterations - 1, undefined, step)
      }
      return qu.Iter.value(type, iterations - 1, step.value[1], step)
    })
  }
  return y
}

export function takeWhileFactory(x, f, context) {
  const y = makeSequence(x)
  y.__iterateUncached = function (fn, reverse: boolean) {
    if (reverse) return this.cacheResult().__iterate(fn, reverse)
    let iterations = 0
    x.__iterate((v, k, c) => f.call(context, v, k, c) && ++iterations && fn(v, k, this))
    return iterations
  }
  y.__iteratorUncached = function (type, reverse: boolean) {
    if (reverse) return this.cacheResult().__iterator(type, reverse)
    const iterator = x.__iterator(qu.ITERATE_ENTRIES, reverse)
    let iterating = true
    return new qu.Iter(() => {
      if (!iterating) return qu.Iter.done()
      const step = iterator.next()
      if (step.done) return step
      const entry = step.value
      const k = entry[0]
      const v = entry[1]
      if (!f.call(context, v, k, this)) {
        iterating = false
        return qu.Iter.done()
      }
      return type === qu.ITERATE_ENTRIES ? step : qu.Iter.value(type, k, v, step)
    })
  }
  return y
}

export function skipWhileFactory(x, f, ctx, useKeys) {
  const y = makeSequence(x)
  y.__iterateUncached = function (fn, reverse: boolean) {
    if (reverse) {
      return this.cacheResult().__iterate(fn, reverse)
    }
    let isSkipping = true
    let iterations = 0
    x.__iterate((v, k, c) => {
      if (!(isSkipping && (isSkipping = f.call(ctx, v, k, c)))) {
        iterations++
        return fn(v, useKeys ? k : iterations - 1, this)
      }
    })
    return iterations
  }
  y.__iteratorUncached = function (type, reverse: boolean) {
    if (reverse) {
      return this.cacheResult().__iterator(type, reverse)
    }
    const iterator = x.__iterator(qu.ITERATE_ENTRIES, reverse)
    let skipping = true
    let iterations = 0
    return new qu.Iter(() => {
      let step
      let k
      let v
      do {
        step = iterator.next()
        if (step.done) {
          if (useKeys || type === qu.ITERATE_VALUES) {
            return step
          }
          if (type === qu.ITERATE_KEYS) {
            return qu.Iter.value(type, iterations++, undefined, step)
          }
          return qu.Iter.value(type, iterations++, step.value[1], step)
        }
        const entry = step.value
        k = entry[0]
        v = entry[1]
        skipping && (skipping = f.call(ctx, v, k, this))
      } while (skipping)
      return type === qu.ITERATE_ENTRIES ? step : qu.Iter.value(type, k, v, step)
    })
  }
  return y
}

export function flattenFactory(x, depth, useKeys) {
  const y = makeSequence(x)
  y.__iterateUncached = function (fn, reverse: boolean) {
    if (reverse) return this.cacheResult().__iterate(fn, reverse)
    let iterations = 0
    let stopped = false
    function flatDeep(iter, currentDepth) {
      iter.__iterate((v, k) => {
        if ((!depth || currentDepth < depth) && qu.isCollection(v)) flatDeep(v, currentDepth + 1)
        else {
          iterations++
          if (fn(v, useKeys ? k : iterations - 1, y) === false) stopped = true
        }
        return !stopped
      }, reverse)
    }
    flatDeep(x, 0)
    return iterations
  }
  y.__iteratorUncached = function (type, reverse: boolean) {
    if (reverse) return this.cacheResult().__iterator(type, reverse)
    let iterator = x.__iterator(type, reverse)
    const stack = []
    let iterations = 0
    return new qu.Iter(() => {
      while (iterator) {
        const step = iterator.next()
        if (step.done !== false) {
          iterator = stack.pop()
          continue
        }
        let v = step.value
        if (type === qu.ITERATE_ENTRIES) v = v[1]
        if ((!depth || stack.length < depth) && qu.isCollection(v)) {
          stack.push(iterator)
          iterator = v.__iterator(type, reverse)
        } else return useKeys ? step : qu.Iter.value(type, iterations++, v, step)
      }
      return qu.Iter.done()
    })
  }
  return y
}

export function flatMapFactory(x, mapper, context) {
  const coerce = collectionClass(x)
  return x
    .toSeq()
    .map((v, k) => coerce(mapper.call(context, v, k, x)))
    .flatten(true)
}

export function interposeFactory(x, separator) {
  const y = makeSequence(x)
  y.size = x.size && x.size * 2 - 1
  y.__iterateUncached = function (fn, reverse: boolean) {
    let iterations = 0
    x.__iterate(
      v => (!iterations || fn(separator, iterations++, this) !== false) && fn(v, iterations++, this) !== false,
      reverse
    )
    return iterations
  }
  y.__iteratorUncached = function (type, reverse: boolean) {
    const iterator = x.__iterator(qu.ITERATE_VALUES, reverse)
    let iterations = 0
    let step
    return new qu.Iter(() => {
      if (!step || iterations % 2) {
        step = iterator.next()
        if (step.done) return step
      }
      return iterations % 2
        ? qu.Iter.value(type, iterations++, separator)
        : qu.Iter.value(type, iterations++, step.value, step)
    })
  }
  return y
}

export function sortFactory(x, comparator, mapper) {
  if (!comparator) comparator = defaultComparator
  const isKeyed = qu.isKeyed(x)
  let index = 0
  const y = x
    .toSeq()
    .map((v, k) => [k, v, index++, mapper ? mapper(v, k, x) : v])
    .valueSeq()
    .toArray()
  y.sort((a, b) => comparator(a[3], b[3]) || a[2] - b[2]).forEach(
    isKeyed
      ? (v, i) => {
          y[i].length = 2
        }
      : (v, i) => {
          y[i] = v[1]
        }
  )
  return isKeyed ? new Seq.Keyed(y) : qu.isIndexed(x) ? new Seq.Indexed(y) : new Seq.Set(y)
}

export function maxFactory(collection, comparator, mapper) {
  if (!comparator) comparator = defaultComparator
  if (mapper) {
    const y = collection
      .toSeq()
      .map((v, k) => [v, mapper(v, k, collection)])
      .reduce((a, b) => (maxCompare(comparator, a[1], b[1]) ? b : a))
    return y && y[0]
  }
  return collection.reduce((a, b) => (maxCompare(comparator, a, b) ? b : a))
}

function maxCompare(comparator, a, b) {
  const y = comparator(b, a)
  return (y === 0 && b !== a && (b === undefined || b === null || b !== b)) || y > 0
}

export function zipWithFactory(keyIter, zipper, iters, zipAll) {
  const y = makeSequence(keyIter)
  const sizes = new ArraySeq(iters).map(i => i.size)
  y.size = zipAll ? sizes.max() : sizes.min()
  y.__iterate = function (fn, reverse: boolean) {
    const iterator = this.__iterator(qu.ITERATE_VALUES, reverse)
    let step
    let iterations = 0
    while (!(step = iterator.next()).done) {
      if (fn(step.value, iterations++, this) === false) break
    }
    return iterations
  }
  y.__iteratorUncached = function (type, reverse: boolean) {
    const iterators = iters.map(i => ((i = Collection(i)), qu.getIterator(reverse ? i.reverse() : i)))
    let iterations = 0
    let isDone = false
    return new qu.Iter(() => {
      let steps
      if (!isDone) {
        steps = iterators.map(i => i.next())
        isDone = zipAll ? steps.every(s => s.done) : steps.some(s => s.done)
      }
      if (isDone) return qu.Iter.done()
      return qu.Iter.value(
        type,
        iterations++,
        zipper.apply(
          null,
          steps.map(s => s.value)
        )
      )
    })
  }
  return y
}

function validateEntry(x) {
  if (x !== Object(x)) throw new TypeError("Expected [K, V] tuple: " + x)
}

function collectionClass(x) {
  return qu.isKeyed(x) ? Collection.Keyed : qu.isIndexed(x) ? Collection.Indexed : Collection.Set
}

function makeSequence(x) {
  return Object.create((qu.isKeyed(x) ? Seq.Keyed : qu.isIndexed(x) ? Seq.Indexed : Seq.Set).prototype)
}

function cacheResult() {
  if (this._iter.cacheResult) {
    this._iter.cacheResult()
    this.size = this._iter.size
    return this
  }
  return Seq.prototype.cacheResult.call(this)
}

function defaultComparator(a, b) {
  if (a === undefined && b === undefined) return 0
  if (a === undefined) return 1
  if (b === undefined) return -1
  return a > b ? 1 : a < b ? -1 : 0
}
