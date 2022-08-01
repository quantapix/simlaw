import { EventKey, SelectCallback, TransitionComponent } from "./types"
import { forEach, map } from "./ElementChildren"
import { TransitionType } from "./utils"
import { useMemo } from "react"
import { useSSRSafeId } from "./ssr"
import { useUncontrolled } from "uncontrollable"
import { useUncontrolledProp } from "uncontrollable"
import * as React from "react"
import getTabTransitionComponent from "./getTabTransitionComponent"
import { Nav, NavItem, NavLink } from "./Nav"
import SelectableContext from "../SelectableContext"
import { TabContent, TabContext, TabContextType, TabPane, TabPanel } from "./Tab"
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
export const Tabs = (ps: TabsProps) => {
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
  } = ps
  const [activeKey, onSelect] = useUncontrolledProp(propsActiveKey, defaultActiveKey, propsOnSelect)
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
    [onSelect, activeKey, transition, mountOnEnter, unmountOnExit, generateChildId]
  )
  return (
    <TabContext.Provider value={tabContext}>
      <SelectableContext.Provider value={onSelect || null}>{children}</SelectableContext.Provider>
    </TabContext.Provider>
  )
}
Tabs.Panel = TabPanel
export interface TabsProps
  extends Omit<BaseTabsProps, "transition">,
    Omit<React.HTMLAttributes<HTMLElement>, "onSelect"> {
  variant?: "tabs" | "pills"
  transition?: TransitionType
}
const defaultProps = function getDefaultActiveKey(children) {
  let defaultActiveKey
  forEach(children, child => {
    if (defaultActiveKey == null) {
      defaultActiveKey = child.props.eventKey
    }
  })
  return defaultActiveKey
}
function renderTab(child) {
  const { title, eventKey, disabled, tabClassName, id } = child.props
  if (title == null) {
    return null
  }
  return (
    <NavItem as="li" role="presentation">
      <NavLink
        as="button"
        type="button"
        eventKey={eventKey}
        disabled={disabled}
        id={id}
        className={tabClassName}
      >
        {title}
      </NavLink>
    </NavItem>
  )
}
export const Tabs = (props: TabsProps) => {
  const {
    id,
    onSelect,
    transition,
    mountOnEnter,
    unmountOnExit,
    children,
    activeKey = getDefaultActiveKey(children),
    ...controlledProps
  } = useUncontrolled(props, {
    activeKey: "onSelect",
  })
  return (
    <BaseTabs
      id={id}
      activeKey={activeKey}
      onSelect={onSelect}
      transition={getTabTransitionComponent(transition)}
      mountOnEnter={mountOnEnter}
      unmountOnExit={unmountOnExit}
    >
      <Nav {...controlledProps} role="tablist" as="ul">
        {map(children, renderTab)}
      </Nav>
      <TabContent>
        {map(children, child => {
          const childProps = { ...child.props }
          delete childProps.title
          delete childProps.disabled
          delete childProps.tabClassName
          return <TabPane {...childProps} />
        })}
      </TabContent>
    </BaseTabs>
  )
}
Tabs.defaultProps = {
  variant: "tabs",
  mountOnEnter: false,
  unmountOnExit: false,
}
Tabs.displayName = "Tabs"
