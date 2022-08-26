import { Menu, Item, Toggle, Dropdown } from "../../src/base/Dropdown.jsx"
import { render, fireEvent } from "@testing-library/react"
import * as React from "react"
import ReactDOM from "react-dom"
import SelectableContext from "../src/SelectableContext"

describe("<Dropdown>", () => {
  const Menu = ({
    usePopper,
    rootCloseEvent,
    renderSpy,
    popperConfig,
    renderMenuOnMount = true,
    ...props
  }) => (
    <Menu
      flip
      usePopper={usePopper}
      popperConfig={popperConfig}
      rootCloseEvent={rootCloseEvent}
    >
      {(menuProps, meta) => {
        const { show, hasShown } = meta
        renderSpy && renderSpy(meta)
        if (!renderMenuOnMount && !hasShown) {
          return null
        }
        return (
          <div
            {...props}
            {...menuProps}
            data-show={show}
            className="menu"
            style={{ display: show ? "flex" : "none" }}
          />
        )
      }}
    </Menu>
  )
  const Toggle = props => (
    <Toggle>
      {toggleProps => (
        <button
          {...props}
          {...toggleProps}
          id="test-id"
          type="button"
          className="toggle"
        />
      )}
    </Toggle>
  )
  const SimpleDropdown = ({
    children,
    menuSpy,
    usePopper,
    renderMenuOnMount,
    ...outer
  }) => (
    <Dropdown {...outer}>
      {children || (
        <>
          <Toggle key="toggle">Toggle</Toggle>,
          <Menu
            key="menu"
            renderSpy={menuSpy}
            usePopper={usePopper}
            renderMenuOnMount={renderMenuOnMount}
          >
            <Item>Item 1</Item>
            <Item>Item 2</Item>
            <Item>Item 3</Item>
            <Item>Item 4</Item>
          </Menu>
        </>
      )}
    </Dropdown>
  )
  let focusableContainer
  beforeEach(() => {
    focusableContainer = document.createElement("div")
    document.body.appendChild(focusableContainer)
  })
  afterEach(() => {
    ReactDOM.unmountComponentAtNode(focusableContainer)
    document.body.removeChild(focusableContainer)
  })
  it("renders toggle with Toggle", () => {
    const { container } = render(<SimpleDropdown />)
    const toggle = container.querySelector("button.toggle")
    expect(toggle.textContent).toMatch(/Toggle/)
    expect(toggle.hasAttribute("aria-haspopup")).toEqual(false)
    expect(toggle.getAttribute("aria-expanded")).toEqual("false")
    expect(toggle.getAttribute("id")).toBeTruthy()
  })
  it("forwards placement to menu", () => {
    const mock = jest.fn(meta => {
      expect(meta.placement).toEqual("bottom-end")
    })
    render(
      <SimpleDropdown
        show
        placement="bottom-end"
        usePopper={false}
        menuSpy={mock}
      />
    )
    expect(mock).toHaveBeenCalled()
  })
  it("toggles open/closed when clicked", () => {
    const { container } = render(<SimpleDropdown />)
    expect(container.querySelector(".show")).not.toBeTruthy()
    fireEvent.click(container.querySelector('button[aria-expanded="false"]'))
    expect(container.querySelector('div[data-show="true"]')).toBeTruthy()
    fireEvent.click(container.querySelector('button[aria-expanded="true"]'))
    expect(container.querySelector(".show")).not.toBeTruthy()
    expect(
      container.querySelector('button[aria-expanded="false"]')
    ).toBeTruthy()
  })
  it("closes when clicked outside", () => {
    const mock = jest.fn()
    const { container } = render(<SimpleDropdown onToggle={mock} />)
    fireEvent.click(container.querySelector(".toggle"))
    fireEvent.click(document.body)
    expect(mock).toHaveBeenCalledTimes(2)
    expect(mock.lastCall.args[0]).toEqual(false)
  })
  it("closes when mousedown outside if rootCloseEvent set", () => {
    const mock = jest.fn()
    const { container } = render(
      <Dropdown onToggle={mock} id="test-id">
        <div>
          <Toggle>Child Title</Toggle>,
          <Menu rootCloseEvent="mousedown">
            <button type="button">Item 1</button>
            <button type="button">Item 2</button>
          </Menu>
        </div>
      </Dropdown>
    )
    fireEvent.click(container.querySelector(".toggle"))
    fireEvent.mouseDown(document.body)
    expect(mock).toHaveBeenCalledTimes(2)
    expect(mock.lastCall.args[0]).toEqual(false)
  })
  it('when focused and closed toggles open when the key "down" is pressed', () => {
    const mock = jest.fn()
    const { container } = render(<SimpleDropdown onToggle={mock} />, {
      container: focusableContainer,
    })
    fireEvent.keyDown(container.querySelector(".toggle"), { key: "ArrowDown" })
    expect(mock).toHaveBeenCalledTimes(1)
    expect(mock.lastCall.args[0]).toEqual(true)
  })
  it("closes when item is clicked", () => {
    const mock = jest.fn()
    const root = render(<SimpleDropdown show onToggle={mock} />)
    fireEvent.click(root.getByText("Item 4"))
    expect(mock).toHaveBeenCalledWith(false)
  })
  it("does not close when onToggle is controlled", () => {
    const mock = jest.fn()
    const root = render(<SimpleDropdown show onToggle={mock} />)
    fireEvent.click(root.getByText("Toggle"))
    fireEvent.click(root.getByText("Item 1"))
    expect(mock).toHaveBeenCalledWith(false)
    expect(root.container.querySelector('div[data-show="true"]')).toBeTruthy()
  })
  it("has aria-labelledby same id as toggle button", () => {
    const root = render(<SimpleDropdown defaultShow />)
    expect(root.getByText("Toggle").getAttribute("id")).toEqual(
      root.container.querySelector(".menu").getAttribute("aria-labelledby")
    )
  })
  it("has aria-haspopup when menu has role=menu and not otherwise", () => {
    let root = render(
      <Dropdown>
        <div>
          <Toggle>Toggle</Toggle>,
          <Menu role="menu">
            <Item>Item 1</Item>
            <Item>Item 2</Item>
          </Menu>
        </div>
      </Dropdown>
    )
    expect(root.getByText("Toggle").hasAttribute("aria-haspopup")).toEqual(true)
    root.unmount()
    root = render(
      <Dropdown>
        <div>
          <Toggle>Toggle</Toggle>,
          <Menu>
            <Item>Item 1</Item>
            <Item>Item 2</Item>
          </Menu>
        </div>
      </Dropdown>
    )
    expect(root.getByText("Toggle").hasAttribute("aria-haspopup")).toEqual(
      false
    )
  })
  describe("focusable state", () => {
    it("when focus should not be moved to first item when focusFirstItemOnShow is `false`", () => {
      const root = render(
        <Dropdown focusFirstItemOnShow={false}>
          <div>
            <Toggle>Toggle</Toggle>,
            <Menu>
              <button type="button">Item 1</button>
            </Menu>
          </div>
        </Dropdown>,
        { container: focusableContainer }
      )
      const toggle = root.getByText("Toggle")
      toggle.focus()
      fireEvent.click(toggle)
      expect(document.activeElement).toEqual(toggle)
    })
    it('when focused and closed sets focus on first menu item when the key "down" is pressed for role="menu"', done => {
      const root = render(
        <Dropdown>
          <div>
            <Toggle>Toggle</Toggle>,
            <Menu role="menu">
              <Item>Item 1</Item>
              <Item>Item 2</Item>
            </Menu>
          </div>
        </Dropdown>,
        { container: focusableContainer }
      )
      const toggle = root.getByText("Toggle")
      toggle.focus()
      fireEvent.keyDown(toggle, { key: "ArrowDown" })
      setTimeout(() => {
        expect(document.activeElement).toEqual(root.getByText("Item 1"))
        done()
      })
    })
    it("when focused and closed sets focus on first menu item when the focusFirstItemOnShow is true", () => {
      const root = render(
        <Dropdown focusFirstItemOnShow>
          <div>
            <Toggle>Toggle</Toggle>,
            <Menu>
              <Item>Item 1</Item>
              <Item>Item 2</Item>
            </Menu>
          </div>
        </Dropdown>,
        { container: focusableContainer }
      )
      const toggle = root.getByText("Toggle")
      toggle.focus()
      fireEvent.click(toggle)
      return Promise.resolve().then(() => {
        expect(document.activeElement).toEqual(root.getByText("Item 1"))
      })
    })
    it('when open and the key "Escape" is pressed the menu is closed and focus is returned to the button', () => {
      const root = render(<SimpleDropdown defaultShow />, {
        container: focusableContainer,
      })
      const firstItem = root.getByText("Item 1")
      firstItem.focus()
      expect(document.activeElement).toEqual(firstItem)
      fireEvent.keyDown(firstItem, { key: "Escape" })
      expect(document.activeElement).toEqual(root.getByText("Toggle"))
    })
    it('when open and a search input is focused and the key "Escape" is pressed the menu stays open', () => {
      const mock = jest.fn()
      const root = render(
        <Dropdown defaultShow onToggle={mock}>
          <Toggle key="toggle">Toggle</Toggle>,
          <Menu key="menu">
            <input type="search" data-testid="input" />
          </Menu>
        </Dropdown>,
        {
          container: focusableContainer,
        }
      )
      const input = root.getByTestId("input")
      input.focus()
      expect(document.activeElement).toEqual(input)
      fireEvent.keyDown(input, { key: "Escape" })
      expect(document.activeElement).toEqual(input)
      expect(mock).to.not.be.called
    })
    it('when open and the key "tab" is pressed the menu is closed and focus is progress to the next focusable element', () => {
      const root = render(
        <div>
          <SimpleDropdown defaultShow />
          <input type="text" id="next-focusable" />
        </div>,
        { container: focusableContainer }
      )
      const toggle = root.getByText("Toggle")
      toggle.focus()
      fireEvent.keyDown(toggle, { key: "Tab" })
      fireEvent.keyUp(toggle, { key: "Tab" })
      expect(toggle.getAttribute("aria-expanded")).toEqual("false")
    })
  })
  it('should not call onToggle if the menu ref not defined and "tab" is pressed', () => {
    const mock = jest.fn()
    const root = render(
      <SimpleDropdown onToggle={mock} renderMenuOnMount={false} />,
      {
        container: focusableContainer,
      }
    )
    const toggle = root.getByText("Toggle")
    toggle.focus()
    fireEvent.keyDown(toggle, { key: "Tab" })
    fireEvent.keyUp(toggle, { key: "Tab" })
    expect(mock).to.not.be.called
  })
  it('should not call onToggle if the menu is hidden and "tab" is pressed', () => {
    const mock = jest.fn()
    const root = render(<SimpleDropdown onToggle={mock} />, {
      container: focusableContainer,
    })
    const toggle = root.getByText("Toggle")
    toggle.focus()
    fireEvent.keyDown(toggle, { key: "Tab" })
    fireEvent.keyUp(toggle, { key: "Tab" })
    expect(mock).to.not.be.called
  })
  describe("popper config", () => {
    it("can add modifiers", done => {
      const mock = jest.fn()
      const popper = {
        modifiers: [
          {
            name: "test",
            enabled: true,
            phase: "write",
            fn: mock,
          },
        ],
      }
      render(
        <Dropdown show id="test-id">
          <div>
            <Toggle>Child Title</Toggle>
            <Menu popperConfig={popper}>
              <button type="button">Item 1</button>
              <button type="button">Item 2</button>
            </Menu>
          </div>
        </Dropdown>
      )
      setTimeout(() => {
        expect(mock).toHaveBeenCalledTimes(1)
        done()
      })
    })
  })
})
describe("<DropdownItem>", () => {
  it("Should output a nav item as button", () => {
    const { getByText } = render(<Item>test</Item>)
    expect(getByText("test").tagName).toEqual("BUTTON")
  })
  it("Should trigger onClick", () => {
    const mock = jest.fn()
    const { getByText } = render(<Item onClick={mock}>test</Item>)
    fireEvent.click(getByText("test"))
    expect(mock).to.be.called
  })
  it("Should not trigger onClick if disabled", () => {
    const mock = jest.fn()
    const { getByText } = render(
      <Item onClick={mock} disabled>
        test
      </Item>
    )
    fireEvent.click(getByText("test"))
    expect(mock).to.not.be.called
  })
  it("Should call onSelect if a key is defined", () => {
    const mock = jest.fn()
    const { getByText } = render(
      <SelectableContext.Provider value={mock}>
        <Item eventKey="abc">test</Item>
      </SelectableContext.Provider>
    )
    fireEvent.click(getByText("test"))
    expect(mock).toHaveBeenCalledWith("abc")
  })
  it("Should not call onSelect onClick stopPropagation called", () => {
    const mock = jest.fn()
    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation()
    }
    const { getByText } = render(
      <SelectableContext.Provider value={mock}>
        <Item eventKey="abc" onClick={handleClick}>
          test
        </Item>
      </SelectableContext.Provider>
    )
    fireEvent.click(getByText("test"))
    expect(mock).to.not.be.called
  })
})
