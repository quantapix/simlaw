import { thresholdSturges, ticks, tickStep } from "./sequence.js"
import { each, slice, blur2 } from "./sequence.js"
import type * as qt from "./types.js"
import * as qu from "./utils.js"

export function area(ps: qt.Point[]) {
  const n = ps.length
  let i = 0,
    y = ps[n - 1]![1] * ps[0]![0] - ps[n - 1]![0] * ps[0]![1]
  while (++i < n) y += ps[i - 1]![1] * ps[i]![0] - ps[i - 1]![0] * ps[i]![1]
  return y
}
export function contains(ps: qt.Point[], xs: qt.Point[]) {
  function inRing(p: qt.Point) {
    const [x, y] = p
    let contains = -1
    function inSegment(a: qt.Point, b: qt.Point, c: qt.Point) {
      const collinear = (a: qt.Point, b: qt.Point, c: qt.Point) =>
        (b[0] - a[0]) * (c[1] - a[1]) === (c[0] - a[0]) * (b[1] - a[1])
      const within = (x: number, y: number, z: number) => (x <= y && y <= z) || (z <= y && y <= x)
      let i: number
      return collinear(a, b, c) && within(a[(i = +(a[0] === b[0]))]!, c[i]!, b[i]!)
    }
    for (let i = 0, n = ps.length, j = n - 1; i < n; j = i++) {
      const pi = ps[i]!
      const [xi, yi] = pi
      const pj = ps[j]!
      const [xj, yj] = pj
      if (inSegment(pi, pj, p)) return 0
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) contains = -contains
    }
    return contains
  }
  for (const x of xs) {
    const c = inRing(x)
    if (c) return c
  }
  return 0
}
export function contours(): qt.Contours {
  let _smooth = linear,
    _sx = 1,
    _sy = 1,
    _ts = thresholdSturges
  function f(values) {
    let tz = _ts(values)
    if (!Array.isArray(tz)) {
      const e = each.extent(values),
        ts = tickStep(e[0], e[1], tz)
      tz = ticks(Math.floor(e[0] / ts) * ts, Math.floor(e[1] / ts - 1) * ts, tz)
    } else {
      tz = tz.slice().sort(qu.ascending)
    }
    return tz.map(value => contour(values, value))
  }
  function contour(values, value) {
    const polygons = [],
      holes = []
    isorings(values, value, function (ring) {
      _smooth(ring, values, value)
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
    const fragmentByStart = new Array(),
      fragmentByEnd = new Array()
    let x, y, t0, t1, t2, t3
    x = y = -1
    t1 = values[0] >= value
    cases[t1 << 1].forEach(stitch)
    while (++x < _sx - 1) {
      ;(t0 = t1), (t1 = values[x + 1] >= value)
      cases[t0 | (t1 << 1)].forEach(stitch)
    }
    cases[t1 << 0].forEach(stitch)
    while (++y < _sy - 1) {
      x = -1
      t1 = values[y * _sx + _sx] >= value
      t2 = values[y * _sx] >= value
      cases[(t1 << 1) | (t2 << 2)].forEach(stitch)
      while (++x < _sx - 1) {
        ;(t0 = t1), (t1 = values[y * _sx + _sx + x + 1] >= value)
        ;(t3 = t2), (t2 = values[y * _sx + x + 1] >= value)
        cases[t0 | (t1 << 1) | (t2 << 2) | (t3 << 3)].forEach(stitch)
      }
      cases[t1 | (t2 << 3)].forEach(stitch)
    }
    x = -1
    t2 = values[y * _sx] >= value
    cases[t2 << 2].forEach(stitch)
    while (++x < _sx - 1) {
      ;(t3 = t2), (t2 = values[y * _sx + x + 1] >= value)
      cases[(t2 << 2) | (t3 << 3)].forEach(stitch)
    }
    cases[t2 << 3].forEach(stitch)
    function stitch(line) {
      const index = (x: qt.Point) => x[0] * 2 + x[1] * (_sx + 1) * 4
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
  function linear(ring, values, value) {
    ring.forEach(function (point) {
      let x = point[0],
        y = point[1],
        xt = x | 0,
        yt = y | 0,
        v0,
        v1 = values[yt * _sx + xt]
      if (x > 0 && x < _sx && xt === x) {
        v0 = values[yt * _sx + xt - 1]
        point[0] = x + (value - v0) / (v1 - v0) - 0.5
      }
      if (y > 0 && y < _sy && yt === y) {
        v0 = values[(yt - 1) * _sx + xt]
        point[1] = y + (value - v0) / (v1 - v0) - 0.5
      }
    })
  }
  f.contour = contour
  f.size = (x: any) => {
    if (x === undefined) return [_sx, _sy]
    const sx = Math.floor(x[0])
    const sy = Math.floor(x[1])
    if (!(sx >= 0 && sy >= 0)) throw new Error("invalid size")
    return (_sx = sx), (_sy = sy), f
  }
  f.smooth = (x: any) => (x === undefined ? _smooth === linear : ((_smooth = x ? linear : () => {}), f))
  f.thresholds = (x: any) =>
    x === undefined
      ? _ts
      : ((_ts = typeof x === "function" ? x : Array.isArray(x) ? qu.constant(slice.call(x)) : qu.constant(x)), f)
  return f
}
export function density<T = qt.Point>(): qt.Density<T> {
  let _k = 2, // log2(grid cell size)
    _r = 20, // blur radius
    _off = _r * 3, // grid offset, to pad for blur
    _sx = 960,
    _sy = 500,
    _gx = (_sx + _off * 2) >> _k, // grid width
    _gy = (_sy + _off * 2) >> _k, // grid height
    _ts = qu.constant(20),
    _w: qt.Op<T> = () => 1,
    _x: qt.Op<T> = (x: any) => x[0],
    _y: qt.Op<T> = (x: any) => x[1]
  function grid(data) {
    const values = new Float32Array(_gx * _gy),
      pow2k = Math.pow(2, -_k)
    let i = -1
    for (const d of data) {
      const xi = (_x(d, ++i, data) + _off) * pow2k,
        yi = (_y(d, i, data) + _off) * pow2k,
        wi = +_w(d, i, data)
      if (xi >= 0 && xi < _gx && yi >= 0 && yi < _gy) {
        const x0 = Math.floor(xi),
          y0 = Math.floor(yi),
          xt = xi - x0 - 0.5,
          yt = yi - y0 - 0.5
        values[x0 + y0 * _gx] += (1 - xt) * (1 - yt) * wi
        values[x0 + 1 + y0 * _gx] += xt * (1 - yt) * wi
        values[x0 + 1 + (y0 + 1) * _gx] += xt * yt * wi
        values[x0 + (y0 + 1) * _gx] += (1 - xt) * yt * wi
      }
    }
    blur2({ data: values, width: _gx, height: _gy }, _r * pow2k)
    return values
  }
  function transform(x) {
    x.coordinates.forEach(x =>
      x.forEach(x =>
        x.forEach(p => {
          p[0] = p[0] * Math.pow(2, _k) - _off
          p[1] = p[1] * Math.pow(2, _k) - _off
        })
      )
    )
    return x
  }
  function f(data) {
    const values = grid(data),
      pow4k = Math.pow(2, 2 * _k)
    let tz = _ts(values)
    if (!Array.isArray(tz)) {
      tz = ticks(Number.MIN_VALUE, each.max(values) / pow4k, tz)
    }
    return contours()
      .size([_gx, _gy])
      .thresholds(tz.map(d => d * pow4k))(values)
      .map((c, i) => ((c.value = +tz[i]), transform(c)))
  }
  function resize() {
    _off = _r * 3
    _gx = (_sx + _off * 2) >> _k
    _gy = (_sy + _off * 2) >> _k
    return f
  }
  f.contours = function (data) {
    const values = grid(data),
      cs = contours().size([_gx, _gy]),
      pow4k = Math.pow(2, 2 * _k),
      contour = x => {
        x = +x
        const c = transform(cs.contour(values, x * pow4k))
        c.value = x
        return c
      }
    Object.defineProperty(contour, "max", { get: () => each.max(values) / pow4k })
    return contour
  }
  f.bandwidth = (x: any) => {
    if (x === undefined) return Math.sqrt(_r * (_r + 1))
    if (!((x = +x) >= 0)) throw new Error("invalid bandwidth")
    return (_r = (Math.sqrt(4 * x * x + 1) - 1) / 2), resize()
  }
  f.cellSize = (x: any) => {
    if (x === undefined) return 1 << _k
    if (!((x = +x) >= 1)) throw new Error("invalid cell size")
    return (_k = Math.floor(Math.log(x) / Math.LN2)), resize()
  }
  f.size = (x: any) => {
    if (x === undefined) return [_sx, _sy]
    const [sx, sy] = x
    if (!(sx >= 0 && sy >= 0)) throw new Error("invalid size")
    return (_sx = sx), (_sy = sy), resize()
  }
  f.thresholds = (x: any) =>
    x === undefined
      ? _ts
      : ((_ts = typeof x === "function" ? x : Array.isArray(x) ? qu.constant(slice.call(x)) : qu.constant(x)), f)
  f.weight = (x: any) => (x === undefined ? _w : ((_w = typeof x === "function" ? x : qu.constant(+x)), f))
  f.x = (x: any) => (x === undefined ? _x : ((_x = typeof x === "function" ? x : qu.constant(+x)), f))
  f.y = (x: any) => (x === undefined ? _y : ((_y = typeof x === "function" ? x : qu.constant(+x)), f))
  return f
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

export function chord() {
  return _chord(false, false)
}
export function transpose() {
  return _chord(false, true)
}
export function directed() {
  return _chord(true, false)
}
function _chord(directed, transpose): qt.Chord.Layout {
  let padAngle = 0,
    sortGroups = null,
    sortSubgroups = null,
    sortChords = null
  const range = (i, j) => Array.from({ length: j - i }, (_, k) => i + k)
  const cmp = c => (a, b) => c(a.source.value + a.target.value, b.source.value + b.target.value)
  function f(matrix) {
    let n = matrix.length,
      groupSums = new Array(n),
      groupIndex = range(0, n),
      chords = new Array(n * n),
      groups = new Array(n),
      k = 0,
      dx
    matrix = Float64Array.from(
      { length: n * n },
      transpose ? (_, i) => matrix[i % n][(i / n) | 0] : (_, i) => matrix[(i / n) | 0][i % n]
    )
    for (let i = 0; i < n; ++i) {
      let x = 0
      for (let j = 0; j < n; ++j) x += matrix[i * n + j] + directed * matrix[j * n + i]
      k += groupSums[i] = x
    }
    k = qu.max(0, qu.tau - padAngle * n) / k
    dx = k ? padAngle : qu.tau / n
    {
      let x = 0
      if (sortGroups) groupIndex.sort((a, b) => sortGroups(groupSums[a], groupSums[b]))
      for (const i of groupIndex) {
        const x0 = x
        if (directed) {
          const subgroupIndex = range(~n + 1, n).filter(j => (j < 0 ? matrix[~j * n + i] : matrix[i * n + j]))
          if (sortSubgroups)
            subgroupIndex.sort((a, b) =>
              sortSubgroups(
                a < 0 ? -matrix[~a * n + i] : matrix[i * n + a],
                b < 0 ? -matrix[~b * n + i] : matrix[i * n + b]
              )
            )
          for (const j of subgroupIndex) {
            if (j < 0) {
              const chord = chords[~j * n + i] || (chords[~j * n + i] = { source: null, target: null })
              chord.target = {
                index: i,
                startAngle: x,
                endAngle: (x += matrix[~j * n + i] * k),
                value: matrix[~j * n + i],
              }
            } else {
              const chord = chords[i * n + j] || (chords[i * n + j] = { source: null, target: null })
              chord.source = {
                index: i,
                startAngle: x,
                endAngle: (x += matrix[i * n + j] * k),
                value: matrix[i * n + j],
              }
            }
          }
          groups[i] = { index: i, startAngle: x0, endAngle: x, value: groupSums[i] }
        } else {
          const subgroupIndex = range(0, n).filter(j => matrix[i * n + j] || matrix[j * n + i])
          if (sortSubgroups) subgroupIndex.sort((a, b) => sortSubgroups(matrix[i * n + a], matrix[i * n + b]))
          for (const j of subgroupIndex) {
            let chord
            if (i < j) {
              chord = chords[i * n + j] || (chords[i * n + j] = { source: null, target: null })
              chord.source = {
                index: i,
                startAngle: x,
                endAngle: (x += matrix[i * n + j] * k),
                value: matrix[i * n + j],
              }
            } else {
              chord = chords[j * n + i] || (chords[j * n + i] = { source: null, target: null })
              chord.target = {
                index: i,
                startAngle: x,
                endAngle: (x += matrix[i * n + j] * k),
                value: matrix[i * n + j],
              }
              if (i === j) chord.source = chord.target
            }
            if (chord.source && chord.target && chord.source.value < chord.target.value) {
              const source = chord.source
              chord.source = chord.target
              chord.target = source
            }
          }
          groups[i] = { index: i, startAngle: x0, endAngle: x, value: groupSums[i] }
        }
        x += dx
      }
    }
    chords = Object.values(chords)
    chords.groups = groups
    return sortChords ? chords.sort(sortChords) : chords
  }
  f.padAngle = (x: any) => (x === undefined ? padAngle : ((padAngle = qu.max(0, x)), f))
  f.sortGroups = (x: any) => (x === undefined ? sortGroups : ((sortGroups = x), f))
  f.sortSubgroups = (x: any) => (x === undefined ? sortSubgroups : ((sortSubgroups = x), f))
  f.sortChords = (x: any) =>
    x === undefined ? sortChords && sortChords._ : (x === null ? (sortChords = null) : ((sortChords = cmp(x))._ = x), f)
  return f
}
function _ribbon(headRadius?) {
  let source = x => x.source,
    target = x => x.target,
    sourceRadius = x => x.radius,
    targetRadius = x => x.radius,
    startAngle = x => x.startAngle,
    endAngle = x => x.endAngle,
    padAngle = _ => 0,
    _context = null
  function f(...xs: any) {
    let buffer,
      s = source(xs),
      t = target(xs),
      ap = padAngle(xs) / 2,
      argv = slice(xs),
      sr = +sourceRadius(((argv[0] = s), argv)),
      sa0 = startAngle(argv) - qu.halfPI,
      sa1 = endAngle(argv) - qu.halfPI,
      tr = +targetRadius(((argv[0] = t), argv)),
      ta0 = startAngle(argv) - qu.halfPI,
      ta1 = endAngle(argv) - qu.halfPI
    if (!_context) _context = buffer = new qu.Path()
    if (ap > qu.epsilon2) {
      if (qu.abs(sa1 - sa0) > ap * 2 + qu.epsilon2) sa1 > sa0 ? ((sa0 += ap), (sa1 -= ap)) : ((sa0 -= ap), (sa1 += ap))
      else sa0 = sa1 = (sa0 + sa1) / 2
      if (qu.abs(ta1 - ta0) > ap * 2 + qu.epsilon2) ta1 > ta0 ? ((ta0 += ap), (ta1 -= ap)) : ((ta0 -= ap), (ta1 += ap))
      else ta0 = ta1 = (ta0 + ta1) / 2
    }
    _context.moveTo(sr * qu.cos(sa0), sr * qu.sin(sa0))
    _context.arc(0, 0, sr, sa0, sa1)
    if (sa0 !== ta0 || sa1 !== ta1) {
      if (headRadius) {
        let hr = +headRadius(arguments),
          tr2 = tr - hr,
          ta2 = (ta0 + ta1) / 2
        _context.quadraticTo(0, 0, tr2 * qu.cos(ta0), tr2 * qu.sin(ta0))
        _context.lineTo(tr * qu.cos(ta2), tr * qu.sin(ta2))
        _context.lineTo(tr2 * qu.cos(ta1), tr2 * qu.sin(ta1))
      } else {
        _context.quadraticTo(0, 0, tr * qu.cos(ta0), tr * qu.sin(ta0))
        _context.arc(0, 0, tr, ta0, ta1)
      }
    }
    _context.quadraticTo(0, 0, sr * qu.cos(sa0), sr * qu.sin(sa0))
    _context.closePath()
    if (buffer) return (_context = null), buffer + "" || null
  }
  if (headRadius) {
    f.headRadius = (x: any) =>
      x === undefined ? headRadius : ((headRadius = typeof x === "function" ? x : qu.constant(+x)), f)
  }
  f.radius = (x: any) =>
    x === undefined ? sourceRadius : ((sourceRadius = targetRadius = typeof x === "function" ? x : qu.constant(+x)), f)
  f.sourceRadius = (x: any) =>
    x === undefined ? sourceRadius : ((sourceRadius = typeof x === "function" ? x : qu.constant(+x)), f)
  f.targetRadius = (x: any) =>
    x === undefined ? targetRadius : ((targetRadius = typeof x === "function" ? x : qu.constant(+x)), f)
  f.startAngle = (x: any) =>
    x === undefined ? startAngle : ((startAngle = typeof x === "function" ? x : qu.constant(+x)), f)
  f.endAngle = (x: any) =>
    x === undefined ? endAngle : ((endAngle = typeof x === "function" ? x : qu.constant(+x)), f)
  f.padAngle = (x: any) =>
    x === undefined ? padAngle : ((padAngle = typeof x === "function" ? x : qu.constant(+x)), f)
  f.source = (x: any) => (x === undefined ? source : ((source = x), f))
  f.target = (x: any) => (x === undefined ? target : ((target = x), f))
  f.context = (x: any) => (x === undefined ? _context : ((_context = x === null ? null : x), f))

  return f
}
export function ribbon(): qt.Ribbon.Gen<any, qt.Ribbon, qt.Ribbon.Subgroup>
export function ribbon<T, U>(): qt.Ribbon.Gen<any, T, U>
export function ribbon<This, T, U>(): qt.Ribbon.Gen<This, T, U>
export function ribbon(): any {
  return _ribbon()
}
export function ribbonArrow(): qt.Ribbon.ArrowGen<any, qt.Ribbon, qt.Ribbon.Subgroup>
export function ribbonArrow<T, U>(): qt.Ribbon.ArrowGen<any, T, U>
export function ribbonArrow<This, T, U>(): qt.Ribbon.ArrowGen<This, T, U>
export function ribbonArrow(): any {
  return _ribbon(() => 10)
}
