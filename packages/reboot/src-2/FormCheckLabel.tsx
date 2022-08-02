import classNames from 'classnames';
import * as React from 'react';
import { useContext } from 'react';
import { FormContext } from './FormContext';
import { useBootstrapPrefix } from './ThemeProvider';
import { BsProps } from './helpers';

export interface Props
  extends React.LabelHTMLAttributes<HTMLLabelElement>,
    BsProps {}

export const FormCheckLabel = React.forwardRef<HTMLLabelElement, Props>(
  ({ bsPrefix, className, htmlFor, ...ps }, ref) => {
    const { controlId } = useContext(FormContext);
    bsPrefix = useBootstrapPrefix(bsPrefix, 'form-check-label');
    return (
      <label // eslint-disable-line jsx-a11y/label-has-associated-control
        {...ps}
        ref={ref}
        htmlFor={htmlFor || controlId}
        className={classNames(className, bsPrefix)}
      />
    );
  },
);

FormCheckLabel.displayName = 'FormCheckLabel';
