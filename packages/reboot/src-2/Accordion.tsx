import classNames from 'classnames';
import * as React from 'react';
import { useContext, useMemo } from 'react';
import { useUncontrolled } from 'uncontrollable';
import { Transition } from 'react-transition-group';
import { useBsPrefix } from './Theme';
import { BsProps, BsRefComponent } from './helpers';
import { Collapse as C, Props as _Props } from './Collapse';

export type Key = string | string[] | null | undefined;

export declare type SelectCB = (
  eventKey: Key,
  e: React.SyntheticEvent<unknown>,
) => void;

export interface ContextValue {
  activeEventKey?: Key;
  onSelect?: SelectCB;
  alwaysOpen?: boolean;
}

export function isItemSelected(active: Key, key: string): boolean {
  return Array.isArray(active) ? active.includes(key) : active === key;
}

export const Context = React.createContext<ContextValue>({});
Context.displayName = 'AccordionContext';

export interface ItemContextValue {
  eventKey: string;
}

export const ItemContext = React.createContext<ItemContextValue>({
  eventKey: '',
});
ItemContext.displayName = 'AccordionItemContext';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    BsProps {}

type EventHandler = React.EventHandler<React.SyntheticEvent>;

export function useButton(key: string, onClick?: EventHandler): EventHandler {
  const { activeEventKey, onSelect, alwaysOpen } = useContext(Context);
  return (e) => {
    let k: Key = key === activeEventKey ? null : key;
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

export const Button: BsRefComponent<'div', ButtonProps> = React.forwardRef<
  HTMLButtonElement,
  ButtonProps
>(({ as: Component = 'button', bsPrefix, className, onClick, ...ps }, ref) => {
  bsPrefix = useBsPrefix(bsPrefix, 'accordion-button');
  const { eventKey } = useContext(ItemContext);
  const accordionOnClick = useButton(eventKey, onClick);
  const { activeEventKey } = useContext(Context);
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
        !isItemSelected(activeEventKey, eventKey) && 'collapsed',
      )}
    />
  );
});
Button.displayName = 'AccordionButton';

export interface HeaderProps
  extends BsProps,
    React.HTMLAttributes<HTMLElement> {}

export const Header: BsRefComponent<'h2', HeaderProps> = React.forwardRef<
  HTMLElement,
  HeaderProps
>(
  (
    { as: Component = 'h2', bsPrefix, className, children, onClick, ...ps },
    ref,
  ) => {
    bsPrefix = useBsPrefix(bsPrefix, 'accordion-header');
    return (
      <Component ref={ref} {...ps} className={classNames(className, bsPrefix)}>
        <Button onClick={onClick}>{children}</Button>
      </Component>
    );
  },
);
Header.displayName = 'AccordionHeader';

export interface CollapseProps extends BsProps, _Props {
  eventKey: string;
}

export const Collapse: BsRefComponent<'div', CollapseProps> = React.forwardRef<
  Transition<any>,
  CollapseProps
>(
  (
    { as: Component = 'div', bsPrefix, className, children, eventKey, ...ps },
    ref,
  ) => {
    const { activeEventKey } = useContext(Context);
    const bs = useBsPrefix(bsPrefix, 'accordion-collapse');
    return (
      <C
        ref={ref}
        in={isItemSelected(activeEventKey, eventKey)}
        {...ps}
        className={classNames(className, bs)}
      >
        <Component>{React.Children.only(children)}</Component>
      </C>
    );
  },
) as any;
Collapse.displayName = 'AccordionCollapse';

export interface BodyProps extends BsProps, React.HTMLAttributes<HTMLElement> {}

export const Body: BsRefComponent<'div', BodyProps> = React.forwardRef<
  HTMLElement,
  BodyProps
>(({ as: Component = 'div', bsPrefix, className, ...ps }, ref) => {
  bsPrefix = useBsPrefix(bsPrefix, 'accordion-body');
  const { eventKey } = useContext(ItemContext);
  return (
    <Collapse eventKey={eventKey}>
      <Component
        ref={ref}
        {...ps}
        className={classNames(className, bsPrefix)}
      />
    </Collapse>
  );
});
Body.displayName = 'AccordionBody';

export interface ItemProps extends BsProps, React.HTMLAttributes<HTMLElement> {
  eventKey: string;
}

export const Item: BsRefComponent<'div', ItemProps> = React.forwardRef<
  HTMLElement,
  ItemProps
>(({ as: X = 'div', bsPrefix, className, eventKey, ...ps }, ref) => {
  bsPrefix = useBsPrefix(bsPrefix, 'accordion-item');
  const ctx = useMemo<ItemContextValue>(
    () => ({
      eventKey,
    }),
    [eventKey],
  );
  return (
    <ItemContext.Provider value={ctx}>
      <X ref={ref} {...ps} className={classNames(className, bsPrefix)} />
    </ItemContext.Provider>
  );
});
Item.displayName = 'AccordionItem';

export interface Props
  extends Omit<React.HTMLAttributes<HTMLElement>, 'onSelect'>,
    BsProps {
  activeKey?: Key;
  defaultActiveKey?: Key;
  onSelect?: SelectCB;
  flush?: boolean;
  alwaysOpen?: boolean;
}

export const Accordion: BsRefComponent<'div', Props> = React.forwardRef<
  HTMLElement,
  Props
>((xs, ref) => {
  const {
    as: X = 'div',
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
  const bs = useBsPrefix(bsPrefix, 'accordion');
  const v = useMemo(
    () => ({
      activeEventKey: activeKey,
      onSelect,
      alwaysOpen,
    }),
    [activeKey, onSelect, alwaysOpen],
  );
  return (
    <Context.Provider value={v}>
      <X
        ref={ref}
        {...ps}
        className={classNames(className, bs, flush && `${bs}-flush`)}
      />
    </Context.Provider>
  );
});

Accordion.displayName = 'Accordion';

Object.assign(Accordion, {
  Button,
  Collapse,
  Item,
  Header,
  Body,
});
