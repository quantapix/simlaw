import classNames from 'classnames';
import * as React from 'react';

import { useBootstrapPrefix } from './ThemeProvider';
import { BsProps, BsRefComponent } from './helpers';
import { Variant } from './types';

export interface SpinnerProps
  extends React.HTMLAttributes<HTMLElement>,
    BsProps {
  animation: 'border' | 'grow';
  size?: 'sm';
  variant?: Variant;
}

const Spinner: BsRefComponent<'div', SpinnerProps> = React.forwardRef<
  HTMLElement,
  SpinnerProps
>(
  (
    {
      bsPrefix,
      variant,
      animation,
      size,
      // Need to define the default "as" during prop destructuring to be compatible with styled-components github.com/react-bootstrap/react-bootstrap/issues/3595
      as: Component = 'div',
      className,
      ...props
    },
    ref,
  ) => {
    bsPrefix = useBootstrapPrefix(bsPrefix, 'spinner');
    const bsSpinnerPrefix = `${bsPrefix}-${animation}`;

    return (
      <Component
        ref={ref}
        {...props}
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

export default Spinner;
