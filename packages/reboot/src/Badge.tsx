import { BsPrefixProps, BsPrefixRefForwardingComponent } from "./utils"
import { Color, Variant } from "./types"
import { useBootstrapPrefix } from "./ThemeProvider"
import * as React from "react"
import classNames from "classnames"
export interface BadgeProps extends BsPrefixProps, React.HTMLAttributes<HTMLElement> {
  bg?: Variant
  pill?: boolean
  text?: Color
}
export const Badge: BsPrefixRefForwardingComponent<"span", BadgeProps> = React.forwardRef<
  HTMLElement,
  BadgeProps
>(({ bsPrefix, bg, pill, text, className, as: Component = "span", ...ps }, ref) => {
  const prefix = useBootstrapPrefix(bsPrefix, "badge")
  return (
    <Component
      ref={ref}
      {...ps}
      className={classNames(
        className,
        prefix,
        pill && `rounded-pill`,
        text && `text-${text}`,
        bg && `bg-${bg}`
      )}
    />
  )
})
Badge.displayName = "Badge"
Badge.defaultProps = {
  bg: "primary",
  pill: false,
}
