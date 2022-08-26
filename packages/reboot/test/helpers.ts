import { getDirection } from "../src/helpers.js"

describe("Helpers", () => {
  describe("getDirection", () => {
    it("should return start for left", () => {
      expect(getDirection("left", false)).toEqual("start")
    })
    it("should return end for left in RTL", () => {
      expect(getDirection("left", true)).toEqual("end")
    })
    it("should return end for right", () => {
      expect(getDirection("right", false)).toEqual("end")
    })
    it("should return start for right in RTL", () => {
      expect(getDirection("right", true)).toEqual("start")
    })
  })
})
