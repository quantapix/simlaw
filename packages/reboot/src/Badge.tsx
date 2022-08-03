import classNames from 'classnames';
import * as React from 'react';
import { useBsPrefix } from './Theme';
import { BsProps, BsRefComponent } from './helpers';
import { Color, Variant } from './types';

export interface Props extends BsProps, React.HTMLAttributes<HTMLElement> {
  bg?: Variant;
  pill?: boolean;
  text?: Color;
}

export const Badge: BsRefComponent<'span', Props> = React.forwardRef<
  HTMLElement,
  Props
>(
  (
    { bsPrefix, bg, pill, text, className, as: Component = 'span', ...ps },
    ref,
  ) => {
    const bs = useBsPrefix(bsPrefix, 'badge');
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
