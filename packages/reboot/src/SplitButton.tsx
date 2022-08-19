import * as React from "react"
import type { Type } from "./Button.jsx"
import { Button, Group } from "./Button.jsx"
import {
  Dropdown,
  Props as _Props,
  PropsFromToggle,
  Toggle,
  Menu,
} from "./Dropdown.jsx"
import type { BsProps } from "./helpers.js"

export interface Props extends Omit<_Props, "title">, PropsFromToggle, BsProps {
  menuRole?: string
  renderMenuOnMount?: boolean
  rootCloseEvent?: "click" | "mousedown"
  target?: string
  title: React.ReactNode
  toggleLabel?: string
  type?: Type
  flip?: boolean
}

export const SplitButton = React.forwardRef<HTMLElement, Props>(
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
