import * as React from 'react';
import { useUncontrolled } from 'uncontrollable';
import BaseTabs, { TabsProps as _TabsProps } from '@restart/ui/Tabs';
import { Nav, Props as _Props } from './Nav';
import { NavLink } from './NavLink';
import NavItem from './NavItem';
import { Content, Pane } from './Tab';
import { forEach, map } from './utils';
import getTabTransitionComponent from './getTabTransitionComponent';
import { TransitionType } from './helpers';

export interface Props
  extends Omit<_TabsProps, 'transition'>,
    Omit<React.HTMLAttributes<HTMLElement>, 'onSelect'>,
    _Props {
  transition?: TransitionType;
}

function getDefaultActiveKey(xs) {
  let key;
  forEach(xs, (x) => {
    if (key == null) {
      key = x.props.eventKey;
    }
  });
  return key;
}

function renderTab(x) {
  const { title, eventKey, disabled, tabClassName, tabAttrs, id } = x.props;
  if (title == null) {
    return null;
  }
  return (
    <NavItem as="li" role="presentation">
      <NavLink
        as="button"
        type="button"
        eventKey={eventKey}
        disabled={disabled}
        id={id}
        className={tabClassName}
        {...tabAttrs}
      >
        {title}
      </NavLink>
    </NavItem>
  );
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
  } = useUncontrolled(xs, {
    activeKey: 'onSelect',
  });

  return (
    <BaseTabs
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
        {map(children, (child) => {
          const childProps = { ...child.props };
          delete childProps.title;
          delete childProps.disabled;
          delete childProps.tabClassName;
          delete childProps.tabAttrs;
          return <Pane {...childProps} />;
        })}
      </Content>
    </BaseTabs>
  );
};

Tabs.displayName = 'Tabs';
Tabs.defaultProps = {
  variant: 'tabs',
  mountOnEnter: false,
  unmountOnExit: false,
};
