import assert from "assert"
import { quadtree } from "../src/index.js"

it("quadtree.add(datum) creates a new point and adds it to the quadtree", () => {
  const q = quadtree()
  assert.deepStrictEqual(q.add([0.0, 0.0]).root(), { data: [0, 0] })
  assert.deepStrictEqual(q.add([0.9, 0.9]).root(), [{ data: [0, 0] }, , , { data: [0.9, 0.9] }])
  assert.deepStrictEqual(q.add([0.9, 0.0]).root(), [{ data: [0, 0] }, { data: [0.9, 0] }, , { data: [0.9, 0.9] }])
  assert.deepStrictEqual(q.add([0.0, 0.9]).root(), [
    { data: [0, 0] },
    { data: [0.9, 0] },
    { data: [0, 0.9] },
    { data: [0.9, 0.9] },
  ])
  assert.deepStrictEqual(q.add([0.4, 0.4]).root(), [
    [{ data: [0, 0] }, , , { data: [0.4, 0.4] }],
    { data: [0.9, 0] },
    { data: [0, 0.9] },
    { data: [0.9, 0.9] },
  ])
})

it("quadtree.add(datum) handles points being on the perimeter of the quadtree bounds", () => {
  const q = quadtree().extent([
    [0, 0],
    [1, 1],
  ])
  assert.deepStrictEqual(q.add([0, 0]).root(), { data: [0, 0] })
  assert.deepStrictEqual(q.add([1, 1]).root(), [{ data: [0, 0] }, , , { data: [1, 1] }])
  assert.deepStrictEqual(q.add([1, 0]).root(), [{ data: [0, 0] }, { data: [1, 0] }, , { data: [1, 1] }])
  assert.deepStrictEqual(q.add([0, 1]).root(), [{ data: [0, 0] }, { data: [1, 0] }, { data: [0, 1] }, { data: [1, 1] }])
})

it("quadtree.add(datum) handles points being to the top of the quadtree bounds", () => {
  const q = quadtree().extent([
    [0, 0],
    [2, 2],
  ])
  assert.deepStrictEqual(q.add([1, -1]).extent(), [
    [0, -4],
    [8, 4],
  ])
})

it("quadtree.add(datum) handles points being to the right of the quadtree bounds", () => {
  const q = quadtree().extent([
    [0, 0],
    [2, 2],
  ])
  assert.deepStrictEqual(q.add([3, 1]).extent(), [
    [0, 0],
    [4, 4],
  ])
})

it("quadtree.add(datum) handles points being to the bottom of the quadtree bounds", () => {
  const q = quadtree().extent([
    [0, 0],
    [2, 2],
  ])
  assert.deepStrictEqual(q.add([1, 3]).extent(), [
    [0, 0],
    [4, 4],
  ])
})

it("quadtree.add(datum) handles points being to the left of the quadtree bounds", () => {
  const q = quadtree().extent([
    [0, 0],
    [2, 2],
  ])
  assert.deepStrictEqual(q.add([-1, 1]).extent(), [
    [-4, 0],
    [4, 8],
  ])
})

it("quadtree.add(datum) handles coincident points by creating a linked list", () => {
  const q = quadtree().extent([
    [0, 0],
    [1, 1],
  ])
  assert.deepStrictEqual(q.add([0, 0]).root(), { data: [0, 0] })
  assert.deepStrictEqual(q.add([1, 0]).root(), [{ data: [0, 0] }, { data: [1, 0] }, , ,])
  assert.deepStrictEqual(q.add([0, 1]).root(), [{ data: [0, 0] }, { data: [1, 0] }, { data: [0, 1] }, ,])
  assert.deepStrictEqual(q.add([0, 1]).root(), [
    { data: [0, 0] },
    { data: [1, 0] },
    { data: [0, 1], next: { data: [0, 1] } },
    ,
  ])
})

it("quadtree.add(datum) implicitly defines trivial bounds for the first point", () => {
  const q = quadtree().add([1, 2])
  assert.deepStrictEqual(q.extent(), [
    [1, 2],
    [2, 3],
  ])
  assert.deepStrictEqual(q.root(), { data: [1, 2] })
})
import assert from "assert"
import { quadtree } from "../src/index.js"

it("quadtree.addAll(data) creates new points and adds them to the quadtree", () => {
  const q = quadtree()
  assert.deepStrictEqual(q.add([0.0, 0.0]).root(), { data: [0, 0] })
  assert.deepStrictEqual(q.add([0.9, 0.9]).root(), [{ data: [0, 0] }, , , { data: [0.9, 0.9] }])
  assert.deepStrictEqual(q.add([0.9, 0.0]).root(), [{ data: [0, 0] }, { data: [0.9, 0] }, , { data: [0.9, 0.9] }])
  assert.deepStrictEqual(q.add([0.0, 0.9]).root(), [
    { data: [0, 0] },
    { data: [0.9, 0] },
    { data: [0, 0.9] },
    { data: [0.9, 0.9] },
  ])
  assert.deepStrictEqual(q.add([0.4, 0.4]).root(), [
    [{ data: [0, 0] }, , , { data: [0.4, 0.4] }],
    { data: [0.9, 0] },
    { data: [0, 0.9] },
    { data: [0.9, 0.9] },
  ])
})

it("quadtree.addAll(data) ignores points with NaN coordinates", () => {
  const q = quadtree()
  assert.deepStrictEqual(
    q
      .addAll([
        [NaN, 0],
        [0, NaN],
      ])
      .root(),
    undefined
  )
  assert.strictEqual(q.extent(), undefined)
  assert.deepStrictEqual(
    q
      .addAll([
        [0, 0],
        [0.9, 0.9],
      ])
      .root(),
    [{ data: [0, 0] }, , , { data: [0.9, 0.9] }]
  )
  assert.deepStrictEqual(
    q
      .addAll([
        [NaN, 0],
        [0, NaN],
      ])
      .root(),
    [{ data: [0, 0] }, , , { data: [0.9, 0.9] }]
  )
  assert.deepStrictEqual(q.extent(), [
    [0, 0],
    [1, 1],
  ])
})

it("quadtree.addAll(data) correctly handles the empty array", () => {
  const q = quadtree()
  assert.deepStrictEqual(q.addAll([]).root(), undefined)
  assert.strictEqual(q.extent(), undefined)
  assert.deepStrictEqual(
    q
      .addAll([
        [0, 0],
        [1, 1],
      ])
      .root(),
    [{ data: [0, 0] }, , , { data: [1, 1] }]
  )
  assert.deepStrictEqual(q.addAll([]).root(), [{ data: [0, 0] }, , , { data: [1, 1] }])
  assert.deepStrictEqual(q.extent(), [
    [0, 0],
    [2, 2],
  ])
})

it("quadtree.addAll(data) computes the extent of the data before adding", () => {
  const q = quadtree().addAll([
    [0.4, 0.4],
    [0, 0],
    [0.9, 0.9],
  ])
  assert.deepStrictEqual(q.root(), [[{ data: [0, 0] }, , , { data: [0.4, 0.4] }], , , { data: [0.9, 0.9] }])
})

it("quadtree.addAll(iterable) adds points from an iterable", () => {
  const q = quadtree().addAll(
    new Set([
      [0.4, 0.4],
      [0, 0],
      [0.9, 0.9],
    ])
  )
  assert.deepStrictEqual(q.root(), [[{ data: [0, 0] }, , , { data: [0.4, 0.4] }], , , { data: [0.9, 0.9] }])
})

it("quadtree(iterable) adds points from an iterable", () => {
  const q = quadtree(
    new Set([
      [0.4, 0.4],
      [0, 0],
      [0.9, 0.9],
    ])
  )
  assert.deepStrictEqual(q.root(), [[{ data: [0, 0] }, , , { data: [0.4, 0.4] }], , , { data: [0.9, 0.9] }])
})
import { quadtree } from "../src/index.js"

const n = 1000000
const points1 = new Array(n)
const points2 = new Array(n)

for (let j = 0; j < n; ++j) {
  points1[j] = [Math.random() * 99, Math.random() * 99]
}

for (let j = 0; j < n; ++j) {
  points2[j] = [points1[j][0] + Math.random(), points1[j][1] + Math.random()]
}

function time(message, run) {
  const [starts, startns] = process.hrtime()
  run()
  const [ends, endns] = process.hrtime()
  console.log(message, Math.round((ends - starts) * 1e3 + (endns - startns) / 1e6))
}

let root

time("create", () => {
  root = quadtree()
    .extent([
      [0, 0],
      [100, 100],
    ])
    .addAll(points1)
})

time("iterate", () => {
  root.visit(() => {})
})

time("update", () => {
  for (let j = 0; j < n; ++j) {
    root.remove(points1[j])
    root.add(points2[j])
  }
})
import assert from "assert"
import { quadtree } from "../src/index.js"

it("quadtree.copy() returns a copy of this quadtree", () => {
  const q0 = quadtree().addAll([
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1],
  ])
  assert.deepStrictEqual(q0.copy(), q0)
})

it("quadtree.copy() isolates changes to the extent", () => {
  const q0 = quadtree().extent([
    [0, 0],
    [1, 1],
  ])
  const q1 = q0.copy()
  q0.add([2, 2])
  assert.deepStrictEqual(q1.extent(), [
    [0, 0],
    [2, 2],
  ])
  q1.add([-1, -1])
  assert.deepStrictEqual(q0.extent(), [
    [0, 0],
    [4, 4],
  ])
})

it("quadtree.copy() isolates changes to the root when a leaf", () => {
  const q0 = quadtree().extent([
    [0, 0],
    [1, 1],
  ])
  const q1 = q0.copy()
  const p0 = [2, 2]
  q0.add(p0)
  assert.strictEqual(q1.root(), undefined)
  const q2 = q0.copy()
  assert.deepStrictEqual(q0.root(), { data: [2, 2] })
  assert.deepStrictEqual(q2.root(), { data: [2, 2] })
  assert.strictEqual(q0.remove(p0), q0)
  assert.strictEqual(q0.root(), undefined)
  assert.deepStrictEqual(q2.root(), { data: [2, 2] })
})

it("quadtree.copy() isolates changes to the root when not a leaf", () => {
  const p0 = [1, 1]
  const p1 = [2, 2]
  const p2 = [3, 3]
  const q0 = quadtree()
    .extent([
      [0, 0],
      [4, 4],
    ])
    .addAll([p0, p1])
  const q1 = q0.copy()
  q0.add(p2)
  assert.deepStrictEqual(q0.extent(), [
    [0, 0],
    [8, 8],
  ])
  assert.deepStrictEqual(q0.root(), [[{ data: [1, 1] }, , , [{ data: [2, 2] }, , , { data: [3, 3] }]], , , ,])
  assert.deepStrictEqual(q1.extent(), [
    [0, 0],
    [8, 8],
  ])
  assert.deepStrictEqual(q1.root(), [[{ data: [1, 1] }, , , { data: [2, 2] }], , , ,])
  const q3 = q0.copy()
  q0.remove(p2)
  assert.deepStrictEqual(q3.extent(), [
    [0, 0],
    [8, 8],
  ])
  assert.deepStrictEqual(q3.root(), [[{ data: [1, 1] }, , , [{ data: [2, 2] }, , , { data: [3, 3] }]], , , ,])
})
import assert from "assert"
import { quadtree } from "../src/index.js"

it("quadtree.cover(x, y) sets a trivial extent if the extent was undefined", () => {
  assert.deepStrictEqual(quadtree().cover(1, 2).extent(), [
    [1, 2],
    [2, 3],
  ])
})

it("quadtree.cover(x, y) sets a non-trivial squarified and centered extent if the extent was trivial", () => {
  assert.deepStrictEqual(quadtree().cover(0, 0).cover(1, 2).extent(), [
    [0, 0],
    [4, 4],
  ])
})

it("quadtree.cover(x, y) ignores invalid points", () => {
  assert.deepStrictEqual(quadtree().cover(0, 0).cover(NaN, 2).extent(), [
    [0, 0],
    [1, 1],
  ])
})

it("quadtree.cover(x, y) repeatedly doubles the existing extent if the extent was non-trivial", () => {
  assert.deepStrictEqual(quadtree().cover(0, 0).cover(2, 2).cover(-1, -1).extent(), [
    [-4, -4],
    [4, 4],
  ])
  assert.deepStrictEqual(quadtree().cover(0, 0).cover(2, 2).cover(1, -1).extent(), [
    [0, -4],
    [8, 4],
  ])
  assert.deepStrictEqual(quadtree().cover(0, 0).cover(2, 2).cover(3, -1).extent(), [
    [0, -4],
    [8, 4],
  ])
  assert.deepStrictEqual(quadtree().cover(0, 0).cover(2, 2).cover(3, 1).extent(), [
    [0, 0],
    [4, 4],
  ])
  assert.deepStrictEqual(quadtree().cover(0, 0).cover(2, 2).cover(3, 3).extent(), [
    [0, 0],
    [4, 4],
  ])
  assert.deepStrictEqual(quadtree().cover(0, 0).cover(2, 2).cover(1, 3).extent(), [
    [0, 0],
    [4, 4],
  ])
  assert.deepStrictEqual(quadtree().cover(0, 0).cover(2, 2).cover(-1, 3).extent(), [
    [-4, 0],
    [4, 8],
  ])
  assert.deepStrictEqual(quadtree().cover(0, 0).cover(2, 2).cover(-1, 1).extent(), [
    [-4, 0],
    [4, 8],
  ])
  assert.deepStrictEqual(quadtree().cover(0, 0).cover(2, 2).cover(-3, -3).extent(), [
    [-4, -4],
    [4, 4],
  ])
  assert.deepStrictEqual(quadtree().cover(0, 0).cover(2, 2).cover(3, -3).extent(), [
    [0, -4],
    [8, 4],
  ])
  assert.deepStrictEqual(quadtree().cover(0, 0).cover(2, 2).cover(5, -3).extent(), [
    [0, -4],
    [8, 4],
  ])
  assert.deepStrictEqual(quadtree().cover(0, 0).cover(2, 2).cover(5, 3).extent(), [
    [0, 0],
    [8, 8],
  ])
  assert.deepStrictEqual(quadtree().cover(0, 0).cover(2, 2).cover(5, 5).extent(), [
    [0, 0],
    [8, 8],
  ])
  assert.deepStrictEqual(quadtree().cover(0, 0).cover(2, 2).cover(3, 5).extent(), [
    [0, 0],
    [8, 8],
  ])
  assert.deepStrictEqual(quadtree().cover(0, 0).cover(2, 2).cover(-3, 5).extent(), [
    [-4, 0],
    [4, 8],
  ])
  assert.deepStrictEqual(quadtree().cover(0, 0).cover(2, 2).cover(-3, 3).extent(), [
    [-4, 0],
    [4, 8],
  ])
})

it("quadtree.cover(x, y) repeatedly wraps the root node if it has children", () => {
  const q = quadtree().add([0, 0]).add([2, 2])
  assert.deepStrictEqual(q.root(), [{ data: [0, 0] }, , , { data: [2, 2] }])
  assert.deepStrictEqual(q.copy().cover(3, 3).root(), [{ data: [0, 0] }, , , { data: [2, 2] }])
  assert.deepStrictEqual(q.copy().cover(-1, 3).root(), [, [{ data: [0, 0] }, , , { data: [2, 2] }], , ,])
  assert.deepStrictEqual(q.copy().cover(3, -1).root(), [, , [{ data: [0, 0] }, , , { data: [2, 2] }], ,])
  assert.deepStrictEqual(q.copy().cover(-1, -1).root(), [, , , [{ data: [0, 0] }, , , { data: [2, 2] }]])
  assert.deepStrictEqual(q.copy().cover(5, 5).root(), [[{ data: [0, 0] }, , , { data: [2, 2] }], , , ,])
  assert.deepStrictEqual(q.copy().cover(-3, 5).root(), [, [{ data: [0, 0] }, , , { data: [2, 2] }], , ,])
  assert.deepStrictEqual(q.copy().cover(5, -3).root(), [, , [{ data: [0, 0] }, , , { data: [2, 2] }], ,])
  assert.deepStrictEqual(q.copy().cover(-3, -3).root(), [, , , [{ data: [0, 0] }, , , { data: [2, 2] }]])
})

it("quadtree.cover(x, y) does not wrap the root node if it is a leaf", () => {
  const q = quadtree().cover(0, 0).add([2, 2])
  assert.deepStrictEqual(q.root(), { data: [2, 2] })
  assert.deepStrictEqual(q.copy().cover(3, 3).root(), { data: [2, 2] })
  assert.deepStrictEqual(q.copy().cover(-1, 3).root(), { data: [2, 2] })
  assert.deepStrictEqual(q.copy().cover(3, -1).root(), { data: [2, 2] })
  assert.deepStrictEqual(q.copy().cover(-1, -1).root(), { data: [2, 2] })
  assert.deepStrictEqual(q.copy().cover(5, 5).root(), { data: [2, 2] })
  assert.deepStrictEqual(q.copy().cover(-3, 5).root(), { data: [2, 2] })
  assert.deepStrictEqual(q.copy().cover(5, -3).root(), { data: [2, 2] })
  assert.deepStrictEqual(q.copy().cover(-3, -3).root(), { data: [2, 2] })
})

it("quadtree.cover(x, y) does not wrap the root node if it is undefined", () => {
  const q = quadtree().cover(0, 0).cover(2, 2)
  assert.strictEqual(q.root(), undefined)
  assert.strictEqual(q.copy().cover(3, 3).root(), undefined)
  assert.strictEqual(q.copy().cover(-1, 3).root(), undefined)
  assert.strictEqual(q.copy().cover(3, -1).root(), undefined)
  assert.strictEqual(q.copy().cover(-1, -1).root(), undefined)
  assert.strictEqual(q.copy().cover(5, 5).root(), undefined)
  assert.strictEqual(q.copy().cover(-3, 5).root(), undefined)
  assert.strictEqual(q.copy().cover(5, -3).root(), undefined)
  assert.strictEqual(q.copy().cover(-3, -3).root(), undefined)
})

it("quadtree.cover() does not crash on huge values", () => {
  quadtree([[1e23, 0]])
})
import assert from "assert"
import { quadtree } from "../src/index.js"

it("quadtree.data() returns an array of data in the quadtree", () => {
  const q = quadtree()
  assert.deepStrictEqual(q.data(), [])
  q.add([0, 0]).add([1, 2])
  assert.deepStrictEqual(q.data(), [
    [0, 0],
    [1, 2],
  ])
})

it("quadtree.data() correctly handles coincident nodes", () => {
  const q = quadtree()
  q.add([0, 0]).add([0, 0])
  assert.deepStrictEqual(q.data(), [
    [0, 0],
    [0, 0],
  ])
})
import assert from "assert"
import { quadtree } from "../src/index.js"

it("quadtree.extent(extent) extends the extent", () => {
  assert.deepStrictEqual(
    quadtree()
      .extent([
        [0, 1],
        [2, 6],
      ])
      .extent(),
    [
      [0, 1],
      [8, 9],
    ]
  )
})

it("quadtree.extent() can be inferred by quadtree.cover", () => {
  const q = quadtree()
  assert.deepStrictEqual(q.cover(0, 0).extent(), [
    [0, 0],
    [1, 1],
  ])
  assert.deepStrictEqual(q.cover(2, 4).extent(), [
    [0, 0],
    [8, 8],
  ])
})

it("quadtree.extent() can be inferred by quadtree.add", () => {
  const q = quadtree()
  q.add([0, 0])
  assert.deepStrictEqual(q.extent(), [
    [0, 0],
    [1, 1],
  ])
  q.add([2, 4])
  assert.deepStrictEqual(q.extent(), [
    [0, 0],
    [8, 8],
  ])
})

it("quadtree.extent(extent) squarifies and centers the specified extent", () => {
  assert.deepStrictEqual(
    quadtree()
      .extent([
        [0, 1],
        [2, 6],
      ])
      .extent(),
    [
      [0, 1],
      [8, 9],
    ]
  )
})

it("quadtree.extent(extent) ignores invalid extents", () => {
  assert.strictEqual(
    quadtree()
      .extent([
        [1, NaN],
        [NaN, 0],
      ])
      .extent(),
    undefined
  )
  assert.strictEqual(
    quadtree()
      .extent([
        [NaN, 1],
        [0, NaN],
      ])
      .extent(),
    undefined
  )
  assert.strictEqual(
    quadtree()
      .extent([
        [NaN, NaN],
        [NaN, NaN],
      ])
      .extent(),
    undefined
  )
})

it("quadtree.extent(extent) flips inverted extents", () => {
  assert.deepStrictEqual(
    quadtree()
      .extent([
        [1, 1],
        [0, 0],
      ])
      .extent(),
    [
      [0, 0],
      [2, 2],
    ]
  )
})

it("quadtree.extent(extent) tolerates partially-valid extents", () => {
  assert.deepStrictEqual(
    quadtree()
      .extent([
        [NaN, 0],
        [1, 1],
      ])
      .extent(),
    [
      [1, 1],
      [2, 2],
    ]
  )
  assert.deepStrictEqual(
    quadtree()
      .extent([
        [0, NaN],
        [1, 1],
      ])
      .extent(),
    [
      [1, 1],
      [2, 2],
    ]
  )
  assert.deepStrictEqual(
    quadtree()
      .extent([
        [0, 0],
        [NaN, 1],
      ])
      .extent(),
    [
      [0, 0],
      [1, 1],
    ]
  )
  assert.deepStrictEqual(
    quadtree()
      .extent([
        [0, 0],
        [1, NaN],
      ])
      .extent(),
    [
      [0, 0],
      [1, 1],
    ]
  )
})

it("quadtree.extent(extent) allows trivial extents", () => {
  assert.deepStrictEqual(
    quadtree()
      .extent([
        [0, 0],
        [0, 0],
      ])
      .extent(),
    [
      [0, 0],
      [1, 1],
    ]
  )
  assert.deepStrictEqual(
    quadtree()
      .extent([
        [1, 1],
        [1, 1],
      ])
      .extent(),
    [
      [1, 1],
      [2, 2],
    ]
  )
})
import assert from "assert"
import { quadtree } from "../src/index.js"

it("quadtree.find(x, y) returns the closest point to the given [x, y]", () => {
  const dx = 17
  const dy = 17
  const q = quadtree()
  for (let i = 0, n = dx * dy; i < n; ++i) {
    q.add([i % dx, (i / dx) | 0])
  }
  assert.deepStrictEqual(q.find(0.1, 0.1), [0, 0])
  assert.deepStrictEqual(q.find(7.1, 7.1), [7, 7])
  assert.deepStrictEqual(q.find(0.1, 15.9), [0, 16])
  assert.deepStrictEqual(q.find(15.9, 15.9), [16, 16])
})

it("quadtree.find(x, y, radius) returns the closest point within the search radius to the given [x, y]", () => {
  const q = quadtree([
    [0, 0],
    [100, 0],
    [0, 100],
    [100, 100],
  ])
  assert.deepStrictEqual(q.find(20, 20, Infinity), [0, 0])
  assert.deepStrictEqual(q.find(20, 20, 20 * Math.SQRT2 + 1e-6), [0, 0])
  assert.strictEqual(q.find(20, 20, 20 * Math.SQRT2 - 1e-6), undefined)
  assert.deepStrictEqual(q.find(0, 20, 20 + 1e-6), [0, 0])
  assert.strictEqual(q.find(0, 20, 20 - 1e-6), undefined)
  assert.deepStrictEqual(q.find(20, 0, 20 + 1e-6), [0, 0])
  assert.strictEqual(q.find(20, 0, 20 - 1e-6), undefined)
})

it("quadtree.find(x, y, null) treats the given radius as Infinity", () => {
  const q = quadtree([
    [0, 0],
    [100, 0],
    [0, 100],
    [100, 100],
  ])
  assert.deepStrictEqual(q.find(20, 20, null), [0, 0])
  assert.deepStrictEqual(q.find(20, 20, undefined), [0, 0])
})
import assert from "assert"
import { quadtree } from "../src/index.js"

it("quadtree() creates an empty quadtree", () => {
  const q = quadtree()
  assert(q instanceof quadtree)
  assert.strictEqual(
    q.visit(function () {
      throw new Error()
    }),
    q
  )
  assert.strictEqual(q.size(), 0)
  assert.strictEqual(q.extent(), undefined)
  assert.strictEqual(q.root(), undefined)
  assert.deepStrictEqual(q.data(), [])
})

it("quadtree(nodes) is equivalent to quadtree().addAll(nodes)", () => {
  const q = quadtree([
    [0, 0],
    [1, 1],
  ])
  assert(q instanceof quadtree)
  assert.deepStrictEqual(q.root(), [{ data: [0, 0] }, , , { data: [1, 1] }])
})

it("quadtree(nodes, x, y) is equivalent to quadtree().x(x).y(y).addAll(nodes)", () => {
  const q = quadtree(
    [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
    ],
    function (d) {
      return d.x
    },
    function (d) {
      return d.y
    }
  )
  assert(q instanceof quadtree)
  assert.deepStrictEqual(q.root(), [{ data: { x: 0, y: 0 } }, , , { data: { x: 1, y: 1 } }])
})
import assert from "assert"
import { quadtree } from "../src/index.js"

it("quadtree.remove(datum) removes a point and returns the quadtree", () => {
  const p0 = [1, 1]
  const q = quadtree().add(p0)
  assert.deepStrictEqual(q.root(), { data: p0 })
  assert.strictEqual(q.remove(p0), q)
  assert.deepStrictEqual(q.root(), undefined)
})

it("quadtree.remove(datum) removes the only point in the quadtree", () => {
  const p0 = [1, 1]
  const q = quadtree().add(p0)
  assert.strictEqual(q.remove(p0), q)
  assert.deepStrictEqual(q.extent(), [
    [1, 1],
    [2, 2],
  ])
  assert.deepStrictEqual(q.root(), undefined)
  assert.deepStrictEqual(p0, [1, 1])
})

it("quadtree.remove(datum) removes a first coincident point at the root in the quadtree", () => {
  const p0 = [1, 1]
  const p1 = [1, 1]
  const q = quadtree().addAll([p0, p1])
  assert.strictEqual(q.remove(p0), q)
  assert.deepStrictEqual(q.extent(), [
    [1, 1],
    [2, 2],
  ])
  assert.strictEqual(q.root().data, p1)
  assert.deepStrictEqual(p0, [1, 1])
  assert.deepStrictEqual(p1, [1, 1])
})

it("quadtree.remove(datum) removes another coincident point at the root in the quadtree", () => {
  const p0 = [1, 1]
  const p1 = [1, 1]
  const q = quadtree().addAll([p0, p1])
  assert.strictEqual(q.remove(p1), q)
  assert.deepStrictEqual(q.extent(), [
    [1, 1],
    [2, 2],
  ])
  assert.strictEqual(q.root().data, p0)
  assert.deepStrictEqual(p0, [1, 1])
  assert.deepStrictEqual(p1, [1, 1])
})

it("quadtree.remove(datum) removes a non-root point in the quadtree", () => {
  const p0 = [0, 0]
  const p1 = [1, 1]
  const q = quadtree().addAll([p0, p1])
  assert.strictEqual(q.remove(p0), q)
  assert.deepStrictEqual(q.extent(), [
    [0, 0],
    [2, 2],
  ])
  assert.strictEqual(q.root().data, p1)
  assert.deepStrictEqual(p0, [0, 0])
  assert.deepStrictEqual(p1, [1, 1])
})

it("quadtree.remove(datum) removes another non-root point in the quadtree", () => {
  const p0 = [0, 0]
  const p1 = [1, 1]
  const q = quadtree().addAll([p0, p1])
  assert.strictEqual(q.remove(p1), q)
  assert.deepStrictEqual(q.extent(), [
    [0, 0],
    [2, 2],
  ])
  assert.strictEqual(q.root().data, p0)
  assert.deepStrictEqual(p0, [0, 0])
  assert.deepStrictEqual(p1, [1, 1])
})

it("quadtree.remove(datum) ignores a point not in the quadtree", () => {
  const p0 = [0, 0]
  const p1 = [1, 1]
  const q0 = quadtree().add(p0)
  const q1 = quadtree().add(p1)
  assert.strictEqual(q0.remove(p1), q0)
  assert.deepStrictEqual(q0.extent(), [
    [0, 0],
    [1, 1],
  ])
  assert.strictEqual(q0.root().data, p0)
  assert.strictEqual(q1.root().data, p1)
})

it("quadtree.remove(datum) ignores a coincident point not in the quadtree", () => {
  const p0 = [0, 0]
  const p1 = [0, 0]
  const q0 = quadtree().add(p0)
  const q1 = quadtree().add(p1)
  assert.strictEqual(q0.remove(p1), q0)
  assert.deepStrictEqual(q0.extent(), [
    [0, 0],
    [1, 1],
  ])
  assert.strictEqual(q0.root().data, p0)
  assert.strictEqual(q1.root().data, p1)
})

it("quadtree.remove(datum) removes another point in the quadtree", () => {
  const q = quadtree().extent([
    [0, 0],
    [959, 959],
  ])
  q.addAll([
    [630, 438],
    [715, 464],
    [523, 519],
    [646, 318],
    [434, 620],
    [570, 489],
    [520, 345],
    [459, 443],
    [346, 405],
    [529, 444],
  ])
  assert.strictEqual(q.remove(q.find(546, 440)), q)
  assert.deepStrictEqual(q.extent(), [
    [0, 0],
    [1024, 1024],
  ])
  assert.deepStrictEqual(q.root(), [
    [, , , [, , { data: [346, 405] }, { data: [459, 443] }]],
    [
      ,
      ,
      [
        { data: [520, 345] },
        { data: [646, 318] },
        [, { data: [630, 438] }, { data: [570, 489] }, ,],
        { data: [715, 464] },
      ],
      ,
    ],
    { data: [434, 620] },
    { data: [523, 519] },
  ])
})
import assert from "assert"
import { quadtree } from "../src/index.js"

it("quadtree.size() returns the number of points in the quadtree", () => {
  const q = quadtree()
  assert.strictEqual(q.size(), 0)
  q.add([0, 0]).add([1, 2])
  assert.strictEqual(q.size(), 2)
})

it("quadtree.size() correctly counts coincident nodes", () => {
  const q = quadtree()
  q.add([0, 0]).add([0, 0])
  assert.strictEqual(q.size(), 2)
})
import assert from "assert"
import { quadtree } from "../src/index.js"

it("quadtree.visit(callback) visits each node in a quadtree", () => {
  const results = []
  const q = quadtree().addAll([
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1],
  ])
  assert.strictEqual(
    q.visit(function (node, x0, y0, x1, y1) {
      results.push([x0, y0, x1, y1])
    }),
    q
  )
  assert.deepStrictEqual(results, [
    [0, 0, 2, 2],
    [0, 0, 1, 1],
    [1, 0, 2, 1],
    [0, 1, 1, 2],
    [1, 1, 2, 2],
  ])
})

it("quadtree.visit(callback) applies pre-order traversal", () => {
  const results = []
  const q = quadtree()
    .extent([
      [0, 0],
      [960, 960],
    ])
    .addAll([
      [100, 100],
      [200, 200],
      [300, 300],
    ])
  assert.strictEqual(
    q.visit(function (node, x0, y0, x1, y1) {
      results.push([x0, y0, x1, y1])
    }),
    q
  )
  assert.deepStrictEqual(results, [
    [0, 0, 1024, 1024],
    [0, 0, 512, 512],
    [0, 0, 256, 256],
    [0, 0, 128, 128],
    [128, 128, 256, 256],
    [256, 256, 512, 512],
  ])
})

it("quadtree.visit(callback) does not recurse if the callback returns truthy", () => {
  const results = []
  const q = quadtree()
    .extent([
      [0, 0],
      [960, 960],
    ])
    .addAll([
      [100, 100],
      [700, 700],
      [800, 800],
    ])
  assert.strictEqual(
    q.visit(function (node, x0, y0, x1, y1) {
      results.push([x0, y0, x1, y1])
      return x0 > 0
    }),
    q
  )
  assert.deepStrictEqual(results, [
    [0, 0, 1024, 1024],
    [0, 0, 512, 512],
    [512, 512, 1024, 1024],
  ])
})

it("quadtree.visit(callback) on an empty quadtree with no bounds does nothing", () => {
  const results = []
  const q = quadtree()
  assert.strictEqual(
    q.visit(function (node, x0, y0, x1, y1) {
      results.push([x0, y0, x1, y1])
    }),
    q
  )
  assert.strictEqual(results.length, 0)
})

it("quadtree.visit(callback) on an empty quadtree with bounds does nothing", () => {
  const results = []
  const q = quadtree().extent([
    [0, 0],
    [960, 960],
  ])
  assert.strictEqual(
    q.visit(function (node, x0, y0, x1, y1) {
      results.push([x0, y0, x1, y1])
    }),
    q
  )
  assert.deepStrictEqual(results.length, 0)
})
import assert from "assert"
import { quadtree } from "../src/index.js"

it("quadtree.x(x) sets the x-accessor used by quadtree.add", () => {
  const q = quadtree().x(x).add({ x: 1, 1: 2 })
  assert.deepStrictEqual(q.extent(), [
    [1, 2],
    [2, 3],
  ])
  assert.deepStrictEqual(q.root(), { data: { x: 1, 1: 2 } })
})

it("quadtree.x(x) sets the x-accessor used by quadtree.addAll", () => {
  const q = quadtree()
    .x(x)
    .addAll([{ x: 1, 1: 2 }])
  assert.deepStrictEqual(q.extent(), [
    [1, 2],
    [2, 3],
  ])
  assert.deepStrictEqual(q.root(), { data: { x: 1, 1: 2 } })
})

it("quadtree.x(x) sets the x-accessor used by quadtree.remove", () => {
  const p0 = { x: 0, 1: 1 }
  const p1 = { x: 1, 1: 2 }
  const q = quadtree().x(x)
  assert.deepStrictEqual(q.add(p0).root(), { data: { x: 0, 1: 1 } })
  assert.deepStrictEqual(q.add(p1).root(), [{ data: { x: 0, 1: 1 } }, , , { data: { x: 1, 1: 2 } }])
  assert.deepStrictEqual(q.remove(p1).root(), { data: { x: 0, 1: 1 } })
  assert.strictEqual(q.remove(p0).root(), undefined)
})

function x(d) {
  return d.x
}
import assert from "assert"
import { quadtree } from "../src/index.js"

it("quadtree.y(y) sets the y-accessor used by quadtree.add", () => {
  const q = quadtree().y(y).add({ 0: 1, y: 2 })
  assert.deepStrictEqual(q.extent(), [
    [1, 2],
    [2, 3],
  ])
  assert.deepStrictEqual(q.root(), { data: { 0: 1, y: 2 } })
})

it("quadtree.y(y) sets the y-accessor used by quadtree.addAll", () => {
  const q = quadtree()
    .y(y)
    .addAll([{ 0: 1, y: 2 }])
  assert.deepStrictEqual(q.extent(), [
    [1, 2],
    [2, 3],
  ])
  assert.deepStrictEqual(q.root(), { data: { 0: 1, y: 2 } })
})

it("quadtree.y(y) sets the y-accessor used by quadtree.remove", () => {
  const p0 = { 0: 0, y: 1 }
  const p1 = { 0: 1, y: 2 }
  const q = quadtree().y(y)
  assert.deepStrictEqual(q.add(p0).root(), { data: { 0: 0, y: 1 } })
  assert.deepStrictEqual(q.add(p1).root(), [{ data: { 0: 0, y: 1 } }, , , { data: { 0: 1, y: 2 } }])
  assert.deepStrictEqual(q.remove(p1).root(), { data: { 0: 0, y: 1 } })
  assert.strictEqual(q.remove(p0).root(), undefined)
})

function y(d) {
  return d.y
}
