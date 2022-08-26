import { render } from "@testing-library/react"

import NavItem from "../src/NavItem"

describe("<NavItem>", () => {
  it("should have div as default component", () => {
    const { getByTestId } = render(<NavItem data-testid="test" />)
    const navItemElem = getByTestId("test")

    expect(navItemElem.tagName.toLowerCase()).toEqual("div")
    expect(navItemElem.classList.contains("nav-item")).toBe(true)
  })

  it('should allow custom elements instead of "div"', () => {
    const { getByTestId } = render(<NavItem data-testid="test" as="section" />)
    const navItemElem = getByTestId("test")

    expect(navItemElem.tagName.toLowerCase()).toEqual("section")
    expect(navItemElem.classList.contains("nav-item")).toBe(true)
  })

  it("should pass classNames down and render children", () => {
    const { getByTestId } = render(
      <NavItem data-testid="test" className="custom-class and-other">
        <strong>Children</strong>
      </NavItem>
    )
    const navItemElem = getByTestId("test")

    expect(navItemElem.classList.contains("nav-item")).toBe(true)
    expect(navItemElem.classList.contains("custom-class")).toBe(true)
    expect(navItemElem.classList.contains("and-other")).toBe(true)
    expect(navItemElem.firstElementChild!.tagName.toLowerCase()).toEqual(
      "strong"
    )
  })
})
