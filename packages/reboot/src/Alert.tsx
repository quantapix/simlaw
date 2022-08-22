import { Anchor } from "./base/Anchor.jsx"
import { classNames, TransitionType } from "./helpers.js"
import { Close, Variant as CloseVariant } from "./Button.jsx"
import { divAs, withBs } from "./utils.jsx"
import { Fade } from "./Fade.jsx"
import { useBs } from "./Theme.jsx"
import * as qh from "./hooks.js"
import * as qr from "react"
import type { Variant } from "./types.jsx"

export const Link = withBs("alert-link", {
  Component: Anchor,
})

const DivAsH4 = divAs("h4")
DivAsH4.displayName = "DivStyledAsH4"
export const Heading = withBs("alert-heading", {
  Component: DivAsH4,
})

export interface Props extends qr.HTMLAttributes<HTMLDivElement> {
  bsPrefix?: string
  variant?: Variant
  dismissible?: boolean
  show?: boolean
  onClose?: (a: any, b: any) => void
  closeLabel?: string
  closeVariant?: CloseVariant
  transition?: TransitionType
}

export const Alert = qr.forwardRef<HTMLDivElement, Props>((xs: Props, ref) => {
  const {
    bsPrefix,
    children,
    className,
    closeLabel,
    closeVariant,
    dismissible,
    onClose,
    show,
    transition,
    variant,
    ...ps
  } = qh.useUncontrolled(xs, { show: "onClose" })
  const bs = useBs(bsPrefix, "alert")
  const click = qh.useEventCallback(e => {
    if (onClose) {
      onClose(false, e)
    }
  })
  const X = transition === true ? Fade : transition
  const alert = (
    <div
      role="alert"
      {...(!X ? ps : undefined)}
      ref={ref}
      className={classNames(
        className,
        bs,
        variant && `${bs}-${variant}`,
        dismissible && `${bs}-dismissible`
      )}
    >
      {dismissible && (
        <Close onClick={click} aria-label={closeLabel} variant={closeVariant} />
      )}
      {children}
    </div>
  )
  if (!X) return show ? alert : null
  return (
    <X unmountOnExit {...ps} ref={undefined} in={show}>
      {alert}
    </X>
  )
})
Alert.displayName = "Alert"
Alert.defaultProps = {
  variant: "primary",
  show: true,
  transition: Fade,
  closeLabel: "Close alert",
}
