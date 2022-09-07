import {
  EN_US,
  getKeyboardLayout,
  KeycodeLayout,
  setKeyboardLayout,
} from "../../src/lumino/keyboard.js"
describe("../../src/lumino/keyboard", () => {
  describe("getKeyboardLayout()", () => {
    it("should return the global keyboard layout", () => {
      expect(getKeyboardLayout()).toEqual(EN_US)
    })
  })
  describe("setKeyboardLayout()", () => {
    it("should set the global keyboard layout", () => {
      const layout = new KeycodeLayout("ab-cd", {})
      setKeyboardLayout(layout)
      expect(getKeyboardLayout()).toEqual(layout)
      setKeyboardLayout(EN_US)
      expect(getKeyboardLayout()).toEqual(EN_US)
    })
  })
  describe("KeycodeLayout", () => {
    describe("#constructor()", () => {
      it("should construct a new keycode layout", () => {
        const layout = new KeycodeLayout("ab-cd", {})
        expect(layout).to.be.an.instanceof(KeycodeLayout)
      })
    })
    describe("#name", () => {
      it("should be a human readable name of the layout", () => {
        const layout = new KeycodeLayout("ab-cd", {})
        expect(layout.name).toEqual("ab-cd")
      })
    })
    describe("#keys()", () => {
      it("should get an array of all key values supported by the layout", () => {
        const layout = new KeycodeLayout("ab-cd", { 100: "F" })
        const keys = layout.keys()
        expect(keys.length).toEqual(1)
        expect(keys[0]).toEqual("F")
      })
    })
    describe("#isValidKey()", () => {
      it("should test whether the key is valid for the layout", () => {
        const layout = new KeycodeLayout("foo", { 100: "F" })
        expect(layout.isValidKey("F")).toEqual(true)
        expect(layout.isValidKey("A")).toEqual(false)
      })
      it("should treat modifier keys as valid", () => {
        const layout = new KeycodeLayout("foo", { 100: "F", 101: "A" }, ["A"])
        expect(layout.isValidKey("A")).toEqual(true)
      })
    })
    describe("#isModifierKey()", () => {
      it("should test whether the key is modifier for the layout", () => {
        const layout = new KeycodeLayout("foo", { 100: "F", 101: "A" }, ["A"])
        expect(layout.isModifierKey("F")).toEqual(false)
        expect(layout.isModifierKey("A")).toEqual(true)
      })
      it("should return false for keys that are not in the layout", () => {
        const layout = new KeycodeLayout("foo", { 100: "F", 101: "A" }, ["A"])
        expect(layout.isModifierKey("B")).toEqual(false)
      })
    })
    describe("#keyForKeydownEvent()", () => {
      it("should get the key for a `keydown` event", () => {
        const layout = new KeycodeLayout("foo", { 100: "F" })
        const event = new KeyboardEvent("keydown", { keyCode: 100 })
        const key = layout.keyForKeydownEvent(event as KeyboardEvent)
        expect(key).toEqual("F")
      })
      it("should return an empty string if the code is not valid", () => {
        const layout = new KeycodeLayout("foo", { 100: "F" })
        const event = new KeyboardEvent("keydown", { keyCode: 101 })
        const key = layout.keyForKeydownEvent(event as KeyboardEvent)
        expect(key).toEqual("")
      })
    })
    describe(".extractKeys()", () => {
      it("should extract the keys from a code map", () => {
        const keys: KeycodeLayout.CodeMap = { 70: "F", 71: "G", 72: "H" }
        const goal: KeycodeLayout.KeySet = { F: true, G: true, H: true }
        expect(KeycodeLayout.extractKeys(keys)).to.deep.equal(goal)
      })
    })
    describe(".convertToKeySet()", () => {
      it("should convert key array to key set", () => {
        const keys: string[] = ["F", "G", "H"]
        const goal: KeycodeLayout.KeySet = { F: true, G: true, H: true }
        expect(KeycodeLayout.convertToKeySet(keys)).to.deep.equal(goal)
      })
    })
  })
  describe("EN_US", () => {
    it("should be a keycode layout", () => {
      expect(EN_US).to.be.an.instanceof(KeycodeLayout)
    })
    it("should have standardized keys", () => {
      expect(EN_US.isValidKey("A")).toEqual(true)
      expect(EN_US.isValidKey("Z")).toEqual(true)
      expect(EN_US.isValidKey("0")).toEqual(true)
      expect(EN_US.isValidKey("a")).toEqual(false)
    })
    it("should have modifier keys", () => {
      expect(EN_US.isValidKey("Shift")).toEqual(true)
      expect(EN_US.isValidKey("Ctrl")).toEqual(true)
      expect(EN_US.isValidKey("Alt")).toEqual(true)
      expect(EN_US.isValidKey("Meta")).toEqual(true)
    })
    it("should correctly detect modifier keys", () => {
      expect(EN_US.isModifierKey("Shift")).toEqual(true)
      expect(EN_US.isModifierKey("Ctrl")).toEqual(true)
      expect(EN_US.isModifierKey("Alt")).toEqual(true)
      expect(EN_US.isModifierKey("Meta")).toEqual(true)
    })
  })
})
