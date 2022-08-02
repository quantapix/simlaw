import * as React from 'react';
import { BsProps, BsPrefixRefForwardingComponent } from './helpers';
import usePlaceholder, { UsePlaceholderProps } from './usePlaceholder';
import { Button } from './Button';
import { ButtonVariant } from './types';

export interface ButtonProps extends UsePlaceholderProps {
  variant?: ButtonVariant;
}

export const PlaceholderButton: BsPrefixRefForwardingComponent<
  'button',
  ButtonProps
> = React.forwardRef<HTMLButtonElement, ButtonProps>((xs, ref) => {
  const ps = usePlaceholder(xs);
  return <Button {...ps} ref={ref} disabled tabIndex={-1} />;
});

PlaceholderButton.displayName = 'PlaceholderButton';

export interface Props extends UsePlaceholderProps, BsProps {}

export const Placeholder: BsPrefixRefForwardingComponent<'span', Props> =
  React.forwardRef<HTMLElement, Props>(
    ({ as: Component = 'span', ...xs }, ref) => {
      const ps = usePlaceholder(xs);
      return <Component {...ps} ref={ref} />;
    },
  );

Placeholder.displayName = 'Placeholder';

Object.assign(Placeholder, {
  Button: PlaceholderButton,
});
