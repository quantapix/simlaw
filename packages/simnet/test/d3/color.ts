import assert from "assert"
import { hcl, hsl, lab, rgb } from "../src/index.js"

export function assertRgbEqual(actual, r, g, b, opacity) {
  assert(
    actual instanceof rgb &&
      (isNaN(r) ? isNaN(actual.r) && actual.r !== actual.r : actual.r === r) &&
      (isNaN(g) ? isNaN(actual.g) && actual.g !== actual.g : actual.g === g) &&
      (isNaN(b) ? isNaN(actual.b) && actual.b !== actual.b : actual.b === b) &&
      (isNaN(opacity) ? isNaN(actual.opacity) && actual.opacity !== actual.opacity : actual.opacity === opacity)
  )
}

export function assertRgbApproxEqual(actual, r, g, b, opacity) {
  assert(
    actual instanceof rgb &&
      (isNaN(r) ? isNaN(actual.r) && actual.r !== actual.r : Math.round(actual.r) === Math.round(r)) &&
      (isNaN(g) ? isNaN(actual.g) && actual.g !== actual.g : Math.round(actual.g) === Math.round(g)) &&
      (isNaN(b) ? isNaN(actual.b) && actual.b !== actual.b : Math.round(actual.b) === Math.round(b)) &&
      (isNaN(opacity) ? isNaN(actual.opacity) && actual.opacity !== actual.opacity : actual.opacity === opacity)
  )
}
export function assertHclEqual(actual, h, c, l, opacity) {
  assert(
    actual instanceof hcl &&
      (isNaN(h) ? isNaN(actual.h) && actual.h !== actual.h : h - 1e-6 <= actual.h && actual.h <= h + 1e-6) &&
      (isNaN(c) ? isNaN(actual.c) && actual.c !== actual.c : c - 1e-6 <= actual.c && actual.c <= c + 1e-6) &&
      (isNaN(l) ? isNaN(actual.l) && actual.l !== actual.l : l - 1e-6 <= actual.l && actual.l <= l + 1e-6) &&
      (isNaN(opacity) ? isNaN(actual.opacity) && actual.opacity !== actual.opacity : actual.opacity === opacity)
  )
}

export function assertHslEqual(actual, h, s, l, opacity) {
  assert(
    actual instanceof hsl &&
      (isNaN(h) ? isNaN(actual.h) && actual.h !== actual.h : h - 1e-6 <= actual.h && actual.h <= h + 1e-6) &&
      (isNaN(s) ? isNaN(actual.s) && actual.s !== actual.s : s - 1e-6 <= actual.s && actual.s <= s + 1e-6) &&
      (isNaN(l) ? isNaN(actual.l) && actual.l !== actual.l : l - 1e-6 <= actual.l && actual.l <= l + 1e-6) &&
      (isNaN(opacity) ? isNaN(actual.opacity) && actual.opacity !== actual.opacity : actual.opacity === opacity)
  )
}

export function assertLabEqual(actual, l, a, b, opacity) {
  assert(
    actual instanceof lab &&
      (isNaN(l) ? isNaN(actual.l) && actual.l !== actual.l : l - 1e-6 <= actual.l && actual.l <= l + 1e-6) &&
      (isNaN(a) ? isNaN(actual.a) && actual.a !== actual.a : a - 1e-6 <= actual.a && actual.a <= a + 1e-6) &&
      (isNaN(b) ? isNaN(actual.b) && actual.b !== actual.b : b - 1e-6 <= actual.b && actual.b <= b + 1e-6) &&
      (isNaN(opacity) ? isNaN(actual.opacity) && actual.opacity !== actual.opacity : actual.opacity === opacity)
  )
}
import assert from "assert"
import { color } from "../src/index.js"
import { assertHslEqual, assertRgbApproxEqual, assertRgbEqual } from "./asserts.js"

it('color(format) parses CSS color names (e.g., "rebeccapurple")', () => {
  assertRgbApproxEqual(color("moccasin"), 255, 228, 181, 1)
  assertRgbApproxEqual(color("aliceblue"), 240, 248, 255, 1)
  assertRgbApproxEqual(color("yellow"), 255, 255, 0, 1)
  assertRgbApproxEqual(color("moccasin"), 255, 228, 181, 1)
  assertRgbApproxEqual(color("aliceblue"), 240, 248, 255, 1)
  assertRgbApproxEqual(color("yellow"), 255, 255, 0, 1)
  assertRgbApproxEqual(color("rebeccapurple"), 102, 51, 153, 1)
  assertRgbApproxEqual(color("transparent"), NaN, NaN, NaN, 0)
})

it('color(format) parses 6-digit hexadecimal (e.g., "#abcdef")', () => {
  assertRgbApproxEqual(color("#abcdef"), 171, 205, 239, 1)
})

it('color(format) parses 3-digit hexadecimal (e.g., "#abc")', () => {
  assertRgbApproxEqual(color("#abc"), 170, 187, 204, 1)
})

it('color(format) does not parse 7-digit hexadecimal (e.g., "#abcdef3")', () => {
  assert.strictEqual(color("#abcdef3"), null)
})

it('color(format) parses 8-digit hexadecimal (e.g., "#abcdef33")', () => {
  assertRgbApproxEqual(color("#abcdef33"), 171, 205, 239, 0.2)
})

it('color(format) parses 4-digit hexadecimal (e.g., "#abc3")', () => {
  assertRgbApproxEqual(color("#abc3"), 170, 187, 204, 0.2)
})

it('color(format) parses RGB integer format (e.g., "rgb(12,34,56)")', () => {
  assertRgbApproxEqual(color("rgb(12,34,56)"), 12, 34, 56, 1)
})

it('color(format) parses RGBA integer format (e.g., "rgba(12,34,56,0.4)")', () => {
  assertRgbApproxEqual(color("rgba(12,34,56,0.4)"), 12, 34, 56, 0.4)
})

it('color(format) parses RGB percentage format (e.g., "rgb(12%,34%,56%)")', () => {
  assertRgbApproxEqual(color("rgb(12%,34%,56%)"), 31, 87, 143, 1)
  assertRgbEqual(color("rgb(100%,100%,100%)"), 255, 255, 255, 1)
})

it('color(format) parses RGBA percentage format (e.g., "rgba(12%,34%,56%,0.4)")', () => {
  assertRgbApproxEqual(color("rgba(12%,34%,56%,0.4)"), 31, 87, 143, 0.4)
  assertRgbEqual(color("rgba(100%,100%,100%,0.4)"), 255, 255, 255, 0.4)
})

it('color(format) parses HSL format (e.g., "hsl(60,100%,20%)")', () => {
  assertHslEqual(color("hsl(60,100%,20%)"), 60, 1, 0.2, 1)
})

it('color(format) parses HSLA format (e.g., "hsla(60,100%,20%,0.4)")', () => {
  assertHslEqual(color("hsla(60,100%,20%,0.4)"), 60, 1, 0.2, 0.4)
})

it("color(format) ignores leading and trailing whitespace", () => {
  assertRgbApproxEqual(color(" aliceblue\t\n"), 240, 248, 255, 1)
  assertRgbApproxEqual(color(" #abc\t\n"), 170, 187, 204, 1)
  assertRgbApproxEqual(color(" #aabbcc\t\n"), 170, 187, 204, 1)
  assertRgbApproxEqual(color(" rgb(120,30,50)\t\n"), 120, 30, 50, 1)
  assertHslEqual(color(" hsl(120,30%,50%)\t\n"), 120, 0.3, 0.5, 1)
})

it("color(format) ignores whitespace between numbers", () => {
  assertRgbApproxEqual(color(" rgb( 120 , 30 , 50 ) "), 120, 30, 50, 1)
  assertHslEqual(color(" hsl( 120 , 30% , 50% ) "), 120, 0.3, 0.5, 1)
  assertRgbApproxEqual(color(" rgba( 12 , 34 , 56 , 0.4 ) "), 12, 34, 56, 0.4)
  assertRgbApproxEqual(color(" rgba( 12% , 34% , 56% , 0.4 ) "), 31, 87, 143, 0.4)
  assertHslEqual(color(" hsla( 60 , 100% , 20% , 0.4 ) "), 60, 1, 0.2, 0.4)
})

it("color(format) allows number signs", () => {
  assertRgbApproxEqual(color("rgb(+120,+30,+50)"), 120, 30, 50, 1)
  assertHslEqual(color("hsl(+120,+30%,+50%)"), 120, 0.3, 0.5, 1)
  assertRgbApproxEqual(color("rgb(-120,-30,-50)"), -120, -30, -50, 1)
  assertHslEqual(color("hsl(-120,-30%,-50%)"), NaN, NaN, -0.5, 1)
  assertRgbApproxEqual(color("rgba(12,34,56,+0.4)"), 12, 34, 56, 0.4)
  assertRgbApproxEqual(color("rgba(12,34,56,-0.4)"), NaN, NaN, NaN, -0.4)
  assertRgbApproxEqual(color("rgba(12%,34%,56%,+0.4)"), 31, 87, 143, 0.4)
  assertRgbApproxEqual(color("rgba(12%,34%,56%,-0.4)"), NaN, NaN, NaN, -0.4)
  assertHslEqual(color("hsla(60,100%,20%,+0.4)"), 60, 1, 0.2, 0.4)
  assertHslEqual(color("hsla(60,100%,20%,-0.4)"), NaN, NaN, NaN, -0.4)
})

it("color(format) allows decimals for non-integer values", () => {
  assertRgbApproxEqual(color("rgb(20.0%,30.4%,51.2%)"), 51, 78, 131, 1)
  assertHslEqual(color("hsl(20.0,30.4%,51.2%)"), 20, 0.304, 0.512, 1)
})

it("color(format) allows leading decimal for hue, opacity and percentages", () => {
  assertHslEqual(color("hsl(.9,.3%,.5%)"), 0.9, 0.003, 0.005, 1)
  assertHslEqual(color("hsla(.9,.3%,.5%,.5)"), 0.9, 0.003, 0.005, 0.5)
  assertRgbApproxEqual(color("rgb(.1%,.2%,.3%)"), 0, 1, 1, 1)
  assertRgbApproxEqual(color("rgba(120,30,50,.5)"), 120, 30, 50, 0.5)
})

it("color(format) allows exponential format for hue, opacity and percentages", () => {
  assertHslEqual(color("hsl(1e1,2e1%,3e1%)"), 10, 0.2, 0.3, 1)
  assertHslEqual(color("hsla(9e-1,3e-1%,5e-1%,5e-1)"), 0.9, 0.003, 0.005, 0.5)
  assertRgbApproxEqual(color("rgb(1e-1%,2e-1%,3e-1%)"), 0, 1, 1, 1)
  assertRgbApproxEqual(color("rgba(120,30,50,1e-1)"), 120, 30, 50, 0.1)
})

it("color(format) does not allow decimals for integer values", () => {
  assert.strictEqual(color("rgb(120.5,30,50)"), null)
})

it("color(format) does not allow empty decimals", () => {
  assert.strictEqual(color("rgb(120.,30,50)"), null)
  assert.strictEqual(color("rgb(120.%,30%,50%)"), null)
  assert.strictEqual(color("rgba(120,30,50,1.)"), null)
  assert.strictEqual(color("rgba(12%,30%,50%,1.)"), null)
  assert.strictEqual(color("hsla(60,100%,20%,1.)"), null)
})

it("color(format) does not allow made-up names", () => {
  assert.strictEqual(color("bostock"), null)
})

it("color(format) allows achromatic colors", () => {
  assertRgbApproxEqual(color("rgba(0,0,0,0)"), NaN, NaN, NaN, 0)
  assertRgbApproxEqual(color("#0000"), NaN, NaN, NaN, 0)
  assertRgbApproxEqual(color("#00000000"), NaN, NaN, NaN, 0)
})

it("color(format) does not allow whitespace before open paren or percent sign", () => {
  assert.strictEqual(color("rgb (120,30,50)"), null)
  assert.strictEqual(color("rgb (12%,30%,50%)"), null)
  assert.strictEqual(color("hsl (120,30%,50%)"), null)
  assert.strictEqual(color("hsl(120,30 %,50%)"), null)
  assert.strictEqual(color("rgba (120,30,50,1)"), null)
  assert.strictEqual(color("rgba (12%,30%,50%,1)"), null)
  assert.strictEqual(color("hsla (120,30%,50%,1)"), null)
})

it("color(format) is case-insensitive", () => {
  assertRgbApproxEqual(color("aLiCeBlUE"), 240, 248, 255, 1)
  assertRgbApproxEqual(color("transPARENT"), NaN, NaN, NaN, 0)
  assertRgbApproxEqual(color(" #aBc\t\n"), 170, 187, 204, 1)
  assertRgbApproxEqual(color(" #aaBBCC\t\n"), 170, 187, 204, 1)
  assertRgbApproxEqual(color(" rGB(120,30,50)\t\n"), 120, 30, 50, 1)
  assertHslEqual(color(" HSl(120,30%,50%)\t\n"), 120, 0.3, 0.5, 1)
})

it("color(format) returns undefined RGB channel values for unknown formats", () => {
  assert.strictEqual(color("invalid"), null)
  assert.strictEqual(color("hasOwnProperty"), null)
  assert.strictEqual(color("__proto__"), null)
  assert.strictEqual(color("#ab"), null)
})

it("color(format).hex() returns a hexadecimal string", () => {
  assert.strictEqual(color("rgba(12%,34%,56%,0.4)").hex(), "#1f578f")
})
import assert from "assert"
import { color, cubehelix } from "../src/index.js"

it("cubehelix(…) returns an instance of cubehelix and color", () => {
  const c = cubehelix("steelblue")
  assert(c instanceof cubehelix)
  assert(c instanceof color)
})
import { assertLabEqual } from "./asserts.js"
import { gray } from "../src/index.js"

it("gray(l[, opacity]) is an alias for lab(l, 0, 0[, opacity])", () => {
  assertLabEqual(gray(120), 120, 0, 0, 1)
  assertLabEqual(gray(120, 0.5), 120, 0, 0, 0.5)
  assertLabEqual(gray(120, null), 120, 0, 0, 1)
  assertLabEqual(gray(120, undefined), 120, 0, 0, 1)
})
import assert from "assert"
import { assertHclEqual, assertRgbApproxEqual } from "./asserts.js"
import { color, hcl, hsl, lab, rgb } from "../src/index.js"

it("hcl(…) returns an instance of hcl and color", () => {
  const c = hcl(120, 40, 50)
  assert(c instanceof hcl)
  assert(c instanceof color)
})

it("hcl(…) exposes h, c, and l channel values", () => {
  assertHclEqual(hcl("#abc"), 252.37145234745182, 11.223567114593477, 74.96879980931759, 1)
})

it("hcl(…) returns defined hue and undefined chroma for black and white", () => {
  assertHclEqual(hcl("black"), NaN, NaN, 0, 1)
  assertHclEqual(hcl("#000"), NaN, NaN, 0, 1)
  assertHclEqual(hcl(lab("#000")), NaN, NaN, 0, 1)
  assertHclEqual(hcl("white"), NaN, NaN, 100, 1)
  assertHclEqual(hcl("#fff"), NaN, NaN, 100, 1)
  assertHclEqual(hcl(lab("#fff")), NaN, NaN, 100, 1)
})

it("hcl(…) returns undefined hue and zero chroma for gray", () => {
  assertHclEqual(hcl("gray"), NaN, 0, 53.585013, 1)
  assertHclEqual(hcl(lab("gray")), NaN, 0, 53.585013, 1)
})

it("hcl.toString() converts to RGB and formats as hexadecimal", () => {
  assert.strictEqual(hcl("#abcdef") + "", "rgb(171, 205, 239)")
  assert.strictEqual(hcl("moccasin") + "", "rgb(255, 228, 181)")
  assert.strictEqual(hcl("hsl(60, 100%, 20%)") + "", "rgb(102, 102, 0)")
  assert.strictEqual(hcl("rgb(12, 34, 56)") + "", "rgb(12, 34, 56)")
  assert.strictEqual(hcl(rgb(12, 34, 56)) + "", "rgb(12, 34, 56)")
  assert.strictEqual(hcl(hsl(60, 1, 0.2)) + "", "rgb(102, 102, 0)")
})

it("hcl.toString() reflects h, c and l channel values", () => {
  const c = hcl("#abc")
  ;(c.h += 10), (c.c += 1), (c.l -= 1)
  assert.strictEqual(c + "", "rgb(170, 183, 204)")
})

it("hcl.toString() treats undefined opacity as 1", () => {
  const c = hcl("#abc")
  c.opacity = NaN
  assert.strictEqual(c + "", "rgb(170, 187, 204)")
})

it("hcl.toString() treats undefined channel values as 0", () => {
  assert.strictEqual(hcl("invalid") + "", "rgb(0, 0, 0)")
  assert.strictEqual(hcl("#000") + "", "rgb(0, 0, 0)")
  assert.strictEqual(hcl("#ccc") + "", "rgb(204, 204, 204)")
  assert.strictEqual(hcl("#fff") + "", "rgb(255, 255, 255)")
  assert.strictEqual(hcl(NaN, 20, 40) + "", "rgb(94, 94, 94)") // equivalent to hcl(*, *, 40)
  assert.strictEqual(hcl(120, NaN, 40) + "", "rgb(94, 94, 94)")
  assert.strictEqual(hcl(0, NaN, 40) + "", "rgb(94, 94, 94)")
  assert.strictEqual(hcl(120, 50, NaN) + "", "rgb(0, 0, 0)") // equivalent to hcl(*, *, 0)
  assert.strictEqual(hcl(0, 50, NaN) + "", "rgb(0, 0, 0)")
  assert.strictEqual(hcl(120, 0, NaN) + "", "rgb(0, 0, 0)")
})

it("hcl(yellow) is displayable", () => {
  assert.strictEqual(hcl("yellow").displayable(), true)
  assert.strictEqual(hcl("yellow") + "", "rgb(255, 255, 0)")
})

it("hcl(h, c, l) does not wrap hue to [0,360)", () => {
  assertHclEqual(hcl(-10, 40, 50), -10, 40, 50, 1)
  assertHclEqual(hcl(0, 40, 50), 0, 40, 50, 1)
  assertHclEqual(hcl(360, 40, 50), 360, 40, 50, 1)
  assertHclEqual(hcl(370, 40, 50), 370, 40, 50, 1)
})

it("hcl(h, c, l) does not clamp l channel value", () => {
  assertHclEqual(hcl(120, 20, -10), 120, 20, -10, 1)
  assertHclEqual(hcl(120, 20, 0), 120, 20, 0, 1)
  assertHclEqual(hcl(120, 20, 100), 120, 20, 100, 1)
  assertHclEqual(hcl(120, 20, 110), 120, 20, 110, 1)
})

it("hcl(h, c, l, opacity) does not clamp opacity to [0,1]", () => {
  assertHclEqual(hcl(120, 20, 100, -0.2), 120, 20, 100, -0.2)
  assertHclEqual(hcl(120, 20, 110, 1.2), 120, 20, 110, 1.2)
})

it("hcl(h, c, l) coerces channel values to numbers", () => {
  assertHclEqual(hcl("120", "40", "50"), 120, 40, 50, 1)
})

it("hcl(h, c, l, opacity) coerces opacity to number", () => {
  assertHclEqual(hcl(120, 40, 50, "0.2"), 120, 40, 50, 0.2)
})

it("hcl(h, c, l) allows undefined channel values", () => {
  assertHclEqual(hcl(undefined, NaN, "foo"), NaN, NaN, NaN, 1)
  assertHclEqual(hcl(undefined, 40, 50), NaN, 40, 50, 1)
  assertHclEqual(hcl(42, undefined, 50), 42, NaN, 50, 1)
  assertHclEqual(hcl(42, 40, undefined), 42, 40, NaN, 1)
})

it("hcl(h, c, l, opacity) converts undefined opacity to 1", () => {
  assertHclEqual(hcl(10, 20, 30, null), 10, 20, 30, 1)
  assertHclEqual(hcl(10, 20, 30, undefined), 10, 20, 30, 1)
})

it("hcl(format) parses the specified format and converts to HCL", () => {
  assertHclEqual(hcl("#abcdef"), 254.0079700170605, 21.62257586147983, 80.77135418262527, 1)
  assertHclEqual(hcl("#abc"), 252.37145234745182, 11.223567114593477, 74.96879980931759, 1)
  assertHclEqual(hcl("rgb(12, 34, 56)"), 262.8292023352897, 17.30347233219686, 12.404844123471648, 1)
  assertHclEqual(hcl("rgb(12%, 34%, 56%)"), 266.117653326772, 37.03612078188506, 35.48300043476593, 1)
  assertHclEqual(hcl("rgba(12%, 34%, 56%, 0.4)"), 266.117653326772, 37.03612078188506, 35.48300043476593, 0.4)
  assertHclEqual(hcl("hsl(60,100%,20%)"), 99.57458688693686, 48.327323183108916, 41.97125732118659, 1)
  assertHclEqual(hcl("hsla(60,100%,20%,0.4)"), 99.57458688693686, 48.327323183108916, 41.97125732118659, 0.4)
  assertHclEqual(hcl("aliceblue"), 247.7353849904697, 4.681732046417135, 97.12294991108756, 1)
})

it("hcl(format) returns undefined channel values for unknown formats", () => {
  assertHclEqual(hcl("invalid"), NaN, NaN, NaN, NaN)
})

it("hcl(hcl) copies an HCL color", () => {
  const c1 = hcl(120, 30, 50, 0.4)
  const c2 = hcl(c1)
  assertHclEqual(c1, 120, 30, 50, 0.4)
  c1.h = c1.c = c1.l = c1.opacity = 0
  assertHclEqual(c1, 0, 0, 0, 0)
  assertHclEqual(c2, 120, 30, 50, 0.4)
})

it("hcl(lab) returns h = NaN if a and b are zero", () => {
  assertHclEqual(hcl(lab(0, 0, 0)), NaN, NaN, 0, 1)
  assertHclEqual(hcl(lab(50, 0, 0)), NaN, 0, 50, 1)
  assertHclEqual(hcl(lab(100, 0, 0)), NaN, NaN, 100, 1)
  assertHclEqual(hcl(lab(0, 10, 0)), 0, 10, 0, 1)
  assertHclEqual(hcl(lab(50, 10, 0)), 0, 10, 50, 1)
  assertHclEqual(hcl(lab(100, 10, 0)), 0, 10, 100, 1)
  assertHclEqual(hcl(lab(0, 0, 10)), 90, 10, 0, 1)
  assertHclEqual(hcl(lab(50, 0, 10)), 90, 10, 50, 1)
  assertHclEqual(hcl(lab(100, 0, 10)), 90, 10, 100, 1)
})

it("hcl(rgb) converts from RGB", () => {
  assertHclEqual(hcl(rgb(255, 0, 0, 0.4)), 40.85261277607024, 106.83899941284552, 54.29173376861782, 0.4)
})

it("hcl(color) converts from another colorspace via rgb()", () => {
  function TestColor() {}
  TestColor.prototype = Object.create(color.prototype)
  TestColor.prototype.rgb = function () {
    return rgb(12, 34, 56, 0.4)
  }
  TestColor.prototype.toString = function () {
    throw new Error("should use rgb, not toString")
  }
  assertHclEqual(hcl(new TestColor()), 262.8292023352897, 17.30347233219686, 12.404844123471648, 0.4)
})

it("hcl.brighter(k) returns a brighter color if k > 0", () => {
  const c = hcl("rgba(165, 42, 42, 0.4)")
  assertHclEqual(c.brighter(0.5), 32.28342524928155, 59.60231039142763, 47.149667346714935, 0.4)
  assertHclEqual(c.brighter(1), 32.28342524928155, 59.60231039142763, 56.149667346714935, 0.4)
  assertHclEqual(c.brighter(2), 32.28342524928155, 59.60231039142763, 74.14966734671493, 0.4)
})

it("hcl.brighter(k) returns a copy", () => {
  const c1 = hcl("rgba(70, 130, 180, 0.4)")
  const c2 = c1.brighter(1)
  assertHclEqual(c1, 255.71009124439382, 33.88100417355615, 51.98624890550498, 0.4)
  assertHclEqual(c2, 255.71009124439382, 33.88100417355615, 69.98624890550498, 0.4)
})

it("hcl.brighter() is equivalent to hcl.brighter(1)", () => {
  const c1 = hcl("rgba(70, 130, 180, 0.4)")
  const c2 = c1.brighter()
  const c3 = c1.brighter(1)
  assertHclEqual(c2, c3.h, c3.c, c3.l, 0.4)
})

it("hcl.brighter(k) is equivalent to hcl.darker(-k)", () => {
  const c1 = hcl("rgba(70, 130, 180, 0.4)")
  const c2 = c1.brighter(1.5)
  const c3 = c1.darker(-1.5)
  assertHclEqual(c2, c3.h, c3.c, c3.l, 0.4)
})

it("hcl.darker(k) returns a darker color if k > 0", () => {
  const c = hcl("rgba(165, 42, 42, 0.4)")
  assertHclEqual(c.darker(0.5), 32.28342524928155, 59.60231039142763, 29.149667346714935, 0.4)
  assertHclEqual(c.darker(1), 32.28342524928155, 59.60231039142763, 20.149667346714935, 0.4)
  assertHclEqual(c.darker(2), 32.28342524928155, 59.60231039142763, 2.149667346714935, 0.4)
})

it("hcl.darker(k) returns a copy", () => {
  const c1 = hcl("rgba(70, 130, 180, 0.4)")
  const c2 = c1.darker(1)
  assertHclEqual(c1, 255.71009124439382, 33.88100417355615, 51.98624890550498, 0.4)
  assertHclEqual(c2, 255.71009124439382, 33.88100417355615, 33.98624890550498, 0.4)
})

it("hcl.darker() is equivalent to hcl.darker(1)", () => {
  const c1 = hcl("rgba(70, 130, 180, 0.4)")
  const c2 = c1.darker()
  const c3 = c1.darker(1)
  assertHclEqual(c2, c3.h, c3.c, c3.l, 0.4)
})

it("hcl.darker(k) is equivalent to hcl.brighter(-k)", () => {
  const c1 = hcl("rgba(70, 130, 180, 0.4)")
  const c2 = c1.darker(1.5)
  const c3 = c1.brighter(-1.5)
  assertHclEqual(c2, c3.h, c3.c, c3.l, 0.4)
})

it("hcl.rgb() converts to RGB", () => {
  const c = hcl(120, 30, 50, 0.4)
  assertRgbApproxEqual(c.rgb(), 105, 126, 73, 0.4)
})
import assert from "assert"
import { color, hsl, rgb } from "../src/index.js"
import { assertHslEqual, assertRgbApproxEqual } from "./asserts.js"

it("hsl(…) returns an instance of hsl and color", () => {
  const c = hsl(120, 0.4, 0.5)
  assert(c instanceof hsl)
  assert(c instanceof color)
})

it("hsl(…) exposes h, s, and l channel values and opacity", () => {
  assertHslEqual(hsl("#abc"), 210, 0.25, 0.7333333, 1)
  assertHslEqual(hsl("hsla(60, 100%, 20%, 0.4)"), 60, 1, 0.2, 0.4)
})

it("hsl.toString() converts to RGB and formats as rgb(…) or rgba(…)", () => {
  assert.strictEqual(hsl("#abcdef") + "", "rgb(171, 205, 239)")
  assert.strictEqual(hsl("moccasin") + "", "rgb(255, 228, 181)")
  assert.strictEqual(hsl("hsl(60, 100%, 20%)") + "", "rgb(102, 102, 0)")
  assert.strictEqual(hsl("hsla(60, 100%, 20%, 0.4)") + "", "rgba(102, 102, 0, 0.4)")
  assert.strictEqual(hsl("rgb(12, 34, 56)") + "", "rgb(12, 34, 56)")
  assert.strictEqual(hsl(rgb(12, 34, 56)) + "", "rgb(12, 34, 56)")
  assert.strictEqual(hsl(hsl(60, 1, 0.2)) + "", "rgb(102, 102, 0)")
  assert.strictEqual(hsl(hsl(60, 1, 0.2, 0.4)) + "", "rgba(102, 102, 0, 0.4)")
})

it("hsl.formatRgb() formats as rgb(…) or rgba(…)", () => {
  assert.strictEqual(hsl("#abcdef").formatRgb(), "rgb(171, 205, 239)")
  assert.strictEqual(hsl("hsl(60, 100%, 20%)").formatRgb(), "rgb(102, 102, 0)")
  assert.strictEqual(hsl("rgba(12%, 34%, 56%, 0.4)").formatRgb(), "rgba(31, 87, 143, 0.4)")
  assert.strictEqual(hsl("hsla(60, 100%, 20%, 0.4)").formatRgb(), "rgba(102, 102, 0, 0.4)")
})

it("hsl.formatHsl() formats as hsl(…) or hsla(…)", () => {
  assert.strictEqual(hsl("#abcdef").formatHsl(), "hsl(210, 68%, 80.3921568627451%)")
  assert.strictEqual(hsl("hsl(60, 100%, 20%)").formatHsl(), "hsl(60, 100%, 20%)")
  assert.strictEqual(hsl("rgba(12%, 34%, 56%, 0.4)").formatHsl(), "hsla(210, 64.70588235294117%, 34%, 0.4)")
  assert.strictEqual(hsl("hsla(60, 100%, 20%, 0.4)").formatHsl(), "hsla(60, 100%, 20%, 0.4)")
})

it("hsl.formatHsl() clamps to the expected range", () => {
  assert.strictEqual(hsl(180, -100, -50).formatHsl(), "hsl(180, 0%, 0%)")
  assert.strictEqual(hsl(180, 150, 200).formatHsl(), "hsl(180, 100%, 100%)")
  assert.strictEqual(hsl(-90, 50, 50).formatHsl(), "hsl(270, 100%, 100%)")
  assert.strictEqual(hsl(420, 50, 50).formatHsl(), "hsl(60, 100%, 100%)")
})

it("hsl.formatHex() formats as #rrggbb", () => {
  assert.strictEqual(hsl("#abcdef").formatHex(), "#abcdef")
  assert.strictEqual(hsl("hsl(60, 100%, 20%)").formatHex(), "#666600")
  assert.strictEqual(hsl("rgba(12%, 34%, 56%, 0.4)").formatHex(), "#1f578f")
  assert.strictEqual(hsl("hsla(60, 100%, 20%, 0.4)").formatHex(), "#666600")
})

it("hsl.toString() reflects h, s and l channel values and opacity", () => {
  const c = hsl("#abc")
  ;(c.h += 10), (c.s += 0.01), (c.l -= 0.01), (c.opacity = 0.4)
  assert.strictEqual(c + "", "rgba(166, 178, 203, 0.4)")
})

it("hsl.toString() treats undefined channel values as 0", () => {
  assert.strictEqual(hsl("invalid") + "", "rgb(0, 0, 0)")
  assert.strictEqual(hsl("#000") + "", "rgb(0, 0, 0)")
  assert.strictEqual(hsl("#ccc") + "", "rgb(204, 204, 204)")
  assert.strictEqual(hsl("#fff") + "", "rgb(255, 255, 255)")
  assert.strictEqual(hsl(NaN, 0.5, 0.4) + "", "rgb(102, 102, 102)") // equivalent to hsl(*, 0, 0.4)
  assert.strictEqual(hsl(120, NaN, 0.4) + "", "rgb(102, 102, 102)")
  assert.strictEqual(hsl(NaN, NaN, 0.4) + "", "rgb(102, 102, 102)")
  assert.strictEqual(hsl(120, 0.5, NaN) + "", "rgb(0, 0, 0)") // equivalent to hsl(120, 0.5, 0)
})

it("hsl.toString() treats undefined opacity as 1", () => {
  const c = hsl("#abc")
  c.opacity = NaN
  assert.strictEqual(c + "", "rgb(170, 187, 204)")
})

it("hsl(h, s, l) does not wrap hue to [0,360)", () => {
  assertHslEqual(hsl(-10, 0.4, 0.5), -10, 0.4, 0.5, 1)
  assertHslEqual(hsl(0, 0.4, 0.5), 0, 0.4, 0.5, 1)
  assertHslEqual(hsl(360, 0.4, 0.5), 360, 0.4, 0.5, 1)
  assertHslEqual(hsl(370, 0.4, 0.5), 370, 0.4, 0.5, 1)
})

it("hsl(h, s, l) does not clamp s and l channel values to [0,1]", () => {
  assertHslEqual(hsl(120, -0.1, 0.5), 120, -0.1, 0.5, 1)
  assertHslEqual(hsl(120, 1.1, 0.5), 120, 1.1, 0.5, 1)
  assertHslEqual(hsl(120, 0.2, -0.1), 120, 0.2, -0.1, 1)
  assertHslEqual(hsl(120, 0.2, 1.1), 120, 0.2, 1.1, 1)
})

it("hsl(h, s, l).clamp() clamps channel values", () => {
  assertHslEqual(hsl(120, -0.1, -0.2).clamp(), 120, 0, 0, 1)
  assertHslEqual(hsl(120, 1.1, 1.2).clamp(), 120, 1, 1, 1)
  assertHslEqual(hsl(120, 2.1, 2.2).clamp(), 120, 1, 1, 1)
  assertHslEqual(hsl(420, -0.1, -0.2).clamp(), 60, 0, 0, 1)
  assertHslEqual(hsl(-420, -0.1, -0.2).clamp(), 300, 0, 0, 1)
  assert.strictEqual(hsl(-420, -0.1, -0.2, NaN).clamp().opacity, 1)
  assert.strictEqual(hsl(-420, -0.1, -0.2, 0.5).clamp().opacity, 0.5)
  assert.strictEqual(hsl(-420, -0.1, -0.2, -1).clamp().opacity, 0)
  assert.strictEqual(hsl(-420, -0.1, -0.2, 2).clamp().opacity, 1)
})

it("hsl(h, s, l, opacity) does not clamp opacity to [0,1]", () => {
  assertHslEqual(hsl(120, 0.1, 0.5, -0.2), 120, 0.1, 0.5, -0.2)
  assertHslEqual(hsl(120, 0.9, 0.5, 1.2), 120, 0.9, 0.5, 1.2)
})

it("hsl(h, s, l) coerces channel values to numbers", () => {
  assertHslEqual(hsl("120", ".4", ".5"), 120, 0.4, 0.5, 1)
})

it("hsl(h, s, l, opacity) coerces opacity to number", () => {
  assertHslEqual(hsl(120, 0.1, 0.5, "0.2"), 120, 0.1, 0.5, 0.2)
  assertHslEqual(hsl(120, 0.9, 0.5, "0.9"), 120, 0.9, 0.5, 0.9)
})

it("hsl(h, s, l) allows undefined channel values", () => {
  assertHslEqual(hsl(undefined, NaN, "foo"), NaN, NaN, NaN, 1)
  assertHslEqual(hsl(undefined, 0.4, 0.5), NaN, 0.4, 0.5, 1)
  assertHslEqual(hsl(42, undefined, 0.5), 42, NaN, 0.5, 1)
  assertHslEqual(hsl(42, 0.4, undefined), 42, 0.4, NaN, 1)
})

it("hsl(h, s, l, opacity) converts undefined opacity to 1", () => {
  assertHslEqual(hsl(10, 0.2, 0.3, null), 10, 0.2, 0.3, 1)
  assertHslEqual(hsl(10, 0.2, 0.3, undefined), 10, 0.2, 0.3, 1)
})

it("hsl(h, s, l) preserves explicit hue, even for grays", () => {
  assertHslEqual(hsl(0, 0, 0), 0, 0, 0, 1)
  assertHslEqual(hsl(42, 0, 0.5), 42, 0, 0.5, 1)
  assertHslEqual(hsl(118, 0, 1), 118, 0, 1, 1)
})

it("hsl(h, s, l) preserves explicit saturation, even for white or black", () => {
  assertHslEqual(hsl(0, 0, 0), 0, 0, 0, 1)
  assertHslEqual(hsl(0, 0.18, 0), 0, 0.18, 0, 1)
  assertHslEqual(hsl(0, 0.42, 1), 0, 0.42, 1, 1)
  assertHslEqual(hsl(0, 1, 1), 0, 1, 1, 1)
})

it("hsl(format) parses the specified format and converts to HSL", () => {
  assertHslEqual(hsl("#abcdef"), 210, 0.68, 0.8039215, 1)
  assertHslEqual(hsl("#abc"), 210, 0.25, 0.733333333, 1)
  assertHslEqual(hsl("rgb(12, 34, 56)"), 210, 0.647058, 0.1333333, 1)
  assertHslEqual(hsl("rgb(12%, 34%, 56%)"), 210, 0.647058, 0.34, 1)
  assertHslEqual(hsl("hsl(60,100%,20%)"), 60, 1, 0.2, 1)
  assertHslEqual(hsl("hsla(60,100%,20%,0.4)"), 60, 1, 0.2, 0.4)
  assertHslEqual(hsl("aliceblue"), 208, 1, 0.9705882, 1)
  assertHslEqual(hsl("transparent"), NaN, NaN, NaN, 0)
})

it("hsl(format) ignores the hue if the saturation is <= 0", () => {
  assertHslEqual(hsl("hsl(120,0%,20%)"), NaN, 0, 0.2, 1)
  assertHslEqual(hsl("hsl(120,-10%,20%)"), NaN, -0.1, 0.2, 1)
})

it("hsl(format) ignores the hue and saturation if the lightness is <= 0 or >= 1", () => {
  assertHslEqual(hsl("hsl(120,20%,-10%)"), NaN, NaN, -0.1, 1)
  assertHslEqual(hsl("hsl(120,20%,0%)"), NaN, NaN, 0.0, 1)
  assertHslEqual(hsl("hsl(120,20%,100%)"), NaN, NaN, 1.0, 1)
  assertHslEqual(hsl("hsl(120,20%,120%)"), NaN, NaN, 1.2, 1)
})

it("hsl(format) ignores all channels if the alpha is <= 0", () => {
  assertHslEqual(hsl("hsla(120,20%,10%,0)"), NaN, NaN, NaN, 0)
  assertHslEqual(hsl("hsla(120,20%,10%,-0.1)"), NaN, NaN, NaN, -0.1)
})

it("hsl(format) does not lose precision when parsing HSL formats", () => {
  assertHslEqual(hsl("hsl(325,50%,40%)"), 325, 0.5, 0.4, 1)
})

it("hsl(format) returns undefined channel values for unknown formats", () => {
  assertHslEqual(hsl("invalid"), NaN, NaN, NaN, NaN)
})

it("hsl(hsl) copies an HSL color", () => {
  const c1 = hsl("hsla(120,30%,50%,0.4)")
  const c2 = hsl(c1)
  assertHslEqual(c1, 120, 0.3, 0.5, 0.4)
  c1.h = c1.s = c1.l = c1.opacity = 0
  assertHslEqual(c1, 0, 0, 0, 0)
  assertHslEqual(c2, 120, 0.3, 0.5, 0.4)
})

it("hsl(rgb) converts from RGB", () => {
  assertHslEqual(hsl(rgb(255, 0, 0, 0.4)), 0, 1, 0.5, 0.4)
})

it("hsl(color) returns undefined hue and zero saturation for grays (but not white and black)", () => {
  assertHslEqual(hsl("gray"), NaN, 0, 0.5019608, 1)
  assertHslEqual(hsl("#ccc"), NaN, 0, 0.8, 1)
  assertHslEqual(hsl(rgb("gray")), NaN, 0, 0.5019608, 1)
})

it("hsl(color) returns undefined hue and saturation for black and white", () => {
  assertHslEqual(hsl("black"), NaN, NaN, 0, 1)
  assertHslEqual(hsl("#000"), NaN, NaN, 0, 1)
  assertHslEqual(hsl("white"), NaN, NaN, 1, 1)
  assertHslEqual(hsl("#fff"), NaN, NaN, 1, 1)
  assertHslEqual(hsl(rgb("#fff")), NaN, NaN, 1, 1)
})

it("hsl(color) converts from another colorspace via rgb()", () => {
  function TestColor() {}
  TestColor.prototype = Object.create(color.prototype)
  TestColor.prototype.rgb = function () {
    return rgb(12, 34, 56, 0.4)
  }
  TestColor.prototype.toString = function () {
    throw new Error("should use rgb, not toString")
  }
  assertHslEqual(hsl(new TestColor()), 210, 0.6470588, 0.1333334, 0.4)
})

it("hsl.displayable() returns true if the color is within the RGB gamut and the opacity is in [0,1]", () => {
  assert.strictEqual(hsl("white").displayable(), true)
  assert.strictEqual(hsl("red").displayable(), true)
  assert.strictEqual(hsl("black").displayable(), true)
  assert.strictEqual(hsl("invalid").displayable(), false)
  assert.strictEqual(hsl(NaN, NaN, 1).displayable(), true)
  assert.strictEqual(hsl(NaN, NaN, 1.5).displayable(), false)
  assert.strictEqual(hsl(120, -0.5, 0).displayable(), false)
  assert.strictEqual(hsl(120, 1.5, 0).displayable(), false)
  assert.strictEqual(hsl(0, 1, 1, 0).displayable(), true)
  assert.strictEqual(hsl(0, 1, 1, 1).displayable(), true)
  assert.strictEqual(hsl(0, 1, 1, -0.2).displayable(), false)
  assert.strictEqual(hsl(0, 1, 1, 1.2).displayable(), false)
})

it("hsl.brighter(k) returns a brighter color if k > 0", () => {
  const c = hsl("rgba(165, 42, 42, 0.4)")
  assertHslEqual(c.brighter(0.5), 0, 0.5942028, 0.4851222, 0.4)
  assertHslEqual(c.brighter(1), 0, 0.5942028, 0.5798319, 0.4)
  assertHslEqual(c.brighter(2), 0, 0.5942028, 0.8283313, 0.4)
})

it("hsl.brighter(k) returns a copy", () => {
  const c1 = hsl("rgba(70, 130, 180, 0.4)")
  const c2 = c1.brighter(1)
  assertHslEqual(c1, 207.272727, 0.44, 0.4901961, 0.4)
  assertHslEqual(c2, 207.272727, 0.44, 0.7002801, 0.4)
})

it("hsl.brighter() is equivalent to hsl.brighter(1)", () => {
  const c1 = hsl("rgba(70, 130, 180, 0.4)")
  const c2 = c1.brighter()
  const c3 = c1.brighter(1)
  assertHslEqual(c2, c3.h, c3.s, c3.l, 0.4)
})

it("hsl.brighter(k) is equivalent to hsl.darker(-k)", () => {
  const c1 = hsl("rgba(70, 130, 180, 0.4)")
  const c2 = c1.brighter(1.5)
  const c3 = c1.darker(-1.5)
  assertHslEqual(c2, c3.h, c3.s, c3.l, 0.4)
})

it('hsl("black").brighter() still returns black', () => {
  const c1 = hsl("black")
  const c2 = c1.brighter(1)
  assertHslEqual(c1, NaN, NaN, 0, 1)
  assertHslEqual(c2, NaN, NaN, 0, 1)
})

it("hsl.darker(k) returns a darker color if k > 0", () => {
  const c = hsl("rgba(165, 42, 42, 0.4)")
  assertHslEqual(c.darker(0.5), 0, 0.5942029, 0.3395855, 0.4)
  assertHslEqual(c.darker(1), 0, 0.5942029, 0.2841176, 0.4)
  assertHslEqual(c.darker(2), 0, 0.5942029, 0.1988823, 0.4)
})

it("hsl.darker(k) returns a copy", () => {
  const c1 = hsl("rgba(70, 130, 180, 0.4)")
  const c2 = c1.darker(1)
  assertHslEqual(c1, 207.272727, 0.44, 0.4901961, 0.4)
  assertHslEqual(c2, 207.272727, 0.44, 0.3431373, 0.4)
})

it("hsl.darker() is equivalent to hsl.darker(1)", () => {
  const c1 = hsl("rgba(70, 130, 180, 0.4)")
  const c2 = c1.darker()
  const c3 = c1.darker(1)
  assertHslEqual(c2, c3.h, c3.s, c3.l, 0.4)
})

it("hsl.darker(k) is equivalent to hsl.brighter(-k)", () => {
  const c1 = hsl("rgba(70, 130, 180, 0.4)")
  const c2 = c1.darker(1.5)
  const c3 = c1.brighter(-1.5)
  assertHslEqual(c2, c3.h, c3.s, c3.l, 0.4)
})

it("hsl.rgb() converts to RGB", () => {
  const c = hsl(120, 0.3, 0.5, 0.4)
  assertRgbApproxEqual(c.rgb(), 89, 166, 89, 0.4)
})

it("hsl.copy(…) returns a new hsl with the specified channel values", () => {
  const c = hsl(120, 0.3, 0.5, 0.4)
  assert.strictEqual(c.copy() instanceof hsl, true)
  assert.strictEqual(c.copy().formatHsl(), "hsla(120, 30%, 50%, 0.4)")
  assert.strictEqual(c.copy({ opacity: 1 }).formatHsl(), "hsl(120, 30%, 50%)")
  assert.strictEqual(c.copy({ h: 20 }).formatHsl(), "hsla(20, 30%, 50%, 0.4)")
  assert.strictEqual(c.copy({ h: 20, s: 0.4 }).formatHsl(), "hsla(20, 40%, 50%, 0.4)")
})
import assert from "assert"
import { color, hcl, hsl, lab, rgb } from "../src/index.js"
import { assertLabEqual, assertRgbApproxEqual } from "./asserts.js"

it("lab(…) returns an instance of lab and color", () => {
  const c = lab(120, 40, 50)
  assert(c instanceof lab)
  assert(c instanceof color)
})

it("lab(…) exposes l, a and b channel values and opacity", () => {
  assertLabEqual(lab("rgba(170, 187, 204, 0.4)"), 74.96879980931759, -3.398998724348956, -10.696507207853333, 0.4)
})

it("lab.toString() converts to RGB and formats as rgb(…) or rgba(…)", () => {
  assert.strictEqual(lab("#abcdef") + "", "rgb(171, 205, 239)")
  assert.strictEqual(lab("moccasin") + "", "rgb(255, 228, 181)")
  assert.strictEqual(lab("hsl(60, 100%, 20%)") + "", "rgb(102, 102, 0)")
  assert.strictEqual(lab("hsla(60, 100%, 20%, 0.4)") + "", "rgba(102, 102, 0, 0.4)")
  assert.strictEqual(lab("rgb(12, 34, 56)") + "", "rgb(12, 34, 56)")
  assert.strictEqual(lab(rgb(12, 34, 56)) + "", "rgb(12, 34, 56)")
  assert.strictEqual(lab(hsl(60, 1, 0.2)) + "", "rgb(102, 102, 0)")
  assert.strictEqual(lab(hsl(60, 1, 0.2, 0.4)) + "", "rgba(102, 102, 0, 0.4)")
})

it("lab.toString() reflects l, a and b channel values and opacity", () => {
  const c = lab("#abc")
  ;(c.l += 10), (c.a -= 10), (c.b += 10), (c.opacity = 0.4)
  assert.strictEqual(c + "", "rgba(184, 220, 213, 0.4)")
})

it("lab.toString() treats undefined channel values as 0", () => {
  assert.strictEqual(lab("invalid") + "", "rgb(0, 0, 0)")
  assert.strictEqual(lab(NaN, 0, 0) + "", "rgb(0, 0, 0)")
  assert.strictEqual(lab(50, NaN, 0) + "", "rgb(119, 119, 119)")
  assert.strictEqual(lab(50, 0, NaN) + "", "rgb(119, 119, 119)")
  assert.strictEqual(lab(50, NaN, NaN) + "", "rgb(119, 119, 119)")
})

it("lab.toString() treats undefined opacity as 1", () => {
  const c = lab("#abc")
  c.opacity = NaN
  assert.strictEqual(c + "", "rgb(170, 187, 204)")
})

it("lab(l, a, b) does not clamp l channel value", () => {
  assertLabEqual(lab(-10, 1, 2), -10, 1, 2, 1)
  assertLabEqual(lab(0, 1, 2), 0, 1, 2, 1)
  assertLabEqual(lab(100, 1, 2), 100, 1, 2, 1)
  assertLabEqual(lab(110, 1, 2), 110, 1, 2, 1)
})

it("lab(l, a, b, opacity) does not clamp opacity to [0,1]", () => {
  assertLabEqual(lab(50, 10, 20, -0.2), 50, 10, 20, -0.2)
  assertLabEqual(lab(50, 10, 20, 1.2), 50, 10, 20, 1.2)
})

it("lab(l, a, b) coerces channel values to numbers", () => {
  assertLabEqual(lab("50", "4", "-5"), 50, 4, -5, 1)
})

it("lab(l, a, b, opacity) coerces opacity to number", () => {
  assertLabEqual(lab(50, 4, -5, "0.2"), 50, 4, -5, 0.2)
})

it("lab(l, a, b) allows undefined channel values", () => {
  assertLabEqual(lab(undefined, NaN, "foo"), NaN, NaN, NaN, 1)
  assertLabEqual(lab(undefined, 4, -5), NaN, 4, -5, 1)
  assertLabEqual(lab(42, undefined, -5), 42, NaN, -5, 1)
  assertLabEqual(lab(42, 4, undefined), 42, 4, NaN, 1)
})

it("lab(l, a, b, opacity) converts undefined opacity to 1", () => {
  assertLabEqual(lab(10, 20, 30, null), 10, 20, 30, 1)
  assertLabEqual(lab(10, 20, 30, undefined), 10, 20, 30, 1)
})

it("lab(format) parses the specified format and converts to Lab", () => {
  assertLabEqual(lab("#abcdef"), 80.77135418262527, -5.957098328496224, -20.785782794739237, 1)
  assertLabEqual(lab("#abc"), 74.96879980931759, -3.398998724348956, -10.696507207853333, 1)
  assertLabEqual(lab("rgb(12, 34, 56)"), 12.404844123471648, -2.159950219712034, -17.168132391132946, 1)
  assertLabEqual(lab("rgb(12%, 34%, 56%)"), 35.48300043476593, -2.507637675606522, -36.95112983195855, 1)
  assertLabEqual(lab("rgba(12%, 34%, 56%, 0.4)"), 35.48300043476593, -2.507637675606522, -36.95112983195855, 0.4)
  assertLabEqual(lab("hsl(60,100%,20%)"), 41.97125732118659, -8.03835128380484, 47.65411917854332, 1)
  assertLabEqual(lab("hsla(60,100%,20%,0.4)"), 41.97125732118659, -8.03835128380484, 47.65411917854332, 0.4)
  assertLabEqual(lab("aliceblue"), 97.12294991108756, -1.773836604137824, -4.332680308569969, 1)
})

it("lab(format) returns undefined channel values for unknown formats", () => {
  assertLabEqual(lab("invalid"), NaN, NaN, NaN, NaN)
})

it("lab(lab) copies a Lab color", () => {
  const c1 = lab(50, 4, -5, 0.4)
  const c2 = lab(c1)
  assertLabEqual(c1, 50, 4, -5, 0.4)
  c1.l = c1.a = c1.b = c1.opacity = 0
  assertLabEqual(c1, 0, 0, 0, 0)
  assertLabEqual(c2, 50, 4, -5, 0.4)
})

it("lab(hcl(lab)) doesn’t lose a and b channels if luminance is zero", () => {
  assertLabEqual(lab(hcl(lab(0, 10, 0))), 0, 10, 0, 1)
})

it("lab(rgb) converts from RGB", () => {
  assertLabEqual(lab(rgb(255, 0, 0, 0.4)), 54.29173376861782, 80.8124553179771, 69.88504032350531, 0.4)
})

it("lab(color) converts from another colorspace via rgb()", () => {
  function TestColor() {}
  TestColor.prototype = Object.create(color.prototype)
  TestColor.prototype.rgb = function () {
    return rgb(12, 34, 56, 0.4)
  }
  TestColor.prototype.toString = function () {
    throw new Error("should use rgb, not toString")
  }
  assertLabEqual(lab(new TestColor()), 12.404844123471648, -2.159950219712034, -17.168132391132946, 0.4)
})

it("lab.brighter(k) returns a brighter color if k > 0", () => {
  const c = lab("rgba(165, 42, 42, 0.4)")
  assertLabEqual(c.brighter(0.5), 47.149667346714935, 50.388769337115, 31.834059255569358, 0.4)
  assertLabEqual(c.brighter(1), 56.149667346714935, 50.388769337115, 31.834059255569358, 0.4)
  assertLabEqual(c.brighter(2), 74.14966734671493, 50.388769337115, 31.834059255569358, 0.4)
})

it("lab.brighter(k) returns a copy", () => {
  const c1 = lab("rgba(70, 130, 180, 0.4)")
  const c2 = c1.brighter(1)
  assertLabEqual(c1, 51.98624890550498, -8.362792037014344, -32.832699449697685, 0.4)
  assertLabEqual(c2, 69.98624890550498, -8.362792037014344, -32.832699449697685, 0.4)
})

it("lab.brighter() is equivalent to lab.brighter(1)", () => {
  const c1 = lab("rgba(70, 130, 180, 0.4)")
  const c2 = c1.brighter()
  const c3 = c1.brighter(1)
  assertLabEqual(c2, c3.l, c3.a, c3.b, 0.4)
})

it("lab.brighter(k) is equivalent to lab.darker(-k)", () => {
  const c1 = lab("rgba(70, 130, 180, 0.4)")
  const c2 = c1.brighter(1.5)
  const c3 = c1.darker(-1.5)
  assertLabEqual(c2, c3.l, c3.a, c3.b, 0.4)
})

it("lab.darker(k) returns a darker color if k > 0", () => {
  const c = lab("rgba(165, 42, 42, 0.4)")
  assertLabEqual(c.darker(0.5), 29.149667346714935, 50.388769337115, 31.834059255569358, 0.4)
  assertLabEqual(c.darker(1), 20.149667346714935, 50.388769337115, 31.834059255569358, 0.4)
  assertLabEqual(c.darker(2), 2.149667346714935, 50.388769337115, 31.834059255569358, 0.4)
})

it("lab.darker(k) returns a copy", () => {
  const c1 = lab("rgba(70, 130, 180, 0.4)")
  const c2 = c1.darker(1)
  assertLabEqual(c1, 51.98624890550498, -8.362792037014344, -32.832699449697685, 0.4)
  assertLabEqual(c2, 33.98624890550498, -8.362792037014344, -32.832699449697685, 0.4)
})

it("lab.darker() is equivalent to lab.darker(1)", () => {
  const c1 = lab("rgba(70, 130, 180, 0.4)")
  const c2 = c1.darker()
  const c3 = c1.darker(1)
  assertLabEqual(c2, c3.l, c3.a, c3.b, 0.4)
})

it("lab.darker(k) is equivalent to lab.brighter(-k)", () => {
  const c1 = lab("rgba(70, 130, 180, 0.4)")
  const c2 = c1.darker(1.5)
  const c3 = c1.brighter(-1.5)
  assertLabEqual(c2, c3.l, c3.a, c3.b, 0.4)
})

it("lab.rgb() converts to RGB", () => {
  const c = lab(50, 4, -5, 0.4)
  assertRgbApproxEqual(c.rgb(), 123, 117, 128, 0.4)
})
import { lch, rgb } from "../src/index.js"
import { assertHclEqual } from "./asserts.js"

it("lch(color) is equivalent to hcl(color)", () => {
  assertHclEqual(lch("#abc"), 252.37145234745182, 11.223567114593477, 74.96879980931759, 1)
  assertHclEqual(lch(rgb("#abc")), 252.37145234745182, 11.223567114593477, 74.96879980931759, 1)
})

it("lch(l, c, h[, opacity]) is equivalent to hcl(h, c, l[, opacity])", () => {
  assertHclEqual(lch(74, 11, 252), 252, 11, 74, 1)
  assertHclEqual(lch(74, 11, 252), 252, 11, 74, 1)
  assertHclEqual(lch(74, 11, 252, null), 252, 11, 74, 1)
  assertHclEqual(lch(74, 11, 252, undefined), 252, 11, 74, 1)
  assertHclEqual(lch(74, 11, 252, 0.5), 252, 11, 74, 0.5)
})
import assert from "assert"
import { color, hsl, rgb } from "../src/index.js"
import { assertRgbApproxEqual, assertRgbEqual } from "./asserts.js"

it("rgb(…) returns an instance of rgb and color", () => {
  const c = rgb(70, 130, 180)
  assert(c instanceof rgb)
  assert(c instanceof color)
})

it("rgb(…) exposes r, g and b channel values and opacity", () => {
  assertRgbApproxEqual(rgb("#abc"), 170, 187, 204, 1)
  assertRgbApproxEqual(rgb("rgba(170, 187, 204, 0.4)"), 170, 187, 204, 0.4)
})

it("rgb.toString() formats as rgb(…) or rgba(…)", () => {
  assert.strictEqual(rgb("#abcdef") + "", "rgb(171, 205, 239)")
  assert.strictEqual(rgb("moccasin") + "", "rgb(255, 228, 181)")
  assert.strictEqual(rgb("hsl(60, 100%, 20%)") + "", "rgb(102, 102, 0)")
  assert.strictEqual(rgb("rgb(12, 34, 56)") + "", "rgb(12, 34, 56)")
  assert.strictEqual(rgb(rgb(12, 34, 56)) + "", "rgb(12, 34, 56)")
  assert.strictEqual(rgb(hsl(60, 1, 0.2)) + "", "rgb(102, 102, 0)")
  assert.strictEqual(rgb("rgba(12, 34, 56, 0.4)") + "", "rgba(12, 34, 56, 0.4)")
  assert.strictEqual(rgb("rgba(12%, 34%, 56%, 0.4)") + "", "rgba(31, 87, 143, 0.4)")
  assert.strictEqual(rgb("hsla(60, 100%, 20%, 0.4)") + "", "rgba(102, 102, 0, 0.4)")
})

it("rgb.formatRgb() formats as rgb(…) or rgba(…)", () => {
  assert.strictEqual(rgb("#abcdef").formatRgb(), "rgb(171, 205, 239)")
  assert.strictEqual(rgb("hsl(60, 100%, 20%)").formatRgb(), "rgb(102, 102, 0)")
  assert.strictEqual(rgb("rgba(12%, 34%, 56%, 0.4)").formatRgb(), "rgba(31, 87, 143, 0.4)")
  assert.strictEqual(rgb("hsla(60, 100%, 20%, 0.4)").formatRgb(), "rgba(102, 102, 0, 0.4)")
})

it("rgb.formatHsl() formats as hsl(…) or hsla(…)", () => {
  assert.strictEqual(rgb("#abcdef").formatHsl(), "hsl(210, 68%, 80.3921568627451%)")
  assert.strictEqual(rgb("hsl(60, 100%, 20%)").formatHsl(), "hsl(60, 100%, 20%)")
  assert.strictEqual(rgb("rgba(12%, 34%, 56%, 0.4)").formatHsl(), "hsla(210, 64.70588235294117%, 34%, 0.4)")
  assert.strictEqual(rgb("hsla(60, 100%, 20%, 0.4)").formatHsl(), "hsla(60, 100%, 20%, 0.4)")
})

it("rgb.formatHex() formats as #rrggbb", () => {
  assert.strictEqual(rgb("#abcdef").formatHex(), "#abcdef")
  assert.strictEqual(rgb("hsl(60, 100%, 20%)").formatHex(), "#666600")
  assert.strictEqual(rgb("rgba(12%, 34%, 56%, 0.4)").formatHex(), "#1f578f")
  assert.strictEqual(rgb("hsla(60, 100%, 20%, 0.4)").formatHex(), "#666600")
})

it("rgb.formatHex8() formats as #rrggbbaa", () => {
  assert.strictEqual(rgb("#abcdef").formatHex8(), "#abcdefff")
  assert.strictEqual(rgb("hsl(60, 100%, 20%)").formatHex8(), "#666600ff")
  assert.strictEqual(rgb("rgba(12%, 34%, 56%, 0.4)").formatHex8(), "#1f578f66")
  assert.strictEqual(rgb("hsla(60, 100%, 20%, 0.4)").formatHex8(), "#66660066")
})

it("rgb.hex() is an alias for rgb.formatHex()", () => {
  assert.strictEqual(color.prototype.hex, color.prototype.formatHex)
  assert.strictEqual(rgb.prototype.hex, rgb.prototype.formatHex)
})

it("rgb.toString() reflects r, g and b channel values and opacity", () => {
  const c = rgb("#abc")
  ++c.r, ++c.g, ++c.b, (c.opacity = 0.5)
  assert.strictEqual(c + "", "rgba(171, 188, 205, 0.5)")
})

it("rgb.toString() treats undefined channel values as 0", () => {
  assert.strictEqual(rgb("invalid") + "", "rgb(0, 0, 0)")
  assert.strictEqual(rgb(NaN, 12, 34) + "", "rgb(0, 12, 34)")
})

it("rgb.toString() treats undefined opacity as 1", () => {
  const c = rgb("#abc")
  ++c.r, ++c.g, ++c.b, (c.opacity = NaN)
  assert.strictEqual(c + "", "rgb(171, 188, 205)")
})

it("rgb.toString() clamps r, g, b and opacity channel values", () => {
  assert.strictEqual(rgb(-1, 2, 3) + "", "rgb(0, 2, 3)")
  assert.strictEqual(rgb(2, -1, 3) + "", "rgb(2, 0, 3)")
  assert.strictEqual(rgb(2, 3, -1) + "", "rgb(2, 3, 0)")
  assert.strictEqual(rgb(2, 3, -1, -0.2) + "", "rgba(2, 3, 0, 0)")
  assert.strictEqual(rgb(2, 3, -1, 1.2) + "", "rgb(2, 3, 0)")
})

it("rgb.toString() rounds r, g and b channel values", () => {
  assert.strictEqual(rgb(0.5, 2.0, 3.0) + "", "rgb(1, 2, 3)")
  assert.strictEqual(rgb(2.0, 0.5, 3.0) + "", "rgb(2, 1, 3)")
  assert.strictEqual(rgb(2.0, 3.0, 0.5) + "", "rgb(2, 3, 1)")
})

it("rgb(r, g, b) does not round channel values", () => {
  assertRgbEqual(rgb(1.2, 2.6, 42.9), 1.2, 2.6, 42.9, 1)
})

it("rgb(r, g, b) does not clamp channel values", () => {
  assertRgbApproxEqual(rgb(-10, -20, -30), -10, -20, -30, 1)
  assertRgbApproxEqual(rgb(300, 400, 500), 300, 400, 500, 1)
})

it("rgb(r, g, b).clamp() rounds and clamps channel values", () => {
  assertRgbApproxEqual(rgb(-10, -20, -30).clamp(), 0, 0, 0, 1)
  assertRgbApproxEqual(rgb(10.5, 20.5, 30.5).clamp(), 11, 21, 31, 1)
  assertRgbApproxEqual(rgb(300, 400, 500).clamp(), 255, 255, 255, 1)
  assert.strictEqual(rgb(10.5, 20.5, 30.5, -1).clamp().opacity, 0)
  assert.strictEqual(rgb(10.5, 20.5, 30.5, 0.5).clamp().opacity, 0.5)
  assert.strictEqual(rgb(10.5, 20.5, 30.5, 2).clamp().opacity, 1)
  assert.strictEqual(rgb(10.5, 20.5, 30.5, NaN).clamp().opacity, 1)
})

it("rgb(r, g, b, opacity) does not clamp opacity", () => {
  assertRgbApproxEqual(rgb(-10, -20, -30, -0.2), -10, -20, -30, -0.2)
  assertRgbApproxEqual(rgb(300, 400, 500, 1.2), 300, 400, 500, 1.2)
})

it("rgb(r, g, b) coerces channel values to numbers", () => {
  assertRgbApproxEqual(rgb("12", "34", "56"), 12, 34, 56, 1)
  assertRgbApproxEqual(rgb(null, null, null), 0, 0, 0, 1)
})

it("rgb(r, g, b, opacity) coerces opacity to number", () => {
  assertRgbEqual(rgb(-10, -20, -30, "-0.2"), -10, -20, -30, -0.2)
  assertRgbEqual(rgb(300, 400, 500, "1.2"), 300, 400, 500, 1.2)
})

it("rgb(r, g, b) allows undefined channel values", () => {
  assertRgbApproxEqual(rgb(undefined, NaN, "foo"), NaN, NaN, NaN, 1)
  assertRgbApproxEqual(rgb(undefined, 42, 56), NaN, 42, 56, 1)
  assertRgbApproxEqual(rgb(42, undefined, 56), 42, NaN, 56, 1)
  assertRgbApproxEqual(rgb(42, 56, undefined), 42, 56, NaN, 1)
})

it("rgb(r, g, b, opacity) converts undefined opacity to 1", () => {
  assertRgbApproxEqual(rgb(10, 20, 30, null), 10, 20, 30, 1)
  assertRgbApproxEqual(rgb(10, 20, 30, undefined), 10, 20, 30, 1)
})

it("rgb(format) parses the specified format and converts to RGB", () => {
  assertRgbApproxEqual(rgb("#abcdef"), 171, 205, 239, 1)
  assertRgbApproxEqual(rgb("#abc"), 170, 187, 204, 1)
  assertRgbApproxEqual(rgb("rgb(12, 34, 56)"), 12, 34, 56, 1)
  assertRgbApproxEqual(rgb("rgb(12%, 34%, 56%)"), 31, 87, 143, 1)
  assertRgbApproxEqual(rgb("hsl(60,100%,20%)"), 102, 102, 0, 1)
  assertRgbApproxEqual(rgb("aliceblue"), 240, 248, 255, 1)
  assertRgbApproxEqual(rgb("hsla(60,100%,20%,0.4)"), 102, 102, 0, 0.4)
})

it("rgb(format) ignores all channels if the alpha is <= 0", () => {
  assertRgbApproxEqual(rgb("rgba(12,34,45,0)"), NaN, NaN, NaN, 0)
  assertRgbApproxEqual(rgb("rgba(12,34,45,-0.1)"), NaN, NaN, NaN, -0.1)
})

it("rgb(format) returns undefined channel values for unknown formats", () => {
  assertRgbApproxEqual(rgb("invalid"), NaN, NaN, NaN, NaN)
})

it("rgb(rgb) copies an RGB color", () => {
  const c1 = rgb("rgba(70, 130, 180, 0.4)")
  const c2 = rgb(c1)
  assertRgbApproxEqual(c1, 70, 130, 180, 0.4)
  c1.r = c1.g = c1.b = c1.opacity = 0
  assertRgbApproxEqual(c1, 0, 0, 0, 0)
  assertRgbApproxEqual(c2, 70, 130, 180, 0.4)
})

it("rgb(hsl) converts from HSL", () => {
  assertRgbApproxEqual(rgb(hsl(0, 1, 0.5)), 255, 0, 0, 1)
  assertRgbApproxEqual(rgb(hsl(0, 1, 0.5, 0.4)), 255, 0, 0, 0.4)
})

it("rgb(color) converts from another colorspace via rgb()", () => {
  function TestColor() {}
  TestColor.prototype = Object.create(color.prototype)
  TestColor.prototype.rgb = function () {
    return rgb(12, 34, 56, 0.4)
  }
  TestColor.prototype.toString = function () {
    throw new Error("should use rgb, not toString")
  }
  assertRgbApproxEqual(rgb(new TestColor()), 12, 34, 56, 0.4)
})

it("rgb.displayable() returns true if the color is within the RGB gamut and opacity is in [0,1]", () => {
  assert.strictEqual(rgb("white").displayable(), true)
  assert.strictEqual(rgb("red").displayable(), true)
  assert.strictEqual(rgb("black").displayable(), true)
  assert.strictEqual(rgb("invalid").displayable(), false)
  assert.strictEqual(rgb(-1, 0, 0).displayable(), false)
  assert.strictEqual(rgb(0, -1, 0).displayable(), false)
  assert.strictEqual(rgb(0, 0, -1).displayable(), false)
  assert.strictEqual(rgb(256, 0, 0).displayable(), false)
  assert.strictEqual(rgb(0, 256, 0).displayable(), false)
  assert.strictEqual(rgb(0, 0, 256).displayable(), false)
  assert.strictEqual(rgb(0, 0, 255, 0).displayable(), true)
  assert.strictEqual(rgb(0, 0, 255, 1.2).displayable(), false)
  assert.strictEqual(rgb(0, 0, 255, -0.2).displayable(), false)
})

it("rgb.brighter(k) returns a brighter color if k > 0", () => {
  const c = rgb("rgba(165, 42, 42, 0.4)")
  assertRgbApproxEqual(c.brighter(0.5), 197, 50, 50, 0.4)
  assertRgbApproxEqual(c.brighter(1), 236, 60, 60, 0.4)
  assertRgbApproxEqual(c.brighter(2), 337, 86, 86, 0.4)
})

it("rgb.brighter(k) returns a copy", () => {
  const c1 = rgb("rgba(70, 130, 180, 0.4)")
  const c2 = c1.brighter(1)
  assertRgbApproxEqual(c1, 70, 130, 180, 0.4)
  assertRgbApproxEqual(c2, 100, 186, 257, 0.4)
})

it("rgb.brighter() is equivalent to rgb.brighter(1)", () => {
  const c1 = rgb("rgba(70, 130, 180, 0.4)")
  const c2 = c1.brighter()
  const c3 = c1.brighter(1)
  assertRgbApproxEqual(c2, c3.r, c3.g, c3.b, 0.4)
})

it("rgb.brighter(k) is equivalent to rgb.darker(-k)", () => {
  const c1 = rgb("rgba(70, 130, 180, 0.4)")
  const c2 = c1.brighter(1.5)
  const c3 = c1.darker(-1.5)
  assertRgbApproxEqual(c2, c3.r, c3.g, c3.b, 0.4)
})

it('rgb("black").brighter() still returns black', () => {
  const c1 = rgb("black")
  const c2 = c1.brighter(1)
  assertRgbApproxEqual(c1, 0, 0, 0, 1)
  assertRgbApproxEqual(c2, 0, 0, 0, 1)
})

it("rgb.darker(k) returns a darker color if k > 0", () => {
  const c = rgb("rgba(165, 42, 42, 0.4)")
  assertRgbApproxEqual(c.darker(0.5), 138, 35, 35, 0.4)
  assertRgbApproxEqual(c.darker(1), 115, 29, 29, 0.4)
  assertRgbApproxEqual(c.darker(2), 81, 21, 21, 0.4)
})

it("rgb.darker(k) returns a copy", () => {
  const c1 = rgb("rgba(70, 130, 180, 0.4)")
  const c2 = c1.darker(1)
  assertRgbApproxEqual(c1, 70, 130, 180, 0.4)
  assertRgbApproxEqual(c2, 49, 91, 126, 0.4)
})

it("rgb.darker() is equivalent to rgb.darker(1)", () => {
  const c1 = rgb("rgba(70, 130, 180, 0.4)")
  const c2 = c1.darker()
  const c3 = c1.darker(1)
  assertRgbApproxEqual(c2, c3.r, c3.g, c3.b, 0.4)
})

it("rgb.darker(k) is equivalent to rgb.brighter(-k)", () => {
  const c1 = rgb("rgba(70, 130, 180, 0.4)")
  const c2 = c1.darker(1.5)
  const c3 = c1.brighter(-1.5)
  assertRgbApproxEqual(c2, c3.r, c3.g, c3.b, 0.4)
})

it("rgb.rgb() returns this", () => {
  const c = rgb(70, 130, 180)
  assert.strictEqual(c.rgb(), c)
})

it("rgb.copy(…) returns a new rgb with the specified channel values", () => {
  const c = rgb(70, 130, 180)
  assert.strictEqual(c.copy() instanceof rgb, true)
  assert.strictEqual(c.copy() + "", "rgb(70, 130, 180)")
  assert.strictEqual(c.copy({ opacity: 0.2 }) + "", "rgba(70, 130, 180, 0.2)")
  assert.strictEqual(c.copy({ r: 20 }) + "", "rgb(20, 130, 180)")
  assert.strictEqual(c.copy({ r: 20, g: 40 }) + "", "rgb(20, 40, 180)")
})
