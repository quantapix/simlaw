import * as React from "react"
import { useMemo } from "react"
import { useUncontrolledProp } from "uncontrollable"
import { useSSRSafeId } from "./ssr.jsx"
import TabContext, { TabContextType } from "./TabContext.jsx"
import SelectableContext from "./SelectableContext.jsx"
import type { EventKey, SelectCallback, TransitionComponent } from "./types.js"
import TabPanel, { TabPanelProps } from "./TabPanel.jsx"

export type { TabPanelProps }
export interface TabsProps extends React.PropsWithChildren<unknown> {
  id?: string
  transition?: TransitionComponent
  mountOnEnter?: boolean
  unmountOnExit?: boolean
  generateChildId?: (eventKey: EventKey, type: "tab" | "pane") => string
  onSelect?: SelectCallback
  activeKey?: EventKey
  defaultActiveKey?: EventKey
}

export const Tabs = (props: TabsProps) => {
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

  const tabContext: TabContextType = useMemo(
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
    <TabContext.Provider value={tabContext}>
      <SelectableContext.Provider value={onSelect || null}>
        {children}
      </SelectableContext.Provider>
    </TabContext.Provider>
  )
}
Tabs.Panel = TabPanel
export default Tabs
