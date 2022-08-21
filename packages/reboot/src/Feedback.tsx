import { classNames, AsProp, BsRef } from "./helpers.js"
import * as qr from "react"

export type Type = "valid" | "invalid"

export interface Props extends AsProp, qr.HTMLAttributes<HTMLElement> {
  bsPrefix?: never
  type?: Type | undefined
  tooltip?: boolean
}

export const Feedback: BsRef<"div", Props> = qr.forwardRef(
  (
    { as: X = "div", className, type = "valid", tooltip = false, ...ps },
    ref
  ) => (
    <X
      {...ps}
      ref={ref}
      className={classNames(
        className,
        `${type}-${tooltip ? "tooltip" : "feedback"}`
      )}
    />
  )
)
Feedback.displayName = "Feedback"
