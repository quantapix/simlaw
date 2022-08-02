import classNames from 'classnames';
import * as React from 'react';
import Anchor from '@restart/ui/Anchor';
import {
  useNavItem,
  NavItemProps as BaseNavItemProps,
} from '@restart/ui/NavItem';
import { makeEventKey } from '@restart/ui/SelectableContext';
import { useBootstrapPrefix } from './ThemeProvider';
import { BsProps, BsPrefixRefForwardingComponent } from './helpers';

export interface Props extends BsProps, Omit<BaseNavItemProps, 'as'> {}

export const NavLink: BsPrefixRefForwardingComponent<'a', Props> =
  React.forwardRef<HTMLElement, Props>(
    (
      { bsPrefix, className, as: Component = Anchor, active, eventKey, ...ps },
      ref,
    ) => {
      bsPrefix = useBootstrapPrefix(bsPrefix, 'nav-link');
      const [navItemProps, meta] = useNavItem({
        key: makeEventKey(eventKey, ps.href),
        active,
        ...ps,
      });

      return (
        <Component
          {...ps}
          {...navItemProps}
          ref={ref}
          className={classNames(
            className,
            bsPrefix,
            ps.disabled && 'disabled',
            meta.isActive && 'active',
          )}
        />
      );
    },
  );

NavLink.displayName = 'NavLink';
NavLink.defaultProps = {
  disabled: false,
};
