import { classNames } from "./helpers.js"
import * as React from "react"
import { css } from "./base/utils.js"
import { useMemo } from "react"
import type { Transition, TransitionStatus } from "react-transition-group"
import type { TransitionCBs } from "./base/types.jsx"
import * as qu from "./utils.jsx"
import { Wrapper } from "./Transition.jsx"

type Dimension = "height" | "width"

export interface Props
  extends TransitionCBs,
    Pick<React.HTMLAttributes<HTMLElement>, "role"> {
  className?: string
  in?: boolean
  mountOnEnter?: boolean
  unmountOnExit?: boolean
  appear?: boolean
  timeout?: number
  dimension?: Dimension | (() => Dimension)
  getDimensionValue?: (dimension: Dimension, element: HTMLElement) => number
  children: React.ReactElement
}

const MARGINS: { [d in Dimension]: string[] } = {
  height: ["marginTop", "marginBottom"],
  width: ["marginLeft", "marginRight"],
}

function getDefaultDimensionValue(
  dimension: Dimension,
  elem: HTMLElement
): number {
  const offset = `offset${dimension[0].toUpperCase()}${dimension.slice(1)}`
  const value = elem[offset]
  const margins = MARGINS[dimension]
  return (
    value +
    parseInt(css(elem, margins[0]), 10) +
    parseInt(css(elem, margins[1]), 10)
  )
}

const styles = {
  [qu.EXITED]: "collapse",
  [qu.EXITING]: "collapsing",
  [qu.ENTERING]: "collapsing",
  [qu.ENTERED]: "collapse show",
  [qu.UNMOUNTED]: "",
}

export const Collapse = React.forwardRef<Transition<any>, Props>(
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
      getDimensionValue = getDefaultDimensionValue,
      ...ps
    },
    ref
  ) => {
    const dim = typeof dimension === "function" ? dimension() : dimension
    const enter = useMemo(
      () =>
        qu.createChained(x => {
          x.style[dim] = "0"
        }, onEnter),
      [dim, onEnter]
    )
    const entering = useMemo(
      () =>
        qu.createChained(x => {
          const scroll = `scroll${dim[0]!.toUpperCase()}${dim.slice(1)}`
          x.style[dim] = `${x[scroll]}px`
        }, onEntering),
      [dim, onEntering]
    )
    const entered = useMemo(
      () =>
        qu.createChained(x => {
          x.style[dim] = null
        }, onEntered),
      [dim, onEntered]
    )
    const exit = useMemo(
      () =>
        qu.createChained((x: HTMLElement) => {
          x.style[dim] = `${getDimensionValue(dim, x)}px`
          qu.triggerReflow(x)
        }, onExit),
      [onExit, getDimensionValue, dim]
    )
    const exiting = useMemo(
      () =>
        qu.createChained(x => {
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
        {(state: TransitionStatus, innerProps: Record<string, unknown>) =>
          React.cloneElement(children, {
            ...innerProps,
            className: classNames(
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
  getDimensionValue: getDefaultDimensionValue,
}
