import { getDirection } from "../src/helpers.js"

describe("Helpers", () => {
  describe("getDirection", () => {
    it("Should return start for left", () => {
      expect(getDirection("left", false)).toEqual("start")
    })
    it("Should return end for left in RTL", () => {
      expect(getDirection("left", true)).toEqual("end")
    })
    it("Should return end for right", () => {
      expect(getDirection("right", false)).toEqual("end")
    })
    it("Should return start for right in RTL", () => {
      expect(getDirection("right", true)).toEqual("start")
    })
  })
})
