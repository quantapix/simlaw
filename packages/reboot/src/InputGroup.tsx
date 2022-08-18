import * as React from "react"
import { useMemo } from "react"
import { withBs } from "./utils.jsx"
import { useBs } from "./Theme.jsx"
import { Input } from "./Form.jsx"
import { classNames, BsProps, BsRefComp } from "./helpers.js"

export const Context = React.createContext<unknown | null>(null)
Context.displayName = "InputGroupContext"

export const Text = withBs("input-group-text", {
  Component: "span",
})

export const Checkbox = ps => (
  <Text>
    <Input type="checkbox" {...ps} />
  </Text>
)

export const Radio = ps => (
  <Text>
    <Input type="radio" {...ps} />
  </Text>
)

export interface Props extends BsProps, React.HTMLAttributes<HTMLElement> {
  size?: "sm" | "lg"
  hasValidation?: boolean
}

export const InputGroup: BsRefComp<"div", Props> = React.forwardRef<
  HTMLElement,
  Props
>(({ bsPrefix, size, hasValidation, className, as: X = "div", ...ps }, ref) => {
  const bs = useBs(bsPrefix, "input-group")
  const v = useMemo(() => ({}), [])
  return (
    <Context.Provider value={v}>
      <X
        ref={ref}
        {...ps}
        className={classNames(
          className,
          bs,
          size && `${bs}-${size}`,
          hasValidation && "has-validation"
        )}
      />
    </Context.Provider>
  )
})
InputGroup.displayName = "InputGroup"
