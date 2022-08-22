import { classNames, TransitionType } from "./helpers.js"
import { contains } from "./base/utils.js"
import { Fade } from "./Fade.jsx"
import { safeFindDOMNode } from "./utils.jsx"
import { useOffset } from "./use.jsx"
import { warning } from "./base/utils.js"
import * as qh from "./hooks.js"
import * as qr from "react"
import type { Placement, PopperRef, RootCloseEvent } from "./types.jsx"
import type { State } from "./base/popper.js"
import {
  Overlay as Base,
  OverlayProps as BaseProps,
  OverlayArrowProps,
} from "./base/Overlay.jsx"

export interface InjectedProps {
  ref: qr.RefCallback<HTMLElement>
  style: qr.CSSProperties
  "aria-labelledby"?: string
  arrowProps: Partial<OverlayArrowProps>
  show: boolean
  placement: Placement | undefined
  popper: PopperRef
  [prop: string]: any
}

export type Children =
  | qr.ReactElement<InjectedProps>
  | ((injected: InjectedProps) => qr.ReactNode)

export interface Props
  extends Omit<BaseProps, "children" | "transition" | "rootCloseEvent"> {
  children: Children
  transition?: TransitionType
  placement?: Placement
  rootCloseEvent?: RootCloseEvent
}

function wrapRefs(ps: any, arrowPs: any) {
  const { ref } = ps
  const { ref: aRef } = arrowPs
  ps.ref =
    ref.__wrapped || (ref.__wrapped = (x: any) => ref(safeFindDOMNode(x)))
  arrowPs.ref =
    aRef.__wrapped || (aRef.__wrapped = (x: any) => aRef(safeFindDOMNode(x)))
}

export const Overlay = qr.forwardRef<HTMLElement, Props>(
  ({ children: overlay, transition, popperConfig = {}, ...ps }, ref) => {
    const popperRef = qr.useRef<Partial<PopperRef>>({})
    const [firstRenderedState, setFirstRenderedState] =
      qh.useCallbackRef<State>()
    const [ref2, modifiers] = useOffset(ps.offset)
    const mergedRef = qh.useMergedRefs(ref, ref2)
    const actualTransition =
      transition === true ? Fade : transition || undefined
    const firstUpdate = qh.useEventCB(state => {
      setFirstRenderedState(state)
      popperConfig?.onFirstUpdate?.(state)
    })
    qh.useIsomorphicEffect(() => {
      if (firstRenderedState) {
        popperRef.current.scheduleUpdate?.()
      }
    }, [firstRenderedState])
    return (
      <Base
        {...ps}
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
          return qr.cloneElement(overlay as qr.ReactElement, {
            ...overlayProps,
            placement: updatedPlacement,
            arrowProps,
            popper,
            className: classNames(
              (overlay as qr.ReactElement).props.className,
              !transition && show && "show"
            ),
            style: {
              ...(overlay as qr.ReactElement).props.style,
              ...overlayProps.style,
            },
          })
        }}
      </Base>
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
  ref: qr.Ref<any>
}

export interface TriggerProps extends Omit<Props, "children" | "target"> {
  children: qr.ReactElement | ((ps: RenderProps) => qr.ReactNode)
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
  handler: (...xs: [qr.MouseEvent, ...any[]]) => any,
  args: [qr.MouseEvent, ...any[]],
  relatedNative: "fromElement" | "toElement"
) {
  const [e] = args
  const target = e.currentTarget
  const related = e.relatedTarget || (e.nativeEvent as any)[relatedNative]
  if ((!related || related !== target) && !contains(target, related)) {
    handler(...args)
  }
}

export const Trigger = ({
  trigger,
  overlay,
  children,
  popperConfig = {},
  show: _show,
  defaultShow = false,
  onToggle,
  delay: _delay,
  placement,
  flip = placement && placement.indexOf("auto") !== -1,
  ...ps
}: TriggerProps) => {
  const triggerNodeRef = qr.useRef(null)
  const mergedRef = qh.useMergedRefs<unknown>(
    triggerNodeRef,
    (children as any).ref
  )
  const timeout = qh.useTimeout()
  const hoverStateRef = qr.useRef<string>("")
  const [isShow, setShow] = qh.useUncontrolledVal(_show, defaultShow, onToggle)
  const delay = normalizeDelay(_delay)
  const { onFocus, onBlur, onClick } =
    typeof children !== "function"
      ? qr.Children.only(children).props
      : ({} as any)
  const attachRef = (r: qr.ComponentClass | Element | null | undefined) => {
    mergedRef(safeFindDOMNode(r))
  }
  const show = qr.useCallback(() => {
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
  const hide = qr.useCallback(() => {
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
  const focus = qr.useCallback(
    (...xs: any[]) => {
      show()
      onFocus?.(...xs)
    },
    [show, onFocus]
  )
  const blur = qr.useCallback(
    (...xs: any[]) => {
      hide()
      onBlur?.(...xs)
    },
    [hide, onBlur]
  )
  const click = qr.useCallback(
    (...xs: any[]) => {
      setShow(!isShow)
      onClick?.(...xs)
    },
    [onClick, setShow, isShow]
  )
  const mouseOver = qr.useCallback(
    (...xs: [qr.MouseEvent, ...any[]]) => {
      mouseOverOut(show, xs, "fromElement")
    },
    [show]
  )
  const mouseOut = qr.useCallback(
    (...xs: [qr.MouseEvent, ...any[]]) => {
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
        : qr.cloneElement(children, triggerProps)}
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
