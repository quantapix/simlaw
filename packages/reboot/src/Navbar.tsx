import { BsPrefixProps, BsPrefixRefForwardingComponent } from "./utils"
import { SelectCallback } from "./types"
import { useBootstrapPrefix } from "./ThemeProvider"
import { useCallback, useMemo } from "react"
import { useContext } from "react"
import { useUncontrolled } from "uncontrollable"
import * as React from "react"
import classNames from "classnames"
import { Collapse, CollapseProps } from "./Collapse"
import createWithBsPrefix from "./createWithBsPrefix"
import SelectableContext from "@restart/ui/SelectableContext"
import useEventCallback from "@restart/hooks/useEventCallback"
export const NavbarText = createWithBsPrefix("navbar-text", { Component: "span" })
export interface NavbarBrandProps extends BsPrefixProps, React.HTMLAttributes<HTMLElement> {
  href?: string
}
export const NavbarBrand: BsPrefixRefForwardingComponent<"a", NavbarBrandProps> = React.forwardRef<
  HTMLElement,
  NavbarBrandProps
>(({ bsPrefix, className, as, ...props }, ref) => {
  bsPrefix = useBootstrapPrefix(bsPrefix, "navbar-brand")
  const Component = as || (props.href ? "a" : "span")
  return <Component {...props} ref={ref} className={classNames(className, bsPrefix)} />
})
NavbarBrand.displayName = "NavbarBrand"
export interface NavbarCollapseProps
  extends Omit<CollapseProps, "children">,
    React.HTMLAttributes<HTMLDivElement>,
    BsPrefixProps {}
export const NavbarCollapse = React.forwardRef<HTMLDivElement, NavbarCollapseProps>(
  ({ children, bsPrefix, ...props }, ref) => {
    bsPrefix = useBootstrapPrefix(bsPrefix, "navbar-collapse")
    const context = useContext(NavbarContext)
    return (
      <Collapse in={!!(context && context.expanded)} {...props}>
        <div ref={ref} className={bsPrefix}>
          {children}
        </div>
      </Collapse>
    )
  }
)
NavbarCollapse.displayName = "NavbarCollapse"
export interface NavbarContextType {
  onToggle: () => void
  bsPrefix?: string
  expanded: boolean
}
export const NavbarContext = React.createContext<NavbarContextType | null>(null)
NavbarContext.displayName = "NavbarContext"
export interface NavbarToggleProps extends BsPrefixProps, React.HTMLAttributes<HTMLElement> {
  label?: string
}
export const NavbarToggle: BsPrefixRefForwardingComponent<"button", NavbarToggleProps> =
  React.forwardRef<HTMLElement, NavbarToggleProps>(
    ({ bsPrefix, className, children, label, as: Component = "button", onClick, ...ps }, ref) => {
      bsPrefix = useBootstrapPrefix(bsPrefix, "navbar-toggler")
      const { onToggle, expanded } = useContext(NavbarContext) || {}
      const handleClick = useEventCallback(e => {
        if (onClick) onClick(e)
        if (onToggle) onToggle()
      })
      if (Component === "button") {
        ;(ps as any).type = "button"
      }
      return (
        <Component
          {...ps}
          ref={ref}
          onClick={handleClick}
          aria-label={label}
          className={classNames(className, bsPrefix, !expanded && "collapsed")}
        >
          {children || <span className={`${bsPrefix}-icon`} />}
        </Component>
      )
    }
  )
NavbarToggle.displayName = "NavbarToggle"
NavbarToggle.defaultProps = { label: "Toggle navigation" }
export interface NavbarProps
  extends BsPrefixProps,
    Omit<React.HTMLAttributes<HTMLElement>, "onSelect"> {
  variant?: "light" | "dark"
  expand?: boolean | "sm" | "md" | "lg" | "xl" | "xxl"
  bg?: string
  fixed?: "top" | "bottom"
  sticky?: "top"
  onToggle?: (expanded: boolean) => void
  onSelect?: SelectCallback
  collapseOnSelect?: boolean
  expanded?: boolean
}
export const Navbar: BsPrefixRefForwardingComponent<"nav", NavbarProps> = React.forwardRef<
  HTMLElement,
  NavbarProps
>((ps, ref) => {
  const {
    bsPrefix: initialBsPrefix,
    expand,
    variant,
    bg,
    fixed,
    sticky,
    className,
    as: Component = "nav",
    expanded,
    onToggle,
    onSelect,
    collapseOnSelect,
    ...controlledProps
  } = useUncontrolled(ps, {
    expanded: "onToggle",
  })
  const bsPrefix = useBootstrapPrefix(initialBsPrefix, "navbar")
  const handleCollapse = useCallback<SelectCallback>(
    (...args) => {
      onSelect?.(...args)
      if (collapseOnSelect && expanded) {
        onToggle?.(false)
      }
    },
    [onSelect, collapseOnSelect, expanded, onToggle]
  )
  if (controlledProps.role === undefined && Component !== "nav") {
    controlledProps.role = "navigation"
  }
  let expandClass = `${bsPrefix}-expand`
  if (typeof expand === "string") expandClass = `${expandClass}-${expand}`
  const navbarContext = useMemo<NavbarContextType>(
    () => ({
      onToggle: () => onToggle?.(!expanded),
      bsPrefix,
      expanded: !!expanded,
    }),
    [bsPrefix, expanded, onToggle]
  )
  return (
    <NavbarContext.Provider value={navbarContext}>
      <SelectableContext.Provider value={handleCollapse}>
        <Component
          ref={ref}
          {...controlledProps}
          className={classNames(
            className,
            bsPrefix,
            expand && expandClass,
            variant && `${bsPrefix}-${variant}`,
            bg && `bg-${bg}`,
            sticky && `sticky-${sticky}`,
            fixed && `fixed-${fixed}`
          )}
        />
      </SelectableContext.Provider>
    </NavbarContext.Provider>
  )
})
Navbar.defaultProps = {
  expand: true,
  variant: "light" as const,
  collapseOnSelect: false,
}
Navbar.displayName = "Navbar"
Object.assign(Navbar, {
  Brand: NavbarBrand,
  Toggle: NavbarToggle,
  Collapse: NavbarCollapse,
  Text: NavbarText,
})
