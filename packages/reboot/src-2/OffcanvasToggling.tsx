import classNames from 'classnames';
import * as React from 'react';
import Transition, {
  TransitionStatus,
  ENTERED,
  ENTERING,
  EXITING,
} from 'react-transition-group/Transition';
import { TransitionCallbacks } from '@restart/ui/types';
import transitionEndListener from './transitionEndListener';
import { BsOnlyProps } from './helpers';
import TransitionWrapper from './TransitionWrapper';
import { useBootstrapPrefix } from './ThemeProvider';

export interface Props extends TransitionCallbacks, BsOnlyProps {
  className?: string;
  in?: boolean;
  mountOnEnter?: boolean;
  unmountOnExit?: boolean;
  appear?: boolean;
  timeout?: number;
  children: React.ReactElement;
}

const transitionStyles = {
  [ENTERING]: 'show',
  [ENTERED]: 'show',
};

export const OffcanvasToggling = React.forwardRef<Transition<any>, Props>(
  ({ bsPrefix, className, children, ...ps }, ref) => {
    bsPrefix = useBootstrapPrefix(bsPrefix, 'offcanvas');
    return (
      <TransitionWrapper
        ref={ref}
        addEndListener={transitionEndListener}
        {...ps}
        childRef={(children as any).ref}
      >
        {(status: TransitionStatus, innerProps: Record<string, unknown>) =>
          React.cloneElement(children, {
            ...innerProps,
            className: classNames(
              className,
              children.props.className,
              (status === ENTERING || status === EXITING) &&
                `${bsPrefix}-toggling`,
              transitionStyles[status],
            ),
          })
        }
      </TransitionWrapper>
    );
  },
);

OffcanvasToggling.displayName = 'OffcanvasToggling';
OffcanvasToggling.defaultProps = {
  in: false,
  mountOnEnter: false,
  unmountOnExit: false,
  appear: false,
};
