import { activeElement, contains, canUseDOM, listen } from "./utils.js"
import { Manager } from "./Manager.js"
import * as qh from "../hooks.js"
import * as qr from "react"
import * as qu from "./use.js"
import ReactDOM from "react-dom"
import type * as qt from "./types.js"

let manager: Manager

export type ModalTransitionComponent = qr.ComponentType<
  {
    in: boolean
    appear?: boolean
    unmountOnExit?: boolean
  } & qt.TransitionCBs
>

export interface RenderModalDialogProps {
  style: qr.CSSProperties | undefined
  className: string | undefined
  tabIndex: number
  role: string
  ref: qr.RefCallback<Element>
  "aria-modal": boolean | undefined
}

export interface RenderModalBackdropProps {
  ref: qr.RefCallback<Element>
  onClick: (event: qr.SyntheticEvent) => void
}

export interface BaseProps extends qt.TransitionCBs {
  children?: qr.ReactElement
  role?: string
  style?: qr.CSSProperties
  className?: string
  show?: boolean
  container?: qu.DOMContainer
  onShow?: () => void
  onHide?: () => void
  manager?: Manager
  backdrop?: true | false | "static"
  renderDialog?: (props: RenderModalDialogProps) => qr.ReactNode
  renderBackdrop?: (props: RenderModalBackdropProps) => qr.ReactNode
  onEscapeKeyDown?: (e: KeyboardEvent) => void
  onBackdropClick?: (e: qr.SyntheticEvent) => void
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

export interface Props extends BaseProps {
  [other: string]: any
}

function getManager(window?: Window) {
  if (!manager) manager = new Manager({ ownerDocument: window?.document })
  return manager
}

function useModalManager(provided?: Manager) {
  const window = qu.useWindow()
  const modalManager = provided || getManager(window)
  const modal = qr.useRef({
    dialog: null as any as HTMLElement,
    backdrop: null as any as HTMLElement,
  })
  return Object.assign(modal.current, {
    add: () => modalManager.add(modal.current),
    remove: () => modalManager.remove(modal.current),
    isTopModal: () => modalManager.isTopModal(modal.current),
    setDialogRef: qr.useCallback((ref: HTMLElement | null) => {
      modal.current.dialog = ref!
    }, []),
    setBackdropRef: qr.useCallback((ref: HTMLElement | null) => {
      modal.current.backdrop = ref!
    }, []),
  })
}

export interface Handle {
  dialog: HTMLElement | null
  backdrop: HTMLElement | null
}

export const Modal: qr.ForwardRefExoticComponent<
  Props & qr.RefAttributes<Handle>
> = qr.forwardRef(
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
      renderBackdrop = (xs: RenderModalBackdropProps) => <div {...xs} />,
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
      ...ps
    }: Props,
    ref: qr.Ref<Handle>
  ) => {
    const container = qu.useWaitForDOMRef(containerRef)
    const modal = useModalManager(providedManager)
    const isMounted = qh.useMounted()
    const prevShow = qh.usePrevious(show)
    const [exited, setExited] = qr.useState(!show)
    const lastFocusRef = qr.useRef<HTMLElement | null>(null)
    qr.useImperativeHandle(ref, () => modal, [modal])
    if (canUseDOM && !prevShow && show) {
      lastFocusRef.current = activeElement() as HTMLElement
    }
    if (!transition && !show && !exited) {
      setExited(true)
    } else if (show && exited) {
      setExited(false)
    }
    const handleShow = qh.useEventCallback(() => {
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
    const handleHide = qh.useEventCallback(() => {
      modal.remove()
      removeKeydownListenerRef.current?.()
      removeFocusListenerRef.current?.()
      if (restoreFocus) {
        lastFocusRef.current?.focus?.(restoreFocusOptions)
        lastFocusRef.current = null
      }
    })
    qr.useEffect(() => {
      if (!show || !container) return
      handleShow()
    }, [show, container, handleShow])
    qr.useEffect(() => {
      if (!exited) return
      handleHide()
    }, [exited, handleHide])
    qh.useWillUnmount(() => {
      handleHide()
    })
    const handleEnforceFocus = qh.useEventCallback(() => {
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
    const handleBackdropClick = qh.useEventCallback((e: qr.SyntheticEvent) => {
      if (e.target !== e.currentTarget) {
        return
      }
      onBackdropClick?.(e)
      if (backdrop === true) {
        onHide()
      }
    })
    const handleDocumentKeyDown = qh.useEventCallback((e: KeyboardEvent) => {
      if (keyboard && e.keyCode === 27 && modal.isTopModal()) {
        onEscapeKeyDown?.(e)
        if (!e.defaultPrevented) {
          onHide()
        }
      }
    })
    const removeFocusListenerRef = qr.useRef<ReturnType<typeof listen> | null>()
    const removeKeydownListenerRef = qr.useRef<ReturnType<
      typeof listen
    > | null>()
    const handleHidden: qt.TransitionCBs["onExited"] = (...args) => {
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
      ...ps,
      style,
      className,
      tabIndex: -1,
    }
    let dialog = renderDialog ? (
      renderDialog(dialogProps)
    ) : (
      <div {...dialogProps}>
        {qr.cloneElement(children!, { role: "document" })}
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
