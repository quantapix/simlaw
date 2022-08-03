import classNames from 'classnames';
import * as React from 'react';
import { useContext } from 'react';
import { useUncontrolled } from 'uncontrollable';
import BaseNav, { NavProps as _Props } from '@restart/ui/Nav';
import Anchor from '@restart/ui/Anchor';
import { useNavItem, NavItemProps as IPs } from '@restart/ui/NavItem';
import { makeEventKey } from '@restart/ui/SelectableContext';
import { EventKey } from '@restart/ui/types';
import { useBsPrefix } from './Theme';
import { Context as NContext } from './Navbar';
import { Context as CContext } from './Card';
import { BsProps, BsRefComp } from './helpers';
import { withBs } from './utils';

interface Data {
  role?: string;
  activeKey: EventKey | null;
  getControlledId: (key: EventKey | null) => string;
  getControllerId: (key: EventKey | null) => string;
}

export const Context = React.createContext<Data | null>(null);
Context.displayName = 'NavContext';

export const Item = withBs('nav-item');

export interface LinkProps extends BsProps, Omit<IPs, 'as'> {}

export const Link: BsRefComp<'a', LinkProps> = React.forwardRef<
  HTMLElement,
  LinkProps
>(({ bsPrefix, className, as: X = Anchor, active, eventKey, ...ps }, ref) => {
  const bs = useBsPrefix(bsPrefix, 'nav-link');
  const [navItemProps, meta] = useNavItem({
    key: makeEventKey(eventKey, ps.href),
    active,
    ...ps,
  });
  return (
    <X
      {...ps}
      {...navItemProps}
      ref={ref}
      className={classNames(
        className,
        bs,
        ps.disabled && 'disabled',
        meta.isActive && 'active',
      )}
    />
  );
});
Link.displayName = 'NavLink';
Link.defaultProps = {
  disabled: false,
};

export interface Props extends BsProps, _Props {
  navbarBsPrefix?: string;
  cardHeaderBsPrefix?: string;
  variant?: 'tabs' | 'pills' | string;
  defaultActiveKey?: EventKey;
  fill?: boolean;
  justify?: boolean;
  navbar?: boolean;
  navbarScroll?: boolean;
}

export const Nav: BsRefComp<'div', Props> = React.forwardRef<
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
  const bs = useBsPrefix(initialBsPrefix, 'nav');
  let navbarBsPrefix;
  let cardHeaderBsPrefix;
  let isNavbar = false;
  const nContext = useContext(NContext);
  const cContext = useContext(CContext);
  if (nContext) {
    navbarBsPrefix = nContext.bsPrefix;
    isNavbar = navbar == null ? true : navbar;
  } else if (cContext) {
    ({ cardHeaderBsPrefix } = cContext);
  }
  return (
    <BaseNav
      as={as}
      ref={ref}
      activeKey={activeKey}
      className={classNames(className, {
        [bs]: !isNavbar,
        [`${navbarBsPrefix}-nav`]: isNavbar,
        [`${navbarBsPrefix}-nav-scroll`]: isNavbar && navbarScroll,
        [`${cardHeaderBsPrefix}-${variant}`]: !!cardHeaderBsPrefix,
        [`${bs}-${variant}`]: !!variant,
        [`${bs}-fill`]: fill,
        [`${bs}-justified`]: justify,
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
