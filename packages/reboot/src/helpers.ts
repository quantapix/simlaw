import type { TransitionComponent } from "./base/types.js"
import * as qr from "react"

export type Omit<T, U> = Pick<T, Exclude<keyof T, keyof U>>

export type ReplaceProps<T extends qr.ElementType, P> = Omit<
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

export type TransitionType = boolean | TransitionComponent

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

export function invariant(condition: any, format: string, ...args: any[]) {
  if (!condition) {
    let e: Error
    if (format === undefined) {
      e = new Error(
        "Minified exception occurred; use the non-minified dev environment " +
          "for the full error message and additional helpful warnings."
      )
    } else {
      let i = 0
      e = new Error(
        format.replace(/%s/g, function () {
          return args[i++]
        })
      )
      e.name = "Invariant Violation"
    }
    e.framesToPop = 1
    throw e
  }
}
