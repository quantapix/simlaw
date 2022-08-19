import * as React from "react"
import { cloneElement, useCallback, useRef } from "react"
import { contains } from "./base/utils.js"
import BaseOverlay, {
  OverlayProps as _Props,
  OverlayArrowProps,
} from "./base/Overlay.jsx"
import type { State } from "./base/usePopper.jsx"
import {
  useIsomorphicEffect,
  useCallbackRef,
  useEventCallback,
  useMergedRefs,
  useTimeout,
} from "./hooks.js"
import warning from "warning"
import { useOffset, useUncontrolledProp } from "./use.jsx"
import { Fade } from "./Fade.jsx"
import { classNames, TransitionType } from "./helpers.js"
import type { Placement, PopperRef, RootCloseEvent } from "./types.jsx"
import { safeFindDOMNode } from "./utils.jsx"

export interface InjectedProps {
  ref: React.RefCallback<HTMLElement>
  style: React.CSSProperties
  "aria-labelledby"?: string
  arrowProps: Partial<OverlayArrowProps>
  show: boolean
  placement: Placement | undefined
  popper: PopperRef
  [prop: string]: any
}

export type Children =
  | React.ReactElement<InjectedProps>
  | ((injected: InjectedProps) => React.ReactNode)

export interface Props
  extends Omit<_Props, "children" | "transition" | "rootCloseEvent"> {
  children: Children
  transition?: TransitionType
  placement?: Placement
  rootCloseEvent?: RootCloseEvent
}

function wrapRefs(props, arrowProps) {
  const { ref } = props
  const { ref: aRef } = arrowProps
  props.ref = ref.__wrapped || (ref.__wrapped = r => ref(safeFindDOMNode(r)))
  arrowProps.ref =
    aRef.__wrapped || (aRef.__wrapped = r => aRef(safeFindDOMNode(r)))
}

export const Overlay = React.forwardRef<HTMLElement, Props>(
  (
    { children: overlay, transition, popperConfig = {}, ...outerProps },
    outerRef
  ) => {
    const popperRef = useRef<Partial<PopperRef>>({})
    const [firstRenderedState, setFirstRenderedState] = useCallbackRef<State>()
    const [ref, modifiers] = useOffset(outerProps.offset)
    const mergedRef = useMergedRefs(outerRef, ref)
    const actualTransition =
      transition === true ? Fade : transition || undefined
    const firstUpdate = useEventCallback(state => {
      setFirstRenderedState(state)
      popperConfig?.onFirstUpdate?.(state)
    })
    useIsomorphicEffect(() => {
      if (firstRenderedState) {
        popperRef.current.scheduleUpdate?.()
      }
    }, [firstRenderedState])
    return (
      <BaseOverlay
        {...outerProps}
        ref={mergedRef}
        popperConfig={{
          ...popperConfig,
          modifiers: modifiers.concat(popperConfig.modifiers || []),
          onFirstUpdate: firstUpdate,
        }}
        transition={actualTransition}
      >
        {(overlayProps, { arrowProps, popper: popperObj, show }) => {
          wrapRefs(overlayProps, arrowProps)
          const updatedPlacement = popperObj?.placement
          const popper = Object.assign(popperRef.current, {
            state: popperObj?.state,
            scheduleUpdate: popperObj?.update,
            placement: updatedPlacement,
            outOfBoundaries:
              popperObj?.state?.modifiersData.hide?.isReferenceHidden || false,
          })
          if (typeof overlay === "function")
            return overlay({
              ...overlayProps,
              placement: updatedPlacement,
              show,
              ...(!transition && show && { className: "show" }),
              popper,
              arrowProps,
            })
          return React.cloneElement(overlay as React.ReactElement, {
            ...overlayProps,
            placement: updatedPlacement,
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

export type Type = "hover" | "click" | "focus"

export type Delay = number | { show: number; hide: number }

export type InjProps = {
  onFocus?: (...args: any[]) => any
}

export type RenderProps = InjProps & {
  ref: React.Ref<any>
}

export interface TriggerProps extends Omit<Props, "children" | "target"> {
  children: React.ReactElement | ((ps: RenderProps) => React.ReactNode)
  trigger?: Type | Type[]
  delay?: Delay
  show?: boolean
  defaultShow?: boolean
  onToggle?: (nextShow: boolean) => void
  flip?: boolean
  overlay: Children
  target?: never
  onHide?: never
}

function normalizeDelay(delay?: Delay) {
  return delay && typeof delay === "object"
    ? delay
    : {
        show: delay,
        hide: delay,
      }
}

function mouseOverOut(
  handler: (...xs: [React.MouseEvent, ...any[]]) => any,
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

export const Trigger = ({
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
  ...ps
}: TriggerProps) => {
  const triggerNodeRef = useRef(null)
  const mergedRef = useMergedRefs<unknown>(
    triggerNodeRef,
    (children as any).ref
  )
  const timeout = useTimeout()
  const hoverStateRef = useRef<string>("")
  const [isShow, setShow] = useUncontrolledProp(
    propsShow,
    defaultShow,
    onToggle
  )
  const delay = normalizeDelay(propsDelay)
  const { onFocus, onBlur, onClick } =
    typeof children !== "function"
      ? React.Children.only(children).props
      : ({} as any)
  const attachRef = (r: React.ComponentClass | Element | null | undefined) => {
    mergedRef(safeFindDOMNode(r))
  }
  const show = useCallback(() => {
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
  const hide = useCallback(() => {
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
  const focus = useCallback(
    (...xs: any[]) => {
      show()
      onFocus?.(...xs)
    },
    [show, onFocus]
  )
  const blur = useCallback(
    (...xs: any[]) => {
      hide()
      onBlur?.(...xs)
    },
    [hide, onBlur]
  )
  const click = useCallback(
    (...xs: any[]) => {
      setShow(!isShow)
      onClick?.(...xs)
    },
    [onClick, setShow, isShow]
  )
  const mouseOver = useCallback(
    (...xs: [React.MouseEvent, ...any[]]) => {
      mouseOverOut(show, xs, "fromElement")
    },
    [show]
  )
  const mouseOut = useCallback(
    (...xs: [React.MouseEvent, ...any[]]) => {
      mouseOverOut(hide, xs, "toElement")
    },
    [hide]
  )
  const triggers: string[] = trigger == null ? [] : [].concat(trigger as any)
  const triggerProps: any = {
    ref: attachRef,
  }
  if (triggers.indexOf("click") !== -1) {
    triggerProps.onClick = click
  }
  if (triggers.indexOf("focus") !== -1) {
    triggerProps.onFocus = focus
    triggerProps.onBlur = blur
  }
  if (triggers.indexOf("hover") !== -1) {
    warning(
      triggers.length > 1,
      '[react-bootstrap] Specifying only the `"hover"` trigger limits the visibility of the overlay to just mouse users. Consider also including the `"focus"` trigger so that touch and keyboard only users can see the overlay as well.'
    )
    triggerProps.onMouseOver = mouseOver
    triggerProps.onMouseOut = mouseOut
  }
  return (
    <>
      {typeof children === "function"
        ? children(triggerProps)
        : cloneElement(children, triggerProps)}
      <Overlay
        {...ps}
        show={isShow}
        onHide={hide}
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
Trigger.defaultProps = {
  defaultShow: false,
  trigger: ["hover", "focus"],
}
