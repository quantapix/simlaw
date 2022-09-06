import { fireEvent, render } from "@testing-library/react"
import { ListGroup, Item } from "../src/ListGroup.js"
import { shouldWarn } from "./tools.js"

describe("ListGroup", () => {
  it('Should render correctly "list-group"', () => {
    const { getByTestId } = render(<ListGroup data-testid="test" />)
    const listGroup = getByTestId("test")
    expect(listGroup.tagName.toLowerCase()).toEqual("div")
    expect(listGroup.classList.contains("list-group")).toBe(true)
  })
  it("accepts <Item> children", () => {
    const { getByTestId } = render(
      <ListGroup>
        <Item data-testid="test">hey!</Item>
      </ListGroup>
    )
    const listGroupItem = getByTestId("test")
    expect(listGroupItem.classList.contains("list-group-item")).toBe(true)
  })
  it("accepts variant", () => {
    const { getByTestId } = render(
      <ListGroup variant="flush" data-testid="test" />
    )
    const listGroup = getByTestId("test")
    expect(listGroup.classList.contains("list-group")).toBe(true)
    expect(listGroup.classList.contains("list-group-flush")).toBe(true)
  })
  it("accepts global horizontal", () => {
    const { getByTestId } = render(<ListGroup horizontal data-testid="test" />)
    const listGroup = getByTestId("test")
    expect(listGroup.classList.contains("list-group-horizontal")).toBe(true)
  })
  ;(["sm", "md", "lg", "xl", "xxl", "custom"] as const).forEach(breakpoint => {
    it(`accepts responsive horizontal ${breakpoint} breakpoint`, () => {
      const { getByTestId } = render(
        <ListGroup horizontal={breakpoint} data-testid="test" />
      )
      const listGroup = getByTestId("test")
      const breakpointClass = `list-group-horizontal-${breakpoint}`
      expect(listGroup.classList.contains(breakpointClass)).toBe(true)
    })
  })
  it("throws a warning if flush and horizontal are used", () => {
    shouldWarn("together")
    render(<ListGroup horizontal variant="flush" />)
  })
  it("accepts as prop", () => {
    const { getByTestId } = render(<ListGroup as="ul" data-testid="test" />)
    const listGroup = getByTestId("test")
    expect(listGroup.tagName.toLowerCase()).toEqual("ul")
    expect(listGroup.classList.contains("list-group")).toBe(true)
  })
  it("should set active class on list item if activeKey set on parent", () => {
    const { getByTestId } = render(
      <ListGroup activeKey="1">
        <Item eventKey="1" data-testid="list-item">
          test
        </Item>
      </ListGroup>
    )
    expect(getByTestId("list-item").classList.contains("active")).toBe(true)
  })
  it("should add numbered class", () => {
    const { getByTestId } = render(
      <ListGroup activeKey="1" numbered data-testid="list-group">
        <Item eventKey="1">test</Item>
      </ListGroup>
    )
    const listGroup = getByTestId("list-group")
    expect(listGroup.classList.contains("list-group-numbered")).toBe(true)
  })
})
describe("Item", () => {
  it("should output a div", () => {
    const { getByTestId } = render(<Item data-testid="test" />)
    const item = getByTestId("test")
    expect(item.tagName.toLowerCase()).toEqual("div")
    expect(item.classList.contains("list-group-item")).toBe(true)
  })
  it("accepts variants", () => {
    const { getByTestId } = render(
      <Item variant="success" data-testid="test" />
    )
    const item = getByTestId("test")
    expect(item.classList.contains("list-group-item")).toBe(true)
    expect(item.classList.contains("list-group-item-success")).toBe(true)
  })
  it("accepts active", () => {
    const { getByTestId } = render(<Item active data-testid="test" />)
    const item = getByTestId("test")
    expect(item.classList.contains("list-group-item")).toBe(true)
    expect(item.classList.contains("active")).toBe(true)
  })
  it("accepts disabled", () => {
    const { getByTestId } = render(<Item disabled data-testid="test" />)
    const item = getByTestId("test")
    expect(item.classList.contains("list-group-item")).toBe(true)
    expect(item.classList.contains("disabled")).toBe(true)
  })
  it("accepts as prop", () => {
    const { getByTestId } = render(<Item as="span" data-testid="test" />)
    const item = getByTestId("test")
    expect(item.tagName.toLowerCase()).toEqual("span")
    expect(item.classList.contains("list-group-item")).toBe(true)
  })
  it("should not be focusable when disabled", () => {
    const { getByTestId } = render(<Item disabled data-testid="test" />)
    expect(getByTestId("test").getAttribute("tabindex")).toEqual("-1")
  })
  it("should respect user-specified tabIndex", () => {
    const { getByTestId } = render(
      <Item disabled tabIndex={4} data-testid="test" />
    )
    expect(getByTestId("test").getAttribute("tabindex")).toEqual("4")
  })
  describe("actions", () => {
    it("renders a button", () => {
      const { getByTestId } = render(<Item action data-testid="test" />)
      const item = getByTestId("test")
      expect(item.tagName.toLowerCase()).toEqual("button")
      expect(item.classList.contains("list-group-item-action")).toBe(true)
    })
    it("renders an anchor", () => {
      const { getByTestId } = render(
        <Item action href="/foo" data-testid="test" />
      )
      const item = getByTestId("test")
      expect(item.tagName.toLowerCase()).toEqual("a")
      expect(item.classList.contains("list-group-item-action")).toBe(true)
      expect(item.getAttribute("href")).toEqual("/foo")
    })
  })
  describe("onClick", () => {
    it("should call on click", () => {
      const mock = jest.fn()
      const { getByTestId } = render(<Item onClick={mock} data-testid="test" />)
      fireEvent.click(getByTestId("test"))
      expect(mock).toHaveBeenCalledTimes(1)
    })
    it("should not call if disabled", () => {
      const mock = jest.fn()
      const { getByTestId } = render(
        <Item onClick={mock} disabled data-testid="test" />
      )
      fireEvent.click(getByTestId("test"))
      expect(mock).not.toHaveBeenCalled()
    })
  })
})
