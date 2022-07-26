import { hasClass } from "./base/utils.js"
import { POPPER_OFFSET } from "./Popover.js"
import { useBs } from "./Theme.js"
import { useCol, Props as _Props } from "./Col.js"
import * as qh from "./hooks.js"
import * as qr from "react"
import * as qt from "./types.js"
import type { Offset, Options } from "./base/popper.js"

export function useOffset(
  customOffset?: Offset
): [React.RefObject<HTMLElement>, Options["modifiers"]] {
  const overlayRef = qr.useRef<HTMLDivElement | null>(null)
  const popoverClass = useBs(undefined, "popover")
  const offset = qr.useMemo(
    () => ({
      name: "offset",
      options: {
        offset: () => {
          if (
            overlayRef.current &&
            hasClass(overlayRef.current, popoverClass)
          ) {
            return customOffset || POPPER_OFFSET
          }
          return customOffset || [0, 0]
        },
      },
    }),
    [customOffset, popoverClass]
  )
  return [overlayRef, [offset]]
}

export type Animation = "glow" | "wave"
export type Size = "xs" | "sm" | "lg"

export interface Props extends Omit<_Props, "as"> {
  animation?: Animation
  bg?: qt.Variant
  size?: Size
}

export function usePlaceholder({
  animation,
  bg,
  bsPrefix,
  size,
  ...ps
}: Props) {
  const bs = useBs(bsPrefix, "placeholder")
  const [{ className, ...colProps }] = useCol(ps)

  return {
    ...colProps,
    className: qt.classNames(
      className,
      animation ? `${bs}-${animation}` : bs,
      size && `${bs}-${size}`,
      bg && `bg-${bg}`
    ),
  }
}

export function useWrappedRef(ref: any, componentName: any) {
  if (!__DEV__) return ref
  const cb = qr.useCallback(
    (x: any) => {
      qt.invariant(
        x == null || !x.isReactComponent,
        `${componentName} injected a ref to a provided \`as\` component that resolved to a component instance instead of a DOM element. ` +
          "Use `React.forwardRef` to provide the injected ref to the class component as a prop in order to pass it directly to a DOM element"
      )
    },
    [componentName]
  )
  return qh.useMergedRefs(cb, ref)
}
