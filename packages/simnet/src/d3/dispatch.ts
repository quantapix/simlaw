import type * as qt from "./types.js"

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
