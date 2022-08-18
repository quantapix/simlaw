import * as React from "react"
import type { BsProps, BsRef } from "./helpers.js"
import { usePlaceholder, Props as _Props } from "./use.jsx"
import { Button as B } from "./Button.jsx"
import type { ButtonVariant } from "./types.jsx"

export interface ButtonProps extends Props {
  variant?: ButtonVariant
}

export const Button: BsRef<"button", ButtonProps> = React.forwardRef<
  HTMLButtonElement,
  ButtonProps
>((xs, ref) => {
  const ps = usePlaceholder(xs)
  return <B {...ps} ref={ref} disabled tabIndex={-1} />
})

Button.displayName = "PlaceholderButton"

export interface Props extends _Props, BsProps {}

export const Placeholder: BsRef<"span", Props> = React.forwardRef<
  HTMLElement,
  Props
>(({ as: X = "span", ...xs }, ref) => {
  const ps = usePlaceholder(xs)
  return <X {...ps} ref={ref} />
})
Placeholder.displayName = "Placeholder"
