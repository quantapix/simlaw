import { useEffect, useRef } from "react"

export function useCommittedRef<TValue>(
  value: TValue
): React.MutableRefObject<TValue> {
  const ref = useRef(value)
  useEffect(() => {
    ref.current = value
  }, [value])
  return ref
}
