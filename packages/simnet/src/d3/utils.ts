/* eslint-disable @typescript-eslint/no-this-alias */
import type * as qt from "./types.js"

export const pi = Math.PI
export const halfPi = pi / 2
export const quarterPi = pi / 4
export const degrees = 180 / pi
export const radians = pi / 180
export const tau = 2 * pi
export const epsilon = 1e-6
export const epsilon2 = 1e-12
export const tauEpsilon = tau - epsilon

export const abs = Math.abs
export const atan = Math.atan
export const atan2 = Math.atan2
export const ceil = Math.ceil
export const cos = Math.cos
export const exp = Math.exp
export const floor = Math.floor
export const hypot = Math.hypot
export const log = Math.log
export const pow = Math.pow
export const sin = Math.sin
export const sqrt = Math.sqrt
export const tan = Math.tan

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

export const identity = <T>(x: T) => x
export const constant =
  <T>(x: T) =>
  () =>
    x

export function ascending(a?: qt.Primitive, b?: qt.Primitive) {
  return a == undefined || b == undefined ? NaN : a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN
}

export function descending(a?: qt.Primitive, b?: qt.Primitive) {
  return a == undefined || b == undefined ? NaN : b < a ? -1 : b > a ? 1 : b >= a ? 0 : NaN
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

export function cross(a: qt.Point, b: qt.Point, c: qt.Point) {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])
}

function lexOrder(a: qt.Point, b: qt.Point) {
  return a[0] - b[0] || a[1] - b[1]
}

function upperIndexes(xs: Array<qt.Point>) {
  const n = xs.length,
    r = [0, 1]
  let size = 2
  for (let i = 2; i < n; ++i) {
    while (size > 1 && cross(xs[r[size - 2]!]!, xs[r[size - 1]!]!, xs[i]!) <= 0) --size
    r[size++] = i
  }
  return r.slice(0, size)
}

export function hull(xs: Array<qt.Point>): Array<qt.Point> | undefined {
  const n = xs.length
  if (n < 3) return undefined
  const sorted = new Array(n),
    flipped = new Array(n)
  for (let i = 0; i < n; ++i) sorted[i] = [+xs[i]![0], +xs[i]![1], i]
  sorted.sort(lexOrder)
  for (let i = 0; i < n; ++i) flipped[i] = [sorted[i][0], -sorted[i][1]]
  const us = upperIndexes(sorted),
    ls = upperIndexes(flipped)
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
    const dx = r * Math.cos(a0),
      dy = r * Math.sin(a0),
      x0 = x + dx,
      y0 = y + dy,
      cw = !ccw
    let da = ccw ? a0 - a1 : a1 - a0
    if (r < 0) throw new Error("negative radius: " + r)
    if (this.x1 === undefined) {
      this.v += "M" + x0 + "," + y0
    } else if (Math.abs(this.x1 - x0) > epsilon || Math.abs(this.y1! - y0) > epsilon) {
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
        +(da >= pi) +
        "," +
        cw +
        "," +
        (this.x1 = x + r * Math.cos(a1)) +
        "," +
        (this.y1 = y + r * Math.sin(a1))
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
    } else if (!(Math.abs(y01 * x21 - y21 * x01) > epsilon) || !r) {
      this.v += "L" + (this.x1 = x1) + "," + (this.y1 = y1)
    } else {
      const x20 = x2 - x0,
        y20 = y2 - y0,
        l21_2 = x21 * x21 + y21 * y21,
        l20_2 = x20 * x20 + y20 * y20,
        l21 = Math.sqrt(l21_2),
        l01 = Math.sqrt(l01_2),
        l = r * Math.tan((pi - Math.acos((l21_2 + l01_2 - l20_2) / (2 * l21 * l01))) / 2),
        t01 = l / l01,
        t21 = l / l21
      if (Math.abs(t01 - 1) > epsilon) {
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
  bezierTo(x1: number, y1: number, x2: number, y2: number, x: number, y: number) {
    this.v += "C" + +x1 + "," + +y1 + "," + +x2 + "," + +y2 + "," + (this.x1 = +x) + "," + (this.y1 = +y)
  }
  close() {
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
  quadraticTo(x1: number, y1: number, x: number, y: number) {
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
  offset = Math.max(0, scale.bandwidth() - offset * 2) / 2
  if (scale.round()) offset = Math.round(offset)
  return x => +scale(x) + offset
}
function axis<T>(orient, scale: qt.AxisScale<T>): qt.Axis<T> {
  let args: any[] = [],
    vals: any[] | null = null,
    format: ((x: T, i: number) => string) | null = null,
    sizeInner = 6,
    sizeOuter = 6,
    padding = 3,
    offset = typeof window !== "undefined" && window.devicePixelRatio > 1 ? 0 : 0.5
  const k = orient === top || orient === left ? -1 : 1,
    x = orient === left || orient === right ? "x" : "y",
    transform = orient === top || orient === bottom ? translateX : translateY
  function f(context) {
    let values = values == null ? (scale.ticks ? scale.ticks.apply(scale, args) : scale.domain()) : values,
      format = format == null ? (scale.tickFormat ? scale.tickFormat.apply(scale, args) : identity) : format,
      spacing = Math.max(sizeInner, 0) + padding,
      range = scale.range(),
      range0 = +range[0] + offset,
      range1 = +range[range.length - 1] + offset,
      position = (scale.bandwidth ? center : number)(scale.copy(), offset),
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
          return isFinite((d = position(d))) ? transform(d + offset) : this.getAttribute("transform")
        })
      tickEnter.attr("opacity", epsilon).attr("transform", function (d) {
        var p = this.parentNode.__axis
        return transform((p && isFinite((p = p(d))) ? p : position(d)) + offset)
      })
    }
    tickExit.remove()
    path.attr(
      "d",
      orient === left || orient === right
        ? sizeOuter
          ? "M" + k * sizeOuter + "," + range0 + "H" + offset + "V" + range1 + "H" + k * sizeOuter
          : "M" + offset + "," + range0 + "V" + range1
        : sizeOuter
        ? "M" + range0 + "," + k * sizeOuter + "V" + offset + "H" + range1 + "V" + k * sizeOuter
        : "M" + range0 + "," + offset + "H" + range1
    )
    tick.attr("opacity", 1).attr("transform", function (d) {
      return transform(position(d) + offset)
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
  f.offset = function (...xs: any[]) {
    return xs.length ? ((offset = +xs[0]), f) : offset
  }
  f.scale = function (...xs: any[]) {
    return xs.length ? ((scale = xs[0]), f) : scale
  }
  f.tickArgs = function (...xs: any[]) {
    return xs.length ? ((args = xs == null ? [] : Array.from(xs)), f) : args.slice()
  }
  f.tickFormat = function (...xs: any[]) {
    return xs.length ? ((format = xs[0]), f) : format
  }
  f.tickPadding = function (...xs: any[]) {
    return xs.length ? ((padding = +xs[0]), f) : padding
  }
  f.ticks = function (...xs: any[]) {
    return (args = Array.from(xs)), f
  }
  f.tickSize = function (...xs: any[]) {
    return xs.length ? ((sizeInner = sizeOuter = +xs[0]), f) : sizeInner
  }
  f.tickSizeInner = function (...xs: any[]) {
    return xs.length ? ((sizeInner = +xs[0]), f) : sizeInner
  }
  f.tickSizeOuter = function (...xs: any[]) {
    return xs.length ? ((sizeOuter = +xs[0]), f) : sizeOuter
  }
  f.tickValues = function (...xs: any[]) {
    return xs.length ? ((vals = xs[0] == null ? null : Array.from(xs)), f) : vals && vals.slice()
  }
  return f
}
export function axisTop<T extends qt.AxisDomain>(scale: qt.AxisScale<T>): qt.Axis<T> {
  return axis(top, scale)
}
export function axisRight<T extends qt.AxisDomain>(scale: qt.AxisScale<T>): qt.Axis<T> {
  return axis(right, scale)
}
export function axisBottom<T extends qt.AxisDomain>(scale: qt.AxisScale<T>): qt.Axis<T> {
  return axis(bottom, scale)
}
export function axisLeft<T extends qt.AxisDomain>(scale: qt.AxisScale<T>): qt.Axis<T> {
  return axis(left, scale)
}

class DispatchMap<T extends object> extends Map<string, (qt.DispatchCB<T> | undefined)[]> {}

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
    const fs = this.map.get(k)
    fs?.forEach(f => f?.apply(x, xs))
  }
  call(k: string, x?: T, ...xs: any[]) {
    const fs = this.map.get(k)
    fs?.forEach(f => f?.call(x, xs))
  }
  copy() {
    const r = new DispatchMap<T>()
    for (const k in this.map) r.set(k, this.map.get(k)!)
    return new Dispatch(r)
  }
  on(types: string, f?: Function) {
    function parseTypenames(typenames, types) {
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

    let tgt = this.map,
      T = parseTypenames(types + "", tgt),
      t,
      i = -1,
      n = T.length
    if (arguments.length < 2) {
      while (++i < n) if ((t = (types = T[i]).type) && (t = get(tgt[t], types.name))) return t
      return
    }
    while (++i < n) {
      if ((t = (types = T[i]).type)) tgt[t] = set(tgt[t], types.name, f)
      else if (f == null) for (t in tgt) tgt[t] = set(tgt[t], types.name, null)
    }
    return this
  }
}

function get(xs: CB[], key: string) {
  for (const x of xs) {
    if (x.key === key) return x.cb
  }
  return
}

function set(xs: CB[], key: string, cb?: Function) {
  const n = xs.length
  for (let i = 0; i < n; ++i) {
    if (xs[i]?.key === key) {
      ;(xs[i] = { key, cb: () => {} }), (xs = xs.slice(0, i).concat(xs.slice(i + 1)))
      break
    }
  }
  if (cb != undefined) xs.push({ key, cb })
  return xs
}

let head: any
let tail: any

export class Timer implements qt.Timer {
  cb?: Function | undefined
  time?: number
  next?: any
  restart(cb: (x: number) => void, delay?: number, time?: number) {
    time = (time == undefined ? now() : +time) + (delay == undefined ? 0 : +delay)
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

export function interval(cb: (x: number) => void, delay?: number, time?: number): Timer {
  let t = new Timer(),
    total = delay
  if (delay == null) return t.restart(cb, delay, time), t
  t._restart = t.restart
  t.restart = function (callback, delay, time) {
    ;(delay = +delay), (time = time == null ? now() : +time)
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
  t.restart(cb, delay, time)
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
      : function (f) {
          setTimeout(f, 17)
        }
let frame = 0,
  clockTimeout: any = 0,
  clockInterval: any = 0,
  clockLast = 0,
  clockNow = 0,
  clockSkew = 0

export function now(): number {
  return clockNow || (setFrame(clearNow), (clockNow = clock.now() + clockSkew))
}

function clearNow() {
  clockNow = 0
}

export function timer(cb: (x: number) => void, delay?: number, time?: number): Timer {
  const t = new Timer()
  t.restart(cb, delay, time)
  return t
}

export function timerFlush() {
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
