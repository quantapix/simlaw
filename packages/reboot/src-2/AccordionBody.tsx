import classNames from 'classnames';
import * as React from 'react';
import { useContext } from 'react';
import { useBootstrapPrefix } from './ThemeProvider';
import { AccordionCollapse } from './AccordionCollapse';
import { AccordionItemContext } from './AccordionItemContext';
import { BsPrefixRefForwardingComponent, BsProps } from './helpers';

export interface Props extends BsProps, React.HTMLAttributes<HTMLElement> {}

export const AccordionBody: BsPrefixRefForwardingComponent<'div', Props> =
  React.forwardRef<HTMLElement, Props>(
    ({ as: Component = 'div', bsPrefix, className, ...ps }, ref) => {
      bsPrefix = useBootstrapPrefix(bsPrefix, 'accordion-body');
      const { eventKey } = useContext(AccordionItemContext);
      return (
        <AccordionCollapse eventKey={eventKey}>
          <Component
            ref={ref}
            {...ps}
            className={classNames(className, bsPrefix)}
          />
        </AccordionCollapse>
      );
    },
  );

AccordionBody.displayName = 'AccordionBody';
