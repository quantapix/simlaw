import conicEqualArea from "./conicEqualArea.js"

export function () {
  return conicEqualArea().parallels([29.5, 45.5]).scale(1070).translate([480, 250]).rotate([96, 0]).center([-0.6, 38.7])
}
import { epsilon } from "../math.js"
import albers from "./albers.js"
import conicEqualArea from "./conicEqualArea.js"
import { fitExtent, fitSize, fitWidth, fitHeight } from "./fit.js"

function multiplex(streams) {
  var n = streams.length
  return {
    point: function (x, y) {
      var i = -1
      while (++i < n) streams[i].point(x, y)
    },
    sphere: function () {
      var i = -1
      while (++i < n) streams[i].sphere()
    },
    lineStart: function () {
      var i = -1
      while (++i < n) streams[i].lineStart()
    },
    lineEnd: function () {
      var i = -1
      while (++i < n) streams[i].lineEnd()
    },
    polygonStart: function () {
      var i = -1
      while (++i < n) streams[i].polygonStart()
    },
    polygonEnd: function () {
      var i = -1
      while (++i < n) streams[i].polygonEnd()
    },
  }
}

export function () {
  var cache,
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
    var x = coordinates[0],
      y = coordinates[1]
    return (
      (point = null),
      (lower48Point.point(x, y), point) || (alaskaPoint.point(x, y), point) || (hawaiiPoint.point(x, y), point)
    )
  }

  albersUsa.invert = function (coordinates) {
    var k = lower48.scale(),
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
    var k = lower48.scale(),
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
import { asin, atan2, cos, sin, sqrt } from "../math.js"

export function azimuthalRaw(scale) {
  return function (x, y) {
    var cx = cos(x),
      cy = cos(y),
      k = scale(cx * cy)
    if (k === Infinity) return [2, 0]
    return [k * cy * sin(x), k * sin(y)]
  }
}

export function azimuthalInvert(angle) {
  return function (x, y) {
    var z = sqrt(x * x + y * y),
      c = angle(z),
      sc = sin(c),
      cc = cos(c)
    return [atan2(x * sc, z * cc), asin(z && (y * sc) / z)]
  }
}
import { asin, sqrt } from "../math.js"
import { azimuthalRaw, azimuthalInvert } from "./azimuthal.js"
import projection from "./index.js"

export var azimuthalEqualAreaRaw = azimuthalRaw(function (cxcy) {
  return sqrt(2 / (1 + cxcy))
})

azimuthalEqualAreaRaw.invert = azimuthalInvert(function (z) {
  return 2 * asin(z / 2)
})

export function () {
  return projection(azimuthalEqualAreaRaw)
    .scale(124.75)
    .clipAngle(180 - 1e-3)
}
import { acos, sin } from "../math.js"
import { azimuthalRaw, azimuthalInvert } from "./azimuthal.js"
import projection from "./index.js"

export var azimuthalEquidistantRaw = azimuthalRaw(function (c) {
  return (c = acos(c)) && c / sin(c)
})

azimuthalEquidistantRaw.invert = azimuthalInvert(function (z) {
  return z
})

export function () {
  return projection(azimuthalEquidistantRaw)
    .scale(79.4188)
    .clipAngle(180 - 1e-3)
}
import { degrees, pi, radians } from "../math.js"
import { projectionMutator } from "./index.js"

export function conicProjection(projectAt) {
  var phi0 = 0,
    phi1 = pi / 3,
    m = projectionMutator(projectAt),
    p = m(phi0, phi1)

  p.parallels = function (_) {
    return arguments.length ? m((phi0 = _[0] * radians), (phi1 = _[1] * radians)) : [phi0 * degrees, phi1 * degrees]
  }

  return p
}
import { abs, atan, atan2, cos, epsilon, halfPi, log, pi, pow, sign, sin, sqrt, tan } from "../math.js"
import { conicProjection } from "./conic.js"
import { mercatorRaw } from "./mercator.js"

function tany(y) {
  return tan((halfPi + y) / 2)
}

export function conicConformalRaw(y0, y1) {
  var cy0 = cos(y0),
    n = y0 === y1 ? sin(y0) : log(cy0 / cos(y1)) / log(tany(y1) / tany(y0)),
    f = (cy0 * pow(tany(y0), n)) / n

  if (!n) return mercatorRaw

  function project(x, y) {
    if (f > 0) {
      if (y < -halfPi + epsilon) y = -halfPi + epsilon
    } else {
      if (y > halfPi - epsilon) y = halfPi - epsilon
    }
    var r = f / pow(tany(y), n)
    return [r * sin(n * x), f - r * cos(n * x)]
  }

  project.invert = function (x, y) {
    var fy = f - y,
      r = sign(n) * sqrt(x * x + fy * fy),
      l = atan2(x, abs(fy)) * sign(fy)
    if (fy * n < 0) l -= pi * sign(x) * sign(fy)
    return [l / n, 2 * atan(pow(f / r, 1 / n)) - halfPi]
  }

  return project
}

export function () {
  return conicProjection(conicConformalRaw).scale(109.5).parallels([30, 30])
}
import { abs, asin, atan2, cos, epsilon, pi, sign, sin, sqrt } from "../math.js"
import { conicProjection } from "./conic.js"
import { cylindricalEqualAreaRaw } from "./cylindricalEqualArea.js"

export function conicEqualAreaRaw(y0, y1) {
  var sy0 = sin(y0),
    n = (sy0 + sin(y1)) / 2

  if (abs(n) < epsilon) return cylindricalEqualAreaRaw(y0)

  var c = 1 + sy0 * (2 * n - sy0),
    r0 = sqrt(c) / n

  function project(x, y) {
    var r = sqrt(c - 2 * n * sin(y)) / n
    return [r * sin((x *= n)), r0 - r * cos(x)]
  }

  project.invert = function (x, y) {
    var r0y = r0 - y,
      l = atan2(x, abs(r0y)) * sign(r0y)
    if (r0y * n < 0) l -= pi * sign(x) * sign(r0y)
    return [l / n, asin((c - (x * x + r0y * r0y) * n * n) / (2 * n))]
  }

  return project
}

export function () {
  return conicProjection(conicEqualAreaRaw).scale(155.424).center([0, 33.6442])
}
import { abs, atan2, cos, epsilon, pi, sign, sin, sqrt } from "../math.js"
import { conicProjection } from "./conic.js"
import { equirectangularRaw } from "./equirectangular.js"

export function conicEquidistantRaw(y0, y1) {
  var cy0 = cos(y0),
    n = y0 === y1 ? sin(y0) : (cy0 - cos(y1)) / (y1 - y0),
    g = cy0 / n + y0

  if (abs(n) < epsilon) return equirectangularRaw

  function project(x, y) {
    var gy = g - y,
      nx = n * x
    return [gy * sin(nx), g - gy * cos(nx)]
  }

  project.invert = function (x, y) {
    var gy = g - y,
      l = atan2(x, abs(gy)) * sign(gy)
    if (gy * n < 0) l -= pi * sign(x) * sign(gy)
    return [l / n, g - sign(n) * sqrt(x * x + gy * gy)]
  }

  return project
}

export function () {
  return conicProjection(conicEquidistantRaw).scale(131.154).center([0, 13.9389])
}
import { asin, cos, sin } from "../math.js"

export function cylindricalEqualAreaRaw(phi0) {
  var cosPhi0 = cos(phi0)

  function forward(lambda, phi) {
    return [lambda * cosPhi0, sin(phi) / cosPhi0]
  }

  forward.invert = function (x, y) {
    return [x / cosPhi0, asin(y * cosPhi0)]
  }

  return forward
}
import projection from "./index.js"
import { abs, asin, cos, epsilon2, sin, sqrt } from "../math.js"

var A1 = 1.340264,
  A2 = -0.081106,
  A3 = 0.000893,
  A4 = 0.003796,
  M = sqrt(3) / 2,
  iterations = 12

export function equalEarthRaw(lambda, phi) {
  var l = asin(M * sin(phi)),
    l2 = l * l,
    l6 = l2 * l2 * l2
  return [
    (lambda * cos(l)) / (M * (A1 + 3 * A2 * l2 + l6 * (7 * A3 + 9 * A4 * l2))),
    l * (A1 + A2 * l2 + l6 * (A3 + A4 * l2)),
  ]
}

equalEarthRaw.invert = function (x, y) {
  var l = y,
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

export function () {
  return projection(equalEarthRaw).scale(177.158)
}
import projection from "./index.js"

export function equirectangularRaw(lambda, phi) {
  return [lambda, phi]
}

equirectangularRaw.invert = equirectangularRaw

export function () {
  return projection(equirectangularRaw).scale(152.63)
}
import { default as geoStream } from "../stream.js"
import boundsStream from "../path/bounds.js"

function fit(projection, fitBounds, object) {
  var clip = projection.clipExtent && projection.clipExtent()
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
      var w = extent[1][0] - extent[0][0],
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
      var w = +width,
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
      var h = +height,
        k = h / (b[1][1] - b[0][1]),
        x = -k * b[0][0],
        y = (h - k * (b[1][1] + b[0][1])) / 2
      projection.scale(150 * k).translate([x, y])
    },
    object
  )
}
import { atan, cos, sin } from "../math.js"
import { azimuthalInvert } from "./azimuthal.js"
import projection from "./index.js"

export function gnomonicRaw(x, y) {
  var cy = cos(y),
    k = cos(x) * cy
  return [(cy * sin(x)) / k, sin(y) / k]
}

gnomonicRaw.invert = azimuthalInvert(atan)

export function () {
  return projection(gnomonicRaw).scale(144.049).clipAngle(60)
}
import clipRectangle from "../clip/rectangle.js"
import identity from "../identity.js"
import { transformer } from "../transform.js"
import { fitExtent, fitSize, fitWidth, fitHeight } from "./fit.js"
import { cos, degrees, radians, sin } from "../math.js"

export function () {
  var k = 1,
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
        var p = projection([x, y])
        this.stream.point(p[0], p[1])
      },
    }),
    postclip = identity,
    cache,
    cacheStream

  function reset() {
    kx = k * sx
    ky = k * sy
    cache = cacheStream = null
    return projection
  }

  function projection(p) {
    var x = p[0] * kx,
      y = p[1] * ky
    if (alpha) {
      var t = y * ca - x * sa
      x = x * ca + y * sa
      y = t
    }
    return [x + tx, y + ty]
  }
  projection.invert = function (p) {
    var x = p[0] - tx,
      y = p[1] - ty
    if (alpha) {
      var t = y * ca + x * sa
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
            ? ((x0 = y0 = x1 = y1 = null), identity)
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
import clipAntimeridian from "../clip/antimeridian.js"
import clipCircle from "../clip/circle.js"
import clipRectangle from "../clip/rectangle.js"
import compose from "../compose.js"
import identity from "../identity.js"
import { cos, degrees, radians, sin, sqrt } from "../math.js"
import { rotateRadians } from "../rotation.js"
import { transformer } from "../transform.js"
import { fitExtent, fitSize, fitWidth, fitHeight } from "./fit.js"
import resample from "./resample.js"

var transformRadians = transformer({
  point: function (x, y) {
    this.stream.point(x * radians, y * radians)
  },
})

function transformRotate(rotate) {
  return transformer({
    point: function (x, y) {
      var r = rotate(x, y)
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
  var cosAlpha = cos(alpha),
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
  var project,
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
    postclip = identity, // post-clip extent
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
      : (cache = transformRadians(transformRotate(rotate)(preclip(projectResample(postclip((cacheStream = stream)))))))
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
            ? ((x0 = y0 = x1 = y1 = null), identity)
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
    return arguments.length ? ((projectResample = resample(projectTransform, (delta2 = _ * _))), reset()) : sqrt(delta2)
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
    var center = scaleTranslateRotate(k, 0, 0, sx, sy, alpha).apply(null, project(lambda, phi)),
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
import { atan, exp, halfPi, log, pi, tan, tau } from "../math.js"
import rotation from "../rotation.js"
import projection from "./index.js"

export function mercatorRaw(lambda, phi) {
  return [lambda, log(tan((halfPi + phi) / 2))]
}

mercatorRaw.invert = function (x, y) {
  return [x, 2 * atan(exp(y)) - halfPi]
}

export function () {
  return mercatorProjection(mercatorRaw).scale(961 / tau)
}

export function mercatorProjection(project) {
  var m = projection(project),
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
      ? (_ == null ? (x0 = y0 = x1 = y1 = null) : ((x0 = +_[0][0]), (y0 = +_[0][1]), (x1 = +_[1][0]), (y1 = +_[1][1])),
        reclip())
      : x0 == null
      ? null
      : [
          [x0, y0],
          [x1, y1],
        ]
  }

  function reclip() {
    var k = pi * scale(),
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
import projection from "./index.js"
import { abs, epsilon } from "../math.js"

export function naturalEarth1Raw(lambda, phi) {
  var phi2 = phi * phi,
    phi4 = phi2 * phi2
  return [
    lambda * (0.8707 - 0.131979 * phi2 + phi4 * (-0.013791 + phi4 * (0.003971 * phi2 - 0.001529 * phi4))),
    phi * (1.007226 + phi2 * (0.015085 + phi4 * (-0.044475 + 0.028874 * phi2 - 0.005916 * phi4))),
  ]
}

naturalEarth1Raw.invert = function (x, y) {
  var phi = y,
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

export function () {
  return projection(naturalEarth1Raw).scale(175.295)
}
import { asin, cos, epsilon, sin } from "../math.js"
import { azimuthalInvert } from "./azimuthal.js"
import projection from "./index.js"

export function orthographicRaw(x, y) {
  return [cos(y) * sin(x), sin(y)]
}

orthographicRaw.invert = azimuthalInvert(asin)

export function () {
  return projection(orthographicRaw)
    .scale(249.5)
    .clipAngle(90 + epsilon)
}
import { cartesian } from "../cartesian.js"
import { abs, asin, atan2, cos, epsilon, radians, sqrt } from "../math.js"
import { transformer } from "../transform.js"

var maxDepth = 16, // maximum depth of subdivision
  cosMinDistance = cos(30 * radians) // cos(minimum angular distance)

export function (project, delta2) {
  return +delta2 ? resample(project, delta2) : resampleNone(project)
}

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
    var dx = x1 - x0,
      dy = y1 - y0,
      d2 = dx * dx + dy * dy
    if (d2 > 4 * delta2 && depth--) {
      var a = a0 + a1,
        b = b0 + b1,
        c = c0 + c1,
        m = sqrt(a * a + b * b + c * c),
        phi2 = asin((c /= m)),
        lambda2 = abs(abs(c) - 1) < epsilon || abs(lambda0 - lambda1) < epsilon ? (lambda0 + lambda1) / 2 : atan2(b, a),
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
    var lambda00,
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
      var c = cartesian([lambda, phi]),
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
import { atan, cos, sin } from "../math.js"
import { azimuthalInvert } from "./azimuthal.js"
import projection from "./index.js"

export function stereographicRaw(x, y) {
  var cy = cos(y),
    k = 1 + cos(x) * cy
  return [(cy * sin(x)) / k, sin(y) / k]
}

stereographicRaw.invert = azimuthalInvert(function (z) {
  return 2 * atan(z)
})

export function () {
  return projection(stereographicRaw).scale(250).clipAngle(142)
}
import { atan, exp, halfPi, log, tan } from "../math.js"
import { mercatorProjection } from "./mercator.js"

export function transverseMercatorRaw(lambda, phi) {
  return [log(tan((halfPi + phi) / 2)), -lambda]
}

transverseMercatorRaw.invert = function (x, y) {
  return [-y, 2 * atan(exp(x)) - halfPi]
}

export function () {
  var m = mercatorProjection(transverseMercatorRaw),
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
