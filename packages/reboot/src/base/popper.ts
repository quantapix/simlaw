import * as qp from "@popperjs/core"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { dequal } from "dequal"
import { useSafeState } from "../hooks.js"
import { placements } from "@popperjs/core"

export { placements }

export const createPopper = qp.popperGenerator({
  defaultModifiers: [
    qp.hide,
    qp.popperOffsets,
    qp.computeStyles,
    qp.eventListeners,
    qp.offset,
    qp.flip,
    qp.preventOverflow,
    qp.arrow,
  ],
})

const disabledApplyStylesModifier = {
  name: "applyStyles",
  enabled: false,
  phase: "afterWrite",
  fn: () => undefined,
}

export type Modifier<Name, Options> = qp.Modifier<Name, Options>
export type Options = qp.Options
export type Instance = qp.Instance
export type Placement = qp.Placement
export type VirtualElement = qp.VirtualElement
export type State = qp.State
export type OffsetValue = [number | null | undefined, number | null | undefined]
export type OffsetFunction = (details: {
  popper: qp.Rect
  reference: qp.Rect
  placement: Placement
}) => OffsetValue
export type Offset = OffsetFunction | OffsetValue
export type ModifierMap = Record<string, Partial<Modifier<any, any>>>
export type Modifiers =
  | qp.Options["modifiers"]
  | Record<string, Partial<Modifier<any, any>>>
export type UsePopperOptions = Omit<
  Options,
  "modifiers" | "placement" | "strategy"
> & {
  enabled?: boolean
  placement?: Options["placement"]
  strategy?: Options["strategy"]
  modifiers?: Options["modifiers"]
}
export interface UsePopperState {
  placement: Placement
  update: () => void
  forceUpdate: () => void
  attributes: Record<string, Record<string, any>>
  styles: Record<string, Partial<CSSStyleDeclaration>>
  state?: State
}
const ariaDescribedByModifier: Modifier<"ariaDescribedBy", undefined> = {
  name: "ariaDescribedBy",
  enabled: true,
  phase: "afterWrite",
  effect:
    ({ state }) =>
    () => {
      const { reference, popper } = state.elements
      if ("removeAttribute" in reference) {
        const ids = (reference.getAttribute("aria-describedby") || "")
          .split(",")
          .filter(id => id.trim() !== popper.id)
        if (!ids.length) reference.removeAttribute("aria-describedby")
        else reference.setAttribute("aria-describedby", ids.join(","))
      }
    },
  fn: ({ state }) => {
    const { popper, reference } = state.elements
    const role = popper.getAttribute("role")?.toLowerCase()
    if (popper.id && role === "tooltip" && "setAttribute" in reference) {
      const ids = reference.getAttribute("aria-describedby")
      if (ids && ids.split(",").indexOf(popper.id) !== -1) {
        return
      }
      reference.setAttribute(
        "aria-describedby",
        ids ? `${ids},${popper.id}` : popper.id
      )
    }
  },
}
const EMPTY_MODIFIERS = [] as any
export function usePopper(
  referenceElement: VirtualElement | null | undefined,
  popperElement: HTMLElement | null | undefined,
  {
    enabled = true,
    placement = "bottom",
    strategy = "absolute",
    modifiers = EMPTY_MODIFIERS,
    ...config
  }: UsePopperOptions = {}
): UsePopperState {
  const prevModifiers = useRef<UsePopperOptions["modifiers"]>(modifiers)
  const popperInstanceRef = useRef<Instance>()
  const update = useCallback(() => {
    popperInstanceRef.current?.update()
  }, [])
  const forceUpdate = useCallback(() => {
    popperInstanceRef.current?.forceUpdate()
  }, [])
  const [popperState, setState] = useSafeState(
    useState<UsePopperState>({
      placement,
      update,
      forceUpdate,
      attributes: {},
      styles: {
        popper: {},
        arrow: {},
      },
    })
  )
  const updateModifier = useMemo<Modifier<"updateStateModifier", any>>(
    () => ({
      name: "updateStateModifier",
      enabled: true,
      phase: "write",
      requires: ["computeStyles"],
      fn: ({ state }) => {
        const styles: UsePopperState["styles"] = {}
        const attributes: UsePopperState["attributes"] = {}
        Object.keys(state.elements).forEach(element => {
          styles[element] = state.styles[element]
          attributes[element] = state.attributes[element]
        })
        setState({
          state,
          styles,
          attributes,
          update,
          forceUpdate,
          placement: state.placement,
        })
      },
    }),
    [update, forceUpdate, setState]
  )
  const nextModifiers = useMemo(() => {
    if (!dequal(prevModifiers.current, modifiers)) {
      prevModifiers.current = modifiers
    }
    return prevModifiers.current!
  }, [modifiers])
  useEffect(() => {
    if (!popperInstanceRef.current || !enabled) return
    popperInstanceRef.current.setOptions({
      placement,
      strategy,
      modifiers: [
        ...nextModifiers,
        updateModifier,
        disabledApplyStylesModifier,
      ],
    })
  }, [strategy, placement, updateModifier, enabled, nextModifiers])
  useEffect(() => {
    if (!enabled || referenceElement == null || popperElement == null) {
      return undefined
    }
    popperInstanceRef.current = createPopper(referenceElement, popperElement, {
      ...config,
      placement,
      strategy,
      modifiers: [...nextModifiers, ariaDescribedByModifier, updateModifier],
    })
    return () => {
      if (popperInstanceRef.current != null) {
        popperInstanceRef.current.destroy()
        popperInstanceRef.current = undefined
        setState(s => ({
          ...s,
          attributes: {},
          styles: { popper: {} },
        }))
      }
    }
  }, [enabled, referenceElement, popperElement])
  return popperState
}
export type Config = {
  flip?: boolean
  fixed?: boolean
  alignEnd?: boolean
  enabled?: boolean
  containerPadding?: number
  arrowElement?: Element | null
  enableEvents?: boolean
  offset?: Offset
  placement?: Placement
  popperConfig?: UsePopperOptions
}
export function toModifierMap(modifiers: Modifiers | undefined) {
  const result: Modifiers = {}
  if (!Array.isArray(modifiers)) {
    return modifiers || result
  }
  modifiers?.forEach(m => {
    result[m.name!] = m
  })
  return result
}
export function toModifierArray(map: Modifiers | undefined = {}) {
  if (Array.isArray(map)) return map
  return Object.keys(map).map(k => {
    map[k].name = k
    return map[k]
  })
}
export function mergeOptsWithPopper({
  enabled,
  enableEvents,
  placement,
  flip,
  offset,
  fixed,
  containerPadding,
  arrowElement,
  popperConfig = {},
}: Config): UsePopperOptions {
  const modifiers = toModifierMap(popperConfig.modifiers)
  return {
    ...popperConfig,
    placement,
    enabled,
    strategy: fixed ? "fixed" : popperConfig.strategy,
    modifiers: toModifierArray({
      ...modifiers,
      eventListeners: {
        enabled: enableEvents,
      },
      preventOverflow: {
        ...modifiers.preventOverflow,
        options: containerPadding
          ? {
              padding: containerPadding,
              ...modifiers.preventOverflow?.options,
            }
          : modifiers.preventOverflow?.options,
      },
      offset: {
        options: {
          offset,
          ...modifiers.offset?.options,
        },
      },
      arrow: {
        ...modifiers.arrow,
        enabled: !!arrowElement,
        options: {
          ...modifiers.arrow?.options,
          element: arrowElement,
        },
      },
      flip: {
        enabled: !!flip,
        ...modifiers.flip,
      },
    }),
  }
}
