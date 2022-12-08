/* eslint-disable @typescript-eslint/no-this-alias */
import type * as qt from "./types.js"
import * as qu from "./utils.js"
import type { Hierarchy as qh } from "./types.js"

export function hierarchy<T>(data: T, children?: (x: T) => Iterable<T> | null | undefined): qh.Node<T> {
  if (data instanceof Map) {
    data = [undefined, data]
    if (children === undefined) children = (x: any) => (Array.isArray(x) ? x[1] : null)
  } else if (children === undefined) children = (x: any) => x.children
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

export class Node<T> implements qh.Node<T> {
  children?: this[]
  parent = null
  depth = 0
  height = 0
  value = 0
  constructor(public data: T) {}
  *iterator() {
    let y: this | undefined = this,
      current,
      next = [y]
    do {
      current = next.reverse()
      next = []
      while ((y = current.pop())) {
        yield y
        const cs = y.children
        if (cs) {
          for (const c of cs) {
            next.push(c)
          }
        }
      }
    } while (next.length)
  }
  [Symbol.iterator] = this.iterator
  ancestors() {
    let y: this | null = this
    const ys = [y]
    while ((y = y.parent)) {
      ys.push(y)
    }
    return ys
  }
  copy() {
    return hierarchy(this).eachBefore(x => {
      if (x.data.value !== undefined) x.value = x.data.value
      x.data = x.data.data
    })
  }
  count() {
    return this.eachAfter((x: this) => {
      const cs = x.children
      let sum = 0
      let i = cs && cs.length
      if (!i) sum = 1
      else while (--i >= 0) sum += cs![i]!.value
      x.value = sum
    })
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
      const cs = y.children
      if (cs) {
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
      const cs = y.children
      if (cs) {
        for (let j = cs.length - 1; j >= 0; --j) {
          ys.push(cs[j]!)
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
  leaves() {
    const ys: this[] = []
    this.eachBefore(x => {
      if (!x.children) ys.push(x)
    })
    return ys
  }
  links() {
    const ys: qh.Link<T>[] = []
    this.each(x => {
      if (x !== this) ys.push({ src: x.parent, tgt: x })
    })
    return ys
  }
  path(end: this) {
    let y: this | null = this
    const ys = [y]
    const leastCommon = (a: this, b: this) => {
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
    const ancestor = leastCommon(y, end)
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
    return this.eachBefore(x => {
      if (x.children) x.children.sort(f)
    })
  }
  sum(f: (x: T) => number): this
  sum(f: any) {
    return this.eachAfter(x => {
      let y = +f(x.data) || 0
      const cs = x.children
      let i = (cs && cs.length) ?? 0
      while (--i >= 0) y += cs![i]!.value
      x.value = y
    })
  }
}

export function optional(x: any) {
  return x === null ? null : required(x)
}
export function required(x: any) {
  if (typeof x !== "function") throw new Error()
  return x
}
export function array(x: any) {
  return typeof x === "object" && "length" in x ? x : Array.from(x)
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
  return qu.max(y, c.y)
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
export function cluster<T>(): qh.Cluster<T> {
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

const a = 1664525
const c = 1013904223
const m = 4294967296 // 2^32
export function lcg() {
  let s = 1
  return () => (s = (a * s + c) % m) / m
}
export function partition<T>(): qh.Partition<T> {
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
export function stratify<T>(): qh.StratifyOp<T> {
  let id = defaultId,
    parentId = defaultParentId,
    path
  function f(data) {
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
  f.id = (x: any) => (x === undefined ? id : ((id = optional(x)), f))
  f.parentId = (x: any) => (x === undefined ? parentId : ((parentId = optional(x)), f))
  f.path = (x: any) => (x === undefined ? path : ((path = optional(x)), f))
  return f
}
function normalize(path) {
  path = `${path}`
  const i = path.length
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
export function tree<T>(): qh.Tree<T> {
  let separation = defaultSeparation,
    dx = 1,
    dy = 1,
    nodeSize = null
  function f(root) {
    let t = treeRoot(root)
    t.eachAfter(firstWalk), (t.parent.m = -t.z)
    t.eachBefore(secondWalk)
    if (nodeSize) root.eachBefore(sizeNode)
    else {
      let left = root,
        right = root,
        bottom = root
      root.eachBefore(node => {
        if (node.x < left.x) left = node
        if (node.x > right.x) right = node
        if (node.depth > bottom.depth) bottom = node
      })
      const s = left === right ? 1 : separation(left, right) / 2,
        tx = s - left.x,
        kx = dx / (right.x + s + tx),
        ky = dy / (bottom.depth || 1)
      root.eachBefore(node => {
        node.x = (node.x + tx) * kx
        node.y = node.depth * ky
      })
    }
    return root
  }
  function firstWalk(v) {
    const children = v.children,
      siblings = v.parent.children,
      w = v.i ? siblings[v.i - 1] : null
    if (children) {
      executeShifts(v)
      const midpoint = (children[0].z + children[children.length - 1].z) / 2
      if (w) {
        v.z = w.z + separation(v._, w._)
        v.m = v.z - midpoint
      } else v.z = midpoint
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
  f.separation = (x: any) => (x === undefined ? separation : ((separation = x), f))
  f.size = (x: any) =>
    x === undefined ? (nodeSize ? null : [dx, dy]) : ((nodeSize = false), (dx = +x[0]), (dy = +x[1]), f)
  f.nodeSize = (x: any) =>
    x === undefined ? (nodeSize ? [dx, dy] : null) : ((nodeSize = true), (dx = +x[0]), (dy = +x[1]), f)
  return f
}

export const phi = (1 + qu.sqrt(5)) / 2

export function treemapBinary(parent: qh.RectNode<any>, x0: number, y0: number, x1: number, y1: number): void {
  const nodes = parent.children,
    n = nodes.length,
    sums = new Array(n + 1)
  let i, sum
  for (sums[0] = sum = i = 0; i < n; ++i) {
    sums[i + 1] = sum += nodes[i].value
  }
  partition(0, n, parent.value, x0, y0, x1, y1)
  function partition(i, j, value, x0, y0, x1, y1) {
    if (i >= j - 1) {
      const node = nodes[i]!
      ;(node.x0 = x0), (node.y0 = y0)
      ;(node.x1 = x1), (node.y1 = y1)
      return
    }
    const valueOffset = sums[i],
      valueTarget = value / 2 + valueOffset
    let k = i + 1,
      hi = j - 1
    while (k < hi) {
      const mid = (k + hi) >>> 1
      if (sums[mid] < valueTarget) k = mid + 1
      else hi = mid
    }
    if (valueTarget - sums[k - 1] < sums[k] - valueTarget && i + 1 < k) --k
    const valueLeft = sums[k] - valueOffset,
      valueRight = value - valueLeft
    if (x1 - x0 > y1 - y0) {
      const xk = value ? (x0 * valueRight + x1 * valueLeft) / value : x1
      partition(i, k, valueLeft, x0, y0, xk, y1)
      partition(k, j, valueRight, xk, y0, x1, y1)
    } else {
      const yk = value ? (y0 * valueRight + y1 * valueLeft) / value : y1
      partition(i, k, valueLeft, x0, y0, x1, yk)
      partition(k, j, valueRight, x0, yk, x1, y1)
    }
  }
}
export function treemapDice(parent: qh.RectNode<any>, x0: number, y0: number, x1: number, y1: number): void {
  const ys = parent.children,
    n = ys.length,
    k = parent.value && (x1 - x0) / parent.value
  let node,
    i = -1
  while (++i < n) {
    ;(node = ys[i]), (node.y0 = y0), (node.y1 = y1)
    ;(node.x0 = x0), (node.x1 = x0 += node.value * k)
  }
}

export function treemap<T>(): qh.Treemap<T> {
  let tile = squarify,
    round = false,
    dx = 1,
    dy = 1,
    paddingStack = [0],
    paddingInner = qu.constant(0),
    paddingTop = qu.constant(0),
    paddingRight = qu.constant(0),
    paddingBottom = qu.constant(0),
    paddingLeft = qu.constant(0)
  function f(root) {
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
  f.round = (x: any) => (x === undefined ? round : ((round = !!x), f))
  f.size = (x: any) => (x === undefined ? [dx, dy] : ((dx = +x[0]), (dy = +x[1]), f))
  f.tile = (x: any) => (x === undefined ? tile : ((tile = required(x)), f))
  f.padding = (x: any) => (x === undefined ? f.paddingInner() : f.paddingInner(x).paddingOuter(x))
  f.paddingInner = (x: any) =>
    x === undefined ? paddingInner : ((paddingInner = typeof x === "function" ? x : qu.constant(+x)), f)
  f.paddingOuter = (x: any) =>
    x === undefined ? f.paddingTop() : f.paddingTop(x).paddingRight(x).paddingBottom(x).paddingLeft(x)
  f.paddingTop = (x: any) =>
    x === undefined ? paddingTop : ((paddingTop = typeof x === "function" ? x : qu.constant(+x)), f)
  f.paddingRight = (x: any) =>
    x === undefined ? paddingRight : ((paddingRight = typeof x === "function" ? x : qu.constant(+x)), f)
  f.paddingBottom = (x: any) =>
    x === undefined ? paddingBottom : ((paddingBottom = typeof x === "function" ? x : qu.constant(+x)), f)
  f.paddingLeft = (x: any) =>
    x === undefined ? paddingLeft : ((paddingLeft = typeof x === "function" ? x : qu.constant(+x)), f)
  return f
}

export const treemapResquarify: qh.RatioFac = (function f(ratio) {
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
  x.x0 = qu.round(x.x0)
  x.y0 = qu.round(x.y0)
  x.x1 = qu.round(x.x1)
  x.y1 = qu.round(x.y1)
}

export function treemapSlice(parent: qh.RectNode<any>, x0: number, y0: number, x1: number, y1: number): void {
  const ys = parent.children,
    n = ys.length,
    k = parent.value && (y1 - y0) / parent.value
  let node,
    i = -1
  while (++i < n) {
    ;(node = ys[i]), (node.x0 = x0), (node.x1 = x1)
    ;(node.y0 = y0), (node.y1 = y0 += node.value * k)
  }
}

export function treemapSliceDice(parent: qh.RectNode<any>, x0: number, y0: number, x1: number, y1: number): void {
  ;(parent.depth & 1 ? treemapSlice : treemapDice)(parent, x0, y0, x1, y1)
}

function squarifyRatio(ratio, parent, x0, y0, x1, y1) {
  const rows = [],
    nodes = parent.children,
    n = nodes.length
  let row,
    nodeValue,
    i0 = 0,
    i1 = 0,
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
    alpha = qu.max(dy / dx, dx / dy) / (value * ratio)
    beta = sumValue * sumValue * alpha
    minRatio = qu.max(maxValue / beta, beta / minValue)
    for (; i1 < n; ++i1) {
      sumValue += nodeValue = nodes[i1].value
      if (nodeValue < minValue) minValue = nodeValue
      if (nodeValue > maxValue) maxValue = nodeValue
      beta = sumValue * sumValue * alpha
      newRatio = qu.max(maxValue / beta, beta / minValue)
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

export const treemapSquarify: qh.RatioFac = (function f(ratio) {
  function y(parent, x0, y0, x1, y1) {
    squarifyRatio(ratio, parent, x0, y0, x1, y1)
  }
  y.ratio = x => f((x = +x) > 1 ? x : 1)
  return y
})(phi)

export function packEnclose<T extends qh.PackCircle>(xs: T[]): qh.PackCircle | undefined {
  return packRandom(xs, lcg())
}
export function packRandom(xs: qh.PackCircle[], rnd: () => number) {
  function weak(a: qh.PackCircle, b: qh.PackCircle) {
    const dr = a.r - b.r + qu.max(a.r, b.r, 1) * 1e-9
    const dx = b.x - a.x
    const dy = b.y - a.y
    return dr > 0 && dr * dr > dx * dx + dy * dy
  }
  function weakAll(a: qh.PackCircle, bs: qh.PackCircle[]) {
    for (const b of bs) {
      if (!weak(a, b)) return false
    }
    return true
  }
  function basis2(a: qh.PackCircle, b: qh.PackCircle) {
    const { r: r1, x: x1, y: y1 } = a
    const { r: r2, x: x2, y: y2 } = b
    const x21 = x2 - x1,
      y21 = y2 - y1,
      r21 = r2 - r1,
      l = qu.sqrt(x21 * x21 + y21 * y21)
    return {
      r: (l + r1 + r2) / 2,
      x: (x1 + x2 + (x21 / l) * r21) / 2,
      y: (y1 + y2 + (y21 / l) * r21) / 2,
    } as qh.PackCircle
  }
  function basis3(a: qh.PackCircle, b: qh.PackCircle, c: qh.PackCircle) {
    const { r: r1, x: x1, y: y1 } = a
    const { r: r2, x: x2, y: y2 } = b
    const { r: r3, x: x3, y: y3 } = c
    const a2 = x1 - x2,
      a3 = x1 - x3,
      b2 = y1 - y2,
      b3 = y1 - y3,
      c2 = r2 - r1,
      c3 = r3 - r1
    const d1 = x1 * x1 + y1 * y1 - r1 * r1,
      d2 = d1 - x2 * x2 - y2 * y2 + r2 * r2,
      d3 = d1 - x3 * x3 - y3 * y3 + r3 * r3
    const ab = a3 * b2 - a2 * b3,
      xa = (b2 * d3 - b3 * d2) / (ab * 2) - x1,
      xb = (b3 * c2 - b2 * c3) / ab,
      ya = (a3 * d2 - a2 * d3) / (ab * 2) - y1,
      yb = (a2 * c3 - a3 * c2) / ab
    const A = xb * xb + yb * yb - 1,
      B = 2 * (r1 + xa * xb + ya * yb),
      C = xa * xa + ya * ya - r1 * r1,
      r = -(qu.abs(A) > 1e-6 ? (B + qu.sqrt(B * B - 4 * A * C)) / (2 * A) : C / B)
    return {
      r: r,
      x: x1 + xa + xb * r,
      y: y1 + ya + yb * r,
    } as qh.PackCircle
  }
  function extend(ps: qh.PackCircle[], p: qh.PackCircle) {
    let i, j
    if (weakAll(p, ps)) return [p]
    function not(a: qh.PackCircle, b: qh.PackCircle) {
      const dr = a.r - b.r
      const dx = b.x - a.x
      const dy = b.y - a.y
      return dr < 0 || dr * dr < dx * dx + dy * dy
    }
    for (const b of ps) {
      if (not(p, b) && weakAll(basis2(b, p), ps)) return [b, p]
    }
    for (i = 0; i < ps.length - 1; ++i) {
      for (j = i + 1; j < ps.length; ++j) {
        if (
          not(basis2(ps[i]!, ps[j]!), p) &&
          not(basis2(ps[i]!, p), ps[j]!) &&
          not(basis2(ps[j]!, p), ps[i]!) &&
          weakAll(basis3(ps[i]!, ps[j]!, p), ps)
        ) {
          return [ps[i]!, ps[j]!, p]
        }
      }
    }
    throw new Error()
  }
  function enclose(ps: qh.PackCircle[]) {
    switch (ps.length) {
      case 1:
        return (a => ({
          x: a.x,
          y: a.y,
          r: a.r,
        }))(ps[0]!)
      case 2:
        return basis2(ps[0]!, ps[1]!)
      default:
        return basis3(ps[0]!, ps[1]!, ps[2]!)
    }
  }
  const n = (xs = qu.shuffle(Array.from(xs), rnd)).length
  let i = 0,
    ps: qh.PackCircle[] = [],
    e
  while (i < n) {
    const p = xs[i]!
    if (e && weak(e, p)) ++i
    else (e = enclose((ps = extend(ps, p)))), (i = 0)
  }
  return e
}
export function pack<T>(): qh.Pack<T> {
  let _r: null | ((x: qh.CircNode<T>) => number) = null,
    dx = 1,
    dy = 1,
    padding = qu.constant(0)
  function f(root: Node<T>) {
    const rnd = lcg()
    ;(root.x = dx / 2), (root.y = dy / 2)
    function radiusLeaf(f = (x: Node<T>) => qu.sqrt(x.value)) {
      return function (x: Node<T>) {
        if (!x.children) x.r = qu.max(0, +f(x) || 0)
      }
    }
    function random(padding, k, random) {
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
    function translate(k) {
      return function (node) {
        let parent = node.parent
        node.r *= k
        if (parent) {
          node.x = parent.x + k * node.x
          node.y = parent.y + k * node.y
        }
      }
    }
    if (_r) {
      root.eachBefore(radiusLeaf(_r)).eachAfter(random(padding, 0.5, rnd)).eachBefore(translate(1))
    } else {
      root
        .eachBefore(radiusLeaf())
        .eachAfter(random(qu.constant(0), 1, rnd))
        .eachAfter(random(padding, root.r / qu.min(dx, dy), rnd))
        .eachBefore(translate(qu.min(dx, dy) / (2 * root.r)))
    }
    return root
  }
  f.padding = (x: any) => (x === undefined ? padding : ((padding = typeof x === "function" ? x : qu.constant(+x)), f))
  f.radius = (x: any) => (x === undefined ? _r : ((_r = optional(x)), f))
  f.size = (x: any) => (x === undefined ? [dx, dy] : ((dx = +x[0]), (dy = +x[1]), f))
  return f
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
      y = qu.sqrt(qu.max(0, b2 / d2 - x * x))
      c.x = b.x - x * dx - y * dy
      c.y = b.y - x * dy + y * dx
    } else {
      x = (d2 + a2 - b2) / (2 * d2)
      y = qu.sqrt(qu.max(0, a2 / d2 - x * x))
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
  c = packRandom(a, random)
  for (i = 0; i < n; ++i) (a = circles[i]), (a.x -= c.x), (a.y -= c.y)
  return c.r
}
export function packSiblings<T extends qh.PackRadius>(xs: T[]): Array<T & qh.PackCircle> {
  packSiblingsRandom(xs, lcg())
  return xs
}

function computeHeight(x) {
  let height = 0
  do x.height = height
  while ((x = x.parent) && x.height < ++height)
}
