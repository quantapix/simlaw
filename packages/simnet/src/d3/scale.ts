import { ascending, bisect, quantile, quantileSorted as threshold } from "./array.js"
import { format, formatPrefix, formatSpecifier, precisionFixed, precisionPrefix, precisionRound } from "./format.js"
import { InternMap } from "./array.js"
import { interpolate as interpolateValue, interpolateNumber, interpolateRound } from "./interpolate.js"
import { interpolate, piecewise } from "./interpolate.js"
import { range as sequence } from "./array.js"
import { ticks, tickIncrement } from "./array.js"
import { tickStep } from "./array.js"
import { timeFormat } from "./time-format.js"
import { utcFormat } from "./time-format.js"
import { utcYear, utcMonth, utcWeek, utcDay, utcHour, utcMinute, utcSecond, utcTicks, utcTickInterval } from "./time.js"
import {
  timeYear,
  timeMonth,
  timeWeek,
  timeDay,
  timeHour,
  timeMinute,
  timeSecond,
  timeTicks,
  timeTickInterval,
} from "./time.js"

export function band() {
  let scale = ordinal().unknown(undefined),
    domain = scale.domain,
    ordinalRange = scale.range,
    r0 = 0,
    r1 = 1,
    step,
    bandwidth,
    round = false,
    paddingInner = 0,
    paddingOuter = 0,
    align = 0.5
  delete scale.unknown
  function rescale() {
    let n = domain().length,
      reverse = r1 < r0,
      start = reverse ? r1 : r0,
      stop = reverse ? r0 : r1
    step = (stop - start) / Math.max(1, n - paddingInner + paddingOuter * 2)
    if (round) step = Math.floor(step)
    start += (stop - start - step * (n - paddingInner)) * align
    bandwidth = step * (1 - paddingInner)
    if (round) (start = Math.round(start)), (bandwidth = Math.round(bandwidth))
    const values = sequence(n).map(function (i) {
      return start + step * i
    })
    return ordinalRange(reverse ? values.reverse() : values)
  }
  scale.domain = function (_) {
    return arguments.length ? (domain(_), rescale()) : domain()
  }
  scale.range = function (_) {
    return arguments.length ? (([r0, r1] = _), (r0 = +r0), (r1 = +r1), rescale()) : [r0, r1]
  }
  scale.rangeRound = function (_) {
    return ([r0, r1] = _), (r0 = +r0), (r1 = +r1), (round = true), rescale()
  }
  scale.bandwidth = function () {
    return bandwidth
  }
  scale.step = function () {
    return step
  }
  scale.round = function (_) {
    return arguments.length ? ((round = !!_), rescale()) : round
  }
  scale.padding = function (_) {
    return arguments.length ? ((paddingInner = Math.min(1, (paddingOuter = +_))), rescale()) : paddingInner
  }
  scale.paddingInner = function (_) {
    return arguments.length ? ((paddingInner = Math.min(1, _)), rescale()) : paddingInner
  }
  scale.paddingOuter = function (_) {
    return arguments.length ? ((paddingOuter = +_), rescale()) : paddingOuter
  }
  scale.align = function (_) {
    return arguments.length ? ((align = Math.max(0, Math.min(1, _))), rescale()) : align
  }
  scale.copy = function () {
    return band(domain(), [r0, r1]).round(round).paddingInner(paddingInner).paddingOuter(paddingOuter).align(align)
  }
  return initRange.apply(rescale(), arguments)
}
function pointish(scale) {
  const copy = scale.copy
  scale.padding = scale.paddingOuter
  delete scale.paddingInner
  delete scale.paddingOuter
  scale.copy = function () {
    return pointish(copy())
  }
  return scale
}
export function point() {
  return pointish(band.apply(null, arguments).paddingInner(1))
}
export function colors(s) {
  return s.match(/.{6}/g).map(function (x) {
    return "#" + x
  })
}
export function constants(x) {
  return function () {
    return x
  }
}
const unit = [0, 1]
export function identity(x) {
  return x
}
function normalize(a, b) {
  return (b -= a = +a)
    ? function (x) {
        return (x - a) / b
      }
    : constant(isNaN(b) ? NaN : 0.5)
}
function clamper(a, b) {
  let t
  if (a > b) (t = a), (a = b), (b = t)
  return function (x) {
    return Math.max(a, Math.min(b, x))
  }
}
function bimap(domain, range, interpolate) {
  let d0 = domain[0],
    d1 = domain[1],
    r0 = range[0],
    r1 = range[1]
  if (d1 < d0) (d0 = normalize(d1, d0)), (r0 = interpolate(r1, r0))
  else (d0 = normalize(d0, d1)), (r0 = interpolate(r0, r1))
  return function (x) {
    return r0(d0(x))
  }
}
function polymap(domain, range, interpolate) {
  let j = Math.min(domain.length, range.length) - 1,
    d = new Array(j),
    r = new Array(j),
    i = -1
  if (domain[j] < domain[0]) {
    domain = domain.slice().reverse()
    range = range.slice().reverse()
  }
  while (++i < j) {
    d[i] = normalize(domain[i], domain[i + 1])
    r[i] = interpolate(range[i], range[i + 1])
  }
  return function (x) {
    const i = bisect(domain, x, 1, j) - 1
    return r[i](d[i](x))
  }
}
export function copy(source, target) {
  return target
    .domain(source.domain())
    .range(source.range())
    .interpolate(source.interpolate())
    .clamp(source.clamp())
    .unknown(source.unknown())
}
export function transformer() {
  let domain = unit,
    range = unit,
    interpolate = interpolateValue,
    transform,
    untransform,
    unknown,
    clamp = identity,
    piecewise,
    output,
    input
  function rescale() {
    const n = Math.min(domain.length, range.length)
    if (clamp !== identity) clamp = clamper(domain[0], domain[n - 1])
    piecewise = n > 2 ? polymap : bimap
    output = input = null
    return scale
  }
  function scale(x) {
    return x == null || isNaN((x = +x))
      ? unknown
      : (output || (output = piecewise(domain.map(transform), range, interpolate)))(transform(clamp(x)))
  }
  scale.invert = function (y) {
    return clamp(untransform((input || (input = piecewise(range, domain.map(transform), interpolateNumber)))(y)))
  }
  scale.domain = function (_) {
    return arguments.length ? ((domain = Array.from(_, number)), rescale()) : domain.slice()
  }
  scale.range = function (_) {
    return arguments.length ? ((range = Array.from(_)), rescale()) : range.slice()
  }
  scale.rangeRound = function (_) {
    return (range = Array.from(_)), (interpolate = interpolateRound), rescale()
  }
  scale.clamp = function (_) {
    return arguments.length ? ((clamp = _ ? true : identity), rescale()) : clamp !== identity
  }
  scale.interpolate = function (_) {
    return arguments.length ? ((interpolate = _), rescale()) : interpolate
  }
  scale.unknown = function (_) {
    return arguments.length ? ((unknown = _), scale) : unknown
  }
  return function (t, u) {
    ;(transform = t), (untransform = u)
    return rescale()
  }
}
export function continuous() {
  return transformer()(identity, identity)
}
function transformer() {
  let x0 = 0,
    x1 = 0.5,
    x2 = 1,
    s = 1,
    t0,
    t1,
    t2,
    k10,
    k21,
    interpolator = identity,
    transform,
    clamp = false,
    unknown
  function scale(x) {
    return isNaN((x = +x))
      ? unknown
      : ((x = 0.5 + ((x = +transform(x)) - t1) * (s * x < s * t1 ? k10 : k21)),
        interpolator(clamp ? Math.max(0, Math.min(1, x)) : x))
  }
  scale.domain = function (_) {
    return arguments.length
      ? (([x0, x1, x2] = _),
        (t0 = transform((x0 = +x0))),
        (t1 = transform((x1 = +x1))),
        (t2 = transform((x2 = +x2))),
        (k10 = t0 === t1 ? 0 : 0.5 / (t1 - t0)),
        (k21 = t1 === t2 ? 0 : 0.5 / (t2 - t1)),
        (s = t1 < t0 ? -1 : 1),
        scale)
      : [x0, x1, x2]
  }
  scale.clamp = function (_) {
    return arguments.length ? ((clamp = !!_), scale) : clamp
  }
  scale.interpolator = function (_) {
    return arguments.length ? ((interpolator = _), scale) : interpolator
  }
  function range(interpolate) {
    return function (_) {
      let r0, r1, r2
      return arguments.length
        ? (([r0, r1, r2] = _), (interpolator = piecewise(interpolate, [r0, r1, r2])), scale)
        : [interpolator(0), interpolator(0.5), interpolator(1)]
    }
  }
  scale.range = range(interpolate)
  scale.rangeRound = range(interpolateRound)
  scale.unknown = function (_) {
    return arguments.length ? ((unknown = _), scale) : unknown
  }
  return function (t) {
    ;(transform = t),
      (t0 = t(x0)),
      (t1 = t(x1)),
      (t2 = t(x2)),
      (k10 = t0 === t1 ? 0 : 0.5 / (t1 - t0)),
      (k21 = t1 === t2 ? 0 : 0.5 / (t2 - t1)),
      (s = t1 < t0 ? -1 : 1)
    return scale
  }
}
export function diverging() {
  const scale = linearish(transformer()(identity))
  scale.copy = function () {
    return copy(scale, diverging())
  }
  return initInterpolator.apply(scale, arguments)
}
export function divergingLog() {
  const scale = loggish(transformer()).domain([0.1, 1, 10])
  scale.copy = function () {
    return copy(scale, divergingLog()).base(scale.base())
  }
  return initInterpolator.apply(scale, arguments)
}
export function divergingSymlog() {
  const scale = symlogish(transformer())
  scale.copy = function () {
    return copy(scale, divergingSymlog()).constant(scale.constant())
  }
  return initInterpolator.apply(scale, arguments)
}
export function divergingPow() {
  const scale = powish(transformer())
  scale.copy = function () {
    return copy(scale, divergingPow()).exponent(scale.exponent())
  }
  return initInterpolator.apply(scale, arguments)
}
export function divergingSqrt() {
  return divergingPow.apply(null, arguments).exponent(0.5)
}
export function identity(domain) {
  let unknown
  function scale(x) {
    return x == null || isNaN((x = +x)) ? unknown : x
  }
  scale.invert = scale
  scale.domain = scale.range = function (_) {
    return arguments.length ? ((domain = Array.from(_, number)), scale) : domain.slice()
  }
  scale.unknown = function (_) {
    return arguments.length ? ((unknown = _), scale) : unknown
  }
  scale.copy = function () {
    return identity(domain).unknown(unknown)
  }
  domain = arguments.length ? Array.from(domain, number) : [0, 1]
  return linearish(scale)
}
export function initRange(domain, range) {
  switch (arguments.length) {
    case 0:
      break
    case 1:
      this.range(domain)
      break
    default:
      this.range(range).domain(domain)
      break
  }
  return this
}
export function initInterpolator(domain, interpolator) {
  switch (arguments.length) {
    case 0:
      break
    case 1: {
      if (typeof domain === "function") this.interpolator(domain)
      else this.range(domain)
      break
    }
    default: {
      this.domain(domain)
      if (typeof interpolator === "function") this.interpolator(interpolator)
      else this.range(interpolator)
      break
    }
  }
  return this
}
export function linearish(scale) {
  const domain = scale.domain
  scale.ticks = function (count) {
    const d = domain()
    return ticks(d[0], d[d.length - 1], count == null ? 10 : count)
  }
  scale.tickFormat = function (count, specifier) {
    const d = domain()
    return tickFormat(d[0], d[d.length - 1], count == null ? 10 : count, specifier)
  }
  scale.nice = function (count) {
    if (count == null) count = 10
    const d = domain()
    let i0 = 0
    let i1 = d.length - 1
    let start = d[i0]
    let stop = d[i1]
    let prestep
    let step
    let maxIter = 10
    if (stop < start) {
      ;(step = start), (start = stop), (stop = step)
      ;(step = i0), (i0 = i1), (i1 = step)
    }
    while (maxIter-- > 0) {
      step = tickIncrement(start, stop, count)
      if (step === prestep) {
        d[i0] = start
        d[i1] = stop
        return domain(d)
      } else if (step > 0) {
        start = Math.floor(start / step) * step
        stop = Math.ceil(stop / step) * step
      } else if (step < 0) {
        start = Math.ceil(start * step) / step
        stop = Math.floor(stop * step) / step
      } else {
        break
      }
      prestep = step
    }
    return scale
  }
  return scale
}
export function linear() {
  const scale = continuous()
  scale.copy = function () {
    return copy(scale, linear())
  }
  initRange.apply(scale, arguments)
  return linearish(scale)
}
function transformLog(x) {
  return Math.log(x)
}
function transformExp(x) {
  return Math.exp(x)
}
function transformLogn(x) {
  return -Math.log(-x)
}
function transformExpn(x) {
  return -Math.exp(-x)
}
function pow10(x) {
  return isFinite(x) ? +("1e" + x) : x < 0 ? 0 : x
}
function powp(base) {
  return base === 10 ? pow10 : base === Math.E ? Math.exp : x => Math.pow(base, x)
}
function logp(base) {
  return base === Math.E
    ? Math.log
    : (base === 10 && Math.log10) || (base === 2 && Math.log2) || ((base = Math.log(base)), x => Math.log(x) / base)
}
function reflect(f) {
  return (x, k) => -f(-x, k)
}
export function loggish(transform) {
  const scale = transform(transformLog, transformExp)
  const domain = scale.domain
  let base = 10
  let logs
  let pows
  function rescale() {
    ;(logs = logp(base)), (pows = powp(base))
    if (domain()[0] < 0) {
      ;(logs = reflect(logs)), (pows = reflect(pows))
      transform(transformLogn, transformExpn)
    } else {
      transform(transformLog, transformExp)
    }
    return scale
  }
  scale.base = function (_) {
    return arguments.length ? ((base = +_), rescale()) : base
  }
  scale.domain = function (_) {
    return arguments.length ? (domain(_), rescale()) : domain()
  }
  scale.ticks = count => {
    const d = domain()
    let u = d[0]
    let v = d[d.length - 1]
    const r = v < u
    if (r) [u, v] = [v, u]
    let i = logs(u)
    let j = logs(v)
    let k
    let t
    const n = count == null ? 10 : +count
    let z = []
    if (!(base % 1) && j - i < n) {
      ;(i = Math.floor(i)), (j = Math.ceil(j))
      if (u > 0)
        for (; i <= j; ++i) {
          for (k = 1; k < base; ++k) {
            t = i < 0 ? k / pows(-i) : k * pows(i)
            if (t < u) continue
            if (t > v) break
            z.push(t)
          }
        }
      else
        for (; i <= j; ++i) {
          for (k = base - 1; k >= 1; --k) {
            t = i > 0 ? k / pows(-i) : k * pows(i)
            if (t < u) continue
            if (t > v) break
            z.push(t)
          }
        }
      if (z.length * 2 < n) z = ticks(u, v, n)
    } else {
      z = ticks(i, j, Math.min(j - i, n)).map(pows)
    }
    return r ? z.reverse() : z
  }
  scale.tickFormat = (count, specifier) => {
    if (count == null) count = 10
    if (specifier == null) specifier = base === 10 ? "s" : ","
    if (typeof specifier !== "function") {
      if (!(base % 1) && (specifier = formatSpecifier(specifier)).precision == null) specifier.trim = true
      specifier = format(specifier)
    }
    if (count === Infinity) return specifier
    const k = Math.max(1, (base * count) / scale.ticks().length) // TODO fast estimate?
    return d => {
      let i = d / pows(Math.round(logs(d)))
      if (i * base < base - 0.5) i *= base
      return i <= k ? specifier(d) : ""
    }
  }
  scale.nice = () => {
    return domain(
      nice(domain(), {
        floor: x => pows(Math.floor(logs(x))),
        ceil: x => pows(Math.ceil(logs(x))),
      })
    )
  }
  return scale
}
export function log() {
  const scale = loggish(transformer()).domain([1, 10])
  scale.copy = () => copy(scale, log()).base(scale.base())
  initRange.apply(scale, arguments)
  return scale
}
export function nice(domain, interval) {
  domain = domain.slice()
  let i0 = 0,
    i1 = domain.length - 1,
    x0 = domain[i0],
    x1 = domain[i1],
    t
  if (x1 < x0) {
    ;(t = i0), (i0 = i1), (i1 = t)
    ;(t = x0), (x0 = x1), (x1 = t)
  }
  domain[i0] = interval.floor(x0)
  domain[i1] = interval.ceil(x1)
  return domain
}
export function number(x) {
  return +x
}
export const implicit = Symbol("implicit")
export function ordinal() {
  let index = new InternMap(),
    domain = [],
    range = [],
    unknown = implicit
  function scale(d) {
    let i = index.get(d)
    if (i === undefined) {
      if (unknown !== implicit) return unknown
      index.set(d, (i = domain.push(d) - 1))
    }
    return range[i % range.length]
  }
  scale.domain = function (_) {
    if (!arguments.length) return domain.slice()
    ;(domain = []), (index = new InternMap())
    for (const value of _) {
      if (index.has(value)) continue
      index.set(value, domain.push(value) - 1)
    }
    return scale
  }
  scale.range = function (_) {
    return arguments.length ? ((range = Array.from(_)), scale) : range.slice()
  }
  scale.unknown = function (_) {
    return arguments.length ? ((unknown = _), scale) : unknown
  }
  scale.copy = function () {
    return ordinal(domain, range).unknown(unknown)
  }
  initRange.apply(scale, arguments)
  return scale
}
function transformPow(exponent) {
  return function (x) {
    return x < 0 ? -Math.pow(-x, exponent) : Math.pow(x, exponent)
  }
}
function transformSqrt(x) {
  return x < 0 ? -Math.sqrt(-x) : Math.sqrt(x)
}
function transformSquare(x) {
  return x < 0 ? -x * x : x * x
}
export function powish(transform) {
  let scale = transform(identity, identity),
    exponent = 1
  function rescale() {
    return exponent === 1
      ? transform(identity, identity)
      : exponent === 0.5
      ? transform(transformSqrt, transformSquare)
      : transform(transformPow(exponent), transformPow(1 / exponent))
  }
  scale.exponent = function (_) {
    return arguments.length ? ((exponent = +_), rescale()) : exponent
  }
  return linearish(scale)
}
export function pow() {
  const scale = powish(transformer())
  scale.copy = function () {
    return copy(scale, pow()).exponent(scale.exponent())
  }
  initRange.apply(scale, arguments)
  return scale
}
export function sqrt() {
  return pow.apply(null, arguments).exponent(0.5)
}
export function quantile() {
  let domain = [],
    range = [],
    thresholds = [],
    unknown
  function rescale() {
    let i = 0,
      n = Math.max(1, range.length)
    thresholds = new Array(n - 1)
    while (++i < n) thresholds[i - 1] = threshold(domain, i / n)
    return scale
  }
  function scale(x) {
    return x == null || isNaN((x = +x)) ? unknown : range[bisect(thresholds, x)]
  }
  scale.invertExtent = function (y) {
    const i = range.indexOf(y)
    return i < 0
      ? [NaN, NaN]
      : [i > 0 ? thresholds[i - 1] : domain[0], i < thresholds.length ? thresholds[i] : domain[domain.length - 1]]
  }
  scale.domain = function (_) {
    if (!arguments.length) return domain.slice()
    domain = []
    for (let d of _) if (d != null && !isNaN((d = +d))) domain.push(d)
    domain.sort(ascending)
    return rescale()
  }
  scale.range = function (_) {
    return arguments.length ? ((range = Array.from(_)), rescale()) : range.slice()
  }
  scale.unknown = function (_) {
    return arguments.length ? ((unknown = _), scale) : unknown
  }
  scale.quantiles = function () {
    return thresholds.slice()
  }
  scale.copy = function () {
    return quantile().domain(domain).range(range).unknown(unknown)
  }
  return initRange.apply(scale, arguments)
}
export function quantize() {
  let x0 = 0,
    x1 = 1,
    n = 1,
    domain = [0.5],
    range = [0, 1],
    unknown
  function scale(x) {
    return x != null && x <= x ? range[bisect(domain, x, 0, n)] : unknown
  }
  function rescale() {
    let i = -1
    domain = new Array(n)
    while (++i < n) domain[i] = ((i + 1) * x1 - (i - n) * x0) / (n + 1)
    return scale
  }
  scale.domain = function (_) {
    return arguments.length ? (([x0, x1] = _), (x0 = +x0), (x1 = +x1), rescale()) : [x0, x1]
  }
  scale.range = function (_) {
    return arguments.length ? ((n = (range = Array.from(_)).length - 1), rescale()) : range.slice()
  }
  scale.invertExtent = function (y) {
    const i = range.indexOf(y)
    return i < 0 ? [NaN, NaN] : i < 1 ? [x0, domain[0]] : i >= n ? [domain[n - 1], x1] : [domain[i - 1], domain[i]]
  }
  scale.unknown = function (_) {
    return arguments.length ? ((unknown = _), scale) : scale
  }
  scale.thresholds = function () {
    return domain.slice()
  }
  scale.copy = function () {
    return quantize().domain([x0, x1]).range(range).unknown(unknown)
  }
  return initRange.apply(linearish(scale), arguments)
}
function square(x) {
  return Math.sign(x) * x * x
}
function unsquare(x) {
  return Math.sign(x) * Math.sqrt(Math.abs(x))
}
export function radial() {
  let squared = continuous(),
    range = [0, 1],
    round = false,
    unknown
  function scale(x) {
    const y = unsquare(squared(x))
    return isNaN(y) ? unknown : round ? Math.round(y) : y
  }
  scale.invert = function (y) {
    return squared.invert(square(y))
  }
  scale.domain = function (_) {
    return arguments.length ? (squared.domain(_), scale) : squared.domain()
  }
  scale.range = function (_) {
    return arguments.length ? (squared.range((range = Array.from(_, number)).map(square)), scale) : range.slice()
  }
  scale.rangeRound = function (_) {
    return scale.range(_).round(true)
  }
  scale.round = function (_) {
    return arguments.length ? ((round = !!_), scale) : round
  }
  scale.clamp = function (_) {
    return arguments.length ? (squared.clamp(_), scale) : squared.clamp()
  }
  scale.unknown = function (_) {
    return arguments.length ? ((unknown = _), scale) : unknown
  }
  scale.copy = function () {
    return radial(squared.domain(), range).round(round).clamp(squared.clamp()).unknown(unknown)
  }
  initRange.apply(scale, arguments)
  return linearish(scale)
}
function transformer() {
  let x0 = 0,
    x1 = 1,
    t0,
    t1,
    k10,
    transform,
    interpolator = identity,
    clamp = false,
    unknown
  function scale(x) {
    return x == null || isNaN((x = +x))
      ? unknown
      : interpolator(k10 === 0 ? 0.5 : ((x = (transform(x) - t0) * k10), clamp ? Math.max(0, Math.min(1, x)) : x))
  }
  scale.domain = function (_) {
    return arguments.length
      ? (([x0, x1] = _),
        (t0 = transform((x0 = +x0))),
        (t1 = transform((x1 = +x1))),
        (k10 = t0 === t1 ? 0 : 1 / (t1 - t0)),
        scale)
      : [x0, x1]
  }
  scale.clamp = function (_) {
    return arguments.length ? ((clamp = !!_), scale) : clamp
  }
  scale.interpolator = function (_) {
    return arguments.length ? ((interpolator = _), scale) : interpolator
  }
  function range(interpolate) {
    return function (_) {
      let r0, r1
      return arguments.length
        ? (([r0, r1] = _), (interpolator = interpolate(r0, r1)), scale)
        : [interpolator(0), interpolator(1)]
    }
  }
  scale.range = range(interpolate)
  scale.rangeRound = range(interpolateRound)
  scale.unknown = function (_) {
    return arguments.length ? ((unknown = _), scale) : unknown
  }
  return function (t) {
    ;(transform = t), (t0 = t(x0)), (t1 = t(x1)), (k10 = t0 === t1 ? 0 : 1 / (t1 - t0))
    return scale
  }
}
export function copy(source, target) {
  return target
    .domain(source.domain())
    .interpolator(source.interpolator())
    .clamp(source.clamp())
    .unknown(source.unknown())
}
export function sequential() {
  const scale = linearish(transformer()(identity))
  scale.copy = function () {
    return copy(scale, sequential())
  }
  return initInterpolator.apply(scale, arguments)
}
export function sequentialLog() {
  const scale = loggish(transformer()).domain([1, 10])
  scale.copy = function () {
    return copy(scale, sequentialLog()).base(scale.base())
  }
  return initInterpolator.apply(scale, arguments)
}
export function sequentialSymlog() {
  const scale = symlogish(transformer())
  scale.copy = function () {
    return copy(scale, sequentialSymlog()).constant(scale.constant())
  }
  return initInterpolator.apply(scale, arguments)
}
export function sequentialPow() {
  const scale = powish(transformer())
  scale.copy = function () {
    return copy(scale, sequentialPow()).exponent(scale.exponent())
  }
  return initInterpolator.apply(scale, arguments)
}
export function sequentialSqrt() {
  return sequentialPow.apply(null, arguments).exponent(0.5)
}
export function sequentialQuantile() {
  let domain = [],
    interpolator = identity
  function scale(x) {
    if (x != null && !isNaN((x = +x))) return interpolator((bisect(domain, x, 1) - 1) / (domain.length - 1))
  }
  scale.domain = function (_) {
    if (!arguments.length) return domain.slice()
    domain = []
    for (let d of _) if (d != null && !isNaN((d = +d))) domain.push(d)
    domain.sort(ascending)
    return scale
  }
  scale.interpolator = function (_) {
    return arguments.length ? ((interpolator = _), scale) : interpolator
  }
  scale.range = function () {
    return domain.map((d, i) => interpolator(i / (domain.length - 1)))
  }
  scale.quantiles = function (n) {
    return Array.from({ length: n + 1 }, (_, i) => quantile(domain, i / n))
  }
  scale.copy = function () {
    return sequentialQuantile(interpolator).domain(domain)
  }
  return initInterpolator.apply(scale, arguments)
}
function transformSymlog(c) {
  return function (x) {
    return Math.sign(x) * Math.log1p(Math.abs(x / c))
  }
}
function transformSymexp(c) {
  return function (x) {
    return Math.sign(x) * Math.expm1(Math.abs(x)) * c
  }
}
export function symlogish(transform) {
  let c = 1,
    scale = transform(transformSymlog(c), transformSymexp(c))
  scale.constant = function (_) {
    return arguments.length ? transform(transformSymlog((c = +_)), transformSymexp(c)) : c
  }
  return linearish(scale)
}
export function symlog() {
  const scale = symlogish(transformer())
  scale.copy = function () {
    return copy(scale, symlog()).constant(scale.constant())
  }
  return initRange.apply(scale, arguments)
}
export function threshold() {
  let domain = [0.5],
    range = [0, 1],
    unknown,
    n = 1
  function scale(x) {
    return x != null && x <= x ? range[bisect(domain, x, 0, n)] : unknown
  }
  scale.domain = function (_) {
    return arguments.length
      ? ((domain = Array.from(_)), (n = Math.min(domain.length, range.length - 1)), scale)
      : domain.slice()
  }
  scale.range = function (_) {
    return arguments.length
      ? ((range = Array.from(_)), (n = Math.min(domain.length, range.length - 1)), scale)
      : range.slice()
  }
  scale.invertExtent = function (y) {
    const i = range.indexOf(y)
    return [domain[i - 1], domain[i]]
  }
  scale.unknown = function (_) {
    return arguments.length ? ((unknown = _), scale) : unknown
  }
  scale.copy = function () {
    return threshold().domain(domain).range(range).unknown(unknown)
  }
  return initRange.apply(scale, arguments)
}
export function tickFormat(start, stop, count, specifier) {
  let step = tickStep(start, stop, count),
    precision
  specifier = formatSpecifier(specifier == null ? ",f" : specifier)
  switch (specifier.type) {
    case "s": {
      const value = Math.max(Math.abs(start), Math.abs(stop))
      if (specifier.precision == null && !isNaN((precision = precisionPrefix(step, value))))
        specifier.precision = precision
      return formatPrefix(specifier, value)
    }
    case "":
    case "e":
    case "g":
    case "p":
    case "r": {
      if (
        specifier.precision == null &&
        !isNaN((precision = precisionRound(step, Math.max(Math.abs(start), Math.abs(stop)))))
      )
        specifier.precision = precision - (specifier.type === "e")
      break
    }
    case "f":
    case "%": {
      if (specifier.precision == null && !isNaN((precision = precisionFixed(step))))
        specifier.precision = precision - (specifier.type === "%") * 2
      break
    }
  }
  return format(specifier)
}
function date(t) {
  return new Date(t)
}
function number(t) {
  return t instanceof Date ? +t : +new Date(+t)
}
export function calendar(ticks, tickInterval, year, month, week, day, hour, minute, second, format) {
  const scale = continuous(),
    invert = scale.invert,
    domain = scale.domain
  const formatMillisecond = format(".%L"),
    formatSecond = format(":%S"),
    formatMinute = format("%I:%M"),
    formatHour = format("%I %p"),
    formatDay = format("%a %d"),
    formatWeek = format("%b %d"),
    formatMonth = format("%B"),
    formatYear = format("%Y")
  function tickFormat(date) {
    return (
      second(date) < date
        ? formatMillisecond
        : minute(date) < date
        ? formatSecond
        : hour(date) < date
        ? formatMinute
        : day(date) < date
        ? formatHour
        : month(date) < date
        ? week(date) < date
          ? formatDay
          : formatWeek
        : year(date) < date
        ? formatMonth
        : formatYear
    )(date)
  }
  scale.invert = function (y) {
    return new Date(invert(y))
  }
  scale.domain = function (_) {
    return arguments.length ? domain(Array.from(_, number)) : domain().map(date)
  }
  scale.ticks = function (interval) {
    const d = domain()
    return ticks(d[0], d[d.length - 1], interval == null ? 10 : interval)
  }
  scale.tickFormat = function (count, specifier) {
    return specifier == null ? tickFormat : format(specifier)
  }
  scale.nice = function (interval) {
    const d = domain()
    if (!interval || typeof interval.range !== "function")
      interval = tickInterval(d[0], d[d.length - 1], interval == null ? 10 : interval)
    return interval ? domain(nice(d, interval)) : scale
  }
  scale.copy = function () {
    return copy(scale, calendar(ticks, tickInterval, year, month, week, day, hour, minute, second, format))
  }
  return scale
}
export function time() {
  return initRange.apply(
    calendar(
      timeTicks,
      timeTickInterval,
      timeYear,
      timeMonth,
      timeWeek,
      timeDay,
      timeHour,
      timeMinute,
      timeSecond,
      timeFormat
    ).domain([new Date(2000, 0, 1), new Date(2000, 0, 2)]),
    arguments
  )
}
export function utcTime() {
  return initRange.apply(
    calendar(
      utcTicks,
      utcTickInterval,
      utcYear,
      utcMonth,
      utcWeek,
      utcDay,
      utcHour,
      utcMinute,
      utcSecond,
      utcFormat
    ).domain([Date.UTC(2000, 0, 1), Date.UTC(2000, 0, 2)]),
    arguments
  )
}
