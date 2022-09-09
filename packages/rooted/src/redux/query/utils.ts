import { ThunkDispatch, isPlainObject as _iPO } from "../../redux/index.js"
import type * as qt from "./types.js"
import { createAction } from "../../redux/index.js"
import { BaseQueryEnhancer, HandledError } from "./types.js"

export function capitalize(str: string) {
  return str.replace(str[0], str[0].toUpperCase())
}

const isPlainObject: (_: any) => boolean = _iPO

export function copyWithStructuralSharing<T>(oldObj: any, newObj: T): T
export function copyWithStructuralSharing(oldObj: any, newObj: any): any {
  if (
    oldObj === newObj ||
    !(
      (isPlainObject(oldObj) && isPlainObject(newObj)) ||
      (Array.isArray(oldObj) && Array.isArray(newObj))
    )
  ) {
    return newObj
  }
  const newKeys = Object.keys(newObj)
  const oldKeys = Object.keys(oldObj)
  let isSameObject = newKeys.length === oldKeys.length
  const mergeObj: any = Array.isArray(newObj) ? [] : {}
  for (const key of newKeys) {
    mergeObj[key] = copyWithStructuralSharing(oldObj[key], newObj[key])
    if (isSameObject) isSameObject = oldObj[key] === mergeObj[key]
  }
  return isSameObject ? oldObj : mergeObj
}

export const flatten = (arr: readonly any[]) => [].concat(...arr)

export function isAbsoluteUrl(url: string) {
  return new RegExp(`(^|:)//`).test(url)
}

export function isDocumentVisible(): boolean {
  if (typeof document === "undefined") {
    return true
  }
  return document.visibilityState !== "hidden"
}

export function isOnline() {
  return typeof navigator === "undefined"
    ? true
    : navigator.onLine === undefined
    ? true
    : navigator.onLine
}

export function isValidUrl(string: string) {
  try {
    new URL(string)
  } catch (_) {
    return false
  }
  return true
}

const withoutTrailingSlash = (url: string) => url.replace(/\/$/, "")
const withoutLeadingSlash = (url: string) => url.replace(/^\//, "")

export function joinUrls(
  base: string | undefined,
  url: string | undefined
): string {
  if (!base) {
    return url!
  }
  if (!url) {
    return base
  }
  if (isAbsoluteUrl(url)) {
    return url
  }
  const delimiter = base.endsWith("/") || !url.startsWith("?") ? "/" : ""
  base = withoutTrailingSlash(base)
  url = withoutLeadingSlash(url)
  return `${base}${delimiter}${url}`
}

export const defaultSerializeQueryArgs: qt.SerializeQueryArgs<any> = ({
  endpointName,
  queryArgs,
}) => {
  return `${endpointName}(${JSON.stringify(queryArgs, (_, value) =>
    isPlainObject(value)
      ? Object.keys(value)
          .sort()
          .reduce<any>((acc, key) => {
            acc[key] = (value as any)[key]
            return acc
          }, {})
      : value
  )})`
}

export function fakeBaseQuery<ErrorType>(): qt.BaseQueryFn<
  void,
  qt.NEVER,
  ErrorType,
  {}
> {
  return function () {
    throw new Error(
      "When using `fakeBaseQuery`, all queries & mutations must use the `queryFn` definition syntax."
    )
  }
}

export const onFocus = createAction("__rtkq/focused")
export const onFocusLost = createAction("__rtkq/unfocused")
export const onOnline = createAction("__rtkq/online")
export const onOffline = createAction("__rtkq/offline")

let initialized = false

export function setupListeners(
  dispatch: ThunkDispatch<any, any, any>,
  customHandler?: (
    dispatch: ThunkDispatch<any, any, any>,
    actions: {
      onFocus: typeof onFocus
      onFocusLost: typeof onFocusLost
      onOnline: typeof onOnline
      onOffline: typeof onOffline
    }
  ) => () => void
) {
  function defaultHandler() {
    const handleFocus = () => dispatch(onFocus())
    const handleFocusLost = () => dispatch(onFocusLost())
    const handleOnline = () => dispatch(onOnline())
    const handleOffline = () => dispatch(onOffline())
    const handleVisibilityChange = () => {
      if (window.document.visibilityState === "visible") {
        handleFocus()
      } else {
        handleFocusLost()
      }
    }
    if (!initialized) {
      if (typeof window !== "undefined" && window.addEventListener) {
        window.addEventListener(
          "visibilitychange",
          handleVisibilityChange,
          false
        )
        window.addEventListener("focus", handleFocus, false)
        window.addEventListener("online", handleOnline, false)
        window.addEventListener("offline", handleOffline, false)
        initialized = true
      }
    }
    const unsubscribe = () => {
      window.removeEventListener("focus", handleFocus)
      window.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
      initialized = false
    }
    return unsubscribe
  }
  return customHandler
    ? customHandler(dispatch, { onFocus, onFocusLost, onOffline, onOnline })
    : defaultHandler()
}

async function defaultBackoff(attempt: number = 0, maxRetries: number = 5) {
  const attempts = Math.min(attempt, maxRetries)

  const timeout = ~~((Math.random() + 0.4) * (300 << attempts)) // Force a positive int in the case we make this an option
  await new Promise(resolve => setTimeout((res: any) => resolve(res), timeout))
}

export interface RetryOptions {
  maxRetries?: number
  backoff?: (attempt: number, maxRetries: number) => Promise<void>
}

function fail(e: any): never {
  throw Object.assign(new HandledError({ error: e }), {
    throwImmediately: true,
  })
}

const retryWithBackoff: BaseQueryEnhancer<
  unknown,
  RetryOptions,
  RetryOptions | void
> = (baseQuery, defaultOptions) => async (args, api, extraOptions) => {
  const options = {
    maxRetries: 5,
    backoff: defaultBackoff,
    ...defaultOptions,
    ...extraOptions,
  }
  let retry = 0

  while (true) {
    try {
      const result = await baseQuery(args, api, extraOptions)
      if (result.error) {
        throw new HandledError(result)
      }
      return result
    } catch (e: any) {
      retry++
      if (e.throwImmediately || retry > options.maxRetries) {
        if (e instanceof HandledError) {
          return e.value
        }
        throw e
      }
      await options.backoff(retry, options.maxRetries)
    }
  }
}

export const retry = Object.assign(retryWithBackoff, { fail })
