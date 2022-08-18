import * as React from "react"
import { useBreakpoint, useEventCallback } from "@restart/hooks"
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import BaseModal, {
  ModalProps as _Props,
  ModalHandle,
} from "@restart/ui/esm/Modal.jsx"
import Transition, {
  TransitionStatus,
  ENTERED,
  ENTERING,
  EXITING,
} from "react-transition-group/Transition"
import type { TransitionCallbacks } from "@restart/ui/esm/types.jsx"
import { Fade } from "./Fade.jsx"
import { AbsHeader, AbsProps as HProps, Context as MContext } from "./Modal.jsx"
import { Context as NContext } from "./Navbar.jsx"
import { classNames, BsOnlyProps, BsRefComp } from "./helpers.js"
import { useBs } from "./Theme.jsx"
import { Manager, getSharedManager } from "./Manager.jsx"
import { divAs, withBs, endListener } from "./utils.jsx"
import { Wrapper } from "./Transition.jsx"

export interface HeaderProps extends HProps, BsOnlyProps {}

export const Header = React.forwardRef<HTMLDivElement, HeaderProps>(
  ({ bsPrefix, className, ...ps }, ref) => {
    bsPrefix = useBs(bsPrefix, "offcanvas-header")
    return (
      <AbsHeader
        ref={ref}
        {...ps}
        className={classNames(className, bsPrefix)}
      />
    )
  }
)
Header.displayName = "OffcanvasHeader"
Header.defaultProps = {
  closeLabel: "Close",
  closeButton: false,
}

export const Body = withBs("offcanvas-body")
const DivAsH5 = divAs("h5")
export const Title = withBs("offcanvas-title", {
  Component: DivAsH5,
})

export interface TogglingProps extends TransitionCallbacks, BsOnlyProps {
  className?: string
  in?: boolean
  mountOnEnter?: boolean
  unmountOnExit?: boolean
  appear?: boolean
  timeout?: number
  children: React.ReactElement
}

const styles = {
  [ENTERING]: "show",
  [ENTERED]: "show",
}

export const Toggling = React.forwardRef<Transition<any>, TogglingProps>(
  ({ bsPrefix, className, children, ...ps }, ref) => {
    bsPrefix = useBs(bsPrefix, "offcanvas")
    return (
      <Wrapper
        ref={ref}
        addEndListener={endListener}
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
              styles[status]
            ),
          })
        }
      </Wrapper>
    )
  }
)
Toggling.displayName = "OffcanvasToggling"
Toggling.defaultProps = {
  in: false,
  mountOnEnter: false,
  unmountOnExit: false,
  appear: false,
}

export type Placement = "start" | "end" | "top" | "bottom"

export interface Props
  extends Omit<
    _Props,
    | "role"
    | "renderBackdrop"
    | "renderDialog"
    | "transition"
    | "backdrop"
    | "backdropTransition"
  > {
  bsPrefix?: string
  backdropClassName?: string
  scroll?: boolean
  placement?: Placement
  responsive?: "sm" | "md" | "lg" | "xl" | "xxl" | string
  renderStaticNode?: boolean
}

function DialogTransition(ps) {
  return <Toggling {...ps} />
}

function BackdropTransition(ps) {
  return <Fade {...ps} />
}

export const Offcanvas: BsRefComp<"div", Props> = React.forwardRef<
  ModalHandle,
  Props
>(
  (
    {
      bsPrefix,
      className,
      children,
      "aria-labelledby": ariaLabelledby,
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
    ref
  ) => {
    const manager = useRef<Manager>()
    bsPrefix = useBs(bsPrefix, "offcanvas")
    const { onToggle } = useContext(NContext) || {}
    const [showOffcanvas, setShowOffcanvas] = useState(false)
    const hideResponsiveOffcanvas = useBreakpoint(
      (responsive as any) || "xs",
      "up"
    )
    useEffect(() => {
      setShowOffcanvas(responsive ? show && !hideResponsiveOffcanvas : show)
    }, [show, responsive, hideResponsiveOffcanvas])
    const hide = useEventCallback(() => {
      onToggle?.()
      onHide?.()
    })
    const v = useMemo(
      () => ({
        onHide: hide,
      }),
      [hide]
    )
    function getManager() {
      if (propsManager) return propsManager
      if (scroll) {
        if (!manager.current)
          manager.current = new Manager({
            handleContainerOverflow: false,
          })
        return manager.current
      }
      return getSharedManager()
    }
    const enter = (node, ...args) => {
      if (node) node.style.visibility = "visible"
      onEnter?.(node, ...args)
    }
    const exited = (node, ...args) => {
      if (node) node.style.visibility = ""
      onExited?.(...args)
    }
    const renderBackdrop = useCallback(
      backdropProps => (
        <div
          {...backdropProps}
          className={classNames(`${bsPrefix}-backdrop`, backdropClassName)}
        />
      ),
      [backdropClassName, bsPrefix]
    )
    const renderDialog = dialogProps => (
      <div
        {...dialogProps}
        {...ps}
        className={classNames(
          className,
          responsive ? `${bsPrefix}-${responsive}` : bsPrefix,
          `${bsPrefix}-${placement}`
        )}
        aria-labelledby={ariaLabelledby}
      >
        {children}
      </div>
    )
    return (
      <>
        {/**/}
        {!showOffcanvas && (responsive || renderStaticNode) && renderDialog({})}
        <MContext.Provider value={v}>
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
            onHide={hide}
            onEnter={enter}
            onEntering={onEntering}
            onEntered={onEntered}
            onExit={onExit}
            onExiting={onExiting}
            onExited={exited}
            manager={getManager()}
            transition={DialogTransition}
            backdropTransition={BackdropTransition}
            renderBackdrop={renderBackdrop}
            renderDialog={renderDialog}
          />
        </MContext.Provider>
      </>
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
  renderStaticNode: false,
}

export type NavbarProps = Omit<Props, "show">

export const Navbar = React.forwardRef<HTMLDivElement, NavbarProps>(
  (ps, ref) => {
    const context = useContext(NContext)
    return (
      <Offcanvas
        ref={ref}
        show={!!context?.expanded}
        {...ps}
        renderStaticNode
      />
    )
  }
)
Navbar.displayName = "NavbarOffcanvas"
