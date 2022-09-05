import { divAs, withBs } from "./utils.js"
import { useBs } from "./Theme.js"
import * as qr from "react"
import * as qt from "./types.js"

interface Data {
  headerBs: string
}

export const Context = qr.createContext<Data | null>(null)
Context.displayName = "CardHeaderContext"

export interface HeaderProps
  extends qt.BsProps,
    qr.HTMLAttributes<HTMLElement> {}

export const Header: qt.BsRef<"div", HeaderProps> = qr.forwardRef<
  HTMLElement,
  HeaderProps
>(({ bsPrefix, className, as: X = "div", ...ps }, ref) => {
  const bs = useBs(bsPrefix, "card-header")
  const v = qr.useMemo(
    () => ({
      headerBs: bs,
    }),
    [bs]
  )
  return (
    <Context.Provider value={v}>
      <X ref={ref} {...ps} className={qt.classNames(className, bs)} />
    </Context.Provider>
  )
})
Header.displayName = "CardHeader"

export const Body = withBs("card-body")

const DivAsH5 = divAs("h5")
export const Title = withBs("card-title", {
  Component: DivAsH5,
})

const DivAsH6 = divAs("h6")
export const Subtitle = withBs("card-subtitle", {
  Component: DivAsH6,
})

export const Link = withBs("card-link", { Component: "a" })
export const Text = withBs("card-text", { Component: "p" })
export const Footer = withBs("card-footer")
export const ImgOverlay = withBs("card-img-overlay")

export interface ImgProps
  extends qt.BsProps,
    qr.ImgHTMLAttributes<HTMLImageElement> {
  variant?: "top" | "bottom" | string
}

export const Img: qt.BsRef<"img", ImgProps> = qr.forwardRef(
  ({ bsPrefix, className, variant, as: X = "img", ...ps }: ImgProps, ref) => {
    const bs = useBs(bsPrefix, "card-img")
    return (
      <X
        ref={ref}
        className={qt.classNames(variant ? `${bs}-${variant}` : bs, className)}
        {...ps}
      />
    )
  }
)
Img.displayName = "CardImg"

export const Group = withBs("card-group")

export interface Props extends qt.BsProps, qr.HTMLAttributes<HTMLElement> {
  bg?: qt.Variant
  text?: qt.Color
  border?: qt.Variant
  body?: boolean
}

export const Card: qt.BsRef<"div", Props> = qr.forwardRef<HTMLElement, Props>(
  (
    {
      bsPrefix,
      className,
      bg,
      text,
      border,
      body,
      children,
      as: X = "div",
      ...ps
    },
    ref
  ) => {
    const bs = useBs(bsPrefix, "card")
    return (
      <X
        ref={ref}
        {...ps}
        className={qt.classNames(
          className,
          bs,
          bg && `bg-${bg}`,
          text && `text-${text}`,
          border && `border-${border}`
        )}
      >
        {body ? <Body>{children}</Body> : children}
      </X>
    )
  }
)
Card.displayName = "Card"
Card.defaultProps = {
  body: false,
}
