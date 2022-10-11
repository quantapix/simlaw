import assert from "assert"
import { stackOrderAppearance } from "../../src/index.js"

it("stackOrderAppearance(series) returns an order by appearance", () => {
  assert.deepStrictEqual(
    stackOrderAppearance([
      [
        [0, 0],
        [0, 0],
        [0, 1],
      ],
      [
        [0, 3],
        [0, 2],
        [0, 0],
      ],
      [
        [0, 0],
        [0, 4],
        [0, 0],
      ],
    ]),
    [1, 2, 0]
  )
})

it("stackOrderAppearance(series) treats NaN values as zero", () => {
  assert.deepStrictEqual(
    stackOrderAppearance([
      [
        [0, NaN],
        [0, NaN],
        [0, 1],
      ],
      [
        [0, 3],
        [0, 2],
        [0, NaN],
      ],
      [
        [0, NaN],
        [0, 4],
        [0, NaN],
      ],
    ]),
    [1, 2, 0]
  )
})
import assert from "assert"
import { stackOrderAscending } from "../../src/index.js"

it("stackOrderAscending(series) returns an order by sum", () => {
  assert.deepStrictEqual(
    stackOrderAscending([
      [
        [0, 1],
        [0, 2],
        [0, 3],
      ],
      [
        [0, 2],
        [0, 3],
        [0, 4],
      ],
      [
        [0, 0],
        [0, 1],
        [0, 2],
      ],
    ]),
    [2, 0, 1]
  )
})

it("stackOrderAscending(series) treats NaN values as zero", () => {
  assert.deepStrictEqual(
    stackOrderAscending([
      [
        [0, 1],
        [0, 2],
        [0, NaN],
        [0, 3],
      ],
      [
        [0, 2],
        [0, 3],
        [0, NaN],
        [0, 4],
      ],
      [
        [0, 0],
        [0, 1],
        [0, NaN],
        [0, 2],
      ],
    ]),
    [2, 0, 1]
  )
})
import assert from "assert"
import { stackOrderDescending } from "../../src/index.js"

it("stackOrderDescending(series) returns an order by sum", () => {
  assert.deepStrictEqual(
    stackOrderDescending([
      [
        [0, 1],
        [0, 2],
        [0, 3],
      ],
      [
        [0, 2],
        [0, 3],
        [0, 4],
      ],
      [
        [0, 0],
        [0, 1],
        [0, 2],
      ],
    ]),
    [1, 0, 2]
  )
})

it("stackOrderDescending(series) treats NaN values as zero", () => {
  assert.deepStrictEqual(
    stackOrderDescending([
      [
        [0, 1],
        [0, 2],
        [0, 3],
        [0, NaN],
      ],
      [
        [0, 2],
        [0, 3],
        [0, 4],
        [0, NaN],
      ],
      [
        [0, 0],
        [0, 1],
        [0, 2],
        [0, NaN],
      ],
    ]),
    [1, 0, 2]
  )
})
import assert from "assert"
import { stackOrderInsideOut } from "../../src/index.js"

it("stackOrderInsideOut(series) returns an order by appearance", () => {
  assert.deepStrictEqual(
    stackOrderInsideOut([
      [
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 1],
      ],
      [
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 2],
        [0, 0],
      ],
      [
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 3],
        [0, 0],
        [0, 0],
      ],
      [
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 4],
        [0, 0],
        [0, 0],
        [0, 0],
      ],
      [
        [0, 0],
        [0, 0],
        [0, 5],
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 0],
      ],
      [
        [0, 0],
        [0, 6],
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 0],
      ],
      [
        [0, 7],
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 0],
      ],
    ]),
    [2, 3, 6, 5, 4, 1, 0]
  )
})

it("stackOrderInsideOut(series) treats NaN values as zero", () => {
  assert.deepStrictEqual(
    stackOrderInsideOut([
      [
        [0, 0],
        [0, NaN],
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 1],
      ],
      [
        [0, 0],
        [0, 0],
        [0, NaN],
        [0, 0],
        [0, 0],
        [0, 2],
        [0, 0],
      ],
      [
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 3],
        [0, 0],
        [0, 0],
      ],
      [
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 4],
        [0, NaN],
        [0, 0],
        [0, 0],
      ],
      [
        [0, 0],
        [0, 0],
        [0, 5],
        [0, 0],
        [0, 0],
        [0, NaN],
        [0, 0],
      ],
      [
        [0, NaN],
        [0, 6],
        [0, 0],
        [0, NaN],
        [0, 0],
        [0, 0],
        [0, 0],
      ],
      [
        [0, 7],
        [0, NaN],
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 0],
      ],
    ]),
    [2, 3, 6, 5, 4, 1, 0]
  )
})
import assert from "assert"
import { stackOrderNone } from "../../src/index.js"

it("stackOrderNone(series) returns [0, 1, … series.length - 1]", () => {
  assert.deepStrictEqual(stackOrderNone(new Array(4)), [0, 1, 2, 3])
})
import assert from "assert"
import { stackOrderReverse } from "../../src/index.js"

it("stackOrderReverse(series) returns [series.length - 1, series.length - 2, … 0]", () => {
  assert.deepStrictEqual(stackOrderReverse(new Array(4)), [3, 2, 1, 0])
})
