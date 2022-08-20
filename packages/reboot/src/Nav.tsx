import * as React from "react"
import { useContext } from "react"
import { useUncontrolled } from "./hooks.js"
import BaseNav, { Props as _Props } from "./base/Nav.jsx"
import { Anchor } from "./base/Anchor.jsx"
import { useNavItem, NavItemProps as IPs } from "./base/NavItem.jsx"
import { makeEventKey } from "./base/SelectableContext.jsx"
import type { EventKey } from "./base/types.jsx"
import { useBs } from "./Theme.jsx"
import { Context as NContext } from "./Navbar.jsx"
import { Context as CContext } from "./Card.jsx"
import { classNames, BsProps, BsRef } from "./helpers.js"
import { withBs } from "./utils.jsx"

interface Data {
  role?: string
  activeKey: EventKey | null
  getControlledId: (key: EventKey | null) => string
  getControllerId: (key: EventKey | null) => string
}

export const Context = React.createContext<Data | null>(null)
Context.displayName = "NavContext"

export const Item = withBs("nav-item")

export interface LinkProps extends BsProps, Omit<IPs, "as"> {}

export const Link: BsRef<"a", LinkProps> = React.forwardRef<
  HTMLElement,
  LinkProps
>(({ bsPrefix, className, as: X = Anchor, active, eventKey, ...ps }, ref) => {
  const bs = useBs(bsPrefix, "nav-link")
  const [navItemProps, meta] = useNavItem({
    key: makeEventKey(eventKey, ps.href),
    active,
    ...ps,
  })
  return (
    <X
      {...ps}
      {...navItemProps}
      ref={ref}
      className={classNames(
        className,
        bs,
        ps.disabled && "disabled",
        meta.isActive && "active"
      )}
    />
  )
})
Link.displayName = "NavLink"
Link.defaultProps = {
  disabled: false,
}

export interface Props extends BsProps, _Props {
  navbarBsPrefix?: string
  cardHeaderBsPrefix?: string
  variant?: "tabs" | "pills" | string
  defaultActiveKey?: EventKey
  fill?: boolean
  justify?: boolean
  navbar?: boolean
  navbarScroll?: boolean
}

export const Nav: BsRef<"div", Props> = React.forwardRef<HTMLElement, Props>(
  (xs, ref) => {
    const {
      as = "div",
      bsPrefix: initialBsPrefix,
      variant,
      fill,
      justify,
      navbar,
      navbarScroll,
      className,
      activeKey,
      ...ps
    } = useUncontrolled(xs, { activeKey: "onSelect" })
    const bs = useBs(initialBsPrefix, "nav")
    let navbarBsPrefix
    let cardHeaderBsPrefix
    let isNavbar = false
    const nContext = useContext(NContext)
    const cContext = useContext(CContext)
    if (nContext) {
      navbarBsPrefix = nContext.bsPrefix
      isNavbar = navbar == null ? true : navbar
    } else if (cContext) {
      ;({ headerBs: cardHeaderBsPrefix } = cContext)
    }
    return (
      <BaseNav
        as={as}
        ref={ref}
        activeKey={activeKey}
        className={classNames(className, {
          [bs]: !isNavbar,
          [`${navbarBsPrefix}-nav`]: isNavbar,
          [`${navbarBsPrefix}-nav-scroll`]: isNavbar && navbarScroll,
          [`${cardHeaderBsPrefix}-${variant}`]: !!cardHeaderBsPrefix,
          [`${bs}-${variant}`]: !!variant,
          [`${bs}-fill`]: fill,
          [`${bs}-justified`]: justify,
        })}
        {...ps}
      />
    )
  }
)
Nav.displayName = "Nav"
Nav.defaultProps = {
  justify: false,
  fill: false,
}
