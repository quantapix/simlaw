var array = Array.prototype

export var slice = array.slice
export var map = array.map
export default function ascending(a, b) {
  return a == null || b == null ? NaN : a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN
}
import { slice } from "./array.js"
import bisect from "./bisect.js"
import constant from "./constant.js"
import extent from "./extent.js"
import identity from "./identity.js"
import nice from "./nice.js"
import ticks, { tickIncrement } from "./ticks.js"
import sturges from "./threshold/sturges.js"

export default function bin() {
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

    // Convert number of thresholds into uniform thresholds, and nice the
    // default domain accordingly.
    if (!Array.isArray(tz)) {
      const max = x1,
        tn = +tz
      if (domain === extent) [x0, x1] = nice(x0, x1, tn)
      tz = ticks(x0, x1, tn)

      // If the domain is aligned with the first tick (which it will by
      // default), then we can use quantization rather than bisection to bin
      // values, which is substantially faster.
      if (tz[0] <= x0) step = tickIncrement(x0, x1, tn)

      // If the last threshold is coincident with the domain’s upper bound, the
      // last bin will be zero-width. If the default domain is used, and this
      // last threshold is coincident with the maximum input value, we can
      // extend the niced upper bound by one tick to ensure uniform bin widths;
      // otherwise, we simply remove the last threshold. Note that we don’t
      // coerce values or the domain to numbers, and thus must be careful to
      // compare order (>=) rather than strict equality (===)!
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

    // Remove any thresholds outside the domain.
    var m = tz.length
    while (tz[0] <= x0) tz.shift(), --m
    while (tz[m - 1] > x1) tz.pop(), --m

    var bins = new Array(m + 1),
      bin

    // Initialize bins.
    for (i = 0; i <= m; ++i) {
      bin = bins[i] = []
      bin.x0 = i > 0 ? tz[i - 1] : x0
      bin.x1 = i < m ? tz[i] : x1
    }

    // Assign data to bins by value, ignoring any outside the domain.
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
import ascending from "./ascending.js"
import bisector from "./bisector.js"
import number from "./number.js"

const ascendingBisect = bisector(ascending)
export const bisectRight = ascendingBisect.right
export const bisectLeft = ascendingBisect.left
export const bisectCenter = bisector(number).center
export default bisectRight
import ascending from "./ascending.js"
import descending from "./descending.js"

export default function bisector(f) {
  let compare1, compare2, delta

  // If an accessor is specified, promote it to a comparator. In this case we
  // can test whether the search value is (self-) comparable. We can’t do this
  // for a comparator (except for specific, known comparators) because we can’t
  // tell if the comparator is symmetric, and an asymmetric comparator can’t be
  // used to test whether a single value is comparable.
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

// Given a target array T, a source array S, sets each value T[i] to the average
// of {S[i - r], …, S[i], …, S[i + r]}, where r = ⌊radius⌋, start <= i < stop,
// for each i, i + step, i + 2 * step, etc., and where S[j] is clamped between
// S[start] (inclusive) and S[stop] (exclusive). If the given radius is not an
// integer, S[i - r - 1] and S[i + r + 1] are added to the sum, each weighted
// according to r - ⌊radius⌋.
function blurf(radius) {
  const radius0 = Math.floor(radius)
  if (radius0 === radius) return bluri(radius)
  const t = radius - radius0
  const w = 2 * radius + 1
  return (T, S, start, stop, step) => {
    // stop must be aligned!
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

// Like blurf, but optimized for integer radius.
function bluri(radius) {
  const w = 2 * radius + 1
  return (T, S, start, stop, step) => {
    // stop must be aligned!
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
export default function constant(x) {
  return () => x
}
export default function count(values, valueof) {
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

export default function cross(...values) {
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
export default function cumsum(values, valueof) {
  var sum = 0,
    index = 0
  return Float64Array.from(
    values,
    valueof === undefined ? v => (sum += +v || 0) : v => (sum += +valueof(v, index++, values) || 0)
  )
}
export default function descending(a, b) {
  return a == null || b == null ? NaN : b < a ? -1 : b > a ? 1 : b >= a ? 0 : NaN
}
import variance from "./variance.js"

export default function deviation(values, valueof) {
  const v = variance(values, valueof)
  return v ? Math.sqrt(v) : v
}
import { InternSet } from "internmap"

export default function difference(values, ...others) {
  values = new InternSet(values)
  for (const other of others) {
    for (const value of other) {
      values.delete(value)
    }
  }
  return values
}
import { InternSet } from "internmap"

export default function disjoint(values, other) {
  const iterator = other[Symbol.iterator](),
    set = new InternSet()
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
export default function every(values, test) {
  if (typeof test !== "function") throw new TypeError("test is not a function")
  let index = -1
  for (const value of values) {
    if (!test(value, ++index, values)) {
      return false
    }
  }
  return true
}
export default function extent(values, valueof) {
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
export default function filter(values, test) {
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
// https://github.com/python/cpython/blob/a74eea238f5baba15797e2e8b570d153bc8690a7/Modules/mathmodule.c#L1423
export class Adder {
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

export function fcumsum(values, valueof) {
  const adder = new Adder()
  let index = -1
  return Float64Array.from(
    values,
    valueof === undefined ? v => adder.add(+v || 0) : v => adder.add(+valueof(v, ++index, values) || 0)
  )
}
import ascending from "./ascending.js"

export default function greatest(values, compare = ascending) {
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
import ascending from "./ascending.js"
import maxIndex from "./maxIndex.js"

export default function greatestIndex(values, compare = ascending) {
  if (compare.length === 1) return maxIndex(values, compare)
  let maxValue
  let max = -1
  let index = -1
  for (const value of values) {
    ++index
    if (max < 0 ? compare(value, value) === 0 : compare(value, maxValue) > 0) {
      maxValue = value
      max = index
    }
  }
  return max
}
import { InternMap } from "internmap"
import identity from "./identity.js"

export default function group(values, ...keys) {
  return nest(values, identity, identity, keys)
}

export function groups(values, ...keys) {
  return nest(values, Array.from, identity, keys)
}

function flatten(groups, keys) {
  for (let i = 1, n = keys.length; i < n; ++i) {
    groups = groups.flatMap(g => g.pop().map(([key, value]) => [...g, key, value]))
  }
  return groups
}

export function flatGroup(values, ...keys) {
  return flatten(groups(values, ...keys), keys)
}

export function flatRollup(values, reduce, ...keys) {
  return flatten(rollups(values, reduce, ...keys), keys)
}

export function rollup(values, reduce, ...keys) {
  return nest(values, identity, reduce, keys)
}

export function rollups(values, reduce, ...keys) {
  return nest(values, Array.from, reduce, keys)
}

export function index(values, ...keys) {
  return nest(values, identity, unique, keys)
}

export function indexes(values, ...keys) {
  return nest(values, Array.from, unique, keys)
}

function unique(values) {
  if (values.length !== 1) throw new Error("duplicate key")
  return values[0]
}

function nest(values, map, reduce, keys) {
  return (function regroup(values, i) {
    if (i >= keys.length) return reduce(values)
    const groups = new InternMap()
    const keyof = keys[i++]
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
import ascending from "./ascending.js"
import group, { rollup } from "./group.js"
import sort from "./sort.js"

export default function groupSort(values, reduce, key) {
  return (
    reduce.length !== 2
      ? sort(rollup(values, reduce, key), ([ak, av], [bk, bv]) => ascending(av, bv) || ascending(ak, bk))
      : sort(group(values, key), ([ak, av], [bk, bv]) => reduce(av, bv) || ascending(ak, bk))
  ).map(([key]) => key)
}
export default function identity(x) {
  return x
}
export { default as bisect, bisectRight, bisectLeft, bisectCenter } from "./bisect.js"
export { default as ascending } from "./ascending.js"
export { default as bisector } from "./bisector.js"
export { blur, blur2, blurImage } from "./blur.js"
export { default as count } from "./count.js"
export { default as cross } from "./cross.js"
export { default as cumsum } from "./cumsum.js"
export { default as descending } from "./descending.js"
export { default as deviation } from "./deviation.js"
export { default as extent } from "./extent.js"
export { Adder, fsum, fcumsum } from "./fsum.js"
export { default as group, flatGroup, flatRollup, groups, index, indexes, rollup, rollups } from "./group.js"
export { default as groupSort } from "./groupSort.js"
export { default as bin, default as histogram } from "./bin.js" // Deprecated; use bin.
export { default as thresholdFreedmanDiaconis } from "./threshold/freedmanDiaconis.js"
export { default as thresholdScott } from "./threshold/scott.js"
export { default as thresholdSturges } from "./threshold/sturges.js"
export { default as max } from "./max.js"
export { default as maxIndex } from "./maxIndex.js"
export { default as mean } from "./mean.js"
export { default as median, medianIndex } from "./median.js"
export { default as merge } from "./merge.js"
export { default as min } from "./min.js"
export { default as minIndex } from "./minIndex.js"
export { default as mode } from "./mode.js"
export { default as nice } from "./nice.js"
export { default as pairs } from "./pairs.js"
export { default as permute } from "./permute.js"
export { default as quantile, quantileIndex, quantileSorted } from "./quantile.js"
export { default as quickselect } from "./quickselect.js"
export { default as range } from "./range.js"
export { default as rank } from "./rank.js"
export { default as least } from "./least.js"
export { default as leastIndex } from "./leastIndex.js"
export { default as greatest } from "./greatest.js"
export { default as greatestIndex } from "./greatestIndex.js"
export { default as scan } from "./scan.js" // Deprecated; use leastIndex.
export { default as shuffle, shuffler } from "./shuffle.js"
export { default as sum } from "./sum.js"
export { default as ticks, tickIncrement, tickStep } from "./ticks.js"
export { default as transpose } from "./transpose.js"
export { default as variance } from "./variance.js"
export { default as zip } from "./zip.js"
export { default as every } from "./every.js"
export { default as some } from "./some.js"
export { default as filter } from "./filter.js"
export { default as map } from "./map.js"
export { default as reduce } from "./reduce.js"
export { default as reverse } from "./reverse.js"
export { default as sort } from "./sort.js"
export { default as difference } from "./difference.js"
export { default as disjoint } from "./disjoint.js"
export { default as intersection } from "./intersection.js"
export { default as subset } from "./subset.js"
export { default as superset } from "./superset.js"
export { default as union } from "./union.js"
export { InternMap, InternSet } from "internmap"
import { InternSet } from "internmap"

export default function intersection(values, ...others) {
  values = new InternSet(values)
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
  return values instanceof InternSet ? values : new InternSet(values)
}
import ascending from "./ascending.js"

export default function least(values, compare = ascending) {
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
import ascending from "./ascending.js"
import minIndex from "./minIndex.js"

export default function leastIndex(values, compare = ascending) {
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
export default function map(values, mapper) {
  if (typeof values[Symbol.iterator] !== "function") throw new TypeError("values is not iterable")
  if (typeof mapper !== "function") throw new TypeError("mapper is not a function")
  return Array.from(values, (value, index) => mapper(value, index, values))
}
export default function max(values, valueof) {
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
export default function maxIndex(values, valueof) {
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
export default function mean(values, valueof) {
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
import quantile, { quantileIndex } from "./quantile.js"

export default function median(values, valueof) {
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

export default function merge(arrays) {
  return Array.from(flatten(arrays))
}
export default function min(values, valueof) {
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
export default function minIndex(values, valueof) {
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
import { InternMap } from "internmap"

export default function mode(values, valueof) {
  const counts = new InternMap()
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
import { tickIncrement } from "./ticks.js"

export default function nice(start, stop, count) {
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
export default function number(x) {
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
export default function pairs(values, pairof = pair) {
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
export default function permute(source, keys) {
  return Array.from(keys, key => source[key])
}
import max from "./max.js"
import maxIndex from "./maxIndex.js"
import min from "./min.js"
import minIndex from "./minIndex.js"
import quickselect from "./quickselect.js"
import number, { numbers } from "./number.js"
import { ascendingDefined } from "./sort.js"
import greatest from "./greatest.js"

export default function quantile(values, p, valueof) {
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
import { ascendingDefined, compareDefined } from "./sort.js"

// Based on https://github.com/mourner/quickselect
// ISC license, Copyright 2018 Vladimir Agafonkin.
export default function quickselect(array, k, left = 0, right = array.length - 1, compare) {
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
export default function range(start, stop, step) {
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
import ascending from "./ascending.js"
import { ascendingDefined, compareDefined } from "./sort.js"

export default function rank(values, valueof = ascending) {
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
export default function reduce(values, reducer, value) {
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
export default function reverse(values) {
  if (typeof values[Symbol.iterator] !== "function") throw new TypeError("values is not iterable")
  return Array.from(values).reverse()
}
import leastIndex from "./leastIndex.js"

export default function scan(values, compare) {
  const index = leastIndex(values, compare)
  return index < 0 ? undefined : index
}
export default shuffler(Math.random)

export function shuffler(random) {
  return function shuffle(array, i0 = 0, i1 = array.length) {
    let m = i1 - (i0 = +i0)
    while (m) {
      const i = (random() * m--) | 0,
        t = array[m + i0]
      array[m + i0] = array[i + i0]
      array[i + i0] = t
    }
    return array
  }
}
export default function some(values, test) {
  if (typeof test !== "function") throw new TypeError("test is not a function")
  let index = -1
  for (const value of values) {
    if (test(value, ++index, values)) {
      return true
    }
  }
  return false
}
import ascending from "./ascending.js"
import permute from "./permute.js"

export default function sort(values, ...F) {
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
import superset from "./superset.js"

export default function subset(values, other) {
  return superset(other, values)
}
export default function sum(values, valueof) {
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
export default function superset(values, other) {
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
var e10 = Math.sqrt(50),
  e5 = Math.sqrt(10),
  e2 = Math.sqrt(2)

export default function ticks(start, stop, count) {
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

export function tickIncrement(start, stop, count) {
  var step = (stop - start) / Math.max(0, count),
    power = Math.floor(Math.log(step) / Math.LN10),
    error = step / Math.pow(10, power)
  return power >= 0
    ? (error >= e10 ? 10 : error >= e5 ? 5 : error >= e2 ? 2 : 1) * Math.pow(10, power)
    : -Math.pow(10, -power) / (error >= e10 ? 10 : error >= e5 ? 5 : error >= e2 ? 2 : 1)
}

export function tickStep(start, stop, count) {
  var step0 = Math.abs(stop - start) / Math.max(0, count),
    step1 = Math.pow(10, Math.floor(Math.log(step0) / Math.LN10)),
    error = step0 / step1
  if (error >= e10) step1 *= 10
  else if (error >= e5) step1 *= 5
  else if (error >= e2) step1 *= 2
  return stop < start ? -step1 : step1
}
import min from "./min.js"

export default function transpose(matrix) {
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
import { InternSet } from "internmap"

export default function union(...others) {
  const set = new InternSet()
  for (const other of others) {
    for (const o of other) {
      set.add(o)
    }
  }
  return set
}
export default function variance(values, valueof) {
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
import transpose from "./transpose.js"

export default function zip() {
  return transpose(arguments)
}
