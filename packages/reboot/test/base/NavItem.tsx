import * as React from "react"
import { render, fireEvent } from "@testing-library/react"
import Context from "../../src/base/NavContext.jsx"
import NavItem from "../../src/base/NavItem.jsx"
import SelectableContext from "../../src/base/SelectableContext.jsx"
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
          getControlledId: sinon.spy(),
          getControllerId: sinon.spy(),
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
          getControlledId: sinon.spy(),
          getControllerId: sinon.spy(),
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
          getControlledId: sinon.spy(),
          getControllerId: sinon.spy(),
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
    const onClickSpy = sinon.spy()
    const { getByText } = render(<NavItem onClick={onClickSpy}>test</NavItem>)
    fireEvent.click(getByText("test"))
    expect(onClickSpy).to.be.called
  })
  it("should not trigger onClick if disabled", () => {
    const onClickSpy = sinon.spy()
    const { getByText } = render(
      // Render as div because onClick won't get triggered with Button when disabled.
      <NavItem as="div" onClick={onClickSpy} disabled>
        test
      </NavItem>
    )
    fireEvent.click(getByText("test"))
    expect(onClickSpy).to.not.be.called
  })
  it("should call onSelect if a key is defined", () => {
    const onSelect = sinon.spy()
    const { getByText } = render(
      <SelectableContext.Provider value={onSelect}>
        <NavItem eventKey="abc">test</NavItem>
      </SelectableContext.Provider>
    )
    fireEvent.click(getByText("test"))
    expect(onSelect).to.be.calledWith("abc")
  })
  it("should not call onSelect onClick stopPropagation called", () => {
    const onSelect = sinon.spy()
    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation()
    }
    const { getByText } = render(
      <SelectableContext.Provider value={onSelect}>
        <NavItem eventKey="abc" onClick={handleClick}>
          test
        </NavItem>
      </SelectableContext.Provider>
    )
    fireEvent.click(getByText("test"))
    expect(onSelect).to.not.be.called
  })
})
