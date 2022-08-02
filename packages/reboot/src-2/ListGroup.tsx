import classNames from 'classnames';
import * as React from 'react';
import warning from 'warning';
import { useUncontrolled } from 'uncontrollable';
import BaseNav, { NavProps as BaseNavProps } from '@restart/ui/Nav';
import { EventKey } from '@restart/ui/types';
import { makeEventKey } from '@restart/ui/SelectableContext';
import useEventCallback from '@restart/hooks/useEventCallback';
import {
  useNavItem,
  NavItemProps as BaseNavItemProps,
} from '@restart/ui/NavItem';
import { BsProps, BsPrefixRefForwardingComponent } from './helpers';
import { useBootstrapPrefix } from './ThemeProvider';
import { Variant } from './types';

export interface ItemProps extends Omit<BaseNavItemProps, 'onSelect'>, BsProps {
  action?: boolean;
  onClick?: React.MouseEventHandler;
  variant?: Variant;
}

export const Item: BsPrefixRefForwardingComponent<'a', ItemProps> =
  React.forwardRef<HTMLElement, ItemProps>(
    (
      {
        bsPrefix,
        active,
        disabled,
        eventKey,
        className,
        variant,
        action,
        as,
        ...ps
      },
      ref,
    ) => {
      bsPrefix = useBootstrapPrefix(bsPrefix, 'list-group-item');
      const [navItemProps, meta] = useNavItem({
        key: makeEventKey(eventKey, ps.href),
        active,
        ...ps,
      });

      const handleClick = useEventCallback((event) => {
        if (disabled) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }

        navItemProps.onClick(event);
      });

      if (disabled && ps.tabIndex === undefined) {
        ps.tabIndex = -1;
        ps['aria-disabled'] = true;
      }
      // eslint-disable-next-line no-nested-ternary
      const Component = as || (action ? (ps.href ? 'a' : 'button') : 'div');
      return (
        <Component
          ref={ref}
          {...ps}
          {...navItemProps}
          onClick={handleClick}
          className={classNames(
            className,
            bsPrefix,
            meta.isActive && 'active',
            disabled && 'disabled',
            variant && `${bsPrefix}-${variant}`,
            action && `${bsPrefix}-action`,
          )}
        />
      );
    },
  );

Item.displayName = 'ListGroupItem';

export interface Props extends BsProps, BaseNavProps {
  variant?: 'flush' | string;
  horizontal?: boolean | string | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  defaultActiveKey?: EventKey;
  numbered?: boolean;
}

export const ListGroup: BsPrefixRefForwardingComponent<'div', Props> =
  React.forwardRef<HTMLElement, Props>((xs, ref) => {
    const {
      className,
      bsPrefix: initialBsPrefix,
      variant,
      horizontal,
      numbered,
      as = 'div',
      ...ps
    } = useUncontrolled(xs, {
      activeKey: 'onSelect',
    });

    const bsPrefix = useBootstrapPrefix(initialBsPrefix, 'list-group');

    let horizontalVariant: string | undefined;
    if (horizontal) {
      horizontalVariant =
        horizontal === true ? 'horizontal' : `horizontal-${horizontal}`;
    }

    warning(
      !(horizontal && variant === 'flush'),
      '`variant="flush"` and `horizontal` should not be used together.',
    );

    return (
      <BaseNav
        ref={ref}
        {...ps}
        as={as}
        className={classNames(
          className,
          bsPrefix,
          variant && `${bsPrefix}-${variant}`,
          horizontalVariant && `${bsPrefix}-${horizontalVariant}`,
          numbered && `${bsPrefix}-numbered`,
        )}
      />
    );
  });

ListGroup.displayName = 'ListGroup';

Object.assign(ListGroup, {
  Item,
});
