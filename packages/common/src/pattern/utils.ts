import * as qt from "./types.js"

export const isObject = (value: unknown): value is Object => Boolean(value && typeof value === "object")

export const isMatcher = (x: unknown): x is qt.Matcher<unknown, unknown, qt.MatcherType, qt.SelectionType> => {
  const pattern = x as qt.Matcher<unknown, unknown, qt.MatcherType, qt.SelectionType>
  return pattern && !!pattern[qt.matcher]
}

const isOptionalPattern = (x: unknown): x is qt.Matcher<unknown, unknown, "optional", qt.SelectionType> => {
  return isMatcher(x) && x[qt.matcher]().matcherType === "optional"
}

export const matchPattern = (
  pattern: qt.Pattern<any>,
  value: any,
  select: (key: string, value: unknown) => void
): boolean => {
  if (isObject(pattern)) {
    if (isMatcher(pattern)) {
      const matcher = pattern[qt.matcher]()
      const { matched, selections } = matcher.match(value)
      if (matched && selections) {
        Object.keys(selections).forEach(key => select(key, selections[key]))
      }
      return matched
    }
    if (!isObject(value)) return false
    if (Array.isArray(pattern)) {
      if (!Array.isArray(value)) return false
      return pattern.length === value.length
        ? pattern.every((subPattern, i) => matchPattern(subPattern, value[i], select))
        : false
    }
    if (pattern instanceof Map) {
      if (!(value instanceof Map)) return false
      return Array.from(pattern.keys()).every(key => matchPattern(pattern.get(key), value.get(key), select))
    }
    if (pattern instanceof Set) {
      if (!(value instanceof Set)) return false
      if (pattern.size === 0) return value.size === 0
      if (pattern.size === 1) {
        const [subPattern] = Array.from(pattern.values())
        return isMatcher(subPattern)
          ? Array.from(value.values()).every(v => matchPattern(subPattern, v, select))
          : value.has(subPattern)
      }
      return Array.from(pattern.values()).every(subPattern => value.has(subPattern))
    }
    return Object.keys(pattern).every((k: string): boolean => {
      const subPattern = pattern[k]
      return (k in value || isOptionalPattern(subPattern)) && matchPattern(subPattern, value[k], select)
    })
  }
  return Object.is(value, pattern)
}

export const getSelectionKeys = (pattern: qt.Pattern<any>): string[] => {
  if (isObject(pattern)) {
    if (isMatcher(pattern)) {
      return pattern[qt.matcher]().getSelectionKeys?.() ?? []
    }
    if (Array.isArray(pattern)) return flatMap(pattern, getSelectionKeys)
    return flatMap(Object.values(pattern), getSelectionKeys)
  }
  return []
}

export const flatMap = <a, b>(xs: a[], f: (v: a) => b[]): b[] => xs.reduce<b[]>((acc, p) => acc.concat(f(p)), [])
