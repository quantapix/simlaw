import { classNames, BsProps, BsRef } from "./helpers.js"
import { useBs } from "./Theme.jsx"
import * as qr from "react"
import type { Variant } from "./types.jsx"

export interface Props extends qr.HTMLAttributes<HTMLElement>, BsProps {
  animation: "border" | "grow"
  size?: "sm"
  variant?: Variant
}

export const Spinner: BsRef<"div", Props> = qr.forwardRef<HTMLElement, Props>(
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
