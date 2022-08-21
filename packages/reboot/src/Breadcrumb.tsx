import { Anchor } from "./base/Anchor.jsx"
import { classNames, BsProps, BsRef } from "./helpers.js"
import { useBs } from "./Theme.jsx"
import * as qr from "react"

export interface ItemProps
  extends BsProps,
    Omit<qr.HTMLAttributes<HTMLElement>, "title"> {
  active?: boolean
  href?: string
  linkAs?: qr.ElementType
  target?: string
  title?: qr.ReactNode
  linkProps?: Record<string, any>
}

export const Item: BsRef<"li", ItemProps> = qr.forwardRef<
  HTMLElement,
  ItemProps
>(
  (
    {
      bsPrefix,
      active,
      children,
      className,
      as: X = "li",
      linkAs: Y = Anchor,
      linkProps,
      href,
      title,
      target,
      ...ps
    },
    ref
  ) => {
    const bs = useBs(bsPrefix, "breadcrumb-item")
    return (
      <X
        ref={ref}
        {...ps}
        className={classNames(bs, className, { active })}
        aria-current={active ? "page" : undefined}
      >
        {active ? (
          children
        ) : (
          <Y {...linkProps} href={href} title={title} target={target}>
            {children}
          </Y>
        )}
      </X>
    )
  }
)
Item.displayName = "BreadcrumbItem"
Item.defaultProps = {
  active: false,
  linkProps: {},
}

export interface Props extends BsProps, qr.HTMLAttributes<HTMLElement> {
  label?: string
  listProps?: qr.OlHTMLAttributes<HTMLOListElement>
}

export const Breadcrumb: BsRef<"nav", Props> = qr.forwardRef<
  HTMLElement,
  Props
>(
  (
    { bsPrefix, className, listProps, children, label, as: X = "nav", ...ps },
    ref
  ) => {
    const bs = useBs(bsPrefix, "breadcrumb")
    return (
      <X aria-label={label} className={className} ref={ref} {...ps}>
        <ol {...listProps} className={classNames(bs, listProps?.className)}>
          {children}
        </ol>
      </X>
    )
  }
)
Breadcrumb.displayName = "Breadcrumb"
Breadcrumb.defaultProps = {
  label: "breadcrumb",
  listProps: {},
}
