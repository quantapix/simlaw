import { Context, Data } from "./Tab.jsx"
import { useSSRSafeId } from "@react-aria/ssr"
import * as qh from "../hooks.js"
import * as qr from "react"
import * as qt from "./types.js"

export interface Props extends qr.PropsWithChildren<unknown> {
  id?: string | undefined
  transition?: qt.TransitionComponent | undefined
  mountOnEnter?: boolean | undefined
  unmountOnExit?: boolean | undefined
  generateChildId?: (key: qt.EventKey, type: "tab" | "pane") => string
  onSelect?: qt.SelectCB | undefined
  activeKey?: qt.EventKey
  defaultActiveKey?: qt.EventKey
}

export const Tabs = (ps: Props) => {
  const {
    activeKey: _activeKey,
    children,
    defaultActiveKey,
    generateChildId: _generateChildId,
    id: _id,
    mountOnEnter,
    onSelect: _onSelect,
    transition,
    unmountOnExit,
  } = ps
  const [activeKey, onSelect] = qh.useUncontrolledVal(
    _activeKey,
    defaultActiveKey,
    _onSelect
  )
  const id = useSSRSafeId(_id)
  const genId = qr.useMemo(
    () =>
      _generateChildId ||
      ((k: qt.EventKey, type: string) => (id ? `${id}-${type}-${k}` : null)),
    [id, _generateChildId]
  )
  const v: Data = qr.useMemo(
    () => ({
      onSelect,
      activeKey,
      transition,
      mountOnEnter: mountOnEnter || false,
      unmountOnExit: unmountOnExit || false,
      getControlledId: (key: qt.EventKey) => genId(key, "pane"),
      getControllerId: (key: qt.EventKey) => genId(key, "tab"),
    }),
    [onSelect, activeKey, transition, mountOnEnter, unmountOnExit, genId]
  )
  return (
    <Context.Provider value={v}>
      <qt.Selectable.Provider value={onSelect || null}>
        {children}
      </qt.Selectable.Provider>
    </Context.Provider>
  )
}
