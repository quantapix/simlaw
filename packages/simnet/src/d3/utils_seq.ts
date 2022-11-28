import type * as qt from "./types.js"
import * as qu from "./utils.js"

export type Comp<S, T = S, R = number> = (a: S, b: T) => R

export namespace comp {
  export function cross<S, T>(a: Iterable<S>, b: Iterable<T>): Array<[S, T]>
  export function cross<S, T, R>(a: Iterable<S>, b: Iterable<T>, f: Comp<S, T, R>): R[]
  export function cross(...xs: any[]) {
    const f = typeof xs[xs.length - 1] === "function" && reducer(xs.pop())
    xs = xs.map(qu.array)
    const lengths = xs.map(x => x.length | 0)
    const j = xs.length - 1
    const index = new Array(j + 1).fill(0)
    const ys: any[] = []
    if (j < 0 || lengths.some(x => x <= 0)) return ys
    while (true) {
      ys.push(index.map((j, i) => xs[i][j]))
      let i = j
      while (++index[i] === lengths[i]) {
        if (i === 0) return f ? ys.map(f) : ys
        index[i--] = 0
      }
    }
  }
  export function greatest<T>(xs: Iterable<T>, f?: Comp<T>): T | undefined
  export function greatest<T>(xs: Iterable<T>, f: (a: T) => unknown): T | undefined
  export function greatest(xs: any, f: any = qu.ascending) {
    let y
    let defined = false
    if (f.length === 1) {
      let max
      for (const x of xs) {
        const x2 = f(x)
        if (defined ? qu.ascending(x2, max) > 0 : qu.ascending(x2, x2) === 0) {
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
  export function greatestIndex<T>(xs: Iterable<T>, f: Comp<T>): number | undefined
  export function greatestIndex<T>(xs: Iterable<T>, f: (a: T) => unknown): number | undefined
  export function greatestIndex(xs: any, f: any = qu.ascending) {
    if (f.length === 1) return each.maxIndex(xs, f)
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
  export function least<T>(xs: Iterable<T>, f?: Comp<T>): T | undefined
  export function least<T>(xs: Iterable<T>, f: (a: T) => unknown): T | undefined
  export function least(xs: any, f: any = qu.ascending) {
    let y
    let defined = false
    if (f.length === 1) {
      let min
      for (const x of xs) {
        const x2 = f(x)
        if (defined ? qu.ascending(x2, min) < 0 : qu.ascending(x2, x2) === 0) {
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
  export function leastIndex<T>(xs: Iterable<T>, f: Comp<T>): number | undefined
  export function leastIndex<T>(xs: Iterable<T>, f: (a: T) => unknown): number | undefined
  export function leastIndex(xs: any, f: any = qu.ascending) {
    if (f.length === 1) return each.minIndex(xs, f)
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
  export function pairs<T, R>(xs: Iterable<T>, f: Comp<T, T, R>): R[]
  export function pairs<T>(xs: Iterable<T>): Array<[T, T]>
  export function pairs(xs: any, f = (a: any, b: any) => [a, b]) {
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
  export function sort<T>(xs: Iterable<T>, ...fs: Array<(a: T) => unknown>): T[]
  export function sort<T>(xs: Iterable<T>, f?: Comp<T>): T[]
  export function sort(xs: any, ...fs: any[]) {
    xs = Array.from(xs)
    let [f] = fs
    if ((f && f.length !== 2) || fs.length > 1) {
      const idx = Uint32Array.from(xs, (_, i) => i)
      if (fs.length > 1) {
        fs = fs.map(f => xs.map(f))
        idx.sort((i, j) => {
          for (const f of fs) {
            const c = ascendingDefined(f[i], f[j])
            if (c) return c
          }
          return 0
        })
      } else {
        f = xs.map(f)
        idx.sort((i, j) => ascendingDefined(f[i], f[j]))
      }
      return permute(xs, idx)
    }
    return xs.sort(compareDefined(f))
  }
}

export type Each<T, R = number | undefined> = (x: T, i: number, xs: Iterable<T>) => R

export namespace each {
  export function count(xs: Iterable<unknown>): number
  export function count<T>(xs: Iterable<T>, f: Each<T>): number
  export function count(xs: any, f?: any) {
    let y = 0
    if (f === undefined) {
      for (let x of xs) {
        if (x !== undefined && (x = +x) >= x) ++y
      }
    } else {
      let i = -1
      for (let x of xs) {
        if ((x = f(x, ++i, xs)) != undefined && (x = +x) >= x) ++y
      }
    }
    return y
  }
  export function cumsum(xs: Iterable<qt.Numeric | undefined>): Float64Array
  export function cumsum<T>(xs: Iterable<T>, f: Each<T>): Float64Array
  export function cumsum(xs: any, f?: any) {
    let y = 0
    let i = 0
    return Float64Array.from(xs, f === undefined ? x => (y += +x || 0) : x => (y += +f(x, i++, xs) || 0))
  }
  export function deviation(xs: Iterable<qt.Numeric | undefined>): number | undefined
  export function deviation<T>(xs: Iterable<T>, f: Each<T>): number | undefined
  export function deviation(xs: any, f?: any) {
    const y = variance(xs, f)
    return y ? Math.sqrt(y) : y
  }
  export function every<T>(xs: Iterable<T>, f: Each<T, unknown>) {
    let i = -1
    for (const x of xs) {
      if (!f(x, ++i, xs)) return false
    }
    return true
  }
  export function extent(xs: Iterable<string>): [string, string] | [undefined, undefined]
  export function extent<T extends qt.Numeric>(xs: Iterable<T>): [T, T] | [undefined, undefined]
  export function extent<T>(xs: Iterable<T>, f: Each<T, string | undefined>): [string, string] | [undefined, undefined]
  export function extent<T, U extends qt.Numeric>(
    xs: Iterable<T>,
    f: Each<T, U | undefined>
  ): [U, U] | [undefined, undefined]
  export function extent(xs: any, f?: any) {
    let min
    let max
    if (f === undefined) {
      for (const x of xs) {
        if (x !== undefined) {
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
        if ((x = f(x, ++i, xs)) !== undefined) {
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
  export function filter<T>(xs: Iterable<T>, f: Each<T, unknown>): T[] {
    const y = []
    let i = -1
    for (const x of xs) {
      if (f(x, ++i, xs)) y.push(x)
    }
    return y
  }
  export function fsum(xs: Iterable<qt.Numeric | undefined>): number
  export function fsum<T>(xs: Iterable<T>, f: Each<T>): number
  export function fsum(xs: any, f?: any) {
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
  export function fcumsum(xs: Iterable<qt.Numeric | undefined>): Float64Array
  export function fcumsum<T>(xs: Iterable<T>, f: Each<T>): Float64Array
  export function fcumsum(xs: any, f?: any) {
    const y = new Adder()
    let i = -1
    return Float64Array.from(xs, f === undefined ? x => y.add(+x || 0) : x => y.add(+f(x, ++i, xs) || 0))
  }
  export function map<T, U>(xs: Iterable<T>, f: Each<T, U>): U[] {
    return Array.from(xs, (x, i) => f(x, i, xs))
  }
  export function max(xs: Iterable<string>): string | undefined
  export function max<T extends qt.Numeric>(xs: Iterable<T>): T | undefined
  export function max<T>(xs: Iterable<T>, f: Each<T, string | undefined>): string | undefined
  export function max<T, U extends qt.Numeric>(xs: Iterable<T>, f: Each<T, U | undefined>): U | undefined
  export function max(xs: any, f?: any) {
    let y
    if (f === undefined) {
      for (const x of xs) {
        if (x !== undefined && (y < x || (y === undefined && x >= x))) y = x
      }
    } else {
      let i = -1
      for (let x of xs) {
        if ((x = f(x, ++i, xs)) !== undefined && (y < x || (y === undefined && x >= x))) y = x
      }
    }
    return y
  }
  export function maxIndex(xs: Iterable<unknown>): number
  export function maxIndex<T>(xs: Iterable<T>, f: Each<T, unknown>): number
  export function maxIndex(xs: any, f?: any) {
    let max
    let y = -1
    let i = -1
    if (f === undefined) {
      for (const x of xs) {
        ++i
        if (x !== undefined && (max < x || (max === undefined && x >= x))) {
          ;(max = x), (y = i)
        }
      }
    } else {
      for (let x of xs) {
        if ((x = f(x, ++i, xs)) !== undefined && (max < x || (max === undefined && x >= x))) {
          ;(max = x), (y = i)
        }
      }
    }
    return y
  }
  export function mean(xs: Iterable<qt.Numeric | undefined>): number | undefined
  export function mean<T>(xs: Iterable<T>, f: Each<T>): number | undefined
  export function mean(xs: any, f?: any) {
    let y = 0
    let n = 0
    if (f === undefined) {
      for (let x of xs) {
        if (x !== undefined && (x = +x) >= x) ++n, (y += x)
      }
    } else {
      let i = -1
      for (let x of xs) {
        if ((x = f(x, ++i, xs)) !== undefined && (x = +x) >= x) ++n, (y += x)
      }
    }
    return n ? y / n : undefined
  }
  export function median(xs: Iterable<qt.Numeric | undefined>): number | undefined
  export function median<T>(xs: Iterable<T>, f: Each<T>): number | undefined
  export function median(xs: any, f?: any) {
    return quantile(xs, 0.5, f)
  }
  export function min(xs: Iterable<string>): string | undefined
  export function min<T extends qt.Numeric>(xs: Iterable<T>): T | undefined
  export function min<T>(xs: Iterable<T>, f: Each<T, string | undefined>): string | undefined
  export function min<T, U extends qt.Numeric>(xs: Iterable<T>, f: Each<T, U | undefined>): U | undefined
  export function min(xs: any, f?: any) {
    let y
    if (f === undefined) {
      for (const x of xs) {
        if (x !== undefined && (y > x || (y === undefined && x >= x))) y = x
      }
    } else {
      let i = -1
      for (let x of xs) {
        if ((x = f(x, ++i, xs)) !== undefined && (y > x || (y === undefined && x >= x))) y = x
      }
    }
    return y
  }
  export function minIndex(xs: Iterable<unknown>): number
  export function minIndex<T>(xs: Iterable<T>, f: Each<T, unknown>): number
  export function minIndex(xs: any, f?: any) {
    let min
    let y = -1
    let i = -1
    if (f === undefined) {
      for (const x of xs) {
        ++i
        if (x !== undefined && (min > x || (min === undefined && x >= x))) {
          ;(min = x), (y = i)
        }
      }
    } else {
      for (let x of xs) {
        if ((x = f(x, ++i, xs)) !== undefined && (min > x || (min === undefined && x >= x))) {
          ;(min = x), (y = i)
        }
      }
    }
    return y
  }
  export function mode(xs: Iterable<qt.Numeric | undefined>): number
  export function mode<T>(xs: Iterable<T>, f: Each<T>): number
  export function mode(xs: any, f?: any) {
    const cs = new Map()
    if (f === undefined) {
      for (const k of xs) {
        if (k !== undefined && k >= k) {
          cs.set(k, (cs.get(k) || 0) + 1)
        }
      }
    } else {
      let i = -1
      for (let k of xs) {
        if ((k = f(k, ++i, xs)) !== undefined && k >= k) {
          cs.set(k, (cs.get(k) || 0) + 1)
        }
      }
    }
    let y
    let mode = 0
    for (const [k, v] of cs) {
      if (v > mode) {
        mode = v
        y = k
      }
    }
    return y
  }
  export function quantile(xs: Iterable<qt.Numeric | undefined>, p: number): number | undefined
  export function quantile<T>(xs: Iterable<T>, p: number, f: Each<T>): number | undefined
  export function quantile(xs: any, p: number, f?: any) {
    xs = Float64Array.from(numbers(xs, f))
    const n = xs.length
    if (!n) return
    if ((p = +p) <= 0 || n < 2) return Math.min(xs)
    if (p >= 1) return Math.max(xs)
    const i = (n - 1) * p
    const i0 = Math.floor(i)
    const y0 = Math.max(quickselect(xs, i0).subarray(0, i0 + 1))
    const y1 = Math.min(xs.subarray(i0 + 1))
    return y0 + (y1 - y0) * (i - i0)
  }
  export function quantileSorted(xs: Array<qt.Numeric | undefined>, p: number): number | undefined
  export function quantileSorted<T>(xs: T[], p: number, f: Each<T>): number | undefined
  export function quantileSorted(xs: any, p = 0, f: any = number) {
    const n = xs.length
    if (!n) return
    if ((p = +p) <= 0 || n < 2) return +f(xs[0], 0, xs)
    if (p >= 1) return +f(xs[n - 1], n - 1, xs)
    const i = (n - 1) * p
    const i0 = Math.floor(i)
    const y0 = +f(xs[i0], i0, xs)
    const y1 = +f(xs[i0 + 1], i0 + 1, xs)
    return y0 + (y1 - y0) * (i - i0)
  }
  export function rank(xs: Iterable<qt.Numeric | undefined>): Float64Array
  export function rank<T>(xs: Iterable<T>, f: Each<T> | ((a: T, b: T) => number | undefined)): Float64Array
  export function rank(xs: any, f: any = qu.ascending) {
    let V = Array.from(xs)
    const R = new Float64Array(V.length)
    if (f.length !== 2) (V = V.map(f)), (f = qu.ascending)
    const compareIndex = (i, j) => f(V[i], V[j])
    let k, r
    Uint32Array.from(V, (_, i) => i)
      .sort(f === qu.ascending ? (i, j) => ascendingDefined(V[i], V[j]) : compareDefined(compareIndex))
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
  export function some<T>(xs: Iterable<T>, f: Each<T, unknown>) {
    let i = -1
    for (const x of xs) {
      if (f(x, ++i, xs)) return true
    }
    return false
  }
  export function sum(xs: Iterable<qt.Numeric | undefined>): number
  export function sum<T>(xs: Iterable<T>, f: Each<T>): number
  export function sum(xs: any, f?: any) {
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
  export function variance(xs: Iterable<qt.Numeric | undefined>): number | undefined
  export function variance<T>(xs: Iterable<T>, f: Each<T>): number | undefined
  export function variance(xs: any, f?: any) {
    let n = 0
    let mean = 0
    let sum = 0
    let delta
    if (f === undefined) {
      for (let x of xs) {
        if (x !== undefined && (x = +x) >= x) {
          delta = x - mean
          mean += delta / ++n
          sum += delta * (x - mean)
        }
      }
    } else {
      let i = -1
      for (let x of xs) {
        if ((x = f(x, ++i, xs)) !== undefined && (x = +x) >= x) {
          delta = x - mean
          mean += delta / ++n
          sum += delta * (x - mean)
        }
      }
    }
    return n > 1 ? sum / (n - 1) : undefined
  }
}

export namespace set {
  export function difference<T>(xs: Iterable<T>, ...zss: Array<Iterable<T>>): Set<T> {
    const ys = new Set<T>(xs)
    for (const zs of zss) {
      for (const z of zs) {
        ys.delete(z)
      }
    }
    return ys
  }
  export function disjoint<T>(xs: Iterable<T>, zs: Iterable<T>): boolean {
    const it = zs[Symbol.iterator]()
    const y = new Set<T>()
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
  export function intersection<T>(x: Iterable<T>, ...xs: Array<Iterable<T>>): Set<T> {
    const ys = new Set<T>(x)
    const xs2: Set<T>[] = xs.map(x => (x instanceof Set ? x : new Set<T>(x)))
    out: for (const y of ys) {
      for (const x of xs2) {
        if (!x.has(y)) {
          ys.delete(y)
          continue out
        }
      }
    }
    return ys
  }
  export function transpose<T>(xs: ArrayLike<ArrayLike<T>>): T[][] {
    const n = xs.length
    if (!n) return []
    const m = each.min(xs, (x: any) => x.length | 0)
    const y = new Array(m)
    for (let i = -1; ++i < m; ) {
      for (let j = -1, row = (y[i] = new Array(n)); ++j < n; ) {
        row[j] = xs[j][i]
      }
    }
    return y
  }
  export function union<T>(...xs: Array<Iterable<T>>): Set<T> {
    const y = new Set<T>()
    for (const x of xs) {
      for (const x2 of x) {
        y.add(x2)
      }
    }
    return y
  }
  export function zip<T>(...xs: Array<ArrayLike<T>>): T[][] {
    return transpose(xs)
  }
}

const array = Array.prototype
export const slice = array.slice
export const map = array.map

export function bin(): qt.HistoNums<number, number>
export function bin<T, V extends number | undefined>(): qt.HistoNums<T, V>
export function bin<T, V extends Date | undefined>(): qt.HistoDates<T, V>
export function bin() {
  let value = qu.identity,
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
          if ((x = values[i]) !== undefined && x0 <= x && x <= x1) {
            bins[Math.min(m, Math.floor((x - x0) / step))].push(data[i])
          }
        }
      } else if (step < 0) {
        for (i = 0; i < n; ++i) {
          if ((x = values[i]) !== undefined && x0 <= x && x <= x1) {
            const j = Math.floor((x0 - x) * step)
            bins[Math.min(m, j + (tz[j] <= x))].push(data[i]) // handle off-by-one due to rounding
          }
        }
      }
    } else {
      for (i = 0; i < n; ++i) {
        if ((x = values[i]) !== undefined && x0 <= x && x <= x1) {
          bins[bisect(tz, x, 0, m)].push(data[i])
        }
      }
    }
    return bins
  }
  histogram.value = function (_) {
    return arguments.length ? ((value = typeof _ === "function" ? _ : qu.constant(_)), histogram) : value
  }
  histogram.domain = function (_) {
    return arguments.length ? ((domain = typeof _ === "function" ? _ : qu.constant([_[0], _[1]])), histogram) : domain
  }
  histogram.thresholds = function (_) {
    return arguments.length
      ? ((threshold = typeof _ === "function" ? _ : Array.isArray(_) ? qu.constant(slice.call(_)) : qu.constant(_)),
        histogram)
      : threshold
  }
  return histogram
}
export const histogram = bin

const ascendingBisect = bisector(qu.ascending)
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
    compare1 = qu.ascending
    compare2 = (d, x) => qu.ascending(f(d), x)
    delta = (d, x) => f(d) - x
  } else {
    compare1 = f === qu.ascending || f === qu.descending ? f : qu.constant(0)
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
function reducer(reduce) {
  return values => reduce(...values)
}
export class Adder implements qt.Adder {
  n = 0
  xs = new Float64Array(32)
  add(x: number) {
    let i = 0
    const xs = this.xs
    for (let j = 0; j < this.n && j < 32; j++) {
      const y = xs[j]!
      const hi = x + y
      const lo = Math.abs(x) < Math.abs(y) ? x - (hi - y) : y - (hi - x)
      if (lo) xs[i++] = lo
      x = hi
    }
    xs[i] = x
    this.n = i + 1
    return this
  }
  valueOf() {
    const xs = this.xs
    let n = this.n,
      x,
      y,
      hi = 0
    if (n > 0) {
      hi = xs[--n]!
      let lo = 0
      while (n > 0) {
        x = hi
        y = xs[--n]!
        hi = x + y
        lo = y - (hi - x)
        if (lo) break
      }
      if (n > 0 && ((lo < 0 && xs[n - 1]! < 0) || (lo > 0 && xs[n - 1]! > 0))) {
        y = lo * 2
        x = hi + y
        if (y == x - hi) hi = x
      }
    }
    return hi
  }
}
export type Proj<T, R> = (x: T) => R

export function group<T, K>(xs: Iterable<T>, k: Proj<T, K>): Map<K, T[]>
export function group<T, K1, K2>(xs: Iterable<T>, k1: Proj<T, K1>, k2: Proj<T, K2>): Map<K1, Map<K2, T[]>>
export function group<T, K1, K2, K3>(
  xs: Iterable<T>,
  k1: Proj<T, K1>,
  k2: Proj<T, K2>,
  k3: Proj<T, K3>
): Map<K1, Map<K2, Map<K3, T[]>>>
export function group(xs: any, ...ks: any) {
  return nest(xs, qu.identity, qu.identity, ks)
}
export function groups<T, K>(xs: Iterable<T>, k: Proj<T, K>): Array<[K, T[]]>
export function groups<T, K1, K2>(xs: Iterable<T>, k1: Proj<T, K1>, k2: Proj<T, K2>): Array<[K1, Array<[K2, T[]]>]>
export function groups<T, K1, K2, K3>(
  xs: Iterable<T>,
  k1: Proj<T, K1>,
  k2: Proj<T, K2>,
  k3: Proj<T, K3>
): Array<[K1, Array<[K2, Array<[K3, T[]]>]>]>
export function groups(xs: any, ...ks: any) {
  return nest(xs, Array.from, qu.identity, ks)
}
function flatten(xs: any[], ks: any) {
  for (let i = 1, n = ks.length; i < n; ++i) {
    xs = xs.flatMap(x => x.pop().map(([k, v]: [any, any]) => [...x, k, v]))
  }
  return xs
}
export function flatGroup<T, K>(xs: Iterable<T>, k: Proj<T, K>): Array<[K, T[]]>
export function flatGroup<T, K1, K2>(xs: Iterable<T>, k1: Proj<T, K1>, k2: Proj<T, K2>): Array<[K1, K2, T[]]>
export function flatGroup<T, K1, K2, K3>(
  xs: Iterable<T>,
  k1: Proj<T, K1>,
  k2: Proj<T, K2>,
  k3: Proj<T, K3>
): Array<[K1, K2, K3, T[]]>
export function flatGroup(xs: any, ...ks: any) {
  return flatten(groups(xs, ...ks), ks)
}
export function flatRollup<T, R, K>(xs: Iterable<T>, f: (x: T[]) => R, k: Proj<T, K>): Array<[K, R]>
export function flatRollup<T, R, K1, K2>(
  xs: Iterable<T>,
  f: (x: T[]) => R,
  k1: Proj<T, K1>,
  k2: Proj<T, K2>
): Array<[K1, K2, R]>
export function flatRollup<T, R, K1, K2, K3>(
  xs: Iterable<T>,
  f: (x: T[]) => R,
  k1: Proj<T, K1>,
  k2: Proj<T, K2>,
  k3: Proj<T, K3>
): Array<[K1, K2, K3, R]>
export function flatRollup(xs: any, f: any, ...ks: any) {
  return flatten(rollups(xs, f, ...ks), ks)
}
export function rollup<T, R, K>(xs: Iterable<T>, f: (x: T[]) => R, k: Proj<T, K>): Map<K, R>
export function rollup<T, R, K1, K2>(
  xs: Iterable<T>,
  f: (x: T[]) => R,
  k1: Proj<T, K1>,
  k2: Proj<T, K2>
): Map<K1, Map<K2, R>>
export function rollup<T, R, K1, K2, K3>(
  xs: Iterable<T>,
  f: (x: T[]) => R,
  k1: Proj<T, K1>,
  k2: Proj<T, K2>,
  k3: Proj<T, K3>
): Map<K1, Map<K2, Map<K3, R>>>
export function rollup(xs: any, f: any, ...ks: any) {
  return nest(xs, qu.identity, f, ks)
}
export function rollups<T, R, K>(xs: Iterable<T>, f: (x: T[]) => R, k: Proj<T, K>): Array<[K, R]>
export function rollups<T, R, K1, K2>(
  xs: Iterable<T>,
  f: (x: T[]) => R,
  k1: Proj<T, K1>,
  k2: Proj<T, K2>
): Array<[K1, Array<[K2, R]>]>
export function rollups<T, R, K1, K2, K3>(
  xs: Iterable<T>,
  f: (x: T[]) => R,
  k1: Proj<T, K1>,
  k2: Proj<T, K2>,
  k3: Proj<T, K3>
): Array<[K1, Array<[K2, Array<[K3, R]>]>]>
export function rollups(xs: any, f: any, ...ks: any) {
  return nest(xs, Array.from, f, ks)
}
export function index<T, K>(xs: Iterable<T>, k: Proj<T, K>): Map<K, T>
export function index<T, K1, K2>(xs: Iterable<T>, k1: Proj<T, K1>, k2: Proj<T, K2>): Map<K1, Map<K2, T>>
export function index<T, K1, K2, K3>(
  xs: Iterable<T>,
  k1: Proj<T, K1>,
  k2: Proj<T, K2>,
  k3: Proj<T, K3>
): Map<K1, Map<K2, Map<K3, T>>>
export function index(xs: any, ...ks: any) {
  return nest(xs, qu.identity, unique, ks)
}
export function indexes<T, K>(xs: Iterable<T>, k: Proj<T, K>): Array<[K, T]>
export function indexes<T, K1, K2>(xs: Iterable<T>, k1: Proj<T, K1>, k2: Proj<T, K2>): Array<[K1, Array<[K2, T]>]>
export function indexes<T, K1, K2, K3>(
  xs: Iterable<T>,
  k1: Proj<T, K1>,
  k2: Proj<T, K2>,
  k3: Proj<T, K3>
): Array<[K1, Array<[K2, Array<[K3, T]>]>]>
export function indexes(xs: any, ...ks: any) {
  return nest(xs, Array.from, unique, ks)
}
function unique(xs: any[]) {
  if (xs.length !== 1) throw new Error("duplicate key")
  return xs[0]
}
function nest(xs: any, map: Function, reduce: Function, ks: any[]) {
  return (function regroup(vs, i) {
    if (i >= ks.length) return reduce(vs)
    const gs = new Map()
    const keyof = ks[i++]
    let j = -1
    for (const x of vs) {
      const k = keyof(x, ++j, vs)
      const g = gs.get(k)
      if (g) g.push(x)
      else gs.set(k, [x])
    }
    for (const [k, vs] of gs) {
      gs.set(k, regroup(vs, i))
    }
    return map(gs)
  })(xs, 0)
}
export function groupSort<T, K>(xs: Iterable<T>, f: (a: T[], b: T[]) => number, key: (x: T) => K): K[]
export function groupSort<T, K>(xs: Iterable<T>, f: (x: T[]) => unknown, key: (x: T) => K): K[]
export function groupSort(xs: any, f: Function, key: Function) {
  return (
    f.length !== 2
      ? sort(rollup(xs, f, key), ([ak, av], [bk, bv]) => qu.ascending(av, bv) || qu.ascending(ak, bk))
      : sort(group(xs, key), ([ak, av], [bk, bv]) => f(av, bv) || qu.ascending(ak, bk))
  ).map(([key]) => key)
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
export function nice(start: number, stop: number, count: number): qt.Pair {
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
  return x === undefined ? NaN : +x
}
export function* numbers(xs: any, f?: Function) {
  if (f === undefined) {
    for (let x of xs) {
      if (x !== undefined && (x = +x) >= x) yield x
    }
  } else {
    let i = -1
    for (let x of xs) {
      if ((x = f(x, ++i, xs)) !== undefined && (x = +x) >= x) yield x
    }
  }
}
export function permute<T, K extends keyof T>(x: T, ks: Iterable<K>): Array<T[K]>
export function permute<T>(x: { [key: number]: T }, ks: Iterable<number>): T[]
export function permute(x: any, ks: any) {
  return Array.from(ks, k => x[k])
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
function compareDefined(f = qu.ascending) {
  if (f === qu.ascending) return ascendingDefined
  if (typeof f !== "function") throw new TypeError("compare is not a function")
  return (a, b) => {
    const y = f(a, b)
    if (y || y === 0) return y
    return (f(b, b) === 0) - (f(a, a) === 0)
  }
}
function ascendingDefined(a, b) {
  return (a === undefined || !(a >= a)) - (b === undefined || !(b >= b)) || (a < b ? -1 : a > b ? 1 : 0)
}
export function subset<T>(a: Iterable<T>, b: Iterable<T>) {
  return superset(b, a)
}
export function superset<T>(a: Iterable<T>, b: Iterable<T>) {
  const it = a[Symbol.iterator]()
  const y = new Set()
  const intern = (x: any) => (x !== undefined && typeof x === "object" ? x.valueOf() : x)
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
export function thresholdFreedmanDiaconis(xs: ArrayLike<number | undefined>, min: number, max: number) {
  return Math.ceil((max - min) / (2 * (quantile(xs, 0.75) - quantile(xs, 0.25)) * Math.pow(count(xs), -1 / 3)))
}
export function thresholdScott(xs: ArrayLike<number | undefined>, min: number, max: number) {
  return Math.ceil(((max - min) * Math.cbrt(count(xs))) / (3.49 * deviation(xs)))
}
export function thresholdSturges(xs: ArrayLike<number | undefined>) {
  return Math.ceil(Math.log(count(xs)) / Math.LN2) + 1
}
