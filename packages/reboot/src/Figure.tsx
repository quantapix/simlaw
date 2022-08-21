import { classNames } from "./helpers.js"
import { Image as X, Props } from "./Image.jsx"
import { withBs } from "./utils.jsx"
import * as qr from "react"

export const Image = qr.forwardRef<HTMLImageElement, Props>(
  ({ className, ...ps }, ref) => (
    <X ref={ref} {...ps} className={classNames(className, "figure-img")} />
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
