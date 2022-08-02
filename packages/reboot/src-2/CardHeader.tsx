import classNames from 'classnames';
import * as React from 'react';
import { useMemo } from 'react';

import { useBootstrapPrefix } from './ThemeProvider';
import CardHeaderContext from './CardHeaderContext';
import { BsProps, BsPrefixRefForwardingComponent } from './helpers';

export interface CardHeaderProps
  extends BsProps,
    React.HTMLAttributes<HTMLElement> {}

const CardHeader: BsPrefixRefForwardingComponent<'div', CardHeaderProps> =
  React.forwardRef<HTMLElement, CardHeaderProps>(
    (
      {
        bsPrefix,
        className,
        // Need to define the default "as" during prop destructuring to be compatible with styled-components github.com/react-bootstrap/react-bootstrap/issues/3595
        as: Component = 'div',
        ...props
      },
      ref,
    ) => {
      const prefix = useBootstrapPrefix(bsPrefix, 'card-header');
      const contextValue = useMemo(
        () => ({
          cardHeaderBsPrefix: prefix,
        }),
        [prefix],
      );

      return (
        <CardHeaderContext.Provider value={contextValue}>
          <Component
            ref={ref}
            {...props}
            className={classNames(className, prefix)}
          />
        </CardHeaderContext.Provider>
      );
    },
  );

CardHeader.displayName = 'CardHeader';

export default CardHeader;
