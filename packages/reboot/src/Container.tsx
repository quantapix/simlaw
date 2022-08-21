import { classNames, BsProps, BsRef } from "./helpers.js"
import { useBs } from "./Theme.jsx"
import * as qr from "react"

export interface Props extends BsProps, qr.HTMLAttributes<HTMLElement> {
  fluid?: boolean | string | "sm" | "md" | "lg" | "xl" | "xxl"
}

export const Container: BsRef<"div", Props> = qr.forwardRef<HTMLElement, Props>(
  ({ bsPrefix, fluid, as: X = "div", className, ...ps }, ref) => {
    const bs = useBs(bsPrefix, "container")
    const suff = typeof fluid === "string" ? `-${fluid}` : "-fluid"
    return (
      <X
        ref={ref}
        {...ps}
        className={classNames(className, fluid ? `${bs}${suff}` : bs)}
      />
    )
  }
)
Container.displayName = "Container"
Container.defaultProps = {
  fluid: false,
}
