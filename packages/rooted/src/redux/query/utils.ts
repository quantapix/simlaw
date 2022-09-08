import { isPlainObject as _iPO } from "@reduxjs/toolkit"
import type { QueryCacheKey } from "./core/types.js"
import type { NEVER, BaseQueryFn, EndpointDefinition } from "./types.js"

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
import { isAbsoluteUrl } from "./isAbsoluteUrl"

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

export const defaultSerializeQueryArgs: SerializeQueryArgs<any> = ({
  endpointName,
  queryArgs,
}) => {
  return `${endpointName}(${JSON.stringify(queryArgs, (key, value) =>
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

export type SerializeQueryArgs<QueryArgs> = (_: {
  queryArgs: QueryArgs
  endpointDefinition: EndpointDefinition<any, any, any, any>
  endpointName: string
}) => string

export type InternalSerializeQueryArgs = (_: {
  queryArgs: any
  endpointDefinition: EndpointDefinition<any, any, any, any>
  endpointName: string
}) => QueryCacheKey

export function fakeBaseQuery<ErrorType>(): BaseQueryFn<
  void,
  NEVER,
  ErrorType,
  {}
> {
  return function () {
    throw new Error(
      "When using `fakeBaseQuery`, all queries & mutations must use the `queryFn` definition syntax."
    )
  }
}
