import classNames from 'classnames';
import * as React from 'react';
import { useContext, useMemo } from 'react';
import Feedback, { Type } from './Feedback';
import { FormCheckInput } from './FormCheckInput';
import { FormCheckLabel } from './FormCheckLabel';
import { FormContext } from './FormContext';
import { useBootstrapPrefix } from './ThemeProvider';
import { BsProps, BsPrefixRefForwardingComponent } from './helpers';
import { hasChildOfType } from './utils';

export type FormCheckType = 'checkbox' | 'radio' | 'switch';

export interface Props
  extends BsProps,
    React.InputHTMLAttributes<HTMLInputElement> {
  inline?: boolean;
  reverse?: boolean;
  disabled?: boolean;
  label?: React.ReactNode;
  type?: FormCheckType;
  isValid?: boolean;
  isInvalid?: boolean;
  feedbackTooltip?: boolean;
  feedback?: React.ReactNode;
  feedbackType?: Type;
  bsSwitchPrefix?: string;
}

export const FormCheck: BsPrefixRefForwardingComponent<'input', Props> =
  React.forwardRef<HTMLInputElement, Props>(
    (
      {
        id,
        bsPrefix,
        bsSwitchPrefix,
        inline = false,
        reverse = false,
        disabled = false,
        isValid = false,
        isInvalid = false,
        feedbackTooltip = false,
        feedback,
        feedbackType,
        className,
        style,
        title = '',
        type = 'checkbox',
        label,
        children,
        as = 'input',
        ...props
      },
      ref,
    ) => {
      bsPrefix = useBootstrapPrefix(bsPrefix, 'form-check');
      bsSwitchPrefix = useBootstrapPrefix(bsSwitchPrefix, 'form-switch');

      const { controlId } = useContext(FormContext);
      const innerFormContext = useMemo(
        () => ({
          controlId: id || controlId,
        }),
        [controlId, id],
      );

      const hasLabel =
        (!children && label != null && label !== false) ||
        hasChildOfType(children, FormCheckLabel);

      const input = (
        <FormCheckInput
          {...props}
          type={type === 'switch' ? 'checkbox' : type}
          ref={ref}
          isValid={isValid}
          isInvalid={isInvalid}
          disabled={disabled}
          as={as}
        />
      );

      return (
        <FormContext.Provider value={innerFormContext}>
          <div
            style={style}
            className={classNames(
              className,
              hasLabel && bsPrefix,
              inline && `${bsPrefix}-inline`,
              reverse && `${bsPrefix}-reverse`,
              type === 'switch' && bsSwitchPrefix,
            )}
          >
            {children || (
              <>
                {input}
                {hasLabel && (
                  <FormCheckLabel title={title}>{label}</FormCheckLabel>
                )}
                {feedback && (
                  <Feedback type={feedbackType} tooltip={feedbackTooltip}>
                    {feedback}
                  </Feedback>
                )}
              </>
            )}
          </div>
        </FormContext.Provider>
      );
    },
  );

FormCheck.displayName = 'FormCheck';

Object.assign(FormCheck, {
  Input: FormCheckInput,
  Label: FormCheckLabel,
});
