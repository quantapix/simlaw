import {} from "react"
import {
  canUseDOM,
  contains,
  listen,
  ownerDocument,
  warning,
  getScrollParent,
} from "./utils.js"
import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import {
  useEventCallback,
  useIsomorphicEffect,
  useIntersectionObserver,
} from "../hooks.js"

const Context = createContext(canUseDOM ? window : undefined)
export const WindowProvider = Context.Provider
export function useWindow() {
  return useContext(Context)
}
export type DOMContainer<T extends HTMLElement = HTMLElement> =
  | T
  | React.RefObject<T>
  | null
  | (() => T | React.RefObject<T> | null)
export const resolveContainerRef = <T extends HTMLElement>(
  ref: DOMContainer<T> | undefined,
  document?: Document
): T | HTMLBodyElement | null => {
  if (!canUseDOM) return null
  if (ref == null) return (document || ownerDocument()).body as HTMLBodyElement
  if (typeof ref === "function") ref = ref()
  if (ref && "current" in ref) ref = ref.current
  if (ref?.nodeType) return ref || null
  return null
}
export function useWaitForDOMRef<T extends HTMLElement = HTMLElement>(
  ref: DOMContainer<T> | undefined,
  onResolved?: (element: T | HTMLBodyElement) => void
) {
  const window = useWindow()
  const [resolvedRef, setRef] = useState(() =>
    resolveContainerRef(ref, window?.document)
  )
  if (!resolvedRef) {
    const earlyRef = resolveContainerRef(ref)
    if (earlyRef) setRef(earlyRef)
  }
  useEffect(() => {
    if (onResolved && resolvedRef) {
      onResolved(resolvedRef)
    }
  }, [onResolved, resolvedRef])
  useEffect(() => {
    const nextRef = resolveContainerRef(ref)
    if (nextRef !== resolvedRef) {
      setRef(nextRef)
    }
  }, [ref, resolvedRef])
  return resolvedRef
}

const noop = () => {}
export type MouseEvents = {
  [K in keyof GlobalEventHandlersEventMap]: GlobalEventHandlersEventMap[K] extends MouseEvent
    ? K
    : never
}[keyof GlobalEventHandlersEventMap]
function isLeftClickEvent(event: MouseEvent) {
  return event.button === 0
}
function isModifiedEvent(event: MouseEvent) {
  return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey)
}
export const getRefTarget = (
  ref: React.RefObject<Element> | Element | null | undefined
) => ref && ("current" in ref ? ref.current : ref)
export interface ClickOutsideOptions {
  disabled?: boolean
  clickTrigger?: MouseEvents
}
const InitialTriggerEvents: Partial<Record<MouseEvents, MouseEvents>> = {
  click: "mousedown",
  mouseup: "mousedown",
  pointerup: "pointerdown",
}
export function useClickOutside(
  ref: React.RefObject<Element> | Element | null | undefined,
  onClickOutside: (e: Event) => void = noop,
  { disabled, clickTrigger = "click" }: ClickOutsideOptions = {}
) {
  const preventMouseClickOutsideRef = useRef(false)
  const waitingForTrigger = useRef(false)
  const handleMouseCapture = useCallback(
    e => {
      const currentTarget = getRefTarget(ref)
      warning(
        !!currentTarget,
        "ClickOutside captured a close event but does not have a ref to compare it to. " +
          "useClickOutside(), should be passed a ref that resolves to a DOM node"
      )
      preventMouseClickOutsideRef.current =
        !currentTarget ||
        isModifiedEvent(e) ||
        !isLeftClickEvent(e) ||
        !!contains(currentTarget, e.target) ||
        waitingForTrigger.current
      waitingForTrigger.current = false
    },
    [ref]
  )
  const handleInitialMouse = useEventCallback((e: MouseEvent) => {
    const currentTarget = getRefTarget(ref)
    if (currentTarget && contains(currentTarget, e.target as any)) {
      waitingForTrigger.current = true
    }
  })
  const handleMouse = useEventCallback((e: MouseEvent) => {
    if (!preventMouseClickOutsideRef.current) {
      onClickOutside(e)
    }
  })
  useEffect(() => {
    if (disabled || ref == null) return undefined
    const doc = ownerDocument(getRefTarget(ref)!)
    let currentEvent = (doc.defaultView || window).event
    let removeInitialTriggerListener: (() => void) | null = null
    if (InitialTriggerEvents[clickTrigger]) {
      removeInitialTriggerListener = listen(
        doc as any,
        InitialTriggerEvents[clickTrigger]!,
        handleInitialMouse,
        true
      )
    }
    const removeMouseCaptureListener = listen(
      doc as any,
      clickTrigger,
      handleMouseCapture,
      true
    )
    const removeMouseListener = listen(doc as any, clickTrigger, e => {
      if (e === currentEvent) {
        currentEvent = undefined
        return
      }
      handleMouse(e)
    })
    let mobileSafariHackListeners = [] as Array<() => void>
    if ("ontouchstart" in doc.documentElement) {
      mobileSafariHackListeners = [].slice
        .call(doc.body.children)
        .map(el => listen(el, "mousemove", noop))
    }
    return () => {
      removeInitialTriggerListener?.()
      removeMouseCaptureListener()
      removeMouseListener()
      mobileSafariHackListeners.forEach(remove => remove())
    }
  }, [
    ref,
    disabled,
    clickTrigger,
    handleMouseCapture,
    handleInitialMouse,
    handleMouse,
  ])
}
const escapeKeyCode = 27
export interface RootCloseOptions extends ClickOutsideOptions {
  disabled?: boolean
}
export function useRootClose(
  ref: React.RefObject<Element> | Element | null | undefined,
  onRootClose: (e: Event) => void,
  { disabled, clickTrigger }: RootCloseOptions = {}
) {
  const onClose = onRootClose || noop
  useClickOutside(ref, onClose, { disabled, clickTrigger })
  const handleKeyUp = useEventCallback((e: KeyboardEvent) => {
    if (e.keyCode === escapeKeyCode) {
      onClose(e)
    }
  })
  useEffect(() => {
    if (disabled || ref == null) return undefined
    const doc = ownerDocument(getRefTarget(ref)!)
    let currentEvent = (doc.defaultView || window).event
    const removeKeyupListener = listen(doc as any, "keyup", e => {
      if (e === currentEvent) {
        currentEvent = undefined
        return
      }
      handleKeyUp(e)
    })
    return () => {
      removeKeyupListener()
    }
  }, [ref, disabled, handleKeyUp])
}
export function useScrollParent(element: null | Element) {
  const [parent, setParent] = useState<Element | Document | null | undefined>(
    null
  )
  useIsomorphicEffect(() => {
    if (element) {
      setParent(getScrollParent(element as any, true))
    }
  }, [element])
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
export type WaypointCallback = (
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
const findRoot = (el: Element) => getScrollParent(el as HTMLElement, true)
export function useWaypoint(
  element: Element | null,
  callback: WaypointCallback,
  options: WaypointOptions = {}
): void {
  const { rootMargin, threshold, scrollDirection = "vertical" } = options
  let { root } = options
  const handler = useEventCallback(callback)
  const prevPositionRef = useRef<Position | null>(null)
  if (root === "scrollParent") {
    root = findRoot
  }
  const scrollParent = useMemo(
    () => (element && typeof root === "function" ? root(element) : null),
    [element, root]
  )
  let realRoot = typeof root === "function" ? scrollParent : root
  if (realRoot && realRoot.nodeType === document.DOCUMENT_NODE) {
    realRoot = undefined
  }
  useIntersectionObserver(
    element,
    ([entry], observer) => {
      if (!entry) return
      const [start, end, point] =
        scrollDirection === "vertical"
          ? (["top", "bottom", "y"] as const)
          : (["left", "right", "x"] as const)
      const { [point]: coord } = entry.boundingClientRect
      const rootStart = entry.rootBounds?.[start] || 0
      const rootEnd = entry.rootBounds?.[end] || 0
      let position: Position = Position.UNKNOWN
      if (entry.isIntersecting) {
        position = Position.INSIDE
      } else if (coord > rootEnd) {
        position = Position.AFTER
      } else if (coord < rootStart) {
        position = Position.BEFORE
      }
      const previousPosition = prevPositionRef.current
      if (previousPosition === position) {
        return
      }
      handler({ position, previousPosition }, entry, observer)
      prevPositionRef.current = position
    },
    {
      threshold,
      root: realRoot,
      rootMargin: toCss(rootMargin),
    }
  )
}
