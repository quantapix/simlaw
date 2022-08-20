import * as React from "react"
import { useMemo } from "react"
import { useUncontrolledProp } from "../hooks.js"
import { useSSRSafeId } from "./ssr.jsx"
import { Context, Data } from "./Tab.jsx"
import { SelectableContext } from "./SelectableContext.jsx"
import type { EventKey, SelectCallback, TransitionComponent } from "./types.js"

export interface Props extends React.PropsWithChildren<unknown> {
  id?: string
  transition?: TransitionComponent
  mountOnEnter?: boolean
  unmountOnExit?: boolean
  generateChildId?: (eventKey: EventKey, type: "tab" | "pane") => string
  onSelect?: SelectCallback
  activeKey?: EventKey
  defaultActiveKey?: EventKey
}

export const Tabs = (props: Props) => {
  const {
    id: userId,
    generateChildId: generateCustomChildId,
    onSelect: propsOnSelect,
    activeKey: propsActiveKey,
    defaultActiveKey,
    transition,
    mountOnEnter,
    unmountOnExit,
    children,
  } = props
  const [activeKey, onSelect] = useUncontrolledProp(
    propsActiveKey,
    defaultActiveKey,
    propsOnSelect
  )
  const id = useSSRSafeId(userId)
  const generateChildId = useMemo(
    () =>
      generateCustomChildId ||
      ((key: EventKey, type: string) => (id ? `${id}-${type}-${key}` : null)),
    [id, generateCustomChildId]
  )
  const v: Data = useMemo(
    () => ({
      onSelect,
      activeKey,
      transition,
      mountOnEnter: mountOnEnter || false,
      unmountOnExit: unmountOnExit || false,
      getControlledId: (key: EventKey) => generateChildId(key, "tabpane"),
      getControllerId: (key: EventKey) => generateChildId(key, "tab"),
    }),
    [
      onSelect,
      activeKey,
      transition,
      mountOnEnter,
      unmountOnExit,
      generateChildId,
    ]
  )
  return (
    <Context.Provider value={v}>
      <SelectableContext.Provider value={onSelect || null}>
        {children}
      </SelectableContext.Provider>
    </Context.Provider>
  )
}
