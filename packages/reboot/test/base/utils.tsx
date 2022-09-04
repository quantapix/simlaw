import * as qu from "../../src/base/utils.js"
import $ from "jquery"
import simulant from "simulant"

function removeProperty(p: any, x: any) {
  Object.defineProperty(x, p, {
    value: undefined,
  })
}

describe("Class helpers", () => {
  beforeEach(() => {
    document.body.innerHTML = window.__html__["test/fixtures/class.html"]
  })
  it("Should add a class", () => {
    const y = document.getElementById("item-1")!
    qu.addClass(y, "my-class")
    expect(y.className).toContain("my-class")
  })
  it("Should add a class properly when using a fallback path", () => {
    const y = document.getElementById("item-1")!
    removeProperty("classList", y)
    qu.addClass(y, "test-class")
    expect(qu.hasClass(y, "test-class")).toEqual(true)
    qu.addClass(y, "test-class")
    qu.removeClass(y, "test-class")
    expect(qu.hasClass(y, "test-class")).toEqual(false)
    qu.addClass(y, "undefined")
    qu.addClass(y, "test-class2")
    expect(qu.hasClass(y, "test-class2")).toEqual(true)
  })
  it("Should remove a class", () => {
    const y = document.getElementById("item-2")!
    qu.removeClass(y, "test-class")
    expect(y.className).toEqual("")
  })
  it("Should check for a class", () => {
    expect(
      qu.hasClass(document.getElementById("item-2")!, "test-class")
    ).toEqual(true)
    expect(
      qu.hasClass(document.getElementById("item-1")!, "test-class")
    ).toEqual(false)
  })
  it("Should toggle class", () => {
    const y = document.getElementById("item-1")!
    removeProperty("classList", y)
    qu.toggleClass(y, "test-class")
    expect(qu.hasClass(y, "test-class")).toEqual(true)
    qu.toggleClass(y, "test-class")
    expect(qu.hasClass(y, "test-class")).toEqual(false)
  })
})
describe("DOM manipulation helpers", () => {
  beforeEach(() => {
    document.body.innerHTML = window.__html__["test/fixtures/dom-qu.html"]
  })
  it("Should check for input elements", () => {
    const y1 = document.querySelector("#child-1 :first-child")
    const y2 = document.querySelector("#child-1 :last-child")
    expect(qu.isInput(y1)).toBe(true)
    expect(qu.isInput(y2)).toBe(false)
  })
  it("Should check for visible elements", () => {
    const y1 = document.querySelector("#child-1 > span")
    const y2 = document.querySelector("#child-2 > span")
    expect(qu.isVisible(y1 as HTMLElement)).toBe(false)
    expect(qu.isVisible(y2 as HTMLElement)).toBe(true)
  })
  it("Should get an attribute of an element", () => {
    const y = document.querySelector("#child-1 :first-child")
    expect(qu.attribute(y, "disabled")).toBe("disabled")
  })
  it("Should set an attribute of an element", () => {
    const y = document.querySelector("#child-1 :first-child")
    qu.attribute(y, "disabled", false)
    expect(qu.attribute(y, "disabled")).toBe(null)
  })
  it("Should calculate the text content of a node", () => {
    const y = document.querySelector("#child-2 > span")!
    expect(qu.text(y)).toBe("Text content with multiple lines")
  })
  it("Should prepend a child on a node", () => {
    const y = document.getElementById("child-2")
    const child = document.createElement("span")
    qu.prepend(child, y)
    const children = qu.childElements(y)
    expect(children.length).toBe(2)
  })
  it("Should insert a node after a reference node", () => {
    const y = document.querySelector("#child-1 > input")
    const child = document.createElement("span")
    qu.insertAfter(child, y)
    const children = qu.childElements(y!.parentElement)
    expect(children.length).toBe(3)
  })
  it("Should clear an element", () => {
    const y = document.getElementById("child-2")
    qu.clear(y)
    expect(y?.innerHTML).toBe("")
  })
  it("Should remove an element", () => {
    const y = document.getElementById("child-2")
    qu.remove(y)
    expect(document.getElementById("child-2")).toBe(null)
  })
})
describe("DOM traversal helpers", () => {
  beforeEach(() => {
    document.body.innerHTML =
      window.__html__["test/fixtures/dom-traversal.html"]
  })
  it("Should collect child nodes", () => {
    const y = document.getElementById("root")
    const nodes = qu.childNodes(y)
    expect(nodes.length).toBe(5)
  })
  it("Should collect parent elements", () => {
    const y = document.querySelector(".some-class")
    const parents = qu.parents(y)
    expect(parents.length).toBe(4)
  })
  it("Should collect child elements", () => {
    const y = document.getElementById("root")
    const elements = qu.childElements(y)
    expect(elements.length).toBe(2)
  })
  it("Should collect siblings", () => {
    const y = document.querySelector(".some-class")
    const siblings = qu.siblings(y)
    expect(siblings.length).toBe(3)
  })
  it("Should collect next siblings until a selector is matched", () => {
    const y = document.querySelector("#child-2 div:first-child")
    const siblings = qu.nextUntil(y, ".some-class")
    expect(siblings.length).toBe(1)
  })
})
let unlisten
describe("Event helpers", () => {
  beforeEach(() => {
    document.body.innerHTML = window.__html__["test/fixtures/event.html"]
  })
  it("Should add an event listener", done => {
    const y = document.getElementById("item-2")!
    qu.addEventListener(y, "click", () => done())
    simulant.fire(y, "click")
  })
  it("Should remove an event listener", () => {
    const y = document.getElementById("item-2")!
    const handler = () => {
      throw new Error("event fired")
    }
    qu.addEventListener(y, "click", handler)
    qu.removeEventListener(y, "click", handler)
    simulant.fire(y, "click")
  })
  it("Should register an event listener with listen", done => {
    const y = document.getElementById("item-2")!
    qu.listen(y, "click", () => done())
    simulant.fire(y, "click")
  })
  it("Should remove the listener when unlisten() is called", () => {
    const y = document.getElementById("item-2")!
    unlisten = qu.listen(y, "click", () => {
      throw new Error("event fired")
    })
    unlisten()
    simulant.fire(y, "click")
  })
  it("Should filter handlers", () => {
    const span = document.getElementsByTagName("span")[0]!,
      sibling = document.getElementById("item-3")!,
      parent = document.getElementById("item-1")!,
      filtered = jest.fn(),
      handler = jest.fn()
    qu.addEventListener(parent, "click", handler)
    qu.addEventListener(parent, "click", qu.filterEvents("#item-2", filtered))
    simulant.fire(span, "click")
    simulant.fire(sibling, "click")
    expect(filtered).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledTimes(2)
  })
  it("Should trigger events", () => {
    const span = document.getElementsByTagName("span")[0]!
    const handler = jest.fn()
    qu.addEventListener(span, "click", handler)
    qu.triggerEvent(span, "click")
    expect(handler).toHaveBeenCalledTimes(1)
  })
})
describe("DOM helpers", () => {
  it("Should import", () => {
    require("../src")
  })
})
describe("Query helpers", () => {
  describe("QuerySelectorAll", () => {
    beforeEach(() => {
      document.body.innerHTML = window.__html__["test/fixtures/qsa.html"]
    })
    it("Should use qsa for complex selectors", () => {
      const mock = jest.fn(document.querySelectorAll)
      expect(qu.qsa(document, ".item-class li").length).toEqual(3)
      expect(mock).toHaveBeenCalledTimes(1)
      //mock.restore()
    })
  })
  describe("Matches", () => {
    beforeEach(() => {
      document.body.innerHTML = window.__html__["test/fixtures/matches.html"]
    })
    it("Should match", () => {
      const y = document.getElementById("middle")!
      expect(qu.matches(y, "#middle")).toBeTruthy()
      expect(qu.matches(y, "li#middle")).toBeTruthy()
      expect(qu.matches(y, ".item-class li")).toBeTruthy()
      expect(qu.matches(y, ".item-class")).not.toBeTruthy()
    })
  })
  describe("Contains", () => {
    beforeEach(() => {
      document.body.innerHTML = window.__html__["test/fixtures/qu.html"]
    })
    it("Should check for contained element", () => {
      const y = document.getElementById("item-3")!,
        parent = document.getElementById("item-1")!
      expect(qu.contains(parent, y)).toBeTruthy()
      expect(qu.contains(y, parent)).not.toBeTruthy()
    })
    it("Should handle orphaned elements", () => {
      const y = document.createElement("div")
      expect(qu.contains(document.body, y)).not.toBeTruthy()
    })
  })
  describe("Closest", () => {
    beforeEach(() => {
      document.body.innerHTML = window.__html__["test/fixtures/qu.html"]
    })
    it("find Closest node", () => {
      const y = document.getElementById("item-3")!,
        parent = document.getElementById("item-1")
      expect(qu.closest(y, "#item-1")).toEqual(parent)
      expect(qu.closest(y, "#item-40")).not.toBeTruthy()
    })
  })
  describe("ScrollParent", () => {
    beforeEach(() => {
      document.body.innerHTML = window.__html__["test/fixtures/qu.html"]
    })
    it("Should find scroll parent for inline elements", () => {
      const y = document.getElementById("scroll-child")!,
        parent = document.getElementById("scroll-parent")
      expect(qu.getScrollParent(y)).toEqual(parent)
    })
    it("Should ignore static parents when absolute", () => {
      const y = document.getElementById("scroll-child-rel")!,
        parent = document.getElementById("scroll-parent-rel")
      expect(qu.getScrollParent(y)).toEqual(parent)
    })
    it("Should handle fixed", () => {
      const y = document.getElementById("scroll-child-fixed")!
      expect(qu.getScrollParent(y) === document).toEqual(true)
    })
  })
  describe("Offset", () => {
    beforeEach(() => {
      document.body.innerHTML = window.__html__["test/fixtures/offset.html"]
    })
    it("Should fallback when node is disconnected", () => {
      const y = qu.getOffset(document.createElement("div"))
      expect(y.top).toEqual(0)
      expect(y.left).toEqual(0)
    })
    it("Should handle absolute position", () => {
      const y = document.getElementById("item-abs")!
      const offset = qu.getOffset(y)
      expect(offset.top).toEqual(400)
      expect(offset.left).toEqual(350)
    })
    it("Should handle nested positioning", () => {
      const y = document.getElementById("item-nested-abs")!
      const offset = qu.getOffset(y)
      expect(offset.top).toEqual(400)
      expect(offset.left).toEqual(200)
    })
    it("Should handle fixed offset", () => {
      const y = document.getElementById("item-fixed")!
      const offset = qu.getOffset(y)
      expect(offset.top).toEqual(400)
      expect(offset.left).toEqual(350)
    })
  })
  describe("Position", () => {
    beforeEach(() => {
      document.body.innerHTML = window.__html__["test/fixtures/offset.html"]
    })
    it("Should handle fixed offset", () => {
      const y = document.getElementById("item-fixed")!
      const offset = qu.position(y)
      expect({ left: offset.left, top: offset.top }).toEqual($(y).position())
    })
    it("Should handle absolute position", () => {
      const y = document.getElementById("item-abs")!
      const offset = qu.position(y)
      expect({ left: offset.left, top: offset.top }).toEqual($(y).position())
    })
    it("Should handle nested positioning", () => {
      const y = document.getElementById("item-nested-abs")!
      const offset = qu.position(y)
      expect({ left: offset.left, top: offset.top }).toEqual($(y).position())
    })
  })
})
let style: any
function reset() {
  if (style) style.remove()
  style = null
}
function injectCss(rules: any) {
  if (style) reset()
  style = $(`<style>${rules}</style>`)
  style.appendTo("head")
}
describe("style", () => {
  let container: any
  beforeEach(() => {
    container = $("<div/>")
    container.attr("id", "container")
    container.appendTo("body")
    container = container[0]
    injectCss(`
      body {
        font-size: 16px;
      }
      #container {
        padding-right: 20px;
        margin-left: 1em;
      }
    `)
  })
  afterEach(() => {
    $(container).remove()
    container = null
    reset()
  })
  it("Should get computed style", () => {
    expect(
      qu.getComputedStyle(container).getPropertyValue("margin-left")
    ).toEqual("16px")
    expect(
      qu.getComputedStyle(container).getPropertyValue("padding-right")
    ).toEqual("20px")
  })
  it("Should get style", () => {
    expect(qu.css(container, "margin-left")).toEqual("16px")
    expect(qu.css(container, "paddingRight")).toEqual("20px")
    expect(qu.css(container, "padding-right")).toEqual("20px")
  })
})
describe("transitionEnd", () => {
  // let clock: any
  beforeEach(() => {
    // clock = sinon.useFakeTimers()
  })
  afterEach(() => {
    // clock.restore()
  })
  it("Should parse duration from node property", () => {
    const y = document.createElement("div")
    y.style.transitionDuration = "1.4s"
    const mock1 = jest.fn()
    qu.transitionEnd(y, mock1)
    jest.advanceTimersByTime(1300)
    expect(mock1).toHaveBeenCalledTimes(0)
    expect(mock1).not.toHaveBeenCalled()
    jest.advanceTimersByTime(200)
    expect(mock1).toHaveBeenCalledTimes(1)
    y.style.transitionDuration = "500ms"
    const mock2 = jest.fn()
    qu.transitionEnd(y, mock2)
    jest.advanceTimersByTime(400)
    expect(mock2).toHaveBeenCalledTimes(0)
    jest.advanceTimersByTime(200)
    expect(mock2).toHaveBeenCalledTimes(1)
  })
})
describe("utils", () => {
  describe("requestAnimationFrame", () => {
    it("Should find api", done => {
      qu.request(() => done())
    })
    it("Should cancel", done => {
      const id = qu.request(() => {
        throw new Error()
      })
      qu.cancel(id)
      setTimeout(() => done(), 30)
    })
  })
  describe("scrollbarSize", () => {
    it("Should return a size", () => {
      expect(qu.getScrollbarSize()).toBe("number")
    })
    it("Should return a size when recalculating", () => {
      qu.getScrollbarSize()
      expect(qu.getScrollbarSize(true)).toBe("number")
    })
    it("Should return a size over and over again", () => {
      expect(qu.getScrollbarSize()).toBe("number")
      expect(qu.getScrollbarSize()).toBe("number")
      expect(qu.getScrollbarSize()).toBe("number")
    })
  })
})
