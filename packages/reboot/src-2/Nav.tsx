import classNames from 'classnames';
import * as React from 'react';
import { useContext } from 'react';
import { useUncontrolled } from 'uncontrollable';
import BaseNav, { NavProps as BaseNavProps } from '@restart/ui/Nav';
import { EventKey } from '@restart/ui/types';
import { useBootstrapPrefix } from './ThemeProvider';
import { NavbarContext } from './NavbarContext';
import CardHeaderContext from './CardHeaderContext';
import NavItem from './NavItem';
import { NavLink } from './NavLink';
import { BsProps, BsRefComponent } from './helpers';

export interface Props extends BsProps, BaseNavProps {
  navbarBsPrefix?: string;
  cardHeaderBsPrefix?: string;
  variant?: 'tabs' | 'pills' | string;
  defaultActiveKey?: EventKey;
  fill?: boolean;
  justify?: boolean;
  navbar?: boolean;
  navbarScroll?: boolean;
}

export const Nav: BsRefComponent<'div', Props> = React.forwardRef<
  HTMLElement,
  Props
>((xs, ref) => {
  const {
    as = 'div',
    bsPrefix: initialBsPrefix,
    variant,
    fill,
    justify,
    navbar,
    navbarScroll,
    className,
    activeKey,
    ...ps
  } = useUncontrolled(xs, { activeKey: 'onSelect' });
  const bsPrefix = useBootstrapPrefix(initialBsPrefix, 'nav');
  let navbarBsPrefix;
  let cardHeaderBsPrefix;
  let isNavbar = false;
  const navbarContext = useContext(NavbarContext);
  const cardHeaderContext = useContext(CardHeaderContext);
  if (navbarContext) {
    navbarBsPrefix = navbarContext.bsPrefix;
    isNavbar = navbar == null ? true : navbar;
  } else if (cardHeaderContext) {
    ({ cardHeaderBsPrefix } = cardHeaderContext);
  }
  return (
    <BaseNav
      as={as}
      ref={ref}
      activeKey={activeKey}
      className={classNames(className, {
        [bsPrefix]: !isNavbar,
        [`${navbarBsPrefix}-nav`]: isNavbar,
        [`${navbarBsPrefix}-nav-scroll`]: isNavbar && navbarScroll,
        [`${cardHeaderBsPrefix}-${variant}`]: !!cardHeaderBsPrefix,
        [`${bsPrefix}-${variant}`]: !!variant,
        [`${bsPrefix}-fill`]: fill,
        [`${bsPrefix}-justified`]: justify,
      })}
      {...ps}
    />
  );
});

Nav.displayName = 'Nav';
Nav.defaultProps = {
  justify: false,
  fill: false,
};

Object.assign(Nav, {
  Item: NavItem,
  Link: NavLink,
});
