import classNames from 'classnames';
import * as React from 'react';
import { useCallback, useContext, useMemo } from 'react';
import SelectableContext from '@restart/ui/SelectableContext';
import { SelectCallback } from '@restart/ui/types';
import { useUncontrolled } from 'uncontrollable';
import useEventCallback from '@restart/hooks/useEventCallback';
import { withBs } from './utils';
import { Collapse as CBase, Props as _CProps } from './Collapse';
import { useBsPrefix } from './Theme';
import { BsProps, BsRefComp } from './helpers';
import { Offcanvas as OBase, Props as _OProps } from './Offcanvas';

export interface Data {
  onToggle: () => void;
  bsPrefix?: string;
  expanded: boolean;
  expand?: boolean | string | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
}

export const Context = React.createContext<Data | null>(null);
Context.displayName = 'NavbarContext';

export const Text = withBs('navbar-text', {
  Component: 'span',
});

export interface BrandProps extends BsProps, React.HTMLAttributes<HTMLElement> {
  href?: string;
}

export const Brand: BsRefComp<'a', BrandProps> = React.forwardRef<
  HTMLElement,
  BrandProps
>(({ bsPrefix, className, as, ...ps }, ref) => {
  const bs = useBsPrefix(bsPrefix, 'navbar-brand');
  const X = as || (ps.href ? 'a' : 'span');
  return <X {...ps} ref={ref} className={classNames(className, bs)} />;
});

Brand.displayName = 'NavbarBrand';

export interface CollapseProps
  extends Omit<_CProps, 'children'>,
    React.HTMLAttributes<HTMLDivElement>,
    BsProps {}

export const Collapse = React.forwardRef<HTMLDivElement, CollapseProps>(
  ({ children, bsPrefix, ...ps }, ref) => {
    const bs = useBsPrefix(bsPrefix, 'navbar-collapse');
    const context = useContext(Context);
    return (
      <CBase in={!!(context && context.expanded)} {...ps}>
        <div ref={ref} className={bs}>
          {children}
        </div>
      </CBase>
    );
  },
);

Collapse.displayName = 'NavbarCollapse';

export type OffcanvasProps = Omit<_OProps, 'show'>;

export const Offcanvas = React.forwardRef<HTMLDivElement, OffcanvasProps>(
  (ps, ref) => {
    const context = useContext(Context);
    return (
      <OBase ref={ref} show={!!context?.expanded} {...ps} renderStaticNode />
    );
  },
);
Offcanvas.displayName = 'NavbarOffcanvas';

export interface ToggleProps
  extends BsProps,
    React.HTMLAttributes<HTMLElement> {
  label?: string;
}

export const Toggle: BsRefComp<'button', ToggleProps> = React.forwardRef<
  HTMLElement,
  ToggleProps
>(
  (
    { bsPrefix, className, children, label, as: X = 'button', onClick, ...ps },
    ref,
  ) => {
    const bs = useBsPrefix(bsPrefix, 'navbar-toggler');
    const { onToggle, expanded } = useContext(Context) || {};
    const clickCB = useEventCallback((e) => {
      if (onClick) onClick(e);
      if (onToggle) onToggle();
    });
    if (X === 'button') {
      (ps as any).type = 'button';
    }
    return (
      <X
        {...ps}
        ref={ref}
        onClick={clickCB}
        aria-label={label}
        className={classNames(className, bs, !expanded && 'collapsed')}
      >
        {children || <span className={`${bs}-icon`} />}
      </X>
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

export const Navbar: BsRefComp<'nav', Props> = React.forwardRef<
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
    as: X = 'nav',
    expanded,
    onToggle,
    onSelect,
    collapseOnSelect,
    ...ps
  } = useUncontrolled(xs, {
    expanded: 'onToggle',
  });
  const bsPrefix = useBsPrefix(initialBsPrefix, 'navbar');
  const handleCollapse = useCallback<SelectCallback>(
    (...args) => {
      onSelect?.(...args);
      if (collapseOnSelect && expanded) {
        onToggle?.(false);
      }
    },
    [onSelect, collapseOnSelect, expanded, onToggle],
  );
  if (ps.role === undefined && X !== 'nav') {
    ps.role = 'navigation';
  }
  let expandClass = `${bsPrefix}-expand`;
  if (typeof expand === 'string') expandClass = `${expandClass}-${expand}`;
  const navbarContext = useMemo<Data>(
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
        <X
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
