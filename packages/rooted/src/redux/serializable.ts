import isPlainObject from "./isPlainObject"
import type { Middleware } from "redux"
import { getTimeMeasureUtils } from "./utils.js"
export function isPlain(val: any) {
  const type = typeof val
  return (
    val == null ||
    type === "string" ||
    type === "boolean" ||
    type === "number" ||
    Array.isArray(val) ||
    isPlainObject(val)
  )
}
interface NonSerializableValue {
  keyPath: string
  value: unknown
}
export function findNonSerializableValue(
  value: unknown,
  path: string = "",
  isSerializable: (value: unknown) => boolean = isPlain,
  getEntries?: (value: unknown) => [string, any][],
  ignoredPaths: readonly string[] = []
): NonSerializableValue | false {
  let foundNestedSerializable: NonSerializableValue | false
  if (!isSerializable(value)) {
    return {
      keyPath: path || "<root>",
      value: value,
    }
  }
  if (typeof value !== "object" || value === null) {
    return false
  }
  const entries = getEntries != null ? getEntries(value) : Object.entries(value)
  const hasIgnoredPaths = ignoredPaths.length > 0
  for (const [key, nestedValue] of entries) {
    const nestedPath = path ? path + "." + key : key
    if (hasIgnoredPaths && ignoredPaths.indexOf(nestedPath) >= 0) {
      continue
    }
    if (!isSerializable(nestedValue)) {
      return {
        keyPath: nestedPath,
        value: nestedValue,
      }
    }
    if (typeof nestedValue === "object") {
      foundNestedSerializable = findNonSerializableValue(
        nestedValue,
        nestedPath,
        isSerializable,
        getEntries,
        ignoredPaths
      )
      if (foundNestedSerializable) {
        return foundNestedSerializable
      }
    }
  }
  return false
}
export interface SerializableStateInvariantMiddlewareOptions {
  isSerializable?: (value: any) => boolean
  getEntries?: (value: any) => [string, any][]
  ignoredActions?: string[]
  ignoredActionPaths?: string[]
  ignoredPaths?: string[]
  warnAfter?: number
  ignoreState?: boolean
  ignoreActions?: boolean
}
export function createSerializableStateInvariantMiddleware(
  options: SerializableStateInvariantMiddlewareOptions = {}
): Middleware {
  if (process.env.NODE_ENV === "production") {
    return () => next => action => next(action)
  }
  const {
    isSerializable = isPlain,
    getEntries,
    ignoredActions = [],
    ignoredActionPaths = ["meta.arg", "meta.baseQueryMeta"],
    ignoredPaths = [],
    warnAfter = 32,
    ignoreState = false,
    ignoreActions = false,
  } = options
  return storeAPI => next => action => {
    const result = next(action)
    const measureUtils = getTimeMeasureUtils(
      warnAfter,
      "SerializableStateInvariantMiddleware"
    )
    if (
      !ignoreActions &&
      !(ignoredActions.length && ignoredActions.indexOf(action.type) !== -1)
    ) {
      measureUtils.measureTime(() => {
        const foundActionNonSerializableValue = findNonSerializableValue(
          action,
          "",
          isSerializable,
          getEntries,
          ignoredActionPaths
        )
        if (foundActionNonSerializableValue) {
          const { keyPath, value } = foundActionNonSerializableValue
          console.error(
            `A non-serializable value was detected in an action, in the path: \`${keyPath}\`. Value:`,
            value,
            "\nTake a look at the logic that dispatched this action: ",
            action,
            "\n(See https://redux.js.org/faq/actions#why-should-type-be-a-string-or-at-least-serializable-why-should-my-action-types-be-constants)",
            "\n(To allow non-serializable values see: https://redux-toolkit.js.org/usage/usage-guide#working-with-non-serializable-data)"
          )
        }
      })
    }
    if (!ignoreState) {
      measureUtils.measureTime(() => {
        const state = storeAPI.getState()
        const foundStateNonSerializableValue = findNonSerializableValue(
          state,
          "",
          isSerializable,
          getEntries,
          ignoredPaths
        )
        if (foundStateNonSerializableValue) {
          const { keyPath, value } = foundStateNonSerializableValue
          console.error(
            `A non-serializable value was detected in the state, in the path: \`${keyPath}\`. Value:`,
            value,
            `
Take a look at the reducer(s) handling this action type: ${action.type}.
(See https://redux.js.org/faq/organizing-state#can-i-put-functions-promises-or-other-non-serializable-items-in-my-store-state)`
          )
        }
      })
      measureUtils.warnIfExceeded()
    }
    return result
  }
}
