import { useWaypoint, WaypointOptions, WaypointEvent, Position } from "./use.js"
import * as qh from "../hooks.js"
import type * as qr from "react"

export { Position }
export type { WaypointEvent }

const defaultRenderComponent = (ref: qr.RefCallback<any>) => (
  <span ref={ref} style={{ fontSize: 0 }} />
)

export interface WaypointProps extends WaypointOptions {
  renderComponent?: (ref: qr.RefCallback<any>) => qr.ReactElement
  onPositionChange: (
    details: WaypointEvent,
    entry: IntersectionObserverEntry
  ) => void
}

export function Waypoint({
  renderComponent = defaultRenderComponent,
  onPositionChange,
  ...options
}: WaypointProps) {
  const [element, setElement] = qh.useCallbackRef<Element>()
  useWaypoint(element, onPositionChange, options)
  return renderComponent(setElement)
}
