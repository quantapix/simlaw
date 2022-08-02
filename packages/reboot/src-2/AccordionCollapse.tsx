import classNames from 'classnames';
import * as React from 'react';
import { useContext } from 'react';
import { Transition } from 'react-transition-group';
import { useBootstrapPrefix } from './ThemeProvider';
import { Collapse, Props as _Props } from './Collapse';
import { AccordionContext, isAccordionItemSelected } from './AccordionContext';
import { BsPrefixRefForwardingComponent, BsProps } from './helpers';

export interface Props extends BsProps, _Props {
  eventKey: string;
}

export const AccordionCollapse: BsPrefixRefForwardingComponent<'div', Props> =
  React.forwardRef<Transition<any>, Props>(
    (
      { as: Component = 'div', bsPrefix, className, children, eventKey, ...ps },
      ref,
    ) => {
      const { activeEventKey } = useContext(AccordionContext);
      bsPrefix = useBootstrapPrefix(bsPrefix, 'accordion-collapse');
      return (
        <Collapse
          ref={ref}
          in={isAccordionItemSelected(activeEventKey, eventKey)}
          {...ps}
          className={classNames(className, bsPrefix)}
        >
          <Component>{React.Children.only(children)}</Component>
        </Collapse>
      );
    },
  ) as any;

AccordionCollapse.displayName = 'AccordionCollapse';
