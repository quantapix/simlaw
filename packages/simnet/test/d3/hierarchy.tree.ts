import assert from "assert"
import { hierarchy, treemap, treemapBinary } from "../../src/index.js"
import { round } from "./round.js"

it("treemapBinary(parent, x0, y0, x1, y1) generates a binary treemap layout", () => {
  const tile = treemapBinary
  const root = {
    value: 24,
    children: [{ value: 6 }, { value: 6 }, { value: 4 }, { value: 3 }, { value: 2 }, { value: 2 }, { value: 1 }],
  }
  tile(root, 0, 0, 6, 4)
  assert.deepStrictEqual(root.children.map(round), [
    { x0: 0.0, x1: 3.0, y0: 0.0, y1: 2.0 },
    { x0: 0.0, x1: 3.0, y0: 2.0, y1: 4.0 },
    { x0: 3.0, x1: 4.71, y0: 0.0, y1: 2.33 },
    { x0: 4.71, x1: 6.0, y0: 0.0, y1: 2.33 },
    { x0: 3.0, x1: 4.2, y0: 2.33, y1: 4.0 },
    { x0: 4.2, x1: 5.4, y0: 2.33, y1: 4.0 },
    { x0: 5.4, x1: 6.0, y0: 2.33, y1: 4.0 },
  ])
})

it("treemapBinary does not break on 0-sized inputs", () => {
  const data = { children: [{ value: 0 }, { value: 0 }, { value: 1 }] }
  const root = hierarchy(data).sum(d => d.value)
  const treemapper = treemap().tile(treemapBinary)
  treemapper(root)
  const a = root.leaves().map(d => [d.x0, d.x1, d.y0, d.y1])
  assert.deepStrictEqual(a, [
    [0, 1, 0, 0],
    [1, 1, 0, 0],
    [0, 1, 0, 1],
  ])
})
import assert from "assert"
import { treemapDice } from "../../src/index.js"
import { round } from "./round.js"

it("treemapDice(parent, x0, y0, x1, y1) generates a diced layout", () => {
  const tile = treemapDice
  const root = {
    value: 24,
    children: [{ value: 6 }, { value: 6 }, { value: 4 }, { value: 3 }, { value: 2 }, { value: 2 }, { value: 1 }],
  }
  tile(root, 0, 0, 4, 6)
  assert.deepStrictEqual(root.children.map(round), [
    { x0: 0.0, x1: 1.0, y0: 0.0, y1: 6.0 },
    { x0: 1.0, x1: 2.0, y0: 0.0, y1: 6.0 },
    { x0: 2.0, x1: 2.67, y0: 0.0, y1: 6.0 },
    { x0: 2.67, x1: 3.17, y0: 0.0, y1: 6.0 },
    { x0: 3.17, x1: 3.5, y0: 0.0, y1: 6.0 },
    { x0: 3.5, x1: 3.83, y0: 0.0, y1: 6.0 },
    { x0: 3.83, x1: 4.0, y0: 0.0, y1: 6.0 },
  ])
})

it("treemapDice(parent, x0, y0, x1, y1) handles a degenerate empty parent", () => {
  const tile = treemapDice
  const root = {
    value: 0,
    children: [{ value: 0 }, { value: 0 }],
  }
  tile(root, 0, 0, 0, 4)
  assert.deepStrictEqual(root.children.map(round), [
    { x0: 0.0, x1: 0.0, y0: 0.0, y1: 4.0 },
    { x0: 0.0, x1: 0.0, y0: 0.0, y1: 4.0 },
  ])
})
import assert from "assert"
import { csvParse } from "d3-dsv"
import { readFileSync } from "fs"
import { stratify, treemap, treemapSquarify, Node } from "../../src/index.js"

it(
  "treemap(flare) produces the expected result with a squarified ratio of φ",
  test("test/data/flare.csv", "test/data/flare-phi.json", treemapSquarify)
)

it(
  "treemap(flare) produces the expected result with a squarified ratio of 1",
  test("test/data/flare.csv", "test/data/flare-one.json", treemapSquarify.ratio(1))
)

function test(inputFile, expectedFile, tile) {
  return () => {
    const inputText = readFileSync(inputFile, "utf8"),
      expectedText = readFileSync(expectedFile, "utf8")

    const stratifier = stratify().parentId(d => {
      const i = d.id.lastIndexOf(".")
      return i >= 0 ? d.id.slice(0, i) : null
    })

    const treemaper = treemap().tile(tile).size([960, 500])

    const data = csvParse(inputText)

    const expected = JSON.parse(expectedText)

    const actual = treemaper(
      stratifier(data)
        .sum(d => d.value)
        .sort((a, b) => b.value - a.value || a.data.id.localeCompare(b.data.id))
    )

    ;(function visit(node) {
      node.name = node.data.id.slice(node.data.id.lastIndexOf(".") + 1)
      node.x0 = round(node.x0)
      node.y0 = round(node.y0)
      node.x1 = round(node.x1)
      node.y1 = round(node.y1)
      delete node.id
      delete node.parent
      delete node.data
      delete node._squarify
      delete node.height
      if (node.children) node.children.forEach(visit)
    })(actual)
    ;(function visit(node) {
      Object.setPrototypeOf(node, Node.prototype)
      node.x0 = round(node.x)
      node.y0 = round(node.y)
      node.x1 = round(node.x + node.dx)
      node.y1 = round(node.y + node.dy)
      delete node.x
      delete node.y
      delete node.dx
      delete node.dy
      if (node.children) {
        node.children.reverse() // D3 3.x bug
        node.children.forEach(visit)
      }
    })(expected)

    assert.deepStrictEqual(actual, expected)
  }
}

function round(x) {
  return Math.round(x * 100) / 100
}
import assert from "assert"
import { readFileSync } from "fs"
import { hierarchy, treemap, treemapSlice, treemapSquarify } from "../../src/index.js"
import { round } from "./round.js"

const simple = JSON.parse(readFileSync("./test/data/simple2.json"))

it("treemap() has the expected defaults", () => {
  const t = treemap()
  assert.strictEqual(t.tile(), treemapSquarify)
  assert.deepStrictEqual(t.size(), [1, 1])
  assert.deepStrictEqual(t.round(), false)
})

it("treemap.round(round) observes the specified rounding", () => {
  const t = treemap().size([600, 400]).round(true)
  const root = t(hierarchy(simple).sum(defaultValue).sort(descendingValue))
  const nodes = root.descendants().map(round)
  assert.deepStrictEqual(t.round(), true)
  assert.deepStrictEqual(nodes, [
    { x0: 0, x1: 600, y0: 0, y1: 400 },
    { x0: 0, x1: 300, y0: 0, y1: 200 },
    { x0: 0, x1: 300, y0: 200, y1: 400 },
    { x0: 300, x1: 471, y0: 0, y1: 233 },
    { x0: 471, x1: 600, y0: 0, y1: 233 },
    { x0: 300, x1: 540, y0: 233, y1: 317 },
    { x0: 300, x1: 540, y0: 317, y1: 400 },
    { x0: 540, x1: 600, y0: 233, y1: 400 },
  ])
})

it("treemap.round(round) coerces the specified round to boolean", () => {
  const t = treemap().round("yes")
  assert.strictEqual(t.round(), true)
})

it("treemap.padding(padding) sets the inner and outer padding to the specified value", () => {
  const t = treemap().padding("42")
  assert.strictEqual(t.padding()(), 42)
  assert.strictEqual(t.paddingInner()(), 42)
  assert.strictEqual(t.paddingOuter()(), 42)
  assert.strictEqual(t.paddingTop()(), 42)
  assert.strictEqual(t.paddingRight()(), 42)
  assert.strictEqual(t.paddingBottom()(), 42)
  assert.strictEqual(t.paddingLeft()(), 42)
})

it("treemap.paddingInner(padding) observes the specified padding", () => {
  const t = treemap().size([6, 4]).paddingInner(0.5)
  const root = t(hierarchy(simple).sum(defaultValue).sort(descendingValue))
  const nodes = root.descendants().map(round)
  assert.strictEqual(t.paddingInner()(), 0.5)
  assert.deepStrictEqual(t.size(), [6, 4])
  assert.deepStrictEqual(nodes, [
    { x0: 0.0, x1: 6.0, y0: 0.0, y1: 4.0 },
    { x0: 0.0, x1: 2.75, y0: 0.0, y1: 1.75 },
    { x0: 0.0, x1: 2.75, y0: 2.25, y1: 4.0 },
    { x0: 3.25, x1: 4.61, y0: 0.0, y1: 2.13 },
    { x0: 5.11, x1: 6.0, y0: 0.0, y1: 2.13 },
    { x0: 3.25, x1: 5.35, y0: 2.63, y1: 3.06 },
    { x0: 3.25, x1: 5.35, y0: 3.56, y1: 4.0 },
    { x0: 5.85, x1: 6.0, y0: 2.63, y1: 4.0 },
  ])
})

it("treemap.paddingOuter(padding) observes the specified padding", () => {
  const t = treemap().size([6, 4]).paddingOuter(0.5)
  const root = t(hierarchy(simple).sum(defaultValue).sort(descendingValue))
  const nodes = root.descendants().map(round)
  assert.strictEqual(t.paddingOuter()(), 0.5)
  assert.strictEqual(t.paddingTop()(), 0.5)
  assert.strictEqual(t.paddingRight()(), 0.5)
  assert.strictEqual(t.paddingBottom()(), 0.5)
  assert.strictEqual(t.paddingLeft()(), 0.5)
  assert.deepStrictEqual(t.size(), [6, 4])
  assert.deepStrictEqual(nodes, [
    { x0: 0.0, x1: 6.0, y0: 0.0, y1: 4.0 },
    { x0: 0.5, x1: 3.0, y0: 0.5, y1: 2.0 },
    { x0: 0.5, x1: 3.0, y0: 2.0, y1: 3.5 },
    { x0: 3.0, x1: 4.43, y0: 0.5, y1: 2.25 },
    { x0: 4.43, x1: 5.5, y0: 0.5, y1: 2.25 },
    { x0: 3.0, x1: 5.0, y0: 2.25, y1: 2.88 },
    { x0: 3.0, x1: 5.0, y0: 2.88, y1: 3.5 },
    { x0: 5.0, x1: 5.5, y0: 2.25, y1: 3.5 },
  ])
})

it("treemap.size(size) observes the specified size", () => {
  const t = treemap().size([6, 4])
  const root = t(hierarchy(simple).sum(defaultValue).sort(descendingValue))
  const nodes = root.descendants().map(round)
  assert.deepStrictEqual(t.size(), [6, 4])
  assert.deepStrictEqual(nodes, [
    { x0: 0.0, x1: 6.0, y0: 0.0, y1: 4.0 },
    { x0: 0.0, x1: 3.0, y0: 0.0, y1: 2.0 },
    { x0: 0.0, x1: 3.0, y0: 2.0, y1: 4.0 },
    { x0: 3.0, x1: 4.71, y0: 0.0, y1: 2.33 },
    { x0: 4.71, x1: 6.0, y0: 0.0, y1: 2.33 },
    { x0: 3.0, x1: 5.4, y0: 2.33, y1: 3.17 },
    { x0: 3.0, x1: 5.4, y0: 3.17, y1: 4.0 },
    { x0: 5.4, x1: 6.0, y0: 2.33, y1: 4.0 },
  ])
})

it("treemap.size(size) coerces the specified size to numbers", () => {
  const t = treemap().size([
    "6",
    {
      valueOf: function () {
        return 4
      },
    },
  ])
  assert.strictEqual(t.size()[0], 6)
  assert.strictEqual(t.size()[1], 4)
})

it("treemap.size(size) makes defensive copies", () => {
  const size = [6, 4]
  const t = treemap().size(size)
  const root = ((size[1] = 100), t(hierarchy(simple).sum(defaultValue).sort(descendingValue)))
  const nodes = root.descendants().map(round)
  assert.deepStrictEqual(t.size(), [6, 4])
  t.size()[1] = 100
  assert.deepStrictEqual(t.size(), [6, 4])
  assert.deepStrictEqual(nodes, [
    { x0: 0.0, x1: 6.0, y0: 0.0, y1: 4.0 },
    { x0: 0.0, x1: 3.0, y0: 0.0, y1: 2.0 },
    { x0: 0.0, x1: 3.0, y0: 2.0, y1: 4.0 },
    { x0: 3.0, x1: 4.71, y0: 0.0, y1: 2.33 },
    { x0: 4.71, x1: 6.0, y0: 0.0, y1: 2.33 },
    { x0: 3.0, x1: 5.4, y0: 2.33, y1: 3.17 },
    { x0: 3.0, x1: 5.4, y0: 3.17, y1: 4.0 },
    { x0: 5.4, x1: 6.0, y0: 2.33, y1: 4.0 },
  ])
})

it("treemap.tile(tile) observes the specified tile function", () => {
  const t = treemap().size([6, 4]).tile(treemapSlice)
  const root = t(hierarchy(simple).sum(defaultValue).sort(descendingValue))
  const nodes = root.descendants().map(round)
  assert.strictEqual(t.tile(), treemapSlice)
  assert.deepStrictEqual(nodes, [
    { x0: 0.0, x1: 6.0, y0: 0.0, y1: 4.0 },
    { x0: 0.0, x1: 6.0, y0: 0.0, y1: 1.0 },
    { x0: 0.0, x1: 6.0, y0: 1.0, y1: 2.0 },
    { x0: 0.0, x1: 6.0, y0: 2.0, y1: 2.67 },
    { x0: 0.0, x1: 6.0, y0: 2.67, y1: 3.17 },
    { x0: 0.0, x1: 6.0, y0: 3.17, y1: 3.5 },
    { x0: 0.0, x1: 6.0, y0: 3.5, y1: 3.83 },
    { x0: 0.0, x1: 6.0, y0: 3.83, y1: 4.0 },
  ])
})

it("treemap(data) observes the specified values", () => {
  const foo = d => d.foo
  const t = treemap().size([6, 4])
  const root = t(
    hierarchy(JSON.parse(readFileSync("./test/data/simple3.json")))
      .sum(foo)
      .sort(descendingValue)
  )
  const nodes = root.descendants().map(round)
  assert.deepStrictEqual(t.size(), [6, 4])
  assert.deepStrictEqual(nodes, [
    { x0: 0.0, x1: 6.0, y0: 0.0, y1: 4.0 },
    { x0: 0.0, x1: 3.0, y0: 0.0, y1: 2.0 },
    { x0: 0.0, x1: 3.0, y0: 2.0, y1: 4.0 },
    { x0: 3.0, x1: 4.71, y0: 0.0, y1: 2.33 },
    { x0: 4.71, x1: 6.0, y0: 0.0, y1: 2.33 },
    { x0: 3.0, x1: 5.4, y0: 2.33, y1: 3.17 },
    { x0: 3.0, x1: 5.4, y0: 3.17, y1: 4.0 },
    { x0: 5.4, x1: 6.0, y0: 2.33, y1: 4.0 },
  ])
})

it("treemap(data) observes the specified sibling order", () => {
  const t = treemap()
  const root = t(hierarchy(simple).sum(defaultValue).sort(ascendingValue))
  assert.deepStrictEqual(
    root.descendants().map(d => d.value),
    [24, 1, 2, 2, 3, 4, 6, 6]
  )
})

function defaultValue(d) {
  return d.value
}

function ascendingValue(a, b) {
  return a.value - b.value
}

function descendingValue(a, b) {
  return b.value - a.value
}
import assert from "assert"
import { hierarchy, treemap, treemapResquarify } from "../../src/index.js"
import { round } from "./round.js"

it("treemapResquarify(parent, x0, y0, x1, y1) produces a stable update", () => {
  const tile = treemapResquarify
  const root = { value: 20, children: [{ value: 10 }, { value: 10 }] }
  tile(root, 0, 0, 20, 10)
  assert.deepStrictEqual(root.children.map(round), [
    { x0: 0, x1: 10, y0: 0, y1: 10 },
    { x0: 10, x1: 20, y0: 0, y1: 10 },
  ])
  tile(root, 0, 0, 10, 20)
  assert.deepStrictEqual(root.children.map(round), [
    { x0: 0, x1: 5, y0: 0, y1: 20 },
    { x0: 5, x1: 10, y0: 0, y1: 20 },
  ])
})

it("treemapResquarify.ratio(ratio) observes the specified ratio", () => {
  const tile = treemapResquarify.ratio(1)
  const root = {
    value: 24,
    children: [{ value: 6 }, { value: 6 }, { value: 4 }, { value: 3 }, { value: 2 }, { value: 2 }, { value: 1 }],
  }
  tile(root, 0, 0, 6, 4)
  assert.deepStrictEqual(root.children.map(round), [
    { x0: 0.0, x1: 3.0, y0: 0.0, y1: 2.0 },
    { x0: 0.0, x1: 3.0, y0: 2.0, y1: 4.0 },
    { x0: 3.0, x1: 4.71, y0: 0.0, y1: 2.33 },
    { x0: 4.71, x1: 6.0, y0: 0.0, y1: 2.33 },
    { x0: 3.0, x1: 4.2, y0: 2.33, y1: 4.0 },
    { x0: 4.2, x1: 5.4, y0: 2.33, y1: 4.0 },
    { x0: 5.4, x1: 6.0, y0: 2.33, y1: 4.0 },
  ])
})

it("treemapResquarify.ratio(ratio) is stable if the ratio is unchanged", () => {
  const root = { value: 20, children: [{ value: 10 }, { value: 10 }] }
  treemapResquarify(root, 0, 0, 20, 10)
  assert.deepStrictEqual(root.children.map(round), [
    { x0: 0, x1: 10, y0: 0, y1: 10 },
    { x0: 10, x1: 20, y0: 0, y1: 10 },
  ])
  treemapResquarify.ratio((1 + Math.sqrt(5)) / 2)(root, 0, 0, 10, 20)
  assert.deepStrictEqual(root.children.map(round), [
    { x0: 0, x1: 5, y0: 0, y1: 20 },
    { x0: 5, x1: 10, y0: 0, y1: 20 },
  ])
})

it("treemapResquarify.ratio(ratio) is unstable if the ratio is changed", () => {
  const root = { value: 20, children: [{ value: 10 }, { value: 10 }] }
  treemapResquarify(root, 0, 0, 20, 10)
  assert.deepStrictEqual(root.children.map(round), [
    { x0: 0, x1: 10, y0: 0, y1: 10 },
    { x0: 10, x1: 20, y0: 0, y1: 10 },
  ])
  treemapResquarify.ratio(1)(root, 0, 0, 10, 20)
  assert.deepStrictEqual(root.children.map(round), [
    { x0: 0, x1: 10, y0: 0, y1: 10 },
    { x0: 0, x1: 10, y0: 10, y1: 20 },
  ])
})

it("treemapResquarify does not break on 0-sized inputs", () => {
  const root = hierarchy({ children: [{ children: [{ value: 0 }] }, { value: 1 }] })
  const treemapper = treemap().tile(treemapResquarify)
  treemapper(root.sum(d => d.value))
  treemapper(root.sum(d => d.sum))
  const a = root.leaves().map(d => [d.x0, d.x1, d.y0, d.y1])
  assert.deepStrictEqual(a, [
    [0, 1, 0, 0],
    [0, 1, 0, 0],
  ])
})
export function round(d) {
  return {
    x0: r(d.x0),
    y0: r(d.y0),
    x1: r(d.x1),
    y1: r(d.y1),
  }
}

function r(x) {
  return Math.round(x * 100) / 100
}
import assert from "assert"
import { treemapSlice } from "../../src/index.js"
import { round } from "./round.js"

it("treemapSlice(parent, x0, y0, x1, y1) generates a sliced layout", () => {
  const tile = treemapSlice
  const root = {
    value: 24,
    children: [{ value: 6 }, { value: 6 }, { value: 4 }, { value: 3 }, { value: 2 }, { value: 2 }, { value: 1 }],
  }
  tile(root, 0, 0, 6, 4)
  assert.deepStrictEqual(root.children.map(round), [
    { x0: 0.0, x1: 6.0, y0: 0.0, y1: 1.0 },
    { x0: 0.0, x1: 6.0, y0: 1.0, y1: 2.0 },
    { x0: 0.0, x1: 6.0, y0: 2.0, y1: 2.67 },
    { x0: 0.0, x1: 6.0, y0: 2.67, y1: 3.17 },
    { x0: 0.0, x1: 6.0, y0: 3.17, y1: 3.5 },
    { x0: 0.0, x1: 6.0, y0: 3.5, y1: 3.83 },
    { x0: 0.0, x1: 6.0, y0: 3.83, y1: 4.0 },
  ])
})

it("treemapSlice(parent, x0, y0, x1, y1) handles a degenerate empty parent", () => {
  const tile = treemapSlice
  const root = {
    value: 0,
    children: [{ value: 0 }, { value: 0 }],
  }
  tile(root, 0, 0, 4, 0)
  assert.deepStrictEqual(root.children.map(round), [
    { x0: 0.0, x1: 4.0, y0: 0.0, y1: 0.0 },
    { x0: 0.0, x1: 4.0, y0: 0.0, y1: 0.0 },
  ])
})
import assert from "assert"
import { treemapSliceDice } from "../../src/index.js"
import { round } from "./round.js"

it("treemapSliceDice(parent, x0, y0, x1, y1) uses slice for odd depth", () => {
  const tile = treemapSliceDice
  const root = {
    depth: 1,
    value: 24,
    children: [{ value: 6 }, { value: 6 }, { value: 4 }, { value: 3 }, { value: 2 }, { value: 2 }, { value: 1 }],
  }
  tile(root, 0, 0, 6, 4)
  assert.deepStrictEqual(root.children.map(round), [
    { x0: 0.0, x1: 6.0, y0: 0.0, y1: 1.0 },
    { x0: 0.0, x1: 6.0, y0: 1.0, y1: 2.0 },
    { x0: 0.0, x1: 6.0, y0: 2.0, y1: 2.67 },
    { x0: 0.0, x1: 6.0, y0: 2.67, y1: 3.17 },
    { x0: 0.0, x1: 6.0, y0: 3.17, y1: 3.5 },
    { x0: 0.0, x1: 6.0, y0: 3.5, y1: 3.83 },
    { x0: 0.0, x1: 6.0, y0: 3.83, y1: 4.0 },
  ])
})

it("treemapSliceDice(parent, x0, y0, x1, y1) uses dice for even depth", () => {
  const tile = treemapSliceDice
  const root = {
    depth: 2,
    value: 24,
    children: [{ value: 6 }, { value: 6 }, { value: 4 }, { value: 3 }, { value: 2 }, { value: 2 }, { value: 1 }],
  }
  tile(root, 0, 0, 4, 6)
  assert.deepStrictEqual(root.children.map(round), [
    { x0: 0.0, x1: 1.0, y0: 0.0, y1: 6.0 },
    { x0: 1.0, x1: 2.0, y0: 0.0, y1: 6.0 },
    { x0: 2.0, x1: 2.67, y0: 0.0, y1: 6.0 },
    { x0: 2.67, x1: 3.17, y0: 0.0, y1: 6.0 },
    { x0: 3.17, x1: 3.5, y0: 0.0, y1: 6.0 },
    { x0: 3.5, x1: 3.83, y0: 0.0, y1: 6.0 },
    { x0: 3.83, x1: 4.0, y0: 0.0, y1: 6.0 },
  ])
})
import assert from "assert"
import { treemapSquarify } from "../../src/index.js"
import { round } from "./round.js"

it("treemapSquarify(parent, x0, y0, x1, y1) generates a squarified layout", () => {
  const tile = treemapSquarify
  const root = {
    value: 24,
    children: [{ value: 6 }, { value: 6 }, { value: 4 }, { value: 3 }, { value: 2 }, { value: 2 }, { value: 1 }],
  }
  tile(root, 0, 0, 6, 4)
  assert.deepStrictEqual(root.children.map(round), [
    { x0: 0.0, x1: 3.0, y0: 0.0, y1: 2.0 },
    { x0: 0.0, x1: 3.0, y0: 2.0, y1: 4.0 },
    { x0: 3.0, x1: 4.71, y0: 0.0, y1: 2.33 },
    { x0: 4.71, x1: 6.0, y0: 0.0, y1: 2.33 },
    { x0: 3.0, x1: 5.4, y0: 2.33, y1: 3.17 },
    { x0: 3.0, x1: 5.4, y0: 3.17, y1: 4.0 },
    { x0: 5.4, x1: 6.0, y0: 2.33, y1: 4.0 },
  ])
})

it("treemapSquarify(parent, x0, y0, x1, y1) does not produce a stable update", () => {
  const tile = treemapSquarify
  const root = { value: 20, children: [{ value: 10 }, { value: 10 }] }
  tile(root, 0, 0, 20, 10)
  assert.deepStrictEqual(root.children.map(round), [
    { x0: 0, x1: 10, y0: 0, y1: 10 },
    { x0: 10, x1: 20, y0: 0, y1: 10 },
  ])
  tile(root, 0, 0, 10, 20)
  assert.deepStrictEqual(root.children.map(round), [
    { x0: 0, x1: 10, y0: 0, y1: 10 },
    { x0: 0, x1: 10, y0: 10, y1: 20 },
  ])
})

it("treemapSquarify.ratio(ratio) observes the specified ratio", () => {
  const tile = treemapSquarify.ratio(1)
  const root = {
    value: 24,
    children: [{ value: 6 }, { value: 6 }, { value: 4 }, { value: 3 }, { value: 2 }, { value: 2 }, { value: 1 }],
  }
  tile(root, 0, 0, 6, 4)
  assert.deepStrictEqual(root.children.map(round), [
    { x0: 0.0, x1: 3.0, y0: 0.0, y1: 2.0 },
    { x0: 0.0, x1: 3.0, y0: 2.0, y1: 4.0 },
    { x0: 3.0, x1: 4.71, y0: 0.0, y1: 2.33 },
    { x0: 4.71, x1: 6.0, y0: 0.0, y1: 2.33 },
    { x0: 3.0, x1: 4.2, y0: 2.33, y1: 4.0 },
    { x0: 4.2, x1: 5.4, y0: 2.33, y1: 4.0 },
    { x0: 5.4, x1: 6.0, y0: 2.33, y1: 4.0 },
  ])
})

it("treemapSquarify(parent, x0, y0, x1, y1) handles a degenerate tall empty parent", () => {
  const tile = treemapSquarify
  const root = {
    value: 0,
    children: [{ value: 0 }, { value: 0 }],
  }
  tile(root, 0, 0, 0, 4)
  assert.deepStrictEqual(root.children.map(round), [
    { x0: 0.0, x1: 0.0, y0: 0.0, y1: 4.0 },
    { x0: 0.0, x1: 0.0, y0: 0.0, y1: 4.0 },
  ])
})

it("treemapSquarify(parent, x0, y0, x1, y1) handles a degenerate wide empty parent", () => {
  const tile = treemapSquarify
  const root = {
    value: 0,
    children: [{ value: 0 }, { value: 0 }],
  }
  tile(root, 0, 0, 4, 0)
  assert.deepStrictEqual(root.children.map(round), [
    { x0: 0.0, x1: 4.0, y0: 0.0, y1: 0.0 },
    { x0: 0.0, x1: 4.0, y0: 0.0, y1: 0.0 },
  ])
})

it("treemapSquarify(parent, x0, y0, x1, y1) handles a leading zero value", () => {
  const tile = treemapSquarify
  const root = {
    value: 24,
    children: [
      { value: 0 },
      { value: 6 },
      { value: 6 },
      { value: 4 },
      { value: 3 },
      { value: 2 },
      { value: 2 },
      { value: 1 },
    ],
  }
  tile(root, 0, 0, 6, 4)
  assert.deepStrictEqual(root.children.map(round), [
    { x0: 0.0, x1: 3.0, y0: 0.0, y1: 0.0 },
    { x0: 0.0, x1: 3.0, y0: 0.0, y1: 2.0 },
    { x0: 0.0, x1: 3.0, y0: 2.0, y1: 4.0 },
    { x0: 3.0, x1: 4.71, y0: 0.0, y1: 2.33 },
    { x0: 4.71, x1: 6.0, y0: 0.0, y1: 2.33 },
    { x0: 3.0, x1: 5.4, y0: 2.33, y1: 3.17 },
    { x0: 3.0, x1: 5.4, y0: 3.17, y1: 4.0 },
    { x0: 5.4, x1: 6.0, y0: 2.33, y1: 4.0 },
  ])
})
