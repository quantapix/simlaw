import { classNames, BsProps, BsRef } from "./helpers.js"
import { Collapse as C, Props as CPs } from "./Collapse.jsx"
import { Selectable, SelectCB } from "./base/types.jsx"
import { useBs } from "./Theme.jsx"
import { withBs } from "./utils.jsx"
import * as qh from "./hooks.js"
import * as qr from "react"

export interface Data {
  onToggle: () => void
  bsPrefix?: string
  expanded: boolean
  expand?: boolean | string | "sm" | "md" | "lg" | "xl" | "xxl" | undefined
}

export const Context = qr.createContext<Data | null>(null)
Context.displayName = "NavbarContext"

export const Text = withBs("navbar-text", {
  Component: "span",
})

export interface BrandProps extends BsProps, qr.HTMLAttributes<HTMLElement> {
  href?: string
}

export const Brand: BsRef<"a", BrandProps> = qr.forwardRef<
  HTMLElement,
  BrandProps
>(({ bsPrefix, className, as, ...ps }, ref) => {
  const bs = useBs(bsPrefix, "navbar-brand")
  const X = as || (ps.href ? "a" : "span")
  return <X {...ps} ref={ref} className={classNames(className, bs)} />
})
Brand.displayName = "NavbarBrand"

export interface CollapseProps
  extends Omit<CPs, "children">,
    qr.HTMLAttributes<HTMLDivElement>,
    BsProps {}

export const Collapse = qr.forwardRef<HTMLDivElement, CollapseProps>(
  ({ children, bsPrefix, ...ps }, ref) => {
    const bs = useBs(bsPrefix, "navbar-collapse")
    const context = qr.useContext(Context)
    return (
      <C in={!!(context && context.expanded)} {...ps}>
        <div ref={ref} className={bs}>
          {children}
        </div>
      </C>
    )
  }
)
Collapse.displayName = "NavbarCollapse"

export interface ToggleProps extends BsProps, qr.HTMLAttributes<HTMLElement> {
  label?: string
}

export const Toggle: BsRef<"button", ToggleProps> = qr.forwardRef<
  HTMLElement,
  ToggleProps
>(
  (
    { bsPrefix, className, children, label, as: X = "button", onClick, ...ps },
    ref
  ) => {
    const bs = useBs(bsPrefix, "navbar-toggler")
    const { onToggle, expanded } = qr.useContext(Context) || {}
    const clickCB = qh.useEventCallback(e => {
      if (onClick) onClick(e)
      if (onToggle) onToggle()
    })
    if (X === "button") {
      ;(ps as any).type = "button"
    }
    return (
      <X
        {...ps}
        ref={ref}
        onClick={clickCB}
        aria-label={label}
        className={classNames(className, bs, !expanded && "collapsed")}
      >
        {children || <span className={`${bs}-icon`} />}
      </X>
    )
  }
)
Toggle.displayName = "NavbarToggle"
Toggle.defaultProps = {
  label: "Toggle navigation",
}

export interface Props
  extends BsProps,
    Omit<qr.HTMLAttributes<HTMLElement>, "onSelect"> {
  variant?: "light" | "dark" | string
  expand?: boolean | string | "sm" | "md" | "lg" | "xl" | "xxl"
  bg?: string
  fixed?: "top" | "bottom"
  sticky?: "top"
  onToggle?: (expanded: boolean) => void
  onSelect?: SelectCB
  collapseOnSelect?: boolean
  expanded?: boolean
}

export const Navbar: BsRef<"nav", Props> = qr.forwardRef<HTMLElement, Props>(
  (xs, ref) => {
    const {
      bsPrefix: initialBsPrefix,
      expand,
      variant,
      bg,
      fixed,
      sticky,
      className,
      as: X = "nav",
      expanded,
      onToggle,
      onSelect,
      collapseOnSelect,
      ...ps
    } = qh.useUncontrolled(xs, {
      expanded: "onToggle",
    })
    const bsPrefix = useBs(initialBsPrefix, "navbar")
    const collapse = qr.useCallback<SelectCB>(
      (...xs) => {
        onSelect?.(...xs)
        if (collapseOnSelect && expanded) {
          onToggle?.(false)
        }
      },
      [onSelect, collapseOnSelect, expanded, onToggle]
    )
    if (ps.role === undefined && X !== "nav") {
      ps.role = "navigation"
    }
    let expandClass = `${bsPrefix}-expand`
    if (typeof expand === "string") expandClass = `${expandClass}-${expand}`
    const v = qr.useMemo<Data>(
      () => ({
        onToggle: () => onToggle?.(!expanded),
        bsPrefix,
        expanded: !!expanded,
        expand,
      }),
      [bsPrefix, expanded, expand, onToggle]
    )
    return (
      <Context.Provider value={v}>
        <Selectable.Provider value={collapse}>
          <X
            ref={ref}
            {...ps}
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
        </Selectable.Provider>
      </Context.Provider>
    )
  }
)
Navbar.displayName = "Navbar"
Navbar.defaultProps = {
  expand: true,
  variant: "light" as const,
  collapseOnSelect: false,
}
