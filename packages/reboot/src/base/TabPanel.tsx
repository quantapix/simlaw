/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react"
import { useContext } from "react"
import TabContext from "./TabContext.jsx"
import SelectableContext, { makeEventKey } from "./SelectableContext.jsx"
import type {
  EventKey,
  DynamicRefForwardingComponent,
  TransitionCallbacks,
  TransitionComponent,
} from "./types.js"
import NoopTransition from "./NoopTransition.jsx"

export interface TabPanelProps
  extends TransitionCallbacks,
    React.HTMLAttributes<HTMLElement> {
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
  role = "tabpanel",
  onEnter,
  onEntering,
  onEntered,
  onExit,
  onExiting,
  onExited,
  ...props
}: TabPanelProps): [any, TabPanelMetadata] {
  const context = useContext(TabContext)

  if (!context)
    return [
      {
        ...props,
        role,
      },
      {
        eventKey,
        isActive: active,
        mountOnEnter,
        transition,
        unmountOnExit,
        onEnter,
        onEntering,
        onEntered,
        onExit,
        onExiting,
        onExited,
      },
    ]

  const { activeKey, getControlledId, getControllerId, ...rest } = context
  const key = makeEventKey(eventKey)

  return [
    {
      ...props,
      role,
      id: getControlledId(eventKey!),
      "aria-labelledby": getControllerId(eventKey!),
    },
    {
      eventKey,
      isActive:
        active == null && key != null
          ? makeEventKey(activeKey) === key
          : active,
      transition: transition || rest.transition,
      mountOnEnter: mountOnEnter != null ? mountOnEnter : rest.mountOnEnter,
      unmountOnExit: unmountOnExit != null ? unmountOnExit : rest.unmountOnExit,
      onEnter,
      onEntering,
      onEntered,
      onExit,
      onExiting,
      onExited,
    },
  ]
}

export const TabPanel: DynamicRefForwardingComponent<"div", TabPanelProps> =
  React.forwardRef<HTMLElement, TabPanelProps>(
    ({ as: Component = "div", ...props }, ref) => {
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
                hidden={!isActive}
                aria-hidden={!isActive}
              />
            </Transition>
          </SelectableContext.Provider>
        </TabContext.Provider>
      )
    }
  )
TabPanel.displayName = "TabPanel"
