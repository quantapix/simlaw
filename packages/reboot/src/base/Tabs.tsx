import * as qr from "react"
import * as qh from "../hooks.js"
import { useSSRSafeId } from "@react-aria/ssr"
import { Context, Data } from "./Tab.jsx"
import { SelectableContext } from "./SelectableContext.jsx"
import type { EventKey, SelectCallback, TransitionComponent } from "./types.js"

export interface Props extends qr.PropsWithChildren<unknown> {
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
  const [activeKey, onSelect] = qh.useUncontrolledProp(
    propsActiveKey,
    defaultActiveKey,
    propsOnSelect
  )
  const id = useSSRSafeId(userId)
  const generateChildId = qr.useMemo(
    () =>
      generateCustomChildId ||
      ((key: EventKey, type: string) => (id ? `${id}-${type}-${key}` : null)),
    [id, generateCustomChildId]
  )
  const v: Data = qr.useMemo(
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
