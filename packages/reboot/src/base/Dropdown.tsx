import { qsa, addEventListener } from "./utils.js"
import { useCallback, useRef, useEffect, useMemo, useContext } from "react"
import * as React from "react"
import { noop, useCallbackRef, useUncontrolledProp } from "../hooks.js"
import {
  usePrevious,
  useForceUpdate,
  useEventListener,
  useEventCallback,
} from "../hooks.js"
import type { SelectCallback } from "./types.js"
import { dataAttr } from "./types.js"
import { useWindow } from "./use.js"
import { SelectableContext, makeEventKey } from "./SelectableContext.jsx"
import { NavContext } from "./Nav.jsx"
import type { EventKey, DynamicRefForwardingComponent } from "./types.js"
import { Button } from "./Button.jsx"
import {
  usePopper,
  UsePopperOptions,
  Placement,
  Offset,
  UsePopperState,
  mergeOptsWithPopper,
} from "./popper.js"
import { useClickOutside, ClickOutsideOptions } from "./use.js"
import { useSSRSafeId } from "@react-aria/ssr"

export type Data = {
  toggle: (nextShow: boolean, event?: React.SyntheticEvent | Event) => void
  menuElement: HTMLElement | null
  toggleElement: HTMLElement | null
  setMenu: (ref: HTMLElement | null) => void
  setToggle: (ref: HTMLElement | null) => void
  show: boolean
  placement?: Placement
}

export const Context = React.createContext<Data | null>(null)

export interface ItemProps extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType
  active?: boolean
  disabled?: boolean
  eventKey?: EventKey
  href?: string
}

interface ItemOpts {
  key?: EventKey | null
  href?: string
  active?: boolean
  disabled?: boolean
  onClick?: React.MouseEventHandler
}

export function useDropdownItem({
  key,
  href,
  active,
  disabled,
  onClick,
}: ItemOpts) {
  const onSelectCtx = useContext(SelectableContext)
  const navContext = useContext(NavContext)
  const { activeKey } = navContext || {}
  const eventKey = makeEventKey(key, href)
  const isActive =
    active == null && key != null
      ? makeEventKey(activeKey) === eventKey
      : active
  const handleClick = useEventCallback(event => {
    if (disabled) return
    onClick?.(event)
    if (onSelectCtx && !event.isPropagationStopped()) {
      onSelectCtx(eventKey, event)
    }
  })
  return [
    {
      onClick: handleClick,
      "aria-disabled": disabled || undefined,
      "aria-selected": isActive,
      [dataAttr("dropdown-item")]: "",
    },
    { isActive },
  ] as const
}

export const Item: DynamicRefForwardingComponent<typeof Button, ItemProps> =
  React.forwardRef(
    (
      {
        eventKey,
        disabled,
        onClick,
        active,
        as: Component = Button,
        ...props
      }: ItemProps,
      ref
    ) => {
      const [dropdownItemProps] = useDropdownItem({
        key: eventKey,
        href: props.href,
        disabled,
        onClick,
        active,
      })
      return <Component {...props} ref={ref} {...dropdownItemProps} />
    }
  )
Item.displayName = "DropdownItem"

export interface MenuOpts {
  flip?: boolean
  show?: boolean
  fixed?: boolean
  placement?: Placement
  usePopper?: boolean
  enableEventListeners?: boolean
  offset?: Offset
  rootCloseEvent?: ClickOutsideOptions["clickTrigger"]
  popperConfig?: Omit<UsePopperOptions, "enabled" | "placement">
}

export type UserDropdownMenuProps = Record<string, any> & {
  ref: React.RefCallback<HTMLElement>
  style?: React.CSSProperties
  "aria-labelledby"?: string
}

export type ArrowProps = Record<string, any> & {
  ref: React.RefCallback<HTMLElement>
  style: React.CSSProperties
}

export interface MenuMeta {
  show: boolean
  placement?: Placement
  hasShown: boolean
  toggle?: Data["toggle"]
  popper: UsePopperState | null
  arrowProps: Partial<ArrowProps>
}

export function useDropdownMenu(options: MenuOpts = {}) {
  const context = useContext(Context)
  const [arrowElement, attachArrowRef] = useCallbackRef<Element>()
  const hasShownRef = useRef(false)
  const {
    flip,
    offset,
    rootCloseEvent,
    fixed = false,
    placement: placementOverride,
    popperConfig = {},
    enableEventListeners = true,
    usePopper: shouldUsePopper = !!context,
  } = options
  const show = context?.show == null ? !!options.show : context.show
  if (show && !hasShownRef.current) {
    hasShownRef.current = true
  }
  const handleClose = (e: React.SyntheticEvent | Event) => {
    context?.toggle(false, e)
  }
  const { placement, setMenu, menuElement, toggleElement } = context || {}
  const popper = usePopper(
    toggleElement,
    menuElement,
    mergeOptsWithPopper({
      placement: placementOverride || placement || "bottom-start",
      enabled: shouldUsePopper,
      enableEvents: enableEventListeners == null ? show : enableEventListeners,
      offset,
      flip,
      fixed,
      arrowElement,
      popperConfig,
    })
  )
  const menuProps: UserDropdownMenuProps = {
    ref: setMenu || noop,
    "aria-labelledby": toggleElement?.id,
    ...popper.attributes.popper,
    style: popper.styles.popper as any,
  }
  const meta: MenuMeta = {
    show,
    placement,
    hasShown: hasShownRef.current,
    toggle: context?.toggle,
    popper: shouldUsePopper ? popper : null,
    arrowProps: shouldUsePopper
      ? {
          ref: attachArrowRef,
          ...popper.attributes.arrow,
          style: popper.styles.arrow as any,
        }
      : {},
  }
  useClickOutside(menuElement, handleClose, {
    clickTrigger: rootCloseEvent,
    disabled: !show,
  })
  return [menuProps, meta] as const
}

export interface MenuProps extends MenuOpts {
  children: (props: UserDropdownMenuProps, meta: MenuMeta) => React.ReactNode
}

export function Menu({ children, ...options }: MenuProps) {
  const [props, meta] = useDropdownMenu(options)
  return <>{children(props, meta)}</>
}
Menu.displayName = "DropdownMenu"
Menu.defaultProps = {
  usePopper: true,
}

export const isRoleMenu = (el: HTMLElement) =>
  el.getAttribute("role")?.toLowerCase() === "menu"

export interface UseToggleProps {
  id: string
  ref: Data["setToggle"]
  onClick: React.MouseEventHandler
  "aria-expanded": boolean
  "aria-haspopup"?: true
}

export interface ToggleMeta {
  show: Data["show"]
  toggle: Data["toggle"]
}

export function useDropdownToggle(): [UseToggleProps, ToggleMeta] {
  const id = useSSRSafeId()
  const {
    show = false,
    toggle = noop,
    setToggle,
    menuElement,
  } = useContext(Context) || {}
  const handleClick = useCallback(
    e => {
      toggle(!show, e)
    },
    [show, toggle]
  )
  const props: UseToggleProps = {
    id,
    ref: setToggle || noop,
    onClick: handleClick,
    "aria-expanded": !!show,
  }
  if (menuElement && isRoleMenu(menuElement)) {
    props["aria-haspopup"] = true
  }
  return [props, { show, toggle }]
}

export interface ToggleProps {
  children: (props: UseToggleProps, meta: ToggleMeta) => React.ReactNode
}

export function Toggle({ children }: ToggleProps) {
  const [props, meta] = useDropdownToggle()
  return <>{children(props, meta)}</>
}
Toggle.displayName = "DropdownToggle"

export interface InjectedProps {
  onKeyDown: React.KeyboardEventHandler
}

export type ToggleEvent = React.SyntheticEvent | KeyboardEvent | MouseEvent

export interface ToggleMetadata {
  source: string | undefined
  originalEvent: ToggleEvent | undefined
}

export interface Props {
  placement?: Placement
  defaultShow?: boolean
  show?: boolean
  onSelect?: SelectCallback
  onToggle?: (nextShow: boolean, meta: ToggleMetadata) => void
  itemSelector?: string
  focusFirstItemOnShow?: boolean | "keyboard"
  children: React.ReactNode
}

function useRefWithUpdate() {
  const forceUpdate = useForceUpdate()
  const ref = useRef<HTMLElement | null>(null)
  const attachRef = useCallback(
    (element: null | HTMLElement) => {
      ref.current = element
      forceUpdate()
    },
    [forceUpdate]
  )
  return [ref, attachRef] as const
}

export function Dropdown({
  defaultShow,
  show: rawShow,
  onSelect,
  onToggle: rawOnToggle,
  itemSelector = `* [${dataAttr("dropdown-item")}]`,
  focusFirstItemOnShow,
  placement = "bottom-start",
  children,
}: Props) {
  const window = useWindow()
  const [show, onToggle] = useUncontrolledProp(
    rawShow,
    defaultShow!,
    rawOnToggle
  )
  const [menuRef, setMenu] = useRefWithUpdate()
  const menuElement = menuRef.current
  const [toggleRef, setToggle] = useRefWithUpdate()
  const toggleElement = toggleRef.current
  const lastShow = usePrevious(show)
  const lastSourceEvent = useRef<string | null>(null)
  const focusInDropdown = useRef(false)
  const onSelectCtx = useContext(SelectableContext)
  const toggle = useCallback(
    (
      nextShow: boolean,
      event: ToggleEvent | undefined,
      source: string | undefined = event?.type
    ) => {
      onToggle(nextShow, { originalEvent: event, source })
    },
    [onToggle]
  )
  const handleSelect = useEventCallback(
    (key: string | null, event: React.SyntheticEvent) => {
      onSelect?.(key, event)
      toggle(false, event, "select")
      if (!event.isPropagationStopped()) {
        onSelectCtx?.(key, event)
      }
    }
  )
  const context = useMemo(
    () => ({
      toggle,
      placement,
      show,
      menuElement,
      toggleElement,
      setMenu,
      setToggle,
    }),
    [toggle, placement, show, menuElement, toggleElement, setMenu, setToggle]
  )
  if (menuElement && lastShow && !show) {
    focusInDropdown.current = menuElement.contains(
      menuElement.ownerDocument.activeElement
    )
  }
  const focusToggle = useEventCallback(() => {
    if (toggleElement && toggleElement.focus) {
      toggleElement.focus()
    }
  })
  const maybeFocusFirst = useEventCallback(() => {
    const type = lastSourceEvent.current
    let focusType = focusFirstItemOnShow
    if (focusType == null) {
      focusType =
        menuRef.current && isRoleMenu(menuRef.current) ? "keyboard" : false
    }
    if (
      focusType === false ||
      (focusType === "keyboard" && !/^key.+$/.test(type!))
    ) {
      return
    }
    const first = qsa(menuRef.current!, itemSelector)[0]
    if (first && first.focus) first.focus()
  })
  useEffect(() => {
    if (show) maybeFocusFirst()
    else if (focusInDropdown.current) {
      focusInDropdown.current = false
      focusToggle()
    }
  }, [show, focusInDropdown, focusToggle, maybeFocusFirst])
  useEffect(() => {
    lastSourceEvent.current = null
  })
  const getNextFocusedChild = (current: HTMLElement, offset: number) => {
    if (!menuRef.current) return null
    const items = qsa(menuRef.current, itemSelector)
    let index = items.indexOf(current) + offset
    index = Math.max(0, Math.min(index, items.length))
    return items[index]
  }
  useEventListener(
    useCallback(() => window!.document, [window]),
    "keydown",
    (event: KeyboardEvent) => {
      const { key } = event
      const target = event.target as HTMLElement
      const fromMenu = menuRef.current?.contains(target)
      const fromToggle = toggleRef.current?.contains(target)
      const isInput = /input|textarea/i.test(target.tagName)
      if (
        isInput &&
        (key === " " ||
          (key !== "Escape" && fromMenu) ||
          (key === "Escape" && (target as HTMLInputElement).type === "search"))
      ) {
        return
      }
      if (!fromMenu && !fromToggle) {
        return
      }
      if (key === "Tab" && (!menuRef.current || !show)) {
        return
      }
      lastSourceEvent.current = event.type
      const meta = { originalEvent: event, source: event.type }
      switch (key) {
        case "ArrowUp": {
          const next = getNextFocusedChild(target, -1)
          if (next && next.focus) next.focus()
          event.preventDefault()
          return
        }
        case "ArrowDown":
          event.preventDefault()
          if (!show) {
            onToggle(true, meta)
          } else {
            const next = getNextFocusedChild(target, 1)
            if (next && next.focus) next.focus()
          }
          return
        case "Tab":
          addEventListener(
            target.ownerDocument as any,
            "keyup",
            e => {
              if (
                (e.key === "Tab" && !e.target) ||
                !menuRef.current?.contains(e.target as HTMLElement)
              ) {
                onToggle(false, meta)
              }
            },
            { once: true }
          )
          break
        case "Escape":
          if (key === "Escape") {
            event.preventDefault()
            event.stopPropagation()
          }
          onToggle(false, meta)
          break
        default:
      }
    }
  )
  return (
    <SelectableContext.Provider value={handleSelect}>
      <Context.Provider value={context}>{children}</Context.Provider>
    </SelectableContext.Provider>
  )
}
Dropdown.displayName = "Dropdown"
