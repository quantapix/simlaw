/* eslint-disable no-cond-assign */
import type * as qt from "./types.js"
import * as qu from "./utils.js"

abstract class Color implements qt.Color {
  constructor(public alpha = NaN) {}
  abstract brighter(k?: number): qt.Color
  abstract darker(k?: number): qt.Color
  displayable() {
    return this.rgb().displayable()
  }
  formatHex() {
    return this.rgb().formatHex()
  }
  formatHex8() {
    return this.rgb().formatHex8()
  }
  formatHsl(): string {
    return HSL.from(this).formatHsl()
  }
  formatRgb() {
    return this.rgb().formatRgb()
  }
  abstract rgb(): qt.RGB
  toString = this.formatRgb
  copy(x: any) {
    const C = Object.getPrototypeOf(this).constructor
    return Object.assign(new C(), this, x)
  }
}

export const darker = 0.7
export const brighter = 1 / darker

export class RGB extends Color implements qt.RGB {
  static from(x: string): RGB
  static from(x?: qt.Color): RGB
  static from(r: number, g: number, b: number, alpha?: number): RGB
  static from(x: any, g?: number, b?: number, alpha = 1) {
    const convert = (x?: string | Color) => {
      x = typeof x === "string" ? color(x) : x
      if (x === undefined) return new RGB()
      if (x instanceof RGB) return new RGB(x.r, x.g, x.b, x.alpha)
      const y = x.rgb()
      return new RGB(y.r, y.g, y.b, y.alpha)
    }
    return g === undefined ? convert(x) : new RGB(x, g, b, alpha)
  }
  constructor(public r = NaN, public g = NaN, public b = NaN, alpha = 1) {
    super(alpha)
  }
  brighter(k?: number) {
    k = k === undefined ? brighter : qu.pow(brighter, k)
    return new RGB(this.r * k, this.g * k, this.b * k, this.alpha)
  }
  clamp() {
    return new RGB(clampi(this.r), clampi(this.g), clampi(this.b), clampa(this.alpha))
  }
  darker(k?: number) {
    k = k === undefined ? darker : qu.pow(darker, k)
    return new RGB(this.r * k, this.g * k, this.b * k, this.alpha)
  }
  override displayable() {
    return (
      -0.5 <= this.r &&
      this.r < 255.5 &&
      -0.5 <= this.g &&
      this.g < 255.5 &&
      -0.5 <= this.b &&
      this.b < 255.5 &&
      0 <= this.alpha &&
      this.alpha <= 1
    )
  }
  override formatHex() {
    return `#${hex(this.r)}${hex(this.g)}${hex(this.b)}`
  }
  override formatHex8() {
    return `#${hex(this.r)}${hex(this.g)}${hex(this.b)}${hex((isNaN(this.alpha) ? 1 : this.alpha) * 255)}`
  }
  override formatRgb() {
    const a = clampa(this.alpha)
    return `${a === 1 ? "rgb(" : "rgba("}${clampi(this.r)}, ${clampi(this.g)}, ${clampi(this.b)}${
      a === 1 ? ")" : `, ${a})`
    }`
  }
  rgb() {
    return this
  }
}

export class HSL extends Color implements qt.HSL {
  static from(x: string): HSL
  static from(x?: qt.Color): HSL
  static from(h: number, s: number, l: number, alpha?: number): HSL
  static from(x: any, s?: number, l?: number, alpha = 1) {
    const convert = (x?: string | Color) => {
      x = typeof x === "string" ? color(x) : x
      if (x === undefined) return new HSL()
      if (x instanceof HSL) return new HSL(x.h, x.s, x.l, x.alpha)
      const y = x.rgb()
      const r = y.r / 255,
        g = y.g / 255,
        b = y.b / 255,
        min = qu.min(r, g, b),
        max = qu.max(r, g, b),
        l = (max + min) / 2
      let h = NaN,
        s = max - min
      if (s) {
        if (r === max) h = (g - b) / s + (g < b ? 1 : 0) * 6
        else if (g === max) h = (b - r) / s + 2
        else h = (r - g) / s + 4
        s /= l < 0.5 ? max + min : 2 - max - min
        h *= 60
      } else {
        s = l > 0 && l < 1 ? 0 : h
      }
      return new HSL(h, s, l, y.alpha)
    }
    return s === undefined ? convert(x) : new HSL(x, s, l, alpha)
  }
  constructor(public h = NaN, public s = NaN, public l = NaN, alpha = 1) {
    super(alpha)
  }
  brighter(k?: number) {
    k = k === undefined ? brighter : qu.pow(brighter, k)
    return new HSL(this.h, this.s, this.l * k, this.alpha)
  }
  clamp() {
    return new HSL(clamph(this.h), clampt(this.s), clampt(this.l), clampa(this.alpha))
  }
  darker(k?: number) {
    k = k === undefined ? darker : qu.pow(darker, k)
    return new HSL(this.h, this.s, this.l * k, this.alpha)
  }
  override displayable() {
    return (
      ((0 <= this.s && this.s <= 1) || isNaN(this.s)) &&
      0 <= this.l &&
      this.l <= 1 &&
      0 <= this.alpha &&
      this.alpha <= 1
    )
  }
  override formatHsl() {
    const a = clampa(this.alpha)
    return `${a === 1 ? "hsl(" : "hsla("}${clamph(this.h)}, ${clampt(this.s) * 100}%, ${clampt(this.l) * 100}%${
      a === 1 ? ")" : `, ${a})`
    }`
  }
  rgb() {
    const h = (this.h % 360) + (this.h < 0 ? 1 : 0) * 360,
      s = isNaN(h) || isNaN(this.s) ? 0 : this.s,
      l = this.l,
      m2 = l + (l < 0.5 ? l : 1 - l) * s,
      m1 = 2 * l - m2
    const toRgb = (h: number, m1: number, m2: number) =>
      (h < 60 ? m1 + ((m2 - m1) * h) / 60 : h < 180 ? m2 : h < 240 ? m1 + ((m2 - m1) * (240 - h)) / 60 : m1) * 255
    return new RGB(
      toRgb(h >= 240 ? h - 240 : h + 120, m1, m2),
      toRgb(h, m1, m2),
      toRgb(h < 120 ? h + 240 : h - 120, m1, m2),
      this.alpha
    )
  }
}

const K = 18,
  Xn = 0.96422,
  Yn = 1,
  Zn = 0.82521

const t0 = 4 / 29,
  t1 = 6 / 29,
  t2 = 3 * t1 * t1,
  t3 = t1 * t1 * t1

export class LAB extends Color implements qt.LAB {
  static from(x: string): LAB
  static from(x?: qt.Color): LAB
  static from(r: number, g: number, b: number, alpha?: number): LAB
  static from(x: any, a?: number, b?: number, alpha = 1) {
    const convert = (o?: string | Color) => {
      o = typeof o === "string" ? color(o) : o
      if (o === undefined) return new LAB()
      if (o instanceof LAB) return new LAB(o.l, o.a, o.b, o.alpha)
      if (o instanceof HCL) return o.toLab()
      const o2 = o instanceof RGB ? o : RGB.from(o)
      const toLrgb = (x: number) => ((x /= 255) <= 0.04045 ? x / 12.92 : qu.pow((x + 0.055) / 1.055, 2.4))
      const toLab = (x: number) => (x > t3 ? qu.pow(x, 1 / 3) : x / t2 + t0)
      const r = toLrgb(o2.r),
        g = toLrgb(o2.g),
        b = toLrgb(o2.b),
        y = toLab((0.2225045 * r + 0.7168786 * g + 0.0606169 * b) / Yn)
      let x, z
      if (r === g && g === b) x = z = y
      else {
        x = toLab((0.4360747 * r + 0.3850649 * g + 0.1430804 * b) / Xn)
        z = toLab((0.0139322 * r + 0.0971045 * g + 0.7141733 * b) / Zn)
      }
      return new LAB(116 * y - 16, 500 * (x - y), 200 * (y - z), o.alpha)
    }
    return a === undefined ? convert(x) : new LAB(x, a, b, alpha)
  }
  static gray(l: number, alpha = 1) {
    return new LAB(l, 0, 0, alpha)
  }
  constructor(public l = NaN, public a = NaN, public b = NaN, alpha = 1) {
    super(alpha)
  }
  brighter(k?: number) {
    return new LAB(this.l + K * (k === undefined ? 1 : k), this.a, this.b, this.alpha)
  }
  darker(k?: number) {
    return new LAB(this.l - K * (k === undefined ? 1 : k), this.a, this.b, this.alpha)
  }
  rgb() {
    let y = (this.l + 16) / 116,
      x = isNaN(this.a) ? y : y + this.a / 500,
      z = isNaN(this.b) ? y : y - this.b / 200
    const toXyz = (x: number) => (x > t1 ? x * x * x : t2 * (x - t0))
    x = Xn * toXyz(x)
    y = Yn * toXyz(y)
    z = Zn * toXyz(z)
    const toRgb = (x: number) => 255 * (x <= 0.0031308 ? 12.92 * x : 1.055 * qu.pow(x, 1 / 2.4) - 0.055)
    return new RGB(
      toRgb(3.1338561 * x - 1.6168667 * y - 0.4906146 * z),
      toRgb(-0.9787684 * x + 1.9161415 * y + 0.033454 * z),
      toRgb(0.0719453 * x - 0.2289914 * y + 1.4052427 * z),
      this.alpha
    )
  }
}

export class HCL extends Color implements qt.HCL {
  static from(x: string): HCL
  static from(x?: qt.Color): HCL
  static from(h: number, c: number, l: number, alpha?: number): HCL
  static from(x: any, c?: number, l?: number, alpha = 1) {
    const convert = (x?: string | Color) => {
      x = typeof x === "string" ? color(x) : x
      if (x === undefined) return new HCL()
      if (x instanceof HCL) return new HCL(x.h, x.c, x.l, x.alpha)
      const y = x instanceof LAB ? x : LAB.from(x)
      if (y.a === 0 && y.b === 0) return new HCL(NaN, 0 < y.l && y.l < 100 ? 0 : NaN, y.l, y.alpha)
      const h = qu.atan2(y.b, y.a) * qu.degrees
      return new HCL(h < 0 ? h + 360 : h, qu.sqrt(y.a * y.a + y.b * y.b), y.l, y.alpha)
    }

    return c === undefined ? convert(x) : new HCL(x, c, l, alpha)
  }
  static fromLch(l: number, c?: number, h?: number, alpha = 1) {
    return c === undefined ? new HCL(l) : new HCL(h, c, l, alpha)
  }
  constructor(public h = NaN, public c = NaN, public l = NaN, alpha = 1) {
    super(alpha)
  }
  brighter(k?: number) {
    return new HCL(this.h, this.c, this.l + K * (k === undefined ? 1 : k), this.alpha)
  }
  darker(k?: number) {
    return new HCL(this.h, this.c, this.l - K * (k === undefined ? 1 : k), this.alpha)
  }
  rgb() {
    return this.toLab().rgb()
  }
  toLab() {
    if (isNaN(this.h)) return new LAB(this.l, 0, 0, this.alpha)
    const h = this.h * qu.radians
    return new LAB(this.l, qu.cos(h) * this.c, qu.sin(h) * this.c, this.alpha)
  }
}

const A = -0.14861,
  B = +1.78277,
  C = -0.29227,
  D = -0.90649,
  E = +1.97294,
  ED = E * D,
  EB = E * B,
  BC_DA = B * C - D * A

export class Cubehelix extends Color implements qt.Cubehelix {
  static from(x: string): Cubehelix
  static from(x?: qt.Color): Cubehelix
  static from(h: number, s: number, l: number, alpha?: number): Cubehelix
  static from(x: any, s?: number, l?: number, alpha = 1) {
    const convert = (o: any) => {
      if (o instanceof Cubehelix) return new Cubehelix(o.h, o.s, o.l, o.alpha)
      if (!(o instanceof RGB)) o = RGB.from(o)
      const r = o.r / 255,
        g = o.g / 255,
        b = o.b / 255,
        l = (BC_DA * b + ED * r - EB * g) / (BC_DA + ED - EB),
        bl = b - l,
        k = (E * (g - l) - C * bl) / D,
        s = qu.sqrt(k * k + bl * bl) / (E * l * (1 - l)), // NaN if l=0 or l=1
        h = s ? qu.atan2(k, bl) * qu.degrees - 120 : NaN
      return new Cubehelix(h < 0 ? h + 360 : h, s, l, o.alpha)
    }
    return s === undefined ? convert(x) : new Cubehelix(x, s, l, alpha)
  }
  constructor(public h = NaN, public s = NaN, public l = NaN, alpha = 1) {
    super(alpha)
  }
  brighter(k?: number) {
    k = k === undefined ? brighter : qu.pow(brighter, k)
    return new Cubehelix(this.h, this.s, this.l * k, this.alpha)
  }
  darker(k?: number) {
    k = k === undefined ? darker : qu.pow(darker, k)
    return new Cubehelix(this.h, this.s, this.l * k, this.alpha)
  }
  rgb() {
    const h = isNaN(this.h) ? 0 : (this.h + 120) * qu.radians,
      l = +this.l,
      a = isNaN(this.s) ? 0 : this.s * l * (1 - l),
      cosh = qu.cos(h),
      sinh = qu.sin(h)
    return new RGB(
      255 * (l + a * (A * cosh + B * sinh)),
      255 * (l + a * (C * cosh + D * sinh)),
      255 * (l + a * (E * cosh)),
      this.alpha
    )
  }
}

const reI = "\\s*([+-]?\\d+)\\s*",
  reN = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)\\s*",
  reP = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)%\\s*",
  reHex = /^#([0-9a-f]{3,8})$/,
  reRgbInt = new RegExp(`^rgb\\(${reI},${reI},${reI}\\)$`),
  reRgbPercent = new RegExp(`^rgb\\(${reP},${reP},${reP}\\)$`),
  reRgbaInt = new RegExp(`^rgba\\(${reI},${reI},${reI},${reN}\\)$`),
  reRgbaPercent = new RegExp(`^rgba\\(${reP},${reP},${reP},${reN}\\)$`),
  reHslPercent = new RegExp(`^hsl\\(${reN},${reP},${reP}\\)$`),
  reHslaPercent = new RegExp(`^hsla\\(${reN},${reP},${reP},${reN}\\)$`)

export function color(fmt: string) {
  fmt = (fmt + "").trim().toLowerCase()
  let m: RegExpExecArray | null, l, v: number
  const rgbn = (x: number) => new RGB((x >> 16) & 0xff, (x >> 8) & 0xff, x & 0xff, 1)
  const rgba = (r: number, g: number, b: number, a: number) => {
    if (a <= 0) r = g = b = NaN
    return new RGB(r, g, b, a)
  }
  const hsla = (h: number, s: number, l: number, a: number) => {
    if (a <= 0) h = s = l = NaN
    else if (l <= 0 || l >= 1) h = s = NaN
    else if (s <= 0) h = NaN
    return new HSL(h, s, l, a)
  }
  return (m = reHex.exec(fmt))
    ? ((l = m[1]!.length),
      (v = parseInt(m[1]!, 16)),
      l === 6
        ? rgbn(v) // #ff0000
        : l === 3
        ? new RGB(((v >> 8) & 0xf) | ((v >> 4) & 0xf0), ((v >> 4) & 0xf) | (v & 0xf0), ((v & 0xf) << 4) | (v & 0xf), 1) // #f00
        : l === 8
        ? rgba((v >> 24) & 0xff, (v >> 16) & 0xff, (v >> 8) & 0xff, (v & 0xff) / 0xff) // #ff000000
        : l === 4
        ? rgba(
            ((v >> 12) & 0xf) | ((v >> 8) & 0xf0),
            ((v >> 8) & 0xf) | ((v >> 4) & 0xf0),
            ((v >> 4) & 0xf) | (v & 0xf0),
            (((v & 0xf) << 4) | (v & 0xf)) / 0xff
          ) // #f000
        : undefined) // invalid hex
    : (m = reRgbInt.exec(fmt))
    ? new RGB(+m[1]!, +m[2]!, +m[3]!, 1) // rgb(255, 0, 0)
    : (m = reRgbPercent.exec(fmt))
    ? new RGB((+m[1]! * 255) / 100, (+m[2]! * 255) / 100, (+m[3]! * 255) / 100, 1) // rgb(100%, 0%, 0%)
    : (m = reRgbaInt.exec(fmt))
    ? rgba(+m[1]!, +m[2]!, +m[3]!, +m[4]!) // rgba(255, 0, 0, 1)
    : (m = reRgbaPercent.exec(fmt))
    ? rgba((+m[1]! * 255) / 100, (+m[2]! * 255) / 100, (+m[3]! * 255) / 100, +m[4]!) // rgb(100%, 0%, 0%, 1)
    : (m = reHslPercent.exec(fmt))
    ? hsla(+m[1]!, +m[2]! / 100, +m[3]! / 100, 1) // hsl(120, 50%, 50%)
    : (m = reHslaPercent.exec(fmt))
    ? hsla(+m[1]!, +m[2]! / 100, +m[3]! / 100, +m[4]!) // hsla(120, 50%, 50%, 1)
    : named.hasOwnProperty(fmt)
    ? rgbn(named[fmt]!)
    : fmt === "transparent"
    ? new RGB(NaN, NaN, NaN, 0)
    : undefined
}

function hex(x: number) {
  x = clampi(x)
  return (x < 16 ? "0" : "") + x.toString(16)
}

function clampa(x: number) {
  return isNaN(x) ? 1 : qu.max(0, qu.min(1, x))
}
function clampi(x: number) {
  return qu.max(0, qu.min(255, qu.round(x) || 0))
}
function clamph(x: number) {
  x = (x || 0) % 360
  return x < 0 ? x + 360 : x
}
function clampt(x: number) {
  return qu.max(0, qu.min(1, x || 0))
}

const named: { [k: string]: number } = {
  aliceblue: 0xf0f8ff,
  antiquewhite: 0xfaebd7,
  aqua: 0x00ffff,
  aquamarine: 0x7fffd4,
  azure: 0xf0ffff,
  beige: 0xf5f5dc,
  bisque: 0xffe4c4,
  black: 0x000000,
  blanchedalmond: 0xffebcd,
  blue: 0x0000ff,
  blueviolet: 0x8a2be2,
  brown: 0xa52a2a,
  burlywood: 0xdeb887,
  cadetblue: 0x5f9ea0,
  chartreuse: 0x7fff00,
  chocolate: 0xd2691e,
  coral: 0xff7f50,
  cornflowerblue: 0x6495ed,
  cornsilk: 0xfff8dc,
  crimson: 0xdc143c,
  cyan: 0x00ffff,
  darkblue: 0x00008b,
  darkcyan: 0x008b8b,
  darkgoldenrod: 0xb8860b,
  darkgray: 0xa9a9a9,
  darkgreen: 0x006400,
  darkgrey: 0xa9a9a9,
  darkkhaki: 0xbdb76b,
  darkmagenta: 0x8b008b,
  darkolivegreen: 0x556b2f,
  darkorange: 0xff8c00,
  darkorchid: 0x9932cc,
  darkred: 0x8b0000,
  darksalmon: 0xe9967a,
  darkseagreen: 0x8fbc8f,
  darkslateblue: 0x483d8b,
  darkslategray: 0x2f4f4f,
  darkslategrey: 0x2f4f4f,
  darkturquoise: 0x00ced1,
  darkviolet: 0x9400d3,
  deeppink: 0xff1493,
  deepskyblue: 0x00bfff,
  dimgray: 0x696969,
  dimgrey: 0x696969,
  dodgerblue: 0x1e90ff,
  firebrick: 0xb22222,
  floralwhite: 0xfffaf0,
  forestgreen: 0x228b22,
  fuchsia: 0xff00ff,
  gainsboro: 0xdcdcdc,
  ghostwhite: 0xf8f8ff,
  gold: 0xffd700,
  goldenrod: 0xdaa520,
  gray: 0x808080,
  green: 0x008000,
  greenyellow: 0xadff2f,
  grey: 0x808080,
  honeydew: 0xf0fff0,
  hotpink: 0xff69b4,
  indianred: 0xcd5c5c,
  indigo: 0x4b0082,
  ivory: 0xfffff0,
  khaki: 0xf0e68c,
  lavender: 0xe6e6fa,
  lavenderblush: 0xfff0f5,
  lawngreen: 0x7cfc00,
  lemonchiffon: 0xfffacd,
  lightblue: 0xadd8e6,
  lightcoral: 0xf08080,
  lightcyan: 0xe0ffff,
  lightgoldenrodyellow: 0xfafad2,
  lightgray: 0xd3d3d3,
  lightgreen: 0x90ee90,
  lightgrey: 0xd3d3d3,
  lightpink: 0xffb6c1,
  lightsalmon: 0xffa07a,
  lightseagreen: 0x20b2aa,
  lightskyblue: 0x87cefa,
  lightslategray: 0x778899,
  lightslategrey: 0x778899,
  lightsteelblue: 0xb0c4de,
  lightyellow: 0xffffe0,
  lime: 0x00ff00,
  limegreen: 0x32cd32,
  linen: 0xfaf0e6,
  magenta: 0xff00ff,
  maroon: 0x800000,
  mediumaquamarine: 0x66cdaa,
  mediumblue: 0x0000cd,
  mediumorchid: 0xba55d3,
  mediumpurple: 0x9370db,
  mediumseagreen: 0x3cb371,
  mediumslateblue: 0x7b68ee,
  mediumspringgreen: 0x00fa9a,
  mediumturquoise: 0x48d1cc,
  mediumvioletred: 0xc71585,
  midnightblue: 0x191970,
  mintcream: 0xf5fffa,
  mistyrose: 0xffe4e1,
  moccasin: 0xffe4b5,
  navajowhite: 0xffdead,
  navy: 0x000080,
  oldlace: 0xfdf5e6,
  olive: 0x808000,
  olivedrab: 0x6b8e23,
  orange: 0xffa500,
  orangered: 0xff4500,
  orchid: 0xda70d6,
  palegoldenrod: 0xeee8aa,
  palegreen: 0x98fb98,
  paleturquoise: 0xafeeee,
  palevioletred: 0xdb7093,
  papayawhip: 0xffefd5,
  peachpuff: 0xffdab9,
  peru: 0xcd853f,
  pink: 0xffc0cb,
  plum: 0xdda0dd,
  powderblue: 0xb0e0e6,
  purple: 0x800080,
  rebeccapurple: 0x663399,
  red: 0xff0000,
  rosybrown: 0xbc8f8f,
  royalblue: 0x4169e1,
  saddlebrown: 0x8b4513,
  salmon: 0xfa8072,
  sandybrown: 0xf4a460,
  seagreen: 0x2e8b57,
  seashell: 0xfff5ee,
  sienna: 0xa0522d,
  silver: 0xc0c0c0,
  skyblue: 0x87ceeb,
  slateblue: 0x6a5acd,
  slategray: 0x708090,
  slategrey: 0x708090,
  snow: 0xfffafa,
  springgreen: 0x00ff7f,
  steelblue: 0x4682b4,
  tan: 0xd2b48c,
  teal: 0x008080,
  thistle: 0xd8bfd8,
  tomato: 0xff6347,
  turquoise: 0x40e0d0,
  violet: 0xee82ee,
  wheat: 0xf5deb3,
  white: 0xffffff,
  whitesmoke: 0xf5f5f5,
  yellow: 0xffff00,
  yellowgreen: 0x9acd32,
}
