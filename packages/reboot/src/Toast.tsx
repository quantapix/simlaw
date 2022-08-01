import { BsPrefixProps, BsPrefixOnlyProps, BsPrefixRefForwardingComponent } from "./utils"
import { TransitionComponent } from "@restart/ui/types"
import { useBootstrapPrefix } from "./ThemeProvider"
import { useContext } from "react"
import { useEffect, useMemo, useRef, useCallback } from "react"
import { Variant } from "./types"
import * as React from "react"
import classNames from "classnames"
import { CloseButton, CloseButtonVariant } from "./CloseButton"
import createWithBsPrefix from "./createWithBsPrefix"
import { Fade, FadeProps } from "./Fade"
import Transition, { ENTERING, EXITING } from "react-transition-group/Transition"
import useEventCallback from "@restart/hooks/useEventCallback"
import useTimeout from "@restart/hooks/useTimeout"
export const ToastBody = createWithBsPrefix("toast-body")
export type ToastPosition =
  | "top-start"
  | "top-center"
  | "top-end"
  | "middle-start"
  | "middle-center"
  | "middle-end"
  | "bottom-start"
  | "bottom-center"
  | "bottom-end"
export interface ToastContainerProps extends BsPrefixProps, React.HTMLAttributes<HTMLElement> {
  position?: ToastPosition
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
export const ToastContainer: BsPrefixRefForwardingComponent<"div", ToastContainerProps> =
  React.forwardRef<HTMLDivElement, ToastContainerProps>(
    ({ bsPrefix, position, className, as: Component = "div", ...props }, ref) => {
      bsPrefix = useBootstrapPrefix(bsPrefix, "toast-container")
      return (
        <Component
          ref={ref}
          {...props}
          className={classNames(
            bsPrefix,
            position && `position-absolute ${positionClasses[position]}`,
            className
          )}
        />
      )
    }
  )
ToastContainer.displayName = "ToastContainer"
export interface ToastContextType {
  onClose?: (e: Event) => void
}
export const ToastContext = React.createContext<ToastContextType>({
  onClose() {},
})
const fadeStyles = {
  [ENTERING]: "showing",
  [EXITING]: "showing show",
}
export const ToastFade = React.forwardRef<Transition<any>, FadeProps>((props, ref) => (
  <Fade {...props} ref={ref} transitionClasses={fadeStyles} />
))
ToastFade.displayName = "ToastFade"
export interface ToastHeaderProps extends BsPrefixOnlyProps, React.HTMLAttributes<HTMLDivElement> {
  closeLabel?: string
  closeVariant?: CloseButtonVariant
  closeButton?: boolean
}
export const ToastHeader = React.forwardRef<HTMLDivElement, ToastHeaderProps>(
  (
    {
      bsPrefix,
      closeLabel,
      closeVariant,
      closeButton,
      className,
      children,
      ...props
    }: ToastHeaderProps,
    ref
  ) => {
    bsPrefix = useBootstrapPrefix(bsPrefix, "toast-header")
    const context = useContext(ToastContext)
    const handleClick = useEventCallback(e => {
      context?.onClose?.(e)
    })
    return (
      <div ref={ref} {...props} className={classNames(bsPrefix, className)}>
        {children}
        {closeButton && (
          <CloseButton
            aria-label={closeLabel}
            variant={closeVariant}
            onClick={handleClick}
            data-dismiss="toast"
          />
        )}
      </div>
    )
  }
)
ToastHeader.displayName = "ToastHeader"
ToastHeader.defaultProps = {
  closeLabel: "Close",
  closeButton: true,
}
export interface ToastProps extends BsPrefixProps, React.HTMLAttributes<HTMLElement> {
  animation?: boolean
  autohide?: boolean
  delay?: number
  onClose?: () => void
  show?: boolean
  transition?: TransitionComponent
  bg?: Variant
}
export const Toast: BsPrefixRefForwardingComponent<"div", ToastProps> = React.forwardRef<
  HTMLDivElement,
  ToastProps
>(
  (
    {
      bsPrefix,
      className,
      transition: Transition = ToastFade,
      show = true,
      animation = true,
      delay = 5000,
      autohide = false,
      onClose,
      bg,
      ...props
    },
    ref
  ) => {
    bsPrefix = useBootstrapPrefix(bsPrefix, "toast")
    const delayRef = useRef(delay)
    const onCloseRef = useRef(onClose)
    useEffect(() => {
      delayRef.current = delay
      onCloseRef.current = onClose
    }, [delay, onClose])
    const autohideTimeout = useTimeout()
    const autohideToast = !!(autohide && show)
    const autohideFunc = useCallback(() => {
      if (autohideToast) {
        onCloseRef.current?.()
      }
    }, [autohideToast])
    useEffect(() => {
      autohideTimeout.set(autohideFunc, delayRef.current)
    }, [autohideTimeout, autohideFunc])
    const toastContext = useMemo(
      () => ({
        onClose,
      }),
      [onClose]
    )
    const hasAnimation = !!(Transition && animation)
    const toast = (
      <div
        {...props}
        ref={ref}
        className={classNames(
          bsPrefix,
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
      <ToastContext.Provider value={toastContext}>
        {hasAnimation && Transition ? (
          <Transition in={show} unmountOnExit>
            {toast}
          </Transition>
        ) : (
          toast
        )}
      </ToastContext.Provider>
    )
  }
)
Toast.displayName = "Toast"
Object.assign(Toast, {
  Body: ToastBody,
  Header: ToastHeader,
})
