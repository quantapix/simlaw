import { Anchor } from "./base/Anchor.jsx"
import { Context as CContext } from "./Card.jsx"
import { Context as NContext } from "./Navbar.jsx"
import { useBs } from "./Theme.jsx"
import { withBs } from "./utils.jsx"
import * as qh from "./hooks.js"
import * as qr from "react"
import * as qt from "./types.jsx"
import {
  Nav as Base,
  Props as BaseProps,
  useNavItem,
  ItemProps as IPs,
} from "./base/Nav.jsx"

interface Data {
  role?: string
  activeKey: qt.EventKey | null
  getControlledId: (key: qt.EventKey | null) => string
  getControllerId: (key: qt.EventKey | null) => string
}

export const Context = qr.createContext<Data | null>(null)
Context.displayName = "NavContext"

export const Item = withBs("nav-item")

export interface LinkProps extends qt.BsProps, Omit<IPs, "as"> {}

export const Link: qt.BsRef<"a", LinkProps> = qr.forwardRef<
  HTMLElement,
  LinkProps
>(({ bsPrefix, className, as: X = Anchor, active, eventKey, ...ps }, ref) => {
  const bs = useBs(bsPrefix, "nav-link")
  const [navItemProps, meta] = useNavItem({
    key: qt.makeEventKey(eventKey, ps.href),
    active,
    ...ps,
  })
  return (
    <X
      {...ps}
      {...navItemProps}
      ref={ref}
      className={qt.classNames(
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

export interface Props extends qt.BsProps, BaseProps {
  navbarBsPrefix?: string
  cardHeaderBsPrefix?: string
  variant?: "tabs" | "pills" | string
  defaultActiveKey?: qt.EventKey
  fill?: boolean
  justify?: boolean
  navbar?: boolean
  navbarScroll?: boolean
}

export const Nav: qt.BsRef<"div", Props> = qr.forwardRef<HTMLElement, Props>(
  (xs: Props, ref) => {
    const {
      activeKey,
      as = "div",
      bsPrefix,
      className,
      fill,
      justify,
      navbar,
      navbarScroll,
      variant,
      ...ps
    } = qh.useUncontrolled(xs, { activeKey: "onSelect" })
    const bs = useBs(bsPrefix, "nav")
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
        className={qt.classNames(className, {
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
