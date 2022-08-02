import classNames from 'classnames';
import * as React from 'react';
import { useCallback, useMemo } from 'react';
import SelectableContext from '@restart/ui/SelectableContext';
import { SelectCallback } from '@restart/ui/types';
import { useUncontrolled } from 'uncontrollable';
import createWithBsPrefix from './createWithBsPrefix';
import { NavbarBrand } from './NavbarBrand';
import { NavbarCollapse } from './NavbarCollapse';
import { NavbarToggle } from './NavbarToggle';
import { NavbarOffcanvas } from './NavbarOffcanvas';
import { useBootstrapPrefix } from './ThemeProvider';
import { NavbarContext, ContextType } from './NavbarContext';
import { BsProps, BsPrefixRefForwardingComponent } from './helpers';

const NavbarText = createWithBsPrefix('navbar-text', {
  Component: 'span',
});

export interface Props
  extends BsProps,
    Omit<React.HTMLAttributes<HTMLElement>, 'onSelect'> {
  variant?: 'light' | 'dark' | string;
  expand?: boolean | string | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  bg?: string;
  fixed?: 'top' | 'bottom';
  sticky?: 'top';
  onToggle?: (expanded: boolean) => void;
  onSelect?: SelectCallback;
  collapseOnSelect?: boolean;
  expanded?: boolean;
}

export const Navbar: BsPrefixRefForwardingComponent<'nav', Props> =
  React.forwardRef<HTMLElement, Props>((xs, ref) => {
    const {
      bsPrefix: initialBsPrefix,
      expand,
      variant,
      bg,
      fixed,
      sticky,
      className,
      as: Component = 'nav',
      expanded,
      onToggle,
      onSelect,
      collapseOnSelect,
      ...ps
    } = useUncontrolled(xs, {
      expanded: 'onToggle',
    });
    const bsPrefix = useBootstrapPrefix(initialBsPrefix, 'navbar');
    const handleCollapse = useCallback<SelectCallback>(
      (...args) => {
        onSelect?.(...args);
        if (collapseOnSelect && expanded) {
          onToggle?.(false);
        }
      },
      [onSelect, collapseOnSelect, expanded, onToggle],
    );
    if (ps.role === undefined && Component !== 'nav') {
      ps.role = 'navigation';
    }
    let expandClass = `${bsPrefix}-expand`;
    if (typeof expand === 'string') expandClass = `${expandClass}-${expand}`;
    const navbarContext = useMemo<ContextType>(
      () => ({
        onToggle: () => onToggle?.(!expanded),
        bsPrefix,
        expanded: !!expanded,
        expand,
      }),
      [bsPrefix, expanded, expand, onToggle],
    );
    return (
      <NavbarContext.Provider value={navbarContext}>
        <SelectableContext.Provider value={handleCollapse}>
          <Component
            ref={ref}
            {...ps}
            className={classNames(
              className,
              bsPrefix,
              expand && expandClass,
              variant && `${bsPrefix}-${variant}`,
              bg && `bg-${bg}`,
              sticky && `sticky-${sticky}`,
              fixed && `fixed-${fixed}`,
            )}
          />
        </SelectableContext.Provider>
      </NavbarContext.Provider>
    );
  });

Navbar.displayName = 'Navbar';
Navbar.defaultProps = {
  expand: true,
  variant: 'light' as const,
  collapseOnSelect: false,
};

Object.assign(Navbar, {
  Brand: NavbarBrand,
  Collapse: NavbarCollapse,
  Offcanvas: NavbarOffcanvas,
  Text: NavbarText,
  Toggle: NavbarToggle,
});
