import classNames from 'classnames';
import * as React from 'react';
import { useContext } from 'react';
import { useBootstrapPrefix } from './ThemeProvider';
import { BsOnlyProps } from './helpers';
import FormContext from './FormContext';

export interface FormRangeProps
  extends BsOnlyProps,
    Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {}

const FormRange = React.forwardRef<HTMLInputElement, FormRangeProps>(
  ({ bsPrefix, className, id, ...props }, ref) => {
    const { controlId } = useContext(FormContext);
    bsPrefix = useBootstrapPrefix(bsPrefix, 'form-range');

    return (
      <input
        {...props}
        type="range"
        ref={ref}
        className={classNames(className, bsPrefix)}
        id={id || controlId}
      />
    );
  },
);

FormRange.displayName = 'FormRange';

export default FormRange;
