import { extent, thresholdSturges, ticks, tickStep } from "./array.js"
import { slice } from "./array.js"
import { blur2, max } from "./array.js"
import type * as qt from "./types.js"

export function area(ring) {
  let i = 0,
    n = ring.length,
    area = ring[n - 1][1] * ring[0][0] - ring[n - 1][0] * ring[0][1]
  while (++i < n) area += ring[i - 1][1] * ring[i][0] - ring[i - 1][0] * ring[i][1]
  return area
}
export function ascending(a, b) {
  return a - b
}
export const constant = x => () => x
export function contains(ring, hole) {
  let i = -1,
    n = hole.length,
    c
  while (++i < n) if ((c = ringContains(ring, hole[i]))) return c
  return 0
}
function ringContains(ring, point) {
  let x = point[0],
    y = point[1],
    contains = -1
  for (let i = 0, n = ring.length, j = n - 1; i < n; j = i++) {
    const pi = ring[i],
      xi = pi[0],
      yi = pi[1],
      pj = ring[j],
      xj = pj[0],
      yj = pj[1]
    if (segmentContains(pi, pj, point)) return 0
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) contains = -contains
  }
  return contains
}
function segmentContains(a, b, c) {
  let i
  return collinear(a, b, c) && within(a[(i = +(a[0] === b[0]))], c[i], b[i])
}
function collinear(a, b, c) {
  return (b[0] - a[0]) * (c[1] - a[1]) === (c[0] - a[0]) * (b[1] - a[1])
}
function within(p, q, r) {
  return (p <= q && q <= r) || (r <= q && q <= p)
}
const cases = [
  [],
  [
    [
      [1.0, 1.5],
      [0.5, 1.0],
    ],
  ],
  [
    [
      [1.5, 1.0],
      [1.0, 1.5],
    ],
  ],
  [
    [
      [1.5, 1.0],
      [0.5, 1.0],
    ],
  ],
  [
    [
      [1.0, 0.5],
      [1.5, 1.0],
    ],
  ],
  [
    [
      [1.0, 1.5],
      [0.5, 1.0],
    ],
    [
      [1.0, 0.5],
      [1.5, 1.0],
    ],
  ],
  [
    [
      [1.0, 0.5],
      [1.0, 1.5],
    ],
  ],
  [
    [
      [1.0, 0.5],
      [0.5, 1.0],
    ],
  ],
  [
    [
      [0.5, 1.0],
      [1.0, 0.5],
    ],
  ],
  [
    [
      [1.0, 1.5],
      [1.0, 0.5],
    ],
  ],
  [
    [
      [0.5, 1.0],
      [1.0, 0.5],
    ],
    [
      [1.5, 1.0],
      [1.0, 1.5],
    ],
  ],
  [
    [
      [1.5, 1.0],
      [1.0, 0.5],
    ],
  ],
  [
    [
      [0.5, 1.0],
      [1.5, 1.0],
    ],
  ],
  [
    [
      [1.0, 1.5],
      [1.5, 1.0],
    ],
  ],
  [
    [
      [0.5, 1.0],
      [1.0, 1.5],
    ],
  ],
  [],
]
export function contours(): qt.Contours {
  let dx = 1,
    dy = 1,
    threshold = thresholdSturges,
    smooth = smoothLinear
  function f(values) {
    let tz = threshold(values)
    if (!Array.isArray(tz)) {
      const e = extent(values),
        ts = tickStep(e[0], e[1], tz)
      tz = ticks(Math.floor(e[0] / ts) * ts, Math.floor(e[1] / ts - 1) * ts, tz)
    } else {
      tz = tz.slice().sort(ascending)
    }
    return tz.map(value => contour(values, value))
  }
  function contour(values, value) {
    const polygons = [],
      holes = []
    isorings(values, value, function (ring) {
      smooth(ring, values, value)
      if (area(ring) > 0) polygons.push([ring])
      else holes.push(ring)
    })
    holes.forEach(function (hole) {
      for (var i = 0, n = polygons.length, polygon; i < n; ++i) {
        if (contains((polygon = polygons[i])[0], hole) !== -1) {
          polygon.push(hole)
          return
        }
      }
    })
    return {
      type: "MultiPolygon",
      value: value,
      coordinates: polygons,
    }
  }
  function isorings(values, value, callback) {
    let fragmentByStart = new Array(),
      fragmentByEnd = new Array(),
      x,
      y,
      t0,
      t1,
      t2,
      t3
    x = y = -1
    t1 = values[0] >= value
    cases[t1 << 1].forEach(stitch)
    while (++x < dx - 1) {
      ;(t0 = t1), (t1 = values[x + 1] >= value)
      cases[t0 | (t1 << 1)].forEach(stitch)
    }
    cases[t1 << 0].forEach(stitch)
    while (++y < dy - 1) {
      x = -1
      t1 = values[y * dx + dx] >= value
      t2 = values[y * dx] >= value
      cases[(t1 << 1) | (t2 << 2)].forEach(stitch)
      while (++x < dx - 1) {
        ;(t0 = t1), (t1 = values[y * dx + dx + x + 1] >= value)
        ;(t3 = t2), (t2 = values[y * dx + x + 1] >= value)
        cases[t0 | (t1 << 1) | (t2 << 2) | (t3 << 3)].forEach(stitch)
      }
      cases[t1 | (t2 << 3)].forEach(stitch)
    }
    x = -1
    t2 = values[y * dx] >= value
    cases[t2 << 2].forEach(stitch)
    while (++x < dx - 1) {
      ;(t3 = t2), (t2 = values[y * dx + x + 1] >= value)
      cases[(t2 << 2) | (t3 << 3)].forEach(stitch)
    }
    cases[t2 << 3].forEach(stitch)
    function stitch(line) {
      let start = [line[0][0] + x, line[0][1] + y],
        end = [line[1][0] + x, line[1][1] + y],
        startIndex = index(start),
        endIndex = index(end),
        f,
        g
      if ((f = fragmentByEnd[startIndex])) {
        if ((g = fragmentByStart[endIndex])) {
          delete fragmentByEnd[f.end]
          delete fragmentByStart[g.start]
          if (f === g) {
            f.ring.push(end)
            callback(f.ring)
          } else {
            fragmentByStart[f.start] = fragmentByEnd[g.end] = {
              start: f.start,
              end: g.end,
              ring: f.ring.concat(g.ring),
            }
          }
        } else {
          delete fragmentByEnd[f.end]
          f.ring.push(end)
          fragmentByEnd[(f.end = endIndex)] = f
        }
      } else if ((f = fragmentByStart[endIndex])) {
        if ((g = fragmentByEnd[startIndex])) {
          delete fragmentByStart[f.start]
          delete fragmentByEnd[g.end]
          if (f === g) {
            f.ring.push(end)
            callback(f.ring)
          } else {
            fragmentByStart[g.start] = fragmentByEnd[f.end] = {
              start: g.start,
              end: f.end,
              ring: g.ring.concat(f.ring),
            }
          }
        } else {
          delete fragmentByStart[f.start]
          f.ring.unshift(start)
          fragmentByStart[(f.start = startIndex)] = f
        }
      } else {
        fragmentByStart[startIndex] = fragmentByEnd[endIndex] = { start: startIndex, end: endIndex, ring: [start, end] }
      }
    }
  }
  function index(point) {
    return point[0] * 2 + point[1] * (dx + 1) * 4
  }
  function smoothLinear(ring, values, value) {
    ring.forEach(function (point) {
      let x = point[0],
        y = point[1],
        xt = x | 0,
        yt = y | 0,
        v0,
        v1 = values[yt * dx + xt]
      if (x > 0 && x < dx && xt === x) {
        v0 = values[yt * dx + xt - 1]
        point[0] = x + (value - v0) / (v1 - v0) - 0.5
      }
      if (y > 0 && y < dy && yt === y) {
        v0 = values[(yt - 1) * dx + xt]
        point[1] = y + (value - v0) / (v1 - v0) - 0.5
      }
    })
  }
  f.contour = contour
  f.size = function (_) {
    if (!arguments.length) return [dx, dy]
    const _0 = Math.floor(_[0]),
      _1 = Math.floor(_[1])
    if (!(_0 >= 0 && _1 >= 0)) throw new Error("invalid size")
    return (dx = _0), (dy = _1), f
  }
  f.thresholds = function (_) {
    return arguments.length
      ? ((threshold = typeof _ === "function" ? _ : Array.isArray(_) ? constant(slice.call(_)) : constant(_)), f)
      : threshold
  }
  f.smooth = function (_) {
    return arguments.length ? ((smooth = _ ? smoothLinear : noop), f) : smooth === smoothLinear
  }
  return f
}
function defaultX(d) {
  return d[0]
}
function defaultY(d) {
  return d[1]
}
function defaultWeight() {
  return 1
}
export function density<T = [number, number]>(): qt.ContourDensity<T> {
  let x = defaultX,
    y = defaultY,
    weight = defaultWeight,
    dx = 960,
    dy = 500,
    r = 20, // blur radius
    k = 2, // log2(grid cell size)
    o = r * 3, // grid offset, to pad for blur
    n = (dx + o * 2) >> k, // grid width
    m = (dy + o * 2) >> k, // grid height
    threshold = constant(20)
  function grid(data) {
    let values = new Float32Array(n * m),
      pow2k = Math.pow(2, -k),
      i = -1
    for (const d of data) {
      const xi = (x(d, ++i, data) + o) * pow2k,
        yi = (y(d, i, data) + o) * pow2k,
        wi = +weight(d, i, data)
      if (xi >= 0 && xi < n && yi >= 0 && yi < m) {
        const x0 = Math.floor(xi),
          y0 = Math.floor(yi),
          xt = xi - x0 - 0.5,
          yt = yi - y0 - 0.5
        values[x0 + y0 * n] += (1 - xt) * (1 - yt) * wi
        values[x0 + 1 + y0 * n] += xt * (1 - yt) * wi
        values[x0 + 1 + (y0 + 1) * n] += xt * yt * wi
        values[x0 + (y0 + 1) * n] += (1 - xt) * yt * wi
      }
    }
    blur2({ data: values, width: n, height: m }, r * pow2k)
    return values
  }
  function f(data) {
    let values = grid(data),
      tz = threshold(values),
      pow4k = Math.pow(2, 2 * k)
    if (!Array.isArray(tz)) {
      tz = ticks(Number.MIN_VALUE, max(values) / pow4k, tz)
    }
    return Contours()
      .size([n, m])
      .thresholds(tz.map(d => d * pow4k))(values)
      .map((c, i) => ((c.value = +tz[i]), transform(c)))
  }
  f.contours = function (data) {
    const values = grid(data),
      contours = Contours().size([n, m]),
      pow4k = Math.pow(2, 2 * k),
      contour = value => {
        value = +value
        let c = transform(contours.contour(values, value * pow4k))
        c.value = value // preserve exact threshold value
        return c
      }
    Object.defineProperty(contour, "max", { get: () => max(values) / pow4k })
    return contour
  }
  function transform(geometry) {
    geometry.coordinates.forEach(transformPolygon)
    return geometry
  }
  function transformPolygon(coordinates) {
    coordinates.forEach(transformRing)
  }
  function transformRing(coordinates) {
    coordinates.forEach(transformPoint)
  }
  function transformPoint(coordinates) {
    coordinates[0] = coordinates[0] * Math.pow(2, k) - o
    coordinates[1] = coordinates[1] * Math.pow(2, k) - o
  }
  function resize() {
    o = r * 3
    n = (dx + o * 2) >> k
    m = (dy + o * 2) >> k
    return f
  }
  f.x = function (_) {
    return arguments.length ? ((x = typeof _ === "function" ? _ : constant(+_)), f) : x
  }
  f.y = function (_) {
    return arguments.length ? ((y = typeof _ === "function" ? _ : constant(+_)), f) : y
  }
  f.weight = function (_) {
    return arguments.length ? ((weight = typeof _ === "function" ? _ : constant(+_)), f) : weight
  }
  f.size = function (_) {
    if (!arguments.length) return [dx, dy]
    const _0 = +_[0],
      _1 = +_[1]
    if (!(_0 >= 0 && _1 >= 0)) throw new Error("invalid size")
    return (dx = _0), (dy = _1), resize()
  }
  f.cellSize = function (_) {
    if (!arguments.length) return 1 << k
    if (!((_ = +_) >= 1)) throw new Error("invalid cell size")
    return (k = Math.floor(Math.log(_) / Math.LN2)), resize()
  }
  f.thresholds = function (_) {
    return arguments.length
      ? ((threshold = typeof _ === "function" ? _ : Array.isArray(_) ? constant(slice.call(_)) : constant(_)), f)
      : threshold
  }
  f.bandwidth = function (_) {
    if (!arguments.length) return Math.sqrt(r * (r + 1))
    if (!((_ = +_) >= 0)) throw new Error("invalid bandwidth")
    return (r = (Math.sqrt(4 * _ * _ + 1) - 1) / 2), resize()
  }
  return f
}
export function noop() {}
