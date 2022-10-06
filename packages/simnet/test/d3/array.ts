export function OneTimeNumber(value) {
  this.value = value
}

OneTimeNumber.prototype.valueOf = function () {
  var v = this.value
  this.value = NaN
  return v
}
import assert from "assert"
import { ascending } from "../src/index.js"

it("ascending(a, b) returns a negative number if a < b", () => {
  assert(ascending(0, 1) < 0)
  assert(ascending("a", "b") < 0)
})

it("ascending(a, b) returns a positive number if a > b", () => {
  assert(ascending(1, 0) > 0)
  assert(ascending("b", "a") > 0)
})

it("ascending(a, b) returns zero if a >= b and a <= b", () => {
  assert.strictEqual(ascending(0, 0), 0)
  assert.strictEqual(ascending("a", "a"), 0)
  assert.strictEqual(ascending("0", 0), 0)
  assert.strictEqual(ascending(0, "0"), 0)
})

it("ascending(a, b) returns NaN if a and b are not comparable", () => {
  assert(isNaN(ascending(0, undefined)))
  assert(isNaN(ascending(undefined, 0)))
  assert(isNaN(ascending(undefined, undefined)))
  assert(isNaN(ascending(0, NaN)))
  assert(isNaN(ascending(NaN, 0)))
  assert(isNaN(ascending(NaN, NaN)))
})
import assert from "assert"
import { InternSet } from "internmap"

export function assertSetEqual(actual, expected) {
  assert(actual instanceof Set)
  expected = new InternSet(expected)
  for (const a of actual) assert(expected.has(a), `unexpected ${a}`)
  for (const e of expected) assert(actual.has(e), `expected ${e}`)
}
import assert from "assert"
import { csvParse } from "d3-dsv"
import { readFile } from "fs/promises"
import { bin, extent, histogram, thresholdSturges, ticks } from "../src/index.js"

it("histogram is a deprecated alias for bin", () => {
  assert.strictEqual(histogram, bin)
})

it("bin() returns a default bin generator", () => {
  const h = bin()
  assert.strictEqual(h.value()(42), 42)
  assert.strictEqual(h.domain(), extent)
  assert.deepStrictEqual(h.thresholds(), thresholdSturges)
})

it("bin(data) computes bins of the specified array of data", () => {
  const h = bin()
  assert.deepStrictEqual(h([0, 0, 0, 10, 20, 20]), [
    box([0, 0, 0], 0, 5),
    box([], 5, 10),
    box([10], 10, 15),
    box([], 15, 20),
    box([20, 20], 20, 25),
  ])
})

it("bin(iterable) is equivalent to bin(array)", () => {
  const h = bin()
  assert.deepStrictEqual(h(iterable([0, 0, 0, 10, 20, 20])), [
    box([0, 0, 0], 0, 5),
    box([], 5, 10),
    box([10], 10, 15),
    box([], 15, 20),
    box([20, 20], 20, 25),
  ])
})

it("bin.value(number) sets the constant value", () => {
  const h = bin().value(12) // Pointless, but for consistency.
  assert.deepStrictEqual(h([0, 0, 0, 1, 2, 2]), [box([0, 0, 0, 1, 2, 2], 12, 12)])
})

it("bin(data) does not bin null, undefined, or NaN", () => {
  const h = bin()
  assert.deepStrictEqual(h([0, null, undefined, NaN, 10, 20, 20]), [
    box([0], 0, 5),
    box([], 5, 10),
    box([10], 10, 15),
    box([], 15, 20),
    box([20, 20], 20, 25),
  ])
})

it("bin.value(function) sets the value accessor", () => {
  const h = bin().value(d => d.value)
  const a = { value: 0 }
  const b = { value: 10 }
  const c = { value: 20 }
  assert.deepStrictEqual(h([a, a, a, b, c, c]), [
    box([a, a, a], 0, 5),
    box([], 5, 10),
    box([b], 10, 15),
    box([], 15, 20),
    box([c, c], 20, 25),
  ])
})

it("bin.domain(array) sets the domain", () => {
  const h = bin().domain([0, 20])
  assert.deepStrictEqual(h.domain()(), [0, 20])
  assert.deepStrictEqual(h([1, 2, 2, 10, 18, 18]), [
    box([1, 2, 2], 0, 5),
    box([], 5, 10),
    box([10], 10, 15),
    box([18, 18], 15, 20),
  ])
})

it("bin.domain(function) sets the domain accessor", () => {
  let actual
  const values = [1, 2, 2, 10, 18, 18]
  const domain = values => {
    actual = values
    return [0, 20]
  }
  const h = bin().domain(domain)
  assert.strictEqual(h.domain(), domain)
  assert.deepStrictEqual(h(values), [box([1, 2, 2], 0, 5), box([], 5, 10), box([10], 10, 15), box([18, 18], 15, 20)])
  assert.deepStrictEqual(actual, values)
})

it("bin.thresholds(number) sets the approximate number of bin thresholds", () => {
  const h = bin().thresholds(3)
  assert.deepStrictEqual(h([0, 0, 0, 10, 30, 30]), [
    box([0, 0, 0], 0, 10),
    box([10], 10, 20),
    box([], 20, 30),
    box([30, 30], 30, 40),
  ])
})

it("bin.thresholds(array) sets the bin thresholds", () => {
  const h = bin().thresholds([10, 20])
  assert.deepStrictEqual(h([0, 0, 0, 10, 30, 30]), [box([0, 0, 0], 0, 10), box([10], 10, 20), box([30, 30], 20, 30)])
})

it("bin.thresholds(array) ignores thresholds outside the domain", () => {
  const h = bin().thresholds([0, 1, 2, 3, 4])
  assert.deepStrictEqual(h([0, 1, 2, 3]), [box([0], 0, 1), box([1], 1, 2), box([2], 2, 3), box([3], 3, 3)])
})

it("bin.thresholds(function) sets the bin thresholds accessor", () => {
  let actual
  const values = [0, 0, 0, 10, 30, 30]
  const h = bin().thresholds((values, x0, x1) => {
    actual = [values, x0, x1]
    return [10, 20]
  })
  assert.deepStrictEqual(h(values), [box([0, 0, 0], 0, 10), box([10], 10, 20), box([30, 30], 20, 30)])
  assert.deepStrictEqual(actual, [values, 0, 30])
  assert.deepStrictEqual(h.thresholds(() => 5)(values), [
    box([0, 0, 0], 0, 5),
    box([], 5, 10),
    box([10], 10, 15),
    box([], 15, 20),
    box([], 20, 25),
    box([], 25, 30),
    box([30, 30], 30, 35),
  ])
})

it("bin(data) uses nice thresholds", () => {
  const h = bin().domain([0, 1]).thresholds(5)
  assert.deepStrictEqual(
    h([]).map(b => [b.x0, b.x1]),
    [
      [0.0, 0.2],
      [0.2, 0.4],
      [0.4, 0.6],
      [0.6, 0.8],
      [0.8, 1.0],
    ]
  )
})

it("bin()() returns bins whose rightmost bin is not too wide", () => {
  const h = bin()
  assert.deepStrictEqual(h([9.8, 10, 11, 12, 13, 13.2]), [
    box([9.8], 9, 10),
    box([10], 10, 11),
    box([11], 11, 12),
    box([12], 12, 13),
    box([13, 13.2], 13, 14),
  ])
})

it("bin(data) handles fractional step correctly", () => {
  const h = bin().thresholds(10)
  assert.deepStrictEqual(h([9.8, 10, 11, 12, 13, 13.2]), [
    box([9.8], 9.5, 10),
    box([10], 10, 10.5),
    box([], 10.5, 11),
    box([11], 11, 11.5),
    box([], 11.5, 12),
    box([12], 12, 12.5),
    box([], 12.5, 13),
    box([13, 13.2], 13, 13.5),
  ])
})

it("bin(data) handles fractional step correctly with a custom, non-aligned domain", () => {
  const h = bin().thresholds(10).domain([9.7, 13.3])
  assert.deepStrictEqual(h([9.8, 10, 11, 12, 13, 13.2]), [
    box([9.8], 9.7, 10),
    box([10], 10, 10.5),
    box([], 10.5, 11),
    box([11], 11, 11.5),
    box([], 11.5, 12),
    box([12], 12, 12.5),
    box([], 12.5, 13),
    box([13, 13.2], 13, 13.3),
  ])
})

it("bin(data) handles fractional step correctly with a custom, aligned domain", () => {
  const h = bin().thresholds(10).domain([9.5, 13.5])
  assert.deepStrictEqual(h([9.8, 10, 11, 12, 13, 13.2]), [
    box([9.8], 9.5, 10),
    box([10], 10, 10.5),
    box([], 10.5, 11),
    box([11], 11, 11.5),
    box([], 11.5, 12),
    box([12], 12, 12.5),
    box([], 12.5, 13),
    box([13, 13.2], 13, 13.5),
  ])
})

it("bin(data) coerces values to numbers as expected", () => {
  const h = bin().thresholds(10)
  assert.deepStrictEqual(h(["1", "2", "3", "4", "5"]), [
    box(["1"], 1, 1.5),
    box([], 1.5, 2),
    box(["2"], 2, 2.5),
    box([], 2.5, 3),
    box(["3"], 3, 3.5),
    box([], 3.5, 4),
    box(["4"], 4, 4.5),
    box([], 4.5, 5),
    box(["5"], 5, 5.5),
  ])
})

it("bin(athletes) produces the expected result", async () => {
  const height = csvParse(await readFile("./test/data/athletes.csv", "utf8"))
    .filter(d => d.height)
    .map(d => +d.height)
  const bins = bin().thresholds(57)(height)
  assert.deepStrictEqual(
    bins.map(b => b.length),
    [
      1, 0, 0, 0, 0, 0, 2, 1, 2, 1, 1, 4, 11, 7, 13, 39, 78, 93, 119, 193, 354, 393, 573, 483, 651, 834, 808, 763, 627,
      648, 833, 672, 578, 498, 395, 425, 278, 235, 182, 128, 91, 69, 43, 29, 21, 23, 3, 3, 1, 1, 1,
    ]
  )
})

it("bin(data) assigns floating point values to the correct bins", () => {
  for (const n of [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000]) {
    assert.ok(
      bin()
        .thresholds(n)(ticks(1, 2, n))
        .every(d => d.length === 1)
    )
  }
})

it("bin(data) assigns integer values to the correct bins", () => {
  assert.deepStrictEqual(bin().domain([4, 5])([5]), [box([5], 4, 5)])
  const eights = [8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8]
  assert.deepStrictEqual(bin().domain([3, 8])(eights), [
    box([], 3, 4),
    box([], 4, 5),
    box([], 5, 6),
    box([], 6, 7),
    box(eights, 7, 8),
  ])
})

function box(bin, x0, x1) {
  bin.x0 = x0
  bin.x1 = x1
  return bin
}

function* iterable(array) {
  yield* array
}
import assert from "assert"
import { bisect, bisectLeft, bisectRight } from "../src/index.js"

it("bisect is an alias for bisectRight", () => {
  assert.strictEqual(bisect, bisectRight)
})

it("bisectLeft(array, value) returns the index of an exact match", () => {
  const numbers = [1, 2, 3]
  assert.strictEqual(bisectLeft(numbers, 1), 0)
  assert.strictEqual(bisectLeft(numbers, 2), 1)
  assert.strictEqual(bisectLeft(numbers, 3), 2)
})

it("bisectLeft(array, value) returns the index of the first match", () => {
  const numbers = [1, 2, 2, 3]
  assert.strictEqual(bisectLeft(numbers, 1), 0)
  assert.strictEqual(bisectLeft(numbers, 2), 1)
  assert.strictEqual(bisectLeft(numbers, 3), 3)
})

it("bisectLeft(empty, value) returns zero", () => {
  assert.strictEqual(bisectLeft([], 1), 0)
})

it("bisectLeft(array, value) returns the insertion point of a non-exact match", () => {
  const numbers = [1, 2, 3]
  assert.strictEqual(bisectLeft(numbers, 0.5), 0)
  assert.strictEqual(bisectLeft(numbers, 1.5), 1)
  assert.strictEqual(bisectLeft(numbers, 2.5), 2)
  assert.strictEqual(bisectLeft(numbers, 3.5), 3)
})

it("bisectLeft(array, value) has undefined behavior if the search value is unorderable", () => {
  const numbers = [1, 2, 3]
  bisectLeft(numbers, new Date(NaN)) // who knows what this will return!
  bisectLeft(numbers, undefined)
  bisectLeft(numbers, NaN)
})

it("bisectLeft(array, value, lo) observes the specified lower bound", () => {
  const numbers = [1, 2, 3, 4, 5]
  assert.strictEqual(bisectLeft(numbers, 0, 2), 2)
  assert.strictEqual(bisectLeft(numbers, 1, 2), 2)
  assert.strictEqual(bisectLeft(numbers, 2, 2), 2)
  assert.strictEqual(bisectLeft(numbers, 3, 2), 2)
  assert.strictEqual(bisectLeft(numbers, 4, 2), 3)
  assert.strictEqual(bisectLeft(numbers, 5, 2), 4)
  assert.strictEqual(bisectLeft(numbers, 6, 2), 5)
})

it("bisectLeft(array, value, lo, hi) observes the specified bounds", () => {
  const numbers = [1, 2, 3, 4, 5]
  assert.strictEqual(bisectLeft(numbers, 0, 2, 3), 2)
  assert.strictEqual(bisectLeft(numbers, 1, 2, 3), 2)
  assert.strictEqual(bisectLeft(numbers, 2, 2, 3), 2)
  assert.strictEqual(bisectLeft(numbers, 3, 2, 3), 2)
  assert.strictEqual(bisectLeft(numbers, 4, 2, 3), 3)
  assert.strictEqual(bisectLeft(numbers, 5, 2, 3), 3)
  assert.strictEqual(bisectLeft(numbers, 6, 2, 3), 3)
})

it("bisectLeft(array, value) handles large sparse d3", () => {
  const numbers = []
  let i = 1 << 30
  numbers[i++] = 1
  numbers[i++] = 2
  numbers[i++] = 3
  numbers[i++] = 4
  numbers[i++] = 5
  assert.strictEqual(bisectLeft(numbers, 0, i - 5, i), i - 5)
  assert.strictEqual(bisectLeft(numbers, 1, i - 5, i), i - 5)
  assert.strictEqual(bisectLeft(numbers, 2, i - 5, i), i - 4)
  assert.strictEqual(bisectLeft(numbers, 3, i - 5, i), i - 3)
  assert.strictEqual(bisectLeft(numbers, 4, i - 5, i), i - 2)
  assert.strictEqual(bisectLeft(numbers, 5, i - 5, i), i - 1)
  assert.strictEqual(bisectLeft(numbers, 6, i - 5, i), i - 0)
})

it("bisectRight(array, value) returns the index after an exact match", () => {
  const numbers = [1, 2, 3]
  assert.strictEqual(bisectRight(numbers, 1), 1)
  assert.strictEqual(bisectRight(numbers, 2), 2)
  assert.strictEqual(bisectRight(numbers, 3), 3)
})

it("bisectRight(array, value) returns the index after the last match", () => {
  const numbers = [1, 2, 2, 3]
  assert.strictEqual(bisectRight(numbers, 1), 1)
  assert.strictEqual(bisectRight(numbers, 2), 3)
  assert.strictEqual(bisectRight(numbers, 3), 4)
})

it("bisectRight(empty, value) returns zero", () => {
  assert.strictEqual(bisectRight([], 1), 0)
})

it("bisectRight(array, value) returns the insertion point of a non-exact match", () => {
  const numbers = [1, 2, 3]
  assert.strictEqual(bisectRight(numbers, 0.5), 0)
  assert.strictEqual(bisectRight(numbers, 1.5), 1)
  assert.strictEqual(bisectRight(numbers, 2.5), 2)
  assert.strictEqual(bisectRight(numbers, 3.5), 3)
})

it("bisectRight(array, value, lo) observes the specified lower bound", () => {
  const numbers = [1, 2, 3, 4, 5]
  assert.strictEqual(bisectRight(numbers, 0, 2), 2)
  assert.strictEqual(bisectRight(numbers, 1, 2), 2)
  assert.strictEqual(bisectRight(numbers, 2, 2), 2)
  assert.strictEqual(bisectRight(numbers, 3, 2), 3)
  assert.strictEqual(bisectRight(numbers, 4, 2), 4)
  assert.strictEqual(bisectRight(numbers, 5, 2), 5)
  assert.strictEqual(bisectRight(numbers, 6, 2), 5)
})

it("bisectRight(array, value, lo, hi) observes the specified bounds", () => {
  const numbers = [1, 2, 3, 4, 5]
  assert.strictEqual(bisectRight(numbers, 0, 2, 3), 2)
  assert.strictEqual(bisectRight(numbers, 1, 2, 3), 2)
  assert.strictEqual(bisectRight(numbers, 2, 2, 3), 2)
  assert.strictEqual(bisectRight(numbers, 3, 2, 3), 3)
  assert.strictEqual(bisectRight(numbers, 4, 2, 3), 3)
  assert.strictEqual(bisectRight(numbers, 5, 2, 3), 3)
  assert.strictEqual(bisectRight(numbers, 6, 2, 3), 3)
})

it("bisectRight(array, value) handles large sparse d3", () => {
  const numbers = []
  let i = 1 << 30
  numbers[i++] = 1
  numbers[i++] = 2
  numbers[i++] = 3
  numbers[i++] = 4
  numbers[i++] = 5
  assert.strictEqual(bisectRight(numbers, 0, i - 5, i), i - 5)
  assert.strictEqual(bisectRight(numbers, 1, i - 5, i), i - 4)
  assert.strictEqual(bisectRight(numbers, 2, i - 5, i), i - 3)
  assert.strictEqual(bisectRight(numbers, 3, i - 5, i), i - 2)
  assert.strictEqual(bisectRight(numbers, 4, i - 5, i), i - 1)
  assert.strictEqual(bisectRight(numbers, 5, i - 5, i), i - 0)
  assert.strictEqual(bisectRight(numbers, 6, i - 5, i), i - 0)
})

it("bisectLeft(array, value, lo, hi) keeps non-comparable values to the right", () => {
  const values = [1, 2, null, undefined, NaN]
  assert.strictEqual(bisectLeft(values, 1), 0)
  assert.strictEqual(bisectLeft(values, 2), 1)
  assert.strictEqual(bisectLeft(values, null), 5)
  assert.strictEqual(bisectLeft(values, undefined), 5)
  assert.strictEqual(bisectLeft(values, NaN), 5)
})

it("bisectLeft(array, value, lo, hi) keeps comparable values to the left", () => {
  const values = [null, undefined, NaN]
  assert.strictEqual(bisectLeft(values, 1), 0)
  assert.strictEqual(bisectLeft(values, 2), 0)
})

it("bisectRight(array, value, lo, hi) keeps non-comparable values to the right", () => {
  const values = [1, 2, null, undefined]
  assert.strictEqual(bisectRight(values, 1), 1)
  assert.strictEqual(bisectRight(values, 2), 2)
  assert.strictEqual(bisectRight(values, null), 4)
  assert.strictEqual(bisectRight(values, undefined), 4)
  assert.strictEqual(bisectRight(values, NaN), 4)
})
import assert from "assert"
import { ascending, bisector } from "../src/index.js"

it("bisector(comparator).left(array, value) returns the index of an exact match", () => {
  const boxes = [1, 2, 3].map(box)
  const bisectLeft = bisector(ascendingBox).left
  assert.strictEqual(bisectLeft(boxes, box(1)), 0)
  assert.strictEqual(bisectLeft(boxes, box(2)), 1)
  assert.strictEqual(bisectLeft(boxes, box(3)), 2)
})

it("bisector(comparator).left(array, value) returns the index of the first match", () => {
  const boxes = [1, 2, 2, 3].map(box)
  const bisectLeft = bisector(ascendingBox).left
  assert.strictEqual(bisectLeft(boxes, box(1)), 0)
  assert.strictEqual(bisectLeft(boxes, box(2)), 1)
  assert.strictEqual(bisectLeft(boxes, box(3)), 3)
})

it("bisector(comparator).left(empty, value) returns zero", () => {
  assert.strictEqual(
    bisector(() => {
      throw new Error()
    }).left([], 1),
    0
  )
})

it("bisector(comparator).left(array, value) returns the insertion point of a non-exact match", () => {
  const boxes = [1, 2, 3].map(box)
  const bisectLeft = bisector(ascendingBox).left
  assert.strictEqual(bisectLeft(boxes, box(0.5)), 0)
  assert.strictEqual(bisectLeft(boxes, box(1.5)), 1)
  assert.strictEqual(bisectLeft(boxes, box(2.5)), 2)
  assert.strictEqual(bisectLeft(boxes, box(3.5)), 3)
})

it("bisector(comparator).left(array, value) has undefined behavior if the search value is unorderable", () => {
  const boxes = [1, 2, 3].map(box)
  const bisectLeft = bisector(ascendingBox).left
  bisectLeft(boxes, box(new Date(NaN))) // who knows what this will return!
  bisectLeft(boxes, box(undefined))
  bisectLeft(boxes, box(NaN))
})

it("bisector(comparator).left(array, value, lo) observes the specified lower bound", () => {
  const boxes = [1, 2, 3, 4, 5].map(box)
  const bisectLeft = bisector(ascendingBox).left
  assert.strictEqual(bisectLeft(boxes, box(0), 2), 2)
  assert.strictEqual(bisectLeft(boxes, box(1), 2), 2)
  assert.strictEqual(bisectLeft(boxes, box(2), 2), 2)
  assert.strictEqual(bisectLeft(boxes, box(3), 2), 2)
  assert.strictEqual(bisectLeft(boxes, box(4), 2), 3)
  assert.strictEqual(bisectLeft(boxes, box(5), 2), 4)
  assert.strictEqual(bisectLeft(boxes, box(6), 2), 5)
})

it("bisector(comparator).left(array, value, lo, hi) observes the specified bounds", () => {
  const boxes = [1, 2, 3, 4, 5].map(box)
  const bisectLeft = bisector(ascendingBox).left
  assert.strictEqual(bisectLeft(boxes, box(0), 2, 3), 2)
  assert.strictEqual(bisectLeft(boxes, box(1), 2, 3), 2)
  assert.strictEqual(bisectLeft(boxes, box(2), 2, 3), 2)
  assert.strictEqual(bisectLeft(boxes, box(3), 2, 3), 2)
  assert.strictEqual(bisectLeft(boxes, box(4), 2, 3), 3)
  assert.strictEqual(bisectLeft(boxes, box(5), 2, 3), 3)
  assert.strictEqual(bisectLeft(boxes, box(6), 2, 3), 3)
})

it("bisector(comparator).left(array, value) handles large sparse d3", () => {
  const boxes = []
  const bisectLeft = bisector(ascendingBox).left
  let i = 1 << 30
  boxes[i++] = box(1)
  boxes[i++] = box(2)
  boxes[i++] = box(3)
  boxes[i++] = box(4)
  boxes[i++] = box(5)
  assert.strictEqual(bisectLeft(boxes, box(0), i - 5, i), i - 5)
  assert.strictEqual(bisectLeft(boxes, box(1), i - 5, i), i - 5)
  assert.strictEqual(bisectLeft(boxes, box(2), i - 5, i), i - 4)
  assert.strictEqual(bisectLeft(boxes, box(3), i - 5, i), i - 3)
  assert.strictEqual(bisectLeft(boxes, box(4), i - 5, i), i - 2)
  assert.strictEqual(bisectLeft(boxes, box(5), i - 5, i), i - 1)
  assert.strictEqual(bisectLeft(boxes, box(6), i - 5, i), i - 0)
})

it("bisector(comparator).right(array, value) returns the index after an exact match", () => {
  const boxes = [1, 2, 3].map(box)
  const bisectRight = bisector(ascendingBox).right
  assert.strictEqual(bisectRight(boxes, box(1)), 1)
  assert.strictEqual(bisectRight(boxes, box(2)), 2)
  assert.strictEqual(bisectRight(boxes, box(3)), 3)
})

it("bisector(comparator).right(array, value) returns the index after the last match", () => {
  const boxes = [1, 2, 2, 3].map(box)
  const bisectRight = bisector(ascendingBox).right
  assert.strictEqual(bisectRight(boxes, box(1)), 1)
  assert.strictEqual(bisectRight(boxes, box(2)), 3)
  assert.strictEqual(bisectRight(boxes, box(3)), 4)
})

it("bisector(comparator).right(empty, value) returns zero", () => {
  assert.strictEqual(
    bisector(() => {
      throw new Error()
    }).right([], 1),
    0
  )
})

it("bisector(comparator).right(array, value) returns the insertion point of a non-exact match", () => {
  const boxes = [1, 2, 3].map(box)
  const bisectRight = bisector(ascendingBox).right
  assert.strictEqual(bisectRight(boxes, box(0.5)), 0)
  assert.strictEqual(bisectRight(boxes, box(1.5)), 1)
  assert.strictEqual(bisectRight(boxes, box(2.5)), 2)
  assert.strictEqual(bisectRight(boxes, box(3.5)), 3)
})

it("bisector(comparator).right(array, value, lo) observes the specified lower bound", () => {
  const boxes = [1, 2, 3, 4, 5].map(box)
  const bisectRight = bisector(ascendingBox).right
  assert.strictEqual(bisectRight(boxes, box(0), 2), 2)
  assert.strictEqual(bisectRight(boxes, box(1), 2), 2)
  assert.strictEqual(bisectRight(boxes, box(2), 2), 2)
  assert.strictEqual(bisectRight(boxes, box(3), 2), 3)
  assert.strictEqual(bisectRight(boxes, box(4), 2), 4)
  assert.strictEqual(bisectRight(boxes, box(5), 2), 5)
  assert.strictEqual(bisectRight(boxes, box(6), 2), 5)
})

it("bisector(comparator).right(array, value, lo, hi) observes the specified bounds", () => {
  const boxes = [1, 2, 3, 4, 5].map(box)
  const bisectRight = bisector(ascendingBox).right
  assert.strictEqual(bisectRight(boxes, box(0), 2, 3), 2)
  assert.strictEqual(bisectRight(boxes, box(1), 2, 3), 2)
  assert.strictEqual(bisectRight(boxes, box(2), 2, 3), 2)
  assert.strictEqual(bisectRight(boxes, box(3), 2, 3), 3)
  assert.strictEqual(bisectRight(boxes, box(4), 2, 3), 3)
  assert.strictEqual(bisectRight(boxes, box(5), 2, 3), 3)
  assert.strictEqual(bisectRight(boxes, box(6), 2, 3), 3)
})

it("bisector(comparator).right(array, value) handles large sparse d3", () => {
  const boxes = []
  const bisectRight = bisector(ascendingBox).right
  let i = 1 << 30
  boxes[i++] = box(1)
  boxes[i++] = box(2)
  boxes[i++] = box(3)
  boxes[i++] = box(4)
  boxes[i++] = box(5)
  assert.strictEqual(bisectRight(boxes, box(0), i - 5, i), i - 5)
  assert.strictEqual(bisectRight(boxes, box(1), i - 5, i), i - 4)
  assert.strictEqual(bisectRight(boxes, box(2), i - 5, i), i - 3)
  assert.strictEqual(bisectRight(boxes, box(3), i - 5, i), i - 2)
  assert.strictEqual(bisectRight(boxes, box(4), i - 5, i), i - 1)
  assert.strictEqual(bisectRight(boxes, box(5), i - 5, i), i - 0)
  assert.strictEqual(bisectRight(boxes, box(6), i - 5, i), i - 0)
})

it("bisector(comparator).left(array, value) supports an asymmetric (object, value) comparator", () => {
  const boxes = [1, 2, 3].map(box)
  const bisectLeft = bisector(ascendingBoxValue).left
  assert.strictEqual(bisectLeft(boxes, 1), 0)
  assert.strictEqual(bisectLeft(boxes, 2), 1)
  assert.strictEqual(bisectLeft(boxes, 3), 2)
})

// This is not possible because the bisector has no way of knowing whether the
// given comparator is symmetric or asymmetric, and if the comparator is
// asymmetric it cannot be used to test the search value for orderability.
it.skip("bisector(comparator).left(array, value) keeps non-comparable values to the right", () => {
  const boxes = [1, 2, null, undefined, NaN].map(box)
  const bisectLeft = bisector(ascendingBox).left
  assert.strictEqual(bisectLeft(boxes, box(1)), 0)
  assert.strictEqual(bisectLeft(boxes, box(2)), 1)
  assert.strictEqual(bisectLeft(boxes, box(null)), 5)
  assert.strictEqual(bisectLeft(boxes, box(undefined)), 5)
  assert.strictEqual(bisectLeft(boxes, box(NaN)), 5)
})

it("bisector(accessor).left(array, value) keeps non-comparable values to the right", () => {
  const boxes = [1, 2, null, undefined, NaN].map(box)
  const bisectLeft = bisector(unbox).left
  assert.strictEqual(bisectLeft(boxes, 1), 0)
  assert.strictEqual(bisectLeft(boxes, 2), 1)
  assert.strictEqual(bisectLeft(boxes, null), 5)
  assert.strictEqual(bisectLeft(boxes, undefined), 5)
  assert.strictEqual(bisectLeft(boxes, NaN), 5)
})

it("bisector(accessor).left(array, value) returns the index of an exact match", () => {
  const boxes = [1, 2, 3].map(box)
  const bisectLeft = bisector(unbox).left
  assert.strictEqual(bisectLeft(boxes, 1), 0)
  assert.strictEqual(bisectLeft(boxes, 2), 1)
  assert.strictEqual(bisectLeft(boxes, 3), 2)
})

it("bisector(accessor).left(array, value) returns the index of the first match", () => {
  const boxes = [1, 2, 2, 3].map(box)
  const bisectLeft = bisector(unbox).left
  assert.strictEqual(bisectLeft(boxes, 1), 0)
  assert.strictEqual(bisectLeft(boxes, 2), 1)
  assert.strictEqual(bisectLeft(boxes, 3), 3)
})

it("bisector(accessor).left(array, value) returns the insertion point of a non-exact match", () => {
  const boxes = [1, 2, 3].map(box)
  const bisectLeft = bisector(unbox).left
  assert.strictEqual(bisectLeft(boxes, 0.5), 0)
  assert.strictEqual(bisectLeft(boxes, 1.5), 1)
  assert.strictEqual(bisectLeft(boxes, 2.5), 2)
  assert.strictEqual(bisectLeft(boxes, 3.5), 3)
})

it("bisector(accessor).left(array, value) has undefined behavior if the search value is unorderable", () => {
  const boxes = [1, 2, 3].map(box)
  const bisectLeft = bisector(unbox).left
  bisectLeft(boxes, new Date(NaN)) // who knows what this will return!
  bisectLeft(boxes, undefined)
  bisectLeft(boxes, NaN)
})

it("bisector(accessor).left(array, value, lo) observes the specified lower bound", () => {
  const boxes = [1, 2, 3, 4, 5].map(box)
  const bisectLeft = bisector(unbox).left
  assert.strictEqual(bisectLeft(boxes, 0, 2), 2)
  assert.strictEqual(bisectLeft(boxes, 1, 2), 2)
  assert.strictEqual(bisectLeft(boxes, 2, 2), 2)
  assert.strictEqual(bisectLeft(boxes, 3, 2), 2)
  assert.strictEqual(bisectLeft(boxes, 4, 2), 3)
  assert.strictEqual(bisectLeft(boxes, 5, 2), 4)
  assert.strictEqual(bisectLeft(boxes, 6, 2), 5)
})

it("bisector(accessor).left(array, value, lo, hi) observes the specified bounds", () => {
  const boxes = [1, 2, 3, 4, 5].map(box)
  const bisectLeft = bisector(unbox).left
  assert.strictEqual(bisectLeft(boxes, 0, 2, 3), 2)
  assert.strictEqual(bisectLeft(boxes, 1, 2, 3), 2)
  assert.strictEqual(bisectLeft(boxes, 2, 2, 3), 2)
  assert.strictEqual(bisectLeft(boxes, 3, 2, 3), 2)
  assert.strictEqual(bisectLeft(boxes, 4, 2, 3), 3)
  assert.strictEqual(bisectLeft(boxes, 5, 2, 3), 3)
  assert.strictEqual(bisectLeft(boxes, 6, 2, 3), 3)
})

it("bisector(accessor).left(array, value) handles large sparse d3", () => {
  const boxes = []
  const bisectLeft = bisector(unbox).left
  let i = 1 << 30
  boxes[i++] = box(1)
  boxes[i++] = box(2)
  boxes[i++] = box(3)
  boxes[i++] = box(4)
  boxes[i++] = box(5)
  assert.strictEqual(bisectLeft(boxes, 0, i - 5, i), i - 5)
  assert.strictEqual(bisectLeft(boxes, 1, i - 5, i), i - 5)
  assert.strictEqual(bisectLeft(boxes, 2, i - 5, i), i - 4)
  assert.strictEqual(bisectLeft(boxes, 3, i - 5, i), i - 3)
  assert.strictEqual(bisectLeft(boxes, 4, i - 5, i), i - 2)
  assert.strictEqual(bisectLeft(boxes, 5, i - 5, i), i - 1)
  assert.strictEqual(bisectLeft(boxes, 6, i - 5, i), i - 0)
})

it("bisector(accessor).right(array, value) returns the index after an exact match", () => {
  const boxes = [1, 2, 3].map(box)
  const bisectRight = bisector(unbox).right
  assert.strictEqual(bisectRight(boxes, 1), 1)
  assert.strictEqual(bisectRight(boxes, 2), 2)
  assert.strictEqual(bisectRight(boxes, 3), 3)
})

it("bisector(accessor).right(array, value) returns the index after the last match", () => {
  const boxes = [1, 2, 2, 3].map(box)
  const bisectRight = bisector(unbox).right
  assert.strictEqual(bisectRight(boxes, 1), 1)
  assert.strictEqual(bisectRight(boxes, 2), 3)
  assert.strictEqual(bisectRight(boxes, 3), 4)
})

it("bisector(accessor).right(array, value) returns the insertion point of a non-exact match", () => {
  const boxes = [1, 2, 3].map(box)
  const bisectRight = bisector(unbox).right
  assert.strictEqual(bisectRight(boxes, 0.5), 0)
  assert.strictEqual(bisectRight(boxes, 1.5), 1)
  assert.strictEqual(bisectRight(boxes, 2.5), 2)
  assert.strictEqual(bisectRight(boxes, 3.5), 3)
})

it("bisector(accessor).right(array, value, lo) observes the specified lower bound", () => {
  const boxes = [1, 2, 3, 4, 5].map(box)
  const bisectRight = bisector(unbox).right
  assert.strictEqual(bisectRight(boxes, 0, 2), 2)
  assert.strictEqual(bisectRight(boxes, 1, 2), 2)
  assert.strictEqual(bisectRight(boxes, 2, 2), 2)
  assert.strictEqual(bisectRight(boxes, 3, 2), 3)
  assert.strictEqual(bisectRight(boxes, 4, 2), 4)
  assert.strictEqual(bisectRight(boxes, 5, 2), 5)
  assert.strictEqual(bisectRight(boxes, 6, 2), 5)
})

it("bisector(accessor).right(array, value, lo, hi) observes the specified bounds", () => {
  const boxes = [1, 2, 3, 4, 5].map(box)
  const bisectRight = bisector(unbox).right
  assert.strictEqual(bisectRight(boxes, 0, 2, 3), 2)
  assert.strictEqual(bisectRight(boxes, 1, 2, 3), 2)
  assert.strictEqual(bisectRight(boxes, 2, 2, 3), 2)
  assert.strictEqual(bisectRight(boxes, 3, 2, 3), 3)
  assert.strictEqual(bisectRight(boxes, 4, 2, 3), 3)
  assert.strictEqual(bisectRight(boxes, 5, 2, 3), 3)
  assert.strictEqual(bisectRight(boxes, 6, 2, 3), 3)
})

it("bisector(accessor).right(array, value) handles large sparse d3", () => {
  const boxes = []
  const bisectRight = bisector(unbox).right
  let i = 1 << 30
  boxes[i++] = box(1)
  boxes[i++] = box(2)
  boxes[i++] = box(3)
  boxes[i++] = box(4)
  boxes[i++] = box(5)
  assert.strictEqual(bisectRight(boxes, 0, i - 5, i), i - 5)
  assert.strictEqual(bisectRight(boxes, 1, i - 5, i), i - 4)
  assert.strictEqual(bisectRight(boxes, 2, i - 5, i), i - 3)
  assert.strictEqual(bisectRight(boxes, 3, i - 5, i), i - 2)
  assert.strictEqual(bisectRight(boxes, 4, i - 5, i), i - 1)
  assert.strictEqual(bisectRight(boxes, 5, i - 5, i), i - 0)
  assert.strictEqual(bisectRight(boxes, 6, i - 5, i), i - 0)
})

it("bisector(accessor).center(array, value) returns the closest index", () => {
  const data = [0, 1, 2, 3, 4]
  const bisectCenter = bisector(d => +d).center
  assert.strictEqual(bisectCenter(data, 2), 2)
  assert.strictEqual(bisectCenter(data, 2.2), 2)
  assert.strictEqual(bisectCenter(data, 2.6), 3)
  assert.strictEqual(bisectCenter(data, 3), 3)
  assert.strictEqual(bisectCenter(data, 4), 4)
  assert.strictEqual(bisectCenter(data, 4.5), 4)
})

it("bisector(comparator).center(array, value) returns the closest index", () => {
  const data = [0, 1, 2, 3, 4]
  const bisectCenter = bisector((d, x) => +d - x).center
  assert.strictEqual(bisectCenter(data, 2), 2)
  assert.strictEqual(bisectCenter(data, 2.2), 2)
  assert.strictEqual(bisectCenter(data, 2.6), 3)
  assert.strictEqual(bisectCenter(data, 3), 3)
})

it("bisector(comparator).center(empty, value) returns zero", () => {
  assert.strictEqual(
    bisector(() => {
      throw new Error()
    }).center([], 1),
    0
  )
})

it("bisector(ascending).center(array, value) returns the left value", () => {
  const data = [0, 1, 2, 3, 4]
  const bisectCenter = bisector(ascending).center
  assert.strictEqual(bisectCenter(data, 2.0), 2)
  assert.strictEqual(bisectCenter(data, 2.2), 3)
  assert.strictEqual(bisectCenter(data, 2.6), 3)
  assert.strictEqual(bisectCenter(data, 3.0), 3)
})

it("bisector(ordinalAccessor).center(array, value) returns the left value", () => {
  const data = ["aa", "bb", "cc", "dd", "ee"]
  const bisectCenter = bisector(d => d).center
  assert.strictEqual(bisectCenter(data, "cc"), 2)
  assert.strictEqual(bisectCenter(data, "ce"), 3)
  assert.strictEqual(bisectCenter(data, "cf"), 3)
  assert.strictEqual(bisectCenter(data, "dd"), 3)
})

function box(value) {
  return { value: value }
}

function unbox(box) {
  return box.value
}

function ascendingBox(a, b) {
  return ascending(a.value, b.value)
}

function ascendingBoxValue(a, value) {
  return ascending(a.value, value)
}
import assert from "assert"
import { blur, blur2 } from "../src/index.js"

it("blur(values, r) returns values", () => {
  const V = [0, 0, 0, 0, 0, 0, 27, 0, 0, 0, 0, 0, 0, 0]
  assert.strictEqual(blur(V, 1), V)
  assert.deepStrictEqual(V, [0, 0, 0, 1, 3, 6, 7, 6, 3, 1, 0, 0, 0, 0])
})

it("blur(values, r) observes the expected integer radius r", () => {
  assert.deepStrictEqual(
    blur([0, 0, 0, 0, 0, 0, 27, 0, 0, 0, 0, 0, 0, 0], 0.0).map(round),
    [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 27.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]
  )
  assert.deepStrictEqual(
    blur([0, 0, 0, 0, 0, 0, 27, 0, 0, 0, 0, 0, 0, 0], 1.0).map(round),
    [0.0, 0.0, 0.0, 1.0, 3.0, 6.0, 7.0, 6.0, 3.0, 1.0, 0.0, 0.0, 0.0, 0.0]
  )
  assert.deepStrictEqual(
    blur([0, 0, 0, 0, 0, 0, 27, 0, 0, 0, 0, 0, 0, 0], 2.0).map(round),
    [0.216, 0.648, 1.296, 2.16, 3.24, 3.888, 4.104, 3.888, 3.24, 2.16, 1.296, 0.648, 0.216, 0.0]
  )
  assert.deepStrictEqual(
    blur([0, 0, 0, 0, 0, 0, 27, 0, 0, 0, 0, 0, 0, 0], 3.0).map(round),
    [1.023, 1.338, 1.732, 2.204, 2.598, 2.834, 2.913, 2.834, 2.598, 2.204, 1.653, 1.181, 0.787, 0.472]
  )
})

it("blur(values, r) observes the expected fractional radius r", () => {
  assert.deepStrictEqual(
    blur([0, 0, 0, 0, 0, 0, 27, 0, 0, 0, 0, 0, 0, 0], 0.5).map(round),
    [0.0, 0.0, 0.0, 0.422, 2.531, 6.328, 8.438, 6.328, 2.531, 0.422, 0.0, 0.0, 0.0, 0.0]
  )
  assert.deepStrictEqual(
    blur([0, 0, 0, 0, 0, 0, 27, 0, 0, 0, 0, 0, 0, 0], 1.5).map(round),
    [0.053, 0.316, 0.949, 2.004, 3.322, 4.43, 4.852, 4.43, 3.322, 2.004, 0.949, 0.316, 0.053, 0.0]
  )
  assert.deepStrictEqual(
    blur([0, 0, 0, 0, 0, 0, 27, 0, 0, 0, 0, 0, 0, 0], 2.5).map(round),
    [0.672, 1.078, 1.609, 2.234, 2.813, 3.188, 3.313, 3.188, 2.813, 2.234, 1.594, 1.031, 0.594, 0.281]
  )
  assert.deepStrictEqual(
    blur([0, 0, 0, 0, 0, 0, 27, 0, 0, 0, 0, 0, 0, 0], 3.5).map(round),
    [1.266, 1.503, 1.78, 2.057, 2.294, 2.452, 2.505, 2.452, 2.294, 2.03, 1.701, 1.371, 1.081, 0.844]
  )
})

it("blur(values, r) repeats starting values before the window", () => {
  assert.deepStrictEqual(blur([27, 0, 0, 0, 0, 0, 0, 0], 0.0).map(round), [27.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0])
  assert.deepStrictEqual(blur([27, 0, 0, 0, 0, 0, 0, 0], 1.0).map(round), [13.0, 9.0, 4.0, 1.0, 0.0, 0.0, 0.0, 0.0])
  assert.deepStrictEqual(
    blur([27, 0, 0, 0, 0, 0, 0, 0], 2.0).map(round),
    [11.016, 9.072, 6.696, 4.104, 2.16, 0.864, 0.216, 0.0]
  )
  assert.deepStrictEqual(
    blur([27, 0, 0, 0, 0, 0, 0, 0], 3.0).map(round),
    [10.233, 8.974, 7.478, 5.825, 4.093, 2.676, 1.574, 0.787]
  )
})

it("blur(values, r) approximately preserves total value", () => {
  assert.strictEqual(
    blur([0, 0, 0, 0, 0, 0, 27, 0, 0, 0, 0, 0, 0, 0], 0.0).reduce((p, v) => p + v),
    27
  )
  assert.strictEqual(
    blur([0, 0, 0, 0, 0, 0, 27, 0, 0, 0, 0, 0, 0, 0], 0.5).reduce((p, v) => p + v),
    27
  )
  assert.strictEqual(
    blur([0, 0, 0, 0, 0, 0, 27, 0, 0, 0, 0, 0, 0, 0], 1.0).reduce((p, v) => p + v),
    27
  )
  assert.strictEqual(
    blur([0, 0, 0, 0, 0, 0, 27, 0, 0, 0, 0, 0, 0, 0], 1.5).reduce((p, v) => p + v),
    27
  )
  assert.strictEqual(
    blur([0, 0, 0, 0, 0, 0, 27, 0, 0, 0, 0, 0, 0, 0], 2.0).reduce((p, v) => p + v),
    27.000000000000004
  )
  assert.strictEqual(
    blur([0, 0, 0, 0, 0, 0, 27, 0, 0, 0, 0, 0, 0, 0], 2.5).reduce((p, v) => p + v),
    26.640625
  )
  assert.strictEqual(
    blur([0, 0, 0, 0, 0, 0, 27, 0, 0, 0, 0, 0, 0, 0], 3.0).reduce((p, v) => p + v),
    26.370262390670547
  )
})

const unit = {
  width: 11,
  height: 11,
  data: [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0,
  ],
}

it("blur2(data, r) modifies in-place", () => {
  const copy = copy2(unit)
  assert.strictEqual(blur2(copy, 1), copy)
})

it("data.height is redundant for blur2", () => {
  const copy = copy2(unit)
  delete copy.height
  assert.deepStrictEqual(
    blur2(copy, 1).data.map(round),
    [
      0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
      0.0, 0.001, 0.004, 0.008, 0.01, 0.008, 0.004, 0.001, 0.0, 0.0, 0.0, 0.0, 0.004, 0.012, 0.025, 0.029, 0.025, 0.012,
      0.004, 0.0, 0.0, 0.0, 0.0, 0.008, 0.025, 0.049, 0.058, 0.049, 0.025, 0.008, 0.0, 0.0, 0.0, 0.0, 0.01, 0.029,
      0.058, 0.067, 0.058, 0.029, 0.01, 0.0, 0.0, 0.0, 0.0, 0.008, 0.025, 0.049, 0.058, 0.049, 0.025, 0.008, 0.0, 0.0,
      0.0, 0.0, 0.004, 0.012, 0.025, 0.029, 0.025, 0.012, 0.004, 0.0, 0.0, 0.0, 0.0, 0.001, 0.004, 0.008, 0.01, 0.008,
      0.004, 0.001, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
      0.0, 0.0, 0.0, 0.0,
    ]
  )
})

it("blur2(data, r) observes the expected integer radius r", () => {
  assert.deepStrictEqual(blur2(copy2(unit), 0), unit)
  assert.deepStrictEqual(
    blur2(copy2(unit), 1).data.map(round),
    [
      0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
      0.0, 0.001, 0.004, 0.008, 0.01, 0.008, 0.004, 0.001, 0.0, 0.0, 0.0, 0.0, 0.004, 0.012, 0.025, 0.029, 0.025, 0.012,
      0.004, 0.0, 0.0, 0.0, 0.0, 0.008, 0.025, 0.049, 0.058, 0.049, 0.025, 0.008, 0.0, 0.0, 0.0, 0.0, 0.01, 0.029,
      0.058, 0.067, 0.058, 0.029, 0.01, 0.0, 0.0, 0.0, 0.0, 0.008, 0.025, 0.049, 0.058, 0.049, 0.025, 0.008, 0.0, 0.0,
      0.0, 0.0, 0.004, 0.012, 0.025, 0.029, 0.025, 0.012, 0.004, 0.0, 0.0, 0.0, 0.0, 0.001, 0.004, 0.008, 0.01, 0.008,
      0.004, 0.001, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
      0.0, 0.0, 0.0, 0.0,
    ]
  )
  assert.deepStrictEqual(
    blur2(copy2(unit), 2).data.map(round),
    [
      0.001, 0.001, 0.002, 0.003, 0.003, 0.004, 0.003, 0.003, 0.002, 0.001, 0.001, 0.001, 0.002, 0.004, 0.006, 0.007,
      0.007, 0.007, 0.006, 0.004, 0.002, 0.001, 0.002, 0.004, 0.006, 0.01, 0.012, 0.012, 0.012, 0.01, 0.006, 0.004,
      0.002, 0.003, 0.006, 0.01, 0.014, 0.017, 0.018, 0.017, 0.014, 0.01, 0.006, 0.003, 0.003, 0.007, 0.012, 0.017,
      0.021, 0.022, 0.021, 0.017, 0.012, 0.007, 0.003, 0.004, 0.007, 0.012, 0.018, 0.022, 0.023, 0.022, 0.018, 0.012,
      0.007, 0.004, 0.003, 0.007, 0.012, 0.017, 0.021, 0.022, 0.021, 0.017, 0.012, 0.007, 0.003, 0.003, 0.006, 0.01,
      0.014, 0.017, 0.018, 0.017, 0.014, 0.01, 0.006, 0.003, 0.002, 0.004, 0.006, 0.01, 0.012, 0.012, 0.012, 0.01,
      0.006, 0.004, 0.002, 0.001, 0.002, 0.004, 0.006, 0.007, 0.007, 0.007, 0.006, 0.004, 0.002, 0.001, 0.001, 0.001,
      0.002, 0.003, 0.003, 0.004, 0.003, 0.003, 0.002, 0.001, 0.001,
    ]
  )
})

it("blur2(data, rx, 0) does horizontal blurring", () => {
  assert.deepStrictEqual(
    blur2(copy2(unit), 0, 0).data,
    [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0,
    ]
  )
  assert.deepStrictEqual(
    blur2(copy2(unit), 1, 0).data.map(round),
    [
      0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
      0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
      0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.037, 0.111, 0.222, 0.259, 0.222, 0.111, 0.037, 0.0, 0.0,
      0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
      0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
      0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
    ]
  )
  assert.deepStrictEqual(
    blur2(copy2(unit), 2, 0).data.map(round),
    [
      0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
      0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
      0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.024, 0.048, 0.08, 0.12, 0.144, 0.152, 0.144, 0.12, 0.08, 0.048,
      0.024, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
      0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
      0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
    ]
  )
})

it("blur2(data, 0, ry) does vertical blurring", () => {
  assert.deepStrictEqual(
    blur2(copy2(unit), 0, 0).data,
    [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0,
    ]
  )
  assert.deepStrictEqual(
    blur2(copy2(unit), 0, 1).data.map(round),
    [
      0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
      0.0, 0.0, 0.0, 0.0, 0.037, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.111, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
      0.0, 0.0, 0.0, 0.0, 0.222, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.259, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
      0.0, 0.0, 0.0, 0.0, 0.222, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.111, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
      0.0, 0.0, 0.0, 0.0, 0.037, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
      0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
    ]
  )
  assert.deepStrictEqual(
    blur2(copy2(unit), 0, 2).data.map(round),
    [
      0.0, 0.0, 0.0, 0.0, 0.0, 0.024, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.048, 0.0, 0.0, 0.0, 0.0, 0.0,
      0.0, 0.0, 0.0, 0.0, 0.0, 0.08, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.12, 0.0, 0.0, 0.0, 0.0, 0.0,
      0.0, 0.0, 0.0, 0.0, 0.0, 0.144, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.152, 0.0, 0.0, 0.0, 0.0, 0.0,
      0.0, 0.0, 0.0, 0.0, 0.0, 0.144, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.12, 0.0, 0.0, 0.0, 0.0, 0.0,
      0.0, 0.0, 0.0, 0.0, 0.0, 0.08, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.048, 0.0, 0.0, 0.0, 0.0, 0.0,
      0.0, 0.0, 0.0, 0.0, 0.0, 0.024, 0.0, 0.0, 0.0, 0.0, 0.0,
    ]
  )
})

function copy2({ data, width, height }) {
  return { data: data.slice(), width, height }
}

function round(x) {
  return Math.round(x * 1000) / 1000 || 0
}
import assert from "assert"
import { count } from "../src/index.js"

it("count() accepts an iterable", () => {
  assert.deepStrictEqual(count([1, 2]), 2)
  assert.deepStrictEqual(count(new Set([1, 2])), 2)
  assert.deepStrictEqual(count(generate(1, 2)), 2)
})

it("count() ignores NaN, null", () => {
  assert.deepStrictEqual(count([NaN, null, 0, 1]), 2)
})

it("count() coerces to a number", () => {
  assert.deepStrictEqual(count(["1", " 2", "Fred"]), 2)
})

it("count() accepts an accessor", () => {
  assert.deepStrictEqual(
    count([{ v: NaN }, {}, { v: 0 }, { v: 1 }], d => d.v),
    2
  )
  assert.deepStrictEqual(
    count([{ n: "Alice", age: NaN }, { n: "Bob", age: 18 }, { n: "Other" }], d => d.age),
    1
  )
})

function* generate(...values) {
  yield* values
}
import assert from "assert"
import { cross } from "../src/index.js"

it("cross() returns an empty array", () => {
  assert.deepStrictEqual(cross(), [])
})

it("cross([]) returns an empty array", () => {
  assert.deepStrictEqual(cross([]), [])
})

it("cross([1, 2], []) returns an empty array", () => {
  assert.deepStrictEqual(cross([1, 2], []), [])
})

it("cross({length: weird}) returns an empty array", () => {
  assert.deepStrictEqual(cross({ length: NaN }), [])
  assert.deepStrictEqual(cross({ length: 0.5 }), [])
  assert.deepStrictEqual(cross({ length: -1 }), [])
  assert.deepStrictEqual(cross({ length: undefined }), [])
})

it("cross(...strings) returns the expected result", () => {
  assert.deepStrictEqual(
    cross("foo", "bar", (a, b) => a + b),
    ["fb", "fa", "fr", "ob", "oa", "or", "ob", "oa", "or"]
  )
})

it("cross(a) returns the expected result", () => {
  assert.deepStrictEqual(cross([1, 2]), [[1], [2]])
})

it("cross(a, b) returns Cartesian product a×b", () => {
  assert.deepStrictEqual(cross([1, 2], ["x", "y"]), [
    [1, "x"],
    [1, "y"],
    [2, "x"],
    [2, "y"],
  ])
})

it("cross(a, b, c) returns Cartesian product a×b×c", () => {
  assert.deepStrictEqual(cross([1, 2], [3, 4], [5, 6, 7]), [
    [1, 3, 5],
    [1, 3, 6],
    [1, 3, 7],
    [1, 4, 5],
    [1, 4, 6],
    [1, 4, 7],
    [2, 3, 5],
    [2, 3, 6],
    [2, 3, 7],
    [2, 4, 5],
    [2, 4, 6],
    [2, 4, 7],
  ])
})

it("cross(a, b, f) invokes the specified function for each pair", () => {
  assert.deepStrictEqual(
    cross([1, 2], ["x", "y"], (a, b) => a + b),
    ["1x", "1y", "2x", "2y"]
  )
})

it("cross(a, b, c, f) invokes the specified function for each triple", () => {
  assert.deepStrictEqual(
    cross([1, 2], [3, 4], [5, 6, 7], (a, b, c) => a + b + c),
    [9, 10, 11, 10, 11, 12, 10, 11, 12, 11, 12, 13]
  )
})

it("cross(a, b) returns Cartesian product a×b of generators", () => {
  assert.deepStrictEqual(cross(generate(1, 2), generate("x", "y")), [
    [1, "x"],
    [1, "y"],
    [2, "x"],
    [2, "y"],
  ])
})

function* generate(...values) {
  yield* values
}
import assert from "assert"
import { cumsum } from "../src/index.js"

it("cumsum(array) returns the cumulative sum of the specified numbers", () => {
  assert.deepStrictEqual(Array.from(cumsum([1])), [1])
  assert.deepStrictEqual(Array.from(cumsum([5, 1, 2, 3, 4])), [5, 6, 8, 11, 15])
  assert.deepStrictEqual(Array.from(cumsum([20, 3])), [20, 23])
  assert.deepStrictEqual(Array.from(cumsum([3, 20])), [3, 23])
})

it("cumsum(array) observes values that can be coerced to numbers", () => {
  assert.deepStrictEqual(Array.from(cumsum(["20", "3"])), [20, 23])
  assert.deepStrictEqual(Array.from(cumsum(["3", "20"])), [3, 23])
  assert.deepStrictEqual(Array.from(cumsum(["3", 20])), [3, 23])
  assert.deepStrictEqual(Array.from(cumsum([20, "3"])), [20, 23])
  assert.deepStrictEqual(Array.from(cumsum([3, "20"])), [3, 23])
  assert.deepStrictEqual(Array.from(cumsum(["20", 3])), [20, 23])
})

it("cumsum(array) ignores non-numeric values", () => {
  assert.deepStrictEqual(Array.from(cumsum(["a", "b", "c"])), [0, 0, 0])
  assert.deepStrictEqual(Array.from(cumsum(["a", 1, "2"])), [0, 1, 3])
})

it("cumsum(array) ignores null, undefined and NaN", () => {
  assert.deepStrictEqual(Array.from(cumsum([NaN, 1, 2, 3, 4, 5])), [0, 1, 3, 6, 10, 15])
  assert.deepStrictEqual(Array.from(cumsum([1, 2, 3, 4, 5, NaN])), [1, 3, 6, 10, 15, 15])
  assert.deepStrictEqual(Array.from(cumsum([10, null, 3, undefined, 5, NaN])), [10, 10, 13, 13, 18, 18])
})

it("cumsum(array) returns zeros if there are no numbers", () => {
  assert.deepStrictEqual(Array.from(cumsum([])), [])
  assert.deepStrictEqual(Array.from(cumsum([NaN])), [0])
  assert.deepStrictEqual(Array.from(cumsum([undefined])), [0])
  assert.deepStrictEqual(Array.from(cumsum([undefined, NaN])), [0, 0])
  assert.deepStrictEqual(Array.from(cumsum([undefined, NaN, {}])), [0, 0, 0])
})

it("cumsum(array, f) returns the cumsum of the specified numbers", () => {
  assert.deepStrictEqual(Array.from(cumsum([1].map(box), unbox)), [1])
  assert.deepStrictEqual(Array.from(cumsum([5, 1, 2, 3, 4].map(box), unbox)), [5, 6, 8, 11, 15])
  assert.deepStrictEqual(Array.from(cumsum([20, 3].map(box), unbox)), [20, 23])
  assert.deepStrictEqual(Array.from(cumsum([3, 20].map(box), unbox)), [3, 23])
})

it("cumsum(array, f) observes values that can be coerced to numbers", () => {
  assert.deepStrictEqual(Array.from(cumsum(["20", "3"].map(box), unbox)), [20, 23])
  assert.deepStrictEqual(Array.from(cumsum(["3", "20"].map(box), unbox)), [3, 23])
  assert.deepStrictEqual(Array.from(cumsum(["3", 20].map(box), unbox)), [3, 23])
  assert.deepStrictEqual(Array.from(cumsum([20, "3"].map(box), unbox)), [20, 23])
  assert.deepStrictEqual(Array.from(cumsum([3, "20"].map(box), unbox)), [3, 23])
  assert.deepStrictEqual(Array.from(cumsum(["20", 3].map(box), unbox)), [20, 23])
})

it("cumsum(array, f) ignores non-numeric values", () => {
  assert.deepStrictEqual(Array.from(cumsum(["a", "b", "c"].map(box), unbox)), [0, 0, 0])
  assert.deepStrictEqual(Array.from(cumsum(["a", 1, "2"].map(box), unbox)), [0, 1, 3])
})

it("cumsum(array, f) ignores null, undefined and NaN", () => {
  assert.deepStrictEqual(Array.from(cumsum([NaN, 1, 2, 3, 4, 5].map(box), unbox)), [0, 1, 3, 6, 10, 15])
  assert.deepStrictEqual(Array.from(cumsum([1, 2, 3, 4, 5, NaN].map(box), unbox)), [1, 3, 6, 10, 15, 15])
  assert.deepStrictEqual(Array.from(cumsum([10, null, 3, undefined, 5, NaN].map(box), unbox)), [10, 10, 13, 13, 18, 18])
})

it("cumsum(array, f) returns zeros if there are no numbers", () => {
  assert.deepStrictEqual(Array.from(cumsum([].map(box), unbox)), [])
  assert.deepStrictEqual(Array.from(cumsum([NaN].map(box), unbox)), [0])
  assert.deepStrictEqual(Array.from(cumsum([undefined].map(box), unbox)), [0])
  assert.deepStrictEqual(Array.from(cumsum([undefined, NaN].map(box), unbox)), [0, 0])
  assert.deepStrictEqual(Array.from(cumsum([undefined, NaN, {}].map(box), unbox)), [0, 0, 0])
})

it("cumsum(array, f) passes the accessor d, i, and array", () => {
  const results = []
  const array = ["a", "b", "c"]
  cumsum(array, (d, i, array) => results.push([d, i, array]))
  assert.deepStrictEqual(results, [
    ["a", 0, array],
    ["b", 1, array],
    ["c", 2, array],
  ])
})

it("cumsum(array, f) uses the undefined context", () => {
  const results = []
  cumsum([1, 2], function () {
    results.push(this)
  })
  assert.deepStrictEqual(results, [undefined, undefined])
})

function box(value) {
  return { value: value }
}

function unbox(box) {
  return box.value
}
import assert from "assert"
import { descending } from "../src/index.js"

it("descending(a, b) returns a positive number if a < b", () => {
  assert(descending(0, 1) > 0)
  assert(descending("a", "b") > 0)
})

it("descending(a, b) returns a negative number if a > b", () => {
  assert(descending(1, 0) < 0)
  assert(descending("b", "a") < 0)
})

it("descending(a, b) returns zero if a >= b and a <= b", () => {
  assert.strictEqual(descending(0, 0), 0)
  assert.strictEqual(descending("a", "a"), 0)
  assert.strictEqual(descending("0", 0), 0)
  assert.strictEqual(descending(0, "0"), 0)
})

it("descending(a, b) returns NaN if a and b are not comparable", () => {
  assert(isNaN(descending(0, undefined)))
  assert(isNaN(descending(undefined, 0)))
  assert(isNaN(descending(undefined, undefined)))
  assert(isNaN(descending(0, NaN)))
  assert(isNaN(descending(NaN, 0)))
  assert(isNaN(descending(NaN, NaN)))
})
import assert from "assert"
import { deviation } from "../src/index.js"

it("deviation(array) returns the standard deviation of the specified numbers", () => {
  assert.strictEqual(deviation([5, 1, 2, 3, 4]), Math.sqrt(2.5))
  assert.strictEqual(deviation([20, 3]), Math.sqrt(144.5))
  assert.strictEqual(deviation([3, 20]), Math.sqrt(144.5))
})

it("deviation(array) ignores null, undefined and NaN", () => {
  assert.strictEqual(deviation([NaN, 1, 2, 3, 4, 5]), Math.sqrt(2.5))
  assert.strictEqual(deviation([1, 2, 3, 4, 5, NaN]), Math.sqrt(2.5))
  assert.strictEqual(deviation([10, null, 3, undefined, 5, NaN]), Math.sqrt(13))
})

it("deviation(array) can handle large numbers without overflowing", () => {
  assert.strictEqual(deviation([Number.MAX_VALUE, Number.MAX_VALUE]), 0)
  assert.strictEqual(deviation([-Number.MAX_VALUE, -Number.MAX_VALUE]), 0)
})

it("deviation(array) returns undefined if the array has fewer than two numbers", () => {
  assert.strictEqual(deviation([1]), undefined)
  assert.strictEqual(deviation([]), undefined)
  assert.strictEqual(deviation([null]), undefined)
  assert.strictEqual(deviation([undefined]), undefined)
  assert.strictEqual(deviation([NaN]), undefined)
  assert.strictEqual(deviation([NaN, NaN]), undefined)
})

it("deviation(array, f) returns the deviation of the specified numbers", () => {
  assert.strictEqual(deviation([5, 1, 2, 3, 4].map(box), unbox), Math.sqrt(2.5))
  assert.strictEqual(deviation([20, 3].map(box), unbox), Math.sqrt(144.5))
  assert.strictEqual(deviation([3, 20].map(box), unbox), Math.sqrt(144.5))
})

it("deviation(array, f) ignores null, undefined and NaN", () => {
  assert.strictEqual(deviation([NaN, 1, 2, 3, 4, 5].map(box), unbox), Math.sqrt(2.5))
  assert.strictEqual(deviation([1, 2, 3, 4, 5, NaN].map(box), unbox), Math.sqrt(2.5))
  assert.strictEqual(deviation([10, null, 3, undefined, 5, NaN].map(box), unbox), Math.sqrt(13))
})

it("deviation(array, f) can handle large numbers without overflowing", () => {
  assert.strictEqual(deviation([Number.MAX_VALUE, Number.MAX_VALUE].map(box), unbox), 0)
  assert.strictEqual(deviation([-Number.MAX_VALUE, -Number.MAX_VALUE].map(box), unbox), 0)
})

it("deviation(array, f) returns undefined if the array has fewer than two numbers", () => {
  assert.strictEqual(deviation([1].map(box), unbox), undefined)
  assert.strictEqual(deviation([].map(box), unbox), undefined)
  assert.strictEqual(deviation([null].map(box), unbox), undefined)
  assert.strictEqual(deviation([undefined].map(box), unbox), undefined)
  assert.strictEqual(deviation([NaN].map(box), unbox), undefined)
  assert.strictEqual(deviation([NaN, NaN].map(box), unbox), undefined)
})

function box(value) {
  return { value: value }
}

function unbox(box) {
  return box.value
}
import { difference } from "../src/index.js"
import { assertSetEqual } from "./asserts.js"

it("difference(values, other) returns a set of values", () => {
  assertSetEqual(difference([1, 2, 3], [2, 1]), [3])
  assertSetEqual(difference([1, 2], [2, 3, 1]), [])
  assertSetEqual(difference([2, 1, 3], [4, 3, 1]), [2])
})

it("difference(...values) accepts iterables", () => {
  assertSetEqual(difference(new Set([1, 2, 3]), new Set([1])), [2, 3])
})

it("difference(values, other) performs interning", () => {
  assertSetEqual(
    difference(
      [new Date("2021-01-01"), new Date("2021-01-02"), new Date("2021-01-03")],
      [new Date("2021-01-02"), new Date("2021-01-01")]
    ),
    [new Date("2021-01-03")]
  )
  assertSetEqual(
    difference(
      [new Date("2021-01-01"), new Date("2021-01-02")],
      [new Date("2021-01-02"), new Date("2021-01-03"), new Date("2021-01-01")]
    ),
    []
  )
  assertSetEqual(
    difference(
      [new Date("2021-01-02"), new Date("2021-01-01"), new Date("2021-01-03")],
      [new Date("2021-01-04"), new Date("2021-01-03"), new Date("2021-01-01")]
    ),
    [new Date("2021-01-02")]
  )
})
import assert from "assert"
import { disjoint } from "../src/index.js"

it("disjoint(values, other) returns true if sets are disjoint", () => {
  assert.strictEqual(disjoint([1], [2]), true)
  assert.strictEqual(disjoint([2, 3], [3, 4]), false)
  assert.strictEqual(disjoint([1], []), true)
})

it("disjoint(values, other) allows values to be infinite", () => {
  assert.strictEqual(disjoint(odds(), [0, 2, 4, 5]), false)
})

it("disjoint(values, other) allows other to be infinite", () => {
  assert.strictEqual(disjoint([2], repeat(1, 3, 2)), false)
})

it("disjoint(values, other) performs interning", () => {
  assert.strictEqual(disjoint([new Date("2021-01-01")], [new Date("2021-01-02")]), true)
  assert.strictEqual(
    disjoint([new Date("2021-01-02"), new Date("2021-01-03")], [new Date("2021-01-03"), new Date("2021-01-04")]),
    false
  )
  assert.strictEqual(disjoint([new Date("2021-01-01")], []), true)
})

function* odds() {
  for (let i = 1; true; i += 2) {
    yield i
  }
}

function* repeat(...values) {
  while (true) {
    yield* values
  }
}
import assert from "assert"
import { every } from "../src/index.js"

it("every(values, test) returns true if all tests pass", () => {
  assert.strictEqual(
    every([1, 2, 3, 2, 1], x => x & 1),
    false
  )
  assert.strictEqual(
    every([1, 2, 3, 2, 1], x => x >= 1),
    true
  )
})

it("every(values, test) returns true if values is empty", () => {
  assert.strictEqual(
    every([], () => false),
    true
  )
})

it("every(values, test) accepts an iterable", () => {
  assert.strictEqual(
    every(new Set([1, 2, 3, 2, 1]), x => x >= 1),
    true
  )
  assert.strictEqual(
    every(
      (function* () {
        yield* [1, 2, 3, 2, 1]
      })(),
      x => x >= 1
    ),
    true
  )
  assert.strictEqual(
    every(Uint8Array.of(1, 2, 3, 2, 1), x => x >= 1),
    true
  )
})

it("every(values, test) enforces that test is a function", () => {
  assert.throws(() => every([]), TypeError)
})

it("every(values, test) enforces that values is iterable", () => {
  assert.throws(() => every({}, () => true), TypeError)
})

it("every(values, test) passes test (value, index, values)", () => {
  const calls = []
  const values = new Set([5, 4, 3, 2, 1])
  every(values, function () {
    return calls.push([this, ...arguments])
  })
  assert.deepStrictEqual(calls, [
    [undefined, 5, 0, values],
    [undefined, 4, 1, values],
    [undefined, 3, 2, values],
    [undefined, 2, 3, values],
    [undefined, 1, 4, values],
  ])
})

it("every(values, test) short-circuts when test returns falsey", () => {
  let calls = 0
  assert.strictEqual(
    every([1, 2, 3], x => (++calls, x < 2)),
    false
  )
  assert.strictEqual(calls, 2)
  assert.strictEqual(
    every([1, 2, 3], x => (++calls, x - 2)),
    false
  )
  assert.strictEqual(calls, 4)
})

it("every(values, test) does not skip sparse elements", () => {
  assert.deepStrictEqual(
    every([, 1, 2, ,], x => x === undefined || x >= 1),
    true
  )
  assert.deepStrictEqual(
    every([, 1, 2, ,], x => x >= 1),
    false
  )
})
import assert from "assert"
import { extent } from "../src/index.js"

it("extent(array) returns the least and greatest numeric values for numbers", () => {
  assert.deepStrictEqual(extent([1]), [1, 1])
  assert.deepStrictEqual(extent([5, 1, 2, 3, 4]), [1, 5])
  assert.deepStrictEqual(extent([20, 3]), [3, 20])
  assert.deepStrictEqual(extent([3, 20]), [3, 20])
})

it("extent(array) returns the least and greatest lexicographic value for strings", () => {
  assert.deepStrictEqual(extent(["c", "a", "b"]), ["a", "c"])
  assert.deepStrictEqual(extent(["20", "3"]), ["20", "3"])
  assert.deepStrictEqual(extent(["3", "20"]), ["20", "3"])
})

it("extent(array) ignores null, undefined and NaN", () => {
  const o = { valueOf: () => NaN }
  assert.deepStrictEqual(extent([NaN, 1, 2, 3, 4, 5]), [1, 5])
  assert.deepStrictEqual(extent([o, 1, 2, 3, 4, 5]), [1, 5])
  assert.deepStrictEqual(extent([1, 2, 3, 4, 5, NaN]), [1, 5])
  assert.deepStrictEqual(extent([1, 2, 3, 4, 5, o]), [1, 5])
  assert.deepStrictEqual(extent([10, null, 3, undefined, 5, NaN]), [3, 10])
  assert.deepStrictEqual(extent([-1, null, -3, undefined, -5, NaN]), [-5, -1])
})

it("extent(array) compares heterogenous types as numbers", () => {
  assert.deepStrictEqual(extent([20, "3"]), ["3", 20])
  assert.deepStrictEqual(extent(["20", 3]), [3, "20"])
  assert.deepStrictEqual(extent([3, "20"]), [3, "20"])
  assert.deepStrictEqual(extent(["3", 20]), ["3", 20])
})

it("extent(array) returns undefined if the array contains no numbers", () => {
  assert.deepStrictEqual(extent([]), [undefined, undefined])
  assert.deepStrictEqual(extent([null]), [undefined, undefined])
  assert.deepStrictEqual(extent([undefined]), [undefined, undefined])
  assert.deepStrictEqual(extent([NaN]), [undefined, undefined])
  assert.deepStrictEqual(extent([NaN, NaN]), [undefined, undefined])
})

it("extent(array, f) returns the least and greatest numeric value for numbers", () => {
  assert.deepStrictEqual(extent([1].map(box), unbox), [1, 1])
  assert.deepStrictEqual(extent([5, 1, 2, 3, 4].map(box), unbox), [1, 5])
  assert.deepStrictEqual(extent([20, 3].map(box), unbox), [3, 20])
  assert.deepStrictEqual(extent([3, 20].map(box), unbox), [3, 20])
})

it("extent(array, f) returns the least and greatest lexicographic value for strings", () => {
  assert.deepStrictEqual(extent(["c", "a", "b"].map(box), unbox), ["a", "c"])
  assert.deepStrictEqual(extent(["20", "3"].map(box), unbox), ["20", "3"])
  assert.deepStrictEqual(extent(["3", "20"].map(box), unbox), ["20", "3"])
})

it("extent(array, f) ignores null, undefined and NaN", () => {
  const o = { valueOf: () => NaN }
  assert.deepStrictEqual(extent([NaN, 1, 2, 3, 4, 5].map(box), unbox), [1, 5])
  assert.deepStrictEqual(extent([o, 1, 2, 3, 4, 5].map(box), unbox), [1, 5])
  assert.deepStrictEqual(extent([1, 2, 3, 4, 5, NaN].map(box), unbox), [1, 5])
  assert.deepStrictEqual(extent([1, 2, 3, 4, 5, o].map(box), unbox), [1, 5])
  assert.deepStrictEqual(extent([10, null, 3, undefined, 5, NaN].map(box), unbox), [3, 10])
  assert.deepStrictEqual(extent([-1, null, -3, undefined, -5, NaN].map(box), unbox), [-5, -1])
})

it("extent(array, f) compares heterogenous types as numbers", () => {
  assert.deepStrictEqual(extent([20, "3"].map(box), unbox), ["3", 20])
  assert.deepStrictEqual(extent(["20", 3].map(box), unbox), [3, "20"])
  assert.deepStrictEqual(extent([3, "20"].map(box), unbox), [3, "20"])
  assert.deepStrictEqual(extent(["3", 20].map(box), unbox), ["3", 20])
})

it("extent(array, f) returns undefined if the array contains no observed values", () => {
  assert.deepStrictEqual(extent([].map(box), unbox), [undefined, undefined])
  assert.deepStrictEqual(extent([null].map(box), unbox), [undefined, undefined])
  assert.deepStrictEqual(extent([undefined].map(box), unbox), [undefined, undefined])
  assert.deepStrictEqual(extent([NaN].map(box), unbox), [undefined, undefined])
  assert.deepStrictEqual(extent([NaN, NaN].map(box), unbox), [undefined, undefined])
})

it("extent(array, f) passes the accessor d, i, and array", () => {
  const results = []
  const array = ["a", "b", "c"]
  extent(array, (d, i, array) => results.push([d, i, array]))
  assert.deepStrictEqual(results, [
    ["a", 0, array],
    ["b", 1, array],
    ["c", 2, array],
  ])
})

it("extent(array, f) uses the undefined context", () => {
  const results = []
  extent([1, 2], function () {
    results.push(this)
  })
  assert.deepStrictEqual(results, [undefined, undefined])
})

function box(value) {
  return { value: value }
}

function unbox(box) {
  return box.value
}
import assert from "assert"
import { cumsum, fcumsum } from "../src/index.js"

it("fcumsum(array) returns a Float64Array of the expected length", () => {
  const A = [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1]
  const R = cumsum(A)
  assert(R instanceof Float64Array)
  assert.strictEqual(R.length, A.length)
})

it("fcumsum(array) is an exact cumsum", () => {
  assert.strictEqual(lastc([0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1]), 1)
  assert.strictEqual(
    lastc([
      0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3,
    ]),
    0
  )
  assert.strictEqual(lastc(["20", "3"].map(box), unbox), 23)
})

it("fcumsum(array) returns the fsum of the specified numbers", () => {
  assert.strictEqual(lastc([1]), 1)
  assert.strictEqual(lastc([5, 1, 2, 3, 4]), 15)
  assert.strictEqual(lastc([20, 3]), 23)
  assert.strictEqual(lastc([3, 20]), 23)
})

it("fcumsum(array) observes values that can be coerced to numbers", () => {
  assert.strictEqual(lastc(["20", "3"]), 23)
  assert.strictEqual(lastc(["3", "20"]), 23)
  assert.strictEqual(lastc(["3", 20]), 23)
  assert.strictEqual(lastc([20, "3"]), 23)
  assert.strictEqual(lastc([3, "20"]), 23)
  assert.strictEqual(lastc(["20", 3]), 23)
})

it("fcumsum(array) ignores non-numeric values", () => {
  assert.strictEqual(lastc(["a", "b", "c"]), 0)
  assert.strictEqual(lastc(["a", 1, "2"]), 3)
})

it("fcumsum(array) ignores null, undefined and NaN", () => {
  assert.strictEqual(lastc([NaN, 1, 2, 3, 4, 5]), 15)
  assert.strictEqual(lastc([1, 2, 3, 4, 5, NaN]), 15)
  assert.strictEqual(lastc([10, null, 3, undefined, 5, NaN]), 18)
})

it("fcumsum(array) returns an array of zeros if there are no numbers", () => {
  assert.deepStrictEqual(Array.from(fcumsum([])), [])
  assert.deepStrictEqual(Array.from(fcumsum([NaN])), [0])
  assert.deepStrictEqual(Array.from(fcumsum([undefined])), [0])
  assert.deepStrictEqual(Array.from(fcumsum([undefined, NaN])), [0, 0])
  assert.deepStrictEqual(Array.from(fcumsum([undefined, NaN, {}])), [0, 0, 0])
})

it("fcumsum(array, f) returns the fsum of the specified numbers", () => {
  assert.strictEqual(lastc([1].map(box), unbox), 1)
  assert.strictEqual(lastc([5, 1, 2, 3, 4].map(box), unbox), 15)
  assert.strictEqual(lastc([20, 3].map(box), unbox), 23)
  assert.strictEqual(lastc([3, 20].map(box), unbox), 23)
})

it("fcumsum(array, f) observes values that can be coerced to numbers", () => {
  assert.strictEqual(lastc(["20", "3"].map(box), unbox), 23)
  assert.strictEqual(lastc(["3", "20"].map(box), unbox), 23)
  assert.strictEqual(lastc(["3", 20].map(box), unbox), 23)
  assert.strictEqual(lastc([20, "3"].map(box), unbox), 23)
  assert.strictEqual(lastc([3, "20"].map(box), unbox), 23)
  assert.strictEqual(lastc(["20", 3].map(box), unbox), 23)
})

it("fcumsum(array, f) ignores non-numeric values", () => {
  assert.strictEqual(lastc(["a", "b", "c"].map(box), unbox), 0)
  assert.strictEqual(lastc(["a", 1, "2"].map(box), unbox), 3)
})

it("fcumsum(array, f) ignores null, undefined and NaN", () => {
  assert.strictEqual(lastc([NaN, 1, 2, 3, 4, 5].map(box), unbox), 15)
  assert.strictEqual(lastc([1, 2, 3, 4, 5, NaN].map(box), unbox), 15)
  assert.strictEqual(lastc([10, null, 3, undefined, 5, NaN].map(box), unbox), 18)
})

it("fcumsum(array, f) returns zero if there are no numbers", () => {
  assert.deepStrictEqual(Array.from(fcumsum([].map(box), unbox)), [])
  assert.deepStrictEqual(Array.from(fcumsum([NaN].map(box), unbox)), [0])
  assert.deepStrictEqual(Array.from(fcumsum([undefined].map(box), unbox)), [0])
  assert.deepStrictEqual(Array.from(fcumsum([undefined, NaN].map(box), unbox)), [0, 0])
  assert.deepStrictEqual(Array.from(fcumsum([undefined, NaN, {}].map(box), unbox)), [0, 0, 0])
})

it("fcumsum(array, f) passes the accessor d, i, and array", () => {
  const results = []
  const array = ["a", "b", "c"]
  lastc(array, (d, i, array) => results.push([d, i, array]))
  assert.deepStrictEqual(results, [
    ["a", 0, array],
    ["b", 1, array],
    ["c", 2, array],
  ])
})

it("fcumsum(array, f) uses the undefined context", () => {
  const results = []
  lastc([1, 2], function () {
    results.push(this)
  })
  assert.deepStrictEqual(results, [undefined, undefined])
})

function box(value) {
  return { value: value }
}

function unbox(box) {
  return box.value
}

function lastc(values, valueof) {
  const array = fcumsum(values, valueof)
  return array[array.length - 1]
}
import assert from "assert"
import * as d3 from "../src/index.js"

it("filter(values, test) returns the values that pass the test", () => {
  assert.deepStrictEqual(
    d3.filter([1, 2, 3, 2, 1], x => x & 1),
    [1, 3, 1]
  )
})

it("filter(values, test) accepts an iterable", () => {
  assert.deepStrictEqual(
    d3.filter(new Set([1, 2, 3, 2, 1]), x => x & 1),
    [1, 3]
  )
  assert.deepStrictEqual(
    d3.filter(
      (function* () {
        yield* [1, 2, 3, 2, 1]
      })(),
      x => x & 1
    ),
    [1, 3, 1]
  )
})

it("filter(values, test) accepts a typed array", () => {
  assert.deepStrictEqual(
    d3.filter(Uint8Array.of(1, 2, 3, 2, 1), x => x & 1),
    [1, 3, 1]
  )
})

it("filter(values, test) enforces that test is a function", () => {
  assert.throws(() => d3.filter([]), TypeError)
})

it("filter(values, test) enforces that values is iterable", () => {
  assert.throws(() => d3.filter({}, () => true), TypeError)
})

it("filter(values, test) passes test (value, index, values)", () => {
  const calls = []
  const values = new Set([5, 4, 3, 2, 1])
  d3.filter(values, function () {
    calls.push([this, ...arguments])
  })
  assert.deepStrictEqual(calls, [
    [undefined, 5, 0, values],
    [undefined, 4, 1, values],
    [undefined, 3, 2, values],
    [undefined, 2, 3, values],
    [undefined, 1, 4, values],
  ])
})

it("filter(values, test) does not skip sparse elements", () => {
  assert.deepStrictEqual(
    d3.filter([, 1, 2, ,], () => true),
    [undefined, 1, 2, undefined]
  )
})
import assert from "assert"
import { flatGroup } from "../src/index.js"

const data = [
  { name: "jim", amount: "34.0", date: "11/12/2015" },
  { name: "carl", amount: "120.11", date: "11/12/2015" },
  { name: "stacy", amount: "12.01", date: "01/04/2016" },
  { name: "stacy", amount: "34.05", date: "01/04/2016" },
]

it("flatGroup(data, accessor, accessor) returns the expected array", () => {
  assert.deepStrictEqual(
    flatGroup(
      data,
      d => d.name,
      d => d.amount
    ),
    [
      ["jim", "34.0", [{ name: "jim", amount: "34.0", date: "11/12/2015" }]],
      ["carl", "120.11", [{ name: "carl", amount: "120.11", date: "11/12/2015" }]],
      ["stacy", "12.01", [{ name: "stacy", amount: "12.01", date: "01/04/2016" }]],
      ["stacy", "34.05", [{ name: "stacy", amount: "34.05", date: "01/04/2016" }]],
    ]
  )
})
import assert from "assert"
import { flatRollup } from "../src/index.js"

const data = [
  { name: "jim", amount: "34.0", date: "11/12/2015" },
  { name: "carl", amount: "120.11", date: "11/12/2015" },
  { name: "stacy", amount: "12.01", date: "01/04/2016" },
  { name: "stacy", amount: "34.05", date: "01/04/2016" },
]

it("flatRollup(data, reduce, accessor) returns the expected array", () => {
  assert.deepStrictEqual(
    flatRollup(
      data,
      v => v.length,
      d => d.name
    ),
    [
      ["jim", 1],
      ["carl", 1],
      ["stacy", 2],
    ]
  )
})

it("flatRollup(data, reduce, accessor, accessor) returns the expected array", () => {
  assert.deepStrictEqual(
    flatRollup(
      data,
      v => v.length,
      d => d.name,
      d => d.amount
    ),
    [
      ["jim", "34.0", 1],
      ["carl", "120.11", 1],
      ["stacy", "12.01", 1],
      ["stacy", "34.05", 1],
    ]
  )
})
import assert from "assert"
import { Adder, fsum } from "../src/index.js"

it("new Adder() returns an Adder", () => {
  assert.strictEqual(typeof new Adder().add, "function")
  assert.strictEqual(typeof new Adder().valueOf, "function")
})

it("+adder can be applied several times", () => {
  const adder = new Adder()
  for (let i = 0; i < 10; ++i) adder.add(0.1)
  assert.strictEqual(+adder, 1)
  assert.strictEqual(+adder, 1)
})

it("fsum(array) is an exact sum", () => {
  assert.strictEqual(fsum([0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1]), 1)
  assert.strictEqual(
    fsum([
      0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3,
    ]),
    0
  )
  assert.strictEqual(fsum(["20", "3"].map(box), unbox), 23)
})

it("fsum(array) returns the fsum of the specified numbers", () => {
  assert.strictEqual(fsum([1]), 1)
  assert.strictEqual(fsum([5, 1, 2, 3, 4]), 15)
  assert.strictEqual(fsum([20, 3]), 23)
  assert.strictEqual(fsum([3, 20]), 23)
})

it("fsum(array) observes values that can be coerced to numbers", () => {
  assert.strictEqual(fsum(["20", "3"]), 23)
  assert.strictEqual(fsum(["3", "20"]), 23)
  assert.strictEqual(fsum(["3", 20]), 23)
  assert.strictEqual(fsum([20, "3"]), 23)
  assert.strictEqual(fsum([3, "20"]), 23)
  assert.strictEqual(fsum(["20", 3]), 23)
})

it("fsum(array) ignores non-numeric values", () => {
  assert.strictEqual(fsum(["a", "b", "c"]), 0)
  assert.strictEqual(fsum(["a", 1, "2"]), 3)
})

it("fsum(array) ignores null, undefined and NaN", () => {
  assert.strictEqual(fsum([NaN, 1, 2, 3, 4, 5]), 15)
  assert.strictEqual(fsum([1, 2, 3, 4, 5, NaN]), 15)
  assert.strictEqual(fsum([10, null, 3, undefined, 5, NaN]), 18)
})

it("fsum(array) returns zero if there are no numbers", () => {
  assert.strictEqual(fsum([]), 0)
  assert.strictEqual(fsum([NaN]), 0)
  assert.strictEqual(fsum([undefined]), 0)
  assert.strictEqual(fsum([undefined, NaN]), 0)
  assert.strictEqual(fsum([undefined, NaN, {}]), 0)
})

it("fsum(array, f) returns the fsum of the specified numbers", () => {
  assert.strictEqual(fsum([1].map(box), unbox), 1)
  assert.strictEqual(fsum([5, 1, 2, 3, 4].map(box), unbox), 15)
  assert.strictEqual(fsum([20, 3].map(box), unbox), 23)
  assert.strictEqual(fsum([3, 20].map(box), unbox), 23)
})

it("fsum(array, f) observes values that can be coerced to numbers", () => {
  assert.strictEqual(fsum(["20", "3"].map(box), unbox), 23)
  assert.strictEqual(fsum(["3", "20"].map(box), unbox), 23)
  assert.strictEqual(fsum(["3", 20].map(box), unbox), 23)
  assert.strictEqual(fsum([20, "3"].map(box), unbox), 23)
  assert.strictEqual(fsum([3, "20"].map(box), unbox), 23)
  assert.strictEqual(fsum(["20", 3].map(box), unbox), 23)
})

it("fsum(array, f) ignores non-numeric values", () => {
  assert.strictEqual(fsum(["a", "b", "c"].map(box), unbox), 0)
  assert.strictEqual(fsum(["a", 1, "2"].map(box), unbox), 3)
})

it("fsum(array, f) ignores null, undefined and NaN", () => {
  assert.strictEqual(fsum([NaN, 1, 2, 3, 4, 5].map(box), unbox), 15)
  assert.strictEqual(fsum([1, 2, 3, 4, 5, NaN].map(box), unbox), 15)
  assert.strictEqual(fsum([10, null, 3, undefined, 5, NaN].map(box), unbox), 18)
})

it("fsum(array, f) returns zero if there are no numbers", () => {
  assert.strictEqual(fsum([].map(box), unbox), 0)
  assert.strictEqual(fsum([NaN].map(box), unbox), 0)
  assert.strictEqual(fsum([undefined].map(box), unbox), 0)
  assert.strictEqual(fsum([undefined, NaN].map(box), unbox), 0)
  assert.strictEqual(fsum([undefined, NaN, {}].map(box), unbox), 0)
})

it("fsum(array, f) passes the accessor d, i, and array", () => {
  const results = []
  const array = ["a", "b", "c"]
  fsum(array, (d, i, array) => results.push([d, i, array]))
  assert.deepStrictEqual(results, [
    ["a", 0, array],
    ["b", 1, array],
    ["c", 2, array],
  ])
})

it("fsum(array, f) uses the undefined context", () => {
  const results = []
  fsum([1, 2], function () {
    results.push(this)
  })
  assert.deepStrictEqual(results, [undefined, undefined])
})

function box(value) {
  return { value: value }
}

function unbox(box) {
  return box.value
}
import assert from "assert"
import { descending, greatest } from "../src/index.js"

it("greatest(array) compares using natural order", () => {
  assert.strictEqual(greatest([0, 1]), 1)
  assert.strictEqual(greatest([1, 0]), 1)
  assert.strictEqual(greatest([0, "1"]), "1")
  assert.strictEqual(greatest(["1", 0]), "1")
  assert.strictEqual(greatest(["10", "2"]), "2")
  assert.strictEqual(greatest(["2", "10"]), "2")
  assert.strictEqual(greatest(["10", "2", NaN]), "2")
  assert.strictEqual(greatest([NaN, "10", "2"]), "2")
  assert.strictEqual(greatest(["2", NaN, "10"]), "2")
  assert.strictEqual(greatest([2, NaN, 10]), 10)
  assert.strictEqual(greatest([10, 2, NaN]), 10)
  assert.strictEqual(greatest([NaN, 10, 2]), 10)
})

it("greatest(array, compare) compares using the specified compare function", () => {
  const a = { name: "a" },
    b = { name: "b" }
  assert.deepStrictEqual(
    greatest([a, b], (a, b) => a.name.localeCompare(b.name)),
    { name: "b" }
  )
  assert.strictEqual(greatest([1, 0], descending), 0)
  assert.strictEqual(greatest(["1", 0], descending), 0)
  assert.strictEqual(greatest(["2", "10"], descending), "10")
  assert.strictEqual(greatest(["2", NaN, "10"], descending), "10")
  assert.strictEqual(greatest([2, NaN, 10], descending), 2)
})

it("greatest(array, accessor) uses the specified accessor function", () => {
  const a = { name: "a", v: 42 },
    b = { name: "b", v: 0.42 }
  assert.deepStrictEqual(
    greatest([a, b], d => d.name),
    b
  )
  assert.deepStrictEqual(
    greatest([a, b], d => d.v),
    a
  )
})

it("greatest(array) returns undefined if the array is empty", () => {
  assert.strictEqual(greatest([]), undefined)
})

it("greatest(array) returns undefined if the array contains only incomparable values", () => {
  assert.strictEqual(greatest([NaN, undefined]), undefined)
  assert.strictEqual(
    greatest([NaN, "foo"], (a, b) => a - b),
    undefined
  )
})

it("greatest(array) returns the first of equal values", () => {
  assert.deepStrictEqual(greatest([2, 2, 1, 1, 0, 0, 0, 3, 0].map(box), descendingValue), { value: 0, index: 4 })
  assert.deepStrictEqual(greatest([3, 2, 2, 1, 1, 0, 0, 0, 3, 0].map(box), ascendingValue), { value: 3, index: 0 })
})

it("greatest(array) ignores null and undefined", () => {
  assert.deepStrictEqual(greatest([null, -2, undefined]), -2)
})

it("greatest(array, accessor) ignores null and undefined", () => {
  assert.deepStrictEqual(
    greatest([null, -2, undefined], d => d),
    -2
  )
})

function box(value, index) {
  return { value, index }
}

function ascendingValue(a, b) {
  return a.value - b.value
}

function descendingValue(a, b) {
  return b.value - a.value
}
import assert from "assert"
import { ascending, descending, greatestIndex } from "../src/index.js"

it("greatestIndex(array) compares using natural order", () => {
  assert.strictEqual(greatestIndex([0, 1]), 1)
  assert.strictEqual(greatestIndex([1, 0]), 0)
  assert.strictEqual(greatestIndex([0, "1"]), 1)
  assert.strictEqual(greatestIndex(["1", 0]), 0)
  assert.strictEqual(greatestIndex(["10", "2"]), 1)
  assert.strictEqual(greatestIndex(["2", "10"]), 0)
  assert.strictEqual(greatestIndex(["10", "2", NaN]), 1)
  assert.strictEqual(greatestIndex([NaN, "10", "2"]), 2)
  assert.strictEqual(greatestIndex(["2", NaN, "10"]), 0)
  assert.strictEqual(greatestIndex([2, NaN, 10]), 2)
  assert.strictEqual(greatestIndex([10, 2, NaN]), 0)
  assert.strictEqual(greatestIndex([NaN, 10, 2]), 1)
})

it("greatestIndex(array, compare) compares using the specified compare function", () => {
  const a = { name: "a" },
    b = { name: "b" }
  assert.strictEqual(
    greatestIndex([a, b], (a, b) => a.name.localeCompare(b.name)),
    1
  )
  assert.strictEqual(greatestIndex([1, 0], ascending), 0)
  assert.strictEqual(greatestIndex(["1", 0], ascending), 0)
  assert.strictEqual(greatestIndex(["2", "10"], ascending), 0)
  assert.strictEqual(greatestIndex(["2", NaN, "10"], ascending), 0)
  assert.strictEqual(greatestIndex([2, NaN, 10], ascending), 2)
})

it("greatestIndex(array, accessor) uses the specified accessor function", () => {
  const a = { name: "a", v: 42 },
    b = { name: "b", v: 0.42 }
  assert.deepStrictEqual(
    greatestIndex([a, b], d => d.name),
    1
  )
  assert.deepStrictEqual(
    greatestIndex([a, b], d => d.v),
    0
  )
})

it("greatestIndex(array) returns -1 if the array is empty", () => {
  assert.strictEqual(greatestIndex([]), -1)
})

it("greatestIndex(array) returns -1 if the array contains only incomparable values", () => {
  assert.strictEqual(greatestIndex([NaN, undefined]), -1)
  assert.strictEqual(
    greatestIndex([NaN, "foo"], (a, b) => a - b),
    -1
  )
})

it("greatestIndex(array) returns the first of equal values", () => {
  assert.strictEqual(greatestIndex([-2, -2, -1, -1, 0, 0, 0, -3, 0]), 4)
  assert.strictEqual(greatestIndex([-3, -2, -2, -1, -1, 0, 0, 0, -3, 0], descending), 0)
})

it("greatestIndex(array) ignores null and undefined", () => {
  assert.deepStrictEqual(greatestIndex([null, -2, undefined]), 1)
})

it("greatestIndex(array, accessor) ignores null and undefined", () => {
  assert.deepStrictEqual(
    greatestIndex([null, -2, undefined], d => d),
    1
  )
})
import assert from "assert"
import { group } from "../src/index.js"

const data = [
  { name: "jim", amount: "34.0", date: "11/12/2015" },
  { name: "carl", amount: "120.11", date: "11/12/2015" },
  { name: "stacy", amount: "12.01", date: "01/04/2016" },
  { name: "stacy", amount: "34.05", date: "01/04/2016" },
]

it("group(data, accessor) returns the expected map", () => {
  assert.deepStrictEqual(
    entries(
      group(data, d => d.name),
      1
    ),
    [
      [
        "jim",
        [
          {
            name: "jim",
            amount: "34.0",
            date: "11/12/2015",
          },
        ],
      ],
      [
        "carl",
        [
          {
            name: "carl",
            amount: "120.11",
            date: "11/12/2015",
          },
        ],
      ],
      [
        "stacy",
        [
          {
            name: "stacy",
            amount: "12.01",
            date: "01/04/2016",
          },
          {
            name: "stacy",
            amount: "34.05",
            date: "01/04/2016",
          },
        ],
      ],
    ]
  )
})

it("group(data, accessor, accessor) returns the expected map", () => {
  assert.deepStrictEqual(
    entries(
      group(
        data,
        d => d.name,
        d => d.amount
      ),
      2
    ),
    [
      [
        "jim",
        [
          [
            "34.0",
            [
              {
                name: "jim",
                amount: "34.0",
                date: "11/12/2015",
              },
            ],
          ],
        ],
      ],
      [
        "carl",
        [
          [
            "120.11",
            [
              {
                name: "carl",
                amount: "120.11",
                date: "11/12/2015",
              },
            ],
          ],
        ],
      ],
      [
        "stacy",
        [
          [
            "12.01",
            [
              {
                name: "stacy",
                amount: "12.01",
                date: "01/04/2016",
              },
            ],
          ],
          [
            "34.05",
            [
              {
                name: "stacy",
                amount: "34.05",
                date: "01/04/2016",
              },
            ],
          ],
        ],
      ],
    ]
  )
})

it("group(data, accessor) interns keys", () => {
  const a1 = new Date(Date.UTC(2001, 0, 1))
  const a2 = new Date(Date.UTC(2001, 0, 1))
  const b = new Date(Date.UTC(2002, 0, 1))
  const map = group(
    [
      [a1, 1],
      [a2, 2],
      [b, 3],
    ],
    ([date]) => date
  )
  assert.deepStrictEqual(map.get(a1), [
    [a1, 1],
    [a2, 2],
  ])
  assert.deepStrictEqual(map.get(a2), [
    [a1, 1],
    [a2, 2],
  ])
  assert.deepStrictEqual(map.get(b), [[b, 3]])
  assert.deepStrictEqual(map.get(+a1), [
    [a1, 1],
    [a2, 2],
  ])
  assert.deepStrictEqual(map.get(+a2), [
    [a1, 1],
    [a2, 2],
  ])
  assert.deepStrictEqual(map.get(+b), [[b, 3]])
  assert.strictEqual([...map.keys()][0], a1)
  assert.strictEqual([...map.keys()][1], b)
})

function entries(map, depth) {
  if (depth > 0) {
    return Array.from(map, ([k, v]) => [k, entries(v, depth - 1)])
  } else {
    return map
  }
}
import assert from "assert"
import { readFileSync } from "fs"
import { ascending, descending, groupSort, median } from "../src/index.js"

const barley = JSON.parse(readFileSync("./test/data/barley.json"))

it("groupSort(data, reduce, key) returns sorted keys when reduce is an accessor", () => {
  assert.deepStrictEqual(
    groupSort(
      barley,
      g => median(g, d => d.yield),
      d => d.variety
    ),
    [
      "Svansota",
      "No. 462",
      "Manchuria",
      "No. 475",
      "Velvet",
      "Peatland",
      "Glabron",
      "No. 457",
      "Wisconsin No. 38",
      "Trebi",
    ]
  )
  assert.deepStrictEqual(
    groupSort(
      barley,
      g => -median(g, d => d.yield),
      d => d.variety
    ),
    [
      "Trebi",
      "Wisconsin No. 38",
      "No. 457",
      "Glabron",
      "Peatland",
      "Velvet",
      "No. 475",
      "Manchuria",
      "No. 462",
      "Svansota",
    ]
  )
  assert.deepStrictEqual(
    groupSort(
      barley,
      g => median(g, d => -d.yield),
      d => d.variety
    ),
    [
      "Trebi",
      "Wisconsin No. 38",
      "No. 457",
      "Glabron",
      "Peatland",
      "Velvet",
      "No. 475",
      "Manchuria",
      "No. 462",
      "Svansota",
    ]
  )
  assert.deepStrictEqual(
    groupSort(
      barley,
      g => median(g, d => d.yield),
      d => d.site
    ),
    ["Grand Rapids", "Duluth", "University Farm", "Morris", "Crookston", "Waseca"]
  )
  assert.deepStrictEqual(
    groupSort(
      barley,
      g => -median(g, d => d.yield),
      d => d.site
    ),
    ["Waseca", "Crookston", "Morris", "University Farm", "Duluth", "Grand Rapids"]
  )
  assert.deepStrictEqual(
    groupSort(
      barley,
      g => median(g, d => -d.yield),
      d => d.site
    ),
    ["Waseca", "Crookston", "Morris", "University Farm", "Duluth", "Grand Rapids"]
  )
})

it("groupSort(data, reduce, key) returns sorted keys when reduce is a comparator", () => {
  assert.deepStrictEqual(
    groupSort(
      barley,
      (a, b) =>
        ascending(
          median(a, d => d.yield),
          median(b, d => d.yield)
        ),
      d => d.variety
    ),
    [
      "Svansota",
      "No. 462",
      "Manchuria",
      "No. 475",
      "Velvet",
      "Peatland",
      "Glabron",
      "No. 457",
      "Wisconsin No. 38",
      "Trebi",
    ]
  )
  assert.deepStrictEqual(
    groupSort(
      barley,
      (a, b) =>
        descending(
          median(a, d => d.yield),
          median(b, d => d.yield)
        ),
      d => d.variety
    ),
    [
      "Trebi",
      "Wisconsin No. 38",
      "No. 457",
      "Glabron",
      "Peatland",
      "Velvet",
      "No. 475",
      "Manchuria",
      "No. 462",
      "Svansota",
    ]
  )
  assert.deepStrictEqual(
    groupSort(
      barley,
      (a, b) =>
        ascending(
          median(a, d => d.yield),
          median(b, d => d.yield)
        ),
      d => d.site
    ),
    ["Grand Rapids", "Duluth", "University Farm", "Morris", "Crookston", "Waseca"]
  )
  assert.deepStrictEqual(
    groupSort(
      barley,
      (a, b) =>
        descending(
          median(a, d => d.yield),
          median(b, d => d.yield)
        ),
      d => d.site
    ),
    ["Waseca", "Crookston", "Morris", "University Farm", "Duluth", "Grand Rapids"]
  )
})
import assert from "assert"
import { groups } from "../src/index.js"

const data = [
  { name: "jim", amount: "34.0", date: "11/12/2015" },
  { name: "carl", amount: "120.11", date: "11/12/2015" },
  { name: "stacy", amount: "12.01", date: "01/04/2016" },
  { name: "stacy", amount: "34.05", date: "01/04/2016" },
]

it("groups(data, accessor) returns the expected array", () => {
  assert.deepStrictEqual(
    groups(data, d => d.name),
    [
      [
        "jim",
        [
          {
            name: "jim",
            amount: "34.0",
            date: "11/12/2015",
          },
        ],
      ],
      [
        "carl",
        [
          {
            name: "carl",
            amount: "120.11",
            date: "11/12/2015",
          },
        ],
      ],
      [
        "stacy",
        [
          {
            name: "stacy",
            amount: "12.01",
            date: "01/04/2016",
          },
          {
            name: "stacy",
            amount: "34.05",
            date: "01/04/2016",
          },
        ],
      ],
    ]
  )
})

it("groups(data, accessor, accessor) returns the expected array", () => {
  assert.deepStrictEqual(
    groups(
      data,
      d => d.name,
      d => d.amount
    ),
    [
      [
        "jim",
        [
          [
            "34.0",
            [
              {
                name: "jim",
                amount: "34.0",
                date: "11/12/2015",
              },
            ],
          ],
        ],
      ],
      [
        "carl",
        [
          [
            "120.11",
            [
              {
                name: "carl",
                amount: "120.11",
                date: "11/12/2015",
              },
            ],
          ],
        ],
      ],
      [
        "stacy",
        [
          [
            "12.01",
            [
              {
                name: "stacy",
                amount: "12.01",
                date: "01/04/2016",
              },
            ],
          ],
          [
            "34.05",
            [
              {
                name: "stacy",
                amount: "34.05",
                date: "01/04/2016",
              },
            ],
          ],
        ],
      ],
    ]
  )
})
import assert from "assert"
import { index, indexes } from "../src/index.js"

const data = [
  { name: "jim", amount: 34.0, date: "11/12/2015" },
  { name: "carl", amount: 120.11, date: "11/12/2015" },
  { name: "stacy", amount: 12.01, date: "01/04/2016" },
  { name: "stacy", amount: 34.05, date: "01/04/2016" },
]

it("indexes(data, ...keys) returns the expected nested arrays", () => {
  assert.deepStrictEqual(
    indexes(data, d => d.amount),
    [
      [34.0, { name: "jim", amount: 34.0, date: "11/12/2015" }],
      [120.11, { name: "carl", amount: 120.11, date: "11/12/2015" }],
      [12.01, { name: "stacy", amount: 12.01, date: "01/04/2016" }],
      [34.05, { name: "stacy", amount: 34.05, date: "01/04/2016" }],
    ]
  )
  assert.deepStrictEqual(
    indexes(
      data,
      d => d.name,
      d => d.amount
    ),
    [
      ["jim", [[34.0, { name: "jim", amount: 34.0, date: "11/12/2015" }]]],
      ["carl", [[120.11, { name: "carl", amount: 120.11, date: "11/12/2015" }]]],
      [
        "stacy",
        [
          [12.01, { name: "stacy", amount: 12.01, date: "01/04/2016" }],
          [34.05, { name: "stacy", amount: 34.05, date: "01/04/2016" }],
        ],
      ],
    ]
  )
})

it("index(data, ...keys) returns the expected map", () => {
  assert.deepStrictEqual(
    entries(
      index(data, d => d.amount),
      1
    ),
    indexes(data, d => d.amount)
  )
  assert.deepStrictEqual(
    entries(
      index(
        data,
        d => d.name,
        d => d.amount
      ),
      2
    ),
    indexes(
      data,
      d => d.name,
      d => d.amount
    )
  )
})

it("index(data, ...keys) throws on a non-unique key", () => {
  assert.throws(() => index(data, d => d.name))
  assert.throws(() => index(data, d => d.date))
})

function entries(map, depth) {
  return depth > 0 ? Array.from(map, ([k, v]) => [k, entries(v, depth - 1)]) : map
}
import { intersection } from "../src/index.js"
import { assertSetEqual } from "./asserts.js"

it("intersection(values) returns a set of values", () => {
  assertSetEqual(intersection([1, 2, 3, 2, 1]), [1, 2, 3])
})

it("intersection(values, other) returns a set of values", () => {
  assertSetEqual(intersection([1, 2], [2, 3, 1]), [1, 2])
  assertSetEqual(intersection([2, 1, 3], [4, 3, 1]), [1, 3])
})

it("intersection(...values) returns a set of values", () => {
  assertSetEqual(intersection([1, 2], [2, 1], [2, 3]), [2])
})

it("intersection(...values) accepts iterables", () => {
  assertSetEqual(intersection(new Set([1, 2, 3])), [1, 2, 3])
})

it("intersection(...values) performs interning", () => {
  assertSetEqual(
    intersection([new Date("2021-01-01"), new Date("2021-01-03")], [new Date("2021-01-01"), new Date("2021-01-02")]),
    [new Date("2021-01-01")]
  )
})
import assert from "assert"
import { descending, least } from "../src/index.js"

it("least(array) compares using natural order", () => {
  assert.strictEqual(least([0, 1]), 0)
  assert.strictEqual(least([1, 0]), 0)
  assert.strictEqual(least([0, "1"]), 0)
  assert.strictEqual(least(["1", 0]), 0)
  assert.strictEqual(least(["10", "2"]), "10")
  assert.strictEqual(least(["2", "10"]), "10")
  assert.strictEqual(least(["10", "2", NaN]), "10")
  assert.strictEqual(least([NaN, "10", "2"]), "10")
  assert.strictEqual(least(["2", NaN, "10"]), "10")
  assert.strictEqual(least([2, NaN, 10]), 2)
  assert.strictEqual(least([10, 2, NaN]), 2)
  assert.strictEqual(least([NaN, 10, 2]), 2)
})

it("least(array, compare) compares using the specified compare function", () => {
  const a = { name: "a" },
    b = { name: "b" }
  assert.deepStrictEqual(
    least([a, b], (a, b) => a.name.localeCompare(b.name)),
    { name: "a" }
  )
  assert.strictEqual(least([1, 0], descending), 1)
  assert.strictEqual(least(["1", 0], descending), "1")
  assert.strictEqual(least(["2", "10"], descending), "2")
  assert.strictEqual(least(["2", NaN, "10"], descending), "2")
  assert.strictEqual(least([2, NaN, 10], descending), 10)
})

it("least(array, accessor) uses the specified accessor function", () => {
  const a = { name: "a", v: 42 },
    b = { name: "b", v: 0.42 }
  assert.deepStrictEqual(
    least([a, b], d => d.name),
    a
  )
  assert.deepStrictEqual(
    least([a, b], d => d.v),
    b
  )
})

it("least(array) returns undefined if the array is empty", () => {
  assert.strictEqual(least([]), undefined)
})

it("least(array) returns undefined if the array contains only incomparable values", () => {
  assert.strictEqual(least([NaN, undefined]), undefined)
  assert.strictEqual(
    least([NaN, "foo"], (a, b) => a - b),
    undefined
  )
})

it("least(array) returns the first of equal values", () => {
  assert.deepStrictEqual(least([2, 2, 1, 1, 0, 0, 0, 3, 0].map(box), ascendingValue), { value: 0, index: 4 })
  assert.deepStrictEqual(least([3, 2, 2, 1, 1, 0, 0, 0, 3, 0].map(box), descendingValue), { value: 3, index: 0 })
})

it("least(array) ignores null and undefined", () => {
  assert.deepStrictEqual(least([null, 2, undefined]), 2)
})

it("least(array, accessor) ignores null and undefined", () => {
  assert.deepStrictEqual(
    least([null, 2, undefined], d => d),
    2
  )
})

function box(value, index) {
  return { value, index }
}

function ascendingValue(a, b) {
  return a.value - b.value
}

function descendingValue(a, b) {
  return b.value - a.value
}
import assert from "assert"
import { descending, leastIndex } from "../src/index.js"

it("leastIndex(array) compares using natural order", () => {
  assert.strictEqual(leastIndex([0, 1]), 0)
  assert.strictEqual(leastIndex([1, 0]), 1)
  assert.strictEqual(leastIndex([0, "1"]), 0)
  assert.strictEqual(leastIndex(["1", 0]), 1)
  assert.strictEqual(leastIndex(["10", "2"]), 0)
  assert.strictEqual(leastIndex(["2", "10"]), 1)
  assert.strictEqual(leastIndex(["10", "2", NaN]), 0)
  assert.strictEqual(leastIndex([NaN, "10", "2"]), 1)
  assert.strictEqual(leastIndex(["2", NaN, "10"]), 2)
  assert.strictEqual(leastIndex([2, NaN, 10]), 0)
  assert.strictEqual(leastIndex([10, 2, NaN]), 1)
  assert.strictEqual(leastIndex([NaN, 10, 2]), 2)
})

it("leastIndex(array, compare) compares using the specified compare function", () => {
  const a = { name: "a" },
    b = { name: "b" }
  assert.strictEqual(
    leastIndex([a, b], (a, b) => a.name.localeCompare(b.name)),
    0
  )
  assert.strictEqual(leastIndex([1, 0], descending), 0)
  assert.strictEqual(leastIndex(["1", 0], descending), 0)
  assert.strictEqual(leastIndex(["2", "10"], descending), 0)
  assert.strictEqual(leastIndex(["2", NaN, "10"], descending), 0)
  assert.strictEqual(leastIndex([2, NaN, 10], descending), 2)
})

it("leastIndex(array, accessor) uses the specified accessor function", () => {
  const a = { name: "a", v: 42 },
    b = { name: "b", v: 0.42 }
  assert.deepStrictEqual(
    leastIndex([a, b], d => d.name),
    0
  )
  assert.deepStrictEqual(
    leastIndex([a, b], d => d.v),
    1
  )
})

it("leastIndex(array) returns -1 if the array is empty", () => {
  assert.strictEqual(leastIndex([]), -1)
})

it("leastIndex(array) returns -1 if the array contains only incomparable values", () => {
  assert.strictEqual(leastIndex([NaN, undefined]), -1)
  assert.strictEqual(
    leastIndex([NaN, "foo"], (a, b) => a - b),
    -1
  )
})

it("leastIndex(array) returns the first of equal values", () => {
  assert.strictEqual(leastIndex([2, 2, 1, 1, 0, 0, 0, 3, 0]), 4)
  assert.strictEqual(leastIndex([3, 2, 2, 1, 1, 0, 0, 0, 3, 0], descending), 0)
})

it("leastIndex(array) ignores null and undefined", () => {
  assert.deepStrictEqual(leastIndex([null, 2, undefined]), 1)
})

it("leastIndex(array, accessor) ignores null and undefined", () => {
  assert.deepStrictEqual(
    leastIndex([null, 2, undefined], d => d),
    1
  )
})
import assert from "assert"
import { map } from "../src/index.js"

it("map(values, mapper) returns the mapped values", () => {
  assert.deepStrictEqual(
    map([1, 2, 3, 2, 1], x => x * 2),
    [2, 4, 6, 4, 2]
  )
})

it("map(values, mapper) accepts an iterable", () => {
  assert.deepStrictEqual(
    map(new Set([1, 2, 3, 2, 1]), x => x * 2),
    [2, 4, 6]
  )
  assert.deepStrictEqual(
    map(
      (function* () {
        yield* [1, 2, 3, 2, 1]
      })(),
      x => x * 2
    ),
    [2, 4, 6, 4, 2]
  )
})

it("map(values, mapper) accepts a typed array", () => {
  assert.deepStrictEqual(
    map(Uint8Array.of(1, 2, 3, 2, 1), x => x * 2),
    [2, 4, 6, 4, 2]
  )
})

it("map(values, mapper) enforces that test is a function", () => {
  assert.throws(() => map([]), TypeError)
})

it("map(values, mapper) enforces that values is iterable", () => {
  assert.throws(() => map({}, () => true), TypeError)
})

it("map(values, mapper) passes test (value, index, values)", () => {
  const calls = []
  const values = new Set([5, 4, 3, 2, 1])
  map(values, function () {
    calls.push([this, ...arguments])
  })
  assert.deepStrictEqual(calls, [
    [undefined, 5, 0, values],
    [undefined, 4, 1, values],
    [undefined, 3, 2, values],
    [undefined, 2, 3, values],
    [undefined, 1, 4, values],
  ])
})

it("map(values, mapper) does not skip sparse elements", () => {
  assert.deepStrictEqual(
    map([, 1, 2, ,], x => x * 2),
    [NaN, 2, 4, NaN]
  )
})
import assert from "assert"
import { max } from "../src/index.js"

it("max(array) returns the greatest numeric value for numbers", () => {
  assert.deepStrictEqual(max([1]), 1)
  assert.deepStrictEqual(max([5, 1, 2, 3, 4]), 5)
  assert.deepStrictEqual(max([20, 3]), 20)
  assert.deepStrictEqual(max([3, 20]), 20)
})

it("max(array) returns the greatest lexicographic value for strings", () => {
  assert.deepStrictEqual(max(["c", "a", "b"]), "c")
  assert.deepStrictEqual(max(["20", "3"]), "3")
  assert.deepStrictEqual(max(["3", "20"]), "3")
})

it("max(array) ignores null, undefined and NaN", () => {
  const o = { valueOf: () => NaN }
  assert.deepStrictEqual(max([NaN, 1, 2, 3, 4, 5]), 5)
  assert.deepStrictEqual(max([o, 1, 2, 3, 4, 5]), 5)
  assert.deepStrictEqual(max([1, 2, 3, 4, 5, NaN]), 5)
  assert.deepStrictEqual(max([1, 2, 3, 4, 5, o]), 5)
  assert.deepStrictEqual(max([10, null, 3, undefined, 5, NaN]), 10)
  assert.deepStrictEqual(max([-1, null, -3, undefined, -5, NaN]), -1)
})

it("max(array) compares heterogenous types as numbers", () => {
  assert.strictEqual(max([20, "3"]), 20)
  assert.strictEqual(max(["20", 3]), "20")
  assert.strictEqual(max([3, "20"]), "20")
  assert.strictEqual(max(["3", 20]), 20)
})

it("max(array) returns undefined if the array contains no numbers", () => {
  assert.strictEqual(max([]), undefined)
  assert.strictEqual(max([null]), undefined)
  assert.strictEqual(max([undefined]), undefined)
  assert.strictEqual(max([NaN]), undefined)
  assert.strictEqual(max([NaN, NaN]), undefined)
})

it("max(array, f) returns the greatest numeric value for numbers", () => {
  assert.deepStrictEqual(max([1].map(box), unbox), 1)
  assert.deepStrictEqual(max([5, 1, 2, 3, 4].map(box), unbox), 5)
  assert.deepStrictEqual(max([20, 3].map(box), unbox), 20)
  assert.deepStrictEqual(max([3, 20].map(box), unbox), 20)
})

it("max(array, f) returns the greatest lexicographic value for strings", () => {
  assert.deepStrictEqual(max(["c", "a", "b"].map(box), unbox), "c")
  assert.deepStrictEqual(max(["20", "3"].map(box), unbox), "3")
  assert.deepStrictEqual(max(["3", "20"].map(box), unbox), "3")
})

it("max(array, f) ignores null, undefined and NaN", () => {
  const o = { valueOf: () => NaN }
  assert.deepStrictEqual(max([NaN, 1, 2, 3, 4, 5].map(box), unbox), 5)
  assert.deepStrictEqual(max([o, 1, 2, 3, 4, 5].map(box), unbox), 5)
  assert.deepStrictEqual(max([1, 2, 3, 4, 5, NaN].map(box), unbox), 5)
  assert.deepStrictEqual(max([1, 2, 3, 4, 5, o].map(box), unbox), 5)
  assert.deepStrictEqual(max([10, null, 3, undefined, 5, NaN].map(box), unbox), 10)
  assert.deepStrictEqual(max([-1, null, -3, undefined, -5, NaN].map(box), unbox), -1)
})

it("max(array, f) compares heterogenous types as numbers", () => {
  assert.strictEqual(max([20, "3"].map(box), unbox), 20)
  assert.strictEqual(max(["20", 3].map(box), unbox), "20")
  assert.strictEqual(max([3, "20"].map(box), unbox), "20")
  assert.strictEqual(max(["3", 20].map(box), unbox), 20)
})

it("max(array, f) returns undefined if the array contains no observed values", () => {
  assert.strictEqual(max([].map(box), unbox), undefined)
  assert.strictEqual(max([null].map(box), unbox), undefined)
  assert.strictEqual(max([undefined].map(box), unbox), undefined)
  assert.strictEqual(max([NaN].map(box), unbox), undefined)
  assert.strictEqual(max([NaN, NaN].map(box), unbox), undefined)
})

it("max(array, f) passes the accessor d, i, and array", () => {
  const results = []
  const array = ["a", "b", "c"]
  max(array, (d, i, array) => results.push([d, i, array]))
  assert.deepStrictEqual(results, [
    ["a", 0, array],
    ["b", 1, array],
    ["c", 2, array],
  ])
})

it("max(array, f) uses the undefined context", () => {
  const results = []
  max([1, 2], function () {
    results.push(this)
  })
  assert.deepStrictEqual(results, [undefined, undefined])
})

function box(value) {
  return { value: value }
}

function unbox(box) {
  return box.value
}
import assert from "assert"
import { maxIndex } from "../src/index.js"

it("maxIndex(array) returns the index of the greatest numeric value for numbers", () => {
  assert.deepStrictEqual(maxIndex([1]), 0)
  assert.deepStrictEqual(maxIndex([5, 1, 2, 3, 4]), 0)
  assert.deepStrictEqual(maxIndex([20, 3]), 0)
  assert.deepStrictEqual(maxIndex([3, 20]), 1)
})

it("maxIndex(array) returns the greatest lexicographic value for strings", () => {
  assert.deepStrictEqual(maxIndex(["c", "a", "b"]), 0)
  assert.deepStrictEqual(maxIndex(["20", "3"]), 1)
  assert.deepStrictEqual(maxIndex(["3", "20"]), 0)
})

it("maxIndex(array) ignores null, undefined and NaN", () => {
  const o = { valueOf: () => NaN }
  assert.deepStrictEqual(maxIndex([NaN, 1, 2, 3, 4, 5]), 5)
  assert.deepStrictEqual(maxIndex([o, 1, 2, 3, 4, 5]), 5)
  assert.deepStrictEqual(maxIndex([1, 2, 3, 4, 5, NaN]), 4)
  assert.deepStrictEqual(maxIndex([1, 2, 3, 4, 5, o]), 4)
  assert.deepStrictEqual(maxIndex([10, null, 3, undefined, 5, NaN]), 0)
  assert.deepStrictEqual(maxIndex([-1, null, -3, undefined, -5, NaN]), 0)
})

it("maxIndex(array) compares heterogenous types as numbers", () => {
  assert.strictEqual(maxIndex([20, "3"]), 0)
  assert.strictEqual(maxIndex(["20", 3]), 0)
  assert.strictEqual(maxIndex([3, "20"]), 1)
  assert.strictEqual(maxIndex(["3", 20]), 1)
})

it("maxIndex(array) returns -1 if the array contains no numbers", () => {
  assert.strictEqual(maxIndex([]), -1)
  assert.strictEqual(maxIndex([null]), -1)
  assert.strictEqual(maxIndex([undefined]), -1)
  assert.strictEqual(maxIndex([NaN]), -1)
  assert.strictEqual(maxIndex([NaN, NaN]), -1)
})

it("maxIndex(array, f) returns the greatest numeric value for numbers", () => {
  assert.deepStrictEqual(maxIndex([1].map(box), unbox), 0)
  assert.deepStrictEqual(maxIndex([5, 1, 2, 3, 4].map(box), unbox), 0)
  assert.deepStrictEqual(maxIndex([20, 3].map(box), unbox), 0)
  assert.deepStrictEqual(maxIndex([3, 20].map(box), unbox), 1)
})

it("maxIndex(array, f) returns the greatest lexicographic value for strings", () => {
  assert.deepStrictEqual(maxIndex(["c", "a", "b"].map(box), unbox), 0)
  assert.deepStrictEqual(maxIndex(["20", "3"].map(box), unbox), 1)
  assert.deepStrictEqual(maxIndex(["3", "20"].map(box), unbox), 0)
})

it("maxIndex(array, f) ignores null, undefined and NaN", () => {
  const o = { valueOf: () => NaN }
  assert.deepStrictEqual(maxIndex([NaN, 1, 2, 3, 4, 5].map(box), unbox), 5)
  assert.deepStrictEqual(maxIndex([o, 1, 2, 3, 4, 5].map(box), unbox), 5)
  assert.deepStrictEqual(maxIndex([1, 2, 3, 4, 5, NaN].map(box), unbox), 4)
  assert.deepStrictEqual(maxIndex([1, 2, 3, 4, 5, o].map(box), unbox), 4)
  assert.deepStrictEqual(maxIndex([10, null, 3, undefined, 5, NaN].map(box), unbox), 0)
  assert.deepStrictEqual(maxIndex([-1, null, -3, undefined, -5, NaN].map(box), unbox), 0)
})

it("maxIndex(array, f) compares heterogenous types as numbers", () => {
  assert.strictEqual(maxIndex([20, "3"].map(box), unbox), 0)
  assert.strictEqual(maxIndex(["20", 3].map(box), unbox), 0)
  assert.strictEqual(maxIndex([3, "20"].map(box), unbox), 1)
  assert.strictEqual(maxIndex(["3", 20].map(box), unbox), 1)
})

it("maxIndex(array, f) returns -1 if the array contains no observed values", () => {
  assert.strictEqual(maxIndex([].map(box), unbox), -1)
  assert.strictEqual(maxIndex([null].map(box), unbox), -1)
  assert.strictEqual(maxIndex([undefined].map(box), unbox), -1)
  assert.strictEqual(maxIndex([NaN].map(box), unbox), -1)
  assert.strictEqual(maxIndex([NaN, NaN].map(box), unbox), -1)
})

it("maxIndex(array, f) passes the accessor d, i, and array", () => {
  const results = []
  const array = ["a", "b", "c"]
  maxIndex(array, (d, i, array) => results.push([d, i, array]))
  assert.deepStrictEqual(results, [
    ["a", 0, array],
    ["b", 1, array],
    ["c", 2, array],
  ])
})

it("maxIndex(array, f) uses the undefined context", () => {
  const results = []
  maxIndex([1, 2], function () {
    results.push(this)
  })
  assert.deepStrictEqual(results, [undefined, undefined])
})

function box(value) {
  return { value: value }
}

function unbox(box) {
  return box.value
}
import assert from "assert"
import { mean } from "../src/index.js"
import { OneTimeNumber } from "./OneTimeNumber.js"

it("mean(array) returns the mean value for numbers", () => {
  assert.strictEqual(mean([1]), 1)
  assert.strictEqual(mean([5, 1, 2, 3, 4]), 3)
  assert.strictEqual(mean([20, 3]), 11.5)
  assert.strictEqual(mean([3, 20]), 11.5)
})

it("mean(array) ignores null, undefined and NaN", () => {
  assert.strictEqual(mean([NaN, 1, 2, 3, 4, 5]), 3)
  assert.strictEqual(mean([1, 2, 3, 4, 5, NaN]), 3)
  assert.strictEqual(mean([10, null, 3, undefined, 5, NaN]), 6)
})

it("mean(array) returns undefined if the array contains no observed values", () => {
  assert.strictEqual(mean([]), undefined)
  assert.strictEqual(mean([null]), undefined)
  assert.strictEqual(mean([undefined]), undefined)
  assert.strictEqual(mean([NaN]), undefined)
  assert.strictEqual(mean([NaN, NaN]), undefined)
})

it("mean(array) coerces values to numbers", () => {
  assert.strictEqual(mean(["1"]), 1)
  assert.strictEqual(mean(["5", "1", "2", "3", "4"]), 3)
  assert.strictEqual(mean(["20", "3"]), 11.5)
  assert.strictEqual(mean(["3", "20"]), 11.5)
})

it("mean(array) coerces values exactly once", () => {
  const numbers = [1, new OneTimeNumber(3)]
  assert.strictEqual(mean(numbers), 2)
  assert.strictEqual(mean(numbers), 1)
})

it("mean(array, f) returns the mean value for numbers", () => {
  assert.strictEqual(mean([1].map(box), unbox), 1)
  assert.strictEqual(mean([5, 1, 2, 3, 4].map(box), unbox), 3)
  assert.strictEqual(mean([20, 3].map(box), unbox), 11.5)
  assert.strictEqual(mean([3, 20].map(box), unbox), 11.5)
})

it("mean(array, f) ignores null, undefined and NaN", () => {
  assert.strictEqual(mean([NaN, 1, 2, 3, 4, 5].map(box), unbox), 3)
  assert.strictEqual(mean([1, 2, 3, 4, 5, NaN].map(box), unbox), 3)
  assert.strictEqual(mean([10, null, 3, undefined, 5, NaN].map(box), unbox), 6)
})

it("mean(array, f) returns undefined if the array contains no observed values", () => {
  assert.strictEqual(mean([].map(box), unbox), undefined)
  assert.strictEqual(mean([null].map(box), unbox), undefined)
  assert.strictEqual(mean([undefined].map(box), unbox), undefined)
  assert.strictEqual(mean([NaN].map(box), unbox), undefined)
  assert.strictEqual(mean([NaN, NaN].map(box), unbox), undefined)
})

it("mean(array, f) coerces values to numbers", () => {
  assert.strictEqual(mean(["1"].map(box), unbox), 1)
  assert.strictEqual(mean(["5", "1", "2", "3", "4"].map(box), unbox), 3)
  assert.strictEqual(mean(["20", "3"].map(box), unbox), 11.5)
  assert.strictEqual(mean(["3", "20"].map(box), unbox), 11.5)
})

it("mean(array, f) coerces values exactly once", () => {
  const numbers = [1, new OneTimeNumber(3)].map(box)
  assert.strictEqual(mean(numbers, unbox), 2)
  assert.strictEqual(mean(numbers, unbox), 1)
})

it("mean(array, f) passes the accessor d, i, and array", () => {
  const results = []
  const strings = ["a", "b", "c"]
  mean(strings, (d, i, array) => results.push([d, i, array]))
  assert.deepStrictEqual(results, [
    ["a", 0, strings],
    ["b", 1, strings],
    ["c", 2, strings],
  ])
})

it("mean(array, f) uses the undefined context", () => {
  const results = []
  mean([1, 2], function () {
    results.push(this)
  })
  assert.deepStrictEqual(results, [undefined, undefined])
})

function box(value) {
  return { value: value }
}

function unbox(box) {
  return box.value
}
import assert from "assert"
import { median, medianIndex } from "../src/index.js"
import { OneTimeNumber } from "./OneTimeNumber.js"

it("median(array) returns the median value for numbers", () => {
  assert.strictEqual(median([1]), 1)
  assert.strictEqual(median([5, 1, 2, 3]), 2.5)
  assert.strictEqual(median([5, 1, 2, 3, 4]), 3)
  assert.strictEqual(median([20, 3]), 11.5)
  assert.strictEqual(median([3, 20]), 11.5)
})

it("median(array) ignores null, undefined and NaN", () => {
  assert.strictEqual(median([NaN, 1, 2, 3, 4, 5]), 3)
  assert.strictEqual(median([1, 2, 3, 4, 5, NaN]), 3)
  assert.strictEqual(median([10, null, 3, undefined, 5, NaN]), 5)
})

it("median(array) can handle large numbers without overflowing", () => {
  assert.strictEqual(median([Number.MAX_VALUE, Number.MAX_VALUE]), Number.MAX_VALUE)
  assert.strictEqual(median([-Number.MAX_VALUE, -Number.MAX_VALUE]), -Number.MAX_VALUE)
})

it("median(array) returns undefined if the array contains no observed values", () => {
  assert.strictEqual(median([]), undefined)
  assert.strictEqual(median([null]), undefined)
  assert.strictEqual(median([undefined]), undefined)
  assert.strictEqual(median([NaN]), undefined)
  assert.strictEqual(median([NaN, NaN]), undefined)
})

it("median(array) coerces strings to numbers", () => {
  assert.strictEqual(median(["1"]), 1)
  assert.strictEqual(median(["5", "1", "2", "3", "4"]), 3)
  assert.strictEqual(median(["20", "3"]), 11.5)
  assert.strictEqual(median(["3", "20"]), 11.5)
  assert.strictEqual(median(["2", "3", "20"]), 3)
  assert.strictEqual(median(["20", "3", "2"]), 3)
})

it("median(array) coerces values exactly once", () => {
  const array = [1, new OneTimeNumber(3)]
  assert.strictEqual(median(array), 2)
  assert.strictEqual(median(array), 1)
})

it("median(array, f) returns the median value for numbers", () => {
  assert.strictEqual(median([1].map(box), unbox), 1)
  assert.strictEqual(median([5, 1, 2, 3, 4].map(box), unbox), 3)
  assert.strictEqual(median([20, 3].map(box), unbox), 11.5)
  assert.strictEqual(median([3, 20].map(box), unbox), 11.5)
})

it("median(array, f) ignores null, undefined and NaN", () => {
  assert.strictEqual(median([NaN, 1, 2, 3, 4, 5].map(box), unbox), 3)
  assert.strictEqual(median([1, 2, 3, 4, 5, NaN].map(box), unbox), 3)
  assert.strictEqual(median([10, null, 3, undefined, 5, NaN].map(box), unbox), 5)
})

it("median(array, f) can handle large numbers without overflowing", () => {
  assert.strictEqual(median([Number.MAX_VALUE, Number.MAX_VALUE].map(box), unbox), Number.MAX_VALUE)
  assert.strictEqual(median([-Number.MAX_VALUE, -Number.MAX_VALUE].map(box), unbox), -Number.MAX_VALUE)
})

it("median(array, f) returns undefined if the array contains no observed values", () => {
  assert.strictEqual(median([].map(box), unbox), undefined)
  assert.strictEqual(median([null].map(box), unbox), undefined)
  assert.strictEqual(median([undefined].map(box), unbox), undefined)
  assert.strictEqual(median([NaN].map(box), unbox), undefined)
  assert.strictEqual(median([NaN, NaN].map(box), unbox), undefined)
})

it("median(array, f) coerces strings to numbers", () => {
  assert.strictEqual(median(["1"].map(box), unbox), 1)
  assert.strictEqual(median(["5", "1", "2", "3", "4"].map(box), unbox), 3)
  assert.strictEqual(median(["20", "3"].map(box), unbox), 11.5)
  assert.strictEqual(median(["3", "20"].map(box), unbox), 11.5)
  assert.strictEqual(median(["2", "3", "20"].map(box), unbox), 3)
  assert.strictEqual(median(["20", "3", "2"].map(box), unbox), 3)
})

it("median(array, f) coerces values exactly once", () => {
  const array = [1, new OneTimeNumber(3)].map(box)
  assert.strictEqual(median(array, unbox), 2)
  assert.strictEqual(median(array, unbox), 1)
})

it("median(array, f) passes the accessor d, i, and array", () => {
  const results = []
  const array = ["a", "b", "c"]
  median(array, (d, i, array) => results.push([d, i, array]))
  assert.deepStrictEqual(results, [
    ["a", 0, array],
    ["b", 1, array],
    ["c", 2, array],
  ])
})

it("median(array, f) uses the undefined context", () => {
  const results = []
  median([1, 2], function () {
    results.push(this)
  })
  assert.deepStrictEqual(results, [undefined, undefined])
})

it("medianIndex(array) returns the index", () => {
  assert.deepStrictEqual(medianIndex([1, 2]), 0)
  assert.deepStrictEqual(medianIndex([1, 2, 3]), 1)
  assert.deepStrictEqual(medianIndex([1, 3, 2]), 2)
  assert.deepStrictEqual(medianIndex([2, 3, 1]), 0)
  assert.deepStrictEqual(medianIndex([1]), 0)
  assert.deepStrictEqual(medianIndex([]), undefined)
})

function box(value) {
  return { value: value }
}

function unbox(box) {
  return box.value
}
import assert from "assert"
import { merge } from "../src/index.js"

it("merge(arrays) merges an array of arrays", () => {
  const a = {},
    b = {},
    c = {},
    d = {},
    e = {},
    f = {}
  assert.deepStrictEqual(merge([[a], [b, c], [d, e, f]]), [a, b, c, d, e, f])
})

it("merge(arrays) returns a new array when zero arrays are passed", () => {
  const input = []
  const output = merge(input)
  assert.deepStrictEqual(output, [])
  input.push([0.1])
  assert.deepStrictEqual(input, [[0.1]])
  assert.deepStrictEqual(output, [])
})

it("merge(arrays) returns a new array when one array is passed", () => {
  const input = [[1, 2, 3]]
  const output = merge(input)
  assert.deepStrictEqual(output, [1, 2, 3])
  input.push([4.1])
  input[0].push(3.1)
  assert.deepStrictEqual(input, [[1, 2, 3, 3.1], [4.1]])
  assert.deepStrictEqual(output, [1, 2, 3])
})

it("merge(arrays) returns a new array when two or more arrays are passed", () => {
  const input = [[1, 2, 3], [4, 5], [6]]
  const output = merge(input)
  assert.deepStrictEqual(output, [1, 2, 3, 4, 5, 6])
  input.push([7.1])
  input[0].push(3.1)
  input[1].push(5.1)
  input[2].push(6.1)
  assert.deepStrictEqual(input, [[1, 2, 3, 3.1], [4, 5, 5.1], [6, 6.1], [7.1]])
  assert.deepStrictEqual(output, [1, 2, 3, 4, 5, 6])
})

it("merge(arrays) does not modify the input arrays", () => {
  const input = [[1, 2, 3], [4, 5], [6]]
  merge(input)
  assert.deepStrictEqual(input, [[1, 2, 3], [4, 5], [6]])
})
import assert from "assert"
import { min } from "../src/index.js"

it("min(array) returns the least numeric value for numbers", () => {
  assert.deepStrictEqual(min([1]), 1)
  assert.deepStrictEqual(min([5, 1, 2, 3, 4]), 1)
  assert.deepStrictEqual(min([20, 3]), 3)
  assert.deepStrictEqual(min([3, 20]), 3)
})

it("min(array) returns the least lexicographic value for strings", () => {
  assert.deepStrictEqual(min(["c", "a", "b"]), "a")
  assert.deepStrictEqual(min(["20", "3"]), "20")
  assert.deepStrictEqual(min(["3", "20"]), "20")
})

it("min(array) ignores null, undefined and NaN", () => {
  const o = { valueOf: () => NaN }
  assert.deepStrictEqual(min([NaN, 1, 2, 3, 4, 5]), 1)
  assert.deepStrictEqual(min([o, 1, 2, 3, 4, 5]), 1)
  assert.deepStrictEqual(min([1, 2, 3, 4, 5, NaN]), 1)
  assert.deepStrictEqual(min([1, 2, 3, 4, 5, o]), 1)
  assert.deepStrictEqual(min([10, null, 3, undefined, 5, NaN]), 3)
  assert.deepStrictEqual(min([-1, null, -3, undefined, -5, NaN]), -5)
})

it("min(array) compares heterogenous types as numbers", () => {
  assert.strictEqual(min([20, "3"]), "3")
  assert.strictEqual(min(["20", 3]), 3)
  assert.strictEqual(min([3, "20"]), 3)
  assert.strictEqual(min(["3", 20]), "3")
})

it("min(array) returns undefined if the array contains no numbers", () => {
  assert.strictEqual(min([]), undefined)
  assert.strictEqual(min([null]), undefined)
  assert.strictEqual(min([undefined]), undefined)
  assert.strictEqual(min([NaN]), undefined)
  assert.strictEqual(min([NaN, NaN]), undefined)
})

it("min(array, f) returns the least numeric value for numbers", () => {
  assert.deepStrictEqual(min([1].map(box), unbox), 1)
  assert.deepStrictEqual(min([5, 1, 2, 3, 4].map(box), unbox), 1)
  assert.deepStrictEqual(min([20, 3].map(box), unbox), 3)
  assert.deepStrictEqual(min([3, 20].map(box), unbox), 3)
})

it("min(array, f) returns the least lexicographic value for strings", () => {
  assert.deepStrictEqual(min(["c", "a", "b"].map(box), unbox), "a")
  assert.deepStrictEqual(min(["20", "3"].map(box), unbox), "20")
  assert.deepStrictEqual(min(["3", "20"].map(box), unbox), "20")
})

it("min(array, f) ignores null, undefined and NaN", () => {
  const o = { valueOf: () => NaN }
  assert.deepStrictEqual(min([NaN, 1, 2, 3, 4, 5].map(box), unbox), 1)
  assert.deepStrictEqual(min([o, 1, 2, 3, 4, 5].map(box), unbox), 1)
  assert.deepStrictEqual(min([1, 2, 3, 4, 5, NaN].map(box), unbox), 1)
  assert.deepStrictEqual(min([1, 2, 3, 4, 5, o].map(box), unbox), 1)
  assert.deepStrictEqual(min([10, null, 3, undefined, 5, NaN].map(box), unbox), 3)
  assert.deepStrictEqual(min([-1, null, -3, undefined, -5, NaN].map(box), unbox), -5)
})

it("min(array, f) compares heterogenous types as numbers", () => {
  assert.strictEqual(min([20, "3"].map(box), unbox), "3")
  assert.strictEqual(min(["20", 3].map(box), unbox), 3)
  assert.strictEqual(min([3, "20"].map(box), unbox), 3)
  assert.strictEqual(min(["3", 20].map(box), unbox), "3")
})

it("min(array, f) returns undefined if the array contains no observed values", () => {
  assert.strictEqual(min([].map(box), unbox), undefined)
  assert.strictEqual(min([null].map(box), unbox), undefined)
  assert.strictEqual(min([undefined].map(box), unbox), undefined)
  assert.strictEqual(min([NaN].map(box), unbox), undefined)
  assert.strictEqual(min([NaN, NaN].map(box), unbox), undefined)
})

it("min(array, f) passes the accessor d, i, and array", () => {
  const results = []
  const array = ["a", "b", "c"]
  min(array, (d, i, array) => results.push([d, i, array]))
  assert.deepStrictEqual(results, [
    ["a", 0, array],
    ["b", 1, array],
    ["c", 2, array],
  ])
})

it("min(array, f) uses the undefined context", () => {
  const results = []
  min([1, 2], function () {
    results.push(this)
  })
  assert.deepStrictEqual(results, [undefined, undefined])
})

function box(value) {
  return { value: value }
}

function unbox(box) {
  return box.value
}
import assert from "assert"
import { minIndex } from "../src/index.js"

it("minIndex(array) returns the index of the least numeric value for numbers", () => {
  assert.deepStrictEqual(minIndex([1]), 0)
  assert.deepStrictEqual(minIndex([5, 1, 2, 3, 4]), 1)
  assert.deepStrictEqual(minIndex([20, 3]), 1)
  assert.deepStrictEqual(minIndex([3, 20]), 0)
})

it("minIndex(array) returns the index of the least lexicographic value for strings", () => {
  assert.deepStrictEqual(minIndex(["c", "a", "b"]), 1)
  assert.deepStrictEqual(minIndex(["20", "3"]), 0)
  assert.deepStrictEqual(minIndex(["3", "20"]), 1)
})

it("minIndex(array) ignores null, undefined and NaN", () => {
  const o = { valueOf: () => NaN }
  assert.deepStrictEqual(minIndex([NaN, 1, 2, 3, 4, 5]), 1)
  assert.deepStrictEqual(minIndex([o, 1, 2, 3, 4, 5]), 1)
  assert.deepStrictEqual(minIndex([1, 2, 3, 4, 5, NaN]), 0)
  assert.deepStrictEqual(minIndex([1, 2, 3, 4, 5, o]), 0)
  assert.deepStrictEqual(minIndex([10, null, 3, undefined, 5, NaN]), 2)
  assert.deepStrictEqual(minIndex([-1, null, -3, undefined, -5, NaN]), 4)
})

it("minIndex(array) compares heterogenous types as numbers", () => {
  assert.strictEqual(minIndex([20, "3"]), 1)
  assert.strictEqual(minIndex(["20", 3]), 1)
  assert.strictEqual(minIndex([3, "20"]), 0)
  assert.strictEqual(minIndex(["3", 20]), 0)
})

it("minIndex(array) returns -1 if the array contains no numbers", () => {
  assert.strictEqual(minIndex([]), -1)
  assert.strictEqual(minIndex([null]), -1)
  assert.strictEqual(minIndex([undefined]), -1)
  assert.strictEqual(minIndex([NaN]), -1)
  assert.strictEqual(minIndex([NaN, NaN]), -1)
})

it("minIndex(array, f) returns the index of the least numeric value for numbers", () => {
  assert.deepStrictEqual(minIndex([1].map(box), unbox), 0)
  assert.deepStrictEqual(minIndex([5, 1, 2, 3, 4].map(box), unbox), 1)
  assert.deepStrictEqual(minIndex([20, 3].map(box), unbox), 1)
  assert.deepStrictEqual(minIndex([3, 20].map(box), unbox), 0)
})

it("minIndex(array, f) returns the index of the least lexicographic value for strings", () => {
  assert.deepStrictEqual(minIndex(["c", "a", "b"].map(box), unbox), 1)
  assert.deepStrictEqual(minIndex(["20", "3"].map(box), unbox), 0)
  assert.deepStrictEqual(minIndex(["3", "20"].map(box), unbox), 1)
})

it("minIndex(array, f) ignores null, undefined and NaN", () => {
  const o = { valueOf: () => NaN }
  assert.deepStrictEqual(minIndex([NaN, 1, 2, 3, 4, 5].map(box), unbox), 1)
  assert.deepStrictEqual(minIndex([o, 1, 2, 3, 4, 5].map(box), unbox), 1)
  assert.deepStrictEqual(minIndex([1, 2, 3, 4, 5, NaN].map(box), unbox), 0)
  assert.deepStrictEqual(minIndex([1, 2, 3, 4, 5, o].map(box), unbox), 0)
  assert.deepStrictEqual(minIndex([10, null, 3, undefined, 5, NaN].map(box), unbox), 2)
  assert.deepStrictEqual(minIndex([-1, null, -3, undefined, -5, NaN].map(box), unbox), 4)
})

it("minIndex(array, f) compares heterogenous types as numbers", () => {
  assert.strictEqual(minIndex([20, "3"].map(box), unbox), 1)
  assert.strictEqual(minIndex(["20", 3].map(box), unbox), 1)
  assert.strictEqual(minIndex([3, "20"].map(box), unbox), 0)
  assert.strictEqual(minIndex(["3", 20].map(box), unbox), 0)
})

it("minIndex(array, f) returns -1 if the array contains no observed values", () => {
  assert.strictEqual(minIndex([].map(box), unbox), -1)
  assert.strictEqual(minIndex([null].map(box), unbox), -1)
  assert.strictEqual(minIndex([undefined].map(box), unbox), -1)
  assert.strictEqual(minIndex([NaN].map(box), unbox), -1)
  assert.strictEqual(minIndex([NaN, NaN].map(box), unbox), -1)
})

it("minIndex(array, f) passes the accessor d, i, and array", () => {
  const results = []
  const array = ["a", "b", "c"]
  minIndex(array, (d, i, array) => results.push([d, i, array]))
  assert.deepStrictEqual(results, [
    ["a", 0, array],
    ["b", 1, array],
    ["c", 2, array],
  ])
})

it("minIndex(array, f) uses the undefined context", () => {
  const results = []
  minIndex([1, 2], function () {
    results.push(this)
  })
  assert.deepStrictEqual(results, [undefined, undefined])
})

function box(value) {
  return { value: value }
}

function unbox(box) {
  return box.value
}
import assert from "assert"
import { mode } from "../src/index.js"

it("mode(array) returns the most frequent value for numbers", () => {
  assert.strictEqual(mode([1]), 1)
  assert.strictEqual(mode([5, 1, 1, 3, 4]), 1)
})

it("mode(array) returns the most frequent value for strings", () => {
  assert.strictEqual(mode(["1"]), "1")
  assert.strictEqual(mode(["5", "1", "1", "3", "4"]), "1")
})

it("mode(array) returns the most frequent value for heterogenous types", () => {
  assert.strictEqual(mode(["1"]), "1")
  assert.strictEqual(mode(["5", "1", "1", 2, 2, "2", 1, 1, 1, "3", "4"]), 1)
  assert.strictEqual(mode(["5", 2, 2, "2", "2", 1, 1, 1, "3", "4"]), 1)
})

it("mode(array) returns the first of the most frequent values", () => {
  assert.strictEqual(mode(["5", "1", "1", "2", "2", "3", "4"]), "1")
})

it("mode(array) ignores null, undefined and NaN", () => {
  const o = { valueOf: () => NaN }
  assert.strictEqual(mode([NaN, 1, 1, 3, 4, 5]), 1)
  assert.strictEqual(mode([o, 1, null, null, 1, null]), 1)
  assert.strictEqual(mode([1, NaN, NaN, 1, 5, NaN]), 1)
  assert.strictEqual(mode([1, o, o, 1, 5, o]), 1)
  assert.strictEqual(mode([1, undefined, undefined, 1, 5, undefined]), 1)
})

it("mode(array) returns undefined if the array contains no comparable values", () => {
  assert.strictEqual(mode([]), undefined)
  assert.strictEqual(mode([null]), undefined)
  assert.strictEqual(mode([undefined]), undefined)
  assert.strictEqual(mode([NaN]), undefined)
  assert.strictEqual(mode([NaN, NaN]), undefined)
})

it("mode(array, f) returns the most frequent value for numbers", () => {
  assert.strictEqual(mode([1].map(box), unbox), 1)
  assert.strictEqual(mode([5, 1, 1, 3, 4].map(box), unbox), 1)
})

it("mode(array, f) returns the most frequent value for strings", () => {
  assert.strictEqual(mode(["1"].map(box), unbox), "1")
  assert.strictEqual(mode(["5", "1", "1", "3", "4"].map(box), unbox), "1")
})

it("mode(array, f) returns the most frequent value for heterogenous types", () => {
  assert.strictEqual(mode(["1"].map(box), unbox), "1")
  assert.strictEqual(mode(["5", "1", "1", 2, 2, "2", 1, 1, 1, "3", "4"].map(box), unbox), 1)
})

it("mode(array, f) returns the first of the most frequent values", () => {
  assert.strictEqual(mode(["5", "1", "1", "2", "2", "3", "4"].map(box), unbox), "1")
})

it("mode(array, f) ignores null, undefined and NaN", () => {
  const o = { valueOf: () => NaN }
  assert.strictEqual(mode([NaN, 1, 1, 3, 4, 5].map(box), unbox), 1)
  assert.strictEqual(mode([o, 1, null, null, 1, null].map(box), unbox), 1)
  assert.strictEqual(mode([1, NaN, NaN, 1, 5, NaN].map(box), unbox), 1)
  assert.strictEqual(mode([1, o, o, 1, 5, o].map(box), unbox), 1)
  assert.strictEqual(mode([1, undefined, undefined, 1, 5, undefined].map(box), unbox), 1)
})

it("mode(array, f) returns undefined if the array contains no comparable values", () => {
  assert.strictEqual(mode([].map(box), unbox), undefined)
  assert.strictEqual(mode([null].map(box), unbox), undefined)
  assert.strictEqual(mode([undefined].map(box), unbox), undefined)
  assert.strictEqual(mode([NaN].map(box), unbox), undefined)
  assert.strictEqual(mode([NaN, NaN].map(box), unbox), undefined)
})

it("mode(array, f) passes the accessor d, i, and array", () => {
  const results = []
  const array = ["a", "b", "c"]
  mode(array, (d, i, array) => results.push([d, i, array]))
  assert.deepStrictEqual(results, [
    ["a", 0, array],
    ["b", 1, array],
    ["c", 2, array],
  ])
})

it("mode(array, f) uses the undefined context", () => {
  const results = []
  mode([1, 2], function () {
    results.push(this)
  })
  assert.deepStrictEqual(results, [undefined, undefined])
})

function box(value) {
  return { value: value }
}

function unbox(box) {
  return box.value
}
import assert from "assert"
import { nice } from "../src/index.js"

it("nice(start, stop, count) returns [start, stop] if any argument is NaN", () => {
  assert.deepStrictEqual(nice(NaN, 1, 1), [NaN, 1])
  assert.deepStrictEqual(nice(0, NaN, 1), [0, NaN])
  assert.deepStrictEqual(nice(0, 1, NaN), [0, 1])
  assert.deepStrictEqual(nice(NaN, NaN, 1), [NaN, NaN])
  assert.deepStrictEqual(nice(0, NaN, NaN), [0, NaN])
  assert.deepStrictEqual(nice(NaN, 1, NaN), [NaN, 1])
  assert.deepStrictEqual(nice(NaN, NaN, NaN), [NaN, NaN])
})

it("nice(start, stop, count) returns [start, stop] if start === stop", () => {
  assert.deepStrictEqual(nice(1, 1, -1), [1, 1])
  assert.deepStrictEqual(nice(1, 1, 0), [1, 1])
  assert.deepStrictEqual(nice(1, 1, NaN), [1, 1])
  assert.deepStrictEqual(nice(1, 1, 1), [1, 1])
  assert.deepStrictEqual(nice(1, 1, 10), [1, 1])
})

it("nice(start, stop, count) returns [start, stop] if count is not positive", () => {
  assert.deepStrictEqual(nice(0, 1, -1), [0, 1])
  assert.deepStrictEqual(nice(0, 1, 0), [0, 1])
})

it("nice(start, stop, count) returns [start, stop] if count is infinity", () => {
  assert.deepStrictEqual(nice(0, 1, Infinity), [0, 1])
})

it("nice(start, stop, count) returns the expected values", () => {
  assert.deepStrictEqual(nice(0.132, 0.876, 1000), [0.132, 0.876])
  assert.deepStrictEqual(nice(0.132, 0.876, 100), [0.13, 0.88])
  assert.deepStrictEqual(nice(0.132, 0.876, 30), [0.12, 0.88])
  assert.deepStrictEqual(nice(0.132, 0.876, 10), [0.1, 0.9])
  assert.deepStrictEqual(nice(0.132, 0.876, 6), [0.1, 0.9])
  assert.deepStrictEqual(nice(0.132, 0.876, 5), [0, 1])
  assert.deepStrictEqual(nice(0.132, 0.876, 1), [0, 1])
  assert.deepStrictEqual(nice(132, 876, 1000), [132, 876])
  assert.deepStrictEqual(nice(132, 876, 100), [130, 880])
  assert.deepStrictEqual(nice(132, 876, 30), [120, 880])
  assert.deepStrictEqual(nice(132, 876, 10), [100, 900])
  assert.deepStrictEqual(nice(132, 876, 6), [100, 900])
  assert.deepStrictEqual(nice(132, 876, 5), [0, 1000])
  assert.deepStrictEqual(nice(132, 876, 1), [0, 1000])
})
import assert from "assert"
import { pairs } from "../src/index.js"

it("pairs(array) returns the empty array if input array has fewer than two elements", () => {
  assert.deepStrictEqual(pairs([]), [])
  assert.deepStrictEqual(pairs([1]), [])
})

it("pairs(array) returns pairs of adjacent elements in the given array", () => {
  const a = {},
    b = {},
    c = {},
    d = {}
  assert.deepStrictEqual(pairs([1, 2]), [[1, 2]])
  assert.deepStrictEqual(pairs([1, 2, 3]), [
    [1, 2],
    [2, 3],
  ])
  assert.deepStrictEqual(pairs([a, b, c, d]), [
    [a, b],
    [b, c],
    [c, d],
  ])
})

it("pairs(array, f) invokes the function f for each pair of adjacent elements", () => {
  assert.deepStrictEqual(
    pairs([1, 3, 7], (a, b) => b - a),
    [2, 4]
  )
})

it("pairs(array) includes null or undefined elements in pairs", () => {
  assert.deepStrictEqual(pairs([1, null, 2]), [
    [1, null],
    [null, 2],
  ])
  assert.deepStrictEqual(pairs([1, 2, undefined]), [
    [1, 2],
    [2, undefined],
  ])
})
import assert from "assert"
import { permute } from "../src/index.js"

it("permute(…) permutes according to the specified index", () => {
  assert.deepStrictEqual(permute([3, 4, 5], [2, 1, 0]), [5, 4, 3])
  assert.deepStrictEqual(permute([3, 4, 5], [2, 0, 1]), [5, 3, 4])
  assert.deepStrictEqual(permute([3, 4, 5], [0, 1, 2]), [3, 4, 5])
})

it("permute(…) does not modify the input array", () => {
  const input = [3, 4, 5]
  permute(input, [2, 1, 0])
  assert.deepStrictEqual(input, [3, 4, 5])
})

it("permute(…) can duplicate input values", () => {
  assert.deepStrictEqual(permute([3, 4, 5], [0, 1, 0]), [3, 4, 3])
  assert.deepStrictEqual(permute([3, 4, 5], [2, 2, 2]), [5, 5, 5])
  assert.deepStrictEqual(permute([3, 4, 5], [0, 1, 1]), [3, 4, 4])
})

it("permute(…) can return more elements", () => {
  assert.deepStrictEqual(permute([3, 4, 5], [0, 0, 1, 2]), [3, 3, 4, 5])
  assert.deepStrictEqual(permute([3, 4, 5], [0, 1, 1, 1]), [3, 4, 4, 4])
})

it("permute(…) can return fewer elements", () => {
  assert.deepStrictEqual(permute([3, 4, 5], [0]), [3])
  assert.deepStrictEqual(permute([3, 4, 5], [1, 2]), [4, 5])
  assert.deepStrictEqual(permute([3, 4, 5], []), [])
})

it("permute(…) can return undefined elements", () => {
  assert.deepStrictEqual(permute([3, 4, 5], [10]), [undefined])
  assert.deepStrictEqual(permute([3, 4, 5], [-1]), [undefined])
  assert.deepStrictEqual(permute([3, 4, 5], [0, -1]), [3, undefined])
})

it("permute(…) can take an object as the source", () => {
  assert.deepStrictEqual(permute({ foo: 1, bar: 2 }, ["bar", "foo"]), [2, 1])
})

it("permute(…) can take a typed array as the source", () => {
  assert.deepStrictEqual(permute(Float32Array.of(1, 2), [0, 0, 1, 0]), [1, 1, 2, 1])
  assert.strictEqual(Array.isArray(permute(Float32Array.of(1, 2), [0])), true)
})

it("permute(…) can take an iterable as the keys", () => {
  assert.deepStrictEqual(permute({ foo: 1, bar: 2 }, new Set(["bar", "foo"])), [2, 1])
})
import assert from "assert"
import { quantile, quantileIndex, quantileSorted } from "../src/index.js"

it("quantileSorted(array, p) requires sorted numeric input, quantile doesn't", () => {
  assert.strictEqual(quantileSorted([1, 2, 3, 4], 0), 1)
  assert.strictEqual(quantileSorted([1, 2, 3, 4], 1), 4)
  assert.strictEqual(quantileSorted([4, 3, 2, 1], 0), 4)
  assert.strictEqual(quantileSorted([4, 3, 2, 1], 1), 1)
  assert.strictEqual(quantile([1, 2, 3, 4], 0), 1)
  assert.strictEqual(quantile([1, 2, 3, 4], 1), 4)
  assert.strictEqual(quantile([4, 3, 2, 1], 0), 1)
  assert.strictEqual(quantile([4, 3, 2, 1], 1), 4)
})

it("quantile() accepts an iterable", () => {
  assert.strictEqual(quantile(new Set([1, 2, 3, 4]), 1), 4)
})

it("quantile(array, p) uses the R-7 method", () => {
  const even = [3, 6, 7, 8, 8, 10, 13, 15, 16, 20]
  assert.strictEqual(quantile(even, 0), 3)
  assert.strictEqual(quantile(even, 0.25), 7.25)
  assert.strictEqual(quantile(even, 0.5), 9)
  assert.strictEqual(quantile(even, 0.75), 14.5)
  assert.strictEqual(quantile(even, 1), 20)
  const odd = [3, 6, 7, 8, 8, 9, 10, 13, 15, 16, 20]
  assert.strictEqual(quantile(odd, 0), 3)
  assert.strictEqual(quantile(odd, 0.25), 7.5)
  assert.strictEqual(quantile(odd, 0.5), 9)
  assert.strictEqual(quantile(odd, 0.75), 14)
  assert.strictEqual(quantile(odd, 1), 20)
})

it("quantile(array, p) coerces values to numbers", () => {
  const strings = ["1", "2", "3", "4"]
  assert.strictEqual(quantile(strings, 1 / 3), 2)
  assert.strictEqual(quantile(strings, 1 / 2), 2.5)
  assert.strictEqual(quantile(strings, 2 / 3), 3)
  const dates = [new Date(Date.UTC(2011, 0, 1)), new Date(Date.UTC(2012, 0, 1))]
  assert.strictEqual(quantile(dates, 0), +new Date(Date.UTC(2011, 0, 1)))
  assert.strictEqual(quantile(dates, 1 / 2), +new Date(Date.UTC(2011, 6, 2, 12)))
  assert.strictEqual(quantile(dates, 1), +new Date(Date.UTC(2012, 0, 1)))
})

it("quantile(array, p) returns an exact value for integer p-values", () => {
  const data = [1, 2, 3, 4]
  assert.strictEqual(quantile(data, 1 / 3), 2)
  assert.strictEqual(quantile(data, 2 / 3), 3)
})

it("quantile(array, p) returns the expected value for integer or fractional p", () => {
  const data = [3, 1, 2, 4, 0]
  assert.strictEqual(quantile(data, 0 / 4), 0)
  assert.strictEqual(quantile(data, 0.1 / 4), 0.1)
  assert.strictEqual(quantile(data, 1 / 4), 1)
  assert.strictEqual(quantile(data, 1.5 / 4), 1.5)
  assert.strictEqual(quantile(data, 2 / 4), 2)
  assert.strictEqual(quantile(data, 2.5 / 4), 2.5)
  assert.strictEqual(quantile(data, 3 / 4), 3)
  assert.strictEqual(quantile(data, 3.2 / 4), 3.2)
  assert.strictEqual(quantile(data, 4 / 4), 4)
})

it("quantile(array, p) returns the first value for p = 0", () => {
  const data = [1, 2, 3, 4]
  assert.strictEqual(quantile(data, 0), 1)
})

it("quantile(array, p) returns the last value for p = 1", () => {
  const data = [1, 2, 3, 4]
  assert.strictEqual(quantile(data, 1), 4)
})

it("quantile(array, p, f) observes the specified accessor", () => {
  assert.strictEqual(quantile([1, 2, 3, 4].map(box), 0.5, unbox), 2.5)
  assert.strictEqual(quantile([1, 2, 3, 4].map(box), 0, unbox), 1)
  assert.strictEqual(quantile([1, 2, 3, 4].map(box), 1, unbox), 4)
  assert.strictEqual(quantile([2].map(box), 0, unbox), 2)
  assert.strictEqual(quantile([2].map(box), 0.5, unbox), 2)
  assert.strictEqual(quantile([2].map(box), 1, unbox), 2)
  assert.strictEqual(quantile([], 0, unbox), undefined)
  assert.strictEqual(quantile([], 0.5, unbox), undefined)
  assert.strictEqual(quantile([], 1, unbox), undefined)
})

it("quantileIndex(array, p) returns the index", () => {
  assert.deepStrictEqual(quantileIndex([1, 2], 0.2), 0)
  assert.deepStrictEqual(quantileIndex([1, 2, 3], 0.2), 0)
  assert.deepStrictEqual(quantileIndex([1, 3, 2], 0.2), 0)
  assert.deepStrictEqual(quantileIndex([2, 3, 1], 0.2), 2)
  assert.deepStrictEqual(quantileIndex([1], 0.2), 0)
  assert.deepStrictEqual(quantileIndex([], 0.2), undefined)
})

it("quantileIndex(array, 0) returns the minimum index", () => {
  assert.deepStrictEqual(quantileIndex([1, 2], 0), 0)
  assert.deepStrictEqual(quantileIndex([1, 2, 3], 0), 0)
  assert.deepStrictEqual(quantileIndex([1, 3, 2], 0), 0)
  assert.deepStrictEqual(quantileIndex([2, 3, 1], 0), 2)
  assert.deepStrictEqual(quantileIndex([1], 0), 0)
  assert.deepStrictEqual(quantileIndex([], 0), undefined)
})

it("quantileIndex(array, 1) returns the maxium index", () => {
  assert.deepStrictEqual(quantileIndex([1, 2], 1), 1)
  assert.deepStrictEqual(quantileIndex([1, 2, 3], 1), 2)
  assert.deepStrictEqual(quantileIndex([1, 3, 2], 1), 1)
  assert.deepStrictEqual(quantileIndex([2, 3, 1], 1), 1)
  assert.deepStrictEqual(quantileIndex([1], 1), 0)
  assert.deepStrictEqual(quantileIndex([], 1), undefined)
})

function box(value) {
  return { value: value }
}

function unbox(box) {
  return box.value
}
import assert from "assert"
import { range } from "../src/index.js"

it("range(stop) returns [0, 1, 2, … stop - 1]", () => {
  assert.deepStrictEqual(range(5), [0, 1, 2, 3, 4])
  assert.deepStrictEqual(range(2.01), [0, 1, 2])
  assert.deepStrictEqual(range(1), [0])
  assert.deepStrictEqual(range(0.5), [0])
})

it("range(stop) returns an empty array if stop <= 0", () => {
  assert.deepStrictEqual(range(0), [])
  assert.deepStrictEqual(range(-0.5), [])
  assert.deepStrictEqual(range(-1), [])
})

it("range(stop) returns an empty array if stop is NaN", () => {
  assert.deepStrictEqual(range(NaN), [])
  assert.deepStrictEqual(range(), [])
})

it("range(start, stop) returns [start, start + 1, … stop - 1]", () => {
  assert.deepStrictEqual(range(0, 5), [0, 1, 2, 3, 4])
  assert.deepStrictEqual(range(2, 5), [2, 3, 4])
  assert.deepStrictEqual(range(2.5, 5), [2.5, 3.5, 4.5])
  assert.deepStrictEqual(range(-1, 3), [-1, 0, 1, 2])
})

it("range(start, stop) returns an empty array if start or stop is NaN", () => {
  assert.deepStrictEqual(range(0, NaN), [])
  assert.deepStrictEqual(range(1, NaN), [])
  assert.deepStrictEqual(range(-1, NaN), [])
  assert.deepStrictEqual(range(0, undefined), [])
  assert.deepStrictEqual(range(1, undefined), [])
  assert.deepStrictEqual(range(-1, undefined), [])
  assert.deepStrictEqual(range(NaN, 0), [])
  assert.deepStrictEqual(range(NaN, 1), [])
  assert.deepStrictEqual(range(NaN, -1), [])
  assert.deepStrictEqual(range(undefined, 0), [])
  assert.deepStrictEqual(range(undefined, 1), [])
  assert.deepStrictEqual(range(undefined, -1), [])
  assert.deepStrictEqual(range(NaN, NaN), [])
  assert.deepStrictEqual(range(undefined, undefined), [])
})

it("range(start, stop) returns an empty array if start >= stop", () => {
  assert.deepStrictEqual(range(0, 0), [])
  assert.deepStrictEqual(range(5, 5), [])
  assert.deepStrictEqual(range(6, 5), [])
  assert.deepStrictEqual(range(10, 10), [])
  assert.deepStrictEqual(range(20, 10), [])
})

it("range(start, stop, step) returns [start, start + step, start + 2 * step, … stop - step]", () => {
  assert.deepStrictEqual(range(0, 5, 1), [0, 1, 2, 3, 4])
  assert.deepStrictEqual(range(0, 5, 2), [0, 2, 4])
  assert.deepStrictEqual(range(2, 5, 2), [2, 4])
  assert.deepStrictEqual(range(-1, 3, 2), [-1, 1])
})

it("range(start, stop, step) allows a negative step", () => {
  assert.deepStrictEqual(range(5, 0, -1), [5, 4, 3, 2, 1])
  assert.deepStrictEqual(range(5, 0, -2), [5, 3, 1])
  assert.deepStrictEqual(range(5, 2, -2), [5, 3])
  assert.deepStrictEqual(range(3, -1, -2), [3, 1])
})

it("range(start, stop, step) returns an empty array if start >= stop and step > 0", () => {
  assert.deepStrictEqual(range(5, 5, 2), [])
  assert.deepStrictEqual(range(6, 5, 2), [])
  assert.deepStrictEqual(range(10, 10, 1), [])
  assert.deepStrictEqual(range(10, 10, 0.5), [])
  assert.deepStrictEqual(range(0, 0, 1), [])
  assert.deepStrictEqual(range(0, 0, 0.5), [])
  assert.deepStrictEqual(range(20, 10, 2), [])
  assert.deepStrictEqual(range(20, 10, 1), [])
  assert.deepStrictEqual(range(20, 10, 0.5), [])
})

it("range(start, stop, step) returns an empty array if start >= stop and step < 0", () => {
  assert.deepStrictEqual(range(5, 5, -2), [])
  assert.deepStrictEqual(range(5, 6, -2), [])
  assert.deepStrictEqual(range(10, 10, -1), [])
  assert.deepStrictEqual(range(10, 10, -0.5), [])
  assert.deepStrictEqual(range(0, 0, -1), [])
  assert.deepStrictEqual(range(0, 0, -0.5), [])
  assert.deepStrictEqual(range(10, 20, -2), [])
  assert.deepStrictEqual(range(10, 20, -1), [])
  assert.deepStrictEqual(range(10, 20, -0.5), [])
})

it("range(start, stop, step) returns an empty array if start, stop or step is NaN", () => {
  assert.deepStrictEqual(range(NaN, 3, 2), [])
  assert.deepStrictEqual(range(3, NaN, 2), [])
  assert.deepStrictEqual(range(0, 5, NaN), [])
  assert.deepStrictEqual(range(NaN, NaN, NaN), [])
  assert.deepStrictEqual(range(NaN, NaN, NaN), [])
  assert.deepStrictEqual(range(undefined, undefined, undefined), [])
  assert.deepStrictEqual(range(0, 10, NaN), [])
  assert.deepStrictEqual(range(10, 0, NaN), [])
  assert.deepStrictEqual(range(0, 10, undefined), [])
  assert.deepStrictEqual(range(10, 0, undefined), [])
})

it("range(start, stop, step) returns an empty array if step is zero", () => {
  assert.deepStrictEqual(range(0, 5, 0), [])
})

it("range(start, stop, step) returns exactly [start + step * i, …] for fractional steps", () => {
  assert.deepStrictEqual(range(0, 0.5, 0.1), [0 + 0.1 * 0, 0 + 0.1 * 1, 0 + 0.1 * 2, 0 + 0.1 * 3, 0 + 0.1 * 4])
  assert.deepStrictEqual(range(0.5, 0, -0.1), [
    0.5 - 0.1 * 0,
    0.5 - 0.1 * 1,
    0.5 - 0.1 * 2,
    0.5 - 0.1 * 3,
    0.5 - 0.1 * 4,
  ])
  assert.deepStrictEqual(range(-2, -1.2, 0.1), [
    -2 + 0.1 * 0,
    -2 + 0.1 * 1,
    -2 + 0.1 * 2,
    -2 + 0.1 * 3,
    -2 + 0.1 * 4,
    -2 + 0.1 * 5,
    -2 + 0.1 * 6,
    -2 + 0.1 * 7,
  ])
  assert.deepStrictEqual(range(-1.2, -2, -0.1), [
    -1.2 - 0.1 * 0,
    -1.2 - 0.1 * 1,
    -1.2 - 0.1 * 2,
    -1.2 - 0.1 * 3,
    -1.2 - 0.1 * 4,
    -1.2 - 0.1 * 5,
    -1.2 - 0.1 * 6,
    -1.2 - 0.1 * 7,
  ])
})

it("range(start, stop, step) returns exactly [start + step * i, …] for very small fractional steps", () => {
  assert.deepStrictEqual(range(2.1e-31, 5e-31, 1.1e-31), [
    2.1e-31 + 1.1e-31 * 0,
    2.1e-31 + 1.1e-31 * 1,
    2.1e-31 + 1.1e-31 * 2,
  ])
  assert.deepStrictEqual(range(5e-31, 2.1e-31, -1.1e-31), [
    5e-31 - 1.1e-31 * 0,
    5e-31 - 1.1e-31 * 1,
    5e-31 - 1.1e-31 * 2,
  ])
})

it("range(start, stop, step) returns exactly [start + step * i, …] for very large fractional steps", () => {
  assert.deepStrictEqual(range(1e300, 2e300, 0.3e300), [
    1e300 + 0.3e300 * 0,
    1e300 + 0.3e300 * 1,
    1e300 + 0.3e300 * 2,
    1e300 + 0.3e300 * 3,
  ])
  assert.deepStrictEqual(range(2e300, 1e300, -0.3e300), [
    2e300 - 0.3e300 * 0,
    2e300 - 0.3e300 * 1,
    2e300 - 0.3e300 * 2,
    2e300 - 0.3e300 * 3,
  ])
})
;``
import assert from "assert"
import ascending from "../src/ascending.js"
import descending from "../src/descending.js"
import rank from "../src/rank.js"

it("rank(numbers) returns the rank of numbers", () => {
  assert.deepStrictEqual(rank([1000, 10, 0]), Float64Array.of(2, 1, 0))
  assert.deepStrictEqual(rank([1.2, 1.1, 1.2, 1.0, 1.5, 1.2]), Float64Array.of(2, 1, 2, 0, 5, 2))
})

it("rank(strings) returns the rank of letters", () => {
  assert.deepStrictEqual(rank([..."EDGFCBA"]), Float64Array.of(4, 3, 6, 5, 2, 1, 0))
  assert.deepStrictEqual(rank("EDGFCBA"), Float64Array.of(4, 3, 6, 5, 2, 1, 0))
})

it("rank(dates) returns the rank of Dates", () => {
  assert.deepStrictEqual(
    rank([new Date("2000-01-01"), new Date("2000-01-01"), new Date("1999-01-01"), new Date("2001-01-01")]),
    Float64Array.of(1, 1, 0, 3)
  )
})

it("rank(iterator) accepts an iterator", () => {
  assert.deepStrictEqual(rank(new Set(["B", "C", "A"])), Float64Array.of(1, 2, 0))
})

it("rank(undefineds) ranks undefined as NaN", () => {
  assert.deepStrictEqual(rank([1.2, 1.1, undefined, 1.0, undefined, 1.5]), Float64Array.of(2, 1, NaN, 0, NaN, 3))
  assert.deepStrictEqual(
    rank([, null, , 1.2, 1.1, undefined, 1.0, NaN, 1.5]),
    Float64Array.of(NaN, NaN, NaN, 2, 1, NaN, 0, NaN, 3)
  )
})

it("rank(values, valueof) accepts an accessor", () => {
  assert.deepStrictEqual(
    rank([{ x: 3 }, { x: 1 }, { x: 2 }, { x: 4 }, {}], d => d.x),
    Float64Array.of(2, 0, 1, 3, NaN)
  )
})

it("rank(values, compare) accepts a comparator", () => {
  assert.deepStrictEqual(
    rank([{ x: 3 }, { x: 1 }, { x: 2 }, { x: 4 }, {}], (a, b) => a.x - b.x),
    Float64Array.of(2, 0, 1, 3, NaN)
  )
  assert.deepStrictEqual(
    rank([{ x: 3 }, { x: 1 }, { x: 2 }, { x: 4 }, {}], (a, b) => b.x - a.x),
    Float64Array.of(1, 3, 2, 0, NaN)
  )
  assert.deepStrictEqual(
    rank(["aa", "ba", "bc", "bb", "ca"], (a, b) => ascending(a[0], b[0]) || ascending(a[1], b[1])),
    Float64Array.of(0, 1, 3, 2, 4)
  )
  assert.deepStrictEqual(rank(["A", null, "B", "C", "D"], descending), Float64Array.of(3, NaN, 2, 1, 0))
})

it("rank(values) computes the ties as expected", () => {
  assert.deepStrictEqual(rank(["a", "b", "b", "b", "c"]), Float64Array.of(0, 1, 1, 1, 4))
  assert.deepStrictEqual(rank(["a", "b", "b", "b", "b", "c"]), Float64Array.of(0, 1, 1, 1, 1, 5))
})

it("rank(values) handles NaNs as expected", () => {
  assert.deepStrictEqual(rank(["a", "b", "b", "b", "c", null]), Float64Array.of(0, 1, 1, 1, 4, NaN))
  assert.deepStrictEqual(rank(["a", "b", "b", "b", "b", "c", null]), Float64Array.of(0, 1, 1, 1, 1, 5, NaN))
})
import assert from "assert"
import { reduce } from "../src/index.js"

it("reduce(values, reducer) returns the reduced value", () => {
  assert.strictEqual(
    reduce([1, 2, 3, 2, 1], (p, v) => p + v),
    9
  )
  assert.strictEqual(
    reduce([1, 2], (p, v) => p + v),
    3
  )
  assert.strictEqual(
    reduce([1], (p, v) => p + v),
    1
  )
  assert.strictEqual(
    reduce([], (p, v) => p + v),
    undefined
  )
})

it("reduce(values, reducer, initial) returns the reduced value", () => {
  assert.strictEqual(
    reduce([1, 2, 3, 2, 1], (p, v) => p + v, 0),
    9
  )
  assert.strictEqual(
    reduce([1], (p, v) => p + v, 0),
    1
  )
  assert.strictEqual(
    reduce([], (p, v) => p + v, 0),
    0
  )
  assert.deepStrictEqual(
    reduce([1, 2, 3, 2, 1], (p, v) => p.concat(v), []),
    [1, 2, 3, 2, 1]
  )
})

it("reduce(values, reducer) accepts an iterable", () => {
  assert.strictEqual(
    reduce(new Set([1, 2, 3, 2, 1]), (p, v) => p + v),
    6
  )
  assert.strictEqual(
    reduce(
      (function* () {
        yield* [1, 2, 3, 2, 1]
      })(),
      (p, v) => p + v
    ),
    9
  )
  assert.strictEqual(
    reduce(Uint8Array.of(1, 2, 3, 2, 1), (p, v) => p + v),
    9
  )
})

it("reduce(values, reducer) enforces that test is a function", () => {
  assert.throws(() => reduce([]), TypeError)
})

it("reduce(values, reducer) enforces that values is iterable", () => {
  assert.throws(() => reduce({}, () => true), TypeError)
})

it("reduce(values, reducer) passes reducer (reduced, value, index, values)", () => {
  const calls = []
  const values = new Set([5, 4, 3, 2, 1])
  reduce(values, function (p, v) {
    calls.push([this, ...arguments])
    return p + v
  })
  assert.deepStrictEqual(calls, [
    [undefined, 5, 4, 1, values],
    [undefined, 9, 3, 2, values],
    [undefined, 12, 2, 3, values],
    [undefined, 14, 1, 4, values],
  ])
})

it("reduce(values, reducer, initial) passes reducer (reduced, value, index, values)", () => {
  const calls = []
  const values = new Set([5, 4, 3, 2, 1])
  reduce(
    values,
    function (p, v) {
      calls.push([this, ...arguments])
      return p + v
    },
    0
  )
  assert.deepStrictEqual(calls, [
    [undefined, 0, 5, 0, values],
    [undefined, 5, 4, 1, values],
    [undefined, 9, 3, 2, values],
    [undefined, 12, 2, 3, values],
    [undefined, 14, 1, 4, values],
  ])
})

it("reduce(values, reducer, initial) does not skip sparse elements", () => {
  assert.strictEqual(
    reduce([, 1, 2, ,], (p, v) => p + (v === undefined ? -1 : v), 0),
    1
  )
})
import assert from "assert"
import { reverse } from "../src/index.js"

it("reverse(values) returns a reversed copy", () => {
  const input = [1, 3, 2, 5, 4]
  assert.deepStrictEqual(reverse(input), [4, 5, 2, 3, 1])
  assert.deepStrictEqual(input, [1, 3, 2, 5, 4]) // does not mutate
})

it("reverse(values) returns an array", () => {
  assert.strictEqual(Array.isArray(reverse(Uint8Array.of(1, 2))), true)
})

it("reverse(values) accepts an iterable", () => {
  assert.deepStrictEqual(reverse(new Set([1, 2, 3, 2, 1])), [3, 2, 1])
  assert.deepStrictEqual(
    reverse(
      (function* () {
        yield* [1, 3, 2, 5, 4]
      })()
    ),
    [4, 5, 2, 3, 1]
  )
  assert.deepStrictEqual(reverse(Uint8Array.of(1, 3, 2, 5, 4)), [4, 5, 2, 3, 1])
})

it("reverse(values) enforces that values is iterable", () => {
  assert.throws(() => reverse({}), TypeError)
})

it("reverse(values) does not skip sparse elements", () => {
  assert.deepStrictEqual(reverse([, 1, 2, ,]), [undefined, 2, 1, undefined])
})
import assert from "assert"
import { rollup, sum } from "../src/index.js"

const data = [
  { name: "jim", amount: "3400", date: "11/12/2015" },
  { name: "carl", amount: "12011", date: "11/12/2015" },
  { name: "stacy", amount: "1201", date: "01/04/2016" },
  { name: "stacy", amount: "3405", date: "01/04/2016" },
]

it("rollup(data, reduce, accessor) returns the expected map", () => {
  assert.deepStrictEqual(
    entries(
      rollup(
        data,
        v => v.length,
        d => d.name
      ),
      1
    ),
    [
      ["jim", 1],
      ["carl", 1],
      ["stacy", 2],
    ]
  )
  assert.deepStrictEqual(
    entries(
      rollup(
        data,
        v => sum(v, d => d.amount),
        d => d.name
      ),
      1
    ),
    [
      ["jim", 3400],
      ["carl", 12011],
      ["stacy", 4606],
    ]
  )
})

it("rollup(data, reduce, accessor, accessor) returns the expected map", () => {
  assert.deepStrictEqual(
    entries(
      rollup(
        data,
        v => v.length,
        d => d.name,
        d => d.amount
      ),
      2
    ),
    [
      ["jim", [["3400", 1]]],
      ["carl", [["12011", 1]]],
      [
        "stacy",
        [
          ["1201", 1],
          ["3405", 1],
        ],
      ],
    ]
  )
})

function entries(map, depth) {
  if (depth > 0) {
    return Array.from(map, ([k, v]) => [k, entries(v, depth - 1)])
  } else {
    return map
  }
}
import assert from "assert"
import { rollups, sum } from "../src/index.js"

const data = [
  { name: "jim", amount: "3400", date: "11/12/2015" },
  { name: "carl", amount: "12011", date: "11/12/2015" },
  { name: "stacy", amount: "1201", date: "01/04/2016" },
  { name: "stacy", amount: "3405", date: "01/04/2016" },
]

it("rollups(data, reduce, accessor) returns the expected array", () => {
  assert.deepStrictEqual(
    rollups(
      data,
      v => v.length,
      d => d.name
    ),
    [
      ["jim", 1],
      ["carl", 1],
      ["stacy", 2],
    ]
  )
  assert.deepStrictEqual(
    rollups(
      data,
      v => sum(v, d => d.amount),
      d => d.name
    ),
    [
      ["jim", 3400],
      ["carl", 12011],
      ["stacy", 4606],
    ]
  )
})

it("rollups(data, reduce, accessor, accessor) returns the expected array", () => {
  assert.deepStrictEqual(
    rollups(
      data,
      v => v.length,
      d => d.name,
      d => d.amount
    ),
    [
      ["jim", [["3400", 1]]],
      ["carl", [["12011", 1]]],
      [
        "stacy",
        [
          ["1201", 1],
          ["3405", 1],
        ],
      ],
    ]
  )
})
import assert from "assert"
import { descending, scan } from "../src/index.js"

it("scan(array) compares using natural order", () => {
  assert.strictEqual(scan([0, 1]), 0)
  assert.strictEqual(scan([1, 0]), 1)
  assert.strictEqual(scan([0, "1"]), 0)
  assert.strictEqual(scan(["1", 0]), 1)
  assert.strictEqual(scan(["10", "2"]), 0)
  assert.strictEqual(scan(["2", "10"]), 1)
  assert.strictEqual(scan(["10", "2", NaN]), 0)
  assert.strictEqual(scan([NaN, "10", "2"]), 1)
  assert.strictEqual(scan(["2", NaN, "10"]), 2)
  assert.strictEqual(scan([2, NaN, 10]), 0)
  assert.strictEqual(scan([10, 2, NaN]), 1)
  assert.strictEqual(scan([NaN, 10, 2]), 2)
})

it("scan(array, compare) compares using the specified compare function", () => {
  var a = { name: "a" },
    b = { name: "b" }
  assert.strictEqual(
    scan([a, b], (a, b) => a.name.localeCompare(b.name)),
    0
  )
  assert.strictEqual(scan([1, 0], descending), 0)
  assert.strictEqual(scan(["1", 0], descending), 0)
  assert.strictEqual(scan(["2", "10"], descending), 0)
  assert.strictEqual(scan(["2", NaN, "10"], descending), 0)
  assert.strictEqual(scan([2, NaN, 10], descending), 2)
})

it("scan(array) returns undefined if the array is empty", () => {
  assert.strictEqual(scan([]), undefined)
})

it("scan(array) returns undefined if the array contains only incomparable values", () => {
  assert.strictEqual(scan([NaN, undefined]), undefined)
  assert.strictEqual(
    scan([NaN, "foo"], (a, b) => a - b),
    undefined
  )
})

it("scan(array) returns the first of equal values", () => {
  assert.strictEqual(scan([2, 2, 1, 1, 0, 0, 0, 3, 0]), 4)
  assert.strictEqual(scan([3, 2, 2, 1, 1, 0, 0, 0, 3, 0], descending), 0)
})
import assert from "assert"
import { randomLcg } from "d3-random"
import { pairs, shuffler } from "../src/index.js"

it("shuffle(array) shuffles the array in-place", () => {
  const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
  const shuffle = shuffler(randomLcg(0.9051667019185816))
  assert.strictEqual(shuffle(numbers), numbers)
  assert(pairs(numbers).some(([a, b]) => a > b)) // shuffled
})

it("shuffler(random)(array) shuffles the array in-place", () => {
  const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
  const shuffle = shuffler(randomLcg(0.9051667019185816))
  assert.strictEqual(shuffle(numbers), numbers)
  assert.deepStrictEqual(numbers, [7, 4, 5, 3, 9, 0, 6, 1, 2, 8])
})

it("shuffler(random)(array, start) shuffles the subset array[start:] in-place", () => {
  const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
  const shuffle = shuffler(randomLcg(0.9051667019185816))
  assert.strictEqual(shuffle(numbers, 4), numbers)
  assert.deepStrictEqual(numbers, [0, 1, 2, 3, 8, 7, 6, 4, 5, 9])
})

it("shuffler(random)(array, start, end) shuffles the subset array[start:end] in-place", () => {
  const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
  const shuffle = shuffler(randomLcg(0.9051667019185816))
  assert.strictEqual(shuffle(numbers, 3, 8), numbers)
  assert.deepStrictEqual(numbers, [0, 1, 2, 5, 6, 3, 4, 7, 8, 9])
})
import assert from "assert"
import { some } from "../src/index.js"

it("some(values, test) returns true if any test passes", () => {
  assert.strictEqual(
    some([1, 2, 3, 2, 1], x => x & 1),
    true
  )
  assert.strictEqual(
    some([1, 2, 3, 2, 1], x => x > 3),
    false
  )
})

it("some(values, test) returns false if values is empty", () => {
  assert.strictEqual(
    some([], () => true),
    false
  )
})

it("some(values, test) accepts an iterable", () => {
  assert.strictEqual(
    some(new Set([1, 2, 3, 2, 1]), x => x >= 3),
    true
  )
  assert.strictEqual(
    some(
      (function* () {
        yield* [1, 2, 3, 2, 1]
      })(),
      x => x >= 3
    ),
    true
  )
  assert.strictEqual(
    some(Uint8Array.of(1, 2, 3, 2, 1), x => x >= 3),
    true
  )
})

it("some(values, test) enforces that test is a function", () => {
  assert.throws(() => some([]), TypeError)
})

it("some(values, test) enforces that values is iterable", () => {
  assert.throws(() => some({}, () => true), TypeError)
})

it("some(values, test) passes test (value, index, values)", () => {
  const calls = []
  const values = new Set([5, 4, 3, 2, 1])
  some(values, function () {
    calls.push([this, ...arguments])
  })
  assert.deepStrictEqual(calls, [
    [undefined, 5, 0, values],
    [undefined, 4, 1, values],
    [undefined, 3, 2, values],
    [undefined, 2, 3, values],
    [undefined, 1, 4, values],
  ])
})

it("some(values, test) short-circuts when test returns truthy", () => {
  let calls = 0
  assert.strictEqual(
    some([1, 2, 3], x => (++calls, x >= 2)),
    true
  )
  assert.strictEqual(calls, 2)
  assert.strictEqual(
    some([1, 2, 3], x => (++calls, x - 1)),
    true
  )
  assert.strictEqual(calls, 4)
})

it("some(values, test) does not skip sparse elements", () => {
  assert.deepStrictEqual(
    some([, 1, 2, ,], x => x === undefined),
    true
  )
})
import assert from "assert"
import { ascending, descending, sort } from "../src/index.js"

it("sort(values) returns a sorted copy", () => {
  const input = [1, 3, 2, 5, 4]
  assert.deepStrictEqual(sort(input), [1, 2, 3, 4, 5])
  assert.deepStrictEqual(input, [1, 3, 2, 5, 4]) // does not mutate
})

it("sort(values) defaults to ascending, not lexicographic", () => {
  const input = [1, "10", 2]
  assert.deepStrictEqual(sort(input), [1, 2, "10"])
})

// Per ECMAScript specification §23.1.3.27.1, undefined values are not passed to
// the comparator; they are always put at the end of the sorted array.
// https://262.ecma-international.org/12.0/#sec-sortcompare
it("sort(values) puts non-orderable values last, followed by undefined", () => {
  const date = new Date(NaN)
  const input = [undefined, 1, null, 0, NaN, "10", date, 2]
  assert.deepStrictEqual(sort(input), [0, 1, 2, "10", null, NaN, date, undefined])
})

it("sort(values, comparator) puts non-orderable values last, followed by undefined", () => {
  const date = new Date(NaN)
  const input = [undefined, 1, null, 0, NaN, "10", date, 2]
  assert.deepStrictEqual(sort(input, ascending), [0, 1, 2, "10", null, NaN, date, undefined])
  assert.deepStrictEqual(sort(input, descending), ["10", 2, 1, 0, null, NaN, date, undefined])
})

// However we don't implement this spec when using an accessor
it("sort(values, accessor) puts non-orderable values last", () => {
  const date = new Date(NaN)
  const input = [undefined, 1, null, 0, NaN, "10", date, 2]
  assert.deepStrictEqual(
    sort(input, d => d),
    [0, 1, 2, "10", undefined, null, NaN, date]
  )
  assert.deepStrictEqual(
    sort(input, d => d && -d),
    ["10", 2, 1, 0, undefined, null, NaN, date]
  )
})

it("sort(values, accessor) uses the specified accessor in natural order", () => {
  assert.deepStrictEqual(
    sort([1, 3, 2, 5, 4], d => d),
    [1, 2, 3, 4, 5]
  )
  assert.deepStrictEqual(
    sort([1, 3, 2, 5, 4], d => -d),
    [5, 4, 3, 2, 1]
  )
})

it("sort(values, ...accessors) accepts multiple accessors", () => {
  assert.deepStrictEqual(
    sort(
      [
        [1, 0],
        [2, 1],
        [2, 0],
        [1, 1],
        [3, 0],
      ],
      ([x]) => x,
      ([, y]) => y
    ),
    [
      [1, 0],
      [1, 1],
      [2, 0],
      [2, 1],
      [3, 0],
    ]
  )
  assert.deepStrictEqual(
    sort(
      [
        { x: 1, y: 0 },
        { x: 2, y: 1 },
        { x: 2, y: 0 },
        { x: 1, y: 1 },
        { x: 3, y: 0 },
      ],
      ({ x }) => x,
      ({ y }) => y
    ),
    [
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 0 },
      { x: 2, y: 1 },
      { x: 3, y: 0 },
    ]
  )
})

it("sort(values, comparator) uses the specified comparator", () => {
  assert.deepStrictEqual(sort([1, 3, 2, 5, 4], descending), [5, 4, 3, 2, 1])
})

it("sort(values) returns an array", () => {
  assert.strictEqual(Array.isArray(sort(Uint8Array.of(1, 2))), true)
})

it("sort(values) accepts an iterable", () => {
  assert.deepStrictEqual(sort(new Set([1, 3, 2, 1, 2])), [1, 2, 3])
  assert.deepStrictEqual(
    sort(
      (function* () {
        yield* [1, 3, 2, 5, 4]
      })()
    ),
    [1, 2, 3, 4, 5]
  )
  assert.deepStrictEqual(sort(Uint8Array.of(1, 3, 2, 5, 4)), [1, 2, 3, 4, 5])
})

it("sort(values) enforces that values is iterable", () => {
  assert.throws(() => sort({}), { name: "TypeError", message: /is not iterable/ })
})

it("sort(values, comparator) enforces that comparator is a function", () => {
  assert.throws(() => sort([], {}), { name: "TypeError", message: /is not a function/ })
  assert.throws(() => sort([], null), { name: "TypeError", message: /is not a function/ })
})

it("sort(values) does not skip sparse elements", () => {
  assert.deepStrictEqual(sort([, 1, 2, ,]), [1, 2, undefined, undefined])
})
import assert from "assert"
import { subset } from "../src/index.js"

it("subset(values, other) returns true if values is a subset of others", () => {
  assert.strictEqual(subset([2], [1, 2]), true)
  assert.strictEqual(subset([3, 4], [2, 3]), false)
  assert.strictEqual(subset([], [1]), true)
})

it("subset(values, other) performs interning", () => {
  assert.strictEqual(subset([new Date("2021-01-02")], [new Date("2021-01-01"), new Date("2021-01-02")]), true)
  assert.strictEqual(
    subset([new Date("2021-01-03"), new Date("2021-01-04")], [new Date("2021-01-02"), new Date("2021-01-03")]),
    false
  )
  assert.strictEqual(subset([], [new Date("2021-01-01")]), true)
})
import assert from "assert"
import { sum } from "../src/index.js"

it("sum(array) returns the sum of the specified numbers", () => {
  assert.strictEqual(sum([1]), 1)
  assert.strictEqual(sum([5, 1, 2, 3, 4]), 15)
  assert.strictEqual(sum([20, 3]), 23)
  assert.strictEqual(sum([3, 20]), 23)
})

it("sum(array) observes values that can be coerced to numbers", () => {
  assert.strictEqual(sum(["20", "3"]), 23)
  assert.strictEqual(sum(["3", "20"]), 23)
  assert.strictEqual(sum(["3", 20]), 23)
  assert.strictEqual(sum([20, "3"]), 23)
  assert.strictEqual(sum([3, "20"]), 23)
  assert.strictEqual(sum(["20", 3]), 23)
})

it("sum(array) ignores non-numeric values", () => {
  assert.strictEqual(sum(["a", "b", "c"]), 0)
  assert.strictEqual(sum(["a", 1, "2"]), 3)
})

it("sum(array) ignores null, undefined and NaN", () => {
  assert.strictEqual(sum([NaN, 1, 2, 3, 4, 5]), 15)
  assert.strictEqual(sum([1, 2, 3, 4, 5, NaN]), 15)
  assert.strictEqual(sum([10, null, 3, undefined, 5, NaN]), 18)
})

it("sum(array) returns zero if there are no numbers", () => {
  assert.strictEqual(sum([]), 0)
  assert.strictEqual(sum([NaN]), 0)
  assert.strictEqual(sum([undefined]), 0)
  assert.strictEqual(sum([undefined, NaN]), 0)
  assert.strictEqual(sum([undefined, NaN, {}]), 0)
})

it("sum(array, f) returns the sum of the specified numbers", () => {
  assert.strictEqual(sum([1].map(box), unbox), 1)
  assert.strictEqual(sum([5, 1, 2, 3, 4].map(box), unbox), 15)
  assert.strictEqual(sum([20, 3].map(box), unbox), 23)
  assert.strictEqual(sum([3, 20].map(box), unbox), 23)
})

it("sum(array, f) observes values that can be coerced to numbers", () => {
  assert.strictEqual(sum(["20", "3"].map(box), unbox), 23)
  assert.strictEqual(sum(["3", "20"].map(box), unbox), 23)
  assert.strictEqual(sum(["3", 20].map(box), unbox), 23)
  assert.strictEqual(sum([20, "3"].map(box), unbox), 23)
  assert.strictEqual(sum([3, "20"].map(box), unbox), 23)
  assert.strictEqual(sum(["20", 3].map(box), unbox), 23)
})

it("sum(array, f) ignores non-numeric values", () => {
  assert.strictEqual(sum(["a", "b", "c"].map(box), unbox), 0)
  assert.strictEqual(sum(["a", 1, "2"].map(box), unbox), 3)
})

it("sum(array, f) ignores null, undefined and NaN", () => {
  assert.strictEqual(sum([NaN, 1, 2, 3, 4, 5].map(box), unbox), 15)
  assert.strictEqual(sum([1, 2, 3, 4, 5, NaN].map(box), unbox), 15)
  assert.strictEqual(sum([10, null, 3, undefined, 5, NaN].map(box), unbox), 18)
})

it("sum(array, f) returns zero if there are no numbers", () => {
  assert.strictEqual(sum([].map(box), unbox), 0)
  assert.strictEqual(sum([NaN].map(box), unbox), 0)
  assert.strictEqual(sum([undefined].map(box), unbox), 0)
  assert.strictEqual(sum([undefined, NaN].map(box), unbox), 0)
  assert.strictEqual(sum([undefined, NaN, {}].map(box), unbox), 0)
})

it("sum(array, f) passes the accessor d, i, and array", () => {
  const results = []
  const array = ["a", "b", "c"]
  sum(array, (d, i, array) => results.push([d, i, array]))
  assert.deepStrictEqual(results, [
    ["a", 0, array],
    ["b", 1, array],
    ["c", 2, array],
  ])
})

it("sum(array, f) uses the undefined context", () => {
  const results = []
  sum([1, 2], function () {
    results.push(this)
  })
  assert.deepStrictEqual(results, [undefined, undefined])
})

function box(value) {
  return { value: value }
}

function unbox(box) {
  return box.value
}
import assert from "assert"
import { superset } from "../src/index.js"

it("superset(values, other) returns true if values is a superset of others", () => {
  assert.strictEqual(superset([1, 2], [2]), true)
  assert.strictEqual(superset([2, 3], [3, 4]), false)
  assert.strictEqual(superset([1], []), true)
})

it("superset(values, other) allows values to be infinite", () => {
  assert.strictEqual(superset(odds(), [1, 3, 5]), true)
})

it("superset(values, other) allows other to be infinite", () => {
  assert.strictEqual(superset([1, 3, 5], repeat(1, 3, 2)), false)
})

it("superset(values, other) performs interning", () => {
  assert.strictEqual(superset([new Date("2021-01-01"), new Date("2021-01-02")], [new Date("2021-01-02")]), true)
  assert.strictEqual(
    superset([new Date("2021-01-02"), new Date("2021-01-03")], [new Date("2021-01-03"), new Date("2021-01-04")]),
    false
  )
  assert.strictEqual(superset([new Date("2021-01-01")], []), true)
})

function* odds() {
  for (let i = 1; true; i += 2) {
    yield i
  }
}

function* repeat(...values) {
  while (true) {
    yield* values
  }
}
import assert from "assert"
import { tickIncrement } from "../src/index.js"

it("tickIncrement(start, stop, count) returns NaN if any argument is NaN", () => {
  assert(isNaN(tickIncrement(NaN, 1, 1)))
  assert(isNaN(tickIncrement(0, NaN, 1)))
  assert(isNaN(tickIncrement(0, 1, NaN)))
  assert(isNaN(tickIncrement(NaN, NaN, 1)))
  assert(isNaN(tickIncrement(0, NaN, NaN)))
  assert(isNaN(tickIncrement(NaN, 1, NaN)))
  assert(isNaN(tickIncrement(NaN, NaN, NaN)))
})

it("tickIncrement(start, stop, count) returns NaN or -Infinity if start === stop", () => {
  assert(isNaN(tickIncrement(1, 1, -1)))
  assert(isNaN(tickIncrement(1, 1, 0)))
  assert(isNaN(tickIncrement(1, 1, NaN)))
  assert.strictEqual(tickIncrement(1, 1, 1), -Infinity)
  assert.strictEqual(tickIncrement(1, 1, 10), -Infinity)
})

it("tickIncrement(start, stop, count) returns 0 or Infinity if count is not positive", () => {
  assert.strictEqual(tickIncrement(0, 1, -1), Infinity)
  assert.strictEqual(tickIncrement(0, 1, 0), Infinity)
})

it("tickIncrement(start, stop, count) returns -Infinity if count is infinity", () => {
  assert.strictEqual(tickIncrement(0, 1, Infinity), -Infinity)
})

it("tickIncrement(start, stop, count) returns approximately count + 1 tickIncrement when start < stop", () => {
  assert.strictEqual(tickIncrement(0, 1, 10), -10)
  assert.strictEqual(tickIncrement(0, 1, 9), -10)
  assert.strictEqual(tickIncrement(0, 1, 8), -10)
  assert.strictEqual(tickIncrement(0, 1, 7), -5)
  assert.strictEqual(tickIncrement(0, 1, 6), -5)
  assert.strictEqual(tickIncrement(0, 1, 5), -5)
  assert.strictEqual(tickIncrement(0, 1, 4), -5)
  assert.strictEqual(tickIncrement(0, 1, 3), -2)
  assert.strictEqual(tickIncrement(0, 1, 2), -2)
  assert.strictEqual(tickIncrement(0, 1, 1), 1)
  assert.strictEqual(tickIncrement(0, 10, 10), 1)
  assert.strictEqual(tickIncrement(0, 10, 9), 1)
  assert.strictEqual(tickIncrement(0, 10, 8), 1)
  assert.strictEqual(tickIncrement(0, 10, 7), 2)
  assert.strictEqual(tickIncrement(0, 10, 6), 2)
  assert.strictEqual(tickIncrement(0, 10, 5), 2)
  assert.strictEqual(tickIncrement(0, 10, 4), 2)
  assert.strictEqual(tickIncrement(0, 10, 3), 5)
  assert.strictEqual(tickIncrement(0, 10, 2), 5)
  assert.strictEqual(tickIncrement(0, 10, 1), 10)
  assert.strictEqual(tickIncrement(-10, 10, 10), 2)
  assert.strictEqual(tickIncrement(-10, 10, 9), 2)
  assert.strictEqual(tickIncrement(-10, 10, 8), 2)
  assert.strictEqual(tickIncrement(-10, 10, 7), 2)
  assert.strictEqual(tickIncrement(-10, 10, 6), 5)
  assert.strictEqual(tickIncrement(-10, 10, 5), 5)
  assert.strictEqual(tickIncrement(-10, 10, 4), 5)
  assert.strictEqual(tickIncrement(-10, 10, 3), 5)
  assert.strictEqual(tickIncrement(-10, 10, 2), 10)
  assert.strictEqual(tickIncrement(-10, 10, 1), 20)
})
import assert from "assert"
import { tickStep } from "../src/index.js"

it("tickStep(start, stop, count) returns NaN if any argument is NaN", () => {
  assert(isNaN(tickStep(NaN, 1, 1)))
  assert(isNaN(tickStep(0, NaN, 1)))
  assert(isNaN(tickStep(0, 1, NaN)))
  assert(isNaN(tickStep(NaN, NaN, 1)))
  assert(isNaN(tickStep(0, NaN, NaN)))
  assert(isNaN(tickStep(NaN, 1, NaN)))
  assert(isNaN(tickStep(NaN, NaN, NaN)))
})

it("tickStep(start, stop, count) returns NaN or 0 if start === stop", () => {
  assert(isNaN(tickStep(1, 1, -1)))
  assert(isNaN(tickStep(1, 1, 0)))
  assert(isNaN(tickStep(1, 1, NaN)))
  assert.strictEqual(tickStep(1, 1, 1), 0)
  assert.strictEqual(tickStep(1, 1, 10), 0)
})

it("tickStep(start, stop, count) returns 0 or Infinity if count is not positive", () => {
  assert.strictEqual(tickStep(0, 1, -1), Infinity)
  assert.strictEqual(tickStep(0, 1, 0), Infinity)
})

it("tickStep(start, stop, count) returns 0 if count is infinity", () => {
  assert.strictEqual(tickStep(0, 1, Infinity), 0)
})

it("tickStep(start, stop, count) returns approximately count + 1 tickStep when start < stop", () => {
  assert.strictEqual(tickStep(0, 1, 10), 0.1)
  assert.strictEqual(tickStep(0, 1, 9), 0.1)
  assert.strictEqual(tickStep(0, 1, 8), 0.1)
  assert.strictEqual(tickStep(0, 1, 7), 0.2)
  assert.strictEqual(tickStep(0, 1, 6), 0.2)
  assert.strictEqual(tickStep(0, 1, 5), 0.2)
  assert.strictEqual(tickStep(0, 1, 4), 0.2)
  assert.strictEqual(tickStep(0, 1, 3), 0.5)
  assert.strictEqual(tickStep(0, 1, 2), 0.5)
  assert.strictEqual(tickStep(0, 1, 1), 1.0)
  assert.strictEqual(tickStep(0, 10, 10), 1)
  assert.strictEqual(tickStep(0, 10, 9), 1)
  assert.strictEqual(tickStep(0, 10, 8), 1)
  assert.strictEqual(tickStep(0, 10, 7), 2)
  assert.strictEqual(tickStep(0, 10, 6), 2)
  assert.strictEqual(tickStep(0, 10, 5), 2)
  assert.strictEqual(tickStep(0, 10, 4), 2)
  assert.strictEqual(tickStep(0, 10, 3), 5)
  assert.strictEqual(tickStep(0, 10, 2), 5)
  assert.strictEqual(tickStep(0, 10, 1), 10)
  assert.strictEqual(tickStep(-10, 10, 10), 2)
  assert.strictEqual(tickStep(-10, 10, 9), 2)
  assert.strictEqual(tickStep(-10, 10, 8), 2)
  assert.strictEqual(tickStep(-10, 10, 7), 2)
  assert.strictEqual(tickStep(-10, 10, 6), 5)
  assert.strictEqual(tickStep(-10, 10, 5), 5)
  assert.strictEqual(tickStep(-10, 10, 4), 5)
  assert.strictEqual(tickStep(-10, 10, 3), 5)
  assert.strictEqual(tickStep(-10, 10, 2), 10)
  assert.strictEqual(tickStep(-10, 10, 1), 20)
})

it("tickStep(start, stop, count) returns -tickStep(stop, start, count)", () => {
  assert.strictEqual(tickStep(0, 1, 10), -tickStep(1, 0, 10))
  assert.strictEqual(tickStep(0, 1, 9), -tickStep(1, 0, 9))
  assert.strictEqual(tickStep(0, 1, 8), -tickStep(1, 0, 8))
  assert.strictEqual(tickStep(0, 1, 7), -tickStep(1, 0, 7))
  assert.strictEqual(tickStep(0, 1, 6), -tickStep(1, 0, 6))
  assert.strictEqual(tickStep(0, 1, 5), -tickStep(1, 0, 5))
  assert.strictEqual(tickStep(0, 1, 4), -tickStep(1, 0, 4))
  assert.strictEqual(tickStep(0, 1, 3), -tickStep(1, 0, 3))
  assert.strictEqual(tickStep(0, 1, 2), -tickStep(1, 0, 2))
  assert.strictEqual(tickStep(0, 1, 1), -tickStep(1, 0, 1))
  assert.strictEqual(tickStep(0, 10, 10), -tickStep(10, 0, 10))
  assert.strictEqual(tickStep(0, 10, 9), -tickStep(10, 0, 9))
  assert.strictEqual(tickStep(0, 10, 8), -tickStep(10, 0, 8))
  assert.strictEqual(tickStep(0, 10, 7), -tickStep(10, 0, 7))
  assert.strictEqual(tickStep(0, 10, 6), -tickStep(10, 0, 6))
  assert.strictEqual(tickStep(0, 10, 5), -tickStep(10, 0, 5))
  assert.strictEqual(tickStep(0, 10, 4), -tickStep(10, 0, 4))
  assert.strictEqual(tickStep(0, 10, 3), -tickStep(10, 0, 3))
  assert.strictEqual(tickStep(0, 10, 2), -tickStep(10, 0, 2))
  assert.strictEqual(tickStep(0, 10, 1), -tickStep(10, 0, 1))
  assert.strictEqual(tickStep(-10, 10, 10), -tickStep(10, -10, 10))
  assert.strictEqual(tickStep(-10, 10, 9), -tickStep(10, -10, 9))
  assert.strictEqual(tickStep(-10, 10, 8), -tickStep(10, -10, 8))
  assert.strictEqual(tickStep(-10, 10, 7), -tickStep(10, -10, 7))
  assert.strictEqual(tickStep(-10, 10, 6), -tickStep(10, -10, 6))
  assert.strictEqual(tickStep(-10, 10, 5), -tickStep(10, -10, 5))
  assert.strictEqual(tickStep(-10, 10, 4), -tickStep(10, -10, 4))
  assert.strictEqual(tickStep(-10, 10, 3), -tickStep(10, -10, 3))
  assert.strictEqual(tickStep(-10, 10, 2), -tickStep(10, -10, 2))
  assert.strictEqual(tickStep(-10, 10, 1), -tickStep(10, -10, 1))
})
import assert from "assert"
import { ticks } from "../src/index.js"

it("ticks(start, stop, count) returns the empty array if any argument is NaN", () => {
  assert.deepStrictEqual(ticks(NaN, 1, 1), [])
  assert.deepStrictEqual(ticks(0, NaN, 1), [])
  assert.deepStrictEqual(ticks(0, 1, NaN), [])
  assert.deepStrictEqual(ticks(NaN, NaN, 1), [])
  assert.deepStrictEqual(ticks(0, NaN, NaN), [])
  assert.deepStrictEqual(ticks(NaN, 1, NaN), [])
  assert.deepStrictEqual(ticks(NaN, NaN, NaN), [])
})

it("ticks(start, stop, count) returns the empty array if start === stop and count is non-positive", () => {
  assert.deepStrictEqual(ticks(1, 1, -1), [])
  assert.deepStrictEqual(ticks(1, 1, 0), [])
  assert.deepStrictEqual(ticks(1, 1, NaN), [])
})

it("ticks(start, stop, count) returns the empty array if start === stop and count is positive", () => {
  assert.deepStrictEqual(ticks(1, 1, 1), [1])
  assert.deepStrictEqual(ticks(1, 1, 10), [1])
})

it("ticks(start, stop, count) returns the empty array if count is not positive", () => {
  assert.deepStrictEqual(ticks(0, 1, 0), [])
  assert.deepStrictEqual(ticks(0, 1, -1), [])
  assert.deepStrictEqual(ticks(0, 1, NaN), [])
})

it("ticks(start, stop, count) returns the empty array if count is infinity", () => {
  assert.deepStrictEqual(ticks(0, 1, Infinity), [])
})

it("ticks(start, stop, count) does not include negative zero", () => {
  assert.strictEqual(1 / ticks(-1, 0, 5).pop(), Infinity)
})

it("ticks(start, stop, count) remains within the domain", () => {
  assert.deepStrictEqual(ticks(0, 2.2, 3), [0, 1, 2])
})

it("ticks(start, stop, count) returns approximately count + 1 ticks when start < stop", () => {
  assert.deepStrictEqual(ticks(0, 1, 10), [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0])
  assert.deepStrictEqual(ticks(0, 1, 9), [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0])
  assert.deepStrictEqual(ticks(0, 1, 8), [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0])
  assert.deepStrictEqual(ticks(0, 1, 7), [0.0, 0.2, 0.4, 0.6, 0.8, 1.0])
  assert.deepStrictEqual(ticks(0, 1, 6), [0.0, 0.2, 0.4, 0.6, 0.8, 1.0])
  assert.deepStrictEqual(ticks(0, 1, 5), [0.0, 0.2, 0.4, 0.6, 0.8, 1.0])
  assert.deepStrictEqual(ticks(0, 1, 4), [0.0, 0.2, 0.4, 0.6, 0.8, 1.0])
  assert.deepStrictEqual(ticks(0, 1, 3), [0.0, 0.5, 1.0])
  assert.deepStrictEqual(ticks(0, 1, 2), [0.0, 0.5, 1.0])
  assert.deepStrictEqual(ticks(0, 1, 1), [0.0, 1.0])
  assert.deepStrictEqual(ticks(0, 10, 10), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  assert.deepStrictEqual(ticks(0, 10, 9), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  assert.deepStrictEqual(ticks(0, 10, 8), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  assert.deepStrictEqual(ticks(0, 10, 7), [0, 2, 4, 6, 8, 10])
  assert.deepStrictEqual(ticks(0, 10, 6), [0, 2, 4, 6, 8, 10])
  assert.deepStrictEqual(ticks(0, 10, 5), [0, 2, 4, 6, 8, 10])
  assert.deepStrictEqual(ticks(0, 10, 4), [0, 2, 4, 6, 8, 10])
  assert.deepStrictEqual(ticks(0, 10, 3), [0, 5, 10])
  assert.deepStrictEqual(ticks(0, 10, 2), [0, 5, 10])
  assert.deepStrictEqual(ticks(0, 10, 1), [0, 10])
  assert.deepStrictEqual(ticks(-10, 10, 10), [-10, -8, -6, -4, -2, 0, 2, 4, 6, 8, 10])
  assert.deepStrictEqual(ticks(-10, 10, 9), [-10, -8, -6, -4, -2, 0, 2, 4, 6, 8, 10])
  assert.deepStrictEqual(ticks(-10, 10, 8), [-10, -8, -6, -4, -2, 0, 2, 4, 6, 8, 10])
  assert.deepStrictEqual(ticks(-10, 10, 7), [-10, -8, -6, -4, -2, 0, 2, 4, 6, 8, 10])
  assert.deepStrictEqual(ticks(-10, 10, 6), [-10, -5, 0, 5, 10])
  assert.deepStrictEqual(ticks(-10, 10, 5), [-10, -5, 0, 5, 10])
  assert.deepStrictEqual(ticks(-10, 10, 4), [-10, -5, 0, 5, 10])
  assert.deepStrictEqual(ticks(-10, 10, 3), [-10, -5, 0, 5, 10])
  assert.deepStrictEqual(ticks(-10, 10, 2), [-10, 0, 10])
  assert.deepStrictEqual(ticks(-10, 10, 1), [0])
})

it("ticks(start, stop, count) returns the reverse of ticks(stop, start, count)", () => {
  assert.deepStrictEqual(ticks(1, 0, 10), ticks(0, 1, 10).reverse())
  assert.deepStrictEqual(ticks(1, 0, 9), ticks(0, 1, 9).reverse())
  assert.deepStrictEqual(ticks(1, 0, 8), ticks(0, 1, 8).reverse())
  assert.deepStrictEqual(ticks(1, 0, 7), ticks(0, 1, 7).reverse())
  assert.deepStrictEqual(ticks(1, 0, 6), ticks(0, 1, 6).reverse())
  assert.deepStrictEqual(ticks(1, 0, 5), ticks(0, 1, 5).reverse())
  assert.deepStrictEqual(ticks(1, 0, 4), ticks(0, 1, 4).reverse())
  assert.deepStrictEqual(ticks(1, 0, 3), ticks(0, 1, 3).reverse())
  assert.deepStrictEqual(ticks(1, 0, 2), ticks(0, 1, 2).reverse())
  assert.deepStrictEqual(ticks(1, 0, 1), ticks(0, 1, 1).reverse())
  assert.deepStrictEqual(ticks(10, 0, 10), ticks(0, 10, 10).reverse())
  assert.deepStrictEqual(ticks(10, 0, 9), ticks(0, 10, 9).reverse())
  assert.deepStrictEqual(ticks(10, 0, 8), ticks(0, 10, 8).reverse())
  assert.deepStrictEqual(ticks(10, 0, 7), ticks(0, 10, 7).reverse())
  assert.deepStrictEqual(ticks(10, 0, 6), ticks(0, 10, 6).reverse())
  assert.deepStrictEqual(ticks(10, 0, 5), ticks(0, 10, 5).reverse())
  assert.deepStrictEqual(ticks(10, 0, 4), ticks(0, 10, 4).reverse())
  assert.deepStrictEqual(ticks(10, 0, 3), ticks(0, 10, 3).reverse())
  assert.deepStrictEqual(ticks(10, 0, 2), ticks(0, 10, 2).reverse())
  assert.deepStrictEqual(ticks(10, 0, 1), ticks(0, 10, 1).reverse())
  assert.deepStrictEqual(ticks(10, -10, 10), ticks(-10, 10, 10).reverse())
  assert.deepStrictEqual(ticks(10, -10, 9), ticks(-10, 10, 9).reverse())
  assert.deepStrictEqual(ticks(10, -10, 8), ticks(-10, 10, 8).reverse())
  assert.deepStrictEqual(ticks(10, -10, 7), ticks(-10, 10, 7).reverse())
  assert.deepStrictEqual(ticks(10, -10, 6), ticks(-10, 10, 6).reverse())
  assert.deepStrictEqual(ticks(10, -10, 5), ticks(-10, 10, 5).reverse())
  assert.deepStrictEqual(ticks(10, -10, 4), ticks(-10, 10, 4).reverse())
  assert.deepStrictEqual(ticks(10, -10, 3), ticks(-10, 10, 3).reverse())
  assert.deepStrictEqual(ticks(10, -10, 2), ticks(-10, 10, 2).reverse())
  assert.deepStrictEqual(ticks(10, -10, 1), ticks(-10, 10, 1).reverse())
})

it("ticks(start, stop, count) handles precision problems", () => {
  assert.deepStrictEqual(ticks(0.98, 1.14, 10), [0.98, 1, 1.02, 1.04, 1.06, 1.08, 1.1, 1.12, 1.14])
})
import assert from "assert"
import { transpose } from "../src/index.js"

it("transpose([]) and transpose([[]]) return an empty array", () => {
  assert.deepStrictEqual(transpose([]), [])
  assert.deepStrictEqual(transpose([[]]), [])
})

it("transpose([[a, b, …]]) returns [[a], [b], …]", () => {
  assert.deepStrictEqual(transpose([[1, 2, 3, 4, 5]]), [[1], [2], [3], [4], [5]])
})

it("transpose([[a1, b1, …], [a2, b2, …]]) returns [[a1, a2], [b1, b2], …]", () => {
  assert.deepStrictEqual(
    transpose([
      [1, 2],
      [3, 4],
    ]),
    [
      [1, 3],
      [2, 4],
    ]
  )
  assert.deepStrictEqual(
    transpose([
      [1, 2, 3, 4, 5],
      [2, 4, 6, 8, 10],
    ]),
    [
      [1, 2],
      [2, 4],
      [3, 6],
      [4, 8],
      [5, 10],
    ]
  )
})

it("transpose([[a1, b1, …], [a2, b2, …], [a3, b3, …]]) returns [[a1, a2, a3], [b1, b2, b3], …]", () => {
  assert.deepStrictEqual(
    transpose([
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ]),
    [
      [1, 4, 7],
      [2, 5, 8],
      [3, 6, 9],
    ]
  )
})

it("transpose(…) ignores extra elements given an irregular matrix", () => {
  assert.deepStrictEqual(
    transpose([
      [1, 2],
      [3, 4],
      [5, 6, 7],
    ]),
    [
      [1, 3, 5],
      [2, 4, 6],
    ]
  )
})

it("transpose(…) returns a copy", () => {
  const matrix = [
    [1, 2],
    [3, 4],
  ]
  const t = transpose(matrix)
  matrix[0][0] = matrix[0][1] = matrix[1][0] = matrix[1][1] = 0
  assert.deepStrictEqual(t, [
    [1, 3],
    [2, 4],
  ])
})
import { union } from "../src/index.js"
import { assertSetEqual } from "./asserts.js"

it("union(values) returns a set of values", () => {
  assertSetEqual(union([1, 2, 3, 2, 1]), [1, 2, 3])
})

it("union(values, other) returns a set of values", () => {
  assertSetEqual(union([1, 2], [2, 3, 1]), [1, 2, 3])
})

it("union(...values) returns a set of values", () => {
  assertSetEqual(union([1], [2], [2, 3], [1]), [1, 2, 3])
})

it("union(...values) accepts iterables", () => {
  assertSetEqual(union(new Set([1, 2, 3])), [1, 2, 3])
  assertSetEqual(union(Uint8Array.of(1, 2, 3)), [1, 2, 3])
})

it("union(...values) performs interning", () => {
  assertSetEqual(union([new Date("2021-01-01"), new Date("2021-01-01"), new Date("2021-01-02")]), [
    new Date("2021-01-01"),
    new Date("2021-01-02"),
  ])
  assertSetEqual(
    union([new Date("2021-01-01"), new Date("2021-01-03")], [new Date("2021-01-01"), new Date("2021-01-02")]),
    [new Date("2021-01-01"), new Date("2021-01-02"), new Date("2021-01-03")]
  )
})
import assert from "assert"
import { variance } from "../src/index.js"

it("variance(array) returns the variance of the specified numbers", () => {
  assert.strictEqual(variance([5, 1, 2, 3, 4]), 2.5)
  assert.strictEqual(variance([20, 3]), 144.5)
  assert.strictEqual(variance([3, 20]), 144.5)
})

it("variance(array) ignores null, undefined and NaN", () => {
  assert.strictEqual(variance([NaN, 1, 2, 3, 4, 5]), 2.5)
  assert.strictEqual(variance([1, 2, 3, 4, 5, NaN]), 2.5)
  assert.strictEqual(variance([10, null, 3, undefined, 5, NaN]), 13)
})

it("variance(array) can handle large numbers without overflowing", () => {
  assert.strictEqual(variance([Number.MAX_VALUE, Number.MAX_VALUE]), 0)
  assert.strictEqual(variance([-Number.MAX_VALUE, -Number.MAX_VALUE]), 0)
})

it("variance(array) returns undefined if the array has fewer than two numbers", () => {
  assert.strictEqual(variance([1]), undefined)
  assert.strictEqual(variance([]), undefined)
  assert.strictEqual(variance([null]), undefined)
  assert.strictEqual(variance([undefined]), undefined)
  assert.strictEqual(variance([NaN]), undefined)
  assert.strictEqual(variance([NaN, NaN]), undefined)
})

it("variance(array, f) returns the variance of the specified numbers", () => {
  assert.strictEqual(variance([5, 1, 2, 3, 4].map(box), unbox), 2.5)
  assert.strictEqual(variance([20, 3].map(box), unbox), 144.5)
  assert.strictEqual(variance([3, 20].map(box), unbox), 144.5)
})

it("variance(array, f) ignores null, undefined and NaN", () => {
  assert.strictEqual(variance([NaN, 1, 2, 3, 4, 5].map(box), unbox), 2.5)
  assert.strictEqual(variance([1, 2, 3, 4, 5, NaN].map(box), unbox), 2.5)
  assert.strictEqual(variance([10, null, 3, undefined, 5, NaN].map(box), unbox), 13)
})

it("variance(array, f) can handle large numbers without overflowing", () => {
  assert.strictEqual(variance([Number.MAX_VALUE, Number.MAX_VALUE].map(box), unbox), 0)
  assert.strictEqual(variance([-Number.MAX_VALUE, -Number.MAX_VALUE].map(box), unbox), 0)
})

it("variance(array, f) returns undefined if the array has fewer than two numbers", () => {
  assert.strictEqual(variance([1].map(box), unbox), undefined)
  assert.strictEqual(variance([].map(box), unbox), undefined)
  assert.strictEqual(variance([null].map(box), unbox), undefined)
  assert.strictEqual(variance([undefined].map(box), unbox), undefined)
  assert.strictEqual(variance([NaN].map(box), unbox), undefined)
  assert.strictEqual(variance([NaN, NaN].map(box), unbox), undefined)
})

it("variance(array, f) passes the accessor d, i, and array", () => {
  const results = []
  const array = ["a", "b", "c"]
  variance(array, (d, i, array) => results.push([d, i, array]))
  assert.deepStrictEqual(results, [
    ["a", 0, array],
    ["b", 1, array],
    ["c", 2, array],
  ])
})

it("variance(array, f) uses the undefined context", () => {
  const results = []
  variance([1, 2], function () {
    results.push(this)
  })
  assert.deepStrictEqual(results, [undefined, undefined])
})

function box(value) {
  return { value: value }
}

function unbox(box) {
  return box.value
}
import assert from "assert"
import { zip } from "../src/index.js"

it("zip() and zip([]) return an empty array", () => {
  assert.deepStrictEqual(zip(), [])
  assert.deepStrictEqual(zip([]), [])
})

it("zip([a, b, …]) returns [[a], [b], …]", () => {
  assert.deepStrictEqual(zip([1, 2, 3, 4, 5]), [[1], [2], [3], [4], [5]])
})

it("zip([a1, b1, …], [a2, b2, …]) returns [[a1, a2], [b1, b2], …]", () => {
  assert.deepStrictEqual(zip([1, 2], [3, 4]), [
    [1, 3],
    [2, 4],
  ])
  assert.deepStrictEqual(zip([1, 2, 3, 4, 5], [2, 4, 6, 8, 10]), [
    [1, 2],
    [2, 4],
    [3, 6],
    [4, 8],
    [5, 10],
  ])
})

it("zip([a1, b1, …], [a2, b2, …], [a3, b3, …]) returns [[a1, a2, a3], [b1, b2, b3], …]", () => {
  assert.deepStrictEqual(zip([1, 2, 3], [4, 5, 6], [7, 8, 9]), [
    [1, 4, 7],
    [2, 5, 8],
    [3, 6, 9],
  ])
})

it("zip(…) ignores extra elements given an irregular matrix", () => {
  assert.deepStrictEqual(zip([1, 2], [3, 4], [5, 6, 7]), [
    [1, 3, 5],
    [2, 4, 6],
  ])
})
