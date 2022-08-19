import * as React from "react"
import { useBs } from "./Theme.jsx"
import { classNames, BsProps, BsRef } from "./helpers.js"
import type { ButtonVariant } from "./types.jsx"

export type Type = "button" | "reset" | "submit"

export interface Opts {
  href?: string | undefined
  rel?: string | undefined
  target?: string | undefined
}

export interface PropsOpts extends Opts {
  type?: Type | undefined
  disabled?: boolean | undefined
  onClick?:
    | React.EventHandler<React.MouseEvent | React.KeyboardEvent>
    | undefined
  tabIndex?: number | undefined
  tagName?: keyof JSX.IntrinsicElements | undefined
  role?: React.AriaRole | undefined
}

export function isTrivialHref(href?: string) {
  return !href || href.trim() === "#"
}

export interface AriaProps {
  type?: Type | undefined
  disabled: boolean | undefined
  role?: React.AriaRole
  tabIndex?: number | undefined
  href?: string | undefined
  target?: string | undefined
  rel?: string | undefined
  "aria-disabled"?: true | undefined
  onClick?: (event: React.MouseEvent | React.KeyboardEvent) => void
  onKeyDown?: (event: React.KeyboardEvent) => void
}

export interface PropsMeta {
  tagName: React.ElementType
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
}: PropsOpts): [AriaProps, PropsMeta] {
  if (!tagName) {
    if (href != null || target != null || rel != null) {
      tagName = "a"
    } else {
      tagName = "button"
    }
  }
  const meta: PropsMeta = { tagName }
  if (tagName === "button") {
    return [{ type: (type as any) || "button", disabled }, meta]
  }
  const click = (event: React.MouseEvent | React.KeyboardEvent) => {
    if (disabled || (tagName === "a" && isTrivialHref(href))) {
      event.preventDefault()
    }
    if (disabled) {
      event.stopPropagation()
      return
    }
    onClick?.(event)
  }
  const keyDown = (event: React.KeyboardEvent) => {
    if (event.key === " ") {
      event.preventDefault()
      click(event)
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

export interface Props
  extends React.ComponentPropsWithoutRef<"button">,
    Omit<BsProps, "as"> {
  as?: keyof JSX.IntrinsicElements | undefined
  disabled?: boolean | undefined
  href?: string | undefined
  target?: string | undefined
  rel?: string | undefined
  active?: boolean | undefined
  variant?: ButtonVariant | undefined
  size?: "sm" | "lg"
}

export const Button: BsRef<"button", Props> = React.forwardRef<
  HTMLButtonElement,
  Props
>(({ as, bsPrefix, variant, size, active, className, ...ps }, ref) => {
  const bs = useBs(bsPrefix, "btn")
  const [buttonProps, { tagName }] = useButtonProps({ tagName: as, ...ps })
  const X = tagName as React.ElementType
  return (
    <X
      {...buttonProps}
      {...ps}
      ref={ref}
      className={classNames(
        className,
        bs,
        active && "active",
        variant && `${bs}-${variant}`,
        size && `${bs}-${size}`,
        ps.href && ps.disabled && "disabled"
      )}
    />
  )
})
Button.displayName = "Button"
Button.defaultProps = {
  variant: "primary",
  active: false,
  disabled: false,
}

export type Variant = "white" | string

export interface CloseProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant | undefined
}

export const Close = React.forwardRef<HTMLButtonElement, CloseProps>(
  ({ className, variant, ...ps }, ref) => (
    <button
      ref={ref}
      type="button"
      className={classNames(
        "btn-close",
        variant && `btn-close-${variant}`,
        className
      )}
      {...ps}
    />
  )
)
Close.displayName = "CloseButton"
Close.defaultProps = {
  "aria-label": "Close",
}

export interface GroupProps extends BsProps, React.HTMLAttributes<HTMLElement> {
  size?: "sm" | "lg"
  vertical?: boolean
}

export const Group: BsRef<"div", GroupProps> = React.forwardRef(
  (
    { bsPrefix, size, vertical, className, as: X = "div", ...ps }: GroupProps,
    ref
  ) => {
    const bs = useBs(bsPrefix, "btn-group")
    let base = bs
    if (vertical) base = `${bs}-vertical`
    return (
      <X
        {...ps}
        ref={ref}
        className={classNames(className, base, size && `${bs}-${size}`)}
      />
    )
  }
)
Group.displayName = "ButtonGroup"
Group.defaultProps = {
  vertical: false,
  role: "group",
}

export interface ToolbarProps
  extends BsProps,
    React.HTMLAttributes<HTMLElement> {}

export const Toolbar = React.forwardRef<HTMLDivElement, ToolbarProps>(
  ({ bsPrefix, className, ...ps }, ref) => {
    const bs = useBs(bsPrefix, "btn-toolbar")
    return <div {...ps} ref={ref} className={classNames(className, bs)} />
  }
)
Toolbar.displayName = "ButtonToolbar"
Toolbar.defaultProps = {
  role: "toolbar",
}
