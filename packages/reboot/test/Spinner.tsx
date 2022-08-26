import { render } from "@testing-library/react"
import { Spinner } from "../src/Spinner.jsx"

describe("<Spinner>", () => {
  it("Should render a basic spinner correctly", () => {
    const { getByTestId } = render(
      <Spinner data-testid="test" animation="border" />
    )
    expect(getByTestId("test").classList.contains("spinner-border")).toBe(true)
  })
  it("Should render a spinner with a custom element, variant and size ", () => {
    const { getByTestId } = render(
      <Spinner
        data-testid="test"
        as="span"
        animation="grow"
        variant="primary"
        size="sm"
      />
    )
    const spinnerElem = getByTestId("test")
    expect(spinnerElem.tagName.toLowerCase()).toEqual("span")
    expect(spinnerElem.classList.contains("spinner-grow")).toBe(true)
    expect(spinnerElem.classList.contains("spinner-grow-sm")).toBe(true)
    expect(spinnerElem.classList.contains("text-primary")).toBe(true)
  })
  it("Should render a spinner with other properties", () => {
    const { getByTestId } = render(
      <Spinner data-testid="test" animation="grow" role="status" />
    )
    const spinnerElem = getByTestId("test")
    expect(spinnerElem.classList.contains("spinner-grow")).toBe(true)
    expect(spinnerElem.getAttribute("role")!).toEqual("status")
  })
  it("Should render child elements", () => {
    const { getByTestId } = render(
      <Spinner data-testid="test" animation="grow">
        <span id="testChild" />
      </Spinner>
    )
    const spinnerElem = getByTestId("test")
    expect(spinnerElem.children.length).toEqual(1)
  })
  it("Should have div as default component", () => {
    const { getByTestId } = render(
      <Spinner data-testid="test" animation="border" />
    )
    const spinnerElem = getByTestId("test")
    expect(spinnerElem.tagName.toLowerCase()).toEqual("div")
  })
})
