import { fireEvent, render } from "@testing-library/react"
import { Header as CardHeader } from "../src/Card.jsx"
import { Item, Link, Nav } from "../src/Nav.jsx"
import { Navbar } from "../src/Navbar.jsx"
import { Dropdown as NavDropdown } from "../src/Dropdown.jsx"
import { shouldWarn } from "./helpers.js"

describe("<Nav>", () => {
  it("should have div as default component", () => {
    const { getByTestId } = render(<Nav data-testid="test" />)
    expect(getByTestId("test").tagName.toLowerCase()).toEqual("div")
  })
  it("should set the correct item active", () => {
    const { getByTestId } = render(
      <Nav variant="pills" defaultActiveKey={1} data-testid="test">
        <Link eventKey={1}>Pill 1 content</Link>
        <Link eventKey={2}>Pill 2 content</Link>
      </Nav>
    )
    const navLinks = getByTestId("test").children
    expect(navLinks[0]!.classList.contains("active")).toBe(true)
    expect(navLinks[1]!.classList.contains("active")).not.toBe(true)
  })
  it("should add variant class", () => {
    const { getByTestId } = render(
      <Nav variant="tabs" data-testid="test">
        <Link eventKey={1}>Pill 1 content</Link>
        <Link eventKey={2}>Pill 2 content</Link>
      </Nav>
    )
    const navElem = getByTestId("test")
    expect(navElem.classList.contains("nav-tabs")).toBe(true)
    expect(navElem.classList.contains("nav")).toBe(true)
  })
  it("should add justified class", () => {
    const { getByTestId } = render(
      <Nav justify data-testid="test">
        <Link eventKey={1}>Pill 1 content</Link>
        <Link eventKey={2}>Pill 2 content</Link>
      </Nav>
    )
    const navElem = getByTestId("test")
    expect(navElem.classList.contains("nav-justified")).toBe(true)
  })
  it("should add fill class", () => {
    const { getByTestId } = render(
      <Nav fill data-testid="test">
        <Link eventKey={1}>Pill 1 content</Link>
        <Link eventKey={2}>Pill 2 content</Link>
      </Nav>
    )
    const navElem = getByTestId("test")
    expect(navElem.classList.contains("nav-fill")).toBe(true)
  })
  it("should be navbar aware", () => {
    const { getByTestId } = render(
      <Navbar>
        <Nav data-testid="test">
          <Link eventKey={1}>Pill 1 content</Link>
          <Link eventKey={2}>Pill 2 content</Link>
        </Nav>
      </Navbar>
    )
    const navItem = getByTestId("test")
    expect(navItem.classList.contains("navbar-nav")).toBe(true)
  })
  it("should handle navbarScroll if within navbar", () => {
    const { getByTestId } = render(
      <Navbar>
        <Nav navbarScroll data-testid="test" />
      </Navbar>
    )
    const navItem = getByTestId("test")
    expect(navItem.classList.contains("navbar-nav-scroll")).toBe(true)
  })
  it("should not add navbarScroll when not within navbar", () => {
    const { getByTestId } = render(<Nav navbarScroll data-testid="test" />)
    const navItem = getByTestId("test")
    expect(navItem.classList.contains("navbar-nav-scroll")).toBe(false)
  })
  it("should be card header aware", () => {
    const { getByTestId } = render(
      <CardHeader>
        <Nav variant="pills" data-testid="test">
          <Link eventKey={1}>Pill 1 content</Link>
          <Link eventKey={2}>Pill 2 content</Link>
        </Nav>
      </CardHeader>
    )
    const navItem = getByTestId("test")
    expect(navItem.classList.contains("card-header-pills")).toBe(true)
  })
  it("should call onSelect when a Link is selected", () => {
    const mock = jest.fn()
    const { getByTestId } = render(
      <Nav onSelect={mock} data-testid="test">
        <Link eventKey={1}>Tab 1 content</Link>
        <Link eventKey={2}>
          <span>Tab 2 content</span>
        </Link>
      </Nav>
    )
    const navItem = getByTestId("test")
    fireEvent.click(navItem.lastElementChild!)
    expect(mock).toHaveBeenCalledWith("2")
  })
  it("should call onSelect when a NavDropdown.Item is selected", () => {
    const mock = jest.fn()
    const { getByTestId } = render(
      <Nav onSelect={mock}>
        <NavDropdown title="Dropdown" id="nav-dropdown-test" renderMenuOnMount>
          <NavDropdown.Item eventKey={1} data-testid="test">
            Dropdown item
          </NavDropdown.Item>
        </NavDropdown>
      </Nav>
    )
    const dropdownItem = getByTestId("test")
    fireEvent.click(dropdownItem!)
    expect(mock).toHaveBeenCalledTimes(1)
  })
  it("should set the correct item active by href", () => {
    const { getByTestId } = render(
      <Nav defaultActiveKey="#item1" data-testid="test">
        <Link href="#item1" className="test-selected">
          Pill 1 content
        </Link>
        <Link href="#item2">Pill 2 content</Link>
      </Nav>
    )
    const navItem = getByTestId("test")
    expect(navItem.firstElementChild!.classList.contains("active")).toBe(true)
  })
  it("should warn when attempting to use a justify navbar nav", () => {
    shouldWarn("justify navbar `Nav`s are not supported")
    render(<Nav navbar justify />)
  })
  describe("Web Accessibility", () => {
    it("should have tablist and tab roles", () => {
      const Component = (props: any) => (
        <Nav data-testid="test" {...props}>
          <Link key={1}>Tab 1 content</Link>
          <Link key={2}>Tab 2 content</Link>
        </Nav>
      )
      const { rerender, getByTestId } = render(<Component />)
      rerender(<Component role="tablist" />)
      const navItem = getByTestId("test")
      expect(navItem.getAttribute("role")!).toEqual("tablist")
      expect(navItem.querySelectorAll('a[role="tab"]').length).toEqual(2)
    })
  })
})
describe("<NavItem>", () => {
  it("should have div as default component", () => {
    const { getByTestId } = render(<Item data-testid="test" />)
    const navItemElem = getByTestId("test")

    expect(navItemElem.tagName.toLowerCase()).toEqual("div")
    expect(navItemElem.classList.contains("nav-item")).toBe(true)
  })

  it('should allow custom elements instead of "div"', () => {
    const { getByTestId } = render(<Item data-testid="test" as="section" />)
    const navItemElem = getByTestId("test")

    expect(navItemElem.tagName.toLowerCase()).toEqual("section")
    expect(navItemElem.classList.contains("nav-item")).toBe(true)
  })

  it("should pass classNames down and render children", () => {
    const { getByTestId } = render(
      <Item data-testid="test" className="custom-class and-other">
        <strong>Children</strong>
      </Item>
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
describe("<NavLink>", () => {
  it("renders correctly", () => {
    const { getByTestId } = render(
      <Link
        className="custom-class"
        href="/some/unique-thing/"
        title="content"
        data-testid="test"
      >
        <strong>Children</strong>
      </Link>
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
      <Link active data-testid="test">
        Item content
      </Link>
    )
    const navLinkElem = getByTestId("test")
    expect(navLinkElem.classList.contains("active")).toBe(true)
  })

  it("Should add disabled class", () => {
    const { getByTestId } = render(
      <Link disabled data-testid="test">
        Item content
      </Link>
    )
    const navLinkElem = getByTestId("test")
    expect(navLinkElem.classList.contains("disabled")).toBe(true)
  })

  describe("Web Accessibility", () => {
    it('Should add aria-selected to the link when role is "tab"', () => {
      const { getByTestId } = render(
        <Link role="tab" active data-testid="test">
          Item content
        </Link>
      )
      const navLinkElem = getByTestId("test")
      expect(navLinkElem.tagName.toLowerCase()).toEqual("a")
      expect(navLinkElem.getAttribute("aria-selected")!).toEqual("true")
    })

    it('Should not add aria-selected to the link when role is not "tab"', () => {
      const { getByTestId } = render(
        <Link role="button" active data-testid="test">
          Item content
        </Link>
      )
      const navLinkElem = getByTestId("test")
      expect(navLinkElem.tagName.toLowerCase()).toEqual("a")
      expect(navLinkElem.getAttribute("aria-selected")).toBeNull()
    })
  })
})
