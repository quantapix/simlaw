import { Close, Variant as CloseVariant } from "./Button.js"
import { Fade, Props as FProps } from "./Fade.js"
import { useBs } from "./Theme.js"
import * as qh from "./hooks.js"
import * as qr from "react"
import * as qt from "./types.js"
import * as qu from "./utils.js"
import type { Transition } from "react-transition-group"

export interface Data {
  onClose?: ((e?: qr.MouseEvent | qr.KeyboardEvent) => void) | undefined
}

export const Context = qr.createContext<Data>({
  onClose() {},
})

export interface HeaderProps
  extends qt.BsOnlyProps,
    qr.HTMLAttributes<HTMLDivElement> {
  closeLabel?: string
  closeVariant?: CloseVariant
  closeButton?: boolean
}

export const Header = qr.forwardRef<HTMLDivElement, HeaderProps>(
  (
    {
      bsPrefix,
      closeLabel,
      closeVariant,
      closeButton,
      className,
      children,
      ...ps
    }: HeaderProps,
    ref
  ) => {
    bsPrefix = useBs(bsPrefix, "toast-header")
    const context = qr.useContext(Context)
    const doClick = qh.useEventCB(e => {
      context?.onClose?.(e)
    })
    return (
      <div ref={ref} {...ps} className={qt.classNames(bsPrefix, className)}>
        {children}
        {closeButton && (
          <Close
            aria-label={closeLabel}
            variant={closeVariant}
            onClick={doClick}
            data-dismiss="toast"
          />
        )}
      </div>
    )
  }
)
Header.displayName = "ToastHeader"
Header.defaultProps = {
  closeLabel: "Close",
  closeButton: true,
}

export const Body = qu.withBs("toast-body")

const styles = {
  [qu.ENTERING]: "showing",
  [qu.ENTERED]: "",
  [qu.EXITING]: "showing show",
  [qu.EXITED]: "",
  [qu.UNMOUNTED]: "",
}

export const ToastFade = qr.forwardRef<Transition<any>, FProps>((ps, ref) => (
  <Fade {...ps} ref={ref} transitionClasses={styles} />
))
ToastFade.displayName = "ToastFade"

export interface Props extends qt.BsProps, qr.HTMLAttributes<HTMLElement> {
  animation?: boolean
  autohide?: boolean
  delay?: number
  onClose?: (e?: qr.MouseEvent | qr.KeyboardEvent) => void
  show?: boolean
  transition?: qt.Transition2
  bg?: qt.Variant
}

export const Toast: qt.BsRef<"div", Props> = qr.forwardRef<
  HTMLDivElement,
  Props
>(
  (
    {
      bsPrefix,
      className,
      transition: X = ToastFade,
      show = true,
      animation = true,
      delay = 5000,
      autohide = false,
      onClose,
      bg,
      ...ps
    },
    ref
  ) => {
    const bs = useBs(bsPrefix, "toast")
    const delayRef = qr.useRef(delay)
    const onCloseRef = qr.useRef(onClose)
    qr.useEffect(() => {
      delayRef.current = delay
      onCloseRef.current = onClose
    }, [delay, onClose])
    const autohideTimeout = qh.useTimeout()
    const autohideToast = !!(autohide && show)
    const cb = qr.useCallback(() => {
      if (autohideToast) {
        onCloseRef.current?.()
      }
    }, [autohideToast])
    qr.useEffect(() => {
      autohideTimeout.set(cb, delayRef.current)
    }, [autohideTimeout, cb])
    const v = qr.useMemo(
      () => ({
        onClose,
      }),
      [onClose]
    )
    const hasAnimation = !!(X && animation)
    const toast = (
      <div
        {...ps}
        ref={ref}
        className={qt.classNames(
          bs,
          className,
          bg && `bg-${bg}`,
          !hasAnimation && (show ? "show" : "hide")
        )}
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
      />
    )
    return (
      <Context.Provider value={v}>
        {hasAnimation && X && typeof X !== "boolean" ? (
          <X in={show} unmountOnExit>
            {toast}
          </X>
        ) : (
          toast
        )}
      </Context.Provider>
    )
  }
)
Toast.displayName = "Toast"

export type Position =
  | "top-start"
  | "top-center"
  | "top-end"
  | "middle-start"
  | "middle-center"
  | "middle-end"
  | "bottom-start"
  | "bottom-center"
  | "bottom-end"

export interface ContainerProps
  extends qt.BsProps,
    qr.HTMLAttributes<HTMLElement> {
  position?: Position
  containerPosition?: string
}

const positionClasses = {
  "top-start": "top-0 start-0",
  "top-center": "top-0 start-50 translate-middle-x",
  "top-end": "top-0 end-0",
  "middle-start": "top-50 start-0 translate-middle-y",
  "middle-center": "top-50 start-50 translate-middle",
  "middle-end": "top-50 end-0 translate-middle-y",
  "bottom-start": "bottom-0 start-0",
  "bottom-center": "bottom-0 start-50 translate-middle-x",
  "bottom-end": "bottom-0 end-0",
}

export const Container: qt.BsRef<"div", ContainerProps> = qr.forwardRef<
  HTMLDivElement,
  ContainerProps
>(
  (
    {
      bsPrefix,
      position,
      containerPosition = "absolute",
      className,
      as: X = "div",
      ...ps
    },
    ref
  ) => {
    const bs = useBs(bsPrefix, "toast-container")
    return (
      <X
        ref={ref}
        {...ps}
        className={qt.classNames(
          bs,
          position && [
            containerPosition ? `position-${containerPosition}` : null,
            positionClasses[position],
          ],
          className
        )}
      />
    )
  }
)
Container.displayName = "ToastContainer"
