import classNames from 'classnames';
import * as React from 'react';
import { useBootstrapPrefix } from './ThemeProvider';
import { BreadcrumbItem } from './BreadcrumbItem';
import { BsProps, BsPrefixRefForwardingComponent } from './helpers';

export interface Props extends BsProps, React.HTMLAttributes<HTMLElement> {
  label?: string;
  listProps?: React.OlHTMLAttributes<HTMLOListElement>;
}

export const Breadcrumb: BsPrefixRefForwardingComponent<'nav', Props> =
  React.forwardRef<HTMLElement, Props>(
    (
      {
        bsPrefix,
        className,
        listProps,
        children,
        label,
        as: Component = 'nav',
        ...ps
      },
      ref,
    ) => {
      const prefix = useBootstrapPrefix(bsPrefix, 'breadcrumb');

      return (
        <Component aria-label={label} className={className} ref={ref} {...ps}>
          <ol
            {...listProps}
            className={classNames(prefix, listProps?.className)}
          >
            {children}
          </ol>
        </Component>
      );
    },
  );

Breadcrumb.displayName = 'Breadcrumb';
Breadcrumb.defaultProps = {
  label: 'breadcrumb',
  listProps: {},
};

Object.assign(Breadcrumb, {
  Item: BreadcrumbItem,
});
