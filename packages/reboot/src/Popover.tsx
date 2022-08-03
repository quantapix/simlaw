import classNames from 'classnames';
import * as React from 'react';
import { OverlayArrowProps } from '@restart/ui/Overlay';
import { useBsPrefix, useIsRTL } from './Theme';
import { Placement, PopperRef } from './types';
import { BsProps, getDirection } from './helpers';
import { withBs } from './utils';

export const POPPER_OFFSET = [0, 8];

export const Header = withBs('popover-header');
export const Body = withBs('popover-body');

export interface Props extends React.HTMLAttributes<HTMLDivElement>, BsProps {
  placement?: Placement;
  title?: string;
  arrowProps?: Partial<OverlayArrowProps>;
  body?: boolean;
  popper?: PopperRef;
  show?: boolean;
}

export const Popover = React.forwardRef<HTMLDivElement, Props>(
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
    ref,
  ) => {
    const decoratedBsPrefix = useBsPrefix(bsPrefix, 'popover');
    const isRTL = useIsRTL();
    const [primaryPlacement] = placement?.split('-') || [];
    const bsDirection = getDirection(primaryPlacement, isRTL);
    return (
      <div
        ref={ref}
        role="tooltip"
        style={style}
        x-placement={primaryPlacement}
        className={classNames(
          className,
          decoratedBsPrefix,
          primaryPlacement && `bs-popover-${bsDirection}`,
        )}
        {...ps}
      >
        <div className="popover-arrow" {...arrowProps} />
        {body ? <Body>{children}</Body> : children}
      </div>
    );
  },
);
Popover.defaultProps = {
  placement: 'right',
};
