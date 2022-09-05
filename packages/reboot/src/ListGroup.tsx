import { useBs } from "./Theme.js"
import { warning } from "./base/utils.js"
import * as qh from "./hooks.js"
import * as qr from "react"
import * as qt from "./types.js"
import {
  Nav as Base,
  Props as BaseProps,
  useNavItem,
  ItemProps as IPs,
} from "./base/Nav.js"

export interface ItemProps extends Omit<IPs, "onSelect">, qt.BsProps {
  action?: boolean
  onClick?: qr.MouseEventHandler
  variant?: qt.Variant
}

export const Item: qt.BsRef<"a", ItemProps> = qr.forwardRef<
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
      key: qt.makeEventKey(eventKey, ps.href),
      active,
      ...ps,
    })
    const doClick = qh.useEventCB(e => {
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
    const X = as || (action ? (ps.href ? "a" : "button") : "div")
    return (
      <X
        ref={ref}
        {...ps}
        {...navItemProps}
        onClick={doClick}
        className={qt.classNames(
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

export interface Props extends qt.BsProps, BaseProps {
  variant?: "flush" | string
  horizontal?: boolean | string | "sm" | "md" | "lg" | "xl" | "xxl"
  defaultActiveKey?: qt.EventKey
  numbered?: boolean
}

export const ListGroup: qt.BsRef<"div", Props> = qr.forwardRef<
  HTMLElement,
  Props
>((xs: Props, ref) => {
  const {
    as = "div",
    bsPrefix,
    className,
    horizontal,
    numbered,
    variant,
    ...ps
  } = qh.useUncontrolled(xs, { activeKey: "onSelect" })
  const bs = useBs(bsPrefix, "list-group")
  let h: string | undefined
  if (horizontal) {
    h = horizontal === true ? "horizontal" : `horizontal-${horizontal}`
  }
  warning(
    !(horizontal && variant === "flush"),
    '`variant="flush"` and `horizontal` should not be used together.'
  )
  return (
    <Base
      ref={ref}
      {...ps}
      as={as}
      className={qt.classNames(
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
