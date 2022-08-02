import classNames from 'classnames';
import * as React from 'react';
import { useContext } from 'react';
import { useBootstrapPrefix } from './ThemeProvider';
import { BsOnlyProps, BsPrefixRefForwardingComponent } from './helpers';
import FormContext from './FormContext';

export interface FormSelectProps
  extends BsOnlyProps,
    Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  htmlSize?: number;
  size?: 'sm' | 'lg';
  isValid?: boolean;
  isInvalid?: boolean;
}

const FormSelect: BsPrefixRefForwardingComponent<'select', FormSelectProps> =
  React.forwardRef<HTMLSelectElement, FormSelectProps>(
    (
      {
        bsPrefix,
        size,
        htmlSize,
        className,
        isValid = false,
        isInvalid = false,
        id,
        ...props
      },
      ref,
    ) => {
      const { controlId } = useContext(FormContext);
      bsPrefix = useBootstrapPrefix(bsPrefix, 'form-select');

      return (
        <select
          {...props}
          size={htmlSize}
          ref={ref}
          className={classNames(
            className,
            bsPrefix,
            size && `${bsPrefix}-${size}`,
            isValid && `is-valid`,
            isInvalid && `is-invalid`,
          )}
          id={id || controlId}
        />
      );
    },
  );

FormSelect.displayName = 'FormSelect';

export default FormSelect;
