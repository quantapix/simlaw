import classNames from 'classnames';
import * as React from 'react';
import { useBootstrapPrefix } from './ThemeProvider';
import { BsProps, BsPrefixRefForwardingComponent } from './helpers';
import { Color, Variant } from './types';

export interface Props extends BsProps, React.HTMLAttributes<HTMLElement> {
  bg?: Variant;
  pill?: boolean;
  text?: Color;
}

export const Badge: BsPrefixRefForwardingComponent<'span', Props> =
  React.forwardRef<HTMLElement, Props>(
    (
      { bsPrefix, bg, pill, text, className, as: Component = 'span', ...ps },
      ref,
    ) => {
      const bs = useBootstrapPrefix(bsPrefix, 'badge');
      return (
        <Component
          ref={ref}
          {...ps}
          className={classNames(
            className,
            bs,
            pill && `rounded-pill`,
            text && `text-${text}`,
            bg && `bg-${bg}`,
          )}
        />
      );
    },
  );

Badge.displayName = 'Badge';
Badge.defaultProps = {
  bg: 'primary',
  pill: false,
};
