import { Close, Variant as CloseVariant } from "./Button.js"
import { divAs, withBs } from "./utils.js"
import { Fade } from "./Fade.js"
import { getSharedManager } from "./Manager.js"
import { Modal as Base, Props as BaseProps } from "./base/Modal.js"
import { useBs, useIsRTL } from "./Theme.js"
import * as qh from "./hooks.js"
import * as qr from "react"
import * as qt from "./types.js"
import * as qu from "./base/utils.js"
import type { Instance } from "./base/Manager.js"

interface Data {
  onHide: () => void
}

export const Context = qr.createContext<Data>({
  onHide() {},
})

export interface AbsProps extends qr.HTMLAttributes<HTMLDivElement> {
  closeLabel?: string
  closeVariant?: CloseVariant
  closeButton?: boolean
  onHide?: () => void
}

export const AbsHeader = qr.forwardRef<HTMLDivElement, AbsProps>(
  ({ closeLabel, closeVariant, closeButton, onHide, children, ...ps }, ref) => {
    const context = qr.useContext(Context)
    const doClick = qh.useEventCB(() => {
      context?.onHide()
      onHide?.()
    })
    return (
      <div ref={ref} {...ps}>
        {children}
        {closeButton && (
          <Close
            aria-label={closeLabel}
            variant={closeVariant}
            onClick={doClick}
          />
        )}
      </div>
    )
  }
)

AbsHeader.defaultProps = {
  closeLabel: "Close",
  closeButton: false,
}

export interface HeaderProps extends AbsProps, qt.BsOnlyProps {}

export const Header = qr.forwardRef<HTMLDivElement, HeaderProps>(
  ({ bsPrefix, className, ...ps }, ref) => {
    bsPrefix = useBs(bsPrefix, "modal-header")
    return (
      <AbsHeader
        ref={ref}
        {...ps}
        className={qt.classNames(className, bsPrefix)}
      />
    )
  }
)
Header.displayName = "ModalHeader"
Header.defaultProps = {
  closeLabel: "Close",
  closeButton: false,
}

export const Body = withBs("modal-body")
export const Footer = withBs("modal-footer")
const DivAsH4 = divAs("h4")
export const Title = withBs("modal-title", { Component: DivAsH4 })

export interface DialogProps
  extends qr.HTMLAttributes<HTMLDivElement>,
    qt.BsProps {
  size?: "sm" | "lg" | "xl"
  fullscreen?:
    | true
    | string
    | "sm-down"
    | "md-down"
    | "lg-down"
    | "xl-down"
    | "xxl-down"
  centered?: boolean
  scrollable?: boolean
  contentClassName?: string
}

export const Dialog = qr.forwardRef<HTMLDivElement, DialogProps>(
  (
    {
      bsPrefix,
      className,
      contentClassName,
      centered,
      size,
      fullscreen,
      children,
      scrollable,
      ...ps
    }: DialogProps,
    ref
  ) => {
    const bs = useBs(bsPrefix, "modal")
    const dialogClass = `${bs}-dialog`
    const fullScreenClass =
      typeof fullscreen === "string"
        ? `${bs}-fullscreen-${fullscreen}`
        : `${bs}-fullscreen`
    return (
      <div
        {...ps}
        ref={ref}
        className={qt.classNames(
          dialogClass,
          className,
          size && `${bs}-${size}`,
          centered && `${dialogClass}-centered`,
          scrollable && `${dialogClass}-scrollable`,
          fullscreen && fullScreenClass
        )}
      >
        <div className={qt.classNames(`${bs}-content`, contentClassName)}>
          {children}
        </div>
      </div>
    )
  }
)
Dialog.displayName = "ModalDialog"

export interface Props
  extends Omit<
    BaseProps,
    | "role"
    | "renderBackdrop"
    | "renderDialog"
    | "transition"
    | "backdropTransition"
    | "children"
  > {
  size?: "sm" | "lg" | "xl"
  fullscreen?:
    | true
    | string
    | "sm-down"
    | "md-down"
    | "lg-down"
    | "xl-down"
    | "xxl-down"
  bsPrefix?: string
  centered?: boolean
  backdropClassName?: string
  animation?: boolean
  dialogClassName?: string
  contentClassName?: string
  dialogAs?: qr.ElementType
  scrollable?: boolean
  [other: string]: any
}

function DialogTransition(ps: any) {
  return <Fade {...ps} timeout={null} />
}

function BackdropTransition(ps: any) {
  return <Fade {...ps} timeout={null} />
}

export const Modal: qt.BsRef<"div", Props> = qr.forwardRef(
  (
    {
      bsPrefix,
      className,
      style,
      dialogClassName,
      contentClassName,
      children,
      dialogAs: X = Dialog,
      "aria-labelledby": ariaLabelledby,
      "aria-describedby": ariaDescribedby,
      "aria-label": ariaLabel,
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
    ref
  ) => {
    const [modalStyle, setStyle] = qr.useState({})
    const [animateStaticModal, setAnimateStaticModal] = qr.useState(false)
    const waitingForMouseUpRef = qr.useRef(false)
    const ignoreBackdropClickRef = qr.useRef(false)
    const removeStaticModalAnimationRef = qr.useRef<(() => void) | null>(null)
    const [modal, setModalRef] = qh.useCallbackRef<Instance>()
    const mergedRef = qh.useMergedRefs(
      ref,
      setModalRef as qr.ForwardedRef<unknown>
    )
    const doHide = qh.useEventCB(onHide)
    const isRTL = useIsRTL()
    const bs = useBs(bsPrefix, "modal")
    const v = qr.useMemo(
      () => ({
        onHide: doHide,
      }),
      [doHide]
    )
    function getManager() {
      if (propsManager) return propsManager
      return getSharedManager({ isRTL })
    }
    function updateDialogStyle(x: any) {
      if (!qu.canUseDOM) return
      const containerIsOverflowing = getManager().getScrollbarWidth() > 0
      const modalIsOverflowing =
        x.scrollHeight > qu.ownerDocument(x).documentElement.clientHeight
      setStyle({
        paddingRight:
          containerIsOverflowing && !modalIsOverflowing
            ? qu.getScrollbarSize()
            : undefined,
        paddingLeft:
          !containerIsOverflowing && modalIsOverflowing
            ? qu.getScrollbarSize()
            : undefined,
      })
    }
    const doWindowResize = qh.useEventCB(() => {
      if (modal) {
        updateDialogStyle(modal.dialog)
      }
    })
    qh.useWillUnmount(() => {
      qu.removeEventListener(window as any, "resize", doWindowResize)
      removeStaticModalAnimationRef.current?.()
    })
    const dialogMouseDown = () => {
      waitingForMouseUpRef.current = true
    }
    const mouseUp = (e: any) => {
      if (waitingForMouseUpRef.current && modal && e.target === modal.dialog) {
        ignoreBackdropClickRef.current = true
      }
      waitingForMouseUpRef.current = false
    }
    const staticModalAnimation = () => {
      setAnimateStaticModal(true)
      removeStaticModalAnimationRef.current = qu.transitionEnd(
        modal!.dialog as any,
        () => {
          setAnimateStaticModal(false)
        }
      )
    }
    const staticBackdropClick = (e: any) => {
      if (e.target !== e.currentTarget) {
        return
      }
      staticModalAnimation()
    }
    const click = (e: any) => {
      if (backdrop === "static") {
        staticBackdropClick(e)
        return
      }
      if (ignoreBackdropClickRef.current || e.target !== e.currentTarget) {
        ignoreBackdropClickRef.current = false
        return
      }
      onHide?.()
    }
    const escapeKeyDown = (e: any) => {
      if (!keyboard && backdrop === "static") {
        e.preventDefault()
        staticModalAnimation()
      } else if (keyboard && onEscapeKeyDown) {
        onEscapeKeyDown(e)
      }
    }
    const enter = (x: any, isAppearing: any) => {
      if (x) {
        updateDialogStyle(x)
      }
      onEnter?.(x, isAppearing)
    }
    const exit = (x: any) => {
      removeStaticModalAnimationRef.current?.()
      onExit?.(x)
    }
    const entering = (x: any, isAppearing: any) => {
      onEntering?.(x, isAppearing)
      qu.addEventListener(window as any, "resize", doWindowResize)
    }
    const exited = (x: any) => {
      if (x) x.style.display = ""
      onExited?.(x)
      qu.removeEventListener(window as any, "resize", doWindowResize)
    }
    const renderBackdrop = qr.useCallback(
      (backdropProps: any) => (
        <div
          {...backdropProps}
          className={qt.classNames(
            `${bs}-backdrop`,
            backdropClassName,
            !animation && "show"
          )}
        />
      ),
      [animation, backdropClassName, bs]
    )
    const baseModalStyle = { ...style, ...modalStyle }
    baseModalStyle.display = "block"
    const renderDialog = (dialogProps: any) => (
      <div
        role="dialog"
        {...dialogProps}
        style={baseModalStyle}
        className={qt.classNames(
          className,
          bs,
          animateStaticModal && `${bs}-static`
        )}
        onClick={backdrop ? click : undefined}
        onMouseUp={mouseUp}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby}
        aria-describedby={ariaDescribedby}
      >
        {}
        <X
          {...ps}
          onMouseDown={dialogMouseDown}
          className={dialogClassName}
          contentClassName={contentClassName}
        >
          {children}
        </X>
      </div>
    )
    return (
      <Context.Provider value={v}>
        <Base
          show={show}
          ref={mergedRef}
          backdrop={backdrop}
          container={container}
          keyboard // Always set true - see handleEscapeKeyDown
          autoFocus={autoFocus}
          enforceFocus={enforceFocus}
          restoreFocus={restoreFocus}
          restoreFocusOptions={restoreFocusOptions}
          onEscapeKeyDown={escapeKeyDown}
          onShow={onShow}
          onHide={onHide}
          onEnter={enter}
          onEntering={entering}
          onEntered={onEntered}
          onExit={exit}
          onExiting={onExiting}
          onExited={exited}
          manager={getManager()}
          transition={animation ? DialogTransition : undefined}
          backdropTransition={animation ? BackdropTransition : undefined}
          renderBackdrop={renderBackdrop}
          renderDialog={renderDialog}
        />
      </Context.Provider>
    )
  }
)
Modal.displayName = "Modal"
Modal.defaultProps = {
  show: false,
  backdrop: true,
  keyboard: true,
  autoFocus: true,
  enforceFocus: true,
  restoreFocus: true,
  animation: true,
  dialogAs: Dialog,
}

export const TRANSITION_DURATION = 300
export const BACKDROP_TRANSITION_DURATION = 150
