import classNames from 'classnames';
import * as React from 'react';
import { useCallback, useContext, useMemo } from 'react';
import SelectableContext from '@restart/ui/SelectableContext';
import { SelectCallback } from '@restart/ui/types';
import { useUncontrolled } from 'uncontrollable';
import useEventCallback from '@restart/hooks/useEventCallback';
import createWithBsPrefix from './createWithBsPrefix';
import { Collapse as Base, Props as _Props } from './Collapse';
import { useBootstrapPrefix } from './ThemeProvider';
import { BsProps, BsRefComponent } from './helpers';
import { Offcanvas, Props as _Props } from './Offcanvas';

export interface ContextType {
  onToggle: () => void;
  bsPrefix?: string;
  expanded: boolean;
  expand?: boolean | string | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
}

export const Context = React.createContext<ContextType | null>(null);
Context.displayName = 'NavbarContext';

export const Text = createWithBsPrefix('navbar-text', {
  Component: 'span',
});

export interface BrandProps extends BsProps, React.HTMLAttributes<HTMLElement> {
  href?: string;
}

export const Brand: BsRefComponent<'a', BrandProps> = React.forwardRef<
  HTMLElement,
  BrandProps
>(({ bsPrefix, className, as, ...ps }, ref) => {
  const bs = useBootstrapPrefix(bsPrefix, 'navbar-brand');
  const Component = as || (ps.href ? 'a' : 'span');
  return <Component {...ps} ref={ref} className={classNames(className, bs)} />;
});

Brand.displayName = 'NavbarBrand';

export interface CollapseProps
  extends Omit<_Props, 'children'>,
    React.HTMLAttributes<HTMLDivElement>,
    BsProps {}

export const Collapse = React.forwardRef<HTMLDivElement, CollapseProps>(
  ({ children, bsPrefix, ...ps }, ref) => {
    const bs = useBootstrapPrefix(bsPrefix, 'navbar-collapse');
    const context = useContext(Context);
    return (
      <Base in={!!(context && context.expanded)} {...ps}>
        <div ref={ref} className={bs}>
          {children}
        </div>
      </Base>
    );
  },
);

Collapse.displayName = 'NavbarCollapse';

export type OffcanvasProps = Omit<_Props, 'show'>;

export const NavbarOffcanvas = React.forwardRef<HTMLDivElement, OffcanvasProps>(
  (ps, ref) => {
    const context = useContext(Context);
    return (
      <Offcanvas
        ref={ref}
        show={!!context?.expanded}
        {...ps}
        renderStaticNode
      />
    );
  },
);
NavbarOffcanvas.displayName = 'NavbarOffcanvas';

export interface ToggleProps
  extends BsProps,
    React.HTMLAttributes<HTMLElement> {
  label?: string;
}

export const Toggle: BsRefComponent<'button', ToggleProps> = React.forwardRef<
  HTMLElement,
  ToggleProps
>(
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
    const bs = useBootstrapPrefix(bsPrefix, 'navbar-toggler');
    const { onToggle, expanded } = useContext(Context) || {};
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
        className={classNames(className, bs, !expanded && 'collapsed')}
      >
        {children || <span className={`${bs}-icon`} />}
      </Component>
    );
  },
);

Toggle.displayName = 'NavbarToggle';
Toggle.defaultProps = {
  label: 'Toggle navigation',
};

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

export const Navbar: BsRefComponent<'nav', Props> = React.forwardRef<
  HTMLElement,
  Props
>((xs, ref) => {
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
    <Context.Provider value={navbarContext}>
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
    </Context.Provider>
  );
});

Navbar.displayName = 'Navbar';
Navbar.defaultProps = {
  expand: true,
  variant: 'light' as const,
  collapseOnSelect: false,
};

Object.assign(Navbar, {
  Brand,
  Collapse,
  Offcanvas: NavbarOffcanvas,
  Text,
  Toggle,
});
