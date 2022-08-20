import * as React from "react"
import { useContext } from "react"
import { SelectableContext, makeEventKey } from "./SelectableContext.jsx"
import type {
  EventKey,
  DynamicRefForwardingComponent,
  TransitionCallbacks,
  TransitionComponent,
  SelectCallback,
} from "./types.js"
import { NoopTransition } from "./NoopTransition.jsx"

export interface Data {
  onSelect: SelectCallback
  activeKey?: EventKey
  transition?: TransitionComponent
  mountOnEnter: boolean
  unmountOnExit: boolean
  getControlledId: (key: EventKey) => any
  getControllerId: (key: EventKey) => any
}

export const Context = React.createContext<Data | null>(null)

export interface Props
  extends TransitionCallbacks,
    React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType
  eventKey?: EventKey
  active?: boolean
  transition?: TransitionComponent
  mountOnEnter?: boolean
  unmountOnExit?: boolean
}

export interface Meta extends TransitionCallbacks {
  eventKey?: EventKey | undefined
  isActive?: boolean | undefined
  transition?: TransitionComponent | undefined
  mountOnEnter?: boolean | undefined
  unmountOnExit?: boolean | undefined
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
}: Props): [any, Meta] {
  const context = useContext(Context)
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

export const Panel: DynamicRefForwardingComponent<"div", Props> =
  React.forwardRef<HTMLElement, Props>(
    ({ as: Component = "div", ...ps }, ref) => {
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
      ] = useTabPanel(ps)
      return (
        <Context.Provider value={null}>
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
        </Context.Provider>
      )
    }
  )
Panel.displayName = "TabPanel"
