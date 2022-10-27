import type * as qt from "./types.js"

export function area(xs: Array<[number, number]>): number {
  const n = xs.length
  let i = -1,
    a,
    b = xs[n - 1],
    y = 0
  while (++i < n) {
    a = b
    b = xs[i]
    y += a[1] * b[0] - a[0] * b[1]
  }
  return y / 2
}

export function centroid(xs: Array<[number, number]>): [number, number] {
  const n = xs.length
  let i = -1,
    x = 0,
    y = 0,
    a,
    b = xs[n - 1],
    c,
    k = 0
  while (++i < n) {
    a = b
    b = xs[i]
    k += c = a[0] * b[1] - b[0] * a[1]
    x += (a[0] + b[0]) * c
    y += (a[1] + b[1]) * c
  }
  return (k *= 3), [x / k, y / k]
}

export function contains(xs: Array<[number, number]>, point: [number, number]): boolean {
  const n = xs.length,
    x = point[0],
    y = point[1]
  let p = xs[n - 1],
    x0 = p[0],
    y0 = p[1],
    x1,
    y1,
    inside = false
  for (let i = 0; i < n; ++i) {
    ;(p = xs[i]), (x1 = p[0]), (y1 = p[1])
    if (y1 > y !== y0 > y && x < ((x0 - x1) * (y - y1)) / (y0 - y1) + x1) inside = !inside
    ;(x0 = x1), (y0 = y1)
  }
  return inside
}

export function cross(a: [number, number], b: [number, number], c: [number, number]) {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])
}

function lexicographicOrder(a: [number, number], b: [number, number]) {
  return a[0] - b[0] || a[1] - b[1]
}

function computeUpperHullIndexes(points) {
  const n = points.length,
    indexes = [0, 1]
  let size = 2,
    i
  for (i = 2; i < n; ++i) {
    while (size > 1 && cross(points[indexes[size - 2]], points[indexes[size - 1]], points[i]) <= 0) --size
    indexes[size++] = i
  }
  return indexes.slice(0, size)
}

export function hull(xs: Array<[number, number]>): Array<[number, number]> | undefined {
  if ((n = xs.length) < 3) return undefined
  let i,
    n,
    sortedPoints = new Array(n),
    flippedPoints = new Array(n)
  for (i = 0; i < n; ++i) sortedPoints[i] = [+xs[i][0], +xs[i][1], i]
  sortedPoints.sort(lexicographicOrder)
  for (i = 0; i < n; ++i) flippedPoints[i] = [sortedPoints[i][0], -sortedPoints[i][1]]
  const upperIndexes = computeUpperHullIndexes(sortedPoints),
    lowerIndexes = computeUpperHullIndexes(flippedPoints)
  const skipLeft = lowerIndexes[0] === upperIndexes[0],
    skipRight = lowerIndexes[lowerIndexes.length - 1] === upperIndexes[upperIndexes.length - 1],
    y = []
  for (i = upperIndexes.length - 1; i >= 0; --i) y.push(xs[sortedPoints[upperIndexes[i]][2]])
  for (i = +skipLeft; i < lowerIndexes.length - skipRight; ++i) y.push(xs[sortedPoints[lowerIndexes[i]][2]])
  return y
}

export function length(xs: Array<[number, number]>): number {
  const n = xs.length
  let i = -1,
    b = xs[n - 1],
    xa,
    ya,
    xb = b[0],
    yb = b[1],
    y = 0
  while (++i < n) {
    xa = xb
    ya = yb
    b = xs[i]
    xb = b[0]
    yb = b[1]
    xa -= xb
    ya -= yb
    y += Math.hypot(xa, ya)
  }
  return y
}

const pi = Math.PI
const tau = 2 * pi
const epsilon = 1e-6
const tauEpsilon = tau - epsilon

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
      cw = 1 ^ ccw
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
    const x0 = this.x1,
      y0 = this.y1,
      x21 = x2 - x1,
      y21 = y2 - y1,
      x01 = x0 - x1,
      y01 = y0 - y1,
      l01_2 = x01 * x01 + y01 * y01
    if (r < 0) throw new Error("negative radius: " + r)
    if (this.x1 === undefined) {
      this.v += "M" + (this.x1 = x1) + "," + (this.y1 = y1)
    } else if (!(l01_2 > epsilon));
    else if (!(Math.abs(y01 * x21 - y21 * x01) > epsilon) || !r) {
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

function translateX(x) {
  return "translate(" + x + ",0)"
}
function translateY(y) {
  return "translate(0," + y + ")"
}
function number(scale) {
  return d => +scale(d)
}
function center(scale, offset) {
  offset = Math.max(0, scale.bandwidth() - offset * 2) / 2
  if (scale.round()) offset = Math.round(offset)
  return d => +scale(d) + offset
}
function entering() {
  return !this.__axis
}
function axis<T>(orient, scale: qt.AxisScale<T>) {
  let tickArguments = [],
    tickValues = null,
    tickFormat = null,
    tickSizeInner = 6,
    tickSizeOuter = 6,
    tickPadding = 3,
    offset = typeof window !== "undefined" && window.devicePixelRatio > 1 ? 0 : 0.5,
    k = orient === top || orient === left ? -1 : 1,
    x = orient === left || orient === right ? "x" : "y",
    transform = orient === top || orient === bottom ? translateX : translateY
  function axis(context) {
    let values =
        tickValues == null ? (scale.ticks ? scale.ticks.apply(scale, tickArguments) : scale.domain()) : tickValues,
      format =
        tickFormat == null ? (scale.tickFormat ? scale.tickFormat.apply(scale, tickArguments) : identity) : tickFormat,
      spacing = Math.max(tickSizeInner, 0) + tickPadding,
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
        .attr(x + "2", k * tickSizeInner)
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
        ? tickSizeOuter
          ? "M" + k * tickSizeOuter + "," + range0 + "H" + offset + "V" + range1 + "H" + k * tickSizeOuter
          : "M" + offset + "," + range0 + "V" + range1
        : tickSizeOuter
        ? "M" + range0 + "," + k * tickSizeOuter + "V" + offset + "H" + range1 + "V" + k * tickSizeOuter
        : "M" + range0 + "," + offset + "H" + range1
    )
    tick.attr("opacity", 1).attr("transform", function (d) {
      return transform(position(d) + offset)
    })
    line.attr(x + "2", k * tickSizeInner)
    text.attr(x, k * spacing).text(format)
    selection
      .filter(entering)
      .attr("fill", "none")
      .attr("font-size", 10)
      .attr("font-family", "sans-serif")
      .attr("text-anchor", orient === right ? "start" : orient === left ? "end" : "middle")
    selection.each(function () {
      this.__axis = position
    })
  }
  axis.scale = function (_) {
    return arguments.length ? ((scale = _), axis) : scale
  }
  axis.ticks = function () {
    return (tickArguments = Array.from(arguments)), axis
  }
  axis.tickArguments = function (_) {
    return arguments.length ? ((tickArguments = _ == null ? [] : Array.from(_)), axis) : tickArguments.slice()
  }
  axis.tickValues = function (_) {
    return arguments.length ? ((tickValues = _ == null ? null : Array.from(_)), axis) : tickValues && tickValues.slice()
  }
  axis.tickFormat = function (_) {
    return arguments.length ? ((tickFormat = _), axis) : tickFormat
  }
  axis.tickSize = function (_) {
    return arguments.length ? ((tickSizeInner = tickSizeOuter = +_), axis) : tickSizeInner
  }
  axis.tickSizeInner = function (_) {
    return arguments.length ? ((tickSizeInner = +_), axis) : tickSizeInner
  }
  axis.tickSizeOuter = function (_) {
    return arguments.length ? ((tickSizeOuter = +_), axis) : tickSizeOuter
  }
  axis.tickPadding = function (_) {
    return arguments.length ? ((tickPadding = +_), axis) : tickPadding
  }
  axis.offset = function (_) {
    return arguments.length ? ((offset = +_), axis) : offset
  }
  return axis
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
export function identity(x: unknown) {
  return x
}

const noop = { value: () => {} }
export function dispatch<T extends object>(...xs: string[]): Dispatch<T> {
  for (let i = 0, n = xs.length, _ = {}, t; i < n; ++i) {
    if (!(t = arguments[i] + "") || t in _ || /[\s.]/.test(t)) throw new Error("illegal type: " + t)
    _[t] = []
  }
  return new Dispatch(_)
}
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

export class Dispatch<T extends object> implements qt.Dispatch<T> {
  constructor(_) {
    this._ = _
  }
  on(typename, callback) {
    let _ = this._,
      T = parseTypenames(typename + "", _),
      t,
      i = -1,
      n = T.length
    if (arguments.length < 2) {
      while (++i < n) if ((t = (typename = T[i]).type) && (t = get(_[t], typename.name))) return t
      return
    }
    if (callback != null && typeof callback !== "function") throw new Error("invalid callback: " + callback)
    while (++i < n) {
      if ((t = (typename = T[i]).type)) _[t] = set(_[t], typename.name, callback)
      else if (callback == null) for (t in _) _[t] = set(_[t], typename.name, null)
    }
    return this
  }
  copy() {
    const copy = {},
      _ = this._
    for (const t in _) copy[t] = _[t].slice()
    return new Dispatch(copy)
  }
  call(type, that) {
    if ((n = arguments.length - 2) > 0)
      for (var args = new Array(n), i = 0, n, t; i < n; ++i) args[i] = arguments[i + 2]
    if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type)
    for (t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args)
  }
  apply(type, that, args) {
    if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type)
    for (let t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args)
  }
}
function get(type, name) {
  for (let i = 0, n = type.length, c; i < n; ++i) {
    if ((c = type[i]).name === name) {
      return c.value
    }
  }
}
function set(type, name, callback) {
  for (let i = 0, n = type.length; i < n; ++i) {
    if (type[i].name === name) {
      ;(type[i] = noop), (type = type.slice(0, i).concat(type.slice(i + 1)))
      break
    }
  }
  if (callback != null) type.push({ name: name, value: callback })
  return type
}

import type * as qt from "./types.js"

let head: any
let tail: any

export class Timer implements qt.Timer {
  _call: any = null
  _time: any = null
  _next: any = null
  restart(cb: (x: number) => void, delay?: number, time?: number) {
    if (typeof cb !== "function") throw new TypeError("callback is not a function")
    time = (time == null ? now() : +time) + (delay == null ? 0 : +delay)
    if (!this._next && tail !== this) {
      if (tail) tail._next = this
      else head = this
      tail = this
    }
    this._call = cb
    this._time = time
    sleep()
  }
  stop() {
    if (this._call) {
      this._call = null
      this._time = Infinity
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
