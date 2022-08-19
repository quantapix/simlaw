/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as React from "react"
import useEventCallback from "../hooks/useEventCallback.js"
import { useButtonProps } from "../Button.jsx"

export function isTrivialHref(href?: string) {
  return !href || href.trim() === "#"
}

export interface Props extends React.HTMLAttributes<HTMLElement> {
  href?: string
  disabled?: boolean
  role?: string
  tabIndex?: number
}

export const Anchor = React.forwardRef<HTMLAnchorElement, Props>(
  ({ onKeyDown, ...ps }, ref) => {
    const [buttonProps] = useButtonProps({ tagName: "a", ...ps })
    const keyDown = useEventCallback((e: React.KeyboardEvent<HTMLElement>) => {
      buttonProps.onKeyDown!(e)
      onKeyDown?.(e)
    })
    if (isTrivialHref(ps.href) || ps.role === "button") {
      return <a ref={ref} {...ps} {...buttonProps} onKeyDown={keyDown} />
    }
    return <a ref={ref} {...ps} onKeyDown={onKeyDown} />
  }
)
Anchor.displayName = "Anchor"
