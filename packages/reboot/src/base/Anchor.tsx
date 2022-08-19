import * as React from "react"
import { useEventCallback } from "../hooks.js"
import { useButtonProps } from "../Button.jsx"
import { isTrivialHref } from "./utils.js"

export interface Props extends React.HTMLAttributes<HTMLElement> {
  href?: string
  disabled?: boolean
  role?: string
  tabIndex?: number
}

export const Anchor = React.forwardRef<HTMLAnchorElement, Props>(
  ({ onKeyDown, ...ps }, ref) => {
    const [bps] = useButtonProps({ tagName: "a", ...ps })
    const keyDown = useEventCallback((e: React.KeyboardEvent<HTMLElement>) => {
      bps.onKeyDown!(e)
      onKeyDown?.(e)
    })
    if (isTrivialHref(ps.href) || ps.role === "button") {
      return <a ref={ref} {...ps} {...bps} onKeyDown={keyDown} />
    }
    return <a ref={ref} {...ps} onKeyDown={onKeyDown} />
  }
)
Anchor.displayName = "Anchor"
