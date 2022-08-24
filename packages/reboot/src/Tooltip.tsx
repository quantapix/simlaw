import { classNames, BsProps, getDirection } from "./helpers.js"
import { useBs, useIsRTL } from "./Theme.jsx"
import * as qr from "react"
import type { ArrowProps } from "./base/Overlay.jsx"
import type { Placement, PopperRef } from "./types.jsx"

export interface Props extends qr.HTMLAttributes<HTMLDivElement>, BsProps {
  placement?: Placement
  arrowProps?: Partial<ArrowProps>
  show?: boolean
  popper?: PopperRef
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
    bsPrefix = useBs(bsPrefix, "tooltip")
    const isRTL = useIsRTL()
    const [primaryPlacement] = placement?.split("-") || []
    const bsDirection = getDirection(primaryPlacement, isRTL)
    return (
      <div
        ref={ref}
        style={style}
        role="tooltip"
        x-placement={primaryPlacement}
        className={classNames(className, bsPrefix, `bs-tooltip-${bsDirection}`)}
        {...ps}
      >
        <div className="tooltip-arrow" {...arrowProps} />
        <div className={`${bsPrefix}-inner`}>{children}</div>
      </div>
    )
  }
)
Tooltip.displayName = "Tooltip"
Tooltip.defaultProps = {
  placement: "right",
}
