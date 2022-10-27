import type * as qt from "./types.js"

export const xhtml = "http://www.w3.org/1999/xhtml"
export const namespaces: qt.NamespaceMap = {
  svg: "http://www.w3.org/2000/svg",
  xhtml: xhtml,
  xlink: "http://www.w3.org/1999/xlink",
  xml: "http://www.w3.org/XML/1998/namespace",
  xmlns: "http://www.w3.org/2000/xmlns/",
}

export function array(x) {
  return x == null ? [] : Array.isArray(x) ? x : Array.from(x)
}
export function constant(x) {
  return function () {
    return x
  }
}
export function create<T extends keyof ElementTagNameMap>(
  x: T
): qt.Selection<ElementTagNameMap[T], undefined, null, undefined>
export function create<T extends Element>(x: string): qt.Selection<T, undefined, null, undefined>
export function create(x: any) {
  return select(creator(x).call(document.documentElement))
}
function creatorInherit(x: any) {
  return function (this: any) {
    const document = this.ownerDocument,
      uri = this.namespaceURI
    return uri === xhtml && document.documentElement.namespaceURI === xhtml
      ? document.createElement(x)
      : document.createElementNS(uri, x)
  }
}
function creatorFixed(x: any) {
  return function (this: any) {
    return this.ownerDocument.createElementNS(x.space, x.local)
  }
}
export function creator<T extends keyof ElementTagNameMap>(x: T): (this: qt.BaseType) => ElementTagNameMap[T]
export function creator<T extends Element>(x: string): (this: qt.BaseType) => T
export function creator(x: any) {
  const y: any = namespace(x)
  return (y.local ? creatorFixed : creatorInherit)(y)
}
export function identity(x) {
  return x
}
let nextId = 0
export function local<T>(): qt.Local<T> {
  return new Local()
}
class Local {
  constructor() {
    this._ = "@" + (++nextId).toString(36)
  }
  get(node) {
    const id = this._
    while (!(id in node)) if (!(node = node.parentNode)) return
    return node[id]
  }
  set(node, value) {
    return (node[this._] = value)
  }
  remove(node) {
    return this._ in node && delete node[this._]
  }
  toString() {
    return this._
  }
}
export function matcher(sel: string): (this: qt.BaseType) => boolean {
  return function (this: qt.BaseType) {
    return this.matches(sel)
  }
}
export function childMatcher(sel: string) {
  return function (node) {
    return node.matches(sel)
  }
}
export function namespace(name: string): qt.NamespaceLocalObject | string {
  let prefix = (name += ""),
    i = prefix.indexOf(":")
  if (i >= 0 && (prefix = name.slice(0, i)) !== "xmlns") name = name.slice(i + 1)
  return namespaces.hasOwnProperty(prefix) ? { space: namespaces[prefix], local: name } : name // eslint-disable-line no-prototype-builtins
}
export function pointer(event: any, target?: any): [number, number] {
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
export function pointers(event: any, target?: any): Array<[number, number]> {
  if (event.target) {
    event = sourceEvent(event)
    if (target === undefined) target = event.currentTarget
    event = event.touches || [event]
  }
  return Array.from(event, event => pointer(event, target))
}
export function select<B extends qt.BaseType, T>(x: string): qt.Selection<B, T, HTMLElement, any>
export function select<B extends qt.BaseType, T>(x: B): qt.Selection<B, T, null, undefined>
export function select(x: any) {
  return typeof x === "string"
    ? new Selection([[document.querySelector(x)]], [document.documentElement])
    : new Selection([[x]], root)
}
export function selectAll(x?: null): qt.Selection<null, undefined, null, undefined>
export function selectAll<B extends qt.BaseType, T>(x: string): qt.Selection<B, T, HTMLElement, any>
export function selectAll<B extends qt.BaseType, T>(
  x: B[] | ArrayLike<B> | Iterable<B>
): qt.Selection<B, T, null, undefined>
export function selectAll(x: any) {
  return typeof x === "string"
    ? new Selection([document.querySelectorAll(x)], [document.documentElement])
    : new Selection([array(x)], root)
}
export function selector<T extends Element>(x: string | null): (this: qt.BaseType) => T | void {
  return x == null
    ? function (this: qt.BaseType) {}
    : function (this: qt.BaseType) {
        return this.querySelector(x)
      }
}
export function selectorAll<T extends Element>(x: string | null): (this: qt.BaseType) => NodeListOf<T> {
  return x == null
    ? function empty() {
        return []
      }
    : function () {
        return this.querySelectorAll(x)
      }
}
export function sourceEvent(event) {
  let sourceEvent
  while ((sourceEvent = event.sourceEvent)) event = sourceEvent
  return event
}
export function window(x: Window | Document | Element): Window {
  return (x.ownerDocument && x.ownerDocument.defaultView) || (x.document && x) || x.defaultView
}

function classArray(string) {
  return string.trim().split(/^|\s+/)
}
function classList(node) {
  return node.classList || new ClassList(node)
}
class ClassList {
  constructor(node) {
    this._node = node
    this._names = classArray(node.getAttribute("class") || "")
  }
  add(name) {
    const i = this._names.indexOf(name)
    if (i < 0) {
      this._names.push(name)
      this._node.setAttribute("class", this._names.join(" "))
    }
  }
  remove(name) {
    const i = this._names.indexOf(name)
    if (i >= 0) {
      this._names.splice(i, 1)
      this._node.setAttribute("class", this._names.join(" "))
    }
  }
  contains(name) {
    return this._names.indexOf(name) >= 0
  }
}
function classedAdd(node, names) {
  let list = classList(node),
    i = -1,
    n = names.length
  while (++i < n) list.add(names[i])
}
function classedRemove(node, names) {
  let list = classList(node),
    i = -1,
    n = names.length
  while (++i < n) list.remove(names[i])
}
function classedTrue(names) {
  return function () {
    classedAdd(this, names)
  }
}
function classedFalse(names) {
  return function () {
    classedRemove(this, names)
  }
}
function classedFunction(names, value) {
  return function () {
    ;(value.apply(this, arguments) ? classedAdd : classedRemove)(this, names)
  }
}
function selection_cloneShallow() {
  const clone = this.cloneNode(false),
    parent = this.parentNode
  return parent ? parent.insertBefore(clone, this.nextSibling) : clone
}
function selection_cloneDeep() {
  const clone = this.cloneNode(true),
    parent = this.parentNode
  return parent ? parent.insertBefore(clone, this.nextSibling) : clone
}
function bindIndex(parent, group, enter, update, exit, data) {
  let i = 0,
    node,
    groupLength = group.length,
    dataLength = data.length
  for (; i < dataLength; ++i) {
    if ((node = group[i])) {
      node.__data__ = data[i]
      update[i] = node
    } else {
      enter[i] = new EnterNode(parent, data[i])
    }
  }
  for (; i < groupLength; ++i) {
    if ((node = group[i])) {
      exit[i] = node
    }
  }
}
function bindKey(parent, group, enter, update, exit, data, key) {
  let i,
    node,
    nodeByKeyValue = new Map(),
    groupLength = group.length,
    dataLength = data.length,
    keyValues = new Array(groupLength),
    keyValue
  for (i = 0; i < groupLength; ++i) {
    if ((node = group[i])) {
      keyValues[i] = keyValue = key.call(node, node.__data__, i, group) + ""
      if (nodeByKeyValue.has(keyValue)) {
        exit[i] = node
      } else {
        nodeByKeyValue.set(keyValue, node)
      }
    }
  }
  for (i = 0; i < dataLength; ++i) {
    keyValue = key.call(parent, data[i], i, data) + ""
    if ((node = nodeByKeyValue.get(keyValue))) {
      update[i] = node
      node.__data__ = data[i]
      nodeByKeyValue.delete(keyValue)
    } else {
      enter[i] = new EnterNode(parent, data[i])
    }
  }
  for (i = 0; i < groupLength; ++i) {
    if ((node = group[i]) && nodeByKeyValue.get(keyValues[i]) === node) {
      exit[i] = node
    }
  }
}
function arraylike(data) {
  return typeof data === "object" && "length" in data ? data : Array.from(data)
}
function dispatchEvent(node, type, params) {
  let window = defaultView(node),
    event = window.CustomEvent
  if (typeof event === "function") {
    event = new event(type, params)
  } else {
    event = window.document.createEvent("Event")
    if (params) event.initEvent(type, params.bubbles, params.cancelable), (event.detail = params.detail)
    else event.initEvent(type, false, false)
  }
  node.dispatchEvent(event)
}
function dispatchConstant(type, params) {
  return function () {
    return dispatchEvent(this, type, params)
  }
}
function dispatchFunction(type, params) {
  return function () {
    return dispatchEvent(this, type, params.apply(this, arguments))
  }
}
class EnterNode {
  constructor(parent, datum) {
    this.ownerDocument = parent.ownerDocument
    this.namespaceURI = parent.namespaceURI
    this._next = null
    this._parent = parent
    this.__data__ = datum
  }
  appendChild(child) {
    return this._parent.insertBefore(child, this._next)
  }
  insertBefore(child, next) {
    return this._parent.insertBefore(child, next)
  }
  querySelector(selector) {
    return this._parent.querySelector(selector)
  }
  querySelectorAll(selector) {
    return this._parent.querySelectorAll(selector)
  }
}
function htmlRemove() {
  this.innerHTML = ""
}
function htmlConstant(value) {
  return function () {
    this.innerHTML = value
  }
}
function htmlFunction(value) {
  return function () {
    const v = value.apply(this, arguments)
    this.innerHTML = v == null ? "" : v
  }
}
export const root = [null]
export const selection: qt.SelectionFn = () => {
  return new Selection([[document.documentElement]], root)
}

export class Selection {
  constructor(groups, parents) {
    this._groups = groups
    this._parents = parents
  }
  [Symbol.iterator] = this.iterator
  selection() {
    return this
  }
  append(name) {
    const create = typeof name === "function" ? name : creator(name)
    return this.select(function () {
      return this.appendChild(create.apply(this, arguments))
    })
  }
  attr(name, value) {
    const attrRemove = name => () => {
      this.removeAttribute(name)
    }
    const attrRemoveNS = fullname => () => {
      this.removeAttributeNS(fullname.space, fullname.local)
    }
    const attrConstant = (name, value) => () => {
      this.setAttribute(name, value)
    }
    const attrConstantNS = (fullname, value) => () => {
      this.setAttributeNS(fullname.space, fullname.local, value)
    }
    const attrFunction = (name, value) => () => {
      const v = value.apply(this, arguments)
      if (v == null) this.removeAttribute(name)
      else this.setAttribute(name, v)
    }
    const attrFunctionNS = (fullname, value) => () => {
      const v = value.apply(this, arguments)
      if (v == null) this.removeAttributeNS(fullname.space, fullname.local)
      else this.setAttributeNS(fullname.space, fullname.local, v)
    }
    const fullname = namespace(name)
    if (arguments.length < 2) {
      const node = this.node()
      return fullname.local ? node.getAttributeNS(fullname.space, fullname.local) : node.getAttribute(fullname)
    }
    return this.each(
      (value == null
        ? fullname.local
          ? attrRemoveNS
          : attrRemove
        : typeof value === "function"
        ? fullname.local
          ? attrFunctionNS
          : attrFunction
        : fullname.local
        ? attrConstantNS
        : attrConstant)(fullname, value)
    )
  }
  call() {
    const callback = arguments[0]
    arguments[0] = this
    callback.apply(null, arguments)
    return this
  }
  classed(name, value) {
    const names = classArray(name + "")
    if (arguments.length < 2) {
      let list = classList(this.node()),
        i = -1,
        n = names.length
      while (++i < n) if (!list.contains(names[i])) return false
      return true
    }
    return this.each((typeof value === "function" ? classedFunction : value ? classedTrue : classedFalse)(names, value))
  }
  clone(deep) {
    return this.select(deep ? selection_cloneDeep : selection_cloneShallow)
  }
  data(value, key) {
    function datum(node) {
      return node.__data__
    }
    if (!arguments.length) return Array.from(this, datum)
    const bind = key ? bindKey : bindIndex,
      parents = this._parents,
      groups = this._groups
    if (typeof value !== "function") value = constant(value)
    for (let m = groups.length, update = new Array(m), enter = new Array(m), exit = new Array(m), j = 0; j < m; ++j) {
      const parent = parents[j],
        group = groups[j],
        groupLength = group.length,
        data = arraylike(value.call(parent, parent && parent.__data__, j, parents)),
        dataLength = data.length,
        enterGroup = (enter[j] = new Array(dataLength)),
        updateGroup = (update[j] = new Array(dataLength)),
        exitGroup = (exit[j] = new Array(groupLength))
      bind(parent, group, enterGroup, updateGroup, exitGroup, data, key)
      for (let i0 = 0, i1 = 0, previous, next; i0 < dataLength; ++i0) {
        if ((previous = enterGroup[i0])) {
          if (i0 >= i1) i1 = i0 + 1
          while (!(next = updateGroup[i1]) && ++i1 < dataLength);
          previous._next = next || null
        }
      }
    }
    update = new Selection(update, parents)
    update._enter = enter
    update._exit = exit
    return update
  }
  datum(value) {
    return arguments.length ? this.property("__data__", value) : this.node().__data__
  }
  dispatch(type, params) {
    return this.each((typeof params === "function" ? dispatchFunction : dispatchConstant)(type, params))
  }
  each(callback) {
    for (let groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
      for (let group = groups[j], i = 0, n = group.length, node; i < n; ++i) {
        if ((node = group[i])) callback.call(node, node.__data__, i, group)
      }
    }
    return this
  }
  empty() {
    return !this.node()
  }
  enter() {
    return new Selection(this._enter || this._groups.map(sparse), this._parents)
  }
  exit() {
    return new Selection(this._exit || this._groups.map(sparse), this._parents)
  }
  filter(match) {
    if (typeof match !== "function") match = matcher(match)
    for (let groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
      for (let group = groups[j], n = group.length, subgroup = (subgroups[j] = []), node, i = 0; i < n; ++i) {
        if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
          subgroup.push(node)
        }
      }
    }
    return new Selection(subgroups, this._parents)
  }
  html(value) {
    return arguments.length
      ? this.each(value == null ? htmlRemove : (typeof value === "function" ? htmlFunction : htmlConstant)(value))
      : this.node().innerHTML
  }
  insert(name, before) {
    const create = typeof name === "function" ? name : creator(name),
      select = before == null ? constantNull : typeof before === "function" ? before : selector(before)
    return this.select(function () {
      return this.insertBefore(create.apply(this, arguments), select.apply(this, arguments) || null)
    })
  }
  *iterator() {
    for (let groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
      for (let group = groups[j], i = 0, n = group.length, node; i < n; ++i) {
        if ((node = group[i])) yield node
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
    function lower() {
      if (this.previousSibling) this.parentNode.insertBefore(this, this.parentNode.firstChild)
    }
    return this.each(lower)
  }
  merge(context) {
    const selection = context.selection ? context.selection() : context
    for (
      let groups0 = this._groups,
        groups1 = selection._groups,
        m0 = groups0.length,
        m1 = groups1.length,
        m = Math.min(m0, m1),
        merges = new Array(m0),
        j = 0;
      j < m;
      ++j
    ) {
      for (
        let group0 = groups0[j],
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
    return new Selection(merges, this._parents)
  }
  node() {
    for (let groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
      for (let group = groups[j], i = 0, n = group.length; i < n; ++i) {
        const node = group[i]
        if (node) return node
      }
    }
    return null
  }
  nodes() {
    return Array.from(this)
  }
  on(typename, value, options) {
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
    on = value ? onAdd : onRemove
    for (i = 0; i < n; ++i) this.each(on(typenames[i], value, options))
    return this
  }
  order() {
    for (let groups = this._groups, j = -1, m = groups.length; ++j < m; ) {
      for (let group = groups[j], i = group.length - 1, next = group[i], node; --i >= 0; ) {
        if ((node = group[i])) {
          if (next && node.compareDocumentPosition(next) ^ 4) next.parentNode.insertBefore(node, next)
          next = node
        }
      }
    }
    return this
  }
  property(name, value) {
    return arguments.length > 1
      ? this.each(
          (value == null ? propertyRemove : typeof value === "function" ? propertyFunction : propertyConstant)(
            name,
            value
          )
        )
      : this.node()[name]
  }
  raise() {
    function raise() {
      if (this.nextSibling) this.parentNode.appendChild(this)
    }
    return this.each(raise)
  }
  remove() {
    function remove() {
      const parent = this.parentNode
      if (parent) parent.removeChild(this)
    }
    return this.each(remove)
  }
  select(select) {
    if (typeof select !== "function") select = selector(select)
    for (let groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
      for (
        let group = groups[j], n = group.length, subgroup = (subgroups[j] = new Array(n)), node, subnode, i = 0;
        i < n;
        ++i
      ) {
        if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
          if ("__data__" in node) subnode.__data__ = node.__data__
          subgroup[i] = subnode
        }
      }
    }
    return new Selection(subgroups, this._parents)
  }
  selectAll(select) {
    if (typeof select === "function") select = arrayAll(select)
    else select = selectorAll(select)
    for (let groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
      for (let group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
        if ((node = group[i])) {
          subgroups.push(select.call(node, node.__data__, i, group))
          parents.push(node)
        }
      }
    }
    return new Selection(subgroups, parents)
  }
  selectChild(match) {
    return this.select(
      match == null ? childFirst : childFind(typeof match === "function" ? match : childMatcher(match))
    )
  }
  selectChildren(match) {
    return this.selectAll(
      match == null ? children : childrenFilter(typeof match === "function" ? match : childMatcher(match))
    )
  }
  size() {
    let size = 0
    for (const node of this) ++size
    return size
  }
  sort(compare) {
    if (!compare) compare = ascending
    function compareNode(a, b) {
      return a && b ? compare(a.__data__, b.__data__) : !a - !b
    }
    for (let groups = this._groups, m = groups.length, sortgroups = new Array(m), j = 0; j < m; ++j) {
      for (
        let group = groups[j], n = group.length, sortgroup = (sortgroups[j] = new Array(n)), node, i = 0;
        i < n;
        ++i
      ) {
        if ((node = group[i])) {
          sortgroup[i] = node
        }
      }
      sortgroup.sort(compareNode)
    }
    return new Selection(sortgroups, this._parents).order()
  }
  style(name, value, priority) {
    return arguments.length > 1
      ? this.each(
          (value == null ? styleRemove : typeof value === "function" ? styleFunction : styleConstant)(
            name,
            value,
            priority == null ? "" : priority
          )
        )
      : styleValue(this.node(), name)
  }
  text(value) {
    return arguments.length
      ? this.each(value == null ? textRemove : (typeof value === "function" ? textFunction : textConstant)(value))
      : this.node().textContent
  }
}
function constantNull() {
  return null
}
function contextListener(listener) {
  return function (event) {
    listener.call(this, event, this.__data__)
  }
}
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
function onRemove(typename) {
  return function () {
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
function onAdd(typename, value, options) {
  return function () {
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
function propertyRemove(name) {
  return function () {
    delete this[name]
  }
}
function propertyConstant(name, value) {
  return function () {
    this[name] = value
  }
}
function propertyFunction(name, value) {
  return function () {
    const v = value.apply(this, arguments)
    if (v == null) delete this[name]
    else this[name] = v
  }
}
function arrayAll(select) {
  return function () {
    return array(select.apply(this, arguments))
  }
}
const find = Array.prototype.find
function childFind(match) {
  return function () {
    return find.call(this.children, match)
  }
}
function childFirst() {
  return this.firstElementChild
}
const filter = Array.prototype.filter
function children() {
  return Array.from(this.children)
}
function childrenFilter(match) {
  return function () {
    return filter.call(this.children, match)
  }
}
function ascending(a, b) {
  return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN
}
export function sparse(update) {
  return new Array(update.length)
}
function styleRemove(name) {
  return function () {
    this.style.removeProperty(name)
  }
}
function styleConstant(name, value, priority) {
  return function () {
    this.style.setProperty(name, value, priority)
  }
}
function styleFunction(name, value, priority) {
  return function () {
    const v = value.apply(this, arguments)
    if (v == null) this.style.removeProperty(name)
    else this.style.setProperty(name, v, priority)
  }
}
export function styleValue(node: Element, name: string): string {
  return node.style.getPropertyValue(name) || defaultView(node).getComputedStyle(node, null).getPropertyValue(name)
}
function textRemove() {
  this.textContent = ""
}
function textConstant(value) {
  return function () {
    this.textContent = value
  }
}
function textFunction(value) {
  return function () {
    const v = value.apply(this, arguments)
    this.textContent = v == null ? "" : v
  }
}
