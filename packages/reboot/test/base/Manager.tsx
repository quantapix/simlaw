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
    const y = createModal()
    manager.add(y)
    expect(manager.modals.length).toEqual(1)
    expect(manager.modals[0]).toEqual(y)
    expect(manager.state).toEqual({
      scrollBarWidth: 0,
      style: {
        overflow: "",
        paddingRight: "",
      },
    })
  })
  it("Should not add a modal twice", () => {
    const y = createModal()
    manager.add(y)
    manager.add(y)
    expect(manager.modals.length).toEqual(1)
  })
  it("Should add multiple modals", () => {
    const y1 = createModal()
    const y2 = createModal()
    manager.add(y1)
    manager.add(y2)
    expect(manager.modals.length).toEqual(2)
  })
  it("Should remove modal", () => {
    const y1 = createModal()
    const y2 = createModal()
    manager.add(y1)
    manager.add(y2)
    manager.remove(y1)
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
      const y = createModal()
      expect(document.body.style.overflow).toEqual("")
      manager.add(y)
      expect(document.body.style.overflow).toEqual("hidden")
    })
    it("Should respect handleContainerOverflow", () => {
      const y = createModal()
      expect(document.body.style.overflow).toEqual("")
      const manager = new Manager({ handleContainerOverflow: false })
      manager.add(y)
      expect(document.body.style.overflow).toEqual("")
      manager.remove(y)
      expect(document.body.style.overflow).toEqual("")
    })
    it("Should set add to existing container padding", () => {
      const y = createModal()
      manager.add(y)
      expect(document.body.style.paddingRight).toEqual(
        `${getScrollbarSize() + 20}px`
      )
    })
    it("Should set padding to left side if RTL", () => {
      const y = createModal()
      new Manager({ isRTL: true }).add(y)
      expect(document.body.style.paddingLeft).toEqual(
        `${getScrollbarSize() + 20}px`
      )
    })
    it("Should restore container overflow style", () => {
      const y = createModal()
      document.body.style.overflow = "scroll"
      expect(document.body.style.overflow).toEqual("scroll")
      manager.add(y)
      manager.remove(y)
      expect(document.body.style.overflow).toEqual("scroll")
      document.body.style.overflow = ""
    })
    it("Should reset overflow style to the computed one", () => {
      const y = createModal()
      expect(css(document.body, "overflow")).toEqual("scroll")
      manager.add(y)
      manager.remove(y)
      expect(document.body.style.overflow).toEqual("")
      expect(css(document.body, "overflow")).toEqual("scroll")
    })
    it("Should only remove styles when there are no associated modals", () => {
      const y1 = createModal()
      const y2 = createModal()
      expect(document.body.style.overflow).toEqual("")
      manager.add(y1)
      manager.add(y2)
      manager.remove(y2)
      expect(document.body.style.overflow).toEqual("hidden")
      manager.remove(y1)
      expect(document.body.style.overflow).toEqual("")
      expect(document.body.style.paddingRight).toEqual("")
    })
  })
})
