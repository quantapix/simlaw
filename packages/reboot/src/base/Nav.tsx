import { qsa } from "./utils.js"
import * as React from "react"
import { useContext, useEffect, useRef } from "react"
import {
  noop,
  useEventCallback,
  useForceUpdate,
  useMergedRefs,
} from "../hooks.js"
import { SelectableContext, makeEventKey } from "./SelectableContext.jsx"
import { TabContext } from "./Tab.jsx"
import type {
  EventKey,
  DynamicRefForwardingComponent,
  SelectCallback,
} from "./types.js"
import { dataAttr, dataProp } from "./types.js"
import { Button } from "./Button.jsx"

interface Data {
  role?: string
  activeKey: EventKey | null
  getControlledId: (key: EventKey | null) => string
  getControllerId: (key: EventKey | null) => string
}

export const Context = React.createContext<Data | null>(null)
Context.displayName = "NavContext"

export interface ItemProps extends React.HTMLAttributes<HTMLElement> {
  active?: boolean
  as?: React.ElementType
  disabled?: boolean
  eventKey?: EventKey
  href?: string
}

export interface ItemOpts {
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
}: ItemOpts) {
  const parentOnSelect = useContext(SelectableContext)
  const navContext = useContext(Context)
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

export const Item: DynamicRefForwardingComponent<typeof Button, ItemProps> =
  React.forwardRef<HTMLElement, ItemProps>(
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
Item.displayName = "NavItem"

export interface Props
  extends Omit<React.HTMLAttributes<HTMLElement>, "onSelect"> {
  activeKey?: EventKey
  as?: React.ElementType
  onSelect?: SelectCallback
}

const EVENT_KEY_ATTR = dataAttr("event-key")
export const Nav: DynamicRefForwardingComponent<"div", Props> =
  React.forwardRef<HTMLElement, Props>(
    (
      { as: Component = "div", onSelect, activeKey, role, onKeyDown, ...props },
      ref
    ) => {
      const forceUpdate = useForceUpdate()
      const needsRefocusRef = useRef(false)
      const parentOnSelect = useContext(SelectableContext)
      const tabContext = useContext(TabContext)
      let getControlledId, getControllerId
      if (tabContext) {
        role = role || "tablist"
        activeKey = tabContext.activeKey
        getControlledId = tabContext.getControlledId
        getControllerId = tabContext.getControllerId
      }
      const listNode = useRef<HTMLElement>(null)
      const getNextActiveTab = (offset: number) => {
        const currentListNode = listNode.current
        if (!currentListNode) return null
        const items = qsa(
          currentListNode,
          `[${EVENT_KEY_ATTR}]:not([aria-disabled=true])`
        )
        const activeChild = currentListNode.querySelector<HTMLElement>(
          "[aria-selected=true]"
        )
        if (!activeChild || activeChild !== document.activeElement) return null
        const index = items.indexOf(activeChild)
        if (index === -1) return null
        let nextIndex = index + offset
        if (nextIndex >= items.length) nextIndex = 0
        if (nextIndex < 0) nextIndex = items.length - 1
        return items[nextIndex]
      }
      const handleSelect = (
        key: string | null,
        event: React.SyntheticEvent
      ) => {
        if (key == null) return
        onSelect?.(key, event)
        parentOnSelect?.(key, event)
      }
      const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
        onKeyDown?.(event)
        if (!tabContext) {
          return
        }
        let nextActiveChild
        switch (event.key) {
          case "ArrowLeft":
          case "ArrowUp":
            nextActiveChild = getNextActiveTab(-1)
            break
          case "ArrowRight":
          case "ArrowDown":
            nextActiveChild = getNextActiveTab(1)
            break
          default:
            return
        }
        if (!nextActiveChild) return
        event.preventDefault()
        handleSelect(
          nextActiveChild.dataset[dataProp("EventKey")] || null,
          event
        )
        needsRefocusRef.current = true
        forceUpdate()
      }
      useEffect(() => {
        if (listNode.current && needsRefocusRef.current) {
          const activeChild = listNode.current.querySelector<HTMLElement>(
            `[${EVENT_KEY_ATTR}][aria-selected=true]`
          )
          activeChild?.focus()
        }
        needsRefocusRef.current = false
      })
      const mergedRef = useMergedRefs(ref, listNode)
      return (
        <SelectableContext.Provider value={handleSelect}>
          <Context.Provider
            value={{
              role,
              activeKey: makeEventKey(activeKey),
              getControlledId: getControlledId || noop,
              getControllerId: getControllerId || noop,
            }}
          >
            <Component
              {...props}
              onKeyDown={handleKeyDown}
              ref={mergedRef}
              role={role}
            />
          </Context.Provider>
        </SelectableContext.Provider>
      )
    }
  )
Nav.displayName = "Nav"
