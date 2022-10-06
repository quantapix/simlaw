import creator from "../creator.js"

export function (name) {
  var create = typeof name === "function" ? name : creator(name)
  return this.select(function () {
    return this.appendChild(create.apply(this, arguments))
  })
}
import namespace from "../namespace.js"

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

function attrConstant(name, value) {
  return function () {
    this.setAttribute(name, value)
  }
}

function attrConstantNS(fullname, value) {
  return function () {
    this.setAttributeNS(fullname.space, fullname.local, value)
  }
}

function attrFunction(name, value) {
  return function () {
    var v = value.apply(this, arguments)
    if (v == null) this.removeAttribute(name)
    else this.setAttribute(name, v)
  }
}

function attrFunctionNS(fullname, value) {
  return function () {
    var v = value.apply(this, arguments)
    if (v == null) this.removeAttributeNS(fullname.space, fullname.local)
    else this.setAttributeNS(fullname.space, fullname.local, v)
  }
}

export function (name, value) {
  var fullname = namespace(name)

  if (arguments.length < 2) {
    var node = this.node()
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
export function () {
  var callback = arguments[0]
  arguments[0] = this
  callback.apply(null, arguments)
  return this
}
function classArray(string) {
  return string.trim().split(/^|\s+/)
}

function classList(node) {
  return node.classList || new ClassList(node)
}

function ClassList(node) {
  this._node = node
  this._names = classArray(node.getAttribute("class") || "")
}

ClassList.prototype = {
  add: function (name) {
    var i = this._names.indexOf(name)
    if (i < 0) {
      this._names.push(name)
      this._node.setAttribute("class", this._names.join(" "))
    }
  },
  remove: function (name) {
    var i = this._names.indexOf(name)
    if (i >= 0) {
      this._names.splice(i, 1)
      this._node.setAttribute("class", this._names.join(" "))
    }
  },
  contains: function (name) {
    return this._names.indexOf(name) >= 0
  },
}

function classedAdd(node, names) {
  var list = classList(node),
    i = -1,
    n = names.length
  while (++i < n) list.add(names[i])
}

function classedRemove(node, names) {
  var list = classList(node),
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

export function (name, value) {
  var names = classArray(name + "")

  if (arguments.length < 2) {
    var list = classList(this.node()),
      i = -1,
      n = names.length
    while (++i < n) if (!list.contains(names[i])) return false
    return true
  }

  return this.each((typeof value === "function" ? classedFunction : value ? classedTrue : classedFalse)(names, value))
}
function selection_cloneShallow() {
  var clone = this.cloneNode(false),
    parent = this.parentNode
  return parent ? parent.insertBefore(clone, this.nextSibling) : clone
}

function selection_cloneDeep() {
  var clone = this.cloneNode(true),
    parent = this.parentNode
  return parent ? parent.insertBefore(clone, this.nextSibling) : clone
}

export function (deep) {
  return this.select(deep ? selection_cloneDeep : selection_cloneShallow)
}
import { Selection } from "./index.js"
import { EnterNode } from "./enter.js"
import constant from "../constant.js"

function bindIndex(parent, group, enter, update, exit, data) {
  var i = 0,
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
  var i,
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

function datum(node) {
  return node.__data__
}

export function (value, key) {
  if (!arguments.length) return Array.from(this, datum)

  var bind = key ? bindKey : bindIndex,
    parents = this._parents,
    groups = this._groups

  if (typeof value !== "function") value = constant(value)

  for (var m = groups.length, update = new Array(m), enter = new Array(m), exit = new Array(m), j = 0; j < m; ++j) {
    var parent = parents[j],
      group = groups[j],
      groupLength = group.length,
      data = arraylike(value.call(parent, parent && parent.__data__, j, parents)),
      dataLength = data.length,
      enterGroup = (enter[j] = new Array(dataLength)),
      updateGroup = (update[j] = new Array(dataLength)),
      exitGroup = (exit[j] = new Array(groupLength))

    bind(parent, group, enterGroup, updateGroup, exitGroup, data, key)

    for (var i0 = 0, i1 = 0, previous, next; i0 < dataLength; ++i0) {
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

function arraylike(data) {
  return typeof data === "object" && "length" in data
    ? data // Array, TypedArray, NodeList, array-like
    : Array.from(data) // Map, Set, iterable, string, or anything else
}
export function (value) {
  return arguments.length ? this.property("__data__", value) : this.node().__data__
}
import defaultView from "../window.js"

function dispatchEvent(node, type, params) {
  var window = defaultView(node),
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

export function (type, params) {
  return this.each((typeof params === "function" ? dispatchFunction : dispatchConstant)(type, params))
}
export function (callback) {
  for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
    for (var group = groups[j], i = 0, n = group.length, node; i < n; ++i) {
      if ((node = group[i])) callback.call(node, node.__data__, i, group)
    }
  }

  return this
}
export function () {
  return !this.node()
}
import sparse from "./sparse.js"
import { Selection } from "./index.js"

export function () {
  return new Selection(this._enter || this._groups.map(sparse), this._parents)
}

export function EnterNode(parent, datum) {
  this.ownerDocument = parent.ownerDocument
  this.namespaceURI = parent.namespaceURI
  this._next = null
  this._parent = parent
  this.__data__ = datum
}

EnterNode.prototype = {
  constructor: EnterNode,
  appendChild: function (child) {
    return this._parent.insertBefore(child, this._next)
  },
  insertBefore: function (child, next) {
    return this._parent.insertBefore(child, next)
  },
  querySelector: function (selector) {
    return this._parent.querySelector(selector)
  },
  querySelectorAll: function (selector) {
    return this._parent.querySelectorAll(selector)
  },
}
import sparse from "./sparse.js"
import { Selection } from "./index.js"

export function () {
  return new Selection(this._exit || this._groups.map(sparse), this._parents)
}
import { Selection } from "./index.js"
import matcher from "../matcher.js"

export function (match) {
  if (typeof match !== "function") match = matcher(match)

  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = (subgroups[j] = []), node, i = 0; i < n; ++i) {
      if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
        subgroup.push(node)
      }
    }
  }

  return new Selection(subgroups, this._parents)
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
    var v = value.apply(this, arguments)
    this.innerHTML = v == null ? "" : v
  }
}

export function (value) {
  return arguments.length
    ? this.each(value == null ? htmlRemove : (typeof value === "function" ? htmlFunction : htmlConstant)(value))
    : this.node().innerHTML
}
import selection_select from "./select.js"
import selection_selectAll from "./selectAll.js"
import selection_selectChild from "./selectChild.js"
import selection_selectChildren from "./selectChildren.js"
import selection_filter from "./filter.js"
import selection_data from "./data.js"
import selection_enter from "./enter.js"
import selection_exit from "./exit.js"
import selection_join from "./join.js"
import selection_merge from "./merge.js"
import selection_order from "./order.js"
import selection_sort from "./sort.js"
import selection_call from "./call.js"
import selection_nodes from "./nodes.js"
import selection_node from "./node.js"
import selection_size from "./size.js"
import selection_empty from "./empty.js"
import selection_each from "./each.js"
import selection_attr from "./attr.js"
import selection_style from "./style.js"
import selection_property from "./property.js"
import selection_classed from "./classed.js"
import selection_text from "./text.js"
import selection_html from "./html.js"
import selection_raise from "./raise.js"
import selection_lower from "./lower.js"
import selection_append from "./append.js"
import selection_insert from "./insert.js"
import selection_remove from "./remove.js"
import selection_clone from "./clone.js"
import selection_datum from "./datum.js"
import selection_on from "./on.js"
import selection_dispatch from "./dispatch.js"
import selection_iterator from "./iterator.js"

export var root = [null]

export function Selection(groups, parents) {
  this._groups = groups
  this._parents = parents
}

function selection() {
  return new Selection([[document.documentElement]], root)
}

function selection_selection() {
  return this
}

Selection.prototype = selection.prototype = {
  constructor: Selection,
  select: selection_select,
  selectAll: selection_selectAll,
  selectChild: selection_selectChild,
  selectChildren: selection_selectChildren,
  filter: selection_filter,
  data: selection_data,
  enter: selection_enter,
  exit: selection_exit,
  join: selection_join,
  merge: selection_merge,
  selection: selection_selection,
  order: selection_order,
  sort: selection_sort,
  call: selection_call,
  nodes: selection_nodes,
  node: selection_node,
  size: selection_size,
  empty: selection_empty,
  each: selection_each,
  attr: selection_attr,
  style: selection_style,
  property: selection_property,
  classed: selection_classed,
  text: selection_text,
  html: selection_html,
  raise: selection_raise,
  lower: selection_lower,
  append: selection_append,
  insert: selection_insert,
  remove: selection_remove,
  clone: selection_clone,
  datum: selection_datum,
  on: selection_on,
  dispatch: selection_dispatch,
  [Symbol.iterator]: selection_iterator,
}

export default selection
import creator from "../creator.js"
import selector from "../selector.js"

function constantNull() {
  return null
}

export function (name, before) {
  var create = typeof name === "function" ? name : creator(name),
    select = before == null ? constantNull : typeof before === "function" ? before : selector(before)
  return this.select(function () {
    return this.insertBefore(create.apply(this, arguments), select.apply(this, arguments) || null)
  })
}
export function* () {
  for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
    for (var group = groups[j], i = 0, n = group.length, node; i < n; ++i) {
      if ((node = group[i])) yield node
    }
  }
}
export function (onenter, onupdate, onexit) {
  var enter = this.enter(),
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
function lower() {
  if (this.previousSibling) this.parentNode.insertBefore(this, this.parentNode.firstChild)
}

export function () {
  return this.each(lower)
}
import { Selection } from "./index.js"

export function (context) {
  var selection = context.selection ? context.selection() : context

  for (
    var groups0 = this._groups,
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

  return new Selection(merges, this._parents)
}
export function () {
  for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
    for (var group = groups[j], i = 0, n = group.length; i < n; ++i) {
      var node = group[i]
      if (node) return node
    }
  }

  return null
}
export function () {
  return Array.from(this)
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
      var name = "",
        i = t.indexOf(".")
      if (i >= 0) (name = t.slice(i + 1)), (t = t.slice(0, i))
      return { type: t, name: name }
    })
}

function onRemove(typename) {
  return function () {
    var on = this.__on
    if (!on) return
    for (var j = 0, i = -1, m = on.length, o; j < m; ++j) {
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
    var on = this.__on,
      o,
      listener = contextListener(value)
    if (on)
      for (var j = 0, m = on.length; j < m; ++j) {
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

export function (typename, value, options) {
  var typenames = parseTypenames(typename + ""),
    i,
    n = typenames.length,
    t

  if (arguments.length < 2) {
    var on = this.node().__on
    if (on)
      for (var j = 0, m = on.length, o; j < m; ++j) {
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
export function () {
  for (var groups = this._groups, j = -1, m = groups.length; ++j < m; ) {
    for (var group = groups[j], i = group.length - 1, next = group[i], node; --i >= 0; ) {
      if ((node = group[i])) {
        if (next && node.compareDocumentPosition(next) ^ 4) next.parentNode.insertBefore(node, next)
        next = node
      }
    }
  }

  return this
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
    var v = value.apply(this, arguments)
    if (v == null) delete this[name]
    else this[name] = v
  }
}

export function (name, value) {
  return arguments.length > 1
    ? this.each(
        (value == null ? propertyRemove : typeof value === "function" ? propertyFunction : propertyConstant)(
          name,
          value
        )
      )
    : this.node()[name]
}
function raise() {
  if (this.nextSibling) this.parentNode.appendChild(this)
}

export function () {
  return this.each(raise)
}
function remove() {
  var parent = this.parentNode
  if (parent) parent.removeChild(this)
}

export function () {
  return this.each(remove)
}
import { Selection } from "./index.js"
import selector from "../selector.js"

export function (select) {
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
      }
    }
  }

  return new Selection(subgroups, this._parents)
}
import { Selection } from "./index.js"
import array from "../array.js"
import selectorAll from "../selectorAll.js"

function arrayAll(select) {
  return function () {
    return array(select.apply(this, arguments))
  }
}

export function (select) {
  if (typeof select === "function") select = arrayAll(select)
  else select = selectorAll(select)

  for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
      if ((node = group[i])) {
        subgroups.push(select.call(node, node.__data__, i, group))
        parents.push(node)
      }
    }
  }

  return new Selection(subgroups, parents)
}
import { childMatcher } from "../matcher.js"

var find = Array.prototype.find

function childFind(match) {
  return function () {
    return find.call(this.children, match)
  }
}

function childFirst() {
  return this.firstElementChild
}

export function (match) {
  return this.select(match == null ? childFirst : childFind(typeof match === "function" ? match : childMatcher(match)))
}
import { childMatcher } from "../matcher.js"

var filter = Array.prototype.filter

function children() {
  return Array.from(this.children)
}

function childrenFilter(match) {
  return function () {
    return filter.call(this.children, match)
  }
}

export function (match) {
  return this.selectAll(
    match == null ? children : childrenFilter(typeof match === "function" ? match : childMatcher(match))
  )
}
export function () {
  let size = 0
  for (const node of this) ++size // eslint-disable-line no-unused-vars
  return size
}
import { Selection } from "./index.js"

export function (compare) {
  if (!compare) compare = ascending

  function compareNode(a, b) {
    return a && b ? compare(a.__data__, b.__data__) : !a - !b
  }

  for (var groups = this._groups, m = groups.length, sortgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, sortgroup = (sortgroups[j] = new Array(n)), node, i = 0; i < n; ++i) {
      if ((node = group[i])) {
        sortgroup[i] = node
      }
    }
    sortgroup.sort(compareNode)
  }

  return new Selection(sortgroups, this._parents).order()
}

function ascending(a, b) {
  return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN
}
export function (update) {
  return new Array(update.length)
}
import defaultView from "../window.js"

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
    var v = value.apply(this, arguments)
    if (v == null) this.style.removeProperty(name)
    else this.style.setProperty(name, v, priority)
  }
}

export function (name, value, priority) {
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

export function styleValue(node, name) {
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
    var v = value.apply(this, arguments)
    this.textContent = v == null ? "" : v
  }
}

export function (value) {
  return arguments.length
    ? this.each(value == null ? textRemove : (typeof value === "function" ? textFunction : textConstant)(value))
    : this.node().textContent
}
