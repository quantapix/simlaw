import classNames from 'classnames';
import * as React from 'react';
import { useBootstrapPrefix } from './ThemeProvider';
import { BsProps } from './helpers';

export interface Props extends BsProps, React.HTMLAttributes<HTMLElement> {}

export const ButtonToolbar = React.forwardRef<HTMLDivElement, Props>(
  ({ bsPrefix, className, ...ps }, ref) => {
    const prefix = useBootstrapPrefix(bsPrefix, 'btn-toolbar');
    return <div {...ps} ref={ref} className={classNames(className, prefix)} />;
  },
);

ButtonToolbar.displayName = 'ButtonToolbar';
ButtonToolbar.defaultProps = {
  role: 'toolbar',
};
