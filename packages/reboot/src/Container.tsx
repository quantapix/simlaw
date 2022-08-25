import { useBs } from "./Theme.jsx"
import * as qr from "react"
import * as qt from "./types.jsx"

export interface Props extends qt.BsProps, qr.HTMLAttributes<HTMLElement> {
  fluid?: boolean | string | "sm" | "md" | "lg" | "xl" | "xxl"
}

export const Container: qt.BsRef<"div", Props> = qr.forwardRef<
  HTMLElement,
  Props
>(({ bsPrefix, fluid, as: X = "div", className, ...ps }, ref) => {
  const bs = useBs(bsPrefix, "container")
  const suff = typeof fluid === "string" ? `-${fluid}` : "-fluid"
  return (
    <X
      ref={ref}
      {...ps}
      className={qt.classNames(className, fluid ? `${bs}${suff}` : bs)}
    />
  )
})
Container.displayName = "Container"
Container.defaultProps = {
  fluid: false,
}
