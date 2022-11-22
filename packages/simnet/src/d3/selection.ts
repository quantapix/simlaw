import { interrupt, Transition } from "./transition.js"
import * as qu from "./utils.js"
import type * as qt from "./types.js"

const root = [null]
export function selection() {
  return new Selection([[document.documentElement]], root)
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

export function create<T extends keyof qt.TM>(x: T): qt.Selection<qt.TM[T], undefined, null, undefined>
export function create<T extends Element>(x: string): qt.Selection<T, undefined, null, undefined>
export function create(x: any): any {
  return select(creator(x).call(document.documentElement))
}

function creator<T extends keyof qt.TM>(x: T): (this: qt.Base) => qt.TM[T]
function creator<T extends Element>(x: string): (this: qt.Base) => T
function creator(x: any) {
  const fixed = (x: any) => {
    return function (this: any) {
      return this.ownerDocument.createElementNS(x.space, x.local)
    }
  }
  const inherit = (x: any) => {
    return function (this: any) {
      const d = this.ownerDocument
      const n = this.namespaceURI
      return n === qu.xhtml && d.documentElement.namespaceURI === qu.xhtml
        ? d.createElement(x)
        : d.createElementNS(n, x)
    }
  }
  const n: any = qu.space(x)
  return (n.local ? fixed : inherit)(n)
}

export abstract class Base<S extends qt.Base, P extends qt.Base> extends Element {
  constructor(public groups: S[][], public parents: P[]) {
    super()
  }
  [Symbol.iterator] = this.iterator
  call(f: Function, ...xs: any[]) {
    f(...xs)
    return this
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
  *iterator() {
    for (const g of this.groups) {
      for (const n of g) {
        if (n) yield n
      }
    }
  }
  node() {
    for (const g of this.groups) {
      for (const n of g) {
        if (n) return n
      }
    }
    return null
  }
  nodes() {
    return Array.from(this)
  }
  selectChild(x: any) {
    const first = () => this.firstElementChild
    const f = Array.prototype.find
    const find = x => () => f.call(this.children, x)
    const matcher = (x: string) => (e: Element) => e.matches(x)
    return this.select(x === undefined ? first : find(typeof x === "function" ? x : matcher(x)))
  }
  selectChildren(x: any) {
    const children = () => Array.from(this.children)
    const f = Array.prototype.filter
    const filter = x => () => f.call(this.children, x)
    const matcher = (x: string) => (e: Element) => e.matches(x)
    return this.selectAll(x === undefined ? children : filter(typeof x === "function" ? x : matcher(x)))
  }
  size() {
    let size = 0
    for (const _ of this) ++size
    return size
  }
}

export class Selection<S extends qt.Base, T, P extends qt.Base, U>
  extends Base<S, P>
  implements qt.Selection<S, T, P, U>
{
  _enter
  _exit
  constructor(groups: S[][], parents: P[]) {
    super(groups, parents)
  }
  override append(x: any): any {
    const create = typeof x === "function" ? x : creator(x)
    return this.select((...xs: any[]) => this.appendChild(create.apply(this, xs)))
  }
  attr(k: string, v?: any) {
    const rem = (k: string) => () => this.removeAttribute(k)
    const remNS = (k: qt.NS) => () => this.removeAttributeNS(k.space, k.local)
    const func =
      (k: string, f: Function) =>
      (...xs: any[]) => {
        const x = f.apply(this, xs)
        if (x === null) this.removeAttribute(k)
        else this.setAttribute(k, x)
      }
    const funcNS =
      (k: qt.NS, f: Function) =>
      (...xs: any[]) => {
        const x = f.apply(this, xs)
        if (x == null) this.removeAttributeNS(k.space, k.local)
        else this.setAttributeNS(k.space, k.local, x)
      }
    const val = (k: string, v: any) => () => this.setAttribute(k, v)
    const valNS = (k: qt.NS, v: any) => () => this.setAttributeNS(k.space, k.local, v)
    const ks = qu.space(k)
    const ns = typeof ks !== "string"
    if (v === undefined) {
      const n = this.node()
      return ns ? n.getAttributeNS(ks.space, ks.local) : n.getAttribute(ks)
    }
    if (ns) return this.each((v === null ? remNS : typeof v === "function" ? funcNS : valNS)(ks, v))
    return this.each((v === null ? rem : typeof v === "function" ? func : val)(ks, v))
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
      n.dispatchEvent(new CustomEvent(t, x))
    }
    const constant = (t: string, x: any) => () => event(this, t, x)
    const func =
      (t: string, x: any) =>
      (...xs: any[]) =>
        event(this, t, x.apply(this, xs))
    return this.each((typeof x === "function" ? func : constant)(t, x))
  }
  enter(): any {
    const sparse = (x: any[]) => new Array(x.length)
    return new Selection(this._enter || this.groups.map(sparse), this.parents)
  }
  exit(): any {
    const sparse = (x: any[]) => new Array(x.length)
    return new Selection(this._exit || this.groups.map(sparse), this.parents)
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
    return new Selection(ys, this.parents)
  }
  html(x: any) {
    const remove = () => (this.innerHTML = "")
    const constant = (x: string) => () => (this.innerHTML = x)
    const func =
      (x: any) =>
      (...xs: any[]) => {
        this.innerHTML = x.apply(this, xs) ?? ""
      }
    return x === undefined
      ? this.node().innerHTML
      : this.each(x ? (typeof x === "function" ? func : constant)(x) : remove)
  }
  insert(name, before) {
    const constantNull = () => null
    const create = typeof name === "function" ? name : creator(name),
      select = before == null ? constantNull : typeof before === "function" ? before : selector(before)
    return this.select(function () {
      return this.insertBefore(create.apply(this, arguments), select.apply(this, arguments) || null)
    })
  }
  interrupt(name?: string) {
    return this.each(() => interrupt(this, name))
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
  merge(x: any): any {
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
          if (n || g2[i]) y[i] = n
        })
      } else ys[j] = g
    })
    return new Selection(ys, this.parents)
  }
  on(t: string, x: any, xs?: any) {
    function types(x: string) {
      return x
        .trim()
        .split(/^|\s+/)
        .map(function (type) {
          const i = type.indexOf(".")
          let name = ""
          if (i >= 0) (name = type.slice(i + 1)), (type = type.slice(0, i))
          return { type, name }
        })
    }
    const ts = types(t + "")
    if (x === undefined) {
      const on = this.node()?.__on
      if (on) {
        const m = on.length,
          n = ts.length
        for (let j = 0; j < m; ++j) {
          const o = on[j]
          for (let i = 0; i < n; ++i) {
            const t = ts[i]!
            if (t.type === o.type && t.name === o.name) return o.value
          }
        }
      }
      return
    }
    const add = (t, value, options: any) => {
      const contextListener = f => e => f.call(this, e, this.__data__)
      return () => {
        const listener = contextListener(value),
          on = this.__on
        if (on) {
          const n = on.length
          for (let i = 0; i < n; ++i) {
            const o = on[i]
            if (o.type === t.type && o.name === t.name) {
              this.removeEventListener(o.type, o.listener, o.options)
              this.addEventListener(o.type, (o.listener = listener), (o.options = options))
              o.value = value
              return
            }
          }
        }
        this.addEventListener(t.type, listener, options)
        const o = { type: t.type, name: t.name, value, listener, options }
        if (!on) this.__on = [o]
        else on.push(o)
      }
    }
    const rem = t => {
      return () => {
        const on = this.__on
        if (!on) return
        let i = -1
        on.forEach(o => {
          if ((!t.type || o.type === t.type) && o.name === t.name) {
            this.removeEventListener(o.type, o.listener, o.options)
          } else on[++i] = o
        })
        if (++i) on.length = i
        else delete this.__on
      }
    }
    const f = x ? add : rem
    ts.forEach(t => {
      this.each(f(t, x, xs))
    })
    return this
  }
  order() {
    for (const g of this.groups) {
      for (let i = g.length - 1, next = g[i]; --i >= 0; ) {
        const n = g[i]
        if (n && next && n.compareDocumentPosition(next) ^ 4) next.parentNode.insertBefore(n, next)
        next = n
      }
    }
    return this
  }
  property(k: any, v?: any) {
    const remove = k => () => delete this[k]
    const constant = (k, v) => () => (this[k] = v)
    const func =
      (k, v) =>
      (...xs: any[]) => {
        const x = v.apply(this, xs)
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
  select(x: any): any {
    if (typeof x !== "function") x = selector(x)
    const ys = new Array(this.groups.length)
    this.groups.forEach((g, j) => {
      const y = (ys[j] = new Array(g.length))
      g.forEach((n, i) => {
        let sub
        if (n && (sub = x.call(n, n.__data__, i, g))) {
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
        if (n) {
          subs.push(x.call(n, n.__data__, i, g))
          parents.push(n)
        }
      })
    })
    return new Selection(subs, parents)
  }
  selection() {
    return this
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
      x.style.getPropertyValue(n) || qu.defaultView(x).getComputedStyle(x, null).getPropertyValue(n)
    return arguments.length > 1
      ? this.each(
          (v == null ? remove : typeof v === "function" ? func : constant)(k, v, priority == null ? "" : priority)
        )
      : value(this.node(), k)
  }
  transition(name) {
    let id, timing
    if (name instanceof Transition) {
      ;(id = name.id), (name = name.name)
    } else {
      const defaultTiming = {
        time: null,
        delay: 0,
        duration: 250,
        ease: easeCubicInOut,
      }
      ;(id = newId()), ((timing = defaultTiming).time = qu.now()), (name = name == null ? null : name + "")
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
    this.groups.forEach(g => {
      g.forEach((n, i) => {
        if (n) schedule(n, name, id, i, g, timing || inherit(n, id))
      })
    })
    return new Transition(this.groups, this.parents, name, id)
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
