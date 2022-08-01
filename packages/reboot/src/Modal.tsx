import { BsPrefixOnlyProps } from "./utils"
import { BsPrefixProps } from "./utils"
import { BsPrefixRefForwardingComponent } from "./utils"
import { CloseButtonVariant } from "./CloseButton"
import { dataAttr } from "./DataKey"
import { getSharedManager } from "./BootstrapModalManager"
import { ModalInstance } from "@restart/ui/ModalManager"
import { TransitionCallbacks } from "./types"
import { useBootstrapPrefix, useIsRTL } from "./ThemeProvider"
import { useCallback, useMemo, useRef, useState } from "react"
import { useImperativeHandle, forwardRef, useEffect } from "react"
import { AbstractModalHeader, AbstractModalHeaderProps } from "./AbstractModalHeader"
import * as React from "react"
import activeElement from "dom-helpers/activeElement"
import addEventListener from "dom-helpers/addEventListener"
import BaseModal, { ModalProps as BaseModalProps } from "@restart/ui/Modal"
import canUseDOM from "dom-helpers/canUseDOM"
import classNames from "classnames"
import contains from "dom-helpers/contains"
import createWithBsPrefix from "./createWithBsPrefix"
import css from "dom-helpers/css"
import divWithClassName from "./divWithClassName"
import { Fade } from "./Fade"
import getBodyScrollbarWidth from "./getScrollbarWidth"
import getScrollbarSize from "dom-helpers/scrollbarSize"
import listen from "dom-helpers/listen"
import ownerDocument from "dom-helpers/ownerDocument"
import ReactDOM from "react-dom"
import removeEventListener from "dom-helpers/removeEventListener"
import transitionEnd from "dom-helpers/transitionEnd"
import useCallbackRef from "@restart/hooks/useCallbackRef"
import useEventCallback from "@restart/hooks/useEventCallback"
import useMergedRefs from "@restart/hooks/useMergedRefs"
import useMounted from "@restart/hooks/useMounted"
import usePrevious from "@restart/hooks/usePrevious"
import useWaitForDOMRef, { DOMContainer } from "./useWaitForDOMRef"
import useWillUnmount from "@restart/hooks/useWillUnmount"

export const ModalBody = createWithBsPrefix("modal-body")
export const ModalFooter = createWithBsPrefix("modal-footer")
const DivStyledAsH4 = divWithClassName("h4")
export const ModalTitle = createWithBsPrefix("modal-title", { Component: DivStyledAsH4 })

let manager: ModalManager
export type ModalTransitionComponent = React.ComponentType<
  {
    in: boolean
    appear?: boolean
    unmountOnExit?: boolean
  } & TransitionCallbacks
>
export interface RenderModalDialogProps {
  style: React.CSSProperties | undefined
  className: string | undefined
  tabIndex: number
  role: string
  ref: React.RefCallback<Element>
  "aria-modal": boolean | undefined
}
export interface RenderModalBackdropProps {
  ref: React.RefCallback<Element>
  onClick: (event: React.SyntheticEvent) => void
}
export interface BaseModalProps extends TransitionCallbacks {
  children?: React.ReactElement
  role?: string
  style?: React.CSSProperties
  className?: string
  show?: boolean
  container?: DOMContainer
  onShow?: () => void
  onHide?: () => void
  manager?: ModalManager
  backdrop?: true | false | "static"
  renderDialog?: (props: RenderModalDialogProps) => React.ReactNode
  renderBackdrop?: (props: RenderModalBackdropProps) => React.ReactNode
  onEscapeKeyDown?: (e: KeyboardEvent) => void
  onBackdropClick?: (e: React.SyntheticEvent) => void
  keyboard?: boolean
  transition?: ModalTransitionComponent
  backdropTransition?: ModalTransitionComponent
  autoFocus?: boolean
  enforceFocus?: boolean
  restoreFocus?: boolean
  restoreFocusOptions?: {
    preventScroll: boolean
  }
}
export interface ModalProps extends BaseModalProps {
  [k: string]: any
}
function getManager() {
  if (!manager) manager = new ModalManager()
  return manager
}
function useModalManager(provided?: ModalManager) {
  const modalManager = provided || getManager()
  const modal = useRef({
    dialog: null as any as HTMLElement,
    backdrop: null as any as HTMLElement,
  })
  return Object.assign(modal.current, {
    add: () => modalManager.add(modal.current),
    remove: () => modalManager.remove(modal.current),
    isTopModal: () => modalManager.isTopModal(modal.current),
    setDialogRef: useCallback((ref: HTMLElement | null) => {
      modal.current.dialog = ref!
    }, []),
    setBackdropRef: useCallback((ref: HTMLElement | null) => {
      modal.current.backdrop = ref!
    }, []),
  })
}
export interface ModalHandle {
  dialog: HTMLElement | null
  backdrop: HTMLElement | null
}
export const Modal: React.ForwardRefExoticComponent<ModalProps & React.RefAttributes<ModalHandle>> =
  forwardRef(
    (
      {
        show = false,
        role = "dialog",
        className,
        style,
        children,
        backdrop = true,
        keyboard = true,
        onBackdropClick,
        onEscapeKeyDown,
        transition,
        backdropTransition,
        autoFocus = true,
        enforceFocus = true,
        restoreFocus = true,
        restoreFocusOptions,
        renderDialog,
        renderBackdrop = (props: RenderModalBackdropProps) => <div {...props} />,
        manager: providedManager,
        container: containerRef,
        onShow,
        onHide = () => {},
        onExit,
        onExited,
        onExiting,
        onEnter,
        onEntering,
        onEntered,
        ...rest
      }: ModalProps,
      ref: React.Ref<ModalHandle>
    ) => {
      const container = useWaitForDOMRef(containerRef)
      const modal = useModalManager(providedManager)
      const isMounted = useMounted()
      const prevShow = usePrevious(show)
      const [exited, setExited] = useState(!show)
      const lastFocusRef = useRef<HTMLElement | null>(null)
      useImperativeHandle(ref, () => modal, [modal])
      if (canUseDOM && !prevShow && show) {
        lastFocusRef.current = activeElement() as HTMLElement
      }
      if (!transition && !show && !exited) {
        setExited(true)
      } else if (show && exited) {
        setExited(false)
      }
      const handleShow = useEventCallback(() => {
        modal.add()
        removeKeydownListenerRef.current = listen(document as any, "keydown", handleDocumentKeyDown)
        removeFocusListenerRef.current = listen(
          document as any,
          "focus",
          () => setTimeout(handleEnforceFocus),
          true
        )
        if (onShow) {
          onShow()
        }
        if (autoFocus) {
          const currentActiveElement = activeElement(document) as HTMLElement
          if (
            modal.dialog &&
            currentActiveElement &&
            !contains(modal.dialog, currentActiveElement)
          ) {
            lastFocusRef.current = currentActiveElement
            modal.dialog.focus()
          }
        }
      })
      const handleHide = useEventCallback(() => {
        modal.remove()
        removeKeydownListenerRef.current?.()
        removeFocusListenerRef.current?.()
        if (restoreFocus) {
          lastFocusRef.current?.focus?.(restoreFocusOptions)
          lastFocusRef.current = null
        }
      })
      useEffect(() => {
        if (!show || !container) return
        handleShow()
      }, [show, container, handleShow])
      useEffect(() => {
        if (!exited) return
        handleHide()
      }, [exited, handleHide])
      useWillUnmount(() => {
        handleHide()
      })
      const handleEnforceFocus = useEventCallback(() => {
        if (!enforceFocus || !isMounted() || !modal.isTopModal()) {
          return
        }
        const currentActiveElement = activeElement()
        if (modal.dialog && currentActiveElement && !contains(modal.dialog, currentActiveElement)) {
          modal.dialog.focus()
        }
      })
      const handleBackdropClick = useEventCallback((e: React.SyntheticEvent) => {
        if (e.target !== e.currentTarget) {
          return
        }
        onBackdropClick?.(e)
        if (backdrop === true) {
          onHide()
        }
      })
      const handleDocumentKeyDown = useEventCallback((e: KeyboardEvent) => {
        if (keyboard && e.keyCode === 27 && modal.isTopModal()) {
          onEscapeKeyDown?.(e)
          if (!e.defaultPrevented) {
            onHide()
          }
        }
      })
      const removeFocusListenerRef = useRef<ReturnType<typeof listen> | null>()
      const removeKeydownListenerRef = useRef<ReturnType<typeof listen> | null>()
      const handleHidden: TransitionCallbacks["onExited"] = (...args) => {
        setExited(true)
        onExited?.(...args)
      }
      const Transition = transition
      if (!container || !(show || (Transition && !exited))) {
        return null
      }
      const dialogProps = {
        role,
        ref: modal.setDialogRef,
        "aria-modal": role === "dialog" ? true : undefined,
        ...rest,
        style,
        className,
        tabIndex: -1,
      }
      let dialog = renderDialog ? (
        renderDialog(dialogProps)
      ) : (
        <div {...dialogProps}>{React.cloneElement(children!, { role: "document" })}</div>
      )
      if (Transition) {
        dialog = (
          <Transition
            appear
            unmountOnExit
            in={!!show}
            onExit={onExit}
            onExiting={onExiting}
            onExited={handleHidden}
            onEnter={onEnter}
            onEntering={onEntering}
            onEntered={onEntered}
          >
            {dialog}
          </Transition>
        )
      }
      let backdropElement = null
      if (backdrop) {
        const BackdropTransition = backdropTransition
        backdropElement = renderBackdrop({
          ref: modal.setBackdropRef,
          onClick: handleBackdropClick,
        })
        if (BackdropTransition) {
          backdropElement = (
            <BackdropTransition appear in={!!show}>
              {backdropElement}
            </BackdropTransition>
          )
        }
      }
      return (
        <>
          {ReactDOM.createPortal(
            <>
              {backdropElement}
              {dialog}
            </>,
            container
          )}
        </>
      )
    }
  )
Modal.displayName = "Modal"
Object.assign(Modal, {
  Manager: ModalManager,
})
export interface ModalInstance {
  dialog: Element
  backdrop: Element
}
export interface ModalManagerOptions {
  handleContainerOverflow?: boolean
  isRTL?: boolean
}
export type ContainerState = {
  scrollBarWidth: number
  style: Record<string, any>
  [key: string]: any
}
export const OPEN_DATA_ATTRIBUTE = dataAttr("modal-open")
export class ModalManager {
  readonly handleContainerOverflow: boolean
  readonly isRTL: boolean
  readonly modals: ModalInstance[]
  private state!: ContainerState
  constructor({ handleContainerOverflow = true, isRTL = false }: ModalManagerOptions = {}) {
    this.handleContainerOverflow = handleContainerOverflow
    this.isRTL = isRTL
    this.modals = []
  }
  getScrollbarWidth() {
    return getBodyScrollbarWidth()
  }
  getElement() {
    return document.body
  }
  setModalAttributes(_modal: ModalInstance) {}
  removeModalAttributes(_modal: ModalInstance) {}
  setContainerStyle(containerState: ContainerState) {
    const style: Partial<CSSStyleDeclaration> = { overflow: "hidden" }
    const paddingProp = this.isRTL ? "paddingLeft" : "paddingRight"
    const container = this.getElement()
    containerState.style = {
      overflow: container.style.overflow,
      [paddingProp]: container.style[paddingProp],
    }
    if (containerState.scrollBarWidth) {
      style[paddingProp] = `${
        parseInt(css(container, paddingProp) || "0", 10) + containerState.scrollBarWidth
      }px`
    }
    container.setAttribute(OPEN_DATA_ATTRIBUTE, "")
    css(container, style as any)
  }
  reset() {
    ;[...this.modals].forEach(m => this.remove(m))
  }
  removeContainerStyle(containerState: ContainerState) {
    const container = this.getElement()
    container.removeAttribute(OPEN_DATA_ATTRIBUTE)
    Object.assign(container.style, containerState.style)
  }
  add(modal: ModalInstance) {
    let modalIdx = this.modals.indexOf(modal)
    if (modalIdx !== -1) {
      return modalIdx
    }
    modalIdx = this.modals.length
    this.modals.push(modal)
    this.setModalAttributes(modal)
    if (modalIdx !== 0) {
      return modalIdx
    }
    this.state = {
      scrollBarWidth: this.getScrollbarWidth(),
      style: {},
    }
    if (this.handleContainerOverflow) {
      this.setContainerStyle(this.state)
    }
    return modalIdx
  }
  remove(modal: ModalInstance) {
    const modalIdx = this.modals.indexOf(modal)
    if (modalIdx === -1) {
      return
    }
    this.modals.splice(modalIdx, 1)
    if (!this.modals.length && this.handleContainerOverflow) {
      this.removeContainerStyle(this.state)
    }
    this.removeModalAttributes(modal)
  }
  isTopModal(modal: ModalInstance) {
    return !!this.modals.length && this.modals[this.modals.length - 1] === modal
  }
}
interface ModalContextType {
  onHide: () => void
}
export const ModalContext = React.createContext<ModalContextType>({
  onHide() {},
})
export interface ModalDialogProps extends React.HTMLAttributes<HTMLDivElement>, BsPrefixProps {
  size?: "sm" | "lg" | "xl"
  fullscreen?: true | "sm-down" | "md-down" | "lg-down" | "xl-down" | "xxl-down"
  centered?: boolean
  scrollable?: boolean
  contentClassName?: string
}
export const ModalDialog = React.forwardRef<HTMLDivElement, ModalDialogProps>(
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
    }: ModalDialogProps,
    ref
  ) => {
    bsPrefix = useBootstrapPrefix(bsPrefix, "modal")
    const dialogClass = `${bsPrefix}-dialog`
    const fullScreenClass =
      typeof fullscreen === "string"
        ? `${bsPrefix}-fullscreen-${fullscreen}`
        : `${bsPrefix}-fullscreen`
    return (
      <div
        {...ps}
        ref={ref}
        className={classNames(
          dialogClass,
          className,
          size && `${bsPrefix}-${size}`,
          centered && `${dialogClass}-centered`,
          scrollable && `${dialogClass}-scrollable`,
          fullscreen && fullScreenClass
        )}
      >
        <div className={classNames(`${bsPrefix}-content`, contentClassName)}>{children}</div>
      </div>
    )
  }
)
ModalDialog.displayName = "ModalDialog"
export interface ModalHeaderProps extends AbstractModalHeaderProps, BsPrefixOnlyProps {}
export const ModalHeader = React.forwardRef<HTMLDivElement, ModalHeaderProps>(
  ({ bsPrefix, className, ...ps }, ref) => {
    bsPrefix = useBootstrapPrefix(bsPrefix, "modal-header")
    return <AbstractModalHeader ref={ref} {...ps} className={classNames(className, bsPrefix)} />
  }
)
ModalHeader.displayName = "ModalHeader"
ModalHeader.defaultProps = { closeLabel: "Close", closeButton: false }
export interface ModalProps
  extends Omit<
    BaseModalProps,
    "role" | "renderBackdrop" | "renderDialog" | "transition" | "backdropTransition" | "children"
  > {
  size?: "sm" | "lg" | "xl"
  fullscreen?: true | "sm-down" | "md-down" | "lg-down" | "xl-down" | "xxl-down"
  bsPrefix?: string
  centered?: boolean
  backdropClassName?: string
  animation?: boolean
  dialogClassName?: string
  contentClassName?: string
  dialogAs?: React.ElementType
  scrollable?: boolean
  [k: string]: any
}
function DialogTransition(props) {
  return <Fade {...props} timeout={null} />
}
function BackdropTransition(props) {
  return <Fade {...props} timeout={null} />
}
export const Modal: BsPrefixRefForwardingComponent<"div", ModalProps> = React.forwardRef(
  (
    {
      bsPrefix,
      className,
      style,
      dialogClassName,
      contentClassName,
      children,
      dialogAs: Dialog,
      "aria-labelledby": ariaLabelledby,
      /* BaseModal props */
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
      ...props
    },
    ref
  ) => {
    const [modalStyle, setStyle] = useState({})
    const [animateStaticModal, setAnimateStaticModal] = useState(false)
    const waitingForMouseUpRef = useRef(false)
    const ignoreBackdropClickRef = useRef(false)
    const removeStaticModalAnimationRef = useRef<(() => void) | null>(null)
    const [modal, setModalRef] = useCallbackRef<ModalInstance>()
    const mergedRef = useMergedRefs(ref, setModalRef)
    const handleHide = useEventCallback(onHide)
    const isRTL = useIsRTL()
    bsPrefix = useBootstrapPrefix(bsPrefix, "modal")
    const modalContext = useMemo(
      () => ({
        onHide: handleHide,
      }),
      [handleHide]
    )
    function getModalManager() {
      if (propsManager) return propsManager
      return getSharedManager({ isRTL })
    }
    function updateDialogStyle(node) {
      if (!canUseDOM) return
      const containerIsOverflowing = getModalManager().getScrollbarWidth() > 0
      const modalIsOverflowing =
        node.scrollHeight > ownerDocument(node).documentElement.clientHeight
      setStyle({
        paddingRight:
          containerIsOverflowing && !modalIsOverflowing ? getScrollbarSize() : undefined,
        paddingLeft: !containerIsOverflowing && modalIsOverflowing ? getScrollbarSize() : undefined,
      })
    }
    const handleWindowResize = useEventCallback(() => {
      if (modal) {
        updateDialogStyle(modal.dialog)
      }
    })
    useWillUnmount(() => {
      removeEventListener(window as any, "resize", handleWindowResize)
      removeStaticModalAnimationRef.current?.()
    })
    const handleDialogMouseDown = () => {
      waitingForMouseUpRef.current = true
    }
    const handleMouseUp = e => {
      if (waitingForMouseUpRef.current && modal && e.target === modal.dialog) {
        ignoreBackdropClickRef.current = true
      }
      waitingForMouseUpRef.current = false
    }
    const handleStaticModalAnimation = () => {
      setAnimateStaticModal(true)
      removeStaticModalAnimationRef.current = transitionEnd(modal!.dialog as any, () => {
        setAnimateStaticModal(false)
      })
    }
    const handleStaticBackdropClick = e => {
      if (e.target !== e.currentTarget) {
        return
      }
      handleStaticModalAnimation()
    }
    const handleClick = e => {
      if (backdrop === "static") {
        handleStaticBackdropClick(e)
        return
      }
      if (ignoreBackdropClickRef.current || e.target !== e.currentTarget) {
        ignoreBackdropClickRef.current = false
        return
      }
      onHide?.()
    }
    const handleEscapeKeyDown = e => {
      if (!keyboard && backdrop === "static") {
        e.preventDefault()
        handleStaticModalAnimation()
      } else if (keyboard && onEscapeKeyDown) {
        onEscapeKeyDown(e)
      }
    }
    const handleEnter = (node, isAppearing) => {
      if (node) {
        node.style.display = "block"
        updateDialogStyle(node)
      }
      onEnter?.(node, isAppearing)
    }
    const handleExit = node => {
      removeStaticModalAnimationRef.current?.()
      onExit?.(node)
    }
    const handleEntering = (node, isAppearing) => {
      onEntering?.(node, isAppearing)
      addEventListener(window as any, "resize", handleWindowResize)
    }
    const handleExited = node => {
      if (node) node.style.display = ""
      onExited?.(node)
      removeEventListener(window as any, "resize", handleWindowResize)
    }
    const renderBackdrop = useCallback(
      backdropProps => (
        <div
          {...backdropProps}
          className={classNames(`${bsPrefix}-backdrop`, backdropClassName, !animation && "show")}
        />
      ),
      [animation, backdropClassName, bsPrefix]
    )
    const baseModalStyle = { ...style, ...modalStyle }
    if (!animation) {
      baseModalStyle.display = "block"
    }
    const renderDialog = dialogProps => (
      <div
        role="dialog"
        {...dialogProps}
        style={baseModalStyle}
        className={classNames(className, bsPrefix, animateStaticModal && `${bsPrefix}-static`)}
        onClick={backdrop ? handleClick : undefined}
        onMouseUp={handleMouseUp}
        aria-labelledby={ariaLabelledby}
      >
        {/*
        // @ts-ignore */}
        <Dialog
          {...props}
          onMouseDown={handleDialogMouseDown}
          className={dialogClassName}
          contentClassName={contentClassName}
        >
          {children}
        </Dialog>
      </div>
    )
    return (
      <ModalContext.Provider value={modalContext}>
        <BaseModal
          show={show}
          ref={mergedRef}
          backdrop={backdrop}
          container={container}
          keyboard
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
  dialogAs: ModalDialog,
}
Object.assign(Modal, {
  Body: ModalBody,
  Header: ModalHeader,
  Title: ModalTitle,
  Footer: ModalFooter,
  Dialog: ModalDialog,
  TRANSITION_DURATION: 300,
  BACKDROP_TRANSITION_DURATION: 150,
})
