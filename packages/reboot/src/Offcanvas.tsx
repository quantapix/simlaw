import { AbstractModalHeader, AbstractModalHeaderProps } from "./AbstractModalHeader"
import { BaseModal, ModalProps as BaseModalProps, ModalHandle } from "@restart/ui/Modal"
import { BsPrefixOnlyProps } from "./utils"
import { BsPrefixRefForwardingComponent } from "./utils"
import { CloseButtonVariant } from "./CloseButton"
import {
  Transition,
  TransitionStatus,
  ENTERED,
  ENTERING,
  EXITING,
} from "react-transition-group/Transition"
import { TransitionCallbacks } from "@restart/ui/types"
import { useBootstrapPrefix } from "./ThemeProvider"
import { useCallback, useMemo, useRef } from "react"
import { BootstrapModalManager, getSharedManager } from "./BootstrapModalManager"
import * as React from "react"
import classNames from "classnames"
import createWithBsPrefix from "./createWithBsPrefix"
import divWithClassName from "./divWithClassName"
import { Fade } from "./Fade"
import { ModalContext } from "./ModalContext"
import transitionEndListener from "./transitionEndListener"
import TransitionWrapper from "./TransitionWrapper"
import useEventCallback from "@restart/hooks/useEventCallback"
export const OffcanvasBody = createWithBsPrefix("offcanvas-body")
const DivStyledAsH5 = divWithClassName("h5")
export const OffcanvasTitle = createWithBsPrefix("offcanvas-title", { Component: DivStyledAsH5 })
export type OffcanvasPlacement = "start" | "end" | "top" | "bottom"
export interface OffcanvasHeaderProps extends AbstractModalHeaderProps, BsPrefixOnlyProps {}
export const OffcanvasHeader = React.forwardRef<HTMLDivElement, OffcanvasHeaderProps>(
  ({ bsPrefix, className, ...ps }, ref) => {
    bsPrefix = useBootstrapPrefix(bsPrefix, "offcanvas-header")
    return <AbstractModalHeader ref={ref} {...ps} className={classNames(className, bsPrefix)} />
  }
)
OffcanvasHeader.displayName = "OffcanvasHeader"
OffcanvasHeader.defaultProps = { closeLabel: "Close", closeButton: false }
export interface OffcanvasTogglingProps extends TransitionCallbacks, BsPrefixOnlyProps {
  className?: string
  in?: boolean
  mountOnEnter?: boolean
  unmountOnExit?: boolean
  appear?: boolean
  timeout?: number
  children: React.ReactElement
}
const transitionStyles = {
  [ENTERING]: "show",
  [ENTERED]: "show",
}
export const OffcanvasToggling = React.forwardRef<Transition<any>, OffcanvasTogglingProps>(
  ({ bsPrefix, className, children, ...ps }, ref) => {
    bsPrefix = useBootstrapPrefix(bsPrefix, "offcanvas")
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
              (status === ENTERING || status === EXITING) && `${bsPrefix}-toggling`,
              transitionStyles[status]
            ),
          })
        }
      </TransitionWrapper>
    )
  }
)
OffcanvasToggling.defaultProps = {
  in: false,
  mountOnEnter: false,
  unmountOnExit: false,
  appear: false,
}
OffcanvasToggling.displayName = "OffcanvasToggling"
export interface OffcanvasProps
  extends Omit<
    BaseModalProps,
    "role" | "renderBackdrop" | "renderDialog" | "transition" | "backdrop" | "backdropTransition"
  > {
  bsPrefix?: string
  backdropClassName?: string
  scroll?: boolean
  placement?: OffcanvasPlacement
}
function DialogTransition(props) {
  return <OffcanvasToggling {...props} />
}
function BackdropTransition(props) {
  return <Fade {...props} />
}
export const Offcanvas: BsPrefixRefForwardingComponent<"div", OffcanvasProps> = React.forwardRef<
  ModalHandle,
  OffcanvasProps
>(
  (
    {
      bsPrefix,
      className,
      children,
      "aria-labelledby": ariaLabelledby,
      placement,
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
      ...ps
    },
    ref
  ) => {
    const modalManager = useRef<BootstrapModalManager>()
    const handleHide = useEventCallback(onHide)
    bsPrefix = useBootstrapPrefix(bsPrefix, "offcanvas")
    const modalContext = useMemo(
      () => ({
        onHide: handleHide,
      }),
      [handleHide]
    )
    function getModalManager() {
      if (propsManager) return propsManager
      if (scroll) {
        if (!modalManager.current)
          modalManager.current = new BootstrapModalManager({
            handleContainerOverflow: false,
          })
        return modalManager.current
      }
      return getSharedManager()
    }
    const handleEnter = (node, ...args) => {
      if (node) node.style.visibility = "visible"
      onEnter?.(node, ...args)
    }
    const handleExited = (node, ...args) => {
      if (node) node.style.visibility = ""
      onExited?.(...args)
    }
    const renderBackdrop = useCallback(
      backdropProps => (
        <div {...backdropProps} className={classNames(`${bsPrefix}-backdrop`, backdropClassName)} />
      ),
      [backdropClassName, bsPrefix]
    )
    const renderDialog = dialogProps => (
      <div
        role="dialog"
        {...dialogProps}
        {...ps}
        className={classNames(className, bsPrefix, `${bsPrefix}-${placement}`)}
        aria-labelledby={ariaLabelledby}
      >
        {children}
      </div>
    )
    return (
      <ModalContext.Provider value={modalContext}>
        <BaseModal
          show={show}
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
          onHide={onHide}
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
    )
  }
)
Offcanvas.displayName = "Offcanvas"
Offcanvas.defaultProps = {
  show: false,
  backdrop: true,
  keyboard: true,
  scroll: false,
  autoFocus: true,
  enforceFocus: true,
  restoreFocus: true,
  placement: "start",
}
Object.assign(Offcanvas, {
  Body: OffcanvasBody,
  Header: OffcanvasHeader,
  Title: OffcanvasTitle,
})
