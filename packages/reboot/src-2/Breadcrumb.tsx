import classNames from 'classnames';
import * as React from 'react';
import Anchor from '@restart/ui/Anchor';
import { useBootstrapPrefix } from './ThemeProvider';
import { BsProps, BsPrefixRefForwardingComponent } from './helpers';

export interface ItemProps
  extends BsProps,
    Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  active?: boolean;
  href?: string;
  linkAs?: React.ElementType;
  target?: string;
  title?: React.ReactNode;
  linkProps?: Record<string, any>;
}

export const Item: BsPrefixRefForwardingComponent<'li', ItemProps> =
  React.forwardRef<HTMLElement, ItemProps>(
    (
      {
        bsPrefix,
        active,
        children,
        className,
        as: Component = 'li',
        linkAs: LinkComponent = Anchor,
        linkProps,
        href,
        title,
        target,
        ...ps
      },
      ref,
    ) => {
      const bs = useBootstrapPrefix(bsPrefix, 'breadcrumb-item');
      return (
        <Component
          ref={ref}
          {...ps}
          className={classNames(bs, className, { active })}
          aria-current={active ? 'page' : undefined}
        >
          {active ? (
            children
          ) : (
            <LinkComponent
              {...linkProps}
              href={href}
              title={title}
              target={target}
            >
              {children}
            </LinkComponent>
          )}
        </Component>
      );
    },
  );

Item.displayName = 'BreadcrumbItem';
Item.defaultProps = {
  active: false,
  linkProps: {},
};

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
  Item,
});
