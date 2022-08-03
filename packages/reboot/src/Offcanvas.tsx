import classNames from 'classnames';
import * as React from 'react';
import useBreakpoint from '@restart/hooks/useBreakpoint';
import useEventCallback from '@restart/hooks/useEventCallback';
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import BaseModal, {
  ModalProps as _Props,
  ModalHandle,
} from '@restart/ui/Modal';
import Transition, {
  TransitionStatus,
  ENTERED,
  ENTERING,
  EXITING,
} from 'react-transition-group/Transition';
import { TransitionCallbacks } from '@restart/ui/types';
import { Fade } from './Fade';
import { AbsHeader, AbsProps as HProps, Context as MContext } from './Modal';
import { Context as NContext } from './Navbar';
import { BsOnlyProps, BsRefComponent } from './helpers';
import { useBsPrefix } from './Theme';
import { Manager, getSharedManager } from './Manager';
import withBsPrefix from './createWithBsPrefix';
import divWithClassName from './divWithClassName';
import transitionEndListener from './transitionEndListener';
import { TransitionWrapper } from './TransitionWrapper';

export interface HeaderProps extends HProps, BsOnlyProps {}

export const Header = React.forwardRef<HTMLDivElement, HeaderProps>(
  ({ bsPrefix, className, ...ps }, ref) => {
    bsPrefix = useBsPrefix(bsPrefix, 'offcanvas-header');
    return (
      <AbsHeader
        ref={ref}
        {...ps}
        className={classNames(className, bsPrefix)}
      />
    );
  },
);
Header.displayName = 'OffcanvasHeader';
Header.defaultProps = {
  closeLabel: 'Close',
  closeButton: false,
};

export const Body = withBsPrefix('offcanvas-body');
const DivAsH5 = divWithClassName('h5');
export const Title = withBsPrefix('offcanvas-title', {
  Component: DivAsH5,
});

export interface TogglingProps extends TransitionCallbacks, BsOnlyProps {
  className?: string;
  in?: boolean;
  mountOnEnter?: boolean;
  unmountOnExit?: boolean;
  appear?: boolean;
  timeout?: number;
  children: React.ReactElement;
}

const styles = {
  [ENTERING]: 'show',
  [ENTERED]: 'show',
};

export const Toggling = React.forwardRef<Transition<any>, TogglingProps>(
  ({ bsPrefix, className, children, ...ps }, ref) => {
    bsPrefix = useBsPrefix(bsPrefix, 'offcanvas');
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
              styles[status],
            ),
          })
        }
      </TransitionWrapper>
    );
  },
);
Toggling.displayName = 'OffcanvasToggling';
Toggling.defaultProps = {
  in: false,
  mountOnEnter: false,
  unmountOnExit: false,
  appear: false,
};

export type Placement = 'start' | 'end' | 'top' | 'bottom';

export interface Props
  extends Omit<
    _Props,
    | 'role'
    | 'renderBackdrop'
    | 'renderDialog'
    | 'transition'
    | 'backdrop'
    | 'backdropTransition'
  > {
  bsPrefix?: string;
  backdropClassName?: string;
  scroll?: boolean;
  placement?: Placement;
  responsive?: 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | string;
  renderStaticNode?: boolean;
}

function DialogTransition(ps) {
  return <Toggling {...ps} />;
}

function BackdropTransition(ps) {
  return <Fade {...ps} />;
}

export const Offcanvas: BsRefComponent<'div', Props> = React.forwardRef<
  ModalHandle,
  Props
>(
  (
    {
      bsPrefix,
      className,
      children,
      'aria-labelledby': ariaLabelledby,
      placement,
      responsive,
      show,
      backdrop,
      keyboard,
      scroll,
      onEscapeKeyDown,
      onShow,
      onHide,
      container,
      autoFocus,
      enforceFocus,
      restoreFocus,
      restoreFocusOptions,
      onEntered,
      onExit,
      onExiting,
      onEnter,
      onEntering,
      onExited,
      backdropClassName,
      manager: propsManager,
      renderStaticNode,
      ...ps
    },
    ref,
  ) => {
    const modalManager = useRef<Manager>();
    bsPrefix = useBsPrefix(bsPrefix, 'offcanvas');
    const { onToggle } = useContext(NContext) || {};
    const [showOffcanvas, setShowOffcanvas] = useState(false);
    const hideResponsiveOffcanvas = useBreakpoint(
      (responsive as any) || 'xs',
      'up',
    );

    useEffect(() => {
      setShowOffcanvas(responsive ? show && !hideResponsiveOffcanvas : show);
    }, [show, responsive, hideResponsiveOffcanvas]);

    const handleHide = useEventCallback(() => {
      onToggle?.();
      onHide?.();
    });

    const modalContext = useMemo(
      () => ({
        onHide: handleHide,
      }),
      [handleHide],
    );

    function getModalManager() {
      if (propsManager) return propsManager;
      if (scroll) {
        if (!modalManager.current)
          modalManager.current = new Manager({
            handleContainerOverflow: false,
          });
        return modalManager.current;
      }
      return getSharedManager();
    }

    const handleEnter = (node, ...args) => {
      if (node) node.style.visibility = 'visible';
      onEnter?.(node, ...args);
    };

    const handleExited = (node, ...args) => {
      if (node) node.style.visibility = '';
      onExited?.(...args);
    };
    const renderBackdrop = useCallback(
      (backdropProps) => (
        <div
          {...backdropProps}
          className={classNames(`${bsPrefix}-backdrop`, backdropClassName)}
        />
      ),
      [backdropClassName, bsPrefix],
    );
    const renderDialog = (dialogProps) => (
      <div
        {...dialogProps}
        {...ps}
        className={classNames(
          className,
          responsive ? `${bsPrefix}-${responsive}` : bsPrefix,
          `${bsPrefix}-${placement}`,
        )}
        aria-labelledby={ariaLabelledby}
      >
        {children}
      </div>
    );
    return (
      <>
        {/**/}
        {!showOffcanvas && (responsive || renderStaticNode) && renderDialog({})}
        <MContext.Provider value={modalContext}>
          <BaseModal
            show={showOffcanvas}
            ref={ref}
            backdrop={backdrop}
            container={container}
            keyboard={keyboard}
            autoFocus={autoFocus}
            enforceFocus={enforceFocus && !scroll}
            restoreFocus={restoreFocus}
            restoreFocusOptions={restoreFocusOptions}
            onEscapeKeyDown={onEscapeKeyDown}
            onShow={onShow}
            onHide={handleHide}
            onEnter={handleEnter}
            onEntering={onEntering}
            onEntered={onEntered}
            onExit={onExit}
            onExiting={onExiting}
            onExited={handleExited}
            manager={getModalManager()}
            transition={DialogTransition}
            backdropTransition={BackdropTransition}
            renderBackdrop={renderBackdrop}
            renderDialog={renderDialog}
          />
        </MContext.Provider>
      </>
    );
  },
);
Offcanvas.displayName = 'Offcanvas';
Offcanvas.defaultProps = {
  show: false,
  backdrop: true,
  keyboard: true,
  scroll: false,
  autoFocus: true,
  enforceFocus: true,
  restoreFocus: true,
  placement: 'start',
  renderStaticNode: false,
};
