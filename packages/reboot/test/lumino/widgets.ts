import { ArrayExt, every, range } from "../../src/lumino/algorithm.js"
import { CommandRegistry } from "../../src/lumino/commands.js"
import { DisposableSet } from "../../src/lumino/disposable.js"
import { h, VirtualDOM, VirtualElement } from "../../src/lumino/virtualdom.js"
import { JSONObject } from "../../src/lumino/utils.js"
import { Platform } from "../../src/lumino/domutils.js"
import {
  AccordionLayout,
  AccordionPanel,
  BoxEngine,
  BoxLayout,
  BoxPanel,
  BoxSizer,
  CommandPalette,
  ContextMenu,
  DockPanel,
  FocusTracker,
  Layout,
  Menu,
  MenuBar,
  Panel,
  PanelLayout,
  SplitLayout,
  SplitPanel,
  StackedLayout,
  StackedPanel,
  TabBar,
  TabPanel,
  Title,
  Widget,
} from "../../src/lumino/widgets.js"
import {
  IMessageHandler,
  IMessageHook,
  Message,
  MessageLoop,
} from "../../src/lumino/messaging.js"

const renderer: AccordionLayout.IRenderer = {
  titleClassName: ".lm-AccordionTitle",
  createHandle: () => document.createElement("div"),
  createSectionTitle: (title: Title<Widget>) => document.createElement("h3"),
}
class LogAccordionLayout extends AccordionLayout {
  methods: string[] = []
  protected init(): void {
    super.init()
    this.methods.push("init")
  }
  protected attachWidget(index: number, widget: Widget): void {
    super.attachWidget(index, widget)
    this.methods.push("attachWidget")
  }
  protected moveWidget(
    fromIndex: number,
    toIndex: number,
    widget: Widget
  ): void {
    super.moveWidget(fromIndex, toIndex, widget)
    this.methods.push("moveWidget")
  }
  protected detachWidget(index: number, widget: Widget): void {
    super.detachWidget(index, widget)
    this.methods.push("detachWidget")
  }
  protected onFitRequest(msg: Message): void {
    super.onFitRequest(msg)
    this.methods.push("onFitRequest")
  }
}
describe("../../src/lumino/widgets", () => {
  describe("AccordionLayout", () => {
    describe("#constructor()", () => {
      it("should accept a renderer", () => {
        const layout = new AccordionLayout({ renderer })
        expect(layout).to.be.an.instanceof(AccordionLayout)
      })
      it("should be vertical by default", () => {
        const layout = new AccordionLayout({ renderer })
        expect(layout.orientation).toEqual("vertical")
      })
    })
    describe("#titleSpace", () => {
      it("should get the inter-element spacing for the split layout", () => {
        const layout = new AccordionLayout({ renderer })
        expect(layout.titleSpace).toEqual(22)
      })
      it("should set the inter-element spacing for the split layout", () => {
        const layout = new AccordionLayout({ renderer })
        layout.titleSpace = 10
        expect(layout.titleSpace).toEqual(10)
      })
      it("should post a fit request to the parent widget", done => {
        const layout = new LogAccordionLayout({ renderer })
        const parent = new Widget()
        parent.layout = layout
        layout.titleSpace = 10
        requestAnimationFrame(() => {
          expect(layout.methods).to.contain("onFitRequest")
          done()
        })
      })
      it("should be a no-op if the value does not change", done => {
        const layout = new LogAccordionLayout({ renderer })
        const parent = new Widget()
        parent.layout = layout
        layout.titleSpace = 22
        requestAnimationFrame(() => {
          expect(layout.methods).to.not.contain("onFitRequest")
          done()
        })
      })
    })
    describe("#renderer", () => {
      it("should get the renderer for the layout", () => {
        const layout = new AccordionLayout({ renderer })
        expect(layout.renderer).toEqual(renderer)
      })
    })
    describe("#titles", () => {
      it("should be a read-only sequence of the accordion titles in the layout", () => {
        const layout = new AccordionLayout({ renderer })
        const parent = new Widget()
        parent.layout = layout
        const widgets = [new Widget(), new Widget(), new Widget()]
        for (const widget of widgets) {
          layout.addWidget(widget)
        }
        expect(every(layout.titles, h => h instanceof HTMLElement))
        expect(layout.titles).to.have.length(widgets.length)
      })
    })
    describe("#attachWidget()", () => {
      it("should insert a title node before the widget", () => {
        const layout = new LogAccordionLayout({ renderer })
        const parent = new Widget()
        parent.layout = layout
        const widget = new Widget()
        layout.addWidget(widget)
        expect(layout.methods).to.contain("attachWidget")
        expect(parent.node.contains(widget.node)).toEqual(true)
        expect(layout.titles.length).toEqual(1)
        const title = layout.titles[0]
        expect(widget.node.previousElementSibling).toEqual(title)
        expect(title.getAttribute("aria-label")).toEqual(
          `${parent.title.label} Section`
        )
        expect(title.getAttribute("aria-expanded")).toEqual("true")
        expect(title.classList.contains("lm-mod-expanded")).to.be.true
        expect(widget.node.getAttribute("role")).toEqual("region")
        expect(widget.node.getAttribute("aria-labelledby")).toEqual(title.id)
        parent.dispose()
      })
    })
    describe("#moveWidget()", () => {
      it("should move a title in the parent's DOM node", () => {
        const layout = new LogAccordionLayout({ renderer })
        const widgets = [new Widget(), new Widget(), new Widget()]
        const parent = new Widget()
        parent.layout = layout
        widgets.forEach(w => {
          layout.addWidget(w)
        })
        const widget = widgets[0]
        const title = layout.titles[0]
        layout.insertWidget(2, widget)
        expect(layout.methods).to.contain("moveWidget")
        expect(layout.titles[2]).toEqual(title)
        parent.dispose()
      })
    })
    describe("#detachWidget()", () => {
      it("should detach a title from the parent's DOM node", () => {
        const layout = new LogAccordionLayout({ renderer })
        const widget = new Widget()
        const parent = new Widget()
        parent.layout = layout
        layout.addWidget(widget)
        const title = layout.titles[0]
        layout.removeWidget(widget)
        expect(layout.methods).to.contain("detachWidget")
        expect(parent.node.contains(title)).toEqual(false)
        expect(layout.titles).to.have.length(0)
        parent.dispose()
      })
    })
    describe("#dispose", () => {
      it("clear the titles list", () => {
        const layout = new AccordionLayout({ renderer })
        const widgets = [new Widget(), new Widget(), new Widget()]
        widgets.forEach(w => {
          layout.addWidget(w)
        })
        layout.dispose()
        expect(layout.titles).to.have.length(0)
      })
    })
  })
})
const bubbles = true
const renderer: AccordionPanel.IRenderer = {
  titleClassName: ".lm-AccordionTitle",
  createHandle: () => document.createElement("div"),
  createSectionTitle: (title: Title<Widget>) => document.createElement("h3"),
}
class LogAccordionPanel extends AccordionPanel {
  events: string[] = []
  handleEvent(event: Event): void {
    super.handleEvent(event)
    this.events.push(event.type)
  }
}
describe("../../src/lumino/widgets", () => {
  describe("AccordionPanel", () => {
    describe("#constructor()", () => {
      it("should accept no arguments", () => {
        const panel = new AccordionPanel()
        expect(panel).to.be.an.instanceof(AccordionPanel)
      })
      it("should accept options", () => {
        const panel = new AccordionPanel({
          orientation: "horizontal",
          spacing: 5,
          titleSpace: 42,
          renderer,
        })
        expect(panel.orientation).toEqual("horizontal")
        expect(panel.spacing).toEqual(5)
        expect(panel.titleSpace).toEqual(42)
        expect(panel.renderer).toEqual(renderer)
      })
      it("should accept a layout option", () => {
        const layout = new AccordionLayout({ renderer })
        const panel = new AccordionPanel({ layout })
        expect(panel.layout).toEqual(layout)
      })
      it("should ignore other options if a layout is given", () => {
        const ignored = Object.create(renderer)
        const layout = new AccordionLayout({ renderer })
        const panel = new AccordionPanel({
          layout,
          orientation: "horizontal",
          spacing: 5,
          titleSpace: 42,
          renderer: ignored,
        })
        expect(panel.layout).toEqual(layout)
        expect(panel.orientation).toEqual("vertical")
        expect(panel.spacing).toEqual(4)
        expect(panel.titleSpace).toEqual(22)
        expect(panel.renderer).toEqual(renderer)
      })
      it("should add the `lm-AccordionPanel` class", () => {
        const panel = new AccordionPanel()
        expect(panel.hasClass("lm-AccordionPanel")).toEqual(true)
      })
    })
    describe("#dispose()", () => {
      it("should dispose of the resources held by the panel", () => {
        const panel = new LogAccordionPanel()
        const layout = panel.layout as AccordionLayout
        const widgets = [new Widget(), new Widget(), new Widget()]
        widgets.forEach(w => {
          panel.addWidget(w)
        })
        Widget.attach(panel, document.body)
        panel.dispose()
        expect(every(widgets, w => w.isDisposed))
        expect(layout.titles).to.have.length(0)
      })
    })
    describe("#titleSpace", () => {
      it("should default to `22`", () => {
        const panel = new AccordionPanel()
        expect(panel.titleSpace).toEqual(22)
      })
      it("should set the titleSpace for the panel", () => {
        const panel = new AccordionPanel()
        panel.titleSpace = 10
        expect(panel.titleSpace).toEqual(10)
      })
    })
    describe("#renderer", () => {
      it("should get the renderer for the panel", () => {
        const panel = new AccordionPanel({ renderer })
        expect(panel.renderer).toEqual(renderer)
      })
    })
    describe("#titles", () => {
      it("should get the read-only sequence of the accordion titles in the panel", () => {
        const panel = new AccordionPanel()
        const widgets = [new Widget(), new Widget(), new Widget()]
        widgets.forEach(w => {
          panel.addWidget(w)
        })
        expect(panel.titles.length).toEqual(widgets.length)
      })
      it("should update the title element", () => {
        const text = "Something"
        const panel = new AccordionPanel()
        const widget = new Widget()
        panel.addWidget(widget)
        widget.title.label = text
        const el = panel.titles[0].querySelector(
          ".lm-AccordionPanel-titleLabel"
        )!
        expect(el.textContent).toEqual(text)
      })
    })
    describe("#collapse()", () => {
      let panel: AccordionPanel
      let layout: AccordionLayout
      beforeEach(() => {
        panel = new AccordionPanel()
        layout = panel.layout as AccordionLayout
        const widgets = [new Widget(), new Widget(), new Widget()]
        widgets.forEach(w => {
          panel.addWidget(w)
        })
        panel.setRelativeSizes([10, 10, 10, 20])
        Widget.attach(panel, document.body)
        MessageLoop.flush()
      })
      afterEach(() => {
        panel.dispose()
      })
      it("should collapse an expanded widget", () => {
        panel.collapse(1)
        expect(layout.titles[1]?.getAttribute("aria-expanded")).toEqual("false")
        expect(layout.titles[1]?.classList.contains("lm-mod-expanded")).to.be
          .false
        expect(layout.widgets[1].isHidden).to.be.true
      })
    })
    describe("#expand()", () => {
      let panel: AccordionPanel
      let layout: AccordionLayout
      beforeEach(() => {
        panel = new AccordionPanel()
        layout = panel.layout as AccordionLayout
        const widgets = [new Widget(), new Widget(), new Widget()]
        widgets.forEach(w => {
          panel.addWidget(w)
        })
        panel.setRelativeSizes([10, 10, 10, 20])
        Widget.attach(panel, document.body)
        MessageLoop.flush()
      })
      afterEach(() => {
        panel.dispose()
      })
      it("should expand a collapsed widget", () => {
        panel.collapse(1)
        panel.expand(1)
        expect(layout.titles[0].getAttribute("aria-expanded")).toEqual("true")
        expect(layout.titles[0].classList.contains("lm-mod-expanded")).to.be
          .true
        expect(layout.widgets[0].isHidden).to.be.false
      })
    })
    describe("#handleEvent()", () => {
      let panel: LogAccordionPanel
      let layout: AccordionLayout
      beforeEach(() => {
        panel = new LogAccordionPanel()
        layout = panel.layout as AccordionLayout
        const widgets = [new Widget(), new Widget(), new Widget()]
        widgets.forEach(w => {
          panel.addWidget(w)
        })
        panel.setRelativeSizes([10, 10, 10, 20])
        Widget.attach(panel, document.body)
        MessageLoop.flush()
      })
      afterEach(() => {
        panel.dispose()
      })
      context("click", () => {
        it("should collapse an expanded widget", () => {
          layout.titles[0].dispatchEvent(new MouseEvent("click", { bubbles }))
          expect(panel.events).to.contain("click")
          expect(layout.titles[0].getAttribute("aria-expanded")).toEqual(
            "false"
          )
          expect(layout.titles[0].classList.contains("lm-mod-expanded")).to.be
            .false
          expect(layout.widgets[0].isHidden).to.be.true
        })
        it("should expand a collapsed widget", () => {
          layout.titles[0].dispatchEvent(new MouseEvent("click", { bubbles }))
          layout.titles[0].dispatchEvent(new MouseEvent("click", { bubbles }))
          expect(layout.titles[0].getAttribute("aria-expanded")).toEqual("true")
          expect(layout.titles[0].classList.contains("lm-mod-expanded")).to.be
            .true
          expect(layout.widgets[0].isHidden).to.be.false
        })
      })
      context("keydown", () => {
        it("should redirect to toggle expansion state if Space is pressed", () => {
          layout.titles[0].dispatchEvent(
            new KeyboardEvent("keydown", {
              bubbles,
              key: "Space",
            })
          )
          expect(panel.events).to.contain("keydown")
          expect(layout.titles[0].getAttribute("aria-expanded")).toEqual(
            "false"
          )
          expect(layout.titles[0].classList.contains("lm-mod-expanded")).to.be
            .false
          expect(layout.widgets[0].isHidden).to.be.true
          layout.titles[0].dispatchEvent(
            new KeyboardEvent("keydown", {
              bubbles,
              key: "Space",
            })
          )
          expect(panel.events).to.contain("keydown")
          expect(layout.titles[0].getAttribute("aria-expanded")).toEqual("true")
          expect(layout.titles[0].classList.contains("lm-mod-expanded")).to.be
            .true
          expect(layout.widgets[0].isHidden).to.be.false
        })
        it("should redirect to toggle expansion state if Enter is pressed", () => {
          layout.titles[0].dispatchEvent(
            new KeyboardEvent("keydown", {
              bubbles,
              key: "Enter",
            })
          )
          expect(panel.events).to.contain("keydown")
          expect(layout.titles[0].getAttribute("aria-expanded")).toEqual(
            "false"
          )
          expect(layout.titles[0].classList.contains("lm-mod-expanded")).to.be
            .false
          expect(layout.widgets[0].isHidden).to.be.true
          layout.titles[0].dispatchEvent(
            new KeyboardEvent("keydown", {
              bubbles,
              key: "Enter",
            })
          )
          expect(panel.events).to.contain("keydown")
          expect(layout.titles[0].getAttribute("aria-expanded")).toEqual("true")
          expect(layout.titles[0].classList.contains("lm-mod-expanded")).to.be
            .true
          expect(layout.widgets[0].isHidden).to.be.false
        })
        it("should focus on the next widget if Arrow Down is pressed", () => {
          layout.titles[1]?.focus()
          layout.titles[1]?.dispatchEvent(
            new KeyboardEvent("keydown", {
              bubbles,
              key: "ArrowDown",
            })
          )
          expect(panel.events).to.contain("keydown")
          expect(document.activeElement).to.be.equal(layout.titles[2])
        })
        it("should focus on the previous widget if Arrow Up is pressed", () => {
          layout.titles[1]?.focus()
          layout.titles[1]?.dispatchEvent(
            new KeyboardEvent("keydown", {
              bubbles,
              key: "ArrowUp",
            })
          )
          expect(panel.events).to.contain("keydown")
          expect(document.activeElement).to.be.equal(layout.titles[0])
        })
        it("should focus on the first widget if Home is pressed", () => {
          layout.titles[1]?.focus()
          layout.titles[1]?.dispatchEvent(
            new KeyboardEvent("keydown", {
              bubbles,
              key: "Home",
            })
          )
          expect(panel.events).to.contain("keydown")
          expect(document.activeElement).to.be.equal(layout.titles[0])
        })
        it("should focus on the last widget if End is pressed", () => {
          layout.titles[1]?.focus()
          layout.titles[1]?.dispatchEvent(
            new KeyboardEvent("keydown", {
              bubbles,
              key: "End",
            })
          )
          expect(panel.events).to.contain("keydown")
          expect(document.activeElement).to.be.equal(layout.titles[2])
        })
      })
    })
    describe("#onBeforeAttach()", () => {
      it("should attach a click listener to the node", () => {
        const panel = new LogAccordionPanel()
        Widget.attach(panel, document.body)
        panel.node.dispatchEvent(new MouseEvent("click", { bubbles }))
        expect(panel.events).to.contain("click")
        panel.dispose()
      })
      it("should attach a keydown listener to the node", () => {
        const panel = new LogAccordionPanel()
        Widget.attach(panel, document.body)
        panel.node.dispatchEvent(new KeyboardEvent("keydown", { bubbles }))
        expect(panel.events).to.contain("keydown")
        panel.dispose()
      })
    })
    describe("#onAfterDetach()", () => {
      it("should remove click listener", () => {
        const panel = new LogAccordionPanel()
        Widget.attach(panel, document.body)
        panel.node.dispatchEvent(new MouseEvent("click", { bubbles }))
        expect(panel.events).to.contain("click")
        Widget.detach(panel)
        panel.events = []
        panel.node.dispatchEvent(new MouseEvent("click", { bubbles }))
        expect(panel.events).to.not.contain("click")
      })
      it("should remove keydown listener", () => {
        const panel = new LogAccordionPanel()
        Widget.attach(panel, document.body)
        panel.node.dispatchEvent(new KeyboardEvent("keydown", { bubbles }))
        expect(panel.events).to.contain("keydown")
        Widget.detach(panel)
        panel.events = []
        panel.node.dispatchEvent(new KeyboardEvent("keydown", { bubbles }))
        expect(panel.events).to.not.contain("keydown")
      })
    })
    describe(".Renderer()", () => {
      describe(".defaultRenderer", () => {
        it("should be an instance of `Renderer`", () => {
          expect(AccordionPanel.defaultRenderer).to.be.an.instanceof(
            AccordionPanel.Renderer
          )
        })
      })
      describe("#constructor", () => {
        it("should create a section title", () => {
          const renderer = new AccordionPanel.Renderer()
          expect(
            renderer.createSectionTitle(
              new Title<Widget>({ owner: new Widget() })
            )
          ).to.be.instanceOf(HTMLElement)
        })
        it("should have a section title selector", () => {
          const renderer = new AccordionPanel.Renderer()
          expect(renderer.titleClassName).to.be.equal("lm-AccordionPanel-title")
        })
      })
    })
    describe("#_computeWidgetSize()", () => {
      const DELTA = 1e-6
      let panel: AccordionPanel
      beforeEach(() => {
        panel = new AccordionPanel({ renderer, titleSpace: 0, spacing: 0 })
        panel.node.style.height = "500px"
        Widget.attach(panel, document.body)
      })
      it("should not compute the size of panel with only one widget", () => {
        panel.addWidget(new Widget())
        MessageLoop.flush()
        const value = panel["_computeWidgetSize"](0)
        expect(value).to.be.equal(undefined)
      })
      it("should compute the size of panel with two opened widgets", () => {
        const widgets = [new Widget(), new Widget()]
        widgets.forEach(w => panel.addWidget(w))
        MessageLoop.flush()
        const value0 = panel["_computeWidgetSize"](0)
        expect(value0.length).to.be.equal(2)
        expect(value0[0]).to.be.closeTo(0, DELTA)
        expect(value0[1]).to.be.closeTo(1, DELTA)
        const value1 = panel["_computeWidgetSize"](1)
        expect(value1[0]).to.be.closeTo(1, DELTA)
        expect(value1[1]).to.be.closeTo(0, DELTA)
      })
      it("should compute the size of panel with three widgets", () => {
        const widgets = [new Widget(), new Widget(), new Widget()]
        widgets.forEach(w => panel.addWidget(w))
        MessageLoop.flush()
        const value = panel["_computeWidgetSize"](0)
        expect(value.length).to.be.equal(3)
        expect(value[0]).to.be.closeTo(0, DELTA)
        expect(value[1]).to.be.closeTo(0.333333, DELTA)
        expect(value[2]).to.be.closeTo(0.666666, DELTA)
      })
    })
  })
})
function createSizers(n: number): BoxSizer[] {
  const sizers: BoxSizer[] = []
  for (let i = 0; i < n; ++i) {
    sizers.push(new BoxSizer())
  }
  return sizers
}
describe("../../src/lumino/widgets", () => {
  describe("BoxSizer", () => {
    describe("#constructor()", () => {
      it("should accept no arguments", () => {
        const sizer = new BoxSizer()
        expect(sizer).to.be.an.instanceof(BoxSizer)
      })
    })
    describe("#sizeHint", () => {
      it("should default to `0`", () => {
        const sizer = new BoxSizer()
        expect(sizer.sizeHint).toEqual(0)
      })
      it("should be writable", () => {
        const sizer = new BoxSizer()
        sizer.sizeHint = 42
        expect(sizer.sizeHint).toEqual(42)
      })
    })
    describe("#minSize", () => {
      it("should default to `0`", () => {
        const sizer = new BoxSizer()
        expect(sizer.minSize).toEqual(0)
      })
      it("should be writable", () => {
        const sizer = new BoxSizer()
        sizer.minSize = 42
        expect(sizer.minSize).toEqual(42)
      })
    })
    describe("#maxSize", () => {
      it("should default to `Infinity`", () => {
        const sizer = new BoxSizer()
        expect(sizer.maxSize).toEqual(Infinity)
      })
      it("should be writable", () => {
        const sizer = new BoxSizer()
        sizer.maxSize = 42
        expect(sizer.maxSize).toEqual(42)
      })
    })
    describe("#stretch", () => {
      it("should default to `1`", () => {
        const sizer = new BoxSizer()
        expect(sizer.stretch).toEqual(1)
      })
      it("should be writable", () => {
        const sizer = new BoxSizer()
        sizer.stretch = 42
        expect(sizer.stretch).toEqual(42)
      })
    })
    describe("#size", () => {
      it("should be the computed output", () => {
        const sizer = new BoxSizer()
        expect(typeof sizer.size).toEqual("number")
      })
      it("should be writable", () => {
        const sizer = new BoxSizer()
        sizer.size = 42
        expect(sizer.size).toEqual(42)
      })
    })
  })
  describe("BoxEngine", () => {
    describe("calc()", () => {
      it("should handle an empty sizers array", () => {
        expect(() => BoxEngine.calc([], 100)).to.not.throw(Error)
      })
      it("should obey the min sizes", () => {
        const sizers = createSizers(4)
        sizers[0].minSize = 10
        sizers[1].minSize = 20
        sizers[2].minSize = 30
        sizers[3].minSize = 40
        BoxEngine.calc(sizers, 0)
        expect(sizers[0].size).toEqual(10)
        expect(sizers[1].size).toEqual(20)
        expect(sizers[2].size).toEqual(30)
        expect(sizers[3].size).toEqual(40)
      })
      it("should obey the max sizes", () => {
        const sizers = createSizers(4)
        sizers[0].maxSize = 10
        sizers[1].maxSize = 20
        sizers[2].maxSize = 30
        sizers[3].maxSize = 40
        BoxEngine.calc(sizers, 500)
        expect(sizers[0].size).toEqual(10)
        expect(sizers[1].size).toEqual(20)
        expect(sizers[2].size).toEqual(30)
        expect(sizers[3].size).toEqual(40)
      })
      it("should handle negative layout space", () => {
        const sizers = createSizers(4)
        sizers[0].minSize = 10
        sizers[1].minSize = 20
        sizers[2].minSize = 30
        BoxEngine.calc(sizers, -500)
        expect(sizers[0].size).toEqual(10)
        expect(sizers[1].size).toEqual(20)
        expect(sizers[2].size).toEqual(30)
        expect(sizers[3].size).toEqual(0)
      })
      it("should handle infinite layout space", () => {
        const sizers = createSizers(4)
        sizers[0].maxSize = 10
        sizers[1].maxSize = 20
        sizers[2].maxSize = 30
        BoxEngine.calc(sizers, Infinity)
        expect(sizers[0].size).toEqual(10)
        expect(sizers[1].size).toEqual(20)
        expect(sizers[2].size).toEqual(30)
        expect(sizers[3].size).toEqual(Infinity)
      })
      it("should maintain the size hints if possible", () => {
        const sizers = createSizers(4)
        sizers[0].sizeHint = 40
        sizers[1].sizeHint = 50
        sizers[2].sizeHint = 60
        sizers[3].sizeHint = 70
        BoxEngine.calc(sizers, 220)
        expect(sizers[0].size).toEqual(40)
        expect(sizers[1].size).toEqual(50)
        expect(sizers[2].size).toEqual(60)
        expect(sizers[3].size).toEqual(70)
      })
      it("should fairly distribute negative space", () => {
        const sizers = createSizers(4)
        sizers[0].sizeHint = 40
        sizers[1].sizeHint = 50
        sizers[2].sizeHint = 60
        sizers[3].sizeHint = 70
        BoxEngine.calc(sizers, 200)
        expect(sizers[0].size).toEqual(35)
        expect(sizers[1].size).toEqual(45)
        expect(sizers[2].size).toEqual(55)
        expect(sizers[3].size).toEqual(65)
      })
      it("should fairly distribute positive space", () => {
        const sizers = createSizers(4)
        sizers[0].sizeHint = 40
        sizers[1].sizeHint = 50
        sizers[2].sizeHint = 60
        sizers[3].sizeHint = 70
        BoxEngine.calc(sizers, 240)
        expect(sizers[0].size).toEqual(45)
        expect(sizers[1].size).toEqual(55)
        expect(sizers[2].size).toEqual(65)
        expect(sizers[3].size).toEqual(75)
      })
      it("should be callable multiple times for the same sizers", () => {
        const sizers = createSizers(4)
        sizers[0].sizeHint = 40
        sizers[1].sizeHint = 50
        sizers[2].sizeHint = 60
        sizers[3].sizeHint = 70
        BoxEngine.calc(sizers, 240)
        expect(sizers[0].size).toEqual(45)
        expect(sizers[1].size).toEqual(55)
        expect(sizers[2].size).toEqual(65)
        expect(sizers[3].size).toEqual(75)
        BoxEngine.calc(sizers, 280)
        expect(sizers[0].size).toEqual(55)
        expect(sizers[1].size).toEqual(65)
        expect(sizers[2].size).toEqual(75)
        expect(sizers[3].size).toEqual(85)
        BoxEngine.calc(sizers, 200)
        expect(sizers[0].size).toEqual(35)
        expect(sizers[1].size).toEqual(45)
        expect(sizers[2].size).toEqual(55)
        expect(sizers[3].size).toEqual(65)
      })
      it("should distribute negative space according to stretch factors", () => {
        const sizers = createSizers(2)
        sizers[0].sizeHint = 60
        sizers[1].sizeHint = 60
        sizers[0].stretch = 2
        sizers[1].stretch = 4
        BoxEngine.calc(sizers, 120)
        expect(sizers[0].size).toEqual(60)
        expect(sizers[1].size).toEqual(60)
        BoxEngine.calc(sizers, 60)
        expect(sizers[0].size).toEqual(40)
        expect(sizers[1].size).toEqual(20)
      })
      it("should distribute positive space according to stretch factors", () => {
        const sizers = createSizers(2)
        sizers[0].sizeHint = 60
        sizers[1].sizeHint = 60
        sizers[0].stretch = 2
        sizers[1].stretch = 4
        BoxEngine.calc(sizers, 120)
        expect(sizers[0].size).toEqual(60)
        expect(sizers[1].size).toEqual(60)
        BoxEngine.calc(sizers, 240)
        expect(sizers[0].size).toEqual(100)
        expect(sizers[1].size).toEqual(140)
      })
      it("should not shrink non-stretchable sizers", () => {
        const sizers = createSizers(4)
        sizers[0].sizeHint = 20
        sizers[1].sizeHint = 40
        sizers[2].sizeHint = 60
        sizers[3].sizeHint = 80
        sizers[0].stretch = 0
        sizers[2].stretch = 0
        BoxEngine.calc(sizers, 160)
        expect(sizers[0].size).toEqual(20)
        expect(sizers[1].size).toEqual(20)
        expect(sizers[2].size).toEqual(60)
        expect(sizers[3].size).toEqual(60)
      })
      it("should not expand non-stretchable sizers", () => {
        const sizers = createSizers(4)
        sizers[0].sizeHint = 20
        sizers[1].sizeHint = 40
        sizers[2].sizeHint = 60
        sizers[3].sizeHint = 80
        sizers[0].stretch = 0
        sizers[2].stretch = 0
        BoxEngine.calc(sizers, 260)
        expect(sizers[0].size).toEqual(20)
        expect(sizers[1].size).toEqual(70)
        expect(sizers[2].size).toEqual(60)
        expect(sizers[3].size).toEqual(110)
      })
      it("should shrink non-stretchable sizers if required", () => {
        const sizers = createSizers(4)
        sizers[0].sizeHint = 20
        sizers[1].sizeHint = 40
        sizers[2].sizeHint = 60
        sizers[3].sizeHint = 80
        sizers[0].stretch = 0
        sizers[2].stretch = 0
        sizers[1].minSize = 20
        sizers[2].minSize = 55
        sizers[3].minSize = 60
        BoxEngine.calc(sizers, 140)
        expect(sizers[0].size).toEqual(5)
        expect(sizers[1].size).toEqual(20)
        expect(sizers[2].size).toEqual(55)
        expect(sizers[3].size).toEqual(60)
      })
      it("should expand non-stretchable sizers if required", () => {
        const sizers = createSizers(4)
        sizers[0].sizeHint = 20
        sizers[1].sizeHint = 40
        sizers[2].sizeHint = 60
        sizers[3].sizeHint = 80
        sizers[0].stretch = 0
        sizers[2].stretch = 0
        sizers[1].maxSize = 60
        sizers[2].maxSize = 70
        sizers[3].maxSize = 100
        BoxEngine.calc(sizers, 280)
        expect(sizers[0].size).toEqual(50)
        expect(sizers[1].size).toEqual(60)
        expect(sizers[2].size).toEqual(70)
        expect(sizers[3].size).toEqual(100)
      })
    })
    describe("adjust()", () => {
      it("should adjust a sizer by a positive delta", () => {
        const sizers = createSizers(5)
        sizers[0].sizeHint = 50
        sizers[1].sizeHint = 50
        sizers[2].sizeHint = 50
        sizers[3].sizeHint = 50
        sizers[4].sizeHint = 50
        sizers[2].maxSize = 60
        sizers[3].minSize = 40
        BoxEngine.calc(sizers, 250)
        expect(sizers[0].size).toEqual(50)
        expect(sizers[1].size).toEqual(50)
        expect(sizers[2].size).toEqual(50)
        expect(sizers[3].size).toEqual(50)
        expect(sizers[3].size).toEqual(50)
        BoxEngine.adjust(sizers, 2, 30)
        expect(sizers[0].sizeHint).toEqual(50)
        expect(sizers[1].sizeHint).toEqual(70)
        expect(sizers[2].sizeHint).toEqual(60)
        expect(sizers[3].sizeHint).toEqual(40)
        expect(sizers[4].sizeHint).toEqual(30)
      })
      it("should adjust a sizer by a negative delta", () => {
        const sizers = createSizers(5)
        sizers[0].sizeHint = 50
        sizers[1].sizeHint = 50
        sizers[2].sizeHint = 50
        sizers[3].sizeHint = 50
        sizers[4].sizeHint = 50
        sizers[1].minSize = 40
        sizers[2].minSize = 40
        BoxEngine.calc(sizers, 250)
        expect(sizers[0].size).toEqual(50)
        expect(sizers[1].size).toEqual(50)
        expect(sizers[2].size).toEqual(50)
        expect(sizers[3].size).toEqual(50)
        expect(sizers[3].size).toEqual(50)
        BoxEngine.adjust(sizers, 2, -30)
        expect(sizers[0].sizeHint).toEqual(40)
        expect(sizers[1].sizeHint).toEqual(40)
        expect(sizers[2].sizeHint).toEqual(40)
        expect(sizers[3].sizeHint).toEqual(80)
        expect(sizers[4].sizeHint).toEqual(50)
      })
    })
  })
})
class LogBoxLayout extends BoxLayout {
  methods: string[] = []
  protected init(): void {
    super.init()
    this.methods.push("init")
  }
  protected attachWidget(index: number, widget: Widget): void {
    super.attachWidget(index, widget)
    this.methods.push("attachWidget")
  }
  protected moveWidget(
    fromIndex: number,
    toIndex: number,
    widget: Widget
  ): void {
    super.moveWidget(fromIndex, toIndex, widget)
    this.methods.push("moveWidget")
  }
  protected detachWidget(index: number, widget: Widget): void {
    super.detachWidget(index, widget)
    this.methods.push("detachWidget")
  }
  protected onAfterShow(msg: Message): void {
    super.onAfterShow(msg)
    this.methods.push("onAfterShow")
  }
  protected onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg)
    this.methods.push("onAfterAttach")
  }
  protected onChildShown(msg: Widget.ChildMessage): void {
    super.onChildShown(msg)
    this.methods.push("onChildShown")
  }
  protected onChildHidden(msg: Widget.ChildMessage): void {
    super.onChildHidden(msg)
    this.methods.push("onChildHidden")
  }
  protected onResize(msg: Widget.ResizeMessage): void {
    super.onResize(msg)
    this.methods.push("onResize")
  }
  protected onUpdateRequest(msg: Message): void {
    super.onUpdateRequest(msg)
    this.methods.push("onUpdateRequest")
  }
  protected onFitRequest(msg: Message): void {
    super.onFitRequest(msg)
    this.methods.push("onFitRequest")
  }
}
class LogWidget extends Widget {
  methods: string[] = []
  protected onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg)
    this.methods.push("onAfterAttach")
  }
  protected onBeforeDetach(msg: Message): void {
    super.onBeforeDetach(msg)
    this.methods.push("onBeforeDetach")
  }
  protected onAfterShow(msg: Message): void {
    super.onAfterShow(msg)
    this.methods.push("onAfterShow")
  }
  protected onUpdateRequest(msg: Message): void {
    super.onUpdateRequest(msg)
    this.methods.push("onUpdateRequest")
  }
}
describe("../../src/lumino/widgets", () => {
  describe("BoxLayout", () => {
    describe("constructor()", () => {
      it("should take no arguments", () => {
        const layout = new BoxLayout()
        expect(layout).to.be.an.instanceof(BoxLayout)
      })
      it("should accept options", () => {
        const layout = new BoxLayout({
          direction: "bottom-to-top",
          spacing: 10,
        })
        expect(layout.direction).toEqual("bottom-to-top")
        expect(layout.spacing).toEqual(10)
      })
    })
    describe("#direction", () => {
      it('should default to `"top-to-bottom"`', () => {
        const layout = new BoxLayout()
        expect(layout.direction).toEqual("top-to-bottom")
      })
      it("should set the layout direction for the box layout", () => {
        const layout = new BoxLayout()
        layout.direction = "left-to-right"
        expect(layout.direction).toEqual("left-to-right")
      })
      it("should set the direction attribute of the parent widget", () => {
        const parent = new Widget()
        const layout = new BoxLayout()
        parent.layout = layout
        layout.direction = "top-to-bottom"
        expect(parent.node.getAttribute("data-direction")).toEqual(
          "top-to-bottom"
        )
        layout.direction = "bottom-to-top"
        expect(parent.node.getAttribute("data-direction")).toEqual(
          "bottom-to-top"
        )
        layout.direction = "left-to-right"
        expect(parent.node.getAttribute("data-direction")).toEqual(
          "left-to-right"
        )
        layout.direction = "right-to-left"
        expect(parent.node.getAttribute("data-direction")).toEqual(
          "right-to-left"
        )
      })
      it("should post a fit request to the parent widget", done => {
        const parent = new Widget()
        const layout = new LogBoxLayout()
        parent.layout = layout
        layout.direction = "right-to-left"
        requestAnimationFrame(() => {
          expect(layout.methods).to.contain("onFitRequest")
          done()
        })
      })
      it("should be a no-op if the value does not change", done => {
        const parent = new Widget()
        const layout = new LogBoxLayout()
        parent.layout = layout
        layout.direction = "top-to-bottom"
        requestAnimationFrame(() => {
          expect(layout.methods).to.not.contain("onFitRequest")
          done()
        })
      })
    })
    describe("#spacing", () => {
      it("should default to `4`", () => {
        const layout = new BoxLayout()
        expect(layout.spacing).toEqual(4)
      })
      it("should set the inter-element spacing for the box panel", () => {
        const layout = new BoxLayout()
        layout.spacing = 8
        expect(layout.spacing).toEqual(8)
      })
      it("should post a fit request to the parent widget", done => {
        const parent = new Widget()
        const layout = new LogBoxLayout()
        parent.layout = layout
        layout.spacing = 8
        requestAnimationFrame(() => {
          expect(layout.methods).to.contain("onFitRequest")
          done()
        })
      })
      it("should be a no-op if the value does not change", done => {
        const parent = new Widget()
        const layout = new LogBoxLayout()
        parent.layout = layout
        layout.spacing = 4
        requestAnimationFrame(() => {
          expect(layout.methods).to.not.contain("onFitRequest")
          done()
        })
      })
    })
    describe("#init()", () => {
      it("should set the direction attribute on the parent widget", () => {
        const parent = new Widget()
        const layout = new LogBoxLayout()
        parent.layout = layout
        expect(parent.node.getAttribute("data-direction")).toEqual(
          "top-to-bottom"
        )
        expect(layout.methods).to.contain("init")
        parent.dispose()
      })
      it("should attach the child widgets", () => {
        const parent = new Widget()
        const layout = new LogBoxLayout()
        const widgets = [new Widget(), new Widget(), new Widget()]
        widgets.forEach(w => {
          layout.addWidget(w)
        })
        parent.layout = layout
        expect(every(widgets, w => w.parent === parent))
        expect(layout.methods).to.contain("attachWidget")
        parent.dispose()
      })
    })
    describe("#attachWidget()", () => {
      it("should attach a widget to the parent's DOM node", () => {
        const panel = new Widget()
        const layout = new LogBoxLayout()
        const widget = new Widget()
        panel.layout = layout
        layout.addWidget(widget)
        layout.addWidget(widget)
        expect(layout.methods).to.contain("attachWidget")
        expect(panel.node.contains(widget.node)).toEqual(true)
        panel.dispose()
      })
      it("should send an `'after-attach'` message if the parent is attached", () => {
        const panel = new Widget()
        const layout = new LogBoxLayout()
        const widget = new LogWidget()
        panel.layout = layout
        Widget.attach(panel, document.body)
        layout.addWidget(widget)
        expect(layout.methods).to.contain("attachWidget")
        expect(widget.methods).to.contain("onAfterAttach")
        panel.dispose()
      })
      it("should post a layout request for the parent widget", done => {
        const panel = new Widget()
        const layout = new LogBoxLayout()
        panel.layout = layout
        layout.addWidget(new Widget())
        requestAnimationFrame(() => {
          expect(layout.methods).to.contain("onFitRequest")
          panel.dispose()
          done()
        })
      })
    })
    describe("#moveWidget()", () => {
      it("should post an update request for the parent widget", done => {
        const panel = new Widget()
        const layout = new LogBoxLayout()
        panel.layout = layout
        layout.addWidget(new Widget())
        const widget = new Widget()
        layout.addWidget(widget)
        layout.insertWidget(0, widget)
        expect(layout.methods).to.contain("moveWidget")
        requestAnimationFrame(() => {
          expect(layout.methods).to.contain("onUpdateRequest")
          panel.dispose()
          done()
        })
      })
    })
    describe("#detachWidget()", () => {
      it("should detach a widget from the parent's DOM node", () => {
        const panel = new Widget()
        const layout = new LogBoxLayout()
        const widget = new Widget()
        panel.layout = layout
        layout.addWidget(widget)
        layout.removeWidget(widget)
        expect(layout.methods).to.contain("detachWidget")
        expect(panel.node.contains(widget.node)).toEqual(false)
        panel.dispose()
      })
      it("should send a `'before-detach'` message if the parent is attached", () => {
        const panel = new Widget()
        const layout = new LogBoxLayout()
        panel.layout = layout
        const widget = new LogWidget()
        Widget.attach(panel, document.body)
        layout.addWidget(widget)
        layout.removeWidget(widget)
        expect(widget.methods).to.contain("onBeforeDetach")
        panel.dispose()
      })
      it("should post a layout request for the parent widget", done => {
        const panel = new Widget()
        const layout = new LogBoxLayout()
        const widget = new Widget()
        panel.layout = layout
        layout.addWidget(widget)
        requestAnimationFrame(() => {
          expect(layout.methods).to.contain("onFitRequest")
          layout.removeWidget(widget)
          layout.methods = []
          requestAnimationFrame(() => {
            expect(layout.methods).to.contain("onFitRequest")
            panel.dispose()
            done()
          })
        })
      })
    })
    describe("#onAfterShow()", () => {
      it("should post an update request to the parent", done => {
        const parent = new LogWidget()
        const layout = new LogBoxLayout()
        parent.layout = layout
        Widget.attach(parent, document.body)
        parent.hide()
        parent.show()
        expect(parent.methods).to.contain("onAfterShow")
        expect(layout.methods).to.contain("onAfterShow")
        requestAnimationFrame(() => {
          expect(parent.methods).to.contain("onUpdateRequest")
          parent.dispose()
          done()
        })
      })
      it("should send an `after-show` message to non-hidden child widgets", () => {
        const parent = new LogWidget()
        const layout = new LogBoxLayout()
        parent.layout = layout
        const widgets = [new LogWidget(), new LogWidget(), new LogWidget()]
        const hiddenWidgets = [new LogWidget(), new LogWidget()]
        widgets.forEach(w => {
          layout.addWidget(w)
        })
        hiddenWidgets.forEach(w => {
          layout.addWidget(w)
        })
        hiddenWidgets.forEach(w => {
          w.hide()
        })
        Widget.attach(parent, document.body)
        parent.layout = layout
        parent.hide()
        parent.show()
        expect(every(widgets, w => w.methods.indexOf("after-show") !== -1))
        expect(
          every(hiddenWidgets, w => w.methods.indexOf("after-show") === -1)
        )
        expect(parent.methods).to.contain("onAfterShow")
        expect(layout.methods).to.contain("onAfterShow")
        parent.dispose()
      })
    })
    describe("#onAfterAttach()", () => {
      it("should post a fit request to the parent", done => {
        const parent = new LogWidget()
        const layout = new LogBoxLayout()
        parent.layout = layout
        Widget.attach(parent, document.body)
        expect(parent.methods).to.contain("onAfterAttach")
        expect(layout.methods).to.contain("onAfterAttach")
        requestAnimationFrame(() => {
          expect(layout.methods).to.contain("onFitRequest")
          parent.dispose()
          done()
        })
      })
      it("should send `after-attach` to all child widgets", () => {
        const parent = new LogWidget()
        const layout = new LogBoxLayout()
        parent.layout = layout
        const widgets = [new LogWidget(), new LogWidget(), new LogWidget()]
        widgets.forEach(w => {
          layout.addWidget(w)
        })
        Widget.attach(parent, document.body)
        expect(parent.methods).to.contain("onAfterAttach")
        expect(layout.methods).to.contain("onAfterAttach")
        expect(every(widgets, w => w.methods.indexOf("onAfterAttach") !== -1))
        parent.dispose()
      })
    })
    describe("#onChildShown()", () => {
      it("should post or send a fit request to the parent", done => {
        const parent = new LogWidget()
        const layout = new LogBoxLayout()
        parent.layout = layout
        const widgets = [new LogWidget(), new LogWidget(), new LogWidget()]
        widgets[0].hide()
        widgets.forEach(w => {
          layout.addWidget(w)
        })
        Widget.attach(parent, document.body)
        widgets[0].show()
        expect(layout.methods).to.contain("onChildShown")
        requestAnimationFrame(() => {
          expect(layout.methods).to.contain("onFitRequest")
          parent.dispose()
          done()
        })
      })
    })
    describe("#onChildHidden()", () => {
      it("should post a fit request to the parent", done => {
        const parent = new LogWidget()
        const layout = new LogBoxLayout()
        parent.layout = layout
        const widgets = [new LogWidget(), new LogWidget(), new LogWidget()]
        widgets.forEach(w => {
          layout.addWidget(w)
        })
        Widget.attach(parent, document.body)
        widgets[0].hide()
        expect(layout.methods).to.contain("onChildHidden")
        requestAnimationFrame(() => {
          expect(layout.methods).to.contain("onFitRequest")
          parent.dispose()
          done()
        })
      })
    })
    describe("#onResize()", () => {
      it("should be called when a resize event is sent to the parent", () => {
        const parent = new LogWidget()
        const layout = new LogBoxLayout()
        parent.layout = layout
        const widgets = [new LogWidget(), new LogWidget(), new LogWidget()]
        widgets.forEach(w => {
          layout.addWidget(w)
        })
        Widget.attach(parent, document.body)
        MessageLoop.sendMessage(parent, Widget.ResizeMessage.UnknownSize)
        expect(layout.methods).to.contain("onResize")
        parent.dispose()
      })
      it("should be a no-op if the parent is hidden", () => {
        const parent = new LogWidget()
        const layout = new LogBoxLayout()
        parent.layout = layout
        Widget.attach(parent, document.body)
        parent.hide()
        MessageLoop.sendMessage(parent, Widget.ResizeMessage.UnknownSize)
        expect(layout.methods).to.contain("onResize")
        parent.dispose()
      })
    })
    describe("#onUpdateRequest()", () => {
      it("should be called when the parent is updated", () => {
        const parent = new Widget()
        const layout = new LogBoxLayout()
        parent.layout = layout
        MessageLoop.sendMessage(parent, Widget.Msg.UpdateRequest)
        expect(layout.methods).to.contain("onUpdateRequest")
      })
    })
    describe("#onFitRequest()", () => {
      it("should be called when the parent fit is requested", () => {
        const parent = new Widget()
        const layout = new LogBoxLayout()
        parent.layout = layout
        MessageLoop.sendMessage(parent, Widget.Msg.FitRequest)
        expect(layout.methods).to.contain("onFitRequest")
      })
    })
    describe(".getStretch()", () => {
      it("should get the box panel stretch factor for the given widget", () => {
        const widget = new Widget()
        expect(BoxLayout.getStretch(widget)).toEqual(0)
      })
    })
    describe(".setStretch()", () => {
      it("should set the box panel stretch factor for the given widget", () => {
        const widget = new Widget()
        BoxLayout.setStretch(widget, 8)
        expect(BoxLayout.getStretch(widget)).toEqual(8)
      })
      it("should post a fit request to the widget's parent", done => {
        const parent = new Widget()
        const widget = new Widget()
        const layout = new LogBoxLayout()
        parent.layout = layout
        layout.addWidget(widget)
        BoxLayout.setStretch(widget, 8)
        requestAnimationFrame(() => {
          expect(layout.methods).to.contain("onFitRequest")
          done()
        })
      })
    })
    describe(".getSizeBasis()", () => {
      it("should get the box panel size basis for the given widget", () => {
        const widget = new Widget()
        expect(BoxLayout.getSizeBasis(widget)).toEqual(0)
      })
    })
    describe(".setSizeBasis()", () => {
      it("should set the box panel size basis for the given widget", () => {
        const widget = new Widget()
        BoxLayout.setSizeBasis(widget, 8)
        expect(BoxLayout.getSizeBasis(widget)).toEqual(8)
      })
      it("should post a fit request to the widget's parent", done => {
        const parent = new Widget()
        const widget = new Widget()
        const layout = new LogBoxLayout()
        parent.layout = layout
        layout.addWidget(widget)
        BoxLayout.setSizeBasis(widget, 8)
        requestAnimationFrame(() => {
          expect(layout.methods).to.contain("onFitRequest")
          done()
        })
      })
    })
  })
})
describe("../../src/lumino/widgets", () => {
  describe("BoxPanel", () => {
    describe("#constructor()", () => {
      it("should take no arguments", () => {
        const panel = new BoxPanel()
        expect(panel).to.be.an.instanceof(BoxPanel)
      })
      it("should accept options", () => {
        const panel = new BoxPanel({ direction: "bottom-to-top", spacing: 10 })
        expect(panel.direction).toEqual("bottom-to-top")
        expect(panel.spacing).toEqual(10)
      })
      it("should accept a layout option", () => {
        const layout = new BoxLayout()
        const panel = new BoxPanel({ layout })
        expect(panel.layout).toEqual(layout)
      })
      it("should ignore other options if a layout is given", () => {
        const layout = new BoxLayout()
        const panel = new BoxPanel({
          layout,
          direction: "bottom-to-top",
          spacing: 10,
        })
        expect(panel.layout).toEqual(layout)
        expect(panel.direction).toEqual("top-to-bottom")
        expect(panel.spacing).toEqual(4)
      })
      it("should add the `lm-BoxPanel` class", () => {
        const panel = new BoxPanel()
        expect(panel.hasClass("lm-BoxPanel")).toEqual(true)
      })
    })
    describe("#direction", () => {
      it('should default to `"top-to-bottom"`', () => {
        const panel = new BoxPanel()
        expect(panel.direction).toEqual("top-to-bottom")
      })
      it("should set the layout direction for the box panel", () => {
        const panel = new BoxPanel()
        panel.direction = "left-to-right"
        expect(panel.direction).toEqual("left-to-right")
      })
    })
    describe("#spacing", () => {
      it("should default to `4`", () => {
        const panel = new BoxPanel()
        expect(panel.spacing).toEqual(4)
      })
      it("should set the inter-element spacing for the box panel", () => {
        const panel = new BoxPanel()
        panel.spacing = 8
        expect(panel.spacing).toEqual(8)
      })
    })
    describe("#onChildAdded()", () => {
      it("should add the child class to a child added to the panel", () => {
        const panel = new BoxPanel()
        const widget = new Widget()
        panel.addWidget(widget)
        expect(widget.hasClass("lm-BoxPanel-child")).toEqual(true)
      })
    })
    describe("#onChildRemoved()", () => {
      it("should remove the child class from a child removed from the panel", () => {
        const panel = new BoxPanel()
        const widget = new Widget()
        panel.addWidget(widget)
        widget.parent = null
        expect(widget.hasClass("lm-BoxPanel-child")).toEqual(false)
      })
    })
    describe(".getStretch()", () => {
      it("should get the box panel stretch factor for the given widget", () => {
        const widget = new Widget()
        expect(BoxPanel.getStretch(widget)).toEqual(0)
      })
    })
    describe(".setStretch()", () => {
      it("should set the box panel stretch factor for the given widget", () => {
        const widget = new Widget()
        BoxPanel.setStretch(widget, 8)
        expect(BoxPanel.getStretch(widget)).toEqual(8)
      })
    })
    describe(".getSizeBasis()", () => {
      it("should get the box panel size basis for the given widget", () => {
        const widget = new Widget()
        expect(BoxPanel.getSizeBasis(widget)).toEqual(0)
      })
    })
    describe(".setSizeBasis()", () => {
      it("should set the box panel size basis for the given widget", () => {
        const widget = new Widget()
        BoxPanel.setSizeBasis(widget, 8)
        expect(BoxPanel.getSizeBasis(widget)).toEqual(8)
      })
    })
  })
})
class LogPalette extends CommandPalette {
  events: string[] = []
  handleEvent(event: Event): void {
    super.handleEvent(event)
    this.events.push(event.type)
  }
}
const bubbles = true
const defaultOptions: CommandPalette.IItemOptions = {
  command: "test",
  category: "Test Category",
  args: { foo: "bar" },
  rank: 42,
}
describe("../../src/lumino/widgets", () => {
  let commands: CommandRegistry
  let palette: CommandPalette
  beforeEach(() => {
    commands = new CommandRegistry()
    palette = new CommandPalette({ commands })
  })
  afterEach(() => {
    palette.dispose()
  })
  describe("CommandPalette", () => {
    describe("#constructor()", () => {
      it("should accept command palette instantiation options", () => {
        expect(palette).to.be.an.instanceof(CommandPalette)
        expect(palette.node.classList.contains("lm-CommandPalette")).toEqual(
          true
        )
      })
    })
    describe("#dispose()", () => {
      it("should dispose of the resources held by the command palette", () => {
        palette.addItem(defaultOptions)
        palette.dispose()
        expect(palette.items.length).toEqual(0)
        expect(palette.isDisposed).toEqual(true)
      })
    })
    describe("#commands", () => {
      it("should get the command registry for the command palette", () => {
        expect(palette.commands).toEqual(commands)
      })
    })
    describe("#renderer", () => {
      it("should default to the default renderer", () => {
        expect(palette.renderer).toEqual(CommandPalette.defaultRenderer)
      })
    })
    describe("#searchNode", () => {
      it("should return the search node of a command palette", () => {
        expect(
          palette.searchNode.classList.contains("lm-CommandPalette-search")
        ).toEqual(true)
      })
    })
    describe("#inputNode", () => {
      it("should return the input node of a command palette", () => {
        expect(
          palette.inputNode.classList.contains("lm-CommandPalette-input")
        ).toEqual(true)
      })
    })
    describe("#contentNode", () => {
      it("should return the content node of a command palette", () => {
        expect(
          palette.contentNode.classList.contains("lm-CommandPalette-content")
        ).toEqual(true)
      })
    })
    describe("#items", () => {
      it("should be a read-only array of the palette items", () => {
        expect(palette.items.length).toEqual(0)
        palette.addItem(defaultOptions)
        expect(palette.items.length).toEqual(1)
        expect(palette.items[0].command).toEqual("test")
      })
    })
    describe("#addItems()", () => {
      it("should add items to a command palette using options", () => {
        const item = {
          command: "test2",
          category: "Test Category",
          args: { foo: "bar" },
          rank: 100,
        }
        expect(palette.items.length).toEqual(0)
        palette.addItems([defaultOptions, item])
        expect(palette.items.length).toEqual(2)
        expect(palette.items[0].command).toEqual("test")
        expect(palette.items[1].command).toEqual("test2")
      })
    })
    describe("#addItem()", () => {
      it("should add an item to a command palette using options", () => {
        expect(palette.items.length).toEqual(0)
        palette.addItem(defaultOptions)
        expect(palette.items.length).toEqual(1)
        expect(palette.items[0].command).toEqual("test")
      })
      context("CommandPalette.IItem", () => {
        describe("#command", () => {
          it("should return the command name of a command item", () => {
            const item = palette.addItem(defaultOptions)
            expect(item.command).toEqual("test")
          })
        })
        describe("#args", () => {
          it("should return the args of a command item", () => {
            const item = palette.addItem(defaultOptions)
            expect(item.args).to.deep.equal(defaultOptions.args)
          })
          it("should default to an empty object", () => {
            const item = palette.addItem({ command: "test", category: "test" })
            expect(item.args).to.deep.equal({})
          })
        })
        describe("#category", () => {
          it("should return the category of a command item", () => {
            const item = palette.addItem(defaultOptions)
            expect(item.category).toEqual(defaultOptions.category)
          })
        })
        describe("#rank", () => {
          it("should return the rank of a command item", () => {
            const item = palette.addItem(defaultOptions)
            expect(item.rank).to.deep.equal(defaultOptions.rank)
          })
          it("should default to `Infinity`", () => {
            const item = palette.addItem({ command: "test", category: "test" })
            expect(item.rank).toEqual(Infinity)
          })
        })
        describe("#label", () => {
          it("should return the label of a command item", () => {
            const label = "test label"
            commands.addCommand("test", { execute: () => {}, label })
            const item = palette.addItem(defaultOptions)
            expect(item.label).toEqual(label)
          })
        })
        describe("#caption", () => {
          it("should return the caption of a command item", () => {
            const caption = "test caption"
            commands.addCommand("test", { execute: () => {}, caption })
            const item = palette.addItem(defaultOptions)
            expect(item.caption).toEqual(caption)
          })
        })
        describe("#className", () => {
          it("should return the class name of a command item", () => {
            const className = "testClass"
            commands.addCommand("test", { execute: () => {}, className })
            const item = palette.addItem(defaultOptions)
            expect(item.className).toEqual(className)
          })
        })
        describe("#isEnabled", () => {
          it("should return whether a command item is enabled", () => {
            let called = false
            commands.addCommand("test", {
              execute: () => {},
              isEnabled: () => {
                called = true
                return false
              },
            })
            const item = palette.addItem(defaultOptions)
            expect(called).toEqual(false)
            expect(item.isEnabled).toEqual(false)
            expect(called).toEqual(true)
          })
        })
        describe("#isToggled", () => {
          it("should return whether a command item is toggled", () => {
            let called = false
            commands.addCommand("test", {
              execute: () => {},
              isToggled: () => {
                called = true
                return true
              },
            })
            const item = palette.addItem(defaultOptions)
            expect(called).toEqual(false)
            expect(item.isToggled).toEqual(true)
            expect(called).toEqual(true)
          })
        })
        describe("#isVisible", () => {
          it("should return whether a command item is visible", () => {
            let called = false
            commands.addCommand("test", {
              execute: () => {},
              isVisible: () => {
                called = true
                return false
              },
            })
            const item = palette.addItem(defaultOptions)
            expect(called).toEqual(false)
            expect(item.isVisible).toEqual(false)
            expect(called).toEqual(true)
          })
        })
        describe("#keyBinding", () => {
          it("should return the key binding of a command item", () => {
            commands.addKeyBinding({
              keys: ["Ctrl A"],
              selector: "body",
              command: "test",
              args: defaultOptions.args,
            })
            const item = palette.addItem(defaultOptions)
            expect(item.keyBinding!.keys).to.deep.equal(["Ctrl A"])
          })
        })
      })
    })
    describe("#removeItem()", () => {
      it("should remove an item from a command palette by item", () => {
        expect(palette.items.length).toEqual(0)
        const item = palette.addItem(defaultOptions)
        expect(palette.items.length).toEqual(1)
        palette.removeItem(item)
        expect(palette.items.length).toEqual(0)
      })
    })
    describe("#removeItemAt()", () => {
      it("should remove an item from a command palette by index", () => {
        expect(palette.items.length).toEqual(0)
        palette.addItem(defaultOptions)
        expect(palette.items.length).toEqual(1)
        palette.removeItemAt(0)
        expect(palette.items.length).toEqual(0)
      })
    })
    describe("#clearItems()", () => {
      it("should remove all items from a command palette", () => {
        expect(palette.items.length).toEqual(0)
        palette.addItem({ command: "test", category: "one" })
        palette.addItem({ command: "test", category: "two" })
        expect(palette.items.length).toEqual(2)
        palette.clearItems()
        expect(palette.items.length).toEqual(0)
      })
    })
    describe("#refresh()", () => {
      it("should schedule a refresh of the search items", () => {
        commands.addCommand("test", { execute: () => {}, label: "test" })
        palette.addItem(defaultOptions)
        MessageLoop.flush()
        const content = palette.contentNode
        const itemClass = ".lm-CommandPalette-item"
        const items = () => content.querySelectorAll(itemClass)
        expect(items()).to.have.length(1)
        palette.inputNode.value = "x"
        palette.refresh()
        MessageLoop.flush()
        expect(items()).to.have.length(0)
      })
    })
    describe("#handleEvent()", () => {
      it("should handle click, keydown, and input events", () => {
        const palette = new LogPalette({ commands })
        Widget.attach(palette, document.body)
        ;["click", "keydown", "input"].forEach(type => {
          palette.node.dispatchEvent(new Event(type, { bubbles }))
          expect(palette.events).to.contain(type)
        })
        palette.dispose()
      })
      context("click", () => {
        it("should trigger a command when its item is clicked", () => {
          let called = false
          commands.addCommand("test", { execute: () => (called = true) })
          palette.addItem(defaultOptions)
          Widget.attach(palette, document.body)
          MessageLoop.flush()
          const node = palette.contentNode.querySelector(
            ".lm-CommandPalette-item"
          )!
          node.dispatchEvent(new MouseEvent("click", { bubbles }))
          expect(called).toEqual(true)
        })
        it("should ignore the event if it is not a left click", () => {
          let called = false
          commands.addCommand("test", { execute: () => (called = true) })
          palette.addItem(defaultOptions)
          Widget.attach(palette, document.body)
          MessageLoop.flush()
          const node = palette.contentNode.querySelector(
            ".lm-CommandPalette-item"
          )!
          node.dispatchEvent(new MouseEvent("click", { bubbles, button: 1 }))
          expect(called).toEqual(false)
        })
      })
      context("keydown", () => {
        it("should navigate down if down arrow is pressed", () => {
          commands.addCommand("test", { execute: () => {} })
          const content = palette.contentNode
          palette.addItem(defaultOptions)
          Widget.attach(palette, document.body)
          MessageLoop.flush()
          let node = content.querySelector(".lm-mod-active")
          expect(node).toEqual(null)
          palette.node.dispatchEvent(
            new KeyboardEvent("keydown", {
              bubbles,
              keyCode: 40, // Down arrow
            })
          )
          MessageLoop.flush()
          node = content.querySelector(".lm-CommandPalette-item.lm-mod-active")
          expect(node).to.not.equal(null)
        })
        it("should navigate up if up arrow is pressed", () => {
          commands.addCommand("test", { execute: () => {} })
          const content = palette.contentNode
          palette.addItem(defaultOptions)
          Widget.attach(palette, document.body)
          MessageLoop.flush()
          let node = content.querySelector(".lm-mod-active")
          expect(node).toEqual(null)
          palette.node.dispatchEvent(
            new KeyboardEvent("keydown", {
              bubbles,
              keyCode: 38, // Up arrow
            })
          )
          MessageLoop.flush()
          node = content.querySelector(".lm-CommandPalette-item.lm-mod-active")
          expect(node).to.not.equal(null)
        })
        it("should ignore if modifier keys are pressed", () => {
          let called = false
          commands.addCommand("test", { execute: () => (called = true) })
          const content = palette.contentNode
          palette.addItem(defaultOptions)
          Widget.attach(palette, document.body)
          MessageLoop.flush()
          let node = content.querySelector(".lm-mod-active")
          expect(node).toEqual(null)
          ;["altKey", "ctrlKey", "shiftKey", "metaKey"].forEach(key => {
            palette.node.dispatchEvent(
              new KeyboardEvent("keydown", {
                bubbles,
                [key]: true,
                keyCode: 38, // Up arrow
              })
            )
            node = content.querySelector(
              ".lm-CommandPalette-item.lm-mod-active"
            )
            expect(node).toEqual(null)
          })
          expect(called).to.be.false
        })
        it("should trigger active item if enter is pressed", () => {
          let called = false
          commands.addCommand("test", {
            execute: () => (called = true),
          })
          const content = palette.contentNode
          palette.addItem(defaultOptions)
          Widget.attach(palette, document.body)
          MessageLoop.flush()
          expect(content.querySelector(".lm-mod-active")).toEqual(null)
          palette.node.dispatchEvent(
            new KeyboardEvent("keydown", {
              bubbles,
              keyCode: 40, // Down arrow
            })
          )
          palette.node.dispatchEvent(
            new KeyboardEvent("keydown", {
              bubbles,
              keyCode: 13, // Enter
            })
          )
          expect(called).toEqual(true)
        })
      })
      context("input", () => {
        it("should filter the list of visible items", () => {
          ;["A", "B", "C", "D", "E"].forEach(name => {
            commands.addCommand(name, { execute: () => {}, label: name })
            palette.addItem({ command: name, category: "test" })
          })
          Widget.attach(palette, document.body)
          MessageLoop.flush()
          const content = palette.contentNode
          const itemClass = ".lm-CommandPalette-item"
          const items = () => content.querySelectorAll(itemClass)
          expect(items()).to.have.length(5)
          palette.inputNode.value = "A"
          palette.refresh()
          MessageLoop.flush()
          expect(items()).to.have.length(1)
        })
        it("should filter by both text and category", () => {
          const categories = ["Z", "Y"]
          const names = [
            ["A1", "B2", "C3", "D4", "E5"],
            ["F1", "G2", "H3", "I4", "J5"],
          ]
          names.forEach((values, index) => {
            values.forEach(command => {
              palette.addItem({ command, category: categories[index] })
              commands.addCommand(command, {
                execute: () => {},
                label: command,
              })
            })
          })
          Widget.attach(palette, document.body)
          MessageLoop.flush()
          const headers = () =>
            palette.node.querySelectorAll(".lm-CommandPalette-header")
          const items = () =>
            palette.node.querySelectorAll(".lm-CommandPalette-item")
          const input = (value: string) => {
            palette.inputNode.value = value
            palette.refresh()
            MessageLoop.flush()
          }
          expect(items()).to.have.length(10)
          input(`${categories[1]}`) // Category match
          expect(items()).to.have.length(5)
          input(`${names[1][0]}`) // Label match
          expect(items()).to.have.length(1)
          input(`${categories[1]} B`) // No match
          expect(items()).to.have.length(0)
          input(`${categories[1]} I`) // Category and text match
          expect(items()).to.have.length(1)
          input("1") // Multi-category match
          expect(headers()).to.have.length(2)
          expect(items()).to.have.length(2)
        })
      })
    })
    describe(".Renderer", () => {
      const renderer = new CommandPalette.Renderer()
      let item: CommandPalette.IItem = null!
      let enabledFlag = true
      let toggledFlag = false
      beforeEach(() => {
        enabledFlag = true
        toggledFlag = false
        commands.addCommand("test", {
          label: "Test Command",
          caption: "A simple test command",
          className: "testClass",
          isEnabled: () => enabledFlag,
          isToggled: () => toggledFlag,
          execute: () => {},
        })
        commands.addKeyBinding({
          command: "test",
          keys: ["Ctrl A"],
          selector: "body",
        })
        item = palette.addItem({
          command: "test",
          category: "Test Category",
        })
      })
      describe("#renderHeader()", () => {
        it("should render a header node for the palette", () => {
          const vNode = renderer.renderHeader({
            category: "Test Category",
            indices: null,
          })
          const node = VirtualDOM.realize(vNode)
          expect(node.classList.contains("lm-CommandPalette-header")).toEqual(
            true
          )
          expect(node.innerHTML).toEqual("Test Category")
        })
        it("should mark the matching indices", () => {
          const vNode = renderer.renderHeader({
            category: "Test Category",
            indices: [1, 2, 6, 7, 8],
          })
          const node = VirtualDOM.realize(vNode)
          expect(node.classList.contains("lm-CommandPalette-header")).toEqual(
            true
          )
          expect(node.innerHTML).toEqual(
            "T<mark>es</mark>t C<mark>ate</mark>gory"
          )
        })
      })
      describe("#renderItem()", () => {
        it("should render an item node for the palette", () => {
          const vNode = renderer.renderItem({
            item,
            indices: null,
            active: false,
          })
          const node = VirtualDOM.realize(vNode)
          expect(node.classList.contains("lm-CommandPalette-item")).toEqual(
            true
          )
          expect(node.classList.contains("lm-mod-disabled")).toEqual(false)
          expect(node.classList.contains("lm-mod-toggled")).toEqual(false)
          expect(node.classList.contains("lm-mod-active")).toEqual(false)
          expect(node.classList.contains("testClass")).toEqual(true)
          expect(node.getAttribute("data-command")).toEqual("test")
          expect(
            node.querySelector(".lm-CommandPalette-itemShortcut")
          ).to.not.equal(null)
          expect(
            node.querySelector(".lm-CommandPalette-itemLabel")
          ).to.not.equal(null)
          expect(
            node.querySelector(".lm-CommandPalette-itemCaption")
          ).to.not.equal(null)
        })
        it("should handle the disabled item state", () => {
          enabledFlag = false
          const vNode = renderer.renderItem({
            item,
            indices: null,
            active: false,
          })
          const node = VirtualDOM.realize(vNode)
          expect(node.classList.contains("lm-mod-disabled")).toEqual(true)
        })
        it("should handle the toggled item state", () => {
          toggledFlag = true
          const vNode = renderer.renderItem({
            item,
            indices: null,
            active: false,
          })
          const node = VirtualDOM.realize(vNode)
          expect(node.classList.contains("lm-mod-toggled")).toEqual(true)
        })
        it("should handle the active state", () => {
          const vNode = renderer.renderItem({
            item,
            indices: null,
            active: true,
          })
          const node = VirtualDOM.realize(vNode)
          expect(node.classList.contains("lm-mod-active")).toEqual(true)
        })
      })
      describe("#renderEmptyMessage()", () => {
        it("should render an empty message node for the palette", () => {
          const vNode = renderer.renderEmptyMessage({ query: "foo" })
          const node = VirtualDOM.realize(vNode)
          expect(
            node.classList.contains("lm-CommandPalette-emptyMessage")
          ).toEqual(true)
          expect(node.innerHTML).toEqual("No commands found that match 'foo'")
        })
      })
      describe("#renderItemShortcut()", () => {
        it("should render an item shortcut node", () => {
          const vNode = renderer.renderItemShortcut({
            item,
            indices: null,
            active: false,
          })
          const node = VirtualDOM.realize(vNode)
          expect(
            node.classList.contains("lm-CommandPalette-itemShortcut")
          ).toEqual(true)
          if (Platform.IS_MAC) {
            expect(node.innerHTML).toEqual("\u2303 A")
          } else {
            expect(node.innerHTML).toEqual("Ctrl+A")
          }
        })
      })
      describe("#renderItemLabel()", () => {
        it("should render an item label node", () => {
          const vNode = renderer.renderItemLabel({
            item,
            indices: [1, 2, 3],
            active: false,
          })
          const node = VirtualDOM.realize(vNode)
          expect(
            node.classList.contains("lm-CommandPalette-itemLabel")
          ).toEqual(true)
          expect(node.innerHTML).toEqual("T<mark>est</mark> Command")
        })
      })
      describe("#renderItemCaption()", () => {
        it("should render an item caption node", () => {
          const vNode = renderer.renderItemCaption({
            item,
            indices: null,
            active: false,
          })
          const node = VirtualDOM.realize(vNode)
          expect(
            node.classList.contains("lm-CommandPalette-itemCaption")
          ).toEqual(true)
          expect(node.innerHTML).toEqual("A simple test command")
        })
      })
      describe("#createItemClass()", () => {
        it("should create the full class name for the item node", () => {
          const name = renderer.createItemClass({
            item,
            indices: null,
            active: false,
          })
          const expected = "lm-CommandPalette-item testClass"
          expect(name).toEqual(expected)
        })
        it("should handle the boolean states", () => {
          enabledFlag = false
          toggledFlag = true
          const name = renderer.createItemClass({
            item,
            indices: null,
            active: true,
          })
          const expected =
            "lm-CommandPalette-item lm-mod-disabled lm-mod-toggled lm-mod-active testClass"
          expect(name).toEqual(expected)
        })
      })
      describe("#createItemDataset()", () => {
        it("should create the item dataset", () => {
          const dataset = renderer.createItemDataset({
            item,
            indices: null,
            active: false,
          })
          expect(dataset).to.deep.equal({ command: "test" })
        })
      })
      describe("#formatHeader()", () => {
        it("should format unmatched header content", () => {
          const child1 = renderer.formatHeader({
            category: "Test Category",
            indices: null,
          })
          const child2 = renderer.formatHeader({
            category: "Test Category",
            indices: [],
          })
          expect(child1).toEqual("Test Category")
          expect(child2).toEqual("Test Category")
        })
        it("should format matched header content", () => {
          const child = renderer.formatHeader({
            category: "Test Category",
            indices: [1, 2, 6, 7, 8],
          })
          const node = VirtualDOM.realize(h.div(child))
          expect(node.innerHTML).toEqual(
            "T<mark>es</mark>t C<mark>ate</mark>gory"
          )
        })
      })
      describe("#formatEmptyMessage()", () => {
        it("should format the empty message text", () => {
          const child = renderer.formatEmptyMessage({ query: "foo" })
          expect(child).toEqual("No commands found that match 'foo'")
        })
      })
      describe("#formatItemShortcut()", () => {
        it("should format the item shortcut text", () => {
          const child = renderer.formatItemShortcut({
            item,
            indices: null,
            active: false,
          })
          if (Platform.IS_MAC) {
            expect(child).toEqual("\u2303 A")
          } else {
            expect(child).toEqual("Ctrl+A")
          }
        })
      })
      describe("#formatItemLabel()", () => {
        it("should format unmatched label content", () => {
          const child1 = renderer.formatItemLabel({
            item,
            indices: null,
            active: false,
          })
          const child2 = renderer.formatItemLabel({
            item,
            indices: [],
            active: false,
          })
          expect(child1).toEqual("Test Command")
          expect(child2).toEqual("Test Command")
        })
        it("should format matched label content", () => {
          const child = renderer.formatItemLabel({
            item,
            indices: [1, 2, 3],
            active: false,
          })
          const node = VirtualDOM.realize(h.div(child))
          expect(node.innerHTML).toEqual("T<mark>est</mark> Command")
        })
      })
      describe("#formatItemCaption()", () => {
        it("should format the item caption text", () => {
          const child = renderer.formatItemCaption({
            item,
            indices: null,
            active: false,
          })
          expect(child).toEqual("A simple test command")
        })
      })
    })
  })
})
describe("../../src/lumino/widgets", () => {
  const commands = new CommandRegistry()
  before(() => {
    commands.addCommand("test-1", {
      execute: (args: JSONObject) => {},
      label: "Test 1 Label",
    })
    commands.addCommand("test-2", {
      execute: (args: JSONObject) => {},
      label: "Test 2 Label",
    })
    commands.addCommand("test-3", {
      execute: (args: JSONObject) => {},
      label: "Test 3 Label",
    })
    commands.addCommand("test-4", {
      execute: (args: JSONObject) => {},
      label: "Test 4 Label",
    })
  })
  describe("ContextMenu", () => {
    describe("#open", () => {
      let menu: ContextMenu
      const CLASSNAME = "menu-1"
      function addItems(menu: ContextMenu) {
        menu.addItem({
          command: "test-1",
          selector: `.${CLASSNAME}`,
          rank: 20,
        })
        menu.addItem({
          command: "test-2",
          selector: `.${CLASSNAME}`,
          rank: 10,
        })
        menu.addItem({
          command: "test-3",
          selector: `div.${CLASSNAME}`,
          rank: 30,
        })
        menu.addItem({
          command: "test-4",
          selector: ".menu-2",
          rank: 1,
        })
        menu.addItem({
          command: "test-5",
          selector: "body",
          rank: 15,
        })
      }
      afterEach(() => {
        menu && menu.menu.dispose()
      })
      it("should show items matching selector, grouped and ordered by selector and rank", () => {
        const target = document.createElement("div")
        target.className = CLASSNAME
        document.body.appendChild(target)
        menu = new ContextMenu({ commands })
        addItems(menu)
        const bb = target.getBoundingClientRect() as DOMRect
        menu.open({
          target,
          currentTarget: document.body,
          clientX: bb.x,
          clientY: bb.y,
        } as any)
        expect(menu.menu.items).to.have.length(4)
        expect(menu.menu.items[0].command).toEqual("test-3")
        expect(menu.menu.items[1].command).toEqual("test-2")
        expect(menu.menu.items[2].command).toEqual("test-1")
        expect(menu.menu.items[3].command).toEqual("test-5")
      })
      it("should show items matching selector, grouped and ordered only by rank", () => {
        const target = document.createElement("div")
        target.className = CLASSNAME
        document.body.appendChild(target)
        menu = new ContextMenu({ commands, sortBySelector: false })
        addItems(menu)
        const bb = target.getBoundingClientRect() as DOMRect
        menu.open({
          target,
          currentTarget: document.body,
          clientX: bb.x,
          clientY: bb.y,
        } as any)
        expect(menu.menu.items).to.have.length(4)
        expect(menu.menu.items[0].command).toEqual("test-2")
        expect(menu.menu.items[1].command).toEqual("test-1")
        expect(menu.menu.items[2].command).toEqual("test-3")
        expect(menu.menu.items[3].command).toEqual("test-5")
      })
      it("should show items matching selector, ungrouped and ordered by selector and rank", () => {
        const target = document.createElement("div")
        target.className = CLASSNAME
        document.body.appendChild(target)
        menu = new ContextMenu({
          commands,
          groupByTarget: false,
          sortBySelector: false,
        })
        addItems(menu)
        const bb = target.getBoundingClientRect() as DOMRect
        menu.open({
          target,
          currentTarget: document.body,
          clientX: bb.x,
          clientY: bb.y,
        } as any)
        expect(menu.menu.items).to.have.length(4)
        expect(menu.menu.items[1].command).toEqual("test-5")
        expect(menu.menu.items[0].command).toEqual("test-2")
        expect(menu.menu.items[2].command).toEqual("test-1")
        expect(menu.menu.items[3].command).toEqual("test-3")
      })
      it("should show items matching selector, ungrouped and ordered only by rank", () => {
        const target = document.createElement("div")
        target.className = CLASSNAME
        document.body.appendChild(target)
        menu = new ContextMenu({
          commands,
          groupByTarget: false,
          sortBySelector: false,
        })
        addItems(menu)
        const bb = target.getBoundingClientRect() as DOMRect
        menu.open({
          target,
          currentTarget: document.body,
          clientX: bb.x,
          clientY: bb.y,
        } as any)
        expect(menu.menu.items).to.have.length(4)
        expect(menu.menu.items[0].command).toEqual("test-2")
        expect(menu.menu.items[1].command).toEqual("test-5")
        expect(menu.menu.items[2].command).toEqual("test-1")
        expect(menu.menu.items[3].command).toEqual("test-3")
      })
    })
  })
})
describe("../../src/lumino/widgets", () => {
  describe("DockPanel", () => {
    describe("#constructor()", () => {
      it("should construct a new dock panel and take no arguments", () => {
        const panel = new DockPanel()
        expect(panel).to.be.an.instanceof(DockPanel)
      })
      it("should accept options", () => {
        const renderer = Object.create(TabBar.defaultRenderer)
        const panel = new DockPanel({
          tabsMovable: true,
          renderer,
          tabsConstrained: true,
        })
        for (const tabBar of panel.tabBars()) {
          expect(tabBar.tabsMovable).toEqual(true)
        }
        for (const tabBar of panel.tabBars()) {
          expect(tabBar.renderer).toEqual(renderer)
        }
      })
      it("should not have tabs constrained by default", () => {
        const panel = new DockPanel()
        expect(panel.tabsConstrained).toEqual(false)
      })
      it("should add a `lm-DockPanel` class", () => {
        const panel = new DockPanel()
        expect(panel.hasClass("lm-DockPanel")).toEqual(true)
      })
    })
    describe("#dispose()", () => {
      it("should dispose of the resources held by the widget", () => {
        const panel = new DockPanel()
        panel.addWidget(new Widget())
        panel.dispose()
        expect(panel.isDisposed).toEqual(true)
        panel.dispose()
        expect(panel.isDisposed).toEqual(true)
      })
    })
    describe("hiddenMode", () => {
      let panel: DockPanel
      const widgets: Widget[] = []
      beforeEach(() => {
        panel = new DockPanel()
        widgets.push(new Widget())
        panel.addWidget(widgets[0])
        widgets.push(new Widget())
        panel.addWidget(widgets[1], { mode: "tab-after" })
      })
      afterEach(() => {
        panel.dispose()
      })
      it("should be 'display' mode by default", () => {
        expect(panel.hiddenMode).toEqual(Widget.HiddenMode.Display)
      })
      it("should switch to 'scale'", () => {
        widgets[0].hiddenMode = Widget.HiddenMode.Scale
        panel.hiddenMode = Widget.HiddenMode.Scale
        expect(widgets[0].hiddenMode).toEqual(Widget.HiddenMode.Scale)
        expect(widgets[1].hiddenMode).toEqual(Widget.HiddenMode.Scale)
      })
      it("should switch to 'display'", () => {
        widgets[0].hiddenMode = Widget.HiddenMode.Scale
        panel.hiddenMode = Widget.HiddenMode.Scale
        panel.hiddenMode = Widget.HiddenMode.Display
        expect(widgets[0].hiddenMode).toEqual(Widget.HiddenMode.Display)
        expect(widgets[1].hiddenMode).toEqual(Widget.HiddenMode.Display)
      })
      it("should not set 'scale' if only one widget", () => {
        panel.layout!.removeWidget(widgets[1])
        panel.hiddenMode = Widget.HiddenMode.Scale
        expect(widgets[0].hiddenMode).toEqual(Widget.HiddenMode.Display)
      })
    })
    describe("#tabsMovable", () => {
      it("should get whether tabs are movable", () => {
        const panel = new DockPanel()
        expect(panel.tabsMovable).toEqual(true)
      })
      it("should set tabsMovable of all tabs", () => {
        const panel = new DockPanel()
        const w1 = new Widget()
        const w2 = new Widget()
        panel.addWidget(w1)
        panel.addWidget(w2, { mode: "split-right", ref: w1 })
        for (const tabBar of panel.tabBars()) {
          expect(tabBar.tabsMovable).toEqual(true)
        }
        panel.tabsMovable = false
        for (const tabBar of panel.tabBars()) {
          expect(tabBar.tabsMovable).toEqual(false)
        }
      })
    })
  })
})
describe("../../src/lumino/widgets", () => {
  const _trackers: FocusTracker<Widget>[] = []
  const _widgets: Widget[] = []
  function createTracker(): FocusTracker<Widget> {
    const tracker = new FocusTracker<Widget>()
    _trackers.push(tracker)
    return tracker
  }
  function createWidget(): Widget {
    const widget = new Widget()
    widget.node.tabIndex = -1
    Widget.attach(widget, document.body)
    _widgets.push(widget)
    return widget
  }
  function focusWidget(widget: Widget): void {
    widget.node.focus()
    if (Platform.IS_IE) {
      widget.node.dispatchEvent(new FocusEvent("focus", { bubbles: true }))
    }
  }
  function blurWidget(widget: Widget): void {
    widget.node.blur()
    if (Platform.IS_IE) {
      widget.node.dispatchEvent(new FocusEvent("blur", { bubbles: true }))
    }
  }
  afterEach(() => {
    while (_trackers.length > 0) {
      _trackers.pop()!.dispose()
    }
    while (_widgets.length > 0) {
      _widgets.pop()!.dispose()
    }
  })
  describe("FocusTracker", () => {
    describe("#constructor()", () => {
      it("should create a FocusTracker", () => {
        const tracker = new FocusTracker<Widget>()
        expect(tracker).to.be.an.instanceof(FocusTracker)
      })
    })
    describe("#dispose()", () => {
      it("should dispose of the resources held by the tracker", () => {
        const tracker = new FocusTracker<Widget>()
        tracker.add(createWidget())
        tracker.dispose()
        expect(tracker.widgets.length).toEqual(0)
      })
      it("should be a no-op if already disposed", () => {
        const tracker = new FocusTracker<Widget>()
        tracker.dispose()
        tracker.dispose()
        expect(tracker.isDisposed).toEqual(true)
      })
    })
    describe("#currentChanged", () => {
      it("should be emitted when the current widget has changed", () => {
        const tracker = createTracker()
        const widget0 = createWidget()
        const widget1 = createWidget()
        tracker.add(widget0)
        tracker.add(widget1)
        focusWidget(widget0)
        let emitArgs: FocusTracker.IChangedArgs<Widget> | null = null
        tracker.currentChanged.connect((sender, args) => {
          emitArgs = args
        })
        focusWidget(widget1)
        expect(emitArgs).to.not.equal(null)
        expect(emitArgs!.oldValue).toEqual(widget0)
        expect(emitArgs!.newValue).toEqual(widget1)
      })
      it("should not be emitted when the current widget does not change", () => {
        const tracker = createTracker()
        const widget = createWidget()
        focusWidget(widget)
        tracker.add(widget)
        let emitArgs: FocusTracker.IChangedArgs<Widget> | null = null
        tracker.currentChanged.connect((sender, args) => {
          emitArgs = args
        })
        blurWidget(widget)
        focusWidget(widget)
        expect(emitArgs).toEqual(null)
      })
    })
    describe("#activeChanged", () => {
      it("should be emitted when the active widget has changed", () => {
        const tracker = createTracker()
        const widget0 = createWidget()
        const widget1 = createWidget()
        tracker.add(widget0)
        tracker.add(widget1)
        focusWidget(widget0)
        let emitArgs: FocusTracker.IChangedArgs<Widget> | null = null
        tracker.activeChanged.connect((sender, args) => {
          emitArgs = args
        })
        focusWidget(widget1)
        expect(emitArgs).to.not.equal(null)
        expect(emitArgs!.oldValue).toEqual(widget0)
        expect(emitArgs!.newValue).toEqual(widget1)
      })
      it("should be emitted when the active widget is set to null", () => {
        const tracker = createTracker()
        const widget = createWidget()
        focusWidget(widget)
        tracker.add(widget)
        let emitArgs: FocusTracker.IChangedArgs<Widget> | null = null
        tracker.activeChanged.connect((sender, args) => {
          emitArgs = args
        })
        blurWidget(widget)
        expect(emitArgs).to.not.equal(null)
        expect(emitArgs!.oldValue).toEqual(widget)
        expect(emitArgs!.newValue).toEqual(null)
      })
    })
    describe("#isDisposed", () => {
      it("should indicate whether the tracker is disposed", () => {
        const tracker = new FocusTracker<Widget>()
        expect(tracker.isDisposed).toEqual(false)
        tracker.dispose()
        expect(tracker.isDisposed).toEqual(true)
      })
    })
    describe("#currentWidget", () => {
      it("should get the current widget in the tracker", () => {
        const tracker = createTracker()
        const widget = createWidget()
        focusWidget(widget)
        tracker.add(widget)
        expect(tracker.currentWidget).toEqual(widget)
      })
      it("should not be updated when the current widget loses focus", () => {
        const tracker = createTracker()
        const widget = createWidget()
        focusWidget(widget)
        tracker.add(widget)
        expect(tracker.currentWidget).toEqual(widget)
        blurWidget(widget)
        expect(tracker.currentWidget).toEqual(widget)
      })
      it("should be set to the widget that gained focus", () => {
        const tracker = createTracker()
        const widget0 = createWidget()
        const widget1 = createWidget()
        focusWidget(widget0)
        tracker.add(widget0)
        tracker.add(widget1)
        expect(tracker.currentWidget).toEqual(widget0)
        focusWidget(widget1)
        expect(tracker.currentWidget).toEqual(widget1)
      })
      it("should revert to the previous widget if the current widget is removed", () => {
        const tracker = createTracker()
        const widget0 = createWidget()
        const widget1 = createWidget()
        focusWidget(widget0)
        tracker.add(widget0)
        tracker.add(widget1)
        focusWidget(widget1)
        expect(tracker.currentWidget).toEqual(widget1)
        widget1.dispose()
        expect(tracker.currentWidget).toEqual(widget0)
      })
      it("should be `null` if there is no current widget", () => {
        const tracker = createTracker()
        expect(tracker.currentWidget).toEqual(null)
        const widget = createWidget()
        focusWidget(widget)
        tracker.add(widget)
        expect(tracker.currentWidget).toEqual(widget)
        widget.dispose()
        expect(tracker.currentWidget).toEqual(null)
      })
    })
    describe("#activeWidget", () => {
      it("should get the active widget in the tracker", () => {
        const tracker = createTracker()
        const widget = createWidget()
        focusWidget(widget)
        tracker.add(widget)
        expect(tracker.activeWidget).toEqual(widget)
      })
      it("should be set to `null` when the active widget loses focus", () => {
        const tracker = createTracker()
        const widget = createWidget()
        focusWidget(widget)
        tracker.add(widget)
        expect(tracker.activeWidget).toEqual(widget)
        blurWidget(widget)
        expect(tracker.activeWidget).toEqual(null)
      })
      it("should be set to the widget that gained focus", () => {
        const tracker = createTracker()
        const widget0 = createWidget()
        const widget1 = createWidget()
        focusWidget(widget0)
        tracker.add(widget0)
        tracker.add(widget1)
        expect(tracker.activeWidget).toEqual(widget0)
        focusWidget(widget1)
        expect(tracker.activeWidget).toEqual(widget1)
      })
      it("should be `null` if there is no active widget", () => {
        const tracker = createTracker()
        expect(tracker.currentWidget).toEqual(null)
        const widget = createWidget()
        focusWidget(widget)
        tracker.add(widget)
        expect(tracker.activeWidget).toEqual(widget)
        widget.dispose()
        expect(tracker.activeWidget).toEqual(null)
      })
    })
    describe("#widgets", () => {
      it("should be a read-only sequence of the widgets being tracked", () => {
        const tracker = createTracker()
        expect(tracker.widgets.length).toEqual(0)
        const widget = createWidget()
        tracker.add(widget)
        expect(tracker.widgets.length).toEqual(1)
        expect(tracker.widgets[0]).toEqual(widget)
      })
    })
    describe("#focusNumber()", () => {
      it("should get the focus number for a particular widget in the tracker", () => {
        const tracker = createTracker()
        const widget = createWidget()
        focusWidget(widget)
        tracker.add(widget)
        expect(tracker.focusNumber(widget)).toEqual(0)
      })
      it("should give the highest number for the currentWidget", () => {
        const tracker = createTracker()
        const widget0 = createWidget()
        const widget1 = createWidget()
        focusWidget(widget0)
        tracker.add(widget0)
        tracker.add(widget1)
        focusWidget(widget1)
        expect(tracker.focusNumber(widget1)).toEqual(1)
        expect(tracker.focusNumber(widget0)).toEqual(0)
        focusWidget(widget0)
        expect(tracker.focusNumber(widget0)).toEqual(2)
      })
      it("should start a widget with a focus number of `-1`", () => {
        const tracker = createTracker()
        const widget = createWidget()
        tracker.add(widget)
        expect(tracker.focusNumber(widget)).toEqual(-1)
      })
      it("should update when a widget gains focus", () => {
        const tracker = createTracker()
        const widget0 = createWidget()
        const widget1 = createWidget()
        focusWidget(widget0)
        tracker.add(widget0)
        tracker.add(widget1)
        focusWidget(widget1)
        expect(tracker.focusNumber(widget0)).toEqual(0)
        focusWidget(widget0)
        expect(tracker.focusNumber(widget0)).toEqual(2)
      })
    })
    describe("#has()", () => {
      it("should test whether the focus tracker contains a given widget", () => {
        const tracker = createTracker()
        const widget = createWidget()
        expect(tracker.has(widget)).toEqual(false)
        tracker.add(widget)
        expect(tracker.has(widget)).toEqual(true)
      })
    })
    describe("#add()", () => {
      it("should add a widget to the focus tracker", () => {
        const tracker = createTracker()
        const widget = createWidget()
        tracker.add(widget)
        expect(tracker.has(widget)).toEqual(true)
      })
      it("should make the widget the currentWidget if focused", () => {
        const tracker = createTracker()
        const widget = createWidget()
        focusWidget(widget)
        tracker.add(widget)
        expect(tracker.currentWidget).toEqual(widget)
      })
      it("should remove the widget from the tracker after it has been disposed", () => {
        const tracker = createTracker()
        const widget = createWidget()
        tracker.add(widget)
        widget.dispose()
        expect(tracker.has(widget)).toEqual(false)
      })
      it("should be a no-op if the widget is already tracked", () => {
        const tracker = createTracker()
        const widget = createWidget()
        tracker.add(widget)
        tracker.add(widget)
        expect(tracker.has(widget)).toEqual(true)
      })
    })
    describe("#remove()", () => {
      it("should remove a widget from the focus tracker", () => {
        const tracker = createTracker()
        const widget = createWidget()
        tracker.add(widget)
        tracker.remove(widget)
        expect(tracker.has(widget)).toEqual(false)
      })
      it("should set the currentWidget to the previous one if the widget is the currentWidget", () => {
        const tracker = createTracker()
        const widget0 = createWidget()
        const widget1 = createWidget()
        const widget2 = createWidget()
        focusWidget(widget0)
        tracker.add(widget0)
        tracker.add(widget1)
        tracker.add(widget2)
        focusWidget(widget1)
        focusWidget(widget2)
        tracker.remove(widget2)
        expect(tracker.currentWidget).toEqual(widget1)
      })
      it("should be a no-op if the widget is not tracked", () => {
        const tracker = createTracker()
        const widget = createWidget()
        tracker.remove(widget)
        expect(tracker.has(widget)).toEqual(false)
      })
    })
  })
})
class LogLayout extends Layout {
  methods: string[] = []
  widgets = [new LogWidget(), new LogWidget()]
  dispose(): void {
    while (this.widgets.length !== 0) {
      this.widgets.pop()!.dispose()
    }
    super.dispose()
  }
  *[Symbol.iterator](): IterableIterator<Widget> {
    yield* this.widgets
  }
  removeWidget(widget: Widget): void {
    this.methods.push("removeWidget")
    ArrayExt.removeFirstOf(this.widgets, widget)
  }
  protected init(): void {
    this.methods.push("init")
    super.init()
  }
  protected onResize(msg: Widget.ResizeMessage): void {
    super.onResize(msg)
    this.methods.push("onResize")
  }
  protected onUpdateRequest(msg: Message): void {
    super.onUpdateRequest(msg)
    this.methods.push("onUpdateRequest")
  }
  protected onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg)
    this.methods.push("onAfterAttach")
  }
  protected onBeforeDetach(msg: Message): void {
    super.onBeforeDetach(msg)
    this.methods.push("onBeforeDetach")
  }
  protected onAfterShow(msg: Message): void {
    super.onAfterShow(msg)
    this.methods.push("onAfterShow")
  }
  protected onBeforeHide(msg: Message): void {
    super.onBeforeHide(msg)
    this.methods.push("onBeforeHide")
  }
  protected onFitRequest(msg: Widget.ChildMessage): void {
    super.onFitRequest(msg)
    this.methods.push("onFitRequest")
  }
  protected onChildShown(msg: Widget.ChildMessage): void {
    super.onChildShown(msg)
    this.methods.push("onChildShown")
  }
  protected onChildHidden(msg: Widget.ChildMessage): void {
    super.onChildHidden(msg)
    this.methods.push("onChildHidden")
  }
}
describe("../../src/lumino/widgets", () => {
  describe("Layout", () => {
    describe("[Symbol.iterator]()", () => {
      it("should create an iterator over the widgets in the layout", () => {
        const layout = new LogLayout()
        expect(every(layout, child => child instanceof Widget)).toEqual(true)
      })
    })
    describe("#removeWidget()", () => {
      it("should be invoked when a child widget's `parent` property is set to `null`", () => {
        const parent = new Widget()
        const layout = new LogLayout()
        parent.layout = layout
        layout.widgets[0].parent = null
        expect(layout.methods).to.contain("removeWidget")
      })
    })
    describe("#dispose()", () => {
      it("should dispose of the resource held by the layout", () => {
        const widget = new Widget()
        const layout = new LogLayout()
        widget.layout = layout
        layout.dispose()
        expect(layout.parent).toEqual(null)
        expect(every(widget.children(), w => w.isDisposed)).toEqual(true)
      })
      it("should be called automatically when the parent is disposed", () => {
        const widget = new Widget()
        const layout = new LogLayout()
        widget.layout = layout
        widget.dispose()
        expect(layout.parent).toEqual(null)
        expect(layout.isDisposed).toEqual(true)
      })
    })
    describe("#isDisposed", () => {
      it("should test whether the layout is disposed", () => {
        const layout = new LogLayout()
        expect(layout.isDisposed).toEqual(false)
        layout.dispose()
        expect(layout.isDisposed).toEqual(true)
      })
    })
    describe("#parent", () => {
      it("should get the parent widget of the layout", () => {
        const layout = new LogLayout()
        const parent = new Widget()
        parent.layout = layout
        expect(layout.parent).toEqual(parent)
      })
      it("should throw an error if set to `null`", () => {
        const layout = new LogLayout()
        const parent = new Widget()
        parent.layout = layout
        expect(() => {
          layout.parent = null
        }).to.throw(Error)
      })
      it("should throw an error if set to a different value", () => {
        const layout = new LogLayout()
        const parent = new Widget()
        parent.layout = layout
        expect(() => {
          layout.parent = new Widget()
        }).to.throw(Error)
      })
      it("should be a no-op if the parent is set to the same value", () => {
        const layout = new LogLayout()
        const parent = new Widget()
        parent.layout = layout
        layout.parent = parent
        expect(layout.parent).toEqual(parent)
      })
    })
    describe("#init()", () => {
      it("should be invoked when the layout is installed on its parent widget", () => {
        const widget = new Widget()
        const layout = new LogLayout()
        widget.layout = layout
        expect(layout.methods).to.contain("init")
      })
      it("should reparent the child widgets", () => {
        const widget = new Widget()
        const layout = new LogLayout()
        widget.layout = layout
        expect(every(layout, child => child.parent === widget)).toEqual(true)
      })
    })
    describe("#onResize()", () => {
      it("should be invoked on a `resize` message", () => {
        const layout = new LogLayout()
        const parent = new Widget()
        parent.layout = layout
        MessageLoop.sendMessage(parent, Widget.ResizeMessage.UnknownSize)
        expect(layout.methods).to.contain("onResize")
      })
      it("should send a `resize` message to each of the widgets in the layout", () => {
        const layout = new LogLayout()
        const parent = new Widget()
        parent.layout = layout
        MessageLoop.sendMessage(parent, Widget.ResizeMessage.UnknownSize)
        expect(layout.methods).to.contain("onResize")
        expect(layout.widgets[0].methods).to.contain("onResize")
        expect(layout.widgets[1].methods).to.contain("onResize")
      })
    })
    describe("#onUpdateRequest()", () => {
      it("should be invoked on an `update-request` message", () => {
        const layout = new LogLayout()
        const parent = new Widget()
        parent.layout = layout
        MessageLoop.sendMessage(parent, Widget.Msg.UpdateRequest)
        expect(layout.methods).to.contain("onUpdateRequest")
      })
      it("should send a `resize` message to each of the widgets in the layout", () => {
        const layout = new LogLayout()
        const parent = new Widget()
        parent.layout = layout
        MessageLoop.sendMessage(parent, Widget.Msg.UpdateRequest)
        expect(layout.methods).to.contain("onUpdateRequest")
        expect(layout.widgets[0].methods).to.contain("onResize")
        expect(layout.widgets[1].methods).to.contain("onResize")
      })
    })
    describe("#onAfterAttach()", () => {
      it("should be invoked on an `after-attach` message", () => {
        const layout = new LogLayout()
        const parent = new Widget()
        parent.layout = layout
        MessageLoop.sendMessage(parent, Widget.Msg.AfterAttach)
        expect(layout.methods).to.contain("onAfterAttach")
      })
      it("should send an `after-attach` message to each of the widgets in the layout", () => {
        const layout = new LogLayout()
        const parent = new Widget()
        parent.layout = layout
        MessageLoop.sendMessage(parent, Widget.Msg.AfterAttach)
        expect(layout.methods).to.contain("onAfterAttach")
        expect(layout.widgets[0].methods).to.contain("onAfterAttach")
        expect(layout.widgets[1].methods).to.contain("onAfterAttach")
      })
    })
    describe("#onBeforeDetach()", () => {
      it("should be invoked on an `before-detach` message", () => {
        const layout = new LogLayout()
        const parent = new Widget()
        parent.layout = layout
        MessageLoop.sendMessage(parent, Widget.Msg.BeforeDetach)
        expect(layout.methods).to.contain("onBeforeDetach")
      })
      it("should send a `before-detach` message to each of the widgets in the layout", () => {
        const layout = new LogLayout()
        const parent = new Widget()
        parent.layout = layout
        MessageLoop.sendMessage(parent, Widget.Msg.BeforeDetach)
        expect(layout.methods).to.contain("onBeforeDetach")
        expect(layout.widgets[0].methods).to.contain("onBeforeDetach")
        expect(layout.widgets[1].methods).to.contain("onBeforeDetach")
      })
    })
    describe("#onAfterShow()", () => {
      it("should be invoked on an `after-show` message", () => {
        const layout = new LogLayout()
        const parent = new Widget()
        parent.layout = layout
        MessageLoop.sendMessage(parent, Widget.Msg.AfterShow)
        expect(layout.methods).to.contain("onAfterShow")
      })
      it("should send an `after-show` message to non hidden of the widgets in the layout", () => {
        const layout = new LogLayout()
        const parent = new Widget()
        parent.layout = layout
        layout.widgets[0].hide()
        MessageLoop.sendMessage(parent, Widget.Msg.AfterShow)
        expect(layout.methods).to.contain("onAfterShow")
        expect(layout.widgets[0].methods).to.not.contain("onAfterShow")
        expect(layout.widgets[1].methods).to.contain("onAfterShow")
      })
    })
    describe("#onBeforeHide()", () => {
      it("should be invoked on a `before-hide` message", () => {
        const layout = new LogLayout()
        const parent = new Widget()
        parent.layout = layout
        MessageLoop.sendMessage(parent, Widget.Msg.BeforeHide)
        expect(layout.methods).to.contain("onBeforeHide")
      })
      it("should send a `before-hide` message to non hidden of the widgets in the layout", () => {
        const layout = new LogLayout()
        const parent = new Widget()
        parent.layout = layout
        layout.widgets[0].hide()
        MessageLoop.sendMessage(parent, Widget.Msg.BeforeHide)
        expect(layout.methods).to.contain("onBeforeHide")
        expect(layout.widgets[0].methods).to.not.contain("onBeforeHide")
        expect(layout.widgets[1].methods).to.contain("onBeforeHide")
      })
    })
    describe("#onFitRequest()", () => {
      it("should be invoked on an `fit-request` message", () => {
        const layout = new LogLayout()
        const parent = new Widget()
        parent.layout = layout
        MessageLoop.sendMessage(parent, Widget.Msg.FitRequest)
        expect(layout.methods).to.contain("onFitRequest")
      })
    })
    describe("#onChildShown()", () => {
      it("should be invoked on an `child-shown` message", () => {
        const layout = new LogLayout()
        const parent = new Widget()
        parent.layout = layout
        const msg = new Widget.ChildMessage("child-shown", new Widget())
        MessageLoop.sendMessage(parent, msg)
        expect(layout.methods).to.contain("onChildShown")
      })
    })
    describe("#onChildHidden()", () => {
      it("should be invoked on an `child-hidden` message", () => {
        const layout = new LogLayout()
        const parent = new Widget()
        parent.layout = layout
        const msg = new Widget.ChildMessage("child-hidden", new Widget())
        MessageLoop.sendMessage(parent, msg)
        expect(layout.methods).to.contain("onChildHidden")
      })
    })
  })
})
class LogMenu extends Menu {
  events: string[] = []
  methods: string[] = []
  handleEvent(event: Event): void {
    super.handleEvent(event)
    this.events.push(event.type)
  }
  protected onBeforeAttach(msg: Message): void {
    super.onBeforeAttach(msg)
    this.methods.push("onBeforeAttach")
  }
  protected onAfterDetach(msg: Message): void {
    super.onAfterDetach(msg)
    this.methods.push("onAfterDetach")
  }
  protected onActivateRequest(msg: Message): void {
    super.onActivateRequest(msg)
    this.methods.push("onActivateRequest")
  }
  protected onUpdateRequest(msg: Message): void {
    super.onUpdateRequest(msg)
    this.methods.push("onUpdateRequest")
  }
  protected onCloseRequest(msg: Message): void {
    super.onCloseRequest(msg)
    this.methods.push("onCloseRequest")
  }
}
const bubbles = true
describe("../../src/lumino/widgets", () => {
  const commands = new CommandRegistry()
  let logMenu: LogMenu = null!
  let menu: Menu = null!
  let executed = ""
  const iconClass = "foo"
  const iconRenderer = {
    render: (host: HTMLElement, options?: any) => {
      const renderNode = document.createElement("div")
      host.classList.add(iconClass)
      host.appendChild(renderNode)
    },
  }
  before(() => {
    commands.addCommand("test", {
      execute: (args: JSONObject) => {
        executed = "test"
      },
      label: "Test Label",
      icon: iconRenderer,
      iconClass,
      caption: "Test Caption",
      className: "testClass",
      mnemonic: 0,
    })
    commands.addCommand("test-toggled", {
      execute: (args: JSONObject) => {
        executed = "test-toggled"
      },
      label: "Test Toggled Label",
      icon: iconRenderer,
      className: "testClass",
      isToggled: (args: JSONObject) => true,
      mnemonic: 6,
    })
    commands.addCommand("test-disabled", {
      execute: (args: JSONObject) => {
        executed = "test-disabled"
      },
      label: "Test Disabled Label",
      icon: iconRenderer,
      className: "testClass",
      isEnabled: (args: JSONObject) => false,
      mnemonic: 5,
    })
    commands.addCommand("test-hidden", {
      execute: (args: JSONObject) => {
        executed = "test-hidden"
      },
      label: "Hidden Label",
      icon: iconRenderer,
      className: "testClass",
      isVisible: (args: JSONObject) => false,
    })
    commands.addCommand("test-zenith", {
      execute: (args: JSONObject) => {
        executed = "test-zenith"
      },
      label: "Zenith Label",
      icon: iconRenderer,
      className: "testClass",
    })
    commands.addKeyBinding({
      keys: ["Ctrl T"],
      selector: "body",
      command: "test",
    })
  })
  beforeEach(() => {
    executed = ""
    menu = new Menu({ commands })
    logMenu = new LogMenu({ commands })
  })
  afterEach(() => {
    menu.dispose()
    logMenu.dispose()
  })
  describe("Menu", () => {
    describe("#constructor()", () => {
      it("should take options for initializing the menu", () => {
        const menu = new Menu({ commands })
        expect(menu).to.be.an.instanceof(Menu)
      })
      it("should add the `lm-Menu` class", () => {
        const menu = new Menu({ commands })
        expect(menu.hasClass("lm-Menu")).toEqual(true)
      })
    })
    describe("#dispose()", () => {
      it("should dispose of the resources held by the menu", () => {
        menu.addItem({})
        expect(menu.items.length).toEqual(1)
        menu.dispose()
        expect(menu.items.length).toEqual(0)
        expect(menu.isDisposed).toEqual(true)
      })
    })
    describe("#aboutToClose", () => {
      it("should be emitted just before the menu is closed", () => {
        let called = false
        menu.open(0, 0)
        menu.aboutToClose.connect((sender, args) => {
          called = true
        })
        menu.close()
        expect(called).toEqual(true)
      })
      it("should not be emitted if the menu is not attached", () => {
        let called = false
        menu.open(0, 0)
        menu.aboutToClose.connect(() => {
          called = true
        })
        Widget.detach(menu)
        menu.close()
        expect(called).toEqual(false)
      })
    })
    describe("menuRequested", () => {
      it("should be emitted when a left arrow key is pressed and a submenu cannot be opened or closed", () => {
        let called = false
        menu.open(0, 0)
        menu.menuRequested.connect((sender, args) => {
          expect(args).toEqual("previous")
          called = true
        })
        menu.node.dispatchEvent(
          new KeyboardEvent("keydown", {
            bubbles,
            keyCode: 37, // Left arrow
          })
        )
        expect(called).toEqual(true)
      })
      it("should be emitted when a right arrow key is pressed and a submenu cannot be opened or closed", () => {
        let called = false
        menu.open(0, 0)
        menu.menuRequested.connect((sender, args) => {
          expect(args).toEqual("next")
          called = true
        })
        menu.node.dispatchEvent(
          new KeyboardEvent("keydown", {
            bubbles,
            keyCode: 39, // Right arrow
          })
        )
        expect(called).toEqual(true)
      })
      it("should only be emitted for the root menu in a hierarchy", () => {
        const submenu = new Menu({ commands })
        const item = menu.addItem({ type: "submenu", submenu })
        menu.open(0, 0)
        menu.activeItem = item
        menu.triggerActiveItem()
        let called = false
        let submenuCalled = false
        menu.menuRequested.connect((sender, args) => {
          expect(args).toEqual("next")
          called = true
        })
        submenu.menuRequested.connect(() => {
          submenuCalled = true
        })
        submenu.node.dispatchEvent(
          new KeyboardEvent("keydown", {
            bubbles,
            keyCode: 39, // Right arrow
          })
        )
        expect(called).toEqual(true)
        expect(submenuCalled).toEqual(false)
      })
    })
    describe("#commands", () => {
      it("should be the command registry for the menu", () => {
        expect(menu.commands).toEqual(commands)
      })
    })
    describe("#renderer", () => {
      it("should default to the default renderer", () => {
        expect(menu.renderer).toEqual(Menu.defaultRenderer)
      })
      it("should be the renderer for the menu", () => {
        const renderer = Object.create(Menu.defaultRenderer)
        const menu = new Menu({ commands, renderer })
        expect(menu.renderer).toEqual(renderer)
      })
    })
    describe("#parentMenu", () => {
      it("should get the parent menu of the menu", () => {
        const submenu = new Menu({ commands })
        const item = menu.addItem({ type: "submenu", submenu })
        menu.open(0, 0)
        menu.activeItem = item
        menu.triggerActiveItem()
        expect(submenu.parentMenu).toEqual(menu)
      })
      it("should be `null` if the menu is not an open submenu", () => {
        const submenu = new Menu({ commands })
        menu.addItem({ type: "submenu", submenu })
        menu.open(0, 0)
        expect(submenu.parentMenu).toEqual(null)
        expect(menu.parentMenu).toEqual(null)
      })
    })
    describe("#childMenu", () => {
      it("should get the child menu of the menu", () => {
        const submenu = new Menu({ commands })
        const item = menu.addItem({ type: "submenu", submenu })
        menu.open(0, 0)
        menu.activeItem = item
        menu.triggerActiveItem()
        expect(menu.childMenu).toEqual(submenu)
      })
      it("should be `null` if the menu does not have an open submenu", () => {
        const submenu = new Menu({ commands })
        menu.addItem({ type: "submenu", submenu })
        menu.open(0, 0)
        expect(menu.childMenu).toEqual(null)
      })
    })
    describe("#rootMenu", () => {
      it("should get the root menu of the menu hierarchy", () => {
        const submenu1 = new Menu({ commands })
        const submenu2 = new Menu({ commands })
        const item1 = menu.addItem({ type: "submenu", submenu: submenu1 })
        const item2 = submenu1.addItem({ type: "submenu", submenu: submenu2 })
        menu.open(0, 0)
        menu.activeItem = item1
        menu.triggerActiveItem()
        submenu1.activeItem = item2
        submenu1.triggerActiveItem()
        expect(submenu2.rootMenu).toEqual(menu)
      })
      it("should be itself if the menu is not an open submenu", () => {
        const submenu1 = new Menu({ commands })
        const submenu2 = new Menu({ commands })
        menu.addItem({ type: "submenu", submenu: submenu1 })
        submenu1.addItem({ type: "submenu", submenu: submenu2 })
        menu.open(0, 0)
        expect(menu.rootMenu).toEqual(menu)
        expect(submenu1.rootMenu).toEqual(submenu1)
        expect(submenu2.rootMenu).toEqual(submenu2)
      })
    })
    describe("#leafMenu", () => {
      it("should get the leaf menu of the menu hierarchy", () => {
        const submenu1 = new Menu({ commands })
        const submenu2 = new Menu({ commands })
        const item1 = menu.addItem({ type: "submenu", submenu: submenu1 })
        const item2 = submenu1.addItem({ type: "submenu", submenu: submenu2 })
        menu.open(0, 0)
        menu.activeItem = item1
        menu.triggerActiveItem()
        submenu1.activeItem = item2
        submenu1.triggerActiveItem()
        expect(menu.leafMenu).toEqual(submenu2)
      })
      it("should be itself if the menu does not have an open submenu", () => {
        const submenu1 = new Menu({ commands })
        const submenu2 = new Menu({ commands })
        menu.addItem({ type: "submenu", submenu: submenu1 })
        submenu1.addItem({ type: "submenu", submenu: submenu2 })
        menu.open(0, 0)
        expect(menu.leafMenu).toEqual(menu)
        expect(submenu1.leafMenu).toEqual(submenu1)
        expect(submenu2.leafMenu).toEqual(submenu2)
      })
    })
    describe("#contentNode", () => {
      it("should get the menu content node", () => {
        const content = menu.contentNode
        expect(content.classList.contains("lm-Menu-content")).toEqual(true)
      })
    })
    describe("#activeItem", () => {
      it("should get the currently active menu item", () => {
        const item = menu.addItem({ command: "test" })
        menu.activeIndex = 0
        expect(menu.activeItem).toEqual(item)
      })
      it("should be `null` if no menu item is active", () => {
        expect(menu.activeItem).toEqual(null)
        menu.addItem({ command: "test" })
        expect(menu.activeItem).toEqual(null)
      })
      it("should set the currently active menu item", () => {
        expect(menu.activeItem).toEqual(null)
        const item = (menu.activeItem = menu.addItem({ command: "test" }))
        expect(menu.activeItem).toEqual(item)
      })
      it("should set to `null` if the item cannot be activated", () => {
        expect(menu.activeItem).toEqual(null)
        menu.activeItem = menu.addItem({ command: "test-disabled" })
        expect(menu.activeItem).toEqual(null)
      })
    })
    describe("#activeIndex", () => {
      it("should get the index of the currently active menu item", () => {
        menu.activeItem = menu.addItem({ command: "test" })
        expect(menu.activeIndex).toEqual(0)
      })
      it("should be `-1` if no menu item is active", () => {
        expect(menu.activeIndex).toEqual(-1)
        menu.addItem({ command: "test" })
        expect(menu.activeIndex).toEqual(-1)
      })
      it("should set the currently active menu item index", () => {
        expect(menu.activeIndex).toEqual(-1)
        menu.addItem({ command: "test" })
        menu.activeIndex = 0
        expect(menu.activeIndex).toEqual(0)
      })
      it("should set to `-1` if the item cannot be activated", () => {
        menu.addItem({ command: "test-disabled" })
        menu.activeIndex = 0
        expect(menu.activeIndex).toEqual(-1)
      })
    })
    describe("#items", () => {
      it("should be a read-only array of the menu items in the menu", () => {
        const item1 = menu.addItem({ command: "foo" })
        const item2 = menu.addItem({ command: "bar" })
        expect(menu.items).to.deep.equal([item1, item2])
      })
    })
    describe("#activateNextItem()", () => {
      it("should activate the next selectable item in the menu", () => {
        menu.addItem({ command: "test-disabled" })
        menu.addItem({ command: "test" })
        menu.activateNextItem()
        expect(menu.activeIndex).toEqual(1)
      })
      it("should set the index to `-1` if no item is selectable", () => {
        menu.addItem({ command: "test-disabled" })
        menu.addItem({ type: "separator" })
        menu.activateNextItem()
        expect(menu.activeIndex).toEqual(-1)
      })
    })
    describe("#activatePreviousItem()", () => {
      it("should activate the next selectable item in the menu", () => {
        menu.addItem({ command: "test" })
        menu.addItem({ command: "test-disabled" })
        menu.activatePreviousItem()
        expect(menu.activeIndex).toEqual(0)
      })
      it("should set the index to `-1` if no item is selectable", () => {
        menu.addItem({ command: "test-disabled" })
        menu.addItem({ type: "separator" })
        menu.activatePreviousItem()
        expect(menu.activeIndex).toEqual(-1)
      })
    })
    describe("#triggerActiveItem()", () => {
      it("should execute a command if it is the active item", () => {
        menu.addItem({ command: "test" })
        menu.open(0, 0)
        menu.activeIndex = 0
        menu.triggerActiveItem()
        expect(executed).toEqual("test")
      })
      it("should open a submenu and activate the first item", () => {
        const submenu = new Menu({ commands })
        submenu.addItem({ command: "test" })
        menu.addItem({ type: "submenu", submenu })
        menu.open(0, 0)
        menu.activeIndex = 0
        menu.triggerActiveItem()
        expect(submenu.parentMenu).toEqual(menu)
        expect(submenu.activeIndex).toEqual(0)
      })
      it("should be a no-op if the menu is not attached", () => {
        const submenu = new Menu({ commands })
        submenu.addItem({ command: "test" })
        menu.addItem({ type: "submenu", submenu })
        menu.activeIndex = 0
        menu.triggerActiveItem()
        expect(submenu.parentMenu).toEqual(null)
        expect(submenu.activeIndex).toEqual(-1)
      })
      it("should be a no-op if there is no active item", () => {
        const submenu = new Menu({ commands })
        submenu.addItem({ command: "test" })
        menu.addItem({ type: "submenu", submenu })
        menu.open(0, 0)
        menu.triggerActiveItem()
        expect(submenu.parentMenu).toEqual(null)
        expect(submenu.activeIndex).toEqual(-1)
      })
    })
    describe("#addItem()", () => {
      it("should add a menu item to the end of the menu", () => {
        menu.addItem({})
        const item = menu.addItem({ command: "test" })
        expect(menu.items[1]).toEqual(item)
      })
    })
    describe("#insertItem()", () => {
      it("should insert a menu item into the menu at the specified index", () => {
        const item1 = menu.insertItem(0, { command: "test" })
        const item2 = menu.insertItem(0, { command: "test-disabled" })
        const item3 = menu.insertItem(0, { command: "test-toggled" })
        expect(menu.items[0]).toEqual(item3)
        expect(menu.items[1]).toEqual(item2)
        expect(menu.items[2]).toEqual(item1)
      })
      it("should clamp the index to the bounds of the items", () => {
        const item1 = menu.insertItem(0, { command: "test" })
        const item2 = menu.insertItem(10, { command: "test-disabled" })
        const item3 = menu.insertItem(-10, { command: "test-toggled" })
        expect(menu.items[0]).toEqual(item3)
        expect(menu.items[1]).toEqual(item1)
        expect(menu.items[2]).toEqual(item2)
      })
      it("should close the menu if attached", () => {
        menu.open(0, 0)
        expect(menu.isAttached).toEqual(true)
        menu.insertItem(0, { command: "test" })
        expect(menu.isAttached).toEqual(false)
      })
    })
    describe("#removeItem()", () => {
      it("should remove a menu item from the menu by value", () => {
        menu.removeItem(menu.addItem({ command: "test" }))
        expect(menu.items.length).toEqual(0)
      })
      it("should close the menu if it is attached", () => {
        const item = menu.addItem({ command: "test" })
        menu.open(0, 0)
        expect(menu.isAttached).toEqual(true)
        menu.removeItem(item)
        expect(menu.isAttached).toEqual(false)
      })
    })
    describe("#removeItemAt()", () => {
      it("should remove a menu item from the menu by index", () => {
        menu.addItem({ command: "test" })
        menu.removeItemAt(0)
        expect(menu.items.length).toEqual(0)
      })
      it("should close the menu if it is attached", () => {
        menu.addItem({ command: "test" })
        menu.open(0, 0)
        expect(menu.isAttached).toEqual(true)
        menu.removeItemAt(0)
        expect(menu.isAttached).toEqual(false)
      })
    })
    describe("#clearItems()", () => {
      it("should remove all items from the menu", () => {
        menu.addItem({ command: "test-disabled" })
        menu.addItem({ command: "test" })
        menu.activeIndex = 1
        menu.clearItems()
        expect(menu.items.length).toEqual(0)
        expect(menu.activeIndex).toEqual(-1)
      })
      it("should close the menu if it is attached", () => {
        menu.addItem({ command: "test-disabled" })
        menu.addItem({ command: "test" })
        menu.open(0, 0)
        expect(menu.isAttached).toEqual(true)
        menu.clearItems()
        expect(menu.isAttached).toEqual(false)
      })
    })
    describe("#open()", () => {
      it("should open the menu at the specified location", () => {
        menu.addItem({ command: "test" })
        menu.open(10, 10)
        expect(menu.node.style.left).toEqual("10px")
        expect(menu.node.style.top).toEqual("10px")
      })
      it("should be adjusted to fit naturally on the screen", () => {
        menu.addItem({ command: "test" })
        menu.open(-10, 10000)
        expect(menu.node.style.left).toEqual("0px")
        expect(menu.node.style.top).to.not.equal("10000px")
      })
      it("should accept flags to force the location", () => {
        menu.addItem({ command: "test" })
        menu.open(10000, 10000, { forceX: true, forceY: true })
        expect(menu.node.style.left).toEqual("10000px")
        expect(menu.node.style.top).toEqual("10000px")
      })
      it("should bail if already attached", () => {
        menu.addItem({ command: "test" })
        menu.open(10, 10)
        menu.open(100, 100)
        expect(menu.node.style.left).toEqual("10px")
        expect(menu.node.style.top).toEqual("10px")
      })
    })
    describe("#handleEvent()", () => {
      context("keydown", () => {
        it("should trigger the active item on enter", () => {
          menu.addItem({ command: "test" })
          menu.activeIndex = 0
          menu.open(0, 0)
          menu.node.dispatchEvent(
            new KeyboardEvent("keydown", {
              bubbles,
              keyCode: 13, // Enter
            })
          )
          expect(executed).toEqual("test")
        })
        it("should close the menu on escape", () => {
          menu.open(0, 0)
          expect(menu.isAttached).toEqual(true)
          menu.node.dispatchEvent(
            new KeyboardEvent("keydown", {
              bubbles,
              keyCode: 27, // Escape
            })
          )
          expect(menu.isAttached).toEqual(false)
        })
        it("should close the menu on left arrow if there is a parent menu", () => {
          const submenu = new Menu({ commands })
          submenu.addItem({ command: "test" })
          menu.addItem({ type: "submenu", submenu })
          menu.open(0, 0)
          menu.activateNextItem()
          menu.triggerActiveItem()
          expect(menu.childMenu).toEqual(submenu)
          submenu.node.dispatchEvent(
            new KeyboardEvent("keydown", {
              bubbles,
              keyCode: 37, // Left arrow
            })
          )
          expect(menu.childMenu).toEqual(null)
        })
        it("should activate the previous item on up arrow", () => {
          menu.addItem({ command: "test" })
          menu.addItem({ command: "test" })
          menu.addItem({ command: "test" })
          menu.open(0, 0)
          menu.node.dispatchEvent(
            new KeyboardEvent("keydown", {
              bubbles,
              keyCode: 38, // Up arrow
            })
          )
          expect(menu.activeIndex).toEqual(2)
        })
        it("should trigger the active item on right arrow if the item is a submenu", () => {
          const submenu = new Menu({ commands })
          submenu.addItem({ command: "test" })
          menu.addItem({ type: "submenu", submenu })
          menu.open(0, 0)
          menu.activateNextItem()
          expect(menu.childMenu).toEqual(null)
          menu.node.dispatchEvent(
            new KeyboardEvent("keydown", {
              bubbles,
              keyCode: 39, // Right arrow
            })
          )
          expect(menu.childMenu).toEqual(submenu)
        })
        it("should activate the next item on down arrow", () => {
          menu.addItem({ command: "test" })
          menu.addItem({ command: "test" })
          menu.open(0, 0)
          menu.node.dispatchEvent(
            new KeyboardEvent("keydown", {
              bubbles,
              keyCode: 40, // Down arrow
            })
          )
          expect(menu.activeIndex).toEqual(0)
        })
        it("should activate the first matching mnemonic", () => {
          const submenu1 = new Menu({ commands })
          submenu1.title.label = "foo"
          submenu1.title.mnemonic = 0
          submenu1.addItem({ command: "test" })
          const submenu2 = new Menu({ commands })
          submenu2.title.label = "bar"
          submenu2.title.mnemonic = 0
          submenu2.addItem({ command: "test" })
          menu.addItem({ type: "submenu", submenu: submenu1 })
          menu.addItem({ type: "separator" })
          menu.addItem({ type: "submenu", submenu: submenu2 })
          menu.open(0, 0)
          menu.node.dispatchEvent(
            new KeyboardEvent("keydown", {
              bubbles,
              keyCode: 70, // `F` key
            })
          )
          expect(menu.activeIndex).toEqual(0)
        })
        it("should activate an item with no matching mnemonic, but matching first character", () => {
          menu.addItem({ command: "test" })
          menu.addItem({ command: "test-disabled" })
          menu.addItem({ command: "test-toggled" })
          menu.addItem({ command: "test-hidden" })
          menu.addItem({ command: "test-zenith" })
          menu.open(0, 0)
          expect(menu.activeIndex).toEqual(-1)
          menu.node.dispatchEvent(
            new KeyboardEvent("keydown", {
              bubbles,
              keyCode: 90, // `Z` key
            })
          )
          expect(menu.activeIndex).toEqual(4)
        })
      })
      context("mouseup", () => {
        it("should trigger the active item", () => {
          menu.addItem({ command: "test" })
          menu.activeIndex = 0
          menu.open(0, 0)
          menu.node.dispatchEvent(new MouseEvent("mouseup", { bubbles }))
          expect(executed).toEqual("test")
        })
        it("should bail if not a left mouse button", () => {
          menu.addItem({ command: "test" })
          menu.activeIndex = 0
          menu.open(0, 0)
          menu.node.dispatchEvent(
            new MouseEvent("mouseup", {
              bubbles,
              button: 1,
            })
          )
          expect(executed).toEqual("")
        })
      })
      context("mousemove", () => {
        it("should set the active index", () => {
          menu.addItem({ command: "test" })
          menu.open(0, 0)
          const node = menu.node.getElementsByClassName("lm-Menu-item")[0]
          const rect = node.getBoundingClientRect()
          menu.node.dispatchEvent(
            new MouseEvent("mousemove", {
              bubbles,
              clientX: rect.left,
              clientY: rect.top,
            })
          )
          expect(menu.activeIndex).toEqual(0)
        })
        it("should open a child menu after a timeout", done => {
          const submenu = new Menu({ commands })
          submenu.addItem({ command: "test" })
          submenu.title.label = "Test Label"
          menu.addItem({ type: "submenu", submenu })
          menu.open(0, 0)
          const node = menu.node.getElementsByClassName("lm-Menu-item")[0]
          const rect = node.getBoundingClientRect()
          menu.node.dispatchEvent(
            new MouseEvent("mousemove", {
              bubbles,
              clientX: rect.left,
              clientY: rect.top,
            })
          )
          expect(menu.activeIndex).toEqual(0)
          expect(submenu.isAttached).toEqual(false)
          setTimeout(() => {
            expect(submenu.isAttached).toEqual(true)
            done()
          }, 500)
        })
        it("should close an open sub menu", done => {
          const submenu = new Menu({ commands })
          submenu.addItem({ command: "test" })
          submenu.title.label = "Test Label"
          menu.addItem({ command: "test" })
          menu.addItem({ type: "submenu", submenu })
          menu.open(0, 0)
          menu.activeIndex = 1
          menu.triggerActiveItem()
          const node = menu.node.getElementsByClassName("lm-Menu-item")[0]
          const rect = node.getBoundingClientRect()
          menu.node.dispatchEvent(
            new MouseEvent("mousemove", {
              bubbles,
              clientX: rect.left,
              clientY: rect.top,
            })
          )
          expect(menu.activeIndex).toEqual(0)
          expect(submenu.isAttached).toEqual(true)
          setTimeout(() => {
            expect(submenu.isAttached).toEqual(false)
            done()
          }, 500)
        })
      })
      context("mouseleave", () => {
        it("should reset the active index", () => {
          const submenu = new Menu({ commands })
          submenu.addItem({ command: "test" })
          submenu.title.label = "Test Label"
          menu.addItem({ type: "submenu", submenu })
          menu.open(0, 0)
          const node = menu.node.getElementsByClassName("lm-Menu-item")[0]
          const rect = node.getBoundingClientRect()
          menu.node.dispatchEvent(
            new MouseEvent("mousemove", {
              bubbles,
              clientX: rect.left,
              clientY: rect.top,
            })
          )
          expect(menu.activeIndex).toEqual(0)
          menu.node.dispatchEvent(
            new MouseEvent("mouseleave", {
              bubbles,
              clientX: rect.left,
              clientY: rect.top,
            })
          )
          expect(menu.activeIndex).toEqual(-1)
          menu.dispose()
        })
      })
      context("mousedown", () => {
        it("should not close the menu if on a child node", () => {
          menu.addItem({ command: "test" })
          menu.open(0, 0)
          expect(menu.isAttached).toEqual(true)
          const rect = menu.node.getBoundingClientRect()
          menu.node.dispatchEvent(
            new MouseEvent("mousedown", {
              bubbles,
              clientX: rect.left,
              clientY: rect.top,
            })
          )
          expect(menu.isAttached).toEqual(true)
        })
        it("should close the menu if not on a child node", () => {
          menu.addItem({ command: "test" })
          menu.open(0, 0)
          expect(menu.isAttached).toEqual(true)
          menu.node.dispatchEvent(
            new MouseEvent("mousedown", {
              bubbles,
              clientX: -10,
            })
          )
          expect(menu.isAttached).toEqual(false)
        })
      })
    })
    describe("#onBeforeAttach()", () => {
      it("should add event listeners", () => {
        const node = logMenu.node
        logMenu.open(0, 0)
        expect(logMenu.methods).to.contain("onBeforeAttach")
        node.dispatchEvent(new KeyboardEvent("keydown", { bubbles }))
        expect(logMenu.events).to.contain("keydown")
        node.dispatchEvent(new MouseEvent("mouseup", { bubbles }))
        expect(logMenu.events).to.contain("mouseup")
        node.dispatchEvent(new MouseEvent("mousemove", { bubbles }))
        expect(logMenu.events).to.contain("mousemove")
        node.dispatchEvent(new MouseEvent("mouseenter", { bubbles }))
        expect(logMenu.events).to.contain("mouseenter")
        node.dispatchEvent(new MouseEvent("mouseleave", { bubbles }))
        expect(logMenu.events).to.contain("mouseleave")
        node.dispatchEvent(new MouseEvent("contextmenu", { bubbles }))
        expect(logMenu.events).to.contain("contextmenu")
        document.body.dispatchEvent(new MouseEvent("mousedown", { bubbles }))
        expect(logMenu.events).to.contain("mousedown")
      })
    })
    describe("#onAfterDetach()", () => {
      it("should remove event listeners", () => {
        const node = logMenu.node
        logMenu.open(0, 0)
        logMenu.close()
        expect(logMenu.methods).to.contain("onAfterDetach")
        node.dispatchEvent(new KeyboardEvent("keydown", { bubbles }))
        expect(logMenu.events).to.not.contain("keydown")
        node.dispatchEvent(new MouseEvent("mouseup", { bubbles }))
        expect(logMenu.events).to.not.contain("mouseup")
        node.dispatchEvent(new MouseEvent("mousemove", { bubbles }))
        expect(logMenu.events).to.not.contain("mousemove")
        node.dispatchEvent(new MouseEvent("mouseenter", { bubbles }))
        expect(logMenu.events).to.not.contain("mouseenter")
        node.dispatchEvent(new MouseEvent("mouseleave", { bubbles }))
        expect(logMenu.events).to.not.contain("mouseleave")
        node.dispatchEvent(new MouseEvent("contextmenu", { bubbles }))
        expect(logMenu.events).to.not.contain("contextmenu")
        document.body.dispatchEvent(new MouseEvent("mousedown", { bubbles }))
        expect(logMenu.events).to.not.contain("mousedown")
      })
    })
    describe("#onActivateRequest", () => {
      it("should focus the menu", done => {
        logMenu.open(0, 0)
        expect(document.activeElement).to.not.equal(logMenu.node)
        expect(logMenu.methods).to.not.contain("onActivateRequest")
        requestAnimationFrame(() => {
          expect(document.activeElement).toEqual(logMenu.node)
          expect(logMenu.methods).to.contain("onActivateRequest")
          done()
        })
      })
    })
    describe("#onUpdateRequest()", () => {
      it("should be called prior to opening", () => {
        expect(logMenu.methods).to.not.contain("onUpdateRequest")
        logMenu.open(0, 0)
        expect(logMenu.methods).to.contain("onUpdateRequest")
      })
      it("should collapse extra separators", () => {
        menu.addItem({ type: "separator" })
        menu.addItem({ command: "test" })
        menu.addItem({ type: "separator" })
        menu.addItem({ type: "separator" })
        menu.addItem({ type: "submenu", submenu: new Menu({ commands }) })
        menu.addItem({ type: "separator" })
        menu.open(0, 0)
        const elements = menu.node.querySelectorAll(
          '.lm-Menu-item[data-type="separator"'
        )
        expect(elements.length).toEqual(4)
        expect(elements[0].classList.contains("lm-mod-collapsed")).toEqual(true)
        expect(elements[1].classList.contains("lm-mod-collapsed")).toEqual(
          false
        )
        expect(elements[2].classList.contains("lm-mod-collapsed")).toEqual(true)
        expect(elements[3].classList.contains("lm-mod-collapsed")).toEqual(true)
      })
    })
    describe("#onCloseRequest()", () => {
      it("should reset the active index", () => {
        menu.addItem({ command: "test" })
        menu.activeIndex = 0
        menu.open(0, 0)
        menu.close()
        expect(menu.activeIndex).toEqual(-1)
      })
      it("should close any open child menu", () => {
        const submenu = new Menu({ commands })
        submenu.addItem({ command: "test" })
        menu.addItem({ type: "submenu", submenu })
        menu.open(0, 0)
        menu.activateNextItem()
        menu.triggerActiveItem()
        expect(menu.childMenu).toEqual(submenu)
        expect(submenu.isAttached).equal(true)
        menu.close()
        expect(menu.childMenu).toEqual(null)
        expect(submenu.isAttached).equal(false)
      })
      it("should remove the menu from its parent and activate the parent", done => {
        const submenu = new Menu({ commands })
        submenu.addItem({ command: "test" })
        menu.addItem({ type: "submenu", submenu })
        menu.open(0, 0)
        menu.activateNextItem()
        menu.triggerActiveItem()
        expect(menu.childMenu).toEqual(submenu)
        expect(submenu.parentMenu).toEqual(menu)
        expect(submenu.isAttached).toEqual(true)
        submenu.close()
        expect(menu.childMenu).toEqual(null)
        expect(submenu.parentMenu).toEqual(null)
        expect(submenu.isAttached).toEqual(false)
        requestAnimationFrame(() => {
          expect(document.activeElement).toEqual(menu.node)
          done()
        })
      })
      it("should emit the `aboutToClose` signal if attached", () => {
        let called = false
        menu.open(0, 0)
        menu.aboutToClose.connect((sender, args) => {
          expect(sender).toEqual(menu)
          expect(args).toEqual(undefined)
          called = true
        })
        menu.close()
        expect(called).toEqual(true)
      })
    })
    describe(".IItem", () => {
      describe("#type", () => {
        it("should get the type of the menu item", () => {
          const item = menu.addItem({ type: "separator" })
          expect(item.type).toEqual("separator")
        })
        it("should default to `'command'`", () => {
          const item = menu.addItem({})
          expect(item.type).toEqual("command")
        })
      })
      describe("#command", () => {
        it("should get the command to execute when the item is triggered", () => {
          const item = menu.addItem({ command: "foo" })
          expect(item.command).toEqual("foo")
        })
        it("should default to an empty string", () => {
          const item = menu.addItem({})
          expect(item.command).toEqual("")
        })
      })
      describe("#args", () => {
        it("should get the arguments for the command", () => {
          const item = menu.addItem({ args: { foo: 1 } })
          expect(item.args).to.deep.equal({ foo: 1 })
        })
        it("should default to an empty object", () => {
          const item = menu.addItem({})
          expect(item.args).to.deep.equal({})
        })
      })
      describe("#submenu", () => {
        it("should get the submenu for the item", () => {
          const submenu = new Menu({ commands })
          const item = menu.addItem({ submenu })
          expect(item.submenu).toEqual(submenu)
        })
        it("should default to `null`", () => {
          const item = menu.addItem({})
          expect(item.submenu).toEqual(null)
        })
      })
      describe("#label", () => {
        it("should get the label of a command item for a `command` type", () => {
          const item = menu.addItem({ command: "test" })
          expect(item.label).toEqual("Test Label")
        })
        it("should get the title label of a submenu item for a `submenu` type", () => {
          const submenu = new Menu({ commands })
          submenu.title.label = "foo"
          const item = menu.addItem({ type: "submenu", submenu })
          expect(item.label).toEqual("foo")
        })
        it("should default to an empty string", () => {
          let item = menu.addItem({})
          expect(item.label).toEqual("")
          item = menu.addItem({ type: "separator" })
          expect(item.label).toEqual("")
        })
      })
      describe("#mnemonic", () => {
        it("should get the mnemonic index of a command item for a `command` type", () => {
          const item = menu.addItem({ command: "test" })
          expect(item.mnemonic).toEqual(0)
        })
        it("should get the title mnemonic of a submenu item for a `submenu` type", () => {
          const submenu = new Menu({ commands })
          submenu.title.mnemonic = 1
          const item = menu.addItem({ type: "submenu", submenu })
          expect(item.mnemonic).toEqual(1)
        })
        it("should default to `-1`", () => {
          let item = menu.addItem({})
          expect(item.mnemonic).toEqual(-1)
          item = menu.addItem({ type: "separator" })
          expect(item.mnemonic).toEqual(-1)
        })
      })
      describe("#icon", () => {
        it("should get the title icon of a submenu item for a `submenu` type", () => {
          const submenu = new Menu({ commands })
          submenu.title.iconClass = "bar"
          const item = menu.addItem({ type: "submenu", submenu })
          expect(item.iconClass).toEqual("bar")
        })
        it("should default to undefined", () => {
          let item = menu.addItem({})
          expect(item.icon).toEqual(undefined)
          item = menu.addItem({ type: "separator" })
          expect(item.icon).toEqual(undefined)
        })
      })
      describe("#caption", () => {
        it("should get the caption of a command item for a `command` type", () => {
          const item = menu.addItem({ command: "test" })
          expect(item.caption).toEqual("Test Caption")
        })
        it("should get the title caption of a submenu item for a `submenu` type", () => {
          const submenu = new Menu({ commands })
          submenu.title.caption = "foo caption"
          const item = menu.addItem({ type: "submenu", submenu })
          expect(item.caption).toEqual("foo caption")
        })
        it("should default to an empty string", () => {
          let item = menu.addItem({})
          expect(item.caption).toEqual("")
          item = menu.addItem({ type: "separator" })
          expect(item.caption).toEqual("")
        })
      })
      describe("#className", () => {
        it("should get the extra class name of a command item for a `command` type", () => {
          const item = menu.addItem({ command: "test" })
          expect(item.className).toEqual("testClass")
        })
        it("should get the title extra class name of a submenu item for a `submenu` type", () => {
          const submenu = new Menu({ commands })
          submenu.title.className = "fooClass"
          const item = menu.addItem({ type: "submenu", submenu })
          expect(item.className).toEqual("fooClass")
        })
        it("should default to an empty string", () => {
          let item = menu.addItem({})
          expect(item.className).toEqual("")
          item = menu.addItem({ type: "separator" })
          expect(item.className).toEqual("")
        })
      })
      describe("#isEnabled", () => {
        it("should get whether the command is enabled for a `command` type", () => {
          let item = menu.addItem({ command: "test-disabled" })
          expect(item.isEnabled).toEqual(false)
          item = menu.addItem({ type: "command" })
          expect(item.isEnabled).toEqual(false)
          item = menu.addItem({ command: "test" })
          expect(item.isEnabled).toEqual(true)
        })
        it("should get whether there is a submenu for a `submenu` type", () => {
          const submenu = new Menu({ commands })
          let item = menu.addItem({ type: "submenu", submenu })
          expect(item.isEnabled).toEqual(true)
          item = menu.addItem({ type: "submenu" })
          expect(item.isEnabled).toEqual(false)
        })
        it("should be `true` for a separator item", () => {
          const item = menu.addItem({ type: "separator" })
          expect(item.isEnabled).toEqual(true)
        })
      })
      describe("#isToggled", () => {
        it("should get whether the command is toggled for a `command` type", () => {
          let item = menu.addItem({ command: "test-toggled" })
          expect(item.isToggled).toEqual(true)
          item = menu.addItem({ command: "test" })
          expect(item.isToggled).toEqual(false)
          item = menu.addItem({ type: "command" })
          expect(item.isToggled).toEqual(false)
        })
        it("should be `false` for other item types", () => {
          let item = menu.addItem({ type: "separator" })
          expect(item.isToggled).toEqual(false)
          item = menu.addItem({ type: "submenu" })
          expect(item.isToggled).toEqual(false)
        })
      })
      describe("#isVisible", () => {
        it("should get whether the command is visible for a `command` type", () => {
          let item = menu.addItem({ command: "test-hidden" })
          expect(item.isVisible).toEqual(false)
          item = menu.addItem({ command: "test" })
          expect(item.isVisible).toEqual(true)
        })
        it("should get whether there is a submenu for a `submenu` type", () => {
          const submenu = new Menu({ commands })
          let item = menu.addItem({ type: "submenu", submenu })
          expect(item.isVisible).toEqual(true)
          item = menu.addItem({ type: "submenu" })
          expect(item.isVisible).toEqual(false)
        })
        it("should be `true` for a separator item", () => {
          const item = menu.addItem({ type: "separator" })
          expect(item.isVisible).toEqual(true)
        })
      })
      describe("#keyBinding", () => {
        it("should get the key binding for the menu item", () => {
          const item = menu.addItem({ command: "test" })
          expect(item.keyBinding!.keys).to.deep.equal(["Ctrl T"])
        })
        it("should be `null` for submenus and separators", () => {
          let item = menu.addItem({ type: "separator" })
          expect(item.keyBinding).toEqual(null)
          item = menu.addItem({ type: "submenu" })
          expect(item.keyBinding).toEqual(null)
        })
      })
    })
    describe(".Renderer", () => {
      const renderer = new Menu.Renderer()
      describe("#renderItem()", () => {
        it("should render an item node for the menu", () => {
          const item = menu.addItem({ command: "test" })
          const vNode = renderer.renderItem({
            item,
            active: false,
            collapsed: false,
          })
          const node = VirtualDOM.realize(vNode)
          expect(node.classList.contains("lm-Menu-item")).toEqual(true)
          expect(node.classList.contains("lm-mod-hidden")).toEqual(false)
          expect(node.classList.contains("lm-mod-disabled")).toEqual(false)
          expect(node.classList.contains("lm-mod-toggled")).toEqual(false)
          expect(node.classList.contains("lm-mod-active")).toEqual(false)
          expect(node.classList.contains("lm-mod-collapsed")).toEqual(false)
          expect(node.getAttribute("data-command")).toEqual("test")
          expect(node.getAttribute("data-type")).toEqual("command")
          expect(node.querySelector(".lm-Menu-itemIcon")).to.not.equal(null)
          expect(node.querySelector(".lm-Menu-itemLabel")).to.not.equal(null)
          expect(node.querySelector(".lm-Menu-itemSubmenuIcon")).to.not.equal(
            null
          )
        })
        it("should handle the hidden item state", () => {
          const item = menu.addItem({ command: "test-hidden" })
          const vNode = renderer.renderItem({
            item,
            active: false,
            collapsed: false,
          })
          const node = VirtualDOM.realize(vNode)
          expect(node.classList.contains("lm-mod-hidden")).toEqual(true)
        })
        it("should handle the disabled item state", () => {
          const item = menu.addItem({ command: "test-disabled" })
          const vNode = renderer.renderItem({
            item,
            active: false,
            collapsed: false,
          })
          const node = VirtualDOM.realize(vNode)
          expect(node.classList.contains("lm-mod-disabled")).toEqual(true)
        })
        it("should handle the toggled item state", () => {
          const item = menu.addItem({ command: "test-toggled" })
          const vNode = renderer.renderItem({
            item,
            active: false,
            collapsed: false,
          })
          const node = VirtualDOM.realize(vNode)
          expect(node.classList.contains("lm-mod-toggled")).toEqual(true)
        })
        it("should handle the active item state", () => {
          const item = menu.addItem({ command: "test" })
          const vNode = renderer.renderItem({
            item,
            active: true,
            collapsed: false,
          })
          const node = VirtualDOM.realize(vNode)
          expect(node.classList.contains("lm-mod-active")).toEqual(true)
        })
        it("should handle the collapsed item state", () => {
          const item = menu.addItem({ command: "test-collapsed" })
          const vNode = renderer.renderItem({
            item,
            active: false,
            collapsed: true,
          })
          const node = VirtualDOM.realize(vNode)
          expect(node.classList.contains("lm-mod-collapsed")).toEqual(true)
        })
      })
      describe("#renderIcon()", () => {
        it("should render the icon node for the menu", () => {
          const item = menu.addItem({ command: "test" })
          const vNode = renderer.renderIcon({
            item,
            active: false,
            collapsed: false,
          })
          const node = VirtualDOM.realize(vNode)
          expect(node.classList.contains("lm-Menu-itemIcon")).toEqual(true)
          expect(node.classList.contains("foo")).toEqual(true)
        })
      })
      describe("#renderLabel()", () => {
        it("should render the label node for the menu", () => {
          const item = menu.addItem({ command: "test" })
          const vNode = renderer.renderLabel({
            item,
            active: false,
            collapsed: false,
          })
          const node = VirtualDOM.realize(vNode)
          const span = '<span class="lm-Menu-itemMnemonic">T</span>est Label'
          expect(node.classList.contains("lm-Menu-itemLabel")).toEqual(true)
          expect(node.innerHTML).toEqual(span)
        })
      })
      describe("#renderShortcut()", () => {
        it("should render the shortcut node for the menu", () => {
          const item = menu.addItem({ command: "test" })
          const vNode = renderer.renderShortcut({
            item,
            active: false,
            collapsed: false,
          })
          const node = VirtualDOM.realize(vNode)
          expect(node.classList.contains("lm-Menu-itemShortcut")).toEqual(true)
          if (Platform.IS_MAC) {
            expect(node.innerHTML).toEqual("\u2303 T")
          } else {
            expect(node.innerHTML).toEqual("Ctrl+T")
          }
        })
      })
      describe("#renderSubmenu()", () => {
        it("should render the submenu icon node for the menu", () => {
          const item = menu.addItem({ command: "test" })
          const vNode = renderer.renderSubmenu({
            item,
            active: false,
            collapsed: false,
          })
          const node = VirtualDOM.realize(vNode)
          expect(node.classList.contains("lm-Menu-itemSubmenuIcon")).toEqual(
            true
          )
        })
      })
      describe("#createItemClass()", () => {
        it("should create the full class name for the item node", () => {
          let item = menu.addItem({ command: "test" })
          let name = renderer.createItemClass({
            item,
            active: false,
            collapsed: false,
          })
          let expected = "lm-Menu-item testClass"
          expect(name).toEqual(expected)
          name = renderer.createItemClass({
            item,
            active: true,
            collapsed: false,
          })
          expected = "lm-Menu-item lm-mod-active testClass"
          expect(name).toEqual(expected)
          name = renderer.createItemClass({
            item,
            active: false,
            collapsed: true,
          })
          expected = "lm-Menu-item lm-mod-collapsed testClass"
          expect(name).toEqual(expected)
          item = menu.addItem({ command: "test-disabled" })
          name = renderer.createItemClass({
            item,
            active: false,
            collapsed: false,
          })
          expected = "lm-Menu-item lm-mod-disabled testClass"
          expect(name).toEqual(expected)
          item = menu.addItem({ command: "test-toggled" })
          name = renderer.createItemClass({
            item,
            active: false,
            collapsed: false,
          })
          expected = "lm-Menu-item lm-mod-toggled testClass"
          expect(name).toEqual(expected)
          item = menu.addItem({ command: "test-hidden" })
          name = renderer.createItemClass({
            item,
            active: false,
            collapsed: false,
          })
          expected = "lm-Menu-item lm-mod-hidden testClass"
          expect(name).toEqual(expected)
          const submenu = new Menu({ commands })
          submenu.title.className = "fooClass"
          item = menu.addItem({ type: "submenu", submenu })
          name = renderer.createItemClass({
            item,
            active: false,
            collapsed: false,
          })
          expected = "lm-Menu-item fooClass"
          expect(name).toEqual(expected)
        })
      })
      describe("#createItemDataset()", () => {
        it("should create the item dataset", () => {
          let item = menu.addItem({ command: "test" })
          let dataset = renderer.createItemDataset({
            item,
            active: false,
            collapsed: false,
          })
          expect(dataset).to.deep.equal({ type: "command", command: "test" })
          item = menu.addItem({ type: "separator" })
          dataset = renderer.createItemDataset({
            item,
            active: false,
            collapsed: false,
          })
          expect(dataset).to.deep.equal({ type: "separator" })
          const submenu = new Menu({ commands })
          item = menu.addItem({ type: "submenu", submenu })
          dataset = renderer.createItemDataset({
            item,
            active: false,
            collapsed: false,
          })
          expect(dataset).to.deep.equal({ type: "submenu" })
        })
      })
      describe("#createIconClass()", () => {
        it("should create the icon class name", () => {
          let item = menu.addItem({ command: "test" })
          let name = renderer.createIconClass({
            item,
            active: false,
            collapsed: false,
          })
          let expected = "lm-Menu-itemIcon foo"
          expect(name).toEqual(expected)
          item = menu.addItem({ type: "separator" })
          name = renderer.createIconClass({
            item,
            active: false,
            collapsed: false,
          })
          expected = "lm-Menu-itemIcon"
          expect(name).toEqual(expected)
          const submenu = new Menu({ commands })
          submenu.title.iconClass = "bar"
          item = menu.addItem({ type: "submenu", submenu })
          name = renderer.createIconClass({
            item,
            active: false,
            collapsed: false,
          })
          expected = "lm-Menu-itemIcon bar"
          expect(name).toEqual(expected)
        })
      })
      describe("#formatLabel()", () => {
        it("should format the item label", () => {
          let item = menu.addItem({ command: "test" })
          let child = renderer.formatLabel({
            item,
            active: false,
            collapsed: false,
          })
          const node = VirtualDOM.realize(h.div(child))
          const span = '<span class="lm-Menu-itemMnemonic">T</span>est Label'
          expect(node.innerHTML).toEqual(span)
          item = menu.addItem({ type: "separator" })
          child = renderer.formatLabel({
            item,
            active: false,
            collapsed: false,
          })
          expect(child).toEqual("")
          const submenu = new Menu({ commands })
          submenu.title.label = "Submenu Label"
          item = menu.addItem({ type: "submenu", submenu })
          child = renderer.formatLabel({
            item,
            active: false,
            collapsed: false,
          })
          expect(child).toEqual("Submenu Label")
        })
      })
      describe("#formatShortcut()", () => {
        it("should format the item shortcut", () => {
          const item = menu.addItem({ command: "test" })
          const child = renderer.formatShortcut({
            item,
            active: false,
            collapsed: false,
          })
          if (Platform.IS_MAC) {
            expect(child).toEqual("\u2303 T")
          } else {
            expect(child).toEqual("Ctrl+T")
          }
        })
      })
    })
  })
})
class LogMenuBar extends MenuBar {
  events: string[] = []
  methods: string[] = []
  handleEvent(event: Event): void {
    super.handleEvent(event)
    this.events.push(event.type)
  }
  protected onBeforeAttach(msg: Message): void {
    super.onBeforeAttach(msg)
    this.methods.push("onBeforeAttach")
  }
  protected onAfterDetach(msg: Message): void {
    super.onAfterDetach(msg)
    this.methods.push("onAfterDetach")
  }
  protected onUpdateRequest(msg: Message): void {
    super.onUpdateRequest(msg)
    this.methods.push("onUpdateRequest")
  }
}
const bubbles = true
const cancelable = true
describe("../../src/lumino/widgets", () => {
  const DEFAULT_CMD = "menubar.spec.ts:defaultCmd"
  const disposables = new DisposableSet()
  let commands: CommandRegistry
  function createMenuBar(): MenuBar {
    const bar = new MenuBar()
    for (let i = 0; i < 3; i++) {
      const menu = new Menu({ commands })
      const item = menu.addItem({ command: DEFAULT_CMD })
      menu.addItem(item)
      menu.title.label = `Menu${i}`
      menu.title.mnemonic = 4
      bar.addMenu(menu)
    }
    bar.activeIndex = 0
    Widget.attach(bar, document.body)
    MessageLoop.sendMessage(bar, Widget.Msg.UpdateRequest)
    return bar
  }
  before(() => {
    commands = new CommandRegistry()
    const iconRenderer = {
      render: (host: HTMLElement, options?: any) => {
        const renderNode = document.createElement("div")
        renderNode.className = "foo"
        host.appendChild(renderNode)
      },
    }
    const cmd = commands.addCommand(DEFAULT_CMD, {
      execute: (args: JSONObject) => {
        return args
      },
      label: "LABEL",
      icon: iconRenderer,
      className: "bar",
      isToggled: (args: JSONObject) => {
        return true
      },
      mnemonic: 1,
    })
    const kbd = commands.addKeyBinding({
      keys: ["A"],
      selector: "*",
      command: DEFAULT_CMD,
    })
    disposables.add(cmd)
    disposables.add(kbd)
  })
  after(() => {
    disposables.dispose()
  })
  describe("MenuBar", () => {
    describe("#constructor()", () => {
      it("should take no arguments", () => {
        const bar = new MenuBar()
        expect(bar).to.be.an.instanceof(MenuBar)
        bar.dispose()
      })
      it("should take options for initializing the menu bar", () => {
        const renderer = new MenuBar.Renderer()
        const bar = new MenuBar({ renderer })
        expect(bar).to.be.an.instanceof(MenuBar)
        bar.dispose()
      })
      it("should add the `lm-MenuBar` class", () => {
        const bar = new MenuBar()
        expect(bar.hasClass("lm-MenuBar")).toEqual(true)
        bar.dispose()
      })
    })
    describe("#dispose()", () => {
      it("should dispose of the resources held by the menu bar", () => {
        const bar = new MenuBar()
        bar.addMenu(new Menu({ commands }))
        bar.dispose()
        expect(bar.isDisposed).toEqual(true)
        bar.dispose()
        expect(bar.isDisposed).toEqual(true)
      })
    })
    describe("#renderer", () => {
      it("should get the renderer for the menu bar", () => {
        const renderer = Object.create(MenuBar.defaultRenderer)
        const bar = new MenuBar({ renderer })
        expect(bar.renderer).toEqual(renderer)
        bar.dispose()
      })
    })
    describe("#childMenu", () => {
      it("should get the child menu of the menu bar", () => {
        const bar = new MenuBar()
        const menu = new Menu({ commands })
        bar.addMenu(menu)
        bar.activeIndex = 0
        bar.openActiveMenu()
        expect(bar.childMenu).toEqual(menu)
        bar.dispose()
      })
      it("should be `null` if there is no open menu", () => {
        const bar = new MenuBar()
        const menu = new Menu({ commands })
        bar.addMenu(menu)
        bar.activeIndex = 0
        expect(bar.childMenu).toEqual(null)
        bar.dispose()
      })
    })
    describe("#contentNode", () => {
      it("should get the menu content node", () => {
        const bar = new MenuBar()
        const content = bar.contentNode
        expect(content.classList.contains("lm-MenuBar-content")).toEqual(true)
        bar.dispose()
      })
    })
    describe("#activeMenu", () => {
      it("should get the active menu of the menu bar", () => {
        const bar = new MenuBar()
        const menu = new Menu({ commands })
        bar.addMenu(menu)
        bar.activeIndex = 0
        expect(bar.activeMenu).toEqual(menu)
        bar.dispose()
      })
      it("should be `null` if there is no active menu", () => {
        const bar = new MenuBar()
        const menu = new Menu({ commands })
        bar.addMenu(menu)
        expect(bar.activeMenu).toEqual(null)
        bar.dispose()
      })
      it("should set the currently active menu", () => {
        const bar = new MenuBar()
        const menu = new Menu({ commands })
        bar.addMenu(menu)
        bar.activeMenu = menu
        expect(bar.activeMenu).toEqual(menu)
        bar.dispose()
      })
      it("should set to `null` if the menu is not in the menu bar", () => {
        const bar = new MenuBar()
        const menu = new Menu({ commands })
        bar.activeMenu = menu
        expect(bar.activeMenu).toEqual(null)
        bar.dispose()
      })
    })
    describe("#activeIndex", () => {
      it("should get the index of the currently active menu", () => {
        const bar = new MenuBar()
        const menu = new Menu({ commands })
        bar.addMenu(menu)
        bar.activeMenu = menu
        expect(bar.activeIndex).toEqual(0)
        bar.dispose()
      })
      it("should be `-1` if no menu is active", () => {
        const bar = new MenuBar()
        const menu = new Menu({ commands })
        bar.addMenu(menu)
        expect(bar.activeIndex).toEqual(-1)
        bar.dispose()
      })
      it("should set the index of the currently active menu", () => {
        const bar = new MenuBar()
        const menu = new Menu({ commands })
        bar.addMenu(menu)
        bar.activeIndex = 0
        expect(bar.activeIndex).toEqual(0)
        bar.dispose()
      })
      it("should set to `-1` if the index is out of range", () => {
        const bar = new MenuBar()
        const menu = new Menu({ commands })
        bar.addMenu(menu)
        bar.activeIndex = -2
        expect(bar.activeIndex).toEqual(-1)
        bar.activeIndex = 1
        expect(bar.activeIndex).toEqual(-1)
        bar.dispose()
      })
      it("should add `lm-mod-active` to the active node", () => {
        const bar = createMenuBar()
        const node = bar.contentNode.firstChild as HTMLElement
        expect(node.classList.contains("lm-mod-active")).toEqual(true)
        expect(bar.activeIndex).toEqual(0)
        bar.dispose()
      })
    })
    describe("#menus", () => {
      it("should get a read-only array of the menus in the menu bar", () => {
        const bar = new MenuBar()
        const menu0 = new Menu({ commands })
        const menu1 = new Menu({ commands })
        bar.addMenu(menu0)
        bar.addMenu(menu1)
        const menus = bar.menus
        expect(menus.length).toEqual(2)
        expect(menus[0]).toEqual(menu0)
        expect(menus[1]).toEqual(menu1)
        bar.dispose()
      })
    })
    describe("#openActiveMenu()", () => {
      it("should open the active menu and activate its first menu item", () => {
        const bar = new MenuBar()
        const menu = new Menu({ commands })
        const item = menu.addItem({ command: DEFAULT_CMD })
        menu.addItem(item)
        bar.addMenu(menu)
        bar.activeMenu = menu
        bar.openActiveMenu()
        expect(menu.isAttached).toEqual(true)
        expect(menu.activeItem!.command).toEqual(item.command)
        bar.dispose()
      })
      it("should be a no-op if there is no active menu", () => {
        const bar = new MenuBar()
        const menu = new Menu({ commands })
        const item = menu.addItem({ command: DEFAULT_CMD })
        menu.addItem(item)
        bar.addMenu(menu)
        bar.openActiveMenu()
        expect(menu.isAttached).toEqual(false)
        bar.dispose()
      })
      it("should be a no-op if the active menu is empty", () => {
        const bar = new MenuBar()
        const menu = new Menu({ commands })
        bar.addMenu(menu)
        bar.activeMenu = menu
        bar.openActiveMenu()
        expect(menu.isAttached).toEqual(false)
        bar.dispose()
      })
    })
    describe("#addMenu()", () => {
      it("should add a menu to the end of the menu bar", () => {
        const bar = new MenuBar()
        const menu = new Menu({ commands })
        const item = menu.addItem({ command: DEFAULT_CMD })
        menu.addItem(item)
        bar.addMenu(new Menu({ commands }))
        bar.addMenu(menu)
        expect(bar.menus.length).toEqual(2)
        expect(bar.menus[1]).toEqual(menu)
        bar.dispose()
      })
      it("should move an existing menu to the end", () => {
        const bar = new MenuBar()
        const menu = new Menu({ commands })
        const item = menu.addItem({ command: DEFAULT_CMD })
        menu.addItem(item)
        bar.addMenu(menu)
        bar.addMenu(new Menu({ commands }))
        bar.addMenu(menu)
        expect(bar.menus.length).toEqual(2)
        expect(bar.menus[1]).toEqual(menu)
        bar.dispose()
      })
    })
    describe("#insertMenu()", () => {
      it("should insert a menu into the menu bar at the specified index", () => {
        const bar = new MenuBar()
        const menu = new Menu({ commands })
        bar.addMenu(new Menu({ commands }))
        bar.insertMenu(0, menu)
        expect(bar.menus.length).toEqual(2)
        expect(bar.menus[0]).toEqual(menu)
        bar.dispose()
      })
      it("should clamp the index to the bounds of the menus", () => {
        const bar = new MenuBar()
        let menu = new Menu({ commands })
        bar.addMenu(new Menu({ commands }))
        bar.insertMenu(-1, menu)
        expect(bar.menus.length).toEqual(2)
        expect(bar.menus[0]).toEqual(menu)
        menu = new Menu({ commands })
        bar.insertMenu(10, menu)
        expect(bar.menus.length).toEqual(3)
        expect(bar.menus[2]).toEqual(menu)
        bar.dispose()
      })
      it("should move an existing menu", () => {
        const bar = new MenuBar()
        const menu = new Menu({ commands })
        bar.addMenu(new Menu({ commands }))
        bar.insertMenu(0, menu)
        bar.insertMenu(10, menu)
        expect(bar.menus.length).toEqual(2)
        expect(bar.menus[1]).toEqual(menu)
        bar.dispose()
      })
      it("should be a no-op if there is no effective move", () => {
        const bar = new MenuBar()
        const menu = new Menu({ commands })
        bar.addMenu(new Menu({ commands }))
        bar.insertMenu(0, menu)
        bar.insertMenu(0, menu)
        expect(bar.menus.length).toEqual(2)
        expect(bar.menus[0]).toEqual(menu)
        bar.dispose()
      })
    })
    describe("#removeMenu()", () => {
      it("should remove a menu from the menu bar by value", () => {
        const bar = new MenuBar()
        const menu = new Menu({ commands })
        bar.addMenu(new Menu({ commands }))
        bar.addMenu(menu)
        bar.removeMenu(menu)
        expect(bar.menus.length).toEqual(1)
        expect(bar.menus[0]).to.not.equal(menu)
        bar.dispose()
      })
      it("should return be a no-op if the menu is not in the menu bar", () => {
        const bar = new MenuBar()
        const menu = new Menu({ commands })
        bar.addMenu(new Menu({ commands }))
        bar.addMenu(menu)
        bar.removeMenu(menu)
        bar.removeMenu(menu)
        expect(bar.menus.length).toEqual(0)
        bar.dispose()
      })
    })
    describe("#removeMenuAt()", () => {
      it("should remove a menu from the menu bar by index", () => {
        const bar = new MenuBar()
        const menu = new Menu({ commands })
        bar.addMenu(new Menu({ commands }))
        bar.addMenu(menu)
        bar.removeMenuAt(1)
        expect(bar.menus.length).toEqual(1)
        expect(bar.menus[0]).to.not.equal(menu)
        bar.dispose()
      })
      it("should be a no-op if the index is out of range", () => {
        const bar = new MenuBar()
        const menu = new Menu({ commands })
        bar.addMenu(new Menu({ commands }))
        bar.addMenu(menu)
        bar.removeMenuAt(1)
        bar.removeMenuAt(1)
        expect(bar.menus.length).toEqual(1)
        bar.dispose()
      })
    })
    describe("#clearMenus()", () => {
      it("should remove all menus from the menu bar", () => {
        const bar = new MenuBar()
        bar.addMenu(new Menu({ commands }))
        bar.addMenu(new Menu({ commands }))
        bar.clearMenus()
        expect(bar.menus).to.eql([])
        bar.dispose()
      })
      it("should be a no-op if there are no menus", () => {
        const bar = new MenuBar()
        bar.clearMenus()
        expect(bar.menus).to.eql([])
        bar.dispose()
      })
    })
    describe("#handleEvent()", () => {
      let bar: MenuBar
      beforeEach(() => {
        bar = createMenuBar()
      })
      afterEach(() => {
        bar.dispose()
      })
      context("keydown", () => {
        it("should bail on Tab", () => {
          const event = new KeyboardEvent("keydown", { keyCode: 9 })
          bar.node.dispatchEvent(event)
          expect(event.defaultPrevented).toEqual(false)
        })
        it("should open the active menu on Enter", () => {
          const menu = bar.activeMenu!
          bar.node.dispatchEvent(
            new KeyboardEvent("keydown", {
              bubbles,
              keyCode: 13,
            })
          )
          expect(menu.isAttached).toEqual(true)
        })
        it("should open the active menu on Up Arrow", () => {
          const menu = bar.activeMenu!
          bar.node.dispatchEvent(
            new KeyboardEvent("keydown", {
              bubbles,
              keyCode: 38,
            })
          )
          expect(menu.isAttached).toEqual(true)
        })
        it("should open the active menu on Down Arrow", () => {
          const menu = bar.activeMenu!
          bar.node.dispatchEvent(
            new KeyboardEvent("keydown", {
              bubbles,
              keyCode: 40,
            })
          )
          expect(menu.isAttached).toEqual(true)
        })
        it("should close the active menu on Escape", () => {
          const menu = bar.activeMenu!
          bar.openActiveMenu()
          bar.node.dispatchEvent(
            new KeyboardEvent("keydown", {
              bubbles,
              keyCode: 27,
            })
          )
          expect(menu.isAttached).toEqual(false)
          expect(menu.activeIndex).toEqual(-1)
          expect(menu.node.contains(document.activeElement)).toEqual(false)
        })
        it("should activate the previous menu on Left Arrow", () => {
          bar.node.dispatchEvent(
            new KeyboardEvent("keydown", {
              bubbles,
              keyCode: 37,
            })
          )
          expect(bar.activeIndex!).toEqual(2)
          bar.node.dispatchEvent(
            new KeyboardEvent("keydown", {
              bubbles,
              keyCode: 37,
            })
          )
          expect(bar.activeIndex!).toEqual(1)
        })
        it("should activate the next menu on Right Arrow", () => {
          bar.node.dispatchEvent(
            new KeyboardEvent("keydown", {
              bubbles,
              keyCode: 39,
            })
          )
          expect(bar.activeIndex!).toEqual(1)
          bar.node.dispatchEvent(
            new KeyboardEvent("keydown", {
              bubbles,
              keyCode: 39,
            })
          )
          expect(bar.activeIndex!).toEqual(2)
          bar.node.dispatchEvent(
            new KeyboardEvent("keydown", {
              bubbles,
              keyCode: 39,
            })
          )
          expect(bar.activeIndex!).toEqual(0)
        })
        it("should open the menu matching a mnemonic", () => {
          bar.node.dispatchEvent(
            new KeyboardEvent("keydown", {
              bubbles,
              keyCode: 97, // `1` key
            })
          )
          expect(bar.activeIndex!).toEqual(1)
          const menu = bar.activeMenu!
          expect(menu.isAttached).toEqual(true)
        })
        it("should select the next menu matching by first letter", () => {
          bar.activeIndex = 1
          bar.node.dispatchEvent(
            new KeyboardEvent("keydown", {
              bubbles,
              keyCode: 77, // `M` key
            })
          )
          expect(bar.activeIndex!).toEqual(1)
          const menu = bar.activeMenu!
          expect(menu.isAttached).toEqual(false)
        })
        it("should select the first menu matching the mnemonic", () => {
          let menu = new Menu({ commands })
          menu.title.label = "Test1"
          menu.title.mnemonic = 4
          bar.addMenu(menu)
          bar.node.dispatchEvent(
            new KeyboardEvent("keydown", {
              bubbles,
              keyCode: 97, // `1` key
            })
          )
          expect(bar.activeIndex).toEqual(1)
          menu = bar.activeMenu!
          expect(menu.isAttached).toEqual(false)
        })
        it("should select the only menu matching the first letter", () => {
          let menu = new Menu({ commands })
          menu.title.label = "Test1"
          bar.addMenu(menu)
          bar.addMenu(new Menu({ commands }))
          bar.node.dispatchEvent(
            new KeyboardEvent("keydown", {
              bubbles,
              keyCode: 84, // `T` key
            })
          )
          expect(bar.activeIndex).toEqual(3)
          menu = bar.activeMenu!
          expect(menu.isAttached).toEqual(false)
        })
      })
      context("mousedown", () => {
        it("should bail if the mouse press was not on the menu bar", () => {
          const event = new MouseEvent("mousedown", { bubbles, clientX: -10 })
          bar.node.dispatchEvent(event)
          expect(event.defaultPrevented).toEqual(false)
        })
        it("should close an open menu if the press was not on an item", () => {
          bar.openActiveMenu()
          const menu = bar.activeMenu!
          bar.node.dispatchEvent(new MouseEvent("mousedown", { bubbles }))
          expect(bar.activeIndex).toEqual(-1)
          expect(menu.isAttached).toEqual(false)
        })
        it("should close an active menu", () => {
          bar.openActiveMenu()
          const menu = bar.activeMenu!
          const node = bar.node.getElementsByClassName(
            "lm-MenuBar-item"
          )[0] as HTMLElement
          const rect = node.getBoundingClientRect()
          bar.node.dispatchEvent(
            new MouseEvent("mousedown", {
              bubbles,
              clientX: rect.left,
              clientY: rect.top,
            })
          )
          expect(bar.activeIndex).toEqual(0)
          expect(menu.isAttached).toEqual(false)
        })
        it("should open an active menu", () => {
          const menu = bar.activeMenu!
          const node = bar.node.getElementsByClassName(
            "lm-MenuBar-item"
          )[0] as HTMLElement
          const rect = node.getBoundingClientRect()
          bar.node.dispatchEvent(
            new MouseEvent("mousedown", {
              bubbles,
              clientX: rect.left,
              clientY: rect.top,
            })
          )
          expect(bar.activeIndex).toEqual(0)
          expect(menu.isAttached).toEqual(true)
        })
        it("should not close an active menu if not a left mouse press", () => {
          bar.openActiveMenu()
          const menu = bar.activeMenu!
          const node = bar.node.getElementsByClassName(
            "lm-MenuBar-item"
          )[0] as HTMLElement
          const rect = node.getBoundingClientRect()
          bar.node.dispatchEvent(
            new MouseEvent("mousedown", {
              bubbles,
              button: 1,
              clientX: rect.left,
              clientY: rect.top,
            })
          )
          expect(bar.activeIndex).toEqual(0)
          expect(menu.isAttached).toEqual(true)
        })
      })
      context("mousemove", () => {
        it("should open a new menu if a menu is already open", () => {
          bar.openActiveMenu()
          const menu = bar.activeMenu!
          const node = bar.node.getElementsByClassName(
            "lm-MenuBar-item"
          )[1] as HTMLElement
          const rect = node.getBoundingClientRect()
          bar.node.dispatchEvent(
            new MouseEvent("mousemove", {
              bubbles,
              clientX: rect.left + 1,
              clientY: rect.top,
            })
          )
          expect(bar.activeIndex).toEqual(1)
          expect(menu.isAttached).toEqual(false)
          expect(bar.activeMenu!.isAttached).toEqual(true)
        })
        it("should be a no-op if the active index will not change", () => {
          bar.openActiveMenu()
          const menu = bar.activeMenu!
          const node = bar.node.getElementsByClassName(
            "lm-MenuBar-item"
          )[0] as HTMLElement
          const rect = node.getBoundingClientRect()
          bar.node.dispatchEvent(
            new MouseEvent("mousemove", {
              bubbles,
              clientX: rect.left,
              clientY: rect.top + 1,
            })
          )
          expect(bar.activeIndex).toEqual(0)
          expect(menu.isAttached).toEqual(true)
        })
        it("should be a no-op if the mouse is not over an item and there is a menu open", () => {
          bar.openActiveMenu()
          const menu = bar.activeMenu!
          bar.node.dispatchEvent(new MouseEvent("mousemove", { bubbles }))
          expect(bar.activeIndex).toEqual(0)
          expect(menu.isAttached).toEqual(true)
        })
      })
      context("mouseleave", () => {
        it("should reset the active index if there is no open menu", () => {
          bar.node.dispatchEvent(new MouseEvent("mouseleave", { bubbles }))
          expect(bar.activeIndex).toEqual(-1)
        })
        it("should be a no-op if there is an open menu", () => {
          bar.openActiveMenu()
          const menu = bar.activeMenu!
          bar.node.dispatchEvent(new MouseEvent("mouseleave", { bubbles }))
          expect(bar.activeIndex).toEqual(0)
          expect(menu.isAttached).toEqual(true)
        })
      })
      context("contextmenu", () => {
        it("should prevent default", () => {
          const event = new MouseEvent("contextmenu", { bubbles, cancelable })
          const cancelled = !bar.node.dispatchEvent(event)
          expect(cancelled).toEqual(true)
        })
      })
    })
    describe("#onBeforeAttach()", () => {
      it("should add event listeners", () => {
        const bar = new LogMenuBar()
        const node = bar.node
        Widget.attach(bar, document.body)
        expect(bar.methods.indexOf("onBeforeAttach")).to.not.equal(-1)
        node.dispatchEvent(new KeyboardEvent("keydown", { bubbles }))
        expect(bar.events.indexOf("keydown")).to.not.equal(-1)
        node.dispatchEvent(new MouseEvent("mousedown", { bubbles }))
        expect(bar.events.indexOf("mousedown")).to.not.equal(-1)
        node.dispatchEvent(new MouseEvent("mousemove", { bubbles }))
        expect(bar.events.indexOf("mousemove")).to.not.equal(-1)
        node.dispatchEvent(new MouseEvent("mouseleave", { bubbles }))
        expect(bar.events.indexOf("mouseleave")).to.not.equal(-1)
        node.dispatchEvent(new MouseEvent("contextmenu", { bubbles }))
        expect(bar.events.indexOf("contextmenu")).to.not.equal(-1)
        bar.dispose()
      })
    })
    describe("#onAfterDetach()", () => {
      it("should remove event listeners", () => {
        const bar = new LogMenuBar()
        const node = bar.node
        Widget.attach(bar, document.body)
        Widget.detach(bar)
        expect(bar.methods.indexOf("onBeforeAttach")).to.not.equal(-1)
        node.dispatchEvent(new KeyboardEvent("keydown", { bubbles }))
        expect(bar.events.indexOf("keydown")).toEqual(-1)
        node.dispatchEvent(new MouseEvent("mousedown", { bubbles }))
        expect(bar.events.indexOf("mousedown")).toEqual(-1)
        node.dispatchEvent(new MouseEvent("mousemove", { bubbles }))
        expect(bar.events.indexOf("mousemove")).toEqual(-1)
        node.dispatchEvent(new MouseEvent("mouseleave", { bubbles }))
        expect(bar.events.indexOf("mouseleave")).toEqual(-1)
        node.dispatchEvent(new MouseEvent("contextmenu", { bubbles }))
        expect(bar.events.indexOf("contextmenu")).toEqual(-1)
        bar.dispose()
      })
    })
    describe("#onActivateRequest()", () => {
      it("should be a no-op if not attached", () => {
        const bar = createMenuBar()
        Widget.detach(bar)
        MessageLoop.sendMessage(bar, Widget.Msg.ActivateRequest)
        expect(bar.node.contains(document.activeElement)).toEqual(false)
        bar.dispose()
      })
      it("should focus the node if attached", () => {
        const bar = createMenuBar()
        MessageLoop.sendMessage(bar, Widget.Msg.ActivateRequest)
        expect(bar.node.contains(document.activeElement)).toEqual(true)
        bar.dispose()
      })
    })
    describe("#onUpdateRequest()", () => {
      it("should be called when the title of a menu changes", done => {
        const bar = new LogMenuBar()
        const menu = new Menu({ commands })
        bar.addMenu(menu)
        bar.activeIndex = 0
        expect(bar.methods.indexOf("onUpdateRequest")).toEqual(-1)
        menu.title.label = "foo"
        expect(bar.methods.indexOf("onUpdateRequest")).toEqual(-1)
        requestAnimationFrame(() => {
          expect(bar.methods.indexOf("onUpdateRequest")).to.not.equal(-1)
          bar.dispose()
          done()
        })
      })
      it("should render the content", () => {
        const bar = new LogMenuBar()
        const menu = new Menu({ commands })
        bar.addMenu(menu)
        expect(bar.contentNode.children.length).toEqual(0)
        MessageLoop.sendMessage(bar, Widget.Msg.UpdateRequest)
        const child = bar.contentNode.firstChild as HTMLElement
        expect(child.className).to.contain("lm-MenuBar-item")
        bar.dispose()
      })
    })
    context("`menuRequested` signal", () => {
      it("should activate the next menu", () => {
        const bar = createMenuBar()
        bar.openActiveMenu()
        ;(bar.activeMenu!.menuRequested as any).emit("next")
        expect(bar.activeIndex).toEqual(1)
        bar.dispose()
      })
      it("should activate the previous menu", () => {
        const bar = createMenuBar()
        bar.openActiveMenu()
        ;(bar.activeMenu!.menuRequested as any).emit("previous")
        expect(bar.activeIndex).toEqual(2)
        bar.dispose()
      })
      it("should be a no-op if the sender is not the open menu", () => {
        const bar = createMenuBar()
        ;(bar.activeMenu!.menuRequested as any).emit("next")
        expect(bar.activeIndex).toEqual(0)
        bar.dispose()
      })
    })
    describe(".Renderer", () => {
      const renderer = new MenuBar.Renderer()
      let data: MenuBar.IRenderData
      before(() => {
        const widget = new Widget()
        widget.title.label = "foo"
        widget.title.iconClass = "bar"
        widget.title.className = "baz"
        widget.title.closable = true
        data = {
          title: widget.title,
          active: true,
        }
      })
      describe("#renderItem()", () => {
        it("should render the virtual element for a menu bar item", () => {
          const node = VirtualDOM.realize(renderer.renderItem(data))
          expect(node.classList.contains("lm-MenuBar-item")).toEqual(true)
          expect(
            node.getElementsByClassName("lm-MenuBar-itemIcon").length
          ).toEqual(1)
          expect(
            node.getElementsByClassName("lm-MenuBar-itemLabel").length
          ).toEqual(1)
        })
      })
      describe("#renderIcon()", () => {
        it("should render the icon element for a menu bar item", () => {
          const node = VirtualDOM.realize(renderer.renderIcon(data))
          expect(node.className).to.contain("lm-MenuBar-itemIcon")
          expect(node.className).to.contain("bar")
        })
      })
      describe("#renderLabel()", () => {
        it("should render the label element for a menu item", () => {
          const node = VirtualDOM.realize(renderer.renderLabel(data))
          expect(node.className).to.contain("lm-MenuBar-itemLabel")
          expect(node.textContent).toEqual("foo")
        })
      })
      describe("#createItemClass()", () => {
        it("should create the class name for the menu bar item", () => {
          const itemClass = renderer.createItemClass(data)
          expect(itemClass).to.contain("baz")
          expect(itemClass).to.contain("lm-mod-active")
        })
      })
      describe("#createIconClass()", () => {
        it("should create the class name for the menu bar item icon", () => {
          const iconClass = renderer.createIconClass(data)
          expect(iconClass).to.contain("lm-MenuBar-itemIcon")
          expect(iconClass).to.contain("bar")
        })
      })
      describe("#formatLabel()", () => {
        it("should format a label into HTML for display", () => {
          data.title.mnemonic = 1
          const label = renderer.formatLabel(data)
          expect((label as any)[0]).toEqual("f")
          const node = VirtualDOM.realize((label as any)[1] as VirtualElement)
          expect(node.className).to.contain("lm-MenuBar-itemMnemonic")
          expect(node.textContent).toEqual("o")
          expect((label as any)[2]).toEqual("o")
        })
        it("should not add a mnemonic if the index is out of range", () => {
          data.title.mnemonic = -1
          const label = renderer.formatLabel(data)
          expect(label).toEqual("foo")
        })
      })
    })
    describe(".defaultRenderer", () => {
      it("should be an instance of `Renderer`", () => {
        expect(MenuBar.defaultRenderer).to.be.an.instanceof(MenuBar.Renderer)
      })
    })
  })
})
describe("../../src/lumino/widgets", () => {
  describe("Panel", () => {
    describe("#constructor()", () => {
      it("should take no arguments", () => {
        const panel = new Panel()
        expect(panel).to.be.an.instanceof(Panel)
      })
      it("should accept options", () => {
        const layout = new PanelLayout()
        const panel = new Panel({ layout })
        expect(panel.layout).toEqual(layout)
      })
      it("should add the `lm-Panel` class", () => {
        const panel = new Panel()
        expect(panel.hasClass("lm-Panel")).toEqual(true)
      })
    })
    describe("#widgets", () => {
      it("should be a read-only array of widgets in the panel", () => {
        const panel = new Panel()
        const widget = new Widget()
        panel.addWidget(widget)
        expect(panel.widgets).to.deep.equal([widget])
      })
    })
    describe("#addWidget()", () => {
      it("should add a widget to the end of the panel", () => {
        const panel = new Panel()
        const widget = new Widget()
        panel.addWidget(new Widget())
        panel.addWidget(widget)
        expect(panel.widgets[1]).toEqual(widget)
      })
      it("should move an existing widget to the end", () => {
        const panel = new Panel()
        const widget = new Widget()
        panel.addWidget(widget)
        panel.addWidget(new Widget())
        panel.addWidget(widget)
        expect(panel.widgets[1]).toEqual(widget)
      })
    })
    describe("#insertWidget()", () => {
      it("should insert a widget at the specified index", () => {
        const panel = new Panel()
        const widget = new Widget()
        panel.addWidget(new Widget())
        panel.insertWidget(0, widget)
        expect(panel.widgets[0]).toEqual(widget)
      })
      it("should move an existing widget to the specified index", () => {
        const panel = new Panel()
        const widget = new Widget()
        panel.addWidget(new Widget())
        panel.addWidget(widget)
        panel.insertWidget(0, widget)
        expect(panel.widgets[0]).toEqual(widget)
      })
    })
  })
})
class LogHook implements IMessageHook {
  messages: string[] = []
  messageHook(target: IMessageHandler, msg: Message): boolean {
    this.messages.push(msg.type)
    return true
  }
}
class LogPanelLayout extends PanelLayout {
  methods: string[] = []
  protected init(): void {
    super.init()
    this.methods.push("init")
  }
  protected attachWidget(index: number, widget: Widget): void {
    super.attachWidget(index, widget)
    this.methods.push("attachWidget")
  }
  protected moveWidget(
    fromIndex: number,
    toIndex: number,
    widget: Widget
  ): void {
    super.moveWidget(fromIndex, toIndex, widget)
    this.methods.push("moveWidget")
  }
  protected detachWidget(index: number, widget: Widget): void {
    super.detachWidget(index, widget)
    this.methods.push("detachWidget")
  }
  protected onChildRemoved(msg: Widget.ChildMessage): void {
    super.onChildRemoved(msg)
    this.methods.push("onChildRemoved")
  }
}
describe("../../src/lumino/widgets", () => {
  describe("PanelLayout", () => {
    describe("#dispose()", () => {
      it("should dispose of the resources held by the widget", () => {
        const layout = new PanelLayout()
        const widgets = [new Widget(), new Widget()]
        widgets.forEach(w => {
          layout.addWidget(w)
        })
        layout.dispose()
        expect(every(widgets, w => w.isDisposed)).toEqual(true)
      })
    })
    describe("#widgets", () => {
      it("should be a read-only sequence of widgets in the layout", () => {
        const layout = new PanelLayout()
        const widget = new Widget()
        layout.addWidget(widget)
        const widgets = layout.widgets
        expect(widgets.length).toEqual(1)
        expect(widgets[0]).toEqual(widget)
      })
    })
    describe("[Symbol.iterator]()", () => {
      it("should create an iterator over the widgets in the layout", () => {
        const layout = new PanelLayout()
        const widgets = [new Widget(), new Widget()]
        widgets.forEach(w => {
          layout.addWidget(w)
        })
        widgets.forEach(w => {
          w.title.label = "foo"
        })
        expect(every(layout, w => w.title.label === "foo")).toEqual(true)
        const it1 = layout[Symbol.iterator](),
          it2 = layout[Symbol.iterator]()
        expect(it1).to.not.equal(it2)
      })
    })
    describe("#addWidget()", () => {
      it("should add a widget to the end of the layout", () => {
        const layout = new PanelLayout()
        layout.addWidget(new Widget())
        const widget = new Widget()
        layout.addWidget(widget)
        expect(layout.widgets[1]).toEqual(widget)
      })
      it("should move an existing widget to the end", () => {
        const layout = new PanelLayout()
        const widget = new Widget()
        layout.addWidget(widget)
        layout.addWidget(new Widget())
        layout.addWidget(widget)
        expect(layout.widgets[1]).toEqual(widget)
      })
    })
    describe("#insertWidget()", () => {
      it("should insert a widget at the specified index", () => {
        const layout = new PanelLayout()
        layout.addWidget(new Widget())
        const widget = new Widget()
        layout.insertWidget(0, widget)
        expect(layout.widgets[0]).toEqual(widget)
      })
      it("should move an existing widget to the specified index", () => {
        const layout = new PanelLayout()
        layout.addWidget(new Widget())
        const widget = new Widget()
        layout.addWidget(widget)
        layout.insertWidget(0, widget)
        expect(layout.widgets[0]).toEqual(widget)
      })
      it("should clamp the index to the bounds of the widgets", () => {
        const layout = new PanelLayout()
        layout.addWidget(new Widget())
        const widget = new Widget()
        layout.insertWidget(-2, widget)
        expect(layout.widgets[0]).toEqual(widget)
        layout.insertWidget(10, widget)
        expect(layout.widgets[1]).toEqual(widget)
      })
      it("should be a no-op if the index does not change", () => {
        const layout = new PanelLayout()
        const widget = new Widget()
        layout.addWidget(widget)
        layout.addWidget(new Widget())
        layout.insertWidget(0, widget)
        expect(layout.widgets[0]).toEqual(widget)
      })
    })
    describe("#removeWidget()", () => {
      it("should remove a widget by value", () => {
        const layout = new PanelLayout()
        const widget = new Widget()
        layout.addWidget(widget)
        layout.addWidget(new Widget())
        layout.removeWidget(widget)
        expect(layout.widgets.length).toEqual(1)
        expect(layout.widgets[0]).to.not.equal(widget)
      })
    })
    describe("#removeWidgetAt()", () => {
      it("should remove a widget at a given index", () => {
        const layout = new PanelLayout()
        const widget = new Widget()
        layout.addWidget(widget)
        layout.addWidget(new Widget())
        layout.removeWidgetAt(0)
        expect(layout.widgets.length).toEqual(1)
        expect(layout.widgets[0]).to.not.equal(widget)
      })
    })
    describe("#init()", () => {
      it("should be invoked when the layout is installed on its parent", () => {
        const widget = new Widget()
        const layout = new LogPanelLayout()
        widget.layout = layout
        expect(layout.methods).to.contain("init")
      })
      it("should attach all widgets to the DOM", () => {
        const parent = new Widget()
        Widget.attach(parent, document.body)
        const layout = new LogPanelLayout()
        const widgets = [new Widget(), new Widget(), new Widget()]
        widgets.forEach(w => {
          layout.addWidget(w)
        })
        parent.layout = layout
        expect(every(widgets, w => w.parent === parent)).toEqual(true)
        expect(every(widgets, w => w.isAttached)).toEqual(true)
        parent.dispose()
      })
    })
    describe("#attachWidget()", () => {
      it("should attach a widget to the parent's DOM node", () => {
        const panel = new Widget()
        const layout = new LogPanelLayout()
        const widget = new Widget()
        panel.layout = layout
        layout.insertWidget(0, widget)
        expect(layout.methods).to.contain("attachWidget")
        expect(panel.node.children[0]).toEqual(widget.node)
        panel.dispose()
      })
      it("should send before/after attach messages if the parent is attached", () => {
        const panel = new Widget()
        const layout = new LogPanelLayout()
        const widget = new Widget()
        const hook = new LogHook()
        panel.layout = layout
        MessageLoop.installMessageHook(widget, hook)
        Widget.attach(panel, document.body)
        layout.insertWidget(0, widget)
        expect(layout.methods).to.contain("attachWidget")
        expect(hook.messages).to.contain("before-attach")
        expect(hook.messages).to.contain("after-attach")
        panel.dispose()
      })
    })
    describe("#moveWidget()", () => {
      it("should move a widget in the parent's DOM node", () => {
        const panel = new Widget()
        const layout = new LogPanelLayout()
        const widget = new Widget()
        panel.layout = layout
        layout.addWidget(widget)
        layout.addWidget(new Widget())
        layout.insertWidget(1, widget)
        expect(layout.methods).to.contain("moveWidget")
        expect(panel.node.children[1]).toEqual(widget.node)
        panel.dispose()
      })
      it("should send before/after detach/attach messages if the parent is attached", () => {
        const panel = new Widget()
        const layout = new LogPanelLayout()
        const widget = new Widget()
        const hook = new LogHook()
        MessageLoop.installMessageHook(widget, hook)
        panel.layout = layout
        Widget.attach(panel, document.body)
        layout.addWidget(widget)
        layout.addWidget(new Widget())
        layout.insertWidget(1, widget)
        expect(layout.methods).to.contain("moveWidget")
        expect(hook.messages).to.contain("before-detach")
        expect(hook.messages).to.contain("after-detach")
        expect(hook.messages).to.contain("before-attach")
        expect(hook.messages).to.contain("after-attach")
        panel.dispose()
      })
    })
    describe("#detachWidget()", () => {
      it("should detach a widget from the parent's DOM node", () => {
        const panel = new Widget()
        const layout = new LogPanelLayout()
        const widget = new Widget()
        panel.layout = layout
        layout.insertWidget(0, widget)
        expect(panel.node.children[0]).toEqual(widget.node)
        layout.removeWidget(widget)
        expect(layout.methods).to.contain("detachWidget")
        panel.dispose()
      })
      it("should send before/after detach message if the parent is attached", () => {
        const panel = new Widget()
        const layout = new LogPanelLayout()
        const widget = new Widget()
        const hook = new LogHook()
        MessageLoop.installMessageHook(widget, hook)
        panel.layout = layout
        Widget.attach(panel, document.body)
        layout.insertWidget(0, widget)
        expect(panel.node.children[0]).toEqual(widget.node)
        layout.removeWidget(widget)
        expect(layout.methods).to.contain("detachWidget")
        expect(hook.messages).to.contain("before-detach")
        expect(hook.messages).to.contain("after-detach")
        panel.dispose()
      })
    })
    describe("#onChildRemoved()", () => {
      it("should be called when a widget is removed from its parent", () => {
        const panel = new Widget()
        const layout = new LogPanelLayout()
        const widget = new Widget()
        panel.layout = layout
        layout.addWidget(widget)
        widget.parent = null
        expect(layout.methods).to.contain("onChildRemoved")
      })
      it("should remove the widget from the layout", () => {
        const panel = new Widget()
        const layout = new LogPanelLayout()
        const widget = new Widget()
        panel.layout = layout
        layout.addWidget(widget)
        widget.parent = null
        expect(layout.widgets.length).toEqual(0)
      })
    })
  })
})
const renderer: SplitLayout.IRenderer = {
  createHandle: () => document.createElement("div"),
}
class LogSplitLayout extends SplitLayout {
  methods: string[] = []
  protected init(): void {
    super.init()
    this.methods.push("init")
  }
  protected attachWidget(index: number, widget: Widget): void {
    super.attachWidget(index, widget)
    this.methods.push("attachWidget")
  }
  protected moveWidget(
    fromIndex: number,
    toIndex: number,
    widget: Widget
  ): void {
    super.moveWidget(fromIndex, toIndex, widget)
    this.methods.push("moveWidget")
  }
  protected detachWidget(index: number, widget: Widget): void {
    super.detachWidget(index, widget)
    this.methods.push("detachWidget")
  }
  protected onAfterShow(msg: Message): void {
    super.onAfterShow(msg)
    this.methods.push("onAfterShow")
  }
  protected onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg)
    this.methods.push("onAfterAttach")
  }
  protected onChildShown(msg: Widget.ChildMessage): void {
    super.onChildShown(msg)
    this.methods.push("onChildShown")
  }
  protected onChildHidden(msg: Widget.ChildMessage): void {
    super.onChildHidden(msg)
    this.methods.push("onChildHidden")
  }
  protected onResize(msg: Widget.ResizeMessage): void {
    super.onResize(msg)
    this.methods.push("onResize")
  }
  protected onUpdateRequest(msg: Message): void {
    super.onUpdateRequest(msg)
    this.methods.push("onUpdateRequest")
  }
  protected onFitRequest(msg: Message): void {
    super.onFitRequest(msg)
    this.methods.push("onFitRequest")
  }
}
class LogHook implements IMessageHook {
  messages: string[] = []
  messageHook(target: IMessageHandler, msg: Message): boolean {
    this.messages.push(msg.type)
    return true
  }
}
describe("../../src/lumino/widgets", () => {
  describe("SplitLayout", () => {
    describe("#constructor()", () => {
      it("should accept a renderer", () => {
        const layout = new SplitLayout({ renderer })
        expect(layout).to.be.an.instanceof(SplitLayout)
      })
    })
    describe("#orientation", () => {
      it("should get the layout orientation for the split layout", () => {
        const layout = new SplitLayout({ renderer })
        expect(layout.orientation).toEqual("horizontal")
      })
      it("should set the layout orientation for the split layout", () => {
        const layout = new SplitLayout({ renderer })
        layout.orientation = "vertical"
        expect(layout.orientation).toEqual("vertical")
      })
      it("should set the orientation attribute of the parent widget", () => {
        const parent = new Widget()
        const layout = new SplitLayout({ renderer })
        parent.layout = layout
        layout.orientation = "vertical"
        expect(parent.node.getAttribute("data-orientation")).toEqual("vertical")
        layout.orientation = "horizontal"
        expect(parent.node.getAttribute("data-orientation")).toEqual(
          "horizontal"
        )
      })
      it("should post a fit request to the parent widget", done => {
        const layout = new LogSplitLayout({ renderer })
        const parent = new Widget()
        parent.layout = layout
        layout.orientation = "vertical"
        requestAnimationFrame(() => {
          expect(layout.methods).to.contain("onFitRequest")
          done()
        })
      })
      it("should be a no-op if the value does not change", done => {
        const layout = new LogSplitLayout({ renderer })
        const parent = new Widget()
        parent.layout = layout
        layout.orientation = "horizontal"
        requestAnimationFrame(() => {
          expect(layout.methods).to.not.contain("onFitRequest")
          done()
        })
      })
    })
    describe("#spacing", () => {
      it("should get the inter-element spacing for the split layout", () => {
        const layout = new SplitLayout({ renderer })
        expect(layout.spacing).toEqual(4)
      })
      it("should set the inter-element spacing for the split layout", () => {
        const layout = new SplitLayout({ renderer })
        layout.spacing = 10
        expect(layout.spacing).toEqual(10)
      })
      it("should post a fit rquest to the parent widget", done => {
        const layout = new LogSplitLayout({ renderer })
        const parent = new Widget()
        parent.layout = layout
        layout.spacing = 10
        requestAnimationFrame(() => {
          expect(layout.methods).to.contain("onFitRequest")
          done()
        })
      })
      it("should be a no-op if the value does not change", done => {
        const layout = new LogSplitLayout({ renderer })
        const parent = new Widget()
        parent.layout = layout
        layout.spacing = 4
        requestAnimationFrame(() => {
          expect(layout.methods).to.not.contain("onFitRequest")
          done()
        })
      })
    })
    describe("#renderer", () => {
      it("should get the renderer for the layout", () => {
        const layout = new SplitLayout({ renderer })
        expect(layout.renderer).toEqual(renderer)
      })
    })
    describe("#handles", () => {
      it("should be a read-only sequence of the split handles in the layout", () => {
        const layout = new SplitLayout({ renderer })
        const widgets = [new Widget(), new Widget(), new Widget()]
        widgets.forEach(w => {
          layout.addWidget(w)
        })
        expect(every(layout.handles, h => h instanceof HTMLElement))
      })
    })
    describe("#relativeSizes()", () => {
      it("should get the current sizes of the widgets in the layout", () => {
        const layout = new SplitLayout({ renderer })
        const widgets = [new Widget(), new Widget(), new Widget()]
        const parent = new Widget()
        parent.layout = layout
        widgets.forEach(w => {
          layout.addWidget(w)
        })
        const sizes = layout.relativeSizes()
        expect(sizes).to.deep.equal([1 / 3, 1 / 3, 1 / 3])
        parent.dispose()
      })
    })
    describe("#setRelativeSizes()", () => {
      it("should set the desired sizes for the widgets in the panel", () => {
        const layout = new SplitLayout({ renderer })
        const widgets = [new Widget(), new Widget(), new Widget()]
        const parent = new Widget()
        parent.layout = layout
        widgets.forEach(w => {
          layout.addWidget(w)
        })
        layout.setRelativeSizes([10, 10, 10])
        const sizes = layout.relativeSizes()
        expect(sizes).to.deep.equal([10 / 30, 10 / 30, 10 / 30])
        parent.dispose()
      })
      it("should ignore extra values", () => {
        const layout = new SplitLayout({ renderer })
        const widgets = [new Widget(), new Widget(), new Widget()]
        const parent = new Widget()
        parent.layout = layout
        widgets.forEach(w => {
          layout.addWidget(w)
        })
        layout.setRelativeSizes([10, 15, 20, 20])
        const sizes = layout.relativeSizes()
        expect(sizes).to.deep.equal([10 / 45, 15 / 45, 20 / 45])
        parent.dispose()
      })
    })
    describe("#moveHandle()", () => {
      it("should set the offset position of a split handle", done => {
        const parent = new Widget()
        const layout = new SplitLayout({ renderer })
        const widgets = [new Widget(), new Widget(), new Widget()]
        widgets.forEach(w => {
          layout.addWidget(w)
        })
        widgets.forEach(w => {
          w.node.style.minHeight = "100px"
        })
        widgets.forEach(w => {
          w.node.style.minWidth = "100px"
        })
        parent.layout = layout
        Widget.attach(parent, document.body)
        MessageLoop.flush()
        const handle = layout.handles[1]
        const left = handle.offsetLeft
        layout.moveHandle(1, left + 20)
        requestAnimationFrame(() => {
          expect(handle.offsetLeft).to.not.equal(left)
          done()
        })
      })
    })
    describe("#init()", () => {
      it("should set the orientation attribute of the parent widget", () => {
        const parent = new Widget()
        const layout = new LogSplitLayout({ renderer })
        parent.layout = layout
        expect(layout.methods).to.contain("init")
        expect(parent.node.getAttribute("data-orientation")).toEqual(
          "horizontal"
        )
      })
      it("should attach all widgets to the DOM", () => {
        const parent = new Widget()
        Widget.attach(parent, document.body)
        const layout = new LogSplitLayout({ renderer })
        const widgets = [new Widget(), new Widget(), new Widget()]
        widgets.forEach(w => {
          layout.addWidget(w)
        })
        parent.layout = layout
        expect(every(widgets, w => w.parent === parent)).toEqual(true)
        expect(every(widgets, w => w.isAttached)).toEqual(true)
        parent.dispose()
      })
    })
    describe("#attachWidget()", () => {
      it("should attach a widget to the parent's DOM node", () => {
        const layout = new LogSplitLayout({ renderer })
        const parent = new Widget()
        parent.layout = layout
        const widget = new Widget()
        layout.addWidget(widget)
        expect(layout.methods).to.contain("attachWidget")
        expect(parent.node.contains(widget.node)).toEqual(true)
        expect(layout.handles.length).toEqual(1)
      })
      it("should send before/after attach messages if the parent is attached", () => {
        const layout = new LogSplitLayout({ renderer })
        const parent = new Widget()
        const widget = new Widget()
        const hook = new LogHook()
        MessageLoop.installMessageHook(widget, hook)
        parent.layout = layout
        Widget.attach(parent, document.body)
        layout.addWidget(widget)
        expect(hook.messages).to.contain("before-attach")
        expect(hook.messages).to.contain("after-attach")
      })
      it("should post a layout request for the parent widget", done => {
        const layout = new LogSplitLayout({ renderer })
        const parent = new Widget()
        parent.layout = layout
        const widget = new Widget()
        Widget.attach(parent, document.body)
        layout.addWidget(widget)
        requestAnimationFrame(() => {
          expect(layout.methods).to.contain("onFitRequest")
          done()
        })
      })
    })
    describe("#moveWidget()", () => {
      it("should move a widget in the parent's DOM node", () => {
        const layout = new LogSplitLayout({ renderer })
        const widgets = [new Widget(), new Widget(), new Widget()]
        const parent = new Widget()
        parent.layout = layout
        widgets.forEach(w => {
          layout.addWidget(w)
        })
        const widget = widgets[0]
        const handle = layout.handles[0]
        layout.insertWidget(2, widget)
        expect(layout.methods).to.contain("moveWidget")
        expect(layout.handles[2]).toEqual(handle)
        expect(layout.widgets[2]).toEqual(widget)
      })
      it("should post a a layout request to the parent", done => {
        const layout = new LogSplitLayout({ renderer })
        const widgets = [new Widget(), new Widget(), new Widget()]
        const parent = new Widget()
        parent.layout = layout
        widgets.forEach(w => {
          layout.addWidget(w)
        })
        const widget = widgets[0]
        layout.insertWidget(2, widget)
        requestAnimationFrame(() => {
          expect(layout.methods).to.contain("onFitRequest")
          done()
        })
      })
    })
    describe("#detachWidget()", () => {
      it("should detach a widget from the parent's DOM node", () => {
        const layout = new LogSplitLayout({ renderer })
        const widget = new Widget()
        const parent = new Widget()
        parent.layout = layout
        layout.addWidget(widget)
        layout.removeWidget(widget)
        expect(layout.methods).to.contain("detachWidget")
        expect(parent.node.contains(widget.node)).toEqual(false)
        parent.dispose()
      })
      it("should send before/after detach message if the parent is attached", () => {
        const layout = new LogSplitLayout({ renderer })
        const parent = new Widget()
        const widget = new Widget()
        const hook = new LogHook()
        MessageLoop.installMessageHook(widget, hook)
        parent.layout = layout
        layout.addWidget(widget)
        Widget.attach(parent, document.body)
        layout.removeWidget(widget)
        expect(layout.methods).to.contain("detachWidget")
        expect(hook.messages).to.contain("before-detach")
        expect(hook.messages).to.contain("after-detach")
        parent.dispose()
      })
      it("should post a a layout request to the parent", done => {
        const layout = new LogSplitLayout({ renderer })
        const widget = new Widget()
        const parent = new Widget()
        parent.layout = layout
        layout.addWidget(widget)
        Widget.attach(parent, document.body)
        layout.removeWidget(widget)
        requestAnimationFrame(() => {
          expect(layout.methods).to.contain("onFitRequest")
          parent.dispose()
          done()
        })
      })
    })
    describe("#onAfterShow()", () => {
      it("should post an update to the parent", done => {
        const layout = new LogSplitLayout({ renderer })
        const parent = new Widget()
        parent.layout = layout
        parent.hide()
        Widget.attach(parent, document.body)
        parent.show()
        expect(layout.methods).to.contain("onAfterShow")
        requestAnimationFrame(() => {
          expect(layout.methods).to.contain("onUpdateRequest")
          parent.dispose()
          done()
        })
      })
    })
    describe("#onAfterAttach()", () => {
      it("should post a layout request to the parent", done => {
        const layout = new LogSplitLayout({ renderer })
        const parent = new Widget()
        parent.layout = layout
        Widget.attach(parent, document.body)
        expect(layout.methods).to.contain("onAfterAttach")
        requestAnimationFrame(() => {
          expect(layout.methods).to.contain("onFitRequest")
          parent.dispose()
          done()
        })
      })
    })
    describe("#onChildShown()", () => {
      it("should post a fit request to the parent", done => {
        const parent = new Widget()
        const layout = new LogSplitLayout({ renderer })
        parent.layout = layout
        const widgets = [new Widget(), new Widget(), new Widget()]
        widgets[0].hide()
        widgets.forEach(w => {
          layout.addWidget(w)
        })
        Widget.attach(parent, document.body)
        widgets[0].show()
        expect(layout.methods).to.contain("onChildShown")
        requestAnimationFrame(() => {
          expect(layout.methods).to.contain("onFitRequest")
          parent.dispose()
          done()
        })
      })
    })
    describe("#onChildHidden()", () => {
      it("should post a fit request to the parent", done => {
        const parent = new Widget()
        const layout = new LogSplitLayout({ renderer })
        parent.layout = layout
        const widgets = [new Widget(), new Widget(), new Widget()]
        widgets.forEach(w => {
          layout.addWidget(w)
        })
        Widget.attach(parent, document.body)
        widgets[0].hide()
        expect(layout.methods).to.contain("onChildHidden")
        requestAnimationFrame(() => {
          expect(layout.methods).to.contain("onFitRequest")
          parent.dispose()
          done()
        })
      })
    })
    describe("#onResize", () => {
      it("should be called when a resize event is sent to the parent", () => {
        const parent = new Widget()
        const layout = new LogSplitLayout({ renderer })
        parent.layout = layout
        const widgets = [new Widget(), new Widget(), new Widget()]
        widgets.forEach(w => {
          layout.addWidget(w)
        })
        Widget.attach(parent, document.body)
        MessageLoop.sendMessage(parent, Widget.ResizeMessage.UnknownSize)
        expect(layout.methods).to.contain("onResize")
        parent.dispose()
      })
    })
    describe(".getStretch()", () => {
      it("should get the split layout stretch factor for the given widget", () => {
        const widget = new Widget()
        expect(SplitLayout.getStretch(widget)).toEqual(0)
      })
    })
    describe(".setStretch()", () => {
      it("should set the split layout stretch factor for the given widget", () => {
        const widget = new Widget()
        SplitLayout.setStretch(widget, 10)
        expect(SplitLayout.getStretch(widget)).toEqual(10)
      })
      it("should post a fit request to the parent", done => {
        const parent = new Widget()
        const widget = new Widget()
        const layout = new LogSplitLayout({ renderer })
        parent.layout = layout
        layout.addWidget(widget)
        SplitLayout.setStretch(widget, 10)
        requestAnimationFrame(() => {
          expect(layout.methods).to.contain("onFitRequest")
          done()
        })
      })
    })
  })
})
const bubbles = true
const renderer: SplitPanel.IRenderer = {
  createHandle: () => document.createElement("div"),
}
function dragHandle(panel: LogSplitPanel): void {
  MessageLoop.sendMessage(panel, Widget.Msg.UpdateRequest)
  const handle = panel.handles[0]
  const rect = handle.getBoundingClientRect()
  let args = { bubbles, clientX: rect.left + 1, clientY: rect.top + 1 }
  handle.dispatchEvent(new PointerEvent("pointerdown", args))
  args = { bubbles, clientX: rect.left + 10, clientY: rect.top + 1 }
  document.body.dispatchEvent(new PointerEvent("pointermove", args))
  document.body.dispatchEvent(new PointerEvent("pointerup", { bubbles }))
}
class LogSplitPanel extends SplitPanel {
  events: string[] = []
  handleEvent(event: Event): void {
    super.handleEvent(event)
    this.events.push(event.type)
  }
}
describe("../../src/lumino/widgets", () => {
  describe("SplitPanel", () => {
    describe("#constructor()", () => {
      it("should accept no arguments", () => {
        const panel = new SplitPanel()
        expect(panel).to.be.an.instanceof(SplitPanel)
      })
      it("should accept options", () => {
        const panel = new SplitPanel({
          orientation: "vertical",
          spacing: 5,
          renderer,
        })
        expect(panel.orientation).toEqual("vertical")
        expect(panel.spacing).toEqual(5)
        expect(panel.renderer).toEqual(renderer)
      })
      it("should accept a layout option", () => {
        const layout = new SplitLayout({ renderer })
        const panel = new SplitPanel({ layout })
        expect(panel.layout).toEqual(layout)
      })
      it("should ignore other options if a layout is given", () => {
        const ignored = Object.create(renderer)
        const layout = new SplitLayout({ renderer })
        const panel = new SplitPanel({
          layout,
          orientation: "vertical",
          spacing: 5,
          renderer: ignored,
        })
        expect(panel.layout).toEqual(layout)
        expect(panel.orientation).toEqual("horizontal")
        expect(panel.spacing).toEqual(4)
        expect(panel.renderer).toEqual(renderer)
      })
      it("should add the `lm-SplitPanel` class", () => {
        const panel = new SplitPanel()
        expect(panel.hasClass("lm-SplitPanel")).toEqual(true)
      })
    })
    describe("#dispose()", () => {
      it("should dispose of the resources held by the panel", () => {
        const panel = new LogSplitPanel()
        const layout = panel.layout as SplitLayout
        const widgets = [new Widget(), new Widget(), new Widget()]
        widgets.forEach(w => {
          panel.addWidget(w)
        })
        Widget.attach(panel, document.body)
        const handle = layout.handles[0]
        handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles }))
        expect(panel.events).to.contain("pointerdown")
        panel.node.dispatchEvent(new KeyboardEvent("keydown", { bubbles }))
        expect(panel.events).to.contain("keydown")
        const node = panel.node
        panel.dispose()
        expect(every(widgets, w => w.isDisposed))
        node.dispatchEvent(new MouseEvent("contextmenu", { bubbles }))
        expect(panel.events).to.not.contain("contextmenu")
      })
    })
    describe("#orientation", () => {
      it("should get the layout orientation for the split panel", () => {
        const panel = new SplitPanel()
        expect(panel.orientation).toEqual("horizontal")
      })
      it("should set the layout orientation for the split panel", () => {
        const panel = new SplitPanel()
        panel.orientation = "vertical"
        expect(panel.orientation).toEqual("vertical")
      })
    })
    describe("#spacing", () => {
      it("should default to `4`", () => {
        const panel = new SplitPanel()
        expect(panel.spacing).toEqual(4)
      })
      it("should set the spacing for the panel", () => {
        const panel = new SplitPanel()
        panel.spacing = 10
        expect(panel.spacing).toEqual(10)
      })
    })
    describe("#renderer", () => {
      it("should get the renderer for the panel", () => {
        const panel = new SplitPanel({ renderer })
        expect(panel.renderer).toEqual(renderer)
      })
    })
    describe("#handleMoved", () => {
      it("should be emitted when a handle is moved by the user", done => {
        const panel = new LogSplitPanel()
        const widgets = [new Widget(), new Widget()]
        panel.orientation = "horizontal"
        widgets.forEach(w => {
          w.node.style.minHeight = "40px"
          w.node.style.minWidth = "40px"
          panel.addWidget(w)
        })
        panel.setRelativeSizes([40, 80])
        Widget.attach(panel, document.body)
        panel.handleMoved.connect((sender, _) => {
          expect(sender).toEqual(panel)
          done()
        })
        dragHandle(panel)
      })
    })
    describe("#handles", () => {
      it("should get the read-only sequence of the split handles in the panel", () => {
        const panel = new SplitPanel()
        const widgets = [new Widget(), new Widget(), new Widget()]
        widgets.forEach(w => {
          panel.addWidget(w)
        })
        expect(panel.handles.length).toEqual(3)
      })
    })
    describe("#relativeSizes()", () => {
      it("should get the current sizes of the widgets in the panel", () => {
        const panel = new SplitPanel()
        const widgets = [new Widget(), new Widget(), new Widget()]
        widgets.forEach(w => {
          panel.addWidget(w)
        })
        const sizes = panel.relativeSizes()
        expect(sizes).to.deep.equal([1 / 3, 1 / 3, 1 / 3])
      })
    })
    describe("#setRelativeSizes()", () => {
      it("should set the desired sizes for the widgets in the panel", () => {
        const panel = new SplitPanel()
        const widgets = [new Widget(), new Widget(), new Widget()]
        widgets.forEach(w => {
          panel.addWidget(w)
        })
        panel.setRelativeSizes([10, 20, 30])
        const sizes = panel.relativeSizes()
        expect(sizes).to.deep.equal([10 / 60, 20 / 60, 30 / 60])
      })
      it("should ignore extra values", () => {
        const panel = new SplitPanel()
        const widgets = [new Widget(), new Widget(), new Widget()]
        widgets.forEach(w => {
          panel.addWidget(w)
        })
        panel.setRelativeSizes([10, 30, 40, 20])
        const sizes = panel.relativeSizes()
        expect(sizes).to.deep.equal([10 / 80, 30 / 80, 40 / 80])
      })
    })
    describe("#handleEvent()", () => {
      let panel: LogSplitPanel
      let layout: SplitLayout
      beforeEach(() => {
        panel = new LogSplitPanel()
        layout = panel.layout as SplitLayout
        const widgets = [new Widget(), new Widget(), new Widget()]
        widgets.forEach(w => {
          panel.addWidget(w)
        })
        panel.setRelativeSizes([10, 10, 10, 20])
        Widget.attach(panel, document.body)
        MessageLoop.flush()
      })
      afterEach(() => {
        panel.dispose()
      })
      context("pointerdown", () => {
        it("should attach other event listeners", () => {
          const handle = layout.handles[0]
          const body = document.body
          handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles }))
          expect(panel.events).to.contain("pointerdown")
          body.dispatchEvent(new PointerEvent("pointermove", { bubbles }))
          expect(panel.events).to.contain("pointermove")
          body.dispatchEvent(new KeyboardEvent("keydown", { bubbles }))
          expect(panel.events).to.contain("keydown")
          body.dispatchEvent(new MouseEvent("contextmenu", { bubbles }))
          expect(panel.events).to.contain("contextmenu")
          body.dispatchEvent(new PointerEvent("pointerup", { bubbles }))
          expect(panel.events).to.contain("pointerup")
        })
        it("should be a no-op if it is not the left button", () => {
          layout.handles[0].dispatchEvent(
            new PointerEvent("pointerdown", {
              bubbles,
              button: 1,
            })
          )
          expect(panel.events).to.contain("pointerdown")
          document.body.dispatchEvent(
            new PointerEvent("pointermove", { bubbles })
          )
          expect(panel.events).to.not.contain("pointermove")
        })
      })
      context("pointermove", () => {
        it("should move the handle right", done => {
          const handle = layout.handles[1]
          const rect = handle.getBoundingClientRect()
          handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles }))
          document.body.dispatchEvent(
            new PointerEvent("pointermove", {
              bubbles,
              clientX: rect.left + 10,
              clientY: rect.top,
            })
          )
          requestAnimationFrame(() => {
            const newRect = handle.getBoundingClientRect()
            expect(newRect.left).to.not.equal(rect.left)
            done()
          })
        })
        it("should move the handle down", done => {
          panel.orientation = "vertical"
          panel.widgets.forEach(w => {
            w.node.style.minHeight = "20px"
          })
          const handle = layout.handles[1]
          const rect = handle.getBoundingClientRect()
          handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles }))
          document.body.dispatchEvent(
            new PointerEvent("pointermove", {
              bubbles,
              clientX: rect.left,
              clientY: rect.top - 2,
            })
          )
          requestAnimationFrame(() => {
            const newRect = handle.getBoundingClientRect()
            expect(newRect.top).to.not.equal(rect.top)
            done()
          })
        })
      })
      context("pointerup", () => {
        it("should remove the event listeners", () => {
          const handle = layout.handles[0]
          const body = document.body
          handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles }))
          expect(panel.events).to.contain("pointerdown")
          body.dispatchEvent(new PointerEvent("pointerup", { bubbles }))
          expect(panel.events).to.contain("pointerup")
          body.dispatchEvent(new PointerEvent("pointermove", { bubbles }))
          expect(panel.events).to.not.contain("pointermove")
          body.dispatchEvent(new KeyboardEvent("keydown", { bubbles }))
          expect(panel.events).to.not.contain("keydown")
          body.dispatchEvent(new MouseEvent("contextmenu", { bubbles }))
          expect(panel.events).to.not.contain("contextmenu")
        })
        it("should be a no-op if not the left button", () => {
          const handle = layout.handles[0]
          const body = document.body
          handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles }))
          expect(panel.events).to.contain("pointerdown")
          body.dispatchEvent(
            new PointerEvent("pointerup", {
              bubbles,
              button: 1,
            })
          )
          expect(panel.events).to.contain("pointerup")
          body.dispatchEvent(new PointerEvent("pointermove", { bubbles }))
          expect(panel.events).to.contain("pointermove")
        })
      })
      context("keydown", () => {
        it("should release the mouse if `Escape` is pressed", () => {
          const handle = layout.handles[0]
          handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles }))
          panel.node.dispatchEvent(
            new KeyboardEvent("keydown", {
              bubbles,
              keyCode: 27,
            })
          )
          expect(panel.events).to.contain("keydown")
          panel.node.dispatchEvent(new PointerEvent("pointermove", { bubbles }))
          expect(panel.events).to.not.contain("pointermove")
        })
      })
      context("contextmenu", () => {
        it("should prevent events during drag", () => {
          const handle = layout.handles[0]
          handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles }))
          const event = new MouseEvent("contextmenu", {
            bubbles,
            cancelable: true,
          })
          const cancelled = !document.body.dispatchEvent(event)
          expect(cancelled).toEqual(true)
          expect(panel.events).to.contain("contextmenu")
        })
      })
    })
    describe("#onAfterAttach()", () => {
      it("should attach a pointerdown listener to the node", () => {
        const panel = new LogSplitPanel()
        Widget.attach(panel, document.body)
        panel.node.dispatchEvent(new PointerEvent("pointerdown", { bubbles }))
        expect(panel.events).to.contain("pointerdown")
        panel.dispose()
      })
    })
    describe("#onBeforeDetach()", () => {
      it("should remove all listeners", () => {
        const panel = new LogSplitPanel()
        Widget.attach(panel, document.body)
        panel.node.dispatchEvent(new PointerEvent("pointerdown", { bubbles }))
        expect(panel.events).to.contain("pointerdown")
        Widget.detach(panel)
        panel.events = []
        panel.node.dispatchEvent(new PointerEvent("pointerdown", { bubbles }))
        expect(panel.events).to.not.contain("pointerdown")
        document.body.dispatchEvent(new KeyboardEvent("keyup", { bubbles }))
        expect(panel.events).to.not.contain("keyup")
      })
    })
    describe("#onChildAdded()", () => {
      it("should add a class to the child widget", () => {
        const panel = new SplitPanel()
        const widget = new Widget()
        panel.addWidget(widget)
        expect(widget.hasClass("lm-SplitPanel-child")).toEqual(true)
      })
    })
    describe("#onChildRemoved()", () => {
      it("should remove a class to the child widget", () => {
        const panel = new SplitPanel()
        const widget = new Widget()
        panel.addWidget(widget)
        widget.parent = null
        expect(widget.hasClass("lm-SplitPanel-child")).toEqual(false)
      })
    })
    describe(".Renderer()", () => {
      describe("#createHandle()", () => {
        it("should create a new handle node", () => {
          const renderer = new SplitPanel.Renderer()
          const node1 = renderer.createHandle()
          const node2 = renderer.createHandle()
          expect(node1).to.be.an.instanceof(HTMLElement)
          expect(node2).to.be.an.instanceof(HTMLElement)
          expect(node1).to.not.equal(node2)
        })
        it('should add the "lm-SplitPanel-handle" class', () => {
          const renderer = new SplitPanel.Renderer()
          const node = renderer.createHandle()
          expect(node.classList.contains("lm-SplitPanel-handle")).toEqual(true)
        })
      })
    })
    describe(".defaultRenderer", () => {
      it("should be an instance of `Renderer`", () => {
        expect(SplitPanel.defaultRenderer).to.be.an.instanceof(
          SplitPanel.Renderer
        )
      })
    })
    describe(".getStretch()", () => {
      it("should get the split panel stretch factor for the given widget", () => {
        const widget = new Widget()
        expect(SplitPanel.getStretch(widget)).toEqual(0)
      })
    })
    describe(".setStretch()", () => {
      it("should set the split panel stretch factor for the given widget", () => {
        const widget = new Widget()
        SplitPanel.setStretch(widget, 10)
        expect(SplitPanel.getStretch(widget)).toEqual(10)
      })
    })
  })
})
class LogHook implements IMessageHook {
  messages: string[] = []
  messageHook(target: IMessageHandler, msg: Message): boolean {
    this.messages.push(msg.type)
    return true
  }
}
class LogStackedLayout extends StackedLayout {
  methods: string[] = []
  protected init(): void {
    super.init()
    this.methods.push("init")
  }
  protected attachWidget(index: number, widget: Widget): void {
    super.attachWidget(index, widget)
    this.methods.push("attachWidget")
  }
  protected moveWidget(
    fromIndex: number,
    toIndex: number,
    widget: Widget
  ): void {
    super.moveWidget(fromIndex, toIndex, widget)
    this.methods.push("moveWidget")
  }
  protected detachWidget(index: number, widget: Widget): void {
    super.detachWidget(index, widget)
    this.methods.push("detachWidget")
  }
  protected onAfterShow(msg: Message): void {
    super.onAfterShow(msg)
    this.methods.push("onAfterShow")
  }
  protected onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg)
    this.methods.push("onAfterAttach")
  }
  protected onChildShown(msg: Widget.ChildMessage): void {
    super.onChildShown(msg)
    this.methods.push("onChildShown")
  }
  protected onChildHidden(msg: Widget.ChildMessage): void {
    super.onChildHidden(msg)
    this.methods.push("onChildHidden")
  }
  protected onResize(msg: Widget.ResizeMessage): void {
    super.onResize(msg)
    this.methods.push("onResize")
  }
  protected onUpdateRequest(msg: Message): void {
    super.onUpdateRequest(msg)
    this.methods.push("onUpdateRequest")
  }
  protected onFitRequest(msg: Message): void {
    super.onFitRequest(msg)
    this.methods.push("onFitRequest")
  }
}
describe("../../src/lumino/widgets", () => {
  describe("StackedLayout", () => {
    describe("#attachWidget()", () => {
      it("should attach a widget to the parent's DOM node", () => {
        const layout = new LogStackedLayout()
        const parent = new Widget()
        const widget = new Widget()
        parent.layout = layout
        layout.addWidget(widget)
        expect(layout.methods).to.contain("attachWidget")
        expect(parent.node.contains(widget.node)).toEqual(true)
      })
      it("should send before/after attach messages if the parent is attached", () => {
        const layout = new LogStackedLayout()
        const parent = new Widget()
        const widget = new Widget()
        const hook = new LogHook()
        MessageLoop.installMessageHook(widget, hook)
        parent.layout = layout
        Widget.attach(parent, document.body)
        layout.addWidget(widget)
        expect(hook.messages).to.contain("before-attach")
        expect(hook.messages).to.contain("after-attach")
      })
      it("should post a fit request for the parent widget", done => {
        const layout = new LogStackedLayout()
        const parent = new Widget()
        const widget = new Widget()
        parent.layout = layout
        Widget.attach(parent, document.body)
        layout.addWidget(widget)
        requestAnimationFrame(() => {
          expect(layout.methods).to.contain("onFitRequest")
          done()
        })
      })
    })
    describe("#moveWidget()", () => {
      it("should move a widget in the parent's DOM node", () => {
        const layout = new LogStackedLayout()
        const widgets = [new Widget(), new Widget(), new Widget()]
        const parent = new Widget()
        parent.layout = layout
        widgets.forEach(w => {
          layout.addWidget(w)
        })
        layout.insertWidget(2, widgets[0])
        expect(layout.methods).to.contain("moveWidget")
        expect(layout.widgets[2]).toEqual(widgets[0])
      })
      it("should post an update request to the parent", done => {
        const layout = new LogStackedLayout()
        const widgets = [new Widget(), new Widget(), new Widget()]
        const parent = new Widget()
        parent.layout = layout
        widgets.forEach(w => {
          layout.addWidget(w)
        })
        layout.insertWidget(2, widgets[0])
        requestAnimationFrame(() => {
          expect(layout.methods).to.contain("onUpdateRequest")
          done()
        })
      })
    })
    describe("#detachWidget()", () => {
      it("should detach a widget from the parent's DOM node", () => {
        const layout = new LogStackedLayout()
        const widget = new Widget()
        const parent = new Widget()
        parent.layout = layout
        layout.addWidget(widget)
        layout.removeWidget(widget)
        expect(layout.methods).to.contain("detachWidget")
        expect(parent.node.contains(widget.node)).toEqual(false)
        parent.dispose()
      })
      it("should send before/after detach message if the parent is attached", () => {
        const layout = new LogStackedLayout()
        const parent = new Widget()
        const widget = new Widget()
        const hook = new LogHook()
        MessageLoop.installMessageHook(widget, hook)
        parent.layout = layout
        layout.addWidget(widget)
        Widget.attach(parent, document.body)
        layout.removeWidget(widget)
        expect(layout.methods).to.contain("detachWidget")
        expect(hook.messages).to.contain("before-detach")
        expect(hook.messages).to.contain("after-detach")
        parent.dispose()
      })
      it("should post a a layout request to the parent", done => {
        const layout = new LogStackedLayout()
        const parent = new Widget()
        const widget = new Widget()
        parent.layout = layout
        layout.addWidget(widget)
        Widget.attach(parent, document.body)
        layout.removeWidget(widget)
        requestAnimationFrame(() => {
          expect(layout.methods).to.contain("onFitRequest")
          parent.dispose()
          done()
        })
      })
      it("should reset the z-index for the widget", done => {
        const layout = new LogStackedLayout()
        const parent = new Widget()
        const widget1 = new Widget()
        const widget2 = new Widget()
        parent.layout = layout
        layout.addWidget(widget1)
        layout.addWidget(widget2)
        Widget.attach(parent, document.body)
        requestAnimationFrame(() => {
          expect(`${widget1.node.style.zIndex}`).toEqual("0")
          expect(`${widget2.node.style.zIndex}`).toEqual("1")
          layout.removeWidget(widget1)
          expect(`${widget1.node.style.zIndex}`).toEqual("")
          expect(`${widget2.node.style.zIndex}`).toEqual("1")
          layout.removeWidget(widget2)
          expect(`${widget2.node.style.zIndex}`).toEqual("")
          parent.dispose()
          done()
        })
      })
    })
    describe("#onAfterShow()", () => {
      it("should post an update to the parent", done => {
        const layout = new LogStackedLayout()
        const parent = new Widget()
        parent.layout = layout
        parent.hide()
        Widget.attach(parent, document.body)
        parent.show()
        expect(layout.methods).to.contain("onAfterShow")
        requestAnimationFrame(() => {
          expect(layout.methods).to.contain("onUpdateRequest")
          parent.dispose()
          done()
        })
      })
    })
    describe("#onAfterAttach()", () => {
      it("should post a layout request to the parent", done => {
        const layout = new LogStackedLayout()
        const parent = new Widget()
        parent.layout = layout
        Widget.attach(parent, document.body)
        expect(layout.methods).to.contain("onAfterAttach")
        requestAnimationFrame(() => {
          expect(layout.methods).to.contain("onFitRequest")
          parent.dispose()
          done()
        })
      })
    })
    describe("#onChildShown()", () => {
      it("should post or send a fit request to the parent", done => {
        const parent = new Widget()
        const layout = new LogStackedLayout()
        parent.layout = layout
        const widgets = [new Widget(), new Widget(), new Widget()]
        widgets[0].hide()
        widgets.forEach(w => {
          layout.addWidget(w)
        })
        Widget.attach(parent, document.body)
        widgets[0].show()
        expect(layout.methods).to.contain("onChildShown")
        requestAnimationFrame(() => {
          expect(layout.methods).to.contain("onFitRequest")
          parent.dispose()
          done()
        })
      })
    })
    describe("#onChildHidden()", () => {
      it("should post or send a fit request to the parent", done => {
        const parent = new Widget()
        const layout = new LogStackedLayout()
        parent.layout = layout
        const widgets = [new Widget(), new Widget(), new Widget()]
        widgets.forEach(w => {
          layout.addWidget(w)
        })
        Widget.attach(parent, document.body)
        widgets[0].hide()
        expect(layout.methods).to.contain("onChildHidden")
        requestAnimationFrame(() => {
          expect(layout.methods).to.contain("onFitRequest")
          parent.dispose()
          done()
        })
      })
    })
  })
})
describe("../../src/lumino/widgets", () => {
  describe("StackedPanel", () => {
    describe("#constructor()", () => {
      it("should take no arguments", () => {
        const panel = new StackedPanel()
        expect(panel).to.be.an.instanceof(StackedPanel)
      })
      it("should take options", () => {
        const layout = new StackedLayout()
        const panel = new StackedPanel({ layout })
        expect(panel.layout).toEqual(layout)
      })
      it("should add the `lm-StackedPanel` class", () => {
        const panel = new StackedPanel()
        expect(panel.hasClass("lm-StackedPanel")).toEqual(true)
      })
    })
    describe("hiddenMode", () => {
      let panel: StackedPanel
      const widgets: Widget[] = []
      beforeEach(() => {
        panel = new StackedPanel()
        widgets.push(new Widget())
        panel.addWidget(widgets[0])
        widgets.push(new Widget())
        panel.addWidget(widgets[1])
      })
      afterEach(() => {
        panel.dispose()
      })
      it("should be 'display' mode by default", () => {
        expect(panel.hiddenMode).toEqual(Widget.HiddenMode.Display)
      })
      it("should switch to 'scale'", () => {
        panel.hiddenMode = Widget.HiddenMode.Scale
        expect(widgets[0].hiddenMode).toEqual(Widget.HiddenMode.Scale)
        expect(widgets[1].hiddenMode).toEqual(Widget.HiddenMode.Scale)
      })
      it("should switch to 'display'", () => {
        widgets[0].hiddenMode = Widget.HiddenMode.Scale
        panel.hiddenMode = Widget.HiddenMode.Scale
        panel.hiddenMode = Widget.HiddenMode.Display
        expect(widgets[0].hiddenMode).toEqual(Widget.HiddenMode.Display)
        expect(widgets[1].hiddenMode).toEqual(Widget.HiddenMode.Display)
      })
      it("should not set 'scale' if only one widget", () => {
        panel.layout!.removeWidget(widgets[1])
        panel.hiddenMode = Widget.HiddenMode.Scale
        expect(widgets[0].hiddenMode).toEqual(Widget.HiddenMode.Display)
      })
    })
    describe("#widgetRemoved", () => {
      it("should be emitted when a widget is removed from a stacked panel", () => {
        const panel = new StackedPanel()
        const widget = new Widget()
        panel.addWidget(widget)
        panel.widgetRemoved.connect((sender, args) => {
          expect(sender).toEqual(panel)
          expect(args).toEqual(widget)
        })
        widget.parent = null
      })
    })
    describe("#onChildAdded()", () => {
      it("should add a class to the child widget", () => {
        const panel = new StackedPanel()
        const widget = new Widget()
        panel.addWidget(widget)
        expect(widget.hasClass("lm-StackedPanel-child")).toEqual(true)
      })
    })
    describe("#onChildRemoved()", () => {
      it("should remove a class to the child widget", () => {
        const panel = new StackedPanel()
        const widget = new Widget()
        panel.addWidget(widget)
        widget.parent = null
        expect(widget.hasClass("lm-StackedPanel-child")).toEqual(false)
      })
    })
  })
})
class LogTabBar extends TabBar<Widget> {
  events: string[] = []
  methods: string[] = []
  handleEvent(event: Event): void {
    super.handleEvent(event)
    this.events.push(event.type)
  }
  protected onBeforeAttach(msg: Message): void {
    super.onBeforeAttach(msg)
    this.methods.push("onBeforeAttach")
  }
  protected onAfterDetach(msg: Message): void {
    super.onAfterDetach(msg)
    this.methods.push("onAfterDetach")
  }
  protected onUpdateRequest(msg: Message): void {
    super.onUpdateRequest(msg)
    this.methods.push("onUpdateRequest")
  }
}
function populateBar(bar: TabBar<Widget>): void {
  for (const i of range(3)) {
    const widget = new Widget()
    widget.title.label = `Test - ${i}`
    widget.title.closable = true
    bar.addTab(widget.title)
  }
  MessageLoop.sendMessage(bar, Widget.Msg.UpdateRequest)
  for (const i of range(3)) {
    const tab = bar.contentNode.children[i]
    const icon = tab.querySelector(bar.renderer.closeIconSelector)
    icon!.textContent = "X"
  }
}
type Action = "pointerdown" | "pointermove" | "pointerup"
type Direction = "left" | "right" | "up" | "down"
function startDrag(
  bar: LogTabBar,
  index = 0,
  direction: Direction = "right"
): void {
  bar.tabsMovable = true
  const tab = bar.contentNode.children[index] as HTMLElement
  bar.currentIndex = index
  MessageLoop.sendMessage(bar, Widget.Msg.UpdateRequest)
  let called = false
  bar.tabDetachRequested.connect((sender, args) => {
    called = true
  })
  const rect = bar.contentNode.getBoundingClientRect()
  let args: any
  switch (direction) {
    case "left":
      args = { clientX: rect.left - 200, clientY: rect.top }
      break
    case "up":
      args = { clientX: rect.left, clientY: rect.top - 200 }
      break
    case "down":
      args = { clientX: rect.left, clientY: rect.bottom + 200 }
      break
    default:
      args = { clientX: rect.right + 200, clientY: rect.top }
      break
  }
  simulateOnNode(tab, "pointerdown")
  document.body.dispatchEvent(
    new PointerEvent("pointermove", {
      ...args,
      cancelable: true,
    })
  )
  expect(called).toEqual(true)
  bar.events = []
}
function simulateOnNode(node: Element, action: Action): void {
  const rect = node.getBoundingClientRect()
  node.dispatchEvent(
    new PointerEvent(action, {
      clientX: rect.left + 1,
      clientY: rect.top,
      cancelable: true,
      bubbles: true,
    })
  )
}
describe("../../src/lumino/widgets", () => {
  describe("TabBar", () => {
    let bar: LogTabBar
    beforeEach(() => {
      bar = new LogTabBar()
      Widget.attach(bar, document.body)
    })
    afterEach(() => {
      bar.dispose()
    })
    describe("#constructor()", () => {
      it("should take no arguments", () => {
        const newBar = new TabBar<Widget>()
        expect(newBar).to.be.an.instanceof(TabBar)
      })
      it("should take an options argument", () => {
        const renderer = new TabBar.Renderer()
        const newBar = new TabBar<Widget>({
          orientation: "horizontal",
          tabsMovable: true,
          allowDeselect: true,
          addButtonEnabled: true,
          insertBehavior: "select-tab",
          removeBehavior: "select-previous-tab",
          renderer,
        })
        expect(newBar).to.be.an.instanceof(TabBar)
        expect(newBar.tabsMovable).toEqual(true)
        expect(newBar.renderer).toEqual(renderer)
        expect(newBar.addButtonEnabled).toEqual(true)
      })
      it("should add the `lm-TabBar` class", () => {
        const newBar = new TabBar<Widget>()
        expect(newBar.hasClass("lm-TabBar")).toEqual(true)
      })
    })
    describe("#dispose()", () => {
      it("should dispose of the resources held by the widget", () => {
        bar.dispose()
        expect(bar.isDisposed).toEqual(true)
        bar.dispose()
        expect(bar.isDisposed).toEqual(true)
      })
    })
    describe("#currentChanged", () => {
      it("should be emitted when the current tab is changed", () => {
        populateBar(bar)
        let called = false
        const titles = bar.titles
        bar.currentChanged.connect((sender, args) => {
          expect(sender).toEqual(bar)
          expect(args.previousIndex).toEqual(0)
          expect(args.previousTitle).toEqual(titles[0])
          expect(args.currentIndex).toEqual(1)
          expect(args.currentTitle).toEqual(titles[1])
          called = true
        })
        bar.currentTitle = titles[1]
        expect(called).toEqual(true)
      })
      it("should not be emitted when another tab is inserted", () => {
        populateBar(bar)
        let called = false
        bar.currentChanged.connect((sender, args) => {
          called = true
        })
        const widget = new Widget()
        bar.insertTab(0, widget.title)
        expect(called).toEqual(false)
      })
      it("should not be emitted when another tab is removed", () => {
        populateBar(bar)
        let called = false
        bar.currentIndex = 1
        bar.currentChanged.connect((sender, args) => {
          called = true
        })
        bar.removeTab(bar.titles[0])
        expect(called).toEqual(false)
      })
      it("should not be emitted when the current tab is moved", () => {
        populateBar(bar)
        let called = false
        bar.currentChanged.connect((sender, args) => {
          called = true
        })
        bar.insertTab(2, bar.titles[0])
        expect(called).toEqual(false)
      })
    })
    describe("#tabMoved", () => {
      it("should be emitted when a tab is moved right by the user", done => {
        populateBar(bar)
        const titles = bar.titles.slice()
        bar.tabMoved.connect((sender, args) => {
          expect(sender).toEqual(bar)
          expect(args.fromIndex).toEqual(0)
          expect(args.toIndex).toEqual(2)
          expect(args.title).toEqual(titles[0])
          done()
        })
        startDrag(bar)
        document.body.dispatchEvent(
          new PointerEvent("pointerup", {
            cancelable: true,
          })
        )
      })
      it("should be emitted when a tab is moved left by the user", done => {
        populateBar(bar)
        const titles = bar.titles.slice()
        bar.tabMoved.connect((sender, args) => {
          expect(sender).toEqual(bar)
          expect(args.fromIndex).toEqual(2)
          expect(args.toIndex).toEqual(0)
          expect(args.title).toEqual(titles[2])
          done()
        })
        startDrag(bar, 2, "left")
        document.body.dispatchEvent(new PointerEvent("pointerup"))
      })
      it("should not be emitted when a tab is moved programmatically", () => {
        populateBar(bar)
        let called = false
        bar.tabMoved.connect((sender, args) => {
          called = true
        })
        bar.insertTab(2, bar.titles[0])
        expect(called).toEqual(false)
      })
    })
    describe("#tabActivateRequested", () => {
      let tab: HTMLElement
      beforeEach(() => {
        populateBar(bar)
        bar.tabsMovable = false
        tab = bar.contentNode.getElementsByClassName(
          "lm-TabBar-tab"
        )[2] as HTMLElement
      })
      it("should be emitted when a tab is left pressed by the user", () => {
        let called = false
        bar.currentIndex = 0
        MessageLoop.sendMessage(bar, Widget.Msg.UpdateRequest)
        bar.tabActivateRequested.connect((sender, args) => {
          expect(sender).toEqual(bar)
          expect(args.index).toEqual(2)
          expect(args.title).toEqual(bar.titles[2])
          called = true
        })
        simulateOnNode(tab, "pointerdown")
        expect(called).toEqual(true)
      })
      it("should make the tab current and emit the `currentChanged` signal", () => {
        let called = 0
        bar.currentIndex = 1
        MessageLoop.sendMessage(bar, Widget.Msg.UpdateRequest)
        bar.tabActivateRequested.connect(() => {
          called++
        })
        bar.currentChanged.connect(() => {
          called++
        })
        simulateOnNode(tab, "pointerdown")
        expect(bar.currentIndex).toEqual(2)
        expect(called).toEqual(2)
      })
      it("should emit even if the pressed tab is the current tab", () => {
        let called = false
        bar.currentIndex = 2
        MessageLoop.sendMessage(bar, Widget.Msg.UpdateRequest)
        bar.tabActivateRequested.connect(() => {
          called = true
        })
        simulateOnNode(tab, "pointerdown")
        expect(bar.currentIndex).toEqual(2)
        expect(called).toEqual(true)
      })
    })
    describe("#tabCloseRequested", () => {
      let tab: Element
      let closeIcon: Element
      beforeEach(() => {
        populateBar(bar)
        bar.currentIndex = 0
        tab = bar.contentNode.children[0]
        closeIcon = tab.querySelector(bar.renderer.closeIconSelector)!
      })
      it("should be emitted when a tab close icon is left clicked", () => {
        let called = false
        const rect = closeIcon.getBoundingClientRect()
        bar.tabCloseRequested.connect((sender, args) => {
          expect(sender).toEqual(bar)
          expect(args.index).toEqual(0)
          expect(args.title).toEqual(bar.titles[0])
          called = true
        })
        closeIcon.dispatchEvent(
          new PointerEvent("pointerdown", {
            clientX: rect.left,
            clientY: rect.top,
            button: 0,
            bubbles: true,
          })
        )
        closeIcon.dispatchEvent(
          new PointerEvent("pointerup", {
            clientX: rect.left,
            clientY: rect.top,
            button: 0,
          })
        )
        expect(called).toEqual(true)
      })
      it("should be emitted when a tab is middle clicked", () => {
        let called = false
        const rect = tab.getBoundingClientRect()
        bar.tabCloseRequested.connect((sender, args) => {
          expect(sender).toEqual(bar)
          expect(args.index).toEqual(0)
          expect(args.title).toEqual(bar.titles[0])
          called = true
        })
        tab.dispatchEvent(
          new PointerEvent("pointerdown", {
            clientX: rect.left,
            clientY: rect.top,
            button: 1,
            bubbles: true,
          })
        )
        tab.dispatchEvent(
          new PointerEvent("pointerup", {
            clientX: rect.left,
            clientY: rect.top,
            button: 1,
          })
        )
        expect(called).toEqual(true)
      })
      it("should not be emitted if the tab title is not `closable`", () => {
        let called = false
        const title = bar.titles[0]
        title.closable = false
        bar.tabCloseRequested.connect((sender, args) => {
          expect(sender).toEqual(bar)
          expect(args.index).toEqual(0)
          expect(args.title).toEqual(bar.titles[0])
          called = true
        })
        const rect1 = closeIcon.getBoundingClientRect()
        const rect2 = tab.getBoundingClientRect()
        closeIcon.dispatchEvent(
          new PointerEvent("pointerdown", {
            clientX: rect1.left,
            clientY: rect1.top,
            button: 0,
            cancelable: true,
          })
        )
        closeIcon.dispatchEvent(
          new PointerEvent("pointerup", {
            clientX: rect1.left,
            clientY: rect1.top,
            button: 0,
            cancelable: true,
          })
        )
        tab.dispatchEvent(
          new PointerEvent("pointerdown", {
            clientX: rect2.left,
            clientY: rect2.top,
            button: 1,
            cancelable: true,
          })
        )
        tab.dispatchEvent(
          new PointerEvent("pointereup", {
            clientX: rect2.left,
            clientY: rect2.top,
            button: 1,
            cancelable: true,
          })
        )
        expect(called).toEqual(false)
      })
    })
    describe("#addRequested", () => {
      let addButton: Element
      beforeEach(() => {
        populateBar(bar)
        bar.currentIndex = 0
        addButton = bar.addButtonNode
      })
      it("should be emitted when the add button is clicked", () => {
        bar.addButtonEnabled = true
        let called = false
        const rect = addButton.getBoundingClientRect()
        bar.addRequested.connect((sender, args) => {
          expect(sender).toEqual(bar)
          expect(args).toEqual(undefined)
          called = true
        })
        addButton.dispatchEvent(
          new PointerEvent("pointerdown", {
            clientX: rect.left,
            clientY: rect.top,
            button: 0,
            bubbles: true,
          })
        )
        addButton.dispatchEvent(
          new PointerEvent("pointerup", {
            clientX: rect.left,
            clientY: rect.top,
            button: 0,
          })
        )
        expect(called).toEqual(true)
      })
      it("should not be emitted if addButtonEnabled is `false`", () => {
        bar.addButtonEnabled = false
        let called = false
        const rect = addButton.getBoundingClientRect()
        bar.addRequested.connect((sender, args) => {
          expect(sender).toEqual(bar)
          expect(args).toEqual(undefined)
          called = true
        })
        addButton.dispatchEvent(
          new PointerEvent("pointerdown", {
            clientX: rect.left,
            clientY: rect.top,
            button: 0,
            cancelable: true,
          })
        )
        addButton.dispatchEvent(
          new PointerEvent("pointerup", {
            clientX: rect.left,
            clientY: rect.top,
            button: 0,
            cancelable: true,
          })
        )
        expect(called).toEqual(false)
      })
    })
    describe("#tabDetachRequested", () => {
      let tab: HTMLElement
      beforeEach(() => {
        populateBar(bar)
        bar.tabsMovable = true
        tab = bar.contentNode.children[bar.currentIndex] as HTMLElement
      })
      it("should be emitted when a tab is dragged beyond the detach threshold", () => {
        simulateOnNode(tab, "pointerdown")
        let called = false
        bar.tabDetachRequested.connect((sender, args) => {
          expect(sender).toEqual(bar)
          expect(args.index).toEqual(0)
          expect(args.title).toEqual(bar.titles[0])
          expect(args.clientX).toEqual(rect.right + 200)
          expect(args.clientY).toEqual(rect.top)
          called = true
        })
        const rect = bar.contentNode.getBoundingClientRect()
        document.body.dispatchEvent(
          new PointerEvent("pointermove", {
            clientX: rect.right + 200,
            clientY: rect.top,
            cancelable: true,
          })
        )
        expect(called).toEqual(true)
      })
      it("should be handled by calling `releaseMouse` and removing the tab", () => {
        simulateOnNode(tab, "pointerdown")
        let called = false
        bar.tabDetachRequested.connect((sender, args) => {
          bar.releaseMouse()
          bar.removeTabAt(args.index)
          called = true
        })
        const rect = bar.contentNode.getBoundingClientRect()
        document.body.dispatchEvent(
          new PointerEvent("pointermove", {
            clientX: rect.right + 200,
            clientY: rect.top,
            cancelable: true,
          })
        )
        expect(called).toEqual(true)
      })
      it("should only be emitted once per drag cycle", () => {
        simulateOnNode(tab, "pointerdown")
        let called = 0
        bar.tabDetachRequested.connect((sender, args) => {
          bar.releaseMouse()
          bar.removeTabAt(args.index)
          called++
        })
        const rect = bar.contentNode.getBoundingClientRect()
        document.body.dispatchEvent(
          new PointerEvent("pointermove", {
            clientX: rect.right + 200,
            clientY: rect.top,
            cancelable: true,
          })
        )
        expect(called).toEqual(1)
        document.body.dispatchEvent(
          new PointerEvent("pointermove", {
            clientX: rect.right + 201,
            clientY: rect.top,
            cancelable: true,
          })
        )
        expect(called).toEqual(1)
      })
      it("should add the `lm-mod-dragging` class to the tab and the bar", () => {
        simulateOnNode(tab, "pointerdown")
        let called = false
        bar.tabDetachRequested.connect((sender, args) => {
          expect(tab.classList.contains("lm-mod-dragging")).toEqual(true)
          expect(bar.hasClass("lm-mod-dragging")).toEqual(true)
          called = true
        })
        const rect = bar.contentNode.getBoundingClientRect()
        document.body.dispatchEvent(
          new PointerEvent("pointermove", {
            clientX: rect.right + 200,
            clientY: rect.top,
            cancelable: true,
          })
        )
        expect(called).toEqual(true)
      })
    })
    describe("#renderer", () => {
      it("should be the tab bar renderer", () => {
        const renderer = Object.create(TabBar.defaultRenderer)
        const bar = new TabBar<Widget>({ renderer })
        expect(bar.renderer).toEqual(renderer)
      })
      it("should default to the default renderer", () => {
        const bar = new TabBar<Widget>()
        expect(bar.renderer).toEqual(TabBar.defaultRenderer)
      })
    })
    describe("#tabsMovable", () => {
      it("should get whether the tabs are movable by the user", () => {
        const bar = new TabBar<Widget>()
        expect(bar.tabsMovable).toEqual(false)
      })
      it("should set whether the tabs are movable by the user", () => {
        const bar = new TabBar<Widget>()
        bar.tabsMovable = true
        expect(bar.tabsMovable).toEqual(true)
      })
      it("should still allow programmatic moves", () => {
        populateBar(bar)
        const titles = bar.titles.slice()
        bar.insertTab(2, titles[0])
        expect(bar.titles[2]).toEqual(titles[0])
      })
    })
    describe("#addButtonEnabled", () => {
      it("should get whether the add button is enabled", () => {
        const bar = new TabBar<Widget>()
        expect(bar.addButtonEnabled).toEqual(false)
      })
      it("should set whether the add button is enabled", () => {
        const bar = new TabBar<Widget>()
        bar.addButtonEnabled = true
        expect(bar.addButtonEnabled).toEqual(true)
      })
      it("should not show the add button if not set", () => {
        populateBar(bar)
        expect(bar.addButtonNode.classList.contains("lm-mod-hidden")).toEqual(
          true
        )
        bar.addButtonEnabled = true
        expect(bar.addButtonNode.classList.contains("lm-mod-hidden")).toEqual(
          false
        )
      })
    })
    describe("#allowDeselect", () => {
      it("should determine whether a tab can be deselected by the user", () => {
        populateBar(bar)
        bar.allowDeselect = false
        bar.tabsMovable = false
        bar.currentIndex = 2
        MessageLoop.sendMessage(bar, Widget.Msg.UpdateRequest)
        const tab = bar.contentNode.getElementsByClassName(
          "lm-TabBar-tab"
        )[2] as HTMLElement
        simulateOnNode(tab, "pointerdown")
        expect(bar.currentIndex).toEqual(2)
        simulateOnNode(tab, "pointerup")
        bar.allowDeselect = true
        simulateOnNode(tab, "pointerdown")
        expect(bar.currentIndex).toEqual(-1)
        simulateOnNode(tab, "pointerup")
      })
      it("should always allow programmatic deselection", () => {
        populateBar(bar)
        bar.allowDeselect = false
        bar.currentIndex = -1
        expect(bar.currentIndex).toEqual(-1)
      })
    })
    describe("#insertBehavior", () => {
      it("should not change the selection", () => {
        populateBar(bar)
        bar.insertBehavior = "none"
        bar.currentIndex = 0
        bar.insertTab(2, new Widget().title)
        expect(bar.currentIndex).toEqual(0)
      })
      it("should select the tab", () => {
        populateBar(bar)
        bar.insertBehavior = "select-tab"
        bar.currentIndex = 0
        bar.insertTab(2, new Widget().title)
        expect(bar.currentIndex).toEqual(2)
        bar.currentIndex = -1
        bar.insertTab(1, new Widget().title)
        expect(bar.currentIndex).toEqual(1)
      })
      it("should select the tab if needed", () => {
        populateBar(bar)
        bar.insertBehavior = "select-tab-if-needed"
        bar.currentIndex = 0
        bar.insertTab(2, new Widget().title)
        expect(bar.currentIndex).toEqual(0)
        bar.currentIndex = -1
        bar.insertTab(1, new Widget().title)
        expect(bar.currentIndex).toEqual(1)
      })
    })
    describe("#removeBehavior", () => {
      it("should select no tab", () => {
        populateBar(bar)
        bar.removeBehavior = "none"
        bar.currentIndex = 2
        bar.removeTabAt(2)
        expect(bar.currentIndex).toEqual(-1)
      })
      it("should select the tab after the removed tab if possible", () => {
        populateBar(bar)
        bar.removeBehavior = "select-tab-after"
        bar.currentIndex = 0
        bar.removeTabAt(0)
        expect(bar.currentIndex).toEqual(0)
        bar.currentIndex = 1
        bar.removeTabAt(1)
        expect(bar.currentIndex).toEqual(0)
      })
      it("should select the tab before the removed tab if possible", () => {
        populateBar(bar)
        bar.removeBehavior = "select-tab-before"
        bar.currentIndex = 1
        bar.removeTabAt(1)
        expect(bar.currentIndex).toEqual(0)
        bar.removeTabAt(0)
        expect(bar.currentIndex).toEqual(0)
      })
      it("should select the previously selected tab if possible", () => {
        populateBar(bar)
        bar.removeBehavior = "select-previous-tab"
        bar.currentIndex = 0
        bar.currentIndex = 2
        bar.removeTabAt(2)
        expect(bar.currentIndex).toEqual(0)
        bar.removeTabAt(0)
        bar.removeTabAt(0)
        populateBar(bar)
        bar.currentIndex = 1
        bar.removeTabAt(1)
        expect(bar.currentIndex).toEqual(0)
      })
    })
    describe("#currentTitle", () => {
      it("should get the currently selected title", () => {
        populateBar(bar)
        bar.currentIndex = 0
        expect(bar.currentTitle).toEqual(bar.titles[0])
      })
      it("should be `null` if no tab is selected", () => {
        populateBar(bar)
        bar.currentIndex = -1
        expect(bar.currentTitle).toEqual(null)
      })
      it("should set the currently selected title", () => {
        populateBar(bar)
        bar.currentTitle = bar.titles[1]
        expect(bar.currentTitle).toEqual(bar.titles[1])
      })
      it("should set the title to `null` if the title does not exist", () => {
        populateBar(bar)
        bar.currentTitle = new Widget().title
        expect(bar.currentTitle).toEqual(null)
      })
    })
    describe("#currentIndex", () => {
      it("should get index of the currently selected tab", () => {
        populateBar(bar)
        expect(bar.currentIndex).toEqual(0)
      })
      it("should be `null` if no tab is selected", () => {
        expect(bar.currentIndex).toEqual(-1)
      })
      it("should set index of the currently selected tab", () => {
        populateBar(bar)
        bar.currentIndex = 1
        expect(bar.currentIndex).toEqual(1)
      })
      it("should set the index to `-1` if the value is out of range", () => {
        populateBar(bar)
        bar.currentIndex = -1
        expect(bar.currentIndex).toEqual(-1)
        bar.currentIndex = 10
        expect(bar.currentIndex).toEqual(-1)
      })
      it("should emit the `currentChanged` signal", () => {
        populateBar(bar)
        const titles = bar.titles
        let called = false
        bar.currentChanged.connect((sender, args) => {
          expect(sender).toEqual(bar)
          expect(args.previousIndex).toEqual(0)
          expect(args.previousTitle).toEqual(titles[0])
          expect(args.currentIndex).toEqual(1)
          expect(args.currentTitle).toEqual(titles[1])
          called = true
        })
        bar.currentIndex = 1
        expect(called).toEqual(true)
      })
      it("should schedule an update of the tabs", done => {
        populateBar(bar)
        requestAnimationFrame(() => {
          bar.currentIndex = 1
          bar.methods = []
          requestAnimationFrame(() => {
            expect(bar.methods.indexOf("onUpdateRequest")).to.not.equal(-1)
            done()
          })
        })
      })
      it("should be a no-op if the index does not change", done => {
        populateBar(bar)
        requestAnimationFrame(() => {
          bar.currentIndex = 0
          bar.methods = []
          requestAnimationFrame(() => {
            expect(bar.methods.indexOf("onUpdateRequest")).toEqual(-1)
            done()
          })
        })
      })
    })
    describe("#orientation", () => {
      it("should be the orientation of the tab bar", () => {
        expect(bar.orientation).toEqual("horizontal")
        bar.orientation = "vertical"
        expect(bar.orientation).toEqual("vertical")
      })
      it("should set the orientation attribute of the tab bar", () => {
        bar.orientation = "horizontal"
        expect(bar.node.getAttribute("data-orientation")).toEqual("horizontal")
        bar.orientation = "vertical"
        expect(bar.node.getAttribute("data-orientation")).toEqual("vertical")
      })
    })
    describe("#titles", () => {
      it("should get the read-only array of titles in the tab bar", () => {
        const bar = new TabBar<Widget>()
        const widgets = [new Widget(), new Widget(), new Widget()]
        widgets.forEach(widget => {
          bar.addTab(widget.title)
        })
        expect(bar.titles.length).toEqual(3)
        for (const [i, title] of bar.titles.entries()) {
          expect(title.owner).toEqual(widgets[i])
        }
      })
    })
    describe("#contentNode", () => {
      it("should get the tab bar content node", () => {
        expect(bar.contentNode.classList.contains("lm-TabBar-content")).toEqual(
          true
        )
      })
    })
    describe("#addTab()", () => {
      it("should add a tab to the end of the tab bar", () => {
        populateBar(bar)
        const title = new Widget().title
        bar.addTab(title)
        expect(bar.titles[3]).toEqual(title)
      })
      it("should accept a title options object", () => {
        const owner = new Widget()
        bar.addTab({ owner, label: "foo" })
        expect(bar.titles[0]).to.be.an.instanceof(Title)
        expect(bar.titles[0].label).toEqual("foo")
      })
      it("should move an existing title to the end", () => {
        populateBar(bar)
        const titles = bar.titles.slice()
        bar.addTab(titles[0])
        expect(bar.titles[2]).toEqual(titles[0])
      })
    })
    describe("#insertTab()", () => {
      it("should insert a tab into the tab bar at the specified index", () => {
        populateBar(bar)
        const title = new Widget().title
        bar.insertTab(1, title)
        expect(bar.titles[1]).toEqual(title)
      })
      it("should accept a title options object", () => {
        populateBar(bar)
        const title = bar.insertTab(1, { owner: new Widget(), label: "foo" })
        expect(title).to.be.an.instanceof(Title)
        expect(title.label).toEqual("foo")
      })
      it("should clamp the index to the bounds of the tabs", () => {
        populateBar(bar)
        let title = new Widget().title
        bar.insertTab(-1, title)
        expect(bar.titles[0]).toEqual(title)
        title = new Widget().title
        bar.insertTab(10, title)
        expect(bar.titles[4]).toEqual(title)
      })
      it("should move an existing tab", () => {
        populateBar(bar)
        const titles = bar.titles.slice()
        bar.insertTab(1, titles[0])
        expect(bar.titles[1]).toEqual(titles[0])
      })
      it("should schedule an update of the tabs", done => {
        const bar = new LogTabBar()
        bar.insertTab(0, new Widget().title)
        requestAnimationFrame(() => {
          expect(bar.methods.indexOf("onUpdateRequest")).to.not.equal(-1)
          done()
        })
      })
      it("should schedule an update if the title changes", done => {
        const bar = new LogTabBar()
        const title = new Widget().title
        bar.insertTab(0, title)
        requestAnimationFrame(() => {
          expect(bar.methods.indexOf("onUpdateRequest")).to.not.equal(-1)
          bar.methods = []
          title.label = "foo"
          requestAnimationFrame(() => {
            expect(bar.methods.indexOf("onUpdateRequest")).to.not.equal(-1)
            done()
          })
        })
      })
    })
    describe("#removeTab()", () => {
      it("should remove a tab from the tab bar by value", () => {
        populateBar(bar)
        const titles = bar.titles.slice()
        bar.removeTab(titles[0])
        expect(bar.titles[0]).toEqual(titles[1])
      })
      it("should return be a no-op if the title is not in the tab bar", () => {
        populateBar(bar)
        bar.removeTab(new Widget().title)
      })
      it("should schedule an update of the tabs", done => {
        const bar = new LogTabBar()
        bar.insertTab(0, new Widget().title)
        requestAnimationFrame(() => {
          bar.removeTab(bar.titles[0])
          bar.methods = []
          requestAnimationFrame(() => {
            expect(bar.methods.indexOf("onUpdateRequest")).to.not.equal(-1)
            done()
          })
        })
      })
    })
    describe("#removeTabAt()", () => {
      it("should remove a tab at a specific index", () => {
        populateBar(bar)
        const titles = bar.titles.slice()
        bar.removeTabAt(0)
        expect(bar.titles[0]).toEqual(titles[1])
      })
      it("should return be a no-op if the index is out of range", () => {
        populateBar(bar)
        bar.removeTabAt(9)
      })
      it("should schedule an update of the tabs", done => {
        const bar = new LogTabBar()
        bar.insertTab(0, new Widget().title)
        requestAnimationFrame(() => {
          bar.removeTabAt(0)
          bar.methods = []
          requestAnimationFrame(() => {
            expect(bar.methods.indexOf("onUpdateRequest")).to.not.equal(-1)
            done()
          })
        })
      })
    })
    describe("#clearTabs()", () => {
      it("should remove all tabs from the tab bar", () => {
        populateBar(bar)
        bar.clearTabs()
        expect(bar.titles.length).toEqual(0)
      })
      it("should be a no-op if there are no tabs", () => {
        const bar = new TabBar<Widget>()
        bar.clearTabs()
        expect(bar.titles.length).toEqual(0)
      })
      it("should emit the `currentChanged` signal if there was a selected tab", () => {
        populateBar(bar)
        let called = false
        bar.currentIndex = 0
        bar.currentChanged.connect((sender, args) => {
          expect(sender).toEqual(bar)
          expect(args.previousIndex).toEqual(0)
          called = true
        })
        bar.clearTabs()
        expect(called).toEqual(true)
      })
      it("should not emit the `currentChanged` signal if there was no selected tab", () => {
        populateBar(bar)
        let called = false
        bar.currentIndex = -1
        bar.currentChanged.connect((sender, args) => {
          called = true
        })
        bar.clearTabs()
        expect(called).toEqual(false)
      })
    })
    describe("#releaseMouse()", () => {
      it("should release the mouse and restore the non-dragged tab positions", () => {
        populateBar(bar)
        startDrag(bar, 0, "left")
        bar.releaseMouse()
        document.body.dispatchEvent(new PointerEvent("pointermove"))
        expect(bar.events.indexOf("pointermove")).toEqual(-1)
      })
    })
    describe("#handleEvent()", () => {
      let tab: Element
      let closeIcon: Element
      beforeEach(() => {
        bar.tabsMovable = true
        populateBar(bar)
        bar.currentIndex = 0
        tab = bar.contentNode.children[0]
        closeIcon = tab.querySelector(bar.renderer.closeIconSelector)!
      })
      context("left click", () => {
        it("should emit a tab close requested signal", () => {
          let called = false
          const rect = closeIcon.getBoundingClientRect()
          bar.tabCloseRequested.connect((sender, args) => {
            expect(sender).toEqual(bar)
            expect(args.index).toEqual(0)
            expect(args.title).toEqual(bar.titles[0])
            called = true
          })
          closeIcon.dispatchEvent(
            new PointerEvent("pointerdown", {
              clientX: rect.left,
              clientY: rect.top,
              button: 0,
              bubbles: true,
            })
          )
          closeIcon.dispatchEvent(
            new PointerEvent("pointerup", {
              clientX: rect.left,
              clientY: rect.top,
              button: 0,
              cancelable: true,
            })
          )
          expect(called).toEqual(true)
        })
        it("should do nothing if a drag is in progress", () => {
          startDrag(bar, 1, "up")
          let called = false
          const rect = closeIcon.getBoundingClientRect()
          bar.tabCloseRequested.connect((sender, args) => {
            called = true
          })
          closeIcon.dispatchEvent(
            new PointerEvent("pointerdown", {
              clientX: rect.left,
              clientY: rect.top,
              button: 0,
              cancelable: true,
            })
          )
          closeIcon.dispatchEvent(
            new PointerEvent("pointerup", {
              clientX: rect.left,
              clientY: rect.top,
              button: 0,
              cancelable: true,
            })
          )
          expect(called).toEqual(false)
        })
        it("should do nothing if the click is not on a close icon", () => {
          let called = false
          const rect = closeIcon.getBoundingClientRect()
          bar.tabCloseRequested.connect((sender, args) => {
            called = true
          })
          closeIcon.dispatchEvent(
            new PointerEvent("pointerdown", {
              clientX: rect.left,
              clientY: rect.top,
              button: 0,
              cancelable: true,
            })
          )
          closeIcon.dispatchEvent(
            new PointerEvent("pointerup", {
              clientX: rect.left - 1,
              clientY: rect.top - 1,
              button: 0,
              cancelable: true,
            })
          )
          expect(called).toEqual(false)
          expect(called).toEqual(false)
        })
        it("should do nothing if the tab is not closable", () => {
          let called = false
          bar.titles[0].closable = false
          const rect = closeIcon.getBoundingClientRect()
          bar.tabCloseRequested.connect((sender, args) => {
            called = true
          })
          closeIcon.dispatchEvent(
            new PointerEvent("pointerdown", {
              clientX: rect.left,
              clientY: rect.top,
              button: 0,
              cancelable: true,
            })
          )
          closeIcon.dispatchEvent(
            new PointerEvent("pointerup", {
              clientX: rect.left,
              clientY: rect.top,
              button: 0,
              cancelable: true,
            })
          )
          expect(called).toEqual(false)
        })
      })
      context("middle click", () => {
        it("should emit a tab close requested signal", () => {
          let called = false
          const rect = tab.getBoundingClientRect()
          bar.tabCloseRequested.connect((sender, args) => {
            expect(sender).toEqual(bar)
            expect(args.index).toEqual(0)
            expect(args.title).toEqual(bar.titles[0])
            called = true
          })
          tab.dispatchEvent(
            new PointerEvent("pointerdown", {
              clientX: rect.left,
              clientY: rect.top,
              button: 1,
              bubbles: true,
            })
          )
          tab.dispatchEvent(
            new PointerEvent("pointerup", {
              clientX: rect.left,
              clientY: rect.top,
              button: 1,
              cancelable: true,
            })
          )
          expect(called).toEqual(true)
        })
        it("should do nothing if a drag is in progress", () => {
          startDrag(bar, 1, "up")
          let called = false
          const rect = tab.getBoundingClientRect()
          bar.tabCloseRequested.connect((sender, args) => {
            called = true
          })
          tab.dispatchEvent(
            new PointerEvent("pointerdown", {
              clientX: rect.left,
              clientY: rect.top,
              button: 1,
              cancelable: true,
            })
          )
          tab.dispatchEvent(
            new PointerEvent("pointerup", {
              clientX: rect.left,
              clientY: rect.top,
              button: 1,
              cancelable: true,
            })
          )
          expect(called).toEqual(false)
        })
        it("should do nothing if the click is not on the tab", () => {
          let called = false
          const rect = tab.getBoundingClientRect()
          bar.tabCloseRequested.connect((sender, args) => {
            called = true
          })
          tab.dispatchEvent(
            new PointerEvent("pointerdown", {
              clientX: rect.left,
              clientY: rect.top,
              button: 1,
              cancelable: true,
            })
          )
          tab.dispatchEvent(
            new PointerEvent("pointerup", {
              clientX: rect.left - 1,
              clientY: rect.top - 1,
              button: 1,
              cancelable: true,
            })
          )
          expect(called).toEqual(false)
          expect(called).toEqual(false)
        })
        it("should do nothing if the tab is not closable", () => {
          let called = false
          bar.titles[0].closable = false
          const rect = tab.getBoundingClientRect()
          bar.tabCloseRequested.connect((sender, args) => {
            called = true
          })
          tab.dispatchEvent(
            new PointerEvent("pointerdown", {
              clientX: rect.left,
              clientY: rect.top,
              button: 1,
              cancelable: true,
            })
          )
          tab.dispatchEvent(
            new PointerEvent("pointerup", {
              clientX: rect.left,
              clientY: rect.top,
              button: 1,
              cancelable: true,
            })
          )
          expect(called).toEqual(false)
        })
      })
      context("pointerdown", () => {
        it("should add event listeners if the tabs are movable", () => {
          simulateOnNode(tab, "pointerdown")
          document.body.dispatchEvent(new PointerEvent("pointermove"))
          expect(bar.events.indexOf("pointermove")).to.not.equal(-1)
        })
        it("should do nothing if not a left mouse press", () => {
          const rect = tab.getBoundingClientRect()
          tab.dispatchEvent(
            new PointerEvent("pointerdown", {
              clientX: rect.left,
              clientY: rect.top,
              button: 1,
              cancelable: true,
            })
          )
          document.body.dispatchEvent(new PointerEvent("pointermove"))
          expect(bar.events.indexOf("pointermove")).toEqual(-1)
        })
        it("should do nothing if the press is not on a tab", () => {
          const rect = tab.getBoundingClientRect()
          tab.dispatchEvent(
            new PointerEvent("pointerdown", {
              clientX: rect.left - 1,
              clientY: rect.top,
              cancelable: true,
            })
          )
          document.body.dispatchEvent(new PointerEvent("pointermove"))
          expect(bar.events.indexOf("pointermove")).toEqual(-1)
        })
        it("should do nothing if the press is on a close icon", () => {
          simulateOnNode(closeIcon, "pointerdown")
          document.body.dispatchEvent(new PointerEvent("pointermove"))
          expect(bar.events.indexOf("pointermove")).toEqual(-1)
        })
        it("should do nothing if the tabs are not movable", () => {
          bar.tabsMovable = false
          simulateOnNode(tab, "pointerdown")
          document.body.dispatchEvent(new PointerEvent("pointermove"))
          expect(bar.events.indexOf("pointermove")).toEqual(-1)
        })
        it("should do nothing if there is a drag in progress", () => {
          startDrag(bar, 2, "down")
          const rect = tab.getBoundingClientRect()
          const event = new PointerEvent("pointerdown", {
            clientX: rect.left,
            clientY: rect.top,
            cancelable: true,
          })
          const cancelled = !tab.dispatchEvent(event)
          expect(cancelled).toEqual(false)
        })
      })
      context("pointermove", () => {
        it("should do nothing if there is a drag in progress", () => {
          simulateOnNode(tab, "pointerdown")
          let called = 0
          bar.tabDetachRequested.connect((sender, args) => {
            called++
          })
          const rect = bar.contentNode.getBoundingClientRect()
          document.body.dispatchEvent(
            new PointerEvent("pointermove", {
              clientX: rect.right + 200,
              clientY: rect.top,
              cancelable: true,
            })
          )
          expect(called).toEqual(1)
          document.body.dispatchEvent(
            new PointerEvent("pointermove", {
              clientX: rect.right + 200,
              clientY: rect.top,
              cancelable: true,
            })
          )
          expect(called).toEqual(1)
        })
        it("should bail if the drag threshold is not exceeded", () => {
          simulateOnNode(tab, "pointerdown")
          let called = false
          bar.tabDetachRequested.connect((sender, args) => {
            bar.releaseMouse()
            called = true
          })
          const rect = bar.contentNode.getBoundingClientRect()
          document.body.dispatchEvent(
            new PointerEvent("pointermove", {
              clientX: rect.right + 1,
              clientY: rect.top,
              cancelable: true,
            })
          )
          expect(called).toEqual(false)
        })
        it("should emit the detach requested signal if the threshold is exceeded", () => {
          simulateOnNode(tab, "pointerdown")
          let called = false
          bar.tabDetachRequested.connect((sender, args) => {
            expect(sender).toEqual(bar)
            expect(args.index).toEqual(0)
            expect(args.title).toEqual(bar.titles[0])
            expect(args.clientX).toEqual(rect.right + 200)
            expect(args.clientY).toEqual(rect.top)
            called = true
          })
          const rect = bar.contentNode.getBoundingClientRect()
          document.body.dispatchEvent(
            new PointerEvent("pointermove", {
              clientX: rect.right + 200,
              clientY: rect.top,
              cancelable: true,
            })
          )
          expect(called).toEqual(true)
        })
        it("should bail if the signal handler aborted the drag", () => {
          simulateOnNode(tab, "pointerdown")
          let called = false
          bar.tabDetachRequested.connect((sender, args) => {
            bar.releaseMouse()
            called = true
          })
          let rect = bar.contentNode.getBoundingClientRect()
          document.body.dispatchEvent(
            new PointerEvent("pointermove", {
              clientX: rect.right + 200,
              clientY: rect.top,
              cancelable: true,
            })
          )
          expect(called).toEqual(true)
          const left = rect.left
          rect = tab.getBoundingClientRect()
          expect(left).toEqual(rect.left)
        })
        it("should update the positions of the tabs", () => {
          simulateOnNode(tab, "pointerdown")
          let called = false
          bar.tabDetachRequested.connect((sender, args) => {
            called = true
          })
          let rect = bar.contentNode.getBoundingClientRect()
          document.body.dispatchEvent(
            new PointerEvent("pointermove", {
              clientX: rect.right + 200,
              clientY: rect.top,
              cancelable: true,
            })
          )
          expect(called).toEqual(true)
          const left = rect.left
          rect = tab.getBoundingClientRect()
          expect(left).to.not.equal(rect.left)
        })
      })
      context("pointerup", () => {
        it("should emit the `tabMoved` signal", done => {
          startDrag(bar)
          document.body.dispatchEvent(new PointerEvent("pointerup"))
          bar.tabMoved.connect(() => {
            done()
          })
        })
        it("should move the tab to its final position", done => {
          startDrag(bar)
          document.body.dispatchEvent(new PointerEvent("pointerup"))
          const title = bar.titles[0]
          bar.tabMoved.connect(() => {
            expect(bar.titles[2]).toEqual(title)
            done()
          })
        })
        it("should cancel a middle mouse release", () => {
          startDrag(bar)
          const event = new PointerEvent("pointerup", {
            button: 1,
            cancelable: true,
          })
          const cancelled = !document.body.dispatchEvent(event)
          expect(cancelled).toEqual(true)
        })
      })
      context("keydown", () => {
        it("should prevent default", () => {
          startDrag(bar)
          const event = new KeyboardEvent("keydown", { cancelable: true })
          const cancelled = !document.body.dispatchEvent(event)
          expect(cancelled).toEqual(true)
        })
        it("should release the mouse if `Escape` is pressed", () => {
          startDrag(bar)
          document.body.dispatchEvent(
            new KeyboardEvent("keydown", {
              keyCode: 27,
              cancelable: true,
            })
          )
          simulateOnNode(tab, "pointerdown")
          expect(bar.events.indexOf("pointermove")).toEqual(-1)
        })
      })
      context("contextmenu", () => {
        it("should prevent default", () => {
          startDrag(bar)
          const event = new MouseEvent("contextmenu", { cancelable: true })
          const cancelled = !document.body.dispatchEvent(event)
          expect(cancelled).toEqual(true)
        })
      })
    })
    describe("#onBeforeAttach()", () => {
      it("should add event listeners to the node", () => {
        const bar = new LogTabBar()
        Widget.attach(bar, document.body)
        expect(bar.methods).to.contain("onBeforeAttach")
        bar.node.dispatchEvent(
          new PointerEvent("pointerdown", {
            cancelable: true,
          })
        )
        expect(bar.events.indexOf("pointerdown")).to.not.equal(-1)
        bar.dispose()
      })
    })
    describe("#onAfterDetach()", () => {
      it("should remove event listeners", () => {
        const bar = new LogTabBar()
        const owner = new Widget()
        bar.addTab(new Title({ owner, label: "foo" }))
        MessageLoop.sendMessage(bar, Widget.Msg.UpdateRequest)
        Widget.attach(bar, document.body)
        const tab = bar.contentNode.firstChild as HTMLElement
        const rect = tab.getBoundingClientRect()
        tab.dispatchEvent(
          new PointerEvent("pointerdown", {
            clientX: rect.left,
            clientY: rect.top,
            cancelable: true,
          })
        )
        Widget.detach(bar)
        expect(bar.methods).to.contain("onAfterDetach")
        document.body.dispatchEvent(
          new PointerEvent("pointermove", {
            cancelable: true,
          })
        )
        expect(bar.events.indexOf("pointermove")).toEqual(-1)
        document.body.dispatchEvent(
          new PointerEvent("pointerup", {
            cancelable: true,
          })
        )
        expect(bar.events.indexOf("pointerup")).toEqual(-1)
      })
    })
    describe("#onUpdateRequest()", () => {
      it("should render tabs and set styles", () => {
        populateBar(bar)
        bar.currentIndex = 0
        MessageLoop.sendMessage(bar, Widget.Msg.UpdateRequest)
        expect(bar.methods.indexOf("onUpdateRequest")).to.not.equal(-1)
        for (const [i, title] of bar.titles.entries()) {
          const tab = bar.contentNode.children[i] as HTMLElement
          const label = tab.getElementsByClassName(
            "lm-TabBar-tabLabel"
          )[0] as HTMLElement
          expect(label.textContent).toEqual(title.label)
          const current = i === 0
          expect(tab.classList.contains("lm-mod-current")).toEqual(current)
        }
      })
    })
    describe(".Renderer", () => {
      let title: Title<Widget>
      beforeEach(() => {
        const owner = new Widget()
        title = new Title({
          owner,
          label: "foo",
          closable: true,
          iconClass: "bar",
          className: "fizz",
          caption: "this is a caption",
        })
      })
      describe("#closeIconSelector", () => {
        it("should be `.lm-TabBar-tabCloseIcon`", () => {
          const renderer = new TabBar.Renderer()
          expect(renderer.closeIconSelector).toEqual(".lm-TabBar-tabCloseIcon")
        })
      })
      describe("#renderTab()", () => {
        it("should render a virtual node for a tab", () => {
          const renderer = new TabBar.Renderer()
          const vNode = renderer.renderTab({ title, current: true, zIndex: 1 })
          const node = VirtualDOM.realize(vNode)
          expect(
            node.getElementsByClassName("lm-TabBar-tabIcon").length
          ).toEqual(1)
          expect(
            node.getElementsByClassName("lm-TabBar-tabLabel").length
          ).toEqual(1)
          expect(
            node.getElementsByClassName("lm-TabBar-tabCloseIcon").length
          ).toEqual(1)
          expect(node.classList.contains("lm-TabBar-tab")).toEqual(true)
          expect(node.classList.contains(title.className)).toEqual(true)
          expect(node.classList.contains("lm-mod-current")).toEqual(true)
          expect(node.classList.contains("lm-mod-closable")).toEqual(true)
          expect(node.title).toEqual(title.caption)
          const label = node.getElementsByClassName(
            "lm-TabBar-tabLabel"
          )[0] as HTMLElement
          expect(label.textContent).toEqual(title.label)
          const icon = node.getElementsByClassName(
            "lm-TabBar-tabIcon"
          )[0] as HTMLElement
          expect(icon.classList.contains(title.iconClass)).toEqual(true)
        })
      })
      describe("#renderIcon()", () => {
        it("should render the icon element for a tab", () => {
          const renderer = new TabBar.Renderer()
          const vNode = renderer.renderIcon({ title, current: true, zIndex: 1 })
          const node = VirtualDOM.realize(vNode as VirtualElement)
          expect(node.className).to.contain("lm-TabBar-tabIcon")
          expect(node.classList.contains(title.iconClass)).toEqual(true)
        })
      })
      describe("#renderLabel()", () => {
        it("should render the label element for a tab", () => {
          const renderer = new TabBar.Renderer()
          const vNode = renderer.renderLabel({
            title,
            current: true,
            zIndex: 1,
          })
          const label = VirtualDOM.realize(vNode)
          expect(label.className).to.contain("lm-TabBar-tabLabel")
          expect(label.textContent).toEqual(title.label)
        })
      })
      describe("#renderCloseIcon()", () => {
        it("should render the close icon element for a tab", () => {
          const renderer = new TabBar.Renderer()
          const vNode = renderer.renderCloseIcon({
            title,
            current: true,
            zIndex: 1,
          })
          const icon = VirtualDOM.realize(vNode)
          expect(icon.className).to.contain("lm-TabBar-tabCloseIcon")
        })
      })
      describe("#createTabKey()", () => {
        it("should create a unique render key for the tab", () => {
          const renderer = new TabBar.Renderer()
          const key = renderer.createTabKey({ title, current: true, zIndex: 1 })
          const newKey = renderer.createTabKey({
            title,
            current: true,
            zIndex: 1,
          })
          expect(key).toEqual(newKey)
        })
      })
      describe("#createTabStyle()", () => {
        it("should create the inline style object for a tab", () => {
          const renderer = new TabBar.Renderer()
          const style = renderer.createTabStyle({
            title,
            current: true,
            zIndex: 1,
          })
          expect(style["zIndex"]).toEqual("1")
        })
      })
      describe("#createTabClass()", () => {
        it("should create the class name for the tab", () => {
          const renderer = new TabBar.Renderer()
          const className = renderer.createTabClass({
            title,
            current: true,
            zIndex: 1,
          })
          expect(className).to.contain("lm-TabBar-tab")
          expect(className).to.contain("lm-mod-closable")
          expect(className).to.contain("lm-mod-current")
        })
      })
      describe("#createIconClass()", () => {
        it("should create class name for the tab icon", () => {
          const renderer = new TabBar.Renderer()
          const className = renderer.createIconClass({
            title,
            current: true,
            zIndex: 1,
          })
          expect(className).to.contain("lm-TabBar-tabIcon")
          expect(className).to.contain(title.iconClass)
        })
      })
    })
    describe(".defaultRenderer", () => {
      it("should be an instance of `Renderer`", () => {
        expect(TabBar.defaultRenderer).to.be.an.instanceof(TabBar.Renderer)
      })
    })
  })
})
describe("../../src/lumino/widgets", () => {
  describe("TabPanel", () => {
    describe("#constructor()", () => {
      it("should construct a new tab panel and take no arguments", () => {
        const panel = new TabPanel()
        expect(panel).to.be.an.instanceof(TabPanel)
      })
      it("should accept options", () => {
        const renderer = Object.create(TabBar.defaultRenderer)
        const panel = new TabPanel({
          tabPlacement: "left",
          tabsMovable: true,
          renderer,
        })
        expect(panel.tabBar.tabsMovable).toEqual(true)
        expect(panel.tabBar.renderer).toEqual(renderer)
      })
      it("should add a `lm-TabPanel` class", () => {
        const panel = new TabPanel()
        expect(panel.hasClass("lm-TabPanel")).toEqual(true)
      })
    })
    describe("#dispose()", () => {
      it("should dispose of the resources held by the widget", () => {
        const panel = new TabPanel()
        panel.addWidget(new Widget())
        panel.dispose()
        expect(panel.isDisposed).toEqual(true)
        panel.dispose()
        expect(panel.isDisposed).toEqual(true)
      })
    })
    describe("#currentChanged", () => {
      it("should be emitted when the current tab is changed", () => {
        const panel = new TabPanel()
        panel.addWidget(new Widget())
        panel.addWidget(new Widget())
        let called = false
        const widgets = panel.widgets
        panel.currentChanged.connect((sender, args) => {
          expect(sender).toEqual(panel)
          expect(args.previousIndex).toEqual(0)
          expect(args.previousWidget).toEqual(widgets[0])
          expect(args.currentIndex).toEqual(1)
          expect(args.currentWidget).toEqual(widgets[1])
          called = true
        })
        panel.currentIndex = 1
        expect(called).toEqual(true)
      })
      it("should not be emitted when another tab is inserted", () => {
        const panel = new TabPanel()
        panel.addWidget(new Widget())
        panel.addWidget(new Widget())
        let called = false
        panel.currentChanged.connect((sender, args) => {
          called = true
        })
        panel.insertWidget(0, new Widget())
        expect(called).toEqual(false)
      })
      it("should not be emitted when another tab is removed", () => {
        const panel = new TabPanel()
        panel.addWidget(new Widget())
        panel.addWidget(new Widget())
        let called = false
        panel.currentIndex = 1
        panel.currentChanged.connect((sender, args) => {
          called = true
        })
        panel.widgets[0].parent = null
        expect(called).toEqual(false)
      })
      it("should not be emitted when the current tab is moved", () => {
        const panel = new TabPanel()
        panel.addWidget(new Widget())
        panel.addWidget(new Widget())
        let called = false
        panel.currentChanged.connect((sender, args) => {
          called = true
        })
        panel.insertWidget(2, panel.widgets[0])
        expect(called).toEqual(false)
      })
    })
    describe("#currentIndex", () => {
      it("should get the index of the currently selected tab", () => {
        const panel = new TabPanel()
        panel.addWidget(new Widget())
        expect(panel.currentIndex).toEqual(0)
      })
      it("should be `-1` if no tab is selected", () => {
        const panel = new TabPanel()
        expect(panel.currentIndex).toEqual(-1)
      })
      it("should set the index of the currently selected tab", () => {
        const panel = new TabPanel()
        panel.addWidget(new Widget())
        panel.addWidget(new Widget())
        panel.currentIndex = 1
        expect(panel.currentIndex).toEqual(1)
      })
      it("should set the index to `-1` if out of range", () => {
        const panel = new TabPanel()
        panel.addWidget(new Widget())
        panel.addWidget(new Widget())
        panel.currentIndex = -2
        expect(panel.currentIndex).toEqual(-1)
        panel.currentIndex = 2
        expect(panel.currentIndex).toEqual(-1)
      })
    })
    describe("#currentWidget", () => {
      it("should get the currently selected tab", () => {
        const panel = new TabPanel()
        const widget = new Widget()
        panel.addWidget(widget)
        expect(panel.currentWidget).toEqual(widget)
      })
      it("should be `null` if no tab is selected", () => {
        const panel = new TabPanel()
        expect(panel.currentWidget).toEqual(null)
      })
      it("should set the currently selected tab", () => {
        const panel = new TabPanel()
        panel.addWidget(new Widget())
        const widget = new Widget()
        panel.addWidget(widget)
        panel.currentWidget = widget
        expect(panel.currentWidget).toEqual(widget)
      })
      it("should set `null` if the widget is not in the panel", () => {
        const panel = new TabPanel()
        panel.addWidget(new Widget())
        panel.addWidget(new Widget())
        panel.currentWidget = new Widget()
        expect(panel.currentWidget).toEqual(null)
      })
    })
    describe("#tabsMovable", () => {
      it("should be the tabsMovable property of the tabBar", () => {
        const panel = new TabPanel()
        expect(panel.tabsMovable).toEqual(false)
        panel.tabsMovable = true
        expect(panel.tabBar.tabsMovable).toEqual(true)
      })
    })
    describe("#tabPlacement", () => {
      it("should be the tab placement for the tab panel", () => {
        const panel = new TabPanel()
        expect(panel.tabPlacement).toEqual("top")
        expect(panel.tabBar.orientation).toEqual("horizontal")
        expect(panel.tabBar.node.getAttribute("data-placement")).toEqual("top")
        panel.tabPlacement = "bottom"
        expect(panel.tabBar.orientation).toEqual("horizontal")
        expect(panel.tabBar.node.getAttribute("data-placement")).toEqual(
          "bottom"
        )
        panel.tabPlacement = "left"
        expect(panel.tabBar.orientation).toEqual("vertical")
        expect(panel.tabBar.node.getAttribute("data-placement")).toEqual("left")
        panel.tabPlacement = "right"
        expect(panel.tabBar.orientation).toEqual("vertical")
        expect(panel.tabBar.node.getAttribute("data-placement")).toEqual(
          "right"
        )
      })
    })
    describe("#tabBar", () => {
      it("should get the tab bar associated with the tab panel", () => {
        const panel = new TabPanel()
        const bar = panel.tabBar
        expect(bar).to.be.an.instanceof(TabBar)
      })
      it('should have the "lm-TabPanel-tabBar" class', () => {
        const panel = new TabPanel()
        const bar = panel.tabBar
        expect(bar.hasClass("lm-TabPanel-tabBar")).toEqual(true)
      })
      it("should move the widget in the stacked panel when a tab is moved", () => {
        const panel = new TabPanel()
        const widgets = [new LogWidget(), new LogWidget()]
        widgets.forEach(w => {
          panel.addWidget(w)
        })
        Widget.attach(panel, document.body)
        const bar = panel.tabBar
        let called = false
        bar.tabMoved.connect(() => {
          const stack = panel.stackedPanel
          expect(stack.widgets[1]).toEqual(widgets[0])
          called = true
        })
        ;(bar.tabMoved as any).emit({
          fromIndex: 0,
          toIndex: 1,
          title: widgets[0].title,
        })
        expect(called).toEqual(true)
        panel.dispose()
      })
      it("should show the new widget when the current tab changes", () => {
        const panel = new TabPanel()
        const widgets = [new LogWidget(), new LogWidget(), new LogWidget()]
        widgets.forEach(w => {
          panel.addWidget(w)
        })
        widgets.forEach(w => {
          w.node.tabIndex = -1
        })
        Widget.attach(panel, document.body)
        panel.tabBar.currentChanged.connect((sender, args) => {
          expect(widgets[args.previousIndex].isVisible).toEqual(false)
          expect(widgets[args.currentIndex].isVisible).toEqual(true)
        })
        panel.tabBar.currentIndex = 1
        panel.dispose()
      })
      it("should close the widget when a tab is closed", () => {
        const panel = new TabPanel()
        const widget = new LogWidget()
        panel.addWidget(widget)
        Widget.attach(panel, document.body)
        const bar = panel.tabBar
        let called = false
        bar.tabCloseRequested.connect(() => {
          expect(widget.methods.indexOf("onCloseRequest")).to.not.equal(-1)
          called = true
        })
        ;(bar.tabCloseRequested as any).emit({ index: 0, title: widget.title })
        expect(called).toEqual(true)
        panel.dispose()
      })
    })
    describe("#stackedPanel", () => {
      it("should get the stacked panel associated with the tab panel", () => {
        const panel = new TabPanel()
        const stack = panel.stackedPanel
        expect(stack).to.be.an.instanceof(StackedPanel)
      })
      it('should have the "lm-TabPanel-stackedPanel" class', () => {
        const panel = new TabPanel()
        const stack = panel.stackedPanel
        expect(stack.hasClass("lm-TabPanel-stackedPanel")).toEqual(true)
      })
      it("remove a tab when a widget is removed from the stacked panel", () => {
        const panel = new TabPanel()
        const widget = new Widget()
        panel.addWidget(widget)
        const stack = panel.stackedPanel
        let called = false
        stack.widgetRemoved.connect(() => {
          const bar = panel.tabBar
          expect(bar.titles).to.deep.equal([])
          called = true
        })
        widget.parent = null
        expect(called).toEqual(true)
      })
    })
    describe("#widgets", () => {
      it("should get a read-only array of the widgets in the panel", () => {
        const panel = new TabPanel()
        const widgets = [new Widget(), new Widget(), new Widget()]
        widgets.forEach(w => {
          panel.addWidget(w)
        })
        expect(panel.widgets).to.deep.equal(widgets)
      })
    })
    describe("#addWidget()", () => {
      it("should add a widget to the end of the tab panel", () => {
        const panel = new TabPanel()
        const widgets = [new Widget(), new Widget(), new Widget()]
        widgets.forEach(w => {
          panel.addWidget(w)
        })
        const widget = new Widget()
        panel.addWidget(widget)
        expect(panel.widgets[3]).toEqual(widget)
        expect(panel.tabBar.titles[2]).toEqual(widgets[2].title)
      })
      it("should move an existing widget", () => {
        const panel = new TabPanel()
        const widgets = [new Widget(), new Widget(), new Widget()]
        widgets.forEach(w => {
          panel.addWidget(w)
        })
        panel.addWidget(widgets[0])
        expect(panel.widgets[2]).toEqual(widgets[0])
      })
    })
    describe("#insertWidget()", () => {
      it("should insert a widget into the tab panel at a specified index", () => {
        const panel = new TabPanel()
        const widgets = [new Widget(), new Widget(), new Widget()]
        widgets.forEach(w => {
          panel.addWidget(w)
        })
        const widget = new Widget()
        panel.insertWidget(1, widget)
        expect(panel.widgets[1]).toEqual(widget)
        expect(panel.tabBar.titles[1]).toEqual(widget.title)
      })
      it("should move an existing widget", () => {
        const panel = new TabPanel()
        const widgets = [new Widget(), new Widget(), new Widget()]
        widgets.forEach(w => {
          panel.addWidget(w)
        })
        panel.insertWidget(0, widgets[2])
        expect(panel.widgets[0]).toEqual(widgets[2])
      })
    })
  })
})
const owner = {
  name: "Bob",
}
describe("../../src/lumino/widgets", () => {
  describe("Title", () => {
    describe("#constructor()", () => {
      it("should accept title options", () => {
        const title = new Title({ owner })
        expect(title).to.be.an.instanceof(Title)
      })
    })
    describe("#changed", () => {
      it("should be emitted when the title state changes", () => {
        let called = false
        const title = new Title({ owner })
        title.changed.connect((sender, arg) => {
          expect(sender).toEqual(title)
          expect(arg).toEqual(undefined)
          called = true
        })
        title.label = "baz"
        expect(called).toEqual(true)
      })
      it("should be cleared if it is disposed", () => {
        let called = false
        const title = new Title({ owner })
        title.changed.connect((sender, arg) => {
          called = true
        })
        title.dispose()
        title.label = "baz"
        expect(called).toEqual(false)
      })
    })
    describe("#owner", () => {
      it("should be the title owner", () => {
        const title = new Title({ owner })
        expect(title.owner).toEqual(owner)
      })
    })
    describe("#label", () => {
      it("should default to an empty string", () => {
        const title = new Title({ owner })
        expect(title.label).toEqual("")
      })
      it("should initialize from the options", () => {
        const title = new Title({ owner, label: "foo" })
        expect(title.label).toEqual("foo")
      })
      it("should be writable", () => {
        const title = new Title({ owner, label: "foo" })
        title.label = "bar"
        expect(title.label).toEqual("bar")
      })
      it("should emit the changed signal when the value changes", () => {
        let called = false
        const title = new Title({ owner, label: "foo" })
        title.changed.connect((sender, arg) => {
          expect(sender).toEqual(title)
          expect(arg).toEqual(undefined)
          called = true
        })
        title.label = "baz"
        expect(called).toEqual(true)
      })
      it("should not emit the changed signal when the value does not change", () => {
        let called = false
        const title = new Title({ owner, label: "foo" })
        title.changed.connect((sender, arg) => {
          called = true
        })
        title.label = "foo"
        expect(called).toEqual(false)
      })
    })
    describe("#mnemonic", () => {
      it("should default to `-1", () => {
        const title = new Title({ owner })
        expect(title.mnemonic).toEqual(-1)
      })
      it("should initialize from the options", () => {
        const title = new Title({ owner, mnemonic: 1 })
        expect(title.mnemonic).toEqual(1)
      })
      it("should be writable", () => {
        const title = new Title({ owner, mnemonic: 1 })
        title.mnemonic = 2
        expect(title.mnemonic).toEqual(2)
      })
      it("should emit the changed signal when the value changes", () => {
        let called = false
        const title = new Title({ owner, mnemonic: 1 })
        title.changed.connect((sender, arg) => {
          expect(sender).toEqual(title)
          expect(arg).toEqual(undefined)
          called = true
        })
        title.mnemonic = 0
        expect(called).toEqual(true)
      })
      it("should not emit the changed signal when the value does not change", () => {
        let called = false
        const title = new Title({ owner, mnemonic: 1 })
        title.changed.connect((sender, arg) => {
          called = true
        })
        title.mnemonic = 1
        expect(called).toEqual(false)
      })
    })
    describe("#icon", () => {
      const iconRenderer = {
        render: (host: HTMLElement, options?: any) => {
          const renderNode = document.createElement("div")
          renderNode.className = "foo"
          host.appendChild(renderNode)
        },
      }
      it("should default to undefined", () => {
        const title = new Title({ owner })
        expect(title.icon).toEqual(undefined)
      })
      it("should initialize from the options", () => {
        const title = new Title({ owner, icon: iconRenderer })
        expect(title.icon).toEqual(iconRenderer)
      })
      it("should be writable", () => {
        const title = new Title({ owner })
        expect(title.icon).toEqual(undefined)
        title.icon = iconRenderer
        expect(title.icon).toEqual(iconRenderer)
      })
      it("should emit the changed signal when the value changes", () => {
        let called = false
        const title = new Title({ owner })
        title.changed.connect((sender, arg) => {
          expect(sender).toEqual(title)
          expect(arg).toEqual(undefined)
          called = true
        })
        title.icon = iconRenderer
        expect(called).toEqual(true)
      })
      it("should not emit the changed signal when the value does not change", () => {
        let called = false
        const title = new Title({ owner, icon: iconRenderer })
        title.changed.connect((sender, arg) => {
          called = true
        })
        title.icon = iconRenderer
        expect(called).toEqual(false)
      })
    })
    describe("#caption", () => {
      it("should default to an empty string", () => {
        const title = new Title({ owner })
        expect(title.caption).toEqual("")
      })
      it("should initialize from the options", () => {
        const title = new Title({ owner, caption: "foo" })
        expect(title.caption).toEqual("foo")
      })
      it("should be writable", () => {
        const title = new Title({ owner, caption: "foo" })
        title.caption = "bar"
        expect(title.caption).toEqual("bar")
      })
      it("should emit the changed signal when the value changes", () => {
        let called = false
        const title = new Title({ owner, caption: "foo" })
        title.changed.connect((sender, arg) => {
          expect(sender).toEqual(title)
          expect(arg).toEqual(undefined)
          called = true
        })
        title.caption = "baz"
        expect(called).toEqual(true)
      })
      it("should not emit the changed signal when the value does not change", () => {
        let called = false
        const title = new Title({ owner, caption: "foo" })
        title.changed.connect((sender, arg) => {
          called = true
        })
        title.caption = "foo"
        expect(called).toEqual(false)
      })
    })
    describe("#className", () => {
      it("should default to an empty string", () => {
        const title = new Title({ owner })
        expect(title.className).toEqual("")
      })
      it("should initialize from the options", () => {
        const title = new Title({ owner, className: "foo" })
        expect(title.className).toEqual("foo")
      })
      it("should be writable", () => {
        const title = new Title({ owner, className: "foo" })
        title.className = "bar"
        expect(title.className).toEqual("bar")
      })
      it("should emit the changed signal when the value changes", () => {
        let called = false
        const title = new Title({ owner, className: "foo" })
        title.changed.connect((sender, arg) => {
          expect(sender).toEqual(title)
          expect(arg).toEqual(undefined)
          called = true
        })
        title.className = "baz"
        expect(called).toEqual(true)
      })
      it("should not emit the changed signal when the value does not change", () => {
        let called = false
        const title = new Title({ owner, className: "foo" })
        title.changed.connect((sender, arg) => {
          called = true
        })
        title.className = "foo"
        expect(called).toEqual(false)
      })
    })
    describe("#closable", () => {
      it("should default to `false`", () => {
        const title = new Title({ owner })
        expect(title.closable).toEqual(false)
      })
      it("should initialize from the options", () => {
        const title = new Title({ owner, closable: true })
        expect(title.closable).toEqual(true)
      })
      it("should be writable", () => {
        const title = new Title({ owner, closable: true })
        title.closable = false
        expect(title.closable).toEqual(false)
      })
      it("should emit the changed signal when the value changes", () => {
        let called = false
        const title = new Title({ owner, closable: false })
        title.changed.connect((sender, arg) => {
          expect(sender).toEqual(title)
          expect(arg).toEqual(undefined)
          called = true
        })
        title.closable = true
        expect(called).toEqual(true)
      })
      it("should not emit the changed signal when the value does not change", () => {
        let called = false
        const title = new Title({ owner, closable: false })
        title.changed.connect((sender, arg) => {
          called = true
        })
        title.closable = false
        expect(called).toEqual(false)
      })
    })
    describe("#dataset", () => {
      it("should default to `{}`", () => {
        const title = new Title({ owner })
        expect(title.dataset).to.deep.equal({})
      })
      it("should initialize from the options", () => {
        const title = new Title({ owner, dataset: { foo: "12" } })
        expect(title.dataset).to.deep.equal({ foo: "12" })
      })
      it("should be writable", () => {
        const title = new Title({ owner, dataset: { foo: "12" } })
        title.dataset = { bar: "42" }
        expect(title.dataset).to.deep.equal({ bar: "42" })
      })
      it("should emit the changed signal when the value changes", () => {
        let called = false
        const title = new Title({ owner, dataset: { foo: "12" } })
        title.changed.connect((sender, arg) => {
          expect(sender).toEqual(title)
          expect(arg).toEqual(undefined)
          called = true
        })
        title.dataset = { bar: "42" }
        expect(called).toEqual(true)
      })
      it("should not emit the changed signal when the value does not change", () => {
        let called = false
        const dataset = { foo: "12" }
        const title = new Title({ owner, dataset })
        title.changed.connect((sender, arg) => {
          called = true
        })
        title.dataset = dataset
        expect(called).toEqual(false)
      })
    })
  })
})
export class LogWidget extends Widget {
  messages: string[] = []
  methods: string[] = []
  raw: Message[] = []
  processMessage(msg: Message): void {
    super.processMessage(msg)
    this.messages.push(msg.type)
  }
  protected notifyLayout(msg: Message): void {
    super.notifyLayout(msg)
    this.methods.push("notifyLayout")
  }
  protected onActivateRequest(msg: Message): void {
    super.onActivateRequest(msg)
    this.methods.push("onActivateRequest")
  }
  protected onCloseRequest(msg: Message): void {
    super.onCloseRequest(msg)
    this.methods.push("onCloseRequest")
  }
  protected onResize(msg: Widget.ResizeMessage): void {
    super.onResize(msg)
    this.methods.push("onResize")
  }
  protected onUpdateRequest(msg: Message): void {
    super.onUpdateRequest(msg)
    this.methods.push("onUpdateRequest")
  }
  protected onAfterShow(msg: Message): void {
    super.onAfterShow(msg)
    this.methods.push("onAfterShow")
  }
  protected onBeforeHide(msg: Message): void {
    super.onBeforeHide(msg)
    this.methods.push("onBeforeHide")
  }
  protected onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg)
    this.methods.push("onAfterAttach")
  }
  protected onBeforeDetach(msg: Message): void {
    super.onBeforeDetach(msg)
    this.methods.push("onBeforeDetach")
  }
  protected onChildAdded(msg: Widget.ChildMessage): void {
    super.onChildAdded(msg)
    this.methods.push("onChildAdded")
    this.raw.push(msg)
  }
  protected onChildRemoved(msg: Widget.ChildMessage): void {
    super.onChildRemoved(msg)
    this.methods.push("onChildRemoved")
    this.raw.push(msg)
  }
}
class TestLayout extends Layout {
  dispose(): void {
    while (this._widgets.length !== 0) {
      this._widgets.pop()!.dispose()
    }
    super.dispose()
  }
  *[Symbol.iterator](): IterableIterator<Widget> {
    yield* this._widgets
  }
  removeWidget(widget: Widget): void {
    ArrayExt.removeFirstOf(this._widgets, widget)
  }
  private _widgets = [new Widget(), new Widget()]
}
describe("../../src/lumino/widgets", () => {
  describe("Widget", () => {
    describe("#constructor()", () => {
      it("should accept no arguments", () => {
        const widget = new Widget()
        expect(widget).to.be.an.instanceof(Widget)
      })
      it("should accept options", () => {
        const span = document.createElement("span")
        const widget = new Widget({ node: span })
        expect(widget.node).toEqual(span)
      })
      it("should add the `lm-Widget` class", () => {
        const widget = new Widget()
        expect(widget.hasClass("lm-Widget")).toEqual(true)
      })
    })
    describe("#dispose()", () => {
      it("should dispose of the widget", () => {
        const widget = new Widget()
        widget.dispose()
        expect(widget.isDisposed).toEqual(true)
      })
      it("should be a no-op if the widget already disposed", () => {
        let called = false
        const widget = new Widget()
        widget.dispose()
        widget.disposed.connect(() => {
          called = true
        })
        widget.dispose()
        expect(called).toEqual(false)
        expect(widget.isDisposed).toEqual(true)
      })
      it("should remove the widget from its parent", () => {
        const parent = new Widget()
        const child = new Widget()
        child.parent = parent
        child.dispose()
        expect(parent.isDisposed).toEqual(false)
        expect(child.isDisposed).toEqual(true)
        expect(child.parent).toEqual(null)
      })
      it("should automatically detach the widget", () => {
        const widget = new Widget()
        Widget.attach(widget, document.body)
        expect(widget.isAttached).toEqual(true)
        widget.dispose()
        expect(widget.isAttached).toEqual(false)
      })
      it("should dispose of the widget layout", () => {
        const widget = new Widget()
        const layout = new TestLayout()
        widget.layout = layout
        widget.dispose()
        expect(layout.isDisposed).toEqual(true)
      })
      it("should dispose of the widget title", () => {
        const widget = new Widget()
        const title = widget.title
        widget.dispose()
        expect(title.isDisposed).toEqual(true)
      })
    })
    describe("#disposed", () => {
      it("should be emitted when the widget is disposed", () => {
        let called = false
        const widget = new Widget()
        widget.disposed.connect(() => {
          called = true
        })
        widget.dispose()
        expect(called).toEqual(true)
      })
    })
    describe("#isDisposed", () => {
      it("should be `true` if the widget is disposed", () => {
        const widget = new Widget()
        widget.dispose()
        expect(widget.isDisposed).toEqual(true)
      })
      it("should be `false` if the widget is not disposed", () => {
        const widget = new Widget()
        expect(widget.isDisposed).toEqual(false)
      })
    })
    describe("#isAttached", () => {
      it("should be `true` if the widget is attached", () => {
        const widget = new Widget()
        Widget.attach(widget, document.body)
        expect(widget.isAttached).toEqual(true)
        widget.dispose()
      })
      it("should be `false` if the widget is not attached", () => {
        const widget = new Widget()
        expect(widget.isAttached).toEqual(false)
      })
    })
    describe("#isHidden", () => {
      it("should be `true` if the widget is hidden", () => {
        const widget = new Widget()
        Widget.attach(widget, document.body)
        widget.hide()
        expect(widget.isHidden).toEqual(true)
        widget.dispose()
      })
      it("should be `false` if the widget is not hidden", () => {
        const widget = new Widget()
        Widget.attach(widget, document.body)
        expect(widget.isHidden).toEqual(false)
        widget.dispose()
      })
    })
    describe("#isVisible", () => {
      it("should be `true` if the widget is visible", () => {
        const widget = new Widget()
        Widget.attach(widget, document.body)
        expect(widget.isVisible).toEqual(true)
        widget.dispose()
      })
      it("should be `false` if the widget is not visible", () => {
        const widget = new Widget()
        Widget.attach(widget, document.body)
        widget.hide()
        expect(widget.isVisible).toEqual(false)
        widget.dispose()
      })
      it("should be `false` if the widget is not attached", () => {
        const widget = new Widget()
        expect(widget.isVisible).toEqual(false)
      })
    })
    describe("#node", () => {
      it("should get the DOM node owned by the widget", () => {
        const widget = new Widget()
        const node = widget.node
        expect(node.tagName.toLowerCase()).toEqual("div")
      })
    })
    describe("#id", () => {
      it("should get the id of the widget node", () => {
        const widget = new Widget()
        widget.node.id = "foo"
        expect(widget.id).toEqual("foo")
      })
      it("should set the id of the widget node", () => {
        const widget = new Widget()
        widget.id = "bar"
        expect(widget.node.id).toEqual("bar")
      })
    })
    describe("#dataset", () => {
      it("should get the dataset of the widget node", () => {
        const widget = new Widget()
        expect(widget.dataset).toEqual(widget.node.dataset)
      })
    })
    describe("#title", () => {
      it("should get the title data object for the widget", () => {
        const widget = new Widget()
        expect(widget.title).to.be.an.instanceof(Title)
      })
    })
    describe("#parent", () => {
      it("should default to `null`", () => {
        const widget = new Widget()
        expect(widget.parent).toEqual(null)
      })
      it("should set the parent and send a `child-added` messagee", () => {
        const child = new Widget()
        const parent = new LogWidget()
        child.parent = parent
        expect(child.parent).toEqual(parent)
        expect(parent.messages).to.contain("child-added")
      })
      it("should remove itself from the current parent", () => {
        const parent0 = new LogWidget()
        const parent1 = new LogWidget()
        const child = new Widget()
        child.parent = parent0
        child.parent = parent1
        expect(parent0.messages).to.contain("child-removed")
        expect(parent1.messages).to.contain("child-added")
      })
      it("should throw an error if the widget contains the parent", () => {
        const widget0 = new Widget()
        const widget1 = new Widget()
        widget0.parent = widget1
        expect(() => {
          widget1.parent = widget0
        }).to.throw(Error)
      })
      it("should be a no-op if there is no parent change", () => {
        const parent = new LogWidget()
        const child = new Widget()
        child.parent = parent
        child.parent = parent
        expect(parent.messages).to.not.contain("child-removed")
      })
    })
    describe("#layout", () => {
      it("should default to `null`", () => {
        const widget = new Widget()
        expect(widget.layout).toEqual(null)
      })
      it("should set the layout for the widget", () => {
        const widget = new Widget()
        const layout = new TestLayout()
        widget.layout = layout
        expect(widget.layout).toEqual(layout)
      })
      it("should be single-use only", () => {
        const widget = new Widget()
        widget.layout = new TestLayout()
        expect(() => {
          widget.layout = new TestLayout()
        }).to.throw(Error)
      })
      it("should be disposed when the widget is disposed", () => {
        const widget = new Widget()
        const layout = new TestLayout()
        widget.layout = layout
        widget.dispose()
        expect(layout.isDisposed).toEqual(true)
      })
      it("should be a no-op if the layout is the same", () => {
        const widget = new Widget()
        const layout = new TestLayout()
        widget.layout = layout
        widget.layout = layout
        expect(widget.layout).toEqual(layout)
      })
      it("should throw an error if the layout already has a parent", () => {
        const widget0 = new Widget()
        const widget1 = new Widget()
        const layout = new TestLayout()
        widget0.layout = layout
        expect(() => {
          widget1.layout = layout
        }).to.throw(Error)
      })
      it("should throw an error if the `DisallowLayout` flag is set", () => {
        const widget = new Widget()
        widget.setFlag(Widget.Flag.DisallowLayout)
        const layout = new TestLayout()
        expect(() => {
          widget.layout = layout
        }).to.throw(Error)
      })
    })
    describe("#children()", () => {
      it("should return an iterator over the widget children", () => {
        const widget = new Widget()
        widget.layout = new TestLayout()
        for (const child of widget.children()) {
          expect(child).to.be.an.instanceof(Widget)
        }
      })
      it("should return an empty iterator if there is no layout", () => {
        const widget = new Widget()
        expect(widget.children().next().done).toEqual(true)
      })
    })
    describe("#contains()", () => {
      it("should return `true` if the widget is a descendant", () => {
        const p1 = new Widget()
        const p2 = new Widget()
        const p3 = new Widget()
        const w1 = new Widget()
        const w2 = new Widget()
        p2.parent = p1
        p3.parent = p2
        w1.parent = p2
        w2.parent = p3
        expect(p1.contains(p1)).toEqual(true)
        expect(p1.contains(p2)).toEqual(true)
        expect(p1.contains(p3)).toEqual(true)
        expect(p1.contains(w1)).toEqual(true)
        expect(p1.contains(w2)).toEqual(true)
        expect(p2.contains(p2)).toEqual(true)
        expect(p2.contains(p3)).toEqual(true)
        expect(p2.contains(w1)).toEqual(true)
        expect(p2.contains(w2)).toEqual(true)
        expect(p3.contains(p3)).toEqual(true)
        expect(p3.contains(w2)).toEqual(true)
      })
      it("should return `false` if the widget is not a descendant", () => {
        const p1 = new Widget()
        const p2 = new Widget()
        const p3 = new Widget()
        const w1 = new Widget()
        const w2 = new Widget()
        p2.parent = p1
        p3.parent = p2
        w1.parent = p2
        w2.parent = p3
        expect(p2.contains(p1)).toEqual(false)
        expect(p3.contains(p1)).toEqual(false)
        expect(p3.contains(p2)).toEqual(false)
        expect(p3.contains(w1)).toEqual(false)
        expect(w1.contains(p1)).toEqual(false)
        expect(w1.contains(p2)).toEqual(false)
        expect(w1.contains(p3)).toEqual(false)
        expect(w1.contains(w2)).toEqual(false)
        expect(w2.contains(p1)).toEqual(false)
        expect(w2.contains(p2)).toEqual(false)
        expect(w2.contains(p3)).toEqual(false)
        expect(w2.contains(w1)).toEqual(false)
      })
    })
    describe("#hasClass()", () => {
      it("should return `true` if a node has a class", () => {
        const widget = new Widget()
        widget.node.classList.add("foo")
        widget.node.classList.add("bar")
        widget.node.classList.add("baz")
        expect(widget.hasClass("foo")).toEqual(true)
        expect(widget.hasClass("bar")).toEqual(true)
        expect(widget.hasClass("baz")).toEqual(true)
      })
      it("should return `false` if a node does not have a class", () => {
        const widget = new Widget()
        widget.node.classList.add("foo")
        widget.node.classList.add("bar")
        widget.node.classList.add("baz")
        expect(widget.hasClass("one")).toEqual(false)
        expect(widget.hasClass("two")).toEqual(false)
        expect(widget.hasClass("three")).toEqual(false)
      })
    })
    describe("#addClass()", () => {
      it("should add a class to the DOM node", () => {
        const widget = new Widget()
        expect(widget.node.classList.contains("foo")).toEqual(false)
        widget.addClass("foo")
        expect(widget.node.classList.contains("foo")).toEqual(true)
        expect(widget.node.classList.contains("bar")).toEqual(false)
        widget.addClass("bar")
        expect(widget.node.classList.contains("bar")).toEqual(true)
      })
      it("should be a no-op if the class is already present", () => {
        const widget = new Widget()
        widget.addClass("foo")
        expect(widget.node.classList.contains("foo")).toEqual(true)
        widget.addClass("foo")
        expect(widget.node.classList.contains("foo")).toEqual(true)
      })
    })
    describe("#removeClass()", () => {
      it("should remove the class from the DOM node", () => {
        const widget = new Widget()
        widget.node.classList.add("foo")
        widget.node.classList.add("bar")
        widget.removeClass("foo")
        expect(widget.node.classList.contains("foo")).toEqual(false)
        expect(widget.node.classList.contains("bar")).toEqual(true)
        widget.removeClass("bar")
        expect(widget.node.classList.contains("bar")).toEqual(false)
      })
      it("should be a no-op if the class is not present", () => {
        const widget = new Widget()
        expect(widget.node.classList.contains("foo")).toEqual(false)
        widget.removeClass("foo")
        expect(widget.node.classList.contains("foo")).toEqual(false)
      })
    })
    describe("#toggleClass()", () => {
      it("should toggle the presence of a class", () => {
        const widget = new Widget()
        widget.toggleClass("foo")
        expect(widget.node.classList.contains("foo")).toEqual(true)
        widget.toggleClass("foo")
        expect(widget.node.classList.contains("foo")).toEqual(false)
      })
      it("should force-add a class", () => {
        const widget = new Widget()
        expect(widget.node.classList.contains("foo")).toEqual(false)
        widget.toggleClass("foo", true)
        expect(widget.node.classList.contains("foo")).toEqual(true)
        widget.toggleClass("foo", true)
        expect(widget.node.classList.contains("foo")).toEqual(true)
      })
      it("should force-remove a class", () => {
        const widget = new Widget()
        widget.node.classList.add("foo")
        expect(widget.node.classList.contains("foo")).toEqual(true)
        widget.toggleClass("foo", false)
        expect(widget.node.classList.contains("foo")).toEqual(false)
        widget.toggleClass("foo", false)
        expect(widget.node.classList.contains("foo")).toEqual(false)
      })
      it("should return `true` if the class is present", () => {
        const widget = new Widget()
        expect(widget.toggleClass("foo")).toEqual(true)
        expect(widget.toggleClass("foo", true)).toEqual(true)
      })
      it("should return `false` if the class is not present", () => {
        const widget = new Widget()
        widget.node.classList.add("foo")
        expect(widget.toggleClass("foo")).toEqual(false)
        expect(widget.toggleClass("foo", false)).toEqual(false)
      })
    })
    describe("#update()", () => {
      it("should post an `update-request` message", done => {
        const widget = new LogWidget()
        widget.update()
        expect(widget.messages).to.deep.equal([])
        requestAnimationFrame(() => {
          expect(widget.messages).to.deep.equal(["update-request"])
          done()
        })
      })
    })
    describe("#fit()", () => {
      it("should post a `fit-request` message to the widget", done => {
        const widget = new LogWidget()
        widget.fit()
        expect(widget.messages).to.deep.equal([])
        requestAnimationFrame(() => {
          expect(widget.messages).to.deep.equal(["fit-request"])
          done()
        })
      })
    })
    describe("#activate()", () => {
      it("should post an `activate-request` message", done => {
        const widget = new LogWidget()
        widget.activate()
        expect(widget.messages).to.deep.equal([])
        requestAnimationFrame(() => {
          expect(widget.messages).to.deep.equal(["activate-request"])
          done()
        })
      })
    })
    describe("#close()", () => {
      it("should send a `close-request` message", () => {
        const widget = new LogWidget()
        expect(widget.messages).to.deep.equal([])
        widget.close()
        expect(widget.messages).to.deep.equal(["close-request"])
      })
    })
    describe("#show()", () => {
      it("should set `isHidden` to `false`", () => {
        const widget = new Widget()
        widget.hide()
        expect(widget.isHidden).toEqual(true)
        widget.show()
        expect(widget.isHidden).toEqual(false)
      })
      it('should remove the "lm-mod-hidden" class', () => {
        const widget = new Widget()
        widget.hide()
        expect(widget.hasClass("lm-mod-hidden")).toEqual(true)
        widget.show()
        expect(widget.hasClass("lm-mod-hidden")).toEqual(false)
      })
      it("should send an `after-show` message if applicable", () => {
        const widget = new LogWidget()
        widget.hide()
        Widget.attach(widget, document.body)
        widget.show()
        expect(widget.messages).to.contains("after-show")
        widget.dispose()
      })
      it("should send a `child-shown` message to the parent", () => {
        const parent = new LogWidget()
        const child = new Widget()
        child.parent = parent
        child.hide()
        child.show()
        expect(parent.messages).to.contains("child-shown")
      })
      it("should be a no-op if not hidden", () => {
        const widget = new LogWidget()
        Widget.attach(widget, document.body)
        widget.show()
        expect(widget.messages).to.not.contains("after-show")
        widget.dispose()
      })
    })
    describe("#hide()", () => {
      it("should hide the widget", () => {
        const widget = new Widget()
        widget.hide()
        expect(widget.isHidden).toEqual(true)
      })
      it("should add the `lm-mod-hidden` class", () => {
        const widget = new Widget()
        widget.hide()
        expect(widget.hasClass("lm-mod-hidden")).toEqual(true)
      })
      it("should send a `before-hide` message if applicable", () => {
        const widget = new LogWidget()
        Widget.attach(widget, document.body)
        widget.hide()
        expect(widget.messages).to.contain("before-hide")
        widget.dispose()
      })
      it("should send a `child-hidden` message to the parent", () => {
        const parent = new LogWidget()
        const child = new Widget()
        child.parent = parent
        child.hide()
        expect(parent.messages).to.contain("child-hidden")
      })
      it("should be a no-op if already hidden", () => {
        const widget = new LogWidget()
        widget.hide()
        Widget.attach(widget, document.body)
        widget.hide()
        expect(widget.messages).to.not.contain("before-hide")
        widget.dispose()
      })
    })
    describe("#setHidden()", () => {
      it("should call hide if `hidden = true`", () => {
        const widget = new LogWidget()
        Widget.attach(widget, document.body)
        widget.setHidden(true)
        expect(widget.isHidden).toEqual(true)
        expect(widget.messages).to.contain("before-hide")
        widget.dispose()
      })
      it("should call show if `hidden = false`", () => {
        const widget = new LogWidget()
        widget.hide()
        Widget.attach(widget, document.body)
        widget.setHidden(false)
        expect(widget.isHidden).toEqual(false)
        expect(widget.messages).to.contain("after-show")
        widget.dispose()
      })
    })
    describe("#hiddenMode", () => {
      it("should use class to hide the widget by default", () => {
        const widget = new Widget()
        Widget.attach(widget, document.body)
        widget.hide()
        expect(widget.hasClass("lm-mod-hidden")).toEqual(true)
        expect(widget.node.style.transform).to.be.equal("")
        expect(widget.node.style.willChange).to.not.equal("transform")
        widget.dispose()
      })
      it('should use transformation if in "scale" mode', () => {
        const widget = new Widget()
        Widget.attach(widget, document.body)
        widget.hiddenMode = Widget.HiddenMode.Scale
        widget.hide()
        expect(widget.hasClass("lm-mod-hidden")).toEqual(false)
        expect(widget.node.style.transform).toEqual("scale(0)")
        expect(widget.node.style.willChange).toEqual("transform")
        widget.dispose()
      })
      it("should remove class when switching from display to scale", () => {
        const widget = new Widget()
        Widget.attach(widget, document.body)
        widget.hide()
        widget.hiddenMode = Widget.HiddenMode.Scale
        expect(widget.hasClass("lm-mod-hidden")).toEqual(false)
        expect(widget.node.style.transform).toEqual("scale(0)")
        expect(widget.node.style.willChange).toEqual("transform")
        widget.dispose()
      })
      it("should add class when switching from scale to display", () => {
        const widget = new Widget()
        Widget.attach(widget, document.body)
        widget.hiddenMode = Widget.HiddenMode.Scale
        widget.hide()
        widget.hiddenMode = Widget.HiddenMode.Display
        expect(widget.hasClass("lm-mod-hidden")).toEqual(true)
        expect(widget.node.style.transform).toEqual("")
        expect(widget.node.style.willChange).toEqual("auto")
        widget.dispose()
      })
    })
    describe("#testFlag()", () => {
      it("should test whether the given widget flag is set", () => {
        const widget = new Widget()
        expect(widget.testFlag(Widget.Flag.IsHidden)).toEqual(false)
      })
    })
    describe("#setFlag()", () => {
      it("should set the given widget flag", () => {
        const widget = new Widget()
        widget.setFlag(Widget.Flag.IsHidden)
        expect(widget.testFlag(Widget.Flag.IsHidden)).toEqual(true)
      })
    })
    describe("#clearFlag()", () => {
      it("should clear the given widget flag", () => {
        const widget = new Widget()
        widget.setFlag(Widget.Flag.IsHidden)
        widget.clearFlag(Widget.Flag.IsHidden)
        expect(widget.testFlag(Widget.Flag.IsHidden)).toEqual(false)
      })
    })
    describe("#notifyLayout()", () => {
      it("should send a message to the widget's layout", () => {
        const child = new LogWidget()
        const parent = new LogWidget()
        const layout = new TestLayout()
        parent.layout = layout
        child.parent = parent
        expect(parent.methods).to.contain("notifyLayout")
      })
    })
    describe("#onActivateRequest()", () => {
      it("should be invoked on an `activate-request", () => {
        const widget = new LogWidget()
        MessageLoop.sendMessage(widget, Widget.Msg.ActivateRequest)
        expect(widget.methods).to.contain("onActivateRequest")
      })
      it("should notify the layout", () => {
        const widget = new LogWidget()
        MessageLoop.sendMessage(widget, Widget.Msg.ActivateRequest)
        expect(widget.methods).to.contain("notifyLayout")
      })
    })
    describe("#onCloseRequest()", () => {
      it("should be invoked on a `close-request`", () => {
        const widget = new LogWidget()
        MessageLoop.sendMessage(widget, Widget.Msg.CloseRequest)
        expect(widget.messages).to.contain("close-request")
        expect(widget.methods).to.contain("onCloseRequest")
      })
      it("should unparent a child widget by default", () => {
        const parent = new Widget()
        const child = new Widget()
        child.parent = parent
        MessageLoop.sendMessage(child, Widget.Msg.CloseRequest)
        expect(child.parent).toEqual(null)
      })
      it("should detach a root widget by default", () => {
        const widget = new Widget()
        Widget.attach(widget, document.body)
        MessageLoop.sendMessage(widget, Widget.Msg.CloseRequest)
        expect(widget.isAttached).toEqual(false)
      })
      it("should notify the layout", () => {
        const widget = new LogWidget()
        MessageLoop.sendMessage(widget, Widget.Msg.CloseRequest)
        expect(widget.methods).to.contain("notifyLayout")
      })
    })
    describe("#onResize()", () => {
      it("should be invoked when the widget is resized", () => {
        const widget = new LogWidget()
        Widget.attach(widget, document.body)
        MessageLoop.sendMessage(widget, Widget.ResizeMessage.UnknownSize)
        expect(widget.messages).to.contain("resize")
        expect(widget.methods).to.contain("onResize")
        widget.dispose()
      })
      it("should notify the layout", () => {
        const widget = new LogWidget()
        Widget.attach(widget, document.body)
        MessageLoop.sendMessage(widget, Widget.ResizeMessage.UnknownSize)
        expect(widget.methods).to.contain("notifyLayout")
        widget.dispose()
      })
    })
    describe("#onUpdateRequest()", () => {
      it("should be invoked when an update is requested", () => {
        const widget = new LogWidget()
        MessageLoop.sendMessage(widget, Widget.Msg.UpdateRequest)
        expect(widget.messages).to.contain("update-request")
        expect(widget.methods).to.contain("onUpdateRequest")
      })
      it("should notify the layout", () => {
        const widget = new LogWidget()
        MessageLoop.sendMessage(widget, Widget.Msg.UpdateRequest)
        expect(widget.methods).to.contain("notifyLayout")
      })
    })
    describe("#onAfterShow()", () => {
      it("should be invoked just after the widget is made visible", () => {
        const widget = new LogWidget()
        Widget.attach(widget, document.body)
        widget.hide()
        widget.show()
        expect(widget.messages).to.contain("after-show")
        expect(widget.methods).to.contain("onAfterShow")
        widget.dispose()
      })
      it("should set the `isVisible` flag", () => {
        const widget = new LogWidget()
        Widget.attach(widget, document.body)
        widget.hide()
        expect(widget.testFlag(Widget.Flag.IsVisible)).toEqual(false)
        widget.show()
        expect(widget.testFlag(Widget.Flag.IsVisible)).toEqual(true)
        widget.dispose()
      })
      it("should notify the layout", () => {
        const widget = new LogWidget()
        Widget.attach(widget, document.body)
        widget.hide()
        widget.show()
        expect(widget.methods).to.contain("notifyLayout")
        widget.dispose()
      })
    })
    describe("#onBeforeHide()", () => {
      it("should be invoked just before the widget is made not-visible", () => {
        const widget = new LogWidget()
        Widget.attach(widget, document.body)
        widget.hide()
        expect(widget.messages).to.contain("before-hide")
        expect(widget.methods).to.contain("onBeforeHide")
        widget.dispose()
      })
      it("should clear the `isVisible` flag", () => {
        const widget = new LogWidget()
        Widget.attach(widget, document.body)
        expect(widget.testFlag(Widget.Flag.IsVisible)).toEqual(true)
        widget.hide()
        expect(widget.testFlag(Widget.Flag.IsVisible)).toEqual(false)
        widget.dispose()
      })
      it("should notify the layout", () => {
        const widget = new LogWidget()
        Widget.attach(widget, document.body)
        widget.hide()
        expect(widget.methods).to.contain("notifyLayout")
        widget.dispose()
      })
    })
    describe("#onAfterAttach()", () => {
      it("should be invoked just after the widget is attached", () => {
        const widget = new LogWidget()
        Widget.attach(widget, document.body)
        expect(widget.messages).to.contain("after-attach")
        expect(widget.methods).to.contain("onAfterAttach")
        widget.dispose()
      })
      it("should set the visible flag if warranted", () => {
        const widget = new LogWidget()
        Widget.attach(widget, document.body)
        expect(widget.testFlag(Widget.Flag.IsVisible)).toEqual(true)
        Widget.detach(widget)
        widget.hide()
        Widget.attach(widget, document.body)
        expect(widget.testFlag(Widget.Flag.IsVisible)).toEqual(false)
        Widget.detach(widget)
        const child = new LogWidget()
        child.parent = widget
        widget.show()
        Widget.attach(widget, document.body)
        expect(widget.testFlag(Widget.Flag.IsVisible)).toEqual(true)
        Widget.detach(widget)
      })
      it("should notify the layout", () => {
        const widget = new LogWidget()
        Widget.attach(widget, document.body)
        expect(widget.methods).to.contain("notifyLayout")
        widget.dispose()
      })
    })
    describe("#onBeforeDetach()", () => {
      it("should be invoked just before the widget is detached", () => {
        const widget = new LogWidget()
        Widget.attach(widget, document.body)
        Widget.detach(widget)
        expect(widget.messages).to.contain("before-detach")
        expect(widget.methods).to.contain("onBeforeDetach")
      })
      it("should clear the `isVisible` and `isAttached` flags", () => {
        const widget = new LogWidget()
        Widget.attach(widget, document.body)
        expect(widget.testFlag(Widget.Flag.IsVisible)).toEqual(true)
        expect(widget.testFlag(Widget.Flag.IsAttached)).toEqual(true)
        Widget.detach(widget)
        expect(widget.testFlag(Widget.Flag.IsVisible)).toEqual(false)
        expect(widget.testFlag(Widget.Flag.IsAttached)).toEqual(false)
      })
      it("should notify the layout", () => {
        const widget = new LogWidget()
        Widget.attach(widget, document.body)
        Widget.detach(widget)
        expect(widget.methods).to.contain("notifyLayout")
      })
    })
    describe("#onChildAdded()", () => {
      it("should be invoked when a child is added", () => {
        const child = new Widget()
        const parent = new LogWidget()
        child.parent = parent
        expect(parent.methods).to.contain("onChildAdded")
      })
      it("should notify the layout", () => {
        const child = new Widget()
        const parent = new LogWidget()
        child.parent = parent
        expect(parent.methods).to.contain("notifyLayout")
      })
      context("`msg` parameter", () => {
        it("should be a `ChildMessage`", () => {
          const child = new Widget()
          const parent = new LogWidget()
          child.parent = parent
          expect(parent.raw[0]).to.be.an.instanceof(Widget.ChildMessage)
        })
        it("should have a `type` of `child-added`", () => {
          const child = new Widget()
          const parent = new LogWidget()
          child.parent = parent
          expect(parent.raw[0].type).toEqual("child-added")
        })
        it("should have the correct `child`", () => {
          const child = new Widget()
          const parent = new LogWidget()
          child.parent = parent
          expect((parent.raw[0] as Widget.ChildMessage).child).toEqual(child)
        })
      })
    })
    describe("#onChildRemoved()", () => {
      it("should be invoked when a child is removed", () => {
        const child = new Widget()
        const parent = new LogWidget()
        child.parent = parent
        child.parent = null
        expect(parent.methods).to.contain("onChildRemoved")
      })
      it("should notify the layout", () => {
        const child = new Widget()
        const parent = new LogWidget()
        child.parent = parent
        parent.methods = []
        child.parent = null
        expect(parent.methods).to.contain("notifyLayout")
      })
      context("`msg` parameter", () => {
        it("should be a `ChildMessage`", () => {
          const child = new Widget()
          const parent = new LogWidget()
          child.parent = parent
          parent.raw = []
          child.parent = null
          expect(parent.raw[0]).to.be.an.instanceof(Widget.ChildMessage)
        })
        it("should have a `type` of `child-removed`", () => {
          const child = new Widget()
          const parent = new LogWidget()
          child.parent = parent
          parent.raw = []
          child.parent = null
          expect((parent.raw[0] as Widget.ChildMessage).type).toEqual(
            "child-removed"
          )
        })
        it("should have the correct `child`", () => {
          const child = new Widget()
          const parent = new LogWidget()
          child.parent = parent
          parent.raw = []
          child.parent = null
          expect((parent.raw[0] as Widget.ChildMessage).child).toEqual(child)
        })
      })
    })
    describe(".ChildMessage", () => {
      describe("#constructor()", () => {
        it("should accept the message type and child widget", () => {
          const msg = new Widget.ChildMessage("test", new Widget())
          expect(msg).to.be.an.instanceof(Widget.ChildMessage)
        })
      })
      describe("#child", () => {
        it("should be the child passed to the constructor", () => {
          const widget = new Widget()
          const msg = new Widget.ChildMessage("test", widget)
          expect(msg.child).toEqual(widget)
        })
      })
    })
    describe(".ResizeMessage", () => {
      describe("#constructor()", () => {
        it("should accept a width and height", () => {
          const msg = new Widget.ResizeMessage(100, 100)
          expect(msg).to.be.an.instanceof(Widget.ResizeMessage)
        })
      })
      describe("#width", () => {
        it("should be the width passed to the constructor", () => {
          const msg = new Widget.ResizeMessage(100, 200)
          expect(msg.width).toEqual(100)
        })
      })
      describe("#height", () => {
        it("should be the height passed to the constructor", () => {
          const msg = new Widget.ResizeMessage(100, 200)
          expect(msg.height).toEqual(200)
        })
      })
      describe(".UnknownSize", () => {
        it("should be a `ResizeMessage`", () => {
          const msg = Widget.ResizeMessage.UnknownSize
          expect(msg).to.be.an.instanceof(Widget.ResizeMessage)
        })
        it("should have a `width` of `-1`", () => {
          const msg = Widget.ResizeMessage.UnknownSize
          expect(msg.width).toEqual(-1)
        })
        it("should have a `height` of `-1`", () => {
          const msg = Widget.ResizeMessage.UnknownSize
          expect(msg.height).toEqual(-1)
        })
      })
    })
    describe(".attach()", () => {
      it("should attach a root widget to a host", () => {
        const widget = new Widget()
        expect(widget.isAttached).toEqual(false)
        Widget.attach(widget, document.body)
        expect(widget.isAttached).toEqual(true)
        widget.dispose()
      })
      it("should throw if the widget is not a root", () => {
        const parent = new Widget()
        const child = new Widget()
        child.parent = parent
        expect(() => {
          Widget.attach(child, document.body)
        }).to.throw(Error)
      })
      it("should throw if the widget is already attached", () => {
        const widget = new Widget()
        Widget.attach(widget, document.body)
        expect(() => {
          Widget.attach(widget, document.body)
        }).to.throw(Error)
        widget.dispose()
      })
      it("should throw if the host is not attached to the DOM", () => {
        const widget = new Widget()
        const host = document.createElement("div")
        expect(() => {
          Widget.attach(widget, host)
        }).to.throw(Error)
      })
      it("should dispatch an `after-attach` message", () => {
        const widget = new LogWidget()
        expect(widget.isAttached).toEqual(false)
        expect(widget.messages).to.not.contain("after-attach")
        Widget.attach(widget, document.body)
        expect(widget.isAttached).toEqual(true)
        expect(widget.messages).to.contain("after-attach")
        widget.dispose()
      })
    })
    describe(".detach()", () => {
      it("should detach a root widget from its host", () => {
        const widget = new Widget()
        Widget.attach(widget, document.body)
        expect(widget.isAttached).toEqual(true)
        Widget.detach(widget)
        expect(widget.isAttached).toEqual(false)
        widget.dispose()
      })
      it("should throw if the widget is not a root", () => {
        const parent = new Widget()
        const child = new Widget()
        child.parent = parent
        Widget.attach(parent, document.body)
        expect(() => {
          Widget.detach(child)
        }).to.throw(Error)
        parent.dispose()
      })
      it("should throw if the widget is not attached", () => {
        const widget = new Widget()
        expect(() => {
          Widget.detach(widget)
        }).to.throw(Error)
      })
      it("should dispatch a `before-detach` message", () => {
        const widget = new LogWidget()
        Widget.attach(widget, document.body)
        widget.messages = []
        Widget.detach(widget)
        expect(widget.messages).to.contain("before-detach")
        widget.dispose()
      })
    })
  })
})
