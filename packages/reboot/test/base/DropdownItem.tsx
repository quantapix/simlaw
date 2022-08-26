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
    const mock = jest.fn()
    const { getByText } = render(<Item onClick={mock}>test</Item>)
    fireEvent.click(getByText("test"))
    expect(mock).to.be.called
  })

  it("should not trigger onClick if disabled", () => {
    const mock = jest.fn()
    const { getByText } = render(
      <Item onClick={mock} disabled>
        test
      </Item>
    )
    fireEvent.click(getByText("test"))
    expect(mock).to.not.be.called
  })

  it("should call onSelect if a key is defined", () => {
    const mock = jest.fn()
    const { getByText } = render(
      <SelectableContext.Provider value={mock}>
        <Item eventKey="abc">test</Item>
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
        <Item eventKey="abc" onClick={handleClick}>
          test
        </Item>
      </SelectableContext.Provider>
    )

    fireEvent.click(getByText("test"))
    expect(mock).to.not.be.called
  })
})
