import * as React from "react"
import FormCheck, { FormCheckProps } from "./Form"
import { BsPrefixRefForwardingComponent } from "./utils"
type SwitchProps = Omit<FormCheckProps, "type">
export const Switch: BsPrefixRefForwardingComponent<typeof FormCheck, SwitchProps> =
  React.forwardRef<typeof FormCheck, SwitchProps>((ps, ref) => (
    <FormCheck {...ps} ref={ref} type="switch" />
  ))
Switch.displayName = "Switch"
Switch.Input = FormCheck.Input
Switch.Label = FormCheck.Label
