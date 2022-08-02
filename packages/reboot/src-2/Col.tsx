import classNames from 'classnames';
import * as React from 'react';

import {
  useBootstrapPrefix,
  useBootstrapBreakpoints,
  useBootstrapMinBreakpoint,
} from './ThemeProvider';
import { BsProps, BsPrefixRefForwardingComponent } from './helpers';

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

type ColOrderNumber = number | '1' | '2' | '3' | '4' | '5';
type ColOrder = ColOrderNumber | 'first' | 'last';
type ColSize = boolean | 'auto' | NumberAttr;
type ColSpec =
  | ColSize
  | { span?: ColSize; offset?: NumberAttr; order?: ColOrder };

export interface ColProps extends BsProps, React.HTMLAttributes<HTMLElement> {
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
  ...props
}: ColProps): [any, UseColMetadata] {
  bsPrefix = useBootstrapPrefix(bsPrefix, 'col');
  const breakpoints = useBootstrapBreakpoints();
  const minBreakpoint = useBootstrapMinBreakpoint();

  const spans: string[] = [];
  const classes: string[] = [];

  breakpoints.forEach((brkPoint) => {
    const propValue = props[brkPoint];
    delete props[brkPoint];

    let span: ColSize | undefined;
    let offset: NumberAttr | undefined;
    let order: ColOrder | undefined;

    if (typeof propValue === 'object' && propValue != null) {
      ({ span, offset, order } = propValue);
    } else {
      span = propValue;
    }

    const infix = brkPoint !== minBreakpoint ? `-${brkPoint}` : '';

    if (span)
      spans.push(
        span === true ? `${bsPrefix}${infix}` : `${bsPrefix}${infix}-${span}`,
      );

    if (order != null) classes.push(`order${infix}-${order}`);
    if (offset != null) classes.push(`offset${infix}-${offset}`);
  });

  return [
    { ...props, className: classNames(className, ...spans, ...classes) },
    {
      as,
      bsPrefix,
      spans,
    },
  ];
}

const Col: BsPrefixRefForwardingComponent<'div', ColProps> = React.forwardRef<
  HTMLElement,
  ColProps
>(
  // Need to define the default "as" during prop destructuring to be compatible with styled-components github.com/react-bootstrap/react-bootstrap/issues/3595
  (props, ref) => {
    const [
      { className, ...colProps },
      { as: Component = 'div', bsPrefix, spans },
    ] = useCol(props);

    return (
      <Component
        {...colProps}
        ref={ref}
        className={classNames(className, !spans.length && bsPrefix)}
      />
    );
  },
);

Col.displayName = 'Col';

export default Col;
