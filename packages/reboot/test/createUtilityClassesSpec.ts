import createUtilityClasses from "../src/createUtilityClasses"

describe("createUtilityClassName", () => {
  test("should not create a class when value is not defined", () => {
    const classList = createUtilityClasses({
      gap: undefined,
    })

    classList.length.should.equal(0)
  })

  test("should handle falsy values", () => {
    const classList = createUtilityClasses({
      gap: 0,
    })

    classList.length.should.equal(1)
    classList.should.include.all.members(["gap-0"])
  })

  test("should handle responsive falsy values", () => {
    const classList = createUtilityClasses({
      gap: { xs: 0, md: 0 },
    })

    classList.length.should.equal(2)
    classList.should.include.all.members(["gap-0", "gap-md-0"])
  })

  test("should return `utilityName-value` when value is a primitive", () => {
    const classList = createUtilityClasses({
      gap: 2,
    })

    classList.length.should.equal(1)
    classList.should.include.all.members(["gap-2"])
  })

  test("should return responsive class when value is a responsive type", () => {
    const classList = createUtilityClasses({
      gap: { xs: 2, lg: 3, xxl: 4 },
    })

    classList.length.should.equal(3)
    classList.should.include.all.members(["gap-2", "gap-lg-3", "gap-xxl-4"])
  })

  test("should return multiple classes", () => {
    const classList = createUtilityClasses({
      gap: { xs: 2, lg: 3, xxl: 4 },
      text: { xs: "start", md: "end", xl: "start" },
    })

    classList.length.should.equal(6)
    classList.should.include.all.members([
      "gap-2",
      "gap-lg-3",
      "gap-xxl-4",
      "text-start",
      "text-md-end",
      "text-xl-start",
    ])
  })

  test("should handle custom breakpoints", () => {
    const classList = createUtilityClasses(
      {
        gap: { xs: 2, custom: 3 },
      },
      ["xs", "custom"]
    )

    classList.length.should.equal(2)
    classList.should.include.all.members(["gap-2", "gap-custom-3"])
  })
})
