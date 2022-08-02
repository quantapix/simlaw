import * as React from 'react';
import { useContext } from 'react';
import classNames from 'classnames';
import {
  AccordionContext,
  isAccordionItemSelected,
  AccordionEventKey,
} from './AccordionContext';
import { AccordionItemContext } from './AccordionItemContext';
import { BsProps, BsPrefixRefForwardingComponent } from './helpers';
import { useBootstrapPrefix } from './ThemeProvider';

type EventHandler = React.EventHandler<React.SyntheticEvent>;

export interface Props
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    BsProps {}

export function useAccordionButton(
  key: string,
  onClick?: EventHandler,
): EventHandler {
  const { activeEventKey, onSelect, alwaysOpen } = useContext(AccordionContext);
  return (e) => {
    let k: AccordionEventKey = key === activeEventKey ? null : key;
    if (alwaysOpen) {
      if (Array.isArray(activeEventKey)) {
        if (activeEventKey.includes(key)) {
          k = activeEventKey.filter((x) => x !== key);
        } else {
          k = [...activeEventKey, key];
        }
      } else {
        k = [key];
      }
    }
    onSelect?.(k, e);
    onClick?.(e);
  };
}

export const AccordionButton: BsPrefixRefForwardingComponent<'div', Props> =
  React.forwardRef<HTMLButtonElement, Props>(
    (
      { as: Component = 'button', bsPrefix, className, onClick, ...ps },
      ref,
    ) => {
      bsPrefix = useBootstrapPrefix(bsPrefix, 'accordion-button');
      const { eventKey } = useContext(AccordionItemContext);
      const accordionOnClick = useAccordionButton(eventKey, onClick);
      const { activeEventKey } = useContext(AccordionContext);
      if (Component === 'button') {
        ps.type = 'button';
      }
      return (
        <Component
          ref={ref}
          onClick={accordionOnClick}
          {...ps}
          aria-expanded={eventKey === activeEventKey}
          className={classNames(
            className,
            bsPrefix,
            !isAccordionItemSelected(activeEventKey, eventKey) && 'collapsed',
          )}
        />
      );
    },
  );

AccordionButton.displayName = 'AccordionButton';
