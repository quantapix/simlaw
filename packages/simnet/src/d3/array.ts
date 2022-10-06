import * as qt from "./types.js"
var array = Array.prototype
export const slice = array.slice
export const map = array.map
export function ascending(a: qt.Primitive | undefined, b: qt.Primitive | undefined): number
export function ascending(a, b) {
  return a == null || b == null ? NaN : a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN
}
export function bin(): qt.HistogramGeneratorNumber<number, number>
export function bin<T, V extends number | undefined>(): qt.HistogramGeneratorNumber<T, V>
export function bin<T, V extends Date | undefined>(): qt.HistogramGeneratorDate<T, V>
export function bin() {
  var value = identity,
    domain = extent,
    threshold = sturges
  function histogram(data) {
    if (!Array.isArray(data)) data = Array.from(data)
    var i,
      n = data.length,
      x,
      step,
      values = new Array(n)
    for (i = 0; i < n; ++i) {
      values[i] = value(data[i], i, data)
    }
    var xz = domain(values),
      x0 = xz[0],
      x1 = xz[1],
      tz = threshold(values, x0, x1)
    if (!Array.isArray(tz)) {
      const max = x1,
        tn = +tz
      if (domain === extent) [x0, x1] = nice(x0, x1, tn)
      tz = ticks(x0, x1, tn)
      if (tz[0] <= x0) step = tickIncrement(x0, x1, tn)
      if (tz[tz.length - 1] >= x1) {
        if (max >= x1 && domain === extent) {
          const step = tickIncrement(x0, x1, tn)
          if (isFinite(step)) {
            if (step > 0) {
              x1 = (Math.floor(x1 / step) + 1) * step
            } else if (step < 0) {
              x1 = (Math.ceil(x1 * -step) + 1) / -step
            }
          }
        } else {
          tz.pop()
        }
      }
    }
    var m = tz.length
    while (tz[0] <= x0) tz.shift(), --m
    while (tz[m - 1] > x1) tz.pop(), --m
    var bins = new Array(m + 1),
      bin
    for (i = 0; i <= m; ++i) {
      bin = bins[i] = []
      bin.x0 = i > 0 ? tz[i - 1] : x0
      bin.x1 = i < m ? tz[i] : x1
    }
    if (isFinite(step)) {
      if (step > 0) {
        for (i = 0; i < n; ++i) {
          if ((x = values[i]) != null && x0 <= x && x <= x1) {
            bins[Math.min(m, Math.floor((x - x0) / step))].push(data[i])
          }
        }
      } else if (step < 0) {
        for (i = 0; i < n; ++i) {
          if ((x = values[i]) != null && x0 <= x && x <= x1) {
            const j = Math.floor((x0 - x) * step)
            bins[Math.min(m, j + (tz[j] <= x))].push(data[i]) // handle off-by-one due to rounding
          }
        }
      }
    } else {
      for (i = 0; i < n; ++i) {
        if ((x = values[i]) != null && x0 <= x && x <= x1) {
          bins[bisect(tz, x, 0, m)].push(data[i])
        }
      }
    }
    return bins
  }
  histogram.value = function (_) {
    return arguments.length ? ((value = typeof _ === "function" ? _ : constant(_)), histogram) : value
  }
  histogram.domain = function (_) {
    return arguments.length ? ((domain = typeof _ === "function" ? _ : constant([_[0], _[1]])), histogram) : domain
  }
  histogram.thresholds = function (_) {
    return arguments.length
      ? ((threshold = typeof _ === "function" ? _ : Array.isArray(_) ? constant(slice.call(_)) : constant(_)),
        histogram)
      : threshold
  }
  return histogram
}
const ascendingBisect = bisector(ascending)
export function bisectLeft(xs: ArrayLike<number>, x: number, lo?: number, hi?: number): number
export function bisectLeft(xs: ArrayLike<string>, x: string, lo?: number, hi?: number): number
export function bisectLeft(xs: ArrayLike<Date>, x: Date, lo?: number, hi?: number): number
//export function bisectLeft = ascendingBisect.left
export function bisectRight(xs: ArrayLike<number>, x: number, lo?: number, hi?: number): number
export function bisectRight(xs: ArrayLike<string>, x: string, lo?: number, hi?: number): number
export function bisectRight(xs: ArrayLike<Date>, x: Date, lo?: number, hi?: number): number
//export function bisectRight = ascendingBisect.right
export function bisectCenter(xs: ArrayLike<number>, x: number, lo?: number, hi?: number): number
export function bisectCenter(xs: ArrayLike<string>, x: string, lo?: number, hi?: number): number
export function bisectCenter(xs: ArrayLike<Date>, x: Date, lo?: number, hi?: number): number
//export function bisectCenter = bisector(number).center
//export const bisect: typeof bisectRight
export function bisector<T, U>(comparator: (a: T, b: U) => number): qt.Bisector<T, U>
export function bisector<T, U>(f: (x: T) => U): qt.Bisector<T, U>
export function bisector(f) {
  let compare1, compare2, delta
  if (f.length !== 2) {
    compare1 = ascending
    compare2 = (d, x) => ascending(f(d), x)
    delta = (d, x) => f(d) - x
  } else {
    compare1 = f === ascending || f === descending ? f : zero
    compare2 = f
    delta = f
  }
  function left(a, x, lo = 0, hi = a.length) {
    if (lo < hi) {
      if (compare1(x, x) !== 0) return hi
      do {
        const mid = (lo + hi) >>> 1
        if (compare2(a[mid], x) < 0) lo = mid + 1
        else hi = mid
      } while (lo < hi)
    }
    return lo
  }
  function right(a, x, lo = 0, hi = a.length) {
    if (lo < hi) {
      if (compare1(x, x) !== 0) return hi
      do {
        const mid = (lo + hi) >>> 1
        if (compare2(a[mid], x) <= 0) lo = mid + 1
        else hi = mid
      } while (lo < hi)
    }
    return lo
  }
  function center(a, x, lo = 0, hi = a.length) {
    const i = left(a, x, lo, hi - 1)
    return i > lo && delta(a[i - 1], x) > -delta(a[i], x) ? i - 1 : i
  }
  return { left, center, right }
}
function zero() {
  return 0
}
export function blur(values, r) {
  if (!((r = +r) >= 0)) throw new RangeError("invalid r")
  let length = values.length
  if (!((length = Math.floor(length)) >= 0)) throw new RangeError("invalid length")
  if (!length || !r) return values
  const blur = blurf(r)
  const temp = values.slice()
  blur(values, temp, 0, length, 1)
  blur(temp, values, 0, length, 1)
  blur(values, temp, 0, length, 1)
  return values
}
export const blur2 = Blur2(blurf)
export const blurImage = Blur2(blurfImage)
function Blur2(blur) {
  return function (data, rx, ry = rx) {
    if (!((rx = +rx) >= 0)) throw new RangeError("invalid rx")
    if (!((ry = +ry) >= 0)) throw new RangeError("invalid ry")
    let { data: values, width, height } = data
    if (!((width = Math.floor(width)) >= 0)) throw new RangeError("invalid width")
    if (!((height = Math.floor(height !== undefined ? height : values.length / width)) >= 0))
      throw new RangeError("invalid height")
    if (!width || !height || (!rx && !ry)) return data
    const blurx = rx && blur(rx)
    const blury = ry && blur(ry)
    const temp = values.slice()
    if (blurx && blury) {
      blurh(blurx, temp, values, width, height)
      blurh(blurx, values, temp, width, height)
      blurh(blurx, temp, values, width, height)
      blurv(blury, values, temp, width, height)
      blurv(blury, temp, values, width, height)
      blurv(blury, values, temp, width, height)
    } else if (blurx) {
      blurh(blurx, values, temp, width, height)
      blurh(blurx, temp, values, width, height)
      blurh(blurx, values, temp, width, height)
    } else if (blury) {
      blurv(blury, values, temp, width, height)
      blurv(blury, temp, values, width, height)
      blurv(blury, values, temp, width, height)
    }
    return data
  }
}
function blurh(blur, T, S, w, h) {
  for (let y = 0, n = w * h; y < n; ) {
    blur(T, S, y, (y += w), 1)
  }
}
function blurv(blur, T, S, w, h) {
  for (let x = 0, n = w * h; x < w; ++x) {
    blur(T, S, x, x + n, w)
  }
}
function blurfImage(radius) {
  const blur = blurf(radius)
  return (T, S, start, stop, step) => {
    ;(start <<= 2), (stop <<= 2), (step <<= 2)
    blur(T, S, start + 0, stop + 0, step)
    blur(T, S, start + 1, stop + 1, step)
    blur(T, S, start + 2, stop + 2, step)
    blur(T, S, start + 3, stop + 3, step)
  }
}
function blurf(radius) {
  const radius0 = Math.floor(radius)
  if (radius0 === radius) return bluri(radius)
  const t = radius - radius0
  const w = 2 * radius + 1
  return (T, S, start, stop, step) => {
    if (!((stop -= step) >= start)) return // inclusive stop
    let sum = radius0 * S[start]
    const s0 = step * radius0
    const s1 = s0 + step
    for (let i = start, j = start + s0; i < j; i += step) {
      sum += S[Math.min(stop, i)]
    }
    for (let i = start, j = stop; i <= j; i += step) {
      sum += S[Math.min(stop, i + s0)]
      T[i] = (sum + t * (S[Math.max(start, i - s1)] + S[Math.min(stop, i + s1)])) / w
      sum -= S[Math.max(start, i - s0)]
    }
  }
}
function bluri(radius) {
  const w = 2 * radius + 1
  return (T, S, start, stop, step) => {
    if (!((stop -= step) >= start)) return // inclusive stop
    let sum = radius * S[start]
    const s = step * radius
    for (let i = start, j = start + s; i < j; i += step) {
      sum += S[Math.min(stop, i)]
    }
    for (let i = start, j = stop; i <= j; i += step) {
      sum += S[Math.min(stop, i + s)]
      T[i] = sum / w
      sum -= S[Math.max(start, i - s)]
    }
  }
}
export function constant(x) {
  return () => x
}
export function count(xs: Iterable<unknown>): number
export function count<T>(xs: Iterable<T>, accessor: (a: T, b: T) => number | null | undefined): number
export function count(values, valueof) {
  let count = 0
  if (valueof === undefined) {
    for (let value of values) {
      if (value != null && (value = +value) >= value) {
        ++count
      }
    }
  } else {
    let index = -1
    for (let value of values) {
      if ((value = valueof(value, ++index, values)) != null && (value = +value) >= value) {
        ++count
      }
    }
  }
  return count
}
function length(array) {
  return array.length | 0
}
function empty(length) {
  return !(length > 0)
}
function arrayify(values) {
  return typeof values !== "object" || "length" in values ? values : Array.from(values)
}
function reducer(reduce) {
  return values => reduce(...values)
}
export function cross<S, T>(a: Iterable<S>, b: Iterable<T>): Array<[S, T]>
export function cross<S, T, U>(a: Iterable<S>, b: Iterable<T>, reducer: (a: S, b: T) => U): U[]
export function cross(...values) {
  const reduce = typeof values[values.length - 1] === "function" && reducer(values.pop())
  values = values.map(arrayify)
  const lengths = values.map(length)
  const j = values.length - 1
  const index = new Array(j + 1).fill(0)
  const product = []
  if (j < 0 || lengths.some(empty)) return product
  while (true) {
    product.push(index.map((j, i) => values[i][j]))
    let i = j
    while (++index[i] === lengths[i]) {
      if (i === 0) return reduce ? product.map(reduce) : product
      index[i--] = 0
    }
  }
}
export function cumsum(iterable: Iterable<qt.Numeric | undefined | null>): Float64Array
export function cumsum<T>(
  iterable: Iterable<T>,
  accessor: (element: T, i: number, array: Iterable<T>) => number | undefined | null
): Float64Array
export function cumsum(values, valueof) {
  let sum = 0,
    index = 0
  return Float64Array.from(
    values,
    valueof === undefined ? v => (sum += +v || 0) : v => (sum += +valueof(v, index++, values) || 0)
  )
}
export function descending(a: qt.Primitive | undefined, b: qt.Primitive | undefined): number
export function descending(a, b) {
  return a == null || b == null ? NaN : b < a ? -1 : b > a ? 1 : b >= a ? 0 : NaN
}
export function deviation(xs: Iterable<Numeric | undefined | null>): number | undefined
export function deviation<T>(
  xs: Iterable<T>,
  f: (x: T, i: number, xs: Iterable<T>) => number | undefined | null
): number | undefined
export function deviation(values, valueof) {
  const v = variance(values, valueof)
  return v ? Math.sqrt(v) : v
}
export function difference<T>(xs: Iterable<T>, ...others: Array<Iterable<T>>): qt.InternSet<T>
export function difference(values, ...others) {
  values = new qt.InternSet(values)
  for (const other of others) {
    for (const value of other) {
      values.delete(value)
    }
  }
  return values
}
export function disjoint<T>(a: Iterable<T>, b: Iterable<T>): boolean
export function disjoint(values, other) {
  const iterator = other[Symbol.iterator](),
    set = new qt.InternSet()
  for (const v of values) {
    if (set.has(v)) return false
    let value, done
    while (({ value, done } = iterator.next())) {
      if (done) break
      if (Object.is(v, value)) return false
      set.add(value)
    }
  }
  return true
}
export function every<T>(xs: Iterable<T>, test: (value: T, i: number, xs: Iterable<T>) => unknown): boolean
export function every(values, test) {
  if (typeof test !== "function") throw new TypeError("test is not a function")
  let index = -1
  for (const value of values) {
    if (!test(value, ++index, values)) {
      return false
    }
  }
  return true
}
export function extent(xs: Iterable<string>): [string, string] | [undefined, undefined]
export function extent<T extends qt.Numeric>(xs: Iterable<T>): [T, T] | [undefined, undefined]
export function extent<T>(
  xs: Iterable<T>,
  f: (x: T, i: number, xs: Iterable<T>) => string | undefined | null
): [string, string] | [undefined, undefined]
export function extent<T, U extends qt.Numeric>(
  xs: Iterable<T>,
  f: (x: T, i: number, xs: Iterable<T>) => U | undefined | null
): [U, U] | [undefined, undefined]
export function extent(values, valueof) {
  let min
  let max
  if (valueof === undefined) {
    for (const value of values) {
      if (value != null) {
        if (min === undefined) {
          if (value >= value) min = max = value
        } else {
          if (min > value) min = value
          if (max < value) max = value
        }
      }
    }
  } else {
    let index = -1
    for (let value of values) {
      if ((value = valueof(value, ++index, values)) != null) {
        if (min === undefined) {
          if (value >= value) min = max = value
        } else {
          if (min > value) min = value
          if (max < value) max = value
        }
      }
    }
  }
  return [min, max]
}
export function filter<T>(xs: Iterable<T>, test: (value: T, i: number, xs: Iterable<T>) => unknown): T[]
export function filter(values, test) {
  if (typeof test !== "function") throw new TypeError("test is not a function")
  const array = []
  let index = -1
  for (const value of values) {
    if (test(value, ++index, values)) {
      array.push(value)
    }
  }
  return array
}
export class Adder implements qt.Adder {
  constructor() {
    this._partials = new Float64Array(32)
    this._n = 0
  }
  add(x) {
    const p = this._partials
    let i = 0
    for (let j = 0; j < this._n && j < 32; j++) {
      const y = p[j],
        hi = x + y,
        lo = Math.abs(x) < Math.abs(y) ? x - (hi - y) : y - (hi - x)
      if (lo) p[i++] = lo
      x = hi
    }
    p[i] = x
    this._n = i + 1
    return this
  }
  valueOf() {
    const p = this._partials
    let n = this._n,
      x,
      y,
      lo,
      hi = 0
    if (n > 0) {
      hi = p[--n]
      while (n > 0) {
        x = hi
        y = p[--n]
        hi = x + y
        lo = y - (hi - x)
        if (lo) break
      }
      if (n > 0 && ((lo < 0 && p[n - 1] < 0) || (lo > 0 && p[n - 1] > 0))) {
        y = lo * 2
        x = hi + y
        if (y == x - hi) hi = x
      }
    }
    return hi
  }
}
export function fsum(xs: Iterable<Numeric | undefined | null>): number
export function fsum<T>(xs: Iterable<T>, f: (x: T, i: number, xs: Iterable<T>) => number | undefined | null): number
export function fsum(values, valueof) {
  const adder = new Adder()
  if (valueof === undefined) {
    for (let value of values) {
      if ((value = +value)) {
        adder.add(value)
      }
    }
  } else {
    let index = -1
    for (let value of values) {
      if ((value = +valueof(value, ++index, values))) {
        adder.add(value)
      }
    }
  }
  return +adder
}
export function fcumsum(xs: Iterable<Numeric | undefined | null>): Float64Array
export function fcumsum<T>(
  xs: Iterable<T>,
  f: (x: T, i: number, xs: Iterable<T>) => number | undefined | null
): Float64Array
export function fcumsum(values, valueof) {
  const adder = new Adder()
  let index = -1
  return Float64Array.from(
    values,
    valueof === undefined ? v => adder.add(+v || 0) : v => adder.add(+valueof(v, ++index, values) || 0)
  )
}
export function greatest<T>(xs: Iterable<T>, comparator?: (a: T, b: T) => number): T | undefined
export function greatest<T>(xs: Iterable<T>, accessor: (a: T) => unknown): T | undefined
export function greatest(values, compare = ascending) {
  let max
  let defined = false
  if (compare.length === 1) {
    let maxValue
    for (const element of values) {
      const value = compare(element)
      if (defined ? ascending(value, maxValue) > 0 : ascending(value, value) === 0) {
        max = element
        maxValue = value
        defined = true
      }
    }
  } else {
    for (const value of values) {
      if (defined ? compare(value, max) > 0 : compare(value, value) === 0) {
        max = value
        defined = true
      }
    }
  }
  return max
}
export function greatestIndex(xs: Iterable<unknown>): number | undefined
export function greatestIndex<T>(xs: Iterable<T>, f: (a: T, b: T) => number): number | undefined
export function greatestIndex<T>(xs: Iterable<T>, f: (a: T) => unknown): number | undefined
export function greatestIndex(xs: any, f = ascending) {
  if (f.length === 1) return maxIndex(xs, f)
  let max
  let y = -1
  let i = -1
  for (const x of xs) {
    ++i
    if (y < 0 ? f(x, x) === 0 : f(x, max) > 0) {
      max = x
      y = i
    }
  }
  return y
}
export function group<T, K>(xs: Iterable<T>, key: (x: T) => K): qt.InternMap<K, T[]>
export function group<T, K1, K2>(
  xs: Iterable<T>,
  key1: (x: T) => K1,
  key2: (x: T) => K2
): qt.InternMap<K1, qt.InternMap<K2, T[]>>
export function group<T, K1, K2, K3>(
  xs: Iterable<T>,
  key1: (x: T) => K1,
  key2: (x: T) => K2,
  key3: (x: T) => K3
): qt.InternMap<K1, qt.InternMap<K2, qt.InternMap<K3, T[]>>>
export function group(values, ...keys) {
  return nest(values, identity, identity, keys)
}
export function groups<T, K>(xs: Iterable<T>, key: (x: T) => K): Array<[K, T[]]>
export function groups<T, K1, K2>(
  xs: Iterable<T>,
  key1: (x: T) => K1,
  key2: (x: T) => K2
): Array<[K1, Array<[K2, T[]]>]>
export function groups<T, K1, K2, K3>(
  xs: Iterable<T>,
  key1: (x: T) => K1,
  key2: (x: T) => K2,
  key3: (x: T) => K3
): Array<[K1, Array<[K2, Array<[K3, T[]]>]>]>
export function groups(xs, ...ks) {
  return nest(xs, Array.from, identity, ks)
}
function flatten(groups, keys) {
  for (let i = 1, n = keys.length; i < n; ++i) {
    groups = groups.flatMap(g => g.pop().map(([key, value]) => [...g, key, value]))
  }
  return groups
}
export function flatGroup<T, K>(xs: Iterable<T>, key: (x: T) => K): Array<[K, T[]]>
export function flatGroup<T, K1, K2>(xs: Iterable<T>, key1: (x: T) => K1, key2: (x: T) => K2): Array<[K1, K2, T[]]>
export function flatGroup<T, K1, K2, K3>(
  xs: Iterable<T>,
  key1: (x: T) => K1,
  key2: (x: T) => K2,
  key3: (x: T) => K3
): Array<[K1, K2, K3, T[]]>
export function flatGroup(values, ...keys) {
  return flatten(groups(values, ...keys), keys)
}
export function flatRollup<T, R, K>(xs: Iterable<T>, reduce: (value: T[]) => R, key: (x: T) => K): Array<[K, R]>
export function flatRollup<T, R, K1, K2>(
  xs: Iterable<T>,
  reduce: (value: T[]) => R,
  key1: (x: T) => K1,
  key2: (x: T) => K2
): Array<[K1, K2, R]>
export function flatRollup<T, R, K1, K2, K3>(
  xs: Iterable<T>,
  reduce: (value: T[]) => R,
  key1: (x: T) => K1,
  key2: (x: T) => K2,
  key3: (x: T) => K3
): Array<[K1, K2, K3, R]>
export function flatRollup(values, reduce, ...keys) {
  return flatten(rollups(values, reduce, ...keys), keys)
}
export function rollup<T, R, K>(xs: Iterable<T>, reduce: (value: T[]) => R, key: (x: T) => K): qt.InternMap<K, R>
export function rollup<T, R, K1, K2>(
  xs: Iterable<T>,
  reduce: (value: T[]) => R,
  key1: (x: T) => K1,
  key2: (x: T) => K2
): qt.InternMap<K1, qt.InternMap<K2, R>>
export function rollup<T, R, K1, K2, K3>(
  xs: Iterable<T>,
  reduce: (value: T[]) => R,
  key1: (x: T) => K1,
  key2: (x: T) => K2,
  key3: (x: T) => K3
): qt.InternMap<K1, qt.InternMap<K2, qt.InternMap<K3, R>>>
export function rollup(values, reduce, ...keys) {
  return nest(values, identity, reduce, keys)
}
export function rollups<T, R, K>(xs: Iterable<T>, reduce: (value: T[]) => R, key: (x: T) => K): Array<[K, R]>
export function rollups<T, R, K1, K2>(
  xs: Iterable<T>,
  reduce: (value: T[]) => R,
  key1: (x: T) => K1,
  key2: (x: T) => K2
): Array<[K1, Array<[K2, R]>]>
export function rollups<T, R, K1, K2, K3>(
  xs: Iterable<T>,
  reduce: (value: T[]) => R,
  key1: (x: T) => K1,
  key2: (x: T) => K2,
  key3: (x: T) => K3
): Array<[K1, Array<[K2, Array<[K3, R]>]>]>
export function rollups(values, reduce, ...keys) {
  return nest(values, Array.from, reduce, keys)
}
export function index<T, K>(xs: Iterable<T>, key: (x: T) => K): qt.InternMap<K, T>
export function index<T, K1, K2>(
  xs: Iterable<T>,
  key1: (x: T) => K1,
  key2: (x: T) => K2
): qt.InternMap<K1, qt.InternMap<K2, T>>
export function index<T, K1, K2, K3>(
  xs: Iterable<T>,
  key1: (x: T) => K1,
  key2: (x: T) => K2,
  key3: (x: T) => K3
): qt.InternMap<K1, qt.InternMap<K2, qt.InternMap<K3, T>>>
export function index(values, ...keys) {
  return nest(values, identity, unique, keys)
}
export function indexes<T, K>(xs: Iterable<T>, key: (x: T) => K): Array<[K, T]>
export function indexes<T, K1, K2>(xs: Iterable<T>, key1: (x: T) => K1, key2: (x: T) => K2): Array<[K1, Array<[K2, T]>]>
export function indexes<T, K1, K2, K3>(
  xs: Iterable<T>,
  key1: (x: T) => K1,
  key2: (x: T) => K2,
  key3: (x: T) => K3
): Array<[K1, Array<[K2, Array<[K3, T]>]>]>
export function indexes(values, ...keys) {
  return nest(values, Array.from, unique, keys)
}
function unique(values) {
  if (values.length !== 1) throw new Error("duplicate key")
  return values[0]
}
function nest(values, map, reduce, ks: any[]) {
  return (function regroup(values, i) {
    if (i >= ks.length) return reduce(values)
    const groups = new qt.InternMap()
    const keyof = ks[i++]
    let index = -1
    for (const value of values) {
      const key = keyof(value, ++index, values)
      const group = groups.get(key)
      if (group) group.push(value)
      else groups.set(key, [value])
    }
    for (const [key, values] of groups) {
      groups.set(key, regroup(values, i))
    }
    return map(groups)
  })(values, 0)
}
export function groupSort<T, K>(xs: Iterable<T>, comparator: (a: T[], b: T[]) => number, key: (x: T) => K): K[]
export function groupSort<T, K>(xs: Iterable<T>, accessor: (value: T[]) => unknown, key: (x: T) => K): K[]
export function groupSort(values, reduce, key) {
  return (
    reduce.length !== 2
      ? sort(rollup(values, reduce, key), ([ak, av], [bk, bv]) => ascending(av, bv) || ascending(ak, bk))
      : sort(group(values, key), ([ak, av], [bk, bv]) => reduce(av, bv) || ascending(ak, bk))
  ).map(([key]) => key)
}
export function identity(x) {
  return x
}
export function intersection<T>(...xs: Array<Iterable<T>>): qt.InternSet<T>
export function intersection(values, ...others) {
  values = new qt.InternSet(values)
  others = others.map(set)
  out: for (const value of values) {
    for (const other of others) {
      if (!other.has(value)) {
        values.delete(value)
        continue out
      }
    }
  }
  return values
}
function set(values) {
  return values instanceof qt.InternSet ? values : new qt.InternSet(values)
}
export function least<T>(xs: Iterable<T>, comparator?: (a: T, b: T) => number): T | undefined
export function least<T>(xs: Iterable<T>, accessor: (a: T) => unknown): T | undefined
export function least(values, compare = ascending) {
  let min
  let defined = false
  if (compare.length === 1) {
    let minValue
    for (const element of values) {
      const value = compare(element)
      if (defined ? ascending(value, minValue) < 0 : ascending(value, value) === 0) {
        min = element
        minValue = value
        defined = true
      }
    }
  } else {
    for (const value of values) {
      if (defined ? compare(value, min) < 0 : compare(value, value) === 0) {
        min = value
        defined = true
      }
    }
  }
  return min
}
export function leastIndex(xs: Iterable<unknown>): number | undefined
export function leastIndex<T>(xs: Iterable<T>, comparator: (a: T, b: T) => number): number | undefined
export function leastIndex<T>(xs: Iterable<T>, accessor: (a: T) => unknown): number | undefined
export function leastIndex(values, compare = ascending) {
  if (compare.length === 1) return minIndex(values, compare)
  let minValue
  let min = -1
  let index = -1
  for (const value of values) {
    ++index
    if (min < 0 ? compare(value, value) === 0 : compare(value, minValue) < 0) {
      minValue = value
      min = index
    }
  }
  return min
}
export function map<T, U>(xs: Iterable<T>, mapper: (value: T, i: number, xs: Iterable<T>) => U): U[]
export function map(values, mapper) {
  if (typeof values[Symbol.iterator] !== "function") throw new TypeError("values is not iterable")
  if (typeof mapper !== "function") throw new TypeError("mapper is not a function")
  return Array.from(values, (value, index) => mapper(value, index, values))
}
export function max(xs: Iterable<string>): string | undefined
export function max<T extends qt.Numeric>(xs: Iterable<T>): T | undefined
export function max<T>(
  xs: Iterable<T>,
  f: (x: T, i: number, xs: Iterable<T>) => string | undefined | null
): string | undefined
export function max<T, U extends qt.Numeric>(
  xs: Iterable<T>,
  f: (x: T, i: number, xs: Iterable<T>) => U | undefined | null
): U | undefined
export function max(values, valueof) {
  let max
  if (valueof === undefined) {
    for (const value of values) {
      if (value != null && (max < value || (max === undefined && value >= value))) {
        max = value
      }
    }
  } else {
    let index = -1
    for (let value of values) {
      if ((value = valueof(value, ++index, values)) != null && (max < value || (max === undefined && value >= value))) {
        max = value
      }
    }
  }
  return max
}
export function maxIndex(xs: Iterable<unknown>): number
export function maxIndex<T>(xs: Iterable<T>, f: (x: T, i: number, xs: Iterable<T>) => unknown): number
export function maxIndex(values, valueof) {
  let max
  let maxIndex = -1
  let index = -1
  if (valueof === undefined) {
    for (const value of values) {
      ++index
      if (value != null && (max < value || (max === undefined && value >= value))) {
        ;(max = value), (maxIndex = index)
      }
    }
  } else {
    for (let value of values) {
      if ((value = valueof(value, ++index, values)) != null && (max < value || (max === undefined && value >= value))) {
        ;(max = value), (maxIndex = index)
      }
    }
  }
  return maxIndex
}
export function mean(xs: Iterable<qt.Numeric | undefined | null>): number | undefined
export function mean<T>(
  xs: Iterable<T>,
  f: (x: T, i: number, xs: Iterable<T>) => number | undefined | null
): number | undefined
export function mean(values, valueof) {
  let count = 0
  let sum = 0
  if (valueof === undefined) {
    for (let value of values) {
      if (value != null && (value = +value) >= value) {
        ++count, (sum += value)
      }
    }
  } else {
    let index = -1
    for (let value of values) {
      if ((value = valueof(value, ++index, values)) != null && (value = +value) >= value) {
        ++count, (sum += value)
      }
    }
  }
  if (count) return sum / count
}
export function median(xs: Iterable<qt.Numeric | undefined | null>): number | undefined
export function median<T>(
  xs: Iterable<T>,
  f: (x: T, i: number, xs: Iterable<T>) => number | undefined | null
): number | undefined
export function median(values, valueof) {
  return quantile(values, 0.5, valueof)
}
export function medianIndex(values, valueof) {
  return quantileIndex(values, 0.5, valueof)
}
function* flatten(arrays) {
  for (const array of arrays) {
    yield* array
  }
}
export function merge<T>(xs: Iterable<Iterable<T>>): T[] {
  return Array.from(flatten(xs))
}
export function min(xs: Iterable<string>): string | undefined
export function min<T extends qt.Numeric>(xs: Iterable<T>): T | undefined
export function min<T>(
  xs: Iterable<T>,
  f: (x: T, i: number, xs: Iterable<T>) => string | undefined | null
): string | undefined
export function min<T, U extends qt.Numeric>(
  xs: Iterable<T>,
  f: (x: T, i: number, xs: Iterable<T>) => U | undefined | null
): U | undefined
export function min(values, valueof) {
  let min
  if (valueof === undefined) {
    for (const value of values) {
      if (value != null && (min > value || (min === undefined && value >= value))) {
        min = value
      }
    }
  } else {
    let index = -1
    for (let value of values) {
      if ((value = valueof(value, ++index, values)) != null && (min > value || (min === undefined && value >= value))) {
        min = value
      }
    }
  }
  return min
}
export function minIndex(xs: Iterable<unknown>): number
export function minIndex<T>(xs: Iterable<T>, f: (x: T, i: number, xs: Iterable<T>) => unknown): number
export function minIndex(xs: Iterable<unknown>): number
export function minIndex(values, valueof) {
  let min
  let minIndex = -1
  let index = -1
  if (valueof === undefined) {
    for (const value of values) {
      ++index
      if (value != null && (min > value || (min === undefined && value >= value))) {
        ;(min = value), (minIndex = index)
      }
    }
  } else {
    for (let value of values) {
      if ((value = valueof(value, ++index, values)) != null && (min > value || (min === undefined && value >= value))) {
        ;(min = value), (minIndex = index)
      }
    }
  }
  return minIndex
}
export function mode(xs: Iterable<qt.Numeric | undefined | null>): number
export function mode<T>(xs: Iterable<T>, f: (x: T, i: number, xs: Iterable<T>) => number | undefined | null): number
export function mode(values, valueof) {
  const counts = new qt.InternMap()
  if (valueof === undefined) {
    for (let value of values) {
      if (value != null && value >= value) {
        counts.set(value, (counts.get(value) || 0) + 1)
      }
    }
  } else {
    let index = -1
    for (let value of values) {
      if ((value = valueof(value, ++index, values)) != null && value >= value) {
        counts.set(value, (counts.get(value) || 0) + 1)
      }
    }
  }
  let modeValue
  let modeCount = 0
  for (const [value, count] of counts) {
    if (count > modeCount) {
      modeCount = count
      modeValue = value
    }
  }
  return modeValue
}
export function nice(start: number, stop: number, count: number): [number, number]
export function nice(start, stop, count) {
  let prestep
  while (true) {
    const step = tickIncrement(start, stop, count)
    if (step === prestep || step === 0 || !isFinite(step)) {
      return [start, stop]
    } else if (step > 0) {
      start = Math.floor(start / step) * step
      stop = Math.ceil(stop / step) * step
    } else if (step < 0) {
      start = Math.ceil(start * step) / step
      stop = Math.floor(stop * step) / step
    }
    prestep = step
  }
}
export function number(x) {
  return x === null ? NaN : +x
}
export function* numbers(values, valueof) {
  if (valueof === undefined) {
    for (let value of values) {
      if (value != null && (value = +value) >= value) {
        yield value
      }
    }
  } else {
    let index = -1
    for (let value of values) {
      if ((value = valueof(value, ++index, values)) != null && (value = +value) >= value) {
        yield value
      }
    }
  }
}
export function pairs<T, U>(xs: Iterable<T>, reducer: (a: T, b: T) => U): U[]
export function pairs<T>(xs: Iterable<T>): Array<[T, T]>
export function pairs(values, pairof = pair) {
  const pairs = []
  let previous
  let first = false
  for (const value of values) {
    if (first) pairs.push(pairof(previous, value))
    previous = value
    first = true
  }
  return pairs
}
export function pair(a, b) {
  return [a, b]
}
export function permute<T, K extends keyof T>(source: T, keys: Iterable<K>): Array<T[K]>
export function permute<T>(source: { [key: number]: T }, keys: Iterable<number>): T[]
export function permute(source, keys) {
  return Array.from(keys, key => source[key])
}
export function quantile(xs: Iterable<qt.Numeric | undefined | null>, p: number): number | undefined
export function quantile<T>(
  xs: Iterable<T>,
  p: number,
  f: (x: T, i: number, xs: Iterable<T>) => number | undefined | null
): number | undefined
export function quantile(values, p, valueof) {
  values = Float64Array.from(numbers(values, valueof))
  if (!(n = values.length)) return
  if ((p = +p) <= 0 || n < 2) return min(values)
  if (p >= 1) return max(values)
  var n,
    i = (n - 1) * p,
    i0 = Math.floor(i),
    value0 = max(quickselect(values, i0).subarray(0, i0 + 1)),
    value1 = min(values.subarray(i0 + 1))
  return value0 + (value1 - value0) * (i - i0)
}
export function quantileSorted(xs: Array<qt.Numeric | undefined | null>, p: number): number | undefined
export function quantileSorted<T>(
  xs: T[],
  p: number,
  f: (x: T, i: number, xs: T[]) => number | undefined | null
): number | undefined
export function quantileSorted(values, p, valueof = number) {
  if (!(n = values.length)) return
  if ((p = +p) <= 0 || n < 2) return +valueof(values[0], 0, values)
  if (p >= 1) return +valueof(values[n - 1], n - 1, values)
  var n,
    i = (n - 1) * p,
    i0 = Math.floor(i),
    value0 = +valueof(values[i0], i0, values),
    value1 = +valueof(values[i0 + 1], i0 + 1, values)
  return value0 + (value1 - value0) * (i - i0)
}
export function quantileIndex(values, p, valueof) {
  values = Float64Array.from(numbers(values, valueof))
  if (!(n = values.length)) return
  if ((p = +p) <= 0 || n < 2) return minIndex(values)
  if (p >= 1) return maxIndex(values)
  var n,
    i = Math.floor((n - 1) * p),
    order = (i, j) => ascendingDefined(values[i], values[j]),
    index = quickselect(
      Uint32Array.from(values, (_, i) => i),
      i,
      0,
      n - 1,
      order
    )
  return greatest(index.subarray(0, i + 1), i => values[i])
}
export function quickselect<T>(
  xs: ArrayLike<T>,
  k: number,
  left?: number,
  right?: number,
  compare?: (a: Primitive | undefined, b: Primitive | undefined) => number
): T[]
export function quickselect(array, k, left = 0, right = array.length - 1, compare) {
  compare = compare === undefined ? ascendingDefined : compareDefined(compare)
  while (right > left) {
    if (right - left > 600) {
      const n = right - left + 1
      const m = k - left + 1
      const z = Math.log(n)
      const s = 0.5 * Math.exp((2 * z) / 3)
      const sd = 0.5 * Math.sqrt((z * s * (n - s)) / n) * (m - n / 2 < 0 ? -1 : 1)
      const newLeft = Math.max(left, Math.floor(k - (m * s) / n + sd))
      const newRight = Math.min(right, Math.floor(k + ((n - m) * s) / n + sd))
      quickselect(array, k, newLeft, newRight, compare)
    }
    const t = array[k]
    let i = left
    let j = right
    swap(array, left, k)
    if (compare(array[right], t) > 0) swap(array, left, right)
    while (i < j) {
      swap(array, i, j), ++i, --j
      while (compare(array[i], t) < 0) ++i
      while (compare(array[j], t) > 0) --j
    }
    if (compare(array[left], t) === 0) swap(array, left, j)
    else ++j, swap(array, j, right)
    if (j <= k) left = j + 1
    if (k <= j) right = j - 1
  }
  return array
}
function swap(array, i, j) {
  const t = array[i]
  array[i] = array[j]
  array[j] = t
}
export function range(start: number, stop: number, step?: number): number[]
export function range(stop: number): number[]
export function range(start, stop, step) {
  ;(start = +start),
    (stop = +stop),
    (step = (n = arguments.length) < 2 ? ((stop = start), (start = 0), 1) : n < 3 ? 1 : +step)
  var i = -1,
    n = Math.max(0, Math.ceil((stop - start) / step)) | 0,
    range = new Array(n)
  while (++i < n) {
    range[i] = start + i * step
  }
  return range
}
export function rank(xs: Iterable<Numeric | undefined | null>): Float64Array
export function rank<T>(
  xs: Iterable<T>,
  accessorOrComparator:
    | ((x: T, i: number, xs: Iterable<T>) => number | undefined | null)
    | ((a: T, b: T) => number | undefined | null)
): Float64Array
export function rank(values, valueof = ascending) {
  if (typeof values[Symbol.iterator] !== "function") throw new TypeError("values is not iterable")
  let V = Array.from(values)
  const R = new Float64Array(V.length)
  if (valueof.length !== 2) (V = V.map(valueof)), (valueof = ascending)
  const compareIndex = (i, j) => valueof(V[i], V[j])
  let k, r
  Uint32Array.from(V, (_, i) => i)
    .sort(valueof === ascending ? (i, j) => ascendingDefined(V[i], V[j]) : compareDefined(compareIndex))
    .forEach((j, i) => {
      const c = compareIndex(j, k === undefined ? j : k)
      if (c >= 0) {
        if (k === undefined || c > 0) (k = j), (r = i)
        R[j] = r
      } else {
        R[j] = NaN
      }
    })
  return R
}
export function reduce<T>(
  xs: Iterable<T>,
  f: (previousValue: T, currentValue: T, currentIndex: number, xs: Iterable<T>) => T,
  initialValue?: T
): T
export function reduce<T, U>(
  xs: Iterable<T>,
  f: (previousValue: U, currentValue: T, currentIndex: number, xs: Iterable<T>) => U,
  initialValue: U
): U
export function reduce(values, reducer, value) {
  if (typeof reducer !== "function") throw new TypeError("reducer is not a function")
  const iterator = values[Symbol.iterator]()
  let done,
    next,
    index = -1
  if (arguments.length < 3) {
    ;({ done, value } = iterator.next())
    if (done) return
    ++index
  }
  while ((({ done, value: next } = iterator.next()), !done)) {
    value = reducer(value, next, ++index, values)
  }
  return value
}
export function reverse<T>(xs: Iterable<T>): T[]
export function reverse(values) {
  if (typeof values[Symbol.iterator] !== "function") throw new TypeError("values is not iterable")
  return Array.from(values).reverse()
}
export function scan(values, compare) {
  const i = leastIndex(values, compare)
  return i < 0 ? undefined : i
}
class Shuffler {
  constructor(private rand: () => number) {}
  shuffle<T>(xs: T[], lo?: number, hi?: number): T[]
  shuffle(xs: Int8Array, lo?: number, hi?: number): Int8Array
  shuffle(xs: Uint8Array, lo?: number, hi?: number): Uint8Array
  shuffle(xs: Uint8ClampedArray, lo?: number, hi?: number): Uint8ClampedArray
  shuffle(xs: Int16Array, lo?: number, hi?: number): Int16Array
  shuffle(xs: Uint16Array, lo?: number, hi?: number): Uint16Array
  shuffle(xs: Int32Array, lo?: number, hi?: number): Int32Array
  shuffle(xs: Uint32Array, lo?: number, hi?: number): Uint32Array
  shuffle(xs: Float32Array, lo?: number, hi?: number): Float32Array
  shuffle(xs: Float64Array, lo?: number, hi?: number): Float64Array
  shuffle(xs: any, lo = 0, hi = xs.length) {
    let m = hi - (lo = +lo)
    while (m) {
      const i = (this.rand() * m--) | 0
      const x = xs[m + lo]
      xs[m + lo] = xs[i + lo]
      xs[i + lo] = x
    }
    return xs
  }
}
export const shuffle = new Shuffler(Math.random).shuffle
export function some<T>(xs: Iterable<T>, test: (value: T, i: number, xs: Iterable<T>) => unknown): boolean
export function some(values, test) {
  if (typeof test !== "function") throw new TypeError("test is not a function")
  let index = -1
  for (const value of values) {
    if (test(value, ++index, values)) {
      return true
    }
  }
  return false
}
export function sort<T>(xs: Iterable<T>, ...accessors: Array<(a: T) => unknown>): T[]
export function sort<T>(xs: Iterable<T>, comparator?: (a: T, b: T) => number): T[]
export function sort(values, ...F) {
  if (typeof values[Symbol.iterator] !== "function") throw new TypeError("values is not iterable")
  values = Array.from(values)
  let [f] = F
  if ((f && f.length !== 2) || F.length > 1) {
    const index = Uint32Array.from(values, (d, i) => i)
    if (F.length > 1) {
      F = F.map(f => values.map(f))
      index.sort((i, j) => {
        for (const f of F) {
          const c = ascendingDefined(f[i], f[j])
          if (c) return c
        }
      })
    } else {
      f = values.map(f)
      index.sort((i, j) => ascendingDefined(f[i], f[j]))
    }
    return permute(values, index)
  }
  return values.sort(compareDefined(f))
}
export function compareDefined(compare = ascending) {
  if (compare === ascending) return ascendingDefined
  if (typeof compare !== "function") throw new TypeError("compare is not a function")
  return (a, b) => {
    const x = compare(a, b)
    if (x || x === 0) return x
    return (compare(b, b) === 0) - (compare(a, a) === 0)
  }
}
export function ascendingDefined(a, b) {
  return (a == null || !(a >= a)) - (b == null || !(b >= b)) || (a < b ? -1 : a > b ? 1 : 0)
}
export function subset<T>(a: Iterable<T>, b: Iterable<T>): boolean
export function subset(values, other) {
  return superset(other, values)
}
export function sum(xs: Iterable<qt.Numeric | undefined | null>): number
export function sum<T>(xs: Iterable<T>, f: (x: T, i: number, xs: Iterable<T>) => number | undefined | null): number
export function sum(values, valueof) {
  let sum = 0
  if (valueof === undefined) {
    for (let value of values) {
      if ((value = +value)) {
        sum += value
      }
    }
  } else {
    let index = -1
    for (let value of values) {
      if ((value = +valueof(value, ++index, values))) {
        sum += value
      }
    }
  }
  return sum
}
export function superset<T>(a: Iterable<T>, b: Iterable<T>): boolean
export function superset(values, other) {
  const iterator = values[Symbol.iterator](),
    set = new Set()
  for (const o of other) {
    const io = intern(o)
    if (set.has(io)) continue
    let value, done
    while (({ value, done } = iterator.next())) {
      if (done) return false
      const ivalue = intern(value)
      set.add(ivalue)
      if (Object.is(io, ivalue)) break
    }
  }
  return true
}
function intern(value) {
  return value !== null && typeof value === "object" ? value.valueOf() : value
}
let e10 = Math.sqrt(50),
  e5 = Math.sqrt(10),
  e2 = Math.sqrt(2)
export function ticks(start: number, stop: number, count: number): number[]
export function ticks(start, stop, count) {
  var reverse,
    i = -1,
    n,
    ticks,
    step
  ;(stop = +stop), (start = +start), (count = +count)
  if (start === stop && count > 0) return [start]
  if ((reverse = stop < start)) (n = start), (start = stop), (stop = n)
  if ((step = tickIncrement(start, stop, count)) === 0 || !isFinite(step)) return []
  if (step > 0) {
    let r0 = Math.round(start / step),
      r1 = Math.round(stop / step)
    if (r0 * step < start) ++r0
    if (r1 * step > stop) --r1
    ticks = new Array((n = r1 - r0 + 1))
    while (++i < n) ticks[i] = (r0 + i) * step
  } else {
    step = -step
    let r0 = Math.round(start * step),
      r1 = Math.round(stop * step)
    if (r0 / step < start) ++r0
    if (r1 / step > stop) --r1
    ticks = new Array((n = r1 - r0 + 1))
    while (++i < n) ticks[i] = (r0 + i) / step
  }
  if (reverse) ticks.reverse()
  return ticks
}
export function tickIncrement(start: number, stop: number, count: number): number
export function tickIncrement(start, stop, count) {
  var step = (stop - start) / Math.max(0, count),
    power = Math.floor(Math.log(step) / Math.LN10),
    error = step / Math.pow(10, power)
  return power >= 0
    ? (error >= e10 ? 10 : error >= e5 ? 5 : error >= e2 ? 2 : 1) * Math.pow(10, power)
    : -Math.pow(10, -power) / (error >= e10 ? 10 : error >= e5 ? 5 : error >= e2 ? 2 : 1)
}
export function tickStep(start: number, stop: number, count: number): number
export function tickStep(start, stop, count) {
  var step0 = Math.abs(stop - start) / Math.max(0, count),
    step1 = Math.pow(10, Math.floor(Math.log(step0) / Math.LN10)),
    error = step0 / step1
  if (error >= e10) step1 *= 10
  else if (error >= e5) step1 *= 5
  else if (error >= e2) step1 *= 2
  return stop < start ? -step1 : step1
}
export function transpose<T>(matrix: ArrayLike<ArrayLike<T>>): T[][]
export function transpose(matrix) {
  if (!(n = matrix.length)) return []
  for (var i = -1, m = min(matrix, length), transpose = new Array(m); ++i < m; ) {
    for (var j = -1, n, row = (transpose[i] = new Array(n)); ++j < n; ) {
      row[j] = matrix[j][i]
    }
  }
  return transpose
}
function length(d) {
  return d.length
}
export function union<T>(...xs: Array<Iterable<T>>): qt.InternSet<T>
export function union(...others) {
  const set = new qt.InternSet()
  for (const other of others) {
    for (const o of other) {
      set.add(o)
    }
  }
  return set
}
export function variance(xs: Iterable<Numeric | undefined | null>): number | undefined
export function variance<T>(
  xs: Iterable<T>,
  f: (x: T, i: number, xs: Iterable<T>) => number | undefined | null
): number | undefined
export function variance(values, valueof) {
  let count = 0
  let delta
  let mean = 0
  let sum = 0
  if (valueof === undefined) {
    for (let value of values) {
      if (value != null && (value = +value) >= value) {
        delta = value - mean
        mean += delta / ++count
        sum += delta * (value - mean)
      }
    }
  } else {
    let index = -1
    for (let value of values) {
      if ((value = valueof(value, ++index, values)) != null && (value = +value) >= value) {
        delta = value - mean
        mean += delta / ++count
        sum += delta * (value - mean)
      }
    }
  }
  if (count > 1) return sum / (count - 1)
}
export function zip<T>(...arrays: Array<ArrayLike<T>>): T[][]
export function zip() {
  return transpose(arguments)
}
export function thresholdFreedmanDiaconis(xs: ArrayLike<number | undefined>, min: number, max: number): number
export function thresholdFreedmanDiaconis(values, min, max) {
  return Math.ceil(
    (max - min) / (2 * (quantile(values, 0.75) - quantile(values, 0.25)) * Math.pow(count(values), -1 / 3))
  )
}
export function thresholdScott(xs: ArrayLike<number | undefined>, min: number, max: number): number
export function thresholdScott(values, min, max) {
  return Math.ceil(((max - min) * Math.cbrt(count(values))) / (3.49 * deviation(values)))
}
export function thresholdSturges(xs: ArrayLike<number | undefined>): number
export function thresholdSturges(values) {
  return Math.ceil(Math.log(count(values)) / Math.LN2) + 1
}
