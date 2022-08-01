import { Image, ImageProps } from "./Image"
import * as React from "react"
import classNames from "classnames"
import createWithBsPrefix from "./utils"
export const FigureCaption = createWithBsPrefix("figure-caption", { Component: "figcaption" })
const defaultProps = { fluid: true }
export const FigureImage = React.forwardRef<HTMLImageElement, ImageProps>(
  ({ className, ...ps }, ref) => (
    <Image ref={ref} {...ps} className={classNames(className, "figure-img")} />
  )
)
FigureImage.displayName = "FigureImage"
FigureImage.defaultProps = defaultProps
export const Figure = createWithBsPrefix("figure", { Component: "figure" })
Object.assign(Figure, {
  Image: FigureImage,
  Caption: FigureCaption,
})
