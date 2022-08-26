import { Badge } from "../src/Badge.js"
import { render } from "@testing-library/react"

describe("Badge", () => {
  it("Should render correctly", () => {
    const { getByTestId } = render(
      <Badge bg="primary" pill data-testid="test">
        Message
      </Badge>
    )
    const badge = getByTestId("test")
    expect(badge.innerText).toEqual("Message")
    expect(badge.classList.contains("badge")).toBe(true)
    expect(badge.classList.contains("bg-primary")).toBe(true)
    expect(badge.classList.contains("rounded-pill")).toBe(true)
  })
  it("should support custom `as`", () => {
    const { getByTestId } = render(
      <Badge as="a" href="#" bg="primary" pill data-testid="test">
        Message
      </Badge>
    )
    const badge = getByTestId("test")
    expect(badge.tagName.toLowerCase()).toEqual("a")
    expect(badge.getAttribute("href")!).toEqual("#")
  })
  it('Should default to bg="primary"', () => {
    const { getByTestId } = render(<Badge data-testid="test">Message</Badge>)
    const badge = getByTestId("test")
    expect(badge.classList.contains("bg-primary")).toBe(true)
  })
  it("Should use bg class", () => {
    const { getByTestId } = render(
      <Badge bg="danger" data-testid="test">
        Message
      </Badge>
    )
    const badge = getByTestId("test")
    expect(badge.classList.contains("bg-danger")).toBe(true)
  })
  it("Should not have bg class when bg=null", () => {
    const { getByTestId } = render(
      <Badge bg={null as any} data-testid="test">
        Message
      </Badge>
    )
    const badge = getByTestId("test")
    expect(badge.classList.contains("bg-primary")).toBe(false)
  })
})
