import type * as qt from "./types.js"

const pi = Math.PI
const tau = 2 * pi
const epsilon = 1e-6
const tauEpsilon = tau - epsilon

export class Path implements qt.Path {
  x0?: number | undefined
  x1?: number | undefined
  y0?: number | undefined
  y1?: number | undefined
  v = ""
  arc(x: number, y: number, r: number, a0: number, a1: number, ccw?: boolean) {
    ;(x = +x), (y = +y), (r = +r), (ccw = !!ccw)
    const dx = r * Math.cos(a0),
      dy = r * Math.sin(a0),
      x0 = x + dx,
      y0 = y + dy,
      cw = 1 ^ ccw
    let da = ccw ? a0 - a1 : a1 - a0
    if (r < 0) throw new Error("negative radius: " + r)
    if (this.x1 === undefined) {
      this.v += "M" + x0 + "," + y0
    } else if (Math.abs(this.x1 - x0) > epsilon || Math.abs(this.y1 - y0) > epsilon) {
      this.v += "L" + x0 + "," + y0
    }
    if (!r) return
    if (da < 0) da = (da % tau) + tau
    if (da > tauEpsilon) {
      this.v +=
        "A" +
        r +
        "," +
        r +
        ",0,1," +
        cw +
        "," +
        (x - dx) +
        "," +
        (y - dy) +
        "A" +
        r +
        "," +
        r +
        ",0,1," +
        cw +
        "," +
        (this.x1 = x0) +
        "," +
        (this.y1 = y0)
    } else if (da > epsilon) {
      this.v +=
        "A" +
        r +
        "," +
        r +
        ",0," +
        +(da >= pi) +
        "," +
        cw +
        "," +
        (this.x1 = x + r * Math.cos(a1)) +
        "," +
        (this.y1 = y + r * Math.sin(a1))
    }
  }
  arcTo(x1: number, y1: number, x2: number, y2: number, r: number) {
    ;(x1 = +x1), (y1 = +y1), (x2 = +x2), (y2 = +y2), (r = +r)
    const x0 = this.x1,
      y0 = this.y1,
      x21 = x2 - x1,
      y21 = y2 - y1,
      x01 = x0 - x1,
      y01 = y0 - y1,
      l01_2 = x01 * x01 + y01 * y01
    if (r < 0) throw new Error("negative radius: " + r)
    if (this.x1 === undefined) {
      this.v += "M" + (this.x1 = x1) + "," + (this.y1 = y1)
    } else if (!(l01_2 > epsilon));
    else if (!(Math.abs(y01 * x21 - y21 * x01) > epsilon) || !r) {
      this.v += "L" + (this.x1 = x1) + "," + (this.y1 = y1)
    } else {
      const x20 = x2 - x0,
        y20 = y2 - y0,
        l21_2 = x21 * x21 + y21 * y21,
        l20_2 = x20 * x20 + y20 * y20,
        l21 = Math.sqrt(l21_2),
        l01 = Math.sqrt(l01_2),
        l = r * Math.tan((pi - Math.acos((l21_2 + l01_2 - l20_2) / (2 * l21 * l01))) / 2),
        t01 = l / l01,
        t21 = l / l21
      if (Math.abs(t01 - 1) > epsilon) {
        this.v += "L" + (x1 + t01 * x01) + "," + (y1 + t01 * y01)
      }
      this.v +=
        "A" +
        r +
        "," +
        r +
        ",0,0," +
        +(y01 * x20 > x01 * y20) +
        "," +
        (this.x1 = x1 + t21 * x21) +
        "," +
        (this.y1 = y1 + t21 * y21)
    }
  }
  bezierCurveTo(x1: number, y1: number, x2: number, y2: number, x: number, y: number) {
    this.v += "C" + +x1 + "," + +y1 + "," + +x2 + "," + +y2 + "," + (this.x1 = +x) + "," + (this.y1 = +y)
  }
  closePath() {
    if (this.x1 !== undefined) {
      ;(this.x1 = this.x0), (this.y1 = this.y0)
      this.v += "Z"
    }
  }
  lineTo(x: number, y: number) {
    this.v += "L" + (this.x1 = +x) + "," + (this.y1 = +y)
  }
  moveTo(x: number, y: number) {
    this.v += "M" + (this.x0 = this.x1 = +x) + "," + (this.y0 = this.y1 = +y)
  }
  quadraticCurveTo(x1: number, y1: number, x: number, y: number) {
    this.v += "Q" + +x1 + "," + +y1 + "," + (this.x1 = +x) + "," + (this.y1 = +y)
  }
  rect(x: number, y: number, w: number, h: number) {
    this.v += "M" + (this.x0 = this.x1 = +x) + "," + (this.y0 = this.y1 = +y) + "h" + +w + "v" + +h + "h" + -w + "Z"
  }
  toString() {
    return this.v
  }
}
