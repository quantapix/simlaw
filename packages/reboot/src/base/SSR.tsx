import * as qr from "react"

interface Data {
  prefix: string
  current: number
}

const defaultContext: Data = {
  prefix: String(Math.round(Math.random() * 10000000000)),
  current: 0,
}

const Context = qr.createContext<Data>(defaultContext)

export interface Props {
  children: qr.ReactNode
}

export function Provider(ps: Props): JSX.Element {
  const c = qr.useContext(Context)
  const v: Data = qr.useMemo(
    () => ({
      prefix: c === defaultContext ? "" : `${c.prefix}-${++c.current}`,
      current: 0,
    }),
    [c]
  )
  return <Context.Provider value={v}>{ps.children}</Context.Provider>
}

const canUseDOM = Boolean(
  typeof window !== "undefined" &&
    window.document &&
    window.document.createElement
)

export function useSSRSafeId(x?: string): string {
  const c = qr.useContext(Context)
  if (c === defaultContext && !canUseDOM) {
    console.warn(
      "When server rendering, you must wrap your application in an <SSRProvider> to ensure consistent ids are generated between the client and server."
    )
  }
  return qr.useMemo(() => x || `react-aria${c.prefix}-${++c.current}`, [x])
}

export function useIsSSR(): boolean {
  const c = qr.useContext(Context)
  const inContext = c !== defaultContext
  const [isSSR, setIsSSR] = qr.useState(inContext)
  if (typeof window !== "undefined" && inContext) {
    qr.useLayoutEffect(() => {
      setIsSSR(false)
    }, [])
  }
  return isSSR
}
