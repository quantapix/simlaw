import { Badge } from "../src/Badge.js"
import { render } from "@testing-library/react"

describe("Badge", () => {
  it("Should render correctly", () => {
    const { getByTestId } = render(
      <Badge bg="primary" pill data-testid="test">
        Message
      </Badge>
    )
    const y = getByTestId("test")
    expect(y.innerText).toEqual("Message")
    expect(y.classList.contains("badge")).toBe(true)
    expect(y.classList.contains("bg-primary")).toBe(true)
    expect(y.classList.contains("rounded-pill")).toBe(true)
  })
  it("Should support custom `as`", () => {
    const { getByTestId } = render(
      <Badge as="a" href="#" bg="primary" pill data-testid="test">
        Message
      </Badge>
    )
    const y = getByTestId("test")
    expect(y.tagName.toLowerCase()).toEqual("a")
    expect(y.getAttribute("href")!).toEqual("#")
  })
  it('Should default to bg="primary"', () => {
    const { getByTestId } = render(<Badge data-testid="test">Message</Badge>)
    const y = getByTestId("test")
    expect(y.classList.contains("bg-primary")).toBe(true)
  })
  it("Should use bg class", () => {
    const { getByTestId } = render(
      <Badge bg="danger" data-testid="test">
        Message
      </Badge>
    )
    const y = getByTestId("test")
    expect(y.classList.contains("bg-danger")).toBe(true)
  })
  it("Should not have bg class when bg=null", () => {
    const { getByTestId } = render(
      <Badge bg={null as any} data-testid="test">
        Message
      </Badge>
    )
    const y = getByTestId("test")
    expect(y.classList.contains("bg-primary")).toBe(false)
  })
})
