import { fireEvent, render } from "@testing-library/react"
import { Link, Nav } from "../src/Nav.jsx"
import { Brand, Collapse, Navbar, Toggle } from "../src/Navbar.jsx"

describe("<Navbar>", () => {
  test("Should create nav element", () => {
    const { getByTestId } = render(<Navbar data-testid="test" />)
    const navbarElem = getByTestId("test")
    navbarElem.classList.contains("navbar").should.be.true
    navbarElem.classList.contains("navbar-expand").should.be.true
    navbarElem.classList.contains("navbar-light").should.be.true
  })
  test('Should add "navigation" role when not using a `<nav>`', () => {
    const { getByTestId } = render(<Navbar as="div" data-testid="test" />)
    const navbarElem = getByTestId("test")
    navbarElem.tagName.toLowerCase().should.equal("div")
    navbarElem.getAttribute("role")!.should.equal("navigation")
  })
  test("Should add fixed=top|bottom variation", () => {
    const { getByTestId: getByFirstTestId } = render(
      <Navbar fixed="top" data-testid="test1" />
    )
    const firstNavbarElem = getByFirstTestId("test1")
    firstNavbarElem.classList.contains("fixed-top").should.be.true
    const { getByTestId: getBySecondTestId } = render(
      <Navbar fixed="bottom" data-testid="test2" />
    )
    const navbarElem = getBySecondTestId("test2")
    navbarElem.classList.contains("fixed-bottom").should.be.true
  })
  test("Should variant=dark", () => {
    const { getByTestId } = render(<Navbar variant="dark" data-testid="test" />)
    getByTestId("test").classList.contains("navbar-dark").should.be.true
  })
  test("Should override role attribute", () => {
    const { getByTestId } = render(<Navbar role="banner" data-testid="test" />)
    getByTestId("test").getAttribute("role")!.should.equal("banner")
  })
  describe("Brand", () => {
    test("Should render brand", () => {
      const { getByTestId } = render(<Brand data-testid="test" />)
      const navbarBrandElem = getByTestId("test")
      navbarBrandElem.classList.contains("navbar-brand").should.be.true
      navbarBrandElem.tagName.toLowerCase().should.equal("span")
    })
    test("Should render brand as anchor", () => {
      const { getByTestId } = render(<Brand href="#" data-testid="test" />)
      const navbarBrandElem = getByTestId("test")
      navbarBrandElem.classList.contains("navbar-brand").should.be.true
      navbarBrandElem.tagName.toLowerCase().should.equal("a")
    })
  })
  test("Should pass navbar context to navs", () => {
    const { getByTestId } = render(
      <Navbar>
        <Nav data-testid="test" />
      </Navbar>
    )
    const navElem = getByTestId("test")
    navElem.classList.contains("navbar-nav").should.be.true
  })
  test("Should add custom toggle", () => {
    const { getByTestId } = render(
      <Navbar>
        <Toggle as="p" data-testid="test">
          hi
        </Toggle>
      </Navbar>
    )
    const navToggleElem = getByTestId("test")
    navToggleElem.textContent!.should.equal("hi")
    navToggleElem.classList.contains("navbar-toggler")
    navToggleElem.tagName.toLowerCase().should.equal("p")
  })
  test("Should trigger onToggle", () => {
    const toggleSpy = sinon.spy()
    const { getByTestId } = render(
      <Navbar onToggle={toggleSpy}>
        <Toggle data-testid="test" />
      </Navbar>
    )
    const toggleElem = getByTestId("test")
    fireEvent.click(toggleElem)
    toggleSpy.should.have.been.calledOnce
    toggleSpy.should.have.been.calledWith(true)
  })
  test("Should not swallow onClick", () => {
    const clickSpy = sinon.spy()
    const { getByTestId } = render(
      <Navbar>
        <Toggle onClick={clickSpy} data-testid="test" />
      </Navbar>
    )
    const toggleElem = getByTestId("test")
    fireEvent.click(toggleElem)
    clickSpy.should.have.been.calledOnce
  })
  test("Should render collapse", () => {
    const { getByTestId } = render(
      <Navbar>
        <Collapse data-testid="test">hello</Collapse>
      </Navbar>
    )
    getByTestId("test").classList.contains("navbar-collapse").should.be.true
  })
  test("Should pass expanded to Collapse", () => {
    const { getByTestId } = render(
      <Navbar expanded>
        <Collapse data-testid="test">hello</Collapse>
      </Navbar>
    )
    const toggleElem = getByTestId("test")
    toggleElem.classList.contains("show").should.be.true
  })
  test("Should wire the toggle to the collapse", done => {
    const clock = sinon.useFakeTimers()
    const { getByTestId } = render(
      <Navbar>
        <Toggle data-testid="toggler" />
        <Collapse data-testid="collapse">hello</Collapse>
      </Navbar>
    )
    let toggleElem = getByTestId("toggler")
    let collapseElem = getByTestId("collapse")
    collapseElem.classList.contains("show").should.be.false
    toggleElem.classList.contains("collapsed").should.be.true
    fireEvent.click(toggleElem)
    clock.tick(500)
    toggleElem = getByTestId("toggler")
    collapseElem = getByTestId("collapse")
    collapseElem.classList.contains("show").should.be.true
    toggleElem.classList.contains("collapsed").should.be.false
    clock.restore()
    done()
  })
  test("Should open external href link in collapseOnSelect", () => {
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
    spy.should.have.been.calledOnce
    getByTestId("test")
      .getAttribute("href")!
      .should.equal("https://www.google.com")
  })
  test("Should fire external href click", done => {
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
  test("Should collapseOnSelect & fire Nav subcomponent onSelect event if expanded", () => {
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
    navItemSpy.should.have.been.calledOnce
    toggleSpy.should.have.been.calledOnce
    toggleSpy.should.have.been.calledWith(false)
  })
  test("Should fire onSelect with eventKey for nav children", () => {
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
    navItemSpy.should.have.been.calledOnce
    selectSpy.should.have.been.calledOnce
    selectSpy.should.have.been.calledWith("#home")
  })
  test("Should have nav as default component", () => {
    const { getByTestId } = render(<Navbar data-testid="test" />)
    getByTestId("test").tagName.toLowerCase().should.equal("nav")
  })
  test("Should render correctly when expand is a string", () => {
    const { getByTestId } = render(<Navbar expand="sm" data-testid="test" />)
    getByTestId("test").classList.contains("navbar-expand-sm").should.be.true
  })
  test("should allow custom breakpoints for expand", () => {
    const { getByTestId } = render(
      <Navbar expand="custom" data-testid="test" />
    )
    getByTestId("test").classList.contains("navbar-expand-custom").should.be
      .true
  })
  test("Should render correctly when bg is set", () => {
    const { getByTestId } = render(<Navbar bg="light" data-testid="test" />)
    getByTestId("test").classList.contains("bg-light").should.be.true
  })
  test("Should render correctly when sticky is set", () => {
    const { getByTestId } = render(<Navbar sticky="top" data-testid="test" />)
    getByTestId("test").classList.contains("sticky-top").should.be.true
  })
})

describe("<Brand>", () => {
  test("Should create Brand SPAN element", () => {
    const { getByTestId } = render(<Brand data-testid="test">Brand</Brand>)
    const BrandElem = getByTestId("test")
    BrandElem.tagName.toLowerCase().should.equal("span")
    BrandElem.classList.contains("navbar-brand").should.be.true
  })
  test("Should create Brand A (link) element", () => {
    const { getByTestId } = render(
      <Brand href="/foo" data-testid="test">
        BrandLink
      </Brand>
    )
    const BrandElem = getByTestId("test")
    BrandElem.tagName.toLowerCase().should.equal("a")
    BrandElem.classList.contains("navbar-brand").should.be.true
  })
})

describe("<Toggle>", () => {
  test("Should have button as default component", () => {
    const { getByTestId } = render(<Toggle data-testid="test" />)
    getByTestId("test").tagName.toLowerCase().should.equal("button")
  })
})
