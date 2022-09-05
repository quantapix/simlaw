import { Image as X, Props } from "./Image.js"
import { withBs } from "./utils.js"
import * as qr from "react"
import * as qt from "./types.js"

export const Image = qr.forwardRef<HTMLImageElement, Props>(
  ({ className, ...ps }, ref) => (
    <X ref={ref} {...ps} className={qt.classNames(className, "figure-img")} />
  )
)
Image.displayName = "FigureImage"
Image.defaultProps = { fluid: true }

export const Caption = withBs("figure-caption", {
  Component: "figcaption",
})

export const Figure = withBs("figure", {
  Component: "figure",
})
