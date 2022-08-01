import classNames from "classnames"
import * as React from "react"
import { OverlayArrowProps } from "@restart/ui/Overlay"
import { useBootstrapPrefix, useIsRTL } from "./ThemeProvider"
import { Placement } from "./types"
import { BsPrefixProps, getOverlayDirection } from "./utils"
export interface TooltipProps extends React.HTMLAttributes<HTMLDivElement>, BsPrefixProps {
  placement?: Placement
  arrowProps?: Partial<OverlayArrowProps>
  show?: boolean
  popper?: any
}
export const Tooltip = React.forwardRef<HTMLDivElement, TooltipProps>(
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
      ...props
    }: TooltipProps,
    ref
  ) => {
    bsPrefix = useBootstrapPrefix(bsPrefix, "tooltip")
    const isRTL = useIsRTL()
    const [primaryPlacement] = placement?.split("-") || []
    const bsDirection = getOverlayDirection(primaryPlacement, isRTL)
    return (
      <div
        ref={ref}
        style={style}
        role="tooltip"
        x-placement={primaryPlacement}
        className={classNames(className, bsPrefix, `bs-tooltip-${bsDirection}`)}
        {...props}
      >
        <div className="tooltip-arrow" {...arrowProps} />
        <div className={`${bsPrefix}-inner`}>{children}</div>
      </div>
    )
  }
)
Tooltip.defaultProps = { placement: "right" }
Tooltip.displayName = "Tooltip"
