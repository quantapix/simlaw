import { classNames, BsProps, BsRef } from "./helpers.js"
import { useBs } from "./Theme.jsx"
import * as qr from "react"
import type { Color, Variant } from "./types.jsx"

export interface Props extends BsProps, qr.HTMLAttributes<HTMLElement> {
  bg?: Variant
  pill?: boolean
  text?: Color
}

export const Badge: BsRef<"span", Props> = qr.forwardRef<HTMLElement, Props>(
  ({ bsPrefix, bg, pill, text, className, as: X = "span", ...ps }, ref) => {
    const bs = useBs(bsPrefix, "badge")
    return (
      <X
        ref={ref}
        {...ps}
        className={classNames(
          className,
          bs,
          pill && `rounded-pill`,
          text && `text-${text}`,
          bg && `bg-${bg}`
        )}
      />
    )
  }
)
Badge.displayName = "Badge"
Badge.defaultProps = {
  bg: "primary",
  pill: false,
}
