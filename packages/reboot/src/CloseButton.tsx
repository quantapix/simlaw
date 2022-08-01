import * as React from "react"
import classNames from "classnames"
export type CloseButtonVariant = "white"
export interface CloseButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: CloseButtonVariant
}
const defaultProps = {
  "aria-label": "Close",
}
export const CloseButton = React.forwardRef<HTMLButtonElement, CloseButtonProps>(
  ({ className, variant, ...ps }, ref) => (
    <button
      ref={ref}
      type="button"
      className={classNames("btn-close", variant && `btn-close-${variant}`, className)}
      {...ps}
    />
  )
)
CloseButton.displayName = "CloseButton"
CloseButton.defaultProps = defaultProps
