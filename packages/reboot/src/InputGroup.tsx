import { BsPrefixProps, BsPrefixRefForwardingComponent } from "./utils"
import { useBootstrapPrefix } from "./ThemeProvider"
import { useMemo } from "react"
import * as React from "react"
import classNames from "classnames"
import createWithBsPrefix from "./utils"
import FormCheckInput from "./Form"
export const InputGroupContext = React.createContext<unknown | null>(null)
InputGroupContext.displayName = "InputGroupContext"

const InputGroupText = createWithBsPrefix("input-group-text", { Component: "span" })
const InputGroupCheckbox = ps => (
  <InputGroupText>
    <FormCheckInput type="checkbox" {...ps} />
  </InputGroupText>
)
const InputGroupRadio = ps => (
  <InputGroupText>
    <FormCheckInput type="radio" {...ps} />
  </InputGroupText>
)
export interface InputGroupProps extends BsPrefixProps, React.HTMLAttributes<HTMLElement> {
  size?: "sm" | "lg"
  hasValidation?: boolean
}
export const InputGroup: BsPrefixRefForwardingComponent<"div", InputGroupProps> = React.forwardRef<
  HTMLElement,
  InputGroupProps
>(({ bsPrefix, size, hasValidation, className, as: Component = "div", ...ps }, ref) => {
  bsPrefix = useBootstrapPrefix(bsPrefix, "input-group")
  const contextValue = useMemo(() => ({}), [])
  return (
    <InputGroupContext.Provider value={contextValue}>
      <Component
        ref={ref}
        {...ps}
        className={classNames(
          className,
          bsPrefix,
          size && `${bsPrefix}-${size}`,
          hasValidation && "has-validation"
        )}
      />
    </InputGroupContext.Provider>
  )
})
InputGroup.displayName = "InputGroup"
Object.assign(InputGroup, {
  Text: InputGroupText,
  Radio: InputGroupRadio,
  Checkbox: InputGroupCheckbox,
})
