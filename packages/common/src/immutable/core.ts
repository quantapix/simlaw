import { Collection, Seq, seqKeyedFrom, seqIndexedFrom, ArrSeq } from "./main.js"
import { emptyMap } from "./map.js"
import { set } from "./set.js"
import * as qu from "./utils.js"
import type * as qt from "./types.js"

export function get<K, V, T>(x: qt.Collection<K, V>, k: K, v0: T): V | T
export function get<K, V>(x: qt.Collection<K, V>, k: K): V | undefined
export function get<T extends object, K extends keyof T>(x: qt.Record<T>, k: K, v0: unknown): T[K]
export function get<T extends object, K extends keyof T>(x: T, k: K, v0: unknown): T[K]
export function get<V, T>(x: Array<V>, i: number, v0: T): V | T
export function get<V, T>(x: qt.ByStr<V>, k: string, v0: T): V | T
export function get<V>(x: Array<V>, i: number): V | undefined
export function get<V>(x: qt.ByStr<V>, k: string): V | undefined
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

export function merge<T>(x: T, ...xs: Array<Iterable<unknown> | Iterable<[unknown, unknown]> | qt.ByStr>): T {
  return mergeWithSources(x, xs)
}

export function mergeWith<T>(
  f: (old: unknown, v: unknown, k: unknown) => unknown,
  x: T,
  ...xs: Array<Iterable<unknown> | Iterable<[unknown, unknown]> | qt.ByStr>
): T {
  return mergeWithSources(x, xs, f)
}

export function mergeDeep<T>(x: T, ...xs: Array<Iterable<unknown> | Iterable<[unknown, unknown]> | qt.ByStr>): T {
  return mergeDeepWithSources(x, xs)
}

export function mergeDeepWith<T>(
  f: (old: unknown, newVal: unknown, key: unknown) => unknown,
  x: T,
  ...xs: Array<Iterable<unknown> | Iterable<[unknown, unknown]> | qt.ByStr>
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
  const C = isArray ? Collection.ByIdx : Collection.ByKey
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
    C.from(xs[i]).forEach(mergeItem)
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
  const a2 = Seq.from(a)
  const b2 = Seq.from(b)
  return qu.isIndexed(a2) === qu.isIndexed(b2) && qu.isKeyed(a2) === qu.isKeyed(b2)
}

export function remove<K, T extends qt.Collection<K, unknown>>(x: T, k: K): T
export function remove<T extends Array<unknown>>(x: T, k: number): T
export function remove<T extends object, U extends qt.Record<T>, K extends keyof T>(x: U, k: K): U
export function remove<T extends qt.ByStr, K extends keyof T>(x: T, k: K): T
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
export function set<V, T extends qt.ByStr<V>>(x: T, k: string, v: V): T
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
export function update<V, T extends qt.ByStr<V>, K extends keyof T>(x: T, k: K, f: (v: V) => V): qt.ByStr<V>
export function update<V, T extends qt.ByStr<V>, K extends keyof T, V0>(
  x: T,
  k: K,
  v0: V0,
  f: (v: V | V0) => V
): qt.ByStr<V>
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
    const y = Collection.ByKey.from(xs[i])
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
  this.__loop((v, k) => {
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

export function reify<K, V>(x: qt.Collection<K, V>, x2: unknown) {
  return x === x2 ? x : qu.isSeq(x) ? x2 : x.constructor(x2)
}

export function concat<K, V>(x: qt.Collection<K, V>, xs: any[]) {
  const isKeyed = qu.isKeyed(x)
  const ys = [x]
    .concat(xs)
    .map(v => {
      if (!qu.isCollection(v)) v = isKeyed ? seqKeyedFrom(v) : seqIndexedFrom(Array.isArray(v) ? v : [v])
      else if (isKeyed) v = Collection.ByKey.from(v)
      return v
    })
    .filter(v => v.size !== 0)
  if (ys.length === 0) return x
  if (ys.length === 1) {
    const y = ys[0]
    if (y === x || (isKeyed && qu.isKeyed(y)) || (qu.isIndexed(x) && qu.isIndexed(y))) return y
  }
  let y = new ArrSeq(ys)
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
  y.__loopUncached = function (f2: Function, reverse?: boolean) {
    let y = 0
    this.__loop((v: V, k: K, c) => {
      if (f.call(ctx, v, k, c)) {
        y++
        return f2(v, useKeys ? k : y - 1, this)
      }
    }, reverse)
    return y
  }
  y.__iterUncached = function (m: qu.Iter.Mode, reverse?: boolean) {
    const iter = this.__iter(qu.Iter.Mode.ENTRIES, reverse)
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

export function flip<K, V>(x: qt.Collection<K, V>) {
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
  y.__loopUncached = function (f, reverse: boolean) {
    return x.__loop((v: V, k: K) => f(k, v, this) !== false, reverse)
  }
  y.__iterUncached = function (m: qu.Iter.Mode, reverse: boolean) {
    if (m === qu.Iter.Mode.ENTRIES) {
      const iter = x.__iter(m, reverse)
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
    return x.__iter(m === qu.Iter.Mode.VALUES ? qu.Iter.Mode.KEYS : qu.Iter.Mode.VALUES, reverse)
  }
  return y
}

export function map<K, V>(x: qt.Collection<K, V>, f: Function, ctx?: unknown) {
  const y = makeSequence(x)
  y.size = x.size
  y.has = (k: K) => x.has(k)
  y.get = (k: K, v0?: V) => {
    const v = x.get(k, qu.NOT_SET)
    return v === qu.NOT_SET ? v0 : f.call(ctx, v, k, x)
  }
  y.__loopUncached = function (f2: Function, reverse: boolean) {
    return x.__loop((v, k, c) => f2(f.call(ctx, v, k, c), k, this) !== false, reverse)
  }
  y.__iterUncached = function (m: qu.Iter.Mode, reverse: boolean) {
    const iter = x.__iter(qu.Iter.Mode.ENTRIES, reverse)
    return new qu.Iter(() => {
      const i = iter.next()
      if (i.done) return i
      const [k, v] = i.value
      return qu.Iter.value(m, k, f.call(ctx, v, k, x), i)
    })
  }
  return y
}

export function reverseFactory<K, V>(x: qt.Collection<K, V>, useKeys: boolean) {
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
  y.has = (k: K) => x.has(useKeys ? k : -1 - k)
  y.get = (k: K, v0?: unknown) => x.get(useKeys ? k : -1 - k, v0)
  y.includes = (v: V) => x.includes(v)
  y.cacheResult = cacheResult
  y.__loop = function (f: Function, reverse: boolean) {
    let i = 0
    reverse && qu.ensureSize(x)
    return x.__loop((v, k) => f(v, useKeys ? k : reverse ? this.size - ++i : i++, this), !reverse)
  }
  y.__iter = (m: qu.Iter.Mode, reverse: boolean) => {
    let i = 0
    reverse && qu.ensureSize(x)
    const iter = x.__iter(qu.Iter.Mode.ENTRIES, !reverse)
    return new qu.Iter(() => {
      const i = iter.next()
      if (i.done) return i
      const [k, v] = i.value
      return qu.Iter.value(m, useKeys ? k : reverse ? this.size - ++i : i++, v, i)
    })
  }
  return y
}

export function slice<K, V>(x: qt.Collection<K, V>, beg?: number, end?: number, useKeys?: boolean) {
  const s0 = x.size!
  if (qu.wholeSlice(beg, end, s0)) return x
  const b2 = qu.resolveBegin(beg, s0)
  const e2 = qu.resolveEnd(end, s0)
  if (b2 !== b2 || e2 !== e2) return slice(x.toSeq().cacheResult(), beg, end, useKeys)
  const s2 = e2 - b2
  const sliceSize = s2 < 0 ? 0 : s2
  const y = makeSequence(x)
  y.size = sliceSize === 0 ? sliceSize : (x.size && sliceSize) || undefined
  if (!useKeys && qu.isSeq(x) && sliceSize >= 0) {
    y.get = function (i: number, v0: unknown) {
      i = qu.wrapIndex(this, i)
      return i >= 0 && i < sliceSize ? x.get(i + b2, v0) : v0
    }
  }
  y.__loopUncached = function (f: Function, reverse: boolean) {
    if (sliceSize === 0) return 0
    if (reverse) return this.cacheResult().__loop(f, reverse)
    let skipped = 0
    let isSkipping = true
    let y = 0
    x.__loop((v: V, k: K) => {
      if (!(isSkipping && (isSkipping = skipped++ < b2))) {
        y++
        return f(v, useKeys ? k : y - 1, this) !== false && y !== sliceSize
      }
      return
    })
    return y
  }
  y.__iterUncached = function (m: qu.Iter.Mode, reverse: boolean) {
    if (sliceSize !== 0 && reverse) return this.cacheResult().__iter(m, reverse)
    if (sliceSize === 0) return new qu.Iter(qu.Iter.done)
    const iter = x.__iter(m, reverse)
    let skipped = 0
    let n = 0
    return new qu.Iter(() => {
      while (skipped++ < b2) {
        iter.next()
      }
      if (++n > sliceSize) return qu.Iter.done()
      const i = iter.next()
      if (useKeys || m === qu.Iter.Mode.VALUES || i.done) return i
      if (m === qu.Iter.Mode.KEYS) return qu.Iter.value(m, n - 1, undefined, i)
      return qu.Iter.value(m, n - 1, i.value[1], i)
    })
  }
  return y
}

export function takeWhile<K, V>(x: qt.Collection<K, V>, f: Function, ctx?: unknown) {
  const y = makeSequence(x)
  y.__loopUncached = function (f2: Function, reverse: boolean) {
    if (reverse) return this.cacheResult().__loop(f, reverse)
    let y = 0
    x.__loop((v: V, k: K, c) => f.call(ctx, v, k, c) && ++y && f2(v, k, this))
    return y
  }
  y.__iterUncached = function (m: qu.Iter.Mode, reverse: boolean) {
    if (reverse) return this.cacheResult().__iter(m, reverse)
    const iter = x.__iter(qu.Iter.Mode.ENTRIES, reverse)
    let iterating = true
    return new qu.Iter(() => {
      if (!iterating) return qu.Iter.done()
      const i = iter.next()
      if (i.done) return i
      const [k, v] = i.value
      if (!f.call(ctx, v, k, this)) {
        iterating = false
        return qu.Iter.done()
      }
      return m === qu.Iter.Mode.ENTRIES ? i : qu.Iter.value(m, k, v, i)
    })
  }
  return y
}

export function skipWhile<K, V>(x: qt.Collection<K, V>, f: Function, ctx?: unknown, useKeys?: boolean) {
  const y = makeSequence(x)
  y.__loopUncached = function (f2: Function, reverse: boolean) {
    if (reverse) return this.cacheResult().__loop(f2, reverse)
    let isSkipping = true
    let y = 0
    x.__loop((v: V, k: K, c) => {
      if (!(isSkipping && (isSkipping = f.call(ctx, v, k, c)))) {
        y++
        return f2(v, useKeys ? k : y - 1, this)
      }
    })
    return y
  }
  y.__iterUncached = function (m: qu.Iter.Mode, reverse: boolean) {
    if (reverse) return this.cacheResult().__iter(m, reverse)
    const iter = x.__iter(qu.Iter.Mode.ENTRIES, reverse)
    let skipping = true
    let n = 0
    return new qu.Iter(() => {
      let i, k, v
      do {
        i = iter.next()
        if (i.done) {
          if (useKeys || m === qu.Iter.Mode.VALUES) return i
          if (m === qu.Iter.Mode.KEYS) return qu.Iter.value(m, n++, undefined, i)
          return qu.Iter.value(m, n++, i.value[1], i)
        }
        const [k, v] = i.value
        skipping && (skipping = f.call(ctx, v, k, this))
      } while (skipping)
      return m === qu.Iter.Mode.ENTRIES ? i : qu.Iter.value(m, k, v, i)
    })
  }
  return y
}

export function flatten<K, V>(x: qt.Collection<K, V>, depth?: number, useKeys?: boolean) {
  const y = makeSequence(x)
  y.__loopUncached = function (f: Function, reverse: boolean) {
    if (reverse) return this.cacheResult().__loop(f, reverse)
    let y = 0
    let stopped = false
    function flat(x2: any, depth2: number) {
      x2.__loop((v: V, k: K) => {
        if ((!depth || depth2 < depth) && qu.isCollection(v)) flat(v, depth2 + 1)
        else {
          y++
          if (f(v, useKeys ? k : y - 1, y) === false) stopped = true
        }
        return !stopped
      }, reverse)
    }
    flat(x, 0)
    return y
  }
  y.__iterUncached = function (m: qu.Iter.Mode, reverse: boolean) {
    if (reverse) return this.cacheResult().__iter(m, reverse)
    let iter = x.__iter(m, reverse)
    const stack: any[] = []
    let n = 0
    return new qu.Iter(() => {
      while (iter) {
        const i = iter.next()
        if (i.done !== false) {
          iter = stack.pop()
          continue
        }
        let v = i.value
        if (m === qu.Iter.Mode.ENTRIES) v = v[1]
        if ((!depth || stack.length < depth) && qu.isCollection(v)) {
          stack.push(iter)
          iter = v.__iter(m, reverse)
        } else return useKeys ? i : qu.Iter.value(m, n++, v, i)
      }
      return qu.Iter.done()
    })
  }
  return y
}

export function flatMap<K, V>(x: qt.Collection<K, V>, f: Function, ctx?: unknown) {
  const C = collectionClass(x)
  return x
    .toSeq()
    .map((v, k) => C.from(f.call(ctx, v, k, x)))
    .flatten(true)
}

export function interpose<K, V>(x: qt.Collection<K, V>, sep: string) {
  const y = makeSequence(x)
  y.size = x.size && x.size * 2 - 1
  y.__loopUncached = function (f: Function, reverse: boolean) {
    let y = 0
    x.__loop((v: V) => (!y || f(sep, y++, this) !== false) && f(v, y++, this) !== false, reverse)
    return y
  }
  y.__iterUncached = function (m: qu.Iter.Mode, reverse: boolean) {
    const iter = x.__iter(qu.Iter.Mode.VALUES, reverse)
    let n = 0
    let i: any
    return new qu.Iter(() => {
      if (!i || n % 2) {
        i = iter.next()
        if (i.done) return i
      }
      return n % 2 ? qu.Iter.value(m, n++, sep) : qu.Iter.value(m, n++, i.value, i)
    })
  }
  return y
}

export function sort<K, V>(x: qt.Collection<K, V>, c?: Function, f?: Function) {
  if (!c) c = defaultComp
  const isKeyed = qu.isKeyed(x)
  let index = 0
  const y = x
    .toSeq()
    .map((v, k) => [k, v, index++, f ? f(v, k, x) : v])
    .valueSeq()
    .toArray()
  y.sort((a, b) => c!(a[3], b[3]) || a[2] - b[2]).forEach(
    isKeyed
      ? (_, i) => {
          y[i]!.length = 2
        }
      : (v, i) => {
          y[i] = v[1]
        }
  )
  return isKeyed ? Seq.ByKey.from(y) : qu.isIndexed(x) ? Seq.ByIdx.from(y) : Seq.ByVal.from(y)
}

export function max<K, V>(x: qt.Collection<K, V>, c?: Function, f?: Function) {
  if (!c) c = defaultComp
  if (f) {
    const y = x
      .toSeq()
      .map((v, k) => [v, f(v, k, x)])
      .reduce((a: any, b: any) => (maxComp(c, a[1], b[1]) ? b : a))
    return y && y[0]
  }
  return x.reduce((a, b) => (maxComp(c, a, b) ? b : a))
}

export function zipWith<K, V>(x: qt.Collection<K, V>, f: Function, xs: any, zipAll?: boolean) {
  const y = makeSequence(x)
  const sizes = new ArrSeq(xs).map((x2: any) => x2.size)
  y.size = zipAll ? sizes.max() : sizes.min()
  y.__loop = function (f2: Function, reverse: boolean) {
    const iter = this.__iter(qu.Iter.Mode.VALUES, reverse)
    let i
    let y = 0
    while (!(i = iter.next()).done) {
      if (f2(i.value, y++, this) === false) break
    }
    return y
  }
  y.__iterUncached = function (m: qu.Iter.Mode, reverse: boolean) {
    const iters = xs.map(x => ((x = Collection.from(x)), qu.callIter(reverse ? x.reverse() : x)))
    let n = 0
    let done = false
    return new qu.Iter(() => {
      let steps
      if (!done) {
        steps = iters.map(x => x.next())
        done = zipAll ? steps.every(x => x.done) : steps.some(x => x.done)
      }
      if (done) return qu.Iter.done()
      return qu.Iter.value(m, n++, f(...steps.map(x => x.value)))
    })
  }
  return y
}

function collectionClass(x: unknown) {
  return qu.isKeyed(x) ? Collection.ByKey : qu.isIndexed(x) ? Collection.ByIdx : Collection.ByVal
}

function makeSequence(x: unknown): any {
  return new (qu.isKeyed(x) ? Seq.ByKey : qu.isIndexed(x) ? Seq.ByIdx : Seq.ByVal)()
}

export function cacheResult(x) {
  if (x._iter.cacheResult) {
    x._iter.cacheResult()
    x.size = x._iter.size
    return x
  }
  return Seq.prototype.cacheResult.call(x)
}

function defaultComp(a?: number, b?: number) {
  if (a === undefined && b === undefined) return 0
  if (a === undefined) return 1
  if (b === undefined) return -1
  return a > b ? 1 : a < b ? -1 : 0
}

export function defaultNegComp(a?: number, b?: number) {
  if (a === undefined && b === undefined) return 0
  if (a === undefined) return -1
  if (b === undefined) return 1
  return a < b ? 1 : a > b ? -1 : 0
}

function maxComp(c?: Function, a?: number, b?: number) {
  const y = c?.(b, a)
  return (y === 0 && b !== a && (b === undefined || b === null || b !== b)) || y > 0
}
