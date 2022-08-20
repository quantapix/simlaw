import * as React from "react"
import type { Placement } from "./usePopper.js"

export type Data = {
  toggle: (nextShow: boolean, event?: React.SyntheticEvent | Event) => void
  menuElement: HTMLElement | null
  toggleElement: HTMLElement | null
  setMenu: (ref: HTMLElement | null) => void
  setToggle: (ref: HTMLElement | null) => void
  show: boolean
  placement?: Placement
}

export const Context = React.createContext<Data | null>(null)
