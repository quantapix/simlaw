import * as qi from "../../src/immer/index.js"

const isProd = process.env["NODE_ENV"] === "production"

jest.setTimeout(1000)
qi.enableAllPlugins()

function runPatchTest(x: any, recipe: any, ps: any, invs?: any, res?: any) {
  return describe(`proxy`, () => {
    let ps2: any
    let invs2: any
    const y = qi.produce(x, recipe, (p, inv) => {
      ps2 = p
      invs2 = inv
    })
    if (res !== undefined)
      it("produced the correct result", () => {
        expect(y).toEqual(res)
      })
    it("produces the correct patches", () => {
      expect(ps2).toEqual(ps)
      if (invs) expect(invs2).toEqual(invs)
    })
    it("patches are replayable", () => {
      expect(qi.applyPatches(x, ps2)).toEqual(y)
    })
    it("patches can be reversed", () => {
      expect(qi.applyPatches(y, invs2)).toEqual(x)
    })
    return y
  })
}
describe("applyPatches", () => {
  it("mutates the base state when it is a draft", () => {
    qi.produce({ a: 1 }, x => {
      const y = qi.applyPatches(x, [{ op: "replace", path: ["a"], value: 2 }])
      expect(y).toBe(x)
      expect(x.a).toBe(2)
    })
  })
  it("produces a copy of the base state when not a draft", () => {
    const base = { a: 1 }
    const y = qi.applyPatches(base, [{ op: "replace", path: ["a"], value: 2 }])
    expect(y).not.toBe(base)
    expect(y.a).toBe(2)
    expect(base.a).toBe(1)
  })
  it('throws when `op` is not "add", "replace", nor "remove"', () => {
    expect(() => {
      const patch = { op: "copy", from: [0], path: [1] }
      qi.applyPatches([2], [patch as any])
    }).toThrowErrorMatchingSnapshot()
  })
  it("throws when `path` cannot be resolved", () => {
    expect(() => {
      const patch = { op: "add", path: ["a", "b"], value: 1 }
      qi.applyPatches({}, [patch as any])
    }).toThrowErrorMatchingSnapshot()
    expect(() => {
      const patch = { op: "add", path: ["a", "b", "c"], value: 1 }
      qi.applyPatches({}, [patch as any])
    }).toThrowErrorMatchingSnapshot()
  })
  it("applied patches cannot be modified", () => {
    const s0 = { items: [1] }
    const [s1, p1] = qi.produceWithPatches(s0, x => {
      x.items = []
    })
    const before = p1[0]?.value.slice()
    const [_, p2] = qi.produceWithPatches(s1, x => {
      x.items.push(2)
    })
    qi.applyPatches(s0, [...p1, ...p2])
    const after = p1[0]?.value.slice()
    expect(after).toStrictEqual(before)
  })
})
describe("simple assignment - 1", () => {
  runPatchTest(
    { x: 3 },
    (d: any) => {
      d.x++
    },
    [{ op: "replace", path: ["x"], value: 4 }]
  )
})
describe("simple assignment - 2", () => {
  runPatchTest(
    { x: { y: 4 } },
    (d: any) => {
      d.x.y++
    },
    [{ op: "replace", path: ["x", "y"], value: 5 }]
  )
})
describe("simple assignment - 3", () => {
  runPatchTest(
    { x: [{ y: 4 }] },
    (d: any) => {
      d.x[0].y++
    },
    [{ op: "replace", path: ["x", 0, "y"], value: 5 }]
  )
})
describe("simple assignment - 4", () => {
  runPatchTest(
    new Map([["x", { y: 4 }]]),
    (d: any) => {
      d.get("x").y++
    },
    [{ op: "replace", path: ["x", "y"], value: 5 }],
    [{ op: "replace", path: ["x", "y"], value: 4 }]
  )
})
describe("simple assignment - 5", () => {
  runPatchTest(
    { x: new Map([["y", 4]]) },
    (d: any) => {
      d.x.set("y", 5)
    },
    [{ op: "replace", path: ["x", "y"], value: 5 }],
    [{ op: "replace", path: ["x", "y"], value: 4 }]
  )
})
describe("simple assignment - 6", () => {
  runPatchTest(
    new Map([["x", 1]]),
    (d: any) => {
      const res = d.set("x", 2)
      res.set("y", 3)
    },
    [
      { op: "replace", path: ["x"], value: 2 },
      { op: "add", path: ["y"], value: 3 },
    ],
    [
      { op: "replace", path: ["x"], value: 1 },
      { op: "remove", path: ["y"] },
    ]
  )
})
describe("simple assignment - 7", () => {
  const key1 = { prop: "val1" }
  const key2 = { prop: "val2" }
  runPatchTest(
    { x: new Map([[key1, 4]]) },
    (d: any) => {
      d.x.set(key1, 5)
      d.x.set(key2, 6)
    },
    [
      { op: "replace", path: ["x", key1], value: 5 },
      { op: "add", path: ["x", key2], value: 6 },
    ],
    [
      { op: "replace", path: ["x", key1], value: 4 },
      { op: "remove", path: ["x", key2] },
    ]
  )
})
describe("delete 1", () => {
  runPatchTest(
    { x: { y: 4 } },
    (d: any) => {
      delete d.x
    },
    [{ op: "remove", path: ["x"] }]
  )
})
describe("delete 2", () => {
  runPatchTest(
    new Map([["x", 1]]),
    (d: any) => {
      d.delete("x")
    },
    [{ op: "remove", path: ["x"] }],
    [{ op: "add", path: ["x"], value: 1 }]
  )
})
describe("delete 3", () => {
  runPatchTest(
    { x: new Map([["y", 1]]) },
    (d: any) => {
      d.x.delete("y")
    },
    [{ op: "remove", path: ["x", "y"] }],
    [{ op: "add", path: ["x", "y"], value: 1 }]
  )
})
describe("delete 5", () => {
  const key1 = { prop: "val1" }
  const key2 = { prop: "val2" }
  runPatchTest(
    {
      x: new Map([
        [key1, 1],
        [key2, 2],
      ]),
    },
    (d: any) => {
      d.x.delete(key1)
      d.x.delete(key2)
    },
    [
      { op: "remove", path: ["x", key1] },
      { op: "remove", path: ["x", key2] },
    ],
    [
      { op: "add", path: ["x", key1], value: 1 },
      { op: "add", path: ["x", key2], value: 2 },
    ]
  )
})
describe("delete 6", () => {
  runPatchTest(
    new Set(["x", 1]),
    (d: any) => {
      d.delete("x")
    },
    [{ op: "remove", path: [0], value: "x" }],
    [{ op: "add", path: [0], value: "x" }]
  )
})
describe("delete 7", () => {
  runPatchTest(
    { x: new Set(["y", 1]) },
    (d: any) => {
      d.x.delete("y")
    },
    [{ op: "remove", path: ["x", 0], value: "y" }],
    [{ op: "add", path: ["x", 0], value: "y" }]
  )
})
describe("renaming properties", () => {
  describe("nested object (no changes)", () => {
    runPatchTest(
      { a: { b: 1 } },
      (d: any) => {
        d.x = d.a
        delete d.a
      },
      [
        { op: "add", path: ["x"], value: { b: 1 } },
        { op: "remove", path: ["a"] },
      ]
    )
  })
  describe("nested change in object", () => {
    runPatchTest(
      {
        a: { b: 1 },
      },
      (d: any) => {
        d.a.b++
      },
      [{ op: "replace", path: ["a", "b"], value: 2 }],
      [{ op: "replace", path: ["a", "b"], value: 1 }]
    )
  })
  describe("nested change in map", () => {
    runPatchTest(
      new Map([["a", new Map([["b", 1]])]]),
      (d: any) => {
        d.get("a").set("b", 2)
      },
      [{ op: "replace", path: ["a", "b"], value: 2 }],
      [{ op: "replace", path: ["a", "b"], value: 1 }]
    )
  })
  describe("nested change in array", () => {
    runPatchTest(
      [[{ b: 1 }]],
      (d: any) => {
        d[0][0].b++
      },
      [{ op: "replace", path: [0, 0, "b"], value: 2 }],
      [{ op: "replace", path: [0, 0, "b"], value: 1 }]
    )
  })
  describe("nested map (no changes)", () => {
    runPatchTest(
      new Map([["a", new Map([["b", 1]])]]),
      (d: any) => {
        d.set("x", d.get("a"))
        d.delete("a")
      },
      [
        { op: "add", path: ["x"], value: new Map([["b", 1]]) },
        { op: "remove", path: ["a"] },
      ],
      [
        { op: "remove", path: ["x"] },
        { op: "add", path: ["a"], value: new Map([["b", 1]]) },
      ]
    )
  })
  describe("nested object (with changes)", () => {
    runPatchTest(
      { a: { b: 1, c: 1 } },
      (d: any) => {
        const a = d.a
        a.b = 2
        delete a.c
        a.y = 2
        d.x = a
        delete d.a
      },
      [
        { op: "add", path: ["x"], value: { b: 2, y: 2 } },
        { op: "remove", path: ["a"] },
      ]
    )
  })
  describe("nested map (with changes)", () => {
    runPatchTest(
      new Map([
        [
          "a",
          new Map([
            ["b", 1],
            ["c", 1],
          ]),
        ],
      ]),
      (d: any) => {
        const a = d.get("a")
        a.set("b", 2)
        a.delete("c")
        a.set("y", 2)
        d.set("x", a)
        d.delete("a")
      },
      [
        {
          op: "add",
          path: ["x"],
          value: new Map([
            ["b", 2],
            ["y", 2],
          ]),
        },
        { op: "remove", path: ["a"] },
      ],
      [
        { op: "remove", path: ["x"] },
        {
          op: "add",
          path: ["a"],
          value: new Map([
            ["b", 1],
            ["c", 1],
          ]),
        },
      ]
    )
  })
  describe("deeply nested object (with changes)", () => {
    runPatchTest(
      { a: { b: { c: 1, d: 1 } } },
      (d: any) => {
        const b = d.a.b
        b.c = 2
        delete b.d
        b.y = 2
        d.a.x = b
        delete d.a.b
      },
      [
        { op: "add", path: ["a", "x"], value: { c: 2, y: 2 } },
        { op: "remove", path: ["a", "b"] },
      ]
    )
  })
  describe("deeply nested map (with changes)", () => {
    runPatchTest(
      new Map([
        [
          "a",
          new Map([
            [
              "b",
              new Map([
                ["c", 1],
                ["d", 1],
              ]),
            ],
          ]),
        ],
      ]),
      (d: any) => {
        const b = d.get("a").get("b")
        b.set("c", 2)
        b.delete("d")
        b.set("y", 2)
        d.get("a").set("x", b)
        d.get("a").delete("b")
      },
      [
        {
          op: "add",
          path: ["a", "x"],
          value: new Map([
            ["c", 2],
            ["y", 2],
          ]),
        },
        { op: "remove", path: ["a", "b"] },
      ],
      [
        { op: "remove", path: ["a", "x"] },
        {
          op: "add",
          path: ["a", "b"],
          value: new Map([
            ["c", 1],
            ["d", 1],
          ]),
        },
      ]
    )
  })
})
describe("minimum amount of changes", () => {
  runPatchTest(
    { x: 3, y: { a: 4 }, z: 3 },
    (d: any) => {
      d.y.a = 4
      d.y.b = 5
      Object.assign(d, { x: 4, y: { a: 2 } })
    },
    [
      { op: "replace", path: ["x"], value: 4 },
      { op: "replace", path: ["y"], value: { a: 2 } },
    ]
  )
})
describe("arrays - prepend", () => {
  runPatchTest(
    { x: [1, 2, 3] },
    (d: any) => {
      d.x.unshift(4)
    },
    [
      { op: "replace", path: ["x", 0], value: 4 },
      { op: "replace", path: ["x", 1], value: 1 },
      { op: "replace", path: ["x", 2], value: 2 },
      { op: "add", path: ["x", 3], value: 3 },
    ]
  )
})
describe("arrays - multiple prepend", () => {
  runPatchTest(
    { x: [1, 2, 3] },
    (d: any) => {
      d.x.unshift(4)
      d.x.unshift(5)
    },
    [
      { op: "replace", path: ["x", 0], value: 5 },
      { op: "replace", path: ["x", 1], value: 4 },
      { op: "replace", path: ["x", 2], value: 1 },
      { op: "add", path: ["x", 3], value: 2 },
      { op: "add", path: ["x", 4], value: 3 },
    ]
  )
})
describe("arrays - splice middle", () => {
  runPatchTest(
    { x: [1, 2, 3] },
    (d: any) => {
      d.x.splice(1, 1)
    },
    [
      { op: "replace", path: ["x", 1], value: 3 },
      { op: "replace", path: ["x", "length"], value: 2 },
    ]
  )
})
describe("arrays - multiple splice", () => {
  runPatchTest(
    [0, 1, 2, 3, 4, 5, 0],
    (d: any) => {
      d.splice(4, 2, 3)
      d.splice(1, 2, 3)
      expect(d.slice()).toEqual([0, 3, 3, 3, 0])
    },
    [
      { op: "replace", path: [1], value: 3 },
      { op: "replace", path: [2], value: 3 },
      { op: "replace", path: [4], value: 0 },
      { op: "replace", path: ["length"], value: 5 },
    ]
  )
})
describe("arrays - modify and shrink", () => {
  runPatchTest(
    { x: [1, 2, 3] },
    (d: any) => {
      d.x[0] = 4
      d.x.length = 2
    },
    [
      { op: "replace", path: ["x", 0], value: 4 },
      { op: "replace", path: ["x", "length"], value: 2 },
    ],
    [
      { op: "replace", path: ["x", 0], value: 1 },
      { op: "add", path: ["x", 2], value: 3 },
    ]
  )
})
describe("arrays - prepend then splice middle", () => {
  runPatchTest(
    { x: [1, 2, 3] },
    (d: any) => {
      d.x.unshift(4)
      d.x.splice(2, 1)
    },
    [
      { op: "replace", path: ["x", 0], value: 4 },
      { op: "replace", path: ["x", 1], value: 1 },
    ]
  )
})
describe("arrays - splice middle then prepend", () => {
  runPatchTest(
    { x: [1, 2, 3] },
    (d: any) => {
      d.x.splice(1, 1)
      d.x.unshift(4)
    },
    [
      { op: "replace", path: ["x", 0], value: 4 },
      { op: "replace", path: ["x", 1], value: 1 },
    ]
  )
})
describe("arrays - truncate", () => {
  runPatchTest(
    { x: [1, 2, 3] },
    (d: any) => {
      d.x.length -= 2
    },
    [{ op: "replace", path: ["x", "length"], value: 1 }],
    [
      { op: "add", path: ["x", 1], value: 2 },
      { op: "add", path: ["x", 2], value: 3 },
    ]
  )
})
describe("arrays - pop twice", () => {
  runPatchTest(
    { x: [1, 2, 3] },
    (d: any) => {
      d.x.pop()
      d.x.pop()
    },
    [{ op: "replace", path: ["x", "length"], value: 1 }]
  )
})
describe("arrays - push multiple", () => {
  runPatchTest(
    { x: [1, 2, 3] },
    (d: any) => {
      d.x.push(4, 5)
    },
    [
      { op: "add", path: ["x", 3], value: 4 },
      { op: "add", path: ["x", 4], value: 5 },
    ],
    [{ op: "replace", path: ["x", "length"], value: 3 }]
  )
})
describe("arrays - splice (expand)", () => {
  runPatchTest(
    { x: [1, 2, 3] },
    (d: any) => {
      d.x.splice(1, 1, 4, 5, 6)
    },
    [
      { op: "replace", path: ["x", 1], value: 4 },
      { op: "replace", path: ["x", 2], value: 5 },
      { op: "add", path: ["x", 3], value: 6 },
      { op: "add", path: ["x", 4], value: 3 },
    ],
    [
      { op: "replace", path: ["x", 1], value: 2 },
      { op: "replace", path: ["x", 2], value: 3 },
      { op: "replace", path: ["x", "length"], value: 3 },
    ]
  )
})
describe("arrays - splice (shrink)", () => {
  runPatchTest(
    { x: [1, 2, 3, 4, 5] },
    (d: any) => {
      d.x.splice(1, 3, 6)
    },
    [
      { op: "replace", path: ["x", 1], value: 6 },
      { op: "replace", path: ["x", 2], value: 5 },
      { op: "replace", path: ["x", "length"], value: 3 },
    ],
    [
      { op: "replace", path: ["x", 1], value: 2 },
      { op: "replace", path: ["x", 2], value: 3 },
      { op: "add", path: ["x", 3], value: 4 },
      { op: "add", path: ["x", 4], value: 5 },
    ]
  )
})
describe("arrays - delete", () => {
  runPatchTest(
    {
      x: [
        { a: 1, b: 2 },
        { c: 3, d: 4 },
      ],
    },
    (d: any) => {
      delete d.x[1].c
    },
    [{ op: "remove", path: ["x", 1, "c"] }]
  )
})
describe("arrays - append", () => {
  it("appends to array when last part of path is '-'", () => {
    const base = { list: [1, 2, 3] }
    const patch = { op: "add", value: 4, path: ["list", "-"] }
    expect(qi.applyPatches(base, [patch as any])).toEqual({
      list: [1, 2, 3, 4],
    })
  })
})
describe("sets - add - 1", () => {
  runPatchTest(
    new Set([1]),
    (d: any) => {
      d.add(2)
    },
    [{ op: "add", path: [1], value: 2 }],
    [{ op: "remove", path: [1], value: 2 }]
  )
})
describe("sets - add, delete, add - 1", () => {
  runPatchTest(
    new Set([1]),
    (d: any) => {
      d.add(2)
      d.delete(2)
      d.add(2)
    },
    [{ op: "add", path: [1], value: 2 }],
    [{ op: "remove", path: [1], value: 2 }]
  )
})
describe("sets - add, delete, add - 2", () => {
  runPatchTest(
    new Set([2, 1]),
    (d: any) => {
      d.add(2)
      d.delete(2)
      d.add(2)
    },
    [],
    []
  )
})
describe("sets - mutate - 1", () => {
  const findById = (set: any, id: any) => {
    for (const x of set) {
      if (x.id === id) return x
    }
  }
  runPatchTest(
    new Set([
      { id: 1, val: "We" },
      { id: 2, val: "will" },
    ]),
    (d: any) => {
      const obj1 = findById(d, 1)
      const obj2 = findById(d, 2)
      obj1.val = "rock"
      obj2.val = "you"
    },
    [
      { op: "remove", path: [0], value: { id: 1, val: "We" } },
      { op: "remove", path: [1], value: { id: 2, val: "will" } },
      { op: "add", path: [0], value: { id: 1, val: "rock" } },
      { op: "add", path: [1], value: { id: 2, val: "you" } },
    ],
    [
      { op: "remove", path: [1], value: { id: 2, val: "you" } },
      { op: "remove", path: [0], value: { id: 1, val: "rock" } },
      { op: "add", path: [1], value: { id: 2, val: "will" } },
      { op: "add", path: [0], value: { id: 1, val: "We" } },
    ]
  )
})
describe("arrays - splice should should result in remove op.", () => {
  runPatchTest(
    [1, 2],
    (d: any) => {
      d.splice(1, 1)
    },
    [{ op: "replace", path: ["length"], value: 1 }],
    [{ op: "add", path: [1], value: 2 }]
  )
})
describe("arrays - NESTED splice should should result in remove op.", () => {
  runPatchTest(
    { a: { b: { c: [1, 2] } } },
    (d: any) => {
      d.a.b.c.splice(1, 1)
    },
    [{ op: "replace", path: ["a", "b", "c", "length"], value: 1 }],
    [{ op: "add", path: ["a", "b", "c", 1], value: 2 }]
  )
})
describe("simple substitute", () => {
  runPatchTest({ x: 3 }, (_: any) => 4, [{ op: "replace", path: [], value: 4 }])
})
describe("same value substitute - 1", () => {
  runPatchTest(
    { x: { y: 3 } },
    (d: any) => {
      const a = d.x
      d.x = a
    },
    []
  )
})
describe("same value substitute - 2", () => {
  runPatchTest(
    { x: { y: 3 } },
    (d: any) => {
      const a = d.x
      d.x = 4
      d.x = a
    },
    []
  )
})
describe("same value substitute - 3", () => {
  runPatchTest(
    { x: 3 },
    (d: any) => {
      d.x = 3
    },
    []
  )
})
describe("same value substitute - 4", () => {
  runPatchTest(
    { x: 3 },
    (d: any) => {
      d.x = 4
      d.x = 3
    },
    []
  )
})
describe("same value substitute - 5", () => {
  runPatchTest(
    new Map([["x", 3]]),
    (d: any) => {
      d.set("x", 4)
      d.set("x", 3)
    },
    [],
    []
  )
})
describe("same value substitute - 6", () => {
  runPatchTest(
    new Set(["x", 3]),
    (d: any) => {
      d.delete("x")
      d.add("x")
    },
    [],
    []
  )
})
describe("simple delete", () => {
  runPatchTest(
    { x: 2 },
    (d: any) => {
      delete d.x
    },
    [{ op: "remove", path: ["x"] }]
  )
})
describe("patch compressions yields correct results", () => {
  let p1: any, p2: any
  runPatchTest(
    {},
    (d: any) => {
      d.x = { test: true }
    },
    (p1 = [
      {
        op: "add",
        path: ["x"],
        value: { test: true },
      },
    ])
  )
  runPatchTest(
    { x: { test: true } },
    (d: any) => {
      delete d.x
    },
    (p2 = [{ op: "remove", path: ["x"] }])
  )
  const res = runPatchTest(
    {},
    (d: any) => {
      qi.applyPatches(d, [...p1, ...p2])
    },
    []
  )
  expect(res).toEqual({})
})
describe("change then delete property", () => {
  const res = runPatchTest(
    { x: 1 },
    (d: any) => {
      d.x = 2
      delete d.x
    },
    [{ op: "remove", path: ["x"] }]
  )
  it("valid result", () => {
    expect(res).toEqual({})
  })
})
it("replaying patches with interweaved substitutes should work correctly", () => {
  const patches: any = []
  const s0 = { x: 1 }
  const s1 = qi.produce(
    s0,
    x => {
      x.x = 2
    },
    p => {
      patches.push(...p)
    }
  )
  const s2 = qi.produce(
    s1,
    _ => {
      return { x: 0 }
    },
    p => {
      patches.push(...p)
    }
  )
  const s3 = qi.produce(
    s2,
    x => {
      x.x--
    },
    p => {
      patches.push(...p)
    }
  )
  expect(s3).toEqual({ x: -1 })
  expect(qi.applyPatches(s0, patches)).toEqual({ x: -1 })
  expect(
    qi.produce(s0, x => {
      return qi.applyPatches(x, patches)
    })
  ).toEqual({ x: -1 })
})
describe("#468", () => {
  function run() {
    const item = { id: 1 }
    const base = [item]
    const [y, patches] = qi.produceWithPatches(base, (x: any) => {
      x[0].id = 2
      x[1] = item
    })
    expect(y).toEqual([{ id: 2 }, { id: 1 }])
    expect(patches).toEqual([
      {
        op: "replace",
        path: [0, "id"],
        value: 2,
      },
      {
        op: "add",
        path: [1],
        value: {
          id: 1,
        },
      },
    ])
    const y2 = qi.applyPatches(base, patches)
    expect(y2).toEqual(y)
  }
  it("proxy", () => {
    run()
  })
})
it("#521", () => {
  const base = new Map()
  const [y, patches] = qi.produceWithPatches(base, x => {
    x.set("hello", new Set(["world"]))
  })
  const y2 = qi.applyPatches(base, patches)
  expect(y2).toEqual(y)
  const [_, patches2] = qi.produceWithPatches(y, x => {
    x.get("hello").add("immer")
  })
  expect(qi.applyPatches(y, patches2)).toEqual(new Map([["hello", new Set(["world", "immer"])]]))
})
it("#559 patches works in a nested reducer with proxies", () => {
  const base = {
    x: 1,
    sub: { y: [{ a: 0 }, { a: 1 }] },
  }
  const ps = []
  const invs: any = []
  const y = qi.produce(base, x => {
    x.sub = qi.produce(
      x.sub,
      x2 => {
        x2.y.pop()
      },
      (ps2, invs2) => {
        expect(qi.isDraft(invs2[0]?.value)).toBeFalsy()
        expect(invs2[0]?.value).toMatchObject({ a: 1 })
        ps.push(...ps2)
        invs.push(...invs2)
      }
    )
  })
  const y2 = qi.applyPatches(y.sub, invs)
  expect(y2).toMatchObject(base.sub)
})
describe("#588", () => {
  const ref = { value: { num: 53 } }
  class Base {
    [qi.immerable] = true
    get nested() {
      return ref.value
    }
    set nested(_) {}
  }
  const base = new Base()
  runPatchTest(
    base,
    (x: any) => {
      ref.value = x
      qi.produce(base, x2 => {
        x2.nested.num = 42
      })
    },
    [{ op: "add", path: ["num"], value: 42 }]
  )
})
it("#676 patching Date objects", () => {
  class Test {
    test: boolean
    constructor() {
      this.test = true
    }
    perform() {
      return "tested!"
    }
  }
  const [y, patches] = qi.produceWithPatches({}, function (x: any) {
    x.date = new Date("2020-11-10T08:08:08.003Z")
    x.test = new Test()
  })
  expect((y as any).date.toJSON()).toMatchInlineSnapshot(`"2020-11-10T08:08:08.003Z"`)
  expect((y as any).test.perform()).toBe("tested!")
  const y2: any = qi.applyPatches({}, patches)
  expect(y2.date).toBeInstanceOf(Date)
  expect(y2.date.toJSON()).toMatchInlineSnapshot(`"2020-11-10T08:08:08.003Z"`)
  expect(y2.date).toEqual(new Date("2020-11-10T08:08:08.003Z"))
})
it("do not allow __proto__ polution - 738", () => {
  const obj: any = {}
  expect(obj.polluted).toBe(undefined)
  expect(() => {
    qi.applyPatches({}, [{ op: "add", path: ["__proto__", "polluted"], value: "yes" }])
  }).toThrow(isProd ? "24" : "Patching reserved attributes like __proto__, prototype and constructor is not allowed")
  expect(obj.polluted).toBe(undefined)
})
it("do not allow __proto__ polution using arrays - 738", () => {
  const obj: any = {}
  const ar: any = []
  expect(obj.polluted).toBe(undefined)
  expect(ar.polluted).toBe(undefined)
  expect(() => {
    qi.applyPatches([], [{ op: "add", path: ["__proto__", "polluted"], value: "yes" }])
  }).toThrow(isProd ? "24" : "Patching reserved attributes like __proto__, prototype and constructor is not allowed")
  expect(obj.polluted).toBe(undefined)
  expect(ar.polluted).toBe(undefined)
})
it("do not allow prototype polution - 738", () => {
  const obj: any = {}
  expect(obj.polluted).toBe(undefined)
  expect(() => {
    qi.applyPatches(Object, [{ op: "add", path: ["prototype", "polluted"], value: "yes" }])
  }).toThrow(isProd ? "24" : "Patching reserved attributes like __proto__, prototype and constructor is not allowed")
  expect(obj.polluted).toBe(undefined)
})
it("do not allow constructor polution - 738", () => {
  const obj: any = {}
  expect(obj.polluted).toBe(undefined)
  const t = {}
  qi.applyPatches(t, [{ op: "replace", path: ["constructor"], value: "yes" }])
  expect(typeof t.constructor).toBe("function")
  expect((Object as any).polluted).toBe(undefined)
})
it("do not allow constructor.prototype polution - 738", () => {
  const obj: any = {}
  expect(obj.polluted).toBe(undefined)
  expect(() => {
    qi.applyPatches({}, [
      {
        op: "add",
        path: ["constructor", "prototype", "polluted"],
        value: "yes",
      },
    ])
  }).toThrow(isProd ? "24" : "Patching reserved attributes like __proto__, prototype and constructor is not allowed")
  expect((Object as any).polluted).toBe(undefined)
})
it("maps can store __proto__, prototype and constructor props", () => {
  const obj: any = {}
  const base = new Map()
  base.set("__proto__", {})
  base.set("constructor", {})
  base.set("prototype", {})
  const y = qi.applyPatches(base, [
    { op: "add", path: ["__proto__", "polluted"], value: "yes" },
    { op: "add", path: ["constructor", "polluted"], value: "yes" },
    { op: "add", path: ["prototype", "polluted"], value: "yes" },
  ])
  expect(y.get("__proto__").polluted).toBe("yes")
  expect(y.get("constructor").polluted).toBe("yes")
  expect(y.get("prototype").polluted).toBe("yes")
  expect(obj.polluted).toBe(undefined)
})
it("CVE-2020-28477 (https://snyk.io/vuln/SNYK-JS-IMMER-1019369) follow up", () => {
  const obj: any = {}
  expect(obj.polluted).toBe(undefined)
  expect(() => {
    qi.applyPatches({}, [{ op: "add", path: ["__proto__", "polluted"], value: "yes" }])
  }).toThrow(isProd ? "24" : "Patching reserved attributes like __proto__, prototype and constructor is not allowed")
  expect(obj.polluted).toBe(undefined)
})
it("#648 assigning object to itself should not change patches", () => {
  const base = {
    obj: { value: 200 },
  }
  const [_, patches] = qi.produceWithPatches(base, x => {
    x.obj.value = 1
  })
  expect(patches).toEqual([{ op: "replace", path: ["obj", "value"], value: 1 }])
})
it("#791 patch for  nothing is stored as undefined", () => {
  const [_, patches] = qi.produceWithPatches({ abc: 123 }, _ => undefined)
  expect(patches).toEqual([{ op: "replace", path: [], value: undefined }])
  expect(qi.applyPatches({}, patches)).toEqual(undefined)
})
it("#876 Ensure empty patch set for atomic set+delete on Map", () => {
  {
    const [_, patches] = qi.produceWithPatches(new Map([["foo", "baz"]]), x => {
      x.set("foo", "bar")
      x.delete("foo")
    })
    expect(patches).toEqual([{ op: "remove", path: ["foo"] }])
  }
  {
    const [_, patches] = qi.produceWithPatches(new Map(), x => {
      x.set("foo", "bar")
      x.delete("foo")
    })
    expect(patches).toEqual([])
  }
})
it("#888 patch to a primitive produces the primitive", () => {
  {
    const [y, patches] = qi.produceWithPatches({ abc: 123 }, _ => undefined)
    expect(y).toEqual(undefined)
    expect(patches).toEqual([{ op: "replace", path: [], value: undefined }])
  }
  {
    const [y, patches] = qi.produceWithPatches(null, _ => undefined)
    expect(y).toEqual(undefined)
    expect(patches).toEqual([{ op: "replace", path: [], value: undefined }])
  }
  {
    const [y, patches] = qi.produceWithPatches(0, _ => undefined)
    expect(y).toEqual(undefined)
    expect(patches).toEqual([{ op: "replace", path: [], value: undefined }])
  }
  {
    const [y, patches] = qi.produceWithPatches("foobar", _ => undefined)
    expect(y).toEqual(undefined)
    expect(patches).toEqual([{ op: "replace", path: [], value: undefined }])
  }
  {
    const [y, patches] = qi.produceWithPatches([], _ => undefined)
    expect(y).toEqual(undefined)
    expect(patches).toEqual([{ op: "replace", path: [], value: undefined }])
  }
  {
    const [y, patches] = qi.produceWithPatches(false, _ => undefined)
    expect(y).toEqual(undefined)
    expect(patches).toEqual([{ op: "replace", path: [], value: undefined }])
  }
  {
    const [y, patches] = qi.produceWithPatches("foobar", _ => "something else")
    expect(y).toEqual("something else")
    expect(patches).toEqual([{ op: "replace", path: [], value: "something else" }])
  }
  {
    const [y, patches] = qi.produceWithPatches(false, _ => true)
    expect(y).toEqual(true)
    expect(patches).toEqual([{ op: "replace", path: [], value: true }])
  }
})
describe("#879 delete item from array", () => {
  runPatchTest(
    [1, 2, 3],
    (x: any) => {
      delete x[1]
    },
    [{ op: "replace", path: [1], value: undefined }],
    [{ op: "replace", path: [1], value: 2 }],
    [1, undefined, 3]
  )
})
describe("#879 delete item from array - 2", () => {
  runPatchTest(
    [1, 2, 3],
    (x: any) => {
      delete x[2]
    },
    [{ op: "replace", path: [2], value: undefined }],
    [{ op: "replace", path: [2], value: 3 }],
    [1, 2, undefined]
  )
})
it("#897 appendPatch", () => {
  const base = { a: [] }
  const y1 = qi.applyPatches(base, [{ op: "add", path: ["a", "-"], value: 1 }])
  const y2 = qi.applyPatches(y1, [{ op: "add", path: ["a", "-"], value: 2 }])
  const y3 = qi.applyPatches(y2, [{ op: "add", path: ["a", "-"], value: 3 }])
  expect(y3).toEqual({ a: [1, 2, 3] })
})
