import classNames from "classnames"
import * as React from "react"
import { ReactNode } from "react"
import { Anchor } from "./Anchor"
import { BsPrefixProps, BsPrefixRefForwardingComponent } from "./utils"
export interface PageItemProps extends React.HTMLAttributes<HTMLElement>, BsPrefixProps {
  disabled?: boolean
  active?: boolean
  activeLabel?: string
  href?: string
}
const defaultProps = {
  active: false,
  disabled: false,
  activeLabel: "(current)",
}
export const PageItem: BsPrefixRefForwardingComponent<"li", PageItemProps> = React.forwardRef<
  HTMLLIElement,
  PageItemProps
>(({ active, disabled, className, style, activeLabel, children, ...ps }: PageItemProps, ref) => {
  const Component = active || disabled ? "span" : Anchor
  return (
    <li
      ref={ref}
      style={style}
      className={classNames(className, "page-item", { active, disabled })}
    >
      <Component className="page-link" disabled={disabled} {...ps}>
        {children}
        {active && activeLabel && <span className="visually-hidden">{activeLabel}</span>}
      </Component>
    </li>
  )
})
PageItem.defaultProps = defaultProps
PageItem.displayName = "PageItem"
function createButton(name: string, defaultValue: ReactNode, label = name) {
  function Button({ children, ...ps }: PageItemProps) {
    return (
      <PageItem {...ps}>
        <span aria-hidden="true">{children || defaultValue}</span>
        <span className="visually-hidden">{label}</span>
      </PageItem>
    )
  }
  Button.displayName = name
  return Button
}
export const First = createButton("First", "«")
export const Prev = createButton("Prev", "‹", "Previous")
export const Ellipsis = createButton("Ellipsis", "…", "More")
export const Next = createButton("Next", "›")
export const Last = createButton("Last", "»")
