import classNames from 'classnames';
import * as React from 'react';
import FormCheck from './FormCheck';
import FormControl from './FormControl';
import FormFloating from './FormFloating';
import FormGroup from './FormGroup';
import { FormLabel } from './FormLabel';
import FormRange from './FormRange';
import FormSelect from './FormSelect';
import FormText from './FormText';
import Switch from './Switch';
import FloatingLabel from './FloatingLabel';
import { BsPrefixRefForwardingComponent, AsProp } from './helpers';

export interface Props
  extends React.FormHTMLAttributes<HTMLFormElement>,
    AsProp {
  validated?: boolean;
}

export const Form: BsPrefixRefForwardingComponent<'form', Props> =
  React.forwardRef<HTMLFormElement, Props>(
    ({ className, validated, as: Component = 'form', ...props }, ref) => (
      <Component
        {...props}
        ref={ref}
        className={classNames(className, validated && 'was-validated')}
      />
    ),
  );

Form.displayName = 'Form';

Object.assign(Form, {
  Group: FormGroup,
  Control: FormControl,
  Floating: FormFloating,
  Check: FormCheck,
  Switch,
  Label: FormLabel,
  Text: FormText,
  Range: FormRange,
  Select: FormSelect,
  FloatingLabel,
});
