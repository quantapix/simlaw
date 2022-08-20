import { useCallbackRef } from "../hooks.js"
import * as React from "react"
import { useWaypoint, WaypointOptions, WaypointEvent, Position } from "./use.js"

export { Position }
export type { WaypointEvent }

const defaultRenderComponent = (ref: React.RefCallback<any>) => (
  <span ref={ref} style={{ fontSize: 0 }} />
)

export interface WaypointProps extends WaypointOptions {
  renderComponent?: (ref: React.RefCallback<any>) => React.ReactElement
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
  const [element, setElement] = useCallbackRef<Element>()
  useWaypoint(element, onPositionChange, options)
  return renderComponent(setElement)
}
