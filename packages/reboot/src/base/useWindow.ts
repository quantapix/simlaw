import { createContext, useContext } from "react"
import canUseDOM from "dom-helpers/canUseDOM"

const Context = createContext(canUseDOM ? window : undefined)

export const WindowProvider = Context.Provider

export function useWindow() {
  return useContext(Context)
}
