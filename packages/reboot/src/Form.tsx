import { Col, Props as _Props } from "./Col.js"
import { Feedback, Type } from "./Feedback.js"
import { hasChildOfType, withBs } from "./utils.js"
import { useBs } from "./Theme.js"
import { warning } from "./base/utils.js"
import * as qr from "react"
import * as qt from "./types.js"

interface Data {
  controlId?: any
}

export const FormContext = qr.createContext<Data>({})

export interface GroupProps extends qr.HTMLAttributes<HTMLElement>, qt.AsProp {
  controlId?: string | undefined
}

export const Floating = withBs("form-floating")

export const Group: qt.BsRef<"div", GroupProps> = qr.forwardRef(
  ({ controlId, as: X = "div", ...ps }, ref) => {
    const v = qr.useMemo(() => ({ controlId }), [controlId])
    return (
      <FormContext.Provider value={v}>
        <X {...ps} ref={ref} />
      </FormContext.Provider>
    )
  }
)
Group.displayName = "FormGroup"

export interface FloatingLabelProps extends _Props, qt.BsProps {
  controlId?: string
  label: qr.ReactNode
}

export const FloatingLabel: qt.BsRef<"div", FloatingLabelProps> = qr.forwardRef(
  ({ bsPrefix, className, children, controlId, label, ...ps }, ref) => {
    bsPrefix = useBs(bsPrefix, "form-floating")
    return (
      <Group
        ref={ref}
        className={qt.classNames(className, bsPrefix)}
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

interface Base extends qt.BsProps, qr.HTMLAttributes<HTMLElement> {
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

export const Label: qt.BsRef<"label", LabelProps> = qr.forwardRef<
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
    const { controlId } = qr.useContext(FormContext)
    const bs = useBs(bsPrefix, "form-label")
    let columnClass = "col-form-label"
    if (typeof column === "string")
      columnClass = `${columnClass} ${columnClass}-${column}`
    const classes = qt.classNames(
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
          ref={ref as qr.ForwardedRef<HTMLLabelElement>}
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

export interface TextProps extends qt.BsProps, qr.HTMLAttributes<HTMLElement> {
  muted?: boolean
}

export const Text: qt.BsRef<"small", TextProps> = qr.forwardRef<
  HTMLElement,
  TextProps
>(({ bsPrefix, className, as: X = "small", muted, ...ps }, ref) => {
  const bs = useBs(bsPrefix, "form-text")
  return (
    <X
      {...ps}
      ref={ref}
      className={qt.classNames(className, bs, muted && "text-muted")}
    />
  )
})
Text.displayName = "FormText"

export interface RangeProps
  extends qt.BsOnlyProps,
    Omit<qr.InputHTMLAttributes<HTMLInputElement>, "type"> {}

export const Range = qr.forwardRef<HTMLInputElement, RangeProps>(
  ({ bsPrefix, className, id, ...ps }, ref) => {
    const { controlId } = qr.useContext(FormContext)
    const bs = useBs(bsPrefix, "form-range")
    return (
      <input
        {...ps}
        type="range"
        ref={ref}
        className={qt.classNames(className, bs)}
        id={id || controlId}
      />
    )
  }
)
Range.displayName = "FormRange"

export interface SelectProps
  extends qt.BsOnlyProps,
    Omit<qr.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  htmlSize?: number
  size?: "sm" | "lg"
  isValid?: boolean
  isInvalid?: boolean
}

export const Select: qt.BsRef<"select", SelectProps> = qr.forwardRef<
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
    const { controlId } = qr.useContext(FormContext)
    const bs = useBs(bsPrefix, "form-select")
    return (
      <select
        {...ps}
        size={htmlSize}
        ref={ref}
        className={qt.classNames(
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
  extends qt.BsProps,
    qr.InputHTMLAttributes<HTMLInputElement> {
  type?: InputType
  isValid?: boolean
  isInvalid?: boolean
}

export const Input: qt.BsRef<"input", InputProps> = qr.forwardRef<
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
    const { controlId } = qr.useContext(FormContext)
    const bs = useBs(bsPrefix, "form-check-input")
    return (
      <X
        {...ps}
        ref={ref}
        type={type}
        id={id || controlId}
        className={qt.classNames(
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
  extends qr.LabelHTMLAttributes<HTMLLabelElement>,
    qt.BsProps {}

export const CheckLabel = qr.forwardRef<HTMLLabelElement, CheckLabelProps>(
  ({ bsPrefix, className, htmlFor, ...ps }, ref) => {
    const { controlId } = qr.useContext(FormContext)
    const bs = useBs(bsPrefix, "form-check-label")
    return (
      <label
        {...ps}
        ref={ref}
        htmlFor={htmlFor || controlId}
        className={qt.classNames(className, bs)}
      />
    )
  }
)

CheckLabel.displayName = "FormCheckLabel"

export type CheckType = "checkbox" | "radio" | "switch"

export interface CheckProps
  extends qt.BsProps,
    qr.InputHTMLAttributes<HTMLInputElement> {
  inline?: boolean
  reverse?: boolean
  disabled?: boolean
  label?: qr.ReactNode
  type?: CheckType
  isValid?: boolean
  isInvalid?: boolean
  feedbackTooltip?: boolean
  feedback?: qr.ReactNode
  feedbackType?: Type
  bsSwitchPrefix?: string
}

export const Check: qt.BsRef<"input", CheckProps> = qr.forwardRef<
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
    const { controlId } = qr.useContext(FormContext)
    const v = qr.useMemo(
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
          className={qt.classNames(
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

export const Switch: qt.BsRef<typeof Check, SwitchProps> = qr.forwardRef<
  typeof Check,
  SwitchProps
>((ps, ref) => <Check {...ps} ref={ref} type="switch" />)
Switch.displayName = "Switch"

type Element = HTMLInputElement | HTMLTextAreaElement

export interface ControlProps extends qt.BsProps, qr.HTMLAttributes<Element> {
  htmlSize?: number
  size?: "sm" | "lg"
  plaintext?: boolean
  readOnly?: boolean
  disabled?: boolean
  value?: string | string[] | number
  onChange?: qr.ChangeEventHandler<Element>
  type?: string
  isValid?: boolean
  isInvalid?: boolean
}

export const Control: qt.BsRef<"input", ControlProps> = qr.forwardRef<
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
    const { controlId } = qr.useContext(FormContext)
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
        className={qt.classNames(
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
  extends qr.FormHTMLAttributes<HTMLFormElement>,
    qt.AsProp {
  validated?: boolean
}

export const Form: qt.BsRef<"form", Props> = qr.forwardRef<
  HTMLFormElement,
  Props
>(({ className, validated, as: X = "form", ...ps }, ref) => (
  <X
    {...ps}
    ref={ref}
    className={qt.classNames(className, validated && "was-validated")}
  />
))
Form.displayName = "Form"
