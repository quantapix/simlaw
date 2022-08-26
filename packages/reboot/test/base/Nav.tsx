import { mount } from "enzyme"
import Tabs from "../src/Tabs"
import Nav from "../src/Nav"
import NavItem from "../src/NavItem"
import * as React from "react"
import { render, fireEvent } from "@testing-library/react"
import Context from "../../src/base/NavContext.jsx"
import NavItem from "../../src/base/NavItem.jsx"
import SelectableContext from "../../src/base/SelectableContext.jsx"

describe("<Nav>", () => {
  let focusableContainer

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
          <NavItem eventKey="1">One</NavItem>
          <NavItem eventKey="2">Two</NavItem>
          <input type="text" autoFocus />
        </Nav>
      </Tabs>,
      { attachTo: focusableContainer }
    )
    wrapper.find(NavItem).at(0).simulate("keydown", { key: "ArrowRight" })
    expect(document.activeElement).toEqual(wrapper.find("input").getDOMNode())
  })
})

describe("<NavItem>", () => {
  it("should output a nav item as button", () => {
    const { getByText } = render(<NavItem>test</NavItem>)
    expect(getByText("test").tagName).toEqual("BUTTON")
  })
  it("should output custom role", () => {
    const { getByRole } = render(<NavItem role="abc">test</NavItem>)
    expect(getByRole("abc")).toBeTruthy()
  })
  it("should set role to tab if inside nav context", () => {
    const { getByRole } = render(
      <Context.Provider
        value={{
          role: "tablist",
          activeKey: "key",
          getControlledId: jest.fn(),
          getControllerId: jest.fn(),
        }}
      >
        <NavItem>test</NavItem>
      </Context.Provider>
    )
    expect(getByRole("tab")).toBeTruthy()
  })
  it("should not override custom role if inside nav context", () => {
    const { getByRole } = render(
      <Context.Provider
        value={{
          role: "tablist",
          activeKey: "key",
          getControlledId: jest.fn(),
          getControllerId: jest.fn(),
        }}
      >
        <NavItem role="abc">test</NavItem>
      </Context.Provider>
    )
    expect(getByRole("abc")).toBeTruthy()
  })
  it("should use active from nav context", () => {
    const { getByText } = render(
      <Context.Provider
        value={{
          role: "tablist",
          activeKey: "key",
          getControlledId: jest.fn(),
          getControllerId: jest.fn(),
        }}
      >
        <NavItem eventKey="key">test</NavItem>
      </Context.Provider>
    )
    expect(getByText("test").getAttribute("data-rr-ui-active")).toEqual("true")
  })
  it("should set disabled attributes when nav item is disabled and role is tab", () => {
    const { getByText } = render(
      <NavItem role="tab" disabled>
        test
      </NavItem>
    )
    const node = getByText("test")
    expect(node.getAttribute("aria-disabled")).toEqual("true")
    expect(node.tabIndex).toEqual(-1)
  })
  it("should trigger onClick", () => {
    const mock = jest.fn()
    const { getByText } = render(<NavItem onClick={mock}>test</NavItem>)
    fireEvent.click(getByText("test"))
    expect(mock).to.be.called
  })
  it("should not trigger onClick if disabled", () => {
    const mock = jest.fn()
    const { getByText } = render(
      // Render as div because onClick won't get triggered with Button when disabled.
      <NavItem as="div" onClick={mock} disabled>
        test
      </NavItem>
    )
    fireEvent.click(getByText("test"))
    expect(mock).to.not.be.called
  })
  it("should call onSelect if a key is defined", () => {
    const mock = jest.fn()
    const { getByText } = render(
      <SelectableContext.Provider value={mock}>
        <NavItem eventKey="abc">test</NavItem>
      </SelectableContext.Provider>
    )
    fireEvent.click(getByText("test"))
    expect(mock).toHaveBeenCalledWith("abc")
  })
  it("should not call onSelect onClick stopPropagation called", () => {
    const mock = jest.fn()
    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation()
    }
    const { getByText } = render(
      <SelectableContext.Provider value={mock}>
        <NavItem eventKey="abc" onClick={handleClick}>
          test
        </NavItem>
      </SelectableContext.Provider>
    )
    fireEvent.click(getByText("test"))
    expect(mock).to.not.be.called
  })
})
