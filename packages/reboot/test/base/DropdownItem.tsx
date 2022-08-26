import * as React from "react"
import { render, fireEvent } from "@testing-library/react"
import { Item } from "../../src/Dropdown.jsx"
import SelectableContext from "../src/SelectableContext"

describe("<DropdownItem>", () => {
  it("should output a nav item as button", () => {
    const { getByText } = render(<Item>test</Item>)

    expect(getByText("test").tagName).toEqual("BUTTON")
  })

  it("should trigger onClick", () => {
    const onClickSpy = jest.fn()
    const { getByText } = render(<Item onClick={onClickSpy}>test</Item>)
    fireEvent.click(getByText("test"))
    expect(onClickSpy).to.be.called
  })

  it("should not trigger onClick if disabled", () => {
    const onClickSpy = jest.fn()
    const { getByText } = render(
      <Item onClick={onClickSpy} disabled>
        test
      </Item>
    )
    fireEvent.click(getByText("test"))
    expect(onClickSpy).to.not.be.called
  })

  it("should call onSelect if a key is defined", () => {
    const onSelect = jest.fn()
    const { getByText } = render(
      <SelectableContext.Provider value={onSelect}>
        <Item eventKey="abc">test</Item>
      </SelectableContext.Provider>
    )

    fireEvent.click(getByText("test"))
    expect(onSelect).to.be.calledWith("abc")
  })

  it("should not call onSelect onClick stopPropagation called", () => {
    const onSelect = jest.fn()
    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation()
    }
    const { getByText } = render(
      <SelectableContext.Provider value={onSelect}>
        <Item eventKey="abc" onClick={handleClick}>
          test
        </Item>
      </SelectableContext.Provider>
    )

    fireEvent.click(getByText("test"))
    expect(onSelect).to.not.be.called
  })
})
