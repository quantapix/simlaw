import { safeFindDOMNode } from "./utils.js"
import { Transition, TransitionStatus as Status } from "react-transition-group"
import * as qh from "./hooks.js"
import * as qr from "react"
import type { TransitionProps as BaseProps } from "react-transition-group/Transition.js"

export type Props = BaseProps & {
  childRef?: qr.Ref<unknown>
  children: qr.ReactNode | ((status: Status) => qr.ReactNode)
}

export const Wrapper = qr.forwardRef<Transition<any>, Props>(
  (
    {
      onEnter,
      onEntering,
      onEntered,
      onExit,
      onExiting,
      onExited,
      addEndListener,
      children,
      childRef,
      ...ps
    },
    ref
  ) => {
    const nodeRef = qr.useRef<HTMLElement>(null)
    const mergedRef = qh.useMergedRefs(nodeRef, childRef)
    const attachRef = (r: qr.ComponentClass | Element | null | undefined) => {
      mergedRef(safeFindDOMNode(r))
    }
    const normalize =
      (callback?: (x: HTMLElement, param: any) => void) => (param: any) => {
        if (callback && nodeRef.current) {
          callback(nodeRef.current, param)
        }
      }
    const doEnter = qr.useCallback(normalize(onEnter), [onEnter])
    const doEntering = qr.useCallback(normalize(onEntering), [onEntering])
    const doEntered = qr.useCallback(normalize(onEntered), [onEntered])
    const doExit = qr.useCallback(normalize(onExit), [onExit])
    const doExiting = qr.useCallback(normalize(onExiting), [onExiting])
    const doExited = qr.useCallback(normalize(onExited), [onExited])
    const cb = qr.useCallback(normalize(addEndListener), [addEndListener])
    return (
      <Transition
        ref={ref}
        {...ps}
        onEnter={doEnter}
        onEntered={doEntered}
        onEntering={doEntering}
        onExit={doExit}
        onExited={doExited}
        onExiting={doExiting}
        addEndListener={cb}
        nodeRef={nodeRef}
      >
        {typeof children === "function"
          ? (status: Status) => children(status) //, { ref: attachRef })
          : qr.cloneElement(children as qr.ReactElement, { ref: attachRef })}
      </Transition>
    )
  }
)
