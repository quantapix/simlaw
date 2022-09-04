import {
  Menu,
  MenuOpts,
  Item,
  Toggle,
  Dropdown,
} from "../../src/base/Dropdown.jsx"
import { render, fireEvent } from "@testing-library/react"
import { Selectable } from "../../src/base/types.jsx"
import type * as qr from "react"
import ReactDOM from "react-dom"

describe("Dropdown", () => {
  const TestMenu = ({
    mock,
    popperConfig,
    renderMenuOnMount = true,
    rootCloseEvent,
    usePopper,
    ...ps
  }: MenuOpts & {
    children?: qr.ReactNode | qr.ReactNode[]
    mock?: any
    renderMenuOnMount?: boolean | undefined
    role?: any
  }) => (
    <Menu
      flip
      usePopper={usePopper}
      popperConfig={popperConfig}
      rootCloseEvent={rootCloseEvent}
    >
      {(mps, meta) => {
        const { show, hasShown } = meta
        mock && mock(meta)
        if (!renderMenuOnMount && !hasShown) return null
        return (
          <div
            {...ps}
            {...mps}
            data-show={show}
            className="menu"
            style={{ display: show ? "flex" : "none" }}
          />
        )
      }}
    </Menu>
  )
  const TestToggle = (ps: any) => (
    <Toggle>
      {(tps: any) => (
        <button
          {...ps}
          {...tps}
          id="test-id"
          type="button"
          className="toggle"
        />
      )}
    </Toggle>
  )
  const SimpleDropdown = ({
    children,
    mock,
    popperConfig,
    renderMenuOnMount,
    rootCloseEvent,
    usePopper,
    ...ps
  }: MenuOpts & {
    children?: qr.ReactNode
    defaultShow?: boolean
    mock?: any
    onToggle?: any
    renderMenuOnMount?: boolean
  }) => (
    <Dropdown {...ps}>
      {children || (
        <>
          <TestToggle key="toggle">Toggle</TestToggle>,
          <TestMenu
            key="menu"
            mock={mock}
            popperConfig={popperConfig}
            renderMenuOnMount={renderMenuOnMount}
            rootCloseEvent={rootCloseEvent}
            usePopper={usePopper}
          >
            <Item>Item 1</Item>
            <Item>Item 2</Item>
            <Item>Item 3</Item>
            <Item>Item 4</Item>
          </TestMenu>
        </>
      )}
    </Dropdown>
  )
  let focusableContainer: any
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
    const y = container.querySelector("button.toggle")!
    expect(y.textContent).toMatch(/Toggle/)
    expect(y.hasAttribute("aria-haspopup")).toEqual(false)
    expect(y.getAttribute("aria-expanded")).toEqual("false")
    expect(y.getAttribute("id")).toBeTruthy()
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
        mock={mock}
      />
    )
    expect(mock).toHaveBeenCalled()
  })
  it("toggles open/closed when clicked", () => {
    const { container: c } = render(<SimpleDropdown />)
    expect(c.querySelector(".show")).not.toBeTruthy()
    fireEvent.click(c.querySelector('button[aria-expanded="false"]')!)
    expect(c.querySelector('div[data-show="true"]')).toBeTruthy()
    fireEvent.click(c.querySelector('button[aria-expanded="true"]')!)
    expect(c.querySelector(".show")).not.toBeTruthy()
    expect(c.querySelector('button[aria-expanded="false"]')).toBeTruthy()
  })
  it("closes when clicked outside", () => {
    const mock = jest.fn()
    const { container: c } = render(<SimpleDropdown mock={mock} />)
    fireEvent.click(c.querySelector(".toggle")!)
    fireEvent.click(document.body)
    expect(mock).toHaveBeenCalledTimes(2)
    expect(mock.mock.lastCall.args[0]).toEqual(false)
  })
  it("closes when mousedown outside if rootCloseEvent set", () => {
    const mock = jest.fn()
    const { container: c } = render(
      <Dropdown onToggle={mock}>
        <div>
          <TestToggle>Child Title</TestToggle>,
          <TestMenu rootCloseEvent="mousedown">
            <button type="button">Item 1</button>
            <button type="button">Item 2</button>
          </TestMenu>
        </div>
      </Dropdown>
    )
    fireEvent.click(c.querySelector(".toggle")!)
    fireEvent.mouseDown(document.body)
    expect(mock).toHaveBeenCalledTimes(2)
    expect(mock.mock.lastCall.args[0]).toEqual(false)
  })
  it('when focused and closed toggles open when the key "down" is pressed', () => {
    const mock = jest.fn()
    const { container } = render(<SimpleDropdown onToggle={mock} />, {
      container: focusableContainer,
    })
    fireEvent.keyDown(container.querySelector(".toggle"), { key: "ArrowDown" })
    expect(mock).toHaveBeenCalledTimes(1)
    expect(mock.mock.lastCall.args[0]).toEqual(true)
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
      root.container.querySelector(".menu")!.getAttribute("aria-labelledby")
    )
  })
  it("has aria-haspopup when menu has role=menu and not otherwise", () => {
    let root = render(
      <Dropdown>
        <div>
          <TestToggle>Toggle</TestToggle>,
          <TestMenu role="menu">
            <Item>Item 1</Item>
            <Item>Item 2</Item>
          </TestMenu>
        </div>
      </Dropdown>
    )
    expect(root.getByText("Toggle").hasAttribute("aria-haspopup")).toEqual(true)
    root.unmount()
    root = render(
      <Dropdown>
        <div>
          <TestToggle>Toggle</TestToggle>,
          <TestMenu>
            <Item>Item 1</Item>
            <Item>Item 2</Item>
          </TestMenu>
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
            <TestToggle>Toggle</TestToggle>,
            <TestMenu>
              <button type="button">Item 1</button>
            </TestMenu>
          </div>
        </Dropdown>,
        { container: focusableContainer }
      )
      const y = root.getByText("Toggle")
      y.focus()
      fireEvent.click(y)
      expect(document.activeElement).toEqual(y)
    })
    it('when focused and closed sets focus on first menu item when the key "down" is pressed for role="menu"', done => {
      const root = render(
        <Dropdown>
          <div>
            <TestToggle>Toggle</TestToggle>,
            <TestMenu role="menu">
              <Item>Item 1</Item>
              <Item>Item 2</Item>
            </TestMenu>
          </div>
        </Dropdown>,
        { container: focusableContainer }
      )
      const y = root.getByText("Toggle")
      y.focus()
      fireEvent.keyDown(y, { key: "ArrowDown" })
      setTimeout(() => {
        expect(document.activeElement).toEqual(root.getByText("Item 1"))
        done()
      })
    })
    it("when focused and closed sets focus on first menu item when the focusFirstItemOnShow is true", () => {
      const root = render(
        <Dropdown focusFirstItemOnShow>
          <div>
            <TestToggle>Toggle</TestToggle>,
            <TestMenu>
              <Item>Item 1</Item>
              <Item>Item 2</Item>
            </TestMenu>
          </div>
        </Dropdown>,
        { container: focusableContainer }
      )
      const y = root.getByText("Toggle")
      y.focus()
      fireEvent.click(y)
      return Promise.resolve().then(() => {
        expect(document.activeElement).toEqual(root.getByText("Item 1"))
      })
    })
    it('when open and the key "Escape" is pressed the menu is closed and focus is returned to the button', () => {
      const root = render(<SimpleDropdown defaultShow />, {
        container: focusableContainer,
      })
      const y = root.getByText("Item 1")
      y.focus()
      expect(document.activeElement).toEqual(y)
      fireEvent.keyDown(y, { key: "Escape" })
      expect(document.activeElement).toEqual(root.getByText("Toggle"))
    })
    it('when open and a search input is focused and the key "Escape" is pressed the menu stays open', () => {
      const mock = jest.fn()
      const root = render(
        <Dropdown defaultShow onToggle={mock}>
          <TestToggle key="toggle">Toggle</TestToggle>,
          <TestMenu key="menu">
            <input type="search" data-testid="input" />
          </TestMenu>
        </Dropdown>,
        { container: focusableContainer }
      )
      const y = root.getByTestId("input")
      y.focus()
      expect(document.activeElement).toEqual(y)
      fireEvent.keyDown(y, { key: "Escape" })
      expect(document.activeElement).toEqual(y)
      expect(mock).not.toHaveBeenCalled()
    })
    it('when open and the key "tab" is pressed the menu is closed and focus is progress to the next focusable element', () => {
      const root = render(
        <div>
          <SimpleDropdown defaultShow />
          <input type="text" id="next-focusable" />
        </div>,
        { container: focusableContainer }
      )
      const y = root.getByText("Toggle")
      y.focus()
      fireEvent.keyDown(y, { key: "Tab" })
      fireEvent.keyUp(y, { key: "Tab" })
      expect(y.getAttribute("aria-expanded")).toEqual("false")
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
    const y = root.getByText("Toggle")
    y.focus()
    fireEvent.keyDown(y, { key: "Tab" })
    fireEvent.keyUp(y, { key: "Tab" })
    expect(mock).not.toHaveBeenCalled()
  })
  it('should not call onToggle if the menu is hidden and "tab" is pressed', () => {
    const mock = jest.fn()
    const root = render(<SimpleDropdown onToggle={mock} />, {
      container: focusableContainer,
    })
    const y = root.getByText("Toggle")
    y.focus()
    fireEvent.keyDown(y, { key: "Tab" })
    fireEvent.keyUp(y, { key: "Tab" })
    expect(mock).not.toHaveBeenCalled()
  })
  describe("popper config", () => {
    it("can add modifiers", done => {
      const mock = jest.fn()
      const write = "write"
      const popper = {
        modifiers: [
          {
            name: "test",
            enabled: true,
            phase: write,
            fn: mock,
          },
        ],
      } as any
      render(
        <Dropdown show>
          <div>
            <TestToggle>Child Title</TestToggle>
            <TestMenu popperConfig={popper}>
              <button type="button">Item 1</button>
              <button type="button">Item 2</button>
            </TestMenu>
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
describe("DropdownItem", () => {
  it("Should output a nav item as button", () => {
    const { getByText } = render(<Item>test</Item>)
    expect(getByText("test").tagName).toEqual("BUTTON")
  })
  it("Should trigger onClick", () => {
    const mock = jest.fn()
    const { getByText } = render(<Item onClick={mock}>test</Item>)
    fireEvent.click(getByText("test"))
    expect(mock).toHaveBeenCalled()
  })
  it("Should not trigger onClick if disabled", () => {
    const mock = jest.fn()
    const { getByText } = render(
      <Item onClick={mock} disabled>
        test
      </Item>
    )
    fireEvent.click(getByText("test"))
    expect(mock).not.toHaveBeenCalled()
  })
  it("Should call onSelect if a key is defined", () => {
    const mock = jest.fn()
    const { getByText } = render(
      <Selectable.Provider value={mock}>
        <Item eventKey="abc">test</Item>
      </Selectable.Provider>
    )
    fireEvent.click(getByText("test"))
    expect(mock).toHaveBeenCalledWith("abc")
  })
  it("Should not call onSelect onClick stopPropagation called", () => {
    const mock = jest.fn()
    const handleClick = (e: qr.MouseEvent) => {
      e.stopPropagation()
    }
    const { getByText } = render(
      <Selectable.Provider value={mock}>
        <Item eventKey="abc" onClick={handleClick}>
          test
        </Item>
      </Selectable.Provider>
    )
    fireEvent.click(getByText("test"))
    expect(mock).not.toHaveBeenCalled()
  })
})
