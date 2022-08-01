import { BsPrefixProps, BsPrefixRefForwardingComponent } from "./utils"
import { useBootstrapPrefix } from "./ThemeProvider"
import { Anchor } from "./Anchor"
import * as React from "react"
import classNames from "classnames"
export interface BreadcrumbItemProps
  extends BsPrefixProps,
    Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  active?: boolean
  href?: string
  linkAs?: React.ElementType
  target?: string
  title?: React.ReactNode
  linkProps?: Record<string, any>
}
export const BreadcrumbItem: BsPrefixRefForwardingComponent<"li", BreadcrumbItemProps> =
  React.forwardRef<HTMLElement, BreadcrumbItemProps>(
    (
      {
        bsPrefix,
        active,
        children,
        className,
        as: Component = "li",
        linkAs: LinkComponent = Anchor,
        linkProps,
        href,
        title,
        target,
        ...ps
      },
      ref
    ) => {
      const prefix = useBootstrapPrefix(bsPrefix, "breadcrumb-item")
      return (
        <Component
          ref={ref}
          {...ps}
          className={classNames(prefix, className, { active })}
          aria-current={active ? "page" : undefined}
        >
          {active ? (
            children
          ) : (
            <LinkComponent {...linkProps} href={href} title={title} target={target}>
              {children}
            </LinkComponent>
          )}
        </Component>
      )
    }
  )
BreadcrumbItem.displayName = "BreadcrumbItem"
BreadcrumbItem.defaultProps = {
  active: false,
  linkProps: {},
}
export interface BreadcrumbProps extends BsPrefixProps, React.HTMLAttributes<HTMLElement> {
  label?: string
  listProps?: React.OlHTMLAttributes<HTMLOListElement>
}
export const Breadcrumb: BsPrefixRefForwardingComponent<"nav", BreadcrumbProps> = React.forwardRef<
  HTMLElement,
  BreadcrumbProps
>(({ bsPrefix, className, listProps, children, label, as: Component = "nav", ...props }, ref) => {
  const prefix = useBootstrapPrefix(bsPrefix, "breadcrumb")
  return (
    <Component aria-label={label} className={className} ref={ref} {...props}>
      <ol {...listProps} className={classNames(prefix, listProps?.className)}>
        {children}
      </ol>
    </Component>
  )
})
Breadcrumb.displayName = "Breadcrumb"
Breadcrumb.defaultProps = {
  label: "breadcrumb",
  listProps: {},
}
Object.assign(Breadcrumb, { Item: BreadcrumbItem })
