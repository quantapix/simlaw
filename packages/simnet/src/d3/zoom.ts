import { interpolate as qi } from "./utils.js"
import { interrupt } from "./transition.js"
import { select } from "./selection.js"
import * as qu from "./utils.js"
import type * as qt from "./types.js"

export class Event<Z extends qt.Zoomed, T> {
  constructor(
    public type: "start" | "zoom" | "end" | string,
    public src: any,
    public tgt: qt.Zoom<Z, T>,
    public trafo: qt.Zoom.Transform,
    public dispatch: any
  ) {}
}

export class Transform implements qt.Zoom.Transform {
  constructor(public k: number, public x: number, public y: number) {}
  apply(p: qt.Point): qt.Point {
    return [p[0] * this.k + this.x, p[1] * this.k + this.y]
  }
  applyX(x: number) {
    return x * this.k + this.x
  }
  applyY(y: number) {
    return y * this.k + this.y
  }
  invert(p: qt.Point): qt.Point {
    return [(p[0] - this.x) / this.k, (p[1] - this.y) / this.k]
  }
  invertX(x: number) {
    return (x - this.x) / this.k
  }
  invertY(y: number) {
    return (y - this.y) / this.k
  }
  rescaleX<T extends qt.Zoom.Scale>(x: T) {
    return x.copy().domain(x.range().map(this.invertX, this).map(x.invert, x))
  }
  rescaleY<T extends qt.Zoom.Scale>(y: T) {
    return y.copy().domain(y.range().map(this.invertY, this).map(y.invert, y))
  }
  scale(k: number) {
    return k === 1 ? this : new Transform(this.k * k, this.x, this.y)
  }
  toString() {
    return "translate(" + this.x + "," + this.y + ") scale(" + this.k + ")"
  }
  translate(x: number, y: number) {
    return x === 0 && y === 0 ? this : new Transform(this.k, this.x + this.k * x, this.y + this.k * y)
  }
}

export const identity: qt.Zoom.Transform = new Transform(1, 0, 0)

export function transform(x: qt.Zoomed): qt.Zoom.Transform {
  while (!x.__zoom) if (!(x = x.parentNode)) return identity
  return x.__zoom
}

export function zoom<B extends qt.Zoomed, T>(): qt.Zoom<B, T> {
  function defaultConstrain(x, ext, tExt) {
    const dx0 = x.invertX(ext[0][0]) - tExt[0][0],
      dx1 = x.invertX(ext[1][0]) - tExt[1][0],
      dy0 = x.invertY(ext[0][1]) - tExt[0][1],
      dy1 = x.invertY(ext[1][1]) - tExt[1][1]
    return x.translate(
      dx1 > dx0 ? (dx0 + dx1) / 2 : qu.min(0, dx0) || qu.max(0, dx1),
      dy1 > dy0 ? (dy0 + dy1) / 2 : qu.min(0, dy0) || qu.max(0, dy1)
    )
  }
  function defaultExtent(this: any) {
    let e = this
    if (e instanceof SVGElement) {
      e = e.ownerSVGElement || e
      if (e.hasAttribute("viewBox")) {
        e = e.viewBox.baseVal
        return [
          [e.x, e.y],
          [e.x + e.width, e.y + e.height],
        ]
      }
      return [
        [0, 0],
        [e.width.baseVal.value, e.height.baseVal.value],
      ]
    }
    return [
      [0, 0],
      [e.clientWidth, e.clientHeight],
    ]
  }
  function defaultTransform(this: any) {
    return this.__zoom || identity
  }
  const _sExtent: [number, number] = [0, Infinity],
    _tExtent: [[number, number], [number, number]] = [
      [-Infinity, -Infinity],
      [Infinity, Infinity],
    ],
    _listeners = qu.dispatch("start", "zoom", "end")
  let _filter = e => (!e.ctrlKey || e.type === "wheel") && !e.button,
    _extent = defaultExtent,
    _constrain = defaultConstrain,
    _delta = e => -e.deltaY * (e.deltaMode === 1 ? 0.05 : e.deltaMode ? 1 : 0.002) * (e.ctrlKey ? 10 : 1),
    _touchable = function (this: any) {
      return navigator.maxTouchPoints || "ontouchstart" in this
    },
    _duration = 250,
    _interpolate = qi.zoom,
    _start,
    _first,
    _end,
    _delay = 500,
    _wheelDelay = 150,
    _click = 0,
    _tap = 10
  function scale(t, k) {
    k = qu.max(_sExtent[0], qu.min(_sExtent[1], k))
    return k === t.k ? t : new Transform(k, t.x, t.y)
  }
  function translate(t, p0, p1) {
    const x = p0[0] - p1[0] * t.k,
      y = p0[1] - p1[1] * t.k
    return x === t.x && y === t.y ? t : new Transform(t.k, x, y)
  }
  function centroid(x) {
    return [(+x[0][0] + +x[1][0]) / 2, (+x[0][1] + +x[1][1]) / 2]
  }
  function schedule(transition, transform, point, event) {
    transition
      .on("start.zoom", function () {
        gesture(this, arguments).event(event).start()
      })
      .on("interrupt.zoom end.zoom", function () {
        gesture(this, arguments).event(event).end()
      })
      .tween("zoom", function () {
        const that = this,
          args = arguments,
          g = gesture(that, args).event(event),
          e = _extent.apply(that, args),
          p = point === null ? centroid(e) : typeof point === "function" ? point.apply(that, args) : point,
          w = qu.max(e[1][0] - e[0][0], e[1][1] - e[0][1]),
          a = that.__zoom,
          b = typeof transform === "function" ? transform.apply(that, args) : transform,
          i = _interpolate(a.invert(p).concat(w / a.k), b.invert(p).concat(w / b.k))
        return function (t) {
          if (t === 1) t = b // Avoid rounding error on end.
          else {
            const l = i(t),
              k = w / l[2]
            t = new Transform(k, p[0] - l[0] * k, p[1] - l[1] * k)
          }
          g.zoom(null, t)
        }
      })
  }
  function gesture(that, args, clean) {
    return (!clean && that.__zooming) || new Gesture(that, args)
  }
  class Gesture {
    constructor(that, args) {
      this.that = that
      this.args = args
      this.active = 0
      this.sourceEvent = null
      this.extent = _extent.apply(that, args)
      this.taps = 0
    }
    event(event) {
      if (event) this.sourceEvent = event
      return this
    }
    start() {
      if (++this.active === 1) {
        this.that.__zooming = this
        this.emit("start")
      }
      return this
    }
    zoom(key, transform) {
      if (this.mouse && key !== "mouse") this.mouse[1] = transform.invert(this.mouse[0])
      if (this.touch0 && key !== "touch") this.touch0[1] = transform.invert(this.touch0[0])
      if (this.touch1 && key !== "touch") this.touch1[1] = transform.invert(this.touch1[0])
      this.that.__zoom = transform
      this.emit("zoom")
      return this
    }
    end() {
      if (--this.active === 0) {
        delete this.that.__zooming
        this.emit("end")
      }
      return this
    }
    emit(type) {
      const d = select(this.that).datum()
      _listeners.call(type, this.that, new Event(type, this.sourceEvent, f, this.that.__zoom, _listeners), d)
    }
  }
  function wheeled(event, ...xs: any) {
    if (!_filter(event, xs)) return
    const g = gesture(this, xs).event(event),
      t = this.__zoom,
      k = qu.max(_sExtent[0], qu.min(_sExtent[1], t.k * qu.pow(2, _delta(xs)))),
      p = qu.pointer(event)
    if (g.wheel) {
      if (g.mouse[0][0] !== p[0] || g.mouse[0][1] !== p[1]) {
        g.mouse[1] = t.invert((g.mouse[0] = p))
      }
      clearTimeout(g.wheel)
    } else if (t.k === k) return
    else {
      g.mouse = [p, t.invert(p)]
      interrupt(this)
      g.start()
    }
    qu.noevent(event)
    g.wheel = setTimeout(wheelidled, _wheelDelay)
    g.zoom("mouse", _constrain(translate(scale(t, k), g.mouse[0], g.mouse[1]), g.extent, _tExtent))
    function wheelidled() {
      g.wheel = null
      g.end()
    }
  }
  function mousedowned(event, ...args) {
    if (_end || !_filter(arguments)) return
    const currentTarget = event.currentTarget,
      g = gesture(this, args, true).event(event),
      v = select(event.view).on("mousemove.zoom", mousemoved, true).on("mouseup.zoom", mouseupped, true),
      p = qu.pointer(event, currentTarget),
      x0 = event.clientX,
      y0 = event.clientY
    qu.drag.disable(event.view)
    qu.nopropagation(event)
    g.mouse = [p, this.__zoom.invert(p)]
    interrupt(this)
    g.start()
    function mousemoved(event) {
      qu.noevent(event)
      if (!g.moved) {
        const dx = event.clientX - x0,
          dy = event.clientY - y0
        g.moved = dx * dx + dy * dy > _click
      }
      g.event(event).zoom(
        "mouse",
        _constrain(
          translate(g.that.__zoom, (g.mouse[0] = qu.pointer(event, currentTarget)), g.mouse[1]),
          g.extent,
          _tExtent
        )
      )
    }
    function mouseupped(event) {
      v.on("mousemove.zoom mouseup.zoom", null)
      qu.drag.enable(event.view, g.moved)
      qu.noevent(event)
      g.event(event).end()
    }
  }
  function dblclicked(event, ...xs: any) {
    if (!_filter(arguments)) return
    const t0 = this.__zoom,
      p0 = qu.pointer(event.changedTouches ? event.changedTouches[0] : event, this),
      p1 = t0.invert(p0),
      k1 = t0.k * (event.shiftKey ? 0.5 : 2),
      t1 = _constrain(translate(scale(t0, k1), p0, p1), _extent(xs), _tExtent)
    qu.noevent(event)
    if (_duration > 0) select(this).transition().duration(_duration).call(schedule, t1, p0, event)
    else select(this).call(f.transform, t1, p0, event)
  }
  function touchstarted(event, ...xs: any) {
    if (!_filter(arguments)) return
    let touches = event.touches,
      n = touches.length,
      g = gesture(this, xs, event.changedTouches.length === n).event(event),
      started,
      i,
      t,
      p
    qu.nopropagation(event)
    for (i = 0; i < n; ++i) {
      ;(t = touches[i]), (p = qu.pointer(t, this))
      p = [p, this.__zoom.invert(p), t.identifier]
      if (!g.touch0) (g.touch0 = p), (started = true), (g.taps = 1 + !!_start)
      else if (!g.touch1 && g.touch0[2] !== p[2]) (g.touch1 = p), (g.taps = 0)
    }
    if (_start) _start = clearTimeout(_start)
    if (started) {
      if (g.taps < 2)
        (_first = p[0]),
          (_start = setTimeout(function () {
            _start = null
          }, _delay))
      interrupt(this)
      g.start()
    }
  }
  function touchmoved(event, ...args) {
    if (!this.__zooming) return
    let g = gesture(this, args).event(event),
      touches = event.changedTouches,
      n = touches.length,
      i,
      t,
      p,
      l
    qu.noevent(event)
    for (i = 0; i < n; ++i) {
      ;(t = touches[i]), (p = qu.pointer(t, this))
      if (g.touch0 && g.touch0[2] === t.identifier) g.touch0[0] = p
      else if (g.touch1 && g.touch1[2] === t.identifier) g.touch1[0] = p
    }
    t = g.that.__zoom
    if (g.touch1) {
      let p0 = g.touch0[0],
        l0 = g.touch0[1],
        p1 = g.touch1[0],
        l1 = g.touch1[1],
        dp = (dp = p1[0] - p0[0]) * dp + (dp = p1[1] - p0[1]) * dp,
        dl = (dl = l1[0] - l0[0]) * dl + (dl = l1[1] - l0[1]) * dl
      t = scale(t, qu.sqrt(dp / dl))
      p = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2]
      l = [(l0[0] + l1[0]) / 2, (l0[1] + l1[1]) / 2]
    } else if (g.touch0) (p = g.touch0[0]), (l = g.touch0[1])
    else return
    g.zoom("touch", _constrain(translate(t, p, l), g.extent, _tExtent))
  }
  function touchended(event, ...args) {
    if (!this.__zooming) return
    let g = gesture(this, args).event(event),
      touches = event.changedTouches,
      n = touches.length,
      i,
      t
    qu.nopropagation(event)
    if (_end) clearTimeout(_end)
    _end = setTimeout(function () {
      _end = null
    }, _delay)
    for (i = 0; i < n; ++i) {
      t = touches[i]
      if (g.touch0 && g.touch0[2] === t.identifier) delete g.touch0
      else if (g.touch1 && g.touch1[2] === t.identifier) delete g.touch1
    }
    if (g.touch1 && !g.touch0) (g.touch0 = g.touch1), delete g.touch1
    if (g.touch0) g.touch0[1] = this.__zoom.invert(g.touch0[0])
    else {
      g.end()
      if (g.taps === 2) {
        t = qu.pointer(t, this)
        if (qu.hypot(_first[0] - t[0], _first[1] - t[1]) < _tap) {
          const p = select(this).on("dblclick.zoom")
          if (p) p(arguments)
        }
      }
    }
  }
  function f(x: any, ..._: any[]) {
    x.property("__zoom", defaultTransform)
      .on("wheel.zoom", wheeled, { passive: false })
      .on("mousedown.zoom", mousedowned)
      .on("dblclick.zoom", dblclicked)
      .filter(_touchable)
      .on("touchstart.zoom", touchstarted)
      .on("touchmove.zoom", touchmoved)
      .on("touchend.zoom touchcancel.zoom", touchended)
      .style("-webkit-tap-highlight-color", "rgba(0,0,0,0)")
  }
  f.clickDistance = (x: any) => (x === undefined ? qu.sqrt(_click) : ((_click = (x = +x) * x), f))
  f.constrain = (x: any) => (x === undefined ? _constrain : ((_constrain = x), f))
  f.duration = (x: any) => (x === undefined ? _duration : ((_duration = +x), f))
  f.extent = (x: any) =>
    x === undefined
      ? _extent
      : ((_extent =
          typeof x === "function"
            ? x
            : qu.constant([
                [+x[0][0], +x[0][1]],
                [+x[1][0], +x[1][1]],
              ])),
        f)
  f.filter = (x: any) => (x === undefined ? _filter : ((_filter = typeof x === "function" ? x : qu.constant(!!x)), f))
  f.interpolate = (x: any) => (x === undefined ? _interpolate : ((_interpolate = x), f))
  f.on = (...xs: any) => {
    const y = _listeners.on.apply(_listeners, xs)
    return y === _listeners ? f : y
  }
  f.scaleBy = (s: any, k: any, p?: any, e) =>
    f.scaleTo(
      s,
      function (this: any, ...xs: any) {
        return this.__zoom.k * (typeof k === "function" ? k(xs) : k)
      },
      p,
      e
    )
  f.scaleExtent = (x: any) =>
    x === undefined ? [_sExtent[0], _sExtent[1]] : ((_sExtent[0] = +x[0]), (_sExtent[1] = +x[1]), f)
  f.scaleTo = (s: any, k: any, p?: any, e) =>
    f.transform(
      s,
      function (this: any, ...xs: any) {
        const e = _extent(xs),
          t0 = this.__zoom,
          p0 = p === null ? centroid(e) : typeof p === "function" ? p(xs) : p,
          p1 = t0.invert(p0),
          k1 = typeof k === "function" ? k(xs) : k
        return _constrain(translate(scale(t0, k1), p0, p1), e, _tExtent)
      },
      p,
      e
    )
  f.tapDistance = (x: any) => (x === undefined ? _tap : ((_tap = +x), f))
  f.touchable = (x: any) =>
    x === undefined ? _touchable : ((_touchable = typeof x === "function" ? x : qu.constant(!!x)), f)
  f.transform = (s: any, t: any, p?: any, e) => {
    const y = s.selection ? s.selection() : s
    y.property("__zoom", defaultTransform)
    if (s !== y) schedule(s, t, p, e)
    else {
      y.interrupt().each(function (this: any, ...xs: any) {
        gesture(this, xs)
          .event(e)
          .start()
          .zoom(null, typeof t === "function" ? t(xs) : t)
          .end()
      })
    }
  }
  f.translateBy = (s: any, x: any, y: any, e) =>
    f.transform(
      s,
      function (this: any, ...xs: any) {
        return _constrain(
          this.__zoom.translate(typeof x === "function" ? x(xs) : x, typeof y === "function" ? y(xs) : y),
          _extent(xs),
          _tExtent
        )
      },
      null,
      e
    )
  f.translateExtent = (x: any) =>
    x === undefined
      ? [
          [_tExtent[0][0], _tExtent[0][1]],
          [_tExtent[1][0], _tExtent[1][1]],
        ]
      : ((_tExtent[0][0] = +x[0][0]),
        (_tExtent[1][0] = +x[1][0]),
        (_tExtent[0][1] = +x[0][1]),
        (_tExtent[1][1] = +x[1][1]),
        f)
  f.translateTo = (s: any, x: any, y: any, p?: any, e) => {
    f.transform(
      s,
      function (this: any, ...xs: any) {
        const e = _extent(xs),
          t = this.__zoom,
          p0 = p === null ? centroid(e) : typeof p === "function" ? p(xs) : p
        return _constrain(
          identity
            .translate(p0[0], p0[1])
            .scale(t.k)
            .translate(typeof x === "function" ? -x(xs) : -x, typeof y === "function" ? -y(xs) : -y),
          e,
          _tExtent
        )
      },
      p,
      e
    )
  }
  f.wheelDelta = (x: any) => (x === undefined ? _delta : ((_delta = typeof x === "function" ? x : qu.constant(+x)), f))
  return f
}
