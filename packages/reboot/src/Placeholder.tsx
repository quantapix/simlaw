import * as React from 'react';
import { BsProps, BsRefComponent } from './helpers';
import { usePlaceholder, Props as _Props } from './use';
import { Button as B } from './Button';
import { ButtonVariant } from './types';

export interface ButtonProps extends Props {
  variant?: ButtonVariant;
}

export const Button: BsRefComponent<'button', ButtonProps> = React.forwardRef<
  HTMLButtonElement,
  ButtonProps
>((xs, ref) => {
  const ps = usePlaceholder(xs);
  return <B {...ps} ref={ref} disabled tabIndex={-1} />;
});

Button.displayName = 'PlaceholderButton';

export interface Props extends _Props, BsProps {}

export const Placeholder: BsRefComponent<'span', Props> = React.forwardRef<
  HTMLElement,
  Props
>(({ as: X = 'span', ...xs }, ref) => {
  const ps = usePlaceholder(xs);
  return <X {...ps} ref={ref} />;
});
Placeholder.displayName = 'Placeholder';
