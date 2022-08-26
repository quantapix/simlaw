import { fireEvent, render } from "@testing-library/react"
import { Link, Nav } from "../src/Nav.jsx"
import { Brand, Collapse, Navbar, Toggle } from "../src/Navbar.jsx"

describe("<Navbar>", () => {
  it("Should create nav element", () => {
    const { getByTestId } = render(<Navbar data-testid="test" />)
    const navbarElem = getByTestId("test")
    expect(navbarElem.classList.contains("navbar")).toBe(true)
    expect(navbarElem.classList.contains("navbar-expand")).toBe(true)
    expect(navbarElem.classList.contains("navbar-light")).toBe(true)
  })
  it('Should add "navigation" role when not using a `<nav>`', () => {
    const { getByTestId } = render(<Navbar as="div" data-testid="test" />)
    const navbarElem = getByTestId("test")
    expect(navbarElem.tagName.toLowerCase()).toEqual("div")
    expect(navbarElem.getAttribute("role")!).toEqual("navigation")
  })
  it("Should add fixed=top|bottom variation", () => {
    const { getByTestId: getByFirstTestId } = render(
      <Navbar fixed="top" data-testid="test1" />
    )
    const firstNavbarElem = getByFirstTestId("test1")
    expect(firstNavbarElem.classList.contains("fixed-top")).toBe(true)
    const { getByTestId: getBySecondTestId } = render(
      <Navbar fixed="bottom" data-testid="test2" />
    )
    const navbarElem = getBySecondTestId("test2")
    expect(navbarElem.classList.contains("fixed-bottom")).toBe(true)
  })
  it("Should variant=dark", () => {
    const { getByTestId } = render(<Navbar variant="dark" data-testid="test" />)
    expect(getByTestId("test").classList.contains("navbar-dark")).toBe(true)
  })
  it("Should override role attribute", () => {
    const { getByTestId } = render(<Navbar role="banner" data-testid="test" />)
    expect(getByTestId("test").getAttribute("role")!).toEqual("banner")
  })
  describe("Brand", () => {
    it("Should render brand", () => {
      const { getByTestId } = render(<Brand data-testid="test" />)
      const navbarBrandElem = getByTestId("test")
      expect(navbarBrandElem.classList.contains("navbar-brand")).toBe(true)
      expect(navbarBrandElem.tagName.toLowerCase()).toEqual("span")
    })
    it("Should render brand as anchor", () => {
      const { getByTestId } = render(<Brand href="#" data-testid="test" />)
      const navbarBrandElem = getByTestId("test")
      expect(navbarBrandElem.classList.contains("navbar-brand")).toBe(true)
      expect(navbarBrandElem.tagName.toLowerCase()).toEqual("a")
    })
  })
  it("Should pass navbar context to navs", () => {
    const { getByTestId } = render(
      <Navbar>
        <Nav data-testid="test" />
      </Navbar>
    )
    const navElem = getByTestId("test")
    expect(navElem.classList.contains("navbar-nav")).toBe(true)
  })
  it("Should add custom toggle", () => {
    const { getByTestId } = render(
      <Navbar>
        <Toggle as="p" data-testid="test">
          hi
        </Toggle>
      </Navbar>
    )
    const navToggleElem = getByTestId("test")
    expect(navToggleElem.textContent!).toEqual("hi")
    navToggleElem.classList.contains("navbar-toggler")
    expect(navToggleElem.tagName.toLowerCase()).toEqual("p")
  })
  it("Should trigger onToggle", () => {
    const toggleSpy = sinon.spy()
    const { getByTestId } = render(
      <Navbar onToggle={toggleSpy}>
        <Toggle data-testid="test" />
      </Navbar>
    )
    const toggleElem = getByTestId("test")
    fireEvent.click(toggleElem)
    expect(toggleSpy).toHaveBeenCalledTimes(1)
    expect(toggleSpy).toHaveBeenCalledWith(true)
  })
  it("Should not swallow onClick", () => {
    const clickSpy = sinon.spy()
    const { getByTestId } = render(
      <Navbar>
        <Toggle onClick={clickSpy} data-testid="test" />
      </Navbar>
    )
    const toggleElem = getByTestId("test")
    fireEvent.click(toggleElem)
    expect(clickSpy).toHaveBeenCalledTimes(1)
  })
  it("Should render collapse", () => {
    const { getByTestId } = render(
      <Navbar>
        <Collapse data-testid="test">hello</Collapse>
      </Navbar>
    )
    expect(getByTestId("test").classList.contains("navbar-collapse")).toBe(true)
  })
  it("Should pass expanded to Collapse", () => {
    const { getByTestId } = render(
      <Navbar expanded>
        <Collapse data-testid="test">hello</Collapse>
      </Navbar>
    )
    const toggleElem = getByTestId("test")
    expect(toggleElem.classList.contains("show")).toBe(true)
  })
  it("Should wire the toggle to the collapse", done => {
    const clock = sinon.useFakeTimers()
    const { getByTestId } = render(
      <Navbar>
        <Toggle data-testid="toggler" />
        <Collapse data-testid="collapse">hello</Collapse>
      </Navbar>
    )
    let toggleElem = getByTestId("toggler")
    let collapseElem = getByTestId("collapse")
    expect(collapseElem.classList.contains("show")).toBe(false)
    expect(toggleElem.classList.contains("collapsed")).toBe(true)
    fireEvent.click(toggleElem)
    clock.tick(500)
    toggleElem = getByTestId("toggler")
    collapseElem = getByTestId("collapse")
    expect(collapseElem.classList.contains("show")).toBe(true)
    expect(toggleElem.classList.contains("collapsed")).toBe(false)
    clock.restore()
    done()
  })
  it("Should open external href link in collapseOnSelect", () => {
    const spy = sinon.spy(e => {
      // prevent actual redirect
      e.persist()
      e.preventDefault()
    })
    const { getByTestId } = render(
      <Navbar>
        <Toggle />
        <Collapse>
          <Nav as="div">
            <Link
              href="https://www.google.com"
              data-testid="test"
              onClick={spy}
            />
          </Nav>
        </Collapse>
      </Navbar>
    )
    const linkItem = getByTestId("test")
    fireEvent.click(linkItem)
    expect(spy).toHaveBeenCalledTimes(1)
    expect(getByTestId("test").getAttribute("href")!).toEqual(
      "https://www.google.com"
    )
  })
  it("Should fire external href click", done => {
    const spy = sinon.spy(e => {
      // prevent actual redirect
      e.persist()
      e.preventDefault()
      done()
    })
    const { getByTestId } = render(
      <Navbar expanded>
        <Toggle />
        <Collapse>
          <Nav as="div">
            <Link href="https://www.google.com" onClick={spy}>
              <span className="link-text" data-testid="test">
                Option 1
              </span>
            </Link>
          </Nav>
        </Collapse>
      </Navbar>
    )
    const innerLinkItem = getByTestId("test")
    fireEvent.click(innerLinkItem)
  })
  it("Should collapseOnSelect & fire Nav subcomponent onSelect event if expanded", () => {
    const toggleSpy = sinon.spy()
    const navItemSpy = sinon.spy()
    const { getByTestId } = render(
      <Navbar collapseOnSelect onToggle={toggleSpy} expanded>
        <Toggle />
        <Collapse>
          <Nav as="div">
            <Link href="#" onClick={navItemSpy}>
              <span className="link-text" data-testid="test">
                Option 1
              </span>
            </Link>
          </Nav>
        </Collapse>
      </Navbar>
    )
    const innerLinkElem = getByTestId("test")
    fireEvent.click(innerLinkElem)
    expect(navItemSpy).toHaveBeenCalledTimes(1)
    expect(toggleSpy).toHaveBeenCalledTimes(1)
    expect(toggleSpy).toHaveBeenCalledWith(false)
  })
  it("Should fire onSelect with eventKey for nav children", () => {
    const selectSpy = sinon.spy()
    const navItemSpy = sinon.spy()
    const { getByTestId } = render(
      <Navbar onSelect={selectSpy}>
        <Toggle />
        <Collapse>
          <Nav as="div">
            <Link href="#home" onClick={navItemSpy}>
              <span className="link-text" data-testid="test">
                Option 1
              </span>
            </Link>
          </Nav>
        </Collapse>
      </Navbar>
    )
    const innerLinkElem = getByTestId("test")
    fireEvent.click(innerLinkElem)
    expect(navItemSpy).toHaveBeenCalledTimes(1)
    expect(selectSpy).toHaveBeenCalledTimes(1)
    expect(selectSpy).toHaveBeenCalledWith("#home")
  })
  it("Should have nav as default component", () => {
    const { getByTestId } = render(<Navbar data-testid="test" />)
    expect(getByTestId("test").tagName.toLowerCase()).toEqual("nav")
  })
  it("Should render correctly when expand is a string", () => {
    const { getByTestId } = render(<Navbar expand="sm" data-testid="test" />)
    expect(getByTestId("test").classList.contains("navbar-expand-sm")).to.be
      .true
  })
  it("should allow custom breakpoints for expand", () => {
    const { getByTestId } = render(
      <Navbar expand="custom" data-testid="test" />
    )
    expect(getByTestId("test").classList.contains("navbar-expand-custom")).to.be
      .true
  })
  it("Should render correctly when bg is set", () => {
    const { getByTestId } = render(<Navbar bg="light" data-testid="test" />)
    expect(getByTestId("test").classList.contains("bg-light")).toBe(true)
  })
  it("Should render correctly when sticky is set", () => {
    const { getByTestId } = render(<Navbar sticky="top" data-testid="test" />)
    expect(getByTestId("test").classList.contains("sticky-top")).toBe(true)
  })
})

describe("<Brand>", () => {
  it("Should create Brand SPAN element", () => {
    const { getByTestId } = render(<Brand data-testid="test">Brand</Brand>)
    const BrandElem = getByTestId("test")
    expect(BrandElem.tagName.toLowerCase()).toEqual("span")
    expect(BrandElem.classList.contains("navbar-brand")).toBe(true)
  })
  it("Should create Brand A (link) element", () => {
    const { getByTestId } = render(
      <Brand href="/foo" data-testid="test">
        BrandLink
      </Brand>
    )
    const BrandElem = getByTestId("test")
    expect(BrandElem.tagName.toLowerCase()).toEqual("a")
    expect(BrandElem.classList.contains("navbar-brand")).toBe(true)
  })
})

describe("<Toggle>", () => {
  it("Should have button as default component", () => {
    const { getByTestId } = render(<Toggle data-testid="test" />)
    expect(getByTestId("test").tagName.toLowerCase()).toEqual("button")
  })
})
