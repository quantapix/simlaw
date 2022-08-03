import classNames from 'classnames';
import * as React from 'react';
import { ReactNode } from 'react';
import Anchor from '@restart/ui/Anchor';
import { useBsPrefix } from './Theme';
import { BsProps, BsRefComponent } from './helpers';

export interface ItemProps extends React.HTMLAttributes<HTMLElement>, BsProps {
  disabled?: boolean;
  active?: boolean;
  activeLabel?: string;
  href?: string;
}

export const Item: BsRefComponent<'li', ItemProps> = React.forwardRef<
  HTMLLIElement,
  ItemProps
>(
  (
    {
      active,
      disabled,
      className,
      style,
      activeLabel,
      children,
      ...ps
    }: ItemProps,
    ref,
  ) => {
    const Component = active || disabled ? 'span' : Anchor;
    return (
      <li
        ref={ref}
        style={style}
        className={classNames(className, 'page-item', { active, disabled })}
      >
        <Component className="page-link" disabled={disabled} {...ps}>
          {children}
          {active && activeLabel && (
            <span className="visually-hidden">{activeLabel}</span>
          )}
        </Component>
      </li>
    );
  },
);
Item.displayName = 'PageItem';
Item.defaultProps = {
  active: false,
  disabled: false,
  activeLabel: '(current)',
};

function createButton(name: string, defaultValue: ReactNode, label = name) {
  const Button = React.forwardRef(({ children, ...props }: ItemProps, ref) => (
    <Item {...props} ref={ref}>
      <span aria-hidden="true">{children || defaultValue}</span>
      <span className="visually-hidden">{label}</span>
    </Item>
  ));
  Button.displayName = name;
  return Button;
}

export const First = createButton('First', '«');
export const Prev = createButton('Prev', '‹', 'Previous');
export const Ellipsis = createButton('Ellipsis', '…', 'More');
export const Next = createButton('Next', '›');
export const Last = createButton('Last', '»');

export interface Props extends BsProps, React.HTMLAttributes<HTMLUListElement> {
  size?: 'sm' | 'lg';
}

export const Pagination = React.forwardRef<HTMLUListElement, Props>(
  ({ bsPrefix, className, size, ...props }, ref) => {
    const decoratedBsPrefix = useBsPrefix(bsPrefix, 'pagination');
    return (
      <ul
        ref={ref}
        {...props}
        className={classNames(
          className,
          decoratedBsPrefix,
          size && `${decoratedBsPrefix}-${size}`,
        )}
      />
    );
  },
);
Pagination.displayName = 'Pagination';

Object.assign(Pagination, {
  First,
  Prev,
  Ellipsis,
  Item,
  Next,
  Last,
});
