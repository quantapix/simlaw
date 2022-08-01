import { BsPrefixProps, BsPrefixRefForwardingComponent } from "./utils"
import { useBootstrapPrefix } from "./ThemeProvider"
import * as React from "react"
import classNames from "classnames"
type NumberAttr = number | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "11" | "12"
type ColOrderNumber = number | "1" | "2" | "3" | "4" | "5"
type ColOrder = ColOrderNumber | "first" | "last"
type ColSize = boolean | "auto" | NumberAttr
type ColSpec = ColSize | { span?: ColSize; offset?: NumberAttr; order?: ColOrder }
export interface ColProps extends BsPrefixProps, React.HTMLAttributes<HTMLElement> {
  xs?: ColSpec
  sm?: ColSpec
  md?: ColSpec
  lg?: ColSpec
  xl?: ColSpec
  xxl?: ColSpec
}
const DEVICE_SIZES = ["xxl", "xl", "lg", "md", "sm", "xs"] as const
export interface UseColMetadata {
  as?: React.ElementType
  bsPrefix: string
  spans: string[]
}
export function useCol({ as, bsPrefix, className, ...ps }: ColProps): [any, UseColMetadata] {
  bsPrefix = useBootstrapPrefix(bsPrefix, "col")
  const spans: string[] = []
  const classes: string[] = []
  DEVICE_SIZES.forEach(brkPoint => {
    const propValue = ps[brkPoint]
    delete ps[brkPoint]
    let span: ColSize | undefined
    let offset: NumberAttr | undefined
    let order: ColOrder | undefined
    if (typeof propValue === "object" && propValue != null) {
      ;({ span = true, offset, order } = propValue)
    } else span = propValue
    const infix = brkPoint !== "xs" ? `-${brkPoint}` : ""
    if (span) spans.push(span === true ? `${bsPrefix}${infix}` : `${bsPrefix}${infix}-${span}`)
    if (order != null) classes.push(`order${infix}-${order}`)
    if (offset != null) classes.push(`offset${infix}-${offset}`)
  })
  return [
    { ...ps, className: classNames(className, ...classes, ...spans) },
    {
      as,
      bsPrefix,
      spans,
    },
  ]
}
export const Col: BsPrefixRefForwardingComponent<"div", ColProps> = React.forwardRef<
  HTMLElement,
  ColProps
>((ps, ref) => {
  const [{ className, ...colProps }, { as: Component = "div", bsPrefix, spans }] = useCol(ps)
  return (
    <Component
      {...colProps}
      ref={ref}
      className={classNames(className, !spans.length && bsPrefix)}
    />
  )
})
Col.displayName = "Col"
