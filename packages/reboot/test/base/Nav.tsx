import { mount } from "enzyme"
import { render, fireEvent } from "@testing-library/react"
import { Context, Item, Nav } from "../../src/base/Nav.jsx"
import { Selectable } from "../../src/base/types.jsx"
import { Tabs } from "../../src/base/Tabs.jsx"
import * as React from "react"

describe("<Nav>", () => {
  let focusableContainer: any

  beforeEach(() => {
    focusableContainer = document.createElement("div")
    document.body.appendChild(focusableContainer)
  })

  afterEach(() => {
    document.body.removeChild(focusableContainer)
    focusableContainer = null
  })

  it("When Arrow key is pressed and a nom NavItem element is the activeElement, then the activeElement keeps the same element", () => {
    const wrapper = mount(
      <Tabs defaultActiveKey="1">
        <Nav>
          <Item eventKey="1">One</Item>
          <Item eventKey="2">Two</Item>
          <input type="text" autoFocus />
        </Nav>
      </Tabs>,
      { attachTo: focusableContainer }
    )
    wrapper.find(Item).at(0).simulate("keydown", { key: "ArrowRight" })
    expect(document.activeElement).toEqual(wrapper.find("input").getDOMNode())
  })
})

describe("<NavItem>", () => {
  it("Should output a nav item as button", () => {
    const { getByText } = render(<Item>test</Item>)
    expect(getByText("test").tagName).toEqual("BUTTON")
  })
  it("Should output custom role", () => {
    const { getByRole } = render(<Item role="abc">test</Item>)
    expect(getByRole("abc")).toBeTruthy()
  })
  it("Should set role to tab if inside nav context", () => {
    const { getByRole } = render(
      <Context.Provider
        value={{
          role: "tablist",
          activeKey: "key",
          getControlledId: jest.fn(),
          getControllerId: jest.fn(),
        }}
      >
        <Item>test</Item>
      </Context.Provider>
    )
    expect(getByRole("tab")).toBeTruthy()
  })
  it("Should not override custom role if inside nav context", () => {
    const { getByRole } = render(
      <Context.Provider
        value={{
          role: "tablist",
          activeKey: "key",
          getControlledId: jest.fn(),
          getControllerId: jest.fn(),
        }}
      >
        <Item role="abc">test</Item>
      </Context.Provider>
    )
    expect(getByRole("abc")).toBeTruthy()
  })
  it("Should use active from nav context", () => {
    const { getByText } = render(
      <Context.Provider
        value={{
          role: "tablist",
          activeKey: "key",
          getControlledId: jest.fn(),
          getControllerId: jest.fn(),
        }}
      >
        <Item eventKey="key">test</Item>
      </Context.Provider>
    )
    expect(getByText("test").getAttribute("data-rr-ui-active")).toEqual("true")
  })
  it("Should set disabled attributes when nav item is disabled and role is tab", () => {
    const { getByText } = render(
      <Item role="tab" disabled>
        test
      </Item>
    )
    const node = getByText("test")
    expect(node.getAttribute("aria-disabled")).toEqual("true")
    expect(node.tabIndex).toEqual(-1)
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
      <Item as="div" onClick={mock} disabled>
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
    const handleClick = (e: React.MouseEvent) => {
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
