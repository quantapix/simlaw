import { Collapse as C, Props as CPs } from "./Collapse.js"
import { useBs } from "./Theme.js"
import { withBs } from "./utils.js"
import * as qh from "./hooks.js"
import * as qr from "react"
import * as qt from "./types.js"

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

export interface BrandProps extends qt.BsProps, qr.HTMLAttributes<HTMLElement> {
  href?: string
}

export const Brand: qt.BsRef<"a", BrandProps> = qr.forwardRef<
  HTMLElement,
  BrandProps
>(({ bsPrefix, className, as, ...ps }, ref) => {
  const bs = useBs(bsPrefix, "navbar-brand")
  const X = as || (ps.href ? "a" : "span")
  return <X {...ps} ref={ref} className={qt.classNames(className, bs)} />
})
Brand.displayName = "NavbarBrand"

export interface CollapseProps
  extends Omit<CPs, "children">,
    qr.HTMLAttributes<HTMLDivElement>,
    qt.BsProps {}

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

export interface ToggleProps
  extends qt.BsProps,
    qr.HTMLAttributes<HTMLElement> {
  label?: string
}

export const Toggle: qt.BsRef<"button", ToggleProps> = qr.forwardRef<
  HTMLElement,
  ToggleProps
>(
  (
    { bsPrefix, className, children, label, as: X = "button", onClick, ...ps },
    ref
  ) => {
    const bs = useBs(bsPrefix, "navbar-toggler")
    const { onToggle, expanded } = qr.useContext(Context) || {}
    const doClick = qh.useEventCB(e => {
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
        onClick={doClick}
        aria-label={label}
        className={qt.classNames(className, bs, !expanded && "collapsed")}
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
  extends qt.BsProps,
    Omit<qr.HTMLAttributes<HTMLElement>, "onSelect"> {
  variant?: "light" | "dark" | string
  expand?: boolean | string | "sm" | "md" | "lg" | "xl" | "xxl"
  bg?: string
  fixed?: "top" | "bottom"
  sticky?: "top"
  onToggle?: (expanded: boolean) => void
  onSelect?: qt.SelectCB
  collapseOnSelect?: boolean
  expanded?: boolean
}

export const Navbar: qt.BsRef<"nav", Props> = qr.forwardRef<HTMLElement, Props>(
  (xs: Props, ref) => {
    const {
      as: X = "nav",
      bg,
      bsPrefix,
      className,
      collapseOnSelect,
      expand,
      expanded,
      fixed,
      onSelect,
      onToggle,
      sticky,
      variant,
      ...ps
    } = qh.useUncontrolled(xs, { expanded: "onToggle" })
    const bs = useBs(bsPrefix, "navbar")
    const collapse = qr.useCallback<qt.SelectCB>(
      (...xs2) => {
        onSelect?.(...xs2)
        if (collapseOnSelect && expanded) {
          onToggle?.(false)
        }
      },
      [onSelect, collapseOnSelect, expanded, onToggle]
    )
    if (ps.role === undefined && X !== "nav") {
      ps.role = "navigation"
    }
    let expandClass = `${bs}-expand`
    if (typeof expand === "string") expandClass = `${expandClass}-${expand}`
    const v = qr.useMemo<Data>(
      () => ({
        onToggle: () => onToggle?.(!expanded),
        bsPrefix: bs,
        expanded: !!expanded,
        expand,
      }),
      [bs, expanded, expand, onToggle]
    )
    return (
      <Context.Provider value={v}>
        <qt.Selectable.Provider value={collapse}>
          <X
            ref={ref}
            {...ps}
            className={qt.classNames(
              className,
              bs,
              expand && expandClass,
              variant && `${bs}-${variant}`,
              bg && `bg-${bg}`,
              sticky && `sticky-${sticky}`,
              fixed && `fixed-${fixed}`
            )}
          />
        </qt.Selectable.Provider>
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
