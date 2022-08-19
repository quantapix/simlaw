/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { qsa, addEventListener } from "./utils.js"
import { useCallback, useRef, useEffect, useMemo, useContext } from "react"
import * as React from "react"
import { useUncontrolledProp } from "uncontrollable"
import {
  usePrevious,
  useForceUpdate,
  useEventListener,
  useEventCallback,
} from "../hooks.js"

import DropdownContext from "./DropdownContext.jsx"
import {
  DropdownMenu,
  DropdownMenuProps,
  UseDropdownMenuMetadata,
  UseDropdownMenuOptions,
} from "./DropdownMenu.jsx"
import DropdownToggle, {
  DropdownToggleProps,
  UseDropdownToggleMetadata,
  isRoleMenu,
} from "./DropdownToggle.jsx"
import DropdownItem, { DropdownItemProps } from "./DropdownItem.jsx"
import { SelectableContext } from "./SelectableContext.jsx"
import type { SelectCallback } from "./types.js"
import { dataAttr } from "./types.js"
import type { Placement } from "./usePopper.js"
import { useWindow } from "./useWindow.js"

export type {
  DropdownMenuProps,
  UseDropdownMenuMetadata,
  UseDropdownMenuOptions,
  DropdownToggleProps,
  UseDropdownToggleMetadata,
  DropdownItemProps,
}

export interface DropdownInjectedProps {
  onKeyDown: React.KeyboardEventHandler
}

export type ToggleEvent = React.SyntheticEvent | KeyboardEvent | MouseEvent

export interface ToggleMetadata {
  source: string | undefined
  originalEvent: ToggleEvent | undefined
}

export interface DropdownProps {
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
      // ensure that a menu set triggers an update for consumers
      forceUpdate()
    },
    [forceUpdate]
  )
  return [ref, attachRef] as const
}

function Dropdown({
  defaultShow,
  show: rawShow,
  onSelect,
  onToggle: rawOnToggle,
  itemSelector = `* [${dataAttr("dropdown-item")}]`,
  focusFirstItemOnShow,
  placement = "bottom-start",
  children,
}: DropdownProps) {
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
    // only `show` should be changing
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

      // Second only to https://github.com/twbs/bootstrap/blob/8cfbf6933b8a0146ac3fbc369f19e520bd1ebdac/js/src/dropdown.js#L400
      // in inscrutability
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
          // on keydown the target is the element being tabbed FROM, we need that
          // to know if this event is relevant to this dropdown (e.g. in this menu).
          // On `keyup` the target is the element being tagged TO which we use to check
          // if focus has left the menu
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
      <DropdownContext.Provider value={context}>
        {children}
      </DropdownContext.Provider>
    </SelectableContext.Provider>
  )
}

Dropdown.displayName = "Dropdown"

Dropdown.Menu = DropdownMenu
Dropdown.Toggle = DropdownToggle
Dropdown.Item = DropdownItem

export default Dropdown
