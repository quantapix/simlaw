/* eslint-disable no-cond-assign */
export function quadtree(nodes, x, y) {
  let tree = new Quadtree(x == null ? defaultX : x, y == null ? defaultY : y, NaN, NaN, NaN, NaN)
  return nodes == null ? tree : tree.addAll(nodes)
}
function leaf_copy(leaf) {
  let copy = { data: leaf.data },
    next = copy
  while ((leaf = leaf.next)) next = next.next = { data: leaf.data }
  return copy
}
class Quadtree {
  constructor(x, y, x0, y0, x1, y1) {
    this._x = x
    this._y = y
    this._x0 = x0
    this._y0 = y0
    this._x1 = x1
    this._y1 = y1
    this._root = undefined
  }
  copy() {
    let copy = new Quadtree(this._x, this._y, this._x0, this._y0, this._x1, this._y1),
      node = this._root,
      nodes,
      child
    if (!node) return copy
    if (!node.length) return (copy._root = leaf_copy(node)), copy
    nodes = [{ source: node, target: (copy._root = new Array(4)) }]
    while ((node = nodes.pop())) {
      for (let i = 0; i < 4; ++i) {
        if ((child = node.source[i])) {
          if (child.length) nodes.push({ source: child, target: (node.target[i] = new Array(4)) })
          else node.target[i] = leaf_copy(child)
        }
      }
    }
    return copy
  }
  add(d) {
    function add(tree, x, y, d) {
      if (isNaN(x) || isNaN(y)) return tree
      let parent,
        node = tree._root,
        leaf = { data: d },
        x0 = tree._x0,
        y0 = tree._y0,
        x1 = tree._x1,
        y1 = tree._y1,
        xm: number,
        ym: number,
        xp: number,
        yp: number,
        right: any,
        bottom: any,
        i: number,
        j: number
      if (!node) return (tree._root = leaf), tree
      while (node.length) {
        if ((right = x >= (xm = (x0 + x1) / 2))) x0 = xm
        else x1 = xm
        if ((bottom = y >= (ym = (y0 + y1) / 2))) y0 = ym
        else y1 = ym
        if (((parent = node), !(node = node[(i = (bottom << 1) | right)]))) return (parent[i] = leaf), tree
      }
      xp = +tree._x.call(null, node.data)
      yp = +tree._y.call(null, node.data)
      if (x === xp && y === yp) return (leaf.next = node), parent ? (parent[i] = leaf) : (tree._root = leaf), tree
      do {
        parent = parent ? (parent[i] = new Array(4)) : (tree._root = new Array(4))
        if ((right = x >= (xm = (x0 + x1) / 2))) x0 = xm
        else x1 = xm
        if ((bottom = y >= (ym = (y0 + y1) / 2))) y0 = ym
        else y1 = ym
      } while ((i = (bottom << 1) | right) === (j = (((yp >= ym) as any) << 1) | ((xp >= xm) as any)))
      return (parent[j] = node), (parent[i] = leaf), tree
    }
    const x = +this._x.call(null, d),
      y = +this._y.call(null, d)
    return add(this.cover(x, y), x, y, d)
  }
  addAll(data) {
    if (!Array.isArray(data)) data = Array.from(data)
    const n = data.length
    const xz = new Float64Array(n)
    const yz = new Float64Array(n)
    let x0 = Infinity,
      y0 = x0,
      x1 = -x0,
      y1 = x1
    for (let i = 0, d, x, y; i < n; ++i) {
      if (isNaN((x = +this._x.call(null, (d = data[i])))) || isNaN((y = +this._y.call(null, d)))) continue
      xz[i] = x
      yz[i] = y
      if (x < x0) x0 = x
      if (x > x1) x1 = x
      if (y < y0) y0 = y
      if (y > y1) y1 = y
    }
    if (x0 > x1 || y0 > y1) return this
    this.cover(x0, y0).cover(x1, y1)
    for (let i = 0; i < n; ++i) {
      add(this, xz[i], yz[i], data[i])
    }
    return this
  }
  cover(x, y) {
    if (isNaN((x = +x)) || isNaN((y = +y))) return this
    let x0 = this._x0,
      y0 = this._y0,
      x1 = this._x1,
      y1 = this._y1
    if (isNaN(x0)) {
      x1 = (x0 = Math.floor(x)) + 1
      y1 = (y0 = Math.floor(y)) + 1
    } else {
      let z = x1 - x0 || 1,
        node = this._root,
        parent,
        i
      while (x0 > x || x >= x1 || y0 > y || y >= y1) {
        i = ((y < y0) << 1) | (x < x0)
        ;(parent = new Array(4)), (parent[i] = node), (node = parent), (z *= 2)
        switch (i) {
          case 0:
            ;(x1 = x0 + z), (y1 = y0 + z)
            break
          case 1:
            ;(x0 = x1 - z), (y1 = y0 + z)
            break
          case 2:
            ;(x1 = x0 + z), (y0 = y1 - z)
            break
          case 3:
            ;(x0 = x1 - z), (y0 = y1 - z)
            break
        }
      }
      if (this._root && this._root.length) this._root = node
    }
    this._x0 = x0
    this._y0 = y0
    this._x1 = x1
    this._y1 = y1
    return this
  }
  data() {
    const y = []
    this.visit(function (node) {
      if (!node.length)
        do y.push(node.data)
        while ((node = node.next))
    })
    return y
  }
  extent(_) {
    return arguments.length
      ? this.cover(+_[0][0], +_[0][1]).cover(+_[1][0], +_[1][1])
      : isNaN(this._x0)
      ? undefined
      : [
          [this._x0, this._y0],
          [this._x1, this._y1],
        ]
  }
  find(x, y, radius) {
    let data,
      x0 = this._x0,
      y0 = this._y0,
      x1,
      y1,
      x2,
      y2,
      x3 = this._x1,
      y3 = this._y1,
      quads = [],
      node = this._root,
      q,
      i
    if (node) quads.push(new Quad(node, x0, y0, x3, y3))
    if (radius == null) radius = Infinity
    else {
      ;(x0 = x - radius), (y0 = y - radius)
      ;(x3 = x + radius), (y3 = y + radius)
      radius *= radius
    }
    while ((q = quads.pop())) {
      if (!(node = q.node) || (x1 = q.x0) > x3 || (y1 = q.y0) > y3 || (x2 = q.x1) < x0 || (y2 = q.y1) < y0) continue
      if (node.length) {
        let xm = (x1 + x2) / 2,
          ym = (y1 + y2) / 2
        quads.push(
          new Quad(node[3], xm, ym, x2, y2),
          new Quad(node[2], x1, ym, xm, y2),
          new Quad(node[1], xm, y1, x2, ym),
          new Quad(node[0], x1, y1, xm, ym)
        )
        if ((i = (((y >= ym) as any) << 1) | ((x >= xm) as any))) {
          q = quads[quads.length - 1]
          quads[quads.length - 1] = quads[quads.length - 1 - i]
          quads[quads.length - 1 - i] = q
        }
      } else {
        let dx = x - +this._x.call(null, node.data),
          dy = y - +this._y.call(null, node.data),
          d2 = dx * dx + dy * dy
        if (d2 < radius) {
          let d = Math.sqrt((radius = d2))
          ;(x0 = x - d), (y0 = y - d)
          ;(x3 = x + d), (y3 = y + d)
          data = node.data
        }
      }
    }
    return data
  }
  remove(d) {
    if (isNaN((x = +this._x.call(null, d))) || isNaN((y = +this._y.call(null, d)))) return this // ignore invalid points
    let parent,
      node = this._root,
      retainer,
      previous,
      next,
      x0 = this._x0,
      y0 = this._y0,
      x1 = this._x1,
      y1 = this._y1,
      x,
      y,
      xm,
      ym,
      right,
      bottom,
      i,
      j
    if (!node) return this
    if (node.length)
      while (true) {
        if ((right = x >= (xm = (x0 + x1) / 2))) x0 = xm
        else x1 = xm
        if ((bottom = y >= (ym = (y0 + y1) / 2))) y0 = ym
        else y1 = ym
        if (!((parent = node), (node = node[(i = (bottom << 1) | right)]))) return this
        if (!node.length) break
        if (parent[(i + 1) & 3] || parent[(i + 2) & 3] || parent[(i + 3) & 3]) (retainer = parent), (j = i)
      }
    while (node.data !== d) if (!((previous = node), (node = node.next))) return this
    if ((next = node.next)) delete node.next
    if (previous) return next ? (previous.next = next) : delete previous.next, this
    if (!parent) return (this._root = next), this
    next ? (parent[i] = next) : delete parent[i]
    if (
      (node = parent[0] || parent[1] || parent[2] || parent[3]) &&
      node === (parent[3] || parent[2] || parent[1] || parent[0]) &&
      !node.length
    ) {
      if (retainer) retainer[j] = node
      else this._root = node
    }
    return this
  }
  removeAll(data) {
    for (let i = 0, n = data.length; i < n; ++i) this.remove(data[i])
    return this
  }
  root() {
    return this._root
  }
  size() {
    let size = 0
    this.visit(function (node) {
      if (!node.length)
        do ++size
        while ((node = node.next))
    })
    return size
  }
  visit(callback) {
    let quads = [],
      q,
      node = this._root,
      child,
      x0,
      y0,
      x1,
      y1
    if (node) quads.push(new Quad(node, this._x0, this._y0, this._x1, this._y1))
    while ((q = quads.pop())) {
      if (!callback((node = q.node), (x0 = q.x0), (y0 = q.y0), (x1 = q.x1), (y1 = q.y1)) && node.length) {
        let xm = (x0 + x1) / 2,
          ym = (y0 + y1) / 2
        if ((child = node[3])) quads.push(new Quad(child, xm, ym, x1, y1))
        if ((child = node[2])) quads.push(new Quad(child, x0, ym, xm, y1))
        if ((child = node[1])) quads.push(new Quad(child, xm, y0, x1, ym))
        if ((child = node[0])) quads.push(new Quad(child, x0, y0, xm, ym))
      }
    }
    return this
  }
  visitAfter(callback) {
    let quads = [],
      next = [],
      q
    if (this._root) quads.push(new Quad(this._root, this._x0, this._y0, this._x1, this._y1))
    while ((q = quads.pop())) {
      let node = q.node
      if (node.length) {
        var child,
          x0 = q.x0,
          y0 = q.y0,
          x1 = q.x1,
          y1 = q.y1,
          xm = (x0 + x1) / 2,
          ym = (y0 + y1) / 2
        if ((child = node[0])) quads.push(new Quad(child, x0, y0, xm, ym))
        if ((child = node[1])) quads.push(new Quad(child, xm, y0, x1, ym))
        if ((child = node[2])) quads.push(new Quad(child, x0, ym, xm, y1))
        if ((child = node[3])) quads.push(new Quad(child, xm, ym, x1, y1))
      }
      next.push(q)
    }
    while ((q = next.pop())) {
      callback(q.node, q.x0, q.y0, q.x1, q.y1)
    }
    return this
  }
  x(_) {
    return arguments.length ? ((this._x = _), this) : this._x
  }
  y(_) {
    return arguments.length ? ((this._y = _), this) : this._y
  }
}
class Quad {
  constructor(node, x0, y0, x1, y1) {
    this.node = node
    this.x0 = x0
    this.y0 = y0
    this.x1 = x1
    this.y1 = y1
  }
}
export function defaultX(d) {
  return d[0]
}
export function defaultY(d) {
  return d[1]
}
