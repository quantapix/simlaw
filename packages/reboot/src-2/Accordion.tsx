import classNames from 'classnames';
import * as React from 'react';
import { useMemo } from 'react';
import { useUncontrolled } from 'uncontrollable';
import { useBootstrapPrefix } from './ThemeProvider';
import { AccordionBody } from './AccordionBody';
import { AccordionButton } from './AccordionButton';
import { AccordionCollapse } from './AccordionCollapse';
import {
  AccordionContext,
  AccordionSelectCallback,
  AccordionEventKey,
} from './AccordionContext';
import { AccordionHeader } from './AccordionHeader';
import { AccordionItem } from './AccordionItem';
import { BsProps, BsPrefixRefForwardingComponent } from './helpers';

export interface Props
  extends Omit<React.HTMLAttributes<HTMLElement>, 'onSelect'>,
    BsProps {
  activeKey?: AccordionEventKey;
  defaultActiveKey?: AccordionEventKey;
  onSelect?: AccordionSelectCallback;
  flush?: boolean;
  alwaysOpen?: boolean;
}

export const Accordion: BsPrefixRefForwardingComponent<'div', Props> =
  React.forwardRef<HTMLElement, Props>((xs, ref) => {
    const {
      as: Component = 'div',
      activeKey,
      bsPrefix,
      className,
      onSelect,
      flush,
      alwaysOpen,
      ...ps
    } = useUncontrolled(xs, {
      activeKey: 'onSelect',
    });
    const prefix = useBootstrapPrefix(bsPrefix, 'accordion');
    const contextValue = useMemo(
      () => ({
        activeEventKey: activeKey,
        onSelect,
        alwaysOpen,
      }),
      [activeKey, onSelect, alwaysOpen],
    );
    return (
      <AccordionContext.Provider value={contextValue}>
        <Component
          ref={ref}
          {...ps}
          className={classNames(className, prefix, flush && `${prefix}-flush`)}
        />
      </AccordionContext.Provider>
    );
  });

Accordion.displayName = 'Accordion';

Object.assign(Accordion, {
  Button: AccordionButton,
  Collapse: AccordionCollapse,
  Item: AccordionItem,
  Header: AccordionHeader,
  Body: AccordionBody,
});
