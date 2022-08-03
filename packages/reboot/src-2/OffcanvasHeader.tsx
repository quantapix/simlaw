import classNames from 'classnames';
import * as React from 'react';
import { useBsPrefix } from './ThemeProvider';
import { AbstractModalHeader, Props as _Props } from './AbstractModalHeader';
import { BsOnlyProps } from './helpers';

export interface Props extends _Props, BsOnlyProps {}

export const OffcanvasHeader = React.forwardRef<HTMLDivElement, Props>(
  ({ bsPrefix, className, ...ps }, ref) => {
    bsPrefix = useBsPrefix(bsPrefix, 'offcanvas-header');
    return (
      <AbstractModalHeader
        ref={ref}
        {...ps}
        className={classNames(className, bsPrefix)}
      />
    );
  },
);

OffcanvasHeader.displayName = 'OffcanvasHeader';
OffcanvasHeader.defaultProps = {
  closeLabel: 'Close',
  closeButton: false,
};
