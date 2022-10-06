export function (polygon) {
  var i = -1,
    n = polygon.length,
    a,
    b = polygon[n - 1],
    area = 0

  while (++i < n) {
    a = b
    b = polygon[i]
    area += a[1] * b[0] - a[0] * b[1]
  }

  return area / 2
}
export function (polygon) {
  var i = -1,
    n = polygon.length,
    x = 0,
    y = 0,
    a,
    b = polygon[n - 1],
    c,
    k = 0

  while (++i < n) {
    a = b
    b = polygon[i]
    k += c = a[0] * b[1] - b[0] * a[1]
    x += (a[0] + b[0]) * c
    y += (a[1] + b[1]) * c
  }

  return (k *= 3), [x / k, y / k]
}
export function (polygon, point) {
  var n = polygon.length,
    p = polygon[n - 1],
    x = point[0],
    y = point[1],
    x0 = p[0],
    y0 = p[1],
    x1,
    y1,
    inside = false

  for (var i = 0; i < n; ++i) {
    ;(p = polygon[i]), (x1 = p[0]), (y1 = p[1])
    if (y1 > y !== y0 > y && x < ((x0 - x1) * (y - y1)) / (y0 - y1) + x1) inside = !inside
    ;(x0 = x1), (y0 = y1)
  }

  return inside
}

export function (a, b, c) {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])
}
import cross from "./cross.js"

function lexicographicOrder(a, b) {
  return a[0] - b[0] || a[1] - b[1]
}

function computeUpperHullIndexes(points) {
  const n = points.length,
    indexes = [0, 1]
  let size = 2,
    i

  for (i = 2; i < n; ++i) {
    while (size > 1 && cross(points[indexes[size - 2]], points[indexes[size - 1]], points[i]) <= 0) --size
    indexes[size++] = i
  }

  return indexes.slice(0, size) // remove popped points
}

export function (points) {
  if ((n = points.length) < 3) return null

  var i,
    n,
    sortedPoints = new Array(n),
    flippedPoints = new Array(n)

  for (i = 0; i < n; ++i) sortedPoints[i] = [+points[i][0], +points[i][1], i]
  sortedPoints.sort(lexicographicOrder)
  for (i = 0; i < n; ++i) flippedPoints[i] = [sortedPoints[i][0], -sortedPoints[i][1]]

  var upperIndexes = computeUpperHullIndexes(sortedPoints),
    lowerIndexes = computeUpperHullIndexes(flippedPoints)

  var skipLeft = lowerIndexes[0] === upperIndexes[0],
    skipRight = lowerIndexes[lowerIndexes.length - 1] === upperIndexes[upperIndexes.length - 1],
    hull = []

  for (i = upperIndexes.length - 1; i >= 0; --i) hull.push(points[sortedPoints[upperIndexes[i]][2]])
  for (i = +skipLeft; i < lowerIndexes.length - skipRight; ++i) hull.push(points[sortedPoints[lowerIndexes[i]][2]])

  return hull
}
export { default as polygonArea } from "./area.js"
export { default as polygonCentroid } from "./centroid.js"
export { default as polygonHull } from "./hull.js"
export { default as polygonContains } from "./contains.js"
export { default as polygonLength } from "./length.js"
export function (polygon) {
  var i = -1,
    n = polygon.length,
    b = polygon[n - 1],
    xa,
    ya,
    xb = b[0],
    yb = b[1],
    perimeter = 0

  while (++i < n) {
    xa = xb
    ya = yb
    b = polygon[i]
    xb = b[0]
    yb = b[1]
    xa -= xb
    ya -= yb
    perimeter += Math.hypot(xa, ya)
  }

  return perimeter
}
