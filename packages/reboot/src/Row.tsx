import classNames from 'classnames';
import * as React from 'react';
import { useBsPrefix, useBsBreakpoints, useBsMinBreakpoint } from './Theme';
import { BsProps, BsRefComponent } from './helpers';

type ColWidth =
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
type Columns = ColWidth | { cols?: ColWidth };

export interface Props extends BsProps, React.HTMLAttributes<HTMLElement> {
  xs?: Columns;
  sm?: Columns;
  md?: Columns;
  lg?: Columns;
  xl?: Columns;
  xxl?: Columns;
  [key: string]: any;
}

export const Row: BsRefComponent<'div', Props> = React.forwardRef<
  HTMLDivElement,
  Props
>(({ bsPrefix, className, as: X = 'div', ...ps }: Props, ref) => {
  const decoratedBsPrefix = useBsPrefix(bsPrefix, 'row');
  const breakpoints = useBsBreakpoints();
  const minBreakpoint = useBsMinBreakpoint();
  const sizePrefix = `${decoratedBsPrefix}-cols`;
  const classes: string[] = [];
  breakpoints.forEach((brkPoint) => {
    const propValue = ps[brkPoint];
    delete ps[brkPoint];
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
    <X
      ref={ref}
      {...ps}
      className={classNames(className, decoratedBsPrefix, ...classes)}
    />
  );
});
Row.displayName = 'Row';
