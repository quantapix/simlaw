/* eslint-disable @typescript-eslint/no-explicit-any */
import { classNames } from "./helpers.js"
import * as React from "react"
import { useCallback } from "react"
import type { TransitionStatus, Transition } from "react-transition-group"
import type { TransitionCallbacks } from "@restart/ui/esm/types.jsx"
import { triggerReflow, endListener } from "./utils.jsx"
import { Wrapper } from "./Transition.jsx"

const ENTERING = "entering"
const ENTERED = "entered"

export interface Props extends TransitionCallbacks {
  className?: string
  in?: boolean
  mountOnEnter?: boolean
  unmountOnExit?: boolean
  appear?: boolean
  timeout?: number
  children: React.ReactElement
  transitionClasses?: Record<string, string>
}

const fadeStyles = {
  [ENTERING]: "show",
  [ENTERED]: "show",
}

export const Fade = React.forwardRef<Transition<any>, Props>(
  ({ className, children, transitionClasses = {}, ...ps }, ref) => {
    const enter = useCallback(
      (x: HTMLElement, isAppearing: boolean) => {
        triggerReflow(x)
        ps.onEnter?.(x, isAppearing)
      },
      [ps]
    )
    return (
      <Wrapper
        ref={ref}
        addEndListener={endListener}
        {...ps}
        onEnter={enter}
        childRef={(children as any).ref}
      >
        {(status: TransitionStatus, innerProps: Record<string, unknown>) =>
          React.cloneElement(children, {
            ...innerProps,
            className: classNames(
              "fade",
              className,
              children.props.className,
              fadeStyles[status],
              transitionClasses[status]
            ),
          })
        }
      </Wrapper>
    )
  }
)
Fade.displayName = "Fade"
Fade.defaultProps = {
  in: false,
  timeout: 300,
  mountOnEnter: false,
  unmountOnExit: false,
  appear: false,
}
