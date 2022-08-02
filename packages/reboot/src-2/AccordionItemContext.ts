import * as React from 'react';

export interface AccordionItemContextValue {
  eventKey: string;
}

export const AccordionItemContext =
  React.createContext<AccordionItemContextValue>({
    eventKey: '',
  });
AccordionItemContext.displayName = 'AccordionItemContext';
