import { Control, Group } from "../src/Form.js"
import { Feedback } from "../src/Feedback.js"
import { render } from "@testing-library/react"
import React from "react"

describe("Feedback", () => {
  it("should have div as default component", () => {
    const { getByTestId } = render(<Feedback data-testid="test" />)
    expect(getByTestId("test").tagName.toLowerCase()).toEqual("div")
  })
  it("should render valid feedback", () => {
    const { getByTestId } = render(<Feedback type="valid" data-testid="test" />)
    expect(getByTestId("test").classList.contains("valid-feedback")).toBe(true)
  })
  it("should render invalid feedback", () => {
    const { getByTestId } = render(
      <Feedback type="invalid" data-testid="test" />
    )
    expect(getByTestId("test").classList.contains("invalid-feedback")).toBe(
      true
    )
  })
  it("should render valid feedback tooltip", () => {
    const { getByTestId } = render(
      <Feedback type="valid" tooltip data-testid="test" />
    )
    expect(getByTestId("test").classList.contains("valid-tooltip")).toBe(true)
  })
  it("should render invalid feedback tooltip", () => {
    const { getByTestId } = render(
      <Feedback type="invalid" tooltip data-testid="test" />
    )
    expect(getByTestId("test").classList.contains("invalid-tooltip")).toBe(true)
  })
})
describe("Feedback", () => {
  it("should render default success", () => {
    const { getByTestId } = render(
      <Group>
        <Control isValid />
        <Feedback type="valid" data-testid="test-id" />
      </Group>
    )
    const element = getByTestId("test-id")
    expect(element.classList.length).toEqual(1)
    expect(element.classList.contains("valid-feedback")).toBe(true)
  })
  it("should render default error", () => {
    const { getByTestId } = render(
      <Group>
        <Control isInvalid />
        <Feedback type="invalid" data-testid="test-id" />
      </Group>
    )
    const element = getByTestId("test-id")
    expect(element.classList.length).toEqual(1)
    expect(element.classList.contains("invalid-feedback")).toBe(true)
  })
  it("should render custom component", () => {
    class MyComponent extends React.Component {
      override render() {
        return <div id="my-component" {...this.props} />
      }
    }
    const { getByTestId } = render(
      <Feedback as={MyComponent} data-testid="test-id" />
    )
    const element = getByTestId("test-id")
    expect(element.id).toEqual("my-component")
    expect(element.classList.length).toEqual(1)
    expect(element.classList.contains("valid-feedback")).toBe(true)
  })
})
