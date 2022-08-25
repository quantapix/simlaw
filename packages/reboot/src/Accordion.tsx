import { Collapse as C, Props as CProps } from "./Collapse.jsx"
import { useBs } from "./Theme.jsx"
import * as qh from "./hooks.js"
import * as qr from "react"
import * as qt from "./types.js"
import type { Transition } from "react-transition-group"

export type Key = string | string[] | null | undefined

export declare type SelectCB = (
  eventKey: Key,
  e: qr.SyntheticEvent<unknown>
) => void

export interface Data {
  activeKey?: Key
  onSelect?: SelectCB | undefined
  alwaysOpen?: boolean | undefined
}

export function isItemSelected(active: Key, key: string): boolean {
  return Array.isArray(active) ? active.includes(key) : active === key
}

export const Context = qr.createContext<Data>({})
Context.displayName = "AccordionContext"

export interface ItemData {
  eventKey: string
}

export const ItemContext = qr.createContext<ItemData>({
  eventKey: "",
})
ItemContext.displayName = "AccordionItemContext"

export interface ButtonProps
  extends qr.ButtonHTMLAttributes<HTMLButtonElement>,
    qt.BsProps {}

type Handler = qr.EventHandler<qr.SyntheticEvent>

export function useButton(key: string, onClick?: Handler): Handler {
  const { activeKey, onSelect, alwaysOpen } = qr.useContext(Context)
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

export const Button: qt.BsRef<"div", ButtonProps> = qr.forwardRef<
  HTMLButtonElement,
  ButtonProps
>(({ as: X = "button", bsPrefix, className, onClick, ...ps }, ref) => {
  const bs = useBs(bsPrefix, "accordion-button")
  const { eventKey } = qr.useContext(ItemContext)
  const click = useButton(eventKey, onClick)
  const { activeKey } = qr.useContext(Context)
  if (X === "button") {
    ps.type = "button"
  }
  return (
    <X
      ref={ref}
      onClick={click}
      {...ps}
      aria-expanded={eventKey === activeKey}
      className={qt.classNames(
        className,
        bs,
        !isItemSelected(activeKey, eventKey) && "collapsed"
      )}
    />
  )
})
Button.displayName = "AccordionButton"

export interface HeaderProps
  extends qt.BsProps,
    qr.HTMLAttributes<HTMLElement> {}

export const Header: qt.BsRef<"h2", HeaderProps> = qr.forwardRef<
  HTMLElement,
  HeaderProps
>(({ as: X = "h2", bsPrefix, className, children, onClick, ...ps }, ref) => {
  const bs = useBs(bsPrefix, "accordion-header")
  return (
    <X ref={ref} {...ps} className={qt.classNames(className, bs)}>
      <Button onClick={onClick}>{children}</Button>
    </X>
  )
})
Header.displayName = "AccordionHeader"

export interface CollapseProps extends CProps, qt.BsProps {
  eventKey: string
}

export const Collapse: qt.BsRef<"div", CollapseProps> = qr.forwardRef<
  Transition<any>,
  CollapseProps
>(({ as: X = "div", bsPrefix, className, children, eventKey, ...ps }, ref) => {
  const { activeKey } = qr.useContext(Context)
  const bs = useBs(bsPrefix, "accordion-collapse")
  return (
    <C
      ref={ref}
      in={isItemSelected(activeKey, eventKey)}
      {...ps}
      className={qt.classNames(className, bs)}
    >
      <X>{qr.Children.only(children)}</X>
    </C>
  )
})
Collapse.displayName = "AccordionCollapse"

export interface BodyProps extends qt.BsProps, qr.HTMLAttributes<HTMLElement> {}

export const Body: qt.BsRef<"div", BodyProps> = qr.forwardRef<
  HTMLElement,
  BodyProps
>(({ as: X = "div", bsPrefix, className, ...ps }, ref) => {
  const bs = useBs(bsPrefix, "accordion-body")
  const { eventKey } = qr.useContext(ItemContext)
  return (
    <Collapse eventKey={eventKey}>
      <X ref={ref} {...ps} className={qt.classNames(className, bs)} />
    </Collapse>
  )
})
Body.displayName = "AccordionBody"

export interface ItemProps extends qt.BsProps, qr.HTMLAttributes<HTMLElement> {
  eventKey: string
}

export const Item: qt.BsRef<"div", ItemProps> = qr.forwardRef<
  HTMLElement,
  ItemProps
>(({ as: X = "div", bsPrefix, className, eventKey, ...ps }, ref) => {
  const bs = useBs(bsPrefix, "accordion-item")
  const ctx = qr.useMemo<ItemData>(
    () => ({
      eventKey,
    }),
    [eventKey]
  )
  return (
    <ItemContext.Provider value={ctx}>
      <X ref={ref} {...ps} className={qt.classNames(className, bs)} />
    </ItemContext.Provider>
  )
})
Item.displayName = "AccordionItem"

export interface Props
  extends Omit<qr.HTMLAttributes<HTMLElement>, "onSelect">,
    qt.BsProps {
  activeKey?: Key
  defaultActiveKey?: Key
  onSelect?: SelectCB
  flush?: boolean
  alwaysOpen?: boolean
}

export const Accordion: qt.BsRef<"div", Props> = qr.forwardRef<
  HTMLElement,
  Props
>((xs: Props, ref) => {
  const {
    activeKey,
    alwaysOpen,
    as: X = "div",
    bsPrefix,
    className,
    flush,
    onSelect,
    ...ps
  } = qh.useUncontrolled(xs, { activeKey: "onSelect" })
  const bs = useBs(bsPrefix, "accordion")
  const v = qr.useMemo(
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
        className={qt.classNames(className, bs, flush && `${bs}-flush`)}
      />
    </Context.Provider>
  )
})
Accordion.displayName = "Accordion"
