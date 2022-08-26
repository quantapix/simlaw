import { render } from "@testing-library/react"
import React from "react"
import { First, Item, Next, Pagination } from "../src/Pagination.jsx"

describe("<Pagination>", () => {
  it("should have class", () => {
    const { getByTestId } = render(
      <Pagination data-testid="test">Item content</Pagination>
    )
    const paginationElem = getByTestId("test")
    expect(paginationElem.classList.contains("pagination")).toBe(true)
  })
  it("should render correctly when size is set", () => {
    const { getByTestId } = render(
      <Pagination data-testid="test" size="sm">
        Item content
      </Pagination>
    )
    const paginationElem = getByTestId("test")
    expect(paginationElem.classList.contains("pagination-sm")).toBe(true)
  })
  it("sub-compontents should forward ref correctly", () => {
    const ref = React.createRef<HTMLLIElement>()
    render(
      <Pagination data-testid="test" size="sm">
        Item content
        <Next ref={ref} data-testid="next" />
      </Pagination>
    )
    expect(ref.current?.tagName.toLowerCase()).toEqual("li")
  })
})
describe("<Item>", () => {
  describe("<First>", () => {
    it("should have expected default innerText", () => {
      const { getByTestId } = render(<First data-testid="test" />)
      const firstElem = getByTestId("test")
      expect(firstElem.classList.contains("page-link")).toBe(true)
      expect(firstElem.firstElementChild!.tagName.toLowerCase()).toEqual("span")
      expect(firstElem.firstElementChild!.getAttribute("aria-hidden")!).toEqual(
        "true"
      )
      expect(firstElem.firstElementChild!.textContent!).toEqual("«")
    })
    it("should have expected custom innerText", () => {
      const innerHTML = "custom"
      const { getByTestId } = render(
        <First data-testid="test">{innerHTML}</First>
      )
      const firstElem = getByTestId("test")
      expect(firstElem.firstElementChild!.textContent!).toEqual(innerHTML)
    })
    it("should render a nested span if active is true", () => {
      const { container } = render(<Item active />)
      const ItemElem = container.firstElementChild!
      const ItemInnerElem = ItemElem.firstElementChild!
      expect(ItemElem.classList.contains("active")).toBe(true)
      expect(ItemInnerElem.classList.contains("page-link")).toBe(true)
      expect(ItemInnerElem.firstElementChild!.tagName.toLowerCase()).toEqual(
        "span"
      )
    })
    it("should render a span if disabled is true", () => {
      const { container } = render(<Item disabled />)
      const ItemElem = container.firstElementChild!
      const ItemInnerElem = ItemElem.firstElementChild!
      expect(ItemElem.classList.contains("disabled")).toBe(true)
      expect(ItemInnerElem.classList.contains("page-link")).toBe(true)
      expect(ItemInnerElem.getAttribute("disabled")!).toBeTruthy()
    })
  })
})
