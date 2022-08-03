import classNames from 'classnames';
import * as React from 'react';
import { Image as Base, Props } from './Image';
import withBsPrefix from './createWithBsPrefix';

export const Image = React.forwardRef<HTMLImageElement, Props>(
  ({ className, ...ps }, ref) => (
    <Base ref={ref} {...ps} className={classNames(className, 'figure-img')} />
  ),
);
Image.displayName = 'FigureImage';
Image.defaultProps = { fluid: true };

export const Caption = withBsPrefix('figure-caption', {
  Component: 'figcaption',
});

export const Figure = withBsPrefix('figure', {
  Component: 'figure',
});

Object.assign(Figure, {
  Image,
  Caption,
});
