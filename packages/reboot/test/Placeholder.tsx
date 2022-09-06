import { render } from "@testing-library/react"
import { Button, Placeholder } from "../src/Placeholder.js"

describe("<Placeholder>", () => {
  it("Should render a placeholder", () => {
    const { container } = render(<Placeholder />)
    expect(container.firstElementChild!.className).toContain("placeholder")
  })
  it("Should render size", () => {
    const { container } = render(<Placeholder size="lg" />)
    expect(container.firstElementChild!.className).toContain("placeholder-lg")
  })
  it("Should render animation", () => {
    const { container } = render(<Placeholder animation="glow" />)
    expect(container.firstElementChild!.className).toContain("placeholder-glow")
  })
  it("Should render bg", () => {
    const { container } = render(<Placeholder bg="primary" />)
    expect(container.firstElementChild!.className).toContain("bg-primary")
  })
})

describe("<Button>", () => {
  it("Should render a placeholder", () => {
    const { container } = render(<Button />)
    expect(container.firstElementChild!.className).toContain("placeholder")
  })
  it("Should render size", () => {
    const { container } = render(<Button size="lg" />)
    expect(container.firstElementChild!.className).toContain("placeholder-lg")
  })
  it("Should render animation", () => {
    const { container } = render(<Button animation="glow" />)
    expect(container.firstElementChild!.className).toContain("placeholder-glow")
  })
})
