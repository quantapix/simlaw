import assert from "assert";

export function assertInDelta(actual, expected, delta = 1e-6) {
  assert(inDelta(actual, expected, delta));
}

function inDelta(actual, expected, delta) {
  return (Array.isArray(expected) ? inDeltaArray : inDeltaNumber)(actual, expected, delta);
}

function inDeltaArray(actual, expected, delta) {
  const n = expected.length;
  if (actual.length !== n) return false;
  for (let i = 0; i < n; ++i) if (!inDelta(actual[i], expected[i], delta)) return false;
  return true;
}

function inDeltaNumber(actual, expected, delta) {
  return actual >= expected - delta && actual <= expected + delta;
}
import assert from "assert";
import {contours} from "../src/index.js";

it("contours(values) returns the expected result for an empty polygon", () => {
  const c = contours().size([10, 10]).thresholds([0.5]);
  assert.deepStrictEqual(c([
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0
  ]), [
    {
      "type": "MultiPolygon",
      "value": 0.5,
      "coordinates": []
    }
  ]);
});

it("contours(values) returns the expected result for a simple polygon", () => {
  const c = contours().size([10, 10]).thresholds([0.5]);
  assert.deepStrictEqual(c([
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 1, 1, 1, 0, 0, 0, 0,
    0, 0, 0, 1, 1, 1, 0, 0, 0, 0,
    0, 0, 0, 1, 1, 1, 0, 0, 0, 0,
    0, 0, 0, 1, 1, 1, 0, 0, 0, 0,
    0, 0, 0, 1, 1, 1, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0
  ]), [
    {
      "type": "MultiPolygon",
      "value": 0.5,
      "coordinates": [
        [
          [[6, 7.5], [6, 6.5], [6, 5.5], [6, 4.5], [6, 3.5], [5.5, 3], [4.5, 3],
           [3.5, 3], [3, 3.5], [3, 4.5], [3, 5.5], [3, 6.5], [3, 7.5], [3.5, 8],
           [4.5, 8], [5.5, 8], [6, 7.5]]
        ]
      ]
    }
  ]);
});

it("contours(values).contour(value) returns the expected result for a simple polygon", () => {
  const c = contours().size([10, 10]);
  assert.deepStrictEqual(c.contour([
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 1, 1, 1, 0, 0, 0, 0,
    0, 0, 0, 1, 1, 1, 0, 0, 0, 0,
    0, 0, 0, 1, 1, 1, 0, 0, 0, 0,
    0, 0, 0, 1, 1, 1, 0, 0, 0, 0,
    0, 0, 0, 1, 1, 1, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0
  ], 0.5), {
    "type": "MultiPolygon",
    "value": 0.5,
    "coordinates": [
      [
        [[6, 7.5], [6, 6.5], [6, 5.5], [6, 4.5], [6, 3.5], [5.5, 3], [4.5, 3],
         [3.5, 3], [3, 3.5], [3, 4.5], [3, 5.5], [3, 6.5], [3, 7.5], [3.5, 8],
         [4.5, 8], [5.5, 8], [6, 7.5]]
      ]
    ]
  });
});

it("contours.smooth(false)(values) returns the expected result for a simple polygon", () => {
  const c = contours().smooth(false).size([10, 10]).thresholds([0.5]);
  assert.deepStrictEqual(c([
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 2, 1, 2, 0, 0, 0, 0,
    0, 0, 0, 2, 2, 2, 0, 0, 0, 0,
    0, 0, 0, 1, 2, 1, 0, 0, 0, 0,
    0, 0, 0, 2, 2, 2, 0, 0, 0, 0,
    0, 0, 0, 2, 1, 2, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0
  ]), [
    {
      "type": "MultiPolygon",
      "value": 0.5,
      "coordinates": [
        [
          [[6, 7.5], [6, 6.5], [6, 5.5], [6, 4.5], [6, 3.5], [5.5, 3], [4.5, 3],
           [3.5, 3], [3, 3.5], [3, 4.5], [3, 5.5], [3, 6.5], [3, 7.5], [3.5, 8],
           [4.5, 8], [5.5, 8], [6, 7.5]]
        ]
      ]
    }
  ]);
});

it("contours(values) returns the expected result for a polygon with a hole", () => {
  const c = contours().size([10, 10]).thresholds([0.5]);
  assert.deepStrictEqual(c([
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 1, 1, 1, 0, 0, 0, 0,
    0, 0, 0, 1, 0, 1, 0, 0, 0, 0,
    0, 0, 0, 1, 0, 1, 0, 0, 0, 0,
    0, 0, 0, 1, 0, 1, 0, 0, 0, 0,
    0, 0, 0, 1, 1, 1, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0
  ]), [
    {
      "type": "MultiPolygon",
      "value": 0.5,
      "coordinates": [
        [
          [[6, 7.5], [6, 6.5], [6, 5.5], [6, 4.5], [6, 3.5], [5.5, 3], [4.5, 3],
           [3.5, 3], [3, 3.5], [3, 4.5], [3, 5.5], [3, 6.5], [3, 7.5], [3.5, 8],
           [4.5, 8], [5.5, 8], [6, 7.5]],
          [[4.5, 7], [4, 6.5], [4, 5.5], [4, 4.5], [4.5, 4], [5, 4.5], [5, 5.5],
           [5, 6.5], [4.5, 7]]
        ]
      ]
    }
  ]);
});

it("contours(values) returns the expected result for a multipolygon", () => {
  const c = contours().size([10, 10]).thresholds([0.5]);
  assert.deepStrictEqual(c([
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 1, 1, 0, 1, 0, 0, 0,
    0, 0, 0, 1, 1, 0, 1, 0, 0, 0,
    0, 0, 0, 1, 1, 0, 1, 0, 0, 0,
    0, 0, 0, 1, 1, 0, 1, 0, 0, 0,
    0, 0, 0, 1, 1, 0, 1, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0
  ]), [
    {
      "type": "MultiPolygon",
      "value": 0.5,
      "coordinates": [
        [
          [[5, 7.5], [5, 6.5], [5, 5.5], [5, 4.5], [5, 3.5], [4.5, 3], [3.5, 3],
           [3, 3.5], [3, 4.5], [3, 5.5], [3, 6.5], [3, 7.5], [3.5, 8], [4.5, 8],
           [5, 7.5]]
        ],
        [
          [[7, 7.5], [7, 6.5], [7, 5.5], [7, 4.5], [7, 3.5], [6.5, 3], [6, 3.5],
           [6, 4.5], [6, 5.5], [6, 6.5], [6, 7.5], [6.5, 8], [7, 7.5]]
        ]
      ]
    }
  ]);
});

it("contours(values) returns the expected result for a multipolygon with holes", () => {
  const c = contours().size([10, 10]).thresholds([0.5]);
  assert.deepStrictEqual(c([
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 1, 1, 1, 0, 1, 1, 1, 0, 0,
    0, 1, 0, 1, 0, 1, 0, 1, 0, 0,
    0, 1, 1, 1, 0, 1, 1, 1, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0
  ]), [
    {
      "type": "MultiPolygon",
      "value": 0.5,
      "coordinates": [
        [
          [[4, 5.5], [4, 4.5], [4, 3.5], [3.5, 3], [2.5, 3], [1.5, 3], [1, 3.5],
           [1, 4.5], [1, 5.5], [1.5, 6], [2.5, 6], [3.5, 6], [4, 5.5]],
          [[2.5, 5], [2, 4.5], [2.5, 4], [3, 4.5], [2.5, 5]]
        ],
        [
          [[8, 5.5], [8, 4.5], [8, 3.5], [7.5, 3], [6.5, 3], [5.5, 3], [5, 3.5],
           [5, 4.5], [5, 5.5], [5.5, 6], [6.5, 6], [7.5, 6], [8, 5.5]],
          [[6.5, 5], [6, 4.5], [6.5, 4], [7, 4.5], [6.5, 5]]
        ]
      ]
    }
  ]);
});

it("contours.size(…) validates the specified size", () => {
  assert.deepStrictEqual(contours().size([1, 2]).size(), [1, 2]);
  assert.deepStrictEqual(contours().size([0, 0]).size(), [0, 0]);
  assert.deepStrictEqual(contours().size([1.5, 2.5]).size(), [1, 2]);
  assert.throws(() => void contours().size([0, -1]), /invalid size/);
});

it("contours(values) returns the expected thresholds", () => {
  const c = contours().size([10, 10]).thresholds(20);
  assert.deepStrictEqual(c([
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 1, 1, 1, 0, 1, 1, 1, 0, 0,
    0, 1, 0, 1, 0, 1, 0, 1, 0, 0,
    0, 1, 1, 1, 0, 1, 1, 1, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0
  ]).map(d => d.value), [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95]);
});
import assert from "assert";
import {extent, ticks} from "d3-array";
import {autoType} from "d3-dsv";
import {tsv} from "d3-fetch";
import {polygonCentroid} from "d3-polygon";
import {scaleLinear} from "d3-scale";
import {contourDensity} from "../src/index.js";
import {assertInDelta} from "./asserts.js";
import it from "./jsdom.js";

it("density.size(…) validates the specified size", () => {
  assert.deepStrictEqual(contourDensity().size([1, 2]).size(), [1, 2]);
  assert.deepStrictEqual(contourDensity().size([0, 0]).size(), [0, 0]);
  assert.deepStrictEqual(contourDensity().size([1.5, 2.5]).size(), [1.5, 2.5]);
  assert.throws(() => void contourDensity().size([0, -1]), /invalid size/);
});

it("contourDensity(data) returns the expected result for empty data", () => {
  const c = contourDensity();
  assert.deepStrictEqual(c([]), []);
});

it("contourDensity(data) returns contours centered on a point", () => {
  const c = contourDensity().thresholds([0.00001, 0.0001]);
  for (const p of [[100, 100], [100.5, 102]]) {
    const contour = c([p]);
    assert.strictEqual(contour.length, 2);
    for (const b of contour) {
      const a = polygonCentroid(b.coordinates[0][0]);
      assertInDelta(a[0], p[0], 0.1);
      assertInDelta(a[1], p[1], 0.1);
    }
  }
});

it("contourDensity.thresholds(values[])(data) returns contours for the given values", () => {
  const points = [[1, 0], [0, 1], [1, 1]];
  const c = contourDensity();
  const c1 = c(points);
  const values1 = c1.map(d => d.value);
  const c2 = c.thresholds(values1)(points);
  const values2 = c2.map(d => d.value);
  assert.deepStrictEqual(values1, values2);
});

it("contourDensity.thresholds(values[])(data) returns contours for the given values at a different cellSize", () => {
  const points = [[1, 0], [0, 1], [1, 1]];
  const c = contourDensity().cellSize(16);
  const c1 = c(points);
  const values1 = c1.map(d => d.value);
  const c2 = c.thresholds(values1)(points);
  const values2 = c2.map(d => d.value);
  assert.deepStrictEqual(values1, values2);
});

it("contourDensity(data) returns nice default thresholds", async () => {
  const faithful = await tsv("data/faithful.tsv", autoType);

  const width = 960,
        height = 500,
        marginTop = 20,
        marginRight = 30,
        marginBottom = 30,
        marginLeft = 40;

  const x = scaleLinear()
      .domain(extent(faithful, d => d.waiting)).nice()
      .rangeRound([marginLeft, width - marginRight]);

  const y = scaleLinear()
      .domain(extent(faithful, d => d.eruptions)).nice()
      .rangeRound([height - marginBottom, marginTop]);

  const contour = contourDensity()
      .x(d => x(d.waiting))
      .y(d => y(d.eruptions))
      .size([width, height])
      .bandwidth(30)
    (faithful);

  assert.deepStrictEqual(contour.map(c => c.value), ticks(0.0002, 0.0059, 30));
});

it("contourDensity.contours(data) preserves the specified threshold exactly", async () => {
  const faithful = await tsv("data/faithful.tsv", autoType);

  const width = 960,
        height = 500,
        marginTop = 20,
        marginRight = 30,
        marginBottom = 30,
        marginLeft = 40;

  const x = scaleLinear()
      .domain(extent(faithful, d => d.waiting)).nice()
      .rangeRound([marginLeft, width - marginRight]);

  const y = scaleLinear()
      .domain(extent(faithful, d => d.eruptions)).nice()
      .rangeRound([height - marginBottom, marginTop]);

  const contour = contourDensity()
      .x(d => x(d.waiting))
      .y(d => y(d.eruptions))
      .size([width, height])
      .bandwidth(30)
    .contours(faithful);

  for (const value of ticks(0.0002, 0.006, 30)) {
    assert.strictEqual(contour(value).value, value);
  }
});
import {promises as fs} from "fs";
import * as path from "path";
import {JSDOM} from "jsdom";

export default function jsdomit(description, run) {
  return it(description, withJsdom(run));
}

jsdomit.skip = (description, run) => {
  return it.skip(description, withJsdom(run));
};

jsdomit.only = (description, run) => {
  return it.only(description, withJsdom(run));
};

function withJsdom(run) {
  return async () => {
    const jsdom = new JSDOM("");
    global.window = jsdom.window;
    global.document = jsdom.window.document;
    global.navigator = jsdom.window.navigator;
    global.Event = jsdom.window.Event;
    global.Node = jsdom.window.Node;
    global.NodeList = jsdom.window.NodeList;
    global.HTMLCollection = jsdom.window.HTMLCollection;
    global.fetch = async (href) => new Response(path.resolve("./test", href));
    try {
      return await run();
    } finally {
      delete global.window;
      delete global.document;
      delete global.navigator;
      delete global.Event;
      delete global.Node;
      delete global.NodeList;
      delete global.HTMLCollection;
      delete global.fetch;
    }
  };
}

class Response {
  constructor(href) {
    this._href = href;
    this.ok = true;
    this.status = 200;
  }
  async text() {
    return fs.readFile(this._href, {encoding: "utf-8"});
  }
  async json() {
    return JSON.parse(await this.text());
  }
}
import assert from "assert";
import {promises as fs} from "fs";
import * as path from "path";
import beautify from "js-beautify";
import it from "./jsdom.js";
import * as snapshots from "./snapshots/index.js";

for (const [name, snapshot] of Object.entries(snapshots)) {
  it(`snapshot ${name}`, async () => {
    const svg = await snapshot();
    svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns", "http://www.w3.org/2000/svg");
    svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
    const actual = beautify.html(svg.outerHTML, {indent_size: 2});
    const outfile = path.resolve("./test/output", `${path.basename(name, ".js")}.svg`);
    const diffile = path.resolve("./test/output", `${path.basename(name, ".js")}-changed.svg`);
    let expected;

    try {
      expected = await fs.readFile(outfile, "utf8");
    } catch (error) {
      if (error.code === "ENOENT" && process.env.CI !== "true") {
        console.warn(`! generating ${outfile}`);
        await fs.writeFile(outfile, actual, "utf8");
        return;
      } else {
        throw error;
      }
    }

    if (actual === expected) {
      if (process.env.CI !== "true") {
        try {
          await fs.unlink(diffile);
          console.warn(`! deleted ${diffile}`);
        } catch (error) {
          if (error.code !== "ENOENT") {
            throw error;
          }
        }
      }
    } else {
      console.warn(`! generating ${diffile}`);
      await fs.writeFile(diffile, actual, "utf8");
    }

    assert(actual === expected, `${name} must match snapshot`);
  });
}
