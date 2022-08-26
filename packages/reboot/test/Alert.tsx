import * as React from "react"
import { fireEvent, render } from "@testing-library/react"
import { Alert, Heading } from "../src/Alert.js"

describe("<Alert>", () => {
  it("Should output a alert with message", () => {
    const { getByTestId } = render(
      <Alert data-testid="test-alert">
        <strong>Message</strong>
      </Alert>
    )
    expect(getByTestId("test-alert").children.length).toEqual(1)
    expect(
      getByTestId("test-alert").children[0]!.tagName.toLowerCase()
    ).toEqual("strong")
  })
  it("Should have dismissible style", () => {
    const { getByTestId } = render(
      <Alert data-testid="test-alert" dismissible>
        <strong>Message</strong>
      </Alert>
    )
    expect(
      getByTestId("test-alert").classList.contains("alert-dismissible")
    ).toBe(true)
  })
  it("Should call onClose callback on dismiss click", () => {
    const onCloseSpy = jest.fn()
    const { getByLabelText } = render(
      <Alert dismissible data-testid="test-alert" onClose={onCloseSpy}>
        Message
      </Alert>
    )
    fireEvent.click(getByLabelText("Close alert"))
    expect(onCloseSpy).to.be.calledOnce
  })
  it('Should default to variant="primary"', () => {
    const { getByTestId } = render(
      <Alert data-testid="test-alert">Message</Alert>
    )
    expect(getByTestId("test-alert").classList.contains("alert-primary")).toBe(
      true
    )
  })
  it("Should use variant class", () => {
    const { getByTestId } = render(
      <Alert variant="danger" data-testid="test-alert">
        Message
      </Alert>
    )
    expect(getByTestId("test-alert").classList.contains("alert-danger")).toBe(
      true
    )
  })
  it("Should not have variant class when variant=null", () => {
    const { getByTestId } = render(
      <Alert variant={null as any} data-testid="test-alert">
        Message
      </Alert>
    )
    expect(
      getByTestId("test-alert").classList.contains("alert-primary")
    ).not.toBe(true)
  })
  it("should forward refs to the alert", () => {
    const ref = React.createRef<HTMLDivElement>()
    const { getByTestId } = render(
      <Alert ref={ref} data-testid="test-alert">
        message
      </Alert>
    )
    expect(getByTestId("test-alert").tagName.toLowerCase()).toEqual("div")
  })
  it("should not have fade class when transition=false", () => {
    const { getByTestId } = render(
      <Alert transition={false} data-testid="test-alert">
        Message
      </Alert>
    )
    expect(getByTestId("test-alert").classList.contains("fade")).not.toBe(true)
  })
  it("should spread props to alert when transition=false", () => {
    const alertId = "alert-id"
    const { getByTestId } = render(
      <Alert transition={false} id={alertId} data-testid="test-alert">
        Message
      </Alert>
    )
    expect(getByTestId("test-alert").getAttribute("id")!).toEqual(alertId)
  })
  it("should spread props to alert when transition=true", () => {
    const alertId = "alert-id"
    const { getByTestId } = render(
      <Alert transition id={alertId} data-testid="test-alert">
        Message
      </Alert>
    )
    expect(getByTestId("test-alert").getAttribute("id")!).toEqual(alertId)
  })
  it("should use Fade when transition=true", () => {
    const { getByTestId } = render(
      <Alert variant="danger" transition data-testid="test-alert">
        Message
      </Alert>
    )
    expect(getByTestId("test-alert").classList.contains("fade")).toBe(true)
  })
  it("should render null when transition and show are false", () => {
    const { container } = render(
      <Alert
        variant="danger"
        transition={false}
        show={false}
        data-testid="test-alert"
      >
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
    expect(
      getByLabelText("Close alert").classList.contains("btn-close-white")
    ).toBe(true)
  })
  describe("Web Accessibility", () => {
    it("Should have alert role", () => {
      const { getByTestId } = render(
        <Alert data-testid="test-alert">Message</Alert>
      )
      expect(getByTestId("test-alert").getAttribute("role")!).toEqual("alert")
    })
  })
  describe("Alert alert-heading", () => {
    it("Should have alert-heading", () => {
      const { getByTestId } = render(
        <Alert>
          <Heading data-testid="test-alert">Well done</Heading>
          Message
        </Alert>
      )
      expect(
        getByTestId("test-alert").classList.contains("alert-heading")
      ).toBe(true)
    })
    it("Should have div styled as an h4 by default", () => {
      const { getByTestId } = render(
        <Alert>
          <Heading data-testid="test-alert">Well done</Heading>
          Message
        </Alert>
      )
      expect(getByTestId("test-alert").classList.contains("h4")).toBe(true)
    })
    it("Should support Heading as as prop", () => {
      const { getByTestId } = render(
        <Alert>
          <Heading as="h1" data-testid="test-alert">
            Well done
          </Heading>
          Message
        </Alert>
      )
      expect(getByTestId("test-alert").tagName.toLowerCase()).toEqual("h1")
    })
  })
})
