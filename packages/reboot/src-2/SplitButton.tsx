import * as React from 'react';
import { ButtonType } from '@restart/ui/Button';
import { Button } from './Button';
import { ButtonGroup } from './ButtonGroup';
import { Dropdown, Props as _Props } from './Dropdown';
import { PropsFromToggle } from './DropdownToggle';
import { BsProps } from './helpers';

export interface Props extends Omit<_Props, 'title'>, PropsFromToggle, BsProps {
  menuRole?: string;
  renderMenuOnMount?: boolean;
  rootCloseEvent?: 'click' | 'mousedown';
  target?: string;
  title: React.ReactNode;
  toggleLabel?: string;
  type?: ButtonType;
  flip?: boolean;
}

export const SplitButton = React.forwardRef<HTMLElement, Props>(
  (
    {
      id,
      bsPrefix,
      size,
      variant,
      title,
      type,
      toggleLabel,
      children,
      onClick,
      href,
      target,
      menuRole,
      renderMenuOnMount,
      rootCloseEvent,
      flip,
      ...props
    },
    ref,
  ) => (
    <Dropdown ref={ref} {...props} as={ButtonGroup}>
      <Button
        size={size}
        variant={variant}
        disabled={props.disabled}
        bsPrefix={bsPrefix}
        href={href}
        target={target}
        onClick={onClick}
        type={type}
      >
        {title}
      </Button>
      <Dropdown.Toggle
        split
        id={id}
        size={size}
        variant={variant}
        disabled={props.disabled}
        childBsPrefix={bsPrefix}
      >
        <span className="visually-hidden">{toggleLabel}</span>
      </Dropdown.Toggle>

      <Dropdown.Menu
        role={menuRole}
        renderOnMount={renderMenuOnMount}
        rootCloseEvent={rootCloseEvent}
        flip={flip}
      >
        {children}
      </Dropdown.Menu>
    </Dropdown>
  ),
);

SplitButton.displayName = 'SplitButton';
SplitButton.defaultProps = {
  toggleLabel: 'Toggle dropdown',
  type: 'button',
};
