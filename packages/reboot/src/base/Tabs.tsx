import { Context, Data } from "./Tab.jsx"
import { useSSRSafeId } from "@react-aria/ssr"
import * as qh from "../hooks.js"
import * as qr from "react"
import * as qt from "./types.js"

export interface Props extends qr.PropsWithChildren<unknown> {
  id?: string
  transition?: qt.TransitionComponent
  mountOnEnter?: boolean
  unmountOnExit?: boolean
  generateChildId?: (eventKey: qt.EventKey, type: "tab" | "pane") => string
  onSelect?: qt.SelectCB
  activeKey?: qt.EventKey
  defaultActiveKey?: qt.EventKey
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
      ((key: qt.EventKey, type: string) =>
        id ? `${id}-${type}-${key}` : null),
    [id, generateCustomChildId]
  )
  const v: Data = qr.useMemo(
    () => ({
      onSelect,
      activeKey,
      transition,
      mountOnEnter: mountOnEnter || false,
      unmountOnExit: unmountOnExit || false,
      getControlledId: (key: qt.EventKey) => generateChildId(key, "tabpane"),
      getControllerId: (key: qt.EventKey) => generateChildId(key, "tab"),
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
      <qt.Selectable.Provider value={onSelect || null}>
        {children}
      </qt.Selectable.Provider>
    </Context.Provider>
  )
}
