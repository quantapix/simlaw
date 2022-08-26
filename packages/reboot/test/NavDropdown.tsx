import { render } from "@testing-library/react"
import Item from "../src/Item"
import { Nav } from "../src/Nav.jsx"
import { Navbar } from "../src/Navbar.jsx"
import { Dropdown } from "../src/Dropdown.jsx"

describe("<Dropdown>", () => {
  it("Should render li when in nav", () => {
    const { getByTestId } = render(
      <Dropdown
        defaultShow
        title="Title"
        className="test-class"
        id="nav-test"
        data-testid="test"
      >
        <Item eventKey="1">Item 1 content</Item>
        <Item eventKey="2">Item 2 content</Item>
      </Dropdown>
    )
    const DropdownElem = getByTestId("test")
    expect(DropdownElem.classList.contains("dropdown")).toBe(true)
    expect(DropdownElem.classList.contains("test-class")).toBe(true)
    expect(DropdownElem.firstElementChild!.classList.contains("nav-link")).to.be
      .true
    expect(DropdownElem.firstElementChild!.textContent!).toEqual("Title")
  })
  it("renders active toggle", () => {
    const { getByTestId } = render(
      <Dropdown
        defaultShow
        active
        title="Title"
        id="nav-test"
        data-testid="test"
      >
        <Item eventKey="1">Item 1 content</Item>
        <Item eventKey="2">Item 2 content</Item>
      </Dropdown>
    )
    const DropdownElem = getByTestId("test")
    expect(DropdownElem.firstElementChild!.classList.contains("active")).toBe(
      true
    )
  })
  it("Should handle child active state", () => {
    const { getByTestId } = render(
      <Nav defaultActiveKey="2">
        <Dropdown defaultShow id="test-id" title="title">
          <Item eventKey="1">Item 1 content</Item>
          <Item eventKey="2" data-testid="test">
            Item 2 content
          </Item>
          <Item eventKey="3">Item 3 content</Item>
        </Dropdown>
      </Nav>
    )
    expect(getByTestId("test").textContent!).toEqual("Item 2 content")
  })
  it("Should pass the id to the NavLink element", () => {
    const { getByTestId } = render(
      <Dropdown id="test-id" title="title" data-testid="test">
        <Item eventKey="1">Item 1 content</Item>
      </Dropdown>
    )
    expect(getByTestId("test").firstElementChild!.id).toEqual("test-id")
  })
  it("Should support as as prop", () => {
    const { getByTestId } = render(
      <Dropdown as="li" id="test-id" title="title" data-testid="test">
        <Item eventKey="1">Item 1</Item>
      </Dropdown>
    )
    expect(getByTestId("test").tagName.toLowerCase()).toEqual("li")
  })
  it("passes menuVariant to dropdown menu", () => {
    render(
      <Dropdown renderMenuOnMount title="blah" menuVariant="dark" id="test">
        <Item>Item 1</Item>
      </Dropdown>
    )
    expect(document.querySelector(".dropdown-menu-dark")!).toBeTruthy()
  })
  it("sets data-bs-popper attribute on dropdown menu", () => {
    render(
      <Navbar>
        <Dropdown renderMenuOnMount id="test-id" title="title">
          <Item>Item 1</Item>
        </Dropdown>
      </Navbar>
    )
    expect(
      document.querySelectorAll('.dropdown-menu[data-bs-popper="static"]')
        .length
    ).toEqual(1)
  })
})
