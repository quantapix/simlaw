import { render } from "@testing-library/react"
import { InputGroup } from "../src/InputGroup.jsx"

describe("<InputGroup>", () => {
  it("Should have div as default component", () => {
    const { getByTestId } = render(<InputGroup data-testid="test" />)
    expect(getByTestId("test").tagName.toLowerCase()).toEqual("div")
  })
  it("Should render size correctly", () => {
    const { getByTestId } = render(<InputGroup size="sm" data-testid="test" />)
    expect(getByTestId("test").classList.contains("input-group-sm")).toBe(true)
  })
  it("Should render hasValidation correctly", () => {
    const { getByTestId } = render(
      <InputGroup hasValidation data-testid="test" />
    )
    expect(getByTestId("test").classList.contains("has-validation")).toBe(true)
  })
  describe("<Checkbox>", () => {
    it("Should forward props to underlying input element", () => {
      const name = "foobar"
      const { getByRole } = render(<InputGroup.Checkbox name={name} />)
      expect(getByRole("checkbox").getAttribute("name")).toEqual(name)
    })
  })
  describe("<Radio>", () => {
    it("Should forward props to underlying input element", () => {
      const name = "foobar"
      const { getByRole } = render(<InputGroup.Radio name={name} />)
      expect(getByRole("radio").getAttribute("name")).toEqual(name)
    })
  })
})
