import classNames from 'classnames';
import * as React from 'react';
import { useBootstrapPrefix } from './ThemeProvider';
import { AccordionButton } from './AccordionButton';
import { BsPrefixRefForwardingComponent, BsProps } from './helpers';

export interface Props extends BsProps, React.HTMLAttributes<HTMLElement> {}

export const AccordionHeader: BsPrefixRefForwardingComponent<'h2', Props> =
  React.forwardRef<HTMLElement, Props>(
    (
      { as: Component = 'h2', bsPrefix, className, children, onClick, ...ps },
      ref,
    ) => {
      bsPrefix = useBootstrapPrefix(bsPrefix, 'accordion-header');

      return (
        <Component
          ref={ref}
          {...ps}
          className={classNames(className, bsPrefix)}
        >
          <AccordionButton onClick={onClick}>{children}</AccordionButton>
        </Component>
      );
    },
  );

AccordionHeader.displayName = 'AccordionHeader';
