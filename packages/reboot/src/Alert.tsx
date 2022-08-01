import { TransitionType } from "./utils"
import { useBootstrapPrefix } from "./ThemeProvider"
import { useUncontrolled } from "uncontrollable"
import { Variant } from "./types"
import * as React from "react"
import { Anchor } from "./Anchor"
import classNames from "classnames"
import { CloseButton, CloseButtonVariant } from "./CloseButton"
import createWithBsPrefix from "./createWithBsPrefix"
import divWithClassName from "./divWithClassName"
import { Fade } from "./Fade"
import useEventCallback from "@restart/hooks/useEventCallback"
export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  bsPrefix?: string
  variant?: Variant
  dismissible?: boolean
  show?: boolean
  onClose?: (a: any, b: any) => void
  closeLabel?: string
  closeVariant?: CloseButtonVariant
  transition?: TransitionType
}
const DivStyledAsH4 = divWithClassName("h4")
DivStyledAsH4.displayName = "DivStyledAsH4"
const AlertHeading = createWithBsPrefix("alert-heading", {
  Component: DivStyledAsH4,
})
const AlertLink = createWithBsPrefix("alert-link", {
  Component: Anchor,
})
export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  (uncontrolledProps: AlertProps, ref) => {
    const {
      bsPrefix,
      show,
      closeLabel,
      closeVariant,
      className,
      children,
      variant,
      onClose,
      dismissible,
      transition,
      ...props
    } = useUncontrolled(uncontrolledProps, {
      show: "onClose",
    })
    const prefix = useBootstrapPrefix(bsPrefix, "alert")
    const handleClose = useEventCallback(e => {
      if (onClose) {
        onClose(false, e)
      }
    })
    const Transition = transition === true ? Fade : transition
    const alert = (
      <div
        role="alert"
        {...(!Transition ? props : undefined)}
        ref={ref}
        className={classNames(
          className,
          prefix,
          variant && `${prefix}-${variant}`,
          dismissible && `${prefix}-dismissible`
        )}
      >
        {dismissible && (
          <CloseButton onClick={handleClose} aria-label={closeLabel} variant={closeVariant} />
        )}
        {children}
      </div>
    )
    if (!Transition) return show ? alert : null
    return (
      <Transition unmountOnExit {...props} ref={undefined} in={show}>
        {alert}
      </Transition>
    )
  }
)
Alert.displayName = "Alert"
Alert.defaultProps = {
  variant: "primary",
  show: true,
  transition: Fade,
  closeLabel: "Close alert",
}
Object.assign(Alert, {
  Link: AlertLink,
  Heading: AlertHeading,
})
