import classNames from 'classnames';
import * as React from 'react';
import { useBootstrapPrefix } from './ThemeProvider';
import { BsProps, BsPrefixRefForwardingComponent } from './helpers';

export interface CarouselItemProps
  extends BsProps,
    React.HTMLAttributes<HTMLElement> {
  interval?: number;
}

const CarouselItem: BsPrefixRefForwardingComponent<'div', CarouselItemProps> =
  React.forwardRef<HTMLElement, CarouselItemProps>(
    (
      {
        // Need to define the default "as" during prop destructuring to be compatible with styled-components github.com/react-bootstrap/react-bootstrap/issues/3595
        as: Component = 'div',
        bsPrefix,
        className,
        ...props
      },
      ref,
    ) => {
      const finalClassName = classNames(
        className,
        useBootstrapPrefix(bsPrefix, 'carousel-item'),
      );
      return <Component ref={ref} {...props} className={finalClassName} />;
    },
  );

CarouselItem.displayName = 'CarouselItem';

export default CarouselItem;
