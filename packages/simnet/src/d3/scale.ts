import { range, ticks, tickIncrement, tickStep, bisect, quantile, quantileSorted as threshold } from "./utils_seq.js"
import { format, formatPrefix, formatSpecifier, precisionFixed, precisionPrefix, precisionRound } from "./format.js"
import { interpolate as interpolateValue, interpolateNumber, interpolateRound } from "./interpolate.js"
import { interpolate, piecewise } from "./interpolate.js"
import { timeFormat, utcFormat } from "./time.js"
import { utcYear, utcMonth, utcWeek, utcDay, utcHour, utcMinute, utcSecond, utcTicks, utcTickInterval } from "./time.js"
import { year, month, week, day, hour, minute, second, timeTicks, timeTickInterval } from "./time.js"
import type * as qt from "./types.js"
import * as qu from "./utils.js"

function tickFormat(start: number, stop: number, n: number, x?: string): (x: qt.NumVal) => string {
  const step = tickStep(start, stop, n)
  let precision
  const spec = formatSpecifier(x === undefined ? ",f" : x)
  switch (spec.type) {
    case "s": {
      const v = Math.max(Math.abs(start), Math.abs(stop))
      if (spec.precision == null && !isNaN((precision = precisionPrefix(step, v)))) spec.precision = precision
      return formatPrefix(x!, v)
    }
    case "":
    case "e":
    case "g":
    case "p":
    case "r": {
      if (
        spec.precision == null &&
        !isNaN((precision = precisionRound(step, Math.max(Math.abs(start), Math.abs(stop)))))
      )
        spec.precision = precision - (spec.type === "e" ? 1 : 0)
      break
    }
    case "f":
    case "%": {
      if (spec.precision == null && !isNaN((precision = precisionFixed(step))))
        spec.precision = precision - (spec.type === "%" ? 1 : 0) * 2
      break
    }
  }
  return format(x!)
}

export function linearish(f: any) {
  const domain = f.domain
  f.tickFormat = (n?: number, spec?: string) => {
    const d = domain()
    return tickFormat(d[0], d[d.length - 1], n == undefined ? 10 : n, spec)
  }
  f.ticks = (n?: number) => {
    const d = domain()
    return ticks(d[0], d[d.length - 1], n == undefined ? 10 : n)
  }
  f.nice = (n?: number) => {
    if (n == undefined) n = 10
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
      step = tickIncrement(start, stop, n)
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
      } else break
      prestep = step
    }
    return f
  }
  return f
}

export function identity<U = never>(x?: Iterable<qt.NumVal>): qt.Scale.Identity<U> {
  let _dom = x === undefined ? [0, 1] : Array.from(x, number)
  let _unk: any = undefined
  function f(x?: qt.NumVal) {
    return x === undefined || isNaN((x = +x)) ? _unk : x
  }
  f.copy = () => qu.identity(_dom).unknown(_unk)
  f.domain = (x?: any) => (x === undefined ? ((_dom = Array.from(x, number)), f) : _dom.slice())
  f.invert = f
  f.range = f.domain
  f.unknown = (x?: any) => (x === undefined ? _unk : ((_unk = x), f))
  return linearish(f)
}

function initRange(this: any, ...xs: any[]) {
  switch (xs.length) {
    case 0:
      break
    case 1:
      this.range(xs[0])
      break
    default:
      this.range(xs[1]).domain(xs[0])
      break
  }
  return this
}

export function time<Range = number, Out = Range, U = never>(r?: Iterable<Range>): qt.Scale.Time<Range, Out, U>
export function time<Range, Out = Range, U = never>(
  dom: Iterable<Date | qt.NumVal>,
  r: Iterable<Range>
): qt.Scale.Time<Range, Out, U>
export function time(...xs: any[]) {
  return initRange.apply(
    calendar(timeTicks, timeTickInterval, year, month, week, day, hour, minute, second, timeFormat).domain([
      new Date(2000, 0, 1),
      new Date(2000, 0, 2),
    ]),
    xs
  )
}

function initInterpolator(this: any, ...xs: any[]) {
  switch (xs.length) {
    case 0:
      break
    case 1: {
      if (typeof xs[0] === "function") this.interpolator(xs[0])
      else this.range(xs[0])
      break
    }
    default: {
      this.domain(xs[0])
      if (typeof xs[1] === "function") this.interpolator(xs[1])
      else this.range(xs[1])
      break
    }
  }
  return this
}

export function diverging<Out = number, U = never>(f?: ((x: number) => Out) | Iterable<Out>): qt.Scale.Diverging<Out, U>
export function diverging<Out, U = never>(
  dom: Iterable<qt.NumVal>,
  f: ((x: number) => Out) | Iterable<Out>
): qt.Scale.Diverging<Out, U>
export function diverging(...xs: any[]) {
  const f = linearish(transformer()(identity))
  f.copy = () => copy(f, diverging())
  return initInterpolator.apply(f, xs)
}

export function quantize<Range = number, U = never>(r?: Iterable<Range>): qt.Scale.Quantize<Range, U>
export function quantize<Range, U = never>(dom: Iterable<qt.NumVal>, r: Iterable<Range>): qt.Scale.Quantize<Range, U>
export function quantize(...xs: any[]) {
  let x0 = 0,
    x1 = 1,
    n = 1,
    _dom = [0.5],
    _range = [0, 1]
  let _unk: any = undefined
  function f(x?: qt.NumVal) {
    return x !== undefined && x <= x ? _range[bisect(_dom, x, 0, n)] : _unk
  }
  function rescale() {
    let i = -1
    _dom = new Array(n)
    while (++i < n) _dom[i] = ((i + 1) * x1 - (i - n) * x0) / (n + 1)
    return f
  }
  f.copy = () => quantize().domain([x0, x1]).range(_range).unknown(_unk)
  f.domain = (x?: any) => (x === undefined ? [x0, x1] : (([x0, x1] = x), (x0 = +x0), (x1 = +x1), rescale()))
  f.invertExtent = (x: any) => {
    const i = _range.indexOf(x)
    return i < 0 ? [NaN, NaN] : i < 1 ? [x0, _dom[0]] : i >= n ? [_dom[n - 1], x1] : [_dom[i - 1], _dom[i]]
  }
  f.range = (x?: any) => (x === undefined ? _range.slice() : ((n = (_range = Array.from(x)).length - 1), rescale()))
  f.thresholds = () => _dom.slice()
  f.unknown = (x?: any) => (x === undefined ? f : ((_unk = x), f))
  return initRange.apply(linearish(f), xs)
}

export function quantile<Range = number, U = never>(r?: Iterable<Range>): qt.Scale.Quantile<Range, U>
export function quantile<Range, U = never>(
  dom: Iterable<qt.NumVal | null | undefined>,
  r: Iterable<Range>
): qt.Scale.Quantile<Range, U>
export function quantile(...xs: any[]) {
  let _dom: number[] = [],
    _range: number[] = [],
    _thresholds: any[] = [],
    _unk: any
  function f(x?: qt.NumVal) {
    return x === undefined || isNaN((x = +x)) ? _unk : _range[bisect(_thresholds, x)]
  }
  function rescale() {
    const n = Math.max(1, _range.length)
    let i = 0
    _thresholds = new Array(n - 1)
    while (++i < n) _thresholds[i - 1] = threshold(_dom, i / n)
    return f
  }
  f.copy = () => quantile().domain(_dom).range(_range).unknown(_unk)
  f.domain = (x?: any) => {
    if (x === undefined) return _dom.slice()
    _dom = []
    for (let d of x) if (d != null && !isNaN((d = +d))) _dom.push(d)
    _dom.sort(qu.ascending)
    return rescale()
  }
  f.invertExtent = (x: any) => {
    const i = _range.indexOf(x)
    return i < 0
      ? [NaN, NaN]
      : [i > 0 ? _thresholds[i - 1] : _dom[0], i < _thresholds.length ? _thresholds[i] : _dom[_dom.length - 1]]
  }
  f.quantiles = () => _thresholds.slice()
  f.range = (x?: any) => (x === undefined ? _range.slice() : ((_range = Array.from(x)), rescale()))
  f.unknown = (x?: any) => (x === undefined ? _unk : ((_unk = x), f))
  return initRange.apply(f, xs)
}

export function ordinal<Range>(r?: Iterable<Range>): qt.Scale.Ordinal<string, Range>
export function ordinal<T extends { toString(): string }, Range, U = never>(
  r?: Iterable<Range>
): qt.Scale.Ordinal<T, Range, U>
export function ordinal<T extends { toString(): string }, Range, U = never>(
  dom: Iterable<T>,
  r: Iterable<Range>
): qt.Scale.Ordinal<T, Range, U>
export function ordinal(...xs: any[]) {
  const implicit: { name: "implicit" } = Symbol("implicit")
  let _dom: number[] = [],
    _range: number[] = [],
    _idx = new Map(),
    _unk = implicit
  function f(d: any) {
    let i = _idx.get(d)
    if (i === undefined) {
      if (_unk !== implicit) return _unk
      _idx.set(d, (i = _dom.push(d) - 1))
    }
    return _range[i % _range.length]
  }
  f.copy = () => ordinal(_dom, _range).unknown(_unk)
  f.domain = (x?: any) => {
    if (x === undefined) return _dom.slice()
    ;(_dom = []), (_idx = new Map())
    for (const d of x) {
      if (_idx.has(d)) continue
      _idx.set(d, _dom.push(d) - 1)
    }
    return f
  }
  f.range = (x?: any) => (x === undefined ? _range.slice() : ((_range = Array.from(x)), f))
  f.unknown = (x?: any) => (x === undefined ? _unk : ((_unk = x), f))
  initRange(f, xs)
  return f
}

export function band<T extends { toString(): string } = string>(r?: Iterable<qt.NumVal>): qt.Scale.Band<T>
export function band<T extends { toString(): string }>(dom: Iterable<T>, r: Iterable<qt.NumVal>): qt.Scale.Band<T>
export function band(...xs: any[]) {
  let r0 = 0,
    r1 = 1,
    _step: number,
    _bandwidth: number,
    _round = false,
    _padInner = 0,
    _padOuter = 0,
    _align = 0.5
  const f: any = ordinal().unknown(undefined)
  const domain = f.domain
  const ordinalRange = f.range
  function rescale() {
    const n = domain().length,
      reverse = r1 < r0,
      stop = reverse ? r0 : r1
    let start = reverse ? r1 : r0,
      step = (stop - start) / Math.max(1, n - _padInner + _padOuter * 2)
    if (_round) step = Math.floor(step)
    start += (stop - start - step * (n - _padInner)) * _align
    _bandwidth = step * (1 - _padInner)
    if (_round) (start = Math.round(start)), (_bandwidth = Math.round(_bandwidth))
    const vs = range(n).map(i => start + step * i)
    return ordinalRange(reverse ? vs.reverse() : vs)
  }
  f.align = (x?: any) => (x === undefined ? _align : ((_align = Math.max(0, Math.min(1, x))), rescale()))
  f.bandwidth = () => _bandwidth
  f.copy = () => band(domain(), [r0, r1]).round(_round).paddingInner(_padInner).paddingOuter(_padOuter).align(_align)
  f.domain = (x?: any) => (x === undefined ? domain() : (domain(x), rescale()))
  f.padding = (x?: any) => (x === undefined ? _padInner : ((_padInner = Math.min(1, (_padOuter = +x))), rescale()))
  f.paddingInner = (x?: any) => (x === undefined ? _padInner : ((_padInner = Math.min(1, x)), rescale()))
  f.paddingOuter = (x?: any) => (x === undefined ? _padOuter : ((_padOuter = +x), rescale()))
  f.range = (x?: any) => (x === undefined ? [r0, r1] : (([r0, r1] = x), (r0 = +r0), (r1 = +r1), rescale()))
  ;(f.rangeRound = (x: any) => ([r0, r1] = x)), (r0 = +r0), (r1 = +r1), (_round = true), rescale()
  f.step = () => _step
  f.round = (x?: any) => (x === undefined ? _round : ((_round = !!x), rescale()))
  delete f.unknown
  return initRange.apply(rescale(), xs)
}

function pointish(f: any) {
  const copy = f.copy
  f.padding = f.paddingOuter
  delete f.paddingInner
  delete f.paddingOuter
  f.copy = () => pointish(copy())
  return f
}

export function point<T extends { toString(): string } = string>(r?: Iterable<qt.NumVal>): qt.Scale.Point<T>
export function point<T extends { toString(): string }>(dom: Iterable<T>, r: Iterable<qt.NumVal>): qt.Scale.Point<T>
export function point(...xs: any[]) {
  return pointish(band(...xs).paddingInner(1))
}

export function threshold<T extends number | string | Date = number, Range = number, U = never>(
  r?: Iterable<Range>
): qt.Scale.Threshold<T, Range, U>
export function threshold<T extends number | string | Date, Range, U = never>(
  dom: Iterable<T>,
  r: Iterable<Range>
): qt.Scale.Threshold<T, Range, U>
export function threshold(...xs: any[]) {
  let _dom = [0.5],
    _range = [0, 1],
    _unk: any,
    _n = 1
  function f(x?: any) {
    return x !== undefined && x <= x ? _range[bisect(_dom, x, 0, _n)] : _unk
  }
  f.copy = () => threshold().domain(_dom).range(_range).unknown(_unk)
  f.domain = (x?: any) =>
    x === undefined ? _dom.slice() : ((_dom = Array.from(x)), (_n = Math.min(_dom.length, _range.length - 1)), f)
  f.invertExtent = (x: any) => {
    const i = _range.indexOf(x)
    return [_dom[i - 1], _dom[i]]
  }
  f.range = (x?: any) =>
    x === undefined ? _range.slice() : ((_range = Array.from(x)), (_n = Math.min(_dom.length, _range.length - 1)), f)
  f.unknown = (x?: any) => (x === undefined ? _unk : ((_unk = x), f))
  return initRange.apply(f, xs)
}

export function colors(s) {
  return s.match(/.{6}/g).map(function (x) {
    return "#" + x
  })
}
const unit = [0, 1]
function normalize(a, b) {
  return (b -= a = +a)
    ? function (x) {
        return (x - a) / b
      }
    : qu.constant(isNaN(b) ? NaN : 0.5)
}
function clamper(a, b) {
  let t
  if (a > b) (t = a), (a = b), (b = t)
  return function (x) {
    return Math.max(a, Math.min(b, x))
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
    clamp = qu.identity,
    piecewise,
    output,
    input
  function rescale() {
    const n = Math.min(domain.length, range.length)
    if (clamp !== qu.identity) clamp = clamper(domain[0], domain[n - 1])
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
    return arguments.length ? ((clamp = _ ? true : qu.identity), rescale()) : clamp !== qu.identity
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
export function smooth(): qt.Scale.Smooth {
  return transformer()(identity, qu.identity)
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
    interpolator = qu.identity,
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
export function divergingLog<Output = number, U = never>(f?: (x: number) => Output): qt.Scale.Diverging<Output, U>
export function divergingLog<Output, U = never>(
  domain: Iterable<qt.NumVal>,
  f: (x: number) => Output
): qt.Scale.Diverging<Output, U>
export function divergingLog(...xs: any[]) {
  const f = loggish(transformer()).domain([0.1, 1, 10])
  f.copy = function () {
    return copy(f, divergingLog()).base(f.base())
  }
  return initInterpolator.apply(f, ...xs)
}
export function divergingSymlog<Output = number, U = never>(f?: (x: number) => Output): qt.Scale.Diverging<Output, U>
export function divergingSymlog<Output, U = never>(
  domain: Iterable<qt.NumVal>,
  f: (x: number) => Output
): qt.Scale.Diverging<Output, U>
export function divergingSymlog(...xs: any[]) {
  const f = symlogish(transformer())
  f.copy = function () {
    return copy(f, divergingSymlog()).constant(f.constant())
  }
  return initInterpolator.apply(f, ...xs)
}
export function divergingPow<Output = number, U = never>(f?: (x: number) => Output): qt.Scale.Diverging<Output, U>
export function divergingPow<Output, U = never>(
  domain: Iterable<qt.NumVal>,
  f: (x: number) => Output
): qt.Scale.Diverging<Output, U>
export function divergingPow(...xs: any[]) {
  const f = powish(transformer())
  f.copy = function () {
    return copy(f, divergingPow()).exponent(f.exponent())
  }
  return initInterpolator.apply(f, ...xs)
}
export function divergingSqrt<Output = number, U = never>(f?: (t: number) => Output): qt.Scale.Diverging<Output, U>
export function divergingSqrt<Output, U = never>(
  domain: Iterable<qt.NumVal>,
  f: (x: number) => Output
): qt.Scale.Diverging<Output, U>
export function divergingSqrt(...xs: any[]) {
  return divergingPow.apply(null, ...xs).exponent(0.5)
}
export function linear<Range = number, Out = Range, U = never>(range?: Iterable<Range>): qt.Scale.Linear<Range, Out, U>
export function linear<Range, Out = Range, U = never>(
  domain: Iterable<qt.NumVal>,
  range: Iterable<Range>
): qt.Scale.Linear<Range, Out, U>
export function linear(...xs: any[]) {
  const f = smooth()
  f.copy = function () {
    return copy(f, linear())
  }
  initRange.apply(f, ...xs)
  return linearish(f)
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
export function log<Range = number, Output = Range, U = never>(
  range?: Iterable<Range>
): qt.ScaleLogarithmic<Range, Output, U>
export function log<Range, Output = Range, U = never>(
  domain: Iterable<qt.NumVal>,
  range: Iterable<Range>
): qt.ScaleLogarithmic<Range, Output, U>
export function log(...xs: any[]) {
  const f = loggish(transformer()).domain([1, 10])
  f.copy = () => copy(f, log()).base(f.base())
  initRange.apply(f, ...xs)
  return f
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
  let scale = transform(identity, qu.identity),
    exponent = 1
  function rescale() {
    return exponent === 1
      ? transform(identity, qu.identity)
      : exponent === 0.5
      ? transform(transformSqrt, transformSquare)
      : transform(transformPow(exponent), transformPow(1 / exponent))
  }
  scale.exponent = function (_) {
    return arguments.length ? ((exponent = +_), rescale()) : exponent
  }
  return linearish(scale)
}
export function pow<Range = number, Output = Range, U = never>(range?: Iterable<Range>): qt.ScalePower<Range, Output, U>
export function pow<Range, Output = Range, U = never>(
  domain: Iterable<qt.NumVal>,
  range: Iterable<Range>
): qt.ScalePower<Range, Output, U>
export function pow(...xs: any[]) {
  const f = powish(transformer())
  f.copy = function () {
    return copy(f, pow()).exponent(f.exponent())
  }
  initRange.apply(f, ...xs)
  return f
}
export function sqrt<Range = number, Output = Range, U = never>(
  range?: Iterable<Range>
): qt.ScalePower<Range, Output, U>
export function sqrt<Range, Output = Range, U = never>(
  domain: Iterable<qt.NumVal>,
  range: Iterable<Range>
): qt.ScalePower<Range, Output, U>
export function sqrt(...xs: any[]) {
  return pow.apply(null, ...xs).exponent(0.5)
}
function square(x) {
  return Math.sign(x) * x * x
}
function unsquare(x) {
  return Math.sign(x) * Math.sqrt(Math.abs(x))
}
export function radial<Range = number, U = never>(range?: Iterable<Range>): qt.ScaleRadial<Range, Range, U>
export function radial<Range, U = never>(
  domain: Iterable<qt.NumVal>,
  range: Iterable<Range>
): qt.ScaleRadial<Range, Range, U>
export function radial(...xs: any[]) {
  let squared = smooth(),
    range = [0, 1],
    round = false,
    unknown
  function f(x) {
    const y = unsquare(squared(x))
    return isNaN(y) ? unknown : round ? Math.round(y) : y
  }
  f.invert = function (y) {
    return squared.invert(square(y))
  }
  f.domain = function (_) {
    return arguments.length ? (squared.domain(_), f) : squared.domain()
  }
  f.range = function (_) {
    return arguments.length ? (squared.range((range = Array.from(_, number)).map(square)), f) : range.slice()
  }
  f.rangeRound = function (_) {
    return f.range(_).round(true)
  }
  f.round = function (_) {
    return arguments.length ? ((round = !!_), f) : round
  }
  f.clamp = function (_) {
    return arguments.length ? (squared.clamp(_), f) : squared.clamp()
  }
  f.unknown = function (_) {
    return arguments.length ? ((unknown = _), f) : unknown
  }
  f.copy = function () {
    return radial(squared.domain(), range).round(round).clamp(squared.clamp()).unknown(unknown)
  }
  initRange.apply(f, ...xs)
  return linearish(f)
}
function transformer() {
  let x0 = 0,
    x1 = 1,
    t0,
    t1,
    k10,
    transform,
    interpolator = qu.identity,
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
export function sequential<Output = number, U = never>(
  f?: ((x: number) => Output) | Iterable<Output>
): qt.ScaleSequential<Output, U>
export function sequential<Output, U = never>(
  domain: Iterable<qt.NumVal>,
  f: ((x: number) => Output) | Iterable<Output>
): qt.ScaleSequential<Output, U>
export function sequential(...xs: any[]) {
  const f = linearish(transformer()(identity))
  f.copy = function () {
    return copy(f, sequential())
  }
  return initInterpolator.apply(f, ...xs)
}
export function sequentialLog<Output = number, U = never>(f?: (x: number) => Output): qt.ScaleSequential<Output, U>
export function sequentialLog<Output, U = never>(
  domain: Iterable<qt.NumVal>,
  f: (x: number) => Output
): qt.ScaleSequential<Output, U>
export function sequentialLog(...xs: any[]) {
  const f = loggish(transformer()).domain([1, 10])
  f.copy = function () {
    return copy(f, sequentialLog()).base(f.base())
  }
  return initInterpolator.apply(f, ...xs)
}
export function sequentialSymlog<Output = number, U = never>(f?: (x: number) => Output): qt.ScaleSequential<Output, U>
export function sequentialSymlog<Output, U = never>(
  domain: Iterable<qt.NumVal>,
  f: (x: number) => Output
): qt.ScaleSequential<Output, U>
export function sequentialSymlog(...xs: any[]) {
  const f = symlogish(transformer())
  f.copy = function () {
    return copy(f, sequentialSymlog()).constant(f.constant())
  }
  return initInterpolator.apply(f, ...xs)
}
export function sequentialPow<Output = number, U = never>(f?: (x: number) => Output): qt.ScaleSequential<Output, U>
export function sequentialPow<Output, U = never>(
  domain: Iterable<qt.NumVal>,
  f: (x: number) => Output
): qt.ScaleSequential<Output, U>
export function sequentialPow(...xs: any[]) {
  const f = powish(transformer())
  f.copy = function () {
    return copy(f, sequentialPow()).exponent(f.exponent())
  }
  return initInterpolator.apply(f, ...xs)
}
export function sequentialSqrt<Output = number, U = never>(f?: (x: number) => Output): qt.ScaleSequential<Output, U>
export function sequentialSqrt<Output, U = never>(
  domain: Iterable<qt.NumVal>,
  f: (x: number) => Output
): qt.ScaleSequential<Output, U>
export function sequentialSqrt(...xs: any[]) {
  return sequentialPow.apply(null, ...xs).exponent(0.5)
}
export function sequentialQuantile<Output = number, U = never>(
  f?: (x: number) => Output
): qt.ScaleSequentialQuantile<Output, U>
export function sequentialQuantile<Output, U = never>(
  domain: Iterable<qt.NumVal>,
  f: (x: number) => Output
): qt.ScaleSequentialQuantile<Output, U>
export function sequentialQuantile(...xs: any[]) {
  let domain = [],
    interpolator = qu.identity
  function f(x) {
    if (x != null && !isNaN((x = +x))) return interpolator((bisect(domain, x, 1) - 1) / (domain.length - 1))
  }
  f.domain = function (_) {
    if (!arguments.length) return domain.slice()
    domain = []
    for (let d of _) if (d != null && !isNaN((d = +d))) domain.push(d)
    domain.sort(qu.ascending)
    return f
  }
  f.interpolator = function (_) {
    return arguments.length ? ((interpolator = _), f) : interpolator
  }
  f.range = function () {
    return domain.map((d, i) => interpolator(i / (domain.length - 1)))
  }
  f.quantiles = function (n) {
    return Array.from({ length: n + 1 }, (_, i) => quantile(domain, i / n))
  }
  f.copy = function () {
    return sequentialQuantile(interpolator).domain(domain)
  }
  return initInterpolator.apply(f, ...xs)
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
export function symlog<Range = number, Output = Range, U = never>(
  range?: Iterable<Range>
): qt.ScaleSymLog<Range, Output, U>
export function symlog<Range, Output = Range, U = never>(
  domain: Iterable<qt.NumVal>,
  range: Iterable<Range>
): qt.ScaleSymLog<Range, Output, U>
export function symlog(...xs: any[]) {
  const f = symlogish(transformer())
  f.copy = function () {
    return copy(f, symlog()).constant(f.constant())
  }
  return initRange.apply(f, ...xs)
}

function date(t) {
  return new Date(t)
}
function number(t) {
  return t instanceof Date ? +t : +new Date(+t)
}

export function calendar(ticks, tickInterval, year, month, week, day, hour, minute, second, format) {
  const f = smooth(),
    invert = f.invert,
    domain = f.domain
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
  f.invert = function (y) {
    return new Date(invert(y))
  }
  f.domain = function (_) {
    return arguments.length ? domain(Array.from(_, number)) : domain().map(date)
  }
  f.ticks = function (interval) {
    const d = domain()
    return ticks(d[0], d[d.length - 1], interval == null ? 10 : interval)
  }
  f.tickFormat = function (count, specifier) {
    return specifier == null ? tickFormat : format(specifier)
  }
  f.nice = function (interval) {
    const d = domain()
    if (!interval || typeof interval.range !== "function")
      interval = tickInterval(d[0], d[d.length - 1], interval == null ? 10 : interval)
    return interval ? domain(nice(d, interval)) : f
  }
  f.copy = function () {
    return copy(f, calendar(ticks, tickInterval, year, month, week, day, hour, minute, second, format))
  }
  return f
}

export function utcTime<Range = number, Output = Range, U = never>(
  range?: Iterable<Range>
): qt.ScaleTime<Range, Output, U>
export function utcTime<Range, Output = Range, U = never>(
  domain: Iterable<qt.NumVal>,
  range: Iterable<Range>
): qt.ScaleTime<Range, Output, U>
export function utcTime(...xs: any[]) {
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
    ...xs
  )
}
