import { useWaitForDOMRef, DOMContainer } from "./use.js"
import ReactDOM from "react-dom"
import type * as qr from "react"

export interface Props {
  children: qr.ReactElement
  container: DOMContainer
  onRendered?: (x: any) => void
}

export const Portal = ({ container, children, onRendered }: Props) => {
  const resolvedContainer = useWaitForDOMRef(container, onRendered)
  return resolvedContainer ? (
    <>{ReactDOM.createPortal(children, resolvedContainer)}</>
  ) : null
}
Portal.displayName = "Portal"
