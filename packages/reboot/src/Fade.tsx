import { classNames } from "./helpers.js"
import * as React from "react"
import { useCallback } from "react"
import type { TransitionStatus, Transition } from "react-transition-group"
import type { TransitionCBs } from "./base/types.jsx"
import * as qu from "./utils.jsx"
import { Wrapper } from "./Transition.jsx"

export interface Props extends TransitionCBs {
  className?: string
  in?: boolean | undefined
  mountOnEnter?: boolean
  unmountOnExit?: boolean
  appear?: boolean
  timeout?: number
  children: React.ReactElement
  transitionClasses?: Record<string, string>
}

const styles = {
  [qu.ENTERING]: "show",
  [qu.ENTERED]: "show",
  [qu.EXITING]: "",
  [qu.EXITED]: "",
  [qu.UNMOUNTED]: "",
}

export const Fade = React.forwardRef<Transition<any>, Props>(
  ({ className, children, transitionClasses = {}, ...ps }, ref) => {
    const enter = useCallback(
      (x: HTMLElement, isAppearing: boolean) => {
        qu.triggerReflow(x)
        ps.onEnter?.(x, isAppearing)
      },
      [ps]
    )
    return (
      <Wrapper
        ref={ref}
        addEndListener={qu.endListener}
        {...ps}
        onEnter={enter}
        childRef={(children as any).ref}
      >
        {(status: TransitionStatus, ps2: Record<string, unknown>) =>
          React.cloneElement(children, {
            ...ps2,
            className: classNames(
              "fade",
              className,
              children.props.className,
              styles[status],
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
