import { Anchor } from "./base/Anchor.js"
import { Button as _Button, Props as BProps } from "./Button.js"
import { Context as IContext } from "./InputGroup.js"
import { Context as NContext } from "./Navbar.js"
import { Link as NLink } from "./Nav.js"
import { useBs, useIsRTL } from "./Theme.js"
import { useWrappedRef } from "./use.js"
import { warning } from "./base/utils.js"
import { withBs } from "./utils.js"
import * as qh from "./hooks.js"
import * as qr from "react"
import * as qt from "./types.js"
import type { Placement } from "./base/popper.js"
import {
  Dropdown as Base,
  Props as BaseProps,
  ToggleMetadata,
  Item as BaseItem,
  useItem,
  useMenu,
  useToggle,
  MenuOpts,
} from "./base/Dropdown.js"

export type Drop = "up" | "start" | "end" | "down"

type Common = "href" | "size" | "variant" | "disabled"

export interface Data {
  align?: qt.AlignType | undefined
  drop?: Drop | undefined
  isRTL?: boolean
}

export const Context = qr.createContext<Data>({})
Context.displayName = "DropdownContext"

export type Variant = "dark" | string

export interface MenuProps extends qt.BsProps, qr.HTMLAttributes<HTMLElement> {
  show?: boolean | undefined
  renderOnMount?: boolean | undefined
  flip?: boolean | undefined
  align?: qt.AlignType
  rootCloseEvent?: "click" | "mousedown" | undefined
  popperConfig?: MenuOpts["popperConfig"]
  variant?: Variant | undefined
}

export function getPlacement(alignEnd: boolean, drop?: Drop, isRTL?: boolean) {
  const tStart = isRTL ? "top-end" : "top-start"
  const tEnd = isRTL ? "top-start" : "top-end"
  const bStart = isRTL ? "bottom-end" : "bottom-start"
  const bEnd = isRTL ? "bottom-start" : "bottom-end"
  const lStart = isRTL ? "right-start" : "left-start"
  const lEnd = isRTL ? "right-end" : "left-end"
  const rStart = isRTL ? "left-start" : "right-start"
  const rEnd = isRTL ? "left-end" : "right-end"
  let y: Placement = alignEnd ? bEnd : bStart
  if (drop === "up") y = alignEnd ? tEnd : tStart
  else if (drop === "end") y = alignEnd ? rEnd : rStart
  else if (drop === "start") y = alignEnd ? lEnd : lStart
  return y
}

export const Menu: qt.BsRef<"div", MenuProps> = qr.forwardRef<
  HTMLElement,
  MenuProps
>(
  (
    {
      bsPrefix,
      className,
      align,
      rootCloseEvent,
      flip,
      show: showProps,
      renderOnMount,
      as: X = "div",
      popperConfig,
      variant,
      ...ps
    },
    ref
  ) => {
    let alignEnd = false
    const isNavbar = qr.useContext(NContext)
    const bs = useBs(bsPrefix, "dropdown-menu")
    const { align: contextAlign, drop, isRTL } = qr.useContext(Context)
    align = align || contextAlign
    const isInputGroup = qr.useContext(IContext)
    const alignClasses: string[] = []
    if (align) {
      if (typeof align === "object") {
        const keys = Object.keys(align)
        warning(
          keys.length === 1,
          "There should only be 1 breakpoint when passing an object to `align`"
        )
        if (keys.length) {
          const brkPoint = keys[0]!
          const direction: qt.AlignDirection = align[brkPoint]!
          alignEnd = direction === "start"
          alignClasses.push(`${bs}-${brkPoint}-${direction}`)
        }
      } else if (align === "end") {
        alignEnd = true
      }
    }
    const placement = getPlacement(alignEnd, drop, isRTL)
    const [menuProps, { hasShown, popper, show, toggle }] = useMenu({
      flip,
      rootCloseEvent,
      show: showProps,
      usePopper: !isNavbar && alignClasses.length === 0,
      offset: [0, 2],
      popperConfig,
      placement,
    })
    menuProps.ref = qh.useMergedRefs(
      useWrappedRef(ref, "DropdownMenu"),
      menuProps.ref
    )
    qh.useIsomorphicEffect(() => {
      if (show) popper?.update()
    }, [show])
    if (!hasShown && !renderOnMount && !isInputGroup) return null
    if (typeof X !== "string") {
      menuProps["show"] = show
      menuProps["close"] = () => toggle?.(false)
      menuProps["align"] = align
    }
    let style = ps.style
    if (popper?.placement) {
      ;(ps as any)["x-placement"] = popper.placement
      style = { ...ps.style, ...menuProps.style }
    }
    return (
      <X
        {...ps}
        {...menuProps}
        style={style}
        {...((alignClasses.length || isNavbar) && {
          "data-bs-popper": "static",
        })}
        className={qt.classNames(
          className,
          bs,
          show && "show",
          alignEnd && `${bs}-end`,
          variant && `${bs}-${variant}`,
          ...alignClasses
        )}
      />
    )
  }
)
Menu.displayName = "DropdownMenu"
Menu.defaultProps = {
  flip: true,
}

export interface ToggleProps extends Omit<BProps, "as"> {
  as?: qr.ElementType
  split?: boolean
  childBsPrefix?: string | undefined
}

type ToggleType = qt.BsRef<"button", ToggleProps>

export type PropsFromToggle = Partial<
  Pick<qr.ComponentPropsWithRef<ToggleType>, Common>
>

export const Toggle: ToggleType = qr.forwardRef(
  (
    {
      bsPrefix,
      split,
      className,
      childBsPrefix,
      as: X = _Button,
      ...ps
    }: ToggleProps,
    ref
  ) => {
    const bs = useBs(bsPrefix, "dropdown-toggle")
    const context = qr.useContext(Context)
    const isInputGroup = qr.useContext(IContext)
    if (childBsPrefix !== undefined) {
      ;(ps as any).bsPrefix = childBsPrefix
    }
    const [toggleProps] = useToggle()
    toggleProps.ref = qh.useMergedRefs(
      toggleProps.ref,
      useWrappedRef(ref, "DropdownToggle")
    )
    return (
      <X
        className={qt.classNames(
          className,
          bs,
          split && `${bs}-split`,
          !!isInputGroup && (context as any).show && "show"
        )}
        {...toggleProps}
        {...ps}
      />
    )
  }
)
Toggle.displayName = "DropdownToggle"

export const Header = withBs("dropdown-header", {
  defaultProps: { role: "heading" },
})
export const Divider = withBs("dropdown-divider", {
  Component: "hr",
  defaultProps: { role: "separator" },
})
export const ItemText = withBs("dropdown-item-text", {
  Component: "span",
})

export interface ItemProps extends qr.HTMLAttributes<HTMLElement>, qt.BsProps {
  as?: qr.ElementType
  active?: boolean
  disabled?: boolean
  eventKey?: qt.EventKey
  href?: string
}

export const Item: qt.BsRef<typeof BaseItem, ItemProps> = qr.forwardRef(
  (
    {
      bsPrefix,
      className,
      eventKey,
      disabled = false,
      onClick,
      active,
      as: X = Anchor,
      ...ps
    },
    ref
  ) => {
    const bs = useBs(bsPrefix, "dropdown-item")
    const [dropdownItemProps, meta] = useItem({
      key: eventKey,
      href: ps.href,
      disabled,
      onClick,
      active,
    })
    return (
      <X
        {...ps}
        {...dropdownItemProps}
        ref={ref}
        className={qt.classNames(
          className,
          bs,
          meta.isActive && "active",
          disabled && "disabled"
        )}
      />
    )
  }
)
Item.displayName = "DropdownItem"

export interface Props
  extends BaseProps,
    qt.BsProps,
    Omit<qr.HTMLAttributes<HTMLElement>, "onSelect" | "children"> {
  align?: qt.AlignType
  autoClose?: boolean | "outside" | "inside"
  drop?: Drop
  focusFirstItemOnShow?: boolean | "keyboard"
  navbar?: boolean
  renderMenuOnMount?: boolean
}

export const Dropdown: qt.BsRef<"div", Props> = qr.forwardRef<
  HTMLElement,
  Props
>((xs: Props, ref) => {
  const {
    align,
    as: X = "div",
    autoClose,
    bsPrefix,
    className,
    drop,
    focusFirstItemOnShow,
    navbar,
    onSelect,
    onToggle,
    show,
    ...ps
  } = qh.useUncontrolled(xs, { show: "onToggle" })
  const isInputGroup = qr.useContext(IContext)
  const bs = useBs(bsPrefix, "dropdown")
  const isRTL = useIsRTL()
  const isClosingPermitted = (source: string): boolean => {
    if (autoClose === false) return source === "click"
    if (autoClose === "inside") return source !== "rootClose"
    if (autoClose === "outside") return source !== "select"
    return true
  }
  const doToggle = qh.useEventCB((nextShow: boolean, meta: ToggleMetadata) => {
    if (
      meta.originalEvent!.currentTarget === document &&
      (meta.source !== "keydown" ||
        (meta.originalEvent as any).key === "Escape")
    )
      meta.source = "rootClose"
    if (isClosingPermitted(meta.source!)) onToggle?.(nextShow, meta)
  })
  const alignEnd = align === "end"
  const placement = getPlacement(alignEnd, drop, isRTL)
  const v = qr.useMemo(
    () => ({
      align,
      drop,
      isRTL,
    }),
    [align, drop, isRTL]
  )
  return (
    <Context.Provider value={v}>
      <Base
        placement={placement}
        show={show}
        onSelect={onSelect}
        onToggle={doToggle}
        focusFirstItemOnShow={focusFirstItemOnShow}
        itemSelector={`.${bs}-item:not(.disabled):not(:disabled)`}
      >
        {isInputGroup ? (
          ps.children
        ) : (
          <X
            {...ps}
            ref={ref}
            className={qt.classNames(
              className,
              show && "show",
              (!drop || drop === "down") && bs,
              drop === "up" && "dropup",
              drop === "end" && "dropend",
              drop === "start" && "dropstart"
            )}
          />
        )}
      </Base>
    </Context.Provider>
  )
})
Dropdown.displayName = "Dropdown"
Dropdown.defaultProps = {
  navbar: false,
  align: "start",
  autoClose: true,
}

export interface ButtonProps
  extends Omit<Props, "title">,
    PropsFromToggle,
    qt.BsProps {
  title: qr.ReactNode
  menuRole?: string
  renderMenuOnMount?: boolean
  rootCloseEvent?: "click" | "mousedown"
  menuVariant?: Variant
  flip?: boolean
}

export const Button: qt.BsRef<"div", ButtonProps> = qr.forwardRef<
  HTMLDivElement,
  ButtonProps
>(
  (
    {
      title,
      children,
      bsPrefix,
      rootCloseEvent,
      variant,
      size,
      menuRole,
      renderMenuOnMount,
      disabled,
      href,
      id,
      menuVariant,
      flip,
      ...ps
    },
    ref
  ) => (
    <Dropdown ref={ref} {...ps}>
      <Toggle
        id={id}
        href={href}
        size={size}
        variant={variant}
        disabled={disabled}
        childBsPrefix={bsPrefix}
      >
        {title}
      </Toggle>
      <Menu
        role={menuRole}
        renderOnMount={renderMenuOnMount}
        rootCloseEvent={rootCloseEvent}
        variant={menuVariant}
        flip={flip}
      >
        {children}
      </Menu>
    </Dropdown>
  )
)
Button.displayName = "DropdownButton"

export interface NavProps extends Omit<Props, "title"> {
  title: qr.ReactNode
  disabled?: boolean
  active?: boolean
  menuRole?: string
  renderMenuOnMount?: boolean
  rootCloseEvent?: "click" | "mousedown"
  menuVariant?: Variant
}

export const Nav: qt.BsRef<"div", NavProps> = qr.forwardRef(
  (
    {
      id,
      title,
      children,
      bsPrefix,
      className,
      rootCloseEvent,
      menuRole,
      disabled,
      active,
      renderMenuOnMount,
      menuVariant,
      ...ps
    }: NavProps,
    ref
  ) => {
    const pre = useBs(undefined, "nav-item")
    return (
      <Dropdown ref={ref} {...ps} className={qt.classNames(className, pre)}>
        <Toggle
          id={id}
          eventKey={null}
          active={active}
          disabled={disabled}
          childBsPrefix={bsPrefix}
          as={NLink}
        >
          {title}
        </Toggle>
        <Menu
          role={menuRole}
          renderOnMount={renderMenuOnMount}
          rootCloseEvent={rootCloseEvent}
          variant={menuVariant}
        >
          {children}
        </Menu>
      </Dropdown>
    )
  }
)
Nav.displayName = "NavDropdown"
