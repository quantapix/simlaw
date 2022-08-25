import { dequal } from "dequal"
import * as qh from "../hooks.js"
import * as qp from "@popperjs/core"
import * as qr from "react"

export type {
  Instance,
  Modifier,
  Options,
  Placement,
  placements,
  State,
  VirtualElement,
} from "@popperjs/core"

export const create = qp.popperGenerator({
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

export type OffsetValue = [number | null | undefined, number | null | undefined]
export type OffsetFunction = (details: {
  popper: qp.Rect
  reference: qp.Rect
  placement: qp.Placement
}) => OffsetValue
export type Offset = OffsetFunction | OffsetValue
export type ModifierMap = Record<string, Partial<qp.Modifier<any, any>>>
export type Modifiers =
  | Array<Partial<qp.Modifier<any, any>> | undefined>
  | ModifierMap

export type UseOptions = Omit<
  qp.Options,
  "modifiers" | "placement" | "strategy"
> & {
  enabled?: boolean | undefined
  modifiers?: Array<Partial<qp.Modifier<any, any>> | undefined>
  placement?: qp.Placement | undefined
  strategy?: qp.PositioningStrategy | undefined
}

export interface UseState {
  attributes: Record<string, Record<string, any>>
  forceUpdate: () => void
  placement: qp.Placement
  state?: qp.State
  styles: Record<string, Partial<CSSStyleDeclaration>>
  update: () => void
}

const ariaDescribedByModifier: qp.Modifier<"ariaDescribedBy", qp.Obj> = {
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
  referenceElement: qp.VirtualElement | null | undefined,
  popperElement: HTMLElement | null | undefined,
  {
    enabled = true,
    placement = "bottom",
    strategy = "absolute",
    modifiers = EMPTY_MODIFIERS,
    ...config
  }: UseOptions = {}
): UseState {
  const prevMods = qr.useRef<UseOptions["modifiers"]>(modifiers)
  const ref = qr.useRef<qp.Instance>()
  const update = qr.useCallback(() => {
    ref.current?.update()
  }, [])
  const forceUpdate = qr.useCallback(() => {
    ref.current?.forceUpdate()
  }, [])
  const [state, setState] = qh.useSafeState(
    qr.useState<UseState>({
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
  const updateMod = qr.useMemo<qp.Modifier<"updateStateModifier", any>>(
    () => ({
      name: "updateStateModifier",
      enabled: true,
      phase: "write",
      requires: ["computeStyles"],
      fn: ({ state }) => {
        const styles: UseState["styles"] = {}
        const attributes: UseState["attributes"] = {}
        Object.keys(state.elements).forEach(e => {
          styles[e] = state.styles[e]!
          attributes[e] = state.attributes[e]!
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
  const nextMods = qr.useMemo(() => {
    if (!dequal(prevMods.current, modifiers)) {
      prevMods.current = modifiers
    }
    return prevMods.current!
  }, [modifiers])
  qr.useEffect(() => {
    if (!ref.current || !enabled) return
    ref.current.setOptions({
      placement,
      strategy,
      modifiers: [...nextMods, updateMod, disabledApplyStylesModifier],
    })
  }, [strategy, placement, updateMod, enabled, nextMods])
  qr.useEffect(() => {
    if (!enabled || referenceElement == null || popperElement == null) {
      return undefined
    }
    ref.current = create(referenceElement, popperElement, {
      ...config,
      placement,
      strategy,
      modifiers: [...nextMods, ariaDescribedByModifier, updateMod] as Partial<
        qp.Modifier<any, any>
      >[],
    })
    return () => {
      if (ref.current != null) {
        ref.current.destroy()
        ref.current = undefined
        setState(s => ({
          ...s,
          attributes: {},
          styles: { popper: {} },
        }))
      }
    }
  }, [enabled, referenceElement, popperElement])
  return state
}

export interface Config {
  alignEnd?: boolean
  arrowElement?: Element | null
  containerPadding?: number | undefined
  enabled?: boolean | undefined
  enableEvents?: boolean | undefined
  fixed?: boolean
  flip?: boolean | undefined
  offset?: Offset | undefined
  placement?: qp.Placement | undefined
  popperConfig?: UseOptions
}

export function toModifierMap(xs?: Modifiers) {
  const y: Modifiers = {}
  if (!Array.isArray(xs)) {
    return xs || y
  }
  xs?.forEach(x => {
    if (x) {
      y[x.name] = x
    }
  })
  return y
}

export function toModifierArray(m: Modifiers = {}) {
  if (Array.isArray(m)) return m
  return Object.keys(m).map(k => {
    m[k]!.name = k
    return m[k]
  })
}

export function mergeOptsWithPopper({
  arrowElement,
  // containerPadding,
  enabled,
  // enableEvents,
  fixed,
  flip,
  offset,
  placement,
  popperConfig = {},
}: Config): UseOptions {
  const modifiers = toModifierMap(popperConfig.modifiers)
  return {
    ...popperConfig,
    placement,
    enabled,
    strategy: fixed ? "fixed" : popperConfig.strategy,
    modifiers: toModifierArray({
      ...modifiers,
      offset: {
        options: {
          offset,
          ...modifiers["offset"]?.options,
        },
      },
      arrow: {
        ...modifiers["arrow"],
        enabled: !!arrowElement,
        options: {
          ...modifiers["arrow"]?.options,
          element: arrowElement,
        },
      },
      flip: {
        enabled: !!flip,
        ...modifiers["flip"],
      },
      /*
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
      */
    }),
  }
}
