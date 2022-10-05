import assert from "assert";
import {range} from "d3-array";
import {geoArea, geoCircle, geoGraticule} from "../src/index.js";
import {assertInDelta} from "./asserts.js";

function stripes(a, b) {
  return {type: "Polygon", coordinates: [a, b].map(function(d, i) {
    const stripe = range(-180, 180, 0.1).map(function(x) { return [x, d]; });
    stripe.push(stripe[0]);
    return i ? stripe.reverse() : stripe;
  })};
}

it("area: Point", () => {
  assert.strictEqual(geoArea({type: "Point", coordinates: [0, 0]}), 0);
});

it("area: MultiPoint", () => {
  assert.strictEqual(geoArea({type: "MultiPoint", coordinates: [[0, 1], [2, 3]]}), 0);
});

it("area: LineString", () => {
  assert.strictEqual(geoArea({type: "LineString", coordinates: [[0, 1], [2, 3]]}), 0);
});

it("area: MultiLineString", () => {
  assert.strictEqual(geoArea({type: "MultiLineString", coordinates: [[[0, 1], [2, 3]], [[4, 5], [6, 7]]]}), 0);
});

it("area: Polygon - tiny", () => {
  assertInDelta(geoArea({type: "Polygon", coordinates: [[
    [-64.66070178517852, 18.33986913231323],
    [-64.66079715091509, 18.33994007490749],
    [-64.66074946804680, 18.33994007490749],
    [-64.66070178517852, 18.33986913231323]
  ]]}), 4.890516e-13, 1e-13);
});

it("area: Polygon - zero area", () => {
  assert.strictEqual(geoArea({
    "type": "Polygon",
    "coordinates": [[
      [96.79142432523281, 5.262704519048153],
      [96.81065389253769, 5.272455576551362],
      [96.82988345984256, 5.272455576551362],
      [96.81065389253769, 5.272455576551362],
      [96.79142432523281, 5.262704519048153]
    ]]
  }), 0);
});

it("area: Polygon - semilune", () => {
  assertInDelta(geoArea({type: "Polygon", coordinates: [[[0, 0], [0, 90], [90, 0], [0, 0]]]}), Math.PI / 2, 1e-6);
});

it("area: Polygon - lune", () => {
  assertInDelta(geoArea({type: "Polygon", coordinates: [[[0, 0], [0, 90], [90, 0], [0, -90], [0, 0]]]}), Math.PI, 1e-6);
});

it("area: Polygon - hemispheres North", () => {
  assertInDelta(geoArea({type: "Polygon", coordinates: [[[0, 0], [-90, 0], [180, 0], [90, 0], [0, 0]]]}), 2 * Math.PI, 1e-6);
});

it("area: Polygon - hemispheres South", () => {
  assertInDelta(geoArea({type: "Polygon", coordinates: [[[0, 0], [90, 0], [180, 0], [-90, 0], [0, 0]]]}), 2 * Math.PI, 1e-6);
});

it("area: Polygon - hemispheres East", () => {
  assertInDelta(geoArea({type: "Polygon", coordinates: [[[0, 0], [0, 90], [180, 0], [0, -90], [0, 0]]]}), 2 * Math.PI, 1e-6);
});

it("area: Polygon - hemispheres West", () => {
  assertInDelta(geoArea({type: "Polygon", coordinates: [[[0, 0], [0, -90], [180, 0], [0, 90], [0, 0]]]}), 2 * Math.PI, 1e-6);
});

it("area: Polygon - graticule outline sphere", () => {
  assertInDelta(geoArea(geoGraticule().extent([[-180, -90], [180, 90]]).outline()), 4 * Math.PI, 1e-5);
});

it("area: Polygon - graticule outline hemisphere", () => {
  assertInDelta(geoArea(geoGraticule().extent([[-180, 0], [180, 90]]).outline()), 2 * Math.PI, 1e-5);
});

it("area: Polygon - graticule outline semilune", () => {
  assertInDelta(geoArea(geoGraticule().extent([[0, 0], [90, 90]]).outline()), Math.PI / 2, 1e-5);
});

it("area: Polygon - circles hemisphere", () => {
  assertInDelta(geoArea(geoCircle().radius(90)()), 2 * Math.PI, 1e-5);
});

it("area: Polygon - circles 60°", () => {
  assertInDelta(geoArea(geoCircle().radius(60).precision(0.1)()), Math.PI, 1e-5);
});

it("area: Polygon - circles 60° North", () => {
  assertInDelta(geoArea(geoCircle().radius(60).precision(0.1).center([0, 90])()), Math.PI, 1e-5);
});

it("area: Polygon - circles 45°", () => {
  assertInDelta(geoArea(geoCircle().radius(45).precision(0.1)()), Math.PI * (2 - Math.SQRT2), 1e-5);
});

it("area: Polygon - circles 45° North", () => {
  assertInDelta(geoArea(geoCircle().radius(45).precision(0.1).center([0, 90])()), Math.PI * (2 - Math.SQRT2), 1e-5);
});

it("area: Polygon - circles 45° South", () => {
  assertInDelta(geoArea(geoCircle().radius(45).precision(0.1).center([0, -90])()), Math.PI * (2 - Math.SQRT2), 1e-5);
});

it("area: Polygon - circles 135°", () => {
  assertInDelta(geoArea(geoCircle().radius(135).precision(0.1)()), Math.PI * (2 + Math.SQRT2), 1e-5);
});

it("area: Polygon - circles 135° North", () => {
  assertInDelta(geoArea(geoCircle().radius(135).precision(0.1).center([0, 90])()), Math.PI * (2 + Math.SQRT2), 1e-5);
});

it("area: Polygon - circles 135° South", () => {
  assertInDelta(geoArea(geoCircle().radius(135).precision(0.1).center([0, -90])()), Math.PI * (2 + Math.SQRT2), 1e-5);
});

it("area: Polygon - circles tiny", () => {
  assertInDelta(geoArea(geoCircle().radius(1e-6).precision(0.1)()), 0, 1e-6);
});

it("area: Polygon - circles huge", () => {
  assertInDelta(geoArea(geoCircle().radius(180 - 1e-6).precision(0.1)()), 4 * Math.PI, 1e-6);
});

it("area: Polygon - circles 60° with 45° hole", () => {
  const circle = geoCircle().precision(0.1);
  assertInDelta(geoArea({
    type: "Polygon",
    coordinates: [
      circle.radius(60)().coordinates[0],
      circle.radius(45)().coordinates[0].reverse()
    ]
  }), Math.PI * (Math.SQRT2 - 1), 1e-5);
});

it("area: Polygon - circles 45° holes at [0°, 0°] and [0°, 90°]", () => {
  const circle = geoCircle().precision(0.1).radius(45);
  assertInDelta(geoArea({
    type: "Polygon",
    coordinates: [
      circle.center([0, 0])().coordinates[0].reverse(),
      circle.center([0, 90])().coordinates[0].reverse()
    ]
  }), Math.PI * 2 * Math.SQRT2, 1e-5);
});

it("area: Polygon - circles 45° holes at [0°, 90°] and [0°, 0°]", () => {
  const circle = geoCircle().precision(0.1).radius(45);
  assertInDelta(geoArea({
    type: "Polygon",
    coordinates: [
      circle.center([0, 90])().coordinates[0].reverse(),
      circle.center([0, 0])().coordinates[0].reverse()
    ]
  }), Math.PI * 2 * Math.SQRT2, 1e-5);
});

it("area: Polygon - stripes 45°, -45°", () => {
  assertInDelta(geoArea(stripes(45, -45)), Math.PI * 2 * Math.SQRT2, 1e-5);
});

it("area: Polygon - stripes -45°, 45°", () => {
  assertInDelta(geoArea(stripes(-45, 45)), Math.PI * 2 * (2 - Math.SQRT2), 1e-5);
});

it("area: Polygon - stripes 45°, 30°", () => {
  assertInDelta(geoArea(stripes(45, 30)), Math.PI * (Math.SQRT2 - 1), 1e-5);
});

it("area: MultiPolygon two hemispheres", () => {
  assert.strictEqual(geoArea({type: "MultiPolygon", coordinates: [
    [[[0, 0], [-90, 0], [180, 0], [90, 0], [0, 0]]],
    [[[0, 0], [90, 0], [180, 0], [-90, 0], [0, 0]]]
  ]}), 4 * Math.PI);
});

it("area: Sphere", () => {
  assert.strictEqual(geoArea({type: "Sphere"}), 4 * Math.PI);
});

it("area: GeometryCollection", () => {
  assert.strictEqual(geoArea({type: "GeometryCollection", geometries: [{type: "Sphere"}]}), 4 * Math.PI);
});

it("area: FeatureCollection", () => {
  assert.strictEqual(geoArea({type: "FeatureCollection", features: [{type: "Feature", geometry: {type: "Sphere"}}]}), 4 * Math.PI);
});

it("area: Feature", () => {
  assert.strictEqual(geoArea({type: "Feature", geometry: {type: "Sphere"}}), 4 * Math.PI);
});
import assert from "assert";

export function assertPathEqual(actual, expected) {
  assert.strictEqual(normalizePath(actual + ""), normalizePath(expected + ""));
}

const reNumber = /[-+]?(?:\d+\.\d+|\d+\.|\.\d+|\d+)(?:[eE][-]?\d+)?/g;

function normalizePath(path) {
  return path.replace(reNumber, formatNumber);
}

function formatNumber(s) {
  return Math.abs((s = +s) - Math.round(s)) < 1e-6 ? Math.round(s) : s.toFixed(6);
}

export function assertInDelta(actual, expected, delta = 1e-6) {
  assert(inDelta(actual, expected, delta), `${actual} should be within ${delta} of ${expected}`);
}

function inDelta(actual, expected, delta) {
  return (Array.isArray(expected) ? inDeltaArray
      : typeof expected === "object" ? inDeltaObject
      : inDeltaNumber)(actual, expected, delta);
}

function inDeltaArray(actual, expected, delta) {
  let n = expected.length, i = -1;
  if (actual.length !== n) return false;
  while (++i < n) if (!inDelta(actual[i], expected[i], delta)) return false;
  return true;
}

function inDeltaObject(actual, expected, delta) {
  for (let i in expected) if (!inDelta(actual[i], expected[i], delta)) return false;
  for (let i in actual) if (!(i in expected)) return false;
  return true;
}

function inDeltaNumber(actual, expected, delta) {
  return actual >= expected - delta && actual <= expected + delta;
}
import assert from "assert";
import {geoBounds} from "../src/index.js";
import {assertInDelta} from "./asserts.js";

it("bounds: Feature", () => {
  assert.deepStrictEqual(geoBounds({
    type: "Feature",
    geometry: {
      type: "MultiPoint",
      coordinates: [[-123, 39], [-122, 38]]
    }
  }), [[-123, 38], [-122, 39]]);
});

it("bounds: FeatureCollection", () => {
  assert.deepStrictEqual(geoBounds({
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [-123, 39]
        }
      },
      {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [-122, 38]
        }
      }
    ]
  }), [[-123, 38], [-122, 39]]);
});

it("bounds: GeometryCollection", () => {
  assert.deepStrictEqual(geoBounds({
    type: "GeometryCollection",
    geometries: [
      {
        type: "Point",
        coordinates: [-123, 39]
      },
      {
        type: "Point",
        coordinates: [-122, 38]
      }
    ]
  }), [[-123, 38], [-122, 39]]);
});

it("bounds: LineString - simple", () => {
  assert.deepStrictEqual(geoBounds({
    type: "LineString",
    coordinates: [[-123, 39], [-122, 38]]
  }), [[-123, 38], [-122, 39]]);
});

it("bounds: LineString - symmetry", () => {
  assert.deepStrictEqual(geoBounds({
    type: "LineString",
    coordinates: [[-30, -20], [130, 40]]
  }), geoBounds({
    type: "LineString",
    coordinates: [[-30, -20], [130, 40]].reverse()
  }));
});

it("bounds: LineString - containing coincident points", () => {
  assert.deepStrictEqual(geoBounds({
    type: "LineString",
    coordinates: [[-123, 39], [-122, 38], [-122, 38]]
  }), [[-123, 38], [-122, 39]]);
});

it("bounds: LineString - meridian", () => {
  assert.deepStrictEqual(geoBounds({
    type: "LineString",
    coordinates: [[0, 0], [0, 1], [0, 60]]
  }), [[0, 0], [0, 60]]);
});

it("bounds: LineString - equator", () => {
  assert.deepStrictEqual(geoBounds({
    type: "LineString",
    coordinates: [[0, 0], [1, 0], [60, 0]]
  }), [[0, 0], [60, 0]]);
});

it("bounds: LineString - containing an inflection point in the Northern hemisphere", () => {
  assertInDelta(geoBounds({
    type: "LineString",
    coordinates: [[-45, 60], [45, 60]]
  }), [[-45, 60], [45, 67.792345]], 1e-6);
});

it("bounds: LineString - containing an inflection point in the Southern hemisphere", () => {
  assertInDelta(geoBounds({
    type: "LineString",
    coordinates: [[-45, -60], [45, -60]]
  }), [[-45, -67.792345], [45, -60]], 1e-6);
});

it("bounds: MultiLineString", () => {
  assert.deepStrictEqual(geoBounds({
    type: "MultiLineString",
    coordinates: [[[-123, 39], [-122, 38]]]
  }), [[-123, 38], [-122, 39]]);
});

it("bounds: MultiPoint - simple", () => {
  assert.deepStrictEqual(geoBounds({
    type: "MultiPoint",
    coordinates: [[-123, 39], [-122, 38]]
  }), [[-123, 38], [-122, 39]]);
});

it("bounds: MultiPoint - two points near antimeridian", () => {
  assert.deepStrictEqual(geoBounds({
    type: "MultiPoint",
    coordinates: [[-179, 39], [179, 38]]
  }), [[179, 38], [-179, 39]]);
});

it("bounds: MultiPoint - two points near antimeridian, two points near primary meridian", () => {
  assert.deepStrictEqual(geoBounds({
    type: "MultiPoint",
    coordinates: [[-179, 39], [179, 38], [-1, 0], [1, 0]]
  }), [[-1, 0], [-179, 39]]);
});

it("bounds: MultiPoint - two points near primary meridian, two points near antimeridian", () => {
  assert.deepStrictEqual(geoBounds({
    type: "MultiPoint",
    coordinates: [[-1, 0], [1, 0], [-179, 39], [179, 38]]
  }), [[-1, 0], [-179, 39]]);
});

it("bounds: MultiPoint - four mixed points near primary meridian and antimeridian", () => {
  assert.deepStrictEqual(geoBounds({
    type: "MultiPoint",
    coordinates: [[-1, 0], [-179, 39], [1, 0], [179, 38]]
  }), [[-1, 0], [-179, 39]]);
});

it("bounds: MultiPoint - three points near antimeridian", () => {
  assert.deepStrictEqual(geoBounds({
    type: "MultiPoint",
    coordinates: [[178, 38], [179, 39], [-179, 37]]
  }), [[178, 37], [-179, 39]]);
});

it("bounds: MultiPoint - various points near antimeridian", () => {
  assert.deepStrictEqual(geoBounds({
    type: "MultiPoint",
    coordinates: [[-179, 39], [-179, 38], [178, 39], [-178, 38]]
  }), [[178, 38], [-178, 39]]);
});

it("bounds: MultiPolygon", () => {
  assertInDelta(geoBounds({
    type: "MultiPolygon",
    coordinates: [
      [[[-123, 39], [-122, 39], [-122, 38], [-123, 39]],
      [[10, 20], [20, 20], [20, 10], [10, 10], [10, 20]]]
    ]
  }), [[-123, 10], [20, 39.001067]], 1e-6);
});

it("bounds: Point", () => {
  assert.deepStrictEqual(geoBounds({
    type: "Point",
    coordinates: [-123, 39]
  }), [[-123, 39], [-123, 39]]);
});

it("bounds: Polygon - simple", () => {
  assertInDelta(geoBounds({
    type: "Polygon",
    coordinates: [[[-123, 39], [-122, 39], [-122, 38], [-123, 39]]]
  }), [[-123, 38], [-122, 39.001067]], 1e-6);
});

it("bounds: Polygon - larger than a hemisphere, small, counter-clockwise", () => {
  assert.deepStrictEqual(geoBounds({
    type: "Polygon",
    coordinates: [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]]
  }), [[-180, -90], [180, 90]]);
});

it("bounds: Polygon - larger than a hemisphere, large lat-lon rectangle", () => {
  assertInDelta(geoBounds({
    type: "Polygon",
    coordinates: [[[-170, 80], [0, 80], [170, 80], [170, -80], [0, -80], [-170, -80], [-170, 80]]]
  }), [[-170, -89.119552], [170, 89.119552]], 1e-6);
});

it("bounds: Polygon - larger than a hemisphere, South pole", () => {
  assertInDelta(geoBounds({
    type: "Polygon",
    coordinates: [[[10, 80], [170, 80], [-170, 80], [-10, 80], [10, 80]]]
  }), [[-180, -90], [180, 88.246216]], 1e-6);
});

it("bounds: Polygon - larger than a hemisphere, excluding both poles", () => {
  assertInDelta(geoBounds({
    type: "Polygon",
    coordinates: [[[10, 80], [170, 80], [-170, 80], [-10, 80], [-10, 0], [-10, -80], [-170, -80], [170, -80], [10, -80], [10, 0], [10, 80]]]
  }), [[10, -88.246216], [-10, 88.246216]], 1e-6);
});

it("bounds: Polygon - South pole", () => {
  assert.deepStrictEqual(geoBounds({
    type: "Polygon",
    coordinates: [[[-60, -80], [60, -80], [180, -80], [-60, -80]]]
  }), [[-180, -90], [180, -80]]);
});

it("bounds: Polygon - ring", () => {
  assertInDelta(geoBounds({
    type: "Polygon",
    coordinates: [
      [[-60, -80], [60, -80], [180, -80], [-60, -80]],
      [[-60, -89], [180, -89], [60, -89], [-60, -89]]
    ]
  }), [[-180, -89.499961], [180, -80]], 1e-6);
});

it("bounds: Sphere", () => {
  assert.deepStrictEqual(geoBounds({
    type: "Sphere"
  }), [[-180, -90], [180, 90]]);
});

it("bounds: NestedCollection", () => {
  assert.deepStrictEqual(geoBounds({
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: {
          type: "GeometryCollection",
          geometries: [
            {
              type: "Point",
              coordinates: [-120,47]
            },
            {
              type: "Point",
              coordinates: [-119,46]
            }
          ]
        }
      }
    ]
  }), [[-120,46], [-119,47]]);
});

it("bounds: null geometries - Feature", () => {
  const b = geoBounds({type: "Feature", geometry: null});
  assert(isNaN(b[0][0]));
  assert(isNaN(b[0][1]));
  assert(isNaN(b[1][0]));
  assert(isNaN(b[1][1]));
});

it("bounds: null geometries - MultiPoint", () => {
  const b = geoBounds({type: "MultiPoint", coordinates: []});
  assert(isNaN(b[0][0]));
  assert(isNaN(b[0][1]));
  assert(isNaN(b[1][0]));
  assert(isNaN(b[1][1]));
});

it("bounds: null geometries - MultiLineString", () => {
  const b = geoBounds({type: "MultiLineString", coordinates: []});
  assert(isNaN(b[0][0]));
  assert(isNaN(b[0][1]));
  assert(isNaN(b[1][0]));
  assert(isNaN(b[1][1]));
});

it("bounds: null geometries - MultiPolygon", () => {
  const b = geoBounds({type: "MultiPolygon", coordinates: []});
  assert(isNaN(b[0][0]));
  assert(isNaN(b[0][1]));
  assert(isNaN(b[1][0]));
  assert(isNaN(b[1][1]));
});
import assert from "assert";
import {readFileSync} from "fs";
import {range} from "d3-array";
import {geoCentroid, geoCircle} from "../src/index.js";
import {assertInDelta} from "./asserts.js";

it("the centroid of a point is itself", () => {
  assertInDelta(geoCentroid({type: "Point", coordinates: [0, 0]}), [0, 0], 1e-6);
  assertInDelta(geoCentroid({type: "Point", coordinates: [1, 1]}), [1, 1], 1e-6);
  assertInDelta(geoCentroid({type: "Point", coordinates: [2, 3]}), [2, 3], 1e-6);
  assertInDelta(geoCentroid({type: "Point", coordinates: [-4, -5]}), [-4, -5], 1e-6);
});

it("the centroid of a set of points is the (spherical) average of its constituent members", () => {
  assertInDelta(geoCentroid({type: "GeometryCollection", geometries: [{type: "Point", coordinates: [0, 0]}, {type: "Point", coordinates: [1, 2]}]}), [0.499847, 1.000038], 1e-6);
  assertInDelta(geoCentroid({type: "MultiPoint", coordinates: [[0, 0], [1, 2]]}), [0.499847, 1.000038], 1e-6);
  assertInDelta(geoCentroid({type: "MultiPoint", coordinates: [[179, 0], [-179, 0]]}), [180, 0], 1e-6);
});

it("the centroid of a set of points and their antipodes is ambiguous", () => {
  assert(geoCentroid({type: "MultiPoint", coordinates: [[0, 0], [180, 0]]}).every(isNaN));
  assert(geoCentroid({type: "MultiPoint", coordinates: [[0, 0], [90, 0], [180, 0], [-90, 0]]}).every(isNaN));
  assert(geoCentroid({type: "MultiPoint", coordinates: [[0, 0], [0, 90], [180, 0], [0, -90]]}).every(isNaN));
});

it("the centroid of the empty set of points is ambiguous", () => {
  assert(geoCentroid({type: "MultiPoint", coordinates: []}).every(isNaN));
});

it("the centroid of a line string is the (spherical) average of its constituent great arc segments", () => {
  assertInDelta(geoCentroid({type: "LineString", coordinates: [[0, 0], [1, 0]]}), [0.5, 0], 1e-6);
  assertInDelta(geoCentroid({type: "LineString", coordinates: [[0, 0], [0, 90]]}), [0, 45], 1e-6);
  assertInDelta(geoCentroid({type: "LineString", coordinates: [[0, 0], [0, 45], [0, 90]]}), [0, 45], 1e-6);
  assertInDelta(geoCentroid({type: "LineString", coordinates: [[-1, -1], [1, 1]]}), [0, 0], 1e-6);
  assertInDelta(geoCentroid({type: "LineString", coordinates: [[-60, -1], [60, 1]]}), [0, 0], 1e-6);
  assertInDelta(geoCentroid({type: "LineString", coordinates: [[179, -1], [-179, 1]]}), [180, 0], 1e-6);
  assertInDelta(geoCentroid({type: "LineString", coordinates: [[-179, 0], [0, 0], [179, 0]]}), [0, 0], 1e-6);
  assertInDelta(geoCentroid({type: "LineString", coordinates: [[-180, -90], [0, 0], [0, 90]]}), [0, 0], 1e-6);
});

it("the centroid of a great arc from a point to its antipode is ambiguous", () => {
  assert(geoCentroid({type: "LineString", coordinates: [[180, 0], [0, 0]]}).every(isNaN));
  assert(geoCentroid({type: "MultiLineString", coordinates: [[[0, -90], [0, 90]]]}).every(isNaN));
});

it("the centroid of a set of line strings is the (spherical) average of its constituent great arc segments", () => {
  assertInDelta(geoCentroid({type: "MultiLineString", coordinates: [[[0, 0], [0, 2]]]}), [0, 1], 1e-6);
});

it("a line of zero length is treated as points", () => {
  assertInDelta(geoCentroid({type: "LineString", coordinates: [[1, 1], [1, 1]]}), [1, 1], 1e-6);
  assertInDelta(geoCentroid({type: "GeometryCollection", geometries: [{type: "Point", coordinates: [0, 0]}, {type: "LineString", coordinates: [[1, 2], [1, 2]]}]}), [0.666534, 1.333408], 1e-6);
});

it("an empty polygon with non-zero extent is treated as a line", () => {
  assertInDelta(geoCentroid({type: "Polygon", coordinates: [[[1, 1], [2, 1], [3, 1], [2, 1], [1, 1]]]}), [2, 1.000076], 1e-6);
  assertInDelta(geoCentroid({type: "GeometryCollection", geometries: [{type: "Point", coordinates: [0, 0]}, {type: "Polygon", coordinates: [[[1, 2], [1, 2], [1, 2], [1, 2]]]}]}), [0.799907, 1.600077], 1e-6);
});

it("an empty polygon with zero extent is treated as a point", () => {
  assertInDelta(geoCentroid({type: "Polygon", coordinates: [[[1, 1], [1, 1], [1, 1], [1, 1]]]}), [1, 1], 1e-6);
  assertInDelta(geoCentroid({type: "GeometryCollection", geometries: [{type: "Point", coordinates: [0, 0]}, {type: "Polygon", coordinates: [[[1, 2], [1, 2], [1, 2], [1, 2]]]}]}), [0.799907, 1.600077], 1e-6);
});

it("the centroid of the equator is ambiguous", () => {
  assert(geoCentroid({type: "LineString", coordinates: [[0, 0], [120, 0], [-120, 0], [0, 0]]}).every(isNaN));
});

it("the centroid of a polygon is the (spherical) average of its surface", () => {
  assertInDelta(geoCentroid({type: "Polygon", coordinates: [[[0, -90], [0, 0], [0, 90], [1, 0], [0, -90]]]}), [0.5, 0], 1e-6);
  assertInDelta(geoCentroid({type: "Polygon", coordinates: [range(-180, 180 + 1 / 2, 1).map(function(x) { return [x, -60]; })]})[1], -90, 1e-6);
  assertInDelta(geoCentroid({type: "Polygon", coordinates: [[[0, -10], [0, 10], [10, 10], [10, -10], [0, -10]]]}), [5, 0], 1e-6);
});

it("the centroid of a set of polygons is the (spherical) average of its surface", () => {
  const circle = geoCircle();
  assertInDelta(geoCentroid({
    type: "MultiPolygon",
    coordinates: [
      circle.radius(45).center([90, 0])().coordinates,
      circle.radius(60).center([-90, 0])().coordinates
    ]
  }), [-90, 0], 1e-6);
});

it("the centroid of a lune is the (spherical) average of its surface", () => {
  assertInDelta(geoCentroid({type: "Polygon", coordinates: [[[0, -90], [0, 0], [0, 90], [1, 0], [0, -90]]]}), [0.5, 0], 1e-6);
});

it("the centroid of a small circle is its center: 5°", () => {
  assertInDelta(geoCentroid(geoCircle().radius(5).center([30, 45])()), [30, 45], 1e-6);
});

it("the centroid of a small circle is its center: 135°", () => {
  assertInDelta(geoCentroid(geoCircle().radius(135).center([30, 45])()), [30, 45], 1e-6);
});

it("the centroid of a small circle is its center: South Pole", () => {
  assert.strictEqual(geoCentroid({type: "Polygon", coordinates: [range(-180, 180 + 1 / 2, 1).map(function(x) { return [x, -60]; })]})[1], -90);
});

it("the centroid of a small circle is its center: equator", () => {
  assertInDelta(geoCentroid({type: "Polygon", coordinates: [[[0, -10], [0, 10], [10, 10], [10, -10], [0, -10]]]}), [5, 0], 1e-6);
});

it("the centroid of a small circle is its center: equator with coincident points", () => {
  assertInDelta(geoCentroid({type: "Polygon", coordinates: [[[0, -10], [0, 10], [0, 10], [10, 10], [10, -10], [0, -10]]]}), [5, 0], 1e-6);
});

it("the centroid of a small circle is its center: other", () => {
  assertInDelta(geoCentroid({type: "Polygon", coordinates: [[[-180, 0], [-180, 10], [-179, 10], [-179, 0], [-180, 0]]]}), [-179.5, 4.987448], 1e-6);
});

it("the centroid of a small circle is its center: concentric rings", () => {
  const circle = geoCircle().center([0, 45]),
      coordinates = circle.radius(60)().coordinates;
  coordinates.push(circle.radius(45)().coordinates[0].reverse());
  assertInDelta(geoCentroid({type: "Polygon", coordinates: coordinates}), [0, 45], 1e-6);
});

it("the centroid of a spherical square on the equator", () => {
  assertInDelta(geoCentroid({type: "Polygon", coordinates: [[[0, -10], [0, 10], [10, 10], [10, -10], [0, -10]]]}), [5, 0], 1e-6);
});

it("the centroid of a spherical square touching the antimeridian", () => {
  assertInDelta(geoCentroid({type: "Polygon", coordinates: [[[-180, 0], [-180, 10], [-179, 10], [-179, 0], [-180, 0]]]}), [-179.5, 4.987448], 1e-6);
});

it("concentric rings", () => {
  const circle = geoCircle().center([0, 45]),
      coordinates = circle.radius(60)().coordinates;
  coordinates.push(circle.radius(45)().coordinates[0].reverse());
  assertInDelta(geoCentroid({type: "Polygon", coordinates: coordinates}), [0, 45], 1e-6);
});

it("the centroid of a sphere is ambiguous", () => {
  assert(geoCentroid({type: "Sphere"}).every(isNaN));
});

it("the centroid of a feature is the centroid of its constituent geometry", () => {
  assertInDelta(geoCentroid({type: "Feature", geometry: {type: "LineString", coordinates: [[1, 1], [1, 1]]}}), [1, 1], 1e-6);
  assertInDelta(geoCentroid({type: "Feature", geometry: {type: "Point", coordinates: [1, 1]}}), [1, 1], 1e-6);
  assertInDelta(geoCentroid({type: "Feature", geometry: {type: "Polygon", coordinates: [[[0, -90], [0, 0], [0, 90], [1, 0], [0, -90]]]}}), [0.5, 0], 1e-6);
});

it("the centroid of a feature collection is the centroid of its constituent geometry", () => {
  assertInDelta(geoCentroid({type: "FeatureCollection", features: [
    {type: "Feature", geometry: {type: "LineString", coordinates: [[179, 0], [180, 0]]}},
    {type: "Feature", geometry: {type: "Point", coordinates: [0, 0]}}
  ]}), [179.5, 0], 1e-6);
});

it("the centroid of a non-empty line string and a point only considers the line string", () => {
  assertInDelta(geoCentroid({type: "GeometryCollection", geometries: [
    {type: "LineString", coordinates: [[179, 0], [180, 0]]},
    {type: "Point", coordinates: [0, 0]}
  ]}), [179.5, 0], 1e-6);
});

it("the centroid of a non-empty polygon, a non-empty line string and a point only considers the polygon", () => {
  assertInDelta(geoCentroid({type: "GeometryCollection", geometries: [
    {type: "Polygon", coordinates: [[[-180, 0], [-180, 1], [-179, 1], [-179, 0], [-180, 0]]]},
    {type: "LineString", coordinates: [[179, 0], [180, 0]]},
    {type: "Point", coordinates: [0, 0]}
  ]}), [-179.5, 0.500006], 1e-6);
  assertInDelta(geoCentroid({type: "GeometryCollection", geometries: [
    {type: "Point", coordinates: [0, 0]},
    {type: "LineString", coordinates: [[179, 0], [180, 0]]},
    {type: "Polygon", coordinates: [[[-180, 0], [-180, 1], [-179, 1], [-179, 0], [-180, 0]]]}
  ]}), [-179.5, 0.500006], 1e-6);
});

it("the centroid of the sphere and a point is the point", () => {
  assert.deepStrictEqual(geoCentroid({type: "GeometryCollection", geometries: [
    {type: "Sphere"},
    {type: "Point", coordinates: [0, 0]}
  ]}), [0, 0]);
  assert.deepStrictEqual(geoCentroid({type: "GeometryCollection", geometries: [
    {type: "Point", coordinates: [0, 0]},
    {type: "Sphere"}
  ]}), [0, 0]);
});

it("the centroid of a detailed feature is correct", () => {
  const ny = JSON.parse(readFileSync("./test/data/ny.json"));
  assertInDelta(geoCentroid(ny), [-73.93079, 40.69447], 1e-5);
});
import assert from "assert";
import {range} from "d3-array";
import {geoCircle} from "../src/index.js";
import {assertInDelta} from "./asserts.js";

it("circle generates a Polygon", () => {
  const o = geoCircle()();
  assert.strictEqual(o.type, "Polygon");
  assertInDelta(o.coordinates, [[[-78.69007,-90],[-90,-84],[-90,-78],[-90,-72],[-90,-66],[-90,-60],[-90,-54],[-90,-48],[-90,-42],[-90,-36],[-90,-30],[-90,-24],[-90,-18],[-90,-12],[-90,-6],[-90,0],[-90,6],[-90,12],[-90,18],[-90,24],[-90,30],[-90,36],[-90,42],[-90,48],[-90,54],[-90,60],[-90,66],[-90,72],[-90,78],[-90,84],[-89.59666,90],[90,84],[90,78],[90,72],[90,66],[90,60],[90,54],[90,48],[90,42],[90,36],[90,30],[90,24],[90,18],[90,12],[90,6],[90,0],[90,-6],[90,-12],[90,-18],[90,-24],[90,-30],[90,-36],[90,-42],[90,-48],[90,-54],[90,-60],[90,-66],[90,-72],[90,-78],[90,-84],[89.56977,-90]]], 1e-5);
});

it("circle.center([0, 90])", () => {
  const o = geoCircle().center([0, 90])();
  assert.strictEqual(o.type, "Polygon");
  assertInDelta(o.coordinates, [range(360, -1, -6).map(function(x) { return [x >= 180 ? x - 360 : x, 0]; })], 1e-6);
});

it("circle.center([45, 45])", () => {
  const o = geoCircle().center([45, 45]).radius(0)();
  assert.strictEqual(o.type, "Polygon");
  assertInDelta(o.coordinates[0][0], [45, 45], 1e-6);
});

it("circle: first and last points are coincident", () => {
  const o = geoCircle().center([0, 0]).radius(0.02).precision(45)();
  assertInDelta(o.coordinates[0][0], o.coordinates[0].pop(), 1e-6);
});
#!/usr/bin/env node

import {format} from "d3-format";
import * as d3 from "../src/index.js";

const width = 960 - 1;
const height = 500 - 1;
const projectionName = process.argv[2];
const projectionSymbol = "geo" + projectionName[0].toUpperCase() + projectionName.slice(1);

if (!/^[a-z0-9]+$/i.test(projectionName)) throw new Error;

const formatNumber = format(".6");

const projection = d3[projectionSymbol]()
    .precision(0.01)
    .scale(1)
    .translate([0, 0])
    .center([0, 0]);

if (projection.rotate) projection.rotate([0, 0]);

const land = {type: "Sphere"};

switch (projectionName) {
  case "conicConformal":
  case "stereographic": {
    projection.clipAngle(90);
    break;
  }
}

const path = d3.geoPath()
    .projection(projection);

const bounds = path.bounds(land),
    dx = bounds[1][0] - bounds[0][0],
    dy = bounds[1][1] - bounds[0][1],
    cx = (bounds[1][0] + bounds[0][0]) / 2,
    cy = (bounds[1][1] + bounds[0][1]) / 2,
    scale = Math.min(width / dx, height / dy);

console.log(`d3.${projectionSymbol}()
    .scale(${formatNumber(scale)})
    .center([${(projection.invert ? projection.angle(0).invert([cx, cy]) : [0, 0]).map(formatNumber).join(", ")}]);
`);
import assert from "assert";
import {geoCircle, geoContains, geoInterpolate} from "../src/index.js";

it("a sphere contains any point", () => {
  assert.strictEqual(geoContains({type: "Sphere"}, [0, 0]), true);
});

it("a point contains itself (and not some other point)", () => {
  assert.strictEqual(geoContains({type: "Point", coordinates: [0, 0]}, [0, 0]), true);
  assert.strictEqual(geoContains({type: "Point", coordinates: [1, 2]}, [1, 2]), true);
  assert.strictEqual(geoContains({type: "Point", coordinates: [0, 0]}, [0, 1]), false);
  assert.strictEqual(geoContains({type: "Point", coordinates: [1, 1]}, [1, 0]), false);
});

it("a MultiPoint contains any of its points", () => {
  assert.strictEqual(geoContains({type: "MultiPoint", coordinates: [[0, 0], [1,2]]}, [0, 0]), true);
  assert.strictEqual(geoContains({type: "MultiPoint", coordinates: [[0, 0], [1,2]]}, [1, 2]), true);
  assert.strictEqual(geoContains({type: "MultiPoint", coordinates: [[0, 0], [1,2]]}, [1, 3]), false);
});

it("a LineString contains any point on the Great Circle path", () => {
  assert.strictEqual(geoContains({type: "LineString", coordinates: [[0, 0], [1,2]]}, [0, 0]), true);
  assert.strictEqual(geoContains({type: "LineString", coordinates: [[0, 0], [1,2]]}, [1, 2]), true);
  assert.strictEqual(geoContains({type: "LineString", coordinates: [[0, 0], [1,2]]}, geoInterpolate([0, 0], [1,2])(0.3)), true);
  assert.strictEqual(geoContains({type: "LineString", coordinates: [[0, 0], [1,2]]}, geoInterpolate([0, 0], [1,2])(1.3)), false);
  assert.strictEqual(geoContains({type: "LineString", coordinates: [[0, 0], [1,2]]}, geoInterpolate([0, 0], [1,2])(-0.3)), false);
});

it("a LineString with 2+ points contains those points", () => {
  const points = [[0, 0], [1,2], [3, 4], [5, 6]];
  const feature = {type: "LineString", coordinates: points};
  points.forEach(point => {
    assert.strictEqual(geoContains(feature, point), true);
  });
});

it("a LineString contains epsilon-distant points", () => {
  const epsilon = 1e-6;
  const line = [[0, 0], [0, 10], [10, 10], [10, 0]];
  const points = [[0, 5], [epsilon * 1, 5], [0, epsilon], [epsilon * 1, epsilon]];
  points.forEach(point => {
    assert(geoContains({type:"LineString", coordinates: line}, point));
  });
});

it("a LineString does not contain 10*epsilon-distant points", () => {
  const epsilon = 1e-6;
  const line = [[0, 0], [0, 10], [10, 10], [10, 0]];
  const points = [[epsilon * 10, 5], [epsilon * 10, epsilon]];
  points.forEach(point => {
    assert(!geoContains({type:"LineString", coordinates: line}, point));
  });
});

it("a MultiLineString contains any point on one of its components", () => {
  assert.strictEqual(geoContains({type: "MultiLineString", coordinates: [[[0, 0], [1,2]], [[2, 3], [4,5]]]}, [2, 3]), true);
  assert.strictEqual(geoContains({type: "MultiLineString", coordinates: [[[0, 0], [1,2]], [[2, 3], [4,5]]]}, [5, 6]), false);
});

it("a Polygon contains a point", () => {
  const polygon = geoCircle().radius(60)();
  assert.strictEqual(geoContains(polygon, [1, 1]), true);
  assert.strictEqual(geoContains(polygon, [-180, 0]), false);
});

it("a Polygon with a hole doesn't contain a point", () => {
  const outer = geoCircle().radius(60)().coordinates[0],
      inner = geoCircle().radius(3)().coordinates[0],
      polygon = {type:"Polygon", coordinates: [outer, inner]};
  assert.strictEqual(geoContains(polygon, [1, 1]), false);
  assert.strictEqual(geoContains(polygon, [5, 0]), true);
  assert.strictEqual(geoContains(polygon, [65, 0]), false);
});

it("a MultiPolygon contains a point", () => {
  const p1 = geoCircle().radius(6)().coordinates,
      p2 = geoCircle().radius(6).center([90,0])().coordinates,
      polygon = {type:"MultiPolygon", coordinates: [p1, p2]};
  assert.strictEqual(geoContains(polygon, [1, 0]), true);
  assert.strictEqual(geoContains(polygon, [90, 1]), true);
  assert.strictEqual(geoContains(polygon, [90, 45]), false);
});

it("a GeometryCollection contains a point", () => {
  const collection = {
    type: "GeometryCollection", geometries: [
      {type: "GeometryCollection", geometries: [{type: "LineString", coordinates: [[-45, 0], [0, 0]]}]},
      {type: "LineString", coordinates: [[0, 0], [45, 0]]}
    ]
  };
  assert.strictEqual(geoContains(collection, [-45, 0]), true);
  assert.strictEqual(geoContains(collection, [45, 0]), true);
  assert.strictEqual(geoContains(collection, [12, 25]), false);
});

it("a Feature contains a point", () => {
  const feature = {
    type: "Feature", geometry: {
      type: "LineString", coordinates: [[0, 0], [45, 0]]
    }
  };
  assert.strictEqual(geoContains(feature, [45, 0]), true);
  assert.strictEqual(geoContains(feature, [12, 25]), false);
});

it("a FeatureCollection contains a point", () => {
  const feature1 = {
    type: "Feature", geometry: {
      type: "LineString", coordinates: [[0, 0], [45, 0]]
    }
  },
  feature2 = {
    type: "Feature", geometry: {
      type: "LineString", coordinates: [[-45, 0], [0, 0]]
    }
  },
  featureCollection = {
    type: "FeatureCollection",
    features: [ feature1, feature2 ]
  };
  assert.strictEqual(geoContains(featureCollection, [45, 0]), true);
  assert.strictEqual(geoContains(featureCollection, [-45, 0]), true);
  assert.strictEqual(geoContains(featureCollection, [12, 25]), false);
});

it("null contains nothing", () => {
  assert.strictEqual(geoContains(null, [0, 0]), false);
});

import assert from "assert";
import {geoDistance} from "../src/index.js";
import {assertInDelta} from "./asserts.js";

it("geoDistance(a, b) computes the great-arc distance in radians between the two points a and b", () => {
  assert.strictEqual(geoDistance([0, 0], [0, 0]), 0);
  assertInDelta(geoDistance([118 + 24 / 60, 33 + 57 / 60], [73 + 47 / 60, 40 + 38 / 60]), 3973 / 6371, 0.5);
});

it("geoDistance(a, b) correctly computes small distances", () => {
  assert(geoDistance([0, 0], [0, 1e-12]) > 0);
});
import assert from "assert";
import {extent} from "d3-array";
import {geoGraticule} from "../src/index.js";

it("graticule.extent(…) sets extentMinor and extentMajor", () => {
  const g = geoGraticule().extent([[-90, -45], [90, 45]]);
  assert.deepStrictEqual(g.extentMinor(), [[-90, -45], [90, 45]]);
  assert.deepStrictEqual(g.extentMajor(), [[-90, -45], [90, 45]]);
});

it("graticule.extent() gets extentMinor", () => {
  const g = geoGraticule().extentMinor([[-90, -45], [90, 45]]);
  assert.deepStrictEqual(g.extent(), [[-90, -45], [90, 45]]);
});

it("graticule.extentMajor() default longitude ranges from 180°W (inclusive) to 180°E (exclusive)", () => {
  const e = geoGraticule().extentMajor();
  assert.strictEqual(e[0][0], -180);
  assert.strictEqual(e[1][0], +180);
});

it("graticule.extentMajor() default latitude ranges from 90°S (exclusive) to 90°N (exclusive)", () => {
  const e = geoGraticule().extentMajor();
  assert.strictEqual(e[0][1], -90 + 1e-6);
  assert.strictEqual(e[1][1], +90 - 1e-6);
});

it("graticule.extentMajor(…) coerces input values to numbers", () => {
  const g = geoGraticule().extentMajor([["-90", "-45"], ["+90", "+45"]]);
  const e = g.extentMajor();
  assert.strictEqual(e[0][0], -90);
  assert.strictEqual(e[0][1], -45);
  assert.strictEqual(e[1][0], +90);
  assert.strictEqual(e[1][1], +45);
});

it("graticule.extentMinor() default longitude ranges from 180°W (inclusive) to 180°E (exclusive)", () => {
  const e = geoGraticule().extentMinor();
  assert.strictEqual(e[0][0], -180);
  assert.strictEqual(e[1][0], +180);
});

it("graticule.extentMinor() default latitude ranges from 80°S (inclusive) to 80°N (inclusive)", () => {
  const e = geoGraticule().extentMinor();
  assert.strictEqual(e[0][1], -80 - 1e-6);
  assert.strictEqual(e[1][1], +80 + 1e-6);
});

it("graticule.extentMinor(…) coerces input values to numbers", () => {
  const g = geoGraticule().extentMinor([["-90", "-45"], ["+90", "+45"]]);
  const e = g.extentMinor();
  assert.strictEqual(e[0][0], -90);
  assert.strictEqual(e[0][1], -45);
  assert.strictEqual(e[1][0], +90);
  assert.strictEqual(e[1][1], +45);
});

it("graticule.step(…) sets the minor and major step", () => {
  const g = geoGraticule().step([22.5, 22.5]);
  assert.deepStrictEqual(g.stepMinor(), [22.5, 22.5]);
  assert.deepStrictEqual(g.stepMajor(), [22.5, 22.5]);
});

it("graticule.step() gets the minor step", () => {
  const g = geoGraticule().stepMinor([22.5, 22.5]);
  assert.deepStrictEqual(g.step(), [22.5, 22.5]);
});

it("graticule.stepMinor() defaults to 10°, 10°", () => {
  assert.deepStrictEqual(geoGraticule().stepMinor(), [10, 10]);
});

it("graticule.stepMinor(…) coerces input values to numbers", () => {
  const g = geoGraticule().stepMinor(["45", "11.25"]);
  const s = g.stepMinor();
  assert.strictEqual(s[0], 45);
  assert.strictEqual(s[1], 11.25);
});

it("graticule.stepMajor() defaults to 90°, 360°", () => {
  assert.deepStrictEqual(geoGraticule().stepMajor(), [90, 360]);
});

it("graticule.stepMajor(…) coerces input values to numbers", () => {
  const g = geoGraticule().stepMajor(["45", "11.25"]);
  const s = g.stepMajor();
  assert.strictEqual(s[0], 45);
  assert.strictEqual(s[1], 11.25);
});

it("graticule.lines() default longitude ranges from 180°W (inclusive) to 180°E (exclusive)", () => {
  const lines = geoGraticule().lines()
      .filter((line) => line.coordinates[0][0] === line.coordinates[1][0])
      .sort((a, b) => a.coordinates[0][0] - b.coordinates[0][0]);
  assert.strictEqual(lines[0].coordinates[0][0], -180);
  assert.strictEqual(lines[lines.length - 1].coordinates[0][0], +170);
});

it("graticule.lines() default latitude ranges from 90°S (exclusive) to 90°N (exclusive)", () => {
  const lines = geoGraticule().lines()
      .filter(line => line.coordinates[0][1] === line.coordinates[1][1])
      .sort((a, b) => a.coordinates[0][1] - b.coordinates[0][1]);
  assert.strictEqual(lines[0].coordinates[0][1], -80);
  assert.strictEqual(lines[lines.length - 1].coordinates[0][1], +80);
});

it("graticule.lines() default minor longitude lines extend from 80°S to 80°N", () => {
  const lines = geoGraticule().lines()
      .filter(line => line.coordinates[0][0] === line.coordinates[1][0])
      .filter(line => Math.abs(line.coordinates[0][0] % 90) > 1e-6);
  lines.forEach(function(line) {
    assert.deepStrictEqual(extent(line.coordinates, p => p[1]), [-80 - 1e-6, +80 + 1e-6]);
  });
});

it("graticule.lines() default major longitude lines extend from 90°S to 90°N", () => {
  const lines = geoGraticule().lines()
      .filter(line => line.coordinates[0][0] === line.coordinates[1][0])
      .filter(line => Math.abs(line.coordinates[0][0] % 90) < 1e-6);
  lines.forEach(function(line) {
    assert.deepStrictEqual(extent(line.coordinates, p => p[1]), [-90 + 1e-6, +90 - 1e-6]);
  });
});

it("graticule.lines() default latitude lines extend from 180°W to 180°E", () => {
  const lines = geoGraticule().lines()
      .filter(line => line.coordinates[0][1] === line.coordinates[1][1]);
  lines.forEach(function(line) {
    assert.deepStrictEqual(extent(line.coordinates, p => p[0]), [-180, +180]);
  });
});

it("graticule.lines() returns an array of LineStrings", () => {
  assert.deepStrictEqual(geoGraticule()
      .extent([[-90, -45], [90, 45]])
      .step([45, 45])
      .precision(3)
      .lines(), [
    {type: "LineString", coordinates: [[-90,-45],[-90,45]]}, // meridian
    {type: "LineString", coordinates: [[-45,-45],[-45,45]]}, // meridian
    {type: "LineString", coordinates: [[0,-45],[0,45]]}, // meridian
    {type: "LineString", coordinates: [[45,-45],[45,45]]}, // meridian
    {type: "LineString", coordinates: [[-90,-45],[-87,-45],[-84,-45],[-81,-45],[-78,-45],[-75,-45],[-72,-45],[-69,-45],[-66,-45],[-63,-45],[-60,-45],[-57,-45],[-54,-45],[-51,-45],[-48,-45],[-45,-45],[-42,-45],[-39,-45],[-36,-45],[-33,-45],[-30,-45],[-27,-45],[-24,-45],[-21,-45],[-18,-45],[-15,-45],[-12,-45],[-9,-45],[-6,-45],[-3,-45],[0,-45],[3,-45],[6,-45],[9,-45],[12,-45],[15,-45],[18,-45],[21,-45],[24,-45],[27,-45],[30,-45],[33,-45],[36,-45],[39,-45],[42,-45],[45,-45],[48,-45],[51,-45],[54,-45],[57,-45],[60,-45],[63,-45],[66,-45],[69,-45],[72,-45],[75,-45],[78,-45],[81,-45],[84,-45],[87,-45],[90,-45]]},
    {type: "LineString", coordinates: [[-90,0],[-87,0],[-84,0],[-81,0],[-78,0],[-75,0],[-72,0],[-69,0],[-66,0],[-63,0],[-60,0],[-57,0],[-54,0],[-51,0],[-48,0],[-45,0],[-42,0],[-39,0],[-36,0],[-33,0],[-30,0],[-27,0],[-24,0],[-21,0],[-18,0],[-15,0],[-12,0],[-9,0],[-6,0],[-3,0],[0,0],[3,0],[6,0],[9,0],[12,0],[15,0],[18,0],[21,0],[24,0],[27,0],[30,0],[33,0],[36,0],[39,0],[42,0],[45,0],[48,0],[51,0],[54,0],[57,0],[60,0],[63,0],[66,0],[69,0],[72,0],[75,0],[78,0],[81,0],[84,0],[87,0],[90,0]]}
  ]);
});

it("graticule() returns a MultiLineString of all lines", () => {
  const g = geoGraticule()
      .extent([[-90, -45], [90, 45]])
      .step([45, 45])
      .precision(3);
  assert.deepStrictEqual(g(), {
    type: "MultiLineString",
    coordinates: g.lines().map(line => line.coordinates)
  });
});

it("graticule.outline() returns a Polygon encompassing the major extent", () => {
  assert.deepStrictEqual(geoGraticule()
      .extentMajor([[-90, -45], [90, 45]])
      .precision(3)
      .outline(), {
    type: "Polygon",
    coordinates: [[
      [-90,-45],[-90,45], // meridian
      [-87,45],[-84,45],[-81,45],[-78,45],[-75,45],[-72,45],[-69,45],[-66,45],[-63,45],[-60,45],[-57,45],[-54,45],[-51,45],[-48,45],[-45,45],[-42,45],[-39,45],[-36,45],[-33,45],[-30,45],[-27,45],[-24,45],[-21,45],[-18,45],[-15,45],[-12,45],[-9,45],[-6,45],[-3,45],[0,45],[3,45],[6,45],[9,45],[12,45],[15,45],[18,45],[21,45],[24,45],[27,45],[30,45],[33,45],[36,45],[39,45],[42,45],[45,45],[48,45],[51,45],[54,45],[57,45],[60,45],[63,45],[66,45],[69,45],[72,45],[75,45],[78,45],[81,45],[84,45],[87,45],
      [90,45],[90,-45], // meridian
      [87,-45],[84,-45],[81,-45],[78,-45],[75,-45],[72,-45],[69,-45],[66,-45],[63,-45],[60,-45],[57,-45],[54,-45],[51,-45],[48,-45],[45,-45],[42,-45],[39,-45],[36,-45],[33,-45],[30,-45],[27,-45],[24,-45],[21,-45],[18,-45],[15,-45],[12,-45],[9,-45],[6,-45],[3,-45],[0,-45],[-3,-45],[-6,-45],[-9,-45],[-12,-45],[-15,-45],[-18,-45],[-21,-45],[-24,-45],[-27,-45],[-30,-45],[-33,-45],[-36,-45],[-39,-45],[-42,-45],[-45,-45],[-48,-45],[-51,-45],[-54,-45],[-57,-45],[-60,-45],[-63,-45],[-66,-45],[-69,-45],[-72,-45],[-75,-45],[-78,-45],[-81,-45],[-84,-45],[-87,-45],[-90,-45]
    ]]
  });
});
import assert from "assert";
import {geoInterpolate} from "../src/index.js";
import {assertInDelta} from "./asserts.js";

it("geoInterpolate(a, a) returns a", () => {
  assert.deepStrictEqual(geoInterpolate([140.63289, -29.95101], [140.63289, -29.95101])(0.5), [140.63289, -29.95101]);
});

it("geoInterpolate(a, b) returns the expected values when a and b lie on the equator", () => {
  assertInDelta(geoInterpolate([10, 0], [20, 0])(0.5), [15, 0], 1e-6);
});

it("geoInterpolate(a, b) returns the expected values when a and b lie on a meridian", () => {
  assertInDelta(geoInterpolate([10, -20], [10, 40])(0.5), [10, 10], 1e-6);
});
import {geoLength} from "../src/index.js";
import {assertInDelta} from "./asserts.js";

it("geoLength(Point) returns zero", () => {
  assertInDelta(geoLength({type: "Point", coordinates: [0, 0]}), 0, 1e-6);
});

it("geoLength(MultiPoint) returns zero", () => {
  assertInDelta(geoLength({type: "MultiPoint", coordinates: [[0, 1], [2, 3]]}), 0, 1e-6);
});

it("geoLength(LineString) returns the sum of its great-arc segments", () => {
  assertInDelta(geoLength({type: "LineString", coordinates: [[-45, 0], [45, 0]]}), Math.PI / 2, 1e-6);
  assertInDelta(geoLength({type: "LineString", coordinates: [[-45, 0], [-30, 0], [-15, 0], [0, 0]]}), Math.PI / 4, 1e-6);
});

it("geoLength(MultiLineString) returns the sum of its great-arc segments", () => {
  assertInDelta(geoLength({type: "MultiLineString", coordinates: [[[-45, 0], [-30, 0]], [[-15, 0], [0, 0]]]}), Math.PI / 6, 1e-6);
});

it("geoLength(Polygon) returns the length of its perimeter", () => {
  assertInDelta(geoLength({type: "Polygon", coordinates: [[[0, 0], [3, 0], [3, 3], [0, 3], [0, 0]]]}), 0.157008, 1e-6);
});

it("geoLength(Polygon) returns the length of its perimeter, including holes", () => {
  assertInDelta(geoLength({type: "Polygon", coordinates: [[[0, 0], [3, 0], [3, 3], [0, 3], [0, 0]], [[1, 1], [2, 1], [2, 2], [1, 2], [1, 1]]]}), 0.209354, 1e-6);
});

it("geoLength(MultiPolygon) returns the summed length of the perimeters", () => {
  assertInDelta(geoLength({type: "MultiPolygon", coordinates: [[[[0, 0], [3, 0], [3, 3], [0, 3], [0, 0]]]]}), 0.157008, 1e-6);
  assertInDelta(geoLength({type: "MultiPolygon", coordinates: [[[[0, 0], [3, 0], [3, 3], [0, 3], [0, 0]]], [[[1, 1], [2, 1], [2, 2], [1, 2], [1, 1]]]]}), 0.209354, 1e-6);
});

it("geoLength(FeatureCollection) returns the sum of its features’ lengths", () => {
  assertInDelta(geoLength({
    type: "FeatureCollection", features: [
      {type: "Feature", geometry: {type: "LineString", coordinates: [[-45, 0], [0, 0]]}},
      {type: "Feature", geometry: {type: "LineString", coordinates: [[0, 0], [45, 0]]}}
    ]
  }), Math.PI / 2, 1e-6);
});

it("geoLength(GeometryCollection) returns the sum of its geometries’ lengths", () => {
  assertInDelta(geoLength({
    type: "GeometryCollection", geometries: [
      {type: "GeometryCollection", geometries: [{type: "LineString", coordinates: [[-45, 0], [0, 0]]}]},
      {type: "LineString", coordinates: [[0, 0], [45, 0]]}
    ]
  }), Math.PI / 2, 1e-6);
});
import assert from "assert";
import {geoCircle} from "../src/index.js";
import contains from "../src/polygonContains.js";

function polygonContains(polygon, point) {
  return contains(polygon.map(ringRadians), pointRadians(point));
}

it("geoPolygonContains(empty, point) returns false", () => {
  assert.strictEqual(polygonContains([], [0, 0]), 0);
});

it("geoPolygonContains(simple, point) returns the expected value", () => {
  const polygon = [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]];
  assert.strictEqual(polygonContains(polygon, [0.1, 2]), 0);
  assert.strictEqual(polygonContains(polygon, [0.1, 0.1]), 1);
});

it("geoPolygonContains(smallCircle, point) returns the expected value", () => {
  const polygon = geoCircle().radius(60)().coordinates;
  assert.strictEqual(polygonContains(polygon, [-180, 0]), 0);
  assert.strictEqual(polygonContains(polygon, [1, 1]), 1);
});

it("geoPolygonContains wraps longitudes", () => {
  const polygon = geoCircle().center([300, 0])().coordinates;
  assert.strictEqual(polygonContains(polygon, [300, 0]), 1);
  assert.strictEqual(polygonContains(polygon, [-60, 0]), 1);
  assert.strictEqual(polygonContains(polygon, [-420, 0]), 1);
});

it("geoPolygonContains(southPole, point) returns the expected value", () => {
  const polygon = [[[-60, -80], [60, -80], [180, -80], [-60, -80]]];
  assert.strictEqual(polygonContains(polygon, [0, 0]), 0);
  assert.strictEqual(polygonContains(polygon, [0, -85]), 1);
  assert.strictEqual(polygonContains(polygon, [0, -90]), 1);
});

it("geoPolygonContains(northPole, point) returns the expected value", () => {
  const polygon = [[[60, 80], [-60, 80], [-180, 80], [60, 80]]];
  assert.strictEqual(polygonContains(polygon, [0, 0]), 0);
  assert.strictEqual(polygonContains(polygon, [0, 85]), 1);
  assert.strictEqual(polygonContains(polygon, [0, 90]), 1);
  assert.strictEqual(polygonContains(polygon, [-100, 90]), 1);
  assert.strictEqual(polygonContains(polygon, [0, -90]), 0);
});

it("geoPolygonContains(touchingPole, Pole) returns true (issue #105)", () => {
  const polygon = [[[0, -30], [120, -30], [0, -90], [0, -30]]];
  assert.strictEqual(polygonContains(polygon, [0, -90]), 0);
  assert.strictEqual(polygonContains(polygon, [-60, -90]), 0);
  assert.strictEqual(polygonContains(polygon, [60, -90]), 0);
  const polygon2 = [[[0, 30], [-120, 30], [0, 90], [0, 30]]];
  assert.strictEqual(polygonContains(polygon2, [0, 90]), 0);
  assert.strictEqual(polygonContains(polygon2, [-60, 90]), 0);
  assert.strictEqual(polygonContains(polygon2, [60, 90]), 0);
});

it("geoPolygonContains(southHemispherePoly) returns the expected value", () => {
  const polygon = [[[0, 0], [10, -40], [-10, -40], [0, 0]]];
  assert.strictEqual(polygonContains(polygon, [0,-40.2]), 1);
  assert.strictEqual(polygonContains(polygon, [0,-40.5]), 0);
});

it("geoPolygonContains(largeNearOrigin, point) returns the expected value", () => {
  const polygon = [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]];
  assert.strictEqual(polygonContains(polygon, [0.1, 0.1]), 0);
  assert.strictEqual(polygonContains(polygon, [2, 0.1]), 1);
});

it("geoPolygonContains(largeNearSouthPole, point) returns the expected value", () => {
  const polygon = [[[-60, 80], [60, 80], [180, 80], [-60, 80]]];
  assert.strictEqual(polygonContains(polygon, [0, 85]), 0);
  assert.strictEqual(polygonContains(polygon, [0, 0]), 1);
});

it("geoPolygonContains(largeNearNorthPole, point) returns the expected value", () => {
  const polygon = [[[60, -80], [-60, -80], [-180, -80], [60, -80]]];
  assert.strictEqual(polygonContains(polygon, [0, -85]), 0);
  assert.strictEqual(polygonContains(polygon, [0, 0]), 1);
});

it("geoPolygonContains(largeCircle, point) returns the expected value", () => {
  const polygon = geoCircle().radius(120)().coordinates;
  assert.strictEqual(polygonContains(polygon, [-180, 0]), 0);
  assert.strictEqual(polygonContains(polygon, [-90, 0]), 1);
});

it("geoPolygonContains(largeNarrowStripHole, point) returns the expected value", () => {
  const polygon = [[[-170, -1], [0, -1], [170, -1], [170, 1], [0, 1], [-170, 1], [-170, -1]]];
  assert.strictEqual(polygonContains(polygon, [0, 0]), 0);
  assert.strictEqual(polygonContains(polygon, [0, 20]), 1);
});

it("geoPolygonContains(largeNarrowEquatorialHole, point) returns the expected value", () => {
  const circle = geoCircle().center([0, -90]),
      ring0 = circle.radius(90 - 0.01)().coordinates[0],
      ring1 = circle.radius(90 + 0.01)().coordinates[0].reverse(),
      polygon = [ring0, ring1];
  assert.strictEqual(polygonContains(polygon, [0, 0]), 0);
  assert.strictEqual(polygonContains(polygon, [0, -90]), 1);
});

it("geoPolygonContains(largeNarrowEquatorialStrip, point) returns the expected value", () => {
  const circle = geoCircle().center([0, -90]),
      ring0 = circle.radius(90 + 0.01)().coordinates[0],
      ring1 = circle.radius(90 - 0.01)().coordinates[0].reverse(),
      polygon = [ring0, ring1];
  assert.strictEqual(polygonContains(polygon, [0, -90]), 0);
  assert.strictEqual(polygonContains(polygon, [0, 0]), 1);
});

it("geoPolygonContains(ringNearOrigin, point) returns the expected value", () => {
  const ring0 = [[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]],
      ring1 = [[0.4, 0.4], [0.6, 0.4], [0.6, 0.6], [0.4, 0.6], [0.4, 0.4]],
      polygon = [ring0, ring1];
  assert.strictEqual(polygonContains(polygon, [0.5, 0.5]), 0);
  assert.strictEqual(polygonContains(polygon, [0.1, 0.5]), 1);
});

it("geoPolygonContains(ringEquatorial, point) returns the expected value", () => {
  const ring0 = [[0, -10], [-120, -10], [120, -10], [0, -10]],
      ring1 = [[0, 10], [120, 10], [-120, 10], [0, 10]],
      polygon = [ring0, ring1];
  assert.strictEqual(polygonContains(polygon, [0, 20]), 0);
  assert.strictEqual(polygonContains(polygon, [0, 0]), 1);
});

it("geoPolygonContains(ringExcludingBothPoles, point) returns the expected value", () => {
  const ring0 = [[10, 10], [-10, 10], [-10, -10], [10, -10], [10, 10]].reverse(),
      ring1 = [[170, 10], [170, -10], [-170, -10], [-170, 10], [170, 10]].reverse(),
      polygon = [ring0, ring1];
  assert.strictEqual(polygonContains(polygon, [0, 90]), 0);
  assert.strictEqual(polygonContains(polygon, [0, 0]), 1);
});

it("geoPolygonContains(ringContainingBothPoles, point) returns the expected value", () => {
  const ring0 = [[10, 10], [-10, 10], [-10, -10], [10, -10], [10, 10]],
      ring1 = [[170, 10], [170, -10], [-170, -10], [-170, 10], [170, 10]],
      polygon = [ring0, ring1];
  assert.strictEqual(polygonContains(polygon, [0, 0]), 0);
  assert.strictEqual(polygonContains(polygon, [0, 20]), 1);
});

it("geoPolygonContains(ringContainingSouthPole, point) returns the expected value", () => {
  const ring0 = [[10, 10], [-10, 10], [-10, -10], [10, -10], [10, 10]],
      ring1 = [[0, 80], [120, 80], [-120, 80], [0, 80]],
      polygon = [ring0, ring1];
  assert.strictEqual(polygonContains(polygon, [0, 90]), 0);
  assert.strictEqual(polygonContains(polygon, [0, -90]), 1);
});

it("geoPolygonContains(ringContainingNorthPole, point) returns the expected value", () => {
  const ring0 = [[10, 10], [-10, 10], [-10, -10], [10, -10], [10, 10]].reverse(),
      ring1 = [[0, 80], [120, 80], [-120, 80], [0, 80]].reverse(),
      polygon = [ring0, ring1];
  assert.strictEqual(polygonContains(polygon, [0, -90]), 0);
  assert.strictEqual(polygonContains(polygon, [0, 90]), 1);
});

it("geoPolygonContains(selfIntersectingNearOrigin, point) returns the expected value", () => {
  const polygon = [[[0, 0], [1, 0], [1, 3], [3, 3], [3, 1], [0, 1], [0, 0]]];
  assert.strictEqual(polygonContains(polygon, [15, 0.5]), 0);
  assert.strictEqual(polygonContains(polygon, [12, 2]), 0);
  assert.strictEqual(polygonContains(polygon, [0.5, 0.5]), 1);
  assert.strictEqual(polygonContains(polygon, [2, 2]), 1);
});

it("geoPolygonContains(selfIntersectingNearSouthPole, point) returns the expected value", () => {
  const polygon = [[[-10, -80], [120, -80], [-120, -80], [10, -85], [10, -75], [-10, -75], [-10, -80]]];
  assert.strictEqual(polygonContains(polygon, [0, 0]), 0);
  assert.strictEqual(polygonContains(polygon, [0, -76]), 1);
  assert.strictEqual(polygonContains(polygon, [0, -89]), 1);
});

it("geoPolygonContains(selfIntersectingNearNorthPole, point) returns the expected value", () => {
  const polygon = [[[-10, 80], [-10, 75], [10, 75], [10, 85], [-120, 80], [120, 80], [-10, 80]]];
  assert.strictEqual(polygonContains(polygon, [0, 0]), 0);
  assert.strictEqual(polygonContains(polygon, [0, 76]), 1);
  assert.strictEqual(polygonContains(polygon, [0, 89]), 1);
});

it("geoPolygonContains(hemisphereTouchingTheSouthPole, point) returns the expected value", () => {
  const polygon = geoCircle().radius(90)().coordinates;
  assert.strictEqual(polygonContains(polygon, [0, 0]), 1);
});

it("geoPolygonContains(triangleTouchingTheSouthPole, point) returns the expected value", () => {
  const polygon = [[[180, -90], [-45, 0], [45, 0], [180, -90]]];
  assert.strictEqual(polygonContains(polygon, [-46, 0]), 0);
  assert.strictEqual(polygonContains(polygon, [0, 1]), 0);
  assert.strictEqual(polygonContains(polygon, [-90, -80]), 0);
  assert.strictEqual(polygonContains(polygon, [-44, 0]), 1);
  assert.strictEqual(polygonContains(polygon, [0, 0]), 1);
  assert.strictEqual(polygonContains(polygon, [0, -30]), 1);
  assert.strictEqual(polygonContains(polygon, [30, -80]), 1);
});

it("geoPolygonContains(triangleTouchingTheSouthPole2, point) returns the expected value", () => {
  const polygon = [[[-45, 0], [45, 0], [180, -90], [-45, 0]]];
  assert.strictEqual(polygonContains(polygon, [-46, 0]), 0);
  assert.strictEqual(polygonContains(polygon, [0, 1]), 0);
  assert.strictEqual(polygonContains(polygon, [-90, -80]), 0);
  assert.strictEqual(polygonContains(polygon, [-44, 0]), 1);
  assert.strictEqual(polygonContains(polygon, [0, 0]), 1);
  assert.strictEqual(polygonContains(polygon, [0, -30]), 1);
  assert.strictEqual(polygonContains(polygon, [30, -80]), 1);
});

it("geoPolygonContains(triangleTouchingTheSouthPole3, point) returns the expected value", () => {
  const polygon = [[[180, -90], [-135, 0], [135, 0], [180, -90]]];
  assert.strictEqual(polygonContains(polygon, [180, 0]), 0);
  assert.strictEqual(polygonContains(polygon, [150, 0]), 0);
  assert.strictEqual(polygonContains(polygon, [180, -30]), 0);
  assert.strictEqual(polygonContains(polygon, [150, -80]), 0);
  assert.strictEqual(polygonContains(polygon, [0, 0]), 1);
  assert.strictEqual(polygonContains(polygon, [180, 1]), 1);
  assert.strictEqual(polygonContains(polygon, [-90, -80]), 1);
});

it("geoPolygonContains(triangleTouchingTheNorthPole, point) returns the expected value", () => {
  const polygon = [[[180, 90], [45, 0], [-45, 0], [180, 90]]];
  assert.strictEqual(polygonContains(polygon, [-90, 0]), 0);
  assert.strictEqual(polygonContains(polygon, [0, -1]), 0);
  assert.strictEqual(polygonContains(polygon, [0, -80]), 0);
  assert.strictEqual(polygonContains(polygon, [-90, 1]), 0);
  assert.strictEqual(polygonContains(polygon, [-90, 80]), 0);
  assert.strictEqual(polygonContains(polygon, [-44, 10]), 1);
  assert.strictEqual(polygonContains(polygon, [0, 10]), 1);
  assert.strictEqual(polygonContains(polygon, [30, 80]), 1);
});

function ringRadians(ring) {
  return ring = ring.map(pointRadians), ring.pop(), ring;
}

function pointRadians(point) {
  return [point[0] * Math.PI / 180, point[1] * Math.PI / 180];
}
import assert from "assert";
import {geoRotation} from "../src/index.js";
import {assertInDelta} from "./asserts.js";

it("a rotation of [+90°, 0°] only rotates longitude", () => {
  const rotation = geoRotation([90, 0])([0, 0]);
  assertInDelta(rotation[0], 90, 1e-6);
  assertInDelta(rotation[1], 0, 1e-6);
});

it("a rotation of [+90°, 0°] wraps around when crossing the antimeridian", () => {
  const rotation = geoRotation([90, 0])([150, 0]);
  assertInDelta(rotation[0], -120, 1e-6);
  assertInDelta(rotation[1], 0, 1e-6);
});

it("a rotation of [-45°, 45°] rotates longitude and latitude", () => {
  const rotation = geoRotation([-45, 45])([0, 0]);
  assertInDelta(rotation[0], -54.73561, 1e-6);
  assertInDelta(rotation[1], 30, 1e-6);
});

it("a rotation of [-45°, 45°] inverse rotation of longitude and latitude", () => {
  const rotation = geoRotation([-45, 45]).invert([-54.73561, 30]);
  assertInDelta(rotation[0], 0, 1e-6);
  assertInDelta(rotation[1], 0, 1e-6);
});

it("the identity rotation constrains longitudes to [-180°, 180°]", () => {
  const rotate = geoRotation([0, 0]);
  assert.strictEqual(rotate([180,0])[0], 180);
  assert.strictEqual(rotate([-180,0])[0], -180);
  assert.strictEqual(rotate([360,0])[0], 0);
  assertInDelta(rotate([2562,0])[0], 42, 1e-10);
  assertInDelta(rotate([-2562,0])[0], -42, 1e-10);
});
import assert from "assert";
import {mkdirSync, promises} from "fs";
import {resolve} from "path";
import pixelmatch from "pixelmatch";
import {PNG} from "pngjs";
import * as snapshots from "./snapshots.js";

const {readFile, writeFile} = promises;

mkdirSync("./test/snapshots", {recursive: true});

for (const [name, snapshot] of Object.entries(snapshots)) {
  it(`snapshot ${name}`, async () => {
    const canvas = await snapshot();
    const actual = PNG.sync.read(canvas.toBuffer());
    const outfile = resolve("./test/snapshots", `${name}.png`);
    let expected;

    try {
      expected = PNG.sync.read(await readFile(outfile));
    } catch (error) {
      if (error.code === "ENOENT" && process.env.CI !== "true") {
        console.warn(`! generating ${outfile}`);
        await writeFile(outfile, PNG.sync.write(actual));
        return;
      } else {
        throw error;
      }
    }

    const diff = new PNG({
      width: expected.width,
      height: expected.height
    });

    const n = pixelmatch(
      expected.data,
      actual.data,
      diff.data,
      expected.width,
      expected.height,
      {threshold: 0.1}
    );

    if (n > 0) {
      await writeFile(`${name}.diff.png`, PNG.sync.write(diff));
    }

    assert(n === 0, `${name} must match snapshot (${n} differences; see ${name}.diff.png)`);
  });
}
import {Canvas} from "canvas";
import {feature, mesh} from "topojson-client";
import {
  geoAlbers,
  geoAlbersUsa,
  geoAzimuthalEqualArea,
  geoAzimuthalEquidistant,
  geoConicConformal,
  geoConicEqualArea,
  geoConicEquidistant,
  geoEqualEarth,
  geoEquirectangular,
  geoGnomonic,
  geoGraticule,
  geoMercator,
  geoNaturalEarth1,
  geoOrthographic,
  geoPath,
  geoStereographic,
  geoTransverseMercator
} from "../src/index.js";
import {readFile} from "fs/promises";

const width = 960;
const height = 500;

async function renderWorld(projection) {
  const world = JSON.parse(await readFile("./node_modules/world-atlas/world/50m.json"));
  const canvas = new Canvas(width, height);
  const graticule = geoGraticule();
  const sphere = {type: "Sphere"};
  const context = canvas.getContext("2d");
  const path = geoPath(projection, context);
  context.fillStyle = "#fff";
  context.fillRect(0, 0, width, height);
  context.save();
  context.beginPath();
  path(feature(world, world.objects.land));
  context.fillStyle = "#000";
  context.fill();
  context.beginPath();
  path(graticule());
  context.strokeStyle = "rgba(119,119,119,0.5)";
  context.stroke();
  context.restore();
  context.beginPath();
  path(sphere);
  context.strokeStyle = "#000";
  context.stroke();
  return canvas;
}

async function renderUs(projection) {
  const us = JSON.parse(await readFile("./test/data/us-10m.json"));
  const canvas = new Canvas(width, height);
  const context = canvas.getContext("2d");
  const path = geoPath(projection, context);
  context.fillStyle = "#fff";
  context.fillRect(0, 0, width, height);
  context.beginPath();
  path(feature(us, us.objects.land));
  context.fillStyle = "#000";
  context.fill();
  context.beginPath();
  path(mesh(us, us.objects.counties, (a, b) => a !== b && !(a.id / 1000 ^ b.id / 1000)));
  context.lineWidth = 0.5;
  context.strokeStyle = "#fff";
  context.stroke();
  context.beginPath();
  path(mesh(us, us.objects.states, (a, b) => a !== b));
  context.lineWidth = 1;
  context.strokeStyle = "#fff";
  context.stroke();
  return canvas;
}

export async function azimuthalEqualArea() {
  return renderWorld(geoAzimuthalEqualArea().precision(0.1));
}

export async function azimuthalEquidistant() {
  return renderWorld(geoAzimuthalEquidistant().precision(0.1));
}

export async function conicConformal() {
  return renderWorld(geoConicConformal().precision(0.1));
}

export async function conicEqualArea() {
  return renderWorld(geoConicEqualArea().precision(0.1));
}

export async function conicEquidistant() {
  return renderWorld(geoConicEquidistant().precision(0.1));
}

export async function equalEarth() {
  return renderWorld(geoEqualEarth().precision(0.1));
}

export async function equirectangular() {
  return renderWorld(geoEquirectangular().precision(0.1));
}

export async function gnomonic() {
  return renderWorld(geoGnomonic().precision(0.1));
}

export async function mercator() {
  return renderWorld(geoMercator().precision(0.1));
}

export async function naturalEarth1() {
  return renderWorld(geoNaturalEarth1().precision(0.1));
}

export async function angleorient30() {
  return renderWorld(geoEquirectangular().clipAngle(90).angle(-30).precision(0.1).fitExtent([[0, 0], [width, height]], {type: "Sphere"}));
}

export async function orthographic() {
  return renderWorld(geoOrthographic().precision(0.1));
}

export async function stereographic() {
  return renderWorld(geoStereographic().precision(0.1));
}

export async function transverseMercator() {
  return renderWorld(geoTransverseMercator().precision(0.1));
}

export async function albers() {
  return renderUs(geoAlbers().precision(0.1));
}

export async function albersUsa() {
  return renderUs(geoAlbersUsa().precision(0.1));
}
import assert from "assert";
import {geoStream} from "../src/index.js";

it("geoStream(object) ignores unknown types", () => {
  geoStream({type: "Unknown"}, {});
  geoStream({type: "Feature", geometry: {type: "Unknown"}}, {});
  geoStream({type: "FeatureCollection", features: [{type: "Feature", geometry: {type: "Unknown"}}]}, {});
  geoStream({type: "GeometryCollection", geometries: [{type: "Unknown"}]}, {});
});

it("geoStream(object) ignores null geometries", () => {
  geoStream(null, {});
  geoStream({type: "Feature", geometry: null }, {});
  geoStream({type: "FeatureCollection", features: [{type: "Feature", geometry: null }]}, {});
  geoStream({type: "GeometryCollection", geometries: [null]}, {});
});

it("geoStream(object) returns void", () => {
  assert.strictEqual(geoStream({type: "Point", coordinates: [1, 2]}, {point: function() { return true; }}), undefined);
});

it("geoStream(object) allows empty multi-geometries", () => {
  geoStream({type: "MultiPoint", coordinates: []}, {});
  geoStream({type: "MultiLineString", coordinates: []}, {});
  geoStream({type: "MultiPolygon", coordinates: []}, {});
});

it("geoStream(Sphere) ↦ sphere", () => {
  let calls = 0;
  geoStream({type: "Sphere"}, {
    sphere: function() {
      assert.strictEqual(arguments.length, 0);
      assert.strictEqual(++calls, 1);
    }
  });
  assert.strictEqual(calls, 1);
});

it("geoStream(Point) ↦ point", () => {
  let calls = 0, coordinates = 0;
  geoStream({type: "Point", coordinates: [1, 2, 3]}, {
    point: function(x, y, z) {
      assert.strictEqual(arguments.length, 3);
      assert.strictEqual(x, ++coordinates);
      assert.strictEqual(y, ++coordinates);
      assert.strictEqual(z, ++coordinates);
      assert.strictEqual(++calls, 1);
    }
  });
  assert.strictEqual(calls, 1);
});

it("geoStream(MultiPoint) ↦ point*", () => {
  let calls = 0, coordinates = 0;
  geoStream({type: "MultiPoint", coordinates: [[1, 2, 3], [4, 5, 6]]}, {
    point: function(x, y, z) {
      assert.strictEqual(arguments.length, 3);
      assert.strictEqual(x, ++coordinates);
      assert.strictEqual(y, ++coordinates);
      assert.strictEqual(z, ++coordinates);
      assert.strictEqual(1 <= ++calls && calls <= 2, true);
    }
  });
  assert.strictEqual(calls, 2);
});

it("geoStream(LineString) ↦ lineStart, point{2,}, lineEnd", () => {
  let calls = 0, coordinates = 0;
  geoStream({type: "LineString", coordinates: [[1, 2, 3], [4, 5, 6]]}, {
    lineStart: function() {
      assert.strictEqual(arguments.length, 0);
      assert.strictEqual(++calls, 1);
    },
    point: function(x, y, z) {
      assert.strictEqual(arguments.length, 3);
      assert.strictEqual(x, ++coordinates);
      assert.strictEqual(y, ++coordinates);
      assert.strictEqual(z, ++coordinates);
      assert.strictEqual(2 <= ++calls && calls <= 3, true);
    },
    lineEnd: function() {
      assert.strictEqual(arguments.length, 0);
      assert.strictEqual(++calls, 4);
    }
  });
  assert.strictEqual(calls, 4);
});

it("geoStream(MultiLineString) ↦ (lineStart, point{2,}, lineEnd)*", () => {
  let calls = 0, coordinates = 0;
  geoStream({type: "MultiLineString", coordinates: [[[1, 2, 3], [4, 5, 6]], [[7, 8, 9], [10, 11, 12]]]}, {
    lineStart: function() {
      assert.strictEqual(arguments.length, 0);
      assert.strictEqual(++calls === 1 || calls === 5, true);
    },
    point: function(x, y, z) {
      assert.strictEqual(arguments.length, 3);
      assert.strictEqual(x, ++coordinates);
      assert.strictEqual(y, ++coordinates);
      assert.strictEqual(z, ++coordinates);
      assert.strictEqual(2 <= ++calls && calls <= 3 || 6 <= calls && calls <= 7, true);
    },
    lineEnd: function() {
      assert.strictEqual(arguments.length, 0);
      assert.strictEqual(++calls === 4 || calls === 8, true);
    }
  });
  assert.strictEqual(calls, 8);
});

it("geoStream(Polygon) ↦ polygonStart, lineStart, point{2,}, lineEnd, polygonEnd", () => {
  let calls = 0, coordinates = 0;
  geoStream({type: "Polygon", coordinates: [[[1, 2, 3], [4, 5, 6], [1, 2, 3]], [[7, 8, 9], [10, 11, 12], [7, 8, 9]]]}, {
    polygonStart: function() {
      assert.strictEqual(arguments.length, 0);
      assert.strictEqual(++calls === 1, true);
    },
    lineStart: function() {
      assert.strictEqual(arguments.length, 0);
      assert.strictEqual(++calls === 2 || calls === 6, true);
    },
    point: function(x, y, z) {
      assert.strictEqual(arguments.length, 3);
      assert.strictEqual(x, ++coordinates);
      assert.strictEqual(y, ++coordinates);
      assert.strictEqual(z, ++coordinates);
      assert.strictEqual(3 <= ++calls && calls <= 4 || 7 <= calls && calls <= 8, true);
    },
    lineEnd: function() {
      assert.strictEqual(arguments.length, 0);
      assert.strictEqual(++calls === 5 || calls === 9, true);
    },
    polygonEnd: function() {
      assert.strictEqual(arguments.length, 0);
      assert.strictEqual(++calls === 10, true);
    }
  });
  assert.strictEqual(calls, 10);
});

it("geoStream(MultiPolygon) ↦ (polygonStart, lineStart, point{2,}, lineEnd, polygonEnd)*", () => {
  let calls = 0, coordinates = 0;
  geoStream({type: "MultiPolygon", coordinates: [[[[1, 2, 3], [4, 5, 6], [1, 2, 3]]], [[[7, 8, 9], [10, 11, 12], [7, 8, 9]]]]}, {
    polygonStart: function() {
      assert.strictEqual(arguments.length, 0);
      assert.strictEqual(++calls === 1 || calls === 7, true);
    },
    lineStart: function() {
      assert.strictEqual(arguments.length, 0);
      assert.strictEqual(++calls === 2 || calls === 8, true);
    },
    point: function(x, y, z) {
      assert.strictEqual(arguments.length, 3);
      assert.strictEqual(x, ++coordinates);
      assert.strictEqual(y, ++coordinates);
      assert.strictEqual(z, ++coordinates);
      assert.strictEqual(3 <= ++calls && calls <= 4 || 9 <= calls && calls <= 10, true);
    },
    lineEnd: function() {
      assert.strictEqual(arguments.length, 0);
      assert.strictEqual(++calls === 5 || calls === 11, true);
    },
    polygonEnd: function() {
      assert.strictEqual(arguments.length, 0);
      assert.strictEqual(++calls === 6 || calls === 12, true);
    }
  });
  assert.strictEqual(calls, 12);
});

it("geoStream(Feature) ↦ .*", () => {
  let calls = 0, coordinates = 0;
  geoStream({type: "Feature", geometry: {type: "Point", coordinates: [1, 2, 3]}}, {
    point: function(x, y, z) {
      assert.strictEqual(arguments.length, 3);
      assert.strictEqual(x, ++coordinates);
      assert.strictEqual(y, ++coordinates);
      assert.strictEqual(z, ++coordinates);
      assert.strictEqual(++calls, 1);
    }
  });
  assert.strictEqual(calls, 1);
});

it("geoStream(FeatureCollection) ↦ .*", () => {
  let calls = 0, coordinates = 0;
  geoStream({type: "FeatureCollection", features: [{type: "Feature", geometry: {type: "Point", coordinates: [1, 2, 3]}}]}, {
    point: function(x, y, z) {
      assert.strictEqual(arguments.length, 3);
      assert.strictEqual(x, ++coordinates);
      assert.strictEqual(y, ++coordinates);
      assert.strictEqual(z, ++coordinates);
      assert.strictEqual(++calls, 1);
    }
  });
  assert.strictEqual(calls, 1);
});

it("geoStream(GeometryCollection) ↦ .*", () => {
  let calls = 0, coordinates = 0;
  geoStream({type: "GeometryCollection", geometries: [{type: "Point", coordinates: [1, 2, 3]}]}, {
    point: function(x, y, z) {
      assert.strictEqual(arguments.length, 3);
      assert.strictEqual(x, ++coordinates);
      assert.strictEqual(y, ++coordinates);
      assert.strictEqual(z, ++coordinates);
      assert.strictEqual(++calls, 1);
    }
  });
  assert.strictEqual(calls, 1);
});
