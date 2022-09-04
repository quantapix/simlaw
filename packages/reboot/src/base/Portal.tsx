import * as qu from "./use.js"
import ReactDOM from "react-dom"
import type * as qr from "react"

export interface Props {
  children?: qr.ReactElement
  container?: qu.DOMContainer
  onRendered?: (x: any) => void
}

export const Portal = ({ container, children, onRendered }: Props) => {
  const y = qu.useWaitForDOMRef(container, onRendered)
  return y ? <>{ReactDOM.createPortal(children, y)}</> : null
}
Portal.displayName = "Portal"
