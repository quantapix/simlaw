/* eslint-disable no-inner-declarations */
import { format, formatPrefix, formatSpecifier, precisionFixed, precisionPrefix, precisionRound } from "./format.js"
import { interpolate as qi } from "./utils.js"
import { range, ticks, tickIncrement, tickStep, bisect, quantile, quantileSorted as threshold } from "./sequence.js"
import { timeFormat, utcFormat } from "./time.js"
import { utcYear, utcMonth, utcWeek, utcDay, utcHour, utcMinute, utcSecond, utcTicks, utcTickInterval } from "./time.js"
import { year, month, week, day, hour, minute, second, ticks, tickInterval } from "./time.js"
import * as qu from "./utils.js"
import type * as qt from "./types.js"

function tickFormat(start: number, stop: number, n: number, x?: string): (x: qt.NumVal) => string {
  const step = tickStep(start, stop, n)
  let precision
  const spec = formatSpecifier(x === undefined ? ",f" : x)
  switch (spec.type) {
    case "s": {
      const v = Math.max(Math.abs(start), Math.abs(stop))
      if (spec.precision === null && !isNaN((precision = precisionPrefix(step, v)))) spec.precision = precision
      return formatPrefix(x!, v)
    }
    case "":
    case "e":
    case "g":
    case "p":
    case "r": {
      if (
        spec.precision === null &&
        !isNaN((precision = precisionRound(step, Math.max(Math.abs(start), Math.abs(stop)))))
      )
        spec.precision = precision - (spec.type === "e" ? 1 : 0)
      break
    }
    case "f":
    case "%": {
      if (spec.precision === null && !isNaN((precision = precisionFixed(step))))
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
    return tickFormat(d[0], d[d.length - 1], n === undefined ? 10 : n, spec)
  }
  f.ticks = (n?: number) => {
    const d = domain()
    return ticks(d[0], d[d.length - 1], n === undefined ? 10 : n)
  }
  f.nice = (n?: number) => {
    if (n === undefined) n = 10
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

function nice(dom: any[], interval) {
  dom = dom.slice()
  let i0 = 0,
    i1 = dom.length - 1,
    x0 = dom[i0],
    x1 = dom[i1],
    t
  if (x1 < x0) {
    ;(t = i0), (i0 = i1), (i1 = t)
    ;(t = x0), (x0 = x1), (x1 = t)
  }
  dom[i0] = interval.floor(x0)
  dom[i1] = interval.ceil(x1)
  return dom
}

function calendar(ticks, tickInterval, year, month, week, day, hour, minute, second, format) {
  const date = (x: any) => new Date(x)
  const number = (x: any) => (x instanceof Date ? +x : +new Date(+x))
  const f = smooth(),
    invert = f.invert,
    domain = f.domain
  const _milli = format(".%L"),
    _second = format(":%S"),
    _minute = format("%I:%M"),
    _hour = format("%I %p"),
    _day = format("%a %d"),
    _week = format("%b %d"),
    _month = format("%B"),
    _year = format("%Y")
  function tickFormat(x: number) {
    return (
      second(x) < x
        ? _milli
        : minute(x) < x
        ? _second
        : hour(x) < x
        ? _minute
        : day(x) < x
        ? _hour
        : month(x) < x
        ? week(x) < x
          ? _day
          : _week
        : year(x) < x
        ? _month
        : _year
    )(x)
  }
  f.domain = (x?: any) => (x === undefined ? domain().map(date) : domain(Array.from(x, number)))
  f.invert = x => new Date(invert(x))
  f.ticks = function (x?: number) {
    const d = domain()
    return ticks(d[0], d[d.length - 1], x === undefined ? 10 : x)
  }
  f.tickFormat = (n: number, spec?: string) => (spec === undefined ? tickFormat : format(spec))
  f.nice = function (x?: any) {
    const d = domain()
    if (!x || typeof x.range !== "function") x = tickInterval(d[0], d[d.length - 1], x === undefined ? 10 : x)
    return x ? domain(nice(d, x)) : f
  }
  f.copy = () => copy(f, calendar(ticks, tickInterval, year, month, week, day, hour, minute, second, format))
  return f
}

export function time<Range = number, Out = Range, U = never>(r?: Iterable<Range>): qt.Scale.Time<Range, Out, U>
export function time<Range, Out = Range, U = never>(
  dom: Iterable<Date | qt.NumVal>,
  r: Iterable<Range>
): qt.Scale.Time<Range, Out, U>
export function time(...xs: any[]) {
  return initRange.apply(
    calendar(ticks, tickInterval, year, month, week, day, hour, minute, second, timeFormat).domain([
      new Date(2000, 0, 1),
      new Date(2000, 0, 2),
    ]),
    xs
  )
}

export function utcTime<Range = number, Out = Range, U = never>(r?: Iterable<Range>): qt.Scale.Time<Range, Out, U>
export function utcTime<Range, Out = Range, U = never>(
  dom: Iterable<qt.NumVal>,
  r: Iterable<Range>
): qt.Scale.Time<Range, Out, U>
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
export function copy(source, target) {
  return target
    .domain(source.domain())
    .range(source.range())
    .interpolate(source.interpolate())
    .clamp(source.clamp())
    .unknown(source.unknown())
}

export function transformer() {
  let _dom = unit,
    _range = unit,
    interpolate = qi.value,
    transform,
    untransform,
    _unk: any = undefined,
    _clamp = qu.identity,
    piecewise,
    output,
    input
  function f(x?: qt.NumVal) {
    return x === undefined || isNaN((x = +x))
      ? _unk
      : (output || (output = piecewise(_dom.map(transform), _range, interpolate)))(transform(_clamp(x)))
  }
  function rescale() {
    const n = Math.min(_dom.length, _range.length)
    function clamper(a, b) {
      let t
      if (a > b) (t = a), (a = b), (b = t)
      return function (x) {
        return Math.max(a, Math.min(b, x))
      }
    }
    if (_clamp !== qu.identity) _clamp = clamper(_dom[0], _dom[n - 1])
    function normalize(a, b) {
      return (b -= a = +a)
        ? function (x) {
            return (x - a) / b
          }
        : qu.constant(isNaN(b) ? NaN : 0.5)
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
    piecewise = n > 2 ? polymap : bimap
    output = input = null
    return f
  }
  f.clamp = (x?: any) => (x === undefined ? _clamp !== qu.identity : ((_clamp = x ? true : qu.identity), rescale()))
  f.domain = (x?: any) => (x === undefined ? _dom.slice() : ((_dom = Array.from(x, number)), rescale()))
  f.invert = (x: any) => _clamp(untransform((input || (input = piecewise(_range, _dom.map(transform), qi.number)))(x)))
  f.range = (x?: any) => (x === undefined ? _range.slice() : ((_range = Array.from(x)), rescale()))
  ;(f.rangeRound = (x: any) => (_range = Array.from(x))), (interpolate = qi.round), rescale()
  f.interpolate = (x?: any) => (x === undefined ? interpolate : ((interpolate = x), rescale()))
  f.unknown = (x?: any) => (x === undefined ? _unk : ((_unk = x), f))
  return (t, u) => {
    ;(transform = t), (untransform = u)
    return rescale()
  }
}
export function smooth<Range, Out, U = never>(): qt.Scale.Smooth<Range, Out, U> {
  return transformer()(identity, qu.identity)
}

export function linear<Range = number, Out = Range, U = never>(r?: Iterable<Range>): qt.Scale.Linear<Range, Out, U>
export function linear<Range, Out = Range, U = never>(
  dom: Iterable<qt.NumVal>,
  r: Iterable<Range>
): qt.Scale.Linear<Range, Out, U>
export function linear(...xs: any[]) {
  const f = smooth()
  f.copy = () => copy(f, linear())
  initRange.apply(f, xs)
  return linearish(f)
}

export function powish(xform: any) {
  const pow = (e: number) => (x: number) => x < 0 ? -Math.pow(-x, e) : Math.pow(x, e)
  const sqrt = (x: number) => (x < 0 ? -Math.sqrt(-x) : Math.sqrt(x))
  const square = (x: number) => (x < 0 ? -x * x : x * x)
  const f = xform(identity, qu.identity)
  let _e = 1
  function rescale() {
    return _e === 1 ? xform(identity, qu.identity) : _e === 0.5 ? xform(sqrt, square) : xform(pow(_e), pow(1 / _e))
  }
  f.exponent = (x?: any) => (x === undefined ? _e : ((_e = +x), rescale()))
  return linearish(f)
}

export function pow<Range = number, Out = Range, U = never>(r?: Iterable<Range>): qt.Scale.Pow<Range, Out, U>
export function pow<Range, Out = Range, U = never>(
  dom: Iterable<qt.NumVal>,
  r: Iterable<Range>
): qt.Scale.Pow<Range, Out, U>
export function pow(...xs: any[]) {
  const f = powish(transformer())
  f.copy = () => copy(f, pow()).exponent(f.exponent())
  initRange.apply(f, xs)
  return f
}

export function sqrt<Range = number, Out = Range, U = never>(r?: Iterable<Range>): qt.Scale.Pow<Range, Out, U>
export function sqrt<Range, Out = Range, U = never>(
  dom: Iterable<qt.NumVal>,
  r: Iterable<Range>
): qt.Scale.Pow<Range, Out, U>
export function sqrt(...xs: any[]) {
  return pow.apply(null, ...xs).exponent(0.5)
}

export function loggish(xform: Function) {
  let _base = 10
  let _logs: (x: number) => number
  let _pows: (x: number) => number
  const log = (x: number) => Math.log(x)
  const exp = (x: number) => Math.exp(x)
  const logn = (x: number) => -Math.log(-x)
  const expn = (x: number) => -Math.exp(-x)
  const pow10 = (x: number) => (isFinite(x) ? +("1e" + x) : x < 0 ? 0 : x)
  const powp = (x: number) => (x === 10 ? pow10 : x === Math.E ? Math.exp : (x: number) => Math.pow(x, x))
  const logp = (x: number) =>
    x === Math.E
      ? Math.log
      : (x === 10 && Math.log10) || (x === 2 && Math.log2) || ((x = Math.log(x)), x => Math.log(x) / x)
  const reflect = (f: Function) => (x: number, k?: any) => -f(-x, k)
  const f = xform(log, exp)
  const domain = f.domain
  function rescale() {
    ;(_logs = logp(_base)), (_pows = powp(_base))
    if (domain()[0] < 0) {
      ;(_logs = reflect(_logs)), (_pows = reflect(_pows))
      xform(logn, expn)
    } else xform(log, exp)
    return f
  }
  f.base = (x?: any) => (x === undefined ? _base : ((_base = +x), rescale()))
  f.domain = (x?: any) => (x === undefined ? domain() : (domain(x), rescale()))
  f.tickFormat = (n: number, spec?: string) => {
    if (n === undefined) n = 10
    if (spec === undefined) spec = _base === 10 ? "s" : ","
    if (typeof spec !== "function") {
      if (!(_base % 1) && (spec = formatSpecifier(spec)).precision === null) spec.trim = true
      spec = format(spec)
    }
    if (n === Infinity) return spec
    const k = Math.max(1, (_base * n) / f.ticks().length)
    return d => {
      let i = d / _pows(Math.round(_logs(d)))
      if (i * _base < _base - 0.5) i *= _base
      return i <= k ? spec(d) : ""
    }
  }
  f.ticks = (x?: number) => {
    const d = domain()
    let u = d[0]
    let v = d[d.length - 1]
    const r = v < u
    if (r) [u, v] = [v, u]
    let i = _logs(u)
    let j = _logs(v)
    let k
    let t
    const n = x === undefined ? 10 : +x
    let z = []
    if (!(_base % 1) && j - i < n) {
      ;(i = Math.floor(i)), (j = Math.ceil(j))
      if (u > 0)
        for (; i <= j; ++i) {
          for (k = 1; k < _base; ++k) {
            t = i < 0 ? k / _pows(-i) : k * _pows(i)
            if (t < u) continue
            if (t > v) break
            z.push(t)
          }
        }
      else
        for (; i <= j; ++i) {
          for (k = _base - 1; k >= 1; --k) {
            t = i > 0 ? k / _pows(-i) : k * _pows(i)
            if (t < u) continue
            if (t > v) break
            z.push(t)
          }
        }
      if (z.length * 2 < n) z = ticks(u, v, n)
    } else {
      z = ticks(i, j, Math.min(j - i, n)).map(_pows)
    }
    return r ? z.reverse() : z
  }
  f.nice = () => {
    return domain(
      nice(domain(), {
        floor: (x: number) => _pows(Math.floor(_logs(x))),
        ceil: (x: number) => _pows(Math.ceil(_logs(x))),
      })
    )
  }
  return f
}

export function log<Range = number, Out = Range, U = never>(r?: Iterable<Range>): qt.Scale.Log<Range, Out, U>
export function log<Range, Out = Range, U = never>(
  dom: Iterable<qt.NumVal>,
  r: Iterable<Range>
): qt.Scale.Log<Range, Out, U>
export function log(...xs: any[]) {
  const f = loggish(transformer()).domain([1, 10])
  f.copy = () => copy(f, log()).base(f.base())
  initRange.apply(f, xs)
  return f
}

export function symlogish(xform: Function) {
  const log = (c: number) => (x: number) => Math.sign(x) * Math.log1p(Math.abs(x / c))
  const exp = (c: number) => (x: number) => Math.sign(x) * Math.expm1(Math.abs(x)) * c
  let c = 1
  const f = xform(log(c), exp(c))
  f.constant = (x?: any) => (x === undefined ? c : xform(log((c = +x)), exp(c)))
  return linearish(f)
}

export function symlog<Range = number, Out = Range, U = never>(r?: Iterable<Range>): qt.Scale.SymLog<Range, Out, U>
export function symlog<Range, Out = Range, U = never>(
  dom: Iterable<qt.NumVal>,
  r: Iterable<Range>
): qt.Scale.SymLog<Range, Out, U>
export function symlog(...xs: any[]) {
  const f = symlogish(transformer())
  f.copy = () => copy(f, symlog()).constant(f.constant())
  return initRange.apply(f, xs)
}

export function radial<Range = number, U = never>(r?: Iterable<Range>): qt.Scale.Radial<Range, Range, U>
export function radial<Range, U = never>(dom: Iterable<qt.NumVal>, r: Iterable<Range>): qt.Scale.Radial<Range, Range, U>
export function radial(...xs: any[]) {
  const square = (x: number) => Math.sign(x) * x * x
  const unsquare = (x: number) => Math.sign(x) * Math.sqrt(Math.abs(x))
  const _squared = smooth()
  let _range = [0, 1],
    _round = false,
    _unk: any
  function f(x: number) {
    const y = unsquare(_squared(x))
    return isNaN(y) ? _unk : _round ? Math.round(y) : y
  }
  f.clamp = (x?: any) => (x === undefined ? _squared.clamp() : (_squared.clamp(x), f))
  f.copy = () => radial(_squared.domain(), _range).round(_round).clamp(_squared.clamp()).unknown(_unk)
  f.domain = (x?: any) => (x === undefined ? _squared.domain() : (_squared.domain(x), f))
  f.invert = function (y) {
    return _squared.invert(square(y))
  }
  f.range = (x?: any) =>
    x === undefined ? _range.slice() : (_squared.range((_range = Array.from(x, number)).map(square)), f)
  f.round = (x?: any) => (x === undefined ? _round : ((_round = !!x), f))
  f.rangeRound = (x?: any) => f.range(x).round(true)
  f.unknown = (x?: any) => (x === undefined ? _unk : ((_unk = x), f))
  initRange.apply(f, xs)
  return linearish(f)
}

export namespace diverging {
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
      _clamp = false,
      _unk: any = undefined
    function f(x) {
      return isNaN((x = +x))
        ? _unk
        : ((x = 0.5 + ((x = +transform(x)) - t1) * (s * x < s * t1 ? k10 : k21)),
          interpolator(_clamp ? Math.max(0, Math.min(1, x)) : x))
    }
    f.clamp = (x?: any) => (x === undefined ? _clamp : ((_clamp = !!x), f))
    f.domain = (x?: any) => {
      return x === undefined
        ? [x0, x1, x2]
        : (([x0, x1, x2] = x),
          (t0 = transform((x0 = +x0))),
          (t1 = transform((x1 = +x1))),
          (t2 = transform((x2 = +x2))),
          (k10 = t0 === t1 ? 0 : 0.5 / (t1 - t0)),
          (k21 = t1 === t2 ? 0 : 0.5 / (t2 - t1)),
          (s = t1 < t0 ? -1 : 1),
          f)
    }
    f.interpolator = (x?: any) => (x === undefined ? interpolator : ((interpolator = x), f))
    function range(x: any) {
      return (x2?: any) => {
        let r0, r1, r2
        return x2 === undefined
          ? [interpolator(0), interpolator(0.5), interpolator(1)]
          : (([r0, r1, r2] = x2), (interpolator = qi.piecewise(x, [r0, r1, r2])), f)
      }
    }
    f.range = range(interpolate)
    f.rangeRound = range(qi.round)
    f.unknown = (x?: any) => (x === undefined ? _unk : ((_unk = x), f))
    return x => {
      ;(transform = x),
        (t0 = x(x0)),
        (t1 = x(x1)),
        (t2 = x(x2)),
        (k10 = t0 === t1 ? 0 : 0.5 / (t1 - t0)),
        (k21 = t1 === t2 ? 0 : 0.5 / (t2 - t1)),
        (s = t1 < t0 ? -1 : 1)
      return f
    }
  }
  export function log<Out = number, U = never>(f?: (x: number) => Out): qt.Scale.Diverging<Out, U>
  export function log<Out, U = never>(dom: Iterable<qt.NumVal>, f: (x: number) => Out): qt.Scale.Diverging<Out, U>
  export function log(...xs: any[]) {
    const f = loggish(transformer()).domain([0.1, 1, 10])
    f.copy = () => copy(f, log()).base(f.base())
    return initInterpolator.apply(f, xs)
  }
  export function symlog<Out = number, U = never>(f?: (x: number) => Out): qt.Scale.Diverging<Out, U>
  export function symlog<Out, U = never>(dom: Iterable<qt.NumVal>, f: (x: number) => Out): qt.Scale.Diverging<Out, U>
  export function symlog(...xs: any[]) {
    const f = symlogish(transformer())
    f.copy = () => copy(f, symlog()).constant(f.constant())
    return initInterpolator.apply(f, xs)
  }
  export function pow<Out = number, U = never>(f?: (x: number) => Out): qt.Scale.Diverging<Out, U>
  export function pow<Out, U = never>(dom: Iterable<qt.NumVal>, f: (x: number) => Out): qt.Scale.Diverging<Out, U>
  export function pow(...xs: any[]) {
    const f = powish(transformer())
    f.copy = () => copy(f, pow()).exponent(f.exponent())
    return initInterpolator.apply(f, xs)
  }
  export function sqrt<Out = number, U = never>(f?: (t: number) => Out): qt.Scale.Diverging<Out, U>
  export function sqrt<Out, U = never>(dom: Iterable<qt.NumVal>, f: (x: number) => Out): qt.Scale.Diverging<Out, U>
  export function sqrt(...xs: any[]) {
    return pow.apply(null, ...xs).exponent(0.5)
  }
}

export function number(x) {
  return +x
}

function transformer3() {
  let x0 = 0,
    x1 = 1,
    t0,
    t1,
    k10,
    transform,
    interpolator = qu.identity,
    clamp = false,
    _unk
  function f(x) {
    return x === null || isNaN((x = +x))
      ? _unk
      : interpolator(k10 === 0 ? 0.5 : ((x = (transform(x) - t0) * k10), clamp ? Math.max(0, Math.min(1, x)) : x))
  }
  f.domain = (x: any) => {
    return x === undefined
      ? [x0, x1]
      : (([x0, x1] = x),
        (t0 = transform((x0 = +x0))),
        (t1 = transform((x1 = +x1))),
        (k10 = t0 === t1 ? 0 : 1 / (t1 - t0)),
        f)
  }
  f.clamp = (x: any) => (x === undefined ? clamp : ((clamp = !!x), f))
  f.interpolator = (x: any) => (x === undefined ? interpolator : ((interpolator = x), f))
  function range(interpolate) {
    return function (x: any) {
      let r0, r1
      return x === undefined
        ? [interpolator(0), interpolator(1)]
        : (([r0, r1] = x), (interpolator = interpolate(r0, r1)), f)
    }
  }
  f.range = range(interpolate)
  f.rangeRound = range(qi.round)
  f.unknown = (x: any) => (x === undefined ? _unk : ((_unk = x), f))
  return function (t) {
    ;(transform = t), (t0 = t(x0)), (t1 = t(x1)), (k10 = t0 === t1 ? 0 : 1 / (t1 - t0))
    return f
  }
}

function copy(source, target) {
  return target
    .domain(source.domain())
    .interpolator(source.interpolator())
    .clamp(source.clamp())
    .unknown(source.unknown())
}

export function sequential<Out = number, U = never>(
  f?: ((x: number) => Out) | Iterable<Out>
): qt.Scale.Sequential<Out, U>
export function sequential<Out, U = never>(
  dom: Iterable<qt.NumVal>,
  f: ((x: number) => Out) | Iterable<Out>
): qt.Scale.Sequential<Out, U>
export function sequential(...xs: any[]) {
  const f = linearish(transformer()(identity))
  f.copy = () => copy(f, sequential())
  return initInterpolator.apply(f, xs)
}

export namespace seq {
  export function log<Out = number, U = never>(f?: (x: number) => Out): qt.Scale.Sequential<Out, U>
  export function log<Out, U = never>(dom: Iterable<qt.NumVal>, f: (x: number) => Out): qt.Scale.Sequential<Out, U>
  export function log(...xs: any[]) {
    const f = loggish(transformer()).domain([1, 10])
    f.copy = () => copy(f, log()).base(f.base())
    return initInterpolator.apply(f, xs)
  }

  export function symlog<Out = number, U = never>(f?: (x: number) => Out): qt.Scale.Sequential<Out, U>
  export function symlog<Out, U = never>(dom: Iterable<qt.NumVal>, f: (x: number) => Out): qt.Scale.Sequential<Out, U>
  export function symlog(...xs: any[]) {
    const f = symlogish(transformer())
    f.copy = () => copy(f, symlog()).constant(f.constant())
    return initInterpolator.apply(f, xs)
  }
  export function pow<Out = number, U = never>(f?: (x: number) => Out): qt.Scale.Sequential<Out, U>
  export function pow<Out, U = never>(dom: Iterable<qt.NumVal>, f: (x: number) => Out): qt.Scale.Sequential<Out, U>
  export function pow(...xs: any[]) {
    const f = powish(transformer())
    f.copy = () => copy(f, pow()).exponent(f.exponent())
    return initInterpolator.apply(f, xs)
  }

  export function sqrt<Out = number, U = never>(f?: (x: number) => Out): qt.Scale.Sequential<Out, U>
  export function sqrt<Out, U = never>(dom: Iterable<qt.NumVal>, f: (x: number) => Out): qt.Scale.Sequential<Out, U>
  export function sqrt(...xs: any[]) {
    return pow.apply(null, ...xs).exponent(0.5)
  }

  export function quantile<Out = number, U = never>(f?: (x: number) => Out): qt.Scale.SeqQuantile<Out, U>
  export function quantile<Out, U = never>(
    dom: Iterable<qt.NumVal>,
    f: (x: number) => Out
  ): qt.Scale.SeqQuantile<Out, U>
  export function quantile(...xs: any[]) {
    let _dom: any[] = [],
      interpolator = qu.identity
    function f(x?: any) {
      if (x != undefined && !isNaN((x = +x))) return interpolator((bisect(_dom, x, 1) - 1) / (_dom.length - 1))
      return
    }
    f.copy = () => quantile(interpolator).domain(_dom)
    f.domain = function (x?: any) {
      if (x === undefined) return _dom.slice()
      _dom = []
      for (let d of x) if (d != undefined && !isNaN((d = +d))) _dom.push(d)
      _dom.sort(qu.ascending)
      return f
    }
    f.interpolator = (x?: any) => (x === undefined ? interpolator : ((interpolator = x), f))
    f.quantiles = (n: number) => Array.from({ length: n + 1 }, (_, i) => quantile(_dom, i / n))
    f.range = () => _dom.map((_, i) => interpolator(i / (_dom.length - 1)))
    return initInterpolator.apply(f, xs)
  }
}
