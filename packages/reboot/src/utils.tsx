import { TransitionComponent } from "@restart/ui/types"
import { useBootstrapPrefix } from "./ThemeProvider"
import * as React from "react"
import camelize from "dom-helpers/camelize"
import classNames from "classnames"
import css from "dom-helpers/css"
import Fade from "./Fade"
import ReactDOM from "react-dom"
import transitionEnd from "dom-helpers/transitionEnd"
export type Omit<T, U> = Pick<T, Exclude<keyof T, keyof U>>
export type ReplaceProps<T extends React.ElementType, U> = Omit<React.ComponentPropsWithRef<T>, U> &
  U
export interface BsPrefixOnlyProps {
  bsPrefix?: string
}
export interface AsProp<T extends React.ElementType = React.ElementType> {
  as?: T
}
export interface BsPrefixProps<T extends React.ElementType = React.ElementType>
  extends BsPrefixOnlyProps,
    AsProp<T> {}
export interface BsPrefixRefForwardingComponent<T0 extends React.ElementType, U = unknown> {
  <T extends React.ElementType = T0>(
    props: React.PropsWithChildren<ReplaceProps<T, BsPrefixProps<T> & U>>,
    context?: any
  ): React.ReactElement | null
  propTypes?: any
  contextTypes?: any
  defaultProps?: Partial<U>
  displayName?: string
}
export class BsPrefixComponent<T extends React.ElementType, U = unknown> extends React.Component<
  ReplaceProps<T, BsPrefixProps<T> & U>
> {}
export type BsPrefixComponentClass<T extends React.ElementType, U = unknown> = React.ComponentClass<
  ReplaceProps<T, BsPrefixProps<T> & U>
>
export type TransitionType = boolean | TransitionComponent
export function getOverlayDirection(placement: string, isRTL?: boolean) {
  let d = placement
  if (placement === "left") d = isRTL ? "end" : "start"
  else if (placement === "right") d = isRTL ? "start" : "end"
  return d
}
export function safeFindDOMNode(x: React.ComponentClass | Element | null | undefined) {
  if (x && "setState" in x) return ReactDOM.findDOMNode(x)
  return (x ?? null) as Element | Text | null
}
export function createChainedFunction(...xs) {
  return xs
    .filter(x => x != null)
    .reduce((y, x) => {
      if (typeof x !== "function") {
        throw new Error("Invalid Argument Type, must only provide functions, undefined, or null.")
      }
      if (y === null) return x
      return function chainedFunction(...args) {
        // @ts-ignore
        y.apply(this, args)
        // @ts-ignore
        x.apply(this, args)
      }
    }, null)
}
const pascalCase = (x: string) => x[0].toUpperCase() + camelize(x).slice(1)
interface BsPrefixOptions<T extends React.ElementType = "div"> {
  displayName?: string
  Component?: T
  defaultProps?: Partial<React.ComponentProps<T>>
}
export function createWithBsPrefix<T extends React.ElementType = "div">(
  prefix: string,
  { displayName = pascalCase(prefix), Component, defaultProps }: BsPrefixOptions<T> = {}
): BsPrefixRefForwardingComponent<T> {
  const y = React.forwardRef(
    ({ className, bsPrefix, as: Tag = Component || "div", ...props }: any, ref) => {
      const resolvedPrefix = useBootstrapPrefix(bsPrefix, prefix)
      return <Tag ref={ref} className={classNames(className, resolvedPrefix)} {...props} />
    }
  )
  y.defaultProps = defaultProps as any
  y.displayName = displayName
  return y as any
}
export default (className: string) =>
  React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>((p, ref) => (
    <div {...p} ref={ref} className={classNames((p as any).className, className)} />
  ))
export function getTabTransitionComponent(x?: TransitionType): TransitionComponent | undefined {
  if (typeof x === "boolean") return x ? Fade : undefined
  return x
}
function parseDuration(node: HTMLElement, property: "transitionDuration" | "transitionDelay") {
  const str = css(node, property) || ""
  const mult = str.indexOf("ms") === -1 ? 1000 : 1
  return parseFloat(str) * mult
}
export function transitionEndListener(x: HTMLElement, handler: (e: TransitionEvent) => void) {
  const duration = parseDuration(x, "transitionDuration")
  const delay = parseDuration(x, "transitionDelay")
  const remove = transitionEnd(
    x,
    e => {
      if (e.target === x) {
        remove()
        handler(e)
      }
    },
    duration + delay
  )
}
export function triggerBrowserReflow(x: HTMLElement): void {
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  x.offsetHeight
}
export function getBodyScrollbarWidth() {
  return Math.abs(window.innerWidth - document.documentElement.clientWidth);
}
