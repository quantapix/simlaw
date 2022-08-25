import { Anchor } from "./base/Anchor.jsx"
import { useBs } from "./Theme.jsx"
import * as qr from "react"
import * as qt from "./types.jsx"

export interface ItemProps extends qr.HTMLAttributes<HTMLElement>, qt.BsProps {
  disabled?: boolean
  active?: boolean
  activeLabel?: string
  href?: string
}

export const Item: qt.BsRef<"li", ItemProps> = qr.forwardRef<
  HTMLLIElement,
  ItemProps
>(
  (
    {
      active,
      disabled,
      className,
      style,
      activeLabel,
      children,
      ...ps
    }: ItemProps,
    ref
  ) => {
    const X = active || disabled ? "span" : Anchor
    return (
      <li
        ref={ref}
        style={style}
        className={qt.classNames(className, "page-item", { active, disabled })}
      >
        <X className="page-link" disabled={disabled} {...ps}>
          {children}
          {active && activeLabel && (
            <span className="visually-hidden">{activeLabel}</span>
          )}
        </X>
      </li>
    )
  }
)
Item.displayName = "PageItem"
Item.defaultProps = {
  active: false,
  disabled: false,
  activeLabel: "(current)",
}

function createButton(name: string, defaultValue: qr.ReactNode, label = name) {
  const Button = qr.forwardRef(({ children, ...ps }: ItemProps, ref) => (
    <Item {...ps} ref={ref}>
      <span aria-hidden="true">{children || defaultValue}</span>
      <span className="visually-hidden">{label}</span>
    </Item>
  ))
  Button.displayName = name
  return Button
}

export const First = createButton("First", "«")
export const Prev = createButton("Prev", "‹", "Previous")
export const Ellipsis = createButton("Ellipsis", "…", "More")
export const Next = createButton("Next", "›")
export const Last = createButton("Last", "»")

export interface Props extends qt.BsProps, qr.HTMLAttributes<HTMLUListElement> {
  size?: "sm" | "lg"
}

export const Pagination = qr.forwardRef<HTMLUListElement, Props>(
  ({ bsPrefix, className, size, ...ps }, ref) => {
    const bs = useBs(bsPrefix, "pagination")
    return (
      <ul
        ref={ref}
        {...ps}
        className={qt.classNames(className, bs, size && `${bs}-${size}`)}
      />
    )
  }
)
Pagination.displayName = "Pagination"
