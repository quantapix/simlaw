import * as qb from "./base.js"
import type * as qt from "./types.js"

export interface DevToolsOptions {
  name?: string
  actionCreators?:
    | qt.ActionCreator<any>[]
    | { [key: string]: qt.ActionCreator<any> }
  latency?: number
  maxAge?: number
  serialize?:
    | boolean
    | {
        options?:
          | undefined
          | boolean
          | {
              date?: true
              regex?: true
              undefined?: true
              error?: true
              symbol?: true
              map?: true
              set?: true
              function?: true | ((fn: (...args: any[]) => any) => string)
            }
        replacer?: (key: string, value: unknown) => any
        reviver?: (key: string, value: unknown) => any
        immutable?: any
        refs?: any
      }
  actionSanitizer?: <A extends qt.Action>(action: A, id: number) => A
  stateSanitizer?: <S>(state: S, index: number) => S
  actionsBlacklist?: string | string[]
  actionsWhitelist?: string | string[]
  actionsDenylist?: string | string[]
  actionsAllowlist?: string | string[]
  predicate?: <S, A extends qt.Action>(state: S, action: A) => boolean
  shouldRecordChanges?: boolean
  pauseActionType?: string
  autoPause?: boolean
  shouldStartLocked?: boolean
  shouldHotReload?: boolean
  shouldCatchErrors?: boolean
  features?: {
    pause?: boolean
    lock?: boolean
    persist?: boolean
    export?: boolean | "custom"
    import?: boolean | "custom"
    jump?: boolean
    skip?: boolean
    reorder?: boolean
    dispatch?: boolean
    test?: boolean
  }
  trace?: boolean | (<A extends qt.Action>(action: A) => string)
  traceLimit?: number
}

type Compose = typeof qb.compose

interface ComposeWithDevTools {
  (options: DevToolsOptions): Compose
  <StoreExt>(...funcs: qt.StoreEnhancer<StoreExt>[]): qt.StoreEnhancer<StoreExt>
}

export const composeWithDevTools: ComposeWithDevTools =
  typeof window !== "undefined" &&
  (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
    ? (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
    : function () {
        if (arguments.length === 0) return undefined
        if (typeof arguments[0] === "object") return qb.compose
        return qb.compose.apply(null, arguments as any as Function[])
      }

export const devToolsEnhancer: {
  (options: DevToolsOptions): qt.StoreEnhancer<any>
} =
  typeof window !== "undefined" && (window as any).__REDUX_DEVTOOLS_EXTENSION__
    ? (window as any).__REDUX_DEVTOOLS_EXTENSION__
    : function () {
        return function (noop) {
          return noop
        }
      }
