export function capitalize(str: string) {
  return str.replace(str[0], str[0].toUpperCase())
}
import { isPlainObject as _iPO } from '@reduxjs/toolkit'

// remove type guard
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
/**
 * Alternative to `Array.flat(1)`
 * @param arr An array like [1,2,3,[1,2]]
 * @link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/flat
 */
export const flatten = (arr: readonly any[]) => [].concat(...arr)
export * from './isAbsoluteUrl'
export * from './isValidUrl'
export * from './joinUrls'
export * from './flatten'
export * from './capitalize'
export * from './isOnline'
export * from './isDocumentVisible'
export * from './copyWithStructuralSharing'
/**
 * If either :// or // is present consider it to be an absolute url
 *
 * @param url string
 */

export function isAbsoluteUrl(url: string) {
  return new RegExp(`(^|:)//`).test(url)
}
/**
 * Assumes true for a non-browser env, otherwise makes a best effort
 * @link https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilityState
 */
export function isDocumentVisible(): boolean {
  // `document` may not exist in non-browser envs (like RN)
  if (typeof document === 'undefined') {
    return true
  }
  // Match true for visible, prerender, undefined
  return document.visibilityState !== 'hidden'
}
/**
 * Assumes a browser is online if `undefined`, otherwise makes a best effort
 * @link https://developer.mozilla.org/en-US/docs/Web/API/NavigatorOnLine/onLine
 */
export function isOnline() {
  // We set the default config value in the store, so we'd need to check for this in a SSR env
  return typeof navigator === 'undefined'
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
import { isAbsoluteUrl } from './isAbsoluteUrl'

const withoutTrailingSlash = (url: string) => url.replace(/\/$/, '')
const withoutLeadingSlash = (url: string) => url.replace(/^\//, '')

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

  const delimiter = base.endsWith('/') || !url.startsWith('?') ? '/' : ''
  base = withoutTrailingSlash(base)
  url = withoutLeadingSlash(url)

  return `${base}${delimiter}${url}`;
}
