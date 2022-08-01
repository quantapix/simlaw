import { BsPrefixProps, BsPrefixRefForwardingComponent } from "./utils"
import { ButtonVariant } from "./types"
import { useBootstrapPrefix } from "./ThemeProvider"
import * as React from "react"
import classNames from "classnames"
export type ButtonType = "button" | "reset" | "submit"
export interface AnchorOptions {
  href?: string
  rel?: string
  target?: string
}
export interface UseButtonPropsOptions extends AnchorOptions {
  type?: ButtonType
  disabled?: boolean
  onClick?: React.EventHandler<React.MouseEvent | React.KeyboardEvent>
  tabIndex?: number
  tagName?: keyof JSX.IntrinsicElements
}
export function isTrivialHref(href?: string) {
  return !href || href.trim() === "#"
}
export interface AriaButtonProps {
  type?: ButtonType
  disabled?: boolean
  role?: "button"
  tabIndex?: number
  href?: string
  target?: string
  rel?: string
  "aria-disabled"?: true
  onClick?: (x: React.MouseEvent | React.KeyboardEvent) => void
  onKeyDown?: (x: React.KeyboardEvent) => void
}
export interface UseButtonPropsMetadata {
  tagName: React.ElementType
}
export function useButtonProps({
  tagName,
  disabled,
  href,
  target,
  rel,
  onClick,
  tabIndex = 0,
  type,
}: UseButtonPropsOptions): [AriaButtonProps, UseButtonPropsMetadata] {
  if (!tagName) {
    if (href != null || target != null || rel != null) tagName = "a"
    else tagName = "button"
  }
  const meta: UseButtonPropsMetadata = { tagName }
  if (tagName === "button") return [{ type: (type as any) || "button", disabled }, meta]
  const handleClick = (event: React.MouseEvent | React.KeyboardEvent) => {
    if (disabled || (tagName === "a" && isTrivialHref(href))) event.preventDefault()
    if (disabled) {
      event.stopPropagation()
      return
    }
    onClick?.(event)
  }
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === " ") {
      event.preventDefault()
      handleClick(event)
    }
  }
  return [
    {
      role: "button",
      disabled: undefined,
      tabIndex: disabled ? undefined : tabIndex,
      href: tagName === "a" && disabled ? undefined : href,
      target: tagName === "a" ? target : undefined,
      "aria-disabled": !disabled ? undefined : disabled,
      rel: tagName === "a" ? rel : undefined,
      onClick: handleClick,
      onKeyDown: handleKeyDown,
    },
    meta,
  ]
}
export interface BaseButtonProps {
  as?: keyof JSX.IntrinsicElements
  disabled?: boolean
  href?: string
  target?: string
  rel?: string
}
export interface ButtonProps extends BaseButtonProps, React.ComponentPropsWithoutRef<"button"> {}
export const Button = React.forwardRef<HTMLElement, ButtonProps>(
  ({ as: asProp, disabled, ...ps }, ref) => {
    const [buttonProps, { tagName: Component }] = useButtonProps({
      tagName: asProp,
      disabled,
      ...ps,
    })
    return <Component {...ps} {...buttonProps} ref={ref} />
  }
)
Button.displayName = "Button"
export interface ButtonProps2 extends BaseButtonProps, Omit<BsPrefixProps, "as"> {
  active?: boolean
  variant?: ButtonVariant
  size?: "sm" | "lg"
}
export type CommonButtonProps = "href" | "size" | "variant" | "disabled"
export const Button2: BsPrefixRefForwardingComponent<"button", ButtonProps2> = React.forwardRef<
  HTMLButtonElement,
  ButtonProps2
>(({ as, bsPrefix, variant, size, active, className, ...ps }, ref) => {
  const prefix = useBootstrapPrefix(bsPrefix, "btn")
  const [buttonProps, { tagName }] = useButtonProps({
    tagName: as,
    ...ps,
  })
  const Component = tagName as React.ElementType
  return (
    <Component
      {...ps}
      {...buttonProps}
      ref={ref}
      className={classNames(
        className,
        prefix,
        active && "active",
        variant && `${prefix}-${variant}`,
        size && `${prefix}-${size}`,
        ps.href && ps.disabled && "disabled"
      )}
    />
  )
})
Button2.displayName = "Button"
Button2.defaultProps = { variant: "primary", active: false, disabled: false }
export interface ButtonGroupProps extends BsPrefixProps, React.HTMLAttributes<HTMLElement> {
  size?: "sm" | "lg"
  vertical?: boolean
}
export const ButtonGroup: BsPrefixRefForwardingComponent<"div", ButtonGroupProps> =
  React.forwardRef(
    (
      { bsPrefix, size, vertical, className, as: Component = "div", ...ps }: ButtonGroupProps,
      ref
    ) => {
      const prefix = useBootstrapPrefix(bsPrefix, "btn-group")
      let baseClass = prefix
      if (vertical) baseClass = `${prefix}-vertical`
      return (
        <Component
          {...ps}
          ref={ref}
          className={classNames(className, baseClass, size && `${prefix}-${size}`)}
        />
      )
    }
  )
ButtonGroup.displayName = "ButtonGroup"
ButtonGroup.defaultProps = { vertical: false, role: "group" }
export interface ButtonToolbarProps extends BsPrefixProps, React.HTMLAttributes<HTMLElement> {}
export const ButtonToolbar = React.forwardRef<HTMLDivElement, ButtonToolbarProps>(
  ({ bsPrefix, className, ...ps }, ref) => {
    const prefix = useBootstrapPrefix(bsPrefix, "btn-toolbar")
    return <div {...ps} ref={ref} className={classNames(className, prefix)} />
  }
)
ButtonToolbar.displayName = "ButtonToolbar"
ButtonToolbar.defaultProps = { role: "toolbar" }
