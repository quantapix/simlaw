import { BsPrefixProps, BsPrefixRefForwardingComponent } from "./utils"
import { SelectCallback } from "./types"
import { Transition } from "react-transition-group"
import { useBootstrapPrefix } from "./ThemeProvider"
import { useContext } from "react"
import { useMemo } from "react"
import { useUncontrolled } from "uncontrollable"
import * as React from "react"
import classNames from "classnames"
import Collapse, { CollapseProps } from "./Collapse"
type EventHandler = React.EventHandler<React.SyntheticEvent>
export interface AccordionBodyProps extends BsPrefixProps, React.HTMLAttributes<HTMLElement> {}
export const AccordionBody: BsPrefixRefForwardingComponent<"div", AccordionBodyProps> =
  React.forwardRef<HTMLElement, AccordionBodyProps>(
    ({ as: Component = "div", bsPrefix, className, ...ps }, ref) => {
      bsPrefix = useBootstrapPrefix(bsPrefix, "accordion-body")
      const { eventKey } = useContext(AccordionItemContext)
      return (
        <AccordionCollapse eventKey={eventKey}>
          <Component ref={ref} {...ps} className={classNames(className, bsPrefix)} />
        </AccordionCollapse>
      )
    }
  )
AccordionBody.displayName = "AccordionBody"
export interface AccordionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    BsPrefixProps {}
export function useAccordionButton(eventKey: string, onClick?: EventHandler): EventHandler {
  const { activeEventKey, onSelect } = useContext(AccordionContext)
  return e => {
    const eventKeyPassed = eventKey === activeEventKey ? null : eventKey
    if (onSelect) onSelect(eventKeyPassed, e)
    if (onClick) onClick(e)
  }
}
export const AccordionButton: BsPrefixRefForwardingComponent<"div", AccordionButtonProps> =
  React.forwardRef<HTMLButtonElement, AccordionButtonProps>(
    ({ as: Component = "button", bsPrefix, className, onClick, ...ps }, ref) => {
      bsPrefix = useBootstrapPrefix(bsPrefix, "accordion-button")
      const { eventKey } = useContext(AccordionItemContext)
      const accordionOnClick = useAccordionButton(eventKey, onClick)
      const { activeEventKey } = useContext(AccordionContext)
      if (Component === "button") {
        ps.type = "button"
      }
      return (
        <Component
          ref={ref}
          onClick={accordionOnClick}
          {...ps}
          aria-expanded={eventKey === activeEventKey}
          className={classNames(className, bsPrefix, eventKey !== activeEventKey && "collapsed")}
        />
      )
    }
  )
AccordionButton.displayName = "AccordionButton"
export interface AccordionCollapseProps extends BsPrefixProps, CollapseProps {
  eventKey: string
}
export const AccordionCollapse: BsPrefixRefForwardingComponent<"div", AccordionCollapseProps> =
  React.forwardRef<Transition<any>, AccordionCollapseProps>(
    ({ as: Component = "div", bsPrefix, className, children, eventKey, ...ps }, ref) => {
      const { activeEventKey } = useContext(AccordionContext)
      bsPrefix = useBootstrapPrefix(bsPrefix, "accordion-collapse")
      return (
        <Collapse
          ref={ref}
          in={activeEventKey === eventKey}
          {...ps}
          className={classNames(className, bsPrefix)}
        >
          <Component>{React.Children.only(children)}</Component>
        </Collapse>
      )
    }
  ) as any
AccordionCollapse.displayName = "AccordionCollapse"
export interface AccordionContextValue {
  activeEventKey?: string
  onSelect?: SelectCallback
}
export const AccordionContext = React.createContext<AccordionContextValue>({})
AccordionContext.displayName = "AccordionContext"
export interface AccordionHeaderProps extends BsPrefixProps, React.HTMLAttributes<HTMLElement> {}
export const AccordionHeader: BsPrefixRefForwardingComponent<"h2", AccordionHeaderProps> =
  React.forwardRef<HTMLElement, AccordionHeaderProps>(
    ({ as: Component = "h2", bsPrefix, className, children, onClick, ...ps }, ref) => {
      bsPrefix = useBootstrapPrefix(bsPrefix, "accordion-header")
      return (
        <Component ref={ref} {...ps} className={classNames(className, bsPrefix)}>
          <AccordionButton onClick={onClick}>{children}</AccordionButton>
        </Component>
      )
    }
  )
AccordionHeader.displayName = "AccordionHeader"
export interface AccordionItemProps extends BsPrefixProps, React.HTMLAttributes<HTMLElement> {
  eventKey: string
}
export const AccordionItem: BsPrefixRefForwardingComponent<"div", AccordionItemProps> =
  React.forwardRef<HTMLElement, AccordionItemProps>(
    ({ as: Component = "div", bsPrefix, className, eventKey, ...ps }, ref) => {
      bsPrefix = useBootstrapPrefix(bsPrefix, "accordion-item")
      const contextValue = useMemo<AccordionItemContextValue>(
        () => ({
          eventKey,
        }),
        [eventKey]
      )
      return (
        <AccordionItemContext.Provider value={contextValue}>
          <Component ref={ref} {...ps} className={classNames(className, bsPrefix)} />
        </AccordionItemContext.Provider>
      )
    }
  )
AccordionItem.displayName = "AccordionItem"
export interface AccordionItemContextValue {
  eventKey: string
}
export const AccordionItemContext = React.createContext<AccordionItemContextValue>({
  eventKey: "",
})
AccordionItemContext.displayName = "AccordionItemContext"
export interface AccordionProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "onSelect">,
    BsPrefixProps {
  activeKey?: string
  defaultActiveKey?: string
  onSelect?: SelectCallback
  flush?: boolean
}
export const Accordion: BsPrefixRefForwardingComponent<"div", AccordionProps> = React.forwardRef<
  HTMLElement,
  AccordionProps
>((props, ref) => {
  const {
    as: Component = "div",
    activeKey,
    bsPrefix,
    className,
    onSelect,
    flush,
    ...controlledProps
  } = useUncontrolled(props, {
    activeKey: "onSelect",
  })
  const prefix = useBootstrapPrefix(bsPrefix, "accordion")
  const contextValue = useMemo(
    () => ({
      activeEventKey: activeKey,
      onSelect,
    }),
    [activeKey, onSelect]
  )
  return (
    <AccordionContext.Provider value={contextValue}>
      <Component
        ref={ref}
        {...controlledProps}
        className={classNames(className, prefix, flush && `${prefix}-flush`)}
      />
    </AccordionContext.Provider>
  )
})
Accordion.displayName = "Accordion"
Object.assign(Accordion, {
  Button: AccordionButton,
  Collapse: AccordionCollapse,
  Item: AccordionItem,
  Header: AccordionHeader,
  Body: AccordionBody,
})
