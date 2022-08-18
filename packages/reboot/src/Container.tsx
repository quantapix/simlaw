import * as React from "react"
import { useBs } from "./Theme.jsx"
import { classNames, BsProps, BsRefComp } from "./helpers.js"

export interface Props extends BsProps, React.HTMLAttributes<HTMLElement> {
  fluid?: boolean | string | "sm" | "md" | "lg" | "xl" | "xxl"
}

export const Container: BsRefComp<"div", Props> = React.forwardRef<
  HTMLElement,
  Props
>(({ bsPrefix, fluid, as: X = "div", className, ...ps }, ref) => {
  const bs = useBs(bsPrefix, "container")
  const suff = typeof fluid === "string" ? `-${fluid}` : "-fluid"
  return (
    <X
      ref={ref}
      {...ps}
      className={classNames(className, fluid ? `${bs}${suff}` : bs)}
    />
  )
})
Container.displayName = "Container"
Container.defaultProps = {
  fluid: false,
}
