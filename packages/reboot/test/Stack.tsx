import { render } from "@testing-library/react"
import { Stack } from "../src/Stack.jsx"

describe("<Stack>", () => {
  it("should render a vertical stack by default", () => {
    const { container } = render(<Stack />)
    expect(container.firstElementChild!.className).to.contain("vstack")
  })
  it("should render direction", () => {
    const { container } = render(<Stack direction="horizontal" />)
    expect(container.firstElementChild!.className).to.contain("hstack")
  })
  it("should render gap", () => {
    const { container } = render(<Stack gap={2} />)
    expect(container.firstElementChild!.classList.contains("gap-2")).toBe(true)
  })
  it("should render responsive gap", () => {
    const { container } = render(<Stack gap={{ md: 2 }} />)
    expect(container.firstElementChild!.classList.contains("gap-md-2")).to.be
      .true
  })
})
