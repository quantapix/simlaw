import classNames from 'classnames';
import * as React from 'react';
import { useButtonProps, ButtonProps as _Props } from '@restart/ui/Button';
import { useBootstrapPrefix } from './ThemeProvider';
import { BsProps, BsPrefixRefForwardingComponent } from './helpers';
import { ButtonVariant } from './types';

export interface Props extends _Props, Omit<BsProps, 'as'> {
  active?: boolean;
  variant?: ButtonVariant;
  size?: 'sm' | 'lg';
}

export type CommonProps = 'href' | 'size' | 'variant' | 'disabled';

export const Button: BsPrefixRefForwardingComponent<'button', Props> =
  React.forwardRef<HTMLButtonElement, Props>(
    ({ as, bsPrefix, variant, size, active, className, ...ps }, ref) => {
      const prefix = useBootstrapPrefix(bsPrefix, 'btn');
      const [buttonProps, { tagName }] = useButtonProps({
        tagName: as,
        ...ps,
      });
      const Component = tagName as React.ElementType;
      return (
        <Component
          {...buttonProps}
          {...ps}
          ref={ref}
          className={classNames(
            className,
            prefix,
            active && 'active',
            variant && `${prefix}-${variant}`,
            size && `${prefix}-${size}`,
            ps.href && ps.disabled && 'disabled',
          )}
        />
      );
    },
  );

Button.displayName = 'Button';
Button.defaultProps = {
  variant: 'primary',
  active: false,
  disabled: false,
};

export type Variant = 'white' | string;

export interface CloseProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export const Close = React.forwardRef<HTMLButtonElement, CloseProps>(
  ({ className, variant, ...ps }, ref) => (
    <button
      ref={ref}
      type="button"
      className={classNames(
        'btn-close',
        variant && `btn-close-${variant}`,
        className,
      )}
      {...ps}
    />
  ),
);

Close.displayName = 'CloseButton';
Close.defaultProps = {
  'aria-label': 'Close',
};

export interface GroupProps extends BsProps, React.HTMLAttributes<HTMLElement> {
  size?: 'sm' | 'lg';
  vertical?: boolean;
}

export const Group: BsPrefixRefForwardingComponent<'div', GroupProps> =
  React.forwardRef(
    (
      {
        bsPrefix,
        size,
        vertical,
        className,
        as: Component = 'div',
        ...ps
      }: GroupProps,
      ref,
    ) => {
      const bs = useBootstrapPrefix(bsPrefix, 'btn-group');
      let base = bs;
      if (vertical) base = `${bs}-vertical`;
      return (
        <Component
          {...ps}
          ref={ref}
          className={classNames(className, base, size && `${bs}-${size}`)}
        />
      );
    },
  );

Group.displayName = 'ButtonGroup';
Group.defaultProps = {
  vertical: false,
  role: 'group',
};

export interface ToolbarProps
  extends BsProps,
    React.HTMLAttributes<HTMLElement> {}

export const Toolbar = React.forwardRef<HTMLDivElement, ToolbarProps>(
  ({ bsPrefix, className, ...ps }, ref) => {
    const bs = useBootstrapPrefix(bsPrefix, 'btn-toolbar');
    return <div {...ps} ref={ref} className={classNames(className, bs)} />;
  },
);

Toolbar.displayName = 'ButtonToolbar';
Toolbar.defaultProps = {
  role: 'toolbar',
};
