/* eslint-disable no-cond-assign */
import type * as qt from "./types.js"
import * as qu from "./utils.js"

export function sim<T extends qt.SimNode>(xs?: T[]): qt.Sim<T, undefined>
export function sim<N extends qt.SimNode, L extends qt.SimLink<N>>(xs?: N[]): qt.Sim<N, L>
export function sim(xs?: qt.SimNode[]) {
  let ns = xs ?? []
  let sim: any,
    alpha = 1,
    alphaMin = 0.001,
    alphaDecay = 1 - Math.pow(alphaMin, 1 / 300),
    alphaTarget = 0,
    velocityDecay = 0.6,
    random = lcg()
  const forces = new Map(),
    stepper = qu.timer(step),
    event = qu.dispatch("tick", "end")
  function initNodes() {
    const initRadius = 10
    const initAngle = Math.PI * (3 - Math.sqrt(5))
    ns.forEach((x, i) => {
      x.idx = i
      if (x.fx != null) x.x = x.fx
      if (x.fy != null) x.y = x.fy
      if (isNaN(x.x!) || isNaN(x.y!)) {
        const radius = initRadius * Math.sqrt(0.5 + i),
          angle = i * initAngle
        x.x = radius * Math.cos(angle)
        x.y = radius * Math.sin(angle)
      }
      if (isNaN(x.vx!) || isNaN(x.vy!)) {
        x.vx = x.vy = 0
      }
    })
  }
  function initForce(x: any) {
    if (x.init) x.init(ns, random)
    return x
  }
  initNodes()
  function tick(n?: number) {
    if (n === undefined) n = 1
    for (let i = 0; i < n; ++i) {
      alpha += (alphaTarget - alpha) * alphaDecay
      forces.forEach(function (f) {
        f(alpha)
      })
      ns.forEach(x => {
        if (x.fx == null) x.x! += x.vx! *= velocityDecay
        else (x.x = x.fx), (x.vx = 0)
        if (x.fy == null) x.y! += x.vy! *= velocityDecay
        else (x.y = x.fy), (x.vy = 0)
      })
    }
    return sim
  }
  function step() {
    tick()
    event.call("tick", sim)
    if (alpha < alphaMin) {
      stepper.stop()
      event.call("end", sim)
    }
  }
  return (sim = {
    alpha: function (x?: number) {
      return x === undefined ? alpha : ((alpha = +x), sim)
    },
    alphaDecay: function (x?: number) {
      return x === undefined ? +alphaDecay : ((alphaDecay = +x), sim)
    },
    alphaMin: function (x?: number) {
      return x === undefined ? alphaMin : ((alphaMin = +x), sim)
    },
    alphaTarget: function (x?: number) {
      return x === undefined ? alphaTarget : ((alphaTarget = +x), sim)
    },
    find: function (x: number, y: number, radius?: number) {
      let res
      if (radius === undefined) radius = Infinity
      else radius *= radius
      for (const n of ns) {
        const dx = x - n.x!
        const dy = y - n.y!
        const d2 = dx * dx + dy * dy
        if (d2 < radius) (res = n), (radius = d2)
      }
      return res
    },
    force: function (x: string, f?: any) {
      return f === undefined ? forces.get(x) : (f == null ? forces.delete(x) : forces.set(x, initForce(f)), sim)
    },
    nodes: function (xs?: any[]) {
      return xs === undefined ? ns : ((ns = xs), initNodes(), forces.forEach(initForce), sim)
    },
    on: function (x: any, f?: any) {
      return f === undefined ? event.on(x) : (event.on(x, f), sim)
    },
    randomSource: function (f?: any) {
      return f === undefined ? random : ((random = f), forces.forEach(initForce), sim)
    },
    restart: function () {
      return stepper.restart(step), sim
    },
    stop: function () {
      return stepper.stop(), sim
    },
    tick: tick,
    velocityDecay: function (x?: number) {
      return x === undefined ? 1 - velocityDecay : ((velocityDecay = 1 - x), sim)
    },
  })
}

export function center<N extends qt.SimNode>(x = 0, y = 0) {
  let _ns: N[] = []
  let _strength = 1
  let _x = x
  let _y = y
  function f() {
    let sx = 0
    let sy = 0
    _ns.forEach(n => {
      sx += n.x!
      sy += n.y!
    })
    const c = _ns.length
    sx = (sx / c - _x!) * _strength
    sy = (sy / c - _y!) * _strength
    _ns.forEach(n => {
      n.x! -= sx
      n.y! -= sy
    })
  }
  f.init = function (xs: any, _: Function) {
    _ns = xs
  }
  f.strength = function (x?: number) {
    return x === undefined ? _strength : ((_strength = +x), f)
  }
  f.x = function (x?: number) {
    return x === undefined ? _x : ((_x = +x), f)
  }
  f.y = function (x?: number) {
    return x === undefined ? _y : ((_y = +x), f)
  }
  return f as qt.Force.Center<N>
}
export function collide<N extends qt.SimNode>(r: number | qt.Force.Op<N> = 1) {
  let _iters = 1
  let _ns: N[] = []
  let _r = typeof r === "function" ? r : qu.constant(+r)
  let _rnd: Function
  let _rs: number[] = []
  let _strength = 1
  function f() {
    let i,
      n = _ns.length,
      tree,
      node,
      xi,
      yi,
      ri,
      ri2
    function xxx(d) {
      return d.x + d.vx
    }
    function yyy(d) {
      return d.y + d.vy
    }
    for (let k = 0; k < _iters; ++k) {
      tree = quadtree(_ns, xxx, yyy).visitAfter(prepare)
      for (i = 0; i < n; ++i) {
        node = _ns[i]
        ;(ri = _rs[node.idx]), (ri2 = ri * ri)
        xi = node.x + node.vx
        yi = node.y + node.vy
        tree.visit(apply)
      }
    }
    function apply(quad, x0, y0, x1, y1) {
      let data = quad.data,
        rj = quad.r,
        r = ri + rj
      if (data) {
        if (data.idx > node.idx) {
          let x = xi - data.x - data.vx,
            y = yi - data.y - data.vy,
            l = x * x + y * y
          if (l < r * r) {
            if (x === 0) (x = jiggle(_rnd)), (l += x * x)
            if (y === 0) (y = jiggle(_rnd)), (l += y * y)
            l = ((r - (l = Math.sqrt(l))) / l) * _strength
            node.vx += (x *= l) * (r = (rj *= rj) / (ri2 + rj))
            node.vy += (y *= l) * r
            data.vx -= x * (r = 1 - r)
            data.vy -= y * r
          }
        }
        return
      }
      return x0 > xi + r || x1 < xi - r || y0 > yi + r || y1 < yi - r
    }
  }
  function prepare(quad) {
    if (quad.data) return (quad.r = _rs[quad.data.idx])
    for (let i = (quad.r = 0); i < 4; ++i) {
      if (quad[i] && quad[i].r > quad.r) {
        quad.r = quad[i].r
      }
    }
  }
  function init() {
    if (!_ns) return
    _rs = new Array(_ns.length)
    _ns.forEach((n, i) => {
      _rs[n.idx!] = +_r(n, i, _ns)
    })
  }
  f.init = function (xs: any, rnd: Function) {
    _ns = xs
    _rnd = rnd
    init()
  }
  f.iters = function (x?: number) {
    return x === undefined ? _iters : ((_iters = +x), f)
  }
  f.radius = function (x?: number | qt.Force.Op<N>) {
    return x === undefined ? _r : ((_r = typeof x === "function" ? x : qu.constant(+x)), init(), f)
  }
  f.strength = function (x?: number) {
    return x === undefined ? _strength : ((_strength = +x), f)
  }
  return f as qt.Force.Collide<N>
}
export function radial<N extends qt.SimNode>(
  r: number | qt.Force.Op<N>,
  x: number | qt.Force.Op<N> = 0,
  y: number | qt.Force.Op<N> = 0
) {
  let _ns: N[] = []
  let _r = typeof r === "function" ? r : qu.constant(+r)
  let _rs: number[] = []
  let _ss: number[] = []
  let _strength: qt.Force.Op<N> = qu.constant(0.1)
  let [_x, _y] = [x, y]
  function f(alpha?: number) {
    _ns.forEach((n, i) => {
      ;(dx = n.x! - _x || 1e-6),
        (dy = n.y - _y || 1e-6),
        (r = Math.sqrt(dx * dx + dy * dy)),
        (k = ((_rs[i] - r) * _ss[i] * alpha) / r)
      n.vx += dx * k
      n.vy += dy * k
    })
  }
  function init() {
    if (!_ns) return
    const c = _ns.length
    _ss = new Array(c)
    _rs = new Array(c)
    for (let i = 0; i < c; ++i) {
      _rs[i] = +_r(_ns[i]!, i, _ns)
      _ss[i] = isNaN(_rs[i]!) ? 0 : +_strength(_ns[i]!, i, _ns)
    }
  }
  f.init = function (xs: any, _: Function) {
    _ns = xs
    init()
  }
  f.strength = function (x?: number | qt.Force.Op<N>) {
    return x === undefined ? _strength : ((_strength = typeof x === "function" ? x : qu.constant(+x)), init(), f)
  }
  f.radius = function (x?: number | qt.Force.Op<N>) {
    return x === undefined ? _r : ((_r = typeof x === "function" ? x : qu.constant(+x)), init(), f)
  }
  f.x = function (x?: number | qt.Force.Op<N>) {
    return x === undefined ? _x : ((_x = +x), f)
  }
  f.y = function (x?: number | qt.Force.Op<N>) {
    return x === undefined ? _y : ((_y = +x), f)
  }
  return f as qt.Force.Radial<N>
}
export function posX<N extends qt.SimNode>(x: number | qt.Force.Op<N> = 0) {
  let _ns: N[] = []
  let _ss: number[] = []
  let _strength: qt.Force.Op<N> = qu.constant(0.1)
  let _x = typeof x === "function" ? x : qu.constant(+x)
  let _xs: number[] = []
  function f(alpha: number) {
    _ns.forEach((n, i) => {
      n.vx! += (_xs[i]! - n.x!) * _ss[i]! * alpha
    })
  }
  function init() {
    if (!_ns) return
    const c = _ns.length
    _ss = new Array(c)
    _xs = new Array(c)
    for (let i = 0; i < c; ++i) {
      _ss[i] = isNaN((_xs[i] = +_x(_ns[i]!, i, _ns))) ? 0 : +_strength(_ns[i]!, i, _ns)
    }
  }
  f.init = function (xs: any, _: Function) {
    _ns = xs
    init()
  }
  f.strength = function (x?: number | qt.Force.Op<N>) {
    return x === undefined ? _strength : ((_strength = typeof x === "function" ? x : qu.constant(+x)), init(), f)
  }
  f.x = function (x?: number | qt.Force.Op<N>) {
    return x === undefined ? _x : ((_x = typeof x === "function" ? x : qu.constant(+x)), init(), f)
  }
  return f as qt.Force.PosX<N>
}
export function posY<N extends qt.SimNode>(x: number | qt.Force.Op<N> = 0) {
  let _ns: N[] = []
  let _ss: number[] = []
  let _strength: qt.Force.Op<N> = qu.constant(0.1)
  let _y = typeof x === "function" ? x : qu.constant(+x)
  let _ys: number[] = []
  function f(alpha: number) {
    _ns.forEach((n, i) => {
      n.vx! += (_ys[i]! - n.x!) * _ss[i]! * alpha
    })
  }
  function init() {
    if (!_ns) return
    const c = _ns.length
    _ss = new Array(c)
    _ys = new Array(c)
    for (let i = 0; i < c; ++i) {
      _ss[i] = isNaN((_ys[i] = +_y(_ns[i]!, i, _ns))) ? 0 : +_strength(_ns[i]!, i, _ns)
    }
  }
  f.init = function (xs: any, _: Function) {
    _ns = xs
    init()
  }
  f.strength = function (x?: number | qt.Force.Op<N>) {
    return x === undefined ? _strength : ((_strength = typeof x === "function" ? x : qu.constant(+x)), init(), f)
  }
  f.y = function (x?: number | qt.Force.Op<N>) {
    return x === undefined ? _y : ((_y = typeof x === "function" ? x : qu.constant(+x)), init(), f)
  }
  return f as qt.Force.PosY<N>
}
export function many<N extends qt.SimNode>() {
  let _ns: N[] = [],
    node,
    _rnd: Function,
    _alpha: number,
    _strength: qt.Force.Op<N> = qu.constant(-30),
    _ss: number[] = [],
    _dmin = 1,
    _dmax = Infinity,
    _theta = 0.81
  function f(alpha: number) {
    function xxx(d) {
      return d.x
    }
    function yyy(d) {
      return d.y
    }
    let i,
      n = _ns.length,
      tree = quadtree(_ns, xxx, yyy).visitAfter(accumulate)
    for (_alpha = alpha, i = 0; i < n; ++i) (node = _ns[i]), tree.visit(apply)
  }
  function init() {
    if (!_ns) return
    _ss = new Array(_ns.length)
    _ns.forEach((n, i) => {
      _ss[n.idx!] = +_strength(n, i, _ns)
    })
  }
  function accumulate(quad) {
    let strength = 0,
      q,
      c,
      weight = 0,
      x,
      y,
      i
    if (quad.length) {
      for (x = y = i = 0; i < 4; ++i) {
        if ((q = quad[i]) && (c = Math.abs(q.value))) {
          ;(strength += q.value), (weight += c), (x += c * q.x), (y += c * q.y)
        }
      }
      quad.x = x / weight
      quad.y = y / weight
    } else {
      q = quad
      q.x = q.data.x
      q.y = q.data.y
      do strength += _ss[q.data.idx]
      while ((q = q.next))
    }
    quad.value = strength
  }
  function apply(quad, x1, _, x2) {
    if (!quad.value) return true
    let x = quad.x - node.x,
      y = quad.y - node.y,
      w = x2 - x1,
      l = x * x + y * y
    if ((w * w) / _theta < l) {
      if (l < _dmax) {
        if (x === 0) (x = jiggle(_rnd)), (l += x * x)
        if (y === 0) (y = jiggle(_rnd)), (l += y * y)
        if (l < _dmin) l = Math.sqrt(_dmin * l)
        node.vx += (x * quad.value * _alpha) / l
        node.vy += (y * quad.value * _alpha) / l
      }
      return true
    } else if (quad.length || l >= _dmax) return
    if (quad.data !== node || quad.next) {
      if (x === 0) (x = jiggle(_rnd)), (l += x * x)
      if (y === 0) (y = jiggle(_rnd)), (l += y * y)
      if (l < _dmin) l = Math.sqrt(_dmin * l)
    }
    do
      if (quad.data !== node) {
        w = (_ss[quad.data.idx] * _alpha) / l
        node.vx += x * w
        node.vy += y * w
      }
    while ((quad = quad.next))
  }
  f.distanceMax = function (x?: number) {
    return x === undefined ? Math.sqrt(_dmax) : ((_dmax = x * x), f)
  }
  f.distanceMin = function (x?: number) {
    return x === undefined ? Math.sqrt(_dmin) : ((_dmin = x * x), f)
  }
  f.init = function (xs: any, rnd: Function) {
    _ns = xs
    _rnd = rnd
    init()
  }
  f.strength = function (x?: number | qt.Force.Op<N>) {
    return x === undefined ? _strength : ((_strength = typeof x === "function" ? x : qu.constant(+x)), init(), f)
  }
  f.theta = function (x?: number) {
    return x === undefined ? Math.sqrt(_theta) : ((_theta = x * x), f)
  }
  return f as qt.Force.Many<N>
}
export function link<N extends qt.SimNode, L extends qt.SimLink<N>>(xs: L[] = []) {
  let _d: qt.Force.Op<L> = qu.constant(30)
  let _ds: number[] = []
  let _id: qt.Force.Op<N, number | string> = (x: any) => x.idx
  let _iters = 1
  let _ls = xs
  let _ns: N[] = []
  let _rnd: Function
  let _ss: number[] = []
  let _strength: qt.Force.Op<L> = defaultStrength
  let bias
  let count
  function defaultStrength(link) {
    return 1 / Math.min(count[link.source.idx], count[link.target.idx])
  }
  function f(alpha: number) {
    for (let k = 0, n = _ls.length; k < _iters; ++k) {
      for (let i = 0, link, source, target, x, y, l, b; i < n; ++i) {
        ;(link = _ls[i]), (source = link.source), (target = link.target)
        x = target.x + target.vx - source.x - source.vx || jiggle(_rnd)
        y = target.y + target.vy - source.y - source.vy || jiggle(_rnd)
        l = Math.sqrt(x * x + y * y)
        l = ((l - _ds[i]) / l) * alpha * _ss[i]
        ;(x *= l), (y *= l)
        target.vx -= x * (b = bias[i])
        target.vy -= y * b
        source.vx += x * (b = 1 - b)
        source.vy += y * b
      }
    }
  }
  function init() {
    if (!_ns) return
    let i,
      n = _ns.length,
      m = _ls.length,
      nodeById = new Map(_ns.map((d, i) => [_id(d, i, _ns), d])),
      link
    function find(byId, nodeId) {
      let node = byId.get(nodeId)
      if (!node) throw new Error("node not found: " + nodeId)
      return node
    }
    for (i = 0, count = new Array(n); i < m; ++i) {
      ;(link = _ls[i]), (link.idx = i)
      if (typeof link.source !== "object") link.source = find(nodeById, link.source)
      if (typeof link.target !== "object") link.target = find(nodeById, link.target)
      count[link.source.idx] = (count[link.source.idx] || 0) + 1
      count[link.target.idx] = (count[link.target.idx] || 0) + 1
    }
    for (i = 0, bias = new Array(m); i < m; ++i) {
      ;(link = _ls[i]), (bias[i] = count[link.source.idx] / (count[link.source.idx] + count[link.target.idx]))
    }
    ;(_ss = new Array(m)), initStrength()
    ;(_ds = new Array(m)), initDistance()
  }
  function initStrength() {
    if (!_ns) return
    _ls.forEach((l, i) => {
      _ss[i] = +_strength(l, i, _ls)
    })
  }
  function initDistance() {
    if (!_ns) return
    _ls.forEach((l, i) => {
      _ds[i] = +_d(l, i, _ls)
    })
  }
  f.distance = function (x?: number | qt.Force.Op<L>) {
    return x === undefined ? _d : ((_d = typeof x === "function" ? x : qu.constant(+x)), initDistance(), f)
  }
  f.id = function (x?: qt.Force.Op<N, number | string>) {
    return x === undefined ? _id : ((_id = x), f)
  }
  f.init = function (xs: any, rnd: Function) {
    _ns = xs
    _rnd = rnd
    init()
  }
  f.iters = function (x?: number) {
    return x === undefined ? _iters : ((_iters = +x), f)
  }
  f.links = function (xs?: any) {
    return xs === undefined ? _ls : ((_ls = xs), init(), f)
  }
  f.strength = function (x?: number | qt.Force.Op<L>) {
    return x === undefined
      ? _strength
      : ((_strength = typeof x === "function" ? x : qu.constant(+x)), initStrength(), f)
  }
  return f as qt.Force.Link<N, L>
}

// https://en.wikipedia.org/wiki/Linear_congruential_generator#Parameters_in_common_use
function lcg() {
  const a = 1664525
  const c = 1013904223
  const m = 4294967296 // 2^32
  let s = 1
  return () => (s = (a * s + c) % m) / m
}
function jiggle(rnd: Function) {
  return (rnd() - 0.5) * 1e-6
}

export function quadtree<T = [number, number]>(xs?: T[]): qt.Quadtree<T>
export function quadtree<T = [number, number]>(xs: T[], x: (x: T) => number, y: (x: T) => number): qt.Quadtree<T>
export function quadtree(xs: any, x?: Function, y?: Function) {
  const defaultX = (x: any) => x[0]
  const defaultY = (x: any) => x[1]
  const tree = new Quadtree(x == null ? defaultX : x, y == null ? defaultY : y, NaN, NaN, NaN, NaN)
  return xs == null ? tree : tree.addAll(xs)
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
    function leaf_copy(leaf) {
      let copy = { data: leaf.data },
        next = copy
      while ((leaf = leaf.next)) next = next.next = { data: leaf.data }
      return copy
    }
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
        const xm = (x1 + x2) / 2,
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
        const dx = x - +this._x.call(null, node.data),
          dy = y - +this._y.call(null, node.data),
          d2 = dx * dx + dy * dy
        if (d2 < radius) {
          const d = Math.sqrt((radius = d2))
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
        const xm = (x0 + x1) / 2,
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
      const node = q.node
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
