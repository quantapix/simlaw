import { classNames, BsRef } from "./helpers.js"
import { css, transitionEnd } from "./base/utils.js"
import { useBs } from "./Theme.jsx"
import * as qr from "react"
import ReactDOM from "react-dom"

export const ENTERING = "entering"
export const ENTERED = "entered"
export const EXITING = "exiting"
export const EXITED = "exited"
export const UNMOUNTED = "unmounted"

export function map<P = any>(
  xs: any,
  f: (x: qr.ReactElement<P>, i: number) => any
) {
  let i = 0
  return qr.Children.map(xs, x => (qr.isValidElement<P>(x) ? f(x, i++) : x))
}

export function forEach<P = any>(
  xs: any,
  f: (el: qr.ReactElement<P>, i: number) => void
) {
  let i = 0
  qr.Children.forEach(xs, x => {
    if (qr.isValidElement<P>(x)) f(x, i++)
  })
}

export function hasChildOfType<P = any>(
  x: qr.ReactNode,
  type: string | qr.JSXElementConstructor<P>
): boolean {
  return qr.Children.toArray(x).some(
    x => qr.isValidElement(x) && x.type === type
  )
}

export function createChained(...fs: any) {
  return fs
    .filter((x: any) => x != null)
    .reduce((y: any, x: any) => {
      if (typeof x !== "function") {
        throw new Error(
          "Invalid Argument Type, must only provide functions, undefined, or null."
        )
      }
      if (y === null) return x
      return function chainedFunction(...xs: any) {
        y.apply(this, xs)
        x.apply(this, xs)
      }
    }, null)
}

export function triggerReflow(x: HTMLElement): void {
  x.offsetHeight
}

export function safeFindDOMNode(
  componentOrElement: qr.ComponentClass | Element | null | undefined
) {
  if (componentOrElement && "setState" in componentOrElement) {
    return ReactDOM.findDOMNode(componentOrElement)
  }
  return (componentOrElement ?? null) as Element | Text | null
}

export const divAs = (className: string) =>
  qr.forwardRef<HTMLDivElement, qr.ComponentProps<"div">>((p, ref) => (
    <div
      {...p}
      ref={ref}
      className={classNames((p as any).className, className)}
    />
  ))

function pascalCase(x: string) {
  if (!x) return x
  const rHyphen = /-(.)/g
  function camelize(x: string): string {
    return x.replace(rHyphen, (_, c) => c.toUpperCase())
  }
  return x[0]!.toUpperCase() + camelize(x).slice(1)
}

interface BsOptions<As extends qr.ElementType = "div"> {
  displayName?: string
  Component?: As
  defaultProps?: Partial<qr.ComponentProps<As>>
}

export function withBs<As extends qr.ElementType = "div">(
  prefix: string,
  {
    displayName = pascalCase(prefix),
    Component,
    defaultProps,
  }: BsOptions<As> = {}
): BsRef<As> {
  const y = qr.forwardRef(
    (
      { className, bsPrefix, as: X = Component || "div", ...props }: any,
      ref
    ) => {
      const resolvedPrefix = useBs(bsPrefix, prefix)
      return (
        <X
          ref={ref}
          className={classNames(className, resolvedPrefix)}
          {...props}
        />
      )
    }
  )
  y.defaultProps = defaultProps as any
  y.displayName = displayName
  return y as any
}

function parseDuration(
  node: HTMLElement,
  property: "transitionDuration" | "transitionDelay"
) {
  const str = css(node, property) || ""
  const mult = str.indexOf("ms") === -1 ? 1000 : 1
  return parseFloat(str) * mult
}

export function endListener(
  element: HTMLElement,
  handler: (e: TransitionEvent) => void
) {
  const duration = parseDuration(element, "transitionDuration")
  const delay = parseDuration(element, "transitionDelay")
  const remove = transitionEnd(
    element,
    e => {
      if (e.target === element) {
        remove()
        handler(e)
      }
    },
    duration + delay
  )
}
