import { match, P } from "../src"

describe("Branded strings", () => {
  type BrandedId = string & { __brand: "brandId" }
  type FooBar = { type: "foo"; id: BrandedId; value: string } | { type: "bar" }
  type State = {
    fooBar: FooBar
    fooBarId: BrandedId
  }
  it("should treat branded strings as default string, and not as objects", () => {
    const state: State = {
      fooBar: { type: "foo", id: "" as BrandedId, value: "value" },
      fooBarId: "" as BrandedId,
    }
    expect(
      match(state)
        .with(
          { fooBar: { type: "foo" }, fooBarId: P.when(id => id === "") },
          x => `Match: ${x.fooBar.value}`
        )
        .otherwise(() => "nope")
    ).toEqual("Match: value")
  })
})
import { BuildMany } from "../src/types/BuildMany"
import { Equal, Expect } from "../src/types/helpers"
import { State } from "./types-catalog/utils"
describe("BuildMany", () => {
  it("should correctly update the content of a readonly tuple", () => {
    type cases = [
      Expect<
        Equal<
          BuildMany<readonly [number, State], [[{ status: "idle" }, [1]]]>,
          [number, { status: "idle" }]
        >
      >,
      Expect<
        Equal<
          BuildMany<
            readonly [number, State],
            [[{ status: "idle" }, [1]]] | [[{ status: "loading" }, [1]]]
          >,
          [number, { status: "idle" }] | [number, { status: "loading" }]
        >
      >
    ]
  })
})
import { DeepExclude } from "../src/types/DeepExclude"
import {
  DistributeMatchingUnions,
  FindUnions,
  FindUnionsMany,
} from "../src/types/DistributeUnions"
import { Primitives, Equal, Expect } from "../src/types/helpers"
import { IsMatching } from "../src/types/IsMatching"
import { BigUnion, Option, State } from "./types-catalog/utils"
type Colors = "pink" | "purple" | "red" | "yellow" | "blue"
describe("DeepExclude", () => {
  it("Primitives", () => {
    type cases = [
      Expect<Equal<DeepExclude<string, "hello">, string>>,
      Expect<Equal<DeepExclude<string, string>, never>>,
      Expect<Equal<DeepExclude<string | number, string>, number>>,
      Expect<Equal<DeepExclude<string | number, boolean>, string | number>>,
      Expect<
        Equal<
          DeepExclude<Primitives, null | undefined>,
          string | number | bigint | boolean | symbol
        >
      >,
      Expect<Equal<DeepExclude<Primitives, never>, Primitives>>
    ]
  })
  it("Literals", () => {
    type cases = [
      Expect<Equal<DeepExclude<"hello" | "bonjour", "hello">, "bonjour">>,
      Expect<
        Equal<DeepExclude<"hello" | "bonjour", "hola">, "hello" | "bonjour">
      >,
      Expect<Equal<DeepExclude<1 | 2 | 3, 3>, 1 | 2>>,
      Expect<Equal<DeepExclude<"hello" | 1, string>, 1>>,
      Expect<Equal<DeepExclude<"hello" | 1, number>, "hello">>,
      Expect<Equal<DeepExclude<200n | number, bigint>, number>>,
      Expect<Equal<DeepExclude<undefined | number, number>, undefined>>
    ]
  })
  describe("Objects", () => {
    it("should correctly exclude when it matches", () => {
      type cases = [
        Expect<Equal<DeepExclude<{ a: "x" | "y" }, { a: string }>, never>>,
        Expect<Equal<DeepExclude<{ a: "x" | "y" }, { a: "x" }>, { a: "y" }>>
      ]
    })
    it("if it doesn't match, it should leave the data structure untouched", () => {
      type cases = [
        Expect<
          Equal<DeepExclude<{ a: "x" | "y" }, { b: "x" }>, { a: "x" | "y" }>
        >,
        Expect<
          Equal<DeepExclude<{ a: "x" | "y" }, { a: "z" }>, { a: "x" | "y" }>
        >
      ]
    })
    it("should work with nested object and only distribute what is necessary", () => {
      type x = DeepExclude<{ str: string | null | undefined }, { str: string }>
      type xx = DistributeMatchingUnions<
        { str: string | null | undefined },
        { str: string }
      >
      type xxx = FindUnionsMany<
        { str: string | null | undefined },
        { str: string }
      >
      type xxxx = IsMatching<
        { str: string | null | undefined },
        { str: string }
      >
      type xxxxx = FindUnions<
        { str: string | null | undefined },
        { str: string },
        []
      >
      type y = DeepExclude<
        { str: string | null | undefined },
        { str: null | undefined }
      >
      type cases = [
        Expect<Equal<x, { str: null } | { str: undefined }>>,
        Expect<Equal<y, { str: string }>>,
        Expect<
          Equal<
            DeepExclude<{ a: { b: "x" | "y" } }, { a: { b: "x" } }>,
            { a: { b: "y" } }
          >
        >,
        Expect<
          Equal<
            DeepExclude<{ a: { b: "x" | "y" | "z" } }, { a: { b: "x" } }>,
            { a: { b: "y" } } | { a: { b: "z" } }
          >
        >,
        Expect<
          Equal<
            DeepExclude<
              { a: { b: "x" | "y" | "z" }; c: "u" | "v" },
              { a: { b: "x" } }
            >,
            { a: { b: "y" }; c: "u" | "v" } | { a: { b: "z" }; c: "u" | "v" }
          >
        >,
        Expect<
          Equal<
            DeepExclude<
              { a: { b: "x" | "y" | "z" }; c: "u" | "v" },
              { c: "u" }
            >,
            { a: { b: "x" | "y" | "z" }; c: "v" }
          >
        >,
        Expect<
          Equal<
            DeepExclude<
              { a: { b: "x" | "y" | "z" }; c: "u" | "v" },
              { c: "u" }
            >,
            { a: { b: "x" | "y" | "z" }; c: "v" }
          >
        >
      ]
    })
  })
  describe("Tuples", () => {
    it("should correctly exclude when it matches", () => {
      type cases = [
        Expect<Equal<DeepExclude<["x" | "y"], [string]>, never>>,
        Expect<Equal<DeepExclude<["x" | "y"], ["x"]>, ["y"]>>,
        Expect<
          Equal<
            DeepExclude<[string, string], readonly [unknown, unknown]>,
            never
          >
        >,
        Expect<
          Equal<
            DeepExclude<[number, State], [unknown, { status: "error" }]>,
            | [number, { status: "idle" }]
            | [number, { status: "loading" }]
            | [number, { status: "success"; data: string }]
          >
        >,
        Expect<
          Equal<
            DeepExclude<
              readonly [number, State],
              [unknown, { status: "error" }]
            >,
            | [number, { status: "idle" }]
            | [number, { status: "loading" }]
            | [number, { status: "success"; data: string }]
          >
        >
      ]
    })
    it("if it doesn't match, it should leave the data structure untouched", () => {
      type cases = [
        Expect<Equal<DeepExclude<["x" | "y"], ["z"]>, ["x" | "y"]>>,
        Expect<Equal<DeepExclude<["x" | "y"], []>, ["x" | "y"]>>,
        Expect<Equal<DeepExclude<["x" | "y"], ["a", "b", "c"]>, ["x" | "y"]>>
      ]
    })
    it("should work with nested tuples and only distribute what is necessary", () => {
      type cases = [
        Expect<Equal<DeepExclude<[["x" | "y"]], [["x"]]>, [["y"]]>>,
        Expect<
          Equal<DeepExclude<[["x" | "y" | "z"]], [["x"]]>, [["y"]] | [["z"]]>
        >,
        Expect<
          Equal<
            DeepExclude<[["x" | "y" | "z"], "u" | "v"], [["x"], unknown]>,
            [["y"], "u" | "v"] | [["z"], "u" | "v"]
          >
        >,
        Expect<
          Equal<
            DeepExclude<[["x" | "y" | "z"], "u" | "v"], [unknown, "v"]>,
            [["x" | "y" | "z"], "u"]
          >
        >
      ]
    })
    it("should work with nested unary tuples", () => {
      type State = {}
      type Msg = [type: "Login"] | [type: "UrlChange", url: string]
      type Input = [State, Msg]
      type cases = [
        Expect<Equal<DeepExclude<[[number]], [[unknown]]>, never>>,
        Expect<Equal<DeepExclude<[[[number]]], [[[unknown]]]>, never>>,
        Expect<Equal<DeepExclude<[[[[number]]]], [[[[unknown]]]]>, never>>,
        Expect<
          Equal<
            DeepExclude<[[[number]]], readonly [readonly [readonly [unknown]]]>,
            never
          >
        >,
        Expect<
          Equal<
            DeepExclude<
              readonly [[[[{ t: number }]]]],
              readonly [[[[{ t: unknown }]]]]
            >,
            never
          >
        >,
        Expect<
          Equal<
            DeepExclude<[{}, Msg], [unknown, ["UrlChange", unknown]]>,
            [{}, [type: "Login"]]
          >
        >
      ]
    })
  })
  describe("List", () => {
    type cases = [
      Expect<Equal<DeepExclude<(1 | 2 | 3)[], 1[]>, (1 | 2 | 3)[]>>,
      Expect<Equal<DeepExclude<(1 | 2 | 3)[], (1 | 2 | 3)[]>, never>>,
      Expect<Equal<DeepExclude<(1 | 2 | 3)[], unknown[]>, never>>,
      Expect<
        Equal<DeepExclude<(1 | 2 | 3)[] | string[], string[]>, (1 | 2 | 3)[]>
      >
    ]
    it("should work with empty list patterns", () => {
      type cases = [
        Expect<Equal<DeepExclude<[] | [1, 2, 3], []>, [1, 2, 3]>>,
        Expect<
          Equal<
            DeepExclude<{ values: [] | [1, 2, 3] }, { values: [] }>,
            { values: [1, 2, 3] }
          >
        >,
        Expect<
          Equal<
            DeepExclude<{ values: [1, 2, 3] }, { values: [] }>,
            { values: [1, 2, 3] }
          >
        >,
        Expect<
          Equal<
            DeepExclude<{ values: (1 | 2 | 3)[] }, { values: [] }>,
            { values: (1 | 2 | 3)[] }
          >
        >
      ]
    })
  })
  describe("Sets", () => {
    type cases = [
      Expect<Equal<DeepExclude<Set<1 | 2 | 3>, Set<1>>, Set<1 | 2 | 3>>>,
      Expect<Equal<DeepExclude<Set<1 | 2 | 3>, Set<1 | 2 | 3>>, never>>,
      Expect<Equal<DeepExclude<Set<1 | 2 | 3>, Set<unknown>>, never>>,
      Expect<
        Equal<
          DeepExclude<Set<1 | 2 | 3> | Set<string>, Set<string>>,
          Set<1 | 2 | 3>
        >
      >
    ]
  })
  describe("Maps", () => {
    type cases = [
      Expect<
        Equal<
          DeepExclude<Map<string, 1 | 2 | 3>, Map<string, 1>>,
          Map<string, 1 | 2 | 3>
        >
      >,
      Expect<
        Equal<
          DeepExclude<Map<string, 1 | 2 | 3>, Map<string, 1 | 2 | 3>>,
          never
        >
      >,
      Expect<
        Equal<DeepExclude<Map<string, 1 | 2 | 3>, Map<string, unknown>>, never>
      >,
      Expect<
        Equal<
          DeepExclude<
            Map<string, 1 | 2 | 3> | Map<string, string>,
            Map<string, string>
          >,
          Map<string, 1 | 2 | 3>
        >
      >
    ]
  })
  it("should work with big unions", () => {
    type cases = [
      Expect<
        Equal<
          DeepExclude<
            | { type: "textWithColor"; union: BigUnion }
            | {
                type: "textWithColorAndBackground"
                union: BigUnion
                union2: BigUnion
              },
            { type: "textWithColor" }
          >,
          {
            type: "textWithColorAndBackground"
            union: BigUnion
            union2: BigUnion
          }
        >
      >,
      Expect<
        Equal<
          DeepExclude<
            | { type: "textWithColor"; union: BigUnion }
            | {
                type: "textWithColorAndBackground"
                union: BigUnion
                union2: BigUnion
              },
            {
              type: "textWithColorAndBackground"
              union: Exclude<BigUnion, "a">
            }
          >,
          | { type: "textWithColor"; union: BigUnion }
          | {
              type: "textWithColorAndBackground"
              union: "a"
              union2: BigUnion
            }
        >
      >
    ]
  })
  it("should work in common cases", () => {
    type cases = [
      Expect<Equal<DeepExclude<"a" | "b" | "c", "a">, "b" | "c">>,
      Expect<
        Equal<
          DeepExclude<
            | { type: "textWithColor"; color: Colors }
            | {
                type: "textWithColorAndBackground"
                color: Colors
                backgroundColor: Colors
              },
            { type: "textWithColor" }
          >,
          {
            type: "textWithColorAndBackground"
            color: Colors
            backgroundColor: Colors
          }
        >
      >,
      Expect<
        Equal<
          DeepExclude<
            | { type: "textWithColor"; color: Colors }
            | {
                type: "textWithColorAndBackground"
                color: Colors
                backgroundColor: Colors
              },
            { type: "textWithColor"; color: "pink" }
          >,
          | {
              type: "textWithColorAndBackground"
              color: Colors
              backgroundColor: Colors
            }
          | { type: "textWithColor"; color: "purple" }
          | { type: "textWithColor"; color: "red" }
          | { type: "textWithColor"; color: "yellow" }
          | { type: "textWithColor"; color: "blue" }
        >
      >,
      Expect<
        Equal<
          DeepExclude<
            [Option<{ type: "a" } | { type: "b" }>, "c" | "d"],
            [{ kind: "some"; value: { type: "a" } }, any]
          >,
          | [{ kind: "none" }, "c" | "d"]
          | [{ kind: "some"; value: { type: "b" } }, "c" | "d"]
        >
      >,
      Expect<
        Equal<
          DeepExclude<
            { x: "a" | "b"; y: "c" | "d"; z: "e" | "f" },
            { x: "a"; y: "c" }
          >,
          | { x: "b"; y: "c"; z: "e" | "f" }
          | { x: "b"; y: "d"; z: "e" | "f" }
          | { x: "a"; y: "d"; z: "e" | "f" }
        >
      >
    ]
  })
  describe("Multiple patterns", () => {
    it("should work when pattern is a union", () => {
      type cases = [
        Expect<
          Equal<
            DeepExclude<
              { x: "a" | "b"; y: "c" | "d"; z: "e" | "f" },
              { x: "a"; y: "c" } | { x: "b"; y: "c" }
            >,
            { x: "b"; y: "d"; z: "e" | "f" } | { x: "a"; y: "d"; z: "e" | "f" }
          >
        >,
        Expect<
          Equal<
            DeepExclude<
              { a: { b: "x" | "y" | "z" }; c: "u" | "v" },
              { c: "u" } | { a: { b: "x" } }
            >,
            { a: { b: "y" }; c: "v" } | { a: { b: "z" }; c: "v" }
          >
        >
      ]
    })
  })
  describe("Excluding nested unions", () => {
    it("should correctly exclude", () => {
      type cases = [
        Expect<
          Equal<
            DeepExclude<
              ["a" | "b" | "c", "a" | "b" | "c"],
              ["b" | "c", "b" | "c"]
            >,
            ["a", "a"] | ["a", "b"] | ["a", "c"] | ["b", "a"] | ["c", "a"]
          >
        >,
        Expect<
          Equal<
            DeepExclude<
              ["a" | "b" | "c", { type: "a" | "b" | "c" }],
              ["b" | "c", { type: "c" }]
            >,
            | ["a", { type: "c" }]
            | ["a", { type: "a" }]
            | ["a", { type: "b" }]
            | ["b", { type: "a" }]
            | ["b", { type: "b" }]
            | ["c", { type: "a" }]
            | ["c", { type: "b" }]
          >
        >,
        Expect<
          Equal<
            DeepExclude<
              ["a" | "b" | "c", { type: "a" | "b" | "c" }],
              ["b" | "c", { type: "b" | "c" }]
            >,
            | ["a", { type: "a" }]
            | ["a", { type: "b" }]
            | ["a", { type: "c" }]
            | ["b", { type: "a" }]
            | ["c", { type: "a" }]
          >
        >,
        Expect<
          Equal<
            DeepExclude<
              ["a" | "b" | "c", { type: "a" | "b" | "c" | "d" }],
              ["b" | "c", { type: "b" | "c" }]
            >,
            | ["a", { type: "a" }]
            | ["a", { type: "b" }]
            | ["a", { type: "c" }]
            | ["a", { type: "d" }]
            | ["b", { type: "a" }]
            | ["b", { type: "d" }]
            | ["c", { type: "a" }]
            | ["c", { type: "d" }]
          >
        >
      ]
    })
  })
  describe("readonly", () => {
    type Input = readonly ["a" | "b", "c" | "d"]
    type p = ["a", "c"] | ["a", "d"] | ["b", "c"] | ["b", "d"]
    type cases = [
      Expect<
        Equal<
          DeepExclude<Input, ["a", "c"]>,
          ["a", "d"] | ["b", "c"] | ["b", "d"]
        >
      >,
      Expect<Equal<DeepExclude<Input, p>, never>>
    ]
  })
  it("should work with unknown", () => {
    type cases = [
      Expect<
        Equal<
          DeepExclude<
            [number, { type: "a"; b: string }],
            [unknown, { type: "a"; b: unknown }]
          >,
          never
        >
      >
    ]
  })
  it("should work when `b` contains a union", () => {
    type t = Expect<
      Equal<
        DeepExclude<
          {
            type: "c"
            value:
              | { type: "d"; value: boolean }
              | { type: "e"; value: string[] }
              | { type: "f"; value: number[] }
          },
          {
            type: "c"
            value: {
              type: "d" | "e"
            }
          }
        >,
        { type: "c"; value: { type: "f"; value: number[] } }
      >
    >
  })
})
import {
  FindUnions,
  Distribute,
  DistributeMatchingUnions,
  FindUnionsMany,
} from "../src/types/DistributeUnions"
import { Equal, Expect } from "../src/types/helpers"
import { Option } from "./types-catalog/utils"
describe("FindAllUnions", () => {
  it("should correctly find all unions on an object", () => {
    type cases = [
      Expect<
        Equal<
          FindUnions<{ a: 1 | 2; b: 3 | 4; c: 6 | 7 }, { a: 1; b: 3 }>,
          [
            {
              cases:
                | {
                    value: 1
                    subUnions: []
                  }
                | {
                    value: 2
                    subUnions: []
                  }
              path: ["a"]
            },
            {
              cases:
                | {
                    value: 4
                    subUnions: []
                  }
                | {
                    value: 3
                    subUnions: []
                  }
              path: ["b"]
            }
          ]
        >
      >,
      Expect<
        Equal<
          FindUnions<
            {
              a: 1 | 2
              b: 3 | 4
              c: 5 | 6
              d: 7 | 8 // not matched
            },
            { a: 1; b: 3; c: 5 }
          >,
          [
            {
              cases:
                | {
                    value: 1
                    subUnions: []
                  }
                | {
                    value: 2
                    subUnions: []
                  }
              path: ["a"]
            },
            {
              cases:
                | {
                    value: 3
                    subUnions: []
                  }
                | {
                    value: 4
                    subUnions: []
                  }
              path: ["b"]
            },
            {
              cases:
                | {
                    value: 5
                    subUnions: []
                  }
                | {
                    value: 6
                    subUnions: []
                  }
              path: ["c"]
            }
          ]
        >
      >,
      Expect<
        Equal<
          FindUnions<
            {
              a: 1 | 2
              b: 3 | 4
              c: 5 | 6
              d: { e: 7 | 8; f: 9 | 10 }
              g: 11 | 12 // not matched by the pattern
            },
            {
              a: 1
              b: 3
              c: 5
              d: { e: 7; f: 9 }
            }
          >,
          [
            {
              cases:
                | {
                    value: 1
                    subUnions: []
                  }
                | {
                    value: 2
                    subUnions: []
                  }
              path: ["a"]
            },
            {
              cases:
                | {
                    value: 3
                    subUnions: []
                  }
                | {
                    value: 4
                    subUnions: []
                  }
              path: ["b"]
            },
            {
              cases:
                | {
                    value: 5
                    subUnions: []
                  }
                | {
                    value: 6
                    subUnions: []
                  }
              path: ["c"]
            },
            {
              cases:
                | {
                    value: 7
                    subUnions: []
                  }
                | {
                    value: 8
                    subUnions: []
                  }
              path: ["d", "e"]
            },
            {
              cases:
                | {
                    value: 9
                    subUnions: []
                  }
                | {
                    value: 10
                    subUnions: []
                  }
              path: ["d", "f"]
            }
          ]
        >
      >,
      Expect<
        Equal<
          FindUnions<
            { a: { b: { e: 7 | 8; f: 9 | 10 } } } | { c: 11 | 12 },
            { a: { b: { e: 7; f: 9 } } }
          >,
          [
            {
              cases:
                | {
                    value: { a: { b: { e: 7 | 8; f: 9 | 10 } } }
                    subUnions: [
                      {
                        cases:
                          | {
                              value: 7
                              subUnions: []
                            }
                          | {
                              value: 8
                              subUnions: []
                            }
                        path: ["a", "b", "e"]
                      },
                      {
                        cases:
                          | {
                              value: 9
                              subUnions: []
                            }
                          | {
                              value: 10
                              subUnions: []
                            }
                        path: ["a", "b", "f"]
                      }
                    ]
                  }
                | { value: { c: 11 | 12 }; subUnions: [] }
              path: []
            }
          ]
        >
      >,
      Expect<
        Equal<
          FindUnions<
            {
              e: "not a union"
              a: {
                e: 7 | 8
                f: 9 | 10
                g: 11 | 12 // not matched
              }
              b: 2 | 3
            },
            { e: "not a union"; a: { e: 7; f: 9 }; b: 2 }
          >,
          [
            {
              cases:
                | {
                    value: 7
                    subUnions: []
                  }
                | {
                    value: 8
                    subUnions: []
                  }
              path: ["a", "e"]
            },
            {
              cases:
                | {
                    value: 9
                    subUnions: []
                  }
                | {
                    value: 10
                    subUnions: []
                  }
              path: ["a", "f"]
            },
            {
              cases:
                | {
                    value: 2
                    subUnions: []
                  }
                | {
                    value: 3
                    subUnions: []
                  }
              path: ["b"]
            }
          ]
        >
      >
    ]
  })
  it("should correctly find all unions on a tuple", () => {
    type cases = [
      Expect<
        Equal<
          FindUnions<[1 | 2, 3 | 4], [1, 3]>,
          [
            {
              cases:
                | {
                    value: 1
                    subUnions: []
                  }
                | {
                    value: 2
                    subUnions: []
                  }
              path: [0]
            },
            {
              cases:
                | {
                    value: 3
                    subUnions: []
                  }
                | {
                    value: 4
                    subUnions: []
                  }
              path: [1]
            }
          ]
        >
      >,
      Expect<
        Equal<
          FindUnions<[1 | 2, 3 | 4, 5 | 6], [1, 3, 5]>,
          [
            {
              cases:
                | {
                    value: 1
                    subUnions: []
                  }
                | {
                    value: 2
                    subUnions: []
                  }
              path: [0]
            },
            {
              cases:
                | {
                    value: 3
                    subUnions: []
                  }
                | {
                    value: 4
                    subUnions: []
                  }
              path: [1]
            },
            {
              cases:
                | {
                    value: 5
                    subUnions: []
                  }
                | {
                    value: 6
                    subUnions: []
                  }
              path: [2]
            }
          ]
        >
      >,
      Expect<
        Equal<
          FindUnions<
            { type: "a"; value: 1 | 2 } | { type: "b"; value: 4 | 5 },
            { type: "a"; value: 1 }
          >,
          [
            {
              cases:
                | {
                    value: { type: "a"; value: 1 | 2 }
                    subUnions: [
                      {
                        cases:
                          | {
                              value: 1
                              subUnions: []
                            }
                          | {
                              value: 2
                              subUnions: []
                            }
                        path: ["value"]
                      }
                    ]
                  }
                | {
                    value: { type: "b"; value: 4 | 5 }
                    subUnions: []
                  }
              path: []
            }
          ]
        >
      >,
      Expect<
        Equal<
          FindUnions<readonly ["a" | "b", "c" | "d"], ["a", "c"]>,
          [
            {
              cases:
                | {
                    value: "a"
                    subUnions: []
                  }
                | {
                    value: "b"
                    subUnions: []
                  }
              path: [0]
            },
            {
              cases:
                | {
                    value: "c"
                    subUnions: []
                  }
                | {
                    value: "d"
                    subUnions: []
                  }
              path: [1]
            }
          ]
        >
      >
    ]
  })
  it("should avoid duplicating the unions, even if the pattern matches the same path twice", () => {
    type cases = [
      Expect<
        Equal<
          FindUnionsMany<
            { type: { x: "a"; y: 1 | 2 } | { x: "b"; y: 3 | 4 } },
            { type: { x: "a"; y: 1 } } | { type: { x: "a"; y: 2 } }
          >,
          [
            {
              cases:
                | {
                    value: {
                      x: "a"
                      y: 1 | 2
                    }
                    subUnions: [
                      {
                        cases:
                          | {
                              value: 1
                              subUnions: []
                            }
                          | {
                              value: 2
                              subUnions: []
                            }
                        path: ["type", "y"]
                      }
                    ]
                  }
                | {
                    value: {
                      x: "b"
                      y: 3 | 4
                    }
                    subUnions: []
                  }
              path: ["type"]
            }
          ]
        >
      >
    ]
  })
})
describe("Distribute", () => {
  it("should distribute unions into a list of values with their path", () => {
    type cases = [
      Expect<
        Equal<
          Distribute<
            [
              {
                cases:
                  | {
                      value: 1
                      subUnions: []
                    }
                  | {
                      value: 2
                      subUnions: []
                    }
                path: [0]
              },
              {
                cases:
                  | {
                      value: 3
                      subUnions: []
                    }
                  | {
                      value: 4
                      subUnions: []
                    }
                path: [1]
              }
            ]
          >,
          | [[1, [0]], [3, [1]]]
          | [[1, [0]], [4, [1]]]
          | [[2, [0]], [3, [1]]]
          | [[2, [0]], [4, [1]]]
        >
      >,
      Expect<
        Equal<
          Distribute<
            [
              {
                cases:
                  | {
                      value: 1
                      subUnions: []
                    }
                  | {
                      value: 2
                      subUnions: []
                    }
                path: [0]
              },
              {
                cases:
                  | {
                      value: 3
                      subUnions: []
                    }
                  | {
                      value: 4
                      subUnions: []
                    }
                path: [1]
              },
              {
                cases:
                  | {
                      value: 5
                      subUnions: []
                    }
                  | {
                      value: 6
                      subUnions: []
                    }
                path: [2]
              }
            ]
          >,
          | [[1, [0]], [3, [1]], [5, [2]]]
          | [[1, [0]], [3, [1]], [6, [2]]]
          | [[1, [0]], [4, [1]], [5, [2]]]
          | [[1, [0]], [4, [1]], [6, [2]]]
          | [[2, [0]], [3, [1]], [5, [2]]]
          | [[2, [0]], [3, [1]], [6, [2]]]
          | [[2, [0]], [4, [1]], [5, [2]]]
          | [[2, [0]], [4, [1]], [6, [2]]]
        >
      >,
      Equal<
        // Nested
        Distribute<
          [
            {
              cases:
                | {
                    value: {
                      type: "a"
                      value: 1 | 2
                    }
                    subUnions: [
                      {
                        cases:
                          | {
                              value: 1
                              subUnions: []
                            }
                          | {
                              value: 2
                              subUnions: []
                            }
                        path: ["value"]
                      }
                    ]
                  }
                | {
                    value: {
                      type: "b"
                      value: 4 | 5
                    }
                    subUnions: [
                      {
                        cases:
                          | {
                              value: 4
                              subUnions: []
                            }
                          | {
                              value: 5
                              subUnions: []
                            }
                        path: ["value"]
                      }
                    ]
                  }
              path: []
            }
          ]
        >,
        | [[{ type: "a"; value: 1 | 2 }, []], [1, ["value"]]]
        | [[{ type: "a"; value: 1 | 2 }, []], [2, ["value"]]]
        | [[{ type: "b"; value: 4 | 5 }, []], [4, ["value"]]]
        | [[{ type: "b"; value: 4 | 5 }, []], [5, ["value"]]]
      >
    ]
  })
})
describe("DistributeMatchingUnions", () => {
  type cases = [
    Expect<
      Equal<
        DistributeMatchingUnions<
          { a: 1 | 2; b: "3" | "4"; c: "5" | "6" },
          { a: 1; b: "3"; c: "5" }
        >,
        | { a: 1; b: "3"; c: "5" }
        | { a: 1; b: "3"; c: "6" }
        | { a: 1; b: "4"; c: "5" }
        | { a: 1; b: "4"; c: "6" }
        | { a: 2; b: "3"; c: "5" }
        | { a: 2; b: "3"; c: "6" }
        | { a: 2; b: "4"; c: "5" }
        | { a: 2; b: "4"; c: "6" }
      >
    >,
    Expect<
      Equal<
        DistributeMatchingUnions<
          { x: "a"; value: Option<string> } | { x: "b"; value: Option<number> },
          { x: "a"; value: { kind: "none" } }
        >,
        | { x: "a"; value: { kind: "none" } }
        | { x: "a"; value: { kind: "some"; value: string } }
        | { x: "b"; value: Option<number> }
      >
    >,
    Expect<
      Equal<
        DistributeMatchingUnions<
          [1, number] | ["two", string] | [3, boolean],
          [3, true]
        >,
        [1, number] | ["two", string] | [3, false] | [3, true]
      >
    >
  ]
  it("should leave unions of literals untouched", () => {
    type cases = [
      Expect<Equal<DistributeMatchingUnions<"a" | "b", "a">, "a" | "b">>,
      Expect<Equal<DistributeMatchingUnions<1 | 2, 1>, 1 | 2>>,
      Expect<Equal<DistributeMatchingUnions<boolean, true>, false | true>>
    ]
  })
  it("should work on nested tuples", () => {
    type cases = [
      Expect<
        Equal<
          DistributeMatchingUnions<
            [1, ["two", Option<string>] | [3, Option<boolean>]],
            [1, ["two", { kind: "some"; value: string }]]
          >,
          | [1, ["two", { kind: "none" }]]
          | [1, ["two", { kind: "some"; value: string }]]
          | [1, [3, Option<boolean>]]
        >
      >,
      Expect<
        Equal<
          DistributeMatchingUnions<
            [1, ["two", Option<string>]] | [3, Option<boolean>],
            [1, ["two", { kind: "some"; value: string }]]
          >,
          | [1, ["two", { kind: "none" }]]
          | [1, ["two", { kind: "some"; value: string }]]
          | [3, Option<boolean>]
        >
      >,
      Expect<
        Equal<
          DistributeMatchingUnions<["a" | "b", 1 | 2], ["a", unknown]>,
          ["a", 1 | 2] | ["b", 1 | 2]
        >
      >
    ]
  })
  it("unknown should match but shouldn't distribute", () => {
    type cases = [
      Expect<
        Equal<
          DistributeMatchingUnions<
            [1, ["two", Option<string>]] | [3, Option<boolean>],
            [1, unknown]
          >,
          [1, ["two", Option<string>]] | [3, Option<boolean>]
        >
      >,
      Expect<
        Equal<
          DistributeMatchingUnions<
            { a: 1 | 2; b: "3" | "4"; c: "5" | "6" },
            { a: 1; b: unknown; c: unknown }
          >,
          | { a: 1; b: "3" | "4"; c: "5" | "6" }
          | { a: 2; b: "3" | "4"; c: "5" | "6" }
        >
      >,
      Expect<
        Equal<
          DistributeMatchingUnions<
            { a: 1 | 2; b: "3" | "4"; c: "5" | "6" },
            { a: 1; b: "3"; c: unknown }
          >,
          | { a: 1; b: "3"; c: "5" | "6" }
          | { a: 2; b: "3"; c: "5" | "6" }
          | { a: 1; b: "4"; c: "5" | "6" }
          | { a: 2; b: "4"; c: "5" | "6" }
        >
      >,
      Expect<
        Equal<
          DistributeMatchingUnions<
            { a: 1 | 2; b: ["3" | "4", "5" | "6"] },
            { a: 1; b: ["3", unknown] }
          >,
          | { a: 1; b: ["3", "5" | "6"] }
          | { a: 2; b: ["3", "5" | "6"] }
          | { a: 1; b: ["4", "5" | "6"] }
          | { a: 2; b: ["4", "5" | "6"] }
        >
      >
    ]
  })
  it("should work for non unions", () => {
    type cases = [
      Expect<Equal<DistributeMatchingUnions<{}, {}>, {}>>,
      Expect<Equal<DistributeMatchingUnions<[], []>, []>>,
      Expect<
        Equal<
          DistributeMatchingUnions<Map<string, string>, Map<string, string>>,
          Map<string, string>
        >
      >,
      Expect<
        Equal<DistributeMatchingUnions<Set<string>, Set<string>>, Set<string>>
      >,
      Expect<Equal<DistributeMatchingUnions<string, string>, string>>,
      Expect<Equal<DistributeMatchingUnions<number, number>, number>>,
      Expect<Equal<DistributeMatchingUnions<any, any>, any>>,
      Expect<Equal<DistributeMatchingUnions<never, never>, never>>,
      Expect<Equal<DistributeMatchingUnions<unknown, unknown>, unknown>>
    ]
  })
  it("should work with objects", () => {
    type X = 1 | 2 | 3 | 4 | 5 | 6 | 7
    type cases = [
      Expect<
        Equal<
          DistributeMatchingUnions<
            { a: X; b: X; c: X; d: X; e: X; f: X; g: X; h: X; i: X },
            { a: 1 }
          >,
          | { a: 1; b: X; c: X; d: X; e: X; f: X; g: X; h: X; i: X }
          | { a: 2; b: X; c: X; d: X; e: X; f: X; g: X; h: X; i: X }
          | { a: 3; b: X; c: X; d: X; e: X; f: X; g: X; h: X; i: X }
          | { a: 4; b: X; c: X; d: X; e: X; f: X; g: X; h: X; i: X }
          | { a: 5; b: X; c: X; d: X; e: X; f: X; g: X; h: X; i: X }
          | { a: 6; b: X; c: X; d: X; e: X; f: X; g: X; h: X; i: X }
          | { a: 7; b: X; c: X; d: X; e: X; f: X; g: X; h: X; i: X }
        >
      >,
      Expect<
        Equal<
          DistributeMatchingUnions<
            {
              type: "type"
              x: undefined
              q: string
              union1: "a" | "b"
              color: "3"
              union2: "1" | "2"
            },
            { union1: "a"; union2: "1" }
          >,
          | {
              type: "type"
              q: string
              x: undefined
              union1: "a"
              color: "3"
              union2: "1"
            }
          | {
              type: "type"
              q: string
              x: undefined
              union1: "a"
              color: "3"
              union2: "2"
            }
          | {
              type: "type"
              q: string
              x: undefined
              union1: "b"
              color: "3"
              union2: "1"
            }
          | {
              type: "type"
              q: string
              x: undefined
              union1: "b"
              color: "3"
              union2: "2"
            }
        >
      >
    ]
  })
  it("should not distribute unions for lists, set and maps", () => {
    // The reason is that list can be heterogeneous, so
    // matching on a A[] for a in input of (A|B)[] doesn't
    // rule anything out. You can still have a (A|B)[] afterward.
    // The same logic goes for Set and Maps.
    type cases = [
      Expect<
        Equal<DistributeMatchingUnions<("a" | "b")[], "a"[]>, ("a" | "b")[]>
      >,
      Expect<
        Equal<
          DistributeMatchingUnions<
            { type: "a" | "b"; x: "c" | "d" }[],
            { type: "a"; x: "c" }[]
          >,
          { type: "a" | "b"; x: "c" | "d" }[]
        >
      >,
      Expect<
        Equal<
          DistributeMatchingUnions<Set<"a" | "b">, Set<"a">>,
          Set<"a" | "b">
        >
      >,
      Expect<
        Equal<
          DistributeMatchingUnions<Map<string, "a" | "b">, Map<string, "a">>,
          Map<string, "a" | "b">
        >
      >,
      Expect<
        Equal<
          DistributeMatchingUnions<
            | {
                type: "a"
                items: ({ t: "x"; some: string; data: number } | { t: "y" })[]
              }
            | {
                type: "b"
                items: { other: boolean; data: string }[]
              },
            { type: "a"; items: { t: "y" }[] }
          >,
          | {
              type: "a"
              items: ({ t: "x"; some: string; data: number } | { t: "y" })[]
            }
          | {
              type: "b"
              items: { other: boolean; data: string }[]
            }
        >
      >
    ]
  })
  it("should return the input if the inverted pattern is `unknown` (if the pattern is `P._`", () => {
    type cases = [
      Expect<
        Equal<
          DistributeMatchingUnions<
            [1, number] | ["two", string] | [3, boolean],
            unknown
          >,
          [1, number] | ["two", string] | [3, boolean]
        >
      >,
      Expect<
        Equal<
          DistributeMatchingUnions<
            { a: 1 | 2; b: "3" | "4"; c: "5" | "6" },
            unknown
          >,
          { a: 1 | 2; b: "3" | "4"; c: "5" | "6" }
        >
      >,
      Expect<
        Equal<
          DistributeMatchingUnions<
            | { x: "a"; value: Option<string> }
            | { x: "b"; value: Option<number> },
            unknown
          >,
          { x: "a"; value: Option<string> } | { x: "b"; value: Option<number> }
        >
      >
    ]
  })
  it("should work with readonly inputs", () => {
    type cases = [
      Expect<
        Equal<
          DistributeMatchingUnions<readonly ["a" | "b", "c" | "d"], ["a", "c"]>,
          ["a", "c"] | ["a", "d"] | ["b", "c"] | ["b", "d"]
        >
      >
    ]
  })
})
import { match, P } from "../src"
import { Equal, Expect } from "../src/types/helpers"
import {
  Option,
  some,
  none,
  BigUnion,
  State,
  Event,
} from "./types-catalog/utils"
describe("exhaustive()", () => {
  describe("should exclude matched patterns from subsequent `.with()` clauses", () => {
    it("string literals", () => {
      type Input = "a" | "b" | "c"
      const input = "b" as Input
      match(input)
        .with("b", x => {
          type t = Expect<Equal<typeof x, "b">>
          return 1
        })
        // @ts-expect-error
        .exhaustive()
      match(input)
        .with("a", x => 1)
        .with("b", x => 1)
        // @ts-expect-error
        .exhaustive()
      match(input)
        .with("a", x => {
          type t = Expect<Equal<typeof x, "a">>
          return 1
        })
        .with("b", x => {
          type t = Expect<Equal<typeof x, "b">>
          return 2
        })
        // @ts-expect-error
        .exhaustive()
      match(input)
        .with("a", x => {
          type t = Expect<Equal<typeof x, "a">>
          return 1
        })
        .with("b", x => {
          type t = Expect<Equal<typeof x, "b">>
          return 2
        })
        .with("c", x => {
          type t = Expect<Equal<typeof x, "c">>
          return 2
        })
        .exhaustive()
    })
    it("number literals", () => {
      type Input = 1 | 2 | 3
      const input = 2 as Input
      match(input)
        .with(2, x => {
          type t = Expect<Equal<typeof x, 2>>
          return 2
        })
        // @ts-expect-error
        .exhaustive()
      match(input)
        .with(1, x => 1)
        .with(2, () => 3)
        // @ts-expect-error
        .exhaustive()
      match(input)
        .with(1, x => {
          type t = Expect<Equal<typeof x, 1>>
          return 1
        })
        .with(2, x => {
          type t = Expect<Equal<typeof x, 2>>
          return 2
        })
        // @ts-expect-error
        .exhaustive()
      match(input)
        .with(1, x => {
          type t = Expect<Equal<typeof x, 1>>
          return 1
        })
        .with(2, x => {
          type t = Expect<Equal<typeof x, 2>>
          return 2
        })
        .with(3, x => {
          type t = Expect<Equal<typeof x, 3>>
          return 2
        })
        .exhaustive()
    })
    it("boolean literals", () => {
      type Input = [true, true] | [false, true] | [false, false] | [true, false]
      const input = [true, true] as Input
      match(input)
        .with([true, true], () => true)
        .with([false, true], () => false)
        .with([true, false], () => false)
        // @ts-expect-error
        .exhaustive()
      match(input)
        .with([true, true], () => true)
        .with([false, true], () => false)
        .with([true, false], () => false)
        .with([false, false], () => false)
        .exhaustive()
    })
    it("boolean literals", () => {
      type Input = [boolean, boolean]
      const input = [true, true] as Input
      match(input)
        .with([true, true], () => true)
        .with([false, true], () => false)
        .with([true, false], () => false)
        // @ts-expect-error
        .exhaustive()
      match(input)
        .with([true, true], () => true)
        .with([false, true], () => false)
        .with([true, false], () => false)
        .with([false, false], () => false)
        .exhaustive()
    })
    it("union of objects", () => {
      type letter =
        | "a"
        | "b"
        | "c"
        | "d"
        | "e"
        | "f"
        | "g"
        | "h"
        | "i"
        | "j"
        | "k"
        | "l"
        | "m"
        | "n"
        | "o"
        | "p"
        | "q"
        | "r"
        | "s"
        | "t"
        | "u"
        | "v"
        | "w"
        | "x"
        | "y"
        | "z"
      type Input =
        | { type: 1; data: number }
        | { type: "two"; data: string }
        | { type: 3; data: boolean }
        | { type: 4 }
        | (letter extends any ? { type: letter } : never)
      const input = { type: 1, data: 2 } as Input
      match(input)
        .with({ type: 1 }, x => 1)
        // @ts-expect-error
        .exhaustive()
      match(input)
        .with({ type: 1 }, x => 1)
        .with({ type: "two" }, x => 2)
        // @ts-expect-error
        .exhaustive()
      match(input)
        .with({ type: 1, data: P.select() }, data => {
          type t = Expect<Equal<typeof data, number>>
          return 1
        })
        .with({ type: "two", data: P.select() }, data => data.length)
        .with({ type: 3, data: true }, ({ data }) => {
          type t = Expect<Equal<typeof data, true>>
          return 3
        })
        .with({ type: 3, data: P.any }, ({ data }) => {
          type t = Expect<Equal<typeof data, boolean>>
          return 3
        })
        .with({ type: 4 }, () => 3)
        .with({ type: "a" }, () => 0)
        .with({ type: "b" }, () => 0)
        .with({ type: "c" }, () => 0)
        .with({ type: "d" }, () => 0)
        .with({ type: "e" }, () => 0)
        .with({ type: "f" }, () => 0)
        .with({ type: "g" }, () => 0)
        .with({ type: "h" }, () => 0)
        .with({ type: "i" }, () => 0)
        .with({ type: "j" }, () => 0)
        .with({ type: "k" }, () => 0)
        .with({ type: "l" }, () => 0)
        .with({ type: "m" }, () => 0)
        .with({ type: "n" }, () => 0)
        .with({ type: "o" }, () => 0)
        .with({ type: "p" }, () => 0)
        .with({ type: "q" }, () => 0)
        .with({ type: "r" }, () => 0)
        .with({ type: "s" }, () => 0)
        .with({ type: "t" }, () => 0)
        .with({ type: "u" }, () => 0)
        .with({ type: "v" }, () => 0)
        .with({ type: "w" }, () => 0)
        .with({ type: "x" }, () => 0)
        .with({ type: "y" }, () => 0)
        .with({ type: "z" }, () => 0)
        .exhaustive()
      match<Option<number>>({ kind: "some", value: 3 })
        .with({ kind: "some" }, ({ value }) => value)
        .with({ kind: "none" }, () => 0)
        .exhaustive()
      match<Option<number>>({ kind: "some", value: 3 })
        .with({ kind: "some", value: 3 }, ({ value }): number => value)
        .with({ kind: "none" }, () => 0)
        // @ts-expect-error: missing {kind: 'some', value: number}
        .exhaustive()
      match<Option<number>>({ kind: "some", value: 3 })
        .with({ kind: "some", value: 3 }, ({ value }): number => value)
        .with({ kind: "some", value: P.number }, ({ value }): number => value)
        .with({ kind: "none" }, () => 0)
        .exhaustive()
    })
    it("union of tuples", () => {
      type Input = [1, number] | ["two", string] | [3, boolean]
      const input = [1, 3] as Input
      match(input)
        .with([1, P.any], x => 1)
        // @ts-expect-error
        .exhaustive()
      match(input)
        .with([1, P.any], x => 1)
        .with(["two", P.any], x => 2)
        // @ts-expect-error
        .exhaustive()
      match(input)
        .with([1, P.any], x => 1)
        .with(["two", P.any], ([_, data]) => data.length)
        .with([3, P.any], () => 3)
        .exhaustive()
      match(input)
        .with([1, P.any], x => 1)
        .with(["two", "Hey"], ([_, data]) => data.length)
        .with(["two", P.any], ([_, data]) => data.length)
        .with([3, P.any], () => 3)
        .exhaustive()
    })
    it("deeply nested 1", () => {
      type Input =
        | [1, Option<number>]
        | ["two", Option<string>]
        | [3, Option<boolean>]
      const input = [1, { kind: "some", value: 3 }] as Input
      match(input)
        .with([1, { kind: "some" }], x => 1)
        // @ts-expect-error
        .exhaustive()
      match(input)
        .with([1, P.any], x => 1)
        .with(["two", P.any], x => 2)
        // @ts-expect-error
        .exhaustive()
      match(input)
        .with([1, P._], x => 1)
        .with(["two", { kind: "some" }], ([_, { value }]) => value.length)
        .with([3, P._], () => 3)
        // @ts-expect-error
        .exhaustive()
      match(input)
        .with(["two", { kind: "some" }], ([_, { value }]) => value.length)
        .with(["two", { kind: "none" }], () => 4)
        .with([1, P._], () => 3)
        .with([3, P._], () => 3)
        .exhaustive()
    })
    it("deeply nested 2", () => {
      type Input = ["two", Option<string>]
      const input = ["two", { kind: "some", value: "hello" }] as Input
      match(input)
        .with(["two", { kind: "some" }], ([_, { value }]) => value.length)
        .with(["two", { kind: "none" }], () => 4)
        .exhaustive()
    })
    it("should work with non-unions", () => {
      match<number>(2)
        .with(2, () => "two")
        .with(3, () => "three")
        // @ts-expect-error
        .exhaustive()
      match<number>(2)
        .with(2, () => "two")
        .with(3, () => "three")
        .with(P.number, () => "something else")
        .exhaustive()
      match<string>("Hello")
        .with("Hello", () => "english")
        .with("Bonjour", () => "french")
        // @ts-expect-error
        .exhaustive()
      match<string>("Hello")
        .with("Hello", () => "english")
        .with("Bonjour", () => "french")
        .with(P.any, c => "something else")
        .exhaustive()
    })
    it("should work with object properties union", () => {
      type Input = { value: "a" | "b" }
      const input = { value: "a" } as Input
      match(input)
        .with({ value: "a" }, x => 1)
        // @ts-expect-error
        .exhaustive()
      match(input)
        .with({ value: P.any }, x => 1)
        .exhaustive()
      match(input)
        .with({ value: "a" }, x => 1)
        .with({ value: "b" }, x => 1)
        .exhaustive()
    })
    it("should work with lists", () => {
      type Input =
        | {
            type: "a"
            items: ({ some: string; data: number } | string)[]
          }
        | {
            type: "b"
            items: { other: boolean; data: string }[]
          }
      const input = {
        type: "a",
        items: [{ some: "hello", data: 42 }],
      } as Input
      match(input)
        .with({ type: "a" }, x => x.items)
        // @ts-expect-error
        .exhaustive()
      match(input)
        .with({ type: "a" }, x => x.items)
        .with({ type: "b", items: P.array({ data: P.string }) }, x => [])
        .exhaustive()
      match(input)
        .with({ type: "a", items: P.array(P.any) }, x => x.items)
        .with({ type: "b", items: P.array({ data: P.string }) }, x => [])
        .exhaustive()
      match<Input>(input)
        .with({ type: "a", items: P.array({ some: P.any }) }, x => x.items)
        .with({ type: "b", items: P.array({ data: P.string }) }, x => [])
        // @ts-expect-error
        .exhaustive()
    })
    it("should support P.any in a readonly tuple", () => {
      const f = (n: number, state: State) => {
        const x = match([n, state] as const)
          .with(
            [1, { status: "success", data: P.select() }],
            ([_, { data }]) => data.startsWith("coucou"),
            data => data.replace("coucou", "bonjour")
          )
          .with([2, P.any], () => "It's a twoooo")
          .with([P.any, { status: "error" }], () => "Oups")
          .with([P.any, { status: "idle" }], () => "")
          .with([P.any, { status: "loading" }], () => "")
          .with([P.any, { status: "success" }], () => "")
          .exhaustive()
      }
    })
    it("should work with Sets", () => {
      type Input = Set<string> | Set<number>
      const input = new Set([""]) as Input
      match(input)
        .with(new Set([P.string]), x => x)
        // @ts-expect-error
        .exhaustive()
      match(input)
        .with(new Set([P.string]), x => x)
        .with(new Set([P.number]), x => new Set([]))
        .exhaustive()
    })
    it("should work with Sets", () => {
      type Input = Set<string> | Set<number>
      const input = new Set([""]) as Input
      expect(
        match(input)
          .with(new Set([P.string]), x => x)
          // @ts-expect-error
          .exhaustive()
      ).toEqual(input)
      expect(
        match(input)
          .with(new Set([P.string]), x => 1)
          .with(new Set([P.number]), x => 2)
          .exhaustive()
      ).toEqual(1)
    })
    it("should work with Maps", () => {
      type Input = Map<string, 1 | 2 | 3>
      const input = new Map([["hello", 1]]) as Input
      expect(
        match(input)
          .with(new Map([["hello" as const, P.number]]), x => x)
          // @ts-expect-error
          .exhaustive()
      ).toEqual(input)
      expect(
        match(input)
          .with(new Map([["hello" as const, 1 as const]]), x => x)
          // @ts-expect-error
          .exhaustive()
      ).toEqual(input)
      expect(
        match(input)
          .with(new Map([["hello", 1 as const]]), x => x)
          // @ts-expect-error
          .exhaustive()
      ).toEqual(input)
      match(input)
        .with(P.any, x => x)
        .exhaustive()
    })
    it("should work with structures with a lot of unions", () => {
      type X = 1 | 2 | 3 | 4 | 5 | 6 | 7
      // This structures has 7 ** 9 = 40353607 possibilities
      match<{
        a: X
        b: X
        c: X
        d: X
        e: X
        f: X
        g: X
        h: X
        i: X
      }>({ a: 1, b: 1, c: 1, d: 1, e: 1, f: 1, g: 1, h: 1, i: 1 })
        .with({ b: 1 }, () => "otherwise")
        .with({ b: 2 }, () => "b = 2")
        .with({ b: 3 }, () => "otherwise")
        .with({ b: 4 }, () => "otherwise")
        .with({ b: 5 }, () => "otherwise")
        .with({ b: 6 }, () => "otherwise")
        .with({ b: 7 }, () => "otherwise")
        .exhaustive()
      match<{
        a: X
        b: X
        c: X
      }>({ a: 1, b: 1, c: 1 })
        .with({ a: P.not(1) }, () => "a != 1")
        .with({ a: 1 }, () => "a != 1")
        .exhaustive()
      match<{
        a: BigUnion
        b: BigUnion
      }>({ a: "a", b: "b" })
        .with({ a: "a" }, () => 0)
        .with({ a: "b" }, () => 0)
        .with({ a: "c" }, x => 0)
        .with({ a: "d" }, () => 0)
        .with({ a: "e" }, x => 0)
        .with({ a: "f", b: P.any }, x => 0)
        .with({ a: P.any }, x => 0)
        .exhaustive()
    })
    it("should work with generics", () => {
      const last = <a>(xs: a[]) =>
        match<a[], Option<a>>(xs)
          .with([], () => none)
          .with(P.any, (x, y) => some(xs[xs.length - 1]))
          .exhaustive()
      expect(last([1, 2, 3])).toEqual(some(3))
    })
    it("should work with generics in type guards", () => {
      const map = <A, B>(
        option: Option<A>,
        mapper: (value: A) => B
      ): Option<B> =>
        match<Option<A>, Option<B>>(option)
          .when(
            (option): option is { kind: "some"; value: A } =>
              option.kind === "some",
            option => ({
              kind: "some",
              value: mapper(option.value),
            })
          )
          .when(
            (option): option is { kind: "none" } => option.kind === "none",
            option => option
          )
          .otherwise(() => ({ kind: "none" }))
      const res = map(
        { kind: "some" as const, value: 20 },
        x => `number is ${x}`
      )
      type t = Expect<Equal<typeof res, Option<string>>>
      expect(res).toEqual({ kind: "some" as const, value: `number is 20` })
    })
    it("should work with inputs of varying shapes", () => {
      type Input = { type: "test" } | ["hello", Option<string>] | "hello"[]
      const input = { type: "test" } as Input
      expect(
        match(input)
          .with(["hello", { kind: "some" }], ([, { value }]) => {
            return value
          })
          .with(["hello"], ([str]) => {
            return str
          })
          .with({ type: P.any }, x => x.type)
          .with(P.array(P.any), x => {
            type t = Expect<
              Equal<typeof x, "hello"[] | ("hello" | Option<string>)[]>
            >
            return `("hello" | Option<string>)[] | "hello"[]`
          })
          .exhaustive()
      ).toEqual("test")
    })
    it("should infer literals as literal types", () => {
      type Input = { type: "video"; duration: number }
      match<Input>({ type: "video", duration: 10 })
        .with({ type: "video", duration: 10 }, x => "")
        // @ts-expect-error
        .exhaustive()
      let n: number = 10
      match<number>(n)
        .with(10, x => "")
        // @ts-expect-error
        .exhaustive()
    })
    it("should correctly exclude cases if when pattern contains a type guard", () => {
      match<{ x: 1 | 2 | 3 }>({ x: 2 })
        .with({ x: P.when((x): x is 1 => x === 1) }, x => {
          type t = Expect<Equal<typeof x, { x: 1 }>>
          return ""
        })
        .with({ x: P.when((x): x is 2 => x === 2) }, x => {
          type t = Expect<Equal<typeof x, { x: 2 }>>
          return ""
        })
        .with({ x: P.when((x): x is 3 => x === 3) }, x => {
          type t = Expect<Equal<typeof x, { x: 3 }>>
          return ""
        })
        .exhaustive()
    })
    it("should correctly exclude cases if .when is a type guard", () => {
      match<Option<string>, Option<number>>({ kind: "none" })
        .when(
          (option): option is { kind: "some"; value: string } =>
            option.kind === "some",
          option => ({
            kind: "some",
            value: option.value.length,
          })
        )
        .when(
          (option): option is { kind: "none" } => option.kind === "none",
          option => option
        )
        .exhaustive()
    })
    it("should correctly exclude cases if the pattern is a literal type", () => {
      const input = { kind: "none" } as Option<string>
      match(input)
        .with({ kind: "some", value: "hello" }, option => "")
        .with({ kind: "none" }, option => "")
        // @ts-expect-error: handled { kind: 'some', value: string }
        .exhaustive()
      match(input)
        .with({ kind: "some", value: "hello" }, option => "")
        .with({ kind: "none" }, option => "")
        .with({ kind: "some" }, option => "")
        .exhaustive()
    })
    it("should not exclude cases if the pattern is a literal type and the value is not", () => {
      match({ x: 2 })
        .with({ x: 2 }, ({ x }) => {
          type t = Expect<Equal<typeof x, number>>
          return ""
        })
        // @ts-expect-error
        .exhaustive()
      match<1 | 2 | 3>(2)
        .with(2, x => {
          type t = Expect<Equal<typeof x, 2>>
          return ""
        })
        // @ts-expect-error
        .exhaustive()
      match<1 | 2 | 3>(2)
        .with(1, x => {
          type t = Expect<Equal<typeof x, 1>>
          return ""
        })
        .with(2, x => {
          type t = Expect<Equal<typeof x, 2>>
          return ""
        })
        .with(3, x => {
          type t = Expect<Equal<typeof x, 3>>
          return ""
        })
        .exhaustive()
    })
  })
  it("real world example", () => {
    type Input =
      | { type: "text"; text: string; author: { name: string } }
      | { type: "video"; duration: number; src: string }
      | {
          type: "movie"
          duration: number
          author: { name: string }
          src: string
          title: string
        }
      | { type: "picture"; src: string }
    const isNumber = (x: unknown): x is number => typeof x === "number"
    match<Input>({ type: "text", text: "Hello", author: { name: "Gabriel" } })
      .with(
        {
          type: "text",
          text: P.select("text"),
          author: { name: P.select("authorName") },
        },
        ({ text, authorName }) => `${text} from ${authorName}`
      )
      .with({ type: "video", duration: P.when(x => x > 10) }, () => "")
      .with(
        {
          type: "video",
          duration: P.when(isNumber),
        },
        () => ""
      )
      .with({ type: "movie", duration: 10 }, () => "")
      .with(
        {
          type: "movie",
          duration: 10,
          author: P.select("author"),
          title: P.select("title"),
        },
        ({ author, title }) => ""
      )
      .with({ type: "picture" }, () => "")
      .with({ type: "movie", duration: P.when(isNumber) }, () => "")
      .exhaustive()
  })
  it("reducer example", () => {
    const initState: State = {
      status: "idle",
    }
    const reducer = (state: State, event: Event): State =>
      match<[State, Event], State>([state, event])
        .with(
          [{ status: "loading" }, { type: "success", data: P.select() }],
          data => ({ status: "success", data })
        )
        .with(
          [{ status: "loading" }, { type: "error", error: P.select() }],
          error => ({ status: "error", error })
        )
        .with([{ status: "loading" }, { type: "cancel" }], () => initState)
        .with([{ status: P.not("loading") }, { type: "fetch" }], value => ({
          status: "loading",
        }))
        .with(P._, () => state)
        .exhaustive()
  })
  it("select should always match", () => {
    type Input = { type: 3; data: number }
    const input = { type: 3, data: 2 } as Input
    match<Input>(input)
      .with({ type: 3, data: P.select() }, data => {
        type t = Expect<Equal<typeof data, number>>
        return 3
      })
      .exhaustive()
    type Input2 = { type: 3; data: true } | 2
    match<Input2>(2)
      .with({ type: 3, data: P.select() }, data => {
        type t = Expect<Equal<typeof data, true>>
        return 3
      })
      .with(2, () => 2)
      .exhaustive()
  })
  describe("Exhaustive match and `not` patterns", () => {
    it("should work with a single not pattern", () => {
      const reducer1 = (state: State, event: Event): State =>
        match<[State, Event], State>([state, event])
          .with([{ status: P.not("loading") }, P.any], x => state)
          .with([{ status: "loading" }, { type: "fetch" }], () => state)
          // @ts-expect-error
          .exhaustive()
      const reducer3 = (state: State, event: Event): State =>
        match<[State, Event], State>([state, event])
          .with([{ status: P.not("loading") }, P.any], x => state)
          .with([{ status: "loading" }, P.any], () => state)
          .exhaustive()
    })
    it("should work with several not patterns", () => {
      const reducer = (state: State, event: Event): State =>
        match<[State, Event], State>([state, event])
          .with(
            [{ status: P.not("loading") }, { type: P.not("fetch") }],
            x => state
          )
          .with([{ status: "loading" }, { type: P.any }], () => state)
          .with([{ status: P.any }, { type: "fetch" }], () => state)
          .exhaustive()
      const f = (input: readonly [1 | 2 | 3, 1 | 2 | 3, 1 | 2 | 3]) =>
        match(input)
          .with([P.not(1), P.not(1), P.not(1)], x => "ok")
          .with([1, P._, P._], () => "ok")
          .with([P._, 1, P._], () => "ok")
          .with([P._, P._, 1], () => "ok")
          .exhaustive()
      const range = [1, 2, 3] as const
      const flatMap = <A, B>(
        xs: readonly A[],
        f: (x: A) => readonly B[]
      ): B[] => xs.reduce<B[]>((acc, x) => acc.concat(f(x)), [])
      const allPossibleCases = flatMap(range, x =>
        flatMap(range, y => flatMap(range, z => [[x, y, z]] as const))
      )
      allPossibleCases.forEach(x => expect(f(x)).toBe("ok"))
      const f2 = (input: [1 | 2 | 3, 1 | 2 | 3, 1 | 2 | 3]) =>
        match(input)
          .with([P.not(1), P.not(1), P.not(1)], x => "ok")
          .with([1, P.any, P.any], () => "ok")
          .with([P.any, 1, P.any], () => "ok")
          // @ts-expect-error : NonExhaustiveError<[3, 3, 1] | [3, 2, 1] | [2, 3, 1] | [2, 2, 1]>
          .exhaustive()
    })
    it("should work with not patterns and lists", () => {
      const f = (input: (1 | 2 | 3)[]) =>
        match(input)
          .with([P.not(1)], x => "ok")
          .with([1], x => "ok")
          // @ts-expect-error: NonExhaustiveError<(1 | 2 | 3)[]>, because lists can be heterogenous
          .exhaustive()
    })
  })
  describe("exhaustive and any", () => {
    const f = (input: { t: "a"; x: any } | { t: "b" }) =>
      match(input)
        .with({ t: "a" }, x => {
          type t = Expect<Equal<typeof x, { t: "a"; x: any }>>
          return "ok"
        })
        .with({ t: "b" }, x => "ok")
        .exhaustive()
    const f2 = (input: { t: "a"; x: any } | { t: "b" }) =>
      match(input)
        .with({ t: "a", x: "hello" }, x => "ok")
        .with({ t: "b" }, x => "ok")
        // @ts-expect-error
        .exhaustive()
    const f3 = (input: { t: "a"; x: any } | { t: "b" }) =>
      match(input)
        .with({ t: "a", x: P.any }, x => "ok")
        .with({ t: "b" }, x => "ok")
        .exhaustive()
  })
  describe("issue #44", () => {
    it("shouldn't exclude cases if the pattern contains unknown keys", () => {
      type Person = {
        sex: "a" | "b"
        age: "c" | "d"
      }
      function withTypo(person: Person) {
        return (
          match(person)
            //   this pattern contains an addition unknown key
            .with({ sex: "b", oopsThisIsATypo: "c" }, x => {
              // The unknown key should be added to the object type
              type t = Expect<
                Equal<
                  typeof x,
                  {
                    age: "c" | "d"
                    sex: "b"
                    oopsThisIsATypo: string
                  }
                >
              >
              return 1
            })
            // those are correct
            .with({ sex: "b", age: "d" }, () => 2)
            .with({ sex: "a", age: "c" }, () => 3)
            .with({ sex: "a", age: "d" }, () => 4)
            // this pattern shouldn't be considered exhaustive
            // @ts-expect-error
            .exhaustive()
        )
      }
      function withoutTypo(person: Person) {
        return (
          match(person)
            .with({ sex: "b", age: "c" }, x => 1)
            .with({ sex: "b", age: "d" }, () => 2)
            .with({ sex: "a", age: "c" }, () => 3)
            .with({ sex: "a", age: "d" }, () => 4)
            // this should be ok
            .exhaustive()
        )
      }
      expect(() => withTypo({ sex: "b", age: "c" })).toThrow()
      expect(withoutTypo({ sex: "b", age: "c" })).toBe(1)
    })
  })
})
import { ExtractPreciseValue } from "../src/types/ExtractPreciseValue"
import { Expect, Equal, LeastUpperBound } from "../src/types/helpers"
import { ToExclude } from "../src/types/Pattern"
import { Event, Option, State } from "./types-catalog/utils"
describe("ExtractPreciseValue", () => {
  it("should correctly extract the matching value from the input and an inverted pattern", () => {
    type cases = [
      Expect<
        Equal<
          ExtractPreciseValue<
            { type: "test" } | ["hello", Option<string>] | "hello"[],
            ["hello", { kind: "some" }]
          >,
          ["hello", { kind: "some"; value: string }]
        >
      >,
      Expect<
        Equal<
          ExtractPreciseValue<
            | { type: "a"; message: string }
            | { type: "b"; count: number }
            | { type: "c"; count: number },
            { count: number }
          >,
          { type: "b"; count: number } | { type: "c"; count: number }
        >
      >,
      Expect<
        Equal<
          ExtractPreciseValue<
            | {
                type: "a"
                x: { type: "b"; count: number } | { type: "c"; count: number }
                y: "other"
              }
            | { type: "b"; count: number }
            | { type: "c"; count: number },
            { type: "a"; x: { type: "b" } }
          >,
          {
            type: "a"
            x: { type: "b"; count: number }
            y: "other"
          }
        >
      >,
      Expect<
        Equal<
          ExtractPreciseValue<
            | {
                type: "a"
                x:
                  | { type: "b"; count: number }
                  | { type: "c"; count: number }
                  | { type: "d" }
                y: "other"
              }
            | { type: "b"; count: number }
            | { type: "c"; count: number },
            { type: "a"; x: { count: number } }
          >,
          {
            type: "a"
            x: { type: "b"; count: number } | { type: "c"; count: number }
            y: "other"
          }
        >
      >
    ]
  })
  it("should use the type of the pattern if the input is any or never", () => {
    type cases = [
      Expect<
        Equal<
          ExtractPreciseValue<any, ["hello", { kind: "some" }]>,
          ["hello", { kind: "some" }]
        >
      >
    ]
  })
  it("should return the input type when pattern is unknown", () => {
    type cases = [
      Expect<
        Equal<
          ExtractPreciseValue<[State, Event], [unknown, unknown]>,
          [State, Event]
        >
      >
    ]
  })
  it("should return the correct branch a union based on the pattern", () => {
    type cases = [
      Expect<
        Equal<
          ExtractPreciseValue<
            { a: string; b: number } | [boolean, number],
            readonly [true, 2]
          >,
          [true, 2]
        >
      >,
      Expect<
        Equal<
          ExtractPreciseValue<
            | {
                type: "img"
                src: string
              }
            | {
                type: "text"
                p: string
              }
            | {
                type: "video"
                src: number
              }
            | {
                type: "gif"
                p: string
              }
            | undefined,
            {
              type: "video"
              src: unknown
            }
          >,
          {
            type: "video"
            src: number
          }
        >
      >
    ]
  })
  it("should support readonly input types", () => {
    type cases = [
      Expect<
        Equal<
          ExtractPreciseValue<
            { readonly a: string; b: number } | [boolean, number],
            readonly [true, 2]
          >,
          [true, 2]
        >
      >,
      Expect<
        Equal<
          ExtractPreciseValue<
            { readonly a: string; b: number } | [boolean, number],
            { b: number }
          >,
          { readonly a: string; b: number }
        >
      >,
      Expect<
        Equal<
          ExtractPreciseValue<
            { readonly a: string; b: number } | [boolean, number],
            { readonly a: string }
          >,
          { readonly a: string; b: number }
        >
      >
    ]
  })
  it("should work if the input type contains anys", () => {
    type Input = { t: "a"; data: "string"; x: any } | { t: "b" }
    type cases = [
      Expect<
        Equal<
          ExtractPreciseValue<Input, { t: "a" }>,
          { t: "a"; data: "string"; x: any }
        >
      >,
      Expect<Equal<ExtractPreciseValue<Input, { t: "b" }>, { t: "b" }>>,
      Expect<
        Equal<
          ExtractPreciseValue<[string | number, any], [string, unknown]>,
          [string, any]
        >
      >,
      Expect<
        Equal<
          ExtractPreciseValue<[number, any] | ["t", 2], ["t", unknown]>,
          ["t", 2]
        >
      >,
      Expect<
        Equal<
          ExtractPreciseValue<
            [
              { t: "a" } | { t: "b"; data: any },
              { t: "a"; x: boolean } | { t: "b" }
            ],
            [{ t: "b" }, { t: "a" }]
          >,
          [{ t: "b"; data: any }, { t: "a"; x: boolean }]
        >
      >
    ]
  })
  it("should work with arrays", () => {
    type cases = [
      Expect<
        Equal<
          ExtractPreciseValue<boolean | { type: string } | string[], string[]>,
          string[]
        >
      >
    ]
  })
  describe("Optional properties", () => {
    it("should pick the input type as the upper bound, even if it is assignable to the pattern type", () => {
      // This happens if the input type only has optional properties
      type Input =
        | { type: "test"; id?: string }
        | { type: "test2"; id?: string; otherProp: string }
        | { type: "test3"; id?: string; otherProp?: string }
      type cases = [
        Expect<
          Equal<
            ExtractPreciseValue<Input, { type: "test" }>,
            { type: "test"; id?: string }
          >
        >,
        Expect<
          Equal<
            ExtractPreciseValue<
              Input,
              { type: "test"; id: ToExclude<undefined> }
            >,
            { type: "test"; id: string }
          >
        >,
        Expect<
          Equal<
            ExtractPreciseValue<Input, { type: "test2" }>,
            { type: "test2"; id?: string; otherProp: string }
          >
        >,
        Expect<
          Equal<
            ExtractPreciseValue<Input, { type: "test3" }>,
            { type: "test3"; id?: string; otherProp?: string }
          >
        >
      ]
    })
    it("should keep optional properties if they are optional on both `a` and `b`", () => {
      type Input =
        | {
            type: "a"
            data?: { type: "img"; src: string } | { type: "text"; p: string }
          }
        | {
            type: "b"
            data?: { type: "video"; src: number } | { type: "gif"; p: string }
          }
      type cases = [
        Expect<
          Equal<
            ExtractPreciseValue<
              Input,
              {
                type: "a"
                data?: { type: "img" } | undefined
              }
            >,
            {
              type: "a"
              data?: { type: "img"; src: string } | undefined
            }
          >
        >,
        Expect<
          Equal<
            ExtractPreciseValue<
              { data: { type?: "a"; value: number } },
              { data: { type?: "a" } }
            >,
            { data: { type?: "a"; value: number } }
          >
        >
      ]
    })
  })
  describe("Branded strings", () => {
    it("Type narrowing should correctly work on branded strings", () => {
      // Branded strings is a commonly used way of implementing
      // nominal types in typescript.
      type BrandedId = string & { __brand: "brandId" }
      type FooBar =
        | { type: "foo"; id: BrandedId; value: string }
        | { type: "bar" }
      type cases = [
        Expect<
          Equal<
            ExtractPreciseValue<
              {
                fooBar: FooBar
                fooBarId: BrandedId
              },
              {
                fooBar: { type: "foo" }
                fooBarId: BrandedId
              }
            >,
            {
              fooBar: {
                type: "foo"
                id: BrandedId
                value: string
              }
              fooBarId: BrandedId
            }
          >
        >
      ]
    })
  })
  describe("class instances", () => {
    it("Type narrowing should correctly work on class instances", () => {
      class A {
        a = "a"
      }
      class B {
        b = "b"
      }
      type cases = [Expect<Equal<ExtractPreciseValue<A | B, A>, A>>]
    })
    it("issue #63: it should correctly narrow Error subclasses", () => {
      class FooError extends Error {
        foo = "bar"
      }
      class BazError extends Error {
        baz = "bil"
      }
      class ErrorWithOptionalKeys1 extends Error {
        foo?: string
      }
      class ErrorWithOptionalKeys2 extends Error {
        baz?: string
      }
      type cases = [
        Expect<
          Equal<
            ExtractPreciseValue<FooError | BazError | Error, FooError>,
            FooError
          >
        >,
        Expect<
          Equal<
            ExtractPreciseValue<
              | ErrorWithOptionalKeys1
              | ErrorWithOptionalKeys2
              | ErrorWithOptionalKeys1,
              ErrorWithOptionalKeys1
            >,
            ErrorWithOptionalKeys1
          >
        >
      ]
    })
  })
})
import * as symbols from "../src/internals/symbols"
import {
  FindSelected,
  MixedNamedAndAnonymousSelectError,
  SeveralAnonymousSelectError,
} from "../src/types/FindSelected"
import { Equal, Expect } from "../src/types/helpers"
import { Matcher, SelectP, NotP, OptionalP, ArrayP } from "../src/types/Pattern"
import { Event, State } from "./types-catalog/utils"
type AnonymousSelectP = SelectP<symbols.anonymousSelectKey>
describe("FindSelected", () => {
  describe("should correctly return kwargs", () => {
    it("Tuples", () => {
      type cases = [
        Expect<
          Equal<
            FindSelected<
              { a: { b: { c: [3] } } },
              {
                a: {
                  b: {
                    c: [SelectP<"c">]
                  }
                }
              }
            >,
            { c: 3 }
          >
        >,
        Expect<
          Equal<
            FindSelected<[State, Event], [SelectP<"state">, SelectP<"event">]>,
            { state: State; event: Event }
          >
        >,
        Expect<
          Equal<
            FindSelected<
              [1, 2, 3],
              [SelectP<"first">, SelectP<"second">, SelectP<"third">]
            >,
            { first: 1; second: 2; third: 3 }
          >
        >,
        Expect<
          Equal<
            FindSelected<
              [1, 2, 3, 4],
              [SelectP<"1">, SelectP<"2">, SelectP<"3">, SelectP<"4">]
            >,
            { "1": 1; "2": 2; "3": 3; "4": 4 }
          >
        >,
        Expect<
          Equal<
            FindSelected<
              [1, 2, 3, 4, 5],
              [
                SelectP<"1">,
                SelectP<"2">,
                SelectP<"3">,
                SelectP<"4">,
                SelectP<"5">
              ]
            >,
            { "1": 1; "2": 2; "3": 3; "4": 4; "5": 5 }
          >
        >
      ]
    })
    it("list selections should be wrapped in arrays", () => {
      type cases = [
        Expect<
          Equal<
            FindSelected<State[], ArrayP<unknown, SelectP<"state">>>,
            { state: State[] }
          >
        >,
        Expect<
          Equal<
            FindSelected<
              State[][],
              ArrayP<unknown, ArrayP<unknown, SelectP<"state">>>
            >,
            { state: State[][] }
          >
        >,
        Expect<
          Equal<
            FindSelected<
              State[][][],
              ArrayP<
                unknown,
                ArrayP<unknown, ArrayP<unknown, SelectP<"state">>>
              >
            >,
            { state: State[][][] }
          >
        >
      ]
    })
    it("Objects", () => {
      type cases = [
        Expect<
          Equal<
            FindSelected<
              { a: { b: { c: 3 } } },
              { a: { b: { c: SelectP<"c"> } } }
            >,
            { c: 3 }
          >
        >,
        Expect<
          Equal<
            FindSelected<
              { a: { b: { c: 3 }; d: { e: 7 } } },
              {
                a: {
                  b: { c: SelectP<"c"> }
                  d: { e: SelectP<"e"> }
                }
              }
            >,
            { c: 3; e: 7 }
          >
        >
      ]
    })
    it("Mixed", () => {
      type cases = [
        Expect<
          Equal<
            FindSelected<
              { a: { b: { c: [3, 4] } } },
              { a: { b: { c: [SelectP<"c">, unknown] } } }
            >,
            { c: 3 }
          >
        >,
        Expect<
          Equal<
            FindSelected<
              { a: [{ c: 3 }, { e: 7 }]; b: { d: string }[] },
              {
                a: [{ c: SelectP<"c"> }, { e: 7 }]
                b: Matcher<unknown, { d: SelectP<"d"> }, "array">
              }
            >,
            { c: 3; d: string[] }
          >
        >
      ]
    })
  })
  describe("Anonymous selections", () => {
    it("should correctly return a positional argument", () => {
      type cases = [
        Expect<
          Equal<
            FindSelected<
              { a: [{ c: 3 }, { e: 7 }]; b: { d: string }[] },
              {
                a: [{ c: AnonymousSelectP }, { e: 7 }]
              }
            >,
            3
          >
        >
      ]
    })
    it("should return an error when trying to use several anonymous select", () => {
      type cases = [
        Expect<
          Equal<
            FindSelected<
              { a: [{ c: 3 }, { e: 7 }]; b: { d: string }[] },
              {
                a: [{ c: AnonymousSelectP }, { e: AnonymousSelectP }]
              }
            >,
            SeveralAnonymousSelectError
          >
        >,
        Expect<
          Equal<
            FindSelected<
              { a: [{ c: 3 }, { e: 7 }]; b: { d: string }[] },
              {
                a: [unknown, { e: AnonymousSelectP }]
                b: AnonymousSelectP
              }
            >,
            SeveralAnonymousSelectError
          >
        >,
        Expect<
          Equal<
            FindSelected<
              [{ c: 3 }, { e: 7 }],
              [{ c: AnonymousSelectP }, { e: AnonymousSelectP }]
            >,
            SeveralAnonymousSelectError
          >
        >,
        Expect<
          Equal<
            FindSelected<
              [{ c: 3 }, { e: 7 }],
              [AnonymousSelectP, { e: AnonymousSelectP }]
            >,
            SeveralAnonymousSelectError
          >
        >,
        Expect<
          Equal<
            FindSelected<
              [{ c: 3 }, { e: 7 }],
              [AnonymousSelectP, AnonymousSelectP]
            >,
            SeveralAnonymousSelectError
          >
        >,
        Expect<
          Equal<
            FindSelected<
              { type: "point"; x: number; y: number },
              {
                type: "point"
                x: AnonymousSelectP
                y: AnonymousSelectP
              }
            >,
            SeveralAnonymousSelectError
          >
        >
      ]
    })
    describe("Mix of named and unnamed selections", () => {
      type Input =
        | { type: "text"; text: string; author: { name: string } }
        | { type: "video"; duration: number; src: string }
        | {
            type: "movie"
            duration: number
            author: { name: string }
            src: string
            title: string
          }
        | { type: "picture"; src: string }
      type cases = [
        Expect<
          Equal<
            FindSelected<
              Input,
              {
                type: "text"
                text: AnonymousSelectP
                author: {
                  name: SelectP<"authorName">
                }
              }
            >,
            MixedNamedAndAnonymousSelectError
          >
        >
      ]
    })
    describe("No selection", () => {
      it("should return the input type", () => {
        type Input = { type: "text"; text: string; author: { name: string } }
        type cases = [
          Expect<Equal<FindSelected<Input, { type: "text" }>, Input>>,
          Expect<
            Equal<FindSelected<{ text: any }, { text: "text" }>, { text: any }>
          >,
          Expect<
            Equal<
              FindSelected<
                { text: any },
                { str: NotP<null | undefined, null | undefined> }
              >,
              { text: any }
            >
          >,
          Expect<
            Equal<
              FindSelected<{ text: unknown }, { text: "text" }>,
              { text: unknown }
            >
          >,
          Expect<
            Equal<
              FindSelected<
                { text: unknown },
                { str: NotP<null | undefined, null | undefined> }
              >,
              { text: unknown }
            >
          >
        ]
      })
      it("shouldn't change optional properties", () => {
        type p = {
          type: "a"
          data: OptionalP<
            | {
                type: "img"
                src: string
              }
            | {
                type: "text"
                p: string
              }
            | {
                type: "video"
                src: number
              }
            | {
                type: "gif"
                p: string
              }
            | undefined,
            | {
                type: "img"
              }
            | undefined
          >
        }
        type value = {
          type: "a"
          data?:
            | {
                type: "img"
                src: string
              }
            | undefined
        }
        type t = Expect<Equal<FindSelected<value, p>, value>>
      })
    })
  })
})
import { match, P } from "../src"
import { Equal, Expect } from "../src/types/helpers"
import { none, Option, some } from "./types-catalog/utils"
describe("generics", () => {
  type State<T> =
    | { t: "success"; value: T }
    | { t: "error"; error: Error }
    | { t: "loading" }
  it("should have basic support for objects containing generics", () => {
    const f = <T>(input: State<T>) => {
      return match(input)
        .with({ t: "success" }, x => {
          type t = Expect<Equal<typeof x, { t: "success"; value: T }>>
          return "success!"
        })
        .with({ t: "error" }, x => {
          type t = Expect<Equal<typeof x, { t: "error"; error: Error }>>
          return "error :("
        })
        .with({ t: "loading" }, x => {
          type t = Expect<Equal<typeof x, { t: "loading" }>>
          return "loading..."
        })
        .exhaustive()
    }
  })
  it("should have basic support for arrays containing generics", () => {
    const last = <a>(xs: a[]) =>
      match<a[], Option<a>>(xs)
        .with([], () => none)
        .with(P._, (x, y) => {
          type t = Expect<Equal<typeof x, a[]>>
          type t2 = Expect<Equal<typeof y, a[]>>
          return some(xs[xs.length - 1])
        })
        .exhaustive()
  })
  it("should have basic support for tuples containing generics", () => {
    type State<T> = { t: "success"; value: T } | { t: "error"; error: Error }
    const f = <a, b>(xs: [State<a>, State<b>]) =>
      match(xs)
        .with([{ t: "success" }, { t: "success" }], ([x, y]) => {
          type t = Expect<Equal<typeof x, { t: "success"; value: a }>>
          type t2 = Expect<Equal<typeof y, { t: "success"; value: b }>>
          return "success!"
        })
        .with([{ t: "success" }, { t: "error" }], ([x, y]) => {
          type t = Expect<Equal<typeof x, { t: "success"; value: a }>>
          type t2 = Expect<Equal<typeof y, { t: "error"; error: Error }>>
          return "success!"
        })
        .with([{ t: "error" }, P._], ([x, y]) => {
          type t = Expect<Equal<typeof x, { t: "error"; error: Error }>>
          type t2 = Expect<Equal<typeof y, State<b>>>
          return "error :("
        })
        .exhaustive()
  })
  it("Basic generic type guards (with no type level manipulation of the input) should work", () => {
    const isSuccess = <T>(x: any): x is { t: "success"; value: T } =>
      Boolean(x && typeof x === "object" && x.t === "success")
    const isDoubleSuccess = <T>(x: any): x is { t: "success"; value: [T, T] } =>
      Boolean(
        x &&
          typeof x === "object" &&
          x.t === "success" &&
          Array.isArray(x.value) &&
          x.value.length === 2
      )
    const f = <T>(input: State<[number, number] | number>) => {
      return match({ input })
        .with({ input: P.when(isSuccess) }, x => {
          type t = Expect<
            Equal<
              typeof x,
              { input: { t: "success"; value: number | [number, number] } }
            >
          >
          return "ok"
        })
        .with({ input: P.when(isDoubleSuccess) }, x => {
          type t = Expect<
            Equal<
              typeof x,
              { input: { t: "success"; value: [number, number] } }
            >
          >
          return "ok"
        })
        .otherwise(() => "nope")
    }
  })
})
import {
  Drop,
  Equal,
  ExcludeIfContainsNever,
  Expect,
  Iterator,
  LeastUpperBound,
  Take,
  IntersectObjects,
  UpdateAt,
} from "../src/types/helpers"
describe("helpers", () => {
  describe("Take", () => {
    it("should correctly return the start of a tuple", () => {
      type cases = [
        Expect<Equal<Take<[1, 2, 3], Iterator<0>>, []>>,
        Expect<Equal<Take<[1, 2, 3], Iterator<1>>, [1]>>,
        Expect<Equal<Take<[1, 2, 3], Iterator<2>>, [1, 2]>>,
        Expect<Equal<Take<[1, 2, 3], Iterator<3>>, [1, 2, 3]>>,
        Expect<Equal<Take<[1, 2, 3], Iterator<4>>, [1, 2, 3]>>
      ]
    })
    it("should correctly return the start of a readonly tuple", () => {
      type cases = [
        Expect<Equal<Take<readonly [1, 2, 3], Iterator<0>>, []>>,
        Expect<Equal<Take<readonly [1, 2, 3], Iterator<1>>, [1]>>,
        Expect<Equal<Take<readonly [1, 2, 3], Iterator<2>>, [1, 2]>>,
        Expect<Equal<Take<readonly [1, 2, 3], Iterator<3>>, [1, 2, 3]>>,
        Expect<Equal<Take<readonly [1, 2, 3], Iterator<4>>, [1, 2, 3]>>
      ]
    })
  })
  describe("Drop", () => {
    it("should correctly remove the n first elements of a tuple", () => {
      type cases = [
        Expect<Equal<Drop<[1, 2, 3], Iterator<0>>, [1, 2, 3]>>,
        Expect<Equal<Drop<[1, 2, 3], Iterator<1>>, [2, 3]>>,
        Expect<Equal<Drop<[1, 2, 3], Iterator<2>>, [3]>>,
        Expect<Equal<Drop<[1, 2, 3], Iterator<3>>, []>>,
        Expect<Equal<Drop<[1, 2, 3], Iterator<4>>, []>>
      ]
    })
    it("should correctly remove the n first elements of a readonly tuple", () => {
      type cases = [
        Expect<
          Equal<Drop<readonly [1, 2, 3], Iterator<0>>, readonly [1, 2, 3]>
        >,
        Expect<Equal<Drop<readonly [1, 2, 3], Iterator<1>>, [2, 3]>>,
        Expect<Equal<Drop<readonly [1, 2, 3], Iterator<2>>, [3]>>,
        Expect<Equal<Drop<readonly [1, 2, 3], Iterator<3>>, []>>,
        Expect<Equal<Drop<readonly [1, 2, 3], Iterator<4>>, []>>
      ]
    })
  })
  describe("UpdateAt", () => {
    type cases = [
      Expect<
        Equal<UpdateAt<readonly [1, 2, 3], Iterator<0>, true>, [true, 2, 3]>
      >,
      Expect<
        Equal<UpdateAt<readonly [1, 2, 3], Iterator<1>, true>, [1, true, 3]>
      >,
      Expect<
        Equal<UpdateAt<readonly [1, 2, 3], Iterator<2>, true>, [1, 2, true]>
      >,
      Expect<Equal<UpdateAt<readonly [1, 2, 3], Iterator<3>, true>, [1, 2, 3]>>,
      Expect<Equal<UpdateAt<readonly [1, 2, 3], Iterator<4>, true>, [1, 2, 3]>>
    ]
  })
  describe("ExcludeIfContainsNever", () => {
    it("should work with objects and tuples", () => {
      type cases = [
        Expect<
          Equal<
            ExcludeIfContainsNever<
              { kind: "some"; value: string } | { kind: never },
              { kind: "some" }
            >,
            { kind: "some"; value: string }
          >
        >,
        Expect<
          Equal<
            ExcludeIfContainsNever<
              [{ kind: "some"; value: string } | never],
              [{ kind: "some" }]
            >,
            [{ kind: "some"; value: string }]
          >
        >,
        Expect<
          Equal<
            ExcludeIfContainsNever<
              [{ kind: "some"; value: string }, never],
              [{ kind: "some" }, unknown]
            >,
            never
          >
        >
      ]
    })
  })
  describe("LeastUpperBound", () => {
    it("If both a and b extend each other, it should pick b", () => {
      class B {}
      class A extends B {}
      type t = Expect<Equal<LeastUpperBound<A | B, B>, B>>
    })
  })
  describe("IntersectObjects", () => {
    it("", () => {
      type x = IntersectObjects<
        | { k: "a"; value: number; a: string }
        | { k: "b"; value: string; b: string }
        | { k: "c"; value: number; c: string }
      >
      type t = Expect<
        Equal<
          x,
          {
            k: "a" | "b" | "c"
            value: number | string
            a: string
            b: string
            c: string
          }
        >
      >
      type t2 = Expect<
        Equal<
          IntersectObjects<
            | { k: "a"; value: number }
            | { k: "b"; value: string }
            | { k: "c"; value: number }
          >,
          {
            k: "a" | "b" | "c"
            value: number | string
          }
        >
      >
      type t3 = Expect<
        Equal<
          IntersectObjects<
            | { type: 1; data: number }
            | { type: "two"; data: string }
            | { type: 3; data: boolean }
            | { type: 4 }
          >,
          { type: 1 | "two" | 3 | 4; data: number | string | boolean }
        >
      >
    })
  })
})
import { Expect, Equal } from "../src/types/helpers"
import { match, P } from "../src"
class A {
  a = "a"
}
class B {
  b = "b"
}
describe("instanceOf", () => {
  it("should work at the top level", () => {
    const get = (x: A | B): string =>
      match(x)
        .with(P.instanceOf(A), x => {
          type t = Expect<Equal<typeof x, A>>
          return "instance of A"
        })
        .with(P.instanceOf(B), x => {
          type t = Expect<Equal<typeof x, B>>
          return "instance of B"
        })
        .exhaustive()
    expect(get(new A())).toEqual("instance of A")
    expect(get(new B())).toEqual("instance of B")
  })
  it("should work as a nested pattern", () => {
    type Input = { value: A | B }
    const input = { value: new A() }
    const output = match<Input>(input)
      .with({ value: P.instanceOf(A) }, a => {
        type t = Expect<Equal<typeof a, { value: A }>>
        return "instance of A!"
      })
      .with({ value: P.instanceOf(B) }, b => {
        type t = Expect<Equal<typeof b, { value: B }>>
        return "instance of B!"
      })
      .exhaustive()
    expect(output).toEqual("instance of A!")
  })
  it("issue #63: should work on union of errors", () => {
    class FooError extends Error {
      constructor(public foo?: string) {
        super()
      }
    }
    class BazError extends Error {
      constructor(public baz?: string) {
        super()
      }
    }
    type Input = FooError | BazError | Error
    let err: Input = new FooError("foo")
    expect(
      match<Input, string | undefined>(err)
        .with(P.instanceOf(FooError), err => err.foo)
        .with(P.instanceOf(BazError), err => err.baz)
        .otherwise(() => "nothing")
    ).toBe("foo")
  })
})
import { match, P } from "../src"
import { Equal, Expect } from "../src/types/helpers"
describe("and, and or patterns", () => {
  type A = {
    type: "a"
    value: [
      { type: "d"; value: number } | { type: "e"; value: string },
      boolean
    ]
  }
  type B = {
    type: "b"
    data: {
      some?: "thing" | "stuff" | "?"
    }
    children: Input[]
  }
  type Input = A | B
  abstract class Parent {}
  class Child1 extends Parent {
    constructor(public a?: Parent, public b?: Parent) {
      super()
    }
  }
  class Child2 extends Parent {
    constructor(public a?: Parent, public b?: Parent) {
      super()
    }
  }
  describe("or", () => {
    it("should match if one of the patterns matches", () => {
      const f = (input: Input) =>
        match(input)
          .with(
            {
              type: "a",
              value: [P.union({ type: "d" }, { type: "e" }), true],
            },
            x => {
              type t = Expect<
                Equal<
                  typeof x,
                  {
                    type: "a"
                    value: [
                      (
                        | { type: "d"; value: number }
                        | { type: "e"; value: string }
                      ),
                      true
                    ]
                  }
                >
              >
              return "branch 1"
            }
          )
          .with({ type: "a" }, x => {
            type t = Expect<Equal<typeof x, A>>
            return "branch 2"
          })
          .with(
            P.union(
              { type: "a", value: [{ type: "d" }, true] } as const,
              {
                type: "b",
              } as const
            ),
            x => {
              type t = Expect<
                Equal<
                  typeof x,
                  | B
                  | {
                      type: "a"
                      value: [{ type: "d"; value: number }, true]
                    }
                >
              >
              return "branch 3"
            }
          )
          .exhaustive()
    })
    it("unions and intersections should work on properties shared by several element in a union type", () => {
      type C = {
        type: "c"
        value:
          | { type: "d"; value: boolean }
          | { type: "e"; value: string[] }
          | { type: "f"; value: number[] }
      }
      type Input =
        | { type: "a"; value: string }
        | { type: "b"; value: number }
        | C
      const f = (input: Input) =>
        match(input)
          .with({ type: P.union("a", "b") }, x => {
            type t = Expect<
              Equal<
                typeof x,
                { type: "a"; value: string } | { type: "b"; value: number }
              >
            >
            return "branch 1"
          })
          .with({ type: "c" }, x => {
            type t = Expect<Equal<typeof x, C>>
            return "branch 2"
          })
          .exhaustive()
      const fe = (input: Input) =>
        match(input)
          .with({ type: P.union("a", "b") }, x => {
            type t = Expect<
              Equal<
                typeof x,
                { type: "a"; value: string } | { type: "b"; value: number }
              >
            >
            return "branch 1"
          })
          .with({ type: "c", value: { type: P.union("d", "e") } }, x => {
            type t = Expect<
              Equal<
                typeof x,
                {
                  type: "c"
                  value:
                    | { type: "d"; value: boolean }
                    | { type: "e"; value: string[] }
                }
              >
            >
            return "branch 2"
          })
          .with({ type: "c", value: { type: "f" } }, x => {
            type t = Expect<
              Equal<
                typeof x,
                {
                  type: "c"
                  value: { type: "f"; value: number[] }
                }
              >
            >
            return "branch 2"
          })
          // FIXME: This should work
          .exhaustive()
    })
    it("should work on any depth", () => {
      type Country = "France" | "Germany" | "Spain" | "USA"
      const input = { country: "France" } as { country: Country }
      match(input)
        .with({ country: P.union("France", "Germany", "Spain") }, x => "Europe")
        .with({ country: "USA" }, () => "America")
        .exhaustive()
    })
  })
  describe("and", () => {
    it("should match if all patterns match", () => {
      const f = (n: Parent) =>
        match(n)
          .with(
            P.intersection(P.instanceOf(Child1), {
              a: P.instanceOf(Child2),
              b: P.instanceOf(Child2),
            }),
            x => {
              type t = Expect<
                Equal<typeof x, Child1 & { a: Child2; b: Child2 }>
              >
              return "match!"
            }
          )
          .with(P.union(P.instanceOf(Child1), P.instanceOf(Child2)), x => {
            return "catchall"
          })
          .exhaustive()
      expect(f(new Child1(new Child2(), new Child2()))).toBe("match!")
      expect(f(new Child1(new Child1(), new Child2()))).toBe("catchall")
    })
    it("should consider two incompatible patterns as matching never", () => {
      const f = (n: number | string) => {
        return (
          match(n)
            .with(P.intersection(P.number, P.nullish), x => {
              return "never"
            })
            .with(P.string, () => "string")
            // @ts-expect-error NonExhaustiveError<number>
            .exhaustive()
        )
      }
      expect(() => f(20)).toThrow()
    })
  })
  describe("composition", () => {
    it("or and and should nest nicely", () => {
      const f = (n: Parent) =>
        match(n)
          .with(
            P.intersection(P.instanceOf(Child1), {
              a: P.optional(P.instanceOf(Child2)),
              b: P.instanceOf(Child2),
            }),
            x => {
              type t = Expect<
                Equal<typeof x, Child1 & { b: Child2; a?: Child2 | undefined }>
              >
              return "match!"
            }
          )
          .with(
            P.intersection(
              { a: P.instanceOf(Child1) },
              P.union(
                { a: { a: P.instanceOf(Child1), b: P.instanceOf(Child1) } },
                { b: { a: P.instanceOf(Child2), b: P.instanceOf(Child2) } }
              )
            ),
            x => {
              type t = Expect<
                Equal<
                  typeof x,
                  { a: Child1 } & (
                    | { a: { a: Child1; b: Child1 } }
                    | { b: { a: Child2; b: Child2 } }
                  )
                >
              >
              return "branch 2"
            }
          )
          .with(P.union(P.instanceOf(Child1), P.instanceOf(Child2)), () => {
            return "catchall"
          })
          .exhaustive()
      expect(f(new Child1(new Child2(), new Child2()))).toBe("match!")
      expect(f(new Child1(new Child1(), new Child2()))).toBe("catchall")
    })
    it("using a and patterns with when shouldn't consider the pattern exhaustive unless the guard function truly matches every possibilities of the input", () => {
      const f = (n: number) => {
        return (
          match(n)
            .with(
              P.intersection(
                P.number,
                P.when((n): n is never => typeof n === "number" && n > 20)
              ),
              x => {
                return "big number"
              }
            )
            // @ts-expect-error
            .exhaustive()
        )
      }
      const f2 = (n: number | string) => {
        return match(n)
          .with(
            P.intersection(
              P.any,
              P.any,
              P.when((n): n is number => typeof n === "number"),
              P.any,
              P.select()
            ),
            x => {
              type t = Expect<Equal<typeof x, number>>
              return "big number"
            }
          )
          .with(P.string, () => "string")
          .exhaustive()
      }
      const f3 = (n: number | string) => {
        return (
          match(n)
            .with(
              P.intersection(
                P.any,
                P.any,
                P.when((n): n is number => typeof n === "number"),
                P.any,
                P.select()
              ),
              x => {
                type t = Expect<Equal<typeof x, number>>
                return "big number"
              }
            )
            // @ts-expect-error: string isn't handled
            .exhaustive()
        )
      }
    })
    it("intersection should work with selects", () => {
      const f = (n: number | string) => {
        return match({ n })
          .with(
            {
              n: P.intersection(
                P.any,
                P.when((n): n is number => typeof n === "number"),
                P.any,
                P.select()
              ),
            },
            x => {
              type t = Expect<Equal<typeof x, number>>
              return x
            }
          )
          .with({ n: P.string }, () => "string")
          .exhaustive()
      }
      expect(f(20)).toEqual(20)
      expect(f("20")).toEqual("string")
    })
    it("union & intersections should work with selects", () => {
      type Input = {
        value:
          | { type: "a"; v: number }
          | { type: "b"; v: string }
          | { type: "c"; v: boolean }
      }
      const f = (input: Input) => {
        return match(input)
          .with(
            {
              value: P.intersection(
                P.select(),
                P.union({ type: "a" }, { type: "b" })
              ),
            },
            x => {
              type t = Expect<
                Equal<
                  typeof x,
                  { type: "a"; v: number } | { type: "b"; v: string }
                >
              >
              return x.type
            }
          )
          .with({ value: { type: "c" } }, () => "other")
          .exhaustive()
      }
      expect(f({ value: { type: "a", v: 20 } })).toEqual("a")
      expect(f({ value: { type: "c", v: true } })).toEqual("other")
    })
    it("unions containing selects should consider all selections optional", () => {
      type Input = {
        value:
          | { type: "a"; n: number }
          | { type: "b"; s: string }
          | { type: "c"; b: boolean }
      }
      const f = (input: Input) => {
        return match(input)
          .with(
            {
              value: P.union(
                { type: "a", n: P.select("n") },
                { type: "b", s: P.select("s") }
              ),
            },
            x => {
              type t = Expect<
                Equal<
                  typeof x,
                  {
                    n: number | undefined
                    s: string | undefined
                  }
                >
              >
              return x
            }
          )
          .with(
            {
              value: P.union({ type: "a", n: P.select() }, { type: "b" }),
            },
            x => {
              type t = Expect<Equal<typeof x, number | undefined>>
              return x
            }
          )
          .with({ value: { type: "c" } }, () => "other")
          .exhaustive()
      }
      expect(f({ value: { type: "a", n: 20 } })).toEqual({
        n: 20,
        s: undefined,
      })
      expect(f({ value: { type: "b", s: "str" } })).toEqual({
        a: undefined,
        s: "str",
      })
      expect(f({ value: { type: "c", b: true } })).toEqual("other")
    })
    it("P.not should work with unions and intersections", () => {
      type Input = {
        value:
          | { type: "a"; n: number }
          | { type: "b"; s: string }
          | { type: "c"; b: boolean }
      }
      const f = (input: Input) => {
        return match(input)
          .with({ value: P.not({ type: P.union("a", "b") }) }, x => {
            type t = Expect<
              Equal<typeof x, { value: { type: "c"; b: boolean } }>
            >
            return "not a or b"
          })
          .with({ value: P.union({ type: "a" }, { type: "b" }) }, x => {
            type t = Expect<
              Equal<
                typeof x,
                { value: { type: "a"; n: number } | { type: "b"; s: string } }
              >
            >
            return "a or b"
          })
          .exhaustive()
      }
      expect(f({ value: { type: "b", s: "str" } })).toEqual("a or b")
      expect(f({ value: { type: "c", b: true } })).toEqual("not a or b")
    })
    it("P.array should work with unions and intersections", () => {
      type Input = {
        value: (
          | { type: "a"; n: number }
          | { type: "b"; s: string }
          | { type: "c"; b: boolean }
        )[]
      }
      const f = (input: Input) => {
        return match(input)
          .with({ value: P.array({ type: P.union("a", "b") }) }, x => {
            type t = Expect<
              Equal<
                typeof x,
                {
                  value: ({ type: "a"; n: number } | { type: "b"; s: string })[]
                }
              >
            >
            return x.value.map(x => x.type).join(",")
          })
          .with(
            { value: P.array(P.union({ type: "a" }, { type: "b" })) },
            x => {
              type t = Expect<
                Equal<
                  typeof x,
                  {
                    value: (
                      | { type: "a"; n: number }
                      | { type: "b"; s: string }
                    )[]
                  }
                >
              >
              return x.value.map(x => x.type).join(",")
            }
          )
          .with({ value: P.array(P.any) }, () => "other")
          .exhaustive()
      }
      expect(
        f({
          value: [
            { type: "b", s: "str" },
            { type: "a", n: 2 },
          ],
        })
      ).toEqual("b,a")
      expect(
        f({
          value: [
            { type: "a", n: 2 },
            { type: "c", b: true },
          ],
        })
      ).toEqual("other")
    })
    it("Composing P.union and P.array should work on union of arrays", () => {
      type Input = {
        value:
          | { type: "a"; n: number }[]
          | { type: "b"; s: string }[]
          | { type: "c"; b: boolean }[]
      }
      const f = (input: Input) => {
        return match(input)
          .with({ value: P.array({ type: P.union("a", "b") }) }, x => {
            type t = Expect<
              Equal<
                typeof x,
                {
                  value: { type: "a"; n: number }[] | { type: "b"; s: string }[]
                }
              >
            >
            return x.value[0].type
          })
          .with(
            { value: P.array(P.union({ type: "a" }, { type: "b" })) },
            x => {
              type t = Expect<
                Equal<
                  typeof x,
                  {
                    value:
                      | { type: "a"; n: number }[]
                      | { type: "b"; s: string }[]
                  }
                >
              >
              return x.value[0].type
            }
          )
          .with({ value: P.array(P.any) }, () => "other")
          .exhaustive()
      }
      expect(
        f({
          value: [
            { type: "b", s: "str" },
            { type: "b", s: "2" },
          ],
        })
      ).toEqual("b")
      expect(
        f({
          value: [
            { type: "a", n: 2 },
            { type: "a", n: 3 },
          ],
        })
      ).toEqual("a")
    })
    it("Composing P.union and P.array should work on union of objects containing arrays", () => {
      type Input =
        | {
            value: { type: "a"; n: number }[]
          }
        | {
            value: { type: "b"; s: string }[]
          }
        | {
            value: { type: "c"; b: boolean }[]
          }
      const f = (input: Input) => {
        return (
          match(input)
            .with(
              { value: P.array(P.union({ type: "a" }, { type: "b" })) },
              x => {
                type t = Expect<
                  Equal<
                    typeof x,
                    | {
                        value: { type: "a"; n: number }[]
                      }
                    | {
                        value: { type: "b"; s: string }[]
                      }
                  >
                >
                return x.value[0].type
              }
            )
            // @ts-expect-error FIXME this should work
            .with({ value: P.array({ type: P.union("a", "b") }) }, x => {})
            .with(
              {
                value: P.array({ type: P.typed<"a" | "b">().union("a", "b") }),
              },
              x => {
                type t = Expect<
                  Equal<
                    typeof x,
                    | {
                        value: { type: "a"; n: number }[]
                      }
                    | {
                        value: { type: "b"; s: string }[]
                      }
                  >
                >
                return x.value[0].type
              }
            )
            .with({ value: P.array(P.any) }, () => "other")
            .exhaustive()
        )
      }
      expect(
        f({
          value: [
            { type: "b", s: "str" },
            { type: "b", s: "2" },
          ],
        })
      ).toEqual("b")
      expect(
        f({
          value: [
            { type: "a", n: 2 },
            { type: "a", n: 3 },
          ],
        })
      ).toEqual("a")
    })
    it("P.optional should work with unions and intersections", () => {
      type Input = {
        value?:
          | { type: "a"; n: number }
          | { type: "b"; s: string }
          | { type: "c"; b: boolean }
      }
      const f = (input: Input) => {
        return match(input)
          .with(
            { value: P.optional(P.union({ type: "a" }, { type: "b" })) },
            x => {
              type t = Expect<
                Equal<
                  typeof x,
                  {
                    value?:
                      | { type: "a"; n: number }
                      | { type: "b"; s: string }
                      | undefined
                  }
                >
              >
              return "maybe a or b"
            }
          )
          .with({ value: { type: "c" } }, x => {
            type t = Expect<
              Equal<typeof x, { value: { type: "c"; b: boolean } }>
            >
            return "c"
          })
          .exhaustive()
      }
      expect(f({ value: { type: "a", n: 20 } })).toEqual("maybe a or b")
      expect(f({ value: { type: "b", s: "str" } })).toEqual("maybe a or b")
      expect(f({})).toEqual("maybe a or b")
      expect(f({ value: { type: "c", b: true } })).toEqual("c")
    })
  })
  it("unknown input", () => {
    match<unknown>({})
      .with(
        // It would be nice if as const wasn't necessary with unknown inputs
        { a: P.optional(P.union("hello" as const, "bonjour" as const)) },
        x => {
          type t = Expect<
            Equal<typeof x, { a?: "hello" | "bonjour" | undefined }>
          >
          return "ok"
        }
      )
      .otherwise(() => "ko")
  })
  it("Should work with P.typed()", () => {
    class A {
      constructor(public foo: "bar" | "baz") {}
    }
    class B {
      constructor(public str: string) {}
    }
    const f = (input: A | B) =>
      match(input)
        .with(
          P.typed<A | B>().intersection(P.instanceOf(A), { foo: "bar" }),
          // prop: A & { foo: 'bar' }
          prop => {
            type t = Expect<Equal<typeof prop, A & { foo: "bar" }>>
            return "branch 1"
          }
        )
        .with(
          P.typed<A | B>().intersection(P.instanceOf(A), { foo: "baz" }),
          // prop: A & { foo: 'baz' }
          prop => {
            type t = Expect<Equal<typeof prop, A & { foo: "baz" }>>
            return "branch 2"
          }
        )
        .with(
          P.instanceOf(B),
          // prop: B
          prop => {
            type t = Expect<Equal<typeof prop, B>>
            return "branch 3"
          }
        )
        .exhaustive()
  })
})
import { Equal, Expect } from "../src/types/helpers"
import { InvertPatternForExclude } from "../src/types/InvertPattern"
import { Matcher } from "../src/types/Pattern"
describe("InvertPatternForExclude", () => {
  it("should correctly invert type guards", () => {
    type cases = [
      Expect<
        Equal<
          InvertPatternForExclude<
            {
              x: Matcher<1 | 2 | 3, 3>
            },
            { x: 1 | 2 | 3 }
          >,
          Readonly<{ x: 3 }>
        >
      >,
      Expect<
        Equal<
          InvertPatternForExclude<
            {
              x: Matcher<3, 3>
            },
            { x: 1 } | { x: 2 } | { x: 3 }
          >,
          Readonly<{ x: 3 } | { x: 3 } | { x: 3 }>
        >
      >
    ]
  })
  it("should work with objects", () => {
    type t = InvertPatternForExclude<
      { a: Matcher<unknown, string> },
      { a: string; b: number } | [1, 2]
    >
    type cases = [
      Expect<
        Equal<
          InvertPatternForExclude<
            { a: Matcher<unknown, string> },
            { a: string; b: number } | [1, 2]
          >,
          Readonly<{ a: string }>
        >
      >
    ]
  })
  describe("Tuples", () => {
    it("should work with tuples", () => {
      type cases = [
        Expect<
          Equal<
            InvertPatternForExclude<[1, 2], { a: string; b: number } | [1, 2]>,
            readonly [1, 2]
          >
        >
      ]
    })
    it("should return readonly tuples because both mutable and readonly are assignable to them", () => {
      type cases = [
        Expect<
          Equal<
            InvertPatternForExclude<[[[1, 2]]], { a: string } | [[[1, 2]]]>,
            readonly [readonly [readonly [1, 2]]]
          >
        >
      ]
    })
  })
  describe("optional", () => {
    type OptionalPattern<a> = Matcher<unknown, a, "optional">
    it("an optional pattern in an object should be considered an optional key", () => {
      type input = { key?: "a" | "b" }
      type pattern = { key: OptionalPattern<"a"> }
      type inverted = InvertPatternForExclude<pattern, input>
      type cases = [
        Expect<
          Equal<
            inverted,
            Readonly<{
              key?: "a" | undefined
            }>
          >
        >
      ]
    })
    it("the inverted value should be the intersection of all the inverted patterns", () => {
      type x = InvertPatternForExclude<
        { type2: "c"; data: OptionalPattern<"f"> },
        { type: "a" | "b"; type2: "c" | "d"; data?: "f" | "g" }
      >
      type cases = [
        Expect<Equal<x, Readonly<{ type2: "c"; data?: "f" | undefined }>>>
      ]
    })
    it("an optional pattern in an object should be considered an optional key", () => {
      type input = { key?: "a" | "b" }
      type pattern = { key: OptionalPattern<"a"> }
      type inverted = InvertPatternForExclude<pattern, input>
      type cases = [
        Expect<
          Equal<
            inverted,
            Readonly<{
              key?: "a" | undefined
            }>
          >
        >
      ]
    })
  })
  describe("issue #44", () => {
    it("if the pattern contains unknown keys, inverted this pattern should keep them", () => {
      type input = { sex: "a" | "b"; age: "c" | "d" }
      type pattern = Readonly<{ sex: "a"; unknownKey: "c" }>
      type inverted = InvertPatternForExclude<pattern, input>
      type cases = [Expect<Equal<inverted, pattern>>]
    })
  })
})
import { isMatching, P } from "../src"
import { Equal, Expect } from "../src/types/helpers"
describe("isMatching", () => {
  it("should generate a type guard function from a pattern if given a single argument", () => {
    const something: unknown = {
      title: "Hello",
      author: { name: "Gabriel", age: 27 },
    }
    const isBlogPost = isMatching({
      title: P.string,
      author: { name: P.string, age: P.number },
    })
    if (isBlogPost(something)) {
      type t = Expect<
        Equal<
          typeof something,
          { title: string; author: { name: string; age: number } }
        >
      >
      expect(true).toBe(true)
    } else {
      throw new Error(
        "isMatching should have returned true but it returned false"
      )
    }
  })
  it("should act as a type guard function if given a two arguments", () => {
    const something: unknown = {
      title: "Hello",
      author: { name: "Gabriel", age: 27 },
    }
    if (
      isMatching(
        {
          title: P.string,
          author: { name: P.string, age: P.number },
        },
        something
      )
    ) {
      type t = Expect<
        Equal<
          typeof something,
          { title: string; author: { name: string; age: number } }
        >
      >
      expect(true).toBe(true)
    } else {
      throw new Error(
        "isMatching should have returned true but it returned false"
      )
    }
  })
})
import { match, P } from "../src"
import { Equal, Expect } from "../src/types/helpers"
describe("large exhaustive", () => {
  // prettier-ignore
  type LargeObject = {
    a1: number; b1: number; c1: number; d1: number; e1: number; f1: number; g1: number; h1: number; i1: number; j1: number; k1: number; l1: number; m1: number; n1: number; o1: number; p1: number; q1: number; r1: number; s1: number; t1: number; u1: number; v1: number; w1: number; x1: number; y1: number; z1: number;
    a2: number; b2: number; c2: number; d2: number; e2: number; f2: number; g2: number; h2: number; i2: number; j2: number; k2: number; l2: number; m2: number; n2: number; o2: number; p2: number; q2: number; r2: number; s2: number; t2: number; u2: number; v2: number; w2: number; x2: number; y2: number; z2: number;
    a3: number; b3: number; c3: number; d3: number; e3: number; f3: number; g3: number; h3: number; i3: number; j3: number; k3: number; l3: number; m3: number; n3: number; o3: number; p3: number; q3: number; r3: number; s3: number; t3: number; u3: number; v3: number; w3: number; x3: number; y3: number; z3: number;
};
  it("large objects", () => {
    expect(
      match<LargeObject | null>(null)
        .with(
          // prettier-ignore
          {
            a1: 0, b1: 0, c1: 0, d1: 0, e1: 0, f1: 0, g1: 0, h1: 0, i1: 0, j1: 0, k1: 0, l1: 0, m1: 0, n1: 0, o1: 0, p1: 0, q1: 0, r1: 0, s1: 0, t1: 0, u1: 0, v1: 0, w1: 0, x1: 0, y1: 0, z1: 0,
            a2: 0, b2: 0, c2: 0, d2: 0, e2: 0, f2: 0, g2: 0, h2: 0, i2: 0, j2: 0, k2: 0, l2: 0, m2: 0, n2: 0, o2: 0, p2: 0, q2: 0, r2: 0, s2: 0, t2: 0, u2: 0, v2: 0, w2: 0, x2: 0, y2: 0, z2: 0,
            a3: 0, b3: 0, c3: 0, d3: 0, e3: 0, f3: 0, g3: 0, h3: 0, i3: 0, j3: 0, k3: 0, l3: 0, m3: 0, n3: 0, o3: 0, p3: 0, q3: 0, r3: 0, s3: 0, t3: 0, u3: 0, v3: 0, w3: 0, x3: 0, y3: 0, z3: 0,
          },
          x => "match"
        )
        .with(null, () => "Null")
        .with(
          // prettier-ignore
          {
            a1: P.number, b1: P.number, c1: P.number, d1: P.number, e1: P.number, f1: P.number, g1: P.number, h1: P.number, i1: P.number, j1: P.number, k1: P.number, l1: P.number, m1: P.number, n1: P.number, o1: P.number, p1: P.number, q1: P.number, r1: P.number, s1: P.number, t1: P.number, u1: P.number, v1: P.number, w1: P.number, x1: P.number, y1: P.number, z1: P.number,
            a2: P.number, b2: P.number, c2: P.number, d2: P.number, e2: P.number, f2: P.number, g2: P.number, h2: P.number, i2: P.number, j2: P.number, k2: P.number, l2: P.number, m2: P.number, n2: P.number, o2: P.number, p2: P.number, q2: P.number, r2: P.number, s2: P.number, t2: P.number, u2: P.number, v2: P.number, w2: P.number, x2: P.number, y2: P.number, z2: P.number,
            a3: P.number, b3: P.number, c3: P.number, d3: P.number, e3: P.number, f3: P.number, g3: P.number, h3: P.number, i3: P.number, j3: P.number, k3: P.number, l3: P.number, m3: P.number, n3: P.number, o3: P.number, p3: P.number, q3: P.number, r3: P.number, s3: P.number, t3: P.number, u3: P.number, v3: P.number, w3: P.number, x3: P.number, y3: P.number, z3: P.number,
          },
          () => "nope"
        )
        .exhaustive()
    ).toBe("Null")
  })
  it("large tuple", () => {
    expect(
      match<
        [LargeObject, LargeObject, LargeObject, LargeObject, LargeObject] | null
      >(null)
        .with(
          // prettier-ignore
          [
            { 
              a1: 0, b1: 0, c1: 0, d1: 0, e1: 0, f1: 0, g1: 0, h1: 0, i1: 0, j1: 0, k1: 0, l1: 0, m1: 0, n1: 0, o1: 0, p1: 0, q1: 0, r1: 0, s1: 0, t1: 0, u1: 0, v1: 0, w1: 0, x1: 0, y1: 0, z1: 0,
              a2: 0, b2: 0, c2: 0, d2: 0, e2: 0, f2: 0, g2: 0, h2: 0, i2: 0, j2: 0, k2: 0, l2: 0, m2: 0, n2: 0, o2: 0, p2: 0, q2: 0, r2: 0, s2: 0, t2: 0, u2: 0, v2: 0, w2: 0, x2: 0, y2: 0, z2: 0,
              a3: 0, b3: 0, c3: 0, d3: 0, e3: 0, f3: 0, g3: 0, h3: 0, i3: 0, j3: 0, k3: 0, l3: 0, m3: 0, n3: 0, o3: 0, p3: 0, q3: 0, r3: 0, s3: 0, t3: 0, u3: 0, v3: 0, w3: 0, x3: 0, y3: 0, z3: 0,
            },
            { 
              a1: 0, b1: 0, c1: 0, d1: 0, e1: 0, f1: 0, g1: 0, h1: 0, i1: 0, j1: 0, k1: 0, l1: 0, m1: 0, n1: 0, o1: 0, p1: 0, q1: 0, r1: 0, s1: 0, t1: 0, u1: 0, v1: 0, w1: 0, x1: 0, y1: 0, z1: 0,
              a2: 0, b2: 0, c2: 0, d2: 0, e2: 0, f2: 0, g2: 0, h2: 0, i2: 0, j2: 0, k2: 0, l2: 0, m2: 0, n2: 0, o2: 0, p2: 0, q2: 0, r2: 0, s2: 0, t2: 0, u2: 0, v2: 0, w2: 0, x2: 0, y2: 0, z2: 0,
              a3: 0, b3: 0, c3: 0, d3: 0, e3: 0, f3: 0, g3: 0, h3: 0, i3: 0, j3: 0, k3: 0, l3: 0, m3: 0, n3: 0, o3: 0, p3: 0, q3: 0, r3: 0, s3: 0, t3: 0, u3: 0, v3: 0, w3: 0, x3: 0, y3: 0, z3: 0,
            },
            { 
              a1: 0, b1: 0, c1: 0, d1: 0, e1: 0, f1: 0, g1: 0, h1: 0, i1: 0, j1: 0, k1: 0, l1: 0, m1: 0, n1: 0, o1: 0, p1: 0, q1: 0, r1: 0, s1: 0, t1: 0, u1: 0, v1: 0, w1: 0, x1: 0, y1: 0, z1: 0,
              a2: 0, b2: 0, c2: 0, d2: 0, e2: 0, f2: 0, g2: 0, h2: 0, i2: 0, j2: 0, k2: 0, l2: 0, m2: 0, n2: 0, o2: 0, p2: 0, q2: 0, r2: 0, s2: 0, t2: 0, u2: 0, v2: 0, w2: 0, x2: 0, y2: 0, z2: 0,
              a3: 0, b3: 0, c3: 0, d3: 0, e3: 0, f3: 0, g3: 0, h3: 0, i3: 0, j3: 0, k3: 0, l3: 0, m3: 0, n3: 0, o3: 0, p3: 0, q3: 0, r3: 0, s3: 0, t3: 0, u3: 0, v3: 0, w3: 0, x3: 0, y3: 0, z3: 0,
            },
            {
              a1: 0, b1: 0, c1: 0, d1: 0, e1: 0, f1: 0, g1: 0, h1: 0, i1: 0, j1: 0, k1: 0, l1: 0, m1: 0, n1: 0, o1: 0, p1: 0, q1: 0, r1: 0, s1: 0, t1: 0, u1: 0, v1: 0, w1: 0, x1: 0, y1: 0, z1: 0,
              a2: 0, b2: 0, c2: 0, d2: 0, e2: 0, f2: 0, g2: 0, h2: 0, i2: 0, j2: 0, k2: 0, l2: 0, m2: 0, n2: 0, o2: 0, p2: 0, q2: 0, r2: 0, s2: 0, t2: 0, u2: 0, v2: 0, w2: 0, x2: 0, y2: 0, z2: 0,
              a3: 0, b3: 0, c3: 0, d3: 0, e3: 0, f3: 0, g3: 0, h3: 0, i3: 0, j3: 0, k3: 0, l3: 0, m3: 0, n3: 0, o3: 0, p3: 0, q3: 0, r3: 0, s3: 0, t3: 0, u3: 0, v3: 0, w3: 0, x3: 0, y3: 0, z3: 0,
            },
            { 
              a1: 0, b1: 0, c1: 0, d1: 0, e1: 0, f1: 0, g1: 0, h1: 0, i1: 0, j1: 0, k1: 0, l1: 0, m1: 0, n1: 0, o1: 0, p1: 0, q1: 0, r1: 0, s1: 0, t1: 0, u1: 0, v1: 0, w1: 0, x1: 0, y1: 0, z1: 0,
              a2: 0, b2: 0, c2: 0, d2: 0, e2: 0, f2: 0, g2: 0, h2: 0, i2: 0, j2: 0, k2: 0, l2: 0, m2: 0, n2: 0, o2: 0, p2: 0, q2: 0, r2: 0, s2: 0, t2: 0, u2: 0, v2: 0, w2: 0, x2: 0, y2: 0, z2: 0,
              a3: 0, b3: 0, c3: 0, d3: 0, e3: 0, f3: 0, g3: 0, h3: 0, i3: 0, j3: 0, k3: 0, l3: 0, m3: 0, n3: 0, o3: 0, p3: 0, q3: 0, r3: 0, s3: 0, t3: 0, u3: 0, v3: 0, w3: 0, x3: 0, y3: 0, z3: 0,
            }
          ],
          x => {
            type t = Expect<
              Equal<
                typeof x,
                [
                  LargeObject,
                  LargeObject,
                  LargeObject,
                  LargeObject,
                  LargeObject
                ]
              >
            >
            return "match"
          }
        )
        .with(null, () => "Null")
        .with(
          // prettier-ignore
          [
            { 
              a1: P.number, b1: P.number, c1: P.number, d1: P.number, e1: P.number, f1: P.number, g1: P.number, h1: P.number, i1: P.number, j1: P.number, k1: P.number, l1: P.number, m1: P.number, n1: P.number, o1: P.number, p1: P.number, q1: P.number, r1: P.number, s1: P.number, t1: P.number, u1: P.number, v1: P.number, w1: P.number, x1: P.number, y1: P.number, z1: P.number,
              a2: P.number, b2: P.number, c2: P.number, d2: P.number, e2: P.number, f2: P.number, g2: P.number, h2: P.number, i2: P.number, j2: P.number, k2: P.number, l2: P.number, m2: P.number, n2: P.number, o2: P.number, p2: P.number, q2: P.number, r2: P.number, s2: P.number, t2: P.number, u2: P.number, v2: P.number, w2: P.number, x2: P.number, y2: P.number, z2: P.number,
              a3: P.number, b3: P.number, c3: P.number, d3: P.number, e3: P.number, f3: P.number, g3: P.number, h3: P.number, i3: P.number, j3: P.number, k3: P.number, l3: P.number, m3: P.number, n3: P.number, o3: P.number, p3: P.number, q3: P.number, r3: P.number, s3: P.number, t3: P.number, u3: P.number, v3: P.number, w3: P.number, x3: P.number, y3: P.number, z3: P.number,
            },
            { 
              a1: P.number, b1: P.number, c1: P.number, d1: P.number, e1: P.number, f1: P.number, g1: P.number, h1: P.number, i1: P.number, j1: P.number, k1: P.number, l1: P.number, m1: P.number, n1: P.number, o1: P.number, p1: P.number, q1: P.number, r1: P.number, s1: P.number, t1: P.number, u1: P.number, v1: P.number, w1: P.number, x1: P.number, y1: P.number, z1: P.number,
              a2: P.number, b2: P.number, c2: P.number, d2: P.number, e2: P.number, f2: P.number, g2: P.number, h2: P.number, i2: P.number, j2: P.number, k2: P.number, l2: P.number, m2: P.number, n2: P.number, o2: P.number, p2: P.number, q2: P.number, r2: P.number, s2: P.number, t2: P.number, u2: P.number, v2: P.number, w2: P.number, x2: P.number, y2: P.number, z2: P.number,
              a3: P.number, b3: P.number, c3: P.number, d3: P.number, e3: P.number, f3: P.number, g3: P.number, h3: P.number, i3: P.number, j3: P.number, k3: P.number, l3: P.number, m3: P.number, n3: P.number, o3: P.number, p3: P.number, q3: P.number, r3: P.number, s3: P.number, t3: P.number, u3: P.number, v3: P.number, w3: P.number, x3: P.number, y3: P.number, z3: P.number,
            },
            { 
              a1: P.number, b1: P.number, c1: P.number, d1: P.number, e1: P.number, f1: P.number, g1: P.number, h1: P.number, i1: P.number, j1: P.number, k1: P.number, l1: P.number, m1: P.number, n1: P.number, o1: P.number, p1: P.number, q1: P.number, r1: P.number, s1: P.number, t1: P.number, u1: P.number, v1: P.number, w1: P.number, x1: P.number, y1: P.number, z1: P.number,
              a2: P.number, b2: P.number, c2: P.number, d2: P.number, e2: P.number, f2: P.number, g2: P.number, h2: P.number, i2: P.number, j2: P.number, k2: P.number, l2: P.number, m2: P.number, n2: P.number, o2: P.number, p2: P.number, q2: P.number, r2: P.number, s2: P.number, t2: P.number, u2: P.number, v2: P.number, w2: P.number, x2: P.number, y2: P.number, z2: P.number,
              a3: P.number, b3: P.number, c3: P.number, d3: P.number, e3: P.number, f3: P.number, g3: P.number, h3: P.number, i3: P.number, j3: P.number, k3: P.number, l3: P.number, m3: P.number, n3: P.number, o3: P.number, p3: P.number, q3: P.number, r3: P.number, s3: P.number, t3: P.number, u3: P.number, v3: P.number, w3: P.number, x3: P.number, y3: P.number, z3: P.number,
            },
            {
              a1: P.number, b1: P.number, c1: P.number, d1: P.number, e1: P.number, f1: P.number, g1: P.number, h1: P.number, i1: P.number, j1: P.number, k1: P.number, l1: P.number, m1: P.number, n1: P.number, o1: P.number, p1: P.number, q1: P.number, r1: P.number, s1: P.number, t1: P.number, u1: P.number, v1: P.number, w1: P.number, x1: P.number, y1: P.number, z1: P.number,
              a2: P.number, b2: P.number, c2: P.number, d2: P.number, e2: P.number, f2: P.number, g2: P.number, h2: P.number, i2: P.number, j2: P.number, k2: P.number, l2: P.number, m2: P.number, n2: P.number, o2: P.number, p2: P.number, q2: P.number, r2: P.number, s2: P.number, t2: P.number, u2: P.number, v2: P.number, w2: P.number, x2: P.number, y2: P.number, z2: P.number,
              a3: P.number, b3: P.number, c3: P.number, d3: P.number, e3: P.number, f3: P.number, g3: P.number, h3: P.number, i3: P.number, j3: P.number, k3: P.number, l3: P.number, m3: P.number, n3: P.number, o3: P.number, p3: P.number, q3: P.number, r3: P.number, s3: P.number, t3: P.number, u3: P.number, v3: P.number, w3: P.number, x3: P.number, y3: P.number, z3: P.number,
            },
            { 
              a1: P.number, b1: P.number, c1: P.number, d1: P.number, e1: P.number, f1: P.number, g1: P.number, h1: P.number, i1: P.number, j1: P.number, k1: P.number, l1: P.number, m1: P.number, n1: P.number, o1: P.number, p1: P.number, q1: P.number, r1: P.number, s1: P.number, t1: P.number, u1: P.number, v1: P.number, w1: P.number, x1: P.number, y1: P.number, z1: P.number,
              a2: P.number, b2: P.number, c2: P.number, d2: P.number, e2: P.number, f2: P.number, g2: P.number, h2: P.number, i2: P.number, j2: P.number, k2: P.number, l2: P.number, m2: P.number, n2: P.number, o2: P.number, p2: P.number, q2: P.number, r2: P.number, s2: P.number, t2: P.number, u2: P.number, v2: P.number, w2: P.number, x2: P.number, y2: P.number, z2: P.number,
              a3: P.number, b3: P.number, c3: P.number, d3: P.number, e3: P.number, f3: P.number, g3: P.number, h3: P.number, i3: P.number, j3: P.number, k3: P.number, l3: P.number, m3: P.number, n3: P.number, o3: P.number, p3: P.number, q3: P.number, r3: P.number, s3: P.number, t3: P.number, u3: P.number, v3: P.number, w3: P.number, x3: P.number, y3: P.number, z3: P.number,
            }
          ],
          () => "nope"
        )
        .exhaustive()
    ).toBe("Null")
  })
  // prettier-ignore
  type DeepObject = {
    1: { 2: { 3: { 4: {
      a: number; b: number; c: number; d: number; e: number; f: number; g: number; h: number; i: number; j: number; k: number; l: number; m: number; n: number; o: number; p: number; q: number; r: number; s: number; t: number; u: number; v: number; w: number; x: number; y: number; z: number;
    } } } }
  };
  it("deep objects", () => {
    expect(
      match<DeepObject | null>(null)
        .with(
          // prettier-ignore
          { 
            1: { 2: { 3: { 4: {
              a: 0, b: 0, c: 0, d: 0, e: 0, f: 0, g: 0, h: 0, i: 0, j: 0, k: 0, l: 0, m: 0, n: 0, o: 0, p: 0, q: 0, r: 0, s: 0, t: 0, u: 0, v: 0, w: 0, x: 0, y: 0, z: 0,
            } } } }
          },
          x => "match"
        )
        .with(null, () => "Null")
        .with(
          // prettier-ignore
          {
            1: { 2: { 3: { 4: {
              a: P.number, b: P.number, c: P.number, d: P.number, e: P.number, f: P.number, g: P.number, h: P.number, i: P.number, j: P.number, k: P.number, l: P.number, m: P.number, n: P.number, o: P.number, p: P.number, q: P.number, r: P.number, s: P.number, t: P.number, u: P.number, v: P.number, w: P.number, x: P.number, y: P.number, z: P.number, 
            } } } }
          },
          () => "nope"
        )
        .exhaustive()
    ).toBe("Null")
  })
})
import { match, P } from "../src"
import { Expect, Equal } from "../src/types/helpers"
import { Option, Blog } from "./types-catalog/utils"
describe("List ([a])", () => {
  it("should match list patterns", () => {
    let httpResult = {
      id: 20,
      title: "hellooo",
    }
    const res = match<any, Option<Blog[]>>([httpResult])
      .with([] as const, x => {
        type t = Expect<Equal<typeof x, []>>
        return { kind: "some", value: [{ id: 0, title: "LOlol" }] }
      })
      .with(P.array({ id: P.number, title: P.string }), blogs => {
        type t = Expect<Equal<typeof blogs, { id: number; title: string }[]>>
        return {
          kind: "some",
          value: blogs,
        }
      })
      .with(20, x => {
        type t = Expect<Equal<typeof x, number>>
        return { kind: "none" }
      })
      .otherwise(() => ({ kind: "none" }))
    expect(res).toEqual({ kind: "some", value: [httpResult] })
  })
  it("should work with generics", () => {
    const reverse = <T>(xs: T[]): T[] => {
      return match<T[], T[]>(xs)
        .with([], () => [])
        .with(P._, ([x, ...xs]) => [...reverse(xs), x])
        .run()
    }
    expect(reverse([1, 2, 3])).toEqual([3, 2, 1])
  })
})
import { Expect, Equal } from "../src/types/helpers"
import { match, P } from "../src"
describe("Map", () => {
  it("should match Map patterns", () => {
    const usersMap = new Map([
      ["gab", { name: "gabriel" }],
      ["angégé", { name: "angéline" }],
    ])
    const userPattern = { name: P.string }
    const res = match<Map<string, { name: string }>>(usersMap)
      .with(
        new Map([
          ["angégé" as const, userPattern],
          ["gab" as const, userPattern],
        ]),
        map => ({
          name: map.get("angégé")!.name + " " + map.get("gab")!.name,
        })
      )
      .with(
        new Map([["angégé" as const, userPattern]]),
        map => map.get("angégé")!
      )
      .with(new Map([["gab" as const, userPattern]]), map => map.get("gab")!)
      .with(P._, () => ({ name: "unknown" }))
      .run()
    type t = Expect<Equal<typeof res, { name: string }>>
    expect(res).toEqual({ name: "angéline gabriel" })
  })
})
import { match, P } from "../src"
import { Option } from "./types-catalog/utils"
import { Expect, Equal } from "../src/types/helpers"
describe("Multiple patterns", () => {
  it("should match if one of the patterns matches", () => {
    const testFn = (input: Option<number>) =>
      match(input)
        .with(
          { kind: "some", value: 2 as const },
          { kind: "some", value: 3 as const },
          { kind: "some", value: 4 as const },
          x => {
            type t = Expect<
              Equal<
                typeof x,
                | { kind: "some"; value: 2 }
                | { kind: "some"; value: 3 }
                | { kind: "some"; value: 4 }
              >
            >
            return true
          }
        )
        .with({ kind: "none" }, { kind: "some" }, x => {
          type t = Expect<
            Equal<typeof x, { kind: "some"; value: number } | { kind: "none" }>
          >
          return false
        })
        .run()
    const cases = [
      { input: { kind: "some", value: 3 }, expected: true },
      { input: { kind: "some", value: 2 }, expected: true },
      { input: { kind: "some", value: 4 }, expected: true },
      { input: { kind: "some", value: 5 }, expected: false },
      { input: { kind: "some", value: -5 }, expected: false },
    ] as const
    cases.forEach(({ input, expected }) => {
      expect(testFn(input)).toBe(expected)
    })
  })
  it("exhaustive patterns should match if one of the patterns matches", () => {
    const testFn = (input: Option<number>) =>
      match(input)
        .with(
          { kind: "some", value: 2 as const },
          { kind: "some", value: 3 as const },
          { kind: "some", value: 4 as const },
          x => {
            type t = Expect<
              Equal<
                typeof x,
                | { kind: "some"; value: 2 }
                | { kind: "some"; value: 3 }
                | { kind: "some"; value: 4 }
              >
            >
            return true
          }
        )
        .with({ kind: "none" }, { kind: "some" }, x => {
          type t = Expect<
            Equal<typeof x, { kind: "some"; value: number } | { kind: "none" }>
          >
          return false
        })
        .exhaustive()
    const cases = [
      { input: { kind: "some", value: 3 }, expected: true },
      { input: { kind: "some", value: 2 }, expected: true },
      { input: { kind: "some", value: 4 }, expected: true },
      { input: { kind: "some", value: 5 }, expected: false },
      { input: { kind: "some", value: -5 }, expected: false },
    ] as const
    cases.forEach(({ input, expected }) => {
      expect(testFn(input)).toBe(expected)
    })
  })
  it("no patterns shouldn't typecheck", () => {
    const input = { kind: "none" } as Option<number>
    match(input)
      // @ts-expect-error: Argument of type '() => false' is not assignable to parameter of type 'ExhaustivePattern<Option<number>>'
      .with(() => false)
    match(input)
      // @ts-expect-error: Argument of type '() => false' is not assignable to parameter of type 'Pattern<Option<number>>'
      .with(() => false)
    match(input)
      // @ts-expect-error: Argument of type '() => false' is not assignable to parameter of type 'ExhaustivePattern<Option<number>>'
      .with(() => false)
      .with(
        { kind: "some", value: 2 as const },
        { kind: "some", value: 3 as const },
        { kind: "some", value: 4 as const },
        x => true
      )
      .with({ kind: "none" }, { kind: "some" }, () => false)
  })
  it("should work with literal types", () => {
    type Country = "France" | "Germany" | "Spain" | "USA"
    match<Country>("France")
      .with("France", "Germany", "Spain", () => "Europe")
      .with("USA", () => "America")
      .exhaustive()
    match<Country>("Germany")
      .with("Germany", "Spain", () => "Europe")
      .with("USA", () => "America")
      // @ts-expect-error: 'France' is missing
      .exhaustive()
  })
  it("should work with nullables", () => {
    match<null | undefined>(null)
      .with(null, undefined, x => "Nullable")
      .exhaustive()
  })
  it("should work with objects", () => {
    match<{ a: string; b: number } | [1, 2]>({ a: "", b: 2 })
      .with({ a: P.string }, x => "obj")
      .with([1, 2], x => "tuple")
      .exhaustive()
    match<{ a: string; b: number } | [1, 2]>({ a: "", b: 2 })
      .with({ a: P.string }, [1, 2], x => "obj")
      .exhaustive()
  })
  it("should work with all types of input", () => {
    type Input =
      | null
      | undefined
      | number
      | string
      | boolean
      | { a: string; b: number }
      | [boolean, number]
      | Map<string, { x: number }>
      | Set<number>
    const nonExhaustive = (input: Input) =>
      match<Input>(input)
        .with(null, undefined, x => {
          type t = Expect<Equal<typeof x, null | undefined>>
          return "Nullable"
        })
        .with(P.boolean, P.number, P.string, x => {
          type t = Expect<Equal<typeof x, boolean | number | string>>
          return "primitive"
        })
        .with(
          { a: P.string },
          [true, 2],
          new Map([["key", P._]]),
          new Set([P.number]),
          x => {
            type t = Expect<
              Equal<
                typeof x,
                | { a: string; b: number }
                | [true, number]
                | Map<string, { x: number }>
                | Set<number>
              >
            >
            return "Object"
          }
        )
        .with([false, 2] as const, x => {
          type t = Expect<Equal<typeof x, [false, 2]>>
          return "[false, 2]"
        })
        .with([false, P.number] as const, x => {
          type t = Expect<Equal<typeof x, [false, number]>>
          return "[false, number]"
        })
        .with([true, P.number] as const, x => {
          type t = Expect<Equal<typeof x, [true, number]>>
          return "[true, number]"
        })
        .run()
    const exhaustive = (input: Input) =>
      match<Input>(input)
        .with(null, undefined, x => "Nullable")
        .with(P.boolean, P.number, P.string, x => "primitive")
        .with(
          { a: P.string },
          [true, 2],
          new Map([["key", P._]]),
          new Set([P.number]),
          x => "Object"
        )
        .with([false, 2], x => "[false, 2]")
        .with([false, P.number], x => "[false, number]")
        .with([true, P.number], x => "[true, number]")
        .exhaustive()
    const cases: { input: Input; expected: string }[] = [
      { input: null, expected: "Nullable" },
      { input: undefined, expected: "Nullable" },
      { input: true, expected: "primitive" },
      { input: 2, expected: "primitive" },
      { input: "string", expected: "primitive" },
      { input: { a: "hello", b: 2 }, expected: "Object" },
      { input: [true, 2], expected: "Object" },
      { input: new Map([["key", { x: 2 }]]), expected: "Object" },
      { input: new Set([2]), expected: "Object" },
      { input: [false, 2], expected: "[false, 2]" },
      { input: [false, 3], expected: "[false, number]" },
    ]
    cases.forEach(({ input, expected }) => {
      expect(nonExhaustive(input)).toEqual(expected)
      expect(exhaustive(input)).toEqual(expected)
    })
  })
  it("when 2 returned values don't match, the error should be at the second returned value", () => {
    const f = (input: { t: "a"; x: any } | { t: "b" }) =>
      match<typeof input, string>(input)
        .with({ t: "a", x: "hello" }, { t: "a" }, x => "ok")
        // @ts-expect-error
        .with({ t: "b" }, x => 2)
        .run()
  })
  it("issue #74: inference must work on every pattern in the list", () => {
    match({ a: [1, 2, 3, 4] })
      .with(
        {
          a: P.when(arr => {
            type t = Expect<Equal<typeof arr, number[]>>
            return arr.length === 4
          }),
        },
        {
          a: P.when(arr => {
            type t = Expect<Equal<typeof arr, number[]>>
            return arr.length === 4
          }),
        },
        {
          a: P.when(arr => {
            type t = Expect<Equal<typeof arr, number[]>>
            return arr.length === 4
          }),
        },
        ({ a }) => {}
      )
      .with({ a: P.array(P.number) }, () => {})
      .exhaustive()
  })
})
import { Expect, Equal } from "../src/types/helpers"
import { match, P } from "../src"
describe("Nesting", () => {
  describe("deeply nested objects", () => {
    it("should work with 4 levels of object nesting", () => {
      type Post = {
        type: "post"
        id: number
        content: { body: string; video: Video }
      }
      type Video = { type: "video"; id: number; content: { src: string } }
      const res = match<Post>({
        type: "post",
        id: 2,
        content: {
          body: "yo",
          video: { type: "video", content: { src: "" }, id: 2 },
        },
      })
        .with(
          { type: "post", content: { video: { id: 2, content: { src: "" } } } },
          x => {
            type t = Expect<Equal<typeof x, Post>>
            return 1
          }
        )
        .with(P.any, () => 1)
        .exhaustive()
      type t = Expect<Equal<typeof res, number>>
      expect(res).toEqual(1)
    })
  })
  describe("objects", () => {
    it("it should work on 2 level", () => {
      expect(
        match({ one: { two: "2", foo: 2, bar: true } })
          .with({ one: { foo: P.any, bar: P.any } }, x => x.one.bar)
          .exhaustive()
      ).toEqual(true)
    })
    it("it should work on 3 level", () => {
      expect(
        match({ one: { two: { three: "2", foo: 2, bar: true } } })
          .with(
            { one: { two: { foo: P.any, bar: P.any } } },
            x => x.one.two.bar
          )
          .exhaustive()
      ).toEqual(true)
    })
    it("it should work on 4 level", () => {
      expect(
        match({ one: { two: { three: { four: "2", foo: 2, bar: true } } } })
          .with(
            { one: { two: { three: { foo: P.any, bar: P.any } } } },
            x => x.one.two.three.bar
          )
          .exhaustive()
      ).toEqual(true)
    })
    it("it should work on 5 level", () => {
      expect(
        match({
          one: { two: { three: { four: { five: "2", foo: 2, bar: true } } } },
        })
          .with(
            { one: { two: { three: { four: { foo: P.any, bar: P.any } } } } },
            x => x.one.two.three.four.bar
          )
          .exhaustive()
      ).toEqual(true)
    })
    it("it should work on 17 level", () => {
      expect(
        match({
          // prettier-ignore
          a: { a: { a: { a: { a: { a: { a: { a: { a: {a: { a: { a: { a: { a: { a: { a: { a: { a: { a: {
            foo: 2,
            bar: true,
          }, }, }, }, }, }, }, }, }, }, }, }, }, }, }, }, }, }, },
        })
          .with(
            {
              // prettier-ignore
              a: { a: { a: { a: { a: { a: { a: { a: { a: {a: { a: { a: { a: { a: { a: { a: { a: { a: { a: {
                foo: P.any,
                bar: P.select('bar'),
              }, }, }, }, }, }, }, }, }, }, }, }, }, }, }, }, }, }, },
            },
            (_, x) => x.a.a.a.a.a.a.a.a.a.a.a.a.a.a.a.a.a.a.a.bar
          )
          .exhaustive()
      ).toEqual(true)
    })
  })
  describe("array", () => {
    it("it should work on 2 levels", () => {
      expect(
        match([{ two: "2", foo: 2, bar: true }] as const)
          .with([{ foo: P.any, bar: P.select("bar") }], ({ bar }) => bar)
          .exhaustive()
      ).toEqual(true)
    })
    it("it should work on 3 levels", () => {
      expect(
        match([[{ two: "2", foo: 2, bar: true }]] as const)
          .with([[{ foo: P.any, bar: P.select("bar") }]], ({ bar }) => bar)
          .exhaustive()
      ).toEqual(true)
    })
    it("it should work on 4 levels", () => {
      expect(
        match([[[{ two: "2", foo: 2, bar: true }]]] as const)
          .with([[[{ foo: P.any, bar: P.select("bar") }]]], ({ bar }) => bar)
          .exhaustive()
      ).toEqual(true)
    })
    it("it should work on 5 levels", () => {
      expect(
        match([[[[{ two: "2", foo: 2, bar: true }]]]] as const)
          .with([[[[{ foo: P.any, bar: P.any }]]]], ([[[[{ bar }]]]]) => bar)
          .exhaustive()
      ).toEqual(true)
    })
    it("it should work on 17 levels", () => {
      expect(
        match([
          [[[[[[[[[[[[[[[[[{ two: "2", foo: 2, bar: true }]]]]]]]]]]]]]]]]],
        ] as const)
          .with(
            // prettier-ignore
            [[[[[[[[[[[[[[[[[[{ foo: P.any, bar: P.select('bar') }]]]]]]]]]]]]]]]]]],
            ({ bar }) => bar
          )
          .exhaustive()
      ).toEqual(true)
    })
  })
})
import { Expect, Equal } from "../src/types/helpers"
import { match, P } from "../src"
import { Option } from "./types-catalog/utils"
describe("not", () => {
  it("should work at the top level", () => {
    const get = (x: unknown): string =>
      match(x)
        .with(P.not(P.number), x => {
          type t = Expect<Equal<typeof x, unknown>>
          return "not a number"
        })
        .with(P.not(P.string), x => {
          type t = Expect<Equal<typeof x, unknown>>
          return "not a string"
        })
        .run()
    expect(get(20)).toEqual("not a string")
    expect(get("hello")).toEqual("not a number")
  })
  it("should work in a nested structure", () => {
    type DS = { x: string | number; y: string | number }
    const get = (x: DS) =>
      match(x)
        .with({ y: P.number, x: P.not(P.string) }, x => {
          type t = Expect<Equal<typeof x, { x: number; y: number }>>
          return "yes"
        })
        .with(P.any, () => "no")
        .run()
    expect(get({ x: 2, y: 2 })).toEqual("yes")
    expect(get({ y: 2, x: "hello" })).toEqual("no")
  })
  it("should discriminate union types correctly", () => {
    const one = "one"
    const two = "two"
    const get = (x: "one" | "two") =>
      match(x)
        .with(P.not(one), x => {
          type t = Expect<Equal<typeof x, "two">>
          return "not 1"
        })
        .with(P.not(two), x => {
          type t = Expect<Equal<typeof x, "one">>
          return "not 2"
        })
        .run()
    expect(get("two")).toEqual("not 1")
    expect(get("one")).toEqual("not 2")
  })
  it("should discriminate union types contained in objects correctly", () => {
    const one = "one"
    const two = "two"
    const get = (x: "one" | "two") =>
      match({ key: x })
        .with({ key: P.not(one) }, x => {
          type t = Expect<Equal<typeof x, { key: "two" }>>
          return "not 1"
        })
        .with({ key: P.not(two) }, x => {
          type t = Expect<Equal<typeof x, { key: "one" }>>
          return "not 2"
        })
        .run()
    expect(get("two")).toEqual("not 1")
    expect(get("one")).toEqual("not 2")
  })
  it("should discriminate union types correctly", () => {
    type Input =
      | {
          type: "success"
        }
      | { type: "error" }
    const get = (x: Input) =>
      match(x)
        .with({ type: P.not("success") }, x => {
          type t = Expect<Equal<typeof x, { type: "error" }>>
          return "error"
        })
        .with({ type: P.not("error") }, x => {
          type t = Expect<Equal<typeof x, { type: "success" }>>
          return "success"
        })
        .exhaustive()
    expect(get({ type: "error" })).toEqual("error")
    expect(get({ type: "success" })).toEqual("success")
  })
  it("should correctly invert the type of a Matcher", () => {
    const nullable = P.when(
      (x: unknown): x is null | undefined => x === null || x === undefined
    )
    expect(
      match<{ str: string } | null>({ str: "hello" })
        .with(P.not(nullable), ({ str }) => str)
        .with(nullable, () => "")
        .exhaustive()
    ).toBe("hello")
    const untypedNullable = P.when(x => x === null || x === undefined)
    expect(
      match<{ str: string }>({ str: "hello" })
        .with(P.not(untypedNullable), ({ str }) => str)
        // @ts-expect-error
        .exhaustive()
    ).toBe("hello")
  })
  it("should correctly exclude unit types with the unit wildcard", () => {
    expect(
      match<{ str: string | null | undefined }>({ str: "hello" })
        .with({ str: P.not(P.nullish) }, ({ str }) => {
          type t = Expect<Equal<typeof str, string>>
          return str
        })
        .with({ str: P.nullish }, ({ str }) => {
          type t = Expect<Equal<typeof str, null | undefined>>
          return null
        })
        .exhaustive()
    ).toBe("hello")
  })
  it("shouldn't change a the type if its any or unknown", () => {
    expect(
      match<{ str: any }>({ str: "hello" })
        .with({ str: P.not(P.nullish) }, x => {
          type t = Expect<Equal<typeof x, { str: any }>>
          return "hello"
        })
        .otherwise(() => "no")
    ).toBe("hello")
  })
  it("should successfully exclude cases ", () => {
    const f = (
      optionalNumber: Option<{
        coords: { x: "left" | "right"; y: "top" | "bottom" }
      }>
    ) =>
      match(optionalNumber)
        .with(
          {
            type: "some",
            value: {
              coords: P.not({ x: "left" }),
            },
          },
          x => {
            type t = Expect<
              Equal<
                typeof x["value"]["coords"],
                {
                  y: "top" | "bottom"
                  x: "right"
                }
              >
            >
            return "ok"
          }
        )
        .otherwise(() => "not ok")
  })
  it("should consider the expression exhaustive if the sub pattern matches something that will never match", () => {
    expect(
      match<{ str: string }>({ str: "hello" })
        .with(P.not(2), ({ str }) => str)
        .exhaustive()
    ).toBe("hello")
    expect(() =>
      match<number>(1)
        .with(P.not(P.number), n => n)
        // @ts-expect-error
        .exhaustive()
    ).toThrow()
  })
  it("Doc example", () => {
    type Input =
      | string
      | number
      | boolean
      | { key: string }
      | string[]
      | [number, number]
    const notMatch = (value: Input) =>
      match(value)
        .with(P.not(P.string), value => `value is NOT a string: ${value}`)
        .with(P.not(P.number), value => `value is NOT a number: ${value}`)
        .with(P.not(P.boolean), value => `value is NOT a boolean: ${value}`)
        .with(
          P.not({ key: P.string }),
          value => `value is NOT an object. ${value}`
        )
        .with(
          P.not(P.array(P.string)),
          value => `value is NOT an array of strings: ${value}`
        )
        .with(
          P.not([P.number, P.number]),
          value => `value is NOT tuple of two numbers: ${value}`
        )
        .exhaustive()
    const inputs: { input: Input; expected: string }[] = [
      { input: "Hello", expected: "value is NOT a number: Hello" },
      { input: 20, expected: "value is NOT a string: 20" },
      { input: true, expected: "value is NOT a string: true" },
      {
        input: { key: "value" },
        expected: "value is NOT a string: [object Object]",
      },
      {
        input: ["bonjour", "hola"],
        expected: "value is NOT a string: bonjour,hola",
      },
      { input: [1, 2], expected: "value is NOT a string: 1,2" },
    ]
    inputs.forEach(({ input, expected }) =>
      expect(notMatch(input)).toEqual(expected)
    )
  })
})
import { Expect, Equal } from "../src/types/helpers"
import { match, P } from "../src"
describe("Numbers", () => {
  it("Should match exact numbers", () => {
    const res = match(1)
      .with(1, v => {
        type t = Expect<Equal<typeof v, 1>>
        return v * 2
      })
      .with(2, v => {
        type t = Expect<Equal<typeof v, 2>>
        return v * v
      })
      .otherwise(() => -1)
    type t = Expect<Equal<typeof res, number>>
    expect(res).toEqual(2)
  })
  it("P.number should match NaN", () => {
    const val: number | null = NaN
    const res = match(val)
      .with(P.nullish, () => "bad")
      .with(1, () => "bad")
      .with(P.number, () => "good")
      .exhaustive()
    expect(res).toEqual("good")
  })
  it("NaN should match NaN specially", () => {
    const val: number | null = NaN
    const res = match(val)
      .with(P.nullish, () => "bad")
      .with(1, () => "bad")
      .with(NaN, () => "good")
      .with(P.number, () => "bad")
      .exhaustive()
    expect(res).toEqual("good")
  })
  it("when matching only NaN, the expression shouldn't be exhaustive", () => {
    const f = (val: number) =>
      match(val)
        .with(NaN, () => "NaN")
        // @ts-expect-error
        .exhaustive()
    const f2 = (val: number) =>
      match(val)
        .with(NaN, () => "NaN")
        .with(P.number, () => "number")
        .exhaustive()
  })
})
import { Expect, Equal } from "../src/types/helpers"
import { match, P } from "../src"
describe("optional properties", () => {
  it("matching on optional properties should work", () => {
    type Post = {
      type: "post"
      id?: number
      body: string
    }
    const res = match<Post>({
      type: "post",
      id: 2,
      body: "az",
    })
      .with({ type: "post", id: 2 as const }, x => {
        type t = Expect<Equal<typeof x, { type: "post"; id: 2; body: string }>>
        return 100
      })
      .with({ type: "post", id: P.number }, x => {
        type t = Expect<
          Equal<typeof x, { type: "post"; id: number; body: string }>
        >
        return 10
      })
      .with({ type: "post" }, x => {
        type t = Expect<Equal<typeof x, Post>>
        // id is still nullable
        x.id = undefined
        return 1
      })
      .run()
    expect(res).toEqual(100)
  })
  it("should correctly narrow the input type when the input is assignable to the pattern type", () => {
    type Foo =
      | { type: "test"; id?: string }
      | { type: "test2"; id?: string; otherProp: string }
      | { type: "test3"; id?: string; otherProp?: string }
    const f = (foo: Foo) =>
      match(foo)
        .with({ type: "test", id: P.not(undefined) }, ({ id }) => {
          type t = Expect<Equal<typeof id, string>>
          return 0
        })
        .with({ type: "test" }, ({ id }) => {
          type t = Expect<Equal<typeof id, string | undefined>>
          return 1
        })
        .with({ type: "test2" }, ({ id }) => {
          type t = Expect<Equal<typeof id, string | undefined>>
          return 2
        })
        .with({ type: "test3" }, ({ id }) => {
          type t = Expect<Equal<typeof id, string | undefined>>
          return 3
        })
        .exhaustive()
    expect(f({ type: "test", id: "1" })).toEqual(0)
    expect(f({ type: "test" })).toEqual(1)
    expect(f({ type: "test2", otherProp: "" })).toEqual(2)
    expect(f({ type: "test3" })).toEqual(3)
  })
})
import { match, P } from "../src"
import { Equal, Expect } from "../src/types/helpers"
describe("optional", () => {
  it("should match even if the sub pattern is undefined", () => {
    type Input = { a?: "cool" } | { b: "lol" }
    const f = (input: Input) =>
      match(input)
        .with({ b: "lol" }, x => {
          return false
        })
        .with({ a: P.optional("cool") }, x => {
          type t = Expect<Equal<typeof x, { a?: "cool" | undefined }>>
          return true
        })
        .exhaustive()
    expect(f({})).toBe(true)
    expect(f({ a: "cool" })).toBe(true)
    expect(f({ b: "lol" })).toBe(false)
  })
  it("should support a nested pattern", () => {
    type Input = { a?: { name: string; age: number } } | { b: "" }
    const f = (input: Input) =>
      match<Input>(input)
        .with({ a: P.optional({ name: "Hello" }) }, x => {
          type t = Expect<
            Equal<typeof x, { a?: { name: string; age: number } }>
          >
          return true
        })
        .with({ b: P.string }, x => {
          return false
        })
        .with({ a: { name: P.string } }, () => false)
        .exhaustive()
    // Not Hello
    expect(f({ a: { name: "Bonjour", age: 20 } })).toBe(false)
    expect(f({ a: { name: "Hello", age: 20 } })).toBe(true)
    expect(f({})).toBe(true)
  })
  it("should support anonymous select", () => {
    type Input =
      | { type: "a"; a?: { name: string; age: number } }
      | { type: "b"; b?: "test" }
    const f = (input: Input) =>
      match(input)
        .with({ type: "a", a: P.optional({ name: P.select() }) }, x => {
          type t = Expect<Equal<typeof x, string | undefined>>
          return x
        })
        .with({ type: "a", a: P.optional(P.select()) }, x => {
          type t = Expect<
            Equal<typeof x, { name: string; age: number } | undefined>
          >
          return x
        })
        .with({ type: "b", b: P.optional(P.select(P.union("test"))) }, x => {
          type t = Expect<Equal<typeof x, "test" | undefined>>
          return x
        })
        .with({ a: undefined }, x => {
          return "1"
        })
        .with({ a: P.not(undefined) }, x => {
          type t = Expect<
            Equal<
              typeof x,
              {
                type: "a"
                a: {
                  name: string
                  age: number
                }
              }
            >
          >
          return "1"
        })
        .exhaustive()
    expect(f({ type: "a" })).toBe(undefined)
    expect(f({ type: "b", b: "test" })).toBe("test")
  })
  it("should support named select", () => {
    type Input = { a?: { name: string; age: number } } | { b: "b" }
    expect(
      match<Input>({})
        .with(
          {
            a: P.optional({ name: P.select("name"), age: P.select("age") }),
          },
          ({ name, age }) => {
            type t1 = Expect<Equal<typeof name, string | undefined>>
            type t2 = Expect<Equal<typeof age, number | undefined>>
            return name
          }
        )
        .with({ b: "b" }, x => {
          return "1"
        })
        .with({ a: undefined }, x => {
          return "1"
        })
        .with({ a: P.not(undefined) }, x => {
          return "1"
        })
        .exhaustive()
    ).toBe(undefined)
  })
  it("should support named select", () => {
    type Input =
      | {
          type: "a"
          data?: { type: "img"; src: string } | { type: "text"; p: string }
        }
      | {
          type: "b"
          data?: { type: "video"; src: number } | { type: "gif"; p: string }
        }
    expect(
      match<Input>({ type: "a", data: { type: "text", p: "paragraph" } })
        .with(
          {
            type: "a",
            data: P.optional({ type: "img" }),
          },
          x => {
            type t = Expect<
              Equal<
                typeof x,
                { type: "a"; data?: { type: "img"; src: string } | undefined }
              >
            >
            return x
          }
        )
        .with(
          {
            type: "a",
            data: P.optional({ type: "text", p: P.select("p") }),
          },
          x => {
            type t = Expect<Equal<typeof x, { p: string | undefined }>>
            return x.p
          }
        )
        .with(
          {
            type: "b",
            data: P.optional({ type: "video", src: P.select("src") }),
          },
          ({ src }) => {
            type t = Expect<Equal<typeof src, number | undefined>>
            return src
          }
        )
        .with(
          {
            type: "b",
            data: P.optional({ type: "gif", p: P.select("p") }),
          },
          ({ p }) => {
            type t = Expect<Equal<typeof p, string | undefined>>
            return p
          }
        )
        .exhaustive()
    ).toBe("paragraph")
  })
  it("should support list patterns", () => {
    type Input = { maybeList?: { text: string }[] }
    const f = (input: Input) =>
      match(input)
        .with({ maybeList: P.optional(P.array({ text: P.select() })) }, x => {
          type t = Expect<Equal<typeof x, string[] | undefined>>
          return x
        })
        .exhaustive()
    expect(f({})).toBe(undefined)
    expect(f({ maybeList: [{ text: "Hello" }, { text: "Bonjour" }] })).toEqual([
      "Hello",
      "Bonjour",
    ])
  })
})
import { match } from "../src"
describe("otherwise", () => {
  it("should pass matched value to otherwise", () => {
    const result = match(42)
      .with(51, d => d)
      .otherwise(d => d)
    expect(result).toBe(42)
  })
})
import { match, P } from "../src"
import { Equal, Expect } from "../src/types/helpers"
import { State } from "./types-catalog/utils"
describe("output type", () => {
  describe("exhaustive", () => {
    it("should return a single type if they are all compatible", () => {
      const f = (input: number) =>
        match(input)
          .with(1, () => "ok")
          .with(2, () => "test")
          .with(P._, () => "hello")
          .exhaustive()
      type o1 = Expect<Equal<ReturnType<typeof f>, string>>
      const f2 = (input: number) =>
        match(input)
          .with(1, () => ({ x: "ok" }))
          .with(2, () => ({ x: "test" }))
          .with(P._, () => ({ x: "hello" }))
          .exhaustive()
      type o2 = Expect<Equal<ReturnType<typeof f2>, { x: string }>>
      const f3 = (input: number) =>
        match(input)
          .with(1, () => [1, 2, null])
          .with(3, () => [1, 2])
          .with(P._, () => [null, null])
          .exhaustive()
      type o3 = Expect<Equal<ReturnType<typeof f3>, (number | null)[]>>
    })
    it("if the current inferred output is assignable to the new output, just pick the broader one", () => {
      const f1 = (input: number) =>
        match(input)
          .with(1, () => [1, 2])
          .with(P._, () => [1, 2, null])
          .exhaustive()
      type o1 = Expect<Equal<ReturnType<typeof f1>, (number | null)[]>>
    })
    it("It should still be possible specify a precise output type", () => {
      const f1 = (input: number) =>
        match<number, State>(input)
          .with(P._, () => ({ status: "idle" }))
          // @ts-expect-error
          .with(1, () => [1, 2])
          // @ts-expect-error
          .with(P._, () => [1, 2, null])
          .exhaustive()
      type o1 = Expect<Equal<ReturnType<typeof f1>, State>>
    })
  })
  describe("run", () => {
    it("should return a single type if they are all compatible", () => {
      const f = (input: number) =>
        match(input)
          .with(1, () => "ok")
          .with(2, () => "test")
          .with(P._, () => "hello")
          .run()
      type o1 = Expect<Equal<ReturnType<typeof f>, string>>
      const f2 = (input: number) =>
        match(input)
          .with(1, () => ({ x: "ok" }))
          .with(2, () => ({ x: "test" }))
          .with(P._, () => ({ x: "hello" }))
          .run()
      type o2 = Expect<Equal<ReturnType<typeof f2>, { x: string }>>
      const f3 = (input: number) =>
        match(input)
          .with(1, () => [1, 2, null])
          .with(3, () => [1, 2])
          .with(P._, () => [null, null])
          .run()
      type o3 = Expect<Equal<ReturnType<typeof f3>, (number | null)[]>>
    })
    it("if the current inferred output is assignable to the new output, just pick the broader one", () => {
      const f1 = (input: number) =>
        match(input)
          .with(1, () => [1, 2])
          .with(P._, () => [1, 2, null])
          .run()
      type o1 = Expect<Equal<ReturnType<typeof f1>, (number | null)[]>>
    })
    it("It should still be possible specify a precise output type", () => {
      const f1 = (input: number) =>
        match<number, State>(input)
          .with(P._, () => ({ status: "idle" }))
          // @ts-expect-error
          .with(1, () => [1, 2])
          // @ts-expect-error
          .with(P._, () => [1, 2, null])
          .run()
      type o1 = Expect<Equal<ReturnType<typeof f1>, State>>
    })
  })
  describe("otherwise", () => {
    it("should return a single type if they are all compatible", () => {
      const f = (input: number) =>
        match(input)
          .with(1, () => "ok")
          .with(2, () => "test")
          .with(P._, () => "hello")
          .otherwise(() => "")
      type o1 = Expect<Equal<ReturnType<typeof f>, string>>
      const f2 = (input: number) =>
        match(input)
          .with(1, () => ({ x: "ok" }))
          .with(2, () => ({ x: "test" }))
          .with(P._, () => ({ x: "hello" }))
          .otherwise(() => ({ x: "" }))
      type o2 = Expect<Equal<ReturnType<typeof f2>, { x: string }>>
      const f3 = (input: number) =>
        match(input)
          .with(1, () => [1, 2, null])
          .with(3, () => [1, 2])
          .with(P._, () => [null, null])
          .otherwise(() => [0])
      type o3 = Expect<Equal<ReturnType<typeof f3>, (number | null)[]>>
    })
    it("if the current inferred output is assignable to the new output, just pick the broader one", () => {
      const f1 = (input: number) =>
        match(input)
          .with(1, () => [1, 2])
          .with(P._, () => [1, 2, null])
          .otherwise(() => [0])
      type o1 = Expect<Equal<ReturnType<typeof f1>, (number | null)[]>>
    })
    it("It should still be possible specify a precise output type", () => {
      const f1 = (input: number) =>
        match<number, State>(input)
          .with(P._, () => ({ status: "idle" }))
          // @ts-expect-error
          .with(1, () => [1, 2])
          // @ts-expect-error
          .with(P._, () => [1, 2, null])
          .otherwise(() => ({ status: "idle" }))
      type o1 = Expect<Equal<ReturnType<typeof f1>, State>>
    })
  })
})
import { P } from "../src"
import { Equal, Expect } from "../src/types/helpers"
import { Matcher } from "../src/types/Pattern"
type ExtendsPattern<a, p extends P.Pattern<a>> = true
describe("Pattern", () => {
  it("shouldn't allow invalid patterns", () => {
    type cases = [
      ExtendsPattern<
        { type: "a"; x: { y: string } } | { type: "b" },
        { type: "a"; x: { y: Matcher<unknown, string> } }
      >
    ]
  })
  it("Should return a single object pattern when the input is a union of objects", () => {
    type cases = [
      Expect<
        Equal<
          P.Pattern<{ kind: "some"; value: number } | { kind: "none" }>,
          | Matcher<
              { kind: "some"; value: number } | { kind: "none" },
              unknown,
              any,
              any,
              unknown
            >
          | {
              readonly kind?: P.Pattern<"some">
              readonly value?: P.Pattern<number>
            }
          | {
              readonly kind?: P.Pattern<"none">
            }
        >
      >
    ]
  })
  it("Should return a single object pattern when the input is a union of objects and other types", () => {
    type t = P.Pattern<
      { kind: "some"; value: number } | { kind: "none" } | string
    >
    type t1 = Expect<
      Equal<
        P.Pattern<{ kind: "some"; value: number } | { kind: "none" } | string>,
        | Matcher<
            string | { kind: "some"; value: number } | { kind: "none" },
            unknown,
            any,
            any,
            unknown
          >
        | {
            readonly kind?: P.Pattern<"some">
            readonly value?: P.Pattern<number>
          }
        | {
            readonly kind?: P.Pattern<"none">
          }
        | string
      >
    >
    type t2 = Expect<
      Equal<
        P.Pattern<{ a?: { name: string; age: number } } | { b: "" }>,
        | Matcher<
            { a?: { name: string; age: number } } | { b: "" },
            unknown,
            any,
            any,
            unknown
          >
        | {
            readonly a?: P.Pattern<{ name: string; age: number }>
          }
        | {
            readonly b?: P.Pattern<"">
          }
      >
    >
    type t3 = Expect<
      Equal<
        P.Pattern<{ name: string; age: number } | undefined>,
        | Matcher<
            { name: string; age: number } | undefined,
            unknown,
            any,
            any,
            unknown
          >
        | {
            readonly name?: P.Pattern<string>
            readonly age?: P.Pattern<number>
          }
        | undefined
      >
    >
    type t4 = Expect<
      Equal<
        P.Pattern<{ name: string; age: number } | [type: "Hello"]>,
        | Matcher<
            { name: string; age: number } | [type: "Hello"],
            unknown,
            any,
            any,
            unknown
          >
        | {
            readonly name?: P.Pattern<string>
            readonly age?: P.Pattern<number>
          }
        | readonly [type: P.Pattern<"Hello">]
      >
    >
  })
})
import { match, P } from "../src"
import { Equal, Expect } from "../src/types/helpers"
describe("Primitive values", () => {
  it("patterns can be any literal value", () => {
    const x = 2 as unknown
    expect(
      match(x)
        .with(true, x => {
          type t = Expect<Equal<typeof x, true>>
          return "true"
        })
        .with(false, x => {
          type t = Expect<Equal<typeof x, false>>
          return "false"
        })
        .with(null, x => {
          type t = Expect<Equal<typeof x, null>>
          return "null"
        })
        .with(undefined, x => {
          type t = Expect<Equal<typeof x, undefined>>
          return "undefined"
        })
        .with(Symbol.for("Hello"), x => {
          type t = Expect<Equal<typeof x, symbol>>
          return "Symbol"
        })
        .with("hello", x => {
          type t = Expect<Equal<typeof x, "hello">>
          return "hello"
        })
        .with(1, x => {
          type t = Expect<Equal<typeof x, 1>>
          return "1"
        })
        .with(BigInt(2000), x => {
          type t = Expect<Equal<typeof x, bigint>>
          return "BigInt(2000)"
        })
        .with(2, x => {
          type t = Expect<Equal<typeof x, 2>>
          return "2"
        })
        .otherwise(() => "?")
    ).toEqual("2")
  })
  it("primitive patterns should correctly narrow the value", () => {
    const f = (x: unknown) =>
      match(x)
        .with(P.boolean, x => {
          type t = Expect<Equal<typeof x, boolean>>
          return "boolean"
        })
        .with(P.nullish, x => {
          type t = Expect<Equal<typeof x, null | undefined>>
          return "nullish"
        })
        .with(P.symbol, x => {
          type t = Expect<Equal<typeof x, symbol>>
          return "symbol"
        })
        .with(P.string, x => {
          type t = Expect<Equal<typeof x, string>>
          return "string"
        })
        .with(P.number, x => {
          type t = Expect<Equal<typeof x, number>>
          return "number"
        })
        .with(P.bigint, x => {
          type t = Expect<Equal<typeof x, bigint>>
          return "bigint"
        })
        .otherwise(() => "?")
    expect(f(true)).toEqual("boolean")
    expect(f(null)).toEqual("nullish")
    expect(f(Symbol("hello"))).toEqual("symbol")
    expect(f("hello")).toEqual("string")
    expect(f(20)).toEqual("number")
    expect(f(BigInt(100))).toEqual("bigint")
  })
})
import { match } from "../src"
import { Equal, Expect } from "../src/types/helpers"
describe("readonly", () => {
  describe("exhaustive", () => {
    it("tuples", () => {
      const f = (input: readonly ["a" | "b", "c" | "d"]) =>
        match(input)
          .with(["a", "c"], x => {
            type t = Expect<Equal<typeof x, ["a", "c"]>>
            return "ok"
          })
          .with(["a", "d"], x => {
            type t = Expect<Equal<typeof x, ["a", "d"]>>
            return "ok"
          })
          .with(["b", "c"], x => {
            type t = Expect<Equal<typeof x, ["b", "c"]>>
            return "ok"
          })
          .with(["b", "d"], x => {
            type t = Expect<Equal<typeof x, ["b", "d"]>>
            return "ok"
          })
          .exhaustive()
    })
    it("objects", () => {
      const f = (
        input: Readonly<{ t: "a"; x: number }> | Readonly<{ t: "b"; x: string }>
      ) =>
        match(input)
          .with({ t: "a" }, x => {
            type t = Expect<Equal<typeof x, Readonly<{ t: "a"; x: number }>>>
            return "ok"
          })
          .with({ t: "b" }, x => {
            type t = Expect<Equal<typeof x, Readonly<{ t: "b"; x: string }>>>
            return "ok"
          })
          .exhaustive()
    })
    it("mixed", () => {
      const f = (
        input:
          | Readonly<{ t: "a"; x: readonly [number, string, 2] }>
          | Readonly<{ t: "b"; x: string }>
      ) =>
        match(input)
          .with({ t: "a", x: [2, "hello", 2] }, x => {
            type t = Expect<Equal<typeof x, { t: "a"; x: [number, string, 2] }>>
            return "ok"
          })
          .with({ t: "a", x: [2, "hello", 2] as const }, x => {
            type t = Expect<Equal<typeof x, { t: "a"; x: [2, "hello", 2] }>>
            return "ok"
          })
          .with({ t: "a" }, x => {
            type t = Expect<
              Equal<
                typeof x,
                Readonly<{ t: "a"; x: readonly [number, string, 2] }>
              >
            >
            return "ok"
          })
          .with({ t: "b" }, x => {
            type t = Expect<Equal<typeof x, Readonly<{ t: "b"; x: string }>>>
            return "ok"
          })
          .exhaustive()
    })
  })
})
import { match, P } from "../src"
import { Equal, Expect } from "../src/types/helpers"
import { Definition } from "./types-catalog/definition"
describe("real world example of a complex input type", () => {
  const f = (def: Definition) =>
    match(def)
      .with(
        {
          viz: "timeseries",
          requests: P.array({
            queries: P.array(
              P.union({ data_source: "metrics", query: P.select() }, P.any)
            ),
          }),
        },
        metricQueries => {
          type t = Expect<Equal<typeof metricQueries, (string | undefined)[][]>>
          return [`timeseries with metrics queries:`, metricQueries]
        }
      )
      .with(
        {
          requests: [{ sql_query: P.select() }],
          viz: "wildcard",
          specification: {
            type: "vega",
          },
        },
        q => {
          type t = Expect<Equal<typeof q, string>>
          return "vega wildcard with sql_query: " + q
        }
      )
      .with(
        {
          requests: P.array(
            P.intersection(
              P.union(
                { response_format: "timeseries" },
                { response_format: "scalar" }
              ),
              {
                queries: P.array({ data_source: P.union("metrics", "events") }),
              }
            )
          ),
        },
        x => {
          const format = x.requests[0]?.response_format
          const dataSource = x.requests[0]?.queries[0]?.data_source
          type t = Expect<Equal<typeof format, "timeseries" | "scalar">>
          type t2 = Expect<Equal<typeof dataSource, "metrics" | "events">>
          return [format, dataSource]
        }
      )
      .with(
        {
          viz: P.union("timeseries", "query_table"),
          requests: [
            {
              // This works
              queries: P.array({ data_source: P.union("metrics", "events") }),
              response_format: P.union("timeseries", "scalar"),
            },
          ],
        },
        x => {}
      )
      .with(
        {
          viz: P.union("timeseries", "query_table"),
          requests: P.array({
            // @ts-expect-error: FIXME,  P.union  only sees 'timeseries'
            response_format: P.union("timeseries", "scalar"),
          }),
        },
        () => "formulas requests"
      )
      .with(
        {
          requests: P.array({ response_format: "scalar" }),
        },
        () => "formulas requests"
      )
      .with(
        {
          requests: P.array({ response_format: "timeseries" }),
        },
        () => "formulas requests"
      )
      .with(
        {
          requests: [{ response_format: P.union("timeseries", "scalar") }],
        },
        () => "formulas requests"
      )
      .with(
        { style: P.optional({ palette_flip: true }) },
        withPalette => withPalette.viz
      )
      .with(
        { requests: P.array({ sql_query: P.select() }) },
        queries => queries
      )
      .with(
        { viz: "sunburst", requests: P.array({ response_format: P.select() }) },
        scalars => scalars
      )
      .with(
        {
          viz: P.union(
            "geomap",
            "timeseries",
            "heatmap",
            "scatterplot",
            "sunburst",
            "wildcard",
            "query_table"
          ),
        },
        () => ""
      )
      .with(
        { viz: "servicemap" },
        { viz: "distribution" },
        { viz: "treemap" },
        { viz: "toplist" },
        () => ""
      )
      .exhaustive()
  it("should return the correct output", () => {
    expect(
      f({
        viz: "wildcard",
        requests: [
          {
            sql_query: "SELECT *",
            request_type: "sql",
            response_format: "scalar",
          },
        ],
        specification: {
          type: "vega",
          contents: { something: "cool" },
        },
      })
    ).toBe("vega wildcard with sql_query: SELECT *")
    expect(
      f({
        viz: "wildcard",
        requests: [
          {
            sql_query: "SELECT *",
            request_type: "sql",
            response_format: "scalar",
          },
        ],
        specification: {
          type: "vega",
          contents: { something: "cool" },
        },
      })
    ).toBe("vega wildcard with sql_query: SELECT *")
    expect(
      f({
        viz: "timeseries",
        requests: [
          {
            response_format: "timeseries",
            queries: [
              {
                name: "a",
                data_source: "metrics",
                query: "a",
              },
              {
                name: "b",
                data_source: "metrics",
                query: "b",
              },
              {
                name: "c",
                data_source: "logs",
                compute: { aggregation: "avg" },
              },
            ],
          },
          {
            response_format: "timeseries",
            queries: [
              {
                name: "d",
                data_source: "metrics",
                query: "d",
              },
            ],
          },
        ],
      })
    ).toEqual([
      "timeseries with metrics queries:",
      [["a", "b", undefined], ["d"]],
    ])
  })
})
import { Expect, Equal } from "../src/types/helpers"
import { match, P } from "../src"
describe("Records ({})", () => {
  it("Should match records", () => {
    type Vector1 = { x: number }
    type Vector2 = { x: number; y: number }
    type Vector3 = {
      x: number
      y: number
      z: number
    }
    type Vector = Vector1 | Vector2 | Vector3
    const vector: Vector = { x: 1 }
    expect(
      match<Vector, string>(vector)
        .with({ x: 1, y: 1, z: 1 }, x => {
          type t = Expect<
            Equal<typeof x, Vector3 | { x: number; y: number; z: number }>
          >
          return "vector3"
        })
        .with({ x: 2, y: 1 }, x => {
          type t = Expect<Equal<typeof x, Vector3 | Vector2>>
          return "vector2"
        })
        .with({ x: 1 }, x => {
          type t = Expect<Equal<typeof x, Vector3 | Vector2 | Vector1>>
          return "vector1"
        })
        .otherwise(() => "no match")
    ).toEqual("vector1")
  })
})
import { Expect, Equal } from "../src/types/helpers"
import { match, P } from "../src"
import { State, Event } from "./types-catalog/utils"
import {
  MixedNamedAndAnonymousSelectError,
  SeveralAnonymousSelectError,
} from "../src/types/FindSelected"
describe("select", () => {
  it("should work with tuples", () => {
    expect(
      match<[string, number], number>(["get", 2])
        .with(["get", P.select("y")], ({ y }) => {
          type t = Expect<Equal<typeof y, number>>
          return y
        })
        .run()
    ).toEqual(2)
  })
  it("should work with array", () => {
    expect(
      match<string[], string[]>(["you", "hello"])
        .with([P.select("first")], ({ first }, xs) => {
          type t = Expect<Equal<typeof xs, string[]>>
          type t2 = Expect<Equal<typeof first, string>>
          return [first]
        })
        .with(P.array(P.select("texts")), ({ texts }, xs) => {
          type t = Expect<Equal<typeof xs, string[]>>
          type t2 = Expect<Equal<typeof texts, string[]>>
          return texts
        })
        .run()
    ).toEqual(["you", "hello"])
    expect(
      match<{ text: string }[], string[]>([{ text: "you" }, { text: "hello" }])
        .with(P.array({ text: P.select("texts") }), ({ texts }, xs) => {
          type t = Expect<Equal<typeof xs, { text: string }[]>>
          type t2 = Expect<Equal<typeof texts, string[]>>
          return texts
        })
        .run()
    ).toEqual(["you", "hello"])
    expect(
      match<{ text: { content: string } }[], string[]>([
        { text: { content: "you" } },
        { text: { content: "hello" } },
      ])
        .with(
          P.array({ text: { content: P.select("texts") } }),
          ({ texts }, xs) => {
            type t = Expect<Equal<typeof texts, string[]>>
            return texts
          }
        )
        .run()
    ).toEqual(["you", "hello"])
  })
  it("should work with objects", () => {
    expect(
      match<State & { other: number }, string>({
        status: "success",
        data: "some data",
        other: 20,
      })
        .with(
          {
            status: "success",
            data: P.select("data"),
            other: P.select("other"),
          },
          ({ data, other }) => {
            type t = Expect<Equal<typeof data, string>>
            type t2 = Expect<Equal<typeof other, number>>
            return data + other.toString()
          }
        )
        .run()
    ).toEqual("some data20")
  })
  it("should work with primitive types", () => {
    expect(
      match<string, string>("hello")
        .with(P.select("x"), ({ x }) => {
          type t = Expect<Equal<typeof x, string>>
          return x
        })
        .run()
    ).toEqual("hello")
  })
  it("should work with complex structures", () => {
    const initState: State = {
      status: "idle",
    }
    const reducer = (state: State, event: Event): State =>
      match<[State, Event], State>([state, event])
        .with(
          [
            { status: "loading" },
            {
              type: "success",
              data: P.select("data"),
              requestTime: P.select("time"),
            },
          ],
          ({ data, time }) => {
            type t = Expect<Equal<typeof time, number | undefined>>
            return {
              status: "success",
              data,
            }
          }
        )
        .with(
          [{ status: "loading" }, { type: "success", data: P.select("data") }],
          ({ data }) => ({
            status: "success",
            data,
          })
        )
        .with(
          [{ status: "loading" }, { type: "error", error: P.select("error") }],
          ({ error }) => ({
            status: "error",
            error,
          })
        )
        .with([{ status: "loading" }, { type: "cancel" }], () => initState)
        .with([{ status: P.not("loading") }, { type: "fetch" }], () => ({
          status: "loading",
        }))
        .with([P.select("state"), P.select("event")], ({ state, event }) => {
          type t = Expect<Equal<typeof state, State>>
          type t2 = Expect<Equal<typeof event, Event>>
          return state
        })
        .run()
    expect(reducer(initState, { type: "cancel" })).toEqual(initState)
    expect(reducer(initState, { type: "fetch" })).toEqual({
      status: "loading",
    })
    expect(
      reducer({ status: "loading" }, { type: "success", data: "yo" })
    ).toEqual({
      status: "success",
      data: "yo",
    })
    expect(reducer({ status: "loading" }, { type: "cancel" })).toEqual({
      status: "idle",
    })
  })
  it("should support nesting of several arrays", () => {
    type Input = [{ name: string }, { post: { title: string }[] }][]
    expect(
      match<Input>([
        [
          { name: "Gabriel" },
          { post: [{ title: "Hello World" }, { title: "what's up" }] },
        ],
        [{ name: "Alice" }, { post: [{ title: "Hola" }, { title: "coucou" }] }],
      ])
        .with([], x => {
          type t = Expect<Equal<typeof x, []>>
          return "empty"
        })
        .with(
          P.array([
            { name: P.select("names") },
            { post: P.array({ title: P.select("titles") }) },
          ]),
          ({ names, titles }) => {
            type t = Expect<Equal<typeof names, string[]>>
            type t2 = Expect<Equal<typeof titles, string[][]>>
            return (
              names.join(" and ") +
              " have written " +
              titles.map(t => t.map(t => `"${t}"`).join(", ")).join(", ")
            )
          }
        )
        .exhaustive()
    ).toEqual(
      `Gabriel and Alice have written "Hello World", "what's up", "Hola", "coucou"`
    )
  })
  it("Anonymous selections should support nesting of several arrays", () => {
    type Input = [{ name: string }, { post: { title: string }[] }][]
    expect(
      match<Input>([
        [
          { name: "Gabriel" },
          { post: [{ title: "Hello World" }, { title: "what's up" }] },
        ],
        [{ name: "Alice" }, { post: [{ title: "Hola" }, { title: "coucou" }] }],
      ])
        .with([], x => {
          type t = Expect<Equal<typeof x, []>>
          return "empty"
        })
        .with(
          P.typed<Input>().array([
            { name: P.any },
            { post: P.array({ title: P.select() }) },
          ]),
          titles => {
            type t1 = Expect<Equal<typeof titles, string[][]>>
            return titles.map(t => t.map(t => `"${t}"`).join(", ")).join(", ")
          }
        )
        .exhaustive()
    ).toEqual(`"Hello World", "what's up", "Hola", "coucou"`)
  })
  it("should infer the selection to an error when using several anonymous selection", () => {
    match({ type: "point", x: 2, y: 3 })
      .with({ type: "point", x: P.select(), y: P.select() }, x => {
        type t = Expect<Equal<typeof x, SeveralAnonymousSelectError>>
        return "ok"
      })
      .run()
  })
  it("should infer the selection to an error when using mixed named and unnamed selections", () => {
    match({ type: "point", x: 2, y: 3 })
      .with({ type: "point", x: P.select(), y: P.select("y") }, x => {
        type t = Expect<Equal<typeof x, MixedNamedAndAnonymousSelectError>>
        return "ok"
      })
      .run()
  })
  describe("P.select with subpattern", () => {
    type Input =
      | {
          type: "a"
          value:
            | { type: "img"; src: string }
            | { type: "text"; content: string; length: number }
        }
      | {
          type: "b"
          value:
            | { type: "user"; username: string }
            | { type: "org"; orgId: number }
        }
    it("should support only selecting if the value matches a subpattern", () => {
      const f = (input: Input) =>
        match(input)
          .with({ type: "a", value: P.select({ type: "img" }) }, x => {
            type t = Expect<Equal<typeof x, { type: "img"; src: string }>>
            return x.src
          })
          .with({ type: "a", value: P.select("text", { type: "text" }) }, x => {
            type t = Expect<
              Equal<
                typeof x,
                { text: { type: "text"; content: string; length: number } }
              >
            >
            return x.text.content
          })
          .with({ type: "b", value: P.select({ type: "user" }) }, x => {
            type t = Expect<Equal<typeof x, { type: "user"; username: string }>>
            return x.username
          })
          .with({ type: "b", value: P.select("org", { type: "org" }) }, x => {
            type t = Expect<
              Equal<typeof x, { org: { type: "org"; orgId: number } }>
            >
            return x.org.orgId
          })
          .exhaustive()
      expect(f({ type: "a", value: { type: "img", src: "Hello" } })).toEqual(
        "Hello"
      )
      expect(
        f({
          type: "a",
          value: { type: "text", length: 2, content: "some text" },
        })
      ).toEqual("some text")
      expect(
        f({ type: "b", value: { type: "user", username: "Gabriel" } })
      ).toEqual("Gabriel")
      expect(
        f({
          type: "b",
          value: { type: "org", orgId: 2 },
        })
      ).toEqual(2)
    })
    it("should be possible to nest named selections", () => {
      const f = (input: Input) =>
        match(input)
          .with(
            {
              type: "a",
              value: P.select("text", {
                type: "text",
                content: P.select("content"),
                length: P.select("length"),
              }),
            },
            ({ text, content, length }) => {
              type t1 = Expect<
                Equal<
                  typeof text,
                  { type: "text"; content: string; length: number }
                >
              >
              type t2 = Expect<Equal<typeof content, string>>
              type t3 = Expect<Equal<typeof length, number>>
              return [text, length, content]
            }
          )
          .otherwise(() => null)
      expect(
        f({ type: "a", value: { type: "text", length: 2, content: "yo" } })
      ).toEqual([{ type: "text", length: 2, content: "yo" }, 2, "yo"])
      expect(f({ type: "a", value: { type: "img", src: "yo" } })).toEqual(null)
    })
    it("should work with union subpatterns", () => {
      type Input = {
        value:
          | { type: "a"; v: string }
          | { type: "b"; v: number }
          | { type: "c"; v: boolean }
      }
      // select directly followed by union
      const f = (input: Input) =>
        match(input)
          .with(
            { value: P.select(P.union({ type: "a" }, { type: "b" })) },
            x => {
              type t = Expect<
                Equal<
                  typeof x,
                  { type: "a"; v: string } | { type: "b"; v: number }
                >
              >
              return x.v
            }
          )
          .with({ value: { type: "c" } }, () => "c")
          .exhaustive()
      // select with an object that's a union by union
      const f2 = (input: Input) =>
        match(input)
          .with({ value: P.select({ type: P.union("a", "b") }) }, x => {
            type t = Expect<
              Equal<
                typeof x,
                { type: "a"; v: string } | { type: "b"; v: number }
              >
            >
            return x.v
          })
          .with({ value: { type: "c" } }, () => "c")
          .exhaustive()
      expect(f({ value: { type: "a", v: "hello" } })).toEqual("hello")
      expect(f2({ value: { type: "a", v: "hello" } })).toEqual("hello")
      expect(f({ value: { type: "b", v: 10 } })).toEqual(10)
      expect(f2({ value: { type: "b", v: 10 } })).toEqual(10)
      expect(f({ value: { type: "c", v: true } })).toEqual("c")
      expect(f2({ value: { type: "c", v: true } })).toEqual("c")
    })
    it("Should work with unions without discriminants", () => {
      type Input =
        | { type: "a"; value: string }
        | { type: "b"; value: number }
        | {
            type: "c"
            value:
              | { type: "d"; value: boolean }
              | { type: "e"; value: string[] }
              | { type: "f"; value: number[] }
          }
      const f = (input: Input) =>
        match(input)
          .with({ type: P.union("a", "b") }, x => {
            return "branch 1"
          })
          .with(
            {
              type: "c",
              value: { value: P.select(P.union(P.boolean, P.array(P.string))) },
            },
            x => {
              type t = Expect<Equal<typeof x, boolean | string[]>>
              return "branch 2"
            }
          )
          .with({ type: "c", value: { type: "f" } }, () => "branch 3")
          .exhaustive()
    })
  })
  it("Issue #95: P.select() on empty arrays should return an empty array", () => {
    const res = match({ a: [], b: ["text"] })
      .with(
        { a: P.array(P.select("a")), b: P.array(P.select("b")) },
        ({ a, b }) => {
          type t = Expect<Equal<typeof a, string[]>>
          type t2 = Expect<Equal<typeof b, string[]>>
          return { a, b }
        }
      )
      .otherwise(() => null)
    expect(res).toEqual({ a: [], b: ["text"] })
    // Should work with deeply nested selections as well
    const res2 = match<{ a: { prop: number }[] }>({ a: [] })
      .with({ a: P.array({ prop: P.select("a") }) }, ({ a }) => {
        type t = Expect<Equal<typeof a, number[]>>
        return { a }
      })
      .otherwise(() => null)
    expect(res2).toEqual({ a: [] })
    // P.select of arrays shouldn't be affected
    const res3 = match<{ a: { prop: number }[] }>({ a: [] })
      .with({ a: P.select(P.array({ prop: P._ })) }, a => {
        type t = Expect<Equal<typeof a, { prop: number }[]>>
        return { a }
      })
      .otherwise(() => null)
    expect(res3).toEqual({ a: [] })
  })
})
import { Expect, Equal } from "../src/types/helpers"
import { match, P } from "../src"
describe("Set", () => {
  it("should match Set patterns", () => {
    const containsGabAndYo = (set: Set<string | number>) =>
      match<Set<string | number>, [boolean, boolean]>(set)
        .with(new Set(["gab", "yo"]), x => {
          type t = Expect<Equal<typeof x, Set<string>>>
          return [true, true]
        })
        .with(new Set(["gab"]), x => {
          type t = Expect<Equal<typeof x, Set<string>>>
          return [true, false]
        })
        .with(new Set(["yo"]), x => {
          type t = Expect<Equal<typeof x, Set<string>>>
          return [false, true]
        })
        .with(P._, x => {
          type t = Expect<Equal<typeof x, Set<string | number>>>
          return [false, false]
        })
        .run()
    expect(containsGabAndYo(new Set(["gab", "yo", "hello"]))).toEqual([
      true,
      true,
    ])
    expect(containsGabAndYo(new Set(["gab", "hello"]))).toEqual([true, false])
    expect(containsGabAndYo(new Set(["yo", "hello"]))).toEqual([false, true])
    expect(containsGabAndYo(new Set(["hello"]))).toEqual([false, false])
    expect(containsGabAndYo(new Set([]))).toEqual([false, false])
    expect(containsGabAndYo(new Set([2]))).toEqual([false, false])
  })
})
import { Expect, Equal } from "../src/types/helpers"
import { match, P } from "../src"
import { State, Event } from "./types-catalog/utils"
describe("tuple ([a, b])", () => {
  it("should match tuple patterns", () => {
    const sum = (xs: number[]): number =>
      match(xs)
        .with([], () => 0)
        .with([P.number, P.number], ([x, y]) => x + y)
        .with([P.number, P.number, P.number], ([x, y, z]) => x + y + z)
        .with(
          [P.number, P.number, P.number, P.number],
          ([x, y, z, w]) => x + y + z + w
        )
        .run()
    expect(sum([2, 3, 2, 4])).toEqual(11)
  })
  it("should discriminate correctly union of tuples", () => {
    type Input =
      | ["+", number, number]
      | ["*", number, number]
      | ["-", number]
      | ["++", number]
    const res = match<Input, number>(["-", 2])
      .with(["+", P.number, P.number], value => {
        type t = Expect<Equal<typeof value, ["+", number, number]>>
        const [, x, y] = value
        return x + y
      })
      .with(["*", P.number, P.number], value => {
        type t = Expect<Equal<typeof value, ["*", number, number]>>
        const [, x, y] = value
        return x * y
      })
      .with(["-", P.number], value => {
        type t = Expect<Equal<typeof value, ["-", number]>>
        const [, x] = value
        return -x
      })
      .with(["++", P.number], ([, x]) => x + 1)
      .exhaustive()
    const res2 = match<Input, number>(["-", 2])
      .with(["+", P._, P._], value => {
        type t = Expect<Equal<typeof value, ["+", number, number]>>
        const [, x, y] = value
        return x + y
      })
      .with(["*", P._, P._], value => {
        type t = Expect<Equal<typeof value, ["*", number, number]>>
        const [, x, y] = value
        return x * y
      })
      .with(["-", P._], value => {
        type t = Expect<Equal<typeof value, ["-", number]>>
        const [, x] = value
        return -x
      })
      .run()
    expect(res).toEqual(-2)
    expect(res2).toEqual(-2)
  })
  describe("should match heterogenous tuple patterns", () => {
    const tuples: { tuple: [string, number]; expected: string }[] = [
      { tuple: ["coucou", 20], expected: "number match" },
      { tuple: ["hello", 20], expected: "perfect match" },
      { tuple: ["hello", 21], expected: "string match" },
      { tuple: ["azeaze", 17], expected: "not matching" },
    ]
    tuples.forEach(({ tuple, expected }) => {
      it(`should work with ${tuple}`, () => {
        expect(
          match<[string, number], string>(tuple)
            .with(["hello", 20], x => {
              type t = Expect<Equal<typeof x, [string, number]>>
              return `perfect match`
            })
            .with(["hello", P._], x => {
              type t = Expect<Equal<typeof x, [string, number]>>
              return `string match`
            })
            .with([P._, 20], x => {
              type t = Expect<Equal<typeof x, [string, number]>>
              return `number match`
            })
            .with([P.string, P.number], x => {
              type t = Expect<Equal<typeof x, [string, number]>>
              return `not matching`
            })
            .with([P._, P._], x => {
              type t = Expect<Equal<typeof x, [string, number]>>
              return `can't happen`
            })
            .with(P._, x => {
              type t = Expect<Equal<typeof x, [string, number]>>
              return `can't happen`
            })
            .run()
        ).toEqual(expected)
      })
    })
  })
  it("should work with tuple of records", () => {
    const initState: State = {
      status: "idle",
    }
    const reducer = (state: State, event: Event): State =>
      match<[State, Event], State>([state, event])
        .with([P.any, { type: "fetch" }], x => {
          type t = Expect<Equal<typeof x, [State, { type: "fetch" }]>>
          return {
            status: "loading",
          }
        })
        .with([{ status: "loading" }, { type: "success" }], x => {
          type t = Expect<
            Equal<
              typeof x,
              [
                { status: "loading" },
                { type: "success"; data: string; requestTime?: number }
              ]
            >
          >
          return {
            status: "success",
            data: x[1].data,
          }
        })
        .with([{ status: "loading" }, { type: "error" }], x => {
          type t = Expect<
            Equal<
              typeof x,
              [{ status: "loading" }, { type: "error"; error: Error }]
            >
          >
          return {
            status: "error",
            error: x[1].error,
          }
        })
        .with([{ status: "loading" }, { type: "cancel" }], x => {
          type t = Expect<
            Equal<typeof x, [{ status: "loading" }, { type: "cancel" }]>
          >
          return initState
        })
        .otherwise(() => state)
    expect(reducer(initState, { type: "fetch" })).toEqual({
      status: "loading",
    })
    expect(
      reducer({ status: "loading" }, { type: "success", data: "yo" })
    ).toEqual({
      status: "success",
      data: "yo",
    })
    expect(reducer({ status: "loading" }, { type: "cancel" })).toEqual({
      status: "idle",
    })
  })
  it("should work with as const", () => {
    type State = { type: "a" } | { type: "b" }
    type Event = { type: "c" } | { type: "d" }
    const state = { type: "a" } as State
    const event = { type: "c" } as Event
    const output = match([state, event] as const)
      .with([{ type: "a" }, { type: "c" }], () => "a + c")
      .otherwise(() => "no")
    expect(output).toEqual("a + c")
  })
  it("should work with nested tuples", () => {
    type State = {}
    type Msg = [type: "Login"] | [type: "UrlChange", url: string]
    function update(state: State, msg: Msg) {
      return match<[State, Msg], string>([state, msg])
        .with([P.any, ["Login"]], () => "ok")
        .with([P.any, ["UrlChange", P.select()]], () => "not ok")
        .exhaustive()
    }
  })
})
import { match, P } from "../src"
import { Equal, Expect } from "../src/types/helpers"
import { Option } from "./types-catalog/utils"
type Country = "France" | "Germany" | "Spain" | "USA"
describe("type errors", () => {
  it("if the inferred pattern type is any, it shouldn't say that the type instanciation is too deep.", () => {
    const f = (n: number) => {
      return (
        match(n)
          .with(P.array(P.number), s => {
            return "big number"
          })
          // @ts-expect-error: this isn't a list
          .exhaustive()
      )
    }
    match<Country>("France")
      // @ts-expect-error: 'Spai' instead of 'Spain'
      .with("France", "Germany", "Spai", x => "Europe")
      .with("USA", () => "America")
      .exhaustive()
    match<Country>("Germany")
      .with("Germany", "Spain", () => "Europe")
      // @ts-expect-error: 'US' instead of 'USA'
      .with("US", x => "America")
      .exhaustive()
  })
  it("If the pattern's wrong, the inferred selection must be the input type", () => {
    match<Country>("Germany")
      .with("Germany", "Spain", () => "Europe")
      // @ts-expect-error: 'US' instead of 'USA'
      .with("US", x => {
        type t = Expect<Equal<typeof x, Country>>
        return "America"
      })
      .exhaustive()
  })
  it("Patterns shouldn't accept values which will never match", () => {
    const f1 = (input: Option<{ x: number }>) =>
      match<Option<{ x: number }>>(input)
        .with({ kind: "some", value: { x: 2 } }, () => "2")
        // @ts-expect-error, value.x should be a number
        .with({ value: { x: "" } }, () => "2")
        .with({ kind: "some" }, () => "2")
        .with({ kind: "none" }, () => "")
        .with({ kind: "some", value: P.any }, () => "")
        .exhaustive()
    const f2 = (input: Option<number>) =>
      match(input)
        // @ts-expect-error: value is a number
        .with({ kind: "some", value: "string" }, () => "")
        .with({ kind: "none" }, () => 0)
        .exhaustive()
  })
  it("shouldn't allow when guards with an invalid input", () => {
    const startsWith = (start: string) => (value: string) =>
      value.startsWith(start)
    const equals =
      <T>(n: T) =>
      (n2: T) =>
        n === n2
    const f = (optionalNumber: Option<number>) =>
      match(optionalNumber)
        .with(
          {
            kind: "some",
            // @ts-expect-error: string isn't assigable to number
            value: P.when(startsWith("hello")),
          },
          () => "fizz"
        )
        .with(
          {
            kind: "some",
            // @ts-expect-error: string isn't assigable to number
            value: P.when((x: string) => x),
          },
          () => "fizz"
        )
        .with(
          {
            kind: "some",
            value: P.when((x: number) => x),
          },
          () => "fizz"
        )
        .with(
          {
            kind: "some",
            value: P.when(equals(2)),
          },
          () => "fizz"
        )
        .with(
          {
            kind: "some",
            // @ts-expect-error: string isn't assigable to number
            value: P.when(equals("yo")),
          },
          () => "fizz"
        )
        .with({ kind: "none" }, () => "nope")
        // @ts-expect-error
        .exhaustive()
  })
})
import { Equal, Expect, IsPlainObject, Primitives } from "../src/types/helpers"
import { IsMatching } from "../src/types/IsMatching"
import { Option } from "./types-catalog/utils"
describe("IsMatching", () => {
  describe("should return true if the pattern matches the input,  false otherwise", () => {
    it("Literals", () => {
      type cases = [
        Expect<Equal<IsMatching<"c" | "d", "c">, true>>,
        Expect<Equal<IsMatching<"c" | "d", "a">, false>>,
        Expect<Equal<IsMatching<"c" | "d", unknown>, true>>,
        Expect<Equal<IsMatching<1 | 2, 1>, true>>,
        Expect<Equal<IsMatching<1 | 2, 3>, false>>,
        Expect<Equal<IsMatching<1 | 2, unknown>, true>>,
        Expect<Equal<IsMatching<1 | "a", 1>, true>>,
        Expect<Equal<IsMatching<1 | "a", "a">, true>>,
        Expect<Equal<IsMatching<1 | "a", 2>, false>>,
        Expect<Equal<IsMatching<1 | "a", "b">, false>>,
        Expect<Equal<IsMatching<1 | "a", unknown>, true>>
      ]
    })
    it("Object", () => {
      type cases = [
        Expect<
          Equal<
            IsMatching<{ type: "a"; color: "yellow" | "green" }, { type: "a" }>,
            true
          >
        >,
        Expect<
          Equal<
            IsMatching<{ type: "a"; color: "yellow" | "green" }, { type: "b" }>,
            false
          >
        >,
        Expect<
          Equal<
            IsMatching<
              { type: "a"; value: { type: "c"; value: { type: "d" } } } | 12,
              { type: "a" }
            >,
            true
          >
        >,
        Expect<
          Equal<
            IsMatching<
              { type: "a"; value: { type: "c"; value: { type: "d" } } } | 12,
              12
            >,
            true
          >
        >,
        Expect<
          Equal<
            IsMatching<
              | {
                  type: "a"
                  value:
                    | { type: "c"; value: { type: "d" } | 2 }
                    | { type: "e"; value: { type: "f" } | 3 }
                }
              | 12,
              { type: "a"; value: { type: "c" } }
            >,
            true
          >
        >,
        Expect<
          Equal<
            IsMatching<
              | {
                  type: "a"
                  value:
                    | { type: "c"; value: { type: "d" } | 2 }
                    | { type: "e"; value: { type: "f" } | 3 }
                }
              | 12,
              { type: "a"; value: { type: "c"; value: 2 } }
            >,
            true
          >
        >,
        Expect<
          Equal<
            IsMatching<
              {
                type: "a"
                value:
                  | { type: "c"; value: { type: "d" } | 2 }
                  | { type: "e"; value: { type: "f" } | 3 }
              },
              { type: "a"; value: { type: "c"; value: 3 } }
            >,
            false //  value: 3 isn't compatible with type: 'c'
          >
        >,
        Expect<
          Equal<
            IsMatching<12, { type: "a"; value: { type: "c"; value: 3 } }>,
            false
          >
        >,
        Expect<
          Equal<
            IsMatching<
              | { type: "c"; value: { type: "d" } | 2 }
              | { type: "e"; value: { type: "f" } | 3 },
              { type: "c"; value: 3 }
            >,
            false
          >
        >,
        Expect<
          Equal<
            IsMatching<
              | { type: "c"; value: { type: "d" } | 2 }
              | { type: "e"; value: { type: "f" } | 3 },
              { type: "c" }
            >,
            true
          >
        >,
        Expect<
          Equal<
            IsMatching<
              | { type: "c"; value: { type: "d" } | 2 }
              | { type: "e"; value: { type: "f" } | 3 },
              { value: 3 }
            >,
            true
          >
        >,
        Expect<
          Equal<
            IsMatching<
              { type: "c"; value: { type: "d" } | 2 },
              { type: "c"; value: 3 }
            >,
            false
          >
        >,
        Expect<
          Equal<
            IsMatching<
              Option<{ type: "a" } | { type: "b" }>,
              { kind: "some"; value: { type: "a" } }
            >,
            true
          >
        >,
        Expect<
          Equal<
            IsMatching<
              Option<{ type: "a" } | { type: "b" }>,
              { kind: "some"; value: { type: "c" } }
            >,
            false
          >
        >,
        Expect<Equal<IsMatching<{ type: "a" }, {}>, false>>,
        Expect<Equal<IsMatching<{}, { type: "a" }>, false>>
      ]
    })
    it("Tuples", () => {
      type State = {}
      type Msg = [type: "Login"] | [type: "UrlChange", url: string]
      type cases = [
        Expect<Equal<IsMatching<["a", "c" | "d"], ["a", "d"]>, true>>,
        Expect<Equal<IsMatching<["a", "c" | "d"], ["a", unknown]>, true>>,
        Expect<Equal<IsMatching<["a", "c" | "d"], ["a", "f"]>, false>>,
        Expect<Equal<IsMatching<["a", "c" | "d"], ["b", "c"]>, false>>,
        Expect<Equal<IsMatching<["a", "c" | "d", "d"], ["b", "c"]>, false>>,
        Expect<Equal<IsMatching<[], []>, true>>,
        Expect<Equal<IsMatching<["a"], []>, false>>,
        Expect<Equal<IsMatching<["a"], ["a", "b", "c"]>, false>>,
        Expect<Equal<IsMatching<[], ["a", "b", "c"]>, false>>,
        Expect<
          Equal<
            IsMatching<
              [Option<{ type: "a" } | { type: "b" }>, "c" | "d"],
              [{ kind: "some"; value: { type: "a" } }, unknown]
            >,
            true
          >
        >,
        Expect<
          Equal<
            IsMatching<[State, Msg], [unknown, ["UrlChange", unknown]]>,
            true
          >
        >,
        Expect<
          Equal<IsMatching<[State, Msg], [unknown, ["Login", unknown]]>, false>
        >,
        Expect<Equal<IsMatching<[State, Msg], [unknown, ["Login"]]>, true>>
      ]
    })
    it("Lists", () => {
      type cases = [
        Expect<Equal<IsMatching<("a" | "b")[], "a"[]>, true>>,
        Expect<Equal<IsMatching<("a" | "b")[], "b"[]>, true>>,
        Expect<Equal<IsMatching<("a" | "b")[], "c"[]>, false>>,
        Expect<Equal<IsMatching<{ x: ["a" | "b"] }[], { x: ["a"] }[]>, true>>,
        Expect<Equal<IsMatching<{ x: ["a" | "b"] }[], { x: ["c"] }[]>, false>>
      ]
    })
    it("Sets", () => {
      type cases = [
        Expect<Equal<IsMatching<Set<"a" | "b">, Set<"a">>, true>>,
        Expect<Equal<IsMatching<Set<"a" | "b">, Set<"b">>, true>>,
        Expect<Equal<IsMatching<Set<"a" | "b">, Set<"c">>, false>>,
        Expect<
          Equal<IsMatching<Set<{ x: ["a" | "b"] }>, Set<{ x: ["a"] }>>, true>
        >,
        Expect<
          Equal<IsMatching<Set<{ x: ["a" | "b"] }>, Set<{ x: ["c"] }>>, false>
        >
      ]
    })
    it("Maps", () => {
      type cases = [
        Expect<
          Equal<IsMatching<Map<string, "a" | "b">, Map<string, "a">>, true>
        >,
        Expect<
          Equal<IsMatching<Map<"hello", "a" | "b">, Map<"hello", "b">>, true>
        >,
        Expect<
          Equal<IsMatching<Map<string, "a" | "b">, Map<string, "c">>, false>
        >,
        Expect<
          Equal<IsMatching<Map<"hello", "a" | "b">, Map<string, "a">>, false>
        >,
        Expect<
          Equal<
            IsMatching<
              Map<string, { x: ["a" | "b"] }>,
              Map<string, { x: ["a"] }>
            >,
            true
          >
        >,
        Expect<
          Equal<
            IsMatching<
              Map<string, { x: ["a" | "b"] }>,
              Map<string, { x: ["c"] }>
            >,
            false
          >
        >
      ]
    })
    it("pattern is a union types", () => {
      type cases = [
        Expect<Equal<IsMatching<"d", "d" | "e">, true>>,
        Expect<Equal<IsMatching<"f", "d" | "e">, false>>,
        Expect<
          Equal<
            IsMatching<
              | { type: "d"; value: boolean }
              | { type: "e"; value: string[] }
              | { type: "f"; value: number[] },
              {
                type: "d" | "e"
              }
            >,
            true
          >
        >
      ]
    })
  })
})
import { Expect, Equal } from "../src/types/helpers"
import { match, P } from "../src"
import { State, Event } from "./types-catalog/utils"
describe("types", () => {
  type Input = [State, Event]
  it("wildcard patterns should typecheck", () => {
    let pattern: P.Pattern<Input>
    pattern = P._
    pattern = [P._, P._]
    pattern = [{ status: "success", data: "" }, P._]
    pattern = [{ status: "success", data: P.string }, P._]
    pattern = [{ status: "success", data: P._ }, P._]
    pattern = [{ status: "error", error: new Error() }, P._]
    pattern = [{ status: "idle" }, P._]
    pattern = [P._, { type: "fetch" }]
    pattern = [P._, { type: P._ }]
    pattern = [{ status: "idle" }, { type: "fetch" }]
    pattern = [{ status: P._ }, { type: P._ }]
  })
  it("guard patterns should typecheck", () => {
    const pattern1: P.Pattern<Input> = P.when(() => true)
    const pattern2: P.Pattern<Input> = P.when(x => {
      type t = Expect<Equal<typeof x, Input>>
      return true
    })
    const pattern3: P.Pattern<Input> = [
      P.when(state => {
        type t = Expect<Equal<typeof state, State>>
        return !!state
      }),
      P.when(event => {
        type t = Expect<Equal<typeof event, Event>>
        return !!event
      }),
    ]
    const pattern3_1: P.Pattern<Input> = [
      P._,
      { type: P.when((t: Event["type"]) => true) },
    ]
    const pattern4: P.Pattern<Input> = [
      {
        status: "success",
        data: P.when(d => {
          type t = Expect<Equal<typeof d, string>>
          return true
        }),
      },
      P._,
    ]
    const pattern4_1: P.Pattern<Input> = [{ status: "error", data: "" }, P._]
    const pattern5: P.Pattern<Input> = [
      P._,
      { type: P.when((t: Event["type"]) => true) },
    ]
    const isFetch = (type: string): type is "fetch" => type === "fetch"
    const pattern6: P.Pattern<Input> = [P._, { type: P.when(isFetch) }]
    const pattern7: P.Pattern<{ x: string }> = {
      x: P.when(x => {
        type t = Expect<Equal<typeof x, string>>
        return true
      }),
    }
    const pattern8: P.Pattern<[{ x: string }]> = [
      {
        x: P.when(x => {
          type t = Expect<Equal<typeof x, string>>
          return true
        }),
      },
    ]
    const pattern9: P.Pattern<[{ x: string }, { y: number }]> = [
      {
        x: P.when(x => {
          type t = Expect<Equal<typeof x, string>>
          return true
        }),
      },
      {
        y: P.when(y => {
          type t = Expect<Equal<typeof y, number>>
          return true
        }),
      },
    ]
    const pattern10: P.Pattern<string | number> = P.when(x => {
      type t = Expect<Equal<typeof x, string | number>>
      return true
    })
  })
  it("should infer values correctly in handler", () => {
    type Input = { type: string; hello?: { yo: number } } | string
    const res = match<Input>({ type: "hello" })
      .with(P._, x => {
        type t = Expect<Equal<typeof x, Input>>
        return "ok"
      })
      .with(P.string, x => {
        type t = Expect<Equal<typeof x, string>>
        return "ok"
      })
      .with(
        P.when(x => true),
        x => {
          type t = Expect<Equal<typeof x, Input>>
          return "ok"
        }
      )
      .with(
        P.typed<Input>().when(x => {
          type t = Expect<Equal<typeof x, Input>>
          return true
        }),
        x => {
          type t = Expect<Equal<typeof x, Input>>
          return "ok"
        }
      )
      .with(P.not("hello" as const), x => {
        type t = Expect<Equal<typeof x, Input>>
        return "ok"
      })
      .with(P.not(P.string), x => {
        type t = Expect<
          Equal<
            typeof x,
            {
              type: string
              hello?: {
                yo: number
              }
            }
          >
        >
        return "ok"
      })
      .with(P.not(P.when(x => true)), x => {
        type t = Expect<Equal<typeof x, Input>>
        return "ok"
      })
      .with({ type: P._ }, x => {
        type t = Expect<
          Equal<
            typeof x,
            {
              type: string
              hello?: {
                yo: number
              }
            }
          >
        >
        return "ok"
      })
      .with({ type: P.string }, x => {
        type t = Expect<
          Equal<typeof x, { type: string; hello?: { yo: number } | undefined }>
        >
        return "ok"
      })
      .with({ type: P.when(x => true) }, x => {
        type t = Expect<
          Equal<typeof x, { type: string; hello?: { yo: number } | undefined }>
        >
        return "ok"
      })
      .with({ type: P.not("hello" as "hello") }, x => {
        type t = Expect<
          Equal<
            typeof x,
            {
              type: string
              hello:
                | {
                    yo: number
                  }
                | undefined
            }
          >
        >
        return "ok"
      })
      .with({ type: P.not(P.string) }, x => {
        type t = Expect<Equal<typeof x, Input>>
        return "ok"
      })
      .with({ type: P.not(P.when(x => true)) }, x => {
        type t = Expect<Equal<typeof x, Input>>
        return "ok"
      })
      .with(P.not({ type: P.when(x => true) }), x => {
        type t = Expect<Equal<typeof x, string>>
        return "ok"
      })
      .with(P.not({ type: P.string }), x => {
        type t = Expect<Equal<typeof x, string>>
        return "ok"
      })
      .run()
    const inferenceCheck: string = res
  })
  it("a union of object or primitive should be matched with a correct type inference", () => {
    type Input =
      | string
      | number
      | boolean
      | { type: string }
      | string[]
      | [number, number]
    match<Input>({ type: "hello" })
      .with({ type: P._ }, x => {
        type t = Expect<Equal<typeof x, { type: string }>>
        return "ok"
      })
      .with(P.string, x => {
        type t = Expect<Equal<typeof x, string>>
        return "ok"
      })
      .with(P.number, x => {
        type t = Expect<Equal<typeof x, number>>
        return "ok"
      })
      .with(P.boolean, x => {
        type t = Expect<Equal<typeof x, boolean>>
        return "ok"
      })
      .with({ type: P.string }, x => {
        type t = Expect<Equal<typeof x, { type: string }>>
        return "ok"
      })
      .with([P.string], x => {
        type t = Expect<Equal<typeof x, [string]>>
        return "ok"
      })
      .with([P.number, P.number], x => {
        type t = Expect<Equal<typeof x, [number, number]>>
        return "ok"
      })
      .run()
  })
  describe("Unknown Input", () => {
    const users: unknown = [{ name: "Gabriel", postCount: 20 }]
    const typedUsers = match(users)
      .with([{ name: P.string, postCount: P.number }], users => users)
      .otherwise(() => [])
    // type of `typedUsers` is { name: string, postCount: number }[]
    expect(
      typedUsers
        .map(user => `<p>${user.name} has ${user.postCount} posts.</p>`)
        .join("")
    ).toEqual(`<p>Gabriel has 20 posts.</p>`)
  })
  it("should enforce all branches return the right typeP. when it's set", () => {
    match<number, number>(2)
      //  @ts-expect-error
      .with(2, () => "string")
      //  @ts-expect-error
      .otherwise(() => "?")
  })
  it("issue #73: should enforce the handler as the right type", () => {
    const f = (x: number) => x.toLocaleString()
    const g = (x: string) => x.toUpperCase()
    expect(() =>
      match(false)
        // @ts-expect-error
        .with(true, f)
        // @ts-expect-error
        .with(false, g)
        // @ts-expect-error
        .with(true, (n: string) => "")
        .exhaustive()
    ).toThrow()
  })
})
import { Expect, Equal } from "../src/types/helpers"
import { match, P } from "../src"
import { Option } from "./types-catalog/utils"
describe("Unions (a | b)", () => {
  it("should match discriminated unions", () => {
    const val: Option<string> = {
      kind: "some",
      value: "hello",
    }
    const res = match(val as Option<string>)
      .with({ kind: "some" }, o => {
        type t = Expect<Equal<typeof o, { kind: "some"; value: string }>>
        return o.value
      })
      .with({ kind: "none" }, () => "no value")
      .exhaustive()
    type t = Expect<Equal<typeof res, string>>
    expect(res).toEqual("hello")
  })
  it("should discriminate union types correctly 2", () => {
    type Post = {
      type: "post"
      id: number
      content: { body: string }
    }
    type Video = { type: "video"; id: number; content: { src: string } }
    type Image = { type: "image"; id: number; content: { src: number } }
    type Input = Post | Video | Image
    const res = match<Input>({
      type: "post",
      id: 2,
      content: { body: "yo" },
    })
      .with({ type: "post", content: P._ }, x => {
        type t = Expect<Equal<typeof x, Post>>
        return 1
      })
      .with({ type: "post", id: 7 }, x => {
        type t = Expect<Equal<typeof x, Post>>
        return 1
      })
      .with({ type: "video", content: { src: P.string } }, x => {
        type t = Expect<Equal<typeof x, Video>>
        return 2
      })
      .with({ type: "image" }, x => {
        type t = Expect<Equal<typeof x, Image>>
        return 3
      })
      .exhaustive()
    expect(res).toEqual(1)
  })
  it("should discriminate union types correctly 3", () => {
    type Text = { type: "text"; content: string }
    type Img = { type: "img"; src: string }
    type Video = { type: "video"; src: string }
    type Story = {
      type: "story"
      likes: number
      views: number
      author: string
      src: string
    }
    type Data = Text | Img | Video | Story
    type Ok<T> = { type: "ok"; data: T }
    type ResError<T> = { type: "error"; error: T }
    type Result<TError, TOk> = Ok<TOk> | ResError<TError>
    const result = {
      type: "ok",
      data: { type: "img", src: "hello.com" },
    } as Result<Error, Data>
    const ouput = match(result)
      .with({ type: "ok", data: { type: "text" } }, res => {
        type t = Expect<Equal<typeof res, Ok<Text>>>
        return `<p>${res.data.content}</p>`
      })
      .with({ type: "ok", data: { type: "img" } }, res => {
        type t = Expect<Equal<typeof res, Ok<Img>>>
        return `<img src="${res.data.src}" />`
      })
      .with({ type: "ok", data: { type: "story", likes: 10 } }, res => {
        type t = Expect<Equal<typeof res, Ok<Story>>>
        return `<div>story with ${res.data.likes} likes</div>`
      })
      .with({ type: "error" }, res => {
        type t = Expect<Equal<typeof res, ResError<Error>>>
        return "<p>Oups! An error occured</p>"
      })
      .otherwise(() => "<p>everything else</p>")
    expect(ouput).toEqual('<img src="hello.com" />')
  })
  it("Issue #41 — should be possible to pattern match on error objects", () => {
    type ServerError = Error & {
      response: Response
      result: Record<string, any>
      statusCode: number
    }
    type ServerParseError = Error & {
      response: Response
      statusCode: number
      bodyText: string
    }
    type Input = Error | ServerError | ServerParseError | undefined
    const networkError = new Error() as Input
    const message = match(networkError)
      .with(
        { statusCode: 401, name: P.string, message: P.string },
        x => "Not Authenticated"
      )
      .with(
        { statusCode: 403, name: "", message: "" },
        x => "Permission Denied"
      )
      .otherwise(() => "Network Error")
    expect(message).toBe("Network Error")
  })
})
import { Expect, Equal } from "../src/types/helpers"
import { match, P, Pattern } from "../src"
import { Option, State } from "./types-catalog/utils"
describe("when", () => {
  it("should work for simple cases", () => {
    const values = [
      { value: 1, expected: false },
      { value: -2, expected: false },
      { value: 3, expected: false },
      { value: 100, expected: false },
      { value: 20, expected: true },
      { value: 39, expected: true },
    ]
    values.forEach(({ value, expected }) => {
      expect(
        match(value)
          .with(
            P.typed<number>().when(x => x > 10 && x < 50),
            () => true
          )
          .otherwise(() => false)
      ).toEqual(expected)
    })
  })
  it("should narrow down the value type based on type guard", () => {
    let n = 20
    const res = match(n)
      .with(
        P.when((x): x is 13 => x === 13),
        x => {
          type t = Expect<Equal<typeof x, 13>>
          return true
        }
      )
      .otherwise(() => false)
    type t = Expect<Equal<typeof res, boolean>>
  })
  it("should be able to correcly narrow a generic types", () => {
    const map = <A, B>(option: Option<A>, mapper: (value: A) => B): Option<B> =>
      match<Option<A>, Option<B>>(option)
        .when(
          (option): option is { kind: "some"; value: A } =>
            option.kind === "some",
          option => ({
            kind: "some",
            value: mapper(option.value),
          })
        )
        .when(
          (option): option is { kind: "none" } => option.kind === "none",
          option => option
        )
        .run()
    const input = { kind: "some" as const, value: 20 }
    const expectedOutput = { kind: "some" as const, value: `number is 20` }
    const res = map(input, x => `number is ${x}`)
    type t = Expect<Equal<typeof res, Option<string>>>
    expect(res).toEqual(expectedOutput)
  })
  it("should correctly infer the input type, even when used in another function pattern", () => {
    const f = (x: { a: number[] }) =>
      match(x)
        .with(
          {
            a: P.array(
              P.when(x => {
                type t = Expect<Equal<typeof x, number>>
                return true
              })
            ),
          },
          () => "true"
        )
        .otherwise(() => "false")
  })
  it("should accept other values  than booleans in output", () => {
    const f = (x: { a: number[] }) =>
      match(x)
        .with(
          {
            a: P.when(() => {
              return "anything truthy"
            }),
          },
          () => "true"
        )
        .otherwise(() => "false")
    expect(f({ a: [] })).toEqual("true")
  })
  describe("`with` with `when` clauses", () => {
    it("should work for simple cases", () => {
      const values: { value: State; expected: boolean }[] = [
        { value: { status: "success", data: "yo" }, expected: false },
        { value: { status: "success", data: "coucou" }, expected: true },
        { value: { status: "idle" }, expected: false },
        { value: { status: "loading" }, expected: false },
      ]
      values.forEach(({ value, expected }) => {
        expect(
          match(value)
            .with(
              { status: "success" },
              x => x.data.length > 3,
              x => {
                type t = Expect<
                  Equal<typeof x, { status: "success"; data: string }>
                >
                return true
              }
            )
            .with(
              { status: "success", data: P.select("data") },
              x => x.data.length > 3 && x.data.length < 10,
              x => {
                type t = Expect<Equal<typeof x, { data: string }>>
                return true
              }
            )
            .with(
              { status: "success", data: P.select("data") },
              x => x.data.length > 3 && x.data.length < 10 && x.data.length % 2,
              x => {
                type t = Expect<Equal<typeof x, { data: string }>>
                return true
              }
            )
            .otherwise(() => false)
        ).toEqual(expected)
      })
    })
    it("type should be refined in each guard clause", () => {
      const values: { value: number | string; expected: string }[] = [
        { value: -1, expected: "x: number" },
        { value: 2, expected: "2" },
        { value: 5, expected: "2 < x < 10" },
        { value: 100, expected: "x: number" },
        { value: "100", expected: "2 < x.length < 10" },
        { value: "Gabriel Vergnaud", expected: "x: string" },
      ]
      values.forEach(({ value, expected }) => {
        const res = match(value)
          .with(
            P.any,
            (x): x is 2 => x === 2,
            x => {
              type t = Expect<Equal<typeof x, 2>>
              return "2"
            }
          )
          .with(
            P.string,
            x => x.length > 2 && x.length < 10,
            () => "2 < x.length < 10"
          )
          .with(
            P.number,
            x => x > 2 && x < 10,
            () => "2 < x < 10"
          )
          .with(
            P.any,
            (x): x is number => typeof x === "number",
            x => {
              type t = Expect<Equal<typeof x, number>>
              return "x: number"
            }
          )
          .with(P.string, () => "x: string")
          .exhaustive()
        expect(res).toEqual(expected)
      })
    })
  })
  it("should narrow the type of the input based on the pattern", () => {
    type Option<T> = { type: "some"; value: T } | { type: "none" }
    const optionalFizzBuzz = (
      optionalNumber: Option<{
        opt?: "x" | "y"
        list: {
          test: "a" | "b"
          sublist: ("z" | "w")[]
          prop: string
          maybe?: string | number
        }[]
        coords: { x: "left" | "right"; y: "top" | "bottom" }
      }>
    ) =>
      match(optionalNumber)
        .with(
          {
            type: "some",
            value: {
              list: P.array({
                test: "a",
                sublist: ["w"],
                maybe: P.optional(P.string),
                prop: P.when(x => {
                  type t = Expect<Equal<typeof x, string>>
                  return true
                }),
              }),
              opt: P.optional("x"),
            },
          },
          x => {
            type t = Expect<
              Equal<
                typeof x,
                {
                  type: "some"
                  value: {
                    opt?: "x" | undefined
                    list: {
                      test: "a"
                      sublist: ["w"]
                      prop: string
                      maybe?: string | undefined
                    }[]
                    coords: {
                      x: "left" | "right"
                      y: "top" | "bottom"
                    }
                  }
                }
              >
            >
            return "ok"
          }
        )
        .with(
          {
            type: "some",
            value: {
              coords: P.not({ x: "left" }),
            },
          },
          x => {
            type t = Expect<
              Equal<
                typeof x["value"]["coords"],
                {
                  y: "top" | "bottom"
                  x: "right"
                }
              >
            >
            return "ok"
          }
        )
        .with(
          {
            type: "some",
            value: {
              list: P.array({ test: "a", prop: P.select() }),
            },
          },
          x => {
            type t = Expect<Equal<typeof x, string[]>>
          }
        )
        .with({ type: "none" }, () => null)
        .with({ type: "some" }, () => "ok")
        .exhaustive()
  })
  it("should narrow the type of the input based on the pattern", () => {
    const optionalFizzBuzz = (optionalNumber: Option<number>) =>
      match(optionalNumber)
        // You can add up to 3 guard functions after your
        // pattern. They must all return true for the
        // handler to be executed.
        .with(
          { kind: "some" },
          // `someNumber` is inferred to be a { kind: "some"; value: number }
          // based on the pattern provided as first argument.
          someNumber =>
            someNumber.value % 5 === 0 && someNumber.value % 3 === 0,
          () => "fizzbuzz"
        )
        .with(
          {
            kind: "some",
          },
          // you can also use destructuring
          ({ value }) => value % 5 === 0,
          () => "buzz"
        )
        // Or you can use a `when` pattern, to apply your guard to
        // a subset of your input.
        .with(
          {
            kind: "some",
            value: Pattern.when(value => value % 3 === 0),
          },
          () => "fizz"
        )
        // for all other numbers, just convert them to a string.
        .with({ kind: "some" }, ({ value }) => value.toString())
        // if it's a none, return "nope"
        .with({ kind: "none" }, () => "nope")
        .exhaustive()
  })
  it("should be possible to hard code type parameters to P.when", () => {
    const regex = <input>(expr: RegExp) =>
      P.when<
        input | string, // input
        string, // narrowed value
        never // types excluded
      >((x): x is string => typeof x === "string" && expr.test(x))
    type Input = string | { prop: string | number }
    expect(
      match<Input>("Hello")
        .with(regex(/^H/), () => true)
        .with({ prop: regex(/^H/) }, x => {
          type t = Expect<Equal<typeof x, { prop: string }>>
          return true
        })
        // @ts-expect-error
        .exhaustive()
    ).toBe(true)
  })
  it("should be possible to do some manipulations on the input type", () => {
    const notString = <input>() =>
      P.when<
        input | string, // input
        Exclude<input, string>, // narrowed value
        never // types excluded
      >((x): x is Exclude<input, string> => typeof x !== "string")
    type Input = { prop: string | number }
    expect(
      match<Input>({ prop: 20 })
        .with({ prop: notString() }, x => {
          type t = Expect<Equal<typeof x, { prop: number }>>
          return true
        })
        // @ts-expect-error
        .exhaustive()
    ).toBe(true)
  })
})
import { Expect, Equal } from "../src/types/helpers"
import { match, P } from "../src"
import { Blog } from "./types-catalog/utils"
describe("wildcards", () => {
  it("should match String wildcards", () => {
    const res = match<string | number | boolean | null | undefined>("")
      .with(NaN, () => "")
      .with(P.string, x => {
        type t = Expect<Equal<typeof x, string>>
        return true
      })
      .otherwise(() => false)
    expect(res).toEqual(true)
  })
  it("should match Number wildcards", () => {
    const res = match<string | number | boolean | null | undefined>(2)
      .with(P.number, x => {
        type t = Expect<Equal<typeof x, number>>
        return true
      })
      .otherwise(() => false)
    expect(res).toEqual(true)
  })
  it("should match Boolean wildcards", () => {
    const res = match<string | number | boolean | null | undefined>(true)
      .with(P.boolean, x => {
        type t = Expect<Equal<typeof x, boolean>>
        return true
      })
      .otherwise(() => false)
    expect(res).toEqual(true)
  })
  it("should match nullish wildcard", () => {
    const res = match<string | number | boolean | null | undefined>(null)
      .with(P.nullish, x => {
        type t = Expect<Equal<typeof x, null | undefined>>
        return true
      })
      .otherwise(() => false)
    const res2 = match<string | number | boolean | null | undefined>(undefined)
      .with(P.nullish, x => {
        type t = Expect<Equal<typeof x, null | undefined>>
        return true
      })
      .otherwise(() => false)
    expect(res).toEqual(true)
    expect(res2).toEqual(true)
  })
  it("should match String, Number and Boolean wildcards", () => {
    // Will be { id: number, title: string } | { errorMessage: string }
    let httpResult = {
      id: 20,
      title: "hellooo",
    } /* API logic. */
    const res = match<any, Blog | Error>(httpResult)
      .with({ id: P.number, title: P.string }, r => ({
        id: r.id,
        title: r.title,
      }))
      .with({ errorMessage: P.string }, r => new Error(r.errorMessage))
      .otherwise(() => new Error("Client parse error"))
    expect(res).toEqual({
      id: 20,
      title: "hellooo",
    })
  })
  it("should infer correctly negated String wildcards", () => {
    const res = match<string | number | boolean>("")
      .with(P.not(P.string), x => {
        type t = Expect<Equal<typeof x, number | boolean>>
        return true
      })
      .otherwise(() => false)
    expect(res).toEqual(false)
  })
  it("should infer correctly negated Number wildcards", () => {
    const res = match<string | number | boolean>(2)
      .with(P.not(P.number), x => {
        type t = Expect<Equal<typeof x, string | boolean>>
        return true
      })
      .otherwise(() => false)
    expect(res).toEqual(false)
  })
  it("should infer correctly negated Boolean wildcards", () => {
    const res = match<string | number | boolean>(true)
      .with(P.not(P.boolean), x => {
        type t = Expect<Equal<typeof x, string | number>>
        return true
      })
      .otherwise(() => false)
    expect(res).toEqual(false)
  })
  it("when used as an object property pattern, it shouldn't match if the key isn't defined on the object.", () => {
    type Id = { teamId: number } | { storeId: number }
    const selectedId: Id = { teamId: 1 }
    const res = match<Id>(selectedId)
      .with({ storeId: P._ }, () => "storeId")
      .with({ teamId: P._ }, () => "teamId")
      .exhaustive()
    expect(res).toEqual("teamId")
  })
  describe("catch all", () => {
    const allValueTypes = [
      undefined,
      null,
      Symbol(2),
      2,
      "string",
      true,
      () => {},
      {},
      [],
      new Map(),
      new Set(),
    ]
    allValueTypes.forEach(value => {
      it(`should match ${typeof value} values`, () => {
        expect(
          match(value)
            .with(P._, () => "yes")
            .run()
        ).toEqual("yes")
      })
    })
  })
})
