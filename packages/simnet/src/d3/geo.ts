/* eslint-disable no-inner-declarations */
import { Adder, range } from "./utils_seq.js"
import type * as qt from "./types.js"
import * as qu from "./utils.js"

export function area(
  x: qt.ExtendedFeature | qt.ExtendedFeatureCollection | qt.GeoGeometryObjects | qt.ExtendedGeometryCollection
): number {
  area.sum = new Adder()
  stream(x, area.stream)
  return area.sum * 2
}
export namespace area {
  export const ringSum = new Adder()
  export const sum = new Adder()
  let lambda00, phi00, lambda0, cosPhi0, sinPhi0
  export const stream = {
    point: noop,
    lineStart: noop,
    lineEnd: noop,
    polygonStart: function () {
      ringSum = new Adder()
      stream.lineStart = ringStart
      stream.lineEnd = ringEnd
    },
    polygonEnd: function () {
      const y = +ringSum
      sum.add(y < 0 ? qu.tau + y : y)
      this.lineStart = this.lineEnd = this.point = noop
    },
    sphere: function () {
      sum.add(qu.tau)
    },
  }
  function ringStart() {
    stream.point = pointFirst
  }
  function ringEnd() {
    point(lambda00, phi00)
  }
  function pointFirst(lambda, phi) {
    stream.point = point
    ;(lambda00 = lambda), (phi00 = phi)
    ;(lambda *= qu.radians), (phi *= qu.radians)
    ;(lambda0 = lambda), (cosPhi0 = qu.cos((phi = phi / 2 + qu.quarterPi))), (sinPhi0 = qu.sin(phi))
  }
  function point(lambda, phi) {
    ;(lambda *= qu.radians), (phi *= qu.radians)
    phi = phi / 2 + qu.quarterPi
    const dLambda = lambda - lambda0,
      sdLambda = dLambda >= 0 ? 1 : -1,
      adLambda = sdLambda * dLambda,
      cosPhi = qu.cos(phi),
      sinPhi = qu.sin(phi),
      k = sinPhi0 * sinPhi,
      u = cosPhi0 * cosPhi + k * qu.cos(adLambda),
      v = k * sdLambda * qu.sin(adLambda)
    ringSum.add(qu.atan2(v, u))
    ;(lambda0 = lambda), (cosPhi0 = cosPhi), (sinPhi0 = sinPhi)
  }
}
export function bounds(
  x: qt.ExtendedFeature | qt.ExtendedFeatureCollection | qt.GeoGeometryObjects | qt.ExtendedGeometryCollection
): [qt.Point, qt.Span] {
  let i, n, a, b, merged, deltaMax, delta
  const phi1 = (lambda1 = -(lambda0 = phi0 = Infinity))
  let spans: qt.Span[] = []
  stream(x, bounds.stream)
  if ((n = spans.length)) {
    spans.sort((a, b) => a[0]! - b[0]!)
    function contains(s: qt.Span, x: number) {
      return s[0] <= s[1] ? s[0] <= x && x <= s[1] : x < s[0] || s[1] < x
    }
    for (i = 1, a = spans[0]!, merged = [a]; i < n; ++i) {
      b = spans[i]!
      if (contains(a, b[0]) || contains(a, b[1])) {
        if (qu.angle(a[0], b[1]) > qu.angle(a[0], a[1])) a[1] = b[1]
        if (qu.angle(b[0], a[1]) > qu.angle(a[0], a[1])) a[0] = b[0]
      } else {
        merged.push((a = b))
      }
    }
    for (deltaMax = -Infinity, n = merged.length - 1, i = 0, a = merged[n]; i <= n; a = b, ++i) {
      b = merged[i]
      if ((delta = qu.angle(a[1], b[0])) > deltaMax) (deltaMax = delta), (lambda0 = b[0]), (lambda1 = a[1])
    }
  }
  spans = range = null
  return lambda0 === Infinity || phi0 === Infinity
    ? [
        [NaN, NaN],
        [NaN, NaN],
      ]
    : [
        [lambda0, phi0],
        [lambda1, phi1],
      ]
}
export namespace bounds {
  let lambda0,
    phi0,
    lambda1,
    phi1, // bounds
    lambda2, // previous lambda-coordinate
    lambda00,
    phi00, // first point
    p0, // previous 3D point
    deltaSum,
    ranges,
    range
  export const stream = {
    point: point,
    lineStart: lineStart,
    lineEnd: lineEnd,
    polygonStart: function () {
      stream.point = ringPoint
      stream.lineStart = ringStart
      stream.lineEnd = ringEnd
      deltaSum = new Adder()
      areaStream.polygonStart()
    },
    polygonEnd: function () {
      areaStream.polygonEnd()
      stream.point = point
      stream.lineStart = lineStart
      stream.lineEnd = lineEnd
      if (areaRingSum < 0) (lambda0 = -(lambda1 = 180)), (phi0 = -(phi1 = 90))
      else if (deltaSum > qu.epsilon) phi1 = 90
      else if (deltaSum < -qu.epsilon) phi0 = -90
      ;(range[0] = lambda0), (range[1] = lambda1)
    },
    sphere: function () {
      ;(lambda0 = -(lambda1 = 180)), (phi0 = -(phi1 = 90))
    },
  }
  function point(lambda: number, phi: number) {
    ranges.push((range = [(lambda0 = lambda), (lambda1 = lambda)]))
    if (phi < phi0) phi0 = phi
    if (phi > phi1) phi1 = phi
  }
  function linePoint(lambda: number, phi: number) {
    const p = cartesian([lambda * qu.radians, phi * qu.radians])
    if (p0) {
      let normal = cartesianCross(p0, p),
        equatorial = [normal[1], -normal[0], 0],
        inflection = cartesianCross(equatorial, normal)
      cartesianNormalizeInPlace(inflection)
      inflection = spherical(inflection)
      let delta = lambda - lambda2,
        sign = delta > 0 ? 1 : -1,
        lambdai = inflection[0] * qu.degrees * sign,
        phii,
        antimeridian = qu.abs(delta) > 180
      if (antimeridian ^ (sign * lambda2 < lambdai && lambdai < sign * lambda)) {
        phii = inflection[1] * qu.degrees
        if (phii > phi1) phi1 = phii
      } else if (
        ((lambdai = ((lambdai + 360) % 360) - 180),
        antimeridian ^ (sign * lambda2 < lambdai && lambdai < sign * lambda))
      ) {
        phii = -inflection[1] * qu.degrees
        if (phii < phi0) phi0 = phii
      } else {
        if (phi < phi0) phi0 = phi
        if (phi > phi1) phi1 = phi
      }
      if (antimeridian) {
        if (lambda < lambda2) {
          if (qu.angle(lambda0, lambda) > qu.angle(lambda0, lambda1)) lambda1 = lambda
        } else {
          if (qu.angle(lambda, lambda1) > qu.angle(lambda0, lambda1)) lambda0 = lambda
        }
      } else {
        if (lambda1 >= lambda0) {
          if (lambda < lambda0) lambda0 = lambda
          if (lambda > lambda1) lambda1 = lambda
        } else {
          if (lambda > lambda2) {
            if (qu.angle(lambda0, lambda) > qu.angle(lambda0, lambda1)) lambda1 = lambda
          } else {
            if (qu.angle(lambda, lambda1) > qu.angle(lambda0, lambda1)) lambda0 = lambda
          }
        }
      }
    } else {
      ranges.push((range = [(lambda0 = lambda), (lambda1 = lambda)]))
    }
    if (phi < phi0) phi0 = phi
    if (phi > phi1) phi1 = phi
    ;(p0 = p), (lambda2 = lambda)
  }
  function lineStart() {
    stream.point = linePoint
  }
  function lineEnd() {
    ;(range[0] = lambda0), (range[1] = lambda1)
    stream.point = point
    p0 = null
  }
  function ringPoint(lambda: number, phi: number) {
    if (p0) {
      const delta = lambda - lambda2
      deltaSum.add(qu.abs(delta) > 180 ? delta + (delta > 0 ? 360 : -360) : delta)
    } else {
      ;(lambda00 = lambda), (phi00 = phi)
    }
    area.stream.point(lambda, phi)
    linePoint(lambda, phi)
  }
  function ringStart() {
    areaStream.lineStart()
  }
  function ringEnd() {
    ringPoint(lambda00, phi00)
    areaStream.lineEnd()
    if (qu.abs(deltaSum) > qu.epsilon) lambda0 = -(lambda1 = 180)
    ;(range[0] = lambda0), (range[1] = lambda1)
    p0 = null
  }
}
export function spherical(cartesian) {
  return [qu.atan2(cartesian[1], cartesian[0]), asin(cartesian[2])]
}
export function cartesian(spherical) {
  const lambda = spherical[0],
    phi = spherical[1],
    cosPhi = qu.cos(phi)
  return [cosPhi * qu.cos(lambda), cosPhi * qu.sin(lambda), qu.sin(phi)]
}
export function cartesianDot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}
export function cartesianCross(a, b) {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
}
export function cartesianAddInPlace(a, b) {
  ;(a[0] += b[0]), (a[1] += b[1]), (a[2] += b[2])
}
export function cartesianScale(vector, k) {
  return [vector[0] * k, vector[1] * k, vector[2] * k]
}
export function cartesianNormalizeInPlace(d) {
  const l = qu.sqrt(d[0] * d[0] + d[1] * d[1] + d[2] * d[2])
  ;(d[0] /= l), (d[1] /= l), (d[2] /= l)
}
export function centroid(
  object: qt.ExtendedFeature | qt.ExtendedFeatureCollection | qt.GeoGeometryObjects | qt.ExtendedGeometryCollection
): qt.Point {
  W0 = W1 = X0 = Y0 = Z0 = X1 = Y1 = Z1 = 0
  X2 = new Adder()
  Y2 = new Adder()
  Z2 = new Adder()
  stream(object, centroid.stream)
  let x = +X2,
    y = +Y2,
    z = +Z2,
    m = qu.hypot(x, y, z)
  if (m < qu.epsilon2) {
    ;(x = X1), (y = Y1), (z = Z1)
    if (W1 < qu.epsilon) (x = X0), (y = Y0), (z = Z0)
    m = qu.hypot(x, y, z)
    if (m < qu.epsilon2) return [NaN, NaN]
  }
  return [qu.atan2(y, x) * qu.degrees, asin(z / m) * qu.degrees]
}
export namespace centroid {
  let W0,
    W1,
    X0,
    Y0,
    Z0,
    X1,
    Y1,
    Z1,
    X2,
    Y2,
    Z2,
    lambda00,
    phi00, // first point
    x0,
    y0,
    z0 // previous point
  export const stream = {
    sphere: noop,
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
  function point(lambda, phi) {
    ;(lambda *= qu.radians), (phi *= qu.radians)
    const cosPhi = qu.cos(phi)
    pointCartesian(cosPhi * qu.cos(lambda), cosPhi * qu.sin(lambda), qu.sin(phi))
  }
  function pointCartesian(x, y, z) {
    ++W0
    X0 += (x - X0) / W0
    Y0 += (y - Y0) / W0
    Z0 += (z - Z0) / W0
  }
  function lineStart() {
    stream.point = linePointFirst
  }
  function linePointFirst(lambda: number, phi: number) {
    ;(lambda *= qu.radians), (phi *= qu.radians)
    const cosPhi = qu.cos(phi)
    x0 = cosPhi * qu.cos(lambda)
    y0 = cosPhi * qu.sin(lambda)
    z0 = qu.sin(phi)
    stream.point = linePoint
    pointCartesian(x0, y0, z0)
  }
  function linePoint(lambda: number, phi: number) {
    ;(lambda *= qu.radians), (phi *= qu.radians)
    let cosPhi = qu.cos(phi),
      x = cosPhi * qu.cos(lambda),
      y = cosPhi * qu.sin(lambda),
      z = qu.sin(phi),
      w = qu.atan2(
        qu.sqrt((w = y0 * z - z0 * y) * w + (w = z0 * x - x0 * z) * w + (w = x0 * y - y0 * x) * w),
        x0 * x + y0 * y + z0 * z
      )
    W1 += w
    X1 += w * (x0 + (x0 = x))
    Y1 += w * (y0 + (y0 = y))
    Z1 += w * (z0 + (z0 = z))
    pointCartesian(x0, y0, z0)
  }
  function lineEnd() {
    stream.point = point
  }
  function ringStart() {
    stream.point = ringPointFirst
  }
  function ringEnd() {
    ringPoint(lambda00, phi00)
    stream.point = point
  }
  function ringPointFirst(lambda: number, phi: number) {
    ;(lambda00 = lambda), (phi00 = phi)
    ;(lambda *= qu.radians), (phi *= qu.radians)
    stream.point = ringPoint
    const cosPhi = qu.cos(phi)
    x0 = cosPhi * qu.cos(lambda)
    y0 = cosPhi * qu.sin(lambda)
    z0 = qu.sin(phi)
    pointCartesian(x0, y0, z0)
  }
  function ringPoint(lambda: number, phi: number) {
    ;(lambda *= qu.radians), (phi *= qu.radians)
    const cosPhi = qu.cos(phi),
      x = cosPhi * qu.cos(lambda),
      y = cosPhi * qu.sin(lambda),
      z = qu.sin(phi),
      cx = y0 * z - z0 * y,
      cy = z0 * x - x0 * z,
      cz = x0 * y - y0 * x,
      m = qu.hypot(cx, cy, cz),
      w = asin(m), // line weight = angle
      v = m && -w / m // area weight multiplier
    X2.add(v * cx)
    Y2.add(v * cy)
    Z2.add(v * cz)
    W1 += w
    X1 += w * (x0 + (x0 = x))
    Y1 += w * (y0 + (y0 = y))
    Z1 += w * (z0 + (z0 = z))
    pointCartesian(x0, y0, z0)
  }
}
export function circle(): qt.GeoCircleGenerator
export function circle<T>(): qt.GeoCircleGenerator<any, T>
export function circle<This, T>(): qt.GeoCircleGenerator<This, T>
export function circle() {
  let center = qu.constant([0, 0]),
    radius = qu.constant(90),
    precision = qu.constant(6),
    ring,
    rotate,
    stream = { point: point }
  function point(x, y) {
    ring.push((x = rotate(x, y)))
    ;(x[0] *= qu.degrees), (x[1] *= qu.degrees)
  }
  function circle() {
    let c = center.apply(this, arguments),
      r = radius.apply(this, arguments) * qu.radians,
      p = precision.apply(this, arguments) * qu.radians
    ring = []
    rotate = rotateRadians(-c[0] * qu.radians, -c[1] * qu.radians, 0).invert
    circleStream(stream, r, p, 1)
    c = { type: "Polygon", coordinates: [ring] }
    ring = rotate = null
    return c
  }
  circle.center = function (_) {
    return arguments.length ? ((center = typeof _ === "function" ? _ : qu.constant([+_[0], +_[1]])), circle) : center
  }
  circle.radius = function (_) {
    return arguments.length ? ((radius = typeof _ === "function" ? _ : qu.constant(+_)), circle) : radius
  }
  circle.precision = function (_) {
    return arguments.length ? ((precision = typeof _ === "function" ? _ : qu.constant(+_)), circle) : precision
  }
  return circle
}
export namespace circle {
  export function stream(stream, radius, delta, direction, t0, t1) {
    if (!delta) return
    const cosRadius = qu.cos(radius),
      sinRadius = qu.sin(radius),
      step = direction * delta
    if (t0 == null) {
      t0 = radius + direction * qu.tau
      t1 = radius - step / 2
    } else {
      t0 = radius(cosRadius, t0)
      t1 = radius(cosRadius, t1)
      if (direction > 0 ? t0 < t1 : t0 > t1) t0 += direction * qu.tau
    }
    for (var point, t = t0; direction > 0 ? t > t1 : t < t1; t -= step) {
      point = spherical([cosRadius, -sinRadius * qu.cos(t), -sinRadius * qu.sin(t)])
      stream.point(point[0], point[1])
    }
  }
  function radius(cosRadius, point) {
    ;(point = cartesian(point)), (point[0] -= cosRadius)
    cartesianNormalizeInPlace(point)
    const radius = acos(-point[1])
    return ((-point[2] < 0 ? -radius : radius) + qu.tau - qu.epsilon) % qu.tau
  }
}
export function compose(a, b) {
  function compose(x, y) {
    return (x = a(x, y)), b(x[0], x[1])
  }
  if (a.invert && b.invert)
    compose.invert = function (x, y) {
      return (x = b.invert(x, y)), x && a.invert(x[0], x[1])
    }
  return compose
}
export function contains(
  object: qt.ExtendedFeature | qt.ExtendedFeatureCollection | qt.GeoGeometryObjects | qt.ExtendedGeometryCollection,
  point: qt.Point
): boolean {
  return (
    object && containsObjectType.hasOwnProperty(object.type) ? containsObjectType[object.type] : containsGeometry
  )(object, point)
}
export namespace contains {
  const objType = {
    Feature: function (object, point) {
      return geo(object.geometry, point)
    },
    FeatureCollection: function (object, point) {
      let features = object.features,
        i = -1,
        n = features.length
      while (++i < n) if (geo(features[i].geometry, point)) return true
      return false
    },
  }
  const geoType = {
    Sphere: function () {
      return true
    },
    Point: function (object, point) {
      return point(object.coordinates, point)
    },
    MultiPoint: function (object, point) {
      let coordinates = object.coordinates,
        i = -1,
        n = coordinates.length
      while (++i < n) if (point(coordinates[i], point)) return true
      return false
    },
    LineString: function (object, point) {
      return line(object.coordinates, point)
    },
    MultiLineString: function (object, point) {
      let coordinates = object.coordinates,
        i = -1,
        n = coordinates.length
      while (++i < n) if (line(coordinates[i], point)) return true
      return false
    },
    Polygon: function (object, point) {
      return polygon(object.coordinates, point)
    },
    MultiPolygon: function (object, point) {
      let coordinates = object.coordinates,
        i = -1,
        n = coordinates.length
      while (++i < n) if (polygon(coordinates[i], point)) return true
      return false
    },
    GeometryCollection: function (object, point) {
      let geometries = object.geometries,
        i = -1,
        n = geometries.length
      while (++i < n) if (geo(geometries[i], point)) return true
      return false
    },
  }
  function geo(geometry, point) {
    return geometry && geoType.hasOwnProperty(geometry.type) ? geoType[geometry.type](geometry, point) : false
  }
  function point(coordinates, point) {
    return distance(coordinates, point) === 0
  }
  function line(coordinates, point) {
    let ao, bo, ab
    for (let i = 0, n = coordinates.length; i < n; i++) {
      bo = distance(coordinates[i], point)
      if (bo === 0) return true
      if (i > 0) {
        ab = distance(coordinates[i], coordinates[i - 1])
        if (ab > 0 && ao <= ab && bo <= ab && (ao + bo - ab) * (1 - Math.pow((ao - bo) / ab, 2)) < qu.epsilon2 * ab)
          return true
      }
      ao = bo
    }
    return false
  }
  function polygon(coordinates, point) {
    function pointRadians(point) {
      return [point[0] * qu.radians, point[1] * qu.radians]
    }
    function ringRadians(ring) {
      return (ring = ring.map(pointRadians)), ring.pop(), ring
    }
    return !!polygonContains(coordinates.map(ringRadians), pointRadians(point))
  }
}
const coordinates = [null, null],
  object = { type: "LineString", coordinates: coordinates }
export function distance(a: qt.Point, b: qt.Point): number {
  coordinates[0] = a
  coordinates[1] = b
  return length(object)
}
export function graticule(): qt.GeoGraticuleGenerator {
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
  f.lines = function () {
    return lines().map(function (coordinates) {
      return { type: "LineString", coordinates: coordinates }
    })
  }
  f.outline = function () {
    return {
      type: "Polygon",
      coordinates: [X(X0).concat(Y(Y1).slice(1), X(X1).reverse().slice(1), Y(Y0).reverse().slice(1))],
    }
  }
  f.extent = function (_) {
    if (!arguments.length) return f.extentMinor()
    return f.extentMajor(_).extentMinor(_)
  }
  f.extentMajor = function (_) {
    if (!arguments.length)
      return [
        [X0, Y0],
        [X1, Y1],
      ]
    ;(X0 = +_[0][0]), (X1 = +_[1][0])
    ;(Y0 = +_[0][1]), (Y1 = +_[1][1])
    if (X0 > X1) (_ = X0), (X0 = X1), (X1 = _)
    if (Y0 > Y1) (_ = Y0), (Y0 = Y1), (Y1 = _)
    return f.precision(precision)
  }
  f.extentMinor = function (_) {
    if (!arguments.length)
      return [
        [x0, y0],
        [x1, y1],
      ]
    ;(x0 = +_[0][0]), (x1 = +_[1][0])
    ;(y0 = +_[0][1]), (y1 = +_[1][1])
    if (x0 > x1) (_ = x0), (x0 = x1), (x1 = _)
    if (y0 > y1) (_ = y0), (y0 = y1), (y1 = _)
    return f.precision(precision)
  }
  f.step = function (_) {
    if (!arguments.length) return f.stepMinor()
    return f.stepMajor(_).stepMinor(_)
  }
  f.stepMajor = function (_) {
    if (!arguments.length) return [DX, DY]
    ;(DX = +_[0]), (DY = +_[1])
    return f
  }
  f.stepMinor = function (_) {
    if (!arguments.length) return [dx, dy]
    ;(dx = +_[0]), (dy = +_[1])
    return f
  }
  function graticuleX(y0, y1, dy) {
    const y = range(y0, y1 - qu.epsilon, dy).concat(y1)
    return function (x) {
      return y.map(function (y) {
        return [x, y]
      })
    }
  }
  function graticuleY(x0, x1, dx) {
    const x = range(x0, x1 - qu.epsilon, dx).concat(x1)
    return function (y) {
      return x.map(function (x) {
        return [x, y]
      })
    }
  }
  f.precision = function (_) {
    if (!arguments.length) return precision
    precision = +_
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
    d = 2 * asin(qu.sqrt(haversin(y1 - y0) + cy0 * cy1 * haversin(x1 - x0))),
    k = qu.sin(d)
  const interpolate = d
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
  interpolate.distance = d
  return interpolate
}
export function length(
  object: qt.ExtendedFeature | qt.ExtendedFeatureCollection | qt.GeoGeometryObjects | qt.ExtendedGeometryCollection
): number {
  lengthSum = new Adder()
  stream(object, length.stream)
  return +lengthSum
}
export namespace length {
  var lengthSum, lambda0, sinPhi0, cosPhi0
  export const stream = {
    sphere: noop,
    point: noop,
    lineStart: lineStart,
    lineEnd: noop,
    polygonStart: noop,
    polygonEnd: noop,
  }
  function lineStart() {
    stream.point = pointFirst
    stream.lineEnd = lineEnd
  }
  function lineEnd() {
    stream.point = stream.lineEnd = noop
  }
  function pointFirst(lambda: number, phi: number) {
    ;(lambda *= qu.radians), (phi *= qu.radians)
    ;(lambda0 = lambda), (sinPhi0 = qu.sin(phi)), (cosPhi0 = qu.cos(phi))
    stream.point = point
  }
  function point(lambda: number, phi: number) {
    ;(lambda *= qu.radians), (phi *= qu.radians)
    const sinPhi = qu.sin(phi),
      cosPhi = qu.cos(phi),
      delta = qu.abs(lambda - lambda0),
      cosDelta = qu.cos(delta),
      sinDelta = qu.sin(delta),
      x = cosPhi * sinDelta,
      y = cosPhi0 * sinPhi - sinPhi0 * cosPhi * cosDelta,
      z = sinPhi0 * sinPhi + cosPhi0 * cosPhi * cosDelta
    lengthSum.add(qu.atan2(qu.sqrt(x * x + y * y), z))
    ;(lambda0 = lambda), (sinPhi0 = sinPhi), (cosPhi0 = cosPhi)
  }
}
export const sign =
  Math.sign ||
  function (x) {
    return x > 0 ? 1 : x < 0 ? -1 : 0
  }
export function acos(x) {
  return x > 1 ? 0 : x < -1 ? qu.pi : Math.acos(x)
}
export function asin(x) {
  return x > 1 ? qu.halfPi : x < -1 ? -qu.halfPi : Math.asin(x)
}
export function haversin(x) {
  return (x = qu.sin(x / 2)) * x
}
export function noop() {}
export function pointEqual(a, b) {
  return qu.abs(a[0] - b[0]) < qu.epsilon && qu.abs(a[1] - b[1]) < qu.epsilon
}
function longitude(point) {
  return qu.abs(point[0]) <= qu.pi ? point[0] : sign(point[0]) * (((qu.abs(point[0]) + qu.pi) % qu.tau) - qu.pi)
}
export function polygonContains(polygon, point) {
  let lambda = longitude(point),
    phi = point[1],
    sinPhi = qu.sin(phi),
    normal = [qu.sin(lambda), -qu.cos(lambda), 0],
    angle = 0,
    winding = 0
  const sum = new Adder()
  if (sinPhi === 1) phi = qu.halfPi + qu.epsilon
  else if (sinPhi === -1) phi = -qu.halfPi - qu.epsilon
  for (let i = 0, n = polygon.length; i < n; ++i) {
    if (!(m = (ring = polygon[i]).length)) continue
    var ring,
      m,
      point0 = ring[m - 1],
      lambda0 = longitude(point0),
      phi0 = point0[1] / 2 + qu.quarterPi,
      sinPhi0 = qu.sin(phi0),
      cosPhi0 = qu.cos(phi0)
    for (let j = 0; j < m; ++j, lambda0 = lambda1, sinPhi0 = sinPhi1, cosPhi0 = cosPhi1, point0 = point1) {
      var point1 = ring[j],
        lambda1 = longitude(point1),
        phi1 = point1[1] / 2 + qu.quarterPi,
        sinPhi1 = qu.sin(phi1),
        cosPhi1 = qu.cos(phi1),
        delta = lambda1 - lambda0,
        sign = delta >= 0 ? 1 : -1,
        absDelta = sign * delta,
        antimeridian = absDelta > qu.pi,
        k = sinPhi0 * sinPhi1
      sum.add(qu.atan2(k * sign * qu.sin(absDelta), cosPhi0 * cosPhi1 + k * qu.cos(absDelta)))
      angle += antimeridian ? delta + sign * qu.tau : delta
      if (antimeridian ^ (lambda0 >= lambda) ^ (lambda1 >= lambda)) {
        const arc = cartesianCross(cartesian(point0), cartesian(point1))
        cartesianNormalizeInPlace(arc)
        const intersection = cartesianCross(normal, arc)
        cartesianNormalizeInPlace(intersection)
        const phiArc = (antimeridian ^ (delta >= 0) ? -1 : 1) * asin(intersection[2])
        if (phi > phiArc || (phi === phiArc && (arc[0] || arc[1]))) {
          winding += antimeridian ^ (delta >= 0) ? 1 : -1
        }
      }
    }
  }
  return (angle < -qu.epsilon || (angle < qu.epsilon && sum < -qu.epsilon2)) ^ (winding & 1)
}
export function rotateRadians(deltaLambda, deltaPhi, deltaGamma) {
  return (deltaLambda %= qu.tau)
    ? deltaPhi || deltaGamma
      ? compose(lambda(deltaLambda), phiGamma(deltaPhi, deltaGamma))
      : lambda(deltaLambda)
    : deltaPhi || deltaGamma
    ? phiGamma(deltaPhi, deltaGamma)
    : identity
}
export function rotation(angles: qt.Pair | [number, number, number]): qt.GeoRotation {
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
  function identity(lambda, phi) {
    if (qu.abs(lambda) > qu.pi) lambda -= Math.round(lambda / qu.tau) * qu.tau
    return [lambda, phi]
  }
  identity.invert = identity
  function lambda(deltaLambda) {
    function forward(deltaLambda) {
      return function (lambda, phi) {
        lambda += deltaLambda
        if (qu.abs(lambda) > qu.pi) lambda -= Math.round(lambda / qu.tau) * qu.tau
        return [lambda, phi]
      }
    }
    const rotation = forward(deltaLambda)
    rotation.invert = forward(-deltaLambda)
    return rotation
  }
  function phiGamma(deltaPhi, deltaGamma) {
    const cosDeltaPhi = qu.cos(deltaPhi),
      sinDeltaPhi = qu.sin(deltaPhi),
      cosDeltaGamma = qu.cos(deltaGamma),
      sinDeltaGamma = qu.sin(deltaGamma)
    function rotation(lambda, phi) {
      const cosPhi = qu.cos(phi),
        x = qu.cos(lambda) * cosPhi,
        y = qu.sin(lambda) * cosPhi,
        z = qu.sin(phi),
        k = z * cosDeltaPhi + x * sinDeltaPhi
      return [
        qu.atan2(y * cosDeltaGamma - k * sinDeltaGamma, x * cosDeltaPhi - z * sinDeltaPhi),
        asin(k * cosDeltaGamma + y * sinDeltaGamma),
      ]
    }
    rotation.invert = function (lambda, phi) {
      const cosPhi = qu.cos(phi),
        x = qu.cos(lambda) * cosPhi,
        y = qu.sin(lambda) * cosPhi,
        z = qu.sin(phi),
        k = z * cosDeltaGamma - y * sinDeltaGamma
      return [
        qu.atan2(y * cosDeltaGamma + z * sinDeltaGamma, x * cosDeltaPhi + k * sinDeltaPhi),
        asin(k * cosDeltaPhi - x * sinDeltaPhi),
      ]
    }
    return rotation
  }
}
export function stream(
  object: qt.ExtendedFeature | qt.ExtendedFeatureCollection | qt.GeoGeometryObjects | qt.ExtendedGeometryCollection,
  stream: GeoStream
): void {
  if (object && streamObjectType.hasOwnProperty(object.type)) {
    streamObjectType[object.type](object, stream)
  } else {
    streamGeometry(object, stream)
  }
}
export namespace stream {
  function geo(geometry, stream) {
    if (geometry && geoType.hasOwnProperty(geometry.type)) {
      geoType[geometry.type](geometry, stream)
    }
  }
  const objType = {
    Feature: function (object, stream) {
      geo(object.geometry, stream)
    },
    FeatureCollection: function (object, stream) {
      let features = object.features,
        i = -1,
        n = features.length
      while (++i < n) geo(features[i].geometry, stream)
    },
  }
  const geoType = {
    Sphere: function (object, stream) {
      stream.sphere()
    },
    Point: function (object, stream) {
      object = object.coordinates
      stream.point(object[0], object[1], object[2])
    },
    MultiPoint: function (object, stream) {
      let coordinates = object.coordinates,
        i = -1,
        n = coordinates.length
      while (++i < n) (object = coordinates[i]), stream.point(object[0], object[1], object[2])
    },
    LineString: function (object, stream) {
      line(object.coordinates, stream, 0)
    },
    MultiLineString: function (object, stream) {
      let coordinates = object.coordinates,
        i = -1,
        n = coordinates.length
      while (++i < n) line(coordinates[i], stream, 0)
    },
    Polygon: function (object, stream) {
      polygon(object.coordinates, stream)
    },
    MultiPolygon: function (object, stream) {
      let coordinates = object.coordinates,
        i = -1,
        n = coordinates.length
      while (++i < n) polygon(coordinates[i], stream)
    },
    GeometryCollection: function (object, stream) {
      let geometries = object.geometries,
        i = -1,
        n = geometries.length
      while (++i < n) geo(geometries[i], stream)
    },
  }
  function line(coordinates, stream, closed) {
    let i = -1,
      n = coordinates.length - closed,
      coordinate
    stream.lineStart()
    while (++i < n) (coordinate = coordinates[i]), stream.point(coordinate[0], coordinate[1], coordinate[2])
    stream.lineEnd()
  }
  function polygon(coordinates, stream) {
    let i = -1,
      n = coordinates.length
    stream.polygonStart()
    while (++i < n) line(coordinates[i], stream, 1)
    stream.polygonEnd()
  }
}
export function transform(methods) {
  return {
    stream: transformer(methods),
  }
}
export function transformer(methods) {
  return function (stream) {
    const s = new TransformStream()
    for (const key in methods) s[key] = methods[key]
    s.stream = stream
    return s
  }
}
function TransformStream() {}
TransformStream.prototype = {
  constructor: TransformStream,
  point: function (x, y) {
    this.stream.point(x, y)
  },
  sphere: function () {
    this.stream.sphere()
  },
  lineStart: function () {
    this.stream.lineStart()
  },
  lineEnd: function () {
    this.stream.lineEnd()
  },
  polygonStart: function () {
    this.stream.polygonStart()
  },
  polygonEnd: function () {
    this.stream.polygonEnd()
  },
}

export namespace clip {
  export default clip(
    function () {
      return true
    },
    clipAntimeridianLine,
    clipAntimeridianInterpolate,
    [-pi, -halfPi]
  )
  function clipAntimeridianLine(stream) {
    let lambda0 = NaN,
      phi0 = NaN,
      sign0 = NaN,
      clean // no intersections
    return {
      lineStart: function () {
        stream.lineStart()
        clean = 1
      },
      point: function (lambda1, phi1) {
        const sign1 = lambda1 > 0 ? pi : -pi,
          delta = abs(lambda1 - lambda0)
        if (abs(delta - pi) < epsilon) {
          stream.point(lambda0, (phi0 = (phi0 + phi1) / 2 > 0 ? halfPi : -halfPi))
          stream.point(sign0, phi0)
          stream.lineEnd()
          stream.lineStart()
          stream.point(sign1, phi0)
          stream.point(lambda1, phi0)
          clean = 0
        } else if (sign0 !== sign1 && delta >= pi) {
          if (abs(lambda0 - sign0) < epsilon) lambda0 -= sign0 * epsilon // handle degeneracies
          if (abs(lambda1 - sign1) < epsilon) lambda1 -= sign1 * epsilon
          phi0 = clipAntimeridianIntersect(lambda0, phi0, lambda1, phi1)
          stream.point(sign0, phi0)
          stream.lineEnd()
          stream.lineStart()
          stream.point(sign1, phi0)
          clean = 0
        }
        stream.point((lambda0 = lambda1), (phi0 = phi1))
        sign0 = sign1
      },
      lineEnd: function () {
        stream.lineEnd()
        lambda0 = phi0 = NaN
      },
      clean: function () {
        return 2 - clean // if intersections, rejoin first and last segments
      },
    }
  }
  function clipAntimeridianIntersect(lambda0, phi0, lambda1, phi1) {
    let cosPhi0,
      cosPhi1,
      sinLambda0Lambda1 = sin(lambda0 - lambda1)
    return abs(sinLambda0Lambda1) > epsilon
      ? atan(
          (sin(phi0) * (cosPhi1 = cos(phi1)) * sin(lambda1) - sin(phi1) * (cosPhi0 = cos(phi0)) * sin(lambda0)) /
            (cosPhi0 * cosPhi1 * sinLambda0Lambda1)
        )
      : (phi0 + phi1) / 2
  }
  function clipAntimeridianInterpolate(from, to, direction, stream) {
    let phi
    if (from == null) {
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
    } else if (abs(from[0] - to[0]) > epsilon) {
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
      lineEnd: noop,
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
  export function circle(radius) {
    const cr = cos(radius),
      delta = 6 * radians,
      smallRadius = cr > 0,
      notHemisphere = abs(cr) > epsilon // TODO optimise for this common case
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
        n2 = cartesianCross(pa, pb),
        n2n2 = cartesianDot(n2, n2),
        n1n2 = n2[0], // cartesianDot(n1, n2),
        determinant = n2n2 - n1n2 * n1n2
      if (!determinant) return !two && a
      const c1 = (cr * n2n2) / determinant,
        c2 = (-cr * n1n2) / determinant,
        n1xn2 = cartesianCross(n1, n2),
        A = cartesianScale(n1, c1),
        B = cartesianScale(n2, c2)
      cartesianAddInPlace(A, B)
      const u = n1xn2,
        w = cartesianDot(A, u),
        uu = cartesianDot(u, u),
        t2 = w * w - uu * (cartesianDot(A, A) - 1)
      if (t2 < 0) return
      let t = sqrt(t2),
        q = cartesianScale(u, (-w - t) / uu)
      cartesianAddInPlace(q, A)
      q = spherical(q)
      if (!two) return q
      let lambda0 = a[0],
        lambda1 = b[0],
        phi0 = a[1],
        phi1 = b[1],
        z
      if (lambda1 < lambda0) (z = lambda0), (lambda0 = lambda1), (lambda1 = z)
      const delta = lambda1 - lambda0,
        polar = abs(delta - pi) < epsilon,
        meridian = polar || delta < epsilon
      if (!polar && phi1 < phi0) (z = phi0), (phi0 = phi1), (phi1 = z)
      if (
        meridian
          ? polar
            ? (phi0 + phi1 > 0) ^ (q[1] < (abs(q[0] - lambda0) < epsilon ? phi0 : phi1))
            : phi0 <= q[1] && q[1] <= phi1
          : (delta > pi) ^ (lambda0 <= q[0] && q[0] <= lambda1)
      ) {
        const q1 = cartesianScale(u, (-w + t) / uu)
        cartesianAddInPlace(q1, A)
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
      var clip = {
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
  export function clipRectangle(x0, y0, x1, y1) {
    function visible(x, y) {
      return x0 <= x && x <= x1 && y0 <= y && y <= y1
    }
    function interpolate(from, to, direction, stream) {
      let a = 0,
        a1 = 0
      if (
        from == null ||
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
      return abs(p[0] - x0) < epsilon
        ? direction > 0
          ? 0
          : 3
        : abs(p[0] - x1) < epsilon
        ? direction > 0
          ? 2
          : 1
        : abs(p[1] - y0) < epsilon
        ? direction > 0
          ? 1
          : 0
        : direction > 0
        ? 3
        : 2 // abs(p[1] - y1) < epsilon
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
            const a = [
                (x_ = Math.max(clipMin, Math.min(clipMax, x_))),
                (y_ = Math.max(clipMin, Math.min(clipMax, y_))),
              ],
              b = [(x = Math.max(clipMin, Math.min(clipMax, x))), (y = Math.max(clipMin, Math.min(clipMax, y)))]
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
    point: noop,
    lineStart: noop,
    lineEnd: noop,
    polygonStart: function () {
      areaStream.lineStart = areaRingStart
      areaStream.lineEnd = areaRingEnd
    },
    polygonEnd: function () {
      areaStream.lineStart = areaStream.lineEnd = areaStream.point = noop
      areaSum.add(abs(areaRingSum))
      areaRingSum = new Adder()
    },
    result: function () {
      const area = areaSum / 2
      areaSum = new Adder()
      return area
    },
  }
  function areaRingStart() {
    areaStream.point = areaPointFirst
  }
  function areaPointFirst(x, y) {
    areaStream.point = areaPoint
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
    lineStart: noop,
    lineEnd: noop,
    polygonStart: noop,
    polygonEnd: noop,
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
    result = noop
  }
  export function path(projection, context) {
    let pointRadius = 4.5,
      projectionStream,
      contextStream
    function path(object) {
      if (object) {
        if (typeof pointRadius === "function") contextStream.pointRadius(+pointRadius.apply(this, arguments))
        stream(object, projectionStream(contextStream))
      }
      return contextStream.result()
    }
    path.area = function (object) {
      stream(object, projectionStream(pathArea))
      return pathArea.result()
    }
    path.measure = function (object) {
      stream(object, projectionStream(pathMeasure))
      return pathMeasure.result()
    }
    path.bounds = function (object) {
      stream(object, projectionStream(pathBounds))
      return pathBounds.result()
    }
    path.centroid = function (object) {
      stream(object, projectionStream(pathCentroid))
      return pathCentroid.result()
    }
    path.projection = function (_) {
      return arguments.length
        ? ((projectionStream = _ == null ? ((projection = null), identity) : (projection = _).stream), path)
        : projection
    }
    path.context = function (_) {
      if (!arguments.length) return context
      contextStream = _ == null ? ((context = null), new PathString()) : new PathContext((context = _))
      if (typeof pointRadius !== "function") contextStream.pointRadius(pointRadius)
      return path
    }
    path.pointRadius = function (_) {
      if (!arguments.length) return pointRadius
      pointRadius = typeof _ === "function" ? _ : (contextStream.pointRadius(+_), +_)
      return path
    }
    return path.projection(projection).context(context)
  }
  let lengthSum = new Adder(),
    lengthRing,
    x00,
    y00,
    x0,
    y0
  let lengthStream = {
    point: noop,
    lineStart: function () {
      lengthStream.point = lengthPointFirst
    },
    lineEnd: function () {
      if (lengthRing) lengthPoint(x00, y00)
      lengthStream.point = noop
    },
    polygonStart: function () {
      lengthRing = true
    },
    polygonEnd: function () {
      lengthRing = null
    },
    result: function () {
      const length = +lengthSum
      lengthSum = new Adder()
      return length
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
          if (this._circle == null) this._circle = circle(this._radius)
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
    function raw(scale): GeoRawProjection {
      return function (x, y) {
        const cx = cos(x),
          cy = cos(y),
          k = scale(cx * cy)
        if (k === Infinity) return [2, 0]
        return [k * cy * sin(x), k * sin(y)]
      }
    }
    export function invert(angle) {
      return function (x, y) {
        const z = sqrt(x * x + y * y),
          c = angle(z),
          sc = sin(c),
          cc = cos(c)
        return [atan2(x * sc, z * cc), asin(z && (y * sc) / z)]
      }
    }
    export const equalAreaRaw = raw(cxcy => sqrt(2 / (1 + cxcy)))
    equalAreaRaw.invert = invert(z => 2 * asin(z / 2))
    export function equalArea() {
      return projection(equalAreaRaw)
        .scale(124.75)
        .clipAngle(180 - 1e-3)
    }
    export const equidistantRaw = raw(c => (c = acos(c)) && c / sin(c))
    equidistantRaw.invert = invert(z => z)
    export function equidistant() {
      return projection(equidistantRaw)
        .scale(79.4188)
        .clipAngle(180 - 1e-3)
    }
  }
  export function conic(projectAt): GeoConicProjection {
    let phi0 = 0,
      phi1 = pi / 3
    const m = mutator(projectAt),
      p = m(phi0, phi1)
    p.parallels = function (_) {
      return arguments.length ? m((phi0 = _[0] * radians), (phi1 = _[1] * radians)) : [phi0 * degrees, phi1 * degrees]
    }
    return p
  }
  export namespace conic {
    export function conformalRaw(y0: number, y1: number): GeoRawProjection {
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
      f.invert = function (x, y) {
        const py = p - y,
          r = sign(n) * sqrt(x * x + py * py)
        let l = atan2(x, abs(py)) * sign(py)
        if (py * n < 0) l -= pi * sign(x) * sign(py)
        return [l / n, 2 * atan(pow(p / r, 1 / n)) - halfPi]
      }
      return f
    }
    export const conformal = () => conic(conformalRaw).scale(109.5).parallels([30, 30])
    export function equalAreaRaw(y0, y1): GeoRawProjection {
      const sy0 = sin(y0),
        n = (sy0 + sin(y1)) / 2
      if (abs(n) < epsilon) return cylindrical.equalAreaRaw(y0)
      const c = 1 + sy0 * (2 * n - sy0),
        r0 = sqrt(c) / n
      function f(x, y) {
        const r = sqrt(c - 2 * n * sin(y)) / n
        return [r * sin((x *= n)), r0 - r * cos(x)]
      }
      f.invert = function (x, y) {
        const r0y = r0 - y
        let l = atan2(x, abs(r0y)) * sign(r0y)
        if (r0y * n < 0) l -= pi * sign(x) * sign(r0y)
        return [l / n, asin((c - (x * x + r0y * r0y) * n * n) / (2 * n))]
      }
      return f
    }
    export const equalArea = () => conic(equalAreaRaw).scale(155.424).center([0, 33.6442])
    export function equidistantRaw(y0, y1): GeoRawProjection {
      const cy0 = cos(y0),
        n = y0 === y1 ? sin(y0) : (cy0 - cos(y1)) / (y1 - y0),
        g = cy0 / n + y0
      if (abs(n) < epsilon) return equirectangularRaw
      function f(x, y) {
        const gy = g - y,
          nx = n * x
        return [gy * sin(nx), g - gy * cos(nx)]
      }
      f.invert = function (x, y) {
        const gy = g - y
        let l = atan2(x, abs(gy)) * sign(gy)
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
      f.invert = function (x, y) {
        return [x / cosPhi0, asin(y * cosPhi0)]
      }
      return f
    }
  }
  export function albers(): GeoConicProjection {
    return conic
      .equalArea()
      .parallels([29.5, 45.5])
      .scale(1070)
      .translate([480, 250])
      .rotate([96, 0])
      .center([-0.6, 38.7])
  }
  export function albersUsa(): GeoProjection {
    let cache,
      cacheStream,
      lower48 = albers(),
      lower48Point,
      alaska = conic.equalArea().rotate([154, 0]).center([-2, 58.5]).parallels([55, 65]),
      alaskaPoint, // EPSG:3338
      hawaii = conic.equalArea().rotate([157, 0]).center([-3, 19.9]).parallels([8, 18]),
      hawaiiPoint, // ESRI:102007
      point,
      pointStream = {
        point: function (x, y) {
          point = [x, y]
        },
      }
    function f(coordinates) {
      const x = coordinates[0],
        y = coordinates[1]
      return (
        (point = null),
        (lower48Point.point(x, y), point) || (alaskaPoint.point(x, y), point) || (hawaiiPoint.point(x, y), point)
      )
    }
    function multiplex(streams) {
      const n = streams.length
      return {
        point: function (x, y) {
          let i = -1
          while (++i < n) streams[i].point(x, y)
        },
        sphere: function () {
          let i = -1
          while (++i < n) streams[i].sphere()
        },
        lineStart: function () {
          let i = -1
          while (++i < n) streams[i].lineStart()
        },
        lineEnd: function () {
          let i = -1
          while (++i < n) streams[i].lineEnd()
        },
        polygonStart: function () {
          let i = -1
          while (++i < n) streams[i].polygonStart()
        },
        polygonEnd: function () {
          let i = -1
          while (++i < n) streams[i].polygonEnd()
        },
      }
    }
    f.invert = function (coordinates) {
      const k = lower48.scale(),
        t = lower48.translate(),
        x = (coordinates[0] - t[0]) / k,
        y = (coordinates[1] - t[1]) / k
      return (
        y >= 0.12 && y < 0.234 && x >= -0.425 && x < -0.214
          ? alaska
          : y >= 0.166 && y < 0.234 && x >= -0.214 && x < -0.115
          ? hawaii
          : lower48
      ).invert(coordinates)
    }
    f.stream = function (stream) {
      return cache && cacheStream === stream
        ? cache
        : (cache = multiplex([lower48.stream((cacheStream = stream)), alaska.stream(stream), hawaii.stream(stream)]))
    }
    f.precision = function (_) {
      if (!arguments.length) return lower48.precision()
      lower48.precision(_), alaska.precision(_), hawaii.precision(_)
      return reset()
    }
    f.scale = function (_) {
      if (!arguments.length) return lower48.scale()
      lower48.scale(_), alaska.scale(_ * 0.35), hawaii.scale(_)
      return f.translate(lower48.translate())
    }
    f.translate = function (_) {
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
    function reset() {
      cache = cacheStream = null
      return f
    }
    return f.scale(1070)
  }
  const A1 = 1.340264,
    A2 = -0.081106,
    A3 = 0.000893,
    A4 = 0.003796,
    M = sqrt(3) / 2,
    iterations = 12

  export function equalEarthRaw(lambda, phi): GeoRawProjection {
    const l = asin(M * sin(phi)),
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
    for (var i = 0, delta, fy, fpy; i < iterations; ++i) {
      fy = l * (A1 + A2 * l2 + l6 * (A3 + A4 * l2)) - y
      fpy = A1 + 3 * A2 * l2 + l6 * (7 * A3 + 9 * A4 * l2)
      ;(l -= delta = fy / fpy), (l2 = l * l), (l6 = l2 * l2 * l2)
      if (abs(delta) < epsilon2) break
    }
    return [(M * x * (A1 + 3 * A2 * l2 + l6 * (7 * A3 + 9 * A4 * l2))) / cos(l), asin(sin(l) / M)]
  }
  export function equalEarth() {
    return projection(equalEarthRaw).scale(177.158)
  }
  export function equirectangularRaw(lambda, phi): GeoRawProjection {
    return [lambda, phi]
  }
  equirectangularRaw.invert = equirectangularRaw
  export function equirectangular() {
    return projection(equirectangularRaw).scale(152.63)
  }
  export function gnomonicRaw(x, y): qt.GeoRawProjection {
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
    f.invert = function (p) {
      let x = p[0] - tx,
        y = p[1] - ty
      if (alpha) {
        const t = y * ca + x * sa
        x = x * ca - y * sa
        y = t
      }
      return [x / kx, y / ky]
    }
    f.stream = function (stream) {
      return cache && cacheStream === stream ? cache : (cache = transform(postclip((cacheStream = stream))))
    }
    f.postclip = function (_) {
      return arguments.length ? ((postclip = _), (x0 = y0 = x1 = y1 = null), reset()) : postclip
    }
    f.clipExtent = function (_) {
      return arguments.length
        ? ((postclip =
            _ == null
              ? ((x0 = y0 = x1 = y1 = null), qu.identity)
              : clipRectangle((x0 = +_[0][0]), (y0 = +_[0][1]), (x1 = +_[1][0]), (y1 = +_[1][1]))),
          reset())
        : x0 == null
        ? null
        : [
            [x0, y0],
            [x1, y1],
          ]
    }
    f.scale = function (_) {
      return arguments.length ? ((k = +_), reset()) : k
    }
    f.translate = function (_) {
      return arguments.length ? ((tx = +_[0]), (ty = +_[1]), reset()) : [tx, ty]
    }
    f.angle = function (_) {
      return arguments.length
        ? ((alpha = (_ % 360) * radians), (sa = sin(alpha)), (ca = cos(alpha)), reset())
        : alpha * degrees
    }
    f.reflectX = function (_) {
      return arguments.length ? ((sx = _ ? -1 : 1), reset()) : sx < 0
    }
    f.reflectY = function (_) {
      return arguments.length ? ((sy = _ ? -1 : 1), reset()) : sy < 0
    }
    f.fitExtent = (extent, x) => fit.extent(f, extent, x)
    f.fitSize = (size, x) => fit.size(f, size, x)
    f.fitWidth = (width, x) => fit.width(f, width, x)
    f.fitHeight = (height, x) => fit.height(f, height, x)
    return f
  }
  const transformRadians = transformer({
    point: function (x, y) {
      this.stream.point(x * radians, y * radians)
    },
  })
  function transformRotate(rotate) {
    return transformer({
      point: function (x, y) {
        const r = rotate(x, y)
        return this.stream.point(r[0], r[1])
      },
    })
  }
  function scaleTranslate(k, dx, dy, sx, sy) {
    function transform(x, y) {
      x *= sx
      y *= sy
      return [dx + k * x, dy - k * y]
    }
    transform.invert = function (x, y) {
      return [((x - dx) / k) * sx, ((dy - y) / k) * sy]
    }
    return transform
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
    function transform(x, y) {
      x *= sx
      y *= sy
      return [a * x - b * y + dx, dy - b * x - a * y]
    }
    transform.invert = function (x, y) {
      return [sx * (ai * x - bi * y + ci), sy * (fi - bi * x - ai * y)]
    }
    return transform
  }
  export function projection(x: GeoRawProjection): GeoProjection {
    return mutator(() => x)()
  }
  export function mutator(projectAt: (...xs: any[]) => GeoRawProjection): () => GeoProjection {
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
    function f(point) {
      return projectRotateTransform(point[0] * radians, point[1] * radians)
    }
    function invert(point) {
      point = projectRotateTransform.invert(point[0], point[1])
      return point && [point[0] * degrees, point[1] * degrees]
    }
    f.stream = function (stream) {
      return cache && cacheStream === stream
        ? cache
        : (cache = transformRadians(
            transformRotate(rotate)(preclip(projectResample(postclip((cacheStream = stream)))))
          ))
    }
    f.preclip = function (_) {
      return arguments.length ? ((preclip = _), (theta = undefined), reset()) : preclip
    }
    f.postclip = function (_) {
      return arguments.length ? ((postclip = _), (x0 = y0 = x1 = y1 = null), reset()) : postclip
    }
    f.clipAngle = function (_) {
      return arguments.length
        ? ((preclip = +_ ? clipCircle((theta = _ * radians)) : ((theta = null), clipAntimeridian)), reset())
        : theta * degrees
    }
    f.clipExtent = function (_) {
      return arguments.length
        ? ((postclip =
            _ == null
              ? ((x0 = y0 = x1 = y1 = null), qu.identity)
              : clipRectangle((x0 = +_[0][0]), (y0 = +_[0][1]), (x1 = +_[1][0]), (y1 = +_[1][1]))),
          reset())
        : x0 == null
        ? null
        : [
            [x0, y0],
            [x1, y1],
          ]
    }
    f.scale = function (_) {
      return arguments.length ? ((k = +_), recenter()) : k
    }
    f.translate = function (_) {
      return arguments.length ? ((x = +_[0]), (y = +_[1]), recenter()) : [x, y]
    }
    f.center = function (_) {
      return arguments.length
        ? ((lambda = (_[0] % 360) * radians), (phi = (_[1] % 360) * radians), recenter())
        : [lambda * degrees, phi * degrees]
    }
    f.rotate = function (_) {
      return arguments.length
        ? ((deltaLambda = (_[0] % 360) * radians),
          (deltaPhi = (_[1] % 360) * radians),
          (deltaGamma = _.length > 2 ? (_[2] % 360) * radians : 0),
          recenter())
        : [deltaLambda * degrees, deltaPhi * degrees, deltaGamma * degrees]
    }
    f.angle = function (_) {
      return arguments.length ? ((alpha = (_ % 360) * radians), recenter()) : alpha * degrees
    }
    f.reflectX = function (_) {
      return arguments.length ? ((sx = _ ? -1 : 1), recenter()) : sx < 0
    }
    f.reflectY = function (_) {
      return arguments.length ? ((sy = _ ? -1 : 1), recenter()) : sy < 0
    }
    f.precision = function (_) {
      return arguments.length
        ? ((projectResample = resample(projectTransform, (delta2 = _ * _))), reset())
        : sqrt(delta2)
    }
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
    return function (xs: any[]) {
      project = projectAt.apply(this, xs)
      f.invert = project.invert && invert
      return recenter()
    }
  }
  export function mercatorRaw(lambda, phi): GeoRawProjection {
    return [lambda, log(tan((halfPi + phi) / 2))]
  }
  mercatorRaw.invert = function (x, y) {
    return [x, 2 * atan(exp(y)) - halfPi]
  }
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
        ? (xs == null
            ? (x0 = y0 = x1 = y1 = null)
            : ((x0 = +xs[0][0]), (y0 = +xs[0][1]), (x1 = +xs[1][0]), (y1 = +xs[1][1])),
          reclip())
        : x0 == null
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
        x0 == null
          ? [
              [t[0] - k, t[1] - k],
              [t[0] + k, t[1] + k],
            ]
          : project === mercatorRaw
          ? [
              [Math.max(t[0] - k, x0), y0],
              [Math.min(t[0] + k, x1), y1],
            ]
          : [
              [x0, Math.max(t[1] - k, y0)],
              [x1, Math.min(t[1] + k, y1)],
            ]
      )
    }
    return reclip()
  }
  export function naturalEarth1Raw(lambda, phi): GeoRawProjection {
    const phi2 = phi * phi,
      phi4 = phi2 * phi2
    return [
      lambda * (0.8707 - 0.131979 * phi2 + phi4 * (-0.013791 + phi4 * (0.003971 * phi2 - 0.001529 * phi4))),
      phi * (1.007226 + phi2 * (0.015085 + phi4 * (-0.044475 + 0.028874 * phi2 - 0.005916 * phi4))),
    ]
  }
  naturalEarth1Raw.invert = function (x, y) {
    let phi = y,
      i = 25,
      delta
    do {
      const phi2 = phi * phi,
        phi4 = phi2 * phi2
      phi -= delta =
        (phi * (1.007226 + phi2 * (0.015085 + phi4 * (-0.044475 + 0.028874 * phi2 - 0.005916 * phi4))) - y) /
        (1.007226 + phi2 * (0.015085 * 3 + phi4 * (-0.044475 * 7 + 0.028874 * 9 * phi2 - 0.005916 * 11 * phi4)))
    } while (abs(delta) > epsilon && --i > 0)
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
  export function orthographicRaw(x, y): GeoRawProjection {
    return [cos(y) * sin(x), sin(y)]
  }
  orthographicRaw.invert = azimuthal.invert(asin)
  export function orthographic() {
    return projection(orthographicRaw)
      .scale(249.5)
      .clipAngle(90 + epsilon)
  }
  const maxDepth = 16, // maximum depth of subdivision
    cosMinDistance = cos(30 * radians) // cos(minimum angular distance)
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
      function resampleLineTo(x0, y0, lambda0, a0, b0, c0, x1, y1, lambda1, a1, b1, c1, depth, stream) {
        const dx = x1 - x0,
          dy = y1 - y0,
          d2 = dx * dx + dy * dy
        if (d2 > 4 * delta2 && depth--) {
          let a = a0 + a1,
            b = b0 + b1,
            c = c0 + c1,
            m = sqrt(a * a + b * b + c * c),
            phi2 = asin((c /= m)),
            lambda2 =
              abs(abs(c) - 1) < epsilon || abs(lambda0 - lambda1) < epsilon ? (lambda0 + lambda1) / 2 : atan2(b, a),
            p = project(lambda2, phi2),
            x2 = p[0],
            y2 = p[1],
            dx2 = x2 - x0,
            dy2 = y2 - y0,
            dz = dy * dx2 - dx * dy2
          if (
            (dz * dz) / d2 > delta2 || // perpendicular projected distance
            abs((dx * dx2 + dy * dy2) / d2 - 0.5) > 0.3 || // midpoint close to an end
            a0 * a1 + b0 * b1 + c0 * c1 < cosMinDistance
          ) {
            resampleLineTo(x0, y0, lambda0, a0, b0, c0, x2, y2, lambda2, (a /= m), (b /= m), c, depth, stream)
            stream.point(x2, y2)
            resampleLineTo(x2, y2, lambda2, a, b, c, x1, y1, lambda1, a1, b1, c1, depth, stream)
          }
        }
      }
      return function (stream) {
        let lambda00,
          x00,
          y00,
          a00,
          b00,
          c00, // first point
          lambda0,
          x0,
          y0,
          a0,
          b0,
          c0 // previous point
        var resampleStream = {
          point: point,
          lineStart: lineStart,
          lineEnd: lineEnd,
          polygonStart: function () {
            stream.polygonStart()
            resampleStream.lineStart = ringStart
          },
          polygonEnd: function () {
            stream.polygonEnd()
            resampleStream.lineStart = lineStart
          },
        }
        function point(x, y) {
          x = project(x, y)
          stream.point(x[0], x[1])
        }
        function lineStart() {
          x0 = NaN
          resampleStream.point = linePoint
          stream.lineStart()
        }
        function linePoint(lambda, phi) {
          const c = cartesian([lambda, phi]),
            p = project(lambda, phi)
          resampleLineTo(
            x0,
            y0,
            lambda0,
            a0,
            b0,
            c0,
            (x0 = p[0]),
            (y0 = p[1]),
            (lambda0 = lambda),
            (a0 = c[0]),
            (b0 = c[1]),
            (c0 = c[2]),
            maxDepth,
            stream
          )
          stream.point(x0, y0)
        }
        function lineEnd() {
          resampleStream.point = point
          stream.lineEnd()
        }
        function ringStart() {
          lineStart()
          resampleStream.point = ringPoint
          resampleStream.lineEnd = ringEnd
        }
        function ringPoint(lambda, phi) {
          linePoint((lambda00 = lambda), phi), (x00 = x0), (y00 = y0), (a00 = a0), (b00 = b0), (c00 = c0)
          resampleStream.point = linePoint
        }
        function ringEnd() {
          resampleLineTo(x0, y0, lambda0, a0, b0, c0, x00, y00, lambda00, a00, b00, c00, maxDepth, stream)
          resampleStream.lineEnd = lineEnd
          lineEnd()
        }
        return resampleStream
      }
    }
    return +delta2 ? resample(project, delta2) : resampleNone(project)
  }
  export function stereographicRaw(x, y): GeoRawProjection {
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
  export function transverseMercatorRaw(lambda, phi): GeoRawProjection {
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
    export function extent(f, extent, x) {
      return fit(
        f,
        function (b) {
          const w = extent[1][0] - extent[0][0],
            h = extent[1][1] - extent[0][1],
            k = Math.min(w / (b[1][0] - b[0][0]), h / (b[1][1] - b[0][1])),
            x = +extent[0][0] + (w - k * (b[1][0] + b[0][0])) / 2,
            y = +extent[0][1] + (h - k * (b[1][1] + b[0][1])) / 2
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
