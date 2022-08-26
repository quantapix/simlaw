import { render } from "@testing-library/react"
import { Body, Header, Popover } from "../src/Popover.jsx"

describe("Popover", () => {
  it("Should output a popover title and content", () => {
    const { getByTestId } = render(
      <Popover data-testid="test" id="test-popover">
        <Header>Popover title</Header>
        <Body>
          <strong>Popover Content</strong>
        </Body>
      </Popover>
    )
    const popoverElem = getByTestId("test")
    const popoverArrowElem = popoverElem.children[0]!
    const popoverHeaderElem = popoverElem.children[1]!
    const popoverBodyElem = popoverElem.children[2]!
    expect(popoverElem.getAttribute("x-placement")!).toEqual("right")
    expect(popoverElem.getAttribute("role")!).toEqual("tooltip")
    expect(popoverElem.classList.contains("popover")).toBe(true)
    expect(popoverElem.classList.contains("bs-popover-end")).toBe(true)
    expect(popoverArrowElem.classList.contains("popover-arrow")).toBe(true)
    expect(popoverHeaderElem.classList.contains("popover-header")).toBe(true)
    expect(popoverBodyElem.classList.contains("popover-body")).toBe(true)
  })
})
