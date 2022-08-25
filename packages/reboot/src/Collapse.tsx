//import { css } from "./base/utils.js"
import { Wrapper } from "./Wrapper.jsx"
import * as qr from "react"
import * as qt from "./types.jsx"
import * as qu from "./utils.jsx"
import type { Transition, TransitionStatus } from "react-transition-group"

type Dimension = "height" | "width"

export interface Props
  extends qt.TransitionCBs,
    Pick<qr.HTMLAttributes<HTMLElement>, "role"> {
  className?: string
  in?: boolean
  mountOnEnter?: boolean
  unmountOnExit?: boolean
  appear?: boolean
  timeout?: number
  dimension?: Dimension | (() => Dimension)
  getDimensionValue?: (dimension: Dimension, element: HTMLElement) => number
  children: qr.ReactElement
}

export const MARGINS: { [d in Dimension]: string[] } = {
  height: ["marginTop", "marginBottom"],
  width: ["marginLeft", "marginRight"],
}

function getDefaultDimValue(dim: Dimension, elem: HTMLElement): number {
  const offset = `offset${dim[0]!.toUpperCase()}${dim.slice(1)}`
  const value = (elem as any)[offset]
  // const margins = MARGINS[dim]
  return value // +
  // parseInt(css(elem, margins[0]), 10) +
  // parseInt(css(elem, margins[1]), 10)
}

const styles = {
  [qu.EXITED]: "collapse",
  [qu.EXITING]: "collapsing",
  [qu.ENTERING]: "collapsing",
  [qu.ENTERED]: "collapse show",
  [qu.UNMOUNTED]: "",
}

export const Collapse = qr.forwardRef<Transition<any>, Props>(
  (
    {
      onEnter,
      onEntering,
      onEntered,
      onExit,
      onExiting,
      className,
      children,
      dimension = "height",
      getDimensionValue = getDefaultDimValue,
      ...ps
    },
    ref
  ) => {
    const dim = typeof dimension === "function" ? dimension() : dimension
    const enter = qr.useMemo(
      () =>
        qu.createChained((x: any) => {
          x.style[dim] = "0"
        }, onEnter),
      [dim, onEnter]
    )
    const entering = qr.useMemo(
      () =>
        qu.createChained((x: any) => {
          const scroll = `scroll${dim[0]!.toUpperCase()}${dim.slice(1)}`
          x.style[dim] = `${x[scroll]}px`
        }, onEntering),
      [dim, onEntering]
    )
    const entered = qr.useMemo(
      () =>
        qu.createChained((x: any) => {
          x.style[dim] = null
        }, onEntered),
      [dim, onEntered]
    )
    const exit = qr.useMemo(
      () =>
        qu.createChained((x: HTMLElement) => {
          x.style[dim] = `${getDimensionValue(dim, x)}px`
          qu.triggerReflow(x)
        }, onExit),
      [onExit, getDimensionValue, dim]
    )
    const exiting = qr.useMemo(
      () =>
        qu.createChained((x: any) => {
          x.style[dim] = null
        }, onExiting),
      [dim, onExiting]
    )
    return (
      <Wrapper
        ref={ref}
        addEndListener={qu.endListener}
        {...ps}
        aria-expanded={ps.role ? ps.in : null}
        onEnter={enter}
        onEntering={entering}
        onEntered={entered}
        onExit={exit}
        onExiting={exiting}
        childRef={(children as any).ref}
      >
        {(state: TransitionStatus, ps2: Record<string, unknown>) =>
          qr.cloneElement(children, {
            ...ps2,
            className: qt.classNames(
              className,
              children.props.className,
              styles[state],
              dim === "width" && "collapse-horizontal"
            ),
          })
        }
      </Wrapper>
    )
  }
)
Collapse.defaultProps = {
  in: false,
  timeout: 300,
  mountOnEnter: false,
  unmountOnExit: false,
  appear: false,
  getDimensionValue: getDefaultDimValue,
}
