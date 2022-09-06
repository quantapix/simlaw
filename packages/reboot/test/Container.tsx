import { Container } from "../src/Container.js"
import { render } from "@testing-library/react"

describe("Container", () => {
  it("should render props correctly", () => {
    const { getByText } = render(
      <Container className="whatever">Container</Container>
    )
    expect(getByText("Container").classList.contains("whatever")).toBe(true)
  })
  it('turns grid into "full-width" layout via "fluid" property set', () => {
    const { getByText } = render(<Container fluid>Container</Container>)
    expect(getByText("Container").classList.contains("container-fluid")).toBe(
      true
    )
  })
  it("should include size breakpoint class when fluid is set to sm, md, lg or xl", () => {
    const { getByText } = render(<Container fluid="sm">Container</Container>)
    expect(getByText("Container").classList.contains("container-sm")).toBe(true)
  })
  it('allows custom elements instead of "div"', () => {
    const { getByText } = render(<Container as="section">Container</Container>)
    expect(getByText("Container").classList.contains("container")).toBe(true)
    expect(getByText("Container").tagName.toLowerCase()).toEqual("section")
  })
  it("should have div as default component", () => {
    const { getByText } = render(<Container>Container</Container>)
    expect(getByText("Container").tagName.toLowerCase()).toEqual("div")
  })
  it("should allow custom breakpoints", () => {
    const { getByText } = render(<Container fluid="custom">test</Container>)
    expect(getByText("test").classList.contains("container-custom")).toBe(true)
  })
})
