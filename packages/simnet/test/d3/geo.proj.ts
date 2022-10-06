import assert from "assert"
import { geoAlbersUsa } from "../../src/index.js"
import { assertProjectionEqual } from "./asserts.js"

it("albersUsa(point) and albersUsa.invert(point) returns the expected result", () => {
  const albersUsa = geoAlbersUsa()
  assertProjectionEqual(albersUsa, [-122.4194, 37.7749], [107.4, 214.1], 0.1) // San Francisco, CA
  assertProjectionEqual(albersUsa, [-74.0059, 40.7128], [794.6, 176.5], 0.1) // New York, NY
  assertProjectionEqual(albersUsa, [-95.9928, 36.154], [488.8, 298.0], 0.1) // Tulsa, OK
  assertProjectionEqual(albersUsa, [-149.9003, 61.2181], [171.2, 446.9], 0.1) // Anchorage, AK
  assertProjectionEqual(albersUsa, [-157.8583, 21.3069], [298.5, 451.0], 0.1) // Honolulu, HI
  assert.strictEqual(albersUsa([2.3522, 48.8566]), null) // Paris, France
})
import assert from "assert"
import { geoGnomonic, geoIdentity } from "../../src/index.js"
import { assertInDelta } from "../asserts.js"
import { assertProjectionEqual } from "./asserts.js"

it("projection.angle(…) defaults to zero", () => {
  const projection = geoGnomonic().scale(1).translate([0, 0])
  assert.strictEqual(projection.angle(), 0)
  assertProjectionEqual(projection, [0, 0], [0, 0])
  assertProjectionEqual(projection, [10, 0], [0.17632698070846498, 0])
  assertProjectionEqual(projection, [-10, 0], [-0.17632698070846498, 0])
  assertProjectionEqual(projection, [0, 10], [0, -0.17632698070846498])
  assertProjectionEqual(projection, [0, -10], [0, 0.17632698070846498])
  assertProjectionEqual(projection, [10, 10], [0.17632698070846495, -0.17904710860483972])
  assertProjectionEqual(projection, [10, -10], [0.17632698070846495, 0.17904710860483972])
  assertProjectionEqual(projection, [-10, 10], [-0.17632698070846495, -0.17904710860483972])
  assertProjectionEqual(projection, [-10, -10], [-0.17632698070846495, 0.17904710860483972])
})

it("projection.angle(…) rotates by the specified degrees after projecting", () => {
  const projection = geoGnomonic().scale(1).translate([0, 0]).angle(30)
  assertInDelta(projection.angle(), 30)
  assertProjectionEqual(projection, [0, 0], [0, 0])
  assertProjectionEqual(projection, [10, 0], [0.1527036446661393, -0.08816349035423247])
  assertProjectionEqual(projection, [-10, 0], [-0.1527036446661393, 0.08816349035423247])
  assertProjectionEqual(projection, [0, 10], [-0.08816349035423247, -0.1527036446661393])
  assertProjectionEqual(projection, [0, -10], [0.08816349035423247, 0.1527036446661393])
  assertProjectionEqual(projection, [10, 10], [0.06318009036371944, -0.24322283488017502])
  assertProjectionEqual(projection, [10, -10], [0.24222719896855913, 0.0668958541717101])
  assertProjectionEqual(projection, [-10, 10], [-0.24222719896855913, -0.0668958541717101])
  assertProjectionEqual(projection, [-10, -10], [-0.06318009036371944, 0.24322283488017502])
})

it("projection.angle(…) rotates by the specified degrees after projecting", () => {
  const projection = geoGnomonic().scale(1).translate([0, 0]).angle(-30)
  assertInDelta(projection.angle(), -30)
  assertProjectionEqual(projection, [0, 0], [0, 0])
  assertProjectionEqual(projection, [10, 0], [0.1527036446661393, 0.08816349035423247])
  assertProjectionEqual(projection, [-10, 0], [-0.1527036446661393, -0.08816349035423247])
  assertProjectionEqual(projection, [0, 10], [0.08816349035423247, -0.1527036446661393])
  assertProjectionEqual(projection, [0, -10], [-0.08816349035423247, 0.1527036446661393])
  assertProjectionEqual(projection, [10, 10], [0.24222719896855913, -0.0668958541717101])
  assertProjectionEqual(projection, [10, -10], [0.06318009036371944, 0.24322283488017502])
  assertProjectionEqual(projection, [-10, 10], [-0.06318009036371944, -0.24322283488017502])
  assertProjectionEqual(projection, [-10, -10], [-0.24222719896855913, 0.0668958541717101])
})

it("projection.angle(…) wraps around 360°", () => {
  const projection = geoGnomonic().scale(1).translate([0, 0]).angle(360)
  assert.strictEqual(projection.angle(), 0)
})

it("identity.angle(…) rotates geoIdentity", () => {
  const projection = geoIdentity().angle(-45),
    SQRT2_2 = Math.sqrt(2) / 2
  assertInDelta(projection.angle(), -45)
  assertProjectionEqual(projection, [0, 0], [0, 0])
  assertProjectionEqual(projection, [1, 0], [SQRT2_2, SQRT2_2])
  assertProjectionEqual(projection, [-1, 0], [-SQRT2_2, -SQRT2_2])
  assertProjectionEqual(projection, [0, 1], [-SQRT2_2, SQRT2_2])
})
import assert from "assert"

export function assertProjectionEqual(projection, location, point, delta) {
  assert(
    planarEqual(projection(location), point, delta || 1e-6) &&
      sphericalEqual(projection.invert(point), location, delta || 1e-3),
    `${[projection.invert(point), projection(location)]} should be projected equivalents; expected: ${[
      location,
      point,
    ]}`
  )
}

function planarEqual(actual, expected, delta) {
  return (
    Array.isArray(actual) &&
    actual.length === 2 &&
    inDelta(actual[0], expected[0], delta) &&
    inDelta(actual[1], expected[1], delta)
  )
}

function sphericalEqual(actual, expected, delta) {
  return (
    Array.isArray(actual) &&
    actual.length === 2 &&
    longitudeEqual(actual[0], expected[0], delta) &&
    inDelta(actual[1], expected[1], delta)
  )
}

function longitudeEqual(actual, expected, delta) {
  actual = Math.abs(actual - expected) % 360
  return actual <= delta || actual >= 360 - delta
}

function inDelta(actual, expected, delta) {
  return Math.abs(actual - expected) <= delta
}
import assert from "assert"
import { geoAzimuthalEqualArea, geoAzimuthalEquidistant } from "../../src/index.js"

it("azimuthal projections don't crash on the antipode", () => {
  for (const p of [
    geoAzimuthalEqualArea()([180, 0]),
    geoAzimuthalEqualArea()([-180, 0]),
    geoAzimuthalEquidistant()([180, 0]),
  ]) {
    assert(Math.abs(p[0]) < Infinity)
    assert(Math.abs(p[1]) < Infinity)
  }
})
import assert from "assert"
import { geoAzimuthalEqualArea, geoPath } from "../../src/index.js"

it("projection.clipAngle() deals with degenerate polygons", () => {
  const polygon = {
    type: "Polygon",
    coordinates: [
      [
        [-120, -30],
        [0, -30],
        [0, -90],
        [0, -30],
        [120, -30],
        [-120, -30],
      ],
    ],
  }
  const projection = geoAzimuthalEqualArea().translate([0.5, 0.5]).rotate([0, -90, 0]).clipAngle(170)
  assert.strictEqual(
    geoPath(projection)(polygon).replace(/\.\d+/g, ""),
    "M0,249L0,238L0,216L21,219L45,219L71,215L98,207L127,193L141,184L155,173L168,161L181,148L192,133L202,117L211,100L218,83L224,65L228,48L230,30L231,13L229,-17L222,-45L212,-70L200,-90L187,-107L179,-127L167,-147L151,-168L130,-188L104,-206L89,-213L73,-220L55,-225L37,-229L19,-232L0,-233L-18,-232L-36,-229L-54,-225L-72,-220L-88,-213L-103,-206L-129,-188L-150,-168L-166,-147L-178,-127L-186,-107L-186,-107L-199,-90L-211,-70L-221,-45L-228,-17L-230,13L-229,30L-227,48L-223,65L-217,83L-210,100L-201,117L-191,133L-180,148L-167,161L-154,173L-140,184L-126,193L-97,207L-70,215L-44,219L-20,219L0,216L0,238L0,249L0,249L-25,247L-51,243L-76,236L-100,227L-123,215L-145,201L-165,185L-184,166L-200,146L-214,124L-226,101L-235,77L-242,52L-246,26L-248,0L-246,-25L-242,-51L-235,-76L-226,-100L-214,-123L-200,-145L-184,-165L-165,-184L-145,-200L-123,-214L-100,-226L-76,-235L-51,-242L-25,-246L0,-248L26,-246L52,-242L77,-235L101,-226L124,-214L146,-200L166,-184L185,-165L201,-145L215,-123L227,-100L236,-76L243,-51L247,-25L249,0L247,26L243,52L236,77L227,101L215,124L201,146L185,166L166,185L146,201L124,215L101,227L77,236L52,243L26,247Z"
  )
})
import { geoEquirectangular } from "../../src/index.js"
import { assertProjectionEqual } from "./asserts.js"

const pi = Math.PI

it("equirectangular(point) returns the expected result", () => {
  const equirectangular = geoEquirectangular().translate([0, 0]).scale(1)
  assertProjectionEqual(equirectangular, [0, 0], [0, 0])
  assertProjectionEqual(equirectangular, [-180, 0], [-pi, 0])
  assertProjectionEqual(equirectangular, [180, 0], [pi, 0])
  assertProjectionEqual(equirectangular, [0, 30], [0, -pi / 6])
  assertProjectionEqual(equirectangular, [0, -30], [0, pi / 6])
  assertProjectionEqual(equirectangular, [30, 30], [pi / 6, -pi / 6])
  assertProjectionEqual(equirectangular, [30, -30], [pi / 6, pi / 6])
  assertProjectionEqual(equirectangular, [-30, 30], [-pi / 6, -pi / 6])
  assertProjectionEqual(equirectangular, [-30, -30], [-pi / 6, pi / 6])
})

it("equirectangular.rotate([30, 0])(point) returns the expected result", () => {
  const equirectangular = geoEquirectangular().rotate([30, 0]).translate([0, 0]).scale(1)
  assertProjectionEqual(equirectangular, [0, 0], [pi / 6, 0])
  assertProjectionEqual(equirectangular, [-180, 0], [(-5 / 6) * pi, 0])
  assertProjectionEqual(equirectangular, [180, 0], [(-5 / 6) * pi, 0])
  assertProjectionEqual(equirectangular, [0, 30], [pi / 6, -pi / 6])
  assertProjectionEqual(equirectangular, [0, -30], [pi / 6, pi / 6])
  assertProjectionEqual(equirectangular, [30, 30], [pi / 3, -pi / 6])
  assertProjectionEqual(equirectangular, [30, -30], [pi / 3, pi / 6])
  assertProjectionEqual(equirectangular, [-30, 30], [0, -pi / 6])
  assertProjectionEqual(equirectangular, [-30, -30], [0, pi / 6])
})

it("equirectangular.rotate([30, 30])(point) returns the expected result", () => {
  const equirectangular = geoEquirectangular().rotate([30, 30]).translate([0, 0]).scale(1)
  assertProjectionEqual(equirectangular, [0, 0], [0.5880026035475674, -0.44783239692893245])
  assertProjectionEqual(equirectangular, [-180, 0], [-2.5535900500422257, 0.44783239692893245])
  assertProjectionEqual(equirectangular, [180, 0], [-2.5535900500422257, 0.44783239692893245])
  assertProjectionEqual(equirectangular, [0, 30], [0.825607556164348, -0.9407711951705208])
  assertProjectionEqual(equirectangular, [0, -30], [0.4486429615608479, 0.05804529130778048])
  assertProjectionEqual(equirectangular, [30, 30], [1.4056476493802694, -0.7069517278872177])
  assertProjectionEqual(equirectangular, [30, -30], [0.8760580505981933, 0.21823451436745955])
  assertProjectionEqual(equirectangular, [-30, 30], [0.0, -1.0471975511965976])
  assertProjectionEqual(equirectangular, [-30, -30], [0.0, 0.0])
})

it("equirectangular.rotate([0, 0, 30])(point) returns the expected result", () => {
  const equirectangular = geoEquirectangular().rotate([0, 0, 30]).translate([0, 0]).scale(1)
  assertProjectionEqual(equirectangular, [0, 0], [0, 0])
  assertProjectionEqual(equirectangular, [-180, 0], [-pi, 0])
  assertProjectionEqual(equirectangular, [180, 0], [pi, 0])
  assertProjectionEqual(equirectangular, [0, 30], [-0.2810349015028135, -0.44783239692893245])
  assertProjectionEqual(equirectangular, [0, -30], [0.2810349015028135, 0.44783239692893245])
  assertProjectionEqual(equirectangular, [30, 30], [0.1651486774146268, -0.7069517278872176])
  assertProjectionEqual(equirectangular, [30, -30], [0.6947382761967031, 0.21823451436745964])
  assertProjectionEqual(equirectangular, [-30, 30], [-0.6947382761967031, -0.21823451436745964])
  assertProjectionEqual(equirectangular, [-30, -30], [-0.1651486774146268, 0.7069517278872176])
})

it("equirectangular.rotate([30, 30, 30])(point) returns the expected result", () => {
  const equirectangular = geoEquirectangular().rotate([30, 30, 30]).translate([0, 0]).scale(1)
  assertProjectionEqual(equirectangular, [0, 0], [0.2810349015028135, -0.6751315329370317])
  assertProjectionEqual(equirectangular, [-180, 0], [-2.86055775208698, 0.6751315329370317])
  assertProjectionEqual(equirectangular, [180, 0], [-2.86055775208698, 0.6751315329370317])
  assertProjectionEqual(equirectangular, [0, 30], [-0.0724760059270816, -1.1586567708659772])
  assertProjectionEqual(equirectangular, [0, -30], [0.4221351552567053, -0.16704161863132252])
  assertProjectionEqual(equirectangular, [30, 30], [1.2033744221750944, -1.2153751251046732])
  assertProjectionEqual(equirectangular, [30, -30], [0.8811235701944905, -0.1886163861754041])
  assertProjectionEqual(equirectangular, [-30, 30], [-0.7137243789447654, -0.848062078981481])
  assertProjectionEqual(equirectangular, [-30, -30], [0, 0])
})
import assert from "assert"
import { readFileSync } from "fs"
import { feature } from "topojson-client"
import {
  geoAlbersUsa,
  geoAzimuthalEqualArea,
  geoAzimuthalEquidistant,
  geoConicConformal,
  geoConicEqualArea,
  geoConicEquidistant,
  geoEquirectangular,
  geoGnomonic,
  geoMercator,
  geoOrthographic,
  geoProjection,
  geoStereographic,
  geoTransverseMercator,
} from "../../src/index.js"
import { assertInDelta } from "../asserts.js"

const usTopo = JSON.parse(readFileSync("./test/data/us-10m.json"))
const us = feature(usTopo, usTopo.objects.land)
const worldTopo = JSON.parse(readFileSync("node_modules/world-atlas/world/50m.json"))
const world = feature(worldTopo, worldTopo.objects.land)

it("projection.fitExtent(…) sphere equirectangular", () => {
  const projection = geoEquirectangular()
  projection.fitExtent(
    [
      [50, 50],
      [950, 950],
    ],
    { type: "Sphere" }
  )
  assertInDelta(projection.scale(), 900 / (2 * Math.PI), 1e-6)
  assertInDelta(projection.translate(), [500, 500], 1e-6)
})

it("projection.fitExtent(…) world equirectangular", () => {
  const projection = geoEquirectangular()
  projection.fitExtent(
    [
      [50, 50],
      [950, 950],
    ],
    world
  )
  assertInDelta(projection.scale(), 143.239449, 1e-6)
  assertInDelta(projection.translate(), [500, 492.000762], 1e-6)
})

it("projection.fitExtent(…) world azimuthalEqualArea", () => {
  const projection = geoAzimuthalEqualArea()
  projection.fitExtent(
    [
      [50, 50],
      [950, 950],
    ],
    world
  )
  assertInDelta(projection.scale(), 228.357229, 1e-6)
  assertInDelta(projection.translate(), [496.353618, 479.684353], 1e-6)
})

it("projection.fitExtent(…) world azimuthalEquidistant", () => {
  const projection = geoAzimuthalEquidistant()
  projection.fitExtent(
    [
      [50, 50],
      [950, 950],
    ],
    world
  )
  assertInDelta(projection.scale(), 153.559317, 1e-6)
  assertInDelta(projection.translate(), [485.272493, 452.093375], 1e-6)
})

it("projection.fitExtent(…) world conicConformal", () => {
  const projection = geoConicConformal().clipAngle(30).parallels([30, 60]).rotate([0, -45])
  projection.fitExtent(
    [
      [50, 50],
      [950, 950],
    ],
    world
  )
  assertInDelta(projection.scale(), 626.111027, 1e-6)
  assertInDelta(projection.translate(), [444.395951, 410.223799], 1e-6)
})

it("projection.fitExtent(…) world conicEqualArea", () => {
  const projection = geoConicEqualArea()
  projection.fitExtent(
    [
      [50, 50],
      [950, 950],
    ],
    world
  )
  assertInDelta(projection.scale(), 145.862346, 1e-6)
  assertInDelta(projection.translate(), [500, 498.0114265], 1e-6)
})

it("projection.fitExtent(…) world conicEquidistant", () => {
  const projection = geoConicEquidistant()
  projection.fitExtent(
    [
      [50, 50],
      [950, 950],
    ],
    world
  )
  assertInDelta(projection.scale(), 123.085587, 1e-6)
  assertInDelta(projection.translate(), [500, 498.598401], 1e-6)
})

it("projection.fitSize(…) world equirectangular", () => {
  const projection = geoEquirectangular()
  projection.fitSize([900, 900], world)
  assertInDelta(projection.scale(), 143.239449, 1e-6)
  assertInDelta(projection.translate(), [450, 442.000762], 1e-6)
})

it("projection.fitExtent(…) world gnomonic", () => {
  const projection = geoGnomonic().clipAngle(45)
  projection.fitExtent(
    [
      [50, 50],
      [950, 950],
    ],
    world
  )
  assertInDelta(projection.scale(), 450.348233, 1e-6)
  assertInDelta(projection.translate(), [500.115138, 556.52262], 1e-6)
})

it("projection.fitExtent(…) world mercator", () => {
  const projection = geoMercator()
  projection.fitExtent(
    [
      [50, 50],
      [950, 950],
    ],
    world
  )
  assertInDelta(projection.scale(), 143.239449, 1e-6)
  assertInDelta(projection.translate(), [500, 481.549457], 1e-6)
})

it("projection.fitExtent(…) world orthographic", () => {
  const projection = geoOrthographic()
  projection.fitExtent(
    [
      [50, 50],
      [950, 950],
    ],
    world
  )
  assertInDelta(projection.scale(), 451.406773, 1e-6)
  assertInDelta(projection.translate(), [503.769179, 498.593227], 1e-6)
})

it("projection.fitSize(…) world orthographic", () => {
  const projection = geoOrthographic()
  projection.fitSize([900, 900], world)
  assertInDelta(projection.scale(), 451.406773, 1e-6)
  assertInDelta(projection.translate(), [453.769179, 448.593227], 1e-6)
})

it("projection.fitExtent(…) world stereographic", () => {
  const projection = geoStereographic()
  projection.fitExtent(
    [
      [50, 50],
      [950, 950],
    ],
    world
  )
  assertInDelta(projection.scale(), 162.934379, 1e-6)
  assertInDelta(projection.translate(), [478.546293, 432.922534], 1e-6)
})

it("projection.fitExtent(…) world transverseMercator", () => {
  const projection = geoTransverseMercator()
  projection.fitExtent(
    [
      [50, 50],
      [950, 950],
    ],
    world
  )
  assertInDelta(projection.scale(), 143.239449, 1e-6)
  assertInDelta(projection.translate(), [473.829551, 500], 1e-6)
})

it("projection.fitExtent(…) USA albersUsa", () => {
  const projection = geoAlbersUsa()
  projection.fitExtent(
    [
      [50, 50],
      [950, 950],
    ],
    us
  )
  assertInDelta(projection.scale(), 1152.889035, 1e-6)
  assertInDelta(projection.translate(), [533.52541, 496.232028], 1e-6)
})

it("projection.fitExtent(…) null geometries - Feature", () => {
  const projection = geoEquirectangular()
  projection.fitExtent(
    [
      [50, 50],
      [950, 950],
    ],
    { type: "Feature", geometry: null }
  )
  const s = projection.scale(),
    t = projection.translate()
  assert(!s)
  assert(isNaN(t[0]))
  assert(isNaN(t[1]))
})

it("projection.fitExtent(…) null geometries - MultiPoint", () => {
  const projection = geoEquirectangular()
  projection.fitExtent(
    [
      [50, 50],
      [950, 950],
    ],
    { type: "MultiPoint", coordinates: [] }
  )
  const s = projection.scale(),
    t = projection.translate()
  assert(!s)
  assert(isNaN(t[0]))
  assert(isNaN(t[1]))
})

it("projection.fitExtent(…) null geometries - MultiLineString", () => {
  const projection = geoEquirectangular()
  projection.fitExtent(
    [
      [50, 50],
      [950, 950],
    ],
    { type: "MultiLineString", coordinates: [] }
  )
  const s = projection.scale(),
    t = projection.translate()
  assert(!s)
  assert(isNaN(t[0]))
  assert(isNaN(t[1]))
})

it("projection.fitExtent(…) null geometries - MultiPolygon", () => {
  const projection = geoEquirectangular()
  projection.fitExtent(
    [
      [50, 50],
      [950, 950],
    ],
    { type: "MultiPolygon", coordinates: [] }
  )
  const s = projection.scale(),
    t = projection.translate()
  assert(!s)
  assert(isNaN(t[0]))
  assert(isNaN(t[1]))
})

it("projection.fitExtent(…) custom projection", () => {
  const projection = geoProjection(function (x, y) {
    return [x, Math.pow(y, 3)]
  })
  projection.fitExtent(
    [
      [50, 50],
      [950, 950],
    ],
    world
  )
  assertInDelta(projection.scale(), 128.903525, 1e-6)
  assertInDelta(projection.translate(), [500, 450.414357], 1e-6)
})

it("projection.fitSize(…) ignore clipExtent - world equirectangular", () => {
  const p1 = geoEquirectangular().fitSize([1000, 1000], world)
  const s1 = p1.scale()
  const t1 = p1.translate()
  const c1 = p1.clipExtent()
  const p2 = geoEquirectangular()
    .clipExtent([
      [100, 200],
      [700, 600],
    ])
    .fitSize([1000, 1000], world)
  const s2 = p2.scale()
  const t2 = p2.translate()
  const c2 = p2.clipExtent()
  assertInDelta(s1, s2, 1e-6)
  assertInDelta(t1, t2, 1e-6)
  assert.strictEqual(c1, null)
  assert.deepStrictEqual(c2, [
    [100, 200],
    [700, 600],
  ])
})

it("projection.fitExtent(…) chaining - world transverseMercator", () => {
  const projection = geoTransverseMercator()
    .fitExtent(
      [
        [50, 50],
        [950, 950],
      ],
      world
    )
    .scale(500)
  assert.strictEqual(projection.scale(), 500)
  assertInDelta(projection.translate(), [473.829551, 500], 1e-6)
})

it("projection.fitSize(…) resampling - world mercator", () => {
  const box = {
    type: "Polygon",
    coordinates: [
      [
        [-135, 45],
        [-45, 45],
        [-45, -45],
        [-135, -45],
        [-135, 45],
      ],
    ],
  }
  const p1 = geoMercator().precision(0.1).fitSize([1000, 1000], box)
  const p2 = geoMercator().precision(0).fitSize([1000, 1000], box)
  const t1 = p1.translate()
  const t2 = p2.translate()
  assert.strictEqual(p1.precision(), 0.1)
  assert.strictEqual(p2.precision(), 0)
  assertInDelta(p1.scale(), 436.218018, 1e-6)
  assertInDelta(p2.scale(), 567.296328, 1e-6)
  assertInDelta(t1[0], 1185.209661, 1e-6)
  assertInDelta(t2[0], 1391.106989, 1e-6)
  assertInDelta(t1[1], 500, 1e-6)
  assertInDelta(t1[1], t2[1], 1e-6)
})

it("projection.fitWidth(…) world equirectangular", () => {
  const projection = geoEquirectangular()
  projection.fitWidth(900, world)
  assertInDelta(projection.scale(), 143.239449, 1e-6)
  assertInDelta(projection.translate(), [450, 208.999023], 1e-6)
})

it("projection.fitWidth(…) world transverseMercator", () => {
  const projection = geoTransverseMercator()
  projection.fitWidth(900, world)
  assertInDelta(projection.scale(), 166.239257, 1e-6)
  assertInDelta(projection.translate(), [419.62739, 522.256029], 1e-6)
})

it("projection.fitWidth(…) USA albersUsa", () => {
  const projection = geoAlbersUsa()
  projection.fitWidth(900, us)
  assertInDelta(projection.scale(), 1152.889035, 1e-6)
  assertInDelta(projection.translate(), [483.52541, 257.736905], 1e-6)
})

it("projection.fitHeight(…) world equirectangular", () => {
  const projection = geoEquirectangular()
  projection.fitHeight(900, world)
  assertInDelta(projection.scale(), 297.042711, 1e-6)
  assertInDelta(projection.translate(), [933.187199, 433.411585], 1e-6)
})

it("projection.fitHeight(…) world transverseMercator", () => {
  const projection = geoTransverseMercator()
  projection.fitHeight(900, world)
  assertInDelta(projection.scale(), 143.239449, 1e-6)
  assertInDelta(projection.translate(), [361.570408, 450], 1e-6)
})

it("projection.fitHeight(…) USA albersUsa", () => {
  const projection = geoAlbersUsa()
  projection.fitHeight(900, us)
  assertInDelta(projection.scale(), 1983.902059, 1e-6)
  assertInDelta(projection.translate(), [832.054974, 443.516038], 1e-6)
})
import assert from "assert"
import { geoIdentity, geoPath } from "../../src/index.js"
import { assertProjectionEqual } from "./asserts.js"

it("identity(point) returns the point", () => {
  const identity = geoIdentity().translate([0, 0]).scale(1)
  assertProjectionEqual(identity, [0, 0], [0, 0])
  assertProjectionEqual(identity, [-180, 0], [-180, 0])
  assertProjectionEqual(identity, [180, 0], [180, 0])
  assertProjectionEqual(identity, [30, 30], [30, 30])
})

it("identity(point).scale(…).translate(…) returns the transformed point", () => {
  const identity = geoIdentity().translate([100, 10]).scale(2)
  assertProjectionEqual(identity, [0, 0], [100, 10])
  assertProjectionEqual(identity, [-180, 0], [-260, 10])
  assertProjectionEqual(identity, [180, 0], [460, 10])
  assertProjectionEqual(identity, [30, 30], [160, 70])
})

it("identity(point).reflectX(…) and reflectY() return the transformed point", () => {
  const identity = geoIdentity().translate([100, 10]).scale(2).reflectX(false).reflectY(false)
  assertProjectionEqual(identity, [3, 7], [106, 24])
  assertProjectionEqual(identity.reflectX(true), [3, 7], [94, 24])
  assertProjectionEqual(identity.reflectY(true), [3, 7], [94, -4])
  assertProjectionEqual(identity.reflectX(false), [3, 7], [106, -4])
  assertProjectionEqual(identity.reflectY(false), [3, 7], [106, 24])
})

it("geoPath(identity) returns the path", () => {
  const identity = geoIdentity().translate([0, 0]).scale(1),
    path = geoPath().projection(identity)
  assert.strictEqual(
    path({
      type: "LineString",
      coordinates: [
        [0, 0],
        [10, 10],
      ],
    }),
    "M0,0L10,10"
  )
  identity.translate([30, 90]).scale(2).reflectY(true)
  assert.strictEqual(
    path({
      type: "LineString",
      coordinates: [
        [0, 0],
        [10, 10],
      ],
    }),
    "M30,90L50,70"
  )
})

it("geoPath(identity) respects clipExtent", () => {
  const identity = geoIdentity().translate([0, 0]).scale(1),
    path = geoPath().projection(identity)
  identity.clipExtent([
    [5, 5],
    [40, 80],
  ])
  assert.strictEqual(
    path({
      type: "LineString",
      coordinates: [
        [0, 0],
        [10, 10],
      ],
    }),
    "M5,5L10,10"
  )
  identity
    .translate([30, 90])
    .scale(2)
    .reflectY(true)
    .clipExtent([
      [35, 76],
      [45, 86],
    ])
  assert.strictEqual(
    path({
      type: "LineString",
      coordinates: [
        [0, 0],
        [10, 10],
      ],
    }),
    "M35,85L44,76"
  )
})

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
  geoMercator,
  geoOrthographic,
  geoStereographic,
  geoTransverseMercator,
} from "../../src/index.js"
import { assertProjectionEqual } from "./asserts.js"
;[
  geoAlbers,
  geoAzimuthalEqualArea,
  geoAzimuthalEquidistant,
  geoConicConformal,
  function conicConformal() {
    return geoConicConformal().parallels([20, 30])
  },
  function conicConformal() {
    return geoConicConformal().parallels([30, 30])
  },
  function conicConformal() {
    return geoConicConformal().parallels([-35, -50])
  },
  function conicConformal() {
    return geoConicConformal().parallels([40, 60]).rotate([-120, 0])
  },
  geoConicEqualArea,
  function conicEqualArea() {
    return geoConicEqualArea().parallels([20, 30])
  },
  function conicEqualArea() {
    return geoConicEqualArea().parallels([-30, 30])
  },
  function conicEqualArea() {
    return geoConicEqualArea().parallels([-35, -50])
  },
  function conicEqualArea() {
    return geoConicEqualArea().parallels([40, 60]).rotate([-120, 0])
  },
  geoConicEquidistant,
  function conicEquidistant() {
    return geoConicEquidistant().parallels([20, 30])
  },
  function conicEquidistant() {
    return geoConicEquidistant().parallels([30, 30])
  },
  function conicEquidistant() {
    return geoConicEquidistant().parallels([-35, -50])
  },
  function conicEquidistant() {
    return geoConicEquidistant().parallels([40, 60]).rotate([-120, 0])
  },
  geoEquirectangular,
  geoEqualEarth,
  geoGnomonic,
  geoMercator,
  geoOrthographic,
  geoStereographic,
  geoTransverseMercator,
].forEach(factory => {
  const name = factory.name,
    projection = factory()
  it(name + "(point) and " + name + ".invert(point) are symmetric", () => {
    ;[
      [0, 0],
      [30.3, 24.1],
      [-10, 42],
      [-2, -5],
    ].forEach(point => {
      assertProjectionEqual(projection, point, projection(point))
    })
  })
})

it("albersUsa(point) and albersUsa.invert(point) are symmetric", () => {
  const projection = geoAlbersUsa()
  ;[
    [-122.4194, 37.7749],
    [-74.0059, 40.7128],
    [-149.9003, 61.2181],
    [-157.8583, 21.3069],
  ].forEach(point => {
    assertProjectionEqual(projection, point, projection(point))
  })
})
import assert from "assert"
import { geoMercator, geoPath } from "../../src/index.js"
import { assertPathEqual } from "../asserts.js"

it("mercator.clipExtent(null) sets the default automatic clip extent", () => {
  const projection = geoMercator().translate([0, 0]).scale(1).clipExtent(null).precision(0)
  assertPathEqual(
    geoPath(projection)({ type: "Sphere" }),
    "M3.141593,-3.141593L3.141593,0L3.141593,3.141593L3.141593,3.141593L-3.141593,3.141593L-3.141593,3.141593L-3.141593,0L-3.141593,-3.141593L-3.141593,-3.141593L3.141593,-3.141593Z"
  )
  assert.strictEqual(projection.clipExtent(), null)
})

it("mercator.center(center) sets the correct automatic clip extent", () => {
  const projection = geoMercator().translate([0, 0]).scale(1).center([10, 10]).precision(0)
  assertPathEqual(
    geoPath(projection)({ type: "Sphere" }),
    "M2.967060,-2.966167L2.967060,0.175426L2.967060,3.317018L2.967060,3.317018L-3.316126,3.317018L-3.316126,3.317019L-3.316126,0.175426L-3.316126,-2.966167L-3.316126,-2.966167L2.967060,-2.966167Z"
  )
  assert.strictEqual(projection.clipExtent(), null)
})

it("mercator.clipExtent(extent) intersects the specified clip extent with the automatic clip extent", () => {
  const projection = geoMercator()
    .translate([0, 0])
    .scale(1)
    .clipExtent([
      [-10, -10],
      [10, 10],
    ])
    .precision(0)
  assertPathEqual(
    geoPath(projection)({ type: "Sphere" }),
    "M3.141593,-10L3.141593,0L3.141593,10L3.141593,10L-3.141593,10L-3.141593,10L-3.141593,0L-3.141593,-10L-3.141593,-10L3.141593,-10Z"
  )
  assert.deepStrictEqual(projection.clipExtent(), [
    [-10, -10],
    [10, 10],
  ])
})

it("mercator.clipExtent(extent).scale(scale) updates the intersected clip extent", () => {
  const projection = geoMercator()
    .translate([0, 0])
    .clipExtent([
      [-10, -10],
      [10, 10],
    ])
    .scale(1)
    .precision(0)
  assertPathEqual(
    geoPath(projection)({ type: "Sphere" }),
    "M3.141593,-10L3.141593,0L3.141593,10L3.141593,10L-3.141593,10L-3.141593,10L-3.141593,0L-3.141593,-10L-3.141593,-10L3.141593,-10Z"
  )
  assert.deepStrictEqual(projection.clipExtent(), [
    [-10, -10],
    [10, 10],
  ])
})

it("mercator.clipExtent(extent).translate(translate) updates the intersected clip extent", () => {
  const projection = geoMercator()
    .scale(1)
    .clipExtent([
      [-10, -10],
      [10, 10],
    ])
    .translate([0, 0])
    .precision(0)
  assertPathEqual(
    geoPath(projection)({ type: "Sphere" }),
    "M3.141593,-10L3.141593,0L3.141593,10L3.141593,10L-3.141593,10L-3.141593,10L-3.141593,0L-3.141593,-10L-3.141593,-10L3.141593,-10Z"
  )
  assert.deepStrictEqual(projection.clipExtent(), [
    [-10, -10],
    [10, 10],
  ])
})

it("mercator.rotate(…) does not affect the automatic clip extent", () => {
  const projection = geoMercator(),
    object = {
      type: "MultiPoint",
      coordinates: [
        [-82.35024908550241, 29.649391549778745],
        [-82.35014449996858, 29.65075946917633],
        [-82.34916073446641, 29.65070265688781],
        [-82.3492653331286, 29.64933474064504],
      ],
    }
  projection.fitExtent(
    [
      [0, 0],
      [960, 600],
    ],
    object
  )
  assert.deepStrictEqual(projection.scale(), 20969742.365692537)
  assert.deepStrictEqual(projection.translate(), [30139734.76760269, 11371473.949706702])
  projection.rotate([0, 95]).fitExtent(
    [
      [0, 0],
      [960, 600],
    ],
    object
  )
  assert.deepStrictEqual(projection.scale(), 35781690.650920525)
  assert.deepStrictEqual(projection.translate(), [75115911.95344563, 2586046.4116968135])
})
import assert from "assert"
import { geoGnomonic, geoMercator } from "../../src/index.js"
import { assertInDelta } from "../asserts.js"
import { assertProjectionEqual } from "./asserts.js"

it("projection.reflectX(…) defaults to false", () => {
  const projection = geoGnomonic().scale(1).translate([0, 0])
  assert.strictEqual(projection.reflectX(), false)
  assert.strictEqual(projection.reflectY(), false)
  assertProjectionEqual(projection, [0, 0], [0, 0])
  assertProjectionEqual(projection, [10, 0], [0.17632698070846498, 0])
  assertProjectionEqual(projection, [0, 10], [0, -0.17632698070846498])
})

it("projection.reflectX(…) mirrors x after projecting", () => {
  const projection = geoGnomonic().scale(1).translate([0, 0]).reflectX(true)
  assert.strictEqual(projection.reflectX(), true)
  assertProjectionEqual(projection, [0, 0], [0, 0])
  assertProjectionEqual(projection, [10, 0], [-0.17632698070846498, 0])
  assertProjectionEqual(projection, [0, 10], [0, -0.17632698070846498])
  projection.reflectX(false).reflectY(true)
  assert.strictEqual(projection.reflectX(), false)
  assert.strictEqual(projection.reflectY(), true)
  assertProjectionEqual(projection, [0, 0], [0, 0])
  assertProjectionEqual(projection, [10, 0], [0.17632698070846498, 0])
  assertProjectionEqual(projection, [0, 10], [0, 0.17632698070846498])
})

it("projection.reflectX(…) works with projection.angle()", () => {
  const projection = geoMercator().scale(1).translate([10, 20]).reflectX(true).angle(45)
  assert.strictEqual(projection.reflectX(), true)
  assertInDelta(projection.angle(), 45)
  assertProjectionEqual(projection, [0, 0], [10, 20])
  assertProjectionEqual(projection, [10, 0], [9.87658658, 20.12341341])
  assertProjectionEqual(projection, [0, 10], [9.87595521, 19.87595521])
})
import { geoMercator, geoPath } from "../../src/index.js"
import { assertPathEqual } from "../asserts.js"

it("a rotation of a degenerate polygon should not break", () => {
  const projection = geoMercator().rotate([-134.3, 25.776]).scale(750).translate([0, 0])
  assertPathEqual(
    geoPath(projection)({
      type: "Polygon",
      coordinates: [
        [
          [125.67351590459046, -14.17673705310531],
          [125.67351590459046, -14.173276873687367],
          [125.67351590459046, -14.173276873687367],
          [125.67351590459046, -14.169816694269425],
          [125.67351590459046, -14.17673705310531],
        ],
      ],
    }),
    "M-111.644162,-149.157654L-111.647235,-149.203744L-111.647235,-149.203744L-111.650307,-149.249835Z"
  )
})
import { geoStereographic } from "../../src/index.js"
import { assertProjectionEqual } from "./asserts.js"

it("stereographic(point) returns the expected result", () => {
  const stereographic = geoStereographic().translate([0, 0]).scale(1)
  assertProjectionEqual(stereographic, [0, 0], [0, 0])
  assertProjectionEqual(stereographic, [-90, 0], [-1, 0])
  assertProjectionEqual(stereographic, [90, 0], [1, 0])
  assertProjectionEqual(stereographic, [0, -90], [0, 1])
  assertProjectionEqual(stereographic, [0, 90], [0, -1])
})
import assert from "assert"
import { geoPath, geoTransverseMercator } from "../../src/index.js"
import { assertPathEqual } from "../asserts.js"

it("transverseMercator.clipExtent(null) sets the default automatic clip extent", () => {
  const projection = geoTransverseMercator().translate([0, 0]).scale(1).clipExtent(null).precision(0)
  assertPathEqual(
    geoPath(projection)({ type: "Sphere" }),
    "M3.141593,3.141593L0,3.141593L-3.141593,3.141593L-3.141593,-3.141593L-3.141593,-3.141593L0,-3.141593L3.141593,-3.141593L3.141593,3.141593Z"
  )
  assert.strictEqual(projection.clipExtent(), null)
})

it("transverseMercator.center(center) sets the correct automatic clip extent", () => {
  const projection = geoTransverseMercator().translate([0, 0]).scale(1).center([10, 10]).precision(0)
  assertPathEqual(
    geoPath(projection)({ type: "Sphere" }),
    "M2.966167,3.316126L-0.175426,3.316126L-3.317018,3.316126L-3.317019,-2.967060L-3.317019,-2.967060L-0.175426,-2.967060L2.966167,-2.967060L2.966167,3.316126Z"
  )
  assert.strictEqual(projection.clipExtent(), null)
})

it("transverseMercator.clipExtent(extent) intersects the specified clip extent with the automatic clip extent", () => {
  const projection = geoTransverseMercator()
    .translate([0, 0])
    .scale(1)
    .clipExtent([
      [-10, -10],
      [10, 10],
    ])
    .precision(0)
  assertPathEqual(
    geoPath(projection)({ type: "Sphere" }),
    "M10,3.141593L0,3.141593L-10,3.141593L-10,-3.141593L-10,-3.141593L0,-3.141593L10,-3.141593L10,3.141593Z"
  )
  assert.deepStrictEqual(projection.clipExtent(), [
    [-10, -10],
    [10, 10],
  ])
})

it("transverseMercator.clipExtent(extent).scale(scale) updates the intersected clip extent", () => {
  const projection = geoTransverseMercator()
    .translate([0, 0])
    .clipExtent([
      [-10, -10],
      [10, 10],
    ])
    .scale(1)
    .precision(0)
  assertPathEqual(
    geoPath(projection)({ type: "Sphere" }),
    "M10,3.141593L0,3.141593L-10,3.141593L-10,-3.141593L-10,-3.141593L0,-3.141593L10,-3.141593L10,3.141593Z"
  )
  assert.deepStrictEqual(projection.clipExtent(), [
    [-10, -10],
    [10, 10],
  ])
})

it("transverseMercator.clipExtent(extent).translate(translate) updates the intersected clip extent", () => {
  const projection = geoTransverseMercator()
    .scale(1)
    .clipExtent([
      [-10, -10],
      [10, 10],
    ])
    .translate([0, 0])
    .precision(0)
  assertPathEqual(
    geoPath(projection)({ type: "Sphere" }),
    "M10,3.141593L0,3.141593L-10,3.141593L-10,-3.141593L-10,-3.141593L0,-3.141593L10,-3.141593L10,3.141593Z"
  )
  assert.deepStrictEqual(projection.clipExtent(), [
    [-10, -10],
    [10, 10],
  ])
})

it("transverseMercator.rotate(…) does not affect the automatic clip extent", () => {
  const projection = geoTransverseMercator(),
    object = {
      type: "MultiPoint",
      coordinates: [
        [-82.35024908550241, 29.649391549778745],
        [-82.35014449996858, 29.65075946917633],
        [-82.34916073446641, 29.65070265688781],
        [-82.3492653331286, 29.64933474064504],
      ],
    }
  projection.fitExtent(
    [
      [0, 0],
      [960, 600],
    ],
    object
  )
  assert.deepStrictEqual(projection.scale(), 15724992.330511674)
  assert.deepStrictEqual(projection.translate(), [20418843.897824813, 21088401.790971387])
  projection.rotate([0, 95]).fitExtent(
    [
      [0, 0],
      [960, 600],
    ],
    object
  )
  assert.deepStrictEqual(projection.scale(), 15724992.330511674)
  assert.deepStrictEqual(projection.translate(), [20418843.897824813, 47161426.43770847])
})
