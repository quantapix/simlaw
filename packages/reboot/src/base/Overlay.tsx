import * as React from "react"
import ReactDOM from "react-dom"
import { useCallbackRef, useMergedRefs } from "../hooks.js"
import { useState } from "react"
import usePopper, {
  Offset,
  Placement,
  UsePopperOptions,
  UsePopperState,
} from "./usePopper.js"
import { useRootClose, RootCloseOptions } from "./useRootClose.js"
import useWaitForDOMRef, { DOMContainer } from "./useWaitForDOMRef.js"
import type { TransitionCallbacks } from "./types.js"
import mergeOptionsWithPopperConfig from "./mergeOptionsWithPopperConfig.js"

export interface OverlayArrowProps extends Record<string, any> {
  ref: React.RefCallback<HTMLElement>
  style: React.CSSProperties
}

export interface OverlayMetadata {
  show: boolean
  placement: Placement | undefined
  popper: UsePopperState | null
  arrowProps: Partial<OverlayArrowProps>
}

export interface OverlayInjectedProps extends Record<string, any> {
  ref: React.RefCallback<HTMLElement>
  style: React.CSSProperties
  "aria-labelledby"?: string
}

export interface OverlayProps extends TransitionCallbacks {
  flip?: boolean
  placement?: Placement
  offset?: Offset
  containerPadding?: number
  popperConfig?: Omit<UsePopperOptions, "placement">
  container?: DOMContainer
  target: DOMContainer
  show?: boolean
  transition?: React.ComponentType<
    { in?: boolean; appear?: boolean } & TransitionCallbacks
  >
  onHide?: (e: Event) => void
  rootClose?: boolean
  rootCloseDisabled?: boolean
  rootCloseEvent?: RootCloseOptions["clickTrigger"]
  children: (
    props: OverlayInjectedProps,
    meta: OverlayMetadata
  ) => React.ReactNode
}

export const Overlay = React.forwardRef<HTMLElement, OverlayProps>(
  (props, outerRef) => {
    const {
      flip,
      offset,
      placement,
      containerPadding,
      popperConfig = {},
      transition: Transition,
    } = props

    const [rootElement, attachRef] = useCallbackRef<HTMLElement>()
    const [arrowElement, attachArrowRef] = useCallbackRef<Element>()
    const mergedRef = useMergedRefs<HTMLElement | null>(attachRef, outerRef)

    const container = useWaitForDOMRef(props.container)
    const target = useWaitForDOMRef(props.target)

    const [exited, setExited] = useState(!props.show)

    const popper = usePopper(
      target,
      rootElement,
      mergeOptionsWithPopperConfig({
        placement,
        enableEvents: !!props.show,
        containerPadding: containerPadding || 5,
        flip,
        offset,
        arrowElement,
        popperConfig,
      })
    )
    if (props.show) {
      if (exited) setExited(false)
    } else if (!props.transition && !exited) {
      setExited(true)
    }
    const handleHidden: TransitionCallbacks["onExited"] = (...args) => {
      setExited(true)

      if (props.onExited) {
        props.onExited(...args)
      }
    }
    const mountOverlay = props.show || (Transition && !exited)
    useRootClose(rootElement, props.onHide!, {
      disabled: !props.rootClose || props.rootCloseDisabled,
      clickTrigger: props.rootCloseEvent,
    })
    if (!mountOverlay) {
      return null
    }
    let child = props.children(
      {
        ...popper.attributes.popper,
        style: popper.styles.popper as any,
        ref: mergedRef,
      },
      {
        popper,
        placement,
        show: !!props.show,
        arrowProps: {
          ...popper.attributes.arrow,
          style: popper.styles.arrow as any,
          ref: attachArrowRef,
        },
      }
    )
    if (Transition) {
      const { onExit, onExiting, onEnter, onEntering, onEntered } = props
      child = (
        <Transition
          in={props.show}
          appear
          onExit={onExit}
          onExiting={onExiting}
          onExited={handleHidden}
          onEnter={onEnter}
          onEntering={onEntering}
          onEntered={onEntered}
        >
          {child}
        </Transition>
      )
    }

    return container ? ReactDOM.createPortal(child, container) : null
  }
)
Overlay.displayName = "Overlay"
