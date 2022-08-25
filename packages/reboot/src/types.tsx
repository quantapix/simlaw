import * as qr from "react"
import type { Placement, State } from "./base/popper.js"
import type * as qt from "./base/types.jsx"

export * from "./base/types.jsx"

export type Omit2<T, U> = Pick<T, Exclude<keyof T, keyof U>>

export type ReplaceProps<T extends qr.ElementType, P> = Omit2<
  qr.ComponentPropsWithRef<T>,
  P
> &
  P

export interface BsOnlyProps {
  bsPrefix?: string | undefined
}

export interface AsProp<T extends qr.ElementType = qr.ElementType> {
  as?: T
}

export interface BsProps<T extends qr.ElementType = qr.ElementType>
  extends BsOnlyProps,
    AsProp<T> {}

export interface BsRef<T0 extends qr.ElementType, P = unknown> {
  <T extends qr.ElementType = T0>(
    props: qr.PropsWithChildren<ReplaceProps<T, BsProps<T> & P>>,
    context?: any
  ): qr.ReactElement | null
  contextTypes?: any
  defaultProps?: Partial<P> | undefined
  displayName?: string | undefined
}

export class BsComp<T extends qr.ElementType, P = unknown> extends qr.Component<
  ReplaceProps<T, BsProps<T> & P>
> {}

export type BsCompClass<
  As extends qr.ElementType,
  P = unknown
> = qr.ComponentClass<ReplaceProps<As, BsProps<As> & P>>

export type Transition = boolean | qt.Transition

export function getDirection(placement: string, isRTL?: boolean) {
  let bsDirection = placement
  if (placement === "left") {
    bsDirection = isRTL ? "end" : "start"
  } else if (placement === "right") {
    bsDirection = isRTL ? "start" : "end"
  }
  return bsDirection
}

export type Arg =
  | string
  | number
  | boolean
  | undefined
  | null
  | Record<string, unknown>
  | Array<Arg>

export function classNames(...xs: Array<Arg>): string {
  const ys = []
  for (const x of xs) {
    if (!x) continue
    if (typeof x === "string" || typeof x === "number") {
      ys.push(x)
    } else if (Array.isArray(x)) {
      if (x.length) {
        const y = classNames(...x)
        if (y) {
          ys.push(y)
        }
      }
    } else if (typeof x === "object") {
      if (x.toString === Object.prototype.toString) {
        const hasOwn = {}.hasOwnProperty
        for (const k in x as any) {
          if (hasOwn.call(x, k) && x[k]) {
            ys.push(k)
          }
        }
      } else {
        ys.push(x.toString())
      }
    }
  }
  return ys.join(" ")
}

export function invariant(cond: any, format: string, ...xs: any[]) {
  if (!cond) {
    let e: Error
    if (format === undefined) {
      e = new Error("Minified exception occurred")
    } else {
      let i = 0
      e = new Error(
        format.replace(/%s/g, function () {
          return xs[i++]
        })
      )
      e.name = "Invariant Violation"
    }
    // e.framesToPop = 1
    throw e
  }
}

export type Variant =
  | "primary"
  | "secondary"
  | "success"
  | "danger"
  | "warning"
  | "info"
  | "dark"
  | "light"
  | string
export type ButtonVariant =
  | Variant
  | "link"
  | "outline-primary"
  | "outline-secondary"
  | "outline-success"
  | "outline-danger"
  | "outline-warning"
  | "outline-info"
  | "outline-dark"
  | "outline-light"
export type Color =
  | "primary"
  | "secondary"
  | "success"
  | "danger"
  | "warning"
  | "info"
  | "dark"
  | "light"
  | "white"
  | "muted"

export type AlignDirection = "start" | "end"

export type ResponsiveAlignProp =
  | { sm: AlignDirection }
  | { md: AlignDirection }
  | { lg: AlignDirection }
  | { xl: AlignDirection }
  | { xxl: AlignDirection }
  | Record<string, AlignDirection>

export type AlignType = AlignDirection | ResponsiveAlignProp

export type RootCloseEvent = "click" | "mousedown"

export type GapValue = 0 | 1 | 2 | 3 | 4 | 5

export interface PopperRef {
  state: State | undefined
  outOfBoundaries: boolean
  placement: Placement | undefined
  scheduleUpdate?: (() => void) | undefined
}
