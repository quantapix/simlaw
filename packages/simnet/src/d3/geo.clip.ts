import clip from "./index.js"
import { abs, atan, cos, epsilon, halfPi, pi, sin } from "../math.js"

export default clip(
  function () {
    return true
  },
  clipAntimeridianLine,
  clipAntimeridianInterpolate,
  [-pi, -halfPi]
)

// Takes a line and cuts into visible segments. Return values: 0 - there were
// intersections or the line was empty; 1 - no intersections; 2 - there were
// intersections, and the first and last segments should be rejoined.
function clipAntimeridianLine(stream) {
  var lambda0 = NaN,
    phi0 = NaN,
    sign0 = NaN,
    clean // no intersections

  return {
    lineStart: function () {
      stream.lineStart()
      clean = 1
    },
    point: function (lambda1, phi1) {
      var sign1 = lambda1 > 0 ? pi : -pi,
        delta = abs(lambda1 - lambda0)
      if (abs(delta - pi) < epsilon) {
        // line crosses a pole
        stream.point(lambda0, (phi0 = (phi0 + phi1) / 2 > 0 ? halfPi : -halfPi))
        stream.point(sign0, phi0)
        stream.lineEnd()
        stream.lineStart()
        stream.point(sign1, phi0)
        stream.point(lambda1, phi0)
        clean = 0
      } else if (sign0 !== sign1 && delta >= pi) {
        // line crosses antimeridian
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
  var cosPhi0,
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
  var phi
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
    var lambda = from[0] < to[0] ? pi : -pi
    phi = (direction * lambda) / 2
    stream.point(-lambda, phi)
    stream.point(0, phi)
    stream.point(lambda, phi)
  } else {
    stream.point(to[0], to[1])
  }
}
import noop from "../noop.js"

export default function () {
  var lines = [],
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
      var result = lines
      lines = []
      line = null
      return result
    },
  }
}
import {
  cartesian,
  cartesianAddInPlace,
  cartesianCross,
  cartesianDot,
  cartesianScale,
  spherical,
} from "../cartesian.js"
import { circleStream } from "../circle.js"
import { abs, cos, epsilon, pi, radians, sqrt } from "../math.js"
import pointEqual from "../pointEqual.js"
import clip from "./index.js"

export default function (radius) {
  var cr = cos(radius),
    delta = 6 * radians,
    smallRadius = cr > 0,
    notHemisphere = abs(cr) > epsilon // TODO optimise for this common case

  function interpolate(from, to, direction, stream) {
    circleStream(stream, radius, delta, direction, from, to)
  }

  function visible(lambda, phi) {
    return cos(lambda) * cos(phi) > cr
  }

  // Takes a line and cuts into visible segments. Return values used for polygon
  // clipping: 0 - there were intersections or the line was empty; 1 - no
  // intersections 2 - there were intersections, and the first and last segments
  // should be rejoined.
  function clipLine(stream) {
    var point0, // previous point
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
        var point1 = [lambda, phi],
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
            // outside going in
            stream.lineStart()
            point2 = intersect(point1, point0)
            stream.point(point2[0], point2[1])
          } else {
            // inside going out
            point2 = intersect(point0, point1)
            stream.point(point2[0], point2[1], 2)
            stream.lineEnd()
          }
          point0 = point2
        } else if (notHemisphere && point0 && smallRadius ^ v) {
          var t
          // If the codes for two points are different, or are both zero,
          // and there this segment intersects with the small circle.
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
      // Rejoin first and last segments if there were intersections and the first
      // and last points were visible.
      clean: function () {
        return clean | ((v00 && v0) << 1)
      },
    }
  }

  // Intersects the great circle between a and b with the clip circle.
  function intersect(a, b, two) {
    var pa = cartesian(a),
      pb = cartesian(b)

    // We have two planes, n1.p = d1 and n2.p = d2.
    // Find intersection line p(t) = c1 n1 + c2 n2 + t (n1 ⨯ n2).
    var n1 = [1, 0, 0], // normal
      n2 = cartesianCross(pa, pb),
      n2n2 = cartesianDot(n2, n2),
      n1n2 = n2[0], // cartesianDot(n1, n2),
      determinant = n2n2 - n1n2 * n1n2

    // Two polar points.
    if (!determinant) return !two && a

    var c1 = (cr * n2n2) / determinant,
      c2 = (-cr * n1n2) / determinant,
      n1xn2 = cartesianCross(n1, n2),
      A = cartesianScale(n1, c1),
      B = cartesianScale(n2, c2)
    cartesianAddInPlace(A, B)

    // Solve |p(t)|^2 = 1.
    var u = n1xn2,
      w = cartesianDot(A, u),
      uu = cartesianDot(u, u),
      t2 = w * w - uu * (cartesianDot(A, A) - 1)

    if (t2 < 0) return

    var t = sqrt(t2),
      q = cartesianScale(u, (-w - t) / uu)
    cartesianAddInPlace(q, A)
    q = spherical(q)

    if (!two) return q

    // Two intersection points.
    var lambda0 = a[0],
      lambda1 = b[0],
      phi0 = a[1],
      phi1 = b[1],
      z

    if (lambda1 < lambda0) (z = lambda0), (lambda0 = lambda1), (lambda1 = z)

    var delta = lambda1 - lambda0,
      polar = abs(delta - pi) < epsilon,
      meridian = polar || delta < epsilon

    if (!polar && phi1 < phi0) (z = phi0), (phi0 = phi1), (phi1 = z)

    // Check that the first point is between a and b.
    if (
      meridian
        ? polar
          ? (phi0 + phi1 > 0) ^ (q[1] < (abs(q[0] - lambda0) < epsilon ? phi0 : phi1))
          : phi0 <= q[1] && q[1] <= phi1
        : (delta > pi) ^ (lambda0 <= q[0] && q[0] <= lambda1)
    ) {
      var q1 = cartesianScale(u, (-w + t) / uu)
      cartesianAddInPlace(q1, A)
      return [q, spherical(q1)]
    }
  }

  // Generates a 4-bit vector representing the location of a point relative to
  // the small circle's bounding box.
  function code(lambda, phi) {
    var r = smallRadius ? radius : pi - radius,
      code = 0
    if (lambda < -r) code |= 1 // left
    else if (lambda > r) code |= 2 // right
    if (phi < -r) code |= 4 // below
    else if (phi > r) code |= 8 // above
    return code
  }

  return clip(visible, clipLine, interpolate, smallRadius ? [0, -radius] : [-pi, radius - pi])
}
import clipRectangle from "./rectangle.js"

export default function () {
  var x0 = 0,
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
import clipBuffer from "./buffer.js"
import clipRejoin from "./rejoin.js"
import { epsilon, halfPi } from "../math.js"
import polygonContains from "../polygonContains.js"
import { merge } from "d3-array"

export default function (pointVisible, clipLine, interpolate, start) {
  return function (sink) {
    var line = clipLine(sink),
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
        var startInside = polygonContains(polygon, start)
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

      var clean = ringSink.clean(),
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

      // No intersections.
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

      // Rejoin connected segments.
      // TODO reuse ringBuffer.rejoin()?
      if (n > 1 && clean & 2) ringSegments.push(ringSegments.pop().concat(ringSegments.shift()))

      segments.push(ringSegments.filter(validSegment))
    }

    return clip
  }
}

function validSegment(segment) {
  return segment.length > 1
}

// Intersections are sorted along the clip edge. For both antimeridian cutting
// and circle clipping, the same comparison is used.
function compareIntersection(a, b) {
  return (
    ((a = a.x)[0] < 0 ? a[1] - halfPi - epsilon : halfPi - a[1]) -
    ((b = b.x)[0] < 0 ? b[1] - halfPi - epsilon : halfPi - b[1])
  )
}
export default function (a, b, x0, y0, x1, y1) {
  var ax = a[0],
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
import { abs, epsilon } from "../math.js"
import clipBuffer from "./buffer.js"
import clipLine from "./line.js"
import clipRejoin from "./rejoin.js"
import { merge } from "d3-array"

var clipMax = 1e9,
  clipMin = -clipMax

// TODO Use d3-polygon’s polygonContains here for the ring check?
// TODO Eliminate duplicate buffering in clipBuffer and polygon.push?

export default function clipRectangle(x0, y0, x1, y1) {
  function visible(x, y) {
    return x0 <= x && x <= x1 && y0 <= y && y <= y1
  }

  function interpolate(from, to, direction, stream) {
    var a = 0,
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
    var ca = corner(a, 1),
      cb = corner(b, 1)
    return ca !== cb ? ca - cb : ca === 0 ? b[1] - a[1] : ca === 1 ? a[0] - b[0] : ca === 2 ? a[1] - b[1] : b[0] - a[0]
  }

  return function (stream) {
    var activeStream = stream,
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

    var clipStream = {
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
      var winding = 0

      for (var i = 0, n = polygon.length; i < n; ++i) {
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

    // Buffer geometry within a polygon and then clip it en masse.
    function polygonStart() {
      ;(activeStream = bufferStream), (segments = []), (polygon = []), (clean = true)
    }

    function polygonEnd() {
      var startInside = polygonInside(),
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

    // TODO rather than special-case polygons, simply handle them separately.
    // Ideally, coincident intersection points should be jittered to avoid
    // clipping issues.
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
      var v = visible(x, y)
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
          var a = [(x_ = Math.max(clipMin, Math.min(clipMax, x_))), (y_ = Math.max(clipMin, Math.min(clipMax, y_)))],
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
import pointEqual from "../pointEqual.js"
import { epsilon } from "../math.js"

function Intersection(point, points, other, entry) {
  this.x = point
  this.z = points
  this.o = other // another intersection
  this.e = entry // is an entry?
  this.v = false // visited
  this.n = this.p = null // next & previous
}

// A generalized polygon clipping algorithm: given a polygon that has been cut
// into its visible line segments, and rejoins the segments by interpolating
// along the clip edge.
export default function (segments, compareIntersection, startInside, interpolate, stream) {
  var subject = [],
    clip = [],
    i,
    n

  segments.forEach(function (segment) {
    if ((n = segment.length - 1) <= 0) return
    var n,
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
      // handle degenerate cases by moving the point
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

  var start = subject[0],
    points,
    point

  while (1) {
    // Find first unvisited intersection.
    var current = start,
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
  var n,
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
