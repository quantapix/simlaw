import { useRef } from "react"
import useMounted from "./useMounted.js"
import useStableMemo from "./useStableMemo.js"
import useWillUnmount from "./useWillUnmount.js"

export interface UseAnimationFrameReturn {
  cancel(): void
  request(callback: FrameRequestCallback): void
  request(cancelPrevious: boolean, callback: FrameRequestCallback): void
}

export function useAnimationFrame(): UseAnimationFrameReturn {
  const isMounted = useMounted()
  const handle = useRef<number | undefined>()
  const cancel = () => {
    if (handle.current != null) {
      cancelAnimationFrame(handle.current)
    }
  }
  useWillUnmount(cancel)
  return useStableMemo(
    () => ({
      request(
        cancelPrevious: boolean | FrameRequestCallback,
        fn?: FrameRequestCallback
      ) {
        if (!isMounted()) return
        if (cancelPrevious) cancel()
        handle.current = requestAnimationFrame(
          fn || (cancelPrevious as FrameRequestCallback)
        )
      },
      cancel,
    }),
    []
  )
}
