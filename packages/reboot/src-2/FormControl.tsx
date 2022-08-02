import classNames from 'classnames';
import * as React from 'react';
import { useContext } from 'react';
import warning from 'warning';
import Feedback from './Feedback';
import { FormContext } from './FormContext';
import { useBootstrapPrefix } from './ThemeProvider';
import { BsProps, BsPrefixRefForwardingComponent } from './helpers';

type Element = HTMLInputElement | HTMLTextAreaElement;

export interface Props extends BsProps, React.HTMLAttributes<Element> {
  htmlSize?: number;
  size?: 'sm' | 'lg';
  plaintext?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  value?: string | string[] | number;
  onChange?: React.ChangeEventHandler<Element>;
  type?: string;
  isValid?: boolean;
  isInvalid?: boolean;
}

export const FormControl: BsPrefixRefForwardingComponent<'input', Props> =
  React.forwardRef<Element, Props>(
    (
      {
        bsPrefix,
        type,
        size,
        htmlSize,
        id,
        className,
        isValid = false,
        isInvalid = false,
        plaintext,
        readOnly,
        as: Component = 'input',
        ...ps
      },
      ref,
    ) => {
      const { controlId } = useContext(FormContext);
      bsPrefix = useBootstrapPrefix(bsPrefix, 'form-control');
      let classes;
      if (plaintext) {
        classes = { [`${bsPrefix}-plaintext`]: true };
      } else {
        classes = {
          [bsPrefix]: true,
          [`${bsPrefix}-${size}`]: size,
        };
      }

      warning(
        controlId == null || !id,
        '`controlId` is ignored on `<FormControl>` when `id` is specified.',
      );

      return (
        <Component
          {...ps}
          type={type}
          size={htmlSize}
          ref={ref}
          readOnly={readOnly}
          id={id || controlId}
          className={classNames(
            className,
            classes,
            isValid && `is-valid`,
            isInvalid && `is-invalid`,
            type === 'color' && `${bsPrefix}-color`,
          )}
        />
      );
    },
  );

FormControl.displayName = 'FormControl';

Object.assign(FormControl, { Feedback });
