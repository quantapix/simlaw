import { BsPrefixProps } from "./utils"
import { useBootstrapPrefix } from "./ThemeProvider"
import * as React from "react"
import classNames from "classnames"
export type AspectRatio = "1x1" | "4x3" | "16x9" | "21x9" | string
export interface RatioProps extends BsPrefixProps, React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactChild
  aspectRatio?: AspectRatio | number
}
const defaultProps = {
  aspectRatio: "1x1" as const,
}
function toPercent(x: number): string {
  if (x <= 0 || x > 100) return "100%"
  if (x < 1) return `${x * 100}%`
  return `${x}%`
}
export const Ratio = React.forwardRef<HTMLDivElement, RatioProps>(
  ({ bsPrefix, className, children, aspectRatio, style, ...ps }, ref) => {
    bsPrefix = useBootstrapPrefix(bsPrefix, "ratio")
    const isCustom = typeof aspectRatio === "number"
    return (
      <div
        ref={ref}
        {...ps}
        style={{
          ...style,
          ...(isCustom && {
            "--bs-aspect-ratio": toPercent(aspectRatio as number),
          }),
        }}
        className={classNames(bsPrefix, className, !isCustom && `${bsPrefix}-${aspectRatio}`)}
      >
        {React.Children.only(children)}
      </div>
    )
  }
)
Ratio.defaultProps = defaultProps
