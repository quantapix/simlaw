import assert from "assert"
import { interpolateArray } from "../src/index.js"

it("interpolateArray(a, b) interpolates defined elements in a and b", () => {
  assert.deepStrictEqual(interpolateArray([2, 12], [4, 24])(0.5), [3, 18])
})

it("interpolateArray(a, b) interpolates nested objects and arrays", () => {
  assert.deepStrictEqual(interpolateArray([[2, 12]], [[4, 24]])(0.5), [[3, 18]])
  assert.deepStrictEqual(interpolateArray([{ foo: [2, 12] }], [{ foo: [4, 24] }])(0.5), [{ foo: [3, 18] }])
})

it("interpolateArray(a, b) ignores elements in a that are not in b", () => {
  assert.deepStrictEqual(interpolateArray([2, 12, 12], [4, 24])(0.5), [3, 18])
})

it("interpolateArray(a, b) uses constant elements in b that are not in a", () => {
  assert.deepStrictEqual(interpolateArray([2, 12], [4, 24, 12])(0.5), [3, 18, 12])
})

it("interpolateArray(a, b) treats undefined as an empty array", () => {
  assert.deepStrictEqual(interpolateArray(undefined, [2, 12])(0.5), [2, 12])
  assert.deepStrictEqual(interpolateArray([2, 12], undefined)(0.5), [])
  assert.deepStrictEqual(interpolateArray(undefined, undefined)(0.5), [])
})

it("interpolateArray(a, b) interpolates array-like objects", () => {
  const array = new Float64Array(2)
  const args = (function () {
    return arguments
  })(2, 12)
  array[0] = 2
  array[1] = 12
  assert.deepStrictEqual(interpolateArray(array, [4, 24])(0.5), [3, 18])
  assert.deepStrictEqual(interpolateArray(args, [4, 24])(0.5), [3, 18])
})

it("interpolateArray(a, b) gives exact ends for t=0 and t=1", () => {
  const a = [2e42],
    b = [335]
  assert.deepStrictEqual(interpolateArray(a, b)(1), b)
  assert.deepStrictEqual(interpolateArray(a, b)(0), a)
})
import assert from "assert"

export function assertInDelta(actual, expected, delta = 1e-6) {
  assert(inDelta(actual, expected, delta), `${actual} should be within ${delta} of ${expected}`)
}

function inDelta(actual, expected, delta) {
  return (Array.isArray(expected) ? inDeltaArray : typeof expected === "object" ? inDeltaObject : inDeltaNumber)(
    actual,
    expected,
    delta
  )
}

function inDeltaArray(actual, expected, delta) {
  let n = expected.length,
    i = -1
  if (actual.length !== n) return false
  while (++i < n) if (!inDelta(actual[i], expected[i], delta)) return false
  return true
}

function inDeltaObject(actual, expected, delta) {
  for (let i in expected) if (!inDelta(actual[i], expected[i], delta)) return false
  for (let i in actual) if (!(i in expected)) return false
  return true
}

function inDeltaNumber(actual, expected, delta) {
  return actual >= expected - delta && actual <= expected + delta
}
import assert from "assert"
import { cubehelix, hcl, rgb } from "d3-color"
import { interpolateCubehelix } from "../src/index.js"

it("interpolateCubehelix(a, b) converts a and b to Cubehelix colors", () => {
  assert.strictEqual(interpolateCubehelix("steelblue", "brown")(0), rgb("steelblue") + "")
  assert.strictEqual(interpolateCubehelix("steelblue", hcl("brown"))(1), rgb("brown") + "")
  assert.strictEqual(interpolateCubehelix("steelblue", rgb("brown"))(1), rgb("brown") + "")
})

it("interpolateCubehelix(a, b) interpolates in Cubehelix and returns an RGB string", () => {
  assert.strictEqual(interpolateCubehelix("steelblue", "#f00")(0.2), "rgb(88, 100, 218)")
  assert.strictEqual(
    interpolateCubehelix("rgba(70, 130, 180, 1)", "rgba(255, 0, 0, 0.2)")(0.2),
    "rgba(88, 100, 218, 0.84)"
  )
})

it("interpolateCubehelix.gamma(3)(a, b) returns the expected values", () => {
  assert.strictEqual(interpolateCubehelix.gamma(3)("steelblue", "#f00")(0.2), "rgb(96, 107, 228)")
})

it("interpolateCubehelix.gamma(g) coerces the specified gamma to a number", () => {
  assert.strictEqual(
    interpolateCubehelix.gamma({
      valueOf: function () {
        return 3
      },
    })(
      "steelblue",
      "#f00"
    )(0.2),
    "rgb(96, 107, 228)"
  )
})

it("interpolateCubehelix(a, b) is equivalent to interpolateCubehelix.gamma(1)(a, b)", () => {
  const i0 = interpolateCubehelix.gamma(1)("purple", "orange"),
    i1 = interpolateCubehelix("purple", "orange")
  assert.strictEqual(i1(0.0), i0(0.0))
  assert.strictEqual(i1(0.2), i0(0.2))
  assert.strictEqual(i1(0.4), i0(0.4))
  assert.strictEqual(i1(0.6), i0(0.6))
  assert.strictEqual(i1(0.8), i0(0.8))
  assert.strictEqual(i1(1.0), i0(1.0))
})

it("interpolateCubehelix(a, b) uses the shortest path when interpolating hue difference greater than 180°", () => {
  const i = interpolateCubehelix("purple", "orange")
  assert.strictEqual(i(0.0), "rgb(128, 0, 128)")
  assert.strictEqual(i(0.2), "rgb(208, 1, 127)")
  assert.strictEqual(i(0.4), "rgb(255, 17, 93)")
  assert.strictEqual(i(0.6), "rgb(255, 52, 43)")
  assert.strictEqual(i(0.8), "rgb(255, 105, 5)")
  assert.strictEqual(i(1.0), "rgb(255, 165, 0)")
})

it("interpolateCubehelix(a, b) uses a’s hue when b’s hue is undefined", () => {
  assert.strictEqual(interpolateCubehelix("#f60", cubehelix(NaN, NaN, 0))(0.5), "rgb(162, 41, 0)")
  assert.strictEqual(interpolateCubehelix("#6f0", cubehelix(NaN, NaN, 0))(0.5), "rgb(3, 173, 0)")
})

it("interpolateCubehelix(a, b) uses b’s hue when a’s hue is undefined", () => {
  assert.strictEqual(interpolateCubehelix(cubehelix(NaN, NaN, 0), "#f60")(0.5), "rgb(162, 41, 0)")
  assert.strictEqual(interpolateCubehelix(cubehelix(NaN, NaN, 0), "#6f0")(0.5), "rgb(3, 173, 0)")
})

it("interpolateCubehelix(a, b) uses a’s chroma when b’s chroma is undefined", () => {
  assert.strictEqual(interpolateCubehelix("#ccc", cubehelix(NaN, NaN, 0))(0.5), "rgb(102, 102, 102)")
  assert.strictEqual(interpolateCubehelix("#f00", cubehelix(NaN, NaN, 0))(0.5), "rgb(147, 0, 0)")
})

it("interpolateCubehelix(a, b) uses b’s chroma when a’s chroma is undefined", () => {
  assert.strictEqual(interpolateCubehelix(cubehelix(NaN, NaN, 0), "#ccc")(0.5), "rgb(102, 102, 102)")
  assert.strictEqual(interpolateCubehelix(cubehelix(NaN, NaN, 0), "#f00")(0.5), "rgb(147, 0, 0)")
})

it("interpolateCubehelix(a, b) uses b’s luminance when a’s luminance is undefined", () => {
  assert.strictEqual(interpolateCubehelix(null, cubehelix(20, 1.5, 0.5))(0.5), "rgb(248, 93, 0)")
})

it("interpolateCubehelix(a, b) uses a’s luminance when b’s luminance is undefined", () => {
  assert.strictEqual(interpolateCubehelix(cubehelix(20, 1.5, 0.5), null)(0.5), "rgb(248, 93, 0)")
})
import assert from "assert"
import { cubehelix, hcl, rgb } from "d3-color"
import { interpolateCubehelixLong } from "../src/index.js"

it("interpolateCubehelixLong(a, b) converts a and b to Cubehelix colors", () => {
  assert.strictEqual(interpolateCubehelixLong("steelblue", "brown")(0), rgb("steelblue") + "")
  assert.strictEqual(interpolateCubehelixLong("steelblue", hcl("brown"))(1), rgb("brown") + "")
  assert.strictEqual(interpolateCubehelixLong("steelblue", rgb("brown"))(1), rgb("brown") + "")
})

it("interpolateCubehelixLong(a, b) interpolates in Cubehelix and returns an RGB string", () => {
  assert.strictEqual(interpolateCubehelixLong("steelblue", "#f00")(0.2), "rgb(88, 100, 218)")
  assert.strictEqual(
    interpolateCubehelixLong("rgba(70, 130, 180, 1)", "rgba(255, 0, 0, 0.2)")(0.2),
    "rgba(88, 100, 218, 0.84)"
  )
})

it("interpolateCubehelixLong.gamma(3)(a, b) returns the expected values", () => {
  assert.strictEqual(interpolateCubehelixLong.gamma(3)("steelblue", "#f00")(0.2), "rgb(96, 107, 228)")
})

it("interpolateCubehelixLong.gamma(g) coerces the specified gamma to a number", () => {
  assert.strictEqual(
    interpolateCubehelixLong.gamma({
      valueOf: function () {
        return 3
      },
    })(
      "steelblue",
      "#f00"
    )(0.2),
    "rgb(96, 107, 228)"
  )
})

it("interpolateCubehelixLong(a, b) is equivalent to interpolateCubehelixLong.gamma(1)(a, b)", () => {
  const i0 = interpolateCubehelixLong.gamma(1)("purple", "orange"),
    i1 = interpolateCubehelixLong("purple", "orange")
  assert.strictEqual(i1(0.0), i0(0.0))
  assert.strictEqual(i1(0.2), i0(0.2))
  assert.strictEqual(i1(0.4), i0(0.4))
  assert.strictEqual(i1(0.6), i0(0.6))
  assert.strictEqual(i1(0.8), i0(0.8))
  assert.strictEqual(i1(1.0), i0(1.0))
})
it("interpolateCubehelixLong(a, b) uses the longest path when interpolating hue difference greater than 180°", () => {
  const i = interpolateCubehelixLong("purple", "orange")
  assert.strictEqual(i(0.0), "rgb(128, 0, 128)")
  assert.strictEqual(i(0.2), "rgb(63, 54, 234)")
  assert.strictEqual(i(0.4), "rgb(0, 151, 217)")
  assert.strictEqual(i(0.6), "rgb(0, 223, 83)")
  assert.strictEqual(i(0.8), "rgb(79, 219, 0)")
  assert.strictEqual(i(1.0), "rgb(255, 165, 0)")
})

it("interpolateCubehelixLong(a, b) uses a’s hue when b’s hue is undefined", () => {
  assert.strictEqual(interpolateCubehelixLong("#f60", hcl(NaN, NaN, 0))(0.5), "rgb(162, 41, 0)")
  assert.strictEqual(interpolateCubehelixLong("#6f0", hcl(NaN, NaN, 0))(0.5), "rgb(3, 173, 0)")
})

it("interpolateCubehelixLong(a, b) uses b’s hue when a’s hue is undefined", () => {
  assert.strictEqual(interpolateCubehelixLong(hcl(NaN, NaN, 0), "#f60")(0.5), "rgb(162, 41, 0)")
  assert.strictEqual(interpolateCubehelixLong(hcl(NaN, NaN, 0), "#6f0")(0.5), "rgb(3, 173, 0)")
})

it("interpolateCubehelixLong(a, b) uses a’s chroma when b’s chroma is undefined", () => {
  assert.strictEqual(interpolateCubehelixLong("#ccc", hcl(NaN, NaN, 0))(0.5), "rgb(102, 102, 102)")
  assert.strictEqual(interpolateCubehelixLong("#f00", hcl(NaN, NaN, 0))(0.5), "rgb(147, 0, 0)")
})

it("interpolateCubehelixLong(a, b) uses b’s chroma when a’s chroma is undefined", () => {
  assert.strictEqual(interpolateCubehelixLong(hcl(NaN, NaN, 0), "#ccc")(0.5), "rgb(102, 102, 102)")
  assert.strictEqual(interpolateCubehelixLong(hcl(NaN, NaN, 0), "#f00")(0.5), "rgb(147, 0, 0)")
})

it("interpolateCubehelixLong(a, b) uses b’s luminance when a’s luminance is undefined", () => {
  assert.strictEqual(interpolateCubehelixLong(null, cubehelix(20, 1.5, 0.5))(0.5), "rgb(248, 93, 0)")
})

it("interpolateCubehelixLong(a, b) uses a’s luminance when b’s luminance is undefined", () => {
  assert.strictEqual(interpolateCubehelixLong(cubehelix(20, 1.5, 0.5), null)(0.5), "rgb(248, 93, 0)")
})
import assert from "assert"
import { interpolateDate } from "../src/index.js"

it("interpolateDate(a, b) interpolates between two dates a and b", () => {
  const i = interpolateDate(new Date(2000, 0, 1), new Date(2000, 0, 2))
  assert.strictEqual(i(0.0) instanceof Date, true)
  assert.strictEqual(i(0.5) instanceof Date, true)
  assert.strictEqual(i(1.0) instanceof Date, true)
  assert.strictEqual(+i(0.2), +new Date(2000, 0, 1, 4, 48))
  assert.strictEqual(+i(0.4), +new Date(2000, 0, 1, 9, 36))
})

it("interpolateDate(a, b) reuses the output datea", () => {
  const i = interpolateDate(new Date(2000, 0, 1), new Date(2000, 0, 2))
  assert.strictEqual(i(0.2), i(0.4))
})

it("interpolateDate(a, b) gives exact ends for t=0 and t=1", () => {
  const a = new Date(1e8 * 24 * 60 * 60 * 1000),
    b = new Date(-1e8 * 24 * 60 * 60 * 1000 + 1)
  assert.strictEqual(+interpolateDate(a, b)(1), +b)
  assert.strictEqual(+interpolateDate(a, b)(0), +a)
})
import assert from "assert"
import { interpolateDiscrete } from "../src/index.js"

it("interpolateDiscrete(values)(t) returns the expected values", () => {
  const i = interpolateDiscrete("abcde".split(""))
  assert.strictEqual(i(-1), "a")
  assert.strictEqual(i(0), "a")
  assert.strictEqual(i(0.19), "a")
  assert.strictEqual(i(0.21), "b")
  assert.strictEqual(i(1), "e")
})

it("interpolateDiscrete([0, 1]) is equivalent to similar to Math.round", () => {
  const i = interpolateDiscrete([0, 1])
  assert.strictEqual(i(-1), 0)
  assert.strictEqual(i(0), 0)
  assert.strictEqual(i(0.49), 0)
  assert.strictEqual(i(0.51), 1)
  assert.strictEqual(i(1), 1)
  assert.strictEqual(i(2), 1)
})

it("interpolateDiscrete(…)(NaN) returned undefined", () => {
  const i = interpolateDiscrete([0, 1])
  assert.strictEqual(i(NaN), undefined)
})
import assert from "assert"
import { hcl, rgb } from "d3-color"
import { interpolateHcl } from "../src/index.js"

it("interpolateHcl(a, b) converts a and b to HCL colors", () => {
  assert.strictEqual(interpolateHcl("steelblue", "brown")(0), rgb("steelblue") + "")
  assert.strictEqual(interpolateHcl("steelblue", hcl("brown"))(1), rgb("brown") + "")
  assert.strictEqual(interpolateHcl("steelblue", rgb("brown"))(1), rgb("brown") + "")
})

it("interpolateHcl(a, b) interpolates in HCL and returns an RGB string", () => {
  assert.strictEqual(interpolateHcl("steelblue", "#f00")(0.2), "rgb(106, 121, 206)")
  assert.strictEqual(interpolateHcl("rgba(70, 130, 180, 1)", "rgba(255, 0, 0, 0.2)")(0.2), "rgba(106, 121, 206, 0.84)")
})

it("interpolateHcl(a, b) uses the shortest path when interpolating hue difference greater than 180°", () => {
  const i = interpolateHcl(hcl(10, 50, 50), hcl(350, 50, 50))
  assert.strictEqual(i(0.0), "rgb(194, 78, 107)")
  assert.strictEqual(i(0.2), "rgb(194, 78, 113)")
  assert.strictEqual(i(0.4), "rgb(193, 78, 118)")
  assert.strictEqual(i(0.6), "rgb(192, 78, 124)")
  assert.strictEqual(i(0.8), "rgb(191, 78, 130)")
  assert.strictEqual(i(1.0), "rgb(189, 79, 136)")
})

it("interpolateHcl(a, b) uses the shortest path when interpolating hue difference greater than 360°", () => {
  const i = interpolateHcl(hcl(10, 50, 50), hcl(380, 50, 50))
  assert.strictEqual(i(0.0), "rgb(194, 78, 107)")
  assert.strictEqual(i(0.2), "rgb(194, 78, 104)")
  assert.strictEqual(i(0.4), "rgb(194, 79, 101)")
  assert.strictEqual(i(0.6), "rgb(194, 79, 98)")
  assert.strictEqual(i(0.8), "rgb(194, 80, 96)")
  assert.strictEqual(i(1.0), "rgb(194, 80, 93)")
})

it("interpolateHcl(a, b) uses the shortest path when interpolating hue difference greater than 540°", () => {
  const i = interpolateHcl(hcl(10, 50, 50), hcl(710, 50, 50))
  assert.strictEqual(i(0.0), "rgb(194, 78, 107)")
  assert.strictEqual(i(0.2), "rgb(194, 78, 113)")
  assert.strictEqual(i(0.4), "rgb(193, 78, 118)")
  assert.strictEqual(i(0.6), "rgb(192, 78, 124)")
  assert.strictEqual(i(0.8), "rgb(191, 78, 130)")
  assert.strictEqual(i(1.0), "rgb(189, 79, 136)")
})

it("interpolateHcl(a, b) uses the shortest path when interpolating hue difference greater than 720°", () => {
  const i = interpolateHcl(hcl(10, 50, 50), hcl(740, 50, 50))
  assert.strictEqual(i(0.0), "rgb(194, 78, 107)")
  assert.strictEqual(i(0.2), "rgb(194, 78, 104)")
  assert.strictEqual(i(0.4), "rgb(194, 79, 101)")
  assert.strictEqual(i(0.6), "rgb(194, 79, 98)")
  assert.strictEqual(i(0.8), "rgb(194, 80, 96)")
  assert.strictEqual(i(1.0), "rgb(194, 80, 93)")
})

it("interpolateHcl(a, b) uses a’s hue when b’s hue is undefined", () => {
  assert.strictEqual(interpolateHcl("#f60", hcl(NaN, NaN, 0))(0.5), "rgb(155, 0, 0)")
  assert.strictEqual(interpolateHcl("#6f0", hcl(NaN, NaN, 0))(0.5), "rgb(0, 129, 0)")
})

it("interpolateHcl(a, b) uses b’s hue when a’s hue is undefined", () => {
  assert.strictEqual(interpolateHcl(hcl(NaN, NaN, 0), "#f60")(0.5), "rgb(155, 0, 0)")
  assert.strictEqual(interpolateHcl(hcl(NaN, NaN, 0), "#6f0")(0.5), "rgb(0, 129, 0)")
})

it("interpolateHcl(a, b) uses a’s chroma when b’s chroma is undefined", () => {
  assert.strictEqual(interpolateHcl("#ccc", hcl(NaN, NaN, 0))(0.5), "rgb(97, 97, 97)")
  assert.strictEqual(interpolateHcl("#f00", hcl(NaN, NaN, 0))(0.5), "rgb(166, 0, 0)")
})

it("interpolateHcl(a, b) uses b’s chroma when a’s chroma is undefined", () => {
  assert.strictEqual(interpolateHcl(hcl(NaN, NaN, 0), "#ccc")(0.5), "rgb(97, 97, 97)")
  assert.strictEqual(interpolateHcl(hcl(NaN, NaN, 0), "#f00")(0.5), "rgb(166, 0, 0)")
})

it("interpolateHcl(a, b) uses b’s luminance when a’s luminance is undefined", () => {
  assert.strictEqual(interpolateHcl(null, hcl(20, 80, 50))(0.5), "rgb(230, 13, 79)")
})

it("interpolateHcl(a, b) uses a’s luminance when b’s luminance is undefined", () => {
  assert.strictEqual(interpolateHcl(hcl(20, 80, 50), null)(0.5), "rgb(230, 13, 79)")
})
import assert from "assert"
import { hcl, rgb } from "d3-color"
import { interpolateHclLong } from "../src/index.js"

it("interpolateHclLong(a, b) converts a and b to HCL colors", () => {
  assert.strictEqual(interpolateHclLong("steelblue", "brown")(0), rgb("steelblue") + "")
  assert.strictEqual(interpolateHclLong("steelblue", hcl("brown"))(1), rgb("brown") + "")
  assert.strictEqual(interpolateHclLong("steelblue", rgb("brown"))(1), rgb("brown") + "")
})

it("interpolateHclLong(a, b) interpolates in HCL and returns an RGB string", () => {
  assert.strictEqual(interpolateHclLong("steelblue", "#f00")(0.2), "rgb(0, 144, 169)")
  assert.strictEqual(
    interpolateHclLong("rgba(70, 130, 180, 1)", "rgba(255, 0, 0, 0.2)")(0.2),
    "rgba(0, 144, 169, 0.84)"
  )
})

it("interpolateHclLong(a, b) does not use the shortest path when interpolating hue", () => {
  const i = interpolateHclLong(hcl(10, 50, 50), hcl(350, 50, 50))
  assert.strictEqual(i(0.0), "rgb(194, 78, 107)")
  assert.strictEqual(i(0.2), "rgb(151, 111, 28)")
  assert.strictEqual(i(0.4), "rgb(35, 136, 68)")
  assert.strictEqual(i(0.6), "rgb(0, 138, 165)")
  assert.strictEqual(i(0.8), "rgb(91, 116, 203)")
  assert.strictEqual(i(1.0), "rgb(189, 79, 136)")
})

it("interpolateHclLong(a, b) uses a’s hue when b’s hue is undefined", () => {
  assert.strictEqual(interpolateHclLong("#f60", hcl(NaN, NaN, 0))(0.5), "rgb(155, 0, 0)")
  assert.strictEqual(interpolateHclLong("#6f0", hcl(NaN, NaN, 0))(0.5), "rgb(0, 129, 0)")
})

it("interpolateHclLong(a, b) uses b’s hue when a’s hue is undefined", () => {
  assert.strictEqual(interpolateHclLong(hcl(NaN, NaN, 0), "#f60")(0.5), "rgb(155, 0, 0)")
  assert.strictEqual(interpolateHclLong(hcl(NaN, NaN, 0), "#6f0")(0.5), "rgb(0, 129, 0)")
})

it("interpolateHclLong(a, b) uses a’s chroma when b’s chroma is undefined", () => {
  assert.strictEqual(interpolateHclLong("#ccc", hcl(NaN, NaN, 0))(0.5), "rgb(97, 97, 97)")
  assert.strictEqual(interpolateHclLong("#f00", hcl(NaN, NaN, 0))(0.5), "rgb(166, 0, 0)")
})

it("interpolateHclLong(a, b) uses b’s chroma when a’s chroma is undefined", () => {
  assert.strictEqual(interpolateHclLong(hcl(NaN, NaN, 0), "#ccc")(0.5), "rgb(97, 97, 97)")
  assert.strictEqual(interpolateHclLong(hcl(NaN, NaN, 0), "#f00")(0.5), "rgb(166, 0, 0)")
})

it("interpolateHclLong(a, b) uses b’s luminance when a’s luminance is undefined", () => {
  assert.strictEqual(interpolateHclLong(null, hcl(20, 80, 50))(0.5), "rgb(230, 13, 79)")
})

it("interpolateHclLong(a, b) uses a’s luminance when b’s luminance is undefined", () => {
  assert.strictEqual(interpolateHclLong(hcl(20, 80, 50), null)(0.5), "rgb(230, 13, 79)")
})
import assert from "assert"
import { hsl, rgb } from "d3-color"
import { interpolateHsl } from "../src/index.js"

it("interpolateHsl(a, b) converts a and b to HSL colors", () => {
  assert.strictEqual(interpolateHsl("steelblue", "brown")(0), rgb("steelblue") + "")
  assert.strictEqual(interpolateHsl("steelblue", hsl("brown"))(1), rgb("brown") + "")
  assert.strictEqual(interpolateHsl("steelblue", rgb("brown"))(1), rgb("brown") + "")
})

it("interpolateHsl(a, b) interpolates in HSL and returns an RGB string", () => {
  assert.strictEqual(interpolateHsl("steelblue", "#f00")(0.2), "rgb(56, 61, 195)")
  assert.strictEqual(interpolateHsl("rgba(70, 130, 180, 1)", "rgba(255, 0, 0, 0.2)")(0.2), "rgba(56, 61, 195, 0.84)")
})

it("interpolateHsl(a, b) uses the shortest path when interpolating hue", () => {
  const i = interpolateHsl("hsl(10,50%,50%)", "hsl(350,50%,50%)")
  assert.strictEqual(i(0.0), "rgb(191, 85, 64)")
  assert.strictEqual(i(0.2), "rgb(191, 77, 64)")
  assert.strictEqual(i(0.4), "rgb(191, 68, 64)")
  assert.strictEqual(i(0.6), "rgb(191, 64, 68)")
  assert.strictEqual(i(0.8), "rgb(191, 64, 77)")
  assert.strictEqual(i(1.0), "rgb(191, 64, 85)")
})

it("interpolateHsl(a, b) uses a’s hue when b’s hue is undefined", () => {
  assert.strictEqual(interpolateHsl("#f60", "#000")(0.5), "rgb(128, 51, 0)")
  assert.strictEqual(interpolateHsl("#6f0", "#fff")(0.5), "rgb(179, 255, 128)")
})

it("interpolateHsl(a, b) uses b’s hue when a’s hue is undefined", () => {
  assert.strictEqual(interpolateHsl("#000", "#f60")(0.5), "rgb(128, 51, 0)")
  assert.strictEqual(interpolateHsl("#fff", "#6f0")(0.5), "rgb(179, 255, 128)")
})

it("interpolateHsl(a, b) uses a’s saturation when b’s saturation is undefined", () => {
  assert.strictEqual(interpolateHsl("#ccc", "#000")(0.5), "rgb(102, 102, 102)")
  assert.strictEqual(interpolateHsl("#f00", "#000")(0.5), "rgb(128, 0, 0)")
})

it("interpolateHsl(a, b) uses b’s saturation when a’s saturation is undefined", () => {
  assert.strictEqual(interpolateHsl("#000", "#ccc")(0.5), "rgb(102, 102, 102)")
  assert.strictEqual(interpolateHsl("#000", "#f00")(0.5), "rgb(128, 0, 0)")
})

it("interpolateHsl(a, b) uses b’s lightness when a’s lightness is undefined", () => {
  assert.strictEqual(interpolateHsl(null, hsl(20, 1.0, 0.5))(0.5), "rgb(255, 85, 0)")
})

it("interpolateHsl(a, b) uses a’s lightness when b’s lightness is undefined", () => {
  assert.strictEqual(interpolateHsl(hsl(20, 1.0, 0.5), null)(0.5), "rgb(255, 85, 0)")
})
import assert from "assert"
import { hsl, rgb } from "d3-color"
import { interpolateHslLong } from "../src/index.js"

it("interpolateHslLong(a, b) converts a and b to HSL colors", () => {
  assert.strictEqual(interpolateHslLong("steelblue", "brown")(0), rgb("steelblue") + "")
  assert.strictEqual(interpolateHslLong("steelblue", hsl("brown"))(1), rgb("brown") + "")
  assert.strictEqual(interpolateHslLong("steelblue", rgb("brown"))(1), rgb("brown") + "")
})

it("interpolateHslLong(a, b) interpolates in HSL and returns an RGB string", () => {
  assert.strictEqual(interpolateHslLong("steelblue", "#f00")(0.2), "rgb(56, 195, 162)")
  assert.strictEqual(
    interpolateHslLong("rgba(70, 130, 180, 1)", "rgba(255, 0, 0, 0.2)")(0.2),
    "rgba(56, 195, 162, 0.84)"
  )
})

it("interpolateHslLong(a, b) does not use the shortest path when interpolating hue", () => {
  const i = interpolateHslLong("hsl(10,50%,50%)", "hsl(350,50%,50%)")
  assert.strictEqual(i(0.0), "rgb(191, 85, 64)")
  assert.strictEqual(i(0.2), "rgb(153, 191, 64)")
  assert.strictEqual(i(0.4), "rgb(64, 191, 119)")
  assert.strictEqual(i(0.6), "rgb(64, 119, 191)")
  assert.strictEqual(i(0.8), "rgb(153, 64, 191)")
  assert.strictEqual(i(1.0), "rgb(191, 64, 85)")
})

it("interpolateHslLong(a, b) uses a’s hue when b’s hue is undefined", () => {
  assert.strictEqual(interpolateHslLong("#f60", "#000")(0.5), "rgb(128, 51, 0)")
  assert.strictEqual(interpolateHslLong("#6f0", "#fff")(0.5), "rgb(179, 255, 128)")
})

it("interpolateHslLong(a, b) uses b’s hue when a’s hue is undefined", () => {
  assert.strictEqual(interpolateHslLong("#000", "#f60")(0.5), "rgb(128, 51, 0)")
  assert.strictEqual(interpolateHslLong("#fff", "#6f0")(0.5), "rgb(179, 255, 128)")
})

it("interpolateHslLong(a, b) uses a’s saturation when b’s saturation is undefined", () => {
  assert.strictEqual(interpolateHslLong("#ccc", "#000")(0.5), "rgb(102, 102, 102)")
  assert.strictEqual(interpolateHslLong("#f00", "#000")(0.5), "rgb(128, 0, 0)")
})

it("interpolateHslLong(a, b) uses b’s saturation when a’s saturation is undefined", () => {
  assert.strictEqual(interpolateHslLong("#000", "#ccc")(0.5), "rgb(102, 102, 102)")
  assert.strictEqual(interpolateHslLong("#000", "#f00")(0.5), "rgb(128, 0, 0)")
})

it("interpolateHslLong(a, b) uses b’s lightness when a’s lightness is undefined", () => {
  assert.strictEqual(interpolateHslLong(null, hsl(20, 1.0, 0.5))(0.5), "rgb(255, 85, 0)")
})

it("interpolateHslLong(a, b) uses a’s lightness when b’s lightness is undefined", () => {
  assert.strictEqual(interpolateHslLong(hsl(20, 1.0, 0.5), null)(0.5), "rgb(255, 85, 0)")
})
import assert from "assert"
import { interpolateHue } from "../src/index.js"

it("interpolateHue(a, b) interpolate numbers", () => {
  const i = interpolateHue("10", "20")
  assert.strictEqual(i(0.0), 10)
  assert.strictEqual(i(0.2), 12)
  assert.strictEqual(i(0.4), 14)
  assert.strictEqual(i(0.6), 16)
  assert.strictEqual(i(0.8), 18)
  assert.strictEqual(i(1.0), 20)
})

it("interpolateHue(a, b) returns a if b is NaN", () => {
  const i = interpolateHue(10, NaN)
  assert.strictEqual(i(0.0), 10)
  assert.strictEqual(i(0.5), 10)
  assert.strictEqual(i(1.0), 10)
})

it("interpolateHue(a, b) returns b if a is NaN", () => {
  const i = interpolateHue(NaN, 20)
  assert.strictEqual(i(0.0), 20)
  assert.strictEqual(i(0.5), 20)
  assert.strictEqual(i(1.0), 20)
})

it("interpolateHue(a, b) returns NaN if both a and b are NaN", () => {
  const i = interpolateHue(NaN, NaN)
  assert.strictEqual(isNaN(i(0.0)), true)
  assert.strictEqual(isNaN(i(0.5)), true)
  assert.strictEqual(isNaN(i(1.0)), true)
})

it("interpolateHue(a, b) uses the shortest path", () => {
  const i = interpolateHue(10, 350)
  assert.strictEqual(i(0.0), 10)
  assert.strictEqual(i(0.2), 6)
  assert.strictEqual(i(0.4), 2)
  assert.strictEqual(i(0.6), 358)
  assert.strictEqual(i(0.8), 354)
  assert.strictEqual(i(1.0), 350)
})
import assert from "assert"
import { hsl, lab, rgb } from "d3-color"
import { interpolateLab } from "../src/index.js"

it("interpolateLab(a, b) converts a and b to Lab colors", () => {
  assert.strictEqual(interpolateLab("steelblue", "brown")(0), rgb("steelblue") + "")
  assert.strictEqual(interpolateLab("steelblue", hsl("brown"))(1), rgb("brown") + "")
  assert.strictEqual(interpolateLab("steelblue", rgb("brown"))(1), rgb("brown") + "")
})

it("interpolateLab(a, b) interpolates in Lab and returns an RGB string", () => {
  assert.strictEqual(interpolateLab("steelblue", "#f00")(0.2), "rgb(134, 120, 146)")
  assert.strictEqual(interpolateLab("rgba(70, 130, 180, 1)", "rgba(255, 0, 0, 0.2)")(0.2), "rgba(134, 120, 146, 0.84)")
})

it("interpolateLab(a, b) uses b’s channel value when a’s channel value is undefined", () => {
  assert.strictEqual(interpolateLab(null, lab(20, 40, 60))(0.5), lab(20, 40, 60) + "")
  assert.strictEqual(interpolateLab(lab(NaN, 20, 40), lab(60, 80, 100))(0.5), lab(60, 50, 70) + "")
  assert.strictEqual(interpolateLab(lab(20, NaN, 40), lab(60, 80, 100))(0.5), lab(40, 80, 70) + "")
  assert.strictEqual(interpolateLab(lab(20, 40, NaN), lab(60, 80, 100))(0.5), lab(40, 60, 100) + "")
})

it("interpolateLab(a, b) uses a’s channel value when b’s channel value is undefined", () => {
  assert.strictEqual(interpolateLab(lab(20, 40, 60), null)(0.5), lab(20, 40, 60) + "")
  assert.strictEqual(interpolateLab(lab(60, 80, 100), lab(NaN, 20, 40))(0.5), lab(60, 50, 70) + "")
  assert.strictEqual(interpolateLab(lab(60, 80, 100), lab(20, NaN, 40))(0.5), lab(40, 80, 70) + "")
  assert.strictEqual(interpolateLab(lab(60, 80, 100), lab(20, 40, NaN))(0.5), lab(40, 60, 100) + "")
})
import assert from "assert"
import { interpolateNumber } from "../src/index.js"
import { assertInDelta } from "./asserts.js"

it("interpolateNumber(a, b) interpolates between two numbers a and b", () => {
  const i = interpolateNumber(10, 42)
  assertInDelta(i(0.0), 10.0)
  assertInDelta(i(0.1), 13.2)
  assertInDelta(i(0.2), 16.4)
  assertInDelta(i(0.3), 19.6)
  assertInDelta(i(0.4), 22.8)
  assertInDelta(i(0.5), 26.0)
  assertInDelta(i(0.6), 29.2)
  assertInDelta(i(0.7), 32.4)
  assertInDelta(i(0.8), 35.6)
  assertInDelta(i(0.9), 38.8)
  assertInDelta(i(1.0), 42.0)
})

it("interpolateNumber(a, b) gives exact ends for t=0 and t=1", () => {
  const a = 2e42,
    b = 335
  assert.strictEqual(interpolateNumber(a, b)(1), b)
  assert.strictEqual(interpolateNumber(a, b)(0), a)
})
import assert from "assert"
import { interpolateNumberArray } from "../src/index.js"

it("interpolateNumberArray(a, b) interpolates defined elements in a and b", () => {
  assert.deepStrictEqual(
    interpolateNumberArray(Float64Array.of(2, 12), Float64Array.of(4, 24))(0.5),
    Float64Array.of(3, 18)
  )
})

it("interpolateNumberArray(a, b) ignores elements in a that are not in b", () => {
  assert.deepStrictEqual(
    interpolateNumberArray(Float64Array.of(2, 12, 12), Float64Array.of(4, 24))(0.5),
    Float64Array.of(3, 18)
  )
})

it("interpolateNumberArray(a, b) uses constant elements in b that are not in a", () => {
  assert.deepStrictEqual(
    interpolateNumberArray(Float64Array.of(2, 12), Float64Array.of(4, 24, 12))(0.5),
    Float64Array.of(3, 18, 12)
  )
})

it("interpolateNumberArray(a, b) treats undefined as an empty array", () => {
  assert.deepStrictEqual(interpolateNumberArray(undefined, [2, 12])(0.5), [2, 12])
  assert.deepStrictEqual(interpolateNumberArray([2, 12], undefined)(0.5), [])
  assert.deepStrictEqual(interpolateNumberArray(undefined, undefined)(0.5), [])
})

it("interpolateNumberArray(a, b) uses b’s array type", () => {
  assert(interpolateNumberArray(Float64Array.of(2, 12), Float64Array.of(4, 24, 12))(0.5) instanceof Float64Array)
  assert(interpolateNumberArray(Float64Array.of(2, 12), Float32Array.of(4, 24, 12))(0.5) instanceof Float32Array)
  assert(interpolateNumberArray(Float64Array.of(2, 12), Uint8Array.of(4, 24, 12))(0.5) instanceof Uint8Array)
  assert(interpolateNumberArray(Float64Array.of(2, 12), Uint16Array.of(4, 24, 12))(0.5) instanceof Uint16Array)
})

it("interpolateNumberArray(a, b) works with unsigned data", () => {
  assert.deepStrictEqual(
    interpolateNumberArray(Uint8Array.of(1, 12), Uint8Array.of(255, 0))(0.5),
    Uint8Array.of(128, 6)
  )
})

it("interpolateNumberArray(a, b) gives exact ends", () => {
  const i = interpolateNumberArray(Float64Array.of(2e42), Float64Array.of(355))
  assert.deepStrictEqual(i(0), Float64Array.of(2e42))
  assert.deepStrictEqual(i(1), Float64Array.of(355))
})
import assert from "assert"
import { interpolateObject } from "../src/index.js"

it("interpolateObject(a, b) interpolates defined properties in a and b", () => {
  assert.deepStrictEqual(interpolateObject({ a: 2, b: 12 }, { a: 4, b: 24 })(0.5), { a: 3, b: 18 })
})

it("interpolateObject(a, b) interpolates inherited properties in a and b", () => {
  function a(a) {
    this.a = a
  }
  a.prototype.b = 12
  assert.deepStrictEqual(interpolateObject(new a(2), { a: 4, b: 12 })(0.5), { a: 3, b: 12 })
  assert.deepStrictEqual(interpolateObject({ a: 2, b: 12 }, new a(4))(0.5), { a: 3, b: 12 })
  assert.deepStrictEqual(interpolateObject(new a(4), new a(2))(0.5), { a: 3, b: 12 })
})

it("interpolateObject(a, b) interpolates color properties as rgb", () => {
  assert.deepStrictEqual(interpolateObject({ background: "red" }, { background: "green" })(0.5), {
    background: "rgb(128, 64, 0)",
  })
  assert.deepStrictEqual(interpolateObject({ fill: "red" }, { fill: "green" })(0.5), { fill: "rgb(128, 64, 0)" })
  assert.deepStrictEqual(interpolateObject({ stroke: "red" }, { stroke: "green" })(0.5), { stroke: "rgb(128, 64, 0)" })
  assert.deepStrictEqual(interpolateObject({ color: "red" }, { color: "green" })(0.5), { color: "rgb(128, 64, 0)" })
})

it("interpolateObject(a, b) interpolates nested objects and arrays", () => {
  assert.deepStrictEqual(interpolateObject({ foo: [2, 12] }, { foo: [4, 24] })(0.5), { foo: [3, 18] })
  assert.deepStrictEqual(interpolateObject({ foo: { bar: [2, 12] } }, { foo: { bar: [4, 24] } })(0.5), {
    foo: { bar: [3, 18] },
  })
})

it("interpolateObject(a, b) ignores properties in a that are not in b", () => {
  assert.deepStrictEqual(interpolateObject({ foo: 2, bar: 12 }, { foo: 4 })(0.5), { foo: 3 })
})

it("interpolateObject(a, b) uses constant properties in b that are not in a", () => {
  assert.deepStrictEqual(interpolateObject({ foo: 2 }, { foo: 4, bar: 12 })(0.5), { foo: 3, bar: 12 })
})

it("interpolateObject(a, b) treats undefined as an empty object", () => {
  assert.deepStrictEqual(interpolateObject(NaN, { foo: 2 })(0.5), { foo: 2 })
  assert.deepStrictEqual(interpolateObject({ foo: 2 }, undefined)(0.5), {})
  assert.deepStrictEqual(interpolateObject(undefined, { foo: 2 })(0.5), { foo: 2 })
  assert.deepStrictEqual(interpolateObject({ foo: 2 }, null)(0.5), {})
  assert.deepStrictEqual(interpolateObject(null, { foo: 2 })(0.5), { foo: 2 })
  assert.deepStrictEqual(interpolateObject(null, NaN)(0.5), {})
})

it("interpolateObject(a, b) interpolates objects without prototype", () => {
  assert.deepStrictEqual(interpolateObject(noproto({ foo: 0 }), noproto({ foo: 2 }))(0.5), { foo: 1 })
})

function noproto(properties) {
  return Object.assign(Object.create(null), properties)
}
import assert from "assert"
import { interpolate, piecewise } from "../src/index.js"

it("piecewise(interpolate, values)(t) returns the expected values", () => {
  const i = piecewise(interpolate, [0, 2, 10])
  assert.strictEqual(i(-1), -4)
  assert.strictEqual(i(0), 0)
  assert.strictEqual(i(0.19), 0.76)
  assert.strictEqual(i(0.21), 0.84)
  assert.strictEqual(i(0.5), 2)
  assert.strictEqual(i(0.75), 6)
  assert.strictEqual(i(1), 10)
})

it("piecewise(values) uses the default interpolator", () => {
  const i = piecewise([0, 2, 10])
  assert.strictEqual(i(-1), -4)
  assert.strictEqual(i(0), 0)
  assert.strictEqual(i(0.19), 0.76)
  assert.strictEqual(i(0.21), 0.84)
  assert.strictEqual(i(0.5), 2)
  assert.strictEqual(i(0.75), 6)
  assert.strictEqual(i(1), 10)
})

it("piecewise(values) uses the default interpolator/2", () => {
  const i = piecewise(["a0", "a2", "a10"])
  assert.strictEqual(i(-1), "a-4")
  assert.strictEqual(i(0), "a0")
  assert.strictEqual(i(0.19), "a0.76")
  assert.strictEqual(i(0.21), "a0.84")
  assert.strictEqual(i(0.5), "a2")
  assert.strictEqual(i(0.75), "a6")
  assert.strictEqual(i(1), "a10")
})
import assert from "assert"
import { interpolateNumber, interpolateRgb, quantize } from "../src/index.js"

it("quantize(interpolate, n) returns n uniformly-spaced samples from the specified interpolator", () => {
  assert.deepStrictEqual(quantize(interpolateNumber(0, 1), 5), [0 / 4, 1 / 4, 2 / 4, 3 / 4, 4 / 4])
  assert.deepStrictEqual(quantize(interpolateRgb("steelblue", "brown"), 5), [
    "rgb(70, 130, 180)",
    "rgb(94, 108, 146)",
    "rgb(118, 86, 111)",
    "rgb(141, 64, 77)",
    "rgb(165, 42, 42)",
  ])
})
import assert from "assert"
import { interpolateRgb } from "../src/index.js"
import { hsl, rgb } from "d3-color"

it("interpolateRgb(a, b) converts a and b to RGB colors", () => {
  assert.strictEqual(interpolateRgb("steelblue", "brown")(0), rgb("steelblue") + "")
  assert.strictEqual(interpolateRgb("steelblue", hsl("brown"))(1), rgb("brown") + "")
  assert.strictEqual(interpolateRgb("steelblue", rgb("brown"))(1), rgb("brown") + "")
})

it("interpolateRgb(a, b) interpolates in RGB and returns an RGB string", () => {
  assert.strictEqual(interpolateRgb("steelblue", "#f00")(0.2), "rgb(107, 104, 144)")
  assert.strictEqual(interpolateRgb("rgba(70, 130, 180, 1)", "rgba(255, 0, 0, 0.2)")(0.2), "rgba(107, 104, 144, 0.84)")
})

it("interpolateRgb(a, b) uses b’s channel value when a’s channel value is undefined", () => {
  assert.strictEqual(interpolateRgb(null, rgb(20, 40, 60))(0.5), rgb(20, 40, 60) + "")
  assert.strictEqual(interpolateRgb(rgb(NaN, 20, 40), rgb(60, 80, 100))(0.5), rgb(60, 50, 70) + "")
  assert.strictEqual(interpolateRgb(rgb(20, NaN, 40), rgb(60, 80, 100))(0.5), rgb(40, 80, 70) + "")
  assert.strictEqual(interpolateRgb(rgb(20, 40, NaN), rgb(60, 80, 100))(0.5), rgb(40, 60, 100) + "")
})

it("interpolateRgb(a, b) uses a’s channel value when b’s channel value is undefined", () => {
  assert.strictEqual(interpolateRgb(rgb(20, 40, 60), null)(0.5), rgb(20, 40, 60) + "")
  assert.strictEqual(interpolateRgb(rgb(60, 80, 100), rgb(NaN, 20, 40))(0.5), rgb(60, 50, 70) + "")
  assert.strictEqual(interpolateRgb(rgb(60, 80, 100), rgb(20, NaN, 40))(0.5), rgb(40, 80, 70) + "")
  assert.strictEqual(interpolateRgb(rgb(60, 80, 100), rgb(20, 40, NaN))(0.5), rgb(40, 60, 100) + "")
})

it("interpolateRgb.gamma(3)(a, b) returns the expected values", () => {
  assert.strictEqual(interpolateRgb.gamma(3)("steelblue", "#f00")(0.2), "rgb(153, 121, 167)")
})

it("interpolateRgb.gamma(3)(a, b) uses linear interpolation for opacity", () => {
  assert.strictEqual(interpolateRgb.gamma(3)("transparent", "#f00")(0.2), "rgba(255, 0, 0, 0.2)")
})

it("interpolateRgb.gamma(g) coerces the specified gamma to a number", () => {
  assert.strictEqual(
    interpolateRgb.gamma({
      valueOf: function () {
        return 3
      },
    })(
      "steelblue",
      "#f00"
    )(0.2),
    "rgb(153, 121, 167)"
  )
})

it("interpolateRgb(a, b) is equivalent to interpolateRgb.gamma(1)(a, b)", () => {
  const i0 = interpolateRgb.gamma(1)("purple", "orange")
  const i1 = interpolateRgb("purple", "orange")
  assert.strictEqual(i1(0.0), i0(0.0))
  assert.strictEqual(i1(0.2), i0(0.2))
  assert.strictEqual(i1(0.4), i0(0.4))
  assert.strictEqual(i1(0.6), i0(0.6))
  assert.strictEqual(i1(0.8), i0(0.8))
  assert.strictEqual(i1(1.0), i0(1.0))
})
import assert from "assert"
import { interpolateRound } from "../src/index.js"

it("interpolateRound(a, b) interpolates between two numbers a and b, and then rounds", () => {
  const i = interpolateRound(10, 42)
  assert.strictEqual(i(0.0), 10)
  assert.strictEqual(i(0.1), 13)
  assert.strictEqual(i(0.2), 16)
  assert.strictEqual(i(0.3), 20)
  assert.strictEqual(i(0.4), 23)
  assert.strictEqual(i(0.5), 26)
  assert.strictEqual(i(0.6), 29)
  assert.strictEqual(i(0.7), 32)
  assert.strictEqual(i(0.8), 36)
  assert.strictEqual(i(0.9), 39)
  assert.strictEqual(i(1.0), 42)
})

it("interpolateRound(a, b) does not pre-round a and b", () => {
  const i = interpolateRound(2.6, 3.6)
  assert.strictEqual(i(0.6), 3)
})

it("interpolateRound(a, b) gives exact ends for t=0 and t=1", () => {
  const a = 2e42,
    b = 335
  assert.strictEqual(interpolateRound(a, b)(1), b)
  assert.strictEqual(interpolateRound(a, b)(0), a)
})
import assert from "assert"
import { interpolateString } from "../src/index.js"

it("interpolateString(a, b) interpolates matching numbers in a and b", () => {
  assert.strictEqual(interpolateString(" 10/20 30", "50/10 100 ")(0.2), "18/18 44 ")
  assert.strictEqual(interpolateString(" 10/20 30", "50/10 100 ")(0.4), "26/16 58 ")
})

it("interpolateString(a, b) coerces a and b to strings", () => {
  assert.strictEqual(
    interpolateString(
      {
        toString: function () {
          return "2px"
        },
      },
      {
        toString: function () {
          return "12px"
        },
      }
    )(0.25),
    "4.5px"
  )
})

it("interpolateString(a, b) preserves non-numbers in string b", () => {
  assert.strictEqual(interpolateString(" 10/20 30", "50/10 foo ")(0.2), "18/18 foo ")
  assert.strictEqual(interpolateString(" 10/20 30", "50/10 foo ")(0.4), "26/16 foo ")
})

it("interpolateString(a, b) preserves non-matching numbers in string b", () => {
  assert.strictEqual(interpolateString(" 10/20 foo", "50/10 100 ")(0.2), "18/18 100 ")
  assert.strictEqual(interpolateString(" 10/20 bar", "50/10 100 ")(0.4), "26/16 100 ")
})

it("interpolateString(a, b) preserves equal-value numbers in both strings", () => {
  assert.strictEqual(interpolateString(" 10/20 100 20", "50/10 100, 20 ")(0.2), "18/18 100, 20 ")
  assert.strictEqual(interpolateString(" 10/20 100 20", "50/10 100, 20 ")(0.4), "26/16 100, 20 ")
})

it("interpolateString(a, b) interpolates decimal notation correctly", () => {
  assert.strictEqual(interpolateString("1.", "2.")(0.5), "1.5")
})

it("interpolateString(a, b) interpolates exponent notation correctly", () => {
  assert.strictEqual(interpolateString("1e+3", "1e+4")(0.5), "5500")
  assert.strictEqual(interpolateString("1e-3", "1e-4")(0.5), "0.00055")
  assert.strictEqual(interpolateString("1.e-3", "1.e-4")(0.5), "0.00055")
  assert.strictEqual(interpolateString("-1.e-3", "-1.e-4")(0.5), "-0.00055")
  assert.strictEqual(interpolateString("+1.e-3", "+1.e-4")(0.5), "0.00055")
  assert.strictEqual(interpolateString(".1e-2", ".1e-3")(0.5), "0.00055")
})

it("interpolateString(a, b) with no numbers, returns the target string", () => {
  assert.strictEqual(interpolateString("foo", "bar")(0.5), "bar")
  assert.strictEqual(interpolateString("foo", "")(0.5), "")
  assert.strictEqual(interpolateString("", "bar")(0.5), "bar")
  assert.strictEqual(interpolateString("", "")(0.5), "")
})

it("interpolateString(a, b) with two numerically-equivalent numbers, returns the default format", () => {
  assert.strictEqual(interpolateString("top: 1000px;", "top: 1e3px;")(0.5), "top: 1000px;")
  assert.strictEqual(interpolateString("top: 1e3px;", "top: 1000px;")(0.5), "top: 1000px;")
})
/*

import assert from "assert";
import * as d3 from "../src/index.js";



global.DOMMatrix = require("Canvas").DOMMatrix;

it("interpolateTransformCss(a, b) transforms as expected", () => {
  assert.strictEqual(interpolate.interpolateTransformCss(
    "translateY(12px) scale(2)",
    "translateX(3em) rotate(5deg)"
  )(0.5), "translate(24px, 6px) rotate(2.5deg) scale(1.5,1.5)");
  assert.deepStrictEqual(interpolate.interpolateTransformCss(
    "matrix(1.0, 2.0, 3.0, 4.0, 5.0, 6.0)",
    "translate(3px,90px)"
  )(0.5), "translate(4px, 48px) rotate(-58.282525588538995deg) skewX(-39.847576765616985deg) scale(-0.6180339887498949,0.9472135954999579)");
  assert.deepStrictEqual(interpolate.interpolateTransformCss(
    "skewX(-60)",
    "skewX(60) translate(280,0)"
  )(0.5), "translate(140, 0) skewX(0)");
});

*/
import assert from "assert"
import { hsl, rgb } from "d3-color"
import { interpolate } from "../src/index.js"

it("interpolate(a, b) interpolates strings if b is a string and not a color", () => {
  assert.strictEqual(interpolate("foo", "bar")(0.5), "bar")
})

it("interpolate(a, b) interpolates strings if b is a string and not a color, even if b is coercible to a number", () => {
  assert.strictEqual(interpolate("1", "2")(0.5), "1.5")
  assert.strictEqual(interpolate(" 1", " 2")(0.5), " 1.5")
})

it("interpolate(a, b) interpolates RGB colors if b is a string and a color", () => {
  assert.strictEqual(interpolate("red", "blue")(0.5), "rgb(128, 0, 128)")
  assert.strictEqual(interpolate("#ff0000", "#0000ff")(0.5), "rgb(128, 0, 128)")
  assert.strictEqual(interpolate("#f00", "#00f")(0.5), "rgb(128, 0, 128)")
  assert.strictEqual(interpolate("rgb(255, 0, 0)", "rgb(0, 0, 255)")(0.5), "rgb(128, 0, 128)")
  assert.strictEqual(interpolate("rgba(255, 0, 0, 1.0)", "rgba(0, 0, 255, 1.0)")(0.5), "rgb(128, 0, 128)")
  assert.strictEqual(interpolate("rgb(100%, 0%, 0%)", "rgb(0%, 0%, 100%)")(0.5), "rgb(128, 0, 128)")
  assert.strictEqual(interpolate("rgba(100%, 0%, 0%, 1.0)", "rgba(0%, 0%, 100%, 1.0)")(0.5), "rgb(128, 0, 128)")
  assert.strictEqual(interpolate("rgba(100%, 0%, 0%, 0.5)", "rgba(0%, 0%, 100%, 0.7)")(0.5), "rgba(128, 0, 128, 0.6)")
})

it("interpolate(a, b) interpolates RGB colors if b is a color", () => {
  assert.strictEqual(interpolate("red", rgb("blue"))(0.5), "rgb(128, 0, 128)")
  assert.strictEqual(interpolate("red", hsl("blue"))(0.5), "rgb(128, 0, 128)")
})

it("interpolate(a, b) interpolates arrays if b is an array", () => {
  assert.deepStrictEqual(interpolate(["red"], ["blue"])(0.5), ["rgb(128, 0, 128)"])
})

it("interpolate(a, b) interpolates arrays if b is an array, even if b is coercible to a number", () => {
  assert.deepStrictEqual(interpolate([1], [2])(0.5), [1.5])
})

it("interpolate(a, b) interpolates numbers if b is a number", () => {
  assert.strictEqual(interpolate(1, 2)(0.5), 1.5)
  assert(isNaN(interpolate(1, NaN)(0.5)))
})

it("interpolate(a, b) interpolates objects if b is an object that is not coercible to a number", () => {
  assert.deepStrictEqual(interpolate({ color: "red" }, { color: "blue" })(0.5), { color: "rgb(128, 0, 128)" })
})

it("interpolate(a, b) interpolates numbers if b is an object that is coercible to a number", () => {
  assert.strictEqual(interpolate(1, new Number(2))(0.5), 1.5)
  assert.strictEqual(interpolate(1, new String("2"))(0.5), 1.5)
})

it("interpolate(a, b) interpolates dates if b is a date", () => {
  const i = interpolate(new Date(2000, 0, 1), new Date(2000, 0, 2))
  const d = i(0.5)
  assert.strictEqual(d instanceof Date, true)
  assert.strictEqual(+i(0.5), +new Date(2000, 0, 1, 12))
})

it("interpolate(a, b) returns the constant b if b is null, undefined or a boolean", () => {
  assert.strictEqual(interpolate(0, null)(0.5), null)
  assert.strictEqual(interpolate(0, undefined)(0.5), undefined)
  assert.strictEqual(interpolate(0, true)(0.5), true)
  assert.strictEqual(interpolate(0, false)(0.5), false)
})

it("interpolate(a, b) interpolates objects without prototype", () => {
  assert.deepStrictEqual(interpolate(noproto({ foo: 0 }), noproto({ foo: 2 }))(0.5), { foo: 1 })
})

it("interpolate(a, b) interpolates objects with numeric valueOf as numbers", () => {
  const proto = { valueOf: foo }
  assert.deepStrictEqual(interpolate(noproto({ foo: 0 }, proto), noproto({ foo: 2 }, proto))(0.5), 1)
})

it("interpolate(a, b) interpolates objects with string valueOf as numbers if valueOf result is coercible to number", () => {
  const proto = { valueOf: fooString }
  assert.deepStrictEqual(interpolate(noproto({ foo: 0 }, proto), noproto({ foo: 2 }, proto))(0.5), 1)
})

it("interpolate(a, b) interpolates objects with string valueOf as objects if valueOf result is not coercible to number", () => {
  const proto = { valueOf: fooString }
  assert.deepStrictEqual(interpolate(noproto({ foo: "bar" }, proto), noproto({ foo: "baz" }, proto))(0.5), {
    foo: "baz",
    valueOf: {},
  })
})

it("interpolate(a, b) interpolates objects with toString as numbers if toString result is coercible to number", () => {
  const proto = { toString: fooString }
  assert.deepStrictEqual(interpolate(noproto({ foo: 0 }, proto), noproto({ foo: 2 }, proto))(0.5), 1)
})

it("interpolate(a, b) interpolates objects with toString as objects if toString result is not coercible to number", () => {
  const proto = { toString: fooString }
  assert.deepStrictEqual(interpolate(noproto({ foo: "bar" }, proto), noproto({ foo: "baz" }, proto))(0.5), {
    foo: "baz",
    toString: {},
  })
})

it("interpolate(a, b) interpolates number arrays if b is a typed array", () => {
  assert.deepStrictEqual(interpolate([0, 0], Float64Array.of(-1, 1))(0.5), Float64Array.of(-0.5, 0.5))
  assert(interpolate([0, 0], Float64Array.of(-1, 1))(0.5) instanceof Float64Array)
  assert.deepStrictEqual(interpolate([0, 0], Float32Array.of(-1, 1))(0.5), Float32Array.of(-0.5, 0.5))
  assert(interpolate([0, 0], Float32Array.of(-1, 1))(0.5) instanceof Float32Array)
  assert.deepStrictEqual(interpolate([0, 0], Uint32Array.of(-2, 2))(0.5), Uint32Array.of(Math.pow(2, 31) - 1, 1))
  assert(interpolate([0, 0], Uint32Array.of(-1, 1))(0.5) instanceof Uint32Array)
  assert.deepStrictEqual(interpolate([0, 0], Uint8Array.of(-2, 2))(0.5), Uint8Array.of(Math.pow(2, 7) - 1, 1))
  assert(interpolate([0, 0], Uint8Array.of(-1, 1))(0.5) instanceof Uint8Array)
})

function noproto(properties, proto = null) {
  return Object.assign(Object.create(proto), properties)
}

function foo() {
  return this.foo
}

function fooString() {
  return String(this.foo)
}
import assert from "assert"
import { interpolateZoom } from "../src/index.js"
import { assertInDelta } from "./asserts.js"

it("interpolateZoom(a, b) handles nearly-coincident points", () => {
  assert.deepStrictEqual(
    interpolateZoom(
      [324.68721096803614, 59.43501602433761, 1.8827137399562621],
      [324.6872108946794, 59.43501601062763, 7.399052110984391]
    )(0.5),
    [324.68721093135775, 59.43501601748262, 3.7323313186268305]
  )
})

it("interpolateZoom returns the expected duration", () => {
  assertInDelta(interpolateZoom([0, 0, 1], [0, 0, 1.1]).duration, 67, 1)
  assertInDelta(interpolateZoom([0, 0, 1], [0, 0, 2]).duration, 490, 1)
  assertInDelta(interpolateZoom([0, 0, 1], [10, 0, 8]).duration, 2872.5, 1)
})

it("interpolateZoom parameter rho() defaults to sqrt(2)", () => {
  assertInDelta(
    interpolateZoom([0, 0, 1], [10, 10, 5])(0.5),
    interpolateZoom.rho(Math.sqrt(2))([0, 0, 1], [10, 10, 5])(0.5)
  )
})

it("interpolateZoom.rho(0) is (almost) linear", () => {
  const interp = interpolateZoom.rho(0)([0, 0, 1], [10, 0, 8])
  assertInDelta(interp(0.5), [1.111, 0, Math.sqrt(8)], 1e-3)
  assert.strictEqual(Math.round(interp.duration), 1470)
})

it("interpolateZoom parameter rho(2) has a high curvature and takes more time", () => {
  const interp = interpolateZoom.rho(2)([0, 0, 1], [10, 0, 8])
  assertInDelta(interp(0.5), [1.111, 0, 12.885], 1e-3)
  assert.strictEqual(Math.round(interp.duration), 3775)
})
