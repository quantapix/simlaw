import { BsPrefixProps, BsPrefixRefForwardingComponent } from "./utils"
import { useBootstrapPrefix } from "./ThemeProvider"
import * as React from "react"
import classNames from "classnames"
type RowColWidth =
  | number
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "11"
  | "12"
  | "auto"
type RowColumns = RowColWidth | { cols?: RowColWidth }
export interface RowProps extends BsPrefixProps, React.HTMLAttributes<HTMLElement> {
  xs?: RowColumns
  sm?: RowColumns
  md?: RowColumns
  lg?: RowColumns
  xl?: RowColumns
  xxl?: RowColumns
}
const DEVICE_SIZES = ["xxl", "xl", "lg", "md", "sm", "xs"] as const
export const Row: BsPrefixRefForwardingComponent<"div", RowProps> = React.forwardRef<
  HTMLDivElement,
  RowProps
>(({ bsPrefix, className, as: Component = "div", ...ps }: RowProps, ref) => {
  const decoratedBsPrefix = useBootstrapPrefix(bsPrefix, "row")
  const sizePrefix = `${decoratedBsPrefix}-cols`
  const cs: string[] = []
  DEVICE_SIZES.forEach(x => {
    const v = ps[x]
    delete ps[x]
    let cols
    if (v != null && typeof v === "object") {
      ;({ cols } = v)
    } else cols = v
    const infix = x !== "xs" ? `-${x}` : ""
    if (cols != null) cs.push(`${sizePrefix}${infix}-${cols}`)
  })
  return <Component ref={ref} {...ps} className={classNames(className, decoratedBsPrefix, ...cs)} />
})
Row.displayName = "Row"
