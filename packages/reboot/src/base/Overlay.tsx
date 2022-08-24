import * as qh from "../hooks.js"
import * as qp from "./popper.js"
import * as qr from "react"
import * as qu from "./use.js"
import ReactDOM from "react-dom"
import type * as qt from "./types.js"

export interface OverlayArrowProps extends Record<string, any> {
  ref: qr.RefCallback<HTMLElement>
  style: qr.CSSProperties
}

export interface OverlayMetadata {
  show: boolean
  placement: qp.Placement | undefined
  popper: qp.UseState | null
  arrowProps: Partial<OverlayArrowProps>
}

export interface OverlayInjectedProps extends Record<string, any> {
  ref: qr.RefCallback<HTMLElement>
  style: qr.CSSProperties
  "aria-labelledby"?: string
}

export interface OverlayProps extends qt.TransitionCBs {
  flip?: boolean
  placement?: qp.Placement
  offset?: qp.Offset
  containerPadding?: number
  popperConfig?: Omit<qp.UseOptions, "placement">
  container?: qu.DOMContainer
  target: qu.DOMContainer
  show?: boolean
  transition?: qr.ComponentType<
    { in?: boolean; appear?: boolean } & qt.TransitionCBs
  >
  onHide?: (e: Event) => void
  rootClose?: boolean
  rootCloseDisabled?: boolean
  rootCloseEvent?: qu.RootCloseOptions["clickTrigger"]
  children: (props: OverlayInjectedProps, meta: OverlayMetadata) => qr.ReactNode
}

export const Overlay = qr.forwardRef<HTMLElement, OverlayProps>((ps, ref) => {
  const {
    flip,
    offset,
    placement,
    containerPadding,
    popperConfig = {},
    transition: Transition,
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
  const doHidden: qt.TransitionCBs["onExited"] = (...args) => {
    setExited(true)
    if (ps.onExited) {
      ps.onExited(...args)
    }
  }
  const mountOverlay = ps.show || (Transition && !exited)
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
  if (Transition) {
    const { onExit, onExiting, onEnter, onEntering, onEntered } = ps
    child = (
      <Transition
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
      </Transition>
    )
  }
  return container ? ReactDOM.createPortal(child, container) : null
})
Overlay.displayName = "Overlay"
