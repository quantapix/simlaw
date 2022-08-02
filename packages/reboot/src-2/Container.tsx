import classNames from 'classnames';
import * as React from 'react';
import { useBootstrapPrefix } from './ThemeProvider';
import { BsProps, BsPrefixRefForwardingComponent } from './helpers';

export interface Props extends BsProps, React.HTMLAttributes<HTMLElement> {
  fluid?: boolean | string | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
}

export const Container: BsPrefixRefForwardingComponent<'div', Props> =
  React.forwardRef<HTMLElement, Props>(
    ({ bsPrefix, fluid, as: Component = 'div', className, ...ps }, ref) => {
      const bs = useBootstrapPrefix(bsPrefix, 'container');
      const suff = typeof fluid === 'string' ? `-${fluid}` : '-fluid';
      return (
        <Component
          ref={ref}
          {...ps}
          className={classNames(className, fluid ? `${bs}${suff}` : bs)}
        />
      );
    },
  );

Container.displayName = 'Container';
Container.defaultProps = {
  fluid: false,
};
