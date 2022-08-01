import { BsPrefixProps, BsPrefixRefForwardingComponent } from "./utils"
import { useBootstrapPrefix } from "./ThemeProvider"
import { Variant } from "./types"
import * as React from "react"
import classNames from "classnames"
export interface SpinnerProps extends React.HTMLAttributes<HTMLElement>, BsPrefixProps {
  animation: "border" | "grow"
  size?: "sm"
  variant?: Variant
}
export const Spinner: BsPrefixRefForwardingComponent<"div", SpinnerProps> = React.forwardRef<
  HTMLElement,
  SpinnerProps
>(({ bsPrefix, variant, animation, size, as: Component = "div", className, ...ps }, ref) => {
  bsPrefix = useBootstrapPrefix(bsPrefix, "spinner")
  const bsSpinnerPrefix = `${bsPrefix}-${animation}`
  return (
    <Component
      ref={ref}
      {...ps}
      className={classNames(
        className,
        bsSpinnerPrefix,
        size && `${bsSpinnerPrefix}-${size}`,
        variant && `text-${variant}`
      )}
    />
  )
})
Spinner.displayName = "Spinner"
