import classNames from 'classnames';
import camelize from 'dom-helpers/camelize';
import * as React from 'react';
import { useBsPrefix } from './Theme';
import { BsRefComponent } from './helpers';

const pascalCase = (str) => str[0].toUpperCase() + camelize(str).slice(1);

interface BsPrefixOptions<As extends React.ElementType = 'div'> {
  displayName?: string;
  Component?: As;
  defaultProps?: Partial<React.ComponentProps<As>>;
}

// TODO: emstricten & fix the typing here! `createWithBsPrefix<TElementType>...`
export default function withBsPrefix<As extends React.ElementType = 'div'>(
  prefix: string,
  {
    displayName = pascalCase(prefix),
    Component,
    defaultProps,
  }: BsPrefixOptions<As> = {},
): BsRefComponent<As> {
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
