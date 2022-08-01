import { CloseButton, CloseButtonVariant } from "./CloseButton"
import { ModalContext } from "./Modal"
import { useContext } from "react"
import * as React from "react"
import useEventCallback from "./use/useEventCallback"
export interface AbstractModalHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  closeLabel?: string
  closeVariant?: CloseButtonVariant
  closeButton?: boolean
  onHide?: () => void
}
export const AbstractModalHeader = React.forwardRef<HTMLDivElement, AbstractModalHeaderProps>(
  ({ closeLabel, closeVariant, closeButton, onHide, children, ...ps }, ref) => {
    const context = useContext(ModalContext)
    const handleClick = useEventCallback(() => {
      context?.onHide()
      onHide?.()
    })
    return (
      <div ref={ref} {...ps}>
        {children}
        {closeButton && (
          <CloseButton aria-label={closeLabel} variant={closeVariant} onClick={handleClick} />
        )}
      </div>
    )
  }
)
AbstractModalHeader.defaultProps = {
  closeLabel: "Close",
  closeButton: false,
}
