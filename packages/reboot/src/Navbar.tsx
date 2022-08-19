import * as React from "react"
import { useCallback, useContext, useMemo } from "react"
import { SelectableContext } from "./base/SelectableContext.jsx"
import type { SelectCallback } from "./base/types.jsx"
import { useUncontrolled } from "./use.jsx"
import { useEventCallback } from "./hooks.js"
import { withBs } from "./utils.jsx"
import { Collapse as C, Props as CPs } from "./Collapse.jsx"
import { useBs } from "./Theme.jsx"
import { classNames, BsProps, BsRef } from "./helpers.js"

export interface Data {
  onToggle: () => void
  bsPrefix?: string
  expanded: boolean
  expand?: boolean | string | "sm" | "md" | "lg" | "xl" | "xxl"
}

export const Context = React.createContext<Data | null>(null)
Context.displayName = "NavbarContext"

export const Text = withBs("navbar-text", {
  Component: "span",
})

export interface BrandProps extends BsProps, React.HTMLAttributes<HTMLElement> {
  href?: string
}

export const Brand: BsRef<"a", BrandProps> = React.forwardRef<
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
    React.HTMLAttributes<HTMLDivElement>,
    BsProps {}

export const Collapse = React.forwardRef<HTMLDivElement, CollapseProps>(
  ({ children, bsPrefix, ...ps }, ref) => {
    const bs = useBs(bsPrefix, "navbar-collapse")
    const context = useContext(Context)
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
  extends BsProps,
    React.HTMLAttributes<HTMLElement> {
  label?: string
}

export const Toggle: BsRef<"button", ToggleProps> = React.forwardRef<
  HTMLElement,
  ToggleProps
>(
  (
    { bsPrefix, className, children, label, as: X = "button", onClick, ...ps },
    ref
  ) => {
    const bs = useBs(bsPrefix, "navbar-toggler")
    const { onToggle, expanded } = useContext(Context) || {}
    const clickCB = useEventCallback(e => {
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
    Omit<React.HTMLAttributes<HTMLElement>, "onSelect"> {
  variant?: "light" | "dark" | string
  expand?: boolean | string | "sm" | "md" | "lg" | "xl" | "xxl"
  bg?: string
  fixed?: "top" | "bottom"
  sticky?: "top"
  onToggle?: (expanded: boolean) => void
  onSelect?: SelectCallback
  collapseOnSelect?: boolean
  expanded?: boolean
}

export const Navbar: BsRef<"nav", Props> = React.forwardRef<HTMLElement, Props>(
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
    } = useUncontrolled(xs, {
      expanded: "onToggle",
    })
    const bsPrefix = useBs(initialBsPrefix, "navbar")
    const collapse = useCallback<SelectCallback>(
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
    const v = useMemo<Data>(
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
        <SelectableContext.Provider value={collapse}>
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
        </SelectableContext.Provider>
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
