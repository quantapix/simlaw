import { interpolateZoom } from "./interpolate.js"
import { select } from "./selection.js"
import { interrupt } from "./transition.js"
import type * as qt from "./types.js"
import * as qu from "./utils.js"

export class Event<Z extends qt.Zoomed, T> {
  constructor(
    public type: "start" | "zoom" | "end" | string,
    public srcEvent: any,
    public tgt: qt.Zoom<Z, T>,
    public transform: qt.Zoom.Transform,
    public dispatch: any
  ) {}
}

export class Transform implements qt.Zoom.Transform {
  constructor(public k: number, public x: number, public y: number) {}
  apply(point: qt.Point): qt.Point {
    return [point[0] * this.k + this.x, point[1] * this.k + this.y]
  }
  applyX(x: number) {
    return x * this.k + this.x
  }
  applyY(y: number) {
    return y * this.k + this.y
  }
  invert(point: qt.Point): qt.Point {
    return [(point[0] - this.x) / this.k, (point[1] - this.y) / this.k]
  }
  invertX(x: number) {
    return (x - this.x) / this.k
  }
  invertY(y: number) {
    return (y - this.y) / this.k
  }
  rescaleX<T extends qt.Zoom.Scale>(x: T): T {
    return x.copy().domain(x.range().map(this.invertX, this).map(x.invert, x))
  }
  rescaleY<T extends qt.Zoom.Scale>(y: T): T {
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

function defaultExtent() {
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
function defaultConstrain(transform, extent, translateExtent) {
  const dx0 = transform.invertX(extent[0][0]) - translateExtent[0][0],
    dx1 = transform.invertX(extent[1][0]) - translateExtent[1][0],
    dy0 = transform.invertY(extent[0][1]) - translateExtent[0][1],
    dy1 = transform.invertY(extent[1][1]) - translateExtent[1][1]
  return transform.translate(
    dx1 > dx0 ? (dx0 + dx1) / 2 : qu.min(0, dx0) || qu.max(0, dx1),
    dy1 > dy0 ? (dy0 + dy1) / 2 : qu.min(0, dy0) || qu.max(0, dy1)
  )
}
export function zoom<B extends qt.Zoomed, T>(): qt.Zoom<B, T> {
  const scaleExtent = [0, Infinity],
    translateExtent = [
      [-Infinity, -Infinity],
      [Infinity, Infinity],
    ],
    listeners = qu.dispatch("start", "zoom", "end")
  let filter = e => (!e.ctrlKey || e.type === "wheel") && !e.button,
    extent = defaultExtent,
    constrain = defaultConstrain,
    wheelDelta = e => -e.deltaY * (e.deltaMode === 1 ? 0.05 : e.deltaMode ? 1 : 0.002) * (e.ctrlKey ? 10 : 1),
    touchable = function (this: any) {
      return navigator.maxTouchPoints || "ontouchstart" in this
    },
    duration = 250,
    interpolate = interpolateZoom,
    touchstarting,
    touchfirst,
    touchending,
    touchDelay = 500,
    wheelDelay = 150,
    clickDistance2 = 0,
    tapDistance = 10
  function f(selection) {
    selection
      .property("__zoom", function (this: any) {
        return this.__zoom || identity
      })
      .on("wheel.zoom", wheeled, { passive: false })
      .on("mousedown.zoom", mousedowned)
      .on("dblclick.zoom", dblclicked)
      .filter(touchable)
      .on("touchstart.zoom", touchstarted)
      .on("touchmove.zoom", touchmoved)
      .on("touchend.zoom touchcancel.zoom", touchended)
      .style("-webkit-tap-highlight-color", "rgba(0,0,0,0)")
  }
  f.transform = (collection, transform, point, event) => {
    const selection = collection.selection ? collection.selection() : collection
    selection.property("__zoom", defaultTransform)
    if (collection !== selection) {
      schedule(collection, transform, point, event)
    } else {
      selection.interrupt().each(function (this: any, ...xs: any) {
        gesture(this, xs)
          .event(event)
          .start()
          .zoom(null, typeof transform === "function" ? transform(xs) : transform)
          .end()
      })
    }
  }
  f.scaleBy = (selection, k, p, event) =>
    f.scaleTo(
      selection,
      function (this: any, ...xs: any) {
        return this.__zoom.k * (typeof k === "function" ? k(xs) : k)
      },
      p,
      event
    )
  f.scaleTo = (selection, k, p, event) =>
    f.transform(
      selection,
      function (this: any, ...xs: any) {
        const e = extent(xs),
          t0 = this.__zoom,
          p0 = p === null ? centroid(e) : typeof p === "function" ? p(xs) : p,
          p1 = t0.invert(p0),
          k1 = typeof k === "function" ? k(xs) : k
        return constrain(translate(scale(t0, k1), p0, p1), e, translateExtent)
      },
      p,
      event
    )
  f.translateBy = (selection, x, y, event) =>
    f.transform(
      selection,
      function (this: any, ...xs: any) {
        return constrain(
          this.__zoom.translate(typeof x === "function" ? x(xs) : x, typeof y === "function" ? y(xs) : y),
          extent(xs),
          translateExtent
        )
      },
      null,
      event
    )
  f.translateTo = (selection, x, y, p, event) => {
    f.transform(
      selection,
      function (this: any, ...xs: any) {
        const e = extent(xs),
          t = this.__zoom,
          p0 = p === null ? centroid(e) : typeof p === "function" ? p(xs) : p
        return constrain(
          identity
            .translate(p0[0], p0[1])
            .scale(t.k)
            .translate(typeof x === "function" ? -x(xs) : -x, typeof y === "function" ? -y(xs) : -y),
          e,
          translateExtent
        )
      },
      p,
      event
    )
  }
  function scale(transform, k) {
    k = qu.max(scaleExtent[0], qu.min(scaleExtent[1], k))
    return k === transform.k ? transform : new Transform(k, transform.x, transform.y)
  }
  function translate(transform, p0, p1) {
    const x = p0[0] - p1[0] * transform.k,
      y = p0[1] - p1[1] * transform.k
    return x === transform.x && y === transform.y ? transform : new Transform(transform.k, x, y)
  }
  function centroid(extent) {
    return [(+extent[0][0] + +extent[1][0]) / 2, (+extent[0][1] + +extent[1][1]) / 2]
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
          e = extent.apply(that, args),
          p = point === null ? centroid(e) : typeof point === "function" ? point.apply(that, args) : point,
          w = qu.max(e[1][0] - e[0][0], e[1][1] - e[0][1]),
          a = that.__zoom,
          b = typeof transform === "function" ? transform.apply(that, args) : transform,
          i = interpolate(a.invert(p).concat(w / a.k), b.invert(p).concat(w / b.k))
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
      this.extent = extent.apply(that, args)
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
      listeners.call(type, this.that, new Event(type, this.sourceEvent, f, this.that.__zoom, listeners), d)
    }
  }
  function wheeled(event, ...xs: any) {
    if (!filter(event, xs)) return
    const g = gesture(this, xs).event(event),
      t = this.__zoom,
      k = qu.max(scaleExtent[0], qu.min(scaleExtent[1], t.k * qu.pow(2, wheelDelta(xs)))),
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
    g.wheel = setTimeout(wheelidled, wheelDelay)
    g.zoom("mouse", constrain(translate(scale(t, k), g.mouse[0], g.mouse[1]), g.extent, translateExtent))
    function wheelidled() {
      g.wheel = null
      g.end()
    }
  }
  function mousedowned(event, ...args) {
    if (touchending || !filter(arguments)) return
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
        g.moved = dx * dx + dy * dy > clickDistance2
      }
      g.event(event).zoom(
        "mouse",
        constrain(
          translate(g.that.__zoom, (g.mouse[0] = qu.pointer(event, currentTarget)), g.mouse[1]),
          g.extent,
          translateExtent
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
    if (!filter(arguments)) return
    const t0 = this.__zoom,
      p0 = qu.pointer(event.changedTouches ? event.changedTouches[0] : event, this),
      p1 = t0.invert(p0),
      k1 = t0.k * (event.shiftKey ? 0.5 : 2),
      t1 = constrain(translate(scale(t0, k1), p0, p1), extent(xs), translateExtent)
    qu.noevent(event)
    if (duration > 0) select(this).transition().duration(duration).call(schedule, t1, p0, event)
    else select(this).call(f.transform, t1, p0, event)
  }
  function touchstarted(event, ...xs: any) {
    if (!filter(arguments)) return
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
      if (!g.touch0) (g.touch0 = p), (started = true), (g.taps = 1 + !!touchstarting)
      else if (!g.touch1 && g.touch0[2] !== p[2]) (g.touch1 = p), (g.taps = 0)
    }
    if (touchstarting) touchstarting = clearTimeout(touchstarting)
    if (started) {
      if (g.taps < 2)
        (touchfirst = p[0]),
          (touchstarting = setTimeout(function () {
            touchstarting = null
          }, touchDelay))
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
      var p0 = g.touch0[0],
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
    g.zoom("touch", constrain(translate(t, p, l), g.extent, translateExtent))
  }
  function touchended(event, ...args) {
    if (!this.__zooming) return
    let g = gesture(this, args).event(event),
      touches = event.changedTouches,
      n = touches.length,
      i,
      t
    qu.nopropagation(event)
    if (touchending) clearTimeout(touchending)
    touchending = setTimeout(function () {
      touchending = null
    }, touchDelay)
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
        if (qu.hypot(touchfirst[0] - t[0], touchfirst[1] - t[1]) < tapDistance) {
          const p = select(this).on("dblclick.zoom")
          if (p) p(arguments)
        }
      }
    }
  }
  f.wheelDelta = (x: any) =>
    x === undefined ? wheelDelta : ((wheelDelta = typeof x === "function" ? x : qu.constant(+x)), f)
  f.filter = (x: any) => (x === undefined ? filter : ((filter = typeof x === "function" ? x : qu.constant(!!x)), f))
  f.touchable = (x: any) =>
    x === undefined ? touchable : ((touchable = typeof x === "function" ? x : qu.constant(!!x)), f)
  f.extent = function (x: any) {
    return x === undefined
      ? extent
      : ((extent =
          typeof x === "function"
            ? x
            : qu.constant([
                [+x[0][0], +x[0][1]],
                [+x[1][0], +x[1][1]],
              ])),
        f)
  }
  f.scaleExtent = (x: any) =>
    x === undefined ? [scaleExtent[0], scaleExtent[1]] : ((scaleExtent[0] = +x[0]), (scaleExtent[1] = +x[1]), f)
  f.translateExtent = (x: any) =>
    x === undefined
      ? [
          [translateExtent[0][0], translateExtent[0][1]],
          [translateExtent[1][0], translateExtent[1][1]],
        ]
      : ((translateExtent[0][0] = +x[0][0]),
        (translateExtent[1][0] = +x[1][0]),
        (translateExtent[0][1] = +x[0][1]),
        (translateExtent[1][1] = +x[1][1]),
        f)
  f.constrain = (x: any) => (x === undefined ? constrain : ((constrain = x), f))
  f.duration = (x: any) => (x === undefined ? duration : ((duration = +x), f))
  f.interpolate = (x: any) => (x === undefined ? interpolate : ((interpolate = x), f))
  f.on = (...xs: any) => {
    const y = listeners.on.apply(listeners, xs)
    return y === listeners ? f : y
  }
  f.clickDistance = (x: any) => (x === undefined ? qu.sqrt(clickDistance2) : ((clickDistance2 = (x = +x) * x), f))
  f.tapDistance = (x: any) => (x === undefined ? tapDistance : ((tapDistance = +x), f))
  return f
}
