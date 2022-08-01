import {
  BaseOverlay,
  OverlayProps as BaseOverlayProps,
  OverlayArrowProps,
} from "@restart/ui/Overlay"
import { cloneElement, useCallback, useRef } from "react"
import { componentOrElement, elementType } from "prop-types-extra"
import { Placement, RootCloseEvent } from "./types"
import { TransitionCallbacks } from "./types"
import { TransitionType } from "./utils"
import { useRef } from "react"
import { useState } from "react"
import { useUncontrolledProp } from "uncontrollable"
import * as React from "react"
import classNames from "classnames"
import contains from "dom-helpers/contains"
import { Fade } from "./Fade"
import mergeOptionsWithPopperConfig from "./mergeOptionsWithPopperConfig"
import ReactDOM from "react-dom"
import safeFindDOMNode from "./safeFindDOMNode"
import useCallbackRef from "@restart/hooks/useCallbackRef"
import useMergedRefs from "@restart/hooks/useMergedRefs"
import useOverlayOffset from "./use"
import usePopper, { Offset, Placement, UsePopperOptions, UsePopperState } from "./usePopper"
import useRootClose, { RootCloseOptions } from "./useRootClose"
import useTimeout from "@restart/hooks/useTimeout"
import useWaitForDOMRef, { DOMContainer } from "./useWaitForDOMRef"
import warning from "warning"

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
  transition?: React.ComponentType<{ in?: boolean; appear?: boolean } & TransitionCallbacks>
  onHide?: (e: Event) => void
  rootClose?: boolean
  rootCloseDisabled?: boolean
  rootCloseEvent?: RootCloseOptions["clickTrigger"]
  children: (props: OverlayInjectedProps, meta: OverlayMetadata) => React.ReactNode
}
export const Overlay = React.forwardRef<HTMLElement, OverlayProps>((props, outerRef) => {
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
})
Overlay.displayName = "Overlay"
export interface OverlayInjectedProps {
  ref: React.RefCallback<HTMLElement>
  style: React.CSSProperties
  "aria-labelledby"?: string
  arrowProps: Partial<OverlayArrowProps>
  show: boolean
  placement: Placement | undefined
  popper: {
    state: any
    outOfBoundaries: boolean
    placement: Placement | undefined
    scheduleUpdate?: () => void
  }
  [prop: string]: any
}
export type OverlayChildren =
  | React.ReactElement<OverlayInjectedProps>
  | ((injected: OverlayInjectedProps) => React.ReactNode)
export interface OverlayProps
  extends Omit<BaseOverlayProps, "children" | "transition" | "rootCloseEvent"> {
  children: OverlayChildren
  transition?: TransitionType
  placement?: Placement
  rootCloseEvent?: RootCloseEvent
}
const defaultProps: Partial<OverlayProps> = function wrapRefs(props, arrowProps) {
  const { ref } = props
  const { ref: aRef } = arrowProps
  props.ref = ref.__wrapped || (ref.__wrapped = r => ref(safeFindDOMNode(r)))
  arrowProps.ref = aRef.__wrapped || (aRef.__wrapped = r => aRef(safeFindDOMNode(r)))
}
export const Overlay = React.forwardRef<HTMLElement, OverlayProps>(
  ({ children: overlay, transition, popperConfig = {}, ...outerProps }, outerRef) => {
    const popperRef = useRef({})
    const [ref, modifiers] = useOverlayOffset()
    const mergedRef = useMergedRefs(outerRef, ref)
    const actualTransition = transition === true ? Fade : transition || undefined
    return (
      <BaseOverlay
        {...outerProps}
        ref={mergedRef}
        popperConfig={{
          ...popperConfig,
          modifiers: modifiers.concat(popperConfig.modifiers || []),
        }}
        transition={actualTransition}
      >
        {(overlayProps, { arrowProps, placement, popper: popperObj, show }) => {
          wrapRefs(overlayProps, arrowProps)
          const popper = Object.assign(popperRef.current, {
            state: popperObj?.state,
            scheduleUpdate: popperObj?.update,
            placement,
            outOfBoundaries: popperObj?.state?.modifiersData.hide?.isReferenceHidden || false,
          })
          if (typeof overlay === "function")
            return overlay({
              ...overlayProps,
              placement,
              show,
              ...(!transition && show && { className: "show" }),
              popper,
              arrowProps,
            })
          return React.cloneElement(overlay as React.ReactElement, {
            ...overlayProps,
            placement,
            arrowProps,
            popper,
            className: classNames(
              (overlay as React.ReactElement).props.className,
              !transition && show && "show"
            ),
            style: {
              ...(overlay as React.ReactElement).props.style,
              ...overlayProps.style,
            },
          })
        }}
      </BaseOverlay>
    )
  }
)
Overlay.displayName = "Overlay"
Overlay.defaultProps = {
  transition: Fade,
  rootClose: false,
  show: false,
  placement: "top",
}
export type OverlayTriggerType = "hover" | "click" | "focus"
export type OverlayDelay = number | { show: number; hide: number }
export type OverlayInjectedProps = {
  onFocus?: (...args: any[]) => any
}
export type OverlayTriggerRenderProps = OverlayInjectedProps & {
  ref: React.Ref<any>
}
export interface OverlayTriggerProps extends Omit<OverlayProps, "children" | "target"> {
  children: React.ReactElement | ((props: OverlayTriggerRenderProps) => React.ReactNode)
  trigger?: OverlayTriggerType | OverlayTriggerType[]
  delay?: OverlayDelay
  show?: boolean
  defaultShow?: boolean
  onToggle?: (nextShow: boolean) => void
  flip?: boolean
  overlay: OverlayChildren
  target?: never
  onHide?: never
}
function normalizeDelay(delay?: OverlayDelay) {
  return delay && typeof delay === "object"
    ? delay
    : {
        show: delay,
        hide: delay,
      }
}
function handleMouseOverOut(
  handler: (...args: [React.MouseEvent, ...any[]]) => any,
  args: [React.MouseEvent, ...any[]],
  relatedNative: "fromElement" | "toElement"
) {
  const [e] = args
  const target = e.currentTarget
  const related = e.relatedTarget || e.nativeEvent[relatedNative]
  if ((!related || related !== target) && !contains(target, related)) {
    handler(...args)
  }
}
export function OverlayTrigger({
  trigger,
  overlay,
  children,
  popperConfig = {},
  show: propsShow,
  defaultShow = false,
  onToggle,
  delay: propsDelay,
  placement,
  flip = placement && placement.indexOf("auto") !== -1,
  ...props
}: OverlayTriggerProps) {
  const triggerNodeRef = useRef(null)
  const mergedRef = useMergedRefs<unknown>(triggerNodeRef, (children as any).ref)
  const timeout = useTimeout()
  const hoverStateRef = useRef<string>("")
  const [show, setShow] = useUncontrolledProp(propsShow, defaultShow, onToggle)
  const delay = normalizeDelay(propsDelay)
  const { onFocus, onBlur, onClick } =
    typeof children !== "function" ? React.Children.only(children).props : ({} as any)
  const attachRef = (r: React.ComponentClass | Element | null | undefined) => {
    mergedRef(safeFindDOMNode(r))
  }
  const handleShow = useCallback(() => {
    timeout.clear()
    hoverStateRef.current = "show"
    if (!delay.show) {
      setShow(true)
      return
    }
    timeout.set(() => {
      if (hoverStateRef.current === "show") setShow(true)
    }, delay.show)
  }, [delay.show, setShow, timeout])
  const handleHide = useCallback(() => {
    timeout.clear()
    hoverStateRef.current = "hide"
    if (!delay.hide) {
      setShow(false)
      return
    }
    timeout.set(() => {
      if (hoverStateRef.current === "hide") setShow(false)
    }, delay.hide)
  }, [delay.hide, setShow, timeout])
  const handleFocus = useCallback(
    (...args: any[]) => {
      handleShow()
      onFocus?.(...args)
    },
    [handleShow, onFocus]
  )
  const handleBlur = useCallback(
    (...args: any[]) => {
      handleHide()
      onBlur?.(...args)
    },
    [handleHide, onBlur]
  )
  const handleClick = useCallback(
    (...args: any[]) => {
      setShow(!show)
      onClick?.(...args)
    },
    [onClick, setShow, show]
  )
  const handleMouseOver = useCallback(
    (...args: [React.MouseEvent, ...any[]]) => {
      handleMouseOverOut(handleShow, args, "fromElement")
    },
    [handleShow]
  )
  const handleMouseOut = useCallback(
    (...args: [React.MouseEvent, ...any[]]) => {
      handleMouseOverOut(handleHide, args, "toElement")
    },
    [handleHide]
  )
  const triggers: string[] = trigger == null ? [] : [].concat(trigger as any)
  const triggerProps: any = {
    ref: attachRef,
  }
  if (triggers.indexOf("click") !== -1) {
    triggerProps.onClick = handleClick
  }
  if (triggers.indexOf("focus") !== -1) {
    triggerProps.onFocus = handleFocus
    triggerProps.onBlur = handleBlur
  }
  if (triggers.indexOf("hover") !== -1) {
    warning(
      triggers.length > 1,
      '[react-bootstrap] Specifying only the `"hover"` trigger limits the visibility of the overlay to just mouse users. Consider also including the `"focus"` trigger so that touch and keyboard only users can see the overlay as well.'
    )
    triggerProps.onMouseOver = handleMouseOver
    triggerProps.onMouseOut = handleMouseOut
  }
  return (
    <>
      {typeof children === "function"
        ? children(triggerProps)
        : cloneElement(children, triggerProps)}
      <Overlay
        {...props}
        show={show}
        onHide={handleHide}
        flip={flip}
        placement={placement}
        popperConfig={popperConfig}
        target={triggerNodeRef.current}
      >
        {overlay}
      </Overlay>
    </>
  )
}
OverlayTrigger.defaultProps = {
  defaultShow: false,
  trigger: ["hover", "focus"],
}
