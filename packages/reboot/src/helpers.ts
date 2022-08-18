/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react"
import type { TransitionComponent } from "@restart/ui/esm/types.js"

export type Omit<T, U> = Pick<T, Exclude<keyof T, keyof U>>

export interface AsProp<T extends React.ElementType = React.ElementType> {
  as?: T
}

export type ReplaceProps<T extends React.ElementType, P> = Omit<
  React.ComponentPropsWithRef<T>,
  P
> &
  P

export interface BsOnlyProps {
  bsPrefix?: string
}

export interface BsProps<T extends React.ElementType = React.ElementType>
  extends BsOnlyProps,
    AsProp<T> {}

export interface BsRef<T0 extends React.ElementType, P = unknown> {
  <T extends React.ElementType = T0>(
    props: React.PropsWithChildren<ReplaceProps<T, BsProps<T> & P>>,
    context?: any
  ): React.ReactElement | null
  contextTypes?: any
  defaultProps?: Partial<P> | undefined
  displayName?: string | undefined
}

export class BsComp<
  T extends React.ElementType,
  P = unknown
> extends React.Component<ReplaceProps<T, BsProps<T> & P>> {}

export type BsCompClass<
  As extends React.ElementType,
  P = unknown
> = React.ComponentClass<ReplaceProps<As, BsProps<As> & P>>

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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
