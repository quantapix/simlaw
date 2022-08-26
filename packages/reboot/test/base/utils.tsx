import cls from "../src"
import manip from "../src"
import traversal from "../src"
import simulant from "simulant"
import evt from "../src"
import $ from "jquery"
import query from "../src"
const qsa = query.querySelectorAll
import $ from "jquery"
import css from "../src/css"
import getComputedStyle from "../src/getComputedStyle"
import transitionEnd from "../src/transitionEnd"
import { request, cancel } from "../src/animationFrame"
import scrollbarSize from "../src/scrollbarSize"

function removeProperty(property, element) {
  Object.defineProperty(element, property, {
    value: undefined,
  })
}
describe("Class helpers", () => {
  beforeEach(() => {
    document.body.innerHTML = window.__html__["test/fixtures/class.html"]
  })
  it("should add a class", () => {
    const el = document.getElementById("item-1")
    cls.addClass(el, "my-class")
    expect(el.className).toContain("my-class")
  })
  it("should add a class properly when using a fallback path", () => {
    const el = document.getElementById("item-1")
    removeProperty("classList", el)
    cls.addClass(el, "test-class")
    expect(cls.hasClass(el, "test-class")).toEqual(true)
    cls.addClass(el, "test-class")
    cls.removeClass(el, "test-class")
    expect(cls.hasClass(el, "test-class")).toEqual(false)
    cls.addClass(el, "undefined")
    cls.addClass(el, "test-class2")
    expect(cls.hasClass(el, "test-class2")).toEqual(true)
  })
  it("should remove a class", () => {
    const el = document.getElementById("item-2")
    cls.removeClass(el, "test-class")
    expect(el.className).toEqual("")
  })
  it("should check for a class", () => {
    expect(
      cls.hasClass(document.getElementById("item-2"), "test-class")
    ).toEqual(true)
    expect(
      cls.hasClass(document.getElementById("item-1"), "test-class")
    ).toEqual(false)
  })
  it("should toggle class", () => {
    const el = document.getElementById("item-1")
    removeProperty("classList", el)
    cls.toggleClass(el, "test-class")
    expect(cls.hasClass(el, "test-class")).toEqual(true)
    cls.toggleClass(el, "test-class")
    expect(cls.hasClass(el, "test-class")).toEqual(false)
  })
})
describe("DOM manipulation helpers", () => {
  beforeEach(() => {
    document.body.innerHTML = window.__html__["test/fixtures/dom-manip.html"]
  })
  it("should check for input elements", () => {
    const input = document.querySelector("#child-1 :first-child")
    const nonInput = document.querySelector("#child-1 :last-child")
    expect(manip.isInput(input)).toBe(true)
    expect(manip.isInput(nonInput)).toBe(false)
  })
  it("should check for visible elements", () => {
    const invisible = document.querySelector("#child-1 > span")
    const visible = document.querySelector("#child-2 > span")
    expect(manip.isVisible(invisible)).toBe(false)
    expect(manip.isVisible(visible)).toBe(true)
  })
  it("should get an attribute of an element", () => {
    const el = document.querySelector("#child-1 :first-child")
    const val = manip.attribute(el, "disabled")
    expect(val).toBe("disabled")
  })
  it("should set an attribute of an element", () => {
    const el = document.querySelector("#child-1 :first-child")
    let val
    manip.attribute(el, "disabled", false)
    val = manip.attribute(el, "disabled")
    expect(val).toBe(null)
  })
  it("should calculate the text content of a node", () => {
    const el = document.querySelector("#child-2 > span")
    expect(manip.text(el)).toBe("Text content with multiple lines")
  })
  it("should prepend a child on a node", () => {
    const el = document.getElementById("child-2")
    const child = document.createElement("span")
    manip.prepend(child, el)
    const children = manip.childElements(el)
    expect(children.length).toBe(2)
  })
  it("should insert a node after a reference node", () => {
    const el = document.querySelector("#child-1 > input")
    const child = document.createElement("span")
    manip.insertAfter(child, el)
    const children = manip.childElements(el.parentElement)
    expect(children.length).toBe(3)
  })
  it("should clear an element", () => {
    const el = document.getElementById("child-2")
    manip.clear(el)
    expect(el.innerHTML).toBe("")
  })
  it("should remove an element", () => {
    const el = document.getElementById("child-2")
    manip.remove(el)
    expect(document.getElementById("child-2")).toBe(null)
  })
})
describe("DOM traversal helpers", () => {
  beforeEach(() => {
    document.body.innerHTML =
      window.__html__["test/fixtures/dom-traversal.html"]
  })
  it("should collect child nodes", () => {
    const el = document.getElementById("root")
    const nodes = traversal.childNodes(el)
    expect(nodes.length).toBe(5)
  })
  it("should collect parent elements", () => {
    const el = document.querySelector(".some-class")
    const parents = traversal.parents(el)
    expect(parents.length).toBe(4)
  })
  it("should collect child elements", () => {
    const el = document.getElementById("root")
    const elements = traversal.childElements(el)
    expect(elements.length).toBe(2)
  })
  it("should collect siblings", () => {
    const el = document.querySelector(".some-class")
    const siblings = traversal.siblings(el)
    expect(siblings.length).toBe(3)
  })
  it("should collect next siblings until a selector is matched", () => {
    const el = document.querySelector("#child-2 div:first-child")
    const siblings = traversal.nextUntil(el, ".some-class")
    expect(siblings.length).toBe(1)
  })
})
let unlisten
describe("Event helpers", () => {
  beforeEach(() => {
    document.body.innerHTML = window.__html__["test/fixtures/event.html"]
  })
  it("should add an event listener", done => {
    const el = document.getElementById("item-2")
    evt.addEventListener(el, "click", () => done())
    simulant.fire(el, "click")
  })
  it("should remove an event listener", () => {
    const el = document.getElementById("item-2"),
      handler = () => {
        throw new Error("event fired")
      }
    evt.addEventListener(el, "click", handler)
    evt.removeEventListener(el, "click", handler)
    simulant.fire(el, "click")
  })
  it("should register an event listener with listen", done => {
    const el = document.getElementById("item-2")
    evt.listen(el, "click", () => done())
    simulant.fire(el, "click")
  })
  it("should remove the listener when unlisten() is called", () => {
    const el = document.getElementById("item-2")
    unlisten = evt.listen(el, "click", () => {
      throw new Error("event fired")
    })
    unlisten()
    simulant.fire(el, "click")
  })
  it("should filter handlers", () => {
    const span = document.getElementsByTagName("span")[0],
      sibling = document.getElementById("item-3"),
      parent = document.getElementById("item-1"),
      filtered = jest.fn(),
      handler = jest.fn()
    evt.addEventListener(parent, "click", handler)
    evt.addEventListener(parent, "click", evt.filter("#item-2", filtered))
    simulant.fire(span, "click")
    simulant.fire(sibling, "click")
    expect(filtered.callCount).toEqual(1)
    expect(handler.callCount).toEqual(2)
  })
  it("should trigger events", () => {
    const span = document.getElementsByTagName("span")[0],
      handler = jest.fn()
    evt.addEventListener(span, "click", handler)
    evt.triggerEvent(span, "click")
    expect(handler.callCount).toEqual(1)
  })
})
describe("DOM helpers", () => {
  it("should import", () => {
    require("../src")
  })
})
describe("Query helpers", () => {
  describe("QuerySelectorAll", () => {
    beforeEach(() => {
      document.body.innerHTML = window.__html__["test/fixtures/qsa.html"]
    })
    it("should use qsa for complex selectors", () => {
      const mock = jest.fn(document, "querySelectorAll")
      expect(qsa(document, ".item-class li").length).toEqual(3)
      expect(mock.callCount).toEqual(1)
      mock.restore()
    })
  })
  describe("Matches", () => {
    beforeEach(() => {
      document.body.innerHTML = window.__html__["test/fixtures/matches.html"]
    })
    it("should match", () => {
      const child = document.getElementById("middle")
      expect(query.matches(child, "#middle")).toBeTruthy()
      expect(query.matches(child, "li#middle")).toBeTruthy()
      expect(query.matches(child, ".item-class li")).toBeTruthy()
      expect(query.matches(child, ".item-class")).not.toBeTruthy()
    })
  })
  describe("Contains", () => {
    beforeEach(() => {
      document.body.innerHTML = window.__html__["test/fixtures/query.html"]
    })
    it("should check for contained element", () => {
      const child = document.getElementById("item-3"),
        parent = document.getElementById("item-1")
      expect(query.contains(parent, child)).toBeTruthy()
      expect(query.contains(child, parent)).not.toBeTruthy()
    })
    it("should handle orphaned elements", () => {
      const orphan = document.createElement("div")
      expect(query.contains(document.body, orphan)).not.toBeTruthy()
    })
  })
  describe("Closest", () => {
    beforeEach(() => {
      document.body.innerHTML = window.__html__["test/fixtures/query.html"]
    })
    it("find Closest node", () => {
      const child = document.getElementById("item-3"),
        parent = document.getElementById("item-1")
      expect(query.closest(child, "#item-1")).toEqual(parent)
      expect(query.closest(child, "#item-40")).not.toBeTruthy()
    })
  })
  describe("ScrollParent", () => {
    beforeEach(() => {
      document.body.innerHTML = window.__html__["test/fixtures/query.html"]
    })
    it("should find scroll parent for inline elements", () => {
      const child = document.getElementById("scroll-child"),
        parent = document.getElementById("scroll-parent")
      expect(query.scrollParent(child)).toEqual(parent)
    })
    it("should ignore static parents when absolute", () => {
      const child = document.getElementById("scroll-child-rel"),
        parent = document.getElementById("scroll-parent-rel")
      expect(query.scrollParent(child)).toEqual(parent)
    })
    it("should handle fixed", () => {
      const child = document.getElementById("scroll-child-fixed")
      expect(query.scrollParent(child) === document).toEqual(true)
    })
  })
  describe("Offset", () => {
    beforeEach(() => {
      document.body.innerHTML = window.__html__["test/fixtures/offset.html"]
    })
    it("should fallback when node is disconnected", () => {
      const offset = query.offset(document.createElement("div"))
      expect(offset.top).toEqual(0)
      expect(offset.left).toEqual(0)
    })
    it("should handle absolute position", () => {
      const item = document.getElementById("item-abs")
      const offset = query.offset(item)
      expect(offset.top).toEqual(400)
      expect(offset.left).toEqual(350)
    })
    it("should handle nested positioning", () => {
      const item = document.getElementById("item-nested-abs")
      const offset = query.offset(item)
      expect(offset.top).toEqual(400)
      expect(offset.left).toEqual(200)
    })
    it("should handle fixed offset", () => {
      const item = document.getElementById("item-fixed")
      const offset = query.offset(item)
      expect(offset.top).toEqual(400)
      expect(offset.left).toEqual(350)
    })
  })
  describe("Position", () => {
    beforeEach(() => {
      document.body.innerHTML = window.__html__["test/fixtures/offset.html"]
    })
    it("should handle fixed offset", () => {
      const item = document.getElementById("item-fixed")
      const offset = query.position(item)
      expect({ left: offset.left, top: offset.top }).to.be.eql(
        $(item).position()
      )
    })
    it("should handle absolute position", () => {
      const item = document.getElementById("item-abs")
      const offset = query.position(item)
      expect({ left: offset.left, top: offset.top }).to.be.eql(
        $(item).position()
      )
    })
    it("should handle nested positioning", () => {
      const item = document.getElementById("item-nested-abs")
      const offset = query.position(item)
      expect({ left: offset.left, top: offset.top }).to.be.eql(
        $(item).position()
      )
    })
  })
})
let style: any
function reset() {
  if (style) {
    style.remove()
  }
  style = null
}
function injectCss(rules) {
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
  it("should get computed style", () => {
    expect(getComputedStyle(container).getPropertyValue("margin-left")).toEqual(
      "16px"
    )
    expect(
      getComputedStyle(container).getPropertyValue("padding-right")
    ).toEqual("20px")
  })
  it("should get style", () => {
    expect(css(container, "margin-left")).toEqual("16px")
    expect(css(container, "paddingRight")).toEqual("20px")
    expect(css(container, "padding-right")).toEqual("20px")
  })
})
describe("transitionEnd", () => {
  let clock: any
  beforeEach(() => {
    clock = sinon.useFakeTimers()
  })
  afterEach(() => {
    clock.restore()
  })
  it("should parse duration from node property", () => {
    const el = document.createElement("div")
    el.style.transitionDuration = "1.4s"
    const handler1 = jest.fn()
    transitionEnd(el, handler1)
    clock.tick(1300)
    expect(handler1.callCount).toEqual(0)
    expect(handler1).to.not.be.called
    clock.tick(200)
    expect(handler1.callCount).toEqual(1)
    el.style.transitionDuration = "500ms"
    const handler2 = jest.fn()
    transitionEnd(el, handler2)
    clock.tick(400)
    expect(handler2.callCount).toEqual(0)
    clock.tick(200)
    expect(handler2.callCount).toEqual(1)
  })
})
describe("utils", () => {
  describe("requestAnimationFrame", () => {
    it("should find api", done => {
      request(() => done())
    })
    it("should cancel", done => {
      const id = request(() => {
        throw new Error()
      })
      cancel(id)
      setTimeout(() => done(), 30)
    })
  })
  describe("scrollbarSize", () => {
    it("should return a size", () => {
      expect(scrollbarSize()).to.be.a("number")
    })
    it("should return a size when recalculating", () => {
      scrollbarSize()
      expect(scrollbarSize(true)).to.be.a("number")
    })
    it("should return a size over and over again", () => {
      expect(scrollbarSize()).to.be.a("number")
      expect(scrollbarSize()).to.be.a("number")
      expect(scrollbarSize()).to.be.a("number")
    })
  })
})
