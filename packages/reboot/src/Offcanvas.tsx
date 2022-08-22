import { AbsHeader, AbsProps, Context as MContext } from "./Modal.jsx"
import { classNames, BsOnlyProps, BsRef } from "./helpers.js"
import { Context as NContext } from "./Navbar.jsx"
import { Fade } from "./Fade.jsx"
import { Manager, getSharedManager } from "./Manager.jsx"
import { Modal, Props as MProps, Handle } from "./base/Modal.jsx"
import { useBs } from "./Theme.jsx"
import { Wrapper } from "./Wrapper.jsx"
import * as qh from "./hooks.js"
import * as qr from "react"
import * as qu from "./utils.jsx"
import type { Transition, TransitionStatus } from "react-transition-group"
import type { TransitionCBs } from "./base/types.jsx"

export interface HeaderProps extends AbsProps, BsOnlyProps {}

export const Header = qr.forwardRef<HTMLDivElement, HeaderProps>(
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

export const Body = qu.withBs("offcanvas-body")
const DivAsH5 = qu.divAs("h5")
export const Title = qu.withBs("offcanvas-title", {
  Component: DivAsH5,
})

export interface TogglingProps extends TransitionCBs, BsOnlyProps {
  className?: string
  in?: boolean
  mountOnEnter?: boolean
  unmountOnExit?: boolean
  appear?: boolean
  timeout?: number
  children: qr.ReactElement
}

const styles = {
  [qu.ENTERING]: "show",
  [qu.ENTERED]: "show",
  [qu.EXITING]: "",
  [qu.EXITED]: "",
  [qu.UNMOUNTED]: "",
}

export const Toggling = qr.forwardRef<Transition<any>, TogglingProps>(
  ({ bsPrefix, className, children, ...ps }, ref) => {
    const bs = useBs(bsPrefix, "offcanvas")
    return (
      <Wrapper
        ref={ref}
        addEndListener={qu.endListener}
        {...ps}
        childRef={(children as any).ref}
      >
        {(status: TransitionStatus, ps2: Record<string, unknown>) =>
          qr.cloneElement(children, {
            ...ps2,
            className: classNames(
              className,
              children.props.className,
              (status === qu.ENTERING || status === qu.EXITING) &&
                `${bs}-toggling`,
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
    MProps,
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

function DialogTransition(ps: any) {
  return <Toggling {...ps} />
}

function BackdropTransition(ps: any) {
  return <Fade {...ps} />
}

export const Offcanvas: BsRef<"div", Props> = qr.forwardRef<Handle, Props>(
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
    const manager = qr.useRef<Manager>()
    const bs = useBs(bsPrefix, "offcanvas")
    const { onToggle } = qr.useContext(NContext) || {}
    const [showOffcanvas, setShowOffcanvas] = qr.useState(false)
    const hideOffcanvas = qh.useBreakpoint((responsive as any) || "xs", "up")
    qr.useEffect(() => {
      setShowOffcanvas(responsive ? show && !hideOffcanvas : show)
    }, [show, responsive, hideOffcanvas])
    const hide = qh.useEventCB(() => {
      onToggle?.()
      onHide?.()
    })
    const v = qr.useMemo(
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
    const enter = (x: any, ...xs: any) => {
      if (x) x.style.visibility = "visible"
      onEnter?.(x, ...xs)
    }
    const exited = (x: any, ...xs: any) => {
      if (x) x.style.visibility = ""
      onExited?.(...xs)
    }
    const renderBackdrop = qr.useCallback(
      (xs: any) => (
        <div
          {...xs}
          className={classNames(`${bs}-backdrop`, backdropClassName)}
        />
      ),
      [backdropClassName, bs]
    )
    const renderDialog = (xs: any) => (
      <div
        {...xs}
        {...ps}
        className={classNames(
          className,
          responsive ? `${bs}-${responsive}` : bs,
          `${bs}-${placement}`
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
          <Modal
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

export const Navbar = qr.forwardRef<HTMLDivElement, NavbarProps>((ps, ref) => {
  const context = qr.useContext(NContext)
  return (
    <Offcanvas ref={ref} show={!!context?.expanded} {...ps} renderStaticNode />
  )
})
Navbar.displayName = "NavbarOffcanvas"
