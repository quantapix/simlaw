import { render } from "@testing-library/react"
import { Stack } from "../src/Stack.jsx"

describe("<Stack>", () => {
  test("should render a vertical stack by default", () => {
    const { container } = render(<Stack />)
    container.firstElementChild!.className.should.contain("vstack")
  })
  test("should render direction", () => {
    const { container } = render(<Stack direction="horizontal" />)
    container.firstElementChild!.className.should.contain("hstack")
  })
  test("should render gap", () => {
    const { container } = render(<Stack gap={2} />)
    container.firstElementChild!.classList.contains("gap-2").should.be.true
  })
  test("should render responsive gap", () => {
    const { container } = render(<Stack gap={{ md: 2 }} />)
    container.firstElementChild!.classList.contains("gap-md-2").should.be.true
  })
})
