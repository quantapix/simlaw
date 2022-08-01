import * as React from "react"
import { EventKey, SelectCallback } from "./types"
export const SelectableContext = React.createContext<SelectCallback | null>(null)
export const makeEventKey = (k?: EventKey | null, href: string | null = null): string | null => {
  if (k != null) return String(k)
  return href || null
}
