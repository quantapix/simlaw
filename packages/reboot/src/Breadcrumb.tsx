import classNames from 'classnames';
import * as React from 'react';
import Anchor from '@restart/ui/Anchor';
import { useBsPrefix } from './Theme';
import { BsProps, BsRefComponent } from './helpers';

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

export const Item: BsRefComponent<'li', ItemProps> = React.forwardRef<
  HTMLElement,
  ItemProps
>(
  (
    {
      bsPrefix,
      active,
      children,
      className,
      as: X = 'li',
      linkAs: Y = Anchor,
      linkProps,
      href,
      title,
      target,
      ...ps
    },
    ref,
  ) => {
    const bs = useBsPrefix(bsPrefix, 'breadcrumb-item');
    return (
      <X
        ref={ref}
        {...ps}
        className={classNames(bs, className, { active })}
        aria-current={active ? 'page' : undefined}
      >
        {active ? (
          children
        ) : (
          <Y {...linkProps} href={href} title={title} target={target}>
            {children}
          </Y>
        )}
      </X>
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

export const Breadcrumb: BsRefComponent<'nav', Props> = React.forwardRef<
  HTMLElement,
  Props
>(
  (
    { bsPrefix, className, listProps, children, label, as: X = 'nav', ...ps },
    ref,
  ) => {
    const bs = useBsPrefix(bsPrefix, 'breadcrumb');
    return (
      <X aria-label={label} className={className} ref={ref} {...ps}>
        <ol {...listProps} className={classNames(bs, listProps?.className)}>
          {children}
        </ol>
      </X>
    );
  },
);

Breadcrumb.displayName = 'Breadcrumb';
Breadcrumb.defaultProps = {
  label: 'breadcrumb',
  listProps: {},
};
