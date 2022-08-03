import classNames from 'classnames';
import * as React from 'react';
import { useContext, useMemo } from 'react';
import warning from 'warning';
import Switch from './Switch';
import { useBsPrefix } from './Theme';
import { BsOnlyProps, BsProps, BsRefComponent, AsProp } from './helpers';
import { Col, Props as _Props } from './Col';
import { Feedback, Type } from './Feedback';
import { hasChildOfType } from './utils';
import withBsPrefix from './createWithBsPrefix';

interface ContextType {
  controlId?: any;
}

export const FormContext = React.createContext<ContextType>({});

export interface GroupProps extends React.HTMLAttributes<HTMLElement>, AsProp {
  controlId?: string;
}

export const Floating = withBsPrefix('form-floating');

export const Group: BsRefComponent<'div', GroupProps> = React.forwardRef(
  ({ controlId, as: Component = 'div', ...ps }, ref) => {
    const context = useMemo(() => ({ controlId }), [controlId]);
    return (
      <FormContext.Provider value={context}>
        <Component {...ps} ref={ref} />
      </FormContext.Provider>
    );
  },
);
Group.displayName = 'FormGroup';

export interface FloatingLabelProps extends _Props, BsProps {
  controlId?: string;
  label: React.ReactNode;
}

export const FloatingLabel: BsRefComponent<'div', FloatingLabelProps> =
  React.forwardRef(
    ({ bsPrefix, className, children, controlId, label, ...ps }, ref) => {
      bsPrefix = useBsPrefix(bsPrefix, 'form-floating');
      return (
        <Group
          ref={ref}
          className={classNames(className, bsPrefix)}
          controlId={controlId}
          {...ps}
        >
          {children}
          <label htmlFor={controlId}>{label}</label>
        </Group>
      );
    },
  );
FloatingLabel.displayName = 'FloatingLabel';

interface Base extends BsProps, React.HTMLAttributes<HTMLElement> {
  htmlFor?: string;
  visuallyHidden?: boolean;
}

export interface OwnProps extends Base {
  column?: false;
}

export interface WithColProps extends Base, _Props {
  column: true | 'sm' | 'lg';
}

export type LabelProps = WithColProps | OwnProps;

export const Label: BsRefComponent<'label', LabelProps> = React.forwardRef<
  HTMLElement,
  LabelProps
>(
  (
    {
      as: Component = 'label',
      bsPrefix,
      column,
      visuallyHidden,
      className,
      htmlFor,
      ...ps
    },
    ref,
  ) => {
    const { controlId } = useContext(FormContext);
    const bs = useBsPrefix(bsPrefix, 'form-label');
    let columnClass = 'col-form-label';
    if (typeof column === 'string')
      columnClass = `${columnClass} ${columnClass}-${column}`;
    const classes = classNames(
      className,
      bs,
      visuallyHidden && 'visually-hidden',
      column && columnClass,
    );
    warning(
      controlId == null || !htmlFor,
      '`controlId` is ignored on `<FormLabel>` when `htmlFor` is specified.',
    );
    htmlFor = htmlFor || controlId;
    if (column)
      return (
        <Col
          ref={ref as React.ForwardedRef<HTMLLabelElement>}
          as="label"
          className={classes}
          htmlFor={htmlFor}
          {...ps}
        />
      );
    return (
      <Component ref={ref} className={classes} htmlFor={htmlFor} {...ps} />
    );
  },
);
Label.displayName = 'FormLabel';
Label.defaultProps = {
  column: false,
  visuallyHidden: false,
};

export interface TextProps extends BsProps, React.HTMLAttributes<HTMLElement> {
  muted?: boolean;
}

export const Text: BsRefComponent<'small', TextProps> = React.forwardRef<
  HTMLElement,
  TextProps
>(({ bsPrefix, className, as: Component = 'small', muted, ...ps }, ref) => {
  const bs = useBsPrefix(bsPrefix, 'form-text');
  return (
    <Component
      {...ps}
      ref={ref}
      className={classNames(className, bs, muted && 'text-muted')}
    />
  );
});
Text.displayName = 'FormText';

export interface RangeProps
  extends BsOnlyProps,
    Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {}

export const Range = React.forwardRef<HTMLInputElement, RangeProps>(
  ({ bsPrefix, className, id, ...props }, ref) => {
    const { controlId } = useContext(FormContext);
    const bs = useBsPrefix(bsPrefix, 'form-range');
    return (
      <input
        {...props}
        type="range"
        ref={ref}
        className={classNames(className, bs)}
        id={id || controlId}
      />
    );
  },
);
Range.displayName = 'FormRange';

export interface SelectProps
  extends BsOnlyProps,
    Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  htmlSize?: number;
  size?: 'sm' | 'lg';
  isValid?: boolean;
  isInvalid?: boolean;
}

export const Select: BsRefComponent<'select', SelectProps> = React.forwardRef<
  HTMLSelectElement,
  SelectProps
>(
  (
    {
      bsPrefix,
      size,
      htmlSize,
      className,
      isValid = false,
      isInvalid = false,
      id,
      ...ps
    },
    ref,
  ) => {
    const { controlId } = useContext(FormContext);
    const bs = useBsPrefix(bsPrefix, 'form-select');
    return (
      <select
        {...ps}
        size={htmlSize}
        ref={ref}
        className={classNames(
          className,
          bs,
          size && `${bs}-${size}`,
          isValid && `is-valid`,
          isInvalid && `is-invalid`,
        )}
        id={id || controlId}
      />
    );
  },
);
Select.displayName = 'FormSelect';

type InputType = 'checkbox' | 'radio';

export interface InputProps
  extends BsProps,
    React.InputHTMLAttributes<HTMLInputElement> {
  type?: InputType;
  isValid?: boolean;
  isInvalid?: boolean;
}

export const Input: BsRefComponent<'input', InputProps> = React.forwardRef<
  HTMLInputElement,
  InputProps
>(
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
    const bs = useBsPrefix(bsPrefix, 'form-check-input');
    return (
      <Component
        {...ps}
        ref={ref}
        type={type}
        id={id || controlId}
        className={classNames(
          className,
          bs,
          isValid && 'is-valid',
          isInvalid && 'is-invalid',
        )}
      />
    );
  },
);
Input.displayName = 'FormCheckInput';

export interface CheckLabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement>,
    BsProps {}

export const CheckLabel = React.forwardRef<HTMLLabelElement, CheckLabelProps>(
  ({ bsPrefix, className, htmlFor, ...ps }, ref) => {
    const { controlId } = useContext(FormContext);
    const bs = useBsPrefix(bsPrefix, 'form-check-label');
    return (
      <label // eslint-disable-line jsx-a11y/label-has-associated-control
        {...ps}
        ref={ref}
        htmlFor={htmlFor || controlId}
        className={classNames(className, bs)}
      />
    );
  },
);

CheckLabel.displayName = 'FormCheckLabel';

export type CheckType = 'checkbox' | 'radio' | 'switch';

export interface CheckProps
  extends BsProps,
    React.InputHTMLAttributes<HTMLInputElement> {
  inline?: boolean;
  reverse?: boolean;
  disabled?: boolean;
  label?: React.ReactNode;
  type?: CheckType;
  isValid?: boolean;
  isInvalid?: boolean;
  feedbackTooltip?: boolean;
  feedback?: React.ReactNode;
  feedbackType?: Type;
  bsSwitchPrefix?: string;
}

export const Check: BsRefComponent<'input', CheckProps> = React.forwardRef<
  HTMLInputElement,
  CheckProps
>(
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
      ...ps
    },
    ref,
  ) => {
    const bs = useBsPrefix(bsPrefix, 'form-check');
    bsSwitchPrefix = useBsPrefix(bsSwitchPrefix, 'form-switch');
    const { controlId } = useContext(FormContext);
    const innerFormContext = useMemo(
      () => ({
        controlId: id || controlId,
      }),
      [controlId, id],
    );
    const hasLabel =
      (!children && label != null && label !== false) ||
      hasChildOfType(children, CheckLabel);
    const input = (
      <Input
        {...ps}
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
            hasLabel && bs,
            inline && `${bs}-inline`,
            reverse && `${bs}-reverse`,
            type === 'switch' && bsSwitchPrefix,
          )}
        >
          {children || (
            <>
              {input}
              {hasLabel && <CheckLabel title={title}>{label}</CheckLabel>}
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
Check.displayName = 'FormCheck';

Object.assign(Check, {
  Input,
  Label: CheckLabel,
});

type Element = HTMLInputElement | HTMLTextAreaElement;

export interface ControlProps extends BsProps, React.HTMLAttributes<Element> {
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

export const Control: BsRefComponent<'input', ControlProps> = React.forwardRef<
  Element,
  ControlProps
>(
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
    const bs = useBsPrefix(bsPrefix, 'form-control');
    let classes;
    if (plaintext) {
      classes = { [`${bs}-plaintext`]: true };
    } else {
      classes = {
        [bs]: true,
        [`${bs}-${size}`]: size,
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
          type === 'color' && `${bs}-color`,
        )}
      />
    );
  },
);
Control.displayName = 'FormControl';

Object.assign(Control, { Feedback });

export interface Props
  extends React.FormHTMLAttributes<HTMLFormElement>,
    AsProp {
  validated?: boolean;
}

export const Form: BsRefComponent<'form', Props> = React.forwardRef<
  HTMLFormElement,
  Props
>(({ className, validated, as: Component = 'form', ...props }, ref) => (
  <Component
    {...props}
    ref={ref}
    className={classNames(className, validated && 'was-validated')}
  />
));

Form.displayName = 'Form';

Object.assign(Form, {
  Group,
  Control,
  Floating,
  Check,
  Switch,
  Label,
  Text,
  Range,
  Select,
  FloatingLabel,
});