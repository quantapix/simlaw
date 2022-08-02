import classNames from 'classnames';
import * as React from 'react';
import { useMemo } from 'react';
import { useBootstrapPrefix } from './ThemeProvider';
import createWithBsPrefix from './createWithBsPrefix';
import divWithClassName from './divWithClassName';
import { BsProps, BsRefComponent } from './helpers';
import { Color, Variant } from './types';

interface ContextValue {
  cardHeaderBsPrefix: string;
}

export const Context = React.createContext<ContextValue | null>(null);
Context.displayName = 'CardHeaderContext';

export interface HeaderProps
  extends BsProps,
    React.HTMLAttributes<HTMLElement> {}

export const Header: BsRefComponent<'div', HeaderProps> = React.forwardRef<
  HTMLElement,
  HeaderProps
>(({ bsPrefix, className, as: Component = 'div', ...ps }, ref) => {
  const bs = useBootstrapPrefix(bsPrefix, 'card-header');
  const contextValue = useMemo(
    () => ({
      cardHeaderBsPrefix: bs,
    }),
    [bs],
  );
  return (
    <Context.Provider value={contextValue}>
      <Component ref={ref} {...ps} className={classNames(className, bs)} />
    </Context.Provider>
  );
});

Header.displayName = 'CardHeader';

const DivAsH5 = divWithClassName('h5');
const DivAsH6 = divWithClassName('h6');
const Body = createWithBsPrefix('card-body');
const Title = createWithBsPrefix('card-title', {
  Component: DivAsH5,
});
const Subtitle = createWithBsPrefix('card-subtitle', {
  Component: DivAsH6,
});
const Link = createWithBsPrefix('card-link', { Component: 'a' });
const Text = createWithBsPrefix('card-text', { Component: 'p' });
const Footer = createWithBsPrefix('card-footer');
const ImgOverlay = createWithBsPrefix('card-img-overlay');

export interface ImgProps
  extends BsProps,
    React.ImgHTMLAttributes<HTMLImageElement> {
  variant?: 'top' | 'bottom' | string;
}

export const Img: BsRefComponent<'img', ImgProps> = React.forwardRef(
  (
    { bsPrefix, className, variant, as: Component = 'img', ...ps }: ImgProps,
    ref,
  ) => {
    const bs = useBootstrapPrefix(bsPrefix, 'card-img');
    return (
      <Component
        ref={ref}
        className={classNames(variant ? `${bs}-${variant}` : bs, className)}
        {...ps}
      />
    );
  },
);
Img.displayName = 'CardImg';

export const Group = createWithBsPrefix('card-group');

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
      as: Component = 'div',
      ...ps
    },
    ref,
  ) => {
    const bs = useBootstrapPrefix(bsPrefix, 'card');
    return (
      <Component
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
      </Component>
    );
  },
);

Card.displayName = 'Card';
Card.defaultProps = {
  body: false,
};

Object.assign(Card, {
  Img,
  Title,
  Subtitle,
  Body,
  Link,
  Text,
  Header,
  Footer,
  ImgOverlay,
});
