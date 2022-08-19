import { render } from "@testing-library/react"
import { InputGroup } from "../src/InputGroup.jsx"

describe("<InputGroup>", () => {
  test("Should have div as default component", () => {
    const { getByTestId } = render(<InputGroup data-testid="test" />)
    getByTestId("test").tagName.toLowerCase().should.equal("div")
  })
  test("Should render size correctly", () => {
    const { getByTestId } = render(<InputGroup size="sm" data-testid="test" />)
    getByTestId("test").classList.contains("input-group-sm").should.be.true
  })
  test("Should render hasValidation correctly", () => {
    const { getByTestId } = render(
      <InputGroup hasValidation data-testid="test" />
    )
    getByTestId("test").classList.contains("has-validation").should.be.true
  })
  describe("<Checkbox>", () => {
    test("Should forward props to underlying input element", () => {
      const name = "foobar"
      const { getByRole } = render(<InputGroup.Checkbox name={name} />)
      expect(getByRole("checkbox").getAttribute("name")).to.be.equal(name)
    })
  })
  describe("<Radio>", () => {
    test("Should forward props to underlying input element", () => {
      const name = "foobar"
      const { getByRole } = render(<InputGroup.Radio name={name} />)
      expect(getByRole("radio").getAttribute("name")).to.equal(name)
    })
  })
})
