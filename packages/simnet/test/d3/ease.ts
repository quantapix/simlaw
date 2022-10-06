import assert from "assert"

export function assertInDelta(actual, expected) {
  assert(expected - 1e-6 < actual && actual < expected + 1e-6)
}
import assert from "assert"
import { easeBack, easeBackIn, easeBackInOut, easeBackOut } from "../src/index.js"
import { out, inOut } from "./generic.js"
import { assertInDelta } from "./asserts.js"

it("easeBack is an alias for easeBackInOut", () => {
  assert.strictEqual(easeBack, easeBackInOut)
})

it("easeBackIn(t) returns the expected results", () => {
  assert.strictEqual(Math.abs(easeBackIn(0.0)), 0.0)
  assertInDelta(easeBackIn(0.1), -0.014314)
  assertInDelta(easeBackIn(0.2), -0.046451)
  assertInDelta(easeBackIn(0.3), -0.0802)
  assertInDelta(easeBackIn(0.4), -0.099352)
  assertInDelta(easeBackIn(0.5), -0.087698)
  assertInDelta(easeBackIn(0.6), -0.029028)
  assertInDelta(easeBackIn(0.7), +0.092868)
  assertInDelta(easeBackIn(0.8), +0.294198)
  assertInDelta(easeBackIn(0.9), +0.591172)
  assert.strictEqual(easeBackIn(1.0), +1.0)
})

it("easeBackIn(t) coerces t to a number", () => {
  assert.strictEqual(easeBackIn(".9"), easeBackIn(0.9))
  assert.strictEqual(
    easeBackIn({
      valueOf: function () {
        return 0.9
      },
    }),
    easeBackIn(0.9)
  )
})

it("easeBackOut(t) returns the expected results", () => {
  const backOut = out(easeBackIn)
  assert.strictEqual(easeBackOut(0.0), backOut(0.0))
  assertInDelta(easeBackOut(0.1), backOut(0.1))
  assertInDelta(easeBackOut(0.2), backOut(0.2))
  assertInDelta(easeBackOut(0.3), backOut(0.3))
  assertInDelta(easeBackOut(0.4), backOut(0.4))
  assertInDelta(easeBackOut(0.5), backOut(0.5))
  assertInDelta(easeBackOut(0.6), backOut(0.6))
  assertInDelta(easeBackOut(0.7), backOut(0.7))
  assertInDelta(easeBackOut(0.8), backOut(0.8))
  assertInDelta(easeBackOut(0.9), backOut(0.9))
  assert.strictEqual(easeBackOut(1.0), backOut(1.0))
})

it("easeBackOut(t) coerces t to a number", () => {
  assert.strictEqual(easeBackOut(".9"), easeBackOut(0.9))
  assert.strictEqual(
    easeBackOut({
      valueOf: function () {
        return 0.9
      },
    }),
    easeBackOut(0.9)
  )
})

it("easeBackInOut(t) returns the expected results", () => {
  const backInOut = inOut(easeBackIn)
  assert.strictEqual(easeBackInOut(0.0), backInOut(0.0))
  assertInDelta(easeBackInOut(0.1), backInOut(0.1))
  assertInDelta(easeBackInOut(0.2), backInOut(0.2))
  assertInDelta(easeBackInOut(0.3), backInOut(0.3))
  assertInDelta(easeBackInOut(0.4), backInOut(0.4))
  assertInDelta(easeBackInOut(0.5), backInOut(0.5))
  assertInDelta(easeBackInOut(0.6), backInOut(0.6))
  assertInDelta(easeBackInOut(0.7), backInOut(0.7))
  assertInDelta(easeBackInOut(0.8), backInOut(0.8))
  assertInDelta(easeBackInOut(0.9), backInOut(0.9))
  assert.strictEqual(easeBackInOut(1.0), backInOut(1.0))
})

it("easeBackInOut(t) coerces t to a number", () => {
  assert.strictEqual(easeBackInOut(".9"), easeBackInOut(0.9))
  assert.strictEqual(
    easeBackInOut({
      valueOf: function () {
        return 0.9
      },
    }),
    easeBackInOut(0.9)
  )
})
import assert from "assert"
import { easeBounce, easeBounceIn, easeBounceInOut, easeBounceOut } from "../src/index.js"
import { out, inOut } from "./generic.js"
import { assertInDelta } from "./asserts.js"

it("easeBounce is an alias for easeBounceOut", () => {
  assert.strictEqual(easeBounce, easeBounceOut)
})

it("easeBounceIn(t) returns the expected results", () => {
  assert.strictEqual(easeBounceIn(0.0), 0.0)
  assertInDelta(easeBounceIn(0.1), 0.011875)
  assertInDelta(easeBounceIn(0.2), 0.06)
  assertInDelta(easeBounceIn(0.3), 0.069375)
  assertInDelta(easeBounceIn(0.4), 0.2275)
  assertInDelta(easeBounceIn(0.5), 0.234375)
  assertInDelta(easeBounceIn(0.6), 0.09)
  assertInDelta(easeBounceIn(0.7), 0.319375)
  assertInDelta(easeBounceIn(0.8), 0.6975)
  assertInDelta(easeBounceIn(0.9), 0.924375)
  assert.strictEqual(easeBounceIn(1.0), 1.0)
})

it("easeBounceIn(t) coerces t to a number", () => {
  assert.strictEqual(easeBounceIn(".9"), easeBounceIn(0.9))
  assert.strictEqual(
    easeBounceIn({
      valueOf: function () {
        return 0.9
      },
    }),
    easeBounceIn(0.9)
  )
})

it("easeBounceOut(t) returns the expected results", () => {
  const bounceOut = out(easeBounceIn)
  assert.strictEqual(easeBounceOut(0.0), bounceOut(0.0))
  assertInDelta(easeBounceOut(0.1), bounceOut(0.1))
  assertInDelta(easeBounceOut(0.2), bounceOut(0.2))
  assertInDelta(easeBounceOut(0.3), bounceOut(0.3))
  assertInDelta(easeBounceOut(0.4), bounceOut(0.4))
  assertInDelta(easeBounceOut(0.5), bounceOut(0.5))
  assertInDelta(easeBounceOut(0.6), bounceOut(0.6))
  assertInDelta(easeBounceOut(0.7), bounceOut(0.7))
  assertInDelta(easeBounceOut(0.8), bounceOut(0.8))
  assertInDelta(easeBounceOut(0.9), bounceOut(0.9))
  assert.strictEqual(easeBounceOut(1.0), bounceOut(1.0))
})

it("easeBounceOut(t) coerces t to a number", () => {
  assert.strictEqual(easeBounceOut(".9"), easeBounceOut(0.9))
  assert.strictEqual(
    easeBounceOut({
      valueOf: function () {
        return 0.9
      },
    }),
    easeBounceOut(0.9)
  )
})

it("easeBounceInOut(t) returns the expected results", () => {
  const bounceInOut = inOut(easeBounceIn)
  assert.strictEqual(easeBounceInOut(0.0), bounceInOut(0.0))
  assertInDelta(easeBounceInOut(0.1), bounceInOut(0.1))
  assertInDelta(easeBounceInOut(0.2), bounceInOut(0.2))
  assertInDelta(easeBounceInOut(0.3), bounceInOut(0.3))
  assertInDelta(easeBounceInOut(0.4), bounceInOut(0.4))
  assertInDelta(easeBounceInOut(0.5), bounceInOut(0.5))
  assertInDelta(easeBounceInOut(0.6), bounceInOut(0.6))
  assertInDelta(easeBounceInOut(0.7), bounceInOut(0.7))
  assertInDelta(easeBounceInOut(0.8), bounceInOut(0.8))
  assertInDelta(easeBounceInOut(0.9), bounceInOut(0.9))
  assert.strictEqual(easeBounceInOut(1.0), bounceInOut(1.0))
})

it("easeBounceInOut(t) coerces t to a number", () => {
  assert.strictEqual(easeBounceInOut(".9"), easeBounceInOut(0.9))
  assert.strictEqual(
    easeBounceInOut({
      valueOf: function () {
        return 0.9
      },
    }),
    easeBounceInOut(0.9)
  )
})
import assert from "assert"
import { easeCircle, easeCircleIn, easeCircleInOut, easeCircleOut } from "../src/index.js"
import { out, inOut } from "./generic.js"
import { assertInDelta } from "./asserts.js"

it("easeCircle is an alias for easeCircleInOut", () => {
  assert.strictEqual(easeCircle, easeCircleInOut)
})

it("easeCircleIn(t) returns the expected results", () => {
  assert.strictEqual(easeCircleIn(0.0), 0.0)
  assertInDelta(easeCircleIn(0.1), 0.005013)
  assertInDelta(easeCircleIn(0.2), 0.020204)
  assertInDelta(easeCircleIn(0.3), 0.046061)
  assertInDelta(easeCircleIn(0.4), 0.083485)
  assertInDelta(easeCircleIn(0.5), 0.133975)
  assertInDelta(easeCircleIn(0.6), 0.2)
  assertInDelta(easeCircleIn(0.7), 0.285857)
  assertInDelta(easeCircleIn(0.8), 0.4)
  assertInDelta(easeCircleIn(0.9), 0.56411)
  assert.strictEqual(easeCircleIn(1.0), 1.0)
})

it("easeCircleIn(t) coerces t to a number", () => {
  assert.strictEqual(easeCircleIn(".9"), easeCircleIn(0.9))
  assert.strictEqual(
    easeCircleIn({
      valueOf: function () {
        return 0.9
      },
    }),
    easeCircleIn(0.9)
  )
})

it("easeCircleOut(t) returns the expected results", () => {
  var circleOut = out(easeCircleIn)
  assert.strictEqual(easeCircleOut(0.0), circleOut(0.0))
  assertInDelta(easeCircleOut(0.1), circleOut(0.1))
  assertInDelta(easeCircleOut(0.2), circleOut(0.2))
  assertInDelta(easeCircleOut(0.3), circleOut(0.3))
  assertInDelta(easeCircleOut(0.4), circleOut(0.4))
  assertInDelta(easeCircleOut(0.5), circleOut(0.5))
  assertInDelta(easeCircleOut(0.6), circleOut(0.6))
  assertInDelta(easeCircleOut(0.7), circleOut(0.7))
  assertInDelta(easeCircleOut(0.8), circleOut(0.8))
  assertInDelta(easeCircleOut(0.9), circleOut(0.9))
  assert.strictEqual(easeCircleOut(1.0), circleOut(1.0))
})

it("easeCircleOut(t) coerces t to a number", () => {
  assert.strictEqual(easeCircleOut(".9"), easeCircleOut(0.9))
  assert.strictEqual(
    easeCircleOut({
      valueOf: function () {
        return 0.9
      },
    }),
    easeCircleOut(0.9)
  )
})

it("easeCircleInOut(t) returns the expected results", () => {
  var circleInOut = inOut(easeCircleIn)
  assert.strictEqual(easeCircleInOut(0.0), circleInOut(0.0))
  assertInDelta(easeCircleInOut(0.1), circleInOut(0.1))
  assertInDelta(easeCircleInOut(0.2), circleInOut(0.2))
  assertInDelta(easeCircleInOut(0.3), circleInOut(0.3))
  assertInDelta(easeCircleInOut(0.4), circleInOut(0.4))
  assertInDelta(easeCircleInOut(0.5), circleInOut(0.5))
  assertInDelta(easeCircleInOut(0.6), circleInOut(0.6))
  assertInDelta(easeCircleInOut(0.7), circleInOut(0.7))
  assertInDelta(easeCircleInOut(0.8), circleInOut(0.8))
  assertInDelta(easeCircleInOut(0.9), circleInOut(0.9))
  assert.strictEqual(easeCircleInOut(1.0), circleInOut(1.0))
})

it("easeCircleInOut(t) coerces t to a number", () => {
  assert.strictEqual(easeCircleInOut(".9"), easeCircleInOut(0.9))
  assert.strictEqual(
    easeCircleInOut({
      valueOf: function () {
        return 0.9
      },
    }),
    easeCircleInOut(0.9)
  )
})
import assert from "assert"
import { easeCubic, easeCubicIn, easeCubicInOut, easeCubicOut } from "../src/index.js"
import { out, inOut } from "./generic.js"
import { assertInDelta } from "./asserts.js"

it("easeCubic is an alias for easeCubicInOut", () => {
  assert.strictEqual(easeCubic, easeCubicInOut)
})

it("easeCubicIn(t) returns the expected results", () => {
  assert.strictEqual(easeCubicIn(0.0), 0.0)
  assertInDelta(easeCubicIn(0.1), 0.001)
  assertInDelta(easeCubicIn(0.2), 0.008)
  assertInDelta(easeCubicIn(0.3), 0.027)
  assertInDelta(easeCubicIn(0.4), 0.064)
  assertInDelta(easeCubicIn(0.5), 0.125)
  assertInDelta(easeCubicIn(0.6), 0.216)
  assertInDelta(easeCubicIn(0.7), 0.343)
  assertInDelta(easeCubicIn(0.8), 0.512)
  assertInDelta(easeCubicIn(0.9), 0.729)
  assert.strictEqual(easeCubicIn(1.0), 1.0)
})

it("easeCubicIn(t) coerces t to a number", () => {
  assert.strictEqual(easeCubicIn(".9"), easeCubicIn(0.9))
  assert.strictEqual(
    easeCubicIn({
      valueOf: function () {
        return 0.9
      },
    }),
    easeCubicIn(0.9)
  )
})

it("easeCubicOut(t) returns the expected results", () => {
  const cubicOut = out(easeCubicIn)
  assert.strictEqual(easeCubicOut(0.0), cubicOut(0.0))
  assertInDelta(easeCubicOut(0.1), cubicOut(0.1))
  assertInDelta(easeCubicOut(0.2), cubicOut(0.2))
  assertInDelta(easeCubicOut(0.3), cubicOut(0.3))
  assertInDelta(easeCubicOut(0.4), cubicOut(0.4))
  assertInDelta(easeCubicOut(0.5), cubicOut(0.5))
  assertInDelta(easeCubicOut(0.6), cubicOut(0.6))
  assertInDelta(easeCubicOut(0.7), cubicOut(0.7))
  assertInDelta(easeCubicOut(0.8), cubicOut(0.8))
  assertInDelta(easeCubicOut(0.9), cubicOut(0.9))
  assert.strictEqual(easeCubicOut(1.0), cubicOut(1.0))
})

it("easeCubicOut(t) coerces t to a number", () => {
  assert.strictEqual(easeCubicOut(".9"), easeCubicOut(0.9))
  assert.strictEqual(
    easeCubicOut({
      valueOf: function () {
        return 0.9
      },
    }),
    easeCubicOut(0.9)
  )
})

it("easeCubicInOut(t) returns the expected results", () => {
  const cubicInOut = inOut(easeCubicIn)
  assert.strictEqual(easeCubicInOut(0.0), cubicInOut(0.0))
  assertInDelta(easeCubicInOut(0.1), cubicInOut(0.1))
  assertInDelta(easeCubicInOut(0.2), cubicInOut(0.2))
  assertInDelta(easeCubicInOut(0.3), cubicInOut(0.3))
  assertInDelta(easeCubicInOut(0.4), cubicInOut(0.4))
  assertInDelta(easeCubicInOut(0.5), cubicInOut(0.5))
  assertInDelta(easeCubicInOut(0.6), cubicInOut(0.6))
  assertInDelta(easeCubicInOut(0.7), cubicInOut(0.7))
  assertInDelta(easeCubicInOut(0.8), cubicInOut(0.8))
  assertInDelta(easeCubicInOut(0.9), cubicInOut(0.9))
  assert.strictEqual(easeCubicInOut(1.0), cubicInOut(1.0))
})

it("easeCubicInOut(t) coerces t to a number", () => {
  assert.strictEqual(easeCubicInOut(".9"), easeCubicInOut(0.9))
  assert.strictEqual(
    easeCubicInOut({
      valueOf: function () {
        return 0.9
      },
    }),
    easeCubicInOut(0.9)
  )
})
import assert from "assert"
import { easeElastic, easeElasticIn, easeElasticInOut, easeElasticOut } from "../src/index.js"
import { out, inOut } from "./generic.js"
import { assertInDelta } from "./asserts.js"

it("easeElastic is an alias for easeElasticOut", () => {
  assert.strictEqual(easeElastic, easeElasticOut)
})

it("easeElasticIn(t) returns the expected results", () => {
  assert.strictEqual(Math.abs(easeElasticIn(0.0)), 0.0)
  assertInDelta(easeElasticIn(0.1), 0.000978)
  assertInDelta(easeElasticIn(0.2), -0.001466)
  assertInDelta(easeElasticIn(0.3), -0.003421)
  assertInDelta(easeElasticIn(0.4), 0.014663)
  assertInDelta(easeElasticIn(0.5), -0.015152)
  assertInDelta(easeElasticIn(0.6), -0.030792)
  assertInDelta(easeElasticIn(0.7), 0.124145)
  assertInDelta(easeElasticIn(0.8), -0.124633)
  assertInDelta(easeElasticIn(0.9), -0.249756)
  assert.strictEqual(easeElasticIn(1.0), 1.0)
})

it("easeElasticIn(t) coerces t to a number", () => {
  assert.strictEqual(easeElasticIn(".9"), easeElasticIn(0.9))
  assert.strictEqual(
    easeElasticIn({
      valueOf: function () {
        return 0.9
      },
    }),
    easeElasticIn(0.9)
  )
})

it("easeElasticIn(t) is the same as elasticIn.amplitude(1).period(0.3)(t)", () => {
  assert.strictEqual(easeElasticIn(0.1), easeElasticIn.amplitude(1).period(0.3)(0.1))
  assert.strictEqual(easeElasticIn(0.2), easeElasticIn.amplitude(1).period(0.3)(0.2))
  assert.strictEqual(easeElasticIn(0.3), easeElasticIn.amplitude(1).period(0.3)(0.3))
})

it("easeElasticIn.amplitude(a)(t) is the same as elasticIn(t) if a <= 1", () => {
  assert.strictEqual(easeElasticIn.amplitude(-1.0)(0.1), easeElasticIn(0.1))
  assert.strictEqual(easeElasticIn.amplitude(+0.4)(0.2), easeElasticIn(0.2))
  assert.strictEqual(easeElasticIn.amplitude(+0.8)(0.3), easeElasticIn(0.3))
})

it("easeElasticIn.amplitude(a).period(p)(t) coerces t, a and p to numbers", () => {
  assert.strictEqual(easeElasticIn.amplitude("1.3").period("0.2")(".9"), easeElasticIn.amplitude(1.3).period(0.2)(0.9))
  assert.strictEqual(
    easeElasticIn
      .amplitude({
        valueOf: function () {
          return 1.3
        },
      })
      .period({
        valueOf: function () {
          return 0.2
        },
      })({
      valueOf: function () {
        return 0.9
      },
    }),
    easeElasticIn.amplitude(1.3).period(0.2)(0.9)
  )
})

it("easeElasticIn.amplitude(1.3)(t) returns the expected results", () => {
  assert.strictEqual(easeElasticIn.amplitude(1.3)(0.0), 0.0)
  assertInDelta(easeElasticIn.amplitude(1.3)(0.1), 0.000978)
  assertInDelta(easeElasticIn.amplitude(1.3)(0.2), -0.003576)
  assertInDelta(easeElasticIn.amplitude(1.3)(0.3), 0.001501)
  assertInDelta(easeElasticIn.amplitude(1.3)(0.4), 0.014663)
  assertInDelta(easeElasticIn.amplitude(1.3)(0.5), -0.036951)
  assertInDelta(easeElasticIn.amplitude(1.3)(0.6), 0.01351)
  assertInDelta(easeElasticIn.amplitude(1.3)(0.7), 0.124145)
  assertInDelta(easeElasticIn.amplitude(1.3)(0.8), -0.30395)
  assertInDelta(easeElasticIn.amplitude(1.3)(0.9), 0.10958)
  assert.strictEqual(easeElasticIn.amplitude(1.3)(1.0), 1.0)
})

it("easeElasticIn.amplitude(1.5).period(1)(t) returns the expected results", () => {
  assert.strictEqual(easeElasticIn.amplitude(1.5).period(1)(0.0), 0.0)
  assertInDelta(easeElasticIn.amplitude(1.5).period(1)(0.1), 0.000148)
  assertInDelta(easeElasticIn.amplitude(1.5).period(1)(0.2), -0.002212)
  assertInDelta(easeElasticIn.amplitude(1.5).period(1)(0.3), -0.00939)
  assertInDelta(easeElasticIn.amplitude(1.5).period(1)(0.4), -0.021498)
  assertInDelta(easeElasticIn.amplitude(1.5).period(1)(0.5), -0.030303)
  assertInDelta(easeElasticIn.amplitude(1.5).period(1)(0.6), -0.009352)
  assertInDelta(easeElasticIn.amplitude(1.5).period(1)(0.7), 0.093642)
  assertInDelta(easeElasticIn.amplitude(1.5).period(1)(0.8), 0.342077)
  assertInDelta(easeElasticIn.amplitude(1.5).period(1)(0.9), 0.732374)
  assert.strictEqual(easeElasticIn.amplitude(1.5).period(1)(1.0), 1.0)
})

it("easeElasticOut(t) returns the expected results", () => {
  const elasticOut = out(easeElasticIn)
  assert.strictEqual(easeElasticOut(0.0), elasticOut(0.0))
  assertInDelta(easeElasticOut(0.1), elasticOut(0.1))
  assertInDelta(easeElasticOut(0.2), elasticOut(0.2))
  assertInDelta(easeElasticOut(0.3), elasticOut(0.3))
  assertInDelta(easeElasticOut(0.4), elasticOut(0.4))
  assertInDelta(easeElasticOut(0.5), elasticOut(0.5))
  assertInDelta(easeElasticOut(0.6), elasticOut(0.6))
  assertInDelta(easeElasticOut(0.7), elasticOut(0.7))
  assertInDelta(easeElasticOut(0.8), elasticOut(0.8))
  assertInDelta(easeElasticOut(0.9), elasticOut(0.9))
  assert.strictEqual(easeElasticOut(1.0), elasticOut(1.0))
})

it("easeElasticOut.amplitude(a).period(p)(t) coerces t, a and p to numbers", () => {
  assert.strictEqual(
    easeElasticOut.amplitude("1.3").period("0.2")(".9"),
    easeElasticOut.amplitude(1.3).period(0.2)(0.9)
  )
  assert.strictEqual(
    easeElasticOut
      .amplitude({
        valueOf: function () {
          return 1.3
        },
      })
      .period({
        valueOf: function () {
          return 0.2
        },
      })({
      valueOf: function () {
        return 0.9
      },
    }),
    easeElasticOut.amplitude(1.3).period(0.2)(0.9)
  )
})

it("easeElasticInOut(t) returns the expected results", () => {
  const elasticInOut = inOut(easeElasticIn)
  assert.strictEqual(easeElasticInOut(0.0), elasticInOut(0.0))
  assertInDelta(easeElasticInOut(0.1), elasticInOut(0.1))
  assertInDelta(easeElasticInOut(0.2), elasticInOut(0.2))
  assertInDelta(easeElasticInOut(0.3), elasticInOut(0.3))
  assertInDelta(easeElasticInOut(0.4), elasticInOut(0.4))
  assertInDelta(easeElasticInOut(0.5), elasticInOut(0.5))
  assertInDelta(easeElasticInOut(0.6), elasticInOut(0.6))
  assertInDelta(easeElasticInOut(0.7), elasticInOut(0.7))
  assertInDelta(easeElasticInOut(0.8), elasticInOut(0.8))
  assertInDelta(easeElasticInOut(0.9), elasticInOut(0.9))
  assert.strictEqual(easeElasticInOut(1.0), elasticInOut(1.0))
})

it("easeElasticInOut.amplitude(a).period(p)(t) coerces t, a and p to numbers", () => {
  assert.strictEqual(
    easeElasticInOut.amplitude("1.3").period("0.2")(".9"),
    easeElasticInOut.amplitude(1.3).period(0.2)(0.9)
  )
  assert.strictEqual(
    easeElasticInOut
      .amplitude({
        valueOf: function () {
          return 1.3
        },
      })
      .period({
        valueOf: function () {
          return 0.2
        },
      })({
      valueOf: function () {
        return 0.9
      },
    }),
    easeElasticInOut.amplitude(1.3).period(0.2)(0.9)
  )
})
import assert from "assert"
import { easeExp, easeExpIn, easeExpInOut, easeExpOut } from "../src/index.js"
import { out, inOut } from "./generic.js"
import { assertInDelta } from "./asserts.js"

it("easeExp is an alias for easeExpInOut", () => {
  assert.strictEqual(easeExp, easeExpInOut)
})

it("easeExpIn(t) returns the expected results", () => {
  assert.strictEqual(easeExpIn(0.0), 0.0)
  assertInDelta(easeExpIn(0.1), 0.000978)
  assertInDelta(easeExpIn(0.2), 0.002933)
  assertInDelta(easeExpIn(0.3), 0.006843)
  assertInDelta(easeExpIn(0.4), 0.014663)
  assertInDelta(easeExpIn(0.5), 0.030303)
  assertInDelta(easeExpIn(0.6), 0.061584)
  assertInDelta(easeExpIn(0.7), 0.124145)
  assertInDelta(easeExpIn(0.8), 0.249267)
  assertInDelta(easeExpIn(0.9), 0.499511)
  assert.strictEqual(easeExpIn(1.0), 1.0)
})

it("easeExpIn(t) coerces t to a number", () => {
  assert.strictEqual(easeExpIn(".9"), easeExpIn(0.9))
  assert.strictEqual(
    easeExpIn({
      valueOf: function () {
        return 0.9
      },
    }),
    easeExpIn(0.9)
  )
})

it("easeExpOut(t) returns the expected results", () => {
  const expOut = out(easeExpIn)
  assertInDelta(easeExpOut(0.0), expOut(0.0))
  assertInDelta(easeExpOut(0.1), expOut(0.1))
  assertInDelta(easeExpOut(0.2), expOut(0.2))
  assertInDelta(easeExpOut(0.3), expOut(0.3))
  assertInDelta(easeExpOut(0.4), expOut(0.4))
  assertInDelta(easeExpOut(0.5), expOut(0.5))
  assertInDelta(easeExpOut(0.6), expOut(0.6))
  assertInDelta(easeExpOut(0.7), expOut(0.7))
  assertInDelta(easeExpOut(0.8), expOut(0.8))
  assertInDelta(easeExpOut(0.9), expOut(0.9))
  assertInDelta(easeExpOut(1.0), expOut(1.0))
})

it("easeExpOut(t) coerces t to a number", () => {
  assert.strictEqual(easeExpOut(".9"), easeExpOut(0.9))
  assert.strictEqual(
    easeExpOut({
      valueOf: function () {
        return 0.9
      },
    }),
    easeExpOut(0.9)
  )
})

it("easeExpInOut(t) returns the expected results", () => {
  const expInOut = inOut(easeExpIn)
  assert.strictEqual(easeExpInOut(0.0), expInOut(0.0))
  assertInDelta(easeExpInOut(0.1), expInOut(0.1))
  assertInDelta(easeExpInOut(0.2), expInOut(0.2))
  assertInDelta(easeExpInOut(0.3), expInOut(0.3))
  assertInDelta(easeExpInOut(0.4), expInOut(0.4))
  assertInDelta(easeExpInOut(0.5), expInOut(0.5))
  assertInDelta(easeExpInOut(0.6), expInOut(0.6))
  assertInDelta(easeExpInOut(0.7), expInOut(0.7))
  assertInDelta(easeExpInOut(0.8), expInOut(0.8))
  assertInDelta(easeExpInOut(0.9), expInOut(0.9))
  assert.strictEqual(easeExpInOut(1.0), expInOut(1.0))
})

it("easeExpInOut(t) coerces t to a number", () => {
  assert.strictEqual(easeExpInOut(".9"), easeExpInOut(0.9))
  assert.strictEqual(
    easeExpInOut({
      valueOf: function () {
        return 0.9
      },
    }),
    easeExpInOut(0.9)
  )
})
export function out(easeIn) {
  return t => 1 - easeIn(1 - t)
}

export function inOut(easeIn) {
  return t => (t < 0.5 ? easeIn(t * 2) : 2 - easeIn((1 - t) * 2)) / 2
}
import assert from "assert"
import { easeLinear } from "../src/index.js"
import { assertInDelta } from "./asserts.js"

it("easeLinear(t) returns the expected results", () => {
  assert.strictEqual(easeLinear(0.0), 0.0)
  assertInDelta(easeLinear(0.1), 0.1)
  assertInDelta(easeLinear(0.2), 0.2)
  assertInDelta(easeLinear(0.3), 0.3)
  assertInDelta(easeLinear(0.4), 0.4)
  assertInDelta(easeLinear(0.5), 0.5)
  assertInDelta(easeLinear(0.6), 0.6)
  assertInDelta(easeLinear(0.7), 0.7)
  assertInDelta(easeLinear(0.8), 0.8)
  assertInDelta(easeLinear(0.9), 0.9)
  assert.strictEqual(easeLinear(1.0), 1.0)
})

it("easeLinear(t) coerces t to a number", () => {
  assert.strictEqual(easeLinear(".9"), easeLinear(0.9))
  assert.strictEqual(
    easeLinear({
      valueOf: function () {
        return 0.9
      },
    }),
    easeLinear(0.9)
  )
})
import assert from "assert"
import { easePoly, easePolyIn, easePolyInOut, easePolyOut } from "../src/index.js"
import { out, inOut } from "./generic.js"
import { assertInDelta } from "./asserts.js"

it("easePoly is an alias for easePolyInOut", () => {
  assert.strictEqual(easePoly, easePolyInOut)
})

it("easePolyIn(t) returns the expected results", () => {
  assert.strictEqual(easePolyIn(0.0), 0.0)
  assertInDelta(easePolyIn(0.1), 0.001)
  assertInDelta(easePolyIn(0.2), 0.008)
  assertInDelta(easePolyIn(0.3), 0.027)
  assertInDelta(easePolyIn(0.4), 0.064)
  assertInDelta(easePolyIn(0.5), 0.125)
  assertInDelta(easePolyIn(0.6), 0.216)
  assertInDelta(easePolyIn(0.7), 0.343)
  assertInDelta(easePolyIn(0.8), 0.512)
  assertInDelta(easePolyIn(0.9), 0.729)
  assert.strictEqual(easePolyIn(1.0), 1.0)
})

it("easePolyIn(t) coerces t to a number", () => {
  assert.strictEqual(easePolyIn(".9"), easePolyIn(0.9))
  assert.strictEqual(
    easePolyIn({
      valueOf: function () {
        return 0.9
      },
    }),
    easePolyIn(0.9)
  )
})

it("easePolyIn(t) is the same as polyIn.exponent(3)(t)", () => {
  assert.strictEqual(easePolyIn(0.1), easePolyIn.exponent(3)(0.1))
  assert.strictEqual(easePolyIn(0.2), easePolyIn.exponent(3)(0.2))
  assert.strictEqual(easePolyIn(0.3), easePolyIn.exponent(3)(0.3))
})

it("easePolyIn.exponent(e)(t) coerces t and e to numbers", () => {
  assert.strictEqual(easePolyIn.exponent("1.3")(".9"), easePolyIn.exponent(1.3)(0.9))
  assert.strictEqual(
    easePolyIn.exponent({
      valueOf: function () {
        return 1.3
      },
    })({
      valueOf: function () {
        return 0.9
      },
    }),
    easePolyIn.exponent(1.3)(0.9)
  )
})

it("easePolyIn.exponent(2.5)(t) returns the expected results", () => {
  assert.strictEqual(easePolyIn.exponent(2.5)(0.0), 0.0)
  assertInDelta(easePolyIn.exponent(2.5)(0.1), 0.003162)
  assertInDelta(easePolyIn.exponent(2.5)(0.2), 0.017889)
  assertInDelta(easePolyIn.exponent(2.5)(0.3), 0.049295)
  assertInDelta(easePolyIn.exponent(2.5)(0.4), 0.101193)
  assertInDelta(easePolyIn.exponent(2.5)(0.5), 0.176777)
  assertInDelta(easePolyIn.exponent(2.5)(0.6), 0.278855)
  assertInDelta(easePolyIn.exponent(2.5)(0.7), 0.409963)
  assertInDelta(easePolyIn.exponent(2.5)(0.8), 0.572433)
  assertInDelta(easePolyIn.exponent(2.5)(0.9), 0.768433)
  assert.strictEqual(easePolyIn.exponent(2.5)(1.0), 1.0)
})

it("easePolyOut.exponent(e)(t) coerces t and e to numbers", () => {
  assert.strictEqual(easePolyOut.exponent("1.3")(".9"), easePolyOut.exponent(1.3)(0.9))
  assert.strictEqual(
    easePolyOut.exponent({
      valueOf: function () {
        return 1.3
      },
    })({
      valueOf: function () {
        return 0.9
      },
    }),
    easePolyOut.exponent(1.3)(0.9)
  )
})

it("easePolyOut(t) is the same as polyOut.exponent(3)(t)", () => {
  assert.strictEqual(easePolyOut(0.1), easePolyOut.exponent(3)(0.1))
  assert.strictEqual(easePolyOut(0.2), easePolyOut.exponent(3)(0.2))
  assert.strictEqual(easePolyOut(0.3), easePolyOut.exponent(3)(0.3))
})

it("easePolyOut(t, null) is the same as polyOut.exponent(3)(t)", () => {
  assert.strictEqual(easePolyOut(0.1, null), easePolyOut.exponent(3)(0.1))
  assert.strictEqual(easePolyOut(0.2, null), easePolyOut.exponent(3)(0.2))
  assert.strictEqual(easePolyOut(0.3, null), easePolyOut.exponent(3)(0.3))
})

it("easePolyOut(t, undefined) is the same as polyOut.exponent(3)(t)", () => {
  assert.strictEqual(easePolyOut(0.1, undefined), easePolyOut.exponent(3)(0.1))
  assert.strictEqual(easePolyOut(0.2, undefined), easePolyOut.exponent(3)(0.2))
  assert.strictEqual(easePolyOut(0.3, undefined), easePolyOut.exponent(3)(0.3))
})

it("easePolyOut.exponent(2.5)(t) returns the expected results", () => {
  const polyOut = out(easePolyIn.exponent(2.5))
  assert.strictEqual(easePolyOut.exponent(2.5)(0.0), polyOut(0.0))
  assertInDelta(easePolyOut.exponent(2.5)(0.1), polyOut(0.1))
  assertInDelta(easePolyOut.exponent(2.5)(0.2), polyOut(0.2))
  assertInDelta(easePolyOut.exponent(2.5)(0.3), polyOut(0.3))
  assertInDelta(easePolyOut.exponent(2.5)(0.4), polyOut(0.4))
  assertInDelta(easePolyOut.exponent(2.5)(0.5), polyOut(0.5))
  assertInDelta(easePolyOut.exponent(2.5)(0.6), polyOut(0.6))
  assertInDelta(easePolyOut.exponent(2.5)(0.7), polyOut(0.7))
  assertInDelta(easePolyOut.exponent(2.5)(0.8), polyOut(0.8))
  assertInDelta(easePolyOut.exponent(2.5)(0.9), polyOut(0.9))
  assert.strictEqual(easePolyOut.exponent(2.5)(1.0), polyOut(1.0))
})

it("easePolyInOut.exponent(e)(t) coerces t and e to numbers", () => {
  assert.strictEqual(easePolyInOut.exponent("1.3")(".9"), easePolyInOut.exponent(1.3)(0.9))
  assert.strictEqual(
    easePolyInOut.exponent({
      valueOf: function () {
        return 1.3
      },
    })({
      valueOf: function () {
        return 0.9
      },
    }),
    easePolyInOut.exponent(1.3)(0.9)
  )
})

it("easePolyInOut(t) is the same as polyInOut.exponent(3)(t)", () => {
  assert.strictEqual(easePolyInOut(0.1), easePolyInOut.exponent(3)(0.1))
  assert.strictEqual(easePolyInOut(0.2), easePolyInOut.exponent(3)(0.2))
  assert.strictEqual(easePolyInOut(0.3), easePolyInOut.exponent(3)(0.3))
})

it("easePolyInOut.exponent(2.5)(t) returns the expected results", () => {
  const polyInOut = inOut(easePolyIn.exponent(2.5))
  assertInDelta(easePolyInOut.exponent(2.5)(0.0), polyInOut(0.0))
  assertInDelta(easePolyInOut.exponent(2.5)(0.1), polyInOut(0.1))
  assertInDelta(easePolyInOut.exponent(2.5)(0.2), polyInOut(0.2))
  assertInDelta(easePolyInOut.exponent(2.5)(0.3), polyInOut(0.3))
  assertInDelta(easePolyInOut.exponent(2.5)(0.4), polyInOut(0.4))
  assertInDelta(easePolyInOut.exponent(2.5)(0.5), polyInOut(0.5))
  assertInDelta(easePolyInOut.exponent(2.5)(0.6), polyInOut(0.6))
  assertInDelta(easePolyInOut.exponent(2.5)(0.7), polyInOut(0.7))
  assertInDelta(easePolyInOut.exponent(2.5)(0.8), polyInOut(0.8))
  assertInDelta(easePolyInOut.exponent(2.5)(0.9), polyInOut(0.9))
  assertInDelta(easePolyInOut.exponent(2.5)(1.0), polyInOut(1.0))
})
import assert from "assert"
import { easeQuad, easeQuadIn, easeQuadInOut, easeQuadOut } from "../src/index.js"
import { out, inOut } from "./generic.js"
import { assertInDelta } from "./asserts.js"

it("easeQuad is an alias for easeQuadInOut", () => {
  assert.strictEqual(easeQuad, easeQuadInOut)
})

it("easeQuadIn(t) returns the expected results", () => {
  assert.strictEqual(easeQuadIn(0.0), 0.0)
  assertInDelta(easeQuadIn(0.1), 0.01)
  assertInDelta(easeQuadIn(0.2), 0.04)
  assertInDelta(easeQuadIn(0.3), 0.09)
  assertInDelta(easeQuadIn(0.4), 0.16)
  assertInDelta(easeQuadIn(0.5), 0.25)
  assertInDelta(easeQuadIn(0.6), 0.36)
  assertInDelta(easeQuadIn(0.7), 0.49)
  assertInDelta(easeQuadIn(0.8), 0.64)
  assertInDelta(easeQuadIn(0.9), 0.81)
  assert.strictEqual(easeQuadIn(1.0), 1.0)
})

it("easeQuadIn(t) coerces t to a number", () => {
  assert.strictEqual(easeQuadIn(".9"), easeQuadIn(0.9))
  assert.strictEqual(
    easeQuadIn({
      valueOf: function () {
        return 0.9
      },
    }),
    easeQuadIn(0.9)
  )
})

it("easeQuadOut(t) returns the expected results", () => {
  var quadOut = out(easeQuadIn)
  assertInDelta(easeQuadOut(0.0), quadOut(0.0))
  assertInDelta(easeQuadOut(0.1), quadOut(0.1))
  assertInDelta(easeQuadOut(0.2), quadOut(0.2))
  assertInDelta(easeQuadOut(0.3), quadOut(0.3))
  assertInDelta(easeQuadOut(0.4), quadOut(0.4))
  assertInDelta(easeQuadOut(0.5), quadOut(0.5))
  assertInDelta(easeQuadOut(0.6), quadOut(0.6))
  assertInDelta(easeQuadOut(0.7), quadOut(0.7))
  assertInDelta(easeQuadOut(0.8), quadOut(0.8))
  assertInDelta(easeQuadOut(0.9), quadOut(0.9))
  assertInDelta(easeQuadOut(1.0), quadOut(1.0))
})

it("easeQuadOut(t) coerces t to a number", () => {
  assert.strictEqual(easeQuadOut(".9"), easeQuadOut(0.9))
  assert.strictEqual(
    easeQuadOut({
      valueOf: function () {
        return 0.9
      },
    }),
    easeQuadOut(0.9)
  )
})

it("easeQuadInOut(t) returns the expected results", () => {
  var quadInOut = inOut(easeQuadIn)
  assertInDelta(easeQuadInOut(0.0), quadInOut(0.0))
  assertInDelta(easeQuadInOut(0.1), quadInOut(0.1))
  assertInDelta(easeQuadInOut(0.2), quadInOut(0.2))
  assertInDelta(easeQuadInOut(0.3), quadInOut(0.3))
  assertInDelta(easeQuadInOut(0.4), quadInOut(0.4))
  assertInDelta(easeQuadInOut(0.5), quadInOut(0.5))
  assertInDelta(easeQuadInOut(0.6), quadInOut(0.6))
  assertInDelta(easeQuadInOut(0.7), quadInOut(0.7))
  assertInDelta(easeQuadInOut(0.8), quadInOut(0.8))
  assertInDelta(easeQuadInOut(0.9), quadInOut(0.9))
  assertInDelta(easeQuadInOut(1.0), quadInOut(1.0))
})

it("easeQuadInOut(t) coerces t to a number", () => {
  assert.strictEqual(easeQuadInOut(".9"), easeQuadInOut(0.9))
  assert.strictEqual(
    easeQuadInOut({
      valueOf: function () {
        return 0.9
      },
    }),
    easeQuadInOut(0.9)
  )
})
import assert from "assert"
import { easeSin, easeSinIn, easeSinInOut, easeSinOut } from "../src/index.js"
import { out, inOut } from "./generic.js"
import { assertInDelta } from "./asserts.js"

it("easeSin is an alias for easeSinInOut", () => {
  assert.strictEqual(easeSin, easeSinInOut)
})

it("easeSinIn(t) returns the expected results", () => {
  assert.strictEqual(easeSinIn(0.0), 0.0)
  assertInDelta(easeSinIn(0.1), 0.012312)
  assertInDelta(easeSinIn(0.2), 0.048943)
  assertInDelta(easeSinIn(0.3), 0.108993)
  assertInDelta(easeSinIn(0.4), 0.190983)
  assertInDelta(easeSinIn(0.5), 0.292893)
  assertInDelta(easeSinIn(0.6), 0.412215)
  assertInDelta(easeSinIn(0.7), 0.54601)
  assertInDelta(easeSinIn(0.8), 0.690983)
  assertInDelta(easeSinIn(0.9), 0.843566)
  assert.strictEqual(easeSinIn(1.0), 1.0)
})

it("easeSinIn(t) coerces t to a number", () => {
  assert.strictEqual(easeSinIn(".9"), easeSinIn(0.9))
  assert.strictEqual(
    easeSinIn({
      valueOf: function () {
        return 0.9
      },
    }),
    easeSinIn(0.9)
  )
})

it("easeSinOut(t) returns the expected results", () => {
  var sinOut = out(easeSinIn)
  assertInDelta(easeSinOut(0.0), sinOut(0.0))
  assertInDelta(easeSinOut(0.1), sinOut(0.1))
  assertInDelta(easeSinOut(0.2), sinOut(0.2))
  assertInDelta(easeSinOut(0.3), sinOut(0.3))
  assertInDelta(easeSinOut(0.4), sinOut(0.4))
  assertInDelta(easeSinOut(0.5), sinOut(0.5))
  assertInDelta(easeSinOut(0.6), sinOut(0.6))
  assertInDelta(easeSinOut(0.7), sinOut(0.7))
  assertInDelta(easeSinOut(0.8), sinOut(0.8))
  assertInDelta(easeSinOut(0.9), sinOut(0.9))
  assertInDelta(easeSinOut(1.0), sinOut(1.0))
})

it("easeSinOut(t) coerces t to a number", () => {
  assert.strictEqual(easeSinOut(".9"), easeSinOut(0.9))
  assert.strictEqual(
    easeSinOut({
      valueOf: function () {
        return 0.9
      },
    }),
    easeSinOut(0.9)
  )
})

it("easeSinInOut(t) returns the expected results", () => {
  var sinInOut = inOut(easeSinIn)
  assertInDelta(easeSinInOut(0.0), sinInOut(0.0))
  assertInDelta(easeSinInOut(0.1), sinInOut(0.1))
  assertInDelta(easeSinInOut(0.2), sinInOut(0.2))
  assertInDelta(easeSinInOut(0.3), sinInOut(0.3))
  assertInDelta(easeSinInOut(0.4), sinInOut(0.4))
  assertInDelta(easeSinInOut(0.5), sinInOut(0.5))
  assertInDelta(easeSinInOut(0.6), sinInOut(0.6))
  assertInDelta(easeSinInOut(0.7), sinInOut(0.7))
  assertInDelta(easeSinInOut(0.8), sinInOut(0.8))
  assertInDelta(easeSinInOut(0.9), sinInOut(0.9))
  assertInDelta(easeSinInOut(1.0), sinInOut(1.0))
})

it("easeSinInOut(t) coerces t to a number", () => {
  assert.strictEqual(easeSinInOut(".9"), easeSinInOut(0.9))
  assert.strictEqual(
    easeSinInOut({
      valueOf: function () {
        return 0.9
      },
    }),
    easeSinInOut(0.9)
  )
})
