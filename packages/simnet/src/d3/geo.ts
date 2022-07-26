/* eslint-disable no-inner-declarations */
import { Adder, range } from "./sequence.js"
import * as qu from "./utils.js"
import type { Geo as qg } from "./types.js"
import type * as qt from "./types.js"

export function area(x: qg.ExtFeature | qg.ExtFeatureColl | qg.Geos | qg.ExtCollection): number {
  area.sum = new Adder()
  stream(x, area.stream)
  return +area.sum * 2
}
export namespace area {
  export let ring = new Adder()
  // eslint-disable-next-line prefer-const
  export let sum = new Adder()
  let lam00: number, phi00: number
  let lam0: number, cosPhi0: number, sinPhi0: number
  export const stream = {
    point: qu.noop,
    lineStart: qu.noop,
    lineEnd: qu.noop,
    polygonStart: function () {
      ring = new Adder()
      stream.lineStart = ringStart
      stream.lineEnd = ringEnd
    },
    polygonEnd: function () {
      const y = +ring
      sum.add(y < 0 ? qu.tau + y : y)
      this.lineStart = this.lineEnd = this.point = qu.noop
    },
    sphere: function () {
      sum.add(qu.tau)
    },
  }
  function ringStart() {
    stream.point = pointFirst
  }
  function ringEnd() {
    point(lam00, phi00)
  }
  function pointFirst(lambda: number, phi: number) {
    stream.point = point
    ;(lam00 = lambda), (phi00 = phi)
    ;(lambda *= qu.radians), (phi *= qu.radians)
    ;(lam0 = lambda), (cosPhi0 = qu.cos((phi = phi / 2 + qu.quarterPI))), (sinPhi0 = qu.sin(phi))
  }
  function point(lambda: number, phi: number) {
    lambda *= qu.radians
    phi *= qu.radians
    phi = phi / 2 + qu.quarterPI
    const d = lambda - lam0,
      s = d >= 0 ? 1 : -1,
      a = s * d,
      cosPhi = qu.cos(phi),
      sinPhi = qu.sin(phi),
      k = sinPhi0 * sinPhi,
      u = cosPhi0 * cosPhi + k * qu.cos(a),
      v = k * s * qu.sin(a)
    ring.add(qu.atan2(v, u))
    ;(lam0 = lambda), (cosPhi0 = cosPhi), (sinPhi0 = sinPhi)
  }
}
export function bounds(x: qg.ExtFeature | qg.ExtFeatureColl | qg.Geos | qg.ExtCollection): [qt.Point, qt.Span] {
  let i, n, a: qt.Span, b: qt.Span, merged: qt.Span[], deltaMax, delta
  const phi1 = (bounds.lam1 = -(bounds.lam0 = bounds.phi0 = Infinity))
  let spans: qt.Span[] = []
  stream(x, bounds.stream)
  if ((n = spans.length)) {
    spans.sort((a, b) => a[0]! - b[0]!)
    const contains = (s: qt.Span, x: number) => (s[0] <= s[1] ? s[0] <= x && x <= s[1] : x < s[0] || s[1] < x)
    for (i = 1, a = spans[0]!, merged = [a]; i < n; ++i) {
      b = spans[i]!
      if (contains(a, b[0]) || contains(a, b[1])) {
        if (qu.angle(a[0], b[1]) > qu.angle(a[0], a[1])) a[1] = b[1]
        if (qu.angle(b[0], a[1]) > qu.angle(a[0], a[1])) a[0] = b[0]
      } else merged.push((a = b))
    }
    for (deltaMax = -Infinity, n = merged.length - 1, i = 0, a = merged[n]!; i <= n; a = b, ++i) {
      b = merged[i]!
      if ((delta = qu.angle(a[1], b[0])) > deltaMax) (deltaMax = delta), (bounds.lam0 = b[0]), (bounds.lam1 = a[1])
    }
  }
  spans = []
  bounds.range = null
  return bounds.lam0 === Infinity || bounds.phi0 === Infinity
    ? [
        [NaN, NaN],
        [NaN, NaN],
      ]
    : [
        [bounds.lam0, bounds.phi0],
        [bounds.lam1, phi1],
      ]
}
export namespace bounds {
  export let lam0: number,
    phi0: number,
    lam1: number,
    phi1: number, // bounds
    lam2: number, // previous lambda-coordinate
    lam00: number,
    phi00: number, // first point
    p0: qt.Triple | null, // previous point
    sum = new Adder(),
    ranges,
    range: qt.Pair | null
  export const stream = {
    point: point,
    lineStart: lineStart,
    lineEnd: lineEnd,
    polygonStart: function () {
      stream.point = ringPoint
      stream.lineStart = ringStart
      stream.lineEnd = ringEnd
      sum = new Adder()
      area.stream.polygonStart()
    },
    polygonEnd: function () {
      area.stream.polygonEnd()
      stream.point = point
      stream.lineStart = lineStart
      stream.lineEnd = lineEnd
      if (+area.ring < 0) (lam0 = -(lam1 = 180)), (phi0 = -(phi1 = 90))
      else if (+sum > qu.epsilon) phi1 = 90
      else if (+sum < -qu.epsilon) phi0 = -90
      ;(range[0] = lam0), (range[1] = lam1)
    },
    sphere: function () {
      ;(lam0 = -(lam1 = 180)), (phi0 = -(phi1 = 90))
    },
  }
  function point(lambda: number, phi: number) {
    ranges.push((range = [(lam0 = lambda), (lam1 = lambda)]))
    if (phi < phi0) phi0 = phi
    if (phi > phi1) phi1 = phi
  }
  function linePoint(lambda: number, phi: number) {
    const p = cartesian([lambda * qu.radians, phi * qu.radians])
    if (p0) {
      const normal = cartesian.cross(p0, p)
      const equatorial: qt.Triple = [normal[1], -normal[0], 0]
      let inflection = cartesian.cross(equatorial, normal)
      cartesian.normInPlace(inflection)
      inflection = spherical(inflection)
      const d = lambda - lam2,
        s = d > 0 ? 1 : -1,
        antimeridian = qu.abs(d) > 180 ? 1 : 0
      let lambdai = inflection[0] * qu.degrees * s,
        phii
      if (antimeridian ^ (s * lam2 < lambdai && lambdai < s * lambda ? 1 : 0)) {
        phii = inflection[1] * qu.degrees
        if (phii > phi1) phi1 = phii
      } else if (
        ((lambdai = ((lambdai + 360) % 360) - 180), antimeridian ^ (s * lam2 < lambdai && lambdai < s * lambda ? 1 : 0))
      ) {
        phii = -inflection[1] * qu.degrees
        if (phii < phi0) phi0 = phii
      } else {
        if (phi < phi0) phi0 = phi
        if (phi > phi1) phi1 = phi
      }
      if (antimeridian) {
        if (lambda < lam2) {
          if (qu.angle(lam0, lambda) > qu.angle(lam0, lam1)) lam1 = lambda
        } else {
          if (qu.angle(lambda, lam1) > qu.angle(lam0, lam1)) lam0 = lambda
        }
      } else {
        if (lam1 >= lam0) {
          if (lambda < lam0) lam0 = lambda
          if (lambda > lam1) lam1 = lambda
        } else {
          if (lambda > lam2) {
            if (qu.angle(lam0, lambda) > qu.angle(lam0, lam1)) lam1 = lambda
          } else {
            if (qu.angle(lambda, lam1) > qu.angle(lam0, lam1)) lam0 = lambda
          }
        }
      }
    } else ranges.push((range = [(lam0 = lambda), (lam1 = lambda)]))
    if (phi < phi0) phi0 = phi
    if (phi > phi1) phi1 = phi
    ;(p0 = p), (lam2 = lambda)
  }
  function lineStart() {
    stream.point = linePoint
  }
  function lineEnd() {
    ;(range[0] = lam0), (range[1] = lam1)
    stream.point = point
    p0 = null
  }
  function ringPoint(lambda: number, phi: number) {
    if (p0) {
      const d = lambda - lam2
      sum.add(qu.abs(d) > 180 ? d + (d > 0 ? 360 : -360) : d)
    } else {
      ;(lam00 = lambda), (phi00 = phi)
    }
    area.stream.point(lambda, phi)
    linePoint(lambda, phi)
  }
  function ringStart() {
    area.stream.lineStart()
  }
  function ringEnd() {
    ringPoint(lam00, phi00)
    area.stream.lineEnd()
    if (qu.abs(+sum) > qu.epsilon) lam0 = -(lam1 = 180)
    ;(range[0] = lam0), (range[1] = lam1)
    p0 = null
  }
}
export function spherical(cartesian: qt.Triple): qt.Pair {
  return [qu.atan2(cartesian[1], cartesian[0]), qu.asin(cartesian[2])]
}
export function cartesian(spherical: qt.Pair): qt.Triple {
  const lambda = spherical[0],
    phi = spherical[1],
    cosPhi = qu.cos(phi)
  return [cosPhi * qu.cos(lambda), cosPhi * qu.sin(lambda), qu.sin(phi)]
}
export namespace cartesian {
  export function dot(a: qt.Triple, b: qt.Triple) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
  }
  export function cross(a: qt.Triple, b: qt.Triple): qt.Triple {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
  }
  export function addInPlace(a: qt.Triple, b: qt.Triple) {
    a[0] += b[0]
    a[1] += b[1]
    a[2] += b[2]
  }
  export function scale(x: qt.Triple, k: number): qt.Triple {
    return [x[0] * k, x[1] * k, x[2] * k]
  }
  export function normInPlace(x: qt.Triple) {
    const y = qu.sqrt(x[0] * x[0] + x[1] * x[1] + x[2] * x[2])
    x[0] /= y
    x[1] /= y
    x[2] /= y
  }
}
export function centroid(object: qg.ExtFeature | qg.ExtFeatureColl | qg.Geos | qg.ExtCollection): qt.Point {
  centroid.w0 = centroid.w1 = 0
  centroid.p0 = [0, 0, 0]
  centroid.p1 = [0, 0, 0]
  centroid.X2 = new Adder()
  centroid.Y2 = new Adder()
  centroid.Z2 = new Adder()
  stream(object, centroid.stream)
  let x = +centroid.X2,
    y = +centroid.Y2,
    z = +centroid.Z2,
    m = qu.hypot(x, y, z)
  if (m < qu.epsilon2) {
    ;[x, y, z] = centroid.p1
    if (centroid.w1 < qu.epsilon) [x, y, z] = centroid.p0
    m = qu.hypot(x, y, z)
    if (m < qu.epsilon2) return [NaN, NaN]
  }
  return [qu.atan2(y, x) * qu.degrees, qu.asin(z / m) * qu.degrees]
}
export namespace centroid {
  let lam00: number, phi00: number
  export let w0: number, w1: number
  export let p0: qt.Triple, p1: qt.Triple
  export let X2: Adder, Y2: Adder, Z2: Adder
  let p: qt.Triple
  export const stream = {
    sphere: qu.noop,
    point: point,
    lineStart: lineStart,
    lineEnd: lineEnd,
    polygonStart: function () {
      stream.lineStart = ringStart
      stream.lineEnd = ringEnd
    },
    polygonEnd: function () {
      stream.lineStart = lineStart
      stream.lineEnd = lineEnd
    },
  }
  function point(lambda: number, phi: number) {
    ;(lambda *= qu.radians), (phi *= qu.radians)
    const cosPhi = qu.cos(phi)
    pointCartesian(cosPhi * qu.cos(lambda), cosPhi * qu.sin(lambda), qu.sin(phi))
  }
  function pointCartesian(x: number, y: number, z: number) {
    ++w0
    p0[0] += (x - p0[0]) / w0
    p0[1] += (y - p0[1]) / w0
    p0[2] += (z - p0[2]) / w0
  }
  function lineStart() {
    stream.point = linePointFirst
  }
  function linePointFirst(lambda: number, phi: number) {
    ;(lambda *= qu.radians), (phi *= qu.radians)
    const cosPhi = qu.cos(phi)
    p = [cosPhi * qu.cos(lambda), cosPhi * qu.sin(lambda), (p[2] = qu.sin(phi))]
    stream.point = linePoint
    pointCartesian(...p)
  }
  function linePoint(lambda: number, phi: number) {
    ;(lambda *= qu.radians), (phi *= qu.radians)
    const cosPhi = qu.cos(phi),
      x = cosPhi * qu.cos(lambda),
      y = cosPhi * qu.sin(lambda),
      z = qu.sin(phi)
    let w = qu.atan2(
      qu.sqrt((w = p[1] * z - p[2] * y) * w + (w = p[2] * x - p[0] * z) * w + (w = p[0] * y - p[1] * x) * w),
      p[0] * x + p[1] * y + p[2] * z
    )
    w1 += w
    p1[0] += w * (p[0] + (p[0] = x))
    p1[1] += w * (p[1] + (p[1] = y))
    p1[2] += w * (p[2] + (p[2] = z))
    pointCartesian(...p)
  }
  function lineEnd() {
    stream.point = point
  }
  function ringStart() {
    stream.point = ringPointFirst
  }
  function ringEnd() {
    ringPoint(lam00, phi00)
    stream.point = point
  }
  function ringPointFirst(lambda: number, phi: number) {
    ;(lam00 = lambda), (phi00 = phi)
    ;(lambda *= qu.radians), (phi *= qu.radians)
    stream.point = ringPoint
    const cosPhi = qu.cos(phi)
    p = [cosPhi * qu.cos(lambda), cosPhi * qu.sin(lambda), qu.sin(phi)]
    pointCartesian(...p)
  }
  function ringPoint(lambda: number, phi: number) {
    ;(lambda *= qu.radians), (phi *= qu.radians)
    const cosPhi = qu.cos(phi),
      x = cosPhi * qu.cos(lambda),
      y = cosPhi * qu.sin(lambda),
      z = qu.sin(phi),
      cx = p[1] * z - p[2] * y,
      cy = p[2] * x - p[0] * z,
      cz = p[0] * y - p[1] * x,
      m = qu.hypot(cx, cy, cz),
      w = qu.asin(m), // line weight = angle
      v = m && -w / m // area weight multiplier
    X2.add(v * cx)
    Y2.add(v * cy)
    Z2.add(v * cz)
    w1 += w
    p1[0] += w * (p[0] + (p[0] = x))
    p1[1] += w * (p[1] + (p[1] = y))
    p1[2] += w * (p[2] + (p[2] = z))
    pointCartesian(p[0], p[1], p[2])
  }
}
export function circle(): qg.Circle
export function circle<T>(): qg.Circle<any, T>
export function circle<This, T>(): qg.Circle<This, T>
export function circle(): any {
  let center = qu.constant([0, 0] as qt.Point),
    radius = qu.constant(90),
    precision = qu.constant(6),
    ring,
    rotate,
    stream = { point }
  function point(x, y) {
    ring.push((x = rotate(x, y)))
    ;(x[0] *= qu.degrees), (x[1] *= qu.degrees)
  }
  function f(...xs: any) {
    const r = radius(xs) * qu.radians,
      p = precision(xs) * qu.radians
    let c = center(xs),
      ring = []
    rotate = rotateRadians(-c[0] * qu.radians, -c[1] * qu.radians, 0).invert
    circle.stream(stream, r, p, 1)
    c = { type: "Polygon", coordinates: [ring] }
    ring = rotate = null
    return c
  }
  f.center = (x: any) =>
    x === undefined ? center : ((center = typeof x === "function" ? x : qu.constant([+x[0], +x[1]])), f)
  f.radius = (x: any) => (x === undefined ? radius : ((radius = typeof x === "function" ? x : qu.constant(+x)), f))
  f.precision = (x: any) =>
    x === undefined ? precision : ((precision = typeof x === "function" ? x : qu.constant(+x)), f)
  return f
}
export namespace circle {
  export function stream(stream, r: number, delta: number, dir: number, t0?, t1?) {
    if (!delta) return
    const cos = qu.cos(r),
      sin = qu.sin(r),
      step = dir * delta
    if (t0 === undefined) {
      t0 = r + dir * qu.tau
      t1 = r - step / 2
    } else {
      t0 = radius(cos, t0)
      t1 = radius(cos, t1)
      if (dir > 0 ? t0 < t1 : t0 > t1) t0 += dir * qu.tau
    }
    for (let p, t = t0; dir > 0 ? t > t1 : t < t1; t -= step) {
      p = spherical([cos, -sin * qu.cos(t), -sin * qu.sin(t)])
      stream.point(...p)
    }
  }
  function radius(cosRadius: number, x: qt.Point) {
    const y = cartesian(x)
    y[0] -= cosRadius
    cartesian.normInPlace(y)
    const radius = qu.acos(-y[1])
    return ((-y[2] < 0 ? -radius : radius) + qu.tau - qu.epsilon) % qu.tau
  }
}
export function compose(a, b) {
  function f(x, y) {
    return (x = a(x, y)), b(x[0], x[1])
  }
  if (a.invert && b.invert) (f.invert = (x, y) => (x = b.invert(x, y))), x && a.invert(x[0], x[1])
  return f
}
export function contains(x: qg.ExtFeature | qg.ExtFeatureColl | qg.Geos | qg.ExtCollection, p: qt.Point): boolean {
  return (x && contains.objType.hasOwnProperty(x.type) ? contains.objType[x.type] : containsGeometry)(x, p)
}
export namespace contains {
  export const objType = {
    Feature: (x, p) => geo(x.geometry, p),
    FeatureCollection: (x, p) => {
      const xs = x.features,
        n = xs.length
      let i = -1
      while (++i < n) if (geo(xs[i].geometry, p)) return true
      return false
    },
  }
  const geoType = {
    Sphere: () => true,
    Point: (x, p) => p(x.coordinates, p),
    MultiPoint: (x, p) => {
      const xs = x.coordinates,
        n = xs.length
      let i = -1
      while (++i < n) if (p(xs[i], p)) return true
      return false
    },
    LineString: (x, p) => line(x.coordinates, p),
    MultiLineString: (x, p) => {
      const xs = x.coordinates,
        n = xs.length
      let i = -1
      while (++i < n) if (line(xs[i], p)) return true
      return false
    },
    Polygon: (x, p) => polygon(x.coordinates, p),
    MultiPolygon: (x, p) => {
      const xs = x.coordinates,
        n = xs.length
      let i = -1
      while (++i < n) if (polygon(xs[i], p)) return true
      return false
    },
    GeometryCollection: (x, p) => {
      const xs = x.geometries,
        n = xs.length
      let i = -1
      while (++i < n) if (geo(xs[i], p)) return true
      return false
    },
  }
  function geo(x, p) {
    return x && geoType.hasOwnProperty(x.type) ? geoType[x.type](x, p) : false
  }
  function point(xs, p) {
    return distance(xs, p) === 0
  }
  function line(xs, p) {
    let ao, bo, ab
    for (let i = 0, n = xs.length; i < n; i++) {
      bo = distance(xs[i], p)
      if (bo === 0) return true
      if (i > 0) {
        ab = distance(xs[i], xs[i - 1])
        if (ab > 0 && ao <= ab && bo <= ab && (ao + bo - ab) * (1 - qu.pow((ao - bo) / ab, 2)) < qu.epsilon2 * ab)
          return true
      }
      ao = bo
    }
    return false
  }
  function polygon(xs, p: qt.Point) {
    const pointRadians = (x: qt.Point) => [x[0] * qu.radians, x[1] * qu.radians]
    const ringRadians = x => ((x = xs.map(pointRadians)), xs.pop(), x)
    return !!polygonContains(xs.map(ringRadians), pointRadians(p))
  }
}
const coordinates = [null, null],
  object = { type: "LineString", coordinates }
export function distance(a: qt.Point, b: qt.Point): number {
  coordinates[0] = a
  coordinates[1] = b
  return length(object)
}
export function graticule(): qg.Graticule {
  let x1,
    x0,
    X1,
    X0,
    y1,
    y0,
    Y1,
    Y0,
    dx = 10,
    dy = dx,
    DX = 90,
    DY = 360,
    x,
    y,
    X,
    Y,
    precision = 2.5
  function f() {
    return { type: "MultiLineString", coordinates: lines() }
  }
  function lines() {
    return range(qu.ceil(X0 / DX) * DX, X1, DX)
      .map(X)
      .concat(range(qu.ceil(Y0 / DY) * DY, Y1, DY).map(Y))
      .concat(
        range(qu.ceil(x0 / dx) * dx, x1, dx)
          .filter(function (x) {
            return qu.abs(x % DX) > qu.epsilon
          })
          .map(x)
      )
      .concat(
        range(qu.ceil(y0 / dy) * dy, y1, dy)
          .filter(function (y) {
            return qu.abs(y % DY) > qu.epsilon
          })
          .map(y)
      )
  }
  f.lines = () =>
    lines().map(coordinates => ({
      type: "LineString",
      coordinates,
    }))
  f.outline = () => ({
    type: "Polygon",
    coordinates: [X(X0).concat(Y(Y1).slice(1), X(X1).reverse().slice(1), Y(Y0).reverse().slice(1))],
  })
  f.extent = (x: any) => (x === undefined ? f.extentMinor() : f.extentMajor(x).extentMinor(x))
  f.extentMajor = (x: any) => {
    if (x === undefined)
      return [
        [X0, Y0],
        [X1, Y1],
      ]
    ;(X0 = +x[0][0]), (X1 = +x[1][0])
    ;(Y0 = +x[0][1]), (Y1 = +x[1][1])
    if (X0 > X1) (x = X0), (X0 = X1), (X1 = x)
    if (Y0 > Y1) (x = Y0), (Y0 = Y1), (Y1 = x)
    return f.precision(precision)
  }
  f.extentMinor = (x?: any) => {
    if (x === undefined)
      return [
        [x0, y0],
        [x1, y1],
      ]
    ;(x0 = +x[0][0]), (x1 = +x[1][0])
    ;(y0 = +x[0][1]), (y1 = +x[1][1])
    if (x0 > x1) (x = x0), (x0 = x1), (x1 = x)
    if (y0 > y1) (x = y0), (y0 = y1), (y1 = x)
    return f.precision(precision)
  }
  f.step = (x: any) => (x === undefined ? f.stepMinor() : f.stepMajor(x).stepMinor(x))
  f.stepMajor = (x: any) => (x === undefined ? [DX, DY] : ((DX = +x[0]), (DY = +x[1]), f))
  f.stepMinor = (x?: any) => (x === undefined ? [dx, dy] : ((dx = +x[0]), (dy = +x[1]), f))
  function graticuleX(y0, y1, dy) {
    const ys = range(y0, y1 - qu.epsilon, dy).concat(y1)
    return x => ys.map(y => [x, y])
  }
  function graticuleY(x0, x1, dx) {
    const ys = range(x0, x1 - qu.epsilon, dx).concat(x1)
    return y => ys.map(x => [x, y])
  }
  f.precision = (x: any) => {
    if (!arguments.length) return precision
    precision = +x
    x = graticuleX(y0, y1, 90)
    y = graticuleY(x0, x1, precision)
    X = graticuleX(Y0, Y1, 90)
    Y = graticuleY(X0, X1, precision)
    return f
  }
  return f
    .extentMajor([
      [-180, -90 + qu.epsilon],
      [180, 90 - qu.epsilon],
    ])
    .extentMinor([
      [-180, -80 - qu.epsilon],
      [180, 80 + qu.epsilon],
    ])
}
export function graticule10(): GeoJSON.MultiLineString {
  return graticule()()
}
export function interpolate(a: qt.Point, b: qt.Point): (t: number) => qt.Point {
  const x0 = a[0] * qu.radians,
    y0 = a[1] * qu.radians,
    x1 = b[0] * qu.radians,
    y1 = b[1] * qu.radians,
    cy0 = qu.cos(y0),
    sy0 = qu.sin(y0),
    cy1 = qu.cos(y1),
    sy1 = qu.sin(y1),
    kx0 = cy0 * qu.cos(x0),
    ky0 = cy0 * qu.sin(x0),
    kx1 = cy1 * qu.cos(x1),
    ky1 = cy1 * qu.sin(x1),
    d = 2 * qu.asin(qu.sqrt(haversin(y1 - y0) + cy0 * cy1 * haversin(x1 - x0))),
    k = qu.sin(d)
  const f = d
    ? function (t) {
        const B = qu.sin((t *= d)) / k,
          A = qu.sin(d - t) / k,
          x = A * kx0 + B * kx1,
          y = A * ky0 + B * ky1,
          z = A * sy0 + B * sy1
        return [qu.atan2(y, x) * qu.degrees, qu.atan2(z, qu.sqrt(x * x + y * y)) * qu.degrees]
      }
    : function () {
        return [x0 * qu.degrees, y0 * qu.degrees]
      }
  f.distance = d
  return f
}
export function length(x: qg.ExtFeature | qg.ExtFeatureColl | qg.Geos | qg.ExtCollection): number {
  length.sum = new Adder()
  stream(x, length.stream)
  return +length.sum
}
export namespace length {
  export let sum: Adder
  let lam0: number, sinPhi0: number, cosPhi0: number
  export const stream = {
    sphere: qu.noop,
    point: qu.noop,
    lineStart: lineStart,
    lineEnd: qu.noop,
    polygonStart: qu.noop,
    polygonEnd: qu.noop,
  }
  function lineStart() {
    stream.point = pointFirst
    stream.lineEnd = lineEnd
  }
  function lineEnd() {
    stream.point = stream.lineEnd = qu.noop
  }
  function pointFirst(lambda: number, phi: number) {
    ;(lambda *= qu.radians), (phi *= qu.radians)
    ;(lam0 = lambda), (sinPhi0 = qu.sin(phi)), (cosPhi0 = qu.cos(phi))
    stream.point = point
  }
  function point(lambda: number, phi: number) {
    ;(lambda *= qu.radians), (phi *= qu.radians)
    const sinPhi = qu.sin(phi),
      cosPhi = qu.cos(phi),
      d = qu.abs(lambda - lam0),
      cosD = qu.cos(d),
      sinD = qu.sin(d),
      x = cosPhi * sinD,
      y = cosPhi0 * sinPhi - sinPhi0 * cosPhi * cosD,
      z = sinPhi0 * sinPhi + cosPhi0 * cosPhi * cosD
    sum.add(qu.atan2(qu.sqrt(x * x + y * y), z))
    ;(lam0 = lambda), (sinPhi0 = sinPhi), (cosPhi0 = cosPhi)
  }
}
export const sign = qu.sign || (x => (x > 0 ? 1 : x < 0 ? -1 : 0))
export const haversin = (x: number) => (x = qu.sin(x / 2)) * x

export function pointEqual(a: qt.Point, b: qt.Point) {
  return qu.abs(a[0] - b[0]) < qu.epsilon && qu.abs(a[1] - b[1]) < qu.epsilon
}
function longitude(x: qt.Point) {
  return qu.abs(x[0]) <= qu.PI ? x[0] : sign(x[0]) * (((qu.abs(x[0]) + qu.PI) % qu.tau) - qu.PI)
}
export function polygonContains(polygon, point) {
  let lambda = longitude(point),
    phi = point[1],
    sinPhi = qu.sin(phi),
    normal = [qu.sin(lambda), -qu.cos(lambda), 0],
    angle = 0,
    winding = 0
  const sum = new Adder()
  if (sinPhi === 1) phi = qu.halfPI + qu.epsilon
  else if (sinPhi === -1) phi = -qu.halfPI - qu.epsilon
  for (let i = 0, n = polygon.length; i < n; ++i) {
    if (!(m = (ring = polygon[i]).length)) continue
    let ring,
      m,
      point0 = ring[m - 1],
      lam0 = longitude(point0),
      phi0 = point0[1] / 2 + qu.quarterPI,
      sinPhi0 = qu.sin(phi0),
      cosPhi0 = qu.cos(phi0)
    for (let j = 0; j < m; ++j, lam0 = lam1, sinPhi0 = sinPhi1, cosPhi0 = cosPhi1, point0 = point1) {
      let point1 = ring[j],
        lam1 = longitude(point1),
        phi1 = point1[1] / 2 + qu.quarterPI,
        sinPhi1 = qu.sin(phi1),
        cosPhi1 = qu.cos(phi1),
        delta = lam1 - lam0,
        sign = delta >= 0 ? 1 : -1,
        absDelta = sign * delta,
        antimeridian = absDelta > qu.PI,
        k = sinPhi0 * sinPhi1
      sum.add(qu.atan2(k * sign * qu.sin(absDelta), cosPhi0 * cosPhi1 + k * qu.cos(absDelta)))
      angle += antimeridian ? delta + sign * qu.tau : delta
      if (antimeridian ^ (lam0 >= lambda) ^ (lam1 >= lambda)) {
        const arc = cartesian.cross(cartesian(point0), cartesian(point1))
        cartesian.normInPlace(arc)
        const intersection = cartesian.cross(normal, arc)
        cartesian.normInPlace(intersection)
        const phiArc = (antimeridian ^ (delta >= 0) ? -1 : 1) * qu.asin(intersection[2])
        if (phi > phiArc || (phi === phiArc && (arc[0] || arc[1]))) {
          winding += antimeridian ^ (delta >= 0) ? 1 : -1
        }
      }
    }
  }
  return (angle < -qu.epsilon || (angle < qu.epsilon && sum < -qu.epsilon2)) ^ (winding & 1)
}
export function rotateRadians(dLam: number, dPhi: number, dGamma: number) {
  return (dLam %= qu.tau)
    ? dPhi || dGamma
      ? compose(lambda(dLam), phiGamma(dPhi, dGamma))
      : lambda(dLam)
    : dPhi || dGamma
    ? phiGamma(dPhi, dGamma)
    : identity
}
export function rotation(angles: qt.Pair | [number, number, number]): qg.Rotation {
  rotate = rotateRadians(rotate[0] * qu.radians, rotate[1] * qu.radians, rotate.length > 2 ? rotate[2] * qu.radians : 0)
  function forward(coordinates) {
    coordinates = rotate(coordinates[0] * qu.radians, coordinates[1] * qu.radians)
    return (coordinates[0] *= qu.degrees), (coordinates[1] *= qu.degrees), coordinates
  }
  forward.invert = function (coordinates) {
    coordinates = rotate.invert(coordinates[0] * qu.radians, coordinates[1] * qu.radians)
    return (coordinates[0] *= qu.degrees), (coordinates[1] *= qu.degrees), coordinates
  }
  return forward
}
export namespace rotation {
  function identity(lambda: number, phi: number) {
    if (qu.abs(lambda) > qu.PI) lambda -= qu.round(lambda / qu.tau) * qu.tau
    return [lambda, phi]
  }
  identity.invert = identity
  function lambda(deltaLambda) {
    function forward(deltaLambda) {
      return function (lambda, phi) {
        lambda += deltaLambda
        if (qu.abs(lambda) > qu.PI) lambda -= qu.round(lambda / qu.tau) * qu.tau
        return [lambda, phi]
      }
    }
    const f = forward(deltaLambda)
    f.invert = forward(-deltaLambda)
    return f
  }
  function phiGamma(dPhi: number, dGamma: number) {
    const cosDeltaPhi = qu.cos(dPhi),
      sinDeltaPhi = qu.sin(dPhi),
      cosDeltaGamma = qu.cos(dGamma),
      sinDeltaGamma = qu.sin(dGamma)
    function f(lambda: number, phi: number) {
      const cosPhi = qu.cos(phi),
        x = qu.cos(lambda) * cosPhi,
        y = qu.sin(lambda) * cosPhi,
        z = qu.sin(phi),
        k = z * cosDeltaPhi + x * sinDeltaPhi
      return [
        qu.atan2(y * cosDeltaGamma - k * sinDeltaGamma, x * cosDeltaPhi - z * sinDeltaPhi),
        qu.asin(k * cosDeltaGamma + y * sinDeltaGamma),
      ]
    }
    f.invert = function (lambda: number, phi: number) {
      const cosPhi = qu.cos(phi),
        x = qu.cos(lambda) * cosPhi,
        y = qu.sin(lambda) * cosPhi,
        z = qu.sin(phi),
        k = z * cosDeltaGamma - y * sinDeltaGamma
      return [
        qu.atan2(y * cosDeltaGamma + z * sinDeltaGamma, x * cosDeltaPhi + k * sinDeltaPhi),
        qu.asin(k * cosDeltaPhi - x * sinDeltaPhi),
      ]
    }
    return f
  }
}
export function stream(x: qg.ExtFeature | qg.ExtFeatureColl | qg.Geos | qg.ExtCollection, s: qg.Stream) {
  if (x && stream.objType.hasOwnProperty(x.type)) stream.objType[x.type](x, s)
  else stream.geo(x, s)
}
export namespace stream {
  export function geo(x, s: qg.Stream) {
    if (x && geoType.hasOwnProperty(x.type)) geoType[x.type](x, s)
  }
  export const objType = {
    Feature: (x, s) => geo(x.geometry, s),
    FeatureCollection: (x, s) => {
      const xs = x.features,
        n = xs.length
      let i = -1
      while (++i < n) geo(xs[i].geometry, s)
    },
  }
  const geoType = {
    Sphere: (_, s) => s.sphere(),
    Point: (x, s) => {
      x = x.coordinates
      s.point(x[0], x[1], x[2])
    },
    MultiPoint: (x, s) => {
      const coordinates = x.coordinates,
        n = coordinates.length
      let i = -1
      while (++i < n) (x = coordinates[i]), s.point(x[0], x[1], x[2])
    },
    LineString: (x, s) => line(x.coordinates, s, 0),
    MultiLineString: (x, s) => {
      const xs = x.coordinates,
        n = xs.length
      let i = -1
      while (++i < n) line(xs[i], s, 0)
    },
    Polygon: (x, s) => polygon(x.coordinates, s),
    MultiPolygon: (x, s) => {
      const xs = x.coordinates,
        n = xs.length
      let i = -1
      while (++i < n) polygon(xs[i], s)
    },
    GeometryCollection: (x, s) => {
      const xs = x.geometries,
        n = xs.length
      let i = -1
      while (++i < n) geo(xs[i], s)
    },
  }
  function line(xs, stream, closed) {
    const n = xs.length - closed
    let i = -1,
      x
    stream.lineStart()
    while (++i < n) (x = xs[i]), stream.point(x[0], x[1], x[2])
    stream.lineEnd()
  }
  function polygon(xs, stream) {
    const n = xs.length
    let i = -1
    stream.polygonStart()
    while (++i < n) line(xs[i], stream, 1)
    stream.polygonEnd()
  }
}
export function transform<T extends qg.TransformProto>(x: T): { stream(s: qg.Stream): T & qg.Stream } {
  return {
    stream: transformer(x),
  }
}
export function transformer(xs) {
  return x => {
    const s = new TransformStream()
    for (const k in xs) s[k] = xs[k]
    s.stream = x
    return s
  }
}
class TransformStream {
  stream
  point(x, y) {
    this.stream.point(x, y)
  }
  sphere() {
    this.stream.sphere()
  }
  lineStart() {
    this.stream.lineStart()
  }
  lineEnd() {
    this.stream.lineEnd()
  }
  polygonStart() {
    this.stream.polygonStart()
  }
  polygonEnd() {
    this.stream.polygonEnd()
  }
}

export namespace clip {
  export function clipAntimeridian(stream: qg.Stream): qg.Stream {
    return clip(
      function () {
        return true
      },
      clipAntimeridianLine,
      clipAntimeridianInterpolate,
      [-pi, -halfPi]
    )
  }
  function clipAntimeridianLine(stream) {
    let lam0 = NaN,
      phi0 = NaN,
      sign0 = NaN,
      clean // no intersections
    return {
      lineStart: function () {
        stream.lineStart()
        clean = 1
      },
      point: function (lam1, phi1) {
        const sign1 = lam1 > 0 ? pi : -pi,
          delta = qu.abs(lam1 - lam0)
        if (qu.abs(delta - pi) < epsilon) {
          stream.point(lam0, (phi0 = (phi0 + phi1) / 2 > 0 ? halfPi : -halfPi))
          stream.point(sign0, phi0)
          stream.lineEnd()
          stream.lineStart()
          stream.point(sign1, phi0)
          stream.point(lam1, phi0)
          clean = 0
        } else if (sign0 !== sign1 && delta >= pi) {
          if (qu.abs(lam0 - sign0) < epsilon) lam0 -= sign0 * epsilon // handle degeneracies
          if (qu.abs(lam1 - sign1) < epsilon) lam1 -= sign1 * epsilon
          phi0 = clipAntimeridianIntersect(lam0, phi0, lam1, phi1)
          stream.point(sign0, phi0)
          stream.lineEnd()
          stream.lineStart()
          stream.point(sign1, phi0)
          clean = 0
        }
        stream.point((lam0 = lam1), (phi0 = phi1))
        sign0 = sign1
      },
      lineEnd: function () {
        stream.lineEnd()
        lam0 = phi0 = NaN
      },
      clean: function () {
        return 2 - clean // if intersections, rejoin first and last segments
      },
    }
  }
  function clipAntimeridianIntersect(lam0, phi0, lam1, phi1) {
    let cosPhi0,
      cosPhi1,
      sinLambda0Lambda1 = sin(lam0 - lam1)
    return qu.abs(sinLambda0Lambda1) > epsilon
      ? atan(
          (sin(phi0) * (cosPhi1 = cos(phi1)) * sin(lam1) - sin(phi1) * (cosPhi0 = cos(phi0)) * sin(lam0)) /
            (cosPhi0 * cosPhi1 * sinLambda0Lambda1)
        )
      : (phi0 + phi1) / 2
  }
  function clipAntimeridianInterpolate(from, to, direction, stream) {
    let phi
    if (from === null) {
      phi = direction * halfPi
      stream.point(-pi, phi)
      stream.point(0, phi)
      stream.point(pi, phi)
      stream.point(pi, 0)
      stream.point(pi, -phi)
      stream.point(0, -phi)
      stream.point(-pi, -phi)
      stream.point(-pi, 0)
      stream.point(-pi, phi)
    } else if (qu.abs(from[0] - to[0]) > epsilon) {
      const lambda = from[0] < to[0] ? pi : -pi
      phi = (direction * lambda) / 2
      stream.point(-lambda, phi)
      stream.point(0, phi)
      stream.point(lambda, phi)
    } else {
      stream.point(to[0], to[1])
    }
  }
  export function buffer() {
    let lines = [],
      line
    return {
      point: function (x, y, m) {
        line.push([x, y, m])
      },
      lineStart: function () {
        lines.push((line = []))
      },
      lineEnd: qu.noop,
      rejoin: function () {
        if (lines.length > 1) lines.push(lines.pop().concat(lines.shift()))
      },
      result: function () {
        const result = lines
        lines = []
        line = null
        return result
      },
    }
  }
  export function circle(radius: number): (x: qg.Stream) => qg.Stream {
    const cr = cos(radius),
      delta = 6 * radians,
      smallRadius = cr > 0,
      notHemisphere = qu.abs(cr) > epsilon // TODO optimise for this common case
    function interpolate(from, to, direction, stream) {
      circleStream(stream, radius, delta, direction, from, to)
    }
    function visible(lambda, phi) {
      return cos(lambda) * cos(phi) > cr
    }
    function clipLine(stream) {
      let point0, // previous point
        c0, // code for previous point
        v0, // visibility of previous point
        v00, // visibility of first point
        clean // no intersections
      return {
        lineStart: function () {
          v00 = v0 = false
          clean = 1
        },
        point: function (lambda, phi) {
          let point1 = [lambda, phi],
            point2,
            v = visible(lambda, phi),
            c = smallRadius ? (v ? 0 : code(lambda, phi)) : v ? code(lambda + (lambda < 0 ? pi : -pi), phi) : 0
          if (!point0 && (v00 = v0 = v)) stream.lineStart()
          if (v !== v0) {
            point2 = intersect(point0, point1)
            if (!point2 || pointEqual(point0, point2) || pointEqual(point1, point2)) point1[2] = 1
          }
          if (v !== v0) {
            clean = 0
            if (v) {
              stream.lineStart()
              point2 = intersect(point1, point0)
              stream.point(point2[0], point2[1])
            } else {
              point2 = intersect(point0, point1)
              stream.point(point2[0], point2[1], 2)
              stream.lineEnd()
            }
            point0 = point2
          } else if (notHemisphere && point0 && smallRadius ^ v) {
            let t
            if (!(c & c0) && (t = intersect(point1, point0, true))) {
              clean = 0
              if (smallRadius) {
                stream.lineStart()
                stream.point(t[0][0], t[0][1])
                stream.point(t[1][0], t[1][1])
                stream.lineEnd()
              } else {
                stream.point(t[1][0], t[1][1])
                stream.lineEnd()
                stream.lineStart()
                stream.point(t[0][0], t[0][1], 3)
              }
            }
          }
          if (v && (!point0 || !pointEqual(point0, point1))) {
            stream.point(point1[0], point1[1])
          }
          ;(point0 = point1), (v0 = v), (c0 = c)
        },
        lineEnd: function () {
          if (v0) stream.lineEnd()
          point0 = null
        },
        clean: function () {
          return clean | ((v00 && v0) << 1)
        },
      }
    }
    function intersect(a, b, two) {
      const pa = cartesian(a),
        pb = cartesian(b)
      const n1 = [1, 0, 0], // normal
        n2 = cartesian.cross(pa, pb),
        n2n2 = cartesian.dot(n2, n2),
        n1n2 = n2[0], // cartesianDot(n1, n2),
        determinant = n2n2 - n1n2 * n1n2
      if (!determinant) return !two && a
      const c1 = (cr * n2n2) / determinant,
        c2 = (-cr * n1n2) / determinant,
        n1xn2 = cartesian.cross(n1, n2),
        A = scale(n1, c1),
        B = scale(n2, c2)
      cartesian.addInPlace(A, B)
      const u = n1xn2,
        w = cartesian.dot(A, u),
        uu = cartesian.dot(u, u),
        t2 = w * w - uu * (cartesian.dot(A, A) - 1)
      if (t2 < 0) return
      let t = sqrt(t2),
        q = scale(u, (-w - t) / uu)
      cartesian.addInPlace(q, A)
      q = spherical(q)
      if (!two) return q
      let lam0 = a[0],
        lam1 = b[0],
        phi0 = a[1],
        phi1 = b[1],
        z
      if (lam1 < lam0) (z = lam0), (lam0 = lam1), (lam1 = z)
      const delta = lam1 - lam0,
        polar = qu.abs(delta - pi) < epsilon,
        meridian = polar || delta < epsilon
      if (!polar && phi1 < phi0) (z = phi0), (phi0 = phi1), (phi1 = z)
      if (
        meridian
          ? polar
            ? (phi0 + phi1 > 0) ^ (q[1] < (qu.abs(q[0] - lam0) < epsilon ? phi0 : phi1))
            : phi0 <= q[1] && q[1] <= phi1
          : (delta > pi) ^ (lam0 <= q[0] && q[0] <= lam1)
      ) {
        const q1 = scale(u, (-w + t) / uu)
        cartesian.addInPlace(q1, A)
        return [q, spherical(q1)]
      }
    }
    function code(lambda, phi) {
      let r = smallRadius ? radius : pi - radius,
        code = 0
      if (lambda < -r) code |= 1 // left
      else if (lambda > r) code |= 2 // right
      if (phi < -r) code |= 4 // below
      else if (phi > r) code |= 8 // above
      return code
    }
    return clip(visible, clipLine, interpolate, smallRadius ? [0, -radius] : [-pi, radius - pi])
  }
  export function extent() {
    let x0 = 0,
      y0 = 0,
      x1 = 960,
      y1 = 500,
      cache,
      cacheStream,
      clip
    return (clip = {
      stream: function (stream) {
        return cache && cacheStream === stream ? cache : (cache = clipRectangle(x0, y0, x1, y1)((cacheStream = stream)))
      },
      extent: function (_) {
        return arguments.length
          ? ((x0 = +_[0][0]), (y0 = +_[0][1]), (x1 = +_[1][0]), (y1 = +_[1][1]), (cache = cacheStream = null), clip)
          : [
              [x0, y0],
              [x1, y1],
            ]
      },
    })
  }
  export function clip(pointVisible, clipLine, interpolate, start) {
    return function (sink) {
      let line = clipLine(sink),
        ringBuffer = clipBuffer(),
        ringSink = clipLine(ringBuffer),
        polygonStarted = false,
        polygon,
        segments,
        ring
      let clip = {
        point: point,
        lineStart: lineStart,
        lineEnd: lineEnd,
        polygonStart: function () {
          clip.point = pointRing
          clip.lineStart = ringStart
          clip.lineEnd = ringEnd
          segments = []
          polygon = []
        },
        polygonEnd: function () {
          clip.point = point
          clip.lineStart = lineStart
          clip.lineEnd = lineEnd
          segments = merge(segments)
          const startInside = polygonContains(polygon, start)
          if (segments.length) {
            if (!polygonStarted) sink.polygonStart(), (polygonStarted = true)
            clipRejoin(segments, compareIntersection, startInside, interpolate, sink)
          } else if (startInside) {
            if (!polygonStarted) sink.polygonStart(), (polygonStarted = true)
            sink.lineStart()
            interpolate(null, null, 1, sink)
            sink.lineEnd()
          }
          if (polygonStarted) sink.polygonEnd(), (polygonStarted = false)
          segments = polygon = null
        },
        sphere: function () {
          sink.polygonStart()
          sink.lineStart()
          interpolate(null, null, 1, sink)
          sink.lineEnd()
          sink.polygonEnd()
        },
      }
      function point(lambda, phi) {
        if (pointVisible(lambda, phi)) sink.point(lambda, phi)
      }
      function pointLine(lambda, phi) {
        line.point(lambda, phi)
      }
      function lineStart() {
        clip.point = pointLine
        line.lineStart()
      }
      function lineEnd() {
        clip.point = point
        line.lineEnd()
      }
      function pointRing(lambda, phi) {
        ring.push([lambda, phi])
        ringSink.point(lambda, phi)
      }
      function ringStart() {
        ringSink.lineStart()
        ring = []
      }
      function ringEnd() {
        pointRing(ring[0][0], ring[0][1])
        ringSink.lineEnd()
        let clean = ringSink.clean(),
          ringSegments = ringBuffer.result(),
          i,
          n = ringSegments.length,
          m,
          segment,
          point
        ring.pop()
        polygon.push(ring)
        ring = null
        if (!n) return
        if (clean & 1) {
          segment = ringSegments[0]
          if ((m = segment.length - 1) > 0) {
            if (!polygonStarted) sink.polygonStart(), (polygonStarted = true)
            sink.lineStart()
            for (i = 0; i < m; ++i) sink.point((point = segment[i])[0], point[1])
            sink.lineEnd()
          }
          return
        }
        if (n > 1 && clean & 2) ringSegments.push(ringSegments.pop().concat(ringSegments.shift()))
        segments.push(ringSegments.filter(validSegment))
      }
      return clip
    }
  }
  function validSegment(segment) {
    return segment.length > 1
  }
  function compareIntersection(a, b) {
    return (
      ((a = a.x)[0] < 0 ? a[1] - halfPi - epsilon : halfPi - a[1]) -
      ((b = b.x)[0] < 0 ? b[1] - halfPi - epsilon : halfPi - b[1])
    )
  }
  export function line(a, b, x0, y0, x1, y1) {
    let ax = a[0],
      ay = a[1],
      bx = b[0],
      by = b[1],
      t0 = 0,
      t1 = 1,
      dx = bx - ax,
      dy = by - ay,
      r
    r = x0 - ax
    if (!dx && r > 0) return
    r /= dx
    if (dx < 0) {
      if (r < t0) return
      if (r < t1) t1 = r
    } else if (dx > 0) {
      if (r > t1) return
      if (r > t0) t0 = r
    }
    r = x1 - ax
    if (!dx && r < 0) return
    r /= dx
    if (dx < 0) {
      if (r > t1) return
      if (r > t0) t0 = r
    } else if (dx > 0) {
      if (r < t0) return
      if (r < t1) t1 = r
    }
    r = y0 - ay
    if (!dy && r > 0) return
    r /= dy
    if (dy < 0) {
      if (r < t0) return
      if (r < t1) t1 = r
    } else if (dy > 0) {
      if (r > t1) return
      if (r > t0) t0 = r
    }
    r = y1 - ay
    if (!dy && r < 0) return
    r /= dy
    if (dy < 0) {
      if (r > t1) return
      if (r > t0) t0 = r
    } else if (dy > 0) {
      if (r < t0) return
      if (r < t1) t1 = r
    }
    if (t0 > 0) (a[0] = ax + t0 * dx), (a[1] = ay + t0 * dy)
    if (t1 < 1) (b[0] = ax + t1 * dx), (b[1] = ay + t1 * dy)
    return true
  }
  const clipMax = 1e9,
    clipMin = -clipMax
  export function clipRectangle(x0: number, y0: number, x1: number, y1: number): (x: qg.Stream) => qg.Stream {
    function visible(x, y) {
      return x0 <= x && x <= x1 && y0 <= y && y <= y1
    }
    function interpolate(from, to, direction, stream) {
      let a = 0,
        a1 = 0
      if (
        from === null ||
        (a = corner(from, direction)) !== (a1 = corner(to, direction)) ||
        (comparePoint(from, to) < 0) ^ (direction > 0)
      ) {
        do stream.point(a === 0 || a === 3 ? x0 : x1, a > 1 ? y1 : y0)
        while ((a = (a + direction + 4) % 4) !== a1)
      } else {
        stream.point(to[0], to[1])
      }
    }
    function corner(p, direction) {
      return qu.abs(p[0] - x0) < epsilon
        ? direction > 0
          ? 0
          : 3
        : qu.abs(p[0] - x1) < epsilon
        ? direction > 0
          ? 2
          : 1
        : qu.abs(p[1] - y0) < epsilon
        ? direction > 0
          ? 1
          : 0
        : direction > 0
        ? 3
        : 2 // qu.abs(p[1] - y1) < epsilon
    }
    function compareIntersection(a, b) {
      return comparePoint(a.x, b.x)
    }
    function comparePoint(a, b) {
      const ca = corner(a, 1),
        cb = corner(b, 1)
      return ca !== cb
        ? ca - cb
        : ca === 0
        ? b[1] - a[1]
        : ca === 1
        ? a[0] - b[0]
        : ca === 2
        ? a[1] - b[1]
        : b[0] - a[0]
    }
    return function (stream) {
      let activeStream = stream,
        bufferStream = clipBuffer(),
        segments,
        polygon,
        ring,
        x__,
        y__,
        v__, // first point
        x_,
        y_,
        v_, // previous point
        first,
        clean
      const clipStream = {
        point: point,
        lineStart: lineStart,
        lineEnd: lineEnd,
        polygonStart: polygonStart,
        polygonEnd: polygonEnd,
      }
      function point(x, y) {
        if (visible(x, y)) activeStream.point(x, y)
      }
      function polygonInside() {
        let winding = 0
        for (let i = 0, n = polygon.length; i < n; ++i) {
          for (
            var ring = polygon[i], j = 1, m = ring.length, point = ring[0], a0, a1, b0 = point[0], b1 = point[1];
            j < m;
            ++j
          ) {
            ;(a0 = b0), (a1 = b1), (point = ring[j]), (b0 = point[0]), (b1 = point[1])
            if (a1 <= y1) {
              if (b1 > y1 && (b0 - a0) * (y1 - a1) > (b1 - a1) * (x0 - a0)) ++winding
            } else {
              if (b1 <= y1 && (b0 - a0) * (y1 - a1) < (b1 - a1) * (x0 - a0)) --winding
            }
          }
        }
        return winding
      }
      function polygonStart() {
        ;(activeStream = bufferStream), (segments = []), (polygon = []), (clean = true)
      }
      function polygonEnd() {
        const startInside = polygonInside(),
          cleanInside = clean && startInside,
          visible = (segments = merge(segments)).length
        if (cleanInside || visible) {
          stream.polygonStart()
          if (cleanInside) {
            stream.lineStart()
            interpolate(null, null, 1, stream)
            stream.lineEnd()
          }
          if (visible) {
            clipRejoin(segments, compareIntersection, startInside, interpolate, stream)
          }
          stream.polygonEnd()
        }
        ;(activeStream = stream), (segments = polygon = ring = null)
      }
      function lineStart() {
        clipStream.point = linePoint
        if (polygon) polygon.push((ring = []))
        first = true
        v_ = false
        x_ = y_ = NaN
      }
      function lineEnd() {
        if (segments) {
          linePoint(x__, y__)
          if (v__ && v_) bufferStream.rejoin()
          segments.push(bufferStream.result())
        }
        clipStream.point = point
        if (v_) activeStream.lineEnd()
      }
      function linePoint(x, y) {
        const v = visible(x, y)
        if (polygon) ring.push([x, y])
        if (first) {
          ;(x__ = x), (y__ = y), (v__ = v)
          first = false
          if (v) {
            activeStream.lineStart()
            activeStream.point(x, y)
          }
        } else {
          if (v && v_) activeStream.point(x, y)
          else {
            const a = [(x_ = qu.max(clipMin, qu.min(clipMax, x_))), (y_ = qu.max(clipMin, qu.min(clipMax, y_)))],
              b = [(x = qu.max(clipMin, qu.min(clipMax, x))), (y = qu.max(clipMin, qu.min(clipMax, y)))]
            if (clipLine(a, b, x0, y0, x1, y1)) {
              if (!v_) {
                activeStream.lineStart()
                activeStream.point(a[0], a[1])
              }
              activeStream.point(b[0], b[1])
              if (!v) activeStream.lineEnd()
              clean = false
            } else if (v) {
              activeStream.lineStart()
              activeStream.point(x, y)
              clean = false
            }
          }
        }
        ;(x_ = x), (y_ = y), (v_ = v)
      }
      return clipStream
    }
  }
  function Intersection(point, points, other, entry) {
    this.x = point
    this.z = points
    this.o = other // another intersection
    this.e = entry // is an entry?
    this.v = false // visited
    this.n = this.p = null // next & previous
  }
  export function rejoin(segments, compareIntersection, startInside, interpolate, stream) {
    let subject = [],
      clip = [],
      i,
      n
    segments.forEach(function (segment) {
      if ((n = segment.length - 1) <= 0) return
      let n,
        p0 = segment[0],
        p1 = segment[n],
        x
      if (pointEqual(p0, p1)) {
        if (!p0[2] && !p1[2]) {
          stream.lineStart()
          for (i = 0; i < n; ++i) stream.point((p0 = segment[i])[0], p0[1])
          stream.lineEnd()
          return
        }
        p1[0] += 2 * epsilon
      }
      subject.push((x = new Intersection(p0, segment, null, true)))
      clip.push((x.o = new Intersection(p0, null, x, false)))
      subject.push((x = new Intersection(p1, segment, null, false)))
      clip.push((x.o = new Intersection(p1, null, x, true)))
    })
    if (!subject.length) return
    clip.sort(compareIntersection)
    link(subject)
    link(clip)
    for (i = 0, n = clip.length; i < n; ++i) {
      clip[i].e = startInside = !startInside
    }
    let start = subject[0],
      points,
      point
    while (1) {
      let current = start,
        isSubject = true
      while (current.v) if ((current = current.n) === start) return
      points = current.z
      stream.lineStart()
      do {
        current.v = current.o.v = true
        if (current.e) {
          if (isSubject) {
            for (i = 0, n = points.length; i < n; ++i) stream.point((point = points[i])[0], point[1])
          } else {
            interpolate(current.x, current.n.x, 1, stream)
          }
          current = current.n
        } else {
          if (isSubject) {
            points = current.p.z
            for (i = points.length - 1; i >= 0; --i) stream.point((point = points[i])[0], point[1])
          } else {
            interpolate(current.x, current.p.x, -1, stream)
          }
          current = current.p
        }
        current = current.o
        points = current.z
        isSubject = !isSubject
      } while (!current.v)
      stream.lineEnd()
    }
  }
  function link(array) {
    if (!(n = array.length)) return
    let n,
      i = 0,
      a = array[0],
      b
    while (++i < n) {
      a.n = b = array[i]
      b.p = a
      a = b
    }
    a.n = b = array[0]
    b.p = a
  }
}
export namespace path {
  let areaSum = new Adder(),
    areaRingSum = new Adder(),
    x00,
    y00,
    x0,
    y0
  const areaStream = {
    point: qu.noop,
    lineStart: qu.noop,
    lineEnd: qu.noop,
    polygonStart: function () {
      area.stream.lineStart = areaRingStart
      area.stream.lineEnd = areaRingEnd
    },
    polygonEnd: function () {
      area.stream.lineStart = area.stream.lineEnd = area.stream.point = qu.noop
      areaSum.add(qu.abs(areaRingSum))
      areaRingSum = new Adder()
    },
    result: function () {
      const area = areaSum / 2
      areaSum = new Adder()
      return area
    },
  }
  function areaRingStart() {
    area.stream.point = areaPointFirst
  }
  function areaPointFirst(x, y) {
    area.stream.point = areaPoint
    ;(x00 = x0 = x), (y00 = y0 = y)
  }
  function areaPoint(x, y) {
    areaRingSum.add(y0 * x - x0 * y)
    ;(x0 = x), (y0 = y)
  }
  function areaRingEnd() {
    areaPoint(x00, y00)
  }
  export const area = areaStream
  let x0 = Infinity,
    y0 = x0,
    x1 = -x0,
    y1 = x1
  const boundsStream = {
    point: boundsPoint,
    lineStart: qu.noop,
    lineEnd: qu.noop,
    polygonStart: qu.noop,
    polygonEnd: qu.noop,
    result: function () {
      const bounds = [
        [x0, y0],
        [x1, y1],
      ]
      x1 = y1 = -(y0 = x0 = Infinity)
      return bounds
    },
  }
  function boundsPoint(x, y) {
    if (x < x0) x0 = x
    if (x > x1) x1 = x
    if (y < y0) y0 = y
    if (y > y1) y1 = y
  }
  export const bounds = boundsStream
  let X0 = 0,
    Y0 = 0,
    Z0 = 0,
    X1 = 0,
    Y1 = 0,
    Z1 = 0,
    X2 = 0,
    Y2 = 0,
    Z2 = 0,
    x00,
    y00,
    x0,
    y0
  const centroidStream = {
    point: centroidPoint,
    lineStart: centroidLineStart,
    lineEnd: centroidLineEnd,
    polygonStart: function () {
      centroidStream.lineStart = centroidRingStart
      centroidStream.lineEnd = centroidRingEnd
    },
    polygonEnd: function () {
      centroidStream.point = centroidPoint
      centroidStream.lineStart = centroidLineStart
      centroidStream.lineEnd = centroidLineEnd
    },
    result: function () {
      const centroid = Z2 ? [X2 / Z2, Y2 / Z2] : Z1 ? [X1 / Z1, Y1 / Z1] : Z0 ? [X0 / Z0, Y0 / Z0] : [NaN, NaN]
      X0 = Y0 = Z0 = X1 = Y1 = Z1 = X2 = Y2 = Z2 = 0
      return centroid
    },
  }
  function centroidPoint(x, y) {
    X0 += x
    Y0 += y
    ++Z0
  }
  function centroidLineStart() {
    centroidStream.point = centroidPointFirstLine
  }
  function centroidPointFirstLine(x, y) {
    centroidStream.point = centroidPointLine
    centroidPoint((x0 = x), (y0 = y))
  }
  function centroidPointLine(x, y) {
    const dx = x - x0,
      dy = y - y0,
      z = sqrt(dx * dx + dy * dy)
    X1 += (z * (x0 + x)) / 2
    Y1 += (z * (y0 + y)) / 2
    Z1 += z
    centroidPoint((x0 = x), (y0 = y))
  }
  function centroidLineEnd() {
    centroidStream.point = centroidPoint
  }
  function centroidRingStart() {
    centroidStream.point = centroidPointFirstRing
  }
  function centroidRingEnd() {
    centroidPointRing(x00, y00)
  }
  function centroidPointFirstRing(x, y) {
    centroidStream.point = centroidPointRing
    centroidPoint((x00 = x0 = x), (y00 = y0 = y))
  }
  function centroidPointRing(x, y) {
    let dx = x - x0,
      dy = y - y0,
      z = sqrt(dx * dx + dy * dy)
    X1 += (z * (x0 + x)) / 2
    Y1 += (z * (y0 + y)) / 2
    Z1 += z
    z = y0 * x - x0 * y
    X2 += z * (x0 + x)
    Y2 += z * (y0 + y)
    Z2 += z * 3
    centroidPoint((x0 = x), (y0 = y))
  }
  export const centroid = centroidStream
  export class PathContext {
    constructor(context) {
      this._context = context
    }
    _radius = 4.5
    pointRadius(_) {
      return (this._radius = _), this
    }
    polygonStart() {
      this._line = 0
    }
    polygonEnd() {
      this._line = NaN
    }
    lineStart() {
      this._point = 0
    }
    lineEnd() {
      if (this._line === 0) this._context.closePath()
      this._point = NaN
    }
    point(x, y) {
      switch (this._point) {
        case 0: {
          this._context.moveTo(x, y)
          this._point = 1
          break
        }
        case 1: {
          this._context.lineTo(x, y)
          break
        }
        default: {
          this._context.moveTo(x + this._radius, y)
          this._context.arc(x, y, this._radius, 0, tau)
          break
        }
      }
    }
    result = qu.noop
  }
  export function path(x?: qg.Projection | qg.StreamWrapper | null, context?: qg.Context | null): qg.Path
  export function path<T extends qg.Permissibles>(
    projection?: qg.Projection | qg.StreamWrapper | null,
    context?: qg.Context | null
  ): qg.Path<any, T>
  export function path<This, T extends qg.Permissibles>(
    projection?: qg.Projection | qg.StreamWrapper | null,
    context?: qg.Context | null
  ): qg.Path<This, T>
  export function path(projection, context) {
    let pointRadius = 4.5,
      projectionStream,
      contextStream
    function f(object) {
      if (object) {
        if (typeof pointRadius === "function") contextStream.pointRadius(+pointRadius(arguments))
        stream(object, projectionStream(contextStream))
      }
      return contextStream.result()
    }
    f.area = x => {
      stream(x, projectionStream(pathArea))
      return pathArea.result()
    }
    f.measure = x => {
      stream(x, projectionStream(pathMeasure))
      return pathMeasure.result()
    }
    f.bounds = x => {
      stream(x, projectionStream(pathBounds))
      return pathBounds.result()
    }
    f.centroid = x => {
      stream(x, projectionStream(pathCentroid))
      return pathCentroid.result()
    }
    f.projection = (x: any) =>
      x === undefined
        ? projection
        : ((projectionStream = x === null ? ((projection = null), identity) : (projection = x).stream), f)
    f.context = (x: any) => {
      if (x === undefined) return context
      contextStream = x === null ? ((context = null), new PathString()) : new PathContext((context = x))
      if (typeof pointRadius !== "function") contextStream.pointRadius(pointRadius)
      return f
    }
    f.pointRadius = (x: any) => {
      if (X === undefined) return pointRadius
      pointRadius = typeof x === "function" ? x : (contextStream.pointRadius(+x), +x)
      return f
    }
    return f.projection(projection).context(context)
  }
  let lengthSum = new Adder(),
    lengthRing,
    x00,
    y00,
    x0,
    y0
  const lengthStream = {
    point: qu.noop,
    lineStart: () => (lengthStream.point = lengthPointFirst),
    lineEnd: () => {
      if (lengthRing) lengthPoint(x00, y00)
      lengthStream.point = qu.noop
    },
    polygonStart: () => (lengthRing = true),
    polygonEnd: () => (lengthRing = null),
    result: () => {
      const y = +lengthSum
      lengthSum = new Adder()
      return y
    },
  }
  function lengthPointFirst(x, y) {
    lengthStream.point = lengthPoint
    ;(x00 = x0 = x), (y00 = y0 = y)
  }
  function lengthPoint(x, y) {
    ;(x0 -= x), (y0 -= y)
    lengthSum.add(sqrt(x0 * x0 + y0 * y0))
    ;(x0 = x), (y0 = y)
  }
  export const length = lengthStream
  export class PathString {
    constructor() {
      this._string = []
    }
    _radius = 4.5
    _circle = circle(4.5)
    pointRadius(_) {
      if ((_ = +_) !== this._radius) (this._radius = _), (this._circle = null)
      return this
    }
    polygonStart() {
      this._line = 0
    }
    polygonEnd() {
      this._line = NaN
    }
    lineStart() {
      this._point = 0
    }
    lineEnd() {
      if (this._line === 0) this._string.push("Z")
      this._point = NaN
    }
    point(x, y) {
      switch (this._point) {
        case 0: {
          this._string.push("M", x, ",", y)
          this._point = 1
          break
        }
        case 1: {
          this._string.push("L", x, ",", y)
          break
        }
        default: {
          if (this._circle === null) this._circle = circle(this._radius)
          this._string.push("M", x, ",", y, this._circle)
          break
        }
      }
    }
    result() {
      if (this._string.length) {
        const result = this._string.join("")
        this._string = []
        return result
      } else {
        return null
      }
    }
  }
  function circle(radius) {
    return (
      "m0," +
      radius +
      "a" +
      radius +
      "," +
      radius +
      " 0 1,1 0," +
      -2 * radius +
      "a" +
      radius +
      "," +
      radius +
      " 0 1,1 0," +
      2 * radius +
      "z"
    )
  }
}

export namespace proj {
  export namespace azimuthal {
    function raw(scale): qg.RawProjection {
      return (x, y) => {
        const cx = cos(x),
          cy = cos(y),
          k = scale(cx * cy)
        if (k === Infinity) return [2, 0]
        return [k * cy * sin(x), k * sin(y)]
      }
    }
    export function invert(angle) {
      return (x, y) => {
        const z = sqrt(x * x + y * y),
          c = angle(z),
          sc = sin(c),
          cc = cos(c)
        return [atan2(x * sc, z * cc), qu.asin(z && (y * sc) / z)]
      }
    }
    export const equalAreaRaw = raw(cxcy => sqrt(2 / (1 + cxcy)))
    equalAreaRaw.invert = invert(z => 2 * qu.asin(z / 2))
    export function equalArea() {
      return projection(equalAreaRaw)
        .scale(124.75)
        .clipAngle(180 - 1e-3)
    }
    export const equidistantRaw = raw(c => (c = qu.acos(c)) && c / sin(c))
    equidistantRaw.invert = invert(z => z)
    export function equidistant() {
      return projection(equidistantRaw)
        .scale(79.4188)
        .clipAngle(180 - 1e-3)
    }
  }
  export function conic(projectAt): qg.Conic {
    let phi0 = 0,
      phi1 = pi / 3
    const m = mutator(projectAt),
      p = m(phi0, phi1)
    p.parallels = (x: any) =>
      x === undefined ? [phi0 * degrees, phi1 * degrees] : m((phi0 = x[0] * radians), (phi1 = x[1] * radians))
    return p
  }
  export namespace conic {
    export function conformalRaw(y0: number, y1: number): qg.RawProjection {
      const cy0 = cos(y0),
        n = y0 === y1 ? sin(y0) : log(cy0 / cos(y1)) / log(tany(y1) / tany(y0)),
        p = (cy0 * pow(tany(y0), n)) / n
      if (!n) return mercatorRaw
      function f(x, y) {
        if (p > 0) {
          if (y < -halfPi + epsilon) y = -halfPi + epsilon
        } else {
          if (y > halfPi - epsilon) y = halfPi - epsilon
        }
        const r = p / pow(tany(y), n)
        return [r * sin(n * x), p - r * cos(n * x)]
      }
      f.invert = (x, y) => {
        const py = p - y,
          r = sign(n) * sqrt(x * x + py * py)
        let l = atan2(x, qu.abs(py)) * sign(py)
        if (py * n < 0) l -= pi * sign(x) * sign(py)
        return [l / n, 2 * atan(pow(p / r, 1 / n)) - halfPi]
      }
      return f
    }
    export const conformal = () => conic(conformalRaw).scale(109.5).parallels([30, 30])
    export function equalAreaRaw(y0, y1): qg.RawProjection {
      const sy0 = sin(y0),
        n = (sy0 + sin(y1)) / 2
      if (qu.abs(n) < epsilon) return cylindrical.equalAreaRaw(y0)
      const c = 1 + sy0 * (2 * n - sy0),
        r0 = sqrt(c) / n
      function f(x, y) {
        const r = sqrt(c - 2 * n * sin(y)) / n
        return [r * sin((x *= n)), r0 - r * cos(x)]
      }
      f.invert = (x, y) => {
        const r0y = r0 - y
        let l = atan2(x, qu.abs(r0y)) * sign(r0y)
        if (r0y * n < 0) l -= pi * sign(x) * sign(r0y)
        return [l / n, qu.asin((c - (x * x + r0y * r0y) * n * n) / (2 * n))]
      }
      return f
    }
    export const equalArea = () => conic(equalAreaRaw).scale(155.424).center([0, 33.6442])
    export function equidistantRaw(y0, y1): qg.RawProjection {
      const cy0 = cos(y0),
        n = y0 === y1 ? sin(y0) : (cy0 - cos(y1)) / (y1 - y0),
        g = cy0 / n + y0
      if (qu.abs(n) < epsilon) return equirectangularRaw
      function f(x, y) {
        const gy = g - y,
          nx = n * x
        return [gy * sin(nx), g - gy * cos(nx)]
      }
      f.invert = (x, y) => {
        const gy = g - y
        let l = atan2(x, qu.abs(gy)) * sign(gy)
        if (gy * n < 0) l -= pi * sign(x) * sign(gy)
        return [l / n, g - sign(n) * sqrt(x * x + gy * gy)]
      }
      return f
    }
    export const equidistant = () => conic(equidistantRaw).scale(131.154).center([0, 13.9389])
    function tany(y) {
      return tan((halfPi + y) / 2)
    }
  }
  namespace cylindrical {
    export function equalAreaRaw(phi0) {
      const cosPhi0 = cos(phi0)
      function f(lambda, phi) {
        return [lambda * cosPhi0, sin(phi) / cosPhi0]
      }
      f.invert = (x, y) => [x / cosPhi0, qu.asin(y * cosPhi0)]
      return f
    }
  }
  export function albers(): qg.Conic {
    return conic
      .equalArea()
      .parallels([29.5, 45.5])
      .scale(1070)
      .translate([480, 250])
      .rotate([96, 0])
      .center([-0.6, 38.7])
  }
  export function albersUsa(): qg.Projection {
    const lower48 = albers(),
      alaska = conic.equalArea().rotate([154, 0]).center([-2, 58.5]).parallels([55, 65]),
      hawaii = conic.equalArea().rotate([157, 0]).center([-3, 19.9]).parallels([8, 18]),
      pointStream = {
        point: (x, y) => (point = [x, y]),
      }
    let cache,
      cacheStream,
      lower48Point,
      alaskaPoint, // EPSG:3338
      hawaiiPoint, // ESRI:102007
      point
    function f(xs) {
      const x = xs[0],
        y = xs[1]
      return (
        (point = null),
        (lower48Point.point(x, y), point) || (alaskaPoint.point(x, y), point) || (hawaiiPoint.point(x, y), point)
      )
    }
    function multiplex(streams) {
      const n = streams.length
      return {
        point: (x, y) => {
          let i = -1
          while (++i < n) streams[i].point(x, y)
        },
        sphere: () => {
          let i = -1
          while (++i < n) streams[i].sphere()
        },
        lineStart: () => {
          let i = -1
          while (++i < n) streams[i].lineStart()
        },
        lineEnd: () => {
          let i = -1
          while (++i < n) streams[i].lineEnd()
        },
        polygonStart: () => {
          let i = -1
          while (++i < n) streams[i].polygonStart()
        },
        polygonEnd: () => {
          let i = -1
          while (++i < n) streams[i].polygonEnd()
        },
      }
    }
    function reset() {
      cache = cacheStream = null
      return f
    }
    f.invert = xs => {
      const k = lower48.scale(),
        t = lower48.translate(),
        x = (xs[0] - t[0]) / k,
        y = (xs[1] - t[1]) / k
      return (
        y >= 0.12 && y < 0.234 && x >= -0.425 && x < -0.214
          ? alaska
          : y >= 0.166 && y < 0.234 && x >= -0.214 && x < -0.115
          ? hawaii
          : lower48
      ).invert(xs)
    }
    f.stream = x =>
      cache && cacheStream === x
        ? cache
        : (cache = multiplex([lower48.stream((cacheStream = x)), alaska.stream(x), hawaii.stream(x)]))
    f.precision = (x: any) => {
      if (x === undefined) return lower48.precision()
      lower48.precision(x), alaska.precision(x), hawaii.precision(x)
      return reset()
    }
    f.scale = (x: any) => {
      if (x === undefined) return lower48.scale()
      lower48.scale(x), alaska.scale(x * 0.35), hawaii.scale(x)
      return f.translate(lower48.translate())
    }
    f.translate = _ => {
      if (!arguments.length) return lower48.translate()
      const k = lower48.scale(),
        x = +_[0],
        y = +_[1]
      lower48Point = lower48
        .translate(_)
        .clipExtent([
          [x - 0.455 * k, y - 0.238 * k],
          [x + 0.455 * k, y + 0.238 * k],
        ])
        .stream(pointStream)
      alaskaPoint = alaska
        .translate([x - 0.307 * k, y + 0.201 * k])
        .clipExtent([
          [x - 0.425 * k + epsilon, y + 0.12 * k + epsilon],
          [x - 0.214 * k - epsilon, y + 0.234 * k - epsilon],
        ])
        .stream(pointStream)
      hawaiiPoint = hawaii
        .translate([x - 0.205 * k, y + 0.212 * k])
        .clipExtent([
          [x - 0.214 * k + epsilon, y + 0.166 * k + epsilon],
          [x - 0.115 * k - epsilon, y + 0.234 * k - epsilon],
        ])
        .stream(pointStream)
      return reset()
    }
    f.fitExtent = (extent, x) => fit.extent(f, extent, x)
    f.fitSize = (size, x) => fit.size(f, size, x)
    f.fitWidth = (width, x) => fit.width(f, width, x)
    f.fitHeight = (height, x) => fit.height(f, height, x)
    return f.scale(1070)
  }
  const A1 = 1.340264,
    A2 = -0.081106,
    A3 = 0.000893,
    A4 = 0.003796,
    M = sqrt(3) / 2,
    iterations = 12

  export function equalEarthRaw(lambda, phi): qg.RawProjection {
    const l = qu.asin(M * sin(phi)),
      l2 = l * l,
      l6 = l2 * l2 * l2
    return [
      (lambda * cos(l)) / (M * (A1 + 3 * A2 * l2 + l6 * (7 * A3 + 9 * A4 * l2))),
      l * (A1 + A2 * l2 + l6 * (A3 + A4 * l2)),
    ]
  }
  equalEarthRaw.invert = function (x, y) {
    let l = y,
      l2 = l * l,
      l6 = l2 * l2 * l2
    for (let i = 0, delta, fy, fpy; i < iterations; ++i) {
      fy = l * (A1 + A2 * l2 + l6 * (A3 + A4 * l2)) - y
      fpy = A1 + 3 * A2 * l2 + l6 * (7 * A3 + 9 * A4 * l2)
      ;(l -= delta = fy / fpy), (l2 = l * l), (l6 = l2 * l2 * l2)
      if (qu.abs(delta) < epsilon2) break
    }
    return [(M * x * (A1 + 3 * A2 * l2 + l6 * (7 * A3 + 9 * A4 * l2))) / cos(l), qu.asin(sin(l) / M)]
  }
  export function equalEarth() {
    return projection(equalEarthRaw).scale(177.158)
  }
  export function equirectangularRaw(lambda, phi): qg.RawProjection {
    return [lambda, phi]
  }
  equirectangularRaw.invert = equirectangularRaw
  export function equirectangular() {
    return projection(equirectangularRaw).scale(152.63)
  }
  export function gnomonicRaw(x, y): qt.qg.RawProjection {
    const cy = cos(y),
      k = cos(x) * cy
    return [(cy * sin(x)) / k, sin(y) / k]
  }
  gnomonicRaw.invert = azimuthal.invert(atan)
  export function gnomonic() {
    return projection(gnomonicRaw).scale(144.049).clipAngle(60)
  }
  export function identity(): GeoIdentityTransform {
    let k = 1,
      tx = 0,
      ty = 0,
      sx = 1,
      sy = 1, // scale, translate and reflect
      alpha = 0,
      ca,
      sa, // angle
      x0 = null,
      y0,
      x1,
      y1, // clip extent
      kx = 1,
      ky = 1,
      transform = transformer({
        point: function (x, y) {
          const p = f([x, y])
          this.stream.point(p[0], p[1])
        },
      }),
      postclip = qu.identity,
      cache,
      cacheStream
    function reset() {
      kx = k * sx
      ky = k * sy
      cache = cacheStream = null
      return f
    }
    function f(p) {
      let x = p[0] * kx,
        y = p[1] * ky
      if (alpha) {
        const t = y * ca - x * sa
        x = x * ca + y * sa
        y = t
      }
      return [x + tx, y + ty]
    }
    f.invert = p => {
      let x = p[0] - tx,
        y = p[1] - ty
      if (alpha) {
        const t = y * ca + x * sa
        x = x * ca - y * sa
        y = t
      }
      return [x / kx, y / ky]
    }
    f.stream = X => (cache && cacheStream === X ? cache : (cache = transform(postclip((cacheStream = X)))))
    f.postclip = x => (x === undefined ? postclip : ((postclip = x), (x0 = y0 = x1 = y1 = null), reset()))
    f.clipExtent = x =>
      x === undefined
        ? ((postclip =
            x === null
              ? ((x0 = y0 = x1 = y1 = null), qu.identity)
              : clipRectangle((x0 = +x[0][0]), (y0 = +x[0][1]), (x1 = +x[1][0]), (y1 = +x[1][1]))),
          reset())
        : x0 === null
        ? null
        : [
            [x0, y0],
            [x1, y1],
          ]
    f.scale = (x: any) => (x === undefined ? k : ((k = +x), reset()))
    f.translate = (x: any) => (x === undefined ? [tx, ty] : ((tx = +x[0]), (ty = +x[1]), reset()))
    f.angle = (x: any) =>
      x === undefined ? alpha * degrees : ((alpha = (x % 360) * radians), (sa = sin(alpha)), (ca = cos(alpha)), reset())
    f.reflectX = (x: any) => (x === undefined ? sx < 0 : ((sx = x ? -1 : 1), reset()))
    f.reflectY = (x: any) => (x === undefined ? sy < 0 : ((sy = x ? -1 : 1), reset()))
    f.fitExtent = (extent, x) => fit.extent(f, extent, x)
    f.fitSize = (size, x) => fit.size(f, size, x)
    f.fitWidth = (width, x) => fit.width(f, width, x)
    f.fitHeight = (height, x) => fit.height(f, height, x)
    return f
  }
  const transformRadians = transformer({
    point: (x, y) => this.stream.point(x * radians, y * radians),
  })
  function transformRotate(rotate) {
    return transformer({
      point: (x, y) => {
        const r = rotate(x, y)
        return this.stream.point(r[0], r[1])
      },
    })
  }
  function scaleTranslate(k, dx, dy, sx, sy) {
    function f(x, y) {
      x *= sx
      y *= sy
      return [dx + k * x, dy - k * y]
    }
    f.invert = (x, y) => [((x - dx) / k) * sx, ((dy - y) / k) * sy]
    return f
  }
  function scaleTranslateRotate(k, dx, dy, sx, sy, alpha) {
    if (!alpha) return scaleTranslate(k, dx, dy, sx, sy)
    const cosAlpha = cos(alpha),
      sinAlpha = sin(alpha),
      a = cosAlpha * k,
      b = sinAlpha * k,
      ai = cosAlpha / k,
      bi = sinAlpha / k,
      ci = (sinAlpha * dy - cosAlpha * dx) / k,
      fi = (sinAlpha * dx + cosAlpha * dy) / k
    function f(x, y) {
      x *= sx
      y *= sy
      return [a * x - b * y + dx, dy - b * x - a * y]
    }
    f.invert = (x, y) => [sx * (ai * x - bi * y + ci), sy * (fi - bi * x - ai * y)]
    return f
  }
  export function projection(x: qg.RawProjection): qg.Projection {
    return mutator(() => x)()
  }
  export function mutator(projectAt: (...xs: any[]) => qg.RawProjection): () => qg.Projection {
    let project,
      k = 150, // scale
      x = 480,
      y = 250, // translate
      lambda = 0,
      phi = 0, // center
      deltaLambda = 0,
      deltaPhi = 0,
      deltaGamma = 0,
      rotate, // pre-rotate
      alpha = 0, // post-rotate angle
      sx = 1, // reflectX
      sy = 1, // reflectX
      theta = null,
      preclip = clipAntimeridian, // pre-clip angle
      x0 = null,
      y0,
      x1,
      y1,
      postclip = qu.identity, // post-clip extent
      delta2 = 0.5, // precision
      projectResample,
      projectTransform,
      projectRotateTransform,
      cache,
      cacheStream
    function invert(x) {
      x = projectRotateTransform.invert(x[0], x[1])
      return x && [x[0] * degrees, x[1] * degrees]
    }
    function f(point) {
      return projectRotateTransform(point[0] * radians, point[1] * radians)
    }
    f.stream = x =>
      cache && cacheStream === x
        ? cache
        : (cache = transformRadians(transformRotate(rotate)(preclip(projectResample(postclip((cacheStream = x)))))))
    f.preclip = (x: any) => (x === undefined ? preclip : ((preclip = x), (theta = undefined), reset()))
    f.postclip = (x: any) => (x === undefined ? postclip : ((postclip = x), (x0 = y0 = x1 = y1 = null), reset()))
    f.clipAngle = (x: any) =>
      x === undefined
        ? theta * degrees
        : ((preclip = +x ? clipCircle((theta = x * radians)) : ((theta = null), clipAntimeridian)), reset())
    f.clipExtent = x =>
      x !== undefined
        ? ((postclip =
            x === null
              ? ((x0 = y0 = x1 = y1 = null), qu.identity)
              : clipRectangle((x0 = +x[0][0]), (y0 = +x[0][1]), (x1 = +x[1][0]), (y1 = +x[1][1]))),
          reset())
        : x0 === null
        ? null
        : [
            [x0, y0],
            [x1, y1],
          ]
    f.scale = (x: any) => (x === undefined ? k : ((k = +x), recenter()))
    f.translate = (x: any) => (x === undefined ? [x, y] : ((x = +x[0]), (y = +x[1]), recenter()))
    f.center = (x: any) =>
      x === undefined
        ? [lambda * degrees, phi * degrees]
        : ((lambda = (x[0] % 360) * radians), (phi = (x[1] % 360) * radians), recenter())
    f.rotate = (x: any) =>
      x === undefined
        ? [deltaLambda * degrees, deltaPhi * degrees, deltaGamma * degrees]
        : ((deltaLambda = (x[0] % 360) * radians),
          (deltaPhi = (x[1] % 360) * radians),
          (deltaGamma = x.length > 2 ? (x[2] % 360) * radians : 0),
          recenter())
    f.angle = (x: any) => (x === undefined ? alpha * degrees : ((alpha = (x % 360) * radians), recenter()))
    f.reflectX = (x: any) => (x === undefined ? sx < 0 : ((sx = x ? -1 : 1), recenter()))
    f.reflectY = (x: any) => (x === undefined ? sy < 0 : ((sy = x ? -1 : 1), recenter()))
    f.precision = (x: any) =>
      x === undefined ? sqrt(delta2) : ((projectResample = resample(projectTransform, (delta2 = x * x))), reset())
    f.fitExtent = (extent, x) => fit.extent(f, extent, x)
    f.fitSize = (size, x) => fit.size(f, size, x)
    f.fitWidth = (width, x) => fit.width(f, width, x)
    f.fitHeight = (height, x) => fit.height(f, height, x)
    function recenter() {
      const center = scaleTranslateRotate(k, 0, 0, sx, sy, alpha).apply(null, project(lambda, phi)),
        transform = scaleTranslateRotate(k, x - center[0], y - center[1], sx, sy, alpha)
      rotate = rotateRadians(deltaLambda, deltaPhi, deltaGamma)
      projectTransform = compose(project, transform)
      projectRotateTransform = compose(rotate, projectTransform)
      projectResample = resample(projectTransform, delta2)
      return reset()
    }
    function reset() {
      cache = cacheStream = null
      return f
    }
    return (xs: any[]) => {
      project = projectAt.apply(this, xs)
      f.invert = project.invert && invert
      return recenter()
    }
  }
  export function mercatorRaw(lambda, phi): qg.RawProjection {
    return [lambda, log(tan((halfPi + phi) / 2))]
  }
  mercatorRaw.invert = (x, y) => [x, 2 * atan(exp(y)) - halfPi]
  export function mercator() {
    return mercatorProjection(mercatorRaw).scale(961 / tau)
  }
  export function mercatorProjection(project) {
    const f = projection(project),
      center = f.center,
      scale = f.scale,
      translate = f.translate,
      clipExtent = f.clipExtent
    let x0 = null,
      y0,
      x1,
      y1 // clip extent
    f.scale = (xs: number[]) => (xs.length ? (scale(xs), reclip()) : scale())
    f.translate = (xs: number[]) => (xs.length ? (translate(xs), reclip()) : translate())
    f.center = (xs: number[]) => (xs.length ? (center(xs), reclip()) : center())
    f.clipExtent = function (xs) {
      return xs.length
        ? (xs === null
            ? (x0 = y0 = x1 = y1 = null)
            : ((x0 = +xs[0][0]), (y0 = +xs[0][1]), (x1 = +xs[1][0]), (y1 = +xs[1][1])),
          reclip())
        : x0 === null
        ? null
        : [
            [x0, y0],
            [x1, y1],
          ]
    }
    function reclip() {
      const k = pi * scale(),
        t = f(rotation(f.rotate()).invert([0, 0]))
      return clipExtent(
        x0 === null
          ? [
              [t[0] - k, t[1] - k],
              [t[0] + k, t[1] + k],
            ]
          : project === mercatorRaw
          ? [
              [qu.max(t[0] - k, x0), y0],
              [qu.min(t[0] + k, x1), y1],
            ]
          : [
              [x0, qu.max(t[1] - k, y0)],
              [x1, qu.min(t[1] + k, y1)],
            ]
      )
    }
    return reclip()
  }
  export function naturalEarth1Raw(lambda, phi): qg.RawProjection {
    const phi2 = phi * phi,
      phi4 = phi2 * phi2
    return [
      lambda * (0.8707 - 0.131979 * phi2 + phi4 * (-0.013791 + phi4 * (0.003971 * phi2 - 0.001529 * phi4))),
      phi * (1.007226 + phi2 * (0.015085 + phi4 * (-0.044475 + 0.028874 * phi2 - 0.005916 * phi4))),
    ]
  }
  naturalEarth1Raw.invert = (x, y) => {
    let phi = y,
      i = 25,
      delta
    do {
      const phi2 = phi * phi,
        phi4 = phi2 * phi2
      phi -= delta =
        (phi * (1.007226 + phi2 * (0.015085 + phi4 * (-0.044475 + 0.028874 * phi2 - 0.005916 * phi4))) - y) /
        (1.007226 + phi2 * (0.015085 * 3 + phi4 * (-0.044475 * 7 + 0.028874 * 9 * phi2 - 0.005916 * 11 * phi4)))
    } while (qu.abs(delta) > epsilon && --i > 0)
    return [
      x /
        (0.8707 +
          (phi2 = phi * phi) * (-0.131979 + phi2 * (-0.013791 + phi2 * phi2 * phi2 * (0.003971 - 0.001529 * phi2)))),
      phi,
    ]
  }
  export function naturalEarth1() {
    return projection(naturalEarth1Raw).scale(175.295)
  }
  export function orthographicRaw(x, y): qg.RawProjection {
    return [cos(y) * sin(x), sin(y)]
  }
  orthographicRaw.invert = azimuthal.invert(qu.asin)
  export function orthographic() {
    return projection(orthographicRaw)
      .scale(249.5)
      .clipAngle(90 + epsilon)
  }
  const maxDepth = 16,
    cosMinDistance = cos(30 * radians)
  export function resample(project, delta2) {
    function resampleNone(project) {
      return transformer({
        point: function (x, y) {
          x = project(x, y)
          this.stream.point(x[0], x[1])
        },
      })
    }
    function resample(project, delta2) {
      function resampleLineTo(x0, y0, lam0, a0, b0, c0, x1, y1, lam1, a1, b1, c1, depth, stream) {
        const dx = x1 - x0,
          dy = y1 - y0,
          d2 = dx * dx + dy * dy
        if (d2 > 4 * delta2 && depth--) {
          let a = a0 + a1,
            b = b0 + b1,
            c = c0 + c1,
            m = sqrt(a * a + b * b + c * c),
            phi2 = qu.asin((c /= m)),
            lam2 = qu.abs(qu.abs(c) - 1) < epsilon || qu.abs(lam0 - lam1) < epsilon ? (lam0 + lam1) / 2 : atan2(b, a),
            p = project(lam2, phi2),
            x2 = p[0],
            y2 = p[1],
            dx2 = x2 - x0,
            dy2 = y2 - y0,
            dz = dy * dx2 - dx * dy2
          if (
            (dz * dz) / d2 > delta2 || // perpendicular projected distance
            qu.abs((dx * dx2 + dy * dy2) / d2 - 0.5) > 0.3 || // midpoint close to an end
            a0 * a1 + b0 * b1 + c0 * c1 < cosMinDistance
          ) {
            resampleLineTo(x0, y0, lam0, a0, b0, c0, x2, y2, lam2, (a /= m), (b /= m), c, depth, stream)
            stream.point(x2, y2)
            resampleLineTo(x2, y2, lam2, a, b, c, x1, y1, lam1, a1, b1, c1, depth, stream)
          }
        }
      }
      return function (stream) {
        let lam00,
          x00,
          y00,
          a00,
          b00,
          c00, // first point
          lam0,
          x0,
          y0,
          a0,
          b0,
          c0 // previous point
        const resample = {
          point: point,
          lineStart: lineStart,
          lineEnd: lineEnd,
          polygonStart: function () {
            stream.polygonStart()
            resample.lineStart = ringStart
          },
          polygonEnd: function () {
            stream.polygonEnd()
            resample.lineStart = lineStart
          },
        }
        function point(x, y) {
          x = project(x, y)
          stream.point(x[0], x[1])
        }
        function lineStart() {
          x0 = NaN
          resample.point = linePoint
          stream.lineStart()
        }
        function linePoint(lambda, phi) {
          const c = cartesian([lambda, phi]),
            p = project(lambda, phi)
          resampleLineTo(
            x0,
            y0,
            lam0,
            a0,
            b0,
            c0,
            (x0 = p[0]),
            (y0 = p[1]),
            (lam0 = lambda),
            (a0 = c[0]),
            (b0 = c[1]),
            (c0 = c[2]),
            maxDepth,
            stream
          )
          stream.point(x0, y0)
        }
        function lineEnd() {
          resample.point = point
          stream.lineEnd()
        }
        function ringStart() {
          lineStart()
          resample.point = ringPoint
          resample.lineEnd = ringEnd
        }
        function ringPoint(lambda, phi) {
          linePoint((lam00 = lambda), phi), (x00 = x0), (y00 = y0), (a00 = a0), (b00 = b0), (c00 = c0)
          resample.point = linePoint
        }
        function ringEnd() {
          resampleLineTo(x0, y0, lam0, a0, b0, c0, x00, y00, lam00, a00, b00, c00, maxDepth, stream)
          resample.lineEnd = lineEnd
          lineEnd()
        }
        return resample
      }
    }
    return +delta2 ? resample(project, delta2) : resampleNone(project)
  }
  export function stereographicRaw(x, y): qg.RawProjection {
    const cy = cos(y),
      k = 1 + cos(x) * cy
    return [(cy * sin(x)) / k, sin(y) / k]
  }
  stereographicRaw.invert = azimuthal.invert(function (z) {
    return 2 * atan(z)
  })
  export function stereographic() {
    return projection(stereographicRaw).scale(250).clipAngle(142)
  }
  export function transverseMercatorRaw(lambda, phi): qg.RawProjection {
    return [log(tan((halfPi + phi) / 2)), -lambda]
  }
  transverseMercatorRaw.invert = function (x, y) {
    return [-y, 2 * atan(exp(x)) - halfPi]
  }
  export function transverseMercator() {
    const f = mercatorProjection(transverseMercatorRaw),
      center = f.center,
      rotate = f.rotate
    f.center = function (xs: number[]) {
      return xs.length ? center([-xs[1], xs[0]]) : ((xs = center()), [xs[1], -xs[0]])
    }
    f.rotate = function (xs: number[]) {
      return xs.length
        ? rotate([xs[0], xs[1], xs.length > 2 ? xs[2] + 90 : 90])
        : ((xs = rotate()), [xs[0], xs[1], xs[2] - 90])
    }
    return rotate([0, 0, 90]).scale(159.155)
  }
  function fit(f, bounds, x) {
    const clip = f.clipExtent && f.clipExtent()
    f.scale(150).translate([0, 0])
    if (clip != null) f.clipExtent(null)
    geoStream(x, f.stream(bounds.stream))
    bounds(bounds.stream.result())
    if (clip != null) f.clipExtent(clip)
    return f
  }
  namespace fit {
    export function extent(f, ext, x) {
      return fit(
        f,
        function (b) {
          const w = ext[1][0] - ext[0][0],
            h = ext[1][1] - ext[0][1],
            k = qu.min(w / (b[1][0] - b[0][0]), h / (b[1][1] - b[0][1])),
            x = +ext[0][0] + (w - k * (b[1][0] + b[0][0])) / 2,
            y = +ext[0][1] + (h - k * (b[1][1] + b[0][1])) / 2
          f.scale(150 * k).translate([x, y])
        },
        x
      )
    }
    export function size(f, size, x) {
      return extent(f, [[0, 0], size], x)
    }
    export function width(f, width, x) {
      return fit(
        f,
        function (b) {
          const w = +width,
            k = w / (b[1][0] - b[0][0]),
            x = (w - k * (b[1][0] + b[0][0])) / 2,
            y = -k * b[0][1]
          f.scale(150 * k).translate([x, y])
        },
        x
      )
    }
    export function height(f, height, x) {
      return fit(
        f,
        function (b) {
          const h = +height,
            k = h / (b[1][1] - b[0][1]),
            x = -k * b[0][0],
            y = (h - k * (b[1][1] + b[0][1])) / 2
          f.scale(150 * k).translate([x, y])
        },
        x
      )
    }
  }
}
