import { useBs, useBreakpoints, useMinBreakpoint } from "./Theme.js"
import * as qr from "react"
import * as qt from "./types.js"

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

export interface Props extends qt.BsProps, qr.HTMLAttributes<HTMLElement> {
  xs?: Columns
  sm?: Columns
  md?: Columns
  lg?: Columns
  xl?: Columns
  xxl?: Columns
  [key: string]: any
}

export const Row: qt.BsRef<"div", Props> = qr.forwardRef<HTMLDivElement, Props>(
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
        className={qt.classNames(className, decoratedBsPrefix, ...classes)}
      />
    )
  }
)
Row.displayName = "Row"
