import { useBs } from "./Theme.js"
import * as qr from "react"
import * as qt from "./types.js"

export interface Props extends qr.HTMLAttributes<HTMLElement>, qt.BsProps {
  animation: "border" | "grow"
  size?: "sm"
  variant?: qt.Variant
}

export const Spinner: qt.BsRef<"div", Props> = qr.forwardRef<
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
        className={qt.classNames(
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
