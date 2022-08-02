import classNames from 'classnames';
import * as React from 'react';
import { useBootstrapPrefix } from './ThemeProvider';
import createWithBsPrefix from './createWithBsPrefix';
import divWithClassName from './divWithClassName';
import CardImg from './CardImg';
import CardHeader from './CardHeader';
import { BsProps, BsPrefixRefForwardingComponent } from './helpers';
import { Color, Variant } from './types';

const DivStyledAsH5 = divWithClassName('h5');
const DivStyledAsH6 = divWithClassName('h6');
const CardBody = createWithBsPrefix('card-body');
const CardTitle = createWithBsPrefix('card-title', {
  Component: DivStyledAsH5,
});
const CardSubtitle = createWithBsPrefix('card-subtitle', {
  Component: DivStyledAsH6,
});
const CardLink = createWithBsPrefix('card-link', { Component: 'a' });
const CardText = createWithBsPrefix('card-text', { Component: 'p' });
const CardFooter = createWithBsPrefix('card-footer');
const CardImgOverlay = createWithBsPrefix('card-img-overlay');

export interface Props extends BsProps, React.HTMLAttributes<HTMLElement> {
  bg?: Variant;
  text?: Color;
  border?: Variant;
  body?: boolean;
}

export const Card: BsPrefixRefForwardingComponent<'div', Props> =
  React.forwardRef<HTMLElement, Props>(
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
      const prefix = useBootstrapPrefix(bsPrefix, 'card');

      return (
        <Component
          ref={ref}
          {...ps}
          className={classNames(
            className,
            prefix,
            bg && `bg-${bg}`,
            text && `text-${text}`,
            border && `border-${border}`,
          )}
        >
          {body ? <CardBody>{children}</CardBody> : children}
        </Component>
      );
    },
  );

Card.displayName = 'Card';
Card.defaultProps = {
  body: false,
};

Object.assign(Card, {
  Img: CardImg,
  Title: CardTitle,
  Subtitle: CardSubtitle,
  Body: CardBody,
  Link: CardLink,
  Text: CardText,
  Header: CardHeader,
  Footer: CardFooter,
  ImgOverlay: CardImgOverlay,
});
