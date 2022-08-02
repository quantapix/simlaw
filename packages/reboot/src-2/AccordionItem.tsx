import classNames from 'classnames';
import * as React from 'react';
import { useMemo } from 'react';
import { useBootstrapPrefix } from './ThemeProvider';
import {
  AccordionItemContext,
  AccordionItemContextValue,
} from './AccordionItemContext';
import { BsPrefixRefForwardingComponent, BsProps } from './helpers';

export interface Props extends BsProps, React.HTMLAttributes<HTMLElement> {
  eventKey: string;
}

export const AccordionItem: BsPrefixRefForwardingComponent<'div', Props> =
  React.forwardRef<HTMLElement, Props>(
    ({ as: Component = 'div', bsPrefix, className, eventKey, ...ps }, ref) => {
      bsPrefix = useBootstrapPrefix(bsPrefix, 'accordion-item');
      const contextValue = useMemo<AccordionItemContextValue>(
        () => ({
          eventKey,
        }),
        [eventKey],
      );
      return (
        <AccordionItemContext.Provider value={contextValue}>
          <Component
            ref={ref}
            {...ps}
            className={classNames(className, bsPrefix)}
          />
        </AccordionItemContext.Provider>
      );
    },
  );

AccordionItem.displayName = 'AccordionItem';
