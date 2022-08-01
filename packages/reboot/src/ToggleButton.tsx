import { BsPrefixRefForwardingComponent } from "./utils"
import { map } from "./ElementChildren"
import { useBootstrapPrefix } from "./ThemeProvider"
import { useUncontrolled } from "uncontrollable"
import * as React from "react"
import { Button, ButtonProps } from "./Button"
import { ButtonGroup, ButtonGroupProps } from "./ButtonGroup"
import chainFunction from "./utils"
import classNames from "classnames"
import invariant from "invariant"
export type ToggleButtonType = "checkbox" | "radio"
export interface ToggleButtonProps extends Omit<ButtonProps, "onChange" | "type"> {
  type?: ToggleButtonType
  name?: string
  checked?: boolean
  disabled?: boolean
  onChange?: React.ChangeEventHandler<HTMLInputElement>
  value: string | ReadonlyArray<string> | number
  inputRef?: React.Ref<HTMLInputElement>
}
const noop = () => undefined
export const ToggleButton = React.forwardRef<HTMLLabelElement, ToggleButtonProps>(
  (
    { bsPrefix, name, className, checked, type, onChange, value, disabled, id, inputRef, ...props },
    ref
  ) => {
    bsPrefix = useBootstrapPrefix(bsPrefix, "btn-check")
    return (
      <>
        <input
          className={bsPrefix}
          name={name}
          type={type}
          value={value}
          ref={inputRef}
          autoComplete="off"
          checked={!!checked}
          disabled={!!disabled}
          onChange={onChange || noop}
          id={id}
        />
        <Button
          {...props}
          ref={ref}
          className={classNames(className, disabled && "disabled")}
          type={undefined}
          as="label"
          htmlFor={id}
        />
      </>
    )
  }
)
ToggleButton.displayName = "ToggleButton"
type BaseToggleButtonProps = Omit<ButtonGroupProps, "toggle" | "defaultValue" | "onChange">
export interface ToggleButtonRadioProps<T> extends BaseToggleButtonProps {
  type?: "radio"
  name: string
  value?: T
  defaultValue?: T
  onChange?: (value: T, event: any) => void
}
export interface ToggleButtonCheckboxProps<T> extends BaseToggleButtonProps {
  type: "checkbox"
  name?: string
  value?: T[]
  defaultValue?: T[]
  onChange?: (value: T[]) => void
}
export type ToggleButtonGroupProps<T> = ToggleButtonRadioProps<T> | ToggleButtonCheckboxProps<T>
export const ToggleButtonGroup: BsPrefixRefForwardingComponent<
  "a",
  ToggleButtonGroupProps<any>
> = React.forwardRef<HTMLElement, ToggleButtonGroupProps<any>>((props, ref) => {
  const { children, type, name, value, onChange, ...controlledProps } = useUncontrolled(props, {
    value: "onChange",
  })
  const getValues: () => any[] = () => (value == null ? [] : [].concat(value))
  const handleToggle = (inputVal: any, event: any) => {
    if (!onChange) {
      return
    }
    const values = getValues()
    const isActive = values.indexOf(inputVal) !== -1
    if (type === "radio") {
      if (!isActive && onChange) onChange(inputVal, event)
      return
    }
    if (isActive) {
      onChange(
        values.filter(n => n !== inputVal),
        event
      )
    } else {
      onChange([...values, inputVal], event)
    }
  }
  invariant(
    type !== "radio" || !!name,
    "A `name` is required to group the toggle buttons when the `type` " + 'is set to "radio"'
  )
  return (
    <ButtonGroup {...controlledProps} ref={ref as any}>
      {map(children, child => {
        const values = getValues()
        const { value: childVal, onChange: childOnChange } = child.props
        const handler = e => handleToggle(childVal, e)
        return React.cloneElement(child, {
          type,
          name: (child as any).name || name,
          checked: values.indexOf(childVal) !== -1,
          onChange: chainFunction(childOnChange, handler),
        })
      })}
    </ButtonGroup>
  )
})
ToggleButtonGroup.defaultProps = { type: "radio", vertical: false }
Object.assign(ToggleButtonGroup, { Button: ToggleButton })
