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
  return b === null || t === "boolean"
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

export function piecewise(vs: qt.Zoom.View[]): qt.Zoom.Interpolator
export function piecewise(
  f: (a: qt.Zoom.View, b: qt.Zoom.View) => qt.Zoom.Interpolator,
  vs: qt.Zoom.View[]
): qt.Zoom.Interpolator
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

export const zoom: (a: qt.Zoom.View, b: qt.Zoom.View) => qt.Zoom.Interpolator = (function zoomRho(rho, rho2, rho4) {
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
  zoom.rho = function (x: any) {
    const _1 = qu.max(1e-3, +x),
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
  if (x === null) return identity
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
export function closed(vs: number[]): (x: number) => number {
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

function rgbSpline(f: Function) {
  return (xs: Array<string | qt.Color>) => {
    const n = xs.length,
      rs = new Array(n),
      gs = new Array(n),
      bs = new Array(n)
    for (let i = 0; i < n; ++i) {
      const c = qc.RGB.from(xs[i])
      rs[i] = c.r || 0
      gs[i] = c.g || 0
      bs[i] = c.b || 0
    }
    const r = f(rs),
      g = f(gs),
      b = f(bs)
    return (x: number) => qc.RGB.from(r(x), g(x), b(x), 1) + ""
  }
}

export const rgbBasis: (xs: Array<string | qt.Color>) => (x: number) => string = rgbSpline(basis)
export const rgbClosed: (xs: Array<string | qt.Color>) => (x: number) => string = rgbSpline(closed)

export function ramp(x: any) {
  return rgbBasis(x[x.length - 1])
}

function ramp2(xs: any[]) {
  const n = xs.length
  return (x: number) => xs[qu.max(0, qu.min(n - 1, qu.floor(x * n)))]
}

export function rampClosed(xs: any) {
  const y = scaleSequential(rgbClosed(qc.colors(xs))).clamp(true)
  delete y.clamp
  return y
}

export namespace scheme {
  export const BrBG = ramp(qc.scheme.BrBG)
  export const PRGn = ramp(qc.scheme.PRGn)
  export const PiYG = ramp(qc.scheme.PiYG)
  export const PuOr = ramp(qc.scheme.PuOr)
  export const RdBu = ramp(qc.scheme.RdBu)
  export const RdGy = ramp(qc.scheme.RdGy)
  export const RdYlBu = ramp(qc.scheme.RdYlBu)
  export const RdYlGn = ramp(qc.scheme.RdYlGn)
  export const Spectral = ramp(qc.scheme.Spectral)
  export const BuGn = ramp(qc.scheme.BuGn)
  export const BuPu = ramp(qc.scheme.BuPu)
  export const GnBu = ramp(qc.scheme.GnBu)
  export const OrRd = ramp(qc.scheme.OrRd)
  export const PuBuGn = ramp(qc.scheme.PuBuGn)
  export const PuBu = ramp(qc.scheme.PuBu)
  export const PuRd = ramp(qc.scheme.PuRd)
  export const RdPu = ramp(qc.scheme.RdPu)
  export const YlGnBu = ramp(qc.scheme.YlGnBu)
  export const YlGn = ramp(qc.scheme.YlGn)
  export const YlOrBr = ramp(qc.scheme.YlOrBr)
  export const YlOrRd = ramp(qc.scheme.YlOrRd)
  export const Blues = ramp(qc.scheme.Blues)
  export const Greens = ramp(qc.scheme.Greens)
  export const Greys = ramp(qc.scheme.Greys)
  export const Purples = ramp(qc.scheme.Purples)
  export const Reds = ramp(qc.scheme.Reds)
  export const Oranges = ramp(qc.scheme.Oranges)

  export const Viridis = ramp2(
    qc.colors(
      "44015444025645045745055946075a46085c460a5d460b5e470d60470e6147106347116447136548146748166848176948186a481a6c481b6d481c6e481d6f481f70482071482173482374482475482576482677482878482979472a7a472c7a472d7b472e7c472f7d46307e46327e46337f463480453581453781453882443983443a83443b84433d84433e85423f854240864241864142874144874045884046883f47883f48893e49893e4a893e4c8a3d4d8a3d4e8a3c4f8a3c508b3b518b3b528b3a538b3a548c39558c39568c38588c38598c375a8c375b8d365c8d365d8d355e8d355f8d34608d34618d33628d33638d32648e32658e31668e31678e31688e30698e306a8e2f6b8e2f6c8e2e6d8e2e6e8e2e6f8e2d708e2d718e2c718e2c728e2c738e2b748e2b758e2a768e2a778e2a788e29798e297a8e297b8e287c8e287d8e277e8e277f8e27808e26818e26828e26828e25838e25848e25858e24868e24878e23888e23898e238a8d228b8d228c8d228d8d218e8d218f8d21908d21918c20928c20928c20938c1f948c1f958b1f968b1f978b1f988b1f998a1f9a8a1e9b8a1e9c891e9d891f9e891f9f881fa0881fa1881fa1871fa28720a38620a48621a58521a68522a78522a88423a98324aa8325ab8225ac8226ad8127ad8128ae8029af7f2ab07f2cb17e2db27d2eb37c2fb47c31b57b32b67a34b67935b77937b87838b9773aba763bbb753dbc743fbc7340bd7242be7144bf7046c06f48c16e4ac16d4cc26c4ec36b50c46a52c56954c56856c66758c7655ac8645cc8635ec96260ca6063cb5f65cb5e67cc5c69cd5b6ccd5a6ece5870cf5773d05675d05477d1537ad1517cd2507fd34e81d34d84d44b86d54989d5488bd6468ed64590d74393d74195d84098d83e9bd93c9dd93ba0da39a2da37a5db36a8db34aadc32addc30b0dd2fb2dd2db5de2bb8de29bade28bddf26c0df25c2df23c5e021c8e020cae11fcde11dd0e11cd2e21bd5e21ad8e219dae319dde318dfe318e2e418e5e419e7e419eae51aece51befe51cf1e51df4e61ef6e620f8e621fbe723fde725"
    )
  )
  export const Magma = ramp2(
    qc.colors(
      "00000401000501010601010802010902020b02020d03030f03031204041405041606051806051a07061c08071e0907200a08220b09240c09260d0a290e0b2b100b2d110c2f120d31130d34140e36150e38160f3b180f3d19103f1a10421c10441d11471e114920114b21114e22115024125325125527125829115a2a115c2c115f2d11612f116331116533106734106936106b38106c390f6e3b0f703d0f713f0f72400f74420f75440f764510774710784910784a10794c117a4e117b4f127b51127c52137c54137d56147d57157e59157e5a167e5c167f5d177f5f187f601880621980641a80651a80671b80681c816a1c816b1d816d1d816e1e81701f81721f817320817521817621817822817922827b23827c23827e24828025828125818326818426818627818827818928818b29818c29818e2a81902a81912b81932b80942c80962c80982d80992d809b2e7f9c2e7f9e2f7fa02f7fa1307ea3307ea5317ea6317da8327daa337dab337cad347cae347bb0357bb2357bb3367ab5367ab73779b83779ba3878bc3978bd3977bf3a77c03a76c23b75c43c75c53c74c73d73c83e73ca3e72cc3f71cd4071cf4070d0416fd2426fd3436ed5446dd6456cd8456cd9466bdb476adc4869de4968df4a68e04c67e24d66e34e65e44f64e55064e75263e85362e95462ea5661eb5760ec5860ed5a5fee5b5eef5d5ef05f5ef1605df2625df2645cf3655cf4675cf4695cf56b5cf66c5cf66e5cf7705cf7725cf8745cf8765cf9785df9795df97b5dfa7d5efa7f5efa815ffb835ffb8560fb8761fc8961fc8a62fc8c63fc8e64fc9065fd9266fd9467fd9668fd9869fd9a6afd9b6bfe9d6cfe9f6dfea16efea36ffea571fea772fea973feaa74feac76feae77feb078feb27afeb47bfeb67cfeb77efeb97ffebb81febd82febf84fec185fec287fec488fec68afec88cfeca8dfecc8ffecd90fecf92fed194fed395fed597fed799fed89afdda9cfddc9efddea0fde0a1fde2a3fde3a5fde5a7fde7a9fde9aafdebacfcecaefceeb0fcf0b2fcf2b4fcf4b6fcf6b8fcf7b9fcf9bbfcfbbdfcfdbf"
    )
  )
  export const Inferno = ramp2(
    qc.colors(
      "00000401000501010601010802010a02020c02020e03021004031204031405041706041907051b08051d09061f0a07220b07240c08260d08290e092b10092d110a30120a32140b34150b37160b39180c3c190c3e1b0c411c0c431e0c451f0c48210c4a230c4c240c4f260c51280b53290b552b0b572d0b592f0a5b310a5c320a5e340a5f3609613809623909633b09643d09653e0966400a67420a68440a68450a69470b6a490b6a4a0c6b4c0c6b4d0d6c4f0d6c510e6c520e6d540f6d550f6d57106e59106e5a116e5c126e5d126e5f136e61136e62146e64156e65156e67166e69166e6a176e6c186e6d186e6f196e71196e721a6e741a6e751b6e771c6d781c6d7a1d6d7c1d6d7d1e6d7f1e6c801f6c82206c84206b85216b87216b88226a8a226a8c23698d23698f24699025689225689326679526679727669827669a28659b29649d29649f2a63a02a63a22b62a32c61a52c60a62d60a82e5fa92e5eab2f5ead305dae305cb0315bb1325ab3325ab43359b63458b73557b93556ba3655bc3754bd3853bf3952c03a51c13a50c33b4fc43c4ec63d4dc73e4cc83f4bca404acb4149cc4248ce4347cf4446d04545d24644d34743d44842d54a41d74b3fd84c3ed94d3dda4e3cdb503bdd513ade5238df5337e05536e15635e25734e35933e45a31e55c30e65d2fe75e2ee8602de9612bea632aeb6429eb6628ec6726ed6925ee6a24ef6c23ef6e21f06f20f1711ff1731df2741cf3761bf37819f47918f57b17f57d15f67e14f68013f78212f78410f8850ff8870ef8890cf98b0bf98c0af98e09fa9008fa9207fa9407fb9606fb9706fb9906fb9b06fb9d07fc9f07fca108fca309fca50afca60cfca80dfcaa0ffcac11fcae12fcb014fcb216fcb418fbb61afbb81dfbba1ffbbc21fbbe23fac026fac228fac42afac62df9c72ff9c932f9cb35f8cd37f8cf3af7d13df7d340f6d543f6d746f5d949f5db4cf4dd4ff4df53f4e156f3e35af3e55df2e661f2e865f2ea69f1ec6df1ed71f1ef75f1f179f2f27df2f482f3f586f3f68af4f88ef5f992f6fa96f8fb9af9fc9dfafda1fcffa4"
    )
  )
  export const Plasma = ramp2(
    qc.colors(
      "0d088710078813078916078a19068c1b068d1d068e20068f2206902406912605912805922a05932c05942e05952f059631059733059735049837049938049a3a049a3c049b3e049c3f049c41049d43039e44039e46039f48039f4903a04b03a14c02a14e02a25002a25102a35302a35502a45601a45801a45901a55b01a55c01a65e01a66001a66100a76300a76400a76600a76700a86900a86a00a86c00a86e00a86f00a87100a87201a87401a87501a87701a87801a87a02a87b02a87d03a87e03a88004a88104a78305a78405a78606a68707a68808a68a09a58b0aa58d0ba58e0ca48f0da4910ea3920fa39410a29511a19613a19814a099159f9a169f9c179e9d189d9e199da01a9ca11b9ba21d9aa31e9aa51f99a62098a72197a82296aa2395ab2494ac2694ad2793ae2892b02991b12a90b22b8fb32c8eb42e8db52f8cb6308bb7318ab83289ba3388bb3488bc3587bd3786be3885bf3984c03a83c13b82c23c81c33d80c43e7fc5407ec6417dc7427cc8437bc9447aca457acb4679cc4778cc4977cd4a76ce4b75cf4c74d04d73d14e72d24f71d35171d45270d5536fd5546ed6556dd7566cd8576bd9586ada5a6ada5b69db5c68dc5d67dd5e66de5f65de6164df6263e06363e16462e26561e26660e3685fe4695ee56a5de56b5de66c5ce76e5be76f5ae87059e97158e97257ea7457eb7556eb7655ec7754ed7953ed7a52ee7b51ef7c51ef7e50f07f4ff0804ef1814df1834cf2844bf3854bf3874af48849f48948f58b47f58c46f68d45f68f44f79044f79143f79342f89441f89540f9973ff9983ef99a3efa9b3dfa9c3cfa9e3bfb9f3afba139fba238fca338fca537fca636fca835fca934fdab33fdac33fdae32fdaf31fdb130fdb22ffdb42ffdb52efeb72dfeb82cfeba2cfebb2bfebd2afebe2afec029fdc229fdc328fdc527fdc627fdc827fdca26fdcb26fccd25fcce25fcd025fcd225fbd324fbd524fbd724fad824fada24f9dc24f9dd25f8df25f8e125f7e225f7e425f6e626f6e826f5e926f5eb27f4ed27f3ee27f3f027f2f227f1f426f1f525f0f724f0f921"
    )
  )

  export const CubehelixDefault = cubehelixLong(qc.Cubehelix.from(300, 0.5, 0.0), qc.Cubehelix.from(-240, 0.5, 1.0))
  export const Warm = cubehelixLong(qc.Cubehelix.from(-100, 0.75, 0.35), qc.Cubehelix.from(80, 1.5, 0.8))
  export const Cool = cubehelixLong(qc.Cubehelix.from(260, 0.75, 0.35), qc.Cubehelix.from(80, 1.5, 0.8))

  export function Cividis(x: number) {
    x = qu.max(0, qu.min(1, x))
    return (
      "rgb(" +
      qu.max(
        0,
        qu.min(255, qu.round(-4.54 - x * (35.34 - x * (2381.73 - x * (6402.7 - x * (7024.72 - x * 2710.57))))))
      ) +
      ", " +
      qu.max(0, qu.min(255, qu.round(32.49 + x * (170.73 + x * (52.82 - x * (131.46 - x * (176.58 - x * 67.37))))))) +
      ", " +
      qu.max(
        0,
        qu.min(255, qu.round(81.24 + x * (442.36 - x * (2482.43 - x * (6167.24 - x * (6614.94 - x * 2475.67))))))
      ) +
      ")"
    )
  }

  const c = new qc.Cubehelix()
  export function Rainbow(x: number) {
    if (x < 0 || x > 1) x -= qu.floor(x)
    const y = qu.abs(x - 0.5)
    c.h = 360 * x - 100
    c.s = 1.5 - 1.5 * y
    c.l = 0.8 - 0.9 * y
    return c + ""
  }

  const c2 = new qc.RGB()
  const pi_1_3 = qu.PI / 3
  const pi_2_3 = (qu.PI * 2) / 3
  export function Sinebow(x: number) {
    let y
    x = (0.5 - x) * qu.PI
    c2.r = 255 * (y = qu.sin(x)) * y
    c2.g = 255 * (y = qu.sin(x + pi_1_3)) * y
    c2.b = 255 * (y = qu.sin(x + pi_2_3)) * y
    return c + ""
  }

  export function Turbo(x: number) {
    x = qu.max(0, qu.min(1, x))
    return (
      "rgb(" +
      qu.max(
        0,
        qu.min(255, qu.round(34.61 + x * (1172.33 - x * (10793.56 - x * (33300.12 - x * (38394.49 - x * 14825.05))))))
      ) +
      ", " +
      qu.max(
        0,
        qu.min(255, qu.round(23.31 + x * (557.33 + x * (1225.33 - x * (3574.96 - x * (1073.77 + x * 707.56))))))
      ) +
      ", " +
      qu.max(
        0,
        qu.min(255, qu.round(27.2 + x * (3211.1 - x * (15327.97 - x * (27814 - x * (22569.18 - x * 6838.66))))))
      ) +
      ")"
    )
  }
}
