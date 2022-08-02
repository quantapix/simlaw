import classNames from 'classnames';
import * as React from 'react';
import { useContext } from 'react';
import useEventCallback from '@restart/hooks/useEventCallback';
import { useBootstrapPrefix } from './ThemeProvider';
import { NavbarContext } from './NavbarContext';
import { BsProps, BsPrefixRefForwardingComponent } from './helpers';

export interface Props extends BsProps, React.HTMLAttributes<HTMLElement> {
  label?: string;
}

export const NavbarToggle: BsPrefixRefForwardingComponent<'button', Props> =
  React.forwardRef<HTMLElement, Props>(
    (
      {
        bsPrefix,
        className,
        children,
        label,
        as: Component = 'button',
        onClick,
        ...ps
      },
      ref,
    ) => {
      bsPrefix = useBootstrapPrefix(bsPrefix, 'navbar-toggler');
      const { onToggle, expanded } = useContext(NavbarContext) || {};
      const clickCB = useEventCallback((e) => {
        if (onClick) onClick(e);
        if (onToggle) onToggle();
      });
      if (Component === 'button') {
        (ps as any).type = 'button';
      }
      return (
        <Component
          {...ps}
          ref={ref}
          onClick={clickCB}
          aria-label={label}
          className={classNames(className, bsPrefix, !expanded && 'collapsed')}
        >
          {children || <span className={`${bsPrefix}-icon`} />}
        </Component>
      );
    },
  );

NavbarToggle.displayName = 'NavbarToggle';
NavbarToggle.defaultProps = {
  label: 'Toggle navigation',
};
