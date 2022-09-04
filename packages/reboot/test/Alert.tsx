import { Alert, Heading } from "../src/Alert.js"
import { fireEvent, render } from "@testing-library/react"
import * as qr from "react"

describe("<Alert>", () => {
  it("Should output a alert with message", () => {
    const { getByTestId } = render(
      <Alert data-testid="test">
        <strong>Message</strong>
      </Alert>
    )
    const y = getByTestId("test")
    expect(y.children.length).toEqual(1)
    expect(y.children[0]!.tagName.toLowerCase()).toEqual("strong")
  })
  it("Should have dismissible style", () => {
    const { getByTestId } = render(
      <Alert data-testid="test" dismissible>
        <strong>Message</strong>
      </Alert>
    )
    const y = getByTestId("test")
    expect(y.classList.contains("alert-dismissible")).toBe(true)
  })
  it("Should call onClose callback on dismiss click", () => {
    const mock = jest.fn()
    const { getByLabelText } = render(
      <Alert dismissible data-testid="test" onClose={mock}>
        Message
      </Alert>
    )
    fireEvent.click(getByLabelText("Close alert"))
    expect(mock).toHaveReturnedTimes(1)
  })
  it('Should default to variant="primary"', () => {
    const { getByTestId } = render(<Alert data-testid="test">Message</Alert>)
    const y = getByTestId("test")
    expect(y.classList.contains("alert-primary")).toBe(true)
  })
  it("Should use variant class", () => {
    const { getByTestId } = render(
      <Alert variant="danger" data-testid="test">
        Message
      </Alert>
    )
    const y = getByTestId("test")
    expect(y.classList.contains("alert-danger")).toBe(true)
  })
  it("Should not have variant class when variant=null", () => {
    const { getByTestId } = render(
      <Alert variant={null as any} data-testid="test">
        Message
      </Alert>
    )
    const y = getByTestId("test")
    expect(y.classList.contains("alert-primary")).not.toBe(true)
  })
  it("Should forward refs to the alert", () => {
    const ref = qr.createRef<HTMLDivElement>()
    const { getByTestId } = render(
      <Alert ref={ref} data-testid="test">
        message
      </Alert>
    )
    const y = getByTestId("test")
    expect(y.tagName.toLowerCase()).toEqual("div")
  })
  it("Should not have fade class when transition=false", () => {
    const { getByTestId } = render(
      <Alert transition={false} data-testid="test">
        Message
      </Alert>
    )
    const y = getByTestId("test")
    expect(y.classList.contains("fade")).not.toBe(true)
  })
  it("Should spread props to alert when transition=false", () => {
    const alertId = "alert-id"
    const { getByTestId } = render(
      <Alert transition={false} id={alertId} data-testid="test">
        Message
      </Alert>
    )
    const y = getByTestId("test")
    expect(y.getAttribute("id")!).toEqual(alertId)
  })
  it("Should spread props to alert when transition=true", () => {
    const alertId = "alert-id"
    const { getByTestId } = render(
      <Alert transition id={alertId} data-testid="test">
        Message
      </Alert>
    )
    const y = getByTestId("test")
    expect(y.getAttribute("id")!).toEqual(alertId)
  })
  it("Should use Fade when transition=true", () => {
    const { getByTestId } = render(
      <Alert variant="danger" transition data-testid="test">
        Message
      </Alert>
    )
    const y = getByTestId("test")
    expect(y.classList.contains("fade")).toBe(true)
  })
  it("Should render null when transition and show are false", () => {
    const { container } = render(
      <Alert
        variant="danger"
        transition={false}
        show={false}
        data-testid="test"
      >
        Message
      </Alert>
    )
    expect(container.innerHTML).toEqual("")
  })
  it("Should render close button variant", () => {
    const { getByLabelText } = render(
      <Alert dismissible closeVariant="white">
        Message
      </Alert>
    )
    const y = getByLabelText("Close alert")
    expect(y.classList.contains("btn-close-white")).toBe(true)
  })
  describe("Web Accessibility", () => {
    it("Should have alert role", () => {
      const { getByTestId } = render(<Alert data-testid="test">Message</Alert>)
      const y = getByTestId("test")
      expect(y.getAttribute("role")!).toEqual("alert")
    })
  })
  describe("Alert alert-heading", () => {
    it("Should have alert-heading", () => {
      const { getByTestId } = render(
        <Alert>
          <Heading data-testid="test">Well done</Heading>
          Message
        </Alert>
      )
      const y = getByTestId("test")
      expect(y.classList.contains("alert-heading")).toBe(true)
    })
    it("Should have div styled as an h4 by default", () => {
      const { getByTestId } = render(
        <Alert>
          <Heading data-testid="test">Well done</Heading>
          Message
        </Alert>
      )
      const y = getByTestId("test")
      expect(y.classList.contains("h4")).toBe(true)
    })
    it("Should support Heading as as prop", () => {
      const { getByTestId } = render(
        <Alert>
          <Heading as="h1" data-testid="test">
            Well done
          </Heading>
          Message
        </Alert>
      )
      const y = getByTestId("test")
      expect(y.tagName.toLowerCase()).toEqual("h1")
    })
  })
})
