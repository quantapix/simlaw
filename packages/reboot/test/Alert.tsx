import { Alert, Heading } from "../src/Alert.js"
import { fireEvent, render } from "@testing-library/react"
import { jest } from "@jest/globals"
import * as qr from "react"

describe("Alert", () => {
  it("should output an alert with message", () => {
    const { getByRole } = render(
      <Alert>
        <strong>Message</strong>
      </Alert>
    )
    const y = getByRole("alert")
    expect(y.children.length).toEqual(1)
    expect(y.children[0]!.tagName.toLowerCase()).toEqual("strong")
  })
  it("should have dismissible style", () => {
    const { getByRole } = render(
      <Alert dismissible>
        <strong>Message</strong>
      </Alert>
    )
    const y = getByRole("alert")
    expect(y.classList.contains("alert-dismissible")).toBe(true)
  })
  it("should call onClose on dismiss click", () => {
    const mock = jest.fn()
    const { getByLabelText } = render(
      <Alert dismissible onClose={mock}>
        Message
      </Alert>
    )
    fireEvent.click(getByLabelText("Close alert"))
    expect(mock).toHaveReturnedTimes(1)
  })
  it('Should default to variant="primary"', () => {
    const { getByRole } = render(<Alert>Message</Alert>)
    const y = getByRole("alert")
    expect(y.classList.contains("alert-primary")).toBe(true)
  })
  it("should use variant class", () => {
    const { getByRole } = render(<Alert variant="danger">Message</Alert>)
    const y = getByRole("alert")
    expect(y.classList.contains("alert-danger")).toBe(true)
  })
  it("should not have variant class when variant=null", () => {
    const { getByRole } = render(<Alert variant={null as any}>Message</Alert>)
    const y = getByRole("alert")
    expect(y.classList.contains("alert-primary")).not.toBe(true)
  })
  it("should forward refs to the alert", () => {
    const ref = qr.createRef<HTMLDivElement>()
    const { getByRole } = render(<Alert ref={ref}>message</Alert>)
    const y = getByRole("alert")
    expect(y.tagName.toLowerCase()).toEqual("div")
  })
  it("should not have fade class when transition=false", () => {
    const { getByRole } = render(<Alert transition={false}>Message</Alert>)
    const y = getByRole("alert")
    expect(y.classList.contains("fade")).not.toBe(true)
  })
  it("should spread props to alert when transition=false", () => {
    const id = "alert-id"
    const { getByRole } = render(
      <Alert transition={false} id={id}>
        Message
      </Alert>
    )
    const y = getByRole("alert")
    expect(y.getAttribute("id")!).toEqual(id)
  })
  it("should spread props to alert when transition=true", () => {
    const id = "alert-id"
    const { getByRole } = render(
      <Alert transition id={id}>
        Message
      </Alert>
    )
    const y = getByRole("alert")
    expect(y.getAttribute("id")).toEqual(id)
  })
  it("should use Fade when transition=true", () => {
    const { getByRole } = render(
      <Alert variant="danger" transition>
        Message
      </Alert>
    )
    const y = getByRole("alert")
    expect(y.classList.contains("fade")).toBe(true)
  })
  it("should render null when transition and show are false", () => {
    const { container } = render(
      <Alert variant="danger" transition={false} show={false}>
        Message
      </Alert>
    )
    expect(container.innerHTML).toEqual("")
  })
  it("should render close button variant", () => {
    const { getByLabelText } = render(
      <Alert dismissible closeVariant="white">
        Message
      </Alert>
    )
    const y = getByLabelText("Close alert")
    expect(y.classList.contains("btn-close-white")).toBe(true)
  })
  it("should have alert role", () => {
    const { getByRole } = render(<Alert>Message</Alert>)
    const y = getByRole("alert")
    expect(y.getAttribute("role")!).toEqual("alert")
  })
  it("should have alert-heading", () => {
    const { getByText } = render(
      <Alert>
        <Heading>Well done</Heading>
        Message
      </Alert>
    )
    const y = getByText("Well done")
    expect(y.classList.contains("alert-heading")).toBe(true)
  })
  it("should have div styled as an h4 by default", () => {
    const { getByText } = render(
      <Alert>
        <Heading>Well done</Heading>
        Message
      </Alert>
    )
    const y = getByText("Well done")
    expect(y.classList.contains("h4")).toBe(true)
  })
  it("should support Heading as as prop", () => {
    const { getByText } = render(
      <Alert>
        <Heading as="h1">Well done</Heading>
        Message
      </Alert>
    )
    const y = getByText("Well done")
    expect(y.tagName.toLowerCase()).toEqual("h1")
  })
})
