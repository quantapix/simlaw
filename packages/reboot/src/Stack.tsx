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

export function createUtilClasses(
  xs: Record<string, Utility<unknown>>,
  bps = BREAKPOINTS,
  min = MIN_BREAKPOINT
) {
  const ys: string[] = []
  Object.entries(xs).forEach(([n, v]) => {
    if (v != null) {
      if (typeof v === "object") {
        bps.forEach(bp => {
          const x = (v as any)[bp]
          if (x != null) {
            const infix = bp !== min ? `-${bp}` : ""
            ys.push(`${n}${infix}-${x}`)
          }
        })
      } else ys.push(`${n}-${v}`)
    }
  })
  return ys
}

export type Direction = "horizontal" | "vertical"

export interface Props extends qt.BsProps, qr.HTMLAttributes<HTMLElement> {
  direction?: Direction
  gap?: Utility<qt.GapValue>
}

export const Stack: qt.BsRef<"span", Props> = qr.forwardRef<HTMLElement, Props>(
  ({ as: X = "div", bsPrefix, className, direction, gap, ...ps }, ref) => {
    const bs = useBs(bsPrefix, direction === "horizontal" ? "hstack" : "vstack")
    const bps = useBreakpoints()
    const min = useMinBreakpoint()
    return (
      <X
        {...ps}
        ref={ref}
        className={qt.classNames(
          className,
          bs,
          ...createUtilClasses({ gap }, bps, min)
        )}
      />
    )
  }
)
Stack.displayName = "Stack"
