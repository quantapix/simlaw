/* eslint-disable no-inner-declarations */
/* eslint-disable @typescript-eslint/no-this-alias */
import type * as qt from "./types.js"

export const abs = Math.abs
export const atan = Math.atan
export const atan2 = Math.atan2
export const ceil = Math.ceil
export const cos = Math.cos
export const exp = Math.exp
export const floor = Math.floor
export const hypot = Math.hypot
export const log = Math.log
export const max = Math.max
export const min = Math.min
export const pow = Math.pow
export const round = Math.round
export const sin = Math.sin
export const sqrt = Math.sqrt
export const tan = Math.tan

export const PI = Math.PI
export const SQRT2 = Math.SQRT2

export const degrees = 180 / PI
export const epsilon = 1e-6
export const epsilon2 = 1e-12
export const halfPI = PI / 2
export const quarterPI = PI / 4
export const radians = PI / 180
export const tau = 2 * PI
export const tauEpsilon = tau - epsilon

export function noop(..._: any) {}
export const identity = <T>(x: T) => x
export const constant =
  <T>(x: T) =>
  (..._: any) =>
    x

export function asin(x: number) {
  return x >= 1 ? halfPI : x <= -1 ? -halfPI : Math.asin(x)
}
export function acos(x: number) {
  return x > 1 ? 0 : x < -1 ? PI : Math.acos(x)
}
export function sinh(x: number) {
  return ((x = exp(x)) - 1 / x) / 2
}
export function cosh(x: number) {
  return ((x = exp(x)) + 1 / x) / 2
}
export function tanh(x: number) {
  return ((x = exp(2 * x)) - 1) / (x + 1)
}
export function array(x?: any) {
  return x === undefined ? [] : Array.isArray(x) ? x : Array.from(x)
}
export function arraylike(x: any) {
  return typeof x === "object" && "length" in x ? x : Array.from(x)
}
export function shuffle(xs: any[], rnd: () => number) {
  let n = xs.length
  while (n) {
    const i = (rnd() * n--) | 0
    const x = xs[n]
    xs[n] = xs[i]
    xs[i] = x
  }
  return xs
}
export function discrete<T>(xs: T[]): (x: number) => T {
  const n = xs.length
  return x => xs[max(0, min(n - 1, floor(x * n)))]!
}
export function quantize<T>(f: (x: number) => T, n: number): T[] {
  const y = new Array(n)
  for (let i = 0; i < n; ++i) y[i] = f(i / (n - 1))
  return y
}
export function ascending(a?: qt.Primitive, b?: qt.Primitive) {
  return a === undefined || b === undefined ? NaN : a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN
}
export function descending(a?: qt.Primitive, b?: qt.Primitive) {
  return a === undefined || b === undefined ? NaN : b < a ? -1 : b > a ? 1 : b >= a ? 0 : NaN
}
export function angle(a: number, b: number) {
  return (b -= a) < 0 ? b + 360 : b
}
export function area(xs: Array<qt.Point>): number {
  const n = xs.length
  let r = 0,
    a,
    b = xs[n - 1]!,
    i = -1
  while (++i < n) {
    a = b
    b = xs[i]!
    r += a[1] * b[0] - a[0] * b[1]
  }
  return r / 2
}
export function centroid(xs: Array<qt.Point>): qt.Point {
  const n = xs.length
  let r = 0,
    a,
    b = xs[n - 1]!,
    c,
    x = 0,
    y = 0,
    i = -1
  while (++i < n) {
    a = b
    b = xs[i]!
    r += c = a[0] * b[1] - b[0] * a[1]
    x += (a[0] + b[0]) * c
    y += (a[1] + b[1]) * c
  }
  return (r *= 3), [x / r, y / r]
}
export function contains(xs: Array<qt.Point>, p0: qt.Point): boolean {
  const n = xs.length,
    [x0, y0] = p0
  let r = false,
    [x1, y1] = xs[n - 1]!
  for (let i = 0; i < n; ++i) {
    const [x2, y2] = xs[i]!
    if (y2 > y0 !== y1 > y0 && x0 < ((x1 - x2) * (y0 - y2)) / (y1 - y2) + x2) r = !r
    ;[x1, y1] = [x2, y2]
  }
  return r
}
export function hull(xs: Array<qt.Point>): Array<qt.Point> | undefined {
  const n = xs.length
  if (n < 3) return undefined
  const sorted = new Array(n)
  for (let i = 0; i < n; ++i) sorted[i] = [+xs[i]![0], +xs[i]![1], i]
  const lexOrder = (a: qt.Point, b: qt.Point) => a[0] - b[0] || a[1] - b[1]
  sorted.sort(lexOrder)
  const flipped = new Array(n)
  for (let i = 0; i < n; ++i) flipped[i] = [sorted[i][0], -sorted[i][1]]
  const uppers = (xs: Array<qt.Point>) => {
    const n = xs.length,
      r = [0, 1]
    let size = 2
    const cross = (a: qt.Point, b: qt.Point, c: qt.Point) =>
      (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])
    for (let i = 2; i < n; ++i) {
      while (size > 1 && cross(xs[r[size - 2]!]!, xs[r[size - 1]!]!, xs[i]!) <= 0) --size
      r[size++] = i
    }
    return r.slice(0, size)
  }
  const us = uppers(sorted)
  const ls = uppers(flipped)
  const r = [],
    skipLeft = ls[0] === us[0],
    skipRight = ls[ls.length - 1] === us[us.length - 1] ? 1 : 0
  for (let i = us.length - 1; i >= 0; --i) r.push(xs[sorted[us[i]!][2]]!)
  for (let i = +skipLeft; i < ls.length - skipRight; ++i) r.push(xs[sorted[ls[i]!][2]]!)
  return r
}
export function length(xs: Array<qt.Point>): number {
  const n = xs.length
  let r = 0,
    b = xs[n - 1]!,
    [xb, yb] = b,
    i = -1
  while (++i < n) {
    let [xa, ya] = [xb, yb]
    b = xs[i]!
    ;[xb, yb] = b
    xa -= xb
    ya -= yb
    r += Math.hypot(xa, ya)
  }
  return r
}

export class Path implements qt.Path {
  x0?: number | undefined
  x1?: number | undefined
  y0?: number | undefined
  y1?: number | undefined
  v = ""
  arc(x: number, y: number, r: number, a0: number, a1: number, ccw?: boolean) {
    ;(x = +x), (y = +y), (r = +r), (ccw = !!ccw)
    const dx = r * cos(a0),
      dy = r * sin(a0),
      x0 = x + dx,
      y0 = y + dy,
      cw = !ccw
    let da = ccw ? a0 - a1 : a1 - a0
    if (r < 0) throw new Error("negative radius: " + r)
    if (this.x1 === undefined) {
      this.v += "M" + x0 + "," + y0
    } else if (abs(this.x1 - x0) > epsilon || abs(this.y1! - y0) > epsilon) {
      this.v += "L" + x0 + "," + y0
    }
    if (!r) return
    if (da < 0) da = (da % tau) + tau
    if (da > tauEpsilon) {
      this.v +=
        "A" +
        r +
        "," +
        r +
        ",0,1," +
        cw +
        "," +
        (x - dx) +
        "," +
        (y - dy) +
        "A" +
        r +
        "," +
        r +
        ",0,1," +
        cw +
        "," +
        (this.x1 = x0) +
        "," +
        (this.y1 = y0)
    } else if (da > epsilon) {
      this.v +=
        "A" +
        r +
        "," +
        r +
        ",0," +
        +(da >= PI) +
        "," +
        cw +
        "," +
        (this.x1 = x + r * cos(a1)) +
        "," +
        (this.y1 = y + r * sin(a1))
    }
  }
  arcTo(x1: number, y1: number, x2: number, y2: number, r: number) {
    ;(x1 = +x1), (y1 = +y1), (x2 = +x2), (y2 = +y2), (r = +r)
    const x0 = this.x1!,
      y0 = this.y1!,
      x21 = x2 - x1,
      y21 = y2 - y1,
      x01 = x0 - x1,
      y01 = y0 - y1,
      l01_2 = x01 * x01 + y01 * y01
    if (r < 0) throw new Error("negative radius: " + r)
    if (this.x1 === undefined) {
      this.v += "M" + (this.x1 = x1) + "," + (this.y1 = y1)
    } else if (!(l01_2 > epsilon)) {
    } else if (!(abs(y01 * x21 - y21 * x01) > epsilon) || !r) {
      this.v += "L" + (this.x1 = x1) + "," + (this.y1 = y1)
    } else {
      const x20 = x2 - x0,
        y20 = y2 - y0,
        l21_2 = x21 * x21 + y21 * y21,
        l20_2 = x20 * x20 + y20 * y20,
        l21 = sqrt(l21_2),
        l01 = sqrt(l01_2),
        l = r * tan((PI - Math.acos((l21_2 + l01_2 - l20_2) / (2 * l21 * l01))) / 2),
        t01 = l / l01,
        t21 = l / l21
      if (abs(t01 - 1) > epsilon) {
        this.v += "L" + (x1 + t01 * x01) + "," + (y1 + t01 * y01)
      }
      this.v +=
        "A" +
        r +
        "," +
        r +
        ",0,0," +
        +(y01 * x20 > x01 * y20) +
        "," +
        (this.x1 = x1 + t21 * x21) +
        "," +
        (this.y1 = y1 + t21 * y21)
    }
  }
  bezierCurveTo(x1: number, y1: number, x2: number, y2: number, x: number, y: number) {
    this.v += "C" + +x1 + "," + +y1 + "," + +x2 + "," + +y2 + "," + (this.x1 = +x) + "," + (this.y1 = +y)
  }
  closePath() {
    if (this.x1 !== undefined) {
      ;(this.x1 = this.x0), (this.y1 = this.y0)
      this.v += "Z"
    }
  }
  lineTo(x: number, y: number) {
    this.v += "L" + (this.x1 = +x) + "," + (this.y1 = +y)
  }
  moveTo(x: number, y: number) {
    this.v += "M" + (this.x0 = this.x1 = +x) + "," + (this.y0 = this.y1 = +y)
  }
  quadraticCurveTo(x1: number, y1: number, x: number, y: number) {
    this.v += "Q" + +x1 + "," + +y1 + "," + (this.x1 = +x) + "," + (this.y1 = +y)
  }
  rect(x: number, y: number, w: number, h: number) {
    this.v += "M" + (this.x0 = this.x1 = +x) + "," + (this.y0 = this.y1 = +y) + "h" + +w + "v" + +h + "h" + -w + "Z"
  }
  toString() {
    return this.v
  }
}

const top = 1,
  right = 2,
  bottom = 3,
  left = 4

function translateX(x: any) {
  return "translate(" + x + ",0)"
}
function translateY(y: any) {
  return "translate(0," + y + ")"
}
function number(scale) {
  return x => +scale(x)
}
function center(scale, offset) {
  offset = max(0, scale.bandwidth() - offset * 2) / 2
  if (scale.round()) offset = round(offset)
  return x => +scale(x) + offset
}
export function axis<T>(orient, scale: qt.Axis.Scale<T>): qt.Axis<T> {
  let args: any[] = [],
    vals: any[] | null = null,
    format: ((x: T, i: number) => string) | null = null,
    sizeInner = 6,
    sizeOuter = 6,
    padding = 3,
    _off = typeof window !== "undefined" && window.devicePixelRatio > 1 ? 0 : 0.5
  const k = orient === top || orient === left ? -1 : 1,
    x = orient === left || orient === right ? "x" : "y",
    transform = orient === top || orient === bottom ? translateX : translateY
  function f(context) {
    let values = values === null ? (scale.ticks ? scale.ticks.apply(scale, args) : scale.domain()) : values,
      format = format === null ? (scale.tickFormat ? scale.tickFormat.apply(scale, args) : identity) : format,
      spacing = max(sizeInner, 0) + padding,
      range = scale.range(),
      range0 = +range[0] + _off,
      range1 = +range[range.length - 1] + _off,
      position = (scale.bandwidth ? center : number)(scale.copy(), _off),
      selection = context.selection ? context.selection() : context,
      path = selection.selectAll(".domain").data([null]),
      tick = selection.selectAll(".tick").data(values, scale).order(),
      tickExit = tick.exit(),
      tickEnter = tick.enter().append("g").attr("class", "tick"),
      line = tick.select("line"),
      text = tick.select("text")
    path = path.merge(path.enter().insert("path", ".tick").attr("class", "domain").attr("stroke", "currentColor"))
    tick = tick.merge(tickEnter)
    line = line.merge(
      tickEnter
        .append("line")
        .attr("stroke", "currentColor")
        .attr(x + "2", k * sizeInner)
    )
    text = text.merge(
      tickEnter
        .append("text")
        .attr("fill", "currentColor")
        .attr(x, k * spacing)
        .attr("dy", orient === top ? "0em" : orient === bottom ? "0.71em" : "0.32em")
    )
    if (context !== selection) {
      path = path.transition(context)
      tick = tick.transition(context)
      line = line.transition(context)
      text = text.transition(context)
      tickExit = tickExit
        .transition(context)
        .attr("opacity", epsilon)
        .attr("transform", function (d) {
          return isFinite((d = position(d))) ? transform(d + _off) : this.getAttribute("transform")
        })
      tickEnter.attr("opacity", epsilon).attr("transform", function (d) {
        var p = this.parentNode.__axis
        return transform((p && isFinite((p = p(d))) ? p : position(d)) + _off)
      })
    }
    tickExit.remove()
    path.attr(
      "d",
      orient === left || orient === right
        ? sizeOuter
          ? "M" + k * sizeOuter + "," + range0 + "H" + _off + "V" + range1 + "H" + k * sizeOuter
          : "M" + _off + "," + range0 + "V" + range1
        : sizeOuter
        ? "M" + range0 + "," + k * sizeOuter + "V" + _off + "H" + range1 + "V" + k * sizeOuter
        : "M" + range0 + "," + _off + "H" + range1
    )
    tick.attr("opacity", 1).attr("transform", function (d) {
      return transform(position(d) + _off)
    })
    line.attr(x + "2", k * sizeInner)
    text.attr(x, k * spacing).text(format)
    selection
      .filter(function () {
        return !this.__axis
      })
      .attr("fill", "none")
      .attr("font-size", 10)
      .attr("font-family", "sans-serif")
      .attr("text-anchor", orient === right ? "start" : orient === left ? "end" : "middle")
    selection.each(function () {
      this.__axis = position
    })
  }
  f.offset = (x: any) => (x === undefined ? _off : ((_off = +x), f))
  f.scale = (x: any) => (x === undefined ? scale : ((scale = x), f))
  f.tickArgs = (x: any) => (x === undefined ? args.slice() : ((args = x === null ? [] : Array.from(x)), f))
  f.tickFormat = (x: any) => (x === undefined ? format : ((format = x), f))
  f.tickPadding = (x: any) => (x === undefined ? padding : ((padding = +x), f))
  f.ticks = (...xs: any[]) => ((args = Array.from(xs)), f)
  f.tickSize = (x: any) => (x === undefined ? sizeInner : ((sizeInner = sizeOuter = +x), f))
  f.tickSizeInner = (x: any) => (x === undefined ? sizeInner : ((sizeInner = +x), f))
  f.tickSizeOuter = (x: any) => (x === undefined ? sizeOuter : ((sizeOuter = +x), f))
  f.tickValues = (x: any) =>
    x === undefined ? vals && vals.slice() : ((vals = x[0] === null ? null : Array.from(x)), f)
  return f
}
export namespace axis {
  export function top<T extends qt.Axis.Domain>(scale: qt.Axis.Scale<T>): qt.Axis<T> {
    return axis(top, scale)
  }
  export function right<T extends qt.Axis.Domain>(scale: qt.Axis.Scale<T>): qt.Axis<T> {
    return axis(right, scale)
  }
  export function bottom<T extends qt.Axis.Domain>(scale: qt.Axis.Scale<T>): qt.Axis<T> {
    return axis(bottom, scale)
  }
  export function left<T extends qt.Axis.Domain>(scale: qt.Axis.Scale<T>): qt.Axis<T> {
    return axis(left, scale)
  }
}

class DispatchMap<T extends object> extends Map<string, (qt.CB<T> | undefined)[]> {}

export function dispatch<T extends object>(...xs: string[]): Dispatch<T> {
  const m = new DispatchMap<T>()
  for (const x of xs) {
    if (x in m || /[\s.]/.test(x)) throw new Error("illegal type: " + x)
    m.set(x, [])
  }
  return new Dispatch(m)
}

export class Dispatch<T extends object> implements qt.Dispatch<T> {
  constructor(public map: DispatchMap<T>) {}
  apply(k: string, x?: T, ...xs: any[]) {
    this.map.get(k)?.forEach(f => f?.apply(x, xs))
  }
  call(k: string, x?: T, ...xs: any[]) {
    this.map.get(k)?.forEach(f => f?.call(x, xs))
  }
  copy() {
    const r = new DispatchMap<T>()
    for (const k in this.map) r.set(k, this.map.get(k)!)
    return new Dispatch(r)
  }
  on(types: string, f?: Function) {
    function parse(typenames, types) {
      return typenames
        .trim()
        .split(/^|\s+/)
        .map(function (t) {
          let name = "",
            i = t.indexOf(".")
          if (i >= 0) (name = t.slice(i + 1)), (t = t.slice(0, i))
          if (t && !types.hasOwnProperty(t)) throw new Error("unknown type: " + t)
          return { type: t, name: name }
        })
    }
    const tgt = this.map,
      ts = parse(types + "", tgt),
      n = ts.length
    let t,
      i = -1
    function get(xs: qt.CB<T>[], key: string) {
      for (const x of xs) {
        if (x.key === key) return x.cb
      }
      return
    }
    function set(xs: qt.CB<T>[], key: string, cb?: Function) {
      const n = xs.length
      for (let i = 0; i < n; ++i) {
        if (xs[i]?.key === key) {
          xs[i] = { key, cb: () => {} }
          xs = xs.slice(0, i).concat(xs.slice(i + 1))
          break
        }
      }
      if (cb != undefined) xs.push({ key, cb })
      return xs
    }
    if (arguments.length < 2) {
      while (++i < n) if ((t = (types = ts[i]).type) && (t = get(tgt[t], types.name))) return t
      return
    }
    while (++i < n) {
      if ((t = (types = ts[i]).type)) tgt[t] = set(tgt[t], types.name, f)
      else if (f === null) for (t in tgt) tgt[t] = set(tgt[t], types.name, null)
    }
    return this
  }
}

let head: any
let tail: any

export class Timer implements qt.Timer {
  cb?: Function | undefined
  time?: number
  next?: any
  restart(cb: (x: number) => void, delay?: number, time?: number) {
    time = (time === undefined ? now() : +time) + (delay === undefined ? 0 : +delay)
    if (!this.next && tail !== this) {
      if (tail) tail.next = this
      else head = this
      tail = this
    }
    this.cb = cb
    this.time = time
    sleep()
  }
  stop() {
    if (this.cb) {
      this.cb = undefined
      this.time = Infinity
      sleep()
    }
  }
}
export function timer(f: (x: number) => void, delay?: number, time?: number): Timer {
  const t = new Timer()
  t.restart(f, delay, time)
  return t
}
export namespace timer {
  export function interval(f: (x: number) => void, delay?: number, time?: number): Timer {
    const t = new Timer()
    let total = delay
    if (delay === null) return t.restart(f, delay, time), t
    t._restart = t.restart
    t.restart = function (callback, delay, time) {
      ;(delay = +delay), (time = time === null ? now() : +time)
      t._restart(
        function tick(x) {
          x += total
          t._restart(tick, (total += delay), time)
          callback(x)
        },
        delay,
        time
      )
    }
    t.restart(f, delay, time)
    return t
  }
  export function timeout(cb: (x: number) => void, delay?: number, time?: number): Timer {
    const t = new Timer()
    delay = delay ?? 0
    t.restart(
      x => {
        t.stop()
        cb(x + delay!)
      },
      delay,
      time
    )
    return t
  }
  const pokeDelay = 1000,
    clock = typeof performance === "object" ? performance : Date,
    setFrame =
      typeof window === "object" && window.requestAnimationFrame
        ? window.requestAnimationFrame.bind(window)
        : f => setTimeout(f, 17)
  let frame = 0,
    clockTimeout: any = 0,
    clockInterval: any = 0,
    clockLast = 0,
    clockNow = 0,
    clockSkew = 0
  export function now(): number {
    return clockNow || (setFrame(clear), (clockNow = clock.now() + clockSkew))
  }
  function clear() {
    clockNow = 0
  }
  export function flush() {
    now()
    ++frame
    let t = head,
      e
    while (t) {
      if ((e = clockNow - t._time) >= 0) t._call.call(undefined, e)
      t = t._next
    }
    --frame
  }
  function wake() {
    clockNow = (clockLast = clock.now()) + clockSkew
    frame = clockTimeout = 0
    try {
      timerFlush()
    } finally {
      frame = 0
      nap()
      clockNow = 0
    }
  }
  function poke() {
    const now = clock.now(),
      delay = now - clockLast
    if (delay > pokeDelay) (clockSkew -= delay), (clockLast = now)
  }
  function nap() {
    let t0,
      t1 = head,
      t2,
      time = Infinity
    while (t1) {
      if (t1._call) {
        if (time > t1._time) time = t1._time
        ;(t0 = t1), (t1 = t1._next)
      } else {
        ;(t2 = t1._next), (t1._next = null)
        t1 = t0 ? (t0._next = t2) : (head = t2)
      }
    }
    tail = t0
    sleep(time)
  }
  function sleep(time?) {
    if (frame) return
    if (clockTimeout) clockTimeout = clearTimeout(clockTimeout)
    const delay = time - clockNow
    if (delay > 24) {
      if (time < Infinity) clockTimeout = setTimeout(wake, time - clock.now() - clockSkew)
      if (clockInterval) clockInterval = clearInterval(clockInterval)
    } else {
      if (!interval) (clockLast = clock.now()), (clockInterval = setInterval(poke, pokeDelay))
      ;(frame = 1), setFrame(wake)
    }
  }
}

export function defaultView(x: Window): Window
export function defaultView(x: Document): Window
export function defaultView(x: Element): Window
export function defaultView(x: any): Window {
  return (x.ownerDocument && x.ownerDocument.defaultView) || (x.document && x) || x.defaultView
}

export function nopropagation(x: Event) {
  x.stopImmediatePropagation()
}
export function noevent(x: Event) {
  x.preventDefault()
  x.stopImmediatePropagation()
}

function sourceEvent(x: any) {
  let s
  while ((s = x.sourceEvent)) x = s
  return x
}

export function pointer(event: any, tgt?: any): qt.Point {
  event = sourceEvent(event)
  if (tgt === undefined) tgt = event.currentTarget
  if (tgt) {
    const svg = tgt.ownerSVGElement || tgt
    if (svg.createSVGPoint) {
      let p = svg.createSVGPoint()
      ;(p.x = event.clientX), (p.y = event.clientY)
      p = p.matrixTransform(tgt.getScreenCTM().inverse())
      return [p.x, p.y]
    }
    if (tgt.getBoundingClientRect) {
      const r = tgt.getBoundingClientRect()
      return [event.clientX - r.left - tgt.clientLeft, event.clientY - r.top - tgt.clientTop]
    }
  }
  return [event.pageX, event.pageY]
}
export function pointers(event: any, tgt?: any): Array<qt.Point> {
  if (event.target) {
    event = sourceEvent(event)
    if (tgt === undefined) tgt = event.currentTarget
    event = event.touches || [event]
  }
  return Array.from(event, x => pointer(x, tgt))
}

export function local<T>(): qt.Local<T> {
  let nextId = 0
  class Local {
    id = "@" + (++nextId).toString(36)
    get(x: any) {
      const id = this.id
      while (!(id in x)) if (!(x = x.parentNode)) return
      return x[id]
    }
    remove(x: any) {
      return this.id in x && delete x[this.id]
    }
    set(x: any, v: any) {
      return (x[this.id] = v)
    }
    toString() {
      return this.id
    }
  }
  return new Local()
}

export const xhtml = "http://www.w3.org/1999/xhtml"
export const spaces = new Map<string, string>([
  ["svg", "http://www.w3.org/2000/svg"],
  ["xhtml", xhtml],
  ["xlink", "http://www.w3.org/1999/xlink"],
  ["xml", "http://www.w3.org/XML/1998/namespace"],
  ["xmlns", "http://www.w3.org/2000/xmlns/"],
])

export function space(x: string): qt.NS | string {
  let pre = (x += "")
  const i = pre.indexOf(":")
  if (i >= 0 && (pre = x.slice(0, i)) !== "xmlns") x = x.slice(i + 1)
  const space = spaces.get(pre)
  return space ? { space, local: x } : x
}

export namespace format {
  let locale
  export let format: (x: string) => (n: number | { valueOf(): number }) => string
  export let formatPrefix: (x: string, value: number) => (n: number | { valueOf(): number }) => string

  defaultLocale({
    thousands: ",",
    grouping: [3],
    currency: ["$", ""],
  })

  export function defaultLocale(definition: qt.Format.Definition): qt.Format.Locale {
    locale = formatLocale(definition)
    format = locale.format
    formatPrefix = locale.formatPrefix
    return locale
  }
  export function exponent(x) {
    return (x = decimalParts(abs(x))), x ? x[1] : NaN
  }
  export function decimal(x) {
    return abs((x = round(x))) >= 1e21 ? x.toLocaleString("en").replace(/,/g, "") : x.toString(10)
  }
  export function decimalParts(x, p?) {
    let i
    if ((i = (x = p ? x.toExponential(p - 1) : x.toExponential()).indexOf("e")) < 0) return null
    const coefficient = x.slice(0, i)
    return [coefficient.length > 1 ? coefficient[0] + coefficient.slice(2) : coefficient, +x.slice(i + 1)]
  }
  export function group(grouping, thousands) {
    return function (value, width) {
      let i = value.length,
        t = [],
        j = 0,
        g = grouping[0],
        length = 0
      while (i > 0 && g > 0) {
        if (length + g + 1 > width) g = max(1, width - length)
        t.push(value.substring((i -= g), i + g))
        if ((length += g + 1) > width) break
        g = grouping[(j = (j + 1) % grouping.length)]
      }
      return t.reverse().join(thousands)
    }
  }
  export function numerals(numerals) {
    return function (x) {
      return x.replace(/[0-9]/g, function (i) {
        return numerals[+i]
      })
    }
  }

  export let prefixExponent: number

  export function prefixAuto(x, p) {
    const d = decimalParts(x, p)
    if (!d) return x + ""
    const coefficient = d[0],
      exponent = d[1],
      i = exponent - (prefixExponent = max(-8, min(8, floor(exponent / 3))) * 3) + 1,
      n = coefficient.length
    return i === n
      ? coefficient
      : i > n
      ? coefficient + new Array(i - n + 1).join("0")
      : i > 0
      ? coefficient.slice(0, i) + "." + coefficient.slice(i)
      : "0." + new Array(1 - i).join("0") + decimalParts(x, max(0, p + i - 1))[0]
  }

  export function rounded(x, p) {
    const d = decimalParts(x, p)
    if (!d) return x + ""
    const coefficient = d[0],
      exponent = d[1]
    return exponent < 0
      ? "0." + new Array(-exponent).join("0") + coefficient
      : coefficient.length > exponent + 1
      ? coefficient.slice(0, exponent + 1) + "." + coefficient.slice(exponent + 1)
      : coefficient + new Array(exponent - coefficient.length + 2).join("0")
  }

  const re = /^(?:(.)?([<>=^]))?([+\-( ])?([$#])?(0)?(\d+)?(,)?(\.\d+)?(~)?([a-z%])?$/i
  export function specifier(x: string) {
    let match
    if (!(match = re.exec(x))) throw new Error("invalid format: " + x)
    return new Specifier({
      fill: match[1],
      align: match[2],
      sign: match[3],
      symbol: match[4],
      zero: match[5],
      width: match[6],
      comma: match[7],
      precision: match[8] && match[8].slice(1),
      trim: match[9],
      type: match[10],
    })
  }

  export class Specifier implements qt.Format.Spec {
    fill: string
    align: ">" | "<" | "^" | "="
    sign: "-" | "+" | "(" | " "
    symbol: "$" | "#" | ""
    zero: boolean
    width: number | undefined
    comma: boolean
    precision: number | undefined
    trim: boolean
    type: "e" | "f" | "g" | "r" | "s" | "%" | "p" | "b" | "o" | "d" | "x" | "X" | "c" | "" | "n"

    constructor(x: qt.Format.Specifier) {
      this.fill = x.fill === undefined ? " " : x.fill + ""
      this.align = x.align === undefined ? ">" : x.align + ""
      this.sign = x.sign === undefined ? "-" : x.sign + ""
      this.symbol = x.symbol === undefined ? "" : x.symbol + ""
      this.zero = !!x.zero
      this.width = x.width === undefined ? undefined : +x.width
      this.comma = !!x.comma
      this.precision = x.precision === undefined ? undefined : +x.precision
      this.trim = !!x.trim
      this.type = x.type === undefined ? "" : x.type + ""
    }
    toString() {
      return (
        this.fill +
        this.align +
        this.sign +
        this.symbol +
        (this.zero ? "0" : "") +
        (this.width === undefined ? "" : max(1, this.width | 0)) +
        (this.comma ? "," : "") +
        (this.precision === undefined ? "" : "." + max(0, this.precision | 0)) +
        (this.trim ? "~" : "") +
        this.type
      )
    }
  }
  export function trim(s) {
    out: for (let n = s.length, i = 1, i0 = -1, i1; i < n; ++i) {
      switch (s[i]) {
        case ".":
          i0 = i1 = i
          break
        case "0":
          if (i0 === 0) i0 = i
          i1 = i
          break
        default:
          if (!+s[i]) break out
          if (i0 > 0) i0 = 0
          break
      }
    }
    return i0 > 0 ? s.slice(0, i0) + s.slice(i1 + 1) : s
  }

  export const types = {
    "%": (x, p) => (x * 100).toFixed(p),
    b: x => round(x).toString(2),
    c: x => x + "",
    d: decimal,
    e: (x, p) => x.toExponential(p),
    f: (x, p) => x.toFixed(p),
    g: (x, p) => x.toPrecision(p),
    o: x => round(x).toString(8),
    p: (x, p) => rounded(x * 100, p),
    r: rounded,
    s: prefixAuto,
    X: x => round(x).toString(16).toUpperCase(),
    x: x => round(x).toString(16),
  }

  const map = Array.prototype.map,
    prefixes = ["y", "z", "a", "f", "p", "n", "µ", "m", "", "k", "M", "G", "T", "P", "E", "Z", "Y"]
  export function formatLocale(locale: qt.Format.Definition): qt.Format.Locale {
    const group =
        locale.grouping === undefined || locale.thousands === undefined
          ? identity
          : group(map.call(locale.grouping, Number), locale.thousands + ""),
      currencyPrefix = locale.currency === undefined ? "" : locale.currency[0] + "",
      currencySuffix = locale.currency === undefined ? "" : locale.currency[1] + "",
      decimal = locale.decimal === undefined ? "." : locale.decimal + "",
      numerals = locale.numerals === undefined ? identity : numerals(map.call(locale.numerals, String)),
      percent = locale.percent === undefined ? "%" : locale.percent + "",
      minus = locale.minus === undefined ? "−" : locale.minus + "",
      nan = locale.nan === undefined ? "NaN" : locale.nan + ""
    function newFormat(specifier) {
      specifier = specifier(specifier)
      let fill = specifier.fill,
        align = specifier.align,
        sign = specifier.sign,
        symbol = specifier.symbol,
        zero = specifier.zero,
        width = specifier.width,
        comma = specifier.comma,
        precision = specifier.precision,
        trim = specifier.trim,
        type = specifier.type
      if (type === "n") (comma = true), (type = "g")
      else if (!types[type]) precision === undefined && (precision = 12), (trim = true), (type = "g")
      if (zero || (fill === "0" && align === "=")) (zero = true), (fill = "0"), (align = "=")
      const prefix =
          symbol === "$" ? currencyPrefix : symbol === "#" && /[boxX]/.test(type) ? "0" + type.toLowerCase() : "",
        suffix = symbol === "$" ? currencySuffix : /[%p]/.test(type) ? percent : ""
      const formatType = types[type],
        maybeSuffix = /[defgprs%]/.test(type)
      precision =
        precision === undefined ? 6 : /[gprs]/.test(type) ? max(1, min(21, precision)) : max(0, min(20, precision))
      function format(value) {
        let valuePrefix = prefix,
          valueSuffix = suffix,
          i,
          n,
          c
        if (type === "c") {
          valueSuffix = formatType(value) + valueSuffix
          value = ""
        } else {
          value = +value
          let valueNegative = value < 0 || 1 / value < 0
          value = isNaN(value) ? nan : formatType(abs(value), precision)
          if (trim) value = trim(value)
          if (valueNegative && +value === 0 && sign !== "+") valueNegative = false
          valuePrefix =
            (valueNegative ? (sign === "(" ? sign : minus) : sign === "-" || sign === "(" ? "" : sign) + valuePrefix
          valueSuffix =
            (type === "s" ? prefixes[8 + prefixExponent / 3] : "") +
            valueSuffix +
            (valueNegative && sign === "(" ? ")" : "")
          if (maybeSuffix) {
            ;(i = -1), (n = value.length)
            while (++i < n) {
              if (((c = value.charCodeAt(i)), 48 > c || c > 57)) {
                valueSuffix = (c === 46 ? decimal + value.slice(i + 1) : value.slice(i)) + valueSuffix
                value = value.slice(0, i)
                break
              }
            }
          }
        }
        if (comma && !zero) value = group(value, Infinity)
        let length = valuePrefix.length + value.length + valueSuffix.length,
          padding = length < width ? new Array(width - length + 1).join(fill) : ""
        if (comma && zero)
          (value = group(padding + value, padding.length ? width - valueSuffix.length : Infinity)), (padding = "")
        switch (align) {
          case "<":
            value = valuePrefix + value + valueSuffix + padding
            break
          case "=":
            value = valuePrefix + padding + value + valueSuffix
            break
          case "^":
            value =
              padding.slice(0, (length = padding.length >> 1)) +
              valuePrefix +
              value +
              valueSuffix +
              padding.slice(length)
            break
          default:
            value = padding + valuePrefix + value + valueSuffix
            break
        }
        return numerals(value)
      }
      format.toString = function () {
        return specifier + ""
      }
      return format
    }
    function formatPrefix(specifier, value) {
      const f = newFormat(((specifier = specifier(specifier)), (specifier.type = "f"), specifier)),
        e = max(-8, min(8, floor(exponent(value) / 3))) * 3,
        k = pow(10, -e),
        prefix = prefixes[8 + e / 3]
      return function (value) {
        return f(k * value) + prefix
      }
    }
    return {
      format: newFormat,
      formatPrefix: formatPrefix,
    }
  }

  export function precisionFixed(step: number) {
    return max(0, -exponent(abs(step)))
  }
  export function precisionPrefix(step: number, x: number) {
    return max(0, max(-8, min(8, floor(exponent(x) / 3))) * 3 - exponent(abs(step)))
  }
  export function precisionRound(step: number, x: number) {
    ;(step = abs(step)), (x = abs(x) - step)
    return max(0, exponent(x) - exponent(step)) + 1
  }
}

export namespace drag {
  const nonpassive = { passive: false }
  const capture = { capture: true, passive: false }
  export class Event<D extends qt.Dragged, T, S> {
    constructor(
      public type: "start" | "drag" | "end" | string,
      public id: "mouse" | number,
      public src: any,
      public tgt: qt.Drag<D, T, S>,
      public subject: S,
      public active: number,
      public x: number,
      public y: number,
      public dx: number,
      public dy: number,
      public dispatch: any
    ) {}
    on(n: string, f: (this: D, e: any, x: T) => void): this
    on(n: string, x: null): this
    on(n: string): ((this: D, e: any, x: T) => void) | undefined
    on(...xs: any) {
      const y = this.dispatch.on(this.dispatch, xs)
      return y === this.dispatch ? this : y
    }
  }
  export function drag<B extends qt.Dragged, T>(): qt.Drag<B, T, T | qt.Drag.Position>
  export function drag<B extends qt.Dragged, T, U>(): qt.Drag<B, T, U>
  export function drag() {
    const _gestures = {},
      _listeners = dispatch("start", "drag", "end")
    let _container = function (this: Node) {
        return this.parentNode
      },
      _filter = (e: any) => !e.ctrlKey && !e.button,
      _subject = (e: any, x: any) => (x === null ? { x: e.x, y: e.y } : x),
      _touchable = function (this: any) {
        return navigator.maxTouchPoints || "ontouchstart" in this
      },
      active = 0,
      mousedownx,
      mousedowny,
      mousemoving,
      touchending,
      _distance = 0
    function down(e, d) {
      if (touchending || !_filter.call(this, e, d)) return
      let gesture = beforestart(this, _container.call(this, e, d), e, d, "mouse")
      if (!gesture) return
      select(e.view).on("mousemove.drag", moved, capture).on("mouseup.drag", up, capture)
      nodrag(e.view)
      nopropagation(e)
      mousemoving = false
      mousedownx = e.clientX
      mousedowny = e.clientY
      gesture("start", e)
    }
    function moved(e) {
      noevent(e)
      if (!mousemoving) {
        let dx = e.clientX - mousedownx,
          dy = e.clientY - mousedowny
        mousemoving = dx * dx + dy * dy > _distance
      }
      _gestures.mouse("drag", e)
    }
    function up(e) {
      select(e.view).on("mousemove.drag mouseup.drag", null)
      yesdrag(e.view, mousemoving)
      noevent(e)
      _gestures.mouse("end", e)
    }
    function started(e, d) {
      if (!_filter.call(this, e, d)) return
      const touches = e.changedTouches,
        c = _container.call(this, e, d),
        n = touches.length
      let i, gesture
      for (i = 0; i < n; ++i) {
        if ((gesture = beforestart(this, c, e, d, touches[i].identifier, touches[i]))) {
          nopropagation(e)
          gesture("start", e, touches[i])
        }
      }
    }
    function touchmoved(e) {
      const touches = e.changedTouches,
        n = touches.length
      let i, gesture
      for (i = 0; i < n; ++i) {
        if ((gesture = _gestures[touches[i].identifier])) {
          noevent(e)
          gesture("drag", e, touches[i])
        }
      }
    }
    function ended(e) {
      const touches = e.changedTouches,
        n = touches.length
      let i, gesture
      if (touchending) clearTimeout(touchending)
      touchending = setTimeout(function () {
        touchending = null
      }, 500)
      for (i = 0; i < n; ++i) {
        if ((gesture = _gestures[touches[i].identifier])) {
          nopropagation(e)
          gesture("end", e, touches[i])
        }
      }
    }
    function f(selection) {
      selection
        .on("mousedown.drag", down)
        .filter(_touchable)
        .on("touchstart.drag", started)
        .on("touchmove.drag", touchmoved, nonpassive)
        .on("touchend.drag touchcancel.drag", ended)
        .style("touch-action", "none")
        .style("-webkit-tap-highlight-color", "rgba(0,0,0,0)")
    }
    function beforestart(that, container, e, d, id, touch) {
      const dispatch = _listeners.copy()
      let p = pointer(touch || e, container),
        s
      if (
        (s = _subject.call(
          that,
          new Event("beforestart", id, e, f, undefined, active, p[0], p[1], 0, 0, dispatch),
          d
        )) === null
      )
        return
      const dx = s.x - p[0] || 0
      const dy = s.y - p[1] || 0
      return (type, event, touch) => {
        let p0 = p,
          n
        switch (type) {
          case "start":
            ;(_gestures[id] = gesture), (n = active++)
            break
          case "end":
            delete _gestures[id], --active // falls through
          case "drag":
            ;(p = pointer(touch || event, container)), (n = active)
            break
        }
        dispatch.call(
          type,
          that,
          new Event(type, id, event, f, s, n, p[0] + dx, p[1] + dy, p[0] - p0[0], p[1] - p0[1], dispatch),
          d
        )
      }
    }
    f.clickDistance = (x: any) => (x === undefined ? sqrt(_distance) : ((_distance = (x = +x) * x), f))
    f.container = (x: any) =>
      x === undefined ? _container : ((_container = typeof x === "function" ? x : constant(x)), f)
    f.filter = (x: any) => (x === undefined ? _filter : ((_filter = typeof x === "function" ? x : constant(!!x)), f))
    f.on = (...xs: any) => {
      const y = _listeners.on(xs)
      return y === _listeners ? f : y
    }
    f.subject = (x: any) => (x === undefined ? _subject : ((_subject = typeof x === "function" ? x : constant(x)), f))
    f.touchable = (x: any) =>
      x === undefined ? _touchable : ((_touchable = typeof x === "function" ? x : constant(!!x)), f)
    return f
  }

  export function disable(x: Window) {
    const root = x.document.documentElement
    const selection = select(x).on("dragstart.drag", noevent, capture)
    if ("onselectstart" in root) {
      selection.on("selectstart.drag", noevent, capture)
    } else {
      root.__noselect = root.style.MozUserSelect
      root.style.MozUserSelect = "none"
    }
  }
  export function enable(x: Window, noclick?: boolean) {
    const root = x.document.documentElement
    const selection = select(x).on("dragstart.drag", null)
    if (noclick) {
      selection.on("click.drag", noevent, capture)
      setTimeout(function () {
        selection.on("click.drag", null)
      }, 0)
    }
    if ("onselectstart" in root) {
      selection.on("selectstart.drag", null)
    } else {
      root.style.MozUserSelect = root.__noselect
      delete root.__noselect
    }
  }
}

export namespace fetcher {
  const EOL = {},
    EOF = {},
    QUOTE = 34,
    NEWLINE = 10,
    RETURN = 13
  export class DSV implements qt.DSV {
    reFormat
    constructor(public delimiter: string) {
      ;(this.reFormat = new RegExp('["' + delimiter + "\n\r]")), (DELIMITER = delimiter.charCodeAt(0))
    }
    preformat(rs: any[], cs: any[]) {
      return rs.map(r => cs.map(c => this.formatValue(r[c])).join(this.delimiter))
    }
    inferColumns(rs) {
      const ys = []
      const cs = new Set()
      rs.forEach(r => {
        for (const x in r) {
          if (!(x in cs)) {
            ys.push(x)
            cs.add(x)
          }
        }
      })
      return ys
    }
    format(rs: any, cs?: any) {
      cs = cs ?? this.inferColumns(rs)
      return [cs.map(this.formatValue).join(this.delimiter)].concat(this.preformat(rs, cs)).join("\n")
    }
    formatBody(rs: any[], cs?: any[]) {
      cs = cs ?? this.inferColumns(rs)
      return this.preformat(rs, cs).join("\n")
    }
    formatRows(xs: any[]) {
      return xs.map(this.formatRow).join("\n")
    }
    formatRow(xs: any[]) {
      return xs.map(this.formatValue).join(this.delimiter)
    }
    formatValue(x?: any) {
      function date(x: Date) {
        const hours = x.getUTCHours(),
          minutes = x.getUTCMinutes(),
          seconds = x.getUTCSeconds(),
          millis = x.getUTCMilliseconds()
        const pad = (x, width: number) => {
          const y = x + "",
            length = y.length
          return length < width ? new Array(width - length + 1).join(0) + y : y
        }
        const year = x => (x < 0 ? "-" + pad(-x, 6) : x > 9999 ? "+" + pad(x, 6) : pad(x, 4))
        return isNaN(+x)
          ? "Invalid Date"
          : year(x.getUTCFullYear()) +
              "-" +
              pad(x.getUTCMonth() + 1, 2) +
              "-" +
              pad(x.getUTCDate(), 2) +
              (millis
                ? "T" + pad(hours, 2) + ":" + pad(minutes, 2) + ":" + pad(seconds, 2) + "." + pad(millis, 3) + "Z"
                : seconds
                ? "T" + pad(hours, 2) + ":" + pad(minutes, 2) + ":" + pad(seconds, 2) + "Z"
                : minutes || hours
                ? "T" + pad(hours, 2) + ":" + pad(minutes, 2) + "Z"
                : "")
      }
      return x === undefined
        ? ""
        : x instanceof Date
        ? date(x)
        : this.reFormat.test((x += ""))
        ? '"' + x.replace(/"/g, '""') + '"'
        : x
    }
    parse(text, f) {
      const objConverter = (cs: any[]) =>
        new Function(
          "d",
          "return {" + cs.map((x: any, i: number) => JSON.stringify(x) + ": d[" + i + '] || ""').join(",") + "}"
        )
      const converter = (cs: any[], f: Function) => (x: any, i: number) => f(objConverter(cs)(x), i, cs)
      let convert, cs
      const rs = this.parseRows(text, (r: any[], i: number) => {
        if (convert) return convert(r, i - 1)
        ;(cs = r), (convert = f ? converter(r, f) : objConverter(r))
      })
      rs.columns = cs || []
      return rs
    }
    parseRows(x: any, f?: Function) {
      const ys = []
      let N = x.length,
        I = 0,
        n = 0,
        t,
        eof = N <= 0,
        eol = false
      if (x.charCodeAt(N - 1) === NEWLINE) --N
      if (x.charCodeAt(N - 1) === RETURN) --N
      function token() {
        if (eof) return EOF
        if (eol) return (eol = false), EOL
        let i,
          j = I,
          c
        if (x.charCodeAt(j) === QUOTE) {
          while ((I++ < N && x.charCodeAt(I) !== QUOTE) || x.charCodeAt(++I) === QUOTE);
          if ((i = I) >= N) eof = true
          else if ((c = x.charCodeAt(I++)) === NEWLINE) eol = true
          else if (c === RETURN) {
            eol = true
            if (x.charCodeAt(I) === NEWLINE) ++I
          }
          return x.slice(j + 1, i - 1).replace(/""/g, '"')
        }
        while (I < N) {
          if ((c = x.charCodeAt((i = I++))) === NEWLINE) eol = true
          else if (c === RETURN) {
            eol = true
            if (x.charCodeAt(I) === NEWLINE) ++I
          } else if (c !== this.DELIMITER) continue
          return x.slice(j, i)
        }
        return (eof = true), x.slice(j, N)
      }
      while ((t = token()) !== EOF) {
        let y = []
        while (t !== EOL && t !== EOF) y.push(t), (t = token())
        if (f && (y = f(y, n++)) === null) continue
        ys.push(y)
      }
      return ys
    }
  }
  export function dsv<T extends string>(del: string, url: string, init?: RequestInit): Promise<qt.DSV.RowArray<T>>
  export function dsv<T extends object, U extends string = string>(
    del: string,
    url: string,
    f: (x: qt.DSV.Row<U>, i: number, xs: U[]) => T | undefined | null
  ): Promise<qt.DSV.Parsed<T>>
  export function dsv<T extends object, U extends string = string>(
    del: string,
    url: string,
    init: RequestInit,
    f: (x: qt.DSV.Row<U>, i: number, xs: U[]) => T | undefined | null
  ): Promise<qt.DSV.Parsed<T>>
  export async function dsv(del: string, url: string, init?: any, row?: any) {
    if (arguments.length === 3 && typeof init === "function") (row = init), (init = undefined)
    return new DSV(del).parse(await text(url, init), row)
  }
  export class CSV extends DSV {
    constructor() {
      super(",")
    }
  }
  export function csv<T extends string>(url: string, init?: RequestInit): Promise<qt.DSV.RowArray<T>>
  export function csv<T extends object, U extends string = string>(
    url: string,
    f: (x: qt.DSV.Row<U>, i: number, xs: U[]) => T | undefined | null
  ): Promise<qt.DSV.Parsed<T>>
  export function csv<T extends object, U extends string = string>(
    url: string,
    init: RequestInit,
    f: (x: qt.DSV.Row<U>, i: number, xs: U[]) => T | undefined | null
  ): Promise<qt.DSV.Parsed<T>>
  export async function csv(url: string, init?: any, row?: any) {
    if (arguments.length === 2 && typeof init === "function") (row = init), (init = undefined)
    return new CSV().parse(await text(url, init), row)
  }
  export class TSV extends DSV {
    constructor() {
      super("\t")
    }
  }
  export function tsv<T extends string>(url: string, init?: RequestInit): Promise<qt.DSV.RowArray<T>>
  export function tsv<T extends object, U extends string = string>(
    url: string,
    f: (x: qt.DSV.Row<U>, i: number, xs: U[]) => T | undefined | null
  ): Promise<qt.DSV.Parsed<T>>
  export function tsv<T extends object, U extends string = string>(
    url: string,
    init: RequestInit,
    f: (x: qt.DSV.Row<U>, i: number, xs: U[]) => T | undefined | null
  ): Promise<qt.DSV.Parsed<T>>
  export async function tsv(url: string, init?: any, row?: any) {
    if (arguments.length === 2 && typeof init === "function") (row = init), (init = undefined)
    return new TSV().parse(await text(url, init), row)
  }
  export function autoType<R extends object | undefined | null, T extends string>(
    x: qt.DSV.Row<T> | readonly string[]
  ): R {
    const fix = new Date("2019-01-01T00:00").getHours() || new Date("2019-07-01T00:00").getHours()
    for (const k in x) {
      let y = x[k].trim(),
        number,
        m
      if (!y) y = null
      else if (y === "true") y = true
      else if (y === "false") y = false
      else if (y === "NaN") y = NaN
      else if (!isNaN((number = +y))) y = number
      else if (
        (m = y.match(/^([-+]\d{2})?\d{4}(-\d{2}(-\d{2})?)?(T\d{2}:\d{2}(:\d{2}(\.\d{3})?)?(Z|[-+]\d{2}:\d{2})?)?$/))
      ) {
        if (fix && !!m[4] && !m[7]) y = y.replace(/-/g, "/").replace(/T/, " ")
        y = new Date(y)
      } else continue
      x[k] = y
    }
    return x
  }
  export async function blob(x: RequestInfo | URL, init?: RequestInit): Promise<Blob> {
    function check(x: Response) {
      if (!x.ok) throw new Error(x.status + " " + x.statusText)
      return x.blob()
    }
    return check(await fetch(x, init))
  }
  export async function buffer(x: RequestInfo | URL, init?: RequestInit): Promise<ArrayBuffer> {
    function check(x: Response) {
      if (!x.ok) throw new Error(x.status + " " + x.statusText)
      return x.arrayBuffer()
    }
    return check(await fetch(x, init))
  }
  export function image(x: RequestInfo | URL, init?: Partial<HTMLImageElement>): Promise<HTMLImageElement> {
    return new Promise(function (res, rej) {
      const y = new Image()
      for (const k in init) y[k] = init[k]
      y.onerror = rej
      y.onload = () => res(y)
      y.src = x
    })
  }
  export async function json<T>(x: RequestInfo | URL, init?: RequestInit): Promise<T | undefined> {
    function check(x: Response) {
      if (!x.ok) throw new Error(x.status + " " + x.statusText)
      if (x.status === 204 || x.status === 205) return
      return x.json()
    }
    return check(await fetch(x, init))
  }
  export async function text(x: RequestInfo | URL, init?: RequestInit): Promise<string> {
    function check(x: Response) {
      if (!x.ok) throw new Error(x.status + " " + x.statusText)
      return x.text()
    }
    return check(await fetch(x, init))
  }
  export async function xml(x: RequestInfo | URL, init?: RequestInit): Promise<XMLDocument> {
    return new DOMParser().parseFromString(await text(x, init), "application/xml")
  }
  export async function html(x: RequestInfo | URL, init?: RequestInit): Promise<Document> {
    return new DOMParser().parseFromString(await text(x, init), "text/html")
  }
  export async function svg(x: RequestInfo | URL, init?: RequestInit): Promise<Document> {
    return new DOMParser().parseFromString(await text(x, init), "image/svg+xml")
  }
}

export namespace interpolate {
  export function numArray<T extends any[]>(a: any[], b: T): qt.ArrayIpolator<T>
  export function numArray<T extends qt.NumArray>(a: qt.NumArray | number[], b: T): (x: number) => T
  export function numArray(a: any, b: any) {
    if (!b) b = []
    const n = a ? min(b.length, a.length) : 0
    const c = b.slice()
    return function (x: number) {
      for (let i = 0; i < n; ++i) c[i] = a[i] * (1 - x) + b[i] * x
      return c
    }
  }

  export function anyArray(a: any, b: any) {
    const nb: number = b & b.length ?? 0,
      na = min(nb, a & a.length ?? 0),
      a2 = new Array(na),
      b2 = new Array(nb)
    let i = 0
    for (; i < na; ++i) a2[i] = value(a[i], b[i])
    for (; i < nb; ++i) b2[i] = b[i]
    return function (x: number) {
      for (i = 0; i < na; ++i) b2[i] = a2[i](x)
      return b2
    }
  }
  export function array<T extends any[]>(a: any[], b: T): qt.ArrayIpolator<T>
  export function array<T extends qt.NumArray>(a: qt.NumArray | number[], b: T): (x: number) => T
  export function array(a: any, b: any) {
    return (isNumArray(b) ? numArray : anyArray)(a, b)
  }

  function isNumArray(x: any) {
    return ArrayBuffer.isView(x) && !(x instanceof DataView)
  }

  const reA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g
  const reB = new RegExp(reA.source, "g")

  function zero(x: any) {
    return () => x
  }
  function one(f: Function) {
    return (x: any) => f(x) + ""
  }
  export function date(a: Date, b: Date): (x: number) => Date {
    a = +a
    b = +b
    const d = new Date()
    return x => (d.setTime(a * (1 - x) + b * x), d)
  }
  export function number(a: number | { valueOf(): number }, b: number | { valueOf(): number }): (x: number) => number {
    a = +a
    b = +b
    return x => a * (1 - x) + b * x
  }
  export function round(a: number | { valueOf(): number }, b: number | { valueOf(): number }): (x: number) => number {
    a = +a
    b = +b
    return x => round(a * (1 - x) + b * x)
  }
  export function string(
    a: string | { toString(): string },
    b: string | { toString(): string }
  ): (x: number) => string {
    let bi = (reA.lastIndex = reB.lastIndex = 0),
      am,
      bm,
      bs,
      i = -1,
      s = [],
      q = []
    ;(a = a + ""), (b = b + "")
    while ((am = reA.exec(a)) && (bm = reB.exec(b))) {
      if ((bs = bm.index) > bi) {
        bs = b.slice(bi, bs)
        if (s[i]) s[i] += bs
        else s[++i] = bs
      }
      if ((am = am[0]) === (bm = bm[0])) {
        if (s[i]) s[i] += bm
        else s[++i] = bm
      } else {
        s[++i] = null
        q.push({ i: i, x: number(am, bm) })
      }
      bi = reB.lastIndex
    }
    if (bi < b.length) {
      bs = b.slice(bi)
      if (s[i]) s[i] += bs
      else s[++i] = bs
    }
    return s.length < 2
      ? q[0]
        ? one(q[0].x)
        : zero(b)
      : ((b = q.length),
        function (t) {
          for (let i = 0, o; i < b; ++i) s[(o = q[i]).i] = o.x(t)
          return s.join("")
        })
  }
  export function object<T extends object>(a: any, b: T): (x: number) => T {
    const i = {},
      c: T = {}
    if (a === null || typeof a !== "object") a = {}
    if (b === null || typeof b !== "object") b = {}
    for (const k in b) {
      if (k in a) {
        i[k] = value(a[k], b[k])
      } else c[k] = b[k]
    }
    return x => {
      for (const k in i) c[k] = i[k](x)
      return c
    }
  }

  export function value(a: any, b: null): (t: number) => null
  export function value(a: any, b: boolean): (t: number) => boolean
  export function value(a: string | qt.Color, b: qt.Color): (t: number) => string
  export function value(a: Date, b: Date): (t: number) => Date
  export function value(a: number | { valueOf(): number }, b: number | { valueOf(): number }): (x: number) => number
  export function value<T extends qt.NumArray>(a: qt.NumArray | number[], b: T): (t: number) => T
  export function value(a: string | { toString(): string }, b: string): (t: number) => string
  export function value<T extends any[]>(a: any[], b: T): (t: number) => T
  export function value<T extends object>(a: any, b: T): (t: number) => T
  export function value(a: any, b: any) {
    let t = typeof b,
      c
    return b === null || t === "boolean"
      ? constant(b)
      : (t === "number"
          ? number
          : t === "string"
          ? (c = color(b))
            ? ((b = c), rgb)
            : string
          : b instanceof color
          ? rgb
          : b instanceof Date
          ? date
          : isNumArray(b)
          ? numArray
          : Array.isArray(b)
          ? anyArray
          : (typeof b.valueOf !== "function" && typeof b.toString !== "function") || isNaN(b)
          ? object
          : number)(a, b)
  }

  export function piecewise(vs: qt.Zoom.View[]): qt.Zoom.Interpolator
  export function piecewise(
    f: (a: qt.Zoom.View, b: qt.Zoom.View) => qt.Zoom.Interpolator,
    vs: qt.Zoom.View[]
  ): qt.Zoom.Interpolator
  export function piecewise<T extends any[]>(vs: T[]): qt.ArrayIpolator<T>
  export function piecewise<T extends any[]>(f: (a: any[], b: T) => qt.ArrayIpolator<T>, vs: T[]): qt.ArrayIpolator<T>
  export function piecewise(vs: unknown[]): (x: number) => any
  export function piecewise<T>(f: (a: T, b: T) => unknown, vs: T[]): (x: number) => any
  export function piecewise(f: any, xs?: any) {
    if (xs === undefined) (xs = f), (f = value)
    const n = xs.length - 1
    const ys = new Array(n < 0 ? 0 : n)
    let i = 0
    let x = xs[0]
    while (i < n) ys[i] = f(x, (x = xs[++i]))
    return (x: number) => {
      const i = max(0, min(n - 1, floor((x *= n))))
      return ys[i](x - i)
    }
  }

  export const zoom: (a: qt.Zoom.View, b: qt.Zoom.View) => qt.Zoom.Interpolator = (function zoomRho(rho, rho2, rho4) {
    function zoom(p0, p1) {
      let ux0 = p0[0],
        uy0 = p0[1],
        w0 = p0[2],
        ux1 = p1[0],
        uy1 = p1[1],
        w1 = p1[2],
        dx = ux1 - ux0,
        dy = uy1 - uy0,
        d2 = dx * dx + dy * dy,
        i,
        S
      if (d2 < epsilon2) {
        S = log(w1 / w0) / rho
        i = function (t) {
          return [ux0 + t * dx, uy0 + t * dy, w0 * exp(rho * t * S)]
        }
      } else {
        const d1 = sqrt(d2),
          b0 = (w1 * w1 - w0 * w0 + rho4 * d2) / (2 * w0 * rho2 * d1),
          b1 = (w1 * w1 - w0 * w0 - rho4 * d2) / (2 * w1 * rho2 * d1),
          r0 = log(sqrt(b0 * b0 + 1) - b0),
          r1 = log(sqrt(b1 * b1 + 1) - b1)
        S = (r1 - r0) / rho
        i = function (t) {
          const s = t * S,
            coshr0 = cosh(r0),
            u = (w0 / (rho2 * d1)) * (coshr0 * tanh(rho * s + r0) - sinh(r0))
          return [ux0 + u * dx, uy0 + u * dy, (w0 * coshr0) / cosh(rho * s + r0)]
        }
      }
      i.duration = (S * 1000 * rho) / SQRT2
      return i
    }
    zoom.rho = function (x: any) {
      const _1 = max(1e-3, +x),
        _2 = _1 * _1,
        _4 = _2 * _2
      return zoomRho(_1, _2, _4)
    }
    return zoom
  })(SQRT2, 2, 4)

  function transform(parse, pxComma, pxParen, degParen) {
    function pop(s) {
      return s.length ? s.pop() + " " : ""
    }
    function translate(xa, ya, xb, yb, s, q) {
      if (xa !== xb || ya !== yb) {
        const i = s.push("translate(", null, pxComma, null, pxParen)
        q.push({ i: i - 4, x: number(xa, xb) }, { i: i - 2, x: number(ya, yb) })
      } else if (xb || yb) {
        s.push("translate(" + xb + pxComma + yb + pxParen)
      }
    }
    function rotate(a, b, s, q) {
      if (a !== b) {
        if (a - b > 180) b += 360
        else if (b - a > 180) a += 360
        q.push({ i: s.push(pop(s) + "rotate(", null, degParen) - 2, x: number(a, b) })
      } else if (b) {
        s.push(pop(s) + "rotate(" + b + degParen)
      }
    }
    function skewX(a, b, s, q) {
      if (a !== b) {
        q.push({ i: s.push(pop(s) + "skewX(", null, degParen) - 2, x: number(a, b) })
      } else if (b) {
        s.push(pop(s) + "skewX(" + b + degParen)
      }
    }
    function scale(xa, ya, xb, yb, s, q) {
      if (xa !== xb || ya !== yb) {
        const i = s.push(pop(s) + "scale(", null, ",", null, ")")
        q.push({ i: i - 4, x: number(xa, xb) }, { i: i - 2, x: number(ya, yb) })
      } else if (xb !== 1 || yb !== 1) {
        s.push(pop(s) + "scale(" + xb + "," + yb + ")")
      }
    }
    return function (a, b) {
      const s = [],
        q = []
      ;(a = parse(a)), (b = parse(b))
      translate(a.translateX, a.translateY, b.translateX, b.translateY, s, q)
      rotate(a.rotate, b.rotate, s, q)
      skewX(a.skewX, b.skewX, s, q)
      scale(a.scaleX, a.scaleY, b.scaleX, b.scaleY, s, q)
      a = b = null
      return function (t) {
        let i = -1,
          n = q.length,
          o
        while (++i < n) s[(o = q[i]).i] = o.x(t)
        return s.join("")
      }
    }
  }
  export const transformCss: (a: string, b: string) => (x: number) => string = transform(
    parseCss,
    "px, ",
    "px)",
    "deg)"
  )
  export const transformSvg: (a: string, b: string) => (x: number) => string = transform(parseSvg, ", ", ")", ")")

  export const identity = {
    translateX: 0,
    translateY: 0,
    rotate: 0,
    skewX: 0,
    scaleX: 1,
    scaleY: 1,
  }
  function parseCss(x: string) {
    const m = new (typeof DOMMatrix === "function" ? DOMMatrix : WebKitCSSMatrix)(x + "")
    return m.isIdentity ? identity : decompose(m.a, m.b, m.c, m.d, m.e, m.f)
  }
  let svg: any = undefined
  function parseSvg(x: any) {
    if (x === null) return identity
    if (!svg) svg = document.createElementNS("http://www.w3.org/2000/svg", "g")
    svg.setAttribute("transform", x)
    if (!(x = svg.transform.baseVal.consolidate())) return identity
    x = x.matrix
    return decompose(x.a, x.b, x.c, x.d, x.e, x.f)
  }
  function decompose(a, b, c, d, e, f) {
    let scaleX, scaleY, skewX
    if ((scaleX = sqrt(a * a + b * b))) (a /= scaleX), (b /= scaleX)
    if ((skewX = a * c + b * d)) (c -= a * skewX), (d -= b * skewX)
    if ((scaleY = sqrt(c * c + d * d))) (c /= scaleY), (d /= scaleY), (skewX /= scaleY)
    if (a * d < b * c) (a = -a), (b = -b), (skewX = -skewX), (scaleX = -scaleX)
    return {
      translateX: e,
      translateY: f,
      rotate: atan2(b, a) * degrees,
      skewX: atan(skewX) * degrees,
      scaleX: scaleX,
      scaleY: scaleY,
    }
  }
}
