import classNames from 'classnames';
import * as React from 'react';
import { useMemo } from 'react';
import { useBs } from './Theme';
import { divAs, withBs } from './utils';
import { BsProps, BsRefComp } from './helpers';
import { Color, Variant } from './types';

interface Data {
  headerBs: string;
}

export const Context = React.createContext<Data | null>(null);
Context.displayName = 'CardHeaderContext';

export interface HeaderProps
  extends BsProps,
    React.HTMLAttributes<HTMLElement> {}

export const Header: BsRefComp<'div', HeaderProps> = React.forwardRef<
  HTMLElement,
  HeaderProps
>(({ bsPrefix, className, as: X = 'div', ...ps }, ref) => {
  const bs = useBs(bsPrefix, 'card-header');
  const v = useMemo(
    () => ({
      headerBs: bs,
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

export const Body = withBs('card-body');
const DivAsH5 = divAs('h5');
export const Title = withBs('card-title', {
  Component: DivAsH5,
});
const DivAsH6 = divAs('h6');
export const Subtitle = withBs('card-subtitle', {
  Component: DivAsH6,
});
export const Link = withBs('card-link', { Component: 'a' });
export const Text = withBs('card-text', { Component: 'p' });
export const Footer = withBs('card-footer');
export const ImgOverlay = withBs('card-img-overlay');

export interface ImgProps
  extends BsProps,
    React.ImgHTMLAttributes<HTMLImageElement> {
  variant?: 'top' | 'bottom' | string;
}

export const Img: BsRefComp<'img', ImgProps> = React.forwardRef(
  ({ bsPrefix, className, variant, as: X = 'img', ...ps }: ImgProps, ref) => {
    const bs = useBs(bsPrefix, 'card-img');
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

export const Group = withBs('card-group');

export interface Props extends BsProps, React.HTMLAttributes<HTMLElement> {
  bg?: Variant;
  text?: Color;
  border?: Variant;
  body?: boolean;
}

export const Card: BsRefComp<'div', Props> = React.forwardRef<
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
    const bs = useBs(bsPrefix, 'card');
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
