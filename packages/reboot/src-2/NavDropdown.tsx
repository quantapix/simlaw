import classNames from 'classnames';
import * as React from 'react';
import { useBootstrapPrefix } from './ThemeProvider';
import { Dropdown, Props as _Props } from './Dropdown';
import { Variant } from './DropdownMenu';
import { NavLink } from './NavLink';
import { BsRefComponent } from './helpers';

export interface Props extends Omit<_Props, 'title'> {
  title: React.ReactNode;
  disabled?: boolean;
  active?: boolean;
  menuRole?: string;
  renderMenuOnMount?: boolean;
  rootCloseEvent?: 'click' | 'mousedown';
  menuVariant?: Variant;
}

export const NavDropdown: BsRefComponent<'div', Props> = React.forwardRef(
  (
    {
      id,
      title,
      children,
      bsPrefix,
      className,
      rootCloseEvent,
      menuRole,
      disabled,
      active,
      renderMenuOnMount,
      menuVariant,
      ...ps
    }: Props,
    ref,
  ) => {
    const navItemPrefix = useBootstrapPrefix(undefined, 'nav-item');
    return (
      <Dropdown
        ref={ref}
        {...ps}
        className={classNames(className, navItemPrefix)}
      >
        <Dropdown.Toggle
          id={id}
          eventKey={null}
          active={active}
          disabled={disabled}
          childBsPrefix={bsPrefix}
          as={NavLink}
        >
          {title}
        </Dropdown.Toggle>

        <Dropdown.Menu
          role={menuRole}
          renderOnMount={renderMenuOnMount}
          rootCloseEvent={rootCloseEvent}
          variant={menuVariant}
        >
          {children}
        </Dropdown.Menu>
      </Dropdown>
    );
  },
);

NavDropdown.displayName = 'NavDropdown';

Object.assign(NavDropdown, {
  Item: Dropdown.Item,
  ItemText: Dropdown.ItemText,
  Divider: Dropdown.Divider,
  Header: Dropdown.Header,
});
