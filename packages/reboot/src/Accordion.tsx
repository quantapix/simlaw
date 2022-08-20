import * as React from "react"
import { useContext, useMemo } from "react"
import { useUncontrolled } from "./hooks.js"
import type { Transition } from "react-transition-group"
import { useBs } from "./Theme.jsx"
import { classNames, BsProps, BsRef } from "./helpers.js"
import { Collapse as C, Props as CPs } from "./Collapse.jsx"

export type Key = string | string[] | null | undefined

export declare type SelectCB = (
  eventKey: Key,
  e: React.SyntheticEvent<unknown>
) => void

export interface Data {
  activeKey?: Key
  onSelect?: SelectCB | undefined
  alwaysOpen?: boolean | undefined
}

export function isItemSelected(active: Key, key: string): boolean {
  return Array.isArray(active) ? active.includes(key) : active === key
}

export const Context = React.createContext<Data>({})
Context.displayName = "AccordionContext"

export interface ItemData {
  eventKey: string
}

export const ItemContext = React.createContext<ItemData>({
  eventKey: "",
})
ItemContext.displayName = "AccordionItemContext"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    BsProps {}

type Handler = React.EventHandler<React.SyntheticEvent>

export function useButton(key: string, onClick?: Handler): Handler {
  const { activeKey, onSelect, alwaysOpen } = useContext(Context)
  return e => {
    let k: Key = key === activeKey ? null : key
    if (alwaysOpen) {
      if (Array.isArray(activeKey)) {
        if (activeKey.includes(key)) {
          k = activeKey.filter(x => x !== key)
        } else {
          k = [...activeKey, key]
        }
      } else {
        k = [key]
      }
    }
    onSelect?.(k, e)
    onClick?.(e)
  }
}

export const Button: BsRef<"div", ButtonProps> = React.forwardRef<
  HTMLButtonElement,
  ButtonProps
>(({ as: X = "button", bsPrefix, className, onClick, ...ps }, ref) => {
  const bs = useBs(bsPrefix, "accordion-button")
  const { eventKey } = useContext(ItemContext)
  const click = useButton(eventKey, onClick)
  const { activeKey } = useContext(Context)
  if (X === "button") {
    ps.type = "button"
  }
  return (
    <X
      ref={ref}
      onClick={click}
      {...ps}
      aria-expanded={eventKey === activeKey}
      className={classNames(
        className,
        bs,
        !isItemSelected(activeKey, eventKey) && "collapsed"
      )}
    />
  )
})
Button.displayName = "AccordionButton"

export interface HeaderProps
  extends BsProps,
    React.HTMLAttributes<HTMLElement> {}

export const Header: BsRef<"h2", HeaderProps> = React.forwardRef<
  HTMLElement,
  HeaderProps
>(({ as: X = "h2", bsPrefix, className, children, onClick, ...ps }, ref) => {
  const bs = useBs(bsPrefix, "accordion-header")
  return (
    <X ref={ref} {...ps} className={classNames(className, bs)}>
      <Button onClick={onClick}>{children}</Button>
    </X>
  )
})
Header.displayName = "AccordionHeader"

export interface CollapseProps extends CPs, BsProps {
  eventKey: string
}

export const Collapse: BsRef<"div", CollapseProps> = React.forwardRef<
  Transition<any>,
  CollapseProps
>(({ as: X = "div", bsPrefix, className, children, eventKey, ...ps }, ref) => {
  const { activeKey } = useContext(Context)
  const bs = useBs(bsPrefix, "accordion-collapse")
  return (
    <C
      ref={ref}
      in={isItemSelected(activeKey, eventKey)}
      {...ps}
      className={classNames(className, bs)}
    >
      <X>{React.Children.only(children)}</X>
    </C>
  )
})
Collapse.displayName = "AccordionCollapse"

export interface BodyProps extends BsProps, React.HTMLAttributes<HTMLElement> {}

export const Body: BsRef<"div", BodyProps> = React.forwardRef<
  HTMLElement,
  BodyProps
>(({ as: X = "div", bsPrefix, className, ...ps }, ref) => {
  const bs = useBs(bsPrefix, "accordion-body")
  const { eventKey } = useContext(ItemContext)
  return (
    <Collapse eventKey={eventKey}>
      <X ref={ref} {...ps} className={classNames(className, bs)} />
    </Collapse>
  )
})
Body.displayName = "AccordionBody"

export interface ItemProps extends BsProps, React.HTMLAttributes<HTMLElement> {
  eventKey: string
}

export const Item: BsRef<"div", ItemProps> = React.forwardRef<
  HTMLElement,
  ItemProps
>(({ as: X = "div", bsPrefix, className, eventKey, ...ps }, ref) => {
  const bs = useBs(bsPrefix, "accordion-item")
  const ctx = useMemo<ItemData>(
    () => ({
      eventKey,
    }),
    [eventKey]
  )
  return (
    <ItemContext.Provider value={ctx}>
      <X ref={ref} {...ps} className={classNames(className, bs)} />
    </ItemContext.Provider>
  )
})
Item.displayName = "AccordionItem"

export interface Props
  extends Omit<React.HTMLAttributes<HTMLElement>, "onSelect">,
    BsProps {
  activeKey?: Key
  defaultActiveKey?: Key
  onSelect?: SelectCB
  flush?: boolean
  alwaysOpen?: boolean
}

export const Accordion: BsRef<"div", Props> = React.forwardRef<
  HTMLElement,
  Props
>((xs, ref) => {
  const {
    as: X = "div",
    activeKey,
    bsPrefix,
    className,
    onSelect,
    flush,
    alwaysOpen,
    ...ps
  } = useUncontrolled(xs, {
    activeKey: "onSelect",
  })
  const bs = useBs(bsPrefix, "accordion")
  const v = useMemo(
    () => ({
      activeKey: activeKey,
      onSelect,
      alwaysOpen,
    }),
    [activeKey, onSelect, alwaysOpen]
  )
  return (
    <Context.Provider value={v}>
      <X
        ref={ref}
        {...ps}
        className={classNames(className, bs, flush && `${bs}-flush`)}
      />
    </Context.Provider>
  )
})
Accordion.displayName = "Accordion"
