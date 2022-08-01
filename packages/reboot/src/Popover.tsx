import { BsPrefixProps, getOverlayDirection } from "./utils"
import { OverlayArrowProps } from "./Overlay"
import { Placement } from "./types"
import { useBootstrapPrefix, useIsRTL } from "./ThemeProvider"
import * as React from "react"
import classNames from "classnames"
import createWithBsPrefix from "./utils"
export const PopoverBody = createWithBsPrefix("popover-body")
export const PopoverHeader = createWithBsPrefix("popover-header")
export interface PopoverProps extends React.HTMLAttributes<HTMLDivElement>, BsPrefixProps {
  placement?: Placement
  title?: string
  arrowProps?: Partial<OverlayArrowProps>
  body?: boolean
  popper?: any
  show?: boolean
}
const defaultProps: Partial<PopoverProps> = {
  placement: "right",
}
export const Popover = React.forwardRef<HTMLDivElement, PopoverProps>(
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
    const decoratedBsPrefix = useBootstrapPrefix(bsPrefix, "popover")
    const isRTL = useIsRTL()
    const [primaryPlacement] = placement?.split("-") || []
    const bsDirection = getOverlayDirection(primaryPlacement, isRTL)
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
        {body ? <PopoverBody>{children}</PopoverBody> : children}
      </div>
    )
  }
)
Popover.defaultProps = defaultProps
Object.assign(Popover, {
  Header: PopoverHeader,
  Body: PopoverBody,
  POPPER_OFFSET: [0, 8] as const,
})
