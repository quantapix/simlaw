import { optional } from "../accessors.js"
import { shuffle } from "./array.js"
import array from "../array.js"
import constant, { constantZero } from "../constant.js"
import lcg from "../lcg.js"
import lcg from "../lcg.js"
import lcg from "../lcg.js"

export function enclose(circles) {
  return packEncloseRandom(circles, lcg())
}
export function packEncloseRandom(circles, random) {
  var i = 0,
    n = (circles = shuffle(Array.from(circles), random)).length,
    B = [],
    p,
    e
  while (i < n) {
    p = circles[i]
    if (e && enclosesWeak(e, p)) ++i
    else (e = encloseBasis((B = extendBasis(B, p)))), (i = 0)
  }
  return e
}
function extendBasis(B, p) {
  var i, j
  if (enclosesWeakAll(p, B)) return [p]
  for (i = 0; i < B.length; ++i) {
    if (enclosesNot(p, B[i]) && enclosesWeakAll(encloseBasis2(B[i], p), B)) {
      return [B[i], p]
    }
  }
  for (i = 0; i < B.length - 1; ++i) {
    for (j = i + 1; j < B.length; ++j) {
      if (
        enclosesNot(encloseBasis2(B[i], B[j]), p) &&
        enclosesNot(encloseBasis2(B[i], p), B[j]) &&
        enclosesNot(encloseBasis2(B[j], p), B[i]) &&
        enclosesWeakAll(encloseBasis3(B[i], B[j], p), B)
      ) {
        return [B[i], B[j], p]
      }
    }
  }
  throw new Error()
}
function enclosesNot(a, b) {
  var dr = a.r - b.r,
    dx = b.x - a.x,
    dy = b.y - a.y
  return dr < 0 || dr * dr < dx * dx + dy * dy
}
function enclosesWeak(a, b) {
  var dr = a.r - b.r + Math.max(a.r, b.r, 1) * 1e-9,
    dx = b.x - a.x,
    dy = b.y - a.y
  return dr > 0 && dr * dr > dx * dx + dy * dy
}
function enclosesWeakAll(a, B) {
  for (var i = 0; i < B.length; ++i) {
    if (!enclosesWeak(a, B[i])) {
      return false
    }
  }
  return true
}
function encloseBasis(B) {
  switch (B.length) {
    case 1:
      return encloseBasis1(B[0])
    case 2:
      return encloseBasis2(B[0], B[1])
    case 3:
      return encloseBasis3(B[0], B[1], B[2])
  }
}
function encloseBasis1(a) {
  return {
    x: a.x,
    y: a.y,
    r: a.r,
  }
}
function encloseBasis2(a, b) {
  var x1 = a.x,
    y1 = a.y,
    r1 = a.r,
    x2 = b.x,
    y2 = b.y,
    r2 = b.r,
    x21 = x2 - x1,
    y21 = y2 - y1,
    r21 = r2 - r1,
    l = Math.sqrt(x21 * x21 + y21 * y21)
  return {
    x: (x1 + x2 + (x21 / l) * r21) / 2,
    y: (y1 + y2 + (y21 / l) * r21) / 2,
    r: (l + r1 + r2) / 2,
  }
}
function encloseBasis3(a, b, c) {
  var x1 = a.x,
    y1 = a.y,
    r1 = a.r,
    x2 = b.x,
    y2 = b.y,
    r2 = b.r,
    x3 = c.x,
    y3 = c.y,
    r3 = c.r,
    a2 = x1 - x2,
    a3 = x1 - x3,
    b2 = y1 - y2,
    b3 = y1 - y3,
    c2 = r2 - r1,
    c3 = r3 - r1,
    d1 = x1 * x1 + y1 * y1 - r1 * r1,
    d2 = d1 - x2 * x2 - y2 * y2 + r2 * r2,
    d3 = d1 - x3 * x3 - y3 * y3 + r3 * r3,
    ab = a3 * b2 - a2 * b3,
    xa = (b2 * d3 - b3 * d2) / (ab * 2) - x1,
    xb = (b3 * c2 - b2 * c3) / ab,
    ya = (a3 * d2 - a2 * d3) / (ab * 2) - y1,
    yb = (a2 * c3 - a3 * c2) / ab,
    A = xb * xb + yb * yb - 1,
    B = 2 * (r1 + xa * xb + ya * yb),
    C = xa * xa + ya * ya - r1 * r1,
    r = -(Math.abs(A) > 1e-6 ? (B + Math.sqrt(B * B - 4 * A * C)) / (2 * A) : C / B)
  return {
    x: x1 + xa + xb * r,
    y: y1 + ya + yb * r,
    r: r,
  }
}
function defaultRadius(d) {
  return Math.sqrt(d.value)
}
export function pack() {
  var radius = null,
    dx = 1,
    dy = 1,
    padding = constantZero
  function pack(root) {
    const random = lcg()
    ;(root.x = dx / 2), (root.y = dy / 2)
    if (radius) {
      root
        .eachBefore(radiusLeaf(radius))
        .eachAfter(packChildrenRandom(padding, 0.5, random))
        .eachBefore(translateChild(1))
    } else {
      root
        .eachBefore(radiusLeaf(defaultRadius))
        .eachAfter(packChildrenRandom(constantZero, 1, random))
        .eachAfter(packChildrenRandom(padding, root.r / Math.min(dx, dy), random))
        .eachBefore(translateChild(Math.min(dx, dy) / (2 * root.r)))
    }
    return root
  }
  pack.radius = function (x) {
    return arguments.length ? ((radius = optional(x)), pack) : radius
  }
  pack.size = function (x) {
    return arguments.length ? ((dx = +x[0]), (dy = +x[1]), pack) : [dx, dy]
  }
  pack.padding = function (x) {
    return arguments.length ? ((padding = typeof x === "function" ? x : constant(+x)), pack) : padding
  }
  return pack
}
function radiusLeaf(radius) {
  return function (node) {
    if (!node.children) {
      node.r = Math.max(0, +radius(node) || 0)
    }
  }
}
function packChildrenRandom(padding, k, random) {
  return function (node) {
    if ((children = node.children)) {
      var children,
        i,
        n = children.length,
        r = padding(node) * k || 0,
        e
      if (r) for (i = 0; i < n; ++i) children[i].r += r
      e = packSiblingsRandom(children, random)
      if (r) for (i = 0; i < n; ++i) children[i].r -= r
      node.r = e + r
    }
  }
}
function translateChild(k) {
  return function (node) {
    var parent = node.parent
    node.r *= k
    if (parent) {
      node.x = parent.x + k * node.x
      node.y = parent.y + k * node.y
    }
  }
}
function place(b, a, c) {
  var dx = b.x - a.x,
    x,
    a2,
    dy = b.y - a.y,
    y,
    b2,
    d2 = dx * dx + dy * dy
  if (d2) {
    ;(a2 = a.r + c.r), (a2 *= a2)
    ;(b2 = b.r + c.r), (b2 *= b2)
    if (a2 > b2) {
      x = (d2 + b2 - a2) / (2 * d2)
      y = Math.sqrt(Math.max(0, b2 / d2 - x * x))
      c.x = b.x - x * dx - y * dy
      c.y = b.y - x * dy + y * dx
    } else {
      x = (d2 + a2 - b2) / (2 * d2)
      y = Math.sqrt(Math.max(0, a2 / d2 - x * x))
      c.x = a.x + x * dx - y * dy
      c.y = a.y + x * dy + y * dx
    }
  } else {
    c.x = a.x + c.r
    c.y = a.y
  }
}
function intersects(a, b) {
  var dr = a.r + b.r - 1e-6,
    dx = b.x - a.x,
    dy = b.y - a.y
  return dr > 0 && dr * dr > dx * dx + dy * dy
}
function score(node) {
  var a = node._,
    b = node.next._,
    ab = a.r + b.r,
    dx = (a.x * b.r + b.x * a.r) / ab,
    dy = (a.y * b.r + b.y * a.r) / ab
  return dx * dx + dy * dy
}
function Node(circle) {
  this._ = circle
  this.next = null
  this.previous = null
}
export function packSiblingsRandom(circles, random) {
  if (!(n = (circles = array(circles)).length)) return 0
  var a, b, c, n, aa, ca, i, j, k, sj, sk
  ;(a = circles[0]), (a.x = 0), (a.y = 0)
  if (!(n > 1)) return a.r
  ;(b = circles[1]), (a.x = -b.r), (b.x = a.r), (b.y = 0)
  if (!(n > 2)) return a.r + b.r
  place(b, a, (c = circles[2]))
  ;(a = new Node(a)), (b = new Node(b)), (c = new Node(c))
  a.next = c.previous = b
  b.next = a.previous = c
  c.next = b.previous = a
  pack: for (i = 3; i < n; ++i) {
    place(a._, b._, (c = circles[i])), (c = new Node(c))
    ;(j = b.next), (k = a.previous), (sj = b._.r), (sk = a._.r)
    do {
      if (sj <= sk) {
        if (intersects(j._, c._)) {
          ;(b = j), (a.next = b), (b.previous = a), --i
          continue pack
        }
        ;(sj += j._.r), (j = j.next)
      } else {
        if (intersects(k._, c._)) {
          ;(a = k), (a.next = b), (b.previous = a), --i
          continue pack
        }
        ;(sk += k._.r), (k = k.previous)
      }
    } while (j !== k.next)
    ;(c.previous = a), (c.next = b), (a.next = b.previous = b = c)
    aa = score(a)
    while ((c = c.next) !== b) {
      if ((ca = score(c)) < aa) {
        ;(a = c), (aa = ca)
      }
    }
    b = a.next
  }
  ;(a = [b._]), (c = b)
  while ((c = c.next) !== b) a.push(c._)
  c = packEncloseRandom(a, random)
  for (i = 0; i < n; ++i) (a = circles[i]), (a.x -= c.x), (a.y -= c.y)
  return c.r
}
export function siblings(circles) {
  packSiblingsRandom(circles, lcg())
  return circles
}
