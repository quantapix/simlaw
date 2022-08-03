import classNames from 'classnames';
import useBreakpoint from '@restart/hooks/useBreakpoint';
import useEventCallback from '@restart/hooks/useEventCallback';
import * as React from 'react';
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import BaseModal, {
  ModalProps as BaseModalProps,
  ModalHandle,
} from '@restart/ui/Modal';
import { Fade } from './Fade';
import OffcanvasBody from './OffcanvasBody';
import { OffcanvasToggling } from './OffcanvasToggling';
import ModalContext from './ModalContext';
import { NavbarContext } from './NavbarContext';
import { OffcanvasHeader } from './OffcanvasHeader';
import OffcanvasTitle from './OffcanvasTitle';
import { BsRefComponent } from './helpers';
import { useBsPrefix } from './ThemeProvider';
import BootstrapModalManager, {
  getSharedManager,
} from './BootstrapModalManager';

export type OffcanvasPlacement = 'start' | 'end' | 'top' | 'bottom';

export interface Props
  extends Omit<
    BaseModalProps,
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
  placement?: OffcanvasPlacement;
  responsive?: 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | string;
  renderStaticNode?: boolean;
}

function DialogTransition(ps) {
  return <OffcanvasToggling {...ps} />;
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
    const modalManager = useRef<BootstrapModalManager>();
    bsPrefix = useBsPrefix(bsPrefix, 'offcanvas');
    const { onToggle } = useContext(NavbarContext) || {};
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
          modalManager.current = new BootstrapModalManager({
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
        {/* 
            Only render static elements when offcanvas isn't shown so we 
            don't duplicate elements.

            TODO: Should follow bootstrap behavior and don't unmount children
            when show={false} in BaseModal. Will do this next major version.
          */}
        {!showOffcanvas && (responsive || renderStaticNode) && renderDialog({})}

        <ModalContext.Provider value={modalContext}>
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
        </ModalContext.Provider>
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

Object.assign(Offcanvas, {
  Body: OffcanvasBody,
  Header: OffcanvasHeader,
  Title: OffcanvasTitle,
});
