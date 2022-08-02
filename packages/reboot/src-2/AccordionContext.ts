import * as React from 'react';

export type AccordionEventKey = string | string[] | null | undefined;

export declare type AccordionSelectCallback = (
  eventKey: AccordionEventKey,
  e: React.SyntheticEvent<unknown>,
) => void;

export interface AccordionContextValue {
  activeEventKey?: AccordionEventKey;
  onSelect?: AccordionSelectCallback;
  alwaysOpen?: boolean;
}

export function isAccordionItemSelected(
  active: AccordionEventKey,
  key: string,
): boolean {
  return Array.isArray(active) ? active.includes(key) : active === key;
}

export const AccordionContext = React.createContext<AccordionContextValue>({});
AccordionContext.displayName = 'AccordionContext';
