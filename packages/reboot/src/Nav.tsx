import * as qr from "react"
import * as qh from "./hooks.js"
import { Anchor } from "./base/Anchor.jsx"
import {
  Nav as Base,
  Props as _Props,
  useNavItem,
  ItemProps as IPs,
} from "./base/Nav.jsx"
import { EventKey, makeEventKey } from "./base/types.js"
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

export const Context = qr.createContext<Data | null>(null)
Context.displayName = "NavContext"

export const Item = withBs("nav-item")

export interface LinkProps extends BsProps, Omit<IPs, "as"> {}

export const Link: BsRef<"a", LinkProps> = qr.forwardRef<
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

export const Nav: BsRef<"div", Props> = qr.forwardRef<HTMLElement, Props>(
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
    } = qh.useUncontrolled(xs, { activeKey: "onSelect" })
    const bs = useBs(initialBsPrefix, "nav")
    let navbarBsPrefix
    let cardHeaderBsPrefix
    let isNavbar = false
    const nContext = qr.useContext(NContext)
    const cContext = qr.useContext(CContext)
    if (nContext) {
      navbarBsPrefix = nContext.bsPrefix
      isNavbar = navbar == null ? true : navbar
    } else if (cContext) {
      ;({ headerBs: cardHeaderBsPrefix } = cContext)
    }
    return (
      <Base
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
