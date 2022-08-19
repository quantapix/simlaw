import { render } from "@testing-library/react"
import React from "react"
import { First, Item, Next, Pagination } from "../src/Pagination.jsx"

describe("<Pagination>", () => {
  test("should have class", () => {
    const { getByTestId } = render(
      <Pagination data-testid="test">Item content</Pagination>
    )
    const paginationElem = getByTestId("test")
    paginationElem.classList.contains("pagination").should.be.true
  })
  test("should render correctly when size is set", () => {
    const { getByTestId } = render(
      <Pagination data-testid="test" size="sm">
        Item content
      </Pagination>
    )
    const paginationElem = getByTestId("test")
    paginationElem.classList.contains("pagination-sm").should.be.true
  })
  test("sub-compontents should forward ref correctly", () => {
    const ref = React.createRef<HTMLLIElement>()
    render(
      <Pagination data-testid="test" size="sm">
        Item content
        <Next ref={ref} data-testid="next" />
      </Pagination>
    )
    ref.current?.tagName.toLowerCase().should.be.equal("li")
  })
})
describe("<Item>", () => {
  describe("<First>", () => {
    test("should have expected default innerText", () => {
      const { getByTestId } = render(<First data-testid="test" />)
      const firstElem = getByTestId("test")
      firstElem.classList.contains("page-link").should.be.true
      firstElem.firstElementChild!.tagName.toLowerCase().should.equal("span")
      firstElem
        .firstElementChild!.getAttribute("aria-hidden")!
        .should.equal("true")
      firstElem.firstElementChild!.textContent!.should.equal("«")
    })
    test("should have expected custom innerText", () => {
      const innerHTML = "custom"
      const { getByTestId } = render(
        <First data-testid="test">{innerHTML}</First>
      )
      const firstElem = getByTestId("test")
      firstElem.firstElementChild!.textContent!.should.equal(innerHTML)
    })
    test("should render a nested span if active is true", () => {
      const { container } = render(<Item active />)
      const ItemElem = container.firstElementChild!
      const ItemInnerElem = ItemElem.firstElementChild!
      ItemElem.classList.contains("active").should.be.true
      ItemInnerElem.classList.contains("page-link").should.be.true
      // check if nested span is rendered
      ItemInnerElem.firstElementChild!.tagName.toLowerCase().should.equal(
        "span"
      )
    })
    test("should render a span if disabled is true", () => {
      const { container } = render(<Item disabled />)
      const ItemElem = container.firstElementChild!
      const ItemInnerElem = ItemElem.firstElementChild!
      ItemElem.classList.contains("disabled").should.be.true
      ItemInnerElem.classList.contains("page-link").should.be.true
      ItemInnerElem.getAttribute("disabled")!.should.exist
    })
  })
})
