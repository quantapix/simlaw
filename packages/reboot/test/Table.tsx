import { render } from "@testing-library/react"
import { Table } from "../src/Table.jsx"

describe("Table", () => {
  it("Should be a table", () => {
    const { getByTestId } = render(<Table data-testid="test" />)
    const y = getByTestId("test")
    expect(y.classList.contains("table")).toBe(true)
    expect(y.tagName.toLowerCase()).toEqual("table")
  })
  it("Should have correct class when using striped row", () => {
    const { getByTestId } = render(<Table data-testid="test" striped />)
    const y = getByTestId("test")
    expect(y.classList.contains("table-striped")).toBe(true)
  })
  it("Should have correct class when using striped column", () => {
    const { getByTestId } = render(
      <Table data-testid="test" striped="columns" />
    )
    const y = getByTestId("test")
    expect(y.classList.contains("table-striped-columns")).toBe(true)
  })
  it("Should have correct class when hover", () => {
    const { getByTestId } = render(<Table data-testid="test" hover />)
    const y = getByTestId("test")
    expect(y.classList.contains("table-hover")).toBe(true)
  })
  it("Should have correct class when bordered", () => {
    const { getByTestId } = render(<Table data-testid="test" bordered />)
    const y = getByTestId("test")
    expect(y.classList.contains("table-bordered")).toBe(true)
  })
  it("Should have correct class when borderless", () => {
    const { getByTestId } = render(<Table data-testid="test" borderless />)
    const y = getByTestId("test")
    expect(y.classList.contains("table-borderless")).toBe(true)
  })
  it("Should have correct class when small", () => {
    const { getByTestId } = render(<Table data-testid="test" size="sm" />)
    const y = getByTestId("test")
    expect(y.classList.contains("table-sm")).toBe(true)
  })
  it("Should have correct class when dark", () => {
    const { getByTestId } = render(<Table data-testid="test" variant="dark" />)
    const y = getByTestId("test")
    expect(y.classList.contains("table-dark")).toBe(true)
  })
  it("Should have responsive wrapper", () => {
    const { container } = render(<Table responsive />)
    const y = container.firstElementChild!
    expect(y!.classList.contains("table-responsive")).toBe(true)
  })
  it("Should have responsive breakpoints", () => {
    const { container } = render(<Table responsive="sm" />)
    const y = container.firstElementChild!
    expect(y!.classList.contains("table-responsive-sm")).toBe(true)
  })
})
