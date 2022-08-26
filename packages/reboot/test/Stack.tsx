import { render } from "@testing-library/react"
import { Stack } from "../src/Stack.jsx"

describe("<Stack>", () => {
  it("Should render a vertical stack by default", () => {
    const { container } = render(<Stack />)
    expect(container.firstElementChild!.className).toContain("vstack")
  })
  it("Should render direction", () => {
    const { container } = render(<Stack direction="horizontal" />)
    expect(container.firstElementChild!.className).toContain("hstack")
  })
  it("Should render gap", () => {
    const { container } = render(<Stack gap={2} />)
    expect(container.firstElementChild!.classList.contains("gap-2")).toBe(true)
  })
  it("Should render responsive gap", () => {
    const { container } = render(<Stack gap={{ md: 2 }} />)
    expect(container.firstElementChild!.classList.contains("gap-md-2")).toBe(
      true
    )
  })
})
