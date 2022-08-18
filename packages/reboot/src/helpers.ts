import * as React from "react"
import { TransitionComponent } from "@restart/ui/types"

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

export interface BsRefComp<T0 extends React.ElementType, P = unknown> {
  <T extends React.ElementType = T0>(
    props: React.PropsWithChildren<ReplaceProps<T, BsProps<T> & P>>,
    context?: any
  ): React.ReactElement | null
  contextTypes?: any
  defaultProps?: Partial<P>
  displayName?: string
}

export class BsComponent<
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
