import assert from "assert"
import { polygonArea } from "../src/index.js"

it("polygonArea(polygon) returns the expected value for closed counterclockwise polygons", () => {
  assert.strictEqual(
    polygonArea([
      [0, 0],
      [0, 1],
      [1, 1],
      [1, 0],
      [0, 0],
    ]),
    1
  )
})

it("polygonArea(polygon) returns the expected value for closed clockwise polygons", () => {
  assert.strictEqual(
    polygonArea([
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
      [0, 0],
    ]),
    -1
  )
  assert.strictEqual(
    polygonArea([
      [1, 1],
      [3, 2],
      [2, 3],
      [1, 1],
    ]),
    -1.5
  )
})

it("polygonArea(polygon) returns the expected value for open counterclockwise polygons", () => {
  assert.strictEqual(
    polygonArea([
      [0, 0],
      [0, 1],
      [1, 1],
      [1, 0],
    ]),
    1
  )
})

it("polygonArea(polygon) returns the expected value for open clockwise polygons", () => {
  assert.strictEqual(
    polygonArea([
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ]),
    -1
  )
  assert.strictEqual(
    polygonArea([
      [1, 1],
      [3, 2],
      [2, 3],
    ]),
    -1.5
  )
})

it("polygonArea(polygon) returns the expected value for a very large polygon", () => {
  const stop = 1e8
  const step = 1e4
  const points = []
  for (let value = 0; value < stop; value += step) points.push([0, value])
  for (let value = 0; value < stop; value += step) points.push([value, stop])
  for (let value = stop - step; value >= 0; value -= step) points.push([stop, value])
  for (let value = stop - step; value >= 0; value -= step) points.push([value, 0])
  assert.strictEqual(polygonArea(points), 1e16 - 5e7)
})
import assert from "assert"
import { polygonCentroid } from "../src/index.js"

it("polygonCentroid(points) returns the expected value for closed counterclockwise polygons", () => {
  assert.deepStrictEqual(
    polygonCentroid([
      [0, 0],
      [0, 1],
      [1, 1],
      [1, 0],
      [0, 0],
    ]),
    [0.5, 0.5]
  )
})

it("polygonCentroid(points) returns the expected value for closed clockwise polygons", () => {
  assert.deepStrictEqual(
    polygonCentroid([
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
      [0, 0],
    ]),
    [0.5, 0.5]
  )
  assert.deepStrictEqual(
    polygonCentroid([
      [1, 1],
      [3, 2],
      [2, 3],
      [1, 1],
    ]),
    [2, 2]
  )
})

it("polygonCentroid(points) returns the expected value for open counterclockwise polygons", () => {
  assert.deepStrictEqual(
    polygonCentroid([
      [0, 0],
      [0, 1],
      [1, 1],
      [1, 0],
    ]),
    [0.5, 0.5]
  )
})

it("polygonCentroid(points) returns the expected value for open counterclockwise polygons", () => {
  assert.deepStrictEqual(
    polygonCentroid([
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ]),
    [0.5, 0.5]
  )
  assert.deepStrictEqual(
    polygonCentroid([
      [1, 1],
      [3, 2],
      [2, 3],
    ]),
    [2, 2]
  )
})

it("polygonCentroid(polygon) returns the expected value for a very large polygon", () => {
  const stop = 1e8
  const step = 1e4
  const points = []
  for (let value = 0; value < stop; value += step) points.push([0, value])
  for (let value = 0; value < stop; value += step) points.push([value, stop])
  for (let value = stop - step; value >= 0; value -= step) points.push([stop, value])
  for (let value = stop - step; value >= 0; value -= step) points.push([value, 0])
  assert.deepStrictEqual(polygonCentroid(points), [49999999.75000187, 49999999.75001216])
})
import assert from "assert"
import { polygonContains } from "../src/index.js"

it("polygonContains(polygon, point) returns the expected value for closed counterclockwise polygons", () => {
  assert.strictEqual(
    polygonContains(
      [
        [0, 0],
        [0, 1],
        [1, 1],
        [1, 0],
        [0, 0],
      ],
      [0.5, 0.5]
    ),
    true
  )
  assert.strictEqual(
    polygonContains(
      [
        [0, 0],
        [0, 1],
        [1, 1],
        [1, 0],
        [0, 0],
      ],
      [1.5, 0.5]
    ),
    false
  )
  assert.strictEqual(
    polygonContains(
      [
        [0, 0],
        [0, 1],
        [1, 1],
        [1, 0],
        [0, 0],
      ],
      [-0.5, 0.5]
    ),
    false
  )
  assert.strictEqual(
    polygonContains(
      [
        [0, 0],
        [0, 1],
        [1, 1],
        [1, 0],
        [0, 0],
      ],
      [0.5, 1.5]
    ),
    false
  )
  assert.strictEqual(
    polygonContains(
      [
        [0, 0],
        [0, 1],
        [1, 1],
        [1, 0],
        [0, 0],
      ],
      [0.5, -0.5]
    ),
    false
  )
})

it("polygonContains(polygon, point) returns the expected value for closed clockwise polygons", () => {
  assert.strictEqual(
    polygonContains(
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
        [0, 0],
      ],
      [0.5, 0.5]
    ),
    true
  )
  assert.strictEqual(
    polygonContains(
      [
        [1, 1],
        [3, 2],
        [2, 3],
        [1, 1],
      ],
      [1.5, 1.5]
    ),
    true
  )
})

it("polygonContains(polygon, point) returns the expected value for open counterclockwise polygons", () => {
  assert.strictEqual(
    polygonContains(
      [
        [0, 0],
        [0, 1],
        [1, 1],
        [1, 0],
      ],
      [0.5, 0.5]
    ),
    true
  )
})

it("polygonContains(polygon, point) returns the expected value for open clockwise polygons", () => {
  assert.strictEqual(
    polygonContains(
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
      ],
      [0.5, 0.5]
    ),
    true
  )
  assert.strictEqual(
    polygonContains(
      [
        [1, 1],
        [3, 2],
        [2, 3],
      ],
      [1.5, 1.5]
    ),
    true
  )
})
import assert from "assert"
import { polygonHull } from "../src/index.js"

it("polygonHull(points) returns null if points has fewer than three elements", () => {
  assert.strictEqual(polygonHull([]), null)
  assert.strictEqual(polygonHull([[0, 1]]), null)
  assert.strictEqual(
    polygonHull([
      [0, 1],
      [1, 0],
    ]),
    null
  )
})

it("polygonHull(points) returns the convex hull of the specified points", () => {
  assert.deepStrictEqual(
    polygonHull([
      [200, 200],
      [760, 300],
      [500, 500],
    ]),
    [
      [760, 300],
      [200, 200],
      [500, 500],
    ]
  )
  assert.deepStrictEqual(
    polygonHull([
      [200, 200],
      [760, 300],
      [500, 500],
      [400, 400],
    ]),
    [
      [760, 300],
      [200, 200],
      [500, 500],
    ]
  )
})

it("polygonHull(points) handles points with duplicate ordinates", () => {
  assert.deepStrictEqual(
    polygonHull([
      [-10, -10],
      [10, 10],
      [10, -10],
      [-10, 10],
    ]),
    [
      [10, 10],
      [10, -10],
      [-10, -10],
      [-10, 10],
    ]
  )
})

it("polygonHull(points) handles overlapping upper and lower hulls", () => {
  assert.deepStrictEqual(
    polygonHull([
      [0, -10],
      [0, 10],
      [0, 0],
      [10, 0],
      [-10, 0],
    ]),
    [
      [10, 0],
      [0, -10],
      [-10, 0],
      [0, 10],
    ]
  )
})

// Cases below taken from http://uva.onlinejudge.org/external/6/681.html
it("polygonHull(points) handles various non-trivial hulls", () => {
  assert.deepStrictEqual(
    polygonHull([
      [60, 20],
      [250, 140],
      [180, 170],
      [79, 140],
      [50, 60],
      [60, 20],
    ]),
    [
      [250, 140],
      [60, 20],
      [50, 60],
      [79, 140],
      [180, 170],
    ]
  )
  assert.deepStrictEqual(
    polygonHull([
      [50, 60],
      [60, 20],
      [70, 45],
      [100, 70],
      [125, 90],
      [200, 113],
      [250, 140],
      [180, 170],
      [105, 140],
      [79, 140],
      [60, 85],
      [50, 60],
    ]),
    [
      [250, 140],
      [60, 20],
      [50, 60],
      [79, 140],
      [180, 170],
    ]
  )
  assert.deepStrictEqual(
    polygonHull([
      [30, 30],
      [50, 60],
      [60, 20],
      [70, 45],
      [86, 39],
      [112, 60],
      [200, 113],
      [250, 50],
      [300, 200],
      [130, 240],
      [76, 150],
      [47, 76],
      [36, 40],
      [33, 35],
      [30, 30],
    ]),
    [
      [300, 200],
      [250, 50],
      [60, 20],
      [30, 30],
      [47, 76],
      [76, 150],
      [130, 240],
    ]
  )
})
import assert from "assert"
import { polygonLength } from "../src/index.js"

it("polygonLength(polygon) returns the expected value for closed counterclockwise polygons", () => {
  assert.strictEqual(
    polygonLength([
      [0, 0],
      [0, 1],
      [1, 1],
      [1, 0],
      [0, 0],
    ]),
    4
  )
})

it("polygonLength(polygon) returns the expected value for closed clockwise polygons", () => {
  assert.strictEqual(
    polygonLength([
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
      [0, 0],
    ]),
    4
  )
  assert.strictEqual(
    polygonLength([
      [1, 1],
      [3, 2],
      [2, 3],
      [1, 1],
    ]),
    Math.sqrt(20) + Math.sqrt(2)
  )
})

it("polygonLength(polygon) returns the expected value for open counterclockwise polygons", () => {
  assert.strictEqual(
    polygonLength([
      [0, 0],
      [0, 1],
      [1, 1],
      [1, 0],
    ]),
    4
  )
})

it("polygonLength(polygon) returns the expected value for open clockwise polygons", () => {
  assert.strictEqual(
    polygonLength([
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ]),
    4
  )
  assert.strictEqual(
    polygonLength([
      [1, 1],
      [3, 2],
      [2, 3],
    ]),
    Math.sqrt(20) + Math.sqrt(2)
  )
})
