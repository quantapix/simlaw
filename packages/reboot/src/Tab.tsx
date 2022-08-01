import {
  BsPrefixProps,
  SelectCallback,
  BsPrefixRefForwardingComponent,
  TransitionType,
} from "./utils"
import {
  EventKey,
  DynamicRefForwardingComponent,
  TransitionCallbacks,
  TransitionComponent,
} from "./types"
import { useBootstrapPrefix } from "./ThemeProvider"
import { useContext } from "react"
import { useTabPanel } from "@restart/ui/TabPanel"
import * as React from "react"
import classNames from "classnames"
import createWithBsPrefix from "./createWithBsPrefix"
import getTabTransitionComponent from "./getTabTransitionComponent"
import NoopTransition from "../NoopTransition"
import { SelectableContext, makeEventKey } from "../SelectableContext"
import Tabs, { TabsProps } from "@restart/ui/Tabs"
export const TabContent = createWithBsPrefix("tab-content")

export interface TabContextType {
  onSelect: SelectCallback
  activeKey?: EventKey
  transition?: TransitionComponent
  mountOnEnter: boolean
  unmountOnExit: boolean
  getControlledId: (key: EventKey) => any
  getControllerId: (key: EventKey) => any
}
export const TabContext = React.createContext<TabContextType | null>(null)
export interface TabPanelProps extends TransitionCallbacks, React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType
  eventKey?: EventKey
  active?: boolean
  transition?: TransitionComponent
  mountOnEnter?: boolean
  unmountOnExit?: boolean
}
export interface TabPanelMetadata extends TransitionCallbacks {
  eventKey?: EventKey
  isActive?: boolean
  transition?: TransitionComponent
  mountOnEnter?: boolean
  unmountOnExit?: boolean
}
export function useTabPanel({
  active,
  eventKey,
  mountOnEnter,
  transition,
  unmountOnExit,
  ...props
}: TabPanelProps): [any, TabPanelMetadata] {
  const context = useContext(TabContext)
  if (!context)
    return [
      props,
      {
        eventKey,
        isActive: active,
        mountOnEnter,
        transition,
        unmountOnExit,
      },
    ]
  const { activeKey, getControlledId, getControllerId, ...rest } = context
  const key = makeEventKey(eventKey)
  return [
    {
      ...props,
      id: getControlledId(eventKey!),
      "aria-labelledby": getControllerId(eventKey!),
    },
    {
      eventKey,
      isActive: active == null && key != null ? makeEventKey(activeKey) === key : active,
      transition: transition || rest.transition,
      mountOnEnter: mountOnEnter != null ? mountOnEnter : rest.mountOnEnter,
      unmountOnExit: unmountOnExit != null ? unmountOnExit : rest.unmountOnExit,
    },
  ]
}
export const TabPanel: DynamicRefForwardingComponent<"div", TabPanelProps> = React.forwardRef<
  HTMLElement,
  TabPanelProps
>(({ as: Component = "div", ...props }, ref) => {
  const [
    tabPanelProps,
    {
      isActive,
      onEnter,
      onEntering,
      onEntered,
      onExit,
      onExiting,
      onExited,
      mountOnEnter,
      unmountOnExit,
      transition: Transition = NoopTransition,
    },
  ] = useTabPanel(props)
  return (
    <TabContext.Provider value={null}>
      <SelectableContext.Provider value={null}>
        <Transition
          in={isActive}
          onEnter={onEnter}
          onEntering={onEntering}
          onEntered={onEntered}
          onExit={onExit}
          onExiting={onExiting}
          onExited={onExited}
          mountOnEnter={mountOnEnter}
          unmountOnExit={unmountOnExit}
        >
          <Component
            {...tabPanelProps}
            ref={ref}
            role="tabpanel"
            hidden={!isActive}
            aria-hidden={!isActive}
          />
        </Transition>
      </SelectableContext.Provider>
    </TabContext.Provider>
  )
})
TabPanel.displayName = "TabPanel"
export interface TabContainerProps extends Omit<TabsProps, "transition"> {
  transition?: TransitionType
}
export const TabContainer = ({ transition, ...props }: TabContainerProps) => (
  <Tabs {...props} transition={getTabTransitionComponent(transition)} />
)
TabContainer.displayName = "TabContainer"
export interface TabPaneProps
  extends TransitionCallbacks,
    BsPrefixProps,
    React.HTMLAttributes<HTMLElement> {
  eventKey?: EventKey
  active?: boolean
  transition?: TransitionType
  mountOnEnter?: boolean
  unmountOnExit?: boolean
}
export const TabPane: BsPrefixRefForwardingComponent<"div", TabPaneProps> = React.forwardRef<
  HTMLElement,
  TabPaneProps
>(({ bsPrefix, transition, ...props }, ref) => {
  const [
    { className, as: Component = "div", ...rest },
    {
      isActive,
      onEnter,
      onEntering,
      onEntered,
      onExit,
      onExiting,
      onExited,
      mountOnEnter,
      unmountOnExit,
      transition: Transition = NoopTransition,
    },
  ] = useTabPanel({
    ...props,
    transition: getTabTransitionComponent(transition),
  } as any)
  const prefix = useBootstrapPrefix(bsPrefix, "tab-pane")
  return (
    <TabContext.Provider value={null}>
      <SelectableContext.Provider value={null}>
        <Transition
          in={isActive}
          onEnter={onEnter}
          onEntering={onEntering}
          onEntered={onEntered}
          onExit={onExit}
          onExiting={onExiting}
          onExited={onExited}
          mountOnEnter={mountOnEnter}
          unmountOnExit={unmountOnExit as any}
        >
          <Component
            {...rest}
            ref={ref}
            className={classNames(className, prefix, isActive && "active")}
          />
        </Transition>
      </SelectableContext.Provider>
    </TabContext.Provider>
  )
})
TabPane.displayName = "TabPane"
export interface TabProps extends Omit<TabPaneProps, "title"> {
  title: React.ReactNode
  disabled?: boolean
  tabClassName?: string
}
export const Tab: React.FC<TabProps> = () => {
  throw new Error(
    "ReactBootstrap: The `Tab` component is not meant to be rendered! " +
      "It's an abstract component that is only valid as a direct Child of the `Tabs` Component. " +
      "For custom tabs components use TabPane and TabsContainer directly"
  )
  return <></>
}
Object.assign(Tab, {
  Container: TabContainer,
  Content: TabContent,
  Pane: TabPane,
})
