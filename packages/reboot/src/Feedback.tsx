import * as React from "react"
import { classNames, AsProp, BsRef } from "./helpers.js"

export type Type = "valid" | "invalid"

export interface Props extends AsProp, React.HTMLAttributes<HTMLElement> {
  bsPrefix?: never
  type?: Type | undefined
  tooltip?: boolean
}

export const Feedback: BsRef<"div", Props> = React.forwardRef(
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
