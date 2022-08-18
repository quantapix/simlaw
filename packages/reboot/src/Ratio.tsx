import * as React from "react"
import { useBs } from "./Theme.jsx"
import { classNames, BsProps } from "./helpers.js"

export type AspectRatio = "1x1" | "4x3" | "16x9" | "21x9" | string

export interface Props extends BsProps, React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactChild
  aspectRatio?: AspectRatio | number
}

function toPercent(num: number): string {
  if (num <= 0 || num > 100) return "100%"
  if (num < 1) return `${num * 100}%`
  return `${num}%`
}

export const Ratio = React.forwardRef<HTMLDivElement, Props>(
  ({ bsPrefix, className, children, aspectRatio, style, ...ps }, ref) => {
    const bs = useBs(bsPrefix, "ratio")
    const isCustomRatio = typeof aspectRatio === "number"
    return (
      <div
        ref={ref}
        {...ps}
        style={{
          ...style,
          ...(isCustomRatio && {
            "--bs-aspect-ratio": toPercent(aspectRatio as number),
          }),
        }}
        className={classNames(
          bs,
          className,
          !isCustomRatio && `${bs}-${aspectRatio}`
        )}
      >
        {React.Children.only(children)}
      </div>
    )
  }
)
Ratio.defaultProps = {
  aspectRatio: "1x1" as const,
}
