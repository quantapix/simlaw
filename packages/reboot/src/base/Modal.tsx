import { activeElement, contains, canUseDOM, listen } from "./utils.js"
import { Manager } from "./Manager.js"
import * as qh from "../hooks.js"
import * as qr from "react"
import * as qu from "./use.js"
import ReactDOM from "react-dom"
import type * as qt from "./types.js"

let manager: Manager

function getManager(x?: Window) {
  if (!manager) manager = new Manager({ ownerDocument: x?.document })
  return manager
}

export type Transition = qr.ComponentType<
  {
    in: boolean
    appear?: boolean
    children?:
      | string
      | number
      | boolean
      | qr.ReactFragment
      | JSX.Element
      | null
      | undefined
    unmountOnExit?: boolean
  } & qt.TransitionCBs
>

export interface DialogProps {
  style: qr.CSSProperties | undefined
  className: string | undefined
  tabIndex: number
  role: string
  ref: qr.RefCallback<Element>
  "aria-modal": boolean | undefined
}

export interface BackdropProps {
  ref: qr.RefCallback<Element>
  onClick: (e: qr.SyntheticEvent) => void
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
  renderDialog?: (ps: DialogProps) => qr.ReactNode
  renderBackdrop?: (ps: BackdropProps) => qr.ReactNode
  onEscapeKeyDown?: (e: KeyboardEvent) => void
  onBackdropClick?: (e: qr.SyntheticEvent) => void
  keyboard?: boolean
  transition?: Transition
  backdropTransition?: Transition
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

function useModalManager(x?: Manager) {
  const window = qu.useWindow()
  const m = x || getManager(window)
  const modal = qr.useRef({
    dialog: null as any as HTMLElement,
    backdrop: null as any as HTMLElement,
  })
  return Object.assign(modal.current, {
    add: () => m.add(modal.current),
    remove: () => m.remove(modal.current),
    isTopModal: () => m.isTopModal(modal.current),
    setDialogRef: qr.useCallback((e: HTMLElement | null) => {
      modal.current.dialog = e!
    }, []),
    setBackdropRef: qr.useCallback((e: HTMLElement | null) => {
      modal.current.backdrop = e!
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
      renderBackdrop = (xs: BackdropProps) => <div {...xs} />,
      manager: _manager,
      container: _container,
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
    const container = qu.useWaitForDOMRef(_container)
    const modal = useModalManager(_manager)
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
    const doShow = qh.useEventCB(() => {
      modal.add()
      removeKeydownListenerRef.current = listen(
        document as any,
        "keydown",
        doDocumentKeyDown
      )
      removeFocusListenerRef.current = listen(
        document as any,
        "focus",
        () => setTimeout(doEnforceFocus),
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
    const doHide = qh.useEventCB(() => {
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
      doShow()
    }, [show, container, doShow])
    qr.useEffect(() => {
      if (!exited) return
      doHide()
    }, [exited, doHide])
    qh.useWillUnmount(() => {
      doHide()
    })
    const doEnforceFocus = qh.useEventCB(() => {
      if (!enforceFocus || !isMounted() || !modal.isTopModal()) {
        return
      }
      const e = activeElement()
      if (modal.dialog && e && !contains(modal.dialog, e)) {
        modal.dialog.focus()
      }
    })
    const doBackdropClick = qh.useEventCB((e: qr.SyntheticEvent) => {
      if (e.target !== e.currentTarget) {
        return
      }
      onBackdropClick?.(e)
      if (backdrop === true) {
        onHide()
      }
    })
    const doDocumentKeyDown = qh.useEventCB((e: KeyboardEvent) => {
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
    const doHidden: qt.TransitionCBs["onExited"] = (...args) => {
      setExited(true)
      onExited?.(...args)
    }
    const T = transition
    if (!container || !(show || (T && !exited))) {
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
    if (T) {
      dialog = (
        <T
          appear
          unmountOnExit
          in={!!show}
          onExit={onExit}
          onExiting={onExiting}
          onExited={doHidden}
          onEnter={onEnter}
          onEntering={onEntering}
          onEntered={onEntered}
        >
          {dialog}
        </T>
      )
    }
    let elem = null
    if (backdrop) {
      const B = backdropTransition
      elem = renderBackdrop({
        ref: modal.setBackdropRef,
        onClick: doBackdropClick,
      })
      if (B) {
        elem = (
          <B appear in={!!show}>
            {elem}
          </B>
        )
      }
    }
    return (
      <>
        {ReactDOM.createPortal(
          <>
            {elem}
            {dialog}
          </>,
          container
        )}
      </>
    )
  }
)
Modal.displayName = "Modal"
