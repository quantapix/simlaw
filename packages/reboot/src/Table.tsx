import classNames from "classnames"
import * as React from "react"
import { useBootstrapPrefix } from "./ThemeProvider"
import { BsPrefixOnlyProps } from "./utils"
export interface TableProps extends BsPrefixOnlyProps, React.TableHTMLAttributes<HTMLTableElement> {
  striped?: boolean
  bordered?: boolean
  borderless?: boolean
  hover?: boolean
  size?: string
  variant?: string
  responsive?: boolean | string
}
export const Table = React.forwardRef<HTMLTableElement, TableProps>(
  (
    {
      bsPrefix,
      className,
      striped,
      bordered,
      borderless,
      hover,
      size,
      variant,
      responsive,
      ...ps
    },
    ref
  ) => {
    const decoratedBsPrefix = useBootstrapPrefix(bsPrefix, "table")
    const classes = classNames(
      className,
      decoratedBsPrefix,
      variant && `${decoratedBsPrefix}-${variant}`,
      size && `${decoratedBsPrefix}-${size}`,
      striped && `${decoratedBsPrefix}-striped`,
      bordered && `${decoratedBsPrefix}-bordered`,
      borderless && `${decoratedBsPrefix}-borderless`,
      hover && `${decoratedBsPrefix}-hover`
    )
    const table = <table {...ps} className={classes} ref={ref} />
    if (responsive) {
      let responsiveClass = `${decoratedBsPrefix}-responsive`
      if (typeof responsive === "string") {
        responsiveClass = `${responsiveClass}-${responsive}`
      }
      return <div className={responsiveClass}>{table}</div>
    }
    return table
  }
)
