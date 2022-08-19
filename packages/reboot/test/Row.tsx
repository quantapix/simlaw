import { render } from "@testing-library/react"
import { ThemeProvider } from "../src/index.jsx"
import { Row } from "../src/Row.jsx"

describe("Row", () => {
  test('Should include "row" when there are no sizes', () => {
    const { getByText } = render(<Row>Row</Row>)
    getByText("Row").classList.contains("row").should.be.true
  })
  test("Should include sizes", () => {
    const { getByText } = render(
      <Row xs={4} md={8}>
        Row
      </Row>
    )
    getByText("Row").classList.contains("row-cols-md-8").should.be.true
    getByText("Row").classList.contains("row-cols-4").should.be.true
  })
  test("Should allow sizes as objects", () => {
    const { getByText } = render(
      <Row xs={{ cols: 4 }} md={{ cols: 8 }}>
        Row
      </Row>
    )
    getByText("Row").classList.contains("row-cols-md-8").should.be.true
    getByText("Row").classList.contains("row-cols-4").should.be.true
  })
  test("Should allow auto as size", () => {
    const { getByText } = render(
      <Row xs="auto" md="auto">
        Row
      </Row>
    )
    getByText("Row").classList.contains("row-cols-md-auto").should.be.true
    getByText("Row").classList.contains("row-cols-auto").should.be.true
  })
  test("Should allow auto as size in object form", () => {
    const { getByText } = render(
      <Row xs={{ cols: "auto" }} md={{ cols: "auto" }}>
        Row
      </Row>
    )
    getByText("Row").classList.contains("row-cols-md-auto").should.be.true
    getByText("Row").classList.contains("row-cols-auto").should.be.true
  })
  test('uses "div" by default', () => {
    const { getByText } = render(
      <Row className="custom-class">
        <strong>Children</strong>
      </Row>
    )
    const wrapper = getByText("Children").parentElement
    wrapper?.tagName.toLowerCase().should.equal("div")
    wrapper?.classList.contains("row").should.be.true
    wrapper?.classList.contains("custom-class").should.be.true
    getByText("Children").tagName.toLowerCase().should.equal("strong")
  })
  test('should allow custom elements instead of "div"', () => {
    const { getByText } = render(<Row as="section">Row</Row>)
    getByText("Row").tagName.toLowerCase().should.equal("section")
    getByText("Row").classList.contains("row").should.be.true
  })
  test("should allow custom breakpoints", () => {
    const { getByText } = render(
      <ThemeProvider breakpoints={["custom"]}>
        <Row custom="3">test</Row>
      </ThemeProvider>
    )
    getByText("test").classList.contains("row-cols-custom-3").should.be.true
  })
  test('should allow custom breakpoints smaller than default "xs"', () => {
    const { getByText } = render(
      <ThemeProvider breakpoints={["xxs", "xs"]} minBreakpoint="xxs">
        <Row xxs="3" xs="2">
          test
        </Row>
      </ThemeProvider>
    )
    getByText("test").classList.contains("row-cols-3").should.be.true
    getByText("test").classList.contains("row-cols-xs-2").should.be.true
  })
})
