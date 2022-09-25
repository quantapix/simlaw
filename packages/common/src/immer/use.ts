import { produce } from "./index.js"
import * as qr from "react"
import * as qu from "./utils.js"
import type * as qt from "./types.js"

export type DraftFun<T> = (x: qt.Draft<T>) => void
export type Updater<T> = (x: T | DraftFun<T>) => void
export type Hook<T> = [T, Updater<T>]

export type Reducer<T = any, A = any> = (
  x: qt.Draft<T>,
  action: A
) => void | (T extends undefined ? typeof qt.Nothing : T)

export function useImmer<T = any>(x: T | (() => T)): Hook<T>
export function useImmer(x: any) {
  const [val, setVal] = qr.useState(() => qu.freeze(typeof x === "function" ? x() : x, true))
  return [
    val,
    qr.useCallback((x: any) => {
      if (typeof x === "function") setVal(produce(x))
      else setVal(qu.freeze(x))
    }, []),
  ]
}

export function useImmerReducer<T = any, A = any>(
  x: Reducer<T, A>,
  state0: T,
  action0?: (x: any) => T
): [T, qr.Dispatch<A>]
export function useImmerReducer(x: any, state0: any, action0: any) {
  const y = qr.useMemo(() => produce(x), [x])
  return qr.useReducer(y, state0 as any, action0)
}
