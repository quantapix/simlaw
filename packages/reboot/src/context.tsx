import forwardRef from "./forwardRef"
import mapContextToProps from "./mapContextToProps"
import React from "react"
declare module "@restart/context/forwardRef" {
  import * as React from "react"
  interface ForwardRefOptions<TProps> {
    displayName?: string
    propTypes?: React.ValidationMap<TProps>
    defaultProps?: Partial<TProps>
    allowFallback?: boolean
  }
  function forwardRef<TRef, TProps>(
    renderFn: (
      props: TProps & { children?: React.ReactNode },
      ref: React.Ref<TRef> | null
    ) => React.ReactElement<any> | null,
    options?: ForwardRefOptions<TProps>
  ): React.ForwardRefExoticComponent<React.PropsWithRef<TProps> & React.RefAttributes<TRef>>
  export default forwardRef
}
declare module "@restart/context" {
  import mapContextToProps from "@restart/context/mapContextToProps"
  import forwardRef from "@restart/context/forwardRef"
  export { mapContextToProps, forwardRef }
}
export default function forwardRef(
  renderFn,
  {
    propTypes,
    defaultProps,
    allowFallback = false,
    displayName = renderFn.name || renderFn.displayName,
  } = {}
) {
  const render = (props, ref) => renderFn(props, ref)
  return Object.assign(
    React.forwardRef || !allowFallback ? React.forwardRef(render) : props => render(props, null),
    {
      displayName,
      propTypes,
      defaultProps,
    }
  )
}
export default function transformContext(Context) {
  return forwardRef(
    props => (
      <Context.Consumer>
        {context => (
          <Context.Provider value={props.mapToValue(context)}>{props.children}</Context.Provider>
        )}
      </Context.Consumer>
    ),
    { displayName: "ContextTransformer" }
  )
}
declare module "@restart/context/mapContextToProps" {
  import * as React from "react"
  type Omit<T, U> = Pick<T, Exclude<keyof T, keyof U>>
  type GetProps<C> = C extends React.ComponentType<infer P> ? P : never
  export interface ContextInjectedComponent<TComponent, TInjectedProps, TExtraProps>
    extends React.ForwardRefExoticComponent<
      Omit<GetProps<TComponent>, TInjectedProps> & TExtraProps
    > {}
  function mapContextToProps<TComponent, TContext, TContextProps, TOwnProps>(
    context: React.Context<TContext> | [React.Context<TContext>],
    mapToProps: (ctxValue: TContext, props: TOwnProps) => TContextProps,
    Component: TComponent
  ): ContextInjectedComponent<TComponent, TContextProps, TOwnProps>
  function mapContextToProps<TContext, TContextProps, TOwnProps>(
    context: React.Context<TContext> | [React.Context<TContext>],
    mapToProps: (ctxValue: TContext, props: TOwnProps) => TContextProps
  ): <TComponent>(
    component: TComponent
  ) => ContextInjectedComponent<TComponent, TContextProps, TOwnProps>
  function mapContextToProps<TComponent, TContext1, TContext2, TContextProps, TOwnProps>(
    context: [React.Context<TContext1>, React.Context<TContext2>],
    mapToProps: (c1: TContext1, c2: TContext2, props: TOwnProps) => TContextProps,
    Component: TComponent
  ): ContextInjectedComponent<TComponent, TContextProps, TOwnProps>
  function mapContextToProps<TContext1, TContext2, TContextProps, TOwnProps>(
    context: [React.Context<TContext1>, React.Context<TContext2>],
    mapToProps: (c1: TContext1, c2: TContext2, props: TOwnProps) => TContextProps
  ): <TComponent>(
    component: TComponent
  ) => ContextInjectedComponent<TComponent, TContextProps, TOwnProps>
  function mapContextToProps<TComponent, TContext1, TContext2, TContext3, TContextProps, TOwnProps>(
    context: [React.Context<TContext1>, React.Context<TContext2>, React.Context<TContext3>],
    mapToProps: (c1: TContext1, c2: TContext2, c3: TContext3, props: TOwnProps) => TContextProps,
    Component: TComponent
  ): ContextInjectedComponent<TComponent, TContextProps, TOwnProps>
  function mapContextToProps<TContext1, TContext2, TContext3, TContextProps, TOwnProps>(
    context: [React.Context<TContext1>, React.Context<TContext2>, React.Context<TContext3>],
    mapToProps: (c1: TContext1, c2: TContext2, c3: TContext3, props: TOwnProps) => TContextProps
  ): <TComponent>(
    component: TComponent
  ) => ContextInjectedComponent<TComponent, TContextProps, TOwnProps>
  function mapContextToProps<
    TComponent,
    TContext1,
    TContext2,
    TContext3,
    TContext4,
    TContextProps,
    TOwnProps
  >(
    context: [
      React.Context<TContext1>,
      React.Context<TContext2>,
      React.Context<TContext3>,
      React.Context<TContext4>
    ],
    mapToProps: (
      c1: TContext1,
      c2: TContext2,
      c3: TContext3,
      c4: TContext4,
      props: TOwnProps
    ) => TContextProps,
    Component: TComponent
  ): ContextInjectedComponent<TComponent, TContextProps, TOwnProps>
  function mapContextToProps<TContext1, TContext2, TContext3, TContext4, TContextProps, TOwnProps>(
    context: [
      React.Context<TContext1>,
      React.Context<TContext2>,
      React.Context<TContext3>,
      React.Context<TContext4>
    ],
    mapToProps: (
      c1: TContext1,
      c2: TContext2,
      c3: TContext3,
      c4: TContext4,
      props: TOwnProps
    ) => TContextProps
  ): <TComponent>(
    component: TComponent
  ) => ContextInjectedComponent<TComponent, TContextProps, TOwnProps>
  export default mapContextToProps
}
export default (Context, prop, Component) =>
  mapContextToProps(Context, context => ({ [prop]: context }), Component)
const getDisplayName = Component => {
  const name = typeof Component === "string" ? Component : Component.name || Component.displayName
  return name ? `ContextTransform(${name})` : "ContextTransform"
}
const ensureConsumer = c => c.Consumer || c
function $mapContextToProps(
  { consumers: maybeArrayOfConsumers, mapToProps, displayName, forwardRefAs = "ref" },
  Component
) {
  let consumers = maybeArrayOfConsumers
  if (!Array.isArray(maybeArrayOfConsumers)) {
    consumers = [maybeArrayOfConsumers]
  }
  const SingleConsumer = ensureConsumer(consumers[0])
  function singleRender(props, ref) {
    const propsWithRef = { [forwardRefAs]: ref, ...props }
    return (
      <SingleConsumer>
        {value => <Component {...propsWithRef} {...mapToProps(value, props)} />}
      </SingleConsumer>
    )
  }
  function multiRender(props, ref) {
    const propsWithRef = { [forwardRefAs]: ref, ...props }
    return consumers.reduceRight(
      (inner, Context) =>
        (...args) => {
          const Consumer = ensureConsumer(Context)
          return <Consumer>{value => inner(...args, value)}</Consumer>
        },
      (...contexts) => <Component {...propsWithRef} {...mapToProps(...contexts, props)} />
    )()
  }
  const contextTransform = consumers.length === 1 ? singleRender : multiRender
  return forwardRef(contextTransform, {
    displayName: displayName || getDisplayName(Component),
  })
}
export default function mapContextToProps(maybeOpts, mapToProps, Component) {
  if (arguments.length === 2) return $mapContextToProps(maybeOpts, mapToProps)
  return $mapContextToProps({ consumers: maybeOpts, mapToProps }, Component)
}
