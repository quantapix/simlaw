import { MimeData } from "../../src/lumino/utils.js"
import { Drag } from "../../src/lumino/dragdrop.js"
import "../../src/lumino/dragdrop/style/index.css"
class DropTarget {
  node = document.createElement("div")
  events: string[] = []
  constructor() {
    this.node.style.minWidth = "100px"
    this.node.style.minHeight = "100px"
    this.node.addEventListener("lm-dragenter", this)
    this.node.addEventListener("lm-dragover", this)
    this.node.addEventListener("lm-dragleave", this)
    this.node.addEventListener("lm-drop", this)
    document.body.appendChild(this.node)
  }
  dispose(): void {
    document.body.removeChild(this.node)
    this.node.removeEventListener("lm-dragenter", this)
    this.node.removeEventListener("lm-dragover", this)
    this.node.removeEventListener("lm-dragleave", this)
    this.node.removeEventListener("lm-drop", this)
  }
  handleEvent(event: Event): void {
    this.events.push(event.type)
    switch (event.type) {
      case "lm-dragenter":
        this._evtDragEnter(event as Drag.Event)
        break
      case "lm-dragleave":
        this._evtDragLeave(event as Drag.Event)
        break
      case "lm-dragover":
        this._evtDragOver(event as Drag.Event)
        break
      case "lm-drop":
        this._evtDrop(event as Drag.Event)
        break
    }
  }
  private _evtDragEnter(event: Drag.Event): void {
    event.preventDefault()
    event.stopPropagation()
  }
  private _evtDragLeave(event: Drag.Event): void {
    event.preventDefault()
    event.stopPropagation()
  }
  private _evtDragOver(event: Drag.Event): void {
    event.preventDefault()
    event.stopPropagation()
    event.dropAction = event.proposedAction
  }
  private _evtDrop(event: Drag.Event): void {
    event.preventDefault()
    event.stopPropagation()
    if (event.proposedAction === "none") {
      event.dropAction = "none"
      return
    }
    event.dropAction = event.proposedAction
  }
}
describe("../../src/lumino/dragdrop", () => {
  describe("Drag", () => {
    describe("#constructor()", () => {
      it("should accept an options object", () => {
        const drag = new Drag({ mimeData: new MimeData() })
        expect(drag).to.be.an.instanceof(Drag)
      })
      it("should accept optional options", () => {
        const dragImage = document.createElement("i")
        const source = {}
        const mimeData = new MimeData()
        const drag = new Drag({
          mimeData,
          dragImage,
          proposedAction: "copy",
          supportedActions: "copy-link",
          source,
        })
        expect(drag).to.be.an.instanceof(Drag)
        expect(drag.mimeData).toEqual(mimeData)
        expect(drag.dragImage).toEqual(dragImage)
        expect(drag.proposedAction).toEqual("copy")
        expect(drag.supportedActions).toEqual("copy-link")
        expect(drag.source).toEqual(source)
      })
    })
    describe("#dispose()", () => {
      it("should dispose of the resources held by the drag object", () => {
        const drag = new Drag({ mimeData: new MimeData() })
        drag.dispose()
        expect(drag.isDisposed).toEqual(true)
      })
      it("should cancel the drag operation if it is active", done => {
        const drag = new Drag({ mimeData: new MimeData() })
        drag.start(0, 0).then(action => {
          expect(action).toEqual("none")
          done()
        })
        drag.dispose()
      })
      it("should be a no-op if already disposed", () => {
        const drag = new Drag({ mimeData: new MimeData() })
        drag.dispose()
        drag.dispose()
        expect(drag.isDisposed).toEqual(true)
      })
    })
    describe("#isDisposed()", () => {
      it("should test whether the drag object is disposed", () => {
        const drag = new Drag({ mimeData: new MimeData() })
        expect(drag.isDisposed).toEqual(false)
        drag.dispose()
        expect(drag.isDisposed).toEqual(true)
      })
    })
    describe("#mimeData", () => {
      it("should get the mime data for the drag object", () => {
        const mimeData = new MimeData()
        const drag = new Drag({ mimeData })
        expect(drag.mimeData).toEqual(mimeData)
      })
    })
    describe("#dragImage", () => {
      it("should get the drag image element for the drag object", () => {
        const dragImage = document.createElement("i")
        const drag = new Drag({ mimeData: new MimeData(), dragImage })
        expect(drag.dragImage).toEqual(dragImage)
      })
      it("should default to `null`", () => {
        const drag = new Drag({ mimeData: new MimeData() })
        expect(drag.dragImage).toEqual(null)
      })
    })
    describe("#proposedAction", () => {
      it("should get the proposed drop action for the drag object", () => {
        const drag = new Drag({
          mimeData: new MimeData(),
          proposedAction: "link",
        })
        expect(drag.proposedAction).toEqual("link")
      })
      it("should default to `'copy'`", () => {
        const drag = new Drag({ mimeData: new MimeData() })
        expect(drag.proposedAction).toEqual("copy")
      })
    })
    describe("#supportedActions", () => {
      it("should get the supported drop actions for the drag object", () => {
        const drag = new Drag({
          mimeData: new MimeData(),
          supportedActions: "copy-move",
        })
        expect(drag.supportedActions).toEqual("copy-move")
      })
      it("should default to `'all'`", () => {
        const drag = new Drag({ mimeData: new MimeData() })
        expect(drag.supportedActions).toEqual("all")
      })
    })
    describe("#source", () => {
      it("should get the drag source for the drag object", () => {
        const source = {}
        const drag = new Drag({ mimeData: new MimeData(), source })
        expect(drag.source).toEqual(source)
      })
      it("should default to `null`", () => {
        const drag = new Drag({ mimeData: new MimeData() })
        expect(drag.source).toEqual(null)
      })
    })
    describe("#start()", () => {
      it("should start the drag operation at the specified client position", () => {
        const dragImage = document.createElement("span")
        dragImage.style.minHeight = "10px"
        dragImage.style.minWidth = "10px"
        const drag = new Drag({ mimeData: new MimeData(), dragImage })
        drag.start(10, 20)
        expect(dragImage.style.top).toEqual("20px")
        expect(dragImage.style.left).toEqual("10px")
        drag.dispose()
      })
      it("should return a previous promise if a drag has already been started", () => {
        const drag = new Drag({ mimeData: new MimeData() })
        const promise = drag.start(0, 0)
        expect(drag.start(10, 10)).toEqual(promise)
        drag.dispose()
      })
      it("should resolve to `'none'` if the drag operation has been disposed", done => {
        const drag = new Drag({ mimeData: new MimeData() })
        drag.start(0, 0).then(action => {
          expect(action).toEqual("none")
          done()
        })
        drag.dispose()
      })
    })
    context("Event Handling", () => {
      let drag: Drag = null!
      let child0: DropTarget = null!
      let child1: DropTarget = null!
      beforeEach(() => {
        child0 = new DropTarget()
        child1 = new DropTarget()
        const dragImage = document.createElement("div")
        dragImage.style.minHeight = "10px"
        dragImage.style.minWidth = "10px"
        drag = new Drag({ mimeData: new MimeData(), dragImage })
        drag.start(0, 0)
      })
      afterEach(() => {
        drag.dispose()
        child0.dispose()
        child1.dispose()
      })
      describe("pointermove", () => {
        it("should be prevented during a drag event", () => {
          const event = new PointerEvent("pointermove", { cancelable: true })
          const canceled = !document.body.dispatchEvent(event)
          expect(canceled).toEqual(true)
        })
        it("should dispatch an enter and leave events", () => {
          let rect = child0.node.getBoundingClientRect()
          child0.node.dispatchEvent(
            new PointerEvent("pointermove", {
              clientX: rect.left + 1,
              clientY: rect.top + 1,
            })
          )
          expect(child0.events).to.contain("lm-dragenter")
          child0.events = []
          rect = child1.node.getBoundingClientRect()
          child1.node.dispatchEvent(
            new PointerEvent("pointermove", {
              clientX: rect.left + 1,
              clientY: rect.top + 1,
            })
          )
          expect(child0.events).to.contain("lm-dragleave")
          expect(child1.events).to.contain("lm-dragenter")
        })
        it("should dispatch drag over event", () => {
          const rect = child0.node.getBoundingClientRect()
          child0.node.dispatchEvent(
            new PointerEvent("pointermove", {
              clientX: rect.left + 1,
              clientY: rect.top + 1,
            })
          )
          expect(child0.events).to.contain("lm-dragover")
        })
        it("should move the drag image to the client location", () => {
          const rect = child0.node.getBoundingClientRect()
          child0.node.dispatchEvent(
            new PointerEvent("pointermove", {
              clientX: rect.left + 1,
              clientY: rect.top + 1,
            })
          )
          const image = drag.dragImage!
          expect(image.style.top).toEqual(`${rect.top + 1}px`)
          expect(image.style.left).toEqual(`${rect.left + 1}px`)
        })
      })
      describe("pointerup", () => {
        it("should be prevented during a drag event", () => {
          const event = new PointerEvent("pointerup", { cancelable: true })
          const canceled = !document.body.dispatchEvent(event)
          expect(canceled).toEqual(true)
        })
        it("should do nothing if the left button is not released", () => {
          const rect = child0.node.getBoundingClientRect()
          child0.node.dispatchEvent(
            new PointerEvent("pointerup", {
              clientX: rect.left + 1,
              clientY: rect.top + 1,
              button: 1,
            })
          )
          expect(child0.events).to.not.contain("lm-dragenter")
        })
        it("should dispatch enter and leave events", () => {
          let rect = child0.node.getBoundingClientRect()
          child0.node.dispatchEvent(
            new PointerEvent("pointermove", {
              clientX: rect.left + 1,
              clientY: rect.top + 1,
            })
          )
          expect(child0.events).to.contain("lm-dragenter")
          child0.events = []
          rect = child1.node.getBoundingClientRect()
          child1.node.dispatchEvent(
            new PointerEvent("pointerup", {
              clientX: rect.left + 1,
              clientY: rect.top + 1,
            })
          )
          expect(child0.events).to.contain("lm-dragleave")
          expect(child1.events).to.contain("lm-dragenter")
        })
        it("should dispatch a leave event if the last drop action was `'none'", () => {
          drag.dispose()
          drag = new Drag({
            mimeData: new MimeData(),
            supportedActions: "none",
          })
          drag.start(0, 0)
          const rect = child0.node.getBoundingClientRect()
          child0.node.dispatchEvent(
            new PointerEvent("pointerup", {
              clientX: rect.left + 1,
              clientY: rect.top + 1,
            })
          )
          expect(child0.events).to.contain("lm-dragleave")
        })
        it("should finalize the drag with `'none' if the last drop action was `'none`", done => {
          drag.dispose()
          drag = new Drag({
            mimeData: new MimeData(),
            supportedActions: "none",
          })
          drag.start(0, 0).then(action => {
            expect(action).toEqual("none")
            done()
          })
          const rect = child0.node.getBoundingClientRect()
          child0.node.dispatchEvent(
            new PointerEvent("pointerup", {
              clientX: rect.left + 1,
              clientY: rect.top + 1,
            })
          )
        })
        it("should dispatch the drop event at the current target", () => {
          const rect = child0.node.getBoundingClientRect()
          child0.node.dispatchEvent(
            new PointerEvent("pointerup", {
              clientX: rect.left + 1,
              clientY: rect.top + 1,
            })
          )
          expect(child0.events).to.contain("lm-drop")
        })
        it("should resolve with the drop action", done => {
          drag.dispose()
          drag = new Drag({
            mimeData: new MimeData(),
            proposedAction: "link",
            supportedActions: "link",
          })
          drag.start(0, 0).then(action => {
            expect(action).toEqual("link")
            done()
          })
          const rect = child0.node.getBoundingClientRect()
          child0.node.dispatchEvent(
            new PointerEvent("pointerup", {
              clientX: rect.left + 1,
              clientY: rect.top + 1,
            })
          )
        })
        it("should handle a `move` action", done => {
          drag.dispose()
          drag = new Drag({
            mimeData: new MimeData(),
            proposedAction: "move",
            supportedActions: "copy-move",
          })
          drag.start(0, 0).then(action => {
            expect(action).toEqual("move")
            done()
          })
          const rect = child0.node.getBoundingClientRect()
          child0.node.dispatchEvent(
            new PointerEvent("pointerup", {
              clientX: rect.left + 1,
              clientY: rect.top + 1,
            })
          )
        })
        it("should dispose of the drop", () => {
          const rect = child0.node.getBoundingClientRect()
          child0.node.dispatchEvent(
            new PointerEvent("pointerup", {
              clientX: rect.left + 1,
              clientY: rect.top + 1,
            })
          )
          expect(drag.isDisposed).toEqual(true)
        })
        it("should detach the drag image", () => {
          const image = drag.dragImage!
          const rect = child0.node.getBoundingClientRect()
          child0.node.dispatchEvent(
            new PointerEvent("pointerup", {
              clientX: rect.left + 1,
              clientY: rect.top + 1,
            })
          )
          expect(document.body.contains(image)).toEqual(false)
        })
        it("should remove event listeners", () => {
          const rect = child0.node.getBoundingClientRect()
          child0.node.dispatchEvent(
            new PointerEvent("pointerup", {
              clientX: rect.left + 1,
              clientY: rect.top + 1,
            })
          )
          ;["pointermove", "keydown", "contextmenu"].forEach(name => {
            const event = new Event(name, { cancelable: true })
            const canceled = !document.body.dispatchEvent(event)
            expect(canceled).toEqual(false)
          })
        })
      })
      describe("keydown", () => {
        it("should be prevented during a drag event", () => {
          const event = new KeyboardEvent("keydown", { cancelable: true })
          const canceled = !document.body.dispatchEvent(event)
          expect(canceled).toEqual(true)
        })
        it("should dispose of the drag if `Escape` is pressed", () => {
          const event = new KeyboardEvent("keydown", {
            cancelable: true,
            keyCode: 27,
          })
          document.body.dispatchEvent(event)
          expect(drag.isDisposed).toEqual(true)
        })
      })
      describe("pointerenter", () => {
        it("should be prevented during a drag event", () => {
          const event = new PointerEvent("pointerenter", { cancelable: true })
          const canceled = !document.body.dispatchEvent(event)
          expect(canceled).toEqual(true)
        })
      })
      describe("pointerleave", () => {
        it("should be prevented during a drag event", () => {
          const event = new PointerEvent("pointerleave", { cancelable: true })
          const canceled = !document.body.dispatchEvent(event)
          expect(canceled).toEqual(true)
        })
      })
      describe("pointerover", () => {
        it("should be prevented during a drag event", () => {
          const event = new PointerEvent("pointerover", { cancelable: true })
          const canceled = !document.body.dispatchEvent(event)
          expect(canceled).toEqual(true)
        })
      })
      describe("pointerout", () => {
        it("should be prevented during a drag event", () => {
          const event = new PointerEvent("pointerout", { cancelable: true })
          const canceled = !document.body.dispatchEvent(event)
          expect(canceled).toEqual(true)
        })
      })
      describe("keyup", () => {
        it("should be prevented during a drag event", () => {
          const event = new KeyboardEvent("keyup", { cancelable: true })
          const canceled = !document.body.dispatchEvent(event)
          expect(canceled).toEqual(true)
        })
      })
      describe("keypress", () => {
        it("should be prevented during a drag event", () => {
          const event = new KeyboardEvent("keypress", { cancelable: true })
          const canceled = !document.body.dispatchEvent(event)
          expect(canceled).toEqual(true)
        })
      })
      describe("contextmenu", () => {
        it("should be prevented during a drag event", () => {
          const event = new MouseEvent("contextmenu", { cancelable: true })
          const canceled = !document.body.dispatchEvent(event)
          expect(canceled).toEqual(true)
        })
      })
    })
    describe(".overrideCursor()", () => {
      it("should update the body `cursor` style", () => {
        expect(document.body.style.cursor).toEqual("")
        const override = Drag.overrideCursor("wait")
        expect(document.body.style.cursor).toEqual("wait")
        override.dispose()
      })
      it("should add the `lm-mod-override-cursor` class to the body", () => {
        expect(
          document.body.classList.contains("lm-mod-override-cursor")
        ).toEqual(false)
        const override = Drag.overrideCursor("wait")
        expect(
          document.body.classList.contains("lm-mod-override-cursor")
        ).toEqual(true)
        override.dispose()
      })
      it("should clear the override when disposed", () => {
        expect(document.body.style.cursor).toEqual("")
        const override = Drag.overrideCursor("wait")
        expect(document.body.style.cursor).toEqual("wait")
        override.dispose()
        expect(document.body.style.cursor).toEqual("")
      })
      it("should remove the `lm-mod-override-cursor` class when disposed", () => {
        expect(
          document.body.classList.contains("lm-mod-override-cursor")
        ).toEqual(false)
        const override = Drag.overrideCursor("wait")
        expect(
          document.body.classList.contains("lm-mod-override-cursor")
        ).toEqual(true)
        override.dispose()
        expect(
          document.body.classList.contains("lm-mod-override-cursor")
        ).toEqual(false)
      })
      it("should respect the most recent override", () => {
        expect(document.body.style.cursor).toEqual("")
        expect(
          document.body.classList.contains("lm-mod-override-cursor")
        ).toEqual(false)
        const one = Drag.overrideCursor("wait")
        expect(document.body.style.cursor).toEqual("wait")
        expect(
          document.body.classList.contains("lm-mod-override-cursor")
        ).toEqual(true)
        const two = Drag.overrideCursor("default")
        expect(document.body.style.cursor).toEqual("default")
        expect(
          document.body.classList.contains("lm-mod-override-cursor")
        ).toEqual(true)
        const three = Drag.overrideCursor("cell")
        expect(document.body.style.cursor).toEqual("cell")
        expect(
          document.body.classList.contains("lm-mod-override-cursor")
        ).toEqual(true)
        two.dispose()
        expect(document.body.style.cursor).toEqual("cell")
        expect(
          document.body.classList.contains("lm-mod-override-cursor")
        ).toEqual(true)
        one.dispose()
        expect(document.body.style.cursor).toEqual("cell")
        expect(
          document.body.classList.contains("lm-mod-override-cursor")
        ).toEqual(true)
        three.dispose()
        expect(document.body.style.cursor).toEqual("")
        expect(
          document.body.classList.contains("lm-mod-override-cursor")
        ).toEqual(false)
      })
      it("should override the computed cursor for a node", () => {
        const div = document.createElement("div")
        div.style.cursor = "cell"
        document.body.appendChild(div)
        expect(window.getComputedStyle(div).cursor).toEqual("cell")
        const override = Drag.overrideCursor("wait")
        expect(window.getComputedStyle(div).cursor).toEqual("wait")
        override.dispose()
        expect(window.getComputedStyle(div).cursor).toEqual("cell")
        document.body.removeChild(div)
      })
    })
  })
})
