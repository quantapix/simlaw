import { Adder, range } from "./utils_seq.js"
import type * as qt from "./types.js"
import * as qu from "./utils.js"

export const areaRingSum = new Adder()
var areaSum = new Adder(),
  lambda00,
  phi00,
  lambda0,
  cosPhi0,
  sinPhi0
export const areaStream = {
  point: noop,
  lineStart: noop,
  lineEnd: noop,
  polygonStart: function () {
    areaRingSum = new Adder()
    areaStream.lineStart = areaRingStart
    areaStream.lineEnd = areaRingEnd
  },
  polygonEnd: function () {
    let areaRing = +areaRingSum
    areaSum.add(areaRing < 0 ? tau + areaRing : areaRing)
    this.lineStart = this.lineEnd = this.point = noop
  },
  sphere: function () {
    areaSum.add(tau)
  },
}
function areaRingStart() {
  areaStream.point = areaPointFirst
}
function areaRingEnd() {
  areaPoint(lambda00, phi00)
}
function areaPointFirst(lambda, phi) {
  areaStream.point = areaPoint
  ;(lambda00 = lambda), (phi00 = phi)
  ;(lambda *= radians), (phi *= radians)
  ;(lambda0 = lambda), (cosPhi0 = cos((phi = phi / 2 + quarterPi))), (sinPhi0 = sin(phi))
}
function areaPoint(lambda, phi) {
  ;(lambda *= radians), (phi *= radians)
  phi = phi / 2 + quarterPi // half the angular distance from south pole
  let dLambda = lambda - lambda0,
    sdLambda = dLambda >= 0 ? 1 : -1,
    adLambda = sdLambda * dLambda,
    cosPhi = cos(phi),
    sinPhi = sin(phi),
    k = sinPhi0 * sinPhi,
    u = cosPhi0 * cosPhi + k * cos(adLambda),
    v = k * sdLambda * sin(adLambda)
  areaRingSum.add(atan2(v, u))
  ;(lambda0 = lambda), (cosPhi0 = cosPhi), (sinPhi0 = sinPhi)
}
export function area(object) {
  areaSum = new Adder()
  stream(object, areaStream)
  return areaSum * 2
}
var lambda0,
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
var boundsStream = {
  point: boundsPoint,
  lineStart: boundsLineStart,
  lineEnd: boundsLineEnd,
  polygonStart: function () {
    boundsStream.point = boundsRingPoint
    boundsStream.lineStart = boundsRingStart
    boundsStream.lineEnd = boundsRingEnd
    deltaSum = new Adder()
    areaStream.polygonStart()
  },
  polygonEnd: function () {
    areaStream.polygonEnd()
    boundsStream.point = boundsPoint
    boundsStream.lineStart = boundsLineStart
    boundsStream.lineEnd = boundsLineEnd
    if (areaRingSum < 0) (lambda0 = -(lambda1 = 180)), (phi0 = -(phi1 = 90))
    else if (deltaSum > epsilon) phi1 = 90
    else if (deltaSum < -epsilon) phi0 = -90
    ;(range[0] = lambda0), (range[1] = lambda1)
  },
  sphere: function () {
    ;(lambda0 = -(lambda1 = 180)), (phi0 = -(phi1 = 90))
  },
}
function boundsPoint(lambda, phi) {
  ranges.push((range = [(lambda0 = lambda), (lambda1 = lambda)]))
  if (phi < phi0) phi0 = phi
  if (phi > phi1) phi1 = phi
}
function linePoint(lambda, phi) {
  let p = cartesian([lambda * radians, phi * radians])
  if (p0) {
    let normal = cartesianCross(p0, p),
      equatorial = [normal[1], -normal[0], 0],
      inflection = cartesianCross(equatorial, normal)
    cartesianNormalizeInPlace(inflection)
    inflection = spherical(inflection)
    let delta = lambda - lambda2,
      sign = delta > 0 ? 1 : -1,
      lambdai = inflection[0] * degrees * sign,
      phii,
      antimeridian = abs(delta) > 180
    if (antimeridian ^ (sign * lambda2 < lambdai && lambdai < sign * lambda)) {
      phii = inflection[1] * degrees
      if (phii > phi1) phi1 = phii
    } else if (
      ((lambdai = ((lambdai + 360) % 360) - 180), antimeridian ^ (sign * lambda2 < lambdai && lambdai < sign * lambda))
    ) {
      phii = -inflection[1] * degrees
      if (phii < phi0) phi0 = phii
    } else {
      if (phi < phi0) phi0 = phi
      if (phi > phi1) phi1 = phi
    }
    if (antimeridian) {
      if (lambda < lambda2) {
        if (angle(lambda0, lambda) > angle(lambda0, lambda1)) lambda1 = lambda
      } else {
        if (angle(lambda, lambda1) > angle(lambda0, lambda1)) lambda0 = lambda
      }
    } else {
      if (lambda1 >= lambda0) {
        if (lambda < lambda0) lambda0 = lambda
        if (lambda > lambda1) lambda1 = lambda
      } else {
        if (lambda > lambda2) {
          if (angle(lambda0, lambda) > angle(lambda0, lambda1)) lambda1 = lambda
        } else {
          if (angle(lambda, lambda1) > angle(lambda0, lambda1)) lambda0 = lambda
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
function boundsLineStart() {
  boundsStream.point = linePoint
}
function boundsLineEnd() {
  ;(range[0] = lambda0), (range[1] = lambda1)
  boundsStream.point = boundsPoint
  p0 = null
}
function boundsRingPoint(lambda, phi) {
  if (p0) {
    let delta = lambda - lambda2
    deltaSum.add(abs(delta) > 180 ? delta + (delta > 0 ? 360 : -360) : delta)
  } else {
    ;(lambda00 = lambda), (phi00 = phi)
  }
  areaStream.point(lambda, phi)
  linePoint(lambda, phi)
}
function boundsRingStart() {
  areaStream.lineStart()
}
function boundsRingEnd() {
  boundsRingPoint(lambda00, phi00)
  areaStream.lineEnd()
  if (abs(deltaSum) > epsilon) lambda0 = -(lambda1 = 180)
  ;(range[0] = lambda0), (range[1] = lambda1)
  p0 = null
}
function angle(lambda0, lambda1) {
  return (lambda1 -= lambda0) < 0 ? lambda1 + 360 : lambda1
}
function rangeCompare(a, b) {
  return a[0] - b[0]
}
function rangeContains(range, x) {
  return range[0] <= range[1] ? range[0] <= x && x <= range[1] : x < range[0] || range[1] < x
}
export function bounds(feature) {
  let i, n, a, b, merged, deltaMax, delta
  phi1 = lambda1 = -(lambda0 = phi0 = Infinity)
  ranges = []
  stream(feature, boundsStream)
  if ((n = ranges.length)) {
    ranges.sort(rangeCompare)
    for (i = 1, a = ranges[0], merged = [a]; i < n; ++i) {
      b = ranges[i]
      if (rangeContains(a, b[0]) || rangeContains(a, b[1])) {
        if (angle(a[0], b[1]) > angle(a[0], a[1])) a[1] = b[1]
        if (angle(b[0], a[1]) > angle(a[0], a[1])) a[0] = b[0]
      } else {
        merged.push((a = b))
      }
    }
    for (deltaMax = -Infinity, n = merged.length - 1, i = 0, a = merged[n]; i <= n; a = b, ++i) {
      b = merged[i]
      if ((delta = angle(a[1], b[0])) > deltaMax) (deltaMax = delta), (lambda0 = b[0]), (lambda1 = a[1])
    }
  }
  ranges = range = null
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
export function spherical(cartesian) {
  return [atan2(cartesian[1], cartesian[0]), asin(cartesian[2])]
}
export function cartesian(spherical) {
  let lambda = spherical[0],
    phi = spherical[1],
    cosPhi = cos(phi)
  return [cosPhi * cos(lambda), cosPhi * sin(lambda), sin(phi)]
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
  let l = sqrt(d[0] * d[0] + d[1] * d[1] + d[2] * d[2])
  ;(d[0] /= l), (d[1] /= l), (d[2] /= l)
}
var W0,
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
var centroidStream = {
  sphere: noop,
  point: centroidPoint,
  lineStart: centroidLineStart,
  lineEnd: centroidLineEnd,
  polygonStart: function () {
    centroidStream.lineStart = centroidRingStart
    centroidStream.lineEnd = centroidRingEnd
  },
  polygonEnd: function () {
    centroidStream.lineStart = centroidLineStart
    centroidStream.lineEnd = centroidLineEnd
  },
}
function centroidPoint(lambda, phi) {
  ;(lambda *= radians), (phi *= radians)
  let cosPhi = cos(phi)
  centroidPointCartesian(cosPhi * cos(lambda), cosPhi * sin(lambda), sin(phi))
}
function centroidPointCartesian(x, y, z) {
  ++W0
  X0 += (x - X0) / W0
  Y0 += (y - Y0) / W0
  Z0 += (z - Z0) / W0
}
function centroidLineStart() {
  centroidStream.point = centroidLinePointFirst
}
function centroidLinePointFirst(lambda, phi) {
  ;(lambda *= radians), (phi *= radians)
  let cosPhi = cos(phi)
  x0 = cosPhi * cos(lambda)
  y0 = cosPhi * sin(lambda)
  z0 = sin(phi)
  centroidStream.point = centroidLinePoint
  centroidPointCartesian(x0, y0, z0)
}
function centroidLinePoint(lambda, phi) {
  ;(lambda *= radians), (phi *= radians)
  var cosPhi = cos(phi),
    x = cosPhi * cos(lambda),
    y = cosPhi * sin(lambda),
    z = sin(phi),
    w = atan2(
      sqrt((w = y0 * z - z0 * y) * w + (w = z0 * x - x0 * z) * w + (w = x0 * y - y0 * x) * w),
      x0 * x + y0 * y + z0 * z
    )
  W1 += w
  X1 += w * (x0 + (x0 = x))
  Y1 += w * (y0 + (y0 = y))
  Z1 += w * (z0 + (z0 = z))
  centroidPointCartesian(x0, y0, z0)
}
function centroidLineEnd() {
  centroidStream.point = centroidPoint
}
function centroidRingStart() {
  centroidStream.point = centroidRingPointFirst
}
function centroidRingEnd() {
  centroidRingPoint(lambda00, phi00)
  centroidStream.point = centroidPoint
}
function centroidRingPointFirst(lambda, phi) {
  ;(lambda00 = lambda), (phi00 = phi)
  ;(lambda *= radians), (phi *= radians)
  centroidStream.point = centroidRingPoint
  let cosPhi = cos(phi)
  x0 = cosPhi * cos(lambda)
  y0 = cosPhi * sin(lambda)
  z0 = sin(phi)
  centroidPointCartesian(x0, y0, z0)
}
function centroidRingPoint(lambda, phi) {
  ;(lambda *= radians), (phi *= radians)
  let cosPhi = cos(phi),
    x = cosPhi * cos(lambda),
    y = cosPhi * sin(lambda),
    z = sin(phi),
    cx = y0 * z - z0 * y,
    cy = z0 * x - x0 * z,
    cz = x0 * y - y0 * x,
    m = hypot(cx, cy, cz),
    w = asin(m), // line weight = angle
    v = m && -w / m // area weight multiplier
  X2.add(v * cx)
  Y2.add(v * cy)
  Z2.add(v * cz)
  W1 += w
  X1 += w * (x0 + (x0 = x))
  Y1 += w * (y0 + (y0 = y))
  Z1 += w * (z0 + (z0 = z))
  centroidPointCartesian(x0, y0, z0)
}
export function centroid(object) {
  W0 = W1 = X0 = Y0 = Z0 = X1 = Y1 = Z1 = 0
  X2 = new Adder()
  Y2 = new Adder()
  Z2 = new Adder()
  stream(object, centroidStream)
  let x = +X2,
    y = +Y2,
    z = +Z2,
    m = hypot(x, y, z)
  if (m < epsilon2) {
    ;(x = X1), (y = Y1), (z = Z1)
    if (W1 < epsilon) (x = X0), (y = Y0), (z = Z0)
    m = hypot(x, y, z)
    if (m < epsilon2) return [NaN, NaN]
  }
  return [atan2(y, x) * degrees, asin(z / m) * degrees]
}
export function circleStream(stream, radius, delta, direction, t0, t1) {
  if (!delta) return
  let cosRadius = cos(radius),
    sinRadius = sin(radius),
    step = direction * delta
  if (t0 == null) {
    t0 = radius + direction * tau
    t1 = radius - step / 2
  } else {
    t0 = circleRadius(cosRadius, t0)
    t1 = circleRadius(cosRadius, t1)
    if (direction > 0 ? t0 < t1 : t0 > t1) t0 += direction * tau
  }
  for (var point, t = t0; direction > 0 ? t > t1 : t < t1; t -= step) {
    point = spherical([cosRadius, -sinRadius * cos(t), -sinRadius * sin(t)])
    stream.point(point[0], point[1])
  }
}
function circleRadius(cosRadius, point) {
  ;(point = cartesian(point)), (point[0] -= cosRadius)
  cartesianNormalizeInPlace(point)
  let radius = acos(-point[1])
  return ((-point[2] < 0 ? -radius : radius) + tau - epsilon) % tau
}
export function circle() {
  let center = qu.constant([0, 0]),
    radius = qu.constant(90),
    precision = qu.constant(6),
    ring,
    rotate,
    stream = { point: point }
  function point(x, y) {
    ring.push((x = rotate(x, y)))
    ;(x[0] *= degrees), (x[1] *= degrees)
  }
  function circle() {
    let c = center.apply(this, arguments),
      r = radius.apply(this, arguments) * radians,
      p = precision.apply(this, arguments) * radians
    ring = []
    rotate = rotateRadians(-c[0] * radians, -c[1] * radians, 0).invert
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
let containsObjectType = {
  Feature: function (object, point) {
    return containsGeometry(object.geometry, point)
  },
  FeatureCollection: function (object, point) {
    let features = object.features,
      i = -1,
      n = features.length
    while (++i < n) if (containsGeometry(features[i].geometry, point)) return true
    return false
  },
}
let containsGeometryType = {
  Sphere: function () {
    return true
  },
  Point: function (object, point) {
    return containsPoint(object.coordinates, point)
  },
  MultiPoint: function (object, point) {
    let coordinates = object.coordinates,
      i = -1,
      n = coordinates.length
    while (++i < n) if (containsPoint(coordinates[i], point)) return true
    return false
  },
  LineString: function (object, point) {
    return containsLine(object.coordinates, point)
  },
  MultiLineString: function (object, point) {
    let coordinates = object.coordinates,
      i = -1,
      n = coordinates.length
    while (++i < n) if (containsLine(coordinates[i], point)) return true
    return false
  },
  Polygon: function (object, point) {
    return containsPolygon(object.coordinates, point)
  },
  MultiPolygon: function (object, point) {
    let coordinates = object.coordinates,
      i = -1,
      n = coordinates.length
    while (++i < n) if (containsPolygon(coordinates[i], point)) return true
    return false
  },
  GeometryCollection: function (object, point) {
    let geometries = object.geometries,
      i = -1,
      n = geometries.length
    while (++i < n) if (containsGeometry(geometries[i], point)) return true
    return false
  },
}
function containsGeometry(geometry, point) {
  return geometry && containsGeometryType.hasOwnProperty(geometry.type)
    ? containsGeometryType[geometry.type](geometry, point)
    : false
}
function containsPoint(coordinates, point) {
  return distance(coordinates, point) === 0
}
function containsLine(coordinates, point) {
  let ao, bo, ab
  for (let i = 0, n = coordinates.length; i < n; i++) {
    bo = distance(coordinates[i], point)
    if (bo === 0) return true
    if (i > 0) {
      ab = distance(coordinates[i], coordinates[i - 1])
      if (ab > 0 && ao <= ab && bo <= ab && (ao + bo - ab) * (1 - Math.pow((ao - bo) / ab, 2)) < epsilon2 * ab)
        return true
    }
    ao = bo
  }
  return false
}
function containsPolygon(coordinates, point) {
  return !!polygonContains(coordinates.map(ringRadians), pointRadians(point))
}
function ringRadians(ring) {
  return (ring = ring.map(pointRadians)), ring.pop(), ring
}
function pointRadians(point) {
  return [point[0] * radians, point[1] * radians]
}
export function contains(object, point) {
  return (
    object && containsObjectType.hasOwnProperty(object.type) ? containsObjectType[object.type] : containsGeometry
  )(object, point)
}
let coordinates = [null, null],
  object = { type: "LineString", coordinates: coordinates }
export function distance(a, b) {
  coordinates[0] = a
  coordinates[1] = b
  return length(object)
}
function graticuleX(y0, y1, dy) {
  let y = range(y0, y1 - epsilon, dy).concat(y1)
  return function (x) {
    return y.map(function (y) {
      return [x, y]
    })
  }
}
function graticuleY(x0, x1, dx) {
  let x = range(x0, x1 - epsilon, dx).concat(x1)
  return function (y) {
    return x.map(function (x) {
      return [x, y]
    })
  }
}
export function graticule() {
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
  function graticule() {
    return { type: "MultiLineString", coordinates: lines() }
  }
  function lines() {
    return range(ceil(X0 / DX) * DX, X1, DX)
      .map(X)
      .concat(range(ceil(Y0 / DY) * DY, Y1, DY).map(Y))
      .concat(
        range(ceil(x0 / dx) * dx, x1, dx)
          .filter(function (x) {
            return abs(x % DX) > epsilon
          })
          .map(x)
      )
      .concat(
        range(ceil(y0 / dy) * dy, y1, dy)
          .filter(function (y) {
            return abs(y % DY) > epsilon
          })
          .map(y)
      )
  }
  graticule.lines = function () {
    return lines().map(function (coordinates) {
      return { type: "LineString", coordinates: coordinates }
    })
  }
  graticule.outline = function () {
    return {
      type: "Polygon",
      coordinates: [X(X0).concat(Y(Y1).slice(1), X(X1).reverse().slice(1), Y(Y0).reverse().slice(1))],
    }
  }
  graticule.extent = function (_) {
    if (!arguments.length) return graticule.extentMinor()
    return graticule.extentMajor(_).extentMinor(_)
  }
  graticule.extentMajor = function (_) {
    if (!arguments.length)
      return [
        [X0, Y0],
        [X1, Y1],
      ]
    ;(X0 = +_[0][0]), (X1 = +_[1][0])
    ;(Y0 = +_[0][1]), (Y1 = +_[1][1])
    if (X0 > X1) (_ = X0), (X0 = X1), (X1 = _)
    if (Y0 > Y1) (_ = Y0), (Y0 = Y1), (Y1 = _)
    return graticule.precision(precision)
  }
  graticule.extentMinor = function (_) {
    if (!arguments.length)
      return [
        [x0, y0],
        [x1, y1],
      ]
    ;(x0 = +_[0][0]), (x1 = +_[1][0])
    ;(y0 = +_[0][1]), (y1 = +_[1][1])
    if (x0 > x1) (_ = x0), (x0 = x1), (x1 = _)
    if (y0 > y1) (_ = y0), (y0 = y1), (y1 = _)
    return graticule.precision(precision)
  }
  graticule.step = function (_) {
    if (!arguments.length) return graticule.stepMinor()
    return graticule.stepMajor(_).stepMinor(_)
  }
  graticule.stepMajor = function (_) {
    if (!arguments.length) return [DX, DY]
    ;(DX = +_[0]), (DY = +_[1])
    return graticule
  }
  graticule.stepMinor = function (_) {
    if (!arguments.length) return [dx, dy]
    ;(dx = +_[0]), (dy = +_[1])
    return graticule
  }
  graticule.precision = function (_) {
    if (!arguments.length) return precision
    precision = +_
    x = graticuleX(y0, y1, 90)
    y = graticuleY(x0, x1, precision)
    X = graticuleX(Y0, Y1, 90)
    Y = graticuleY(X0, X1, precision)
    return graticule
  }
  return graticule
    .extentMajor([
      [-180, -90 + epsilon],
      [180, 90 - epsilon],
    ])
    .extentMinor([
      [-180, -80 - epsilon],
      [180, 80 + epsilon],
    ])
}
export function graticule10() {
  return graticule()()
}
export function interpolate(a, b) {
  let x0 = a[0] * radians,
    y0 = a[1] * radians,
    x1 = b[0] * radians,
    y1 = b[1] * radians,
    cy0 = cos(y0),
    sy0 = sin(y0),
    cy1 = cos(y1),
    sy1 = sin(y1),
    kx0 = cy0 * cos(x0),
    ky0 = cy0 * sin(x0),
    kx1 = cy1 * cos(x1),
    ky1 = cy1 * sin(x1),
    d = 2 * asin(sqrt(haversin(y1 - y0) + cy0 * cy1 * haversin(x1 - x0))),
    k = sin(d)
  let interpolate = d
    ? function (t) {
        let B = sin((t *= d)) / k,
          A = sin(d - t) / k,
          x = A * kx0 + B * kx1,
          y = A * ky0 + B * ky1,
          z = A * sy0 + B * sy1
        return [atan2(y, x) * degrees, atan2(z, sqrt(x * x + y * y)) * degrees]
      }
    : function () {
        return [x0 * degrees, y0 * degrees]
      }
  interpolate.distance = d
  return interpolate
}
var lengthSum, lambda0, sinPhi0, cosPhi0
let lengthStream = {
  sphere: noop,
  point: noop,
  lineStart: lengthLineStart,
  lineEnd: noop,
  polygonStart: noop,
  polygonEnd: noop,
}
function lengthLineStart() {
  lengthStream.point = lengthPointFirst
  lengthStream.lineEnd = lengthLineEnd
}
function lengthLineEnd() {
  lengthStream.point = lengthStream.lineEnd = noop
}
function lengthPointFirst(lambda, phi) {
  ;(lambda *= radians), (phi *= radians)
  ;(lambda0 = lambda), (sinPhi0 = sin(phi)), (cosPhi0 = cos(phi))
  lengthStream.point = lengthPoint
}
function lengthPoint(lambda, phi) {
  ;(lambda *= radians), (phi *= radians)
  let sinPhi = sin(phi),
    cosPhi = cos(phi),
    delta = abs(lambda - lambda0),
    cosDelta = cos(delta),
    sinDelta = sin(delta),
    x = cosPhi * sinDelta,
    y = cosPhi0 * sinPhi - sinPhi0 * cosPhi * cosDelta,
    z = sinPhi0 * sinPhi + cosPhi0 * cosPhi * cosDelta
  lengthSum.add(atan2(sqrt(x * x + y * y), z))
  ;(lambda0 = lambda), (sinPhi0 = sinPhi), (cosPhi0 = cosPhi)
}
export function length(object) {
  lengthSum = new Adder()
  stream(object, lengthStream)
  return +lengthSum
}
export const epsilon = 1e-6
export const epsilon2 = 1e-12
export const pi = Math.PI
export const halfPi = pi / 2
export const quarterPi = pi / 4
export const tau = pi * 2
export const degrees = 180 / pi
export const radians = pi / 180
export const abs = Math.abs
export const atan = Math.atan
export const atan2 = Math.atan2
export const cos = Math.cos
export const ceil = Math.ceil
export const exp = Math.exp
export const floor = Math.floor
export const hypot = Math.hypot
export const log = Math.log
export const pow = Math.pow
export const sin = Math.sin
export const sign =
  Math.sign ||
  function (x) {
    return x > 0 ? 1 : x < 0 ? -1 : 0
  }
export const sqrt = Math.sqrt
export const tan = Math.tan
export function acos(x) {
  return x > 1 ? 0 : x < -1 ? pi : Math.acos(x)
}
export function asin(x) {
  return x > 1 ? halfPi : x < -1 ? -halfPi : Math.asin(x)
}
export function haversin(x) {
  return (x = sin(x / 2)) * x
}
export function noop() {}
export function pointEqual(a, b) {
  return abs(a[0] - b[0]) < epsilon && abs(a[1] - b[1]) < epsilon
}
function longitude(point) {
  return abs(point[0]) <= pi ? point[0] : sign(point[0]) * (((abs(point[0]) + pi) % tau) - pi)
}
export function polygonContains(polygon, point) {
  let lambda = longitude(point),
    phi = point[1],
    sinPhi = sin(phi),
    normal = [sin(lambda), -cos(lambda), 0],
    angle = 0,
    winding = 0
  let sum = new Adder()
  if (sinPhi === 1) phi = halfPi + epsilon
  else if (sinPhi === -1) phi = -halfPi - epsilon
  for (let i = 0, n = polygon.length; i < n; ++i) {
    if (!(m = (ring = polygon[i]).length)) continue
    var ring,
      m,
      point0 = ring[m - 1],
      lambda0 = longitude(point0),
      phi0 = point0[1] / 2 + quarterPi,
      sinPhi0 = sin(phi0),
      cosPhi0 = cos(phi0)
    for (let j = 0; j < m; ++j, lambda0 = lambda1, sinPhi0 = sinPhi1, cosPhi0 = cosPhi1, point0 = point1) {
      var point1 = ring[j],
        lambda1 = longitude(point1),
        phi1 = point1[1] / 2 + quarterPi,
        sinPhi1 = sin(phi1),
        cosPhi1 = cos(phi1),
        delta = lambda1 - lambda0,
        sign = delta >= 0 ? 1 : -1,
        absDelta = sign * delta,
        antimeridian = absDelta > pi,
        k = sinPhi0 * sinPhi1
      sum.add(atan2(k * sign * sin(absDelta), cosPhi0 * cosPhi1 + k * cos(absDelta)))
      angle += antimeridian ? delta + sign * tau : delta
      if (antimeridian ^ (lambda0 >= lambda) ^ (lambda1 >= lambda)) {
        let arc = cartesianCross(cartesian(point0), cartesian(point1))
        cartesianNormalizeInPlace(arc)
        let intersection = cartesianCross(normal, arc)
        cartesianNormalizeInPlace(intersection)
        let phiArc = (antimeridian ^ (delta >= 0) ? -1 : 1) * asin(intersection[2])
        if (phi > phiArc || (phi === phiArc && (arc[0] || arc[1]))) {
          winding += antimeridian ^ (delta >= 0) ? 1 : -1
        }
      }
    }
  }
  return (angle < -epsilon || (angle < epsilon && sum < -epsilon2)) ^ (winding & 1)
}
function rotationIdentity(lambda, phi) {
  if (abs(lambda) > pi) lambda -= Math.round(lambda / tau) * tau
  return [lambda, phi]
}
rotationIdentity.invert = rotationIdentity
export function rotateRadians(deltaLambda, deltaPhi, deltaGamma) {
  return (deltaLambda %= tau)
    ? deltaPhi || deltaGamma
      ? compose(rotationLambda(deltaLambda), rotationPhiGamma(deltaPhi, deltaGamma))
      : rotationLambda(deltaLambda)
    : deltaPhi || deltaGamma
    ? rotationPhiGamma(deltaPhi, deltaGamma)
    : rotationIdentity
}
function forwardRotationLambda(deltaLambda) {
  return function (lambda, phi) {
    lambda += deltaLambda
    if (abs(lambda) > pi) lambda -= Math.round(lambda / tau) * tau
    return [lambda, phi]
  }
}
function rotationLambda(deltaLambda) {
  let rotation = forwardRotationLambda(deltaLambda)
  rotation.invert = forwardRotationLambda(-deltaLambda)
  return rotation
}
function rotationPhiGamma(deltaPhi, deltaGamma) {
  let cosDeltaPhi = cos(deltaPhi),
    sinDeltaPhi = sin(deltaPhi),
    cosDeltaGamma = cos(deltaGamma),
    sinDeltaGamma = sin(deltaGamma)
  function rotation(lambda, phi) {
    let cosPhi = cos(phi),
      x = cos(lambda) * cosPhi,
      y = sin(lambda) * cosPhi,
      z = sin(phi),
      k = z * cosDeltaPhi + x * sinDeltaPhi
    return [
      atan2(y * cosDeltaGamma - k * sinDeltaGamma, x * cosDeltaPhi - z * sinDeltaPhi),
      asin(k * cosDeltaGamma + y * sinDeltaGamma),
    ]
  }
  rotation.invert = function (lambda, phi) {
    let cosPhi = cos(phi),
      x = cos(lambda) * cosPhi,
      y = sin(lambda) * cosPhi,
      z = sin(phi),
      k = z * cosDeltaGamma - y * sinDeltaGamma
    return [
      atan2(y * cosDeltaGamma + z * sinDeltaGamma, x * cosDeltaPhi + k * sinDeltaPhi),
      asin(k * cosDeltaPhi - x * sinDeltaPhi),
    ]
  }
  return rotation
}
export function rotation(rotate) {
  rotate = rotateRadians(rotate[0] * radians, rotate[1] * radians, rotate.length > 2 ? rotate[2] * radians : 0)
  function forward(coordinates) {
    coordinates = rotate(coordinates[0] * radians, coordinates[1] * radians)
    return (coordinates[0] *= degrees), (coordinates[1] *= degrees), coordinates
  }
  forward.invert = function (coordinates) {
    coordinates = rotate.invert(coordinates[0] * radians, coordinates[1] * radians)
    return (coordinates[0] *= degrees), (coordinates[1] *= degrees), coordinates
  }
  return forward
}
function streamGeometry(geometry, stream) {
  if (geometry && streamGeometryType.hasOwnProperty(geometry.type)) {
    streamGeometryType[geometry.type](geometry, stream)
  }
}
let streamObjectType = {
  Feature: function (object, stream) {
    streamGeometry(object.geometry, stream)
  },
  FeatureCollection: function (object, stream) {
    let features = object.features,
      i = -1,
      n = features.length
    while (++i < n) streamGeometry(features[i].geometry, stream)
  },
}
var streamGeometryType = {
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
    streamLine(object.coordinates, stream, 0)
  },
  MultiLineString: function (object, stream) {
    let coordinates = object.coordinates,
      i = -1,
      n = coordinates.length
    while (++i < n) streamLine(coordinates[i], stream, 0)
  },
  Polygon: function (object, stream) {
    streamPolygon(object.coordinates, stream)
  },
  MultiPolygon: function (object, stream) {
    let coordinates = object.coordinates,
      i = -1,
      n = coordinates.length
    while (++i < n) streamPolygon(coordinates[i], stream)
  },
  GeometryCollection: function (object, stream) {
    let geometries = object.geometries,
      i = -1,
      n = geometries.length
    while (++i < n) streamGeometry(geometries[i], stream)
  },
}
function streamLine(coordinates, stream, closed) {
  let i = -1,
    n = coordinates.length - closed,
    coordinate
  stream.lineStart()
  while (++i < n) (coordinate = coordinates[i]), stream.point(coordinate[0], coordinate[1], coordinate[2])
  stream.lineEnd()
}
function streamPolygon(coordinates, stream) {
  let i = -1,
    n = coordinates.length
  stream.polygonStart()
  while (++i < n) streamLine(coordinates[i], stream, 1)
  stream.polygonEnd()
}
export function stream(object, stream) {
  if (object && streamObjectType.hasOwnProperty(object.type)) {
    streamObjectType[object.type](object, stream)
  } else {
    streamGeometry(object, stream)
  }
}
export function transform(methods) {
  return {
    stream: transformer(methods),
  }
}
export function transformer(methods) {
  return function (stream) {
    let s = new TransformStream()
    for (let key in methods) s[key] = methods[key]
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
  import {
    cartesian,
    cartesianAddInPlace,
    cartesianCross,
    cartesianDot,
    cartesianScale,
    spherical,
  } from "../cartesian.js"
  import { abs, atan, cos, epsilon, halfPi, pi, sin, radians, sqrt } from "../math.js"
  import { circleStream } from "../circle.js"
  import { merge } from "./array.js"
  import noop from "../noop.js"
  import pointEqual from "../pointEqual.js"
  import polygonContains from "../polygonContains.js"

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
        let sign1 = lambda1 > 0 ? pi : -pi,
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
      let lambda = from[0] < to[0] ? pi : -pi
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
        let result = lines
        lines = []
        line = null
        return result
      },
    }
  }
  export function circle(radius) {
    let cr = cos(radius),
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
      let pa = cartesian(a),
        pb = cartesian(b)
      let n1 = [1, 0, 0], // normal
        n2 = cartesianCross(pa, pb),
        n2n2 = cartesianDot(n2, n2),
        n1n2 = n2[0], // cartesianDot(n1, n2),
        determinant = n2n2 - n1n2 * n1n2
      if (!determinant) return !two && a
      let c1 = (cr * n2n2) / determinant,
        c2 = (-cr * n1n2) / determinant,
        n1xn2 = cartesianCross(n1, n2),
        A = cartesianScale(n1, c1),
        B = cartesianScale(n2, c2)
      cartesianAddInPlace(A, B)
      let u = n1xn2,
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
      let delta = lambda1 - lambda0,
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
        let q1 = cartesianScale(u, (-w + t) / uu)
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
          let startInside = polygonContains(polygon, start)
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
  let clipMax = 1e9,
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
      let ca = corner(a, 1),
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
      let clipStream = {
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
        let startInside = polygonInside(),
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
        let v = visible(x, y)
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
            let a = [(x_ = Math.max(clipMin, Math.min(clipMax, x_))), (y_ = Math.max(clipMin, Math.min(clipMax, y_)))],
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
  import { abs, sqrt, tau } from "../math.js"
  import { Adder } from "./array.js"
  import noop from "../noop.js"
  import stream from "../stream.js"

  var areaSum = new Adder(),
    areaRingSum = new Adder(),
    x00,
    y00,
    x0,
    y0
  var areaStream = {
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
      let area = areaSum / 2
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
  var x0 = Infinity,
    y0 = x0,
    x1 = -x0,
    y1 = x1
  let boundsStream = {
    point: boundsPoint,
    lineStart: noop,
    lineEnd: noop,
    polygonStart: noop,
    polygonEnd: noop,
    result: function () {
      let bounds = [
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
  var X0 = 0,
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
  var centroidStream = {
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
      let centroid = Z2 ? [X2 / Z2, Y2 / Z2] : Z1 ? [X1 / Z1, Y1 / Z1] : Z0 ? [X0 / Z0, Y0 / Z0] : [NaN, NaN]
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
    let dx = x - x0,
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
  var lengthSum = new Adder(),
    lengthRing,
    x00,
    y00,
    x0,
    y0
  var lengthStream = {
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
      let length = +lengthSum
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
        let result = this._string.join("")
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
  import { abs, asin, atan2, cos, epsilon, epsilon2, pi, pow, sign, sin, sqrt } from "../math.js"
  import { acos, tau, degrees, radians } from "../math.js"
  import { atan, exp, halfPi, log, tan } from "../math.js"
  import { cartesian } from "../cartesian.js"
  import { default as geoStream } from "../stream.js"
  import { rotateRadians } from "../rotation.js"
  import { transformer } from "../transform.js"
  import boundsStream from "../path/bounds.js"
  import clipAntimeridian from "../clip/antimeridian.js"
  import clipCircle from "../clip/circle.js"
  import clipRectangle from "../clip/rectangle.js"
  import compose from "../compose.js"
  import identity from "../identity.js"
  import rotation from "../rotation.js"

  export function albers() {
    return conicEqualArea()
      .parallels([29.5, 45.5])
      .scale(1070)
      .translate([480, 250])
      .rotate([96, 0])
      .center([-0.6, 38.7])
  }
  function multiplex(streams) {
    let n = streams.length
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
  export function albersUsa() {
    let cache,
      cacheStream,
      lower48 = albers(),
      lower48Point,
      alaska = conicEqualArea().rotate([154, 0]).center([-2, 58.5]).parallels([55, 65]),
      alaskaPoint, // EPSG:3338
      hawaii = conicEqualArea().rotate([157, 0]).center([-3, 19.9]).parallels([8, 18]),
      hawaiiPoint, // ESRI:102007
      point,
      pointStream = {
        point: function (x, y) {
          point = [x, y]
        },
      }
    function albersUsa(coordinates) {
      let x = coordinates[0],
        y = coordinates[1]
      return (
        (point = null),
        (lower48Point.point(x, y), point) || (alaskaPoint.point(x, y), point) || (hawaiiPoint.point(x, y), point)
      )
    }
    albersUsa.invert = function (coordinates) {
      let k = lower48.scale(),
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
    albersUsa.stream = function (stream) {
      return cache && cacheStream === stream
        ? cache
        : (cache = multiplex([lower48.stream((cacheStream = stream)), alaska.stream(stream), hawaii.stream(stream)]))
    }
    albersUsa.precision = function (_) {
      if (!arguments.length) return lower48.precision()
      lower48.precision(_), alaska.precision(_), hawaii.precision(_)
      return reset()
    }
    albersUsa.scale = function (_) {
      if (!arguments.length) return lower48.scale()
      lower48.scale(_), alaska.scale(_ * 0.35), hawaii.scale(_)
      return albersUsa.translate(lower48.translate())
    }
    albersUsa.translate = function (_) {
      if (!arguments.length) return lower48.translate()
      let k = lower48.scale(),
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
    albersUsa.fitExtent = function (extent, object) {
      return fitExtent(albersUsa, extent, object)
    }
    albersUsa.fitSize = function (size, object) {
      return fitSize(albersUsa, size, object)
    }
    albersUsa.fitWidth = function (width, object) {
      return fitWidth(albersUsa, width, object)
    }
    albersUsa.fitHeight = function (height, object) {
      return fitHeight(albersUsa, height, object)
    }
    function reset() {
      cache = cacheStream = null
      return albersUsa
    }
    return albersUsa.scale(1070)
  }
  export function azimuthalRaw(scale) {
    return function (x, y) {
      let cx = cos(x),
        cy = cos(y),
        k = scale(cx * cy)
      if (k === Infinity) return [2, 0]
      return [k * cy * sin(x), k * sin(y)]
    }
  }
  export function azimuthalInvert(angle) {
    return function (x, y) {
      let z = sqrt(x * x + y * y),
        c = angle(z),
        sc = sin(c),
        cc = cos(c)
      return [atan2(x * sc, z * cc), asin(z && (y * sc) / z)]
    }
  }
  export const azimuthalEqualAreaRaw = azimuthalRaw(function (cxcy) {
    return sqrt(2 / (1 + cxcy))
  })
  azimuthalEqualAreaRaw.invert = azimuthalInvert(function (z) {
    return 2 * asin(z / 2)
  })
  export function azimuthalEqualArea() {
    return projection(azimuthalEqualAreaRaw)
      .scale(124.75)
      .clipAngle(180 - 1e-3)
  }
  export const azimuthalEquidistantRaw = azimuthalRaw(function (c) {
    return (c = acos(c)) && c / sin(c)
  })
  azimuthalEquidistantRaw.invert = azimuthalInvert(function (z) {
    return z
  })
  export function azimuthalEquidistant() {
    return projection(azimuthalEquidistantRaw)
      .scale(79.4188)
      .clipAngle(180 - 1e-3)
  }
  export function conicProjection(projectAt) {
    let phi0 = 0,
      phi1 = pi / 3,
      m = projectionMutator(projectAt),
      p = m(phi0, phi1)
    p.parallels = function (_) {
      return arguments.length ? m((phi0 = _[0] * radians), (phi1 = _[1] * radians)) : [phi0 * degrees, phi1 * degrees]
    }
    return p
  }
  function tany(y) {
    return tan((halfPi + y) / 2)
  }
  export function conicConformalRaw(y0, y1) {
    let cy0 = cos(y0),
      n = y0 === y1 ? sin(y0) : log(cy0 / cos(y1)) / log(tany(y1) / tany(y0)),
      f = (cy0 * pow(tany(y0), n)) / n
    if (!n) return mercatorRaw
    function project(x, y) {
      if (f > 0) {
        if (y < -halfPi + epsilon) y = -halfPi + epsilon
      } else {
        if (y > halfPi - epsilon) y = halfPi - epsilon
      }
      let r = f / pow(tany(y), n)
      return [r * sin(n * x), f - r * cos(n * x)]
    }
    project.invert = function (x, y) {
      let fy = f - y,
        r = sign(n) * sqrt(x * x + fy * fy),
        l = atan2(x, abs(fy)) * sign(fy)
      if (fy * n < 0) l -= pi * sign(x) * sign(fy)
      return [l / n, 2 * atan(pow(f / r, 1 / n)) - halfPi]
    }
    return project
  }
  export function conicConformal() {
    return conicProjection(conicConformalRaw).scale(109.5).parallels([30, 30])
  }
  export function conicEqualAreaRaw(y0, y1) {
    let sy0 = sin(y0),
      n = (sy0 + sin(y1)) / 2
    if (abs(n) < epsilon) return cylindricalEqualAreaRaw(y0)
    let c = 1 + sy0 * (2 * n - sy0),
      r0 = sqrt(c) / n
    function project(x, y) {
      let r = sqrt(c - 2 * n * sin(y)) / n
      return [r * sin((x *= n)), r0 - r * cos(x)]
    }
    project.invert = function (x, y) {
      let r0y = r0 - y,
        l = atan2(x, abs(r0y)) * sign(r0y)
      if (r0y * n < 0) l -= pi * sign(x) * sign(r0y)
      return [l / n, asin((c - (x * x + r0y * r0y) * n * n) / (2 * n))]
    }
    return project
  }
  export function conicEqualArea() {
    return conicProjection(conicEqualAreaRaw).scale(155.424).center([0, 33.6442])
  }
  export function conicEquidistantRaw(y0, y1) {
    let cy0 = cos(y0),
      n = y0 === y1 ? sin(y0) : (cy0 - cos(y1)) / (y1 - y0),
      g = cy0 / n + y0
    if (abs(n) < epsilon) return equirectangularRaw
    function project(x, y) {
      let gy = g - y,
        nx = n * x
      return [gy * sin(nx), g - gy * cos(nx)]
    }
    project.invert = function (x, y) {
      let gy = g - y,
        l = atan2(x, abs(gy)) * sign(gy)
      if (gy * n < 0) l -= pi * sign(x) * sign(gy)
      return [l / n, g - sign(n) * sqrt(x * x + gy * gy)]
    }
    return project
  }
  export function conicEquidistant() {
    return conicProjection(conicEquidistantRaw).scale(131.154).center([0, 13.9389])
  }
  export function cylindricalEqualAreaRaw(phi0) {
    let cosPhi0 = cos(phi0)
    function forward(lambda, phi) {
      return [lambda * cosPhi0, sin(phi) / cosPhi0]
    }
    forward.invert = function (x, y) {
      return [x / cosPhi0, asin(y * cosPhi0)]
    }
    return forward
  }
  let A1 = 1.340264,
    A2 = -0.081106,
    A3 = 0.000893,
    A4 = 0.003796,
    M = sqrt(3) / 2,
    iterations = 12
  export function equalEarthRaw(lambda, phi) {
    let l = asin(M * sin(phi)),
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
  export function equirectangularRaw(lambda, phi) {
    return [lambda, phi]
  }
  equirectangularRaw.invert = equirectangularRaw
  export function equirectangular() {
    return projection(equirectangularRaw).scale(152.63)
  }
  function fit(projection, fitBounds, object) {
    let clip = projection.clipExtent && projection.clipExtent()
    projection.scale(150).translate([0, 0])
    if (clip != null) projection.clipExtent(null)
    geoStream(object, projection.stream(boundsStream))
    fitBounds(boundsStream.result())
    if (clip != null) projection.clipExtent(clip)
    return projection
  }
  export function fitExtent(projection, extent, object) {
    return fit(
      projection,
      function (b) {
        let w = extent[1][0] - extent[0][0],
          h = extent[1][1] - extent[0][1],
          k = Math.min(w / (b[1][0] - b[0][0]), h / (b[1][1] - b[0][1])),
          x = +extent[0][0] + (w - k * (b[1][0] + b[0][0])) / 2,
          y = +extent[0][1] + (h - k * (b[1][1] + b[0][1])) / 2
        projection.scale(150 * k).translate([x, y])
      },
      object
    )
  }
  export function fitSize(projection, size, object) {
    return fitExtent(projection, [[0, 0], size], object)
  }
  export function fitWidth(projection, width, object) {
    return fit(
      projection,
      function (b) {
        let w = +width,
          k = w / (b[1][0] - b[0][0]),
          x = (w - k * (b[1][0] + b[0][0])) / 2,
          y = -k * b[0][1]
        projection.scale(150 * k).translate([x, y])
      },
      object
    )
  }
  export function fitHeight(projection, height, object) {
    return fit(
      projection,
      function (b) {
        let h = +height,
          k = h / (b[1][1] - b[0][1]),
          x = -k * b[0][0],
          y = (h - k * (b[1][1] + b[0][1])) / 2
        projection.scale(150 * k).translate([x, y])
      },
      object
    )
  }
  export function gnomonicRaw(x, y) {
    let cy = cos(y),
      k = cos(x) * cy
    return [(cy * sin(x)) / k, sin(y) / k]
  }
  gnomonicRaw.invert = azimuthalInvert(atan)
  export function gnomonic() {
    return projection(gnomonicRaw).scale(144.049).clipAngle(60)
  }
  export function identity() {
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
          let p = projection([x, y])
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
      return projection
    }
    function projection(p) {
      let x = p[0] * kx,
        y = p[1] * ky
      if (alpha) {
        let t = y * ca - x * sa
        x = x * ca + y * sa
        y = t
      }
      return [x + tx, y + ty]
    }
    projection.invert = function (p) {
      let x = p[0] - tx,
        y = p[1] - ty
      if (alpha) {
        let t = y * ca + x * sa
        x = x * ca - y * sa
        y = t
      }
      return [x / kx, y / ky]
    }
    projection.stream = function (stream) {
      return cache && cacheStream === stream ? cache : (cache = transform(postclip((cacheStream = stream))))
    }
    projection.postclip = function (_) {
      return arguments.length ? ((postclip = _), (x0 = y0 = x1 = y1 = null), reset()) : postclip
    }
    projection.clipExtent = function (_) {
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
    projection.scale = function (_) {
      return arguments.length ? ((k = +_), reset()) : k
    }
    projection.translate = function (_) {
      return arguments.length ? ((tx = +_[0]), (ty = +_[1]), reset()) : [tx, ty]
    }
    projection.angle = function (_) {
      return arguments.length
        ? ((alpha = (_ % 360) * radians), (sa = sin(alpha)), (ca = cos(alpha)), reset())
        : alpha * degrees
    }
    projection.reflectX = function (_) {
      return arguments.length ? ((sx = _ ? -1 : 1), reset()) : sx < 0
    }
    projection.reflectY = function (_) {
      return arguments.length ? ((sy = _ ? -1 : 1), reset()) : sy < 0
    }
    projection.fitExtent = function (extent, object) {
      return fitExtent(projection, extent, object)
    }
    projection.fitSize = function (size, object) {
      return fitSize(projection, size, object)
    }
    projection.fitWidth = function (width, object) {
      return fitWidth(projection, width, object)
    }
    projection.fitHeight = function (height, object) {
      return fitHeight(projection, height, object)
    }
    return projection
  }
  let transformRadians = transformer({
    point: function (x, y) {
      this.stream.point(x * radians, y * radians)
    },
  })
  function transformRotate(rotate) {
    return transformer({
      point: function (x, y) {
        let r = rotate(x, y)
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
    let cosAlpha = cos(alpha),
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
  export function projection(project) {
    return projectionMutator(function () {
      return project
    })()
  }
  export function projectionMutator(projectAt) {
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
    function projection(point) {
      return projectRotateTransform(point[0] * radians, point[1] * radians)
    }
    function invert(point) {
      point = projectRotateTransform.invert(point[0], point[1])
      return point && [point[0] * degrees, point[1] * degrees]
    }
    projection.stream = function (stream) {
      return cache && cacheStream === stream
        ? cache
        : (cache = transformRadians(
            transformRotate(rotate)(preclip(projectResample(postclip((cacheStream = stream)))))
          ))
    }
    projection.preclip = function (_) {
      return arguments.length ? ((preclip = _), (theta = undefined), reset()) : preclip
    }
    projection.postclip = function (_) {
      return arguments.length ? ((postclip = _), (x0 = y0 = x1 = y1 = null), reset()) : postclip
    }
    projection.clipAngle = function (_) {
      return arguments.length
        ? ((preclip = +_ ? clipCircle((theta = _ * radians)) : ((theta = null), clipAntimeridian)), reset())
        : theta * degrees
    }
    projection.clipExtent = function (_) {
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
    projection.scale = function (_) {
      return arguments.length ? ((k = +_), recenter()) : k
    }
    projection.translate = function (_) {
      return arguments.length ? ((x = +_[0]), (y = +_[1]), recenter()) : [x, y]
    }
    projection.center = function (_) {
      return arguments.length
        ? ((lambda = (_[0] % 360) * radians), (phi = (_[1] % 360) * radians), recenter())
        : [lambda * degrees, phi * degrees]
    }
    projection.rotate = function (_) {
      return arguments.length
        ? ((deltaLambda = (_[0] % 360) * radians),
          (deltaPhi = (_[1] % 360) * radians),
          (deltaGamma = _.length > 2 ? (_[2] % 360) * radians : 0),
          recenter())
        : [deltaLambda * degrees, deltaPhi * degrees, deltaGamma * degrees]
    }
    projection.angle = function (_) {
      return arguments.length ? ((alpha = (_ % 360) * radians), recenter()) : alpha * degrees
    }
    projection.reflectX = function (_) {
      return arguments.length ? ((sx = _ ? -1 : 1), recenter()) : sx < 0
    }
    projection.reflectY = function (_) {
      return arguments.length ? ((sy = _ ? -1 : 1), recenter()) : sy < 0
    }
    projection.precision = function (_) {
      return arguments.length
        ? ((projectResample = resample(projectTransform, (delta2 = _ * _))), reset())
        : sqrt(delta2)
    }
    projection.fitExtent = function (extent, object) {
      return fitExtent(projection, extent, object)
    }
    projection.fitSize = function (size, object) {
      return fitSize(projection, size, object)
    }
    projection.fitWidth = function (width, object) {
      return fitWidth(projection, width, object)
    }
    projection.fitHeight = function (height, object) {
      return fitHeight(projection, height, object)
    }
    function recenter() {
      let center = scaleTranslateRotate(k, 0, 0, sx, sy, alpha).apply(null, project(lambda, phi)),
        transform = scaleTranslateRotate(k, x - center[0], y - center[1], sx, sy, alpha)
      rotate = rotateRadians(deltaLambda, deltaPhi, deltaGamma)
      projectTransform = compose(project, transform)
      projectRotateTransform = compose(rotate, projectTransform)
      projectResample = resample(projectTransform, delta2)
      return reset()
    }
    function reset() {
      cache = cacheStream = null
      return projection
    }
    return function () {
      project = projectAt.apply(this, arguments)
      projection.invert = project.invert && invert
      return recenter()
    }
  }
  export function mercatorRaw(lambda, phi) {
    return [lambda, log(tan((halfPi + phi) / 2))]
  }
  mercatorRaw.invert = function (x, y) {
    return [x, 2 * atan(exp(y)) - halfPi]
  }
  export function mercator() {
    return mercatorProjection(mercatorRaw).scale(961 / tau)
  }
  export function mercatorProjection(project) {
    let m = projection(project),
      center = m.center,
      scale = m.scale,
      translate = m.translate,
      clipExtent = m.clipExtent,
      x0 = null,
      y0,
      x1,
      y1 // clip extent
    m.scale = function (_) {
      return arguments.length ? (scale(_), reclip()) : scale()
    }
    m.translate = function (_) {
      return arguments.length ? (translate(_), reclip()) : translate()
    }
    m.center = function (_) {
      return arguments.length ? (center(_), reclip()) : center()
    }
    m.clipExtent = function (_) {
      return arguments.length
        ? (_ == null
            ? (x0 = y0 = x1 = y1 = null)
            : ((x0 = +_[0][0]), (y0 = +_[0][1]), (x1 = +_[1][0]), (y1 = +_[1][1])),
          reclip())
        : x0 == null
        ? null
        : [
            [x0, y0],
            [x1, y1],
          ]
    }
    function reclip() {
      let k = pi * scale(),
        t = m(rotation(m.rotate()).invert([0, 0]))
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
  export function naturalEarth1Raw(lambda, phi) {
    let phi2 = phi * phi,
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
      var phi2 = phi * phi,
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
  export function orthographicRaw(x, y) {
    return [cos(y) * sin(x), sin(y)]
  }
  orthographicRaw.invert = azimuthalInvert(asin)
  export function orthographic() {
    return projection(orthographicRaw)
      .scale(249.5)
      .clipAngle(90 + epsilon)
  }
  let maxDepth = 16, // maximum depth of subdivision
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
        let dx = x1 - x0,
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
          let c = cartesian([lambda, phi]),
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
  export function stereographicRaw(x, y) {
    let cy = cos(y),
      k = 1 + cos(x) * cy
    return [(cy * sin(x)) / k, sin(y) / k]
  }
  stereographicRaw.invert = azimuthalInvert(function (z) {
    return 2 * atan(z)
  })
  export function stereographic() {
    return projection(stereographicRaw).scale(250).clipAngle(142)
  }
  export function transverseMercatorRaw(lambda, phi) {
    return [log(tan((halfPi + phi) / 2)), -lambda]
  }
  transverseMercatorRaw.invert = function (x, y) {
    return [-y, 2 * atan(exp(x)) - halfPi]
  }
  export function transverseMercator() {
    let m = mercatorProjection(transverseMercatorRaw),
      center = m.center,
      rotate = m.rotate
    m.center = function (_) {
      return arguments.length ? center([-_[1], _[0]]) : ((_ = center()), [_[1], -_[0]])
    }
    m.rotate = function (_) {
      return arguments.length
        ? rotate([_[0], _[1], _.length > 2 ? _[2] + 90 : 90])
        : ((_ = rotate()), [_[0], _[1], _[2] - 90])
    }
    return rotate([0, 0, 90]).scale(159.155)
  }
}
