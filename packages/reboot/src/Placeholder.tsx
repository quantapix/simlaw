import { Button as B } from "./Button.jsx"
import { usePlaceholder, Props as _Props } from "./use.jsx"
import * as qr from "react"
import type * as qt from "./types.jsx"

export interface ButtonProps extends Props {
  variant?: qt.ButtonVariant
}

export const Button: qt.BsRef<"button", ButtonProps> = qr.forwardRef<
  HTMLButtonElement,
  ButtonProps
>((xs, ref) => {
  const ps = usePlaceholder(xs)
  return <B {...ps} ref={ref} disabled tabIndex={-1} />
})

Button.displayName = "PlaceholderButton"

export interface Props extends _Props, qt.BsProps {}

export const Placeholder: qt.BsRef<"span", Props> = qr.forwardRef<
  HTMLElement,
  Props
>(({ as: X = "span", ...xs }, ref) => {
  const ps = usePlaceholder(xs)
  return <X {...ps} ref={ref} />
})
Placeholder.displayName = "Placeholder"
