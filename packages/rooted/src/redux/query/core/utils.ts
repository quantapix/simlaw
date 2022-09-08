import { createAction } from "../../../redux/index.js"
import type * as qt from "../../../redux/types.js"

export const onFocus = createAction("__rtkq/focused")
export const onFocusLost = createAction("__rtkq/unfocused")
export const onOnline = createAction("__rtkq/online")
export const onOffline = createAction("__rtkq/offline")

let initialized = false

export function setupListeners(
  dispatch: qt.ThunkDispatch<any, any, any>,
  customHandler?: (
    dispatch: qt.ThunkDispatch<any, any, any>,
    actions: {
      onFocus: typeof onFocus
      onFocusLost: typeof onFocusLost
      onOnline: typeof onOnline
      onOffline: typeof onOffline
    }
  ) => () => void
) {
  function defaultHandler() {
    const handleFocus = () => dispatch(onFocus())
    const handleFocusLost = () => dispatch(onFocusLost())
    const handleOnline = () => dispatch(onOnline())
    const handleOffline = () => dispatch(onOffline())
    const handleVisibilityChange = () => {
      if (window.document.visibilityState === "visible") {
        handleFocus()
      } else {
        handleFocusLost()
      }
    }
    if (!initialized) {
      if (typeof window !== "undefined" && window.addEventListener) {
        window.addEventListener(
          "visibilitychange",
          handleVisibilityChange,
          false
        )
        window.addEventListener("focus", handleFocus, false)
        window.addEventListener("online", handleOnline, false)
        window.addEventListener("offline", handleOffline, false)
        initialized = true
      }
    }
    const unsubscribe = () => {
      window.removeEventListener("focus", handleFocus)
      window.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
      initialized = false
    }
    return unsubscribe
  }
  return customHandler
    ? customHandler(dispatch, { onFocus, onFocusLost, onOffline, onOnline })
    : defaultHandler()
}
