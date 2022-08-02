import classNames from 'classnames';
import * as React from 'react';
import { Image, Props } from './Image';
import createWithBsPrefix from './createWithBsPrefix';

export const FigureImage = React.forwardRef<HTMLImageElement, Props>(
  ({ className, ...ps }, ref) => (
    <Image ref={ref} {...ps} className={classNames(className, 'figure-img')} />
  ),
);

FigureImage.displayName = 'FigureImage';
FigureImage.defaultProps = { fluid: true };

export const FigureCaption = createWithBsPrefix('figure-caption', {
  Component: 'figcaption',
});

export const Figure = createWithBsPrefix('figure', {
  Component: 'figure',
});

Object.assign(Figure, {
  Image: FigureImage,
  Caption: FigureCaption,
});
