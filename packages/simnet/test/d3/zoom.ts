import { JSDOM } from "jsdom"

export function jsdomit(description, run) {
  it(description, async () => {
    try {
      const window = new JSDOM("").window
      global.document = window.document
      global.navigator = window.navigator
      global.Node = window.Node
      global.NodeList = window.NodeList
      global.HTMLCollection = window.HTMLCollection
      global.SVGElement = window.SVGElement
      return await run()
    } finally {
      delete global.document
      delete global.navigator
      delete global.Node
      delete global.NodeList
      delete global.HTMLCollection
      delete global.SVGElement
    }
  })
}
import assert from "assert"
import { zoomIdentity, ZoomTransform } from "../src/index.js"

it("zoomIdentity transform contains k = 1, x = y = 0", () => {
  assert.deepStrictEqual(zoomIdentity, new ZoomTransform(1, 0, 0))
})

it("transform.scale(k) returns a new transform scaled with k", () => {
  const transform = zoomIdentity.scale(2.5)
  assert.deepStrictEqual(transform.scale(2), new ZoomTransform(5, 0, 0))
})

it("transform.translate(x, y) returns a new transform translated with x and y", () => {
  const transform = zoomIdentity.translate(2, 3)
  assert.deepStrictEqual(transform.translate(-4, 4), new ZoomTransform(1, -2, 7))
  assert.deepStrictEqual(transform.scale(2).translate(-4, 4), new ZoomTransform(2, -6, 11))
})

it("transform.apply([x, y]) returns the transformation of the specified point", () => {
  assert.deepStrictEqual(zoomIdentity.translate(2, 3).scale(2).apply([4, 5]), [10, 13])
})

it("transform.applyX(x) returns the transformation of the specified x-coordinate", () => {
  assert.deepStrictEqual(zoomIdentity.translate(2, 0).scale(2).applyX(4), 10)
})

it("transform.applyY(y) returns the transformation of the specified y-coordinate", () => {
  assert.deepStrictEqual(zoomIdentity.translate(0, 3).scale(2).applyY(5), 13)
})

it("transform.invert([x, y]) returns the inverse transformation of the specified point", () => {
  assert.deepStrictEqual(zoomIdentity.translate(2, 3).scale(2).invert([4, 5]), [1, 1])
})

it("transform.invertX(x) returns the inverse transformation of the specified x-coordinate", () => {
  assert.deepStrictEqual(zoomIdentity.translate(2, 0).scale(2).invertX(4), 1)
})

it("transform.invertY(y) returns the inverse transformation of the specified y-coordinate", () => {
  assert.deepStrictEqual(zoomIdentity.translate(0, 3).scale(2).invertY(5), 1)
})

it("transform.toString() returns a string representing the SVG transform", () => {
  assert.strictEqual(zoomIdentity.toString(), "translate(0,0) scale(1)")
})
import assert from "assert"
import { select } from "d3-selection"
import { zoom, zoomIdentity } from "../src/index.js"
import ZoomEvent from "../src/event.js"
import it from "./jsdom.js"

it("zoom.on('zoom') callback", () => {
  const div = select(document.body).append("div").datum("hello")
  const z = zoom()
  div.call(z)
  let a
  z.on("zoom", function (event, d) {
    a = { event, d, that: this }
  })
  div.call(z.transform, zoomIdentity)
  const event = new ZoomEvent("zoom", { sourceEvent: null, target: z, transform: zoomIdentity })
  assert.deepStrictEqual(a, { event, d: "hello", that: div.node() })
  a = {}
  z.on("zoom", null)
  assert.deepStrictEqual(a, {})
})

it("zoom.on('start') callback", () => {
  const div = select(document.body).append("div").datum("hello")
  const z = zoom()
  div.call(z)
  let a
  z.on("start", function (event, d) {
    a = { event, d, that: this }
  })
  div.call(z.transform, zoomIdentity)
  const event = new ZoomEvent("start", { sourceEvent: null, target: z, transform: zoomIdentity })
  assert.deepStrictEqual(a, { event, d: "hello", that: div.node() })
  a = {}
  z.on("start", null)
  assert.deepStrictEqual(a, {})
})

it("zoom.on('end') callback", () => {
  const div = select(document.body).append("div").datum("hello")
  const z = zoom()
  div.call(z)
  let a
  z.on("end", function (event, d) {
    a = { event, d, that: this }
  })
  div.call(z.transform, zoomIdentity)
  const event = new ZoomEvent("end", { sourceEvent: null, target: z, transform: zoomIdentity })
  assert.deepStrictEqual(a, { event, d: "hello", that: div.node() })
  a = {}
  z.on("end", null)
  assert.deepStrictEqual(a, {})
})

it("zoom.on('start zoom end') callback order", () => {
  const div = select(document.body).append("div").datum("hello")
  const z = zoom()
  div.call(z)
  let a = []
  z.on("start zoom end", function (event) {
    a.push(event.type)
  })
  div.call(z.transform, zoomIdentity)
  assert.deepStrictEqual(a, ["start", "zoom", "end"])
  z.on("start zoom end", null)
})
import assert from "assert"
import { zoom, zoomIdentity } from "../src/index.js"
import { select } from "d3-selection"
import it from "./jsdom.js"

it("zoom.filter receives (event, d) and filters", () => {
  const div = select(document.body).append("div").datum("hello")
  const z = zoom()
  div.call(z)
  div.call(z.transform, zoomIdentity)
  z.filter()
  const event = { bubbles: true, cancelable: true, detail: { type: "fake" } }
  let a, b
  z.on("zoom", function () {
    b = arguments
  }).filter(function () {
    a = arguments
  })
  div.dispatch("dblclick", event)
  assert.strictEqual(a[0].detail.type, "fake")
  assert.strictEqual(a[1], "hello")
  assert.strictEqual(b, undefined) // our fake dblclick was rejected

  z.duration(0)
  z.filter(() => true)
  div.dispatch("dblclick", event)
  assert(b !== undefined) // our fake dblclick was accepted
  div.interrupt()
})

it("zoom.extent receives (d)", () => {
  const div = select(document.body).append("div").datum("hello")
  const z = zoom()
  div.call(z)
  div.call(z.transform, zoomIdentity)
  const extent = z.extent()
  const event = { bubbles: true, cancelable: true, detail: { type: "fake" } }
  let a
  z.extent(function () {
    a = arguments
    a[-1] = this
    return extent.apply(this, arguments)
  })
  div.dispatch("dblclick", event)
  assert.strictEqual(a[0], "hello")
  assert.strictEqual(a[-1], div.node())
  div.interrupt()
})
import assert from "assert"
import { select } from "d3-selection"
import { zoom, zoomIdentity, zoomTransform, ZoomTransform } from "../src/index.js"
import it from "./jsdom.js"

it("zoom initiates a zooming behavior", () => {
  const div = select(document.body).append("div").datum("hello")
  const z = zoom()
  div.call(z)
  assert.deepStrictEqual(div.node().__zoom, new ZoomTransform(1, 0, 0))
  div.call(z.transform, zoomIdentity.scale(2).translate(1, -3))
  assert.deepStrictEqual(div.node().__zoom, new ZoomTransform(2, 2, -6))
})

it("zoomTransform returns the node’s current transform", () => {
  const div = select(document.body).append("div").datum("hello")
  const z = zoom()
  div.call(z)
  assert.deepStrictEqual(zoomTransform(div.node()), new ZoomTransform(1, 0, 0))
  div.call(z.translateBy, 10, 10)
  assert.deepStrictEqual(zoomTransform(div.node()), new ZoomTransform(1, 10, 10))
  assert.deepStrictEqual(zoomTransform(div.append("span").node()), new ZoomTransform(1, 10, 10)) // or an ancestor's…
  assert.deepStrictEqual(zoomTransform(document.body), zoomIdentity) // or zoomIdentity
})

it("zoom.scaleBy zooms", () => {
  const div = select(document.body).append("div").datum("hello")
  const z = zoom()
  div.call(z)
  div.call(z.scaleBy, 2, [0, 0])
  assert.deepStrictEqual(div.node().__zoom, new ZoomTransform(2, 0, 0))
  div.call(z.scaleBy, 2, [2, -2])
  assert.deepStrictEqual(div.node().__zoom, new ZoomTransform(4, -2, 2))
  div.call(z.scaleBy, 1 / 4, [2, -2])
  assert.deepStrictEqual(div.node().__zoom, new ZoomTransform(1, 1, -1))
})

it("zoom.scaleTo zooms", () => {
  const div = select(document.body).append("div").datum("hello")
  const z = zoom()
  div.call(z)
  div.call(z.scaleTo, 2)
  assert.deepStrictEqual(div.node().__zoom, new ZoomTransform(2, 0, 0))
  div.call(z.scaleTo, 2)
  assert.deepStrictEqual(div.node().__zoom, new ZoomTransform(2, 0, 0))
  div.call(z.scaleTo, 1)
  assert.deepStrictEqual(div.node().__zoom, new ZoomTransform(1, 0, 0))
})

it("zoom.translateBy translates", () => {
  const div = select(document.body).append("div").datum("hello")
  const z = zoom()
  div.call(z)
  div.call(z.translateBy, 10, 10)
  assert.deepStrictEqual(div.node().__zoom, new ZoomTransform(1, 10, 10))
  div.call(z.scaleBy, 2)
  div.call(z.translateBy, -10, -10)
  assert.deepStrictEqual(div.node().__zoom, new ZoomTransform(2, 0, 0))
})

it("zoom.scaleBy arguments can be functions passed (datum, index)", () => {
  const div = select(document.body).append("div").datum("hello")
  const z = zoom()
  div.call(z)
  let a, b, c, d
  div.call(
    z.scaleBy,
    function () {
      a = arguments
      b = this
      return 2
    },
    function () {
      c = arguments
      d = this
      return [0, 0]
    }
  )
  assert.deepStrictEqual(div.node().__zoom, new ZoomTransform(2, 0, 0))
  assert.deepStrictEqual(a[0], "hello")
  assert.deepStrictEqual(a[1], 0)
  assert.deepStrictEqual(b, div.node())
  assert.deepStrictEqual(c[0], "hello")
  assert.deepStrictEqual(c[1], 0)
  assert.deepStrictEqual(d, div.node())
})

it("zoom.scaleTo arguments can be functions passed (datum, index)", () => {
  const div = select(document.body).append("div").datum("hello")
  const z = zoom()
  div.call(z)
  let a, b, c, d
  div.call(
    z.scaleTo,
    function () {
      a = arguments
      b = this
      return 2
    },
    function () {
      c = arguments
      d = this
      return [0, 0]
    }
  )
  assert.deepStrictEqual(div.node().__zoom, new ZoomTransform(2, 0, 0))
  assert.deepStrictEqual(a[0], "hello")
  assert.deepStrictEqual(a[1], 0)
  assert.deepStrictEqual(b, div.node())
  assert.deepStrictEqual(c[0], "hello")
  assert.deepStrictEqual(c[1], 0)
  assert.deepStrictEqual(d, div.node())
})

it("zoom.translateBy arguments can be functions passed (datum, index)", () => {
  const div = select(document.body).append("div").datum("hello")
  const z = zoom()
  div.call(z)
  let a, b, c, d
  div.call(
    z.translateBy,
    function () {
      a = arguments
      b = this
      return 2
    },
    function () {
      c = arguments
      d = this
      return 3
    }
  )
  assert.deepStrictEqual(div.node().__zoom, new ZoomTransform(1, 2, 3))
  assert.deepStrictEqual(a[0], "hello")
  assert.deepStrictEqual(a[1], 0)
  assert.deepStrictEqual(b, div.node())
  assert.deepStrictEqual(c[0], "hello")
  assert.deepStrictEqual(c[1], 0)
  assert.deepStrictEqual(d, div.node())
})

it("zoom.constrain receives (transform, extent, translateExtent)", () => {
  const div = select(document.body).append("div").datum("hello")
  const z = zoom()
  div.call(z)
  const constrain = z.constrain()
  let a, b
  z.constrain(function () {
    a = arguments
    return (b = constrain.apply(this, arguments))
  })
  div.call(z.translateBy, 10, 10)
  assert.deepStrictEqual(a[0], b)
  assert.deepStrictEqual(a[0], new ZoomTransform(1, 10, 10))
  assert.deepStrictEqual(a[1], [
    [0, 0],
    [0, 0],
  ])
  assert.strictEqual(a[2][0][0], -Infinity)
  z.constrain(constrain)
})
