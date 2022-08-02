import * as React from 'react';

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
