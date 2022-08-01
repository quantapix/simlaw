import { useMemo, useRef } from "react"
import hasClass from "dom-helpers/hasClass"
import { Options } from "@restart/ui/usePopper"
import { useBootstrapPrefix } from "./ThemeProvider"
import Popover from "./Popover"
export default function useOverlayOffset(): [
  React.RefObject<HTMLElement>,
  Options["modifiers"]
] {
  const overlayRef = useRef<HTMLDivElement | null>(null)
  const popoverClass = useBootstrapPrefix(undefined, "popover")
  const offset = useMemo(
    () => ({
      name: "offset",
      options: {
        offset: () => {
          if (
            overlayRef.current &&
            hasClass(overlayRef.current, popoverClass)
          ) {
            return Popover.POPPER_OFFSET
          }
          return [0, 0]
        },
      },
    }),
    [popoverClass]
  )
  return [overlayRef, [offset]]
}
import classNames from "classnames"
import { useBootstrapPrefix } from "./ThemeProvider"
import { useCol, ColProps } from "./Col"
import { Variant } from "./types"
export type PlaceholderAnimation = "glow" | "wave"
export type PlaceholderSize = "xs" | "sm" | "lg"
export interface UsePlaceholderProps extends Omit<ColProps, "as"> {
  animation?: PlaceholderAnimation
  bg?: Variant
  size?: PlaceholderSize
}
export default function usePlaceholder({
  animation,
  bg,
  bsPrefix,
  size,
  ...props
}: UsePlaceholderProps) {
  bsPrefix = useBootstrapPrefix(bsPrefix, "placeholder")
  const [{ className, ...colProps }] = useCol(props)
  return {
    ...colProps,
    className: classNames(
      className,
      animation ? `${bsPrefix}-${animation}` : bsPrefix,
      size && `${bsPrefix}-${size}`,
      bg && `bg-${bg}`
    ),
  }
}
import invariant from "invariant"
import { useCallback } from "react"
import useMergedRefs from "@restart/hooks/useMergedRefs"
export default function useWrappedRefWithWarning(ref, componentName) {
  // @ts-ignore
  if (!__DEV__) return ref
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const warningRef = useCallback(
    refValue => {
      invariant(
        refValue == null || !refValue.isReactComponent,
        `${componentName} injected a ref to a provided \`as\` component that resolved to a component instance instead of a DOM element. ` +
          "Use `React.forwardRef` to provide the injected ref to the class component as a prop in order to pass it directly to a DOM element"
      )
    },
    [componentName]
  )
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useMergedRefs(warningRef, ref)
}
