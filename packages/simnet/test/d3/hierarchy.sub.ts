import assert from "assert"
import { hierarchy } from "../../src/index.js"

it("node.copy() copies values", () => {
  const root = hierarchy({ id: "root", children: [{ id: "a" }, { id: "b", children: [{ id: "ba" }] }] }).count()
  assert.strictEqual(root.copy().value, 2)
})
import assert from "assert"
import { hierarchy } from "../../src/index.js"

const tree = {
  id: "root",
  children: [
    { id: "a", children: [{ id: "ab" }] },
    { id: "b", children: [{ id: "ba" }] },
  ],
}

it("node.each() traverses a hierarchy in breadth-first order", () => {
  const root = hierarchy(tree)
  const a = []
  root.each(d => void a.push(d.data.id))
  assert.deepStrictEqual(a, ["root", "a", "b", "ab", "ba"])
})

it("node.eachBefore() traverses a hierarchy in pre-order traversal", () => {
  const root = hierarchy(tree)
  const a = []
  root.eachBefore(d => void a.push(d.data.id))
  assert.deepStrictEqual(a, ["root", "a", "ab", "b", "ba"])
})

it("node.eachAfter() traverses a hierarchy in post-order traversal", () => {
  const root = hierarchy(tree)
  const a = []
  root.eachAfter(d => void a.push(d.data.id))
  assert.deepStrictEqual(a, ["ab", "a", "ba", "b", "root"])
})

it("a hierarchy is an iterable equivalent to *node*.each()", () => {
  const root = hierarchy(tree)
  const a = Array.from(root, d => d.data.id)
  assert.deepStrictEqual(a, ["root", "a", "b", "ab", "ba"])
})
import assert from "assert"
import { hierarchy } from "../../src/index.js"

it("node.find() finds nodes", () => {
  const root = hierarchy({ id: "root", children: [{ id: "a" }, { id: "b", children: [{ id: "ba" }] }] }).count()
  assert.strictEqual(root.find(d => d.data.id == "b").data.id, "b")
  assert.strictEqual(root.find((d, i) => i == 0).data.id, "root")
  assert.strictEqual(root.find((d, i, e) => d !== e).data.id, "a")
})
import assert from "assert"
import { hierarchy } from "../../src/index.js"

it("d3.hierarchy(data, children) supports iterable children", () => {
  const root = hierarchy({
    id: "root",
    children: new Set([{ id: "a" }, { id: "b", children: new Set([{ id: "ba" }]) }]),
  })
  const a = root.children[0]
  const b = root.children[1]
  const ba = root.children[1].children[0]
  assert.deepStrictEqual(root.links(), [
    { source: root, target: a },
    { source: root, target: b },
    { source: b, target: ba },
  ])
})

it("d3.hierarchy(data, children) ignores non-iterable children", () => {
  const root = hierarchy({
    id: "root",
    children: [
      { id: "a", children: null },
      { id: "b", children: 42 },
    ],
  })
  const a = root.children[0]
  const b = root.children[1]
  assert.deepStrictEqual(root.links(), [
    { source: root, target: a },
    { source: root, target: b },
  ])
})
import assert from "assert"
import { hierarchy } from "../../src/index.js"

it("node.links() returns an array of {source, target}", () => {
  const root = hierarchy({ id: "root", children: [{ id: "a" }, { id: "b", children: [{ id: "ba" }] }] })
  const a = root.children[0]
  const b = root.children[1]
  const ba = root.children[1].children[0]
  assert.deepStrictEqual(root.links(), [
    { source: root, target: a },
    { source: root, target: b },
    { source: b, target: ba },
  ])
})
