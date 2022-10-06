import assert from "assert"
import { selection } from "../src/index.js"
import { EnterNode } from "../src/selection/enter.js"

export function assertSelection(actual, expected) {
  let expectedGroups, expectedParents, expectedEnter, expectedExit, expectedRest
  if (expected instanceof selection) {
    ;({
      _groups: expectedGroups,
      _parents: expectedParents,
      _enter: expectedEnter,
      _exit: expectedExit,
      ...expectedRest
    } = expected)
  } else {
    ;({
      groups: expectedGroups,
      parents: expectedParents = Array.from(expectedGroups, () => null),
      enter: expectedEnter,
      exit: expectedExit,
      ...expectedRest
    } = expected)
  }
  assert(actual instanceof selection)
  const {
    _groups: actualGroups,
    _parents: actualParents,
    _enter: actualEnter,
    _exit: actualExit,
    ...actualRest
  } = actual
  assert.deepStrictEqual(
    {
      groups: Array.from(actualGroups, group => Array.from(group)),
      parents: Array.from(actualParents),
      enter: actualEnter,
      exit: actualExit,
      ...actualRest,
    },
    {
      groups: Array.from(expectedGroups, group => Array.from(group)),
      parents: expectedParents,
      enter: expectedEnter,
      exit: expectedExit,
      ...expectedRest,
    }
  )
}

export function enterNode(parent, data, next = null) {
  if (typeof parent === "string") parent = document.querySelector(parent)
  if (typeof next === "string") next = document.querySelector(next)
  const node = new EnterNode(parent, data)
  node._next = next
  return node
}
import assert from "assert"
import { create } from "../src/index.js"
import it from "./jsdom.js"

it("create(name) returns a new HTML element with the given name", () => {
  const h1 = create("h1")
  assert.strictEqual(h1._groups[0][0].namespaceURI, "http://www.w3.org/1999/xhtml")
  assert.strictEqual(h1._groups[0][0].tagName, "H1")
  assert.deepStrictEqual(h1._parents, [null])
})

it("create(name) returns a new SVG element with the given name", () => {
  const svg = create("svg")
  assert.strictEqual(svg._groups[0][0].namespaceURI, "http://www.w3.org/2000/svg")
  assert.strictEqual(svg._groups[0][0].tagName, "svg")
  assert.deepStrictEqual(svg._parents, [null])
})
import assert from "assert"
import { creator } from "../src/index.js"
import it from "./jsdom.js"

it("creator(name).call(element) returns a new element with the given name", "<body class='foo'>", () => {
  assert.deepStrictEqual(type(creator("h1").call(document.body)), {
    namespace: "http://www.w3.org/1999/xhtml",
    name: "H1",
  })
  assert.deepStrictEqual(type(creator("xhtml:h1").call(document.body)), {
    namespace: "http://www.w3.org/1999/xhtml",
    name: "H1",
  })
  assert.deepStrictEqual(type(creator("svg").call(document.body)), {
    namespace: "http://www.w3.org/2000/svg",
    name: "svg",
  })
  assert.deepStrictEqual(type(creator("g").call(document.body)), {
    namespace: "http://www.w3.org/1999/xhtml",
    name: "G",
  })
})

it(
  "creator(name).call(element) can inherit the namespace from the given element",
  "<body class='foo'><svg></svg>",
  () => {
    const svg = document.querySelector("svg")
    assert.deepStrictEqual(type(creator("g").call(document.body)), {
      namespace: "http://www.w3.org/1999/xhtml",
      name: "G",
    })
    assert.deepStrictEqual(type(creator("g").call(svg)), { namespace: "http://www.w3.org/2000/svg", name: "g" })
  }
)

function type(element) {
  return { namespace: element.namespaceURI, name: element.tagName }
}
import { JSDOM } from "jsdom"

export function jsdomit(message, html, run) {
  if (arguments.length < 3) (run = html), (html = "")
  return it(message, async () => {
    try {
      const dom = new JSDOM(html)
      global.window = dom.window
      global.document = dom.window.document
      await run()
    } finally {
      delete global.window
      delete global.document
    }
  })
}
import assert from "assert"
import { matcher } from "../src/index.js"
import it from "./jsdom.js"

it("matcher(selector).call(element) returns true if the element matches the selector", "<body class='foo'>", () => {
  assert.strictEqual(matcher("body").call(document.body), true)
  assert.strictEqual(matcher(".foo").call(document.body), true)
  assert.strictEqual(matcher("body.foo").call(document.body), true)
  assert.strictEqual(matcher("h1").call(document.body), false)
  assert.strictEqual(matcher("body.bar").call(document.body), false)
})
import assert from "assert"
import { namespace, namespaces } from "../src/index.js"

it("namespace(name) returns name if there is no namespace prefix", () => {
  assert.strictEqual(namespace("foo"), "foo")
  assert.strictEqual(namespace("foo:bar"), "bar")
})

it("namespace(name) coerces name to a string", () => {
  assert.strictEqual(
    namespace({
      toString: function () {
        return "foo"
      },
    }),
    "foo"
  )
  assert.deepStrictEqual(
    namespace({
      toString: function () {
        return "svg"
      },
    }),
    { space: "http://www.w3.org/2000/svg", local: "svg" }
  )
})

it("namespace(name) returns the expected values for built-in namespaces", () => {
  assert.deepStrictEqual(namespace("svg"), { space: "http://www.w3.org/2000/svg", local: "svg" })
  assert.deepStrictEqual(namespace("xhtml"), { space: "http://www.w3.org/1999/xhtml", local: "xhtml" })
  assert.deepStrictEqual(namespace("xlink"), { space: "http://www.w3.org/1999/xlink", local: "xlink" })
  assert.deepStrictEqual(namespace("xml"), { space: "http://www.w3.org/XML/1998/namespace", local: "xml" })
  assert.deepStrictEqual(namespace("svg:g"), { space: "http://www.w3.org/2000/svg", local: "g" })
  assert.deepStrictEqual(namespace("xhtml:b"), { space: "http://www.w3.org/1999/xhtml", local: "b" })
  assert.deepStrictEqual(namespace("xlink:href"), { space: "http://www.w3.org/1999/xlink", local: "href" })
  assert.deepStrictEqual(namespace("xml:lang"), { space: "http://www.w3.org/XML/1998/namespace", local: "lang" })
})

it('namespace("xmlns:…") treats the whole name as the local name', () => {
  assert.deepStrictEqual(namespace("xmlns:xlink"), { space: "http://www.w3.org/2000/xmlns/", local: "xmlns:xlink" })
})

it("namespace(name) observes modifications to namespaces", () => {
  namespaces.d3js = "https://d3js.org/2016/namespace"
  assert.deepStrictEqual(namespace("d3js:pie"), { space: "https://d3js.org/2016/namespace", local: "pie" })
  delete namespaces.d3js
  assert.strictEqual(namespace("d3js:pie"), "pie")
})
import assert from "assert"
import { namespaces } from "../src/index.js"

it("namespaces has the expected value", () => {
  assert.deepStrictEqual(namespaces, {
    svg: "http://www.w3.org/2000/svg",
    xhtml: "http://www.w3.org/1999/xhtml",
    xlink: "http://www.w3.org/1999/xlink",
    xml: "http://www.w3.org/XML/1998/namespace",
    xmlns: "http://www.w3.org/2000/xmlns/",
  })
})
import assert from "assert"
import { pointer, pointers } from "../src/index.js"
import it from "./jsdom.js"

it("pointer(mousemove) returns an array of coordinates", "<div>", () => {
  const target = document.querySelector("div")
  assert.deepStrictEqual(pointer(mousemove(10, 20)), [10, 20])
  assert.deepStrictEqual(pointer(mousemove(10, 20, target), target), [10, 20])
})

it("pointer(touch, target) returns an array of coordinates", "<div>", () => {
  const target = document.querySelector("div")
  assert.deepStrictEqual(pointer(touch(10, 20), target), [10, 20])
})

it("pointers(mousemove) returns an array of arrays of coordinates", "<div>", () => {
  const target = document.querySelector("div")
  assert.deepStrictEqual(pointers(mousemove(10, 20)), [[10, 20]])
  assert.deepStrictEqual(pointers(mousemove(10, 20, target)), [[10, 20]])
})

it("pointers(touchmove) returns an array of arrays of coordinates", "<div>", () => {
  const target = document.querySelector("div")
  assert.deepStrictEqual(pointers(touchmove(10, 20)), [[10, 20]])
  assert.deepStrictEqual(pointers(touchmove(10, 20, target)), [[10, 20]])
})

it("pointers(touches) returns an array of arrays of coordinates", "<div>", () => {
  assert.deepStrictEqual(pointers([touch(10, 20)]), [[10, 20]])
})

function mousemove(x, y, target = document.body) {
  return {
    pageX: x,
    pageY: y,
    clientX: x,
    clientY: y,
    type: "mousemove",
    target: target,
    currentTarget: target,
  }
}

function touchmove(x, y, target = document.body) {
  return {
    type: "touchmove",
    target: target,
    currentTarget: target,
    touches: [touch(x, y)],
  }
}

function touch(x, y) {
  return {
    pageX: x,
    pageY: y,
    clientX: x,
    clientY: y,
  }
}
import assert from "assert"
import { select, selection } from "../src/index.js"
import { assertSelection } from "./asserts.js"
import it from "./jsdom.js"

it("select(…) returns an instanceof selection", "<h1>hello</h1>", () => {
  assert(select(document) instanceof selection)
})

it(
  "select(string) selects the first element that matches the selector string",
  "<h1 id='one'>foo</h1><h1 id='two'>bar</h1>",
  () => {
    assertSelection(select("h1"), { groups: [[document.querySelector("h1")]], parents: [document.documentElement] })
  }
)

it("select(element) selects the given element", "<h1>hello</h1>", () => {
  assertSelection(select(document.body), { groups: [[document.body]] })
  assertSelection(select(document.documentElement), { groups: [[document.documentElement]] })
})

it("select(window) selects the given window", "<h1>hello</h1>", () => {
  assertSelection(select(document.defaultView), { groups: [[document.defaultView]] })
})

it("select(document) selects the given document", "<h1>hello</h1>", () => {
  assertSelection(select(document), { groups: [[document]] })
})

it("select(null) selects null", "<h1>hello</h1><null></null><undefined></undefined>", () => {
  assertSelection(select(null), { groups: [[null]] })
  assertSelection(select(undefined), { groups: [[undefined]] })
  assertSelection(select(), { groups: [[undefined]] })
})

it("select(object) selects an arbitrary object", () => {
  const object = {}
  assertSelection(select(object), { groups: [[object]] })
})
import assert from "assert"
import { selectAll, selection } from "../src/index.js"
import { assertSelection } from "./asserts.js"
import it from "./jsdom.js"

it("selectAll(…) returns an instanceof selection", "<h1>hello</h1>", () => {
  assert(selectAll([document]) instanceof selection)
})

it("selectAll(…) accepts an iterable", "<h1>hello</h1>", () => {
  assert.deepStrictEqual(selectAll(new Set([document])).nodes(), [document])
})

it(
  "selectAll(string) selects all elements that match the selector string, in order",
  "<h1 id='one'>foo</h1><h1 id='two'>bar</h1>",
  () => {
    assertSelection(selectAll("h1"), { groups: [document.querySelectorAll("h1")], parents: [document.documentElement] })
  }
)

it("selectAll(nodeList) selects a NodeList of elements", "<h1>hello</h1><h2>world</h2>", () => {
  assertSelection(selectAll(document.querySelectorAll("h1,h2")), { groups: [document.querySelectorAll("h1,h2")] })
})

it("selectAll(array) selects an array of elements", "<h1>hello</h1><h2>world</h2>", () => {
  const h1 = document.querySelector("h1")
  const h2 = document.querySelector("h2")
  assertSelection(selectAll([h1, h2]), { groups: [[h1, h2]] })
})

it("selectAll(array) can select an empty array", () => {
  assertSelection(selectAll([]), { groups: [[]] })
})

it("selectAll(null) selects an empty array", () => {
  assertSelection(selectAll(), { groups: [[]] })
  assertSelection(selectAll(null), { groups: [[]] })
  assertSelection(selectAll(undefined), { groups: [[]] })
})

it("selectAll(null) selects a new empty array each time", () => {
  const one = selectAll()._groups[0]
  const two = selectAll()._groups[0]
  assert.strictEqual(one === two, false)
  one.push("one")
  assert.deepStrictEqual(selectAll()._groups[0], [])
})

it("selectAll(array) can select an array that contains null", "<h1>hello</h1><h2>world</h2>", () => {
  const h1 = document.querySelector("h1")
  assertSelection(selectAll([null, h1, null]), { groups: [[null, h1, null]] })
})

it("selectAll(array) can select an array that contains arbitrary objects", () => {
  const object = {}
  assertSelection(selectAll([object]), { groups: [[object]] })
})
import assert from "assert"
import { selector } from "../src/index.js"
import it from "./jsdom.js"

it("selector(selector).call(element) returns the first element that matches the selector", "<body class='foo'>", () => {
  assert.strictEqual(selector("body").call(document.documentElement), document.body)
  assert.strictEqual(selector(".foo").call(document.documentElement), document.body)
  assert.strictEqual(selector("body.foo").call(document.documentElement), document.body)
  assert.strictEqual(selector("h1").call(document.documentElement), null)
  assert.strictEqual(selector("body.bar").call(document.documentElement), null)
})

it(
  "selector(null).call(element) always returns undefined",
  "<body class='foo'><undefined></undefined><null></null>",
  () => {
    assert.strictEqual(selector().call(document.documentElement), undefined)
    assert.strictEqual(selector(null).call(document.documentElement), undefined)
    assert.strictEqual(selector(undefined).call(document.documentElement), undefined)
  }
)
import assert from "assert"
import { selectorAll } from "../src/index.js"
import it from "./jsdom.js"

it(
  "selectorAll(selector).call(element) returns all elements that match the selector",
  "<body class='foo'><div class='foo'>",
  () => {
    const body = document.body
    const div = document.querySelector("div")
    assert.deepStrictEqual([...selectorAll("body").call(document.documentElement)], [body])
    assert.deepStrictEqual([...selectorAll(".foo").call(document.documentElement)], [body, div])
    assert.deepStrictEqual([...selectorAll("div.foo").call(document.documentElement)], [div])
    assert.deepStrictEqual([...selectorAll("div").call(document.documentElement)], [div])
    assert.deepStrictEqual([...selectorAll("div,body").call(document.documentElement)], [body, div])
    assert.deepStrictEqual([...selectorAll("h1").call(document.documentElement)], [])
    assert.deepStrictEqual([...selectorAll("body.bar").call(document.documentElement)], [])
  }
)

it(
  "selectorAll(null).call(element) always returns the empty array",
  "<body class='foo'><undefined></undefined><null></null>",
  () => {
    assert.deepStrictEqual(selectorAll().call(document.documentElement), [])
    assert.deepStrictEqual(selectorAll(null).call(document.documentElement), [])
    assert.deepStrictEqual(selectorAll(undefined).call(document.documentElement), [])
  }
)

it("selectorAll(null).call(element) returns a new empty array each time", () => {
  const one = selectorAll()()
  const two = selectorAll()()
  assert.strictEqual(one === two, false)
  one.push("one")
  assert.deepStrictEqual(selectorAll()(), [])
})
import assert from "assert"
import { window } from "../src/index.js"
import it from "./jsdom.js"

it("window(node) returns node.ownerDocument.defaultView", "", () => {
  assert.strictEqual(window(document.body), document.defaultView)
})

it("window(document) returns document.defaultView", "", () => {
  assert.strictEqual(window(document), document.defaultView)
})

it("window(window) returns window", "", () => {
  assert.strictEqual(window(global.window), global.window)
})
