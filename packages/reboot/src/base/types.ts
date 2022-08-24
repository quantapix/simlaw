import * as qr from "react"

export type EventKey = string | number

export function makeEventKey(
  key?: EventKey | null,
  href: string | null = null
): string | null {
  if (key != null) return String(key)
  return href || null
}

export type IntrinsicTypes = keyof JSX.IntrinsicElements

export type AssignProps<T extends string | qr.ComponentType<any>, P> = Omit<
  qr.ComponentPropsWithRef<T extends qr.ElementType ? T : never>,
  keyof P
> &
  P

export type AssignPropsNoRef<
  T extends string | qr.ComponentType<any>,
  P
> = Omit<
  qr.ComponentPropsWithoutRef<T extends qr.ElementType ? T : never>,
  keyof P
> &
  P

export interface DynRef<
  T0 extends string | qr.ComponentType<any>,
  P = { children?: qr.ReactNode }
> {
  <As extends string | qr.ComponentType<any> = T0>(
    props: AssignProps<As, { as?: As } & P>,
    context?: any
  ): qr.ReactElement | null
  propTypes?: any
  contextTypes?: any
  defaultProps?: Partial<P> | undefined
  displayName?: string | undefined
}

export interface DynFun<
  T0 extends string | qr.ComponentType<any>,
  P = { children?: qr.ReactNode }
> {
  <As extends string | qr.ComponentType<any> = T0>(
    props: AssignPropsNoRef<As, { as?: As } & P>,
    context?: any
  ): qr.ReactElement | null
  propTypes?: any
  contextTypes?: any
  defaultProps?: Partial<P> | undefined
  displayName?: string | undefined
}

export class DynComp<
  As extends string | qr.ComponentType<any>,
  P = unknown
> extends qr.Component<AssignProps<As, { as?: As } & P>> {}

export type DynCompClass<
  As extends string | qr.ComponentType<any>,
  P = unknown
> = qr.ComponentClass<AssignProps<As, { as?: As } & P>>

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
  mountOnEnter?: boolean | undefined
  unmountOnExit?: boolean | undefined
}

export type Transition = qr.ComponentType<TransitionProps>

export const ATTRIBUTE_PREFIX = `data-rr-ui-` as const

export const PROPERTY_PREFIX = `rrUi` as const

export function dataAttr<T extends string>(x: T) {
  return `${ATTRIBUTE_PREFIX}${x}` as const
}

export function dataProp<T extends string>(x: T) {
  return `${PROPERTY_PREFIX}${x}` as const
}
