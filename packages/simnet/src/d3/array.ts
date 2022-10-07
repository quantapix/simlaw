import * as qt from "./types.js"

const array = Array.prototype
export const slice = array.slice
export const map = array.map

export function ascending(a: qt.Primitive | undefined, b: qt.Primitive | undefined): number {
  return a == null || b == null ? NaN : a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN
}
export function bin(): qt.HistogramGeneratorNumber<number, number>
export function bin<T, V extends number | undefined>(): qt.HistogramGeneratorNumber<T, V>
export function bin<T, V extends Date | undefined>(): qt.HistogramGeneratorDate<T, V>
export function bin() {
  let value = identity,
    domain = extent,
    threshold = sturges
  function histogram(data) {
    if (!Array.isArray(data)) data = Array.from(data)
    let i,
      n = data.length,
      x,
      step,
      values = new Array(n)
    for (i = 0; i < n; ++i) {
      values[i] = value(data[i], i, data)
    }
    let xz = domain(values),
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
    let m = tz.length
    while (tz[0] <= x0) tz.shift(), --m
    while (tz[m - 1] > x1) tz.pop(), --m
    let bins = new Array(m + 1),
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
export function bisector<T, U>(f: (a: T, b: U) => number): qt.Bisector<T, U>
export function bisector<T, U>(f: (x: T) => U): qt.Bisector<T, U>
export function bisector(f: Function) {
  let compare1: Function, compare2: Function, delta: Function
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
    if (!((stop -= step) >= start)) return
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
    if (!((stop -= step) >= start)) return
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
export function constant(x: any) {
  return () => x
}
export function count(xs: Iterable<unknown>): number
export function count<T>(xs: Iterable<T>, f: (a: T, b: T) => number | null | undefined): number
export function count(xs: any, f?: Function) {
  let y = 0
  if (f === undefined) {
    for (let x of xs) {
      if (x != null && (x = +x) >= x) ++y
    }
  } else {
    let i = -1
    for (let x of xs) {
      if ((x = f(x, ++i, xs)) != null && (x = +x) >= x) ++y
    }
  }
  return y
}
function length(x: any) {
  return x.length | 0
}
function empty(length) {
  return !(length > 0)
}
function arrayify(xs) {
  return typeof xs !== "object" || "length" in xs ? xs : Array.from(xs)
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
export function deviation(xs: Iterable<qt.Numeric | undefined | null>): number | undefined
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
export function disjoint<T>(xs: Iterable<T>, other: Iterable<T>): boolean {
  const it = other[Symbol.iterator]()
  const y = new qt.InternSet()
  for (const x of xs) {
    if (y.has(x)) return false
    let value, done
    while (({ value, done } = it.next())) {
      if (done) break
      if (Object.is(x, value)) return false
      y.add(value)
    }
  }
  return true
}
export function every<T>(xs: Iterable<T>, f: (x: T, i: number, xs: Iterable<T>) => unknown) {
  if (typeof f !== "function") throw new TypeError("test is not a function")
  let i = -1
  for (const x of xs) {
    if (!f(x, ++i, xs)) return false
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
export function extent(xs: any, f?: Function) {
  let min
  let max
  if (f === undefined) {
    for (const x of xs) {
      if (x != null) {
        if (min === undefined) {
          if (x >= x) min = max = x
        } else {
          if (min > x) min = x
          if (max < x) max = x
        }
      }
    }
  } else {
    let i = -1
    for (let x of xs) {
      if ((x = f(x, ++i, xs)) != null) {
        if (min === undefined) {
          if (x >= x) min = max = x
        } else {
          if (min > x) min = x
          if (max < x) max = x
        }
      }
    }
  }
  return [min, max]
}
export function filter<T>(xs: Iterable<T>, f: (x: T, i: number, xs: Iterable<T>) => unknown): T[] {
  if (typeof f !== "function") throw new TypeError("test is not a function")
  const y = []
  let i = -1
  for (const x of xs) {
    if (f(x, ++i, xs)) y.push(x)
  }
  return y
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
export function fsum(xs: Iterable<qt.Numeric | undefined | null>): number
export function fsum<T>(xs: Iterable<T>, f: (x: T, i: number, xs: Iterable<T>) => number | undefined | null): number
export function fsum(xs: any, f?: Function) {
  const y = new Adder()
  if (f === undefined) {
    for (let x of xs) {
      if ((x = +x)) y.add(x)
    }
  } else {
    let i = -1
    for (let x of xs) {
      if ((x = +f(x, ++i, xs))) y.add(x)
    }
  }
  return +y
}
export function fcumsum(xs: Iterable<qt.Numeric | undefined | null>): Float64Array
export function fcumsum<T>(
  xs: Iterable<T>,
  f: (x: T, i: number, xs: Iterable<T>) => number | undefined | null
): Float64Array
export function fcumsum(xs: any, f?: Function) {
  const adder = new Adder()
  let i = -1
  return Float64Array.from(xs, f === undefined ? v => adder.add(+v || 0) : v => adder.add(+f(v, ++i, xs) || 0))
}
export function greatest<T>(xs: Iterable<T>, comparator?: (a: T, b: T) => number): T | undefined
export function greatest<T>(xs: Iterable<T>, accessor: (a: T) => unknown): T | undefined
export function greatest(xs: any, f: Function = ascending) {
  let y
  let defined = false
  if (f.length === 1) {
    let max
    for (const x of xs) {
      const x2 = f(x)
      if (defined ? ascending(x2, max) > 0 : ascending(x2, x2) === 0) {
        y = x
        max = x2
        defined = true
      }
    }
  } else {
    for (const x of xs) {
      if (defined ? f(x, y) > 0 : f(x, x) === 0) {
        y = x
        defined = true
      }
    }
  }
  return y
}
export function greatestIndex(xs: Iterable<unknown>): number | undefined
export function greatestIndex<T>(xs: Iterable<T>, f: (a: T, b: T) => number): number | undefined
export function greatestIndex<T>(xs: Iterable<T>, f: (a: T) => unknown): number | undefined
export function greatestIndex(xs: any, f: Function = ascending) {
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
export function group<T, K>(xs: Iterable<T>, k: (x: T) => K): qt.InternMap<K, T[]>
export function group<T, K1, K2>(
  xs: Iterable<T>,
  k1: (x: T) => K1,
  k2: (x: T) => K2
): qt.InternMap<K1, qt.InternMap<K2, T[]>>
export function group<T, K1, K2, K3>(
  xs: Iterable<T>,
  k1: (x: T) => K1,
  k2: (x: T) => K2,
  k3: (x: T) => K3
): qt.InternMap<K1, qt.InternMap<K2, qt.InternMap<K3, T[]>>>
export function group(xs: any, ...ks: any) {
  return nest(xs, identity, identity, ks)
}
export function groups<T, K>(xs: Iterable<T>, k: (x: T) => K): Array<[K, T[]]>
export function groups<T, K1, K2>(xs: Iterable<T>, k1: (x: T) => K1, k2: (x: T) => K2): Array<[K1, Array<[K2, T[]]>]>
export function groups<T, K1, K2, K3>(
  xs: Iterable<T>,
  k1: (x: T) => K1,
  k2: (x: T) => K2,
  k3: (x: T) => K3
): Array<[K1, Array<[K2, Array<[K3, T[]]>]>]>
export function groups(xs: any, ...ks: any) {
  return nest(xs, Array.from, identity, ks)
}
function flatten(xs, ks) {
  for (let i = 1, n = ks.length; i < n; ++i) {
    xs = xs.flatMap(x => x.pop().map(([k, v]) => [...x, k, v]))
  }
  return xs
}
export function flatGroup<T, K>(xs: Iterable<T>, k: (x: T) => K): Array<[K, T[]]>
export function flatGroup<T, K1, K2>(xs: Iterable<T>, k1: (x: T) => K1, k2: (x: T) => K2): Array<[K1, K2, T[]]>
export function flatGroup<T, K1, K2, K3>(
  xs: Iterable<T>,
  k1: (x: T) => K1,
  k2: (x: T) => K2,
  k3: (x: T) => K3
): Array<[K1, K2, K3, T[]]>
export function flatGroup(xs: any, ...ks: any) {
  return flatten(groups(xs, ...ks), ks)
}
export function flatRollup<T, R, K>(xs: Iterable<T>, f: (x: T[]) => R, k: (x: T) => K): Array<[K, R]>
export function flatRollup<T, R, K1, K2>(
  xs: Iterable<T>,
  f: (x: T[]) => R,
  k1: (x: T) => K1,
  k2: (x: T) => K2
): Array<[K1, K2, R]>
export function flatRollup<T, R, K1, K2, K3>(
  xs: Iterable<T>,
  f: (x: T[]) => R,
  k1: (x: T) => K1,
  k2: (x: T) => K2,
  k3: (x: T) => K3
): Array<[K1, K2, K3, R]>
export function flatRollup(xs: any, f: Function, ...ks: any) {
  return flatten(rollups(xs, f, ...ks), ks)
}
export function rollup<T, R, K>(xs: Iterable<T>, f: (x: T[]) => R, k: (x: T) => K): qt.InternMap<K, R>
export function rollup<T, R, K1, K2>(
  xs: Iterable<T>,
  f: (x: T[]) => R,
  k1: (x: T) => K1,
  k2: (x: T) => K2
): qt.InternMap<K1, qt.InternMap<K2, R>>
export function rollup<T, R, K1, K2, K3>(
  xs: Iterable<T>,
  f: (x: T[]) => R,
  k1: (x: T) => K1,
  k2: (x: T) => K2,
  k3: (x: T) => K3
): qt.InternMap<K1, qt.InternMap<K2, qt.InternMap<K3, R>>>
export function rollup(xs: any, f: Function, ...ks: any) {
  return nest(xs, identity, f, ks)
}
export function rollups<T, R, K>(xs: Iterable<T>, f: (x: T[]) => R, k: (x: T) => K): Array<[K, R]>
export function rollups<T, R, K1, K2>(
  xs: Iterable<T>,
  f: (x: T[]) => R,
  k1: (x: T) => K1,
  k2: (x: T) => K2
): Array<[K1, Array<[K2, R]>]>
export function rollups<T, R, K1, K2, K3>(
  xs: Iterable<T>,
  f: (x: T[]) => R,
  k1: (x: T) => K1,
  k2: (x: T) => K2,
  k3: (x: T) => K3
): Array<[K1, Array<[K2, Array<[K3, R]>]>]>
export function rollups(xs: any, f: Function, ...ks: any) {
  return nest(xs, Array.from, f, ks)
}
export function index<T, K>(xs: Iterable<T>, k: (x: T) => K): qt.InternMap<K, T>
export function index<T, K1, K2>(
  xs: Iterable<T>,
  k1: (x: T) => K1,
  k2: (x: T) => K2
): qt.InternMap<K1, qt.InternMap<K2, T>>
export function index<T, K1, K2, K3>(
  xs: Iterable<T>,
  k1: (x: T) => K1,
  k2: (x: T) => K2,
  k3: (x: T) => K3
): qt.InternMap<K1, qt.InternMap<K2, qt.InternMap<K3, T>>>
export function index(xs: any, ...ks: any) {
  return nest(xs, identity, unique, ks)
}
export function indexes<T, K>(xs: Iterable<T>, k: (x: T) => K): Array<[K, T]>
export function indexes<T, K1, K2>(xs: Iterable<T>, k1: (x: T) => K1, k2: (x: T) => K2): Array<[K1, Array<[K2, T]>]>
export function indexes<T, K1, K2, K3>(
  xs: Iterable<T>,
  k1: (x: T) => K1,
  k2: (x: T) => K2,
  k3: (x: T) => K3
): Array<[K1, Array<[K2, Array<[K3, T]>]>]>
export function indexes(xs: any, ...ks: any) {
  return nest(xs, Array.from, unique, ks)
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
export function groupSort<T, K>(xs: Iterable<T>, f: (a: T[], b: T[]) => number, key: (x: T) => K): K[]
export function groupSort<T, K>(xs: Iterable<T>, f: (x: T[]) => unknown, key: (x: T) => K): K[]
export function groupSort(xs: any, f: Function, key: Function) {
  return (
    f.length !== 2
      ? sort(rollup(xs, f, key), ([ak, av], [bk, bv]) => ascending(av, bv) || ascending(ak, bk))
      : sort(group(xs, key), ([ak, av], [bk, bv]) => f(av, bv) || ascending(ak, bk))
  ).map(([key]) => key)
}
export function identity(x: any) {
  return x
}
export function intersection<T>(...xs: Array<Iterable<T>>): qt.InternSet<T>
export function intersection(x: any, ...xs: any) {
  const ys = new qt.InternSet(x)
  xs = xs.map(set)
  out: for (const y of ys) {
    for (const x of xs) {
      if (!x.has(y)) {
        ys.delete(y)
        continue out
      }
    }
  }
  return ys
}
function set(xs: any) {
  return xs instanceof qt.InternSet ? xs : new qt.InternSet(xs)
}
export function least<T>(xs: Iterable<T>, f?: (a: T, b: T) => number): T | undefined
export function least<T>(xs: Iterable<T>, f: (a: T) => unknown): T | undefined
export function least(xs: any, f: Function = ascending) {
  let y
  let defined = false
  if (f.length === 1) {
    let min
    for (const x of xs) {
      const x2 = f(x)
      if (defined ? ascending(x2, min) < 0 : ascending(x2, x2) === 0) {
        y = x
        min = x2
        defined = true
      }
    }
  } else {
    for (const x of xs) {
      if (defined ? f(x, y) < 0 : f(x, x) === 0) {
        y = x
        defined = true
      }
    }
  }
  return y
}
export function leastIndex(xs: Iterable<unknown>): number | undefined
export function leastIndex<T>(xs: Iterable<T>, f: (a: T, b: T) => number): number | undefined
export function leastIndex<T>(xs: Iterable<T>, f: (a: T) => unknown): number | undefined
export function leastIndex(xs: any, f: Function = ascending) {
  if (f.length === 1) return minIndex(xs, f)
  let min
  let y = -1
  let i = -1
  for (const x of xs) {
    ++i
    if (y < 0 ? f(x, x) === 0 : f(x, min) < 0) {
      min = x
      y = i
    }
  }
  return y
}
export function map<T, U>(xs: Iterable<T>, f: (x: T, i: number, xs: Iterable<T>) => U): U[] {
  if (typeof xs[Symbol.iterator] !== "function") throw new TypeError("values is not iterable")
  if (typeof f !== "function") throw new TypeError("mapper is not a function")
  return Array.from(xs, (x, i) => f(x, i, xs))
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
export function max(xs: any, f?: Function) {
  let y
  if (f === undefined) {
    for (const x of xs) {
      if (x != null && (y < x || (y === undefined && x >= x))) y = x
    }
  } else {
    let i = -1
    for (let x of xs) {
      if ((x = f(x, ++i, xs)) != null && (y < x || (y === undefined && x >= x))) y = x
    }
  }
  return y
}
export function maxIndex(xs: Iterable<unknown>): number
export function maxIndex<T>(xs: Iterable<T>, f: (x: T, i: number, xs: Iterable<T>) => unknown): number
export function maxIndex(xs: any, f?: Function) {
  let max
  let y = -1
  let i = -1
  if (f === undefined) {
    for (const x of xs) {
      ++i
      if (x != null && (max < x || (max === undefined && x >= x))) {
        ;(max = x), (y = i)
      }
    }
  } else {
    for (let x of xs) {
      if ((x = f(x, ++i, xs)) != null && (max < x || (max === undefined && x >= x))) {
        ;(max = x), (y = i)
      }
    }
  }
  return y
}
export function mean(xs: Iterable<qt.Numeric | undefined | null>): number | undefined
export function mean<T>(
  xs: Iterable<T>,
  f: (x: T, i: number, xs: Iterable<T>) => number | undefined | null
): number | undefined
export function mean(xs: any, f?: Function) {
  let y = 0
  let n = 0
  if (f === undefined) {
    for (let x of xs) {
      if (x != null && (x = +x) >= x) ++n, (y += x)
    }
  } else {
    let i = -1
    for (let x of xs) {
      if ((x = f(x, ++i, xs)) != null && (x = +x) >= x) ++n, (y += x)
    }
  }
  if (n) return y / n
  return
}
export function median(xs: Iterable<qt.Numeric | undefined | null>): number | undefined
export function median<T>(
  xs: Iterable<T>,
  f: (x: T, i: number, xs: Iterable<T>) => number | undefined | null
): number | undefined
export function median(xs: any, f?: Function) {
  return quantile(xs, 0.5, f)
}
export function medianIndex(xs: any, f: Function) {
  return quantileIndex(xs, 0.5, f)
}
export function merge<T>(xs: Iterable<Iterable<T>>): T[] {
  function* flatten(xs: any) {
    for (const x of xs) yield* x
  }
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
export function min(xs: any, f?: Function) {
  let y
  if (f === undefined) {
    for (const x of xs) {
      if (x != null && (y > x || (y === undefined && x >= x))) y = x
    }
  } else {
    let i = -1
    for (let x of xs) {
      if ((x = f(x, ++i, xs)) != null && (y > x || (y === undefined && x >= x))) y = x
    }
  }
  return y
}
export function minIndex(xs: Iterable<unknown>): number
export function minIndex<T>(xs: Iterable<T>, f: (x: T, i: number, xs: Iterable<T>) => unknown): number
export function minIndex(xs: Iterable<unknown>): number
export function minIndex(xs: any, f?: Function) {
  let min
  let y = -1
  let i = -1
  if (f === undefined) {
    for (const x of xs) {
      ++i
      if (x != null && (min > x || (min === undefined && x >= x))) {
        ;(min = x), (y = i)
      }
    }
  } else {
    for (let x of xs) {
      if ((x = f(x, ++i, xs)) != null && (min > x || (min === undefined && x >= x))) {
        ;(min = x), (y = i)
      }
    }
  }
  return y
}
export function mode(xs: Iterable<qt.Numeric | undefined | null>): number
export function mode<T>(xs: Iterable<T>, f: (x: T, i: number, xs: Iterable<T>) => number | undefined | null): number
export function mode(xs: any, f?: Function) {
  const counts = new qt.InternMap()
  if (f === undefined) {
    for (const x of xs) {
      if (x != null && x >= x) {
        counts.set(x, (counts.get(x) || 0) + 1)
      }
    }
  } else {
    let i = -1
    for (let x of xs) {
      if ((x = f(x, ++i, xs)) != null && x >= x) {
        counts.set(x, (counts.get(x) || 0) + 1)
      }
    }
  }
  let y
  let modeCount = 0
  for (const [value, count] of counts) {
    if (count > modeCount) {
      modeCount = count
      y = value
    }
  }
  return y
}
export function nice(start: number, stop: number, count: number): [number, number] {
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
export function number(x: any) {
  return x === null ? NaN : +x
}
export function* numbers(xs: any, f?: Function) {
  if (f === undefined) {
    for (let x of xs) {
      if (x != null && (x = +x) >= x) yield x
    }
  } else {
    let i = -1
    for (let x of xs) {
      if ((x = f(x, ++i, xs)) != null && (x = +x) >= x) yield x
    }
  }
}
export function pairs<T, U>(xs: Iterable<T>, reducer: (a: T, b: T) => U): U[]
export function pairs<T>(xs: Iterable<T>): Array<[T, T]>
export function pairs(xs: any, f = pair) {
  const y = []
  let x0
  let first = false
  for (const x of xs) {
    if (first) y.push(f(x0, x))
    x0 = x
    first = true
  }
  return y
}
export function pair(a: any, b: any) {
  return [a, b]
}
export function permute<T, K extends keyof T>(x: T, ks: Iterable<K>): Array<T[K]>
export function permute<T>(x: { [key: number]: T }, ks: Iterable<number>): T[]
export function permute(x: any, ks: any) {
  return Array.from(ks, k => x[k])
}
export function quantile(xs: Iterable<qt.Numeric | undefined | null>, p: number): number | undefined
export function quantile<T>(
  xs: Iterable<T>,
  p: number,
  f: (x: T, i: number, xs: Iterable<T>) => number | undefined | null
): number | undefined
export function quantile(xs: any, p: number, f?: Function) {
  xs = Float64Array.from(numbers(xs, f))
  if (!(n = xs.length)) return
  if ((p = +p) <= 0 || n < 2) return Math.min(xs)
  if (p >= 1) return Math.max(xs)
  let n
  const i = (n - 1) * p
  const i0 = Math.floor(i)
  const y0 = Math.max(quickselect(xs, i0).subarray(0, i0 + 1))
  const y1 = Math.min(xs.subarray(i0 + 1))
  return y0 + (y1 - y0) * (i - i0)
}
export function quantileSorted(xs: Array<qt.Numeric | undefined | null>, p: number): number | undefined
export function quantileSorted<T>(
  xs: T[],
  p: number,
  f: (x: T, i: number, xs: T[]) => number | undefined | null
): number | undefined
export function quantileSorted(xs: any, p?: number, f: Function = number) {
  if (!(n = xs.length)) return
  if ((p = +p) <= 0 || n < 2) return +f(xs[0], 0, xs)
  if (p >= 1) return +f(xs[n - 1], n - 1, xs)
  let n
  const i = (n - 1) * p
  const i0 = Math.floor(i)
  const y0 = +f(xs[i0], i0, xs)
  const y1 = +f(xs[i0 + 1], i0 + 1, xs)
  return y0 + (y1 - y0) * (i - i0)
}
export function quantileIndex(xs: any, p: number, f: Function) {
  xs = Float64Array.from(numbers(xs, f))
  if (!(n = xs.length)) return
  if ((p = +p) <= 0 || n < 2) return minIndex(xs)
  if (p >= 1) return maxIndex(xs)
  let n
  const i = Math.floor((n - 1) * p)
  const order = (i, j) => ascendingDefined(xs[i], xs[j])
  const y = quickselect(
    Uint32Array.from(xs, (_, i) => i),
    i,
    0,
    n - 1,
    order
  )
  return greatest(y.subarray(0, i + 1), i => xs[i])
}
export function quickselect<T>(
  xs: ArrayLike<T>,
  k: number,
  left?: number,
  right?: number,
  f?: (a: qt.Primitive | undefined, b: qt.Primitive | undefined) => number
): T[]
export function quickselect(xs: any, k: number, left = 0, right = xs.length - 1, f?: Function) {
  f = f === undefined ? ascendingDefined : compareDefined(f)
  while (right > left) {
    if (right - left > 600) {
      const n = right - left + 1
      const m = k - left + 1
      const z = Math.log(n)
      const s = 0.5 * Math.exp((2 * z) / 3)
      const sd = 0.5 * Math.sqrt((z * s * (n - s)) / n) * (m - n / 2 < 0 ? -1 : 1)
      const newLeft = Math.max(left, Math.floor(k - (m * s) / n + sd))
      const newRight = Math.min(right, Math.floor(k + ((n - m) * s) / n + sd))
      quickselect(xs, k, newLeft, newRight, f)
    }
    const x = xs[k]
    let i = left
    let j = right
    swap(xs, left, k)
    if (f(xs[right], x) > 0) swap(xs, left, right)
    while (i < j) {
      swap(xs, i, j), ++i, --j
      while (f(xs[i], x) < 0) ++i
      while (f(xs[j], x) > 0) --j
    }
    if (f(xs[left], x) === 0) swap(xs, left, j)
    else ++j, swap(xs, j, right)
    if (j <= k) left = j + 1
    if (k <= j) right = j - 1
  }
  return xs
}
function swap(xs: any, i: number, j: number) {
  const x = xs[i]
  xs[i] = xs[j]
  xs[j] = x
}
export function range(start: number, stop: number, step?: number): number[]
export function range(stop: number): number[]
export function range(start: number, stop?: number, step?: number) {
  ;(start = +start),
    (stop = +stop),
    (step = (n = arguments.length) < 2 ? ((stop = start), (start = 0), 1) : n < 3 ? 1 : +step)
  let i = -1
  let n = Math.max(0, Math.ceil((stop - start) / step)) | 0
  let y = new Array(n)
  while (++i < n) {
    y[i] = start + i * step
  }
  return y
}
export function rank(xs: Iterable<qt.Numeric | undefined | null>): Float64Array
export function rank<T>(
  xs: Iterable<T>,
  f: ((x: T, i: number, xs: Iterable<T>) => number | undefined | null) | ((a: T, b: T) => number | undefined | null)
): Float64Array
export function rank(xs: any, f: Function = ascending) {
  if (typeof xs[Symbol.iterator] !== "function") throw new TypeError("values is not iterable")
  let V = Array.from(xs)
  const R = new Float64Array(V.length)
  if (f.length !== 2) (V = V.map(f)), (f = ascending)
  const compareIndex = (i, j) => f(V[i], V[j])
  let k, r
  Uint32Array.from(V, (_, i) => i)
    .sort(f === ascending ? (i, j) => ascendingDefined(V[i], V[j]) : compareDefined(compareIndex))
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
export function reduce<T>(xs: Iterable<T>, f: (x0: T, x: T, i: number, xs: Iterable<T>) => T, x0?: T): T
export function reduce<T, U>(xs: Iterable<T>, f: (x0: U, x: T, i: number, xs: Iterable<T>) => U, x0: U): U
export function reduce(xs: any, f: Function, x0: any) {
  if (typeof f !== "function") throw new TypeError("reducer is not a function")
  const iterator = xs[Symbol.iterator]()
  let done
  let next
  let i = -1
  if (arguments.length < 3) {
    ;({ done, value: x0 } = iterator.next())
    if (done) return
    ++i
  }
  while ((({ done, value: next } = iterator.next()), !done)) {
    x0 = f(x0, next, ++i, xs)
  }
  return x0
}
export function reverse<T>(xs: Iterable<T>): T[] {
  if (typeof xs[Symbol.iterator] !== "function") throw new TypeError("values is not iterable")
  return Array.from(xs).reverse()
}
export function scan(xs, f) {
  const i = leastIndex(xs, f)
  return i < 0 ? undefined : i
}
export function shuffler(rand: () => number) {
  function shuffle<T>(xs: T[], lo?: number, hi?: number): T[]
  function shuffle(xs: Int8Array, lo?: number, hi?: number): Int8Array
  function shuffle(xs: Uint8Array, lo?: number, hi?: number): Uint8Array
  function shuffle(xs: Uint8ClampedArray, lo?: number, hi?: number): Uint8ClampedArray
  function shuffle(xs: Int16Array, lo?: number, hi?: number): Int16Array
  function shuffle(xs: Uint16Array, lo?: number, hi?: number): Uint16Array
  function shuffle(xs: Int32Array, lo?: number, hi?: number): Int32Array
  function shuffle(xs: Uint32Array, lo?: number, hi?: number): Uint32Array
  function shuffle(xs: Float32Array, lo?: number, hi?: number): Float32Array
  function shuffle(xs: Float64Array, lo?: number, hi?: number): Float64Array
  function shuffle(xs: any, lo = 0, hi = xs.length) {
    let m = hi - (lo = +lo)
    while (m) {
      const i = (rand() * m--) | 0
      const x = xs[m + lo]
      xs[m + lo] = xs[i + lo]
      xs[i + lo] = x
    }
    return xs
  }
  return shuffle
}
export const shuffle = shuffler(Math.random)
export function some<T>(xs: Iterable<T>, f: (x: T, i: number, xs: Iterable<T>) => unknown) {
  if (typeof f !== "function") throw new TypeError("test is not a function")
  let i = -1
  for (const x of xs) {
    if (f(x, ++i, xs)) return true
  }
  return false
}
export function sort<T>(xs: Iterable<T>, ...fs: Array<(a: T) => unknown>): T[]
export function sort<T>(xs: Iterable<T>, f?: (a: T, b: T) => number): T[]
export function sort(xs: any, ...F) {
  if (typeof xs[Symbol.iterator] !== "function") throw new TypeError("values is not iterable")
  xs = Array.from(xs)
  let [f] = F
  if ((f && f.length !== 2) || F.length > 1) {
    const idx = Uint32Array.from(xs, (d, i) => i)
    if (F.length > 1) {
      F = F.map(f => xs.map(f))
      idx.sort((i, j) => {
        for (const f of F) {
          const c = ascendingDefined(f[i], f[j])
          if (c) return c
        }
      })
    } else {
      f = xs.map(f)
      idx.sort((i, j) => ascendingDefined(f[i], f[j]))
    }
    return permute(xs, idx)
  }
  return xs.sort(compareDefined(f))
}
function compareDefined(f = ascending) {
  if (f === ascending) return ascendingDefined
  if (typeof f !== "function") throw new TypeError("compare is not a function")
  return (a, b) => {
    const y = f(a, b)
    if (y || y === 0) return y
    return (f(b, b) === 0) - (f(a, a) === 0)
  }
}
function ascendingDefined(a, b) {
  return (a == null || !(a >= a)) - (b == null || !(b >= b)) || (a < b ? -1 : a > b ? 1 : 0)
}
export function subset<T>(a: Iterable<T>, b: Iterable<T>) {
  return superset(b, a)
}
export function sum(xs: Iterable<qt.Numeric | undefined | null>): number
export function sum<T>(xs: Iterable<T>, f: (x: T, i: number, xs: Iterable<T>) => number | undefined | null): number
export function sum(xs: any, f?: Function) {
  let y = 0
  if (f === undefined) {
    for (let x of xs) {
      if ((x = +x)) y += x
    }
  } else {
    let i = -1
    for (let x of xs) {
      if ((x = +f(x, ++i, xs))) y += x
    }
  }
  return y
}
export function superset<T>(a: Iterable<T>, b: Iterable<T>) {
  const it = a[Symbol.iterator]()
  const y = new Set()
  for (const v of b) {
    const v1 = intern(v)
    if (y.has(v1)) continue
    let value, done
    while (({ value, done } = it.next())) {
      if (done) return false
      const v2 = intern(value)
      y.add(v2)
      if (Object.is(v1, v2)) break
    }
  }
  return true
}
function intern(x: any) {
  return x !== null && typeof x === "object" ? x.valueOf() : x
}

const e10 = Math.sqrt(50)
const e5 = Math.sqrt(10)
const e2 = Math.sqrt(2)
export function ticks(start: number, stop: number, count: number): number[] {
  let reverse,
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
export function tickIncrement(start: number, stop: number, count: number) {
  const y = (stop - start) / Math.max(0, count)
  const power = Math.floor(Math.log(y) / Math.LN10)
  const e = y / Math.pow(10, power)
  return power >= 0
    ? (e >= e10 ? 10 : e >= e5 ? 5 : e >= e2 ? 2 : 1) * Math.pow(10, power)
    : -Math.pow(10, -power) / (e >= e10 ? 10 : e >= e5 ? 5 : e >= e2 ? 2 : 1)
}
export function tickStep(start: number, stop: number, count: number) {
  const y0 = Math.abs(stop - start) / Math.max(0, count)
  let y = Math.pow(10, Math.floor(Math.log(y0) / Math.LN10))
  const e = y0 / y
  if (e >= e10) y *= 10
  else if (e >= e5) y *= 5
  else if (e >= e2) y *= 2
  return stop < start ? -y : y
}
export function transpose<T>(xs: ArrayLike<ArrayLike<T>>): T[][] {
  if (!(n = xs.length)) return []
  const m = min(xs, length)
  const y = new Array(m)
  for (let i = -1; ++i < m; ) {
    for (let j = -1, n, row = (y[i] = new Array(n)); ++j < n; ) {
      row[j] = xs[j][i]
    }
  }
  return y
}
export function union<T>(...xs: Array<Iterable<T>>): qt.InternSet<T> {
  const y = new qt.InternSet()
  for (const x of xs) {
    for (const x2 of x) {
      y.add(x2)
    }
  }
  return y
}
export function variance(xs: Iterable<qt.Numeric | undefined | null>): number | undefined
export function variance<T>(
  xs: Iterable<T>,
  f: (x: T, i: number, xs: Iterable<T>) => number | undefined | null
): number | undefined
export function variance(xs: any, f?: Function) {
  let count = 0
  let mean = 0
  let sum = 0
  let delta
  if (f === undefined) {
    for (let x of xs) {
      if (x != null && (x = +x) >= x) {
        delta = x - mean
        mean += delta / ++count
        sum += delta * (x - mean)
      }
    }
  } else {
    let i = -1
    for (let x of xs) {
      if ((x = f(x, ++i, xs)) != null && (x = +x) >= x) {
        delta = x - mean
        mean += delta / ++count
        sum += delta * (x - mean)
      }
    }
  }
  if (count > 1) return sum / (count - 1)
  return
}
export function zip<T>(...xs: Array<ArrayLike<T>>): T[][] {
  return transpose(xs)
}
export function thresholdFreedmanDiaconis(xs: ArrayLike<number | undefined>, min: number, max: number) {
  return Math.ceil((max - min) / (2 * (quantile(xs, 0.75) - quantile(xs, 0.25)) * Math.pow(count(xs), -1 / 3)))
}
export function thresholdScott(xs: ArrayLike<number | undefined>, min: number, max: number) {
  return Math.ceil(((max - min) * Math.cbrt(count(xs))) / (3.49 * deviation(xs)))
}
export function thresholdSturges(xs: ArrayLike<number | undefined>) {
  return Math.ceil(Math.log(count(xs)) / Math.LN2) + 1
}
