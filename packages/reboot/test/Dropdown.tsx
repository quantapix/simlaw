import { render, fireEvent } from "@testing-library/react"
import * as React from "react"
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
import { InputGroup } from "../src/InputGroup.jsx"

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
  test("renders div with dropdown class", () => {
    const { container } = render(simpleDropdown)
    container.firstElementChild!.classList.should.contain(["dropdown"])
  })
  ;["up", "end", "start"].forEach((dir: Drop) => {
    test(`renders div with drop${dir} class`, () => {
      const { container } = render(
        <Dropdown title="Dropup" drop={dir}>
          {dropdownChildren}
        </Dropdown>
      )
      container.firstElementChild!.classList.should.not.contain(["dropdown"])
      container.firstElementChild!.classList.should.contain([`drop${dir}`])
    })
  })
  test("renders toggle with Toggle", () => {
    const { getByText } = render(simpleDropdown)
    const toggle = getByText("Child Title")
    toggle.getAttribute("aria-expanded")!.should.equal("false")
    toggle.id.should.be.ok
  })
  test('forwards align="end" to menu', () => {
    const X = React.forwardRef<any, any>(
      ({ show: _, close: _1, align, ...props }, ref) => (
        <div {...props} data-align={align} ref={ref} />
      )
    )
    const { container } = render(
      <Dropdown align="end" show>
        <Toggle id="test-id" key="toggle">
          Child Title
        </Toggle>
        <X key="menu" as={Menu}>
          <Item>Item 1</Item>
        </X>
      </Dropdown>
    )
    container.querySelector('[data-align="end"]')!.should.exist
  })
  test("toggles open/closed when clicked", () => {
    const { container, getByText, getByTestId } = render(simpleDropdown)
    const dropdown = container.firstElementChild!
    const toggle = getByText("Child Title")
    dropdown.classList.should.not.contain(["show"])
    fireEvent.click(toggle)
    dropdown.classList.should.contain(["show"])
    getByTestId("menu").classList.should.contain(["dropdown-menu", "show"])
    fireEvent.click(toggle)
    dropdown.classList.should.not.contain(["show"])
    toggle.getAttribute("aria-expanded")!.should.equal("false")
  })
  test("closes when child Item is selected", () => {
    const onToggleSpy = sinon.spy()
    const { container, getByTestId } = render(
      <Dropdown show onToggle={onToggleSpy}>
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
    container.firstElementChild!.classList.should.contain(["show"])
    fireEvent.click(getByTestId("item1"))
    onToggleSpy.should.have.been.calledWith(false)
  })
  test("has aria-labelledby same id as toggle button", () => {
    const { getByTestId } = render(
      <Dropdown show>
        <Toggle data-testid="toggle">Toggle</Toggle>
        <Menu data-testid="menu" key="menu">
          <Item data-testid="item1">Item 1</Item>
        </Menu>
      </Dropdown>
    )
    getByTestId("toggle").id.should.equal(
      getByTestId("menu").getAttribute("aria-labelledby")
    )
  })
  describe("DOM event and source passed to onToggle", () => {
    test("passes open, event, and source correctly when opened with click", () => {
      const onToggleSpy = sinon.spy()
      const { getByText } = render(
        <Dropdown onToggle={onToggleSpy}>{dropdownChildren}</Dropdown>
      )
      onToggleSpy.should.not.have.been.called
      fireEvent.click(getByText("Child Title"))
      onToggleSpy.should.have.been.calledOnce
      onToggleSpy.getCall(0).args.length.should.equal(2)
      onToggleSpy.getCall(0).args[0].should.equal(true)
      onToggleSpy.getCall(0).args[1].source.should.equal("click")
    })
    test("passes open, event, and source correctly when closed with click", () => {
      const onToggleSpy = sinon.spy()
      const { getByText } = render(
        <Dropdown show onToggle={onToggleSpy}>
          {dropdownChildren}
        </Dropdown>
      )
      const toggle = getByText("Child Title")
      onToggleSpy.should.not.have.been.called
      fireEvent.click(toggle)
      onToggleSpy.getCall(0).args.length.should.equal(2)
      onToggleSpy.getCall(0).args[0].should.equal(false)
      onToggleSpy.getCall(0).args[1].source.should.equal("click")
    })
    test("passes open, event, and source correctly when child selected", () => {
      const onToggleSpy = sinon.spy()
      const { getByTestId } = render(
        <Dropdown onToggle={onToggleSpy}>
          <Toggle data-testid="toggle">Toggle</Toggle>
          <Menu>
            <Item eventKey={1} data-testid="item1">
              Item 1
            </Item>
          </Menu>
        </Dropdown>
      )
      fireEvent.click(getByTestId("toggle"))
      onToggleSpy.should.have.been.called
      fireEvent.click(getByTestId("item1"))
      onToggleSpy.should.have.been.calledTwice
      onToggleSpy.getCall(1).args.length.should.equal(2)
      onToggleSpy.getCall(1).args[0].should.equal(false)
      onToggleSpy.getCall(1).args[1].source.should.equal("select")
    })
    test("passes open, event, and source correctly when opened with keydown", () => {
      const onToggleSpy = sinon.spy()
      const { getByTestId } = render(
        <Dropdown onToggle={onToggleSpy}>
          <Toggle data-testid="toggle">Toggle</Toggle>
          <Menu>
            <Item eventKey={1} data-testid="item1">
              Item 1
            </Item>
          </Menu>
        </Dropdown>
      )
      fireEvent.keyDown(getByTestId("toggle"), { key: "ArrowDown" })
      onToggleSpy.should.have.been.calledOnce
      onToggleSpy.getCall(0).args.length.should.equal(2)
      onToggleSpy.getCall(0).args[0].should.equal(true)
      onToggleSpy.getCall(0).args[1].source.should.equal("keydown")
    })
  })
  test("should use each components bsPrefix", () => {
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
    getByTestId("dropdown").classList.should.contain(["show", "my-dropdown"])
    getByTestId("toggle").classList.should.contain(["my-toggle"])
    getByTestId("menu").classList.should.contain(["my-menu"])
  })
  test("Should have div as default component", () => {
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
    getByTestId("dropdown").tagName.should.equal("DIV")
  })
  test("Should also accept a custom component", () => {
    const customComponent = React.forwardRef<any, any>(
      (
        {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          show,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          close,
          ...props
        },
        ref
      ) => <div ref={ref} id="custom-component" {...props} />
    )
    const { getByTestId } = render(
      <Menu data-testid="menu" show as={customComponent}>
        <Item>Example Item</Item>
      </Menu>
    )
    getByTestId("menu").id.should.equal("custom-component")
  })
  describe("InputGroup Dropdowns", () => {
    test("should not render a .dropdown element when inside input group", () => {
      const { queryByTestId } = render(
        <InputGroup>
          <Dropdown data-testid="dropdown">{dropdownChildren}</Dropdown>
        </InputGroup>
      )
      expect(queryByTestId("dropdown")!).not.to.exist
    })
    test("should render .show on the dropdown toggle", () => {
      const { getByText } = render(
        <InputGroup>
          <Dropdown show>{dropdownChildren}</Dropdown>
        </InputGroup>
      )
      getByText("Child Title").classList.contains("show").should.be.true
    })
  })
  describe("autoClose behaviour", () => {
    describe('autoClose="true"', () => {
      test("should close on outer click", () => {
        const onToggleSpy = sinon.spy()
        render(
          <Dropdown defaultShow onToggle={onToggleSpy} autoClose>
            <Toggle>Toggle</Toggle>
            <Menu>
              <Item>Item 1</Item>
            </Menu>
          </Dropdown>
        )
        fireEvent.click(document.body)
        onToggleSpy.should.have.been.calledWith(false)
      })
    })
    describe('autoClose="inside"', () => {
      test("should close on child selection", () => {
        const onToggleSpy = sinon.spy()
        const { getByTestId } = render(
          <Dropdown defaultShow onToggle={onToggleSpy} autoClose="inside">
            <Toggle>Toggle</Toggle>
            <Menu>
              <Item data-testid="item1">Item 1</Item>
            </Menu>
          </Dropdown>
        )
        fireEvent.click(getByTestId("item1"))
        onToggleSpy.should.have.been.calledWith(false)
      })
      test("should not close on outer click", () => {
        const onToggleSpy = sinon.spy()
        render(
          <Dropdown defaultShow onToggle={onToggleSpy} autoClose="inside">
            <Toggle>Toggle</Toggle>
            <Menu>
              <Item>Item 1</Item>
            </Menu>
          </Dropdown>
        )
        fireEvent.click(document.body)
        onToggleSpy.should.not.have.been.called
      })
    })
    describe('autoClose="outside"', () => {
      test("should not close on child selection", () => {
        const onToggleSpy = sinon.spy()
        const { getByTestId } = render(
          <Dropdown defaultShow onToggle={onToggleSpy} autoClose="outside">
            <Toggle>Toggle</Toggle>
            <Menu>
              <Item data-testid="item1">Item 1</Item>
            </Menu>
          </Dropdown>
        )
        fireEvent.click(getByTestId("item1"))
        onToggleSpy.should.not.have.been.called
      })
      test("should close on outer click", () => {
        const onToggleSpy = sinon.spy()
        render(
          <Dropdown defaultShow onToggle={onToggleSpy} autoClose="outside">
            <Toggle>Toggle</Toggle>
            <Menu>
              <Item>Item 1</Item>
            </Menu>
          </Dropdown>
        )
        fireEvent.click(document.body)
        onToggleSpy.should.be.calledWith(false)
      })
    })
    describe('autoClose="false"', () => {
      test("should not close on child selection", () => {
        const onToggleSpy = sinon.spy()
        const { getByTestId } = render(
          <Dropdown defaultShow onToggle={onToggleSpy} autoClose={false}>
            <Toggle>Toggle</Toggle>
            <Menu>
              <Item data-testid="item1">Item 1</Item>
            </Menu>
          </Dropdown>
        )
        fireEvent.click(getByTestId("item1"))
        onToggleSpy.should.not.have.been.called
      })
      test("should not close on outer click", () => {
        const onToggleSpy = sinon.spy()
        render(
          <Dropdown defaultShow onToggle={onToggleSpy} autoClose={false}>
            <Toggle>Toggle</Toggle>
            <Menu>
              <Item>Item 1</Item>
            </Menu>
          </Dropdown>
        )
        fireEvent.click(document.body)
        onToggleSpy.should.not.have.been.called
      })
    })
  })
})
describe("<Button>", () => {
  test("renders a toggle with the title prop", () => {
    const { getByTestId } = render(
      <Button title="Simple Dropdown" data-testid="test-id">
        <Item>Item 1</Item>
        <Item>Item 2</Item>
        <Item>Item 3</Item>
        <Item>Item 4</Item>
      </Button>
    )
    getByTestId("test-id").textContent!.should.equal("Simple Dropdown")
  })
  test("renders single Item child", () => {
    const { getByText } = render(
      <Button defaultShow title="Single child">
        <Item>Item 1</Item>
      </Button>
    )
    getByText("Item 1")
  })
  test('forwards align="end" to the Dropdown', () => {
    const { container } = render(
      <Button defaultShow align="end" title="blah">
        <Item>Item 1</Item>
      </Button>
    )
    const menu = container.querySelector("div[x-placement]")
    menu!.classList.contains("dropdown-menu-end").should.be.true
  })
  test("passes variant and size to the toggle", () => {
    const { getByTestId } = render(
      <Button title="blah" size="sm" variant="success" data-testid="test-id">
        <Item>Item 1</Item>
      </Button>
    )
    const button = getByTestId("test-id").firstElementChild!
    button.classList.contains("btn-success").should.be.true
    button.classList.contains("btn-sm").should.be.true
  })
  test("passes menuVariant to dropdown menu", () => {
    const { container } = render(
      <Button defaultShow title="blah" menuVariant="dark">
        <Item>Item 1</Item>
      </Button>
    )
    const menu = container.querySelector("div[x-placement]")
    menu!.classList.contains("dropdown-menu-dark").should.be.true
  })
  test("forwards onSelect handler to Items", () => {
    const onSelectSpy = sinon.spy()
    const { getByTestId } = render(
      <Button defaultShow title="Simple Dropdown" onSelect={onSelectSpy}>
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
    onSelectSpy.should.be.calledWith("1")
    fireEvent.click(getByTestId("key2"))
    onSelectSpy.should.be.calledWith("2")
    fireEvent.click(getByTestId("key3"))
    onSelectSpy.should.be.calledWith("3")
    onSelectSpy.should.be.calledThrice
  })
  test("does not close when onToggle is controlled", () => {
    const onSelectSpy = sinon.spy()
    const { container, getByTestId } = render(
      <Button
        show
        title="Simple Dropdown"
        onToggle={onSelectSpy}
        data-testid="test-id"
      >
        <Item eventKey="1" data-testid="key1">
          Item 1
        </Item>
      </Button>
    )
    fireEvent.click(getByTestId("test-id").firstElementChild!)
    fireEvent.click(getByTestId("key1"))
    onSelectSpy.should.have.been.calledWith(false)
    const menu = container.querySelector("div[x-placement]")
    menu!.should.exist
  })
  test("Should pass disabled to button", () => {
    const { container } = render(
      <Button disabled title="Title">
        <Item eventKey="1">Item 1</Item>
        <Item eventKey="2">Item 2</Item>
      </Button>
    )
    container.querySelector("button[disabled]")!.should.exist
  })
  test("should pass bsPrefix to the button", () => {
    const { getByTestId } = render(
      <Button title="title" data-testid="test-id" bsPrefix="my-button">
        <Item eventKey="1">Item 1</Item>
      </Button>
    )
    const button = getByTestId("test-id").firstElementChild!
    button.classList.contains("my-button-primary").should.be.true
  })
})
describe("<Item>", () => {
  test("renders divider", () => {
    const { getByRole } = render(<Divider />)
    getByRole("separator")
  })
  test("renders divider className and style", () => {
    const { getByRole } = render(
      <Divider className="foo bar" style={{ height: "100px" }} />
    )
    const node = getByRole("separator")
    node.className.should.match(/\bfoo bar dropdown-divider\b/)
    node.style.height.should.equal("100px")
  })
  test("renders header", () => {
    const { getByRole } = render(<Header>Header text</Header>)
    getByRole("heading").textContent!.should.equal("Header text")
  })
  test("renders header className and style", () => {
    const { getByText } = render(
      <Header className="foo bar" style={{ height: "100px" }}>
        Header text
      </Header>
    )
    const node = getByText("Header text")
    node.className.should.match(/\bfoo bar dropdown-header\b/)
  })
  test("renders ItemText", () => {
    const { getByText } = render(<ItemText>My text</ItemText>)
    getByText("My text").className.should.equal("dropdown-item-text")
  })
  test("renders ItemText className and style", () => {
    const { getByText } = render(
      <ItemText className="foo bar" style={{ height: "100px" }}>
        My text
      </ItemText>
    )
    const node = getByText("My text")
    node.className.should.match(/\bfoo bar dropdown-item-text\b/)
    node.style.height.should.equal("100px")
  })
  test("renders menu item link", () => {
    const onKeyDownSpy = sinon.spy()
    const { getByText } = render(
      <Item onKeyDown={onKeyDownSpy} href="/herpa-derpa">
        Item
      </Item>
    )
    const node = getByText("Item")
    node.getAttribute("href")!.should.equal("/herpa-derpa")
    fireEvent.keyDown(node, { key: "a" })
    onKeyDownSpy.should.be.called
  })
  test("should render as a button when set", () => {
    const { getByTestId } = render(
      <Item as={Button} variant="success" data-testid="item" />
    )
    getByTestId("item").classList.should.contain([
      "dropdown-item",
      "btn",
      "btn-success",
    ])
  })
  test("should pass through props", () => {
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
    const node = getByText("Title")
    node.className.should.match(/\btest-class\b/)
    node.style.height.should.equal("100px")
    node.getAttribute("href")!.should.equal("#hi-mom!")
    node.getAttribute("title")!.should.equal("hi mom!")
  })
  test("Should set target attribute on anchor", () => {
    const { getByText } = render(<Item target="_blank">Title</Item>)
    getByText("Title").getAttribute("target")!.should.equal("_blank")
  })
})
describe("<Dropdown.Menu>", () => {
  test("renders div with dropdown-menu class", () => {
    const { container } = render(
      <Menu show>
        <Item eventKey="1">Item 1</Item>
        <Item eventKey="2">Item 2</Item>
        <Item eventKey="3">Item 3</Item>
        <Item eventKey="4">Item 4</Item>
      </Menu>
    )
    container.firstElementChild!.classList.contains("dropdown-menu").should.be
      .true
  })
  test("Should pass props to dropdown", () => {
    const { container } = render(
      <Menu show className="new-fancy-class">
        <Item eventKey="1">Item 1 content</Item>
      </Menu>
    )
    container.firstElementChild!.classList.contains("new-fancy-class").should.be
      .true
  })
  test('applies align="end"', () => {
    const { container } = render(
      <Menu show align="end">
        <Item>Item</Item>
      </Menu>
    )
    container.firstElementChild!.classList.contains("dropdown-menu-end").should
      .be.true
  })
  test("renders on mount with prop", () => {
    const { container } = render(
      <Menu renderOnMount>
        <Item>Item</Item>
      </Menu>
    )
    container.firstElementChild!.classList.contains("dropdown-menu").should.be
      .true
  })
  test('does not add any extra classes when align="start"', () => {
    const { container } = render(
      <Menu show align="start">
        <Item>Item</Item>
      </Menu>
    )
    container.firstElementChild!.className.should.equal("dropdown-menu show")
  })
  test("adds responsive start alignment classes", () => {
    const { container } = render(
      <Menu show align={{ lg: "start" }}>
        <Item>Item</Item>
      </Menu>
    )
    container.firstElementChild!.classList.contains("dropdown-menu-end").should
      .be.true
    container.firstElementChild!.classList.contains("dropdown-menu-lg-start")
      .should.be.true
  })
  test("adds responsive end alignment classes", () => {
    const { container } = render(
      <Menu show align={{ lg: "end" }}>
        <Item>Item</Item>
      </Menu>
    )
    container.firstElementChild!.classList.contains("dropdown-menu-lg-end")
      .should.be.true
    container.querySelector('[data-bs-popper="static"]')!.should.exist
  })
  test("allows custom responsive alignment classes", () => {
    const { container } = render(
      <Menu show align={{ custom: "end" }}>
        <Item>Item</Item>
      </Menu>
    )
    container.firstElementChild!.classList.contains("dropdown-menu-custom-end")
      .should.be.true
  })
  test("should render variant", () => {
    const { container } = render(
      <Menu show variant="dark">
        <Item>Item</Item>
      </Menu>
    )
    container.firstElementChild!.classList.contains("dropdown-menu-dark").should
      .be.true
  })
  describe("getPlacement", () => {
    test("should return top placement", () => {
      getPlacement(false, "up", false).should.equal("top-start")
      getPlacement(true, "up", false).should.equal("top-end")
    })
    test("should return top placement for RTL", () => {
      getPlacement(false, "up", true).should.equal("top-end")
      getPlacement(true, "up", true).should.equal("top-start")
    })
    test("should return end placement", () => {
      getPlacement(false, "end", false).should.equal("right-start")
      getPlacement(true, "end", false).should.equal("right-end")
    })
    test("should return end placement for RTL", () => {
      getPlacement(false, "end", true).should.equal("left-start")
      getPlacement(true, "end", true).should.equal("left-end")
    })
    test("should return bottom placement", () => {
      getPlacement(false, "down", false).should.equal("bottom-start")
      getPlacement(true, "down", false).should.equal("bottom-end")
    })
    test("should return bottom placement for RTL", () => {
      getPlacement(false, "down", true).should.equal("bottom-end")
      getPlacement(true, "down", true).should.equal("bottom-start")
    })
    test("should return start placement", () => {
      getPlacement(false, "start", false).should.equal("left-start")
      getPlacement(true, "start", false).should.equal("left-end")
    })
    test("should return start placement for RTL", () => {
      getPlacement(false, "start", true).should.equal("right-start")
      getPlacement(true, "start", true).should.equal("right-end")
    })
  })
})
describe("<Toggle>", () => {
  test("renders toggle button", () => {
    const { getByText } = render(<Toggle id="test-id">herpa derpa</Toggle>)
    const toggle = getByText("herpa derpa")
    toggle.getAttribute("aria-expanded")!.should.equal("false")
    toggle.classList.should.contain(["dropdown-toggle", "btn", "btn-primary"])
  })
  test("renders children", () => {
    const { getByText } = render(
      <Toggle id="test-id">
        <h3>herpa derpa</h3>
      </Toggle>
    )
    getByText("herpa derpa").should.exist
  })
  test("forwards onClick handler", () => {
    const onClickSpy = sinon.spy()
    const { container } = render(
      <Toggle id="test-id" title="click forwards" onClick={onClickSpy} />
    )
    fireEvent.click(container.firstElementChild!)
    onClickSpy.should.be.called
  })
  test("forwards id", () => {
    const { container } = render(<Toggle id="testid" />)
    container.firstElementChild!.id.should.equal("testid")
  })
  test("does not forward bsPrefix", () => {
    const { container } = render(
      <Toggle bsPrefix="my-custom-bsPrefix" title="bsClass" id="test-id" />
    )
    container.firstElementChild!.classList.should.contain([
      "my-custom-bsPrefix",
      "btn",
    ])
  })
})
