import classNames from "classnames"
import * as React from "react"
import { useBootstrapPrefix } from "./ThemeProvider"
import { BsPrefixOnlyProps } from "./utils"
export interface ImageProps extends BsPrefixOnlyProps, React.ImgHTMLAttributes<HTMLImageElement> {
  fluid?: boolean
  rounded?: boolean
  roundedCircle?: boolean
  thumbnail?: boolean
}
const defaultProps = {
  fluid: false,
  rounded: false,
  roundedCircle: false,
  thumbnail: false,
}
export const Image = React.forwardRef<HTMLImageElement, ImageProps>(
  ({ bsPrefix, className, fluid, rounded, roundedCircle, thumbnail, ...ps }, ref) => {
    bsPrefix = useBootstrapPrefix(bsPrefix, "img")
    return (
      <img
        ref={ref}
        {...ps}
        className={classNames(
          className,
          fluid && `${bsPrefix}-fluid`,
          rounded && `rounded`,
          roundedCircle && `rounded-circle`,
          thumbnail && `${bsPrefix}-thumbnail`
        )}
      />
    )
  }
)
Image.displayName = "Image"
Image.defaultProps = defaultProps
