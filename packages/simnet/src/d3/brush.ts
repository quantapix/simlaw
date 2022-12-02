import { interpolate } from "./interpolate.js"
import { select } from "./selection.js"
import { interrupt } from "./transition.js"
import type * as qt from "./types.js"
import * as qu from "./utils.js"

const MODE_DRAG = { name: "drag" },
  MODE_SPACE = { name: "space" },
  MODE_HANDLE = { name: "handle" },
  MODE_CENTER = { name: "center" }

function number1(e) {
  return [+e[0], +e[1]]
}
function number2(e) {
  return [number1(e[0]), number1(e[1])]
}
const X = {
  name: "x",
  handles: ["w", "e"].map(type),
  input: function (x, e) {
    return x === null
      ? null
      : [
          [+x[0], e[0][1]],
          [+x[1], e[1][1]],
        ]
  },
  output: function (xy) {
    return xy && [xy[0][0], xy[1][0]]
  },
}
const Y = {
  name: "y",
  handles: ["n", "s"].map(type),
  input: function (y, e) {
    return y === null
      ? null
      : [
          [e[0][0], +y[0]],
          [e[1][0], +y[1]],
        ]
  },
  output: function (xy) {
    return xy && [xy[0][1], xy[1][1]]
  },
}
const XY = {
  name: "xy",
  handles: ["n", "w", "e", "s", "nw", "ne", "sw", "se"].map(type),
  input: function (xy) {
    return xy === null ? null : number2(xy)
  },
  output: function (xy) {
    return xy
  },
}
function type(t) {
  return { type: t }
}
function defaultExtent() {
  let svg = this.ownerSVGElement || this
  if (svg.hasAttribute("viewBox")) {
    svg = svg.viewBox.baseVal
    return [
      [svg.x, svg.y],
      [svg.x + svg.width, svg.y + svg.height],
    ]
  }
  return [
    [0, 0],
    [svg.width.baseVal.value, svg.height.baseVal.value],
  ]
}
function local(node) {
  while (!node.__brush) if (!(node = node.parentNode)) return
  return node.__brush
}
function empty(extent) {
  return extent[0][0] === extent[1][0] || extent[0][1] === extent[1][1]
}
export function brushSelection(node: SVGGElement): qt.Brush.Selection | null {
  const state = node.__brush
  return state ? state.dim.output(state.selection) : null
}
export function brushX<T>(): qt.Brush<T> {
  return brush(X)
}
export function brushY<T>(): qt.Brush<T> {
  return brush(Y)
}
export function brush<T>(): qt.Brush<T> {
  return brush(XY)
}
function brush(dim) {
  let extent = defaultExtent,
    filter = e => !e.ctrlKey && !e.button,
    touchable = function (this: any) {
      return navigator.maxTouchPoints || "ontouchstart" in this
    },
    keys = true,
    listeners = qu.dispatch("start", "brush", "end"),
    handleSize = 6,
    touchending
  function f(group) {
    const overlay = group
      .property("__brush", initialize)
      .selectAll(".overlay")
      .data([type("overlay")])
    overlay
      .enter()
      .append("rect")
      .attr("class", "overlay")
      .attr("pointer-events", "all")
      .attr("cursor", cursors.overlay)
      .merge(overlay)
      .each(function () {
        const extent = local(this).extent
        select(this)
          .attr("x", extent[0][0])
          .attr("y", extent[0][1])
          .attr("width", extent[1][0] - extent[0][0])
          .attr("height", extent[1][1] - extent[0][1])
      })
    group
      .selectAll(".selection")
      .data([type("selection")])
      .enter()
      .append("rect")
      .attr("class", "selection")
      .attr("cursor", cursors.selection)
      .attr("fill", "#777")
      .attr("fill-opacity", 0.3)
      .attr("stroke", "#fff")
      .attr("shape-rendering", "crispEdges")
    const handle = group.selectAll(".handle").data(dim.handles, function (d) {
      return d.type
    })
    handle.exit().remove()
    handle
      .enter()
      .append("rect")
      .attr("class", function (d) {
        return "handle handle--" + d.type
      })
      .attr("cursor", function (d) {
        return cursors[d.type]
      })
    group
      .each(redraw)
      .attr("fill", "none")
      .attr("pointer-events", "all")
      .on("mousedown.brush", started)
      .filter(touchable)
      .on("touchstart.brush", started)
      .on("touchmove.brush", touchmoved)
      .on("touchend.brush touchcancel.brush", touchended)
      .style("touch-action", "none")
      .style("-webkit-tap-highlight-color", "rgba(0,0,0,0)")
  }
  f.move = function (group, selection, event) {
    if (group.tween) {
      group
        .on("start.brush", function (event) {
          emitter(this, arguments).beforestart().start(event)
        })
        .on("interrupt.brush end.brush", function (event) {
          emitter(this, arguments).end(event)
        })
        .tween("brush", function () {
          const that = this,
            state = that.__brush,
            emit = emitter(that, arguments),
            selection0 = state.selection,
            selection1 = dim.input(typeof selection === "function" ? selection(arguments) : selection, state.extent),
            i = interpolate(selection0, selection1)
          function tween(t) {
            state.selection = t === 1 && selection1 === null ? null : i(t)
            redraw.call(that)
            emit.brush()
          }
          return selection0 !== null && selection1 !== null ? tween : tween(1)
        })
    } else {
      group.each(function () {
        const that = this,
          args = arguments,
          state = that.__brush,
          selection1 = dim.input(
            typeof selection === "function" ? selection.apply(that, args) : selection,
            state.extent
          ),
          emit = emitter(that, args).beforestart()
        interrupt(that)
        state.selection = selection1 === null ? null : selection1
        redraw.call(that)
        emit.start(event).brush(event).end(event)
      })
    }
  }
  f.clear = (group, event) => f.move(group, null, event)
  function redraw() {
    const group = select(this),
      selection = local(this).selection
    if (selection) {
      group
        .selectAll(".selection")
        .style("display", null)
        .attr("x", selection[0][0])
        .attr("y", selection[0][1])
        .attr("width", selection[1][0] - selection[0][0])
        .attr("height", selection[1][1] - selection[0][1])
      group
        .selectAll(".handle")
        .style("display", null)
        .attr("x", d =>
          d.type[d.type.length - 1] === "e" ? selection[1][0] - handleSize / 2 : selection[0][0] - handleSize / 2
        )
        .attr("y", d => (d.type[0] === "s" ? selection[1][1] - handleSize / 2 : selection[0][1] - handleSize / 2))
        .attr("width", d =>
          d.type === "n" || d.type === "s" ? selection[1][0] - selection[0][0] + handleSize : handleSize
        )
        .attr("height", d =>
          d.type === "e" || d.type === "w" ? selection[1][1] - selection[0][1] + handleSize : handleSize
        )
    } else {
      group
        .selectAll(".selection,.handle")
        .style("display", "none")
        .attr("x", null)
        .attr("y", null)
        .attr("width", null)
        .attr("height", null)
    }
  }
  function emitter(that, args, clean) {
    const emit = that.__brush.emitter
    return emit && (!clean || !emit.clean) ? emit : new Emitter(that, args, clean)
  }
  function started(event) {
    if (touchending && !event.touches) return
    if (!filter(arguments)) return
    let that = this,
      type = event.target.__data__.type,
      mode =
        (keys && event.metaKey ? (type = "overlay") : type) === "selection"
          ? MODE_DRAG
          : keys && event.altKey
          ? MODE_CENTER
          : MODE_HANDLE,
      signX = dim === Y ? null : signsX[type],
      signY = dim === X ? null : signsY[type],
      state = local(that),
      extent = state.extent,
      selection = state.selection,
      W = extent[0][0],
      w0,
      w1,
      N = extent[0][1],
      n0,
      n1,
      E = extent[1][0],
      e0,
      e1,
      S = extent[1][1],
      s0,
      s1,
      dx = 0,
      dy = 0,
      moving,
      shifting = signX && signY && keys && event.shiftKey,
      lockX,
      lockY,
      points = Array.from(event.touches || [event], t => {
        const i = t.identifier
        t = qu.pointer(t, that)
        t.point0 = t.slice()
        t.identifier = i
        return t
      })
    interrupt(that)
    const emit = emitter(that, arguments, true).beforestart()
    if (type === "overlay") {
      if (selection) moving = true
      const pts = [points[0], points[1] || points[0]]
      state.selection = selection = [
        [(w0 = dim === Y ? W : qu.min(pts[0][0], pts[1][0])), (n0 = dim === X ? N : qu.min(pts[0][1], pts[1][1]))],
        [(e0 = dim === Y ? E : qu.max(pts[0][0], pts[1][0])), (s0 = dim === X ? S : qu.max(pts[0][1], pts[1][1]))],
      ]
      if (points.length > 1) move(event)
    } else {
      w0 = selection[0][0]
      n0 = selection[0][1]
      e0 = selection[1][0]
      s0 = selection[1][1]
    }
    w1 = w0
    n1 = n0
    e1 = e0
    s1 = s0
    const group = select(that).attr("pointer-events", "none")
    const overlay = group.selectAll(".overlay").attr("cursor", cursors[type])
    if (event.touches) {
      emit.moved = moved
      emit.ended = ended
    } else {
      var view = select(event.view).on("mousemove.brush", moved, true).on("mouseup.brush", ended, true)
      if (keys) view.on("keydown.brush", keydowned, true).on("keyup.brush", keyupped, true)
      qu.drag.disable(event.view)
    }
    redraw.call(that)
    emit.start(event, mode.name)
    function moved(event) {
      for (const p of event.changedTouches || [event]) {
        for (const d of points) if (d.identifier === p.identifier) d.cur = qu.pointer(p, that)
      }
      if (shifting && !lockX && !lockY && points.length === 1) {
        const point = points[0]
        if (qu.abs(point.cur[0] - point[0]) > qu.abs(point.cur[1] - point[1])) lockY = true
        else lockX = true
      }
      for (const point of points) if (point.cur) (point[0] = point.cur[0]), (point[1] = point.cur[1])
      moving = true
      noevent(event)
      move(event)
    }
    function move(event) {
      const point = points[0],
        point0 = point.point0
      let t
      dx = point[0] - point0[0]
      dy = point[1] - point0[1]
      switch (mode) {
        case MODE_SPACE:
        case MODE_DRAG: {
          if (signX) (dx = qu.max(W - w0, qu.min(E - e0, dx))), (w1 = w0 + dx), (e1 = e0 + dx)
          if (signY) (dy = qu.max(N - n0, qu.min(S - s0, dy))), (n1 = n0 + dy), (s1 = s0 + dy)
          break
        }
        case MODE_HANDLE: {
          if (points[1]) {
            if (signX) (w1 = qu.max(W, qu.min(E, points[0][0]))), (e1 = qu.max(W, qu.min(E, points[1][0]))), (signX = 1)
            if (signY) (n1 = qu.max(N, qu.min(S, points[0][1]))), (s1 = qu.max(N, qu.min(S, points[1][1]))), (signY = 1)
          } else {
            if (signX < 0) (dx = qu.max(W - w0, qu.min(E - w0, dx))), (w1 = w0 + dx), (e1 = e0)
            else if (signX > 0) (dx = qu.max(W - e0, qu.min(E - e0, dx))), (w1 = w0), (e1 = e0 + dx)
            if (signY < 0) (dy = qu.max(N - n0, qu.min(S - n0, dy))), (n1 = n0 + dy), (s1 = s0)
            else if (signY > 0) (dy = qu.max(N - s0, qu.min(S - s0, dy))), (n1 = n0), (s1 = s0 + dy)
          }
          break
        }
        case MODE_CENTER: {
          if (signX) (w1 = qu.max(W, qu.min(E, w0 - dx * signX))), (e1 = qu.max(W, qu.min(E, e0 + dx * signX)))
          if (signY) (n1 = qu.max(N, qu.min(S, n0 - dy * signY))), (s1 = qu.max(N, qu.min(S, s0 + dy * signY)))
          break
        }
      }
      if (e1 < w1) {
        signX *= -1
        ;(t = w0), (w0 = e0), (e0 = t)
        ;(t = w1), (w1 = e1), (e1 = t)
        if (type in flipX) overlay.attr("cursor", cursors[(type = flipX[type])])
      }
      if (s1 < n1) {
        signY *= -1
        ;(t = n0), (n0 = s0), (s0 = t)
        ;(t = n1), (n1 = s1), (s1 = t)
        if (type in flipY) overlay.attr("cursor", cursors[(type = flipY[type])])
      }
      if (state.selection) selection = state.selection // May be set by brush.move!
      if (lockX) (w1 = selection[0][0]), (e1 = selection[1][0])
      if (lockY) (n1 = selection[0][1]), (s1 = selection[1][1])
      if (selection[0][0] !== w1 || selection[0][1] !== n1 || selection[1][0] !== e1 || selection[1][1] !== s1) {
        state.selection = [
          [w1, n1],
          [e1, s1],
        ]
        redraw.call(that)
        emit.brush(event, mode.name)
      }
    }
    function ended(event) {
      event.stopImmediatePropagation()
      if (event.touches) {
        if (event.touches.length) return
        if (touchending) clearTimeout(touchending)
        touchending = setTimeout(function () {
          touchending = null
        }, 500) // Ghost clicks are delayed!
      } else {
        qu.drag.enable(event.view, moving)
        view.on("keydown.brush keyup.brush mousemove.brush mouseup.brush", null)
      }
      group.attr("pointer-events", "all")
      overlay.attr("cursor", cursors.overlay)
      if (state.selection) selection = state.selection // May be set by brush.move (on start)!
      if (empty(selection)) (state.selection = null), redraw.call(that)
      emit.end(event, mode.name)
    }
    function keydowned(event) {
      switch (event.keyCode) {
        case 16: {
          shifting = signX && signY
          break
        }
        case 18: {
          if (mode === MODE_HANDLE) {
            if (signX) (e0 = e1 - dx * signX), (w0 = w1 + dx * signX)
            if (signY) (s0 = s1 - dy * signY), (n0 = n1 + dy * signY)
            mode = MODE_CENTER
            move(event)
          }
          break
        }
        case 32: {
          if (mode === MODE_HANDLE || mode === MODE_CENTER) {
            if (signX < 0) e0 = e1 - dx
            else if (signX > 0) w0 = w1 - dx
            if (signY < 0) s0 = s1 - dy
            else if (signY > 0) n0 = n1 - dy
            mode = MODE_SPACE
            overlay.attr("cursor", cursors.selection)
            move(event)
          }
          break
        }
        default:
          return
      }
      noevent(event)
    }
    function keyupped(event) {
      switch (event.keyCode) {
        case 16: {
          if (shifting) {
            lockX = lockY = shifting = false
            move(event)
          }
          break
        }
        case 18: {
          if (mode === MODE_CENTER) {
            if (signX < 0) e0 = e1
            else if (signX > 0) w0 = w1
            if (signY < 0) s0 = s1
            else if (signY > 0) n0 = n1
            mode = MODE_HANDLE
            move(event)
          }
          break
        }
        case 32: {
          if (mode === MODE_SPACE) {
            if (event.altKey) {
              if (signX) (e0 = e1 - dx * signX), (w0 = w1 + dx * signX)
              if (signY) (s0 = s1 - dy * signY), (n0 = n1 + dy * signY)
              mode = MODE_CENTER
            } else {
              if (signX < 0) e0 = e1
              else if (signX > 0) w0 = w1
              if (signY < 0) s0 = s1
              else if (signY > 0) n0 = n1
              mode = MODE_HANDLE
            }
            overlay.attr("cursor", cursors[type])
            move(event)
          }
          break
        }
        default:
          return
      }
      noevent(event)
    }
  }
  function touchmoved(event) {
    emitter(this, arguments).moved(event)
  }
  function touchended(event) {
    emitter(this, arguments).ended(event)
  }
  function initialize() {
    const state = this.__brush || { selection: null }
    state.extent = number2(extent(arguments))
    state.dim = dim
    return state
  }
  f.extent = (x: any) =>
    x === undefined ? extent : ((extent = typeof x === "function" ? x : qu.constant(number2(x))), f)
  f.filter = (x: any) => (x === undefined ? filter : ((filter = typeof x === "function" ? x : qu.constant(!!x)), f))
  f.touchable = (x: any) =>
    x === undefined ? touchable : ((touchable = typeof x === "function" ? x : qu.constant(!!x)), f)
  f.handleSize = (x: any) => (x === undefined ? handleSize : ((handleSize = +x), f))
  f.keyModifiers = (x: any) => (x === undefined ? keys : ((keys = !!x), f))
  f.on = function () {
    const value = listeners.on.apply(listeners, arguments)
    return value === listeners ? f : value
  }
  return f
}
export function noevent(event) {
  event.preventDefault()
  event.stopImmediatePropagation()
}

export class Event<T> {
  constructor(
    public type: "start" | "brush" | "end" | string,
    public srcEvent: any,
    public tgt: qt.Brush<T>,
    public selection: qt.Brush.Selection | null,
    public mode: "drag" | "space" | "handle" | "center",
    public dispatch: any
  ) {}
}

class Emitter {
  active = 0
  state
  starting = false
  constructor(public that, public args, public clean) {
    this.state = that.__brush
  }
  beforestart() {
    if (++this.active === 1) (this.state.emitter = this), (this.starting = true)
    return this
  }
  start(e, mode) {
    if (this.starting) (this.starting = false), this.emit("start", e, mode)
    else this.emit("brush", e)
    return this
  }
  brush(e, mode) {
    this.emit("brush", e, mode)
    return this
  }
  end(e, mode) {
    if (--this.active === 0) delete this.state.emitter, this.emit("end", e, mode)
    return this
  }
  emit(type, e, mode?) {
    const d = select(this.that).datum()
    listeners.call(type, this.that, new Event(type, e, brush, dim.output(this.state.selection), mode, listeners), d)
  }
}

const cursors = {
  overlay: "crosshair",
  selection: "move",
  n: "ns-resize",
  e: "ew-resize",
  s: "ns-resize",
  w: "ew-resize",
  nw: "nwse-resize",
  ne: "nesw-resize",
  se: "nwse-resize",
  sw: "nesw-resize",
}
const flipX = {
  e: "w",
  w: "e",
  nw: "ne",
  ne: "nw",
  se: "sw",
  sw: "se",
}
const flipY = {
  n: "s",
  s: "n",
  nw: "sw",
  ne: "se",
  se: "ne",
  sw: "nw",
}
const signsX = {
  overlay: +1,
  selection: +1,
  n: null,
  e: +1,
  s: null,
  w: -1,
  nw: -1,
  ne: +1,
  se: +1,
  sw: -1,
}
const signsY = {
  overlay: +1,
  selection: +1,
  n: -1,
  e: null,
  s: +1,
  w: null,
  nw: -1,
  ne: -1,
  se: +1,
  sw: +1,
}
