import * as qi from "../immer/index.js"

const randomString = () =>
  Math.random().toString(36).substring(7).split("").join(".")

export const ActionTypes = {
  INIT: `@@redux/INIT${randomString()}`,
  REPLACE: `@@redux/REPLACE${randomString()}`,
  PROBE_UNKNOWN_ACTION: () => `@@redux/PROBE_UNKNOWN_ACTION${randomString()}`,
}

export function formatProdErrorMessage(code: number) {
  return (
    `Minified Redux error #${code}; visit https://redux.js.org/Errors?code=${code} for the full message or ` +
    "use the non-minified dev environment for full errors. "
  )
}

export function isPlainObject(x: any): boolean {
  if (typeof x !== "object" || x === null) return false
  let y = x
  while (Object.getPrototypeOf(y) !== null) {
    y = Object.getPrototypeOf(y)
  }
  return Object.getPrototypeOf(x) === y
}

export function miniKindOf(x: any): string {
  if (x === void 0) return "undefined"
  if (x === null) return "null"
  const type = typeof x
  switch (type) {
    case "boolean":
    case "string":
    case "number":
    case "symbol":
    case "function": {
      return type
    }
  }
  if (Array.isArray(x)) return "array"
  if (isDate(x)) return "date"
  if (isError(x)) return "error"
  const n = ctorName(x)
  switch (n) {
    case "Symbol":
    case "Promise":
    case "WeakMap":
    case "WeakSet":
    case "Map":
    case "Set":
      return n
  }
  return Object.prototype.toString
    .call(x)
    .slice(8, -1)
    .toLowerCase()
    .replace(/\s/g, "")
}

function ctorName(x: any): string | null {
  return typeof x.constructor === "function" ? x.constructor.name : null
}

function isError(x: any) {
  return (
    x instanceof Error ||
    (typeof x.message === "string" &&
      x.constructor &&
      typeof x.constructor.stackTraceLimit === "number")
  )
}

function isDate(x: any) {
  if (x instanceof Date) return true
  return (
    typeof x.toDateString === "function" &&
    typeof x.getDate === "function" &&
    typeof x.setDate === "function"
  )
}

export function kindOf(x: any) {
  let typeOfVal: string = typeof x
  if (process.env["NODE_ENV"] !== "production") typeOfVal = miniKindOf(x)
  return typeOfVal
}

export function freezeDraftable<T>(val: T) {
  return qi.isDraftable(val) ? qi.produce(val, () => {}) : val
}

export function warning(x: string): void {
  if (typeof console !== "undefined" && typeof console.error === "function") {
    console.error(x)
  }
  try {
    throw new Error(x)
  } catch (e) {}
}

export function getTimeMeasureUtils(maxDelay: number, fnName: string) {
  let elapsed = 0
  return {
    measureTime<T>(fn: () => T): T {
      const started = Date.now()
      try {
        return fn()
      } finally {
        const finished = Date.now()
        elapsed += finished - started
      }
    },
    warnIfExceeded() {
      if (elapsed > maxDelay) {
        console.warn(`${fnName} took ${elapsed}ms, which is more than the warning threshold of ${maxDelay}ms. 
If your state or actions are very large, you may want to disable the middleware as it might cause too much of a slowdown in development mode. See https://redux-toolkit.js.org/api/getDefaultMiddleware for instructions.
It is disabled in production builds, so you don't need to worry about that.`)
      }
    },
  }
}

const urlAlphabet =
  "ModuleSymbhasOwnPr-0123456789ABCDEFGHNRVfgctiUvz_KqYTJkLxpZXIjQW"

export const nanoid = (size = 21) => {
  let id = ""
  let i = size
  while (i--) {
    id += urlAlphabet[(Math.random() * 64) | 0]
  }
  return id
}
