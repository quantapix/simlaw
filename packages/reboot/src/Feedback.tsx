import classNames from 'classnames';
import * as React from 'react';
import { AsProp, BsRefComp } from './helpers';

export type Type = 'valid' | 'invalid';

export interface Props extends AsProp, React.HTMLAttributes<HTMLElement> {
  bsPrefix?: never;
  type?: Type;
  tooltip?: boolean;
}

export const Feedback: BsRefComp<'div', Props> = React.forwardRef(
  (
    { as: X = 'div', className, type = 'valid', tooltip = false, ...ps },
    ref,
  ) => (
    <X
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
