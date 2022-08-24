import { Button } from "./Button.jsx"
import { Context as NavContext } from "./Nav.jsx"
import { qsa, addEventListener } from "./utils.js"
import { useSSRSafeId } from "@react-aria/ssr"
import * as qh from "../hooks.js"
import * as qp from "./popper.js"
import * as qr from "react"
import * as qt from "./types.js"
import * as qu from "./use.js"

export type Data = {
  toggle: (nextShow: boolean, event?: qr.SyntheticEvent | Event) => void
  menuElement: HTMLElement | null
  toggleElement: HTMLElement | null
  setMenu: (ref: HTMLElement | null) => void
  setToggle: (ref: HTMLElement | null) => void
  show: boolean
  placement?: qp.Placement
}

export const Context = qr.createContext<Data | null>(null)

export interface ItemProps extends qr.HTMLAttributes<HTMLElement> {
  as?: qr.ElementType
  active?: boolean
  disabled?: boolean
  eventKey?: qt.EventKey
  href?: string
}

interface ItemOpts {
  key?: qt.EventKey | null | undefined
  href?: string | undefined
  active?: boolean | undefined
  disabled?: boolean | undefined
  onClick?: qr.MouseEventHandler | undefined
}

export function useItem({ key, href, active, disabled, onClick }: ItemOpts) {
  const onSelectCtx = qr.useContext(qt.Selectable)
  const navContext = qr.useContext(NavContext)
  const { activeKey } = navContext || {}
  const eventKey = qt.makeEventKey(key, href)
  const isActive =
    active == null && key != null
      ? qt.makeEventKey(activeKey) === eventKey
      : active
  const doClick = qh.useEventCB(e => {
    if (disabled) return
    onClick?.(e)
    if (onSelectCtx && !e.isPropagationStopped()) {
      onSelectCtx(eventKey, e)
    }
  })
  return [
    {
      onClick: doClick,
      "aria-disabled": disabled || undefined,
      "aria-selected": isActive,
      [qt.dataAttr("dropdown-item")]: "",
    },
    { isActive },
  ] as const
}

export const Item: qt.DynRef<typeof Button, ItemProps> = qr.forwardRef(
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
    const [dropdownItemProps] = useItem({
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
  flip?: boolean | undefined
  show?: boolean | undefined
  fixed?: boolean
  placement?: qp.Placement
  usePopper?: boolean
  enableEventListeners?: boolean
  offset?: qp.Offset | undefined
  rootCloseEvent?: qu.ClickOutsideOptions["clickTrigger"]
  popperConfig?: Omit<qp.UseOptions, "enabled" | "placement"> | undefined
}

export type UseMenuProps = Record<string, any> & {
  ref: qr.RefCallback<HTMLElement>
  style?: qr.CSSProperties
  "aria-labelledby"?: string | undefined
}

export type ArrowProps = Record<string, any> & {
  ref: qr.RefCallback<HTMLElement>
  style: qr.CSSProperties
}

export interface MenuMeta {
  show: boolean
  placement?: qp.Placement | undefined
  hasShown: boolean
  toggle?: Data["toggle"] | undefined
  popper: qp.UseState | null
  arrowProps: Partial<ArrowProps>
}

export function useMenu(options: MenuOpts = {}) {
  const context = qr.useContext(Context)
  const [arrowElement, attachArrowRef] = qh.useCallbackRef<Element>()
  const hasShownRef = qr.useRef(false)
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
  const doClose = (e: qr.SyntheticEvent | Event) => {
    context?.toggle(false, e)
  }
  const { placement, setMenu, menuElement, toggleElement } = context || {}
  const popper = qp.usePopper(
    toggleElement,
    menuElement,
    qp.mergeOptsWithPopper({
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
  const menuProps: UseMenuProps = {
    ref: setMenu || qh.noop,
    "aria-labelledby": toggleElement?.id,
    ...popper.attributes["popper"],
    style: popper.styles["popper"] as any,
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
          ...popper.attributes["arrow"],
          style: popper.styles["arrow"] as any,
        }
      : {},
  }
  qu.useClickOutside(menuElement, doClose, {
    clickTrigger: rootCloseEvent,
    disabled: !show,
  })
  return [menuProps, meta] as const
}

export interface MenuProps extends MenuOpts {
  children: (props: UseMenuProps, meta: MenuMeta) => qr.ReactNode
}

export function Menu({ children, ...options }: MenuProps) {
  const [props, meta] = useMenu(options)
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
  onClick: qr.MouseEventHandler
  "aria-expanded": boolean
  "aria-haspopup"?: true
}

export interface ToggleMeta {
  show: Data["show"]
  toggle: Data["toggle"]
}

export function useToggle(): [UseToggleProps, ToggleMeta] {
  const id = useSSRSafeId()
  const {
    show = false,
    toggle = qh.noop,
    setToggle,
    menuElement,
  } = qr.useContext(Context) || {}
  const doClick = qr.useCallback(
    (e: any) => {
      toggle(!show, e)
    },
    [show, toggle]
  )
  const props: UseToggleProps = {
    id,
    ref: setToggle || qh.noop,
    onClick: doClick,
    "aria-expanded": !!show,
  }
  if (menuElement && isRoleMenu(menuElement)) {
    props["aria-haspopup"] = true
  }
  return [props, { show, toggle }]
}

export interface ToggleProps {
  children: (props: UseToggleProps, meta: ToggleMeta) => qr.ReactNode
}

export function Toggle({ children }: ToggleProps) {
  const [props, meta] = useToggle()
  return <>{children(props, meta)}</>
}
Toggle.displayName = "DropdownToggle"

export interface InjectedProps {
  onKeyDown: qr.KeyboardEventHandler
}

export type ToggleEvent = qr.SyntheticEvent | KeyboardEvent | MouseEvent

export interface ToggleMetadata {
  source: string | undefined
  originalEvent: ToggleEvent | undefined
}

export interface Props {
  placement?: qp.Placement
  defaultShow?: boolean
  show?: boolean | undefined
  onSelect?: qt.SelectCB | undefined
  onToggle?: (nextShow: boolean, meta: ToggleMetadata) => void
  itemSelector?: string
  focusFirstItemOnShow?: boolean | "keyboard" | undefined
  children: qr.ReactNode
}

function useRefWithUpdate() {
  const forceUpdate = qh.useForceUpdate()
  const ref = qr.useRef<HTMLElement | null>(null)
  const cb = qr.useCallback(
    (element: null | HTMLElement) => {
      ref.current = element
      forceUpdate()
    },
    [forceUpdate]
  )
  return [ref, cb] as const
}

export function Dropdown({
  children,
  defaultShow,
  focusFirstItemOnShow,
  itemSelector = `* [${qt.dataAttr("dropdown-item")}]`,
  onSelect,
  onToggle: _onToggle,
  placement = "bottom-start",
  show: _show,
}: Props) {
  const window = qu.useWindow()
  const [show, onToggle] = qh.useUncontrolledVal(_show, defaultShow, _onToggle)
  const [menuRef, setMenu] = useRefWithUpdate()
  const menuElement = menuRef.current
  const [toggleRef, setToggle] = useRefWithUpdate()
  const toggleElement = toggleRef.current
  const lastShow = qh.usePrevious(show)
  const lastSourceEvent = qr.useRef<string | null>(null)
  const focusInDropdown = qr.useRef(false)
  const onSelectCtx = qr.useContext(qt.Selectable)
  const doToggle = qr.useCallback(
    (
      nextShow: boolean,
      event: ToggleEvent | undefined,
      source: string | undefined = event?.type
    ) => {
      onToggle(nextShow, { originalEvent: event, source })
    },
    [onToggle]
  )
  const doSelect = qh.useEventCB(
    (key: string | null, event: qr.SyntheticEvent) => {
      onSelect?.(key, event)
      doToggle(false, event, "select")
      if (!event.isPropagationStopped()) {
        onSelectCtx?.(key, event)
      }
    }
  )
  const context = qr.useMemo(
    () => ({
      toggle: doToggle,
      placement,
      show,
      menuElement,
      toggleElement,
      setMenu,
      setToggle,
    }),
    [doToggle, placement, show, menuElement, toggleElement, setMenu, setToggle]
  )
  if (menuElement && lastShow && !show) {
    focusInDropdown.current = menuElement.contains(
      menuElement.ownerDocument.activeElement
    )
  }
  const doFocusToggle = qh.useEventCB(() => {
    if (toggleElement && toggleElement.focus) {
      toggleElement.focus()
    }
  })
  const doMaybeFocusFirst = qh.useEventCB(() => {
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
  qr.useEffect(() => {
    if (show) doMaybeFocusFirst()
    else if (focusInDropdown.current) {
      focusInDropdown.current = false
      doFocusToggle()
    }
  }, [show, focusInDropdown, doFocusToggle, doMaybeFocusFirst])
  qr.useEffect(() => {
    lastSourceEvent.current = null
  })
  const getNextFocusedChild = (current: HTMLElement, offset: number) => {
    if (!menuRef.current) return null
    const items = qsa(menuRef.current, itemSelector)
    let index = items.indexOf(current) + offset
    index = Math.max(0, Math.min(index, items.length))
    return items[index]
  }
  qh.useEventListener(
    qr.useCallback(() => window!.document, [window]),
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
    <qt.Selectable.Provider value={doSelect}>
      <Context.Provider value={context}>{children}</Context.Provider>
    </qt.Selectable.Provider>
  )
}
Dropdown.displayName = "Dropdown"
