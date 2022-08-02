import classNames from 'classnames';
import * as React from 'react';
import { useContext, useMemo } from 'react';
import BaseDropdown, {
  DropdownProps as BaseDropdownProps,
  ToggleMetadata,
} from '@restart/ui/Dropdown';
import { useUncontrolled } from 'uncontrollable';
import useEventCallback from '@restart/hooks/useEventCallback';
import DropdownContext, { DropDirection } from './DropdownContext';
import DropdownItem from './DropdownItem';
import { DropdownMenu, getDropdownMenuPlacement } from './DropdownMenu';
import { DropdownToggle } from './DropdownToggle';
import { Context as InputGroupContext } from './InputGroup';
import { useBootstrapPrefix, useIsRTL } from './ThemeProvider';
import createWithBsPrefix from './createWithBsPrefix';
import { BsProps, BsPrefixRefForwardingComponent } from './helpers';
import { AlignType } from './types';

const DropdownHeader = createWithBsPrefix('dropdown-header', {
  defaultProps: { role: 'heading' },
});
const DropdownDivider = createWithBsPrefix('dropdown-divider', {
  Component: 'hr',
  defaultProps: { role: 'separator' },
});
const DropdownItemText = createWithBsPrefix('dropdown-item-text', {
  Component: 'span',
});

export interface Props
  extends BaseDropdownProps,
    BsProps,
    Omit<React.HTMLAttributes<HTMLElement>, 'onSelect' | 'children'> {
  drop?: DropDirection;
  align?: AlignType;
  focusFirstItemOnShow?: boolean | 'keyboard';
  navbar?: boolean;
  autoClose?: boolean | 'outside' | 'inside';
}

export const Dropdown: BsPrefixRefForwardingComponent<'div', Props> =
  React.forwardRef<HTMLElement, Props>((xs, ref) => {
    const {
      bsPrefix,
      drop,
      show,
      className,
      align,
      onSelect,
      onToggle,
      focusFirstItemOnShow,
      as: Component = 'div',
      navbar: _4,
      autoClose,
      ...ps
    } = useUncontrolled(xs, { show: 'onToggle' });

    const isInputGroup = useContext(InputGroupContext);
    const prefix = useBootstrapPrefix(bsPrefix, 'dropdown');
    const isRTL = useIsRTL();

    const isClosingPermitted = (source: string): boolean => {
      if (autoClose === false) return source === 'click';
      if (autoClose === 'inside') return source !== 'rootClose';
      if (autoClose === 'outside') return source !== 'select';
      return true;
    };

    const handleToggle = useEventCallback(
      (nextShow: boolean, meta: ToggleMetadata) => {
        if (
          meta.originalEvent!.currentTarget === document &&
          (meta.source !== 'keydown' ||
            (meta.originalEvent as any).key === 'Escape')
        )
          meta.source = 'rootClose';
        if (isClosingPermitted(meta.source!)) onToggle?.(nextShow, meta);
      },
    );

    const alignEnd = align === 'end';
    const placement = getDropdownMenuPlacement(alignEnd, drop, isRTL);
    const contextValue = useMemo(
      () => ({
        align,
        drop,
        isRTL,
      }),
      [align, drop, isRTL],
    );
    return (
      <DropdownContext.Provider value={contextValue}>
        <BaseDropdown
          placement={placement}
          show={show}
          onSelect={onSelect}
          onToggle={handleToggle}
          focusFirstItemOnShow={focusFirstItemOnShow}
          itemSelector={`.${prefix}-item:not(.disabled):not(:disabled)`}
        >
          {isInputGroup ? (
            ps.children
          ) : (
            <Component
              {...ps}
              ref={ref}
              className={classNames(
                className,
                show && 'show',
                (!drop || drop === 'down') && prefix,
                drop === 'up' && 'dropup',
                drop === 'end' && 'dropend',
                drop === 'start' && 'dropstart',
              )}
            />
          )}
        </BaseDropdown>
      </DropdownContext.Provider>
    );
  });

Dropdown.displayName = 'Dropdown';
Dropdown.defaultProps = {
  navbar: false,
  align: 'start',
  autoClose: true,
};

Object.assign(Dropdown, {
  Toggle: DropdownToggle,
  Menu: DropdownMenu,
  Item: DropdownItem,
  ItemText: DropdownItemText,
  Divider: DropdownDivider,
  Header: DropdownHeader,
});
