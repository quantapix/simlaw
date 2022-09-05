import { useBs, useIsRTL } from "./Theme.js"
import * as qr from "react"
import * as qt from "./types.js"
import * as qu from "./utils.js"
import type { ArrowProps } from "./base/Overlay.js"
import type { Placement } from "./base/popper.js"

export interface Props extends qr.HTMLAttributes<HTMLDivElement>, qt.BsProps {
  placement?: Placement
  arrowProps?: Partial<ArrowProps>
  show?: boolean
  popper?: qt.PopperRef
}

export const Tooltip = qr.forwardRef<HTMLDivElement, Props>(
  (
    {
      bsPrefix,
      placement,
      className,
      style,
      children,
      arrowProps,
      popper: _,
      show: _2,
      ...ps
    }: Props,
    ref
  ) => {
    const bs = useBs(bsPrefix, "tooltip")
    const isRTL = useIsRTL()
    const [primary] = placement?.split("-") || []
    const dir = qu.getDirection(primary!, isRTL)
    return (
      <div
        ref={ref}
        style={style}
        role="tooltip"
        x-placement={primary}
        className={qt.classNames(className, bs, `bs-tooltip-${dir}`)}
        {...ps}
      >
        <div className="tooltip-arrow" {...arrowProps} />
        <div className={`${bs}-inner`}>{children}</div>
      </div>
    )
  }
)
Tooltip.displayName = "Tooltip"
Tooltip.defaultProps = { placement: "right" }
