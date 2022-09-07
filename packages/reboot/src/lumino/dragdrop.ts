/* eslint-disable @typescript-eslint/no-namespace */
import type { MimeData } from "./utils.js"
import { DisposableDelegate, IDisposable } from "./disposable.js"

export interface IDragEvent extends Drag.Event {}
export class Drag implements IDisposable {
  constructor(options: Drag.IOptions) {
    this.document = options.document || document
    this.mimeData = options.mimeData
    this.dragImage = options.dragImage || null
    this.proposedAction = options.proposedAction || "copy"
    this.supportedActions = options.supportedActions || "all"
    this.source = options.source || null
  }
  dispose(): void {
    if (this._disposed) {
      return
    }
    this._disposed = true
    if (this._currentTarget) {
      let event = new PointerEvent("pointerup", {
        bubbles: true,
        cancelable: true,
        clientX: -1,
        clientY: -1,
      })
      Private.dispatchDragLeave(this, this._currentTarget, null, event)
    }
    this._finalize("none")
  }
  readonly mimeData: MimeData
  readonly document: Document | ShadowRoot
  readonly dragImage: HTMLElement | null
  readonly proposedAction: Drag.DropAction
  readonly supportedActions: Drag.SupportedActions
  readonly source: any
  get isDisposed(): boolean {
    return this._disposed
  }
  start(clientX: number, clientY: number): Promise<Drag.DropAction> {
    if (this._disposed) {
      return Promise.resolve("none")
    }
    if (this._promise) {
      return this._promise
    }
    this._addListeners()
    this._attachDragImage(clientX, clientY)
    this._promise = new Promise<Drag.DropAction>(resolve => {
      this._resolve = resolve
    })
    let event = new PointerEvent("pointermove", {
      bubbles: true,
      cancelable: true,
      clientX,
      clientY,
    })
    document.dispatchEvent(event)
    return this._promise
  }
  handleEvent(event: Event): void {
    switch (event.type) {
      case "pointermove":
        this._evtPointerMove(event as PointerEvent)
        break
      case "pointerup":
        this._evtPointerUp(event as PointerEvent)
        break
      case "keydown":
        this._evtKeyDown(event as KeyboardEvent)
        break
      default:
        event.preventDefault()
        event.stopPropagation()
        break
    }
  }
  protected moveDragImage(clientX: number, clientY: number): void {
    if (!this.dragImage) {
      return
    }
    let style = this.dragImage.style
    style.top = `${clientY}px`
    style.left = `${clientX}px`
  }
  private _evtPointerMove(event: PointerEvent): void {
    event.preventDefault()
    event.stopPropagation()
    this._updateCurrentTarget(event)
    this._updateDragScroll(event)
    this.moveDragImage(event.clientX, event.clientY)
  }
  private _evtPointerUp(event: PointerEvent): void {
    event.preventDefault()
    event.stopPropagation()
    if (event.button !== 0) {
      return
    }
    this._updateCurrentTarget(event)
    if (!this._currentTarget) {
      this._finalize("none")
      return
    }
    if (this._dropAction === "none") {
      Private.dispatchDragLeave(this, this._currentTarget, null, event)
      this._finalize("none")
      return
    }
    let action = Private.dispatchDrop(this, this._currentTarget, event)
    this._finalize(action)
  }
  private _evtKeyDown(event: KeyboardEvent): void {
    event.preventDefault()
    event.stopPropagation()
    if (event.keyCode === 27) {
      this.dispose()
    }
  }
  private _addListeners(): void {
    document.addEventListener("pointerdown", this, true)
    document.addEventListener("pointermove", this, true)
    document.addEventListener("pointerup", this, true)
    document.addEventListener("pointerenter", this, true)
    document.addEventListener("pointerleave", this, true)
    document.addEventListener("pointerover", this, true)
    document.addEventListener("pointerout", this, true)
    document.addEventListener("keydown", this, true)
    document.addEventListener("keyup", this, true)
    document.addEventListener("keypress", this, true)
    document.addEventListener("contextmenu", this, true)
  }
  private _removeListeners(): void {
    document.removeEventListener("pointerdown", this, true)
    document.removeEventListener("pointermove", this, true)
    document.removeEventListener("pointerup", this, true)
    document.removeEventListener("pointerenter", this, true)
    document.removeEventListener("pointerleave", this, true)
    document.removeEventListener("pointerover", this, true)
    document.removeEventListener("pointerout", this, true)
    document.removeEventListener("keydown", this, true)
    document.removeEventListener("keyup", this, true)
    document.removeEventListener("keypress", this, true)
    document.removeEventListener("contextmenu", this, true)
  }
  private _updateDragScroll(event: PointerEvent): void {
    let target = Private.findScrollTarget(event)
    if (!this._scrollTarget && !target) {
      return
    }
    if (!this._scrollTarget) {
      setTimeout(this._onScrollFrame, 500)
    }
    this._scrollTarget = target
  }
  private _updateCurrentTarget(event: PointerEvent): void {
    let prevTarget = this._currentTarget
    let currTarget = this._currentTarget
    let prevElem = this._currentElement
    let currElem = this.document.elementFromPoint(event.clientX, event.clientY)
    this._currentElement = currElem
    if (currElem !== prevElem && currElem !== currTarget) {
      Private.dispatchDragExit(this, currTarget, currElem, event)
    }
    if (currElem !== prevElem && currElem !== currTarget) {
      currTarget = Private.dispatchDragEnter(this, currElem, currTarget, event)
    }
    if (currTarget !== prevTarget) {
      this._currentTarget = currTarget
      Private.dispatchDragLeave(this, prevTarget, currTarget, event)
    }
    let action = Private.dispatchDragOver(this, currTarget, event)
    this._setDropAction(action)
  }
  private _attachDragImage(clientX: number, clientY: number): void {
    if (!this.dragImage) {
      return
    }
    this.dragImage.classList.add("lm-mod-drag-image")
    let style = this.dragImage.style
    style.pointerEvents = "none"
    style.position = "fixed"
    style.top = `${clientY}px`
    style.left = `${clientX}px`
    const body =
      this.document instanceof Document
        ? this.document.body
        : (this.document.firstElementChild as HTMLElement)
    body.appendChild(this.dragImage)
  }
  private _detachDragImage(): void {
    if (!this.dragImage) {
      return
    }
    let parent = this.dragImage.parentNode
    if (!parent) {
      return
    }
    parent.removeChild(this.dragImage)
  }
  private _setDropAction(action: Drag.DropAction): void {
    action = Private.validateAction(action, this.supportedActions)
    if (this._override && this._dropAction === action) {
      return
    }
    switch (action) {
      case "none":
        this._dropAction = action
        this._override = Drag.overrideCursor("no-drop", this.document)
        break
      case "copy":
        this._dropAction = action
        this._override = Drag.overrideCursor("copy", this.document)
        break
      case "link":
        this._dropAction = action
        this._override = Drag.overrideCursor("alias", this.document)
        break
      case "move":
        this._dropAction = action
        this._override = Drag.overrideCursor("move", this.document)
        break
    }
  }
  private _finalize(action: Drag.DropAction): void {
    let resolve = this._resolve
    this._removeListeners()
    this._detachDragImage()
    if (this._override) {
      this._override.dispose()
      this._override = null
    }
    this.mimeData.clear()
    this._disposed = true
    this._dropAction = "none"
    this._currentTarget = null
    this._currentElement = null
    this._scrollTarget = null
    this._promise = null
    this._resolve = null
    if (resolve) {
      resolve(action)
    }
  }
  private _onScrollFrame = () => {
    if (!this._scrollTarget) {
      return
    }
    let { element, edge, distance } = this._scrollTarget
    let d = Private.SCROLL_EDGE_SIZE - distance
    let f = Math.pow(d / Private.SCROLL_EDGE_SIZE, 2)
    let s = Math.max(1, Math.round(f * Private.SCROLL_EDGE_SIZE))
    switch (edge) {
      case "top":
        element.scrollTop -= s
        break
      case "left":
        element.scrollLeft -= s
        break
      case "right":
        element.scrollLeft += s
        break
      case "bottom":
        element.scrollTop += s
        break
    }
    requestAnimationFrame(this._onScrollFrame)
  }
  private _disposed = false
  private _dropAction: Drag.DropAction = "none"
  private _override: IDisposable | null = null
  private _currentTarget: Element | null = null
  private _currentElement: Element | null = null
  private _promise: Promise<Drag.DropAction> | null = null
  private _scrollTarget: Private.IScrollTarget | null = null
  private _resolve: ((value: Drag.DropAction) => void) | null = null
}
export namespace Drag {
  export type DropAction = "none" | "copy" | "link" | "move"
  export type SupportedActions =
    | DropAction
    | "copy-link"
    | "copy-move"
    | "link-move"
    | "all"
  export interface IOptions {
    document?: Document | ShadowRoot
    mimeData: MimeData
    dragImage?: HTMLElement
    proposedAction?: DropAction
    supportedActions?: SupportedActions
    source?: any
  }
  export class Event extends DragEvent {
    constructor(event: PointerEvent, options: Event.IOptions) {
      super(options.type, {
        bubbles: true,
        cancelable: true,
        altKey: event.altKey,
        button: event.button,
        clientX: event.clientX,
        clientY: event.clientY,
        ctrlKey: event.ctrlKey,
        detail: 0,
        metaKey: event.metaKey,
        relatedTarget: options.related,
        screenX: event.screenX,
        screenY: event.screenY,
        shiftKey: event.shiftKey,
        view: window,
      })
      const { drag } = options
      this.dropAction = "none"
      this.mimeData = drag.mimeData
      this.proposedAction = drag.proposedAction
      this.supportedActions = drag.supportedActions
      this.source = drag.source
    }
    dropAction: DropAction
    readonly proposedAction: DropAction
    readonly supportedActions: SupportedActions
    readonly mimeData: MimeData
    readonly source: any
  }
  export namespace Event {
    export interface IOptions {
      drag: Drag
      related: Element | null
      type:
        | "lm-dragenter"
        | "lm-dragexit"
        | "lm-dragleave"
        | "lm-dragover"
        | "lm-drop"
    }
  }
  export function overrideCursor(
    cursor: string,
    doc: Document | ShadowRoot = document
  ): IDisposable {
    let id = ++overrideCursorID
    const body =
      doc instanceof Document
        ? doc.body
        : (doc.firstElementChild as HTMLElement)
    body.style.cursor = cursor
    body.classList.add("lm-mod-override-cursor")
    return new DisposableDelegate(() => {
      if (id === overrideCursorID) {
        body.style.cursor = ""
        body.classList.remove("lm-mod-override-cursor")
      }
    })
  }
  let overrideCursorID = 0
}
namespace Private {
  export const SCROLL_EDGE_SIZE = 20
  export function validateAction(
    action: Drag.DropAction,
    supported: Drag.SupportedActions
  ): Drag.DropAction {
    return actionTable[action] & supportedTable[supported] ? action : "none"
  }
  export interface IScrollTarget {
    element: Element
    edge: "top" | "left" | "right" | "bottom"
    distance: number
  }
  export function findScrollTarget(event: PointerEvent): IScrollTarget | null {
    let x = event.clientX
    let y = event.clientY
    let element: Element | null = document.elementFromPoint(x, y)
    for (; element; element = element!.parentElement) {
      if (!element.hasAttribute("data-lm-dragscroll")) {
        continue
      }
      let offsetX = 0
      let offsetY = 0
      if (element === document.body) {
        offsetX = window.pageXOffset
        offsetY = window.pageYOffset
      }
      let r = element.getBoundingClientRect()
      let top = r.top + offsetY
      let left = r.left + offsetX
      let right = left + r.width
      let bottom = top + r.height
      if (x < left || x >= right || y < top || y >= bottom) {
        continue
      }
      let dl = x - left + 1
      let dt = y - top + 1
      let dr = right - x
      let db = bottom - y
      let distance = Math.min(dl, dt, dr, db)
      if (distance > SCROLL_EDGE_SIZE) {
        continue
      }
      let edge: "top" | "left" | "right" | "bottom"
      switch (distance) {
        case db:
          edge = "bottom"
          break
        case dt:
          edge = "top"
          break
        case dr:
          edge = "right"
          break
        case dl:
          edge = "left"
          break
        default:
          throw "unreachable"
      }
      let dsw = element.scrollWidth - element.clientWidth
      let dsh = element.scrollHeight - element.clientHeight
      let shouldScroll: boolean
      switch (edge) {
        case "top":
          shouldScroll = dsh > 0 && element.scrollTop > 0
          break
        case "left":
          shouldScroll = dsw > 0 && element.scrollLeft > 0
          break
        case "right":
          shouldScroll = dsw > 0 && element.scrollLeft < dsw
          break
        case "bottom":
          shouldScroll = dsh > 0 && element.scrollTop < dsh
          break
        default:
          throw "unreachable"
      }
      if (!shouldScroll) {
        continue
      }
      return { element, edge, distance }
    }
    return null
  }
  export function dispatchDragEnter(
    drag: Drag,
    currElem: Element | null,
    currTarget: Element | null,
    event: PointerEvent
  ): Element | null {
    if (!currElem) {
      return null
    }
    let dragEvent = new Drag.Event(event, {
      drag,
      related: currTarget,
      type: "lm-dragenter",
    })
    let canceled = !currElem.dispatchEvent(dragEvent)
    if (canceled) {
      return currElem
    }
    const body =
      drag.document instanceof Document
        ? drag.document.body
        : (drag.document.firstElementChild as HTMLElement)
    if (currElem === body) {
      return currTarget
    }
    dragEvent = new Drag.Event(event, {
      drag,
      related: currTarget,
      type: "lm-dragenter",
    })
    body.dispatchEvent(dragEvent)
    return body
  }
  export function dispatchDragExit(
    drag: Drag,
    prevTarget: Element | null,
    currTarget: Element | null,
    event: PointerEvent
  ): void {
    if (!prevTarget) {
      return
    }
    let dragEvent = new Drag.Event(event, {
      drag,
      related: currTarget,
      type: "lm-dragexit",
    })
    prevTarget.dispatchEvent(dragEvent)
  }
  export function dispatchDragLeave(
    drag: Drag,
    prevTarget: Element | null,
    currTarget: Element | null,
    event: PointerEvent
  ): void {
    if (!prevTarget) {
      return
    }
    let dragEvent = new Drag.Event(event, {
      drag,
      related: currTarget,
      type: "lm-dragleave",
    })
    prevTarget.dispatchEvent(dragEvent)
  }
  export function dispatchDragOver(
    drag: Drag,
    currTarget: Element | null,
    event: PointerEvent
  ): Drag.DropAction {
    if (!currTarget) {
      return "none"
    }
    let dragEvent = new Drag.Event(event, {
      drag,
      related: null,
      type: "lm-dragover",
    })
    let canceled = !currTarget.dispatchEvent(dragEvent)
    if (canceled) {
      return dragEvent.dropAction
    }
    return "none"
  }
  export function dispatchDrop(
    drag: Drag,
    currTarget: Element | null,
    event: PointerEvent
  ): Drag.DropAction {
    if (!currTarget) {
      return "none"
    }
    let dragEvent = new Drag.Event(event, {
      drag,
      related: null,
      type: "lm-drop",
    })
    let canceled = !currTarget.dispatchEvent(dragEvent)
    if (canceled) {
      return dragEvent.dropAction
    }
    return "none"
  }
  const actionTable: { [key: string]: number } = {
    none: 0x0,
    copy: 0x1,
    link: 0x2,
    move: 0x4,
  }
  const supportedTable: { [key: string]: number } = {
    none: actionTable["none"],
    copy: actionTable["copy"],
    link: actionTable["link"],
    move: actionTable["move"],
    "copy-link": actionTable["copy"] | actionTable["link"],
    "copy-move": actionTable["copy"] | actionTable["move"],
    "link-move": actionTable["link"] | actionTable["move"],
    all: actionTable["copy"] | actionTable["link"] | actionTable["move"],
  }
}
