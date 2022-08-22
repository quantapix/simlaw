import * as qr from "react"

export const BREAKPOINTS = ["xxl", "xl", "lg", "md", "sm", "xs"]
export const MIN_BREAKPOINT = "xs"

export interface Data {
  prefixes: Record<string, string>
  breakpoints: string[]
  minBreakpoint?: string
  dir?: string | undefined
}

export interface Props extends Partial<Data> {
  children: qr.ReactNode
}

const Context = qr.createContext<Data>({
  prefixes: {},
  breakpoints: BREAKPOINTS,
  minBreakpoint: MIN_BREAKPOINT,
})
export const { Consumer, Provider } = Context

export function Theme({
  prefixes = {},
  breakpoints = BREAKPOINTS,
  minBreakpoint = MIN_BREAKPOINT,
  dir,
  children,
}: Props) {
  const v = qr.useMemo(
    () => ({
      prefixes: { ...prefixes },
      breakpoints,
      minBreakpoint,
      dir,
    }),
    [prefixes, breakpoints, minBreakpoint, dir]
  )
  return <Provider value={v}>{children}</Provider>
}

export function useBs(
  prefix: string | undefined,
  defaultPrefix: string
): string {
  const { prefixes } = qr.useContext(Context)
  return prefix || prefixes[defaultPrefix] || defaultPrefix
}

export function useBreakpoints() {
  const { breakpoints } = qr.useContext(Context)
  return breakpoints
}

export function useMinBreakpoint() {
  const { minBreakpoint } = qr.useContext(Context)
  return minBreakpoint
}

export function useIsRTL() {
  const { dir } = qr.useContext(Context)
  return dir === "rtl"
}

export function createComponent(X: any, xs: any) {
  if (typeof xs === "string") xs = { prefix: xs }
  const isClassy = X.prototype && X.prototype.isReactComponent
  const { prefix, forwardRefAs = isClassy ? "ref" : "innerRef" } = xs
  const Y = qr.forwardRef<any, { bsPrefix?: string }>(({ ...ps }, ref) => {
    ps[forwardRefAs] = ref
    const bs = useBs((ps as any).bsPrefix, prefix)
    return <X {...ps} bsPrefix={bs} />
  })
  Y.displayName = `Bootstrap(${X.displayName || X.name})`
  return Y
}
