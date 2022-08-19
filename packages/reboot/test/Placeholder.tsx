import { render } from "@testing-library/react"
import { Button, Placeholder } from "../src/Placeholder.jsx"

describe("<Placeholder>", () => {
  test("should render a placeholder", () => {
    const { container } = render(<Placeholder />)
    container.firstElementChild!.className.should.contain("placeholder")
  })
  test("should render size", () => {
    const { container } = render(<Placeholder size="lg" />)
    container.firstElementChild!.className.should.contain("placeholder-lg")
  })
  test("should render animation", () => {
    const { container } = render(<Placeholder animation="glow" />)
    container.firstElementChild!.className.should.contain("placeholder-glow")
  })
  test("should render bg", () => {
    const { container } = render(<Placeholder bg="primary" />)
    container.firstElementChild!.className.should.contain("bg-primary")
  })
})

describe("<Button>", () => {
  test("should render a placeholder", () => {
    const { container } = render(<Button />)
    container.firstElementChild!.className.should.contain("placeholder")
  })
  test("should render size", () => {
    const { container } = render(<Button size="lg" />)
    container.firstElementChild!.className.should.contain("placeholder-lg")
  })
  test("should render animation", () => {
    const { container } = render(<Button animation="glow" />)
    container.firstElementChild!.className.should.contain("placeholder-glow")
  })
})
