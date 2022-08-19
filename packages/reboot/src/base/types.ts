import * as React from "react"

export type EventKey = string | number

export type IntrinsicElementTypes = keyof JSX.IntrinsicElements

export type AssignPropsWithRef<
  Inner extends string | React.ComponentType<any>,
  P
> = Omit<
  React.ComponentPropsWithRef<Inner extends React.ElementType ? Inner : never>,
  keyof P
> &
  P

export type { AssignPropsWithRef as AssignProps }

export type AssignPropsWithoutRef<
  Inner extends string | React.ComponentType<any>,
  P
> = Omit<
  React.ComponentPropsWithoutRef<
    Inner extends React.ElementType ? Inner : never
  >,
  keyof P
> &
  P

export interface DynamicRefForwardingComponent<
  TInitial extends string | React.ComponentType<any>,
  P = { children?: React.ReactNode }
> {
  <As extends string | React.ComponentType<any> = TInitial>(
    props: AssignPropsWithRef<As, { as?: As } & P>,
    context?: any
  ): React.ReactElement | null
  propTypes?: any
  contextTypes?: any
  defaultProps?: Partial<P>
  displayName?: string
}

export interface DynamicFunctionComponent<
  TInitial extends string | React.ComponentType<any>,
  P = { children?: React.ReactNode }
> {
  <As extends string | React.ComponentType<any> = TInitial>(
    props: AssignPropsWithoutRef<As, { as?: As } & P>,
    context?: any
  ): React.ReactElement | null
  propTypes?: any
  contextTypes?: any
  defaultProps?: Partial<P>
  displayName?: string
}

export class DynamicComponent<
  As extends string | React.ComponentType<any>,
  P = unknown
> extends React.Component<AssignPropsWithRef<As, { as?: As } & P>> {}

export type DynamicComponentClass<
  As extends string | React.ComponentType<any>,
  P = unknown
> = React.ComponentClass<AssignPropsWithRef<As, { as?: As } & P>>

export type SelectCallback = (
  eventKey: string | null,
  e: React.SyntheticEvent<unknown>
) => void

export interface TransitionCallbacks {
  onEnter?(x: HTMLElement, isAppearing: boolean): any
  onEntering?(x: HTMLElement, isAppearing: boolean): any
  onEntered?(x: HTMLElement, isAppearing: boolean): any
  onExit?(x: HTMLElement): any
  onExiting?(x: HTMLElement): any
  onExited?(x: HTMLElement): any
}

export interface TransitionProps extends TransitionCallbacks {
  in?: boolean | undefined
  appear?: boolean
  children: React.ReactElement
  mountOnEnter?: boolean
  unmountOnExit?: boolean
}

export type TransitionComponent = React.ComponentType<TransitionProps>

export const ATTRIBUTE_PREFIX = `data-rr-ui-` as const

export const PROPERTY_PREFIX = `rrUi` as const

export function dataAttr<T extends string>(x: T) {
  return `${ATTRIBUTE_PREFIX}${x}` as const
}

export function dataProp<T extends string>(x: T) {
  return `${PROPERTY_PREFIX}${x}` as const
}
