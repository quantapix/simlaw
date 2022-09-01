import * as qr from "react"
import type { Draft, Nothing } from "./types.js"
import { freeze } from "./utils.js"
import { produce } from "./index.js"

export type Reducer<S = any, A = any> = (
  s: Draft<S>,
  action: A
) => void | (S extends undefined ? typeof Nothing : S)
export type DraftFunction<S> = (x: Draft<S>) => void
export type Updater<S> = (x: S | DraftFunction<S>) => void
export type Hook<S> = [S, Updater<S>]

export function useImmer<S = any>(x: S | (() => S)): Hook<S>
export function useImmer(x: any) {
  const [val, setVal] = qr.useState(() =>
    freeze(typeof x === "function" ? x() : x, true)
  )
  return [
    val,
    qr.useCallback((x: any) => {
      if (typeof x === "function") setVal(produce(x))
      else setVal(freeze(x))
    }, []),
  ]
}

export function useImmerReducer<S = any, A = any>(
  x: Reducer<S, A>,
  state0: S,
  action0?: (x: any) => S
): [S, qr.Dispatch<A>]
export function useImmerReducer(x: any, state0: any, action0: any) {
  const y = qr.useMemo(() => produce(x), [x])
  return qr.useReducer(y, state0 as any, action0)
}
