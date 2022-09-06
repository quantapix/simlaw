import { render } from "@testing-library/react"
import { Spinner } from "../src/Spinner.js"

describe("Spinner", () => {
  it("should render a basic spinner correctly", () => {
    const { getByTestId } = render(
      <Spinner data-testid="test" animation="border" />
    )
    expect(getByTestId("test").classList.contains("spinner-border")).toBe(true)
  })
  it("should render a spinner with a custom element, variant and size ", () => {
    const { getByTestId } = render(
      <Spinner
        data-testid="test"
        as="span"
        animation="grow"
        variant="primary"
        size="sm"
      />
    )
    const y = getByTestId("test")
    expect(y.tagName.toLowerCase()).toEqual("span")
    expect(y.classList.contains("spinner-grow")).toBe(true)
    expect(y.classList.contains("spinner-grow-sm")).toBe(true)
    expect(y.classList.contains("text-primary")).toBe(true)
  })
  it("should render a spinner with other properties", () => {
    const { getByTestId } = render(
      <Spinner data-testid="test" animation="grow" role="status" />
    )
    const y = getByTestId("test")
    expect(y.classList.contains("spinner-grow")).toBe(true)
    expect(y.getAttribute("role")!).toEqual("status")
  })
  it("should render child elements", () => {
    const { getByTestId } = render(
      <Spinner data-testid="test" animation="grow">
        <span id="testChild" />
      </Spinner>
    )
    const y = getByTestId("test")
    expect(y.children.length).toEqual(1)
  })
  it("should have div as default component", () => {
    const { getByTestId } = render(
      <Spinner data-testid="test" animation="border" />
    )
    const y = getByTestId("test")
    expect(y.tagName.toLowerCase()).toEqual("div")
  })
})
