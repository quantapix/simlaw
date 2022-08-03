import classNames from 'classnames';
import * as React from 'react';
import { useMemo } from 'react';
import { useBsPrefix } from './Theme';
import withBsPrefix from './createWithBsPrefix';
import divWithClassName from './divWithClassName';
import { BsProps, BsRefComponent } from './helpers';
import { Color, Variant } from './types';

interface Data {
  cardHeaderBsPrefix: string;
}

export const Context = React.createContext<Data | null>(null);
Context.displayName = 'CardHeaderContext';

export interface HeaderProps
  extends BsProps,
    React.HTMLAttributes<HTMLElement> {}

export const Header: BsRefComponent<'div', HeaderProps> = React.forwardRef<
  HTMLElement,
  HeaderProps
>(({ bsPrefix, className, as: X = 'div', ...ps }, ref) => {
  const bs = useBsPrefix(bsPrefix, 'card-header');
  const v = useMemo(
    () => ({
      cardHeaderBsPrefix: bs,
    }),
    [bs],
  );
  return (
    <Context.Provider value={v}>
      <X ref={ref} {...ps} className={classNames(className, bs)} />
    </Context.Provider>
  );
});
Header.displayName = 'CardHeader';

export const Body = withBsPrefix('card-body');
const DivAsH5 = divWithClassName('h5');
export const Title = withBsPrefix('card-title', {
  Component: DivAsH5,
});
const DivAsH6 = divWithClassName('h6');
export const Subtitle = withBsPrefix('card-subtitle', {
  Component: DivAsH6,
});
export const Link = withBsPrefix('card-link', { Component: 'a' });
export const Text = withBsPrefix('card-text', { Component: 'p' });
export const Footer = withBsPrefix('card-footer');
export const ImgOverlay = withBsPrefix('card-img-overlay');

export interface ImgProps
  extends BsProps,
    React.ImgHTMLAttributes<HTMLImageElement> {
  variant?: 'top' | 'bottom' | string;
}

export const Img: BsRefComponent<'img', ImgProps> = React.forwardRef(
  ({ bsPrefix, className, variant, as: X = 'img', ...ps }: ImgProps, ref) => {
    const bs = useBsPrefix(bsPrefix, 'card-img');
    return (
      <X
        ref={ref}
        className={classNames(variant ? `${bs}-${variant}` : bs, className)}
        {...ps}
      />
    );
  },
);
Img.displayName = 'CardImg';

export const Group = withBsPrefix('card-group');

export interface Props extends BsProps, React.HTMLAttributes<HTMLElement> {
  bg?: Variant;
  text?: Color;
  border?: Variant;
  body?: boolean;
}

export const Card: BsRefComponent<'div', Props> = React.forwardRef<
  HTMLElement,
  Props
>(
  (
    {
      bsPrefix,
      className,
      bg,
      text,
      border,
      body,
      children,
      as: X = 'div',
      ...ps
    },
    ref,
  ) => {
    const bs = useBsPrefix(bsPrefix, 'card');
    return (
      <X
        ref={ref}
        {...ps}
        className={classNames(
          className,
          bs,
          bg && `bg-${bg}`,
          text && `text-${text}`,
          border && `border-${border}`,
        )}
      >
        {body ? <Body>{children}</Body> : children}
      </X>
    );
  },
);

Card.displayName = 'Card';
Card.defaultProps = {
  body: false,
};
