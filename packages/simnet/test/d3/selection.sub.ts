import assert from "assert"
import { namespaces, select, selectAll, selection } from "../../src/index.js"
import { assertSelection } from "../asserts.js"
import it from "../jsdom.js"

it("selection.append(…) returns a selection", () => {
  assert(select(document.body).append("h1") instanceof selection)
})

it(
  "selection.append(name) appends a new element of the specified name as the last child of each selected element",
  "<div id='one'><span class='before'></span></div><div id='two'><span class='before'></span></div>",
  () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const s = selectAll([one, two]).append("span")
    const three = one.querySelector("span:last-child")
    const four = two.querySelector("span:last-child")
    assertSelection(s, { groups: [[three, four]] })
  }
)

it(
  "selection.append(name) observes the specified namespace, if any",
  "<div id='one'></div><div id='two'></div>",
  () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const s = selectAll([one, two]).append("svg:g")
    const three = one.querySelector("g")
    const four = two.querySelector("g")
    assert.strictEqual(three.namespaceURI, "http://www.w3.org/2000/svg")
    assert.strictEqual(four.namespaceURI, "http://www.w3.org/2000/svg")
    assertSelection(s, { groups: [[three, four]] })
  }
)

it(
  "selection.append(name) uses createElement, not createElementNS, if the implied namespace is the same as the document",
  "<div id='one'></div><div id='two'></div>",
  () => {
    let pass = 0
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const createElement = document.createElement

    document.createElement = function () {
      ++pass
      return createElement.apply(this, arguments)
    }

    const selection = selectAll([one, two]).append("P")
    const three = one.querySelector("p")
    const four = two.querySelector("p")
    assert.strictEqual(pass, 2)
    assertSelection(selection, { groups: [[three, four]] })
  }
)

it("selection.append(name) observes the implicit namespace, if any", "<div id='one'></div><div id='two'></div>", () => {
  const one = document.querySelector("#one")
  const two = document.querySelector("#two")
  const selection = selectAll([one, two]).append("svg")
  const three = one.querySelector("svg")
  const four = two.querySelector("svg")
  assert.strictEqual(three.namespaceURI, "http://www.w3.org/2000/svg")
  assert.strictEqual(four.namespaceURI, "http://www.w3.org/2000/svg")
  assertSelection(selection, { groups: [[three, four]] })
})

it(
  "selection.append(name) observes the inherited namespace, if any",
  "<div id='one'></div><div id='two'></div>",
  () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const selection = selectAll([one, two]).append("svg").append("g")
    const three = one.querySelector("g")
    const four = two.querySelector("g")
    assert.strictEqual(three.namespaceURI, "http://www.w3.org/2000/svg")
    assert.strictEqual(four.namespaceURI, "http://www.w3.org/2000/svg")
    assertSelection(selection, { groups: [[three, four]] })
  }
)

it("selection.append(name) observes a custom namespace, if any", "<div id='one'></div><div id='two'></div>", () => {
  try {
    namespaces.d3js = "https://d3js.org/2016/namespace"
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const selection = selectAll([one, two]).append("d3js")
    const three = one.querySelector("d3js")
    const four = two.querySelector("d3js")
    assert.strictEqual(three.namespaceURI, "https://d3js.org/2016/namespace")
    assert.strictEqual(four.namespaceURI, "https://d3js.org/2016/namespace")
    assertSelection(selection, { groups: [[three, four]] })
  } finally {
    delete namespaces.d3js
  }
})

it(
  "selection.append(function) appends the returned element as the last child of each selected element",
  "<div id='one'><span class='before'></span></div><div id='two'><span class='before'></span></div>",
  () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const selection = selectAll([one, two]).append(function () {
      return document.createElement("SPAN")
    })
    const three = one.querySelector("span:last-child")
    const four = two.querySelector("span:last-child")
    assertSelection(selection, { groups: [[three, four]] })
  }
)

it(
  "selection.append(function) passes the creator function data, index and group",
  "<parent id='one'><child id='three'></child><child id='four'></child></parent><parent id='two'><child id='five'></child></parent>",
  () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const three = document.querySelector("#three")
    const four = document.querySelector("#four")
    const five = document.querySelector("#five")
    const results = []

    selectAll([one, two])
      .datum(function (d, i) {
        return "parent-" + i
      })
      .selectAll("child")
      .data(function (d, i) {
        return [0, 1].map(function (j) {
          return "child-" + i + "-" + j
        })
      })
      .append(function (d, i, nodes) {
        results.push([this, d, i, nodes])
        return document.createElement("SPAN")
      })

    assert.deepStrictEqual(results, [
      [three, "child-0-0", 0, [three, four]],
      [four, "child-0-1", 1, [three, four]],
      [five, "child-1-0", 0, [five, ,]],
    ])
  }
)

it(
  "selection.append(…) propagates data if defined on the originating element",
  "<parent><child>hello</child></parent>",
  () => {
    const parent = document.querySelector("parent")
    parent.__data__ = 0 // still counts as data even though falsey
    assert.strictEqual(select(parent).append("child").datum(), 0)
  }
)

it(
  "selection.append(…) will not propagate data if not defined on the originating element",
  "<parent><child>hello</child></parent>",
  () => {
    const parent = document.querySelector("parent")
    const child = document.querySelector("child")
    child.__data__ = 42
    select(parent).append(function () {
      return child
    })
    assert.strictEqual(child.__data__, 42)
  }
)

it(
  "selection.append(…) propagates parents from the originating selection",
  "<parent></parent><parent></parent>",
  () => {
    const parents = select(document).selectAll("parent")
    const childs = parents.append("child")
    assertSelection(parents, { groups: [document.querySelectorAll("parent")], parents: [document] })
    assertSelection(childs, { groups: [document.querySelectorAll("child")], parents: [document] })
    assert.strictEqual(parents.parents, childs.parents) // Not copied!
  }
)

it(
  "selection.append(…) can select elements when the originating selection is nested",
  "<parent id='one'><child></child></parent><parent id='two'><child></child></parent>",
  () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const selection = selectAll([one, two]).selectAll("child").append("span")
    const three = one.querySelector("span")
    const four = two.querySelector("span")
    assertSelection(selection, { groups: [[three], [four]], parents: [one, two] })
  }
)

it("selection.append(…) skips missing originating elements", "<h1></h1>", () => {
  const h1 = document.querySelector("h1")
  const selection = selectAll([, h1]).append("span")
  const span = h1.querySelector("span")
  assertSelection(selection, { groups: [[, span]] })
})
import assert from "assert"
import { namespaces, select, selectAll } from "../../src/index.js"
import it from "../jsdom.js"

it(
  "selection.attr(name) returns the value of the attribute with the specified name on the first selected element",
  "<h1 class='c1 c2'>hello</h1><h1 class='c3'></h1>",
  () => {
    assert.strictEqual(select(document).select("h1").attr("class"), "c1 c2")
    assert.strictEqual(selectAll([null, document]).select("h1").attr("class"), "c1 c2")
  }
)

it(
  "selection.attr(name) coerces the specified name to a string",
  "<h1 class='c1 c2'>hello</h1><h1 class='c3'></h1>",
  () => {
    assert.strictEqual(
      select(document)
        .select("h1")
        .attr({
          toString() {
            return "class"
          },
        }),
      "c1 c2"
    )
  }
)

it("selection.attr(name) observes the namespace prefix, if any", () => {
  const selection = select({
    getAttribute(name) {
      return name === "foo" ? "bar" : null
    },
    getAttributeNS(url, name) {
      return url === "http://www.w3.org/2000/svg" && name === "foo" ? "svg:bar" : null
    },
  })
  assert.strictEqual(selection.attr("foo"), "bar")
  assert.strictEqual(selection.attr("svg:foo"), "svg:bar")
})

it("selection.attr(name) observes a custom namespace prefix, if any", () => {
  const selection = select({
    getAttributeNS(url, name) {
      return url === "https://d3js.org/2016/namespace" && name === "pie" ? "tasty" : null
    },
  })
  try {
    namespaces.d3js = "https://d3js.org/2016/namespace"
    assert.strictEqual(selection.attr("d3js:pie"), "tasty")
  } finally {
    delete namespaces.d3js
  }
})

it("selection.attr(name, value) observes the namespace prefix, if any", () => {
  let result
  const selection = select({
    setAttribute(name, value) {
      result = name === "foo" ? value : null
    },
    setAttributeNS(url, name, value) {
      result = url === "http://www.w3.org/2000/svg" && name === "foo" ? value : null
    },
  })
  assert.strictEqual(((result = undefined), selection.attr("foo", "bar"), result), "bar")
  assert.strictEqual(((result = undefined), selection.attr("svg:foo", "svg:bar"), result), "svg:bar")
  assert.strictEqual(
    ((result = undefined),
    selection.attr("foo", function () {
      return "bar"
    }),
    result),
    "bar"
  )
  assert.strictEqual(
    ((result = undefined),
    selection.attr("svg:foo", function () {
      return "svg:bar"
    }),
    result),
    "svg:bar"
  )
})

it("selection.attr(name, null) observes the namespace prefix, if any", () => {
  let result
  const selection = select({
    removeAttribute(name) {
      result = name === "foo" ? "foo" : null
    },
    removeAttributeNS(url, name) {
      result = url === "http://www.w3.org/2000/svg" && name === "foo" ? "svg:foo" : null
    },
  })
  assert.strictEqual(((result = undefined), selection.attr("foo", null), result), "foo")
  assert.strictEqual(((result = undefined), selection.attr("svg:foo", null), result), "svg:foo")
  assert.strictEqual(
    ((result = undefined),
    selection.attr("foo", function () {
      return null
    }),
    result),
    "foo"
  )
  assert.strictEqual(
    ((result = undefined),
    selection.attr("svg:foo", function () {
      return null
    }),
    result),
    "svg:foo"
  )
})

it(
  "selection.attr(name, value) sets the value of the attribute with the specified name on the selected elements",
  "<h1 id='one' class='c1 c2'>hello</h1><h1 id='two' class='c3'></h1>",
  () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const s = selectAll([one, two])
    assert.strictEqual(s.attr("foo", "bar"), s)
    assert.strictEqual(one.getAttribute("foo"), "bar")
    assert.strictEqual(two.getAttribute("foo"), "bar")
  }
)

it(
  "selection.attr(name, null) removes the attribute with the specified name on the selected elements",
  "<h1 id='one' foo='bar' class='c1 c2'>hello</h1><h1 id='two' foo='bar' class='c3'></h1>",
  () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const s = selectAll([one, two])
    assert.strictEqual(s.attr("foo", null), s)
    assert.strictEqual(one.hasAttribute("foo"), false)
    assert.strictEqual(two.hasAttribute("foo"), false)
  }
)

it(
  "selection.attr(name, function) sets the value of the attribute with the specified name on the selected elements",
  "<h1 id='one' class='c1 c2'>hello</h1><h1 id='two' class='c3'></h1>",
  () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const selection = selectAll([one, two])
    assert.strictEqual(
      selection.attr("foo", function (d, i) {
        return i ? "bar-" + i : null
      }),
      selection
    )
    assert.strictEqual(one.hasAttribute("foo"), false)
    assert.strictEqual(two.getAttribute("foo"), "bar-1")
  }
)

it(
  "selection.attr(name, function) passes the value function data, index and group",
  "<parent id='one'><child id='three'></child><child id='four'></child></parent><parent id='two'><child id='five'></child></parent>",
  () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const three = document.querySelector("#three")
    const four = document.querySelector("#four")
    const five = document.querySelector("#five")
    const results = []

    selectAll([one, two])
      .datum(function (d, i) {
        return "parent-" + i
      })
      .selectAll("child")
      .data(function (d, i) {
        return [0, 1].map(function (j) {
          return "child-" + i + "-" + j
        })
      })
      .attr("foo", function (d, i, nodes) {
        results.push([this, d, i, nodes])
      })

    assert.deepStrictEqual(results, [
      [three, "child-0-0", 0, [three, four]],
      [four, "child-0-1", 1, [three, four]],
      [five, "child-1-0", 0, [five, ,]],
    ])
  }
)
import assert from "assert"
import { select } from "../../src/index.js"
import it from "../jsdom.js"

it("selection.call(function) calls the specified function, passing the selection", () => {
  let result
  const s = select(document)
  assert.strictEqual(
    s.call(s => {
      result = s
    }),
    s
  )
  assert.strictEqual(result, s)
})

it("selection.call(function, arguments…) calls the specified function, passing the additional arguments", () => {
  const result = []
  const foo = {}
  const bar = {}
  const s = select(document)
  assert.strictEqual(
    s.call(
      (s, a, b) => {
        result.push(s, a, b)
      },
      foo,
      bar
    ),
    s
  )
  assert.deepStrictEqual(result, [s, foo, bar])
})
import assert from "assert"
import { select, selectAll } from "../../src/index.js"
import it from "../jsdom.js"

it(
  "selection.classed(classes) returns true if and only if the first element has the specified classes",
  "<h1 class='c1 c2'>hello</h1><h1 class='c3'></h1>",
  () => {
    assert.strictEqual(select(document).select("h1").classed(""), true)
    assert.strictEqual(select(document).select("h1").classed("c1"), true)
    assert.strictEqual(select(document).select("h1").classed("c2"), true)
    assert.strictEqual(select(document).select("h1").classed("c3"), false)
    assert.strictEqual(select(document).select("h1").classed("c1 c2"), true)
    assert.strictEqual(select(document).select("h1").classed("c2 c1"), true)
    assert.strictEqual(select(document).select("h1").classed("c1 c3"), false)
    assert.strictEqual(selectAll([null, document]).select("h1").classed("c1"), true)
    assert.strictEqual(selectAll([null, document]).select("h1").classed("c2"), true)
    assert.strictEqual(selectAll([null, document]).select("h1").classed("c3"), false)
  }
)

it(
  "selection.classed(classes) coerces the specified classes to a string",
  "<h1 class='c1 c2'>hello</h1><h1 class='c3'></h1>",
  () => {
    assert.strictEqual(
      select(document)
        .select("h1")
        .classed({
          toString: function () {
            return "c1 c2"
          },
        }),
      true
    )
  }
)

it("selection.classed(classes) gets the class attribute if classList is not supported", () => {
  const node = new MockNode("c1 c2")
  assert.strictEqual(select(node).classed(""), true)
  assert.strictEqual(select(node).classed("c1"), true)
  assert.strictEqual(select(node).classed("c2"), true)
  assert.strictEqual(select(node).classed("c3"), false)
  assert.strictEqual(select(node).classed("c1 c2"), true)
  assert.strictEqual(select(node).classed("c2 c1"), true)
  assert.strictEqual(select(node).classed("c1 c3"), false)
})

it("selection.classed(classes, value) sets whether the selected elements have the specified classes", () => {
  const s = select(document.body)
  assert.strictEqual(s.classed("c1"), false)
  assert.strictEqual(s.attr("class"), null)
  assert.strictEqual(s.classed("c1", true), s)
  assert.strictEqual(s.classed("c1"), true)
  assert.strictEqual(s.attr("class"), "c1")
  assert.strictEqual(s.classed("c1 c2", true), s)
  assert.strictEqual(s.classed("c1"), true)
  assert.strictEqual(s.classed("c2"), true)
  assert.strictEqual(s.classed("c1 c2"), true)
  assert.strictEqual(s.attr("class"), "c1 c2")
  assert.strictEqual(s.classed("c1", false), s)
  assert.strictEqual(s.classed("c1"), false)
  assert.strictEqual(s.classed("c2"), true)
  assert.strictEqual(s.classed("c1 c2"), false)
  assert.strictEqual(s.attr("class"), "c2")
  assert.strictEqual(s.classed("c1 c2", false), s)
  assert.strictEqual(s.classed("c1"), false)
  assert.strictEqual(s.classed("c2"), false)
  assert.strictEqual(s.attr("class"), "")
})

it("selection.classed(classes, function) sets whether the selected elements have the specified classes", () => {
  const s = select(document.body)
  assert.strictEqual(
    s.classed("c1 c2", () => true),
    s
  )
  assert.strictEqual(s.attr("class"), "c1 c2")
  assert.strictEqual(
    s.classed("c1 c2", () => false),
    s
  )
  assert.strictEqual(s.attr("class"), "")
})

it(
  "selection.classed(classes, function) passes the value function data, index and group",
  "<parent id='one'><child id='three'></child><child id='four'></child></parent><parent id='two'><child id='five'></child></parent>",
  () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const three = document.querySelector("#three")
    const four = document.querySelector("#four")
    const five = document.querySelector("#five")
    const results = []

    selectAll([one, two])
      .datum(function (d, i) {
        return "parent-" + i
      })
      .selectAll("child")
      .data(function (d, i) {
        return [0, 1].map(function (j) {
          return "child-" + i + "-" + j
        })
      })
      .classed("c1 c2", function (d, i, nodes) {
        results.push([this, d, i, nodes])
      })

    assert.deepStrictEqual(results, [
      [three, "child-0-0", 0, [three, four]],
      [four, "child-0-1", 1, [three, four]],
      [five, "child-1-0", 0, [five, ,]],
    ])
  }
)

it("selection.classed(classes, value) sets the class attribute if classList is not supported", () => {
  const node = new MockNode(null)
  const s = select(node)
  assert.strictEqual(s.classed("c1"), false)
  assert.strictEqual(s.attr("class"), null)
  assert.strictEqual(s.classed("c1", true), s)
  assert.strictEqual(s.classed("c1"), true)
  assert.strictEqual(s.attr("class"), "c1")
  assert.strictEqual(s.classed("c1 c2", true), s)
  assert.strictEqual(s.classed("c1"), true)
  assert.strictEqual(s.classed("c2"), true)
  assert.strictEqual(s.classed("c1 c2"), true)
  assert.strictEqual(s.attr("class"), "c1 c2")
  assert.strictEqual(s.classed("c1", false), s)
  assert.strictEqual(s.classed("c1"), false)
  assert.strictEqual(s.classed("c2"), true)
  assert.strictEqual(s.classed("c1 c2"), false)
  assert.strictEqual(s.attr("class"), "c2")
  assert.strictEqual(s.classed("c1 c2", false), s)
  assert.strictEqual(s.classed("c1"), false)
  assert.strictEqual(s.classed("c2"), false)
  assert.strictEqual(s.attr("class"), "")
})

it("selection.classed(classes, value) coerces the specified classes to a string", "<h1>hello</h1>", () => {
  const s = select(document).select("h1")
  assert.strictEqual(s.classed("c1 c2"), false)
  assert.strictEqual(
    s.classed(
      {
        toString: function () {
          return "c1 c2"
        },
      },
      true
    ),
    s
  )
  assert.strictEqual(s.classed("c1 c2"), true)
})

class MockNode {
  constructor(classes) {
    this._classes = classes
  }
  getAttribute(name) {
    return name === "class" ? this._classes : null
  }
  setAttribute(name, value) {
    if (name === "class") this._classes = value
  }
}
import assert from "assert"
import { select, selectAll } from "../../src/index.js"
import { assertSelection, enterNode } from "../asserts.js"
import it from "../jsdom.js"

it(
  "selection.data(values) binds the specified values to the selected elements by index",
  "<div id='one'></div><div id='two'></div><div id='three'></div>",
  () => {
    const one = document.body.querySelector("#one")
    const two = document.body.querySelector("#two")
    const three = document.body.querySelector("#three")
    const selection = select(document.body).selectAll("div").data(["foo", "bar", "baz"])
    assert.strictEqual(one.__data__, "foo")
    assert.strictEqual(two.__data__, "bar")
    assert.strictEqual(three.__data__, "baz")
    assertSelection(selection, {
      groups: [[one, two, three]],
      parents: [document.body],
      enter: [[, , ,]],
      exit: [[, , ,]],
    })
  }
)

it(
  "selection.data(values) accepts an iterable",
  "<div id='one'></div><div id='two'></div><div id='three'></div>",
  () => {
    const selection = select(document.body)
      .selectAll("div")
      .data(new Set(["foo", "bar", "baz"]))
    assert.deepStrictEqual(selection.data(), ["foo", "bar", "baz"])
  }
)

it("selection.data(null) is not allowed", "<div id='one'></div><div id='two'></div><div id='three'></div>", () => {
  assert.throws(() => {
    select(document.body).selectAll("div").data(null)
  }, /null/)
})

it("selection.data() returns the bound data", "<div id='one'></div><div id='two'></div><div id='three'></div>", () => {
  const selection = select(document.body).selectAll("div").data(["foo", "bar", "baz"])
  assert.deepStrictEqual(selection.data(), ["foo", "bar", "baz"])
})

it(
  "selection.data(values) puts unbound data in the enter selection",
  "<div id='one'></div><div id='two'></div>",
  () => {
    const one = document.body.querySelector("#one")
    const two = document.body.querySelector("#two")
    const selection = select(document.body).selectAll("div").data(["foo", "bar", "baz"])
    assert.strictEqual(one.__data__, "foo")
    assert.strictEqual(two.__data__, "bar")
    assertSelection(selection, {
      groups: [[one, two, ,]],
      parents: [document.body],
      enter: [[, , enterNode(document.body, "baz")]],
      exit: [[, ,]],
    })
  }
)

it(
  "selection.data(values) puts unbound elements in the exit selection",
  "<div id='one'></div><div id='two'></div><div id='three'></div>",
  () => {
    const one = document.body.querySelector("#one")
    const two = document.body.querySelector("#two")
    const three = document.body.querySelector("#three")
    const selection = select(document.body).selectAll("div").data(["foo", "bar"])
    assert.strictEqual(one.__data__, "foo")
    assert.strictEqual(two.__data__, "bar")
    assertSelection(selection, {
      groups: [[one, two]],
      parents: [document.body],
      enter: [[, ,]],
      exit: [[, , three]],
    })
  }
)

it(
  "selection.data(values) binds the specified values to each group independently",
  "<div id='zero'><span id='one'></span><span id='two'></span></div><div id='three'><span id='four'></span><span id='five'></span></div>",
  () => {
    const zero = document.body.querySelector("#zero")
    const one = document.body.querySelector("#one")
    const two = document.body.querySelector("#two")
    const three = document.body.querySelector("#three")
    const four = document.body.querySelector("#four")
    const five = document.body.querySelector("#five")
    const selection = select(document.body).selectAll("div").selectAll("span").data(["foo", "bar"])
    assert.strictEqual(one.__data__, "foo")
    assert.strictEqual(two.__data__, "bar")
    assert.strictEqual(four.__data__, "foo")
    assert.strictEqual(five.__data__, "bar")
    assertSelection(selection, {
      groups: [
        [one, two],
        [four, five],
      ],
      parents: [zero, three],
      enter: [
        [, ,],
        [, ,],
      ],
      exit: [
        [, ,],
        [, ,],
      ],
    })
  }
)

it(
  "selection.data(function) binds the specified return values to the selected elements by index",
  "<div id='one'></div><div id='two'></div><div id='three'></div>",
  () => {
    const one = document.body.querySelector("#one")
    const two = document.body.querySelector("#two")
    const three = document.body.querySelector("#three")
    const selection = select(document.body)
      .selectAll("div")
      .data(function () {
        return ["foo", "bar", "baz"]
      })
    assert.strictEqual(one.__data__, "foo")
    assert.strictEqual(two.__data__, "bar")
    assert.strictEqual(three.__data__, "baz")
    assertSelection(selection, {
      groups: [[one, two, three]],
      parents: [document.body],
      enter: [[, , ,]],
      exit: [[, , ,]],
    })
  }
)

it(
  "selection.data(function) passes the values function datum, index and parents",
  "<parent id='one'><child></child><child></child></parent><parent id='two'><child></child></parent>",
  () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const results = []

    selectAll([one, two])
      .datum(function (d, i) {
        return "parent-" + i
      })
      .selectAll("child")
      .data(function (d, i, nodes) {
        results.push([this, d, i, nodes])
        return ["foo", "bar"]
      })

    assert.deepStrictEqual(results, [
      [one, "parent-0", 0, [one, two]],
      [two, "parent-1", 1, [one, two]],
    ])
  }
)

it(
  "selection.data(values, function) joins data to element using the computed keys",
  "<node id='one'></node><node id='two'></node><node id='three'></node>",
  () => {
    const one = document.body.querySelector("#one")
    const two = document.body.querySelector("#two")
    const three = document.body.querySelector("#three")
    const selection = select(document.body)
      .selectAll("node")
      .data(["one", "four", "three"], function (d) {
        return d || this.id
      })
    assertSelection(selection, {
      groups: [[one, , three]],
      parents: [document.body],
      enter: [[, enterNode(document.body, "four", "#three"), ,]],
      exit: [[, two, ,]],
    })
  }
)

it(
  "selection.data(values, function) puts elements with duplicate keys into update or exit",
  "<node id='one' name='foo'></node><node id='two' name='foo'></node><node id='three' name='bar'></node>",
  () => {
    const one = document.body.querySelector("#one")
    const two = document.body.querySelector("#two")
    const three = document.body.querySelector("#three")
    const selection = select(document.body)
      .selectAll("node")
      .data(["foo"], function (d) {
        return d || this.getAttribute("name")
      })
    assertSelection(selection, {
      groups: [[one]],
      parents: [document.body],
      enter: [[,]],
      exit: [[, two, three]],
    })
  }
)

it(
  "selection.data(values, function) puts elements with duplicate keys into exit",
  "<node id='one' name='foo'></node><node id='two' name='foo'></node><node id='three' name='bar'></node>",
  () => {
    const one = document.body.querySelector("#one")
    const two = document.body.querySelector("#two")
    const three = document.body.querySelector("#three")
    const selection = select(document.body)
      .selectAll("node")
      .data(["bar"], function (d) {
        return d || this.getAttribute("name")
      })
    assertSelection(selection, {
      groups: [[three]],
      parents: [document.body],
      enter: [[,]],
      exit: [[one, two, ,]],
    })
  }
)

it(
  "selection.data(values, function) puts data with duplicate keys into update and enter",
  "<node id='one'></node><node id='two'></node><node id='three'></node>",
  () => {
    const one = document.body.querySelector("#one")
    const two = document.body.querySelector("#two")
    const three = document.body.querySelector("#three")
    const selection = select(document.body)
      .selectAll("node")
      .data(["one", "one", "two"], function (d) {
        return d || this.id
      })
    assertSelection(selection, {
      groups: [[one, , two]],
      parents: [document.body],
      enter: [[, enterNode(document.body, "one", two), ,]],
      exit: [[, , three]],
    })
  }
)

it(
  "selection.data(values, function) puts data with duplicate keys into enter",
  "<node id='one'></node><node id='two'></node><node id='three'></node>",
  () => {
    const one = document.body.querySelector("#one")
    const two = document.body.querySelector("#two")
    const three = document.body.querySelector("#three")
    const selection = select(document.body)
      .selectAll("node")
      .data(["foo", "foo", "two"], function (d) {
        return d || this.id
      })
    assertSelection(selection, {
      groups: [[, , two]],
      parents: [document.body],
      enter: [[enterNode(document.body, "foo", two), enterNode(document.body, "foo", two), ,]],
      exit: [[one, , three]],
    })
  }
)

it(
  "selection.data(values, function) passes the key function datum, index and nodes or data",
  "<node id='one'></node><node id='two'></node>",
  () => {
    const one = document.body.querySelector("#one")
    const two = document.body.querySelector("#two")
    const results = []

    select(one).datum("foo")

    select(document.body)
      .selectAll("node")
      .data(["foo", "bar"], function (d, i, nodes) {
        results.push([this, d, i, [...nodes]])
        return d || this.id
      })

    assert.deepStrictEqual(results, [
      [one, "foo", 0, [one, two]],
      [two, undefined, 1, [one, two]],
      [document.body, "foo", 0, ["foo", "bar"]],
      [document.body, "bar", 1, ["foo", "bar"]],
    ])
  }
)

it(
  "selection.data(values, function) applies the order of the data",
  "<div id='one'></div><div id='two'></div><div id='three'></div>",
  () => {
    const one = document.body.querySelector("#one")
    const two = document.body.querySelector("#two")
    const three = document.body.querySelector("#three")
    const selection = select(document.body)
      .selectAll("div")
      .data(["four", "three", "one", "five", "two"], function (d) {
        return d || this.id
      })
    assertSelection(selection, {
      groups: [[, three, one, , two]],
      parents: [document.body],
      enter: [[enterNode(document.body, "four", three), , , enterNode(document.body, "five", two), ,]],
      exit: [[, , ,]],
    })
  }
)

it(
  "selection.data(values) returns a new selection, and does not modify the original selection",
  "<h1 id='one'></h1><h1 id='two'></h1>",
  () => {
    const root = document.documentElement
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const selection0 = select(root).selectAll("h1")
    const selection1 = selection0.data([1, 2, 3])
    const selection2 = selection1.data([1])
    assertSelection(selection0, {
      groups: [[one, two]],
      parents: [root],
    })
    assertSelection(selection1, {
      groups: [[one, two, ,]],
      parents: [root],
      enter: [[, , enterNode(root, 3)]],
      exit: [[, ,]],
    })
    assertSelection(selection2, {
      groups: [[one]],
      parents: [root],
      enter: [[,]],
      exit: [[, two, ,]],
    })
  }
)

it(
  "selection.data(values, key) does not modify the groups array in-place",
  "<h1 id='one'></h1><h1 id='two'></h1>",
  () => {
    const root = document.documentElement
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const key = function (d, i) {
      return i
    }
    const selection0 = select(root).selectAll("h1")
    const selection1 = selection0.data([1, 2, 3], key)
    const selection2 = selection1.data([1], key)
    assertSelection(selection0, {
      groups: [[one, two]],
      parents: [root],
    })
    assertSelection(selection1, {
      groups: [[one, two, ,]],
      parents: [root],
      enter: [[, , enterNode(root, 3)]],
      exit: [[, ,]],
    })
    assertSelection(selection2, {
      groups: [[one]],
      parents: [root],
      enter: [[,]],
      exit: [[, two, ,]],
    })
  }
)
import assert from "assert"
import { select, selectAll } from "../../src/index.js"
import it from "../jsdom.js"

it("selection.datum() returns the datum on the first selected element", () => {
  const node = { __data__: "hello" }
  assert.strictEqual(select(node).datum(), "hello")
  assert.strictEqual(selectAll([null, node]).datum(), "hello")
})

it("selection.datum(value) sets datum on the selected elements", () => {
  const one = { __data__: "" }
  const two = { __data__: "" }
  const selection = selectAll([one, two])
  assert.strictEqual(selection.datum("bar"), selection)
  assert.strictEqual(one.__data__, "bar")
  assert.strictEqual(two.__data__, "bar")
})

it("selection.datum(null) clears the datum on the selected elements", () => {
  const one = { __data__: "bar" }
  const two = { __data__: "bar" }
  const selection = selectAll([one, two])
  assert.strictEqual(selection.datum(null), selection)
  assert.strictEqual("__data__" in one, false)
  assert.strictEqual("__data__" in two, false)
})

it("selection.datum(function) sets the value of the datum on the selected elements", () => {
  const one = { __data__: "bar" }
  const two = { __data__: "bar" }
  const selection = selectAll([one, two])
  assert.strictEqual(
    selection.datum((d, i) => (i ? "baz" : null)),
    selection
  )
  assert.strictEqual("__data__" in one, false)
  assert.strictEqual(two.__data__, "baz")
})

it(
  "selection.datum(function) passes the value function data, index and group",
  "<parent id='one'><child id='three'></child><child id='four'></child></parent><parent id='two'><child id='five'></child></parent>",
  () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const three = document.querySelector("#three")
    const four = document.querySelector("#four")
    const five = document.querySelector("#five")
    const results = []

    selectAll([one, two])
      .datum(function (d, i) {
        return "parent-" + i
      })
      .selectAll("child")
      .data(function (d, i) {
        return [0, 1].map(function (j) {
          return "child-" + i + "-" + j
        })
      })
      .datum(function (d, i, nodes) {
        results.push([this, d, i, nodes])
      })

    assert.deepStrictEqual(results, [
      [three, "child-0-0", 0, [three, four]],
      [four, "child-0-1", 1, [three, four]],
      [five, "child-1-0", 0, [five, ,]],
    ])
  }
)
import assert from "assert"
import { selectAll } from "../../src/index.js"
import it from "../jsdom.js"

it(
  "selection.dispatch(type) dispatches a custom event of the specified type to each selected element in order",
  "<h1 id='one'></h1><h1 id='two'></h1>",
  () => {
    let event
    const result = []
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const selection = selectAll([one, two])
      .datum((d, i) => `node-${i}`)
      .on("bang", function (e, d) {
        event = e
        result.push(this, d)
      })
    assert.strictEqual(selection.dispatch("bang"), selection)
    assert.deepStrictEqual(result, [one, "node-0", two, "node-1"])
    assert.strictEqual(event.type, "bang")
    assert.strictEqual(event.bubbles, false)
    assert.strictEqual(event.cancelable, false)
    assert.strictEqual(event.detail, null)
  }
)

it(
  "selection.dispatch(type, params) dispatches a custom event with the specified constant parameters",
  "<h1 id='one'></h1><h1 id='two'></h1>",
  () => {
    let event
    const result = []
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const selection = selectAll([one, two])
      .datum((d, i) => `node-${i}`)
      .on("bang", function (e, d) {
        event = e
        result.push(this, d)
      })
    assert.strictEqual(selection.dispatch("bang", { bubbles: true, cancelable: true, detail: "loud" }), selection)
    assert.deepStrictEqual(result, [one, "node-0", two, "node-1"])
    assert.strictEqual(event.type, "bang")
    assert.strictEqual(event.bubbles, true)
    assert.strictEqual(event.cancelable, true)
    assert.strictEqual(event.detail, "loud")
  }
)

it(
  "selection.dispatch(type, function) dispatches a custom event with the specified parameter function",
  "<h1 id='one'></h1><h1 id='two'></h1>",
  () => {
    const result = []
    const events = []
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const selection = selectAll([one, two])
      .datum((d, i) => `node-${i}`)
      .on("bang", function (e, d) {
        events.push(e)
        result.push(this, d)
      })
    assert.strictEqual(
      selection.dispatch("bang", (d, i) => ({ bubbles: true, cancelable: true, detail: "loud-" + i })),
      selection
    )
    assert.deepStrictEqual(result, [one, "node-0", two, "node-1"])
    assert.strictEqual(events[0].type, "bang")
    assert.strictEqual(events[0].bubbles, true)
    assert.strictEqual(events[0].cancelable, true)
    assert.strictEqual(events[0].detail, "loud-0")
    assert.strictEqual(events[1].type, "bang")
    assert.strictEqual(events[1].bubbles, true)
    assert.strictEqual(events[1].cancelable, true)
    assert.strictEqual(events[1].detail, "loud-1")
  }
)

it("selection.dispatch(type) skips missing elements", "<h1 id='one'></h1><h1 id='two'></h1>", () => {
  let event
  const result = []
  const one = document.querySelector("#one")
  const two = document.querySelector("#two")
  const selection = selectAll([, one, , two])
    .datum((d, i) => `node-${i}`)
    .on("bang", function (e, d) {
      event = e
      result.push(this, d)
    })
  assert.strictEqual(selection.dispatch("bang"), selection)
  assert.deepStrictEqual(result, [one, "node-1", two, "node-3"])
  assert.strictEqual(event.type, "bang")
  assert.strictEqual(event.detail, null)
})
import assert from "assert"
import { selectAll } from "../../src/index.js"
import it from "../jsdom.js"

it(
  "selection.each(function) calls the specified function for each selected element in order",
  "<h1 id='one'></h1><h1 id='two'></h1>",
  () => {
    const result = []
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const selection = selectAll([one, two]).datum(function (d, i) {
      return "node-" + i
    })
    assert.strictEqual(
      selection.each(function (d, i, nodes) {
        result.push(this, d, i, nodes)
      }),
      selection
    )
    assert.deepStrictEqual(result, [one, "node-0", 0, [one, two], two, "node-1", 1, [one, two]])
  }
)

it("selection.each(function) skips missing elements", "<h1 id='one'></h1><h1 id='two'></h1>", () => {
  const result = []
  const one = document.querySelector("#one")
  const two = document.querySelector("#two")
  const selection = selectAll([, one, , two]).datum(function (d, i) {
    return "node-" + i
  })
  assert.strictEqual(
    selection.each(function (d, i, nodes) {
      result.push(this, d, i, nodes)
    }),
    selection
  )
  assert.deepStrictEqual(result, [one, "node-1", 1, [, one, , two], two, "node-3", 3, [, one, , two]])
})
import assert from "assert"
import { select, selectAll } from "../../src/index.js"
import it from "../jsdom.js"

it("selection.empty() return false if the selection is not empty", "<h1 id='one'></h1><h1 id='two'></h1>", () => {
  assert.strictEqual(select(document).empty(), false)
})

it("selection.empty() return true if the selection is empty", "<h1 id='one'></h1><h1 id='two'></h1>", () => {
  assert.strictEqual(select(null).empty(), true)
  assert.strictEqual(selectAll([]).empty(), true)
  assert.strictEqual(selectAll([,]).empty(), true)
})
import assert from "assert"
import { select } from "../../src/index.js"
import { assertSelection, enterNode } from "../asserts.js"
import it from "../jsdom.js"

it("selection.enter() returns an empty selection before a data-join", "<h1>hello</h1>", () => {
  const s = select(document.body)
  assertSelection(s.enter(), { groups: [[,]], parents: [null] })
})

it("selection.enter() contains EnterNodes", () => {
  const s = select(document.body).selectAll("div").data([1, 2, 3])
  assert.strictEqual(s.enter().node()._parent, document.body)
})

it("selection.enter() shares the update selection’s parents", "<h1>hello</h1>", () => {
  const s = select(document.body)
  assert.strictEqual(s.enter()._parents, s._parents)
})

it("selection.enter() returns the same selection each time", "<h1>hello</h1>", () => {
  const s = select(document.body)
  assert.deepStrictEqual(s.enter(), s.enter())
})

it("selection.enter() contains unbound data after a data-join", "<div id='one'></div><div id='two'></div>", () => {
  const s = select(document.body).selectAll("div").data(["foo", "bar", "baz"])
  assertSelection(s.enter(), {
    groups: [[, , enterNode(document.body, "baz")]],
    parents: [document.body],
  })
})

it(
  "selection.enter() uses the order of the data",
  "<div id='one'></div><div id='two'></div><div id='three'></div>",
  () => {
    const selection = select(document.body)
      .selectAll("div")
      .data(["one", "four", "three", "five"], function (d) {
        return d || this.id
      })
    assertSelection(selection.enter(), {
      groups: [[, enterNode(document.body, "four", "#three"), , enterNode(document.body, "five")]],
      parents: [document.body],
    })
  }
)

it("enter.append(…) inherits the namespaceURI from the parent", () => {
  const root = select(document.body).append("div")
  const svg = root.append("svg")
  const g = svg.selectAll("g").data(["foo"]).enter().append("g")
  assert.strictEqual(root.node().namespaceURI, "http://www.w3.org/1999/xhtml")
  assert.strictEqual(svg.node().namespaceURI, "http://www.w3.org/2000/svg")
  assert.strictEqual(g.node().namespaceURI, "http://www.w3.org/2000/svg")
})

it("enter.append(…) does not override an explicit namespace", () => {
  const root = select(document.body).append("div")
  const svg = root.append("svg")
  const g = svg.selectAll("g").data(["foo"]).enter().append("xhtml:g")
  assert.strictEqual(root.node().namespaceURI, "http://www.w3.org/1999/xhtml")
  assert.strictEqual(svg.node().namespaceURI, "http://www.w3.org/2000/svg")
  assert.strictEqual(g.node().namespaceURI, "http://www.w3.org/1999/xhtml")
})

it("enter.append(…) inserts entering nodes before the next node in the update selection", () => {
  const identity = function (d) {
    return d
  }
  let p = select(document.body).selectAll("p")
  p = p.data([1, 3], identity)
  p = p.enter().append("p").text(identity).merge(p)
  p = p.data([0, 1, 2, 3, 4], identity)
  p = p.enter().append("p").text(identity).merge(p)
  p
  assert.strictEqual(document.body.innerHTML, "<p>0</p><p>1</p><p>2</p><p>3</p><p>4</p>")
})

it("enter.insert(…, before) inserts entering nodes before the sibling matching the specified selector", "<hr>", () => {
  const identity = function (d) {
    return d
  }
  let p = select(document.body).selectAll("p")
  p = p.data([1, 3], identity)
  p = p.enter().insert("p", "hr").text(identity).merge(p)
  p = p.data([0, 1, 2, 3, 4], identity)
  p = p.enter().insert("p", "hr").text(identity).merge(p)
  p
  assert.strictEqual(document.body.innerHTML, "<p>1</p><p>3</p><p>0</p><p>2</p><p>4</p><hr>")
})

it("enter.insert(…, null) inserts entering nodes after the last child", () => {
  const identity = function (d) {
    return d
  }
  let p = select(document.body).selectAll("p")
  p = p.data([1, 3], identity)
  p = p.enter().insert("p", null).text(identity).merge(p)
  p = p.data([0, 1, 2, 3, 4], identity)
  p = p.enter().insert("p", null).text(identity).merge(p)
  p
  assert.strictEqual(document.body.innerHTML, "<p>1</p><p>3</p><p>0</p><p>2</p><p>4</p>")
})
import assert from "assert"
import { select } from "../../src/index.js"
import { assertSelection } from "../asserts.js"
import it from "../jsdom.js"

it("selection.exit() returns an empty selection before a data-join", "<h1>hello</h1>", () => {
  const selection = select(document.body)
  assertSelection(selection.exit(), { groups: [[,]] })
})

it("selection.exit() shares the update selection’s parents", "<h1>hello</h1>", () => {
  const selection = select(document.body)
  assert.strictEqual(selection.exit()._parents, selection._parents)
})

it("selection.exit() returns the same selection each time", "<h1>hello</h1>", () => {
  const selection = select(document.body)
  assert.deepStrictEqual(selection.exit(), selection.exit())
})

it("selection.exit() contains unbound elements after a data-join", "<div id='one'></div><div id='two'></div>", () => {
  const selection = select(document.body).selectAll("div").data(["foo"])
  assertSelection(selection.exit(), { groups: [[, document.body.querySelector("#two")]], parents: [document.body] })
})

it(
  "selection.exit() uses the order of the originating selection",
  "<div id='one'></div><div id='two'></div><div id='three'></div>",
  () => {
    const selection = select(document.body)
      .selectAll("div")
      .data(["three", "one"], function (d) {
        return d || this.id
      })
    assertSelection(selection.exit(), {
      groups: [[, document.body.querySelector("#two"), ,]],
      parents: [document.body],
    })
  }
)
import assert from "assert"
import { select, selection, selectAll } from "../../src/index.js"
import { assertSelection } from "../asserts.js"
import it from "../jsdom.js"

it("selection.filter(…) returns a selection", "<h1>hello</h1>", () => {
  assert(select(document.body).filter("body") instanceof selection)
})

it(
  "selection.filter(string) retains the selected elements that matches the selector string",
  "<h1><span id='one'></span><span id='two'></span></h1><h1><span id='three'></span><span id='four'></span></h1>",
  () => {
    const one = document.querySelector("#one")
    const three = document.querySelector("#three")
    assertSelection(select(document).selectAll("span").filter("#one,#three"), {
      groups: [[one, three]],
      parents: [document],
    })
  }
)

it(
  "selection.filter(function) retains elements for which the given function returns true",
  "<h1><span id='one'></span><span id='two'></span></h1><h1><span id='three'></span><span id='four'></span></h1>",
  () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const three = document.querySelector("#three")
    const four = document.querySelector("#four")
    assertSelection(
      selectAll([one, two, three, four]).filter(function (d, i) {
        return i & 1
      }),
      { groups: [[two, four]], parents: [null] }
    )
  }
)

it(
  "selection.filter(function) passes the selector function data, index and group",
  "<parent id='one'><child id='three'></child><child id='four'></child></parent><parent id='two'><child id='five'></child></parent>",
  () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const three = document.querySelector("#three")
    const four = document.querySelector("#four")
    const five = document.querySelector("#five")
    const results = []

    selectAll([one, two])
      .datum(function (d, i) {
        return "parent-" + i
      })
      .selectAll("child")
      .data(function (d, i) {
        return [0, 1].map(function (j) {
          return "child-" + i + "-" + j
        })
      })
      .filter(function (d, i, nodes) {
        results.push([this, d, i, nodes])
      })

    assert.deepStrictEqual(results, [
      [three, "child-0-0", 0, [three, four]],
      [four, "child-0-1", 1, [three, four]],
      [five, "child-1-0", 0, [five, ,]],
    ])
  }
)

it(
  "selection.filter(…) propagates parents from the originating selection",
  "<parent><child>1</child></parent><parent><child>2</child></parent>",
  () => {
    const parents = select(document).selectAll("parent")
    const parents2 = parents.filter(function () {
      return true
    })
    assertSelection(parents, { groups: [document.querySelectorAll("parent")], parents: [document] })
    assertSelection(parents2, { groups: [document.querySelectorAll("parent")], parents: [document] })
    assert(parents._parents === parents2._parents) // Not copied!
  }
)

it(
  "selection.filter(…) can filter elements when the originating selection is nested",
  "<parent id='one'><child><span id='three'></span></child></parent><parent id='two'><child><span id='four'></span></child></parent>",
  () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const three = document.querySelector("#three")
    const four = document.querySelector("#four")
    assertSelection(selectAll([one, two]).selectAll("span").filter("*"), {
      groups: [[three], [four]],
      parents: [one, two],
    })
  }
)

it(
  "selection.filter(…) skips missing originating elements and does not retain the original indexes",
  "<h1>hello</h1>",
  () => {
    const h1 = document.querySelector("h1")
    assertSelection(selectAll([, h1]).filter("*"), { groups: [[h1]], parents: [null] })
    assertSelection(selectAll([null, h1]).filter("*"), { groups: [[h1]], parents: [null] })
    assertSelection(selectAll([undefined, h1]).filter("*"), { groups: [[h1]], parents: [null] })
  }
)

it(
  "selection.filter(…) skips missing originating elements when the originating selection is nested",
  "<parent id='one'><child></child><child id='three'></child></parent><parent id='two'><child></child><child id='four'></child></parent>",
  () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const three = document.querySelector("#three")
    const four = document.querySelector("#four")
    assertSelection(
      selectAll([one, two])
        .selectAll("child")
        .select(function (d, i) {
          return i & 1 ? this : null
        })
        .filter("*"),
      { groups: [[three], [four]], parents: [one, two] }
    )
  }
)
import assert from "assert"
import { select, selectAll } from "../../src/index.js"
import it from "../jsdom.js"

it("selection.html() returns the inner HTML on the first selected element", () => {
  const node = { innerHTML: "hello" }
  assert.strictEqual(select(node).html(), "hello")
  assert.strictEqual(selectAll([null, node]).html(), "hello")
})

it("selection.html(value) sets inner HTML on the selected elements", () => {
  const one = { innerHTML: "" }
  const two = { innerHTML: "" }
  const selection = selectAll([one, two])
  assert.strictEqual(selection.html("bar"), selection)
  assert.strictEqual(one.innerHTML, "bar")
  assert.strictEqual(two.innerHTML, "bar")
})

it("selection.html(null) clears the inner HTML on the selected elements", () => {
  const one = { innerHTML: "bar" }
  const two = { innerHTML: "bar" }
  const selection = selectAll([one, two])
  assert.strictEqual(selection.html(null), selection)
  assert.strictEqual(one.innerHTML, "")
  assert.strictEqual(two.innerHTML, "")
})

it("selection.html(function) sets the value of the inner HTML on the selected elements", () => {
  const one = { innerHTML: "bar" }
  const two = { innerHTML: "bar" }
  const selection = selectAll([one, two])
  assert.strictEqual(
    selection.html(function (d, i) {
      return i ? "baz" : null
    }),
    selection
  )
  assert.strictEqual(one.innerHTML, "")
  assert.strictEqual(two.innerHTML, "baz")
})

it(
  "selection.html(function) passes the value function data, index and group",
  "<parent id='one'><child id='three'></child><child id='four'></child></parent><parent id='two'><child id='five'></child></parent>",
  () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const three = document.querySelector("#three")
    const four = document.querySelector("#four")
    const five = document.querySelector("#five")
    const results = []

    selectAll([one, two])
      .datum(function (d, i) {
        return "parent-" + i
      })
      .selectAll("child")
      .data(function (d, i) {
        return [0, 1].map(function (j) {
          return "child-" + i + "-" + j
        })
      })
      .html(function (d, i, nodes) {
        results.push([this, d, i, nodes])
      })

    assert.deepStrictEqual(results, [
      [three, "child-0-0", 0, [three, four]],
      [four, "child-0-1", 1, [three, four]],
      [five, "child-1-0", 0, [five, ,]],
    ])
  }
)
import assert from "assert"
import { select, selection } from "../../src/index.js"
import it from "../jsdom.js"

it("selection() returns a selection of the document element", "", () => {
  assert.strictEqual(selection().node(), document.documentElement)
})

it("selection.prototype can be extended", "<input type='checkbox'>", () => {
  const s = select(document.querySelector("[type=checkbox]"))
  try {
    selection.prototype.checked = function (value) {
      return arguments.length ? this.property("checked", !!value) : this.property("checked")
    }
    assert.strictEqual(s.checked(), false)
    assert.strictEqual(s.checked(true), s)
    assert.strictEqual(s.checked(), true)
  } finally {
    delete selection.prototype.checked
  }
})

it("selection() returns an instanceof selection", "", () => {
  assert(selection() instanceof selection)
})
import assert from "assert"
import { selectAll } from "../../src/index.js"
import { assertSelection } from "../asserts.js"
import it from "../jsdom.js"

it(
  "selection.insert(name, before) inserts a new element of the specified name before the specified child of each selected element",
  "<div id='one'><span class='before'></span></div><div id='two'><span class='before'></span></div>",
  () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const selection = selectAll([one, two]).insert("span", ".before")
    const three = one.querySelector("span:first-child")
    const four = two.querySelector("span:first-child")
    assertSelection(selection, { groups: [[three, four]], parents: [null] })
  }
)

it(
  "selection.insert(function, function) inserts the returned element before the specified child of each selected element",
  "<div id='one'><span class='before'></span></div><div id='two'><span class='before'></span></div>",
  () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const selection = selectAll([one, two]).insert(
      function () {
        return document.createElement("SPAN")
      },
      function () {
        return this.firstChild
      }
    )
    const three = one.querySelector("span:first-child")
    const four = two.querySelector("span:first-child")
    assertSelection(selection, { groups: [[three, four]], parents: [null] })
  }
)

it(
  "selection.insert(function, function) inserts the returned element as the last child if the selector function returns null",
  "<div id='one'><span class='before'></span></div><div id='two'><span class='before'></span></div>",
  () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const selection = selectAll([one, two]).insert(
      function () {
        return document.createElement("SPAN")
      },
      function () {
        return
      }
    )
    const three = one.querySelector("span:last-child")
    const four = two.querySelector("span:last-child")
    assertSelection(selection, { groups: [[three, four]], parents: [null] })
  }
)

it(
  "selection.insert(name, function) passes the selector function data, index and group",
  "<parent id='one'><child id='three'></child><child id='four'></child></parent><parent id='two'><child id='five'></child></parent>",
  () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const three = document.querySelector("#three")
    const four = document.querySelector("#four")
    const five = document.querySelector("#five")
    const results = []

    selectAll([one, two])
      .datum(function (d, i) {
        return "parent-" + i
      })
      .selectAll("child")
      .data(function (d, i) {
        return [0, 1].map(function (j) {
          return "child-" + i + "-" + j
        })
      })
      .insert("span", function (d, i, nodes) {
        results.push([this, d, i, nodes])
      })

    assert.deepStrictEqual(results, [
      [three, "child-0-0", 0, [three, four]],
      [four, "child-0-1", 1, [three, four]],
      [five, "child-1-0", 0, [five, ,]],
    ])
  }
)
import assert from "assert"
import { selectAll } from "../../src/index.js"
import it from "../jsdom.js"

it("selection are iterable over the selected nodes", "<h1 id='one'></h1><h1 id='two'></h1>", () => {
  const one = document.querySelector("#one")
  const two = document.querySelector("#two")
  assert.deepStrictEqual([...selectAll([one, two])], [one, two])
})

it(
  "selection iteration merges nodes from all groups into a single array",
  "<h1 id='one'></h1><h1 id='two'></h1>",
  () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    assert.deepStrictEqual(
      [
        ...selectAll([one, two]).selectAll(function () {
          return [this]
        }),
      ],
      [one, two]
    )
  }
)

it("selection iteration skips missing elements", "<h1 id='one'></h1><h1 id='two'></h1>", () => {
  const one = document.querySelector("#one")
  const two = document.querySelector("#two")
  assert.deepStrictEqual([...selectAll([, one, , two])], [one, two])
})
import assert from "assert"
import { select } from "../../src/index.js"
import it from "../jsdom.js"

it("selection.join(name) enter-appends elements", () => {
  let p = select(document.body).selectAll("p")
  p = p
    .data([1, 3])
    .join("p")
    .text(d => d)
  p
  assert.strictEqual(document.body.innerHTML, "<p>1</p><p>3</p>")
})

it("selection.join(name) exit-removes elements", "<p>1</p><p>2</p><p>3</p>", () => {
  let p = select(document.body).selectAll("p")
  p = p
    .data([1, 3])
    .join("p")
    .text(d => d)
  p
  assert.strictEqual(document.body.innerHTML, "<p>1</p><p>3</p>")
})

it("selection.join(enter, update, exit) calls the specified functions", "<p>1</p><p>2</p>", () => {
  let p = select(document.body)
    .selectAll("p")
    .datum(function () {
      return this.textContent
    })
  p = p
    .data([1, 3], d => d)
    .join(
      enter =>
        enter
          .append("p")
          .attr("class", "enter")
          .text(d => d),
      update => update.attr("class", "update"),
      exit => exit.attr("class", "exit")
    )
  p
  assert.strictEqual(document.body.innerHTML, '<p class="update">1</p><p class="exit">2</p><p class="enter">3</p>')
})

it("selection.join(…) reorders nodes to match the data", () => {
  let p = select(document.body).selectAll("p")
  p = p.data([1, 3], d => d).join(enter => enter.append("p").text(d => d))
  assert.strictEqual(document.body.innerHTML, "<p>1</p><p>3</p>")
  p = p.data([0, 3, 1, 2, 4], d => d).join(enter => enter.append("p").text(d => d))
  assert.strictEqual(document.body.innerHTML, "<p>0</p><p>3</p><p>1</p><p>2</p><p>4</p>")
  p
})

it("selection.join(enter, update, exit) allows callbacks to return a transition", "<p>1</p><p>2</p>", () => {
  let p = select(document.body)
    .selectAll("p")
    .datum(function () {
      return this.textContent
    })
  p = p
    .data([1, 3], d => d)
    .join(
      enter =>
        mockTransition(
          enter
            .append("p")
            .attr("class", "enter")
            .text(d => d)
        ),
      update => mockTransition(update.attr("class", "update")),
      exit => mockTransition(exit.attr("class", "exit"))
    )
  p
  assert.strictEqual(document.body.innerHTML, '<p class="update">1</p><p class="exit">2</p><p class="enter">3</p>')
})

function mockTransition(selection) {
  return {
    selection() {
      return selection
    },
  }
}
import assert from "assert"
import { select, selectAll } from "../../src/index.js"
import { assertSelection } from "../asserts.js"
import it from "../jsdom.js"

it(
  "selection.merge(selection) returns a new selection, merging the two selections",
  "<h1 id='one'>one</h1><h1 id='two'>two</h1>",
  () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const selection0 = select(document.body).selectAll("h1")
    const selection1 = selection0.select(function (d, i) {
      return i & 1 ? this : null
    })
    const selection2 = selection0.select(function (d, i) {
      return i & 1 ? null : this
    })
    assertSelection(selection1.merge(selection2), { groups: [[one, two]], parents: [document.body] })
    assertSelection(selection1, { groups: [[, two]], parents: [document.body] })
    assertSelection(selection2, { groups: [[one, ,]], parents: [document.body] })
  }
)

it(
  "selection.merge(selection) returns a selection with the same size and parents as this selection",
  "<div id='body0'><h1 name='one'>one</h1><h1 name='two'>two</h1></div><div id='body1'><h1 name='one'>one</h1><h1 name='two'>two</h1><h1 name='three'>three</h1></div>",
  () => {
    const body0 = document.querySelector("#body0")
    const body1 = document.querySelector("#body1")
    const one0 = body0.querySelector("[name='one']")
    const one1 = body1.querySelector("[name='one']")
    const two0 = body0.querySelector("[name='two']")
    const two1 = body1.querySelector("[name='two']")
    const three1 = body1.querySelector("[name='three']")
    assertSelection(select(body0).selectAll("h1").merge(select(body1).selectAll("h1")), {
      groups: [[one0, two0]],
      parents: [body0],
    })
    assertSelection(select(body1).selectAll("h1").merge(select(body0).selectAll("h1")), {
      groups: [[one1, two1, three1]],
      parents: [body1],
    })
  }
)

it(
  "selection.merge(selection) reuses groups from this selection if the other selection has fewer groups",
  "<parent><child></child><child></child></parent><parent><child></child><child></child></parent>",
  () => {
    const selection0 = selectAll("parent").selectAll("child")
    const selection1 = selectAll("parent:first-child").selectAll("child")
    const selection01 = selection0.merge(selection1)
    const selection10 = selection1.merge(selection0)
    assertSelection(selection01, selection0)
    assertSelection(selection10, selection1)
    assert.strictEqual(selection01._groups[1], selection0._groups[1])
  }
)

it(
  "selection.merge(selection) reuses this selection’s parents",
  "<parent><child></child><child></child></parent><parent><child></child><child></child></parent>",
  () => {
    const selection0 = selectAll("parent").selectAll("child")
    const selection1 = selectAll("parent:first-child").selectAll("child")
    const selection01 = selection0.merge(selection1)
    const selection10 = selection1.merge(selection0)
    assert.strictEqual(selection01._parents, selection0._parents)
    assert.strictEqual(selection10._parents, selection1._parents)
  }
)

it(
  "selection.merge(transition) returns a new selection, merging the two selections",
  "<h1 id='one'>one</h1><h1 id='two'>two</h1>",
  () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const selection0 = select(document.body).selectAll("h1")
    const selection1 = selection0.select(function (d, i) {
      return i & 1 ? this : null
    })
    const selection2 = selection0.select(function (d, i) {
      return i & 1 ? null : this
    })
    assertSelection(selection1.merge(mockTransition(selection2)), { groups: [[one, two]], parents: [document.body] })
  }
)

function mockTransition(selection) {
  return {
    selection() {
      return selection
    },
  }
}
import assert from "assert"
import { select, selectAll } from "../../src/index.js"
import it from "../jsdom.js"

it("selection.node() returns the first element in a selection", "<h1 id='one'></h1><h1 id='two'></h1>", () => {
  const one = document.querySelector("#one")
  const two = document.querySelector("#two")
  assert.strictEqual(selectAll([one, two]).node(), one)
})

it("selection.node() skips missing elements", "<h1 id='one'></h1><h1 id='two'></h1>", () => {
  const one = document.querySelector("#one")
  const two = document.querySelector("#two")
  assert.strictEqual(selectAll([, one, , two]).node(), one)
})

it("selection.node() skips empty groups", "<h1 id='one'></h1><h1 id='two'></h1>", () => {
  const one = document.querySelector("#one")
  const two = document.querySelector("#two")
  assert.strictEqual(
    selectAll([one, two])
      .selectAll(function (d, i) {
        return i ? [this] : []
      })
      .node(),
    two
  )
})

it("selection.node() returns null for an empty selection", () => {
  assert.strictEqual(select(null).node(), null)
  assert.strictEqual(selectAll([]).node(), null)
  assert.strictEqual(selectAll([, ,]).node(), null)
})
import assert from "assert"
import * as d3 from "../../src/index.js"
import it from "../jsdom.js"

it("selection.nodes() returns an array containing all selected nodes", "<h1 id='one'></h1><h1 id='two'></h1>", () => {
  const one = document.querySelector("#one")
  const two = document.querySelector("#two")
  assert.deepStrictEqual(d3.selectAll([one, two]).nodes(), [one, two])
})

it("selection.nodes() merges nodes from all groups into a single array", "<h1 id='one'></h1><h1 id='two'></h1>", () => {
  const one = document.querySelector("#one")
  const two = document.querySelector("#two")
  assert.deepStrictEqual(
    d3
      .selectAll([one, two])
      .selectAll(function () {
        return [this]
      })
      .nodes(),
    [one, two]
  )
})

it("selection.nodes() skips missing elements", "<h1 id='one'></h1><h1 id='two'></h1>", () => {
  const one = document.querySelector("#one")
  const two = document.querySelector("#two")
  assert.deepStrictEqual(d3.selectAll([, one, , two]).nodes(), [one, two])
})
import assert from "assert"
import { select, selectAll } from "../../src/index.js"
import it from "../jsdom.js"

it(
  "selection.on(type, listener) registers a listeners for the specified event type on each selected element",
  "<h1 id='one'></h1><h1 id='two'></h1>",
  () => {
    let clicks = 0
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const s = selectAll([one, two])
    assert.strictEqual(
      s.on("click", () => {
        ++clicks
      }),
      s
    )
    s.dispatch("click")
    assert.strictEqual(clicks, 2)
    s.dispatch("tick")
    assert.strictEqual(clicks, 2)
  }
)

it("selection.on(type, listener) observes the specified name, if any", "<h1 id='one'></h1><h1 id='two'></h1>", () => {
  let foo = 0
  let bar = 0
  const one = document.querySelector("#one")
  const two = document.querySelector("#two")
  const s = selectAll([one, two])
    .on("click.foo", () => {
      ++foo
    })
    .on("click.bar", () => {
      ++bar
    })
  s.dispatch("click")
  assert.strictEqual(foo, 2)
  assert.strictEqual(bar, 2)
})

it("selection.on(type, listener, capture) observes the specified capture flag, if any", () => {
  let result
  const s = select({
    addEventListener: (type, listener, capture) => {
      result = capture
    },
  })
  assert.strictEqual(
    s.on("click.foo", () => {}, true),
    s
  )
  assert.deepStrictEqual(result, true)
})

it(
  "selection.on(type) returns the listener for the specified event type, if any",
  "<h1 id='one'></h1><h1 id='two'></h1>",
  () => {
    const clicked = () => {}
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const s = selectAll([one, two]).on("click", clicked)
    assert.strictEqual(s.on("click"), clicked)
  }
)

it("selection.on(type) observes the specified name, if any", "<h1 id='one'></h1><h1 id='two'></h1>", () => {
  const clicked = () => {}
  const one = document.querySelector("#one")
  const two = document.querySelector("#two")
  const s = selectAll([one, two]).on("click.foo", clicked)
  assert.strictEqual(s.on("click"), undefined)
  assert.strictEqual(s.on("click.foo"), clicked)
  assert.strictEqual(s.on("click.bar"), undefined)
  assert.strictEqual(s.on("tick.foo"), undefined)
  assert.strictEqual(s.on(".foo"), undefined)
})

it(
  "selection.on(type, null) removes the listener with the specified name, if any",
  "<h1 id='one'></h1><h1 id='two'></h1>",
  () => {
    let clicks = 0
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const s = selectAll([one, two]).on("click", () => {
      ++clicks
    })
    assert.strictEqual(s.on("click", null), s)
    assert.strictEqual(s.on("click"), undefined)
    s.dispatch("click")
    assert.strictEqual(clicks, 0)
  }
)

it("selection.on(type, null) observes the specified name, if any", "<h1 id='one'></h1><h1 id='two'></h1>", () => {
  let foo = 0
  let bar = 0
  const fooed = () => {
    ++foo
  }
  const barred = () => {
    ++bar
  }
  const one = document.querySelector("#one")
  const two = document.querySelector("#two")
  const s = selectAll([one, two]).on("click.foo", fooed).on("click.bar", barred)
  assert.strictEqual(s.on("click.foo", null), s)
  assert.strictEqual(s.on("click.foo"), undefined)
  assert.strictEqual(s.on("click.bar"), barred)
  s.dispatch("click")
  assert.strictEqual(foo, 0)
  assert.strictEqual(bar, 2)
})

it("selection.on(type, null, capture) ignores the specified capture flag, if any", () => {
  let clicks = 0
  const clicked = () => {
    ++clicks
  }
  const s = select(document).on("click.foo", clicked, true)
  s.dispatch("click")
  assert.strictEqual(clicks, 1)
  s.on(".foo", null, false).dispatch("click")
  assert.strictEqual(clicks, 1)
  assert.strictEqual(s.on("click.foo"), undefined)
})

it(
  "selection.on(name, null) removes all listeners with the specified name",
  "<h1 id='one'></h1><h1 id='two'></h1>",
  () => {
    let clicks = 0
    let loads = 0
    const clicked = () => {
      ++clicks
    }
    const loaded = () => {
      ++loads
    }
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const s = selectAll([one, two]).on("click.foo", clicked).on("load.foo", loaded)
    assert.strictEqual(s.on("click.foo"), clicked)
    assert.strictEqual(s.on("load.foo"), loaded)
    s.dispatch("click")
    s.dispatch("load")
    assert.strictEqual(clicks, 2)
    assert.strictEqual(loads, 2)
    assert.strictEqual(s.on(".foo", null), s)
    assert.strictEqual(s.on("click.foo"), undefined)
    assert.strictEqual(s.on("load.foo"), undefined)
    s.dispatch("click")
    s.dispatch("load")
    assert.strictEqual(clicks, 2)
    assert.strictEqual(loads, 2)
  }
)

it("selection.on(name, null) can remove a listener with capture", () => {
  let clicks = 0
  const clicked = () => {
    ++clicks
  }
  const s = select(document).on("click.foo", clicked, true)
  s.dispatch("click")
  assert.strictEqual(clicks, 1)
  s.on(".foo", null).dispatch("click")
  assert.strictEqual(clicks, 1)
  assert.strictEqual(s.on("click.foo"), undefined)
})

it("selection.on(name, listener) has no effect", "<h1 id='one'></h1><h1 id='two'></h1>", () => {
  let clicks = 0
  const clicked = () => {
    ++clicks
  }
  const one = document.querySelector("#one")
  const two = document.querySelector("#two")
  const s = selectAll([one, two]).on("click.foo", clicked)
  assert.strictEqual(
    s.on(".foo", () => {
      throw new Error()
    }),
    s
  )
  assert.strictEqual(s.on("click.foo"), clicked)
  s.dispatch("click")
  assert.strictEqual(clicks, 2)
})

it("selection.on(type) skips missing elements", "<h1 id='one'></h1><h1 id='two'></h1>", () => {
  const clicked = () => {}
  const one = document.querySelector("#one")
  const two = document.querySelector("#two")
  selectAll([one, two]).on("click.foo", clicked)
  assert.strictEqual(selectAll([, two]).on("click.foo"), clicked)
})

it("selection.on(type, listener) skips missing elements", "<h1 id='one'></h1><h1 id='two'></h1>", () => {
  let clicks = 0
  const clicked = () => {
    ++clicks
  }
  const two = document.querySelector("#two")
  const s = selectAll([, two]).on("click.foo", clicked)
  s.dispatch("click")
  assert.strictEqual(clicks, 1)
})

it(
  "selection.on(type, listener) passes the event and listener data",
  "<parent id='one'><child id='three'></child><child id='four'></child></parent><parent id='two'><child id='five'></child></parent>",
  () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const three = document.querySelector("#three")
    const four = document.querySelector("#four")
    const five = document.querySelector("#five")
    const results = []

    const s = selectAll([one, two])
      .datum(function (d, i) {
        return "parent-" + i
      })
      .selectAll("child")
      .data(function (d, i) {
        return [0, 1].map(function (j) {
          return "child-" + i + "-" + j
        })
      })
      .on("foo", function (e, d) {
        results.push([this, e.type, d])
      })

    assert.deepStrictEqual(results, [])
    s.dispatch("foo")
    assert.deepStrictEqual(results, [
      [three, "foo", "child-0-0"],
      [four, "foo", "child-0-1"],
      [five, "foo", "child-1-0"],
    ])
  }
)

it(
  "selection.on(type, listener) passes the current listener data",
  "<parent id='one'><child id='three'></child><child id='four'></child></parent><parent id='two'><child id='five'></child></parent>",
  () => {
    const results = []
    const s = select(document).on("foo", function (e, d) {
      results.push(d)
    })
    s.dispatch("foo")
    document.__data__ = 42
    s.dispatch("foo")
    assert.deepStrictEqual(results, [undefined, 42])
  }
)
import assert from "assert"
import { select, selectAll } from "../../src/index.js"
import it from "../jsdom.js"

it(
  "selection.order() moves selected elements so that they are before their next sibling",
  "<h1 id='one'></h1><h1 id='two'></h1>",
  () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const selection = selectAll([two, one])
    assert.strictEqual(selection.order(), selection)
    assert.strictEqual(one.nextSibling, null)
    assert.strictEqual(two.nextSibling, one)
  }
)

it(
  "selection.order() only orders within each group",
  "<h1><span id='one'></span></h1><h1><span id='two'></span></h1>",
  () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const selection = select(document).selectAll("h1").selectAll("span")
    assert.strictEqual(selection.order(), selection)
    assert.strictEqual(one.nextSibling, null)
    assert.strictEqual(two.nextSibling, null)
  }
)
import assert from "assert"
import { select, selectAll } from "../../src/index.js"
import it from "../jsdom.js"

it("selection.property(name) returns the property with the specified name on the first selected element", () => {
  const node = { foo: 42 }
  assert.strictEqual(select(node).property("foo"), 42)
  assert.strictEqual(selectAll([null, node]).property("foo"), 42)
})

it("selection.property(name, value) sets property with the specified name on the selected elements", () => {
  const one = {}
  const two = {}
  const selection = selectAll([one, two])
  assert.strictEqual(selection.property("foo", "bar"), selection)
  assert.strictEqual(one.foo, "bar")
  assert.strictEqual(two.foo, "bar")
})

it("selection.property(name, null) removes the property with the specified name on the selected elements", () => {
  const one = { foo: "bar" }
  const two = { foo: "bar" }
  const selection = selectAll([one, two])
  assert.strictEqual(selection.property("foo", null), selection)
  assert.strictEqual("foo" in one, false)
  assert.strictEqual("foo" in two, false)
})

it("selection.property(name, function) sets the value of the property with the specified name on the selected elements", () => {
  const one = { foo: "bar" }
  const two = { foo: "bar" }
  const selection = selectAll([one, two])
  assert.strictEqual(
    selection.property("foo", function (d, i) {
      return i ? "baz" : null
    }),
    selection
  )
  assert.strictEqual("foo" in one, false)
  assert.strictEqual(two.foo, "baz")
})

it(
  "selection.property(name, function) passes the value function data, index and group",
  "<parent id='one'><child id='three'></child><child id='four'></child></parent><parent id='two'><child id='five'></child></parent>",
  () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const three = document.querySelector("#three")
    const four = document.querySelector("#four")
    const five = document.querySelector("#five")
    const results = []

    selectAll([one, two])
      .datum(function (d, i) {
        return "parent-" + i
      })
      .selectAll("child")
      .data(function (d, i) {
        return [0, 1].map(function (j) {
          return "child-" + i + "-" + j
        })
      })
      .property("color", function (d, i, nodes) {
        results.push([this, d, i, nodes])
      })

    assert.deepStrictEqual(results, [
      [three, "child-0-0", 0, [three, four]],
      [four, "child-0-1", 1, [three, four]],
      [five, "child-1-0", 0, [five, ,]],
    ])
  }
)
import assert from "assert"
import { select, selectAll } from "../../src/index.js"
import it from "../jsdom.js"

it("selection.remove() removes selected elements from their parent", "<h1 id='one'></h1><h1 id='two'></h1>", () => {
  const one = document.querySelector("#one")
  const two = document.querySelector("#two")
  const s = selectAll([two, one])
  assert.strictEqual(s.remove(), s)
  assert.strictEqual(one.parentNode, null)
  assert.strictEqual(two.parentNode, null)
})

it("selection.remove() skips elements that have already been detached", "<h1 id='one'></h1><h1 id='two'></h1>", () => {
  const one = document.querySelector("#one")
  const two = document.querySelector("#two")
  const s = selectAll([two, one])
  one.parentNode.removeChild(one)
  assert.strictEqual(s.remove(), s)
  assert.strictEqual(one.parentNode, null)
  assert.strictEqual(two.parentNode, null)
})

it("selection.remove() skips missing elements", "<h1 id='one'></h1><h1 id='two'></h1>", () => {
  const one = document.querySelector("#one")
  const two = document.querySelector("#two")
  const s = selectAll([, one])
  assert.strictEqual(s.remove(), s)
  assert.strictEqual(one.parentNode, null)
  assert.strictEqual(two.parentNode, document.body)
})

it(
  "selectChildren().remove() removes all children",
  "<div><span>0</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span><span>8</span><span>9</span></div>",
  () => {
    const p = document.querySelector("div")
    const selection = select(p).selectChildren()
    assert.strictEqual(selection.size(), 10)
    assert.strictEqual(selection.remove(), selection)
    assert.strictEqual(select(p).selectChildren().size(), 0)
  }
)
import assert from "assert"
import { select, selection, selectAll } from "../../src/index.js"
import { assertSelection } from "../asserts.js"
import it from "../jsdom.js"

it("selection.select(…) returns a selection", "<h1>hello</h1>", () => {
  assert(select(document).select("h1") instanceof selection)
})

it(
  "selection.select(string) selects the first descendant that matches the selector string for each selected element",
  "<h1><span id='one'></span><span id='two'></span></h1><h1><span id='three'></span><span id='four'></span></h1>",
  () => {
    const one = document.querySelector("#one")
    const three = document.querySelector("#three")
    assertSelection(select(document).selectAll("h1").select("span"), { groups: [[one, three]], parents: [document] })
  }
)

it(
  "selection.select(function) selects the return value of the given function for each selected element",
  "<span id='one'></span>",
  () => {
    const one = document.querySelector("#one")
    assertSelection(
      select(document).select(function () {
        return one
      }),
      { groups: [[one]], parents: [null] }
    )
  }
)

it(
  "selection.select(function) passes the selector function data, index and group",
  "<parent id='one'><child id='three'></child><child id='four'></child></parent><parent id='two'><child id='five'></child></parent>",
  () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const three = document.querySelector("#three")
    const four = document.querySelector("#four")
    const five = document.querySelector("#five")
    const results = []

    selectAll([one, two])
      .datum(function (d, i) {
        return "parent-" + i
      })
      .selectAll("child")
      .data(function (d, i) {
        return [0, 1].map(function (j) {
          return "child-" + i + "-" + j
        })
      })
      .select(function (d, i, nodes) {
        results.push([this, d, i, nodes])
      })

    assert.deepStrictEqual(results, [
      [three, "child-0-0", 0, [three, four]],
      [four, "child-0-1", 1, [three, four]],
      [five, "child-1-0", 0, [five, ,]],
    ])
  }
)

it(
  "selection.select(…) propagates data if defined on the originating element",
  "<parent><child>hello</child></parent>",
  () => {
    const parent = document.querySelector("parent")
    const child = document.querySelector("child")
    parent.__data__ = 0 // still counts as data even though falsey
    child.__data__ = 42
    select(parent).select("child")
    assert.strictEqual(child.__data__, 0)
  }
)

it(
  "selection.select(…) will not propagate data if not defined on the originating element",
  "<parent><child>hello</child></parent>",
  () => {
    const parent = document.querySelector("parent")
    const child = document.querySelector("child")
    child.__data__ = 42
    select(parent).select("child")
    assert.strictEqual(child.__data__, 42)
  }
)

it(
  "selection.select(…) propagates parents from the originating selection",
  "<parent><child>1</child></parent><parent><child>2</child></parent>",
  () => {
    const parents = select(document).selectAll("parent")
    const childs = parents.select("child")
    assertSelection(parents, { groups: [document.querySelectorAll("parent")], parents: [document] })
    assertSelection(childs, { groups: [document.querySelectorAll("child")], parents: [document] })
    assert(parents.parents === childs.parents) // Not copied!
  }
)

it(
  "selection.select(…) can select elements when the originating selection is nested",
  "<parent id='one'><child><span id='three'></span></child></parent><parent id='two'><child><span id='four'></span></child></parent>",
  () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const three = document.querySelector("#three")
    const four = document.querySelector("#four")
    assertSelection(selectAll([one, two]).selectAll("child").select("span"), {
      groups: [[three], [four]],
      parents: [one, two],
    })
  }
)

it("selection.select(…) skips missing originating elements", "<h1><span>hello</span></h1>", () => {
  const h1 = document.querySelector("h1")
  const span = document.querySelector("span")
  assertSelection(selectAll([, h1]).select("span"), { groups: [[, span]], parents: [null] })
  assertSelection(selectAll([null, h1]).select("span"), { groups: [[, span]], parents: [null] })
  assertSelection(selectAll([undefined, h1]).select("span"), { groups: [[, span]], parents: [null] })
})

it(
  "selection.select(…) skips missing originating elements when the originating selection is nested",
  "<parent id='one'><child></child><child><span id='three'></span></child></parent><parent id='two'><child></child><child><span id='four'></span></child></parent>",
  () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const three = document.querySelector("#three")
    const four = document.querySelector("#four")
    assertSelection(
      selectAll([one, two])
        .selectAll("child")
        .select(function (d, i) {
          return i & 1 ? this : null
        })
        .select("span"),
      {
        groups: [
          [, three],
          [, four],
        ],
        parents: [one, two],
      }
    )
  }
)

it("selection.selection() returns itself", "<h1>hello</h1>", () => {
  const sel = select(document).select("h1")
  assert(sel === sel.selection())
  assert(sel === sel.selection().selection())
})
import assert from "assert"
import { select, selection, selectAll } from "../../src/index.js"
import { assertSelection } from "../asserts.js"
import it from "../jsdom.js"

it("selection.selectAll(…) returns a selection", "<h1>hello</h1>", () => {
  assert(select(document).selectAll("h1") instanceof selection)
})

it(
  "selection.selectAll(string) selects all descendants that match the selector string for each selected element",
  "<h1 id='one'><span></span><span></span></h1><h1 id='two'><span></span><span></span></h1>",
  () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    assertSelection(selectAll([one, two]).selectAll("span"), {
      groups: [one.querySelectorAll("span"), two.querySelectorAll("span")],
      parents: [one, two],
    })
  }
)

it(
  "selection.selectAll(function) selects the return values of the given function for each selected element",
  "<span id='one'></span>",
  () => {
    const one = document.querySelector("#one")
    assertSelection(
      select(document).selectAll(function () {
        return [one]
      }),
      { groups: [[one]], parents: [document] }
    )
  }
)

it(
  "selection.selectAll(function) passes the selector function data, index and group",
  "<parent id='one'><child id='three'></child><child id='four'></child></parent><parent id='two'><child id='five'></child></parent>",
  () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const three = document.querySelector("#three")
    const four = document.querySelector("#four")
    const five = document.querySelector("#five")
    const results = []

    selectAll([one, two])
      .datum(function (d, i) {
        return "parent-" + i
      })
      .selectAll("child")
      .data(function (d, i) {
        return [0, 1].map(function (j) {
          return "child-" + i + "-" + j
        })
      })
      .selectAll(function (d, i, nodes) {
        results.push([this, d, i, nodes])
      })

    assert.deepStrictEqual(results, [
      [three, "child-0-0", 0, [three, four]],
      [four, "child-0-1", 1, [three, four]],
      [five, "child-1-0", 0, [five, ,]],
    ])
  }
)

it("selection.selectAll(…) will not propagate data", "<parent><child>hello</child></parent>", () => {
  const parent = document.querySelector("parent")
  const child = document.querySelector("child")
  parent.__data__ = 42
  select(parent).selectAll("child")
  assert(!("__data__" in child))
})

it(
  "selection.selectAll(…) groups selected elements by their parent in the originating selection",
  "<parent id='one'><child id='three'></child></parent><parent id='two'><child id='four'></child></parent>",
  () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const three = document.querySelector("#three")
    const four = document.querySelector("#four")
    assertSelection(select(document).selectAll("parent").selectAll("child"), {
      groups: [[three], [four]],
      parents: [one, two],
    })
    assertSelection(select(document).selectAll("child"), { groups: [[three, four]], parents: [document] })
  }
)

it(
  "selection.selectAll(…) can select elements when the originating selection is nested",
  "<parent id='one'><child id='three'><span id='five'></span></child></parent><parent id='two'><child id='four'><span id='six'></span></child></parent>",
  () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const three = document.querySelector("#three")
    const four = document.querySelector("#four")
    const five = document.querySelector("#five")
    const six = document.querySelector("#six")
    assertSelection(selectAll([one, two]).selectAll("child").selectAll("span"), {
      groups: [[five], [six]],
      parents: [three, four],
    })
  }
)

it("selection.selectAll(…) skips missing originating elements", "<h1><span>hello</span></h1>", () => {
  const h1 = document.querySelector("h1")
  const span = document.querySelector("span")
  assertSelection(selectAll([, h1]).selectAll("span"), { groups: [[span]], parents: [h1] })
  assertSelection(selectAll([null, h1]).selectAll("span"), { groups: [[span]], parents: [h1] })
  assertSelection(selectAll([undefined, h1]).selectAll("span"), { groups: [[span]], parents: [h1] })
})

it(
  "selection.selectAll(…) skips missing originating elements when the originating selection is nested",
  "<parent id='one'><child></child><child id='three'><span id='five'></span></child></parent><parent id='two'><child></child><child id='four'><span id='six'></span></child></parent>",
  () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const three = document.querySelector("#three")
    const four = document.querySelector("#four")
    const five = document.querySelector("#five")
    const six = document.querySelector("#six")
    assertSelection(
      selectAll([one, two])
        .selectAll("child")
        .select(function (d, i) {
          return i & 1 ? this : null
        })
        .selectAll("span"),
      { groups: [[five], [six]], parents: [three, four] }
    )
  }
)
import assert from "assert"
import { select, selection } from "../../src/index.js"
import { assertSelection } from "../asserts.js"
import it from "../jsdom.js"

it(
  "select.selectChild(…) selects the first (matching) child",
  "<h1><span>hello</span>, <span>world<span>!</span></span></h1>",
  () => {
    const s = select(document).select("h1")
    assert(s.selectChild(() => true) instanceof selection)
    assertSelection(
      s.selectChild(() => true),
      s.select("*")
    )
    assert(s.selectChild() instanceof selection)
    assert(s.selectChild("*") instanceof selection)
    assertSelection(s.selectChild("*"), s.select("*"))
    assertSelection(s.selectChild(), s.select("*"))
    assertSelection(s.selectChild("div"), s.select("div"))
    assert.strictEqual(s.selectChild("span").text(), "hello")
  }
)

it(
  "selectAll.selectChild(…) selects the first (matching) child",
  "<div><span>hello</span>, <span>world<span>!</span></span></div><div><span>hello2</span>, <span>world2<span>!2</span></span></div>",
  () => {
    const s = select(document).selectAll("div")
    assert(s.selectChild(() => true) instanceof selection)
    assertSelection(
      s.selectChild(() => true),
      s.select("*")
    )
    assert(s.selectChild() instanceof selection)
    assert(s.selectChild("*") instanceof selection)
    assertSelection(s.selectChild("*"), s.select("*"))
    assertSelection(s.selectChild(), s.select("*"))
    assertSelection(s.selectChild("div"), s.select("div"))
    assert.strictEqual(s.selectChild("span").text(), "hello")
  }
)

it(
  "select.selectChildren(…) selects the matching children",
  "<h1><span>hello</span>, <span>world<span>!</span></span></h1>",
  () => {
    const s = select(document).select("h1")
    assert(s.selectChildren("*") instanceof selection)
    assert.strictEqual(s.selectChildren("*").text(), "hello")
    assert.strictEqual(s.selectChildren().size(), 2)
    assert.strictEqual(s.selectChildren("*").size(), 2)
    assertSelection(s.selectChildren(), s.selectChildren("*"))
    assert.strictEqual(s.selectChildren("span").size(), 2)
    assert.strictEqual(s.selectChildren("div").size(), 0)
  }
)

it(
  "selectAll.selectChildren(…) selects the matching children",
  "<div><span>hello</span>, <span>world<span>!</span></span></div><div><span>hello2</span>, <span>world2<span>!2</span></span></div>",
  () => {
    const s = select(document).selectAll("div")
    assert(s.selectChildren("*") instanceof selection)
    assert.strictEqual(s.selectChildren("*").text(), "hello")
    assert.strictEqual(s.selectChildren().size(), 4)
    assert.strictEqual(s.selectChildren("*").size(), 4)
    assertSelection(s.selectChildren(), s.selectChildren("*"))
    assert.strictEqual(s.selectChildren("span").size(), 4)
    assert.strictEqual(s.selectChildren("div").size(), 0)
  }
)
import assert from "assert"
import { selectAll } from "../../src/index.js"
import it from "../jsdom.js"

it("selection.size() returns the number of selected elements", "<h1 id='one'></h1><h1 id='two'></h1>", () => {
  const one = document.querySelector("#one")
  const two = document.querySelector("#two")
  assert.deepStrictEqual(selectAll([]).size(), 0)
  assert.deepStrictEqual(selectAll([one]).size(), 1)
  assert.deepStrictEqual(selectAll([one, two]).size(), 2)
})

it("selection.size() skips missing elements", "<h1 id='one'></h1><h1 id='two'></h1>", () => {
  const one = document.querySelector("#one")
  const two = document.querySelector("#two")
  assert.deepStrictEqual(selectAll([, one, , two]).size(), 2)
})
import assert from "assert"
import { selectAll } from "../../src/index.js"
import { assertSelection } from "../asserts.js"
import it from "../jsdom.js"

it(
  "selection.sort(…) returns a new selection, sorting each group’s data, and then ordering the elements to match",
  "<h1 id='one' data-value='1'></h1><h1 id='two' data-value='0'></h1><h1 id='three' data-value='2'></h1>",
  () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const three = document.querySelector("#three")
    const selection0 = selectAll([two, three, one]).datum(function () {
      return +this.getAttribute("data-value")
    })
    const selection1 = selection0.sort(function (a, b) {
      return a - b
    })
    assertSelection(selection0, { groups: [[two, three, one]], parents: [null] })
    assertSelection(selection1, { groups: [[two, one, three]], parents: [null] })
    assert.strictEqual(two.nextSibling, one)
    assert.strictEqual(one.nextSibling, three)
    assert.strictEqual(three.nextSibling, null)
  }
)

it(
  "selection.sort(…) sorts each group separately",
  "<div id='one'><h1 id='three' data-value='1'></h1><h1 id='four' data-value='0'></h1></div><div id='two'><h1 id='five' data-value='3'></h1><h1 id='six' data-value='-1'></h1></div>",
  () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const three = document.querySelector("#three")
    const four = document.querySelector("#four")
    const five = document.querySelector("#five")
    const six = document.querySelector("#six")
    const selection = selectAll([one, two])
      .selectAll("h1")
      .datum(function () {
        return +this.getAttribute("data-value")
      })
    assertSelection(
      selection.sort(function (a, b) {
        return a - b
      }),
      {
        groups: [
          [four, three],
          [six, five],
        ],
        parents: [one, two],
      }
    )
    assert.strictEqual(four.nextSibling, three)
    assert.strictEqual(three.nextSibling, null)
    assert.strictEqual(six.nextSibling, five)
    assert.strictEqual(five.nextSibling, null)
  }
)

it("selection.sort() uses natural ascending order", "<h1 id='one'></h1><h1 id='two'></h1>", () => {
  const one = document.querySelector("#one")
  const two = document.querySelector("#two")
  const selection = selectAll([two, one]).datum(function (d, i) {
    i
  })
  assertSelection(selection.sort(), { groups: [[two, one]], parents: [null] })
  assert.strictEqual(one.nextSibling, null)
  assert.strictEqual(two.nextSibling, one)
})

it("selection.sort() puts missing elements at the end of each group", "<h1 id='one'></h1><h1 id='two'></h1>", () => {
  const one = document.querySelector("#one")
  const two = document.querySelector("#two")
  selectAll([two, one]).datum(function (d, i) {
    return i
  })
  assertSelection(selectAll([, one, , two]).sort(), { groups: [[two, one, , ,]], parents: [null] })
  assert.strictEqual(two.nextSibling, one)
  assert.strictEqual(one.nextSibling, null)
})

it(
  "selection.sort(function) puts missing elements at the end of each group",
  "<h1 id='one'></h1><h1 id='two'></h1>",
  () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    selectAll([two, one]).datum(function (d, i) {
      return i
    })
    assertSelection(
      selectAll([, one, , two]).sort(function (a, b) {
        return b - a
      }),
      { groups: [[one, two, , ,]], parents: [null] }
    )
    assert.strictEqual(one.nextSibling, two)
    assert.strictEqual(two.nextSibling, null)
  }
)

it(
  "selection.sort(function) uses the specified data comparator function",
  "<h1 id='one'></h1><h1 id='two'></h1>",
  () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const selection = selectAll([two, one]).datum(function (d, i) {
      return i
    })
    assertSelection(
      selection.sort(function (a, b) {
        return b - a
      }),
      { groups: [[one, two]], parents: [null] }
    )
    assert.strictEqual(one.nextSibling, two)
    assert.strictEqual(two.nextSibling, null)
  }
)

it(
  "selection.sort(function) returns a new selection, and does not modify the groups array in-place",
  "<h1 id='one'></h1><h1 id='two'></h1>",
  () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const selection0 = selectAll([one, two]).datum(function (d, i) {
      return i
    })
    const selection1 = selection0.sort(function (a, b) {
      return b - a
    })
    const selection2 = selection1.sort()
    assertSelection(selection0, { groups: [[one, two]], parents: [null] })
    assertSelection(selection1, { groups: [[two, one]], parents: [null] })
    assertSelection(selection2, { groups: [[one, two]], parents: [null] })
  }
)
import assert from "assert"
import { select, selectAll, style } from "../../src/index.js"
import it from "../jsdom.js"

it("style(node, name) returns the inline value of the style property with the specified name on the first selected element, if present", () => {
  const node = {
    style: {
      getPropertyValue: function (name) {
        return name === "color" ? "red" : ""
      },
    },
  }
  assert.strictEqual(style(node, "color"), "red")
})

it("style(node, name) returns the computed value of the style property with the specified name on the first selected element, if there is no inline style", () => {
  const styles = {
    getPropertyValue: function (name) {
      return name === "color" ? "rgb(255, 0, 0)" : ""
    },
  }
  const node = {
    style: {
      getPropertyValue: function () {
        return ""
      },
    },
    ownerDocument: {
      defaultView: {
        getComputedStyle: function (n) {
          return n === node ? styles : null
        },
      },
    },
  }
  assert.strictEqual(style(node, "color"), "rgb(255, 0, 0)")
})

it("selection.style(name) returns the inline value of the style property with the specified name on the first selected element, if present", () => {
  const node = {
    style: {
      getPropertyValue: function (name) {
        return name === "color" ? "red" : ""
      },
    },
  }
  assert.strictEqual(select(node).style("color"), "red")
  assert.strictEqual(selectAll([null, node]).style("color"), "red")
})

it("selection.style(name) returns the computed value of the style property with the specified name on the first selected element, if there is no inline style", () => {
  const style = {
    getPropertyValue: function (name) {
      return name === "color" ? "rgb(255, 0, 0)" : ""
    },
  }
  const node = {
    style: {
      getPropertyValue: function () {
        return ""
      },
    },
    ownerDocument: {
      defaultView: {
        getComputedStyle: function (n) {
          return n === node ? style : null
        },
      },
    },
  }
  assert.strictEqual(select(node).style("color"), "rgb(255, 0, 0)")
  assert.strictEqual(selectAll([null, node]).style("color"), "rgb(255, 0, 0)")
})

it(
  "selection.style(name, value) sets the value of the style property with the specified name on the selected elements",
  "<h1 id='one' class='c1 c2'>hello</h1><h1 id='two' class='c3'></h1>",
  () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const s = selectAll([one, two])
    assert.strictEqual(s.style("color", "red"), s)
    assert.strictEqual(one.style.getPropertyValue("color"), "red")
    assert.strictEqual(one.style.getPropertyPriority("color"), "")
    assert.strictEqual(two.style.getPropertyValue("color"), "red")
    assert.strictEqual(two.style.getPropertyPriority("color"), "")
  }
)

it(
  "selection.style(name, value, priority) sets the value and priority of the style property with the specified name on the selected elements",
  "<h1 id='one' class='c1 c2'>hello</h1><h1 id='two' class='c3'></h1>",
  () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const s = selectAll([one, two])
    assert.strictEqual(s.style("color", "red", "important"), s)
    assert.strictEqual(one.style.getPropertyValue("color"), "red")
    assert.strictEqual(one.style.getPropertyPriority("color"), "important")
    assert.strictEqual(two.style.getPropertyValue("color"), "red")
    assert.strictEqual(two.style.getPropertyPriority("color"), "important")
  }
)

it(
  "selection.style(name, null) removes the attribute with the specified name on the selected elements",
  "<h1 id='one' style='color:red;' class='c1 c2'>hello</h1><h1 id='two' style='color:red;' class='c3'></h1>",
  () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const s = selectAll([one, two])
    assert.strictEqual(s.style("color", null), s)
    assert.strictEqual(one.style.getPropertyValue("color"), "")
    assert.strictEqual(one.style.getPropertyPriority("color"), "")
    assert.strictEqual(two.style.getPropertyValue("color"), "")
    assert.strictEqual(two.style.getPropertyPriority("color"), "")
  }
)

it(
  "selection.style(name, function) sets the value of the style property with the specified name on the selected elements",
  "<h1 id='one' class='c1 c2'>hello</h1><h1 id='two' class='c3'></h1>",
  () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const s = selectAll([one, two])
    assert.strictEqual(
      s.style("color", function (d, i) {
        return i ? "red" : null
      }),
      s
    )
    assert.strictEqual(one.style.getPropertyValue("color"), "")
    assert.strictEqual(one.style.getPropertyPriority("color"), "")
    assert.strictEqual(two.style.getPropertyValue("color"), "red")
    assert.strictEqual(two.style.getPropertyPriority("color"), "")
  }
)

it(
  "selection.style(name, function, priority) sets the value and priority of the style property with the specified name on the selected elements",
  "<h1 id='one' class='c1 c2'>hello</h1><h1 id='two' class='c3'></h1>",
  () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const s = selectAll([one, two])
    assert.strictEqual(
      s.style(
        "color",
        function (d, i) {
          return i ? "red" : null
        },
        "important"
      ),
      s
    )
    assert.strictEqual(one.style.getPropertyValue("color"), "")
    assert.strictEqual(one.style.getPropertyPriority("color"), "")
    assert.strictEqual(two.style.getPropertyValue("color"), "red")
    assert.strictEqual(two.style.getPropertyPriority("color"), "important")
  }
)

it(
  "selection.style(name, function) passes the value function data, index and group",
  "<parent id='one'><child id='three'></child><child id='four'></child></parent><parent id='two'><child id='five'></child></parent>",
  () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const three = document.querySelector("#three")
    const four = document.querySelector("#four")
    const five = document.querySelector("#five")
    const results = []

    selectAll([one, two])
      .datum(function (d, i) {
        return "parent-" + i
      })
      .selectAll("child")
      .data(function (d, i) {
        return [0, 1].map(function (j) {
          return "child-" + i + "-" + j
        })
      })
      .style("color", function (d, i, nodes) {
        results.push([this, d, i, nodes])
      })

    assert.deepStrictEqual(results, [
      [three, "child-0-0", 0, [three, four]],
      [four, "child-0-1", 1, [three, four]],
      [five, "child-1-0", 0, [five, ,]],
    ])
  }
)
import assert from "assert"
import { select, selectAll } from "../../src/index.js"
import it from "../jsdom.js"

it("selection.text() returns the text content on the first selected element", () => {
  const node = { textContent: "hello" }
  assert.strictEqual(select(node).text(), "hello")
  assert.strictEqual(selectAll([null, node]).text(), "hello")
})

it("selection.text(value) sets text content on the selected elements", () => {
  const one = { textContent: "" }
  const two = { textContent: "" }
  const selection = selectAll([one, two])
  assert.strictEqual(selection.text("bar"), selection)
  assert.strictEqual(one.textContent, "bar")
  assert.strictEqual(two.textContent, "bar")
})

it("selection.text(null) clears the text content on the selected elements", () => {
  const one = { textContent: "bar" }
  const two = { textContent: "bar" }
  const selection = selectAll([one, two])
  assert.strictEqual(selection.text(null), selection)
  assert.strictEqual(one.textContent, "")
  assert.strictEqual(two.textContent, "")
})

it("selection.text(function) sets the value of the text content on the selected elements", () => {
  const one = { textContent: "bar" }
  const two = { textContent: "bar" }
  const selection = selectAll([one, two])
  assert.strictEqual(
    selection.text(function (d, i) {
      return i ? "baz" : null
    }),
    selection
  )
  assert.strictEqual(one.textContent, "")
  assert.strictEqual(two.textContent, "baz")
})

it(
  "selection.text(function) passes the value function data, index and group",
  "<parent id='one'><child id='three'></child><child id='four'></child></parent><parent id='two'><child id='five'></child></parent>",
  () => {
    const one = document.querySelector("#one")
    const two = document.querySelector("#two")
    const three = document.querySelector("#three")
    const four = document.querySelector("#four")
    const five = document.querySelector("#five")
    const results = []

    selectAll([one, two])
      .datum(function (d, i) {
        return "parent-" + i
      })
      .selectAll("child")
      .data(function (d, i) {
        return [0, 1].map(function (j) {
          return "child-" + i + "-" + j
        })
      })
      .text(function (d, i, nodes) {
        results.push([this, d, i, nodes])
      })

    assert.deepStrictEqual(results, [
      [three, "child-0-0", 0, [three, four]],
      [four, "child-0-1", 1, [three, four]],
      [five, "child-1-0", 0, [five, ,]],
    ])
  }
)
