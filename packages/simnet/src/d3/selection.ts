// Given something array like (or null), returns something that is strictly an
// array. This is used to ensure that array-like objects passed to d3.selectAll
// or selection.selectAll are converted into proper arrays when creating a
// selection; we don’t ever want to create a selection backed by a live
// HTMLCollection or NodeList. However, note that selection.selectAll will use a
// static NodeList as a group, since it safely derived from querySelectorAll.
export default function array(x) {
  return x == null ? [] : Array.isArray(x) ? x : Array.from(x)
}
export default function (x) {
  return function () {
    return x
  }
}
import creator from "./creator.js"
import select from "./select.js"

export default function (name) {
  return select(creator(name).call(document.documentElement))
}
import namespace from "./namespace.js"
import { xhtml } from "./namespaces.js"

function creatorInherit(name) {
  return function () {
    var document = this.ownerDocument,
      uri = this.namespaceURI
    return uri === xhtml && document.documentElement.namespaceURI === xhtml
      ? document.createElement(name)
      : document.createElementNS(uri, name)
  }
}

function creatorFixed(fullname) {
  return function () {
    return this.ownerDocument.createElementNS(fullname.space, fullname.local)
  }
}

export default function (name) {
  var fullname = namespace(name)
  return (fullname.local ? creatorFixed : creatorInherit)(fullname)
}
export default function (x) {
  return x
}
export { default as create } from "./create.js"
export { default as creator } from "./creator.js"
export { default as local } from "./local.js"
export { default as matcher } from "./matcher.js"
export { default as namespace } from "./namespace.js"
export { default as namespaces } from "./namespaces.js"
export { default as pointer } from "./pointer.js"
export { default as pointers } from "./pointers.js"
export { default as select } from "./select.js"
export { default as selectAll } from "./selectAll.js"
export { default as selection } from "./selection/index.js"
export { default as selector } from "./selector.js"
export { default as selectorAll } from "./selectorAll.js"
export { styleValue as style } from "./selection/style.js"
export { default as window } from "./window.js"
var nextId = 0

export default function local() {
  return new Local()
}

function Local() {
  this._ = "@" + (++nextId).toString(36)
}

Local.prototype = local.prototype = {
  constructor: Local,
  get: function (node) {
    var id = this._
    while (!(id in node)) if (!(node = node.parentNode)) return
    return node[id]
  },
  set: function (node, value) {
    return (node[this._] = value)
  },
  remove: function (node) {
    return this._ in node && delete node[this._]
  },
  toString: function () {
    return this._
  },
}
export default function (selector) {
  return function () {
    return this.matches(selector)
  }
}

export function childMatcher(selector) {
  return function (node) {
    return node.matches(selector)
  }
}

import namespaces from "./namespaces.js"

export default function (name) {
  var prefix = (name += ""),
    i = prefix.indexOf(":")
  if (i >= 0 && (prefix = name.slice(0, i)) !== "xmlns") name = name.slice(i + 1)
  return namespaces.hasOwnProperty(prefix) ? { space: namespaces[prefix], local: name } : name // eslint-disable-line no-prototype-builtins
}
export var xhtml = "http://www.w3.org/1999/xhtml"

export default {
  svg: "http://www.w3.org/2000/svg",
  xhtml: xhtml,
  xlink: "http://www.w3.org/1999/xlink",
  xml: "http://www.w3.org/XML/1998/namespace",
  xmlns: "http://www.w3.org/2000/xmlns/",
}
import sourceEvent from "./sourceEvent.js"

export default function (event, node) {
  event = sourceEvent(event)
  if (node === undefined) node = event.currentTarget
  if (node) {
    var svg = node.ownerSVGElement || node
    if (svg.createSVGPoint) {
      var point = svg.createSVGPoint()
      ;(point.x = event.clientX), (point.y = event.clientY)
      point = point.matrixTransform(node.getScreenCTM().inverse())
      return [point.x, point.y]
    }
    if (node.getBoundingClientRect) {
      var rect = node.getBoundingClientRect()
      return [event.clientX - rect.left - node.clientLeft, event.clientY - rect.top - node.clientTop]
    }
  }
  return [event.pageX, event.pageY]
}
import pointer from "./pointer.js"
import sourceEvent from "./sourceEvent.js"

export default function (events, node) {
  if (events.target) {
    // i.e., instanceof Event, not TouchList or iterable
    events = sourceEvent(events)
    if (node === undefined) node = events.currentTarget
    events = events.touches || [events]
  }
  return Array.from(events, event => pointer(event, node))
}
import { Selection, root } from "./selection/index.js"

export default function (selector) {
  return typeof selector === "string"
    ? new Selection([[document.querySelector(selector)]], [document.documentElement])
    : new Selection([[selector]], root)
}
import array from "./array.js"
import { Selection, root } from "./selection/index.js"

export default function (selector) {
  return typeof selector === "string"
    ? new Selection([document.querySelectorAll(selector)], [document.documentElement])
    : new Selection([array(selector)], root)
}
function none() {}

export default function (selector) {
  return selector == null
    ? none
    : function () {
        return this.querySelector(selector)
      }
}
function empty() {
  return []
}

export default function (selector) {
  return selector == null
    ? empty
    : function () {
        return this.querySelectorAll(selector)
      }
}
export default function (event) {
  let sourceEvent
  while ((sourceEvent = event.sourceEvent)) event = sourceEvent
  return event
}
export default function (node) {
  return (
    (node.ownerDocument && node.ownerDocument.defaultView) || // node is a Node
    (node.document && node) || // node is a Window
    node.defaultView
  ) // node is a Document
}
