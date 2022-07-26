import { createUtilClasses, Stack } from "../src/Stack.js"
import { render } from "@testing-library/react"

describe("createUtilityClassName", () => {
  it("should not create a class when value is not defined", () => {
    const y = createUtilClasses({ gap: undefined })
    expect(y.length).toEqual(0)
  })
  it("should handle falsy values", () => {
    const y = createUtilClasses({ gap: 0 })
    expect(y.length).toEqual(1)
    expect(y).toContain(["gap-0"])
  })
  it("should handle responsive falsy values", () => {
    const y = createUtilClasses({ gap: { xs: 0, md: 0 } })
    expect(y.length).toEqual(2)
    expect(y).toContain(["gap-0", "gap-md-0"])
  })
  it("should return `utilityName-value` when value is a primitive", () => {
    const y = createUtilClasses({ gap: 2 })
    expect(y.length).toEqual(1)
    expect(y).toContain(["gap-2"])
  })
  it("should return responsive class when value is a responsive type", () => {
    const y = createUtilClasses({ gap: { xs: 2, lg: 3, xxl: 4 } })
    expect(y.length).toEqual(3)
    expect(y).toContain(["gap-2", "gap-lg-3", "gap-xxl-4"])
  })
  it("should return multiple classes", () => {
    const y = createUtilClasses({
      gap: { xs: 2, lg: 3, xxl: 4 },
      text: { xs: "start", md: "end", xl: "start" },
    })
    expect(y.length).toEqual(6)
    expect(y).toContain([
      "gap-2",
      "gap-lg-3",
      "gap-xxl-4",
      "text-start",
      "text-md-end",
      "text-xl-start",
    ])
  })
  it("should handle custom breakpoints", () => {
    const y = createUtilClasses({ gap: { xs: 2, custom: 3 } }, ["xs", "custom"])
    expect(y.length).toEqual(2)
    expect(y).toContain(["gap-2", "gap-custom-3"])
  })
})
describe("Stack", () => {
  it("should render a vertical stack by default", () => {
    const { container: c } = render(<Stack />)
    expect(c.firstElementChild!.className).toContain("vstack")
  })
  it("should render direction", () => {
    const { container: c } = render(<Stack direction="horizontal" />)
    expect(c.firstElementChild!.className).toContain("hstack")
  })
  it("should render gap", () => {
    const { container: c } = render(<Stack gap={2} />)
    expect(c.firstElementChild!.classList.contains("gap-2")).toBe(true)
  })
  it("should render responsive gap", () => {
    const { container: c } = render(<Stack gap={{ md: 2 }} />)
    expect(c.firstElementChild!.classList.contains("gap-md-2")).toBe(true)
  })
})
