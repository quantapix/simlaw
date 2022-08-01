import { BsPrefixProps, BsPrefixRefForwardingComponent } from "./utils"
import { ButtonVariant } from "./types"
import * as React from "react"
import Button from "./Button"
import usePlaceholder, { UsePlaceholderProps } from "./usePlaceholder"
export interface PlaceholderButtonProps extends UsePlaceholderProps {
  variant?: ButtonVariant
}
export const PlaceholderButton: BsPrefixRefForwardingComponent<"button", PlaceholderButtonProps> =
  React.forwardRef<HTMLButtonElement, PlaceholderButtonProps>((ps, ref) => {
    const ys = usePlaceholder(ps)
    return <Button {...ys} ref={ref} disabled tabIndex={-1} />
  })
PlaceholderButton.displayName = "PlaceholderButton"
export interface PlaceholderProps extends UsePlaceholderProps, BsPrefixProps {}
export const Placeholder: BsPrefixRefForwardingComponent<"span", PlaceholderProps> =
  React.forwardRef<HTMLElement, PlaceholderProps>(({ as: Component = "span", ...props }, ref) => {
    const placeholderProps = usePlaceholder(props)
    return <Component {...placeholderProps} ref={ref} />
  })
Placeholder.displayName = "Placeholder"
Object.assign(Placeholder, { Button: PlaceholderButton })
