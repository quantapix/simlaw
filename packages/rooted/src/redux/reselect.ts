import type * as qt from "./types.js"

const NOT_FOUND = "NOT_FOUND"
type NOT_FOUND_TYPE = typeof NOT_FOUND
interface Entry {
  key: unknown
  value: unknown
}
interface Cache {
  get(key: unknown): unknown | NOT_FOUND_TYPE
  put(key: unknown, value: unknown): void
  getEntries(): Entry[]
  clear(): void
}
function createSingletonCache(equals: qt.EqualityFn): Cache {
  let entry: Entry | undefined
  return {
    get(key: unknown) {
      if (entry && equals(entry.key, key)) {
        return entry.value
      }
      return NOT_FOUND
    },
    put(key: unknown, value: unknown) {
      entry = { key, value }
    },
    getEntries() {
      return entry ? [entry] : []
    },
    clear() {
      entry = undefined
    },
  }
}
function createLruCache(maxSize: number, equals: qt.EqualityFn): Cache {
  let entries: Entry[] = []
  function get(key: unknown) {
    const cacheIndex = entries.findIndex(entry => equals(key, entry.key))
    if (cacheIndex > -1) {
      const entry = entries[cacheIndex]
      if (cacheIndex > 0) {
        entries.splice(cacheIndex, 1)
        entries.unshift(entry)
      }
      return entry.value
    }
    return NOT_FOUND
  }
  function put(key: unknown, value: unknown) {
    if (get(key) === NOT_FOUND) {
      entries.unshift({ key, value })
      if (entries.length > maxSize) {
        entries.pop()
      }
    }
  }
  function getEntries() {
    return entries
  }
  function clear() {
    entries = []
  }
  return { get, put, getEntries, clear }
}
export const defaultEqualityCheck: qt.EqualityFn = (a, b): boolean => {
  return a === b
}
export function createCacheKeyComparator(equalityCheck: qt.EqualityFn) {
  return function areArgumentsShallowlyEqual(
    prev: unknown[] | IArguments | null,
    next: unknown[] | IArguments | null
  ): boolean {
    if (prev === null || next === null || prev.length !== next.length) {
      return false
    }
    const length = prev.length
    for (let i = 0; i < length; i++) {
      if (!equalityCheck(prev[i], next[i])) {
        return false
      }
    }
    return true
  }
}
export interface DefaultMemoizeOptions {
  equalityCheck?: qt.EqualityFn
  resultEqualityCheck?: qt.EqualityFn
  maxSize?: number
}
export function defaultMemoize<F extends (...args: any[]) => any>(
  func: F,
  equalityCheckOrOptions?: qt.EqualityFn | DefaultMemoizeOptions
) {
  const providedOptions =
    typeof equalityCheckOrOptions === "object"
      ? equalityCheckOrOptions
      : { equalityCheck: equalityCheckOrOptions }
  const {
    equalityCheck = defaultEqualityCheck,
    maxSize = 1,
    resultEqualityCheck,
  } = providedOptions
  const comparator = createCacheKeyComparator(equalityCheck)
  const cache =
    maxSize === 1
      ? createSingletonCache(comparator)
      : createLruCache(maxSize, comparator)
  function memoized() {
    let value = cache.get(arguments)
    if (value === NOT_FOUND) {
      value = func.apply(null, arguments)
      if (resultEqualityCheck) {
        const entries = cache.getEntries()
        const matchingEntry = entries.find(entry =>
          resultEqualityCheck(entry.value, value)
        )
        if (matchingEntry) {
          value = matchingEntry.value
        }
      }
      cache.put(arguments, value)
    }
    return value
  }
  memoized.clearCache = () => cache.clear()
  return memoized as F & { clearCache: () => void }
}

function getDependencies(funcs: unknown[]) {
  const dependencies = Array.isArray(funcs[0]) ? funcs[0] : funcs
  if (!dependencies.every(dep => typeof dep === "function")) {
    const dependencyTypes = dependencies
      .map(dep =>
        typeof dep === "function"
          ? `function ${dep.name || "unnamed"}()`
          : typeof dep
      )
      .join(", ")
    throw new Error(
      `createSelector expects all input-selectors to be functions, but received the following types: [${dependencyTypes}]`
    )
  }
  return dependencies as qt.
}
export function createSelectorCreator<
  F extends (...args: unknown[]) => unknown,
  MemoizeFunction extends (func: F, ...options: any[]) => F,
  MemoizeOptions extends unknown[] = qt.DropFirst<Parameters<MemoizeFunction>>
>(
  memoize: MemoizeFunction,
  ...memoizeOptionsFromArgs: qt.DropFirst<Parameters<MemoizeFunction>>
) {
  const createSelector = (...funcs: Function[]) => {
    let recomputations = 0
    let lastResult: unknown
    let directlyPassedOptions: CreateSelectorOptions<MemoizeOptions> = {
      memoizeOptions: undefined,
    }
    let resultFunc = funcs.pop()
    if (typeof resultFunc === "object") {
      directlyPassedOptions = resultFunc as any
      resultFunc = funcs.pop()
    }
    if (typeof resultFunc !== "function") {
      throw new Error(
        `createSelector expects an output function after the inputs, but received: [${typeof resultFunc}]`
      )
    }
    const { memoizeOptions = memoizeOptionsFromArgs } = directlyPassedOptions
    const finalMemoizeOptions = Array.isArray(memoizeOptions)
      ? memoizeOptions
      : ([memoizeOptions] as MemoizeOptions)
    const dependencies = getDependencies(funcs)
    const memoizedResultFunc = memoize(
      function recomputationWrapper() {
        recomputations++
        return resultFunc!.apply(null, arguments)
      } as F,
      ...finalMemoizeOptions
    )
    const selector = memoize(function dependenciesChecker() {
      const params = []
      const length = dependencies.length
      for (let i = 0; i < length; i++) {
        params.push(dependencies[i].apply(null, arguments))
      }
      lastResult = memoizedResultFunc.apply(null, params)
      return lastResult
    } as F)
    Object.assign(selector, {
      resultFunc,
      memoizedResultFunc,
      dependencies,
      lastResult: () => lastResult,
      recomputations: () => recomputations,
      resetRecomputations: () => (recomputations = 0),
    })
    return selector
  }
  return createSelector as CreateSelectorFunction<
    F,
    MemoizeFunction,
    MemoizeOptions
  >
}
export interface CreateSelectorOptions<MemoizeOptions extends unknown[]> {
  memoizeOptions: MemoizeOptions[0] | MemoizeOptions
}
export interface CreateSelectorFunction<
  F extends (...args: unknown[]) => unknown,
  MemoizeFunction extends (func: F, ...options: any[]) => F,
  MemoizeOptions extends unknown[] = qt.DropFirst<Parameters<MemoizeFunction>>,
  Keys = qt.Expand<
    Pick<ReturnType<MemoizeFunction>, keyof ReturnType<MemoizeFunction>>
  >
> {
  <Selectors extends qt., Result>(
    ...items: [
      ...Selectors,
      (...args: qt.SelectorResultArray<Selectors>) => Result
    ]
  ): qt.OutputSelector<
    Selectors,
    Result,
    (...args: qt.SelectorResultArray<Selectors>) => Result & Keys,
    qt.GetParamsFromSelectors<Selectors>
  > &
    Keys
  <Selectors extends qt., Result>(
    ...items: [
      ...Selectors,
      (...args: qt.SelectorResultArray<Selectors>) => Result,
      CreateSelectorOptions<MemoizeOptions>
    ]
  ): qt.OutputSelector<
    Selectors,
    Result,
    ((...args: qt.SelectorResultArray<Selectors>) => Result) & Keys,
    qt.GetParamsFromSelectors<Selectors>
  > &
    Keys
  <Selectors extends qt., Result>(
    selectors: [...Selectors],
    combiner: (...args: qt.SelectorResultArray<Selectors>) => Result,
    options?: CreateSelectorOptions<MemoizeOptions>
  ): qt.OutputSelector<
    Selectors,
    Result,
    (...args: qt.SelectorResultArray<Selectors>) => Result & Keys,
    qt.GetParamsFromSelectors<Selectors>
  > &
    Keys
}
export const createSelector = createSelectorCreator(defaultMemoize)
type SelectorsObject = { [key: string]: (...args: any[]) => any }
export interface StructuredSelectorCreator {
  <
    SelectorMap extends SelectorsObject,
    SelectorParams = qt.MergeParameters<qt.ObjValueTuple<SelectorMap>>
  >(
    selectorMap: SelectorMap,
    selectorCreator?: CreateSelectorFunction<any, any, any>
  ): (
    state: qt.Head<SelectorParams>,
    ...params: qt.Tail<SelectorParams>
  ) => {
    [Key in keyof SelectorMap]: ReturnType<SelectorMap[Key]>
  }
  <State, Result = State>(
    selectors: { [K in keyof Result]: qt.Selector<State, Result[K], never> },
    selectorCreator?: CreateSelectorFunction<any, any, any>
  ): qt.Selector<State, Result, never>
}
export const createStructuredSelector = ((
  selectors: SelectorsObject,
  selectorCreator = createSelector
) => {
  if (typeof selectors !== "object") {
    throw new Error(
      "createStructuredSelector expects first argument to be an object " +
        `where each property is a selector, instead received a ${typeof selectors}`
    )
  }
  const objectKeys = Object.keys(selectors)
  const resultSelector = selectorCreator(
    objectKeys.map(key => selectors[key]),
    (...values: any[]) => {
      return values.reduce((composition, value, index) => {
        composition[objectKeys[index]] = value
        return composition
      }, {})
    }
  )
  return resultSelector
}) as unknown as StructuredSelectorCreator
