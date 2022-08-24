import { classNames, invariant, BsRef } from "./helpers.js"
import { map, createChained } from "./utils.jsx"
import { useBs } from "./Theme.jsx"
import * as qh from "./hooks.js"
import * as qr from "react"
import {
  Button as B,
  Props as BPs,
  Group as G,
  GroupProps as GPs,
} from "./Button.jsx"

export type Type = "checkbox" | "radio"

export interface Props extends Omit<BPs, "onChange" | "type"> {
  type?: Type
  name?: string
  checked?: boolean
  disabled?: boolean
  onChange?: qr.ChangeEventHandler<HTMLInputElement>
  value: string | ReadonlyArray<string> | number
  inputRef?: qr.Ref<HTMLInputElement>
}

export const Button = qr.forwardRef<HTMLLabelElement, Props>(
  (
    {
      bsPrefix,
      name,
      className,
      checked,
      type,
      onChange,
      value,
      disabled,
      id,
      inputRef,
      ...ps
    },
    ref
  ) => {
    const bs = useBs(bsPrefix, "btn-check")
    return (
      <>
        <input
          className={bs}
          name={name}
          type={type}
          value={value}
          ref={inputRef}
          autoComplete="off"
          checked={!!checked}
          disabled={!!disabled}
          onChange={onChange || qh.noop}
          id={id}
        />
        <B
          {...ps}
          ref={ref}
          className={classNames(className, disabled && "disabled")}
          type={undefined}
          role={undefined}
          as="label"
          htmlFor={id}
        />
      </>
    )
  }
)
Button.displayName = "ToggleButton"

type Base = Omit<GPs, "toggle" | "defaultValue" | "onChange">

export interface RadioProps<T> extends Base {
  type?: "radio"
  name: string
  value?: T
  defaultValue?: T
  onChange?: (value: T, e: any) => void
}

export interface CheckboxProps<T> extends Base {
  type: "checkbox"
  name?: string
  value?: T[]
  defaultValue?: T[]
  onChange?: (value: T[]) => void
}

export type GroupProps<T> = RadioProps<T> | CheckboxProps<T>

export const Group: BsRef<"a", GroupProps<any>> = qr.forwardRef<
  HTMLElement,
  GroupProps<any>
>((xs: GroupProps<any>, ref) => {
  const { children, type, name, value, onChange, ...ps } = qh.useUncontrolled(
    xs,
    { value: "onChange" }
  )
  const getValues: () => any[] = () => (value == null ? [] : [].concat(value))
  const toggle = (x: any, e: any) => {
    if (!onChange) {
      return
    }
    const values = getValues()
    const isActive = values.indexOf(x) !== -1
    if (type === "radio") {
      if (!isActive) onChange(x, e)
      return
    }
    if (isActive) {
      onChange(
        values.filter(n => n !== x),
        e
      )
    } else {
      onChange([...values, x], e)
    }
  }
  invariant(
    type !== "radio" || !!name,
    "A `name` is required to group the toggle buttons when the `type` " +
      'is set to "radio"'
  )
  return (
    <G {...ps} ref={ref as any}>
      {map(children, x => {
        const vs = getValues()
        const { value: v, onChange: cb } = x.props
        const cb2 = (e: any) => toggle(v, e)
        return qr.cloneElement(x, {
          type,
          name: (x as any).name || name,
          checked: vs.indexOf(v) !== -1,
          onChange: createChained(cb, cb2),
        })
      })}
    </G>
  )
})
Group.defaultProps = {
  type: "radio",
  vertical: false,
}
