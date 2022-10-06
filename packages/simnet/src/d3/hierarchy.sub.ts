export default function () {
  var node = this,
    nodes = [node]
  while ((node = node.parent)) {
    nodes.push(node)
  }
  return nodes
}
function count(node) {
  var sum = 0,
    children = node.children,
    i = children && children.length
  if (!i) sum = 1
  else while (--i >= 0) sum += children[i].value
  node.value = sum
}

export default function () {
  return this.eachAfter(count)
}
export default function () {
  return Array.from(this)
}
export default function (callback, that) {
  let index = -1
  for (const node of this) {
    callback.call(that, node, ++index, this)
  }
  return this
}
export default function (callback, that) {
  var node = this,
    nodes = [node],
    next = [],
    children,
    i,
    n,
    index = -1
  while ((node = nodes.pop())) {
    next.push(node)
    if ((children = node.children)) {
      for (i = 0, n = children.length; i < n; ++i) {
        nodes.push(children[i])
      }
    }
  }
  while ((node = next.pop())) {
    callback.call(that, node, ++index, this)
  }
  return this
}
export default function (callback, that) {
  var node = this,
    nodes = [node],
    children,
    i,
    index = -1
  while ((node = nodes.pop())) {
    callback.call(that, node, ++index, this)
    if ((children = node.children)) {
      for (i = children.length - 1; i >= 0; --i) {
        nodes.push(children[i])
      }
    }
  }
  return this
}
export default function (callback, that) {
  let index = -1
  for (const node of this) {
    if (callback.call(that, node, ++index, this)) {
      return node
    }
  }
}
import node_count from "./count.js"
import node_each from "./each.js"
import node_eachBefore from "./eachBefore.js"
import node_eachAfter from "./eachAfter.js"
import node_find from "./find.js"
import node_sum from "./sum.js"
import node_sort from "./sort.js"
import node_path from "./path.js"
import node_ancestors from "./ancestors.js"
import node_descendants from "./descendants.js"
import node_leaves from "./leaves.js"
import node_links from "./links.js"
import node_iterator from "./iterator.js"

export default function hierarchy(data, children) {
  if (data instanceof Map) {
    data = [undefined, data]
    if (children === undefined) children = mapChildren
  } else if (children === undefined) {
    children = objectChildren
  }

  var root = new Node(data),
    node,
    nodes = [root],
    child,
    childs,
    i,
    n

  while ((node = nodes.pop())) {
    if ((childs = children(node.data)) && (n = (childs = Array.from(childs)).length)) {
      node.children = childs
      for (i = n - 1; i >= 0; --i) {
        nodes.push((child = childs[i] = new Node(childs[i])))
        child.parent = node
        child.depth = node.depth + 1
      }
    }
  }

  return root.eachBefore(computeHeight)
}

function node_copy() {
  return hierarchy(this).eachBefore(copyData)
}

function objectChildren(d) {
  return d.children
}

function mapChildren(d) {
  return Array.isArray(d) ? d[1] : null
}

function copyData(node) {
  if (node.data.value !== undefined) node.value = node.data.value
  node.data = node.data.data
}

export function computeHeight(node) {
  var height = 0
  do node.height = height
  while ((node = node.parent) && node.height < ++height)
}

export function Node(data) {
  this.data = data
  this.depth = this.height = 0
  this.parent = null
}

Node.prototype = hierarchy.prototype = {
  constructor: Node,
  count: node_count,
  each: node_each,
  eachAfter: node_eachAfter,
  eachBefore: node_eachBefore,
  find: node_find,
  sum: node_sum,
  sort: node_sort,
  path: node_path,
  ancestors: node_ancestors,
  descendants: node_descendants,
  leaves: node_leaves,
  links: node_links,
  copy: node_copy,
  [Symbol.iterator]: node_iterator,
}
export default function* () {
  var node = this,
    current,
    next = [node],
    children,
    i,
    n
  do {
    ;(current = next.reverse()), (next = [])
    while ((node = current.pop())) {
      yield node
      if ((children = node.children)) {
        for (i = 0, n = children.length; i < n; ++i) {
          next.push(children[i])
        }
      }
    }
  } while (next.length)
}
export default function () {
  var leaves = []
  this.eachBefore(function (node) {
    if (!node.children) {
      leaves.push(node)
    }
  })
  return leaves
}
export default function () {
  var root = this,
    links = []
  root.each(function (node) {
    if (node !== root) {
      // Don’t include the root’s parent, if any.
      links.push({ source: node.parent, target: node })
    }
  })
  return links
}
export default function (end) {
  var start = this,
    ancestor = leastCommonAncestor(start, end),
    nodes = [start]
  while (start !== ancestor) {
    start = start.parent
    nodes.push(start)
  }
  var k = nodes.length
  while (end !== ancestor) {
    nodes.splice(k, 0, end)
    end = end.parent
  }
  return nodes
}

function leastCommonAncestor(a, b) {
  if (a === b) return a
  var aNodes = a.ancestors(),
    bNodes = b.ancestors(),
    c = null
  a = aNodes.pop()
  b = bNodes.pop()
  while (a === b) {
    c = a
    a = aNodes.pop()
    b = bNodes.pop()
  }
  return c
}
export default function (compare) {
  return this.eachBefore(function (node) {
    if (node.children) {
      node.children.sort(compare)
    }
  })
}
export default function (value) {
  return this.eachAfter(function (node) {
    var sum = +value(node.data) || 0,
      children = node.children,
      i = children && children.length
    while (--i >= 0) sum += children[i].value
    node.value = sum
  })
}
