import * as React from 'react';
import { Dropdown, Props as _Props } from './Dropdown';
import { DropdownToggle, PropsFromToggle } from './DropdownToggle';
import { DropdownMenu, Variant } from './DropdownMenu';
import { BsProps, BsPrefixRefForwardingComponent } from './helpers';

export interface Props extends Omit<_Props, 'title'>, PropsFromToggle, BsProps {
  title: React.ReactNode;
  menuRole?: string;
  renderMenuOnMount?: boolean;
  rootCloseEvent?: 'click' | 'mousedown';
  menuVariant?: Variant;
  flip?: boolean;
}

export const DropdownButton: BsPrefixRefForwardingComponent<'div', Props> =
  React.forwardRef<HTMLDivElement, Props>(
    (
      {
        title,
        children,
        bsPrefix,
        rootCloseEvent,
        variant,
        size,
        menuRole,
        renderMenuOnMount,
        disabled,
        href,
        id,
        menuVariant,
        flip,
        ...ps
      },
      ref,
    ) => (
      <Dropdown ref={ref} {...ps}>
        <DropdownToggle
          id={id}
          href={href}
          size={size}
          variant={variant}
          disabled={disabled}
          childBsPrefix={bsPrefix}
        >
          {title}
        </DropdownToggle>
        <DropdownMenu
          role={menuRole}
          renderOnMount={renderMenuOnMount}
          rootCloseEvent={rootCloseEvent}
          variant={menuVariant}
          flip={flip}
        >
          {children}
        </DropdownMenu>
      </Dropdown>
    ),
  );

DropdownButton.displayName = 'DropdownButton';
