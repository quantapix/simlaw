import useMediaQuery from "./useMediaQuery.js"
import { useMemo } from "react"

export type BreakpointDirection = "up" | "down" | true

export type BreakpointMap<TKey extends string> = Partial<
  Record<TKey, BreakpointDirection>
>

export function createBreakpointHook<TKey extends string>(
  breakpointValues: Record<TKey, string | number>
) {
  const names = Object.keys(breakpointValues) as TKey[]
  function and(query: string, next: string) {
    if (query === next) {
      return next
    }
    return query ? `${query} and ${next}` : next
  }
  function getNext(breakpoint: TKey) {
    return names[Math.min(names.indexOf(breakpoint) + 1, names.length - 1)]
  }
  function getMaxQuery(breakpoint: TKey) {
    const next = getNext(breakpoint)
    let value = breakpointValues[next]
    if (typeof value === "number") value = `${value - 0.2}px`
    else value = `calc(${value} - 0.2px)`

    return `(max-width: ${value})`
  }
  function getMinQuery(breakpoint: TKey) {
    let value = breakpointValues[breakpoint]
    if (typeof value === "number") {
      value = `${value}px`
    }
    return `(min-width: ${value})`
  }

  function useBreakpoint(
    breakpointMap: BreakpointMap<TKey>,
    window?: Window
  ): boolean
  function useBreakpoint(
    breakpoint: TKey,
    direction?: BreakpointDirection,
    window?: Window
  ): boolean
  function useBreakpoint(
    breakpointOrMap: TKey | BreakpointMap<TKey>,
    direction?: BreakpointDirection | Window,
    window?: Window
  ): boolean {
    let breakpointMap: BreakpointMap<TKey>
    if (typeof breakpointOrMap === "object") {
      breakpointMap = breakpointOrMap
      window = direction as Window
      direction = true
    } else {
      direction = direction || true
      breakpointMap = { [breakpointOrMap]: direction } as Record<
        TKey,
        BreakpointDirection
      >
    }
    const query = useMemo(
      () =>
        Object.entries(breakpointMap).reduce(
          (query, [key, direction]: [TKey, BreakpointDirection]) => {
            if (direction === "up" || direction === true) {
              query = and(query, getMinQuery(key))
            }
            if (direction === "down" || direction === true) {
              query = and(query, getMaxQuery(key))
            }

            return query
          },
          ""
        ),
      [JSON.stringify(breakpointMap)]
    )
    return useMediaQuery(query, window)
  }
  return useBreakpoint
}

export type DefaultBreakpoints = "xs" | "sm" | "md" | "lg" | "xl" | "xxl"
export type DefaultBreakpointMap = BreakpointMap<DefaultBreakpoints>

export const useBreakpoint = createBreakpointHook<DefaultBreakpoints>({
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1400,
})
