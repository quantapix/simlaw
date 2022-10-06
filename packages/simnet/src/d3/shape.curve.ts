export function point(that, x, y) {
  that._context.bezierCurveTo(
    (2 * that._x0 + that._x1) / 3,
    (2 * that._y0 + that._y1) / 3,
    (that._x0 + 2 * that._x1) / 3,
    (that._y0 + 2 * that._y1) / 3,
    (that._x0 + 4 * that._x1 + x) / 6,
    (that._y0 + 4 * that._y1 + y) / 6
  )
}
export function Basis(context) {
  this._context = context
}
Basis.prototype = {
  areaStart: function () {
    this._line = 0
  },
  areaEnd: function () {
    this._line = NaN
  },
  lineStart: function () {
    this._x0 = this._x1 = this._y0 = this._y1 = NaN
    this._point = 0
  },
  lineEnd: function () {
    switch (this._point) {
      case 3:
        point(this, this._x1, this._y1) // falls through
      case 2:
        this._context.lineTo(this._x1, this._y1)
        break
    }
    if (this._line || (this._line !== 0 && this._point === 1)) this._context.closePath()
    this._line = 1 - this._line
  },
  point: function (x, y) {
    ;(x = +x), (y = +y)
    switch (this._point) {
      case 0:
        this._point = 1
        this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y)
        break
      case 1:
        this._point = 2
        break
      case 2:
        this._point = 3
        this._context.lineTo((5 * this._x0 + this._x1) / 6, (5 * this._y0 + this._y1) / 6) // falls through
      default:
        point(this, x, y)
        break
    }
    ;(this._x0 = this._x1), (this._x1 = x)
    ;(this._y0 = this._y1), (this._y1 = y)
  },
}
export function (context) {
  return new Basis(context)
}
import noop from "../noop.js"
import { point } from "./basis.js"
function BasisClosed(context) {
  this._context = context
}
BasisClosed.prototype = {
  areaStart: noop,
  areaEnd: noop,
  lineStart: function () {
    this._x0 = this._x1 = this._x2 = this._x3 = this._x4 = this._y0 = this._y1 = this._y2 = this._y3 = this._y4 = NaN
    this._point = 0
  },
  lineEnd: function () {
    switch (this._point) {
      case 1: {
        this._context.moveTo(this._x2, this._y2)
        this._context.closePath()
        break
      }
      case 2: {
        this._context.moveTo((this._x2 + 2 * this._x3) / 3, (this._y2 + 2 * this._y3) / 3)
        this._context.lineTo((this._x3 + 2 * this._x2) / 3, (this._y3 + 2 * this._y2) / 3)
        this._context.closePath()
        break
      }
      case 3: {
        this.point(this._x2, this._y2)
        this.point(this._x3, this._y3)
        this.point(this._x4, this._y4)
        break
      }
    }
  },
  point: function (x, y) {
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
        this._context.moveTo((this._x0 + 4 * this._x1 + x) / 6, (this._y0 + 4 * this._y1 + y) / 6)
        break
      default:
        point(this, x, y)
        break
    }
    ;(this._x0 = this._x1), (this._x1 = x)
    ;(this._y0 = this._y1), (this._y1 = y)
  },
}
export function (context) {
  return new BasisClosed(context)
}
import { point } from "./basis.js"
function BasisOpen(context) {
  this._context = context
}
BasisOpen.prototype = {
  areaStart: function () {
    this._line = 0
  },
  areaEnd: function () {
    this._line = NaN
  },
  lineStart: function () {
    this._x0 = this._x1 = this._y0 = this._y1 = NaN
    this._point = 0
  },
  lineEnd: function () {
    if (this._line || (this._line !== 0 && this._point === 3)) this._context.closePath()
    this._line = 1 - this._line
  },
  point: function (x, y) {
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
        this._line ? this._context.lineTo(x0, y0) : this._context.moveTo(x0, y0)
        break
      case 3:
        this._point = 4 // falls through
      default:
        point(this, x, y)
        break
    }
    ;(this._x0 = this._x1), (this._x1 = x)
    ;(this._y0 = this._y1), (this._y1 = y)
  },
}
export function (context) {
  return new BasisOpen(context)
}
import pointRadial from "../pointRadial.js"
class Bump {
  constructor(context, x) {
    this._context = context
    this._x = x
  }
  areaStart() {
    this._line = 0
  }
  areaEnd() {
    this._line = NaN
  }
  lineStart() {
    this._point = 0
  }
  lineEnd() {
    if (this._line || (this._line !== 0 && this._point === 1)) this._context.closePath()
    this._line = 1 - this._line
  }
  point(x, y) {
    ;(x = +x), (y = +y)
    switch (this._point) {
      case 0: {
        this._point = 1
        if (this._line) this._context.lineTo(x, y)
        else this._context.moveTo(x, y)
        break
      }
      case 1:
        this._point = 2 // falls through
      default: {
        if (this._x) this._context.bezierCurveTo((this._x0 = (this._x0 + x) / 2), this._y0, this._x0, y, x, y)
        else this._context.bezierCurveTo(this._x0, (this._y0 = (this._y0 + y) / 2), x, this._y0, x, y)
        break
      }
    }
    ;(this._x0 = x), (this._y0 = y)
  }
}
class BumpRadial {
  constructor(context) {
    this._context = context
  }
  lineStart() {
    this._point = 0
  }
  lineEnd() {}
  point(x, y) {
    ;(x = +x), (y = +y)
    if (this._point++ === 0) {
      ;(this._x0 = x), (this._y0 = y)
    } else {
      const p0 = pointRadial(this._x0, this._y0)
      const p1 = pointRadial(this._x0, (this._y0 = (this._y0 + y) / 2))
      const p2 = pointRadial(x, this._y0)
      const p3 = pointRadial(x, y)
      this._context.moveTo(...p0)
      this._context.bezierCurveTo(...p1, ...p2, ...p3)
    }
  }
}
export function bumpX(context) {
  return new Bump(context, true)
}
export function bumpY(context) {
  return new Bump(context, false)
}
export function bumpRadial(context) {
  return new BumpRadial(context)
}
import { Basis } from "./basis.js"
function Bundle(context, beta) {
  this._basis = new Basis(context)
  this._beta = beta
}
Bundle.prototype = {
  lineStart: function () {
    this._x = []
    this._y = []
    this._basis.lineStart()
  },
  lineEnd: function () {
    var x = this._x,
      y = this._y,
      j = x.length - 1
    if (j > 0) {
      var x0 = x[0],
        y0 = y[0],
        dx = x[j] - x0,
        dy = y[j] - y0,
        i = -1,
        t
      while (++i <= j) {
        t = i / j
        this._basis.point(
          this._beta * x[i] + (1 - this._beta) * (x0 + t * dx),
          this._beta * y[i] + (1 - this._beta) * (y0 + t * dy)
        )
      }
    }
    this._x = this._y = null
    this._basis.lineEnd()
  },
  point: function (x, y) {
    this._x.push(+x)
    this._y.push(+y)
  },
}
export default (function custom(beta) {
  function bundle(context) {
    return beta === 1 ? new Basis(context) : new Bundle(context, beta)
  }
  bundle.beta = function (beta) {
    return custom(+beta)
  }
  return bundle
})(0.85)
export function point(that, x, y) {
  that._context.bezierCurveTo(
    that._x1 + that._k * (that._x2 - that._x0),
    that._y1 + that._k * (that._y2 - that._y0),
    that._x2 + that._k * (that._x1 - x),
    that._y2 + that._k * (that._y1 - y),
    that._x2,
    that._y2
  )
}
export function Cardinal(context, tension) {
  this._context = context
  this._k = (1 - tension) / 6
}
Cardinal.prototype = {
  areaStart: function () {
    this._line = 0
  },
  areaEnd: function () {
    this._line = NaN
  },
  lineStart: function () {
    this._x0 = this._x1 = this._x2 = this._y0 = this._y1 = this._y2 = NaN
    this._point = 0
  },
  lineEnd: function () {
    switch (this._point) {
      case 2:
        this._context.lineTo(this._x2, this._y2)
        break
      case 3:
        point(this, this._x1, this._y1)
        break
    }
    if (this._line || (this._line !== 0 && this._point === 1)) this._context.closePath()
    this._line = 1 - this._line
  },
  point: function (x, y) {
    ;(x = +x), (y = +y)
    switch (this._point) {
      case 0:
        this._point = 1
        this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y)
        break
      case 1:
        this._point = 2
        ;(this._x1 = x), (this._y1 = y)
        break
      case 2:
        this._point = 3 // falls through
      default:
        point(this, x, y)
        break
    }
    ;(this._x0 = this._x1), (this._x1 = this._x2), (this._x2 = x)
    ;(this._y0 = this._y1), (this._y1 = this._y2), (this._y2 = y)
  },
}
export default (function custom(tension) {
  function cardinal(context) {
    return new Cardinal(context, tension)
  }
  cardinal.tension = function (tension) {
    return custom(+tension)
  }
  return cardinal
})(0)
import noop from "../noop.js"
import { point } from "./cardinal.js"
export function CardinalClosed(context, tension) {
  this._context = context
  this._k = (1 - tension) / 6
}
CardinalClosed.prototype = {
  areaStart: noop,
  areaEnd: noop,
  lineStart: function () {
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
  },
  lineEnd: function () {
    switch (this._point) {
      case 1: {
        this._context.moveTo(this._x3, this._y3)
        this._context.closePath()
        break
      }
      case 2: {
        this._context.lineTo(this._x3, this._y3)
        this._context.closePath()
        break
      }
      case 3: {
        this.point(this._x3, this._y3)
        this.point(this._x4, this._y4)
        this.point(this._x5, this._y5)
        break
      }
    }
  },
  point: function (x, y) {
    ;(x = +x), (y = +y)
    switch (this._point) {
      case 0:
        this._point = 1
        ;(this._x3 = x), (this._y3 = y)
        break
      case 1:
        this._point = 2
        this._context.moveTo((this._x4 = x), (this._y4 = y))
        break
      case 2:
        this._point = 3
        ;(this._x5 = x), (this._y5 = y)
        break
      default:
        point(this, x, y)
        break
    }
    ;(this._x0 = this._x1), (this._x1 = this._x2), (this._x2 = x)
    ;(this._y0 = this._y1), (this._y1 = this._y2), (this._y2 = y)
  },
}
export default (function custom(tension) {
  function cardinal(context) {
    return new CardinalClosed(context, tension)
  }
  cardinal.tension = function (tension) {
    return custom(+tension)
  }
  return cardinal
})(0)
import { point } from "./cardinal.js"
export function CardinalOpen(context, tension) {
  this._context = context
  this._k = (1 - tension) / 6
}
CardinalOpen.prototype = {
  areaStart: function () {
    this._line = 0
  },
  areaEnd: function () {
    this._line = NaN
  },
  lineStart: function () {
    this._x0 = this._x1 = this._x2 = this._y0 = this._y1 = this._y2 = NaN
    this._point = 0
  },
  lineEnd: function () {
    if (this._line || (this._line !== 0 && this._point === 3)) this._context.closePath()
    this._line = 1 - this._line
  },
  point: function (x, y) {
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
        this._line ? this._context.lineTo(this._x2, this._y2) : this._context.moveTo(this._x2, this._y2)
        break
      case 3:
        this._point = 4 // falls through
      default:
        point(this, x, y)
        break
    }
    ;(this._x0 = this._x1), (this._x1 = this._x2), (this._x2 = x)
    ;(this._y0 = this._y1), (this._y1 = this._y2), (this._y2 = y)
  },
}
export default (function custom(tension) {
  function cardinal(context) {
    return new CardinalOpen(context, tension)
  }
  cardinal.tension = function (tension) {
    return custom(+tension)
  }
  return cardinal
})(0)
import { epsilon } from "../math.js"
import { Cardinal } from "./cardinal.js"
export function point(that, x, y) {
  var x1 = that._x1,
    y1 = that._y1,
    x2 = that._x2,
    y2 = that._y2
  if (that._l01_a > epsilon) {
    var a = 2 * that._l01_2a + 3 * that._l01_a * that._l12_a + that._l12_2a,
      n = 3 * that._l01_a * (that._l01_a + that._l12_a)
    x1 = (x1 * a - that._x0 * that._l12_2a + that._x2 * that._l01_2a) / n
    y1 = (y1 * a - that._y0 * that._l12_2a + that._y2 * that._l01_2a) / n
  }
  if (that._l23_a > epsilon) {
    var b = 2 * that._l23_2a + 3 * that._l23_a * that._l12_a + that._l12_2a,
      m = 3 * that._l23_a * (that._l23_a + that._l12_a)
    x2 = (x2 * b + that._x1 * that._l23_2a - x * that._l12_2a) / m
    y2 = (y2 * b + that._y1 * that._l23_2a - y * that._l12_2a) / m
  }
  that._context.bezierCurveTo(x1, y1, x2, y2, that._x2, that._y2)
}
function CatmullRom(context, alpha) {
  this._context = context
  this._alpha = alpha
}
CatmullRom.prototype = {
  areaStart: function () {
    this._line = 0
  },
  areaEnd: function () {
    this._line = NaN
  },
  lineStart: function () {
    this._x0 = this._x1 = this._x2 = this._y0 = this._y1 = this._y2 = NaN
    this._l01_a = this._l12_a = this._l23_a = this._l01_2a = this._l12_2a = this._l23_2a = this._point = 0
  },
  lineEnd: function () {
    switch (this._point) {
      case 2:
        this._context.lineTo(this._x2, this._y2)
        break
      case 3:
        this.point(this._x2, this._y2)
        break
    }
    if (this._line || (this._line !== 0 && this._point === 1)) this._context.closePath()
    this._line = 1 - this._line
  },
  point: function (x, y) {
    ;(x = +x), (y = +y)
    if (this._point) {
      var x23 = this._x2 - x,
        y23 = this._y2 - y
      this._l23_a = Math.sqrt((this._l23_2a = Math.pow(x23 * x23 + y23 * y23, this._alpha)))
    }
    switch (this._point) {
      case 0:
        this._point = 1
        this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y)
        break
      case 1:
        this._point = 2
        break
      case 2:
        this._point = 3 // falls through
      default:
        point(this, x, y)
        break
    }
    ;(this._l01_a = this._l12_a), (this._l12_a = this._l23_a)
    ;(this._l01_2a = this._l12_2a), (this._l12_2a = this._l23_2a)
    ;(this._x0 = this._x1), (this._x1 = this._x2), (this._x2 = x)
    ;(this._y0 = this._y1), (this._y1 = this._y2), (this._y2 = y)
  },
}
export default (function custom(alpha) {
  function catmullRom(context) {
    return alpha ? new CatmullRom(context, alpha) : new Cardinal(context, 0)
  }
  catmullRom.alpha = function (alpha) {
    return custom(+alpha)
  }
  return catmullRom
})(0.5)
import { CardinalClosed } from "./cardinalClosed.js"
import noop from "../noop.js"
import { point } from "./catmullRom.js"
function CatmullRomClosed(context, alpha) {
  this._context = context
  this._alpha = alpha
}
CatmullRomClosed.prototype = {
  areaStart: noop,
  areaEnd: noop,
  lineStart: function () {
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
  },
  lineEnd: function () {
    switch (this._point) {
      case 1: {
        this._context.moveTo(this._x3, this._y3)
        this._context.closePath()
        break
      }
      case 2: {
        this._context.lineTo(this._x3, this._y3)
        this._context.closePath()
        break
      }
      case 3: {
        this.point(this._x3, this._y3)
        this.point(this._x4, this._y4)
        this.point(this._x5, this._y5)
        break
      }
    }
  },
  point: function (x, y) {
    ;(x = +x), (y = +y)
    if (this._point) {
      var x23 = this._x2 - x,
        y23 = this._y2 - y
      this._l23_a = Math.sqrt((this._l23_2a = Math.pow(x23 * x23 + y23 * y23, this._alpha)))
    }
    switch (this._point) {
      case 0:
        this._point = 1
        ;(this._x3 = x), (this._y3 = y)
        break
      case 1:
        this._point = 2
        this._context.moveTo((this._x4 = x), (this._y4 = y))
        break
      case 2:
        this._point = 3
        ;(this._x5 = x), (this._y5 = y)
        break
      default:
        point(this, x, y)
        break
    }
    ;(this._l01_a = this._l12_a), (this._l12_a = this._l23_a)
    ;(this._l01_2a = this._l12_2a), (this._l12_2a = this._l23_2a)
    ;(this._x0 = this._x1), (this._x1 = this._x2), (this._x2 = x)
    ;(this._y0 = this._y1), (this._y1 = this._y2), (this._y2 = y)
  },
}
export default (function custom(alpha) {
  function catmullRom(context) {
    return alpha ? new CatmullRomClosed(context, alpha) : new CardinalClosed(context, 0)
  }
  catmullRom.alpha = function (alpha) {
    return custom(+alpha)
  }
  return catmullRom
})(0.5)
import { CardinalOpen } from "./cardinalOpen.js"
import { point } from "./catmullRom.js"
function CatmullRomOpen(context, alpha) {
  this._context = context
  this._alpha = alpha
}
CatmullRomOpen.prototype = {
  areaStart: function () {
    this._line = 0
  },
  areaEnd: function () {
    this._line = NaN
  },
  lineStart: function () {
    this._x0 = this._x1 = this._x2 = this._y0 = this._y1 = this._y2 = NaN
    this._l01_a = this._l12_a = this._l23_a = this._l01_2a = this._l12_2a = this._l23_2a = this._point = 0
  },
  lineEnd: function () {
    if (this._line || (this._line !== 0 && this._point === 3)) this._context.closePath()
    this._line = 1 - this._line
  },
  point: function (x, y) {
    ;(x = +x), (y = +y)
    if (this._point) {
      var x23 = this._x2 - x,
        y23 = this._y2 - y
      this._l23_a = Math.sqrt((this._l23_2a = Math.pow(x23 * x23 + y23 * y23, this._alpha)))
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
        this._line ? this._context.lineTo(this._x2, this._y2) : this._context.moveTo(this._x2, this._y2)
        break
      case 3:
        this._point = 4 // falls through
      default:
        point(this, x, y)
        break
    }
    ;(this._l01_a = this._l12_a), (this._l12_a = this._l23_a)
    ;(this._l01_2a = this._l12_2a), (this._l12_2a = this._l23_2a)
    ;(this._x0 = this._x1), (this._x1 = this._x2), (this._x2 = x)
    ;(this._y0 = this._y1), (this._y1 = this._y2), (this._y2 = y)
  },
}
export default (function custom(alpha) {
  function catmullRom(context) {
    return alpha ? new CatmullRomOpen(context, alpha) : new CardinalOpen(context, 0)
  }
  catmullRom.alpha = function (alpha) {
    return custom(+alpha)
  }
  return catmullRom
})(0.5)
function Linear(context) {
  this._context = context
}
Linear.prototype = {
  areaStart: function () {
    this._line = 0
  },
  areaEnd: function () {
    this._line = NaN
  },
  lineStart: function () {
    this._point = 0
  },
  lineEnd: function () {
    if (this._line || (this._line !== 0 && this._point === 1)) this._context.closePath()
    this._line = 1 - this._line
  },
  point: function (x, y) {
    ;(x = +x), (y = +y)
    switch (this._point) {
      case 0:
        this._point = 1
        this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y)
        break
      case 1:
        this._point = 2 // falls through
      default:
        this._context.lineTo(x, y)
        break
    }
  },
}
export function (context) {
  return new Linear(context)
}
import noop from "../noop.js"
function LinearClosed(context) {
  this._context = context
}
LinearClosed.prototype = {
  areaStart: noop,
  areaEnd: noop,
  lineStart: function () {
    this._point = 0
  },
  lineEnd: function () {
    if (this._point) this._context.closePath()
  },
  point: function (x, y) {
    ;(x = +x), (y = +y)
    if (this._point) this._context.lineTo(x, y)
    else (this._point = 1), this._context.moveTo(x, y)
  },
}
export function (context) {
  return new LinearClosed(context)
}
function sign(x) {
  return x < 0 ? -1 : 1
}
function slope3(that, x2, y2) {
  var h0 = that._x1 - that._x0,
    h1 = x2 - that._x1,
    s0 = (that._y1 - that._y0) / (h0 || (h1 < 0 && -0)),
    s1 = (y2 - that._y1) / (h1 || (h0 < 0 && -0)),
    p = (s0 * h1 + s1 * h0) / (h0 + h1)
  return (sign(s0) + sign(s1)) * Math.min(Math.abs(s0), Math.abs(s1), 0.5 * Math.abs(p)) || 0
}
function slope2(that, t) {
  var h = that._x1 - that._x0
  return h ? ((3 * (that._y1 - that._y0)) / h - t) / 2 : t
}
function point(that, t0, t1) {
  var x0 = that._x0,
    y0 = that._y0,
    x1 = that._x1,
    y1 = that._y1,
    dx = (x1 - x0) / 3
  that._context.bezierCurveTo(x0 + dx, y0 + dx * t0, x1 - dx, y1 - dx * t1, x1, y1)
}
function MonotoneX(context) {
  this._context = context
}
MonotoneX.prototype = {
  areaStart: function () {
    this._line = 0
  },
  areaEnd: function () {
    this._line = NaN
  },
  lineStart: function () {
    this._x0 = this._x1 = this._y0 = this._y1 = this._t0 = NaN
    this._point = 0
  },
  lineEnd: function () {
    switch (this._point) {
      case 2:
        this._context.lineTo(this._x1, this._y1)
        break
      case 3:
        point(this, this._t0, slope2(this, this._t0))
        break
    }
    if (this._line || (this._line !== 0 && this._point === 1)) this._context.closePath()
    this._line = 1 - this._line
  },
  point: function (x, y) {
    var t1 = NaN
    ;(x = +x), (y = +y)
    if (x === this._x1 && y === this._y1) return // Ignore coincident points.
    switch (this._point) {
      case 0:
        this._point = 1
        this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y)
        break
      case 1:
        this._point = 2
        break
      case 2:
        this._point = 3
        point(this, slope2(this, (t1 = slope3(this, x, y))), t1)
        break
      default:
        point(this, this._t0, (t1 = slope3(this, x, y)))
        break
    }
    ;(this._x0 = this._x1), (this._x1 = x)
    ;(this._y0 = this._y1), (this._y1 = y)
    this._t0 = t1
  },
}
function MonotoneY(context) {
  this._context = new ReflectContext(context)
}
;(MonotoneY.prototype = Object.create(MonotoneX.prototype)).point = function (x, y) {
  MonotoneX.prototype.point.call(this, y, x)
}
function ReflectContext(context) {
  this._context = context
}
ReflectContext.prototype = {
  moveTo: function (x, y) {
    this._context.moveTo(y, x)
  },
  closePath: function () {
    this._context.closePath()
  },
  lineTo: function (x, y) {
    this._context.lineTo(y, x)
  },
  bezierCurveTo: function (x1, y1, x2, y2, x, y) {
    this._context.bezierCurveTo(y1, x1, y2, x2, y, x)
  },
}
export function monotoneX(context) {
  return new MonotoneX(context)
}
export function monotoneY(context) {
  return new MonotoneY(context)
}
function Natural(context) {
  this._context = context
}
Natural.prototype = {
  areaStart: function () {
    this._line = 0
  },
  areaEnd: function () {
    this._line = NaN
  },
  lineStart: function () {
    this._x = []
    this._y = []
  },
  lineEnd: function () {
    var x = this._x,
      y = this._y,
      n = x.length
    if (n) {
      this._line ? this._context.lineTo(x[0], y[0]) : this._context.moveTo(x[0], y[0])
      if (n === 2) {
        this._context.lineTo(x[1], y[1])
      } else {
        var px = controlPoints(x),
          py = controlPoints(y)
        for (var i0 = 0, i1 = 1; i1 < n; ++i0, ++i1) {
          this._context.bezierCurveTo(px[0][i0], py[0][i0], px[1][i0], py[1][i0], x[i1], y[i1])
        }
      }
    }
    if (this._line || (this._line !== 0 && n === 1)) this._context.closePath()
    this._line = 1 - this._line
    this._x = this._y = null
  },
  point: function (x, y) {
    this._x.push(+x)
    this._y.push(+y)
  },
}
function controlPoints(x) {
  var i,
    n = x.length - 1,
    m,
    a = new Array(n),
    b = new Array(n),
    r = new Array(n)
  ;(a[0] = 0), (b[0] = 2), (r[0] = x[0] + 2 * x[1])
  for (i = 1; i < n - 1; ++i) (a[i] = 1), (b[i] = 4), (r[i] = 4 * x[i] + 2 * x[i + 1])
  ;(a[n - 1] = 2), (b[n - 1] = 7), (r[n - 1] = 8 * x[n - 1] + x[n])
  for (i = 1; i < n; ++i) (m = a[i] / b[i - 1]), (b[i] -= m), (r[i] -= m * r[i - 1])
  a[n - 1] = r[n - 1] / b[n - 1]
  for (i = n - 2; i >= 0; --i) a[i] = (r[i] - a[i + 1]) / b[i]
  b[n - 1] = (x[n] + a[n - 1]) / 2
  for (i = 0; i < n - 1; ++i) b[i] = 2 * x[i + 1] - a[i + 1]
  return [a, b]
}
export function (context) {
  return new Natural(context)
}
import curveLinear from "./linear.js"
export const curveRadialLinear = curveRadial(curveLinear)
function Radial(curve) {
  this._curve = curve
}
Radial.prototype = {
  areaStart: function () {
    this._curve.areaStart()
  },
  areaEnd: function () {
    this._curve.areaEnd()
  },
  lineStart: function () {
    this._curve.lineStart()
  },
  lineEnd: function () {
    this._curve.lineEnd()
  },
  point: function (a, r) {
    this._curve.point(r * Math.sin(a), r * -Math.cos(a))
  },
}
export function curveRadial(curve) {
  function radial(context) {
    return new Radial(curve(context))
  }
  radial._curve = curve
  return radial
}
function Step(context, t) {
  this._context = context
  this._t = t
}
Step.prototype = {
  areaStart: function () {
    this._line = 0
  },
  areaEnd: function () {
    this._line = NaN
  },
  lineStart: function () {
    this._x = this._y = NaN
    this._point = 0
  },
  lineEnd: function () {
    if (0 < this._t && this._t < 1 && this._point === 2) this._context.lineTo(this._x, this._y)
    if (this._line || (this._line !== 0 && this._point === 1)) this._context.closePath()
    if (this._line >= 0) (this._t = 1 - this._t), (this._line = 1 - this._line)
  },
  point: function (x, y) {
    ;(x = +x), (y = +y)
    switch (this._point) {
      case 0:
        this._point = 1
        this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y)
        break
      case 1:
        this._point = 2 // falls through
      default: {
        if (this._t <= 0) {
          this._context.lineTo(this._x, y)
          this._context.lineTo(x, y)
        } else {
          var x1 = this._x * (1 - this._t) + x * this._t
          this._context.lineTo(x1, this._y)
          this._context.lineTo(x1, y)
        }
        break
      }
    }
    ;(this._x = x), (this._y = y)
  },
}
export function (context) {
  return new Step(context, 0.5)
}
export function stepBefore(context) {
  return new Step(context, 0)
}
export function stepAfter(context) {
  return new Step(context, 1)
}
