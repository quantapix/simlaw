export function optional(f) {
  return f == null ? null : required(f)
}
export function required(f) {
  if (typeof f !== "function") throw new Error()
  return f
}
export function (x) {
  return typeof x === "object" && "length" in x
    ? x // Array, TypedArray, NodeList, array-like
    : Array.from(x) // Map, Set, iterable, string, or anything else
}
export function shuffle(array, random) {
  let m = array.length,
    t,
    i
  while (m) {
    i = (random() * m--) | 0
    t = array[m]
    array[m] = array[i]
    array[i] = t
  }
  return array
}
function defaultSeparation(a, b) {
  return a.parent === b.parent ? 1 : 2
}
function meanX(children) {
  return children.reduce(meanXReduce, 0) / children.length
}
function meanXReduce(x, c) {
  return x + c.x
}
function maxY(children) {
  return 1 + children.reduce(maxYReduce, 0)
}
function maxYReduce(y, c) {
  return Math.max(y, c.y)
}
function leafLeft(node) {
  var children
  while ((children = node.children)) node = children[0]
  return node
}
function leafRight(node) {
  var children
  while ((children = node.children)) node = children[children.length - 1]
  return node
}
export function () {
  var separation = defaultSeparation,
    dx = 1,
    dy = 1,
    nodeSize = false
  function cluster(root) {
    var previousNode,
      x = 0
    root.eachAfter(function (node) {
      var children = node.children
      if (children) {
        node.x = meanX(children)
        node.y = maxY(children)
      } else {
        node.x = previousNode ? (x += separation(node, previousNode)) : 0
        node.y = 0
        previousNode = node
      }
    })
    var left = leafLeft(root),
      right = leafRight(root),
      x0 = left.x - separation(left, right) / 2,
      x1 = right.x + separation(right, left) / 2
    return root.eachAfter(
      nodeSize
        ? function (node) {
            node.x = (node.x - root.x) * dx
            node.y = (root.y - node.y) * dy
          }
        : function (node) {
            node.x = ((node.x - x0) / (x1 - x0)) * dx
            node.y = (1 - (root.y ? node.y / root.y : 1)) * dy
          }
    )
  }
  cluster.separation = function (x) {
    return arguments.length ? ((separation = x), cluster) : separation
  }
  cluster.size = function (x) {
    return arguments.length ? ((nodeSize = false), (dx = +x[0]), (dy = +x[1]), cluster) : nodeSize ? null : [dx, dy]
  }
  cluster.nodeSize = function (x) {
    return arguments.length ? ((nodeSize = true), (dx = +x[0]), (dy = +x[1]), cluster) : nodeSize ? [dx, dy] : null
  }
  return cluster
}
export function constantZero() {
  return 0
}
export function (x) {
  return function () {
    return x
  }
}
export { default as cluster } from "./cluster.js"
export { default as hierarchy, Node } from "./hierarchy/index.js"
export { default as pack } from "./pack/index.js"
export { default as packSiblings } from "./pack/siblings.js"
export { default as packEnclose } from "./pack/enclose.js"
export { default as partition } from "./partition.js"
export { default as stratify } from "./stratify.js"
export { default as tree } from "./tree.js"
export { default as treemap } from "./treemap/index.js"
export { default as treemapBinary } from "./treemap/binary.js"
export { default as treemapDice } from "./treemap/dice.js"
export { default as treemapSlice } from "./treemap/slice.js"
export { default as treemapSliceDice } from "./treemap/sliceDice.js"
export { default as treemapSquarify } from "./treemap/squarify.js"
export { default as treemapResquarify } from "./treemap/resquarify.js"
const a = 1664525
const c = 1013904223
const m = 4294967296 // 2^32
export function () {
  let s = 1
  return () => (s = (a * s + c) % m) / m
}
import roundNode from "./treemap/round.js"
import treemapDice from "./treemap/dice.js"
export function () {
  var dx = 1,
    dy = 1,
    padding = 0,
    round = false
  function partition(root) {
    var n = root.height + 1
    root.x0 = root.y0 = padding
    root.x1 = dx
    root.y1 = dy / n
    root.eachBefore(positionNode(dy, n))
    if (round) root.eachBefore(roundNode)
    return root
  }
  function positionNode(dy, n) {
    return function (node) {
      if (node.children) {
        treemapDice(node, node.x0, (dy * (node.depth + 1)) / n, node.x1, (dy * (node.depth + 2)) / n)
      }
      var x0 = node.x0,
        y0 = node.y0,
        x1 = node.x1 - padding,
        y1 = node.y1 - padding
      if (x1 < x0) x0 = x1 = (x0 + x1) / 2
      if (y1 < y0) y0 = y1 = (y0 + y1) / 2
      node.x0 = x0
      node.y0 = y0
      node.x1 = x1
      node.y1 = y1
    }
  }
  partition.round = function (x) {
    return arguments.length ? ((round = !!x), partition) : round
  }
  partition.size = function (x) {
    return arguments.length ? ((dx = +x[0]), (dy = +x[1]), partition) : [dx, dy]
  }
  partition.padding = function (x) {
    return arguments.length ? ((padding = +x), partition) : padding
  }
  return partition
}
import { optional } from "./accessors.js"
import { Node, computeHeight } from "./hierarchy/index.js"
var preroot = { depth: -1 },
  ambiguous = {},
  imputed = {}
function defaultId(d) {
  return d.id
}
function defaultParentId(d) {
  return d.parentId
}
export function () {
  var id = defaultId,
    parentId = defaultParentId,
    path
  function stratify(data) {
    var nodes = Array.from(data),
      currentId = id,
      currentParentId = parentId,
      n,
      d,
      i,
      root,
      parent,
      node,
      nodeId,
      nodeKey,
      nodeByKey = new Map()
    if (path != null) {
      const I = nodes.map((d, i) => normalize(path(d, i, data)))
      const P = I.map(parentof)
      const S = new Set(I).add("")
      for (const i of P) {
        if (!S.has(i)) {
          S.add(i)
          I.push(i)
          P.push(parentof(i))
          nodes.push(imputed)
        }
      }
      currentId = (_, i) => I[i]
      currentParentId = (_, i) => P[i]
    }
    for (i = 0, n = nodes.length; i < n; ++i) {
      ;(d = nodes[i]), (node = nodes[i] = new Node(d))
      if ((nodeId = currentId(d, i, data)) != null && (nodeId += "")) {
        nodeKey = node.id = nodeId
        nodeByKey.set(nodeKey, nodeByKey.has(nodeKey) ? ambiguous : node)
      }
      if ((nodeId = currentParentId(d, i, data)) != null && (nodeId += "")) {
        node.parent = nodeId
      }
    }
    for (i = 0; i < n; ++i) {
      node = nodes[i]
      if ((nodeId = node.parent)) {
        parent = nodeByKey.get(nodeId)
        if (!parent) throw new Error("missing: " + nodeId)
        if (parent === ambiguous) throw new Error("ambiguous: " + nodeId)
        if (parent.children) parent.children.push(node)
        else parent.children = [node]
        node.parent = parent
      } else {
        if (root) throw new Error("multiple roots")
        root = node
      }
    }
    if (!root) throw new Error("no root")
    if (path != null) {
      while (root.data === imputed && root.children.length === 1) {
        ;(root = root.children[0]), --n
      }
      for (let i = nodes.length - 1; i >= 0; --i) {
        node = nodes[i]
        if (node.data !== imputed) break
        node.data = null
      }
    }
    root.parent = preroot
    root
      .eachBefore(function (node) {
        node.depth = node.parent.depth + 1
        --n
      })
      .eachBefore(computeHeight)
    root.parent = null
    if (n > 0) throw new Error("cycle")
    return root
  }
  stratify.id = function (x) {
    return arguments.length ? ((id = optional(x)), stratify) : id
  }
  stratify.parentId = function (x) {
    return arguments.length ? ((parentId = optional(x)), stratify) : parentId
  }
  stratify.path = function (x) {
    return arguments.length ? ((path = optional(x)), stratify) : path
  }
  return stratify
}
function normalize(path) {
  path = `${path}`
  let i = path.length
  if (slash(path, i - 1) && !slash(path, i - 2)) path = path.slice(0, -1)
  return path[0] === "/" ? path : `/${path}`
}
function parentof(path) {
  let i = path.length
  if (i < 2) return ""
  while (--i > 1) if (slash(path, i)) break
  return path.slice(0, i)
}
function slash(path, i) {
  if (path[i] === "/") {
    let k = 0
    while (i > 0 && path[--i] === "\\") ++k
    if ((k & 1) === 0) return true
  }
  return false
}
import { Node } from "./hierarchy/index.js"
function defaultSeparation(a, b) {
  return a.parent === b.parent ? 1 : 2
}
function nextLeft(v) {
  var children = v.children
  return children ? children[0] : v.t
}
function nextRight(v) {
  var children = v.children
  return children ? children[children.length - 1] : v.t
}
function moveSubtree(wm, wp, shift) {
  var change = shift / (wp.i - wm.i)
  wp.c -= change
  wp.s += shift
  wm.c += change
  wp.z += shift
  wp.m += shift
}
function executeShifts(v) {
  var shift = 0,
    change = 0,
    children = v.children,
    i = children.length,
    w
  while (--i >= 0) {
    w = children[i]
    w.z += shift
    w.m += shift
    shift += w.s + (change += w.c)
  }
}
function nextAncestor(vim, v, ancestor) {
  return vim.a.parent === v.parent ? vim.a : ancestor
}
function TreeNode(node, i) {
  this._ = node
  this.parent = null
  this.children = null
  this.A = null // default ancestor
  this.a = this // ancestor
  this.z = 0 // prelim
  this.m = 0 // mod
  this.c = 0 // change
  this.s = 0 // shift
  this.t = null // thread
  this.i = i // number
}
TreeNode.prototype = Object.create(Node.prototype)
function treeRoot(root) {
  var tree = new TreeNode(root, 0),
    node,
    nodes = [tree],
    child,
    children,
    i,
    n
  while ((node = nodes.pop())) {
    if ((children = node._.children)) {
      node.children = new Array((n = children.length))
      for (i = n - 1; i >= 0; --i) {
        nodes.push((child = node.children[i] = new TreeNode(children[i], i)))
        child.parent = node
      }
    }
  }
  ;(tree.parent = new TreeNode(null, 0)).children = [tree]
  return tree
}
export function () {
  var separation = defaultSeparation,
    dx = 1,
    dy = 1,
    nodeSize = null
  function tree(root) {
    var t = treeRoot(root)
    t.eachAfter(firstWalk), (t.parent.m = -t.z)
    t.eachBefore(secondWalk)
    if (nodeSize) root.eachBefore(sizeNode)
    else {
      var left = root,
        right = root,
        bottom = root
      root.eachBefore(function (node) {
        if (node.x < left.x) left = node
        if (node.x > right.x) right = node
        if (node.depth > bottom.depth) bottom = node
      })
      var s = left === right ? 1 : separation(left, right) / 2,
        tx = s - left.x,
        kx = dx / (right.x + s + tx),
        ky = dy / (bottom.depth || 1)
      root.eachBefore(function (node) {
        node.x = (node.x + tx) * kx
        node.y = node.depth * ky
      })
    }
    return root
  }
  function firstWalk(v) {
    var children = v.children,
      siblings = v.parent.children,
      w = v.i ? siblings[v.i - 1] : null
    if (children) {
      executeShifts(v)
      var midpoint = (children[0].z + children[children.length - 1].z) / 2
      if (w) {
        v.z = w.z + separation(v._, w._)
        v.m = v.z - midpoint
      } else {
        v.z = midpoint
      }
    } else if (w) {
      v.z = w.z + separation(v._, w._)
    }
    v.parent.A = apportion(v, w, v.parent.A || siblings[0])
  }
  function secondWalk(v) {
    v._.x = v.z + v.parent.m
    v.m += v.parent.m
  }
  function apportion(v, w, ancestor) {
    if (w) {
      var vip = v,
        vop = v,
        vim = w,
        vom = vip.parent.children[0],
        sip = vip.m,
        sop = vop.m,
        sim = vim.m,
        som = vom.m,
        shift
      while (((vim = nextRight(vim)), (vip = nextLeft(vip)), vim && vip)) {
        vom = nextLeft(vom)
        vop = nextRight(vop)
        vop.a = v
        shift = vim.z + sim - vip.z - sip + separation(vim._, vip._)
        if (shift > 0) {
          moveSubtree(nextAncestor(vim, v, ancestor), v, shift)
          sip += shift
          sop += shift
        }
        sim += vim.m
        sip += vip.m
        som += vom.m
        sop += vop.m
      }
      if (vim && !nextRight(vop)) {
        vop.t = vim
        vop.m += sim - sop
      }
      if (vip && !nextLeft(vom)) {
        vom.t = vip
        vom.m += sip - som
        ancestor = v
      }
    }
    return ancestor
  }
  function sizeNode(node) {
    node.x *= dx
    node.y = node.depth * dy
  }
  tree.separation = function (x) {
    return arguments.length ? ((separation = x), tree) : separation
  }
  tree.size = function (x) {
    return arguments.length ? ((nodeSize = false), (dx = +x[0]), (dy = +x[1]), tree) : nodeSize ? null : [dx, dy]
  }
  tree.nodeSize = function (x) {
    return arguments.length ? ((nodeSize = true), (dx = +x[0]), (dy = +x[1]), tree) : nodeSize ? [dx, dy] : null
  }
  return tree
}
