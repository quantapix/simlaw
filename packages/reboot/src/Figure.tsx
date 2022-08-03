import classNames from 'classnames';
import * as React from 'react';
import { Image as X, Props } from './Image';
import { withBs } from './utils';

export const Image = React.forwardRef<HTMLImageElement, Props>(
  ({ className, ...ps }, ref) => (
    <X ref={ref} {...ps} className={classNames(className, 'figure-img')} />
  ),
);
Image.displayName = 'FigureImage';
Image.defaultProps = { fluid: true };

export const Caption = withBs('figure-caption', {
  Component: 'figcaption',
});

export const Figure = withBs('figure', {
  Component: 'figure',
});
