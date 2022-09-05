import { useBs } from "./Theme.js"
import * as qr from "react"
import * as qt from "./types.js"

export type AspectRatio = "1x1" | "4x3" | "16x9" | "21x9" | string

export interface Props extends qt.BsProps, qr.HTMLAttributes<HTMLDivElement> {
  children: qr.ReactChild
  aspectRatio?: AspectRatio | number
}

function toPercent(num: number): string {
  if (num <= 0 || num > 100) return "100%"
  if (num < 1) return `${num * 100}%`
  return `${num}%`
}

export const Ratio = qr.forwardRef<HTMLDivElement, Props>(
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
        className={qt.classNames(
          bs,
          className,
          !isCustomRatio && `${bs}-${aspectRatio}`
        )}
      >
        {qr.Children.only(children)}
      </div>
    )
  }
)
Ratio.defaultProps = {
  aspectRatio: "1x1" as const,
}
