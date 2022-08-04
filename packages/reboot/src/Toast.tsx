import classNames from 'classnames';
import * as React from 'react';
import { useContext, useEffect, useMemo, useRef, useCallback } from 'react';
import useTimeout from '@restart/hooks/useTimeout';
import { TransitionComponent } from '@restart/ui/types';
import Transition, {
  ENTERING,
  EXITING,
} from 'react-transition-group/Transition';
import useEventCallback from '@restart/hooks/useEventCallback';
import { useBs } from './Theme';
import { BsOnlyProps, BsProps, BsRefComp } from './helpers';
import { Variant } from './types';
import { Fade, Props as _Props } from './Fade';
import { Close, Variant as CloseVariant } from './Button';
import { withBs } from './utils';

export interface Data {
  onClose?: (e?: React.MouseEvent | React.KeyboardEvent) => void;
}

export const Context = React.createContext<Data>({
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onClose() {},
});

export interface HeaderProps
  extends BsOnlyProps,
    React.HTMLAttributes<HTMLDivElement> {
  closeLabel?: string;
  closeVariant?: CloseVariant;
  closeButton?: boolean;
}

export const Header = React.forwardRef<HTMLDivElement, HeaderProps>(
  (
    {
      bsPrefix,
      closeLabel,
      closeVariant,
      closeButton,
      className,
      children,
      ...ps
    }: HeaderProps,
    ref,
  ) => {
    bsPrefix = useBs(bsPrefix, 'toast-header');
    const context = useContext(Context);
    const click = useEventCallback((e) => {
      context?.onClose?.(e);
    });
    return (
      <div ref={ref} {...ps} className={classNames(bsPrefix, className)}>
        {children}
        {closeButton && (
          <Close
            aria-label={closeLabel}
            variant={closeVariant}
            onClick={click}
            data-dismiss="toast"
          />
        )}
      </div>
    );
  },
);
Header.displayName = 'ToastHeader';
Header.defaultProps = {
  closeLabel: 'Close',
  closeButton: true,
};

export const Body = withBs('toast-body');

const styles = {
  [ENTERING]: 'showing',
  [EXITING]: 'showing show',
};

export const ToastFade = React.forwardRef<Transition<any>, _Props>(
  (ps, ref) => <Fade {...ps} ref={ref} transitionClasses={styles} />,
);
ToastFade.displayName = 'ToastFade';

export interface Props extends BsProps, React.HTMLAttributes<HTMLElement> {
  animation?: boolean;
  autohide?: boolean;
  delay?: number;
  onClose?: (e?: React.MouseEvent | React.KeyboardEvent) => void;
  show?: boolean;
  transition?: TransitionComponent;
  bg?: Variant;
}

export const Toast: BsRefComp<'div', Props> = React.forwardRef<
  HTMLDivElement,
  Props
>(
  (
    {
      bsPrefix,
      className,
      transition: X = ToastFade,
      show = true,
      animation = true,
      delay = 5000,
      autohide = false,
      onClose,
      bg,
      ...ps
    },
    ref,
  ) => {
    bsPrefix = useBs(bsPrefix, 'toast');
    const delayRef = useRef(delay);
    const onCloseRef = useRef(onClose);

    useEffect(() => {
      delayRef.current = delay;
      onCloseRef.current = onClose;
    }, [delay, onClose]);

    const autohideTimeout = useTimeout();
    const autohideToast = !!(autohide && show);

    const autohideFunc = useCallback(() => {
      if (autohideToast) {
        onCloseRef.current?.();
      }
    }, [autohideToast]);

    useEffect(() => {
      autohideTimeout.set(autohideFunc, delayRef.current);
    }, [autohideTimeout, autohideFunc]);

    const v = useMemo(
      () => ({
        onClose,
      }),
      [onClose],
    );
    const hasAnimation = !!(X && animation);
    const toast = (
      <div
        {...ps}
        ref={ref}
        className={classNames(
          bsPrefix,
          className,
          bg && `bg-${bg}`,
          !hasAnimation && (show ? 'show' : 'hide'),
        )}
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
      />
    );
    return (
      <Context.Provider value={v}>
        {hasAnimation && X ? (
          <X in={show} unmountOnExit>
            {toast}
          </X>
        ) : (
          toast
        )}
      </Context.Provider>
    );
  },
);
Toast.displayName = 'Toast';

export type Position =
  | 'top-start'
  | 'top-center'
  | 'top-end'
  | 'middle-start'
  | 'middle-center'
  | 'middle-end'
  | 'bottom-start'
  | 'bottom-center'
  | 'bottom-end';

export interface ContainerProps
  extends BsProps,
    React.HTMLAttributes<HTMLElement> {
  position?: Position;
  containerPosition?: string;
}

const positionClasses = {
  'top-start': 'top-0 start-0',
  'top-center': 'top-0 start-50 translate-middle-x',
  'top-end': 'top-0 end-0',
  'middle-start': 'top-50 start-0 translate-middle-y',
  'middle-center': 'top-50 start-50 translate-middle',
  'middle-end': 'top-50 end-0 translate-middle-y',
  'bottom-start': 'bottom-0 start-0',
  'bottom-center': 'bottom-0 start-50 translate-middle-x',
  'bottom-end': 'bottom-0 end-0',
};

export const Container: BsRefComp<'div', ContainerProps> = React.forwardRef<
  HTMLDivElement,
  ContainerProps
>(
  (
    {
      bsPrefix,
      position,
      containerPosition = 'absolute',
      className,
      as: X = 'div',
      ...ps
    },
    ref,
  ) => {
    bsPrefix = useBs(bsPrefix, 'toast-container');
    return (
      <X
        ref={ref}
        {...ps}
        className={classNames(
          bsPrefix,
          position && [
            containerPosition ? `position-${containerPosition}` : null,
            positionClasses[position],
          ],
          className,
        )}
      />
    );
  },
);

Container.displayName = 'ToastContainer';
