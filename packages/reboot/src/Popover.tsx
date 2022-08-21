import { classNames, BsProps, getDirection } from "./helpers.js"
import { useBs, useIsRTL } from "./Theme.jsx"
import { withBs } from "./utils.jsx"
import * as qr from "react"
import type { OverlayArrowProps } from "./base/Overlay.jsx"
import type { Placement, PopperRef } from "./types.jsx"

export const POPPER_OFFSET = [0, 8]

export const Header = withBs("popover-header")
export const Body = withBs("popover-body")

export interface Props extends qr.HTMLAttributes<HTMLDivElement>, BsProps {
  placement?: Placement
  title?: string
  arrowProps?: Partial<OverlayArrowProps>
  body?: boolean
  popper?: PopperRef
  show?: boolean
}

export const Popover = qr.forwardRef<HTMLDivElement, Props>(
  (
    {
      bsPrefix,
      placement,
      className,
      style,
      children,
      body,
      arrowProps,
      popper: _,
      show: _1,
      ...ps
    },
    ref
  ) => {
    const decoratedBsPrefix = useBs(bsPrefix, "popover")
    const isRTL = useIsRTL()
    const [primaryPlacement] = placement?.split("-") || []
    const bsDirection = getDirection(primaryPlacement, isRTL)
    return (
      <div
        ref={ref}
        role="tooltip"
        style={style}
        x-placement={primaryPlacement}
        className={classNames(
          className,
          decoratedBsPrefix,
          primaryPlacement && `bs-popover-${bsDirection}`
        )}
        {...ps}
      >
        <div className="popover-arrow" {...arrowProps} />
        {body ? <Body>{children}</Body> : children}
      </div>
    )
  }
)
Popover.defaultProps = {
  placement: "right",
}
