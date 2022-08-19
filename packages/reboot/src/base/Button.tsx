import * as React from "react"

export type ButtonType = "button" | "reset" | "submit"

export interface AnchorOptions {
  href?: string | undefined
  rel?: string | undefined
  target?: string | undefined
}

export interface UseButtonPropsOptions extends AnchorOptions {
  type?: ButtonType | undefined
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

export interface AriaButtonProps {
  type?: ButtonType | undefined
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

export interface UseButtonPropsMetadata {
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
}: UseButtonPropsOptions): [AriaButtonProps, UseButtonPropsMetadata] {
  if (!tagName) {
    if (href != null || target != null || rel != null) {
      tagName = "a"
    } else {
      tagName = "button"
    }
  }

  const meta: UseButtonPropsMetadata = { tagName }
  if (tagName === "button") {
    return [{ type: (type as any) || "button", disabled }, meta]
  }

  const handleClick = (event: React.MouseEvent | React.KeyboardEvent) => {
    if (disabled || (tagName === "a" && isTrivialHref(href))) {
      event.preventDefault()
    }

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
      onClick: handleClick,
      onKeyDown: handleKeyDown,
    },
    meta,
  ]
}

export interface BaseButtonProps {
  as?: keyof JSX.IntrinsicElements | undefined
  disabled?: boolean | undefined
  href?: string | undefined
  target?: string | undefined
  rel?: string | undefined
}

export interface ButtonProps
  extends BaseButtonProps,
    React.ComponentPropsWithoutRef<"button"> {}

export const Button = React.forwardRef<HTMLElement, ButtonProps>(
  ({ as: asProp, disabled, ...props }, ref) => {
    const [buttonProps, { tagName: Component }] = useButtonProps({
      tagName: asProp,
      disabled,
      ...props,
    })
    return <Component {...props} {...buttonProps} ref={ref} />
  }
)
Button.displayName = "Button"
