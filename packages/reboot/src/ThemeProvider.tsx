import * as React from "react"
import { useContext, useMemo } from "react"
export interface ThemeContextValue {
  prefixes: Record<string, string>
  dir?: string
}
export interface ThemeProviderProps extends Partial<ThemeContextValue> {
  children: React.ElementType
}
const ThemeContext = React.createContext<ThemeContextValue>({ prefixes: {} })
const { Consumer, Provider } = ThemeContext
export { Consumer as ThemeConsumer }
export function ThemeProvider({ prefixes = {}, dir, children }: ThemeProviderProps) {
  const v = useMemo(() => ({ prefixes: { ...prefixes }, dir }), [prefixes, dir])
  return <Provider value={v}>{children}</Provider>
}
export function useBootstrapPrefix(prefix: string | undefined, defaultPrefix: string): string {
  const { prefixes } = useContext(ThemeContext)
  return prefix || prefixes[defaultPrefix] || defaultPrefix
}
export function useIsRTL() {
  const { dir } = useContext(ThemeContext)
  return dir === "rtl"
}
export function createBootstrapComponent(Component, opts) {
  if (typeof opts === "string") opts = { prefix: opts }
  const isClassy = Component.prototype && Component.prototype.isReactComponent
  const { prefix, forwardRefAs = isClassy ? "ref" : "innerRef" } = opts
  const y = React.forwardRef(({ ...props }, ref) => {
    props[forwardRefAs] = ref
    const bsPrefix = useBootstrapPrefix((props as any).bsPrefix, prefix)
    return <Component {...props} bsPrefix={bsPrefix} />
  })
  y.displayName = `Bootstrap(${Component.displayName || Component.name})`
  return y
}
