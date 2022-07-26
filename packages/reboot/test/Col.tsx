import { Col } from "../src/Col.js"
import { render } from "@testing-library/react"
import { ThemeProvider } from "../src/index.js"

describe("Col", () => {
  it('Should include "col" when there are no sizes', () => {
    const { getByText } = render(<Col>Column</Col>)
    expect(getByText("Column").classList.contains("col")).toBe(true)
  })
  it('Should include "col" when xs is true', () => {
    const { getByText } = render(<Col xs>Column</Col>)
    expect(getByText("Column").classList.contains("col")).toBe(true)
    render(<Col xs={{ span: true }}>Column2</Col>)
    expect(getByText("Column2").classList.contains("col")).toBe(true)
  })
  it("should include sizes", () => {
    const { getByText } = render(
      <Col xs={4} md={8} lg={{ span: 12 }}>
        Column
      </Col>
    )
    expect(getByText("Column").classList.length).toEqual(3)
    expect(getByText("Column").classList.contains("col-4")).toBe(true)
    expect(getByText("Column").classList.contains("col-md-8")).toBe(true)
    expect(getByText("Column").classList.contains("col-lg-12")).toBe(true)
  })
  it("should include offsets", () => {
    const { getByText } = render(
      <Col
        xs={{ span: 4, offset: 1 }}
        md={{ span: 8, order: 1 }}
        lg={{ order: "last" }}
      >
        Column
      </Col>
    )
    expect(getByText("Column").classList.length).toEqual(5)
    expect(getByText("Column").classList.contains("col-md-8")).toBe(true)
    expect(getByText("Column").classList.contains("order-md-1")).toBe(true)
    expect(getByText("Column").classList.contains("col-4")).toBe(true)
    expect(getByText("Column").classList.contains("offset-1")).toBe(true)
    expect(getByText("Column").classList.contains("order-lg-last")).toBe(true)
  })
  it("should allow span to be null", () => {
    const { getByText } = render(
      <Col xs="6" md={{ order: 1 }}>
        Column
      </Col>
    )
    expect(getByText("Column").classList.contains("col-6")).toBe(true)
    expect(getByText("Column").classList.contains("order-md-1")).toBe(true)
    expect(getByText("Column").classList.contains("col-md")).toEqual(false)
  })
  it("should allow span to be false", () => {
    const { getByText } = render(
      <Col xs="6" md={{ span: false, order: 1 }}>
        Column
      </Col>
    )
    expect(getByText("Column").classList.contains("col-6")).toBe(true)
    expect(getByText("Column").classList.contains("order-md-1")).toBe(true)
    expect(getByText("Column").classList.contains("col-md")).toEqual(false)
  })
  it("should allow span to be auto", () => {
    const { getByText } = render(
      <Col md="auto" lg={{ span: "auto" }}>
        Column
      </Col>
    )
    expect(getByText("Column").classList.contains("col-md-auto")).toBe(true)
    expect(getByText("Column").classList.contains("col-lg-auto")).toBe(true)
  })
  it("should have div as default component", () => {
    const { getByText } = render(<Col>Column</Col>)
    expect(getByText("Column").tagName.toLowerCase()).toEqual("div")
  })
  it("should allow custom breakpoints", () => {
    const { getByText } = render(
      <ThemeProvider breakpoints={["custom"]}>
        <Col custom="3">test</Col>
      </ThemeProvider>
    )
    expect(getByText("test").classList.contains("col-custom-3")).toBe(true)
  })
  it('should allow custom breakpoints smaller than default "xs"', () => {
    const { getByText } = render(
      <ThemeProvider breakpoints={["xxs", "xs"]} minBreakpoint="xxs">
        <Col xxs="3" xs="2">
          test
        </Col>
      </ThemeProvider>
    )
    expect(getByText("test").classList.contains("col-3")).toBe(true)
    expect(getByText("test").classList.contains("col-xs-2")).toBe(true)
  })
})
