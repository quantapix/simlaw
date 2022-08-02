import classNames from 'classnames';
import * as React from 'react';
import { useBootstrapPrefix } from './ThemeProvider';
import { AbstractModalHeader, Props as _Props } from './AbstractModalHeader';
import { BsOnlyProps } from './helpers';

export interface Props extends _Props, BsOnlyProps {}

export const ModalHeader = React.forwardRef<HTMLDivElement, Props>(
  ({ bsPrefix, className, ...props }, ref) => {
    bsPrefix = useBootstrapPrefix(bsPrefix, 'modal-header');
    return (
      <AbstractModalHeader
        ref={ref}
        {...props}
        className={classNames(className, bsPrefix)}
      />
    );
  },
);

ModalHeader.displayName = 'ModalHeader';
ModalHeader.defaultProps = {
  closeLabel: 'Close',
  closeButton: false,
};
