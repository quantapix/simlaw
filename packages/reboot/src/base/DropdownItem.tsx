import * as React from "react"
import { useContext } from "react"
import { useEventCallback } from "../hooks.js"
import { SelectableContext, makeEventKey } from "./SelectableContext.jsx"
import NavContext from "./NavContext.jsx"
import type { EventKey, DynamicRefForwardingComponent } from "./types.js"
import { Button } from "./Button.jsx"
import { dataAttr } from "./types.js"

export interface DropdownItemProps extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType
  active?: boolean
  disabled?: boolean
  eventKey?: EventKey
  href?: string
}

interface UseDropdownItemOptions {
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
}: UseDropdownItemOptions) {
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

const DropdownItem: DynamicRefForwardingComponent<
  typeof Button,
  DropdownItemProps
> = React.forwardRef(
  (
    {
      eventKey,
      disabled,
      onClick,
      active,
      as: Component = Button,
      ...props
    }: DropdownItemProps,
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

DropdownItem.displayName = "DropdownItem"

export default DropdownItem
