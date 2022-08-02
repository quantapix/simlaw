import classNames from 'classnames';
import * as React from 'react';
import { useBootstrapPrefix } from './ThemeProvider';
import { BsProps, BsPrefixRefForwardingComponent } from './helpers';

export interface Props extends BsProps, React.HTMLAttributes<HTMLElement> {
  href?: string;
}

export const NavbarBrand: BsPrefixRefForwardingComponent<'a', Props> =
  React.forwardRef<HTMLElement, Props>(
    ({ bsPrefix, className, as, ...ps }, ref) => {
      bsPrefix = useBootstrapPrefix(bsPrefix, 'navbar-brand');
      const Component = as || (ps.href ? 'a' : 'span');
      return (
        <Component
          {...ps}
          ref={ref}
          className={classNames(className, bsPrefix)}
        />
      );
    },
  );

NavbarBrand.displayName = 'NavbarBrand';
