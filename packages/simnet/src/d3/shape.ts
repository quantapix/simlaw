/* eslint-disable no-fallthrough */
import { Path } from "./path.js"
import type * as qt from "./types.js"

export const abs = Math.abs
export const atan2 = Math.atan2
export const cos = Math.cos
export const max = Math.max
export const min = Math.min
export const sin = Math.sin
export const sqrt = Math.sqrt

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
  let x10 = x1 - x0,
    y10 = y1 - y0,
    x32 = x3 - x2,
    y32 = y3 - y2,
    t = y32 * x10 - x32 * y10
  if (t * t < epsilon) return
  t = (x32 * (y0 - y2) - y32 * (x0 - x2)) / t
  return [x0 + t * x10, y0 + t * y10]
}
function cornerTangents(x0, y0, x1, y1, r1, rc, cw) {
  let x01 = x0 - x1,
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
export function arc(): qt.Arc<any, qt.DefaultArcObject>
export function arc<T>(): qt.Arc<any, T>
export function arc<This, T>(): qt.Arc<This, T>
export function arc() {
  let innerRadius = arcInnerRadius,
    outerRadius = arcOuterRadius,
    cornerRadius = constant(0),
    padRadius = null,
    startAngle = arcStartAngle,
    endAngle = arcEndAngle,
    padAngle = arcPadAngle,
    context = null
  function y() {
    let buffer,
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
      let a01 = a0,
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
        let p0 = asin((rp / r0) * sin(ap)),
          p1 = asin((rp / r1) * sin(ap))
        if ((da0 -= p0 * 2) > epsilon) (p0 *= cw ? 1 : -1), (a00 += p0), (a10 -= p0)
        else (da0 = 0), (a00 = a10 = (a0 + a1) / 2)
        if ((da1 -= p1 * 2) > epsilon) (p1 *= cw ? 1 : -1), (a01 += p1), (a11 -= p1)
        else (da1 = 0), (a01 = a11 = (a0 + a1) / 2)
      }
      const x01 = r1 * cos(a01),
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
          const ax = x01 - oc[0],
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
  y.centroid = function () {
    const r = (+innerRadius.apply(this, arguments) + +outerRadius.apply(this, arguments)) / 2,
      a = (+startAngle.apply(this, arguments) + +endAngle.apply(this, arguments)) / 2 - pi / 2
    return [cos(a) * r, sin(a) * r]
  }
  y.innerRadius = function (_) {
    return arguments.length ? ((innerRadius = typeof _ === "function" ? _ : constant(+_)), y) : innerRadius
  }
  y.outerRadius = function (_) {
    return arguments.length ? ((outerRadius = typeof _ === "function" ? _ : constant(+_)), y) : outerRadius
  }
  y.cornerRadius = function (_) {
    return arguments.length ? ((cornerRadius = typeof _ === "function" ? _ : constant(+_)), y) : cornerRadius
  }
  y.padRadius = function (_) {
    return arguments.length
      ? ((padRadius = _ == null ? null : typeof _ === "function" ? _ : constant(+_)), y)
      : padRadius
  }
  y.startAngle = function (_) {
    return arguments.length ? ((startAngle = typeof _ === "function" ? _ : constant(+_)), y) : startAngle
  }
  y.endAngle = function (_) {
    return arguments.length ? ((endAngle = typeof _ === "function" ? _ : constant(+_)), y) : endAngle
  }
  y.padAngle = function (_) {
    return arguments.length ? ((padAngle = typeof _ === "function" ? _ : constant(+_)), y) : padAngle
  }
  y.context = function (_) {
    return arguments.length ? ((context = _ == null ? null : _), y) : context
  }
  return y
}

export function area<T = [number, number]>(
  x0?: number | ((x: T, i: number, xs: T[]) => number),
  y0?: number | ((x: T, i: number, xs: T[]) => number),
  y1?: number | ((x: T, i: number, xs: T[]) => number)
): qt.Area<T> {
  let x1 = null,
    defined = constant(true),
    context = null,
    curve = curveLinear,
    output = null
  x0 = typeof x0 === "function" ? x0 : x0 === undefined ? pointX : constant(+x0)
  y0 = typeof y0 === "function" ? y0 : y0 === undefined ? constant(0) : constant(+y0)
  y1 = typeof y1 === "function" ? y1 : y1 === undefined ? pointY : constant(+y1)
  function y(xs: Iterable<T> | T[]): string | null
  function y(xs: Iterable<T> | T[]): void
  function y(xs: any) {
    const n = (xs = array(xs)).length,
      x0z = new Array(n),
      y0z = new Array(n)
    let i,
      j,
      k,
      d,
      defined0 = false,
      buffer
    if (context == null) output = curve((buffer = new Path()))
    for (i = 0; i <= n; ++i) {
      if (!(i < n && defined((d = xs[i]), i, xs)) === defined0) {
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
        ;(x0z[i] = +x0(d, i, xs)), (y0z[i] = +y0(d, i, xs))
        output.point(x1 ? +x1(d, i, xs) : x0z[i], y1 ? +y1(d, i, xs) : y0z[i])
      }
    }
    if (buffer) return (output = null), buffer + "" || null
  }
  function arealine() {
    return line().defined(defined).curve(curve).context(context)
  }
  y.x = function (_) {
    return arguments.length ? ((x0 = typeof _ === "function" ? _ : constant(+_)), (x1 = null), y) : x0
  }
  y.x0 = function (...xs: any[]) {
    return xs.length ? ((x0 = typeof _ === "function" ? _ : constant(+_)), y) : x0
  }
  y.x1 = function (_) {
    return arguments.length ? ((x1 = _ == null ? null : typeof _ === "function" ? _ : constant(+_)), y) : x1
  }
  y.y = function (_) {
    return arguments.length ? ((y0 = typeof _ === "function" ? _ : constant(+_)), (y1 = null), y) : y0
  }
  y.y0 = function (_) {
    return arguments.length ? ((y0 = typeof _ === "function" ? _ : constant(+_)), y) : y0
  }
  y.y1 = function (_) {
    return arguments.length ? ((y1 = _ == null ? null : typeof _ === "function" ? _ : constant(+_)), y) : y1
  }
  y.lineX0 = y.lineY0 = function () {
    return arealine().x(x0).y(y0)
  }
  y.lineY1 = function () {
    return arealine().x(x0).y(y1)
  }
  y.lineX1 = function () {
    return arealine().x(x1).y(y0)
  }
  y.defined = function (_) {
    return arguments.length ? ((defined = typeof _ === "function" ? _ : constant(!!_)), y) : defined
  }
  y.curve = function (_) {
    return arguments.length ? ((curve = _), context != null && (output = curve(context)), y) : curve
  }
  y.context = function (_) {
    return arguments.length ? (_ == null ? (context = output = null) : (output = curve((context = _))), y) : context
  }
  return y
}
export function areaRadial(): qt.AreaRadial<[number, number]>
export function areaRadial<T>(): qt.AreaRadial<T>
export function areaRadial() {
  const y = area().curve(curveRadialLinear),
    c = y.curve,
    x0 = y.lineX0,
    x1 = y.lineX1,
    y0 = y.lineY0,
    y1 = y.lineY1
  ;(y.angle = y.x), delete y.x
  ;(y.startAngle = y.x0), delete y.x0
  ;(y.endAngle = y.x1), delete y.x1
  ;(y.radius = y.y), delete y.y
  ;(y.innerRadius = y.y0), delete y.y0
  ;(y.outerRadius = y.y1), delete y.y1
  ;(y.lineStartAngle = function () {
    return lineRadial(x0())
  }),
    delete y.lineX0
  ;(y.lineEndAngle = function () {
    return lineRadial(x1())
  }),
    delete y.lineX1
  ;(y.lineInnerRadius = function () {
    return lineRadial(y0())
  }),
    delete y.lineY0
  ;(y.lineOuterRadius = function () {
    return lineRadial(y1())
  }),
    delete y.lineY1
  y.curve = function (_) {
    return arguments.length ? c(curveRadial(_)) : c()._curve
  }
  return y
}
export const slice = Array.prototype.slice
export function array(x) {
  return typeof x === "object" && "length" in x
    ? x // Array, TypedArray, NodeList, array-like
    : Array.from(x) // Map, Set, iterable, string, or anything else
}
export function constant(x) {
  return function constant() {
    return x
  }
}
export function descending(a, b) {
  return b < a ? -1 : b > a ? 1 : b >= a ? 0 : NaN
}
export function identity(d) {
  return d
}
export function line<T = [number, number]>(
  x?: number | ((d: T, i: number, data: T[]) => number),
  y?: number | ((d: T, i: number, data: T[]) => number)
): qt.Line<T> {
  let defined = constant(true),
    context = null,
    curve = curveLinear,
    output = null
  x = typeof x === "function" ? x : x === undefined ? pointX : constant(x)
  y = typeof y === "function" ? y : y === undefined ? pointY : constant(y)
  function y(data) {
    let i,
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
  y.x = function (_) {
    return arguments.length ? ((x = typeof _ === "function" ? _ : constant(+_)), y) : x
  }
  y.y = function (_) {
    return arguments.length ? ((y = typeof _ === "function" ? _ : constant(+_)), y) : y
  }
  y.defined = function (_) {
    return arguments.length ? ((defined = typeof _ === "function" ? _ : constant(!!_)), y) : defined
  }
  y.curve = function (_) {
    return arguments.length ? ((curve = _), context != null && (output = curve(context)), y) : curve
  }
  y.context = function (_) {
    return arguments.length ? (_ == null ? (context = output = null) : (output = curve((context = _))), y) : context
  }
  return y
}
export function lineRadial(): qt.LineRadial<[number, number]>
export function lineRadial<T>(): qt.LineRadial<T>
export function lineRadial() {
  function y(l) {
    const c = l.curve
    ;(l.angle = l.x), delete l.x
    ;(l.radius = l.y), delete l.y
    l.curve = function (_) {
      return arguments.length ? c(curveRadial(_)) : c()._curve
    }
    return l
  }
  return y(line().curve(curveRadialLinear))
}
function linkSource(d) {
  return d.source
}
function linkTarget(d) {
  return d.target
}
export function link(x: qt.CurveFactory): qt.Link<any, qt.DefaultLinkObject, [number, number]>
export function link<L, N>(x: qt.CurveFactory): qt.Link<any, L, N>
export function link<This, L, N>(x: qt.CurveFactory): qt.Link<This, L, N>
export function link(curve) {
  let source = linkSource
  let target = linkTarget
  let x = pointX
  let y = pointY
  let context = null
  let output = null
  function f() {
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
  f.source = function (_) {
    return arguments.length ? ((source = _), f) : source
  }
  f.target = function (_) {
    return arguments.length ? ((target = _), f) : target
  }
  f.x = function (_) {
    return arguments.length ? ((x = typeof _ === "function" ? _ : constant(+_)), f) : x
  }
  f.y = function (_) {
    return arguments.length ? ((y = typeof _ === "function" ? _ : constant(+_)), f) : y
  }
  f.context = function (_) {
    return arguments.length ? (_ == null ? (context = output = null) : (output = curve((context = _))), f) : context
  }
  return f
}
export function linkHorizontal(): qt.Link<any, qt.DefaultLinkObject, [number, number]>
export function linkHorizontal<L, N>(): qt.Link<any, L, N>
export function linkHorizontal<This, L, N>(): qt.Link<This, L, N>
export function linkHorizontal() {
  return link(bumpX)
}
export function linkVertical(): qt.Link<any, qt.DefaultLinkObject, [number, number]>
export function linkVertical<L, N>(): qt.Link<any, L, N>
export function linkVertical<This, L, N>(): qt.Link<This, L, N>
export function linkVertical() {
  return link(bumpY)
}
export function linkRadial(): qt.LinkRadial<any, qt.DefaultLinkObject, [number, number]>
export function linkRadial<L, N>(): qt.LinkRadial<any, L, N>
export function linkRadial<This, L, N>(): qt.LinkRadial<This, L, N>
export function linkRadial() {
  const l = link(bumpRadial)
  ;(l.angle = l.x), delete l.x
  ;(l.radius = l.y), delete l.y
  return l
}
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
export function noop() {}

export function pie(): qt.Pie<any, number | { valueOf(): number }>
export function pie<T>(): qt.Pie<any, T>
export function pie<This, T>(): qt.Pie<This, T>
export function pie() {
  let value = identity,
    sortValues = descending,
    sort = null,
    startAngle = constant(0),
    endAngle = constant(tau),
    padAngle = constant(0)
  function y(data) {
    let i,
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
  y.value = function (_) {
    return arguments.length ? ((value = typeof _ === "function" ? _ : constant(+_)), y) : value
  }
  y.sortValues = function (_) {
    return arguments.length ? ((sortValues = _), (sort = null), y) : sortValues
  }
  y.sort = function (_) {
    return arguments.length ? ((sort = _), (sortValues = null), y) : sort
  }
  y.startAngle = function (_) {
    return arguments.length ? ((startAngle = typeof _ === "function" ? _ : constant(+_)), y) : startAngle
  }
  y.endAngle = function (_) {
    return arguments.length ? ((endAngle = typeof _ === "function" ? _ : constant(+_)), y) : endAngle
  }
  y.padAngle = function (_) {
    return arguments.length ? ((padAngle = typeof _ === "function" ? _ : constant(+_)), y) : padAngle
  }
  return y
}
export function pointX(p) {
  return p[0]
}
export function pointY(p) {
  return p[1]
}
export function pointRadial(a: number, r: number): [number, number] {
  return [(r = +r) * Math.cos((a -= Math.PI / 2)), r * Math.sin(a)]
}
function stackValue(d, key) {
  return d[key]
}
function stackSeries(key) {
  const series = []
  series.key = key
  return series
}
export function stack(): qt.Stack<any, { [k: string]: number }, string>
export function stack<T>(): qt.Stack<any, T, string>
export function stack<T, K>(): qt.Stack<any, T, K>
export function stack<This, T, K>(): qt.Stack<This, T, K>
export function stack() {
  let keys = constant([]),
    order = orderNone,
    offset = offsetNone,
    value = stackValue
  function y(data) {
    let sz = Array.from(keys.apply(this, arguments), stackSeries),
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
  y.keys = function (_) {
    return arguments.length ? ((keys = typeof _ === "function" ? _ : constant(Array.from(_))), y) : keys
  }
  y.value = function (_) {
    return arguments.length ? ((value = typeof _ === "function" ? _ : constant(+_)), y) : value
  }
  y.order = function (_) {
    return arguments.length
      ? ((order = _ == null ? orderNone : typeof _ === "function" ? _ : constant(Array.from(_))), y)
      : order
  }
  y.offset = function (_) {
    return arguments.length ? ((offset = _ == null ? offsetNone : _), y) : offset
  }
  return y
}

export function symbol<T = any>(
  type?: qt.SymbolType | ((this: any, x: T, ...xs: any[]) => qt.SymbolType),
  size?: number | ((this: any, x: T, ...xs: any[]) => number)
): qt.Symbol<any, T>
export function symbol<This, T>(
  type?: qt.SymbolType | ((this: This, x: T, ...xs: any[]) => qt.SymbolType),
  size?: number | ((this: This, x: T, ...xs: any[]) => number)
): qt.Symbol<This, T>
export function symbol(...xs: any[]) {
  let buffer
  if (!context) context = buffer = new Path()
  type.apply(this, ...xs).draw(context, +size.apply(this, ...xs))
  if (buffer) return (context = null), buffer + "" || null
}

export class Symbol<This, T> implements qt.Symbol<This, T> {
  context = null
  size: any
  type: any
  constructor(type, size?: number) {
    this.size = typeof size === "function" ? size : constant(size === undefined ? 64 : +size)
    this.type = typeof type === "function" ? type : constant(type || circle)
  }
  context(...xs: any[]) {
    return xs.length ? ((this.context = xs == null ? null : xs), symbol) : this.context
  }
  size(...xs: any[]) {
    return xs.length ? ((this.size = typeof xs === "function" ? xs : constant(+xs)), symbol) : this.size
  }
  type(...xs: any[]) {
    return xs.length ? ((this.type = typeof xs === "function" ? xs : constant(xs)), symbol) : this.type
  }
}

export namespace offset {
  export function diverging(xs: qt.Series<any, any>, order: Iterable<number>) {
    const n = xs.length
    if (!(n > 0)) return
    for (let i, j = 0, d, dy, yp, yn, m = xs[order[0]].length; j < m; ++j) {
      for (yp = yn = 0, i = 0; i < n; ++i) {
        if ((dy = (d = xs[order[i]][j])[1] - d[0]) > 0) {
          ;(d[0] = yp), (d[1] = yp += dy)
        } else if (dy < 0) {
          ;(d[1] = yn), (d[0] = yn += dy)
        } else {
          ;(d[0] = 0), (d[1] = dy)
        }
      }
    }
  }
  export function expand(xs: qt.Series<any, any>, order: Iterable<number>) {
    const n = xs.length
    if (!(n > 0)) return
    for (let i, j = 0, m = xs[0].length, y; j < m; ++j) {
      for (y = i = 0; i < n; ++i) y += xs[i][j][1] || 0
      if (y) for (i = 0; i < n; ++i) xs[i][j][1] /= y
    }
    none(xs, order)
  }
  export function none(xs: qt.Series<any, any>, order: Iterable<number>) {
    const n = xs.length
    if (!(n > 1)) return
    for (let i = 1, j, s0, s1 = xs[order[0]], n, m = s1.length; i < n; ++i) {
      ;(s0 = s1), (s1 = xs[order[i]])
      for (j = 0; j < m; ++j) {
        s1[j][1] += s1[j][0] = isNaN(s0[j][1]) ? s0[j][0] : s0[j][1]
      }
    }
  }
  export function silhouette(xs: qt.Series<any, any>, order: Iterable<number>) {
    const n = xs.length
    if (!(n > 0)) return
    for (let j = 0, s0 = xs[order[0]], m = s0.length; j < m; ++j) {
      for (let i = 0, y = 0; i < n; ++i) y += xs[i][j][1] || 0
      s0[j][1] += s0[j][0] = -y / 2
    }
    none(xs, order)
  }
  export function wiggle(xs: qt.Series<any, any>, order: Iterable<number>) {
    const n = xs.length
    if (!(n > 0) || !((m = (s0 = xs[order[0]]).length) > 0)) return
    for (let y = 0, j = 1, s0, m; j < m; ++j) {
      for (let i = 0, s1 = 0, s2 = 0; i < n; ++i) {
        let si = xs[order[i]],
          sij0 = si[j][1] || 0,
          sij1 = si[j - 1][1] || 0,
          s3 = (sij0 - sij1) / 2
        for (let k = 0; k < i; ++k) {
          const sk = xs[order[k]],
            skj0 = sk[j][1] || 0,
            skj1 = sk[j - 1][1] || 0
          s3 += skj0 - skj1
        }
        ;(s1 += sij0), (s2 += s3 * sij0)
      }
      s0[j - 1][1] += s0[j - 1][0] = y
      if (s1) y -= s2 / s1
    }
    s0[j - 1][1] += s0[j - 1][0] = y
    none(xs, order)
  }
}

export namespace order {
  export function appearance(xs: qt.Series<any, any>): number[] {
    function peak(series) {
      const n = series.length
      let i = -1,
        j = 0,
        vi,
        vj = -Infinity
      while (++i < n) if ((vi = +series[i][1]) > vj) (vj = vi), (j = i)
      return j
    }
    const peaks = xs.map(peak)
    return none(xs).sort(function (a, b) {
      return peaks[a] - peaks[b]
    })
  }
  export function ascending(xs: qt.Series<any, any>): number[] {
    const sums = xs.map(sum)
    return none(xs).sort(function (a, b) {
      return sums[a] - sums[b]
    })
  }
  export function sum(xs) {
    const n = xs.length
    let s = 0,
      i = -1,
      v
    while (++i < n) if ((v = +xs[i][1])) s += v
    return s
  }
  export function descending(xs: qt.Series<any, any>): number[] {
    return ascending(xs).reverse()
  }
  export function insideOut(xs: qt.Series<any, any>): number[] {
    const n = xs.length,
      sums = xs.map(sum),
      order = appearance(xs),
      tops = [],
      bottoms = []
    let i,
      j,
      top = 0,
      bottom = 0
    for (i = 0; i < n; ++i) {
      j = order[i]
      if (top < bottom) {
        top += sums[j]
        tops.push(j)
      } else {
        bottom += sums[j]
        bottoms.push(j)
      }
    }
    return bottoms.reverse().concat(tops)
  }
  export function none(xs: qt.Series<any, any>): number[] {
    let n = xs.length
    const o = new Array(n)
    while (--n >= 0) o[n] = n
    return o
  }
  export function reverse(xs: qt.Series<any, any>): number[] {
    return none(xs).reverse()
  }
}

export class Curve {
  static basis(x) {
    return new Curve.Basis(x)
  }
  static basisClosed(x) {
    return new Curve.BasisClosed(x)
  }
  static basisOpen(x) {
    return new Curve.BasisOpen(x)
  }
  static bumpX(x) {
    return new Curve.Bump(x, true)
  }
  static bumpY(x) {
    return new Curve.Bump(x, false)
  }
  static linear(x) {
    return new Curve.Linear(x)
  }
  static linearClosed(x) {
    return new Curve.LinearClosed(x)
  }
  static natural(x) {
    return new Curve.Natural(x)
  }
  static step(x) {
    return new Curve.Step(x)
  }
  static stepBefore(x) {
    return new Curve.Step(x, 0)
  }
  static stepAfter(x) {
    return new Curve.Step(x, 1)
  }

  static bundle: qt.CurveBundleFactory = (function f(beta) {
    function y(x) {
      return beta === 1 ? new Curve.Basis(x) : new Curve.Bundle(x, beta)
    }
    y.beta = function (x: number) {
      return f(+x)
    }
    return y
  })(0.85)
  static cardinal: qt.CurveCardinalFactory = (function f(tension) {
    function y(x) {
      return new Curve.Cardinal(x, tension)
    }
    y.tension = function (x: number) {
      return f(+x)
    }
    return y
  })(0)
  static cardinalClosed: qt.CurveCardinalFactory = (function f(tension) {
    function y(x) {
      return new Curve.CardinalClosed(x, tension)
    }
    y.tension = function (x: number) {
      return f(+x)
    }
    return y
  })(0)
  static cardinalOpen: qt.CurveCardinalFactory = (function f(tension) {
    function y(x) {
      return new Curve.CardinalOpen(x, tension)
    }
    y.tension = function (x: number) {
      return f(+x)
    }
    return y
  })(0)
  static catmullRom: qt.CurveCatmullRomFactory = (function f(alpha) {
    function y(x) {
      return alpha ? new Curve.CatmullRom(x, alpha) : new Curve.Cardinal(x, 0)
    }
    y.alpha = function (x: number) {
      return f(+x)
    }
    return y
  })(0.5)
  static catmullRomClosed: qt.CurveCatmullRomFactory = (function f(alpha) {
    function y(x) {
      return alpha ? new Curve.CatmullRomClosed(x, alpha) : new Curve.CardinalClosed(x, 0)
    }
    y.alpha = function (x: number) {
      return f(+x)
    }
    return y
  })(0.5)
  static catmullRomOpen: qt.CurveCatmullRomFactory = (function f(alpha) {
    function y(x) {
      return alpha ? new Curve.CatmullRomOpen(x, alpha) : new Curve.CardinalOpen(x, 0)
    }
    y.alpha = function (x: number) {
      return f(+x)
    }
    return y
  })(0.5)

  _line
  _point
  _x0
  _x1
  _x2
  _x3
  _x4
  _x5
  _y0
  _y1
  _y2
  _y3
  _y4
  _y5
  constructor(public ctx: CanvasRenderingContext2D | Path) {}
  areaStart() {}
  areaEnd() {}
}
export namespace Curve {
  export class Basis extends Curve implements qt.CurveGenerator {
    constructor(ctx: CanvasRenderingContext2D | Path) {
      super(ctx)
    }
    override areaStart() {
      this._line = 0
    }
    override areaEnd() {
      this._line = NaN
    }
    lineStart() {
      this._x0 = this._x1 = this._y0 = this._y1 = NaN
      this._point = 0
    }
    lineEnd() {
      switch (this._point) {
        case 3:
          point(this, this._x1, this._y1)
        case 2:
          this.ctx.lineTo(this._x1, this._y1)
          break
      }
      if (this._line || (this._line !== 0 && this._point === 1)) this.ctx.closePath()
      this._line = 1 - this._line
    }
    point(x: number, y: number) {
      ;(x = +x), (y = +y)
      switch (this._point) {
        case 0:
          this._point = 1
          this._line ? this.ctx.lineTo(x, y) : this.ctx.moveTo(x, y)
          break
        case 1:
          this._point = 2
          break
        case 2:
          this._point = 3
          this.ctx.lineTo((5 * this._x0 + this._x1) / 6, (5 * this._y0 + this._y1) / 6) // falls through
        default:
          point(this, x, y)
          break
      }
      ;(this._x0 = this._x1), (this._x1 = x)
      ;(this._y0 = this._y1), (this._y1 = y)
    }
  }
  export class BasisClosed extends Curve implements qt.CurveGenerator {
    constructor(ctx: CanvasRenderingContext2D | Path) {
      super(ctx)
    }
    lineStart() {
      this._x0 = this._x1 = this._x2 = this._x3 = this._x4 = this._y0 = this._y1 = this._y2 = this._y3 = this._y4 = NaN
      this._point = 0
    }
    lineEnd() {
      switch (this._point) {
        case 1: {
          this.ctx.moveTo(this._x2, this._y2)
          this.ctx.closePath()
          break
        }
        case 2: {
          this.ctx.moveTo((this._x2 + 2 * this._x3) / 3, (this._y2 + 2 * this._y3) / 3)
          this.ctx.lineTo((this._x3 + 2 * this._x2) / 3, (this._y3 + 2 * this._y2) / 3)
          this.ctx.closePath()
          break
        }
        case 3: {
          this.point(this._x2, this._y2)
          this.point(this._x3, this._y3)
          this.point(this._x4, this._y4)
          break
        }
      }
    }
    point(x: number, y: number) {
      ;(x = +x), (y = +y)
      switch (this._point) {
        case 0:
          this._point = 1
          ;(this._x2 = x), (this._y2 = y)
          break
        case 1:
          this._point = 2
          ;(this._x3 = x), (this._y3 = y)
          break
        case 2:
          this._point = 3
          ;(this._x4 = x), (this._y4 = y)
          this.ctx.moveTo((this._x0 + 4 * this._x1 + x) / 6, (this._y0 + 4 * this._y1 + y) / 6)
          break
        default:
          point(this, x, y)
          break
      }
      ;(this._x0 = this._x1), (this._x1 = x)
      ;(this._y0 = this._y1), (this._y1 = y)
    }
  }
  export class BasisOpen extends Curve implements qt.CurveGenerator {
    constructor(ctx: CanvasRenderingContext2D | Path) {
      super(ctx)
    }
    override areaStart() {
      this._line = 0
    }
    override areaEnd() {
      this._line = NaN
    }
    lineStart() {
      this._x0 = this._x1 = this._y0 = this._y1 = NaN
      this._point = 0
    }
    lineEnd() {
      if (this._line || (this._line !== 0 && this._point === 3)) this.ctx.closePath()
      this._line = 1 - this._line
    }
    point(x: number, y: number) {
      ;(x = +x), (y = +y)
      switch (this._point) {
        case 0:
          this._point = 1
          break
        case 1:
          this._point = 2
          break
        case 2:
          this._point = 3
          var x0 = (this._x0 + 4 * this._x1 + x) / 6,
            y0 = (this._y0 + 4 * this._y1 + y) / 6
          this._line ? this.ctx.lineTo(x0, y0) : this.ctx.moveTo(x0, y0)
          break
        case 3:
          this._point = 4 // falls through
        default:
          point(this, x, y)
          break
      }
      ;(this._x0 = this._x1), (this._x1 = x)
      ;(this._y0 = this._y1), (this._y1 = y)
    }
  }
  export class Bump extends Curve implements qt.CurveGenerator {
    constructor(ctx: CanvasRenderingContext2D | Path, public isX: boolean) {
      super(ctx)
    }
    override areaStart() {
      this._line = 0
    }
    override areaEnd() {
      this._line = NaN
    }
    lineStart() {
      this._point = 0
    }
    lineEnd() {
      if (this._line || (this._line !== 0 && this._point === 1)) this.ctx.closePath()
      this._line = 1 - this._line
    }
    point(x: number, y: number) {
      ;(x = +x), (y = +y)
      switch (this._point) {
        case 0: {
          this._point = 1
          if (this._line) this.ctx.lineTo(x, y)
          else this.ctx.moveTo(x, y)
          break
        }
        case 1:
          this._point = 2 // falls through
        default: {
          if (this.isX) this.ctx.bezierCurveTo((this._x0 = (this._x0 + x) / 2), this._y0, this._x0, y, x, y)
          else this.ctx.bezierCurveTo(this._x0, (this._y0 = (this._y0 + y) / 2), x, this._y0, x, y)
          break
        }
      }
      ;(this._x0 = x), (this._y0 = y)
    }
  }
  export class BumpRadial extends Curve implements qt.CurveGenerator {
    constructor(ctx: CanvasRenderingContext2D | Path) {
      super(ctx)
    }
    lineStart() {
      this._point = 0
    }
    lineEnd() {}
    point(x: number, y: number) {
      ;(x = +x), (y = +y)
      if (this._point++ === 0) {
        ;(this._x0 = x), (this._y0 = y)
      } else {
        const p0 = pointRadial(this._x0, this._y0)
        const p1 = pointRadial(this._x0, (this._y0 = (this._y0 + y) / 2))
        const p2 = pointRadial(x, this._y0)
        const p3 = pointRadial(x, y)
        this.ctx.moveTo(...p0)
        this.ctx.bezierCurveTo(...p1, ...p2, ...p3)
      }
    }
  }
  export class Bundle extends Basis {
    xs
    ys
    constructor(ctx: CanvasRenderingContext2D | Path, public beta: number) {
      super(ctx)
    }
    override lineStart() {
      this.xs = []
      this.ys = []
      super.lineStart()
    }
    override lineEnd() {
      const xs = this.xs,
        ys = this.ys,
        j = xs.length - 1
      if (j > 0) {
        const x0 = xs[0],
          y0 = ys[0],
          dx = xs[j] - x0,
          dy = ys[j] - y0
        let i = -1,
          t
        while (++i <= j) {
          t = i / j
          super.point(
            this.beta * xs[i] + (1 - this.beta) * (x0 + t * dx),
            this.beta * ys[i] + (1 - this.beta) * (y0 + t * dy)
          )
        }
      }
      this.xs = this.ys = null
      super.lineEnd()
    }
    override point(x: number, y: number) {
      this.xs.push(+x)
      this.ys.push(+y)
    }
  }
  export class Cardinal extends Curve implements qt.CurveGenerator {
    _k
    constructor(ctx: CanvasRenderingContext2D | Path, tension: number) {
      super(ctx)
      this._k = (1 - tension) / 6
    }
    override areaStart() {
      this._line = 0
    }
    override areaEnd() {
      this._line = NaN
    }
    lineStart() {
      this._x0 = this._x1 = this._x2 = this._y0 = this._y1 = this._y2 = NaN
      this._point = 0
    }
    lineEnd() {
      switch (this._point) {
        case 2:
          this.ctx.lineTo(this._x2, this._y2)
          break
        case 3:
          point2(this, this._x1, this._y1)
          break
      }
      if (this._line || (this._line !== 0 && this._point === 1)) this.ctx.closePath()
      this._line = 1 - this._line
    }
    point(x: number, y: number) {
      ;(x = +x), (y = +y)
      switch (this._point) {
        case 0:
          this._point = 1
          this._line ? this.ctx.lineTo(x, y) : this.ctx.moveTo(x, y)
          break
        case 1:
          this._point = 2
          ;(this._x1 = x), (this._y1 = y)
          break
        case 2:
          this._point = 3
        default:
          point2(this, x, y)
          break
      }
      ;(this._x0 = this._x1), (this._x1 = this._x2), (this._x2 = x)
      ;(this._y0 = this._y1), (this._y1 = this._y2), (this._y2 = y)
    }
  }
  export class CardinalClosed extends Curve implements qt.CurveGenerator {
    _k
    constructor(ctx: CanvasRenderingContext2D | Path, tension: number) {
      super(ctx)
      this._k = (1 - tension) / 6
    }
    lineStart() {
      this._x0 =
        this._x1 =
        this._x2 =
        this._x3 =
        this._x4 =
        this._x5 =
        this._y0 =
        this._y1 =
        this._y2 =
        this._y3 =
        this._y4 =
        this._y5 =
          NaN
      this._point = 0
    }
    lineEnd() {
      switch (this._point) {
        case 1: {
          this.ctx.moveTo(this._x3, this._y3)
          this.ctx.closePath()
          break
        }
        case 2: {
          this.ctx.lineTo(this._x3, this._y3)
          this.ctx.closePath()
          break
        }
        case 3: {
          this.point(this._x3, this._y3)
          this.point(this._x4, this._y4)
          this.point(this._x5, this._y5)
          break
        }
      }
    }
    point(x: number, y: number) {
      ;(x = +x), (y = +y)
      switch (this._point) {
        case 0:
          this._point = 1
          ;(this._x3 = x), (this._y3 = y)
          break
        case 1:
          this._point = 2
          this.ctx.moveTo((this._x4 = x), (this._y4 = y))
          break
        case 2:
          this._point = 3
          ;(this._x5 = x), (this._y5 = y)
          break
        default:
          point2(this, x, y)
          break
      }
      ;(this._x0 = this._x1), (this._x1 = this._x2), (this._x2 = x)
      ;(this._y0 = this._y1), (this._y1 = this._y2), (this._y2 = y)
    }
  }
  export class CardinalOpen extends Curve implements qt.CurveGenerator {
    _k
    constructor(ctx: CanvasRenderingContext2D | Path, tension: number) {
      super(ctx)
      this._k = (1 - tension) / 6
    }
    override areaStart() {
      this._line = 0
    }
    override areaEnd() {
      this._line = NaN
    }
    lineStart() {
      this._x0 = this._x1 = this._x2 = this._y0 = this._y1 = this._y2 = NaN
      this._point = 0
    }
    lineEnd() {
      if (this._line || (this._line !== 0 && this._point === 3)) this.ctx.closePath()
      this._line = 1 - this._line
    }
    point(x: number, y: number) {
      ;(x = +x), (y = +y)
      switch (this._point) {
        case 0:
          this._point = 1
          break
        case 1:
          this._point = 2
          break
        case 2:
          this._point = 3
          this._line ? this.ctx.lineTo(this._x2, this._y2) : this.ctx.moveTo(this._x2, this._y2)
          break
        case 3:
          this._point = 4 // falls through
        default:
          point2(this, x, y)
          break
      }
      ;(this._x0 = this._x1), (this._x1 = this._x2), (this._x2 = x)
      ;(this._y0 = this._y1), (this._y1 = this._y2), (this._y2 = y)
    }
  }
  export class CatmullRom extends Curve implements qt.CurveGenerator {
    constructor(ctx: CanvasRenderingContext2D | Path, public alpha: number) {
      super(ctx)
    }
    override areaStart() {
      this._line = 0
    }
    override areaEnd() {
      this._line = NaN
    }
    lineStart() {
      this._x0 = this._x1 = this._x2 = this._y0 = this._y1 = this._y2 = NaN
      this._l01_a = this._l12_a = this._l23_a = this._l01_2a = this._l12_2a = this._l23_2a = this._point = 0
    }
    lineEnd() {
      switch (this._point) {
        case 2:
          this.ctx.lineTo(this._x2, this._y2)
          break
        case 3:
          this.point(this._x2, this._y2)
          break
      }
      if (this._line || (this._line !== 0 && this._point === 1)) this.ctx.closePath()
      this._line = 1 - this._line
    }
    point(x: number, y: number) {
      ;(x = +x), (y = +y)
      if (this._point) {
        const x23 = this._x2 - x,
          y23 = this._y2 - y
        this._l23_a = Math.sqrt((this._l23_2a = Math.pow(x23 * x23 + y23 * y23, this.alpha)))
      }
      switch (this._point) {
        case 0:
          this._point = 1
          this._line ? this.ctx.lineTo(x, y) : this.ctx.moveTo(x, y)
          break
        case 1:
          this._point = 2
          break
        case 2:
          this._point = 3 // falls through
        default:
          point3(this, x, y)
          break
      }
      ;(this._l01_a = this._l12_a), (this._l12_a = this._l23_a)
      ;(this._l01_2a = this._l12_2a), (this._l12_2a = this._l23_2a)
      ;(this._x0 = this._x1), (this._x1 = this._x2), (this._x2 = x)
      ;(this._y0 = this._y1), (this._y1 = this._y2), (this._y2 = y)
    }
  }
  export class CatmullRomClosed extends Curve implements qt.CurveGenerator {
    constructor(ctx: CanvasRenderingContext2D | Path, public alpha: number) {
      super(ctx)
    }
    lineStart() {
      this._x0 =
        this._x1 =
        this._x2 =
        this._x3 =
        this._x4 =
        this._x5 =
        this._y0 =
        this._y1 =
        this._y2 =
        this._y3 =
        this._y4 =
        this._y5 =
          NaN
      this._l01_a = this._l12_a = this._l23_a = this._l01_2a = this._l12_2a = this._l23_2a = this._point = 0
    }
    lineEnd() {
      switch (this._point) {
        case 1: {
          this.ctx.moveTo(this._x3, this._y3)
          this.ctx.closePath()
          break
        }
        case 2: {
          this.ctx.lineTo(this._x3, this._y3)
          this.ctx.closePath()
          break
        }
        case 3: {
          this.point(this._x3, this._y3)
          this.point(this._x4, this._y4)
          this.point(this._x5, this._y5)
          break
        }
      }
    }
    point(x: number, y: number) {
      ;(x = +x), (y = +y)
      if (this._point) {
        const x23 = this._x2 - x,
          y23 = this._y2 - y
        this._l23_a = Math.sqrt((this._l23_2a = Math.pow(x23 * x23 + y23 * y23, this.alpha)))
      }
      switch (this._point) {
        case 0:
          this._point = 1
          ;(this._x3 = x), (this._y3 = y)
          break
        case 1:
          this._point = 2
          this.ctx.moveTo((this._x4 = x), (this._y4 = y))
          break
        case 2:
          this._point = 3
          ;(this._x5 = x), (this._y5 = y)
          break
        default:
          point3(this, x, y)
          break
      }
      ;(this._l01_a = this._l12_a), (this._l12_a = this._l23_a)
      ;(this._l01_2a = this._l12_2a), (this._l12_2a = this._l23_2a)
      ;(this._x0 = this._x1), (this._x1 = this._x2), (this._x2 = x)
      ;(this._y0 = this._y1), (this._y1 = this._y2), (this._y2 = y)
    }
  }
  export class CatmullRomOpen extends Curve implements qt.CurveGenerator {
    constructor(ctx: CanvasRenderingContext2D | Path, public alpha: number) {
      super(ctx)
    }
    override areaStart() {
      this._line = 0
    }
    override areaEnd() {
      this._line = NaN
    }
    lineStart() {
      this._x0 = this._x1 = this._x2 = this._y0 = this._y1 = this._y2 = NaN
      this._l01_a = this._l12_a = this._l23_a = this._l01_2a = this._l12_2a = this._l23_2a = this._point = 0
    }
    lineEnd() {
      if (this._line || (this._line !== 0 && this._point === 3)) this.ctx.closePath()
      this._line = 1 - this._line
    }
    point(x: number, y: number) {
      ;(x = +x), (y = +y)
      if (this._point) {
        const x23 = this._x2 - x,
          y23 = this._y2 - y
        this._l23_a = Math.sqrt((this._l23_2a = Math.pow(x23 * x23 + y23 * y23, this.alpha)))
      }
      switch (this._point) {
        case 0:
          this._point = 1
          break
        case 1:
          this._point = 2
          break
        case 2:
          this._point = 3
          this._line ? this.ctx.lineTo(this._x2, this._y2) : this.ctx.moveTo(this._x2, this._y2)
          break
        case 3:
          this._point = 4 // falls through
        default:
          point3(this, x, y)
          break
      }
      ;(this._l01_a = this._l12_a), (this._l12_a = this._l23_a)
      ;(this._l01_2a = this._l12_2a), (this._l12_2a = this._l23_2a)
      ;(this._x0 = this._x1), (this._x1 = this._x2), (this._x2 = x)
      ;(this._y0 = this._y1), (this._y1 = this._y2), (this._y2 = y)
    }
  }
  export class Linear extends Curve implements qt.CurveGenerator {
    constructor(ctx: CanvasRenderingContext2D | Path) {
      super(ctx)
    }
    override areaStart() {
      this._line = 0
    }
    override areaEnd() {
      this._line = NaN
    }
    lineStart() {
      this._point = 0
    }
    lineEnd() {
      if (this._line || (this._line !== 0 && this._point === 1)) this.ctx.closePath()
      this._line = 1 - this._line
    }
    point(x: number, y: number) {
      ;(x = +x), (y = +y)
      switch (this._point) {
        case 0:
          this._point = 1
          this._line ? this.ctx.lineTo(x, y) : this.ctx.moveTo(x, y)
          break
        case 1:
          this._point = 2 // falls through
        default:
          this.ctx.lineTo(x, y)
          break
      }
    }
  }
  export class LinearClosed extends Curve implements qt.CurveGenerator {
    constructor(public ctx: CanvasRenderingContext2D | Path) {}
    areaStart = noop
    areaEnd = noop
    lineStart() {
      this._point = 0
    }
    lineEnd() {
      if (this._point) this.ctx.closePath()
    }
    point(x, y) {
      ;(x = +x), (y = +y)
      if (this._point) this.ctx.lineTo(x, y)
      else (this._point = 1), this.ctx.moveTo(x, y)
    }
  }
  class ReflectContext {
    constructor(public ctx: CanvasRenderingContext2D | Path) {}
    moveTo(x, y) {
      this.ctx.moveTo(y, x)
    }
    closePath() {
      this.ctx.closePath()
    }
    lineTo(x, y) {
      this.ctx.lineTo(y, x)
    }
    bezierCurveTo(x1, y1, x2, y2, x, y) {
      this.ctx.bezierCurveTo(y1, x1, y2, x2, y, x)
    }
  }
  export class MonotoneX extends Curve implements qt.CurveGenerator {
    constructor(public ctx: CanvasRenderingContext2D | Path) {}
    areaStart() {
      this._line = 0
    }
    areaEnd() {
      this._line = NaN
    }
    lineStart() {
      this._x0 = this._x1 = this._y0 = this._y1 = this._t0 = NaN
      this._point = 0
    }
    lineEnd() {
      switch (this._point) {
        case 2:
          this.ctx.lineTo(this._x1, this._y1)
          break
        case 3:
          point4(this, this._t0, slope2(this, this._t0))
          break
      }
      if (this._line || (this._line !== 0 && this._point === 1)) this.ctx.closePath()
      this._line = 1 - this._line
    }
    point(x: number, y: number) {
      let t1 = NaN
      ;(x = +x), (y = +y)
      if (x === this._x1 && y === this._y1) return
      switch (this._point) {
        case 0:
          this._point = 1
          this._line ? this.ctx.lineTo(x, y) : this.ctx.moveTo(x, y)
          break
        case 1:
          this._point = 2
          break
        case 2:
          this._point = 3
          point4(this, slope2(this, (t1 = slope3(this, x, y))), t1)
          break
        default:
          point4(this, this._t0, (t1 = slope3(this, x, y)))
          break
      }
      ;(this._x0 = this._x1), (this._x1 = x)
      ;(this._y0 = this._y1), (this._y1 = y)
      this._t0 = t1
    }
  }
  export class MonotoneY extends Curve implements qt.CurveGenerator {
    ctx
    constructor(x: CanvasRenderingContext2D | Path) {
      this.ctx = new ReflectContext(x)
    }
    point(x: number, y: number) {
      MonotoneX.point.call(this, y, x)
    }
  }
  export class Natural extends Curve implements qt.CurveGenerator {
    constructor(public ctx: CanvasRenderingContext2D | Path) {}
    areaStart() {
      this._line = 0
    }
    areaEnd() {
      this._line = NaN
    }
    lineStart() {
      this._x = []
      this._y = []
    }
    lineEnd() {
      const x = this._x,
        y = this._y,
        n = x.length
      if (n) {
        this._line ? this.ctx.lineTo(x[0], y[0]) : this.ctx.moveTo(x[0], y[0])
        if (n === 2) {
          this.ctx.lineTo(x[1], y[1])
        } else {
          const px = controlPoints(x),
            py = controlPoints(y)
          for (let i0 = 0, i1 = 1; i1 < n; ++i0, ++i1) {
            this.ctx.bezierCurveTo(px[0][i0], py[0][i0], px[1][i0], py[1][i0], x[i1], y[i1])
          }
        }
      }
      if (this._line || (this._line !== 0 && n === 1)) this.ctx.closePath()
      this._line = 1 - this._line
      this._x = this._y = null
    }
    point(x: number, y: number) {
      this._x.push(+x)
      this._y.push(+y)
    }
  }
  export const curveRadialLinear = curveRadial(curveLinear)
  export class Radial {
    constructor(curve) {
      this._curve = curve
    }
    areaStart() {
      this._curve.areaStart()
    }
    areaEnd() {
      this._curve.areaEnd()
    }
    lineStart() {
      this._curve.lineStart()
    }
    lineEnd() {
      this._curve.lineEnd()
    }
    point(a, r) {
      this._curve.point(r * Math.sin(a), r * -Math.cos(a))
    }
  }
  export function curveRadial(curve) {
    function y(context) {
      return new Radial(curve(context))
    }
    y._curve = curve
    return y
  }
  export class Step extends Curve implements qt.CurveGenerator {
    constructor(public ctx: CanvasRenderingContext2D | Path, public pos = 0.5) {}
    areaStart() {
      this._line = 0
    }
    areaEnd() {
      this._line = NaN
    }
    lineStart() {
      this._x = this._y = NaN
      this._point = 0
    }
    lineEnd() {
      if (0 < this.pos && this.pos < 1 && this._point === 2) this.ctx.lineTo(this._x, this._y)
      if (this._line || (this._line !== 0 && this._point === 1)) this.ctx.closePath()
      if (this._line >= 0) (this.pos = 1 - this.pos), (this._line = 1 - this._line)
    }
    point(x: number, y: number) {
      ;(x = +x), (y = +y)
      switch (this._point) {
        case 0:
          this._point = 1
          this._line ? this.ctx.lineTo(x, y) : this.ctx.moveTo(x, y)
          break
        case 1:
          this._point = 2 // falls through
        default: {
          if (this.pos <= 0) {
            this.ctx.lineTo(this._x, y)
            this.ctx.lineTo(x, y)
          } else {
            const x1 = this._x * (1 - this.pos) + x * this.pos
            this.ctx.lineTo(x1, this._y)
            this.ctx.lineTo(x1, y)
          }
          break
        }
      }
      ;(this._x = x), (this._y = y)
    }
  }
}

function controlPoints(xs) {
  const n = xs.length - 1
  ;(a = new Array(n)), (b = new Array(n)), (r = new Array(n))
  let i, m
  ;(a[0] = 0), (b[0] = 2), (r[0] = xs[0] + 2 * xs[1])
  for (i = 1; i < n - 1; ++i) (a[i] = 1), (b[i] = 4), (r[i] = 4 * xs[i] + 2 * xs[i + 1])
  ;(a[n - 1] = 2), (b[n - 1] = 7), (r[n - 1] = 8 * xs[n - 1] + xs[n])
  for (i = 1; i < n; ++i) (m = a[i] / b[i - 1]), (b[i] -= m), (r[i] -= m * r[i - 1])
  a[n - 1] = r[n - 1] / b[n - 1]
  for (i = n - 2; i >= 0; --i) a[i] = (r[i] - a[i + 1]) / b[i]
  b[n - 1] = (xs[n] + a[n - 1]) / 2
  for (i = 0; i < n - 1; ++i) b[i] = 2 * xs[i + 1] - a[i + 1]
  return [a, b]
}

function point(that, x, y) {
  that.ctx.bezierCurveTo(
    (2 * that._x0 + that._x1) / 3,
    (2 * that._y0 + that._y1) / 3,
    (that._x0 + 2 * that._x1) / 3,
    (that._y0 + 2 * that._y1) / 3,
    (that._x0 + 4 * that._x1 + x) / 6,
    (that._y0 + 4 * that._y1 + y) / 6
  )
}
function point2(that, x, y) {
  that.ctx.bezierCurveTo(
    that._x1 + that._k * (that._x2 - that._x0),
    that._y1 + that._k * (that._y2 - that._y0),
    that._x2 + that._k * (that._x1 - x),
    that._y2 + that._k * (that._y1 - y),
    that._x2,
    that._y2
  )
}

function point3(that, x, y) {
  let x1 = that._x1,
    y1 = that._y1,
    x2 = that._x2,
    y2 = that._y2
  if (that._l01_a > epsilon) {
    const a = 2 * that._l01_2a + 3 * that._l01_a * that._l12_a + that._l12_2a,
      n = 3 * that._l01_a * (that._l01_a + that._l12_a)
    x1 = (x1 * a - that._x0 * that._l12_2a + that._x2 * that._l01_2a) / n
    y1 = (y1 * a - that._y0 * that._l12_2a + that._y2 * that._l01_2a) / n
  }
  if (that._l23_a > epsilon) {
    const b = 2 * that._l23_2a + 3 * that._l23_a * that._l12_a + that._l12_2a,
      m = 3 * that._l23_a * (that._l23_a + that._l12_a)
    x2 = (x2 * b + that._x1 * that._l23_2a - x * that._l12_2a) / m
    y2 = (y2 * b + that._y1 * that._l23_2a - y * that._l12_2a) / m
  }
  that.ctx.bezierCurveTo(x1, y1, x2, y2, that._x2, that._y2)
}

function point4(that, t0, t1) {
  const x0 = that._x0,
    y0 = that._y0,
    x1 = that._x1,
    y1 = that._y1,
    dx = (x1 - x0) / 3
  that.ctx.bezierCurveTo(x0 + dx, y0 + dx * t0, x1 - dx, y1 - dx * t1, x1, y1)
}

function slope2(that, t) {
  const h = that._x1 - that._x0
  return h ? ((3 * (that._y1 - that._y0)) / h - t) / 2 : t
}

function slope3(that, x2, y2) {
  const h0 = that._x1 - that._x0,
    h1 = x2 - that._x1,
    s0 = (that._y1 - that._y0) / (h0 || (h1 < 0 && -0)),
    s1 = (y2 - that._y1) / (h1 || (h0 < 0 && -0)),
    p = (s0 * h1 + s1 * h0) / (h0 + h1)
  function sign(x: number) {
    return x < 0 ? -1 : 1
  }
  return (sign(s0) + sign(s1)) * Math.min(Math.abs(s0), Math.abs(s1), 0.5 * Math.abs(p)) || 0
}

export namespace symbol {
  const sqrt3 = sqrt(3)
  export const asterisk: qt.SymbolType = {
    draw(p, size) {
      const r = sqrt(size + min(size / 28, 0.75)) * 0.59436
      const t = r / 2
      const u = t * sqrt3
      p.moveTo(0, r)
      p.lineTo(0, -r)
      p.moveTo(-u, -t)
      p.lineTo(u, t)
      p.moveTo(-u, t)
      p.lineTo(u, -t)
    },
  }
  export const circle: qt.SymbolType = {
    draw(p, size) {
      const r = sqrt(size / pi)
      p.moveTo(r, 0)
      p.arc(0, 0, r, 0, tau)
    },
  }
  export const cross: qt.SymbolType = {
    draw(p, size) {
      const r = sqrt(size / 5) / 2
      p.moveTo(-3 * r, -r)
      p.lineTo(-r, -r)
      p.lineTo(-r, -3 * r)
      p.lineTo(r, -3 * r)
      p.lineTo(r, -r)
      p.lineTo(3 * r, -r)
      p.lineTo(3 * r, r)
      p.lineTo(r, r)
      p.lineTo(r, 3 * r)
      p.lineTo(-r, 3 * r)
      p.lineTo(-r, r)
      p.lineTo(-3 * r, r)
      p.closePath()
    },
  }
  const tan30 = sqrt(1 / 3)
  const tan30_2 = tan30 * 2
  export const diamond: qt.SymbolType = {
    draw(p, size) {
      const y = sqrt(size / tan30_2)
      const x = y * tan30
      p.moveTo(0, -y)
      p.lineTo(x, 0)
      p.lineTo(0, y)
      p.lineTo(-x, 0)
      p.closePath()
    },
  }
  export const diamond2: qt.SymbolType = {
    draw(p, size) {
      const r = sqrt(size) * 0.62625
      p.moveTo(0, -r)
      p.lineTo(r, 0)
      p.lineTo(0, r)
      p.lineTo(-r, 0)
      p.closePath()
    },
  }
  export const plus: qt.SymbolType = {
    draw(p, size) {
      const r = sqrt(size - min(size / 7, 2)) * 0.87559
      p.moveTo(-r, 0)
      p.lineTo(r, 0)
      p.moveTo(0, r)
      p.lineTo(0, -r)
    },
  }
  export const square: qt.SymbolType = {
    draw(p, size) {
      const w = sqrt(size)
      const x = -w / 2
      p.rect(x, x, w, w)
    },
  }
  export const square2: qt.SymbolType = {
    draw(p, size) {
      const r = sqrt(size) * 0.4431
      p.moveTo(r, r)
      p.lineTo(r, -r)
      p.lineTo(-r, -r)
      p.lineTo(-r, r)
      p.closePath()
    },
  }
  const ka = 0.8908130915292852281
  const kr = sin(pi / 10) / sin((7 * pi) / 10)
  const kx = sin(tau / 10) * kr
  const ky = -cos(tau / 10) * kr
  export const star: qt.SymbolType = {
    draw(p, size) {
      const r = sqrt(size * ka)
      const x = kx * r
      const y = ky * r
      p.moveTo(0, -r)
      p.lineTo(x, y)
      for (let i = 1; i < 5; ++i) {
        const a = (tau * i) / 5
        const c = cos(a)
        const s = sin(a)
        p.lineTo(s * r, -c * r)
        p.lineTo(c * x - s * y, s * x + c * y)
      }
      p.closePath()
    },
  }
  export const triangle: qt.SymbolType = {
    draw(p, size) {
      const y = -sqrt(size / (sqrt3 * 3))
      p.moveTo(0, y * 2)
      p.lineTo(-sqrt3 * y, -y)
      p.lineTo(sqrt3 * y, -y)
      p.closePath()
    },
  }
  export const triangle2: qt.SymbolType = {
    draw(p, size) {
      const s = sqrt(size) * 0.6824
      const t = s / 2
      const u = (s * sqrt3) / 2 // cos(Math.PI / 6)
      p.moveTo(0, -s)
      p.lineTo(u, t)
      p.lineTo(-u, t)
      p.closePath()
    },
  }
  const c = -0.5
  const s = sqrt(3) / 2
  const k = 1 / sqrt(12)
  const a = (k / 2 + 1) * 3
  export const wye: qt.SymbolType = {
    draw(p, size) {
      const r = sqrt(size / a)
      const x0 = r / 2,
        y0 = r * k
      const x1 = x0,
        y1 = r * k + r
      const x2 = -x1,
        y2 = y1
      p.moveTo(x0, y0)
      p.lineTo(x1, y1)
      p.lineTo(x2, y2)
      p.lineTo(c * x0 - s * y0, s * x0 + c * y0)
      p.lineTo(c * x1 - s * y1, s * x1 + c * y1)
      p.lineTo(c * x2 - s * y2, s * x2 + c * y2)
      p.lineTo(c * x0 + s * y0, c * y0 - s * x0)
      p.lineTo(c * x1 + s * y1, c * y1 - s * x1)
      p.lineTo(c * x2 + s * y2, c * y2 - s * x2)
      p.closePath()
    },
  }
  export const x: qt.SymbolType = {
    draw(p, size) {
      const r = sqrt(size - min(size / 6, 1.7)) * 0.6189
      p.moveTo(-r, -r)
      p.lineTo(r, r)
      p.moveTo(-r, r)
      p.lineTo(r, -r)
    },
  }
  export const fills: qt.SymbolType[] = [circle, cross, diamond, square, star, triangle, wye]
  export const strokes: qt.SymbolType[] = [circle, plus, x, triangle2, asterisk, square2, diamond2]
}
