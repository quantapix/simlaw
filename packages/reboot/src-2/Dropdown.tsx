import classNames from 'classnames';
import * as React from 'react';
import { useContext, useMemo } from 'react';
import warning from 'warning';
import useIsomorphicEffect from '@restart/hooks/useIsomorphicEffect';
import useMergedRefs from '@restart/hooks/useMergedRefs';
import Anchor from '@restart/ui/Anchor';
import BaseDropdown, {
  DropdownProps as _Props,
  ToggleMetadata,
} from '@restart/ui/Dropdown';
import BaseDropdownItem, {
  useDropdownItem,
  DropdownItemProps as BaseDropdownItemProps,
} from '@restart/ui/DropdownItem';
import {
  useDropdownMenu,
  UseDropdownMenuOptions,
} from '@restart/ui/DropdownMenu';
import { useDropdownToggle } from '@restart/ui/DropdownToggle';
import { useUncontrolled } from 'uncontrollable';
import useEventCallback from '@restart/hooks/useEventCallback';
import { Context as InputGroupContext } from './InputGroup';
import { useBsPrefix, useIsRTL } from './Theme';
import withBsPrefix from './createWithBsPrefix';
import { BsProps, BsRefComponent } from './helpers';
import { Context as NavbarContext } from './Navbar';
import { useWrappedRefWithWarning } from './use';
import { AlignType, AlignDirection, Placement } from './types';
import { Button as _Button, Props as _BProps, CommonProps } from './Button';
import { Link as NavLink } from './Nav';

export type Drop = 'up' | 'start' | 'end' | 'down';

export type ContextValue = {
  align?: AlignType;
  drop?: Drop;
  isRTL?: boolean;
};

export const Context = React.createContext<ContextValue>({});
Context.displayName = 'DropdownContext';

export type Variant = 'dark' | string;

export interface MenuProps extends BsProps, React.HTMLAttributes<HTMLElement> {
  show?: boolean;
  renderOnMount?: boolean;
  flip?: boolean;
  align?: AlignType;
  rootCloseEvent?: 'click' | 'mousedown';
  popperConfig?: UseDropdownMenuOptions['popperConfig'];
  variant?: Variant;
}

export function getMenuPlacement(
  alignEnd: boolean,
  dropDirection?: Drop,
  isRTL?: boolean,
) {
  const topStart = isRTL ? 'top-end' : 'top-start';
  const topEnd = isRTL ? 'top-start' : 'top-end';
  const bottomStart = isRTL ? 'bottom-end' : 'bottom-start';
  const bottomEnd = isRTL ? 'bottom-start' : 'bottom-end';
  const leftStart = isRTL ? 'right-start' : 'left-start';
  const leftEnd = isRTL ? 'right-end' : 'left-end';
  const rightStart = isRTL ? 'left-start' : 'right-start';
  const rightEnd = isRTL ? 'left-end' : 'right-end';
  let placement: Placement = alignEnd ? bottomEnd : bottomStart;
  if (dropDirection === 'up') placement = alignEnd ? topEnd : topStart;
  else if (dropDirection === 'end')
    placement = alignEnd ? rightEnd : rightStart;
  else if (dropDirection === 'start')
    placement = alignEnd ? leftEnd : leftStart;
  return placement;
}

export const Menu: BsRefComponent<'div', MenuProps> = React.forwardRef<
  HTMLElement,
  MenuProps
>(
  (
    {
      bsPrefix,
      className,
      align,
      rootCloseEvent,
      flip,
      show: showProps,
      renderOnMount,
      as: Component = 'div',
      popperConfig,
      variant,
      ...ps
    },
    ref,
  ) => {
    let alignEnd = false;
    const isNavbar = useContext(NavbarContext);
    const bs = useBsPrefix(bsPrefix, 'dropdown-menu');
    const { align: contextAlign, drop, isRTL } = useContext(Context);
    align = align || contextAlign;
    const isInputGroup = useContext(InputGroupContext);
    const alignClasses: string[] = [];
    if (align) {
      if (typeof align === 'object') {
        const keys = Object.keys(align);
        warning(
          keys.length === 1,
          'There should only be 1 breakpoint when passing an object to `align`',
        );
        if (keys.length) {
          const brkPoint = keys[0];
          const direction: AlignDirection = align[brkPoint];
          alignEnd = direction === 'start';
          alignClasses.push(`${bs}-${brkPoint}-${direction}`);
        }
      } else if (align === 'end') {
        alignEnd = true;
      }
    }
    const placement = getMenuPlacement(alignEnd, drop, isRTL);
    const [menuProps, { hasShown, popper, show, toggle }] = useDropdownMenu({
      flip,
      rootCloseEvent,
      show: showProps,
      usePopper: !isNavbar && alignClasses.length === 0,
      offset: [0, 2],
      popperConfig,
      placement,
    });
    menuProps.ref = useMergedRefs(
      useWrappedRefWithWarning(ref, 'DropdownMenu'),
      menuProps.ref,
    );

    useIsomorphicEffect(() => {
      if (show) popper?.update();
    }, [show]);

    if (!hasShown && !renderOnMount && !isInputGroup) return null;
    if (typeof Component !== 'string') {
      menuProps.show = show;
      menuProps.close = () => toggle?.(false);
      menuProps.align = align;
    }
    let style = ps.style;
    if (popper?.placement) {
      style = { ...ps.style, ...menuProps.style };
      ps['x-placement'] = popper.placement;
    }
    return (
      <Component
        {...ps}
        {...menuProps}
        style={style}
        {...((alignClasses.length || isNavbar) && {
          'data-bs-popper': 'static',
        })}
        className={classNames(
          className,
          bs,
          show && 'show',
          alignEnd && `${bs}-end`,
          variant && `${bs}-${variant}`,
          ...alignClasses,
        )}
      />
    );
  },
);

Menu.displayName = 'DropdownMenu';
Menu.defaultProps = {
  flip: true,
};

export interface ToggleProps extends Omit<_BProps, 'as'> {
  as?: React.ElementType;
  split?: boolean;
  childBsPrefix?: string;
}

type ToggleComponent = BsRefComponent<'button', ToggleProps>;

export type PropsFromToggle = Partial<
  Pick<React.ComponentPropsWithRef<ToggleComponent>, CommonProps>
>;

export const Toggle: ToggleComponent = React.forwardRef(
  (
    {
      bsPrefix,
      split,
      className,
      childBsPrefix,
      as: Component = _Button,
      ...ps
    }: ToggleProps,
    ref,
  ) => {
    const bs = useBsPrefix(bsPrefix, 'dropdown-toggle');
    const context = useContext(Context);
    const isInputGroup = useContext(InputGroupContext);
    if (childBsPrefix !== undefined) {
      (ps as any).bsPrefix = childBsPrefix;
    }
    const [toggleProps] = useDropdownToggle();
    toggleProps.ref = useMergedRefs(
      toggleProps.ref,
      useWrappedRefWithWarning(ref, 'DropdownToggle'),
    );
    return (
      <Component
        className={classNames(
          className,
          bs,
          split && `${bs}-split`,
          !!isInputGroup && context?.show && 'show',
        )}
        {...toggleProps}
        {...ps}
      />
    );
  },
);

Toggle.displayName = 'DropdownToggle';

const Header = withBsPrefix('dropdown-header', {
  defaultProps: { role: 'heading' },
});
const Divider = withBsPrefix('dropdown-divider', {
  Component: 'hr',
  defaultProps: { role: 'separator' },
});
const ItemText = withBsPrefix('dropdown-item-text', {
  Component: 'span',
});

export interface ItemProps extends BaseDropdownItemProps, BsProps {}

export const Item: BsRefComponent<typeof BaseDropdownItem, ItemProps> =
  React.forwardRef(
    (
      {
        bsPrefix,
        className,
        eventKey,
        disabled = false,
        onClick,
        active,
        as: Component = Anchor,
        ...ps
      },
      ref,
    ) => {
      const bs = useBsPrefix(bsPrefix, 'dropdown-item');
      const [dropdownItemProps, meta] = useDropdownItem({
        key: eventKey,
        href: ps.href,
        disabled,
        onClick,
        active,
      });

      return (
        <Component
          {...ps}
          {...dropdownItemProps}
          ref={ref}
          className={classNames(
            className,
            bs,
            meta.isActive && 'active',
            disabled && 'disabled',
          )}
        />
      );
    },
  );

Item.displayName = 'DropdownItem';

export interface Props
  extends _Props,
    BsProps,
    Omit<React.HTMLAttributes<HTMLElement>, 'onSelect' | 'children'> {
  drop?: Drop;
  align?: AlignType;
  focusFirstItemOnShow?: boolean | 'keyboard';
  navbar?: boolean;
  autoClose?: boolean | 'outside' | 'inside';
}

export const Dropdown: BsRefComponent<'div', Props> = React.forwardRef<
  HTMLElement,
  Props
>((xs, ref) => {
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
  const bs = useBsPrefix(bsPrefix, 'dropdown');
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
  const placement = getMenuPlacement(alignEnd, drop, isRTL);
  const contextValue = useMemo(
    () => ({
      align,
      drop,
      isRTL,
    }),
    [align, drop, isRTL],
  );
  return (
    <Context.Provider value={contextValue}>
      <BaseDropdown
        placement={placement}
        show={show}
        onSelect={onSelect}
        onToggle={handleToggle}
        focusFirstItemOnShow={focusFirstItemOnShow}
        itemSelector={`.${bs}-item:not(.disabled):not(:disabled)`}
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
              (!drop || drop === 'down') && bs,
              drop === 'up' && 'dropup',
              drop === 'end' && 'dropend',
              drop === 'start' && 'dropstart',
            )}
          />
        )}
      </BaseDropdown>
    </Context.Provider>
  );
});

Dropdown.displayName = 'Dropdown';
Dropdown.defaultProps = {
  navbar: false,
  align: 'start',
  autoClose: true,
};

Object.assign(Dropdown, {
  Toggle,
  Menu,
  Item,
  ItemText,
  Divider,
  Header,
});

export interface ButtonProps
  extends Omit<Props, 'title'>,
    PropsFromToggle,
    BsProps {
  title: React.ReactNode;
  menuRole?: string;
  renderMenuOnMount?: boolean;
  rootCloseEvent?: 'click' | 'mousedown';
  menuVariant?: Variant;
  flip?: boolean;
}

export const Button: BsRefComponent<'div', ButtonProps> = React.forwardRef<
  HTMLDivElement,
  ButtonProps
>(
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
      <Toggle
        id={id}
        href={href}
        size={size}
        variant={variant}
        disabled={disabled}
        childBsPrefix={bsPrefix}
      >
        {title}
      </Toggle>
      <Menu
        role={menuRole}
        renderOnMount={renderMenuOnMount}
        rootCloseEvent={rootCloseEvent}
        variant={menuVariant}
        flip={flip}
      >
        {children}
      </Menu>
    </Dropdown>
  ),
);
Button.displayName = 'DropdownButton';

export interface NavProps extends Omit<Props, 'title'> {
  title: React.ReactNode;
  disabled?: boolean;
  active?: boolean;
  menuRole?: string;
  renderMenuOnMount?: boolean;
  rootCloseEvent?: 'click' | 'mousedown';
  menuVariant?: Variant;
}

export const Nav: BsRefComponent<'div', NavProps> = React.forwardRef(
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
    }: NavProps,
    ref,
  ) => {
    const navItemPrefix = useBsPrefix(undefined, 'nav-item');
    return (
      <Dropdown
        ref={ref}
        {...ps}
        className={classNames(className, navItemPrefix)}
      >
        <Toggle
          id={id}
          eventKey={null}
          active={active}
          disabled={disabled}
          childBsPrefix={bsPrefix}
          as={NavLink}
        >
          {title}
        </Toggle>
        <Menu
          role={menuRole}
          renderOnMount={renderMenuOnMount}
          rootCloseEvent={rootCloseEvent}
          variant={menuVariant}
        >
          {children}
        </Menu>
      </Dropdown>
    );
  },
);

Nav.displayName = 'NavDropdown';

Object.assign(Nav, {
  Item,
  ItemText,
  Divider,
  Header,
});
