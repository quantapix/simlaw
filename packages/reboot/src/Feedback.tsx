import classNames from 'classnames';
import * as React from 'react';
import { AsProp, BsRefComponent } from './helpers';

export type Type = 'valid' | 'invalid';

export interface Props extends AsProp, React.HTMLAttributes<HTMLElement> {
  bsPrefix?: never;
  type?: Type;
  tooltip?: boolean;
}

export const Feedback: BsRefComponent<'div', Props> = React.forwardRef(
  (
    {
      as: Component = 'div',
      className,
      type = 'valid',
      tooltip = false,
      ...ps
    },
    ref,
  ) => (
    <Component
      {...ps}
      ref={ref}
      className={classNames(
        className,
        `${type}-${tooltip ? 'tooltip' : 'feedback'}`,
      )}
    />
  ),
);

Feedback.displayName = 'Feedback';
