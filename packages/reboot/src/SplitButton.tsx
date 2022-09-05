import { Button, Group } from "./Button.js"
import * as qr from "react"
import type { Type } from "./base/Button.js"
import type * as qt from "./types.js"
import {
  Dropdown,
  Props as BaseProps,
  PropsFromToggle,
  Toggle,
  Menu,
} from "./Dropdown.js"

export interface Props
  extends Omit<BaseProps, "title">,
    PropsFromToggle,
    qt.BsProps {
  menuRole?: string
  renderMenuOnMount?: boolean
  rootCloseEvent?: "click" | "mousedown"
  target?: string
  title: qr.ReactNode
  toggleLabel?: string
  type?: Type
  flip?: boolean
}

export const SplitButton = qr.forwardRef<HTMLElement, Props>(
  (
    {
      id,
      bsPrefix,
      size,
      variant,
      title,
      type,
      toggleLabel,
      children,
      onClick,
      href,
      target,
      menuRole,
      renderMenuOnMount,
      rootCloseEvent,
      flip,
      ...ps
    },
    ref
  ) => (
    <Dropdown ref={ref} {...ps} as={Group}>
      <Button
        size={size}
        variant={variant}
        disabled={ps.disabled}
        bsPrefix={bsPrefix}
        href={href}
        target={target}
        onClick={onClick}
        type={type}
      >
        {title}
      </Button>
      <Toggle
        split
        id={id}
        size={size}
        variant={variant}
        disabled={ps.disabled}
        childBsPrefix={bsPrefix}
      >
        <span className="visually-hidden">{toggleLabel}</span>
      </Toggle>
      <Menu
        role={menuRole}
        renderOnMount={renderMenuOnMount}
        rootCloseEvent={rootCloseEvent}
        flip={flip}
      >
        {children}
      </Menu>
    </Dropdown>
  )
)
SplitButton.displayName = "SplitButton"
SplitButton.defaultProps = {
  toggleLabel: "Toggle dropdown",
  type: "button",
}
