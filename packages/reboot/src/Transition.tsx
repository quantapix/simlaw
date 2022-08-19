/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useRef } from "react"
import { Transition, TransitionStatus } from "react-transition-group"
import type { TransitionProps } from "react-transition-group/Transition.js"
import { useMergedRefs } from "./hooks.js"
import { safeFindDOMNode } from "./utils.jsx"

export type Props = TransitionProps & {
  childRef?: React.Ref<unknown>
  children:
    | React.ReactElement
    | ((
        status: TransitionStatus,
        props: Record<string, unknown>
      ) => React.ReactNode)
}

export const Wrapper = React.forwardRef<Transition<any>, Props>(
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
    const nodeRef = useRef<HTMLElement>(null)
    const mergedRef = useMergedRefs(nodeRef, childRef)
    const attachRef = (
      r: React.ComponentClass | Element | null | undefined
    ) => {
      mergedRef(safeFindDOMNode(r))
    }
    const normalize =
      (callback?: (node: HTMLElement, param: any) => void) => (param: any) => {
        if (callback && nodeRef.current) {
          callback(nodeRef.current, param)
        }
      }
    const enter = useCallback(normalize(onEnter), [onEnter])
    const entering = useCallback(normalize(onEntering), [onEntering])
    const entered = useCallback(normalize(onEntered), [onEntered])
    const exit = useCallback(normalize(onExit), [onExit])
    const exiting = useCallback(normalize(onExiting), [onExiting])
    const exited = useCallback(normalize(onExited), [onExited])
    const addListener = useCallback(normalize(addEndListener), [addEndListener])
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
          ? (status: TransitionStatus, innerProps: Record<string, unknown>) =>
              children(status, {
                ...innerProps,
                ref: attachRef,
              })
          : React.cloneElement(children as React.ReactElement, {
              ref: attachRef,
            })}
      </Transition>
    )
  }
)
