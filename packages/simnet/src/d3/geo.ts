import { Adder } from "./array.js"
import { atan2, cos, quarterPi, radians, sin, tau } from "./math.js"
import noop from "./noop.js"
import stream from "./stream.js"
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
    var areaRing = +areaRingSum
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
  var dLambda = lambda - lambda0,
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
export function (object) {
  areaSum = new Adder()
  stream(object, areaStream)
  return areaSum * 2
}
import { Adder } from "./array.js"
import { areaStream, areaRingSum } from "./area.js"
import { cartesian, cartesianCross, cartesianNormalizeInPlace, spherical } from "./cartesian.js"
import { abs, degrees, epsilon, radians } from "./math.js"
import stream from "./stream.js"
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
  var p = cartesian([lambda * radians, phi * radians])
  if (p0) {
    var normal = cartesianCross(p0, p),
      equatorial = [normal[1], -normal[0], 0],
      inflection = cartesianCross(equatorial, normal)
    cartesianNormalizeInPlace(inflection)
    inflection = spherical(inflection)
    var delta = lambda - lambda2,
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
    var delta = lambda - lambda2
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
export function (feature) {
  var i, n, a, b, merged, deltaMax, delta
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
import { asin, atan2, cos, sin, sqrt } from "./math.js"
export function spherical(cartesian) {
  return [atan2(cartesian[1], cartesian[0]), asin(cartesian[2])]
}
export function cartesian(spherical) {
  var lambda = spherical[0],
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
  var l = sqrt(d[0] * d[0] + d[1] * d[1] + d[2] * d[2])
  ;(d[0] /= l), (d[1] /= l), (d[2] /= l)
}
import { Adder } from "./array.js"
import { asin, atan2, cos, degrees, epsilon, epsilon2, hypot, radians, sin, sqrt } from "./math.js"
import noop from "./noop.js"
import stream from "./stream.js"
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
  var cosPhi = cos(phi)
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
  var cosPhi = cos(phi)
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
  var cosPhi = cos(phi)
  x0 = cosPhi * cos(lambda)
  y0 = cosPhi * sin(lambda)
  z0 = sin(phi)
  centroidPointCartesian(x0, y0, z0)
}
function centroidRingPoint(lambda, phi) {
  ;(lambda *= radians), (phi *= radians)
  var cosPhi = cos(phi),
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
export function (object) {
  W0 = W1 = X0 = Y0 = Z0 = X1 = Y1 = Z1 = 0
  X2 = new Adder()
  Y2 = new Adder()
  Z2 = new Adder()
  stream(object, centroidStream)
  var x = +X2,
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
import { cartesian, cartesianNormalizeInPlace, spherical } from "./cartesian.js"
import constant from "./constant.js"
import { acos, cos, degrees, epsilon, radians, sin, tau } from "./math.js"
import { rotateRadians } from "./rotation.js"
export function circleStream(stream, radius, delta, direction, t0, t1) {
  if (!delta) return
  var cosRadius = cos(radius),
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
  var radius = acos(-point[1])
  return ((-point[2] < 0 ? -radius : radius) + tau - epsilon) % tau
}
export function () {
  var center = constant([0, 0]),
    radius = constant(90),
    precision = constant(6),
    ring,
    rotate,
    stream = { point: point }
  function point(x, y) {
    ring.push((x = rotate(x, y)))
    ;(x[0] *= degrees), (x[1] *= degrees)
  }
  function circle() {
    var c = center.apply(this, arguments),
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
    return arguments.length ? ((center = typeof _ === "function" ? _ : constant([+_[0], +_[1]])), circle) : center
  }
  circle.radius = function (_) {
    return arguments.length ? ((radius = typeof _ === "function" ? _ : constant(+_)), circle) : radius
  }
  circle.precision = function (_) {
    return arguments.length ? ((precision = typeof _ === "function" ? _ : constant(+_)), circle) : precision
  }
  return circle
}
export function (a, b) {
  function compose(x, y) {
    return (x = a(x, y)), b(x[0], x[1])
  }
  if (a.invert && b.invert)
    compose.invert = function (x, y) {
      return (x = b.invert(x, y)), x && a.invert(x[0], x[1])
    }
  return compose
}
export function (x) {
  return function () {
    return x
  }
}
import { default as polygonContains } from "./polygonContains.js"
import { default as distance } from "./distance.js"
import { epsilon2, radians } from "./math.js"
var containsObjectType = {
  Feature: function (object, point) {
    return containsGeometry(object.geometry, point)
  },
  FeatureCollection: function (object, point) {
    var features = object.features,
      i = -1,
      n = features.length
    while (++i < n) if (containsGeometry(features[i].geometry, point)) return true
    return false
  },
}
var containsGeometryType = {
  Sphere: function () {
    return true
  },
  Point: function (object, point) {
    return containsPoint(object.coordinates, point)
  },
  MultiPoint: function (object, point) {
    var coordinates = object.coordinates,
      i = -1,
      n = coordinates.length
    while (++i < n) if (containsPoint(coordinates[i], point)) return true
    return false
  },
  LineString: function (object, point) {
    return containsLine(object.coordinates, point)
  },
  MultiLineString: function (object, point) {
    var coordinates = object.coordinates,
      i = -1,
      n = coordinates.length
    while (++i < n) if (containsLine(coordinates[i], point)) return true
    return false
  },
  Polygon: function (object, point) {
    return containsPolygon(object.coordinates, point)
  },
  MultiPolygon: function (object, point) {
    var coordinates = object.coordinates,
      i = -1,
      n = coordinates.length
    while (++i < n) if (containsPolygon(coordinates[i], point)) return true
    return false
  },
  GeometryCollection: function (object, point) {
    var geometries = object.geometries,
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
  var ao, bo, ab
  for (var i = 0, n = coordinates.length; i < n; i++) {
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
export function (object, point) {
  return (
    object && containsObjectType.hasOwnProperty(object.type) ? containsObjectType[object.type] : containsGeometry
  )(object, point)
}
import length from "./length.js"
var coordinates = [null, null],
  object = { type: "LineString", coordinates: coordinates }
export function (a, b) {
  coordinates[0] = a
  coordinates[1] = b
  return length(object)
}
import { range } from "./array.js"
import { abs, ceil, epsilon } from "./math.js"
function graticuleX(y0, y1, dy) {
  var y = range(y0, y1 - epsilon, dy).concat(y1)
  return function (x) {
    return y.map(function (y) {
      return [x, y]
    })
  }
}
function graticuleY(x0, x1, dx) {
  var x = range(x0, x1 - epsilon, dx).concat(x1)
  return function (y) {
    return x.map(function (x) {
      return [x, y]
    })
  }
}
export function graticule() {
  var x1,
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
export default x => x
export { default as geoArea } from "./area.js"
export { default as geoBounds } from "./bounds.js"
export { default as geoCentroid } from "./centroid.js"
export { default as geoCircle } from "./circle.js"
export { default as geoClipAntimeridian } from "./clip/antimeridian.js"
export { default as geoClipCircle } from "./clip/circle.js"
export { default as geoClipExtent } from "./clip/extent.js" // DEPRECATED! Use d3.geoIdentity().clipExtent(…).
export { default as geoClipRectangle } from "./clip/rectangle.js"
export { default as geoContains } from "./contains.js"
export { default as geoDistance } from "./distance.js"
export { default as geoGraticule, graticule10 as geoGraticule10 } from "./graticule.js"
export { default as geoInterpolate } from "./interpolate.js"
export { default as geoLength } from "./length.js"
export { default as geoPath } from "./path/index.js"
export { default as geoAlbers } from "./projection/albers.js"
export { default as geoAlbersUsa } from "./projection/albersUsa.js"
export {
  default as geoAzimuthalEqualArea,
  azimuthalEqualAreaRaw as geoAzimuthalEqualAreaRaw,
} from "./projection/azimuthalEqualArea.js"
export {
  default as geoAzimuthalEquidistant,
  azimuthalEquidistantRaw as geoAzimuthalEquidistantRaw,
} from "./projection/azimuthalEquidistant.js"
export { default as geoConicConformal, conicConformalRaw as geoConicConformalRaw } from "./projection/conicConformal.js"
export { default as geoConicEqualArea, conicEqualAreaRaw as geoConicEqualAreaRaw } from "./projection/conicEqualArea.js"
export {
  default as geoConicEquidistant,
  conicEquidistantRaw as geoConicEquidistantRaw,
} from "./projection/conicEquidistant.js"
export { default as geoEqualEarth, equalEarthRaw as geoEqualEarthRaw } from "./projection/equalEarth.js"
export {
  default as geoEquirectangular,
  equirectangularRaw as geoEquirectangularRaw,
} from "./projection/equirectangular.js"
export { default as geoGnomonic, gnomonicRaw as geoGnomonicRaw } from "./projection/gnomonic.js"
export { default as geoIdentity } from "./projection/identity.js"
export { default as geoProjection, projectionMutator as geoProjectionMutator } from "./projection/index.js"
export { default as geoMercator, mercatorRaw as geoMercatorRaw } from "./projection/mercator.js"
export { default as geoNaturalEarth1, naturalEarth1Raw as geoNaturalEarth1Raw } from "./projection/naturalEarth1.js"
export { default as geoOrthographic, orthographicRaw as geoOrthographicRaw } from "./projection/orthographic.js"
export { default as geoStereographic, stereographicRaw as geoStereographicRaw } from "./projection/stereographic.js"
export {
  default as geoTransverseMercator,
  transverseMercatorRaw as geoTransverseMercatorRaw,
} from "./projection/transverseMercator.js"
export { default as geoRotation } from "./rotation.js"
export { default as geoStream } from "./stream.js"
export { default as geoTransform } from "./transform.js"
import { asin, atan2, cos, degrees, haversin, radians, sin, sqrt } from "./math.js"
export function (a, b) {
  var x0 = a[0] * radians,
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
  var interpolate = d
    ? function (t) {
        var B = sin((t *= d)) / k,
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
import { Adder } from "./array.js"
import { abs, atan2, cos, radians, sin, sqrt } from "./math.js"
import noop from "./noop.js"
import stream from "./stream.js"
var lengthSum, lambda0, sinPhi0, cosPhi0
var lengthStream = {
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
  var sinPhi = sin(phi),
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
export function (object) {
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
import { abs, epsilon } from "./math.js"
export function (a, b) {
  return abs(a[0] - b[0]) < epsilon && abs(a[1] - b[1]) < epsilon
}
import { Adder } from "./array.js"
import { cartesian, cartesianCross, cartesianNormalizeInPlace } from "./cartesian.js"
import { abs, asin, atan2, cos, epsilon, epsilon2, halfPi, pi, quarterPi, sign, sin, tau } from "./math.js"
function longitude(point) {
  return abs(point[0]) <= pi ? point[0] : sign(point[0]) * (((abs(point[0]) + pi) % tau) - pi)
}
export function (polygon, point) {
  var lambda = longitude(point),
    phi = point[1],
    sinPhi = sin(phi),
    normal = [sin(lambda), -cos(lambda), 0],
    angle = 0,
    winding = 0
  var sum = new Adder()
  if (sinPhi === 1) phi = halfPi + epsilon
  else if (sinPhi === -1) phi = -halfPi - epsilon
  for (var i = 0, n = polygon.length; i < n; ++i) {
    if (!(m = (ring = polygon[i]).length)) continue
    var ring,
      m,
      point0 = ring[m - 1],
      lambda0 = longitude(point0),
      phi0 = point0[1] / 2 + quarterPi,
      sinPhi0 = sin(phi0),
      cosPhi0 = cos(phi0)
    for (var j = 0; j < m; ++j, lambda0 = lambda1, sinPhi0 = sinPhi1, cosPhi0 = cosPhi1, point0 = point1) {
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
        var arc = cartesianCross(cartesian(point0), cartesian(point1))
        cartesianNormalizeInPlace(arc)
        var intersection = cartesianCross(normal, arc)
        cartesianNormalizeInPlace(intersection)
        var phiArc = (antimeridian ^ (delta >= 0) ? -1 : 1) * asin(intersection[2])
        if (phi > phiArc || (phi === phiArc && (arc[0] || arc[1]))) {
          winding += antimeridian ^ (delta >= 0) ? 1 : -1
        }
      }
    }
  }
  return (angle < -epsilon || (angle < epsilon && sum < -epsilon2)) ^ (winding & 1)
}
import compose from "./compose.js"
import { abs, asin, atan2, cos, degrees, pi, radians, sin, tau } from "./math.js"
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
  var rotation = forwardRotationLambda(deltaLambda)
  rotation.invert = forwardRotationLambda(-deltaLambda)
  return rotation
}
function rotationPhiGamma(deltaPhi, deltaGamma) {
  var cosDeltaPhi = cos(deltaPhi),
    sinDeltaPhi = sin(deltaPhi),
    cosDeltaGamma = cos(deltaGamma),
    sinDeltaGamma = sin(deltaGamma)
  function rotation(lambda, phi) {
    var cosPhi = cos(phi),
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
    var cosPhi = cos(phi),
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
export function (rotate) {
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
var streamObjectType = {
  Feature: function (object, stream) {
    streamGeometry(object.geometry, stream)
  },
  FeatureCollection: function (object, stream) {
    var features = object.features,
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
    var coordinates = object.coordinates,
      i = -1,
      n = coordinates.length
    while (++i < n) (object = coordinates[i]), stream.point(object[0], object[1], object[2])
  },
  LineString: function (object, stream) {
    streamLine(object.coordinates, stream, 0)
  },
  MultiLineString: function (object, stream) {
    var coordinates = object.coordinates,
      i = -1,
      n = coordinates.length
    while (++i < n) streamLine(coordinates[i], stream, 0)
  },
  Polygon: function (object, stream) {
    streamPolygon(object.coordinates, stream)
  },
  MultiPolygon: function (object, stream) {
    var coordinates = object.coordinates,
      i = -1,
      n = coordinates.length
    while (++i < n) streamPolygon(coordinates[i], stream)
  },
  GeometryCollection: function (object, stream) {
    var geometries = object.geometries,
      i = -1,
      n = geometries.length
    while (++i < n) streamGeometry(geometries[i], stream)
  },
}
function streamLine(coordinates, stream, closed) {
  var i = -1,
    n = coordinates.length - closed,
    coordinate
  stream.lineStart()
  while (++i < n) (coordinate = coordinates[i]), stream.point(coordinate[0], coordinate[1], coordinate[2])
  stream.lineEnd()
}
function streamPolygon(coordinates, stream) {
  var i = -1,
    n = coordinates.length
  stream.polygonStart()
  while (++i < n) streamLine(coordinates[i], stream, 1)
  stream.polygonEnd()
}
export function (object, stream) {
  if (object && streamObjectType.hasOwnProperty(object.type)) {
    streamObjectType[object.type](object, stream)
  } else {
    streamGeometry(object, stream)
  }
}
export function (methods) {
  return {
    stream: transformer(methods),
  }
}
export function transformer(methods) {
  return function (stream) {
    var s = new TransformStream()
    for (var key in methods) s[key] = methods[key]
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
