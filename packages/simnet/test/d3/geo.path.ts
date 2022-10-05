import assert from "assert";
import {geoEquirectangular, geoPath} from "../../src/index.js";

const equirectangular = geoEquirectangular()
    .scale(900 / Math.PI)
    .precision(0);

function testArea(projection, object) {
  return geoPath()
      .projection(projection)
      .area(object);
}

it("geoPath.area(…) of a polygon with no holes", () => {
  assert.strictEqual(testArea(equirectangular, {
    type: "Polygon",
    coordinates: [[[100, 0], [100, 1], [101, 1], [101, 0], [100, 0]]]
  }), 25);
});

it("geoPath.area(…) of a polygon with holes", () => {
  assert.strictEqual(testArea(equirectangular, {
    type: "Polygon",
    coordinates: [[[100, 0], [100, 1], [101, 1], [101, 0], [100, 0]], [[100.2, 0.2], [100.8, 0.2], [100.8, 0.8], [100.2, 0.8], [100.2, 0.2]]]
  }), 16);
});

it("geoPath.area(…) of a sphere", () => {
  assert.strictEqual(testArea(equirectangular, {
    type: "Sphere",
  }), 1620000);
});
import assert from "assert";
import {geoEquirectangular, geoPath} from "../../src/index.js";

const equirectangular = geoEquirectangular()
    .scale(900 / Math.PI)
    .precision(0);

function testBounds(projection, object) {
  return geoPath()
      .projection(projection)
      .bounds(object);
}

it("geoPath.bounds(…) of a polygon with no holes", () => {
  assert.deepStrictEqual(testBounds(equirectangular, {
    type: "Polygon",
    coordinates: [[[100, 0], [100, 1], [101, 1], [101, 0], [100, 0]]]
  }), [[980, 245], [985, 250]]);
});

it("geoPath.bounds(…) of a polygon with holes", () => {
  assert.deepStrictEqual(testBounds(equirectangular, {
    type: "Polygon",
    coordinates: [[[100, 0], [100, 1], [101, 1], [101, 0], [100, 0]], [[100.2, 0.2], [100.8, 0.2], [100.8, 0.8], [100.2, 0.8], [100.2, 0.2]]]
  }), [[980, 245], [985, 250]]);
});

it("geoPath.bounds(…) of a sphere", () => {
  assert.deepStrictEqual(testBounds(equirectangular, {
    type: "Sphere"
  }), [[-420, -200], [1380, 700]]);
});
import assert from "assert";
import {geoEquirectangular, geoPath} from "../../src/index.js";
import {assertInDelta} from "../asserts.js";

const equirectangular = geoEquirectangular()
    .scale(900 / Math.PI)
    .precision(0);

function testCentroid(projection, object) {
  return geoPath()
      .projection(projection)
      .centroid(object);
}

it("geoPath.centroid(…) of a point", () => {
  assert.deepStrictEqual(testCentroid(equirectangular, {type: "Point", coordinates: [0, 0]}), [480, 250]);
});

it("geoPath.centroid(…) of an empty multipoint", () => {
  assert.strictEqual(testCentroid(equirectangular, {type: "MultiPoint", coordinates: []}).every(isNaN), true);
});

it("geoPath.centroid(…) of a singleton multipoint", () => {
  assert.deepStrictEqual(testCentroid(equirectangular, {type: "MultiPoint", coordinates: [[0, 0]]}), [480, 250]);
});

it("geoPath.centroid(…) of a multipoint with two points", () => {
  assert.deepStrictEqual(testCentroid(equirectangular, {type: "MultiPoint", coordinates: [[-122, 37], [-74, 40]]}), [-10, 57.5]);
});

it("geoPath.centroid(…) of an empty linestring", () => {
  assert.strictEqual(testCentroid(equirectangular, {type: "LineString", coordinates: []}).every(isNaN), true);
});

it("geoPath.centroid(…) of a linestring with two points", () => {
  assert.deepStrictEqual(testCentroid(equirectangular, {type: "LineString", coordinates: [[100, 0], [0, 0]]}), [730, 250]);
  assert.deepStrictEqual(testCentroid(equirectangular, {type: "LineString", coordinates: [[0, 0], [100, 0], [101, 0]]}), [732.5, 250]);
});

it("geoPath.centroid(…) of a linestring with two points, one unique", () => {
  assert.deepStrictEqual(testCentroid(equirectangular, {type: "LineString", coordinates: [[-122, 37], [-122, 37]]}), [-130, 65]);
  assert.deepStrictEqual(testCentroid(equirectangular, {type: "LineString", coordinates: [[-74, 40], [-74, 40]]}), [110, 50]);
});

it("geoPath.centroid(…) of a linestring with three points; two unique", () => {
  assert.deepStrictEqual(testCentroid(equirectangular, {type: "LineString", coordinates: [[-122, 37], [-74, 40], [-74, 40]]}), [-10, 57.5]);
});

it("geoPath.centroid(…) of a linestring with three points", () => {
  assertInDelta(testCentroid(equirectangular, {type: "LineString", coordinates: [[-122, 37], [-74, 40], [-100, 0]]}), [17.389135, 103.563545], 1e-6);
});

it("geoPath.centroid(…) of a multilinestring", () => {
  assert.deepStrictEqual(testCentroid(equirectangular, {type: "MultiLineString", coordinates: [[[100, 0], [0, 0]], [[-10, 0], [0, 0]]]}), [705, 250]);
});

it("geoPath.centroid(…) of a single-ring polygon", () => {
  assert.deepStrictEqual(testCentroid(equirectangular, {type: "Polygon", coordinates: [[[100, 0], [100, 1], [101, 1], [101, 0], [100, 0]]]}), [982.5, 247.5]);
});

it("geoPath.centroid(…) of a zero-area polygon", () => {
  assert.deepStrictEqual(testCentroid(equirectangular, {type: "Polygon", coordinates: [[[1, 0], [2, 0], [3, 0], [1, 0]]]}), [490, 250]);
});

it("geoPath.centroid(…) of a polygon with two rings, one with zero area", () => {
  assert.deepStrictEqual(testCentroid(equirectangular, {type: "Polygon", coordinates: [
    [[100,   0], [100,   1], [101,   1], [101,   0], [100, 0]],
    [[100.1, 0], [100.2, 0], [100.3, 0], [100.1, 0]
  ]]}), [982.5, 247.5]);
});

it("geoPath.centroid(…) of a polygon with clockwise exterior and anticlockwise interior", () => {
  assertInDelta(testCentroid(equirectangular, {
    type: "Polygon",
    coordinates: [
      [[-2, -2], [2, -2], [2, 2], [-2, 2], [-2, -2]].reverse(),
      [[ 0, -1], [1, -1], [1, 1], [ 0, 1], [ 0, -1]]
    ]
  }), [479.642857, 250], 1e-6);
});

it("geoPath.centroid(…) of an empty multipolygon", () => {
  assert.strictEqual(testCentroid(equirectangular, {type: "MultiPolygon", coordinates: []}).every(isNaN), true);
});

it("geoPath.centroid(…) of a singleton multipolygon", () => {
  assert.deepStrictEqual(testCentroid(equirectangular, {type: "MultiPolygon", coordinates: [[[[100, 0], [100, 1], [101, 1], [101, 0], [100, 0]]]]}), [982.5, 247.5]);
});

it("geoPath.centroid(…) of a multipolygon with two polygons", () => {
  assert.deepStrictEqual(testCentroid(equirectangular, {type: "MultiPolygon", coordinates: [
    [[[100, 0], [100, 1], [101, 1], [101, 0], [100, 0]]],
    [[[0, 0], [1, 0], [1, -1], [0, -1], [0, 0]]]
  ]}), [732.5, 250]);
});

it("geoPath.centroid(…) of a multipolygon with two polygons, one zero area", () => {
  assert.deepStrictEqual(testCentroid(equirectangular, {type: "MultiPolygon", coordinates: [
    [[[100, 0], [100, 1], [101, 1], [101, 0], [100, 0]]],
    [[[0, 0], [1, 0], [2, 0], [0, 0]]]
  ]}), [982.5, 247.5]);
});

it("geoPath.centroid(…) of a geometry collection with a single point", () => {
  assert.deepStrictEqual(testCentroid(equirectangular, {type: "GeometryCollection", geometries: [{type: "Point", coordinates: [0, 0]}]}), [480, 250]);
});

it("geoPath.centroid(…) of a geometry collection with a point and a linestring", () => {
  assert.deepStrictEqual(testCentroid(equirectangular, {type: "GeometryCollection", geometries: [
    {type: "LineString", coordinates: [[179, 0], [180, 0]]},
    {type: "Point", coordinates: [0, 0]}
  ]}), [1377.5, 250]);
});

it("geoPath.centroid(…) of a geometry collection with a point, linestring and polygon", () => {
  assert.deepStrictEqual(testCentroid(equirectangular, {type: "GeometryCollection", geometries: [
    {type: "Polygon", coordinates: [[[-180, 0], [-180, 1], [-179, 1], [-179, 0], [-180, 0]]]},
    {type: "LineString", coordinates: [[179, 0], [180, 0]]},
    {type: "Point", coordinates: [0, 0]}
  ]}), [-417.5, 247.5]);
});

it("geoPath.centroid(…) of a feature collection with a point", () => {
  assert.deepStrictEqual(testCentroid(equirectangular, {type: "FeatureCollection", features: [{type: "Feature", geometry: {type: "Point", coordinates: [0, 0]}}]}), [480, 250]);
});

it("geoPath.centroid(…) of a feature collection with a point and a line string", () => {
  assert.deepStrictEqual(testCentroid(equirectangular, {type: "FeatureCollection", features: [
    {type: "Feature", geometry: {type: "LineString", coordinates: [[179, 0], [180, 0]]}},
    {type: "Feature", geometry: {type: "Point", coordinates: [0, 0]}}
  ]}), [1377.5, 250]);
});

it("geoPath.centroid(…) of a feature collection with a point, line string and polygon", () => {
  assert.deepStrictEqual(testCentroid(equirectangular, {type: "FeatureCollection", features: [
    {type: "Feature", geometry: {type: "Polygon", coordinates: [[[-180, 0], [-180, 1], [-179, 1], [-179, 0], [-180, 0]]]}},
    {type: "Feature", geometry: {type: "LineString", coordinates: [[179, 0], [180, 0]]}},
    {type: "Feature", geometry: {type: "Point", coordinates: [0, 0]}}
  ]}), [-417.5, 247.5]);
});

it("geoPath.centroid(…) of a sphere", () => {
  assert.deepStrictEqual(testCentroid(equirectangular, {type: "Sphere"}), [480, 250]);
});
import assert from "assert";
import {geoAlbers, geoEquirectangular, geoPath} from "../../src/index.js";
import {testContext} from "./test-context.js";

const equirectangular = geoEquirectangular()
    .scale(900 / Math.PI)
    .precision(0);

function testPath(projection, object) {
  const context = testContext();

  geoPath()
      .projection(projection)
      .context(context) (object);

  return context.result();
}

it("geoPath.projection() defaults to null", () => {
  const path = geoPath();
  assert.strictEqual(path.projection(), null);
});

it("geoPath.context() defaults to null", () => {
  const path = geoPath();
  assert.strictEqual(path.context(), null);
});

it("geoPath(projection) sets the initial projection", () => {
  const projection = geoAlbers(), path = geoPath(projection);
  assert.strictEqual(path.projection(), projection);
});

it("geoPath(projection, context) sets the initial projection and context", () => {
  const context = testContext(), projection = geoAlbers(), path = geoPath(projection, context);
  assert.strictEqual(path.projection(), projection);
  assert.strictEqual(path.context(), context);
});

it("geoPath(Point) renders a point", () => {
  assert.deepStrictEqual(testPath(equirectangular, {
    type: "Point",
    coordinates: [-63, 18]
  }), [
    {type: "moveTo", x: 170, y: 160},
    {type: "arc", x: 165, y: 160, r: 4.5}
  ]);
});

it("geoPath(MultiPoint) renders a point", () => {
  assert.deepStrictEqual(testPath(equirectangular, {
    type: "MultiPoint",
    coordinates: [[-63, 18], [-62, 18], [-62, 17]]
  }), [
    {type: "moveTo", x: 170, y: 160}, {type: "arc", x: 165, y: 160, r: 4.5},
    {type: "moveTo", x: 175, y: 160}, {type: "arc", x: 170, y: 160, r: 4.5},
    {type: "moveTo", x: 175, y: 165}, {type: "arc", x: 170, y: 165, r: 4.5}
  ]);
});

it("geoPath(LineString) renders a line string", () => {
  assert.deepStrictEqual(testPath(equirectangular, {
    type: "LineString",
    coordinates: [[-63, 18], [-62, 18], [-62, 17]]
  }), [
    {type: "moveTo", x: 165, y: 160},
    {type: "lineTo", x: 170, y: 160},
    {type: "lineTo", x: 170, y: 165}
  ]);
});

it("geoPath(Polygon) renders a polygon", () => {
  assert.deepStrictEqual(testPath(equirectangular, {
    type: "Polygon",
    coordinates: [[[-63, 18], [-62, 18], [-62, 17], [-63, 18]]]
  }), [
    {type: "moveTo", x: 165, y: 160},
    {type: "lineTo", x: 170, y: 160},
    {type: "lineTo", x: 170, y: 165},
    {type: "closePath"}
  ]);
});

it("geoPath(GeometryCollection) renders a geometry collection", () => {
  assert.deepStrictEqual(testPath(equirectangular, {
    type: "GeometryCollection",
    geometries: [{
      type: "Polygon",
      coordinates: [[[-63, 18], [-62, 18], [-62, 17], [-63, 18]]]
    }]
  }), [
    {type: "moveTo", x: 165, y: 160},
    {type: "lineTo", x: 170, y: 160},
    {type: "lineTo", x: 170, y: 165},
    {type: "closePath"}
  ]);
});

it("geoPath(Feature) renders a feature", () => {
  assert.deepStrictEqual(testPath(equirectangular, {
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [[[-63, 18], [-62, 18], [-62, 17], [-63, 18]]]
    }
  }), [
    {type: "moveTo", x: 165, y: 160},
    {type: "lineTo", x: 170, y: 160},
    {type: "lineTo", x: 170, y: 165},
    {type: "closePath"}
  ]);
});

it("geoPath(FeatureCollection) renders a feature collection", () => {
  assert.deepStrictEqual(testPath(equirectangular, {
    type: "FeatureCollection",
    features: [{
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [[[-63, 18], [-62, 18], [-62, 17], [-63, 18]]]
      }
    }]
  }), [
    {type: "moveTo", x: 165, y: 160},
    {type: "lineTo", x: 170, y: 160},
    {type: "lineTo", x: 170, y: 165},
    {type: "closePath"}
  ]);
});

it("geoPath(…) wraps longitudes outside of ±180°", () => {
  assert.deepStrictEqual(testPath(equirectangular, {
    type: "Point",
    coordinates: [180 + 1e-6, 0]
  }), [
    {type: "moveTo", x: -415, y: 250},
    {type: "arc", x: -420, y: 250, r: 4.5}
  ]);
});

it("geoPath(…) observes the correct winding order of a tiny polygon", () => {
  assert.deepStrictEqual(testPath(equirectangular, {
    type: "Polygon",
    coordinates: [[
      [-0.06904102953339501, 0.346043661846373],
      [-6.725674252975136e-15, 0.3981303360336475],
      [-6.742247658534323e-15, -0.08812465346531581],
      [-0.17301258217724075, -0.12278150669440671],
      [-0.06904102953339501, 0.346043661846373]
    ]]
  }), [
    {type: "moveTo", x: 480, y: 248},
    {type: "lineTo", x: 480, y: 248},
    {type: "lineTo", x: 480, y: 250},
    {type: "lineTo", x: 479, y: 251},
    {type: "closePath"}
  ]);
});

it("geoPath.projection(null)(…) does not transform coordinates", () => {
  assert.deepStrictEqual(testPath(null, {
    type: "Polygon",
    coordinates: [[[-63, 18], [-62, 18], [-62, 17], [-63, 18]]]
  }), [
    {type: "moveTo", x: -63, y: 18},
    {type: "lineTo", x: -62, y: 18},
    {type: "lineTo", x: -62, y: 17},
    {type: "closePath"}
  ]);
});

it("geoPath.context(null)(null) returns null", () => {
  const path = geoPath();
  assert.strictEqual(path(), null);
  assert.strictEqual(path(null), null);
  assert.strictEqual(path(undefined), null);
});

it("geoPath.context(null)(Unknown) returns null", () => {
  const path = geoPath();
  assert.strictEqual(path({type: "Unknown"}), null);
  assert.strictEqual(path({type: "__proto__"}), null);
});

it("geoPath(LineString) then geoPath(Point) does not treat the point as part of a line", () => {
  const context = testContext(), path = geoPath().projection(equirectangular).context(context);
  path({
    type: "LineString",
    coordinates: [[-63, 18], [-62, 18], [-62, 17]]
  });
  assert.deepStrictEqual(context.result(), [
    {type: "moveTo", x: 165, y: 160},
    {type: "lineTo", x: 170, y: 160},
    {type: "lineTo", x: 170, y: 165}
  ]);
  path({
    type: "Point",
    coordinates: [-63, 18]
  });
  assert.deepStrictEqual(context.result(), [
    {type: "moveTo", x: 170, y: 160},
    {type: "arc", x: 165, y: 160, r: 4.5}
  ]);
});
import assert from "assert";
import {geoPath} from "../../src/index.js";

it("geoPath.measure(…) of a Point", () => {
  assert.strictEqual(geoPath().measure({
    type: "Point",
    coordinates: [0, 0]
  }), 0);
});

it("geoPath.measure(…) of a MultiPoint", () => {
  assert.strictEqual(geoPath().measure({
    type: "Point",
    coordinates: [[0, 0], [0, 1], [1, 1], [1, 0]]
  }), 0);
});

it("geoPath.measure(…) of a LineString", () => {
  assert.strictEqual(geoPath().measure({
    type: "LineString",
    coordinates: [[0, 0], [0, 1], [1, 1], [1, 0]]
  }), 3);
});

it("geoPath.measure(…) of a MultiLineString", () => {
  assert.strictEqual(geoPath().measure({
    type: "MultiLineString",
    coordinates: [[[0, 0], [0, 1], [1, 1], [1, 0]]]
  }), 3);
});

it("geoPath.measure(…) of a Polygon", () => {
  assert.strictEqual(geoPath().measure({
    type: "Polygon",
    coordinates: [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]]
  }), 4);
});

it("geoPath.measure(…) of a Polygon with a hole", () => {
  assert.strictEqual(geoPath().measure({
    type: "Polygon",
    coordinates: [[[-1, -1], [-1, 2], [2, 2], [2, -1], [-1, -1]], [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]
  }), 16);
});

it("geoPath.measure(…) of a MultiPolygon", () => {
  assert.strictEqual(geoPath().measure({
    type: "MultiPolygon",
    coordinates: [[[[-1, -1], [-1, 2], [2, 2], [2, -1], [-1, -1]]], [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]]]
  }), 16);
});
import {geoEquirectangular, geoPath} from "../../src/index.js";
import {assertPathEqual} from "../asserts.js";

const equirectangular = geoEquirectangular()
    .scale(900 / Math.PI)
    .precision(0);

function testPath(projection, object) {
  return geoPath()
      .projection(projection) (object);
}

it("geoPath(Point) renders a point", () => {
  assertPathEqual(testPath(equirectangular, {
    type: "Point",
    coordinates: [-63, 18]
  }), "M165,160m0,4.500000a4.500000,4.500000 0 1,1 0,-9a4.500000,4.500000 0 1,1 0,9z");
});

it("geoPath.pointRadius(radius)(Point) renders a point of the given radius", () => {
  assertPathEqual(geoPath()
      .projection(equirectangular)
      .pointRadius(10)({
    type: "Point",
    coordinates: [-63, 18]
  }), "M165,160m0,10a10,10 0 1,1 0,-20a10,10 0 1,1 0,20z");
});

it("geoPath(MultiPoint) renders a point", () => {
  assertPathEqual(testPath(equirectangular, {
    type: "MultiPoint",
    coordinates: [[-63, 18], [-62, 18], [-62, 17]]
  }), "M165,160m0,4.500000a4.500000,4.500000 0 1,1 0,-9a4.500000,4.500000 0 1,1 0,9zM170,160m0,4.500000a4.500000,4.500000 0 1,1 0,-9a4.500000,4.500000 0 1,1 0,9zM170,165m0,4.500000a4.500000,4.500000 0 1,1 0,-9a4.500000,4.500000 0 1,1 0,9z");
});

it("geoPath(LineString) renders a line string", () => {
  assertPathEqual(testPath(equirectangular, {
    type: "LineString",
    coordinates: [[-63, 18], [-62, 18], [-62, 17]]
  }), "M165,160L170,160L170,165");
});

it("geoPath(Polygon) renders a polygon", () => {
  assertPathEqual(testPath(equirectangular, {
    type: "Polygon",
    coordinates: [[[-63, 18], [-62, 18], [-62, 17], [-63, 18]]]
  }), "M165,160L170,160L170,165Z");
});

it("geoPath(GeometryCollection) renders a geometry collection", () => {
  assertPathEqual(testPath(equirectangular, {
    type: "GeometryCollection",
    geometries: [{
      type: "Polygon",
      coordinates: [[[-63, 18], [-62, 18], [-62, 17], [-63, 18]]]
    }]
  }), "M165,160L170,160L170,165Z");
});

it("geoPath(Feature) renders a feature", () => {
  assertPathEqual(testPath(equirectangular, {
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [[[-63, 18], [-62, 18], [-62, 17], [-63, 18]]]
    }
  }), "M165,160L170,160L170,165Z");
});

it("geoPath(FeatureCollection) renders a feature collection", () => {
  assertPathEqual(testPath(equirectangular, {
    type: "FeatureCollection",
    features: [{
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [[[-63, 18], [-62, 18], [-62, 17], [-63, 18]]]
      }
    }]
  }), "M165,160L170,160L170,165Z");
});

it("geoPath(LineString) then geoPath(Point) does not treat the point as part of a line", () => {
  const path = geoPath().projection(equirectangular);
  assertPathEqual(path({
    type: "LineString",
    coordinates: [[-63, 18], [-62, 18], [-62, 17]]
  }), "M165,160L170,160L170,165");
  assertPathEqual(path({
    type: "Point",
    coordinates: [-63, 18]
  }), "M165,160m0,4.500000a4.500000,4.500000 0 1,1 0,-9a4.500000,4.500000 0 1,1 0,9z");
});
export function testContext() {
  let buffer = [];
  return {
    arc(x, y, r) { buffer.push({type: "arc", x: Math.round(x), y: Math.round(y), r: r}); },
    moveTo(x, y) { buffer.push({type: "moveTo", x: Math.round(x), y: Math.round(y)}); },
    lineTo(x, y) { buffer.push({type: "lineTo", x: Math.round(x), y: Math.round(y)}); },
    closePath() { buffer.push({type: "closePath"}); },
    result() { let result = buffer; buffer = []; return result; }
  };
}
