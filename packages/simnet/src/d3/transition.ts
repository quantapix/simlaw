import type * as qt from "./types.js"
import * as qu from "./utils.js"
import { color } from "./color.js"

import { interpolate, interpolateNumber, interpolateRgb, interpolateString } from "./interpolate.js"
import { transformSvg } from "./interpolate.js"
import { Base, Selection } from "./selection.js"

export function transition<T>(x?: string): qt.Transition<qt.Base, T, null, undefined>
export function transition<T>(x: qt.Transition<qt.Base, any, qt.Base, any>): qt.Transition<qt.Base, T, null, undefined>
export function transition(x: any) {
  return selection().transition(x)
}

export class Transition<S extends qt.Base, T, P extends qt.Base, U>
  extends Base<S, P>
  implements qt.Transition<S, T, P, U>
{
  constructor(groups: S[][], parents: P[], public name, public id) {
    super(groups, parents)
  }
  attr(k: string, v?: any) {
    const rem = (k: string) => () => this.removeAttribute(k)
    const remNS = (k: qt.NS) => () => this.removeAttributeNS(k.space, k.local)
    const func = (k: string, interpolate, f: Function) => {
      let v1: string | null = null,
        v2: string,
        y
      return () => {
        const x = f(this)
        if (x === null) return void this.removeAttribute(k)
        const v = x + ""
        const v0 = this.getAttribute(k)
        return v0 === v ? null : v0 === v1 && v === v2 ? y : ((v2 = v), (y = interpolate((v1 = v0), x)))
      }
    }
    const funcNS = (k: qt.NS, interpolate, f: Function) => {
      let v1: string | null = null,
        v2: string,
        y
      return () => {
        const x = f(this)
        if (x === null) return void this.removeAttributeNS(k.space, k.local)
        const v = x + ""
        const v0 = this.getAttributeNS(k.space, k.local)
        return v0 === v ? null : v0 === v1 && v === v2 ? y : ((v2 = v), (y = interpolate((v1 = v0), x)))
      }
    }
    const val = (k: string, interpolate, x: any) => {
      const v = x + ""
      let v1: string | null = null,
        y
      return () => {
        const v0 = this.getAttribute(k)
        return v0 === v ? null : v0 === v1 ? y : (y = interpolate((v1 = v0), x))
      }
    }
    const valNS = (k: qt.NS, interpolate, x: any) => {
      const v = x + ""
      let v1: string | null = null,
        y
      return () => {
        const v0 = this.getAttributeNS(k.space, k.local)
        return v0 === v ? null : v0 === v1 ? y : (y = interpolate((v1 = v0), x))
      }
    }
    const ks = qu.space(k)
    const ns = typeof ks !== "string",
      i = ks === "transform" ? transformSvg : interpolate
    if (ns)
      return this.attrTween(
        k,
        v === null
          ? remNS(ks)
          : typeof v === "function"
          ? funcNS(ks, i, this.tweenValue("attr." + k, v))
          : valNS(ks, i, v)
      )
    return this.attrTween(
      k,
      v === null ? rem(ks) : typeof v === "function" ? func(ks, i, this.tweenValue("attr." + k, v)) : val(ks, i, v)
    )
  }
  attrTween(k: string, v?: any) {
    const ipolate = (k: string, f: Function) => x => this.setAttribute(k, f.call(this, x))
    const ipolateNS = (k: qt.NS, f: Function) => x => this.setAttributeNS(k.space, k.local, f.call(this, x))
    const tween = (k: string, f: Function) => {
      let x1, x0
      const y = (...xs: any[]) => {
        const x = f.apply(this, xs)
        if (x !== x0) x1 = (x0 = x) && ipolate(k, x)
        return x1
      }
      y._value = f
      return y
    }
    const tweenNS = (k: qt.NS, f: Function) => {
      let x1, x0
      const y = (...xs: any[]) => {
        const x = f.apply(this, xs)
        if (x !== x0) x1 = (x0 = x) && ipolateNS(k, x)
        return x1
      }
      y._value = f
      return y
    }
    let key = "attr." + k
    if (v === undefined) return (key = this.tween(key)) && key._value
    if (v === null) return this.tween(key, null)
    if (typeof v !== "function") throw new Error()
    const ks = qu.space(k)
    const ns = typeof ks !== "string"
    if (ns) return this.tween(key, tweenNS(ks, v))
    return this.tween(key, tween(ks, v))
  }
  delay(x: any) {
    const id = this.id
    const func =
      (id, f: Function) =>
      (...xs: any[]) =>
        (init(this, id).delay = +f.apply(this, xs))
    const constant = (id, x) => ((x = +x), () => (init(this, id).delay = x))
    return x === undefined ? get(this.node(), id).delay : this.each((typeof x === "function" ? func : constant)(id, x))
  }
  duration(x: any) {
    const id = this.id
    const func =
      (id, f: Function) =>
      (...xs: any[]) =>
        (set(this, id).duration = +f.apply(this, xs))
    const constant = (id, x) => ((x = +x), () => (set(this, id).duration = x))
    return x === undefined
      ? get(this.node(), id).duration
      : this.each((typeof x === "function" ? func : constant)(id, x))
  }
  ease(f: Function) {
    const id = this.id
    const constant = (id, f: Function) => () => (set(this, id).ease = f)
    return f === undefined ? get(this.node(), id).ease : this.each(constant(id, f))
  }
  easeVarying(f: Function) {
    const varying = (id, f: Function) => {
      return (...xs: any[]) => {
        const v: Function = f.apply(this, xs)
        set(this, id).ease = v
      }
    }
    return this.each(varying(this.id, f))
  }
  end() {
    let on0,
      on1,
      that = this,
      id = that.id,
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
  filter(x: any): any {
    const matcher = (x: string) => () => this.matches(x)
    if (typeof x !== "function") x = matcher(x)
    const ys: S[][] = new Array(this.groups.length)
    this.groups.forEach((g, j) => {
      const y: S[] = (ys[j] = [])
      g.forEach((n, i) => {
        if (n && x.call(n, n.__data__, i, g)) y.push(n)
      })
    })
    return new Transition(ys, this.parents, this.name, this.id)
  }
  merge(x: any): any {
    if (x._id !== this.id) throw new Error()
    const gs = this.groups,
      gs2 = x.groups,
      n = gs.length,
      min = Math.min(n, gs2.length),
      ys = new Array(n)
    gs.forEach((g, j) => {
      if (j < min) {
        const g2 = gs2[j]
        const y = (ys[j] = new Array(g.length))
        g.forEach((n, i) => {
          if (n || g2[i]) y[i] = n
        })
      } else ys[j] = g
    })
    return new Transition(ys, this.parents, this.name, this.id)
  }
  on(t: string, x: any) {
    const id = this.id
    const func = (id, t: string, x: any) => {
      const start = (x: string) => {
        return (x + "")
          .trim()
          .split(/^|\s+/)
          .every(function (t) {
            const i = t.indexOf(".")
            if (i >= 0) t = t.slice(0, i)
            return !t || t === "start"
          })
      }
      const f = start(t) ? init : set
      let on0, on1
      return () => {
        const schedule = f(this, id),
          on = schedule.on
        if (on !== on0) (on1 = (on0 = on).copy()).on(t, x)
        schedule.on = on1
      }
    }
    return x === undefined ? get(this.node(), id).on.on(t) : this.each(func(id, t, x))
  }
  override remove() {
    return this.on("end.remove", id => () => {
      const parent = this.parentNode
      for (const i in this.__transition) if (+i !== id) return
      if (parent) parent.removeChild(this)
    })
  }
  select(x: any) {
    const name = this.name,
      id = this.id
    if (typeof x !== "function") x = selector(x)
    const ys = new Array(this.groups.length)
    this.groups.forEach((g, j) => {
      const y = (ys[j] = new Array(g.length))
      g.forEach((n, i) => {
        let sub
        if (n && (sub = x.call(n, n.__data__, i, g))) {
          if ("__data__" in n) sub.__data__ = n.__data__
          y[i] = sub
          schedule(y[i], name, id, i, y, get(n, id))
        }
      })
    })
    return new Transition(ys, this.parents, name, id)
  }
  selectAll(x: any) {
    const name = this.name,
      id = this.id
    if (typeof x !== "function") x = selectorAll(x)
    const subs: S[][] = [],
      parents: P[] = []
    this.groups.forEach((g, j) => {
      g.forEach((n, i) => {
        if (n) {
          const cs = x.call(n, n.__data__, i, g),
            inherit = get(n, id)
          cs.forEach((c, k) => {
            if (c) schedule(c, name, id, k, cs, inherit)
          })
          subs.push(cs)
          parents.push(n)
        }
      })
    })
    return new Transition(subs, parents, name, id)
  }
  selection() {
    return new Selection(this.groups, this.parents)
  }
  style(name, value, priority) {
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
    const rem = n => () => this.style.removeProperty(n)
    const constant = (name, interpolate, value1) => {
      let string00,
        string1 = value1 + "",
        interpolate0
      return () => {
        const string0 = style(this, name)
        return string0 === string1
          ? null
          : string0 === string00
          ? interpolate0
          : (interpolate0 = interpolate((string00 = string0), value1))
      }
    }
    const func = (name, interpolate, value) => {
      let string00, string10, interpolate0
      return () => {
        let string0 = style(this, name),
          value1 = value(this),
          string1 = value1 + ""
        if (value1 === null) string1 = value1 = (this.style.removeProperty(name), style(this, name))
        return string0 === string1
          ? null
          : string0 === string00 && string1 === string10
          ? interpolate0
          : ((string10 = string1), (interpolate0 = interpolate((string00 = string0), value1)))
      }
    }
    const maybeRem = (id, name) => {
      const key = "style." + name,
        event = "end." + key
      let on0, on1, listener0, remove
      return () => {
        const y = set(this, id),
          on = y.on,
          listener = y.value[key] === null ? remove || (remove = rem(name)) : undefined
        if (on !== on0 || listener0 !== listener) (on1 = (on0 = on).copy()).on(event, (listener0 = listener))
        y.on = on1
      }
    }
    const i = (name += "") === "transform" ? transformSvg : interpolate
    return value === null
      ? this.styleTween(name, styleNull(name, i)).on("end.style." + name, rem(name))
      : typeof value === "function"
      ? this.styleTween(name, func(name, i, this.tweenValue("style." + name, value))).each(maybeRem(this.id, name))
      : this.styleTween(name, constant(name, i, value), priority).on("end.style." + name, null)
  }
  styleTween(name, value, priority?) {
    const interpolate = (name, i, priority) => t => this.style.setProperty(name, i.call(this, t), priority)
    const tween = (name, f: Function, priority) => {
      let t, i0
      function y() {
        const i = f.apply(this, arguments)
        if (i !== i0) t = (i0 = i) && interpolate(name, i, priority)
        return t
      }
      y._value = f
      return y
    }
    let key = "style." + (name += "")
    if (arguments.length < 2) return (key = this.tween(key)) && key._value
    if (value === null) return this.tween(key, null)
    if (typeof value !== "function") throw new Error()
    return this.tween(key, tween(name, value, priority === null ? "" : priority))
  }
  text(x: any) {
    const func = (f: Function) => () => {
      const y = f(this)
      this.textContent = y === null ? "" : y
    }
    const constant = (x: string) => () => (this.textContent = x)
    return this.tween(
      "text",
      typeof x === "function" ? func(this.tweenValue("text", x)) : constant(x === null ? "" : x + "")
    )
  }
  textTween(value) {
    const interpolate = i => t => (this.textContent = i.call(this, t))
    const tween = (f: Function) => {
      let t0, i0
      const y = (...xs: any[]) => {
        const i = f.apply(this, xs)
        if (i !== i0) t0 = (i0 = i) && interpolate(i)
        return t0
      }
      y._value = f
      return y
    }
    let key = "text"
    if (arguments.length < 1) return (key = this.tween(key)) && key._value
    if (value === null) return this.tween(key, null)
    if (typeof value !== "function") throw new Error()
    return this.tween(key, tween(value))
  }
  transition() {
    const name = this.name,
      id0 = this.id,
      id1 = newId()
    this.groups.forEach(g => {
      g.forEach((n, i) => {
        if (n) {
          const inherit = get(n, id0)
          schedule(n, name, id1, i, g, {
            time: inherit.time + inherit.delay + inherit.duration,
            delay: 0,
            duration: inherit.duration,
            ease: inherit.ease,
          })
        }
      })
    })
    return new Transition(this.groups, this.parents, name, id1)
  }
  tween(name, x: any) {
    const id = this.id
    name += ""
    if (x === undefined) {
      for (const t of get(this.node(), id).tween) {
        if (t.name === name) return t.value
      }
      return null
    }
    const rem = (id, name) => {
      let t0, t2
      return () => {
        const schedule = set(this, id),
          t = schedule.tween
        if (t !== t0) {
          t2 = t0 = t
          for (let i = 0, n = t2.length; i < n; ++i) {
            if (t2[i].name === name) {
              t2 = t2.slice()
              t2.splice(i, 1)
              break
            }
          }
        }
        schedule.tween = t2
      }
    }
    const func = (id, name, value) => {
      let t0, t2
      if (typeof value !== "function") throw new Error()
      return () => {
        const schedule = set(this, id),
          tween = schedule.tween
        if (tween !== t0) {
          t2 = (t0 = tween).slice()
          const n = t2.length
          const t = { name, value }
          let i
          for (i = 0; i < n; ++i) {
            if (t2[i].name === name) {
              t2[i] = t
              break
            }
          }
          if (i === n) t2.push(t)
        }
        schedule.tween = t2
      }
    }
    return this.each((x === null ? rem : func)(id, name, x))
  }
  tweenValue(name, value) {
    const id = this._id
    this.each((...xs: any[]) => {
      const s = set(this, id)
      ;(s.value || (s.value = {}))[name] = value.apply(this, xs)
    })
    return node => get(node, id).value[name]
  }
}

let id = 0
function newId() {
  return ++id
}

function init(node, id) {
  const s = get(node, id)
  if (s.state > CREATED) throw new Error("already scheduled")
  return s
}
function set(node, id) {
  const s = get(node, id)
  if (s.state > STARTED) throw new Error("already running")
  return s
}
function get(node, id) {
  let y = node.__transition
  if (!y || !(y = y[id])) throw new Error("transition not found")
  return y
}

export function interrupt(node: qt.Base, name?: string) {
  const schedules = node.__transition
  if (schedules) {
    name = name === null ? null : name + ""
    let schedule,
      active,
      empty = true,
      i
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
}

const root = [null]
export function active<B extends qt.Base, T, PElement extends qt.Base, PDatum>(
  node: B,
  name?: string
): qt.Transition<B, T, PElement, PDatum> | null {
  const schedules = node.__transition
  let schedule, i
  if (schedules) {
    name = name === null ? null : name + ""
    for (i in schedules) {
      if ((schedule = schedules[i]).state > SCHEDULED && schedule.name === name) {
        return new Transition([[node]], root, name, +i)
      }
    }
  }
  return null
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

const emptyOn = qu.dispatch("start", "end", "cancel", "interrupt")
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
  function create(node, id, self) {
    let schedules = node.__transition,
      tween
    schedules[id] = self
    self.timer = qu.timer(schedule, 0, self.time)
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
        if (o.state === STARTED) return qu.timeout(start)
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
      qu.timeout(function () {
        if (self.state === STARTED) {
          self.state = RUNNING
          self.timer.restart(tick, self.delay, self.time)
          tick(elapsed)
        }
      })
      self.state = STARTING
      self.on.call("start", node, node.__data__, self.index, self.group)
      if (self.state !== STARTING) return
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

export namespace ease {
  const overshoot = 1.70158
  export const backIn: qt.BackEasing = (function custom(s) {
    s = +s
    function y(x: number) {
      return (x = +x) * x * (s * (x - 1) + x)
    }
    y.overshoot = custom
    return y
  })(overshoot)
  export const backOut: qt.BackEasing = (function custom(s) {
    s = +s
    function y(x: number) {
      return --x * x * ((x + 1) * s + x) + 1
    }
    y.overshoot = custom
    return y
  })(overshoot)
  export const back: qt.BackEasing = (function custom(s) {
    s = +s
    function y(x: number) {
      return ((x *= 2) < 1 ? x * x * ((s + 1) * x - s) : (x -= 2) * x * ((s + 1) * x + s) + 2) / 2
    }
    y.overshoot = custom
    return y
  })(overshoot)

  const b1 = 4 / 11,
    b2 = 6 / 11,
    b3 = 8 / 11,
    b4 = 3 / 4,
    b5 = 9 / 11,
    b6 = 10 / 11,
    b7 = 15 / 16,
    b8 = 21 / 22,
    b9 = 63 / 64,
    b0 = 1 / b1 / b1
  export function bounceIn(x: number) {
    return 1 - bounceOut(1 - x)
  }
  export function bounceOut(x: number) {
    return (x = +x) < b1
      ? b0 * x * x
      : x < b3
      ? b0 * (x -= b2) * x + b4
      : x < b6
      ? b0 * (x -= b5) * x + b7
      : b0 * (x -= b8) * x + b9
  }
  export function bounce(x: number) {
    return ((x *= 2) <= 1 ? 1 - bounceOut(1 - x) : bounceOut(x - 1) + 1) / 2
  }

  export function circleIn(x: number) {
    return 1 - Math.sqrt(1 - x * x)
  }
  export function circleOut(x: number) {
    return Math.sqrt(1 - --x * x)
  }
  export function circle(x: number) {
    return ((x *= 2) <= 1 ? 1 - Math.sqrt(1 - x * x) : Math.sqrt(1 - (x -= 2) * x) + 1) / 2
  }

  export function cubicIn(x: number) {
    return x * x * x
  }
  export function cubicOut(x: number) {
    return --x * x * x + 1
  }
  export function cubic(x: number) {
    return ((x *= 2) <= 1 ? x * x * x : (x -= 2) * x * x + 2) / 2
  }

  const amplitude = 1
  const period = 0.3
  export const elasticIn: qt.ElasticEasing = (function custom(a, p) {
    const s = Math.asin(1 / (a = Math.max(1, a))) * (p /= qu.tau)
    function y(x: number) {
      return a * tpmt(-(--x)) * Math.sin((s - x) / p)
    }
    y.amplitude = function (x: number) {
      return custom(x, p * qu.tau)
    }
    y.period = function (x: number) {
      return custom(a, x)
    }
    return y
  })(amplitude, period)
  export const elasticOut: qt.ElasticEasing = (function custom(a, p) {
    const s = Math.asin(1 / (a = Math.max(1, a))) * (p /= qu.tau)
    function y(x: number) {
      return 1 - a * tpmt((x = +x)) * Math.sin((x + s) / p)
    }
    y.amplitude = function (x: number) {
      return custom(x, p * qu.tau)
    }
    y.period = function (x: number) {
      return custom(a, x)
    }
    return y
  })(amplitude, period)
  export const elastic: qt.ElasticEasing = (function custom(a, p) {
    const s = Math.asin(1 / (a = Math.max(1, a))) * (p /= qu.tau)
    function y(x: number) {
      return ((x = x * 2 - 1) < 0 ? a * tpmt(-x) * Math.sin((s - x) / p) : 2 - a * tpmt(x) * Math.sin((s + x) / p)) / 2
    }
    y.amplitude = function (x: number) {
      return custom(x, p * qu.tau)
    }
    y.period = function (x: number) {
      return custom(a, x)
    }
    return y
  })(amplitude, period)

  export function expIn(x: number) {
    return tpmt(1 - +x)
  }
  export function expOut(x: number) {
    return 1 - tpmt(x)
  }
  export function exp(x: number) {
    return ((x *= 2) <= 1 ? tpmt(1 - x) : 2 - tpmt(x - 1)) / 2
  }

  export const linear = (x: number) => +x

  export function tpmt(x: number) {
    return (Math.pow(2, -10 * x) - 0.0009765625) * 1.0009775171065494
  }

  const exponent = 3
  export const polyIn: qt.PolyEasing = (function custom(e) {
    e = +e
    function y(x: number) {
      return Math.pow(x, e)
    }
    y.exponent = custom
    return y
  })(exponent)
  export const polyOut: qt.PolyEasing = (function custom(e) {
    e = +e
    function y(x: number) {
      return 1 - Math.pow(1 - x, e)
    }
    y.exponent = custom
    return y
  })(exponent)
  export const poly: qt.PolyEasing = (function custom(e) {
    e = +e
    function y(x: number) {
      return ((x *= 2) <= 1 ? Math.pow(x, e) : 2 - Math.pow(2 - x, e)) / 2
    }
    y.exponent = custom
    return y
  })(exponent)

  export function quadIn(x: number) {
    return x * x
  }
  export function quadOut(x: number) {
    return x * (2 - x)
  }
  export function quad(x: number) {
    return ((x *= 2) <= 1 ? x * x : --x * (2 - x) + 1) / 2
  }

  export function sinIn(x: number) {
    return +x === 1 ? 1 : 1 - Math.cos(x * qu.halfPI)
  }
  export function sinOut(x: number) {
    return Math.sin(x * qu.halfPI)
  }
  export function sin(x: number) {
    return (1 - Math.cos(qu.PI * x)) / 2
  }
}
