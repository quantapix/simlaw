import classNames from 'classnames';
import * as React from 'react';
import { OverlayArrowProps } from '@restart/ui/Overlay';
import { useBsPrefix, useIsRTL } from './ThemeProvider';
import { Placement, PopperRef } from './types';
import { BsProps, getOverlayDirection } from './helpers';
import withBsPrefix from './createWithBsPrefix';

export const Header = withBsPrefix('popover-header');

export const Body = withBsPrefix('popover-body');

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
    const bsDirection = getOverlayDirection(primaryPlacement, isRTL);
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

Object.assign(Popover, {
  Header,
  Body,
  POPPER_OFFSET: [0, 8] as const,
});
