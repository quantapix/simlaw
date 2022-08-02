import classNames from 'classnames';
import * as React from 'react';
import { ReactNode } from 'react';
import Anchor from '@restart/ui/Anchor';
import { BsProps, BsRefComponent } from './helpers';

export interface Props extends React.HTMLAttributes<HTMLElement>, BsProps {
  disabled?: boolean;
  active?: boolean;
  activeLabel?: string;
  href?: string;
}

export const PageItem: BsRefComponent<'li', Props> = React.forwardRef<
  HTMLLIElement,
  Props
>(
  (
    { active, disabled, className, style, activeLabel, children, ...ps }: Props,
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

PageItem.displayName = 'PageItem';
PageItem.defaultProps = {
  active: false,
  disabled: false,
  activeLabel: '(current)',
};

function createButton(name: string, defaultValue: ReactNode, label = name) {
  const Button = React.forwardRef(({ children, ...props }: Props, ref) => (
    <PageItem {...props} ref={ref}>
      <span aria-hidden="true">{children || defaultValue}</span>
      <span className="visually-hidden">{label}</span>
    </PageItem>
  ));
  Button.displayName = name;
  return Button;
}

export const First = createButton('First', '«');
export const Prev = createButton('Prev', '‹', 'Previous');
export const Ellipsis = createButton('Ellipsis', '…', 'More');
export const Next = createButton('Next', '›');
export const Last = createButton('Last', '»');
