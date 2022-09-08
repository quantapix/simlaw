import type { Middleware } from "redux"
import { getTimeMeasureUtils } from "./utils.js"

type EntryProcessor = (key: string, value: any) => any
const isProduction: boolean = process.env.NODE_ENV === "production"
const prefix: string = "Invariant failed"

function invariant(condition: any, message?: string) {
  if (condition) {
    return
  }
  if (isProduction) {
    throw new Error(prefix)
  }
  throw new Error(`${prefix}: ${message || ""}`)
}
function stringify(
  obj: any,
  serializer?: EntryProcessor,
  indent?: string | number,
  decycler?: EntryProcessor
): string {
  return JSON.stringify(obj, getSerialize(serializer, decycler), indent)
}
function getSerialize(
  serializer?: EntryProcessor,
  decycler?: EntryProcessor
): EntryProcessor {
  const stack: any[] = [],
    keys: any[] = []
  if (!decycler)
    decycler = function (_: string, value: any) {
      if (stack[0] === value) return "[Circular ~]"
      return (
        "[Circular ~." + keys.slice(0, stack.indexOf(value)).join(".") + "]"
      )
    }
  return function (this: any, key: string, value: any) {
    if (stack.length > 0) {
      var thisPos = stack.indexOf(this)
      ~thisPos ? stack.splice(thisPos + 1) : stack.push(this)
      ~thisPos ? keys.splice(thisPos, Infinity, key) : keys.push(key)
      if (~stack.indexOf(value)) value = decycler!.call(this, key, value)
    } else stack.push(value)
    return serializer == null ? value : serializer.call(this, key, value)
  }
}
export function isImmutableDefault(value: unknown): boolean {
  return typeof value !== "object" || value == null || Object.isFrozen(value)
}
export function trackForMutations(
  isImmutable: IsImmutableFunc,
  ignorePaths: string[] | undefined,
  obj: any
) {
  const trackedProperties = trackProperties(isImmutable, ignorePaths, obj)
  return {
    detectMutations() {
      return detectMutations(isImmutable, ignorePaths, trackedProperties, obj)
    },
  }
}
interface TrackedProperty {
  value: any
  children: Record<string, any>
}
function trackProperties(
  isImmutable: IsImmutableFunc,
  ignorePaths: IgnorePaths = [],
  obj: Record<string, any>,
  path: string = ""
) {
  const tracked: Partial<TrackedProperty> = { value: obj }
  if (!isImmutable(obj)) {
    tracked.children = {}
    for (const key in obj) {
      const childPath = path ? path + "." + key : key
      if (ignorePaths.length && ignorePaths.indexOf(childPath) !== -1) {
        continue
      }
      tracked.children[key] = trackProperties(
        isImmutable,
        ignorePaths,
        obj[key],
        childPath
      )
    }
  }
  return tracked as TrackedProperty
}
type IgnorePaths = readonly string[]
function detectMutations(
  isImmutable: IsImmutableFunc,
  ignorePaths: IgnorePaths = [],
  trackedProperty: TrackedProperty,
  obj: any,
  sameParentRef: boolean = false,
  path: string = ""
): { wasMutated: boolean; path?: string } {
  const prevObj = trackedProperty ? trackedProperty.value : undefined
  const sameRef = prevObj === obj
  if (sameParentRef && !sameRef && !Number.isNaN(obj)) {
    return { wasMutated: true, path }
  }
  if (isImmutable(prevObj) || isImmutable(obj)) {
    return { wasMutated: false }
  }
  const keysToDetect: Record<string, boolean> = {}
  for (const key in trackedProperty.children) {
    keysToDetect[key] = true
  }
  for (const key in obj) {
    keysToDetect[key] = true
  }
  for (const key in keysToDetect) {
    const childPath = path ? path + "." + key : key
    if (ignorePaths.length && ignorePaths.indexOf(childPath) !== -1) {
      continue
    }
    const result = detectMutations(
      isImmutable,
      ignorePaths,
      trackedProperty.children[key],
      obj[key],
      sameRef,
      childPath
    )
    if (result.wasMutated) {
      return result
    }
  }
  return { wasMutated: false }
}
type IsImmutableFunc = (value: any) => boolean
export interface ImmutableStateInvariantMiddlewareOptions {
  isImmutable?: IsImmutableFunc
  ignoredPaths?: string[]
  warnAfter?: number
  // @deprecated. Use ignoredPaths
  ignore?: string[]
}
export function createImmutableStateInvariantMiddleware(
  options: ImmutableStateInvariantMiddlewareOptions = {}
): Middleware {
  if (process.env.NODE_ENV === "production") {
    return () => next => action => next(action)
  }
  let {
    isImmutable = isImmutableDefault,
    ignoredPaths,
    warnAfter = 32,
    ignore,
  } = options
  ignoredPaths = ignoredPaths || ignore
  const track = trackForMutations.bind(null, isImmutable, ignoredPaths)
  return ({ getState }) => {
    let state = getState()
    let tracker = track(state)
    let result
    return next => action => {
      const measureUtils = getTimeMeasureUtils(
        warnAfter,
        "ImmutableStateInvariantMiddleware"
      )
      measureUtils.measureTime(() => {
        state = getState()
        result = tracker.detectMutations()
        tracker = track(state)
        invariant(
          !result.wasMutated,
          `A state mutation was detected between dispatches, in the path '${
            result.path || ""
          }'.  This may cause incorrect behavior. (https://redux.js.org/style-guide/style-guide#do-not-mutate-state)`
        )
      })
      const dispatchedAction = next(action)
      measureUtils.measureTime(() => {
        state = getState()
        result = tracker.detectMutations()
        tracker = track(state)
        result.wasMutated &&
          invariant(
            !result.wasMutated,
            `A state mutation was detected inside a dispatch, in the path: ${
              result.path || ""
            }. Take a look at the reducer(s) handling the action ${stringify(
              action
            )}. (https://redux.js.org/style-guide/style-guide#do-not-mutate-state)`
          )
      })
      measureUtils.warnIfExceeded()
      return dispatchedAction
    }
  }
}
