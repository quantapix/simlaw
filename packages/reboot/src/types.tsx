import * as React from "react"
export type EventKey = string | number
export type IntrinsicElementTypes = keyof JSX.IntrinsicElements
export type AssignProps<T extends string | React.ComponentType<any>, U> = Omit<
  React.ComponentPropsWithRef<T extends React.ElementType ? T : never>,
  keyof U
> &
  U
export interface DynamicRefForwardingComponent<
  T0 extends string | React.ComponentType<any>,
  U = unknown
> {
  <T extends string | React.ComponentType<any> = T0>(
    props: React.PropsWithChildren<AssignProps<T, { as?: T } & U>>,
    context?: any
  ): React.ReactElement | null
  propTypes?: any
  contextTypes?: any
  defaultProps?: Partial<U>
  displayName?: string
}
export class DynamicComponent<
  T extends string | React.ComponentType<any>,
  U = unknown
> extends React.Component<AssignProps<T, { as?: T } & U>> {}
export type DynamicComponentClass<
  T extends string | React.ComponentType<any>,
  U = unknown
> = React.ComponentClass<AssignProps<T, { as?: T } & U>>
export type SelectCallback = (k: string | null, e: React.SyntheticEvent<unknown>) => void
export interface TransitionCallbacks {
  onEnter?(x: HTMLElement, isAppearing: boolean): any
  onEntering?(x: HTMLElement, isAppearing: boolean): any
  onEntered?(x: HTMLElement, isAppearing: boolean): any
  onExit?(x: HTMLElement): any
  onExiting?(x: HTMLElement): any
  onExited?(x: HTMLElement): any
}
export interface TransitionProps extends TransitionCallbacks {
  in?: boolean
  appear?: boolean
  children: React.ReactElement
  mountOnEnter?: boolean
  unmountOnExit?: boolean
}
export type TransitionComponent = React.ComponentType<TransitionProps>
export type Variant =
  | "primary"
  | "secondary"
  | "success"
  | "danger"
  | "warning"
  | "info"
  | "dark"
  | "light"
  | string
export type ButtonVariant =
  | Variant
  | "link"
  | "outline-primary"
  | "outline-secondary"
  | "outline-success"
  | "outline-danger"
  | "outline-warning"
  | "outline-info"
  | "outline-dark"
  | "outline-light"
export type Color =
  | "primary"
  | "secondary"
  | "success"
  | "danger"
  | "warning"
  | "info"
  | "dark"
  | "light"
  | "white"
  | "muted"
export type Placement = import("./use/usePopper").Placement
export type AlignDirection = "start" | "end"
export type ResponsiveAlignProp =
  | { sm: AlignDirection }
  | { md: AlignDirection }
  | { lg: AlignDirection }
  | { xl: AlignDirection }
  | { xxl: AlignDirection }
export type AlignType = AlignDirection | ResponsiveAlignProp
export type RootCloseEvent = "click" | "mousedown"
export const ATTRIBUTE_PREFIX = `data-rr-ui-` as const
export const PROPERTY_PREFIX = `rrUi` as const
export function dataAttr<T extends string>(x: T) {
  return `${ATTRIBUTE_PREFIX}${x}` as const
}
export function dataProp<T extends string>(x: T) {
  return `${PROPERTY_PREFIX}${x}` as const
}
