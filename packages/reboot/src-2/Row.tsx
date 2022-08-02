import classNames from 'classnames';

import * as React from 'react';

import {
  useBootstrapPrefix,
  useBootstrapBreakpoints,
  useBootstrapMinBreakpoint,
} from './ThemeProvider';
import { BsProps, BsPrefixRefForwardingComponent } from './helpers';

type RowColWidth =
  | number
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | '11'
  | '12'
  | 'auto';
type RowColumns = RowColWidth | { cols?: RowColWidth };

export interface RowProps extends BsProps, React.HTMLAttributes<HTMLElement> {
  xs?: RowColumns;
  sm?: RowColumns;
  md?: RowColumns;
  lg?: RowColumns;
  xl?: RowColumns;
  xxl?: RowColumns;
  [key: string]: any;
}

const Row: BsPrefixRefForwardingComponent<'div', RowProps> = React.forwardRef<
  HTMLDivElement,
  RowProps
>(
  (
    {
      bsPrefix,
      className,
      // Need to define the default "as" during prop destructuring to be compatible with styled-components github.com/react-bootstrap/react-bootstrap/issues/3595
      as: Component = 'div',
      ...props
    }: RowProps,
    ref,
  ) => {
    const decoratedBsPrefix = useBootstrapPrefix(bsPrefix, 'row');
    const breakpoints = useBootstrapBreakpoints();
    const minBreakpoint = useBootstrapMinBreakpoint();

    const sizePrefix = `${decoratedBsPrefix}-cols`;
    const classes: string[] = [];

    breakpoints.forEach((brkPoint) => {
      const propValue = props[brkPoint];
      delete props[brkPoint];

      let cols;
      if (propValue != null && typeof propValue === 'object') {
        ({ cols } = propValue);
      } else {
        cols = propValue;
      }

      const infix = brkPoint !== minBreakpoint ? `-${brkPoint}` : '';

      if (cols != null) classes.push(`${sizePrefix}${infix}-${cols}`);
    });

    return (
      <Component
        ref={ref}
        {...props}
        className={classNames(className, decoratedBsPrefix, ...classes)}
      />
    );
  },
);

Row.displayName = 'Row';

export default Row;
