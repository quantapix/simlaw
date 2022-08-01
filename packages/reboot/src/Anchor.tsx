import * as React from "react"
import { useEventCallback } from "./use/hooks"
import { useButtonProps } from "./Button"
export function isTrivialHref(href?: string) {
  return !href || href.trim() === "#"
}
export interface AnchorProps extends React.HTMLAttributes<HTMLElement> {
  href?: string
  disabled?: boolean
  role?: string
  tabIndex?: number
}
export const Anchor = React.forwardRef<HTMLAnchorElement, AnchorProps>(
  ({ onKeyDown, ...ps }, ref) => {
    const [buttonProps] = useButtonProps({ tagName: "a", ...ps })
    const handleKeyDown = useEventCallback((e: React.KeyboardEvent<HTMLElement>) => {
      buttonProps.onKeyDown!(e)
      onKeyDown?.(e)
    })
    if ((isTrivialHref(ps.href) && !ps.role) || ps.role === "button") {
      return <a ref={ref} {...ps} {...buttonProps} onKeyDown={handleKeyDown} />
    }
    return <a ref={ref} {...ps} onKeyDown={onKeyDown} />
  }
)
Anchor.displayName = "Anchor"
