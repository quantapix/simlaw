import classNames from 'classnames';

import * as React from 'react';

import { useBootstrapPrefix } from './ThemeProvider';

import { BsProps, BsPrefixRefForwardingComponent } from './helpers';

export interface FormTextProps
  extends BsProps,
    React.HTMLAttributes<HTMLElement> {
  muted?: boolean;
}

const FormText: BsPrefixRefForwardingComponent<'small', FormTextProps> =
  React.forwardRef<HTMLElement, FormTextProps>(
    // Need to define the default "as" during prop destructuring to be compatible with styled-components github.com/react-bootstrap/react-bootstrap/issues/3595
    (
      { bsPrefix, className, as: Component = 'small', muted, ...props },
      ref,
    ) => {
      bsPrefix = useBootstrapPrefix(bsPrefix, 'form-text');

      return (
        <Component
          {...props}
          ref={ref}
          className={classNames(className, bsPrefix, muted && 'text-muted')}
        />
      );
    },
  );

FormText.displayName = 'FormText';

export default FormText;
