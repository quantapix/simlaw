import { TransitionCallbacks } from "./types"
import { useCallback } from "react"
import * as React from "react"
import classNames from "classnames"
import Transition, { TransitionStatus, ENTERED, ENTERING } from "react-transition-group/Transition"
import transitionEndListener from "./utils"
import TransitionWrapper from "./TransitionWrapper"
import triggerBrowserReflow from "./utils"
export interface FadeProps extends TransitionCallbacks {
  className?: string
  in?: boolean
  mountOnEnter?: boolean
  unmountOnExit?: boolean
  appear?: boolean
  timeout?: number
  children: React.ReactElement
  transitionClasses?: Record<string, string>
}
const defaultProps = {
  in: false,
  timeout: 300,
  mountOnEnter: false,
  unmountOnExit: false,
  appear: false,
}
const fadeStyles = {
  [ENTERING]: "show",
  [ENTERED]: "show",
}
export const Fade = React.forwardRef<Transition<any>, FadeProps>(
  ({ className, children, transitionClasses = {}, ...ps }, ref) => {
    const handleEnter = useCallback(
      (node, isAppearing) => {
        triggerBrowserReflow(node)
        ps.onEnter?.(node, isAppearing)
      },
      [ps]
    )
    return (
      <TransitionWrapper
        ref={ref}
        addEndListener={transitionEndListener}
        {...ps}
        onEnter={handleEnter}
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
      </TransitionWrapper>
    )
  }
)
Fade.defaultProps = defaultProps
Fade.displayName = "Fade"
