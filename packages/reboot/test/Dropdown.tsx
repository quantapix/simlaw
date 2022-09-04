import { InputGroup } from "../src/InputGroup.jsx"
import { Nav } from "../src/Nav.jsx"
import { Navbar } from "../src/Navbar.jsx"
import { render, fireEvent } from "@testing-library/react"
import * as qr from "react"
import {
  Button,
  Divider,
  Dropdown,
  Drop,
  Header,
  Item,
  Menu,
  ItemText,
  Toggle,
  getPlacement,
} from "../src/Dropdown.jsx"

describe("<Dropdown>", () => {
  const dropdownChildren = [
    <Toggle id="test-id" key="toggle">
      Child Title
    </Toggle>,
    <Menu data-testid="menu" key="menu">
      <Item data-testid="item1">Item 1</Item>
      <Item>Item 2</Item>
      <Item>Item 3</Item>
      <Item>Item 4</Item>
    </Menu>,
  ]
  const simpleDropdown = <Dropdown>{dropdownChildren}</Dropdown>
  it("renders div with dropdown class", () => {
    const { container: c } = render(simpleDropdown)
    expect(c.firstElementChild!.classList).toContain(["dropdown"])
  })
  ;["up", "end", "start"].forEach(x => {
    it(`renders div with drop${x} class`, () => {
      const { container: c } = render(
        <Dropdown title="Dropup" drop={x as Drop}>
          {dropdownChildren}
        </Dropdown>
      )
      expect(c.firstElementChild!.classList).not.toContain(["dropdown"])
      expect(c.firstElementChild!.classList).toContain([`drop${x}`])
    })
  })
  it("renders toggle with Toggle", () => {
    const { getByText } = render(simpleDropdown)
    const y = getByText("Child Title")
    expect(y.getAttribute("aria-expanded")!).toEqual("false")
    expect(y.id).toBeTruthy()
  })
  it('forwards align="end" to menu', () => {
    const X = qr.forwardRef<any, any>(
      ({ show: _, close: _1, align, ...props }, ref) => (
        <div {...props} data-align={align} ref={ref} />
      )
    )
    const { container: c } = render(
      <Dropdown align="end" show>
        <Toggle id="test-id" key="toggle">
          Child Title
        </Toggle>
        <X key="menu" as={Menu}>
          <Item>Item 1</Item>
        </X>
      </Dropdown>
    )
    expect(c.querySelector('[data-align="end"]')!).toBeTruthy()
  })
  it("toggles open/closed when clicked", () => {
    const { container, getByText, getByTestId } = render(simpleDropdown)
    const dropdown = container.firstElementChild!
    const y = getByText("Child Title")
    expect(dropdown.classList).not.toContain(["show"])
    fireEvent.click(y)
    expect(dropdown.classList).toContain(["show"])
    expect(getByTestId("menu").classList).toContain(["dropdown-menu", "show"])
    fireEvent.click(y)
    expect(dropdown.classList).not.toContain(["show"])
    expect(y.getAttribute("aria-expanded")!).toEqual("false")
  })
  it("closes when child Item is selected", () => {
    const mock = jest.fn()
    const { container: c, getByTestId } = render(
      <Dropdown show onToggle={mock}>
        <Toggle id="test-id" key="toggle">
          Child Title
        </Toggle>
        <Menu data-testid="menu" key="menu">
          <Item data-testid="item1">Item 1</Item>
          <Item>Item 2</Item>
          <Item>Item 3</Item>
          <Item>Item 4</Item>
        </Menu>
      </Dropdown>
    )
    expect(c.firstElementChild!.classList).toContain(["show"])
    fireEvent.click(getByTestId("item1"))
    expect(mock).toHaveBeenCalledWith(false)
  })
  it("has aria-labelledby same id as toggle button", () => {
    const { getByTestId } = render(
      <Dropdown show>
        <Toggle data-testid="toggle">Toggle</Toggle>
        <Menu data-testid="menu" key="menu">
          <Item data-testid="item1">Item 1</Item>
        </Menu>
      </Dropdown>
    )
    expect(getByTestId("toggle").id).toEqual(
      getByTestId("menu").getAttribute("aria-labelledby")
    )
  })
  describe("DOM event and source passed to onToggle", () => {
    it("passes open, event, and source correctly when opened with click", () => {
      const mock = jest.fn()
      const { getByText } = render(
        <Dropdown onToggle={mock}>{dropdownChildren}</Dropdown>
      )
      expect(mock).not.toHaveBeenCalled()
      fireEvent.click(getByText("Child Title"))
      expect(mock).toHaveBeenCalledTimes(1)
      expect(mock.mock.calls[0].args.length).toEqual(2)
      expect(mock.mock.calls[0].args[0]).toEqual(true)
      expect(mock.mock.calls[0].args[1].source).toEqual("click")
    })
    it("passes open, event, and source correctly when closed with click", () => {
      const mock = jest.fn()
      const { getByText } = render(
        <Dropdown show onToggle={mock}>
          {dropdownChildren}
        </Dropdown>
      )
      const y = getByText("Child Title")
      expect(mock).not.toHaveBeenCalled()
      fireEvent.click(y)
      expect(mock.mock.calls[0].args.length).toEqual(2)
      expect(mock.mock.calls[0].args[0]).toEqual(false)
      expect(mock.mock.calls[0].args[1].source).toEqual("click")
    })
    it("passes open, event, and source correctly when child selected", () => {
      const mock = jest.fn()
      const { getByTestId } = render(
        <Dropdown onToggle={mock}>
          <Toggle data-testid="toggle">Toggle</Toggle>
          <Menu>
            <Item eventKey={1} data-testid="item1">
              Item 1
            </Item>
          </Menu>
        </Dropdown>
      )
      fireEvent.click(getByTestId("toggle"))
      expect(mock).toHaveBeenCalled()
      fireEvent.click(getByTestId("item1"))
      expect(mock).toHaveBeenCalledTimes(2)
      expect(mock.mock.calls[1].args.length).toEqual(2)
      expect(mock.mock.calls[1].args[0]).toEqual(false)
      expect(mock.mock.calls[1].args[1].source).toEqual("select")
    })
    it("passes open, event, and source correctly when opened with keydown", () => {
      const mock = jest.fn()
      const { getByTestId } = render(
        <Dropdown onToggle={mock}>
          <Toggle data-testid="toggle">Toggle</Toggle>
          <Menu>
            <Item eventKey={1} data-testid="item1">
              Item 1
            </Item>
          </Menu>
        </Dropdown>
      )
      fireEvent.keyDown(getByTestId("toggle"), { key: "ArrowDown" })
      expect(mock).toHaveBeenCalledTimes(1)
      expect(mock.mock.calls[0].args.length).toEqual(2)
      expect(mock.mock.calls[0].args[0]).toEqual(true)
      expect(mock.mock.calls[0].args[1].source).toEqual("keydown")
    })
  })
  it("Should use each components bsPrefix", () => {
    const { getByTestId } = render(
      <Dropdown defaultShow bsPrefix="my-dropdown" data-testid="dropdown">
        <Toggle data-testid="toggle" bsPrefix="my-toggle">
          Child Title
        </Toggle>
        <Menu data-testid="menu" bsPrefix="my-menu">
          <Item>Item 1</Item>
        </Menu>
      </Dropdown>
    )
    expect(getByTestId("dropdown").classList).toContain(["show", "my-dropdown"])
    expect(getByTestId("toggle").classList).toContain(["my-toggle"])
    expect(getByTestId("menu").classList).toContain(["my-menu"])
  })
  it("Should have div as default component", () => {
    const { getByTestId } = render(
      <Dropdown defaultShow bsPrefix="my-dropdown" data-testid="dropdown">
        <Toggle data-testid="toggle" bsPrefix="my-toggle">
          Child Title
        </Toggle>
        <Menu data-testid="menu" bsPrefix="my-menu">
          <Item>Item 1</Item>
        </Menu>
      </Dropdown>
    )
    expect(getByTestId("dropdown").tagName).toEqual("DIV")
  })
  it("Should also accept a custom component", () => {
    const ref = qr.forwardRef<any, any>(({ show, close, ...props }, ref) => (
      <div ref={ref} id="custom-component" {...props} />
    ))
    const { getByTestId } = render(
      <Menu data-testid="menu" show as={ref}>
        <Item>Example Item</Item>
      </Menu>
    )
    expect(getByTestId("menu").id).toEqual("custom-component")
  })
  describe("InputGroup Dropdowns", () => {
    it("Should not render a .dropdown element when inside input group", () => {
      const { queryByTestId } = render(
        <InputGroup>
          <Dropdown data-testid="dropdown">{dropdownChildren}</Dropdown>
        </InputGroup>
      )
      expect(queryByTestId("dropdown")!).not.toBeTruthy()
    })
    it("Should render .show on the dropdown toggle", () => {
      const { getByText } = render(
        <InputGroup>
          <Dropdown show>{dropdownChildren}</Dropdown>
        </InputGroup>
      )
      expect(getByText("Child Title").classList.contains("show")).toBe(true)
    })
  })
  describe("autoClose behaviour", () => {
    describe('autoClose="true"', () => {
      it("Should close on outer click", () => {
        const mock = jest.fn()
        render(
          <Dropdown defaultShow onToggle={mock} autoClose>
            <Toggle>Toggle</Toggle>
            <Menu>
              <Item>Item 1</Item>
            </Menu>
          </Dropdown>
        )
        fireEvent.click(document.body)
        expect(mock).toHaveBeenCalledWith(false)
      })
    })
    describe('autoClose="inside"', () => {
      it("Should close on child selection", () => {
        const mock = jest.fn()
        const { getByTestId } = render(
          <Dropdown defaultShow onToggle={mock} autoClose="inside">
            <Toggle>Toggle</Toggle>
            <Menu>
              <Item data-testid="item1">Item 1</Item>
            </Menu>
          </Dropdown>
        )
        fireEvent.click(getByTestId("item1"))
        expect(mock).toHaveBeenCalledWith(false)
      })
      it("Should not close on outer click", () => {
        const mock = jest.fn()
        render(
          <Dropdown defaultShow onToggle={mock} autoClose="inside">
            <Toggle>Toggle</Toggle>
            <Menu>
              <Item>Item 1</Item>
            </Menu>
          </Dropdown>
        )
        fireEvent.click(document.body)
        expect(mock).not.toHaveBeenCalled()
      })
    })
    describe('autoClose="outside"', () => {
      it("Should not close on child selection", () => {
        const mock = jest.fn()
        const { getByTestId } = render(
          <Dropdown defaultShow onToggle={mock} autoClose="outside">
            <Toggle>Toggle</Toggle>
            <Menu>
              <Item data-testid="item1">Item 1</Item>
            </Menu>
          </Dropdown>
        )
        fireEvent.click(getByTestId("item1"))
        expect(mock).not.toHaveBeenCalled()
      })
      it("Should close on outer click", () => {
        const mock = jest.fn()
        render(
          <Dropdown defaultShow onToggle={mock} autoClose="outside">
            <Toggle>Toggle</Toggle>
            <Menu>
              <Item>Item 1</Item>
            </Menu>
          </Dropdown>
        )
        fireEvent.click(document.body)
        expect(mock).toHaveBeenCalledWith(false)
      })
    })
    describe('autoClose="false"', () => {
      it("Should not close on child selection", () => {
        const mock = jest.fn()
        const { getByTestId } = render(
          <Dropdown defaultShow onToggle={mock} autoClose={false}>
            <Toggle>Toggle</Toggle>
            <Menu>
              <Item data-testid="item1">Item 1</Item>
            </Menu>
          </Dropdown>
        )
        fireEvent.click(getByTestId("item1"))
        expect(mock).not.toHaveBeenCalled()
      })
      it("Should not close on outer click", () => {
        const mock = jest.fn()
        render(
          <Dropdown defaultShow onToggle={mock} autoClose={false}>
            <Toggle>Toggle</Toggle>
            <Menu>
              <Item>Item 1</Item>
            </Menu>
          </Dropdown>
        )
        fireEvent.click(document.body)
        expect(mock).not.toHaveBeenCalled()
      })
    })
  })
})
describe("<Button>", () => {
  it("renders a toggle with the title prop", () => {
    const { getByTestId } = render(
      <Button title="Simple Dropdown" data-testid="test-id">
        <Item>Item 1</Item>
        <Item>Item 2</Item>
        <Item>Item 3</Item>
        <Item>Item 4</Item>
      </Button>
    )
    expect(getByTestId("test-id").textContent!).toEqual("Simple Dropdown")
  })
  it("renders single Item child", () => {
    const { getByText } = render(
      <Button defaultShow title="Single child">
        <Item>Item 1</Item>
      </Button>
    )
    getByText("Item 1")
  })
  it('forwards align="end" to the Dropdown', () => {
    const { container } = render(
      <Button defaultShow align="end" title="blah">
        <Item>Item 1</Item>
      </Button>
    )
    const y = container.querySelector("div[x-placement]")
    expect(y!.classList.contains("dropdown-menu-end")).toBe(true)
  })
  it("passes variant and size to the toggle", () => {
    const { getByTestId } = render(
      <Button title="blah" size="sm" variant="success" data-testid="test-id">
        <Item>Item 1</Item>
      </Button>
    )
    const y = getByTestId("test-id").firstElementChild!
    expect(y.classList.contains("btn-success")).toBe(true)
    expect(y.classList.contains("btn-sm")).toBe(true)
  })
  it("passes menuVariant to dropdown menu", () => {
    const { container } = render(
      <Button defaultShow title="blah" menuVariant="dark">
        <Item>Item 1</Item>
      </Button>
    )
    const y = container.querySelector("div[x-placement]")
    expect(y!.classList.contains("dropdown-menu-dark")).toBe(true)
  })
  it("forwards onSelect handler to Items", () => {
    const mock = jest.fn()
    const { getByTestId } = render(
      <Button defaultShow title="Simple Dropdown" onSelect={mock}>
        <Item eventKey="1" data-testid="key1">
          Item 1
        </Item>
        <Item eventKey="2" data-testid="key2">
          Item 2
        </Item>
        <Item eventKey="3" data-testid="key3">
          Item 3
        </Item>
      </Button>
    )
    fireEvent.click(getByTestId("key1"))
    expect(mock).toHaveBeenCalledWith("1")
    fireEvent.click(getByTestId("key2"))
    expect(mock).toHaveBeenCalledWith("2")
    fireEvent.click(getByTestId("key3"))
    expect(mock).toHaveBeenCalledWith("3")
    expect(mock).toHaveBeenCalledTimes(3)
  })
  it("does not close when onToggle is controlled", () => {
    const mock = jest.fn()
    const { container, getByTestId } = render(
      <Button
        show
        title="Simple Dropdown"
        onToggle={mock}
        data-testid="test-id"
      >
        <Item eventKey="1" data-testid="key1">
          Item 1
        </Item>
      </Button>
    )
    fireEvent.click(getByTestId("test-id").firstElementChild!)
    fireEvent.click(getByTestId("key1"))
    expect(mock).toHaveBeenCalledWith(false)
    const y = container.querySelector("div[x-placement]")
    expect(y!).toBeTruthy()
  })
  it("Should pass disabled to button", () => {
    const { container } = render(
      <Button disabled title="Title">
        <Item eventKey="1">Item 1</Item>
        <Item eventKey="2">Item 2</Item>
      </Button>
    )
    expect(container.querySelector("button[disabled]")!).toBeTruthy()
  })
  it("Should pass bsPrefix to the button", () => {
    const { getByTestId } = render(
      <Button title="title" data-testid="test-id" bsPrefix="my-button">
        <Item eventKey="1">Item 1</Item>
      </Button>
    )
    const y = getByTestId("test-id").firstElementChild!
    expect(y.classList.contains("my-button-primary")).toBe(true)
  })
})
describe("<Item>", () => {
  it("renders divider", () => {
    const { getByRole } = render(<Divider />)
    getByRole("separator")
  })
  it("renders divider className and style", () => {
    const { getByRole } = render(
      <Divider className="foo bar" style={{ height: "100px" }} />
    )
    const y = getByRole("separator")
    expect(y.className).toMatch(/\bfoo bar dropdown-divider\b/)
    expect(y.style.height).toEqual("100px")
  })
  it("renders header", () => {
    const { getByRole } = render(<Header>Header text</Header>)
    expect(getByRole("heading").textContent!).toEqual("Header text")
  })
  it("renders header className and style", () => {
    const { getByText } = render(
      <Header className="foo bar" style={{ height: "100px" }}>
        Header text
      </Header>
    )
    const y = getByText("Header text")
    expect(y.className).toMatch(/\bfoo bar dropdown-header\b/)
  })
  it("renders ItemText", () => {
    const { getByText } = render(<ItemText>My text</ItemText>)
    expect(getByText("My text").className).toEqual("dropdown-item-text")
  })
  it("renders ItemText className and style", () => {
    const { getByText } = render(
      <ItemText className="foo bar" style={{ height: "100px" }}>
        My text
      </ItemText>
    )
    const y = getByText("My text")
    expect(y.className).toMatch(/\bfoo bar dropdown-item-text\b/)
    expect(y.style.height).toEqual("100px")
  })
  it("renders menu item link", () => {
    const mock = jest.fn()
    const { getByText } = render(
      <Item onKeyDown={mock} href="/herpa-derpa">
        Item
      </Item>
    )
    const y = getByText("Item")
    expect(y.getAttribute("href")!).toEqual("/herpa-derpa")
    fireEvent.keyDown(y, { key: "a" })
    expect(mock).toHaveBeenCalled()
  })
  it("Should render as a button when set", () => {
    const { getByTestId } = render(
      <Item as={Button} variant="success" data-testid="item" />
    )
    expect(getByTestId("item").classList).toContain([
      "dropdown-item",
      "btn",
      "btn-success",
    ])
  })
  it("Should pass through props", () => {
    const { getByText } = render(
      <Item
        className="test-class"
        href="#hi-mom!"
        title="hi mom!"
        style={{ height: 100 }}
      >
        Title
      </Item>
    )
    const y = getByText("Title")
    expect(y.className).toMatch(/\btest-class\b/)
    expect(y.style.height).toEqual("100px")
    expect(y.getAttribute("href")!).toEqual("#hi-mom!")
    expect(y.getAttribute("title")!).toEqual("hi mom!")
  })
  it("Should set target attribute on anchor", () => {
    const { getByText } = render(<Item target="_blank">Title</Item>)
    expect(getByText("Title").getAttribute("target")!).toEqual("_blank")
  })
})
describe("<Dropdown.Menu>", () => {
  it("renders div with dropdown-menu class", () => {
    const { container: c } = render(
      <Menu show>
        <Item eventKey="1">Item 1</Item>
        <Item eventKey="2">Item 2</Item>
        <Item eventKey="3">Item 3</Item>
        <Item eventKey="4">Item 4</Item>
      </Menu>
    )
    expect(c.firstElementChild!.classList.contains("dropdown-menu")).toBe(true)
  })
  it("Should pass props to dropdown", () => {
    const { container: c } = render(
      <Menu show className="new-fancy-class">
        <Item eventKey="1">Item 1 content</Item>
      </Menu>
    )
    expect(c.firstElementChild!.classList.contains("new-fancy-class")).toBe(
      true
    )
  })
  it('applies align="end"', () => {
    const { container: c } = render(
      <Menu show align="end">
        <Item>Item</Item>
      </Menu>
    )
    expect(c.firstElementChild!.classList.contains("dropdown-menu-end")).toBe(
      true
    )
  })
  it("renders on mount with prop", () => {
    const { container: c } = render(
      <Menu renderOnMount>
        <Item>Item</Item>
      </Menu>
    )
    expect(c.firstElementChild!.classList.contains("dropdown-menu")).toBe(true)
  })
  it('does not add any extra classes when align="start"', () => {
    const { container: c } = render(
      <Menu show align="start">
        <Item>Item</Item>
      </Menu>
    )
    expect(c.firstElementChild!.className).toEqual("dropdown-menu show")
  })
  it("adds responsive start alignment classes", () => {
    const { container: c } = render(
      <Menu show align={{ lg: "start" }}>
        <Item>Item</Item>
      </Menu>
    )
    expect(c.firstElementChild!.classList.contains("dropdown-menu-end")).toBe(
      true
    )
    expect(
      c.firstElementChild!.classList.contains("dropdown-menu-lg-start")
    ).toBe(true)
  })
  it("adds responsive end alignment classes", () => {
    const { container: c } = render(
      <Menu show align={{ lg: "end" }}>
        <Item>Item</Item>
      </Menu>
    )
    expect(
      c.firstElementChild!.classList.contains("dropdown-menu-lg-end")
    ).toBe(true)
    expect(c.querySelector('[data-bs-popper="static"]')!).toBeTruthy()
  })
  it("allows custom responsive alignment classes", () => {
    const { container: c } = render(
      <Menu show align={{ custom: "end" }}>
        <Item>Item</Item>
      </Menu>
    )
    expect(
      c.firstElementChild!.classList.contains("dropdown-menu-custom-end")
    ).toBe(true)
  })
  it("Should render variant", () => {
    const { container: c } = render(
      <Menu show variant="dark">
        <Item>Item</Item>
      </Menu>
    )
    expect(c.firstElementChild!.classList.contains("dropdown-menu-dark")).toBe(
      true
    )
  })
  describe("getPlacement", () => {
    it("Should return top placement", () => {
      expect(getPlacement(false, "up", false)).toEqual("top-start")
      expect(getPlacement(true, "up", false)).toEqual("top-end")
    })
    it("Should return top placement for RTL", () => {
      expect(getPlacement(false, "up", true)).toEqual("top-end")
      expect(getPlacement(true, "up", true)).toEqual("top-start")
    })
    it("Should return end placement", () => {
      expect(getPlacement(false, "end", false)).toEqual("right-start")
      expect(getPlacement(true, "end", false)).toEqual("right-end")
    })
    it("Should return end placement for RTL", () => {
      expect(getPlacement(false, "end", true)).toEqual("left-start")
      expect(getPlacement(true, "end", true)).toEqual("left-end")
    })
    it("Should return bottom placement", () => {
      expect(getPlacement(false, "down", false)).toEqual("bottom-start")
      expect(getPlacement(true, "down", false)).toEqual("bottom-end")
    })
    it("Should return bottom placement for RTL", () => {
      expect(getPlacement(false, "down", true)).toEqual("bottom-end")
      expect(getPlacement(true, "down", true)).toEqual("bottom-start")
    })
    it("Should return start placement", () => {
      expect(getPlacement(false, "start", false)).toEqual("left-start")
      expect(getPlacement(true, "start", false)).toEqual("left-end")
    })
    it("Should return start placement for RTL", () => {
      expect(getPlacement(false, "start", true)).toEqual("right-start")
      expect(getPlacement(true, "start", true)).toEqual("right-end")
    })
  })
})
describe("<Toggle>", () => {
  it("renders toggle button", () => {
    const { getByText } = render(<Toggle id="test-id">herpa derpa</Toggle>)
    const y = getByText("herpa derpa")
    expect(y.getAttribute("aria-expanded")!).toEqual("false")
    expect(y.classList).toContain(["dropdown-toggle", "btn", "btn-primary"])
  })
  it("renders children", () => {
    const { getByText } = render(
      <Toggle id="test-id">
        <h3>herpa derpa</h3>
      </Toggle>
    )
    expect(getByText("herpa derpa")).toBeTruthy()
  })
  it("forwards onClick handler", () => {
    const mock = jest.fn()
    const { container } = render(
      <Toggle id="test-id" title="click forwards" onClick={mock} />
    )
    fireEvent.click(container.firstElementChild!)
    expect(mock).toHaveBeenCalled()
  })
  it("forwards id", () => {
    const { container } = render(<Toggle id="testid" />)
    expect(container.firstElementChild!.id).toEqual("testid")
  })
  it("does not forward bsPrefix", () => {
    const { container: c } = render(
      <Toggle bsPrefix="my-custom-bsPrefix" title="bsClass" id="test-id" />
    )
    expect(c.firstElementChild!.classList).toContain([
      "my-custom-bsPrefix",
      "btn",
    ])
  })
})
describe("<Dropdown>", () => {
  it("Should render li when in nav", () => {
    const { getByTestId } = render(
      <Dropdown
        className="test-class"
        data-testid="test"
        defaultShow
        id="nav-test"
        title="Title"
      >
        <Item eventKey="1">Item 1 content</Item>
        <Item eventKey="2">Item 2 content</Item>
      </Dropdown>
    )
    const y = getByTestId("test")
    expect(y.classList.contains("dropdown")).toBe(true)
    expect(y.classList.contains("test-class")).toBe(true)
    expect(y.firstElementChild!.classList.contains("nav-link")).toBe(true)
    expect(y.firstElementChild!.textContent!).toEqual("Title")
  })
  it("renders active toggle", () => {
    const { getByTestId } = render(
      <Dropdown
        /* active  */
        data-testid="test"
        defaultShow
        id="nav-test"
        title="Title"
      >
        <Item eventKey="1">Item 1 content</Item>
        <Item eventKey="2">Item 2 content</Item>
      </Dropdown>
    )
    const y = getByTestId("test")
    expect(y.firstElementChild!.classList.contains("active")).toBe(true)
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
      <Dropdown
        renderMenuOnMount
        title="blah"
        /* menuVariant="dark" */ id="test"
      >
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
