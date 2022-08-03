import classNames from 'classnames';
import * as React from 'react';
import { useBsPrefix } from './ThemeProvider';
import { BsProps, BsRefComponent } from './helpers';
import { Variant } from './types';

export interface Props extends React.HTMLAttributes<HTMLElement>, BsProps {
  animation: 'border' | 'grow';
  size?: 'sm';
  variant?: Variant;
}

export const Spinner: BsRefComponent<'div', Props> = React.forwardRef<
  HTMLElement,
  Props
>(
  (
    {
      bsPrefix,
      variant,
      animation,
      size,
      as: Component = 'div',
      className,
      ...ps
    },
    ref,
  ) => {
    const bs = useBsPrefix(bsPrefix, 'spinner');
    const bsSpinnerPrefix = `${bs}-${animation}`;
    return (
      <Component
        ref={ref}
        {...ps}
        className={classNames(
          className,
          bsSpinnerPrefix,
          size && `${bsSpinnerPrefix}-${size}`,
          variant && `text-${variant}`,
        )}
      />
    );
  },
);
Spinner.displayName = 'Spinner';
