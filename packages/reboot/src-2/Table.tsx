import classNames from 'classnames';
import * as React from 'react';
import { useBsPrefix } from './ThemeProvider';
import { BsOnlyProps } from './helpers';

export interface Props
  extends BsOnlyProps,
    React.TableHTMLAttributes<HTMLTableElement> {
  striped?: boolean | string;
  bordered?: boolean;
  borderless?: boolean;
  hover?: boolean;
  size?: string;
  variant?: string;
  responsive?: boolean | string;
}

export const Table = React.forwardRef<HTMLTableElement, Props>(
  (
    {
      bsPrefix,
      className,
      striped,
      bordered,
      borderless,
      hover,
      size,
      variant,
      responsive,
      ...ps
    },
    ref,
  ) => {
    const decoratedBsPrefix = useBsPrefix(bsPrefix, 'table');
    const classes = classNames(
      className,
      decoratedBsPrefix,
      variant && `${decoratedBsPrefix}-${variant}`,
      size && `${decoratedBsPrefix}-${size}`,
      striped &&
        `${decoratedBsPrefix}-${
          typeof striped === 'string' ? `striped-${striped}` : 'striped'
        }`,
      bordered && `${decoratedBsPrefix}-bordered`,
      borderless && `${decoratedBsPrefix}-borderless`,
      hover && `${decoratedBsPrefix}-hover`,
    );
    const table = <table {...ps} className={classes} ref={ref} />;
    if (responsive) {
      let responsiveClass = `${decoratedBsPrefix}-responsive`;
      if (typeof responsive === 'string') {
        responsiveClass = `${responsiveClass}-${responsive}`;
      }
      return <div className={responsiveClass}>{table}</div>;
    }
    return table;
  },
);
