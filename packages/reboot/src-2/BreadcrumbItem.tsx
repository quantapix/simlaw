import classNames from 'classnames';
import * as React from 'react';
import Anchor from '@restart/ui/Anchor';
import { useBootstrapPrefix } from './ThemeProvider';
import { BsProps, BsPrefixRefForwardingComponent } from './helpers';

export interface Props
  extends BsProps,
    Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  active?: boolean;
  href?: string;
  linkAs?: React.ElementType;
  target?: string;
  title?: React.ReactNode;
  linkProps?: Record<string, any>;
}

export const BreadcrumbItem: BsPrefixRefForwardingComponent<'li', Props> =
  React.forwardRef<HTMLElement, Props>(
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
      const prefix = useBootstrapPrefix(bsPrefix, 'breadcrumb-item');
      return (
        <Component
          ref={ref}
          {...ps}
          className={classNames(prefix, className, { active })}
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

BreadcrumbItem.displayName = 'BreadcrumbItem';
BreadcrumbItem.defaultProps = {
  active: false,
  linkProps: {},
};
