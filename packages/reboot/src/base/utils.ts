import type * as CSS from "csstype"

export type HyphenProp = keyof CSS.PropertiesHyphen
export type CamelProp = keyof CSS.Properties
export type Property = HyphenProp | CamelProp

function printWarning(format: any, ...xs: any[]) {
  let i = 0
  const m =
    "Warning: " +
    format.replace(/%s/g, function () {
      return xs[i++]
    })
  if (typeof console !== "undefined") {
    console.error(m)
  }
  try {
    throw new Error(m)
  } catch (x) {}
}
export function warning(cond: any, format: any, ...xs: any[]) {
  if (format === undefined) {
    throw new Error(
      "`warning(condition, format, ...args)` requires a warning message argument"
    )
  }
  if (!cond) {
    printWarning(format, ...xs)
  }
}
export function getBodyScrollbarWidth(x = document) {
  const window = x.defaultView!
  return Math.abs(window.innerWidth - x.documentElement.clientWidth)
}
export function isTrivialHref(x?: string) {
  return !x || x.trim() === "#"
}
export const canUseDOM = !!(
  typeof window !== "undefined" &&
  window.document &&
  window.document.createElement
)
export function activeElement(doc = ownerDocument()) {
  try {
    const active = doc.activeElement
    if (!active || !active.nodeName) return null
    return active
  } catch (e) {
    return doc.body
  }
}
export function addClass(element: Element | SVGElement, className: string) {
  if (element.classList) element.classList.add(className)
  else if (!hasClass(element, className))
    if (typeof element.className === "string")
      (element as Element).className = `${element.className} ${className}`
    else
      element.setAttribute(
        "class",
        `${(element.className && element.className.baseVal) || ""} ${className}`
      )
}
export let optionsSupported = false
export let onceSupported = false
try {
  const options = {
    get passive() {
      return (optionsSupported = true)
    },
    get once() {
      return (onceSupported = optionsSupported = true)
    },
  }
  if (canUseDOM) {
    window.addEventListener("test", options as any, options)
    window.removeEventListener("test", options as any, true)
  }
} catch (e) {}
export type EventHandler<K extends keyof HTMLElementEventMap> = (
  this: HTMLElement,
  event: HTMLElementEventMap[K]
) => any
export type TaggedEventHandler<K extends keyof HTMLElementEventMap> =
  EventHandler<K> & { __once?: EventHandler<K> }
export function addEventListener<K extends keyof HTMLElementEventMap>(
  node: HTMLElement,
  eventName: K,
  handler: TaggedEventHandler<K>,
  options?: boolean | AddEventListenerOptions
) {
  if (options && typeof options !== "boolean" && !onceSupported) {
    const { once, capture } = options
    let wrappedHandler = handler
    if (!onceSupported && once) {
      wrappedHandler =
        handler.__once ||
        function onceHandler(event) {
          this.removeEventListener(eventName, onceHandler, capture)
          handler.call(this, event)
        }
      handler.__once = wrappedHandler
    }
    node.addEventListener(
      eventName,
      wrappedHandler,
      optionsSupported ? options : capture
    )
  }
  node.addEventListener(eventName, handler, options)
}
const reset: Partial<Record<Property, string>> = {
  transition: "",
  "transition-duration": "",
  "transition-delay": "",
  "transition-timing-function": "",
}
type AnimateProperties = Record<Property | TransformValue, string>
interface Options {
  node: HTMLElement
  properties: AnimateProperties
  duration?: number | undefined
  easing?: string | undefined
  callback?: EventHandler<"transitionend"> | undefined
}
interface Cancel {
  cancel(): void
}
function _animate({
  node,
  properties,
  duration = 200,
  easing,
  callback,
}: Options) {
  const cssProperties = [] as Property[]
  const cssValues: Partial<Record<Property, string>> = {}
  let transforms = ""
  Object.keys(properties).forEach((key: Property) => {
    const value = properties[key]
    if (isTransform(key)) transforms += `${key}(${value}) `
    else {
      cssValues[key] = value
      cssProperties.push(hyphenate(key) as Property)
    }
  })
  if (transforms) {
    cssValues.transform = transforms
    cssProperties.push("transform")
  }
  function done(this: HTMLElement, event: TransitionEvent) {
    if (event.target !== event.currentTarget) return
    css(node, reset)
    if (callback) callback.call(this, event)
  }
  if (duration > 0) {
    cssValues.transition = cssProperties.join(", ")
    cssValues["transition-duration"] = `${duration / 1000}s`
    cssValues["transition-delay"] = "0s"
    cssValues["transition-timing-function"] = easing || "linear"
  }
  const removeListener = transitionEnd(node, done, duration)
  node.clientLeft
  css(node, cssValues)
  return {
    cancel() {
      removeListener()
      css(node, reset)
    },
  }
}
export function animate(options: Options): Cancel
export function animate(
  node: HTMLElement,
  properties: AnimateProperties,
  duration: number
): Cancel
export function animate(
  node: HTMLElement,
  properties: AnimateProperties,
  duration: number,
  callback: EventHandler<"transitionend">
): Cancel
export function animate(
  node: HTMLElement,
  properties: AnimateProperties,
  duration: number,
  easing: string,
  callback: EventHandler<"transitionend">
): Cancel
export function animate(
  nodeOrOptions: HTMLElement | Options,
  properties?: AnimateProperties,
  duration?: number,
  easing?: string | EventHandler<"transitionend">,
  callback?: EventHandler<"transitionend">
) {
  if (!("nodeType" in nodeOrOptions)) {
    return _animate(nodeOrOptions)
  }
  if (!properties) {
    throw new Error("must include properties to animate")
  }
  if (typeof easing === "function") {
    callback = easing
    easing = ""
  }
  return _animate({
    node: nodeOrOptions,
    properties,
    duration,
    easing,
    callback,
  })
}
type Vendor = "" | "webkit" | "moz" | "o" | "ms"
type RequestAnimationFrame = typeof requestAnimationFrame
let prev = new Date().getTime()
function fallback(fn: FrameRequestCallback): number {
  const curr = new Date().getTime()
  const ms = Math.max(0, 16 - (curr - prev))
  const handle = setTimeout(fn, ms)
  prev = curr
  return handle as any
}
const vendors = ["", "webkit", "moz", "o", "ms"] as Vendor[]
let cancelMethod = "clearTimeout"
let rafImpl: RequestAnimationFrame = fallback
const getKey = (vendor: Vendor, k: string) =>
  `${vendor + (!vendor ? k : k[0]!.toUpperCase() + k.substr(1))}AnimationFrame`
if (canUseDOM) {
  vendors.some(vendor => {
    const rafMethod = getKey(vendor, "request")
    if (rafMethod in window) {
      cancelMethod = getKey(vendor, "cancel")
      rafImpl = cb => window[rafMethod](cb)
    }
    return !!rafImpl
  })
}
export const cancel = (id: number) => {
  if (typeof window[cancelMethod] === "function") window[cancelMethod](id)
}
export const request = rafImpl
export function attribute(
  node: Element | null,
  attr: string,
  val?: string | boolean | null
): string | null | undefined {
  if (node) {
    if (typeof val === "undefined") {
      return node.getAttribute(attr)
    }
    if (!val && val !== "") {
      node.removeAttribute(attr)
    } else {
      node.setAttribute(attr, String(val))
    }
  }
  return
}
const rHyphen = /-(.)/g
export function camelize(string: string): string {
  return string.replace(rHyphen, (_, chr) => chr.toUpperCase())
}
const msPattern = /^-ms-/
export function camelizeStyleName<T extends string = Property>(
  string: T
): CamelProp {
  return camelize(string.replace(msPattern, "ms-")) as CamelProp
}
export function childElements(node: Element | null): Element[] {
  return node ? Array.from(node.children) : []
}
const toArray = Function.prototype.bind.call(Function.prototype.call, [].slice)
export function childNodes(node: Element | null): Node[] {
  return node ? toArray(node.childNodes) : []
}
export function clear(node: Node | null): Node | null {
  if (node) {
    while (node.firstChild) {
      node.removeChild(node.firstChild)
    }
    return node
  }
  return null
}
export function closest(
  node: Element,
  selector: string,
  stopAt?: Element
): Element | null {
  if (node.closest && !stopAt) node.closest(selector)
  let nextNode: Element | null = node
  do {
    if (matches(nextNode, selector)) return nextNode
    nextNode = nextNode.parentElement
  } while (
    nextNode &&
    nextNode !== stopAt &&
    nextNode.nodeType === document.ELEMENT_NODE
  )
  return null
}
type TraverseDirection =
  | "parentElement"
  | "previousElementSibling"
  | "nextElementSibling"
export function collectElements(
  node: Element | null,
  direction: TraverseDirection
): Element[] {
  let nextNode: Element | null = null
  const nodes: Element[] = []

  nextNode = node ? node[direction] : null
  while (nextNode && nextNode.nodeType !== 9) {
    nodes.push(nextNode)
    nextNode = nextNode[direction] || null
  }
  return nodes
}
export function collectSiblings(
  node: Element | null,
  refNode: Element | null = null,
  selector: string | null = null
): Element[] {
  const siblings: Element[] = []
  for (; node; node = node.nextElementSibling) {
    if (node !== refNode) {
      if (selector && matches(node, selector)) {
        break
      }
      siblings.push(node)
    }
  }

  return siblings
}
export function contains(context: Element, node: Element) {
  if (context.contains) return context.contains(node)
  if (context.compareDocumentPosition)
    return context === node || !!(context.compareDocumentPosition(node) & 16)
}
export function css(
  node: HTMLElement,
  property: Partial<Record<Property, string>>
): void
export function css<T extends HyphenProp>(
  node: HTMLElement,
  property: T
): CSS.PropertiesHyphen[T]
export function css<T extends CamelProp>(
  node: HTMLElement,
  property: T
): CSS.Properties[T]
export function css<T extends Property>(
  node: HTMLElement,
  property: T | Record<Property, string | number>
) {
  let css = ""
  let transforms = ""
  if (typeof property === "string") {
    return (
      node.style.getPropertyValue(hyphenate(property)) ||
      getComputedStyle(node).getPropertyValue(hyphenate(property))
    )
  }
  Object.keys(property).forEach((key: Property) => {
    const value = property[key]
    if (!value && value !== 0) {
      node.style.removeProperty(hyphenate(key))
    } else if (isTransform(key)) {
      transforms += `${key}(${value}) `
    } else {
      css += `${hyphenate(key)}: ${value};`
    }
  })
  if (transforms) {
    css += `transform: ${transforms};`
  }
  node.style.cssText += `;${css}`
}
export function filterEvents<K extends keyof HTMLElementEventMap>(
  selector: string,
  handler: EventHandler<K>
): EventHandler<K> {
  return function filterHandler(this: HTMLElement, e: HTMLElementEventMap[K]) {
    const top = e.currentTarget as HTMLElement
    const target = e.target as HTMLElement
    const matches = qsa(top, selector)
    if (matches.some(match => contains(match, target))) handler.call(this, e)
  }
}
export function getComputedStyle(node: HTMLElement, psuedoElement?: string) {
  return ownerWindow(node).getComputedStyle(node, psuedoElement)
}
export function getScrollAccessor(offset: "pageXOffset" | "pageYOffset") {
  const prop: "scrollLeft" | "scrollTop" =
    offset === "pageXOffset" ? "scrollLeft" : "scrollTop"
  function scrollAccessor(node: Element): number
  function scrollAccessor(node: Element, val: number): undefined
  function scrollAccessor(node: Element, val?: number) {
    const win = isWindow(node)
    if (val === undefined) {
      return win ? win[offset] : node[prop]
    }
    if (win) {
      win.scrollTo(win[offset], val)
    } else {
      node[prop] = val
    }
  }
  return scrollAccessor
}
export function hasClass(element: Element | SVGElement, className: string) {
  if (element.classList)
    return !!className && element.classList.contains(className)
  return (
    ` ${element.className.baseVal || element.className} `.indexOf(
      ` ${className} `
    ) !== -1
  )
}
export function height(node: HTMLElement, client?: boolean) {
  const win = isWindow(node)
  return win
    ? win.innerHeight
    : client
    ? node.clientHeight
    : getOffset(node).height
}
const rUpper = /([A-Z])/g
export function hyphenate(string: string) {
  return string.replace(rUpper, "-$1").toLowerCase()
}
const msPattern2 = /^ms-/
export function hyphenateStyleName(string: Property): Property {
  return hyphenate(string).replace(msPattern2, "-ms-") as HyphenProp
}
export function insertAfter(
  node: Node | null,
  refNode: Node | null
): Node | null {
  if (node && refNode && refNode.parentNode) {
    if (refNode.nextSibling) {
      refNode.parentNode.insertBefore(node, refNode.nextSibling)
    } else {
      refNode.parentNode.appendChild(node)
    }
    return node
  }
  return null
}
export function isDocument(
  element: Element | Document | Window
): element is Document {
  return "nodeType" in element && element.nodeType === document.DOCUMENT_NODE
}
const regExpInputs = /^(?:input|select|textarea|button)$/i
export function isInput(node: Element | null): boolean {
  return node ? regExpInputs.test(node.nodeName) : false
}
const supportedTransforms =
  /^((translate|rotate|scale)(X|Y|Z|3d)?|matrix(3d)?|perspective|skew(X|Y)?)$/i
export type TransformValue =
  | "translate"
  | "translateY"
  | "translateX"
  | "translateZ"
  | "translate3d"
  | "rotate"
  | "rotateY"
  | "rotateX"
  | "rotateZ"
  | "rotate3d"
  | "scale"
  | "scaleY"
  | "scaleX"
  | "scaleZ"
  | "scale3d"
  | "matrix"
  | "matrix3d"
  | "perspective"
  | "skew"
  | "skewY"
  | "skewX"
export function isTransform(value: string): value is TransformValue {
  return !!(value && supportedTransforms.test(value))
}
export function isVisible(node: HTMLElement | null): boolean {
  return node
    ? !!(node.offsetWidth || node.offsetHeight || node.getClientRects().length)
    : false
}
export function isWindow(node: Element | Document | Window): Window | false {
  if ("window" in node && node.window === node) return node
  if (isDocument(node)) return node.defaultView || false
  return false
}
export function listen<K extends keyof HTMLElementEventMap>(
  node: HTMLElement,
  eventName: K,
  handler: EventHandler<K>,
  options?: boolean | AddEventListenerOptions
) {
  addEventListener(node, eventName, handler, options)
  return () => {
    removeEventListener(node, eventName, handler, options)
  }
}
let matchesImpl: (node: Element, selector: string) => boolean
export function matches(node: Element, selector: string) {
  if (!matchesImpl) {
    const body: any = document.body
    const nativeMatch =
      body.matches ||
      body.matchesSelector ||
      body.webkitMatchesSelector ||
      body.mozMatchesSelector ||
      body.msMatchesSelector
    matchesImpl = (n: Element, s: string) => nativeMatch.call(n, s)
  }
  return matchesImpl(node, selector)
}
export function nextUntil(node: Element | null, selector: string): Element[] {
  return collectSiblings(node, node, selector)
}
export function getOffset(node: HTMLElement) {
  const doc = ownerDocument(node)
  let box = { top: 0, left: 0, height: 0, width: 0 }
  const docElem = doc && doc.documentElement
  if (!docElem || !contains(docElem, node)) return box
  if (node.getBoundingClientRect !== undefined)
    box = node.getBoundingClientRect()
  box = {
    top: box.top + scrollTop(docElem) - (docElem.clientTop || 0),
    left: box.left + scrollLeft(docElem) - (docElem.clientLeft || 0),
    width: box.width,
    height: box.height,
  }
  return box
}
const isHTMLElement = (e: Element | null): e is HTMLElement =>
  !!e && "offsetParent" in e
export function getOffsetParent(node: HTMLElement): HTMLElement {
  const doc = ownerDocument(node)
  let parent = node && node.offsetParent
  while (
    isHTMLElement(parent) &&
    parent.nodeName !== "HTML" &&
    css(parent, "position") === "static"
  ) {
    parent = parent.offsetParent
  }
  return (parent || doc.documentElement) as HTMLElement
}
export function ownerDocument(x?: Element) {
  return (x && x.ownerDocument) || document
}
export function ownerWindow(x?: Element): Window {
  const doc = ownerDocument(x)
  return (doc && doc.defaultView) || window
}
export function parents(x: Element | null): Element[] {
  return collectElements(x, "parentElement")
}
const nodeName = (node: Element) => node.nodeName && node.nodeName.toLowerCase()
export function position(node: HTMLElement, offsetParent?: HTMLElement) {
  let parentOffset = { top: 0, left: 0 }
  let offset
  if (css(node, "position") === "fixed") {
    offset = node.getBoundingClientRect()
  } else {
    const parent: HTMLElement = offsetParent || getOffsetParent(node)
    offset = getOffset(node)
    if (nodeName(parent) !== "html") parentOffset = getOffset(parent)
    const borderTop = String(css(parent, "borderTopWidth") || 0)
    parentOffset.top += parseInt(borderTop, 10) - scrollTop(parent) || 0
    const borderLeft = String(css(parent, "borderLeftWidth") || 0)
    parentOffset.left += parseInt(borderLeft, 10) - scrollLeft(parent) || 0
  }
  const marginTop = String(css(node, "marginTop") || 0)
  const marginLeft = String(css(node, "marginLeft") || 0)
  return {
    ...offset,
    top: offset.top - parentOffset.top - (parseInt(marginTop, 10) || 0),
    left: offset.left - parentOffset.left - (parseInt(marginLeft, 10) || 0),
  }
}
export function prepend(
  x: Element | null,
  parent: Element | null
): Element | null {
  if (x && parent) {
    if (parent.firstElementChild) {
      parent.insertBefore(x, parent.firstElementChild)
    } else {
      parent.appendChild(x)
    }
    return x
  }
  return null
}
const toArray2 = Function.prototype.bind.call(Function.prototype.call, [].slice)
export function qsa(
  element: HTMLElement | Document,
  selector: string
): HTMLElement[] {
  return toArray2(element.querySelectorAll(selector))
}
export function remove(x: Node | null): Node | null {
  if (x && x.parentNode) {
    x.parentNode.removeChild(x)
    return x
  }
  return null
}
function replaceClassName(origClass: string, classToRemove: string) {
  return origClass
    .replace(new RegExp(`(^|\\s)${classToRemove}(?:\\s|$)`, "g"), "$1")
    .replace(/\s+/g, " ")
    .replace(/^\s*|\s*$/g, "")
}
export function removeClass(x: Element | SVGElement, className: string) {
  if (x.classList) {
    x.classList.remove(className)
  } else if (typeof x.className === "string") {
    ;(x as Element).className = replaceClassName(x.className, className)
  } else {
    x.setAttribute(
      "class",
      replaceClassName((x.className && x.className.baseVal) || "", className)
    )
  }
}
export function removeEventListener<K extends keyof HTMLElementEventMap>(
  x: HTMLElement,
  eventName: K,
  handler: TaggedEventHandler<K>,
  options?: boolean | EventListenerOptions
) {
  const capture =
    options && typeof options !== "boolean" ? options.capture : options
  x.removeEventListener(eventName, handler, capture)
  if (handler.__once) {
    x.removeEventListener(eventName, handler.__once, capture)
  }
}
export const scrollLeft = getScrollAccessor("pageXOffset")
export function getScrollParent(x: HTMLElement, firstPossible?: boolean) {
  const position = css(x, "position")
  const excludeStatic = position === "absolute"
  const ownerDoc = x.ownerDocument
  if (position === "fixed") return ownerDoc || document
  while ((x = x.parentNode) && !isDocument(x)) {
    const isStatic = excludeStatic && css(x, "position") === "static"
    const style =
      (css(x, "overflow") || "") +
      (css(x, "overflow-y") || "") +
      css(x, "overflow-x")
    if (isStatic) continue
    if (
      /(auto|scroll)/.test(style) &&
      (firstPossible || height(x) < x!.scrollHeight)
    ) {
      return x
    }
  }
  return ownerDoc || document
}
export function scrollTo(selected: HTMLElement, scrollParent?: HTMLElement) {
  let offset = getOffset(selected)
  let poff = { top: 0, left: 0 }
  if (!selected) return undefined
  const list = scrollParent || (getScrollParent(selected) as HTMLElement)
  const isWin = isWindow(list)
  let listScrollTop = scrollTop(list)
  const listHeight = height(list, true)
  if (!isWin) poff = getOffset(list)
  offset = {
    top: offset.top - poff.top,
    left: offset.left - poff.left,
    height: offset.height,
    width: offset.width,
  }
  const selectedHeight = offset.height
  const selectedTop = offset.top + (isWin ? 0 : listScrollTop)
  const bottom = selectedTop + selectedHeight
  listScrollTop =
    listScrollTop > selectedTop
      ? selectedTop
      : bottom > listScrollTop + listHeight
      ? bottom - listHeight
      : listScrollTop
  const id = request(() => scrollTop(list, listScrollTop))
  return () => cancel(id)
}
export const scrollTop = getScrollAccessor("pageYOffset")
let size: number
export function getScrollbarSize(recalc?: boolean) {
  if ((!size && size !== 0) || recalc) {
    if (canUseDOM) {
      const scrollDiv = document.createElement("div")
      scrollDiv.style.position = "absolute"
      scrollDiv.style.top = "-9999px"
      scrollDiv.style.width = "50px"
      scrollDiv.style.height = "50px"
      scrollDiv.style.overflow = "scroll"
      document.body.appendChild(scrollDiv)
      size = scrollDiv.offsetWidth - scrollDiv.clientWidth
      document.body.removeChild(scrollDiv)
    }
  }
  return size
}
export function siblings(node: Element | null): Element[] {
  return collectSiblings(
    node && node.parentElement ? node.parentElement.firstElementChild : null,
    node
  )
}
const regExpNbspEntity = /&nbsp;/gi
const regExpNbspHex = /\xA0/g
const regExpSpaces = /\s+([^\s])/gm
export function text(
  node: HTMLElement | null,
  trim = true,
  singleSpaces = true
): string {
  let elementText: string | null = ""

  if (node) {
    elementText = (node.textContent || "")
      .replace(regExpNbspEntity, " ")
      .replace(regExpNbspHex, " ")
    if (trim) {
      elementText = elementText.trim()
    }
    if (singleSpaces) {
      elementText = elementText.replace(regExpSpaces, " $1")
    }
  }

  return elementText
}
export function toggleClass(element: Element | SVGElement, className: string) {
  if (element.classList) element.classList.toggle(className)
  else if (hasClass(element, className)) removeClass(element, className)
  else addClass(element, className)
}
export type Listener = (this: HTMLElement, ev: TransitionEvent) => any
function parseDuration(node: HTMLElement) {
  const str = css(node, "transitionDuration") || ""
  const mult = str.indexOf("ms") === -1 ? 1000 : 1
  return parseFloat(str) * mult
}
function emulateTransitionEnd(
  element: HTMLElement,
  duration: number,
  padding = 5
) {
  let called = false
  const handle = setTimeout(() => {
    if (!called) triggerEvent(element, "transitionend", true)
  }, duration + padding)
  const remove = listen(
    element,
    "transitionend",
    () => {
      called = true
    },
    { once: true }
  )
  return () => {
    clearTimeout(handle)
    remove()
  }
}
export function transitionEnd(
  element: HTMLElement,
  handler: Listener,
  duration?: number | null,
  padding?: number
) {
  if (duration == null) duration = parseDuration(element) || 0
  const removeEmulate = emulateTransitionEnd(element, duration, padding)
  const remove = listen(element, "transitionend", handler)
  return () => {
    removeEmulate()
    remove()
  }
}
export function triggerEvent<K extends keyof HTMLElementEventMap>(
  node: HTMLElement | null,
  eventName: K,
  bubbles = false,
  cancelable = true
) {
  if (node) {
    const event: Event = document.createEvent("HTMLEvents")
    event.initEvent(eventName, bubbles, cancelable)
    node.dispatchEvent(event)
  }
}
export function getWidth(node: HTMLElement, client?: boolean) {
  const win = isWindow(node)
  return win
    ? win.innerWidth
    : client
    ? node.clientWidth
    : getOffset(node).width
}
