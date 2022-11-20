import { select, pointer } from "./selection.js"
import type * as qt from "./types.js"
import * as qu from "./utils.js"

function defaultFilter(event) {
  return !event.ctrlKey && !event.button
}
function defaultContainer() {
  return this.parentNode
}
function defaultSubject(event, d) {
  return d == null ? { x: event.x, y: event.y } : d
}
function defaultTouchable() {
  return navigator.maxTouchPoints || "ontouchstart" in this
}
export function drag<B extends qt.DraggedBase, T>(): qt.DragBehavior<B, T, T | qt.SubjectPosition>
export function drag<B extends qt.DraggedBase, T, U>(): qt.DragBehavior<B, T, U>
export function drag() {
  let filter = defaultFilter,
    container = defaultContainer,
    subject = defaultSubject,
    touchable = defaultTouchable,
    gestures = {},
    listeners = qu.dispatch("start", "drag", "end"),
    active = 0,
    mousedownx,
    mousedowny,
    mousemoving,
    touchending,
    clickDistance2 = 0
  function drag(selection) {
    selection
      .on("mousedown.drag", mousedowned)
      .filter(touchable)
      .on("touchstart.drag", touchstarted)
      .on("touchmove.drag", touchmoved, nonpassive)
      .on("touchend.drag touchcancel.drag", touchended)
      .style("touch-action", "none")
      .style("-webkit-tap-highlight-color", "rgba(0,0,0,0)")
  }
  function mousedowned(event, d) {
    if (touchending || !filter.call(this, event, d)) return
    let gesture = beforestart(this, container.call(this, event, d), event, d, "mouse")
    if (!gesture) return
    select(event.view)
      .on("mousemove.drag", mousemoved, nonpassivecapture)
      .on("mouseup.drag", mouseupped, nonpassivecapture)
    nodrag(event.view)
    nopropagation(event)
    mousemoving = false
    mousedownx = event.clientX
    mousedowny = event.clientY
    gesture("start", event)
  }
  function mousemoved(event) {
    noevent(event)
    if (!mousemoving) {
      let dx = event.clientX - mousedownx,
        dy = event.clientY - mousedowny
      mousemoving = dx * dx + dy * dy > clickDistance2
    }
    gestures.mouse("drag", event)
  }
  function mouseupped(event) {
    select(event.view).on("mousemove.drag mouseup.drag", null)
    yesdrag(event.view, mousemoving)
    noevent(event)
    gestures.mouse("end", event)
  }
  function touchstarted(event, d) {
    if (!filter.call(this, event, d)) return
    let touches = event.changedTouches,
      c = container.call(this, event, d),
      n = touches.length,
      i,
      gesture
    for (i = 0; i < n; ++i) {
      if ((gesture = beforestart(this, c, event, d, touches[i].identifier, touches[i]))) {
        nopropagation(event)
        gesture("start", event, touches[i])
      }
    }
  }
  function touchmoved(event) {
    let touches = event.changedTouches,
      n = touches.length,
      i,
      gesture
    for (i = 0; i < n; ++i) {
      if ((gesture = gestures[touches[i].identifier])) {
        noevent(event)
        gesture("drag", event, touches[i])
      }
    }
  }
  function touchended(event) {
    let touches = event.changedTouches,
      n = touches.length,
      i,
      gesture
    if (touchending) clearTimeout(touchending)
    touchending = setTimeout(function () {
      touchending = null
    }, 500) // Ghost clicks are delayed!
    for (i = 0; i < n; ++i) {
      if ((gesture = gestures[touches[i].identifier])) {
        nopropagation(event)
        gesture("end", event, touches[i])
      }
    }
  }
  function beforestart(that, container, event, d, identifier, touch) {
    let dispatch = listeners.copy(),
      p = pointer(touch || event, container),
      dx,
      dy,
      s
    if (
      (s = subject.call(
        that,
        new DragEvent("beforestart", {
          sourceEvent: event,
          target: drag,
          identifier,
          active,
          x: p[0],
          y: p[1],
          dx: 0,
          dy: 0,
          dispatch,
        }),
        d
      )) == null
    )
      return
    dx = s.x - p[0] || 0
    dy = s.y - p[1] || 0
    return function gesture(type, event, touch) {
      let p0 = p,
        n
      switch (type) {
        case "start":
          ;(gestures[identifier] = gesture), (n = active++)
          break
        case "end":
          delete gestures[identifier], --active // falls through
        case "drag":
          ;(p = pointer(touch || event, container)), (n = active)
          break
      }
      dispatch.call(
        type,
        that,
        new DragEvent(type, {
          sourceEvent: event,
          subject: s,
          target: drag,
          identifier,
          active: n,
          x: p[0] + dx,
          y: p[1] + dy,
          dx: p[0] - p0[0],
          dy: p[1] - p0[1],
          dispatch,
        }),
        d
      )
    }
  }
  drag.filter = function (_) {
    return arguments.length ? ((filter = typeof _ === "function" ? _ : qu.constant(!!_)), drag) : filter
  }
  drag.container = function (_) {
    return arguments.length ? ((container = typeof _ === "function" ? _ : qu.constant(_)), drag) : container
  }
  drag.subject = function (_) {
    return arguments.length ? ((subject = typeof _ === "function" ? _ : qu.constant(_)), drag) : subject
  }
  drag.touchable = function (_) {
    return arguments.length ? ((touchable = typeof _ === "function" ? _ : qu.constant(!!_)), drag) : touchable
  }
  drag.on = function () {
    let value = listeners.on.apply(listeners, arguments)
    return value === listeners ? drag : value
  }
  drag.clickDistance = function (_) {
    return arguments.length ? ((clickDistance2 = (_ = +_) * _), drag) : Math.sqrt(clickDistance2)
  }
  return drag
}
export function DragEvent(type, { sourceEvent, subject, target, identifier, active, x, y, dx, dy, dispatch }) {
  Object.defineProperties(this, {
    type: { value: type, enumerable: true, configurable: true },
    sourceEvent: { value: sourceEvent, enumerable: true, configurable: true },
    subject: { value: subject, enumerable: true, configurable: true },
    target: { value: target, enumerable: true, configurable: true },
    identifier: { value: identifier, enumerable: true, configurable: true },
    active: { value: active, enumerable: true, configurable: true },
    x: { value: x, enumerable: true, configurable: true },
    y: { value: y, enumerable: true, configurable: true },
    dx: { value: dx, enumerable: true, configurable: true },
    dy: { value: dy, enumerable: true, configurable: true },
    _: { value: dispatch },
  })
}
DragEvent.prototype.on = function () {
  const value = this._.on.apply(this._, arguments)
  return value === this._ ? this : value
}
export function dragDisable(x: Window) {
  let root = x.document.documentElement,
    selection = select(x).on("dragstart.drag", noevent, nonpassivecapture)
  if ("onselectstart" in root) {
    selection.on("selectstart.drag", noevent, nonpassivecapture)
  } else {
    root.__noselect = root.style.MozUserSelect
    root.style.MozUserSelect = "none"
  }
}
export function dragEnable(x: Window, noclick?: boolean) {
  let root = x.document.documentElement,
    selection = select(x).on("dragstart.drag", null)
  if (noclick) {
    selection.on("click.drag", noevent, nonpassivecapture)
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
export const nonpassive = { passive: false }
export const nonpassivecapture = { capture: true, passive: false }
export function nopropagation(event) {
  event.stopImmediatePropagation()
}
export function noevent(event) {
  event.preventDefault()
  event.stopImmediatePropagation()
}
