import { Content, Pane, getTabTransitionComponent } from "./Tab.jsx"
import { forEach, map } from "./utils.jsx"
import { Item, Link, Nav, Props as NProps } from "./Nav.jsx"
import { Tabs as Base, Props as BaseProps } from "./base/Tabs.jsx"
import * as qh from "./hooks.js"
import type { TransitionType } from "./helpers.js"
import type * as qr from "react"

export interface Props
  extends Omit<BaseProps, "transition">,
    Omit<qr.HTMLAttributes<HTMLElement>, "onSelect">,
    NProps {
  transition?: TransitionType
}

function getDefaultActiveKey(xs: any) {
  let key: any
  forEach(xs, x => {
    if (key == null) {
      key = x.props.eventKey
    }
  })
  return key
}

function renderTab(x) {
  const { title, eventKey, disabled, tabClassName, tabAttrs, id } = x.props
  if (title == null) {
    return null
  }
  return (
    <Item as="li" role="presentation">
      <Link
        as="button"
        type="button"
        eventKey={eventKey}
        disabled={disabled}
        id={id}
        className={tabClassName}
        {...tabAttrs}
      >
        {title}
      </Link>
    </Item>
  )
}

export const Tabs = (xs: Props) => {
  const {
    id,
    onSelect,
    transition,
    mountOnEnter,
    unmountOnExit,
    children,
    activeKey = getDefaultActiveKey(children),
    ...ps
  } = qh.useUncontrolled(xs, {
    activeKey: "onSelect",
  })
  return (
    <Base
      id={id}
      activeKey={activeKey}
      onSelect={onSelect}
      transition={getTabTransitionComponent(transition)}
      mountOnEnter={mountOnEnter}
      unmountOnExit={unmountOnExit}
    >
      <Nav {...ps} role="tablist" as="ul">
        {map(children, renderTab)}
      </Nav>
      <Content>
        {map(children, child => {
          const childProps = { ...child.props }
          delete childProps.title
          delete childProps.disabled
          delete childProps.tabClassName
          delete childProps.tabAttrs
          return <Pane {...childProps} />
        })}
      </Content>
    </Base>
  )
}
Tabs.displayName = "Tabs"
Tabs.defaultProps = {
  variant: "tabs",
  mountOnEnter: false,
  unmountOnExit: false,
}
