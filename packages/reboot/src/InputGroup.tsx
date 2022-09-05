import { Input } from "./Form.js"
import { useBs } from "./Theme.js"
import { withBs } from "./utils.js"
import * as qr from "react"
import * as qt from "./types.js"

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

export interface Props extends qt.BsProps, qr.HTMLAttributes<HTMLElement> {
  size?: "sm" | "lg"
  hasValidation?: boolean
}

export const InputGroup: qt.BsRef<"div", Props> = qr.forwardRef<
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
        className={qt.classNames(
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
