import classNames from 'classnames';
import * as React from 'react';
import { FormGroup, Props as _Props } from './FormGroup';
import { BsProps, BsPrefixRefForwardingComponent } from './helpers';
import { useBootstrapPrefix } from './ThemeProvider';

export interface Props extends _Props, BsProps {
  controlId?: string;
  label: React.ReactNode;
}

export const FloatingLabel: BsPrefixRefForwardingComponent<'div', Props> =
  React.forwardRef(
    ({ bsPrefix, className, children, controlId, label, ...ps }, ref) => {
      bsPrefix = useBootstrapPrefix(bsPrefix, 'form-floating');
      return (
        <FormGroup
          ref={ref}
          className={classNames(className, bsPrefix)}
          controlId={controlId}
          {...ps}
        >
          {children}
          <label htmlFor={controlId}>{label}</label>
        </FormGroup>
      );
    },
  );

FloatingLabel.displayName = 'FloatingLabel';
