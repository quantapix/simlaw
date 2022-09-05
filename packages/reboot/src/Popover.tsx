import { useBs, useIsRTL } from "./Theme.js"
import * as qr from "react"
import * as qt from "./types.js"
import * as qu from "./utils.js"
import type { ArrowProps } from "./base/Overlay.js"
import type { Placement } from "./base/popper.js"

export const POPPER_OFFSET = [0, 8]

export const Header = qu.withBs("popover-header")
export const Body = qu.withBs("popover-body")

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
    const bs = useBs(bsPrefix, "popover")
    const isRTL = useIsRTL()
    const [primary] = placement?.split("-") || []
    const dir = qu.getDirection(primary!, isRTL)
    return (
      <div
        ref={ref}
        role="tooltip"
        style={style}
        x-placement={primary}
        className={qt.classNames(className, bs, primary && `bs-popover-${dir}`)}
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
