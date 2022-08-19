/* eslint-disable @typescript-eslint/no-empty-function */
import { contains, listen, ownerDocument } from "./utils.js"
import { useCallback, useEffect, useRef } from "react"
import { useEventCallback } from "../hooks.js"
import warning from "warning"

const noop = () => {}

export type MouseEvents = {
  [K in keyof GlobalEventHandlersEventMap]: GlobalEventHandlersEventMap[K] extends MouseEvent
    ? K
    : never
}[keyof GlobalEventHandlersEventMap]

function isLeftClickEvent(event: MouseEvent) {
  return event.button === 0
}

function isModifiedEvent(event: MouseEvent) {
  return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey)
}

export const getRefTarget = (
  ref: React.RefObject<Element> | Element | null | undefined
) => ref && ("current" in ref ? ref.current : ref)

export interface ClickOutsideOptions {
  disabled?: boolean
  clickTrigger?: MouseEvents
}

const InitialTriggerEvents: Partial<Record<MouseEvents, MouseEvents>> = {
  click: "mousedown",
  mouseup: "mousedown",
  pointerup: "pointerdown",
}

export function useClickOutside(
  ref: React.RefObject<Element> | Element | null | undefined,
  onClickOutside: (e: Event) => void = noop,
  { disabled, clickTrigger = "click" }: ClickOutsideOptions = {}
) {
  const preventMouseClickOutsideRef = useRef(false)
  const waitingForTrigger = useRef(false)

  const handleMouseCapture = useCallback(
    e => {
      const currentTarget = getRefTarget(ref)

      warning(
        !!currentTarget,
        "ClickOutside captured a close event but does not have a ref to compare it to. " +
          "useClickOutside(), should be passed a ref that resolves to a DOM node"
      )

      preventMouseClickOutsideRef.current =
        !currentTarget ||
        isModifiedEvent(e) ||
        !isLeftClickEvent(e) ||
        !!contains(currentTarget, e.target) ||
        waitingForTrigger.current

      waitingForTrigger.current = false
    },
    [ref]
  )

  const handleInitialMouse = useEventCallback((e: MouseEvent) => {
    const currentTarget = getRefTarget(ref)

    if (currentTarget && contains(currentTarget, e.target as any)) {
      waitingForTrigger.current = true
    }
  })

  const handleMouse = useEventCallback((e: MouseEvent) => {
    if (!preventMouseClickOutsideRef.current) {
      onClickOutside(e)
    }
  })

  useEffect(() => {
    if (disabled || ref == null) return undefined

    const doc = ownerDocument(getRefTarget(ref)!)
    let currentEvent = (doc.defaultView || window).event

    let removeInitialTriggerListener: (() => void) | null = null
    if (InitialTriggerEvents[clickTrigger]) {
      removeInitialTriggerListener = listen(
        doc as any,
        InitialTriggerEvents[clickTrigger]!,
        handleInitialMouse,
        true
      )
    }
    const removeMouseCaptureListener = listen(
      doc as any,
      clickTrigger,
      handleMouseCapture,
      true
    )

    const removeMouseListener = listen(doc as any, clickTrigger, e => {
      // skip if this event is the same as the one running when we added the handlers
      if (e === currentEvent) {
        currentEvent = undefined
        return
      }
      handleMouse(e)
    })

    let mobileSafariHackListeners = [] as Array<() => void>
    if ("ontouchstart" in doc.documentElement) {
      mobileSafariHackListeners = [].slice
        .call(doc.body.children)
        .map(el => listen(el, "mousemove", noop))
    }

    return () => {
      removeInitialTriggerListener?.()
      removeMouseCaptureListener()
      removeMouseListener()
      mobileSafariHackListeners.forEach(remove => remove())
    }
  }, [
    ref,
    disabled,
    clickTrigger,
    handleMouseCapture,
    handleInitialMouse,
    handleMouse,
  ])
}
