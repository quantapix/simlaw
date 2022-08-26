import { render } from "@testing-library/react"
import NavLink from "../src/NavLink"

describe("<NavLink>", () => {
  it("renders correctly", () => {
    const { getByTestId } = render(
      <NavLink
        className="custom-class"
        href="/some/unique-thing/"
        title="content"
        data-testid="test"
      >
        <strong>Children</strong>
      </NavLink>
    )
    const navLinkElem = getByTestId("test")
    expect(navLinkElem.classList.contains("nav-link")).toBe(true)
    expect(navLinkElem.classList.contains("custom-class")).toBe(true)
    expect(navLinkElem.getAttribute("href")!).toEqual("/some/unique-thing/")
    expect(navLinkElem.getAttribute("title")!).toEqual("content")
    expect(navLinkElem.firstElementChild!.tagName.toLowerCase()).toEqual(
      "strong"
    )
  })

  it("Should add active class", () => {
    const { getByTestId } = render(
      <NavLink active data-testid="test">
        Item content
      </NavLink>
    )
    const navLinkElem = getByTestId("test")
    expect(navLinkElem.classList.contains("active")).toBe(true)
  })

  it("Should add disabled class", () => {
    const { getByTestId } = render(
      <NavLink disabled data-testid="test">
        Item content
      </NavLink>
    )
    const navLinkElem = getByTestId("test")
    expect(navLinkElem.classList.contains("disabled")).toBe(true)
  })

  describe("Web Accessibility", () => {
    it('Should add aria-selected to the link when role is "tab"', () => {
      const { getByTestId } = render(
        <NavLink role="tab" active data-testid="test">
          Item content
        </NavLink>
      )
      const navLinkElem = getByTestId("test")
      expect(navLinkElem.tagName.toLowerCase()).toEqual("a")
      expect(navLinkElem.getAttribute("aria-selected")!).toEqual("true")
    })

    it('Should not add aria-selected to the link when role is not "tab"', () => {
      const { getByTestId } = render(
        <NavLink role="button" active data-testid="test">
          Item content
        </NavLink>
      )
      const navLinkElem = getByTestId("test")
      expect(navLinkElem.tagName.toLowerCase()).toEqual("a")
      expect(navLinkElem.getAttribute("aria-selected")).toBeNull()
    })
  })
})
