import classNames from 'classnames';
import * as React from 'react';
import { useBs, useBreakpoints, useMinBreakpoint } from './Theme';
import { BsProps, BsRefComp } from './helpers';

type NumberAttr =
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
  | '12';

type OrderNumber = number | '1' | '2' | '3' | '4' | '5';
type ColOrder = OrderNumber | 'first' | 'last';
type ColSize = boolean | 'auto' | NumberAttr;
type ColSpec =
  | ColSize
  | { span?: ColSize; offset?: NumberAttr; order?: ColOrder };

export interface Props extends BsProps, React.HTMLAttributes<HTMLElement> {
  xs?: ColSpec;
  sm?: ColSpec;
  md?: ColSpec;
  lg?: ColSpec;
  xl?: ColSpec;
  xxl?: ColSpec;
  [key: string]: any;
}

export interface UseColMetadata {
  as?: React.ElementType;
  bsPrefix: string;
  spans: string[];
}

export function useCol({
  as,
  bsPrefix,
  className,
  ...ps
}: Props): [any, UseColMetadata] {
  bsPrefix = useBs(bsPrefix, 'col');
  const breakpoints = useBreakpoints();
  const minBreakpoint = useMinBreakpoint();
  const spans: string[] = [];
  const classes: string[] = [];
  breakpoints.forEach((x) => {
    const propValue = ps[x];
    delete ps[x];
    let span: ColSize | undefined;
    let offset: NumberAttr | undefined;
    let order: ColOrder | undefined;
    if (typeof propValue === 'object' && propValue != null) {
      ({ span, offset, order } = propValue);
    } else {
      span = propValue;
    }
    const infix = x !== minBreakpoint ? `-${x}` : '';
    if (span)
      spans.push(
        span === true ? `${bsPrefix}${infix}` : `${bsPrefix}${infix}-${span}`,
      );
    if (order != null) classes.push(`order${infix}-${order}`);
    if (offset != null) classes.push(`offset${infix}-${offset}`);
  });
  return [
    { ...ps, className: classNames(className, ...spans, ...classes) },
    {
      as,
      bsPrefix,
      spans,
    },
  ];
}

export const Col: BsRefComp<'div', Props> = React.forwardRef<
  HTMLElement,
  Props
>((xs, ref) => {
  const [{ className, ...ps }, { as: X = 'div', bsPrefix, spans }] = useCol(xs);
  return (
    <X
      {...ps}
      ref={ref}
      className={classNames(className, !spans.length && bsPrefix)}
    />
  );
});
Col.displayName = 'Col';
