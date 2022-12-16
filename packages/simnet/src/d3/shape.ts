/* eslint-disable no-case-declarations */
/* eslint-disable no-fallthrough */
import * as qu from "./utils.js"
import type { Shape as qs } from "./types.js"
import type * as qt from "./types.js"

export function arc(): qs.Arc<any, qs.BaseArc>
export function arc<T>(): qs.Arc<any, T>
export function arc<This, T>(): qs.Arc<This, T>
export function arc() {
  let _ctx: qs.Context | qu.Path | null = null,
    _corner = qu.constant(0),
    _end = (x: any) => x.endAngle,
    _inner = (x: any) => x.innerRadius,
    _outer = (x: any) => x.outerRadius,
    padAngle = (x?: any) => x && x.padAngle,
    padRadius: any = null,
    _start = (x: any) => x.startAngle
  const intersect = (
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x3: number,
    y3: number
  ) => {
    const x10 = x1 - x0,
      y10 = y1 - y0,
      x32 = x3 - x2,
      y32 = y3 - y2
    let t = y32 * x10 - x32 * y10
    if (t * t < qu.epsilon2) return
    t = (x32 * (y0 - y2) - y32 * (x0 - x2)) / t
    return [x0 + t * x10, y0 + t * y10]
  }
  const cornerTangents = (x0: number, y0: number, x1: number, y1: number, r1: number, rc: number, cw: boolean) => {
    const x01 = x0 - x1,
      y01 = y0 - y1,
      lo = (cw ? rc : -rc) / qu.sqrt(x01 * x01 + y01 * y01),
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
      d = (dy < 0 ? -1 : 1) * qu.sqrt(qu.max(0, r * r * d2 - D * D)),
      cx1 = (D * dy + dx * d) / d2,
      cy1 = (-D * dx + dy * d) / d2,
      dx1 = cx1 - x00,
      dy1 = cy1 - y00
    let cx0 = (D * dy - dx * d) / d2,
      cy0 = (-D * dx - dy * d) / d2
    const dx0 = cx0 - x00,
      dy0 = cy0 - y00
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
  function f(this: any, ...xs: any): any {
    const a0 = _start.apply(this, xs) - qu.halfPI,
      a1 = _end.apply(this, xs) - qu.halfPI,
      da = qu.abs(a1 - a0),
      cw = a1 > a0
    let buffer,
      r,
      r0 = +_inner.apply(this, xs),
      r1 = +_outer.apply(this, xs)
    if (!_ctx) _ctx = buffer = new qu.Path()
    if (r1 < r0) (r = r1), (r1 = r0), (r0 = r)
    if (!(r1 > qu.epsilon2)) _ctx?.moveTo(0, 0)
    else if (da > qu.tau - qu.epsilon2) {
      _ctx?.moveTo(r1 * qu.cos(a0), r1 * qu.sin(a0))
      _ctx?.arc(0, 0, r1, a0, a1, !cw)
      if (r0 > qu.epsilon2) {
        _ctx?.moveTo(r0 * qu.cos(a1), r0 * qu.sin(a1))
        _ctx?.arc(0, 0, r0, a1, a0, cw)
      }
    } else {
      const ap = padAngle.apply(this, xs) / 2,
        rp = ap > qu.epsilon2 && (padRadius ? +padRadius.apply(this, xs) : qu.sqrt(r0 * r0 + r1 * r1)),
        rc = qu.min(qu.abs(r1 - r0) / 2, +_corner.apply(this, xs))
      let a01 = a0,
        a11 = a1,
        a00 = a0,
        a10 = a1,
        da0 = da,
        da1 = da,
        rc0 = rc,
        rc1 = rc,
        t0,
        t1
      if (rp > qu.epsilon2) {
        let p0 = qu.asin((rp / r0) * qu.sin(ap)),
          p1 = qu.asin((rp / r1) * qu.sin(ap))
        if ((da0 -= p0 * 2) > qu.epsilon2) (p0 *= cw ? 1 : -1), (a00 += p0), (a10 -= p0)
        else (da0 = 0), (a00 = a10 = (a0 + a1) / 2)
        if ((da1 -= p1 * 2) > qu.epsilon2) (p1 *= cw ? 1 : -1), (a01 += p1), (a11 -= p1)
        else (da1 = 0), (a01 = a11 = (a0 + a1) / 2)
      }
      const x01 = r1 * qu.cos(a01),
        y01 = r1 * qu.sin(a01),
        x10 = r0 * qu.cos(a10),
        y10 = r0 * qu.sin(a10)
      if (rc > qu.epsilon2) {
        const x11 = r1 * qu.cos(a11),
          y11 = r1 * qu.sin(a11),
          x00 = r0 * qu.cos(a00),
          y00 = r0 * qu.sin(a00)
        let oc
        if (da < qu.PI && (oc = intersect(x01, y01, x00, y00, x11, y11, x10, y10))) {
          const ax = x01 - oc[0]!,
            ay = y01 - oc[1]!,
            bx = x11 - oc[0]!,
            by = y11 - oc[1]!,
            kc =
              1 / qu.sin(qu.acos((ax * bx + ay * by) / (qu.sqrt(ax * ax + ay * ay) * qu.sqrt(bx * bx + by * by))) / 2),
            lc = qu.sqrt(oc[0]! * oc[0]! + oc[1]! * oc[1]!)
          rc0 = qu.min(rc, (r0 - lc) / (kc - 1))
          rc1 = qu.min(rc, (r1 - lc) / (kc + 1))
        }
      }
      if (!(da1 > qu.epsilon2)) _ctx?.moveTo(x01, y01)
      else if (rc1 > qu.epsilon2) {
        t0 = cornerTangents(x00, y00, x01, y01, r1, rc1, cw)
        t1 = cornerTangents(x11, y11, x10, y10, r1, rc1, cw)
        _ctx?.moveTo(t0.cx + t0.x01, t0.cy + t0.y01)
        if (rc1 < rc) _ctx?.arc(t0.cx, t0.cy, rc1, qu.atan2(t0.y01, t0.x01), qu.atan2(t1.y01, t1.x01), !cw)
        else {
          _ctx?.arc(t0.cx, t0.cy, rc1, qu.atan2(t0.y01, t0.x01), qu.atan2(t0.y11, t0.x11), !cw)
          _ctx?.arc(0, 0, r1, qu.atan2(t0.cy + t0.y11, t0.cx + t0.x11), qu.atan2(t1.cy + t1.y11, t1.cx + t1.x11), !cw)
          _ctx?.arc(t1.cx, t1.cy, rc1, qu.atan2(t1.y11, t1.x11), qu.atan2(t1.y01, t1.x01), !cw)
        }
      } else {
        _ctx?.moveTo(x01, y01)
        _ctx?.arc(0, 0, r1, a01, a11, !cw)
      }
      if (!(r0 > qu.epsilon2) || !(da0 > qu.epsilon2)) _ctx?.lineTo(x10, y10)
      else if (rc0 > qu.epsilon2) {
        t0 = cornerTangents(x10, y10, x11, y11, r0, -rc0, cw)
        t1 = cornerTangents(x01, y01, x00, y00, r0, -rc0, cw)
        _ctx?.lineTo(t0.cx + t0.x01, t0.cy + t0.y01)
        if (rc0 < rc) _ctx?.arc(t0.cx, t0.cy, rc0, qu.atan2(t0.y01, t0.x01), qu.atan2(t1.y01, t1.x01), !cw)
        else {
          _ctx?.arc(t0.cx, t0.cy, rc0, qu.atan2(t0.y01, t0.x01), qu.atan2(t0.y11, t0.x11), !cw)
          _ctx?.arc(0, 0, r0, qu.atan2(t0.cy + t0.y11, t0.cx + t0.x11), qu.atan2(t1.cy + t1.y11, t1.cx + t1.x11), cw)
          _ctx?.arc(t1.cx, t1.cy, rc0, qu.atan2(t1.y11, t1.x11), qu.atan2(t1.y01, t1.x01), !cw)
        }
      } else _ctx?.arc(0, 0, r0, a10, a00, cw)
    }
    _ctx?.closePath()
    if (buffer) return (_ctx = null), buffer + "" || null
  }
  f.centroid = (...xs: any) => {
    const r = (+f.innerRadius(xs) + +f.outerRadius(xs)) / 2,
      a = (+f.startAngle(xs) + +f.endAngle(xs)) / 2 - qu.PI / 2
    return [qu.cos(a) * r, qu.sin(a) * r]
  }
  f.context = (x: any) => (x === undefined ? _ctx : ((_ctx = x === null ? null : x), f))
  f.cornerRadius = (x: any) =>
    x === undefined ? _corner : ((_corner = typeof x === "function" ? x : qu.constant(+x)), f)
  f.endAngle = (x: any) => (x === undefined ? _end : ((_end = typeof x === "function" ? x : qu.constant(+x)), f))
  f.innerRadius = (x: any) => (x === undefined ? _inner : ((_inner = typeof x === "function" ? x : qu.constant(+x)), f))
  f.outerRadius = (x: any) => (x === undefined ? _outer : ((_outer = typeof x === "function" ? x : qu.constant(+x)), f))
  f.padAngle = (x: any) =>
    x === undefined ? padAngle : ((padAngle = typeof x === "function" ? x : qu.constant(+x)), f)
  f.padRadius = (x: any) =>
    x === undefined ? padRadius : ((padRadius = x === null ? null : typeof x === "function" ? x : qu.constant(+x)), f)
  f.startAngle = (x: any) => (x === undefined ? _start : ((_start = typeof x === "function" ? x : qu.constant(+x)), f))
  return f
}

export function area<T = qt.Point>(
  x0?: number | ((x: T, i: number, xs: T[]) => number),
  y0?: number | ((x: T, i: number, xs: T[]) => number),
  y1?: number | ((x: T, i: number, xs: T[]) => number)
): qs.Area<T> {
  let x1 = null,
    defined = qu.constant(true),
    _ctx: qs.Context | qu.Path | null = null,
    _curve = Curve.linear,
    _out: Curve.Linear | null = null
  x0 = typeof x0 === "function" ? x0 : x0 === undefined ? pointX : qu.constant(+x0)
  y0 = typeof y0 === "function" ? y0 : y0 === undefined ? qu.constant(0) : qu.constant(+y0)
  y1 = typeof y1 === "function" ? y1 : y1 === undefined ? pointY : qu.constant(+y1)
  function f(x: Iterable<T> | T[]): string | null
  function f(x: Iterable<T> | T[]): void
  function f(x: any): any | void {
    const n = (x = array(x)).length,
      x0z = new Array(n),
      y0z = new Array(n)
    let i,
      j,
      k,
      d,
      defined0 = false,
      buffer
    if (_ctx === null) _out = _curve((buffer = new qu.Path()))
    for (i = 0; i <= n; ++i) {
      if (!(i < n && defined((d = x[i]), i, x)) === defined0) {
        if ((defined0 = !defined0)) {
          j = i
          _out?.areaStart()
          _out?.lineStart()
        } else {
          _out?.lineEnd()
          _out?.lineStart()
          for (k = i - 1; k >= j; --k) {
            _out?.point(x0z[k], y0z[k])
          }
          _out?.lineEnd()
          _out?.areaEnd()
        }
      }
      if (defined0) {
        x0z[i] = +x0(d, i, x)
        y0z[i] = +y0(d, i, x)
        _out?.point(x1 ? +x1(d, i, x) : x0z[i], y1 ? +y1(d, i, x) : y0z[i])
      }
    }
    if (buffer) return (_out = null), buffer + "" || null
  }
  f.x = (x: any) => (x === undefined ? x0 : ((x0 = typeof x === "function" ? x : qu.constant(+x)), (x1 = null), f))
  f.x0 = (x: any) => (x === undefined ? x0 : ((x0 = typeof x === "function" ? x : qu.constant(+x)), f))
  f.x1 = (x: any) =>
    x === undefined ? x1 : ((x1 = x === null ? null : typeof x === "function" ? x : qu.constant(+x)), f)
  f.y = (x: any) => (x === undefined ? y0 : ((y0 = typeof x === "function" ? x : qu.constant(+x)), (y1 = null), f))
  f.y0 = (x: any) => (x === undefined ? y0 : ((y0 = typeof x === "function" ? x : qu.constant(+x)), f))
  f.y1 = (x: any) =>
    x === undefined ? y1 : ((y1 = x === null ? null : typeof x === "function" ? x : qu.constant(+x)), f)
  const arealine = () => line().defined(defined).curve(_curve).context(_ctx)
  f.lineX0 = () => arealine().x(x0).y(y0)
  f.lineY0 = f.lineX0
  f.lineY1 = () => arealine().x(x0).y(y1)
  f.lineX1 = () => arealine().x(x1).y(y0)
  f.defined = (x: any) => (x === undefined ? defined : ((defined = typeof x === "function" ? x : qu.constant(!!x)), f))
  f.curve = (x: any) => (x === undefined ? _curve : ((_curve = x), _ctx != null && (_out = _curve(_ctx)), f))
  f.context = (x: any) =>
    x === undefined ? _ctx : (x === null ? (_ctx = _out = null) : (_out = _curve((_ctx = x))), f)
  return f
}
export function areaRadial(): qs.AreaRadial<qt.Point>
export function areaRadial<T>(): qs.AreaRadial<T>
export function areaRadial(): any {
  const f: any = area().curve(curveRadialLinear),
    c = f.curve,
    x0 = f.lineX0,
    x1 = f.lineX1,
    y0 = f.lineY0,
    y1 = f.lineY1
  f.angle = f.x
  delete f.x
  f.startAngle = f.x0
  delete f.x0
  f.endAngle = f.x1
  delete f.x1
  f.radius = f.y
  delete f.y
  f.innerRadius = f.y0
  delete f.y0
  f.outerRadius = f.y1
  delete f.y1
  f.lineStartAngle = () => line.radial(x0())
  delete f.lineX0
  f.lineEndAngle = () => line.radial(x1())
  delete f.lineX1
  f.lineInnerRadius = () => line.radial(y0())
  delete f.lineY0
  f.lineOuterRadius = () => line.radial(y1())
  delete f.lineY1
  f.curve = (x: any) => (x === undefined ? c()._curve : c(Curve.radial(x)))
  return f
}
export const slice = Array.prototype.slice
export function array(x: any) {
  return typeof x === "object" && "length" in x ? x : Array.from(x)
}
export function line<T = qt.Point>(
  x?: number | ((x: T, i: number, xs: T[]) => number),
  y?: number | ((x: T, i: number, xs: T[]) => number)
): qs.Line<T> {
  let defined = qu.constant(true),
    _ctx: qs.Context | qu.Path | null = null,
    _curve = Curve.linear,
    _out: Curve.Linear | null = null
  let _x = typeof x === "function" ? x : x === undefined ? pointX : qu.constant(x)
  let _y = typeof y === "function" ? y : y === undefined ? pointY : qu.constant(y)
  function f(data) {
    const n = (data = array(data)).length
    let i,
      d,
      defined0 = false,
      buffer
    if (_ctx === null) _out = _curve((buffer = new qu.Path()))
    for (i = 0; i <= n; ++i) {
      if (!(i < n && defined((d = data[i]), i, data)) === defined0) {
        if ((defined0 = !defined0)) _out?.lineStart()
        else _out?.lineEnd()
      }
      if (defined0) _out?.point(+_x(d, i, data), +_y(d, i, data))
    }
    if (buffer) return (_out = null), buffer + "" || null
  }
  f.x = (x: any) => (x === undefined ? _x : ((_x = typeof x === "function" ? x : qu.constant(+x)), f))
  f.y = (x: any) => (x === undefined ? _y : ((_y = typeof x === "function" ? x : qu.constant(+x)), f))
  f.defined = (x: any) => (x === undefined ? defined : ((defined = typeof x === "function" ? x : qu.constant(!!x)), f))
  f.curve = (x: any) => (x === undefined ? _curve : ((_curve = x), _ctx != null && (_out = _curve(_ctx)), f))
  f.context = (x: any) =>
    x === undefined ? _ctx : (x === null ? (_ctx = _out = null) : (_out = _curve((_ctx = x))), f)
  return f
}
export namespace line {
  export function radial(): qs.LineRadial<qt.Point>
  export function radial<T>(): qs.LineRadial<T>
  export function radial() {
    function y(l) {
      const c = l.curve
      ;(l.angle = l.x), delete l.x
      ;(l.radius = l.y), delete l.y
      l.curve = (x: any) => (x === undefined ? c()._curve : c(curveRadial(x)))
      return l
    }
    return y(line().curve(curveRadialLinear))
  }
}
export function link(x: qs.Curve): qs.Link<any, qs.DefaultLink, qt.Point>
export function link<L, N>(x: qs.Curve): qs.Link<any, L, N>
export function link<This, L, N>(x: qs.Curve): qs.Link<This, L, N>
export function link(curve) {
  let source = x => x.source
  let target = x => x.target
  let _x = pointX
  let _y = pointY
  let _ctx = null
  let _out = null
  function f(...xs: any) {
    let buffer
    const argv = slice.call(xs)
    const s = source(argv)
    const t = target(argv)
    if (_ctx === null) _out = curve((buffer = new qu.Path()))
    _out.lineStart()
    ;(argv[0] = s), _out.point(+_x(argv), +_y(argv))
    ;(argv[0] = t), _out.point(+_x(argv), +_y(argv))
    _out.lineEnd()
    if (buffer) return (_out = null), buffer + "" || null
  }
  f.source = (x: any) => (x === undefined ? source : ((source = x), f))
  f.target = (x: any) => (x === undefined ? target : ((target = x), f))
  f.x = (x: any) => (x === undefined ? _x : ((_x = typeof x === "function" ? x : qu.constant(+x)), f))
  f.y = (x: any) => (x === undefined ? _y : ((_y = typeof x === "function" ? x : qu.constant(+x)), f))
  f.context = (x: any) => (x === undefined ? _ctx : (x === null ? (_ctx = _out = null) : (_out = curve((_ctx = x))), f))
  return f
}
export namespace link {
  export function horizontal(): qs.Link<any, qs.DefaultLink, qt.Point>
  export function horizontal<L, N>(): qs.Link<any, L, N>
  export function horizontal<This, L, N>(): qs.Link<This, L, N>
  export function horizontal() {
    return link(Curve.bumpX)
  }
  export function vertical(): qs.Link<any, qs.DefaultLink, qt.Point>
  export function vertical<L, N>(): qs.Link<any, L, N>
  export function vertical<This, L, N>(): qs.Link<This, L, N>
  export function vertical() {
    return link(Curve.bumpY)
  }
  export function radial(): qs.LinkRadial<any, qs.DefaultLink, qt.Point>
  export function radial<L, N>(): qs.LinkRadial<any, L, N>
  export function radial<This, L, N>(): qs.LinkRadial<This, L, N>
  export function radial(): any {
    const l = link(bumpRadial)
    ;(l.angle = l.x), delete l.x
    ;(l.radius = l.y), delete l.y
    return l
  }
}

export function pie(): qs.Pie<any, number | { valueOf(): number }>
export function pie<T>(): qs.Pie<any, T>
export function pie<This, T>(): qs.Pie<This, T>
export function pie() {
  let value = qu.identity,
    sortValues = qu.descending,
    sort = null,
    startAngle = qu.constant(0),
    endAngle = qu.constant(qu.tau),
    padAngle = qu.constant(0)
  function y(data) {
    const n = (data = array(data)).length,
      index = new Array(n),
      arcs = new Array(n)
    let i,
      j,
      k,
      sum = 0,
      a0 = +startAngle(arguments),
      da = qu.min(qu.tau, qu.max(-qu.tau, endAngle(arguments) - a0)),
      a1,
      p = qu.min(qu.abs(da) / n, padAngle(arguments)),
      pa = p * (da < 0 ? -1 : 1),
      v
    for (i = 0; i < n; ++i) {
      if ((v = arcs[(index[i] = i)] = +value(data[i], i, data)) > 0) {
        sum += v
      }
    }
    if (sortValues != null) index.sort((i, j) => sortValues(arcs[i], arcs[j]))
    else if (sort != null) index.sort((i, j) => sort(data[i], data[j]))
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
  y.value = (x: any) => (x === undefined ? value : ((value = typeof x === "function" ? x : qu.constant(+x)), y))
  y.sortValues = (x: any) => (x === undefined ? sortValues : ((sortValues = x), (sort = null), y))
  y.sort = (x: any) => (x === undefined ? sort : ((sort = x), (sortValues = null), y))
  y.startAngle = (x: any) =>
    x === undefined ? startAngle : ((startAngle = typeof x === "function" ? x : qu.constant(+x)), y)
  y.endAngle = (x: any) =>
    x === undefined ? endAngle : ((endAngle = typeof x === "function" ? x : qu.constant(+x)), y)
  y.padAngle = (x: any) =>
    x === undefined ? padAngle : ((padAngle = typeof x === "function" ? x : qu.constant(+x)), y)
  return y
}
export function pointX(p) {
  return p[0]
}
export function pointY(p) {
  return p[1]
}
export function pointRadial(a: number, r: number): qt.Point {
  return [(r = +r) * qu.cos((a -= qu.PI / 2)), r * qu.sin(a)]
}
export function stack(): qt.Stack<any, { [k: string]: number }, string>
export function stack<T>(): qt.Stack<any, T, string>
export function stack<T, K>(): qt.Stack<any, T, K>
export function stack<This, T, K>(): qt.Stack<This, T, K>
export function stack() {
  let _ks = qu.constant([]),
    _ord = order.none,
    _off = offset.none,
    _v = (d, k) => d[k]
  function y(...xs: any[]) {
    const sz = Array.from(_ks(xs), x => {
        const ys = []
        ys.k = x
        return ys
      }),
      n = sz.length
    let i,
      j = -1,
      oz
    for (const x of xs) {
      for (i = 0, ++j; i < n; ++i) {
        ;(sz[i]![j] = [0, +_v(x, sz[i].key, j, xs)]).data = x
      }
    }
    for (i = 0, oz = array(_ord(sz)); i < n; ++i) {
      sz[oz[i]].index = i
    }
    _off(sz, oz)
    return sz
  }
  y.keys = (x: any) => (x === undefined ? _ks : ((_ks = typeof x === "function" ? x : qu.constant(Array.from(x))), y))
  y.value = (x: any) => (x === undefined ? _v : ((_v = typeof x === "function" ? x : qu.constant(+x)), y))
  y.order = (x: any) =>
    x === undefined
      ? _ord
      : ((_ord = x === null ? order.none : typeof x === "function" ? x : qu.constant(Array.from(x))), y)
  y.offset = (x: any) => (x === undefined ? _off : ((_off = x === null ? offset.none : x), y))
  return y
}

export function symbol<T = any>(
  x?: qs.SymType | ((this: any, x: T, ...xs: any[]) => qs.SymType),
  size?: number | ((this: any, x: T, ...xs: any[]) => number)
): qs.Symbol<any, T>
export function symbol<This, T>(
  x?: qs.SymType | ((this: This, x: T, ...xs: any[]) => qs.SymType),
  size?: number | ((this: This, x: T, ...xs: any[]) => number)
): qs.Symbol<This, T>
export function symbol(x: any, ...xs: any[]): any {
  let buffer
  if (!context) context = buffer = new qu.Path()
  x(...xs).draw(context, +size(...xs))
  if (buffer) return (context = null), buffer + "" || null
}

export class Symbol<This, T> implements qs.Symbol<This, T> {
  context = null
  size: any
  type: any
  constructor(type, size?: number) {
    this.size = typeof size === "function" ? size : qu.constant(size === undefined ? 64 : +size)
    this.type = typeof type === "function" ? type : qu.constant(type || circle)
  }
  context(...xs: any[]) {
    return xs.length ? ((this.context = xs === null ? null : xs), symbol) : this.context
  }
  size(...xs: any[]) {
    return xs.length ? ((this.size = typeof xs === "function" ? xs : qu.constant(+xs)), symbol) : this.size
  }
  type(...xs: any[]) {
    return xs.length ? ((this.type = typeof xs === "function" ? xs : qu.constant(xs)), symbol) : this.type
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
    function peak(xs) {
      const n = xs.length
      let i = -1,
        j = 0,
        vi,
        vj = -Infinity
      while (++i < n) if ((vi = +xs[i][1]) > vj) (vj = vi), (j = i)
      return j
    }
    const ys = xs.map(peak)
    return none(xs).sort((a, b) => ys[a]! - ys[b]!)
  }
  export function ascending(xs: qt.Series<any, any>): number[] {
    const ys = xs.map(sum)
    return none(xs).sort((a, b) => ys[a]! - ys[b]!)
  }
  export function sum(xs) {
    const n = xs.length
    let y = 0,
      i = -1,
      v
    while (++i < n) if ((v = +xs[i][1])) y += v
    return y
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
    const ys = new Array(n)
    while (--n >= 0) ys[n] = n
    return ys
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
  static bundle: qs.Bundle = (function f(beta) {
    function y(x) {
      return beta === 1 ? new Curve.Basis(x) : new Curve.Bundle(x, beta)
    }
    y.beta = (x: number) => f(+x)
    return y
  })(0.85)
  static cardinal: qs.Cardinal = (function f(tension) {
    function y(x) {
      return new Curve.Cardinal(x, tension)
    }
    y.tension = (x: number) => f(+x)
    return y
  })(0)
  static cardinalClosed: qs.Cardinal = (function f(tension) {
    function y(x) {
      return new Curve.CardinalClosed(x, tension)
    }
    y.tension = (x: number) => f(+x)
    return y
  })(0)
  static cardinalOpen: qs.Cardinal = (function f(tension) {
    function y(x) {
      return new Curve.CardinalOpen(x, tension)
    }
    y.tension = (x: number) => f(+x)
    return y
  })(0)
  static catmullRom: qs.CatmullRom = (function f(alpha) {
    function y(x) {
      return alpha ? new Curve.CatmullRom(x, alpha) : new Curve.Cardinal(x, 0)
    }
    y.alpha = (x: number) => f(+x)
    return y
  })(0.5)
  static catmullRomClosed: qs.CatmullRom = (function f(alpha) {
    function y(x) {
      return alpha ? new Curve.CatmullRomClosed(x, alpha) : new Curve.CardinalClosed(x, 0)
    }
    y.alpha = (x: number) => f(+x)
    return y
  })(0.5)
  static catmullRomOpen: qs.CatmullRom = (function f(alpha) {
    function y(x) {
      return alpha ? new Curve.CatmullRomOpen(x, alpha) : new Curve.CardinalOpen(x, 0)
    }
    y.alpha = (x: number) => f(+x)
    return y
  })(0.5)

  _line = NaN
  _point = 0
  _x0 = NaN
  _x1 = NaN
  _x2 = NaN
  _x3 = NaN
  _x4 = NaN
  _x5 = NaN
  _y0 = NaN
  _y1 = NaN
  _y2 = NaN
  _y3 = NaN
  _y4 = NaN
  _y5 = NaN
  constructor(public ctx: qs.Context | qu.Path) {}
  areaStart() {}
  areaEnd() {}
}
export namespace Curve {
  export class Basis extends Curve implements qs.CurveGen {
    constructor(ctx: qs.Context | qu.Path) {
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
  export class BasisClosed extends Curve implements qs.CurveGen {
    constructor(ctx: qs.Context | qu.Path) {
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
  export class BasisOpen extends Curve implements qs.CurveGen {
    constructor(ctx: qs.Context | qu.Path) {
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
          const x0 = (this._x0 + 4 * this._x1 + x) / 6,
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
  export class Bump extends Curve implements qs.CurveGen {
    constructor(ctx: qs.Context | qu.Path, public isX: boolean) {
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
  export class BumpRadial extends Curve implements qs.CurveGen {
    constructor(ctx: qs.Context | qu.Path) {
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
    _xs: number[] = []
    _ys: number[] = []
    constructor(ctx: qs.Context | qu.Path, public beta: number) {
      super(ctx)
    }
    override lineStart() {
      this._xs = []
      this._ys = []
      super.lineStart()
    }
    override lineEnd() {
      const xs = this._xs,
        ys = this._ys,
        j = xs.length - 1
      if (j > 0) {
        const x0 = xs[0]!,
          y0 = ys[0]!,
          dx = xs[j]! - x0,
          dy = ys[j]! - y0
        let i = -1,
          t
        while (++i <= j) {
          t = i / j
          super.point(
            this.beta * xs[i]! + (1 - this.beta) * (x0 + t * dx),
            this.beta * ys[i]! + (1 - this.beta) * (y0 + t * dy)
          )
        }
      }
      this._xs = []
      this._ys = []
      super.lineEnd()
    }
    override point(x: number, y: number) {
      this._xs.push(+x)
      this._ys.push(+y)
    }
  }
  export class Cardinal extends Curve implements qs.CurveGen {
    _k
    constructor(ctx: qs.Context | qu.Path, tension: number) {
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
  export class CardinalClosed extends Curve implements qs.CurveGen {
    _k
    constructor(ctx: qs.Context | qu.Path, tension: number) {
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
  export class CardinalOpen extends Curve implements qs.CurveGen {
    _k
    constructor(ctx: qs.Context | qu.Path, tension: number) {
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
  export class CatmullRom extends Curve implements qs.CurveGen {
    _l01_2a = 0
    _l01_a = 0
    _l12_2a = 0
    _l12_a = 0
    _l23_2a = 0
    _l23_a = 0
    constructor(ctx: qs.Context | qu.Path, public alpha: number) {
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
        this._l23_a = qu.sqrt((this._l23_2a = qu.pow(x23 * x23 + y23 * y23, this.alpha)))
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
  export class CatmullRomClosed extends Curve implements qs.CurveGen {
    _l01_2a = 0
    _l01_a = 0
    _l12_2a = 0
    _l12_a = 0
    _l23_2a = 0
    _l23_a = 0
    constructor(ctx: qs.Context | qu.Path, public alpha: number) {
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
        this._l23_a = qu.sqrt((this._l23_2a = qu.pow(x23 * x23 + y23 * y23, this.alpha)))
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
  export class CatmullRomOpen extends Curve implements qs.CurveGen {
    _l01_2a = 0
    _l01_a = 0
    _l12_2a = 0
    _l12_a = 0
    _l23_2a = 0
    _l23_a = 0
    constructor(ctx: qs.Context | qu.Path, public alpha: number) {
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
        this._l23_a = qu.sqrt((this._l23_2a = qu.pow(x23 * x23 + y23 * y23, this.alpha)))
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
  export class Linear extends Curve implements qs.CurveGen {
    constructor(ctx: qs.Context | qu.Path) {
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
  export class LinearClosed extends Curve implements qs.CurveGen {
    constructor(ctx: qs.Context | qu.Path) {
      super(ctx)
    }
    override areaStart = qu.noop
    override areaEnd = qu.noop
    lineStart() {
      this._point = 0
    }
    lineEnd() {
      if (this._point) this.ctx.closePath()
    }
    point(x: number, y: number) {
      ;(x = +x), (y = +y)
      if (this._point) this.ctx.lineTo(x, y)
      else (this._point = 1), this.ctx.moveTo(x, y)
    }
  }
  export class MonotoneX extends Curve implements qs.CurveGen {
    _t0 = NaN
    constructor(ctx: qs.Context | qu.Path) {
      super(ctx)
    }
    override areaStart() {
      this._line = 0
    }
    override areaEnd() {
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
  class ReflectContext {
    constructor(public ctx: qs.Context | qu.Path) {}
    moveTo(x: number, y: number) {
      this.ctx.moveTo(y, x)
    }
    closePath() {
      this.ctx.closePath()
    }
    lineTo(x: number, y: number) {
      this.ctx.lineTo(y, x)
    }
    bezierCurveTo(...xs: [number, number, number, number, number, number]) {
      this.ctx.bezierCurveTo(...xs)
    }
  }
  export class MonotoneY extends Curve implements qs.CurveGen {
    override ctx
    constructor(x: qs.Context | qu.Path) {
      super(x)
      this.ctx = new ReflectContext(x)
    }
    lineStart = MonotoneX.prototype.lineStart
    lineEnd = MonotoneX.prototype.lineEnd
    point(x: number, y: number) {
      MonotoneX.prototype.point.call(this, y, x)
    }
  }
  export class Natural extends Curve implements qs.CurveGen {
    _xs: number[] = []
    _ys: number[] = []
    constructor(ctx: qs.Context | qu.Path) {
      super(ctx)
    }
    override areaStart() {
      this._line = 0
    }
    override areaEnd() {
      this._line = NaN
    }
    lineStart() {
      this._xs = []
      this._ys = []
    }
    lineEnd() {
      const xs = this._xs,
        ys = this._ys,
        n = xs.length
      if (n) {
        this._line ? this.ctx.lineTo(xs[0]!, ys[0]!) : this.ctx.moveTo(xs[0]!, ys[0]!)
        if (n === 2) this.ctx.lineTo(xs[1]!, ys[1]!)
        else {
          const px = controlPoints(xs),
            py = controlPoints(ys)
          for (let i0 = 0, i1 = 1; i1 < n; ++i0, ++i1) {
            this.ctx.bezierCurveTo(px[0][i0], py[0][i0], px[1][i0], py[1][i0], xs[i1]!, ys[i1]!)
          }
        }
      }
      if (this._line || (this._line !== 0 && n === 1)) this.ctx.closePath()
      this._line = 1 - this._line
      this._xs = []
      this._ys = []
    }
    point(x: number, y: number) {
      this._xs.push(+x)
      this._ys.push(+y)
    }
  }
  export const curveRadialLinear = curveRadial(Curve.linear)
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
      this._curve.point(r * qu.sin(a), r * -qu.cos(a))
    }
  }
  export function curveRadial(curve) {
    function y(context) {
      return new Radial(curve(context))
    }
    y._curve = curve
    return y
  }
  export class Step extends Curve implements qs.CurveGen {
    _x = NaN
    _y = NaN
    constructor(ctx: qs.Context | qu.Path, public pos = 0.5) {
      super(ctx)
    }
    override areaStart() {
      this._line = 0
    }
    override areaEnd() {
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

function point(that, x: number, y: number) {
  that.ctx.bezierCurveTo(
    (2 * that._x0 + that._x1) / 3,
    (2 * that._y0 + that._y1) / 3,
    (that._x0 + 2 * that._x1) / 3,
    (that._y0 + 2 * that._y1) / 3,
    (that._x0 + 4 * that._x1 + x) / 6,
    (that._y0 + 4 * that._y1 + y) / 6
  )
}
function point2(that, x: number, y: number) {
  that.ctx.bezierCurveTo(
    that._x1 + that._k * (that._x2 - that._x0),
    that._y1 + that._k * (that._y2 - that._y0),
    that._x2 + that._k * (that._x1 - x),
    that._y2 + that._k * (that._y1 - y),
    that._x2,
    that._y2
  )
}

function point3(that, x: number, y: number) {
  let x1 = that._x1,
    y1 = that._y1,
    x2 = that._x2,
    y2 = that._y2
  if (that._l01_a > qu.epsilon2) {
    const a = 2 * that._l01_2a + 3 * that._l01_a * that._l12_a + that._l12_2a,
      n = 3 * that._l01_a * (that._l01_a + that._l12_a)
    x1 = (x1 * a - that._x0 * that._l12_2a + that._x2 * that._l01_2a) / n
    y1 = (y1 * a - that._y0 * that._l12_2a + that._y2 * that._l01_2a) / n
  }
  if (that._l23_a > qu.epsilon2) {
    const b = 2 * that._l23_2a + 3 * that._l23_a * that._l12_a + that._l12_2a,
      m = 3 * that._l23_a * (that._l23_a + that._l12_a)
    x2 = (x2 * b + that._x1 * that._l23_2a - x * that._l12_2a) / m
    y2 = (y2 * b + that._y1 * that._l23_2a - y * that._l12_2a) / m
  }
  that.ctx.bezierCurveTo(x1, y1, x2, y2, that._x2, that._y2)
}

function point4(that, t0: number, t1: number) {
  const x0 = that._x0,
    y0 = that._y0,
    x1 = that._x1,
    y1 = that._y1,
    dx = (x1 - x0) / 3
  that.ctx.bezierCurveTo(x0 + dx, y0 + dx * t0, x1 - dx, y1 - dx * t1, x1, y1)
}

function slope2(that, t: number) {
  const h = that._x1 - that._x0
  return h ? ((3 * (that._y1 - that._y0)) / h - t) / 2 : t
}

function slope3(that, x2: number, y2: number) {
  const h0 = that._x1 - that._x0,
    h1 = x2 - that._x1,
    s0 = (that._y1 - that._y0) / (h0 || (h1 < 0 && -0)),
    s1 = (y2 - that._y1) / (h1 || (h0 < 0 && -0)),
    p = (s0 * h1 + s1 * h0) / (h0 + h1)
  const sign = (x: number) => (x < 0 ? -1 : 1)
  return (sign(s0) + sign(s1)) * qu.min(qu.abs(s0), qu.abs(s1), 0.5 * qu.abs(p)) || 0
}

export namespace symbol {
  const sqrt3 = qu.sqrt(3)
  export const asterisk: qs.SymType = {
    draw(p, size) {
      const r = qu.sqrt(size + qu.min(size / 28, 0.75)) * 0.59436
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
  export const circle: qs.SymType = {
    draw(p, size) {
      const r = qu.sqrt(size / qu.PI)
      p.moveTo(r, 0)
      p.arc(0, 0, r, 0, qu.tau)
    },
  }
  export const cross: qs.SymType = {
    draw(p, size) {
      const r = qu.sqrt(size / 5) / 2
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
  const tan30 = qu.sqrt(1 / 3)
  const tan30_2 = tan30 * 2
  export const diamond: qs.SymType = {
    draw(p, size) {
      const y = qu.sqrt(size / tan30_2)
      const x = y * tan30
      p.moveTo(0, -y)
      p.lineTo(x, 0)
      p.lineTo(0, y)
      p.lineTo(-x, 0)
      p.closePath()
    },
  }
  export const diamond2: qs.SymType = {
    draw(p, size) {
      const r = qu.sqrt(size) * 0.62625
      p.moveTo(0, -r)
      p.lineTo(r, 0)
      p.lineTo(0, r)
      p.lineTo(-r, 0)
      p.closePath()
    },
  }
  export const plus: qs.SymType = {
    draw(p, size) {
      const r = qu.sqrt(size - qu.min(size / 7, 2)) * 0.87559
      p.moveTo(-r, 0)
      p.lineTo(r, 0)
      p.moveTo(0, r)
      p.lineTo(0, -r)
    },
  }
  export const square: qs.SymType = {
    draw(p, size) {
      const w = qu.sqrt(size)
      const x = -w / 2
      p.rect(x, x, w, w)
    },
  }
  export const square2: qs.SymType = {
    draw(p, size) {
      const r = qu.sqrt(size) * 0.4431
      p.moveTo(r, r)
      p.lineTo(r, -r)
      p.lineTo(-r, -r)
      p.lineTo(-r, r)
      p.closePath()
    },
  }
  const ka = 0.8908130915292852281
  const kr = qu.sin(qu.PI / 10) / qu.sin((7 * qu.PI) / 10)
  const kx = qu.sin(qu.tau / 10) * kr
  const ky = -qu.cos(qu.tau / 10) * kr
  export const star: qs.SymType = {
    draw(p, size) {
      const r = qu.sqrt(size * ka)
      const x = kx * r
      const y = ky * r
      p.moveTo(0, -r)
      p.lineTo(x, y)
      for (let i = 1; i < 5; ++i) {
        const a = (qu.tau * i) / 5
        const c = qu.cos(a)
        const s = qu.sin(a)
        p.lineTo(s * r, -c * r)
        p.lineTo(c * x - s * y, s * x + c * y)
      }
      p.closePath()
    },
  }
  export const triangle: qs.SymType = {
    draw(p, size) {
      const y = -qu.sqrt(size / (sqrt3 * 3))
      p.moveTo(0, y * 2)
      p.lineTo(-sqrt3 * y, -y)
      p.lineTo(sqrt3 * y, -y)
      p.closePath()
    },
  }
  export const triangle2: qs.SymType = {
    draw(p, size) {
      const s = qu.sqrt(size) * 0.6824
      const t = s / 2
      const u = (s * sqrt3) / 2 // cos(qu.PI / 6)
      p.moveTo(0, -s)
      p.lineTo(u, t)
      p.lineTo(-u, t)
      p.closePath()
    },
  }
  const c = -0.5
  const s = qu.sqrt(3) / 2
  const k = 1 / qu.sqrt(12)
  const a = (k / 2 + 1) * 3
  export const wye: qs.SymType = {
    draw(p, size) {
      const r = qu.sqrt(size / a)
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
  export const x: qs.SymType = {
    draw(p, size) {
      const r = qu.sqrt(size - qu.min(size / 6, 1.7)) * 0.6189
      p.moveTo(-r, -r)
      p.lineTo(r, r)
      p.moveTo(-r, r)
      p.lineTo(r, -r)
    },
  }
  export const fills: qs.SymType[] = [circle, cross, diamond, square, star, triangle, wye]
  export const strokes: qs.SymType[] = [circle, plus, x, triangle2, asterisk, square2, diamond2]
}
