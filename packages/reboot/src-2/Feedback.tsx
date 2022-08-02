import classNames from 'classnames';
import * as React from 'react';
import { AsProp, BsPrefixRefForwardingComponent } from './helpers';

export type FeedbackType = 'valid' | 'invalid';

export interface FeedbackProps
  extends AsProp,
    React.HTMLAttributes<HTMLElement> {
  // I think this is because we use BsPrefixRefForwardingComponent below
  // which includes bsPrefix.
  bsPrefix?: never;
  type?: FeedbackType;
  tooltip?: boolean;
}

const Feedback: BsPrefixRefForwardingComponent<'div', FeedbackProps> =
  React.forwardRef(
    // Need to define the default "as" during prop destructuring to be compatible with styled-components github.com/react-bootstrap/react-bootstrap/issues/3595
    (
      {
        as: Component = 'div',
        className,
        type = 'valid',
        tooltip = false,
        ...props
      },
      ref,
    ) => (
      <Component
        {...props}
        ref={ref}
        className={classNames(
          className,
          `${type}-${tooltip ? 'tooltip' : 'feedback'}`,
        )}
      />
    ),
  );

Feedback.displayName = 'Feedback';

export default Feedback;
