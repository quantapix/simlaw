/* eslint-disable @typescript-eslint/no-this-alias */
import type * as qt from "./types.js"

export function hierarchy<T>(data: T, children?: (x: T) => Iterable<T> | null | undefined): qt.HierarchyNode<T> {
  if (data instanceof Map) {
    data = [undefined, data]
    if (children === undefined) children = mapChildren
  } else if (children === undefined) children = objectChildren
  const root = new Node(data)
  let node,
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

function objectChildren(x: any) {
  return x.children
}
function mapChildren(x: any) {
  return Array.isArray(x) ? x[1] : null
}
function copyData(x) {
  if (x.data.value !== undefined) x.value = x.data.value
  x.data = x.data.data
}
function computeHeight(x) {
  let height = 0
  do x.height = height
  while ((x = x.parent) && x.height < ++height)
}

export class Node<T> implements qt.HierarchyNode<T> {
  children?: this[]
  parent = null
  depth = 0
  height = 0
  constructor(public data: T) {}
  ancestors() {
    let y: this | null = this
    const ys = [y]
    while ((y = y.parent)) {
      ys.push(y)
    }
    return ys
  }
  copy() {
    return hierarchy(this).eachBefore(copyData)
  }
  count() {
    const count = (x: this) => {
      const cs = x.children
      let sum = 0,
        i = cs && cs.length
      if (!i) sum = 1
      else while (--i >= 0) sum += cs[i]?.value
      x.value = sum
    }
    return this.eachAfter(count)
  }
  descendants() {
    return Array.from(this)
  }
  each<U = undefined>(f: (this: U, x: this, i: number, thisNode: this) => void, ctx?: U): this
  each(f: any, ctx?: unknown) {
    let i = -1
    for (const y of this) {
      f.call(ctx, y, ++i, this)
    }
    return this
  }
  eachAfter<U = undefined>(f: (this: U, x: this, i: number, thisNode: this) => void, ctx?: U): this
  eachAfter(f: any, ctx?: unknown) {
    let y: this | undefined = this
    const ys = [y]
    const next = []
    while ((y = ys.pop())) {
      next.push(y)
      let cs
      if ((cs = y.children)) {
        for (const c of cs) {
          ys.push(c)
        }
      }
    }
    let i = -1
    while ((y = next.pop())) {
      f.call(ctx, y, ++i, this)
    }
    return this
  }
  eachBefore<U = undefined>(f: (this: U, x: this, i: number, thisNode: this) => void, ctx?: U): this
  eachBefore(f: any, ctx?: unknown) {
    let y: this | undefined = this
    const ys = [y]
    let i = -1
    while ((y = ys.pop())) {
      f.call(ctx, y, ++i, this)
      let cs
      if ((cs = y.children)) {
        for (let j = cs.length - 1; j >= 0; --j) {
          ys.push(cs[j])
        }
      }
    }
    return this
  }
  find(f: (x: this) => boolean): this | undefined
  find(f: any, ctx?: unknown) {
    let i = -1
    for (const y of this) {
      if (f.call(ctx, y, ++i, this)) return y
    }
    return
  }
  *iterator() {
    let y: this | undefined = this,
      current,
      next = [y]
    do {
      ;(current = next.reverse()), (next = [])
      while ((y = current.pop())) {
        yield y
        let cs
        if ((cs = y.children)) {
          for (const c of cs) {
            next.push(c)
          }
        }
      }
    } while (next.length)
  }
  [Symbol.iterator] = this.iterator
  leaves() {
    const ys: this[] = []
    this.eachBefore(x => {
      if (!x.children) ys.push(x)
    })
    return ys
  }
  links() {
    const ys: qt.HierarchyLink<T>[] = []
    this.each(x => {
      if (x !== this) ys.push({ source: x.parent, target: x })
    })
    return ys
  }
  path(end: this) {
    let y: this | null = this
    const ys = [y]
    const ancestor = leastCommonAncestor(y, end)
    while (y !== ancestor) {
      y = y?.parent
      ys.push(y)
    }
    const k = ys.length
    while (end !== ancestor) {
      ys.splice(k, 0, end)
      end = end.parent
    }
    return ys
  }
  sort(f: (a: this, b: this) => number): this
  sort(f: any) {
    return this.eachBefore((x: any) => {
      if (x.children) x.children.sort(f)
    })
  }
  sum(f: (x: T) => number): this
  sum(f: any) {
    return this.eachAfter((x: any) => {
      const cs = x.children
      let y = +f(x.data) || 0
      let i = cs && cs.length
      while (--i >= 0) y += cs[i].value
      x.value = y
    })
  }
}

function leastCommonAncestor(a, b) {
  if (a === b) return a
  const aNodes = a.ancestors(),
    bNodes = b.ancestors()
  let c = null
  a = aNodes.pop()
  b = bNodes.pop()
  while (a === b) {
    c = a
    a = aNodes.pop()
    b = bNodes.pop()
  }
  return c
}

export function optional(x: any) {
  return x == null ? null : required(x)
}
export function required(x: any) {
  if (typeof x !== "function") throw new Error()
  return x
}
export function array(x: any) {
  return typeof x === "object" && "length" in x ? x : Array.from(x)
}
export function shuffle(x, random) {
  let m = x.length,
    t,
    i
  while (m) {
    i = (random() * m--) | 0
    t = x[m]
    x[m] = x[i]
    x[i] = t
  }
  return x
}
function defaultSeparation(a, b) {
  return a.parent === b.parent ? 1 : 2
}
function meanX(xs) {
  return xs.reduce(meanXReduce, 0) / xs.length
}
function meanXReduce(x, c) {
  return x + c.x
}
function maxY(xs) {
  return 1 + xs.reduce(maxYReduce, 0)
}
function maxYReduce(y, c) {
  return Math.max(y, c.y)
}
function leafLeft(x) {
  let cs
  while ((cs = x.children)) x = cs[0]
  return x
}
function leafRight(x) {
  let cs
  while ((cs = x.children)) x = cs[cs.length - 1]
  return x
}
export function cluster<T>(): qt.ClusterLayout<T> {
  let separation = defaultSeparation,
    dx = 1,
    dy = 1,
    nodeSize = false
  function y(root) {
    let previousNode,
      x = 0
    root.eachAfter(function (node) {
      let children = node.children
      if (children) {
        node.x = meanX(children)
        node.y = maxY(children)
      } else {
        node.x = previousNode ? (x += separation(node, previousNode)) : 0
        node.y = 0
        previousNode = node
      }
    })
    let left = leafLeft(root),
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
  y.separation = function (x) {
    return arguments.length ? ((separation = x), y) : separation
  }
  y.size = function (x) {
    return arguments.length ? ((nodeSize = false), (dx = +x[0]), (dy = +x[1]), y) : nodeSize ? null : [dx, dy]
  }
  y.nodeSize = function (x) {
    return arguments.length ? ((nodeSize = true), (dx = +x[0]), (dy = +x[1]), y) : nodeSize ? [dx, dy] : null
  }
  return y
}
export function constantZero() {
  return 0
}
export function constant(x) {
  return function () {
    return x
  }
}
export { default as pack } from "./pack/index.js"
export { default as packSiblings } from "./pack/siblings.js"
export { default as packEnclose } from "./pack/enclose.js"
export { default as partition } from "./partition.js"
export { default as stratify } from "./stratify.js"
export { default as tree } from "./tree.js"

const a = 1664525
const c = 1013904223
const m = 4294967296 // 2^32
export function lcg() {
  let s = 1
  return () => (s = (a * s + c) % m) / m
}
export function partition<T>(): qt.PartitionLayout<T> {
  let dx = 1,
    dy = 1,
    padding = 0,
    round = false
  function partition(root) {
    let n = root.height + 1
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
      let x0 = node.x0,
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
let preroot = { depth: -1 },
  ambiguous = {},
  imputed = {}
function defaultId(d) {
  return d.id
}
function defaultParentId(d) {
  return d.parentId
}
export function stratify<T>(): qt.StratifyOperator<T> {
  let id = defaultId,
    parentId = defaultParentId,
    path
  function stratify(data) {
    let nodes = Array.from(data),
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
function nextLeft(v) {
  let children = v.children
  return children ? children[0] : v.t
}
function nextRight(v) {
  let children = v.children
  return children ? children[children.length - 1] : v.t
}
function moveSubtree(wm, wp, shift) {
  let change = shift / (wp.i - wm.i)
  wp.c -= change
  wp.s += shift
  wm.c += change
  wp.z += shift
  wp.m += shift
}
function executeShifts(v) {
  let shift = 0,
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
class TreeNode {
  parent = null
  children = null
  A = null // default ancestor
  a = this // ancestor
  z = 0 // prelim
  m = 0 // mod
  c = 0 // change
  s = 0 // shift
  t = null // thread
  constructor(public node, public i) {}
}
TreeNode.prototype = Object.create(Node.prototype)
function treeRoot(root) {
  let tree = new TreeNode(root, 0),
    node,
    nodes = [tree],
    child,
    children,
    i,
    n
  while ((node = nodes.pop())) {
    if ((children = node.node.children)) {
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
export function tree<T>(): qt.TreeLayout<T> {
  let separation = defaultSeparation,
    dx = 1,
    dy = 1,
    nodeSize = null
  function tree(root) {
    let t = treeRoot(root)
    t.eachAfter(firstWalk), (t.parent.m = -t.z)
    t.eachBefore(secondWalk)
    if (nodeSize) root.eachBefore(sizeNode)
    else {
      let left = root,
        right = root,
        bottom = root
      root.eachBefore(function (node) {
        if (node.x < left.x) left = node
        if (node.x > right.x) right = node
        if (node.depth > bottom.depth) bottom = node
      })
      let s = left === right ? 1 : separation(left, right) / 2,
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
    let children = v.children,
      siblings = v.parent.children,
      w = v.i ? siblings[v.i - 1] : null
    if (children) {
      executeShifts(v)
      let midpoint = (children[0].z + children[children.length - 1].z) / 2
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
      let vip = v,
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

export const phi = (1 + Math.sqrt(5)) / 2

export function treemapBinary(
  parent: qt.HierarchyRectangularNode<any>,
  x0: number,
  y0: number,
  x1: number,
  y1: number
): void {
  let nodes = parent.children,
    i,
    n = nodes.length,
    sum,
    sums = new Array(n + 1)
  for (sums[0] = sum = i = 0; i < n; ++i) {
    sums[i + 1] = sum += nodes[i].value
  }
  partition(0, n, parent.value, x0, y0, x1, y1)
  function partition(i, j, value, x0, y0, x1, y1) {
    if (i >= j - 1) {
      let node = nodes[i]
      ;(node.x0 = x0), (node.y0 = y0)
      ;(node.x1 = x1), (node.y1 = y1)
      return
    }
    let valueOffset = sums[i],
      valueTarget = value / 2 + valueOffset,
      k = i + 1,
      hi = j - 1
    while (k < hi) {
      let mid = (k + hi) >>> 1
      if (sums[mid] < valueTarget) k = mid + 1
      else hi = mid
    }
    if (valueTarget - sums[k - 1] < sums[k] - valueTarget && i + 1 < k) --k
    let valueLeft = sums[k] - valueOffset,
      valueRight = value - valueLeft
    if (x1 - x0 > y1 - y0) {
      let xk = value ? (x0 * valueRight + x1 * valueLeft) / value : x1
      partition(i, k, valueLeft, x0, y0, xk, y1)
      partition(k, j, valueRight, xk, y0, x1, y1)
    } else {
      let yk = value ? (y0 * valueRight + y1 * valueLeft) / value : y1
      partition(i, k, valueLeft, x0, y0, x1, yk)
      partition(k, j, valueRight, x0, yk, x1, y1)
    }
  }
}
export function treemapDice(
  parent: qt.HierarchyRectangularNode<any>,
  x0: number,
  y0: number,
  x1: number,
  y1: number
): void {
  const ys = parent.children
  let node,
    i = -1,
    n = ys.length,
    k = parent.value && (x1 - x0) / parent.value
  while (++i < n) {
    ;(node = ys[i]), (node.y0 = y0), (node.y1 = y1)
    ;(node.x0 = x0), (node.x1 = x0 += node.value * k)
  }
}

export function treemap<T>(): qt.TreemapLayout<T> {
  let tile = squarify,
    round = false,
    dx = 1,
    dy = 1,
    paddingStack = [0],
    paddingInner = constantZero,
    paddingTop = constantZero,
    paddingRight = constantZero,
    paddingBottom = constantZero,
    paddingLeft = constantZero
  function treemap(root) {
    root.x0 = root.y0 = 0
    root.x1 = dx
    root.y1 = dy
    root.eachBefore(positionNode)
    paddingStack = [0]
    if (round) root.eachBefore(roundNode)
    return root
  }
  function positionNode(node) {
    let p = paddingStack[node.depth],
      x0 = node.x0 + p,
      y0 = node.y0 + p,
      x1 = node.x1 - p,
      y1 = node.y1 - p
    if (x1 < x0) x0 = x1 = (x0 + x1) / 2
    if (y1 < y0) y0 = y1 = (y0 + y1) / 2
    node.x0 = x0
    node.y0 = y0
    node.x1 = x1
    node.y1 = y1
    if (node.children) {
      p = paddingStack[node.depth + 1] = paddingInner(node) / 2
      x0 += paddingLeft(node) - p
      y0 += paddingTop(node) - p
      x1 -= paddingRight(node) - p
      y1 -= paddingBottom(node) - p
      if (x1 < x0) x0 = x1 = (x0 + x1) / 2
      if (y1 < y0) y0 = y1 = (y0 + y1) / 2
      tile(node, x0, y0, x1, y1)
    }
  }
  treemap.round = function (x) {
    return arguments.length ? ((round = !!x), treemap) : round
  }
  treemap.size = function (x) {
    return arguments.length ? ((dx = +x[0]), (dy = +x[1]), treemap) : [dx, dy]
  }
  treemap.tile = function (x) {
    return arguments.length ? ((tile = required(x)), treemap) : tile
  }
  treemap.padding = function (x) {
    return arguments.length ? treemap.paddingInner(x).paddingOuter(x) : treemap.paddingInner()
  }
  treemap.paddingInner = function (x) {
    return arguments.length ? ((paddingInner = typeof x === "function" ? x : constant(+x)), treemap) : paddingInner
  }
  treemap.paddingOuter = function (x) {
    return arguments.length
      ? treemap.paddingTop(x).paddingRight(x).paddingBottom(x).paddingLeft(x)
      : treemap.paddingTop()
  }
  treemap.paddingTop = function (x) {
    return arguments.length ? ((paddingTop = typeof x === "function" ? x : constant(+x)), treemap) : paddingTop
  }
  treemap.paddingRight = function (x) {
    return arguments.length ? ((paddingRight = typeof x === "function" ? x : constant(+x)), treemap) : paddingRight
  }
  treemap.paddingBottom = function (x) {
    return arguments.length ? ((paddingBottom = typeof x === "function" ? x : constant(+x)), treemap) : paddingBottom
  }
  treemap.paddingLeft = function (x) {
    return arguments.length ? ((paddingLeft = typeof x === "function" ? x : constant(+x)), treemap) : paddingLeft
  }
  return treemap
}

export const treemapResquarify: qt.RatioSquarifyTilingFactory = (function f(ratio) {
  function y(parent, x0, y0, x1, y1) {
    let rows: any
    if ((rows = parent._squarify) && rows.ratio === ratio) {
      let row,
        nodes,
        i,
        j = -1,
        n,
        m = rows.length,
        value = parent.value
      while (++j < m) {
        ;(row = rows[j]), (nodes = row.children)
        for (i = row.value = 0, n = nodes.length; i < n; ++i) row.value += nodes[i].value
        if (row.dice) dice(row, x0, y0, x1, value ? (y0 += ((y1 - y0) * row.value) / value) : y1)
        else slice(row, x0, y0, value ? (x0 += ((x1 - x0) * row.value) / value) : x1, y1)
        value -= row.value
      }
    } else {
      parent._squarify = rows = squarifyRatio(ratio, parent, x0, y0, x1, y1)
      rows.ratio = ratio
    }
  }
  y.ratio = x => f((x = +x) > 1 ? x : 1)
  return y
})(phi)

export function roundNode(x) {
  x.x0 = Math.round(x.x0)
  x.y0 = Math.round(x.y0)
  x.x1 = Math.round(x.x1)
  x.y1 = Math.round(x.y1)
}

export function treemapSlice(
  parent: qt.HierarchyRectangularNode<any>,
  x0: number,
  y0: number,
  x1: number,
  y1: number
): void {
  let ys = parent.children,
    node,
    i = -1,
    n = ys.length,
    k = parent.value && (y1 - y0) / parent.value
  while (++i < n) {
    ;(node = ys[i]), (node.x0 = x0), (node.x1 = x1)
    ;(node.y0 = y0), (node.y1 = y0 += node.value * k)
  }
}

export function treemapSliceDice(
  parent: qt.HierarchyRectangularNode<any>,
  x0: number,
  y0: number,
  x1: number,
  y1: number
): void {
  ;(parent.depth & 1 ? treemapSlice : treemapDice)(parent, x0, y0, x1, y1)
}

function squarifyRatio(ratio, parent, x0, y0, x1, y1) {
  let rows = [],
    nodes = parent.children,
    row,
    nodeValue,
    i0 = 0,
    i1 = 0,
    n = nodes.length,
    dx,
    dy,
    value = parent.value,
    sumValue,
    minValue,
    maxValue,
    newRatio,
    minRatio,
    alpha,
    beta
  while (i0 < n) {
    ;(dx = x1 - x0), (dy = y1 - y0)
    do sumValue = nodes[i1++].value
    while (!sumValue && i1 < n)
    minValue = maxValue = sumValue
    alpha = Math.max(dy / dx, dx / dy) / (value * ratio)
    beta = sumValue * sumValue * alpha
    minRatio = Math.max(maxValue / beta, beta / minValue)
    for (; i1 < n; ++i1) {
      sumValue += nodeValue = nodes[i1].value
      if (nodeValue < minValue) minValue = nodeValue
      if (nodeValue > maxValue) maxValue = nodeValue
      beta = sumValue * sumValue * alpha
      newRatio = Math.max(maxValue / beta, beta / minValue)
      if (newRatio > minRatio) {
        sumValue -= nodeValue
        break
      }
      minRatio = newRatio
    }
    rows.push((row = { value: sumValue, dice: dx < dy, children: nodes.slice(i0, i1) }))
    if (row.dice) dice(row, x0, y0, x1, value ? (y0 += (dy * sumValue) / value) : y1)
    else slice(row, x0, y0, value ? (x0 += (dx * sumValue) / value) : x1, y1)
    ;(value -= sumValue), (i0 = i1)
  }
  return rows
}

export const treemapSquarify: qt.RatioSquarifyTilingFactory = (function f(ratio) {
  function y(parent, x0, y0, x1, y1) {
    squarifyRatio(ratio, parent, x0, y0, x1, y1)
  }
  y.ratio = x => f((x = +x) > 1 ? x : 1)
  return y
})(phi)

export function packEnclose<T extends qt.PackCircle>(xs: T[]): qt.PackCircle {
  return packEncloseRandom(xs, lcg())
}
export function packEncloseRandom(circles, random) {
  let i = 0,
    n = (circles = shuffle(Array.from(circles), random)).length,
    B = [],
    p,
    e
  while (i < n) {
    p = circles[i]
    if (e && enclosesWeak(e, p)) ++i
    else (e = encloseBasis((B = extendBasis(B, p)))), (i = 0)
  }
  return e
}
function extendBasis(B, p) {
  let i, j
  if (enclosesWeakAll(p, B)) return [p]
  for (i = 0; i < B.length; ++i) {
    if (enclosesNot(p, B[i]) && enclosesWeakAll(encloseBasis2(B[i], p), B)) {
      return [B[i], p]
    }
  }
  for (i = 0; i < B.length - 1; ++i) {
    for (j = i + 1; j < B.length; ++j) {
      if (
        enclosesNot(encloseBasis2(B[i], B[j]), p) &&
        enclosesNot(encloseBasis2(B[i], p), B[j]) &&
        enclosesNot(encloseBasis2(B[j], p), B[i]) &&
        enclosesWeakAll(encloseBasis3(B[i], B[j], p), B)
      ) {
        return [B[i], B[j], p]
      }
    }
  }
  throw new Error()
}
function enclosesNot(a, b) {
  let dr = a.r - b.r,
    dx = b.x - a.x,
    dy = b.y - a.y
  return dr < 0 || dr * dr < dx * dx + dy * dy
}
function enclosesWeak(a, b) {
  let dr = a.r - b.r + Math.max(a.r, b.r, 1) * 1e-9,
    dx = b.x - a.x,
    dy = b.y - a.y
  return dr > 0 && dr * dr > dx * dx + dy * dy
}
function enclosesWeakAll(a, B) {
  for (let i = 0; i < B.length; ++i) {
    if (!enclosesWeak(a, B[i])) {
      return false
    }
  }
  return true
}
function encloseBasis(B) {
  switch (B.length) {
    case 1:
      return encloseBasis1(B[0])
    case 2:
      return encloseBasis2(B[0], B[1])
    case 3:
      return encloseBasis3(B[0], B[1], B[2])
  }
}
function encloseBasis1(a) {
  return {
    x: a.x,
    y: a.y,
    r: a.r,
  }
}
function encloseBasis2(a, b) {
  let x1 = a.x,
    y1 = a.y,
    r1 = a.r,
    x2 = b.x,
    y2 = b.y,
    r2 = b.r,
    x21 = x2 - x1,
    y21 = y2 - y1,
    r21 = r2 - r1,
    l = Math.sqrt(x21 * x21 + y21 * y21)
  return {
    x: (x1 + x2 + (x21 / l) * r21) / 2,
    y: (y1 + y2 + (y21 / l) * r21) / 2,
    r: (l + r1 + r2) / 2,
  }
}
function encloseBasis3(a, b, c) {
  let x1 = a.x,
    y1 = a.y,
    r1 = a.r,
    x2 = b.x,
    y2 = b.y,
    r2 = b.r,
    x3 = c.x,
    y3 = c.y,
    r3 = c.r,
    a2 = x1 - x2,
    a3 = x1 - x3,
    b2 = y1 - y2,
    b3 = y1 - y3,
    c2 = r2 - r1,
    c3 = r3 - r1,
    d1 = x1 * x1 + y1 * y1 - r1 * r1,
    d2 = d1 - x2 * x2 - y2 * y2 + r2 * r2,
    d3 = d1 - x3 * x3 - y3 * y3 + r3 * r3,
    ab = a3 * b2 - a2 * b3,
    xa = (b2 * d3 - b3 * d2) / (ab * 2) - x1,
    xb = (b3 * c2 - b2 * c3) / ab,
    ya = (a3 * d2 - a2 * d3) / (ab * 2) - y1,
    yb = (a2 * c3 - a3 * c2) / ab,
    A = xb * xb + yb * yb - 1,
    B = 2 * (r1 + xa * xb + ya * yb),
    C = xa * xa + ya * ya - r1 * r1,
    r = -(Math.abs(A) > 1e-6 ? (B + Math.sqrt(B * B - 4 * A * C)) / (2 * A) : C / B)
  return {
    x: x1 + xa + xb * r,
    y: y1 + ya + yb * r,
    r: r,
  }
}
function defaultRadius(d) {
  return Math.sqrt(d.value)
}
export function pack<T>(): qt.PackLayout<T> {
  let radius = null,
    dx = 1,
    dy = 1,
    padding = constantZero
  function pack(root) {
    const random = lcg()
    ;(root.x = dx / 2), (root.y = dy / 2)
    if (radius) {
      root
        .eachBefore(radiusLeaf(radius))
        .eachAfter(packChildrenRandom(padding, 0.5, random))
        .eachBefore(translateChild(1))
    } else {
      root
        .eachBefore(radiusLeaf(defaultRadius))
        .eachAfter(packChildrenRandom(constantZero, 1, random))
        .eachAfter(packChildrenRandom(padding, root.r / Math.min(dx, dy), random))
        .eachBefore(translateChild(Math.min(dx, dy) / (2 * root.r)))
    }
    return root
  }
  pack.radius = function (x) {
    return arguments.length ? ((radius = optional(x)), pack) : radius
  }
  pack.size = function (x) {
    return arguments.length ? ((dx = +x[0]), (dy = +x[1]), pack) : [dx, dy]
  }
  pack.padding = function (x) {
    return arguments.length ? ((padding = typeof x === "function" ? x : constant(+x)), pack) : padding
  }
  return pack
}
function radiusLeaf(radius) {
  return function (node) {
    if (!node.children) {
      node.r = Math.max(0, +radius(node) || 0)
    }
  }
}
function packChildrenRandom(padding, k, random) {
  return function (node) {
    if ((children = node.children)) {
      let children,
        i,
        n = children.length,
        r = padding(node) * k || 0,
        e
      if (r) for (i = 0; i < n; ++i) children[i].r += r
      e = packSiblingsRandom(children, random)
      if (r) for (i = 0; i < n; ++i) children[i].r -= r
      node.r = e + r
    }
  }
}
function translateChild(k) {
  return function (node) {
    let parent = node.parent
    node.r *= k
    if (parent) {
      node.x = parent.x + k * node.x
      node.y = parent.y + k * node.y
    }
  }
}
function place(b, a, c) {
  let dx = b.x - a.x,
    x,
    a2,
    dy = b.y - a.y,
    y,
    b2,
    d2 = dx * dx + dy * dy
  if (d2) {
    ;(a2 = a.r + c.r), (a2 *= a2)
    ;(b2 = b.r + c.r), (b2 *= b2)
    if (a2 > b2) {
      x = (d2 + b2 - a2) / (2 * d2)
      y = Math.sqrt(Math.max(0, b2 / d2 - x * x))
      c.x = b.x - x * dx - y * dy
      c.y = b.y - x * dy + y * dx
    } else {
      x = (d2 + a2 - b2) / (2 * d2)
      y = Math.sqrt(Math.max(0, a2 / d2 - x * x))
      c.x = a.x + x * dx - y * dy
      c.y = a.y + x * dy + y * dx
    }
  } else {
    c.x = a.x + c.r
    c.y = a.y
  }
}
function intersects(a, b) {
  let dr = a.r + b.r - 1e-6,
    dx = b.x - a.x,
    dy = b.y - a.y
  return dr > 0 && dr * dr > dx * dx + dy * dy
}
function score(node) {
  let a = node._,
    b = node.next._,
    ab = a.r + b.r,
    dx = (a.x * b.r + b.x * a.r) / ab,
    dy = (a.y * b.r + b.y * a.r) / ab
  return dx * dx + dy * dy
}
class PackNode {
  constructor(public circle) {
    this.next = null
    this.previous = null
  }
}
export function packSiblingsRandom(circles, random) {
  if (!(n = (circles = array(circles)).length)) return 0
  let a, b, c, n, aa, ca, i, j, k, sj, sk
  ;(a = circles[0]), (a.x = 0), (a.y = 0)
  if (!(n > 1)) return a.r
  ;(b = circles[1]), (a.x = -b.r), (b.x = a.r), (b.y = 0)
  if (!(n > 2)) return a.r + b.r
  place(b, a, (c = circles[2]))
  ;(a = new PackNode(a)), (b = new PackNode(b)), (c = new PackNode(c))
  a.next = c.previous = b
  b.next = a.previous = c
  c.next = b.previous = a
  pack: for (i = 3; i < n; ++i) {
    place(a._, b._, (c = circles[i])), (c = new PackNode(c))
    ;(j = b.next), (k = a.previous), (sj = b._.r), (sk = a._.r)
    do {
      if (sj <= sk) {
        if (intersects(j._, c.circle)) {
          ;(b = j), (a.next = b), (b.previous = a), --i
          continue pack
        }
        ;(sj += j._.r), (j = j.next)
      } else {
        if (intersects(k._, c.circle)) {
          ;(a = k), (a.next = b), (b.previous = a), --i
          continue pack
        }
        ;(sk += k._.r), (k = k.previous)
      }
    } while (j !== k.next)
    ;(c.previous = a), (c.next = b), (a.next = b.previous = b = c)
    aa = score(a)
    while ((c = c.next) !== b) {
      if ((ca = score(c)) < aa) {
        ;(a = c), (aa = ca)
      }
    }
    b = a.next
  }
  ;(a = [b._]), (c = b)
  while ((c = c.next) !== b) a.push(c._)
  c = packEncloseRandom(a, random)
  for (i = 0; i < n; ++i) (a = circles[i]), (a.x -= c.x), (a.y -= c.y)
  return c.r
}
export function packSiblings<T extends qt.PackRadius>(xs: T[]): Array<T & qt.PackCircle> {
  packSiblingsRandom(xs, lcg())
  return xs
}
