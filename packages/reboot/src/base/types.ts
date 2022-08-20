import * as qr from "react"

export type EventKey = string | number

export function makeEventKey(
  eventKey?: EventKey | null,
  href: string | null = null
): string | null {
  if (eventKey != null) return String(eventKey)
  return href || null
}

export type IntrinsicElementTypes = keyof JSX.IntrinsicElements

export type AssignPropsWithRef<
  Inner extends string | qr.ComponentType<any>,
  P
> = Omit<
  qr.ComponentPropsWithRef<Inner extends qr.ElementType ? Inner : never>,
  keyof P
> &
  P

export type { AssignPropsWithRef as AssignProps }

export type AssignPropsWithoutRef<
  Inner extends string | qr.ComponentType<any>,
  P
> = Omit<
  qr.ComponentPropsWithoutRef<Inner extends qr.ElementType ? Inner : never>,
  keyof P
> &
  P

export interface DynamicRefForwardingComponent<
  TInitial extends string | qr.ComponentType<any>,
  P = { children?: qr.ReactNode }
> {
  <As extends string | qr.ComponentType<any> = TInitial>(
    props: AssignPropsWithRef<As, { as?: As } & P>,
    context?: any
  ): qr.ReactElement | null
  propTypes?: any
  contextTypes?: any
  defaultProps?: Partial<P>
  displayName?: string
}

export interface DynamicFunctionComponent<
  TInitial extends string | qr.ComponentType<any>,
  P = { children?: qr.ReactNode }
> {
  <As extends string | qr.ComponentType<any> = TInitial>(
    props: AssignPropsWithoutRef<As, { as?: As } & P>,
    context?: any
  ): qr.ReactElement | null
  propTypes?: any
  contextTypes?: any
  defaultProps?: Partial<P>
  displayName?: string
}

export class DynamicComponent<
  As extends string | qr.ComponentType<any>,
  P = unknown
> extends qr.Component<AssignPropsWithRef<As, { as?: As } & P>> {}

export type DynamicComponentClass<
  As extends string | qr.ComponentType<any>,
  P = unknown
> = qr.ComponentClass<AssignPropsWithRef<As, { as?: As } & P>>

export type SelectCB = (
  eventKey: string | null,
  e: qr.SyntheticEvent<unknown>
) => void

export const Selectable = qr.createContext<SelectCB | null>(null)

export interface TransitionCBs {
  onEnter?(x: HTMLElement, isAppearing: boolean): any
  onEntering?(x: HTMLElement, isAppearing: boolean): any
  onEntered?(x: HTMLElement, isAppearing: boolean): any
  onExit?(x: HTMLElement): any
  onExiting?(x: HTMLElement): any
  onExited?(x: HTMLElement): any
}

export interface TransitionProps extends TransitionCBs {
  in?: boolean | undefined
  appear?: boolean
  children: qr.ReactElement
  mountOnEnter?: boolean
  unmountOnExit?: boolean
}

export type TransitionComponent = qr.ComponentType<TransitionProps>

export const ATTRIBUTE_PREFIX = `data-rr-ui-` as const

export const PROPERTY_PREFIX = `rrUi` as const

export function dataAttr<T extends string>(x: T) {
  return `${ATTRIBUTE_PREFIX}${x}` as const
}

export function dataProp<T extends string>(x: T) {
  return `${PROPERTY_PREFIX}${x}` as const
}
