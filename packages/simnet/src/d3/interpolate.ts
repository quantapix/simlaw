import * as qc from "./color.js"
import * as qu from "./utils.js"
import type * as qt from "./types.js"

function isNumArray(x: any) {
  return ArrayBuffer.isView(x) && !(x instanceof DataView)
}
export function numArray<T extends any[]>(a: any[], b: T): qt.ArrayIpolator<T>
export function numArray<T extends qt.NumArray>(a: qt.NumArray | number[], b: T): (x: number) => T
export function numArray(a: any, b: any) {
  if (!b) b = []
  const n = a ? qu.min(b.length, a.length) : 0
  const c = b.slice()
  return function (x: number) {
    for (let i = 0; i < n; ++i) c[i] = a[i] * (1 - x) + b[i] * x
    return c
  }
}
export function anyArray(a: any, b: any) {
  const nb: number = b & b.length ?? 0,
    na = qu.min(nb, a & a.length ?? 0),
    a2 = new Array(na),
    b2 = new Array(nb)
  let i = 0
  for (; i < na; ++i) a2[i] = value(a[i], b[i])
  for (; i < nb; ++i) b2[i] = b[i]
  return function (x: number) {
    for (i = 0; i < na; ++i) b2[i] = a2[i](x)
    return b2
  }
}
export function array<T extends any[]>(a: any[], b: T): qt.ArrayIpolator<T>
export function array<T extends qt.NumArray>(a: qt.NumArray | number[], b: T): (x: number) => T
export function array(a: any, b: any) {
  return (isNumArray(b) ? numArray : anyArray)(a, b)
}

function linear(a: number, b: number) {
  return (x: number) => a + x * b
}
export function hue(a: number, b: number) {
  const d = b - a
  return d ? linear(a, d > 180 || d < -180 ? d - 360 * qu.round(d / 360) : d) : qu.constant(isNaN(a) ? b : a)
}
export function ipolateHue(a: number, b: number): (x: number) => number {
  const h = hue(+a, +b)
  return x => {
    const y = h(x)
    return y - 360 * qu.floor(y / 360)
  }
}
export function nogamma(a: number, b: number) {
  const d = b - a
  return d ? linear(a, d) : qu.constant(isNaN(a) ? b : a)
}
export const color = nogamma
function exponential(a: number, b: number, y: number) {
  a = qu.pow(a, y)
  b = qu.pow(b, y) - a
  y = 1 / y
  return (x: number) => qu.pow(a + x * b, y)
}
export function gamma(x: number) {
  return (x = +x) === 1
    ? nogamma
    : (a: number, b: number) => (b - a ? exponential(a, b, x) : qu.constant(isNaN(a) ? b : a))
}

export const rgb = (function g(y) {
  const color = gamma(y)
  function f(start: string | qt.Color, end: string | qt.Color) {
    const xs = qc.RGB.from(start)
    const xe = qc.RGB.from(end)
    const r = color(xs.r, xe.r),
      g = color(xs.g, xe.g),
      b = color(xs.b, xe.b),
      alpha = nogamma(xs.alpha, xe.alpha)
    return (x: number) => {
      xs.r = r(x)
      xs.g = g(x)
      xs.b = b(x)
      xs.alpha = alpha(x)
      return xs + ""
    }
  }
  f.gamma = g
  return f
})(1)

function _hsl(hue: Function) {
  return function (start: string | qt.Color, end: string | qt.Color) {
    const xs = qc.HSL.from(start)
    const xe = qc.HSL.from(end)
    const h = hue(xs.h, xe.h),
      s = color(xs.s, xe.s),
      l = color(xs.l, xe.l),
      alpha = color(xs.alpha, xe.alpha)
    return (x: number) => {
      xs.h = h(x)
      xs.s = s(x)
      xs.l = l(x)
      xs.alpha = alpha(x)
      return xs + ""
    }
  }
}
export const hsl = _hsl(hue)
export const hslLong = _hsl(color)

function _hcl(hue: Function) {
  return function (start: string | qt.Color, end: string | qt.Color) {
    const xs = qc.HCL.from(start)
    const xe = qc.HCL.from(end)
    const h = hue(xs.h, xe.h),
      c = color(xs.c, xe.c),
      l = color(xs.l, xe.l),
      alpha = color(xs.alpha, xe.alpha)
    return (x: number) => {
      xs.h = h(x)
      xs.c = c(x)
      xs.l = l(x)
      xs.alpha = alpha(x)
      return xs + ""
    }
  }
}
export const hcl = _hcl(hue)
export const hclLong = _hcl(color)

export function lab(start: string | qt.Color, end: string | qt.Color) {
  const xs = qc.LAB.from(start)
  const xe = qc.LAB.from(end)
  const l = color(xs.l, xe.l),
    a = color(xs.a, xe.a),
    b = color(xs.b, xe.b),
    alpha = color(xs.alpha, xe.alpha)
  return (x: number) => {
    xs.l = l(x)
    xs.a = a(x)
    xs.b = b(x)
    xs.alpha = alpha(x)
    return xs + ""
  }
}

function _cubehelix(hue: Function) {
  return (function g(y) {
    y = +y
    function f(start: string | qt.Color, end: string | qt.Color) {
      const xs = qc.Cubehelix.from(start)
      const xe = qc.Cubehelix.from(end)
      const h = hue(xs.h, xe.h),
        s = color(xs.s, xs.s),
        l = color(xs.l, xs.l),
        alpha = color(xs.alpha, xe.alpha)
      return (x: number) => {
        xs.h = h(x)
        xs.s = s(x)
        xs.l = l(qu.pow(x, y))
        xs.alpha = alpha(x)
        return xs + ""
      }
    }
    f.gamma = g
    return f
  })(1)
}
export const cubehelix = _cubehelix(hue)
export const cubehelixLong = _cubehelix(color)

function rgbSpline(spline) {
  return function (colors) {
    let n = colors.length,
      r = new Array(n),
      g = new Array(n),
      b = new Array(n),
      i,
      color
    for (i = 0; i < n; ++i) {
      color = qc.rgb(colors[i])
      r[i] = color.r || 0
      g[i] = color.g || 0
      b[i] = color.b || 0
    }
    r = spline(r)
    g = spline(g)
    b = spline(b)
    color.alpha = 1
    return function (t) {
      color.r = r(t)
      color.g = g(t)
      color.b = b(t)
      return color + ""
    }
  }
}

function _basis(x1: number, v0: number, v1: number, v2: number, v3: number) {
  const x2 = x1 * x1
  const x3 = x2 * x1
  return (
    ((1 - 3 * x1 + 3 * x2 - x3) * v0 + (4 - 6 * x2 + 3 * x3) * v1 + (1 + 3 * x1 + 3 * x2 - 3 * x3) * v2 + x3 * v3) / 6
  )
}
export function basis(vs: number[]): (x: number) => number {
  const n = vs.length - 1
  return x => {
    const i = x <= 0 ? (x = 0) : x >= 1 ? ((x = 1), n - 1) : qu.floor(x * n),
      v1 = vs[i]!,
      v2 = vs[i + 1]!,
      v0 = i > 0 ? vs[i - 1]! : 2 * v1 - v2,
      v3 = i < n - 1 ? vs[i + 2]! : 2 * v2 - v1
    return _basis((x - i / n) * n, v0, v1, v2, v3)
  }
}
export function basisClosed(vs: number[]): (x: number) => number {
  const n = vs.length
  return x => {
    const i = qu.floor(((x %= 1) < 0 ? ++x : x) * n),
      v0 = vs[(i + n - 1) % n]!,
      v1 = vs[i % n]!,
      v2 = vs[(i + 1) % n]!,
      v3 = vs[(i + 2) % n]!
    return _basis((x - i / n) * n, v0, v1, v2, v3)
  }
}

export const rgbBasis: (xs: Array<string | qt.Color>) => (x: number) => string = rgbSpline(basis)
export const rgbBasisClosed: (xs: Array<string | qt.Color>) => (x: number) => string = rgbSpline(basisClosed)

const reA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g
const reB = new RegExp(reA.source, "g")

function zero(x: any) {
  return () => x
}
function one(f: Function) {
  return (x: any) => f(x) + ""
}
export function date(a: Date, b: Date): (x: number) => Date {
  a = +a
  b = +b
  const d = new Date()
  return x => (d.setTime(a * (1 - x) + b * x), d)
}
export function number(a: number | { valueOf(): number }, b: number | { valueOf(): number }): (x: number) => number {
  a = +a
  b = +b
  return x => a * (1 - x) + b * x
}
export function round(a: number | { valueOf(): number }, b: number | { valueOf(): number }): (x: number) => number {
  a = +a
  b = +b
  return x => qu.round(a * (1 - x) + b * x)
}
export function string(a: string | { toString(): string }, b: string | { toString(): string }): (x: number) => string {
  let bi = (reA.lastIndex = reB.lastIndex = 0),
    am,
    bm,
    bs,
    i = -1,
    s = [],
    q = []
  ;(a = a + ""), (b = b + "")
  while ((am = reA.exec(a)) && (bm = reB.exec(b))) {
    if ((bs = bm.index) > bi) {
      bs = b.slice(bi, bs)
      if (s[i]) s[i] += bs
      else s[++i] = bs
    }
    if ((am = am[0]) === (bm = bm[0])) {
      if (s[i]) s[i] += bm
      else s[++i] = bm
    } else {
      s[++i] = null
      q.push({ i: i, x: number(am, bm) })
    }
    bi = reB.lastIndex
  }
  if (bi < b.length) {
    bs = b.slice(bi)
    if (s[i]) s[i] += bs
    else s[++i] = bs
  }
  return s.length < 2
    ? q[0]
      ? one(q[0].x)
      : zero(b)
    : ((b = q.length),
      function (t) {
        for (let i = 0, o; i < b; ++i) s[(o = q[i]).i] = o.x(t)
        return s.join("")
      })
}
export function object<T extends object>(a: any, b: T): (x: number) => T {
  const i = {},
    c: T = {}
  if (a === null || typeof a !== "object") a = {}
  if (b === null || typeof b !== "object") b = {}
  for (const k in b) {
    if (k in a) {
      i[k] = value(a[k], b[k])
    } else c[k] = b[k]
  }
  return x => {
    for (const k in i) c[k] = i[k](x)
    return c
  }
}

export function value(a: any, b: null): (t: number) => null
export function value(a: any, b: boolean): (t: number) => boolean
export function value(a: string | qt.Color, b: qt.Color): (t: number) => string
export function value(a: Date, b: Date): (t: number) => Date
export function value(a: number | { valueOf(): number }, b: number | { valueOf(): number }): (x: number) => number
export function value<T extends qt.NumArray>(a: qt.NumArray | number[], b: T): (t: number) => T
export function value(a: string | { toString(): string }, b: string): (t: number) => string
export function value<T extends any[]>(a: any[], b: T): (t: number) => T
export function value<T extends object>(a: any, b: T): (t: number) => T
export function value(a: any, b: any) {
  let t = typeof b,
    c
  return b == null || t === "boolean"
    ? qu.constant(b)
    : (t === "number"
        ? number
        : t === "string"
        ? (c = color(b))
          ? ((b = c), rgb)
          : string
        : b instanceof color
        ? rgb
        : b instanceof Date
        ? date
        : isNumArray(b)
        ? numArray
        : Array.isArray(b)
        ? anyArray
        : (typeof b.valueOf !== "function" && typeof b.toString !== "function") || isNaN(b)
        ? object
        : number)(a, b)
}

export function piecewise(vs: qt.ZoomView[]): qt.ZoomIpolator
export function piecewise(f: (a: qt.ZoomView, b: qt.ZoomView) => qt.ZoomIpolator, vs: qt.ZoomView[]): qt.ZoomIpolator
export function piecewise<T extends any[]>(vs: T[]): qt.ArrayIpolator<T>
export function piecewise<T extends any[]>(f: (a: any[], b: T) => qt.ArrayIpolator<T>, vs: T[]): qt.ArrayIpolator<T>
export function piecewise(vs: unknown[]): (x: number) => any
export function piecewise<T>(f: (a: T, b: T) => unknown, vs: T[]): (x: number) => any
export function piecewise(f: any, xs?: any) {
  if (xs === undefined) (xs = f), (f = value)
  const n = xs.length - 1
  const ys = new Array(n < 0 ? 0 : n)
  let i = 0
  let x = xs[0]
  while (i < n) ys[i] = f(x, (x = xs[++i]))
  return (x: number) => {
    const i = qu.max(0, qu.min(n - 1, qu.floor((x *= n))))
    return ys[i](x - i)
  }
}

export const zoom: (a: qt.ZoomView, b: qt.ZoomView) => qt.ZoomIpolator = (function zoomRho(rho, rho2, rho4) {
  function zoom(p0, p1) {
    let ux0 = p0[0],
      uy0 = p0[1],
      w0 = p0[2],
      ux1 = p1[0],
      uy1 = p1[1],
      w1 = p1[2],
      dx = ux1 - ux0,
      dy = uy1 - uy0,
      d2 = dx * dx + dy * dy,
      i,
      S
    if (d2 < qu.epsilon2) {
      S = qu.log(w1 / w0) / rho
      i = function (t) {
        return [ux0 + t * dx, uy0 + t * dy, w0 * qu.exp(rho * t * S)]
      }
    } else {
      const d1 = qu.sqrt(d2),
        b0 = (w1 * w1 - w0 * w0 + rho4 * d2) / (2 * w0 * rho2 * d1),
        b1 = (w1 * w1 - w0 * w0 - rho4 * d2) / (2 * w1 * rho2 * d1),
        r0 = qu.log(qu.sqrt(b0 * b0 + 1) - b0),
        r1 = qu.log(qu.sqrt(b1 * b1 + 1) - b1)
      S = (r1 - r0) / rho
      i = function (t) {
        const s = t * S,
          coshr0 = qu.cosh(r0),
          u = (w0 / (rho2 * d1)) * (coshr0 * qu.tanh(rho * s + r0) - qu.sinh(r0))
        return [ux0 + u * dx, uy0 + u * dy, (w0 * coshr0) / qu.cosh(rho * s + r0)]
      }
    }
    i.duration = (S * 1000 * rho) / qu.SQRT2
    return i
  }
  zoom.rho = function (_) {
    const _1 = qu.max(1e-3, +_),
      _2 = _1 * _1,
      _4 = _2 * _2
    return zoomRho(_1, _2, _4)
  }
  return zoom
})(qu.SQRT2, 2, 4)

function transform(parse, pxComma, pxParen, degParen) {
  function pop(s) {
    return s.length ? s.pop() + " " : ""
  }
  function translate(xa, ya, xb, yb, s, q) {
    if (xa !== xb || ya !== yb) {
      const i = s.push("translate(", null, pxComma, null, pxParen)
      q.push({ i: i - 4, x: number(xa, xb) }, { i: i - 2, x: number(ya, yb) })
    } else if (xb || yb) {
      s.push("translate(" + xb + pxComma + yb + pxParen)
    }
  }
  function rotate(a, b, s, q) {
    if (a !== b) {
      if (a - b > 180) b += 360
      else if (b - a > 180) a += 360
      q.push({ i: s.push(pop(s) + "rotate(", null, degParen) - 2, x: number(a, b) })
    } else if (b) {
      s.push(pop(s) + "rotate(" + b + degParen)
    }
  }
  function skewX(a, b, s, q) {
    if (a !== b) {
      q.push({ i: s.push(pop(s) + "skewX(", null, degParen) - 2, x: number(a, b) })
    } else if (b) {
      s.push(pop(s) + "skewX(" + b + degParen)
    }
  }
  function scale(xa, ya, xb, yb, s, q) {
    if (xa !== xb || ya !== yb) {
      const i = s.push(pop(s) + "scale(", null, ",", null, ")")
      q.push({ i: i - 4, x: number(xa, xb) }, { i: i - 2, x: number(ya, yb) })
    } else if (xb !== 1 || yb !== 1) {
      s.push(pop(s) + "scale(" + xb + "," + yb + ")")
    }
  }
  return function (a, b) {
    const s = [],
      q = []
    ;(a = parse(a)), (b = parse(b))
    translate(a.translateX, a.translateY, b.translateX, b.translateY, s, q)
    rotate(a.rotate, b.rotate, s, q)
    skewX(a.skewX, b.skewX, s, q)
    scale(a.scaleX, a.scaleY, b.scaleX, b.scaleY, s, q)
    a = b = null
    return function (t) {
      let i = -1,
        n = q.length,
        o
      while (++i < n) s[(o = q[i]).i] = o.x(t)
      return s.join("")
    }
  }
}
export const transformCss: (a: string, b: string) => (x: number) => string = transform(parseCss, "px, ", "px)", "deg)")
export const transformSvg: (a: string, b: string) => (x: number) => string = transform(parseSvg, ", ", ")", ")")

export const identity = {
  translateX: 0,
  translateY: 0,
  rotate: 0,
  skewX: 0,
  scaleX: 1,
  scaleY: 1,
}
function parseCss(x: string) {
  const m = new (typeof DOMMatrix === "function" ? DOMMatrix : WebKitCSSMatrix)(x + "")
  return m.isIdentity ? identity : decompose(m.a, m.b, m.c, m.d, m.e, m.f)
}
let svg: any = undefined
function parseSvg(x: any) {
  if (x == null) return identity
  if (!svg) svg = document.createElementNS("http://www.w3.org/2000/svg", "g")
  svg.setAttribute("transform", x)
  if (!(x = svg.transform.baseVal.consolidate())) return identity
  x = x.matrix
  return decompose(x.a, x.b, x.c, x.d, x.e, x.f)
}
function decompose(a, b, c, d, e, f) {
  let scaleX, scaleY, skewX
  if ((scaleX = qu.sqrt(a * a + b * b))) (a /= scaleX), (b /= scaleX)
  if ((skewX = a * c + b * d)) (c -= a * skewX), (d -= b * skewX)
  if ((scaleY = qu.sqrt(c * c + d * d))) (c /= scaleY), (d /= scaleY), (skewX /= scaleY)
  if (a * d < b * c) (a = -a), (b = -b), (skewX = -skewX), (scaleX = -scaleX)
  return {
    translateX: e,
    translateY: f,
    rotate: qu.atan2(b, a) * qu.degrees,
    skewX: qu.atan(skewX) * qu.degrees,
    scaleX: scaleX,
    scaleY: scaleY,
  }
}
