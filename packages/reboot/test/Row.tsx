import { render } from "@testing-library/react"
import { ThemeProvider } from "../src/index.js"
import { Row } from "../src/Row.js"

describe("Row", () => {
  it('Should include "row" when there are no sizes', () => {
    const { getByText } = render(<Row>Row</Row>)
    expect(getByText("Row").classList.contains("row")).toBe(true)
  })
  it("Should include sizes", () => {
    const { getByText } = render(
      <Row xs={4} md={8}>
        Row
      </Row>
    )
    expect(getByText("Row").classList.contains("row-cols-md-8")).toBe(true)
    expect(getByText("Row").classList.contains("row-cols-4")).toBe(true)
  })
  it("Should allow sizes as objects", () => {
    const { getByText } = render(
      <Row xs={{ cols: 4 }} md={{ cols: 8 }}>
        Row
      </Row>
    )
    expect(getByText("Row").classList.contains("row-cols-md-8")).toBe(true)
    expect(getByText("Row").classList.contains("row-cols-4")).toBe(true)
  })
  it("Should allow auto as size", () => {
    const { getByText } = render(
      <Row xs="auto" md="auto">
        Row
      </Row>
    )
    expect(getByText("Row").classList.contains("row-cols-md-auto")).toBe(true)
    expect(getByText("Row").classList.contains("row-cols-auto")).toBe(true)
  })
  it("Should allow auto as size in object form", () => {
    const { getByText } = render(
      <Row xs={{ cols: "auto" }} md={{ cols: "auto" }}>
        Row
      </Row>
    )
    expect(getByText("Row").classList.contains("row-cols-md-auto")).toBe(true)
    expect(getByText("Row").classList.contains("row-cols-auto")).toBe(true)
  })
  it('uses "div" by default', () => {
    const { getByText } = render(
      <Row className="custom-class">
        <strong>Children</strong>
      </Row>
    )
    const y = getByText("Children").parentElement
    expect(y?.tagName.toLowerCase()).toEqual("div")
    expect(y?.classList.contains("row")).toBe(true)
    expect(y?.classList.contains("custom-class")).toBe(true)
    expect(getByText("Children").tagName.toLowerCase()).toEqual("strong")
  })
  it('should allow custom elements instead of "div"', () => {
    const { getByText } = render(<Row as="section">Row</Row>)
    expect(getByText("Row").tagName.toLowerCase()).toEqual("section")
    expect(getByText("Row").classList.contains("row")).toBe(true)
  })
  it("Should allow custom breakpoints", () => {
    const { getByText } = render(
      <ThemeProvider breakpoints={["custom"]}>
        <Row custom="3">test</Row>
      </ThemeProvider>
    )
    expect(getByText("test").classList.contains("row-cols-custom-3")).toBe(true)
  })
  it('should allow custom breakpoints smaller than default "xs"', () => {
    const { getByText } = render(
      <ThemeProvider breakpoints={["xxs", "xs"]} minBreakpoint="xxs">
        <Row xxs="3" xs="2">
          test
        </Row>
      </ThemeProvider>
    )
    expect(getByText("test").classList.contains("row-cols-3")).toBe(true)
    expect(getByText("test").classList.contains("row-cols-xs-2")).toBe(true)
  })
})
