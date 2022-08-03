import * as React from 'react';
import { useContext, useMemo } from 'react';

export const DEFAULT_BREAKPOINTS = ['xxl', 'xl', 'lg', 'md', 'sm', 'xs'];
export const DEFAULT_MIN_BREAKPOINT = 'xs';

export interface ContextValue {
  prefixes: Record<string, string>;
  breakpoints: string[];
  minBreakpoint?: string;
  dir?: string;
}

export interface Props extends Partial<ContextValue> {
  children: React.ReactNode;
}

const Context = React.createContext<ContextValue>({
  prefixes: {},
  breakpoints: DEFAULT_BREAKPOINTS,
  minBreakpoint: DEFAULT_MIN_BREAKPOINT,
});
export const { Consumer, Provider } = Context;

export function Theme({
  prefixes = {},
  breakpoints = DEFAULT_BREAKPOINTS,
  minBreakpoint = DEFAULT_MIN_BREAKPOINT,
  dir,
  children,
}: Props) {
  const contextValue = useMemo(
    () => ({
      prefixes: { ...prefixes },
      breakpoints,
      minBreakpoint,
      dir,
    }),
    [prefixes, breakpoints, minBreakpoint, dir],
  );
  return <Provider value={contextValue}>{children}</Provider>;
}

export function useBsPrefix(
  prefix: string | undefined,
  defaultPrefix: string,
): string {
  const { prefixes } = useContext(Context);
  return prefix || prefixes[defaultPrefix] || defaultPrefix;
}

export function useBsBreakpoints() {
  const { breakpoints } = useContext(Context);
  return breakpoints;
}

export function useBsMinBreakpoint() {
  const { minBreakpoint } = useContext(Context);
  return minBreakpoint;
}

export function useIsRTL() {
  const { dir } = useContext(Context);
  return dir === 'rtl';
}

export function createBsComponent(Component, opts) {
  if (typeof opts === 'string') opts = { prefix: opts };
  const isClassy = Component.prototype && Component.prototype.isReactComponent;
  const { prefix, forwardRefAs = isClassy ? 'ref' : 'innerRef' } = opts;
  const Wrapped = React.forwardRef<any, { bsPrefix?: string }>(
    ({ ...props }, ref) => {
      props[forwardRefAs] = ref;
      const bsPrefix = useBsPrefix((props as any).bsPrefix, prefix);
      return <Component {...props} bsPrefix={bsPrefix} />;
    },
  );
  Wrapped.displayName = `Bootstrap(${Component.displayName || Component.name})`;
  return Wrapped;
}
