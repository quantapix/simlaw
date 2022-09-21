export const toExclude = Symbol("@ts-pattern/to-exclude")
export type toExclude = typeof toExclude

export const matcher = Symbol("@ts-pattern/matcher")
export type matcher = typeof matcher

export const unset = Symbol("@ts-pattern/unset")
export type unset = typeof unset

export const anonymousSelectKey = "@ts-pattern/anonymous-select-key"
export type anonymousSelectKey = typeof anonymousSelectKey

export type DeepExclude<a, b> = Exclude<DistributeMatchingUnions<a, b>, b>

export type BuildMany<data, xs extends any[]> = xs extends any
  ? BuildOne<data, xs>
  : never

type BuildOne<data, xs extends any[]> = xs extends [
  [infer value, infer path],
  ...infer tail
]
  ? BuildOne<Update<data, value, Cast<path, PropertyKey[]>>, tail>
  : data

type SafeGet<data, k extends PropertyKey, def> = k extends keyof data
  ? data[k]
  : def

type Update<data, value, path extends PropertyKey[]> = path extends [
  infer head,
  ...infer tail
]
  ? data extends readonly [any, ...any]
    ? head extends number
      ? UpdateAt<
          data,
          Iterator<head>,
          Update<data[head], value, Cast<tail, PropertyKey[]>>
        >
      : never
    : data extends readonly (infer a)[]
    ? Update<a, value, Cast<tail, PropertyKey[]>>[]
    : data extends Set<infer a>
    ? Set<Update<a, value, Cast<tail, PropertyKey[]>>>
    : data extends Map<infer k, infer v>
    ? Map<k, Update<v, value, Cast<tail, PropertyKey[]>>>
    : Compute<
        Omit<data, Cast<head, PropertyKey>> & {
          [k in Cast<head, PropertyKey>]: Update<
            SafeGet<data, k, {}>,
            value,
            Cast<tail, PropertyKey[]>
          >
        }
      >
  : value

export type DistributeMatchingUnions<a, p> = IsAny<a> extends true
  ? any
  : BuildMany<a, Distribute<FindUnionsMany<a, p>>>

export type FindUnionsMany<
  a,
  p,
  path extends PropertyKey[] = []
> = UnionToTuple<
  (
    p extends any
      ? IsMatching<a, p> extends true
        ? FindUnions<a, p, path>
        : []
      : never
  ) extends (infer T)[]
    ? T
    : never
>

export type FindUnions<
  a,
  p,
  path extends PropertyKey[] = []
> = unknown extends p
  ? []
  : IsAny<p> extends true
  ? []
  : Length<path> extends 5
  ? []
  : IsUnion<a> extends true
  ? [
      {
        cases: a extends any
          ? {
              value: a
              subUnions: FindUnionsMany<a, p, path>
            }
          : never
        path: path
      }
    ]
  : [a, p] extends [readonly any[], readonly any[]]
  ? [a, p] extends [
      readonly [infer a1, infer a2, infer a3, infer a4, infer a5],
      readonly [infer p1, infer p2, infer p3, infer p4, infer p5]
    ]
    ? [
        ...FindUnions<a1, p1, [...path, 0]>,
        ...FindUnions<a2, p2, [...path, 1]>,
        ...FindUnions<a3, p3, [...path, 2]>,
        ...FindUnions<a4, p4, [...path, 3]>,
        ...FindUnions<a5, p5, [...path, 4]>
      ]
    : [a, p] extends [
        readonly [infer a1, infer a2, infer a3, infer a4],
        readonly [infer p1, infer p2, infer p3, infer p4]
      ]
    ? [
        ...FindUnions<a1, p1, [...path, 0]>,
        ...FindUnions<a2, p2, [...path, 1]>,
        ...FindUnions<a3, p3, [...path, 2]>,
        ...FindUnions<a4, p4, [...path, 3]>
      ]
    : [a, p] extends [
        readonly [infer a1, infer a2, infer a3],
        readonly [infer p1, infer p2, infer p3]
      ]
    ? [
        ...FindUnions<a1, p1, [...path, 0]>,
        ...FindUnions<a2, p2, [...path, 1]>,
        ...FindUnions<a3, p3, [...path, 2]>
      ]
    : [a, p] extends [
        readonly [infer a1, infer a2],
        readonly [infer p1, infer p2]
      ]
    ? [...FindUnions<a1, p1, [...path, 0]>, ...FindUnions<a2, p2, [...path, 1]>]
    : [a, p] extends [readonly [infer a1], readonly [infer p1]]
    ? FindUnions<a1, p1, [...path, 0]>
    : []
  : a extends Set<any>
  ? []
  : a extends Map<any, any>
  ? []
  : [IsPlainObject<a>, IsPlainObject<p>] extends [true, true]
  ? Flatten<
      Values<{
        [k in keyof a & keyof p]: FindUnions<a[k], p[k], [...path, k]>
      }>
    >
  : []

export type Distribute<unions extends any[]> = unions extends [
  { cases: infer cases; path: infer path },
  ...infer tail
]
  ? cases extends { value: infer value; subUnions: infer subUnions }
    ? [
        [value, path],
        ...Distribute<Cast<subUnions, any[]>>,
        ...Distribute<tail>
      ]
    : never
  : []

export type ExtractPreciseValue<a, b> = unknown extends b
  ? a
  : IsAny<a> extends true
  ? b
  : b extends readonly []
  ? []
  : b extends ToExclude<infer b1>
  ? DeepExclude<a, b1>
  : b extends readonly (infer bItem)[]
  ? a extends readonly (infer aItem)[]
    ? b extends readonly [infer b1, infer b2, infer b3, infer b4, infer b5]
      ? a extends readonly [infer a1, infer a2, infer a3, infer a4, infer a5]
        ? ExcludeObjectIfContainsNever<
            [
              ExtractPreciseValue<a1, b1>,
              ExtractPreciseValue<a2, b2>,
              ExtractPreciseValue<a3, b3>,
              ExtractPreciseValue<a4, b4>,
              ExtractPreciseValue<a5, b5>
            ],
            "0" | "1" | "2" | "3" | "4"
          >
        : LeastUpperBound<a, b>
      : b extends readonly [infer b1, infer b2, infer b3, infer b4]
      ? a extends readonly [infer a1, infer a2, infer a3, infer a4]
        ? ExcludeObjectIfContainsNever<
            [
              ExtractPreciseValue<a1, b1>,
              ExtractPreciseValue<a2, b2>,
              ExtractPreciseValue<a3, b3>,
              ExtractPreciseValue<a4, b4>
            ],
            "0" | "1" | "2" | "3"
          >
        : LeastUpperBound<a, b>
      : b extends readonly [infer b1, infer b2, infer b3]
      ? a extends readonly [infer a1, infer a2, infer a3]
        ? ExcludeObjectIfContainsNever<
            [
              ExtractPreciseValue<a1, b1>,
              ExtractPreciseValue<a2, b2>,
              ExtractPreciseValue<a3, b3>
            ],
            "0" | "1" | "2"
          >
        : LeastUpperBound<a, b>
      : b extends readonly [infer b1, infer b2]
      ? a extends readonly [infer a1, infer a2]
        ? ExcludeObjectIfContainsNever<
            [ExtractPreciseValue<a1, b1>, ExtractPreciseValue<a2, b2>],
            "0" | "1"
          >
        : LeastUpperBound<a, b>
      : b extends readonly [infer b1]
      ? a extends readonly [infer a1]
        ? ExcludeObjectIfContainsNever<[ExtractPreciseValue<a1, b1>], "0">
        : LeastUpperBound<a, b>
      : ExtractPreciseValue<aItem, bItem> extends infer preciseValue
      ? [preciseValue] extends [never]
        ? never
        : preciseValue[]
      : never
    : LeastUpperBound<a, b>
  : b extends Map<infer bk, infer bv>
  ? a extends Map<infer ak, infer av>
    ? Map<ExtractPreciseValue<ak, bk>, ExtractPreciseValue<av, bv>>
    : LeastUpperBound<a, b>
  : b extends Set<infer bv>
  ? a extends Set<infer av>
    ? Set<ExtractPreciseValue<av, bv>>
    : LeastUpperBound<a, b>
  : IsPlainObject<b, BuiltInObjects | Error> extends true
  ? a extends object
    ? a extends b
      ? a
      : b extends a
      ? b
      : [keyof a & keyof b] extends [never]
      ? never
      : ExcludeObjectIfContainsNever<
          Compute<
            {
              [k in Exclude<keyof a, keyof b>]: a[k]
            } & {
              [k in keyof b]: k extends keyof a
                ? ExtractPreciseValue<a[k], b[k]>
                : b[k]
            }
          >,
          keyof b & string
        >
    : LeastUpperBound<a, b>
  : LeastUpperBound<a, b>

type SelectionsRecord = Record<string, [unknown, unknown[]]>

export type None = {
  type: "none"
}
export type Some<key extends string> = {
  type: "some"
  key: key
}

export type SelectionType = None | Some<string>

type MapOptional<selections> = {
  [k in keyof selections]: selections[k] extends [infer v, infer subpath]
    ? [v | undefined, subpath]
    : never
}

type MapList<selections> = {
  [k in keyof selections]: selections[k] extends [infer v, infer subpath]
    ? [v[], subpath]
    : never
}

type ReduceFindSelectionUnion<
  i,
  ps extends any[],
  output = never
> = ps extends [infer head, ...infer tail]
  ? ReduceFindSelectionUnion<i, tail, output | FindSelectionUnion<i, head>>
  : output

export type FindSelectionUnion<
  i,
  p,
  path extends any[] = []
> = IsAny<i> extends true
  ? never
  : p extends Matcher<any, infer pattern, infer matcherType, infer sel>
  ? {
      select: sel extends Some<infer k>
        ? { [kk in k]: [i, path] } | FindSelectionUnion<i, pattern, path>
        : never
      array: i extends (infer ii)[]
        ? MapList<FindSelectionUnion<ii, pattern>>
        : never
      optional: MapOptional<FindSelectionUnion<i, pattern>>
      or: MapOptional<ReduceFindSelectionUnion<i, Cast<pattern, any[]>>>
      and: ReduceFindSelectionUnion<i, Cast<pattern, any[]>>
      not: never
      default: sel extends Some<infer k> ? { [kk in k]: [i, path] } : never
    }[matcherType]
  : p extends readonly (infer pp)[]
  ? i extends readonly (infer ii)[]
    ? p extends readonly [any, ...any[]]
      ? i extends readonly [any, ...any[]]
        ? {
            [k in TupleKeys & keyof i & keyof p]: FindSelectionUnion<
              i[k],
              p[k],
              [...path, k]
            >
          }[TupleKeys & keyof i & keyof p]
        : FindSelectionUnion<ii, p[number], [...path, 0]>
      : FindSelectionUnion<ii, pp, [...path, 0]>
    : never
  : p extends object
  ? i extends object
    ? {
        [k in keyof p]: k extends keyof i
          ? FindSelectionUnion<i[k], p[k], [...path, k]>
          : never
      }[keyof p]
    : never
  : never

export type SeveralAnonymousSelectError<
  a = "You can only use a single anonymous selection (with `select()`) in your pattern. If you need to select multiple values, give them names with `select(<name>)` instead"
> = {
  __error: never
} & a

export type MixedNamedAndAnonymousSelectError<
  a = 'Mixing named selections (`select("name")`) and anonymous selections (`select()`) is forbiden. Please, only use named selections.'
> = {
  __error: never
} & a

export type SelectionToArgs<selections extends SelectionsRecord> =
  anonymousSelectKey extends keyof selections
    ? [selections[anonymousSelectKey][1]] extends [never]
      ? SeveralAnonymousSelectError
      : keyof selections extends anonymousSelectKey
      ? selections[anonymousSelectKey][0]
      : MixedNamedAndAnonymousSelectError
    : { [k in keyof selections]: selections[k][0] }

type ConcatSelections<
  a extends SelectionsRecord,
  b extends SelectionsRecord
> = {
  [k in keyof a & keyof b]: [a[k][0] | b[k][0], a[k][1] & b[k][1]]
} & {
  [k in Exclude<keyof a, keyof b>]: a[k]
} & {
  [k in Exclude<keyof b, keyof a>]: b[k]
}

type ReduceToRecord<
  selections extends any[],
  output extends SelectionsRecord = {}
> = selections extends [infer sel, ...infer rest]
  ? ReduceToRecord<rest, ConcatSelections<Cast<sel, SelectionsRecord>, output>>
  : output

export type Selections<i, p> = FindSelectionUnion<i, p> extends infer u
  ? [u] extends [never]
    ? i
    : SelectionToArgs<ReduceToRecord<UnionToTuple<u>>>
  : i

export type FindSelected<i, p> = Equal<p, Pattern<i>> extends true
  ? i
  : Selections<i, p>

type OptionalKeys<p> = ValueOf<{
  [k in keyof p]: p[k] extends Matcher<any, any, infer matcherType>
    ? matcherType extends "optional"
      ? k
      : never
    : never
}>

type ReduceUnion<tuple extends any[], output = never> = tuple extends readonly [
  infer p,
  ...infer tail
]
  ? ReduceUnion<tail, output | InvertPattern<p>>
  : output

type ReduceIntersection<
  tuple extends any[],
  output = unknown
> = tuple extends readonly [infer p, ...infer tail]
  ? ReduceIntersection<tail, output & InvertPattern<p>>
  : output

export type InvertPattern<p> = p extends Matcher<
  infer input,
  infer narrowed,
  infer matcherType,
  any
>
  ? {
      not: ToExclude<InvertPattern<narrowed>>
      select: InvertPattern<narrowed>
      array: InvertPattern<narrowed>[]
      optional: InvertPattern<narrowed> | undefined
      and: ReduceIntersection<Cast<narrowed, any[]>>
      or: ReduceUnion<Cast<narrowed, any[]>>
      default: [narrowed] extends [never] ? input : narrowed
    }[matcherType]
  : p extends Primitives
  ? p
  : p extends readonly (infer pp)[]
  ? p extends readonly [infer p1, infer p2, infer p3, infer p4, infer p5]
    ? [
        InvertPattern<p1>,
        InvertPattern<p2>,
        InvertPattern<p3>,
        InvertPattern<p4>,
        InvertPattern<p5>
      ]
    : p extends readonly [infer p1, infer p2, infer p3, infer p4]
    ? [
        InvertPattern<p1>,
        InvertPattern<p2>,
        InvertPattern<p3>,
        InvertPattern<p4>
      ]
    : p extends readonly [infer p1, infer p2, infer p3]
    ? [InvertPattern<p1>, InvertPattern<p2>, InvertPattern<p3>]
    : p extends readonly [infer p1, infer p2]
    ? [InvertPattern<p1>, InvertPattern<p2>]
    : p extends readonly [infer p1]
    ? [InvertPattern<p1>]
    : p extends readonly []
    ? []
    : InvertPattern<pp>[]
  : p extends Map<infer pk, infer pv>
  ? Map<pk, InvertPattern<pv>>
  : p extends Set<infer pv>
  ? Set<InvertPattern<pv>>
  : IsPlainObject<p> extends true
  ? OptionalKeys<p> extends infer optKeys
    ? [optKeys] extends [never]
      ? {
          [k in Exclude<keyof p, optKeys>]: InvertPattern<p[k]>
        }
      : Compute<
          {
            [k in Exclude<keyof p, optKeys>]: InvertPattern<p[k]>
          } & {
            [k in Cast<optKeys, keyof p>]?: InvertPattern<p[k]>
          }
        >
    : never
  : p

export type ReduceIntersectionForExclude<
  tuple extends any[],
  i,
  output = unknown
> = tuple extends readonly [infer p, ...infer tail]
  ? ReduceIntersectionForExclude<
      tail,
      i,
      output & InvertPatternForExclude<p, i, unknown>
    >
  : output

export type ReduceUnionForExclude<
  tuple extends any[],
  i,
  output = never
> = tuple extends readonly [infer p, ...infer tail]
  ? ReduceUnionForExclude<
      tail,
      i,
      output | InvertPatternForExclude<p, i, never>
    >
  : output

type ExcludeIfExists<a, b> = [b] extends [never]
  ? never
  : DeepExclude<a, b> extends infer excluded
  ? Equal<a, excluded> extends true
    ? unknown
    : excluded
  : never

export type InvertPatternForExclude<p, i, empty = never> = p extends Matcher<
  infer matchableInput,
  infer subpattern,
  infer matcherType,
  any,
  infer excluded
>
  ? {
      select: InvertPatternForExclude<subpattern, i, empty>
      array: i extends readonly (infer ii)[]
        ? InvertPatternForExclude<subpattern, ii, empty>[]
        : empty
      optional: InvertPatternForExclude<subpattern, i, empty> | undefined
      and: ReduceIntersectionForExclude<Cast<subpattern, any[]>, i>
      or: ReduceUnionForExclude<Cast<subpattern, any[]>, i>
      not: ExcludeIfExists<
        unknown extends matchableInput ? i : matchableInput,
        InvertPatternForExclude<subpattern, i>
      >
      default: excluded
    }[matcherType]
  : p extends Primitives
  ? IsLiteral<p> extends true
    ? p
    : IsLiteral<i> extends true
    ? p
    : empty
  : p extends readonly (infer pp)[]
  ? i extends readonly (infer ii)[]
    ? p extends readonly [infer p1, infer p2, infer p3, infer p4, infer p5]
      ? i extends readonly [infer i1, infer i2, infer i3, infer i4, infer i5]
        ? readonly [
            InvertPatternForExclude<p1, i1, empty>,
            InvertPatternForExclude<p2, i2, empty>,
            InvertPatternForExclude<p3, i3, empty>,
            InvertPatternForExclude<p4, i4, empty>,
            InvertPatternForExclude<p5, i5, empty>
          ]
        : empty
      : p extends readonly [infer p1, infer p2, infer p3, infer p4]
      ? i extends readonly [infer i1, infer i2, infer i3, infer i4]
        ? readonly [
            InvertPatternForExclude<p1, i1, empty>,
            InvertPatternForExclude<p2, i2, empty>,
            InvertPatternForExclude<p3, i3, empty>,
            InvertPatternForExclude<p4, i4, empty>
          ]
        : empty
      : p extends readonly [infer p1, infer p2, infer p3]
      ? i extends readonly [infer i1, infer i2, infer i3]
        ? readonly [
            InvertPatternForExclude<p1, i1, empty>,
            InvertPatternForExclude<p2, i2, empty>,
            InvertPatternForExclude<p3, i3, empty>
          ]
        : empty
      : p extends readonly [infer p1, infer p2]
      ? i extends readonly [infer i1, infer i2]
        ? readonly [
            InvertPatternForExclude<p1, i1, empty>,
            InvertPatternForExclude<p2, i2, empty>
          ]
        : empty
      : p extends readonly [infer p1]
      ? i extends readonly [infer i1]
        ? readonly [InvertPatternForExclude<p1, i1, empty>]
        : empty
      : p extends readonly []
      ? []
      : InvertPatternForExclude<pp, ii, empty>[]
    : empty
  : p extends Map<infer pk, infer pv>
  ? i extends Map<any, infer iv>
    ? Map<pk, InvertPatternForExclude<pv, iv, empty>>
    : empty
  : p extends Set<infer pv>
  ? i extends Set<infer iv>
    ? Set<InvertPatternForExclude<pv, iv, empty>>
    : empty
  : IsPlainObject<p> extends true
  ? i extends object
    ? [keyof p & keyof i] extends [never]
      ? empty
      : OptionalKeys<p> extends infer optKeys
      ? [optKeys] extends [never]
        ? {
            readonly [k in keyof p]: k extends keyof i
              ? InvertPatternForExclude<p[k], i[k], empty>
              : InvertPattern<p[k]>
          }
        : Compute<
            {
              readonly [k in Exclude<keyof p, optKeys>]: k extends keyof i
                ? InvertPatternForExclude<p[k], i[k], empty>
                : InvertPattern<p[k]>
            } & {
              readonly [k in Cast<optKeys, keyof p>]?: k extends keyof i
                ? InvertPatternForExclude<p[k], i[k], empty>
                : InvertPattern<p[k]>
            }
          >
      : empty
    : empty
  : empty

export type IsMatching<a, p> = true extends IsUnion<a> | IsUnion<p>
  ? true extends (
      p extends any ? (a extends any ? IsMatching<a, p> : never) : never
    )
    ? true
    : false
  : unknown extends p
  ? true
  : p extends Primitives
  ? p extends a
    ? true
    : false
  : [p, a] extends [readonly any[], readonly any[]]
  ? [p, a] extends [
      readonly [infer p1, infer p2, infer p3, infer p4, infer p5],
      readonly [infer a1, infer a2, infer a3, infer a4, infer a5]
    ]
    ? [
        IsMatching<a1, p1>,
        IsMatching<a2, p2>,
        IsMatching<a3, p3>,
        IsMatching<a4, p4>,
        IsMatching<a5, p5>
      ] extends [true, true, true, true, true]
      ? true
      : false
    : [p, a] extends [
        readonly [infer p1, infer p2, infer p3, infer p4],
        readonly [infer a1, infer a2, infer a3, infer a4]
      ]
    ? [
        IsMatching<a1, p1>,
        IsMatching<a2, p2>,
        IsMatching<a3, p3>,
        IsMatching<a4, p4>
      ] extends [true, true, true, true]
      ? true
      : false
    : [p, a] extends [
        readonly [infer p1, infer p2, infer p3],
        readonly [infer a1, infer a2, infer a3]
      ]
    ? [IsMatching<a1, p1>, IsMatching<a2, p2>, IsMatching<a3, p3>] extends [
        true,
        true,
        true
      ]
      ? true
      : false
    : [p, a] extends [
        readonly [infer p1, infer p2],
        readonly [infer a1, infer a2]
      ]
    ? [IsMatching<a1, p1>, IsMatching<a2, p2>] extends [true, true]
      ? true
      : false
    : [p, a] extends [readonly [infer p1], readonly [infer a1]]
    ? IsMatching<a1, p1>
    : p extends a
    ? true
    : false
  : IsPlainObject<p> extends true
  ? true extends (
      a extends any
        ? [keyof p & keyof a] extends [never]
          ? false
          : { [k in keyof p & keyof a]: IsMatching<a[k], p[k]> }[keyof p &
              keyof a] extends true
          ? true
          : false
        : never
    )
    ? true
    : false
  : p extends a
  ? true
  : false

export type MatchedValue<a, invpattern> = WithDefault<
  ExtractPreciseValue<a, invpattern>,
  a
>

export type PickReturnValue<a, b> = a extends unset ? b : a

type NonExhaustiveError<i> = { __nonExhaustive: never } & i

export type Match<
  i,
  o,
  patternValueTuples extends [any, any][] = [],
  inferredOutput = never
> = {
  with<
    p extends Pattern<i>,
    c,
    value extends MatchedValue<i, InvertPattern<p>>
  >(
    pattern: p,
    handler: (
      selections: FindSelected<value, p>,
      value: value
    ) => PickReturnValue<o, c>
  ): Match<i, o, [...patternValueTuples, [p, value]], Union<inferredOutput, c>>

  with<
    p1 extends Pattern<i>,
    p2 extends Pattern<i>,
    c,
    p extends p1 | p2,
    value extends p extends any ? MatchedValue<i, InvertPattern<p>> : never
  >(
    p1: p1,
    p2: p2,
    handler: (value: value) => PickReturnValue<o, c>
  ): Match<
    i,
    o,
    [...patternValueTuples, [p1, value], [p2, value]],
    Union<inferredOutput, c>
  >

  with<
    p1 extends Pattern<i>,
    p2 extends Pattern<i>,
    p3 extends Pattern<i>,
    ps extends Pattern<i>[],
    c,
    p extends p1 | p2 | p3 | ps[number],
    value extends p extends any ? MatchedValue<i, InvertPattern<p>> : never
  >(
    ...args: [
      p1: p1,
      p2: p2,
      p3: p3,
      ...patterns: ps,
      handler: (value: value) => PickReturnValue<o, c>
    ]
  ): Match<
    i,
    o,
    [
      ...patternValueTuples,
      [p1, value],
      [p2, value],
      [p3, value],
      ...MakeTuples<ps, value>
    ],
    Union<inferredOutput, c>
  >

  with<
    pat extends Pattern<i>,
    pred extends (value: MatchedValue<i, InvertPattern<pat>>) => unknown,
    c,
    value extends GuardValue<pred>
  >(
    pattern: pat,
    predicate: pred,
    handler: (
      selections: FindSelected<value, pat>,
      value: value
    ) => PickReturnValue<o, c>
  ): Match<
    i,
    o,
    pred extends (value: any) => value is infer narrowed
      ? [...patternValueTuples, [Matcher<unknown, narrowed>, value]]
      : patternValueTuples,
    Union<inferredOutput, c>
  >

  when<pred extends (value: i) => unknown, c, value extends GuardValue<pred>>(
    predicate: pred,
    handler: (value: value) => PickReturnValue<o, c>
  ): Match<
    i,
    o,
    pred extends (value: any) => value is infer narrowed
      ? [...patternValueTuples, [Matcher<unknown, narrowed>, value]]
      : patternValueTuples,
    Union<inferredOutput, c>
  >
  otherwise<c>(
    handler: (value: i) => PickReturnValue<o, c>
  ): PickReturnValue<o, Union<inferredOutput, c>>
  exhaustive: DeepExcludeAll<i, patternValueTuples> extends infer remainingCases
    ? [remainingCases] extends [never]
      ? () => PickReturnValue<o, inferredOutput>
      : NonExhaustiveError<remainingCases>
    : never

  run(): PickReturnValue<o, inferredOutput>
}

type DeepExcludeAll<a, tupleList extends any[]> = tupleList extends [
  [infer p, infer v],
  ...infer tail
]
  ? DeepExcludeAll<DeepExclude<a, InvertPatternForExclude<p, v>>, tail>
  : a

type MakeTuples<ps extends any[], value> = {
  -readonly [index in keyof ps]: [ps[index], value]
}

export type MatcherType =
  | "not"
  | "optional"
  | "or"
  | "and"
  | "array"
  | "select"
  | "default"

export type MatcherProtocol<
  input,
  narrowed,
  matcherType extends MatcherType,
  selections extends SelectionType,
  excluded
> = {
  match: <I>(value: I | input) => MatchResult
  getSelectionKeys?: () => string[]
  matcherType?: matcherType
}

export type MatchResult = {
  matched: boolean
  selections?: Record<string, any>
}

export interface Matcher<
  input,
  narrowed,
  matcherType extends MatcherType = "default",
  selections extends SelectionType = None,
  excluded = narrowed
> {
  [matcher](): MatcherProtocol<
    input,
    narrowed,
    matcherType,
    selections,
    excluded
  >
}

type UnknownMatcher = Matcher<unknown, unknown, any, any>

export type OptionalP<input, p> = Matcher<input, p, "optional">

export type ArrayP<input, p> = Matcher<input, p, "array">

export type AndP<input, ps> = Matcher<input, ps, "and">

export type OrP<input, ps> = Matcher<input, ps, "or">

export type NotP<input, p> = Matcher<input, p, "not">

export type GuardP<input, narrowed> = Matcher<input, narrowed>

export type GuardExcludeP<input, narrowed, excluded> = Matcher<
  input,
  narrowed,
  "default",
  None,
  excluded
>

export type SelectP<
  key extends string,
  input = unknown,
  p = Matcher<unknown, unknown>
> = Matcher<input, p, "select", Some<key>>

export type AnonymousSelectP = SelectP<anonymousSelectKey>

export interface ToExclude<a> {
  [toExclude]: a
}

export type UnknownPattern =
  | readonly []
  | readonly [UnknownPattern, ...UnknownPattern[]]
  | { readonly [k: string]: UnknownPattern }
  | Set<UnknownPattern>
  | Map<unknown, UnknownPattern>
  | Primitives
  | UnknownMatcher

export type Pattern<a> =
  | Matcher<a, unknown, any, any>
  | (a extends Primitives
      ? a
      : unknown extends a
      ? UnknownPattern
      : a extends readonly (infer i)[]
      ? a extends readonly [any, ...any]
        ? { readonly [index in keyof a]: Pattern<a[index]> }
        : readonly [] | readonly [Pattern<i>, ...Pattern<i>[]]
      : a extends Map<infer k, infer v>
      ? Map<k, Pattern<v>>
      : a extends Set<infer v>
      ? Set<Pattern<v>>
      : a extends object
      ? { readonly [k in keyof a]?: Pattern<Exclude<a[k], undefined>> }
      : a)
export type ValueOf<a> = a extends any[] ? a[number] : a[keyof a]

export type Values<a extends object> = UnionToTuple<ValueOf<a>>

export type LeastUpperBound<a, b> = b extends a ? b : a extends b ? a : never

export type ExcludeIfContainsNever<a, b> = b extends Map<any, any> | Set<any>
  ? a
  : b extends readonly [any, ...any]
  ? ExcludeObjectIfContainsNever<a, keyof b & ("0" | "1" | "2" | "3" | "4")>
  : b extends any[]
  ? ExcludeObjectIfContainsNever<a, keyof b & number>
  : ExcludeObjectIfContainsNever<a, keyof b & string>

export type ExcludeObjectIfContainsNever<
  a,
  keyConstraint = unknown
> = a extends any
  ? "exclude" extends {
      [k in keyConstraint & keyof a]-?: [a[k]] extends [never]
        ? "exclude"
        : "include"
    }[keyConstraint & keyof a]
    ? never
    : a
  : never

export type UnionToIntersection<union> = (
  union extends any ? (k: union) => void : never
) extends (k: infer intersection) => void
  ? intersection
  : never

export type IsUnion<a> = [a] extends [UnionToIntersection<a>] ? false : true

export type UnionToTuple<
  union,
  output extends any[] = []
> = UnionToIntersection<
  union extends any ? (t: union) => union : never
> extends (_: any) => infer elem
  ? UnionToTuple<Exclude<union, elem>, [elem, ...output]>
  : output

export type Cast<a, b> = a extends b ? a : never

export type Flatten<
  xs extends any[],
  output extends any[] = []
> = xs extends readonly [infer head, ...infer tail]
  ? Flatten<tail, [...output, ...Cast<head, any[]>]>
  : output

export type Equal<a, b> = (<T>() => T extends a ? 1 : 2) extends <
  T
>() => T extends b ? 1 : 2
  ? true
  : false

export type Expect<a extends true> = a

export type IsAny<a> = 0 extends 1 & a ? true : false

export type Length<it extends readonly any[]> = it["length"]

export type Iterator<
  n extends number,
  it extends any[] = []
> = it["length"] extends n ? it : Iterator<n, [any, ...it]>

export type Next<it extends any[]> = [any, ...it]
export type Prev<it extends any[]> = it extends readonly [any, ...infer tail]
  ? tail
  : []

export type Take<
  xs extends readonly any[],
  it extends any[],
  output extends any[] = []
> = Length<it> extends 0
  ? output
  : xs extends readonly [infer head, ...infer tail]
  ? Take<tail, Prev<it>, [...output, head]>
  : output

export type Drop<
  xs extends readonly any[],
  n extends any[]
> = Length<n> extends 0
  ? xs
  : xs extends readonly [any, ...infer tail]
  ? Drop<tail, Prev<n>>
  : []

export type UpdateAt<
  tail extends readonly any[],
  n extends any[],
  value,
  inits extends readonly any[] = []
> = Length<n> extends 0
  ? tail extends readonly [any, ...infer tail]
    ? [...inits, value, ...tail]
    : inits
  : tail extends readonly [infer head, ...infer tail]
  ? UpdateAt<tail, Prev<n>, value, [...inits, head]>
  : inits

export type BuiltInObjects =
  | Function
  | Date
  | RegExp
  | Generator
  | { readonly [Symbol.toStringTag]: string }
  | any[]

export type IsPlainObject<o, excludeUnion = BuiltInObjects> = o extends object
  ? o extends string | excludeUnion
    ? false
    : true
  : false

export type Compute<a> = a extends BuiltInObjects ? a : { [k in keyof a]: a[k] }

export type IntersectObjects<a> = (
  a extends any ? keyof a : never
) extends infer allKeys
  ? {
      [k in Cast<allKeys, PropertyKey>]: a extends any
        ? k extends keyof a
          ? a[k]
          : never
        : never
    }
  : never

export type WithDefault<a, def> = [a] extends [never] ? def : a

export type IsLiteral<a> = a extends null | undefined
  ? true
  : a extends string
  ? string extends a
    ? false
    : true
  : a extends number
  ? number extends a
    ? false
    : true
  : a extends boolean
  ? boolean extends a
    ? false
    : true
  : a extends symbol
  ? symbol extends a
    ? false
    : true
  : a extends bigint
  ? bigint extends a
    ? false
    : true
  : false

export type Primitives =
  | number
  | boolean
  | string
  | undefined
  | null
  | symbol
  | bigint

export type TupleKeys = 0 | 1 | 2 | 3 | 4

export type Union<a, b> = [b] extends [a] ? a : [a] extends [b] ? b : a | b

export type GuardValue<fn> = fn extends (value: any) => value is infer b
  ? b
  : fn extends (value: infer a) => unknown
  ? a
  : never

export type GuardFunction<input, narrowed> =
  | ((value: input) => value is Cast<narrowed, input>)
  | ((value: input) => boolean)
