export function area(xs: Array<[number, number]>): number {
  const n = xs.length
  let i = -1,
    a,
    b = xs[n - 1],
    y = 0
  while (++i < n) {
    a = b
    b = xs[i]
    y += a[1] * b[0] - a[0] * b[1]
  }
  return y / 2
}

export function centroid(xs: Array<[number, number]>): [number, number] {
  const n = xs.length
  let i = -1,
    x = 0,
    y = 0,
    a,
    b = xs[n - 1],
    c,
    k = 0
  while (++i < n) {
    a = b
    b = xs[i]
    k += c = a[0] * b[1] - b[0] * a[1]
    x += (a[0] + b[0]) * c
    y += (a[1] + b[1]) * c
  }
  return (k *= 3), [x / k, y / k]
}

export function contains(xs: Array<[number, number]>, point: [number, number]): boolean {
  const n = xs.length,
    x = point[0],
    y = point[1]
  let p = xs[n - 1],
    x0 = p[0],
    y0 = p[1],
    x1,
    y1,
    inside = false
  for (let i = 0; i < n; ++i) {
    ;(p = xs[i]), (x1 = p[0]), (y1 = p[1])
    if (y1 > y !== y0 > y && x < ((x0 - x1) * (y - y1)) / (y0 - y1) + x1) inside = !inside
    ;(x0 = x1), (y0 = y1)
  }
  return inside
}

export function cross(a: [number, number], b: [number, number], c: [number, number]) {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])
}

function lexicographicOrder(a: [number, number], b: [number, number]) {
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
  return indexes.slice(0, size)
}

export function hull(xs: Array<[number, number]>): Array<[number, number]> | undefined {
  if ((n = xs.length) < 3) return undefined
  let i,
    n,
    sortedPoints = new Array(n),
    flippedPoints = new Array(n)
  for (i = 0; i < n; ++i) sortedPoints[i] = [+xs[i][0], +xs[i][1], i]
  sortedPoints.sort(lexicographicOrder)
  for (i = 0; i < n; ++i) flippedPoints[i] = [sortedPoints[i][0], -sortedPoints[i][1]]
  const upperIndexes = computeUpperHullIndexes(sortedPoints),
    lowerIndexes = computeUpperHullIndexes(flippedPoints)
  const skipLeft = lowerIndexes[0] === upperIndexes[0],
    skipRight = lowerIndexes[lowerIndexes.length - 1] === upperIndexes[upperIndexes.length - 1],
    y = []
  for (i = upperIndexes.length - 1; i >= 0; --i) y.push(xs[sortedPoints[upperIndexes[i]][2]])
  for (i = +skipLeft; i < lowerIndexes.length - skipRight; ++i) y.push(xs[sortedPoints[lowerIndexes[i]][2]])
  return y
}

export function length(xs: Array<[number, number]>): number {
  const n = xs.length
  let i = -1,
    b = xs[n - 1],
    xa,
    ya,
    xb = b[0],
    yb = b[1],
    y = 0
  while (++i < n) {
    xa = xb
    ya = yb
    b = xs[i]
    xb = b[0]
    yb = b[1]
    xa -= xb
    ya -= yb
    y += Math.hypot(xa, ya)
  }
  return y
}
