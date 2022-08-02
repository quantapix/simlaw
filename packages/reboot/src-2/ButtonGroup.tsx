import classNames from 'classnames';
import * as React from 'react';
import { useBootstrapPrefix } from './ThemeProvider';
import { BsProps, BsPrefixRefForwardingComponent } from './helpers';

export interface Props extends BsProps, React.HTMLAttributes<HTMLElement> {
  size?: 'sm' | 'lg';
  vertical?: boolean;
}

export const ButtonGroup: BsPrefixRefForwardingComponent<'div', Props> =
  React.forwardRef(
    (
      {
        bsPrefix,
        size,
        vertical,
        className,
        as: Component = 'div',
        ...ps
      }: Props,
      ref,
    ) => {
      const prefix = useBootstrapPrefix(bsPrefix, 'btn-group');
      let baseClass = prefix;
      if (vertical) baseClass = `${prefix}-vertical`;
      return (
        <Component
          {...ps}
          ref={ref}
          className={classNames(
            className,
            baseClass,
            size && `${prefix}-${size}`,
          )}
        />
      );
    },
  );

ButtonGroup.displayName = 'ButtonGroup';
ButtonGroup.defaultProps = {
  vertical: false,
  role: 'group',
};
