import * as qu from "./utils.js"
import { Collection, Seq, seqKeyedFrom, seqIndexedFrom, ArraySeq } from "./main.js"
import { Map } from "./map.js"
import { OrderedMap } from "./ordered.js"

export class ToSeqKeyed<K, V> extends Seq.Keyed<K, V> {
  [qu.IS_ORDERED_SYMBOL] = true
  constructor(indexed, useKeys) {
    super()
    this._iter = indexed
    this._useKeys = useKeys
    this.size = indexed.size
  }
  override get(key, notSetValue) {
    return this._iter.get(key, notSetValue)
  }
  override has(key) {
    return this._iter.has(key)
  }
  override valueSeq() {
    return this._iter.valueSeq()
  }
  override reverse() {
    const reversedSequence = reverseFactory(this, true)
    if (!this._useKeys) {
      reversedSequence.valueSeq = () => this._iter.toSeq().reverse()
    }
    return reversedSequence
  }
  override map(mapper, context) {
    const mappedSequence = mapFactory(this, mapper, context)
    if (!this._useKeys) {
      mappedSequence.valueSeq = () => this._iter.toSeq().map(mapper, context)
    }
    return mappedSequence
  }
  override __iterate(fn, reverse) {
    return this._iter.__iterate((v, k) => fn(v, k, this), reverse)
  }
  override __iterator(type, reverse) {
    return this._iter.__iterator(type, reverse)
  }
  override cacheResult = cacheResult
}

export class ToSeqIndexed<V> extends Seq.Indexed<V> {
  constructor(iter) {
    super()
    this._iter = iter
    this.size = iter.size
  }
  override includes(value) {
    return this._iter.includes(value)
  }
  override __iterate(fn, reverse) {
    let i = 0
    reverse && qu.ensureSize(this)
    return this._iter.__iterate(v => fn(v, reverse ? this.size - ++i : i++, this), reverse)
  }
  override __iterator(type, reverse) {
    const iterator = this._iter.__iterator(qu.ITERATE_VALUES, reverse)
    let i = 0
    reverse && qu.ensureSize(this)
    return new qu.Iterator(() => {
      const step = iterator.next()
      return step.done ? step : qu.iteratorValue(type, reverse ? this.size - ++i : i++, step.value, step)
    })
  }
  override cacheResult = cacheResult
}

export class ToSeqSet<K> extends Seq.Set<K> {
  constructor(iter) {
    super()
    this._iter = iter
    this.size = iter.size
  }
  override has(key) {
    return this._iter.includes(key)
  }
  override __iterate(fn, reverse) {
    return this._iter.__iterate(v => fn(v, v, this), reverse)
  }
  override __iterator(type, reverse) {
    const iterator = this._iter.__iterator(qu.ITERATE_VALUES, reverse)
    return new qu.Iterator(() => {
      const step = iterator.next()
      return step.done ? step : qu.iteratorValue(type, step.value, step.value, step)
    })
  }
  override cacheResult = cacheResult
}

export class FromEntriesSequence extends Seq.Keyed {
  constructor(entries) {
    this._iter = entries
    this.size = entries.size
  }
  entrySeq() {
    return this._iter.toSeq()
  }
  override __iterate(fn, reverse) {
    return this._iter.__iterate(entry => {
      if (entry) {
        validateEntry(entry)
        const indexedCollection = qu.isCollection(entry)
        return fn(indexedCollection ? entry.get(1) : entry[1], indexedCollection ? entry.get(0) : entry[0], this)
      }
    }, reverse)
  }
  override __iterator(type, reverse) {
    const iterator = this._iter.__iterator(qu.ITERATE_VALUES, reverse)
    return new qu.Iterator(() => {
      while (true) {
        const step = iterator.next()
        if (step.done) {
          return step
        }
        const entry = step.value
        if (entry) {
          validateEntry(entry)
          const indexedCollection = qu.isCollection(entry)
          return qu.iteratorValue(type, indexedCollection ? entry.get(0) : entry[0], indexedCollection ? entry.get(1) : entry[1], step)
        }
      }
    })
  }
  cacheResult = cacheResult
}

export function flipFactory(x) {
  const y = makeSequence(x)
  y._iter = x
  y.size = x.size
  y.flip = () => x
  y.reverse = function () {
    const y2 = x.reverse.apply(this)
    y2.flip = () => x.reverse()
    return y2
  }
  y.has = key => x.includes(key)
  y.includes = key => x.has(key)
  y.cacheResult = cacheResult
  y.__iterateUncached = function (fn, reverse) {
    return x.__iterate((v, k) => fn(k, v, this) !== false, reverse)
  }
  y.__iteratorUncached = function (type, reverse) {
    if (type === qu.ITERATE_ENTRIES) {
      const iterator = x.__iterator(type, reverse)
      return new qu.Iterator(() => {
        const step = iterator.next()
        if (!step.done) {
          const k = step.value[0]
          step.value[0] = step.value[1]
          step.value[1] = k
        }
        return step
      })
    }
    return x.__iterator(type === qu.ITERATE_VALUES ? qu.ITERATE_KEYS : qu.ITERATE_VALUES, reverse)
  }
  return y
}

export function mapFactory(x, f, ctx) {
  const y = makeSequence(x)
  y.size = x.size
  y.has = key => x.has(key)
  y.get = (key, notSetValue) => {
    const v = x.get(key, qu.NOT_SET)
    return v === qu.NOT_SET ? notSetValue : f.call(ctx, v, key, x)
  }
  y.__iterateUncached = function (fn, reverse) {
    return x.__iterate((v, k, c) => fn(f.call(ctx, v, k, c), k, this) !== false, reverse)
  }
  y.__iteratorUncached = function (type, reverse) {
    const iterator = x.__iterator(qu.ITERATE_ENTRIES, reverse)
    return new qu.Iterator(() => {
      const step = iterator.next()
      if (step.done) {
        return step
      }
      const entry = step.value
      const key = entry[0]
      return qu.iteratorValue(type, key, f.call(ctx, entry[1], key, x), step)
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
      const flipSequence = flipFactory(x)
      flipSequence.reverse = () => x.flip()
      return flipSequence
    }
  }
  y.get = (key, notSetValue) => x.get(useKeys ? key : -1 - key, notSetValue)
  y.has = key => x.has(useKeys ? key : -1 - key)
  y.includes = value => x.includes(value)
  y.cacheResult = cacheResult
  y.__iterate = function (fn, reverse) {
    let i = 0
    reverse && qu.ensureSize(x)
    return x.__iterate((v, k) => fn(v, useKeys ? k : reverse ? this.size - ++i : i++, this), !reverse)
  }
  y.__iterator = (type, reverse) => {
    let i = 0
    reverse && qu.ensureSize(x)
    const iterator = x.__iterator(qu.ITERATE_ENTRIES, !reverse)
    return new qu.Iterator(() => {
      const step = iterator.next()
      if (step.done) {
        return step
      }
      const entry = step.value
      return qu.iteratorValue(type, useKeys ? entry[0] : reverse ? this.size - ++i : i++, entry[1], step)
    })
  }
  return y
}

export function filterFactory(x, f, context, useKeys) {
  const y = makeSequence(x)
  if (useKeys) {
    y.has = key => {
      const v = x.get(key, qu.NOT_SET)
      return v !== qu.NOT_SET && !!f.call(context, v, key, x)
    }
    y.get = (key, notSetValue) => {
      const v = x.get(key, qu.NOT_SET)
      return v !== qu.NOT_SET && f.call(context, v, key, x) ? v : notSetValue
    }
  }
  y.__iterateUncached = function (fn, reverse) {
    let iterations = 0
    x.__iterate((v, k, c) => {
      if (f.call(context, v, k, c)) {
        iterations++
        return fn(v, useKeys ? k : iterations - 1, this)
      }
    }, reverse)
    return iterations
  }
  y.__iteratorUncached = function (type, reverse) {
    const iterator = x.__iterator(qu.ITERATE_ENTRIES, reverse)
    let iterations = 0
    return new qu.Iterator(() => {
      while (true) {
        const step = iterator.next()
        if (step.done) {
          return step
        }
        const entry = step.value
        const key = entry[0]
        const value = entry[1]
        if (f.call(context, value, key, x)) {
          return qu.iteratorValue(type, useKeys ? key : iterations++, value, step)
        }
      }
    })
  }
  return y
}

export function countByFactory(x, grouper, context) {
  const y = Map().asMutable()
  x.__iterate((v, k) => {
    y.update(grouper.call(context, v, k, x), 0, a => a + 1)
  })
  return y.asImmutable()
}

export function groupByFactory(x, grouper, context) {
  const isKeyedIter = qu.isKeyed(x)
  const y = (qu.isOrdered(x) ? OrderedMap() : Map()).asMutable()
  x.__iterate((v, k) => {
    y.update(grouper.call(context, v, k, x), a => ((a = a || []), a.push(isKeyedIter ? [k, v] : v), a))
  })
  const coerce = collectionClass(x)
  return y.map(arr => reify(x, coerce(arr))).asImmutable()
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
  y.__iterateUncached = function (fn, reverse) {
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
  y.__iteratorUncached = function (type, reverse) {
    if (sliceSize !== 0 && reverse) return this.cacheResult().__iterator(type, reverse)
    if (sliceSize === 0) return new qu.Iterator(qu.iteratorDone)
    const iterator = x.__iterator(type, reverse)
    let skipped = 0
    let iterations = 0
    return new qu.Iterator(() => {
      while (skipped++ < resolvedBegin) {
        iterator.next()
      }
      if (++iterations > sliceSize) return qu.iteratorDone()
      const step = iterator.next()
      if (useKeys || type === qu.ITERATE_VALUES || step.done) return step
      if (type === qu.ITERATE_KEYS) {
        return qu.iteratorValue(type, iterations - 1, undefined, step)
      }
      return qu.iteratorValue(type, iterations - 1, step.value[1], step)
    })
  }
  return y
}

export function takeWhileFactory(x, f, context) {
  const y = makeSequence(x)
  y.__iterateUncached = function (fn, reverse) {
    if (reverse) return this.cacheResult().__iterate(fn, reverse)
    let iterations = 0
    x.__iterate((v, k, c) => f.call(context, v, k, c) && ++iterations && fn(v, k, this))
    return iterations
  }
  y.__iteratorUncached = function (type, reverse) {
    if (reverse) return this.cacheResult().__iterator(type, reverse)
    const iterator = x.__iterator(qu.ITERATE_ENTRIES, reverse)
    let iterating = true
    return new qu.Iterator(() => {
      if (!iterating) return qu.iteratorDone()
      const step = iterator.next()
      if (step.done) return step
      const entry = step.value
      const k = entry[0]
      const v = entry[1]
      if (!f.call(context, v, k, this)) {
        iterating = false
        return qu.iteratorDone()
      }
      return type === qu.ITERATE_ENTRIES ? step : qu.iteratorValue(type, k, v, step)
    })
  }
  return y
}

export function skipWhileFactory(x, f, ctx, useKeys) {
  const y = makeSequence(x)
  y.__iterateUncached = function (fn, reverse) {
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
  y.__iteratorUncached = function (type, reverse) {
    if (reverse) {
      return this.cacheResult().__iterator(type, reverse)
    }
    const iterator = x.__iterator(qu.ITERATE_ENTRIES, reverse)
    let skipping = true
    let iterations = 0
    return new qu.Iterator(() => {
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
            return qu.iteratorValue(type, iterations++, undefined, step)
          }
          return qu.iteratorValue(type, iterations++, step.value[1], step)
        }
        const entry = step.value
        k = entry[0]
        v = entry[1]
        skipping && (skipping = f.call(ctx, v, k, this))
      } while (skipping)
      return type === qu.ITERATE_ENTRIES ? step : qu.iteratorValue(type, k, v, step)
    })
  }
  return y
}

export function concatFactory(x, values) {
  const isKeyed = qu.isKeyed(x)
  const iters = [x]
    .concat(values)
    .map(v => {
      if (!qu.isCollection(v)) {
        v = isKeyed ? seqKeyedFrom(v) : seqIndexedFrom(Array.isArray(v) ? v : [v])
      } else if (isKeyed) v = new Collection.Keyed(v)
      return v
    })
    .filter(v => v.size !== 0)
  if (iters.length === 0) return x
  if (iters.length === 1) {
    const singleton = iters[0]
    if (singleton === x || (isKeyed && qu.isKeyed(singleton)) || (qu.isIndexed(x) && qu.isIndexed(singleton))) {
      return singleton
    }
  }
  let y = new ArraySeq(iters)
  if (isKeyed) y = y.toSeq.Keyed()
  else if (!qu.isIndexed(x)) y = y.toSeq.Set()
  y = y.flatten(true)
  y.size = iters.reduce((sum, seq) => {
    if (sum !== undefined) {
      const size = seq.size
      if (size !== undefined) return sum + size
    }
  }, 0)
  return y
}

export function flattenFactory(x, depth, useKeys) {
  const y = makeSequence(x)
  y.__iterateUncached = function (fn, reverse) {
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
  y.__iteratorUncached = function (type, reverse) {
    if (reverse) return this.cacheResult().__iterator(type, reverse)
    let iterator = x.__iterator(type, reverse)
    const stack = []
    let iterations = 0
    return new qu.Iterator(() => {
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
        } else return useKeys ? step : qu.iteratorValue(type, iterations++, v, step)
      }
      return qu.iteratorDone()
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
  y.__iterateUncached = function (fn, reverse) {
    let iterations = 0
    x.__iterate(v => (!iterations || fn(separator, iterations++, this) !== false) && fn(v, iterations++, this) !== false, reverse)
    return iterations
  }
  y.__iteratorUncached = function (type, reverse) {
    const iterator = x.__iterator(qu.ITERATE_VALUES, reverse)
    let iterations = 0
    let step
    return new qu.Iterator(() => {
      if (!step || iterations % 2) {
        step = iterator.next()
        if (step.done) return step
      }
      return iterations % 2 ? qu.iteratorValue(type, iterations++, separator) : qu.iteratorValue(type, iterations++, step.value, step)
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
  y.__iterate = function (fn, reverse) {
    const iterator = this.__iterator(qu.ITERATE_VALUES, reverse)
    let step
    let iterations = 0
    while (!(step = iterator.next()).done) {
      if (fn(step.value, iterations++, this) === false) break
    }
    return iterations
  }
  y.__iteratorUncached = function (type, reverse) {
    const iterators = iters.map(i => ((i = Collection(i)), qu.getIterator(reverse ? i.reverse() : i)))
    let iterations = 0
    let isDone = false
    return new qu.Iterator(() => {
      let steps
      if (!isDone) {
        steps = iterators.map(i => i.next())
        isDone = zipAll ? steps.every(s => s.done) : steps.some(s => s.done)
      }
      if (isDone) return qu.iteratorDone()
      return qu.iteratorValue(
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

export function reify(iter, seq) {
  return iter === seq ? iter : qu.isSeq(iter) ? seq : iter.constructor(seq)
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
