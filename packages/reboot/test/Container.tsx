import { render } from "@testing-library/react"
import { Container } from "../src/Container.jsx"

describe("<Container>", () => {
  test("should render props correctly", () => {
    const { getByText } = render(
      <Container className="whatever">Container</Container>
    )
    getByText("Container").classList.contains("whatever").should.be.true
  })
  test('turns grid into "full-width" layout via "fluid" property set', () => {
    const { getByText } = render(<Container fluid>Container</Container>)
    getByText("Container").classList.contains("container-fluid").should.be.true
  })
  test("Should include size breakpoint class when fluid is set to sm, md, lg or xl", () => {
    const { getByText } = render(<Container fluid="sm">Container</Container>)
    getByText("Container").classList.contains("container-sm").should.be.true
  })
  test('allows custom elements instead of "div"', () => {
    const { getByText } = render(<Container as="section">Container</Container>)
    getByText("Container").classList.contains("container").should.be.true
    getByText("Container").tagName.toLowerCase().should.equal("section")
  })
  test("Should have div as default component", () => {
    const { getByText } = render(<Container>Container</Container>)
    getByText("Container").tagName.toLowerCase().should.equal("div")
  })
  test("should allow custom breakpoints", () => {
    const { getByText } = render(<Container fluid="custom">test</Container>)
    getByText("test").classList.contains("container-custom").should.be.true
  })
})
