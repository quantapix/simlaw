const cls = require("../src")
const manip = require("../src")
const traversal = require("../src")
const simulant = require("simulant")
const evt = require("../src")
const $ = require("jquery")
const query = require("../src")
const qsa = query.querySelectorAll
const $ = require("jquery")
const css = require("../src/css")
const getComputedStyle = require("../src/getComputedStyle")
const transitionEnd = require("../src/transitionEnd")
const { request, cancel } = require("../src/animationFrame")
const scrollbarSize = require("../src/scrollbarSize")

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
    expect(el.className).to.contain("my-class")
  })
  it("should add a class properly when using a fallback path", () => {
    const el = document.getElementById("item-1")
    removeProperty("classList", el)
    cls.addClass(el, "test-class")
    expect(cls.hasClass(el, "test-class")).to.equal(true)
    cls.addClass(el, "test-class")
    cls.removeClass(el, "test-class")
    expect(cls.hasClass(el, "test-class")).to.equal(false)
    cls.addClass(el, "undefined")
    cls.addClass(el, "test-class2")
    expect(cls.hasClass(el, "test-class2")).to.equal(true)
  })
  it("should remove a class", () => {
    const el = document.getElementById("item-2")
    cls.removeClass(el, "test-class")
    expect(el.className).to.equal("")
  })
  it("should check for a class", () => {
    expect(
      cls.hasClass(document.getElementById("item-2"), "test-class")
    ).to.equal(true)
    expect(
      cls.hasClass(document.getElementById("item-1"), "test-class")
    ).to.equal(false)
  })
  it("should toggle class", () => {
    const el = document.getElementById("item-1")
    removeProperty("classList", el)
    cls.toggleClass(el, "test-class")
    expect(cls.hasClass(el, "test-class")).to.equal(true)
    cls.toggleClass(el, "test-class")
    expect(cls.hasClass(el, "test-class")).to.equal(false)
  })
})
describe("DOM manipulation helpers", () => {
  beforeEach(() => {
    document.body.innerHTML = window.__html__["test/fixtures/dom-manip.html"]
  })
  it("should check for input elements", () => {
    const input = document.querySelector("#child-1 :first-child")
    const nonInput = document.querySelector("#child-1 :last-child")
    expect(manip.isInput(input)).to.be(true)
    expect(manip.isInput(nonInput)).to.be(false)
  })
  it("should check for visible elements", () => {
    const invisible = document.querySelector("#child-1 > span")
    const visible = document.querySelector("#child-2 > span")
    expect(manip.isVisible(invisible)).to.be(false)
    expect(manip.isVisible(visible)).to.be(true)
  })
  it("should get an attribute of an element", () => {
    const el = document.querySelector("#child-1 :first-child")
    const val = manip.attribute(el, "disabled")
    expect(val).to.be("disabled")
  })
  it("should set an attribute of an element", () => {
    const el = document.querySelector("#child-1 :first-child")
    let val
    manip.attribute(el, "disabled", false)
    val = manip.attribute(el, "disabled")
    expect(val).to.be(null)
  })
  it("should calculate the text content of a node", () => {
    const el = document.querySelector("#child-2 > span")
    expect(manip.text(el)).to.be("Text content with multiple lines")
  })
  it("should prepend a child on a node", () => {
    const el = document.getElementById("child-2")
    const child = document.createElement("span")
    manip.prepend(child, el)
    const children = manip.childElements(el)
    expect(children.length).to.be(2)
  })
  it("should insert a node after a reference node", () => {
    const el = document.querySelector("#child-1 > input")
    const child = document.createElement("span")
    manip.insertAfter(child, el)
    const children = manip.childElements(el.parentElement)
    expect(children.length).to.be(3)
  })
  it("should clear an element", () => {
    const el = document.getElementById("child-2")
    manip.clear(el)
    expect(el.innerHTML).to.be("")
  })
  it("should remove an element", () => {
    const el = document.getElementById("child-2")
    manip.remove(el)
    expect(document.getElementById("child-2")).to.be(null)
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
    expect(nodes.length).to.be(5)
  })
  it("should collect parent elements", () => {
    const el = document.querySelector(".some-class")
    const parents = traversal.parents(el)
    expect(parents.length).to.be(4)
  })
  it("should collect child elements", () => {
    const el = document.getElementById("root")
    const elements = traversal.childElements(el)
    expect(elements.length).to.be(2)
  })
  it("should collect siblings", () => {
    const el = document.querySelector(".some-class")
    const siblings = traversal.siblings(el)
    expect(siblings.length).to.be(3)
  })
  it("should collect next siblings until a selector is matched", () => {
    const el = document.querySelector("#child-2 div:first-child")
    const siblings = traversal.nextUntil(el, ".some-class")
    expect(siblings.length).to.be(1)
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
      filtered = sinon.spy(),
      handler = sinon.spy()
    evt.addEventListener(parent, "click", handler)
    evt.addEventListener(parent, "click", evt.filter("#item-2", filtered))
    simulant.fire(span, "click")
    simulant.fire(sibling, "click")
    expect(filtered.callCount).to.equal(1)
    expect(handler.callCount).to.equal(2)
  })
  it("should trigger events", () => {
    const span = document.getElementsByTagName("span")[0],
      handler = sinon.spy()
    evt.addEventListener(span, "click", handler)
    evt.triggerEvent(span, "click")
    expect(handler.callCount).to.equal(1)
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
      const spy = sinon.spy(document, "querySelectorAll")
      expect(qsa(document, ".item-class li").length).to.equal(3)
      expect(spy.callCount).to.equal(1)
      spy.restore()
    })
  })
  describe("Matches", () => {
    beforeEach(() => {
      document.body.innerHTML = window.__html__["test/fixtures/matches.html"]
    })
    it("should match", () => {
      const child = document.getElementById("middle")
      expect(query.matches(child, "#middle")).to.be.ok()
      expect(query.matches(child, "li#middle")).to.be.ok()
      expect(query.matches(child, ".item-class li")).to.be.ok()
      expect(query.matches(child, ".item-class")).to.not.be.ok()
    })
  })
  describe("Contains", () => {
    beforeEach(() => {
      document.body.innerHTML = window.__html__["test/fixtures/query.html"]
    })
    it("should check for contained element", () => {
      const child = document.getElementById("item-3"),
        parent = document.getElementById("item-1")
      expect(query.contains(parent, child)).to.be.ok()
      expect(query.contains(child, parent)).to.not.be.ok()
    })
    it("should handle orphaned elements", () => {
      const orphan = document.createElement("div")
      expect(query.contains(document.body, orphan)).to.not.be.ok()
    })
  })
  describe("Closest", () => {
    beforeEach(() => {
      document.body.innerHTML = window.__html__["test/fixtures/query.html"]
    })
    it("find Closest node", () => {
      const child = document.getElementById("item-3"),
        parent = document.getElementById("item-1")
      expect(query.closest(child, "#item-1")).to.equal(parent)
      expect(query.closest(child, "#item-40")).to.not.exist
    })
  })
  describe("ScrollParent", () => {
    beforeEach(() => {
      document.body.innerHTML = window.__html__["test/fixtures/query.html"]
    })
    it("should find scroll parent for inline elements", () => {
      const child = document.getElementById("scroll-child"),
        parent = document.getElementById("scroll-parent")
      expect(query.scrollParent(child)).to.be.equal(parent)
    })
    it("should ignore static parents when absolute", () => {
      const child = document.getElementById("scroll-child-rel"),
        parent = document.getElementById("scroll-parent-rel")
      expect(query.scrollParent(child)).to.be.equal(parent)
    })
    it("should handle fixed", () => {
      const child = document.getElementById("scroll-child-fixed")
      expect(query.scrollParent(child) === document).to.be.equal(true)
    })
  })
  describe("Offset", () => {
    beforeEach(() => {
      document.body.innerHTML = window.__html__["test/fixtures/offset.html"]
    })
    it("should fallback when node is disconnected", () => {
      const offset = query.offset(document.createElement("div"))
      expect(offset.top).to.be.equal(0)
      expect(offset.left).to.be.equal(0)
    })
    it("should handle absolute position", () => {
      const item = document.getElementById("item-abs")
      const offset = query.offset(item)
      expect(offset.top).to.be.equal(400)
      expect(offset.left).to.be.equal(350)
    })
    it("should handle nested positioning", () => {
      const item = document.getElementById("item-nested-abs")
      const offset = query.offset(item)
      expect(offset.top).to.be.equal(400)
      expect(offset.left).to.be.equal(200)
    })
    it("should handle fixed offset", () => {
      const item = document.getElementById("item-fixed")
      const offset = query.offset(item)
      expect(offset.top).to.be.equal(400)
      expect(offset.left).to.be.equal(350)
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
      // console.log( $(item).offset(),
      //   $(item).offsetParent().scrollTop())
      // console.log(query.offset(item),
      //   query.scrollTop(query.offsetParent(item)))
      expect({ left: offset.left, top: offset.top }).to.be.eql(
        $(item).position()
      )
    })
  })
})
let style
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
  let container
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
    expect(
      getComputedStyle(container).getPropertyValue("margin-left")
    ).to.equal("16px")
    expect(
      getComputedStyle(container).getPropertyValue("padding-right")
    ).to.equal("20px")
  })
  it("should get style", () => {
    expect(css(container, "margin-left")).to.equal("16px")
    expect(css(container, "paddingRight")).to.equal("20px")
    expect(css(container, "padding-right")).to.equal("20px")
  })
})
describe("transitionEnd", () => {
  let clock
  beforeEach(() => {
    clock = sinon.useFakeTimers()
  })
  afterEach(() => {
    clock.restore()
  })
  it("should parse duration from node property", () => {
    const el = document.createElement("div")
    el.style.transitionDuration = "1.4s"
    const handler1 = sinon.spy()
    transitionEnd(el, handler1)
    clock.tick(1300)
    expect(handler1.callCount).to.equal(0)
    expect(handler1).to.not.be.called
    clock.tick(200)
    expect(handler1.callCount).to.equal(1)
    el.style.transitionDuration = "500ms"
    const handler2 = sinon.spy()
    transitionEnd(el, handler2)
    clock.tick(400)
    expect(handler2.callCount).to.equal(0)
    clock.tick(200)
    expect(handler2.callCount).to.equal(1)
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