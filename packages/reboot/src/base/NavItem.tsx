import * as React from "react"
import { useContext } from "react"
import { useEventCallback } from "../hooks.js"
import NavContext from "./NavContext.jsx"
import { SelectableContext, makeEventKey } from "./SelectableContext.jsx"
import type { EventKey, DynamicRefForwardingComponent } from "./types.js"
import { Button } from "./Button.jsx"
import { dataAttr } from "./types.js"
import { TabContext } from "./TabContext.jsx"

export interface NavItemProps extends React.HTMLAttributes<HTMLElement> {
  active?: boolean
  as?: React.ElementType
  disabled?: boolean
  eventKey?: EventKey
  href?: string
}

export interface UseNavItemOptions {
  key?: string | null
  onClick?: React.MouseEventHandler
  active?: boolean
  disabled?: boolean
  id?: string
  role?: string
}

export function useNavItem({
  key,
  onClick,
  active,
  id,
  role,
  disabled,
}: UseNavItemOptions) {
  const parentOnSelect = useContext(SelectableContext)
  const navContext = useContext(NavContext)
  const tabContext = useContext(TabContext)

  let isActive = active
  const props = { role } as any

  if (navContext) {
    if (!role && navContext.role === "tablist") props.role = "tab"
    const contextControllerId = navContext.getControllerId(key ?? null)
    const contextControlledId = navContext.getControlledId(key ?? null)
    props[dataAttr("event-key")] = key
    props.id = contextControllerId || id
    isActive =
      active == null && key != null ? navContext.activeKey === key : active
    if (isActive || (!tabContext?.unmountOnExit && !tabContext?.mountOnEnter))
      props["aria-controls"] = contextControlledId
  }
  if (props.role === "tab") {
    props["aria-selected"] = isActive
    if (!isActive) {
      props.tabIndex = -1
    }
    if (disabled) {
      props.tabIndex = -1
      props["aria-disabled"] = true
    }
  }
  props.onClick = useEventCallback((e: React.MouseEvent) => {
    if (disabled) return
    onClick?.(e)
    if (key == null) {
      return
    }
    if (parentOnSelect && !e.isPropagationStopped()) {
      parentOnSelect(key, e)
    }
  })
  return [props, { isActive }] as const
}

export const NavItem: DynamicRefForwardingComponent<
  typeof Button,
  NavItemProps
> = React.forwardRef<HTMLElement, NavItemProps>(
  ({ as: Component = Button, active, eventKey, ...options }, ref) => {
    const [props, meta] = useNavItem({
      key: makeEventKey(eventKey, options.href),
      active,
      ...options,
    })
    props[dataAttr("active")] = meta.isActive
    return <Component {...options} {...props} ref={ref} />
  }
)
NavItem.displayName = "NavItem"
