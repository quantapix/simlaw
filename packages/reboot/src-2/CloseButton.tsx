import * as React from 'react';
import classNames from 'classnames';

export type Variant = 'white' | string;

export interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export const CloseButton = React.forwardRef<HTMLButtonElement, Props>(
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

CloseButton.displayName = 'CloseButton';
CloseButton.defaultProps = {
  'aria-label': 'Close',
};
