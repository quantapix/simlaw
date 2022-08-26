import { injectCss } from "../tools.js"
import { css, getScrollbarSize } from "../../src/base/utils.jsx"
import { Manager } from "../../src/base/Manager.jsx"

const createModal = () => ({ dialog: null, backdrop: null })

describe("ModalManager", () => {
  let container: any, manager: any
  beforeEach(() => {
    manager?.reset()
    manager = new Manager()
    container = document.createElement("div")
    container.setAttribute("id", "container")
    document.body.appendChild(container)
  })
  afterEach(() => {
    manager?.reset()
    document.body.removeChild(container)
    container = null
    manager = null
  })
  it("Should add Modal", () => {
    const modal = createModal()
    manager.add(modal)
    expect(manager.modals.length).toEqual(1)
    expect(manager.modals[0]).toEqual(modal)
    expect(manager.state).to.eql({
      scrollBarWidth: 0,
      style: {
        overflow: "",
        paddingRight: "",
      },
    })
  })
  it("Should not add a modal twice", () => {
    const modal = createModal()
    manager.add(modal)
    manager.add(modal)
    expect(manager.modals.length).toEqual(1)
  })
  it("Should add multiple modals", () => {
    const modalA = createModal()
    const modalB = createModal()
    manager.add(modalA)
    manager.add(modalB)
    expect(manager.modals.length).toEqual(2)
  })
  it("Should remove modal", () => {
    const modalA = createModal()
    const modalB = createModal()
    manager.add(modalA)
    manager.add(modalB)
    manager.remove(modalA)
    expect(manager.modals.length).toEqual(1)
  })
  describe("container styles", () => {
    beforeEach(() => {
      injectCss(`
        body {
          padding-right: 20px;
          padding-left: 20px;
          overflow: scroll;
        }
        #container {
          height: 4000px;
        }
      `)
    })
    afterEach(() => injectCss.reset())
    it("Should set container overflow to hidden ", () => {
      const modal = createModal()
      expect(document.body.style.overflow).toEqual("")
      manager.add(modal)
      expect(document.body.style.overflow).toEqual("hidden")
    })
    it("Should respect handleContainerOverflow", () => {
      const modal = createModal()
      expect(document.body.style.overflow).toEqual("")
      const modalManager = new Manager({ handleContainerOverflow: false })
      modalManager.add(modal)
      expect(document.body.style.overflow).toEqual("")
      modalManager.remove(modal)
      expect(document.body.style.overflow).toEqual("")
    })
    it("Should set add to existing container padding", () => {
      const modal = createModal()
      manager.add(modal)
      expect(document.body.style.paddingRight).toEqual(
        `${getScrollbarSize() + 20}px`
      )
    })
    it("Should set padding to left side if RTL", () => {
      const modal = createModal()
      new Manager({ isRTL: true }).add(modal)
      expect(document.body.style.paddingLeft).toEqual(
        `${getScrollbarSize() + 20}px`
      )
    })
    it("Should restore container overflow style", () => {
      const modal = createModal()
      document.body.style.overflow = "scroll"
      expect(document.body.style.overflow).toEqual("scroll")
      manager.add(modal)
      manager.remove(modal)
      expect(document.body.style.overflow).toEqual("scroll")
      document.body.style.overflow = ""
    })
    it("Should reset overflow style to the computed one", () => {
      const modal = createModal()
      expect(css(document.body, "overflow")).toEqual("scroll")
      manager.add(modal)
      manager.remove(modal)
      expect(document.body.style.overflow).toEqual("")
      expect(css(document.body, "overflow")).toEqual("scroll")
    })
    it("Should only remove styles when there are no associated modals", () => {
      const modalA = createModal()
      const modalB = createModal()
      expect(document.body.style.overflow).toEqual("")
      manager.add(modalA)
      manager.add(modalB)
      manager.remove(modalB)
      expect(document.body.style.overflow).toEqual("hidden")
      manager.remove(modalA)
      expect(document.body.style.overflow).toEqual("")
      expect(document.body.style.paddingRight).toEqual("")
    })
  })
})
