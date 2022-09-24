import * as qu from "./utils.js"
import { Collection, KeyedCollection, SetCollection, IndexedCollection } from "./main.js"
import { Seq, KeyedSeq, SetSeq, IndexedSeq, keyedSeqFromValue, indexedSeqFromValue, ArraySeq } from "./seq.js"
import { Map } from "./map.js"
import { OrderedMap } from "./ordered.js"

export class ToKeyedSequence extends KeyedSeq {
  constructor(indexed, useKeys) {
    super()
    this._iter = indexed
    this._useKeys = useKeys
    this.size = indexed.size
  }
  get(key, notSetValue) {
    return this._iter.get(key, notSetValue)
  }
  has(key) {
    return this._iter.has(key)
  }
  valueSeq() {
    return this._iter.valueSeq()
  }
  reverse() {
    const reversedSequence = reverseFactory(this, true)
    if (!this._useKeys) {
      reversedSequence.valueSeq = () => this._iter.toSeq().reverse()
    }
    return reversedSequence
  }
  map(mapper, context) {
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
}
ToKeyedSequence.prototype[qu.IS_ORDERED_SYMBOL] = true

export class ToIndexedSequence extends IndexedSeq {
  constructor(iter) {
    super()
    this._iter = iter
    this.size = iter.size
  }
  includes(value) {
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
}

export class ToSetSequence extends SetSeq {
  constructor(iter) {
    super()
    this._iter = iter
    this.size = iter.size
  }
  has(key) {
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
}

export class FromEntriesSequence extends KeyedSeq {
  constructor(entries) {
    this._iter = entries
    this.size = entries.size
  }
  entrySeq() {
    return this._iter.toSeq()
  }
  override __iterate(fn, reverse) {
    return this._iter.__iterate(entry => {
      // Check if entry exists first so array access doesn't throw for holes
      // in the parent iteration.
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
        // Check if entry exists first so array access doesn't throw for holes
        // in the parent iteration.
        if (entry) {
          validateEntry(entry)
          const indexedCollection = qu.isCollection(entry)
          return qu.iteratorValue(type, indexedCollection ? entry.get(0) : entry[0], indexedCollection ? entry.get(1) : entry[1], step)
        }
      }
    })
  }
}
ToIndexedSequence.prototype.cacheResult = ToKeyedSequence.prototype.cacheResult = ToSetSequence.prototype.cacheResult = FromEntriesSequence.prototype.cacheResult = cacheResultThrough

export function flipFactory(collection) {
  const flipSequence = makeSequence(collection)
  flipSequence._iter = collection
  flipSequence.size = collection.size
  flipSequence.flip = () => collection
  flipSequence.reverse = function () {
    const reversedSequence = collection.reverse.apply(this) // super.reverse()
    reversedSequence.flip = () => collection.reverse()
    return reversedSequence
  }
  flipSequence.has = key => collection.includes(key)
  flipSequence.includes = key => collection.has(key)
  flipSequence.cacheResult = cacheResultThrough
  flipSequence.__iterateUncached = function (fn, reverse) {
    return collection.__iterate((v, k) => fn(k, v, this) !== false, reverse)
  }
  flipSequence.__iteratorUncached = function (type, reverse) {
    if (type === qu.ITERATE_ENTRIES) {
      const iterator = collection.__iterator(type, reverse)
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
    return collection.__iterator(type === qu.ITERATE_VALUES ? qu.ITERATE_KEYS : qu.ITERATE_VALUES, reverse)
  }
  return flipSequence
}
export function mapFactory(collection, mapper, context) {
  const mappedSequence = makeSequence(collection)
  mappedSequence.size = collection.size
  mappedSequence.has = key => collection.has(key)
  mappedSequence.get = (key, notSetValue) => {
    const v = collection.get(key, qu.NOT_SET)
    return v === qu.NOT_SET ? notSetValue : mapper.call(context, v, key, collection)
  }
  mappedSequence.__iterateUncached = function (fn, reverse) {
    return collection.__iterate((v, k, c) => fn(mapper.call(context, v, k, c), k, this) !== false, reverse)
  }
  mappedSequence.__iteratorUncached = function (type, reverse) {
    const iterator = collection.__iterator(qu.ITERATE_ENTRIES, reverse)
    return new qu.Iterator(() => {
      const step = iterator.next()
      if (step.done) {
        return step
      }
      const entry = step.value
      const key = entry[0]
      return qu.iteratorValue(type, key, mapper.call(context, entry[1], key, collection), step)
    })
  }
  return mappedSequence
}
export function reverseFactory(collection, useKeys) {
  const y = makeSequence(collection)
  y._iter = collection
  y.size = collection.size
  y.reverse = () => collection
  if (collection.flip) {
    y.flip = function () {
      const flipSequence = flipFactory(collection)
      flipSequence.reverse = () => collection.flip()
      return flipSequence
    }
  }
  y.get = (key, notSetValue) => collection.get(useKeys ? key : -1 - key, notSetValue)
  y.has = key => collection.has(useKeys ? key : -1 - key)
  y.includes = value => collection.includes(value)
  y.cacheResult = cacheResultThrough
  y.__iterate = function (fn, reverse) {
    let i = 0
    reverse && qu.ensureSize(collection)
    return collection.__iterate((v, k) => fn(v, useKeys ? k : reverse ? this.size - ++i : i++, this), !reverse)
  }
  y.__iterator = (type, reverse) => {
    let i = 0
    reverse && qu.ensureSize(collection)
    const iterator = collection.__iterator(qu.ITERATE_ENTRIES, !reverse)
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
export function filterFactory(collection, predicate, context, useKeys) {
  const filterSequence = makeSequence(collection)
  if (useKeys) {
    filterSequence.has = key => {
      const v = collection.get(key, qu.NOT_SET)
      return v !== qu.NOT_SET && !!predicate.call(context, v, key, collection)
    }
    filterSequence.get = (key, notSetValue) => {
      const v = collection.get(key, qu.NOT_SET)
      return v !== qu.NOT_SET && predicate.call(context, v, key, collection) ? v : notSetValue
    }
  }
  filterSequence.__iterateUncached = function (fn, reverse) {
    let iterations = 0
    collection.__iterate((v, k, c) => {
      if (predicate.call(context, v, k, c)) {
        iterations++
        return fn(v, useKeys ? k : iterations - 1, this)
      }
    }, reverse)
    return iterations
  }
  filterSequence.__iteratorUncached = function (type, reverse) {
    const iterator = collection.__iterator(qu.ITERATE_ENTRIES, reverse)
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
        if (predicate.call(context, value, key, collection)) {
          return qu.iteratorValue(type, useKeys ? key : iterations++, value, step)
        }
      }
    })
  }
  return filterSequence
}
export function countByFactory(collection, grouper, context) {
  const groups = Map().asMutable()
  collection.__iterate((v, k) => {
    groups.update(grouper.call(context, v, k, collection), 0, a => a + 1)
  })
  return groups.asImmutable()
}
export function groupByFactory(collection, grouper, context) {
  const isKeyedIter = qu.isKeyed(collection)
  const groups = (qu.isOrdered(collection) ? OrderedMap() : Map()).asMutable()
  collection.__iterate((v, k) => {
    groups.update(grouper.call(context, v, k, collection), a => ((a = a || []), a.push(isKeyedIter ? [k, v] : v), a))
  })
  const coerce = collectionClass(collection)
  return groups.map(arr => reify(collection, coerce(arr))).asImmutable()
}
export function sliceFactory(collection, begin, end, useKeys) {
  const originalSize = collection.size
  if (qu.wholeSlice(begin, end, originalSize)) {
    return collection
  }
  const resolvedBegin = qu.resolveBegin(begin, originalSize)
  const resolvedEnd = qu.resolveEnd(end, originalSize)
  // begin or end will be NaN if they were provided as negative numbers and
  // this collection's size is unknown. In that case, cache first so there is
  // a known size and these do not resolve to NaN.
  if (resolvedBegin !== resolvedBegin || resolvedEnd !== resolvedEnd) {
    return sliceFactory(collection.toSeq().cacheResult(), begin, end, useKeys)
  }
  // Note: resolvedEnd is undefined when the original sequence's length is
  // unknown and this slice did not supply an end and should contain all
  // elements after resolvedBegin.
  // In that case, resolvedSize will be NaN and sliceSize will remain undefined.
  const resolvedSize = resolvedEnd - resolvedBegin
  let sliceSize
  if (resolvedSize === resolvedSize) {
    sliceSize = resolvedSize < 0 ? 0 : resolvedSize
  }
  const sliceSeq = makeSequence(collection)
  // If collection.size is undefined, the size of the realized sliceSeq is
  // unknown at this point unless the number of items to slice is 0
  sliceSeq.size = sliceSize === 0 ? sliceSize : (collection.size && sliceSize) || undefined
  if (!useKeys && qu.isSeq(collection) && sliceSize >= 0) {
    sliceSeq.get = function (index, notSetValue) {
      index = qu.wrapIndex(this, index)
      return index >= 0 && index < sliceSize ? collection.get(index + resolvedBegin, notSetValue) : notSetValue
    }
  }
  sliceSeq.__iterateUncached = function (fn, reverse) {
    if (sliceSize === 0) {
      return 0
    }
    if (reverse) {
      return this.cacheResult().__iterate(fn, reverse)
    }
    let skipped = 0
    let isSkipping = true
    let iterations = 0
    collection.__iterate((v, k) => {
      if (!(isSkipping && (isSkipping = skipped++ < resolvedBegin))) {
        iterations++
        return fn(v, useKeys ? k : iterations - 1, this) !== false && iterations !== sliceSize
      }
    })
    return iterations
  }
  sliceSeq.__iteratorUncached = function (type, reverse) {
    if (sliceSize !== 0 && reverse) {
      return this.cacheResult().__iterator(type, reverse)
    }
    // Don't bother instantiating parent iterator if taking 0.
    if (sliceSize === 0) {
      return new qu.Iterator(qu.iteratorDone)
    }
    const iterator = collection.__iterator(type, reverse)
    let skipped = 0
    let iterations = 0
    return new qu.Iterator(() => {
      while (skipped++ < resolvedBegin) {
        iterator.next()
      }
      if (++iterations > sliceSize) {
        return qu.iteratorDone()
      }
      const step = iterator.next()
      if (useKeys || type === qu.ITERATE_VALUES || step.done) {
        return step
      }
      if (type === qu.ITERATE_KEYS) {
        return qu.iteratorValue(type, iterations - 1, undefined, step)
      }
      return qu.iteratorValue(type, iterations - 1, step.value[1], step)
    })
  }
  return sliceSeq
}
export function takeWhileFactory(collection, predicate, context) {
  const takeSequence = makeSequence(collection)
  takeSequence.__iterateUncached = function (fn, reverse) {
    if (reverse) {
      return this.cacheResult().__iterate(fn, reverse)
    }
    let iterations = 0
    collection.__iterate((v, k, c) => predicate.call(context, v, k, c) && ++iterations && fn(v, k, this))
    return iterations
  }
  takeSequence.__iteratorUncached = function (type, reverse) {
    if (reverse) {
      return this.cacheResult().__iterator(type, reverse)
    }
    const iterator = collection.__iterator(qu.ITERATE_ENTRIES, reverse)
    let iterating = true
    return new qu.Iterator(() => {
      if (!iterating) {
        return qu.iteratorDone()
      }
      const step = iterator.next()
      if (step.done) {
        return step
      }
      const entry = step.value
      const k = entry[0]
      const v = entry[1]
      if (!predicate.call(context, v, k, this)) {
        iterating = false
        return qu.iteratorDone()
      }
      return type === qu.ITERATE_ENTRIES ? step : qu.iteratorValue(type, k, v, step)
    })
  }
  return takeSequence
}
export function skipWhileFactory(collection, predicate, context, useKeys) {
  const skipSequence = makeSequence(collection)
  skipSequence.__iterateUncached = function (fn, reverse) {
    if (reverse) {
      return this.cacheResult().__iterate(fn, reverse)
    }
    let isSkipping = true
    let iterations = 0
    collection.__iterate((v, k, c) => {
      if (!(isSkipping && (isSkipping = predicate.call(context, v, k, c)))) {
        iterations++
        return fn(v, useKeys ? k : iterations - 1, this)
      }
    })
    return iterations
  }
  skipSequence.__iteratorUncached = function (type, reverse) {
    if (reverse) {
      return this.cacheResult().__iterator(type, reverse)
    }
    const iterator = collection.__iterator(qu.ITERATE_ENTRIES, reverse)
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
        skipping && (skipping = predicate.call(context, v, k, this))
      } while (skipping)
      return type === qu.ITERATE_ENTRIES ? step : qu.iteratorValue(type, k, v, step)
    })
  }
  return skipSequence
}
export function concatFactory(collection, values) {
  const isKeyedCollection = qu.isKeyed(collection)
  const iters = [collection]
    .concat(values)
    .map(v => {
      if (!qu.isCollection(v)) {
        v = isKeyedCollection ? keyedSeqFromValue(v) : indexedSeqFromValue(Array.isArray(v) ? v : [v])
      } else if (isKeyedCollection) {
        v = KeyedCollection(v)
      }
      return v
    })
    .filter(v => v.size !== 0)
  if (iters.length === 0) {
    return collection
  }
  if (iters.length === 1) {
    const singleton = iters[0]
    if (singleton === collection || (isKeyedCollection && qu.isKeyed(singleton)) || (qu.isIndexed(collection) && qu.isIndexed(singleton))) {
      return singleton
    }
  }
  let concatSeq = new ArraySeq(iters)
  if (isKeyedCollection) {
    concatSeq = concatSeq.toKeyedSeq()
  } else if (!qu.isIndexed(collection)) {
    concatSeq = concatSeq.toSetSeq()
  }
  concatSeq = concatSeq.flatten(true)
  concatSeq.size = iters.reduce((sum, seq) => {
    if (sum !== undefined) {
      const size = seq.size
      if (size !== undefined) {
        return sum + size
      }
    }
  }, 0)
  return concatSeq
}
export function flattenFactory(collection, depth, useKeys) {
  const flatSequence = makeSequence(collection)
  flatSequence.__iterateUncached = function (fn, reverse) {
    if (reverse) {
      return this.cacheResult().__iterate(fn, reverse)
    }
    let iterations = 0
    let stopped = false
    function flatDeep(iter, currentDepth) {
      iter.__iterate((v, k) => {
        if ((!depth || currentDepth < depth) && qu.isCollection(v)) {
          flatDeep(v, currentDepth + 1)
        } else {
          iterations++
          if (fn(v, useKeys ? k : iterations - 1, flatSequence) === false) {
            stopped = true
          }
        }
        return !stopped
      }, reverse)
    }
    flatDeep(collection, 0)
    return iterations
  }
  flatSequence.__iteratorUncached = function (type, reverse) {
    if (reverse) {
      return this.cacheResult().__iterator(type, reverse)
    }
    let iterator = collection.__iterator(type, reverse)
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
        if (type === qu.ITERATE_ENTRIES) {
          v = v[1]
        }
        if ((!depth || stack.length < depth) && qu.isCollection(v)) {
          stack.push(iterator)
          iterator = v.__iterator(type, reverse)
        } else {
          return useKeys ? step : qu.iteratorValue(type, iterations++, v, step)
        }
      }
      return qu.iteratorDone()
    })
  }
  return flatSequence
}
export function flatMapFactory(collection, mapper, context) {
  const coerce = collectionClass(collection)
  return collection
    .toSeq()
    .map((v, k) => coerce(mapper.call(context, v, k, collection)))
    .flatten(true)
}
export function interposeFactory(collection, separator) {
  const interposedSequence = makeSequence(collection)
  interposedSequence.size = collection.size && collection.size * 2 - 1
  interposedSequence.__iterateUncached = function (fn, reverse) {
    let iterations = 0
    collection.__iterate(v => (!iterations || fn(separator, iterations++, this) !== false) && fn(v, iterations++, this) !== false, reverse)
    return iterations
  }
  interposedSequence.__iteratorUncached = function (type, reverse) {
    const iterator = collection.__iterator(qu.ITERATE_VALUES, reverse)
    let iterations = 0
    let step
    return new qu.Iterator(() => {
      if (!step || iterations % 2) {
        step = iterator.next()
        if (step.done) {
          return step
        }
      }
      return iterations % 2 ? qu.iteratorValue(type, iterations++, separator) : qu.iteratorValue(type, iterations++, step.value, step)
    })
  }
  return interposedSequence
}
export function sortFactory(collection, comparator, mapper) {
  if (!comparator) {
    comparator = defaultComparator
  }
  const isKeyedCollection = qu.isKeyed(collection)
  let index = 0
  const entries = collection
    .toSeq()
    .map((v, k) => [k, v, index++, mapper ? mapper(v, k, collection) : v])
    .valueSeq()
    .toArray()
  entries
    .sort((a, b) => comparator(a[3], b[3]) || a[2] - b[2])
    .forEach(
      isKeyedCollection
        ? (v, i) => {
            entries[i].length = 2
          }
        : (v, i) => {
            entries[i] = v[1]
          }
    )
  return isKeyedCollection ? KeyedSeq(entries) : qu.isIndexed(collection) ? IndexedSeq(entries) : SetSeq(entries)
}
export function maxFactory(collection, comparator, mapper) {
  if (!comparator) {
    comparator = defaultComparator
  }
  if (mapper) {
    const entry = collection
      .toSeq()
      .map((v, k) => [v, mapper(v, k, collection)])
      .reduce((a, b) => (maxCompare(comparator, a[1], b[1]) ? b : a))
    return entry && entry[0]
  }
  return collection.reduce((a, b) => (maxCompare(comparator, a, b) ? b : a))
}
function maxCompare(comparator, a, b) {
  const comp = comparator(b, a)
  // b is considered the new max if the comparator declares them equal, but
  // they are not equal and b is in fact a nullish value.
  return (comp === 0 && b !== a && (b === undefined || b === null || b !== b)) || comp > 0
}
export function zipWithFactory(keyIter, zipper, iters, zipAll) {
  const zipSequence = makeSequence(keyIter)
  const sizes = new ArraySeq(iters).map(i => i.size)
  zipSequence.size = zipAll ? sizes.max() : sizes.min()
  // Note: this a generic base implementation of __iterate in terms of
  // __iterator which may be more generically useful in the future.
  zipSequence.__iterate = function (fn, reverse) {
    /* generic:
    var iterator = this.__iterator(ITERATE_ENTRIES, reverse);
    var step;
    var iterations = 0;
    while (!(step = iterator.next()).done) {
      iterations++;
      if (fn(step.value[1], step.value[0], this) === false) {
        break;
      }
    }
    return iterations;
    */
    // indexed:
    const iterator = this.__iterator(qu.ITERATE_VALUES, reverse)
    let step
    let iterations = 0
    while (!(step = iterator.next()).done) {
      if (fn(step.value, iterations++, this) === false) {
        break
      }
    }
    return iterations
  }
  zipSequence.__iteratorUncached = function (type, reverse) {
    const iterators = iters.map(i => ((i = Collection(i)), qu.getIterator(reverse ? i.reverse() : i)))
    let iterations = 0
    let isDone = false
    return new qu.Iterator(() => {
      let steps
      if (!isDone) {
        steps = iterators.map(i => i.next())
        isDone = zipAll ? steps.every(s => s.done) : steps.some(s => s.done)
      }
      if (isDone) {
        return qu.iteratorDone()
      }
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
  return zipSequence
}
// #pragma Helper Functions
export function reify(iter, seq) {
  return iter === seq ? iter : qu.isSeq(iter) ? seq : iter.constructor(seq)
}
function validateEntry(entry) {
  if (entry !== Object(entry)) {
    throw new TypeError("Expected [K, V] tuple: " + entry)
  }
}
function collectionClass(collection) {
  return qu.isKeyed(collection) ? KeyedCollection : qu.isIndexed(collection) ? IndexedCollection : SetCollection
}
function makeSequence(collection) {
  return Object.create((qu.isKeyed(collection) ? KeyedSeq : qu.isIndexed(collection) ? IndexedSeq : SetSeq).prototype)
}
function cacheResultThrough() {
  if (this._iter.cacheResult) {
    this._iter.cacheResult()
    this.size = this._iter.size
    return this
  }
  return Seq.prototype.cacheResult.call(this)
}
function defaultComparator(a, b) {
  if (a === undefined && b === undefined) {
    return 0
  }
  if (a === undefined) {
    return 1
  }
  if (b === undefined) {
    return -1
  }
  return a > b ? 1 : a < b ? -1 : 0
}
