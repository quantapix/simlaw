import { classNames, invariant } from "./helpers.js"
import { useCallback, useMemo, useRef, useState } from "react"
import { useMergedRefs } from "./hooks.js"
import { hasClass } from "./base/utils.js"
import type { Offset, Options } from "./base/usePopper.jsx"
import { useBs } from "./Theme.jsx"
import { POPPER_OFFSET } from "./Popover.jsx"
import { useCol, Props as _Props } from "./Col.jsx"
import type { Variant } from "./types.jsx"

export function useOffset(
  customOffset?: Offset
): [React.RefObject<HTMLElement>, Options["modifiers"]] {
  const overlayRef = useRef<HTMLDivElement | null>(null)
  const popoverClass = useBs(undefined, "popover")
  const offset = useMemo(
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
  bg?: Variant
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
    className: classNames(
      className,
      animation ? `${bs}-${animation}` : bs,
      size && `${bs}-${size}`,
      bg && `bg-${bg}`
    ),
  }
}

export function useWrappedRef(ref, componentName) {
  if (!__DEV__) return ref
  const warningRef = useCallback(
    (x: any) => {
      invariant(
        x == null || !x.isReactComponent,
        `${componentName} injected a ref to a provided \`as\` component that resolved to a component instance instead of a DOM element. ` +
          "Use `React.forwardRef` to provide the injected ref to the class component as a prop in order to pass it directly to a DOM element"
      )
    },
    [componentName]
  )
  return useMergedRefs(warningRef, ref)
}

export type Handler = (...args: any[]) => any

export function useUncontrolledProp<TProp, THandler extends Handler = Handler>(
  propValue: TProp | undefined,
  defaultValue: TProp,
  handler?: THandler
): readonly [TProp, THandler]
export function useUncontrolledProp<TProp, THandler extends Handler = Handler>(
  propValue: TProp | undefined,
  defaultValue?: TProp | undefined,
  handler?: THandler
): readonly [TProp | undefined, THandler]
export function useUncontrolledProp<TProp, THandler extends Handler = Handler>(
  propValue: TProp | undefined,
  defaultValue: TProp | undefined,
  handler?: THandler
) {
  const wasPropRef = useRef<boolean>(propValue !== undefined)
  const [stateValue, setState] = useState<TProp | undefined>(defaultValue)
  const isProp = propValue !== undefined
  const wasProp = wasPropRef.current
  wasPropRef.current = isProp
  if (!isProp && wasProp && stateValue !== defaultValue) {
    setState(defaultValue)
  }
  return [
    isProp ? propValue : stateValue,
    useCallback(
      (value: TProp, ...args: any[]) => {
        if (handler) handler(value, ...args)
        setState(value)
      },
      [handler]
    ) as THandler,
  ] as const
}

type FilterFlags<Base, Condition> = {
  [Key in keyof Base]: NonNullable<Base[Key]> extends Condition ? Key : never
}
type AllowedNames<Base, Condition> = FilterFlags<Base, Condition>[keyof Base]

type ConfigMap<TProps extends object> = {
  [p in keyof TProps]?: AllowedNames<TProps, Function>
}

export function useUncontrolled<
  TProps extends object,
  TDefaults extends string = never
>(props: TProps, config: ConfigMap<TProps>): Omit<TProps, TDefaults> {
  return Object.keys(config).reduce((result: TProps, fieldName: string) => {
    const {
      [defaultKey(fieldName)]: defaultValue,
      [fieldName]: propsValue,
      ...rest
    } = result as any
    const handlerName = config[fieldName]
    const [value, handler] = useUncontrolledProp(
      propsValue,
      defaultValue,
      props[handlerName]
    )
    return {
      ...rest,
      [fieldName]: value,
      [handlerName]: handler,
    }
  }, props)
}

export function defaultKey(key: string) {
  return "default" + key.charAt(0).toUpperCase() + key.substr(1)
}
