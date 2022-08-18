/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react"
import { useBs, useBreakpoints, useMinBreakpoint } from "./Theme.jsx"
import { classNames, BsProps, BsRef } from "./helpers.js"

type ColWidth =
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
type Columns = ColWidth | { cols?: ColWidth }

export interface Props extends BsProps, React.HTMLAttributes<HTMLElement> {
  xs?: Columns
  sm?: Columns
  md?: Columns
  lg?: Columns
  xl?: Columns
  xxl?: Columns
  [key: string]: any
}

export const Row: BsRef<"div", Props> = React.forwardRef<HTMLDivElement, Props>(
  ({ bsPrefix, className, as: X = "div", ...ps }: Props, ref) => {
    const decoratedBsPrefix = useBs(bsPrefix, "row")
    const breakpoints = useBreakpoints()
    const minBreakpoint = useMinBreakpoint()
    const sizePrefix = `${decoratedBsPrefix}-cols`
    const classes: string[] = []
    breakpoints.forEach(x => {
      const propValue = ps[x]
      delete ps[x]
      let cols
      if (propValue != null && typeof propValue === "object") {
        ;({ cols } = propValue)
      } else {
        cols = propValue
      }
      const infix = x !== minBreakpoint ? `-${x}` : ""
      if (cols != null) classes.push(`${sizePrefix}${infix}-${cols}`)
    })
    return (
      <X
        ref={ref}
        {...ps}
        className={classNames(className, decoratedBsPrefix, ...classes)}
      />
    )
  }
)
Row.displayName = "Row"
