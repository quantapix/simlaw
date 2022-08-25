import { useBs } from "./Theme.jsx"
import * as qr from "react"
import * as qt from "./types.jsx"

export interface Props extends qt.BsProps, qr.HTMLAttributes<HTMLElement> {
  bg?: qt.Variant
  pill?: boolean
  text?: qt.Color
}

export const Badge: qt.BsRef<"span", Props> = qr.forwardRef<HTMLElement, Props>(
  ({ bsPrefix, bg, pill, text, className, as: X = "span", ...ps }, ref) => {
    const bs = useBs(bsPrefix, "badge")
    return (
      <X
        ref={ref}
        {...ps}
        className={qt.classNames(
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
