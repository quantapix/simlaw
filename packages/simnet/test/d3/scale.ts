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
import { scaleBand } from "../src/index.js"

it("scaleBand() has the expected defaults", () => {
  const s = scaleBand()
  assert.deepStrictEqual(s.domain(), [])
  assert.deepStrictEqual(s.range(), [0, 1])
  assert.strictEqual(s.bandwidth(), 1)
  assert.strictEqual(s.step(), 1)
  assert.strictEqual(s.round(), false)
  assert.strictEqual(s.paddingInner(), 0)
  assert.strictEqual(s.paddingOuter(), 0)
  assert.strictEqual(s.align(), 0.5)
})

it("band(value) computes discrete bands in a continuous range", () => {
  const s = scaleBand([0, 960])
  assert.strictEqual(s("foo"), undefined)
  s.domain(["foo", "bar"])
  assert.strictEqual(s("foo"), 0)
  assert.strictEqual(s("bar"), 480)
  s.domain(["a", "b", "c"]).range([0, 120])
  assert.deepStrictEqual(s.domain().map(s), [0, 40, 80])
  assert.strictEqual(s.bandwidth(), 40)
  s.padding(0.2)
  assert.deepStrictEqual(s.domain().map(s), [7.5, 45, 82.5])
  assert.strictEqual(s.bandwidth(), 30)
})

it("band(value) returns undefined for values outside the domain", () => {
  const s = scaleBand(["a", "b", "c"], [0, 1])
  assert.strictEqual(s("d"), undefined)
  assert.strictEqual(s("e"), undefined)
  assert.strictEqual(s("f"), undefined)
})

it("band(value) does not implicitly add values to the domain", () => {
  const s = scaleBand(["a", "b", "c"], [0, 1])
  s("d")
  s("e")
  assert.deepStrictEqual(s.domain(), ["a", "b", "c"])
})

it("band.step() returns the distance between the starts of adjacent bands", () => {
  const s = scaleBand([0, 960])
  assert.strictEqual(s.domain(["foo"]).step(), 960)
  assert.strictEqual(s.domain(["foo", "bar"]).step(), 480)
  assert.strictEqual(s.domain(["foo", "bar", "baz"]).step(), 320)
  s.padding(0.5)
  assert.strictEqual(s.domain(["foo"]).step(), 640)
  assert.strictEqual(s.domain(["foo", "bar"]).step(), 384)
})

it("band.bandwidth() returns the width of the band", () => {
  const s = scaleBand([0, 960])
  assert.strictEqual(s.domain([]).bandwidth(), 960)
  assert.strictEqual(s.domain(["foo"]).bandwidth(), 960)
  assert.strictEqual(s.domain(["foo", "bar"]).bandwidth(), 480)
  assert.strictEqual(s.domain(["foo", "bar", "baz"]).bandwidth(), 320)
  s.padding(0.5)
  assert.strictEqual(s.domain([]).bandwidth(), 480)
  assert.strictEqual(s.domain(["foo"]).bandwidth(), 320)
  assert.strictEqual(s.domain(["foo", "bar"]).bandwidth(), 192)
})

it("band.domain([]) computes reasonable band and step values", () => {
  const s = scaleBand([0, 960]).domain([])
  assert.strictEqual(s.step(), 960)
  assert.strictEqual(s.bandwidth(), 960)
  s.padding(0.5)
  assert.strictEqual(s.step(), 960)
  assert.strictEqual(s.bandwidth(), 480)
  s.padding(1)
  assert.strictEqual(s.step(), 960)
  assert.strictEqual(s.bandwidth(), 0)
})

it("band.domain([value]) computes a reasonable singleton band, even with padding", () => {
  const s = scaleBand([0, 960]).domain(["foo"])
  assert.strictEqual(s("foo"), 0)
  assert.strictEqual(s.step(), 960)
  assert.strictEqual(s.bandwidth(), 960)
  s.padding(0.5)
  assert.strictEqual(s("foo"), 320)
  assert.strictEqual(s.step(), 640)
  assert.strictEqual(s.bandwidth(), 320)
  s.padding(1)
  assert.strictEqual(s("foo"), 480)
  assert.strictEqual(s.step(), 480)
  assert.strictEqual(s.bandwidth(), 0)
})

it("band.domain(values) recomputes the bands", () => {
  const s = scaleBand().domain(["a", "b", "c"]).rangeRound([0, 100])
  assert.deepStrictEqual(s.domain().map(s), [1, 34, 67])
  assert.strictEqual(s.bandwidth(), 33)
  s.domain(["a", "b", "c", "d"])
  assert.deepStrictEqual(s.domain().map(s), [0, 25, 50, 75])
  assert.strictEqual(s.bandwidth(), 25)
})

it("band.domain(domain) accepts an iterable", () => {
  assert.deepStrictEqual(
    scaleBand()
      .domain(new Set(["a", "b", "c"]))
      .domain(),
    ["a", "b", "c"]
  )
})

it("band.domain(values) makes a copy of the specified domain values", () => {
  const domain = ["red", "green"]
  const s = scaleBand().domain(domain)
  domain.push("blue")
  assert.deepStrictEqual(s.domain(), ["red", "green"])
})

it("band.domain() returns a copy of the domain", () => {
  const s = scaleBand().domain(["red", "green"])
  const domain = s.domain()
  assert.deepStrictEqual(domain, ["red", "green"])
  domain.push("blue")
  assert.deepStrictEqual(s.domain(), ["red", "green"])
})

it("band.range(values) can be descending", () => {
  const s = scaleBand().domain(["a", "b", "c"]).range([120, 0])
  assert.deepStrictEqual(s.domain().map(s), [80, 40, 0])
  assert.strictEqual(s.bandwidth(), 40)
  s.padding(0.2)
  assert.deepStrictEqual(s.domain().map(s), [82.5, 45, 7.5])
  assert.strictEqual(s.bandwidth(), 30)
})

it("band.range(values) makes a copy of the specified range values", () => {
  const range = [1, 2]
  const s = scaleBand().range(range)
  range.push("blue")
  assert.deepStrictEqual(s.range(), [1, 2])
})

it("band.range() returns a copy of the range", () => {
  const s = scaleBand().range([1, 2])
  const range = s.range()
  assert.deepStrictEqual(range, [1, 2])
  range.push("blue")
  assert.deepStrictEqual(s.range(), [1, 2])
})

it("band.range(values) accepts an iterable", () => {
  const s = scaleBand().range(new Set([1, 2]))
  assert.deepStrictEqual(s.range(), [1, 2])
})

it("band.rangeRound(values) accepts an iterable", () => {
  const s = scaleBand().rangeRound(new Set([1, 2]))
  assert.deepStrictEqual(s.range(), [1, 2])
})

it("band.range(values) coerces values to numbers", () => {
  const s = scaleBand().range(["1.0", "2.0"])
  assert.deepStrictEqual(s.range(), [1, 2])
})

it("band.rangeRound(values) coerces values to numbers", () => {
  const s = scaleBand().rangeRound(["1.0", "2.0"])
  assert.deepStrictEqual(s.range(), [1, 2])
})

it("band.paddingInner(p) specifies the inner padding p", () => {
  const s = scaleBand().domain(["a", "b", "c"]).range([120, 0]).paddingInner(0.1).round(true)
  assert.deepStrictEqual(s.domain().map(s), [83, 42, 1])
  assert.strictEqual(s.bandwidth(), 37)
  s.paddingInner(0.2)
  assert.deepStrictEqual(s.domain().map(s), [85, 43, 1])
  assert.strictEqual(s.bandwidth(), 34)
})

it("band.paddingInner(p) coerces p to a number <= 1", () => {
  const s = scaleBand()
  assert.strictEqual(s.paddingInner("1.0").paddingInner(), 1)
  assert.strictEqual(s.paddingInner("-1.0").paddingInner(), -1)
  assert.strictEqual(s.paddingInner("2.0").paddingInner(), 1)
  assert(Number.isNaN(s.paddingInner(NaN).paddingInner()))
})

it("band.paddingOuter(p) specifies the outer padding p", () => {
  const s = scaleBand().domain(["a", "b", "c"]).range([120, 0]).paddingInner(0.2).paddingOuter(0.1)
  assert.deepStrictEqual(s.domain().map(s), [84, 44, 4])
  assert.strictEqual(s.bandwidth(), 32)
  s.paddingOuter(1)
  assert.deepStrictEqual(s.domain().map(s), [75, 50, 25])
  assert.strictEqual(s.bandwidth(), 20)
})

it("band.paddingOuter(p) coerces p to a number", () => {
  const s = scaleBand()
  assert.strictEqual(s.paddingOuter("1.0").paddingOuter(), 1)
  assert.strictEqual(s.paddingOuter("-1.0").paddingOuter(), -1)
  assert.strictEqual(s.paddingOuter("2.0").paddingOuter(), 2)
  assert(Number.isNaN(s.paddingOuter(NaN).paddingOuter()))
})

it("band.rangeRound(values) is an alias for band.range(values).round(true)", () => {
  const s = scaleBand().domain(["a", "b", "c"]).rangeRound([0, 100])
  assert.deepStrictEqual(s.range(), [0, 100])
  assert.strictEqual(s.round(), true)
})

it("band.round(true) computes discrete rounded bands in a continuous range", () => {
  const s = scaleBand().domain(["a", "b", "c"]).range([0, 100]).round(true)
  assert.deepStrictEqual(s.domain().map(s), [1, 34, 67])
  assert.strictEqual(s.bandwidth(), 33)
  s.padding(0.2)
  assert.deepStrictEqual(s.domain().map(s), [7, 38, 69])
  assert.strictEqual(s.bandwidth(), 25)
})

it("band.copy() copies all fields", () => {
  const s1 = scaleBand().domain(["red", "green"]).range([1, 2]).round(true).paddingInner(0.1).paddingOuter(0.2)
  const s2 = s1.copy()
  assert.deepStrictEqual(s2.domain(), s1.domain())
  assert.deepStrictEqual(s2.range(), s1.range())
  assert.strictEqual(s2.round(), s1.round())
  assert.strictEqual(s2.paddingInner(), s1.paddingInner())
  assert.strictEqual(s2.paddingOuter(), s1.paddingOuter())
})

it("band.copy() isolates changes to the domain", () => {
  const s1 = scaleBand().domain(["foo", "bar"]).range([0, 2])
  const s2 = s1.copy()
  s1.domain(["red", "blue"])
  assert.deepStrictEqual(s2.domain(), ["foo", "bar"])
  assert.deepStrictEqual(s1.domain().map(s1), [0, 1])
  assert.deepStrictEqual(s2.domain().map(s2), [0, 1])
  s2.domain(["red", "blue"])
  assert.deepStrictEqual(s1.domain(), ["red", "blue"])
  assert.deepStrictEqual(s1.domain().map(s1), [0, 1])
  assert.deepStrictEqual(s2.domain().map(s2), [0, 1])
})

it("band.copy() isolates changes to the range", () => {
  const s1 = scaleBand().domain(["foo", "bar"]).range([0, 2])
  const s2 = s1.copy()
  s1.range([3, 5])
  assert.deepStrictEqual(s2.range(), [0, 2])
  assert.deepStrictEqual(s1.domain().map(s1), [3, 4])
  assert.deepStrictEqual(s2.domain().map(s2), [0, 1])
  s2.range([5, 7])
  assert.deepStrictEqual(s1.range(), [3, 5])
  assert.deepStrictEqual(s1.domain().map(s1), [3, 4])
  assert.deepStrictEqual(s2.domain().map(s2), [5, 6])
})

export function local(year, month, day, hours, minutes, seconds, milliseconds) {
  if (year == null) year = 0
  if (month == null) month = 0
  if (day == null) day = 1
  if (hours == null) hours = 0
  if (minutes == null) minutes = 0
  if (seconds == null) seconds = 0
  if (milliseconds == null) milliseconds = 0
  if (0 <= year && year < 100) {
    const date = new Date(-1, month, day, hours, minutes, seconds, milliseconds)
    date.setFullYear(year)
    return date
  }
  return new Date(year, month, day, hours, minutes, seconds, milliseconds)
}

export function utc(year, month, day, hours, minutes, seconds, milliseconds) {
  if (year == null) year = 0
  if (month == null) month = 0
  if (day == null) day = 1
  if (hours == null) hours = 0
  if (minutes == null) minutes = 0
  if (seconds == null) seconds = 0
  if (milliseconds == null) milliseconds = 0
  if (0 <= year && year < 100) {
    const date = new Date(Date.UTC(-1, month, day, hours, minutes, seconds, milliseconds))
    date.setUTCFullYear(year)
    return date
  }
  return new Date(Date.UTC(year, month, day, hours, minutes, seconds, milliseconds))
}
import assert from "assert"
import { scaleDiverging, scaleDivergingLog } from "../src/index.js"

it("scaleDiverging() has the expected defaults", () => {
  const s = scaleDiverging()
  assert.deepStrictEqual(s.domain(), [0, 0.5, 1])
  assert.strictEqual(s.interpolator()(0.42), 0.42)
  assert.strictEqual(s.clamp(), false)
  assert.strictEqual(s(-0.5), -0.5)
  assert.strictEqual(s(0.0), 0.0)
  assert.strictEqual(s(0.5), 0.5)
  assert.strictEqual(s(1.0), 1.0)
  assert.strictEqual(s(1.5), 1.5)
})

it("diverging.clamp(true) enables clamping", () => {
  const s = scaleDiverging().clamp(true)
  assert.strictEqual(s.clamp(), true)
  assert.strictEqual(s(-0.5), 0.0)
  assert.strictEqual(s(0.0), 0.0)
  assert.strictEqual(s(0.5), 0.5)
  assert.strictEqual(s(1.0), 1.0)
  assert.strictEqual(s(1.5), 1.0)
})

it("diverging.domain() coerces domain values to numbers", () => {
  const s = scaleDiverging().domain(["-1.20", " 0", "2.40"])
  assert.deepStrictEqual(s.domain(), [-1.2, 0, 2.4])
  assert.strictEqual(s(-1.2), 0.0)
  assert.strictEqual(s(0.6), 0.625)
  assert.strictEqual(s(2.4), 1.0)
})

it("diverging.domain() accepts an iterable", () => {
  const s = scaleDiverging().domain(new Set([-1.2, 0, 2.4]))
  assert.deepStrictEqual(s.domain(), [-1.2, 0, 2.4])
})

it("diverging.domain() handles a degenerate domain", () => {
  const s = scaleDiverging().domain([2, 2, 3])
  assert.deepStrictEqual(s.domain(), [2, 2, 3])
  assert.strictEqual(s(-1.2), 0.5)
  assert.strictEqual(s(0.6), 0.5)
  assert.strictEqual(s(2.4), 0.7)
  assert.deepStrictEqual(s.domain([1, 2, 2]).domain(), [1, 2, 2])
  assert.strictEqual(s(-1.0), -1)
  assert.strictEqual(s(0.5), -0.25)
  assert.strictEqual(s(2.4), 0.5)
  assert.deepStrictEqual(s.domain([2, 2, 2]).domain(), [2, 2, 2])
  assert.strictEqual(s(-1.0), 0.5)
  assert.strictEqual(s(0.5), 0.5)
  assert.strictEqual(s(2.4), 0.5)
})

it("diverging.domain() handles a descending domain", () => {
  const s = scaleDiverging().domain([4, 2, 1])
  assert.deepStrictEqual(s.domain(), [4, 2, 1])
  assert.strictEqual(s(1.2), 0.9)
  assert.strictEqual(s(2.0), 0.5)
  assert.strictEqual(s(3.0), 0.25)
})

it("divergingLog.domain() handles a descending domain", () => {
  const s = scaleDivergingLog().domain([3, 2, 1])
  assert.deepStrictEqual(s.domain(), [3, 2, 1])
  assert.strictEqual(s(1.2), 1 - 0.1315172029168969)
  assert.strictEqual(s(2.0), 1 - 0.5)
  assert.strictEqual(s(2.8), 1 - 0.9149213210862197)
})

it("divergingLog.domain() handles a descending negative domain", () => {
  const s = scaleDivergingLog().domain([-1, -2, -3])
  assert.deepStrictEqual(s.domain(), [-1, -2, -3])
  assert.strictEqual(s(-1.2), 0.1315172029168969)
  assert.strictEqual(s(-2.0), 0.5)
  assert.strictEqual(s(-2.8), 0.9149213210862197)
})

it("diverging.domain() handles a non-numeric domain", () => {
  const s = scaleDiverging().domain([NaN, 2, 3])
  assert.strictEqual(isNaN(s.domain()[0]), true)
  assert.strictEqual(isNaN(s(-1.2)), true)
  assert.strictEqual(isNaN(s(0.6)), true)
  assert.strictEqual(s(2.4), 0.7)
  assert.strictEqual(isNaN(s.domain([1, NaN, 2]).domain()[1]), true)
  assert.strictEqual(isNaN(s(-1.0)), true)
  assert.strictEqual(isNaN(s(0.5)), true)
  assert.strictEqual(isNaN(s(2.4)), true)
  assert.strictEqual(isNaN(s.domain([0, 1, NaN]).domain()[2]), true)
  assert.strictEqual(s(-1.0), -0.5)
  assert.strictEqual(s(0.5), 0.25)
  assert.strictEqual(isNaN(s(2.4)), true)
})

it("diverging.domain() only considers the first three elements of the domain", () => {
  const s = scaleDiverging().domain([-1, 100, 200, 3])
  assert.deepStrictEqual(s.domain(), [-1, 100, 200])
})

it("diverging.copy() returns an isolated copy of the scale", () => {
  const s1 = scaleDiverging().domain([1, 2, 3]).clamp(true)
  const s2 = s1.copy()
  assert.deepStrictEqual(s2.domain(), [1, 2, 3])
  assert.strictEqual(s2.clamp(), true)
  s1.domain([-1, 1, 2])
  assert.deepStrictEqual(s2.domain(), [1, 2, 3])
  s1.clamp(false)
  assert.strictEqual(s2.clamp(), true)
  s2.domain([3, 4, 5])
  assert.deepStrictEqual(s1.domain(), [-1, 1, 2])
  s2.clamp(true)
  assert.deepStrictEqual(s1.clamp(), false)
})

it("diverging.range() returns the computed range", () => {
  const s = scaleDiverging(function (t) {
    return t * 2 + 1
  })
  assert.deepStrictEqual(s.range(), [1, 2, 3])
})

it("diverging.interpolator(interpolator) sets the interpolator", () => {
  const i0 = function (t) {
    return t
  }
  const i1 = function (t) {
    return t * 2
  }
  const s = scaleDiverging(i0)
  assert.strictEqual(s.interpolator(), i0)
  assert.strictEqual(s.interpolator(i1), s)
  assert.strictEqual(s.interpolator(), i1)
  assert.strictEqual(s(-0.5), -1.0)
  assert.strictEqual(s(0.0), 0.0)
  assert.strictEqual(s(0.5), 1.0)
})

it("diverging.range(range) sets the interpolator", () => {
  const s = scaleDiverging().range([1, 3, 10])
  assert.strictEqual(s.interpolator()(0.5), 3)
  assert.deepStrictEqual(s.range(), [1, 3, 10])
})

it("diverging.range(range) ignores additional values", () => {
  const s = scaleDiverging().range([1, 3, 10, 20])
  assert.strictEqual(s.interpolator()(0.5), 3)
  assert.deepStrictEqual(s.range(), [1, 3, 10])
})

it("scaleDiverging(range) sets the interpolator", () => {
  const s = scaleDiverging([1, 3, 10])
  assert.strictEqual(s.interpolator()(0.5), 3)
  assert.deepStrictEqual(s.range(), [1, 3, 10])
})
import assert from "assert"
import { scaleIdentity } from "../src/index.js"

it("scaleIdentity() has the expected defaults", () => {
  const s = scaleIdentity()
  assert.deepStrictEqual(s.domain(), [0, 1])
  assert.deepStrictEqual(s.range(), [0, 1])
})

it("scaleIdentity(range) sets the domain and range", () => {
  const s = scaleIdentity([1, 2])
  assert.deepStrictEqual(s.domain(), [1, 2])
  assert.deepStrictEqual(s.range(), [1, 2])
})

it("identity(x) is the identity function", () => {
  const s = scaleIdentity().domain([1, 2])
  assert.strictEqual(s(0.5), 0.5)
  assert.strictEqual(s(1), 1)
  assert.strictEqual(s(1.5), 1.5)
  assert.strictEqual(s(2), 2)
  assert.strictEqual(s(2.5), 2.5)
})

it("identity(x) coerces input to a number", () => {
  const s = scaleIdentity().domain([1, 2])
  assert.strictEqual(s("2"), 2)
})

it("identity(undefined) returns unknown", () => {
  const s = scaleIdentity().unknown(-1)
  assert.strictEqual(s(undefined), -1)
  assert.strictEqual(s(null), -1)
  assert.strictEqual(s(NaN), -1)
  assert.strictEqual(s("N/A"), -1)
  assert.strictEqual(s(0.4), 0.4)
})

it("identity.invert(y) is the identity function", () => {
  const s = scaleIdentity().domain([1, 2])
  assert.strictEqual(s.invert(0.5), 0.5)
  assert.strictEqual(s.invert(1), 1)
  assert.strictEqual(s.invert(1.5), 1.5)
  assert.strictEqual(s.invert(2), 2)
  assert.strictEqual(s.invert(2.5), 2.5)
})

it("identity.invert(y) coerces range value to numbers", () => {
  const s = scaleIdentity().range(["0", "2"])
  assert.strictEqual(s.invert("1"), 1)
  s.range([new Date(1990, 0, 1), new Date(1991, 0, 1)])
  assert.strictEqual(s.invert(new Date(1990, 6, 2, 13)), +new Date(1990, 6, 2, 13))
  s.range(["#000", "#fff"])
  assert(isNaN(s.invert("#999")))
})

it("identity.invert(y) coerces input to a number", () => {
  const s = scaleIdentity().domain([1, 2])
  assert.strictEqual(s.invert("2"), 2)
})

it("identity.domain() is an alias for range()", () => {
  const s = scaleIdentity()
  assert.strictEqual(s.domain, s.range)
  assert.deepStrictEqual(s.domain(), s.range())
  s.domain([-10, 0, 100])
  assert.deepStrictEqual(s.range(), [-10, 0, 100])
  s.range([-10, 0, 100])
  assert.deepStrictEqual(s.domain(), [-10, 0, 100])
})

it("identity.domain() defaults to [0, 1]", () => {
  const s = scaleIdentity()
  assert.deepStrictEqual(s.domain(), [0, 1])
  assert.deepStrictEqual(s.range(), [0, 1])
  assert.strictEqual(s(0.5), 0.5)
})

it("identity.domain() coerces values to numbers", () => {
  const s = scaleIdentity().domain([new Date(1990, 0, 1), new Date(1991, 0, 1)])
  assert.strictEqual(typeof s.domain()[0], "number")
  assert.strictEqual(typeof s.domain()[1], "number")
  assert.strictEqual(s.domain()[0], +new Date(1990, 0, 1))
  assert.strictEqual(s.domain()[1], +new Date(1991, 0, 1))
  assert.strictEqual(typeof s(new Date(1989, 9, 20)), "number")
  assert.strictEqual(s(new Date(1989, 9, 20)), +new Date(1989, 9, 20))
  s.domain(["0", "1"])
  assert.strictEqual(typeof s.domain()[0], "number")
  assert.strictEqual(typeof s.domain()[1], "number")
  assert.strictEqual(s(0.5), 0.5)
  s.domain([new Number(0), new Number(1)])
  assert.strictEqual(typeof s.domain()[0], "number")
  assert.strictEqual(typeof s.domain()[1], "number")
  assert.strictEqual(s(0.5), 0.5)
  s.range([new Date(1990, 0, 1), new Date(1991, 0, 1)])
  assert.strictEqual(typeof s.range()[0], "number")
  assert.strictEqual(typeof s.range()[1], "number")
  assert.strictEqual(s.range()[0], +new Date(1990, 0, 1))
  assert.strictEqual(s.range()[1], +new Date(1991, 0, 1))
  assert.strictEqual(typeof s(new Date(1989, 9, 20)), "number")
  assert.strictEqual(s(new Date(1989, 9, 20)), +new Date(1989, 9, 20))
  s.range(["0", "1"])
  assert.strictEqual(typeof s.range()[0], "number")
  assert.strictEqual(typeof s.range()[1], "number")
  assert.strictEqual(s(0.5), 0.5)
  s.range([new Number(0), new Number(1)])
  assert.strictEqual(typeof s.range()[0], "number")
  assert.strictEqual(typeof s.range()[1], "number")
  assert.strictEqual(s(0.5), 0.5)
})

it("identity.domain() accepts an iterable", () => {
  const s = scaleIdentity().domain(new Set([1, 2]))
  assert.deepStrictEqual(s.domain(), [1, 2])
  assert.deepStrictEqual(s.range(), [1, 2])
})

it("identity.domain() can specify a polyidentity domain and range", () => {
  const s = scaleIdentity().domain([-10, 0, 100])
  assert.deepStrictEqual(s.domain(), [-10, 0, 100])
  assert.strictEqual(s(-5), -5)
  assert.strictEqual(s(50), 50)
  assert.strictEqual(s(75), 75)
  s.range([-10, 0, 100])
  assert.deepStrictEqual(s.range(), [-10, 0, 100])
  assert.strictEqual(s(-5), -5)
  assert.strictEqual(s(50), 50)
  assert.strictEqual(s(75), 75)
})

it("identity.domain() does not affect the identity function", () => {
  const s = scaleIdentity().domain([Infinity, NaN])
  assert.strictEqual(s(42), 42)
  assert.strictEqual(s.invert(-42), -42)
})

it("identity.ticks(count) generates ticks of varying degree", () => {
  const s = scaleIdentity()
  assert.deepStrictEqual(s.ticks(1).map(s.tickFormat(1)), ["0", "1"])
  assert.deepStrictEqual(s.ticks(2).map(s.tickFormat(2)), ["0.0", "0.5", "1.0"])
  assert.deepStrictEqual(s.ticks(5).map(s.tickFormat(5)), ["0.0", "0.2", "0.4", "0.6", "0.8", "1.0"])
  assert.deepStrictEqual(s.ticks(10).map(s.tickFormat(10)), [
    "0.0",
    "0.1",
    "0.2",
    "0.3",
    "0.4",
    "0.5",
    "0.6",
    "0.7",
    "0.8",
    "0.9",
    "1.0",
  ])
  s.domain([1, 0])
  assert.deepStrictEqual(s.ticks(1).map(s.tickFormat(1)), ["0", "1"].reverse())
  assert.deepStrictEqual(s.ticks(2).map(s.tickFormat(2)), ["0.0", "0.5", "1.0"].reverse())
  assert.deepStrictEqual(s.ticks(5).map(s.tickFormat(5)), ["0.0", "0.2", "0.4", "0.6", "0.8", "1.0"].reverse())
  assert.deepStrictEqual(
    s.ticks(10).map(s.tickFormat(10)),
    ["0.0", "0.1", "0.2", "0.3", "0.4", "0.5", "0.6", "0.7", "0.8", "0.9", "1.0"].reverse()
  )
})

it("identity.tickFormat(count) formats ticks with the appropriate precision", () => {
  const s = scaleIdentity().domain([0.123456789, 1.23456789])
  assert.strictEqual(s.tickFormat(1)(s.ticks(1)[0]), "1")
  assert.strictEqual(s.tickFormat(2)(s.ticks(2)[0]), "0.5")
  assert.strictEqual(s.tickFormat(4)(s.ticks(4)[0]), "0.2")
  assert.strictEqual(s.tickFormat(8)(s.ticks(8)[0]), "0.2")
  assert.strictEqual(s.tickFormat(16)(s.ticks(16)[0]), "0.15")
  assert.strictEqual(s.tickFormat(32)(s.ticks(32)[0]), "0.15")
  assert.strictEqual(s.tickFormat(64)(s.ticks(64)[0]), "0.14")
  assert.strictEqual(s.tickFormat(128)(s.ticks(128)[0]), "0.13")
  assert.strictEqual(s.tickFormat(256)(s.ticks(256)[0]), "0.125")
})

it("identity.copy() isolates changes to the domain or range", () => {
  const s1 = scaleIdentity()
  const s2 = s1.copy()
  const s3 = s1.copy()
  s1.domain([1, 2])
  assert.deepStrictEqual(s2.domain(), [0, 1])
  s2.domain([2, 3])
  assert.deepStrictEqual(s1.domain(), [1, 2])
  assert.deepStrictEqual(s2.domain(), [2, 3])
  const s4 = s3.copy()
  s3.range([1, 2])
  assert.deepStrictEqual(s4.range(), [0, 1])
  s4.range([2, 3])
  assert.deepStrictEqual(s3.range(), [1, 2])
  assert.deepStrictEqual(s4.range(), [2, 3])
})
import assert from "assert"
import { scaleLinear } from "../src/index.js"
import { roundEpsilon } from "./roundEpsilon.js"

it("scaleLinear() has the expected defaults", () => {
  const s = scaleLinear()
  assert.deepStrictEqual(s.domain(), [0, 1])
  assert.deepStrictEqual(s.range(), [0, 1])
  assert.strictEqual(s.clamp(), false)
  assert.strictEqual(s.unknown(), undefined)
  assert.deepStrictEqual(s.interpolate()({ array: ["red"] }, { array: ["blue"] })(0.5), { array: ["rgb(128, 0, 128)"] })
})

it("scaleLinear(range) sets the range", () => {
  const s = scaleLinear([1, 2])
  assert.deepStrictEqual(s.domain(), [0, 1])
  assert.deepStrictEqual(s.range(), [1, 2])
  assert.strictEqual(s(0.5), 1.5)
})

it("scaleLinear(domain, range) sets the domain and range", () => {
  const s = scaleLinear([1, 2], [3, 4])
  assert.deepStrictEqual(s.domain(), [1, 2])
  assert.deepStrictEqual(s.range(), [3, 4])
  assert.strictEqual(s(1.5), 3.5)
})

it("linear(x) maps a domain value x to a range value y", () => {
  assert.strictEqual(scaleLinear().range([1, 2])(0.5), 1.5)
})

it("linear(x) ignores extra range values if the domain is smaller than the range", () => {
  assert.strictEqual(scaleLinear().domain([-10, 0]).range([0, 1, 2]).clamp(true)(-5), 0.5)
  assert.strictEqual(scaleLinear().domain([-10, 0]).range([0, 1, 2]).clamp(true)(50), 1)
})

it("linear(x) ignores extra domain values if the range is smaller than the domain", () => {
  assert.strictEqual(scaleLinear().domain([-10, 0, 100]).range([0, 1]).clamp(true)(-5), 0.5)
  assert.strictEqual(scaleLinear().domain([-10, 0, 100]).range([0, 1]).clamp(true)(50), 1)
})

it("linear(x) maps an empty domain to the middle of the range", () => {
  assert.strictEqual(scaleLinear().domain([0, 0]).range([1, 2])(0), 1.5)
  assert.strictEqual(scaleLinear().domain([0, 0]).range([2, 1])(1), 1.5)
})

it("linear(x) can map a bilinear domain with two values to the corresponding range", () => {
  const s = scaleLinear().domain([1, 2])
  assert.deepStrictEqual(s.domain(), [1, 2])
  assert.strictEqual(s(0.5), -0.5)
  assert.strictEqual(s(1.0), 0.0)
  assert.strictEqual(s(1.5), 0.5)
  assert.strictEqual(s(2.0), 1.0)
  assert.strictEqual(s(2.5), 1.5)
  assert.strictEqual(s.invert(-0.5), 0.5)
  assert.strictEqual(s.invert(0.0), 1.0)
  assert.strictEqual(s.invert(0.5), 1.5)
  assert.strictEqual(s.invert(1.0), 2.0)
  assert.strictEqual(s.invert(1.5), 2.5)
})

it("linear(x) can map a polylinear domain with more than two values to the corresponding range", () => {
  const s = scaleLinear().domain([-10, 0, 100]).range(["red", "white", "green"])
  assert.deepStrictEqual(s.domain(), [-10, 0, 100])
  assert.strictEqual(s(-5), "rgb(255, 128, 128)")
  assert.strictEqual(s(50), "rgb(128, 192, 128)")
  assert.strictEqual(s(75), "rgb(64, 160, 64)")
  s.domain([4, 2, 1]).range([1, 2, 4])
  assert.strictEqual(s(1.5), 3)
  assert.strictEqual(s(3), 1.5)
  assert.strictEqual(s.invert(1.5), 3)
  assert.strictEqual(s.invert(3), 1.5)
  s.domain([1, 2, 4]).range([4, 2, 1])
  assert.strictEqual(s(1.5), 3)
  assert.strictEqual(s(3), 1.5)
  assert.strictEqual(s.invert(1.5), 3)
  assert.strictEqual(s.invert(3), 1.5)
})

it("linear.invert(y) maps a range value y to a domain value x", () => {
  assert.strictEqual(scaleLinear().range([1, 2]).invert(1.5), 0.5)
})

it("linear.invert(y) maps an empty range to the middle of the domain", () => {
  assert.strictEqual(scaleLinear().domain([1, 2]).range([0, 0]).invert(0), 1.5)
  assert.strictEqual(scaleLinear().domain([2, 1]).range([0, 0]).invert(1), 1.5)
})

it("linear.invert(y) coerces range values to numbers", () => {
  assert.strictEqual(scaleLinear().range(["0", "2"]).invert("1"), 0.5)
  assert.strictEqual(
    scaleLinear()
      .range([new Date(1990, 0, 1), new Date(1991, 0, 1)])
      .invert(new Date(1990, 6, 2, 13)),
    0.5
  )
})

it("linear.invert(y) returns NaN if the range is not coercible to number", () => {
  assert(isNaN(scaleLinear().range(["#000", "#fff"]).invert("#999")))
  assert(isNaN(scaleLinear().range([0, "#fff"]).invert("#999")))
})

it("linear.domain(domain) accepts an array of numbers", () => {
  assert.deepStrictEqual(scaleLinear().domain([]).domain(), [])
  assert.deepStrictEqual(scaleLinear().domain([1, 0]).domain(), [1, 0])
  assert.deepStrictEqual(scaleLinear().domain([1, 2, 3]).domain(), [1, 2, 3])
})

it("linear.domain(domain) coerces domain values to numbers", () => {
  assert.deepStrictEqual(
    scaleLinear()
      .domain([new Date(1990, 0, 1), new Date(1991, 0, 1)])
      .domain(),
    [631180800000, 662716800000]
  )
  assert.deepStrictEqual(scaleLinear().domain(["0.0", "1.0"]).domain(), [0, 1])
  assert.deepStrictEqual(
    scaleLinear()
      .domain([new Number(0), new Number(1)])
      .domain(),
    [0, 1]
  )
})

it("linear.domain(domain) accepts an iterable", () => {
  assert.deepStrictEqual(
    scaleLinear()
      .domain(new Set([1, 2]))
      .domain(),
    [1, 2]
  )
})

it("linear.domain(domain) makes a copy of domain values", () => {
  const d = [1, 2],
    s = scaleLinear().domain(d)
  assert.deepStrictEqual(s.domain(), [1, 2])
  d.push(3)
  assert.deepStrictEqual(s.domain(), [1, 2])
  assert.deepStrictEqual(d, [1, 2, 3])
})

it("linear.domain() returns a copy of domain values", () => {
  const s = scaleLinear(),
    d = s.domain()
  assert.deepStrictEqual(d, [0, 1])
  d.push(3)
  assert.deepStrictEqual(s.domain(), [0, 1])
})

it("linear.range(range) does not coerce range to numbers", () => {
  const s = scaleLinear().range(["0px", "2px"])
  assert.deepStrictEqual(s.range(), ["0px", "2px"])
  assert.strictEqual(s(0.5), "1px")
})

it("linear.range(range) accepts an iterable", () => {
  assert.deepStrictEqual(
    scaleLinear()
      .range(new Set([1, 2]))
      .range(),
    [1, 2]
  )
})

it("linear.range(range) can accept range values as colors", () => {
  assert.strictEqual(scaleLinear().range(["red", "blue"])(0.5), "rgb(128, 0, 128)")
  assert.strictEqual(scaleLinear().range(["#ff0000", "#0000ff"])(0.5), "rgb(128, 0, 128)")
  assert.strictEqual(scaleLinear().range(["#f00", "#00f"])(0.5), "rgb(128, 0, 128)")
  assert.strictEqual(scaleLinear().range(["rgb(255,0,0)", "hsl(240,100%,50%)"])(0.5), "rgb(128, 0, 128)")
  assert.strictEqual(scaleLinear().range(["rgb(100%,0%,0%)", "hsl(240,100%,50%)"])(0.5), "rgb(128, 0, 128)")
  assert.strictEqual(scaleLinear().range(["hsl(0,100%,50%)", "hsl(240,100%,50%)"])(0.5), "rgb(128, 0, 128)")
})

it("linear.range(range) can accept range values as arrays or objects", () => {
  assert.deepStrictEqual(scaleLinear().range([{ color: "red" }, { color: "blue" }])(0.5), { color: "rgb(128, 0, 128)" })
  assert.deepStrictEqual(scaleLinear().range([["red"], ["blue"]])(0.5), ["rgb(128, 0, 128)"])
})

it("linear.range(range) makes a copy of range values", () => {
  const r = [1, 2],
    s = scaleLinear().range(r)
  assert.deepStrictEqual(s.range(), [1, 2])
  r.push(3)
  assert.deepStrictEqual(s.range(), [1, 2])
  assert.deepStrictEqual(r, [1, 2, 3])
})

it("linear.range() returns a copy of range values", () => {
  const s = scaleLinear(),
    r = s.range()
  assert.deepStrictEqual(r, [0, 1])
  r.push(3)
  assert.deepStrictEqual(s.range(), [0, 1])
})

it("linear.rangeRound(range) is an alias for linear.range(range).interpolate(interpolateRound)", () => {
  assert.strictEqual(scaleLinear().rangeRound([0, 10])(0.59), 6)
})

it("linear.rangeRound(range) accepts an iterable", () => {
  assert.deepStrictEqual(
    scaleLinear()
      .rangeRound(new Set([1, 2]))
      .range(),
    [1, 2]
  )
})

it("linear.unknown(value) sets the return value for undefined, null, and NaN input", () => {
  const s = scaleLinear().unknown(-1)
  assert.strictEqual(s(null), -1)
  assert.strictEqual(s(undefined), -1)
  assert.strictEqual(s(NaN), -1)
  assert.strictEqual(s("N/A"), -1)
  assert.strictEqual(s(0.4), 0.4)
})

it("linear.clamp() is false by default", () => {
  assert.strictEqual(scaleLinear().clamp(), false)
  assert.strictEqual(scaleLinear().range([10, 20])(2), 30)
  assert.strictEqual(scaleLinear().range([10, 20])(-1), 0)
  assert.strictEqual(scaleLinear().range([10, 20]).invert(30), 2)
  assert.strictEqual(scaleLinear().range([10, 20]).invert(0), -1)
})

it("linear.clamp(true) restricts output values to the range", () => {
  assert.strictEqual(scaleLinear().clamp(true).range([10, 20])(2), 20)
  assert.strictEqual(scaleLinear().clamp(true).range([10, 20])(-1), 10)
})

it("linear.clamp(true) restricts input values to the domain", () => {
  assert.strictEqual(scaleLinear().clamp(true).range([10, 20]).invert(30), 1)
  assert.strictEqual(scaleLinear().clamp(true).range([10, 20]).invert(0), 0)
})

it("linear.clamp(clamp) coerces the specified clamp value to a boolean", () => {
  assert.strictEqual(scaleLinear().clamp("true").clamp(), true)
  assert.strictEqual(scaleLinear().clamp(1).clamp(), true)
  assert.strictEqual(scaleLinear().clamp("").clamp(), false)
  assert.strictEqual(scaleLinear().clamp(0).clamp(), false)
})

it("linear.interpolate(interpolate) takes a custom interpolator factory", () => {
  function interpolate(a, b) {
    return function (t) {
      return [a, b, t]
    }
  }
  const s = scaleLinear().domain([10, 20]).range(["a", "b"]).interpolate(interpolate)
  assert.strictEqual(s.interpolate(), interpolate)
  assert.deepStrictEqual(s(15), ["a", "b", 0.5])
})

it("linear.nice() is an alias for linear.nice(10)", () => {
  assert.deepStrictEqual(scaleLinear().domain([0, 0.96]).nice().domain(), [0, 1])
  assert.deepStrictEqual(scaleLinear().domain([0, 96]).nice().domain(), [0, 100])
})

it("linear.nice(count) extends the domain to match the desired ticks", () => {
  assert.deepStrictEqual(scaleLinear().domain([0, 0.96]).nice(10).domain(), [0, 1])
  assert.deepStrictEqual(scaleLinear().domain([0, 96]).nice(10).domain(), [0, 100])
  assert.deepStrictEqual(scaleLinear().domain([0.96, 0]).nice(10).domain(), [1, 0])
  assert.deepStrictEqual(scaleLinear().domain([96, 0]).nice(10).domain(), [100, 0])
  assert.deepStrictEqual(scaleLinear().domain([0, -0.96]).nice(10).domain(), [0, -1])
  assert.deepStrictEqual(scaleLinear().domain([0, -96]).nice(10).domain(), [0, -100])
  assert.deepStrictEqual(scaleLinear().domain([-0.96, 0]).nice(10).domain(), [-1, 0])
  assert.deepStrictEqual(scaleLinear().domain([-96, 0]).nice(10).domain(), [-100, 0])
  assert.deepStrictEqual(scaleLinear().domain([-0.1, 51.1]).nice(8).domain(), [-10, 60])
})

it("linear.nice(count) nices the domain, extending it to round numbers", () => {
  assert.deepStrictEqual(scaleLinear().domain([1.1, 10.9]).nice(10).domain(), [1, 11])
  assert.deepStrictEqual(scaleLinear().domain([10.9, 1.1]).nice(10).domain(), [11, 1])
  assert.deepStrictEqual(scaleLinear().domain([0.7, 11.001]).nice(10).domain(), [0, 12])
  assert.deepStrictEqual(scaleLinear().domain([123.1, 6.7]).nice(10).domain(), [130, 0])
  assert.deepStrictEqual(scaleLinear().domain([0, 0.49]).nice(10).domain(), [0, 0.5])
  assert.deepStrictEqual(scaleLinear().domain([0, 14.1]).nice(5).domain(), [0, 20])
  assert.deepStrictEqual(scaleLinear().domain([0, 15]).nice(5).domain(), [0, 20])
})

it("linear.nice(count) has no effect on degenerate domains", () => {
  assert.deepStrictEqual(scaleLinear().domain([0, 0]).nice(10).domain(), [0, 0])
  assert.deepStrictEqual(scaleLinear().domain([0.5, 0.5]).nice(10).domain(), [0.5, 0.5])
})

it("linear.nice(count) nicing a polylinear domain only affects the extent", () => {
  assert.deepStrictEqual(scaleLinear().domain([1.1, 1, 2, 3, 10.9]).nice(10).domain(), [1, 1, 2, 3, 11])
  assert.deepStrictEqual(scaleLinear().domain([123.1, 1, 2, 3, -0.9]).nice(10).domain(), [130, 1, 2, 3, -10])
})

it("linear.nice(count) accepts a tick count to control nicing step", () => {
  assert.deepStrictEqual(scaleLinear().domain([12, 87]).nice(5).domain(), [0, 100])
  assert.deepStrictEqual(scaleLinear().domain([12, 87]).nice(10).domain(), [10, 90])
  assert.deepStrictEqual(scaleLinear().domain([12, 87]).nice(100).domain(), [12, 87])
})

it("linear.ticks(count) returns the expected ticks for an ascending domain", () => {
  const s = scaleLinear()
  assert.deepStrictEqual(s.ticks(10).map(roundEpsilon), [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0])
  assert.deepStrictEqual(s.ticks(9).map(roundEpsilon), [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0])
  assert.deepStrictEqual(s.ticks(8).map(roundEpsilon), [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0])
  assert.deepStrictEqual(s.ticks(7).map(roundEpsilon), [0.0, 0.2, 0.4, 0.6, 0.8, 1.0])
  assert.deepStrictEqual(s.ticks(6).map(roundEpsilon), [0.0, 0.2, 0.4, 0.6, 0.8, 1.0])
  assert.deepStrictEqual(s.ticks(5).map(roundEpsilon), [0.0, 0.2, 0.4, 0.6, 0.8, 1.0])
  assert.deepStrictEqual(s.ticks(4).map(roundEpsilon), [0.0, 0.2, 0.4, 0.6, 0.8, 1.0])
  assert.deepStrictEqual(s.ticks(3).map(roundEpsilon), [0.0, 0.5, 1.0])
  assert.deepStrictEqual(s.ticks(2).map(roundEpsilon), [0.0, 0.5, 1.0])
  assert.deepStrictEqual(s.ticks(1).map(roundEpsilon), [0.0, 1.0])
  s.domain([-100, 100])
  assert.deepStrictEqual(s.ticks(10), [-100, -80, -60, -40, -20, 0, 20, 40, 60, 80, 100])
  assert.deepStrictEqual(s.ticks(9), [-100, -80, -60, -40, -20, 0, 20, 40, 60, 80, 100])
  assert.deepStrictEqual(s.ticks(8), [-100, -80, -60, -40, -20, 0, 20, 40, 60, 80, 100])
  assert.deepStrictEqual(s.ticks(7), [-100, -80, -60, -40, -20, 0, 20, 40, 60, 80, 100])
  assert.deepStrictEqual(s.ticks(6), [-100, -50, 0, 50, 100])
  assert.deepStrictEqual(s.ticks(5), [-100, -50, 0, 50, 100])
  assert.deepStrictEqual(s.ticks(4), [-100, -50, 0, 50, 100])
  assert.deepStrictEqual(s.ticks(3), [-100, -50, 0, 50, 100])
  assert.deepStrictEqual(s.ticks(2), [-100, 0, 100])
  assert.deepStrictEqual(s.ticks(1), [0])
})

it("linear.ticks(count) returns the expected ticks for a descending domain", () => {
  const s = scaleLinear().domain([1, 0])
  assert.deepStrictEqual(
    s.ticks(10).map(roundEpsilon),
    [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0].reverse()
  )
  assert.deepStrictEqual(
    s.ticks(9).map(roundEpsilon),
    [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0].reverse()
  )
  assert.deepStrictEqual(
    s.ticks(8).map(roundEpsilon),
    [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0].reverse()
  )
  assert.deepStrictEqual(s.ticks(7).map(roundEpsilon), [0.0, 0.2, 0.4, 0.6, 0.8, 1.0].reverse())
  assert.deepStrictEqual(s.ticks(6).map(roundEpsilon), [0.0, 0.2, 0.4, 0.6, 0.8, 1.0].reverse())
  assert.deepStrictEqual(s.ticks(5).map(roundEpsilon), [0.0, 0.2, 0.4, 0.6, 0.8, 1.0].reverse())
  assert.deepStrictEqual(s.ticks(4).map(roundEpsilon), [0.0, 0.2, 0.4, 0.6, 0.8, 1.0].reverse())
  assert.deepStrictEqual(s.ticks(3).map(roundEpsilon), [0.0, 0.5, 1.0].reverse())
  assert.deepStrictEqual(s.ticks(2).map(roundEpsilon), [0.0, 0.5, 1.0].reverse())
  assert.deepStrictEqual(s.ticks(1).map(roundEpsilon), [0.0, 1.0].reverse())
  s.domain([100, -100])
  assert.deepStrictEqual(s.ticks(10), [-100, -80, -60, -40, -20, 0, 20, 40, 60, 80, 100].reverse())
  assert.deepStrictEqual(s.ticks(9), [-100, -80, -60, -40, -20, 0, 20, 40, 60, 80, 100].reverse())
  assert.deepStrictEqual(s.ticks(8), [-100, -80, -60, -40, -20, 0, 20, 40, 60, 80, 100].reverse())
  assert.deepStrictEqual(s.ticks(7), [-100, -80, -60, -40, -20, 0, 20, 40, 60, 80, 100].reverse())
  assert.deepStrictEqual(s.ticks(6), [-100, -50, 0, 50, 100].reverse())
  assert.deepStrictEqual(s.ticks(5), [-100, -50, 0, 50, 100].reverse())
  assert.deepStrictEqual(s.ticks(4), [-100, -50, 0, 50, 100].reverse())
  assert.deepStrictEqual(s.ticks(3), [-100, -50, 0, 50, 100].reverse())
  assert.deepStrictEqual(s.ticks(2), [-100, 0, 100].reverse())
  assert.deepStrictEqual(s.ticks(1), [0].reverse())
})

it("linear.ticks(count) returns the expected ticks for a polylinear domain", () => {
  const s = scaleLinear().domain([0, 0.25, 0.9, 1])
  assert.deepStrictEqual(s.ticks(10).map(roundEpsilon), [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0])
  assert.deepStrictEqual(s.ticks(9).map(roundEpsilon), [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0])
  assert.deepStrictEqual(s.ticks(8).map(roundEpsilon), [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0])
  assert.deepStrictEqual(s.ticks(7).map(roundEpsilon), [0.0, 0.2, 0.4, 0.6, 0.8, 1.0])
  assert.deepStrictEqual(s.ticks(6).map(roundEpsilon), [0.0, 0.2, 0.4, 0.6, 0.8, 1.0])
  assert.deepStrictEqual(s.ticks(5).map(roundEpsilon), [0.0, 0.2, 0.4, 0.6, 0.8, 1.0])
  assert.deepStrictEqual(s.ticks(4).map(roundEpsilon), [0.0, 0.2, 0.4, 0.6, 0.8, 1.0])
  assert.deepStrictEqual(s.ticks(3).map(roundEpsilon), [0.0, 0.5, 1.0])
  assert.deepStrictEqual(s.ticks(2).map(roundEpsilon), [0.0, 0.5, 1.0])
  assert.deepStrictEqual(s.ticks(1).map(roundEpsilon), [0.0, 1.0])
  s.domain([-100, 0, 100])
  assert.deepStrictEqual(s.ticks(10), [-100, -80, -60, -40, -20, 0, 20, 40, 60, 80, 100])
  assert.deepStrictEqual(s.ticks(9), [-100, -80, -60, -40, -20, 0, 20, 40, 60, 80, 100])
  assert.deepStrictEqual(s.ticks(8), [-100, -80, -60, -40, -20, 0, 20, 40, 60, 80, 100])
  assert.deepStrictEqual(s.ticks(7), [-100, -80, -60, -40, -20, 0, 20, 40, 60, 80, 100])
  assert.deepStrictEqual(s.ticks(6), [-100, -50, 0, 50, 100])
  assert.deepStrictEqual(s.ticks(5), [-100, -50, 0, 50, 100])
  assert.deepStrictEqual(s.ticks(4), [-100, -50, 0, 50, 100])
  assert.deepStrictEqual(s.ticks(3), [-100, -50, 0, 50, 100])
  assert.deepStrictEqual(s.ticks(2), [-100, 0, 100])
  assert.deepStrictEqual(s.ticks(1), [0])
})

it("linear.ticks(X) spans linear.nice(X).domain()", () => {
  function check(domain, count) {
    const s = scaleLinear().domain(domain).nice(count)
    const ticks = s.ticks(count)
    assert.deepStrictEqual([ticks[0], ticks[ticks.length - 1]], s.domain())
  }
  check([1, 9], 2)
  check([1, 9], 3)
  check([1, 9], 4)
  check([8, 9], 2)
  check([8, 9], 3)
  check([8, 9], 4)
  check([1, 21], 2)
  check([2, 21], 2)
  check([3, 21], 2)
  check([4, 21], 2)
  check([5, 21], 2)
  check([6, 21], 2)
  check([7, 21], 2)
  check([8, 21], 2)
  check([9, 21], 2)
  check([10, 21], 2)
  check([11, 21], 2)
})

it("linear.ticks(count) returns the empty array if count is not a positive integer", () => {
  const s = scaleLinear()
  assert.deepStrictEqual(s.ticks(NaN), [])
  assert.deepStrictEqual(s.ticks(0), [])
  assert.deepStrictEqual(s.ticks(-1), [])
  assert.deepStrictEqual(s.ticks(Infinity), [])
})

it("linear.ticks() is an alias for linear.ticks(10)", () => {
  const s = scaleLinear()
  assert.deepStrictEqual(s.ticks(), s.ticks(10))
})

it("linear.tickFormat() is an alias for linear.tickFormat(10)", () => {
  assert.strictEqual(scaleLinear().tickFormat()(0.2), "0.2")
  assert.strictEqual(scaleLinear().domain([-100, 100]).tickFormat()(-20), "−20")
})

it("linear.tickFormat(count) returns a format suitable for the ticks", () => {
  assert.strictEqual(scaleLinear().tickFormat(10)(0.2), "0.2")
  assert.strictEqual(scaleLinear().tickFormat(20)(0.2), "0.20")
  assert.strictEqual(scaleLinear().domain([-100, 100]).tickFormat(10)(-20), "−20")
})

it("linear.tickFormat(count, specifier) sets the appropriate fixed precision if not specified", () => {
  assert.strictEqual(scaleLinear().tickFormat(10, "+f")(0.2), "+0.2")
  assert.strictEqual(scaleLinear().tickFormat(20, "+f")(0.2), "+0.20")
  assert.strictEqual(scaleLinear().tickFormat(10, "+%")(0.2), "+20%")
  assert.strictEqual(scaleLinear().domain([0.19, 0.21]).tickFormat(10, "+%")(0.2), "+20.0%")
})

it("linear.tickFormat(count, specifier) sets the appropriate round precision if not specified", () => {
  assert.strictEqual(scaleLinear().domain([0, 9]).tickFormat(10, "")(2.1), "2")
  assert.strictEqual(scaleLinear().domain([0, 9]).tickFormat(100, "")(2.01), "2")
  assert.strictEqual(scaleLinear().domain([0, 9]).tickFormat(100, "")(2.11), "2.1")
  assert.strictEqual(scaleLinear().domain([0, 9]).tickFormat(10, "e")(2.1), "2e+0")
  assert.strictEqual(scaleLinear().domain([0, 9]).tickFormat(100, "e")(2.01), "2.0e+0")
  assert.strictEqual(scaleLinear().domain([0, 9]).tickFormat(100, "e")(2.11), "2.1e+0")
  assert.strictEqual(scaleLinear().domain([0, 9]).tickFormat(10, "g")(2.1), "2")
  assert.strictEqual(scaleLinear().domain([0, 9]).tickFormat(100, "g")(2.01), "2.0")
  assert.strictEqual(scaleLinear().domain([0, 9]).tickFormat(100, "g")(2.11), "2.1")
  assert.strictEqual(scaleLinear().domain([0, 9]).tickFormat(10, "r")(2.1e6), "2000000")
  assert.strictEqual(scaleLinear().domain([0, 9]).tickFormat(100, "r")(2.01e6), "2000000")
  assert.strictEqual(scaleLinear().domain([0, 9]).tickFormat(100, "r")(2.11e6), "2100000")
  assert.strictEqual(scaleLinear().domain([0, 0.9]).tickFormat(10, "p")(0.21), "20%")
  assert.strictEqual(scaleLinear().domain([0.19, 0.21]).tickFormat(10, "p")(0.201), "20.1%")
})

it("linear.tickFormat(count, specifier) sets the appropriate prefix precision if not specified", () => {
  assert.strictEqual(scaleLinear().domain([0, 1e6]).tickFormat(10, "$s")(0.51e6), "$0.5M")
  assert.strictEqual(scaleLinear().domain([0, 1e6]).tickFormat(100, "$s")(0.501e6), "$0.50M")
})

it("linear.tickFormat() uses the default precision when the domain is invalid", () => {
  const f = scaleLinear().domain([0, NaN]).tickFormat()
  assert.strictEqual(f + "", " >-,f")
  assert.strictEqual(f(0.12), "0.120000")
})

it("linear.copy() returns a copy with changes to the domain are isolated", () => {
  const x = scaleLinear(),
    y = x.copy()
  x.domain([1, 2])
  assert.deepStrictEqual(y.domain(), [0, 1])
  assert.strictEqual(x(1), 0)
  assert.strictEqual(y(1), 1)
  y.domain([2, 3])
  assert.strictEqual(x(2), 1)
  assert.strictEqual(y(2), 0)
  assert.deepStrictEqual(x.domain(), [1, 2])
  assert.deepStrictEqual(y.domain(), [2, 3])
  const y2 = x.domain([1, 1.9]).copy()
  x.nice(5)
  assert.deepStrictEqual(x.domain(), [1, 2])
  assert.deepStrictEqual(y2.domain(), [1, 1.9])
})

it("linear.copy() returns a copy with changes to the range are isolated", () => {
  const x = scaleLinear(),
    y = x.copy()
  x.range([1, 2])
  assert.strictEqual(x.invert(1), 0)
  assert.strictEqual(y.invert(1), 1)
  assert.deepStrictEqual(y.range(), [0, 1])
  y.range([2, 3])
  assert.strictEqual(x.invert(2), 1)
  assert.strictEqual(y.invert(2), 0)
  assert.deepStrictEqual(x.range(), [1, 2])
  assert.deepStrictEqual(y.range(), [2, 3])
})

it("linear.copy() returns a copy with changes to the interpolator are isolated", () => {
  const x = scaleLinear().range(["red", "blue"])
  const y = x.copy()
  const i0 = x.interpolate()
  const i1 = function (a, b) {
    return function () {
      return b
    }
  }
  x.interpolate(i1)
  assert.strictEqual(y.interpolate(), i0)
  assert.strictEqual(x(0.5), "blue")
  assert.strictEqual(y(0.5), "rgb(128, 0, 128)")
})

it("linear.copy() returns a copy with changes to clamping are isolated", () => {
  const x = scaleLinear().clamp(true),
    y = x.copy()
  x.clamp(false)
  assert.strictEqual(x(2), 2)
  assert.strictEqual(y(2), 1)
  assert.strictEqual(y.clamp(), true)
  y.clamp(false)
  assert.strictEqual(x(2), 2)
  assert.strictEqual(y(2), 2)
  assert.strictEqual(x.clamp(), false)
})

it("linear.copy() returns a copy with changes to the unknown value are isolated", () => {
  const x = scaleLinear(),
    y = x.copy()
  x.unknown(2)
  assert.strictEqual(x(NaN), 2)
  assert.strictEqual(isNaN(y(NaN)), true)
  assert.strictEqual(y.unknown(), undefined)
  y.unknown(3)
  assert.strictEqual(x(NaN), 2)
  assert.strictEqual(y(NaN), 3)
  assert.strictEqual(x.unknown(), 2)
})
import assert from "assert"
import { hsl, rgb } from "d3-color"
import { interpolate, interpolateHsl } from "d3-interpolate"
import { format } from "d3-format"
import { scaleLog } from "../src/index.js"
import { assertInDelta } from "./asserts.js"

it("scaleLog() has the expected defaults", () => {
  const x = scaleLog()
  assert.deepStrictEqual(x.domain(), [1, 10])
  assert.deepStrictEqual(x.range(), [0, 1])
  assert.strictEqual(x.clamp(), false)
  assert.strictEqual(x.base(), 10)
  assert.strictEqual(x.interpolate(), interpolate)
  assert.deepStrictEqual(x.interpolate()({ array: ["red"] }, { array: ["blue"] })(0.5), { array: ["rgb(128, 0, 128)"] })
  assertInDelta(x(5), 0.69897)
  assertInDelta(x.invert(0.69897), 5)
  assertInDelta(x(3.162278), 0.5)
  assertInDelta(x.invert(0.5), 3.162278)
})

it("log.domain(…) coerces values to numbers", () => {
  const x = scaleLog().domain([new Date(1990, 0, 1), new Date(1991, 0, 1)])
  assert.strictEqual(typeof x.domain()[0], "number")
  assert.strictEqual(typeof x.domain()[1], "number")
  assertInDelta(x(new Date(1989, 9, 20)), -0.2061048)
  assertInDelta(x(new Date(1990, 0, 1)), 0.0)
  assertInDelta(x(new Date(1990, 2, 15)), 0.2039385)
  assertInDelta(x(new Date(1990, 4, 27)), 0.4057544)
  assertInDelta(x(new Date(1991, 0, 1)), 1.0)
  assertInDelta(x(new Date(1991, 2, 15)), 1.1942797)
  x.domain(["1", "10"])
  assert.strictEqual(typeof x.domain()[0], "number")
  assert.strictEqual(typeof x.domain()[1], "number")
  assertInDelta(x(5), 0.69897)
  x.domain([new Number(1), new Number(10)])
  assert.strictEqual(typeof x.domain()[0], "number")
  assert.strictEqual(typeof x.domain()[1], "number")
  assertInDelta(x(5), 0.69897)
})

it("log.domain(…) can take negative values", () => {
  const x = scaleLog().domain([-100, -1])
  assert.deepStrictEqual(x.ticks().map(x.tickFormat(Infinity)), [
    "−100",
    "−90",
    "−80",
    "−70",
    "−60",
    "−50",
    "−40",
    "−30",
    "−20",
    "−10",
    "−9",
    "−8",
    "−7",
    "−6",
    "−5",
    "−4",
    "−3",
    "−2",
    "−1",
  ])
  assertInDelta(x(-50), 0.150515)
})

it("log.domain(…).range(…) can take more than two values", () => {
  const x = scaleLog().domain([0.1, 1, 100]).range(["red", "white", "green"])
  assert.strictEqual(x(0.5), "rgb(255, 178, 178)")
  assert.strictEqual(x(50), "rgb(38, 147, 38)")
  assert.strictEqual(x(75), "rgb(16, 136, 16)")
})

it("log.domain(…) preserves specified domain exactly, with no floating point error", () => {
  const x = scaleLog().domain([0.1, 1000])
  assert.deepStrictEqual(x.domain(), [0.1, 1000])
})

it("log.ticks(…) returns exact ticks, with no floating point error", () => {
  assert.deepStrictEqual(scaleLog().domain([0.15, 0.68]).ticks(), [0.2, 0.3, 0.4, 0.5, 0.6])
  assert.deepStrictEqual(scaleLog().domain([0.68, 0.15]).ticks(), [0.6, 0.5, 0.4, 0.3, 0.2])
  assert.deepStrictEqual(scaleLog().domain([-0.15, -0.68]).ticks(), [-0.2, -0.3, -0.4, -0.5, -0.6])
  assert.deepStrictEqual(scaleLog().domain([-0.68, -0.15]).ticks(), [-0.6, -0.5, -0.4, -0.3, -0.2])
})

it("log.range(…) does not coerce values to numbers", () => {
  const x = scaleLog().range(["0", "2"])
  assert.strictEqual(typeof x.range()[0], "string")
  assert.strictEqual(typeof x.range()[1], "string")
})

it("log.range(…) can take colors", () => {
  const x = scaleLog().range(["red", "blue"])
  assert.strictEqual(x(5), "rgb(77, 0, 178)")
  x.range(["#ff0000", "#0000ff"])
  assert.strictEqual(x(5), "rgb(77, 0, 178)")
  x.range(["#f00", "#00f"])
  assert.strictEqual(x(5), "rgb(77, 0, 178)")
  x.range([rgb(255, 0, 0), hsl(240, 1, 0.5)])
  assert.strictEqual(x(5), "rgb(77, 0, 178)")
  x.range(["hsl(0,100%,50%)", "hsl(240,100%,50%)"])
  assert.strictEqual(x(5), "rgb(77, 0, 178)")
})

it("log.range(…) can take arrays or objects", () => {
  const x = scaleLog().range([{ color: "red" }, { color: "blue" }])
  assert.deepStrictEqual(x(5), { color: "rgb(77, 0, 178)" })
  x.range([["red"], ["blue"]])
  assert.deepStrictEqual(x(5), ["rgb(77, 0, 178)"])
})

it("log.interpolate(f) sets the interpolator", () => {
  const x = scaleLog().range(["red", "blue"])
  assert.strictEqual(x.interpolate(), interpolate)
  assert.strictEqual(x(5), "rgb(77, 0, 178)")
  x.interpolate(interpolateHsl)
  assert.strictEqual(x(5), "rgb(154, 0, 255)")
})

it("log(x) does not clamp by default", () => {
  const x = scaleLog()
  assert.strictEqual(x.clamp(), false)
  assertInDelta(x(0.5), -0.3010299)
  assertInDelta(x(15), 1.1760913)
})

it("log.clamp(true)(x) clamps to the domain", () => {
  const x = scaleLog().clamp(true)
  assertInDelta(x(-1), 0)
  assertInDelta(x(5), 0.69897)
  assertInDelta(x(15), 1)
  x.domain([10, 1])
  assertInDelta(x(-1), 1)
  assertInDelta(x(5), 0.30103)
  assertInDelta(x(15), 0)
})

it("log.clamp(true).invert(y) clamps to the range", () => {
  const x = scaleLog().clamp(true)
  assertInDelta(x.invert(-0.1), 1)
  assertInDelta(x.invert(0.69897), 5)
  assertInDelta(x.invert(1.5), 10)
  x.domain([10, 1])
  assertInDelta(x.invert(-0.1), 10)
  assertInDelta(x.invert(0.30103), 5)
  assertInDelta(x.invert(1.5), 1)
})

it("log(x) maps a number x to a number y", () => {
  const x = scaleLog().domain([1, 2])
  assertInDelta(x(0.5), -1.0)
  assertInDelta(x(1.0), 0.0)
  assertInDelta(x(1.5), 0.5849625)
  assertInDelta(x(2.0), 1.0)
  assertInDelta(x(2.5), 1.3219281)
})

it("log.invert(y) maps a number y to a number x", () => {
  const x = scaleLog().domain([1, 2])
  assertInDelta(x.invert(-1.0), 0.5)
  assertInDelta(x.invert(0.0), 1.0)
  assertInDelta(x.invert(0.5849625), 1.5)
  assertInDelta(x.invert(1.0), 2.0)
  assertInDelta(x.invert(1.3219281), 2.5)
})

it("log.invert(y) coerces y to number", () => {
  const x = scaleLog().range(["0", "2"])
  assertInDelta(x.invert("1"), 3.1622777)
  x.range([new Date(1990, 0, 1), new Date(1991, 0, 1)])
  assertInDelta(x.invert(new Date(1990, 6, 2, 13)), 3.1622777)
  x.range(["#000", "#fff"])
  assert(Number.isNaN(x.invert("#999")))
})

it("log.base(b) sets the log base, changing the ticks", () => {
  const x = scaleLog().domain([1, 32])
  assert.deepStrictEqual(x.base(2).ticks().map(x.tickFormat()), ["1", "2", "4", "8", "16", "32"])
  assert.deepStrictEqual(x.base(Math.E).ticks().map(x.tickFormat()), [
    "1",
    "2.71828182846",
    "7.38905609893",
    "20.0855369232",
  ])
})

it("log.nice() nices the domain, extending it to powers of ten", () => {
  const x = scaleLog().domain([1.1, 10.9]).nice()
  assert.deepStrictEqual(x.domain(), [1, 100])
  x.domain([10.9, 1.1]).nice()
  assert.deepStrictEqual(x.domain(), [100, 1])
  x.domain([0.7, 11.001]).nice()
  assert.deepStrictEqual(x.domain(), [0.1, 100])
  x.domain([123.1, 6.7]).nice()
  assert.deepStrictEqual(x.domain(), [1000, 1])
  x.domain([0.01, 0.49]).nice()
  assert.deepStrictEqual(x.domain(), [0.01, 1])
  x.domain([1.5, 50]).nice()
  assert.deepStrictEqual(x.domain(), [1, 100])
  assertInDelta(x(1), 0)
  assertInDelta(x(100), 1)
})

it("log.nice() works on degenerate domains", () => {
  const x = scaleLog().domain([0, 0]).nice()
  assert.deepStrictEqual(x.domain(), [0, 0])
  x.domain([0.5, 0.5]).nice()
  assert.deepStrictEqual(x.domain(), [0.1, 1])
})

it("log.nice() on a polylog domain only affects the extent", () => {
  const x = scaleLog().domain([1.1, 1.5, 10.9]).nice()
  assert.deepStrictEqual(x.domain(), [1, 1.5, 100])
  x.domain([-123.1, -1.5, -0.5]).nice()
  assert.deepStrictEqual(x.domain(), [-1000, -1.5, -0.1])
})

it("log.copy() isolates changes to the domain", () => {
  const x = scaleLog(),
    y = x.copy()
  x.domain([10, 100])
  assert.deepStrictEqual(y.domain(), [1, 10])
  assertInDelta(x(10), 0)
  assertInDelta(y(1), 0)
  y.domain([100, 1000])
  assertInDelta(x(100), 1)
  assertInDelta(y(100), 0)
  assert.deepStrictEqual(x.domain(), [10, 100])
  assert.deepStrictEqual(y.domain(), [100, 1000])
})

it("log.copy() isolates changes to the domain via nice", () => {
  const x = scaleLog().domain([1.5, 50]),
    y = x.copy().nice()
  assert.deepStrictEqual(x.domain(), [1.5, 50])
  assertInDelta(x(1.5), 0)
  assertInDelta(x(50), 1)
  assertInDelta(x.invert(0), 1.5)
  assertInDelta(x.invert(1), 50)
  assert.deepStrictEqual(y.domain(), [1, 100])
  assertInDelta(y(1), 0)
  assertInDelta(y(100), 1)
  assertInDelta(y.invert(0), 1)
  assertInDelta(y.invert(1), 100)
})

it("log.copy() isolates changes to the range", () => {
  const x = scaleLog(),
    y = x.copy()
  x.range([1, 2])
  assertInDelta(x.invert(1), 1)
  assertInDelta(y.invert(1), 10)
  assert.deepStrictEqual(y.range(), [0, 1])
  y.range([2, 3])
  assertInDelta(x.invert(2), 10)
  assertInDelta(y.invert(2), 1)
  assert.deepStrictEqual(x.range(), [1, 2])
  assert.deepStrictEqual(y.range(), [2, 3])
})

it("log.copy() isolates changes to the interpolator", () => {
  const x = scaleLog().range(["red", "blue"]),
    y = x.copy()
  x.interpolate(interpolateHsl)
  assert.strictEqual(x(5), "rgb(154, 0, 255)")
  assert.strictEqual(y(5), "rgb(77, 0, 178)")
  assert.strictEqual(y.interpolate(), interpolate)
})

it("log.copy() isolates changes to clamping", () => {
  const x = scaleLog().clamp(true),
    y = x.copy()
  x.clamp(false)
  assertInDelta(x(0.5), -0.30103)
  assertInDelta(y(0.5), 0)
  assert.strictEqual(y.clamp(), true)
  y.clamp(false)
  assertInDelta(x(20), 1.30103)
  assertInDelta(y(20), 1.30103)
  assert.strictEqual(x.clamp(), false)
})

it("log.ticks() generates the expected power-of-ten for ascending ticks", () => {
  const s = scaleLog()
  assert.deepStrictEqual(
    s.domain([1e-1, 1e1]).ticks().map(round),
    [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  )
  assert.deepStrictEqual(s.domain([1e-1, 1]).ticks().map(round), [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1])
  assert.deepStrictEqual(
    s.domain([-1, -1e-1]).ticks().map(round),
    [-1, -0.9, -0.8, -0.7, -0.6, -0.5, -0.4, -0.3, -0.2, -0.1]
  )
})

it("log.ticks() generates the expected power-of-ten ticks for descending domains", () => {
  const s = scaleLog()
  assert.deepStrictEqual(
    s.domain([-1e-1, -1e1]).ticks().map(round),
    [-10, -9, -8, -7, -6, -5, -4, -3, -2, -1, -0.9, -0.8, -0.7, -0.6, -0.5, -0.4, -0.3, -0.2, -0.1].reverse()
  )
  assert.deepStrictEqual(
    s.domain([-1e-1, -1]).ticks().map(round),
    [-1, -0.9, -0.8, -0.7, -0.6, -0.5, -0.4, -0.3, -0.2, -0.1].reverse()
  )
  assert.deepStrictEqual(
    s.domain([1, 1e-1]).ticks().map(round),
    [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1].reverse()
  )
})

it("log.ticks() generates the expected power-of-ten ticks for small domains", () => {
  const s = scaleLog()
  assert.deepStrictEqual(s.domain([1, 5]).ticks(), [1, 2, 3, 4, 5])
  assert.deepStrictEqual(s.domain([5, 1]).ticks(), [5, 4, 3, 2, 1])
  assert.deepStrictEqual(s.domain([-1, -5]).ticks(), [-1, -2, -3, -4, -5])
  assert.deepStrictEqual(s.domain([-5, -1]).ticks(), [-5, -4, -3, -2, -1])
  assert.deepStrictEqual(s.domain([286.9252014, 329.4978332]).ticks(1), [300])
  assert.deepStrictEqual(s.domain([286.9252014, 329.4978332]).ticks(2), [300])
  assert.deepStrictEqual(s.domain([286.9252014, 329.4978332]).ticks(3), [300, 320])
  assert.deepStrictEqual(s.domain([286.9252014, 329.4978332]).ticks(4), [290, 300, 310, 320])
  assert.deepStrictEqual(s.domain([286.9252014, 329.4978332]).ticks(), [290, 295, 300, 305, 310, 315, 320, 325])
})

it("log.ticks() generates linear ticks when the domain extent is small", () => {
  const s = scaleLog()
  assert.deepStrictEqual(s.domain([41, 42]).ticks(), [41, 41.1, 41.2, 41.3, 41.4, 41.5, 41.6, 41.7, 41.8, 41.9, 42])
  assert.deepStrictEqual(s.domain([42, 41]).ticks(), [42, 41.9, 41.8, 41.7, 41.6, 41.5, 41.4, 41.3, 41.2, 41.1, 41])
  assert.deepStrictEqual(
    s.domain([1600, 1400]).ticks(),
    [1600, 1580, 1560, 1540, 1520, 1500, 1480, 1460, 1440, 1420, 1400]
  )
})

it("log.base(base).ticks() generates the expected power-of-base ticks", () => {
  const s = scaleLog().base(Math.E)
  assert.deepStrictEqual(
    s.domain([0.1, 100]).ticks().map(round),
    [0.135335283237, 0.367879441171, 1, 2.718281828459, 7.389056098931, 20.085536923188, 54.598150033144]
  )
})

it("log.tickFormat() is equivalent to log.tickFormat(10)", () => {
  const s = scaleLog()
  assert.deepStrictEqual(s.domain([1e-1, 1e1]).ticks().map(s.tickFormat()), [
    "100m",
    "200m",
    "300m",
    "400m",
    "500m",
    "",
    "",
    "",
    "",
    "1",
    "2",
    "3",
    "4",
    "5",
    "",
    "",
    "",
    "",
    "10",
  ])
})

it('log.tickFormat(count) returns a filtered "s" format', () => {
  const s = scaleLog(),
    t = s.domain([1e-1, 1e1]).ticks()
  assert.deepStrictEqual(t.map(s.tickFormat(10)), [
    "100m",
    "200m",
    "300m",
    "400m",
    "500m",
    "",
    "",
    "",
    "",
    "1",
    "2",
    "3",
    "4",
    "5",
    "",
    "",
    "",
    "",
    "10",
  ])
  assert.deepStrictEqual(t.map(s.tickFormat(5)), [
    "100m",
    "200m",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "1",
    "2",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "10",
  ])
  assert.deepStrictEqual(t.map(s.tickFormat(1)), [
    "100m",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "1",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "10",
  ])
  assert.deepStrictEqual(t.map(s.tickFormat(0)), [
    "100m",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "1",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "10",
  ])
})

it("log.tickFormat(count, format) returns the specified format, filtered", () => {
  const s = scaleLog(),
    t = s.domain([1e-1, 1e1]).ticks()
  assert.deepStrictEqual(t.map(s.tickFormat(10, "+")), [
    "+0.1",
    "+0.2",
    "+0.3",
    "+0.4",
    "+0.5",
    "",
    "",
    "",
    "",
    "+1",
    "+2",
    "+3",
    "+4",
    "+5",
    "",
    "",
    "",
    "",
    "+10",
  ])
})

it('log.base(base).tickFormat() returns the "," format', () => {
  const s = scaleLog().base(Math.E)
  assert.deepStrictEqual(s.domain([1e-1, 1e1]).ticks().map(s.tickFormat()), [
    "0.135335283237",
    "0.367879441171",
    "1",
    "2.71828182846",
    "7.38905609893",
  ])
})

it('log.base(base).tickFormat(count) returns a filtered "," format', () => {
  const s = scaleLog().base(16),
    t = s.domain([1e-1, 1e1]).ticks()
  assert.deepStrictEqual(t.map(s.tickFormat(10)), [
    "0.125",
    "0.1875",
    "0.25",
    "0.3125",
    "0.375",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "",
    "",
    "",
    "",
  ])
  assert.deepStrictEqual(t.map(s.tickFormat(5)), [
    "0.125",
    "0.1875",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "1",
    "2",
    "3",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
  ])
  assert.deepStrictEqual(t.map(s.tickFormat(1)), [
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "1",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
  ])
})

it("log.ticks() generates log ticks", () => {
  const x = scaleLog()
  assert.deepStrictEqual(x.ticks().map(x.tickFormat(Infinity)), ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"])
  x.domain([100, 1])
  assert.deepStrictEqual(x.ticks().map(x.tickFormat(Infinity)), [
    "100",
    "90",
    "80",
    "70",
    "60",
    "50",
    "40",
    "30",
    "20",
    "10",
    "9",
    "8",
    "7",
    "6",
    "5",
    "4",
    "3",
    "2",
    "1",
  ])
  x.domain([0.49999, 0.006029505943610648])
  assert.deepStrictEqual(x.ticks().map(x.tickFormat(Infinity)), [
    "400m",
    "300m",
    "200m",
    "100m",
    "90m",
    "80m",
    "70m",
    "60m",
    "50m",
    "40m",
    "30m",
    "20m",
    "10m",
    "9m",
    "8m",
    "7m",
  ])
  x.domain([0.95, 1.05e8])
  assert.deepStrictEqual(x.ticks().map(x.tickFormat(8)).filter(String), [
    "1",
    "10",
    "100",
    "1k",
    "10k",
    "100k",
    "1M",
    "10M",
    "100M",
  ])
})

it("log.tickFormat(count) filters ticks to about count", () => {
  const x = scaleLog()
  assert.deepStrictEqual(x.ticks().map(x.tickFormat(5)), ["1", "2", "3", "4", "5", "", "", "", "", "10"])
  x.domain([100, 1])
  assert.deepStrictEqual(x.ticks().map(x.tickFormat(10)), [
    "100",
    "",
    "",
    "",
    "",
    "50",
    "40",
    "30",
    "20",
    "10",
    "",
    "",
    "",
    "",
    "5",
    "4",
    "3",
    "2",
    "1",
  ])
})

it("log.ticks(count) filters powers-of-ten ticks for huge domains", () => {
  const x = scaleLog().domain([1e10, 1])
  assert.deepStrictEqual(x.ticks().map(x.tickFormat()), [
    "10G",
    "1G",
    "100M",
    "10M",
    "1M",
    "100k",
    "10k",
    "1k",
    "100",
    "10",
    "1",
  ])
  x.domain([1e-29, 1e-1])
  assert.deepStrictEqual(x.ticks().map(x.tickFormat()), [
    "0.0001y",
    "0.01y",
    "1y",
    "100y",
    "10z",
    "1a",
    "100a",
    "10f",
    "1p",
    "100p",
    "10n",
    "1µ",
    "100µ",
    "10m",
  ])
})

it("log.ticks() generates ticks that cover the domain", () => {
  const x = scaleLog().domain([0.01, 10000])
  assert.deepStrictEqual(x.ticks(20).map(x.tickFormat(20)), [
    "10m",
    "20m",
    "30m",
    "",
    "",
    "",
    "",
    "",
    "",
    "100m",
    "200m",
    "300m",
    "",
    "",
    "",
    "",
    "",
    "",
    "1",
    "2",
    "3",
    "",
    "",
    "",
    "",
    "",
    "",
    "10",
    "20",
    "30",
    "",
    "",
    "",
    "",
    "",
    "",
    "100",
    "200",
    "300",
    "",
    "",
    "",
    "",
    "",
    "",
    "1k",
    "2k",
    "3k",
    "",
    "",
    "",
    "",
    "",
    "",
    "10k",
  ])
})

it("log.ticks() generates ticks that cover the niced domain", () => {
  const x = scaleLog().domain([0.0124123, 1230.4]).nice()
  assert.deepStrictEqual(x.ticks(20).map(x.tickFormat(20)), [
    "10m",
    "20m",
    "30m",
    "",
    "",
    "",
    "",
    "",
    "",
    "100m",
    "200m",
    "300m",
    "",
    "",
    "",
    "",
    "",
    "",
    "1",
    "2",
    "3",
    "",
    "",
    "",
    "",
    "",
    "",
    "10",
    "20",
    "30",
    "",
    "",
    "",
    "",
    "",
    "",
    "100",
    "200",
    "300",
    "",
    "",
    "",
    "",
    "",
    "",
    "1k",
    "2k",
    "3k",
    "",
    "",
    "",
    "",
    "",
    "",
    "10k",
  ])
})

it("log.tickFormat(count, format) returns a filtered format", () => {
  const x = scaleLog().domain([1000.1, 1])
  assert.deepStrictEqual(x.ticks().map(x.tickFormat(10, format("+,d"))), [
    "+1,000",
    "",
    "",
    "",
    "",
    "",
    "",
    "+300",
    "+200",
    "+100",
    "",
    "",
    "",
    "",
    "",
    "",
    "+30",
    "+20",
    "+10",
    "",
    "",
    "",
    "",
    "",
    "",
    "+3",
    "+2",
    "+1",
  ])
})

it("log.tickFormat(count, specifier) returns a filtered format", () => {
  const x = scaleLog().domain([1000.1, 1])
  assert.deepStrictEqual(x.ticks().map(x.tickFormat(10, "s")), [
    "1k",
    "",
    "",
    "",
    "",
    "",
    "",
    "300",
    "200",
    "100",
    "",
    "",
    "",
    "",
    "",
    "",
    "30",
    "20",
    "10",
    "",
    "",
    "",
    "",
    "",
    "",
    "3",
    "2",
    "1",
  ])
})

it("log.tickFormat(count, specifier) trims trailing zeroes by default", () => {
  const x = scaleLog().domain([100.1, 0.02])
  assert.deepStrictEqual(x.ticks().map(x.tickFormat(10, "f")), [
    "100",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "20",
    "10",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "2",
    "1",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "0.2",
    "0.1",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "0.02",
  ])
})

it("log.tickFormat(count, specifier) with base two trims trailing zeroes by default", () => {
  const x = scaleLog().base(2).domain([100.1, 0.02])
  assert.deepStrictEqual(x.ticks().map(x.tickFormat(10, "f")), [
    "64",
    "32",
    "16",
    "8",
    "4",
    "2",
    "1",
    "0.5",
    "0.25",
    "0.125",
    "0.0625",
    "0.03125",
  ])
})

it("log.tickFormat(count, specifier) preserves trailing zeroes if needed", () => {
  const x = scaleLog().domain([100.1, 0.02])
  assert.deepStrictEqual(x.ticks().map(x.tickFormat(10, ".1f")), [
    "100.0",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "20.0",
    "10.0",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "2.0",
    "1.0",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "0.2",
    "0.1",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "0.0",
  ])
})

it("log.ticks() returns the empty array when the domain is degenerate", () => {
  const x = scaleLog()
  assert.deepStrictEqual(x.domain([0, 1]).ticks(), [])
  assert.deepStrictEqual(x.domain([1, 0]).ticks(), [])
  assert.deepStrictEqual(x.domain([0, -1]).ticks(), [])
  assert.deepStrictEqual(x.domain([-1, 0]).ticks(), [])
  assert.deepStrictEqual(x.domain([-1, 1]).ticks(), [])
  assert.deepStrictEqual(x.domain([0, 0]).ticks(), [])
})

function round(x) {
  return Math.round(x * 1e12) / 1e12
}
import assert from "assert"
import { scaleImplicit, scaleOrdinal } from "../src/index.js"

it("scaleOrdinal() has the expected defaults", () => {
  const s = scaleOrdinal()
  assert.deepStrictEqual(s.domain(), [])
  assert.deepStrictEqual(s.range(), [])
  assert.strictEqual(s(0), undefined)
  assert.strictEqual(s.unknown(), scaleImplicit)
  assert.deepStrictEqual(s.domain(), [0])
})

it("ordinal(x) maps a unique name x in the domain to the corresponding value y in the range", () => {
  const s = scaleOrdinal().domain([0, 1]).range(["foo", "bar"]).unknown(undefined)
  assert.strictEqual(s(0), "foo")
  assert.strictEqual(s(1), "bar")
  s.range(["a", "b", "c"])
  assert.strictEqual(s(0), "a")
  assert.strictEqual(s("0"), undefined)
  assert.strictEqual(s([0]), undefined)
  assert.strictEqual(s(1), "b")
  assert.strictEqual(s(new Number(1)), "b")
  assert.strictEqual(s(2), undefined)
})

it("ordinal(x) implicitly extends the domain when a range is explicitly specified", () => {
  const s = scaleOrdinal().range(["foo", "bar"])
  assert.deepStrictEqual(s.domain(), [])
  assert.strictEqual(s(0), "foo")
  assert.deepStrictEqual(s.domain(), [0])
  assert.strictEqual(s(1), "bar")
  assert.deepStrictEqual(s.domain(), [0, 1])
  assert.strictEqual(s(0), "foo")
  assert.deepStrictEqual(s.domain(), [0, 1])
})

it("ordinal.domain(x) makes a copy of the domain", () => {
  const domain = ["red", "green"]
  const s = scaleOrdinal().domain(domain)
  domain.push("blue")
  assert.deepStrictEqual(s.domain(), ["red", "green"])
})

it("ordinal.domain() returns a copy of the domain", () => {
  const s = scaleOrdinal().domain(["red", "green"])
  const domain = s.domain()
  s("blue")
  assert.deepStrictEqual(domain, ["red", "green"])
})

it("ordinal.domain() accepts an iterable", () => {
  const s = scaleOrdinal().domain(new Set(["red", "green"]))
  assert.deepStrictEqual(s.domain(), ["red", "green"])
})

it("ordinal.domain() replaces previous domain values", () => {
  const s = scaleOrdinal().range(["foo", "bar"])
  assert.strictEqual(s(1), "foo")
  assert.strictEqual(s(0), "bar")
  assert.deepStrictEqual(s.domain(), [1, 0])
  s.domain(["0", "1"])
  assert.strictEqual(s("0"), "foo") // it changed!
  assert.strictEqual(s("1"), "bar")
  assert.deepStrictEqual(s.domain(), ["0", "1"])
})

it("ordinal.domain() uniqueness is based on primitive coercion", () => {
  const s = scaleOrdinal().domain(["foo"]).range([42, 43, 44])
  assert.strictEqual(s(new String("foo")), 42)
  assert.strictEqual(
    s({
      valueOf: function () {
        return "foo"
      },
    }),
    42
  )
  assert.strictEqual(
    s({
      valueOf: function () {
        return "bar"
      },
    }),
    43
  )
})

it("ordinal.domain() does not coerce domain values to strings", () => {
  const s = scaleOrdinal().domain([0, 1])
  assert.deepStrictEqual(s.domain(), [0, 1])
  assert.strictEqual(typeof s.domain()[0], "number")
  assert.strictEqual(typeof s.domain()[1], "number")
})

it("ordinal.domain() does not barf on object built-ins", () => {
  const s = scaleOrdinal().domain(["__proto__", "hasOwnProperty"]).range([42, 43])
  assert.strictEqual(s("__proto__"), 42)
  assert.strictEqual(s("hasOwnProperty"), 43)
  assert.deepStrictEqual(s.domain(), ["__proto__", "hasOwnProperty"])
})

it("ordinal() accepts dates", () => {
  const s = scaleOrdinal()
  s(new Date(1970, 2, 1))
  s(new Date(2001, 4, 13))
  s(new Date(1970, 2, 1))
  s(new Date(2001, 4, 13))
  assert.deepStrictEqual(s.domain(), [new Date(1970, 2, 1), new Date(2001, 4, 13)])
})

it("ordinal.domain() accepts dates", () => {
  const s = scaleOrdinal().domain([
    new Date(1970, 2, 1),
    new Date(2001, 4, 13),
    new Date(1970, 2, 1),
    new Date(2001, 4, 13),
  ])
  s(new Date(1970, 2, 1))
  s(new Date(1999, 11, 31))
  assert.deepStrictEqual(s.domain(), [new Date(1970, 2, 1), new Date(2001, 4, 13), new Date(1999, 11, 31)])
})

it("ordinal.domain() does not barf on object built-ins", () => {
  const s = scaleOrdinal().domain(["__proto__", "hasOwnProperty"]).range([42, 43])
  assert.strictEqual(s("__proto__"), 42)
  assert.strictEqual(s("hasOwnProperty"), 43)
  assert.deepStrictEqual(s.domain(), ["__proto__", "hasOwnProperty"])
})

it("ordinal.domain() is ordered by appearance", () => {
  const s = scaleOrdinal()
  s("foo")
  s("bar")
  s("baz")
  assert.deepStrictEqual(s.domain(), ["foo", "bar", "baz"])
  s.domain(["baz", "bar"])
  s("foo")
  assert.deepStrictEqual(s.domain(), ["baz", "bar", "foo"])
  s.domain(["baz", "foo"])
  assert.deepStrictEqual(s.domain(), ["baz", "foo"])
  s.domain([])
  s("foo")
  s("bar")
  assert.deepStrictEqual(s.domain(), ["foo", "bar"])
})

it("ordinal.range(x) makes a copy of the range", () => {
  const range = ["red", "green"]
  const s = scaleOrdinal().range(range)
  range.push("blue")
  assert.deepStrictEqual(s.range(), ["red", "green"])
})

it("ordinal.range() accepts an iterable", () => {
  const s = scaleOrdinal().range(new Set(["red", "green"]))
  assert.deepStrictEqual(s.range(), ["red", "green"])
})

it("ordinal.range() returns a copy of the range", () => {
  const s = scaleOrdinal().range(["red", "green"])
  const range = s.range()
  assert.deepStrictEqual(range, ["red", "green"])
  range.push("blue")
  assert.deepStrictEqual(s.range(), ["red", "green"])
})

it("ordinal.range(values) does not discard implicit domain associations", () => {
  const s = scaleOrdinal()
  assert.strictEqual(s(0), undefined)
  assert.strictEqual(s(1), undefined)
  s.range(["foo", "bar"])
  assert.strictEqual(s(1), "bar")
  assert.strictEqual(s(0), "foo")
})

it("ordinal(value) recycles values when exhausted", () => {
  const s = scaleOrdinal().range(["a", "b", "c"])
  assert.strictEqual(s(0), "a")
  assert.strictEqual(s(1), "b")
  assert.strictEqual(s(2), "c")
  assert.strictEqual(s(3), "a")
  assert.strictEqual(s(4), "b")
  assert.strictEqual(s(5), "c")
  assert.strictEqual(s(2), "c")
  assert.strictEqual(s(1), "b")
  assert.strictEqual(s(0), "a")
})

it("ordinal.unknown(x) sets the output value for unknown inputs", () => {
  const s = scaleOrdinal().domain(["foo", "bar"]).unknown("gray").range(["red", "blue"])
  assert.strictEqual(s("foo"), "red")
  assert.strictEqual(s("bar"), "blue")
  assert.strictEqual(s("baz"), "gray")
  assert.strictEqual(s("quux"), "gray")
})

it("ordinal.unknown(x) prevents implicit domain extension if x is not implicit", () => {
  const s = scaleOrdinal().domain(["foo", "bar"]).unknown(undefined).range(["red", "blue"])
  assert.strictEqual(s("baz"), undefined)
  assert.deepStrictEqual(s.domain(), ["foo", "bar"])
})

it("ordinal.copy() copies all fields", () => {
  const s1 = scaleOrdinal().domain([1, 2]).range(["red", "green"]).unknown("gray")
  const s2 = s1.copy()
  assert.deepStrictEqual(s2.domain(), s1.domain())
  assert.deepStrictEqual(s2.range(), s1.range())
  assert.deepStrictEqual(s2.unknown(), s1.unknown())
})

it("ordinal.copy() changes to the domain are isolated", () => {
  const s1 = scaleOrdinal().range(["foo", "bar"])
  const s2 = s1.copy()
  s1.domain([1, 2])
  assert.deepStrictEqual(s2.domain(), [])
  assert.strictEqual(s1(1), "foo")
  assert.strictEqual(s2(1), "foo")
  s2.domain([2, 3])
  assert.strictEqual(s1(2), "bar")
  assert.strictEqual(s2(2), "foo")
  assert.deepStrictEqual(s1.domain(), [1, 2])
  assert.deepStrictEqual(s2.domain(), [2, 3])
})

it("ordinal.copy() changes to the range are isolated", () => {
  const s1 = scaleOrdinal().range(["foo", "bar"])
  const s2 = s1.copy()
  s1.range(["bar", "foo"])
  assert.strictEqual(s1(1), "bar")
  assert.strictEqual(s2(1), "foo")
  assert.deepStrictEqual(s2.range(), ["foo", "bar"])
  s2.range(["foo", "baz"])
  assert.strictEqual(s1(2), "foo")
  assert.strictEqual(s2(2), "baz")
  assert.deepStrictEqual(s1.range(), ["bar", "foo"])
  assert.deepStrictEqual(s2.range(), ["foo", "baz"])
})
import assert from "assert"
import { scaleBand, scalePoint } from "../src/index.js"

it("scalePoint() has the expected defaults", () => {
  const s = scalePoint()
  assert.deepStrictEqual(s.domain(), [])
  assert.deepStrictEqual(s.range(), [0, 1])
  assert.strictEqual(s.bandwidth(), 0)
  assert.strictEqual(s.step(), 1)
  assert.strictEqual(s.round(), false)
  assert.strictEqual(s.padding(), 0)
  assert.strictEqual(s.align(), 0.5)
})

it("scalePoint() does not expose paddingInner and paddingOuter", () => {
  const s = scalePoint()
  assert.strictEqual(s.paddingInner, undefined)
  assert.strictEqual(s.paddingOuter, undefined)
})

it("scalePoint() is similar to scaleBand().paddingInner(1)", () => {
  const p = scalePoint().domain(["foo", "bar"]).range([0, 960])
  const b = scaleBand().domain(["foo", "bar"]).range([0, 960]).paddingInner(1)
  assert.deepStrictEqual(p.domain().map(p), b.domain().map(b))
  assert.strictEqual(p.bandwidth(), b.bandwidth())
  assert.strictEqual(p.step(), b.step())
})

it("point.padding(p) sets the band outer padding to p", () => {
  const p = scalePoint().domain(["foo", "bar"]).range([0, 960]).padding(0.5)
  const b = scaleBand().domain(["foo", "bar"]).range([0, 960]).paddingInner(1).paddingOuter(0.5)
  assert.deepStrictEqual(p.domain().map(p), b.domain().map(b))
  assert.strictEqual(p.bandwidth(), b.bandwidth())
  assert.strictEqual(p.step(), b.step())
})

it("point.copy() returns a copy", () => {
  const s = scalePoint()
  assert.deepStrictEqual(s.domain(), [])
  assert.deepStrictEqual(s.range(), [0, 1])
  assert.strictEqual(s.bandwidth(), 0)
  assert.strictEqual(s.step(), 1)
  assert.strictEqual(s.round(), false)
  assert.strictEqual(s.padding(), 0)
  assert.strictEqual(s.align(), 0.5)
})
import assert from "assert"
import { scalePow, scaleSqrt } from "../src/index.js"
import { roundEpsilon } from "./roundEpsilon.js"
import { assertInDelta } from "./asserts.js"

it("scalePow() has the expected defaults", () => {
  const s = scalePow()
  assert.deepStrictEqual(s.domain(), [0, 1])
  assert.deepStrictEqual(s.range(), [0, 1])
  assert.strictEqual(s.clamp(), false)
  assert.strictEqual(s.exponent(), 1)
  assert.deepStrictEqual(s.interpolate()({ array: ["red"] }, { array: ["blue"] })(0.5), { array: ["rgb(128, 0, 128)"] })
})

it("pow(x) maps a domain value x to a range value y", () => {
  assert.strictEqual(scalePow().exponent(0.5)(0.5), Math.SQRT1_2)
})

it("pow(x) ignores extra range values if the domain is smaller than the range", () => {
  assert.strictEqual(scalePow().domain([-10, 0]).range(["red", "white", "green"]).clamp(true)(-5), "rgb(255, 128, 128)")
  assert.strictEqual(scalePow().domain([-10, 0]).range(["red", "white", "green"]).clamp(true)(50), "rgb(255, 255, 255)")
})

it("pow(x) ignores extra domain values if the range is smaller than the domain", () => {
  assert.strictEqual(scalePow().domain([-10, 0, 100]).range(["red", "white"]).clamp(true)(-5), "rgb(255, 128, 128)")
  assert.strictEqual(scalePow().domain([-10, 0, 100]).range(["red", "white"]).clamp(true)(50), "rgb(255, 255, 255)")
})

it("pow(x) maps an empty domain to the middle of the range", () => {
  assert.strictEqual(scalePow().domain([0, 0]).range([1, 2])(0), 1.5)
  assert.strictEqual(scalePow().domain([0, 0]).range([2, 1])(1), 1.5)
})

it("pow(x) can map a bipow domain with two values to the corresponding range", () => {
  const s = scalePow().domain([1, 2])
  assert.deepStrictEqual(s.domain(), [1, 2])
  assert.strictEqual(s(0.5), -0.5)
  assert.strictEqual(s(1.0), 0.0)
  assert.strictEqual(s(1.5), 0.5)
  assert.strictEqual(s(2.0), 1.0)
  assert.strictEqual(s(2.5), 1.5)
  assert.strictEqual(s.invert(-0.5), 0.5)
  assert.strictEqual(s.invert(0.0), 1.0)
  assert.strictEqual(s.invert(0.5), 1.5)
  assert.strictEqual(s.invert(1.0), 2.0)
  assert.strictEqual(s.invert(1.5), 2.5)
})

it("pow(x) can map a polypow domain with more than two values to the corresponding range", () => {
  const s = scalePow().domain([-10, 0, 100]).range(["red", "white", "green"])
  assert.deepStrictEqual(s.domain(), [-10, 0, 100])
  assert.strictEqual(s(-5), "rgb(255, 128, 128)")
  assert.strictEqual(s(50), "rgb(128, 192, 128)")
  assert.strictEqual(s(75), "rgb(64, 160, 64)")
  s.domain([4, 2, 1]).range([1, 2, 4])
  assert.strictEqual(s(1.5), 3)
  assert.strictEqual(s(3), 1.5)
  assert.strictEqual(s.invert(1.5), 3)
  assert.strictEqual(s.invert(3), 1.5)
  s.domain([1, 2, 4]).range([4, 2, 1])
  assert.strictEqual(s(1.5), 3)
  assert.strictEqual(s(3), 1.5)
  assert.strictEqual(s.invert(1.5), 3)
  assert.strictEqual(s.invert(3), 1.5)
})

it("pow.invert(y) maps a range value y to a domain value x", () => {
  assert.strictEqual(scalePow().range([1, 2]).invert(1.5), 0.5)
})

it("pow.invert(y) maps an empty range to the middle of the domain", () => {
  assert.strictEqual(scalePow().domain([1, 2]).range([0, 0]).invert(0), 1.5)
  assert.strictEqual(scalePow().domain([2, 1]).range([0, 0]).invert(1), 1.5)
})

it("pow.invert(y) coerces range values to numbers", () => {
  assert.strictEqual(scalePow().range(["0", "2"]).invert("1"), 0.5)
  assert.strictEqual(
    scalePow()
      .range([new Date(1990, 0, 1), new Date(1991, 0, 1)])
      .invert(new Date(1990, 6, 2, 13)),
    0.5
  )
})

it("pow.invert(y) returns NaN if the range is not coercible to number", () => {
  assert(isNaN(scalePow().range(["#000", "#fff"]).invert("#999")))
  assert(isNaN(scalePow().range([0, "#fff"]).invert("#999")))
})

it("pow.exponent(exponent) sets the exponent to the specified value", () => {
  const x = scalePow().exponent(0.5).domain([1, 2])
  assertInDelta(x(1), 0, 1e-6)
  assertInDelta(x(1.5), 0.5425821, 1e-6)
  assertInDelta(x(2), 1, 1e-6)
  assert.strictEqual(x.exponent(), 0.5)
  x.exponent(2).domain([1, 2])
  assertInDelta(x(1), 0, 1e-6)
  assertInDelta(x(1.5), 0.41666667, 1e-6)
  assertInDelta(x(2), 1, 1e-6)
  assert.strictEqual(x.exponent(), 2)
  x.exponent(-1).domain([1, 2])
  assertInDelta(x(1), 0, 1e-6)
  assertInDelta(x(1.5), 0.6666667, 1e-6)
  assertInDelta(x(2), 1, 1e-6)
  assert.strictEqual(x.exponent(), -1)
})

it("pow.exponent(exponent) changing the exponent does not change the domain or range", () => {
  const x = scalePow().domain([1, 2]).range([3, 4])
  x.exponent(0.5)
  assert.deepStrictEqual(x.domain(), [1, 2])
  assert.deepStrictEqual(x.range(), [3, 4])
  x.exponent(2)
  assert.deepStrictEqual(x.domain(), [1, 2])
  assert.deepStrictEqual(x.range(), [3, 4])
  x.exponent(-1)
  assert.deepStrictEqual(x.domain(), [1, 2])
  assert.deepStrictEqual(x.range(), [3, 4])
})

it("pow.domain(domain) accepts an array of numbers", () => {
  assert.deepStrictEqual(scalePow().domain([]).domain(), [])
  assert.deepStrictEqual(scalePow().domain([1, 0]).domain(), [1, 0])
  assert.deepStrictEqual(scalePow().domain([1, 2, 3]).domain(), [1, 2, 3])
})

it("pow.domain(domain) coerces domain values to numbers", () => {
  assert.deepStrictEqual(
    scalePow()
      .domain([new Date(1990, 0, 1), new Date(1991, 0, 1)])
      .domain(),
    [631180800000, 662716800000]
  )
  assert.deepStrictEqual(scalePow().domain(["0.0", "1.0"]).domain(), [0, 1])
  assert.deepStrictEqual(
    scalePow()
      .domain([new Number(0), new Number(1)])
      .domain(),
    [0, 1]
  )
})

it("pow.domain(domain) makes a copy of domain values", () => {
  const d = [1, 2],
    s = scalePow().domain(d)
  assert.deepStrictEqual(s.domain(), [1, 2])
  d.push(3)
  assert.deepStrictEqual(s.domain(), [1, 2])
  assert.deepStrictEqual(d, [1, 2, 3])
})

it("pow.domain() returns a copy of domain values", () => {
  const s = scalePow(),
    d = s.domain()
  assert.deepStrictEqual(d, [0, 1])
  d.push(3)
  assert.deepStrictEqual(s.domain(), [0, 1])
})

it("pow.range(range) does not coerce range to numbers", () => {
  const s = scalePow().range(["0px", "2px"])
  assert.deepStrictEqual(s.range(), ["0px", "2px"])
  assert.strictEqual(s(0.5), "1px")
})

it("pow.range(range) can accept range values as colors", () => {
  assert.strictEqual(scalePow().range(["red", "blue"])(0.5), "rgb(128, 0, 128)")
  assert.strictEqual(scalePow().range(["#ff0000", "#0000ff"])(0.5), "rgb(128, 0, 128)")
  assert.strictEqual(scalePow().range(["#f00", "#00f"])(0.5), "rgb(128, 0, 128)")
  assert.strictEqual(scalePow().range(["rgb(255,0,0)", "hsl(240,100%,50%)"])(0.5), "rgb(128, 0, 128)")
  assert.strictEqual(scalePow().range(["rgb(100%,0%,0%)", "hsl(240,100%,50%)"])(0.5), "rgb(128, 0, 128)")
  assert.strictEqual(scalePow().range(["hsl(0,100%,50%)", "hsl(240,100%,50%)"])(0.5), "rgb(128, 0, 128)")
})

it("pow.range(range) can accept range values as arrays or objects", () => {
  assert.deepStrictEqual(scalePow().range([{ color: "red" }, { color: "blue" }])(0.5), { color: "rgb(128, 0, 128)" })
  assert.deepStrictEqual(scalePow().range([["red"], ["blue"]])(0.5), ["rgb(128, 0, 128)"])
})

it("pow.range(range) makes a copy of range values", () => {
  const r = [1, 2],
    s = scalePow().range(r)
  assert.deepStrictEqual(s.range(), [1, 2])
  r.push(3)
  assert.deepStrictEqual(s.range(), [1, 2])
  assert.deepStrictEqual(r, [1, 2, 3])
})

it("pow.range() returns a copy of range values", () => {
  const s = scalePow(),
    r = s.range()
  assert.deepStrictEqual(r, [0, 1])
  r.push(3)
  assert.deepStrictEqual(s.range(), [0, 1])
})

it("pow.rangeRound(range) is an alias for pow.range(range).interpolate(interpolateRound)", () => {
  assert.strictEqual(scalePow().rangeRound([0, 10])(0.59), 6)
})

it("pow.clamp() is false by default", () => {
  assert.strictEqual(scalePow().clamp(), false)
  assert.strictEqual(scalePow().range([10, 20])(2), 30)
  assert.strictEqual(scalePow().range([10, 20])(-1), 0)
  assert.strictEqual(scalePow().range([10, 20]).invert(30), 2)
  assert.strictEqual(scalePow().range([10, 20]).invert(0), -1)
})

it("pow.clamp(true) restricts output values to the range", () => {
  assert.strictEqual(scalePow().clamp(true).range([10, 20])(2), 20)
  assert.strictEqual(scalePow().clamp(true).range([10, 20])(-1), 10)
})

it("pow.clamp(true) restricts input values to the domain", () => {
  assert.strictEqual(scalePow().clamp(true).range([10, 20]).invert(30), 1)
  assert.strictEqual(scalePow().clamp(true).range([10, 20]).invert(0), 0)
})

it("pow.clamp(clamp) coerces the specified clamp value to a boolean", () => {
  assert.strictEqual(scalePow().clamp("true").clamp(), true)
  assert.strictEqual(scalePow().clamp(1).clamp(), true)
  assert.strictEqual(scalePow().clamp("").clamp(), false)
  assert.strictEqual(scalePow().clamp(0).clamp(), false)
})

it("pow.interpolate(interpolate) takes a custom interpolator factory", () => {
  function interpolate(a, b) {
    return function (t) {
      return [a, b, t]
    }
  }
  const s = scalePow().domain([10, 20]).range(["a", "b"]).interpolate(interpolate)
  assert.strictEqual(s.interpolate(), interpolate)
  assert.deepStrictEqual(s(15), ["a", "b", 0.5])
})

it("pow.nice() is an alias for pow.nice(10)", () => {
  assert.deepStrictEqual(scalePow().domain([0, 0.96]).nice().domain(), [0, 1])
  assert.deepStrictEqual(scalePow().domain([0, 96]).nice().domain(), [0, 100])
})

it("pow.nice(count) extends the domain to match the desired ticks", () => {
  assert.deepStrictEqual(scalePow().domain([0, 0.96]).nice(10).domain(), [0, 1])
  assert.deepStrictEqual(scalePow().domain([0, 96]).nice(10).domain(), [0, 100])
  assert.deepStrictEqual(scalePow().domain([0.96, 0]).nice(10).domain(), [1, 0])
  assert.deepStrictEqual(scalePow().domain([96, 0]).nice(10).domain(), [100, 0])
  assert.deepStrictEqual(scalePow().domain([0, -0.96]).nice(10).domain(), [0, -1])
  assert.deepStrictEqual(scalePow().domain([0, -96]).nice(10).domain(), [0, -100])
  assert.deepStrictEqual(scalePow().domain([-0.96, 0]).nice(10).domain(), [-1, 0])
  assert.deepStrictEqual(scalePow().domain([-96, 0]).nice(10).domain(), [-100, 0])
})

it("pow.nice(count) nices the domain, extending it to round numbers", () => {
  assert.deepStrictEqual(scalePow().domain([1.1, 10.9]).nice(10).domain(), [1, 11])
  assert.deepStrictEqual(scalePow().domain([10.9, 1.1]).nice(10).domain(), [11, 1])
  assert.deepStrictEqual(scalePow().domain([0.7, 11.001]).nice(10).domain(), [0, 12])
  assert.deepStrictEqual(scalePow().domain([123.1, 6.7]).nice(10).domain(), [130, 0])
  assert.deepStrictEqual(scalePow().domain([0, 0.49]).nice(10).domain(), [0, 0.5])
})

it("pow.nice(count) has no effect on degenerate domains", () => {
  assert.deepStrictEqual(scalePow().domain([0, 0]).nice(10).domain(), [0, 0])
  assert.deepStrictEqual(scalePow().domain([0.5, 0.5]).nice(10).domain(), [0.5, 0.5])
})

it("pow.nice(count) nicing a polypow domain only affects the extent", () => {
  assert.deepStrictEqual(scalePow().domain([1.1, 1, 2, 3, 10.9]).nice(10).domain(), [1, 1, 2, 3, 11])
  assert.deepStrictEqual(scalePow().domain([123.1, 1, 2, 3, -0.9]).nice(10).domain(), [130, 1, 2, 3, -10])
})

it("pow.nice(count) accepts a tick count to control nicing step", () => {
  assert.deepStrictEqual(scalePow().domain([12, 87]).nice(5).domain(), [0, 100])
  assert.deepStrictEqual(scalePow().domain([12, 87]).nice(10).domain(), [10, 90])
  assert.deepStrictEqual(scalePow().domain([12, 87]).nice(100).domain(), [12, 87])
})

it("pow.ticks(count) returns the expected ticks for an ascending domain", () => {
  const s = scalePow()
  assert.deepStrictEqual(s.ticks(10).map(roundEpsilon), [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0])
  assert.deepStrictEqual(s.ticks(9).map(roundEpsilon), [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0])
  assert.deepStrictEqual(s.ticks(8).map(roundEpsilon), [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0])
  assert.deepStrictEqual(s.ticks(7).map(roundEpsilon), [0.0, 0.2, 0.4, 0.6, 0.8, 1.0])
  assert.deepStrictEqual(s.ticks(6).map(roundEpsilon), [0.0, 0.2, 0.4, 0.6, 0.8, 1.0])
  assert.deepStrictEqual(s.ticks(5).map(roundEpsilon), [0.0, 0.2, 0.4, 0.6, 0.8, 1.0])
  assert.deepStrictEqual(s.ticks(4).map(roundEpsilon), [0.0, 0.2, 0.4, 0.6, 0.8, 1.0])
  assert.deepStrictEqual(s.ticks(3).map(roundEpsilon), [0.0, 0.5, 1.0])
  assert.deepStrictEqual(s.ticks(2).map(roundEpsilon), [0.0, 0.5, 1.0])
  assert.deepStrictEqual(s.ticks(1).map(roundEpsilon), [0.0, 1.0])
  s.domain([-100, 100])
  assert.deepStrictEqual(s.ticks(10), [-100, -80, -60, -40, -20, 0, 20, 40, 60, 80, 100])
  assert.deepStrictEqual(s.ticks(9), [-100, -80, -60, -40, -20, 0, 20, 40, 60, 80, 100])
  assert.deepStrictEqual(s.ticks(8), [-100, -80, -60, -40, -20, 0, 20, 40, 60, 80, 100])
  assert.deepStrictEqual(s.ticks(7), [-100, -80, -60, -40, -20, 0, 20, 40, 60, 80, 100])
  assert.deepStrictEqual(s.ticks(6), [-100, -50, 0, 50, 100])
  assert.deepStrictEqual(s.ticks(5), [-100, -50, 0, 50, 100])
  assert.deepStrictEqual(s.ticks(4), [-100, -50, 0, 50, 100])
  assert.deepStrictEqual(s.ticks(3), [-100, -50, 0, 50, 100])
  assert.deepStrictEqual(s.ticks(2), [-100, 0, 100])
  assert.deepStrictEqual(s.ticks(1), [0])
})

it("pow.ticks(count) returns the expected ticks for a descending domain", () => {
  const s = scalePow().domain([1, 0])
  assert.deepStrictEqual(
    s.ticks(10).map(roundEpsilon),
    [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0].reverse()
  )
  assert.deepStrictEqual(
    s.ticks(9).map(roundEpsilon),
    [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0].reverse()
  )
  assert.deepStrictEqual(
    s.ticks(8).map(roundEpsilon),
    [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0].reverse()
  )
  assert.deepStrictEqual(s.ticks(7).map(roundEpsilon), [0.0, 0.2, 0.4, 0.6, 0.8, 1.0].reverse())
  assert.deepStrictEqual(s.ticks(6).map(roundEpsilon), [0.0, 0.2, 0.4, 0.6, 0.8, 1.0].reverse())
  assert.deepStrictEqual(s.ticks(5).map(roundEpsilon), [0.0, 0.2, 0.4, 0.6, 0.8, 1.0].reverse())
  assert.deepStrictEqual(s.ticks(4).map(roundEpsilon), [0.0, 0.2, 0.4, 0.6, 0.8, 1.0].reverse())
  assert.deepStrictEqual(s.ticks(3).map(roundEpsilon), [0.0, 0.5, 1.0].reverse())
  assert.deepStrictEqual(s.ticks(2).map(roundEpsilon), [0.0, 0.5, 1.0].reverse())
  assert.deepStrictEqual(s.ticks(1).map(roundEpsilon), [0.0, 1.0].reverse())
  s.domain([100, -100])
  assert.deepStrictEqual(s.ticks(10), [-100, -80, -60, -40, -20, 0, 20, 40, 60, 80, 100].reverse())
  assert.deepStrictEqual(s.ticks(9), [-100, -80, -60, -40, -20, 0, 20, 40, 60, 80, 100].reverse())
  assert.deepStrictEqual(s.ticks(8), [-100, -80, -60, -40, -20, 0, 20, 40, 60, 80, 100].reverse())
  assert.deepStrictEqual(s.ticks(7), [-100, -80, -60, -40, -20, 0, 20, 40, 60, 80, 100].reverse())
  assert.deepStrictEqual(s.ticks(6), [-100, -50, 0, 50, 100].reverse())
  assert.deepStrictEqual(s.ticks(5), [-100, -50, 0, 50, 100].reverse())
  assert.deepStrictEqual(s.ticks(4), [-100, -50, 0, 50, 100].reverse())
  assert.deepStrictEqual(s.ticks(3), [-100, -50, 0, 50, 100].reverse())
  assert.deepStrictEqual(s.ticks(2), [-100, 0, 100].reverse())
  assert.deepStrictEqual(s.ticks(1), [0].reverse())
})

it("pow.ticks(count) returns the expected ticks for a polypow domain", () => {
  const s = scalePow().domain([0, 0.25, 0.9, 1])
  assert.deepStrictEqual(s.ticks(10).map(roundEpsilon), [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0])
  assert.deepStrictEqual(s.ticks(9).map(roundEpsilon), [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0])
  assert.deepStrictEqual(s.ticks(8).map(roundEpsilon), [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0])
  assert.deepStrictEqual(s.ticks(7).map(roundEpsilon), [0.0, 0.2, 0.4, 0.6, 0.8, 1.0])
  assert.deepStrictEqual(s.ticks(6).map(roundEpsilon), [0.0, 0.2, 0.4, 0.6, 0.8, 1.0])
  assert.deepStrictEqual(s.ticks(5).map(roundEpsilon), [0.0, 0.2, 0.4, 0.6, 0.8, 1.0])
  assert.deepStrictEqual(s.ticks(4).map(roundEpsilon), [0.0, 0.2, 0.4, 0.6, 0.8, 1.0])
  assert.deepStrictEqual(s.ticks(3).map(roundEpsilon), [0.0, 0.5, 1.0])
  assert.deepStrictEqual(s.ticks(2).map(roundEpsilon), [0.0, 0.5, 1.0])
  assert.deepStrictEqual(s.ticks(1).map(roundEpsilon), [0.0, 1.0])
  s.domain([-100, 0, 100])
  assert.deepStrictEqual(s.ticks(10), [-100, -80, -60, -40, -20, 0, 20, 40, 60, 80, 100])
  assert.deepStrictEqual(s.ticks(9), [-100, -80, -60, -40, -20, 0, 20, 40, 60, 80, 100])
  assert.deepStrictEqual(s.ticks(8), [-100, -80, -60, -40, -20, 0, 20, 40, 60, 80, 100])
  assert.deepStrictEqual(s.ticks(7), [-100, -80, -60, -40, -20, 0, 20, 40, 60, 80, 100])
  assert.deepStrictEqual(s.ticks(6), [-100, -50, 0, 50, 100])
  assert.deepStrictEqual(s.ticks(5), [-100, -50, 0, 50, 100])
  assert.deepStrictEqual(s.ticks(4), [-100, -50, 0, 50, 100])
  assert.deepStrictEqual(s.ticks(3), [-100, -50, 0, 50, 100])
  assert.deepStrictEqual(s.ticks(2), [-100, 0, 100])
  assert.deepStrictEqual(s.ticks(1), [0])
})

it("pow.ticks(count) returns the empty array if count is not a positive integer", () => {
  const s = scalePow()
  assert.deepStrictEqual(s.ticks(NaN), [])
  assert.deepStrictEqual(s.ticks(0), [])
  assert.deepStrictEqual(s.ticks(-1), [])
  assert.deepStrictEqual(s.ticks(Infinity), [])
})

it("pow.ticks() is an alias for pow.ticks(10)", () => {
  const s = scalePow()
  assert.deepStrictEqual(s.ticks(), s.ticks(10))
})

it("pow.tickFormat() is an alias for pow.tickFormat(10)", () => {
  assert.strictEqual(scalePow().tickFormat()(0.2), "0.2")
  assert.strictEqual(scalePow().domain([-100, 100]).tickFormat()(-20), "−20")
})

it("pow.tickFormat(count) returns a format suitable for the ticks", () => {
  assert.strictEqual(scalePow().tickFormat(10)(0.2), "0.2")
  assert.strictEqual(scalePow().tickFormat(20)(0.2), "0.20")
  assert.strictEqual(scalePow().domain([-100, 100]).tickFormat(10)(-20), "−20")
})

it("pow.tickFormat(count, specifier) sets the appropriate fixed precision if not specified", () => {
  assert.strictEqual(scalePow().tickFormat(10, "+f")(0.2), "+0.2")
  assert.strictEqual(scalePow().tickFormat(20, "+f")(0.2), "+0.20")
  assert.strictEqual(scalePow().tickFormat(10, "+%")(0.2), "+20%")
  assert.strictEqual(scalePow().domain([0.19, 0.21]).tickFormat(10, "+%")(0.2), "+20.0%")
})

it("pow.tickFormat(count, specifier) sets the appropriate round precision if not specified", () => {
  assert.strictEqual(scalePow().domain([0, 9]).tickFormat(10, "")(2.1), "2")
  assert.strictEqual(scalePow().domain([0, 9]).tickFormat(100, "")(2.01), "2")
  assert.strictEqual(scalePow().domain([0, 9]).tickFormat(100, "")(2.11), "2.1")
  assert.strictEqual(scalePow().domain([0, 9]).tickFormat(10, "e")(2.1), "2e+0")
  assert.strictEqual(scalePow().domain([0, 9]).tickFormat(100, "e")(2.01), "2.0e+0")
  assert.strictEqual(scalePow().domain([0, 9]).tickFormat(100, "e")(2.11), "2.1e+0")
  assert.strictEqual(scalePow().domain([0, 9]).tickFormat(10, "g")(2.1), "2")
  assert.strictEqual(scalePow().domain([0, 9]).tickFormat(100, "g")(2.01), "2.0")
  assert.strictEqual(scalePow().domain([0, 9]).tickFormat(100, "g")(2.11), "2.1")
  assert.strictEqual(scalePow().domain([0, 9]).tickFormat(10, "r")(2.1e6), "2000000")
  assert.strictEqual(scalePow().domain([0, 9]).tickFormat(100, "r")(2.01e6), "2000000")
  assert.strictEqual(scalePow().domain([0, 9]).tickFormat(100, "r")(2.11e6), "2100000")
  assert.strictEqual(scalePow().domain([0, 0.9]).tickFormat(10, "p")(0.21), "20%")
  assert.strictEqual(scalePow().domain([0.19, 0.21]).tickFormat(10, "p")(0.201), "20.1%")
})

it("pow.tickFormat(count, specifier) sets the appropriate prefix precision if not specified", () => {
  assert.strictEqual(scalePow().domain([0, 1e6]).tickFormat(10, "$s")(0.51e6), "$0.5M")
  assert.strictEqual(scalePow().domain([0, 1e6]).tickFormat(100, "$s")(0.501e6), "$0.50M")
})

it("pow.copy() returns a copy with changes to the domain are isolated", () => {
  const x = scalePow(),
    y = x.copy()
  x.domain([1, 2])
  assert.deepStrictEqual(y.domain(), [0, 1])
  assert.strictEqual(x(1), 0)
  assert.strictEqual(y(1), 1)
  y.domain([2, 3])
  assert.strictEqual(x(2), 1)
  assert.strictEqual(y(2), 0)
  assert.deepStrictEqual(x.domain(), [1, 2])
  assert.deepStrictEqual(y.domain(), [2, 3])
  const y2 = x.domain([1, 1.9]).copy()
  x.nice(5)
  assert.deepStrictEqual(x.domain(), [1, 2])
  assert.deepStrictEqual(y2.domain(), [1, 1.9])
})

it("pow.copy() returns a copy with changes to the range are isolated", () => {
  const x = scalePow(),
    y = x.copy()
  x.range([1, 2])
  assert.strictEqual(x.invert(1), 0)
  assert.strictEqual(y.invert(1), 1)
  assert.deepStrictEqual(y.range(), [0, 1])
  y.range([2, 3])
  assert.strictEqual(x.invert(2), 1)
  assert.strictEqual(y.invert(2), 0)
  assert.deepStrictEqual(x.range(), [1, 2])
  assert.deepStrictEqual(y.range(), [2, 3])
})

it("pow.copy() returns a copy with changes to the interpolator are isolated", () => {
  const x = scalePow().range(["red", "blue"]),
    y = x.copy(),
    i0 = x.interpolate(),
    i1 = function (a, b) {
      return function () {
        return b
      }
    }
  x.interpolate(i1)
  assert.strictEqual(y.interpolate(), i0)
  assert.strictEqual(x(0.5), "blue")
  assert.strictEqual(y(0.5), "rgb(128, 0, 128)")
})

it("pow.copy() returns a copy with changes to clamping are isolated", () => {
  const x = scalePow().clamp(true),
    y = x.copy()
  x.clamp(false)
  assert.strictEqual(x(2), 2)
  assert.strictEqual(y(2), 1)
  assert.strictEqual(y.clamp(), true)
  y.clamp(false)
  assert.strictEqual(x(2), 2)
  assert.strictEqual(y(2), 2)
  assert.strictEqual(x.clamp(), false)
})

it("pow().clamp(true).invert(x) cannot return a value outside the domain", () => {
  const x = scalePow().exponent(0.5).domain([1, 20]).clamp(true)
  assert.strictEqual(x.invert(0), 1)
  assert.strictEqual(x.invert(1), 20)
})

it("scaleSqrt() is an alias for pow().exponent(0.5)", () => {
  const s = scaleSqrt()
  assert.strictEqual(s.exponent(), 0.5)
  assertInDelta(s(0.5), Math.SQRT1_2, 1e-6)
  assertInDelta(s.invert(Math.SQRT1_2), 0.5, 1e-6)
})
import assert from "assert"
import { scaleQuantile } from "../src/index.js"

it("scaleQuantile() has the expected default", () => {
  const s = scaleQuantile()
  assert.deepStrictEqual(s.domain(), [])
  assert.deepStrictEqual(s.range(), [])
  assert.strictEqual(s.unknown(), undefined)
})

it("quantile(x) uses the R-7 algorithm to compute quantiles", () => {
  const s = scaleQuantile().domain([3, 6, 7, 8, 8, 10, 13, 15, 16, 20]).range([0, 1, 2, 3])
  assert.deepStrictEqual([3, 6, 6.9, 7, 7.1].map(s), [0, 0, 0, 0, 0])
  assert.deepStrictEqual([8, 8.9].map(s), [1, 1])
  assert.deepStrictEqual([9, 9.1, 10, 13].map(s), [2, 2, 2, 2])
  assert.deepStrictEqual([14.9, 15, 15.1, 16, 20].map(s), [3, 3, 3, 3, 3])
  s.domain([3, 6, 7, 8, 8, 9, 10, 13, 15, 16, 20]).range([0, 1, 2, 3])
  assert.deepStrictEqual([3, 6, 6.9, 7, 7.1].map(s), [0, 0, 0, 0, 0])
  assert.deepStrictEqual([8, 8.9].map(s), [1, 1])
  assert.deepStrictEqual([9, 9.1, 10, 13].map(s), [2, 2, 2, 2])
  assert.deepStrictEqual([14.9, 15, 15.1, 16, 20].map(s), [3, 3, 3, 3, 3])
})

it("quantile(x) returns undefined if the input value is NaN", () => {
  const s = scaleQuantile().domain([3, 6, 7, 8, 8, 10, 13, 15, 16, 20]).range([0, 1, 2, 3])
  assert.strictEqual(s(NaN), undefined)
})

it("quantile.domain() values are sorted in ascending order", () => {
  const s = scaleQuantile().domain([6, 3, 7, 8, 8, 13, 20, 15, 16, 10])
  assert.deepStrictEqual(s.domain(), [3, 6, 7, 8, 8, 10, 13, 15, 16, 20])
})

it("quantile.domain() values are coerced to numbers", () => {
  const s = scaleQuantile().domain(["6", "13", "20"])
  assert.deepStrictEqual(s.domain(), [6, 13, 20])
})

it("quantile.domain() accepts an iterable", () => {
  const s = scaleQuantile().domain(new Set([6, 13, 20]))
  assert.deepStrictEqual(s.domain(), [6, 13, 20])
})

it("quantile.domain() values are allowed to be zero", () => {
  const s = scaleQuantile().domain([1, 2, 0, 0, null])
  assert.deepStrictEqual(s.domain(), [0, 0, 1, 2])
})

it("quantile.domain() non-numeric values are ignored", () => {
  const s = scaleQuantile().domain([6, 3, NaN, undefined, 7, 8, 8, 13, null, 20, 15, 16, 10, NaN])
  assert.deepStrictEqual(s.domain(), [3, 6, 7, 8, 8, 10, 13, 15, 16, 20])
})

it("quantile.quantiles() returns the inner thresholds", () => {
  const s = scaleQuantile().domain([3, 6, 7, 8, 8, 10, 13, 15, 16, 20]).range([0, 1, 2, 3])
  assert.deepStrictEqual(s.quantiles(), [7.25, 9, 14.5])
  s.domain([3, 6, 7, 8, 8, 9, 10, 13, 15, 16, 20]).range([0, 1, 2, 3])
  assert.deepStrictEqual(s.quantiles(), [7.5, 9, 14])
})

it("quantile.range() cardinality determines the number of quantiles", () => {
  const s = scaleQuantile().domain([3, 6, 7, 8, 8, 10, 13, 15, 16, 20])
  assert.deepStrictEqual(s.range([0, 1, 2, 3]).quantiles(), [7.25, 9, 14.5])
  assert.deepStrictEqual(s.range([0, 1]).quantiles(), [9])
  assert.deepStrictEqual(s.range([, , , , ,]).quantiles(), [6.8, 8, 11.2, 15.2])
  assert.deepStrictEqual(s.range([, , , , , ,]).quantiles(), [6.5, 8, 9, 13, 15.5])
})

it("quantile.range() accepts an iterable", () => {
  const s = scaleQuantile()
    .domain([3, 6, 7, 8, 8, 10, 13, 15, 16, 20])
    .range(new Set([0, 1, 2, 3]))
  assert.deepStrictEqual(s.range(), [0, 1, 2, 3])
})

it("quantile.range() values are arbitrary", () => {
  const a = {}
  const b = {}
  const c = {}
  const s = scaleQuantile().domain([3, 6, 7, 8, 8, 10, 13, 15, 16, 20]).range([a, b, c, a])
  assert.deepStrictEqual([3, 6, 6.9, 7, 7.1].map(s), [a, a, a, a, a])
  assert.deepStrictEqual([8, 8.9].map(s), [b, b])
  assert.deepStrictEqual([9, 9.1, 10, 13].map(s), [c, c, c, c])
  assert.deepStrictEqual([14.9, 15, 15.1, 16, 20].map(s), [a, a, a, a, a])
})

it("quantile.invertExtent() maps a value in the range to a domain extent", () => {
  const s = scaleQuantile().domain([3, 6, 7, 8, 8, 10, 13, 15, 16, 20]).range([0, 1, 2, 3])
  assert.deepStrictEqual(s.invertExtent(0), [3, 7.25])
  assert.deepStrictEqual(s.invertExtent(1), [7.25, 9])
  assert.deepStrictEqual(s.invertExtent(2), [9, 14.5])
  assert.deepStrictEqual(s.invertExtent(3), [14.5, 20])
})

it("quantile.invertExtent() allows arbitrary range values", () => {
  const a = {}
  const b = {}
  const s = scaleQuantile().domain([3, 6, 7, 8, 8, 10, 13, 15, 16, 20]).range([a, b])
  assert.deepStrictEqual(s.invertExtent(a), [3, 9])
  assert.deepStrictEqual(s.invertExtent(b), [9, 20])
})

it("quantile.invertExtent() returns [NaN, NaN] when the given value is not in the range", () => {
  const s = scaleQuantile().domain([3, 6, 7, 8, 8, 10, 13, 15, 16, 20])
  assert(s.invertExtent(-1).every(isNaN))
  assert(s.invertExtent(0.5).every(isNaN))
  assert(s.invertExtent(2).every(isNaN))
  assert(s.invertExtent("a").every(isNaN))
})

it("quantile.invertExtent() returns the first match if duplicate values exist in the range", () => {
  const s = scaleQuantile().domain([3, 6, 7, 8, 8, 10, 13, 15, 16, 20]).range([0, 1, 2, 0])
  assert.deepStrictEqual(s.invertExtent(0), [3, 7.25])
  assert.deepStrictEqual(s.invertExtent(1), [7.25, 9])
  assert.deepStrictEqual(s.invertExtent(2), [9, 14.5])
})

it("quantile.unknown(value) sets the return value for undefined, null, and NaN input", () => {
  const s = scaleQuantile().domain([3, 6, 7, 8, 8, 10, 13, 15, 16, 20]).range([0, 1, 2, 3]).unknown(-1)
  assert.strictEqual(s(undefined), -1)
  assert.strictEqual(s(null), -1)
  assert.strictEqual(s(NaN), -1)
  assert.strictEqual(s("N/A"), -1)
  assert.strictEqual(s(2), 0)
  assert.strictEqual(s(3), 0)
  assert.strictEqual(s(21), 3)
})
import assert from "assert"
import { range } from "d3-array"
import { scaleQuantize } from "../src/index.js"
import { assertInDelta } from "./asserts.js"

it("scaleQuantize() has the expected defaults", () => {
  const s = scaleQuantize()
  assert.deepStrictEqual(s.domain(), [0, 1])
  assert.deepStrictEqual(s.range(), [0, 1])
  assert.deepStrictEqual(s.thresholds(), [0.5])
  assert.strictEqual(s(0.25), 0)
  assert.strictEqual(s(0.75), 1)
})

it("quantize(value) maps a number to a discrete value in the range", () => {
  const s = scaleQuantize().range([0, 1, 2])
  assert.deepStrictEqual(s.thresholds(), [1 / 3, 2 / 3])
  assert.strictEqual(s(0.0), 0)
  assert.strictEqual(s(0.2), 0)
  assert.strictEqual(s(0.4), 1)
  assert.strictEqual(s(0.6), 1)
  assert.strictEqual(s(0.8), 2)
  assert.strictEqual(s(1.0), 2)
})

it("quantize(value) clamps input values to the domain", () => {
  const a = {}
  const b = {}
  const c = {}
  const s = scaleQuantize().range([a, b, c])
  assert.strictEqual(s(-0.5), a)
  assert.strictEqual(s(+1.5), c)
})

it("quantize.unknown(value) sets the return value for undefined, null, and NaN input", () => {
  const s = scaleQuantize().range([0, 1, 2]).unknown(-1)
  assert.strictEqual(s(undefined), -1)
  assert.strictEqual(s(null), -1)
  assert.strictEqual(s(NaN), -1)
})

it("quantize.domain() coerces domain values to numbers", () => {
  const s = scaleQuantize().domain(["-1.20", "2.40"])
  assert.deepStrictEqual(s.domain(), [-1.2, 2.4])
  assert.strictEqual(s(-1.2), 0)
  assert.strictEqual(s(0.5), 0)
  assert.strictEqual(s(0.7), 1)
  assert.strictEqual(s(2.4), 1)
})

it("quantize.domain() accepts an iterable", () => {
  const s = scaleQuantize().domain(new Set([1, 2]))
  assert.deepStrictEqual(s.domain(), [1, 2])
})

it("quantize.domain() only considers the first and second element of the domain", () => {
  const s = scaleQuantize().domain([-1, 100, 200])
  assert.deepStrictEqual(s.domain(), [-1, 100])
})

it("quantize.range() cardinality determines the degree of quantization", () => {
  const s = scaleQuantize()
  assertInDelta(s.range(range(0, 1.001, 0.001))(1 / 3), 0.333, 1e-6)
  assertInDelta(s.range(range(0, 1.01, 0.01))(1 / 3), 0.33, 1e-6)
  assertInDelta(s.range(range(0, 1.1, 0.1))(1 / 3), 0.3, 1e-6)
  assertInDelta(s.range(range(0, 1.2, 0.2))(1 / 3), 0.4, 1e-6)
  assertInDelta(s.range(range(0, 1.25, 0.25))(1 / 3), 0.25, 1e-6)
  assertInDelta(s.range(range(0, 1.5, 0.5))(1 / 3), 0.5, 1e-6)
  assertInDelta(s.range(range(1))(1 / 3), 0, 1e-6)
})

it("quantize.range() values are arbitrary", () => {
  const a = {}
  const b = {}
  const c = {}
  const s = scaleQuantize().range([a, b, c])
  assert.strictEqual(s(0.0), a)
  assert.strictEqual(s(0.2), a)
  assert.strictEqual(s(0.4), b)
  assert.strictEqual(s(0.6), b)
  assert.strictEqual(s(0.8), c)
  assert.strictEqual(s(1.0), c)
})

it("quantize.invertExtent() maps a value in the range to a domain extent", () => {
  const s = scaleQuantize().range([0, 1, 2, 3])
  assert.deepStrictEqual(s.invertExtent(0), [0.0, 0.25])
  assert.deepStrictEqual(s.invertExtent(1), [0.25, 0.5])
  assert.deepStrictEqual(s.invertExtent(2), [0.5, 0.75])
  assert.deepStrictEqual(s.invertExtent(3), [0.75, 1.0])
})

it("quantize.invertExtent() allows arbitrary range values", () => {
  const a = {}
  const b = {}
  const s = scaleQuantize().range([a, b])
  assert.deepStrictEqual(s.invertExtent(a), [0.0, 0.5])
  assert.deepStrictEqual(s.invertExtent(b), [0.5, 1.0])
})

it("quantize.invertExtent() returns [NaN, NaN] when the given value is not in the range", () => {
  const s = scaleQuantize()
  assert(s.invertExtent(-1).every(Number.isNaN))
  assert(s.invertExtent(0.5).every(Number.isNaN))
  assert(s.invertExtent(2).every(Number.isNaN))
  assert(s.invertExtent("a").every(Number.isNaN))
})

it("quantize.invertExtent() returns the first match if duplicate values exist in the range", () => {
  const s = scaleQuantize().range([0, 1, 2, 0])
  assert.deepStrictEqual(s.invertExtent(0), [0.0, 0.25])
  assert.deepStrictEqual(s.invertExtent(1), [0.25, 0.5])
})

it("quantize.invertExtent(y) is exactly consistent with quantize(x)", () => {
  const s = scaleQuantize().domain([4.2, 6.2]).range(range(10))
  s.range().forEach(function (y) {
    const e = s.invertExtent(y)
    assert.strictEqual(s(e[0]), y)
    assert.strictEqual(s(e[1]), y < 9 ? y + 1 : y)
  })
})
import assert from "assert"
import { scaleRadial } from "../src/index.js"

it("scaleRadial() has the expected defaults", () => {
  const s = scaleRadial()
  assert.deepStrictEqual(s.domain(), [0, 1])
  assert.deepStrictEqual(s.range(), [0, 1])
  assert.strictEqual(s.clamp(), false)
  assert.strictEqual(s.round(), false)
})

it("scaleRadial(range) sets the range", () => {
  const s = scaleRadial([100, 200])
  assert.deepStrictEqual(s.domain(), [0, 1])
  assert.deepStrictEqual(s.range(), [100, 200])
  assert.strictEqual(s(0.5), 158.11388300841898)
})

it("scaleRadial(domain, range) sets the range", () => {
  const s = scaleRadial([1, 2], [10, 20])
  assert.deepStrictEqual(s.domain(), [1, 2])
  assert.deepStrictEqual(s.range(), [10, 20])
  assert.strictEqual(s(1.5), 15.811388300841896)
})

it("radial(x) maps a domain value x to a range value y", () => {
  assert.strictEqual(scaleRadial([1, 2])(0.5), 1.5811388300841898)
})

it("radial(x) ignores extra range values if the domain is smaller than the range", () => {
  assert.strictEqual(scaleRadial().domain([-10, 0]).range([2, 3, 4]).clamp(true)(-5), 2.5495097567963922)
  assert.strictEqual(scaleRadial().domain([-10, 0]).range([2, 3, 4]).clamp(true)(50), 3)
})

it("radial(x) ignores extra domain values if the range is smaller than the domain", () => {
  assert.strictEqual(scaleRadial().domain([-10, 0, 100]).range([2, 3]).clamp(true)(-5), 2.5495097567963922)
  assert.strictEqual(scaleRadial().domain([-10, 0, 100]).range([2, 3]).clamp(true)(50), 3)
})

it("radial(x) maps an empty domain to the middle of the range", () => {
  assert.strictEqual(scaleRadial().domain([0, 0]).range([1, 2])(0), 1.5811388300841898)
  assert.strictEqual(scaleRadial().domain([0, 0]).range([2, 1])(1), 1.5811388300841898)
})

it("radial(x) can map a bilinear domain with two values to the corresponding range", () => {
  const s = scaleRadial().domain([1, 2])
  assert.deepStrictEqual(s.domain(), [1, 2])
  assert.strictEqual(s(0.5), -0.7071067811865476)
  assert.strictEqual(s(1.0), 0.0)
  assert.strictEqual(s(1.5), 0.7071067811865476)
  assert.strictEqual(s(2.0), 1.0)
  assert.strictEqual(s(2.5), 1.224744871391589)
  assert.strictEqual(s.invert(-0.5), 0.75)
  assert.strictEqual(s.invert(0.0), 1.0)
  assert.strictEqual(s.invert(0.5), 1.25)
  assert.strictEqual(s.invert(1.0), 2.0)
  assert.strictEqual(s.invert(1.5), 3.25)
})

it("radial(NaN) returns undefined", () => {
  const s = scaleRadial()
  assert.strictEqual(s(NaN), undefined)
  assert.strictEqual(s(undefined), undefined)
  assert.strictEqual(s("foo"), undefined)
  assert.strictEqual(s({}), undefined)
})

it("radial.unknown(unknown)(NaN) returns the specified unknown value", () => {
  assert.strictEqual(scaleRadial().unknown("foo")(NaN), "foo")
})

it("radial(x) can handle a negative range", () => {
  assert.strictEqual(scaleRadial([-1, -2])(0.5), -1.5811388300841898)
})

it("radial(x) can clamp negative values", () => {
  assert.strictEqual(scaleRadial([-1, -2]).clamp(true)(-0.5), -1)
  assert.strictEqual(scaleRadial().clamp(true)(-0.5), 0)
  assert.strictEqual(scaleRadial([-0.25, 0], [1, 2]).clamp(true)(-0.5), 1)
})
export function roundEpsilon(x) {
  return Math.round(x * 1e12) / 1e12
}
import assert from "assert"
import { scaleSequential } from "../src/index.js"

it("scaleSequential() has the expected defaults", () => {
  const s = scaleSequential()
  assert.deepStrictEqual(s.domain(), [0, 1])
  assert.strictEqual(s.interpolator()(0.42), 0.42)
  assert.strictEqual(s.clamp(), false)
  assert.strictEqual(s.unknown(), undefined)
  assert.strictEqual(s(-0.5), -0.5)
  assert.strictEqual(s(0.0), 0.0)
  assert.strictEqual(s(0.5), 0.5)
  assert.strictEqual(s(1.0), 1.0)
  assert.strictEqual(s(1.5), 1.5)
})

it("sequential.clamp(true) enables clamping", () => {
  const s = scaleSequential().clamp(true)
  assert.strictEqual(s.clamp(), true)
  assert.strictEqual(s(-0.5), 0.0)
  assert.strictEqual(s(0.0), 0.0)
  assert.strictEqual(s(0.5), 0.5)
  assert.strictEqual(s(1.0), 1.0)
  assert.strictEqual(s(1.5), 1.0)
})

it("sequential.unknown(value) sets the return value for undefined and NaN input", () => {
  const s = scaleSequential().unknown(-1)
  assert.strictEqual(s.unknown(), -1)
  assert.strictEqual(s(undefined), -1)
  assert.strictEqual(s(NaN), -1)
  assert.strictEqual(s("N/A"), -1)
  assert.strictEqual(s(0.4), 0.4)
})

it("sequential.domain() coerces domain values to numbers", () => {
  const s = scaleSequential().domain(["-1.20", "2.40"])
  assert.deepStrictEqual(s.domain(), [-1.2, 2.4])
  assert.strictEqual(s(-1.2), 0.0)
  assert.strictEqual(s(0.6), 0.5)
  assert.strictEqual(s(2.4), 1.0)
})

it("sequential.domain() accepts an iterable", () => {
  const s = scaleSequential().domain(new Set(["-1.20", "2.40"]))
  assert.deepStrictEqual(s.domain(), [-1.2, 2.4])
})

it("sequential.domain() handles a degenerate domain", () => {
  const s = scaleSequential().domain([2, 2])
  assert.deepStrictEqual(s.domain(), [2, 2])
  assert.strictEqual(s(-1.2), 0.5)
  assert.strictEqual(s(0.6), 0.5)
  assert.strictEqual(s(2.4), 0.5)
})

it("sequential.domain() handles a non-numeric domain", () => {
  const s = scaleSequential().domain([NaN, 2])
  assert.strictEqual(isNaN(s.domain()[0]), true)
  assert.strictEqual(s.domain()[1], 2)
  assert.strictEqual(isNaN(s(-1.2)), true)
  assert.strictEqual(isNaN(s(0.6)), true)
  assert.strictEqual(isNaN(s(2.4)), true)
})

it("sequential.domain() only considers the first and second element of the domain", () => {
  const s = scaleSequential().domain([-1, 100, 200])
  assert.deepStrictEqual(s.domain(), [-1, 100])
})

it("sequential.copy() returns an isolated copy of the scale", () => {
  const s1 = scaleSequential().domain([1, 3]).clamp(true)
  const s2 = s1.copy()
  assert.deepStrictEqual(s2.domain(), [1, 3])
  assert.strictEqual(s2.clamp(), true)
  s1.domain([-1, 2])
  assert.deepStrictEqual(s2.domain(), [1, 3])
  s1.clamp(false)
  assert.strictEqual(s2.clamp(), true)
  s2.domain([3, 4])
  assert.deepStrictEqual(s1.domain(), [-1, 2])
  s2.clamp(true)
  assert.deepStrictEqual(s1.clamp(), false)
})

it("sequential.interpolator(interpolator) sets the interpolator", () => {
  const i0 = function (t) {
    return t
  }
  const i1 = function (t) {
    return t * 2
  }
  const s = scaleSequential(i0)
  assert.strictEqual(s.interpolator(), i0)
  assert.strictEqual(s.interpolator(i1), s)
  assert.strictEqual(s.interpolator(), i1)
  assert.strictEqual(s(-0.5), -1.0)
  assert.strictEqual(s(0.0), 0.0)
  assert.strictEqual(s(0.5), 1.0)
})

it("sequential.range() returns the computed range", () => {
  const s = scaleSequential(function (t) {
    return t * 2 + 1
  })
  assert.deepStrictEqual(s.range(), [1, 3])
})

it("sequential.range(range) sets the interpolator", () => {
  const s = scaleSequential().range([1, 3])
  assert.strictEqual(s.interpolator()(0.5), 2)
  assert.deepStrictEqual(s.range(), [1, 3])
})

it("sequential.range(range) ignores additional values", () => {
  const s = scaleSequential().range([1, 3, 10])
  assert.strictEqual(s.interpolator()(0.5), 2)
  assert.deepStrictEqual(s.range(), [1, 3])
})

it("scaleSequential(range) sets the interpolator", () => {
  const s = scaleSequential([1, 3])
  assert.strictEqual(s.interpolator()(0.5), 2)
  assert.deepStrictEqual(s.range(), [1, 3])
})
import assert from "assert"
import { scaleSequentialQuantile } from "../src/index.js"

it("sequentialQuantile() clamps", () => {
  const s = scaleSequentialQuantile().domain([0, 1, 2, 3, 10])
  assert.strictEqual(s(-1), 0)
  assert.strictEqual(s(0), 0)
  assert.strictEqual(s(1), 0.25)
  assert.strictEqual(s(10), 1)
  assert.strictEqual(s(20), 1)
})

it("sequentialQuantile().domain() sorts the domain", () => {
  const s = scaleSequentialQuantile().domain([0, 2, 9, 0.1, 10])
  assert.deepStrictEqual(s.domain(), [0, 0.1, 2, 9, 10])
})

it("sequentialQuantile().range() returns the computed range", () => {
  const s = scaleSequentialQuantile().domain([0, 2, 9, 0.1, 10])
  assert.deepStrictEqual(s.range(), [0 / 4, 1 / 4, 2 / 4, 3 / 4, 4 / 4])
})

it("sequentialQuantile().quantiles(n) computes n + 1 quantiles", () => {
  const s = scaleSequentialQuantile().domain(Array.from({ length: 2000 }, (_, i) => (2 * i) / 1999))
  assert.deepStrictEqual(s.quantiles(4), [0, 0.5, 1, 1.5, 2])
})
import assert from "assert"
import { scaleSqrt } from "../src/index.js"

it("scaleSqrt() has the expected defaults", () => {
  const s = scaleSqrt()
  assert.deepStrictEqual(s.domain(), [0, 1])
  assert.deepStrictEqual(s.range(), [0, 1])
  assert.strictEqual(s.clamp(), false)
  assert.strictEqual(s.exponent(), 0.5)
  assert.deepStrictEqual(s.interpolate()({ array: ["red"] }, { array: ["blue"] })(0.5), { array: ["rgb(128, 0, 128)"] })
})

it("sqrt(x) maps a domain value x to a range value y", () => {
  assert.strictEqual(scaleSqrt()(0.5), Math.SQRT1_2)
})
import assert from "assert"
import { scaleSymlog } from "../src/index.js"
import { assertInDelta } from "./asserts.js"

it("scaleSymlog() has the expected defaults", () => {
  const s = scaleSymlog()
  assert.deepStrictEqual(s.domain(), [0, 1])
  assert.deepStrictEqual(s.range(), [0, 1])
  assert.strictEqual(s.clamp(), false)
  assert.strictEqual(s.constant(), 1)
})

it("symlog(x) maps a domain value x to a range value y", () => {
  const s = scaleSymlog().domain([-100, 100])
  assert.strictEqual(s(-100), 0)
  assert.strictEqual(s(100), 1)
  assert.strictEqual(s(0), 0.5)
})

it("symlog.invert(y) maps a range value y to a domain value x", () => {
  const s = scaleSymlog().domain([-100, 100])
  assertInDelta(s.invert(1), 100)
})

it("symlog.invert(y) coerces range values to numbers", () => {
  const s = scaleSymlog().range(["-3", "3"])
  assert.deepStrictEqual(s.invert(3), 1)
})

it("symlog.invert(y) returns NaN if the range is not coercible to number", () => {
  assert(isNaN(scaleSymlog().range(["#000", "#fff"]).invert("#999")))
  assert(isNaN(scaleSymlog().range([0, "#fff"]).invert("#999")))
})

it("symlog.constant(constant) sets the constant to the specified value", () => {
  const s = scaleSymlog().constant(5)
  assert.strictEqual(s.constant(), 5)
})

it("symlog.constant(constant) changing the constant does not change the domain or range", () => {
  const s = scaleSymlog().constant(2)
  assert.deepStrictEqual(s.domain(), [0, 1])
  assert.deepStrictEqual(s.range(), [0, 1])
})

it("symlog.domain(domain) accepts an array of numbers", () => {
  assert.deepStrictEqual(scaleSymlog().domain([]).domain(), [])
  assert.deepStrictEqual(scaleSymlog().domain([1, 0]).domain(), [1, 0])
  assert.deepStrictEqual(scaleSymlog().domain([1, 2, 3]).domain(), [1, 2, 3])
})

it("symlog.domain(domain) coerces domain values to numbers", () => {
  assert.deepStrictEqual(
    scaleSymlog()
      .domain([new Date(Date.UTC(1990, 0, 1)), new Date(Date.UTC(1991, 0, 1))])
      .domain(),
    [631152000000, 662688000000]
  )
  assert.deepStrictEqual(scaleSymlog().domain(["0.0", "1.0"]).domain(), [0, 1])
  assert.deepStrictEqual(
    scaleSymlog()
      .domain([new Number(0), new Number(1)])
      .domain(),
    [0, 1]
  )
})

it("symlog.domain(domain) makes a copy of domain values", () => {
  const d = [1, 2],
    s = scaleSymlog().domain(d)
  assert.deepStrictEqual(s.domain(), [1, 2])
  d.push(3)
  assert.deepStrictEqual(s.domain(), [1, 2])
  assert.deepStrictEqual(d, [1, 2, 3])
})

it("symlog.domain() returns a copy of domain values", () => {
  const s = scaleSymlog(),
    d = s.domain()
  assert.deepStrictEqual(d, [0, 1])
  d.push(3)
  assert.deepStrictEqual(s.domain(), [0, 1])
})

it("symlog.range(range) does not coerce range to numbers", () => {
  const s = scaleSymlog().range(["0px", "2px"])
  assert.deepStrictEqual(s.range(), ["0px", "2px"])
  assert.strictEqual(s(1), "2px")
})

it("symlog.range(range) can accept range values as arrays or objects", () => {
  assert.deepStrictEqual(scaleSymlog().range([{ color: "red" }, { color: "blue" }])(1), { color: "rgb(0, 0, 255)" })
  assert.deepStrictEqual(scaleSymlog().range([["red"], ["blue"]])(0), ["rgb(255, 0, 0)"])
})

it("symlog.range(range) makes a copy of range values", () => {
  const r = [1, 2],
    s = scaleSymlog().range(r)
  assert.deepStrictEqual(s.range(), [1, 2])
  r.push(3)
  assert.deepStrictEqual(s.range(), [1, 2])
  assert.deepStrictEqual(r, [1, 2, 3])
})

it("symlog.range() returns a copy of range values", () => {
  const s = scaleSymlog(),
    r = s.range()
  assert.deepStrictEqual(r, [0, 1])
  r.push(3)
  assert.deepStrictEqual(s.range(), [0, 1])
})

it("symlog.clamp() is false by default", () => {
  assert.strictEqual(scaleSymlog().clamp(), false)
  assert.strictEqual(scaleSymlog().range([10, 20])(3), 30)
  assert.strictEqual(scaleSymlog().range([10, 20])(-1), 0)
  assert.strictEqual(scaleSymlog().range([10, 20]).invert(30), 3)
  assert.strictEqual(scaleSymlog().range([10, 20]).invert(0), -1)
})

it("symlog.clamp(true) restricts output values to the range", () => {
  assert.strictEqual(scaleSymlog().clamp(true).range([10, 20])(2), 20)
  assert.strictEqual(scaleSymlog().clamp(true).range([10, 20])(-1), 10)
})

it("symlog.clamp(true) restricts input values to the domain", () => {
  assert.strictEqual(scaleSymlog().clamp(true).range([10, 20]).invert(30), 1)
  assert.strictEqual(scaleSymlog().clamp(true).range([10, 20]).invert(0), 0)
})

it("symlog.clamp(clamp) coerces the specified clamp value to a boolean", () => {
  assert.strictEqual(scaleSymlog().clamp("true").clamp(), true)
  assert.strictEqual(scaleSymlog().clamp(1).clamp(), true)
  assert.strictEqual(scaleSymlog().clamp("").clamp(), false)
  assert.strictEqual(scaleSymlog().clamp(0).clamp(), false)
})

it("symlog.copy() returns a copy with changes to the domain are isolated", () => {
  const x = scaleSymlog(),
    y = x.copy()
  x.domain([1, 2])
  assert.deepStrictEqual(y.domain(), [0, 1])
  assert.strictEqual(x(1), 0)
  assert.strictEqual(y(1), 1)
  y.domain([2, 3])
  assert.strictEqual(x(2), 1)
  assert.strictEqual(y(2), 0)
  assert.deepStrictEqual(x.domain(), [1, 2])
  assert.deepStrictEqual(y.domain(), [2, 3])
  const y2 = x.domain([1, 1.9]).copy()
  x.nice(5)
  assert.deepStrictEqual(x.domain(), [1, 2])
  assert.deepStrictEqual(y2.domain(), [1, 1.9])
})

it("symlog.copy() returns a copy with changes to the range are isolated", () => {
  const x = scaleSymlog(),
    y = x.copy()
  x.range([1, 2])
  assert.strictEqual(x.invert(1), 0)
  assert.strictEqual(y.invert(1), 1)
  assert.deepStrictEqual(y.range(), [0, 1])
  y.range([2, 3])
  assert.strictEqual(x.invert(2), 1)
  assert.strictEqual(y.invert(2), 0)
  assert.deepStrictEqual(x.range(), [1, 2])
  assert.deepStrictEqual(y.range(), [2, 3])
})

it("symlog.copy() returns a copy with changes to clamping are isolated", () => {
  const x = scaleSymlog().clamp(true),
    y = x.copy()
  x.clamp(false)
  assert.strictEqual(x(3), 2)
  assert.strictEqual(y(2), 1)
  assert.strictEqual(y.clamp(), true)
  y.clamp(false)
  assert.strictEqual(x(3), 2)
  assert.strictEqual(y(3), 2)
  assert.strictEqual(x.clamp(), false)
})

it("symlog().clamp(true).invert(x) cannot return a value outside the domain", () => {
  const x = scaleSymlog().domain([1, 20]).clamp(true)
  assert.strictEqual(x.invert(0), 1)
  assert.strictEqual(x.invert(1), 20)
})
import assert from "assert"
import { scaleThreshold } from "../src/index.js"

it("scaleThreshold() has the expected defaults", () => {
  const x = scaleThreshold()
  assert.deepStrictEqual(x.domain(), [0.5])
  assert.deepStrictEqual(x.range(), [0, 1])
  assert.strictEqual(x(0.5), 1)
  assert.strictEqual(x(0.49), 0)
})

it("threshold(x) maps a number to a discrete value in the range", () => {
  const x = scaleThreshold()
    .domain([1 / 3, 2 / 3])
    .range(["a", "b", "c"])
  assert.strictEqual(x(0), "a")
  assert.strictEqual(x(0.2), "a")
  assert.strictEqual(x(0.4), "b")
  assert.strictEqual(x(0.6), "b")
  assert.strictEqual(x(0.8), "c")
  assert.strictEqual(x(1), "c")
})

it("threshold(x) returns undefined if the specified value x is not orderable", () => {
  const x = scaleThreshold()
    .domain([1 / 3, 2 / 3])
    .range(["a", "b", "c"])
  assert.strictEqual(x(), undefined)
  assert.strictEqual(x(undefined), undefined)
  assert.strictEqual(x(NaN), undefined)
  assert.strictEqual(x(null), undefined)
})

it("threshold.domain(…) supports arbitrary orderable values", () => {
  const x = scaleThreshold().domain(["10", "2"]).range([0, 1, 2])
  assert.strictEqual(x.domain()[0], "10")
  assert.strictEqual(x.domain()[1], "2")
  assert.strictEqual(x("0"), 0)
  assert.strictEqual(x("12"), 1)
  assert.strictEqual(x("3"), 2)
})

it("threshold.domain(…) accepts an iterable", () => {
  const x = scaleThreshold()
    .domain(new Set(["10", "2"]))
    .range([0, 1, 2])
  assert.deepStrictEqual(x.domain(), ["10", "2"])
})

it("threshold.range(…) supports arbitrary values", () => {
  const a = {},
    b = {},
    c = {},
    x = scaleThreshold()
      .domain([1 / 3, 2 / 3])
      .range([a, b, c])
  assert.strictEqual(x(0), a)
  assert.strictEqual(x(0.2), a)
  assert.strictEqual(x(0.4), b)
  assert.strictEqual(x(0.6), b)
  assert.strictEqual(x(0.8), c)
  assert.strictEqual(x(1), c)
})

it("threshold.range(…) accepts an iterable", () => {
  const x = scaleThreshold()
    .domain(["10", "2"])
    .range(new Set([0, 1, 2]))
  assert.deepStrictEqual(x.range(), [0, 1, 2])
})

it("threshold.invertExtent(y) returns the domain extent for the specified range value", () => {
  const a = {},
    b = {},
    c = {},
    x = scaleThreshold()
      .domain([1 / 3, 2 / 3])
      .range([a, b, c])
  assert.deepStrictEqual(x.invertExtent(a), [undefined, 1 / 3])
  assert.deepStrictEqual(x.invertExtent(b), [1 / 3, 2 / 3])
  assert.deepStrictEqual(x.invertExtent(c), [2 / 3, undefined])
  assert.deepStrictEqual(x.invertExtent({}), [undefined, undefined])
})
import assert from "assert"
import { tickFormat } from "../src/index.js"

it("tickFormat(start, stop, count) returns a format suitable for the ticks", () => {
  assert.strictEqual(tickFormat(0, 1, 10)(0.2), "0.2")
  assert.strictEqual(tickFormat(0, 1, 20)(0.2), "0.20")
  assert.strictEqual(tickFormat(-100, 100, 10)(-20), "−20")
})

it("tickFormat(start, stop, count, specifier) sets the appropriate fixed precision if not specified", () => {
  assert.strictEqual(tickFormat(0, 1, 10, "+f")(0.2), "+0.2")
  assert.strictEqual(tickFormat(0, 1, 20, "+f")(0.2), "+0.20")
  assert.strictEqual(tickFormat(0, 1, 10, "+%")(0.2), "+20%")
  assert.strictEqual(tickFormat(0.19, 0.21, 10, "+%")(0.2), "+20.0%")
})

it("tickFormat(start, stop, count, specifier) sets the appropriate round precision if not specified", () => {
  assert.strictEqual(tickFormat(0, 9, 10, "")(2.1), "2")
  assert.strictEqual(tickFormat(0, 9, 100, "")(2.01), "2")
  assert.strictEqual(tickFormat(0, 9, 100, "")(2.11), "2.1")
  assert.strictEqual(tickFormat(0, 9, 10, "e")(2.1), "2e+0")
  assert.strictEqual(tickFormat(0, 9, 100, "e")(2.01), "2.0e+0")
  assert.strictEqual(tickFormat(0, 9, 100, "e")(2.11), "2.1e+0")
  assert.strictEqual(tickFormat(0, 9, 10, "g")(2.1), "2")
  assert.strictEqual(tickFormat(0, 9, 100, "g")(2.01), "2.0")
  assert.strictEqual(tickFormat(0, 9, 100, "g")(2.11), "2.1")
  assert.strictEqual(tickFormat(0, 9, 10, "r")(2.1e6), "2000000")
  assert.strictEqual(tickFormat(0, 9, 100, "r")(2.01e6), "2000000")
  assert.strictEqual(tickFormat(0, 9, 100, "r")(2.11e6), "2100000")
  assert.strictEqual(tickFormat(0, 0.9, 10, "p")(0.21), "20%")
  assert.strictEqual(tickFormat(0.19, 0.21, 10, "p")(0.201), "20.1%")
})

it("tickFormat(start, stop, count, specifier) sets the appropriate prefix precision if not specified", () => {
  assert.strictEqual(tickFormat(0, 1e6, 10, "$s")(0.51e6), "$0.5M")
  assert.strictEqual(tickFormat(0, 1e6, 100, "$s")(0.501e6), "$0.50M")
})

it("tickFormat(start, stop, count) uses the default precision when the domain is invalid", () => {
  const f = tickFormat(0, NaN, 10)
  assert.strictEqual(f + "", " >-,f")
  assert.strictEqual(f(0.12), "0.120000")
})
import assert from "assert"
import { interpolateHsl } from "d3-interpolate"
import { timeDay, timeMinute, timeMonth, timeWeek, timeYear } from "d3-time"
import { scaleTime } from "../src/index.js"
import { local } from "./date.js"

it("time.domain([-1e50, 1e50]) is equivalent to time.domain([NaN, NaN])", () => {
  const x = scaleTime().domain([-1e50, 1e50])
  assert.strictEqual(isNaN(x.domain()[0]), true) // Note: also coerced on retrieval, so insufficient test!
  assert.strictEqual(isNaN(x.domain()[1]), true)
  assert.deepStrictEqual(x.ticks(10), [])
})

it("time.domain(domain) accepts an iterable", () => {
  const x = scaleTime().domain(new Set([local(2009), local(2010)]))
  assert.deepStrictEqual(x.domain(), [local(2009), local(2010)])
})

it("time.nice() is an alias for time.nice(10)", () => {
  const x = scaleTime().domain([local(2009, 0, 1, 0, 17), local(2009, 0, 1, 23, 42)])
  assert.deepStrictEqual(x.nice().domain(), [local(2009, 0, 1), local(2009, 0, 2)])
})

it("time.nice() can nice sub-second domains", () => {
  const x = scaleTime().domain([local(2013, 0, 1, 12, 0, 0, 0), local(2013, 0, 1, 12, 0, 0, 128)])
  assert.deepStrictEqual(x.nice().domain(), [local(2013, 0, 1, 12, 0, 0, 0), local(2013, 0, 1, 12, 0, 0, 130)])
})

it("time.nice() can nice multi-year domains", () => {
  const x = scaleTime().domain([local(2001, 0, 1), local(2138, 0, 1)])
  assert.deepStrictEqual(x.nice().domain(), [local(2000, 0, 1), local(2140, 0, 1)])
})

it("time.nice() can nice empty domains", () => {
  const x = scaleTime().domain([local(2009, 0, 1, 0, 12), local(2009, 0, 1, 0, 12)])
  assert.deepStrictEqual(x.nice().domain(), [local(2009, 0, 1, 0, 12), local(2009, 0, 1, 0, 12)])
})

it("time.nice(count) nices using the specified tick count", () => {
  const x = scaleTime().domain([local(2009, 0, 1, 0, 17), local(2009, 0, 1, 23, 42)])
  assert.deepStrictEqual(x.nice(100).domain(), [local(2009, 0, 1, 0, 15), local(2009, 0, 1, 23, 45)])
  assert.deepStrictEqual(x.nice(10).domain(), [local(2009, 0, 1), local(2009, 0, 2)])
})

it("time.nice(interval) nices using the specified time interval", () => {
  const x = scaleTime().domain([local(2009, 0, 1, 0, 12), local(2009, 0, 1, 23, 48)])
  assert.deepStrictEqual(x.nice(timeDay).domain(), [local(2009, 0, 1), local(2009, 0, 2)])
  assert.deepStrictEqual(x.nice(timeWeek).domain(), [local(2008, 11, 28), local(2009, 0, 4)])
  assert.deepStrictEqual(x.nice(timeMonth).domain(), [local(2008, 11, 1), local(2009, 1, 1)])
  assert.deepStrictEqual(x.nice(timeYear).domain(), [local(2008, 0, 1), local(2010, 0, 1)])
})

it("time.nice(interval) can nice empty domains", () => {
  const x = scaleTime().domain([local(2009, 0, 1, 0, 12), local(2009, 0, 1, 0, 12)])
  assert.deepStrictEqual(x.nice(timeDay).domain(), [local(2009, 0, 1), local(2009, 0, 2)])
})

it("time.nice(interval) can nice a polylinear domain, only affecting its extent", () => {
  const x = scaleTime()
    .domain([local(2009, 0, 1, 0, 12), local(2009, 0, 1, 23, 48), local(2009, 0, 2, 23, 48)])
    .nice(timeDay)
  assert.deepStrictEqual(x.domain(), [local(2009, 0, 1), local(2009, 0, 1, 23, 48), local(2009, 0, 3)])
})

it("time.nice(interval.every(step)) nices using the specified time interval and step", () => {
  const x = scaleTime().domain([local(2009, 0, 1, 0, 12), local(2009, 0, 1, 23, 48)])
  assert.deepStrictEqual(x.nice(timeDay.every(3)).domain(), [local(2009, 0, 1), local(2009, 0, 4)])
  assert.deepStrictEqual(x.nice(timeWeek.every(2)).domain(), [local(2008, 11, 21), local(2009, 0, 4)])
  assert.deepStrictEqual(x.nice(timeMonth.every(3)).domain(), [local(2008, 9, 1), local(2009, 3, 1)])
  assert.deepStrictEqual(x.nice(timeYear.every(10)).domain(), [local(2000, 0, 1), local(2010, 0, 1)])
})

it("time.copy() isolates changes to the domain", () => {
  const x = scaleTime().domain([local(2009, 0, 1), local(2010, 0, 1)]),
    y = x.copy()
  x.domain([local(2010, 0, 1), local(2011, 0, 1)])
  assert.deepStrictEqual(y.domain(), [local(2009, 0, 1), local(2010, 0, 1)])
  assert.strictEqual(x(local(2010, 0, 1)), 0)
  assert.strictEqual(y(local(2010, 0, 1)), 1)
  y.domain([local(2011, 0, 1), local(2012, 0, 1)])
  assert.strictEqual(x(local(2011, 0, 1)), 1)
  assert.strictEqual(y(local(2011, 0, 1)), 0)
  assert.deepStrictEqual(x.domain(), [local(2010, 0, 1), local(2011, 0, 1)])
  assert.deepStrictEqual(y.domain(), [local(2011, 0, 1), local(2012, 0, 1)])
})

it("time.copy() isolates changes to the range", () => {
  const x = scaleTime().domain([local(2009, 0, 1), local(2010, 0, 1)]),
    y = x.copy()
  x.range([1, 2])
  assert.deepStrictEqual(x.invert(1), local(2009, 0, 1))
  assert.deepStrictEqual(y.invert(1), local(2010, 0, 1))
  assert.deepStrictEqual(y.range(), [0, 1])
  y.range([2, 3])
  assert.deepStrictEqual(x.invert(2), local(2010, 0, 1))
  assert.deepStrictEqual(y.invert(2), local(2009, 0, 1))
  assert.deepStrictEqual(x.range(), [1, 2])
  assert.deepStrictEqual(y.range(), [2, 3])
})

it("time.copy() isolates changes to the interpolator", () => {
  const x = scaleTime()
      .domain([local(2009, 0, 1), local(2010, 0, 1)])
      .range(["red", "blue"]),
    i = x.interpolate(),
    y = x.copy()
  x.interpolate(interpolateHsl)
  assert.strictEqual(x(local(2009, 6, 1)), "rgb(255, 0, 253)")
  assert.strictEqual(y(local(2009, 6, 1)), "rgb(129, 0, 126)")
  assert.strictEqual(y.interpolate(), i)
})

it("time.copy() isolates changes to clamping", () => {
  const x = scaleTime()
      .domain([local(2009, 0, 1), local(2010, 0, 1)])
      .clamp(true),
    y = x.copy()
  x.clamp(false)
  assert.strictEqual(x(local(2011, 0, 1)), 2)
  assert.strictEqual(y(local(2011, 0, 1)), 1)
  assert.strictEqual(y.clamp(), true)
  y.clamp(false)
  assert.strictEqual(x(local(2011, 0, 1)), 2)
  assert.strictEqual(y(local(2011, 0, 1)), 2)
  assert.strictEqual(x.clamp(), false)
})

it("time.clamp(true).invert(value) never returns a value outside the domain", () => {
  const x = scaleTime().clamp(true)
  assert(x.invert(0) instanceof Date)
  assert(x.invert(0) !== x.invert(0)) // returns a distinct copy
  assert.strictEqual(+x.invert(-1), +x.domain()[0])
  assert.strictEqual(+x.invert(0), +x.domain()[0])
  assert.strictEqual(+x.invert(1), +x.domain()[1])
  assert.strictEqual(+x.invert(2), +x.domain()[1])
})

it("time.ticks(interval) observes the specified tick interval", () => {
  const x = scaleTime().domain([local(2011, 0, 1, 12, 1, 0), local(2011, 0, 1, 12, 4, 4)])
  assert.deepStrictEqual(x.ticks(timeMinute), [
    local(2011, 0, 1, 12, 1),
    local(2011, 0, 1, 12, 2),
    local(2011, 0, 1, 12, 3),
    local(2011, 0, 1, 12, 4),
  ])
})

it("time.ticks(interval.every(step)) observes the specified tick interval and step", () => {
  const x = scaleTime().domain([local(2011, 0, 1, 12, 0, 0), local(2011, 0, 1, 12, 33, 4)])
  assert.deepStrictEqual(x.ticks(timeMinute.every(10)), [
    local(2011, 0, 1, 12, 0),
    local(2011, 0, 1, 12, 10),
    local(2011, 0, 1, 12, 20),
    local(2011, 0, 1, 12, 30),
  ])
})

it("time.ticks(count) can generate sub-second ticks", () => {
  const x = scaleTime().domain([local(2011, 0, 1, 12, 0, 0), local(2011, 0, 1, 12, 0, 1)])
  assert.deepStrictEqual(x.ticks(4), [
    local(2011, 0, 1, 12, 0, 0, 0),
    local(2011, 0, 1, 12, 0, 0, 200),
    local(2011, 0, 1, 12, 0, 0, 400),
    local(2011, 0, 1, 12, 0, 0, 600),
    local(2011, 0, 1, 12, 0, 0, 800),
    local(2011, 0, 1, 12, 0, 1, 0),
  ])
})

it("time.ticks(count) can generate 1-second ticks", () => {
  const x = scaleTime().domain([local(2011, 0, 1, 12, 0, 0), local(2011, 0, 1, 12, 0, 4)])
  assert.deepStrictEqual(x.ticks(4), [
    local(2011, 0, 1, 12, 0, 0),
    local(2011, 0, 1, 12, 0, 1),
    local(2011, 0, 1, 12, 0, 2),
    local(2011, 0, 1, 12, 0, 3),
    local(2011, 0, 1, 12, 0, 4),
  ])
})

it("time.ticks(count) can generate 5-second ticks", () => {
  const x = scaleTime().domain([local(2011, 0, 1, 12, 0, 0), local(2011, 0, 1, 12, 0, 20)])
  assert.deepStrictEqual(x.ticks(4), [
    local(2011, 0, 1, 12, 0, 0),
    local(2011, 0, 1, 12, 0, 5),
    local(2011, 0, 1, 12, 0, 10),
    local(2011, 0, 1, 12, 0, 15),
    local(2011, 0, 1, 12, 0, 20),
  ])
})

it("time.ticks(count) can generate 15-second ticks", () => {
  const x = scaleTime().domain([local(2011, 0, 1, 12, 0, 0), local(2011, 0, 1, 12, 0, 50)])
  assert.deepStrictEqual(x.ticks(4), [
    local(2011, 0, 1, 12, 0, 0),
    local(2011, 0, 1, 12, 0, 15),
    local(2011, 0, 1, 12, 0, 30),
    local(2011, 0, 1, 12, 0, 45),
  ])
})

it("time.ticks(count) can generate 30-second ticks", () => {
  const x = scaleTime().domain([local(2011, 0, 1, 12, 0, 0), local(2011, 0, 1, 12, 1, 50)])
  assert.deepStrictEqual(x.ticks(4), [
    local(2011, 0, 1, 12, 0, 0),
    local(2011, 0, 1, 12, 0, 30),
    local(2011, 0, 1, 12, 1, 0),
    local(2011, 0, 1, 12, 1, 30),
  ])
})

it("time.ticks(count) can generate 1-minute ticks", () => {
  const x = scaleTime().domain([local(2011, 0, 1, 12, 0, 27), local(2011, 0, 1, 12, 4, 12)])
  assert.deepStrictEqual(x.ticks(4), [
    local(2011, 0, 1, 12, 1),
    local(2011, 0, 1, 12, 2),
    local(2011, 0, 1, 12, 3),
    local(2011, 0, 1, 12, 4),
  ])
})

it("time.ticks(count) can generate 5-minute ticks", () => {
  const x = scaleTime().domain([local(2011, 0, 1, 12, 3, 27), local(2011, 0, 1, 12, 21, 12)])
  assert.deepStrictEqual(x.ticks(4), [
    local(2011, 0, 1, 12, 5),
    local(2011, 0, 1, 12, 10),
    local(2011, 0, 1, 12, 15),
    local(2011, 0, 1, 12, 20),
  ])
})

it("time.ticks(count) can generate 15-minute ticks", () => {
  const x = scaleTime().domain([local(2011, 0, 1, 12, 8, 27), local(2011, 0, 1, 13, 4, 12)])
  assert.deepStrictEqual(x.ticks(4), [
    local(2011, 0, 1, 12, 15),
    local(2011, 0, 1, 12, 30),
    local(2011, 0, 1, 12, 45),
    local(2011, 0, 1, 13, 0),
  ])
})

it("time.ticks(count) can generate 30-minute ticks", () => {
  const x = scaleTime().domain([local(2011, 0, 1, 12, 28, 27), local(2011, 0, 1, 14, 4, 12)])
  assert.deepStrictEqual(x.ticks(4), [
    local(2011, 0, 1, 12, 30),
    local(2011, 0, 1, 13, 0),
    local(2011, 0, 1, 13, 30),
    local(2011, 0, 1, 14, 0),
  ])
})

it("time.ticks(count) can generate 1-hour ticks", () => {
  const x = scaleTime().domain([local(2011, 0, 1, 12, 28, 27), local(2011, 0, 1, 16, 34, 12)])
  assert.deepStrictEqual(x.ticks(4), [
    local(2011, 0, 1, 13, 0),
    local(2011, 0, 1, 14, 0),
    local(2011, 0, 1, 15, 0),
    local(2011, 0, 1, 16, 0),
  ])
})

it("time.ticks(count) can generate 3-hour ticks", () => {
  const x = scaleTime().domain([local(2011, 0, 1, 14, 28, 27), local(2011, 0, 2, 1, 34, 12)])
  assert.deepStrictEqual(x.ticks(4), [
    local(2011, 0, 1, 15, 0),
    local(2011, 0, 1, 18, 0),
    local(2011, 0, 1, 21, 0),
    local(2011, 0, 2, 0, 0),
  ])
})

it("time.ticks(count) can generate 6-hour ticks", () => {
  const x = scaleTime().domain([local(2011, 0, 1, 16, 28, 27), local(2011, 0, 2, 14, 34, 12)])
  assert.deepStrictEqual(x.ticks(4), [
    local(2011, 0, 1, 18, 0),
    local(2011, 0, 2, 0, 0),
    local(2011, 0, 2, 6, 0),
    local(2011, 0, 2, 12, 0),
  ])
})

it("time.ticks(count) can generate 12-hour ticks", () => {
  const x = scaleTime().domain([local(2011, 0, 1, 16, 28, 27), local(2011, 0, 3, 21, 34, 12)])
  assert.deepStrictEqual(x.ticks(4), [
    local(2011, 0, 2, 0, 0),
    local(2011, 0, 2, 12, 0),
    local(2011, 0, 3, 0, 0),
    local(2011, 0, 3, 12, 0),
  ])
})

it("time.ticks(count) can generate 1-day ticks", () => {
  const x = scaleTime().domain([local(2011, 0, 1, 16, 28, 27), local(2011, 0, 5, 21, 34, 12)])
  assert.deepStrictEqual(x.ticks(4), [
    local(2011, 0, 2, 0, 0),
    local(2011, 0, 3, 0, 0),
    local(2011, 0, 4, 0, 0),
    local(2011, 0, 5, 0, 0),
  ])
})

it("time.ticks(count) can generate 2-day ticks", () => {
  const x = scaleTime().domain([local(2011, 0, 2, 16, 28, 27), local(2011, 0, 9, 21, 34, 12)])
  assert.deepStrictEqual(x.ticks(4), [
    local(2011, 0, 3, 0, 0),
    local(2011, 0, 5, 0, 0),
    local(2011, 0, 7, 0, 0),
    local(2011, 0, 9, 0, 0),
  ])
})

it("time.ticks(count) can generate 1-week ticks", () => {
  const x = scaleTime().domain([local(2011, 0, 1, 16, 28, 27), local(2011, 0, 23, 21, 34, 12)])
  assert.deepStrictEqual(x.ticks(4), [
    local(2011, 0, 2, 0, 0),
    local(2011, 0, 9, 0, 0),
    local(2011, 0, 16, 0, 0),
    local(2011, 0, 23, 0, 0),
  ])
})

it("time.ticks(count) can generate 1-month ticks", () => {
  const x = scaleTime().domain([local(2011, 0, 18), local(2011, 4, 2)])
  assert.deepStrictEqual(x.ticks(4), [
    local(2011, 1, 1, 0, 0),
    local(2011, 2, 1, 0, 0),
    local(2011, 3, 1, 0, 0),
    local(2011, 4, 1, 0, 0),
  ])
})

it("time.ticks(count) can generate 3-month ticks", () => {
  const x = scaleTime().domain([local(2010, 11, 18), local(2011, 10, 2)])
  assert.deepStrictEqual(x.ticks(4), [
    local(2011, 0, 1, 0, 0),
    local(2011, 3, 1, 0, 0),
    local(2011, 6, 1, 0, 0),
    local(2011, 9, 1, 0, 0),
  ])
})

it("time.ticks(count) can generate 1-year ticks", () => {
  const x = scaleTime().domain([local(2010, 11, 18), local(2014, 2, 2)])
  assert.deepStrictEqual(x.ticks(4), [
    local(2011, 0, 1, 0, 0),
    local(2012, 0, 1, 0, 0),
    local(2013, 0, 1, 0, 0),
    local(2014, 0, 1, 0, 0),
  ])
})

it("time.ticks(count) can generate multi-year ticks", () => {
  const x = scaleTime().domain([local(0, 11, 18), local(2014, 2, 2)])
  assert.deepStrictEqual(x.ticks(6), [
    local(500, 0, 1, 0, 0),
    local(1000, 0, 1, 0, 0),
    local(1500, 0, 1, 0, 0),
    local(2000, 0, 1, 0, 0),
  ])
})

it("time.ticks(count) returns one tick for an empty domain", () => {
  const x = scaleTime().domain([local(2014, 2, 2), local(2014, 2, 2)])
  assert.deepStrictEqual(x.ticks(6), [local(2014, 2, 2)])
})

it("time.ticks() returns descending ticks for a descending domain", () => {
  const x = scaleTime()
  assert.deepStrictEqual(x.domain([local(2014, 2, 2), local(2010, 11, 18)]).ticks(4), [
    local(2014, 0, 1, 0, 0),
    local(2013, 0, 1, 0, 0),
    local(2012, 0, 1, 0, 0),
    local(2011, 0, 1, 0, 0),
  ])
  assert.deepStrictEqual(x.domain([local(2011, 10, 2), local(2010, 11, 18)]).ticks(4), [
    local(2011, 9, 1, 0, 0),
    local(2011, 6, 1, 0, 0),
    local(2011, 3, 1, 0, 0),
    local(2011, 0, 1, 0, 0),
  ])
})

it("time.tickFormat()(date) formats year on New Year's", () => {
  const f = scaleTime().tickFormat()
  assert.strictEqual(f(local(2011, 0, 1)), "2011")
  assert.strictEqual(f(local(2012, 0, 1)), "2012")
  assert.strictEqual(f(local(2013, 0, 1)), "2013")
})

it("time.tickFormat()(date) formats month on the 1st of each month", () => {
  const f = scaleTime().tickFormat()
  assert.strictEqual(f(local(2011, 1, 1)), "February")
  assert.strictEqual(f(local(2011, 2, 1)), "March")
  assert.strictEqual(f(local(2011, 3, 1)), "April")
})

it("time.tickFormat()(date) formats week on Sunday midnight", () => {
  const f = scaleTime().tickFormat()
  assert.strictEqual(f(local(2011, 1, 6)), "Feb 06")
  assert.strictEqual(f(local(2011, 1, 13)), "Feb 13")
  assert.strictEqual(f(local(2011, 1, 20)), "Feb 20")
})

it("time.tickFormat()(date) formats date on midnight", () => {
  const f = scaleTime().tickFormat()
  assert.strictEqual(f(local(2011, 1, 2)), "Wed 02")
  assert.strictEqual(f(local(2011, 1, 3)), "Thu 03")
  assert.strictEqual(f(local(2011, 1, 4)), "Fri 04")
})

it("time.tickFormat()(date) formats hour on minute zero", () => {
  const f = scaleTime().tickFormat()
  assert.strictEqual(f(local(2011, 1, 2, 11)), "11 AM")
  assert.strictEqual(f(local(2011, 1, 2, 12)), "12 PM")
  assert.strictEqual(f(local(2011, 1, 2, 13)), "01 PM")
})

it("time.tickFormat()(date) formats minute on second zero", () => {
  const f = scaleTime().tickFormat()
  assert.strictEqual(f(local(2011, 1, 2, 11, 59)), "11:59")
  assert.strictEqual(f(local(2011, 1, 2, 12, 1)), "12:01")
  assert.strictEqual(f(local(2011, 1, 2, 12, 2)), "12:02")
})

it("time.tickFormat()(date) otherwise, formats second", () => {
  const f = scaleTime().tickFormat()
  assert.strictEqual(f(local(2011, 1, 2, 12, 1, 9)), ":09")
  assert.strictEqual(f(local(2011, 1, 2, 12, 1, 10)), ":10")
  assert.strictEqual(f(local(2011, 1, 2, 12, 1, 11)), ":11")
})

it("time.tickFormat(count, specifier) returns a time format for the specified specifier", () => {
  const f = scaleTime().tickFormat(10, "%c")
  assert.strictEqual(f(local(2011, 1, 2, 12)), "2/2/2011, 12:00:00 PM")
})
import assert from "assert"
import { interpolateHsl } from "d3-interpolate"
import { utcDay, utcMinute, utcMonth, utcWeek, utcYear } from "d3-time"
import { scaleUtc } from "../src/index.js"
import { utc } from "./date.js"

it("scaleUtc.nice() is an alias for scaleUtc.nice(10)", () => {
  const x = scaleUtc().domain([utc(2009, 0, 1, 0, 17), utc(2009, 0, 1, 23, 42)])
  assert.deepStrictEqual(x.nice().domain(), [utc(2009, 0, 1), utc(2009, 0, 2)])
})

it("scaleUtc.nice() can nice sub-second domains", () => {
  const x = scaleUtc().domain([utc(2013, 0, 1, 12, 0, 0, 0), utc(2013, 0, 1, 12, 0, 0, 128)])
  assert.deepStrictEqual(x.nice().domain(), [utc(2013, 0, 1, 12, 0, 0, 0), utc(2013, 0, 1, 12, 0, 0, 130)])
})

it("scaleUtc.nice() can nice multi-year domains", () => {
  const x = scaleUtc().domain([utc(2001, 0, 1), utc(2138, 0, 1)])
  assert.deepStrictEqual(x.nice().domain(), [utc(2000, 0, 1), utc(2140, 0, 1)])
})

it("scaleUtc.nice() can nice empty domains", () => {
  const x = scaleUtc().domain([utc(2009, 0, 1, 0, 12), utc(2009, 0, 1, 0, 12)])
  assert.deepStrictEqual(x.nice().domain(), [utc(2009, 0, 1, 0, 12), utc(2009, 0, 1, 0, 12)])
})

it("scaleUtc.nice(count) nices using the specified tick count", () => {
  const x = scaleUtc().domain([utc(2009, 0, 1, 0, 17), utc(2009, 0, 1, 23, 42)])
  assert.deepStrictEqual(x.nice(100).domain(), [utc(2009, 0, 1, 0, 15), utc(2009, 0, 1, 23, 45)])
  assert.deepStrictEqual(x.nice(10).domain(), [utc(2009, 0, 1), utc(2009, 0, 2)])
})

it("scaleUtc.nice(interval) nices using the specified time interval", () => {
  const x = scaleUtc().domain([utc(2009, 0, 1, 0, 12), utc(2009, 0, 1, 23, 48)])
  assert.deepStrictEqual(x.nice(utcDay).domain(), [utc(2009, 0, 1), utc(2009, 0, 2)])
  assert.deepStrictEqual(x.nice(utcWeek).domain(), [utc(2008, 11, 28), utc(2009, 0, 4)])
  assert.deepStrictEqual(x.nice(utcMonth).domain(), [utc(2008, 11, 1), utc(2009, 1, 1)])
  assert.deepStrictEqual(x.nice(utcYear).domain(), [utc(2008, 0, 1), utc(2010, 0, 1)])
})

it("scaleUtc.nice(interval) can nice empty domains", () => {
  const x = scaleUtc().domain([utc(2009, 0, 1, 0, 12), utc(2009, 0, 1, 0, 12)])
  assert.deepStrictEqual(x.nice(utcDay).domain(), [utc(2009, 0, 1), utc(2009, 0, 2)])
})

it("scaleUtc.nice(interval) can nice a polylinear domain, only affecting its extent", () => {
  const x = scaleUtc()
    .domain([utc(2009, 0, 1, 0, 12), utc(2009, 0, 1, 23, 48), utc(2009, 0, 2, 23, 48)])
    .nice(utcDay)
  assert.deepStrictEqual(x.domain(), [utc(2009, 0, 1), utc(2009, 0, 1, 23, 48), utc(2009, 0, 3)])
})

it("scaleUtc.nice(interval.every(step)) nices using the specified time interval and step", () => {
  const x = scaleUtc().domain([utc(2009, 0, 1, 0, 12), utc(2009, 0, 1, 23, 48)])
  assert.deepStrictEqual(x.nice(utcDay.every(3)).domain(), [utc(2009, 0, 1), utc(2009, 0, 4)])
  assert.deepStrictEqual(x.nice(utcWeek.every(2)).domain(), [utc(2008, 11, 21), utc(2009, 0, 4)])
  assert.deepStrictEqual(x.nice(utcMonth.every(3)).domain(), [utc(2008, 9, 1), utc(2009, 3, 1)])
  assert.deepStrictEqual(x.nice(utcYear.every(10)).domain(), [utc(2000, 0, 1), utc(2010, 0, 1)])
})

it("scaleUtc.copy() isolates changes to the domain", () => {
  const x = scaleUtc().domain([utc(2009, 0, 1), utc(2010, 0, 1)]),
    y = x.copy()
  x.domain([utc(2010, 0, 1), utc(2011, 0, 1)])
  assert.deepStrictEqual(y.domain(), [utc(2009, 0, 1), utc(2010, 0, 1)])
  assert.strictEqual(x(utc(2010, 0, 1)), 0)
  assert.strictEqual(y(utc(2010, 0, 1)), 1)
  y.domain([utc(2011, 0, 1), utc(2012, 0, 1)])
  assert.strictEqual(x(utc(2011, 0, 1)), 1)
  assert.strictEqual(y(utc(2011, 0, 1)), 0)
  assert.deepStrictEqual(x.domain(), [utc(2010, 0, 1), utc(2011, 0, 1)])
  assert.deepStrictEqual(y.domain(), [utc(2011, 0, 1), utc(2012, 0, 1)])
})

it("scaleUtc.copy() isolates changes to the range", () => {
  const x = scaleUtc().domain([utc(2009, 0, 1), utc(2010, 0, 1)]),
    y = x.copy()
  x.range([1, 2])
  assert.deepStrictEqual(x.invert(1), utc(2009, 0, 1))
  assert.deepStrictEqual(y.invert(1), utc(2010, 0, 1))
  assert.deepStrictEqual(y.range(), [0, 1])
  y.range([2, 3])
  assert.deepStrictEqual(x.invert(2), utc(2010, 0, 1))
  assert.deepStrictEqual(y.invert(2), utc(2009, 0, 1))
  assert.deepStrictEqual(x.range(), [1, 2])
  assert.deepStrictEqual(y.range(), [2, 3])
})

it("scaleUtc.copy() isolates changes to the interpolator", () => {
  const x = scaleUtc()
    .domain([utc(2009, 0, 1), utc(2010, 0, 1)])
    .range(["red", "blue"])
  const i = x.interpolate()
  const y = x.copy()
  x.interpolate(interpolateHsl)
  assert.strictEqual(x(utc(2009, 6, 1)), "rgb(255, 0, 253)")
  assert.strictEqual(y(utc(2009, 6, 1)), "rgb(129, 0, 126)")
  assert.strictEqual(y.interpolate(), i)
})

it("scaleUtc.copy() isolates changes to clamping", () => {
  const x = scaleUtc()
      .domain([utc(2009, 0, 1), utc(2010, 0, 1)])
      .clamp(true),
    y = x.copy()
  x.clamp(false)
  assert.strictEqual(x(utc(2011, 0, 1)), 2)
  assert.strictEqual(y(utc(2011, 0, 1)), 1)
  assert.strictEqual(y.clamp(), true)
  y.clamp(false)
  assert.strictEqual(x(utc(2011, 0, 1)), 2)
  assert.strictEqual(y(utc(2011, 0, 1)), 2)
  assert.strictEqual(x.clamp(), false)
})

it("scaleUtc.ticks(interval) observes the specified tick interval", () => {
  const x = scaleUtc().domain([utc(2011, 0, 1, 12, 1, 0), utc(2011, 0, 1, 12, 4, 4)])
  assert.deepStrictEqual(x.ticks(utcMinute), [
    utc(2011, 0, 1, 12, 1),
    utc(2011, 0, 1, 12, 2),
    utc(2011, 0, 1, 12, 3),
    utc(2011, 0, 1, 12, 4),
  ])
})

it("scaleUtc.ticks(interval) observes the specified named tick interval", () => {
  const x = scaleUtc().domain([utc(2011, 0, 1, 12, 1, 0), utc(2011, 0, 1, 12, 4, 4)])
  assert.deepStrictEqual(x.ticks(utcMinute), [
    utc(2011, 0, 1, 12, 1),
    utc(2011, 0, 1, 12, 2),
    utc(2011, 0, 1, 12, 3),
    utc(2011, 0, 1, 12, 4),
  ])
})

it("scaleUtc.ticks(interval.every(step)) observes the specified tick interval and step", () => {
  const x = scaleUtc().domain([utc(2011, 0, 1, 12, 0, 0), utc(2011, 0, 1, 12, 33, 4)])
  assert.deepStrictEqual(x.ticks(utcMinute.every(10)), [
    utc(2011, 0, 1, 12, 0),
    utc(2011, 0, 1, 12, 10),
    utc(2011, 0, 1, 12, 20),
    utc(2011, 0, 1, 12, 30),
  ])
})

it("scaleUtc.ticks(count) can generate sub-second ticks", () => {
  const x = scaleUtc().domain([utc(2011, 0, 1, 12, 0, 0), utc(2011, 0, 1, 12, 0, 1)])
  assert.deepStrictEqual(x.ticks(4), [
    utc(2011, 0, 1, 12, 0, 0, 0),
    utc(2011, 0, 1, 12, 0, 0, 200),
    utc(2011, 0, 1, 12, 0, 0, 400),
    utc(2011, 0, 1, 12, 0, 0, 600),
    utc(2011, 0, 1, 12, 0, 0, 800),
    utc(2011, 0, 1, 12, 0, 1, 0),
  ])
})

it("scaleUtc.ticks(count) can generate 1-second ticks", () => {
  const x = scaleUtc().domain([utc(2011, 0, 1, 12, 0, 0), utc(2011, 0, 1, 12, 0, 4)])
  assert.deepStrictEqual(x.ticks(4), [
    utc(2011, 0, 1, 12, 0, 0),
    utc(2011, 0, 1, 12, 0, 1),
    utc(2011, 0, 1, 12, 0, 2),
    utc(2011, 0, 1, 12, 0, 3),
    utc(2011, 0, 1, 12, 0, 4),
  ])
})

it("scaleUtc.ticks(count) can generate 5-second ticks", () => {
  const x = scaleUtc().domain([utc(2011, 0, 1, 12, 0, 0), utc(2011, 0, 1, 12, 0, 20)])
  assert.deepStrictEqual(x.ticks(4), [
    utc(2011, 0, 1, 12, 0, 0),
    utc(2011, 0, 1, 12, 0, 5),
    utc(2011, 0, 1, 12, 0, 10),
    utc(2011, 0, 1, 12, 0, 15),
    utc(2011, 0, 1, 12, 0, 20),
  ])
})

it("scaleUtc.ticks(count) can generate 15-second ticks", () => {
  const x = scaleUtc().domain([utc(2011, 0, 1, 12, 0, 0), utc(2011, 0, 1, 12, 0, 50)])
  assert.deepStrictEqual(x.ticks(4), [
    utc(2011, 0, 1, 12, 0, 0),
    utc(2011, 0, 1, 12, 0, 15),
    utc(2011, 0, 1, 12, 0, 30),
    utc(2011, 0, 1, 12, 0, 45),
  ])
})

it("scaleUtc.ticks(count) can generate 30-second ticks", () => {
  const x = scaleUtc().domain([utc(2011, 0, 1, 12, 0, 0), utc(2011, 0, 1, 12, 1, 50)])
  assert.deepStrictEqual(x.ticks(4), [
    utc(2011, 0, 1, 12, 0, 0),
    utc(2011, 0, 1, 12, 0, 30),
    utc(2011, 0, 1, 12, 1, 0),
    utc(2011, 0, 1, 12, 1, 30),
  ])
})

it("scaleUtc.ticks(count) can generate 1-minute ticks", () => {
  const x = scaleUtc().domain([utc(2011, 0, 1, 12, 0, 27), utc(2011, 0, 1, 12, 4, 12)])
  assert.deepStrictEqual(x.ticks(4), [
    utc(2011, 0, 1, 12, 1),
    utc(2011, 0, 1, 12, 2),
    utc(2011, 0, 1, 12, 3),
    utc(2011, 0, 1, 12, 4),
  ])
})

it("scaleUtc.ticks(count) can generate 5-minute ticks", () => {
  const x = scaleUtc().domain([utc(2011, 0, 1, 12, 3, 27), utc(2011, 0, 1, 12, 21, 12)])
  assert.deepStrictEqual(x.ticks(4), [
    utc(2011, 0, 1, 12, 5),
    utc(2011, 0, 1, 12, 10),
    utc(2011, 0, 1, 12, 15),
    utc(2011, 0, 1, 12, 20),
  ])
})

it("scaleUtc.ticks(count) can generate 15-minute ticks", () => {
  const x = scaleUtc().domain([utc(2011, 0, 1, 12, 8, 27), utc(2011, 0, 1, 13, 4, 12)])
  assert.deepStrictEqual(x.ticks(4), [
    utc(2011, 0, 1, 12, 15),
    utc(2011, 0, 1, 12, 30),
    utc(2011, 0, 1, 12, 45),
    utc(2011, 0, 1, 13, 0),
  ])
})

it("scaleUtc.ticks(count) can generate 30-minute ticks", () => {
  const x = scaleUtc().domain([utc(2011, 0, 1, 12, 28, 27), utc(2011, 0, 1, 14, 4, 12)])
  assert.deepStrictEqual(x.ticks(4), [
    utc(2011, 0, 1, 12, 30),
    utc(2011, 0, 1, 13, 0),
    utc(2011, 0, 1, 13, 30),
    utc(2011, 0, 1, 14, 0),
  ])
})

it("scaleUtc.ticks(count) can generate 1-hour ticks", () => {
  const x = scaleUtc().domain([utc(2011, 0, 1, 12, 28, 27), utc(2011, 0, 1, 16, 34, 12)])
  assert.deepStrictEqual(x.ticks(4), [
    utc(2011, 0, 1, 13, 0),
    utc(2011, 0, 1, 14, 0),
    utc(2011, 0, 1, 15, 0),
    utc(2011, 0, 1, 16, 0),
  ])
})

it("scaleUtc.ticks(count) can generate 3-hour ticks", () => {
  const x = scaleUtc().domain([utc(2011, 0, 1, 14, 28, 27), utc(2011, 0, 2, 1, 34, 12)])
  assert.deepStrictEqual(x.ticks(4), [
    utc(2011, 0, 1, 15, 0),
    utc(2011, 0, 1, 18, 0),
    utc(2011, 0, 1, 21, 0),
    utc(2011, 0, 2, 0, 0),
  ])
})

it("scaleUtc.ticks(count) can generate 6-hour ticks", () => {
  const x = scaleUtc().domain([utc(2011, 0, 1, 16, 28, 27), utc(2011, 0, 2, 14, 34, 12)])
  assert.deepStrictEqual(x.ticks(4), [
    utc(2011, 0, 1, 18, 0),
    utc(2011, 0, 2, 0, 0),
    utc(2011, 0, 2, 6, 0),
    utc(2011, 0, 2, 12, 0),
  ])
})

it("scaleUtc.ticks(count) can generate 12-hour ticks", () => {
  const x = scaleUtc().domain([utc(2011, 0, 1, 16, 28, 27), utc(2011, 0, 3, 21, 34, 12)])
  assert.deepStrictEqual(x.ticks(4), [
    utc(2011, 0, 2, 0, 0),
    utc(2011, 0, 2, 12, 0),
    utc(2011, 0, 3, 0, 0),
    utc(2011, 0, 3, 12, 0),
  ])
})

it("scaleUtc.ticks(count) can generate 1-day ticks", () => {
  const x = scaleUtc().domain([utc(2011, 0, 1, 16, 28, 27), utc(2011, 0, 5, 21, 34, 12)])
  assert.deepStrictEqual(x.ticks(4), [
    utc(2011, 0, 2, 0, 0),
    utc(2011, 0, 3, 0, 0),
    utc(2011, 0, 4, 0, 0),
    utc(2011, 0, 5, 0, 0),
  ])
})

it("scaleUtc.ticks(count) can generate 2-day ticks", () => {
  const x = scaleUtc().domain([utc(2011, 0, 2, 16, 28, 27), utc(2011, 0, 9, 21, 34, 12)])
  assert.deepStrictEqual(x.ticks(4), [
    utc(2011, 0, 3, 0, 0),
    utc(2011, 0, 5, 0, 0),
    utc(2011, 0, 7, 0, 0),
    utc(2011, 0, 9, 0, 0),
  ])
})

it("scaleUtc.ticks(count) can generate 1-week ticks", () => {
  const x = scaleUtc().domain([utc(2011, 0, 1, 16, 28, 27), utc(2011, 0, 23, 21, 34, 12)])
  assert.deepStrictEqual(x.ticks(4), [
    utc(2011, 0, 2, 0, 0),
    utc(2011, 0, 9, 0, 0),
    utc(2011, 0, 16, 0, 0),
    utc(2011, 0, 23, 0, 0),
  ])
})

it("scaleUtc.ticks(count) can generate 1-month ticks", () => {
  const x = scaleUtc().domain([utc(2011, 0, 18), utc(2011, 4, 2)])
  assert.deepStrictEqual(x.ticks(4), [
    utc(2011, 1, 1, 0, 0),
    utc(2011, 2, 1, 0, 0),
    utc(2011, 3, 1, 0, 0),
    utc(2011, 4, 1, 0, 0),
  ])
})

it("scaleUtc.ticks(count) can generate 3-month ticks", () => {
  const x = scaleUtc().domain([utc(2010, 11, 18), utc(2011, 10, 2)])
  assert.deepStrictEqual(x.ticks(4), [
    utc(2011, 0, 1, 0, 0),
    utc(2011, 3, 1, 0, 0),
    utc(2011, 6, 1, 0, 0),
    utc(2011, 9, 1, 0, 0),
  ])
})

it("scaleUtc.ticks(count) can generate 1-year ticks", () => {
  const x = scaleUtc().domain([utc(2010, 11, 18), utc(2014, 2, 2)])
  assert.deepStrictEqual(x.ticks(4), [
    utc(2011, 0, 1, 0, 0),
    utc(2012, 0, 1, 0, 0),
    utc(2013, 0, 1, 0, 0),
    utc(2014, 0, 1, 0, 0),
  ])
})

it("scaleUtc.ticks(count) can generate multi-year ticks", () => {
  const x = scaleUtc().domain([utc(0, 11, 18), utc(2014, 2, 2)])
  assert.deepStrictEqual(x.ticks(6), [
    utc(500, 0, 1, 0, 0),
    utc(1000, 0, 1, 0, 0),
    utc(1500, 0, 1, 0, 0),
    utc(2000, 0, 1, 0, 0),
  ])
})

it("scaleUtc.ticks(count) returns one tick for an empty domain", () => {
  const x = scaleUtc().domain([utc(2014, 2, 2), utc(2014, 2, 2)])
  assert.deepStrictEqual(x.ticks(6), [utc(2014, 2, 2)])
})

it("scaleUtc.tickFormat()(date) formats year on New Year's", () => {
  const f = scaleUtc().tickFormat()
  assert.strictEqual(f(utc(2011, 0, 1)), "2011")
  assert.strictEqual(f(utc(2012, 0, 1)), "2012")
  assert.strictEqual(f(utc(2013, 0, 1)), "2013")
})

it("scaleUtc.tickFormat()(date) formats month on the 1st of each month", () => {
  const f = scaleUtc().tickFormat()
  assert.strictEqual(f(utc(2011, 1, 1)), "February")
  assert.strictEqual(f(utc(2011, 2, 1)), "March")
  assert.strictEqual(f(utc(2011, 3, 1)), "April")
})

it("scaleUtc.tickFormat()(date) formats week on Sunday midnight", () => {
  const f = scaleUtc().tickFormat()
  assert.strictEqual(f(utc(2011, 1, 6)), "Feb 06")
  assert.strictEqual(f(utc(2011, 1, 13)), "Feb 13")
  assert.strictEqual(f(utc(2011, 1, 20)), "Feb 20")
})

it("scaleUtc.tickFormat()(date) formats date on midnight", () => {
  const f = scaleUtc().tickFormat()
  assert.strictEqual(f(utc(2011, 1, 2)), "Wed 02")
  assert.strictEqual(f(utc(2011, 1, 3)), "Thu 03")
  assert.strictEqual(f(utc(2011, 1, 4)), "Fri 04")
})

it("scaleUtc.tickFormat()(date) formats hour on minute zero", () => {
  const f = scaleUtc().tickFormat()
  assert.strictEqual(f(utc(2011, 1, 2, 11)), "11 AM")
  assert.strictEqual(f(utc(2011, 1, 2, 12)), "12 PM")
  assert.strictEqual(f(utc(2011, 1, 2, 13)), "01 PM")
})

it("scaleUtc.tickFormat()(date) formats minute on second zero", () => {
  const f = scaleUtc().tickFormat()
  assert.strictEqual(f(utc(2011, 1, 2, 11, 59)), "11:59")
  assert.strictEqual(f(utc(2011, 1, 2, 12, 1)), "12:01")
  assert.strictEqual(f(utc(2011, 1, 2, 12, 2)), "12:02")
})

it("scaleUtc.tickFormat()(date) otherwise, formats second", () => {
  const f = scaleUtc().tickFormat()
  assert.strictEqual(f(utc(2011, 1, 2, 12, 1, 9)), ":09")
  assert.strictEqual(f(utc(2011, 1, 2, 12, 1, 10)), ":10")
  assert.strictEqual(f(utc(2011, 1, 2, 12, 1, 11)), ":11")
})

it("scaleUtc.tickFormat(count, specifier) returns a time format for the specified specifier", () => {
  const f = scaleUtc().tickFormat(10, "%c")
  assert.strictEqual(f(utc(2011, 1, 2, 12)), "2/2/2011, 12:00:00 PM")
})
