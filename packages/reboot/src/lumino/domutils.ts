/* eslint-disable @typescript-eslint/no-namespace */
export namespace ClipboardExt {
  export function copyText(text: string): void {
    const body = document.body
    const handler = (event: ClipboardEvent) => {
      event.preventDefault()
      event.stopPropagation()
      event.clipboardData!.setData("text", text)
      body.removeEventListener("copy", handler, true)
    }
    body.addEventListener("copy", handler, true)
    document.execCommand("copy")
  }
}
export namespace ElementExt {
  export interface IBoxSizing {
    borderTop: number
    borderLeft: number
    borderRight: number
    borderBottom: number
    paddingTop: number
    paddingLeft: number
    paddingRight: number
    paddingBottom: number
    horizontalSum: number
    verticalSum: number
  }
  export function boxSizing(element: Element): IBoxSizing {
    let style = window.getComputedStyle(element)
    let bt = parseFloat(style.borderTopWidth!) || 0
    let bl = parseFloat(style.borderLeftWidth!) || 0
    let br = parseFloat(style.borderRightWidth!) || 0
    let bb = parseFloat(style.borderBottomWidth!) || 0
    let pt = parseFloat(style.paddingTop!) || 0
    let pl = parseFloat(style.paddingLeft!) || 0
    let pr = parseFloat(style.paddingRight!) || 0
    let pb = parseFloat(style.paddingBottom!) || 0
    let hs = bl + pl + pr + br
    let vs = bt + pt + pb + bb
    return {
      borderTop: bt,
      borderLeft: bl,
      borderRight: br,
      borderBottom: bb,
      paddingTop: pt,
      paddingLeft: pl,
      paddingRight: pr,
      paddingBottom: pb,
      horizontalSum: hs,
      verticalSum: vs,
    }
  }
  export interface ISizeLimits {
    minWidth: number
    minHeight: number
    maxWidth: number
    maxHeight: number
  }
  export function sizeLimits(element: Element): ISizeLimits {
    let style = window.getComputedStyle(element)
    let minWidth = parseFloat(style.minWidth!) || 0
    let minHeight = parseFloat(style.minHeight!) || 0
    let maxWidth = parseFloat(style.maxWidth!) || Infinity
    let maxHeight = parseFloat(style.maxHeight!) || Infinity
    maxWidth = Math.max(minWidth, maxWidth)
    maxHeight = Math.max(minHeight, maxHeight)
    return { minWidth, minHeight, maxWidth, maxHeight }
  }
  export function hitTest(
    element: Element,
    clientX: number,
    clientY: number
  ): boolean {
    let rect = element.getBoundingClientRect()
    return (
      clientX >= rect.left &&
      clientX < rect.right &&
      clientY >= rect.top &&
      clientY < rect.bottom
    )
  }
  export function scrollIntoViewIfNeeded(
    area: Element,
    element: Element
  ): void {
    let ar = area.getBoundingClientRect()
    let er = element.getBoundingClientRect()
    if (er.top <= ar.top && er.bottom >= ar.bottom) {
      return
    }
    if (er.top < ar.top && er.height <= ar.height) {
      area.scrollTop -= ar.top - er.top
      return
    }
    if (er.bottom > ar.bottom && er.height >= ar.height) {
      area.scrollTop -= ar.top - er.top
      return
    }
    if (er.top < ar.top && er.height > ar.height) {
      area.scrollTop -= ar.bottom - er.bottom
      return
    }
    if (er.bottom > ar.bottom && er.height < ar.height) {
      area.scrollTop -= ar.bottom - er.bottom
      return
    }
  }
}
export * from "./clipboard"
export * from "./element"
export * from "./platform"
export * from "./selector"
export namespace Platform {
  export const IS_MAC = !!navigator.platform.match(/Mac/i)
  export const IS_WIN = !!navigator.platform.match(/Win/i)
  export const IS_IE = /Trident/.test(navigator.userAgent)
  export const IS_EDGE = /Edge/.test(navigator.userAgent)
  export function accelKey(event: KeyboardEvent | MouseEvent): boolean {
    return IS_MAC ? event.metaKey : event.ctrlKey
  }
}
export namespace Selector {
  export function calculateSpecificity(selector: string): number {
    if (selector in Private.specificityCache) {
      return Private.specificityCache[selector]
    }
    let result = Private.calculateSingle(selector)
    return (Private.specificityCache[selector] = result)
  }
  export function isValid(selector: string): boolean {
    if (selector in Private.validityCache) {
      return Private.validityCache[selector]
    }
    let result = true
    try {
      Private.testElem.querySelector(selector)
    } catch (err) {
      result = false
    }
    return (Private.validityCache[selector] = result)
  }
  export function matches(element: Element, selector: string): boolean {
    return Private.protoMatchFunc.call(element, selector)
  }
}
namespace Private {
  export type StringMap<T> = { [key: string]: T }
  export const specificityCache: StringMap<number> = Object.create(null)
  export const validityCache: StringMap<boolean> = Object.create(null)
  export const testElem = document.createElement("div")
  export const protoMatchFunc = (() => {
    let proto = Element.prototype as any
    return (
      proto.matches ||
      proto.matchesSelector ||
      proto.mozMatchesSelector ||
      proto.msMatchesSelector ||
      proto.oMatchesSelector ||
      proto.webkitMatchesSelector ||
      function (selector: string) {
        let elem = this as Element
        let matches = elem.ownerDocument
          ? elem.ownerDocument.querySelectorAll(selector)
          : []
        return Array.prototype.indexOf.call(matches, elem) !== -1
      }
    )
  })()
  export function calculateSingle(selector: string): number {
    selector = selector.split(",", 1)[0]
    let a = 0
    let b = 0
    let c = 0
    function match(re: RegExp): boolean {
      let match = selector.match(re)
      if (match === null) {
        return false
      }
      selector = selector.slice(match[0].length)
      return true
    }
    selector = selector.replace(NEGATION_RE, " $1 ")
    while (selector.length > 0) {
      if (match(ID_RE)) {
        a++
        continue
      }
      if (match(CLASS_RE)) {
        b++
        continue
      }
      if (match(ATTR_RE)) {
        b++
        continue
      }
      if (match(PSEUDO_ELEM_RE)) {
        c++
        continue
      }
      if (match(PSEDUO_CLASS_RE)) {
        b++
        continue
      }
      if (match(TYPE_RE)) {
        c++
        continue
      }
      if (match(IGNORE_RE)) {
        continue
      }
      return 0
    }
    a = Math.min(a, 0xff)
    b = Math.min(b, 0xff)
    c = Math.min(c, 0xff)
    return (a << 16) | (b << 8) | c
  }
  const ID_RE = /^#[^\s\+>~#\.\[:]+/
  const CLASS_RE = /^\.[^\s\+>~#\.\[:]+/
  const ATTR_RE = /^\[[^\]]+\]/
  const TYPE_RE = /^[^\s\+>~#\.\[:]+/
  const PSEUDO_ELEM_RE =
    /^(::[^\s\+>~#\.\[:]+|:first-line|:first-letter|:before|:after)/
  const PSEDUO_CLASS_RE = /^:[^\s\+>~#\.\[:]+/
  const IGNORE_RE = /^[\s\+>~\*]+/
  const NEGATION_RE = /:not\(([^\)]+)\)/g
}
