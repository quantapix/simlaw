import classNames from 'classnames';
import * as React from 'react';
import { useContext } from 'react';
import { FormContext } from './FormContext';
import { useBootstrapPrefix } from './ThemeProvider';
import { BsProps, BsPrefixRefForwardingComponent } from './helpers';

type FormCheckInputType = 'checkbox' | 'radio';

export interface Props
  extends BsProps,
    React.InputHTMLAttributes<HTMLInputElement> {
  type?: FormCheckInputType;
  isValid?: boolean;
  isInvalid?: boolean;
}

export const FormCheckInput: BsPrefixRefForwardingComponent<'input', Props> =
  React.forwardRef<HTMLInputElement, Props>(
    (
      {
        id,
        bsPrefix,
        className,
        type = 'checkbox',
        isValid = false,
        isInvalid = false,
        as: Component = 'input',
        ...ps
      },
      ref,
    ) => {
      const { controlId } = useContext(FormContext);
      bsPrefix = useBootstrapPrefix(bsPrefix, 'form-check-input');

      return (
        <Component
          {...ps}
          ref={ref}
          type={type}
          id={id || controlId}
          className={classNames(
            className,
            bsPrefix,
            isValid && 'is-valid',
            isInvalid && 'is-invalid',
          )}
        />
      );
    },
  );

FormCheckInput.displayName = 'FormCheckInput';
