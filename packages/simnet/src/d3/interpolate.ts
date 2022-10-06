import value from "./value.js"
import numberArray, { isNumberArray } from "./numberArray.js"

export function (a, b) {
  return (isNumberArray(b) ? numberArray : genericArray)(a, b)
}

export function genericArray(a, b) {
  var nb = b ? b.length : 0,
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
export function basis(t1, v0, v1, v2, v3) {
  var t2 = t1 * t1,
    t3 = t2 * t1
  return (
    ((1 - 3 * t1 + 3 * t2 - t3) * v0 + (4 - 6 * t2 + 3 * t3) * v1 + (1 + 3 * t1 + 3 * t2 - 3 * t3) * v2 + t3 * v3) / 6
  )
}

export function (values) {
  var n = values.length - 1
  return function (t) {
    var i = t <= 0 ? (t = 0) : t >= 1 ? ((t = 1), n - 1) : Math.floor(t * n),
      v1 = values[i],
      v2 = values[i + 1],
      v0 = i > 0 ? values[i - 1] : 2 * v1 - v2,
      v3 = i < n - 1 ? values[i + 2] : 2 * v2 - v1
    return basis((t - i / n) * n, v0, v1, v2, v3)
  }
}
import { basis } from "./basis.js"

export function (values) {
  var n = values.length
  return function (t) {
    var i = Math.floor(((t %= 1) < 0 ? ++t : t) * n),
      v0 = values[(i + n - 1) % n],
      v1 = values[i % n],
      v2 = values[(i + 1) % n],
      v3 = values[(i + 2) % n]
    return basis((t - i / n) * n, v0, v1, v2, v3)
  }
}
import constant from "./constant.js"

function linear(a, d) {
  return function (t) {
    return a + t * d
  }
}

function exponential(a, b, y) {
  return (
    (a = Math.pow(a, y)),
    (b = Math.pow(b, y) - a),
    (y = 1 / y),
    function (t) {
      return Math.pow(a + t * b, y)
    }
  )
}

export function hue(a, b) {
  var d = b - a
  return d ? linear(a, d > 180 || d < -180 ? d - 360 * Math.round(d / 360) : d) : constant(isNaN(a) ? b : a)
}

export function gamma(y) {
  return (y = +y) === 1
    ? nogamma
    : function (a, b) {
        return b - a ? exponential(a, b, y) : constant(isNaN(a) ? b : a)
      }
}

export function nogamma(a, b) {
  var d = b - a
  return d ? linear(a, d) : constant(isNaN(a) ? b : a)
}
export default x => () => x
import { cubehelix as colorCubehelix } from "d3-color"
import color, { hue } from "./color.js"

function cubehelix(hue) {
  return (function cubehelixGamma(y) {
    y = +y

    function cubehelix(start, end) {
      var h = hue((start = colorCubehelix(start)).h, (end = colorCubehelix(end)).h),
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

export default cubehelix(hue)
export var cubehelixLong = cubehelix(color)
export function (a, b) {
  var d = new Date()
  return (
    (a = +a),
    (b = +b),
    function (t) {
      return d.setTime(a * (1 - t) + b * t), d
    }
  )
}
export function (range) {
  var n = range.length
  return function (t) {
    return range[Math.max(0, Math.min(n - 1, Math.floor(t * n)))]
  }
}
import { hcl as colorHcl } from "d3-color"
import color, { hue } from "./color.js"

function hcl(hue) {
  return function (start, end) {
    var h = hue((start = colorHcl(start)).h, (end = colorHcl(end)).h),
      c = color(start.c, end.c),
      l = color(start.l, end.l),
      opacity = color(start.opacity, end.opacity)
    return function (t) {
      start.h = h(t)
      start.c = c(t)
      start.l = l(t)
      start.opacity = opacity(t)
      return start + ""
    }
  }
}

export default hcl(hue)
export var hclLong = hcl(color)
import { hsl as colorHsl } from "d3-color"
import color, { hue } from "./color.js"

function hsl(hue) {
  return function (start, end) {
    var h = hue((start = colorHsl(start)).h, (end = colorHsl(end)).h),
      s = color(start.s, end.s),
      l = color(start.l, end.l),
      opacity = color(start.opacity, end.opacity)
    return function (t) {
      start.h = h(t)
      start.s = s(t)
      start.l = l(t)
      start.opacity = opacity(t)
      return start + ""
    }
  }
}

export default hsl(hue)
export var hslLong = hsl(color)
import { hue } from "./color.js"

export function (a, b) {
  var i = hue(+a, +b)
  return function (t) {
    var x = i(t)
    return x - 360 * Math.floor(x / 360)
  }
}
export { default as interpolate } from "./value.js"
export { default as interpolateArray } from "./array.js"
export { default as interpolateBasis } from "./basis.js"
export { default as interpolateBasisClosed } from "./basisClosed.js"
export { default as interpolateDate } from "./date.js"
export { default as interpolateDiscrete } from "./discrete.js"
export { default as interpolateHue } from "./hue.js"
export { default as interpolateNumber } from "./number.js"
export { default as interpolateNumberArray } from "./numberArray.js"
export { default as interpolateObject } from "./object.js"
export { default as interpolateRound } from "./round.js"
export { default as interpolateString } from "./string.js"
export { interpolateTransformCss, interpolateTransformSvg } from "./transform/index.js"
export { default as interpolateZoom } from "./zoom.js"
export {
  default as interpolateRgb,
  rgbBasis as interpolateRgbBasis,
  rgbBasisClosed as interpolateRgbBasisClosed,
} from "./rgb.js"
export { default as interpolateHsl, hslLong as interpolateHslLong } from "./hsl.js"
export { default as interpolateLab } from "./lab.js"
export { default as interpolateHcl, hclLong as interpolateHclLong } from "./hcl.js"
export { default as interpolateCubehelix, cubehelixLong as interpolateCubehelixLong } from "./cubehelix.js"
export { default as piecewise } from "./piecewise.js"
export { default as quantize } from "./quantize.js"
import { lab as colorLab } from "d3-color"
import color from "./color.js"

export function lab(start, end) {
  var l = color((start = colorLab(start)).l, (end = colorLab(end)).l),
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
export function (a, b) {
  return (
    (a = +a),
    (b = +b),
    function (t) {
      return a * (1 - t) + b * t
    }
  )
}
export function (a, b) {
  if (!b) b = []
  var n = a ? Math.min(b.length, a.length) : 0,
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
import value from "./value.js"

export function (a, b) {
  var i = {},
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
import { default as value } from "./value.js"

export function piecewise(interpolate, values) {
  if (values === undefined) (values = interpolate), (interpolate = value)
  var i = 0,
    n = values.length - 1,
    v = values[0],
    I = new Array(n < 0 ? 0 : n)
  while (i < n) I[i] = interpolate(v, (v = values[++i]))
  return function (t) {
    var i = Math.max(0, Math.min(n - 1, Math.floor((t *= n))))
    return I[i](t - i)
  }
}
export function (interpolator, n) {
  var samples = new Array(n)
  for (var i = 0; i < n; ++i) samples[i] = interpolator(i / (n - 1))
  return samples
}
import { rgb as colorRgb } from "d3-color"
import basis from "./basis.js"
import basisClosed from "./basisClosed.js"
import nogamma, { gamma } from "./color.js"

export default (function rgbGamma(y) {
  var color = gamma(y)

  function rgb(start, end) {
    var r = color((start = colorRgb(start)).r, (end = colorRgb(end)).r),
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
    var n = colors.length,
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

export var rgbBasis = rgbSpline(basis)
export var rgbBasisClosed = rgbSpline(basisClosed)
export function (a, b) {
  return (
    (a = +a),
    (b = +b),
    function (t) {
      return Math.round(a * (1 - t) + b * t)
    }
  )
}
import number from "./number.js"

var reA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g,
  reB = new RegExp(reA.source, "g")

function zero(b) {
  return function () {
    return b
  }
}

function one(b) {
  return function (t) {
    return b(t) + ""
  }
}

export function (a, b) {
  var bi = (reA.lastIndex = reB.lastIndex = 0), // scan index for next number in b
    am, // current match in a
    bm, // current match in b
    bs, // string preceding current number in b, if any
    i = -1, // index in s
    s = [], // string constants and placeholders
    q = [] // number interpolators

  ;(a = a + ""), (b = b + "")

  while ((am = reA.exec(a)) && (bm = reB.exec(b))) {
    if ((bs = bm.index) > bi) {
      bs = b.slice(bi, bs)
      if (s[i]) s[i] += bs // coalesce with previous string
      else s[++i] = bs
    }
    if ((am = am[0]) === (bm = bm[0])) {
      if (s[i]) s[i] += bm // coalesce with previous string
      else s[++i] = bm
    } else {
      s[++i] = null
      q.push({ i: i, x: number(am, bm) })
    }
    bi = reB.lastIndex
  }

  if (bi < b.length) {
    bs = b.slice(bi)
    if (s[i]) s[i] += bs // coalesce with previous string
    else s[++i] = bs
  }

  return s.length < 2
    ? q[0]
      ? one(q[0].x)
      : zero(b)
    : ((b = q.length),
      function (t) {
        for (var i = 0, o; i < b; ++i) s[(o = q[i]).i] = o.x(t)
        return s.join("")
      })
}
import { color } from "d3-color"
import rgb from "./rgb.js"
import { genericArray } from "./array.js"
import date from "./date.js"
import number from "./number.js"
import object from "./object.js"
import string from "./string.js"
import constant from "./constant.js"
import numberArray, { isNumberArray } from "./numberArray.js"

export function (a, b) {
  var t = typeof b,
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
var epsilon2 = 1e-12

function cosh(x) {
  return ((x = Math.exp(x)) + 1 / x) / 2
}

function sinh(x) {
  return ((x = Math.exp(x)) - 1 / x) / 2
}

function tanh(x) {
  return ((x = Math.exp(2 * x)) - 1) / (x + 1)
}

export default (function zoomRho(rho, rho2, rho4) {
  function zoom(p0, p1) {
    var ux0 = p0[0],
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
      var d1 = Math.sqrt(d2),
        b0 = (w1 * w1 - w0 * w0 + rho4 * d2) / (2 * w0 * rho2 * d1),
        b1 = (w1 * w1 - w0 * w0 - rho4 * d2) / (2 * w1 * rho2 * d1),
        r0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0),
        r1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1)
      S = (r1 - r0) / rho
      i = function (t) {
        var s = t * S,
          coshr0 = cosh(r0),
          u = (w0 / (rho2 * d1)) * (coshr0 * tanh(rho * s + r0) - sinh(r0))
        return [ux0 + u * dx, uy0 + u * dy, (w0 * coshr0) / cosh(rho * s + r0)]
      }
    }

    i.duration = (S * 1000 * rho) / Math.SQRT2

    return i
  }

  zoom.rho = function (_) {
    var _1 = Math.max(1e-3, +_),
      _2 = _1 * _1,
      _4 = _2 * _2
    return zoomRho(_1, _2, _4)
  }

  return zoom
})(Math.SQRT2, 2, 4)
