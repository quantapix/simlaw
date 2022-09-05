import { Wrapper } from "./Wrapper.js"
import * as qr from "react"
import * as qt from "./types.js"
import * as qu from "./utils.js"
import type { TransitionStatus, Transition } from "react-transition-group"

export interface Props extends qt.TransitionCBs {
  className?: string
  in?: boolean | undefined
  mountOnEnter?: boolean | undefined
  unmountOnExit?: boolean | undefined
  appear?: boolean
  timeout?: number
  children: qr.ReactElement
  transitionClasses?: Record<string, string>
}

const styles = {
  [qu.ENTERING]: "show",
  [qu.ENTERED]: "show",
  [qu.EXITING]: "",
  [qu.EXITED]: "",
  [qu.UNMOUNTED]: "",
}

export const Fade = qr.forwardRef<Transition<any>, Props>(
  ({ className, children, transitionClasses = {}, ...ps }, ref) => {
    const doEnter = qr.useCallback(
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
        onEnter={doEnter}
        childRef={(children as any).ref}
      >
        {(status: TransitionStatus, ps2: Record<string, unknown>) =>
          qr.cloneElement(children, {
            ...ps2,
            className: qt.classNames(
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
