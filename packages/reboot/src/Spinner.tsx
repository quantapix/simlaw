import * as React from "react"
import { useBs } from "./Theme.jsx"
import { classNames, BsProps, BsRefComp } from "./helpers.js"
import type { Variant } from "./types.jsx"

export interface Props extends React.HTMLAttributes<HTMLElement>, BsProps {
  animation: "border" | "grow"
  size?: "sm"
  variant?: Variant
}

export const Spinner: BsRefComp<"div", Props> = React.forwardRef<
  HTMLElement,
  Props
>(
  (
    { bsPrefix, variant, animation, size, as: X = "div", className, ...ps },
    ref
  ) => {
    const bs = useBs(bsPrefix, "spinner")
    const bsSpinnerPrefix = `${bs}-${animation}`
    return (
      <X
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
  }
)
Spinner.displayName = "Spinner"
