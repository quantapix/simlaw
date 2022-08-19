import { fireEvent, render } from "@testing-library/react"
import { Header as CardHeader } from "../src/Card.jsx"
import { Link, Nav } from "../src/Nav.jsx"
import { Navbar } from "../src/Navbar.jsx"
import NavDropdown from "../src/NavDropdown"
import { shouldWarn } from "./helpers.js"

describe("<Nav>", () => {
  test("should have div as default component", () => {
    const { getByTestId } = render(<Nav data-testid="test" />)
    getByTestId("test").tagName.toLowerCase().should.equal("div")
  })
  test("should set the correct item active", () => {
    const { getByTestId } = render(
      <Nav variant="pills" defaultActiveKey={1} data-testid="test">
        <Link eventKey={1}>Pill 1 content</Link>
        <Link eventKey={2}>Pill 2 content</Link>
      </Nav>
    )
    const navLinks = getByTestId("test").children
    navLinks[0].classList.contains("active").should.be.true
    navLinks[1].classList.contains("active").should.not.be.true
  })
  test("should add variant class", () => {
    const { getByTestId } = render(
      <Nav variant="tabs" data-testid="test">
        <Link eventKey={1}>Pill 1 content</Link>
        <Link eventKey={2}>Pill 2 content</Link>
      </Nav>
    )
    const navElem = getByTestId("test")
    navElem.classList.contains("nav-tabs").should.be.true
    navElem.classList.contains("nav").should.be.true
  })
  test("should add justified class", () => {
    const { getByTestId } = render(
      <Nav justify data-testid="test">
        <Link eventKey={1}>Pill 1 content</Link>
        <Link eventKey={2}>Pill 2 content</Link>
      </Nav>
    )
    const navElem = getByTestId("test")
    navElem.classList.contains("nav-justified").should.be.true
  })
  test("should add fill class", () => {
    const { getByTestId } = render(
      <Nav fill data-testid="test">
        <Link eventKey={1}>Pill 1 content</Link>
        <Link eventKey={2}>Pill 2 content</Link>
      </Nav>
    )
    const navElem = getByTestId("test")
    navElem.classList.contains("nav-fill").should.be.true
  })
  test("should be navbar aware", () => {
    const { getByTestId } = render(
      <Navbar>
        <Nav data-testid="test">
          <Link eventKey={1}>Pill 1 content</Link>
          <Link eventKey={2}>Pill 2 content</Link>
        </Nav>
      </Navbar>
    )
    const navItem = getByTestId("test")
    navItem.classList.contains("navbar-nav").should.be.true
  })
  test("should handle navbarScroll if within navbar", () => {
    const { getByTestId } = render(
      <Navbar>
        <Nav navbarScroll data-testid="test" />
      </Navbar>
    )
    const navItem = getByTestId("test")
    navItem.classList.contains("navbar-nav-scroll").should.be.true
  })
  test("should not add navbarScroll when not within navbar", () => {
    const { getByTestId } = render(<Nav navbarScroll data-testid="test" />)
    const navItem = getByTestId("test")
    navItem.classList.contains("navbar-nav-scroll").should.be.false
  })
  test("should be card header aware", () => {
    const { getByTestId } = render(
      <CardHeader>
        <Nav variant="pills" data-testid="test">
          <Link eventKey={1}>Pill 1 content</Link>
          <Link eventKey={2}>Pill 2 content</Link>
        </Nav>
      </CardHeader>
    )
    const navItem = getByTestId("test")
    navItem.classList.contains("card-header-pills").should.be.true
  })
  test("should call onSelect when a Link is selected", () => {
    const onSelectSpy = sinon.spy()
    const { getByTestId } = render(
      // eslint-disable-next-line react/jsx-no-bind
      <Nav onSelect={onSelectSpy} data-testid="test">
        <Link eventKey={1}>Tab 1 content</Link>
        <Link eventKey={2}>
          <span>Tab 2 content</span>
        </Link>
      </Nav>
    )
    const navItem = getByTestId("test")
    fireEvent.click(navItem.lastElementChild!)
    onSelectSpy.should.have.been.calledWith("2")
  })
  test("should call onSelect when a NavDropdown.Item is selected", () => {
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
    onSelectSpy.should.have.been.calledOnce
  })
  test("should set the correct item active by href", () => {
    const { getByTestId } = render(
      <Nav defaultActiveKey="#item1" data-testid="test">
        <Link href="#item1" className="test-selected">
          Pill 1 content
        </Link>
        <Link href="#item2">Pill 2 content</Link>
      </Nav>
    )
    const navItem = getByTestId("test")
    navItem.firstElementChild!.classList.contains("active").should.be.true
  })
  test("should warn when attempting to use a justify navbar nav", () => {
    shouldWarn("justify navbar `Nav`s are not supported")
    render(<Nav navbar justify />)
  })
  describe("Web Accessibility", () => {
    test("should have tablist and tab roles", () => {
      const Component = props => (
        <Nav data-testid="test" {...props}>
          <Link key={1}>Tab 1 content</Link>
          <Link key={2}>Tab 2 content</Link>
        </Nav>
      )
      const { rerender, getByTestId } = render(<Component />)
      rerender(<Component role="tablist" />)
      const navItem = getByTestId("test")
      navItem.getAttribute("role")!.should.equal("tablist")
      navItem.querySelectorAll('a[role="tab"]').length.should.equal(2)
    })
  })
})
