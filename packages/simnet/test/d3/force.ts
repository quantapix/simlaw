import assert from "assert"

export function assertNodeEqual(actual, expected, delta = 1e-6) {
  assert(nodeEqual(actual, expected, delta), `${actual} and ${expected} should be similar`)
}

function nodeEqual(actual, expected, delta) {
  return (
    actual.index == expected.index &&
    Math.abs(actual.x - expected.x) < delta &&
    Math.abs(actual.vx - expected.vx) < delta &&
    Math.abs(actual.y - expected.y) < delta &&
    Math.abs(actual.vy - expected.vy) < delta &&
    !(Math.abs(actual.fx - expected.fx) > delta) &&
    !(Math.abs(actual.fy - expected.fy) > delta)
  )
}
import { forceCenter, forceSimulation } from "../src/index.js"
import { assertNodeEqual } from "./asserts.js"

it("forceCenter repositions nodes", () => {
  const center = forceCenter(0, 0)
  const f = forceSimulation().force("center", center).stop()
  const a = { x: 100, y: 0 },
    b = { x: 200, y: 0 },
    c = { x: 300, y: 0 }
  f.nodes([a, b, c])
  f.tick()
  assertNodeEqual(a, { index: 0, x: -100, y: 0, vy: 0, vx: 0 })
  assertNodeEqual(b, { index: 1, x: 0, y: 0, vy: 0, vx: 0 })
  assertNodeEqual(c, { index: 2, x: 100, y: 0, vy: 0, vx: 0 })
})

it("forceCenter respects fixed positions", () => {
  const center = forceCenter()
  const f = forceSimulation().force("center", center).stop()
  const a = { fx: 0, fy: 0 },
    b = {},
    c = {}
  f.nodes([a, b, c])
  f.tick()
  assertNodeEqual(a, { fx: 0, fy: 0, index: 0, x: 0, y: 0, vy: 0, vx: 0 })
})
import assert from "assert"
import { forceCollide, forceSimulation } from "../src/index.js"
import { assertNodeEqual } from "./asserts.js"

it("forceCollide collides nodes", () => {
  const collide = forceCollide(1)
  const f = forceSimulation().force("collide", collide).stop()
  const a = {},
    b = {},
    c = {}
  f.nodes([a, b, c])
  f.tick(10)
  assertNodeEqual(a, { index: 0, x: 7.0710678118654755, y: 0, vy: 0, vx: 0 })
  assertNodeEqual(b, { index: 1, x: -9.03088751750192, y: 8.27303273571596, vy: 0, vx: 0 })
  assertNodeEqual(c, { index: 2, x: 1.3823220809823638, y: -15.750847141167634, vy: 0, vx: 0 })
  collide.radius(100)
  f.tick(10)
  assertNodeEqual(a, {
    index: 0,
    x: 174.08616723117228,
    y: 66.51743051995625,
    vy: 0.26976816231064354,
    vx: 0.677346615710878,
  })
  assertNodeEqual(b, {
    index: 1,
    x: -139.73606544743998,
    y: 95.69860503079263,
    vy: 0.3545632444404687,
    vx: -0.5300880593105067,
  })
  assertNodeEqual(c, {
    index: 2,
    x: -34.9275994083864,
    y: -169.69384995620052,
    vy: -0.6243314067511122,
    vx: -0.1472585564003713,
  })
})

it("forceCollide respects fixed positions", () => {
  const collide = forceCollide(1)
  const f = forceSimulation().force("collide", collide).stop()
  const a = { fx: 0, fy: 0 },
    b = {},
    c = {}
  f.nodes([a, b, c])
  f.tick(10)
  assertNodeEqual(a, { fx: 0, fy: 0, index: 0, x: 0, y: 0, vy: 0, vx: 0 })
  collide.radius(100)
  f.tick(10)
  assertNodeEqual(a, { fx: 0, fy: 0, index: 0, x: 0, y: 0, vy: 0, vx: 0 })
})

it("forceCollide jiggles equal positions", () => {
  const collide = forceCollide(1)
  const f = forceSimulation().force("collide", collide).stop()
  const a = { x: 0, y: 0 },
    b = { x: 0, y: 0 }
  f.nodes([a, b])
  f.tick()
  assert(a.x !== b.x)
  assert(a.y !== b.y)
  assert.strictEqual(a.vx, -b.vx)
  assert.strictEqual(a.vy, -b.vy)
})

it("forceCollide jiggles in a reproducible way", () => {
  const nodes = Array.from({ length: 10 }, () => ({ x: 0, y: 0 }))
  forceSimulation().nodes(nodes).force("collide", forceCollide()).stop().tick(50)
  assertNodeEqual(nodes[0], { x: -5.371433857229194, y: -2.6644608278592576, index: 0, vy: 0, vx: 0 })
})
import assert from "assert"
import { forceSimulation } from "../src/index.js"

it("simulation.find finds a node", () => {
  const f = forceSimulation().stop()
  const a = { x: 5, y: 0 },
    b = { x: 10, y: 16 },
    c = { x: -10, y: -4 }
  f.nodes([a, b, c])
  assert.strictEqual(f.find(0, 0), a)
  assert.strictEqual(f.find(0, 20), b)
})

it("simulation.find(x, y, radius) finds a node within radius", () => {
  const f = forceSimulation().stop()
  const a = { x: 5, y: 0 },
    b = { x: 10, y: 16 },
    c = { x: -10, y: -4 }
  f.nodes([a, b, c])
  assert.strictEqual(f.find(0, 0), a)
  assert.strictEqual(f.find(0, 0, 1), undefined)
  assert.strictEqual(f.find(0, 20), b)
})
import assert from "assert"
import { forceSimulation } from "../src/index.js"
import { assertNodeEqual } from "./asserts.js"

it("forceSimulation() returns a simulation", () => {
  const f = forceSimulation().stop()
  assert.deepStrictEqual(Object.keys(f).sort(), [
    "alpha",
    "alphaDecay",
    "alphaMin",
    "alphaTarget",
    "find",
    "force",
    "nodes",
    "on",
    "randomSource",
    "restart",
    "stop",
    "tick",
    "velocityDecay",
  ])
})

it("simulation.nodes(nodes) initializes a simulation with indices & phyllotaxis positions, 0 speed", () => {
  const f = forceSimulation().stop()
  const a = {},
    b = {},
    c = {}
  f.nodes([a, b, c])
  assertNodeEqual(a, { index: 0, x: 7.0710678118654755, y: 0, vy: 0, vx: 0 })
  assertNodeEqual(b, { index: 1, x: -9.03088751750192, y: 8.27303273571596, vy: 0, vx: 0 })
  assertNodeEqual(c, { index: 2, x: 1.3823220809823638, y: -15.750847141167634, vy: 0, vx: 0 })
})

import assert from "assert"
import { forceSimulation, forceX, forceY } from "../src/index.js"
import { assertNodeEqual } from "./asserts.js"

it("forceX centers nodes", () => {
  const x = forceX(200)
  const f = forceSimulation().force("x", x).stop()
  const a = { x: 100, y: 0 },
    b = { x: 200, y: 0 },
    c = { x: 300, y: 0 }
  f.nodes([a, b, c])
  f.tick(30)
  assert(a.x > 190)
  assert(a.vx > 0)
  assert.strictEqual(b.x, 200)
  assert.strictEqual(b.vx, 0)
  assert(c.x < 210)
  assert(c.vx < 0)
})

it("forceY centers nodes", () => {
  const y = forceY(200)
  const f = forceSimulation().force("y", y).stop()
  const a = { y: 100, x: 0 },
    b = { y: 200, x: 0 },
    c = { y: 300, x: 0 }
  f.nodes([a, b, c])
  f.tick(30)
  assert(a.y > 190)
  assert(a.vy > 0)
  assert.strictEqual(b.y, 200)
  assert.strictEqual(b.vy, 0)
  assert(c.y < 210)
  assert(c.vy < 0)
})

it("forceX respects fixed positions", () => {
  const x = forceX(200)
  const f = forceSimulation().force("x", x).stop()
  const a = { fx: 0, fy: 0 },
    b = {},
    c = {}
  f.nodes([a, b, c])
  f.tick()
  assertNodeEqual(a, { fx: 0, fy: 0, index: 0, x: 0, y: 0, vy: 0, vx: 0 })
})

it("forceY respects fixed positions", () => {
  const y = forceX(200)
  const f = forceSimulation().force("y", y).stop()
  const a = { fx: 0, fy: 0 },
    b = {},
    c = {}
  f.nodes([a, b, c])
  f.tick()
  assertNodeEqual(a, { fx: 0, fy: 0, index: 0, x: 0, y: 0, vy: 0, vx: 0 })
})

it("forceX.x() accessor", () => {
  const x = forceX().x(d => d.x0)
  const f = forceSimulation().force("x", x).stop()
  const a = { x: 100, y: 0, x0: 300 },
    b = { x: 200, y: 0, x0: 200 },
    c = { x: 300, y: 0, x0: 100 }
  f.nodes([a, b, c])
  f.tick(30)
  assert(a.x > 290)
  assert(a.vx > 0)
  assert.strictEqual(b.x, 200)
  assert.strictEqual(b.vx, 0)
  assert(c.x < 110)
  assert(c.vx < 0)
})

it("forceY.y() accessor", () => {
  const y = forceY().y(d => d.y0)
  const f = forceSimulation().force("y", y).stop()
  const a = { y: 100, x: 0, y0: 300 },
    b = { y: 200, x: 0, y0: 200 },
    c = { y: 300, x: 0, y0: 100 }
  f.nodes([a, b, c])
  f.tick(30)
  assert(a.y > 290)
  assert(a.vy > 0)
  assert.strictEqual(b.y, 200)
  assert.strictEqual(b.vy, 0)
  assert(c.y < 110)
  assert(c.vy < 0)
})
