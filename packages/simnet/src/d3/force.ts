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

export function forceCenter<T extends qt.SimNode>(x?: number, y?: number) {
  if (x == undefined) x = 0
  if (y == undefined) y = 0
  let ns: qt.SimNode[]
  let strength = 1
  function force() {
    const n = ns.length
    let sx = 0,
      sy = 0
    ns.forEach(x => {
      sx += x.x!
      sy += x.y!
    })
    sx = (sx / n - x!) * strength
    sy = (sy / n - y!) * strength
    ns.forEach(x => {
      x.x! -= sx
      x.y! -= sy
    })
  }
  force.init = function (xs: any) {
    ns = xs
  }
  force.strength = function (x?: number) {
    return x === undefined ? strength : ((strength = +x), force)
  }
  force.x = function (x2?: number) {
    return x2 === undefined ? x : ((x = +x2), force)
  }
  force.y = function (x?: number) {
    return x === undefined ? y : ((y = +x), force)
  }
  return force as qt.ForceCenter<T>
}
function x(d) {
  return d.x + d.vx
}
function y(d) {
  return d.y + d.vy
}
export function forceCollide<T extends qt.SimNode>(
  radius?: number | ((node: T, i: number, nodes: T[]) => number)
): qt.ForceCollide<T> {
  let nodes,
    radii,
    random,
    strength = 1,
    iterations = 1
  if (typeof radius !== "function") radius = qu.constant(radius == null ? 1 : +radius)
  function force() {
    let i,
      n = nodes.length,
      tree,
      node,
      xi,
      yi,
      ri,
      ri2
    for (let k = 0; k < iterations; ++k) {
      tree = quadtree(nodes, x, y).visitAfter(prepare)
      for (i = 0; i < n; ++i) {
        node = nodes[i]
        ;(ri = radii[node.index]), (ri2 = ri * ri)
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
            if (x === 0) (x = jiggle(random)), (l += x * x)
            if (y === 0) (y = jiggle(random)), (l += y * y)
            l = ((r - (l = Math.sqrt(l))) / l) * strength
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
    if (quad.data) return (quad.r = radii[quad.data.index])
    for (let i = (quad.r = 0); i < 4; ++i) {
      if (quad[i] && quad[i].r > quad.r) {
        quad.r = quad[i].r
      }
    }
  }
  function initialize() {
    if (!nodes) return
    let i,
      n = nodes.length,
      node
    radii = new Array(n)
    for (i = 0; i < n; ++i) (node = nodes[i]), (radii[node.index] = +radius(node, i, nodes))
  }
  force.initialize = function (_nodes, _random) {
    nodes = _nodes
    random = _random
    initialize()
  }
  force.iterations = function (_) {
    return arguments.length ? ((iterations = +_), force) : iterations
  }
  force.strength = function (_) {
    return arguments.length ? ((strength = +_), force) : strength
  }
  force.radius = function (_) {
    return arguments.length ? ((radius = typeof _ === "function" ? _ : qu.constant(+_)), initialize(), force) : radius
  }
  return force
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
export function forceLink<N extends qt.SimNode, L extends qt.SimLink<N>>(xs?: L[]): qt.ForceLink<N, L> {
  let id = index,
    strength = defaultStrength,
    strengths,
    distance = qu.constant(30),
    distances,
    nodes,
    count,
    bias,
    random,
    iterations = 1
  const ls = xs ?? []
  function defaultStrength(link) {
    return 1 / Math.min(count[link.source.index], count[link.target.index])
  }
  function force(alpha) {
    for (let k = 0, n = ls.length; k < iterations; ++k) {
      for (var i = 0, link, source, target, x, y, l, b; i < n; ++i) {
        ;(link = ls[i]), (source = link.source), (target = link.target)
        x = target.x + target.vx - source.x - source.vx || jiggle(random)
        y = target.y + target.vy - source.y - source.vy || jiggle(random)
        l = Math.sqrt(x * x + y * y)
        l = ((l - distances[i]) / l) * alpha * strengths[i]
        ;(x *= l), (y *= l)
        target.vx -= x * (b = bias[i])
        target.vy -= y * b
        source.vx += x * (b = 1 - b)
        source.vy += y * b
      }
    }
  }
  function initialize() {
    if (!nodes) return
    let i,
      n = nodes.length,
      m = ls.length,
      nodeById = new Map(nodes.map((d, i) => [id(d, i, nodes), d])),
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
    ;(strengths = new Array(m)), initializeStrength()
    ;(distances = new Array(m)), initializeDistance()
  }
  function initializeStrength() {
    if (!nodes) return
    for (let i = 0, n = ls.length; i < n; ++i) {
      strengths[i] = +strength(ls[i], i, ls)
    }
  }
  function initializeDistance() {
    if (!nodes) return
    for (let i = 0, n = ls.length; i < n; ++i) {
      distances[i] = +distance(ls[i], i, ls)
    }
  }
  force.initialize = function (_nodes, _random) {
    nodes = _nodes
    random = _random
    initialize()
  }
  force.links = function (_) {
    return arguments.length ? ((ls = _), initialize(), force) : ls
  }
  force.id = function (_) {
    return arguments.length ? ((id = _), force) : id
  }
  force.iterations = function (_) {
    return arguments.length ? ((iterations = +_), force) : iterations
  }
  force.strength = function (_) {
    return arguments.length
      ? ((strength = typeof _ === "function" ? _ : qu.constant(+_)), initializeStrength(), force)
      : strength
  }
  force.distance = function (_) {
    return arguments.length
      ? ((distance = typeof _ === "function" ? _ : qu.constant(+_)), initializeDistance(), force)
      : distance
  }
  return force
}
export function forceManyBody<T extends qt.SimNode>(): qt.ForceManyBody<T> {
  let nodes,
    node,
    random,
    alpha,
    strength = qu.constant(-30),
    strengths,
    distanceMin2 = 1,
    distanceMax2 = Infinity,
    theta2 = 0.81
  function force(_) {
    let i,
      n = nodes.length,
      tree = quadtree(nodes, x, y).visitAfter(accumulate)
    for (alpha = _, i = 0; i < n; ++i) (node = nodes[i]), tree.visit(apply)
  }
  function initialize() {
    if (!nodes) return
    let i,
      n = nodes.length,
      node
    strengths = new Array(n)
    for (i = 0; i < n; ++i) (node = nodes[i]), (strengths[node.index] = +strength(node, i, nodes))
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
      do strength += strengths[q.data.index]
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
        if (x === 0) (x = jiggle(random)), (l += x * x)
        if (y === 0) (y = jiggle(random)), (l += y * y)
        if (l < distanceMin2) l = Math.sqrt(distanceMin2 * l)
        node.vx += (x * quad.value * alpha) / l
        node.vy += (y * quad.value * alpha) / l
      }
      return true
    } else if (quad.length || l >= distanceMax2) return
    if (quad.data !== node || quad.next) {
      if (x === 0) (x = jiggle(random)), (l += x * x)
      if (y === 0) (y = jiggle(random)), (l += y * y)
      if (l < distanceMin2) l = Math.sqrt(distanceMin2 * l)
    }
    do
      if (quad.data !== node) {
        w = (strengths[quad.data.index] * alpha) / l
        node.vx += x * w
        node.vy += y * w
      }
    while ((quad = quad.next))
  }
  force.initialize = function (_nodes, _random) {
    nodes = _nodes
    random = _random
    initialize()
  }
  force.strength = function (_) {
    return arguments.length
      ? ((strength = typeof _ === "function" ? _ : qu.constant(+_)), initialize(), force)
      : strength
  }
  force.distanceMin = function (_) {
    return arguments.length ? ((distanceMin2 = _ * _), force) : Math.sqrt(distanceMin2)
  }
  force.distanceMax = function (_) {
    return arguments.length ? ((distanceMax2 = _ * _), force) : Math.sqrt(distanceMax2)
  }
  force.theta = function (_) {
    return arguments.length ? ((theta2 = _ * _), force) : Math.sqrt(theta2)
  }
  return force
}
export function forceRadial<T extends qt.SimNode>(
  radius: number | ((x: T, i: number, xs: T[]) => number),
  x?: number | ((x: T, i: number, xs: T[]) => number),
  y?: number | ((x: T, i: number, xs: T[]) => number)
): qt.ForceRadial<T> {
  let nodes,
    strength = qu.constant(0.1),
    strengths,
    radiuses
  if (typeof radius !== "function") radius = qu.constant(+radius)
  if (x == null) x = 0
  if (y == null) y = 0
  function force(alpha) {
    for (let i = 0, n = nodes.length; i < n; ++i) {
      let node = nodes[i],
        dx = node.x - x || 1e-6,
        dy = node.y - y || 1e-6,
        r = Math.sqrt(dx * dx + dy * dy),
        k = ((radiuses[i] - r) * strengths[i] * alpha) / r
      node.vx += dx * k
      node.vy += dy * k
    }
  }
  function initialize() {
    if (!nodes) return
    let i,
      n = nodes.length
    strengths = new Array(n)
    radiuses = new Array(n)
    for (i = 0; i < n; ++i) {
      radiuses[i] = +radius(nodes[i], i, nodes)
      strengths[i] = isNaN(radiuses[i]) ? 0 : +strength(nodes[i], i, nodes)
    }
  }
  force.initialize = function (_) {
    ;(nodes = _), initialize()
  }
  force.strength = function (_) {
    return arguments.length
      ? ((strength = typeof _ === "function" ? _ : qu.constant(+_)), initialize(), force)
      : strength
  }
  force.radius = function (_) {
    return arguments.length ? ((radius = typeof _ === "function" ? _ : qu.constant(+_)), initialize(), force) : radius
  }
  force.x = function (_) {
    return arguments.length ? ((x = +_), force) : x
  }
  force.y = function (_) {
    return arguments.length ? ((y = +_), force) : y
  }
  return force
}
export function x(d) {
  return d.x
}
export function y(d) {
  return d.y
}

export function forceX<T extends qt.SimNode>(x?: number | ((x: T, i: number, xs: T[]) => number)): qt.ForceX<T> {
  let strength = qu.constant(0.1),
    nodes,
    strengths,
    xz
  if (typeof x !== "function") x = qu.constant(x == null ? 0 : +x)
  function force(alpha) {
    for (var i = 0, n = nodes.length, node; i < n; ++i) {
      ;(node = nodes[i]), (node.vx += (xz[i] - node.x) * strengths[i] * alpha)
    }
  }
  function initialize() {
    if (!nodes) return
    let i,
      n = nodes.length
    strengths = new Array(n)
    xz = new Array(n)
    for (i = 0; i < n; ++i) {
      strengths[i] = isNaN((xz[i] = +x(nodes[i], i, nodes))) ? 0 : +strength(nodes[i], i, nodes)
    }
  }
  force.initialize = function (_) {
    nodes = _
    initialize()
  }
  force.strength = function (_) {
    return arguments.length
      ? ((strength = typeof _ === "function" ? _ : qu.constant(+_)), initialize(), force)
      : strength
  }
  force.x = function (_) {
    return arguments.length ? ((x = typeof _ === "function" ? _ : qu.constant(+_)), initialize(), force) : x
  }
  return force
}
export function forceY<T extends qt.SimNode>(x?: number | ((x: T, i: number, xs: T[]) => number)): ForceY<T> {
  let strength = qu.constant(0.1),
    nodes,
    strengths,
    yz
  if (typeof x !== "function") x = qu.constant(x == null ? 0 : +x)
  function force(alpha) {
    for (var i = 0, n = nodes.length, node; i < n; ++i) {
      ;(node = nodes[i]), (node.vy += (yz[i] - node.y) * strengths[i] * alpha)
    }
  }
  function initialize() {
    if (!nodes) return
    let i,
      n = nodes.length
    strengths = new Array(n)
    yz = new Array(n)
    for (i = 0; i < n; ++i) {
      strengths[i] = isNaN((yz[i] = +x(nodes[i], i, nodes))) ? 0 : +strength(nodes[i], i, nodes)
    }
  }
  force.initialize = function (_) {
    nodes = _
    initialize()
  }
  force.strength = function (_) {
    return arguments.length
      ? ((strength = typeof _ === "function" ? _ : qu.constant(+_)), initialize(), force)
      : strength
  }
  force.y = function (_) {
    return arguments.length ? ((x = typeof _ === "function" ? _ : qu.constant(+_)), initialize(), force) : x
  }
  return force
}
