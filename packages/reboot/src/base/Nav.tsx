import { Button } from "./Button.jsx"
import { Context as TabContext } from "./Tab.jsx"
import { qsa } from "./utils.js"
import * as qh from "../hooks.js"
import * as qr from "react"
import * as qt from "./types.js"

interface Data {
  role?: string
  activeKey: qt.EventKey | null
  getControlledId: (key: qt.EventKey | null) => string
  getControllerId: (key: qt.EventKey | null) => string
}

export const Context = qr.createContext<Data | null>(null)
Context.displayName = "NavContext"

export interface ItemProps extends qr.HTMLAttributes<HTMLElement> {
  active?: boolean
  as?: qr.ElementType
  disabled?: boolean
  eventKey?: qt.EventKey
  href?: string
}

export interface ItemOpts {
  key?: string | null
  onClick?: qr.MouseEventHandler | undefined
  active?: boolean | undefined
  disabled?: boolean
  id?: string | undefined
  role?: string | undefined
}

export function useNavItem({
  key,
  onClick,
  active,
  id,
  role,
  disabled,
}: ItemOpts) {
  const parentOnSelect = qr.useContext(qt.Selectable)
  const navContext = qr.useContext(Context)
  const tabContext = qr.useContext(TabContext)
  let isActive = active
  const props = { role } as any
  if (navContext) {
    if (!role && navContext.role === "tablist") props.role = "tab"
    const contextControllerId = navContext.getControllerId(key ?? null)
    const contextControlledId = navContext.getControlledId(key ?? null)
    props[qt.dataAttr("event-key")] = key
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
  props.onClick = qh.useEventCallback((e: qr.MouseEvent) => {
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

export const Item: qt.DynRef<typeof Button, ItemProps> = qr.forwardRef<
  HTMLElement,
  ItemProps
>(({ as: Component = Button, active, eventKey, ...options }, ref) => {
  const [props, meta] = useNavItem({
    key: qt.makeEventKey(eventKey, options.href),
    active,
    ...options,
  })
  props[qt.dataAttr("active")] = meta.isActive
  return <Component {...options} {...props} ref={ref} />
})
Item.displayName = "NavItem"

export interface Props
  extends Omit<qr.HTMLAttributes<HTMLElement>, "onSelect"> {
  activeKey?: qt.EventKey | undefined
  as?: qr.ElementType
  onSelect?: qt.SelectCB | undefined
}

const EVENT_KEY_ATTR = qt.dataAttr("event-key")

export const Nav: qt.DynRef<"div", Props> = qr.forwardRef<HTMLElement, Props>(
  (
    { as: Component = "div", onSelect, activeKey, role, onKeyDown, ...props },
    ref
  ) => {
    const forceUpdate = qh.useForceUpdate()
    const needsRefocusRef = qr.useRef(false)
    const parentOnSelect = qr.useContext(qt.Selectable)
    const tabContext = qr.useContext(TabContext)
    let getControlledId, getControllerId
    if (tabContext) {
      role = role || "tablist"
      activeKey = tabContext.activeKey
      getControlledId = tabContext.getControlledId
      getControllerId = tabContext.getControllerId
    }
    const listNode = qr.useRef<HTMLElement>(null)
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
    const handleSelect = (key: string | null, event: qr.SyntheticEvent) => {
      if (key == null) return
      onSelect?.(key, event)
      parentOnSelect?.(key, event)
    }
    const handleKeyDown = (event: qr.KeyboardEvent<HTMLElement>) => {
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
        nextActiveChild.dataset[qt.dataProp("EventKey")] || null,
        event
      )
      needsRefocusRef.current = true
      forceUpdate()
    }
    qr.useEffect(() => {
      if (listNode.current && needsRefocusRef.current) {
        const activeChild = listNode.current.querySelector<HTMLElement>(
          `[${EVENT_KEY_ATTR}][aria-selected=true]`
        )
        activeChild?.focus()
      }
      needsRefocusRef.current = false
    })
    const mergedRef = qh.useMergedRefs(ref, listNode)
    return (
      <qt.Selectable.Provider value={handleSelect}>
        <Context.Provider
          value={{
            role,
            activeKey: qt.makeEventKey(activeKey),
            getControlledId: getControlledId || qh.noop,
            getControllerId: getControllerId || qh.noop,
          }}
        >
          <Component
            {...props}
            onKeyDown={handleKeyDown}
            ref={mergedRef}
            role={role}
          />
        </Context.Provider>
      </qt.Selectable.Provider>
    )
  }
)
Nav.displayName = "Nav"
