import { createUtilClasses } from "../src/Stack.jsx"

describe("createUtilityClassName", () => {
  it("Should not create a class when value is not defined", () => {
    const y = createUtilClasses({ gap: undefined })
    expect(y.length).toEqual(0)
  })
  it("Should handle falsy values", () => {
    const y = createUtilClasses({ gap: 0 })
    expect(y.length).toEqual(1)
    expect(y).toContain(["gap-0"])
  })
  it("Should handle responsive falsy values", () => {
    const y = createUtilClasses({ gap: { xs: 0, md: 0 } })
    expect(y.length).toEqual(2)
    expect(y).toContain(["gap-0", "gap-md-0"])
  })
  it("Should return `utilityName-value` when value is a primitive", () => {
    const y = createUtilClasses({ gap: 2 })
    expect(y.length).toEqual(1)
    expect(y).toContain(["gap-2"])
  })
  it("Should return responsive class when value is a responsive type", () => {
    const y = createUtilClasses({ gap: { xs: 2, lg: 3, xxl: 4 } })
    expect(y.length).toEqual(3)
    expect(y).toContain(["gap-2", "gap-lg-3", "gap-xxl-4"])
  })
  it("Should return multiple classes", () => {
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
  it("Should handle custom breakpoints", () => {
    const y = createUtilClasses({ gap: { xs: 2, custom: 3 } }, ["xs", "custom"])
    expect(y.length).toEqual(2)
    expect(y).toContain(["gap-2", "gap-custom-3"])
  })
})
