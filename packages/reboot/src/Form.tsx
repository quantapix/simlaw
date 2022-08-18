import * as React from "react"
import { useContext, useMemo } from "react"
import warning from "warning"
import { useBs } from "./Theme.jsx"
import {
  classNames,
  BsOnlyProps,
  BsProps,
  BsRefComp,
  AsProp,
} from "./helpers.js"
import { Col, Props as _Props } from "./Col.jsx"
import { Feedback, Type } from "./Feedback"
import { hasChildOfType, withBs } from "./utils.jsx"

interface Data {
  controlId?: any
}

export const FormContext = React.createContext<Data>({})

export interface GroupProps extends React.HTMLAttributes<HTMLElement>, AsProp {
  controlId?: string
}

export const Floating = withBs("form-floating")

export const Group: BsRefComp<"div", GroupProps> = React.forwardRef(
  ({ controlId, as: X = "div", ...ps }, ref) => {
    const v = useMemo(() => ({ controlId }), [controlId])
    return (
      <FormContext.Provider value={v}>
        <X {...ps} ref={ref} />
      </FormContext.Provider>
    )
  }
)
Group.displayName = "FormGroup"

export interface FloatingLabelProps extends _Props, BsProps {
  controlId?: string
  label: React.ReactNode
}

export const FloatingLabel: BsRefComp<"div", FloatingLabelProps> =
  React.forwardRef(
    ({ bsPrefix, className, children, controlId, label, ...ps }, ref) => {
      bsPrefix = useBs(bsPrefix, "form-floating")
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
      )
    }
  )
FloatingLabel.displayName = "FloatingLabel"

interface Base extends BsProps, React.HTMLAttributes<HTMLElement> {
  htmlFor?: string
  visuallyHidden?: boolean
}

export interface OwnProps extends Base {
  column?: false
}

export interface WithColProps extends Base, _Props {
  column: true | "sm" | "lg"
}

export type LabelProps = WithColProps | OwnProps

export const Label: BsRefComp<"label", LabelProps> = React.forwardRef<
  HTMLElement,
  LabelProps
>(
  (
    {
      as: X = "label",
      bsPrefix,
      column,
      visuallyHidden,
      className,
      htmlFor,
      ...ps
    },
    ref
  ) => {
    const { controlId } = useContext(FormContext)
    const bs = useBs(bsPrefix, "form-label")
    let columnClass = "col-form-label"
    if (typeof column === "string")
      columnClass = `${columnClass} ${columnClass}-${column}`
    const classes = classNames(
      className,
      bs,
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
    return <X ref={ref} className={classes} htmlFor={htmlFor} {...ps} />
  }
)
Label.displayName = "FormLabel"
Label.defaultProps = {
  column: false,
  visuallyHidden: false,
}

export interface TextProps extends BsProps, React.HTMLAttributes<HTMLElement> {
  muted?: boolean
}

export const Text: BsRefComp<"small", TextProps> = React.forwardRef<
  HTMLElement,
  TextProps
>(({ bsPrefix, className, as: X = "small", muted, ...ps }, ref) => {
  const bs = useBs(bsPrefix, "form-text")
  return (
    <X
      {...ps}
      ref={ref}
      className={classNames(className, bs, muted && "text-muted")}
    />
  )
})
Text.displayName = "FormText"

export interface RangeProps
  extends BsOnlyProps,
    Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {}

export const Range = React.forwardRef<HTMLInputElement, RangeProps>(
  ({ bsPrefix, className, id, ...props }, ref) => {
    const { controlId } = useContext(FormContext)
    const bs = useBs(bsPrefix, "form-range")
    return (
      <input
        {...props}
        type="range"
        ref={ref}
        className={classNames(className, bs)}
        id={id || controlId}
      />
    )
  }
)
Range.displayName = "FormRange"

export interface SelectProps
  extends BsOnlyProps,
    Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  htmlSize?: number
  size?: "sm" | "lg"
  isValid?: boolean
  isInvalid?: boolean
}

export const Select: BsRefComp<"select", SelectProps> = React.forwardRef<
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
    ref
  ) => {
    const { controlId } = useContext(FormContext)
    const bs = useBs(bsPrefix, "form-select")
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
          isInvalid && `is-invalid`
        )}
        id={id || controlId}
      />
    )
  }
)
Select.displayName = "FormSelect"

type InputType = "checkbox" | "radio"

export interface InputProps
  extends BsProps,
    React.InputHTMLAttributes<HTMLInputElement> {
  type?: InputType
  isValid?: boolean
  isInvalid?: boolean
}

export const Input: BsRefComp<"input", InputProps> = React.forwardRef<
  HTMLInputElement,
  InputProps
>(
  (
    {
      id,
      bsPrefix,
      className,
      type = "checkbox",
      isValid = false,
      isInvalid = false,
      as: X = "input",
      ...ps
    },
    ref
  ) => {
    const { controlId } = useContext(FormContext)
    const bs = useBs(bsPrefix, "form-check-input")
    return (
      <X
        {...ps}
        ref={ref}
        type={type}
        id={id || controlId}
        className={classNames(
          className,
          bs,
          isValid && "is-valid",
          isInvalid && "is-invalid"
        )}
      />
    )
  }
)
Input.displayName = "FormCheckInput"

export interface CheckLabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement>,
    BsProps {}

export const CheckLabel = React.forwardRef<HTMLLabelElement, CheckLabelProps>(
  ({ bsPrefix, className, htmlFor, ...ps }, ref) => {
    const { controlId } = useContext(FormContext)
    const bs = useBs(bsPrefix, "form-check-label")
    return (
      <label
        {...ps}
        ref={ref}
        htmlFor={htmlFor || controlId}
        className={classNames(className, bs)}
      />
    )
  }
)

CheckLabel.displayName = "FormCheckLabel"

export type CheckType = "checkbox" | "radio" | "switch"

export interface CheckProps
  extends BsProps,
    React.InputHTMLAttributes<HTMLInputElement> {
  inline?: boolean
  reverse?: boolean
  disabled?: boolean
  label?: React.ReactNode
  type?: CheckType
  isValid?: boolean
  isInvalid?: boolean
  feedbackTooltip?: boolean
  feedback?: React.ReactNode
  feedbackType?: Type
  bsSwitchPrefix?: string
}

export const Check: BsRefComp<"input", CheckProps> = React.forwardRef<
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
      title = "",
      type = "checkbox",
      label,
      children,
      as = "input",
      ...ps
    },
    ref
  ) => {
    const bs = useBs(bsPrefix, "form-check")
    bsSwitchPrefix = useBs(bsSwitchPrefix, "form-switch")
    const { controlId } = useContext(FormContext)
    const v = useMemo(
      () => ({
        controlId: id || controlId,
      }),
      [controlId, id]
    )
    const hasLabel =
      (!children && label != null && label !== false) ||
      hasChildOfType(children, CheckLabel)
    const input = (
      <Input
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
      <FormContext.Provider value={v}>
        <div
          style={style}
          className={classNames(
            className,
            hasLabel && bs,
            inline && `${bs}-inline`,
            reverse && `${bs}-reverse`,
            type === "switch" && bsSwitchPrefix
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
    )
  }
)
Check.displayName = "FormCheck"

export type SwitchProps = Omit<CheckProps, "type">

export const Switch: BsRefComp<typeof Check, SwitchProps> = React.forwardRef<
  typeof Check,
  SwitchProps
>((ps, ref) => <Check {...ps} ref={ref} type="switch" />)
Switch.displayName = "Switch"

type Element = HTMLInputElement | HTMLTextAreaElement

export interface ControlProps extends BsProps, React.HTMLAttributes<Element> {
  htmlSize?: number
  size?: "sm" | "lg"
  plaintext?: boolean
  readOnly?: boolean
  disabled?: boolean
  value?: string | string[] | number
  onChange?: React.ChangeEventHandler<Element>
  type?: string
  isValid?: boolean
  isInvalid?: boolean
}

export const Control: BsRefComp<"input", ControlProps> = React.forwardRef<
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
      as: X = "input",
      ...ps
    },
    ref
  ) => {
    const { controlId } = useContext(FormContext)
    const bs = useBs(bsPrefix, "form-control")
    let classes
    if (plaintext) {
      classes = { [`${bs}-plaintext`]: true }
    } else {
      classes = {
        [bs]: true,
        [`${bs}-${size}`]: size,
      }
    }
    warning(
      controlId == null || !id,
      "`controlId` is ignored on `<FormControl>` when `id` is specified."
    )
    return (
      <X
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
          type === "color" && `${bs}-color`
        )}
      />
    )
  }
)
Control.displayName = "FormControl"

export interface Props
  extends React.FormHTMLAttributes<HTMLFormElement>,
    AsProp {
  validated?: boolean
}

export const Form: BsRefComp<"form", Props> = React.forwardRef<
  HTMLFormElement,
  Props
>(({ className, validated, as: X = "form", ...props }, ref) => (
  <X
    {...props}
    ref={ref}
    className={classNames(className, validated && "was-validated")}
  />
))

Form.displayName = "Form"
