import { isTrivialHref } from "./utils.js"
import { useButtonProps } from "./Button.js"
import * as qh from "../hooks.js"
import * as qr from "react"

export interface Props extends qr.HTMLAttributes<HTMLElement> {
  href?: string
  disabled?: boolean | undefined
  role?: string | undefined
  tabIndex?: number | undefined
}

export const Anchor = qr.forwardRef<HTMLAnchorElement, Props>(
  ({ onKeyDown, ...ps }, ref) => {
    const [bps] = useButtonProps({ tagName: "a", ...ps })
    const doKeyDown = qh.useEventCB((e: qr.KeyboardEvent<HTMLElement>) => {
      bps.onKeyDown!(e)
      onKeyDown?.(e)
    })
    if (isTrivialHref(ps.href) || ps.role === "button") {
      return <a ref={ref} {...ps} {...bps} onKeyDown={doKeyDown} />
    }
    return <a ref={ref} {...ps} onKeyDown={onKeyDown} />
  }
)
Anchor.displayName = "Anchor"
