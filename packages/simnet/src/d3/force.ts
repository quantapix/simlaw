import { quadtree } from "./quadtree.js"
import type * as qt from "./types.js"
import * as qu from "./utils.js"

const initRadius = 10
const initAngle = Math.PI * (3 - Math.sqrt(5))

export function forceSimulation<T extends qt.SimNode>(xs?: T[]): qt.Sim<T, undefined>
export function forceSimulation<N extends qt.SimNode, L extends qt.SimLink<N>>(xs?: N[]): qt.Sim<N, L>
export function forceSimulation(xs?: qt.SimNode[]) {
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

export namespace force {
  export function center<N extends qt.SimNode>(x = 0, y = 0) {
    let _ns: N[] = []
    let _strength = 1
    let [_x, _y] = [x, y]
    function f() {
      let [sx, sy] = [0, 0]
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
    f.init = function (xs: any, _: any) {
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
      for (let k = 0; k < _iters; ++k) {
        tree = quadtree(_ns, x, y).visitAfter(prepare)
        for (i = 0; i < n; ++i) {
          node = _ns[i]
          ;(ri = _rs[node.index]), (ri2 = ri * ri)
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
          if (data.index > node.index) {
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
      if (quad.data) return (quad.r = _rs[quad.data.index])
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
  export function x<N extends qt.SimNode>(x: number | qt.Force.Op<N> = 0) {
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
    return f as qt.Force.X<N>
  }
  export function y<N extends qt.SimNode>(x: number | qt.Force.Op<N> = 0) {
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
    return f as qt.Force.Y<N>
  }
  export function manyBody<N extends qt.SimNode>() {
    let _ns,
      node,
      _rnd,
      _alpha,
      _strength = qu.constant(-30),
      _ss,
      distanceMin2 = 1,
      distanceMax2 = Infinity,
      theta2 = 0.81
    function f(alpha: number) {
      let i,
        n = _ns.length,
        tree = quadtree(_ns, x, y).visitAfter(accumulate)
      for (_alpha = alpha, i = 0; i < n; ++i) (node = _ns[i]), tree.visit(apply)
    }
    function init() {
      if (!_ns) return
      let i,
        n = _ns.length,
        node
      _ss = new Array(n)
      for (i = 0; i < n; ++i) (node = _ns[i]), (_ss[node.index] = +_strength(node, i, _ns))
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
        do strength += _ss[q.data.index]
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
      if ((w * w) / theta2 < l) {
        if (l < distanceMax2) {
          if (x === 0) (x = jiggle(_rnd)), (l += x * x)
          if (y === 0) (y = jiggle(_rnd)), (l += y * y)
          if (l < distanceMin2) l = Math.sqrt(distanceMin2 * l)
          node.vx += (x * quad.value * _alpha) / l
          node.vy += (y * quad.value * _alpha) / l
        }
        return true
      } else if (quad.length || l >= distanceMax2) return
      if (quad.data !== node || quad.next) {
        if (x === 0) (x = jiggle(_rnd)), (l += x * x)
        if (y === 0) (y = jiggle(_rnd)), (l += y * y)
        if (l < distanceMin2) l = Math.sqrt(distanceMin2 * l)
      }
      do
        if (quad.data !== node) {
          w = (_ss[quad.data.index] * _alpha) / l
          node.vx += x * w
          node.vy += y * w
        }
      while ((quad = quad.next))
    }
    f.distanceMax = function (_) {
      return arguments.length ? ((distanceMax2 = _ * _), f) : Math.sqrt(distanceMax2)
    }
    f.distanceMin = function (_) {
      return arguments.length ? ((distanceMin2 = _ * _), f) : Math.sqrt(distanceMin2)
    }
    f.init = function (_nodes, _random) {
      _ns = _nodes
      _rnd = _random
      init()
    }
    f.strength = function (_) {
      return arguments.length ? ((_strength = typeof _ === "function" ? _ : qu.constant(+_)), init(), f) : _strength
    }
    f.theta = function (_) {
      return arguments.length ? ((theta2 = _ * _), f) : Math.sqrt(theta2)
    }
    return f as qt.Force.ManyBody<N>
  }
  export function link<N extends qt.SimNode, L extends qt.SimLink<N>>(xs?: L[]) {
    let id = index,
      _strength = defaultStrength,
      _ss,
      distance = qu.constant(30),
      distances,
      _ns,
      count,
      bias,
      _rnd,
      _iters = 1
    const ls = xs ?? []
    function defaultStrength(link) {
      return 1 / Math.min(count[link.source.index], count[link.target.index])
    }
    function f(alpha: number) {
      for (let k = 0, n = ls.length; k < _iters; ++k) {
        for (let i = 0, link, source, target, x, y, l, b; i < n; ++i) {
          ;(link = ls[i]), (source = link.source), (target = link.target)
          x = target.x + target.vx - source.x - source.vx || jiggle(_rnd)
          y = target.y + target.vy - source.y - source.vy || jiggle(_rnd)
          l = Math.sqrt(x * x + y * y)
          l = ((l - distances[i]) / l) * alpha * _ss[i]
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
        m = ls.length,
        nodeById = new Map(_ns.map((d, i) => [id(d, i, _ns), d])),
        link
      for (i = 0, count = new Array(n); i < m; ++i) {
        ;(link = ls[i]), (link.index = i)
        if (typeof link.source !== "object") link.source = find(nodeById, link.source)
        if (typeof link.target !== "object") link.target = find(nodeById, link.target)
        count[link.source.index] = (count[link.source.index] || 0) + 1
        count[link.target.index] = (count[link.target.index] || 0) + 1
      }
      for (i = 0, bias = new Array(m); i < m; ++i) {
        ;(link = ls[i]), (bias[i] = count[link.source.index] / (count[link.source.index] + count[link.target.index]))
      }
      ;(_ss = new Array(m)), initStrength()
      ;(distances = new Array(m)), initDistance()
    }
    function initStrength() {
      if (!_ns) return
      for (let i = 0, n = ls.length; i < n; ++i) {
        _ss[i] = +_strength(ls[i], i, ls)
      }
    }
    function initDistance() {
      if (!_ns) return
      for (let i = 0, n = ls.length; i < n; ++i) {
        distances[i] = +distance(ls[i], i, ls)
      }
    }
    f.distance = function (_) {
      return arguments.length
        ? ((distance = typeof _ === "function" ? _ : qu.constant(+_)), initDistance(), f)
        : distance
    }
    f.id = function (_) {
      return arguments.length ? ((id = _), f) : id
    }
    f.init = function (_nodes, _random) {
      _ns = _nodes
      _rnd = _random
      init()
    }
    f.iters = function (_) {
      return arguments.length ? ((_iters = +_), f) : _iters
    }
    f.links = function (_) {
      return arguments.length ? ((ls = _), init(), f) : ls
    }
    f.strength = function (_) {
      return arguments.length
        ? ((_strength = typeof _ === "function" ? _ : qu.constant(+_)), initStrength(), f)
        : _strength
    }
    return f as qt.Force.Link<N, L>
  }
}
function x(d) {
  return d.x + d.vx
}
function y(d) {
  return d.y + d.vy
}
export function jiggle(random) {
  return (random() - 0.5) * 1e-6
}
const a = 1664525
const c = 1013904223
const m = 4294967296 // 2^32
export function lcg() {
  let s = 1
  return () => (s = (a * s + c) % m) / m
}
function index(d) {
  return d.index
}
function find(nodeById, nodeId) {
  let node = nodeById.get(nodeId)
  if (!node) throw new Error("node not found: " + nodeId)
  return node
}
export function x(d) {
  return d.x
}
export function y(d) {
  return d.y
}
