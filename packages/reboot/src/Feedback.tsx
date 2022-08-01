import { AsProp, BsPrefixRefForwardingComponent } from "./utils"
import * as React from "react"
import classNames from "classnames"
export type FeedbackType = "valid" | "invalid"
export interface FeedbackProps extends AsProp, React.HTMLAttributes<HTMLElement> {
  bsPrefix?: never
  type?: FeedbackType
  tooltip?: boolean
}
export const Feedback: BsPrefixRefForwardingComponent<"div", FeedbackProps> = React.forwardRef(
  ({ as: Component = "div", className, type = "valid", tooltip = false, ...ps }, ref) => (
    <Component
      {...ps}
      ref={ref}
      className={classNames(className, `${type}-${tooltip ? "tooltip" : "feedback"}`)}
    />
  )
)
Feedback.displayName = "Feedback"
