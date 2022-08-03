import classNames from 'classnames';
import * as React from 'react';
import { OverlayArrowProps } from '@restart/ui/Overlay';
import { useBsPrefix, useIsRTL } from './Theme';
import { Placement, PopperRef } from './types';
import { BsProps, getDirection } from './helpers';

export interface Props extends React.HTMLAttributes<HTMLDivElement>, BsProps {
  placement?: Placement;
  arrowProps?: Partial<OverlayArrowProps>;
  show?: boolean;
  popper?: PopperRef;
}

export const Tooltip = React.forwardRef<HTMLDivElement, Props>(
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
    ref,
  ) => {
    bsPrefix = useBsPrefix(bsPrefix, 'tooltip');
    const isRTL = useIsRTL();
    const [primaryPlacement] = placement?.split('-') || [];
    const bsDirection = getDirection(primaryPlacement, isRTL);
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
    );
  },
);
Tooltip.displayName = 'Tooltip';
Tooltip.defaultProps = {
  placement: 'right',
};
