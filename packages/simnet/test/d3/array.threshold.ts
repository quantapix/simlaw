import assert from "assert";
import {thresholdFreedmanDiaconis} from "../../src/index.js";

it("thresholdFreedmanDiaconis(values, min, max) returns the expected result", () => {
  assert.strictEqual(thresholdFreedmanDiaconis([4, 3, 2, 1, NaN], 1, 4), 2);
});
import assert from "assert";
import {thresholdScott} from "../../src/index.js";

it("thresholdScott(values, min, max) returns the expected result", () => {
  assert.strictEqual(thresholdScott([4, 3, 2, 1, NaN], 1, 4), 2);
});
import assert from "assert";
import {thresholdSturges} from "../../src/index.js";

it("thresholdSturges(values, min, max) returns the expected result", () => {
  assert.strictEqual(thresholdSturges([4, 3, 2, 1, NaN], 1, 4), 3);
});
