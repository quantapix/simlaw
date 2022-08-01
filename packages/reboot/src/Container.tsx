import { BsPrefixProps, BsPrefixRefForwardingComponent } from "./utils"
import { useBootstrapPrefix } from "./ThemeProvider"
import * as React from "react"
import classNames from "classnames"
export interface ContainerProps extends BsPrefixProps, React.HTMLAttributes<HTMLElement> {
  fluid?: boolean | "sm" | "md" | "lg" | "xl" | "xxl"
}
const defaultProps = {
  fluid: false,
}
export const Container: BsPrefixRefForwardingComponent<"div", ContainerProps> = React.forwardRef<
  HTMLElement,
  ContainerProps
>(({ bsPrefix, fluid, as: Component = "div", className, ...ps }, ref) => {
  const prefix = useBootstrapPrefix(bsPrefix, "container")
  const suffix = typeof fluid === "string" ? `-${fluid}` : "-fluid"
  return (
    <Component
      ref={ref}
      {...ps}
      className={classNames(className, fluid ? `${prefix}${suffix}` : prefix)}
    />
  )
})
Container.displayName = "Container"
Container.defaultProps = defaultProps
