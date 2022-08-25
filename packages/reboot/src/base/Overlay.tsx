import * as qh from "../hooks.js"
import * as qp from "./popper.js"
import * as qr from "react"
import * as qu from "./use.js"
import ReactDOM from "react-dom"
import type * as qt from "./types.jsx"

export interface ArrowProps extends Record<string, any> {
  ref: qr.RefCallback<HTMLElement>
  style: qr.CSSProperties
}

export interface Meta {
  show: boolean
  placement: qp.Placement | undefined
  popper: qp.UseState | null
  arrowProps: Partial<ArrowProps>
}

export interface InjectedProps extends Record<string, any> {
  ref: qr.RefCallback<HTMLElement>
  style: qr.CSSProperties
  "aria-labelledby"?: string
}

type Transition = qr.ComponentType<
  {
    in?: boolean | undefined
    appear?: boolean
    children: qr.ReactNode
  } & qt.TransitionCBs
>

export interface Props extends qt.TransitionCBs {
  flip?: boolean | undefined
  placement?: qp.Placement | undefined
  offset?: qp.Offset
  containerPadding?: number
  popperConfig?: Omit<qp.UseOptions, "placement">
  container?: qu.DOMContainer
  target: qu.DOMContainer
  show?: boolean
  transition?: Transition | undefined
  onHide?: (e: Event) => void
  rootClose?: boolean
  rootCloseDisabled?: boolean
  rootCloseEvent?: qu.RootCloseOptions["clickTrigger"]
  children: (ps: InjectedProps, meta: Meta) => qr.ReactNode
}

export const Overlay = qr.forwardRef<HTMLElement, Props>((ps, ref) => {
  const {
    flip,
    offset,
    placement,
    containerPadding,
    popperConfig = {},
    transition: T,
  } = ps
  const [root, attachRef] = qh.useCallbackRef<HTMLElement>()
  const [arrow, attachArrowRef] = qh.useCallbackRef<Element>()
  const mergedRef = qh.useMergedRefs<HTMLElement | null>(attachRef, ref)
  const container = qu.useWaitForDOMRef(ps.container)
  const target = qu.useWaitForDOMRef(ps.target)
  const [exited, setExited] = qr.useState(!ps.show)
  const popper = qp.usePopper(
    target,
    root,
    qp.mergeOptsWithPopper({
      placement,
      enableEvents: !!ps.show,
      containerPadding: containerPadding || 5,
      flip,
      offset,
      arrowElement: arrow,
      popperConfig,
    })
  )
  if (ps.show) {
    if (exited) setExited(false)
  } else if (!ps.transition && !exited) {
    setExited(true)
  }
  const doHidden: qt.TransitionCBs["onExited"] = (...xs) => {
    setExited(true)
    if (ps.onExited) {
      ps.onExited(...xs)
    }
  }
  const mountOverlay = ps.show || (T && !exited)
  qu.useRootClose(root, ps.onHide!, {
    disabled: !ps.rootClose || ps.rootCloseDisabled,
    clickTrigger: ps.rootCloseEvent,
  })
  if (!mountOverlay) {
    return null
  }
  let child = ps.children(
    {
      ...popper.attributes["popper"],
      style: popper.styles["popper"] as any,
      ref: mergedRef,
    },
    {
      popper,
      placement,
      show: !!ps.show,
      arrowProps: {
        ...popper.attributes["arrow"],
        style: popper.styles["arrow"] as any,
        ref: attachArrowRef,
      },
    }
  )
  if (T) {
    const { onExit, onExiting, onEnter, onEntering, onEntered } = ps
    child = (
      <T
        in={ps.show}
        appear
        onExit={onExit}
        onExiting={onExiting}
        onExited={doHidden}
        onEnter={onEnter}
        onEntering={onEntering}
        onEntered={onEntered}
      >
        {child}
      </T>
    )
  }
  return container ? ReactDOM.createPortal(child, container) : null
})
Overlay.displayName = "Overlay"
