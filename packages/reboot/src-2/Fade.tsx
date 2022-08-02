import classNames from 'classnames';
import * as React from 'react';
import { useCallback } from 'react';
import Transition, {
  TransitionStatus,
  ENTERED,
  ENTERING,
} from 'react-transition-group/Transition';
import { TransitionCallbacks } from '@restart/ui/types';
import transitionEndListener from './transitionEndListener';
import triggerBrowserReflow from './triggerBrowserReflow';
import TransitionWrapper from './TransitionWrapper';

export interface Props extends TransitionCallbacks {
  className?: string;
  in?: boolean;
  mountOnEnter?: boolean;
  unmountOnExit?: boolean;
  appear?: boolean;
  timeout?: number;
  children: React.ReactElement;
  transitionClasses?: Record<string, string>;
}

const fadeStyles = {
  [ENTERING]: 'show',
  [ENTERED]: 'show',
};

export const Fade = React.forwardRef<Transition<any>, Props>(
  ({ className, children, transitionClasses = {}, ...ps }, ref) => {
    const handleEnter = useCallback(
      (node, isAppearing) => {
        triggerBrowserReflow(node);
        ps.onEnter?.(node, isAppearing);
      },
      [ps],
    );
    return (
      <TransitionWrapper
        ref={ref}
        addEndListener={transitionEndListener}
        {...ps}
        onEnter={handleEnter}
        childRef={(children as any).ref}
      >
        {(status: TransitionStatus, innerProps: Record<string, unknown>) =>
          React.cloneElement(children, {
            ...innerProps,
            className: classNames(
              'fade',
              className,
              children.props.className,
              fadeStyles[status],
              transitionClasses[status],
            ),
          })
        }
      </TransitionWrapper>
    );
  },
);

Fade.displayName = 'Fade';
Fade.defaultProps = {
  in: false,
  timeout: 300,
  mountOnEnter: false,
  unmountOnExit: false,
  appear: false,
};
