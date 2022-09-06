import { getScrollbarSize } from "../src/base/utils.js"
import { injectCss } from "./tools.js"
import { Manager, getSharedManager } from "../src/Manager.js"

const createModal = () => ({ dialog: null, backdrop: null })

describe("Manager", () => {
  let ctner: any, mgr: any
  beforeEach(() => {
    mgr?.reset()
    mgr = new Manager()
    ctner = document.createElement("div")
    ctner.setAttribute("id", "container")
    const x = document.createElement("div")
    x.className = "fixed-top"
    ctner.appendChild(x)
    const x2 = document.createElement("div")
    x2.className = "sticky-top"
    ctner.appendChild(x2)
    const x3 = document.createElement("div")
    x3.className = "navbar-toggler"
    ctner.appendChild(x3)
    document.body.appendChild(ctner)
  })
  afterEach(() => {
    mgr?.reset()
    document.body.removeChild(ctner)
    ctner = null
    mgr = null
  })
  it("should add Modal", () => {
    const y = createModal()
    mgr.add(y)
    expect(mgr.modals.length).toEqual(1)
    expect(mgr.modals[0]).toEqual(y)
    expect(mgr.state).toEqual({
      scrollBarWidth: 0,
      style: { overflow: "", paddingRight: "" },
    })
  })
  it("should return a shared modal manager", () => {
    const y = getSharedManager()
    expect(y).toBeTruthy()
  })
  it("should return a same modal manager if called twice", () => {
    let m = getSharedManager()
    expect(m).toBeTruthy()
    const y = createModal()
    m.add(y as any)
    expect(m.modals.length).toEqual(1)
    m = getSharedManager()
    expect(m.modals.length).toEqual(1)
    m.remove(y as any)
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
    it("should set padding to right side", () => {
      const y = createModal()
      mgr.add(y)
      expect(document.body.style.paddingRight).toEqual(
        `${getScrollbarSize() + 20}px`
      )
    })
    it("should set padding to left side if RTL", () => {
      const y = createModal()
      new Manager({ isRTL: true }).add(y as any)
      expect(document.body.style.paddingLeft).toEqual(
        `${getScrollbarSize() + 20}px`
      )
    })
    it("should restore container overflow style", () => {
      const y = createModal()
      document.body.style.overflow = "scroll"
      expect(document.body.style.overflow).toEqual("scroll")
      mgr.add(y)
      mgr.remove(y)
      expect(document.body.style.overflow).toEqual("scroll")
      document.body.style.overflow = ""
    })
    it("should restore container overflow style for RTL", () => {
      const y = createModal()
      document.body.style.overflow = "scroll"
      expect(document.body.style.overflow).toEqual("scroll")
      const m = new Manager({ isRTL: true })
      m.add(y as any)
      m.remove(y as any)
      expect(document.body.style.overflow).toEqual("scroll")
      document.body.style.overflow = ""
    })
  })
})
