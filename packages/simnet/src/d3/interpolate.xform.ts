var degrees = 180 / Math.PI

export var identity = {
  translateX: 0,
  translateY: 0,
  rotate: 0,
  skewX: 0,
  scaleX: 1,
  scaleY: 1,
}

export default function (a, b, c, d, e, f) {
  var scaleX, scaleY, skewX
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
import number from "../number.js"
import { parseCss, parseSvg } from "./parse.js"

function interpolateTransform(parse, pxComma, pxParen, degParen) {
  function pop(s) {
    return s.length ? s.pop() + " " : ""
  }

  function translate(xa, ya, xb, yb, s, q) {
    if (xa !== xb || ya !== yb) {
      var i = s.push("translate(", null, pxComma, null, pxParen)
      q.push({ i: i - 4, x: number(xa, xb) }, { i: i - 2, x: number(ya, yb) })
    } else if (xb || yb) {
      s.push("translate(" + xb + pxComma + yb + pxParen)
    }
  }

  function rotate(a, b, s, q) {
    if (a !== b) {
      if (a - b > 180) b += 360
      else if (b - a > 180) a += 360 // shortest path
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
      var i = s.push(pop(s) + "scale(", null, ",", null, ")")
      q.push({ i: i - 4, x: number(xa, xb) }, { i: i - 2, x: number(ya, yb) })
    } else if (xb !== 1 || yb !== 1) {
      s.push(pop(s) + "scale(" + xb + "," + yb + ")")
    }
  }

  return function (a, b) {
    var s = [], // string constants and placeholders
      q = [] // number interpolators
    ;(a = parse(a)), (b = parse(b))
    translate(a.translateX, a.translateY, b.translateX, b.translateY, s, q)
    rotate(a.rotate, b.rotate, s, q)
    skewX(a.skewX, b.skewX, s, q)
    scale(a.scaleX, a.scaleY, b.scaleX, b.scaleY, s, q)
    a = b = null // gc
    return function (t) {
      var i = -1,
        n = q.length,
        o
      while (++i < n) s[(o = q[i]).i] = o.x(t)
      return s.join("")
    }
  }
}

export var interpolateTransformCss = interpolateTransform(parseCss, "px, ", "px)", "deg)")
export var interpolateTransformSvg = interpolateTransform(parseSvg, ", ", ")", ")")
import decompose, { identity } from "./decompose.js"

var svgNode

/* eslint-disable no-undef */
export function parseCss(value) {
  const m = new (typeof DOMMatrix === "function" ? DOMMatrix : WebKitCSSMatrix)(value + "")
  return m.isIdentity ? identity : decompose(m.a, m.b, m.c, m.d, m.e, m.f)
}

export function parseSvg(value) {
  if (value == null) return identity
  if (!svgNode) svgNode = document.createElementNS("http://www.w3.org/2000/svg", "g")
  svgNode.setAttribute("transform", value)
  if (!(value = svgNode.transform.baseVal.consolidate())) return identity
  value = value.matrix
  return decompose(value.a, value.b, value.c, value.d, value.e, value.f)
}
