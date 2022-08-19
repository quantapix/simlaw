import { useContext, useRef } from "react"
import * as React from "react"
import { useCallbackRef } from "../hooks.js"
import DropdownContext, { DropdownContextValue } from "./DropdownContext.jsx"
import usePopper, {
  UsePopperOptions,
  Placement,
  Offset,
  UsePopperState,
} from "./usePopper.js"
import { useClickOutside, ClickOutsideOptions } from "./useClickOutside.js"
import mergeOptionsWithPopperConfig from "./mergeOptionsWithPopperConfig.js"

export interface UseDropdownMenuOptions {
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

export type UserDropdownMenuArrowProps = Record<string, any> & {
  ref: React.RefCallback<HTMLElement>
  style: React.CSSProperties
}

export interface UseDropdownMenuMetadata {
  show: boolean
  placement?: Placement
  hasShown: boolean
  toggle?: DropdownContextValue["toggle"]
  popper: UsePopperState | null
  arrowProps: Partial<UserDropdownMenuArrowProps>
}

const noop: any = () => {}

export function useDropdownMenu(options: UseDropdownMenuOptions = {}) {
  const context = useContext(DropdownContext)

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
    mergeOptionsWithPopperConfig({
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

  const metadata: UseDropdownMenuMetadata = {
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

  return [menuProps, metadata] as const
}

const defaultProps = {
  usePopper: true,
}

export interface DropdownMenuProps extends UseDropdownMenuOptions {
  children: (
    props: UserDropdownMenuProps,
    meta: UseDropdownMenuMetadata
  ) => React.ReactNode
}

export function DropdownMenu({ children, ...options }: DropdownMenuProps) {
  const [props, meta] = useDropdownMenu(options)

  return <>{children(props, meta)}</>
}
DropdownMenu.displayName = "DropdownMenu"
DropdownMenu.defaultProps = defaultProps
