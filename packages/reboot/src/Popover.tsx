import { useBs, useIsRTL } from "./Theme.jsx"
import { withBs } from "./utils.jsx"
import * as qr from "react"
import * as qt from "./types.jsx"
import type { ArrowProps } from "./base/Overlay.jsx"
import type { Placement } from "./base/popper.js"

export const POPPER_OFFSET = [0, 8]

export const Header = withBs("popover-header")
export const Body = withBs("popover-body")

export interface Props extends qr.HTMLAttributes<HTMLDivElement>, qt.BsProps {
  placement?: Placement
  title?: string
  arrowProps?: Partial<ArrowProps>
  body?: boolean
  popper?: qt.PopperRef
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
    const bsDirection = qt.getDirection(primaryPlacement!, isRTL)
    return (
      <div
        ref={ref}
        role="tooltip"
        style={style}
        x-placement={primaryPlacement}
        className={qt.classNames(
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
