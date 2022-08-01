import { BsPrefixProps } from "./utils"
import { useBootstrapPrefix } from "./ThemeProvider"
import * as React from "react"
import classNames from "classnames"
import PageItem, { Ellipsis, First, Last, Next, Prev } from "./PageItem"
type PaginationSize = "sm" | "lg"
export interface PaginationProps extends BsPrefixProps, React.HTMLAttributes<HTMLUListElement> {
  size?: "sm" | "lg"
}
export const Pagination = React.forwardRef<HTMLUListElement, PaginationProps>(
  ({ bsPrefix, className, size, ...props }, ref) => {
    const decoratedBsPrefix = useBootstrapPrefix(bsPrefix, "pagination")
    return (
      <ul
        ref={ref}
        {...props}
        className={classNames(className, decoratedBsPrefix, size && `${decoratedBsPrefix}-${size}`)}
      />
    )
  }
)
Pagination.displayName = "Pagination"
Object.assign(Pagination, { First, Prev, Ellipsis, Item: PageItem, Next, Last })
