import { classNames, BsProps, BsRef } from "./helpers.js"
import { Input } from "./Form.jsx"
import { useBs } from "./Theme.jsx"
import { withBs } from "./utils.jsx"
import * as qr from "react"

export const Context = qr.createContext<unknown | null>(null)
Context.displayName = "InputGroupContext"

export const Text = withBs("input-group-text", {
  Component: "span",
})

export const Checkbox = (ps: any) => (
  <Text>
    <Input type="checkbox" {...ps} />
  </Text>
)

export const Radio = (ps: any) => (
  <Text>
    <Input type="radio" {...ps} />
  </Text>
)

export interface Props extends BsProps, qr.HTMLAttributes<HTMLElement> {
  size?: "sm" | "lg"
  hasValidation?: boolean
}

export const InputGroup: BsRef<"div", Props> = qr.forwardRef<
  HTMLElement,
  Props
>(({ bsPrefix, size, hasValidation, className, as: X = "div", ...ps }, ref) => {
  const bs = useBs(bsPrefix, "input-group")
  const v = qr.useMemo(() => ({}), [])
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
