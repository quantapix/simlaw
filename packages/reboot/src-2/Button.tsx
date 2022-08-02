import classNames from 'classnames';
import * as React from 'react';
import {
  useButtonProps,
  ButtonProps as BaseButtonProps,
} from '@restart/ui/Button';
import { useBootstrapPrefix } from './ThemeProvider';
import { BsProps, BsPrefixRefForwardingComponent } from './helpers';
import { ButtonVariant } from './types';

export interface Props extends BaseButtonProps, Omit<BsProps, 'as'> {
  active?: boolean;
  variant?: ButtonVariant;
  size?: 'sm' | 'lg';
}

export type CommonButtonProps = 'href' | 'size' | 'variant' | 'disabled';

export const Button: BsPrefixRefForwardingComponent<'button', Props> =
  React.forwardRef<HTMLButtonElement, Props>(
    ({ as, bsPrefix, variant, size, active, className, ...props }, ref) => {
      const prefix = useBootstrapPrefix(bsPrefix, 'btn');
      const [buttonProps, { tagName }] = useButtonProps({
        tagName: as,
        ...props,
      });

      const Component = tagName as React.ElementType;

      return (
        <Component
          {...buttonProps}
          {...props}
          ref={ref}
          className={classNames(
            className,
            prefix,
            active && 'active',
            variant && `${prefix}-${variant}`,
            size && `${prefix}-${size}`,
            props.href && props.disabled && 'disabled',
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
