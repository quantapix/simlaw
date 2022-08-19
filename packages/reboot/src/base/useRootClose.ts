import listen from "dom-helpers/listen"
import ownerDocument from "dom-helpers/ownerDocument"
import { useEffect } from "react"

import useEventCallback from "../hooks/useEventCallback.js"
import useClickOutside, {
  ClickOutsideOptions,
  getRefTarget,
} from "./useClickOutside.js"

const escapeKeyCode = 27
const noop = () => {}

export interface RootCloseOptions extends ClickOutsideOptions {
  disabled?: boolean
}

export function useRootClose(
  ref: React.RefObject<Element> | Element | null | undefined,
  onRootClose: (e: Event) => void,
  { disabled, clickTrigger }: RootCloseOptions = {}
) {
  const onClose = onRootClose || noop

  useClickOutside(ref, onClose, { disabled, clickTrigger })

  const handleKeyUp = useEventCallback((e: KeyboardEvent) => {
    if (e.keyCode === escapeKeyCode) {
      onClose(e)
    }
  })

  useEffect(() => {
    if (disabled || ref == null) return undefined

    const doc = ownerDocument(getRefTarget(ref)!)
    let currentEvent = (doc.defaultView || window).event

    const removeKeyupListener = listen(doc as any, "keyup", e => {
      // skip if this event is the same as the one running when we added the handlers
      if (e === currentEvent) {
        currentEvent = undefined
        return
      }
      handleKeyUp(e)
    })

    return () => {
      removeKeyupListener()
    }
  }, [ref, disabled, handleKeyUp])
}
