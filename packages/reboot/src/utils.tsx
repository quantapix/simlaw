import * as React from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';
import camelize from 'dom-helpers/camelize';
import { useBsPrefix } from './Theme';
import { BsRefComp } from './helpers';

export function map<P = any>(
  xs,
  f: (el: React.ReactElement<P>, i: number) => any,
) {
  let i = 0;
  return React.Children.map(xs, (x) =>
    React.isValidElement<P>(x) ? f(x, i++) : x,
  );
}

export function forEach<P = any>(
  xs,
  f: (el: React.ReactElement<P>, i: number) => void,
) {
  let i = 0;
  React.Children.forEach(xs, (x) => {
    if (React.isValidElement<P>(x)) f(x, i++);
  });
}

export function hasChildOfType<P = any>(
  xs: React.ReactNode,
  type: string | React.JSXElementConstructor<P>,
): boolean {
  return React.Children.toArray(xs).some(
    (x) => React.isValidElement(x) && x.type === type,
  );
}

export function createChainedFunction(...fs) {
  return fs
    .filter((f) => f != null)
    .reduce((acc, f) => {
      if (typeof f !== 'function') {
        throw new Error(
          'Invalid Argument Type, must only provide functions, undefined, or null.',
        );
      }
      if (acc === null) return f;
      return function chainedFunction(...xs) {
        // @ts-ignore
        acc.apply(this, xs);
        // @ts-ignore
        f.apply(this, xs);
      };
    }, null);
}

export function triggerBrowserReflow(node: HTMLElement): void {
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  node.offsetHeight;
}

export function safeFindDOMNode(
  componentOrElement: React.ComponentClass | Element | null | undefined,
) {
  if (componentOrElement && 'setState' in componentOrElement) {
    return ReactDOM.findDOMNode(componentOrElement);
  }
  return (componentOrElement ?? null) as Element | Text | null;
}

export const divAs = (className: string) =>
  React.forwardRef<HTMLDivElement, React.ComponentProps<'div'>>((p, ref) => (
    <div
      {...p}
      ref={ref}
      className={classNames((p as any).className, className)}
    />
  ));

const pascalCase = (str) => str[0].toUpperCase() + camelize(str).slice(1);

interface BsOptions<As extends React.ElementType = 'div'> {
  displayName?: string;
  Component?: As;
  defaultProps?: Partial<React.ComponentProps<As>>;
}

export function withBs<As extends React.ElementType = 'div'>(
  prefix: string,
  {
    displayName = pascalCase(prefix),
    Component,
    defaultProps,
  }: BsOptions<As> = {},
): BsRefComp<As> {
  const y = React.forwardRef(
    (
      { className, bsPrefix, as: X = Component || 'div', ...props }: any,
      ref,
    ) => {
      const resolvedPrefix = useBsPrefix(bsPrefix, prefix);
      return (
        <X
          ref={ref}
          className={classNames(className, resolvedPrefix)}
          {...props}
        />
      );
    },
  );
  y.defaultProps = defaultProps as any;
  y.displayName = displayName;
  return y as any;
}
