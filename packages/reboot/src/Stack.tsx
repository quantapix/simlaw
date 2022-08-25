import * as qr from "react"
import * as qt from "./types.jsx"
import {
  BREAKPOINTS,
  MIN_BREAKPOINT,
  useBs,
  useBreakpoints,
  useMinBreakpoint,
} from "./Theme.jsx"

export type Utility<T> =
  | T
  | {
      xs?: T
      sm?: T
      md?: T
      lg?: T
      xl?: T
      xxl?: T
    }

export function createUtilityClassName(
  utilityValues: Record<string, Utility<unknown>>,
  breakpoints = BREAKPOINTS,
  minBreakpoint = MIN_BREAKPOINT
) {
  const classes: string[] = []
  Object.entries(utilityValues).forEach(([n, v]) => {
    if (v != null) {
      if (typeof v === "object") {
        breakpoints.forEach(x => {
          const bp = (v as any)[x]
          if (bp != null) {
            const infix = x !== minBreakpoint ? `-${x}` : ""
            classes.push(`${n}${infix}-${bp}`)
          }
        })
      } else {
        classes.push(`${n}-${v}`)
      }
    }
  })
  return classes
}

export type Direction = "horizontal" | "vertical"

export interface Props extends qt.BsProps, qr.HTMLAttributes<HTMLElement> {
  direction?: Direction
  gap?: Utility<qt.GapValue>
}

export const Stack: qt.BsRef<"span", Props> = qr.forwardRef<HTMLElement, Props>(
  ({ as: X = "div", bsPrefix, className, direction, gap, ...ps }, ref) => {
    const bs = useBs(bsPrefix, direction === "horizontal" ? "hstack" : "vstack")
    const breakpoints = useBreakpoints()
    const minBreakpoint = useMinBreakpoint()
    return (
      <X
        {...ps}
        ref={ref}
        className={qt.classNames(
          className,
          bs,
          ...createUtilityClassName({
            gap,
            breakpoints,
            minBreakpoint,
          })
        )}
      />
    )
  }
)
Stack.displayName = "Stack"
