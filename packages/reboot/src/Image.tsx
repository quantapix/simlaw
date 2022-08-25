import { useBs } from "./Theme.jsx"
import * as qr from "react"
import * as qt from "./types.jsx"

export interface Props
  extends qt.BsOnlyProps,
    qr.ImgHTMLAttributes<HTMLImageElement> {
  fluid?: boolean
  rounded?: boolean
  roundedCircle?: boolean
  thumbnail?: boolean
}

export const Image = qr.forwardRef<HTMLImageElement, Props>(
  (
    { bsPrefix, className, fluid, rounded, roundedCircle, thumbnail, ...ps },
    ref
  ) => {
    const bs = useBs(bsPrefix, "img")
    return (
      <img
        ref={ref}
        {...ps}
        className={qt.classNames(
          className,
          fluid && `${bs}-fluid`,
          rounded && `rounded`,
          roundedCircle && `rounded-circle`,
          thumbnail && `${bs}-thumbnail`
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
