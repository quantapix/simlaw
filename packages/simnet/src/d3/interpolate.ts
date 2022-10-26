import { cubehelix as colorCubehelix } from "./color.js"
import { hcl as colorHcl } from "./color.js"
import { hsl as colorHsl } from "./color.js"
import { lab as colorLab } from "./color.js"
import { rgb as colorRgb } from "./color.js"
import type * as qt from "./types.js"

export function array<T extends any[]>(a: any[], b: T): qt.ArrayInterpolator<T>
export function array<T extends qt.NumberArray>(a: qt.NumberArray | number[], b: T): (t: number) => T
export function array(a: any, b: any) {
  return (isNumberArray(b) ? numberArray : genericArray)(a, b)
}
export function genericArray(a, b) {
  let nb = b ? b.length : 0,
    na = a ? Math.min(nb, a.length) : 0,
    x = new Array(na),
    c = new Array(nb),
    i
  for (i = 0; i < na; ++i) x[i] = value(a[i], b[i])
  for (; i < nb; ++i) c[i] = b[i]
  return function (t) {
    for (i = 0; i < na; ++i) c[i] = x[i](t)
    return c
  }
}
function _basis(x1: number, v0: number, v1: number, v2: number, v3: number) {
  const x2 = x1 * x1,
    x3 = x2 * x1
  return (
    ((1 - 3 * x1 + 3 * x2 - x3) * v0 + (4 - 6 * x2 + 3 * x3) * v1 + (1 + 3 * x1 + 3 * x2 - 3 * x3) * v2 + x3 * v3) / 6
  )
}
export function basis(vs: number[]): (x: number) => number {
  const n = vs.length - 1
  return function (x) {
    const i = x <= 0 ? (x = 0) : x >= 1 ? ((x = 1), n - 1) : Math.floor(x * n),
      v1 = vs[i]!,
      v2 = vs[i + 1]!,
      v0 = i > 0 ? vs[i - 1]! : 2 * v1 - v2,
      v3 = i < n - 1 ? vs[i + 2]! : 2 * v2 - v1
    return _basis((x - i / n) * n, v0, v1, v2, v3)
  }
}
export function basisClosed(vs: number[]): (x: number) => number {
  const n = vs.length
  return function (t) {
    const i = Math.floor(((t %= 1) < 0 ? ++t : t) * n),
      v0 = vs[(i + n - 1) % n]!,
      v1 = vs[i % n]!,
      v2 = vs[(i + 1) % n]!,
      v3 = vs[(i + 2) % n]!
    return _basis((t - i / n) * n, v0, v1, v2, v3)
  }
}
export const constant = (x: any) => () => x
function linear(a: number, d: number) {
  return function (x: number) {
    return a + x * d
  }
}
export function nogamma(a: number, b: number) {
  const d = b - a
  return d ? linear(a, d) : constant(isNaN(a) ? b : a)
}

function exponential(a: number, b: number, y: number) {
  return (
    (a = Math.pow(a, y)),
    (b = Math.pow(b, y) - a),
    (y = 1 / y),
    function (x: number) {
      return Math.pow(a + x * b, y)
    }
  )
}
export function hue(a: number, b: number) {
  const d = b - a
  return d ? linear(a, d > 180 || d < -180 ? d - 360 * Math.round(d / 360) : d) : constant(isNaN(a) ? b : a)
}
export function gamma(x: number) {
  return (x = +x) === 1
    ? nogamma
    : function (a: number, b: number) {
        return b - a ? exponential(a, b, x) : constant(isNaN(a) ? b : a)
      }
}
export const color = nogamma

function _cubehelix(hue) {
  return (function cubehelixGamma(y) {
    y = +y
    function cubehelix(start, end) {
      const h = hue((start = colorCubehelix(start)).h, (end = colorCubehelix(end)).h),
        s = color(start.s, end.s),
        l = color(start.l, end.l),
        opacity = color(start.opacity, end.opacity)
      return function (t) {
        start.h = h(t)
        start.s = s(t)
        start.l = l(Math.pow(t, y))
        start.opacity = opacity(t)
        return start + ""
      }
    }
    cubehelix.gamma = cubehelixGamma
    return cubehelix
  })(1)
}
export const cubehelix: qt.ColorGammaInterpolationFactory = _cubehelix(hue)
export const cubehelixLong: qt.ColorGammaInterpolationFactory = _cubehelix(color)

export function date(a: Date, b: Date): (x: number) => Date {
  const d = new Date()
  return (
    (a = +a),
    (b = +b),
    function (x) {
      return d.setTime(a * (1 - x) + b * x), d
    }
  )
}
export function discrete<T>(vs: T[]): (x: number) => T {
  const n = vs.length
  return function (x) {
    return vs[Math.max(0, Math.min(n - 1, Math.floor(x * n)))]!
  }
}
function _hcl(hue) {
  return function (start, end) {
    const h = hue((start = colorHcl(start)).h, (end = colorHcl(end)).h),
      c = color(start.c, end.c),
      l = color(start.l, end.l),
      opacity = color(start.opacity, end.opacity)
    return function (x) {
      start.h = h(x)
      start.c = c(x)
      start.l = l(x)
      start.opacity = opacity(x)
      return start + ""
    }
  }
}
export const hcl: (a: string | qt.ColorCommonInstance, b: string | qt.ColorCommonInstance) => (x: number) => string =
  _hcl(hue)
export const hclLong: (
  a: string | qt.ColorCommonInstance,
  b: string | qt.ColorCommonInstance
) => (x: number) => string = _hcl(color)

function _hsl(hue) {
  return function (start, end) {
    const h = hue((start = colorHsl(start)).h, (end = colorHsl(end)).h),
      s = color(start.s, end.s),
      l = color(start.l, end.l),
      opacity = color(start.opacity, end.opacity)
    return function (x) {
      start.h = h(x)
      start.s = s(x)
      start.l = l(x)
      start.opacity = opacity(x)
      return start + ""
    }
  }
}
export const hsl: (a: string | qt.ColorCommonInstance, b: string | qt.ColorCommonInstance) => (t: number) => string =
  _hsl(hue)
export const hslLong: (
  a: string | qt.ColorCommonInstance,
  b: string | qt.ColorCommonInstance
) => (t: number) => string = _hsl(color)
export function interpolateHue(a: number, b: number): (x: number) => number {
  const i = hue(+a, +b)
  return function (t) {
    const x = i(t)
    return x - 360 * Math.floor(x / 360)
  }
}

export function lab(
  start: string | qt.ColorCommonInstance,
  end: string | qt.ColorCommonInstance
): (t: number) => string {
  const l = color((start = colorLab(start)).l, (end = colorLab(end)).l),
    a = color(start.a, end.a),
    b = color(start.b, end.b),
    opacity = color(start.opacity, end.opacity)
  return function (t) {
    start.l = l(t)
    start.a = a(t)
    start.b = b(t)
    start.opacity = opacity(t)
    return start + ""
  }
}
export function number(a: number | { valueOf(): number }, b: number | { valueOf(): number }): (x: number) => number {
  return (
    (a = +a),
    (b = +b),
    function (t) {
      return a * (1 - t) + b * t
    }
  )
}
export function numberArray<T extends qt.NumberArray | number[]>(a: qt.NumberArray | number[], b: T): (t: number) => T {
  if (!b) b = []
  let n = a ? Math.min(b.length, a.length) : 0,
    c = b.slice(),
    i
  return function (t) {
    for (i = 0; i < n; ++i) c[i] = a[i] * (1 - t) + b[i] * t
    return c
  }
}
export function isNumberArray(x) {
  return ArrayBuffer.isView(x) && !(x instanceof DataView)
}
export function object<T extends object>(a: any, b: T): (t: number) => T {
  let i = {},
    c = {},
    k
  if (a === null || typeof a !== "object") a = {}
  if (b === null || typeof b !== "object") b = {}
  for (k in b) {
    if (k in a) {
      i[k] = value(a[k], b[k])
    } else {
      c[k] = b[k]
    }
  }
  return function (t) {
    for (k in i) c[k] = i[k](t)
    return c
  }
}
export function piecewise(vs: qt.ZoomView[]): qt.ZoomInterpolator
export function piecewise(
  f: (a: qt.ZoomView, b: qt.ZoomView) => qt.ZoomInterpolator,
  vs: qt.ZoomView[]
): qt.ZoomInterpolator
export function piecewise<T extends any[]>(vs: T[]): qt.ArrayInterpolator<T>
export function piecewise<T extends any[]>(
  f: (a: any[], b: T) => qt.ArrayInterpolator<T>,
  vs: T[]
): qt.ArrayInterpolator<T>
export function piecewise(vs: unknown[]): (x: number) => any
export function piecewise<T>(f: (a: T, b: T) => unknown, vs: T[]): (x: number) => any
export function piecewise(f: any, vs?: any) {
  if (vs === undefined) (vs = f), (f = value)
  const n = vs.length - 1,
    ys = new Array(n < 0 ? 0 : n)
  let i = 0,
    v = vs[0]
  while (i < n) ys[i] = f(v, (v = vs[++i]))
  return function (x: number) {
    const i = Math.max(0, Math.min(n - 1, Math.floor((x *= n))))
    return ys[i](x - i)
  }
}
export function quantize<T>(f: (x: number) => T, n: number): T[] {
  const y = new Array(n)
  for (let i = 0; i < n; ++i) y[i] = f(i / (n - 1))
  return y
}
export const rgb: qt.ColorGammaInterpolationFactory = (function rgbGamma(y) {
  const color = gamma(y)
  function rgb(start, end) {
    const r = color((start = colorRgb(start)).r, (end = colorRgb(end)).r),
      g = color(start.g, end.g),
      b = color(start.b, end.b),
      opacity = nogamma(start.opacity, end.opacity)
    return function (t) {
      start.r = r(t)
      start.g = g(t)
      start.b = b(t)
      start.opacity = opacity(t)
      return start + ""
    }
  }
  rgb.gamma = rgbGamma
  return rgb
})(1)
function rgbSpline(spline) {
  return function (colors) {
    let n = colors.length,
      r = new Array(n),
      g = new Array(n),
      b = new Array(n),
      i,
      color
    for (i = 0; i < n; ++i) {
      color = colorRgb(colors[i])
      r[i] = color.r || 0
      g[i] = color.g || 0
      b[i] = color.b || 0
    }
    r = spline(r)
    g = spline(g)
    b = spline(b)
    color.opacity = 1
    return function (t) {
      color.r = r(t)
      color.g = g(t)
      color.b = b(t)
      return color + ""
    }
  }
}
export const rgbBasis: (xs: Array<string | qt.ColorCommonInstance>) => (x: number) => string = rgbSpline(basis)
export const rgbBasisClosed: (xs: Array<string | qt.ColorCommonInstance>) => (x: number) => string =
  rgbSpline(basisClosed)

export function round(a: number | { valueOf(): number }, b: number | { valueOf(): number }): (x: number) => number {
  return (
    (a = +a),
    (b = +b),
    function (t) {
      return Math.round(a * (1 - t) + b * t)
    }
  )
}
const reA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g,
  reB = new RegExp(reA.source, "g")

function zero(x: any) {
  return function () {
    return x
  }
}
function one(f: Function) {
  return function (x: any) {
    return f(x) + ""
  }
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
export function value(a: any, b: null): (t: number) => null
export function value(a: any, b: boolean): (t: number) => boolean
export function value(a: string | qt.ColorCommonInstance, b: qt.ColorCommonInstance): (t: number) => string
export function value(a: Date, b: Date): (t: number) => Date
export function value(a: number | { valueOf(): number }, b: number | { valueOf(): number }): (x: number) => number
export function value<T extends qt.NumberArray>(a: qt.NumberArray | number[], b: T): (t: number) => T
export function value(a: string | { toString(): string }, b: string): (t: number) => string
export function value<T extends any[]>(a: any[], b: T): (t: number) => T
export function value<T extends object>(a: any, b: T): (t: number) => T
export function value(a: any, b: any) {
  let t = typeof b,
    c
  return b == null || t === "boolean"
    ? constant(b)
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
        : isNumberArray(b)
        ? numberArray
        : Array.isArray(b)
        ? genericArray
        : (typeof b.valueOf !== "function" && typeof b.toString !== "function") || isNaN(b)
        ? object
        : number)(a, b)
}
const epsilon2 = 1e-12
function cosh(x: number) {
  return ((x = Math.exp(x)) + 1 / x) / 2
}
function sinh(x: number) {
  return ((x = Math.exp(x)) - 1 / x) / 2
}
function tanh(x: number) {
  return ((x = Math.exp(2 * x)) - 1) / (x + 1)
}
export const zoom: (a: qt.ZoomView, b: qt.ZoomView) => qt.ZoomInterpolator = (function zoomRho(rho, rho2, rho4) {
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
    if (d2 < epsilon2) {
      S = Math.log(w1 / w0) / rho
      i = function (t) {
        return [ux0 + t * dx, uy0 + t * dy, w0 * Math.exp(rho * t * S)]
      }
    } else {
      const d1 = Math.sqrt(d2),
        b0 = (w1 * w1 - w0 * w0 + rho4 * d2) / (2 * w0 * rho2 * d1),
        b1 = (w1 * w1 - w0 * w0 - rho4 * d2) / (2 * w1 * rho2 * d1),
        r0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0),
        r1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1)
      S = (r1 - r0) / rho
      i = function (t) {
        const s = t * S,
          coshr0 = cosh(r0),
          u = (w0 / (rho2 * d1)) * (coshr0 * tanh(rho * s + r0) - sinh(r0))
        return [ux0 + u * dx, uy0 + u * dy, (w0 * coshr0) / cosh(rho * s + r0)]
      }
    }
    i.duration = (S * 1000 * rho) / Math.SQRT2
    return i
  }
  zoom.rho = function (_) {
    const _1 = Math.max(1e-3, +_),
      _2 = _1 * _1,
      _4 = _2 * _2
    return zoomRho(_1, _2, _4)
  }
  return zoom
})(Math.SQRT2, 2, 4)

const degrees = 180 / Math.PI
export const identity = {
  translateX: 0,
  translateY: 0,
  rotate: 0,
  skewX: 0,
  scaleX: 1,
  scaleY: 1,
}
export function decompose(a, b, c, d, e, f) {
  let scaleX, scaleY, skewX
  if ((scaleX = Math.sqrt(a * a + b * b))) (a /= scaleX), (b /= scaleX)
  if ((skewX = a * c + b * d)) (c -= a * skewX), (d -= b * skewX)
  if ((scaleY = Math.sqrt(c * c + d * d))) (c /= scaleY), (d /= scaleY), (skewX /= scaleY)
  if (a * d < b * c) (a = -a), (b = -b), (skewX = -skewX), (scaleX = -scaleX)
  return {
    translateX: e,
    translateY: f,
    rotate: Math.atan2(b, a) * degrees,
    skewX: Math.atan(skewX) * degrees,
    scaleX: scaleX,
    scaleY: scaleY,
  }
}
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

export function parseCss(x: string) {
  const m = new (typeof DOMMatrix === "function" ? DOMMatrix : WebKitCSSMatrix)(x + "")
  return m.isIdentity ? identity : decompose(m.a, m.b, m.c, m.d, m.e, m.f)
}
let svg: any = undefined
export function parseSvg(x: any) {
  if (x == null) return identity
  if (!svg) svg = document.createElementNS("http://www.w3.org/2000/svg", "g")
  svg.setAttribute("transform", x)
  if (!(x = svg.transform.baseVal.consolidate())) return identity
  x = x.matrix
  return decompose(x.a, x.b, x.c, x.d, x.e, x.f)
}
