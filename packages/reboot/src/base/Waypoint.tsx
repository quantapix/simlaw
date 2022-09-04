import * as qh from "../hooks.js"
import * as qr from "react"
import * as qu from "./utils.js"

export interface Event {
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
  details: Event,
  entry: IntersectionObserverEntry,
  observer: IntersectionObserver
) => void

export type RootElement = Element | Document | null | undefined

export interface UseOpts
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
  cb: WaypointCB,
  opts: UseOpts = {}
): void {
  const { rootMargin, threshold, scrollDirection = "vertical" } = opts
  let { root: r } = opts
  const prevRef = qr.useRef<Position | null>(null)
  if (r === "scrollParent") r = findRoot
  const scrollParent = qr.useMemo(
    () => (e && typeof r === "function" ? r(e) : null),
    [e, r]
  )
  let root = typeof r === "function" ? scrollParent : r
  if (root && root.nodeType === document.DOCUMENT_NODE) {
    root = undefined
  }
  const cb2 = qh.useEventCB(cb)
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
      cb2({ position: pos, previousPosition: prev }, x, observer)
      prevRef.current = pos
    },
    {
      threshold: threshold!,
      root: root!,
      rootMargin: toCss(rootMargin)!,
    }
  )
}
const defaultRenderComponent = (ref: qr.RefCallback<any>) => (
  <span ref={ref} style={{ fontSize: 0 }} />
)

export interface Props extends UseOpts {
  renderComponent?: (ref: qr.RefCallback<any>) => qr.ReactElement
  onPositionChange: (details: Event, entry: IntersectionObserverEntry) => void
}

export function Waypoint({
  renderComponent = defaultRenderComponent,
  onPositionChange,
  ...options
}: Props) {
  const [element, setElement] = qh.useCallbackRef<Element>()
  useWaypoint(element, onPositionChange, options)
  return renderComponent(setElement)
}
