import { Checkbox, InputGroup, Radio } from "../src/InputGroup.js"
import { render } from "@testing-library/react"

describe("InputGroup", () => {
  it("should have div as default component", () => {
    const { getByTestId } = render(<InputGroup data-testid="test" />)
    expect(getByTestId("test").tagName.toLowerCase()).toEqual("div")
  })
  it("should render size correctly", () => {
    const { getByTestId } = render(<InputGroup size="sm" data-testid="test" />)
    expect(getByTestId("test").classList.contains("input-group-sm")).toBe(true)
  })
  it("should render hasValidation correctly", () => {
    const { getByTestId } = render(
      <InputGroup hasValidation data-testid="test" />
    )
    expect(getByTestId("test").classList.contains("has-validation")).toBe(true)
  })
  describe("Checkbox", () => {
    it("should forward props to underlying input element", () => {
      const name = "foobar"
      const { getByRole } = render(<Checkbox name={name} />)
      expect(getByRole("checkbox").getAttribute("name")).toEqual(name)
    })
  })
  describe("Radio", () => {
    it("should forward props to underlying input element", () => {
      const name = "foobar"
      const { getByRole } = render(<Radio name={name} />)
      expect(getByRole("radio").getAttribute("name")).toEqual(name)
    })
  })
})
