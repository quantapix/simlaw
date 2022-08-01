import { BsPrefixProps, BsPrefixRefForwardingComponent } from "./utils"
import { useBootstrapPrefix } from "./ThemeProvider"
import * as React from "react"
import classNames from "classnames"
import FormGroup, { FormGroupProps } from "./Form"
export interface FloatingLabelProps extends FormGroupProps, BsPrefixProps {
  controlId?: string
  label: React.ReactNode
}
export const FloatingLabel: BsPrefixRefForwardingComponent<"div", FloatingLabelProps> =
  React.forwardRef(({ bsPrefix, className, children, controlId, label, ...ps }, ref) => {
    bsPrefix = useBootstrapPrefix(bsPrefix, "form-floating")
    return (
      <FormGroup
        ref={ref}
        className={classNames(className, bsPrefix)}
        controlId={controlId}
        {...ps}
      >
        {children}
        <label htmlFor={controlId}>{label}</label>
      </FormGroup>
    )
  })
FloatingLabel.displayName = "FloatingLabel"
