/* eslint-disable @typescript-eslint/no-empty-function */
import {
  h,
  VirtualDOM,
  VirtualElement,
  VirtualText,
} from "../../src/lumino/virtualdom.js"
describe("../../src/lumino/virtualdom", () => {
  describe("VirtualText", () => {
    describe("#constructor()", () => {
      it("should create a virtual text node", () => {
        const vnode = new VirtualText("foo")
        expect(vnode).to.be.an.instanceof(VirtualText)
      })
    })
    describe("#type", () => {
      it("should be `text`", () => {
        const vnode = new VirtualText("foo")
        expect(vnode.type).toEqual("text")
      })
    })
    describe("#content", () => {
      it("should be the text content", () => {
        const vnode = new VirtualText("foo")
        expect(vnode.content).toEqual("foo")
      })
    })
  })
  describe("VirtualElement", () => {
    describe("#constructor()", () => {
      it("should create a virtual element node", () => {
        const vnode = new VirtualElement("img", {}, [])
        expect(vnode).to.be.an.instanceof(VirtualElement)
      })
    })
    describe("#type", () => {
      it("should be `element`", () => {
        const vnode = new VirtualElement("img", {}, [])
        expect(vnode.type).toEqual("element")
      })
    })
    describe("#tag", () => {
      it("should be the element tag name", () => {
        const vnode = new VirtualElement("img", {}, [])
        expect(vnode.tag).toEqual("img")
      })
    })
    describe("#attrs", () => {
      it("should be the element attrs", () => {
        const attrs = { className: "bar" }
        const vnode = new VirtualElement("img", attrs, [])
        expect(vnode.attrs).to.deep.equal(attrs)
      })
    })
    describe("#children", () => {
      it("should be the element children", () => {
        const children = [h.a(), h.img()]
        const vnode = new VirtualElement("div", {}, children)
        expect(vnode.children).toEqual(children)
      })
    })
  })
  describe("VirtualElement with custom .renderer", () => {
    const mockRenderer = {
      render: (host: HTMLElement) => {},
      unrender: (host: HTMLElement) => {},
    }
    describe("#constructor()", () => {
      it("should create a virtual element node", () => {
        const vnode = new VirtualElement("div", {}, [], mockRenderer)
        expect(vnode).to.be.an.instanceof(VirtualElement)
      })
    })
    describe("#type", () => {
      it("should be `element`", () => {
        const vnode = new VirtualElement("div", {}, [], mockRenderer)
        expect(vnode.type).toEqual("element")
      })
    })
    describe("#tag", () => {
      it("should be the element tag name", () => {
        const vnode = new VirtualElement("img", {}, [], mockRenderer)
        expect(vnode.tag).toEqual("img")
      })
    })
    describe("#attrs", () => {
      it("should be the element attrs", () => {
        const attrs = { className: "baz" }
        const vnode = new VirtualElement("img", attrs, [], mockRenderer)
        expect(vnode.attrs).to.deep.equal(attrs)
      })
    })
    describe("#renderer", () => {
      it("should be the element children renderer", () => {
        const vnode = new VirtualElement("div", {}, [], mockRenderer)
        expect(vnode.renderer!.render).toEqual(mockRenderer.render)
        expect(vnode.renderer!.unrender).toEqual(mockRenderer.unrender)
      })
    })
  })
  describe("h()", () => {
    it("should create a new virtual element node", () => {
      const vnode = h("a")
      expect(vnode).to.be.an.instanceof(VirtualElement)
    })
    it("should accept string literals for children and convert them to text nodes", () => {
      const vnode = h("div", {}, ["foo", "bar"])
      expect(vnode.children[0]).to.be.an.instanceof(VirtualText)
      expect(vnode.children[1]).to.be.an.instanceof(VirtualText)
      expect(vnode.children[0].type).toEqual("text")
      expect(vnode.children[1].type).toEqual("text")
      expect((vnode.children[0] as VirtualText).content).toEqual("foo")
      expect((vnode.children[1] as VirtualText).content).toEqual("bar")
    })
    it("should accept other virtual DOM nodes for children", () => {
      const children = [h("a"), h("img")]
      const vnode = h("div", {}, children)
      expect(vnode.children[0]).toEqual(children[0])
      expect(vnode.children[1]).toEqual(children[1])
      expect(vnode.children[0].type).toEqual("element")
      expect(vnode.children[1].type).toEqual("element")
      expect((vnode.children[0] as VirtualElement).tag).toEqual("a")
      expect((vnode.children[1] as VirtualElement).tag).toEqual("img")
    })
    it("should accept a mix of string literals and virtual DOM nodes", () => {
      const children = ["foo", h("img")]
      const vnode = h("div", {}, children)
      expect(vnode.children[1]).toEqual(children[1])
      expect(vnode.children[0].type).toEqual("text")
      expect((vnode.children[0] as VirtualText).content).toEqual("foo")
      expect(vnode.children[1].type).toEqual("element")
      expect((vnode.children[1] as VirtualElement).tag).toEqual("img")
    })
    it("should ignore `null` child values", () => {
      const children = ["foo", null, h("img")]
      const vnode = h("div", {}, children)
      expect(vnode.children[1]).toEqual(children[2])
      expect(vnode.children[0].type).toEqual("text")
      expect((vnode.children[0] as VirtualText).content).toEqual("foo")
      expect(vnode.children[1].type).toEqual("element")
      expect((vnode.children[1] as VirtualElement).tag).toEqual("img")
    })
    it("should accept a string as the second argument", () => {
      const vnode = h("div", "foo")
      expect(vnode.children[0].type).toEqual("text")
      expect((vnode.children[0] as VirtualText).content).toEqual("foo")
    })
    it("should accept a virtual node as the second argument", () => {
      const vnode = h("div", h("a"))
      expect(vnode.children[0].type).toEqual("element")
      expect((vnode.children[0] as VirtualElement).tag).toEqual("a")
    })
    it("should accept an array as the second argument", () => {
      const children = [h("a"), h("img")]
      const vnode = h("div", children)
      expect(vnode.children[0]).toEqual(children[0])
      expect(vnode.children[0].type).toEqual("element")
      expect((vnode.children[0] as VirtualElement).tag).toEqual("a")
      expect(vnode.children[1].type).toEqual("element")
      expect((vnode.children[1] as VirtualElement).tag).toEqual("img")
    })
    it("should accept other nodes as variadic args", () => {
      const vnode = h("div", h("a"), h("img"))
      expect(vnode.children[0].type).toEqual("element")
      expect((vnode.children[0] as VirtualElement).tag).toEqual("a")
      expect(vnode.children[1].type).toEqual("element")
      expect((vnode.children[1] as VirtualElement).tag).toEqual("img")
    })
    it("should set the attrs directly", () => {
      const attrs = { style: { color: "red" }, dataset: { a: "1" } }
      const vnode = h("img", attrs)
      expect(vnode.attrs).to.deep.equal(attrs)
    })
  })
  describe("h", () => {
    it("should create the appropriate element tag", () => {
      expect(h.a().tag).toEqual("a")
      expect(h.abbr().tag).toEqual("abbr")
      expect(h.address().tag).toEqual("address")
      expect(h.area().tag).toEqual("area")
      expect(h.article().tag).toEqual("article")
      expect(h.aside().tag).toEqual("aside")
      expect(h.audio().tag).toEqual("audio")
      expect(h.b().tag).toEqual("b")
      expect(h.bdi().tag).toEqual("bdi")
      expect(h.bdo().tag).toEqual("bdo")
      expect(h.blockquote().tag).toEqual("blockquote")
      expect(h.br().tag).toEqual("br")
      expect(h.button().tag).toEqual("button")
      expect(h.canvas().tag).toEqual("canvas")
      expect(h.caption().tag).toEqual("caption")
      expect(h.cite().tag).toEqual("cite")
      expect(h.code().tag).toEqual("code")
      expect(h.col().tag).toEqual("col")
      expect(h.colgroup().tag).toEqual("colgroup")
      expect(h.data().tag).toEqual("data")
      expect(h.datalist().tag).toEqual("datalist")
      expect(h.dd().tag).toEqual("dd")
      expect(h.del().tag).toEqual("del")
      expect(h.dfn().tag).toEqual("dfn")
      expect(h.div().tag).toEqual("div")
      expect(h.dl().tag).toEqual("dl")
      expect(h.dt().tag).toEqual("dt")
      expect(h.em().tag).toEqual("em")
      expect(h.embed().tag).toEqual("embed")
      expect(h.fieldset().tag).toEqual("fieldset")
      expect(h.figcaption().tag).toEqual("figcaption")
      expect(h.figure().tag).toEqual("figure")
      expect(h.footer().tag).toEqual("footer")
      expect(h.form().tag).toEqual("form")
      expect(h.h1().tag).toEqual("h1")
      expect(h.h2().tag).toEqual("h2")
      expect(h.h3().tag).toEqual("h3")
      expect(h.h4().tag).toEqual("h4")
      expect(h.h5().tag).toEqual("h5")
      expect(h.h6().tag).toEqual("h6")
      expect(h.header().tag).toEqual("header")
      expect(h.hr().tag).toEqual("hr")
      expect(h.i().tag).toEqual("i")
      expect(h.iframe().tag).toEqual("iframe")
      expect(h.img().tag).toEqual("img")
      expect(h.input().tag).toEqual("input")
      expect(h.ins().tag).toEqual("ins")
      expect(h.kbd().tag).toEqual("kbd")
      expect(h.label().tag).toEqual("label")
      expect(h.legend().tag).toEqual("legend")
      expect(h.li().tag).toEqual("li")
      expect(h.main().tag).toEqual("main")
      expect(h.map().tag).toEqual("map")
      expect(h.mark().tag).toEqual("mark")
      expect(h.meter().tag).toEqual("meter")
      expect(h.nav().tag).toEqual("nav")
      expect(h.noscript().tag).toEqual("noscript")
      expect(h.object().tag).toEqual("object")
      expect(h.ol().tag).toEqual("ol")
      expect(h.optgroup().tag).toEqual("optgroup")
      expect(h.option().tag).toEqual("option")
      expect(h.output().tag).toEqual("output")
      expect(h.p().tag).toEqual("p")
      expect(h.param().tag).toEqual("param")
      expect(h.pre().tag).toEqual("pre")
      expect(h.progress().tag).toEqual("progress")
      expect(h.q().tag).toEqual("q")
      expect(h.rp().tag).toEqual("rp")
      expect(h.rt().tag).toEqual("rt")
      expect(h.ruby().tag).toEqual("ruby")
      expect(h.s().tag).toEqual("s")
      expect(h.samp().tag).toEqual("samp")
      expect(h.section().tag).toEqual("section")
      expect(h.select().tag).toEqual("select")
      expect(h.small().tag).toEqual("small")
      expect(h.source().tag).toEqual("source")
      expect(h.span().tag).toEqual("span")
      expect(h.strong().tag).toEqual("strong")
      expect(h.sub().tag).toEqual("sub")
      expect(h.summary().tag).toEqual("summary")
      expect(h.sup().tag).toEqual("sup")
      expect(h.table().tag).toEqual("table")
      expect(h.tbody().tag).toEqual("tbody")
      expect(h.td().tag).toEqual("td")
      expect(h.textarea().tag).toEqual("textarea")
      expect(h.tfoot().tag).toEqual("tfoot")
      expect(h.th().tag).toEqual("th")
      expect(h.thead().tag).toEqual("thead")
      expect(h.time().tag).toEqual("time")
      expect(h.title().tag).toEqual("title")
      expect(h.tr().tag).toEqual("tr")
      expect(h.track().tag).toEqual("track")
      expect(h.u().tag).toEqual("u")
      expect(h.ul().tag).toEqual("ul")
      expect(h.var_().tag).toEqual("var")
      expect(h.video().tag).toEqual("video")
      expect(h.wbr().tag).toEqual("wbr")
    })
  })
  describe("h() with IRenderer param", () => {
    const tag = "div"
    const attrs = { className: "baz" }
    const mockRenderer = {
      render: (host: HTMLElement) => {},
      unrender: (host: HTMLElement) => {},
    }
    it("should create a new virtual element with custom renderer", () => {
      const vnode = h(tag, attrs, mockRenderer)
      expect(vnode).to.be.an.instanceof(VirtualElement)
      expect(vnode.tag).toEqual(tag)
      expect(vnode.attrs).to.deep.equal(attrs)
      expect(vnode.renderer!.render).toEqual(mockRenderer.render)
      expect(vnode.renderer!.unrender).toEqual(mockRenderer.unrender)
    })
    it("should create a virtual element with custom renderer and without attrs", () => {
      const vnode = h("div", mockRenderer)
      expect(vnode).to.be.an.instanceof(VirtualElement)
      expect(vnode.tag).toEqual("div")
      expect(vnode.attrs).to.deep.equal({})
      expect(vnode.renderer!.render).toEqual(mockRenderer.render)
      expect(vnode.renderer!.unrender).toEqual(mockRenderer.unrender)
    })
    it("should create a virtual element without custom renderer and with attrs", () => {
      const vnode = h("div", attrs)
      expect(vnode).to.be.an.instanceof(VirtualElement)
      expect(vnode.tag).toEqual(tag)
      expect(vnode.attrs).to.deep.equal(attrs)
      expect(vnode.renderer).toEqual(undefined)
    })
    it("should create a virtual element without custom renderer or attrs", () => {
      const vnode = h("div")
      expect(vnode).to.be.an.instanceof(VirtualElement)
      expect(vnode.tag).toEqual("div")
      expect(vnode.attrs).to.deep.equal({})
      expect(vnode.renderer).toEqual(undefined)
    })
  })
  describe("VirtualDOM", () => {
    describe("realize()", () => {
      it("should create a real DOM node from a virtual DOM node", () => {
        const node = VirtualDOM.realize(h.div([h.a(), h.img()]))
        expect(node.nodeName.toLowerCase()).toEqual("div")
        expect(node.children[0].nodeName.toLowerCase()).toEqual("a")
        expect(node.children[1].nodeName.toLowerCase()).toEqual("img")
      })
    })
    describe("render()", () => {
      it("should render virtual DOM content into a host elememnt", () => {
        const host = document.createElement("div")
        VirtualDOM.render(h.img(), host)
        expect(host.children[0].nodeName.toLowerCase()).toEqual("img")
      })
      it("should render the delta from the previous rendering", () => {
        const host = document.createElement("div")
        let children = [h.a(), h.span(), h.img()]
        VirtualDOM.render(children, host)
        const first = host.children[0]
        const last = host.children[2]
        expect(first.nodeName.toLowerCase()).toEqual("a")
        expect(last.nodeName.toLowerCase()).toEqual("img")
        children = [children[0], h.div(), children[1]]
        VirtualDOM.render(children, host)
        expect(host.children[0]).toEqual(first)
        expect(host.children[2]).to.not.equal(last)
        expect(host.children[2].nodeName.toLowerCase()).toEqual("span")
      })
      it("should clear the rendering if `null` content is provided", () => {
        const host = document.createElement("div")
        VirtualDOM.render(h("div", ["bar", "foo"]), host)
        expect(host.children[0].childNodes.length).toEqual(2)
        VirtualDOM.render(null, host)
        expect(host.children.length).toEqual(0)
      })
      it("should update attributes", () => {
        const host = document.createElement("div")
        const attrs1 = {
          alt: "foo",
          height: "100",
          style: { color: "white" },
          dataset: { foo: "2", bar: "2" },
          onload: () => {},
          srcset: "foo",
        }
        const attrs2 = {
          alt: "bar",
          width: "100",
          style: { border: "1px" },
          dataset: { bar: "1", baz: "3" },
          sizes: "baz",
        }
        VirtualDOM.render([h.a(), h.img(attrs1)], host)
        VirtualDOM.render([h.a(), h.img(attrs2)], host)
        expect((host.children[1] as HTMLImageElement).alt).toEqual("bar")
      })
      it("should not recreate a DOM node that moves if it has a key id", () => {
        const host = document.createElement("div")
        const children1 = [
          h.span({ key: "1" }),
          h.span({ key: "2" }),
          h.span({ key: "3" }),
          h.span({ key: "4" }),
        ]
        const children2 = [
          h.span({ key: "1" }),
          h.span({ key: "3" }),
          h.span({ key: "2" }),
          h.span({ key: "4" }),
        ]
        VirtualDOM.render(children1, host)
        const child1 = host.children[1]
        const child2 = host.children[2]
        VirtualDOM.render(children2, host)
        expect(host.children[1]).toEqual(child2)
        expect(host.children[2]).toEqual(child1)
      })
      it("should still recreate the DOM node if the node type changes", () => {
        const host = document.createElement("div")
        const children1 = [
          h.span({ key: "1" }),
          h.span({ key: "2" }),
          h.span({ key: "3" }),
          h.span({ key: "4" }),
        ]
        const children2 = [
          h.span({ key: "1" }),
          h.div({ key: "3" }),
          h.span({ key: "2" }),
          h.span({ key: "4" }),
        ]
        VirtualDOM.render(children1, host)
        VirtualDOM.render(children2, host)
        expect(host.children[1].nodeName.toLowerCase()).toEqual("div")
      })
      it("should handle a new keyed item", () => {
        const host = document.createElement("div")
        const children1 = [
          h.span({ key: "1" }),
          h.span({ key: "2" }),
          h.span({ key: "3" }),
          h.span({ key: "4" }),
        ]
        const children2 = [
          h.span({ key: "1" }),
          h.span({ key: "2" }),
          h.span({ key: "3" }),
          h.div({ key: "5" }),
        ]
        VirtualDOM.render(children1, host)
        VirtualDOM.render(children2, host)
        expect(host.children[3].nodeName.toLowerCase()).toEqual("div")
      })
      it("should update the text of a text node", () => {
        const host = document.createElement("div")
        VirtualDOM.render(h.div("foo"), host)
        const div = host.children[0]
        expect(div.textContent).toEqual("foo")
        VirtualDOM.render(h.div("bar"), host)
        expect(host.children[0]).toEqual(div)
        expect(div.textContent).toEqual("bar")
      })
    })
  })
  describe("VirtualDOM with custom renderer", () => {
    const rendererClosure = (record: any = {}) => {
      return {
        render: (host: HTMLElement) => {
          const renderNode = document.createElement("div")
          renderNode.className = "lm-render"
          host.appendChild(renderNode)
          record.child = renderNode
        },
        unrender: (host: HTMLElement) => {
          host.removeChild(host.lastChild as HTMLElement)
          record.cleanedUp = true
        },
      }
    }
    describe("realize()", () => {
      it("should realize successfully", () => {
        const node = VirtualDOM.realize(h("span", rendererClosure()))
        expect(node.tagName.toLowerCase()).toEqual("span")
        expect(node.children[0].tagName.toLowerCase()).toEqual("div")
        expect(node.children[0].className).toEqual("lm-render")
      })
    })
    describe("render()", () => {
      it("should render successfully at top of tree", () => {
        const host = document.createElement("div")
        VirtualDOM.render(h("span", rendererClosure()), host)
        expect(host.children[0].tagName.toLowerCase()).toEqual("span")
        expect(host.children[0].children[0].tagName.toLowerCase()).toEqual(
          "div"
        )
        expect(host.children[0].children[0].className).toEqual("lm-render")
      })
      it("should render child node", () => {
        const host = document.createElement("div")
        const record: any = { child: undefined, cleanedUp: false }
        const children = [
          h.a(),
          h.span(),
          h.div(h.div(), h("span", rendererClosure(record)), h.div()),
        ]
        VirtualDOM.render(children, host)
        expect(host.children[2].children[1].children[0]).toEqual(record.child)
        expect(host.children[2].children[1].children[0].className).toEqual(
          "lm-render"
        )
      })
      it("should cleanup child node", () => {
        const host = document.createElement("div")
        const record: any = { child: undefined, cleanedUp: false }
        const children0 = [
          h.a(),
          h.span(),
          h.div(h.div(), h("span", rendererClosure(record)), h.div()),
        ]
        VirtualDOM.render(children0, host)
        const children1 = [h.a(), h.span(), h.label()]
        VirtualDOM.render(children1, host)
        expect(record.cleanedUp).toEqual(true)
      })
    })
  })
})
