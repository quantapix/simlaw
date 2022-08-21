import { safeFindDOMNode } from "./utils.jsx"
import { Transition, TransitionStatus as Status } from "react-transition-group"
import * as qh from "./hooks.js"
import * as qr from "react"
import type { TransitionProps as BaseProps } from "react-transition-group/Transition.js"

export type Props = BaseProps & {
  childRef?: qr.Ref<unknown>
  children:
    | qr.ReactElement
    | ((status: Status, props: Record<string, unknown>) => qr.ReactNode)
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
      (callback?: (node: HTMLElement, param: any) => void) => (param: any) => {
        if (callback && nodeRef.current) {
          callback(nodeRef.current, param)
        }
      }
    const enter = qr.useCallback(normalize(onEnter), [onEnter])
    const entering = qr.useCallback(normalize(onEntering), [onEntering])
    const entered = qr.useCallback(normalize(onEntered), [onEntered])
    const exit = qr.useCallback(normalize(onExit), [onExit])
    const exiting = qr.useCallback(normalize(onExiting), [onExiting])
    const exited = qr.useCallback(normalize(onExited), [onExited])
    const addListener = qr.useCallback(normalize(addEndListener), [
      addEndListener,
    ])
    return (
      <Transition
        ref={ref}
        {...ps}
        onEnter={enter}
        onEntered={entered}
        onEntering={entering}
        onExit={exit}
        onExited={exited}
        onExiting={exiting}
        addEndListener={addListener}
        nodeRef={nodeRef}
      >
        {typeof children === "function"
          ? (status: Status, ps2: Record<string, unknown>) =>
              children(status, {
                ...ps2,
                ref: attachRef,
              })
          : qr.cloneElement(children as qr.ReactElement, {
              ref: attachRef,
            })}
      </Transition>
    )
  }
)
