import { interpolateTransformSvg as interpolateTransform } from "./interpolate.js"
import { namespace } from "./selection.js"
import { tweenValue } from "./tween.js"
import interpolate from "./interpolate.js"
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
  var string00,
    string1 = value1 + "",
    interpolate0
  return function () {
    var string0 = this.getAttribute(name)
    return string0 === string1
      ? null
      : string0 === string00
      ? interpolate0
      : (interpolate0 = interpolate((string00 = string0), value1))
  }
}
function attrConstantNS(fullname, interpolate, value1) {
  var string00,
    string1 = value1 + "",
    interpolate0
  return function () {
    var string0 = this.getAttributeNS(fullname.space, fullname.local)
    return string0 === string1
      ? null
      : string0 === string00
      ? interpolate0
      : (interpolate0 = interpolate((string00 = string0), value1))
  }
}
function attrFunction(name, interpolate, value) {
  var string00, string10, interpolate0
  return function () {
    var string0,
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
  var string00, string10, interpolate0
  return function () {
    var string0,
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
export function (name, value) {
  var fullname = namespace(name),
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
import { namespace } from "./selection.js"
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
  var t0, i0
  function tween() {
    var i = value.apply(this, arguments)
    if (i !== i0) t0 = (i0 = i) && attrInterpolateNS(fullname, i)
    return t0
  }
  tween._value = value
  return tween
}
function attrTween(name, value) {
  var t0, i0
  function tween() {
    var i = value.apply(this, arguments)
    if (i !== i0) t0 = (i0 = i) && attrInterpolate(name, i)
    return t0
  }
  tween._value = value
  return tween
}
export function (name, value) {
  var key = "attr." + name
  if (arguments.length < 2) return (key = this.tween(key)) && key._value
  if (value == null) return this.tween(key, null)
  if (typeof value !== "function") throw new Error()
  var fullname = namespace(name)
  return this.tween(key, (fullname.local ? attrTweenNS : attrTween)(fullname, value))
}
import { get, init } from "./schedule.js"
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
export function (value) {
  var id = this._id
  return arguments.length
    ? this.each((typeof value === "function" ? delayFunction : delayConstant)(id, value))
    : get(this.node(), id).delay
}
import { get, set } from "./schedule.js"
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
export function (value) {
  var id = this._id
  return arguments.length
    ? this.each((typeof value === "function" ? durationFunction : durationConstant)(id, value))
    : get(this.node(), id).duration
}
import { get, set } from "./schedule.js"
function easeConstant(id, value) {
  if (typeof value !== "function") throw new Error()
  return function () {
    set(this, id).ease = value
  }
}
export function (value) {
  var id = this._id
  return arguments.length ? this.each(easeConstant(id, value)) : get(this.node(), id).ease
}
import { set } from "./schedule.js"
function easeVarying(id, value) {
  return function () {
    var v = value.apply(this, arguments)
    if (typeof v !== "function") throw new Error()
    set(this, id).ease = v
  }
}
export function (value) {
  if (typeof value !== "function") throw new Error()
  return this.each(easeVarying(this._id, value))
}
import { set } from "./schedule.js"
export function () {
  var on0,
    on1,
    that = this,
    id = that._id,
    size = that.size()
  return new Promise(function (resolve, reject) {
    var cancel = { value: reject },
      end = {
        value: function () {
          if (--size === 0) resolve()
        },
      }
    that.each(function () {
      var schedule = set(this, id),
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
import { matcher } from "./selection.js"
import { Transition } from "./index.js"
export function (match) {
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
import { selection } from "./selection.js"
import transition_attr from "./attr.js"
import transition_attrTween from "./attrTween.js"
import transition_delay from "./delay.js"
import transition_duration from "./duration.js"
import transition_ease from "./ease.js"
import transition_easeVarying from "./easeVarying.js"
import transition_filter from "./filter.js"
import transition_merge from "./merge.js"
import transition_on from "./on.js"
import transition_remove from "./remove.js"
import transition_select from "./select.js"
import transition_selectAll from "./selectAll.js"
import transition_selection from "./selection.js"
import transition_style from "./style.js"
import transition_styleTween from "./styleTween.js"
import transition_text from "./text.js"
import transition_textTween from "./textTween.js"
import transition_transition from "./transition.js"
import transition_tween from "./tween.js"
import transition_end from "./end.js"
var id = 0
export function Transition(groups, parents, name, id) {
  this._groups = groups
  this._parents = parents
  this._name = name
  this._id = id
}
export function transition(name) {
  return selection().transition(name)
}
export function newId() {
  return ++id
}
var selection_prototype = selection.prototype
Transition.prototype = transition.prototype = {
  constructor: Transition,
  select: transition_select,
  selectAll: transition_selectAll,
  selectChild: selection_prototype.selectChild,
  selectChildren: selection_prototype.selectChildren,
  filter: transition_filter,
  merge: transition_merge,
  selection: transition_selection,
  transition: transition_transition,
  call: selection_prototype.call,
  nodes: selection_prototype.nodes,
  node: selection_prototype.node,
  size: selection_prototype.size,
  empty: selection_prototype.empty,
  each: selection_prototype.each,
  on: transition_on,
  attr: transition_attr,
  attrTween: transition_attrTween,
  style: transition_style,
  styleTween: transition_styleTween,
  text: transition_text,
  textTween: transition_textTween,
  remove: transition_remove,
  tween: transition_tween,
  delay: transition_delay,
  duration: transition_duration,
  ease: transition_ease,
  easeVarying: transition_easeVarying,
  end: transition_end,
  [Symbol.iterator]: selection_prototype[Symbol.iterator],
}
import { color } from "./color.js"
import { interpolateNumber, interpolateRgb, interpolateString } from "./interpolate.js"
export function (a, b) {
  var c
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
import { Transition } from "./index.js"
export function (transition) {
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
      var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = (merges[j] = new Array(n)), node, i = 0;
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
import { get, set, init } from "./schedule.js"
function start(name) {
  return (name + "")
    .trim()
    .split(/^|\s+/)
    .every(function (t) {
      var i = t.indexOf(".")
      if (i >= 0) t = t.slice(0, i)
      return !t || t === "start"
    })
}
function onFunction(id, name, listener) {
  var on0,
    on1,
    sit = start(name) ? init : set
  return function () {
    var schedule = sit(this, id),
      on = schedule.on
    if (on !== on0) (on1 = (on0 = on).copy()).on(name, listener)
    schedule.on = on1
  }
}
export function (name, listener) {
  var id = this._id
  return arguments.length < 2 ? get(this.node(), id).on.on(name) : this.each(onFunction(id, name, listener))
}
function removeFunction(id) {
  return function () {
    var parent = this.parentNode
    for (var i in this.__transition) if (+i !== id) return
    if (parent) parent.removeChild(this)
  }
}
export function () {
  return this.on("end.remove", removeFunction(this._id))
}
import { dispatch } from "./dispatch.js"
import { timer, timeout } from "./timer.js"
var emptyOn = dispatch("start", "end", "cancel", "interrupt")
var emptyTween = []
export const CREATED = 0
export const SCHEDULED = 1
export const STARTING = 2
export const STARTED = 3
export const RUNNING = 4
export const ENDING = 5
export const ENDED = 6
export function (node, name, id, index, group, timing) {
  var schedules = node.__transition
  if (!schedules) node.__transition = {}
  else if (id in schedules) return
  create(node, id, {
    name: name,
    index: index, // For context during callback.
    group: group, // For context during callback.
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
  var schedule = get(node, id)
  if (schedule.state > CREATED) throw new Error("too late; already scheduled")
  return schedule
}
export function set(node, id) {
  var schedule = get(node, id)
  if (schedule.state > STARTED) throw new Error("too late; already running")
  return schedule
}
export function get(node, id) {
  var schedule = node.__transition
  if (!schedule || !(schedule = schedule[id])) throw new Error("transition not found")
  return schedule
}
function create(node, id, self) {
  var schedules = node.__transition,
    tween
  schedules[id] = self
  self.timer = timer(schedule, 0, self.time)
  function schedule(elapsed) {
    self.state = SCHEDULED
    self.timer.restart(start, self.delay, self.time)
    if (self.delay <= elapsed) start(elapsed - self.delay)
  }
  function start(elapsed) {
    var i, j, n, o
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
    var t =
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
    for (var i in schedules) return // eslint-disable-line no-unused-vars
    delete node.__transition
  }
}
import { selector } from "./selection.js"
import { Transition } from "./index.js"
import schedule, { get } from "./schedule.js"
export function (select) {
  var name = this._name,
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
import { selectorAll } from "./selection.js"
import { Transition } from "./index.js"
import schedule, { get } from "./schedule.js"
export function (select) {
  var name = this._name,
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
import { selection } from "./selection.js"
var Selection = selection.prototype.constructor
export function () {
  return new Selection(this._groups, this._parents)
}
import { interpolateTransformCss as interpolateTransform } from "./interpolate.js"
import { style } from "./selection.js"
import { set } from "./schedule.js"
import { tweenValue } from "./tween.js"
import interpolate from "./interpolate.js"
function styleNull(name, interpolate) {
  var string00, string10, interpolate0
  return function () {
    var string0 = style(this, name),
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
  var string00,
    string1 = value1 + "",
    interpolate0
  return function () {
    var string0 = style(this, name)
    return string0 === string1
      ? null
      : string0 === string00
      ? interpolate0
      : (interpolate0 = interpolate((string00 = string0), value1))
  }
}
function styleFunction(name, interpolate, value) {
  var string00, string10, interpolate0
  return function () {
    var string0 = style(this, name),
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
  var on0,
    on1,
    listener0,
    key = "style." + name,
    event = "end." + key,
    remove
  return function () {
    var schedule = set(this, id),
      on = schedule.on,
      listener = schedule.value[key] == null ? remove || (remove = styleRemove(name)) : undefined
    if (on !== on0 || listener0 !== listener) (on1 = (on0 = on).copy()).on(event, (listener0 = listener))
    schedule.on = on1
  }
}
export function (name, value, priority) {
  var i = (name += "") === "transform" ? interpolateTransform : interpolate
  return value == null
    ? this.styleTween(name, styleNull(name, i)).on("end.style." + name, styleRemove(name))
    : typeof value === "function"
    ? this.styleTween(name, styleFunction(name, i, tweenValue(this, "style." + name, value))).each(
        styleMaybeRemove(this._id, name)
      )
    : this.styleTween(name, styleConstant(name, i, value), priority).on("end.style." + name, null)
}
function styleInterpolate(name, i, priority) {
  return function (t) {
    this.style.setProperty(name, i.call(this, t), priority)
  }
}
function styleTween(name, value, priority) {
  var t, i0
  function tween() {
    var i = value.apply(this, arguments)
    if (i !== i0) t = (i0 = i) && styleInterpolate(name, i, priority)
    return t
  }
  tween._value = value
  return tween
}
export function (name, value, priority) {
  var key = "style." + (name += "")
  if (arguments.length < 2) return (key = this.tween(key)) && key._value
  if (value == null) return this.tween(key, null)
  if (typeof value !== "function") throw new Error()
  return this.tween(key, styleTween(name, value, priority == null ? "" : priority))
}
import { tweenValue } from "./tween.js"
function textConstant(value) {
  return function () {
    this.textContent = value
  }
}
function textFunction(value) {
  return function () {
    var value1 = value(this)
    this.textContent = value1 == null ? "" : value1
  }
}
export function (value) {
  return this.tween(
    "text",
    typeof value === "function"
      ? textFunction(tweenValue(this, "text", value))
      : textConstant(value == null ? "" : value + "")
  )
}
function textInterpolate(i) {
  return function (t) {
    this.textContent = i.call(this, t)
  }
}
function textTween(value) {
  var t0, i0
  function tween() {
    var i = value.apply(this, arguments)
    if (i !== i0) t0 = (i0 = i) && textInterpolate(i)
    return t0
  }
  tween._value = value
  return tween
}
export function (value) {
  var key = "text"
  if (arguments.length < 1) return (key = this.tween(key)) && key._value
  if (value == null) return this.tween(key, null)
  if (typeof value !== "function") throw new Error()
  return this.tween(key, textTween(value))
}
import { Transition, newId } from "./index.js"
import schedule, { get } from "./schedule.js"
export function () {
  var name = this._name,
    id0 = this._id,
    id1 = newId()
  for (var groups = this._groups, m = groups.length, j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
      if ((node = group[i])) {
        var inherit = get(node, id0)
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
import { get, set } from "./schedule.js"
function tweenRemove(id, name) {
  var tween0, tween1
  return function () {
    var schedule = set(this, id),
      tween = schedule.tween
    if (tween !== tween0) {
      tween1 = tween0 = tween
      for (var i = 0, n = tween1.length; i < n; ++i) {
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
  var tween0, tween1
  if (typeof value !== "function") throw new Error()
  return function () {
    var schedule = set(this, id),
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
export function (name, value) {
  var id = this._id
  name += ""
  if (arguments.length < 2) {
    var tween = get(this.node(), id).tween
    for (var i = 0, n = tween.length, t; i < n; ++i) {
      if ((t = tween[i]).name === name) {
        return t.value
      }
    }
    return null
  }
  return this.each((value == null ? tweenRemove : tweenFunction)(id, name, value))
}
export function tweenValue(transition, name, value) {
  var id = transition._id
  transition.each(function () {
    var schedule = set(this, id)
    ;(schedule.value || (schedule.value = {}))[name] = value.apply(this, arguments)
  })
  return function (node) {
    return get(node, id).value[name]
  }
}