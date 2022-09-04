import * as qh from "../hooks.js"
import * as qr from "react"
import * as qu from "./utils.js"

const Context = qr.createContext(qu.canUseDOM ? window : undefined)
export const WindowProvider = Context.Provider

export function useWindow() {
  return qr.useContext(Context)
}

export type DOMContainer<T extends HTMLElement = HTMLElement> =
  | T
  | qr.RefObject<T>
  | null
  | (() => T | qr.RefObject<T> | null)

export const resolveContainerRef = <T extends HTMLElement>(
  ref: DOMContainer<T> | undefined,
  doc?: Document
): T | HTMLBodyElement | null => {
  if (!qu.canUseDOM) return null
  if (ref == null) return (doc || qu.ownerDocument()).body as HTMLBodyElement
  if (typeof ref === "function") ref = ref()
  if (ref && "current" in ref) ref = ref.current
  if (ref?.nodeType) return ref || null
  return null
}

export function useWaitForDOMRef<T extends HTMLElement = HTMLElement>(
  ref: DOMContainer<T> | undefined,
  onResolved?: (element: T | HTMLBodyElement) => void
) {
  const w = useWindow()
  const [resolved, setResolved] = qr.useState(() =>
    resolveContainerRef(ref, w?.document)
  )
  if (!resolved) {
    const early = resolveContainerRef(ref)
    if (early) setResolved(early)
  }
  qr.useEffect(() => {
    if (onResolved && resolved) onResolved(resolved)
  }, [onResolved, resolved])
  qr.useEffect(() => {
    const next = resolveContainerRef(ref)
    if (next !== resolved) setResolved(next)
  }, [ref, resolved])
  return resolved
}

export type MouseEvents = {
  [K in keyof GlobalEventHandlersEventMap]: GlobalEventHandlersEventMap[K] extends MouseEvent
    ? K
    : never
}[keyof GlobalEventHandlersEventMap]

function isLeftClickEvent(e: MouseEvent) {
  return e.button === 0
}

function isModifiedEvent(e: MouseEvent) {
  return !!(e.metaKey || e.altKey || e.ctrlKey || e.shiftKey)
}

export const getRefTarget = (
  ref: qr.RefObject<Element | undefined> | Element | null | undefined
) => ref && ("current" in ref ? ref.current : ref)

export interface ClickOutsideOptions {
  disabled?: boolean | undefined
  clickTrigger?: MouseEvents | undefined
}

const InitialTriggerEvents: Partial<Record<MouseEvents, MouseEvents>> = {
  click: "mousedown",
  mouseup: "mousedown",
  pointerup: "pointerdown",
}

export function useClickOutside(
  ref: qr.RefObject<Element | undefined> | Element | null | undefined,
  onClickOutside: (e: Event) => void = qh.noop,
  { disabled, clickTrigger = "click" }: ClickOutsideOptions = {}
) {
  const prevent = qr.useRef(false)
  const waiting = qr.useRef(false)
  const doMouseCapture = qr.useCallback(
    (e: any) => {
      const target = getRefTarget(ref)
      qu.warning(
        !!target,
        "ClickOutside captured a close event but does not have a ref to compare it to. " +
          "useClickOutside(), should be passed a ref that resolves to a DOM node"
      )
      prevent.current =
        !target ||
        isModifiedEvent(e) ||
        !isLeftClickEvent(e) ||
        !!qu.contains(target, e.target) ||
        waiting.current
      waiting.current = false
    },
    [ref]
  )
  const doInitialMouse = qh.useEventCB((e: MouseEvent) => {
    const target = getRefTarget(ref)
    if (target && qu.contains(target, e.target as any)) {
      waiting.current = true
    }
  })
  const doMouse = qh.useEventCB((e: MouseEvent) => {
    if (!prevent.current) onClickOutside(e)
  })
  qr.useEffect(() => {
    if (disabled || ref == null) return undefined
    const doc = qu.ownerDocument(getRefTarget(ref)!)
    let event = (doc.defaultView || window).event
    let removeListener: (() => void) | null = null
    if (InitialTriggerEvents[clickTrigger]) {
      removeListener = qu.listen(
        doc as any,
        InitialTriggerEvents[clickTrigger]!,
        doInitialMouse,
        true
      )
    }
    const removeMouseCaptureListener = qu.listen(
      doc as any,
      clickTrigger,
      doMouseCapture,
      true
    )
    const removeMouseListener = qu.listen(doc as any, clickTrigger, e => {
      if (e === event) {
        event = undefined
        return
      }
      doMouse(e)
    })
    let mobileListeners = [] as Array<() => void>
    if ("ontouchstart" in doc.documentElement) {
      mobileListeners = [].slice
        .call(doc.body.children)
        .map(el => qu.listen(el, "mousemove", qh.noop))
    }
    return () => {
      removeListener?.()
      removeMouseCaptureListener()
      removeMouseListener()
      mobileListeners.forEach(remove => remove())
    }
  }, [ref, disabled, clickTrigger, doMouseCapture, doInitialMouse, doMouse])
}

const escapeKeyCode = 27

export interface RootCloseOptions extends ClickOutsideOptions {
  disabled?: boolean | undefined
}

export function useRootClose(
  ref: qr.RefObject<Element | undefined> | Element | null | undefined,
  onRootClose: (e: Event) => void,
  { disabled, clickTrigger }: RootCloseOptions = {}
) {
  const onClose = onRootClose || qh.noop
  useClickOutside(ref, onClose, { disabled, clickTrigger })
  const doKeyUp = qh.useEventCB((e: KeyboardEvent) => {
    if (e.keyCode === escapeKeyCode) onClose(e)
  })
  qr.useEffect(() => {
    if (disabled || ref == null) return undefined
    const doc = qu.ownerDocument(getRefTarget(ref)!)
    let event = (doc.defaultView || window).event
    const removeKeyupListener = qu.listen(doc as any, "keyup", e => {
      if (e === event) {
        event = undefined
        return
      }
      doKeyUp(e)
    })
    return () => {
      removeKeyupListener()
    }
  }, [ref, disabled, doKeyUp])
}

export function useScrollParent(e: null | Element) {
  const [parent, setParent] = qr.useState<
    Element | Document | null | undefined
  >(null)
  qh.useIsomorphicEffect(() => {
    if (e) setParent(qu.getScrollParent(e as any, true))
  }, [e])
  return parent
}

export interface WaypointEvent {
  position: Position
  previousPosition: Position | null
}

export interface Rect {
  top?: number
  bottom?: number
  left?: number
  right?: number
}

export type WaypointCB = (
  details: WaypointEvent,
  entry: IntersectionObserverEntry,
  observer: IntersectionObserver
) => void

export type RootElement = Element | Document | null | undefined

export interface WaypointOptions
  extends Omit<IntersectionObserverInit, "rootMargin" | "root"> {
  root?: RootElement | "scrollParent" | ((element: Element) => RootElement)
  rootMargin?: string | Rect
  scrollDirection?: "vertical" | "horizontal"
}

export enum Position {
  UNKNOWN = 0,
  BEFORE,
  INSIDE,
  AFTER,
}

function toCss(margin?: string | Rect) {
  if (!margin || typeof margin === "string") return margin
  const { top = 0, right = 0, bottom = 0, left = 0 } = margin
  return `${top}px ${right}px ${bottom}px ${left}px`
}

const findRoot = (e: Element) => qu.getScrollParent(e as HTMLElement, true)

export function useWaypoint(
  e: Element | null,
  callback: WaypointCB,
  opts: WaypointOptions = {}
): void {
  const { rootMargin, threshold, scrollDirection = "vertical" } = opts
  let { root } = opts
  const cb = qh.useEventCB(callback)
  const prevRef = qr.useRef<Position | null>(null)
  if (root === "scrollParent") root = findRoot
  const scrollParent = qr.useMemo(
    () => (e && typeof root === "function" ? root(e) : null),
    [e, root]
  )
  let root2 = typeof root === "function" ? scrollParent : root
  if (root2 && root2.nodeType === document.DOCUMENT_NODE) {
    root2 = undefined
  }
  qh.useIntersectionObserver(
    e,
    ([x], observer) => {
      if (!x) return
      const [start, end, point] =
        scrollDirection === "vertical"
          ? (["top", "bottom", "y"] as const)
          : (["left", "right", "x"] as const)
      const { [point]: coord } = x.boundingClientRect
      const rootStart = x.rootBounds?.[start] || 0
      const rootEnd = x.rootBounds?.[end] || 0
      let pos: Position = Position.UNKNOWN
      if (x.isIntersecting) pos = Position.INSIDE
      else if (coord > rootEnd) pos = Position.AFTER
      else if (coord < rootStart) pos = Position.BEFORE
      const prev = prevRef.current
      if (prev === pos) return
      cb({ position: pos, previousPosition: prev }, x, observer)
      prevRef.current = pos
    },
    {
      threshold: threshold!,
      root: root2!,
      rootMargin: toCss(rootMargin)!,
    }
  )
}
