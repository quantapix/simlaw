import { fireEvent, render } from "@testing-library/react"
import { Header as CardHeader } from "../src/Card.jsx"
import { Link, Nav } from "../src/Nav.jsx"
import { Navbar } from "../src/Navbar.jsx"
import NavDropdown from "../src/NavDropdown"
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
    expect(navLinks[0].classList.contains("active")).toBe(true)
    expect(navLinks[1].classList.contains("active")).not.toBe(true)
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
    const onSelectSpy = sinon.spy()
    const { getByTestId } = render(
      <Nav onSelect={onSelectSpy} data-testid="test">
        <Link eventKey={1}>Tab 1 content</Link>
        <Link eventKey={2}>
          <span>Tab 2 content</span>
        </Link>
      </Nav>
    )
    const navItem = getByTestId("test")
    fireEvent.click(navItem.lastElementChild!)
    expect(onSelectSpy).toHaveBeenCalledWith("2")
  })
  it("should call onSelect when a NavDropdown.Item is selected", () => {
    const onSelectSpy = sinon.spy()
    const { getByTestId } = render(
      <Nav onSelect={onSelectSpy}>
        <NavDropdown title="Dropdown" id="nav-dropdown-test" renderMenuOnMount>
          <NavDropdown.Item eventKey={1} data-testid="test">
            Dropdown item
          </NavDropdown.Item>
        </NavDropdown>
      </Nav>
    )
    const dropdownItem = getByTestId("test")
    fireEvent.click(dropdownItem!)
    expect(onSelectSpy).toHaveBeenCalledTimes(1)
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
      const Component = props => (
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
