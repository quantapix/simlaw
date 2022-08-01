import { BsPrefixProps, BsPrefixRefForwardingComponent } from "./utils"
import { EventKey } from "./types"
import { useBootstrapPrefix } from "./ThemeProvider"
import { useCallback } from "react"
import { useUncontrolled } from "uncontrollable"
import { Variant } from "./types"
import * as React from "react"
import BaseNav, { NavProps as BaseNavProps } from "./Nav"
import BaseNavItem, { NavItemProps as BaseNavItemProps } from "./Nav"
import classNames from "classnames"
import warning from "warning"

export interface ListGroupItemProps extends Omit<BaseNavItemProps, "onSelect">, BsPrefixProps {
  action?: boolean
  onClick?: React.MouseEventHandler
  variant?: Variant
}
const defaultProps = {
  variant: undefined,
  active: false,
  disabled: false,
}
export const ListGroupItem: BsPrefixRefForwardingComponent<"a", ListGroupItemProps> =
  React.forwardRef<HTMLElement, ListGroupItemProps>(
    ({ bsPrefix, active, disabled, className, variant, action, as, onClick, ...ps }, ref) => {
      bsPrefix = useBootstrapPrefix(bsPrefix, "list-group-item")
      const handleClick = useCallback(
        event => {
          if (disabled) {
            event.preventDefault()
            event.stopPropagation()
            return
          }
          onClick?.(event)
        },
        [disabled, onClick]
      )
      if (disabled && ps.tabIndex === undefined) {
        ps.tabIndex = -1
        ps["aria-disabled"] = true
      }
      return (
        <BaseNavItem
          ref={ref}
          {...ps}
          as={as || (action ? (ps.href ? "a" : "button") : "div")}
          onClick={handleClick}
          className={classNames(
            className,
            bsPrefix,
            active && "active",
            disabled && "disabled",
            variant && `${bsPrefix}-${variant}`,
            action && `${bsPrefix}-action`
          )}
        />
      )
    }
  )
ListGroupItem.defaultProps = defaultProps
ListGroupItem.displayName = "ListGroupItem"
export interface ListGroupProps extends BsPrefixProps, BaseNavProps {
  variant?: "flush"
  horizontal?: boolean | "sm" | "md" | "lg" | "xl" | "xxl"
  defaultActiveKey?: EventKey
}
export const ListGroup: BsPrefixRefForwardingComponent<"div", ListGroupProps> = React.forwardRef<
  HTMLElement,
  ListGroupProps
>((ps, ref) => {
  const {
    className,
    bsPrefix: initialBsPrefix,
    variant,
    horizontal,
    as = "div",
    ...controlledProps
  } = useUncontrolled(ps, { activeKey: "onSelect" })
  const bsPrefix = useBootstrapPrefix(initialBsPrefix, "list-group")
  let horizontalVariant: string | undefined
  if (horizontal) {
    horizontalVariant = horizontal === true ? "horizontal" : `horizontal-${horizontal}`
  }
  warning(
    !(horizontal && variant === "flush"),
    '`variant="flush"` and `horizontal` should not be used together.'
  )
  return (
    <BaseNav
      ref={ref}
      {...controlledProps}
      as={as}
      className={classNames(
        className,
        bsPrefix,
        variant && `${bsPrefix}-${variant}`,
        horizontalVariant && `${bsPrefix}-${horizontalVariant}`
      )}
    />
  )
})
ListGroup.displayName = "ListGroup"
Object.assign(ListGroup, {
  Item: ListGroupItem,
})
