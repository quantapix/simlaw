import * as qt from "./types.js"
import * as qu from "./utils.js"

export function isMatching<p extends qt.Pattern<any>>(
  pattern: p
): (value: any) => value is qt.MatchedValue<any, Infer<p>>

export function isMatching<p extends qt.Pattern<any>>(pattern: p, value: any): value is qt.MatchedValue<any, Infer<p>>

export function isMatching<p extends qt.Pattern<any>>(
  ...args: [pattern: p, value?: any]
): boolean | ((vale: any) => boolean) {
  if (args.length === 1) {
    const [pattern] = args
    return (value: any): value is qt.MatchedValue<any, Infer<p>> => qu.matchPattern(pattern, value, () => {})
  }
  if (args.length === 2) {
    const [pattern, value] = args
    return qu.matchPattern(pattern, value, () => {})
  }
  throw new Error(`isMatching wasn't given the right number of arguments: expected 1 or 2, received ${args.length}.`)
}

export const match = <input, output = qt.unset>(value: input): qt.Match<input, output> =>
  new MatchExpression(value, []) as any

class MatchExpression<i, o> {
  constructor(
    private value: i,
    private cases: {
      match: (value: i) => { matched: boolean; value: any }
      handler: (...args: any) => any
    }[]
  ) {}
  with(...args: any[]) {
    const handler = args[args.length - 1]
    const patterns: qt.Pattern<i>[] = [args[0]]
    const predicates: ((value: i) => unknown)[] = []
    // case with guard as second argument
    if (args.length === 3 && typeof args[1] === "function") {
      patterns.push(args[0])
      predicates.push(args[1])
    } else if (args.length > 2) {
      // case with several patterns
      patterns.push(...args.slice(1, args.length - 1))
    }
    return new MatchExpression(
      this.value,
      this.cases.concat([
        {
          match: (value: i) => {
            const selected: Record<string, unknown> = {}
            const matched = Boolean(
              patterns.some(pattern =>
                qu.matchPattern(pattern, value, (key, value) => {
                  selected[key] = value
                })
              ) && predicates.every(predicate => predicate(value as any))
            )
            return {
              matched,
              value:
                matched && Object.keys(selected).length
                  ? qt.anonymousSelectKey in selected
                    ? selected[qt.anonymousSelectKey]
                    : selected
                  : value,
            }
          },
          handler,
        },
      ])
    )
  }
  when<p extends (value: i) => unknown, c>(
    predicate: p,
    handler: (value: qt.GuardValue<p>) => qt.PickReturnValue<o, c>
  ) {
    return new MatchExpression<i, qt.PickReturnValue<o, c>>(
      this.value,
      this.cases.concat([
        {
          match: value => ({
            matched: Boolean(predicate(value)),
            value,
          }),
          handler,
        },
      ])
    )
  }
  otherwise<c>(handler: (value: i) => qt.PickReturnValue<o, c>): qt.PickReturnValue<o, c> {
    return new MatchExpression<i, qt.PickReturnValue<o, c>>(
      this.value,
      this.cases.concat([
        {
          match: value => ({
            matched: true,
            value,
          }),
          handler,
        },
      ])
    ).run()
  }
  exhaustive() {
    return this.run()
  }
  run() {
    let selected = this.value
    let handler: undefined | ((...args: any) => any) = undefined
    for (let i = 0; i < this.cases.length; i++) {
      const entry = this.cases[i]!
      const matchResult = entry.match(this.value)
      if (matchResult.matched) {
        selected = matchResult.value
        handler = entry.handler
        break
      }
    }
    if (!handler) {
      let displayedValue
      try {
        displayedValue = JSON.stringify(this.value)
      } catch (e) {
        displayedValue = this.value
      }
      throw new Error(`Pattern matching error: no pattern matches value ${displayedValue}`)
    }
    return handler(selected, this.value)
  }
}

export type Infer<p extends qt.Pattern<any>> = qt.InvertPattern<p>

export function optional<input, p extends unknown extends input ? qt.UnknownPattern : qt.Pattern<input>>(
  pattern: p
): qt.OptionalP<input, p> {
  return {
    [qt.matcher]() {
      return {
        match: <I>(value: I | input) => {
          const selections: Record<string, unknown[]> = {}
          const selector = (key: string, value: any) => {
            selections[key] = value
          }
          if (value === undefined) {
            qu.getSelectionKeys(pattern).forEach(key => selector(key, undefined))
            return { matched: true, selections }
          }
          const matched = qu.matchPattern(pattern, value, selector)
          return { matched, selections }
        },
        getSelectionKeys: () => qu.getSelectionKeys(pattern),
        matcherType: "optional",
      }
    },
  }
}

type Elem<xs> = xs extends Array<infer x> ? x : never

export function array<input, p extends unknown extends input ? qt.UnknownPattern : qt.Pattern<Elem<input>>>(
  pattern: p
): qt.ArrayP<input, p> {
  return {
    [qt.matcher]() {
      return {
        match: <I>(value: I | input) => {
          if (!Array.isArray(value)) return { matched: false }
          const selections: Record<string, unknown[]> = {}
          if (value.length === 0) {
            qu.getSelectionKeys(pattern).forEach(key => {
              selections[key] = []
            })
            return { matched: true, selections }
          }
          const selector = (key: string, value: unknown) => {
            selections[key] = (selections[key] || []).concat([value])
          }
          const matched = value.every(v => qu.matchPattern(pattern, v, selector))
          return { matched, selections }
        },
        getSelectionKeys: () => qu.getSelectionKeys(pattern),
      }
    },
  }
}

export function intersection<
  input,
  ps extends unknown extends input
    ? [qt.UnknownPattern, ...qt.UnknownPattern[]]
    : [qt.Pattern<input>, ...qt.Pattern<input>[]]
>(...patterns: ps): qt.AndP<input, ps> {
  return {
    [qt.matcher]: () => ({
      match: value => {
        const selections: Record<string, unknown[]> = {}
        const selector = (key: string, value: any) => {
          selections[key] = value
        }
        const matched = (patterns as qt.UnknownPattern[]).every(p => qu.matchPattern(p, value, selector))
        return { matched, selections }
      },
      getSelectionKeys: () => qu.flatMap(patterns as qt.UnknownPattern[], qu.getSelectionKeys),
      matcherType: "and",
    }),
  }
}

export function union<
  input,
  ps extends unknown extends input
    ? [qt.UnknownPattern, ...qt.UnknownPattern[]]
    : [qt.Pattern<input>, ...qt.Pattern<input>[]]
>(...patterns: ps): qt.OrP<input, ps> {
  return {
    [qt.matcher]: () => ({
      match: <I>(value: I | input) => {
        const selections: Record<string, unknown[]> = {}
        const selector = (key: string, value: any) => {
          selections[key] = value
        }
        qu.flatMap(patterns as qt.UnknownPattern[], qu.getSelectionKeys).forEach(key => selector(key, undefined))
        const matched = (patterns as qt.UnknownPattern[]).some(p => qu.matchPattern(p, value, selector))
        return { matched, selections }
      },
      getSelectionKeys: () => qu.flatMap(patterns as qt.UnknownPattern[], qu.getSelectionKeys),
      matcherType: "or",
    }),
  }
}

export function not<input, p extends unknown extends input ? qt.UnknownPattern : qt.Pattern<input> | undefined>(
  pattern: p
): qt.NotP<input, p> {
  return {
    [qt.matcher]: () => ({
      match: <I>(value: I | input) => ({
        matched: !qu.matchPattern(pattern, value, () => {}),
      }),
      getSelectionKeys: () => [],
      matcherType: "not",
    }),
  }
}

export function when<input, p extends (value: input) => unknown>(
  predicate: p
): qt.GuardP<input, p extends (value: any) => value is infer narrowed ? narrowed : never>

export function when<input, narrowed extends input, excluded>(
  predicate: (input: input) => input is narrowed
): qt.GuardExcludeP<input, narrowed, excluded>
export function when<input, p extends (value: input) => unknown>(
  predicate: p
): qt.GuardP<input, p extends (value: any) => value is infer narrowed ? narrowed : never> {
  return {
    [qt.matcher]: () => ({
      match: <I>(value: I | input) => ({
        matched: Boolean(predicate(value as input)),
      }),
    }),
  }
}

export function select(): qt.AnonymousSelectP
export function select<
  input,
  patternOrKey extends string | (unknown extends input ? qt.UnknownPattern : qt.Pattern<input>)
>(
  patternOrKey: patternOrKey
): patternOrKey extends string ? qt.SelectP<patternOrKey> : qt.SelectP<qt.anonymousSelectKey, input, patternOrKey>
export function select<
  input,
  p extends unknown extends input ? qt.UnknownPattern : qt.Pattern<input>,
  k extends string
>(key: k, pattern: p): qt.SelectP<k, input, p>
export function select(...args: [keyOrPattern?: unknown | string, pattern?: unknown]): qt.SelectP<string> {
  const key: string | undefined = typeof args[0] === "string" ? args[0] : undefined
  const pattern: unknown = args.length === 2 ? args[1] : typeof args[0] === "string" ? undefined : args[0]
  return {
    [qt.matcher]() {
      return {
        match: value => {
          const selections: Record<string, unknown> = {
            [key ?? qt.anonymousSelectKey]: value,
          }
          const selector = (key: string, value: any) => {
            selections[key] = value
          }
          return {
            matched: pattern === undefined ? true : qu.matchPattern(pattern, value, selector),
            selections: selections,
          }
        },
        getSelectionKeys: () =>
          [key ?? qt.anonymousSelectKey].concat(pattern === undefined ? [] : qu.getSelectionKeys(pattern)),
      }
    },
  }
}

function isUnknown(x: unknown): x is unknown {
  return true
}

function isNumber<T>(x: T | number): x is number {
  return typeof x === "number"
}

function isString<T>(x: T | string): x is string {
  return typeof x === "string"
}

function isBoolean<T>(x: T | boolean): x is boolean {
  return typeof x === "boolean"
}

function isBigInt<T>(x: T | bigint): x is bigint {
  return typeof x === "bigint"
}

function isSymbol<T>(x: T | symbol): x is symbol {
  return typeof x === "symbol"
}

function isNullish<T>(x: T | null | undefined): x is null | undefined {
  return x === null || x === undefined
}

type AnyConstructor = new (...args: any[]) => any

function isInstanceOf<T extends AnyConstructor>(classConstructor: T) {
  return (val: unknown): val is InstanceType<T> => val instanceof classConstructor
}

export const any = when(isUnknown)
export const _ = any
export const string = when(isString)
export const number = when(isNumber)
export const boolean = when(isBoolean)
export const bigint = when(isBigInt)
export const symbol = when(isSymbol)
export const nullish = when(isNullish)

export function instanceOf<T extends AnyConstructor>(classConstructor: T): qt.GuardP<unknown, InstanceType<T>> {
  return when(isInstanceOf(classConstructor))
}

export function typed<input>(): {
  array<p extends qt.Pattern<Elem<input>>>(pattern: p): qt.ArrayP<input, p>
  optional<p extends qt.Pattern<input>>(pattern: p): qt.OptionalP<input, p>
  intersection<ps extends [qt.Pattern<input>, ...qt.Pattern<input>[]]>(...patterns: ps): qt.AndP<input, ps>
  union<ps extends [qt.Pattern<input>, ...qt.Pattern<input>[]]>(...patterns: ps): qt.OrP<input, ps>
  not<p extends qt.Pattern<input>>(pattern: p): qt.NotP<input, p>
  when<narrowed extends input = never>(predicate: qt.GuardFunction<input, narrowed>): qt.GuardP<input, narrowed>
  select<pattern extends qt.Pattern<input>>(pattern: pattern): qt.SelectP<qt.anonymousSelectKey, input, pattern>
  select<p extends qt.Pattern<input>, k extends string>(key: k, pattern: p): qt.SelectP<k, input, p>
} {
  return {
    array: array as any,
    optional: optional as any,
    intersection: intersection as any,
    union: union as any,
    not: not as any,
    select: select as any,
    when: when as any,
  }
}
