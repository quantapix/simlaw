/* eslint-disable */

import benchmark from "benchmark"
import { shuffle } from "d3-array"
import { randomLogNormal, randomUniform } from "d3-random"
import { packSiblings } from "../../src/index.js"

const slice = Array.prototype.slice

let n = 0
let m = 1000
let r = randomLogNormal(10)
let x = randomUniform(0, 100)
let y = x
let circles0
let circles1

function extendBasis(B, p) {
  let i, j

  if (enclosesWeakAll(p, B)) return [p]

  for (i = 0; i < B.length; ++i) {
    if (enclosesNot(p, B[i]) && enclosesWeakAll(encloseBasis2(B[i], p), B)) {
      return [B[i], p]
    }
  }

  for (i = 0; i < B.length - 1; ++i) {
    for (j = i + 1; j < B.length; ++j) {
      if (
        enclosesNot(encloseBasis2(B[i], B[j]), p) &&
        enclosesNot(encloseBasis2(B[i], p), B[j]) &&
        enclosesNot(encloseBasis2(B[j], p), B[i]) &&
        enclosesWeakAll(encloseBasis3(B[i], B[j], p), B)
      ) {
        return [B[i], B[j], p]
      }
    }
  }

  throw new Error()
}

function enclosesNot(a, b) {
  let dr = a.r - b.r,
    dx = b.x - a.x,
    dy = b.y - a.y
  return dr < 0 || dr * dr < dx * dx + dy * dy
}

function enclosesWeak(a, b) {
  let dr = a.r - b.r + 1e-6,
    dx = b.x - a.x,
    dy = b.y - a.y
  return dr > 0 && dr * dr > dx * dx + dy * dy
}

function enclosesWeakAll(a, B) {
  for (let i = 0; i < B.length; ++i) {
    if (!enclosesWeak(a, B[i])) {
      return false
    }
  }
  return true
}

function encloseBasis(B) {
  switch (B.length) {
    case 1:
      return encloseBasis1(B[0])
    case 2:
      return encloseBasis2(B[0], B[1])
    case 3:
      return encloseBasis3(B[0], B[1], B[2])
  }
}

function encloseBasis1(a) {
  return {
    x: a.x,
    y: a.y,
    r: a.r,
  }
}

function encloseBasis2(a, b) {
  let x1 = a.x,
    y1 = a.y,
    r1 = a.r,
    x2 = b.x,
    y2 = b.y,
    r2 = b.r,
    x21 = x2 - x1,
    y21 = y2 - y1,
    r21 = r2 - r1,
    l = Math.sqrt(x21 * x21 + y21 * y21)
  return {
    x: (x1 + x2 + (x21 / l) * r21) / 2,
    y: (y1 + y2 + (y21 / l) * r21) / 2,
    r: (l + r1 + r2) / 2,
  }
}

function encloseBasis3(a, b, c) {
  let x1 = a.x,
    y1 = a.y,
    r1 = a.r,
    x2 = b.x,
    y2 = b.y,
    r2 = b.r,
    x3 = c.x,
    y3 = c.y,
    r3 = c.r,
    a2 = x1 - x2,
    a3 = x1 - x3,
    b2 = y1 - y2,
    b3 = y1 - y3,
    c2 = r2 - r1,
    c3 = r3 - r1,
    d1 = x1 * x1 + y1 * y1 - r1 * r1,
    d2 = d1 - x2 * x2 - y2 * y2 + r2 * r2,
    d3 = d1 - x3 * x3 - y3 * y3 + r3 * r3,
    ab = a3 * b2 - a2 * b3,
    xa = (b2 * d3 - b3 * d2) / (ab * 2) - x1,
    xb = (b3 * c2 - b2 * c3) / ab,
    ya = (a3 * d2 - a2 * d3) / (ab * 2) - y1,
    yb = (a2 * c3 - a3 * c2) / ab,
    A = xb * xb + yb * yb - 1,
    B = 2 * (r1 + xa * xb + ya * yb),
    C = xa * xa + ya * ya - r1 * r1,
    r = -(A ? (B + Math.sqrt(B * B - 4 * A * C)) / (2 * A) : C / B)
  return {
    x: x1 + xa + xb * r,
    y: y1 + ya + yb * r,
    r: r,
  }
}

function encloseCircular(L) {
  let i = 0,
    n = L.length,
    j = 0,
    B = [],
    p,
    e,
    k = 0

  if (n)
    do {
      p = L[i]
      ++k
      if (!(e && enclosesWeak(e, p))) {
        e = encloseBasis((B = extendBasis(B, p)))
        j = i
      }
      i = (i + 1) % n
    } while (i != j)

  return e
}

function encloseCircularShuffle(L) {
  let i = 0,
    n = shuffle((L = slice.call(L))).length,
    j = 0,
    B = [],
    p,
    e,
    k = 0

  if (n)
    do {
      p = L[i]
      ++k
      if (!(e && enclosesWeak(e, p))) {
        e = encloseBasis((B = extendBasis(B, p)))
        j = i
      }
      i = (i + 1) % n
    } while (i != j)

  return e
}

function encloseLazyShuffle(L) {
  let i = 0,
    j,
    n = (L = slice.call(L)).length,
    B = [],
    p,
    e

  while (i < n) {
    ;(p = L[(j = i + ((Math.random() * (n - i)) | 0))]), (L[j] = L[i]), (L[i] = p)
    if (e && enclosesWeak(e, p)) ++i
    else (e = encloseBasis((B = extendBasis(B, p)))), (i = 0)
  }

  return e
}

function encloseNoShuffle(L) {
  let i = 0,
    n = L.length,
    B = [],
    p,
    e

  while (i < n) {
    p = L[i]
    if (e && enclosesWeak(e, p)) ++i
    else (e = encloseBasis((B = extendBasis(B, p)))), (i = 0)
  }

  return e
}

function encloseShuffle(L) {
  let i = 0,
    n = shuffle((L = slice.call(L))).length,
    B = [],
    p,
    e

  while (i < n) {
    p = L[i]
    if (e && enclosesWeak(e, p)) ++i
    else (e = encloseBasis((B = extendBasis(B, p)))), (i = 0)
  }

  return e
}

function enclosePrePass(L) {
  let i,
    n = L.length,
    B = [],
    p,
    e

  for (i = 0; i < n; ++i) {
    p = L[i]
    if (!(e && enclosesWeak(e, p))) e = encloseBasis((B = extendBasis(B, p)))
  }

  for (i = 0; i < n; ) {
    p = L[i]
    if (e && enclosesWeak(e, p)) ++i
    else (e = encloseBasis((B = extendBasis(B, p)))), (i = 0)
  }

  return e
}

function enclosePrePassThenLazyShuffle(L) {
  let i,
    j,
    n = (L = slice.call(L)).length,
    B = [],
    p,
    e

  for (i = 0; i < n; ++i) {
    p = L[i]
    if (!(e && enclosesWeak(e, p))) e = encloseBasis((B = extendBasis(B, p)))
  }

  for (i = 0; i < n; ) {
    ;(p = L[(j = i + ((Math.random() * (n - i)) | 0))]), (L[j] = L[i]), (L[i] = p)
    if (e && enclosesWeak(e, p)) ++i
    else (e = encloseBasis((B = extendBasis(B, p)))), (i = 0)
  }

  return e
}

function encloseShufflePrePass(L) {
  let i,
    n = shuffle((L = slice.call(L))).length,
    B = [],
    p,
    e

  for (i = 0; i < n; ++i) {
    p = L[i]
    if (!(e && enclosesWeak(e, p))) e = encloseBasis((B = extendBasis(B, p)))
  }

  for (i = 0; i < n; ) {
    p = L[i]
    if (e && enclosesWeak(e, p)) ++i
    else (e = encloseBasis((B = extendBasis(B, p)))), (i = 0)
  }

  return e
}

function encloseCompletePasses(L) {
  let i,
    n = L.length,
    B = [],
    p,
    e,
    dirty = false

  do {
    for (i = 0, dirty = false; i < n; ++i) {
      p = L[i]
      if (!(e && enclosesWeak(e, p))) (e = encloseBasis((B = extendBasis(B, p)))), (dirty = true)
    }
  } while (dirty)

  return e
}

function encloseShuffleCompletePasses(L) {
  let i,
    n = shuffle((L = slice.call(L))).length,
    B = [],
    p,
    e,
    dirty = false

  do {
    for (i = 0, dirty = false; i < n; ++i) {
      p = L[i]
      if (!(e && enclosesWeak(e, p))) (e = encloseBasis((B = extendBasis(B, p)))), (dirty = true)
    }
  } while (dirty)

  return e
}

function recycle(event) {
  circles0 = packSiblings(new Array(10).fill().map(() => ({ r: r(), x: x(), y: y() })))
  circles1 = circles0.slice().reverse()
}

new benchmark.Suite()
  .add("encloseNoShuffle (forward)", { onCycle: recycle, fn: () => encloseNoShuffle(circles0) })
  .add("encloseNoShuffle (reverse)", { onCycle: recycle, fn: () => encloseNoShuffle(circles1) })
  .add("enclosePrePass (forward)", { onCycle: recycle, fn: () => enclosePrePass(circles0) })
  .add("enclosePrePass (reverse)", { onCycle: recycle, fn: () => enclosePrePass(circles1) })
  .add("encloseCompletePasses (forward)", { onCycle: recycle, fn: () => encloseCompletePasses(circles0) })
  .add("encloseCompletePasses (reverse)", { onCycle: recycle, fn: () => encloseCompletePasses(circles1) })
  .add("encloseCircular (forward)", { onCycle: recycle, fn: () => encloseCircular(circles0) })
  .add("encloseCircular (reverse)", { onCycle: recycle, fn: () => encloseCircular(circles1) })
  .add("encloseShufflePrePass (forward)", { onCycle: recycle, fn: () => encloseShufflePrePass(circles0) })
  .add("encloseShufflePrePass (reverse)", { onCycle: recycle, fn: () => encloseShufflePrePass(circles1) })
  .add("encloseShuffleCompletePasses (forward)", { onCycle: recycle, fn: () => encloseShuffleCompletePasses(circles0) })
  .add("encloseShuffleCompletePasses (reverse)", { onCycle: recycle, fn: () => encloseShuffleCompletePasses(circles1) })
  .add("enclosePrePassThenLazyShuffle (forward)", {
    onCycle: recycle,
    fn: () => enclosePrePassThenLazyShuffle(circles0),
  })
  .add("enclosePrePassThenLazyShuffle (reverse)", {
    onCycle: recycle,
    fn: () => enclosePrePassThenLazyShuffle(circles1),
  })
  .add("encloseShuffle (forward)", { onCycle: recycle, fn: () => encloseShuffle(circles0) })
  .add("encloseShuffle (reverse)", { onCycle: recycle, fn: () => encloseShuffle(circles1) })
  .add("encloseLazyShuffle (forward)", { onCycle: recycle, fn: () => encloseLazyShuffle(circles0) })
  .add("encloseLazyShuffle (reverse)", { onCycle: recycle, fn: () => encloseLazyShuffle(circles1) })
  .add("encloseCircularShuffle (forward)", { onCycle: recycle, fn: () => encloseCircularShuffle(circles0) })
  .add("encloseCircularShuffle (reverse)", { onCycle: recycle, fn: () => encloseCircularShuffle(circles1) })
  .on("start", recycle)
  .on("cycle", event => console.log(event.target + ""))
  .run()
import assert from "assert"
import { hierarchy, stratify, pack } from "../../src/index.js"

it("pack is deterministic", () => {
  const data = stratify().path(d => d)(
    [41, 41, 11, 11, 4, 4]
      .flatMap((n, i) => Array.from({ length: n }, (_, j) => ({ i, j })))
      .map(({ i, j }) => `/${i}/${i}-${j}`)
  )
  const packer = pack().size([100, 100]).padding(0)
  const pack1 = packer(hierarchy(data).count())
  for (let i = 0; i < 40; ++i) {
    assert.deepStrictEqual(packer(hierarchy(data).count()), pack1)
  }
})
import assert from "assert"
import { packEnclose } from "../../src/index.js"

it("packEnclose(circles) handles a tricky case", () => {
  assert.deepStrictEqual(
    packEnclose([
      { x: 14.5, y: 48.5, r: 7.585 },
      { x: 9.5, y: 79.5, r: 2.585 },
      { x: 15.5, y: 73.5, r: 8.585 },
    ]),
    {
      r: 20.790781637717107,
      x: 12.80193548387092,
      y: 61.59615384615385,
    }
  )
})
/* eslint-disable */

import { randomLogNormal } from "d3-random"
import { packSiblings } from "../../src/index.js"

let n = 0
let r = randomLogNormal(4)

while (true) {
  if (!(n % 100)) process.stdout.write(".")
  if (!(n % 10000)) process.stdout.write("\n" + n + " ")
  ++n
  let radii = new Array(20).fill().map(r).map(Math.ceil)
  try {
    if (intersectsAny(packSiblings(radii.map(r => ({ r: r }))))) {
      throw new Error("overlap")
    }
  } catch (error) {
    process.stdout.write("\n")
    process.stdout.write(JSON.stringify(radii))
    process.stdout.write("\n")
    throw error
  }
}

function intersectsAny(circles) {
  for (let i = 0, n = circles.length; i < n; ++i) {
    for (let j = i + 1, ci = circles[i], cj; j < n; ++j) {
      if (intersects(ci, (cj = circles[j]))) {
        return true
      }
    }
  }
  return false
}

function intersects(a, b) {
  let dr = a.r + b.r - 1e-6,
    dx = b.x - a.x,
    dy = b.y - a.y
  return dr * dr > dx * dx + dy * dy
}
/* eslint-disable */

import { shuffle } from "d3-array"
import { randomLogNormal, randomUniform } from "d3-random"
import { packEnclose } from "../../src/index.js"

let n = 0
let m = 1000
let r = randomLogNormal(10)
let x = randomUniform(0, 100)
let y = x

while (true) {
  if (!(n % 10)) process.stdout.write(".")
  if (!(n % 1000)) process.stdout.write("\n" + n + " ")
  ++n
  let circles = new Array(20).fill().map(() => ({ r: r(), x: x(), y: y() }))
  let circles2
  let enclose = packEnclose(circles)
  let enclose2
  if (circles.some(circle => !encloses(enclose, circle))) {
    console.log(JSON.stringify(circles))
  }
  for (let i = 0; i < m; ++i) {
    if (!equals(enclose, (enclose2 = packEnclose((circles2 = shuffle(circles.slice())))))) {
      console.log(JSON.stringify(enclose))
      console.log(JSON.stringify(enclose2))
      console.log(JSON.stringify(circles))
      console.log(JSON.stringify(circles2))
    }
  }
}

function encloses(a, b) {
  var dr = a.r - b.r + 1e-6,
    dx = b.x - a.x,
    dy = b.y - a.y
  return dr > 0 && dr * dr > dx * dx + dy * dy
}

function equals(a, b) {
  return Math.abs(a.r - b.r) < 1e-6 && Math.abs(a.x - b.x) < 1e-6 && Math.abs(a.y - b.y) < 1e-6
}
/* eslint-disable */

function place(a, b, c) {
  var dx = b.x - a.x,
    x,
    a2,
    dy = b.y - a.y,
    y,
    b2,
    d2 = dx * dx + dy * dy
  if (d2) {
    ;(a2 = a.r + c.r), (a2 *= a2)
    ;(b2 = b.r + c.r), (b2 *= b2)
    if (a2 > b2) {
      x = (d2 + b2 - a2) / (2 * d2)
      y = Math.sqrt(Math.max(0, b2 / d2 - x * x))
      c.x = b.x - x * dx - y * dy
      c.y = b.y - x * dy + y * dx
    } else {
      x = (d2 + a2 - b2) / (2 * d2)
      y = Math.sqrt(Math.max(0, a2 / d2 - x * x))
      c.x = a.x + x * dx - y * dy
      c.y = a.y + x * dy + y * dx
    }
  } else {
    c.x = a.x + c.r
    c.y = a.y
  }

  if (intersects(a, c) || intersects(b, c)) {
    console.log(`a = {x: ${a.x}, y: ${a.y}, r: ${a.r}},`)
    console.log(`b = {x: ${b.x}, y: ${b.y}, r: ${b.r}},`)
    console.log(`c = {r: ${c.r}}`)
    console.log()
  }
}

function intersects(a, b) {
  var dr = a.r + b.r - 1e-6,
    dx = b.x - a.x,
    dy = b.y - a.y
  return dr > 0 && dr * dr > dx * dx + dy * dy
}

function randomCircles(n) {
  const r = []
  for (var i = 0; i < n; i++) {
    r.push({ r: Math.random() * (1 << (Math.random() * 30)) })
  }
  ;(r[0].x = -r[1].r), (r[1].x = r[0].r), (r[0].y = r[1].y = 0)
  return r
}

function test() {
  for (;;) {
    const [a, b, c, d] = randomCircles(4)
    place(b, a, c)
    place(a, c, d)
  }
}

test()
import assert from "assert"
import { csvParse } from "d3-dsv"
import { readFileSync } from "fs"
import { stratify, pack, Node } from "../../src/index.js"

it("pack(flare) produces the expected result", test("test/data/flare.csv", "test/data/flare-pack.json"))

function test(inputFile, expectedFile) {
  return () => {
    const inputText = readFileSync(inputFile, "utf8")
    const expectedText = readFileSync(expectedFile, "utf8")

    const stratifier = stratify().parentId(d => {
      const i = d.id.lastIndexOf(".")
      return i >= 0 ? d.id.slice(0, i) : null
    })

    const packer = pack().size([960, 960])

    const data = csvParse(inputText)
    const expected = JSON.parse(expectedText)

    const actual = packer(
      stratifier(data)
        .sum(d => d.value)
        .sort((a, b) => b.value - a.value || a.data.id.localeCompare(b.data.id))
    )

    ;(function visit(node) {
      node.name = node.data.id.slice(node.data.id.lastIndexOf(".") + 1)
      node.x = round(node.x)
      node.y = round(node.y)
      node.r = round(node.r)
      delete node.id
      delete node.parent
      delete node.data
      delete node.depth
      delete node.height
      if (node.children) node.children.forEach(visit)
    })(actual)
    ;(function visit(node) {
      Object.setPrototypeOf(node, Node.prototype)
      node.x = round(node.x)
      node.y = round(node.y)
      node.r = round(node.r)
      if (node.children) node.children.forEach(visit)
    })(expected)

    assert.deepStrictEqual(actual, expected)
  }
}

function round(x) {
  return Math.round(x * 100) / 100
}
import assert from "assert"
import { packSiblings } from "../../src/index.js"

it("packSiblings(circles) produces a non-overlapping layout of circles", () => {
  permute([100, 200, 500, 70, 3].map(circleValue), p => intersectsAny(packSiblings(p)) && assert.fail(p.map(c => c.r)))
  permute([3, 30, 50, 400, 600].map(circleValue), p => intersectsAny(packSiblings(p)) && assert.fail(p.map(c => c.r)))
  permute(
    [1, 1, 3, 30, 50, 400, 600].map(circleValue),
    p => intersectsAny(packSiblings(p)) && assert.fail(p.map(c => c.r))
  )
  assert.strictEqual(
    intersectsAny(
      packSiblings(
        [0.24155803737254639, 0.06349736576607135, 0.4721808601742349, 0.7469141449305542, 1.6399276349079663].map(
          circleRadius
        )
      )
    ),
    false
  )
  assert.strictEqual(
    intersectsAny(
      packSiblings(
        [
          2, 9071, 79, 51, 325, 867, 546, 19773, 371, 16, 165781, 10474, 6928, 40201, 31062, 14213, 8626, 12, 299, 1075,
          98918, 4738, 664, 2694, 2619, 51237, 21431, 99, 5920, 1117, 321, 519162, 33559, 234, 4207,
        ].map(circleValue)
      )
    ),
    false
  )
  assert.strictEqual(
    intersectsAny(
      packSiblings(
        [
          0.3371386860049076, 58.65337373332081, 2.118883785686244, 1.7024669121097333, 5.834919697833051,
          8.949453403094978, 6.792586534702093, 105.30490014617664, 6.058936212213754, 0.9535722042975694,
          313.7636051642043,
        ].map(circleRadius)
      )
    ),
    false
  )
  assert.strictEqual(
    intersectsAny(
      packSiblings(
        [
          6.26551789195159, 1.707773433636342, 9.43220282933871, 9.298909705475646, 5.753163715613753,
          8.882383159012575, 0.5819319661882536, 2.0234859171687747, 2.096171518434433, 9.762727931304937,
        ].map(circleRadius)
      )
    ),
    false
  )
  assert.strictEqual(
    intersectsAny(
      packSiblings(
        [
          9.153035316963035, 9.86048622524424, 8.3974499571329, 7.8338007571397865, 8.78260490259886, 6.165829618300345,
          7.134819943097564, 7.803701771392344, 5.056638985134191, 7.424601077645588, 8.538658023474753,
          2.4616388562274896, 0.5444633747829343, 9.005740508584667,
        ].map(circleRadius)
      )
    ),
    false
  )
  assert.strictEqual(
    intersectsAny(
      packSiblings(
        [
          2.23606797749979, 52.07088264296293, 5.196152422706632, 20.09975124224178, 357.11557267679996,
          4.898979485566356, 14.7648230602334, 17.334875731491763,
        ].map(circleRadius)
      )
    ),
    false
  )
})

it("packSiblings(circles) can successfully pack a circle with a tiny radius", () => {
  assert.strictEqual(
    intersectsAny(
      packSiblings(
        [
          0.5672035864083508, 0.6363498687452267, 0.5628456216244132, 1.5619458670239148, 1.5658933259424268,
          0.9195955097595698, 0.4747083763630309, 0.38341282734497434, 1.3475593361729394, 0.7492342961633259,
          1.0716990115071823, 0.31686823341701664, 2.8766442376551415e-7,
        ].map(circleRadius)
      )
    ),
    false
  )
})

it("packSiblings accepts large circles", () => {
  assert.deepStrictEqual(packSiblings([{ r: 1e11 }, { r: 1 }, { r: 1 }]), [
    { r: 1e11, x: 0, y: 0 },
    { r: 1, x: 1e11 + 1, y: 0 },
    { r: 1, x: 1e11 + 1, y: 2 },
  ])
  assert.deepStrictEqual(packSiblings([{ r: 1e16 }, { r: 1 }, { r: 1 }]), [
    { r: 1e16, x: 0, y: 0 },
    { r: 1, x: 1e16 + 1, y: 0 },
    { r: 1, x: 1e16 + 1, y: 2 },
  ])
})

function swap(array, i, j) {
  const t = array[i]
  array[i] = array[j]
  array[j] = t
}

function permute(array, f, n) {
  if (n == null) n = array.length
  if (n === 1) return void f(array)
  for (let i = 0; i < n - 1; ++i) {
    permute(array, f, n - 1)
    swap(array, n & 1 ? 0 : i, n - 1)
  }
  permute(array, f, n - 1)
}

function circleValue(value) {
  return { r: Math.sqrt(value) }
}

function circleRadius(radius) {
  return { r: radius }
}

function intersectsAny(circles) {
  for (let i = 0, n = circles.length; i < n; ++i) {
    for (let j = i + 1, ci = circles[i]; j < n; ++j) {
      if (intersects(ci, circles[j])) {
        return true
      }
    }
  }
  return false
}

function intersects(a, b) {
  const dr = a.r + b.r - 1e-6,
    dx = b.x - a.x,
    dy = b.y - a.y
  return dr > 0 && dr * dr > dx * dx + dy * dy
}
