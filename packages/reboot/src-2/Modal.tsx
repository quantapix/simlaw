import classNames from 'classnames';
import addEventListener from 'dom-helpers/addEventListener';
import canUseDOM from 'dom-helpers/canUseDOM';
import ownerDocument from 'dom-helpers/ownerDocument';
import removeEventListener from 'dom-helpers/removeEventListener';
import getScrollbarSize from 'dom-helpers/scrollbarSize';
import useCallbackRef from '@restart/hooks/useCallbackRef';
import useEventCallback from '@restart/hooks/useEventCallback';
import useMergedRefs from '@restart/hooks/useMergedRefs';
import useWillUnmount from '@restart/hooks/useWillUnmount';
import transitionEnd from 'dom-helpers/transitionEnd';
import * as React from 'react';
import { useCallback, useMemo, useRef, useState } from 'react';
import BaseModal, { BaseModalProps } from '@restart/ui/Modal';
import { ModalInstance } from '@restart/ui/ModalManager';
import { getSharedManager } from './BootstrapModalManager';
import { Fade } from './Fade';
import ModalBody from './ModalBody';
import ModalContext from './ModalContext';
import ModalDialog from './ModalDialog';
import ModalFooter from './ModalFooter';
import { ModalHeader } from './ModalHeader';
import ModalTitle from './ModalTitle';
import { BsRefComponent } from './helpers';
import { useBsPrefix, useIsRTL } from './ThemeProvider';

export interface Props
  extends Omit<
    BaseModalProps,
    | 'role'
    | 'renderBackdrop'
    | 'renderDialog'
    | 'transition'
    | 'backdropTransition'
    | 'children'
  > {
  size?: 'sm' | 'lg' | 'xl';
  fullscreen?:
    | true
    | string
    | 'sm-down'
    | 'md-down'
    | 'lg-down'
    | 'xl-down'
    | 'xxl-down';
  bsPrefix?: string;
  centered?: boolean;
  backdropClassName?: string;
  animation?: boolean;
  dialogClassName?: string;
  contentClassName?: string;
  dialogAs?: React.ElementType;
  scrollable?: boolean;
  [other: string]: any;
}

function DialogTransition(ps) {
  return <Fade {...ps} timeout={null} />;
}

function BackdropTransition(ps) {
  return <Fade {...ps} timeout={null} />;
}

export const Modal: BsRefComponent<'div', Props> = React.forwardRef(
  (
    {
      bsPrefix,
      className,
      style,
      dialogClassName,
      contentClassName,
      children,
      dialogAs: Dialog,
      'aria-labelledby': ariaLabelledby,
      'aria-describedby': ariaDescribedby,
      'aria-label': ariaLabel,
      show,
      animation,
      backdrop,
      keyboard,
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
      ...ps
    },
    ref,
  ) => {
    const [modalStyle, setStyle] = useState({});
    const [animateStaticModal, setAnimateStaticModal] = useState(false);
    const waitingForMouseUpRef = useRef(false);
    const ignoreBackdropClickRef = useRef(false);
    const removeStaticModalAnimationRef = useRef<(() => void) | null>(null);
    const [modal, setModalRef] = useCallbackRef<ModalInstance>();
    const mergedRef = useMergedRefs(ref, setModalRef);
    const handleHide = useEventCallback(onHide);
    const isRTL = useIsRTL();

    bsPrefix = useBsPrefix(bsPrefix, 'modal');

    const modalContext = useMemo(
      () => ({
        onHide: handleHide,
      }),
      [handleHide],
    );

    function getModalManager() {
      if (propsManager) return propsManager;
      return getSharedManager({ isRTL });
    }

    function updateDialogStyle(node) {
      if (!canUseDOM) return;
      const containerIsOverflowing = getModalManager().getScrollbarWidth() > 0;
      const modalIsOverflowing =
        node.scrollHeight > ownerDocument(node).documentElement.clientHeight;
      setStyle({
        paddingRight:
          containerIsOverflowing && !modalIsOverflowing
            ? getScrollbarSize()
            : undefined,
        paddingLeft:
          !containerIsOverflowing && modalIsOverflowing
            ? getScrollbarSize()
            : undefined,
      });
    }

    const handleWindowResize = useEventCallback(() => {
      if (modal) {
        updateDialogStyle(modal.dialog);
      }
    });

    useWillUnmount(() => {
      removeEventListener(window as any, 'resize', handleWindowResize);
      removeStaticModalAnimationRef.current?.();
    });

    const handleDialogMouseDown = () => {
      waitingForMouseUpRef.current = true;
    };

    const handleMouseUp = (e) => {
      if (waitingForMouseUpRef.current && modal && e.target === modal.dialog) {
        ignoreBackdropClickRef.current = true;
      }
      waitingForMouseUpRef.current = false;
    };

    const handleStaticModalAnimation = () => {
      setAnimateStaticModal(true);
      removeStaticModalAnimationRef.current = transitionEnd(
        modal!.dialog as any,
        () => {
          setAnimateStaticModal(false);
        },
      );
    };

    const handleStaticBackdropClick = (e) => {
      if (e.target !== e.currentTarget) {
        return;
      }
      handleStaticModalAnimation();
    };

    const handleClick = (e) => {
      if (backdrop === 'static') {
        handleStaticBackdropClick(e);
        return;
      }
      if (ignoreBackdropClickRef.current || e.target !== e.currentTarget) {
        ignoreBackdropClickRef.current = false;
        return;
      }
      onHide?.();
    };

    const handleEscapeKeyDown = (e) => {
      if (!keyboard && backdrop === 'static') {
        e.preventDefault();
        handleStaticModalAnimation();
      } else if (keyboard && onEscapeKeyDown) {
        onEscapeKeyDown(e);
      }
    };

    const handleEnter = (node, isAppearing) => {
      if (node) {
        updateDialogStyle(node);
      }
      onEnter?.(node, isAppearing);
    };

    const handleExit = (node) => {
      removeStaticModalAnimationRef.current?.();
      onExit?.(node);
    };

    const handleEntering = (node, isAppearing) => {
      onEntering?.(node, isAppearing);
      addEventListener(window as any, 'resize', handleWindowResize);
    };

    const handleExited = (node) => {
      if (node) node.style.display = ''; // RHL removes it sometimes
      onExited?.(node);
      removeEventListener(window as any, 'resize', handleWindowResize);
    };

    const renderBackdrop = useCallback(
      (backdropProps) => (
        <div
          {...backdropProps}
          className={classNames(
            `${bsPrefix}-backdrop`,
            backdropClassName,
            !animation && 'show',
          )}
        />
      ),
      [animation, backdropClassName, bsPrefix],
    );

    const baseModalStyle = { ...style, ...modalStyle };
    baseModalStyle.display = 'block';

    const renderDialog = (dialogProps) => (
      <div
        role="dialog"
        {...dialogProps}
        style={baseModalStyle}
        className={classNames(
          className,
          bsPrefix,
          animateStaticModal && `${bsPrefix}-static`,
        )}
        onClick={backdrop ? handleClick : undefined}
        onMouseUp={handleMouseUp}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby}
        aria-describedby={ariaDescribedby}
      >
        {/*
        // @ts-ignore */}
        <Dialog
          {...ps}
          onMouseDown={handleDialogMouseDown}
          className={dialogClassName}
          contentClassName={contentClassName}
        >
          {children}
        </Dialog>
      </div>
    );

    return (
      <ModalContext.Provider value={modalContext}>
        <BaseModal
          show={show}
          ref={mergedRef}
          backdrop={backdrop}
          container={container}
          keyboard // Always set true - see handleEscapeKeyDown
          autoFocus={autoFocus}
          enforceFocus={enforceFocus}
          restoreFocus={restoreFocus}
          restoreFocusOptions={restoreFocusOptions}
          onEscapeKeyDown={handleEscapeKeyDown}
          onShow={onShow}
          onHide={onHide}
          onEnter={handleEnter}
          onEntering={handleEntering}
          onEntered={onEntered}
          onExit={handleExit}
          onExiting={onExiting}
          onExited={handleExited}
          manager={getModalManager()}
          transition={animation ? DialogTransition : undefined}
          backdropTransition={animation ? BackdropTransition : undefined}
          renderBackdrop={renderBackdrop}
          renderDialog={renderDialog}
        />
      </ModalContext.Provider>
    );
  },
);

Modal.displayName = 'Modal';
Modal.defaultProps = {
  show: false,
  backdrop: true,
  keyboard: true,
  autoFocus: true,
  enforceFocus: true,
  restoreFocus: true,
  animation: true,
  dialogAs: ModalDialog,
};

Object.assign(Modal, {
  Body: ModalBody,
  Header: ModalHeader,
  Title: ModalTitle,
  Footer: ModalFooter,
  Dialog: ModalDialog,
  TRANSITION_DURATION: 300,
  BACKDROP_TRANSITION_DURATION: 150,
});
