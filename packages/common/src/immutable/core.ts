import { Collection, Seq, seqKeyedFrom, seqIndexedFrom, ArraySeq } from "./main.js"
import { emptyMap } from "./map.js"
import { set } from "./set.js"
import * as qu from "./utils.js"
import type * as qt from "./types.js"

export function get<K, V, T>(x: qt.Collection<K, V>, k: K, v0: T): V | T
export function get<K, V>(x: qt.Collection<K, V>, k: K): V | undefined
export function get<T extends object, K extends keyof T>(x: qt.Record<T>, k: K, v0: unknown): T[K]
export function get<T extends object, K extends keyof T>(x: T, k: K, v0: unknown): T[K]
export function get<V, T>(x: Array<V>, i: number, v0: T): V | T
export function get<V, T>(x: qt.Dict<V>, k: string, v0: T): V | T
export function get<V>(x: Array<V>, i: number): V | undefined
export function get<V>(x: qt.Dict<V>, k: string): V | undefined
export function get(x: any, k: any, v0?: unknown) {
  return qu.isImmutable(x) ? x.get(k, v0) : !has(x, k) ? v0 : typeof x.get === "function" ? x.get(k) : x[k]
}

export function getIn(x: any, xs: Iterable<unknown>, v0?: unknown): unknown {
  const p = qu.coerceKeyPath(xs)
  let i = 0
  while (i !== p.length) {
    x = get(x, p[i++], qu.NOT_SET)
    if (x === qu.NOT_SET) return v0
  }
  return x
}

export function has(x: object, k: any): boolean {
  return qu.isImmutable(x) ? x.has(k) : qu.isDataStructure(x) && qu.hasOwnProperty.call(x, k)
}

export function hasIn(x: unknown, xs: Iterable<unknown>): boolean {
  return getIn(x, xs, qu.NOT_SET) !== qu.NOT_SET
}

export function merge<T>(x: T, ...xs: Array<Iterable<unknown> | Iterable<[unknown, unknown]> | qt.Dict>): T {
  return mergeWithSources(x, xs)
}

export function mergeWith<T>(
  f: (old: unknown, v: unknown, k: unknown) => unknown,
  x: T,
  ...xs: Array<Iterable<unknown> | Iterable<[unknown, unknown]> | qt.Dict>
): T {
  return mergeWithSources(x, xs, f)
}

export function mergeDeep<T>(x: T, ...xs: Array<Iterable<unknown> | Iterable<[unknown, unknown]> | qt.Dict>): T {
  return mergeDeepWithSources(x, xs)
}

export function mergeDeepWith<T>(
  f: (old: unknown, newVal: unknown, key: unknown) => unknown,
  x: T,
  ...xs: Array<Iterable<unknown> | Iterable<[unknown, unknown]> | qt.Dict>
): T {
  return mergeDeepWithSources(x, xs, f)
}

export function mergeDeepWithSources(x: unknown, xs: unknown, f?: Function) {
  return mergeWithSources(x, xs, deepMergerWith(f))
}

export function mergeWithSources(x: any, xs: any, f?: Function) {
  if (!qu.isDataStructure(x)) throw new TypeError("Cannot merge into non-data-structure value: " + x)
  if (qu.isImmutable(x))
    return typeof f === "function" && x.mergeWith ? x.mergeWith(f, ...xs) : x.merge ? x.merge(...xs) : x.concat(...xs)
  const isArray = Array.isArray(x)
  let y = x
  const C = isArray ? Collection.Indexed : Collection.Keyed
  const mergeItem = isArray
    ? v => {
        if (y === x) y = qu.shallowCopy(y)
        y.push(v)
      }
    : (v, k) => {
        const hasVal = qu.hasOwnProperty.call(y, k)
        const nextVal = hasVal && f ? f(y[k], v, k) : v
        if (!hasVal || nextVal !== y[k]) {
          if (y === x) y = qu.shallowCopy(y)
          y[k] = nextVal
        }
      }
  for (let i = 0; i < xs.length; i++) {
    new C(xs[i]).forEach(mergeItem)
  }
  return y
}

function deepMergerWith(f: Function) {
  function y(old: unknown, x: unknown, k: unknown) {
    return qu.isDataStructure(old) && qu.isDataStructure(x) && areMergeable(old, x)
      ? mergeWithSources(old, [x], y)
      : f
      ? f(old, x, k)
      : x
  }
  return y
}

function areMergeable(a: any, b: any) {
  const a2 = Seq.create(a)
  const b2 = Seq.create(b)
  return qu.isIndexed(a2) === qu.isIndexed(b2) && qu.isKeyed(a2) === qu.isKeyed(b2)
}

export function remove<K, T extends qt.Collection<K, unknown>>(x: T, k: K): T
export function remove<T extends Array<unknown>>(x: T, k: number): T
export function remove<T extends object, U extends qt.Record<T>, K extends keyof T>(x: U, k: K): U
export function remove<T extends qt.Dict, K extends keyof T>(x: T, k: K): T
export function remove<T, K extends keyof T>(x: T, k: K): T
export function remove(x: unknown, k: any) {
  if (!qu.isDataStructure(x)) throw new TypeError("Cannot update non-data-structure value: " + x)
  if (qu.isImmutable(x)) {
    if (!x.remove) throw new TypeError("Cannot update immutable value without .remove() method: " + x)
    return x.remove(k)
  }
  if (!qu.hasOwnProperty.call(x, k)) return x
  const y = qu.shallowCopy(x)
  if (Array.isArray(y)) y.splice(k, 1)
  else delete y[k]
  return y
}

export function removeIn<T>(x: T, xs: Iterable<unknown>): T {
  return updateIn(x, xs, () => qu.NOT_SET)
}

export function set<K, V, T extends qt.Collection<K, V>>(x: T, k: K, v: V): T
export function set<T extends object, U extends qt.Record<T>, K extends keyof T>(x: U, k: K, v: T[K]): U
export function set<V, T extends Array<V>>(x: T, k: number, v: V): T
export function set<T, K extends keyof T>(x: T, k: K, v: T[K]): T
export function set<V, T extends qt.Dict<V>>(x: T, k: string, v: V): T
export function set(x: any, k: any, v: unknown) {
  if (!qu.isDataStructure(x)) throw new TypeError("Cannot update non-data-structure value: " + x)
  if (qu.isImmutable(x)) {
    if (!x.set) throw new TypeError("Cannot update immutable value without .set() method: " + x)
    return x.set(k, v)
  }
  if (qu.hasOwnProperty.call(x, k) && v === x[k]) return x
  const y = qu.shallowCopy(x)
  y[k] = v
  return y
}

export function setIn<T>(x: T, xs: Iterable<unknown>, v: unknown): T {
  return updateIn(x, xs, qu.NOT_SET, () => v)
}

export function update<K, V, T extends qt.Collection<K, V>>(x: T, k: K, f: (v: V | undefined) => V): T
export function update<K, V, T extends qt.Collection<K, V>, V0>(x: T, k: K, v0: V0, f: (v: V | V0) => V): T
export function update<T extends object, U extends qt.Record<T>, K extends keyof T>(x: U, k: K, f: (x: T[K]) => T[K]): U
export function update<V>(x: Array<V>, k: number, f: (v: V) => V): Array<V>
export function update<V, V0>(x: Array<V>, k: number, v0: V0, f: (v: V | V0) => V): Array<V>
export function update<T, K extends keyof T>(x: T, k: K, f: (x: T[K]) => T[K]): T
export function update<T, K extends keyof T, V0>(x: T, k: K, v0: V0, f: (x: T[K] | V0) => T[K]): T
export function update<V, T extends qt.Dict<V>, K extends keyof T>(x: T, k: K, f: (v: V) => V): qt.Dict<V>
export function update<V, T extends qt.Dict<V>, K extends keyof T, V0>(
  x: T,
  k: K,
  v0: V0,
  f: (v: V | V0) => V
): qt.Dict<V>
export function update<T extends object, U extends qt.Record<T>, K extends keyof T, V0>(
  x: U,
  k: K,
  v0: V0,
  f: (x: T[K] | V0) => T[K]
): U
export function update(x: unknown, k: unknown, v0: unknown, f?: (x: unknown) => unknown) {
  return updateIn(x, [k], v0, f)
}

export function updateIn<T>(x: T, xs: Iterable<unknown>, f: (x: unknown) => unknown): T
export function updateIn<T>(x: T, xs: Iterable<unknown>, v0: unknown, f?: (x: unknown) => unknown): T
export function updateIn(x: unknown, xs: unknown, v0: unknown, f?: Function) {
  if (!f) {
    f = v0 as Function
    v0 = undefined
  }
  const y = updateInDeeply(qu.isImmutable(x), x, qu.coerceKeyPath(xs), 0, v0, f)
  return y === qu.NOT_SET ? v0 : y
}

function updateInDeeply(isImmutable: boolean, x: any, xs: any, i: number, v0: unknown, f: Function): any {
  const notSet = x === qu.NOT_SET
  if (i === xs.length) {
    const x2 = notSet ? v0 : x
    const y = f(x2)
    return y === x2 ? x : y
  }
  if (!notSet && !qu.isDataStructure(x))
    throw new TypeError(
      "Cannot update within non-data-structure value in path [" + xs.slice(0, i).map(qu.quoteString) + "]: " + x
    )
  const k = xs[i]
  const x2 = notSet ? qu.NOT_SET : get(x, k, qu.NOT_SET)
  const y = updateInDeeply(x2 === qu.NOT_SET ? isImmutable : qu.isImmutable(x2), x2, xs, i + 1, v0, f)
  return y === x2 ? x : y === qu.NOT_SET ? remove(x, k) : set(notSet ? (isImmutable ? emptyMap() : {}) : x, k, y)
}

export function asImmutable(this: any) {
  return this.__ensureOwner()
}

export function asMutable(this: any) {
  return this.__owner ? this : this.__ensureOwner(new qu.OwnerID())
}

export function deleteIn(this: any, x) {
  return removeIn(this, x)
}

export function mergeIntoKeyedWith(x: any, xs: any, f?: Function) {
  const ys: any[] = []
  for (let i = 0; i < xs.length; i++) {
    const y = Collection.Keyed.create(xs[i])
    if (y.size !== 0) ys.push(y)
  }
  if (ys.length === 0) return x
  if (x.toSeq().size === 0 && !x.__owner && ys.length === 1) return x.constructor(ys[0])
  return x.withMutations(x2 => {
    const mergeIntoCollection = f
      ? (v, k) => {
          update(x2, k, qu.NOT_SET, v0 => (v0 === qu.NOT_SET ? v : f(v0, v, k)))
        }
      : (v, k) => {
          x2.set(k, v)
        }
    for (let i = 0; i < ys.length; i++) {
      ys[i].forEach(mergeIntoCollection)
    }
  })
}

export function mergeIn(this: any, x: any, ...xs: unknown[]) {
  return updateIn(this, x, emptyMap(), m => mergeWithSources(m, xs))
}

export function mergeDeepIn(this: any, x: any, ...xs: unknown[]) {
  return updateIn(this, x, emptyMap(), m => mergeDeepWithSources(m, xs))
}

export function toObject(this: any) {
  qu.assertNotInfinite(this.size)
  const y: any = {}
  this.__iterate((v, k) => {
    y[k] = v
  })
  return y
}

export function wasAltered(this: any) {
  return this.__altered
}

export function withMutations(this: any, f: Function) {
  const y = this.asMutable()
  f(y)
  return y.wasAltered() ? y.__ensureOwner(this.__owner) : this
}

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

function collectionClass(x) {
  return qu.isKeyed(x) ? Collection.Keyed : qu.isIndexed(x) ? Collection.Indexed : Collection.Set
}

function makeSequence(x) {
  return Object.create((qu.isKeyed(x) ? Seq.Keyed : qu.isIndexed(x) ? Seq.Indexed : Seq.Set).prototype)
}

export function cacheResult() {
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
