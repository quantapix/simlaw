import { useEventCallback, useIntersectionObserver } from "../hooks.js"
import { useMemo, useRef } from "react"
import { getScrollParent } from "./utils.js"

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
