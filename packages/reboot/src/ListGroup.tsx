import * as React from "react"
import warning from "warning"
import { useUncontrolled } from "./use.jsx"
import BaseNav, { NavProps as BaseNavProps } from "@restart/ui/Nav"
import { EventKey } from "@restart/ui/types"
import { makeEventKey } from "@restart/ui/SelectableContext"
import useEventCallback from "@restart/hooks/useEventCallback"
import { useNavItem, NavItemProps as IPs } from "@restart/ui/NavItem"
import { classNames, BsProps, BsRefComp } from "./helpers.js"
import { useBs } from "./Theme.jsx"
import type { Variant } from "./types.jsx"

export interface ItemProps extends Omit<IPs, "onSelect">, BsProps {
  action?: boolean
  onClick?: React.MouseEventHandler
  variant?: Variant
}

export const Item: BsRefComp<"a", ItemProps> = React.forwardRef<
  HTMLElement,
  ItemProps
>(
  (
    {
      bsPrefix,
      active,
      disabled,
      eventKey,
      className,
      variant,
      action,
      as,
      ...ps
    },
    ref
  ) => {
    bsPrefix = useBs(bsPrefix, "list-group-item")
    const [navItemProps, meta] = useNavItem({
      key: makeEventKey(eventKey, ps.href),
      active,
      ...ps,
    })
    const click = useEventCallback(e => {
      if (disabled) {
        e.preventDefault()
        e.stopPropagation()
        return
      }
      navItemProps.onClick(e)
    })
    if (disabled && ps.tabIndex === undefined) {
      ps.tabIndex = -1
      ps["aria-disabled"] = true
    }
    // eslint-disable-next-line no-nested-ternary
    const X = as || (action ? (ps.href ? "a" : "button") : "div")
    return (
      <X
        ref={ref}
        {...ps}
        {...navItemProps}
        onClick={click}
        className={classNames(
          className,
          bsPrefix,
          meta.isActive && "active",
          disabled && "disabled",
          variant && `${bsPrefix}-${variant}`,
          action && `${bsPrefix}-action`
        )}
      />
    )
  }
)
Item.displayName = "ListGroupItem"

export interface Props extends BsProps, BaseNavProps {
  variant?: "flush" | string
  horizontal?: boolean | string | "sm" | "md" | "lg" | "xl" | "xxl"
  defaultActiveKey?: EventKey
  numbered?: boolean
}

export const ListGroup: BsRefComp<"div", Props> = React.forwardRef<
  HTMLElement,
  Props
>((xs, ref) => {
  const {
    className,
    bsPrefix: initialBsPrefix,
    variant,
    horizontal,
    numbered,
    as = "div",
    ...ps
  } = useUncontrolled(xs, {
    activeKey: "onSelect",
  })
  const bs = useBs(initialBsPrefix, "list-group")
  let h: string | undefined
  if (horizontal) {
    h = horizontal === true ? "horizontal" : `horizontal-${horizontal}`
  }
  warning(
    !(horizontal && variant === "flush"),
    '`variant="flush"` and `horizontal` should not be used together.'
  )
  return (
    <BaseNav
      ref={ref}
      {...ps}
      as={as}
      className={classNames(
        className,
        bs,
        variant && `${bs}-${variant}`,
        h && `${bs}-${h}`,
        numbered && `${bs}-numbered`
      )}
    />
  )
})
ListGroup.displayName = "ListGroup"
