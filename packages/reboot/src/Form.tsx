import { AsProp, BsPrefixRefForwardingComponent } from "./utils"
import { BsPrefixProps, BsPrefixOnlyProps } from "./utils"
import { useBootstrapPrefix } from "./ThemeProvider"
import { useContext, useMemo } from "react"
import * as React from "react"
import classNames from "classnames"
import { Col, ColProps } from "./Col"
import createWithBsPrefix from "./utils"
import { Feedback, FeedbackType } from "./Feedback"
import { FloatingLabel } from "./FloatingLabel"
import { Switch } from "./Switch"
import warning from "warning"

export const FormFloating = createWithBsPrefix("form-floating")
type FormCheckInputType = "checkbox" | "radio"
export interface FormCheckInputProps
  extends BsPrefixProps,
    React.InputHTMLAttributes<HTMLInputElement> {
  type?: FormCheckInputType
  isValid?: boolean
  isInvalid?: boolean
}
export const FormCheckInput: BsPrefixRefForwardingComponent<"input", FormCheckInputProps> =
  React.forwardRef<HTMLInputElement, FormCheckInputProps>(
    (
      {
        id,
        bsPrefix,
        className,
        type = "checkbox",
        isValid = false,
        isInvalid = false,
        as: Component = "input",
        ...ps
      },
      ref
    ) => {
      const { controlId } = useContext(FormContext)
      bsPrefix = useBootstrapPrefix(bsPrefix, "form-check-input")
      return (
        <Component
          {...ps}
          ref={ref}
          type={type}
          id={id || controlId}
          className={classNames(
            className,
            bsPrefix,
            isValid && "is-valid",
            isInvalid && "is-invalid"
          )}
        />
      )
    }
  )
FormCheckInput.displayName = "FormCheckInput"
export interface FormCheckLabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement>,
    BsPrefixProps {}
export const FormCheckLabel = React.forwardRef<HTMLLabelElement, FormCheckLabelProps>(
  ({ bsPrefix, className, htmlFor, ...ps }, ref) => {
    const { controlId } = useContext(FormContext)
    bsPrefix = useBootstrapPrefix(bsPrefix, "form-check-label")
    return (
      <label
        {...ps}
        ref={ref}
        htmlFor={htmlFor || controlId}
        className={classNames(className, bsPrefix)}
      />
    )
  }
)
FormCheckLabel.displayName = "FormCheckLabel"
export type FormCheckType = "checkbox" | "radio" | "switch"
export interface FormCheckProps extends BsPrefixProps, React.InputHTMLAttributes<HTMLInputElement> {
  inline?: boolean
  disabled?: boolean
  label?: React.ReactNode
  type?: FormCheckType
  isValid?: boolean
  isInvalid?: boolean
  feedbackTooltip?: boolean
  feedback?: React.ReactNode
  feedbackType?: FeedbackType
  bsSwitchPrefix?: string
}
export const FormCheck: BsPrefixRefForwardingComponent<"input", FormCheckProps> = React.forwardRef<
  HTMLInputElement,
  FormCheckProps
>(
  (
    {
      id,
      bsPrefix,
      bsSwitchPrefix,
      inline = false,
      disabled = false,
      isValid = false,
      isInvalid = false,
      feedbackTooltip = false,
      feedback,
      feedbackType,
      className,
      style,
      title = "",
      type = "checkbox",
      label,
      children,
      as = "input",
      ...ps
    },
    ref
  ) => {
    bsPrefix = useBootstrapPrefix(bsPrefix, "form-check")
    bsSwitchPrefix = useBootstrapPrefix(bsSwitchPrefix, "form-switch")
    const { controlId } = useContext(FormContext)
    const innerFormContext = useMemo(
      () => ({
        controlId: id || controlId,
      }),
      [controlId, id]
    )
    const hasLabel = label != null && label !== false && !children
    const input = (
      <FormCheckInput
        {...ps}
        type={type === "switch" ? "checkbox" : type}
        ref={ref}
        isValid={isValid}
        isInvalid={isInvalid}
        disabled={disabled}
        as={as}
      />
    )
    return (
      <FormContext.Provider value={innerFormContext}>
        <div
          style={style}
          className={classNames(
            className,
            label && bsPrefix,
            inline && `${bsPrefix}-inline`,
            type === "switch" && bsSwitchPrefix
          )}
        >
          {children || (
            <>
              {input}
              {hasLabel && <FormCheckLabel title={title}>{label}</FormCheckLabel>}
              {feedback && (
                <Feedback type={feedbackType} tooltip={feedbackTooltip}>
                  {feedback}
                </Feedback>
              )}
            </>
          )}
        </div>
      </FormContext.Provider>
    )
  }
)
FormCheck.displayName = "FormCheck"
Object.assign(FormCheck, {
  Input: FormCheckInput,
  Label: FormCheckLabel,
})
export interface FormContextType {
  controlId?: any
}
export const FormContext = React.createContext<FormContextType>({})
type FormControlElement = HTMLInputElement | HTMLTextAreaElement
export interface FormControlProps extends BsPrefixProps, React.HTMLAttributes<FormControlElement> {
  htmlSize?: number
  size?: "sm" | "lg"
  plaintext?: boolean
  readOnly?: boolean
  disabled?: boolean
  value?: string | string[] | number
  onChange?: React.ChangeEventHandler<FormControlElement>
  type?: string
  isValid?: boolean
  isInvalid?: boolean
}
export const FormControl: BsPrefixRefForwardingComponent<"input", FormControlProps> =
  React.forwardRef<FormControlElement, FormControlProps>(
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
        as: Component = "input",
        ...props
      },
      ref
    ) => {
      const { controlId } = useContext(FormContext)
      bsPrefix = useBootstrapPrefix(bsPrefix, "form-control")
      let classes
      if (plaintext) {
        classes = { [`${bsPrefix}-plaintext`]: true }
      } else {
        classes = {
          [bsPrefix]: true,
          [`${bsPrefix}-${size}`]: size,
        }
      }
      warning(
        controlId == null || !id,
        "`controlId` is ignored on `<FormControl>` when `id` is specified."
      )
      return (
        <Component
          {...props}
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
            type === "color" && `${bsPrefix}-color`
          )}
        />
      )
    }
  )
FormControl.displayName = "FormControl"
Object.assign(FormControl, { Feedback })
export interface FormGroupProps extends React.HTMLAttributes<HTMLElement>, AsProp {
  controlId?: string
}
export const FormGroup: BsPrefixRefForwardingComponent<"div", FormGroupProps> = React.forwardRef(
  ({ controlId, as: Component = "div", ...ps }, ref) => {
    const context = useMemo(() => ({ controlId }), [controlId])
    return (
      <FormContext.Provider value={context}>
        <Component {...ps} ref={ref} />
      </FormContext.Provider>
    )
  }
)
FormGroup.displayName = "FormGroup"
interface FormLabelBaseProps extends BsPrefixProps, React.HTMLAttributes<HTMLElement> {
  htmlFor?: string
  visuallyHidden?: boolean
}
export interface FormLabelOwnProps extends FormLabelBaseProps {
  column?: false
}
export interface FormLabelWithColProps extends FormLabelBaseProps, ColProps {
  column: true | "sm" | "lg"
}
export type FormLabelProps = FormLabelWithColProps | FormLabelOwnProps
export const FormLabel: BsPrefixRefForwardingComponent<"label", FormLabelProps> = React.forwardRef<
  HTMLElement,
  FormLabelProps
>(
  (
    { as: Component = "label", bsPrefix, column, visuallyHidden, className, htmlFor, ...ps },
    ref
  ) => {
    const { controlId } = useContext(FormContext)
    bsPrefix = useBootstrapPrefix(bsPrefix, "form-label")
    let columnClass = "col-form-label"
    if (typeof column === "string") columnClass = `${columnClass} ${columnClass}-${column}`
    const classes = classNames(
      className,
      bsPrefix,
      visuallyHidden && "visually-hidden",
      column && columnClass
    )
    warning(
      controlId == null || !htmlFor,
      "`controlId` is ignored on `<FormLabel>` when `htmlFor` is specified."
    )
    htmlFor = htmlFor || controlId
    if (column)
      return (
        <Col
          ref={ref as React.ForwardedRef<HTMLLabelElement>}
          as="label"
          className={classes}
          htmlFor={htmlFor}
          {...ps}
        />
      )
    return <Component ref={ref} className={classes} htmlFor={htmlFor} {...ps} />
  }
)
FormLabel.displayName = "FormLabel"
FormLabel.defaultProps = { column: false, visuallyHidden: false }
export interface FormRangeProps
  extends BsPrefixOnlyProps,
    Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {}
export const FormRange = React.forwardRef<HTMLInputElement, FormRangeProps>(
  ({ bsPrefix, className, id, ...ps }, ref) => {
    const { controlId } = useContext(FormContext)
    bsPrefix = useBootstrapPrefix(bsPrefix, "form-range")
    return (
      <input
        {...ps}
        type="range"
        ref={ref}
        className={classNames(className, bsPrefix)}
        id={id || controlId}
      />
    )
  }
)
FormRange.displayName = "FormRange"
export interface FormSelectProps
  extends BsPrefixOnlyProps,
    React.HTMLAttributes<HTMLSelectElement> {
  htmlSize?: number
  size?: "sm" | "lg"
  isValid?: boolean
  isInvalid?: boolean
}
export const FormSelect: BsPrefixRefForwardingComponent<"select", FormSelectProps> =
  React.forwardRef<HTMLSelectElement, FormSelectProps>(
    (
      { bsPrefix, size, htmlSize, className, isValid = false, isInvalid = false, id, ...ps },
      ref
    ) => {
      const { controlId } = useContext(FormContext)
      bsPrefix = useBootstrapPrefix(bsPrefix, "form-select")
      return (
        <select
          {...ps}
          size={htmlSize}
          ref={ref}
          className={classNames(
            className,
            bsPrefix,
            size && `${bsPrefix}-${size}`,
            isValid && `is-valid`,
            isInvalid && `is-invalid`
          )}
          id={id || controlId}
        />
      )
    }
  )
FormSelect.displayName = "FormSelect"
export interface FormTextProps extends BsPrefixProps, React.HTMLAttributes<HTMLElement> {
  muted?: boolean
}
export const FormText: BsPrefixRefForwardingComponent<"small", FormTextProps> = React.forwardRef<
  HTMLElement,
  FormTextProps
>(({ bsPrefix, className, as: Component = "small", muted, ...ps }, ref) => {
  bsPrefix = useBootstrapPrefix(bsPrefix, "form-text")
  return (
    <Component
      {...ps}
      ref={ref}
      className={classNames(className, bsPrefix, muted && "text-muted")}
    />
  )
})
FormText.displayName = "FormText"
export interface FormProps extends React.FormHTMLAttributes<HTMLFormElement>, AsProp {
  validated?: boolean
}
export const Form: BsPrefixRefForwardingComponent<"form", FormProps> = React.forwardRef<
  HTMLFormElement,
  FormProps
>(({ className, validated, as: Component = "form", ...ps }, ref) => (
  <Component {...ps} ref={ref} className={classNames(className, validated && "was-validated")} />
))
Form.displayName = "Form"
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
})
