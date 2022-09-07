import { ElementExt } from "../../src/lumino/domutils.js"
const STYLE_TEXT = `
.box-sizing {
  border-top: solid 10px black;
  border-left: solid 15px black;
  padding: 15px 8px 9px 12px;
}
.size-limits {
  min-width: 90px;
  min-height: 95px;
  max-width: 100px;
  max-height: 105px;
}
.hit-test {
  position: absolute;
  top: 0;
  left: 0;
  width: 100px;
  height: 100px;
}
.scroll-area {
  position: absolute;
  overflow: auto;
  top: 0px;
  left: 0px;
  width: 300px;
  height: 600px;
}
.scroll-elemA {
  position: absolute;
  top: 50px;
  left: 50px;
  width: 100px;
  height: 700px;
}
.scroll-elemB {
  position: absolute;
  top: 70px;
  left: 100px;
  width: 100px;
  height: 100px;
}
`
describe("../../src/lumino/domutils", () => {
  describe("ElementExt", () => {
    const styleNode = document.createElement("style")
    before(() => {
      styleNode.textContent = STYLE_TEXT
      document.head.appendChild(styleNode)
    })
    after(() => {
      document.head.removeChild(styleNode)
    })
    let div: HTMLElement = null!
    beforeEach(() => {
      div = document.createElement("div")
      document.body.appendChild(div)
    })
    afterEach(() => {
      document.body.removeChild(div)
    })
    describe("boxSizing()", () => {
      it("should return a box sizing with correct values", () => {
        div.className = "box-sizing"
        const box = ElementExt.boxSizing(div)
        expect(box.borderTop).toEqual(10)
        expect(box.borderLeft).toEqual(15)
        expect(box.borderRight).toEqual(0)
        expect(box.borderBottom).toEqual(0)
        expect(box.paddingTop).toEqual(15)
        expect(box.paddingLeft).toEqual(12)
        expect(box.paddingRight).toEqual(8)
        expect(box.paddingBottom).toEqual(9)
        expect(box.verticalSum).toEqual(34)
        expect(box.horizontalSum).toEqual(35)
      })
      it("should use defaults if parameters are not set", () => {
        const sizing = ElementExt.boxSizing(div)
        expect(sizing.borderTop).toEqual(0)
        expect(sizing.borderLeft).toEqual(0)
        expect(sizing.borderRight).toEqual(0)
        expect(sizing.borderBottom).toEqual(0)
        expect(sizing.paddingTop).toEqual(0)
        expect(sizing.paddingLeft).toEqual(0)
        expect(sizing.paddingRight).toEqual(0)
        expect(sizing.paddingBottom).toEqual(0)
        expect(sizing.verticalSum).toEqual(0)
        expect(sizing.horizontalSum).toEqual(0)
      })
    })
    describe("sizeLimits()", () => {
      it("should return a size limits object with correct parameters", () => {
        div.className = "size-limits"
        const limits = ElementExt.sizeLimits(div)
        expect(limits.minWidth).toEqual(90)
        expect(limits.minHeight).toEqual(95)
        expect(limits.maxWidth).toEqual(100)
        expect(limits.maxHeight).toEqual(105)
      })
      it("should use defaults if parameters are not set", () => {
        const limits = ElementExt.sizeLimits(div)
        expect(limits.minWidth).toEqual(0)
        expect(limits.minHeight).toEqual(0)
        expect(limits.maxWidth).toEqual(Infinity)
        expect(limits.maxHeight).toEqual(Infinity)
      })
    })
    describe("hitTest()", () => {
      it("should return `true` when point is inside the node", () => {
        div.className = "hit-test"
        expect(ElementExt.hitTest(div, 50, 50)).toEqual(true)
      })
      it("should return `false` when point is outside the node", () => {
        div.className = "hit-test"
        expect(ElementExt.hitTest(div, 150, 150)).toEqual(false)
      })
      it("should use closed intervals for left and top only", () => {
        div.className = "hit-test"
        expect(ElementExt.hitTest(div, 0, 0)).toEqual(true)
        expect(ElementExt.hitTest(div, 100, 0)).toEqual(false)
        expect(ElementExt.hitTest(div, 99, 0)).toEqual(true)
        expect(ElementExt.hitTest(div, 0, 100)).toEqual(false)
        expect(ElementExt.hitTest(div, 0, 99)).toEqual(true)
        expect(ElementExt.hitTest(div, 100, 100)).toEqual(false)
        expect(ElementExt.hitTest(div, 99, 99)).toEqual(true)
      })
    })
    describe("scrollIntoViewIfNeeded()", () => {
      let elemA: HTMLElement = null!
      let elemB: HTMLElement = null!
      beforeEach(() => {
        div.className = "scroll-area"
        elemA = document.createElement("div")
        elemB = document.createElement("div")
        elemA.className = "scroll-elemA"
        elemB.className = "scroll-elemB"
        div.appendChild(elemA)
        div.appendChild(elemB)
      })
      it("should do nothing if the element covers the viewport", () => {
        elemB.style.top = "1000px"
        div.scrollTop = 75
        ElementExt.scrollIntoViewIfNeeded(div, elemA)
        expect(div.scrollTop).toEqual(75)
      })
      it("should do nothing if the element fits within the viewport", () => {
        div.scrollTop = 25
        ElementExt.scrollIntoViewIfNeeded(div, elemB)
        expect(div.scrollTop).toEqual(25)
      })
      it("should align the top edge for smaller size elements overlapping the top", () => {
        elemA.style.top = "1000px"
        div.scrollTop = 90
        ElementExt.scrollIntoViewIfNeeded(div, elemB)
        expect(div.scrollTop).toEqual(70)
      })
      it("should align the top edge for equal size elements overlapping the top", () => {
        elemA.style.height = "600px"
        elemB.style.top = "1000px"
        div.scrollTop = 90
        ElementExt.scrollIntoViewIfNeeded(div, elemA)
        expect(div.scrollTop).toEqual(50)
      })
      it("should align the top edge for larger size elements overlapping the bottom", () => {
        elemB.style.top = "1000px"
        ElementExt.scrollIntoViewIfNeeded(div, elemA)
        expect(div.scrollTop).toEqual(50)
      })
      it("should align the top edge for equal size elements overlapping the bottom", () => {
        elemA.style.height = "600px"
        elemB.style.top = "1000px"
        ElementExt.scrollIntoViewIfNeeded(div, elemA)
        expect(div.scrollTop).toEqual(50)
      })
      it("should align the bottom edge for larger size elements overlapping the top", () => {
        elemB.style.top = "1000px"
        div.scrollTop = 200
        ElementExt.scrollIntoViewIfNeeded(div, elemA)
        expect(div.scrollTop).toEqual(150)
      })
      it("should align the bottom edge for smaller size elements overlapping the bottom", () => {
        elemB.style.top = "600px"
        div.scrollTop = 50
        ElementExt.scrollIntoViewIfNeeded(div, elemB)
        expect(div.scrollTop).toEqual(100)
      })
    })
  })
})
import "./element.spec"
import "./selector.spec"
import { expect } from "chai"
import { Selector } from "../../src/lumino/domutils"
describe("../../src/lumino/domutils", () => {
  describe("Selector", () => {
    describe("calculateSpecificity()", () => {
      it("should compute the specificity of a selector", () => {
        expect(Selector.calculateSpecificity("body")).toEqual(0x000001)
        expect(Selector.calculateSpecificity(".a-class")).toEqual(0x000100)
        expect(Selector.calculateSpecificity("#an-id")).toEqual(0x010000)
        expect(Selector.calculateSpecificity("body.a-class")).toEqual(0x000101)
        expect(Selector.calculateSpecificity("body#an-id")).toEqual(0x010001)
        expect(Selector.calculateSpecificity("body:after")).toEqual(0x0000002)
        expect(Selector.calculateSpecificity("body:first-line")).toEqual(
          0x0000002
        )
        expect(Selector.calculateSpecificity("body::first-line")).toEqual(
          0x0000002
        )
        expect(Selector.calculateSpecificity("body:not(.a-class)")).toEqual(
          0x000101
        )
        expect(Selector.calculateSpecificity("body[foo]")).toEqual(0x000101)
        expect(Selector.calculateSpecificity("body[foo=bar]")).toEqual(0x000101)
        expect(Selector.calculateSpecificity("body div")).toEqual(0x0000002)
        expect(Selector.calculateSpecificity("body .a-class")).toEqual(0x000101)
        expect(Selector.calculateSpecificity("body #an-id")).toEqual(0x010001)
        expect(
          Selector.calculateSpecificity("body div:active::first-letter")
        ).toEqual(0x000103)
        expect(Selector.calculateSpecificity("body div > span")).toEqual(
          0x000003
        )
        expect(Selector.calculateSpecificity(".a-class.b-class")).toEqual(
          0x000200
        )
        expect(Selector.calculateSpecificity(".a-class#an-id")).toEqual(
          0x010100
        )
        expect(Selector.calculateSpecificity(".a-class:after")).toEqual(
          0x000101
        )
        expect(Selector.calculateSpecificity(".a-class:not(.b-class)")).toEqual(
          0x000200
        )
        expect(Selector.calculateSpecificity(".a-class[foo]")).toEqual(0x000200)
        expect(Selector.calculateSpecificity(".a-class[foo=bar]")).toEqual(
          0x000200
        )
        expect(Selector.calculateSpecificity(".a-class .b-class")).toEqual(
          0x000200
        )
        expect(Selector.calculateSpecificity(".a-class > .b-class")).toEqual(
          0x000200
        )
        expect(Selector.calculateSpecificity(".a-class #an-id")).toEqual(
          0x010100
        )
        expect(Selector.calculateSpecificity("#an-id.a-class")).toEqual(
          0x010100
        )
        expect(Selector.calculateSpecificity("#an-id:after")).toEqual(0x010001)
        expect(Selector.calculateSpecificity("#an-id:not(.a-class)")).toEqual(
          0x010100
        )
        expect(Selector.calculateSpecificity("#an-id[foo]")).toEqual(0x010100)
        expect(Selector.calculateSpecificity("#an-id[foo=bar]")).toEqual(
          0x010100
        )
        expect(Selector.calculateSpecificity("#an-id .a-class")).toEqual(
          0x010100
        )
        expect(Selector.calculateSpecificity("#an-id #another-id")).toEqual(
          0x020000
        )
        expect(Selector.calculateSpecificity("#an-id > #another-id")).toEqual(
          0x020000
        )
        expect(
          Selector.calculateSpecificity("li.thing:nth-child(2)::after")
        ).toEqual(0x00202)
      })
    })
    describe("isValid()", () => {
      it("returns true if the selector is valid", () => {
        expect(Selector.isValid("body")).toEqual(true)
        expect(Selector.isValid(".thing")).toEqual(true)
        expect(Selector.isValid("#foo")).toEqual(true)
        expect(Selector.isValid("#bar .thing[foo] > li")).toEqual(true)
      })
      it("returns false if the selector is invalid", () => {
        expect(Selector.isValid("body {")).toEqual(false)
        expect(Selector.isValid(".thing<")).toEqual(false)
        expect(Selector.isValid("4#foo")).toEqual(false)
        expect(Selector.isValid("(#bar .thing[foo] > li")).toEqual(false)
      })
    })
    describe("matches()", () => {
      const div = document.createElement("div")
      div.innerHTML = `
        <ul class="list">
          <li class="item">
            <div class="content">
              <span class="icon">Foo</span>
              <span class="text">Bar</span>
            </div>
          </li>
        </ul>
      `
      const list = div.firstElementChild!
      const item = list.firstElementChild!
      const content = item.firstElementChild!
      const icon = content.firstElementChild!
      const text = icon.nextElementSibling!
      it("should return `true` if an element matches a selector", () => {
        expect(Selector.matches(div, "div")).toEqual(true)
        expect(Selector.matches(list, ".list")).toEqual(true)
        expect(Selector.matches(item, ".list > .item")).toEqual(true)
        expect(Selector.matches(icon, ".content .icon")).toEqual(true)
        expect(Selector.matches(text, "div span + .text")).toEqual(true)
      })
      it("should return `false` if an element does not match a selector", () => {
        expect(Selector.matches(div, "li")).toEqual(false)
        expect(Selector.matches(list, ".content")).toEqual(false)
        expect(Selector.matches(item, ".content > .item")).toEqual(false)
        expect(Selector.matches(icon, ".foo .icon")).toEqual(false)
        expect(Selector.matches(text, "ol div + .text")).toEqual(false)
      })
    })
  })
})
