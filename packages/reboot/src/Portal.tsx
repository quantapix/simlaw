import ReactDOM from "react-dom"
import * as React from "react"
import useWaitForDOMRef, { DOMContainer } from "./useWaitForDOMRef"
export interface PortalProps {
  children: React.ReactElement
  container: DOMContainer
  onRendered?: (x: any) => void
}
export const Portal = ({ container, children, onRendered }: PortalProps) => {
  const y = useWaitForDOMRef(container, onRendered)
  return y ? <>{ReactDOM.createPortal(children, y)}</> : null
}
Portal.displayName = "Portal"
