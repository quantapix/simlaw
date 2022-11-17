/* eslint-disable no-cond-assign */
import type * as qt from "./types.js"
import * as qu from "./utils.js"

export function sim<N extends qt.SimNode>(xs?: N[]): qt.Sim<N, undefined>
export function sim<N extends qt.SimNode, L extends qt.SimLink<N>>(xs?: N[]): qt.Sim<N, L>
export function sim<N extends qt.SimNode>(xs: N[] = []) {
  const _event = qu.dispatch("tick", "end")
  const _fs = new Map()
  const _stepper = qu.timer(step)
  let _alpha = 1
  let _min = 0.001
  let _decay = 1 - Math.pow(_min, 1 / 300)
  let _target = 0
  let _ns = xs
  let _rnd = lcg()
  let _vDecay = 0.6
  function init() {
    const r0 = 10
    const a0 = Math.PI * (3 - Math.sqrt(5))
    _ns.forEach((n, i) => {
      n.idx = i
      if (n.fx !== undefined) n.x = n.fx
      if (n.fy !== undefined) n.y = n.fy
      if (isNaN(n.x) || isNaN(n.y)) {
        const r = r0 * Math.sqrt(0.5 + i)
        const a = i * a0
        n.x = r * Math.cos(a)
        n.y = r * Math.sin(a)
      }
      if (isNaN(n.vx) || isNaN(n.vy)) n.vx = n.vy = 0
    })
  }
  init()
  function initForce(x: any) {
    if (x.init) x.init(_ns, _rnd)
    return x
  }
  function tick(n = 1) {
    for (let i = 0; i < n; ++i) {
      _alpha += (_target - _alpha) * _decay
      _fs.forEach(f => {
        f(_alpha)
      })
      _ns.forEach(n => {
        if (n.fx === undefined) n.x += n.vx *= _vDecay
        else (n.x = n.fx), (n.vx = 0)
        if (n.fy === undefined) n.y += n.vy *= _vDecay
        else (n.y = n.fy), (n.vy = 0)
      })
    }
    return sim
  }
  function step() {
    tick()
    _event.call("tick", sim)
    if (_alpha < _min) {
      _stepper.stop()
      _event.call("end", sim)
    }
  }
  const sim = {
    alpha: (x?: number) => (x === undefined ? _alpha : ((_alpha = +x), sim)),
    alphaDecay: (x?: number) => (x === undefined ? +_decay : ((_decay = +x), sim)),
    alphaMin: (x?: number) => (x === undefined ? _min : ((_min = +x), sim)),
    alphaTarget: (x?: number) => (x === undefined ? _target : ((_target = +x), sim)),
    find: function (x: number, y: number, r?: number) {
      let res: N | undefined
      if (r === undefined) r = Infinity
      else r *= r
      _ns.forEach(n => {
        const dx = x - n.x
        const dy = y - n.y
        const d2 = dx * dx + dy * dy
        if (d2 < r!) (res = n), (r = d2)
      })
      return res
    },
    force: (x: string, f?: any) =>
      f === undefined ? _fs.get(x) : (f == null ? _fs.delete(x) : _fs.set(x, initForce(f)), sim),
    nodes: (xs?: any[]) => (xs === undefined ? _ns : ((_ns = xs), init(), _fs.forEach(initForce), sim)),
    on: (x: any, f?: any) => (f === undefined ? _event.on(x) : (_event.on(x, f), sim)),
    randomSource: (f?: any) => (f === undefined ? _rnd : ((_rnd = f), _fs.forEach(initForce), sim)),
    restart: () => (_stepper.restart(step), sim),
    stop: () => (_stepper.stop(), sim),
    tick,
    veloDecay: (x?: number) => (x === undefined ? 1 - _vDecay : ((_vDecay = 1 - x), sim)),
  }
  return sim
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
      sx += n.x
      sy += n.y
    })
    const c = _ns.length
    sx = (sx / c - _x!) * _strength
    sy = (sy / c - _y!) * _strength
    _ns.forEach(n => {
      n.x -= sx
      n.y -= sy
    })
  }
  f.init = (xs: any, _: Function) => (_ns = xs)
  f.strength = (x?: number) => (x === undefined ? _strength : ((_strength = +x), f))
  f.x = (x?: number) => (x === undefined ? _x : ((_x = +x), f))
  f.y = (x?: number) => (x === undefined ? _y : ((_y = +x), f))
  return f as qt.Force.Center<N>
}
export function collide<N extends qt.SimNode>(r: number | qt.Op<N> = 1) {
  let _iters = 1
  let _ns: N[] = []
  let _r = typeof r === "function" ? r : qu.constant(+r)
  let _rnd: Function
  let _rs: number[] = []
  let _strength = 1
  function f() {
    const n = _ns.length
    let i, tree, node: N, xi, yi, ri, ri2
    const xxx = d => d.x + d.vx
    const yyy = d => d.y + d.vy
    for (let k = 0; k < _iters; ++k) {
      tree = quadtree(_ns, xxx, yyy).visitAfter(prepare)
      for (i = 0; i < n; ++i) {
        node = _ns[i]!
        ;(ri = _rs[node.idx]), (ri2 = ri * ri)
        xi = node.x + node.vx
        yi = node.y + node.vy
        tree.visit(apply)
      }
    }
    function apply(quad, x0, y0, x1, y1) {
      const data = quad.data
      let rj = quad.r,
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
      if (quad[i] && quad[i].r > quad.r) quad.r = quad[i].r
    }
  }
  function init() {
    if (!_ns) return
    _rs = new Array(_ns.length)
    _ns.forEach((n, i) => {
      _rs[n.idx] = +_r(n, i, _ns)
    })
  }
  f.init = (xs: any, rnd: Function) => ((_ns = xs), (_rnd = rnd), init())
  f.iters = (x?: number) => (x === undefined ? _iters : ((_iters = +x), f))
  f.radius = (x?: number | qt.Op<N>) =>
    x === undefined ? _r : ((_r = typeof x === "function" ? x : qu.constant(+x)), init(), f)
  f.strength = (x?: number) => (x === undefined ? _strength : ((_strength = +x), f))
  return f as qt.Force.Collide<N>
}
export function radial<N extends qt.SimNode>(r: number | qt.Op<N>, x: number | qt.Op<N> = 0, y: number | qt.Op<N> = 0) {
  let _ns: N[] = []
  let _r = typeof r === "function" ? r : qu.constant(+r)
  let _rs: number[] = []
  let _ss: number[] = []
  let _strength: qt.Op<N> = qu.constant(0.1)
  let [_x, _y] = [x, y]
  function f(alpha: number) {
    let dx, dy, k
    _ns.forEach((n, i) => {
      dx = n.x - _x || 1e-6
      dy = n.y - _y || 1e-6
      r = Math.sqrt(dx * dx + dy * dy)
      k = ((_rs[i]! - r) * _ss[i]! * alpha) / r
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
  f.init = (xs: any, _: Function) => ((_ns = xs), init())
  f.strength = (x?: number | qt.Op<N>) =>
    x === undefined ? _strength : ((_strength = typeof x === "function" ? x : qu.constant(+x)), init(), f)
  f.radius = (x?: number | qt.Op<N>) =>
    x === undefined ? _r : ((_r = typeof x === "function" ? x : qu.constant(+x)), init(), f)
  f.x = (x?: number | qt.Op<N>) => (x === undefined ? _x : ((_x = +x), f))
  f.y = (x?: number | qt.Op<N>) => (x === undefined ? _y : ((_y = +x), f))
  return f as qt.Force.Radial<N>
}
export function posX<N extends qt.SimNode>(x: number | qt.Op<N> = 0) {
  let _ns: N[] = []
  let _ss: number[] = []
  let _strength: qt.Op<N> = qu.constant(0.1)
  let _x = typeof x === "function" ? x : qu.constant(+x)
  let _xs: number[] = []
  function f(alpha: number) {
    _ns.forEach((n, i) => {
      n.vx += (_xs[i]! - n.x) * _ss[i]! * alpha
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
  f.init = (xs: any, _: Function) => ((_ns = xs), init())
  f.strength = (x?: number | qt.Op<N>) =>
    x === undefined ? _strength : ((_strength = typeof x === "function" ? x : qu.constant(+x)), init(), f)
  f.x = (x?: number | qt.Op<N>) =>
    x === undefined ? _x : ((_x = typeof x === "function" ? x : qu.constant(+x)), init(), f)
  return f as qt.Force.PosX<N>
}
export function posY<N extends qt.SimNode>(x: number | qt.Op<N> = 0) {
  let _ns: N[] = []
  let _ss: number[] = []
  let _strength: qt.Op<N> = qu.constant(0.1)
  let _y = typeof x === "function" ? x : qu.constant(+x)
  let _ys: number[] = []
  function f(alpha: number) {
    _ns.forEach((n, i) => {
      n.vx += (_ys[i]! - n.x) * _ss[i]! * alpha
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
  f.init = (xs: any, _: Function) => ((_ns = xs), init())
  f.strength = (x?: number | qt.Op<N>) =>
    x === undefined ? _strength : ((_strength = typeof x === "function" ? x : qu.constant(+x)), init(), f)
  f.y = (x?: number | qt.Op<N>) =>
    x === undefined ? _y : ((_y = typeof x === "function" ? x : qu.constant(+x)), init(), f)
  return f as qt.Force.PosY<N>
}
export function many<N extends qt.SimNode>() {
  let _alpha: number
  let _dmax = Infinity
  let _dmin = 1
  let _ns: N[] = []
  let _rnd: Function
  let _ss: number[] = []
  let _strength: qt.Op<N> = qu.constant(-30)
  let _theta = 0.81
  let node
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
      do strength += _ss[q.data.idx]!
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
        w = (_ss[quad.data.idx]! * _alpha) / l
        node.vx += x * w
        node.vy += y * w
      }
    while ((quad = quad.next))
  }
  function f(alpha: number) {
    _alpha = alpha
    const tree = quadtree(
      _ns,
      n => n.x,
      n => n.y
    ).visitAfter(accumulate)
    for (let i = 0; i < _ns.length; ++i) (node = _ns[i]), tree.visit(apply)
  }
  function init() {
    if (!_ns) return
    _ss = new Array(_ns.length)
    _ns.forEach((n, i) => {
      _ss[n.idx] = +_strength(n, i, _ns)
    })
  }
  f.distanceMax = (x?: number) => (x === undefined ? Math.sqrt(_dmax) : ((_dmax = x * x), f))
  f.distanceMin = (x?: number) => (x === undefined ? Math.sqrt(_dmin) : ((_dmin = x * x), f))
  f.init = (xs: any, rnd: Function) => ((_ns = xs), (_rnd = rnd), init())
  f.strength = (x?: number | qt.Op<N>) =>
    x === undefined ? _strength : ((_strength = typeof x === "function" ? x : qu.constant(+x)), init(), f)
  f.theta = (x?: number) => (x === undefined ? Math.sqrt(_theta) : ((_theta = x * x), f))
  return f as qt.Force.Many<N>
}
export function link<N extends qt.SimNode, L extends qt.SimLink<N>>(xs: L[] = []) {
  let _d: qt.Op<L> = qu.constant(30)
  let _ds: number[] = []
  let _id: qt.Op<N, number | string> = (x: any) => x.idx
  let _iters = 1
  let _ls = xs
  let _ns: N[] = []
  let _rnd: Function
  let _ss: number[] = []
  let _strength: qt.Op<L> = defaultStrength
  let bias: number[]
  let count: number[]
  function defaultStrength(link: L) {
    return 1 / Math.min(count[link.src.idx]!, count[link.tgt.idx]!)
  }
  function f(alpha: number) {
    for (let k = 0, n = _ls.length; k < _iters; ++k) {
      let link: L, src, tgt, x, y, l, b
      for (let i = 0; i < n; ++i) {
        link = _ls[i]!
        src = link.src as N
        tgt = link.tgt as N
        x = tgt.x + tgt.vx - src.x - src.vx || jiggle(_rnd)
        y = tgt.y + tgt.vy - src.y - src.vy || jiggle(_rnd)
        l = Math.sqrt(x * x + y * y)
        l = ((l - _ds[i]!) / l) * alpha * _ss[i]!
        ;(x *= l), (y *= l)
        tgt.vx -= x * (b = bias[i]!)
        tgt.vy -= y * b
        src.vx += x * (b = 1 - b)
        src.vy += y * b
      }
    }
  }
  function init() {
    if (!_ns) return
    const n = _ns.length,
      m = _ls.length,
      nodeById = new Map(_ns.map((d, i) => [_id(d, i, _ns), d]))
    let i, link: L
    function find(byId, nodeId) {
      const y = byId.get(nodeId)
      if (!y) throw new Error("node not found: " + nodeId)
      return y
    }
    for (i = 0, count = new Array(n); i < m; ++i) {
      link = _ls[i]!
      link.idx = i
      if (typeof link.src !== "object") link.src = find(nodeById, link.src)
      if (typeof link.tgt !== "object") link.tgt = find(nodeById, link.tgt)
      count[link.src.idx] = (count[link.src.idx] || 0) + 1
      count[link.tgt.idx] = (count[link.tgt.idx] || 0) + 1
    }
    for (i = 0, bias = new Array(m); i < m; ++i) {
      link = _ls[i]!
      bias[i] = count[link.src.idx]! / (count[link.src.idx]! + count[link.src.idx]!)
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
  f.distance = (x?: number | qt.Op<L>) =>
    x === undefined ? _d : ((_d = typeof x === "function" ? x : qu.constant(+x)), initDistance(), f)
  f.id = (x?: qt.Op<N, number | string>) => (x === undefined ? _id : ((_id = x), f))
  f.init = (xs: any, rnd: Function) => ((_ns = xs), (_rnd = rnd), init())
  f.iters = (x?: number) => (x === undefined ? _iters : ((_iters = +x), f))
  f.links = (xs?: any) => (xs === undefined ? _ls : ((_ls = xs), init(), f))
  f.strength = (x?: number | qt.Op<L>) =>
    x === undefined ? _strength : ((_strength = typeof x === "function" ? x : qu.constant(+x)), initStrength(), f)
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

class Quad<T> {
  n: qt.QuadNode<T> | qt.QuadLeaf<T> | undefined
  ps: qt.Pair<qt.Point>
  constructor(n: qt.QuadNode<T> | qt.QuadLeaf<T> | undefined, ps: qt.Pair<qt.Point>)
  constructor(n: qt.QuadNode<T> | qt.QuadLeaf<T> | undefined, ...ps: number[])
  constructor(n: qt.QuadNode<T> | qt.QuadLeaf<T> | undefined, ps: any) {
    this.n = n
    this.ps = ps
  }
}

export function quadtree<T>(xs?: T[]): qt.Quadtree<T>
export function quadtree<T>(xs: T[], x: (t: T) => number, y: (t: T) => number): qt.Quadtree<T>
export function quadtree(xs: any, x?: (t: any) => number, y?: (t: any) => number) {
  const r = new Quadtree(x === undefined ? (t: any) => t[0] : x, y === undefined ? (t: any) => t[1] : y)
  return xs == undefined ? r : r.addAll(xs)
}
class Quadtree<T> implements qt.Quadtree<T> {
  _x
  _y
  _root?: qt.QuadNode<T> | qt.QuadLeaf<T> | undefined
  ps: qt.Pair<qt.Point> = [
    [NaN, NaN],
    [NaN, NaN],
  ]
  constructor(x: Quadtree<T>)
  constructor(x: (t: T) => number, y: (t: T) => number, ps?: qt.Pair<qt.Point>)
  constructor(x: any, y?: (t: T) => number, ps?: qt.Pair<qt.Point>) {
    if (typeof x !== "function") (x = x._x), (y = x._y), (ps = x.ps)
    this._x = x
    this._y = y!
    if (ps) this.ps = ps
  }
  add(t: T) {
    const x = +this._x.call(null, t)
    const y = +this._y.call(null, t)
    return this.cover(x, y).addOne(x, y, t)
  }
  addOne(x: number, y: number, data: T) {
    if (isNaN(x) || isNaN(y)) return this
    const leaf = { data } as qt.QuadLeaf<T>
    let n = this._root
    if (!n) return (this._root = leaf), this
    let [[x0, y0], [x1, y1]] = this.ps
    let xm: number,
      ym: number,
      right: number,
      bottom: number,
      i = 0,
      n2: qt.QuadNode<T> | undefined
    while (n.length) {
      if ((right = x >= (xm = (x0 + x1) / 2) ? 1 : 0)) x0 = xm
      else x1 = xm
      if ((bottom = y >= (ym = (y0 + y1) / 2) ? 1 : 0)) y0 = ym
      else y1 = ym
      i = (bottom << 1) | right
      n2 = n
      n = n[i]
      if (!n) return (n2[i] = leaf), this
    }
    const xp = +this._x.call(null, n.data)
    const yp = +this._y.call(null, n.data)
    if (x === xp && y === yp) return (leaf.next = n), n2 ? (n2[i] = leaf) : (this._root = leaf), this
    let j: number
    do {
      n2 = n2 ? (n2[i] = new Array(4) as qt.QuadNode<T>) : (this._root = new Array(4) as qt.QuadNode<T>)
      if ((right = x >= (xm = (x0 + x1) / 2) ? 1 : 0)) x0 = xm
      else x1 = xm
      if ((bottom = y >= (ym = (y0 + y1) / 2) ? 1 : 0)) y0 = ym
      else y1 = ym
    } while ((i = (bottom << 1) | right) === (j = (((yp >= ym) as any) << 1) | ((xp >= xm) as any)))
    return (n2[j] = n), (n2[i] = leaf), this
  }
  addAll(ts: T[]) {
    if (!Array.isArray(ts)) ts = Array.from(ts)
    const n = ts.length
    const xs = new Float64Array(n)
    const ys = new Float64Array(n)
    let x0 = Infinity
    let y0 = x0
    let x1 = -x0
    let y1 = x1
    ts.forEach((t, i) => {
      const x = +this._x.call(null, t)
      const y = +this._y.call(null, t)
      if (!isNaN(x) && !isNaN(y)) {
        xs[i] = x
        ys[i] = y
        if (x < x0) x0 = x
        if (x > x1) x1 = x
        if (y < y0) y0 = y
        if (y > y1) y1 = y
      }
    })
    if (x0 > x1 || y0 > y1) return this
    this.cover(x0, y0).cover(x1, y1)
    ts.forEach((t, i) => {
      this.addOne(xs[i]!, ys[i]!, t)
    })
    return this
  }
  copy() {
    const r = new Quadtree<T>(this)
    const n = this._root
    if (!n) return r
    function leaf(x?: qt.QuadLeaf<T>) {
      const r: qt.QuadLeaf<T> = { data: x!.data }
      let n = r
      while ((x = x!.next)) n = n.next = { data: x.data }
      return r
    }
    if (!n.length) return (r._root = leaf(n)), r
    const xs = [{ src: n, tgt: (r._root = new Array(4) as qt.QuadNode<T>) }]
    while (true) {
      const x = xs.pop()
      if (!x) break
      x.src.forEach((c, i) => {
        if (c) {
          if (c.length) xs.push({ src: c, tgt: (x.tgt[i] = new Array(4) as qt.QuadNode<T>) })
          else x.tgt[i] = leaf(c)
        }
      })
    }
    return r
  }
  cover(x: number, y: number) {
    if (isNaN((x = +x)) || isNaN((y = +y))) return this
    let { x0, y0, x1, y1 } = this
    if (isNaN(x0)) {
      x1 = (x0 = Math.floor(x)) + 1
      y1 = (y0 = Math.floor(y)) + 1
    } else {
      let z = x1 - x0 || 1
      let n = this._root
      while (x0 > x || x >= x1 || y0 > y || y >= y1) {
        const i = ((y < y0 ? 1 : 0) << 1) | (x < x0 ? 1 : 0)
        const n2 = new Array(4) as qt.QuadNode<T>
        n2[i] = n
        n = n2
        z *= 2
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
      if (this._root && this._root.length) this._root = n
    }
    this.x0 = x0
    this.y0 = y0
    this.x1 = x1
    this.y1 = y1
    return this
  }
  data() {
    const r: T[] = []
    this.visit(function (x: qt.QuadNode<T> | qt.QuadLeaf<T>) {
      if (!x.length) {
        let l: qt.QuadLeaf<T> | undefined = x
        do r.push(l.data)
        while ((l = l.next))
      }
    })
    return r
  }
  extent(): qt.Pair<qt.Point> | undefined
  extent(x: qt.Pair<qt.Point>): this
  extent(x?: any) {
    return x !== undefined
      ? this.cover(+x[0][0], +x[0][1]).cover(+x[1][0], +x[1][1])
      : isNaN(this.ps[0][0])
      ? undefined
      : this.ps
  }
  find(x: number, y: number, r?: number) {
    const qs: Quad<T>[] = []
    let n = this._root
    let [[x0, y0], [x3, y3]] = this.ps
    if (n) qs.push(new Quad(n, x0, y0, x3, y3))
    if (r === undefined) r = Infinity
    else {
      ;(x0 = x - r), (y0 = y - r)
      ;(x3 = x + r), (y3 = y + r)
      r *= r
    }
    let t
    while (true) {
      let q = qs.pop()
      if (!q) break
      n = q.n
      const [[x1, y1], [x2, y2]] = q.ps
      if (!n || x1 > x3 || y1 > y3 || x2 < x0 || y2 < y0) continue
      if (n.length) {
        const xm = (x1 + x2) / 2
        const ym = (y1 + y2) / 2
        qs.push(
          new Quad(n[3], xm, ym, x2, y2),
          new Quad(n[2], x1, ym, xm, y2),
          new Quad(n[1], xm, y1, x2, ym),
          new Quad(n[0], x1, y1, xm, ym)
        )
        const i = ((y >= ym ? 1 : 0) << 1) | (x >= xm ? 1 : 0)
        if (i) {
          const j = qs.length - 1
          q = qs[j]!
          qs[j] = qs[j - i]!
          qs[j - i] = q
        }
      } else {
        const dx = x - +this._x.call(null, n.data)
        const dy = y - +this._y.call(null, n.data)
        const d2 = dx * dx + dy * dy
        if (d2 < r) {
          const d = Math.sqrt((r = d2))
          ;(x0 = x - d), (y0 = y - d)
          ;(x3 = x + d), (y3 = y + d)
          t = n.data
        }
      }
    }
    return t
  }
  remove(t: any) {
    let x
    let y
    if (isNaN((x = +this._x.call(null, t))) || isNaN((y = +this._y.call(null, t)))) return this
    let n = this._root
    if (!n) return this
    let [[x0, y0], [x1, y1]] = this.ps
    let xm: number
    let ym: number
    let bottom: number
    let right: number
    let parent
    let retainer
    let prev
    let next
    let i
    let j
    if (n.length)
      while (true) {
        if ((right = x >= (xm = (x0 + x1) / 2) ? 1 : 0)) x0 = xm
        else x1 = xm
        if ((bottom = y >= (ym = (y0 + y1) / 2) ? 1 : 0)) y0 = ym
        else y1 = ym
        if (!((parent = n), (n = n[(i = (bottom << 1) | right)]))) return this
        if (!n.length) break
        if (parent[(i + 1) & 3] || parent[(i + 2) & 3] || parent[(i + 3) & 3]) (retainer = parent), (j = i)
      }
    while (n.data !== t) if (!((prev = n), (n = n.next))) return this
    if ((next = n.next)) delete n.next
    if (prev) return next ? (prev.next = next) : delete prev.next, this
    if (!parent) return (this._root = next), this
    next ? (parent[i] = next) : delete parent[i]
    if (
      (n = parent[0] || parent[1] || parent[2] || parent[3]) &&
      n === (parent[3] || parent[2] || parent[1] || parent[0]) &&
      !n.length
    ) {
      if (retainer) retainer[j] = n
      else this._root = n
    }
    return this
  }
  removeAll(ts: any[]) {
    ts.forEach(t => {
      this.remove(t)
    })
    return this
  }
  root() {
    return this._root
  }
  size() {
    let r = 0
    this.visit(function (x: qt.QuadNode<T> | qt.QuadLeaf<T>) {
      if (!x?.length) {
        let l: qt.QuadLeaf<T> | undefined = x
        do ++r
        while ((l = l.next))
      }
    })
    return r
  }
  visit(f: Function) {
    const qs: Quad<T>[] = []
    let n = this._root
    if (n) qs.push(new Quad(n, this.ps))
    while (true) {
      const q = qs.pop()
      if (!q) break
      n = q.n!
      const [[x0, y0], [x1, y1]] = q.ps
      if (!f(n, x0, y0, x1, y1) && n.length) {
        const xm = (x0 + x1) / 2
        const ym = (y0 + y1) / 2
        let c
        if ((c = n[3])) qs.push(new Quad(c, xm, ym, x1, y1))
        if ((c = n[2])) qs.push(new Quad(c, x0, ym, xm, y1))
        if ((c = n[1])) qs.push(new Quad(c, xm, y0, x1, ym))
        if ((c = n[0])) qs.push(new Quad(c, x0, y0, xm, ym))
      }
    }
    return this
  }
  visitAfter(f: Function) {
    const qs: Quad<T>[] = []
    let n = this._root
    if (n) qs.push(new Quad(n, this.ps))
    const qs2: Quad<T>[] = []
    while (true) {
      const q = qs.pop()
      if (!q) break
      n = q.n!
      if (n.length) {
        const [[x0, y0], [x1, y1]] = q.ps
        const xm = (x0 + x1) / 2
        const ym = (y0 + y1) / 2
        let c
        if ((c = n[0])) qs.push(new Quad(c, x0, y0, xm, ym))
        if ((c = n[1])) qs.push(new Quad(c, xm, y0, x1, ym))
        if ((c = n[2])) qs.push(new Quad(c, x0, ym, xm, y1))
        if ((c = n[3])) qs.push(new Quad(c, xm, ym, x1, y1))
      }
      qs2.push(q)
    }
    qs2.forEach(q => {
      const [[x0, y0], [x1, y1]] = q.ps
      f(q.n, x0, y0, x1, y1)
    })
    return this
  }
  x(): (t: T) => number
  x(x: (t: T) => number): this
  x(x?: any) {
    return x === undefined ? this._x : ((this._x = x), this)
  }
  y(): (t: T) => number
  y(y: (t: T) => number): this
  y(x?: any) {
    return x === undefined ? this._y : ((this._y = x), this)
  }
}
