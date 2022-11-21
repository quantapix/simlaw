import type * as qt from "./types.js"
import * as qu from "./utils.js"

export class Selection<S extends qt.Base, T, P extends qt.Base, U> extends Element implements qt.Selection<S, T, P, U> {
  _enter
  _exit
  constructor(public groups: S[][], public parents: P[]) {
    super()
  }
  [Symbol.iterator] = this.iterator
  selection() {
    return this
  }
  override append(x: any): any {
    const create = typeof x === "function" ? x : creator(x)
    return this.select((...xs: any[]) => this.appendChild(create.apply(this, xs)))
  }
  attr(k: string, v?: any) {
    const rem = (k: string) => () => this.removeAttribute(k)
    const remNS = (k: qt.NS) => () => this.removeAttributeNS(k.space, k.local)
    const func =
      (k: string, v: any) =>
      (...xs: any[]) => {
        const y = v.apply(this, xs)
        if (y === null) this.removeAttribute(k)
        else this.setAttribute(k, y)
      }
    const funcNS =
      (k: qt.NS, v: any) =>
      (...xs: any[]) => {
        const y = v.apply(this, xs)
        if (y == null) this.removeAttributeNS(k.space, k.local)
        else this.setAttributeNS(k.space, k.local, y)
      }
    const val = (k: string, v: string) => () => this.setAttribute(k, v)
    const valNS = (k: qt.NS, v: string) => () => this.setAttributeNS(k.space, k.local, v)
    const ks = space(k)
    const ns = typeof ks !== "string"
    if (v === undefined) {
      const n = this.node()
      return ns ? n.getAttributeNS(ks.space, ks.local) : n.getAttribute(ks)
    }
    if (ns) return this.each((v === null ? remNS : typeof v === "function" ? funcNS : valNS)(ks, v))
    return this.each((v === null ? rem : typeof v === "function" ? func : val)(ks, v))
  }
  call(f: Function, ...xs: any[]) {
    f(...xs)
    return this
  }
  classed(k: string, v?: any): any {
    const split = (x: string) => x.trim().split(/^|\s+/)
    class List {
      ns: string[]
      constructor(public elem: Element) {
        this.ns = split(elem.getAttribute("class") || "")
      }
      add(x: string) {
        const i = this.ns.indexOf(x)
        if (i < 0) {
          this.ns.push(x)
          this.elem.setAttribute("class", this.ns.join(" "))
        }
      }
      remove(x: string) {
        const i = this.ns.indexOf(x)
        if (i >= 0) {
          this.ns.splice(i, 1)
          this.elem.setAttribute("class", this.ns.join(" "))
        }
      }
      contains(x: string) {
        return this.ns.indexOf(x) >= 0
      }
    }
    const list = (x: Element) => x.classList || new List(x)
    const add = (x: Element, ns: string[]) => {
      const cs = list(x)
      ns.forEach(n => {
        cs.add(n)
      })
    }
    const remove = (x: Element, ns: string[]) => {
      const cs = list(x)
      ns.forEach(n => {
        cs.remove(n)
      })
    }
    const adder = (ns: string[]) => () => add(this, ns)
    const remover = (ns: string[]) => () => remove(this, ns)
    const func =
      (ns: string[], f: Function) =>
      (...xs: any[]) => {
        ;(f.apply(this, ...xs) ? add : remove)(this, ns)
      }
    const ks = split(k + "")
    if (v === undefined) {
      const cs = list(this.node())
      for (const k of ks) {
        if (!cs.contains(k)) return false
      }
      return true
    }
    return this.each((typeof v === "function" ? func : v ? adder : remover)(ks, v))
  }
  clone(d: boolean): any {
    const shallow = () => {
      const y = this.cloneNode(false)
      const p = this.parentNode
      return p ? p.insertBefore(y, this.nextSibling) : y
    }
    const deep = () => {
      const y = this.cloneNode(true)
      const p = this.parentNode
      return p ? p.insertBefore(y, this.nextSibling) : y
    }
    return this.select(d ? deep : shallow)
  }
  data(x?: any, f?: any): any {
    if (!arguments.length) return Array.from(this, x => x.__data__) as T[]
    class EnterElem extends Element implements qt.EnterElem {
      __data__
      override ownerDocument: Document
      override namespaceURI: string
      next: Node | null = null
      constructor(public parent: any, data: any) {
        super()
        this.ownerDocument = parent.ownerDocument
        this.namespaceURI = parent.namespaceURI
        this.__data__ = data
      }
      override appendChild(x: any) {
        return this.parent.insertBefore(x, this.next)
      }
      override insertBefore(x: any, next: Node | null) {
        return this.parent.insertBefore(x, next)
      }
      override querySelector(x: string) {
        return this.parent.querySelector(x)
      }
      override querySelectorAll(x: string) {
        return this.parent.querySelectorAll(x)
      }
    }
    function index(parent, group, enter, update, exit, data) {
      const groupLength = group.length,
        dataLength = data.length
      let i = 0,
        node
      for (; i < dataLength; ++i) {
        if ((node = group[i])) {
          node.__data__ = data[i]
          update[i] = node
        } else enter[i] = new EnterElem(parent, data[i])
      }
      for (; i < groupLength; ++i) {
        if ((node = group[i])) exit[i] = node
      }
    }
    function key(parent, group, enter, update, exit, data, key) {
      const nodeByKeyValue = new Map(),
        groupLength = group.length,
        dataLength = data.length,
        keyValues = new Array(groupLength)
      let i, node, keyValue
      for (i = 0; i < groupLength; ++i) {
        if ((node = group[i])) {
          keyValues[i] = keyValue = key.call(node, node.__data__, i, group) + ""
          if (nodeByKeyValue.has(keyValue)) exit[i] = node
          else nodeByKeyValue.set(keyValue, node)
        }
      }
      for (i = 0; i < dataLength; ++i) {
        keyValue = key.call(parent, data[i], i, data) + ""
        if ((node = nodeByKeyValue.get(keyValue))) {
          update[i] = node
          node.__data__ = data[i]
          nodeByKeyValue.delete(keyValue)
        } else enter[i] = new EnterElem(parent, data[i])
      }
      for (i = 0; i < groupLength; ++i) {
        if ((node = group[i]) && nodeByKeyValue.get(keyValues[i]) === node) exit[i] = node
      }
    }
    const bind = f ? f : index,
      parents = this.parents
    const n = this.groups.length
    const update = new Array(n),
      enter = new Array(n),
      exit = new Array(n)
    if (typeof x !== "function") x = qu.constant(x)
    this.groups.forEach((g, j) => {
      const p = parents[j],
        ds = qu.arraylike(x.call(p, p && p.__data__, j, parents)),
        n = ds.length,
        es = (enter[j] = new Array(n)),
        us = (update[j] = new Array(n)),
        xs = (exit[j] = new Array(g.length))
      bind(p, g, es, us, xs, ds, key)
      for (let i0 = 0, i1 = 0, prev, next; i0 < n; ++i0) {
        if ((prev = es[i0])) {
          if (i0 >= i1) i1 = i0 + 1
          while (!(next = us[i1]) && ++i1 < n);
          prev._next = next || null
        }
      }
    })
    const y = new Selection<S, any, P, U>(update, parents)
    y._enter = enter
    y._exit = exit
    return y
  }
  datum(x?: any) {
    return x === undefined ? this.node().__data__ : this.property("__data__", x)
  }
  dispatch(t: string, x?: any) {
    const event = (n: Node, t: string, x: any) => {
      const window = defaultView(n)
      let e = window.CustomEvent
      if (typeof e === "function") e = new e(t, x)
      else {
        e = window.document.createEvent("Event")
        if (x) e.initEvent(t, x.bubbles, x.cancelable), (e.detail = x.detail)
        else e.initEvent(t, false, false)
      }
      n.dispatchEvent(e)
    }
    const constant = (t: string, x: any) => () => event(this, t, x)
    const func =
      (t: string, x: any) =>
      (...xs: any[]) =>
        event(this, t, x.apply(this, xs))
    return this.each((typeof x === "function" ? func : constant)(t, x))
  }
  each(f: Function) {
    this.groups.forEach(g => {
      g.forEach((n, i) => {
        if (n) f.call(n, n.__data__, i, g)
      })
    })
    return this
  }
  empty() {
    return !this.node()
  }
  enter(): any {
    return new Selection(this._enter || this.groups.map(sparse), this.parents)
  }
  exit(): any {
    return new Selection(this._exit || this.groups.map(sparse), this.parents)
  }
  filter(x: any) {
    const matcher = (x: string) => () => this.matches(x)
    if (typeof x !== "function") x = matcher(x)
    const subs: S[][] = new Array(this.groups.length)
    this.groups.forEach((g, j) => {
      const sub: S[] = (subs[j] = [])
      g.forEach((n, i) => {
        if (n && x.call(n, n.__data__, i, g)) sub.push(n)
      })
    })
    return new Selection(subs, this.parents)
  }
  html(v) {
    const remove = () => (this.innerHTML = "")
    const constant = v => () => (this.innerHTML = v)
    const func = v => () => {
      const x = v.apply(this, arguments)
      this.innerHTML = x == null ? "" : x
    }
    return arguments.length
      ? this.each(v == null ? remove : (typeof v === "function" ? func : constant)(v))
      : this.node().innerHTML
  }
  insert(name, before) {
    const constantNull = () => null
    const create = typeof name === "function" ? name : creator(name),
      select = before == null ? constantNull : typeof before === "function" ? before : selector(before)
    return this.select(function () {
      return this.insertBefore(create.apply(this, arguments), select.apply(this, arguments) || null)
    })
  }
  *iterator() {
    for (const g of this.groups) {
      for (const n of g) {
        yield n
      }
    }
  }
  join(onenter, onupdate, onexit) {
    let enter = this.enter(),
      update = this,
      exit = this.exit()
    if (typeof onenter === "function") {
      enter = onenter(enter)
      if (enter) enter = enter.selection()
    } else {
      enter = enter.append(onenter + "")
    }
    if (onupdate != null) {
      update = onupdate(update)
      if (update) update = update.selection()
    }
    if (onexit == null) exit.remove()
    else onexit(exit)
    return enter && update ? enter.merge(update).order() : update
  }
  lower() {
    const lower = () => {
      if (this.previousSibling) this.parentNode?.insertBefore(this, this.parentNode.firstChild)
    }
    return this.each(lower)
  }
  merge(x: any) {
    const selection = x.selection ? x.selection() : x
    const gs = this.groups,
      n = gs.length,
      gs2 = selection._groups,
      min = Math.min(n, gs2.length),
      ys = new Array(n)
    gs.forEach((g, j) => {
      if (j < min) {
        const g2 = gs2[j]
        const y = (ys[j] = new Array(g.length))
        g.forEach((n, i) => {
          if (g2[i]) y[i] = n
        })
      } else ys[j] = g
    })
    return new Selection(ys, this.parents)
  }
  node() {
    for (const g of this.groups) {
      for (const n of g) {
        return n
      }
    }
    return null
  }
  nodes() {
    return Array.from(this)
  }
  on(typename, value, options) {
    function parseTypenames(typenames) {
      return typenames
        .trim()
        .split(/^|\s+/)
        .map(function (t) {
          let name = "",
            i = t.indexOf(".")
          if (i >= 0) (name = t.slice(i + 1)), (t = t.slice(0, i))
          return { type: t, name: name }
        })
    }
    let typenames = parseTypenames(typename + ""),
      i,
      n = typenames.length,
      t
    if (arguments.length < 2) {
      const on = this.node().__on
      if (on)
        for (let j = 0, m = on.length, o; j < m; ++j) {
          for (i = 0, o = on[j]; i < n; ++i) {
            if ((t = typenames[i]).type === o.type && t.name === o.name) {
              return o.value
            }
          }
        }
      return
    }
    const onAdd = (typename, value, options) => {
      const contextListener = listener => event => listener.call(this, event, this.__data__)
      return () => {
        let on = this.__on,
          o,
          listener = contextListener(value)
        if (on)
          for (let j = 0, m = on.length; j < m; ++j) {
            if ((o = on[j]).type === typename.type && o.name === typename.name) {
              this.removeEventListener(o.type, o.listener, o.options)
              this.addEventListener(o.type, (o.listener = listener), (o.options = options))
              o.value = value
              return
            }
          }
        this.addEventListener(typename.type, listener, options)
        o = { type: typename.type, name: typename.name, value: value, listener: listener, options: options }
        if (!on) this.__on = [o]
        else on.push(o)
      }
    }
    const onRemove = typename => {
      return () => {
        const on = this.__on
        if (!on) return
        for (let j = 0, i = -1, m = on.length, o; j < m; ++j) {
          if (((o = on[j]), (!typename.type || o.type === typename.type) && o.name === typename.name)) {
            this.removeEventListener(o.type, o.listener, o.options)
          } else {
            on[++i] = o
          }
        }
        if (++i) on.length = i
        else delete this.__on
      }
    }
    const on = value ? onAdd : onRemove
    for (i = 0; i < n; ++i) this.each(on(typenames[i], value, options))
    return this
  }
  order() {
    for (const g of this.groups) {
      for (let i = g.length - 1, next = g[i]; --i >= 0; ) {
        const n = g[i]!
        if (next && n.compareDocumentPosition(next) ^ 4) next.parentNode.insertBefore(n, next)
        next = n
      }
    }
    return this
  }
  property(k, v) {
    const remove = k => () => delete this[k]
    const constant = (k, v) => () => (this[k] = v)
    const func = (k, v) => () => {
      const x = v.apply(this, arguments)
      if (x == null) delete this[k]
      else this[k] = x
    }
    return arguments.length > 1
      ? this.each((v == null ? remove : typeof v === "function" ? func : constant)(k, v))
      : this.node()[k]
  }
  raise() {
    const raise = () => {
      if (this.nextSibling) this.parentNode.appendChild(this)
    }
    return this.each(raise)
  }
  override remove() {
    return this.each(() => {
      const x = this.parentNode
      if (x) x.removeChild(this)
    })
  }
  select(x: any) {
    if (typeof x !== "function") x = selector(x)
    const ys = new Array(this.groups.length)
    this.groups.forEach((g, j) => {
      const y = (ys[j] = new Array(g.length))
      g.forEach((n, i) => {
        let sub
        if ((sub = x.call(n, n.__data__, i, g))) {
          if ("__data__" in n) sub.__data__ = n.__data__
          y[i] = sub
        }
      })
    })
    return new Selection(ys, this.parents)
  }
  selectAll(x: any) {
    const all =
      x =>
      (...xs: any[]) =>
        qu.array(x.apply(this, ...xs))
    if (typeof x === "function") x = all(x)
    else x = selectorAll(x)
    const subs: S[][] = [],
      parents: S[] = []
    this.groups.forEach(g => {
      g.forEach((n, i) => {
        subs.push(x.call(n, n.__data__, i, g))
        parents.push(n)
      })
    })
    return new Selection(subs, parents)
  }
  selectChild(x) {
    const first = () => this.firstElementChild
    const f = Array.prototype.find
    const find = x => () => f.call(this.children, x)
    return this.select(x == null ? first : find(typeof x === "function" ? x : childMatcher(x)))
  }
  selectChildren(x) {
    const children = () => Array.from(this.children)
    const f = Array.prototype.filter
    const filter = x => () => f.call(this.children, x)
    return this.selectAll(x == null ? children : filter(typeof x === "function" ? x : childMatcher(x)))
  }
  size() {
    let size = 0
    for (const _ of this) ++size
    return size
  }
  sort(f?) {
    if (!f) f = qu.ascending
    const f2 = (a: T, b: T) => (a && b ? f(a.__data__, b.__data__) : !a - !b)
    const ys = new Array(this.groups.length)
    this.groups.forEach((g, j) => {
      const y = (ys[j] = new Array(g.length))
      g.forEach((n, i) => {
        y[i] = n
      })
      y.sort(f2)
    })
    return new Selection(ys, this.parents).order()
  }
  style(k, v, priority) {
    const remove = k => () => this.style.removeProperty(k)
    const constant = (k, v, priority) => () => this.style.setProperty(k, v, priority)
    const func = (k, v, priority) => () => {
      const x = v.apply(this, arguments)
      if (x == null) this.style.removeProperty(k)
      else this.style.setProperty(k, x, priority)
    }
    const value = (x, n: string): string =>
      x.style.getPropertyValue(n) || defaultView(x).getComputedStyle(x, null).getPropertyValue(n)
    return arguments.length > 1
      ? this.each(
          (v == null ? remove : typeof v === "function" ? func : constant)(k, v, priority == null ? "" : priority)
        )
      : value(this.node(), k)
  }
  text(x: any) {
    const remove = () => (this.textContent = "")
    const constant = (v: string) => () => (this.textContent = v)
    const func =
      (v: any) =>
      (...xs: any[]) => {
        const x: string = v.apply(this, ...xs)
        this.textContent = x == null ? "" : x
      }
    return x === undefined
      ? this.node().textContent
      : this.each(x == null ? remove : (typeof x === "function" ? func : constant)(x))
  }
  selector<T extends Element>(x: string | null): (this: qt.Base) => T | void {
    return x == null ? () => {} : () => this.querySelector(x)
  }
  selectorAll<T extends Element>(x: string | null): (this: qt.Base) => NodeListOf<T> {
    return x == null ? () => ({} as NodeListOf<T>) : () => this.querySelectorAll(x)
  }
}

export const xhtml = "http://www.w3.org/1999/xhtml"
export const spaces = new Map<string, string>([
  ["svg", "http://www.w3.org/2000/svg"],
  ["xhtml", xhtml],
  ["xlink", "http://www.w3.org/1999/xlink"],
  ["xml", "http://www.w3.org/XML/1998/namespace"],
  ["xmlns", "http://www.w3.org/2000/xmlns/"],
])

export function space(x: string): qt.NS | string {
  let pre = (x += "")
  const i = pre.indexOf(":")
  if (i >= 0 && (pre = x.slice(0, i)) !== "xmlns") x = x.slice(i + 1)
  const space = spaces.get(pre)
  return space ? { space, local: x } : x
}

function creator<T extends keyof ElementTagNameMap>(x: T): (this: qt.Base) => ElementTagNameMap[T]
function creator<T extends Element>(x: string): (this: qt.Base) => T
function creator(x: any) {
  function fixed(x: any) {
    return function (this: any) {
      return this.ownerDocument.createElementNS(x.space, x.local)
    }
  }
  function inherit(x: any) {
    return function (this: any) {
      const d = this.ownerDocument
      const n = this.namespaceURI
      return n === xhtml && d.documentElement.namespaceURI === xhtml ? d.createElement(x) : d.createElementNS(n, x)
    }
  }
  const n: any = space(x)
  return (n.local ? fixed : inherit)(n)
}

export function create<T extends keyof ElementTagNameMap>(
  x: T
): qt.Selection<ElementTagNameMap[T], undefined, null, undefined>
export function create<T extends Element>(x: string): qt.Selection<T, undefined, null, undefined>
export function create(x: any) {
  return select(creator(x).call(document.documentElement))
}

export function local<T>(): qt.Local<T> {
  let nextId = 0
  class Local {
    id = "@" + (++nextId).toString(36)
    get(x: any) {
      const id = this.id
      while (!(id in x)) if (!(x = x.parentNode)) return
      return x[id]
    }
    remove(x: any) {
      return this.id in x && delete x[this.id]
    }
    set(x: any, v: any) {
      return (x[this.id] = v)
    }
    toString() {
      return this.id
    }
  }
  return new Local()
}

function childMatcher(sel: string) {
  return function (node) {
    return node.matches(sel)
  }
}
export function pointer(event: any, target?: any): qt.Point {
  event = sourceEvent(event)
  if (target === undefined) target = event.currentTarget
  if (target) {
    const svg = target.ownerSVGElement || target
    if (svg.createSVGPoint) {
      let point = svg.createSVGPoint()
      ;(point.x = event.clientX), (point.y = event.clientY)
      point = point.matrixTransform(target.getScreenCTM().inverse())
      return [point.x, point.y]
    }
    if (target.getBoundingClientRect) {
      const rect = target.getBoundingClientRect()
      return [event.clientX - rect.left - target.clientLeft, event.clientY - rect.top - target.clientTop]
    }
  }
  return [event.pageX, event.pageY]
}
export function pointers(event: any, target?: any): Array<qt.Point> {
  if (event.target) {
    event = sourceEvent(event)
    if (target === undefined) target = event.currentTarget
    event = event.touches || [event]
  }
  return Array.from(event, event => pointer(event, target))
}
export function select<S extends qt.Base, T>(x: string): Selection<S, T, HTMLElement, any>
export function select<S extends qt.Base, T>(x: S): Selection<S, T, null, undefined>
export function select(x: any) {
  return typeof x === "string"
    ? new Selection([[document.querySelector(x)]], [document.documentElement])
    : new Selection([[x]], root)
}
export function selectAll(x?: null): Selection<null, undefined, null, undefined>
export function selectAll<S extends qt.Base, T>(x: string): Selection<S, T, HTMLElement, any>
export function selectAll<S extends qt.Base, T>(x: S[] | ArrayLike<S> | Iterable<S>): Selection<S, T, null, undefined>
export function selectAll(x: any) {
  return typeof x === "string"
    ? new Selection([document.querySelectorAll(x)], [document.documentElement])
    : new Selection([qu.array(x)], root)
}
export function sourceEvent(event) {
  let sourceEvent
  while ((sourceEvent = event.sourceEvent)) event = sourceEvent
  return event
}
export function window(x: Window | Document | Element): Window {
  return (x.ownerDocument && x.ownerDocument.defaultView) || (x.document && x) || x.defaultView
}

export const root = [null]
export const selection: qt.SelectionFn = () => {
  return new Selection([[document.documentElement]], root)
}

function sparse(update) {
  return new Array(update.length)
}
