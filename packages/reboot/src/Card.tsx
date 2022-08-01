import { BsPrefixProps, BsPrefixRefForwardingComponent } from "./utils"
import { Color, Variant } from "./types"
import { useBootstrapPrefix } from "./ThemeProvider"
import { useMemo } from "react"
import * as React from "react"
import classNames from "classnames"
import createWithBsPrefix from "./createWithBsPrefix"
import divWithClassName from "./divWithClassName"

export default createWithBsPrefix("card-columns")
export default createWithBsPrefix("card-group")

const DivStyledAsH5 = divWithClassName("h5")
const DivStyledAsH6 = divWithClassName("h6")
const CardBody = createWithBsPrefix("card-body")
const CardTitle = createWithBsPrefix("card-title", { Component: DivStyledAsH5 })
const CardSubtitle = createWithBsPrefix("card-subtitle", { Component: DivStyledAsH6 })
const CardLink = createWithBsPrefix("card-link", { Component: "a" })
const CardText = createWithBsPrefix("card-text", { Component: "p" })
const CardFooter = createWithBsPrefix("card-footer")
const CardImgOverlay = createWithBsPrefix("card-img-overlay")
export interface CardHeaderProps extends BsPrefixProps, React.HTMLAttributes<HTMLElement> {}
export const CardHeader: BsPrefixRefForwardingComponent<"div", CardHeaderProps> = React.forwardRef<
  HTMLElement,
  CardHeaderProps
>(({ bsPrefix, className, as: Component = "div", ...ps }, ref) => {
  const prefix = useBootstrapPrefix(bsPrefix, "card-header")
  const contextValue = useMemo(
    () => ({
      cardHeaderBsPrefix: prefix,
    }),
    [prefix]
  )
  return (
    <CardHeaderContext.Provider value={contextValue}>
      <Component ref={ref} {...ps} className={classNames(className, prefix)} />
    </CardHeaderContext.Provider>
  )
})
CardHeader.displayName = "CardHeader"
interface CardHeaderContextValue {
  cardHeaderBsPrefix: string
}
export const CardHeaderContext = React.createContext<CardHeaderContextValue | null>(null)
CardHeaderContext.displayName = "CardHeaderContext"
export interface CardImgProps extends BsPrefixProps, React.ImgHTMLAttributes<HTMLImageElement> {
  variant?: "top" | "bottom"
}
export const CardImg: BsPrefixRefForwardingComponent<"img", CardImgProps> = React.forwardRef(
  ({ bsPrefix, className, variant, as: Component = "img", ...ps }: CardImgProps, ref) => {
    const prefix = useBootstrapPrefix(bsPrefix, "card-img")
    return (
      <Component
        ref={ref}
        className={classNames(variant ? `${prefix}-${variant}` : prefix, className)}
        {...ps}
      />
    )
  }
)
CardImg.displayName = "CardImg"
export interface CardProps extends BsPrefixProps, React.HTMLAttributes<HTMLElement> {
  bg?: Variant
  text?: Color
  border?: Variant
  body?: boolean
}
export const Card: BsPrefixRefForwardingComponent<"div", CardProps> = React.forwardRef<
  HTMLElement,
  CardProps
>(
  (
    { bsPrefix, className, bg, text, border, body, children, as: Component = "div", ...ps },
    ref
  ) => {
    const prefix = useBootstrapPrefix(bsPrefix, "card")
    return (
      <Component
        ref={ref}
        {...ps}
        className={classNames(
          className,
          prefix,
          bg && `bg-${bg}`,
          text && `text-${text}`,
          border && `border-${border}`
        )}
      >
        {body ? <CardBody>{children}</CardBody> : children}
      </Component>
    )
  }
)
Card.displayName = "Card"
Card.defaultProps = { body: false }
Object.assign(Card, {
  Img: CardImg,
  Title: CardTitle,
  Subtitle: CardSubtitle,
  Body: CardBody,
  Link: CardLink,
  Text: CardText,
  Header: CardHeader,
  Footer: CardFooter,
  ImgOverlay: CardImgOverlay,
})
