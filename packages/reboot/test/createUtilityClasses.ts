import createUtilityClasses from "../src/createUtilityClasses"

describe("createUtilityClassName", () => {
  it("Should not create a class when value is not defined", () => {
    const classList = createUtilityClasses({
      gap: undefined,
    })
    expect(classList.length).toEqual(0)
  })
  it("Should handle falsy values", () => {
    const classList = createUtilityClasses({
      gap: 0,
    })
    expect(classList.length).toEqual(1)
    expect(classList).to.include.all.members(["gap-0"])
  })
  it("Should handle responsive falsy values", () => {
    const classList = createUtilityClasses({
      gap: { xs: 0, md: 0 },
    })
    expect(classList.length).toEqual(2)
    expect(classList).to.include.all.members(["gap-0", "gap-md-0"])
  })
  it("Should return `utilityName-value` when value is a primitive", () => {
    const classList = createUtilityClasses({
      gap: 2,
    })
    expect(classList.length).toEqual(1)
    expect(classList).to.include.all.members(["gap-2"])
  })
  it("Should return responsive class when value is a responsive type", () => {
    const classList = createUtilityClasses({
      gap: { xs: 2, lg: 3, xxl: 4 },
    })
    expect(classList.length).toEqual(3)
    expect(classList).to.include.all.members(["gap-2", "gap-lg-3", "gap-xxl-4"])
  })
  it("Should return multiple classes", () => {
    const classList = createUtilityClasses({
      gap: { xs: 2, lg: 3, xxl: 4 },
      text: { xs: "start", md: "end", xl: "start" },
    })
    expect(classList.length).toEqual(6)
    expect(classList).to.include.all.members([
      "gap-2",
      "gap-lg-3",
      "gap-xxl-4",
      "text-start",
      "text-md-end",
      "text-xl-start",
    ])
  })
  it("Should handle custom breakpoints", () => {
    const classList = createUtilityClasses(
      {
        gap: { xs: 2, custom: 3 },
      },
      ["xs", "custom"]
    )
    expect(classList.length).toEqual(2)
    expect(classList).to.include.all.members(["gap-2", "gap-custom-3"])
  })
})
