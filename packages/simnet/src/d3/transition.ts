import type * as qt from "./types.js"

import { color } from "./color.js"
import { dispatch } from "./dispatch.js"
import { easeCubicInOut } from "./ease.js"
import { interpolateNumber, interpolateRgb, interpolateString } from "./interpolate.js"
import { interpolateTransformSvg as interpolateTransform } from "./interpolate.js"
import { namespace } from "./selection.js"
import { now } from "./timer.js"
import { Selection } from "./selection.js"
import { timer, timeout } from "./timer.js"
import { interpolate } from "./interpolate.js"

const root = [null]
export function active<B extends qt.BaseType, T, PElement extends qt.BaseType, PDatum>(
  node: B,
  name?: string
): qt.Transition<B, T, PElement, PDatum> | null {
  const schedules = node.__transition
  let schedule, i
  if (schedules) {
    name = name == null ? null : name + ""
    for (i in schedules) {
      if ((schedule = schedules[i]).state > SCHEDULED && schedule.name === name) {
        return new Transition([[node]], root, name, +i)
      }
    }
  }
  return null
}
export function interrupt(node: qt.BaseType, name?: string): void {
  const schedules = node.__transition
  let schedule,
    active,
    empty = true,
    i
  if (!schedules) return
  name = name == null ? null : name + ""
  for (i in schedules) {
    if ((schedule = schedules[i]).name !== name) {
      empty = false
      continue
    }
    active = schedule.state > STARTING && schedule.state < ENDING
    schedule.state = ENDED
    schedule.timer.stop()
    schedule.on.call(active ? "interrupt" : "cancel", node, node.__data__, schedule.index, schedule.group)
    delete schedules[i]
  }
  if (empty) delete node.__transition
}

export namespace selection {
  selection.prototype.interrupt = selection_interrupt
  selection.prototype.transition = selection_transition

  export function interrupt(name) {
    return this.each(function () {
      interrupt(this, name)
    })
  }
  const defaultTiming = {
    time: null,
    delay: 0,
    duration: 250,
    ease: easeCubicInOut,
  }
  function inherit(node, id) {
    let timing
    while (!(timing = node.__transition) || !(timing = timing[id])) {
      if (!(node = node.parentNode)) {
        throw new Error(`transition ${id} not found`)
      }
    }
    return timing
  }
  export function transition(name) {
    let id, timing
    if (name instanceof Transition) {
      ;(id = name._id), (name = name._name)
    } else {
      ;(id = newId()), ((timing = defaultTiming).time = now()), (name = name == null ? null : name + "")
    }
    for (let groups = this._groups, m = groups.length, j = 0; j < m; ++j) {
      for (let group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
        if ((node = group[i])) {
          schedule(node, name, id, i, group, timing || inherit(node, id))
        }
      }
    }
    return new Transition(groups, this._parents, name, id)
  }
}

export class Transition {
  constructor(groups, parents, name, id) {
    this._groups = groups
    this._parents = parents
    this._name = name
    this._id = id
  }
  [Symbol.iterator] = Selection.prototype[Symbol.iterator]
  attr(name, value) {
    const fullname = namespace(name),
      i = fullname === "transform" ? interpolateTransform : interpolate
    return this.attrTween(
      name,
      typeof value === "function"
        ? (fullname.local ? attrFunctionNS : attrFunction)(fullname, i, tweenValue(this, "attr." + name, value))
        : value == null
        ? (fullname.local ? attrRemoveNS : attrRemove)(fullname)
        : (fullname.local ? attrConstantNS : attrConstant)(fullname, i, value)
    )
  }
  attrTween(name, value) {
    function attrTween(name, value) {
      let t0, i0
      function tween() {
        const i = value.apply(this, arguments)
        if (i !== i0) t0 = (i0 = i) && attrInterpolate(name, i)
        return t0
      }
      tween._value = value
      return tween
    }
    let key = "attr." + name
    if (arguments.length < 2) return (key = this.tween(key)) && key._value
    if (value == null) return this.tween(key, null)
    if (typeof value !== "function") throw new Error()
    const fullname = namespace(name)
    return this.tween(key, (fullname.local ? attrTweenNS : attrTween)(fullname, value))
  }
  call = Selection.prototype.call
  delay(value) {
    const id = this._id
    return arguments.length
      ? this.each((typeof value === "function" ? delayFunction : delayConstant)(id, value))
      : get(this.node(), id).delay
  }
  duration(value) {
    const id = this._id
    return arguments.length
      ? this.each((typeof value === "function" ? durationFunction : durationConstant)(id, value))
      : get(this.node(), id).duration
  }
  each = Selection.prototype.each
  ease(value) {
    const id = this._id
    return arguments.length ? this.each(easeConstant(id, value)) : get(this.node(), id).ease
  }
  easeVarying(value) {
    function easeVarying(id, value) {
      return function () {
        const v = value.apply(this, arguments)
        if (typeof v !== "function") throw new Error()
        set(this, id).ease = v
      }
    }
    if (typeof value !== "function") throw new Error()
    return this.each(easeVarying(this._id, value))
  }
  empty = Selection.prototype.empty
  end() {
    let on0,
      on1,
      that = this,
      id = that._id,
      size = that.size()
    return new Promise(function (resolve, reject) {
      const cancel = { value: reject },
        end = {
          value: function () {
            if (--size === 0) resolve()
          },
        }
      that.each(function () {
        const schedule = set(this, id),
          on = schedule.on
        if (on !== on0) {
          on1 = (on0 = on).copy()
          on1._.cancel.push(cancel)
          on1._.interrupt.push(cancel)
          on1._.end.push(end)
        }
        schedule.on = on1
      })
      if (size === 0) resolve()
    })
  }
  filter(match) {
    if (typeof match !== "function") match = matcher(match)
    for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, subgroup = (subgroups[j] = []), node, i = 0; i < n; ++i) {
        if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
          subgroup.push(node)
        }
      }
    }
    return new Transition(subgroups, this._parents, this._name, this._id)
  }
  merge(transition) {
    if (transition._id !== this._id) throw new Error()
    for (
      var groups0 = this._groups,
        groups1 = transition._groups,
        m0 = groups0.length,
        m1 = groups1.length,
        m = Math.min(m0, m1),
        merges = new Array(m0),
        j = 0;
      j < m;
      ++j
    ) {
      for (
        var group0 = groups0[j],
          group1 = groups1[j],
          n = group0.length,
          merge = (merges[j] = new Array(n)),
          node,
          i = 0;
        i < n;
        ++i
      ) {
        if ((node = group0[i] || group1[i])) {
          merge[i] = node
        }
      }
    }
    for (; j < m0; ++j) {
      merges[j] = groups0[j]
    }
    return new Transition(merges, this._parents, this._name, this._id)
  }
  node = Selection.prototype.node
  nodes = Selection.prototype.nodes
  on(name, listener) {
    const id = this._id
    return arguments.length < 2 ? get(this.node(), id).on.on(name) : this.each(onFunction(id, name, listener))
  }
  remove() {
    return this.on("end.remove", removeFunction(this._id))
  }
  select(select) {
    const name = this._name,
      id = this._id
    if (typeof select !== "function") select = selector(select)
    for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
      for (
        var group = groups[j], n = group.length, subgroup = (subgroups[j] = new Array(n)), node, subnode, i = 0;
        i < n;
        ++i
      ) {
        if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
          if ("__data__" in node) subnode.__data__ = node.__data__
          subgroup[i] = subnode
          schedule(subgroup[i], name, id, i, subgroup, get(node, id))
        }
      }
    }
    return new Transition(subgroups, this._parents, name, id)
  }
  selectAll(select) {
    const name = this._name,
      id = this._id
    if (typeof select !== "function") select = selectorAll(select)
    for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
        if ((node = group[i])) {
          for (
            var children = select.call(node, node.__data__, i, group),
              child,
              inherit = get(node, id),
              k = 0,
              l = children.length;
            k < l;
            ++k
          ) {
            if ((child = children[k])) {
              schedule(child, name, id, k, children, inherit)
            }
          }
          subgroups.push(children)
          parents.push(node)
        }
      }
    }
    return new Transition(subgroups, parents, name, id)
  }
  selectChild = Selection.prototype.selectChild
  selectChildren = Selection.prototype.selectChildren
  selection() {
    return new Selection(this._groups, this._parents)
  }
  size = Selection.prototype.size
  style(name, value, priority) {
    const i = (name += "") === "transform" ? interpolateTransform : interpolate
    return value == null
      ? this.styleTween(name, styleNull(name, i)).on("end.style." + name, styleRemove(name))
      : typeof value === "function"
      ? this.styleTween(name, styleFunction(name, i, tweenValue(this, "style." + name, value))).each(
          styleMaybeRemove(this._id, name)
        )
      : this.styleTween(name, styleConstant(name, i, value), priority).on("end.style." + name, null)
  }
  styleTween(name, value, priority) {
    function styleTween(name, value, priority) {
      let t, i0
      function tween() {
        const i = value.apply(this, arguments)
        if (i !== i0) t = (i0 = i) && styleInterpolate(name, i, priority)
        return t
      }
      tween._value = value
      return tween
    }
    let key = "style." + (name += "")
    if (arguments.length < 2) return (key = this.tween(key)) && key._value
    if (value == null) return this.tween(key, null)
    if (typeof value !== "function") throw new Error()
    return this.tween(key, styleTween(name, value, priority == null ? "" : priority))
  }
  text(value) {
    return this.tween(
      "text",
      typeof value === "function"
        ? textFunction(tweenValue(this, "text", value))
        : textConstant(value == null ? "" : value + "")
    )
  }
  textTween(value) {
    function textTween(value) {
      let t0, i0
      function tween() {
        const i = value.apply(this, arguments)
        if (i !== i0) t0 = (i0 = i) && textInterpolate(i)
        return t0
      }
      tween._value = value
      return tween
    }
    let key = "text"
    if (arguments.length < 1) return (key = this.tween(key)) && key._value
    if (value == null) return this.tween(key, null)
    if (typeof value !== "function") throw new Error()
    return this.tween(key, textTween(value))
  }
  transition() {
    const name = this._name,
      id0 = this._id,
      id1 = newId()
    for (var groups = this._groups, m = groups.length, j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
        if ((node = group[i])) {
          const inherit = get(node, id0)
          schedule(node, name, id1, i, group, {
            time: inherit.time + inherit.delay + inherit.duration,
            delay: 0,
            duration: inherit.duration,
            ease: inherit.ease,
          })
        }
      }
    }
    return new Transition(groups, this._parents, name, id1)
  }
  tween(name, value) {
    const id = this._id
    name += ""
    if (arguments.length < 2) {
      const tween = get(this.node(), id).tween
      for (var i = 0, n = tween.length, t; i < n; ++i) {
        if ((t = tween[i]).name === name) {
          return t.value
        }
      }
      return null
    }
    return this.each((value == null ? tweenRemove : tweenFunction)(id, name, value))
  }
}

function attrRemove(name) {
  return function () {
    this.removeAttribute(name)
  }
}
function attrRemoveNS(fullname) {
  return function () {
    this.removeAttributeNS(fullname.space, fullname.local)
  }
}
function attrConstant(name, interpolate, value1) {
  let string00,
    string1 = value1 + "",
    interpolate0
  return function () {
    const string0 = this.getAttribute(name)
    return string0 === string1
      ? null
      : string0 === string00
      ? interpolate0
      : (interpolate0 = interpolate((string00 = string0), value1))
  }
}
function attrConstantNS(fullname, interpolate, value1) {
  let string00,
    string1 = value1 + "",
    interpolate0
  return function () {
    const string0 = this.getAttributeNS(fullname.space, fullname.local)
    return string0 === string1
      ? null
      : string0 === string00
      ? interpolate0
      : (interpolate0 = interpolate((string00 = string0), value1))
  }
}
function attrFunction(name, interpolate, value) {
  let string00, string10, interpolate0
  return function () {
    let string0,
      value1 = value(this),
      string1
    if (value1 == null) return void this.removeAttribute(name)
    string0 = this.getAttribute(name)
    string1 = value1 + ""
    return string0 === string1
      ? null
      : string0 === string00 && string1 === string10
      ? interpolate0
      : ((string10 = string1), (interpolate0 = interpolate((string00 = string0), value1)))
  }
}
function attrFunctionNS(fullname, interpolate, value) {
  let string00, string10, interpolate0
  return function () {
    let string0,
      value1 = value(this),
      string1
    if (value1 == null) return void this.removeAttributeNS(fullname.space, fullname.local)
    string0 = this.getAttributeNS(fullname.space, fullname.local)
    string1 = value1 + ""
    return string0 === string1
      ? null
      : string0 === string00 && string1 === string10
      ? interpolate0
      : ((string10 = string1), (interpolate0 = interpolate((string00 = string0), value1)))
  }
}
function attrInterpolate(name, i) {
  return function (t) {
    this.setAttribute(name, i.call(this, t))
  }
}
function attrInterpolateNS(fullname, i) {
  return function (t) {
    this.setAttributeNS(fullname.space, fullname.local, i.call(this, t))
  }
}
function attrTweenNS(fullname, value) {
  let t0, i0
  function tween() {
    const i = value.apply(this, arguments)
    if (i !== i0) t0 = (i0 = i) && attrInterpolateNS(fullname, i)
    return t0
  }
  tween._value = value
  return tween
}
function delayFunction(id, value) {
  return function () {
    init(this, id).delay = +value.apply(this, arguments)
  }
}
function delayConstant(id, value) {
  return (
    (value = +value),
    function () {
      init(this, id).delay = value
    }
  )
}
function durationFunction(id, value) {
  return function () {
    set(this, id).duration = +value.apply(this, arguments)
  }
}
function durationConstant(id, value) {
  return (
    (value = +value),
    function () {
      set(this, id).duration = value
    }
  )
}
function easeConstant(id, value) {
  if (typeof value !== "function") throw new Error()
  return function () {
    set(this, id).ease = value
  }
}
let id = 0
export function transition<T>(x?: string): qt.Transition<qt.BaseType, T, null, undefined>
export function transition<T>(
  x: qt.Transition<qt.BaseType, any, qt.BaseType, any>
): qt.Transition<qt.BaseType, T, null, undefined>
export function transition(x: any) {
  return selection().transition(x)
}
export function newId() {
  return ++id
}

export function interpolate(a, b) {
  let c
  return (
    typeof b === "number"
      ? interpolateNumber
      : b instanceof color
      ? interpolateRgb
      : (c = color(b))
      ? ((b = c), interpolateRgb)
      : interpolateString
  )(a, b)
}
function start(name) {
  return (name + "")
    .trim()
    .split(/^|\s+/)
    .every(function (t) {
      const i = t.indexOf(".")
      if (i >= 0) t = t.slice(0, i)
      return !t || t === "start"
    })
}
function onFunction(id, name, listener) {
  let on0,
    on1,
    sit = start(name) ? init : set
  return function () {
    const schedule = sit(this, id),
      on = schedule.on
    if (on !== on0) (on1 = (on0 = on).copy()).on(name, listener)
    schedule.on = on1
  }
}
function removeFunction(id) {
  return function () {
    const parent = this.parentNode
    for (const i in this.__transition) if (+i !== id) return
    if (parent) parent.removeChild(this)
  }
}
const emptyOn = dispatch("start", "end", "cancel", "interrupt")
const emptyTween = []
export const CREATED = 0
export const SCHEDULED = 1
export const STARTING = 2
export const STARTED = 3
export const RUNNING = 4
export const ENDING = 5
export const ENDED = 6
export function schedule(node, name, id, index, group, timing) {
  const schedules = node.__transition
  if (!schedules) node.__transition = {}
  else if (id in schedules) return
  create(node, id, {
    name: name,
    index: index,
    group: group,
    on: emptyOn,
    tween: emptyTween,
    time: timing.time,
    delay: timing.delay,
    duration: timing.duration,
    ease: timing.ease,
    timer: null,
    state: CREATED,
  })
}
export function init(node, id) {
  const schedule = get(node, id)
  if (schedule.state > CREATED) throw new Error("too late; already scheduled")
  return schedule
}
export function set(node, id) {
  const schedule = get(node, id)
  if (schedule.state > STARTED) throw new Error("too late; already running")
  return schedule
}
export function get(node, id) {
  let schedule = node.__transition
  if (!schedule || !(schedule = schedule[id])) throw new Error("transition not found")
  return schedule
}
function create(node, id, self) {
  let schedules = node.__transition,
    tween
  schedules[id] = self
  self.timer = timer(schedule, 0, self.time)
  function schedule(elapsed) {
    self.state = SCHEDULED
    self.timer.restart(start, self.delay, self.time)
    if (self.delay <= elapsed) start(elapsed - self.delay)
  }
  function start(elapsed) {
    let i, j, n, o
    if (self.state !== SCHEDULED) return stop()
    for (i in schedules) {
      o = schedules[i]
      if (o.name !== self.name) continue
      if (o.state === STARTED) return timeout(start)
      if (o.state === RUNNING) {
        o.state = ENDED
        o.timer.stop()
        o.on.call("interrupt", node, node.__data__, o.index, o.group)
        delete schedules[i]
      } else if (+i < id) {
        o.state = ENDED
        o.timer.stop()
        o.on.call("cancel", node, node.__data__, o.index, o.group)
        delete schedules[i]
      }
    }
    timeout(function () {
      if (self.state === STARTED) {
        self.state = RUNNING
        self.timer.restart(tick, self.delay, self.time)
        tick(elapsed)
      }
    })
    self.state = STARTING
    self.on.call("start", node, node.__data__, self.index, self.group)
    if (self.state !== STARTING) return // interrupted
    self.state = STARTED
    tween = new Array((n = self.tween.length))
    for (i = 0, j = -1; i < n; ++i) {
      if ((o = self.tween[i].value.call(node, node.__data__, self.index, self.group))) {
        tween[++j] = o
      }
    }
    tween.length = j + 1
  }
  function tick(elapsed) {
    let t =
        elapsed < self.duration
          ? self.ease.call(null, elapsed / self.duration)
          : (self.timer.restart(stop), (self.state = ENDING), 1),
      i = -1,
      n = tween.length
    while (++i < n) {
      tween[i].call(node, t)
    }
    if (self.state === ENDING) {
      self.on.call("end", node, node.__data__, self.index, self.group)
      stop()
    }
  }
  function stop() {
    self.state = ENDED
    self.timer.stop()
    delete schedules[id]
    for (const i in schedules) return // eslint-disable-line no-unused-vars
    delete node.__transition
  }
}
function styleNull(name, interpolate) {
  let string00, string10, interpolate0
  return function () {
    const string0 = style(this, name),
      string1 = (this.style.removeProperty(name), style(this, name))
    return string0 === string1
      ? null
      : string0 === string00 && string1 === string10
      ? interpolate0
      : (interpolate0 = interpolate((string00 = string0), (string10 = string1)))
  }
}
function styleRemove(name) {
  return function () {
    this.style.removeProperty(name)
  }
}
function styleConstant(name, interpolate, value1) {
  let string00,
    string1 = value1 + "",
    interpolate0
  return function () {
    const string0 = style(this, name)
    return string0 === string1
      ? null
      : string0 === string00
      ? interpolate0
      : (interpolate0 = interpolate((string00 = string0), value1))
  }
}
function styleFunction(name, interpolate, value) {
  let string00, string10, interpolate0
  return function () {
    let string0 = style(this, name),
      value1 = value(this),
      string1 = value1 + ""
    if (value1 == null) string1 = value1 = (this.style.removeProperty(name), style(this, name))
    return string0 === string1
      ? null
      : string0 === string00 && string1 === string10
      ? interpolate0
      : ((string10 = string1), (interpolate0 = interpolate((string00 = string0), value1)))
  }
}
function styleMaybeRemove(id, name) {
  let on0,
    on1,
    listener0,
    key = "style." + name,
    event = "end." + key,
    remove
  return function () {
    const schedule = set(this, id),
      on = schedule.on,
      listener = schedule.value[key] == null ? remove || (remove = styleRemove(name)) : undefined
    if (on !== on0 || listener0 !== listener) (on1 = (on0 = on).copy()).on(event, (listener0 = listener))
    schedule.on = on1
  }
}
function styleInterpolate(name, i, priority) {
  return function (t) {
    this.style.setProperty(name, i.call(this, t), priority)
  }
}
function textConstant(value) {
  return function () {
    this.textContent = value
  }
}
function textFunction(value) {
  return function () {
    const value1 = value(this)
    this.textContent = value1 == null ? "" : value1
  }
}
function textInterpolate(i) {
  return function (t) {
    this.textContent = i.call(this, t)
  }
}
function tweenRemove(id, name) {
  let tween0, tween1
  return function () {
    const schedule = set(this, id),
      tween = schedule.tween
    if (tween !== tween0) {
      tween1 = tween0 = tween
      for (let i = 0, n = tween1.length; i < n; ++i) {
        if (tween1[i].name === name) {
          tween1 = tween1.slice()
          tween1.splice(i, 1)
          break
        }
      }
    }
    schedule.tween = tween1
  }
}
function tweenFunction(id, name, value) {
  let tween0, tween1
  if (typeof value !== "function") throw new Error()
  return function () {
    const schedule = set(this, id),
      tween = schedule.tween
    if (tween !== tween0) {
      tween1 = (tween0 = tween).slice()
      for (var t = { name: name, value: value }, i = 0, n = tween1.length; i < n; ++i) {
        if (tween1[i].name === name) {
          tween1[i] = t
          break
        }
      }
      if (i === n) tween1.push(t)
    }
    schedule.tween = tween1
  }
}
export function tweenValue(transition, name, value) {
  const id = transition._id
  transition.each(function () {
    const schedule = set(this, id)
    ;(schedule.value || (schedule.value = {}))[name] = value.apply(this, arguments)
  })
  return function (node) {
    return get(node, id).value[name]
  }
}
