import { getDirection } from "../src/helpers.js"

describe("Helpers", () => {
  describe("getDirection", () => {
    test("should return start for left", () => {
      getDirection("left", false).should.equal("start")
    })

    test("should return end for left in RTL", () => {
      getDirection("left", true).should.equal("end")
    })

    test("should return end for right", () => {
      getDirection("right", false).should.equal("end")
    })

    test("should return start for right in RTL", () => {
      getDirection("right", true).should.equal("start")
    })
  })
})
