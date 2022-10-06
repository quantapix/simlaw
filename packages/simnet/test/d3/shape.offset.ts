import assert from "assert";
import {stackOffsetDiverging, stackOrderNone, stackOrderReverse} from "../../src/index.js";

it("stackOffsetDiverging(series, order) applies a zero baseline, ignoring existing offsets", () => {
  const series = [
    [[1, 2], [2, 4], [3, 4]],
    [[0, 3], [0, 4], [0, 2]],
    [[0, 5], [0, 2], [0, 4]]
  ];
  stackOffsetDiverging(series, stackOrderNone(series));
  assert.deepStrictEqual(series, [
    [[0, 1], [0, 2], [0, 1]],
    [[1, 4], [2, 6], [1, 3]],
    [[4, 9], [6, 8], [3, 7]]
  ]);
});

it("stackOffsetDiverging(series, order) handles a single series", () => {
  const series = [
    [[1, 2], [2, 4], [3, 4]]
  ];
  stackOffsetDiverging(series, stackOrderNone(series));
  assert.deepStrictEqual(series, [
    [[0, 1], [0, 2], [0, 1]]
  ]);
});

it("stackOffsetDiverging(series, order) treats NaN as zero", () => {
  const series = [
    [[0, 1], [0,   2], [0, 1]],
    [[0, 3], [0, NaN], [0, 2]],
    [[0, 5], [0,   2], [0, 4]]
  ];
  stackOffsetDiverging(series, stackOrderNone(series));
  assert(isNaN(series[1][1][1]));
  series[1][1][1] = "NaN"; // can’t assert.strictEqual NaN
  assert.deepStrictEqual(series, [
    [[0, 1], [0,     2], [0, 1]],
    [[1, 4], [0, "NaN"], [1, 3]],
    [[4, 9], [2,     4], [3, 7]]
  ]);
});

it("stackOffsetDiverging(series, order) observes the specified order", () => {
  const series = [
    [[0, 1], [0, 2], [0, 1]],
    [[0, 3], [0, 4], [0, 2]],
    [[0, 5], [0, 2], [0, 4]]
  ];
  stackOffsetDiverging(series, stackOrderReverse(series));
  assert.deepStrictEqual(series, [
    [[8, 9], [6, 8], [6, 7]],
    [[5, 8], [2, 6], [4, 6]],
    [[0, 5], [0, 2], [0, 4]]
  ]);
});

it("stackOffsetDiverging(series, order) puts negative values below zero, in order", () => {
  const series = [
    [[0,  1], [0, -2], [0, -1]],
    [[0, -3], [0, -4], [0, -2]],
    [[0, -5], [0, -2], [0,  4]]
  ];
  stackOffsetDiverging(series, stackOrderNone(series));
  assert.deepStrictEqual(series, [
    [[ 0,  1], [-2,  0], [-1,  0]],
    [[-3,  0], [-6, -2], [-3, -1]],
    [[-8, -3], [-8, -6], [ 0,  4]]
  ]);
});

it("stackOffsetDiverging(series, order) puts zero values at zero, in order", () => {
  const series = [
    [[0, 1], [0, 2], [0, -1]],
    [[0, 3], [0, 0], [0, 0]],
    [[0, 5], [0, 2], [0, 4]]
  ];
  stackOffsetDiverging(series, stackOrderNone(series));
  assert.deepStrictEqual(series, [
    [[0, 1], [0, 2], [-1, 0]],
    [[1, 4], [0, 0], [0, 0]],
    [[4, 9], [2, 4], [0, 4]]
  ]);
});
import assert from "assert";
import {stackOffsetExpand, stackOrderNone, stackOrderReverse} from "../../src/index.js";

it("stackOffsetExpand(series, order) expands to fill [0, 1]", () => {
  const series = [
    [[0, 1], [0, 2], [0, 1]],
    [[0, 3], [0, 4], [0, 2]],
    [[0, 5], [0, 2], [0, 4]]
  ];
  stackOffsetExpand(series, stackOrderNone(series));
  assert.deepStrictEqual(series, [
    [[0 / 9, 1 / 9], [0 / 8, 2 / 8], [0 / 7, 1 / 7]],
    [[1 / 9, 4 / 9], [2 / 8, 6 / 8], [1 / 7, 3 / 7]],
    [[4 / 9, 9 / 9], [6 / 8, 8 / 8], [3 / 7, 7 / 7]]
  ]);
});

it("stackOffsetExpand(series, order) treats NaN as zero", () => {
  const series = [
    [[0, 1], [0,   2], [0, 1]],
    [[0, 3], [0, NaN], [0, 2]],
    [[0, 5], [0,   2], [0, 4]]
  ];
  stackOffsetExpand(series, stackOrderNone(series));
  assert(isNaN(series[1][1][1]));
  series[1][1][1] = "NaN"; // can’t assert.strictEqual NaN
  assert.deepStrictEqual(series, [
    [[0 / 9, 1 / 9], [0 / 4, 2 / 4], [0 / 7, 1 / 7]],
    [[1 / 9, 4 / 9], [2 / 4, "NaN"], [1 / 7, 3 / 7]],
    [[4 / 9, 9 / 9], [2 / 4, 4 / 4], [3 / 7, 7 / 7]]
  ]);
});

it("stackOffsetExpand(series, order) observes the specified order", () => {
  const series = [
    [[0, 1], [0, 2], [0, 1]],
    [[0, 3], [0, 4], [0, 2]],
    [[0, 5], [0, 2], [0, 4]]
  ];
  stackOffsetExpand(series, stackOrderReverse(series));
  assert.deepStrictEqual(series, [
    [[8 / 9, 9 / 9], [6 / 8, 8 / 8], [6 / 7, 7 / 7]],
    [[5 / 9, 8 / 9], [2 / 8, 6 / 8], [4 / 7, 6 / 7]],
    [[0 / 9, 5 / 9], [0 / 8, 2 / 8], [0 / 7, 4 / 7]]
  ]);
});
import assert from "assert";
import {stackOffsetNone, stackOrderNone, stackOrderReverse} from "../../src/index.js";

it("stackOffsetNone(series, order) stacks upon the first layer’s existing positions", () => {
  const series = [
    [[1, 2], [2, 4], [3, 4]],
    [[0, 3], [0, 4], [0, 2]],
    [[0, 5], [0, 2], [0, 4]]
  ];
  stackOffsetNone(series, stackOrderNone(series));
  assert.deepStrictEqual(series, [
    [[1,  2], [2,  4], [3,  4]],
    [[2,  5], [4,  8], [4,  6]],
    [[5, 10], [8, 10], [6, 10]]
  ]);
});

it("stackOffsetNone(series, order) treats NaN as zero", () => {
  const series = [
    [[0, 1], [0,   2], [0, 1]],
    [[0, 3], [0, NaN], [0, 2]],
    [[0, 5], [0,   2], [0, 4]]
  ];
  stackOffsetNone(series, stackOrderNone(series));
  assert(isNaN(series[1][1][1]));
  series[1][1][1] = "NaN"; // can’t assert.strictEqual NaN
  assert.deepStrictEqual(series, [
    [[0, 1], [0,     2], [0, 1]],
    [[1, 4], [2, "NaN"], [1, 3]],
    [[4, 9], [2,     4], [3, 7]]
  ]);
});

it("stackOffsetNone(series, order) observes the specified order", () => {
  const series = [
    [[0, 1], [0, 2], [0, 1]],
    [[0, 3], [0, 4], [0, 2]],
    [[0, 5], [0, 2], [0, 4]]
  ];
  stackOffsetNone(series, stackOrderReverse(series));
  assert.deepStrictEqual(series, [
    [[8, 9], [6, 8], [6, 7]],
    [[5, 8], [2, 6], [4, 6]],
    [[0, 5], [0, 2], [0, 4]]
  ]);
});
import assert from "assert";
import {stackOffsetSilhouette, stackOrderNone, stackOrderReverse} from "../../src/index.js";

it("stackOffsetSilhouette(series, order) centers the stack around zero", () => {
  const series = [
    [[0, 1], [0, 2], [0, 1]],
    [[0, 3], [0, 4], [0, 2]],
    [[0, 5], [0, 2], [0, 4]]
  ];
  stackOffsetSilhouette(series, stackOrderNone(series));
  assert.deepStrictEqual(series, [
    [[0 - 9 / 2, 1 - 9 / 2], [0 - 8 / 2, 2 - 8 / 2], [0 - 7 / 2, 1 - 7 / 2]],
    [[1 - 9 / 2, 4 - 9 / 2], [2 - 8 / 2, 6 - 8 / 2], [1 - 7 / 2, 3 - 7 / 2]],
    [[4 - 9 / 2, 9 - 9 / 2], [6 - 8 / 2, 8 - 8 / 2], [3 - 7 / 2, 7 - 7 / 2]]
  ]);
});

it("stackOffsetSilhouette(series, order) treats NaN as zero", () => {
  const series = [
    [[0, 1], [0,   2], [0, 1]],
    [[0, 3], [0, NaN], [0, 2]],
    [[0, 5], [0,   2], [0, 4]]
  ];
  stackOffsetSilhouette(series, stackOrderNone(series));
  assert(isNaN(series[1][1][1]));
  series[1][1][1] = "NaN"; // can’t assert.strictEqual NaN
  assert.deepStrictEqual(series, [
    [[0 - 9 / 2, 1 - 9 / 2], [0 - 4 / 2, 2 - 4 / 2], [0 - 7 / 2, 1 - 7 / 2]],
    [[1 - 9 / 2, 4 - 9 / 2], [2 - 4 / 2,     "NaN"], [1 - 7 / 2, 3 - 7 / 2]],
    [[4 - 9 / 2, 9 - 9 / 2], [2 - 4 / 2, 4 - 4 / 2], [3 - 7 / 2, 7 - 7 / 2]]
  ]);
});

it("stackOffsetSilhouette(series, order) observes the specified order", () => {
  const series = [
    [[0, 1], [0, 2], [0, 1]],
    [[0, 3], [0, 4], [0, 2]],
    [[0, 5], [0, 2], [0, 4]]
  ];
  stackOffsetSilhouette(series, stackOrderReverse(series));
  assert.deepStrictEqual(series, [
    [[8 - 9 / 2, 9 - 9 / 2], [6 - 8 / 2, 8 - 8 / 2], [6 - 7 / 2, 7 - 7 / 2]],
    [[5 - 9 / 2, 8 - 9 / 2], [2 - 8 / 2, 6 - 8 / 2], [4 - 7 / 2, 6 - 7 / 2]],
    [[0 - 9 / 2, 5 - 9 / 2], [0 - 8 / 2, 2 - 8 / 2], [0 - 7 / 2, 4 - 7 / 2]]
  ]);
});
import assert from "assert";
import {stackOffsetWiggle, stackOrderNone, stackOrderReverse} from "../../src/index.js";

it("stackOffsetWiggle(series, order) minimizes weighted wiggle", () => {
  const series = [
    [[0, 1], [0, 2], [0, 1]],
    [[0, 3], [0, 4], [0, 2]],
    [[0, 5], [0, 2], [0, 4]]
  ];
  stackOffsetWiggle(series, stackOrderNone(series));
  assert.deepStrictEqual(series.map(roundSeries), [
    [[0, 1], [-1, 1], [0.7857143, 1.7857143]],
    [[1, 4], [ 1, 5], [1.7857143, 3.7857143]],
    [[4, 9], [ 5, 7], [3.7857143, 7.7857143]]
  ].map(roundSeries));
});

it("stackOffsetWiggle(series, order) treats NaN as zero", () => {
  const series = [
    [[0,   1], [0,   2], [0,   1]],
    [[0, NaN], [0, NaN], [0, NaN]],
    [[0,   3], [0,   4], [0,   2]],
    [[0,   5], [0,   2], [0,   4]]
  ];
  stackOffsetWiggle(series, stackOrderNone(series));
  assert(isNaN(series[1][0][1]));
  assert(isNaN(series[1][0][2]));
  assert(isNaN(series[1][0][3]));
  series[1][0][1] = series[1][1][1] = series[1][2][1] = "NaN"; // can’t assert.strictEqual NaN
  assert.deepStrictEqual(series.map(roundSeries), [
    [[0,     1], [-1,     1], [0.7857143, 1.7857143]],
    [[1, "NaN"], [ 1, "NaN"], [1.7857143,     "NaN"]],
    [[1,     4], [ 1,     5], [1.7857143, 3.7857143]],
    [[4,     9], [ 5,     7], [3.7857143, 7.7857143]]
  ].map(roundSeries));
});

it("stackOffsetWiggle(series, order) observes the specified order", () => {
  const series = [
    [[0, 1], [0, 2], [0, 1]],
    [[0, 3], [0, 4], [0, 2]],
    [[0, 5], [0, 2], [0, 4]]
  ];
  stackOffsetWiggle(series, stackOrderReverse(series));
  assert.deepStrictEqual(series.map(roundSeries), [
    [[8, 9], [8, 10], [7.21428571, 8.21428571]],
    [[5, 8], [4,  8], [5.21428571, 7.21428571]],
    [[0, 5], [2,  4], [1.21428571, 5.21428571]]
  ].map(roundSeries));
});

function roundSeries(series) {
  return series.map(function(point) {
    return point.map(function(value) {
      return isNaN(value) ? value : Math.round(value * 1e6) / 1e6;
    });
  });
}
