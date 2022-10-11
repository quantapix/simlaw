import assert from "assert"
import { area, line, curveBasis } from "../../src/index.js"
import { assertPathEqual } from "../asserts.js"

it("line.curve(curveBasis)(data) generates the expected path", () => {
  const l = line().curve(curveBasis)
  assert.strictEqual(l([]), null)
  assertPathEqual(l([[0, 1]]), "M0,1Z")
  assertPathEqual(
    l([
      [0, 1],
      [1, 3],
    ]),
    "M0,1L1,3"
  )
  assertPathEqual(
    l([
      [0, 1],
      [1, 3],
      [2, 1],
    ]),
    "M0,1L0.166667,1.333333C0.333333,1.666667,0.666667,2.333333,1,2.333333C1.333333,2.333333,1.666667,1.666667,1.833333,1.333333L2,1"
  )
})

it("area.curve(curveBasis)(data) generates the expected path", () => {
  const a = area().curve(curveBasis)
  assert.strictEqual(a([]), null)
  assertPathEqual(a([[0, 1]]), "M0,1L0,0Z")
  assertPathEqual(
    a([
      [0, 1],
      [1, 3],
    ]),
    "M0,1L1,3L1,0L0,0Z"
  )
  assertPathEqual(
    a([
      [0, 1],
      [1, 3],
      [2, 1],
    ]),
    "M0,1L0.166667,1.333333C0.333333,1.666667,0.666667,2.333333,1,2.333333C1.333333,2.333333,1.666667,1.666667,1.833333,1.333333L2,1L2,0L1.833333,0C1.666667,0,1.333333,0,1,0C0.666667,0,0.333333,0,0.166667,0L0,0Z"
  )
})
import assert from "assert"
import { line, curveBasisClosed } from "../../src/index.js"
import { assertPathEqual } from "../asserts.js"

it("line.curve(curveBasisClosed)(data) generates the expected path", () => {
  const l = line().curve(curveBasisClosed)
  assert.strictEqual(l([]), null)
  assertPathEqual(l([[0, 0]]), "M0,0Z")
  assertPathEqual(
    l([
      [0, 0],
      [0, 10],
    ]),
    "M0,6.666667L0,3.333333Z"
  )
  assertPathEqual(
    l([
      [0, 0],
      [0, 10],
      [10, 10],
    ]),
    "M1.666667,8.333333C3.333333,10,6.666667,10,6.666667,8.333333C6.666667,6.666667,3.333333,3.333333,1.666667,3.333333C0,3.333333,0,6.666667,1.666667,8.333333"
  )
  assertPathEqual(
    l([
      [0, 0],
      [0, 10],
      [10, 10],
      [10, 0],
    ]),
    "M1.666667,8.333333C3.333333,10,6.666667,10,8.333333,8.333333C10,6.666667,10,3.333333,8.333333,1.666667C6.666667,0,3.333333,0,1.666667,1.666667C0,3.333333,0,6.666667,1.666667,8.333333"
  )
  assertPathEqual(
    l([
      [0, 0],
      [0, 10],
      [10, 10],
      [10, 0],
      [0, 0],
    ]),
    "M1.666667,8.333333C3.333333,10,6.666667,10,8.333333,8.333333C10,6.666667,10,3.333333,8.333333,1.666667C6.666667,0,3.333333,0,1.666667,0C0,0,0,0,0,1.666667C0,3.333333,0,6.666667,1.666667,8.333333"
  )
})
import assert from "assert"
import { area, line, curveBasisOpen } from "../../src/index.js"
import { assertPathEqual } from "../asserts.js"

it("line.curve(curveBasisOpen)(data) generates the expected path", () => {
  const l = line().curve(curveBasisOpen)
  assert.strictEqual(l([]), null)
  assert.strictEqual(l([[0, 0]]), null)
  assert.strictEqual(
    l([
      [0, 0],
      [0, 10],
    ]),
    null
  )
  assertPathEqual(
    l([
      [0, 0],
      [0, 10],
      [10, 10],
    ]),
    "M1.666667,8.333333Z"
  )
  assertPathEqual(
    l([
      [0, 0],
      [0, 10],
      [10, 10],
      [10, 0],
    ]),
    "M1.666667,8.333333C3.333333,10,6.666667,10,8.333333,8.333333"
  )
  assertPathEqual(
    l([
      [0, 0],
      [0, 10],
      [10, 10],
      [10, 0],
      [0, 0],
    ]),
    "M1.666667,8.333333C3.333333,10,6.666667,10,8.333333,8.333333C10,6.666667,10,3.333333,8.333333,1.666667"
  )
})

it("area.curve(curveBasisOpen)(data) generates the expected path", () => {
  const a = area().curve(curveBasisOpen)
  assert.strictEqual(a([]), null)
  assert.strictEqual(a([[0, 1]]), null)
  assert.strictEqual(
    a([
      [0, 1],
      [1, 3],
    ]),
    null
  )
  assertPathEqual(
    a([
      [0, 0],
      [0, 10],
      [10, 10],
    ]),
    "M1.666667,8.333333L1.666667,0Z"
  )
  assertPathEqual(
    a([
      [0, 0],
      [0, 10],
      [10, 10],
      [10, 0],
    ]),
    "M1.666667,8.333333C3.333333,10,6.666667,10,8.333333,8.333333L8.333333,0C6.666667,0,3.333333,0,1.666667,0Z"
  )
  assertPathEqual(
    a([
      [0, 0],
      [0, 10],
      [10, 10],
      [10, 0],
      [0, 0],
    ]),
    "M1.666667,8.333333C3.333333,10,6.666667,10,8.333333,8.333333C10,6.666667,10,3.333333,8.333333,1.666667L8.333333,0C10,0,10,0,8.333333,0C6.666667,0,3.333333,0,1.666667,0Z"
  )
})
import assert from "assert"
import { area, line, curveBumpX } from "../../src/index.js"
import { assertPathEqual } from "../asserts.js"

it("line.curve(curveBumpX)(data) generates the expected path", () => {
  const l = line().curve(curveBumpX)
  assert.strictEqual(l([]), null)
  assertPathEqual(l([[0, 1]]), "M0,1Z")
  assertPathEqual(
    l([
      [0, 1],
      [1, 3],
    ]),
    "M0,1C0.500000,1,0.500000,3,1,3"
  )
  assertPathEqual(
    l([
      [0, 1],
      [1, 3],
      [2, 1],
    ]),
    "M0,1C0.500000,1,0.500000,3,1,3C1.500000,3,1.500000,1,2,1"
  )
})

it("area.curve(curveBumpX)(data) generates the expected path", () => {
  const a = area().curve(curveBumpX)
  assert.strictEqual(a([]), null)
  assertPathEqual(a([[0, 1]]), "M0,1L0,0Z")
  assertPathEqual(
    a([
      [0, 1],
      [1, 3],
    ]),
    "M0,1C0.500000,1,0.500000,3,1,3L1,0C0.500000,0,0.500000,0,0,0Z"
  )
  assertPathEqual(
    a([
      [0, 1],
      [1, 3],
      [2, 1],
    ]),
    "M0,1C0.500000,1,0.500000,3,1,3C1.500000,3,1.500000,1,2,1L2,0C1.500000,0,1.500000,0,1,0C0.500000,0,0.500000,0,0,0Z"
  )
})
import assert from "assert"
import { area, line, curveBumpY } from "../../src/index.js"
import { assertPathEqual } from "../asserts.js"

it("line.curve(curveBumpY)(data) generates the expected path", () => {
  const l = line().curve(curveBumpY)
  assert.strictEqual(l([]), null)
  assertPathEqual(l([[0, 1]]), "M0,1Z")
  assertPathEqual(
    l([
      [0, 1],
      [1, 3],
    ]),
    "M0,1C0,2,1,2,1,3"
  )
  assertPathEqual(
    l([
      [0, 1],
      [1, 3],
      [2, 1],
    ]),
    "M0,1C0,2,1,2,1,3C1,2,2,2,2,1"
  )
})

it("area.curve(curveBumpY)(data) generates the expected path", () => {
  const a = area().curve(curveBumpY)
  assert.strictEqual(a([]), null)
  assertPathEqual(a([[0, 1]]), "M0,1L0,0Z")
  assertPathEqual(
    a([
      [0, 1],
      [1, 3],
    ]),
    "M0,1C0,2,1,2,1,3L1,0C1,0,0,0,0,0Z"
  )
  assertPathEqual(
    a([
      [0, 1],
      [1, 3],
      [2, 1],
    ]),
    "M0,1C0,2,1,2,1,3C1,2,2,2,2,1L2,0C2,0,1,0,1,0C1,0,0,0,0,0Z"
  )
})
import assert from "assert"
import { line, curveBundle } from "../../src/index.js"

it("line.curve(curveBundle) uses a default beta of 0.85", () => {
  const l = line().curve(curveBundle.beta(0.85))
  assert.strictEqual(
    line().curve(curveBundle)([
      [0, 1],
      [1, 3],
      [2, 1],
      [3, 3],
    ]),
    l([
      [0, 1],
      [1, 3],
      [2, 1],
      [3, 3],
    ])
  )
})

it("line.curve(curveBundle.beta(beta)) uses the specified beta", () => {
  assert.strictEqual(
    line().curve(curveBundle.beta(0.5))([
      [0, 1],
      [1, 3],
      [2, 1],
      [3, 3],
    ]),
    "M0,1L0.16666666666666666,1.222222222222222C0.3333333333333333,1.4444444444444444,0.6666666666666666,1.8888888888888886,1,1.9999999999999998C1.3333333333333333,2.1111111111111107,1.6666666666666667,1.8888888888888886,2,2C2.3333333333333335,2.111111111111111,2.6666666666666665,2.5555555555555554,2.8333333333333335,2.7777777777777772L3,3"
  )
})

it("line.curve(curveBundle.beta(beta)) coerces the specified beta to a number", () => {
  const l = line().curve(curveBundle.beta("0.5"))
  assert.strictEqual(
    line().curve(curveBundle.beta(0.5))([
      [0, 1],
      [1, 3],
      [2, 1],
      [3, 3],
    ]),
    l([
      [0, 1],
      [1, 3],
      [2, 1],
      [3, 3],
    ])
  )
})
import assert from "assert"
import { area, line, curveCardinal } from "../../src/index.js"
import { assertPathEqual } from "../asserts.js"

it("line.curve(curveCardinal)(data) generates the expected path", () => {
  const l = line().curve(curveCardinal)
  assert.strictEqual(l([]), null)
  assertPathEqual(l([[0, 1]]), "M0,1Z")
  assertPathEqual(
    l([
      [0, 1],
      [1, 3],
    ]),
    "M0,1L1,3"
  )
  assertPathEqual(
    l([
      [0, 1],
      [1, 3],
      [2, 1],
    ]),
    "M0,1C0,1,0.666667,3,1,3C1.333333,3,2,1,2,1"
  )
  assertPathEqual(
    l([
      [0, 1],
      [1, 3],
      [2, 1],
      [3, 3],
    ]),
    "M0,1C0,1,0.666667,3,1,3C1.333333,3,1.666667,1,2,1C2.333333,1,3,3,3,3"
  )
})

it("line.curve(curveCardinal) uses a default tension of zero", () => {
  const l = line().curve(curveCardinal.tension(0))
  assert.strictEqual(
    line().curve(curveCardinal)([
      [0, 1],
      [1, 3],
      [2, 1],
      [3, 3],
    ]),
    l([
      [0, 1],
      [1, 3],
      [2, 1],
      [3, 3],
    ])
  )
})

it("line.curve(curveCardinal.tension(tension)) uses the specified tension", () => {
  assertPathEqual(
    line().curve(curveCardinal.tension(0.5))([
      [0, 1],
      [1, 3],
      [2, 1],
      [3, 3],
    ]),
    "M0,1C0,1,0.833333,3,1,3C1.166667,3,1.833333,1,2,1C2.166667,1,3,3,3,3"
  )
})

it("line.curve(curveCardinal.tension(tension)) coerces the specified tension to a number", () => {
  const l = line().curve(curveCardinal.tension("0.5"))
  assert.strictEqual(
    line().curve(curveCardinal.tension(0.5))([
      [0, 1],
      [1, 3],
      [2, 1],
      [3, 3],
    ]),
    l([
      [0, 1],
      [1, 3],
      [2, 1],
      [3, 3],
    ])
  )
})

it("area.curve(curveCardinal)(data) generates the expected path", () => {
  const a = area().curve(curveCardinal)
  assert.strictEqual(a([]), null)
  assertPathEqual(a([[0, 1]]), "M0,1L0,0Z")
  assertPathEqual(
    a([
      [0, 1],
      [1, 3],
    ]),
    "M0,1L1,3L1,0L0,0Z"
  )
  assertPathEqual(
    a([
      [0, 1],
      [1, 3],
      [2, 1],
    ]),
    "M0,1C0,1,0.666667,3,1,3C1.333333,3,2,1,2,1L2,0C2,0,1.333333,0,1,0C0.666667,0,0,0,0,0Z"
  )
  assertPathEqual(
    a([
      [0, 1],
      [1, 3],
      [2, 1],
      [3, 3],
    ]),
    "M0,1C0,1,0.666667,3,1,3C1.333333,3,1.666667,1,2,1C2.333333,1,3,3,3,3L3,0C3,0,2.333333,0,2,0C1.666667,0,1.333333,0,1,0C0.666667,0,0,0,0,0Z"
  )
})

it("area.curve(curveCardinal) uses a default tension of zero", () => {
  const a = area().curve(curveCardinal.tension(0))
  assert.strictEqual(
    area().curve(curveCardinal)([
      [0, 1],
      [1, 3],
      [2, 1],
      [3, 3],
    ]),
    a([
      [0, 1],
      [1, 3],
      [2, 1],
      [3, 3],
    ])
  )
})

it("area.curve(curveCardinal.tension(tension)) uses the specified tension", () => {
  assertPathEqual(
    area().curve(curveCardinal.tension(0.5))([
      [0, 1],
      [1, 3],
      [2, 1],
      [3, 3],
    ]),
    "M0,1C0,1,0.833333,3,1,3C1.166667,3,1.833333,1,2,1C2.166667,1,3,3,3,3L3,0C3,0,2.166667,0,2,0C1.833333,0,1.166667,0,1,0C0.833333,0,0,0,0,0Z"
  )
})

it("area.curve(curveCardinal.tension(tension)) coerces the specified tension to a number", () => {
  const a = area().curve(curveCardinal.tension("0.5"))
  assert.strictEqual(
    area().curve(curveCardinal.tension(0.5))([
      [0, 1],
      [1, 3],
      [2, 1],
      [3, 3],
    ]),
    a([
      [0, 1],
      [1, 3],
      [2, 1],
      [3, 3],
    ])
  )
})
import assert from "assert"
import { area, line, curveCardinalClosed } from "../../src/index.js"
import { assertPathEqual } from "../asserts.js"

it("line.curve(curveCardinalClosed)(data) generates the expected path", () => {
  const l = line().curve(curveCardinalClosed)
  assert.strictEqual(l([]), null)
  assertPathEqual(l([[0, 1]]), "M0,1Z")
  assertPathEqual(
    l([
      [0, 1],
      [1, 3],
    ]),
    "M1,3L0,1Z"
  )
  assertPathEqual(
    l([
      [0, 1],
      [1, 3],
      [2, 1],
    ]),
    "M1,3C1.333333,3,2.166667,1.333333,2,1C1.833333,0.666667,0.166667,0.666667,0,1C-0.166667,1.333333,0.666667,3,1,3"
  )
  assertPathEqual(
    l([
      [0, 1],
      [1, 3],
      [2, 1],
      [3, 3],
    ]),
    "M1,3C1.333333,3,1.666667,1,2,1C2.333333,1,3.333333,3,3,3C2.666667,3,0.333333,1,0,1C-0.333333,1,0.666667,3,1,3"
  )
})

it("line.curve(curveCardinalClosed) uses a default tension of zero", () => {
  const l = line().curve(curveCardinalClosed.tension(0))
  assert.strictEqual(
    line().curve(curveCardinalClosed)([
      [0, 1],
      [1, 3],
      [2, 1],
      [3, 3],
    ]),
    l([
      [0, 1],
      [1, 3],
      [2, 1],
      [3, 3],
    ])
  )
})

it("line.curve(curveCardinalClosed.tension(tension)) uses the specified tension", () => {
  assertPathEqual(
    line().curve(curveCardinalClosed.tension(0.5))([
      [0, 1],
      [1, 3],
      [2, 1],
      [3, 3],
    ]),
    "M1,3C1.166667,3,1.833333,1,2,1C2.166667,1,3.166667,3,3,3C2.833333,3,0.166667,1,0,1C-0.166667,1,0.833333,3,1,3"
  )
})

it("line.curve(curveCardinalClosed.tension(tension)) coerces the specified tension to a number", () => {
  const l = line().curve(curveCardinalClosed.tension("0.5"))
  assert.strictEqual(
    line().curve(curveCardinalClosed.tension(0.5))([
      [0, 1],
      [1, 3],
      [2, 1],
      [3, 3],
    ]),
    l([
      [0, 1],
      [1, 3],
      [2, 1],
      [3, 3],
    ])
  )
})

it("area.curve(curveCardinalClosed)(data) generates the expected path", () => {
  const a = area().curve(curveCardinalClosed)
  assert.strictEqual(a([]), null)
  assert.strictEqual(a([[0, 1]]), "M0,1ZM0,0Z")
  assert.strictEqual(
    a([
      [0, 1],
      [1, 3],
    ]),
    "M1,3L0,1ZM0,0L1,0Z"
  )
  assertPathEqual(
    a([
      [0, 1],
      [1, 3],
      [2, 1],
    ]),
    "M1,3C1.333333,3,2.166667,1.333333,2,1C1.833333,0.666667,0.166667,0.666667,0,1C-0.166667,1.333333,0.666667,3,1,3M1,0C0.666667,0,-0.166667,0,0,0C0.166667,0,1.833333,0,2,0C2.166667,0,1.333333,0,1,0"
  )
  assertPathEqual(
    a([
      [0, 1],
      [1, 3],
      [2, 1],
      [3, 3],
    ]),
    "M1,3C1.333333,3,1.666667,1,2,1C2.333333,1,3.333333,3,3,3C2.666667,3,0.333333,1,0,1C-0.333333,1,0.666667,3,1,3M2,0C1.666667,0,1.333333,0,1,0C0.666667,0,-0.333333,0,0,0C0.333333,0,2.666667,0,3,0C3.333333,0,2.333333,0,2,0"
  )
})

it("area.curve(curveCardinalClosed) uses a default tension of zero", () => {
  const a = area().curve(curveCardinalClosed.tension(0))
  assert.strictEqual(
    area().curve(curveCardinalClosed)([
      [0, 1],
      [1, 3],
      [2, 1],
      [3, 3],
    ]),
    a([
      [0, 1],
      [1, 3],
      [2, 1],
      [3, 3],
    ])
  )
})

it("area.curve(curveCardinalClosed.tension(tension)) uses the specified tension", () => {
  assertPathEqual(
    area().curve(curveCardinalClosed.tension(0.5))([
      [0, 1],
      [1, 3],
      [2, 1],
      [3, 3],
    ]),
    "M1,3C1.166667,3,1.833333,1,2,1C2.166667,1,3.166667,3,3,3C2.833333,3,0.166667,1,0,1C-0.166667,1,0.833333,3,1,3M2,0C1.833333,0,1.166667,0,1,0C0.833333,0,-0.166667,0,0,0C0.166667,0,2.833333,0,3,0C3.166667,0,2.166667,0,2,0"
  )
})

it("area.curve(curveCardinalClosed.tension(tension)) coerces the specified tension to a number", () => {
  const a = area().curve(curveCardinalClosed.tension("0.5"))
  assert.strictEqual(
    area().curve(curveCardinalClosed.tension(0.5))([
      [0, 1],
      [1, 3],
      [2, 1],
      [3, 3],
    ]),
    a([
      [0, 1],
      [1, 3],
      [2, 1],
      [3, 3],
    ])
  )
})
import assert from "assert"
import { area, line, curveCardinalOpen } from "../../src/index.js"
import { assertPathEqual } from "../asserts.js"

it("line.curve(curveCardinalOpen)(data) generates the expected path", () => {
  const l = line().curve(curveCardinalOpen)
  assert.strictEqual(l([]), null)
  assert.strictEqual(l([[0, 1]]), null)
  assert.strictEqual(
    l([
      [0, 1],
      [1, 3],
    ]),
    null
  )
  assertPathEqual(
    l([
      [0, 1],
      [1, 3],
      [2, 1],
    ]),
    "M1,3Z"
  )
  assertPathEqual(
    l([
      [0, 1],
      [1, 3],
      [2, 1],
      [3, 3],
    ]),
    "M1,3C1.333333,3,1.666667,1,2,1"
  )
})

it("line.curve(curveCardinalOpen) uses a default tension of zero", () => {
  const l = line().curve(curveCardinalOpen.tension(0))
  assert.strictEqual(
    line().curve(curveCardinalOpen)([
      [0, 1],
      [1, 3],
      [2, 1],
      [3, 3],
    ]),
    l([
      [0, 1],
      [1, 3],
      [2, 1],
      [3, 3],
    ])
  )
})

it("line.curve(curveCardinalOpen.tension(tension)) uses the specified tension", () => {
  assertPathEqual(
    line().curve(curveCardinalOpen.tension(0.5))([
      [0, 1],
      [1, 3],
      [2, 1],
      [3, 3],
    ]),
    "M1,3C1.166667,3,1.833333,1,2,1"
  )
})

it("line.curve(curveCardinalOpen.tension(tension)) coerces the specified tension to a number", () => {
  const l = line().curve(curveCardinalOpen.tension("0.5"))
  assert.strictEqual(
    line().curve(curveCardinalOpen.tension(0.5))([
      [0, 1],
      [1, 3],
      [2, 1],
      [3, 3],
    ]),
    l([
      [0, 1],
      [1, 3],
      [2, 1],
      [3, 3],
    ])
  )
})

it("area.curve(curveCardinalOpen)(data) generates the expected path", () => {
  const a = area().curve(curveCardinalOpen)
  assert.strictEqual(a([]), null)
  assert.strictEqual(a([[0, 1]]), null)
  assert.strictEqual(
    a([
      [0, 1],
      [1, 3],
    ]),
    null
  )
  assertPathEqual(
    a([
      [0, 1],
      [1, 3],
      [2, 1],
    ]),
    "M1,3L1,0Z"
  )
  assertPathEqual(
    a([
      [0, 1],
      [1, 3],
      [2, 1],
      [3, 3],
    ]),
    "M1,3C1.333333,3,1.666667,1,2,1L2,0C1.666667,0,1.333333,0,1,0Z"
  )
})

it("area.curve(curveCardinalOpen) uses a default tension of zero", () => {
  const a = area().curve(curveCardinalOpen.tension(0))
  assert.strictEqual(
    area().curve(curveCardinalOpen)([
      [0, 1],
      [1, 3],
      [2, 1],
      [3, 3],
    ]),
    a([
      [0, 1],
      [1, 3],
      [2, 1],
      [3, 3],
    ])
  )
})

it("area.curve(curveCardinalOpen.tension(tension)) uses the specified tension", () => {
  assertPathEqual(
    area().curve(curveCardinalOpen.tension(0.5))([
      [0, 1],
      [1, 3],
      [2, 1],
      [3, 3],
    ]),
    "M1,3C1.166667,3,1.833333,1,2,1L2,0C1.833333,0,1.166667,0,1,0Z"
  )
})

it("area.curve(curveCardinalOpen.tension(tension)) coerces the specified tension to a number", () => {
  const a = area().curve(curveCardinalOpen.tension("0.5"))
  assert.strictEqual(
    area().curve(curveCardinalOpen.tension(0.5))([
      [0, 1],
      [1, 3],
      [2, 1],
      [3, 3],
    ]),
    a([
      [0, 1],
      [1, 3],
      [2, 1],
      [3, 3],
    ])
  )
})
import assert from "assert"
import { area, line, curveCatmullRom } from "../../src/index.js"
import { assertPathEqual } from "../asserts.js"

it("line.curve(curveCatmullRom)(data) generates the expected path", () => {
  const l = line().curve(curveCatmullRom)
  assert.strictEqual(l([]), null)
  assertPathEqual(l([[0, 1]]), "M0,1Z")
  assertPathEqual(
    l([
      [0, 1],
      [1, 3],
    ]),
    "M0,1L1,3"
  )
  assertPathEqual(
    l([
      [0, 1],
      [1, 3],
      [2, 1],
    ]),
    "M0,1C0,1,0.666667,3,1,3C1.333333,3,2,1,2,1"
  )
  assertPathEqual(
    l([
      [0, 1],
      [1, 3],
      [2, 1],
      [3, 3],
    ]),
    "M0,1C0,1,0.666667,3,1,3C1.333333,3,1.666667,1,2,1C2.333333,1,3,3,3,3"
  )
})

it("line.curve(curveCatmullRom.alpha(1))(data) generates the expected path", () => {
  const l = line().curve(curveCatmullRom.alpha(1))
  assert.strictEqual(l([]), null)
  assertPathEqual(l([[0, 1]]), "M0,1Z")
  assertPathEqual(
    l([
      [0, 1],
      [1, 3],
    ]),
    "M0,1L1,3"
  )
  assertPathEqual(
    l([
      [0, 1],
      [1, 3],
      [2, 1],
    ]),
    "M0,1C0,1,0.666667,3,1,3C1.333333,3,2,1,2,1"
  )
  assertPathEqual(
    l([
      [0, 1],
      [1, 3],
      [2, 1],
      [3, 3],
    ]),
    "M0,1C0,1,0.666667,3,1,3C1.333333,3,1.666667,1,2,1C2.333333,1,3,3,3,3"
  )
})

it("line.curve(curveCatmullRom) uses a default alpha of 0.5 (centripetal)", () => {
  const l = line().curve(curveCatmullRom.alpha(0.5))
  assert.strictEqual(
    line().curve(curveCatmullRom)([
      [0, 1],
      [1, 3],
      [2, 1],
      [3, 3],
    ]),
    l([
      [0, 1],
      [1, 3],
      [2, 1],
      [3, 3],
    ])
  )
})

it("line.curve(curveCatmullRom.alpha(alpha)) coerces the specified alpha to a number", () => {
  const l = line().curve(curveCatmullRom.alpha("0.5"))
  assert.strictEqual(
    line().curve(curveCatmullRom.alpha(0.5))([
      [0, 1],
      [1, 3],
      [2, 1],
      [3, 3],
    ]),
    l([
      [0, 1],
      [1, 3],
      [2, 1],
      [3, 3],
    ])
  )
})

it("area.curve(curveCatmullRom.alpha(0))(data) generates the expected path", () => {
  const a = area().curve(curveCatmullRom.alpha(0))
  assert.strictEqual(a([]), null)
  assertPathEqual(a([[0, 1]]), "M0,1L0,0Z")
  assertPathEqual(
    a([
      [0, 1],
      [1, 3],
    ]),
    "M0,1L1,3L1,0L0,0Z"
  )
  assertPathEqual(
    a([
      [0, 1],
      [1, 3],
      [2, 1],
    ]),
    "M0,1C0,1,0.666667,3,1,3C1.333333,3,2,1,2,1L2,0C2,0,1.333333,0,1,0C0.666667,0,0,0,0,0Z"
  )
  assertPathEqual(
    a([
      [0, 1],
      [1, 3],
      [2, 1],
      [3, 3],
    ]),
    "M0,1C0,1,0.666667,3,1,3C1.333333,3,1.666667,1,2,1C2.333333,1,3,3,3,3L3,0C3,0,2.333333,0,2,0C1.666667,0,1.333333,0,1,0C0.666667,0,0,0,0,0Z"
  )
})

it("area.curve(curveCatmullRom) uses a default alpha of 0.5 (centripetal)", () => {
  const a = area().curve(curveCatmullRom.alpha(0.5))
  assert.strictEqual(
    area().curve(curveCatmullRom)([
      [0, 1],
      [1, 3],
      [2, 1],
      [3, 3],
    ]),
    a([
      [0, 1],
      [1, 3],
      [2, 1],
      [3, 3],
    ])
  )
})

it("area.curve(curveCatmullRom.alpha(alpha)) coerces the specified alpha to a number", () => {
  const a = area().curve(curveCatmullRom.alpha("0.5"))
  assert.strictEqual(
    area().curve(curveCatmullRom.alpha(0.5))([
      [0, 1],
      [1, 3],
      [2, 1],
      [3, 3],
    ]),
    a([
      [0, 1],
      [1, 3],
      [2, 1],
      [3, 3],
    ])
  )
})
import assert from "assert"
import { area, line, curveCatmullRomClosed } from "../../src/index.js"
import { assertPathEqual } from "../asserts.js"

it("line.curve(curveCatmullRomClosed)(data) generates the expected path", () => {
  const l = line().curve(curveCatmullRomClosed)
  assert.strictEqual(l([]), null)
  assertPathEqual(l([[0, 1]]), "M0,1Z")
  assertPathEqual(
    l([
      [0, 1],
      [1, 3],
    ]),
    "M1,3L0,1Z"
  )
  assertPathEqual(
    l([
      [0, 1],
      [1, 3],
      [2, 1],
    ]),
    "M1,3C1.333333,3,2.200267,1.324038,2,1C1.810600,0.693544,0.189400,0.693544,0,1C-0.200267,1.324038,0.666667,3,1,3"
  )
  assertPathEqual(
    l([
      [0, 1],
      [1, 3],
      [2, 1],
      [3, 3],
    ]),
    "M1,3C1.333333,3,1.666667,1,2,1C2.333333,1,3.160469,2.858341,3,3C2.796233,3.179882,0.203767,0.820118,0,1C-0.160469,1.141659,0.666667,3,1,3"
  )
})

it("line.curve(curveCatmullRomClosed.alpha(0))(data) generates the expected path", () => {
  const l = line().curve(curveCatmullRomClosed.alpha(0))
  assert.strictEqual(l([]), null)
  assertPathEqual(l([[0, 1]]), "M0,1Z")
  assertPathEqual(
    l([
      [0, 1],
      [1, 3],
    ]),
    "M1,3L0,1Z"
  )
  assertPathEqual(
    l([
      [0, 1],
      [1, 3],
      [2, 1],
    ]),
    "M1,3C1.333333,3,2.166667,1.333333,2,1C1.833333,0.666667,0.166667,0.666667,0,1C-0.166667,1.333333,0.666667,3,1,3"
  )
  assertPathEqual(
    l([
      [0, 1],
      [1, 3],
      [2, 1],
      [3, 3],
    ]),
    "M1,3C1.333333,3,1.666667,1,2,1C2.333333,1,3.333333,3,3,3C2.666667,3,0.333333,1,0,1C-0.333333,1,0.666667,3,1,3"
  )
})

it("line.curve(curveCatmullRomClosed.alpha(1))(data) generates the expected path", () => {
  const l = line().curve(curveCatmullRomClosed.alpha(1))
  assert.strictEqual(l([]), null)
  assertPathEqual(l([[0, 1]]), "M0,1Z")
  assertPathEqual(
    l([
      [0, 1],
      [1, 3],
    ]),
    "M1,3L0,1Z"
  )
  assertPathEqual(
    l([
      [0, 1],
      [1, 3],
      [2, 1],
    ]),
    "M1,3C1.333333,3,2.236068,1.314757,2,1C1.788854,0.718473,0.211146,0.718473,0,1C-0.236068,1.314757,0.666667,3,1,3"
  )
  assertPathEqual(
    l([
      [0, 1],
      [1, 3],
      [2, 1],
      [3, 3],
    ]),
    "M1,3C1.333333,3,1.666667,1,2,1C2.333333,1,3.031652,2.746782,3,3C2.948962,3.408301,0.051038,0.591699,0,1C-0.031652,1.253218,0.666667,3,1,3"
  )
})

it("line.curve(curveCatmullRomClosed) uses a default alpha of 0.5 (centripetal)", () => {
  const l = line().curve(curveCatmullRomClosed.alpha(0.5))
  assert.strictEqual(
    line().curve(curveCatmullRomClosed)([
      [0, 1],
      [1, 3],
      [2, 1],
      [3, 3],
    ]),
    l([
      [0, 1],
      [1, 3],
      [2, 1],
      [3, 3],
    ])
  )
})

it("line.curve(curveCatmullRomClosed.alpha(alpha)) coerces the specified alpha to a number", () => {
  const l = line().curve(curveCatmullRomClosed.alpha("0.5"))
  assert.strictEqual(
    line().curve(curveCatmullRomClosed.alpha(0.5))([
      [0, 1],
      [1, 3],
      [2, 1],
      [3, 3],
    ]),
    l([
      [0, 1],
      [1, 3],
      [2, 1],
      [3, 3],
    ])
  )
})

it("area.curve(curveCatmullRomClosed.alpha(alpha)) coerces the specified alpha to a number", () => {
  const a = area().curve(curveCatmullRomClosed.alpha("0.5"))
  assert.strictEqual(
    area().curve(curveCatmullRomClosed.alpha(0.5))([
      [0, 1],
      [1, 3],
      [2, 1],
      [3, 3],
    ]),
    a([
      [0, 1],
      [1, 3],
      [2, 1],
      [3, 3],
    ])
  )
})
import assert from "assert"
import { area, line, curveCatmullRomOpen } from "../../src/index.js"
import { assertPathEqual } from "../asserts.js"

it("line.curve(curveCatmullRomOpen)(data) generates the expected path", () => {
  const l = line().curve(curveCatmullRomOpen)
  assert.strictEqual(l([]), null)
  assert.strictEqual(l([[0, 1]]), null)
  assert.strictEqual(
    l([
      [0, 1],
      [1, 3],
    ]),
    null
  )
  assertPathEqual(
    l([
      [0, 1],
      [1, 3],
      [2, 1],
    ]),
    "M1,3Z"
  )
  assertPathEqual(
    l([
      [0, 1],
      [1, 3],
      [2, 1],
      [3, 3],
    ]),
    "M1,3C1.333333,3,1.666667,1,2,1"
  )
})

it("line.curve(curveCatmullRomOpen.alpha(1))(data) generates the expected path", () => {
  const l = line().curve(curveCatmullRomOpen.alpha(1))
  assert.strictEqual(l([]), null)
  assert.strictEqual(l([[0, 1]]), null)
  assert.strictEqual(
    l([
      [0, 1],
      [1, 3],
    ]),
    null
  )
  assertPathEqual(
    l([
      [0, 1],
      [1, 3],
      [2, 1],
    ]),
    "M1,3Z"
  )
  assertPathEqual(
    l([
      [0, 1],
      [1, 3],
      [2, 1],
      [3, 3],
    ]),
    "M1,3C1.333333,3,1.666667,1,2,1"
  )
})

it("line.curve(curveCatmullRomOpen) uses a default alpha of 0.5 (centripetal)", () => {
  const l = line().curve(curveCatmullRomOpen.alpha(0.5))
  assert.strictEqual(
    line().curve(curveCatmullRomOpen)([
      [0, 1],
      [1, 3],
      [2, 1],
      [3, 3],
    ]),
    l([
      [0, 1],
      [1, 3],
      [2, 1],
      [3, 3],
    ])
  )
})

it("line.curve(curveCatmullRomOpen.alpha(alpha)) coerces the specified alpha to a number", () => {
  const l = line().curve(curveCatmullRomOpen.alpha("0.5"))
  assert.strictEqual(
    line().curve(curveCatmullRomOpen.alpha(0.5))([
      [0, 1],
      [1, 3],
      [2, 1],
      [3, 3],
    ]),
    l([
      [0, 1],
      [1, 3],
      [2, 1],
      [3, 3],
    ])
  )
})

it("area.curve(curveCatmullRomOpen.alpha(0.5))(data) generates the expected path", () => {
  const a = area().curve(curveCatmullRomOpen, 0.5)
  assert.strictEqual(a([]), null)
  assert.strictEqual(a([[0, 1]]), null)
  assert.strictEqual(
    a([
      [0, 1],
      [1, 3],
    ]),
    null
  )
  assertPathEqual(
    a([
      [0, 1],
      [1, 3],
      [2, 1],
    ]),
    "M1,3L1,0Z"
  )
  assertPathEqual(
    a([
      [0, 1],
      [1, 3],
      [2, 1],
      [3, 3],
    ]),
    "M1,3C1.333333,3,1.666667,1,2,1L2,0C1.666667,0,1.333333,0,1,0Z"
  )
})

it("area.curve(curveCatmullRomOpen) uses a default alpha of 0.5 (centripetal)", () => {
  const a = area().curve(curveCatmullRomOpen, 0.5)
  assert.strictEqual(
    area().curve(curveCatmullRomOpen)([
      [0, 1],
      [1, 3],
      [2, 1],
      [3, 3],
    ]),
    a([
      [0, 1],
      [1, 3],
      [2, 1],
      [3, 3],
    ])
  )
})

it("area.curve(curveCatmullRomOpen.alpha(alpha)) coerces the specified alpha to a number", () => {
  const a = area().curve(curveCatmullRomOpen.alpha("0.5"))
  assert.strictEqual(
    area().curve(curveCatmullRomOpen.alpha(0.5))([
      [0, 1],
      [1, 3],
      [2, 1],
      [3, 3],
    ]),
    a([
      [0, 1],
      [1, 3],
      [2, 1],
      [3, 3],
    ])
  )
})
import assert from "assert"
import { area, line, curveLinear } from "../../src/index.js"
import { assertPathEqual } from "../asserts.js"

it("line.curve(curveLinear)(data) generates the expected path", () => {
  const l = line().curve(curveLinear)
  assert.strictEqual(l([]), null)
  assertPathEqual(l([[0, 1]]), "M0,1Z")
  assertPathEqual(
    l([
      [0, 1],
      [2, 3],
    ]),
    "M0,1L2,3"
  )
  assertPathEqual(
    l([
      [0, 1],
      [2, 3],
      [4, 5],
    ]),
    "M0,1L2,3L4,5"
  )
})

it("area.curve(curveLinear)(data) generates the expected path", () => {
  const a = area().curve(curveLinear)
  assert.strictEqual(a([]), null)
  assertPathEqual(a([[0, 1]]), "M0,1L0,0Z")
  assertPathEqual(
    a([
      [0, 1],
      [2, 3],
    ]),
    "M0,1L2,3L2,0L0,0Z"
  )
  assertPathEqual(
    a([
      [0, 1],
      [2, 3],
      [4, 5],
    ]),
    "M0,1L2,3L4,5L4,0L2,0L0,0Z"
  )
})
import assert from "assert"
import { line, curveLinearClosed } from "../../src/index.js"
import { assertPathEqual } from "../asserts.js"

it("line.curve(curveLinearClosed)(data) generates the expected path", () => {
  const l = line().curve(curveLinearClosed)
  assert.strictEqual(l([]), null)
  assertPathEqual(l([[0, 1]]), "M0,1Z")
  assertPathEqual(
    l([
      [0, 1],
      [2, 3],
    ]),
    "M0,1L2,3Z"
  )
  assertPathEqual(
    l([
      [0, 1],
      [2, 3],
      [4, 5],
    ]),
    "M0,1L2,3L4,5Z"
  )
})
import assert from "assert"
import { area, line, curveMonotoneX } from "../../src/index.js"
import { assertPathEqual } from "../asserts.js"

it("line.curve(curveMonotoneX)(data) generates the expected path", () => {
  const l = line().curve(curveMonotoneX)
  assert.strictEqual(l([]), null)
  assertPathEqual(l([[0, 1]]), "M0,1Z")
  assertPathEqual(
    l([
      [0, 1],
      [1, 3],
    ]),
    "M0,1L1,3"
  )
  assertPathEqual(
    l([
      [0, 1],
      [1, 3],
      [2, 1],
    ]),
    "M0,1C0.333333,2,0.666667,3,1,3C1.333333,3,1.666667,2,2,1"
  )
  assertPathEqual(
    l([
      [0, 1],
      [1, 3],
      [2, 1],
      [3, 3],
    ]),
    "M0,1C0.333333,2,0.666667,3,1,3C1.333333,3,1.666667,1,2,1C2.333333,1,2.666667,2,3,3"
  )
})

it("line.curve(curveMonotoneX)(data) preserves monotonicity in y", () => {
  const l = line().curve(curveMonotoneX)
  assertPathEqual(
    l([
      [0, 200],
      [100, 100],
      [200, 100],
      [300, 300],
      [400, 300],
    ]),
    "M0,200C33.333333,150,66.666667,100,100,100C133.333333,100,166.666667,100,200,100C233.333333,100,266.666667,300,300,300C333.333333,300,366.666667,300,400,300"
  )
})

it("line.curve(curveMonotoneX)(data) handles duplicate x-values", () => {
  const l = line().curve(curveMonotoneX)
  assertPathEqual(
    l([
      [0, 200],
      [0, 100],
      [100, 100],
      [200, 0],
    ]),
    "M0,200C0,200,0,100,0,100C33.333333,100,66.666667,100,100,100C133.333333,100,166.666667,50,200,0"
  )
  assertPathEqual(
    l([
      [0, 200],
      [100, 100],
      [100, 0],
      [200, 0],
    ]),
    "M0,200C33.333333,183.333333,66.666667,166.666667,100,100C100,100,100,0,100,0C133.333333,0,166.666667,0,200,0"
  )
  assertPathEqual(
    l([
      [0, 200],
      [100, 100],
      [200, 100],
      [200, 0],
    ]),
    "M0,200C33.333333,150,66.666667,100,100,100C133.333333,100,166.666667,100,200,100C200,100,200,0,200,0"
  )
})

it("line.curve(curveMonotoneX)(data) handles segments of infinite slope", () => {
  const l = line().curve(curveMonotoneX)
  assertPathEqual(
    l([
      [0, 200],
      [100, 150],
      [100, 50],
      [200, 0],
    ]),
    "M0,200C33.333333,191.666667,66.666667,183.333333,100,150C100,150,100,50,100,50C133.333333,16.666667,166.666667,8.333333,200,0"
  )
  assertPathEqual(
    l([
      [200, 0],
      [100, 50],
      [100, 150],
      [0, 200],
    ]),
    "M200,0C166.666667,8.333333,133.333333,16.666667,100,50C100,50,100,150,100,150C66.666667,183.333333,33.333333,191.666667,0,200"
  )
})

it("line.curve(curveMonotoneX)(data) ignores coincident points", () => {
  const l = line().curve(curveMonotoneX)
  const p = l([
    [0, 200],
    [50, 200],
    [100, 100],
    [150, 0],
    [200, 0],
  ])
  assert.strictEqual(
    l([
      [0, 200],
      [0, 200],
      [50, 200],
      [100, 100],
      [150, 0],
      [200, 0],
    ]),
    p
  )
  assert.strictEqual(
    l([
      [0, 200],
      [50, 200],
      [50, 200],
      [100, 100],
      [150, 0],
      [200, 0],
    ]),
    p
  )
  assert.strictEqual(
    l([
      [0, 200],
      [50, 200],
      [100, 100],
      [100, 100],
      [150, 0],
      [200, 0],
    ]),
    p
  )
  assert.strictEqual(
    l([
      [0, 200],
      [50, 200],
      [100, 100],
      [150, 0],
      [150, 0],
      [200, 0],
    ]),
    p
  )
  assert.strictEqual(
    l([
      [0, 200],
      [50, 200],
      [100, 100],
      [150, 0],
      [200, 0],
      [200, 0],
    ]),
    p
  )
})

it("area.curve(curveMonotoneX)(data) generates the expected path", () => {
  const a = area().curve(curveMonotoneX)
  assert.strictEqual(a([]), null)
  assertPathEqual(a([[0, 1]]), "M0,1L0,0Z")
  assertPathEqual(
    a([
      [0, 1],
      [1, 3],
    ]),
    "M0,1L1,3L1,0L0,0Z"
  )
  assertPathEqual(
    a([
      [0, 1],
      [1, 3],
      [2, 1],
    ]),
    "M0,1C0.333333,2,0.666667,3,1,3C1.333333,3,1.666667,2,2,1L2,0C1.666667,0,1.333333,0,1,0C0.666667,0,0.333333,0,0,0Z"
  )
  assertPathEqual(
    a([
      [0, 1],
      [1, 3],
      [2, 1],
      [3, 3],
    ]),
    "M0,1C0.333333,2,0.666667,3,1,3C1.333333,3,1.666667,1,2,1C2.333333,1,2.666667,2,3,3L3,0C2.666667,0,2.333333,0,2,0C1.666667,0,1.333333,0,1,0C0.666667,0,0.333333,0,0,0Z"
  )
})
import assert from "assert"
import { area, line, curveMonotoneY } from "../../src/index.js"
import { assertPathEqual } from "../asserts.js"

it("line.curve(curveMonotoneY)(data) generates the expected path", () => {
  const l = line().curve(curveMonotoneY)
  assert.strictEqual(l([]), null)
  assertPathEqual(l([[0, 1]].map(reflect)), "M1,0Z")
  assertPathEqual(
    l(
      [
        [0, 1],
        [1, 3],
      ].map(reflect)
    ),
    "M1,0L3,1"
  )
  assertPathEqual(
    l(
      [
        [0, 1],
        [1, 3],
        [2, 1],
      ].map(reflect)
    ),
    "M1,0C2,0.333333,3,0.666667,3,1C3,1.333333,2,1.666667,1,2"
  )
  assertPathEqual(
    l(
      [
        [0, 1],
        [1, 3],
        [2, 1],
        [3, 3],
      ].map(reflect)
    ),
    "M1,0C2,0.333333,3,0.666667,3,1C3,1.333333,1,1.666667,1,2C1,2.333333,2,2.666667,3,3"
  )
})

it("line.curve(curveMonotoneY)(data) preserves monotonicity in y", () => {
  const l = line().curve(curveMonotoneY)
  assertPathEqual(
    l(
      [
        [0, 200],
        [100, 100],
        [200, 100],
        [300, 300],
        [400, 300],
      ].map(reflect)
    ),
    "M200,0C150,33.333333,100,66.666667,100,100C100,133.333333,100,166.666667,100,200C100,233.333333,300,266.666667,300,300C300,333.333333,300,366.666667,300,400"
  )
})

it("line.curve(curveMonotoneY)(data) handles duplicate x-values", () => {
  const l = line().curve(curveMonotoneY)
  assertPathEqual(
    l(
      [
        [0, 200],
        [0, 100],
        [100, 100],
        [200, 0],
      ].map(reflect)
    ),
    "M200,0C200,0,100,0,100,0C100,33.333333,100,66.666667,100,100C100,133.333333,50,166.666667,0,200"
  )
  assertPathEqual(
    l(
      [
        [0, 200],
        [100, 100],
        [100, 0],
        [200, 0],
      ].map(reflect)
    ),
    "M200,0C183.333333,33.333333,166.666667,66.666667,100,100C100,100,0,100,0,100C0,133.333333,0,166.666667,0,200"
  )
  assertPathEqual(
    l(
      [
        [0, 200],
        [100, 100],
        [200, 100],
        [200, 0],
      ].map(reflect)
    ),
    "M200,0C150,33.333333,100,66.666667,100,100C100,133.333333,100,166.666667,100,200C100,200,0,200,0,200"
  )
})

it("line.curve(curveMonotoneY)(data) handles segments of infinite slope", () => {
  const l = line().curve(curveMonotoneY)
  assertPathEqual(
    l(
      [
        [0, 200],
        [100, 150],
        [100, 50],
        [200, 0],
      ].map(reflect)
    ),
    "M200,0C191.666667,33.333333,183.333333,66.666667,150,100C150,100,50,100,50,100C16.666667,133.333333,8.333333,166.666667,0,200"
  )
  assertPathEqual(
    l(
      [
        [200, 0],
        [100, 50],
        [100, 150],
        [0, 200],
      ].map(reflect)
    ),
    "M0,200C8.333333,166.666667,16.666667,133.333333,50,100C50,100,150,100,150,100C183.333333,66.666667,191.666667,33.333333,200,0"
  )
})

it("line.curve(curveMonotoneY)(data) ignores coincident points", () => {
  const l = line().curve(curveMonotoneY),
    p = l(
      [
        [0, 200],
        [50, 200],
        [100, 100],
        [150, 0],
        [200, 0],
      ].map(reflect)
    )
  assert.strictEqual(
    l(
      [
        [0, 200],
        [0, 200],
        [50, 200],
        [100, 100],
        [150, 0],
        [200, 0],
      ].map(reflect)
    ),
    p
  )
  assert.strictEqual(
    l(
      [
        [0, 200],
        [50, 200],
        [50, 200],
        [100, 100],
        [150, 0],
        [200, 0],
      ].map(reflect)
    ),
    p
  )
  assert.strictEqual(
    l(
      [
        [0, 200],
        [50, 200],
        [100, 100],
        [100, 100],
        [150, 0],
        [200, 0],
      ].map(reflect)
    ),
    p
  )
  assert.strictEqual(
    l(
      [
        [0, 200],
        [50, 200],
        [100, 100],
        [150, 0],
        [150, 0],
        [200, 0],
      ].map(reflect)
    ),
    p
  )
  assert.strictEqual(
    l(
      [
        [0, 200],
        [50, 200],
        [100, 100],
        [150, 0],
        [200, 0],
        [200, 0],
      ].map(reflect)
    ),
    p
  )
})

it("area.curve(curveMonotoneY)(data) generates the expected path", () => {
  const a = area().curve(curveMonotoneY)
  assert.strictEqual(a([].map(reflect)), null)
  assertPathEqual(a([[0, 1]].map(reflect)), "M1,0L1,0Z")
  assertPathEqual(
    a(
      [
        [0, 1],
        [1, 3],
      ].map(reflect)
    ),
    "M1,0L3,1L3,0L1,0Z"
  )
  assertPathEqual(
    a(
      [
        [0, 1],
        [1, 3],
        [2, 1],
      ].map(reflect)
    ),
    "M1,0C2,0.333333,3,0.666667,3,1C3,1.333333,2,1.666667,1,2L1,0C1,0,3,0,3,0C3,0,1,0,1,0Z"
  )
  assertPathEqual(
    a(
      [
        [0, 1],
        [1, 3],
        [2, 1],
        [3, 3],
      ].map(reflect)
    ),
    "M1,0C2,0.333333,3,0.666667,3,1C3,1.333333,1,1.666667,1,2C1,2.333333,2,2.666667,3,3L3,0C3,0,1,0,1,0C1,0,3,0,3,0C3,0,1,0,1,0Z"
  )
})

function reflect(p) {
  return [p[1], p[0]]
}
import assert from "assert"
import { area, line, curveNatural } from "../../src/index.js"
import { assertPathEqual } from "../asserts.js"

it("line.curve(curveNatural)(data) generates the expected path", () => {
  const l = line().curve(curveNatural)
  assert.strictEqual(l([]), null)
  assertPathEqual(l([[0, 1]]), "M0,1Z")
  assertPathEqual(
    l([
      [0, 1],
      [1, 3],
    ]),
    "M0,1L1,3"
  )
  assertPathEqual(
    l([
      [0, 1],
      [1, 3],
      [2, 1],
    ]),
    "M0,1C0.333333,2,0.666667,3,1,3C1.333333,3,1.666667,2,2,1"
  )
  assertPathEqual(
    l([
      [0, 1],
      [1, 3],
      [2, 1],
      [3, 3],
    ]),
    "M0,1C0.333333,2.111111,0.666667,3.222222,1,3C1.333333,2.777778,1.666667,1.222222,2,1C2.333333,0.777778,2.666667,1.888889,3,3"
  )
})

it("area.curve(curveNatural)(data) generates the expected path", () => {
  const a = area().curve(curveNatural)
  assert.strictEqual(a([]), null)
  assertPathEqual(a([[0, 1]]), "M0,1L0,0Z")
  assertPathEqual(
    a([
      [0, 1],
      [1, 3],
    ]),
    "M0,1L1,3L1,0L0,0Z"
  )
  assertPathEqual(
    a([
      [0, 1],
      [1, 3],
      [2, 1],
    ]),
    "M0,1C0.333333,2,0.666667,3,1,3C1.333333,3,1.666667,2,2,1L2,0C1.666667,0,1.333333,0,1,0C0.666667,0,0.333333,0,0,0Z"
  )
  assertPathEqual(
    a([
      [0, 1],
      [1, 3],
      [2, 1],
      [3, 3],
    ]),
    "M0,1C0.333333,2.111111,0.666667,3.222222,1,3C1.333333,2.777778,1.666667,1.222222,2,1C2.333333,0.777778,2.666667,1.888889,3,3L3,0C2.666667,0,2.333333,0,2,0C1.666667,0,1.333333,0,1,0C0.666667,0,0.333333,0,0,0Z"
  )
})
import assert from "assert"
import { area, line, curveStep } from "../../src/index.js"
import { assertPathEqual } from "../asserts.js"

it("line.curve(curveStep)(data) generates the expected path", () => {
  const l = line().curve(curveStep)
  assert.strictEqual(l([]), null)
  assertPathEqual(l([[0, 1]]), "M0,1Z")
  assertPathEqual(
    l([
      [0, 1],
      [2, 3],
    ]),
    "M0,1L1,1L1,3L2,3"
  )
  assertPathEqual(
    l([
      [0, 1],
      [2, 3],
      [4, 5],
    ]),
    "M0,1L1,1L1,3L3,3L3,5L4,5"
  )
})

it("area.curve(curveStep)(data) generates the expected path", () => {
  const a = area().curve(curveStep)
  assert.strictEqual(a([]), null)
  assertPathEqual(a([[0, 1]]), "M0,1L0,0Z")
  assertPathEqual(
    a([
      [0, 1],
      [2, 3],
    ]),
    "M0,1L1,1L1,3L2,3L2,0L1,0L1,0L0,0Z"
  )
  assertPathEqual(
    a([
      [0, 1],
      [2, 3],
      [4, 5],
    ]),
    "M0,1L1,1L1,3L3,3L3,5L4,5L4,0L3,0L3,0L1,0L1,0L0,0Z"
  )
})
import assert from "assert"
import { area, line, curveStepAfter } from "../../src/index.js"
import { assertPathEqual } from "../asserts.js"

it("line.curve(curveStepAfter)(data) generates the expected path", () => {
  const l = line().curve(curveStepAfter)
  assert.strictEqual(l([]), null)
  assertPathEqual(l([[0, 1]]), "M0,1Z")
  assertPathEqual(
    l([
      [0, 1],
      [2, 3],
    ]),
    "M0,1L2,1L2,3"
  )
  assertPathEqual(
    l([
      [0, 1],
      [2, 3],
      [4, 5],
    ]),
    "M0,1L2,1L2,3L4,3L4,5"
  )
})

it("area.curve(curveStepAfter)(data) generates the expected path", () => {
  const a = area().curve(curveStepAfter)
  assert.strictEqual(a([]), null)
  assertPathEqual(a([[0, 1]]), "M0,1L0,0Z")
  assertPathEqual(
    a([
      [0, 1],
      [2, 3],
    ]),
    "M0,1L2,1L2,3L2,0L2,0L0,0Z"
  )
  assertPathEqual(
    a([
      [0, 1],
      [2, 3],
      [4, 5],
    ]),
    "M0,1L2,1L2,3L4,3L4,5L4,0L4,0L2,0L2,0L0,0Z"
  )
})
import assert from "assert"
import { area, line, curveStepBefore } from "../../src/index.js"
import { assertPathEqual } from "../asserts.js"

it("line.curve(curveStepBefore)(data) generates the expected path", () => {
  const l = line().curve(curveStepBefore)
  assert.strictEqual(l([]), null)
  assertPathEqual(l([[0, 1]]), "M0,1Z")
  assertPathEqual(
    l([
      [0, 1],
      [2, 3],
    ]),
    "M0,1L0,3L2,3"
  )
  assertPathEqual(
    l([
      [0, 1],
      [2, 3],
      [4, 5],
    ]),
    "M0,1L0,3L2,3L2,5L4,5"
  )
})

it("area.curve(curveStepBefore)(data) generates the expected path", () => {
  const a = area().curve(curveStepBefore)
  assert.strictEqual(a([]), null)
  assertPathEqual(a([[0, 1]]), "M0,1L0,0Z")
  assertPathEqual(
    a([
      [0, 1],
      [2, 3],
    ]),
    "M0,1L0,3L2,3L2,0L0,0L0,0Z"
  )
  assertPathEqual(
    a([
      [0, 1],
      [2, 3],
      [4, 5],
    ]),
    "M0,1L0,3L2,3L2,5L4,5L4,0L2,0L2,0L0,0L0,0Z"
  )
})
