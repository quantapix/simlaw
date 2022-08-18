import * as React from "react"
import { useBs } from "./Theme.jsx"
import { classNames, BsOnlyProps } from "./helpers.js"

export interface Props
  extends BsOnlyProps,
    React.ImgHTMLAttributes<HTMLImageElement> {
  fluid?: boolean
  rounded?: boolean
  roundedCircle?: boolean
  thumbnail?: boolean
}

export const Image = React.forwardRef<HTMLImageElement, Props>(
  (
    { bsPrefix, className, fluid, rounded, roundedCircle, thumbnail, ...ps },
    ref
  ) => {
    bsPrefix = useBs(bsPrefix, "img")
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
Image.defaultProps = {
  fluid: false,
  rounded: false,
  roundedCircle: false,
  thumbnail: false,
}
