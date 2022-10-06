import { path } from "./path.js"
import constant from "./constant.js"
import { abs, acos, asin, atan2, cos, epsilon, halfPi, max, min, pi, sin, sqrt, tau } from "./math.js"
function arcInnerRadius(d) {
  return d.innerRadius
}
function arcOuterRadius(d) {
  return d.outerRadius
}
function arcStartAngle(d) {
  return d.startAngle
}
function arcEndAngle(d) {
  return d.endAngle
}
function arcPadAngle(d) {
  return d && d.padAngle // Note: optional!
}
function intersect(x0, y0, x1, y1, x2, y2, x3, y3) {
  var x10 = x1 - x0,
    y10 = y1 - y0,
    x32 = x3 - x2,
    y32 = y3 - y2,
    t = y32 * x10 - x32 * y10
  if (t * t < epsilon) return
  t = (x32 * (y0 - y2) - y32 * (x0 - x2)) / t
  return [x0 + t * x10, y0 + t * y10]
}
function cornerTangents(x0, y0, x1, y1, r1, rc, cw) {
  var x01 = x0 - x1,
    y01 = y0 - y1,
    lo = (cw ? rc : -rc) / sqrt(x01 * x01 + y01 * y01),
    ox = lo * y01,
    oy = -lo * x01,
    x11 = x0 + ox,
    y11 = y0 + oy,
    x10 = x1 + ox,
    y10 = y1 + oy,
    x00 = (x11 + x10) / 2,
    y00 = (y11 + y10) / 2,
    dx = x10 - x11,
    dy = y10 - y11,
    d2 = dx * dx + dy * dy,
    r = r1 - rc,
    D = x11 * y10 - x10 * y11,
    d = (dy < 0 ? -1 : 1) * sqrt(max(0, r * r * d2 - D * D)),
    cx0 = (D * dy - dx * d) / d2,
    cy0 = (-D * dx - dy * d) / d2,
    cx1 = (D * dy + dx * d) / d2,
    cy1 = (-D * dx + dy * d) / d2,
    dx0 = cx0 - x00,
    dy0 = cy0 - y00,
    dx1 = cx1 - x00,
    dy1 = cy1 - y00
  if (dx0 * dx0 + dy0 * dy0 > dx1 * dx1 + dy1 * dy1) (cx0 = cx1), (cy0 = cy1)
  return {
    cx: cx0,
    cy: cy0,
    x01: -ox,
    y01: -oy,
    x11: cx0 * (r1 / r - 1),
    y11: cy0 * (r1 / r - 1),
  }
}
export function () {
  var innerRadius = arcInnerRadius,
    outerRadius = arcOuterRadius,
    cornerRadius = constant(0),
    padRadius = null,
    startAngle = arcStartAngle,
    endAngle = arcEndAngle,
    padAngle = arcPadAngle,
    context = null
  function arc() {
    var buffer,
      r,
      r0 = +innerRadius.apply(this, arguments),
      r1 = +outerRadius.apply(this, arguments),
      a0 = startAngle.apply(this, arguments) - halfPi,
      a1 = endAngle.apply(this, arguments) - halfPi,
      da = abs(a1 - a0),
      cw = a1 > a0
    if (!context) context = buffer = path()
    if (r1 < r0) (r = r1), (r1 = r0), (r0 = r)
    if (!(r1 > epsilon)) context.moveTo(0, 0)
    else if (da > tau - epsilon) {
      context.moveTo(r1 * cos(a0), r1 * sin(a0))
      context.arc(0, 0, r1, a0, a1, !cw)
      if (r0 > epsilon) {
        context.moveTo(r0 * cos(a1), r0 * sin(a1))
        context.arc(0, 0, r0, a1, a0, cw)
      }
    } else {
      var a01 = a0,
        a11 = a1,
        a00 = a0,
        a10 = a1,
        da0 = da,
        da1 = da,
        ap = padAngle.apply(this, arguments) / 2,
        rp = ap > epsilon && (padRadius ? +padRadius.apply(this, arguments) : sqrt(r0 * r0 + r1 * r1)),
        rc = min(abs(r1 - r0) / 2, +cornerRadius.apply(this, arguments)),
        rc0 = rc,
        rc1 = rc,
        t0,
        t1
      if (rp > epsilon) {
        var p0 = asin((rp / r0) * sin(ap)),
          p1 = asin((rp / r1) * sin(ap))
        if ((da0 -= p0 * 2) > epsilon) (p0 *= cw ? 1 : -1), (a00 += p0), (a10 -= p0)
        else (da0 = 0), (a00 = a10 = (a0 + a1) / 2)
        if ((da1 -= p1 * 2) > epsilon) (p1 *= cw ? 1 : -1), (a01 += p1), (a11 -= p1)
        else (da1 = 0), (a01 = a11 = (a0 + a1) / 2)
      }
      var x01 = r1 * cos(a01),
        y01 = r1 * sin(a01),
        x10 = r0 * cos(a10),
        y10 = r0 * sin(a10)
      if (rc > epsilon) {
        var x11 = r1 * cos(a11),
          y11 = r1 * sin(a11),
          x00 = r0 * cos(a00),
          y00 = r0 * sin(a00),
          oc
        if (da < pi && (oc = intersect(x01, y01, x00, y00, x11, y11, x10, y10))) {
          var ax = x01 - oc[0],
            ay = y01 - oc[1],
            bx = x11 - oc[0],
            by = y11 - oc[1],
            kc = 1 / sin(acos((ax * bx + ay * by) / (sqrt(ax * ax + ay * ay) * sqrt(bx * bx + by * by))) / 2),
            lc = sqrt(oc[0] * oc[0] + oc[1] * oc[1])
          rc0 = min(rc, (r0 - lc) / (kc - 1))
          rc1 = min(rc, (r1 - lc) / (kc + 1))
        }
      }
      if (!(da1 > epsilon)) context.moveTo(x01, y01)
      else if (rc1 > epsilon) {
        t0 = cornerTangents(x00, y00, x01, y01, r1, rc1, cw)
        t1 = cornerTangents(x11, y11, x10, y10, r1, rc1, cw)
        context.moveTo(t0.cx + t0.x01, t0.cy + t0.y01)
        if (rc1 < rc) context.arc(t0.cx, t0.cy, rc1, atan2(t0.y01, t0.x01), atan2(t1.y01, t1.x01), !cw)
        else {
          context.arc(t0.cx, t0.cy, rc1, atan2(t0.y01, t0.x01), atan2(t0.y11, t0.x11), !cw)
          context.arc(0, 0, r1, atan2(t0.cy + t0.y11, t0.cx + t0.x11), atan2(t1.cy + t1.y11, t1.cx + t1.x11), !cw)
          context.arc(t1.cx, t1.cy, rc1, atan2(t1.y11, t1.x11), atan2(t1.y01, t1.x01), !cw)
        }
      } else context.moveTo(x01, y01), context.arc(0, 0, r1, a01, a11, !cw)
      if (!(r0 > epsilon) || !(da0 > epsilon)) context.lineTo(x10, y10)
      else if (rc0 > epsilon) {
        t0 = cornerTangents(x10, y10, x11, y11, r0, -rc0, cw)
        t1 = cornerTangents(x01, y01, x00, y00, r0, -rc0, cw)
        context.lineTo(t0.cx + t0.x01, t0.cy + t0.y01)
        if (rc0 < rc) context.arc(t0.cx, t0.cy, rc0, atan2(t0.y01, t0.x01), atan2(t1.y01, t1.x01), !cw)
        else {
          context.arc(t0.cx, t0.cy, rc0, atan2(t0.y01, t0.x01), atan2(t0.y11, t0.x11), !cw)
          context.arc(0, 0, r0, atan2(t0.cy + t0.y11, t0.cx + t0.x11), atan2(t1.cy + t1.y11, t1.cx + t1.x11), cw)
          context.arc(t1.cx, t1.cy, rc0, atan2(t1.y11, t1.x11), atan2(t1.y01, t1.x01), !cw)
        }
      } else context.arc(0, 0, r0, a10, a00, cw)
    }
    context.closePath()
    if (buffer) return (context = null), buffer + "" || null
  }
  arc.centroid = function () {
    var r = (+innerRadius.apply(this, arguments) + +outerRadius.apply(this, arguments)) / 2,
      a = (+startAngle.apply(this, arguments) + +endAngle.apply(this, arguments)) / 2 - pi / 2
    return [cos(a) * r, sin(a) * r]
  }
  arc.innerRadius = function (_) {
    return arguments.length ? ((innerRadius = typeof _ === "function" ? _ : constant(+_)), arc) : innerRadius
  }
  arc.outerRadius = function (_) {
    return arguments.length ? ((outerRadius = typeof _ === "function" ? _ : constant(+_)), arc) : outerRadius
  }
  arc.cornerRadius = function (_) {
    return arguments.length ? ((cornerRadius = typeof _ === "function" ? _ : constant(+_)), arc) : cornerRadius
  }
  arc.padRadius = function (_) {
    return arguments.length
      ? ((padRadius = _ == null ? null : typeof _ === "function" ? _ : constant(+_)), arc)
      : padRadius
  }
  arc.startAngle = function (_) {
    return arguments.length ? ((startAngle = typeof _ === "function" ? _ : constant(+_)), arc) : startAngle
  }
  arc.endAngle = function (_) {
    return arguments.length ? ((endAngle = typeof _ === "function" ? _ : constant(+_)), arc) : endAngle
  }
  arc.padAngle = function (_) {
    return arguments.length ? ((padAngle = typeof _ === "function" ? _ : constant(+_)), arc) : padAngle
  }
  arc.context = function (_) {
    return arguments.length ? ((context = _ == null ? null : _), arc) : context
  }
  return arc
}
import { path } from "./path.js"
import array from "./array.js"
import constant from "./constant.js"
import curveLinear from "./curve/linear.js"
import line from "./line.js"
import { x as pointX, y as pointY } from "./point.js"
export function (x0, y0, y1) {
  var x1 = null,
    defined = constant(true),
    context = null,
    curve = curveLinear,
    output = null
  x0 = typeof x0 === "function" ? x0 : x0 === undefined ? pointX : constant(+x0)
  y0 = typeof y0 === "function" ? y0 : y0 === undefined ? constant(0) : constant(+y0)
  y1 = typeof y1 === "function" ? y1 : y1 === undefined ? pointY : constant(+y1)
  function area(data) {
    var i,
      j,
      k,
      n = (data = array(data)).length,
      d,
      defined0 = false,
      buffer,
      x0z = new Array(n),
      y0z = new Array(n)
    if (context == null) output = curve((buffer = path()))
    for (i = 0; i <= n; ++i) {
      if (!(i < n && defined((d = data[i]), i, data)) === defined0) {
        if ((defined0 = !defined0)) {
          j = i
          output.areaStart()
          output.lineStart()
        } else {
          output.lineEnd()
          output.lineStart()
          for (k = i - 1; k >= j; --k) {
            output.point(x0z[k], y0z[k])
          }
          output.lineEnd()
          output.areaEnd()
        }
      }
      if (defined0) {
        ;(x0z[i] = +x0(d, i, data)), (y0z[i] = +y0(d, i, data))
        output.point(x1 ? +x1(d, i, data) : x0z[i], y1 ? +y1(d, i, data) : y0z[i])
      }
    }
    if (buffer) return (output = null), buffer + "" || null
  }
  function arealine() {
    return line().defined(defined).curve(curve).context(context)
  }
  area.x = function (_) {
    return arguments.length ? ((x0 = typeof _ === "function" ? _ : constant(+_)), (x1 = null), area) : x0
  }
  area.x0 = function (_) {
    return arguments.length ? ((x0 = typeof _ === "function" ? _ : constant(+_)), area) : x0
  }
  area.x1 = function (_) {
    return arguments.length ? ((x1 = _ == null ? null : typeof _ === "function" ? _ : constant(+_)), area) : x1
  }
  area.y = function (_) {
    return arguments.length ? ((y0 = typeof _ === "function" ? _ : constant(+_)), (y1 = null), area) : y0
  }
  area.y0 = function (_) {
    return arguments.length ? ((y0 = typeof _ === "function" ? _ : constant(+_)), area) : y0
  }
  area.y1 = function (_) {
    return arguments.length ? ((y1 = _ == null ? null : typeof _ === "function" ? _ : constant(+_)), area) : y1
  }
  area.lineX0 = area.lineY0 = function () {
    return arealine().x(x0).y(y0)
  }
  area.lineY1 = function () {
    return arealine().x(x0).y(y1)
  }
  area.lineX1 = function () {
    return arealine().x(x1).y(y0)
  }
  area.defined = function (_) {
    return arguments.length ? ((defined = typeof _ === "function" ? _ : constant(!!_)), area) : defined
  }
  area.curve = function (_) {
    return arguments.length ? ((curve = _), context != null && (output = curve(context)), area) : curve
  }
  area.context = function (_) {
    return arguments.length ? (_ == null ? (context = output = null) : (output = curve((context = _))), area) : context
  }
  return area
}
import curveRadial, { curveRadialLinear } from "./curve/radial.js"
import area from "./area.js"
import { lineRadial } from "./lineRadial.js"
export function () {
  var a = area().curve(curveRadialLinear),
    c = a.curve,
    x0 = a.lineX0,
    x1 = a.lineX1,
    y0 = a.lineY0,
    y1 = a.lineY1
  ;(a.angle = a.x), delete a.x
  ;(a.startAngle = a.x0), delete a.x0
  ;(a.endAngle = a.x1), delete a.x1
  ;(a.radius = a.y), delete a.y
  ;(a.innerRadius = a.y0), delete a.y0
  ;(a.outerRadius = a.y1), delete a.y1
  ;(a.lineStartAngle = function () {
    return lineRadial(x0())
  }),
    delete a.lineX0
  ;(a.lineEndAngle = function () {
    return lineRadial(x1())
  }),
    delete a.lineX1
  ;(a.lineInnerRadius = function () {
    return lineRadial(y0())
  }),
    delete a.lineY0
  ;(a.lineOuterRadius = function () {
    return lineRadial(y1())
  }),
    delete a.lineY1
  a.curve = function (_) {
    return arguments.length ? c(curveRadial(_)) : c()._curve
  }
  return a
}
export const slice = Array.prototype.slice
export function (x) {
  return typeof x === "object" && "length" in x
    ? x // Array, TypedArray, NodeList, array-like
    : Array.from(x) // Map, Set, iterable, string, or anything else
}
export function (x) {
  return function constant() {
    return x
  }
}
export function (a, b) {
  return b < a ? -1 : b > a ? 1 : b >= a ? 0 : NaN
}
export function (d) {
  return d
}
export { default as arc } from "./arc.js"
export { default as area } from "./area.js"
export { default as line } from "./line.js"
export { default as pie } from "./pie.js"
export { default as areaRadial, default as radialArea } from "./areaRadial.js" // Note: radialArea is deprecated!
export { default as lineRadial, default as radialLine } from "./lineRadial.js" // Note: radialLine is deprecated!
export { default as pointRadial } from "./pointRadial.js"
export { link, linkHorizontal, linkVertical, linkRadial } from "./link.js"
export { default as symbol, symbolsStroke, symbolsFill, symbolsFill as symbols } from "./symbol.js"
export { default as symbolAsterisk } from "./symbol/asterisk.js"
export { default as symbolCircle } from "./symbol/circle.js"
export { default as symbolCross } from "./symbol/cross.js"
export { default as symbolDiamond } from "./symbol/diamond.js"
export { default as symbolDiamond2 } from "./symbol/diamond2.js"
export { default as symbolPlus } from "./symbol/plus.js"
export { default as symbolSquare } from "./symbol/square.js"
export { default as symbolSquare2 } from "./symbol/square2.js"
export { default as symbolStar } from "./symbol/star.js"
export { default as symbolTriangle } from "./symbol/triangle.js"
export { default as symbolTriangle2 } from "./symbol/triangle2.js"
export { default as symbolWye } from "./symbol/wye.js"
export { default as symbolX } from "./symbol/x.js"
export { default as curveBasisClosed } from "./curve/basisClosed.js"
export { default as curveBasisOpen } from "./curve/basisOpen.js"
export { default as curveBasis } from "./curve/basis.js"
export { bumpX as curveBumpX, bumpY as curveBumpY } from "./curve/bump.js"
export { default as curveBundle } from "./curve/bundle.js"
export { default as curveCardinalClosed } from "./curve/cardinalClosed.js"
export { default as curveCardinalOpen } from "./curve/cardinalOpen.js"
export { default as curveCardinal } from "./curve/cardinal.js"
export { default as curveCatmullRomClosed } from "./curve/catmullRomClosed.js"
export { default as curveCatmullRomOpen } from "./curve/catmullRomOpen.js"
export { default as curveCatmullRom } from "./curve/catmullRom.js"
export { default as curveLinearClosed } from "./curve/linearClosed.js"
export { default as curveLinear } from "./curve/linear.js"
export { monotoneX as curveMonotoneX, monotoneY as curveMonotoneY } from "./curve/monotone.js"
export { default as curveNatural } from "./curve/natural.js"
export { default as curveStep, stepAfter as curveStepAfter, stepBefore as curveStepBefore } from "./curve/step.js"
export { default as stack } from "./stack.js"
export { default as stackOffsetExpand } from "./offset/expand.js"
export { default as stackOffsetDiverging } from "./offset/diverging.js"
export { default as stackOffsetNone } from "./offset/none.js"
export { default as stackOffsetSilhouette } from "./offset/silhouette.js"
export { default as stackOffsetWiggle } from "./offset/wiggle.js"
export { default as stackOrderAppearance } from "./order/appearance.js"
export { default as stackOrderAscending } from "./order/ascending.js"
export { default as stackOrderDescending } from "./order/descending.js"
export { default as stackOrderInsideOut } from "./order/insideOut.js"
export { default as stackOrderNone } from "./order/none.js"
export { default as stackOrderReverse } from "./order/reverse.js"
import { path } from "./path.js"
import array from "./array.js"
import constant from "./constant.js"
import curveLinear from "./curve/linear.js"
import { x as pointX, y as pointY } from "./point.js"
export function (x, y) {
  var defined = constant(true),
    context = null,
    curve = curveLinear,
    output = null
  x = typeof x === "function" ? x : x === undefined ? pointX : constant(x)
  y = typeof y === "function" ? y : y === undefined ? pointY : constant(y)
  function line(data) {
    var i,
      n = (data = array(data)).length,
      d,
      defined0 = false,
      buffer
    if (context == null) output = curve((buffer = path()))
    for (i = 0; i <= n; ++i) {
      if (!(i < n && defined((d = data[i]), i, data)) === defined0) {
        if ((defined0 = !defined0)) output.lineStart()
        else output.lineEnd()
      }
      if (defined0) output.point(+x(d, i, data), +y(d, i, data))
    }
    if (buffer) return (output = null), buffer + "" || null
  }
  line.x = function (_) {
    return arguments.length ? ((x = typeof _ === "function" ? _ : constant(+_)), line) : x
  }
  line.y = function (_) {
    return arguments.length ? ((y = typeof _ === "function" ? _ : constant(+_)), line) : y
  }
  line.defined = function (_) {
    return arguments.length ? ((defined = typeof _ === "function" ? _ : constant(!!_)), line) : defined
  }
  line.curve = function (_) {
    return arguments.length ? ((curve = _), context != null && (output = curve(context)), line) : curve
  }
  line.context = function (_) {
    return arguments.length ? (_ == null ? (context = output = null) : (output = curve((context = _))), line) : context
  }
  return line
}
import curveRadial, { curveRadialLinear } from "./curve/radial.js"
import line from "./line.js"
export function lineRadial(l) {
  var c = l.curve
  ;(l.angle = l.x), delete l.x
  ;(l.radius = l.y), delete l.y
  l.curve = function (_) {
    return arguments.length ? c(curveRadial(_)) : c()._curve
  }
  return l
}
export function () {
  return lineRadial(line().curve(curveRadialLinear))
}
import { path } from "./path.js"
import { slice } from "./array.js"
import constant from "./constant.js"
import { bumpX, bumpY, bumpRadial } from "./curve/bump.js"
import { x as pointX, y as pointY } from "./point.js"
function linkSource(d) {
  return d.source
}
function linkTarget(d) {
  return d.target
}
export function link(curve) {
  let source = linkSource
  let target = linkTarget
  let x = pointX
  let y = pointY
  let context = null
  let output = null
  function link() {
    let buffer
    const argv = slice.call(arguments)
    const s = source.apply(this, argv)
    const t = target.apply(this, argv)
    if (context == null) output = curve((buffer = path()))
    output.lineStart()
    ;(argv[0] = s), output.point(+x.apply(this, argv), +y.apply(this, argv))
    ;(argv[0] = t), output.point(+x.apply(this, argv), +y.apply(this, argv))
    output.lineEnd()
    if (buffer) return (output = null), buffer + "" || null
  }
  link.source = function (_) {
    return arguments.length ? ((source = _), link) : source
  }
  link.target = function (_) {
    return arguments.length ? ((target = _), link) : target
  }
  link.x = function (_) {
    return arguments.length ? ((x = typeof _ === "function" ? _ : constant(+_)), link) : x
  }
  link.y = function (_) {
    return arguments.length ? ((y = typeof _ === "function" ? _ : constant(+_)), link) : y
  }
  link.context = function (_) {
    return arguments.length ? (_ == null ? (context = output = null) : (output = curve((context = _))), link) : context
  }
  return link
}
export function linkHorizontal() {
  return link(bumpX)
}
export function linkVertical() {
  return link(bumpY)
}
export function linkRadial() {
  const l = link(bumpRadial)
  ;(l.angle = l.x), delete l.x
  ;(l.radius = l.y), delete l.y
  return l
}
export const abs = Math.abs
export const atan2 = Math.atan2
export const cos = Math.cos
export const max = Math.max
export const min = Math.min
export const sin = Math.sin
export const sqrt = Math.sqrt
export const epsilon = 1e-12
export const pi = Math.PI
export const halfPi = pi / 2
export const tau = 2 * pi
export function acos(x) {
  return x > 1 ? 0 : x < -1 ? pi : Math.acos(x)
}
export function asin(x) {
  return x >= 1 ? halfPi : x <= -1 ? -halfPi : Math.asin(x)
}
export function () {}
import array from "./array.js"
import constant from "./constant.js"
import descending from "./descending.js"
import identity from "./identity.js"
import { tau } from "./math.js"
export function () {
  var value = identity,
    sortValues = descending,
    sort = null,
    startAngle = constant(0),
    endAngle = constant(tau),
    padAngle = constant(0)
  function pie(data) {
    var i,
      n = (data = array(data)).length,
      j,
      k,
      sum = 0,
      index = new Array(n),
      arcs = new Array(n),
      a0 = +startAngle.apply(this, arguments),
      da = Math.min(tau, Math.max(-tau, endAngle.apply(this, arguments) - a0)),
      a1,
      p = Math.min(Math.abs(da) / n, padAngle.apply(this, arguments)),
      pa = p * (da < 0 ? -1 : 1),
      v
    for (i = 0; i < n; ++i) {
      if ((v = arcs[(index[i] = i)] = +value(data[i], i, data)) > 0) {
        sum += v
      }
    }
    if (sortValues != null)
      index.sort(function (i, j) {
        return sortValues(arcs[i], arcs[j])
      })
    else if (sort != null)
      index.sort(function (i, j) {
        return sort(data[i], data[j])
      })
    for (i = 0, k = sum ? (da - n * pa) / sum : 0; i < n; ++i, a0 = a1) {
      ;(j = index[i]),
        (v = arcs[j]),
        (a1 = a0 + (v > 0 ? v * k : 0) + pa),
        (arcs[j] = {
          data: data[j],
          index: i,
          value: v,
          startAngle: a0,
          endAngle: a1,
          padAngle: p,
        })
    }
    return arcs
  }
  pie.value = function (_) {
    return arguments.length ? ((value = typeof _ === "function" ? _ : constant(+_)), pie) : value
  }
  pie.sortValues = function (_) {
    return arguments.length ? ((sortValues = _), (sort = null), pie) : sortValues
  }
  pie.sort = function (_) {
    return arguments.length ? ((sort = _), (sortValues = null), pie) : sort
  }
  pie.startAngle = function (_) {
    return arguments.length ? ((startAngle = typeof _ === "function" ? _ : constant(+_)), pie) : startAngle
  }
  pie.endAngle = function (_) {
    return arguments.length ? ((endAngle = typeof _ === "function" ? _ : constant(+_)), pie) : endAngle
  }
  pie.padAngle = function (_) {
    return arguments.length ? ((padAngle = typeof _ === "function" ? _ : constant(+_)), pie) : padAngle
  }
  return pie
}
export function x(p) {
  return p[0]
}
export function y(p) {
  return p[1]
}
export function (x, y) {
  return [(y = +y) * Math.cos((x -= Math.PI / 2)), y * Math.sin(x)]
}
import array from "./array.js"
import constant from "./constant.js"
import offsetNone from "./offset/none.js"
import orderNone from "./order/none.js"
function stackValue(d, key) {
  return d[key]
}
function stackSeries(key) {
  const series = []
  series.key = key
  return series
}
export function () {
  var keys = constant([]),
    order = orderNone,
    offset = offsetNone,
    value = stackValue
  function stack(data) {
    var sz = Array.from(keys.apply(this, arguments), stackSeries),
      i,
      n = sz.length,
      j = -1,
      oz
    for (const d of data) {
      for (i = 0, ++j; i < n; ++i) {
        ;(sz[i][j] = [0, +value(d, sz[i].key, j, data)]).data = d
      }
    }
    for (i = 0, oz = array(order(sz)); i < n; ++i) {
      sz[oz[i]].index = i
    }
    offset(sz, oz)
    return sz
  }
  stack.keys = function (_) {
    return arguments.length ? ((keys = typeof _ === "function" ? _ : constant(Array.from(_))), stack) : keys
  }
  stack.value = function (_) {
    return arguments.length ? ((value = typeof _ === "function" ? _ : constant(+_)), stack) : value
  }
  stack.order = function (_) {
    return arguments.length
      ? ((order = _ == null ? orderNone : typeof _ === "function" ? _ : constant(Array.from(_))), stack)
      : order
  }
  stack.offset = function (_) {
    return arguments.length ? ((offset = _ == null ? offsetNone : _), stack) : offset
  }
  return stack
}
import { path } from "./path.js"
import constant from "./constant.js"
import asterisk from "./symbol/asterisk.js"
import circle from "./symbol/circle.js"
import cross from "./symbol/cross.js"
import diamond from "./symbol/diamond.js"
import diamond2 from "./symbol/diamond2.js"
import plus from "./symbol/plus.js"
import square from "./symbol/square.js"
import square2 from "./symbol/square2.js"
import star from "./symbol/star.js"
import triangle from "./symbol/triangle.js"
import triangle2 from "./symbol/triangle2.js"
import wye from "./symbol/wye.js"
import x from "./symbol/x.js"
export const symbolsFill = [circle, cross, diamond, square, star, triangle, wye]
export const symbolsStroke = [circle, plus, x, triangle2, asterisk, square2, diamond2]
export function Symbol(type, size) {
  let context = null
  type = typeof type === "function" ? type : constant(type || circle)
  size = typeof size === "function" ? size : constant(size === undefined ? 64 : +size)
  function symbol() {
    let buffer
    if (!context) context = buffer = path()
    type.apply(this, arguments).draw(context, +size.apply(this, arguments))
    if (buffer) return (context = null), buffer + "" || null
  }
  symbol.type = function (_) {
    return arguments.length ? ((type = typeof _ === "function" ? _ : constant(_)), symbol) : type
  }
  symbol.size = function (_) {
    return arguments.length ? ((size = typeof _ === "function" ? _ : constant(+_)), symbol) : size
  }
  symbol.context = function (_) {
    return arguments.length ? ((context = _ == null ? null : _), symbol) : context
  }
  return symbol
}
