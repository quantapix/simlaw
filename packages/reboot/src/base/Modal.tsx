import { activeElement, contains, canUseDOM, listen } from "./utils.js"
import {
  useState,
  useRef,
  useCallback,
  useImperativeHandle,
  forwardRef,
  useEffect,
} from "react"
import * as React from "react"
import ReactDOM from "react-dom"
import {
  useMounted,
  useWillUnmount,
  usePrevious,
  useEventCallback,
} from "../hooks.js"
import ModalManager from "./ModalManager.jsx"
import type { TransitionCallbacks } from "./types.js"
import { DOMContainer, useWaitForDOMRef, useWindow } from "./use.js"
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
  [other: string]: any
}
function getManager(window?: Window) {
  if (!manager) manager = new ModalManager({ ownerDocument: window?.document })
  return manager
}
function useModalManager(provided?: ModalManager) {
  const window = useWindow()
  const modalManager = provided || getManager(window)
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
export const Modal: React.ForwardRefExoticComponent<
  ModalProps & React.RefAttributes<ModalHandle>
> = forwardRef(
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
      removeKeydownListenerRef.current = listen(
        document as any,
        "keydown",
        handleDocumentKeyDown
      )
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
      if (
        modal.dialog &&
        currentActiveElement &&
        !contains(modal.dialog, currentActiveElement)
      ) {
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
      <div {...dialogProps}>
        {React.cloneElement(children!, { role: "document" })}
      </div>
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
