import { isTrivialHref } from "./utils.js"
import * as qr from "react"

export type Type = "button" | "reset" | "submit"

export interface AnchorOpts {
  href?: string | undefined
  rel?: string | undefined
  target?: string | undefined
}

export interface Opts extends AnchorOpts {
  type?: Type | undefined
  disabled?: boolean | undefined
  onClick?: qr.EventHandler<qr.MouseEvent | qr.KeyboardEvent> | undefined
  tabIndex?: number | undefined
  tagName?: keyof JSX.IntrinsicElements | undefined
  role?: qr.AriaRole | undefined
}

export interface AriaProps {
  type?: Type | undefined
  disabled: boolean | undefined
  role?: qr.AriaRole
  tabIndex?: number | undefined
  href?: string | undefined
  target?: string | undefined
  rel?: string | undefined
  "aria-disabled"?: true | undefined
  onClick?: (e: qr.MouseEvent | qr.KeyboardEvent) => void
  onKeyDown?: (e: qr.KeyboardEvent) => void
}

export interface Meta {
  tagName: qr.ElementType
}

export function useButtonProps({
  tagName,
  disabled,
  href,
  target,
  rel,
  role,
  onClick,
  tabIndex = 0,
  type,
}: Opts): [AriaProps, Meta] {
  if (!tagName) {
    if (href != null || target != null || rel != null) {
      tagName = "a"
    } else {
      tagName = "button"
    }
  }
  const meta: Meta = { tagName }
  if (tagName === "button") {
    return [{ type: (type as any) || "button", disabled }, meta]
  }
  const click = (e: qr.MouseEvent | qr.KeyboardEvent) => {
    if (disabled || (tagName === "a" && isTrivialHref(href))) {
      e.preventDefault()
    }
    if (disabled) {
      e.stopPropagation()
      return
    }
    onClick?.(e)
  }
  const keyDown = (e: qr.KeyboardEvent) => {
    if (e.key === " ") {
      e.preventDefault()
      click(e)
    }
  }
  if (tagName === "a") {
    href ||= "#"
    if (disabled) {
      href = undefined
    }
  }
  return [
    {
      role: role ?? "button",
      disabled: undefined,
      tabIndex: disabled ? undefined : tabIndex,
      href,
      target: tagName === "a" ? target : undefined,
      "aria-disabled": !disabled ? undefined : disabled,
      rel: tagName === "a" ? rel : undefined,
      onClick: click,
      onKeyDown: keyDown,
    },
    meta,
  ]
}

export interface BaseProps {
  as?: keyof JSX.IntrinsicElements | undefined
  disabled?: boolean | undefined
  href?: string | undefined
  target?: string | undefined
  rel?: string | undefined
}

export interface Props
  extends BaseProps,
    qr.ComponentPropsWithoutRef<"button"> {}

export const Button = qr.forwardRef<HTMLElement, Props>(
  ({ as, disabled, ...ps }, ref) => {
    const [bps, { tagName: Component }] = useButtonProps({
      tagName: as,
      disabled,
      ...ps,
    })
    return <Component {...ps} {...bps} ref={ref} />
  }
)
Button.displayName = "Button"
