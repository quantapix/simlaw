import * as qr from "react"
import * as qt from "./types.jsx"

export type Type = "valid" | "invalid"

export interface Props extends qt.AsProp, qr.HTMLAttributes<HTMLElement> {
  bsPrefix?: never
  type?: Type | undefined
  tooltip?: boolean
}

export const Feedback: qt.BsRef<"div", Props> = qr.forwardRef(
  (
    { as: X = "div", className, type = "valid", tooltip = false, ...ps },
    ref
  ) => (
    <X
      {...ps}
      ref={ref}
      className={qt.classNames(
        className,
        `${type}-${tooltip ? "tooltip" : "feedback"}`
      )}
    />
  )
)
Feedback.displayName = "Feedback"
