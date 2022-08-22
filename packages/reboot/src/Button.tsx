import { classNames, BsProps, BsRef } from "./helpers.js"
import { Props as BaseProps, useButtonProps } from "./base/Button.jsx"
import { useBs } from "./Theme.jsx"
import * as qr from "react"
import type { ButtonVariant } from "./types.jsx"

export interface Props extends BaseProps, Omit<BsProps, "as"> {
  active?: boolean | undefined
  variant?: ButtonVariant | undefined
  size?: "sm" | "lg" | undefined
}

export const Button: BsRef<"button", Props> = qr.forwardRef<
  HTMLButtonElement,
  Props
>(({ as, bsPrefix, variant, size, active, className, ...ps }, ref) => {
  const bs = useBs(bsPrefix, "btn")
  const [bps, { tagName }] = useButtonProps({ tagName: as, ...ps })
  const X = tagName as qr.ElementType
  return (
    <X
      {...bps}
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

export interface CloseProps extends qr.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant | undefined
}

export const Close = qr.forwardRef<HTMLButtonElement, CloseProps>(
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

export interface GroupProps extends BsProps, qr.HTMLAttributes<HTMLElement> {
  size?: "sm" | "lg"
  vertical?: boolean
}

export const Group: BsRef<"div", GroupProps> = qr.forwardRef(
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

export interface ToolbarProps extends BsProps, qr.HTMLAttributes<HTMLElement> {}

export const Toolbar = qr.forwardRef<HTMLDivElement, ToolbarProps>(
  ({ bsPrefix, className, ...ps }, ref) => {
    const bs = useBs(bsPrefix, "btn-toolbar")
    return <div {...ps} ref={ref} className={classNames(className, bs)} />
  }
)
Toolbar.displayName = "ButtonToolbar"
Toolbar.defaultProps = {
  role: "toolbar",
}
